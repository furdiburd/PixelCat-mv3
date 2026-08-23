(function(global) {
  'use strict';

  global.PixelCatStorage = function(ctx) {
    let storageWriteQueue = Promise.resolve();
    let catXP = 0;
    let xpWriteTimer = 0;
    let pendingXPDelta = 0;
    let xpLoaded = false;
    let xpLoadPromise = null;

    const MAX_LEVEL_XP = 270;
    const LEVEL_UNLOCKS = [
      { xp: 10, level: 2, skills: ['Speech bubbles', 'Ball play'] },
      { xp: 25, level: 3, skills: ['Spider events'] },
      { xp: 45, level: 4, skills: ['Cat size control'] },
      { xp: 70, level: 5, skills: ['Companion mode'] },
      { xp: 100, level: 6, skills: ['Page mischief'] },
      { xp: 135, level: 7, skills: ['Portals'] },
      { xp: 175, level: 8, skills: ['Hyper energy'] },
      { xp: 220, level: 9, skills: ['Final level badge'] },
      { xp: 270, level: 10, skills: ['Max level'] }
    ];

    function notifyLevelUnlocks(previousXP, nextXP) {
      if (ctx.isCompanion || nextXP <= previousXP) return;
      const reached = LEVEL_UNLOCKS.filter((entry) => previousXP < entry.xp && nextXP >= entry.xp);
      if (!reached.length) return;

      const highest = reached[reached.length - 1];
      const skills = reached.reduce((items, entry) => items.concat(entry.skills), []);
      if (typeof ctx.onLevelUnlock === 'function') {
        ctx.onLevelUnlock({
          level: highest.level,
          xp: highest.xp,
          skills
        });
      }
    }

    function getFairPlay() {
      return ctx.FairPlay || (typeof globalThis !== 'undefined' ? globalThis.PixelCatFairPlay : null);
    }

    function getLocal(keys) {
      const fairPlay = getFairPlay();
      if (fairPlay && typeof fairPlay.hasProtectedKey === 'function' && fairPlay.hasProtectedKey(keys)) {
        return fairPlay.ensure(ctx.API.storage.local, keys);
      }
      if (typeof ctx.API.storage.local.get === 'function' && ctx.API.storage.local.get.length <= 1) {
        return ctx.API.storage.local.get(keys);
      }
      return new Promise((resolve) => ctx.API.storage.local.get(keys, resolve));
    }

    function setLocal(data) {
      const fairPlay = getFairPlay();
      if (fairPlay && typeof fairPlay.hasProtectedKey === 'function' && fairPlay.hasProtectedKey(data)) {
        return fairPlay.commit(ctx.API.storage.local, data);
      }
      if (typeof ctx.API.storage.local.set === 'function' && ctx.API.storage.local.set.length <= 1) {
        return ctx.API.storage.local.set(data);
      }
      return new Promise((resolve) => ctx.API.storage.local.set(data, resolve));
    }

    function mutateStoredNumber(key, delta, options) {
      const amount = Number(delta) || 0;
      if (!amount) return storageWriteQueue;

      const fairPlay = getFairPlay();
      if (fairPlay && typeof fairPlay.hasProtectedKey === 'function' && fairPlay.hasProtectedKey(key)) {
        return fairPlay.mutateNumber(ctx.API.storage.local, key, amount, options);
      }

      storageWriteQueue = storageWriteQueue.catch(() => {}).then(async () => {
        const defaultValue = options && options.defaultValue !== undefined ? options.defaultValue : 0;
        const data = await getLocal({ [key]: defaultValue });
        let next = (Number(data[key]) || 0) + amount;
        if (options && options.min !== undefined) next = Math.max(options.min, next);
        if (options && options.max !== undefined) next = Math.min(options.max, next);
        await setLocal({ [key]: next });
        return next;
      }).catch(() => undefined);

      return storageWriteQueue;
    }

    function updateOwnedShopItems(items) {
      ctx.setOwnedShopItems(Array.isArray(items) ? items : []);
    }

    function updateActiveShopBoosts(items) {
      if (typeof ctx.setActiveShopBoosts === 'function') {
        ctx.setActiveShopBoosts(Array.isArray(items) ? items : []);
      }
    }

    function hasShopBoost(id) {
      if (ctx.freePlayMode || ctx.unlockAll) return true;
      return typeof ctx.getActiveShopBoosts === 'function'
        ? ctx.getActiveShopBoosts().has(id)
        : ctx.getOwnedShopItems().has(id);
    }

    function loadXPAndShop() {
      if (ctx.isCompanion) return Promise.resolve();
      if (xpLoadPromise) return xpLoadPromise;
      xpLoadPromise = getLocal({ catXP: 0, shopOwned: [], shopActiveBoosts: null }).then((data) => {
        const loadedXP = Math.min(MAX_LEVEL_XP, Math.max(0, data.catXP || 0));
        catXP = Math.min(MAX_LEVEL_XP, loadedXP + pendingXPDelta);
        xpLoaded = true;
        const owned = Array.isArray(data.shopOwned) ? data.shopOwned : [];
        updateOwnedShopItems(owned);
        updateActiveShopBoosts(Array.isArray(data.shopActiveBoosts) ? data.shopActiveBoosts : owned);
      }).catch((error) => {
        xpLoadPromise = null;
        throw error;
      });
      return xpLoadPromise;
    }

    function checkAchievements() {
      if (ctx.isCompanion) return;
      const storageArea = ctx.API.storage.local;
      const getKeys = typeof storageArea.get === 'function' && storageArea.get.length <= 1
        ? (keys) => storageArea.get(keys)
        : (keys) => new Promise((r) => storageArea.get(keys, r));
      getKeys({
        pixelCatStats: null,
        catXP: 0,
        dailyStreak: 0,
        unlockedAchievements: []
      }).then(async (data) => {
        const stats = data.pixelCatStats || {};
        const xp = Math.min(MAX_LEVEL_XP, Math.max(0, data.catXP || 0));
        const streak = Math.max(0, data.dailyStreak || 0);
        const unlocked = Array.isArray(data.unlockedAchievements) ? data.unlockedAchievements : [];
        const achievementDefinitions = [
          { id: 'achievementFirstFriend',   name: 'First Friend',   unlocked: (stats.lifetimePets || 0) >= 1 || (stats.lifetimeFish || 0) >= 1 },
          { id: 'achievementSpiderHunter',  name: 'Spider Hunter',  unlocked: (stats.lifetimeSpidersCaught || 0) >= 10 },
          { id: 'achievement100Pets',       name: '100 Pets',       unlocked: (stats.lifetimePets || 0) >= 100 },
          { id: 'achievement7DayStreak',    name: '7 Day Streak',   unlocked: streak >= 7 },
          { id: 'achievementMasterMischief',name: 'Mischief',       unlocked: xp >= 100 },
          { id: 'achievementGoldRush',      name: 'Gold Rush',      unlocked: (stats.lifetimeCoins || 0) >= 1000 },
          { id: 'achievementSpiderHero',    name: 'Spider Hero',    unlocked: (stats.lifetimeSpidersCaught || 0) >= 50 },
          { id: 'achievementSushiMaster',   name: 'Sushi Master',   unlocked: (stats.lifetimeFish || 0) >= 500 },
          { id: 'achievementConsistent',    name: 'Consistent',    unlocked: streak >= 14 },
          { id: 'achievementFishmonger',    name: 'Fishmonger',     unlocked: (stats.lifetimeFish || 0) >= 50 },
          { id: 'achievementNightCrawler',  name: 'Night Crawler',  unlocked: (stats.lifetimeGoogleSeconds || 0) >= 3600 }
        ];
        const newlyUnlocked = [];
        const nextUnlockedList = [...unlocked];
        achievementDefinitions.forEach((ach) => {
          if (ach.unlocked && !unlocked.includes(ach.id)) {
            newlyUnlocked.push(ach.name);
            nextUnlockedList.push(ach.id);
          }
        });
        if (newlyUnlocked.length > 0) {
          const setLocal = typeof storageArea.set === 'function' && storageArea.set.length <= 1
            ? (obj) => storageArea.set(obj)
            : (obj) => new Promise((r) => storageArea.set(obj, r));
          await setLocal({ unlockedAchievements: nextUnlockedList });
          if (typeof ctx.onAchievement === 'function') {
            newlyUnlocked.forEach((name) => {
              ctx.onAchievement(name);
            });
          }
        }
      }).catch(() => {});
    }

    function flushXP() {
      if (xpWriteTimer) {
        try { clearTimeout(xpWriteTimer); } catch (e) {}
        xpWriteTimer = 0;
      }
      const pending = pendingXPDelta;
      if (!pending) return storageWriteQueue;
      pendingXPDelta = 0;
      return mutateStoredNumber('catXP', pending, { defaultValue: 0, min: 0, max: MAX_LEVEL_XP }).then((res) => {
        checkAchievements();
        return res;
      });
    }

    function earnXP(amount) {
      if (ctx.isCompanion) return;
      const delta = Math.max(0, Number(amount) || 0);
      if (!delta) return;

      const previousXP = catXP;
      const nextXP = Math.min(MAX_LEVEL_XP, catXP + delta);
      const actualGain = nextXP - catXP;
      catXP = nextXP;
      if (xpLoaded) notifyLevelUnlocks(previousXP, catXP);
      if (actualGain > 0) pendingXPDelta += actualGain;
      if (xpWriteTimer) return;

      xpWriteTimer = ctx.addTimeout(() => {
        xpWriteTimer = 0;
        flushXP();
      }, 2000);
    }

    function awardCoins(amount) {
      if (ctx.isCompanion || ctx.freePlayMode || ctx.unlockAll || amount <= 0) return;
      const clampedAmount = Math.max(0, Math.floor(amount));
      
      const COIN_MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000];
      const storageArea = ctx.API.storage.local;
      const getCoins = typeof storageArea.get === 'function' && storageArea.get.length <= 1
        ? () => storageArea.get({ coins: 0 })
        : () => new Promise((r) => storageArea.get({ coins: 0 }, r));
      getCoins().then((data) => {
        const prev = Math.max(0, Number(data.coins) || 0);
        const next = prev + clampedAmount;
        for (let i = 0; i < COIN_MILESTONES.length; i++) {
          const m = COIN_MILESTONES[i];
          if (prev < m && next >= m && typeof ctx.onCoinMilestone === 'function') {
            ctx.onCoinMilestone(m);
            break; 
          }
        }
      }).catch(() => {});
      mutateStoredNumber('coins', clampedAmount, { defaultValue: 0, min: 0 }).then(() => {
        checkAchievements();
      });
    }

    function getQuestStorageArea() {
      const fairPlay = getFairPlay();
      if (!fairPlay || typeof fairPlay.ensure !== 'function' || typeof fairPlay.commit !== 'function') {
        return ctx.API.storage.local;
      }
      return {
        get: (defaults) => fairPlay.ensure(ctx.API.storage.local, defaults),
        set: (values) => fairPlay.commit(ctx.API.storage.local, values)
      };
    }

    function recordQuestEvent(type, amount) {
      if (ctx.isCompanion || !ctx.QuestEngine) return;

      ctx.QuestEngine.recordEvent(getQuestStorageArea(), type, amount).then((snapshot) => {
        if (snapshot.questsJustCompleted > 0) {
          awardCoins(snapshot.questsJustCompleted * 8);
          earnXP(snapshot.questsJustCompleted * 1.0); 
          if (typeof ctx.onQuestComplete === 'function') {
            ctx.onQuestComplete(snapshot.questsJustCompleted);
          }
        }
        if (snapshot.perfectDayJustUnlocked) {
          awardCoins(15);
          earnXP(3.0);
          if (typeof ctx.onPerfectDay === 'function') {
            ctx.onPerfectDay();
          }
        }
        checkAchievements();
      }).catch(() => undefined);
    }

    return {
      getLocal,
      setLocal,
      mutateStoredNumber,
      updateOwnedShopItems,
      updateActiveShopBoosts,
      hasShopBoost,
      loadXPAndShop,
      flushXP,
      earnXP,
      awardCoins,
      recordQuestEvent
    };
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
