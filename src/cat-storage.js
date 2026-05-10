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
      return typeof ctx.getActiveShopBoosts === 'function'
        ? ctx.getActiveShopBoosts().has(id)
        : ctx.getOwnedShopItems().has(id);
    }

    function loadXPAndShop() {
      if (ctx.isCompanion) return Promise.resolve();
      if (xpLoadPromise) return xpLoadPromise;
      xpLoadPromise = getLocal({ catXP: 0, shopOwned: [], shopActiveBoosts: null }).then((data) => {
        catXP = Math.min(MAX_LEVEL_XP, Math.max(0, data.catXP || 0));
        xpLoaded = true;
        const owned = Array.isArray(data.shopOwned) ? data.shopOwned : [];
        updateOwnedShopItems(owned);
        updateActiveShopBoosts(Array.isArray(data.shopActiveBoosts) ? data.shopActiveBoosts : owned);
      }).catch((error) => {
        // Do NOT reset xpLoadPromise to null here. Resetting it would allow a
        // concurrent call to start a second load which could overwrite the
        // in-memory catXP value and lose any XP earned since the failed load.
        // The promise stays rejected; callers that need a fresh load should
        // explicitly reinitialise by calling loadXPAndShop() after a delay.
        throw error;
      });
      return xpLoadPromise;
    }

    function flushXP() {
      if (xpWriteTimer) {
        try { clearTimeout(xpWriteTimer); } catch (e) {}
        xpWriteTimer = 0;
      }
      const pending = pendingXPDelta;
      if (!pending) return storageWriteQueue;
      pendingXPDelta = 0;
      return mutateStoredNumber('catXP', pending, { defaultValue: 0, min: 0, max: MAX_LEVEL_XP });
    }

    function earnXP(amount) {
      if (ctx.isCompanion) return;
      const delta = Math.max(0, Number(amount) || 0);
      if (!delta) return;

      const previousXP = catXP;
      const nextXP = Math.min(MAX_LEVEL_XP, catXP + delta);
      // Only queue the amount that was actually gained — not the full requested
      // delta — so flushXP never tries to write more XP than was earned.
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
      if (ctx.isCompanion || amount <= 0) return;
      const clampedAmount = Math.max(0, Math.floor(amount));
      mutateStoredNumber('coins', clampedAmount, { defaultValue: 0, min: 0 });
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
          earnXP(snapshot.questsJustCompleted * 1.0); // XP: +1 per quest completed
        }
        if (snapshot.perfectDayJustUnlocked) {
          awardCoins(15);
          earnXP(3.0); // XP: +3 bonus for completing all 3/3 daily quests
        }
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
