const API = typeof browser !== 'undefined' ? browser : chrome;
const YOUTUBE_URL_PATTERNS = ['*://www.youtube.com/*', '*://youtube.com/*'];
const ALLOWED_ACTIONS = new Set([
  'startCat',
  'stopCat',
  'startCompanion',
  'stopCompanion',
  'updateSettings',
  'clearSpeechMemory'
]);
const ALLOWED_SETTINGS = {
  catEnabled: 'boolean',
  companionEnabled: 'boolean',
  loyalMode: 'boolean',
  aggressiveMode: 'boolean',
  uiMischiefEnabled: 'boolean',
  speechEnabled: 'boolean',
  memoryEnabled: 'boolean',
  rareEventsEnabled: 'boolean',
  autoFishSpawnEnabled: 'boolean',
  ballEnabled: 'boolean',
  spiderEnabled: 'boolean',
  lowPowerMode: 'boolean',
  hideInFullscreen: 'boolean',
  portalEnabled: 'boolean',
  speedMultiplier: 'number',
  sizeMultiplier: 'number',
  uiMischiefRate: 'number',
  catEnergyLevel: 'string',
  uiLanguage: 'string',
  catSkin: 'string',
  activeBall: 'string',
  activePet: 'string',
  shopOwned: 'array',
  shopActiveBoosts: 'array'
};

function isExtensionSender(sender) {
  const url = sender && sender.url;
  return typeof url === 'string' && url.startsWith(API.runtime.getURL(''));
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null;
  const clean = {};
  Object.keys(ALLOWED_SETTINGS).forEach((key) => {
    if (!(key in settings)) return;
    const expected = ALLOWED_SETTINGS[key];
    const value = settings[key];
    if (expected === 'boolean') {
      if (typeof value === 'boolean') clean[key] = value;
      return;
    }
    if (expected === 'number') {
      if (key === 'speedMultiplier') clean[key] = clampNumber(value, 0.5, 2.5, 1.0);
      else if (key === 'sizeMultiplier') clean[key] = clampNumber(value, 0.5, 2.5, 1.0);
      else if (key === 'uiMischiefRate') clean[key] = Math.round(clampNumber(value, 0, 100, 11));
      return;
    }
    if (expected === 'string') {
      if (key === 'catEnergyLevel' && ['sleepy', 'active', 'hyper'].includes(value)) clean[key] = value;
      else if (key === 'uiLanguage' && ['en', 'fr', 'it', 'ar'].includes(value)) clean[key] = value;
      else if (key === 'catSkin' && ['white', 'orange', 'rainbow'].includes(value)) clean[key] = value;
      else if (key === 'activeBall' && /^ball_[a-z0-9_]{1,40}$/.test(value)) clean[key] = value;
      else if (key === 'activePet' && ['pet_cat', 'pet_fox'].includes(value)) clean[key] = value;
      return;
    }
    if (expected === 'array') {
      if (Array.isArray(value)) {
        clean[key] = value
          .filter((id) => typeof id === 'string' && /^[a-z0-9_]{1,40}$/.test(id))
          .slice(0, 50);
      }
    }
  });
  return Object.keys(clean).length ? clean : null;
}

function sanitizeMessage(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || !ALLOWED_ACTIONS.has(msg.action)) {
    return null;
  }
  if (msg.action === 'updateSettings') {
    const settings = sanitizeSettings(msg.settings);
    return settings ? { action: 'updateSettings', settings } : null;
  }
  return { action: msg.action };
}

function queryTabs(queryInfo) {
  try {
    const result = API.tabs.query(queryInfo);
    if (result && typeof result.then === 'function') {
      return result;
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    API.tabs.query(queryInfo, (tabs) => {
      if (API.runtime.lastError) {
        reject(new Error(API.runtime.lastError.message));
        return;
      }
      resolve(tabs || []);
    });
  });
}

function sendMessageToTab(tabId, message) {
  try {
    const result = API.tabs.sendMessage(tabId, message);
    if (result && typeof result.then === 'function') {
      return result;
    }
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    API.tabs.sendMessage(tabId, message, (response) => {
      if (API.runtime.lastError) {
        reject(new Error(API.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}


API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (!isExtensionSender(sender)) {
      sendResponse({ success: false, error: 'Untrusted sender' });
      return;
    }

    const safeMsg = sanitizeMessage(msg);
    if (!safeMsg) {
      sendResponse({ success: false, error: 'Unsupported message' });
      return;
    }

    const tabs = await queryTabs({ url: YOUTUBE_URL_PATTERNS });

    const deliveries = await Promise.allSettled(
      tabs.map((tab) => sendMessageToTab(tab.id, safeMsg))
    );

    const failures = deliveries
      .map((result, index) => ({ result, tabId: tabs[index] && tabs[index].id }))
      .filter(({ result }) => result.status === 'rejected');


    sendResponse({
      success: failures.length === 0,
      tabCount: tabs.length,
      deliveredCount: tabs.length - failures.length,
      failedTabIds: failures.map(({ tabId }) => tabId)
    });
  })().catch(() => {
    sendResponse({ success: false, error: 'Message delivery failed' });
  });

  return true;
});

