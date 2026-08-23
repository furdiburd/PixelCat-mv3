const API = typeof browser !== "undefined" ? browser : chrome;
const CONTENT_URL_PATTERNS = ["<all_urls>"];

let activePetTabId = null;
let activePetWindowId = null;
const loadedRuntimeTabs = new Set();
const loadingRuntimeTabs = new Map();
const runtimeLoadGeneration = new Map();
const RUNTIME_FILES = [
  "src/quests.js",
  "src/fairplay.js",
  "src/cat-storage.js",
  "src/cat-coins.js",
  "src/cat-fish.js",
  "src/cat-balls.js",
  "src/cat-portals.js",
  "src/cat-speech.js",
  "src/content.js",
];

const ALLOWED_ACTIONS = new Set([
  "startCat",
  "stopCat",
  "startCompanion",
  "stopCompanion",
  "updateSettings",
  "clearSpeechMemory",
  "fetchOllamaModels",
  "askOllama",
  "transfer_pet_window",
  "get_active_pet_state",
  "load_owner_runtime",
]);

const ALLOWED_SETTINGS = {
  catEnabled: "boolean",
  companionEnabled: "boolean",
  loyalMode: "boolean",
  aggressiveMode: "boolean",
  wallClimbEnabled: "boolean",
  uiMischiefEnabled: "boolean",
  speechEnabled: "boolean",
  memoryEnabled: "boolean",
  rareEventsEnabled: "boolean",
  autoFishSpawnEnabled: "boolean",
  ballEnabled: "boolean",
  spiderEnabled: "boolean",
  lowPowerMode: "boolean",
  hideInFullscreen: "boolean",
  showOnAllTabs: "boolean",
  portalEnabled: "boolean",
  speedMultiplier: "number",
  sizeMultiplier: "number",
  uiMischiefRate: "number",
  catEnergyLevel: "string",
  uiLanguage: "string",
  catSkin: "string",
  foxSkin: "string",
  pigeonSkin: "string",
  activeBall: "string",
  activeHat: "string",
  activePet: "string",
  disabledSites: "string",
  siteFilterMode: "string",
  petName: "string",
  petSex: "string",
  shopOwned: "array",
  shopActiveBoosts: "array",
  disabledSitesList: "array",
  dragHandEnabled: "boolean",
  freePlayMode: "boolean",
  unlockAll: "boolean",
  ollamaEnabled: "boolean",
  ollamaUrl: "string",
  ollamaModel: "string",
  ollamaSystemPrompt: "string",
};

function isExtensionSender(sender) {
  const url = sender && sender.url;
  return typeof url === "string" && url.startsWith(API.runtime.getURL(""));
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings))
    return null;
  const clean = {};
  Object.keys(ALLOWED_SETTINGS).forEach((key) => {
    if (!(key in settings)) return;
    const expected = ALLOWED_SETTINGS[key];
    const value = settings[key];
    if (expected === "boolean") {
      if (typeof value === "boolean") clean[key] = value;
      return;
    }
    if (expected === "number") {
      if (key === "speedMultiplier" || key === "sizeMultiplier")
        clean[key] = clampNumber(value, 0.5, 2.5, 1.0);
      else if (key === "uiMischiefRate")
        clean[key] = Math.round(clampNumber(value, 0, 100, 11));
      return;
    }
    if (expected === "string") {
      if (typeof value === "string") clean[key] = value.slice(0, 500);
      return;
    }
    if (expected === "array") {
      if (Array.isArray(value)) {
        clean[key] = value.slice(0, 100);
      }
    }
  });
  return Object.keys(clean).length ? clean : null;
}

function queryTabs(queryInfo) {
  return new Promise((resolve, reject) => {
    API.tabs.query(queryInfo, (tabs) => {
      const err = API.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(tabs || []);
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    API.tabs.sendMessage(tabId, message, (response) => {
      const err = API.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

async function updateActivePetTab(newTabId, windowId = null) {
  try {
    const data = await new Promise((resolve) => API.storage.local.get({ showOnAllTabs: false, catEnabled: true }, resolve));
    if (!data.catEnabled || data.showOnAllTabs || !Number.isInteger(newTabId)) return;
    if (activePetTabId === newTabId && activePetWindowId === windowId) return;
    if (Number.isInteger(activePetTabId) && activePetTabId !== newTabId) {
      await sendMessageToTab(activePetTabId, { action: "deactivate_tab_pet" }).catch(() => {});
    }
    activePetTabId = newTabId;
    activePetWindowId = windowId;
    await new Promise((resolve) => API.storage.local.set({ activePetTabId: newTabId, activePetWindowId: windowId }, resolve));
    await injectOwnerRuntime(newTabId);
    await sendMessageToTab(newTabId, { action: "activate_tab_pet" }).catch(() => {});
  } catch (_) {}
}

API.tabs.onActivated.addListener((activeInfo) => {
  if (activeInfo && activeInfo.tabId) {
    updateActivePetTab(activeInfo.tabId, activeInfo.windowId);
  }
});

if (API.windows && API.windows.onFocusChanged) {
  API.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === API.windows.WINDOW_ID_NONE) return;
    queryTabs({ active: true, windowId: windowId })
      .then((tabs) => {
        if (tabs && tabs[0]) {
          updateActivePetTab(tabs[0].id, windowId);
        }
      })
      .catch(() => {});
  });
}

API.runtime.onStartup.addListener(() => {
  recoverExistingTabs();
});

API.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    API.storage.local.get({ dragHandDefaultResetApplied: false }, (data) => {
      if (!data.dragHandDefaultResetApplied) {
        API.storage.local.set({
          dragHandEnabled: false,
          dragHandDefaultResetApplied: true,
        });
      }
    });
  } else if (details.reason === "install") {
    API.storage.local.set({ dragHandDefaultResetApplied: true });
  }
  recoverExistingTabs();
});

async function recoverExistingTabs() {
  try {
    const tabs = await queryTabs({});
    await Promise.allSettled(
      tabs
        .filter((tab) => Number.isInteger(tab.id) && typeof tab.url === "string")
        .map((tab) => injectOwnerRuntime(tab.id))
    );
    const owner = await getActivePetOwner();
    if (owner.tabId !== null) await sendMessageToTab(owner.tabId, { action: "activate_tab_pet" }).catch(() => {});
  } catch (_) {}
}

function invalidateRuntimeTab(tabId) {
  loadedRuntimeTabs.delete(tabId);
  runtimeLoadGeneration.set(tabId, (runtimeLoadGeneration.get(tabId) || 0) + 1);
}

function injectOwnerRuntime(tabId) {
  if (!Number.isInteger(tabId)) return Promise.resolve(false);
  if (loadedRuntimeTabs.has(tabId)) return Promise.resolve(true);
  if (!API.scripting || typeof API.scripting.executeScript !== "function") return Promise.resolve(false);
  const pending = loadingRuntimeTabs.get(tabId);
  if (pending) return pending;
  const generation = runtimeLoadGeneration.get(tabId) || 0;
  const task = (async () => {
    try {
      if (typeof API.scripting.insertCSS === "function") {
        await API.scripting.insertCSS({ target: { tabId }, files: ["ui/styles.css"] });
      }
      await API.scripting.executeScript({ target: { tabId }, files: RUNTIME_FILES });
      if (runtimeLoadGeneration.get(tabId) !== generation) return false;
      loadedRuntimeTabs.add(tabId);
      return true;
    } catch (_) {
      return false;
    } finally {
      loadingRuntimeTabs.delete(tabId);
    }
  })();
  loadingRuntimeTabs.set(tabId, task);
  return task;
}

async function getActivePetOwner() {
  const stored = await new Promise((resolve) => API.storage.local.get({ activePetTabId: null, activePetWindowId: null }, resolve));
  if (Number.isInteger(stored.activePetTabId)) {
    try {
      const tab = await new Promise((resolve, reject) => {
        API.tabs.get(stored.activePetTabId, (result) => {
          const err = API.runtime.lastError;
          if (err) reject(new Error(err.message));
          else resolve(result);
        });
      });
      if (tab && tab.id === stored.activePetTabId) {
        activePetTabId = tab.id;
        activePetWindowId = tab.windowId;
        return { tabId: tab.id, windowId: tab.windowId };
      }
    } catch (_) {}
  }
  const tabs = await queryTabs({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab || !Number.isInteger(tab.id)) return { tabId: null, windowId: null };
  activePetTabId = tab.id;
  activePetWindowId = tab.windowId;
  await new Promise((resolve) => API.storage.local.set({ activePetTabId: tab.id, activePetWindowId: tab.windowId }, resolve));
  return { tabId: tab.id, windowId: tab.windowId };
}

async function routePetMessage(message) {
  const data = await new Promise((resolve) => API.storage.local.get({ showOnAllTabs: false }, resolve));
  const broadcastActions = new Set(["stopCat", "stopCompanion"]);
  if (data.showOnAllTabs || broadcastActions.has(message.action)) {
    return queryTabs({ url: CONTENT_URL_PATTERNS });
  }
  const owner = await getActivePetOwner();
  return Number.isInteger(owner.tabId) ? [{ id: owner.tabId, windowId: owner.windowId }] : [];
}

API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (!isExtensionSender(sender) && !["fetchOllamaModels", "askOllama", "transfer_pet_window", "get_active_pet_state", "load_owner_runtime"].includes(msg.action)) {
      sendResponse({ success: false, error: "Untrusted sender" });
      return;
    }

    if (msg.action === "get_active_pet_state") {
      const data = await new Promise((resolve) => API.storage.local.get({ showOnAllTabs: false }, resolve));
      if (data.showOnAllTabs) {
        sendResponse({ success: true, showOnAllTabs: true, isOwner: true, ownerTabId: null });
        return;
      }
      const owner = await getActivePetOwner();
      sendResponse({ success: true, showOnAllTabs: false, isOwner: !!(sender.tab && sender.tab.id === owner.tabId), ownerTabId: owner.tabId });
      return;
    }

    if (msg.action === "load_owner_runtime") {
      const owner = await getActivePetOwner();
      const tabId = sender && sender.tab ? sender.tab.id : null;
      if (!Number.isInteger(tabId) || tabId !== owner.tabId) {
        sendResponse({ success: false, error: "Not active pet owner" });
        return;
      }
      const loaded = await injectOwnerRuntime(tabId);
      sendResponse({ success: loaded });
      return;
    }

    if (msg.action === "transfer_pet_window") {
      const senderTabId = sender && sender.tab ? sender.tab.id : null;
      const senderWindowId = sender && sender.tab ? sender.tab.windowId : null;
      const tx = Number(msg.screenX);
      const ty = Number(msg.screenY);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) {
        sendResponse({ success: false, error: "Invalid screen coordinates" });
        return;
      }
      (async () => {
        let targetWindow = null;
        if (API.windows && typeof API.windows.getAll === "function") {
          try {
            const windows = await new Promise((resolve) => API.windows.getAll({ populate: true }, resolve));
            targetWindow = (windows || []).find((win) => {
              if (!win || win.id === senderWindowId) return false;
              if (!Number.isFinite(win.left) || !Number.isFinite(win.top) || !Number.isFinite(win.width) || !Number.isFinite(win.height)) return false;
              return tx >= win.left && tx <= win.left + win.width && ty >= win.top && ty <= win.top + win.height;
            });
          } catch (_) {}
        }
        let targetTab = null;
        if (targetWindow && Array.isArray(targetWindow.tabs)) {
          targetTab = targetWindow.tabs.find((tab) => tab.active && tab.id !== senderTabId) || targetWindow.tabs.find((tab) => tab.id !== senderTabId);
        }
        if (!targetTab || !Number.isInteger(targetTab.id)) {
          sendResponse({ success: false, error: "No target window found" });
          return;
        }
        const previousOwnerTabId = activePetTabId;
        activePetTabId = targetTab.id;
        activePetWindowId = targetTab.windowId;
        await new Promise((resolve) => API.storage.local.set({ activePetTabId: targetTab.id, activePetWindowId: targetTab.windowId }, resolve));
        await injectOwnerRuntime(targetTab.id);
        const delivered = await sendMessageToTab(targetTab.id, {
          action: "receive_transferred_pet",
          screenX: tx,
          screenY: ty,
          petType: msg.petType === "companion" ? "companion" : "main",
          dropVX: msg.dropVX || 0,
          dropVY: msg.dropVY || 0,
        }).catch(() => null);
        const transferred = !!(delivered && delivered.success);
        if (transferred && Number.isInteger(previousOwnerTabId) && previousOwnerTabId !== targetTab.id) {
          await sendMessageToTab(previousOwnerTabId, { action: "deactivate_tab_pet" }).catch(() => {});
        }
        sendResponse({ success: transferred });
      })().catch(() => {
        sendResponse({ success: false, error: "Transfer failed" });
      });
      return true;
    }

    if (msg.action === "fetchOllamaModels") {
      try {
        const url = (msg.url || "http://localhost:11434").replace(/\/$/, '');
        const res = await fetch(`${url}/api/tags`, {
          method: "GET",
          headers: { "Origin": "http://localhost" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        sendResponse({ success: true, models: data.models || [] });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return;
    }

    if (msg.action === "askOllama") {
      try {
        let url = msg.url;
        let model = msg.model;
        let system = msg.system;
        const clippyPrompt =
          "You are Clippy, the friendly Microsoft Office assistant. Answer naturally and cheerfully in exactly one short sentence.";
        if (!url || !model) {
          const stored = await new Promise((res) => {
            API.storage.local.get(
              {
                ollamaUrl: "http://localhost:11434",
                ollamaModel: "",
                ollamaSystemPrompt: "",
              },
              res,
            );
          });
          url = url || stored.ollamaUrl;
          model = model || stored.ollamaModel;
          system = system || stored.ollamaSystemPrompt;
        }
        url = (url || "http://localhost:11434").replace(/\/$/, '');
        if (!model) throw new Error("No Ollama model selected in settings.");
        const promptText = msg.prompt || msg.message || "";
        let finalSystem = system && system.trim() ? system : clippyPrompt;
        if (!finalSystem.toLowerCase().includes("clippy"))
          finalSystem = clippyPrompt + " " + finalSystem;
        const res = await fetch(`${url}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost",
          },
          body: JSON.stringify({
            model,
            stream: false,
            options: { num_predict: 100, temperature: 0.7 },
            messages: [
              { role: "system", content: finalSystem },
              { role: "user", content: promptText },
            ],
          }),
        });
        if (!res.ok) throw new Error(`Ollama error (${res.status})`);
        const data = await res.json();
        const text = data.message ? data.message.content : data.response || "";
        sendResponse({ success: true, response: text, reply: text });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return;
    }

    const safeMsg = ALLOWED_ACTIONS.has(msg.action)
      ? msg.action === "updateSettings"
        ? { action: "updateSettings", settings: sanitizeSettings(msg.settings) }
        : { action: msg.action }
      : null;

    if (!safeMsg) {
      sendResponse({ success: false, error: "Unsupported message" });
      return;
    }

    const tabs = await routePetMessage(safeMsg);
    await Promise.allSettled(
      tabs.map((tab) => sendMessageToTab(tab.id, safeMsg)),
    );
    sendResponse({ success: true, tabCount: tabs.length });
  })().catch(() => {
    sendResponse({ success: false, error: "Message delivery failed" });
  });

  return true;
});

if (API.tabs && API.tabs.onRemoved) {
  API.tabs.onRemoved.addListener((tabId) => {
    invalidateRuntimeTab(tabId);
    loadingRuntimeTabs.delete(tabId);
  });
}

if (API.tabs && API.tabs.onUpdated) {
  API.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab) return;
    if (changeInfo.status === "loading") {
      invalidateRuntimeTab(tabId);
      loadingRuntimeTabs.delete(tabId);
      if (tab.active) updateActivePetTab(tabId, tab.windowId);
      return;
    }
    if (changeInfo.status === "complete") {
      injectOwnerRuntime(tabId).then(() => {
        getActivePetOwner().then((owner) => {
          if (owner.tabId === tabId) sendMessageToTab(tabId, { action: "activate_tab_pet" }).catch(() => {});
        }).catch(() => {});
      }).catch(() => {});
    }
  });
}

if (API.tabs && API.tabs.onReplaced) {
  API.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    invalidateRuntimeTab(removedTabId);
    loadingRuntimeTabs.delete(removedTabId);
    invalidateRuntimeTab(addedTabId);
    getActivePetOwner().then((owner) => {
      if (owner.tabId === addedTabId) injectOwnerRuntime(addedTabId);
    }).catch(() => {});
  });
}

// A duplicated tab (Ctrl+Shift+... / right-click "Duplicate") is frequently
// created already in "complete" status, since Chrome can clone the
// rendered page instead of navigating it. That means the tabs.onUpdated
// "loading" -> "complete" transition above never fires for it, so the pet
// runtime never got injected until the user manually reloaded the page.
// Catch that case directly here.
if (API.tabs && API.tabs.onCreated) {
  API.tabs.onCreated.addListener((tab) => {
    if (!tab || !Number.isInteger(tab.id)) return;
    if (tab.status === "complete" && typeof tab.url === "string" && tab.url) {
      injectOwnerRuntime(tab.id).then(() => {
        if (tab.active) updateActivePetTab(tab.id, tab.windowId);
      }).catch(() => {});
    }
  });
}

// "Move tab to a new window" (including dragging a duplicated tab out into
// its own window, i.e. "splitting it out") doesn't fire onCreated or
// onUpdated at all for the tab — only onAttached/onDetached, plus
// windows.onCreated for the new window. None of these were covered before,
// so the pet stayed missing in BOTH the new window and the one left behind
// until a reload. Cover all three.
if (API.tabs && API.tabs.onAttached) {
  API.tabs.onAttached.addListener((tabId, attachInfo) => {
    // A tab landing in a brand-new window (or an existing one via drag) is
    // reassigned unconditionally here; if it turns out not to be the active
    // tab, the tabs.onActivated listener above will correct it right after.
    injectOwnerRuntime(tabId).then(() => {
      updateActivePetTab(tabId, attachInfo.newWindowId);
    }).catch(() => {});
  });
}

if (API.tabs && API.tabs.onDetached) {
  API.tabs.onDetached.addListener((tabId, detachInfo) => {
    // The tab that just left detachInfo.oldWindowId might have been the
    // pet's owner. Whatever tab is now active in that window (Chrome
    // always promotes one) should own the pet if that window still exists
    // and still has a catEnabled/showOnAllTabs-eligible reason to have one.
    queryTabs({ active: true, windowId: detachInfo.oldWindowId })
      .then((tabs) => {
        if (tabs && tabs[0]) {
          injectOwnerRuntime(tabs[0].id).then(() => {
            updateActivePetTab(tabs[0].id, detachInfo.oldWindowId);
          }).catch(() => {});
        }
      })
      .catch(() => {});
  });
}

if (API.windows && API.windows.onCreated) {
  API.windows.onCreated.addListener((win) => {
    if (!win || !Number.isInteger(win.id)) return;
    queryTabs({ windowId: win.id })
      .then((tabs) =>
        Promise.allSettled(
          tabs
            .filter((t) => Number.isInteger(t.id) && typeof t.url === "string")
            .map((t) => injectOwnerRuntime(t.id))
        ).then(() => tabs)
      )
      .then((tabs) => {
        const active = (tabs || []).find((t) => t.active);
        if (active) updateActivePetTab(active.id, win.id);
      })
      .catch(() => {});
  });
}
