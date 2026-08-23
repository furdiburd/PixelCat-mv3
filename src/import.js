(function () {
  'use strict';

  const API      = typeof browser !== 'undefined' ? browser : chrome;
  const FairPlay = (typeof globalThis !== 'undefined' && globalThis.PixelCatFairPlay) || null;

  const fileInput  = document.getElementById('backupFile');
  const fileName   = document.getElementById('fileName');
  const importBtn  = document.getElementById('importBtn');
  const statusEl   = document.getElementById('status');
  const importCard = document.getElementById('importCard');
  let selectedFile = null;

  const IO_SECRET = 'pcx\u0021v1\u2665' + 'K9mQ\u03c0\u03b1T' + 'seal\u00b72026\u00a7xZ';

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.className   = isError ? 'err' : (msg ? 'ok' : '');
  }

  function storageSet(values) {
    if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1)
      return API.storage.local.set(values);
    return new Promise((res) => API.storage.local.set(values, res));
  }

  function storageClear() {
    if (typeof API.storage.local.clear === 'function' && API.storage.local.clear.length <= 0)
      return API.storage.local.clear();
    return new Promise((res) => API.storage.local.clear(res));
  }

  function sendRuntimeMessage(msg) {
    try {
      const r = API.runtime.sendMessage(msg);
      if (r && typeof r.then === 'function') return r;
    } catch (_) {}
    return new Promise((res, rej) => {
      API.runtime.sendMessage(msg, (response) => {
        if (API.runtime.lastError) rej(new Error(API.runtime.lastError.message));
        else res(response);
      });
    });
  }

  function readFileAsText(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload  = (e) => res(e.target.result);
      reader.onerror = () => rej(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async function getKey() {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      'raw', enc.encode(IO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign', 'verify']
    );
  }

  function stableStringify(val) {
    if (val === null || typeof val !== 'object') return JSON.stringify(val);
    if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(val).sort().map(
      (k) => JSON.stringify(k) + ':' + stableStringify(val[k])
    ).join(',') + '}';
  }

  function legacyStringify(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  async function signText(text) {
    const enc = new TextEncoder();
    const key = await getKey();
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(text));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function verifyBackup(dataObj, expectedHex) {
    const stableSig = await signText(stableStringify(dataObj));
    if (stableSig === expectedHex) return true;
    return (await signText(legacyStringify(dataObj))) === expectedHex;
  }

  async function restoreBackup(payload) {
    const data = payload.data;
    await storageClear();
    if (FairPlay && typeof FairPlay.commit === 'function')
      return FairPlay.commit(API.storage.local, data);
    await storageSet(data);
    return data;
  }

  async function importSelectedFile() {
    if (!selectedFile) return;
    importBtn.disabled = true;
    try {
      setStatus('Reading backup\u2026', false);
      const text    = await readFileAsText(selectedFile);
      const payload = JSON.parse(text);

      if (!payload || !payload._pixelcat || !payload.data || typeof payload.data !== 'object') {
        setStatus('Not a valid PixelCat backup.', true); return;
      }
      if (!payload._sig) {
        setStatus('Unsigned backup cannot be imported.', true); return;
      }

      setStatus('Verifying backup\u2026', false);
      if (!(await verifyBackup(payload.data, payload._sig))) {
        setStatus('Tampered file \u2014 import rejected.', true); return;
      }

      setStatus('Restoring\u2026', false);
      const restored = await restoreBackup(payload);
      await sendRuntimeMessage({ action: 'updateSettings', settings: restored }).catch(() => {});
      setStatus('Imported! Reopen PixelCat to see the restored data.', false);
    } catch (err) {
      setStatus('Import failed. The file could not be restored.', true);
    } finally {
      importBtn.disabled = !selectedFile;
    }
  }

  fileInput.addEventListener('change', () => {
    selectedFile = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    fileName.textContent = selectedFile ? selectedFile.name : (fileName.getAttribute('data-i18n') ? fileName.textContent : 'No file selected');
    importBtn.disabled   = !selectedFile;
    setStatus('', false);
  });

  if (importCard) {
    importCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      importCard.classList.add('drag-over');
    });
    importCard.addEventListener('dragleave', () => importCard.classList.remove('drag-over'));
    importCard.addEventListener('drop', (e) => {
      e.preventDefault();
      importCard.classList.remove('drag-over');
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        selectedFile = file;
        fileName.textContent = file.name;
        importBtn.disabled   = false;
        setStatus('', false);
      }
    });
  }

  importBtn.addEventListener('click', importSelectedFile);

})();
