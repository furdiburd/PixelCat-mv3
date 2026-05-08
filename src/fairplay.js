(function(global) {
  'use strict';

  const API = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const MAX_XP = 270;
  const MAX_COINS = 999999;
  const INSTALL_KEY = 'pcInstallId';
  const SEAL_KEY = 'pcProgressSeal';
  const BACKUP_KEY = 'pcProgressBackup';
  const SEAL_VERSION = 1;
  const BUILD_TAG = 'pixelcat-progress-v1';

  const BALL_IDS = new Set([
    'ball_baseball', 'ball_tennis', 'ball_golf', 'ball_basketball',
    'ball_football', 'ball_volleyball', 'ball_bowling'
  ]);
  const BOOST_IDS = new Set(['toy_feather', 'treat_gold', 'coin_magnet', 'lucky_charm']);
  const SHOP_IDS = new Set([...BALL_IDS, ...BOOST_IDS]);
  const QUEST_TYPES = new Set(['pet_sessions', 'fish_served', 'watch_seconds', 'coins_collected', 'ball_catches', 'spiders_caught']);
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  const PROTECTED_DEFAULTS = Object.freeze({
    catXP: 0,
    coins: 0,
    shopOwned: [],
    shopActiveBoosts: [],
    activeBall: 'ball_baseball',
    dailyStreak: 0,
    lastStreakDate: '',
    speechEnabled: false,
    ballEnabled: false,
    spiderEnabled: false,
    sizeMultiplier: 1.0,
    companionEnabled: false,
    uiMischiefEnabled: false,
    portalEnabled: false,
    catEnergyLevel: 'active',
    uiMischiefRate: 11,
    dailyQuestState: null,
    dailyQuestStats: null
  });

  const PROTECTED_KEYS = new Set(Object.keys(PROTECTED_DEFAULTS));
  PROTECTED_KEYS.add(INSTALL_KEY);
  PROTECTED_KEYS.add(SEAL_KEY);
  PROTECTED_KEYS.add(BACKUP_KEY);

  function storageGet(storageArea, defaults) {
    try {
      const result = storageArea.get(defaults);
      if (result && typeof result.then === 'function') return result;
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise((resolve) => storageArea.get(defaults, resolve));
  }

  function storageSet(storageArea, values) {
    try {
      const result = storageArea.set(values);
      if (result && typeof result.then === 'function') return result;
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise((resolve) => storageArea.set(values, resolve));
  }

  function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
  }

  function clampInteger(value, min, max, fallback) {
    return Math.round(clampNumber(value, min, max, fallback));
  }

  function roundXP(value) {
    return Math.round(clampNumber(value, 0, MAX_XP, 0) * 100) / 100;
  }

  function uniqueValidStrings(values, allowed, limit) {
    const out = [];
    const seen = new Set();
    (Array.isArray(values) ? values : []).forEach((id) => {
      if (typeof id !== 'string' || !allowed.has(id) || seen.has(id)) return;
      seen.add(id);
      out.push(id);
    });
    return out.slice(0, limit || 50);
  }

  function normalizeStats(rawStats) {
    if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) return null;
    return {
      lifetimeCompleted: clampInteger(rawStats.lifetimeCompleted, 0, 100000, 0),
      lifetimeSpidersCaught: clampInteger(rawStats.lifetimeSpidersCaught, 0, 100000, 0),
      lifetimePets: clampInteger(rawStats.lifetimePets, 0, 100000, 0),
      lifetimeFish: clampInteger(rawStats.lifetimeFish, 0, 100000, 0),
      lifetimeCoins: clampInteger(rawStats.lifetimeCoins, 0, 1000000, 0),
      lifetimeBallCatches: clampInteger(rawStats.lifetimeBallCatches, 0, 100000, 0),
      perfectDays: clampInteger(rawStats.perfectDays, 0, 10000, 0),
      lastPerfectDate: typeof rawStats.lastPerfectDate === 'string' && DATE_RE.test(rawStats.lastPerfectDate) ? rawStats.lastPerfectDate : ''
    };
  }

  function normalizeQuestState(rawState) {
    if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) return null;
    const dateKey = typeof rawState.dateKey === 'string' && DATE_RE.test(rawState.dateKey) ? rawState.dateKey : '';
    if (!dateKey || !Array.isArray(rawState.quests)) return null;
    const quests = rawState.quests.slice(0, 3).map((quest, index) => {
      if (!quest || typeof quest !== 'object' || !QUEST_TYPES.has(quest.type)) return null;
      const target = clampInteger(quest.target, 1, 10000, 1);
      const progress = Math.min(target, clampInteger(quest.progress, 0, target, 0));
      return {
        id: typeof quest.id === 'string' ? quest.id.slice(0, 120) : `${dateKey}:${quest.type}:${index}`,
        type: quest.type,
        target,
        progress,
        completed: Boolean(quest.completed) || progress >= target
      };
    }).filter(Boolean);
    return {
      version: clampInteger(rawState.version, 1, 9, 1),
      dateKey,
      quests
    };
  }

  function normalizeState(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const xp = roundXP(source.catXP);
    const owned = uniqueValidStrings(source.shopOwned, SHOP_IDS, 50);
    const ownedSet = new Set(owned);
    const boostSource = Array.isArray(source.shopActiveBoosts)
      ? source.shopActiveBoosts
      : owned.filter((id) => BOOST_IDS.has(id));
    const activeBoosts = uniqueValidStrings(boostSource, BOOST_IDS, 20)
      .filter((id) => ownedSet.has(id));
    let activeBall = typeof source.activeBall === 'string' && BALL_IDS.has(source.activeBall) ? source.activeBall : 'ball_baseball';
    if (activeBall !== 'ball_baseball' && !ownedSet.has(activeBall)) activeBall = 'ball_baseball';

    const state = {
      catXP: xp,
      coins: clampInteger(source.coins, 0, MAX_COINS, 0),
      shopOwned: owned,
      shopActiveBoosts: activeBoosts,
      activeBall,
      dailyStreak: clampInteger(source.dailyStreak, 0, 3660, 0),
      lastStreakDate: typeof source.lastStreakDate === 'string' && DATE_RE.test(source.lastStreakDate) ? source.lastStreakDate : '',
      speechEnabled: Boolean(source.speechEnabled),
      ballEnabled: Boolean(source.ballEnabled),
      spiderEnabled: Boolean(source.spiderEnabled),
      sizeMultiplier: Math.round(clampNumber(source.sizeMultiplier, 0.5, 2.5, 1.0) * 10) / 10,
      companionEnabled: Boolean(source.companionEnabled),
      uiMischiefEnabled: Boolean(source.uiMischiefEnabled),
      portalEnabled: Boolean(source.portalEnabled),
      catEnergyLevel: ['sleepy', 'active', 'hyper'].includes(source.catEnergyLevel) ? source.catEnergyLevel : 'active',
      uiMischiefRate: clampInteger(source.uiMischiefRate, 0, 100, 11),
      dailyQuestState: normalizeQuestState(source.dailyQuestState),
      dailyQuestStats: normalizeStats(source.dailyQuestStats)
    };

    applyLevelLocks(state);
    return state;
  }

  function applyLevelLocks(data) {
    const xp = roundXP(data && data.catXP);
    if (xp < 10) {
      data.speechEnabled = false;
      data.ballEnabled = false;
    }
    if (xp < 25) data.spiderEnabled = false;
    if (xp < 45) data.sizeMultiplier = 1.0;
    if (xp < 70) data.companionEnabled = false;
    if (xp < 100) data.uiMischiefEnabled = false;
    if (xp < 135) data.portalEnabled = false;
    if (xp < 175 && data.catEnergyLevel === 'hyper') data.catEnergyLevel = 'active';
    return data;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }

  function hashText(input) {
    let h1 = 0x811c9dc5;
    let h2 = 0x45d9f3b;
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 ^= code + i;
      h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    }
    h1 ^= h2 >>> 16;
    h2 ^= h1 >>> 13;
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  function makeId() {
    const cryptoObj = global.crypto || (API && API.crypto);
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      cryptoObj.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
  }

  function createSeal(state, installId) {
    return `${SEAL_VERSION}.${hashText(`${BUILD_TAG}|${installId}|${stableStringify(state)}`)}`;
  }

  function isSameValue(a, b) {
    return stableStringify(a) === stableStringify(b);
  }

  function getReadDefaults(defaults) {
    const readDefaults = Object.assign({}, PROTECTED_DEFAULTS);
    if (defaults && typeof defaults === 'object' && !Array.isArray(defaults)) Object.assign(readDefaults, defaults);
    readDefaults[INSTALL_KEY] = '';
    readDefaults[SEAL_KEY] = '';
    readDefaults[BACKUP_KEY] = null;
    return readDefaults;
  }

  function hasProtectedKey(keys) {
    if (keys == null) return true;
    if (typeof keys === 'string') return PROTECTED_KEYS.has(keys);
    if (Array.isArray(keys)) return keys.some((key) => PROTECTED_KEYS.has(key));
    if (typeof keys === 'object') return Object.keys(keys).some((key) => PROTECTED_KEYS.has(key));
    return false;
  }

  function getProtectedPatch(state) {
    const patch = {};
    Object.keys(PROTECTED_DEFAULTS).forEach((key) => { patch[key] = state[key]; });
    return patch;
  }

  function getValidBackup(rawBackup, installId) {
    if (!rawBackup || typeof rawBackup !== 'object' || rawBackup.version !== SEAL_VERSION) return null;
    const state = normalizeState(rawBackup.state || {});
    const seal = createSeal(state, installId);
    if (rawBackup.seal !== seal) return null;
    return state;
  }

  async function ensure(storageArea, defaults) {
    if (!storageArea) return Object.assign({}, defaults || {}, PROTECTED_DEFAULTS);
    const raw = await storageGet(storageArea, getReadDefaults(defaults));
    let installId = typeof raw[INSTALL_KEY] === 'string' && raw[INSTALL_KEY].length >= 12 ? raw[INSTALL_KEY] : makeId();
    let state = normalizeState(raw);
    let seal = createSeal(state, installId);
    const currentSeal = typeof raw[SEAL_KEY] === 'string' ? raw[SEAL_KEY] : '';

    if (currentSeal && currentSeal !== seal) {
      const backupState = getValidBackup(raw[BACKUP_KEY], installId);
      state = backupState || normalizeState(PROTECTED_DEFAULTS);
      seal = createSeal(state, installId);
    }

    const writePatch = {};
    Object.keys(PROTECTED_DEFAULTS).forEach((key) => {
      if (!isSameValue(raw[key], state[key])) writePatch[key] = state[key];
    });
    if (raw[INSTALL_KEY] !== installId) writePatch[INSTALL_KEY] = installId;
    if (currentSeal !== seal) writePatch[SEAL_KEY] = seal;
    const backup = { version: SEAL_VERSION, state, seal };
    if (!isSameValue(raw[BACKUP_KEY], backup)) writePatch[BACKUP_KEY] = backup;

    if (Object.keys(writePatch).length) await storageSet(storageArea, writePatch);
    return Object.assign({}, raw, state, { [INSTALL_KEY]: installId, [SEAL_KEY]: seal, [BACKUP_KEY]: backup });
  }

  let commitQueue = Promise.resolve();

  async function writeMergedState(storageArea, base, patch) {
    const merged = Object.assign({}, base, patch || {});
    const installId = typeof base[INSTALL_KEY] === 'string' && base[INSTALL_KEY] ? base[INSTALL_KEY] : makeId();
    const state = normalizeState(merged);
    const seal = createSeal(state, installId);
    const backup = { version: SEAL_VERSION, state, seal };
    const writePatch = Object.assign({}, patch || {}, getProtectedPatch(state), {
      [INSTALL_KEY]: installId,
      [SEAL_KEY]: seal,
      [BACKUP_KEY]: backup
    });
    await storageSet(storageArea, writePatch);
    return Object.assign({}, base, writePatch, state);
  }

  function commit(storageArea, patch) {
    commitQueue = commitQueue.catch(() => {}).then(async () => {
      const base = await ensure(storageArea, {});
      return writeMergedState(storageArea, base, patch);
    });
    return commitQueue;
  }

  function mutateNumber(storageArea, key, delta, options) {
    commitQueue = commitQueue.catch(() => {}).then(async () => {
      const base = await ensure(storageArea, {});
      const amount = Number(delta) || 0;
      if (!amount || !PROTECTED_KEYS.has(key)) return base[key];
      const min = options && options.min !== undefined ? options.min : 0;
      const max = options && options.max !== undefined ? options.max : (key === 'catXP' ? MAX_XP : MAX_COINS);
      const fallback = options && options.defaultValue !== undefined ? options.defaultValue : 0;
      const current = key === 'catXP' ? roundXP(base[key]) : clampNumber(base[key], min, max, fallback);
      const next = key === 'catXP'
        ? roundXP(Math.min(max, Math.max(min, current + amount)))
        : clampInteger(current + amount, min, max, fallback);
      await writeMergedState(storageArea, base, { [key]: next });
      return next;
    });
    return commitQueue;
  }

  async function reset(storageArea, values) {
    const clean = Object.assign({}, values || {}, PROTECTED_DEFAULTS);
    return commit(storageArea, clean);
  }

  function filterSettingsForProgress(settings, progress) {
    const clean = Object.assign({}, settings || {});
    const source = Object.assign({}, PROTECTED_DEFAULTS, progress || {}, clean);
    applyLevelLocks(source);
    ['speechEnabled', 'ballEnabled', 'spiderEnabled', 'sizeMultiplier', 'companionEnabled', 'uiMischiefEnabled', 'portalEnabled', 'catEnergyLevel'].forEach((key) => {
      if (key in clean) clean[key] = source[key];
    });
    if ('activeBall' in clean) {
      const state = normalizeState(Object.assign({}, progress || {}, { activeBall: clean.activeBall }));
      clean.activeBall = state.activeBall;
    }
    if ('shopOwned' in clean || 'shopActiveBoosts' in clean) {
      const state = normalizeState(Object.assign({}, progress || {}, clean));
      if ('shopOwned' in clean) clean.shopOwned = state.shopOwned;
      if ('shopActiveBoosts' in clean) clean.shopActiveBoosts = state.shopActiveBoosts;
    }
    return clean;
  }

  global.PixelCatFairPlay = Object.freeze({
    PROTECTED_KEYS,
    hasProtectedKey,
    normalizeState,
    applyLevelLocks,
    filterSettingsForProgress,
    ensure,
    commit,
    mutateNumber,
    reset
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
