(() => {
  if (globalThis.__PixelCatContentLoaded) return;
  globalThis.__PixelCatContentLoaded = true;
  const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

var PixelCatRuntime = globalThis.__PixelCatRuntime;
if (!PixelCatRuntime) {
  PixelCatRuntime = {
    instances: [],
    fishes: [],
    spiders: [],
    webs: [],
    balls: [],
    envRects: [],
    cursorX: 0,
    cursorY: 0,
    activePickupKind: null,
  };
  Object.defineProperty(globalThis, "__PixelCatRuntime", {
    value: PixelCatRuntime,
    configurable: false,
  });
}
if (!Array.isArray(PixelCatRuntime.fishes)) PixelCatRuntime.fishes = [];
if (!Array.isArray(PixelCatRuntime.spiders)) PixelCatRuntime.spiders = [];
if (!Array.isArray(PixelCatRuntime.webs)) PixelCatRuntime.webs = [];
if (!Array.isArray(PixelCatRuntime.balls)) PixelCatRuntime.balls = [];
if (!Object.prototype.hasOwnProperty.call(PixelCatRuntime, "activePickupKind"))
  PixelCatRuntime.activePickupKind = null;

function safeSendRuntimeMessage(message, callback) {
  const cb = typeof callback === "function" ? callback : null;
  try {
    const api = typeof browser !== "undefined" ? browser : chrome;
    if (!api || !api.runtime || typeof api.runtime.sendMessage !== "function") {
      if (cb) cb();
      return undefined;
    }
    const result = api.runtime.sendMessage(message, cb);
    if (result && typeof result.catch === "function") {
      result.catch(() => { if (cb) cb(); });
    }
    return result;
  } catch (err) {
    if (cb) cb();
    return undefined;
  }
}

function sendRuntimeMessageWithResponse(message, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (resp) => {
      if (settled) return;
      settled = true;
      resolve(resp);
    };
    const api = typeof browser !== "undefined" ? browser : chrome;
    if (!api || !api.runtime || typeof api.runtime.sendMessage !== "function") {
      finish(null);
      return;
    }
    try {
      if (
        typeof browser !== "undefined" &&
        browser.runtime &&
        typeof browser.runtime.sendMessage === "function"
      ) {
        browser.runtime.sendMessage(message).then(finish, () => finish(null));
      } else if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.sendMessage === "function"
      ) {
        chrome.runtime.sendMessage(message, (resp) => {
          if (chrome.runtime.lastError) {
            finish(null);
            return;
          }
          finish(resp);
        });
      } else {
        finish(null);
      }
    } catch (_) {
      finish(null);
    }
    setTimeout(() => finish(null), timeoutMs || 4000);
  });
}



function spawnPixelCat(catId, isCompanion = false, catSkin = "white", startingState = null, startingStateTimer = 0) {
  if (!document.body) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => spawnPixelCat(catId, isCompanion, catSkin, startingState, startingStateTimer), { once: true });
    }
    return;
  }
  const existingStaleEl = document.getElementById(catId);
  if (existingStaleEl) {
    // Any real live instance is already tracked in PixelCatRuntime.instances
    // by every caller before they ever call spawnPixelCat — so an element
    // with this id still being here means it's leftover garbage (e.g. a
    // goodbye-animation destroy() that hadn't finished removing it yet).
    // Silently refusing to spawn here used to make the pet vanish entirely
    // after a window transfer that arrived during that window, since the
    // caller had no idea nothing was actually created.
    try { existingStaleEl.remove(); } catch (_) {}
  }

  const QuestEngine = globalThis.PixelCatQuests || null;
  const u = (p) => {
    try { return extensionAPI.runtime.getURL(p); } catch (e) { return p; }
  };
  var feetX, feetY;
  var velX = 0,
    velY = 0;
  var onGround = true;
  var facingLeft = isCompanion;
  var isJumping = false;
  var isDragging = false;
  var state = "sit";
  var sizeMultiplier = 1.0;
  var catEnabled = true;
  var lastFishEatenAt = 0;
  var breedingTargetX = 0;
  var breedingPartner = null;
  var breedingPhase = null;
  var jealousTarget = null;

  function startBreeding(targetX, partner) {
    if (isDestroyed || !catEnabled) return;
    breedingTargetX = targetX;
    breedingPartner = partner;
    breedingPhase = "walk";
    go("breed_approach");
  }
  var dragHandEnabled = false;
  var isPlayingGoodbye = false;
  var goodbyeHandEl = null;
  var goodbyeRafId = null;
  var goodbyeTimeoutId = null;
  var goodbyeHandX = -150;
  var goodbyeHandY = -150;
  var goodbyeHandEntryX = -150;
  var isPlayingSpawnCarry = false;
  var spawnHandEl = null;
  var spawnRafId = null;
  var spawnStartX = -150;
  var spawnStartY = -150;
  var isTabVisible = !document.hidden;
  var managedIntervals = new Set();
  var managedTimeouts = new Set();
  var draggedFish = null;
  var draggedBall = null;
  var draggedSpider = null;
  var targetFish = null;
  var targetSpider = null;
  var coinChaseTarget = null;
  var isPurring = false;
  var isDeepSleep = false;
  var catEnergy = 1.0;
  var ownedShopItems = new Set();
  var activeShopBoosts = new Set();
  var uiLanguage = "en";
  var speechEnabled = false;
  var ollamaEnabled = false;
  var memoryEnabled = true;
  var isLoyalMode = false;
  var isAggressiveMode = true;
  var wallClimbEnabled = false;
  var uiMischiefEnabled = false;
  var rareEventsEnabled = true;
  var freePlayMode = false;
  var unlockAll = false;
  var autoFishSpawnEnabled = false;
  var ballEnabled = false;
  var spiderEnabled = false;
  var lowPowerMode = false;
  var hideInFullscreen = false;
  var showOnAllTabsEnabled = false;
  var uiMischiefRate = 11;
  var catEnergyLevel = "active";
  var frogConsecutiveCroaks = 0;
  var frogIdleCooldownCycles = 0;
  var pigeonPeckCooldown = 15000;

  var pigeonGroundedByUser = false;
  var fairyGroundedByUser = false;

  var pigeonFollowsCursor = false;
  var activePet = "cat";
  var activePetStr = "cat";
  var activePetDef;
  var ANIMS;
  var spriteYOffset;

  let isDestroyed = false;
  let skipSpawnAnimation = false;
  const managedListenerCleanups = new Set();

  const safeNow = () => {
    try {
      if (
        typeof performance !== "undefined" &&
        performance &&
        typeof performance.now === "function"
      ) {
        return performance.now();
      }
    } catch (e) {}
    return Date.now();
  };

  function addManagedEventListener(target, type, listener, options) {
    if (!target || typeof target.addEventListener !== "function") {
      return () => {};
    }

    target.addEventListener(type, listener, options);

    const cleanup = () => {
      if (!managedListenerCleanups.has(cleanup)) return;
      target.removeEventListener(type, listener, options);
      managedListenerCleanups.delete(cleanup);
    };

    managedListenerCleanups.add(cleanup);
    return cleanup;
  }

  function cleanupManagedEventListeners() {
    Array.from(managedListenerCleanups).forEach((cleanup) => cleanup());
    managedListenerCleanups.clear();
  }

  const performDestroyCleanup = () => {
    if (typeof flushXP === "function") flushXP();
    catEnabled = false;
    cleanupManagedEventListeners();
    detachVideoListeners();
    cleanupSmashIntervals();
    cleanupBouncedElements();
    if (coinModule && typeof coinModule.cleanupCoinEffects === "function")
      coinModule.cleanupCoinEffects();
    removeTimeout(_resizeTimeout);
    removeTimeout(_scrollEndTimeout);
    removeTimeout(mutationScanTimeout);
    if (_scrollRaf) {
      cancelAnimationFrame(_scrollRaf);
      _scrollRaf = 0;
    }
    if (skinAnimation) {
      try {
        skinAnimation.cancel();
      } catch (e) {}
      skinAnimation = null;
    }
    if (typeof cleanupBubbleTrap === "function") cleanupBubbleTrap();
    if (typeof removeExistingQuickMenus === "function")
      removeExistingQuickMenus();
    if (typeof stopDragSync === "function") stopDragSync();
    if (catEl) catEl.remove();
    if (speechModule) speechModule.cleanup();
    cleanupAllVisualArtifacts();
    managedIntervals.forEach(clearInterval);
    managedTimeouts.forEach(clearTimeout);
    managedIntervals.clear();
    managedTimeouts.clear();
    if (rafId) cancelAnimationFrame(rafId);
    if (spiderRafId) {
      cancelAnimationFrame(spiderRafId);
      spiderRafId = null;
    }
    if (!isCompanion) {
      cleanupGlobalArtifacts();
      cleanupLevelUnlockSpeech();
    }
    const idx = PixelCatRuntime.instances.indexOf(api);
    if (idx > -1) PixelCatRuntime.instances.splice(idx, 1);
  };

  function abortSpawnCarryImmediately() {
    if (spawnRafId) {
      cancelAnimationFrame(spawnRafId);
      spawnRafId = null;
    }
    isPlayingSpawnCarry = false;
    if (spawnHandEl) {
      try { spawnHandEl.remove(); } catch (_) {}
      spawnHandEl = null;
    }
  }

  function abortGoodbyeImmediately() {
    if (goodbyeRafId) {
      cancelAnimationFrame(goodbyeRafId);
      goodbyeRafId = null;
    }
    if (goodbyeTimeoutId) {
      clearTimeout(goodbyeTimeoutId);
      goodbyeTimeoutId = null;
    }
    isPlayingGoodbye = false;
    if (goodbyeHandEl) {
      try { goodbyeHandEl.remove(); } catch (_) {}
      goodbyeHandEl = null;
    }
  }

  const api = {
    get catEl() { return catEl; },
    get isCompanion() { return isCompanion; },
    forceDropAt: function(x, y, vx, vy) {
      if (!catEl) return;
      isDragging = false;
      skipSpawnAnimation = true;
      if (typeof spawnRafId !== "undefined" && spawnRafId) {
        cancelAnimationFrame(spawnRafId);
        spawnRafId = null;
      }
      isPlayingSpawnCarry = false;
      if (typeof spawnHandEl !== "undefined" && spawnHandEl) {
        spawnHandEl.remove();
        spawnHandEl = null;
      }
      // No velocity, no fall, no throw — this is an arrival, not a physics
      // event. Snap straight to the floor under the arrival point and land
      // there already settled, with a single dust poof at that exact spot.
      // Deliberately not simulating a hop/fall here: any non-zero velocity,
      // however small, and any brief airborne period before landing, were
      // both root causes of "shot like a cannon" / "dust in mid-air".
      feetX = x;
      feetY = typeof computeFloor === "function" ? computeFloor(x) : y;
      velX = 0;
      velY = 0;
      isJumping = false;
      onGround = true;

      applyTransform();

      catEl.style.setProperty("visibility", "visible", "important");
      catEl.style.setProperty("opacity", "1", "important");
      catEl.style.setProperty("display", "block", "important");

      if (typeof spawnDust === "function") spawnDust(feetX, feetY, true);
      if (typeof go === "function") go("idle");
    },
    forceGrab: function() {
      if (!catEl) return;
      isDragging = true;
      go("dragged");
      catDragOffsetX = catEl.offsetWidth / 2;
      catDragOffsetY = catEl.offsetHeight / 2;
    },
    spawnDustPuff: function(x, y) {
      if (typeof spawnDust === "function") spawnDust(x, y, true);
    },
    get isPlayingGoodbye() {
      return isPlayingGoodbye;
    },
    cancelGoodbye: function () {
      cancelGoodbyeAnimation();
    },
    get feetX() {
      return feetX;
    },
    get feetY() {
      return feetY;
    },
    get velY() {
      return velY;
    },
    get state() {
      return state;
    },
    get catId() {
      return catId;
    },
    get isSpeaking() {
      return typeof speechModule !== "undefined" && speechModule ? speechModule.speechVisible : false;
    },
    get bubbleTrapActive() {
      return !!(bubbleTrap && bubbleTrap.active);
    },
    get bubbleTrapPopping() {
      return !!(bubbleTrap && bubbleTrap.popping);
    },
    get bubbleTrapTrapped() {
      return !!(bubbleTrap && bubbleTrap.trapped);
    },
    get bubbleTrapX() {
      return bubbleTrap ? bubbleTrap.x : 0;
    },
    get bubbleTrapY() {
      return bubbleTrap ? bubbleTrap.y : 0;
    },
    get bubbleTrapWidth() {
      return bubbleTrap ? bubbleTrap.width : 0;
    },
    get bubbleTrapHeight() {
      return bubbleTrap ? bubbleTrap.height : 0;
    },
    popBubbleTrap: function () {
      if (typeof popBubbleTrap === "function") popBubbleTrap();
    },
    get sizeMultiplier() {
      return sizeMultiplier;
    },
    get isJumping() {
      return isJumping;
    },
    get targetFish() {
      return targetFish;
    },
    set facingLeft(val) {
      facingLeft = val;
      applyTransform();
    },
    get facingLeft() {
      return facingLeft;
    },
    get feetX() {
      return feetX;
    },
    get feetY() {
      return feetY;
    },
    get lastFishEatenAt() {
      return lastFishEatenAt;
    },
    startBreeding: function (targetX, partner) {
      startBreeding(targetX, partner);
    },
    go: function (s) {
      go(s);
    },
    pushBy: function (vx) {
      velX += vx;
    },
    knockbackFrom: function (sourceX, power) {
      const dir = feetX >= sourceX ? 1 : -1;
      velX = dir * Math.max(260, Number(power) || 420);
      velY = Math.min(velY, JUMP_V * 0.45);
      onGround = false;
      isJumping = true;
      setAnimLocked("scared", 650);
    },
    destroy: function () {
      if (isDestroyed) return;
      if (isPlayingSpawnCarry) {
        abortSpawnAndCarryOut(performDestroyCleanup);
      } else {
        playGoodbyeAnimation(performDestroyCleanup);
      }
    },
    destroyInstant: function () {
      if (isDestroyed) return;
      abortSpawnCarryImmediately();
      abortGoodbyeImmediately();
      performDestroyCleanup();
    },
    isCompanion: isCompanion,
    updateSettings: function (settings) {
      settings = sanitizeRuntimeSettings(settings) || {};
      if (settings.showOnAllTabs !== undefined) {
        showOnAllTabsEnabled = settings.showOnAllTabs === true;
      }
      if (settings.loyalMode !== undefined) {
        isLoyalMode = settings.loyalMode;
        if (isLoyalMode && state === "sit") {
          go("loyal_follow");
        } else if (!isLoyalMode && state === "loyal_follow") {
          go("sit");
        }
      }
      if (settings.aggressiveMode !== undefined) {
        isAggressiveMode = settings.aggressiveMode;
      }
      if (settings.wallClimbEnabled !== undefined) {
        wallClimbEnabled = settings.wallClimbEnabled;
        if (!wallClimbEnabled && (state === "wall_left" || state === "wall_right" || state === "wall_left_sit" || state === "wall_right_sit" || state === "ninja_climb")) {
          go("sit");
        }
      }
      if (settings.uiMischiefEnabled !== undefined) {
        uiMischiefEnabled = settings.uiMischiefEnabled;
      }
      if (settings.speechEnabled !== undefined) {
        speechEnabled = settings.speechEnabled;
        if (!speechEnabled && speechModule) hideSpeechBubble();
      }
      if (settings.ollamaEnabled !== undefined) {
        ollamaEnabled = settings.ollamaEnabled;
      }
      if (settings.memoryEnabled !== undefined) {
        memoryEnabled = settings.memoryEnabled;
      }
      if (settings.rareEventsEnabled !== undefined) {
        const wasRareEventsEnabled = rareEventsEnabled;
        rareEventsEnabled = settings.rareEventsEnabled;
        if (!rareEventsEnabled && bubbleTrap && bubbleTrap.active) {
          releaseFromBubbleTrap();
        } else if (!wasRareEventsEnabled && rareEventsEnabled) {
          
          bubbleSpawnTimer = randomBubbleTrapDelay(
            BUBBLE_RETRY_DELAY_MIN,
            BUBBLE_RETRY_DELAY_MAX,
          );
          lastBubbleTrapEndedAt = 0;
        }
      }
      if (settings.autoFishSpawnEnabled !== undefined) {
        autoFishSpawnEnabled = settings.autoFishSpawnEnabled;
      }
      if (settings.lowPowerMode !== undefined) {
        lowPowerMode = settings.lowPowerMode;
        applyPowerModeSettings();
      }
      if (settings.hideInFullscreen !== undefined) {
        hideInFullscreen = settings.hideInFullscreen;
        if (typeof updateFullscreenVisibility === "function")
          updateFullscreenVisibility();
      }
      if (settings.dragHandEnabled !== undefined) {
        dragHandEnabled = settings.dragHandEnabled;
        if (spawnHandEl) spawnHandEl.style.display = dragHandEnabled === true ? "" : "none";
        if (goodbyeHandEl) goodbyeHandEl.style.display = dragHandEnabled === true ? "" : "none";
      }
      if (settings.freePlayMode !== undefined) {
        freePlayMode = settings.freePlayMode;
      }
      if (settings.unlockAll !== undefined) {
        unlockAll = settings.unlockAll;
      }
      if (settings.uiMischiefRate !== undefined) {
        uiMischiefRate = settings.uiMischiefRate;
      }
      if (settings.speedMultiplier !== undefined) {
        speedMultiplier = settings.speedMultiplier;
        updateSpeed();
      }
      if (settings.sizeMultiplier !== undefined) {
        applySizeMultiplier(settings.sizeMultiplier);
      }
      if (settings.activePet !== undefined) {
        applyPet(settings.activePet);
      }
      if (settings.catSkin !== undefined) {
        catSkinStr = normalizeCatSkin(settings.catSkin);
        if (activePet !== "fox" && activePet !== "red_panda" && !isPigeonPet())
          applySkin(resolveCatSkin(catSkinStr));
      }
      if (settings.foxSkin !== undefined) {
        foxSkinStr = normalizeFoxSkin(settings.foxSkin);
        if (activePet === "fox" || activePet === "red_panda")
          applySkin(resolveFoxSkin(foxSkinStr));
      }
      if (settings.pigeonSkin !== undefined) {
        pigeonSkinStr = normalizePigeonSkin(settings.pigeonSkin);
        if (isPigeonPet())
          applySkin(resolvePigeonSkin(pigeonSkinStr));
      }
      if (settings.ballEnabled !== undefined) {
        ballEnabled = settings.ballEnabled;
      }
      if (settings.activeBall !== undefined) {
        _activeBallId = settings.activeBall;
      }
      if (settings.activeHat !== undefined) {
        _activeHatId = settings.activeHat;
      }
      if (settings.spiderEnabled !== undefined) {
        spiderEnabled = settings.spiderEnabled;
      }
      if (settings.portalEnabled !== undefined) {
        portalEnabled = settings.portalEnabled;
        if (!portalEnabled && typeof cleanupPortals === "function") {
          cleanupPortals();
        }
        if (portalEnabled) {
          portalSpawnTimer = 90 + Math.random() * 90;
        }
      }
      if (settings.catEnergyLevel !== undefined) {
        catEnergyLevel = settings.catEnergyLevel;
        applyEnergyLevel();
      }
      if (settings.uiLanguage !== undefined) {
        uiLanguage = settings.uiLanguage;
        if (speechModule && speechModule.markSpeechMeasure)
          speechModule.markSpeechMeasure();
      }
      if (settings.shopOwned !== undefined) {
        updateOwnedShopItems(settings.shopOwned);
      }
      if (settings.shopActiveBoosts !== undefined) {
        updateActiveShopBoosts(settings.shopActiveBoosts);
      }
      if (isPigeonPet()) {
        enforcePigeonRestrictions();
      }
      if (isClippyPet()) {
        enforceClippyRestrictions();
      }
      if (isFrogPet()) {
        enforceFrogRestrictions();
        applyFrogHat();
      }
      if (lowPowerMode) {
        applyEcoRuntimeRestrictions();
      }
    },
    clearSpeechMemory: function () {
      if (typeof clearSpeechMemory === "function") {
        clearSpeechMemory();
      }
    },
  };

  function applyEnergyLevel() {
    updateSpeed();
    catEnergy =
      catEnergyLevel === "sleepy"
        ? 0.2
        : catEnergyLevel === "hyper"
          ? 0.85
          : 0.6;
  }

  const missingPixelCatModules = [
    "PixelCatStorage",
    "PixelCatCoins",
    "PixelCatFish",
    "PixelCatBalls",
    "PixelCatPortals",
  ].filter((name) => typeof window[name] !== "function");
  if (missingPixelCatModules.length) return;

  const levelUnlockSpeechQueue = [];
  let levelUnlockSpeechActive = false;
  let levelUnlockSpeechTimer = 0;

  function getLevelReachedSpeechText(detail) {
    const language = uiLanguage || "en";
    const level = Math.max(1, Number(detail && detail.level) || 1);

    if (language === "fr") return `⭐ Niveau ${level} atteint !`;
    if (language === "it") return `⭐ Livello ${level} raggiunto!`;
    if (language === "ar") return `⭐ وصلت للمستوى ${level}!`;
    return `⭐ Level ${level} reached!`;
  }

  function getLevelUnlockSpeechText(detail) {
    const language = uiLanguage || "en";
    const level = Math.max(1, Number(detail && detail.level) || 1);

    const shortMessages = {
      en: {
        2: "Speech and ball.",
        3: "Spiders unlocked now.",
        4: "Size control unlocked.",
        5: "Companion mode unlocked.",
        6: "Page mischief unlocked.",
        7: "Portals unlocked now.",
        8: "Hyper mode unlocked.",
        9: "Final badge unlocked.",
        10: "Max level reached.",
      },
      fr: {
        2: "Dialogue et balle.",
        3: "Araignées débloquées maintenant.",
        4: "Contrôle taille débloqué.",
        5: "Mode compagnon débloqué.",
        6: "Bêtises débloquées maintenant.",
        7: "Portails débloqués maintenant.",
        8: "Mode hyper débloqué.",
        9: "Badge final débloqué.",
        10: "Niveau maximum atteint.",
      },
      it: {
        2: "Fumetti e palla.",
        3: "Ragni sbloccati ora.",
        4: "Dimensione sbloccata.",
        5: "Compagno sbloccato.",
        6: "Dispetti pagina sbloccati.",
        7: "Portali sbloccati ora.",
        8: "Modalità iper sbloccata.",
        9: "Badge finale sbloccato.",
        10: "Livello massimo raggiunto.",
      },
      ar: {
        2: "الكلام والكرة مفتوحان.",
        3: "العناكب صارت مفتوحة.",
        4: "التحكم بالحجم مفتوح.",
        5: "وضع الرفيق مفتوح.",
        6: "العبث بالصفحة مفتوح.",
        7: "البوابات صارت مفتوحة.",
        8: "الوضع الفائق مفتوح.",
        9: "شارة النهاية مفتوحة.",
        10: "وصلت لأقصى مستوى.",
      },
    };

    return (
      (shortMessages[language] && shortMessages[language][level]) ||
      shortMessages.en[level] ||
      (language === "fr"
        ? "Nouvelle fonction débloquée."
        : language === "it"
          ? "Nuova funzione sbloccata."
          : language === "ar"
            ? "تم فتح ميزة جديدة."
            : "New feature unlocked.")
    );
  }

  var notificationQueue = [];
  var notificationActive = false;
  var notificationTimer = 0;

  function showNextNotification() {
    if (notificationActive || !notificationQueue.length || isDestroyed || isCompanion)
      return;
    if (!speechModule || typeof speechModule.showSpeech !== "function") return;

    notificationActive = true;
    const item = notificationQueue.shift();
    speechModule.showSpeech(item.text, {
      force: true,
      notification: true,
      durationMs: item.durationMs || 4500,
      cooldownMs: 0,
    });

    notificationTimer = addTimeout(() => {
      notificationActive = false;
      notificationTimer = 0;
      showNextNotification();
    }, (item.durationMs || 4500) + 400);
  }

  function queueNotification(text, durationMs) {
    if (isCompanion || isDestroyed || !text) return;
    notificationQueue.push({ text, durationMs: durationMs || 4500 });
    showNextNotification();
  }

  function queueLevelUnlockSpeech(detail) {
    if (isCompanion || !detail || isDestroyed) return;

    velY = JUMP_V * 0.8;
    onGround = false;
    isJumping = true;
    setAnim("jump", true);
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        spawnHeart(feetX + (Math.random() * 60 - 30), feetY - 20 - Math.random() * 40);
      }, i * 200);
    }
  }

  function getQuestCompleteSpeechText() {
    const language = uiLanguage || "en";
    if (language === "fr") return "Quête accomplie !";
    if (language === "it") return "Missione completata!";
    if (language === "ar") return "المهمة اكتملت!";
    return "Quest complete!";
  }

  function getPerfectDaySpeechText() {
    const language = uiLanguage || "en";
    if (language === "fr") return "Journée parfaite !";
    if (language === "it") return "Giornata perfetta!";
    if (language === "ar") return "يوم مثالي!";
    return "Perfect day!";
  }

  function getCoinMilestoneSpeechText(coins) {
    const language = uiLanguage || "en";
    if (language === "fr") return `${coins} pièces !`;
    if (language === "it") return `${coins} monete!`;
    if (language === "ar") return `${coins} عملة!`;
    return `${coins} coins!`;
  }

  function getAchievementSpeechText(name) {
    return name;
  }

  function cleanupLevelUnlockSpeech() {
    notificationQueue.length = 0;
    notificationActive = false;
    if (notificationTimer) {
      removeTimeout(notificationTimer);
      notificationTimer = 0;
    }
    levelUnlockSpeechQueue.length = 0;
    levelUnlockSpeechActive = false;
    if (levelUnlockSpeechTimer) {
      removeTimeout(levelUnlockSpeechTimer);
      levelUnlockSpeechTimer = 0;
    }
  }

  const storageModule = window.PixelCatStorage({
    API: extensionAPI,
    FairPlay: globalThis.PixelCatFairPlay || null,
    QuestEngine,
    get isCompanion() {
      return isCompanion;
    },
    addTimeout: (fn, ms) => addTimeout(fn, ms),
    onLevelUnlock: (detail) => queueLevelUnlockSpeech(detail),
    onQuestComplete: (count) => {
      
      if (isCompanion || isDestroyed) return;
      
    },
    onPerfectDay: () => {
      if (isCompanion || isDestroyed) return;
      queueNotification(getPerfectDaySpeechText(), 5000);
    },
    onCoinMilestone: (coins) => {
      if (isCompanion || isDestroyed) return;
      queueNotification(getCoinMilestoneSpeechText(coins), 4000);
    },
    onAchievement: (name) => {
      if (isCompanion || isDestroyed) return;
      queueNotification(getAchievementSpeechText(name), 5000);
    },
    getOwnedShopItems: () => ownedShopItems,
    setOwnedShopItems: (items) => {
      ownedShopItems = new Set(items);
      activeShopBoosts = new Set(
        Array.from(activeShopBoosts).filter((id) => ownedShopItems.has(id)),
      );
    },
    getActiveShopBoosts: () => activeShopBoosts,
    setActiveShopBoosts: (items) => {
      activeShopBoosts = new Set(
        (Array.isArray(items) ? items : []).filter((id) =>
          ownedShopItems.has(id),
        ),
      );
    },
    get freePlayMode() {
      return freePlayMode || unlockAll;
    },
    get unlockAll() {
      return unlockAll || freePlayMode;
    },
  });
  const {
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
    recordQuestEvent,
  } = storageModule;

  const CAT_SHEET = u("assets/animations/cat.png");
  const FOX_SHEET = u("assets/animations/fox.png");
  const FROG_SHEET = u("assets/animations/frog/frog_green_spritesheet.png");
  const SKELETON_SHEET = u("assets/animations/skeleton.png");
  const PENGUIN_SHEET = u("assets/animations/penguin.png");
  const RED_PANDA_SHEET = u("assets/animations/Red-Panda.png");
  const FAIRY_SHEET = u("assets/animations/fairy.png");
  const PIGEON_SHEET = u("assets/animations/pigeon.png");
  const BAT_SHEET = u("assets/animations/bat/BatStandard_Sheet.png");
  const BAT_VAMPIRE_SHEET = u("assets/animations/bat/BatVampire_Sheet.png");
  const BAT_ZOMBIE_SHEET = u("assets/animations/bat/BatZombie_Sheet.png");
  const CELL = 32;
  const SCALE = 2.5;
  const VIS = CELL * SCALE; 

  function clampSizeMultiplier(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 1.0;
    return Math.max(0.5, Math.min(2.5, Math.round(num * 10) / 10));
  }

  function getPetRenderScale() {
    return (activePetDef && Number(activePetDef.renderScale)) || 1;
  }

  function getCatVisualScale() {
    return SCALE * sizeMultiplier * getPetRenderScale();
  }

  function getActiveCell() {
    return (activePetDef && activePetDef.cell) || CELL;
  }

  function updateCatElementSize() {
    if (!catEl || !activePetDef) return;
    const vs = getCatVisualScale();
    const cellW = activePetDef.cssWidth || getActiveCell();
    const cellH = activePetDef.cssHeight || getActiveCell();
    const isClippy = activePetDef === PET_DEFS.clippy;
    const scaledW = isClippy ? (cellW * vs) : Math.round(cellW * vs);
    const scaledH = isClippy ? (cellH * vs) : Math.round(cellH * vs);
    
    // For non-clippy pets, the sprite sheet grid uses getActiveCell() (e.g. 32x32), not cssWidth/cssHeight.
    const gridW = isClippy ? cellW : getActiveCell();
    const gridH = isClippy ? cellH : getActiveCell();
    
    const sheetW = isClippy ? (activePetDef.cols * gridW * vs) : Math.round(activePetDef.cols * gridW * vs);
    const sheetH = isClippy ? (activePetDef.rows * gridH * vs) : Math.round(activePetDef.rows * gridH * vs);
    if (catEl) {
      catEl.style.setProperty("width", `${scaledW}px`, "important");
      catEl.style.setProperty("height", `${scaledH}px`, "important");
      catEl.style.setProperty("background-size", `${sheetW}px ${sheetH}px`, "important");
      catEl.style.setProperty("background-repeat", "no-repeat", "important");
      catEl.style.setProperty("overflow", "hidden", "important");
      catEl.style.setProperty("display", "block", "important");
    }
    
    _lastBgX = -9999;
    _lastBgY = -9999;
  }

  function applySizeMultiplier(value) {
    sizeMultiplier = clampSizeMultiplier(value);
    document.documentElement.style.setProperty(
      "--pixelcat-size",
      sizeMultiplier.toFixed(1),
    );
    updateCatElementSize();
    clampCatInsideViewport();
    lastTransformStr = "";
    lastTransformOriginStr = "";
    markSpeechMeasure();
    applyTransform();
    positionSpeechBubble(true);
    if (typeof refreshBubbleTrapScale === "function") refreshBubbleTrapScale();
  }

  function getCatRenderedWidth() {
    return (
      ((activePetDef && activePetDef.cssWidth) || getActiveCell()) *
      SCALE *
      sizeMultiplier *
      getPetRenderScale()
    );
  }

  function getPetAnchorY() {
    if (isPigeonPet()) {
      return 22;
    }
    return (
      (activePetDef && Number(activePetDef.anchorY)) ||
      (activePetDef && Number(activePetDef.cssHeight)) ||
      26
    );
  }

  function getPetWallAnchorY() {
    return (
      (activePetDef && Number(activePetDef.wallAnchorY)) ||
      Math.max(12, getPetAnchorY() / 2)
    );
  }

  function getSideWallMargin() {
    return Math.max(10, getCatRenderedWidth() / 2 + 4);
  }

  function getWallClimbMargin() {
    const vs = getCatVisualScale();
    const cellH = ((activePetDef && activePetDef.cssHeight) || getActiveCell()) * vs;
    const anchorY = Math.round(getPetWallAnchorY() * vs);

    return Math.round(cellH - anchorY - 3);
  }

  function getWallAttachX(side) {
    const margin = getWallClimbMargin();
    return side === "left" ? margin : _vw - margin;
  }

  function getPlatformInset(r) {
    const width = r ? r.right - r.left : 0;
    const scaledInset = Math.max(8, Math.min(44, getCatRenderedWidth() * 0.28));
    if (!width) return scaledInset;
    return Math.min(scaledInset, Math.max(8, width * 0.28));
  }

  function getPlatformSnapTolerance() {
    return Math.max(8, Math.min(18, 6 + sizeMultiplier * 4));
  }

  function getPlatformAttachTolerance() {
    return Math.max(20, Math.min(34, 18 + sizeMultiplier * 5));
  }

  function getPlatformStandLift() {
    return Math.max(2, Math.min(6, Math.round(2 + sizeMultiplier * 1.5)));
  }

  function getPlatformStandY(r) {
    return r ? Math.round(r.top - getPlatformStandLift()) : _vh;
  }

  function isCalmGroundedStateName(name) {
    return (
      name === "sit" ||
      name === "stare" ||
      name === "groom" ||
      name === "stretch" ||
      name === "pawplay" ||
      name === "headtilt" ||
      name === "nap" ||
      name === "deepsleep"
    );
  }

  function clampCatInsideViewport() {
    const margin = getSideWallMargin();
    if (state === "wall_left" || state === "wall_left_sit")
      feetX = getWallAttachX("left");
    else if (state === "wall_right" || state === "wall_right_sit")
      feetX = getWallAttachX("right");
    else feetX = Math.max(margin, Math.min(_vw - margin, feetX));

    if (isClippyPet() && feetY > _vh - 35) {
      feetY = Math.round(_vh - 35);
    }
  }

  let _vw = window.innerWidth;
  let _vh = window.innerHeight;
  let _resizeRaf = 0;
  let _resizeTimeout = null;
  addManagedEventListener(
    window,
    "resize",
    () => {
      if (_resizeRaf) return;
      _resizeRaf = requestAnimationFrame(() => {
        _vw = window.innerWidth;
        _vh = window.innerHeight;
        _resizeRaf = 0;
        clampCatInsideViewport();
        markSpeechMeasure();

        removeTimeout(_resizeTimeout);
        _resizeTimeout = addTimeout(() => scheduleEnvScan(0), 300);
      });
    },
    { passive: true },
  );

  function isUniversalFullscreenActive() {
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      document.webkitIsFullScreen ||
      document.mozFullScreen
    ) {
      return true;
    }

    try {
      const allElements = document.querySelectorAll('*');
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        if (el.shadowRoot) {
          if (
            el.shadowRoot.fullscreenElement ||
            (typeof el.shadowRoot.webkitFullscreenElement !== 'undefined' && el.shadowRoot.webkitFullscreenElement)
          ) {
            return true;
          }
        }
      }
    } catch (_) {}

    if (typeof window.fullScreen !== "undefined" && window.fullScreen === true) {
      return true;
    }

    if (
      window.innerHeight === screen.height ||
      (screen.availHeight && window.innerHeight >= screen.availHeight - 1)
    ) {
      return true;
    }

    try {
      if (document.querySelector(":fullscreen, :-webkit-full-screen, :-moz-full-screen, :-ms-fullscreen")) {
        return true;
      }
    } catch (_) {}

    if (
      document.querySelector(
        ".ytp-fullscreen, .html5-video-player.ytp-fullscreen, .video-player--fullscreen, .vjs-fullscreen, .is-fullscreen, [data-a-player-type='fullscreen']"
      )
    ) {
      return true;
    }

    try {
      const videos = document.querySelectorAll('video');
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const rect = video.getBoundingClientRect();
          if (
            rect.width >= window.innerWidth - 10 &&
            rect.height >= window.innerHeight - 10 &&
            rect.top <= 10 &&
            rect.left <= 10
          ) {
            return true;
          }
        }
      }
    } catch (_) {}

    return false;
  }

  function updateFullscreenVisibility() {
    const isFS = isUniversalFullscreenActive();
    const shouldHide = !!(hideInFullscreen && isFS);
    if (shouldHide) {
      if (document.body) document.body.classList.add("pixelcat-hidden-fullscreen");
      if (document.documentElement) document.documentElement.classList.add("pixelcat-hidden-fullscreen");
    } else {
      if (document.body) document.body.classList.remove("pixelcat-hidden-fullscreen");
      if (document.documentElement) document.documentElement.classList.remove("pixelcat-hidden-fullscreen");
    }
  }

  [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
    "resize",
    "visibilitychange"
  ].forEach((evt) => {
    addManagedEventListener(document, evt, updateFullscreenVisibility);
    addManagedEventListener(window, evt, updateFullscreenVisibility);
  });

  const FLOOR_Y = () => _vh;

  const CAT_ANIMS = {
    idle1: { row: 0, fr: 4, fps: 2 },
    idle2: { row: 1, fr: 4, fps: 2 },
    clean1: { row: 2, fr: 4, fps: 3 },
    clean2: { row: 3, fr: 4, fps: 3 },
    walk: { row: 4, fr: 8, fps: 8 },
    run: { row: 5, fr: 8, fps: 9 },
    sleep: { row: 6, fr: 4, fps: 1.5 },
    paw: { row: 7, fr: 6, fps: 14 },
    jump: { row: 8, fr: 7, fps: 10 },
    scared: { row: 9, fr: 8, fps: 6 },
  };

  const FOX_ANIMS = {
    idle1: { row: 0, fr: 5, fps: 2.5 },
    idle2: { row: 1, fr: 14, fps: 7 },
    
    clean1: { row: 1, fr: 14, fps: 7 },
    clean2: { row: 1, fr: 14, fps: 7 },
    walk: { row: 2, fr: 8, fps: 8 },
    run: { row: 2, fr: 8, fps: 11 },
    
    jump: { row: 2, fr: 8, fps: 10 },
    catch: { row: 3, fr: 11, fps: 14 },
    paw: { row: 3, fr: 11, fps: 11 },
    scared: { row: 4, fr: 5, fps: 6 },
    sleep: { row: 5, fr: 6, fps: 1.5 },
    death: { row: 6, fr: 8, fps: 8 },
  };

  const RED_PANDA_ANIMS = {
    idle1: { row: 0, fr: 6, fps: 6 },
    idle2: { row: 1, fr: 6, fps: 6 },
    
    clean1: { row: 1, fr: 6, fps: 6 },
    clean2: { row: 1, fr: 6, fps: 6 },
    walk: { row: 2, fr: 8, fps: 8 },
    run: { row: 2, fr: 8, fps: 11 },
    jump: { row: 2, fr: 8, fps: 10 },
    paw: { row: 3, fr: 8, fps: 10 },
    scared: { row: 4, fr: 5, fps: 6 },
    death: { row: 5, fr: 8, fps: 8 },
    sleep: { row: 6, fr: 8, fps: 1.5 },
  };

  const PIGEON_ANIMS = {
    idle1: { row: 0, fr: 4, fps: 4 },
    idle2: { row: 2, fr: 4, fps: 6 },
    sit: { row: 0, fr: 4, fps: 4 },
    sleep: { row: 0, fr: 4, fps: 1.5 },
    walk: { row: 1, fr: 4, fps: 8 },
    run: { row: 1, fr: 4, fps: 8 },
    jump: { row: 3, fr: 4, fps: 8 },
    land: { row: 0, fr: 4, fps: 5 },
    prepare: { row: 0, fr: 4, fps: 5 },
    paw: { row: 2, fr: 4, fps: 6 },
    scared: { row: 3, fr: 4, fps: 8 },
    drag: { row: 3, fr: 4, fps: 8 },
    fly: { row: 3, fr: 4, fps: 8 },
    toss: { row: 3, fr: 4, fps: 8 },
    falling: { row: 3, fr: 4, fps: 8 },
    clean1: { row: 2, fr: 4, fps: 6 },
    clean2: { row: 2, fr: 4, fps: 6 },
    eat: { row: 2, fr: 4, fps: 6 },
    hurt: { row: 3, fr: 4, fps: 8 },
    stare: { row: 0, fr: 4, fps: 4 },
    pawplay: { row: 2, fr: 4, fps: 6 },
    stretch: { row: 2, fr: 4, fps: 6 },
    pounce: { row: 1, fr: 4, fps: 8 },
  };

  const FROG_ANIMS = {
    idle1:  { col: 0, row: 0, fr: 2, fps: 2.5, vertical: true },
    idle2:  { col: 0, row: 0, fr: 3, fps: 5,   noLoop: true, vertical: true },
    walk:   { col: 4, row: 0, fr: 4, fps: 7,   vertical: true },
    jump:   { col: 2, row: 0, fr: 10, frames: [2, 1, 0, 0, 0, 0, 1, 1, 2, 3], fps: 11, vertical: true },
    run:    { col: 2, row: 0, fr: 10, frames: [2, 1, 0, 0, 0, 0, 1, 1, 2, 3], fps: 11, vertical: true },
    fly:    { col: 4, row: 0, fr: 4, fps: 7,   vertical: true },
    clean1: { col: 1, row: 0, fr: 4, fps: 5,   vertical: true },
    clean2: { col: 1, row: 0, fr: 4, fps: 5,   vertical: true },
    eat:    { col: 1, row: 0, fr: 4, fps: 5,   vertical: true },
    paw:    { col: 3, row: 2, fr: 2, fps: 2,   vertical: true },
    scared: { col: 3, row: 0, fr: 2, fps: 6,   vertical: true },
    sleep:  { col: 0, row: 0, fr: 2, fps: 1.5, vertical: true },
  };

  const SKELETON_ANIMS = {
    idle1: { row: 0, fr: 1, fps: 1 },
    idle2: { row: 1, fr: 9, fps: 5 },
    clean1: { row: 3, fr: 4, fps: 7 },
    clean2: { row: 3, fr: 4, fps: 7 },
    walk: { row: 4, fr: 6, fps: 8 },
    run: { row: 4, fr: 6, fps: 11 },
    prepare: { row: 5, fr: 3, fps: 9 },
    jump: { row: 6, fr: 1, fps: 8 },
    land: { row: 7, fr: 2, fps: 10 },
    hurt: { row: 8, fr: 2, fps: 8 },
    toss: { row: 9, fr: 5, fps: 10 },
    bone: { row: 10, fr: 4, fps: 12 },
    crumple: { row: 11, fr: 7, fps: 8, noLoop: true },
    pile: { row: 12, fr: 1, fps: 2 },
    wake: { row: 13, fr: 7, fps: 8, noLoop: true },
    inactive: { row: 14, fr: 1, fps: 1 },
    paw: { row: 9, fr: 4, fps: 10, frames: [0, 2, 3, 4] },
    scared: { row: 8, fr: 2, fps: 8 },
    sleep: { row: 12, fr: 1, fps: 2 },
    death: { row: 11, fr: 7, fps: 8 },
  };

  const PENGUIN_ANIMS = {
    idle1: { row: 0, fr: 5, fps: 4 },
    idle2: { row: 13, fr: 2, fps: 2 },
    clean1: { row: 11, fr: 1, fps: 2 },
    clean2: { row: 14, fr: 1, fps: 2 },
    walk: { row: 1, fr: 6, fps: 8 },
    run: { row: 5, fr: 3, fps: 11 },
    jump: { row: 2, fr: 1, fps: 8 },
    land: { row: 3, fr: 1, fps: 8 },
    paw: { row: 7, fr: 5, fps: 10 },
    scared: { row: 9, fr: 1, fps: 6 },
    hurt: { row: 8, fr: 1, fps: 6 },
    sleep: { row: 15, fr: 1, fps: 1 },
    lying: { row: 15, fr: 1, fps: 1 },
    sit: { row: 4, fr: 2, fps: 2 },
    swim: { row: 6, fr: 4, fps: 7 },
    victory: { row: 7, fr: 5, fps: 10 },
    slide: { row: 5, fr: 3, fps: 11 },
    falling: { row: 3, fr: 1, fps: 8 },
    standing: { row: 12, fr: 1, fps: 2 },
    ducking: { row: 11, fr: 1, fps: 2 },
    blink: { row: 10, fr: 1, fps: 2 },
  };

  // Bat sheet layout (7 cols x 5 rows of 32x32 cells):
  //   row 0: Flying (4 frames)
  //   row 1: Attack (6 frames)
  //   row 2: Hurt  (4 frames)
  //   row 3: Death (7 frames)
  //   row 4: Sleeping (1 frame)
  const BAT_ANIMS = {
    idle1: { row: 0, fr: 4, fps: 5 },
    idle2: { row: 0, fr: 4, fps: 6 },
    clean1: { row: 0, fr: 4, fps: 6 },
    clean2: { row: 0, fr: 4, fps: 6 },
    walk: { row: 0, fr: 4, fps: 8 },
    run: { row: 0, fr: 4, fps: 11 },
    jump: { row: 0, fr: 4, fps: 10 },
    land: { row: 0, fr: 4, fps: 8 },
    fly: { row: 0, fr: 4, fps: 12 },
    catch: { row: 1, fr: 6, fps: 12 },
    paw: { row: 1, fr: 6, fps: 10 },
    pounce: { row: 1, fr: 6, fps: 12 },
    prepare: { row: 1, fr: 6, fps: 9 },
    eat: { row: 1, fr: 6, fps: 8 },
    scared: { row: 2, fr: 4, fps: 8 },
    hurt: { row: 2, fr: 4, fps: 8 },
    drag: { row: 2, fr: 4, fps: 8 },
    falling: { row: 0, fr: 4, fps: 8 },
    sleep: { row: 4, fr: 1, fps: 1 },
    death: { row: 3, fr: 7, fps: 8, noLoop: true },
  };

window.CLIPPY_DATA = {"overlayCount": 1, "sounds": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"], "framesize": [124, 93], "animations": {"Congratulate": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 10, "images": [[124, 0]]}, {"duration": 10, "images": [[248, 0]]}, {"duration": 10, "images": [[372, 0]], "sound": "14"}, {"duration": 10, "images": [[496, 0]]}, {"duration": 10, "images": [[620, 0]]}, {"duration": 10, "images": [[744, 0]]}, {"duration": 10, "images": [[868, 0]]}, {"duration": 10, "images": [[992, 0]], "sound": "1"}, {"duration": 100, "images": [[1116, 0]]}, {"duration": 100, "images": [[1240, 0]]}, {"duration": 100, "images": [[1364, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1612, 0]], "sound": "10"}, {"duration": 100, "images": [[1736, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1860, 0]]}, {"duration": 100, "images": [[1984, 0]]}, {"duration": 100, "images": [[2108, 0]]}, {"duration": 100, "images": [[2232, 0]]}, {"duration": 100, "images": [[2356, 0]], "exitBranch": 21}, {"duration": 100, "images": [[0, 0]]}]}, "LookRight": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[620, 651]], "exitBranch": 5}, {"duration": 100, "images": [[744, 651]], "exitBranch": 4}, {"duration": 1200, "images": [[868, 651]]}, {"duration": 100, "images": [[992, 651]]}, {"duration": 100, "images": [[1116, 651]]}, {"duration": 100, "images": [[0, 0]]}]}, "SendMail": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1240, 1209]]}, {"duration": 100, "images": [[1364, 1209]]}, {"duration": 100, "images": [[1488, 1209]]}, {"duration": 100, "images": [[1612, 1209]]}, {"duration": 100, "images": [[1736, 1209]]}, {"duration": 100, "images": [[1860, 1209]]}, {"duration": 100, "images": [[1984, 1209]]}, {"duration": 100, "images": [[2108, 1209]]}, {"duration": 100, "images": [[2232, 1209]]}, {"duration": 100, "images": [[2356, 1209]]}, {"duration": 100, "images": [[2480, 1209]]}, {"duration": 100, "images": [[2604, 1209]]}, {"duration": 100, "images": [[2728, 1209]]}, {"duration": 100, "images": [[2852, 1209]]}, {"duration": 100, "images": [[2976, 1209]]}, {"duration": 100, "images": [[3100, 1209]]}, {"duration": 100, "images": [[3224, 1209]]}, {"duration": 100, "images": [[0, 1302]]}, {"duration": 100, "images": [[124, 1302]]}, {"duration": 100, "images": [[248, 1302]]}, {"duration": 100, "images": [[372, 1302]], "sound": "14"}, {"duration": 100, "images": [[496, 1302]], "exitBranch": 24}, {"duration": 100, "images": [[620, 1302]]}, {"duration": 100, "images": [[744, 1302]], "exitBranch": 26}, {"duration": 100, "images": [[868, 1302]]}, {"duration": 100, "images": [[992, 1302]], "exitBranch": 27}, {"duration": 100, "images": [[1116, 1302]], "exitBranch": 28}, {"duration": 100, "images": [[1240, 1302]], "exitBranch": 29}, {"duration": 100, "images": [[1364, 1302]], "exitBranch": 30}, {"duration": 100, "images": [[1488, 1302]], "exitBranch": 31}, {"duration": 100, "images": [[1612, 1302]], "exitBranch": 32}, {"duration": 100, "images": [[1736, 1302]]}, {"duration": 100, "images": [[1860, 1302]]}, {"duration": 100, "images": [[1984, 1302]]}, {"duration": 100, "images": [[2108, 1302]]}, {"duration": 100, "images": [[2232, 1302]]}, {"duration": 100, "images": [[2356, 1302]]}, {"duration": 100, "images": [[2480, 1302]]}, {"duration": 100, "images": [[2604, 1302]]}, {"duration": 100, "images": [[2728, 1302]]}, {"duration": 100, "images": [[2852, 1302]]}, {"duration": 100, "images": [[2976, 1302]]}, {"duration": 100, "images": [[3100, 1302]]}, {"duration": 100, "images": [[3224, 1302]]}, {"duration": 100, "images": [[0, 1395]]}, {"duration": 100, "images": [[124, 1395]]}, {"duration": 100, "images": [[248, 1395]], "exitBranch": 48}, {"duration": 100, "images": [[372, 1395]], "exitBranch": 49}, {"duration": 100, "images": [[496, 1395]]}, {"duration": 100, "images": [[620, 1395]], "sound": "4"}, {"duration": 100, "images": [[744, 1395]]}, {"duration": 100, "images": [[868, 1395]]}, {"duration": 600}, {"duration": 100, "images": [[992, 1395]]}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1364, 1395]]}, {"duration": 100, "images": [[1488, 1395]]}, {"duration": 100, "images": [[1612, 1395]]}, {"duration": 100, "images": [[1736, 1395]]}, {"duration": 100, "images": [[1860, 1395]]}, {"duration": 100, "images": [[0, 0]]}]}, "Thinking": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[496, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[1116, 93]]}, {"duration": 100, "images": [[1240, 93]]}, {"duration": 100, "images": [[1364, 93]]}, {"duration": 100, "images": [[1488, 93]]}, {"duration": 100, "images": [[1612, 93]]}, {"duration": 100, "images": [[1736, 93]], "sound": "4"}, {"duration": 100, "images": [[1860, 93]]}, {"duration": 100, "images": [[1984, 93]]}, {"duration": 100, "images": [[2108, 93]]}, {"duration": 100, "images": [[2232, 93]]}, {"duration": 100, "images": [[2356, 93]]}, {"duration": 100, "images": [[2480, 93]]}, {"duration": 100, "images": [[2604, 93]]}, {"duration": 100, "images": [[2728, 93]]}, {"duration": 100, "images": [[2852, 93]]}, {"duration": 100, "images": [[2976, 93]]}, {"duration": 100, "images": [[3100, 93]]}, {"duration": 100, "images": [[3224, 93]]}, {"duration": 100, "images": [[0, 186]]}, {"duration": 100, "images": [[124, 186]]}, {"duration": 100, "images": [[248, 186]]}, {"duration": 100, "images": [[372, 186]]}, {"duration": 100, "images": [[496, 186]]}, {"duration": 100, "images": [[620, 186]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 21, "weight": 100}]}}, {"duration": 100, "images": [[744, 186]]}, {"duration": 100, "images": [[868, 186]]}, {"duration": 100, "images": [[992, 186]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[744, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "Explain": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 900, "images": [[1364, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleRopePile": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[1488, 186]], "exitBranch": 74}, {"duration": 100, "images": [[1612, 186]]}, {"duration": 100, "images": [[1736, 186]], "exitBranch": 74}, {"duration": 100, "images": [[1860, 186]]}, {"duration": 100, "images": [[1984, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2108, 186]]}, {"duration": 100, "images": [[2232, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2356, 186]]}, {"duration": 100, "images": [[2480, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2604, 186]]}, {"duration": 100, "images": [[2728, 186]], "exitBranch": 74}, {"duration": 100, "images": [[2852, 186]]}, {"duration": 100, "images": [[2976, 186]], "exitBranch": 74}, {"duration": 100, "images": [[3100, 186]]}, {"duration": 100, "images": [[3224, 186]], "exitBranch": 74}, {"duration": 100, "images": [[0, 279]]}, {"duration": 100, "images": [[124, 279]], "exitBranch": 74}, {"duration": 100, "images": [[248, 279]]}, {"duration": 100, "images": [[372, 279]], "exitBranch": 74}, {"duration": 100, "images": [[496, 279]]}, {"duration": 100, "images": [[620, 279]], "exitBranch": 74}, {"duration": 100, "images": [[744, 279]]}, {"duration": 100, "images": [[868, 279]], "exitBranch": 74}, {"duration": 100, "images": [[992, 279]]}, {"duration": 100, "images": [[1116, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1240, 279]]}, {"duration": 100, "images": [[1364, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1488, 279]]}, {"duration": 100, "images": [[1612, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1736, 279]]}, {"duration": 100, "images": [[1860, 279]], "exitBranch": 74}, {"duration": 100, "images": [[1984, 279]]}, {"duration": 100, "images": [[2108, 279]], "exitBranch": 74}, {"duration": 100, "images": [[2232, 279]]}, {"duration": 100, "images": [[2356, 279]]}, {"duration": 100, "images": [[2480, 279]], "exitBranch": 74}, {"duration": 100, "images": [[2604, 279]]}, {"duration": 100, "images": [[2728, 279]], "exitBranch": 40}, {"duration": 100, "images": [[2852, 279]]}, {"duration": 100, "images": [[2976, 279]], "exitBranch": 42}, {"duration": 100, "images": [[3100, 279]]}, {"duration": 100, "images": [[3224, 279]], "exitBranch": 44}, {"duration": 100, "images": [[0, 372]]}, {"duration": 100, "images": [[124, 372]], "exitBranch": 46}, {"duration": 100, "images": [[248, 372]]}, {"duration": 100, "images": [[372, 372]], "exitBranch": 48}, {"duration": 100, "images": [[496, 372]]}, {"duration": 100, "images": [[620, 372]], "exitBranch": 50}, {"duration": 100, "images": [[744, 372]]}, {"duration": 100, "images": [[868, 372]], "exitBranch": 52}, {"duration": 100, "images": [[992, 372]]}, {"duration": 100, "images": [[1116, 372]], "exitBranch": 54}, {"duration": 100, "images": [[1240, 372]]}, {"duration": 100, "images": [[1364, 372]], "exitBranch": 56}, {"duration": 100, "images": [[1488, 372]]}, {"duration": 100, "images": [[1612, 372]], "exitBranch": 58}, {"duration": 100, "images": [[1736, 372]]}, {"duration": 100, "images": [[1860, 372]], "exitBranch": 5}, {"duration": 100, "images": [[1984, 372]]}, {"duration": 100, "images": [[2108, 372]], "exitBranch": 70}, {"duration": 100, "images": [[2232, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 95}]}}, {"duration": 100, "images": [[2356, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 25}, {"frameIndex": 67, "weight": 25}, {"frameIndex": 65, "weight": 25}]}}, {"duration": 100, "images": [[2480, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 63, "weight": 95}]}}, {"duration": 100, "images": [[2604, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 25}, {"frameIndex": 67, "weight": 25}, {"frameIndex": 63, "weight": 25}]}}, {"duration": 100, "images": [[2728, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 65, "weight": 95}]}}, {"duration": 100, "images": [[2604, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 25}, {"frameIndex": 65, "weight": 25}, {"frameIndex": 63, "weight": 25}]}}, {"duration": 100, "images": [[2852, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 67, "weight": 95}]}}, {"duration": 100, "images": [[2604, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 65, "weight": 25}, {"frameIndex": 67, "weight": 25}, {"frameIndex": 63, "weight": 25}]}}, {"duration": 100, "images": [[2976, 372]], "exitBranch": 70, "branching": {"branches": [{"frameIndex": 61, "weight": 95}]}}, {"duration": 100, "images": [[3100, 372]]}, {"duration": 100, "images": [[3224, 372]]}, {"duration": 100, "images": [[0, 465]]}, {"duration": 100, "images": [[124, 465]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleAtom": {"frames": [{"duration": 100, "images": [[0, 0]], "branching": {"branches": [{"frameIndex": 44, "weight": 97}]}}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[1116, 93]]}, {"duration": 100, "images": [[1240, 93]]}, {"duration": 100, "images": [[1364, 93]]}, {"duration": 100, "images": [[1488, 93]]}, {"duration": 100, "images": [[1612, 93]]}, {"duration": 100, "images": [[1736, 93]]}, {"duration": 100, "images": [[1860, 93]]}, {"duration": 100, "images": [[1984, 93]]}, {"duration": 100, "images": [[2108, 93]]}, {"duration": 100, "images": [[2232, 93]]}, {"duration": 100, "images": [[2356, 93]]}, {"duration": 100, "images": [[2480, 93]]}, {"duration": 100, "images": [[2604, 93]]}, {"duration": 100, "images": [[2728, 93]]}, {"duration": 100, "images": [[2852, 93]]}, {"duration": 100, "images": [[2976, 93]]}, {"duration": 100, "images": [[3100, 93]]}, {"duration": 100, "images": [[3224, 93]]}, {"duration": 100, "images": [[0, 186]]}, {"duration": 100, "images": [[124, 186]]}, {"duration": 100, "images": [[248, 186]]}, {"duration": 100, "images": [[372, 186]]}, {"duration": 100, "images": [[496, 186]]}, {"duration": 100, "images": [[620, 186]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 21, "weight": 95}]}}, {"duration": 100, "images": [[744, 186]]}, {"duration": 100, "images": [[868, 186]]}, {"duration": 100, "images": [[992, 186]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "Print": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[248, 465]]}, {"duration": 100, "images": [[372, 465]]}, {"duration": 100, "images": [[496, 465]]}, {"duration": 100, "images": [[620, 465]], "sound": "5"}, {"duration": 100, "images": [[744, 465]]}, {"duration": 100, "images": [[868, 465]]}, {"duration": 100, "images": [[992, 465]]}, {"duration": 100, "images": [[1116, 465]]}, {"duration": 100, "images": [[1240, 465]]}, {"duration": 100, "images": [[1364, 465]], "sound": "8"}, {"duration": 150, "images": [[1488, 465]]}, {"duration": 100, "images": [[1612, 465]], "sound": "8"}, {"duration": 100, "images": [[1736, 465]]}, {"duration": 100, "images": [[1860, 465]]}, {"duration": 100, "images": [[1984, 465]]}, {"duration": 100, "images": [[2108, 465]]}, {"duration": 100, "images": [[2232, 465]]}, {"duration": 100, "images": [[2356, 465]]}, {"duration": 100, "images": [[2480, 465]]}, {"duration": 100, "images": [[2604, 465]]}, {"duration": 100, "images": [[2728, 465]]}, {"duration": 450, "images": [[2852, 465]]}, {"duration": 200, "images": [[2976, 465]]}, {"duration": 100, "images": [[3100, 465]], "exitBranch": 26}, {"duration": 100, "images": [[3224, 465]], "sound": "7"}, {"duration": 100, "images": [[0, 558]], "exitBranch": 28}, {"duration": 100, "images": [[124, 558]]}, {"duration": 100, "images": [[248, 558]], "exitBranch": 30}, {"duration": 100, "images": [[372, 558]]}, {"duration": 600, "images": [[496, 558]], "exitBranch": 32}, {"duration": 100, "images": [[620, 558]], "sound": "7"}, {"duration": 100, "images": [[744, 558]], "exitBranch": 34}, {"duration": 100, "images": [[868, 558]]}, {"duration": 100, "images": [[992, 558]], "exitBranch": 36}, {"duration": 100, "images": [[1116, 558]]}, {"duration": 600, "images": [[1240, 558]], "exitBranch": 38}, {"duration": 100, "images": [[1364, 558]], "sound": "7"}, {"duration": 100, "images": [[1488, 558]], "exitBranch": 40}, {"duration": 100, "images": [[1612, 558]]}, {"duration": 100, "images": [[1736, 558]], "exitBranch": 44}, {"duration": 600, "images": [[1860, 558]]}, {"duration": 100, "images": [[1984, 558]], "exitBranch": 44, "sound": "7"}, {"duration": 100, "images": [[2108, 558]]}, {"duration": 100, "images": [[2232, 558]], "exitBranch": 46}, {"duration": 100, "images": [[2356, 558]]}, {"duration": 100, "images": [[2480, 558]], "exitBranch": 48}, {"duration": 100, "images": [[2604, 558]]}, {"duration": 100, "images": [[2728, 558]], "exitBranch": 51}, {"duration": 600, "images": [[2852, 558]]}, {"duration": 100, "images": [[2976, 558]]}, {"duration": 100, "images": [[3100, 558]], "exitBranch": 53}, {"duration": 100, "images": [[3224, 558]], "sound": "11"}, {"duration": 100, "images": [[0, 651]]}, {"duration": 100, "images": [[124, 651]]}, {"duration": 100, "images": [[248, 651]]}, {"duration": 100, "images": [[372, 651]], "exitBranch": 58}, {"duration": 100, "images": [[496, 651]]}, {"duration": 100, "images": [[0, 0]]}]}, "Hide": {"frames": [{"duration": 10, "images": [[0, 0]]}, {"duration": 10, "images": [[2480, 0]]}, {"duration": 10, "images": [[2604, 0]]}, {"duration": 10, "images": [[2728, 0]]}, {"duration": 10}]}, "GetAttention": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1240, 651]]}, {"duration": 100, "images": [[1364, 651]]}, {"duration": 100, "images": [[1488, 651]]}, {"duration": 100, "images": [[1612, 651]]}, {"duration": 100, "images": [[1736, 651]]}, {"duration": 100, "images": [[1860, 651]]}, {"duration": 100, "images": [[1984, 651]]}, {"duration": 100, "images": [[2108, 651]]}, {"duration": 100, "images": [[2232, 651]], "sound": "10"}, {"duration": 150, "images": [[2356, 651]]}, {"duration": 150, "images": [[2232, 651]], "sound": "10"}, {"duration": 150, "images": [[2356, 651]]}, {"duration": 150, "images": [[2232, 651]], "sound": "10"}, {"duration": 150, "images": [[2480, 651]]}, {"duration": 100, "images": [[2604, 651]]}, {"duration": 100, "images": [[2728, 651]]}, {"duration": 100, "images": [[2852, 651]]}, {"duration": 100, "images": [[2976, 651]]}, {"duration": 100, "images": [[3100, 651]]}, {"duration": 100, "images": [[3224, 651]]}, {"duration": 100, "images": [[0, 744]]}, {"duration": 100, "images": [[124, 744]], "exitBranch": 23}, {"duration": 100, "images": [[0, 0]]}]}, "Save": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[3100, 837]]}, {"duration": 130, "images": [[3224, 837]], "sound": "13"}, {"duration": 130, "images": [[0, 930]]}, {"duration": 100, "images": [[124, 930]]}, {"duration": 100, "images": [[248, 930]]}, {"duration": 100, "images": [[372, 930]]}, {"duration": 100, "images": [[496, 930]], "exitBranch": 10}, {"duration": 450, "images": [[620, 930]]}, {"duration": 100, "images": [[496, 930]], "exitBranch": 10}, {"duration": 100, "images": [[744, 930]]}, {"duration": 100, "images": [[868, 930]]}, {"duration": 100, "images": [[992, 930]]}, {"duration": 130, "images": [[1116, 930]], "sound": "8"}, {"duration": 130, "images": [[1240, 930]]}, {"duration": 130, "images": [[1364, 930]]}, {"duration": 130, "images": [[1488, 930]], "sound": "8"}, {"duration": 130, "images": [[1612, 930]], "sound": "8"}, {"duration": 130, "images": [[1736, 930]]}, {"duration": 130, "images": [[1860, 930]], "sound": "8"}, {"duration": 100, "images": [[1984, 930]]}, {"duration": 100, "images": [[2108, 930]], "sound": "9"}, {"duration": 160, "images": [[2232, 930]]}, {"duration": 100, "images": [[2356, 930]], "sound": "2"}, {"duration": 100, "images": [[2480, 930]]}, {"duration": 100, "images": [[2604, 930]]}, {"duration": 100, "images": [[2728, 930]], "exitBranch": 34}, {"duration": 450, "images": [[2852, 930]]}, {"duration": 100, "images": [[2976, 930]], "exitBranch": 34, "sound": "10"}, {"duration": 400, "images": [[3100, 930]]}, {"duration": 100, "images": [[3224, 930]], "exitBranch": 34}, {"duration": 100, "images": [[0, 1023]]}, {"duration": 100, "images": [[124, 1023]]}, {"duration": 100, "images": [[248, 1023]]}, {"duration": 100, "images": [[372, 1023]]}, {"duration": 100, "images": [[496, 1023]]}, {"duration": 100, "images": [[620, 1023]]}, {"duration": 100, "images": [[744, 1023]]}, {"duration": 100, "images": [[868, 1023]]}, {"duration": 100, "images": [[992, 1023]]}, {"duration": 100, "images": [[1116, 1023]]}, {"duration": 100, "images": [[0, 0]]}]}, "GetTechy": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[496, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[744, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[1116, 93]]}, {"duration": 100, "images": [[1240, 93]]}, {"duration": 100, "images": [[1364, 93]]}, {"duration": 100, "images": [[1488, 93]]}, {"duration": 100, "images": [[1612, 93]]}, {"duration": 100, "images": [[1736, 93]], "sound": "4"}, {"duration": 100, "images": [[1860, 93]]}, {"duration": 100, "images": [[1984, 93]]}, {"duration": 100, "images": [[2108, 93]]}, {"duration": 100, "images": [[2232, 93]]}, {"duration": 100, "images": [[2356, 93]]}, {"duration": 100, "images": [[2480, 93]]}, {"duration": 100, "images": [[2604, 93]]}, {"duration": 100, "images": [[2728, 93]]}, {"duration": 100, "images": [[2852, 93]]}, {"duration": 100, "images": [[2976, 93]]}, {"duration": 100, "images": [[3100, 93]]}, {"duration": 100, "images": [[3224, 93]]}, {"duration": 100, "images": [[0, 186]]}, {"duration": 100, "images": [[124, 186]]}, {"duration": 100, "images": [[248, 186]]}, {"duration": 100, "images": [[372, 186]]}, {"duration": 100, "images": [[496, 186]]}, {"duration": 100, "images": [[620, 186]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 21, "weight": 100}]}}, {"duration": 100, "images": [[744, 186]]}, {"duration": 100, "images": [[868, 186]]}, {"duration": 100, "images": [[992, 186]]}, {"duration": 100, "images": [[992, 93]]}, {"duration": 100, "images": [[868, 93]]}, {"duration": 100, "images": [[744, 93]], "sound": "14"}, {"duration": 100, "images": [[620, 93]]}, {"duration": 100, "images": [[496, 93]]}, {"duration": 100, "images": [[372, 93]]}, {"duration": 100, "images": [[248, 93]]}, {"duration": 100, "images": [[124, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureUp": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[868, 744]]}, {"duration": 100, "images": [[992, 744]]}, {"duration": 100, "images": [[1116, 744]]}, {"duration": 100, "images": [[1240, 744]]}, {"duration": 100, "images": [[1364, 744]], "exitBranch": 11}, {"duration": 100, "images": [[1488, 744]]}, {"duration": 100, "images": [[1612, 744]], "branching": {"branches": [{"frameIndex": 5, "weight": 50}]}}, {"duration": 100, "images": [[1736, 744]]}, {"duration": 1200, "images": [[1860, 744]]}, {"duration": 100, "images": [[1984, 744]]}, {"duration": 100, "images": [[1364, 744]]}, {"duration": 100, "images": [[1240, 744]]}, {"duration": 100, "images": [[1116, 744]]}, {"duration": 100, "images": [[992, 744]]}, {"duration": 100, "images": [[868, 744]]}, {"duration": 100, "images": [[0, 0]]}]}, "Idle1_1": {"frames": [{"duration": 100, "images": [[0, 0]], "branching": {"branches": [{"frameIndex": 37, "weight": 20}]}}, {"duration": 100, "images": [[2108, 744]], "exitBranch": 2, "branching": {"branches": [{"frameIndex": 1, "weight": 95}]}}, {"duration": 100, "images": [[2232, 744]], "exitBranch": 16}, {"duration": 100, "images": [[2356, 744]]}, {"duration": 300, "images": [[2480, 744]], "exitBranch": 5, "branching": {"branches": [{"frameIndex": 4, "weight": 95}]}}, {"duration": 100, "images": [[2604, 744]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 9, "weight": 25}, {"frameIndex": 12, "weight": 25}, {"frameIndex": 15, "weight": 25}]}}, {"duration": 100, "images": [[2728, 744]]}, {"duration": 300, "images": [[2852, 744]], "exitBranch": 8, "branching": {"branches": [{"frameIndex": 7, "weight": 94}, {"frameIndex": 5, "weight": 3}]}}, {"duration": 100, "images": [[2976, 744]], "exitBranch": 16}, {"duration": 100, "images": [[3100, 744]]}, {"duration": 300, "images": [[3224, 744]], "exitBranch": 11, "branching": {"branches": [{"frameIndex": 10, "weight": 94}, {"frameIndex": 8, "weight": 2}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[0, 837]], "exitBranch": 16}, {"duration": 100, "images": [[124, 837]]}, {"duration": 300, "images": [[248, 837]], "exitBranch": 14, "branching": {"branches": [{"frameIndex": 13, "weight": 93}, {"frameIndex": 11, "weight": 3}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[372, 837]], "exitBranch": 16}, {"duration": 100, "images": [[496, 837]]}, {"duration": 300, "images": [[620, 837]], "exitBranch": 17, "branching": {"branches": [{"frameIndex": 16, "weight": 95}]}}, {"duration": 100, "images": [[744, 837]], "exitBranch": 36, "branching": {"branches": [{"frameIndex": 36, "weight": 90}]}}, {"duration": 100, "images": [[868, 837]]}, {"duration": 300, "images": [[992, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1116, 837]]}, {"duration": 100, "images": [[1240, 837]], "exitBranch": 35}, {"duration": 300, "images": [[1364, 837]], "exitBranch": 23, "branching": {"branches": [{"frameIndex": 22, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[1488, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 24, "weight": 25}, {"frameIndex": 27, "weight": 25}, {"frameIndex": 30, "weight": 25}]}}, {"duration": 100, "images": [[1612, 837]]}, {"duration": 300, "images": [[1736, 837]], "exitBranch": 26, "branching": {"branches": [{"frameIndex": 25, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[1860, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1984, 837]]}, {"duration": 300, "images": [[2108, 837]], "exitBranch": 29, "branching": {"branches": [{"frameIndex": 28, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[2232, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2356, 837]]}, {"duration": 300, "images": [[2480, 837]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 31, "weight": 94}, {"frameIndex": 23, "weight": 3}]}}, {"duration": 100, "images": [[2604, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2728, 837]]}, {"duration": 300, "images": [[2852, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 34, "weight": 80}]}}, {"duration": 100, "images": [[2976, 837]]}, {"duration": 100, "images": [[0, 0]], "exitBranch": 42}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 900, "images": [[1364, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[0, 0]]}]}, "Processing": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1240, 1023]], "sound": "14"}, {"duration": 100, "images": [[1364, 1023]]}, {"duration": 100, "images": [[1488, 1023]]}, {"duration": 100, "images": [[1612, 1023]], "exitBranch": 33}, {"duration": 100, "images": [[1736, 1023]]}, {"duration": 100, "images": [[1860, 1023]]}, {"duration": 100, "images": [[1984, 1023]]}, {"duration": 100, "images": [[2108, 1023]], "sound": "11"}, {"duration": 100, "images": [[2232, 1023]], "exitBranch": 31}, {"duration": 100, "images": [[2356, 1023]]}, {"duration": 100, "images": [[2480, 1023]]}, {"duration": 100, "images": [[2604, 1023]]}, {"duration": 100, "images": [[2728, 1023]], "exitBranch": 31}, {"duration": 100, "images": [[2852, 1023]]}, {"duration": 100, "images": [[2976, 1023]]}, {"duration": 100, "images": [[3100, 1023]]}, {"duration": 100, "images": [[3224, 1023]]}, {"duration": 100, "images": [[0, 1116]], "sound": "11"}, {"duration": 100, "images": [[124, 1116]]}, {"duration": 100, "images": [[248, 1116]]}, {"duration": 100, "images": [[372, 1116]]}, {"duration": 100, "images": [[496, 1116]]}, {"duration": 100, "images": [[620, 1116]]}, {"duration": 100, "images": [[744, 1116]]}, {"duration": 100, "images": [[868, 1116]]}, {"duration": 100, "images": [[992, 1116]]}, {"duration": 100, "images": [[1116, 1116]], "exitBranch": 28, "branching": {"branches": [{"frameIndex": 7, "weight": 100}]}}, {"duration": 100, "images": [[1240, 1116]], "sound": "11"}, {"duration": 100, "images": [[1364, 1116]]}, {"duration": 100, "images": [[1488, 1116]]}, {"duration": 100, "images": [[1612, 1116]]}, {"duration": 100, "images": [[1736, 1116]]}, {"duration": 100, "images": [[1860, 1116]]}, {"duration": 100, "images": [[1984, 1116]]}, {"duration": 100, "images": [[2108, 1116]]}, {"duration": 100, "images": [[2232, 1116]]}, {"duration": 100, "images": [[0, 0]]}]}, "Alert": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[2356, 1116]]}, {"duration": 100, "images": [[2480, 1116]]}, {"duration": 100, "images": [[2604, 1116]]}, {"duration": 100, "images": [[2728, 1116]]}, {"duration": 100, "images": [[2852, 1116]]}, {"duration": 100, "images": [[2976, 1116]], "sound": "6"}, {"duration": 100, "images": [[3100, 1116]]}, {"duration": 100, "images": [[3224, 1116]]}, {"duration": 100, "images": [[0, 1209]]}, {"duration": 500, "images": [[124, 1209]], "exitBranch": 13}, {"duration": 100, "images": [[248, 1209]], "exitBranch": 13}, {"duration": 100, "images": [[372, 1209]]}, {"duration": 100, "images": [[496, 1209]]}, {"duration": 100, "images": [[620, 1209]]}, {"duration": 100, "images": [[744, 1209]]}, {"duration": 100, "images": [[868, 1209]]}, {"duration": 100, "images": [[992, 1209]]}, {"duration": 100, "images": [[1116, 1209]]}, {"duration": 100, "images": [[0, 0]]}]}, "LookUpRight": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[248, 744]], "exitBranch": 5}, {"duration": 100, "images": [[372, 744]], "exitBranch": 4}, {"duration": 1200, "images": [[496, 744]]}, {"duration": 100, "images": [[620, 744]]}, {"duration": 100, "images": [[744, 744]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleSideToSide": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[2108, 744]], "exitBranch": 2, "branching": {"branches": [{"frameIndex": 1, "weight": 95}]}}, {"duration": 100, "images": [[2232, 744]], "exitBranch": 16}, {"duration": 100, "images": [[2356, 744]]}, {"duration": 300, "images": [[2480, 744]], "exitBranch": 5, "branching": {"branches": [{"frameIndex": 4, "weight": 95}]}}, {"duration": 100, "images": [[2604, 744]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 9, "weight": 25}, {"frameIndex": 12, "weight": 25}, {"frameIndex": 15, "weight": 25}]}}, {"duration": 100, "images": [[2728, 744]]}, {"duration": 300, "images": [[2852, 744]], "exitBranch": 8, "branching": {"branches": [{"frameIndex": 7, "weight": 92}, {"frameIndex": 5, "weight": 5}]}}, {"duration": 100, "images": [[2976, 744]], "exitBranch": 16}, {"duration": 100, "images": [[3100, 744]]}, {"duration": 300, "images": [[3224, 744]], "exitBranch": 11, "branching": {"branches": [{"frameIndex": 10, "weight": 91}, {"frameIndex": 8, "weight": 5}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[0, 837]], "exitBranch": 16}, {"duration": 100, "images": [[124, 837]]}, {"duration": 300, "images": [[248, 837]], "exitBranch": 14, "branching": {"branches": [{"frameIndex": 13, "weight": 91}, {"frameIndex": 11, "weight": 3}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[372, 837]], "exitBranch": 16}, {"duration": 100, "images": [[496, 837]]}, {"duration": 300, "images": [[620, 837]], "exitBranch": 17, "branching": {"branches": [{"frameIndex": 16, "weight": 75}]}}, {"duration": 100, "images": [[744, 837]], "exitBranch": 36, "branching": {"branches": [{"frameIndex": 36, "weight": 90}]}}, {"duration": 100, "images": [[868, 837]]}, {"duration": 300, "images": [[992, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1116, 837]]}, {"duration": 100, "images": [[1240, 837]], "exitBranch": 35}, {"duration": 300, "images": [[1364, 837]], "exitBranch": 23, "branching": {"branches": [{"frameIndex": 22, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[1488, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 24, "weight": 25}, {"frameIndex": 27, "weight": 25}, {"frameIndex": 30, "weight": 25}]}}, {"duration": 100, "images": [[1612, 837]]}, {"duration": 0, "images": [[1736, 837]], "exitBranch": 26, "branching": {"branches": [{"frameIndex": 25, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[1860, 837]], "exitBranch": 35}, {"duration": 100, "images": [[1984, 837]]}, {"duration": 300, "images": [[2108, 837]], "exitBranch": 29, "branching": {"branches": [{"frameIndex": 28, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[2232, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2356, 837]]}, {"duration": 300, "images": [[2480, 837]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 31, "weight": 91}, {"frameIndex": 23, "weight": 5}]}}, {"duration": 100, "images": [[2604, 837]], "exitBranch": 35}, {"duration": 100, "images": [[2728, 837]]}, {"duration": 300, "images": [[2852, 837]], "exitBranch": 35, "branching": {"branches": [{"frameIndex": 34, "weight": 80}]}}, {"duration": 100, "images": [[2976, 837]]}, {"duration": 100, "images": [[0, 0]]}]}, "GoodBye": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 34, "sound": "15", "branching": {"branches": [{"frameIndex": 34, "weight": 50}]}}, {"duration": 100, "images": [[2356, 2883]]}, {"duration": 250, "images": [[2480, 2883]]}, {"duration": 100, "images": [[2604, 2883]], "sound": "13"}, {"duration": 100, "images": [[2728, 2883]]}, {"duration": 100, "images": [[2852, 2883]]}, {"duration": 100, "images": [[2976, 2883]]}, {"duration": 100, "images": [[3100, 2883]], "sound": "12"}, {"duration": 100, "images": [[3224, 2883]]}, {"duration": 100, "images": [[0, 2976]]}, {"duration": 100, "images": [[124, 2976]]}, {"duration": 100, "images": [[248, 2976]]}, {"duration": 100, "images": [[372, 2976]]}, {"duration": 100, "images": [[496, 2976]]}, {"duration": 200, "images": [[620, 2976]]}, {"duration": 200, "images": [[744, 2976]], "sound": "10"}, {"duration": 200, "images": [[620, 2976]]}, {"duration": 200, "images": [[868, 2976]]}, {"duration": 100, "images": [[992, 2976]]}, {"duration": 100, "images": [[1116, 2976]]}, {"duration": 200, "images": [[1240, 2976]]}, {"duration": 100, "images": [[1364, 2976]], "sound": "14"}, {"duration": 100, "images": [[1488, 2976]]}, {"duration": 100, "images": [[1612, 2976]]}, {"duration": 100, "images": [[1736, 2976]]}, {"duration": 100, "images": [[1860, 2976]]}, {"duration": 100, "images": [[1984, 2976]]}, {"duration": 100, "images": [[2108, 2976]]}, {"duration": 100, "images": [[2232, 2976]]}, {"duration": 100, "images": [[2356, 2976]]}, {"duration": 100, "images": [[2480, 2976]], "sound": "11"}, {"duration": 100, "images": [[2604, 2976]]}, {"duration": 100, "images": [[2728, 2976]]}, {"duration": 100, "images": [[2852, 2976]], "exitBranch": 37, "branching": {"branches": [{"frameIndex": 37, "weight": 100}]}}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[992, 1395]]}, {"duration": 100}]}, "LookLeft": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[248, 1488]], "exitBranch": 5}, {"duration": 100, "images": [[372, 1488]], "exitBranch": 4}, {"duration": 1200, "images": [[496, 1488]]}, {"duration": 100, "images": [[620, 1488]]}, {"duration": 100, "images": [[744, 1488]]}, {"duration": 100, "images": [[0, 0]]}]}, "IdleHeadScratch": {"frames": [{"duration": 100, "images": [[1984, 2418]], "branching": {"branches": [{"frameIndex": 18, "weight": 85}]}}, {"duration": 100, "images": [[2108, 2418]]}, {"duration": 100, "images": [[2232, 2418]], "exitBranch": 16}, {"duration": 100, "images": [[2356, 2418]]}, {"duration": 100, "images": [[2480, 2418]]}, {"duration": 100, "images": [[2604, 2418]]}, {"duration": 100, "images": [[2728, 2418]], "exitBranch": 16}, {"duration": 100, "images": [[2852, 2418]]}, {"duration": 100, "images": [[2976, 2418]]}, {"duration": 100, "images": [[3100, 2418]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 6, "weight": 80}]}}, {"duration": 100, "images": [[3224, 2418]], "exitBranch": 16}, {"duration": 100, "images": [[0, 2511]]}, {"duration": 100, "images": [[124, 2511]], "exitBranch": 16}, {"duration": 100, "images": [[248, 2511]]}, {"duration": 100, "images": [[372, 2511]]}, {"duration": 100, "images": [[496, 2511]], "exitBranch": 16, "branching": {"branches": [{"frameIndex": 12, "weight": 80}]}}, {"duration": 100, "images": [[620, 2511]]}, {"duration": 100, "images": [[744, 2511]]}, {"duration": 100, "images": [[868, 2511]]}]}, "LookUpLeft": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[868, 1488]], "exitBranch": 5}, {"duration": 100, "images": [[992, 1488]], "exitBranch": 4}, {"duration": 1200, "images": [[1116, 1488]]}, {"duration": 100, "images": [[1240, 1488]]}, {"duration": 100, "images": [[1364, 1488]]}, {"duration": 100, "images": [[0, 0]]}]}, "CheckingSomething": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1488, 1488]], "sound": "13"}, {"duration": 100, "images": [[1612, 1488]]}, {"duration": 100, "images": [[1736, 1488]]}, {"duration": 100, "images": [[1860, 1488]]}, {"duration": 100, "images": [[1984, 1488]]}, {"duration": 100, "images": [[2108, 1488]]}, {"duration": 100, "images": [[2232, 1488]]}, {"duration": 200, "images": [[2356, 1488]]}, {"duration": 200, "images": [[2480, 1488]]}, {"duration": 200, "images": [[2604, 1488]]}, {"duration": 100, "images": [[2728, 1488]], "sound": "10"}, {"duration": 100, "images": [[2852, 1488]], "exitBranch": 52}, {"duration": 140, "images": [[2976, 1488]]}, {"duration": 100, "images": [[3100, 1488]]}, {"duration": 100, "images": [[3224, 1488]]}, {"duration": 100, "images": [[0, 1581]]}, {"duration": 200, "images": [[124, 1581]]}, {"duration": 100, "images": [[248, 1581]]}, {"duration": 100, "images": [[372, 1581]]}, {"duration": 100, "images": [[496, 1581]]}, {"duration": 200, "images": [[620, 1581]], "exitBranch": 22, "branching": {"branches": [{"frameIndex": 21, "weight": 50}]}}, {"duration": 100, "images": [[744, 1581]]}, {"duration": 100, "images": [[868, 1581]]}, {"duration": 200, "images": [[992, 1581]], "exitBranch": 25, "branching": {"branches": [{"frameIndex": 24, "weight": 50}]}}, {"duration": 100, "images": [[1116, 1581]]}, {"duration": 100, "images": [[1240, 1581]]}, {"duration": 100, "images": [[1364, 1581]]}, {"duration": 200, "images": [[1488, 1581]], "exitBranch": 29, "branching": {"branches": [{"frameIndex": 28, "weight": 50}]}}, {"duration": 100, "images": [[1612, 1581]]}, {"duration": 100, "images": [[1736, 1581]]}, {"duration": 200, "images": [[1860, 1581]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 31, "weight": 50}]}}, {"duration": 100, "images": [[1984, 1581]]}, {"duration": 100, "images": [[2108, 1581]]}, {"duration": 100, "images": [[2232, 1581]]}, {"duration": 100, "images": [[2356, 1581]]}, {"duration": 200, "images": [[2480, 1581]], "exitBranch": 37, "branching": {"branches": [{"frameIndex": 36, "weight": 50}]}}, {"duration": 100, "images": [[2604, 1581]]}, {"duration": 100, "images": [[2728, 1581]]}, {"duration": 200, "images": [[2852, 1581]], "exitBranch": 40, "branching": {"branches": [{"frameIndex": 39, "weight": 50}]}}, {"duration": 100, "images": [[2976, 1581]]}, {"duration": 100, "images": [[3100, 1581]], "exitBranch": 50}, {"duration": 100, "images": [[3224, 1581]], "branching": {"branches": [{"frameIndex": 14, "weight": 75}]}}, {"duration": 100, "images": [[0, 1674]]}, {"duration": 200, "images": [[124, 1674]], "exitBranch": 51, "branching": {"branches": [{"frameIndex": 44, "weight": 50}]}}, {"duration": 100, "images": [[248, 1674]]}, {"duration": 100, "images": [[372, 1674]]}, {"duration": 100, "images": [[496, 1674]]}, {"duration": 100, "images": [[620, 1674]], "exitBranch": 49, "branching": {"branches": [{"frameIndex": 48, "weight": 85}]}}, {"duration": 100, "images": [[744, 1674]], "sound": "10"}, {"duration": 100, "images": [[868, 1674]], "exitBranch": 52, "branching": {"branches": [{"frameIndex": 10, "weight": 100}]}}, {"duration": 100, "images": [[992, 1674]]}, {"duration": 100, "images": [[1116, 1674]], "sound": "14"}, {"duration": 100, "images": [[1240, 1674]]}, {"duration": 100, "images": [[0, 0]]}]}, "Hearing_1": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[2356, 1116]]}, {"duration": 100, "images": [[2480, 1116]]}, {"duration": 100, "images": [[2604, 1116]]}, {"duration": 100, "images": [[2728, 1116]]}, {"duration": 100, "images": [[2852, 1116]]}, {"duration": 100, "images": [[2976, 1116]], "sound": "6"}, {"duration": 100, "images": [[3100, 1116]]}, {"duration": 100, "images": [[3224, 1116]]}, {"duration": 100, "images": [[0, 1209]]}, {"duration": 500, "images": [[124, 1209]], "exitBranch": 32}, {"duration": 100, "images": [[1364, 1674]], "branching": {"branches": [{"frameIndex": 6, "weight": 60}]}}, {"duration": 100, "images": [[2976, 1116]]}, {"duration": 100, "images": [[3100, 1116]], "exitBranch": 32}, {"duration": 100, "images": [[3224, 1116]]}, {"duration": 100, "images": [[0, 1209]], "exitBranch": 32}, {"duration": 500, "images": [[1364, 1674]], "branching": {"branches": [{"frameIndex": 12, "weight": 50}]}}, {"duration": 100, "images": [[1488, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[1612, 1674]]}, {"duration": 100, "images": [[1736, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[1860, 1674]]}, {"duration": 400, "images": [[1984, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2108, 1674]], "branching": {"branches": [{"frameIndex": 18, "weight": 50}]}}, {"duration": 100, "images": [[2232, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2356, 1674]]}, {"duration": 100, "images": [[2480, 1674]], "exitBranch": 32}, {"duration": 500, "images": [[2604, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2728, 1674]], "branching": {"branches": [{"frameIndex": 17, "weight": 50}]}}, {"duration": 100, "images": [[2852, 1674]], "exitBranch": 32}, {"duration": 100, "images": [[2976, 1674]]}, {"duration": 100, "images": [[248, 1209]], "exitBranch": 32, "branching": {"branches": [{"frameIndex": 12, "weight": 100}]}}, {"duration": 100, "images": [[372, 1209]]}, {"duration": 100, "images": [[496, 1209]]}, {"duration": 100, "images": [[620, 1209]]}, {"duration": 100, "images": [[744, 1209]]}, {"duration": 100, "images": [[868, 1209]]}, {"duration": 100, "images": [[992, 1209]]}, {"duration": 100, "images": [[1116, 1209]]}, {"duration": 100, "images": [[0, 0]]}]}, "GetWizardy": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 10, "images": [[124, 0]]}, {"duration": 10, "images": [[248, 0]]}, {"duration": 10, "images": [[372, 0]], "sound": "14"}, {"duration": 10, "images": [[496, 0]]}, {"duration": 10, "images": [[620, 0]]}, {"duration": 10, "images": [[744, 0]]}, {"duration": 10, "images": [[868, 0]]}, {"duration": 10, "images": [[992, 0]], "sound": "1"}, {"duration": 100, "images": [[1116, 0]]}, {"duration": 100, "images": [[1240, 0]]}, {"duration": 100, "images": [[1364, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1612, 0]], "sound": "10"}, {"duration": 100, "images": [[1736, 0]]}, {"duration": 1200, "images": [[1488, 0]]}, {"duration": 100, "images": [[1860, 0]]}, {"duration": 100, "images": [[1984, 0]]}, {"duration": 100, "images": [[2108, 0]]}, {"duration": 100, "images": [[2232, 0]]}, {"duration": 100, "images": [[2356, 0]], "exitBranch": 21}, {"duration": 100, "images": [[0, 0]]}]}, "IdleFingerTap": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[2976, 2976]]}, {"duration": 100, "images": [[3100, 2976]]}, {"duration": 100, "images": [[3224, 2976]], "exitBranch": 8}, {"duration": 100, "images": [[0, 3069]], "exitBranch": 8}, {"duration": 100, "images": [[124, 3069]], "branching": {"branches": [{"frameIndex": 7, "weight": 3}]}}, {"duration": 150, "images": [[248, 3069]], "exitBranch": 7, "branching": {"branches": [{"frameIndex": 6, "weight": 98}, {"frameIndex": 5, "weight": 2}]}}, {"duration": 100, "images": [[372, 3069]], "exitBranch": 8}, {"duration": 100, "images": [[496, 3069]]}, {"duration": 100, "images": [[620, 3069]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureLeft": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[3100, 1674]]}, {"duration": 100, "images": [[3224, 1674]]}, {"duration": 100, "images": [[0, 1767]]}, {"duration": 100, "images": [[124, 1767]], "exitBranch": 12}, {"duration": 100, "images": [[248, 1767]]}, {"duration": 100, "images": [[372, 1767]], "branching": {"branches": [{"frameIndex": 4, "weight": 60}]}}, {"duration": 100, "images": [[496, 1767]]}, {"duration": 100, "images": [[620, 1767]]}, {"duration": 1200, "images": [[744, 1767]]}, {"duration": 100, "images": [[868, 1767]]}, {"duration": 450, "images": [[992, 1767]]}, {"duration": 100, "images": [[0, 1767]]}, {"duration": 100, "images": [[3224, 1674]]}, {"duration": 100, "images": [[3100, 1674]]}, {"duration": 100, "images": [[0, 0]]}]}, "Wave": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15", "branching": {"branches": [{"frameIndex": 15, "weight": 33}]}}, {"duration": 100, "images": [[1116, 1767]]}, {"duration": 100, "images": [[1240, 1767]]}, {"duration": 100, "images": [[1364, 1767]], "exitBranch": 13}, {"duration": 100, "images": [[1488, 1767]], "exitBranch": 13}, {"duration": 100, "images": [[1612, 1767]], "exitBranch": 13}, {"duration": 100, "images": [[1736, 1767]], "branching": {"branches": [{"frameIndex": 9, "weight": 100}]}}, {"duration": 100, "images": [[1860, 1767]], "exitBranch": 11, "sound": "10"}, {"duration": 100, "images": [[1984, 1767]]}, {"duration": 100, "images": [[2108, 1767]], "exitBranch": 11, "sound": "10"}, {"duration": 100, "images": [[2232, 1767]]}, {"duration": 100, "images": [[2356, 1767]], "sound": "10"}, {"duration": 100, "images": [[2480, 1767]]}, {"duration": 100, "images": [[2604, 1767]]}, {"duration": 100, "images": [[2728, 1767]], "exitBranch": 26, "branching": {"branches": [{"frameIndex": 26, "weight": 100}]}}, {"duration": 100, "images": [[2852, 1767]]}, {"duration": 100, "images": [[2976, 1767]]}, {"duration": 100, "images": [[3100, 1767]], "sound": "12"}, {"duration": 100, "images": [[3224, 1767]]}, {"duration": 100, "images": [[0, 1860]]}, {"duration": 100, "images": [[124, 1860]], "exitBranch": 24, "sound": "10"}, {"duration": 1200, "images": [[248, 1860]]}, {"duration": 100, "images": [[372, 1860]], "exitBranch": 24, "sound": "10"}, {"duration": 1300, "images": [[248, 1860]]}, {"duration": 50, "images": [[496, 1860]]}, {"duration": 50, "images": [[2976, 1767]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureRight": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[620, 1860]]}, {"duration": 100, "images": [[744, 1860]]}, {"duration": 100, "images": [[868, 1860]]}, {"duration": 100, "images": [[992, 1860]]}, {"duration": 100, "images": [[1116, 1860]], "exitBranch": 11}, {"duration": 100, "images": [[1240, 1860]]}, {"duration": 100, "images": [[1364, 1860]], "branching": {"branches": [{"frameIndex": 5, "weight": 50}]}}, {"duration": 100, "images": [[1488, 1860]]}, {"duration": 1200, "images": [[1612, 1860]]}, {"duration": 100, "images": [[1736, 1860]]}, {"duration": 550, "images": [[1116, 1860]]}, {"duration": 100, "images": [[992, 1860]]}, {"duration": 100, "images": [[868, 1860]]}, {"duration": 100, "images": [[744, 1860]]}, {"duration": 100, "images": [[620, 1860]]}, {"duration": 100, "images": [[0, 0]]}]}, "Writing": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1860, 1860]]}, {"duration": 100, "images": [[1984, 1860]]}, {"duration": 100, "images": [[2108, 1860]]}, {"duration": 100, "images": [[2232, 1860]]}, {"duration": 100, "images": [[2356, 1860]]}, {"duration": 100, "images": [[2480, 1860]]}, {"duration": 100, "images": [[2604, 1860]]}, {"duration": 100, "images": [[2728, 1860]], "sound": "11"}, {"duration": 100, "images": [[2852, 1860]]}, {"duration": 100, "images": [[2976, 1860]]}, {"duration": 100, "images": [[3100, 1860]]}, {"duration": 100, "images": [[3224, 1860]], "branching": {"branches": [{"frameIndex": 26, "weight": 45}, {"frameIndex": 32, "weight": 25}, {"frameIndex": 42, "weight": 15}]}}, {"duration": 100, "images": [[0, 1953]], "exitBranch": 55}, {"duration": 100, "images": [[124, 1953]], "exitBranch": 55}, {"duration": 100, "images": [[248, 1953]]}, {"duration": 200, "images": [[372, 1953]]}, {"duration": 200, "images": [[496, 1953]], "exitBranch": 55}, {"duration": 200, "images": [[620, 1953]]}, {"duration": 200, "images": [[744, 1953]]}, {"duration": 200, "images": [[868, 1953]], "exitBranch": 55}, {"duration": 200, "images": [[992, 1953]]}, {"duration": 200, "images": [[1116, 1953]]}, {"duration": 200, "images": [[1240, 1953]], "exitBranch": 55}, {"duration": 200, "images": [[1364, 1953]]}, {"duration": 200, "images": [[1488, 1953]], "branching": {"branches": [{"frameIndex": 32, "weight": 20}, {"frameIndex": 42, "weight": 15}]}}, {"duration": 100, "images": [[1612, 1953]], "exitBranch": 56}, {"duration": 100, "images": [[1736, 1953]]}, {"duration": 400, "images": [[1860, 1953]], "branching": {"branches": [{"frameIndex": 28, "weight": 80}]}}, {"duration": 100, "images": [[1984, 1953]], "exitBranch": 30}, {"duration": 400, "images": [[2108, 1953]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 30, "weight": 75}]}}, {"duration": 100, "images": [[2232, 1953]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 13, "weight": 25}, {"frameIndex": 42, "weight": 20}]}}, {"duration": 100, "images": [[2356, 1953]]}, {"duration": 100, "images": [[2480, 1953]]}, {"duration": 200, "images": [[2604, 1953]]}, {"duration": 200, "images": [[2728, 1953]], "exitBranch": 54}, {"duration": 200, "images": [[2852, 1953]]}, {"duration": 200, "images": [[2976, 1953]], "exitBranch": 54}, {"duration": 100, "images": [[3100, 1953]]}, {"duration": 200, "images": [[3224, 1953]]}, {"duration": 200, "images": [[0, 2046]], "exitBranch": 55}, {"duration": 200, "images": [[124, 2046]], "branching": {"branches": [{"frameIndex": 13, "weight": 25}, {"frameIndex": 26, "weight": 25}, {"frameIndex": 32, "weight": 25}]}}, {"duration": 100, "images": [[248, 2046]]}, {"duration": 100, "images": [[372, 2046]], "exitBranch": 55}, {"duration": 100, "images": [[496, 2046]]}, {"duration": 100, "images": [[620, 2046]]}, {"duration": 100, "images": [[744, 2046]]}, {"duration": 100, "images": [[868, 2046]]}, {"duration": 100, "images": [[992, 2046]]}, {"duration": 100, "images": [[1116, 2046]]}, {"duration": 100, "images": [[1240, 2046]]}, {"duration": 100, "images": [[1364, 2046]]}, {"duration": 100, "images": [[1488, 2046]], "exitBranch": 57}, {"duration": 100, "images": [[1612, 2046]], "branching": {"branches": [{"frameIndex": 26, "weight": 33}, {"frameIndex": 32, "weight": 33}, {"frameIndex": 13, "weight": 34}]}}, {"duration": 100, "images": [[1736, 2046]]}, {"duration": 100, "images": [[1860, 2046]]}, {"duration": 100, "images": [[1984, 2046]], "sound": "11"}, {"duration": 100, "images": [[2108, 2046]]}, {"duration": 100, "images": [[2232, 2046]]}, {"duration": 100, "images": [[2356, 2046]]}, {"duration": 100, "images": [[0, 0]], "sound": "15"}]}, "IdleSnooze": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[2480, 2046]]}, {"duration": 100, "images": [[2604, 2046]]}, {"duration": 100, "images": [[2728, 2046]]}, {"duration": 100, "images": [[2852, 2046]]}, {"duration": 100, "images": [[2976, 2046]]}, {"duration": 100, "images": [[3100, 2046]]}, {"duration": 100, "images": [[3224, 2046]]}, {"duration": 400, "images": [[0, 2139]]}, {"duration": 100, "images": [[124, 2139]]}, {"duration": 100, "images": [[248, 2139]]}, {"duration": 100, "images": [[372, 2139]]}, {"duration": 100, "images": [[496, 2139]]}, {"duration": 100, "images": [[620, 2139]]}, {"duration": 100, "images": [[744, 2139]]}, {"duration": 100, "images": [[868, 2139]]}, {"duration": 100, "images": [[992, 2139]]}, {"duration": 100, "images": [[1116, 2139]], "exitBranch": 20}, {"duration": 100, "images": [[1240, 2139]]}, {"duration": 100, "images": [[1364, 2139]]}, {"duration": 100, "images": [[1488, 2139]], "exitBranch": 23}, {"duration": 100, "images": [[1612, 2139]]}, {"duration": 100, "images": [[1736, 2139]]}, {"duration": 100, "images": [[1860, 2139]], "exitBranch": 26}, {"duration": 100, "images": [[1984, 2139]]}, {"duration": 100, "images": [[2108, 2139]]}, {"duration": 100, "images": [[2232, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2356, 2139]]}, {"duration": 200, "images": [[2480, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2604, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2728, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[2852, 2139]]}, {"duration": 200, "images": [[2976, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[3100, 2139]]}, {"duration": 200, "images": [[3224, 2139]], "exitBranch": 83}, {"duration": 200, "images": [[0, 2232]]}, {"duration": 200, "images": [[124, 2232]]}, {"duration": 200, "images": [[248, 2232]], "exitBranch": 83, "branching": {"branches": [{"frameIndex": 27, "weight": 90}, {"frameIndex": 46, "weight": 5}, {"frameIndex": 52, "weight": 5}]}}, {"duration": 100, "images": [[372, 2232]]}, {"duration": 100, "images": [[496, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[620, 2232]]}, {"duration": 1200, "images": [[744, 2232]]}, {"duration": 100, "images": [[868, 2232]]}, {"duration": 100, "images": [[992, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1116, 2232]]}, {"duration": 100, "images": [[1240, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1364, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1488, 2232]], "exitBranch": 83}, {"duration": 400, "images": [[1612, 2232]]}, {"duration": 100, "images": [[1736, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[1860, 2232]]}, {"duration": 100, "images": [[1984, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[2108, 2232]]}, {"duration": 100, "images": [[2232, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[2356, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[2480, 2232]], "exitBranch": 83}, {"duration": 600, "images": [[2604, 2232]]}, {"duration": 300, "images": [[2728, 2232]], "exitBranch": 83}, {"duration": 300, "images": [[2852, 2232]], "exitBranch": 83}, {"duration": 300, "images": [[2976, 2232]], "exitBranch": 60}, {"duration": 100, "images": [[3100, 2232]]}, {"duration": 100, "images": [[3224, 2232]], "exitBranch": 83}, {"duration": 100, "images": [[0, 2325]]}, {"duration": 100, "images": [[124, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[248, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[372, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[496, 2325]]}, {"duration": 100, "images": [[620, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[744, 2325]]}, {"duration": 200, "images": [[868, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[992, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[1116, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[1240, 2325]]}, {"duration": 200, "images": [[1364, 2325]], "exitBranch": 83}, {"duration": 200, "images": [[1488, 2325]], "exitBranch": 75, "branching": {"branches": [{"frameIndex": 69, "weight": 20}]}}, {"duration": 100, "images": [[1612, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[1736, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[1860, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[1984, 2325]]}, {"duration": 100, "images": [[2108, 2325]], "exitBranch": 83}, {"duration": 100, "images": [[2232, 2325]]}, {"duration": 100, "images": [[2356, 2325]]}, {"duration": 300, "images": [[2480, 2325]]}, {"duration": 100, "images": [[2604, 2325]]}, {"duration": 100, "images": [[2728, 2325]]}, {"duration": 100, "images": [[2852, 2325]]}, {"duration": 100, "images": [[2976, 2325]]}, {"duration": 100, "images": [[0, 0]]}]}, "LookDownRight": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[3100, 2325]], "exitBranch": 5}, {"duration": 100, "images": [[3224, 2325]], "exitBranch": 4}, {"duration": 1200, "images": [[0, 2418]]}, {"duration": 100, "images": [[124, 2418]]}, {"duration": 100, "images": [[248, 2418]]}, {"duration": 100, "images": [[0, 0]]}]}, "GetArtsy": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[372, 2418]]}, {"duration": 100, "images": [[496, 2418]]}, {"duration": 100, "images": [[620, 2418]]}, {"duration": 100, "images": [[744, 2418]]}, {"duration": 100, "images": [[868, 2418]]}, {"duration": 100, "images": [[992, 2418]]}, {"duration": 100, "images": [[1116, 2418]]}, {"duration": 100, "images": [[1240, 2418]]}, {"duration": 100, "images": [[1364, 2418]]}, {"duration": 100, "images": [[1488, 2418]]}, {"duration": 400, "images": [[1612, 2418]]}, {"duration": 100, "images": [[1736, 2418]]}, {"duration": 100, "images": [[1860, 2418]], "sound": "10"}, {"duration": 100, "images": [[1612, 2418]]}, {"duration": 100, "images": [[1736, 2418]]}, {"duration": 100, "images": [[1860, 2418]], "sound": "10"}, {"duration": 2400, "images": [[1612, 2418]]}, {"duration": 100, "images": [[744, 2418]]}, {"duration": 100, "images": [[620, 2418]]}, {"duration": 100, "images": [[496, 2418]]}, {"duration": 100, "images": [[372, 2418]], "exitBranch": 22}, {"duration": 100, "images": [[0, 0]]}]}, "Show": {"frames": [{"duration": 10}, {"duration": 10, "images": [[2728, 0]]}, {"duration": 10, "images": [[2604, 0]]}, {"duration": 10, "images": [[2480, 0]]}, {"duration": 10, "images": [[0, 0]]}]}, "LookDown": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[2852, 0]], "exitBranch": 5}, {"duration": 100, "images": [[2976, 0]], "exitBranch": 4}, {"duration": 1200, "images": [[3100, 0]]}, {"duration": 100, "images": [[3224, 0]]}, {"duration": 100, "images": [[0, 93]]}, {"duration": 100, "images": [[0, 0]]}]}, "Searching": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[992, 2511]]}, {"duration": 100, "images": [[1116, 2511]]}, {"duration": 100, "images": [[1240, 2511]]}, {"duration": 100, "images": [[1364, 2511]]}, {"duration": 100, "images": [[1488, 2511]], "sound": "11"}, {"duration": 100, "images": [[1612, 2511]]}, {"duration": 100, "images": [[1736, 2511]]}, {"duration": 100, "images": [[1860, 2511]]}, {"duration": 100, "images": [[1984, 2511]]}, {"duration": 100, "images": [[2108, 2511]]}, {"duration": 100, "images": [[2232, 2511]]}, {"duration": 100, "images": [[2356, 2511]]}, {"duration": 100, "images": [[2480, 2511]]}, {"duration": 100, "images": [[2604, 2511]]}, {"duration": 100, "images": [[2728, 2511]]}, {"duration": 100, "images": [[2852, 2511]]}, {"duration": 100, "images": [[2976, 2511]]}, {"duration": 100, "images": [[3100, 2511]]}, {"duration": 800, "images": [[3224, 2511]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 19, "weight": 40}]}}, {"duration": 100, "images": [[0, 2604]], "exitBranch": 55}, {"duration": 100, "images": [[3224, 2511]]}, {"duration": 100, "images": [[124, 2604]]}, {"duration": 100, "images": [[248, 2604]]}, {"duration": 100, "images": [[372, 2604]]}, {"duration": 100, "images": [[496, 2604]]}, {"duration": 100, "images": [[620, 2604]]}, {"duration": 1000, "images": [[744, 2604]], "exitBranch": 54, "branching": {"branches": [{"frameIndex": 27, "weight": 65}]}}, {"duration": 100, "images": [[868, 2604]]}, {"duration": 100, "images": [[992, 2604]]}, {"duration": 100, "images": [[1116, 2604]]}, {"duration": 100, "images": [[1240, 2604]]}, {"duration": 500, "images": [[1364, 2604]], "exitBranch": 33, "branching": {"branches": [{"frameIndex": 32, "weight": 75}]}}, {"duration": 100, "images": [[1488, 2604]], "exitBranch": 34, "branching": {"branches": [{"frameIndex": 32, "weight": 50}]}}, {"duration": 100, "images": [[1364, 2604]]}, {"duration": 100, "images": [[1612, 2604]]}, {"duration": 100, "images": [[1736, 2604]]}, {"duration": 100, "images": [[1860, 2604]]}, {"duration": 100, "images": [[1984, 2604]], "exitBranch": 55}, {"duration": 100, "images": [[2108, 2604]]}, {"duration": 100, "images": [[2232, 2604]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 19, "weight": 20}, {"frameIndex": 40, "weight": 80}]}}, {"duration": 100, "images": [[2356, 2604]]}, {"duration": 100, "images": [[2480, 2604]]}, {"duration": 100, "images": [[2604, 2604]]}, {"duration": 100, "images": [[2728, 2604]]}, {"duration": 100, "images": [[2852, 2604]]}, {"duration": 100, "images": [[2976, 2604]]}, {"duration": 100, "images": [[3100, 2604]]}, {"duration": 100, "images": [[3224, 2604]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 48, "weight": 75}]}}, {"duration": 100, "images": [[0, 2697]]}, {"duration": 100, "images": [[124, 2697]]}, {"duration": 100, "images": [[0, 2697]]}, {"duration": 100, "images": [[3224, 2604]]}, {"duration": 100, "images": [[248, 2697]], "exitBranch": 55, "branching": {"branches": [{"frameIndex": 49, "weight": 50}]}}, {"duration": 100, "images": [[372, 2697]], "branching": {"branches": [{"frameIndex": 28, "weight": 100}]}}, {"duration": 100, "images": [[496, 2697]]}, {"duration": 100, "images": [[620, 2697]]}, {"duration": 100, "images": [[744, 2697]]}, {"duration": 100, "images": [[868, 2697]]}, {"duration": 100, "images": [[992, 2697]]}, {"duration": 100, "images": [[0, 0]]}]}, "EmptyTrash": {"frames": [{"duration": 100, "images": [[0, 0]], "sound": "15"}, {"duration": 100, "images": [[1116, 2697]]}, {"duration": 100, "images": [[1240, 2697]], "sound": "14"}, {"duration": 100, "images": [[1364, 2697]]}, {"duration": 100, "images": [[1488, 2697]]}, {"duration": 100, "images": [[1612, 2697]]}, {"duration": 100, "images": [[1736, 2697]], "exitBranch": 16}, {"duration": 100, "images": [[1860, 2697]], "sound": "3"}, {"duration": 100, "images": [[1984, 2697]]}, {"duration": 100, "images": [[2108, 2697]]}, {"duration": 100, "images": [[2232, 2697]]}, {"duration": 100, "images": [[2356, 2697]]}, {"duration": 100, "images": [[2480, 2697]], "exitBranch": 16}, {"duration": 100, "images": [[2604, 2697]], "sound": "3"}, {"duration": 100, "images": [[2728, 2697]]}, {"duration": 100, "images": [[2852, 2697]]}, {"duration": 100, "images": [[2976, 2697]], "exitBranch": 23}, {"duration": 100, "images": [[3100, 2697]]}, {"duration": 100, "images": [[3224, 2697]]}, {"duration": 100, "images": [[0, 2790]], "sound": "3"}, {"duration": 100, "images": [[124, 2790]]}, {"duration": 100, "images": [[248, 2790]]}, {"duration": 100, "images": [[372, 2790]]}, {"duration": 100, "images": [[496, 2790]], "exitBranch": 29}, {"duration": 100, "images": [[620, 2790]], "sound": "3"}, {"duration": 100, "images": [[744, 2790]]}, {"duration": 100, "images": [[868, 2790]]}, {"duration": 100, "images": [[992, 2790]]}, {"duration": 100, "images": [[1116, 2790]]}, {"duration": 100, "images": [[1240, 2790]], "exitBranch": 31, "sound": "3"}, {"duration": 100, "images": [[1364, 2790]]}, {"duration": 100, "images": [[1488, 2790]]}, {"duration": 900}, {"duration": 100, "images": [[992, 1395]]}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1364, 1395]]}, {"duration": 100, "images": [[1488, 1395]]}, {"duration": 100, "images": [[1612, 1395]]}, {"duration": 100, "images": [[1736, 1395]]}, {"duration": 100, "images": [[1860, 1395]]}, {"duration": 100, "images": [[0, 0]]}]}, "Greeting": {"frames": [{"duration": 100, "branching": {"branches": [{"frameIndex": 30, "weight": 40}]}, "sound": "15"}, {"duration": 100, "images": [[1612, 2790]]}, {"duration": 100, "images": [[1736, 2790]], "sound": "11"}, {"duration": 100, "images": [[1860, 2790]]}, {"duration": 100, "images": [[1984, 2790]]}, {"duration": 100, "images": [[2108, 2790]]}, {"duration": 100, "images": [[2232, 2790]]}, {"duration": 100, "images": [[2356, 2790]]}, {"duration": 100, "images": [[2480, 2790]]}, {"duration": 100, "images": [[2604, 2790]]}, {"duration": 100, "images": [[2728, 2790]]}, {"duration": 100, "images": [[2852, 2790]]}, {"duration": 100, "images": [[2976, 2790]]}, {"duration": 100, "images": [[3100, 2790]], "sound": "14"}, {"duration": 100, "images": [[3224, 2790]]}, {"duration": 100, "images": [[0, 2883]]}, {"duration": 100, "images": [[124, 2883]]}, {"duration": 100, "images": [[248, 2883]]}, {"duration": 300, "images": [[372, 2883]]}, {"duration": 100, "images": [[496, 2883]], "sound": "10"}, {"duration": 450, "images": [[372, 2883]]}, {"duration": 100, "images": [[620, 2883]]}, {"duration": 100, "images": [[744, 2883]]}, {"duration": 100, "images": [[868, 2883]], "sound": "12"}, {"duration": 100, "images": [[992, 2883]]}, {"duration": 100, "images": [[1116, 2883]]}, {"duration": 100, "images": [[1240, 2883]], "sound": "4"}, {"duration": 100, "images": [[1364, 2883]]}, {"duration": 100, "images": [[1488, 2883]]}, {"duration": 100, "images": [[1612, 2883]], "branching": {"branches": [{"frameIndex": 38, "weight": 100}]}}, {"duration": 100, "images": [[992, 1395]], "sound": "11"}, {"duration": 100, "images": [[1116, 1395]]}, {"duration": 100, "images": [[1240, 1395]]}, {"duration": 100, "images": [[1364, 1395]]}, {"duration": 100, "images": [[1488, 1395]]}, {"duration": 100, "images": [[1612, 1395]]}, {"duration": 100, "images": [[1736, 1395]]}, {"duration": 100, "images": [[1860, 1395]], "exitBranch": 38}, {"duration": 100, "images": [[0, 0]]}]}, "LookUp": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[1736, 2883]], "exitBranch": 5}, {"duration": 100, "images": [[1860, 2883]], "exitBranch": 4}, {"duration": 1200, "images": [[1984, 2883]]}, {"duration": 100, "images": [[2108, 2883]]}, {"duration": 100, "images": [[2232, 2883]]}, {"duration": 100, "images": [[0, 0]]}]}, "GestureDown": {"frames": [{"duration": 100, "images": [[0, 0]]}, {"duration": 100, "images": [[1984, 1395]]}, {"duration": 100, "images": [[2108, 1395]]}, {"duration": 100, "images": [[2232, 1395]]}, {"duration": 100, "images": [[2356, 1395]]}, {"duration": 100, "images": [[2480, 1395]], "exitBranch": 14}, {"duration": 100, "images": [[2604, 1395]]}, {"duration": 100, "images": [[2728, 1395]], "branching": {"branches": [{"frameIndex": 5, "weight": 50}]}}, {"duration": 100, "images": [[2852, 1395]]}, {"duration": 100, "images": [[2976, 1395]]}, {"duration": 100, "images": [[3100, 1395]], "exitBranch": 14}, {"duration": 100, "images": [[3224, 1395]]}, {"duration": 100, "images": [[0, 1488]]}, {"duration": 450, "images": [[124, 1488]]}, {"duration": 100, "images": [[2356, 1395]]}, {"duration": 100, "images": [[2232, 1395]]}, {"duration": 100, "images": [[2108, 1395]]}, {"duration": 100, "images": [[1984, 1395]]}, {"duration": 100, "images": [[0, 0]]}]}, "RestPose": {"frames": [{"duration": 100, "images": [[0, 0]]}]}, "IdleEyeBrowRaise": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 900, "images": [[1364, 186]]}, {"duration": 100, "images": [[1240, 186]]}, {"duration": 100, "images": [[1116, 186]]}, {"duration": 100, "images": [[0, 0]]}]}, "LookDownLeft": {"frames": [{"duration": 100, "images": [[0, 0]], "exitBranch": 6}, {"duration": 100, "images": [[744, 3069]], "exitBranch": 5}, {"duration": 100, "images": [[868, 3069]], "exitBranch": 4}, {"duration": 1200, "images": [[992, 3069]]}, {"duration": 100, "images": [[1116, 3069]]}, {"duration": 100, "images": [[1240, 3069]]}, {"duration": 100, "images": [[0, 0]]}]}}};

  const PET_DEFS = {
    clippy: {
      sheet: u("assets/animations/clippy.png"),
      anims: {},
      cols: 27,
      rows: 34,
      cell: 124,
      cssWidth: 124,
      cssHeight: 93,
      yOffset: 0,
      anchorY: 93,
      wallAnchorY: 93,
      renderScale: 0.28,
      className: "pixelcat-pet-clippy",
      naturallyFacesLeft: true
    },
    cat: {
      sheet: CAT_SHEET,
      anims: CAT_ANIMS,
      cols: 8,
      rows: 10,
      cssWidth: 32,
      cssHeight: 26,
      yOffset: -6,
      anchorY: 26,
      wallAnchorY: 13,
      renderScale: 1,
      className: "pixelcat-pet-cat",
    },
    
    fox: {
      sheet: FOX_SHEET,
      anims: FOX_ANIMS,
      cols: 14,
      rows: 7,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 32,
      wallAnchorY: 16,
      renderScale: 26 / 32,
      className: "pixelcat-pet-fox",
    },
    
    red_panda: {
      sheet: RED_PANDA_SHEET,
      anims: RED_PANDA_ANIMS,
      cols: 8,
      rows: 7,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 32,
      wallAnchorY: 16,
      renderScale: 26 / 32,
      className: "pixelcat-pet-red-panda",
    },
    frog: {
      sheet: FROG_SHEET,
      anims: FROG_ANIMS,
      cols: 8,
      rows: 4,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 32,
      wallAnchorY: 16,
      renderScale: 0.9,
      naturallyFacesLeft: true,
      className: "pixelcat-pet-frog",
    },
    skeleton: {
      sheet: SKELETON_SHEET,
      anims: SKELETON_ANIMS,
      cols: 16,
      rows: 15,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 32,
      wallAnchorY: 16,
      renderScale: 20 / 32,
      className: "pixelcat-pet-skeleton",
    },
    penguin: {
      sheet: PENGUIN_SHEET,
      anims: PENGUIN_ANIMS,
      cell: 16,
      cols: 6,
      rows: 16,
      cssWidth: 16,
      cssHeight: 16,
      yOffset: -0.5,
      anchorY: 16,
      wallAnchorY: 8,
      renderScale: 1.0,
      className: "pixelcat-pet-penguin",
    },
    fairy: {
      sheet: FAIRY_SHEET,
      anims: {
        idle1: { row: 1, fr: 4, fps: 7 },
        idle2: { row: 1, fr: 4, fps: 8 },
        clean1: { row: 3, fr: 4, fps: 8 },
        clean2: { row: 3, fr: 4, fps: 8 },
        walk: { row: 2, fr: 4, fps: 9 },
        run: { row: 2, fr: 4, fps: 12 },
        fly: { row: 2, fr: 4, fps: 12 },
        jump: { row: 2, fr: 4, fps: 12 },
        land: { row: 1, fr: 4, fps: 10 },
        paw: { row: 4, fr: 4, fps: 12 },
        scared: { row: 5, fr: 1, fps: 1 },
        hurt: { row: 5, fr: 1, fps: 1 },
        sleep: { row: 0, fr: 2, fps: 2 },
        sit: { row: 0, fr: 2, fps: 3 },
        prepare: { row: 3, fr: 4, fps: 10 },
        cast: { row: 4, fr: 4, fps: 12 },
        toss: { row: 4, fr: 4, fps: 12 },
        falling: { row: 5, fr: 1, fps: 1 },
        standing: { row: 1, fr: 4, fps: 7 },
      },
      cols: 5,
      rows: 9,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 32,
      wallAnchorY: 16,
      renderScale: 0.75,
      className: "pixelcat-pet-fairy",
    },
    pigeon: {
      sheet: PIGEON_SHEET,
      anims: PIGEON_ANIMS,
      cols: 4,
      rows: 4,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 22,
      wallAnchorY: 16,
      renderScale: 0.9,
      className: "pixelcat-pet-pigeon",
    },
    bat: {
      sheet: BAT_SHEET,
      anims: BAT_ANIMS,
      cols: 7,
      rows: 5,
      cssWidth: 32,
      cssHeight: 32,
      yOffset: 0,
      anchorY: 32,
      wallAnchorY: 16,
      renderScale: 0.9,
      className: "pixelcat-pet-bat",
    },
  };
  activePet = "cat";
  activePetDef = PET_DEFS.cat;

  function isFairyPet() { return activePet === "fairy" || activePet === "pet_fairy" || isBatPet(); }
  function isSkeletonPet() { return activePet === "skeleton"; }
  function isPenguinPet() { return activePet === "penguin"; }
  function isFoxPet() {
    return activePet === "fox" || activePet === "red_panda";
  }

  function isPigeonPet() {
    return activePet === "pigeon" || activePet === "pet_pigeon";
  }

  function isFrogPet() {
    return activePet === "frog";
  }

  function isBatPet() {
    return activePet === "bat" || activePet === "pet_bat";
  }

  function isClippyPet() {
    return activePet === "clippy";
  }

  let clippyAnimName = null;
  let clippyFrameIdx = 0;

  function setClippyAnim(baseName) {
    const map = {
        "idle1": ["RestPose", "RestPose", "RestPose", "Idle1_1", "IdleEyeBrowRaise", "IdleFingerTap", "IdleSideToSide"],
        "idle2": ["IdleHeadScratch", "IdleRopePile", "LookRight", "LookLeft", "LookUp", "LookDown"],
        "walk": ["LookRight", "LookLeft"],
        "run": ["LookRight", "LookLeft"],
        "jump": ["GestureUp", "GetAttention"],
        "fly": ["IdleAtom"],
        "clean1": ["IdleHeadScratch"],
        "clean2": ["IdleSideToSide"],
        "eat": ["IdleFingerTap"],
        "pawplay": ["Writing"],
        "headtilt": ["Greeting", "Wave"],
        "paw": ["Writing"],
        "scared": ["Alert", "Hearing_1"],
        "sleep": ["IdleSnooze"],
        "drag": ["Hide"],
        "hurt": ["LookDownLeft", "LookDownRight"],
        "damage": ["LookDownLeft"],
        "death": ["GoodBye"],
        "searching": ["Searching"]
    };

    let chosen = null;
    if (baseName === "idle1" || baseName === "idle2") {
        const commonIdles = [
          "RestPose", "IdleEyeBrowRaise", "LookRight", "LookLeft",
          "LookUpRight", "LookUpLeft", "IdleHeadScratch", "IdleSideToSide",
          "IdleFingerTap", "Greeting", "GestureUp", "GestureLeft", "GestureRight"
        ];
        const rareIdles = [
          "IdleRopePile", "IdleAtom", "GetTechy", "GetWizardy", "Thinking"
        ];
        if (Math.random() < 0.85) {
          chosen = commonIdles[Math.floor(Math.random() * commonIdles.length)];
        } else {
          chosen = rareIdles[Math.floor(Math.random() * rareIdles.length)];
        }
    } else {
        const arr = map[baseName] || ["RestPose"];
        chosen = arr[Math.floor(Math.random() * arr.length)];
    }
    
    clippyAnimName = chosen;
    clippyFrameIdx = 0;
    animAccum = 0;
  }

  function tickClippyAnim(dtMs) {
    if (!clippyAnimName || !window.CLIPPY_DATA) return;
    const animData = window.CLIPPY_DATA.animations[clippyAnimName];
    if (!animData || !animData.frames || animData.frames.length === 0) return;
    
    animAccum += dtMs;
    
    let curF = animData.frames[clippyFrameIdx];
    if (!curF) {
      clippyFrameIdx = 0;
      curF = animData.frames[0];
    }
    
    while (curF && animAccum >= (curF.duration || 100)) {
      animAccum -= (curF.duration || 100);
      
      let nextIdx = clippyFrameIdx + 1;
      let branchingChosen = false;

      if (!window.clippyWantsToExit && curF.branching && curF.branching.branches && curF.branching.branches.length > 0) {
          curF._branchVisits = (curF._branchVisits || 0) + 1;
          if (curF._branchVisits <= 2 && Math.random() < 0.25) {
              let r = Math.random() * 100;
              for (let i = 0; i < curF.branching.branches.length; i++) {
                  let b = curF.branching.branches[i];
                  if (r <= b.weight) {
                      nextIdx = b.frameIndex;
                      branchingChosen = true;
                      break;
                  }
                  r -= b.weight;
              }
          } else {
              curF._branchVisits = 0;
          }
      }

      if (!branchingChosen && curF.exitBranch !== undefined) {
          if (window.clippyWantsToExit) {
              nextIdx = curF.exitBranch;
          }
      }
      
      if (nextIdx >= animData.frames.length) {
          nextIdx = 0;
          if (window.clippyWantsToExit || animLockTimer <= 0) {
              window.clippyWantsToExit = false;
              go("sit");
              setAnim("idle1", true);
              return;
          }
      }
      clippyFrameIdx = nextIdx;
      curF = animData.frames[clippyFrameIdx];
    }
    
    if (curF && curF.images && curF.images.length > 0) {
      const imgObj = curF.images[0];
      const vs = getCatVisualScale();
      const newBgX = Math.round(-imgObj[0] * vs);
      const newBgY = Math.round(-imgObj[1] * vs);
      if (newBgX !== _lastBgX || newBgY !== _lastBgY) {
        _lastBgX = newBgX;
        _lastBgY = newBgY;
        catEl.style.backgroundPosition = `${newBgX}px ${newBgY}px`;
      }
    }
  }

  function applyFrogHat() {
    if (!isFrogPet()) return;
    let sheetFile = "frog_green_spritesheet.png";
    if (!isCompanion) {
      if (_activeHatId === "hat_clown") sheetFile = "frog_clown_spritesheet.png";
      else if (_activeHatId === "hat_cowboy") sheetFile = "frog_cowboy_spritesheet.png";
      else if (_activeHatId === "hat_pirate") sheetFile = "frog_pirate_spritesheet.png";
      else if (_activeHatId === "hat_tophat") sheetFile = "frog_tophat_spritesheet.png";
      else if (_activeHatId === "hat_viking") sheetFile = "frog_viking_spritesheet.png";
      else if (_activeHatId === "hat_funnyglasses") sheetFile = "frog_funnyglasses_spritesheet.png";
    }
    
    const newSheet = u("assets/animations/frog/" + sheetFile);
    if (!isCompanion) {
      PET_DEFS.frog.sheet = newSheet;
    }
    if (catEl && activePetDef === PET_DEFS.frog) {
      catEl.style.backgroundImage = `url("${newSheet}")`;
      if (isCompanion) {
        catEl.style.filter = "sepia(0.6) hue-rotate(65deg) saturate(2.2) brightness(0.72) contrast(1.15)";
      } else {
        catEl.style.filter = "none";
      }
    }
  }

  let fairyFlightPhase = 0; 
  let fairyFlightTime = 0;
  let fairyFlightTargetX = 0;
  let fairyFlightTargetY = 0;
  let fairyAnimTime = 0; 
  let fairyFollowsCursor = true; 
  let batCeilingHang = false; 
  let batCeilingHover = 0; 
  let batCeilingCooldown = 0; 
  let batCeilingSleepLeft = 0; 

  function beginFairyFlight() {
    fairyFlightPhase = 1;
    fairyFlightTime = 0;
    const direction = velX !== 0 ? (velX < 0 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    fairyFlightTargetX = Math.max(80, Math.min(_vw - 80, feetX + direction * (160 + Math.random() * 320)));
    fairyFlightTargetY = Math.max(80, Math.min(_vh - 140, feetY + (Math.random() - 0.5) * 280));
    onGround = false;
    isJumping = true;
    setAnim("fly", true);
  }

  function updateFairyFlight(dt) {
    if ((!isFairyPet() && !isPigeonPet()) || isDragging || isPlayingSpawnCarry || isDestroyed || !catEl || !catEl.isConnected || catEl.style.visibility === "hidden" || catEl.style.display === "none") return false;

    if (quickSpawnMenuOpen || state === "quick_menu_hold") {
      velX = 0;
      velY = 0;
      globalRot = 0;
      visualRot = 0;
      if (animLockTimer <= 0) {
        if (isPigeonPet() && onGround) {
          if (quickSpawnMenuCalmAnim) setAnim(quickSpawnMenuCalmAnim);
          return false;
        } else {
          setAnim(isPigeonPet() ? "fly" : "idle1");
        }
      } else {
        if (isPigeonPet() && onGround) return false;
      }
      return true;
    }

    if (onGround) {
      globalRot = 0;
      visualRot = 0;
      return false;
    }

    // If the bat roams up close to the ceiling and hovers there calmly for
    // a bit, it may latch onto it and fall asleep again — never on every
    // pass, and never while darting or right after waking up.
    if (isBatPet()) {
      batCeilingCooldown = Math.max(0, batCeilingCooldown - dt);
      if (
        !batCeilingHang &&
        !isDragging &&
        state !== "bat_dead" &&
        state !== "deepsleep" &&
        batCeilingCooldown <= 0 &&
        fairyFlightPhase === 2 &&
        feetY <= 110
      ) {
        batCeilingHover += dt;
        if (batCeilingHover >= 2) {
          if (Math.random() < 0.4) {
            batCeilingHang = true;
            batCeilingSleepLeft = 25000 + Math.random() * 35000;
            fairyGroundedByUser = false;
            state = "sleep";
            stateTimer = 999999;
            setAnim("sleep", true);
          } else {
            batCeilingHover = 0;
          }
        }
      } else {
        batCeilingHover = 0;
      }
    }
    if (isBatPet() && batCeilingHang) {
      if (batCeilingHang && !isDragging) {
        batCeilingSleepLeft -= dt * 1000;
        if (batCeilingSleepLeft <= 0) {
          batCeilingHang = false;
          batCeilingCooldown = 25000 + Math.random() * 25000;
          beginFairyFlight();
          go("wander");
          return true;
        }
      }
      const hangY = 46 + Math.sin(fairyAnimTime * 1.3) * 3;
      feetY += (hangY - feetY) * Math.min(1, dt * 10);
      velX = 0;
      velY = 0;
      globalRot = 0;
      visualRot = 0;
      onGround = false;
      isJumping = true;
      fairyFlightPhase = 0;
      fairyFlightTime = 0;
      if (curAnim !== ANIMS.sleep) setAnim("sleep", true);
      return true;
    }

    // Deep sleep (idle too long): flying pets settle mid-air with the sleep
    // animation (pigeons glide down to the ground instead). They are never
    // pulled to the ceiling — the bat only hangs there when it is close.
    if (state === "deepsleep" && (isFairyPet() || isPigeonPet())) {
      const floor = computeFloor(feetX);
      const landY = Math.min(_vh - 60, Math.max(50, floor));
      const dsDx = _vw - 60 - feetX;
      if (isPigeonPet() && feetY >= landY - 40) {
        feetY = landY;
        velY = 0;
        velX = 0;
        onGround = true;
        isJumping = false;
        fairyFlightPhase = 0;
        fairyFlightTime = 0;
        if (curAnim !== ANIMS.sleep) setAnim("sleep", true);
        return true;
      }
      if (isPigeonPet()) {
        velY += 420 * dt;
        if (velY > 380) velY = 380;
      } else {
        velY *= 0.5;
      }
      velX = Math.max(-80, Math.min(80, dsDx * 0.5));
      if (Math.abs(dsDx) < 30) velX = 0;
      setDir(velX < 0);
      onGround = false;
      isJumping = true;
      fairyFlightPhase = 0;
      fairyFlightTime = 0;
      if (curAnim !== (isPigeonPet() ? ANIMS.fly : ANIMS.sleep))
        setAnim(isPigeonPet() ? "fly" : "sleep", true);
      return true;
    }

    // Thrown hard → the bat drops straight down with gravity onto the
    // surface directly below it, holding its last death frame, then gets
    // up. It lands EXACTLY on that surface (platform top or page bottom),
    // with no gap — unlike computeFloor, this scans the next surface BELOW
    // the bat's current position so falling can't skip past it.
    if (isBatPet() && state === "bat_dead") {
      let landY = _vh;
      for (let i = 0; i < envRects.length; i++) {
        const r = envRects[i];
        if (!r.isPlatform) continue;
        const inset = getPlatformInset(r);
        if (feetX < r.left + inset || feetX > r.right - inset) continue;
        const standY = getPlatformStandY(r);
        if (standY > 50 && standY >= feetY && standY < landY) landY = standY;
      }
      if (feetY + velY * dt >= landY) {
        feetY = landY;
        velY = 0;
        velX = 0;
        onGround = true;
        isJumping = false;
      } else {
        velY += 850 * dt;
        if (velY > 750) velY = 750;
        velX *= 1 - 1.8 * dt;
      }
      globalRot = 0;
      visualRot = 0;
      fairyFlightPhase = 0;
      fairyFlightTime = 0;
      if (curAnim !== ANIMS.death) setAnim("death", true);
      return true;
    }

    fairyFlightTime += dt;
    fairyAnimTime += dt;

    const lissX = Math.cos(fairyAnimTime * 1.4) * 32 + Math.sin(fairyAnimTime * 2.8) * 16 + Math.cos(fairyAnimTime * 4.9) * 8;
    const lissY = -Math.sin(fairyAnimTime * 1.8) * 36 + Math.cos(fairyAnimTime * 3.4) * 18 + Math.sin(fairyAnimTime * 5.2) * 6;

    const floor = computeFloor(feetX);
    const isResting = !isFairyPet() && (state === "sit" || state === "sleep" || state === "nap" || state === "groom" || state === "eatfish");

    let targetX = fairyFlightTargetX;
    let targetY = fairyFlightTargetY;

    const shouldFollowCursor = isFairyPet() ? fairyFollowsCursor : (isPigeonPet() ? pigeonFollowsCursor : isLoyalMode);

    if (shouldFollowCursor && !isResting) {
      
      targetX = Math.max(60, Math.min(_vw - 60, cursorX));
      targetY = Math.max(60, Math.min(_vh - 80, cursorY - (isPigeonPet() ? 30 : 45)));
      
      const distToCursor = Math.hypot(targetX - feetX, targetY - feetY);
      if (distToCursor < 60) {
        fairyFlightPhase = 2; 
      } else if (distToCursor > 120) {
        fairyFlightPhase = 1; 
      }
    } else if (isResting) {
      
      if (feetY >= floor - 14) {
        feetY = floor;
        velY = 0;
        velX *= 0.35;
        onGround = true;
        isJumping = false;
        fairyFlightPhase = 0;
        fairyFlightTime = 0;
        globalRot = 0;
        visualRot = 0;
        if (isPigeonPet()) pigeonFollowsCursor = false;
        setAnim(isPigeonPet() ? "land" : "sit", true);
        return false;
      }
    } else {
      
      const distToTarget = Math.hypot(targetX - feetX, targetY - feetY);
      if (fairyFlightPhase === 1 && (distToTarget < 130 || fairyFlightTime > 10)) {
        
        fairyFlightPhase = 2;
        fairyFlightTime = 0;
      } else if (fairyFlightPhase === 2 && fairyFlightTime > (1.8 + Math.random() * 3)) {
        
        fairyFlightPhase = 1;
        fairyFlightTime = 0;
        const sweepAngle = Math.random() * Math.PI * 2;
        const longFlight = Math.random() < 0.75;
        const sweepDist = longFlight ? 320 + Math.random() * 380 : 120 + Math.random() * 160;
        fairyFlightTargetX = Math.max(60, Math.min(_vw - 60, feetX + Math.cos(sweepAngle) * sweepDist));
        fairyFlightTargetY = Math.max(70, Math.min(_vh - 70, feetY + Math.sin(sweepAngle) * (sweepDist * 0.9)));
      }
      targetX = fairyFlightTargetX;
      targetY = fairyFlightTargetY;
    }

    let desiredVx = 0;
    let desiredVy = 0;

    if (isResting) {
      targetY = floor;
      const dx = targetX - feetX;
      const dy = targetY - feetY;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        desiredVx = (dx / dist) * 120;
        desiredVy = (dy / dist) * 120;
      }
    } else {
      const dx = (targetX + lissX * 0.4) - feetX;
      const dy = (targetY + lissY * 0.4) - feetY;
      const dist = Math.hypot(dx, dy);
      const flutter = 1 + 0.12 * Math.sin(fairyAnimTime * 2.1);
      const speed = fairyFlightPhase === 1 ? (shouldFollowCursor ? 280 : 225 * flutter) : 75 * flutter;

      if (dist > 5) {
        
        const mappedSpeed = dist < 130 ? speed * (dist / 130) : speed;
        desiredVx = (dx / dist) * mappedSpeed;
        desiredVy = (dy / dist) * mappedSpeed;
      }

      const targetBank = Math.max(-16, Math.min(16, (velX * 0.058) + (velY * 0.022)));
      globalRot += (targetBank - globalRot) * (1 - Math.pow(0.001, dt));
      visualRot = globalRot;
    }

    const steerFactor = 1 - Math.pow(0.003, dt);
    velX += (desiredVx - velX) * steerFactor;
    velY += (desiredVy - velY) * steerFactor;

    if (velX > 45) setDir(false);
    else if (velX < -45) setDir(true);

    if (animLockTimer <= 0) {
      if (isPigeonPet() && onGround) {
        const absVx = Math.abs(velX);
        if (absVx > 12) {
          setAnim("walk");
        } else {
          setAnim("idle1");
        }
        velY = 0;
      } else if (isPigeonPet() && !onGround) {
        const floor = computeFloor(feetX);
        const nearGround = feetY >= floor - 22;
        if (nearGround) {
          feetY = floor;
          velY = 0;
          onGround = true;
          isJumping = false;
          globalRot = 0;
          visualRot = 0;
          const absVx = Math.abs(velX);
          if (absVx > 12) {
            setAnim("walk");
          } else {
            setAnim("idle1");
          }
        } else {
          setAnim("fly");
        }
      } else if (!isResting) {
        setAnim("fly");
      } else {
        setAnim(onGround ? "sit" : "fly");
      }
    }

    return true;
  }

  const FOX_DISABLED_STATES = new Set([
    "attack",
    "knockoff",
    "ui_mischief",
    "logo_hunt",
    "chip_pounce",
    "search_paw",
  ]);

  const SKELETON_DISABLED_STATES = new Set([
    "attack",
    "knockoff",
    "ui_mischief",
    "logo_hunt",
    "chip_pounce",
    "search_paw",
  ]);
  const FAIRY_DISABLED_STATES = new Set([
    "attack",
    "knockoff",
    "ui_mischief",
    "logo_hunt",
    "chip_pounce",
    "search_paw",
    "wall_left",
    "wall_right",
    "wall_left_sit",
    "wall_right_sit",
    "ninja_climb",
    "chasefish",
    "chase",
    "ball_play",
    "spider_chase",
    "spider_attack",
    "sleep",
    "nap",
    "sit",
    "groom",
    "eatfish"
  ]);
  const PIGEON_DISABLED_STATES = new Set([
    "attack",
    "knockoff",
    "ui_mischief",
    "logo_hunt",
    "chip_pounce",
    "search_paw",
    "chase",
    "chasefish",
    "chasespider",
    "spider_chase",
    "spider_attack",
    "ball_play",
    "portal_seek",
    "climbtop",
    "ninja_climb",
    "wall_left",
    "wall_right",
    "wall_left_sit",
    "wall_right_sit",
  ]);
  const FROG_DISABLED_STATES = new Set([
    "attack",
    "knockoff",
    "ui_mischief",
    "logo_hunt",
    "chip_pounce",
    "search_paw",
    "chase",
    "ball_play",
    "portal_seek",
    "climbtop",
    "ninja_climb",
    "wall_left",
    "wall_right",
    "wall_left_sit",
    "wall_right_sit",
  ]);
  ANIMS = activePetDef.anims;
  spriteYOffset = activePetDef.yOffset;

  const NON_MOVEMENT_ANIM_STATES = new Set([
    "sit",
    "stare",
    "headtilt",
    "groom",
    "stretch",
    "pawplay",
    "nap",
    "deepsleep",
    "dragged",
    "held",
    "hidden",
    "stunned",
    "wall_left",
    "wall_right",
    "wall_left_sit",
    "wall_right_sit",
    "peek_a_boo",
    "bubble_trap",
  ]);

  const BASE_SPEED_WALK = 100;
  const BASE_SPEED_RUN = 150;
  let SPEED_WALK = BASE_SPEED_WALK;
  let SPEED_RUN = BASE_SPEED_RUN;
  let speedMultiplier = 1.0;
  function updateSpeed() {

    const energyMult = Math.max(0.7, Math.min(1.3, 0.7 + (catEnergy / 100) * 0.6));
    let finalMult = speedMultiplier * energyMult;
    if (isSkeletonPet()) {
        finalMult *= 0.5;
    }
    SPEED_WALK = BASE_SPEED_WALK * finalMult;
    SPEED_RUN = isSkeletonPet() ? SPEED_WALK : (isPenguinPet() ? BASE_SPEED_RUN * 1.45 * finalMult : BASE_SPEED_RUN * finalMult);
  }
  let catSkinStr = "white";
  let foxSkinStr = "orange";
  let pigeonSkinStr = "black";
  let batSkinStr = "white";
  let _activeHatId = "hat_none";
  const GRAVITY = 1100;
  const JUMP_V = -560;

  const SPEECH_CONFIG = {
    IDLE_DELAY_MIN: 30000, 
    IDLE_DELAY_MAX: 60000, 
    INTERACTIVE_DELAY: 14000, 
    INTERACTIVE_VARIANCE: 12000, 
    COOLDOWN_INTERACTIVE: 6500, 
    COOLDOWN_NORMAL: 3500, 
    RETRY_DELAY_MIN: 5000, 
    RETRY_DELAY_MAX: 6000, 
  };

  const POSITIONING = {
    CAT_TOP_OFFSET: 0.8125, 
    CAT_MID_OFFSET: 0.4, 
    BUBBLE_GAP: 6, 
    BUBBLE_MARGIN: 8, 
    ARROW_MIN_OFFSET: 12, 
  };

  const AFK_CONFIG = {
    THRESHOLD_MS: 180000, 
    WALL_SPEAK_COOLDOWN: 2500, 
  };

  const IDLE_STATES = new Set([
    "sit",
    "stare",
    "groom",
    "stretch",
    "pawplay",
    "nap",
    "headtilt",
    "deepsleep",
  ]);

  loadXPAndShop();

  let bubbleTrapBlocksPickup = false;

  function hasConnectedEntity(items, isActive) {
    return (Array.isArray(items) ? items : []).some((item) => {
      if (!item) return false;
      if (item.el && !item.el.isConnected) return false;
      return typeof isActive === "function" ? isActive(item) : true;
    });
  }

  function hasActivePickup() {
    return (
      PixelCatRuntime.activePickupKind !== null ||
      hasConnectedEntity(PixelCatRuntime.fishes, (fish) => !fish.removing) ||
      hasConnectedEntity(
        PixelCatRuntime.balls,
        (ball) => !ball.exiting && !ball.removing,
      ) ||
      hasConnectedEntity(PixelCatRuntime.spiders, (spider) => !spider.dead)
    );
  }

  function claimActivePickup(kind) {
    if (hasActivePickup()) return false;
    PixelCatRuntime.activePickupKind = kind || "item";
    return true;
  }

  function releaseActivePickup(kind) {
    if (!kind || PixelCatRuntime.activePickupKind === kind)
      PixelCatRuntime.activePickupKind = null;
  }

  function isYouTubeVideoPlaying() {
    const videoEl = document.querySelector("video");
    return !!(
      videoEl &&
      !videoEl.paused &&
      !videoEl.ended &&
      videoEl.readyState >= 2 &&
      videoEl.currentTime > 0 &&
      !document.hidden &&
      isTabVisible
    );
  }

  const coinModule = window.PixelCatCoins({
    u,
    GRAVITY,
    hasShopBoost,
    awardCoins,
    recordQuestEvent,
    hasActivePickup,
    claimActivePickup,
    releaseActivePickup,
    isVideoPlaying: isYouTubeVideoPlaying,
    setAnimLocked,
    go,
    addTimeout,
    get vw() {
      return _vw;
    },
    get vh() {
      return _vh;
    },
    get sizeMultiplier() {
      return sizeMultiplier;
    },
    get catEnabled() {
      return catEnabled;
    },
    get isCompanion() {
      return isCompanion;
    },
    get freePlayMode() {
      return freePlayMode || unlockAll;
    },
    get unlockAll() {
      return unlockAll || freePlayMode;
    },
    get feetX() {
      return feetX;
    },
    get feetY() {
      return feetY;
    },
    get velY() {
      return velY;
    },
    set velY(value) {
      velY = value;
    },
    get onGround() {
      return onGround;
    },
    set onGround(value) {
      onGround = value;
    },
    get isJumping() {
      return isJumping;
    },
    set isJumping(value) {
      isJumping = value;
    },
    get state() {
      return state;
    },
    get isDragging() {
      return isDragging;
    },
    get draggedFish() {
      return draggedFish;
    },
    get draggedBall() {
      return draggedBall;
    },
    get criticalStates() {
      return _criticalStates;
    },
    get coinChaseTarget() {
      return coinChaseTarget;
    },
    set coinChaseTarget(value) {
      coinChaseTarget = value;
    },
  });
  const {
    getPetCoinReward,
    getFishCoinReward,
    updateCoinDrops,
    showCoinPopup,
  } = coinModule;

  const speechModule = window.PixelCatSpeech({
    API: extensionAPI,
    catId,
    addTimeout,
    removeTimeout,
    setAnimLocked,
    awardCoins,
    earnXP,
    showCoinPopup,
    spawnHeart,
    get feetX() {
      return feetX;
    },
    get feetY() {
      return feetY;
    },
    get VIS() {
      return VIS * sizeMultiplier;
    },
    get catHeight() {
      return (activePetDef ? (activePetDef.cssHeight || getActiveCell()) : getActiveCell()) * getCatVisualScale();
    },
    get isClippy() {
      return isClippyPet();
    },
    get state() {
      return state;
    },
    get isJumping() {
      return isJumping;
    },
    get velX() {
      return velX;
    },
    get targetFish() {
      return targetFish;
    },
    get targetSpider() {
      return targetSpider;
    },
    get isDragging() {
      return isDragging;
    },
    get draggedFish() {
      return typeof draggedFish !== "undefined" ? draggedFish : null;
    },
    get draggedBall() {
      return typeof draggedBall !== "undefined" ? draggedBall : null;
    },
    get isPurring() {
      return isPurring;
    },
    get isDeepSleep() {
      return isDeepSleep;
    },
    get catEnabled() {
      return catEnabled;
    },
    get speechEnabled() {
      return speechEnabled;
    },
    get memoryEnabled() {
      return memoryEnabled;
    },
    get uiLanguage() {
      return uiLanguage;
    },
    get activePet() {
      return activePetStr;
    },
    get activePetKind() {
      return activePet;
    },
    get isTabVisible() {
      return isTabVisible;
    },
    get bubbleTrapActive() {
      return !!(bubbleTrap && bubbleTrap.active);
    },
    get bubbleTrapWidth() {
      return bubbleTrap ? bubbleTrap.width : 0;
    },
    get bubbleTrapHeight() {
      return bubbleTrap ? bubbleTrap.height : 0;
    },
    get _vw() {
      return _vw;
    },
    get _vh() {
      return _vh;
    },
    get IDLE_STATES() {
      return IDLE_STATES;
    },
    get catEnergy() {
      return catEnergy;
    },
    set catEnergy(val) {
      catEnergy = val;
    },
  });
  const {
    scheduleIdleChatter,
    speakFromCategory,
    maybeSpeakAction,
    speakGrabbed,
    maybeSpeakConfused,
    maybeSpeakAngry,
    showSpeech,
    hideSpeechBubble,
    positionSpeechBubble,
    markSpeechMeasure,
    updateWatchMemory,
    clearMemory: clearSpeechMemory,
  } = speechModule;

  let lastObjectInteractionSpeechAt = 0;
  function speakObjectInteraction(category) {
    if (
      !category ||
      !speechModule ||
      typeof speechModule.speakFromCategory !== "function"
    )
      return;
    if (!catEnabled || !isTabVisible || document.hidden) return;
    const now = safeNow();

    if (now - lastObjectInteractionSpeechAt < 3200) return;
    lastObjectInteractionSpeechAt = now;
    speechModule.speakFromCategory(category, {
      force: true,
      allowReplace: true,
      durationMs: 2600,
      cooldownMs: 9000,
    });
  }

  let rafId = null;

  function addInterval(fn, ms) {
    const id = setInterval(fn, ms);
    managedIntervals.add(id);
    return id;
  }
  function removeInterval(id) {
    if (id != null) {
      clearInterval(id);
      managedIntervals.delete(id);
    }
  }
  function addTimeout(fn, ms) {
    const id = setTimeout(() => {
      managedTimeouts.delete(id);
      fn();
    }, ms);
    managedTimeouts.add(id);
    return id;
  }
  function removeTimeout(id) {
    if (id != null) {
      clearTimeout(id);
      managedTimeouts.delete(id);
    }
  }

  if (isClippyPet()) {
    feetX = Math.round(window.innerWidth - 87);
    feetY = Math.round(window.innerHeight - 25);
  } else if (isFairyPet()) {
    feetX = Math.round(120 + Math.random() * Math.max(100, window.innerWidth - 240));
    feetY = Math.round(100 + Math.random() * Math.max(100, window.innerHeight * 0.55));
    onGround = false;
    isJumping = true;
  } else if (isCompanion) {
    feetX = window.innerWidth * 0.42;
    feetY = FLOOR_Y();
  } else {
    feetX = window.innerWidth * 0.38;
    feetY = FLOOR_Y();
  }

  const catEl = document.createElement("div");
  catEl.id = catId;
  catEl.classList.add("youtube-pixel-cat");
  catEl.style.backgroundImage = `url("${activePetDef.sheet}")`;
  catEl.classList.add(activePetDef.className);
  catEl.style.visibility = "hidden";
  document.body.appendChild(catEl);
  
  updateCatElementSize();

  const BUBBLE_FRAME_W = 24;
  const BUBBLE_FRAME_H = 28;
  const BUBBLE_FRAME_COUNT = 20;
  const BUBBLE_TRAP_HOLD_FRAME = 13; 
  const BUBBLE_GROW_LAST_FRAME = BUBBLE_TRAP_HOLD_FRAME;
  const BUBBLE_POP_FIRST_FRAME = 14;
  const BUBBLE_FPS = 18;
  
  const BUBBLE_DVD_MIN_X_SPEED = 36;
  const BUBBLE_DVD_MAX_X_SPEED = 74;
  const BUBBLE_DVD_MIN_Y_SPEED = 31;
  const BUBBLE_DVD_MAX_Y_SPEED = 66;

  const BUBBLE_FIRST_DELAY_MIN = 24;
  const BUBBLE_FIRST_DELAY_MAX = 52;
  const BUBBLE_RETRY_DELAY_MIN = 18;
  const BUBBLE_RETRY_DELAY_MAX = 34;
  const BUBBLE_REPEAT_DELAY_MIN = 150;
  const BUBBLE_REPEAT_DELAY_MAX = 300;
  const BUBBLE_END_COOLDOWN_MS = 90000;
  const randomBubbleTrapDelay = (min, max) => min + Math.random() * (max - min);
  let bubbleSpawnTimer = randomBubbleTrapDelay(
    BUBBLE_FIRST_DELAY_MIN,
    BUBBLE_FIRST_DELAY_MAX,
  );
  let lastBubbleTrapEndedAt = 0;
  const bubbleTrap = {
    active: false,
    popping: false,
    trapped: false,
    el: null,
    x: 0,
    y: 0,
    vx: 0,
    vy: -24,
    timer: 0,
    frame: 0,
    frameAccum: 0,
    bubbleAnimName: "idle1",
    bubbleAnimTimer: 0,
    renderScale: 3.4,
    width: BUBBLE_FRAME_W * 3.4,
    height: BUBBLE_FRAME_H * 3.4,
  };

  function randomBubbleTrapSpeed(min, max) {
    return min + Math.random() * (max - min);
  }

  function signedBubbleTrapSpeed(sign, min, max) {
    return (sign < 0 ? -1 : 1) * randomBubbleTrapSpeed(min, max);
  }

  function normalizeBubbleTrapVelocity() {
    if (!bubbleTrap.active || bubbleTrap.popping) return;

    const sx = bubbleTrap.vx < 0 ? -1 : 1;
    const sy = bubbleTrap.vy < 0 ? -1 : 1;
    const ax = Math.abs(bubbleTrap.vx);
    const ay = Math.abs(bubbleTrap.vy);

    if (ax < BUBBLE_DVD_MIN_X_SPEED)
      bubbleTrap.vx = signedBubbleTrapSpeed(
        sx,
        BUBBLE_DVD_MIN_X_SPEED,
        BUBBLE_DVD_MIN_X_SPEED + 14,
      );
    else if (ax > BUBBLE_DVD_MAX_X_SPEED)
      bubbleTrap.vx = sx * BUBBLE_DVD_MAX_X_SPEED;

    if (ay < BUBBLE_DVD_MIN_Y_SPEED)
      bubbleTrap.vy = signedBubbleTrapSpeed(
        sy,
        BUBBLE_DVD_MIN_Y_SPEED,
        BUBBLE_DVD_MIN_Y_SPEED + 16,
      );
    else if (ay > BUBBLE_DVD_MAX_Y_SPEED)
      bubbleTrap.vy = sy * BUBBLE_DVD_MAX_Y_SPEED;
  }

  const BUBBLE_TRAP_SPEECH = {
    trapped: [
      "Help me, human.",
      "I said help me.",
      "Little rescue, please.",
      "Bubble problem here.",
      "Human. Pop bubble.",
      "This is embarrassing.",
      "I am floating now.",
      "Please fix this.",
      "Trapped. Very elegant.",
      "Outstanding. I am trapped.",
      "A tiny rescue?",
      "Why am I airborne?",
      "I do not like bubbles.",
      "This smells like soap.",
      "Too clean in here.",
      "I wanted fish, not foam.",
      "This is not a toy.",
      "Who approved this bubble?",
      "I feel ridiculous.",
      "Floating was not my idea.",
      "This is cat slander.",
      "Soap prison. Great.",
      "Pop it. Respectfully.",
      "I miss the ground.",
      "This is deeply undignified.",
      "Bubbles are for baths.",
      "I hate bath vibes.",
    ],
    petted: [
      "That helps. Keep going.",
      "Nice, but pop it.",
      "Good pats. Wrong problem.",
      "Comfort accepted.",
      "That is nice. Still trapped.",
      "Pet first, rescue second?",
      "Yes, yes. Now pop it.",
      "Better. Still floating.",
      "Good human. Pop bubble.",
      "Approved. Rescue me.",
      "That smells like soap.",
      "Soft pats. Bad bubble.",
      "Nice try. Still airborne.",
      "Love the pats. Hate this.",
      "Excellent petting. Awful situation.",
      "Very nice. Very trapped.",
      "I appreciate the effort.",
      "Okay, that is soothing.",
      "Pamper later. Pop now.",
      "Good service. Bad bubble.",
    ],
    popped: [
      "Finally.",
      "Freedom.",
      "About time.",
      "Much better.",
      "Bubble defeated.",
      "Ground. Sweet ground.",
      "Back to business.",
      "I can walk again.",
      "That was rude.",
      "Never again.",
      "Soap era ended.",
      "Fresh air, finally.",
      "I survived the foam.",
      "No more bubbles.",
      "That was not funny.",
      "I prefer gravity.",
      "Rescued. As expected.",
      "Excellent. We forget this.",
      "I am judging that bubble.",
      "My dignity returns.",
      "Back on solid ground.",
    ],
  };

  function getBubbleRenderScale() {
    return Math.max(2.75, Math.min(5.25, 3.35 * sizeMultiplier));
  }

  function refreshBubbleTrapScale() {
    if (!bubbleTrap || !bubbleTrap.el) return;
    bubbleTrap.renderScale = getBubbleRenderScale();
    bubbleTrap.width = BUBBLE_FRAME_W * bubbleTrap.renderScale;
    bubbleTrap.height = BUBBLE_FRAME_H * bubbleTrap.renderScale;
    bubbleTrap.el.style.width = `${bubbleTrap.width}px`;
    bubbleTrap.el.style.height = `${bubbleTrap.height}px`;
    bubbleTrap.el.style.backgroundSize = `${BUBBLE_FRAME_W * BUBBLE_FRAME_COUNT * bubbleTrap.renderScale}px ${BUBBLE_FRAME_H * bubbleTrap.renderScale}px`;
    bubbleTrap.el.style.backgroundPosition = `${-bubbleTrap.frame * bubbleTrap.width}px 0px`;
  }

  function setBubbleTrapFrame(frame) {
    if (!bubbleTrap.el) return;
    bubbleTrap.frame = Math.max(0, Math.min(BUBBLE_FRAME_COUNT - 1, frame | 0));
    bubbleTrap.el.style.backgroundPosition = `${-bubbleTrap.frame * bubbleTrap.width}px 0px`;
  }

  function positionBubbleTrap() {
    if (!bubbleTrap.el) return;

    const tx = (bubbleTrap.x - bubbleTrap.width / 2).toFixed(2);
    const ty = (bubbleTrap.y - bubbleTrap.height / 2).toFixed(2);
    bubbleTrap.el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    if (state === "bubble_trap") {
      feetX = bubbleTrap.x;
      feetY = bubbleTrap.y + bubbleTrap.height * 0.245;
    }
  }

  function cleanupBubbleTrap() {
    if (bubbleTrap.el && bubbleTrap.el.isConnected) bubbleTrap.el.remove();
    bubbleTrap.active = false;
    bubbleTrap.popping = false;
    bubbleTrap.trapped = false;
    bubbleTrap.el = null;
    bubbleTrapBlocksPickup = false;
  }

  function pickBubbleTrapAnim(previous = "") {
    const options = isSkeletonPet()
      ? ["idle1", "idle2", "clean1", "clean2"]
      : ["idle1", "idle2", "sleep", "scared"];
    const weighted = isSkeletonPet()
      ? ["idle1", "idle1", "idle2", "idle2", "clean1", "clean2"]
      : [
          "idle1",
          "idle1",
          "idle2",
          "idle2",
          "sleep",
          "sleep",
          "scared",
        ];
    let next = weighted[(Math.random() * weighted.length) | 0];
    if (next === previous) {
      const fallback = options.filter(
        (name) => name !== previous && ANIMS[name],
      );
      if (fallback.length)
        next = fallback[(Math.random() * fallback.length) | 0];
    }
    if (!ANIMS[next])
      next = ANIMS.idle1
        ? "idle1"
        : ANIMS.idle2
          ? "idle2"
          : ANIMS.sleep
            ? "sleep"
            : "scared";
    return next;
  }

  function refreshBubbleTrapAnim(force) {
    const next = pickBubbleTrapAnim(force ? "" : bubbleTrap.bubbleAnimName);
    bubbleTrap.bubbleAnimName = next;
    bubbleTrap.bubbleAnimTimer = 1.8 + Math.random() * 2.6;
    setAnim(next, true);
  }

  function maybeSpeakBubbleTrap(kind, options) {
    const lines = BUBBLE_TRAP_SPEECH[kind];
    if (!lines || !lines.length) return;
    if (
      isCompanion ||
      !speechModule ||
      typeof speechModule.showSpeech !== "function"
    )
      return;
    if (!catEnabled || !isTabVisible || document.hidden) return;

    const allowReplace = !!(options && options.allowReplace);
    if (!allowReplace && speechModule.speechVisible) return;

    const text = lines[(Math.random() * lines.length) | 0];
    speechModule.showSpeech(text, {
      durationMs: options && options.durationMs ? options.durationMs : 2800,
      cooldownMs: options && options.cooldownMs ? options.cooldownMs : 1600,
    });
  }

  function releaseFromBubbleTrap() {
    const wasActive = bubbleTrap.active;
    cleanupBubbleTrap();
    if (!wasActive || isDestroyed || !catEnabled) return;
    lastBubbleTrapEndedAt = safeNow();
    bubbleSpawnTimer = randomBubbleTrapDelay(
      BUBBLE_REPEAT_DELAY_MIN,
      BUBBLE_REPEAT_DELAY_MAX,
    );
    animLockTimer = 0;
    catEl.style.pointerEvents = "auto";
    catEl.style.opacity = "1";
    catEl.style.zIndex = "9999999";
    globalRot = 0;
    visualRot = 0;
    velX = (Math.random() - 0.5) * 90;
    velY = 110 + Math.random() * 70;
    onGround = false;
    isJumping = true;
    isDragging = false;
    state = "jump";
    stateTimer = 2200;
    setAnim("jump", true);
    maybeSpeakBubbleTrap("popped", {
      allowReplace: true,
      durationMs: 2600,
      cooldownMs: 1400,
    });
    applyPos();
  }

  function popBubbleTrap() {
    if (!bubbleTrap.active || bubbleTrap.popping) return;
    bubbleTrap.popping = true;
    bubbleTrap.frameAccum = 0;
    setBubbleTrapFrame(BUBBLE_POP_FIRST_FRAME);
    if (typeof spawnDust === "function") {
      spawnDust(bubbleTrap.x, bubbleTrap.y + bubbleTrap.height * 0.28);
    }
  }

  function checkBubbleTrapBuddyCollision() {
    if (!bubbleTrap.active || bubbleTrap.popping || !bubbleTrap.trapped) return;
    const myHalfW = Math.max(18, bubbleTrap.width * 0.48);
    const myHalfH = Math.max(18, bubbleTrap.height * 0.48);

    for (const other of PixelCatRuntime.instances) {
      if (!other || other === api) continue;
      if (
        !other.bubbleTrapActive ||
        other.bubbleTrapPopping ||
        !other.bubbleTrapTrapped
      )
        continue;

      const otherHalfW = Math.max(
        18,
        Number(other.bubbleTrapWidth || 0) * 0.48,
      );
      const otherHalfH = Math.max(
        18,
        Number(other.bubbleTrapHeight || 0) * 0.48,
      );
      const dx = Math.abs(Number(other.bubbleTrapX || 0) - bubbleTrap.x);
      const dy = Math.abs(Number(other.bubbleTrapY || 0) - bubbleTrap.y);

      if (dx <= myHalfW + otherHalfW - 5 && dy <= myHalfH + otherHalfH - 5) {
        popBubbleTrap();
        if (typeof other.popBubbleTrap === "function") other.popBubbleTrap();
        break;
      }
    }
  }

  function canStartBubbleTrap(pageSettling) {
    if (
      quickSpawnMenuOpen ||
      pageSettling ||
      lowPowerMode ||
      !rareEventsEnabled
    )
      return false;
    if (
      !catEnabled ||
      !isTabVisible ||
      document.hidden ||
      isDragging ||
      isPurring ||
      isDeepSleep
    )
      return false;
    if (!onGround || isJumping || Math.abs(velX) > 8 || Math.abs(velY) > 25)
      return false;
    if (!IDLE_STATES.has(state) || _criticalStates.has(state)) return false;
    if (
      targetFish ||
      targetSpider ||
      coinChaseTarget ||
      PixelCatRuntime.activePickupKind !== null
    )
      return false;
    if (speechModule && speechModule.speechVisible) return false;
    return safeNow() - lastBubbleTrapEndedAt > BUBBLE_END_COOLDOWN_MS;
  }

  function startBubbleTrap() {
    cleanupBubbleTrap();
    bubbleTrapBlocksPickup = true;
    clearGroundedPlatformAnchor();
    const el = document.createElement("div");
    el.className = "pixelcat-trap-bubble";
    el.style.backgroundImage = _bubbleImgUrl;
    document.body.appendChild(el);

    bubbleTrap.active = true;
    bubbleTrap.popping = false;
    bubbleTrap.trapped = false;
    bubbleTrap.el = el;
    bubbleTrap.frame = 0;
    bubbleTrap.frameAccum = 0;
    bubbleTrap.timer = 0;
    bubbleTrap.vx = signedBubbleTrapSpeed(
      Math.random() < 0.5 ? -1 : 1,
      BUBBLE_DVD_MIN_X_SPEED + 8,
      BUBBLE_DVD_MAX_X_SPEED - 6,
    );
    
    bubbleTrap.vy = signedBubbleTrapSpeed(
      -1,
      BUBBLE_DVD_MIN_Y_SPEED + 6,
      BUBBLE_DVD_MAX_Y_SPEED - 8,
    );
    refreshBubbleTrapScale();
    bubbleTrap.x = feetX;
    
    bubbleTrap.y = feetY - bubbleTrap.height * 0.42;
    positionBubbleTrap();
    setBubbleTrapFrame(0);

    if (speechModule && speechModule.hideSpeechBubble)
      speechModule.hideSpeechBubble();
    velX = 0;
    velY = 0;
    onGround = false;
    isJumping = false;
    isDragging = false;

    globalRot = 0;
    visualRot = 0;
    state = "bubble_trap";
    stateTimer = 999999;
    animLockTimer = 0;
    refreshBubbleTrapAnim(true);
    catEl.style.opacity = "1";
    catEl.style.zIndex = "10000004";

    const popHandler = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      popBubbleTrap();
    };
    el.addEventListener("mousedown", popHandler);
    el.addEventListener("touchstart", popHandler, { passive: false });
    el.addEventListener("contextmenu", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      removeExistingQuickMenus();
    });
  }

  function updateBubbleTrap(dt, pageSettling) {
    if (isDestroyed) return;
    if (!rareEventsEnabled || lowPowerMode) {
      if (bubbleTrap.active) releaseFromBubbleTrap();
      return;
    }

    if (!bubbleTrap.active) {
      if (canStartBubbleTrap(pageSettling)) {
        bubbleSpawnTimer -= dt;
        if (bubbleSpawnTimer <= 0) {
          startBubbleTrap();
        }
      } else if (bubbleSpawnTimer < 12) {
        
        bubbleSpawnTimer = randomBubbleTrapDelay(
          BUBBLE_RETRY_DELAY_MIN,
          BUBBLE_RETRY_DELAY_MAX,
        );
      }
      return;
    }

    if (!catEnabled || !isTabVisible || document.hidden) return;
    bubbleTrap.timer += dt;
    bubbleTrap.frameAccum += dt;

    const frameStep = 1 / BUBBLE_FPS;
    while (bubbleTrap.frameAccum >= frameStep) {
      bubbleTrap.frameAccum -= frameStep;
      if (bubbleTrap.popping) {
        if (bubbleTrap.frame < BUBBLE_FRAME_COUNT - 1) {
          setBubbleTrapFrame(bubbleTrap.frame + 1);
        } else {
          releaseFromBubbleTrap();
          return;
        }
      } else if (bubbleTrap.frame < BUBBLE_GROW_LAST_FRAME) {
        setBubbleTrapFrame(bubbleTrap.frame + 1);
      }
    }

    if (!bubbleTrap.popping) {
      const growProgress = Math.min(
        1,
        bubbleTrap.frame / BUBBLE_GROW_LAST_FRAME,
      );
      if (!bubbleTrap.trapped && growProgress >= 0.58) {
        bubbleTrap.trapped = true;
        maybeSpeakBubbleTrap("trapped", { durationMs: 2900, cooldownMs: 1800 });
      }
      if (bubbleTrap.trapped) {
        
        bubbleTrap.x += bubbleTrap.vx * dt;
        bubbleTrap.y += bubbleTrap.vy * dt;

        const marginX = bubbleTrap.width * 0.5 + 8;
        const marginTop = bubbleTrap.height * 0.5 + 8;
        const marginBottom = Math.max(0, bubbleTrap.height * 0.5 - 7);
        const minX = marginX;
        const maxX = Math.max(minX, _vw - marginX);
        const minY = marginTop;
        const maxY = Math.max(minY, _vh - marginBottom);

        if (bubbleTrap.x < minX) {
          bubbleTrap.x = minX;
          bubbleTrap.vx = randomBubbleTrapSpeed(
            BUBBLE_DVD_MIN_X_SPEED,
            BUBBLE_DVD_MAX_X_SPEED,
          );
        }
        if (bubbleTrap.x > maxX) {
          bubbleTrap.x = maxX;
          bubbleTrap.vx = -randomBubbleTrapSpeed(
            BUBBLE_DVD_MIN_X_SPEED,
            BUBBLE_DVD_MAX_X_SPEED,
          );
        }
        if (bubbleTrap.y < minY) {
          bubbleTrap.y = minY;
          bubbleTrap.vy = randomBubbleTrapSpeed(
            BUBBLE_DVD_MIN_Y_SPEED,
            BUBBLE_DVD_MAX_Y_SPEED,
          );
        }
        if (bubbleTrap.y > maxY) {
          bubbleTrap.y = maxY;
          bubbleTrap.vy = -randomBubbleTrapSpeed(
            BUBBLE_DVD_MIN_Y_SPEED,
            BUBBLE_DVD_MAX_Y_SPEED,
          );
        }

        normalizeBubbleTrapVelocity();
        checkBubbleTrapBuddyCollision();

        bubbleTrap.bubbleAnimTimer -= dt;
        if (bubbleTrap.bubbleAnimTimer <= 0) refreshBubbleTrapAnim(false);

        velX = 0;
        velY = 0;
        onGround = false;
        isJumping = false;
        state = "bubble_trap";
      }
    }

    positionBubbleTrap();
    applyPos();
  }



  var curAnim = null,
    curFrame = 0,
    animAccum = 0;
  var lastDirVal = null;
  var skinAnimation = null;

  var dragOffX = 0,
    dragOffY = 0;
  var lastCatDragX = 0,
    lastCatDragY = 0,
    lastCatDragTs = 0;
  var catDragVX = 0,
    catDragVY = 0;
  var catThrowHeavyTimer = 0;
  var cursorX = window.innerWidth / 2;
  var cursorY = window.innerHeight / 2;

  var stateTimer = 0,
    targetX = 0;
  var attackEl = null,
    attackPhase = "move",
    attackHitTimer = 0;
  var lastTs = null;
  var idleAccum = 0;

  var globalRot = 0;
  var visualRot = 0;
  var portalTransformScale = 1.0;
  var portalTransformRotate = 0;
  var lastTransformStr = "";
  var lastTransformOriginStr = "";
  var lastAnimTs = 0; 
  var weightStepTimer = 0;
  var weightShakeUntil = 0;
  var weightShakeAnimation = null;

  const activeFishes = PixelCatRuntime.fishes;
  var fishSpawnTimer = 18 + Math.random() * 24; 
  var stuckCheckTimer = 0;
  var lastFishChaseX = 0;
  var fishDragOffsetX = 0;
  var fishDragOffsetY = 0;
  var lastFishDragX = 0;
  var lastFishDragY = 0;
  var lastFishDragTs = 0;

  var uiTarget = null;
  var uiWallTask = null;

  var animLockTimer = 0;
  var fightAnimCount = 0;

  var chosenIdle = "idle1";
  var chosenClean = "clean1";

  var catEnergy = 1.0; 
  var catBoredom = 0.0; 
  var catHunger = 0.0; 

  var pathfindCooldown = 0; 
  var chaseStuckTimer = 0; 
  var lastChaseDistToTarget = 9999;
  var chaseDropThroughUntil = 0; 
  var coinStuckCheckTimer = 0;
  var lastCoinChaseX = 0;
  var ballStuckCheckTimer = 0;
  var lastBallChaseX = 0;
  var generalStuckTimer = 0;
  var stuckSampleTimer = 0;
  var lastStuckSampleX = 0;
  var lastStuckSampleY = 0;
  var lastGeneralUnstuckAt = 0;

  var groundedPlatformEl = null;
  var groundedPlatformOffsetX = 0;
  var groundedPlatformLastSeenAt = 0;
  var groundedPlatformGraceUntil = 0;

  var lastUserActivity = Date.now();
  var lastClippyIdleAnim = Date.now();

  const AFK_THRESHOLD = 180000; 

  function onUserActivity() {
    lastUserActivity = Date.now();
    if (isDeepSleep) {
      isDeepSleep = false;
      if (state === "deepsleep") {
        if (isSkeletonPet()) {
          setAnimLocked("wake", 875);
          addTimeout(() => go("sit"), 875);
        } else {
          setAnimLocked("scared", 600);
          addTimeout(() => go("stretch"), 600);
        }
      }
    }
  }
  addManagedEventListener(document, "mousemove", onUserActivity, {
    passive: true,
  });
  addManagedEventListener(document, "keydown", onUserActivity, {
    passive: true,
  });
  addManagedEventListener(document, "click", onUserActivity, { passive: true });
  addManagedEventListener(document, "scroll", onUserActivity, {
    passive: true,
  });

  let petMeter = 0;
  let lastPetX = 0;
  let petDirectionChanges = 0;
  let lastPetDir = 0;

  function setAnim(name, force) {
    if (isSkeletonPet() && name === "run") name = "walk";
    if (onGround && !isJumping && isPigeonPet() && (name === "run" || name === "fly")) name = "walk";
    
    if (!onGround && (isPigeonPet() || isFairyPet()) && name !== "scared" && name !== "drag" && name !== "hurt" && name !== "death" && name !== "fly" && !(isBatPet() && name === "sleep")) {
      name = "fly";
    }

    if (
      name === "jump" &&
      onGround &&
      !isJumping &&
      Math.abs(velY) < 35 &&
      Math.abs(velX) < 8 &&
      isCalmGroundedStateName(state) &&
      state !== "jump"
    ) {
      return;
    }

    if (isClippyPet()) {
        if (!force && animLockTimer > 0) return;
        if (curAnim && curAnim.name === name) return;
        curAnim = { name: name };
        setClippyAnim(name);
        tickClippyAnim(0);
        return;
    }

    const d = ANIMS[name];
    if (!d) return;

    if (curAnim === d) return;
    
    if (!force && animLockTimer > 0) return;

    curAnim = d;
    curFrame = (isFrogPet() && (name === "run" || name === "jump")) ? (onGround ? 2 : (d.fr - 1)) : 0;
    animAccum = 0;
    const vs = getCatVisualScale();
    const frameIdx = d.frames ? d.frames[curFrame] : curFrame;
    if (d.vertical) {
      _lastBgX = Math.round(-d.col * getActiveCell() * vs);
      _lastBgY = Math.round((-( (d.row || 0) + frameIdx ) * getActiveCell() + spriteYOffset) * vs);
    } else {
      _lastBgX = Math.round(-frameIdx * getActiveCell() * vs);
      _lastBgY = Math.round((-(d.row * getActiveCell()) + spriteYOffset) * vs);
    }
    catEl.style.backgroundPosition = `${_lastBgX}px ${_lastBgY}px`;
  }

  function setAnimLocked(name, lockMs) {
    if (isSkeletonPet() && name === "run") name = "walk";
    if (onGround && !isJumping && isPigeonPet() && (name === "run" || name === "fly")) name = "walk";
    
    if (!onGround && (isPigeonPet() || isFairyPet()) && name !== "scared" && name !== "drag" && name !== "hurt" && name !== "death" && name !== "fly" && !(isBatPet() && name === "sleep")) {
      name = "fly";
      lockMs = 0;
    }
    animLockTimer = lockMs || 0;

    if (isClippyPet()) {
        if (curAnim && curAnim.name === name) return;
        curAnim = { name: name };
        setClippyAnim(name);
        tickClippyAnim(0);
        return;
    }

    const d = ANIMS[name];
    if (!d) return;
    curAnim = d;
    curFrame = (isFrogPet() && (name === "run" || name === "jump")) ? (onGround ? 2 : (d.fr - 1)) : 0;
    animAccum = 0;
    const vs = getCatVisualScale();
    const frameIdx = d.frames ? d.frames[curFrame] : curFrame;
    if (d.vertical) {
      _lastBgX = Math.round(-d.col * getActiveCell() * vs);
      _lastBgY = Math.round((-( (d.row || 0) + frameIdx ) * getActiveCell() + spriteYOffset) * vs);
    } else {
      _lastBgX = Math.round(-frameIdx * getActiveCell() * vs);
      _lastBgY = Math.round((-(d.row * getActiveCell()) + spriteYOffset) * vs);
    }
    catEl.style.backgroundPosition = `${_lastBgX}px ${_lastBgY}px`;
  }

  var _lastBgX = 0,
    _lastBgY = 0;

  function tickAnim(dt) {
    if (!curAnim) return;
    
    if (isClippyPet()) {
        if (animLockTimer > 0) {
            animLockTimer -= dt * 1000;
            if (animLockTimer <= 0 && !window.clippyWantsToExit) {
                window.clippyWantsToExit = true;
            }
        }
        tickClippyAnim(dt * 1000);
        return;
    }
    
    if (animLockTimer > 0) animLockTimer -= dt * 1000;
    animAccum += dt * 1000;
    const dur = 1000 / curAnim.fps;
    
    let advanced = 0;
    while (animAccum >= dur && advanced < 2) {
      animAccum -= dur;
      if (curAnim.noLoop) {
        if (curFrame < curAnim.fr - 1) {
          curFrame++;
        }
      } else {
        curFrame = (curFrame + 1) % curAnim.fr;
      }
      advanced++;
    }
    if (isFrogPet() && !onGround && (curAnim === ANIMS.run || curAnim === ANIMS.jump || curAnim === ANIMS.fly)) {
      curFrame = curAnim.frames ? (curAnim.fr - 1) : 3;
    }
    if (animAccum > dur * 3) animAccum = 0;

    const vs = getCatVisualScale();
    const frameIdx = curAnim.frames ? curAnim.frames[curFrame] : curFrame;
    let newBgX, newBgY;
    if (curAnim.vertical) {
      newBgX = Math.round(-curAnim.col * getActiveCell() * vs);
      newBgY = Math.round((-( (curAnim.row || 0) + frameIdx ) * getActiveCell() + spriteYOffset) * vs);
    } else {
      newBgX = Math.round(-frameIdx * getActiveCell() * vs);
      newBgY = Math.round((-curAnim.row * getActiveCell() + spriteYOffset) * vs);
    }
    if (newBgX !== _lastBgX || newBgY !== _lastBgY) {
      _lastBgX = newBgX;
      _lastBgY = newBgY;
      catEl.style.backgroundPosition = `${newBgX}px ${newBgY}px`;
    }
  }

  function applyTransform(rafTs) {
    const naturallyFacesLeft = !!(activePetDef && activePetDef.naturallyFacesLeft);
    const flip = naturallyFacesLeft ? (facingLeft ? 1 : -1) : (facingLeft ? -1 : 1);

    const rotDiff = globalRot - visualRot;
    if (Math.abs(rotDiff) > 0.05) {
      const now = rafTs || (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const dtRot = lastAnimTs > 0 ? Math.min(0.1, (now - lastAnimTs) / 1000) : 1 / 60;
      visualRot += rotDiff * (1 - Math.pow(0.0001, dtRot));
    } else {
      visualRot = globalRot;
    }

    const vs = getCatVisualScale();
    const petW = Math.round(((activePetDef && activePetDef.cssWidth) || getActiveCell()) * vs);
    const anchorY = Math.round(getPetAnchorY() * vs);

    let offsetX = petW / 2;
    let offsetY = anchorY;
    if (state === "bat_dead" && isBatPet()) {
      offsetY = Math.max(0, anchorY - Math.round(7 * vs));
    } else if (state === "wall_left" || state === "wall_left_sit") {
      offsetX = petW * 0.82;
      offsetY = Math.round(getPetWallAnchorY() * vs);
    } else if (state === "wall_right" || state === "wall_right_sit") {
      offsetX = petW * 0.18;
      offsetY = Math.round(getPetWallAnchorY() * vs);
    }

    let tx, ty;
    if (state === "bubble_trap") {
      tx = (feetX - offsetX).toFixed(2);
      ty = (feetY - offsetY).toFixed(2);
    } else {
      tx = Math.round(feetX - offsetX);
      ty = Math.round(feetY - offsetY);
    }

    const originStr = `${Math.round(offsetX)}px ${Math.round(offsetY)}px`;
    if (lastTransformOriginStr !== originStr) {
      lastTransformOriginStr = originStr;
      catEl.style.transformOrigin = originStr;
    }

    const rot = (visualRot + portalTransformRotate).toFixed(1);

    let str;
    if (portalTransformScale !== 1.0) {
      str = `translate3d(${tx}px,${ty}px,0) rotate(${rot}deg) scale(${portalTransformScale.toFixed(3)}) scaleX(${flip})`;
    } else if (rot === "0.0" && flip === 1) {
      
      str = `translate3d(${tx}px,${ty}px,0)`;
    } else if (rot === "0.0") {
      
      str = `translate3d(${tx}px,${ty}px,0) scaleX(-1)`;
    } else {
      
      str = `translate3d(${tx}px,${ty}px,0) rotate(${rot}deg) scaleX(${flip})`;
    }

    if (lastTransformStr !== str) {
      lastTransformStr = str;
      catEl.style.transform = str;
    }
  }
  function setDir(left) {
    if (facingLeft !== left || lastTransformStr === "") {
      facingLeft = left;
      applyTransform();
    }
  }

  function applyPos(rafTs) {
    applyTransform(rafTs);
    lastAnimTs = rafTs || 0;
    
    if (speechModule && speechModule.speechVisible) positionSpeechBubble(false);
  }

  function isHorizontalMovementState() {
    return (
      onGround &&
      !isJumping &&
      !isDragging &&
      Math.abs(velX) > 12 &&
      !NON_MOVEMENT_ANIM_STATES.has(state)
    );
  }

  function syncMovementAnimation(force) {
    if (animLockTimer > 0 && !force) return;
    if (!isHorizontalMovementState()) return;
    setDir(velX < 0);
    const absVelX = Math.abs(velX);
    
    const pigeonOnGround = isPigeonPet() && onGround;
    const desired = pigeonOnGround
      ? "walk"
      : isPigeonPet()
        ? "fly"
        : (absVelX >= SPEED_RUN * 0.68 ? "run" : "walk");
    const desiredDef = ANIMS[desired];
    if (curAnim !== desiredDef || force) setAnim(desired, force);
  }

  function normalizeGroundedCalmAnimation() {
    if (animLockTimer > 0 || !onGround || isJumping || isDragging) return;
    if (
      !isCalmGroundedStateName(state) ||
      Math.abs(velX) >= 8 ||
      Math.abs(velY) >= 35
    )
      return;
    if (
      curAnim !== ANIMS.jump &&
      curAnim !== ANIMS.run &&
      curAnim !== ANIMS.walk
    )
      return;

    if (isSkeletonPet()) {
      if (state === "groom") setAnim("clean1", true);
      else if (state === "stretch") setAnim("wake", true);
      else if (state === "nap" || state === "deepsleep") setAnim("pile", true);
      else setAnim("idle2", true);
    } else if (state === "groom" || state === "stretch") setAnim(chosenClean, true);
    else if (state === "nap" || state === "deepsleep") setAnim("sleep", true);
    else setAnim(chosenIdle, true);
  }

  const _dustImgUrl = `url("${u("assets/animations/dust.png")}")`;
  const _bubbleImgUrl = `url("${u("assets/animations/bubble.png")}")`;
  const _boneImgUrl = `url("${u("assets/animations/skeleton.png")}")`;

  function throwBoneAtSpider(startX, startY, spider) {
    if (!spider || spider.dead) return;
    const b = document.createElement("div");
    b.style.position = "fixed";
    b.style.left = "0px";
    b.style.top = "0px";
    b.style.pointerEvents = "none";
    b.style.zIndex = 2147483647;
    b.style.width = "32px";
    b.style.height = "32px";
    b.style.imageRendering = "pixelated";
    b.style.backgroundImage = _boneImgUrl;
    b.style.backgroundSize = "512px 480px";
    document.body.appendChild(b);

    let curX = startX;
    let curY = startY;
    let fr = 0;

    const iv = addInterval(() => {
      if (isDestroyed || !b.isConnected) {
        removeInterval(iv);
        if (b.isConnected) b.remove();
        return;
      }
      if (spider.dead) {
        removeInterval(iv);
        b.remove();
        return;
      }

      const dx = spider.x - curX;
      const dy = spider.y - curY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 40) {
        
        removeInterval(iv);
        b.remove();
        
        const defaultHealth = 3;
        spider.health = Math.max(0, (spider.health ?? defaultHealth) - 1);
        spawnDust(spider.x, spider.y);

        if (spider.health > 0) {
          const pushDir = curX < spider.x ? -1 : 1;
          spider.state = "damage";
          spider.curFrame = 0;
          spider.animAccum = 0;
          spider.stateTimer = 500;
          spider.vx = -pushDir * 180;
          spider.vy = -100;
        } else {
          spider.dead = true;
          spider.curFrame = 0;
          spider.animAccum = 0;
          spider.state = "death";
          awardCoins(3);
          recordQuestEvent("spiders_caught", 1);
        }
        return;
      }

      const speed = 15 * sizeMultiplier;
      curX += (dx / dist) * speed;
      curY += (dy / dist) * speed;

      fr = (fr + 1) % 4; 
      b.style.backgroundPosition = `${-fr * 32}px -320px`; 
      b.style.transform = `translate3d(${Math.round(curX)}px, ${Math.round(curY)}px, 0) scale(${sizeMultiplier * 1.5})`;
    }, 30);
  }

  function shootMagicAtSpider(startX, startY, spider) {
    if (!spider || spider.dead) return;
    const b = document.createElement("div");
    b.style.position = "fixed";
    b.style.left = "0px";
    b.style.top = "0px";
    b.style.pointerEvents = "none";
    b.style.zIndex = 2147483647;
    b.style.width = "32px";
    b.style.height = "32px";
    b.style.imageRendering = "pixelated";
    b.style.backgroundImage = `url("${FAIRY_SHEET}")`;
    b.style.backgroundSize = "160px 288px";
    b.style.backgroundPosition = "0px -224px"; 
    document.body.appendChild(b);

    let curX = startX;
    let curY = startY;
    let fr = 0;

    const iv = addInterval(() => {
      if (isDestroyed || !b.isConnected) {
        removeInterval(iv);
        if (b.isConnected) b.remove();
        return;
      }
      if (spider.dead) {
        removeInterval(iv);
        b.remove();
        return;
      }

      const dx = spider.x - curX;
      const dy = spider.y - curY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 40) {
        removeInterval(iv);
        b.remove();
        const defaultHealth = 3;
        spider.health = Math.max(0, (spider.health ?? defaultHealth) - 1);
        spawnDust(spider.x, spider.y);
        if (spider.health > 0) {
          const pushDir = curX < spider.x ? -1 : 1;
          spider.state = "damage";
          spider.curFrame = 0;
          spider.animAccum = 0;
          spider.stateTimer = 500;
          spider.vx = -pushDir * 200;
        } else {
          spider.dead = true;
          spider.curFrame = 0;
          spider.animAccum = 0;
          spider.state = "death";
          awardCoins(3);
          recordQuestEvent("spiders_caught", 1);
        }
        return;
      }

      const speed = 20 * sizeMultiplier;
      curX += (dx / dist) * speed;
      curY += (dy / dist) * speed;
      b.style.left = `${curX - 16}px`;
      b.style.top = `${curY - 16}px`;

      fr = (fr + 1) % 2;
      b.style.backgroundPosition = `-${fr * 32}px -224px`;
    }, 25);
  }

  let lastDustAt = 0;
  let lastDustX = 0;
  let lastDustY = 0;

  function spawnDust(x, y, force = false) {
    const now = safeNow();
    const minGap = aimTargetRect && onGround ? 700 : 90;
    if (!force && now - lastDustAt < minGap && Math.hypot(x - lastDustX, y - lastDustY) < 28) return;
    lastDustAt = now;
    lastDustX = x;
    lastDustY = y;
    const d = document.createElement("div");
    d.className = "pixel-dust";
    d.style.backgroundImage = _dustImgUrl;
    const tx = Math.round(x - (CELL * sizeMultiplier) / 2);
    const ty = Math.round(y - CELL * sizeMultiplier);
    d.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    document.body.appendChild(d);
    let fr = 0;
    const iv = addInterval(() => {
      if (isDestroyed || !d.isConnected) {
        removeInterval(iv);
        if (d.isConnected) d.remove();
        return;
      }
      fr++;
      if (fr >= 4) {
        removeInterval(iv);
        if (d.isConnected) d.remove();
        return;
      }
      d.style.backgroundPosition = `${-fr * 32}px 0px`;
    }, 70);
  }

  function spawnHeart(x, y) {
    const h = document.createElement("div");
    h.className = "pixel-heart";
    const tx = (x + (Math.random() - 0.5) * 24) | 0;
    const ty = y | 0;
    h.style.setProperty("--x", tx + "px");
    h.style.setProperty("--y", ty + "px");
    document.body.appendChild(h);
    addTimeout(() => {
      if (h.isConnected) h.remove();
    }, 1200);
  }

  function spawnZzz() {
    const z = document.createElement("div");
    z.className = "pixel-zzz";
    z.textContent = "z";
    const tx = (feetX + 10) | 0;
    const ty = (feetY - VIS * sizeMultiplier * 0.7) | 0;
    z.style.setProperty("--x", tx + "px");
    z.style.setProperty("--y", ty + "px");
    document.body.appendChild(z);
    addTimeout(() => {
      if (z.isConnected) z.remove();
    }, 1500);
  }

  function tickPetting(dt) {
    
    const catW = VIS * sizeMultiplier;
    const catH = VIS * sizeMultiplier;
    const catLeft = feetX - catW / 2;
    const catTop = feetY - catH;
    const overCat =
      cursorX >= catLeft &&
      cursorX <= catLeft + catW &&
      cursorY >= catTop &&
      cursorY <= catTop + catH;

    if (!overCat) {
      petMeter = Math.max(0, petMeter - dt * 2);
      petDirectionChanges = 0;
      if (isPurring && petMeter <= 0) {
        isPurring = false;
        go("stretch");
      }
      return;
    }

    const curDir = cursorX > lastPetX ? 1 : cursorX < lastPetX ? -1 : 0;
    const speed = Math.abs(cursorX - lastPetX);
    if (curDir !== 0 && curDir !== lastPetDir && speed > 3) {
      petDirectionChanges++;
      petMeter = Math.min(1.0, petMeter + 0.12);
    }
    lastPetDir = curDir || lastPetDir;
    lastPetX = cursorX;

    if (petDirectionChanges > 0) {
      petDirectionChanges = Math.max(0, petDirectionChanges - dt * 2);
    }

    if (petMeter >= 0.8 && !isPurring) {
      isPurring = true;
      catEnergy = Math.min(1.0, catEnergy + 0.5);
      catBoredom = 0;
      catHunger = Math.max(0, catHunger - 0.3);
      earnXP(0.2); 
      awardCoins(getPetCoinReward());
      recordQuestEvent("pet_sessions", 1);
      if (bubbleTrap.active) {
        maybeSpeakBubbleTrap("petted", {
          allowReplace: true,
          durationMs: 3000,
          cooldownMs: 1200,
        });
      } else {
        speakObjectInteraction("happy");
      }
      velX = 0;
      setAnim("sleep"); 
      spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
    }

    if (isPurring && Math.random() < 0.04) {
      spawnHeart(
        feetX + (Math.random() - 0.5) * 30 * sizeMultiplier,
        feetY -
          VIS * sizeMultiplier * 0.4 -
          Math.random() * 20 * sizeMultiplier,
      );
    }
  }

  const fishModule = window.PixelCatFish({
    u,
    safeNow,
    GRAVITY,
    go,
    speakObjectInteraction,
    activeFishes,
    hasActivePickup,
    claimActivePickup,
    releaseActivePickup,
    get vw() {
      return _vw;
    },
    get vh() {
      return _vh;
    },
    get feetX() {
      return feetX;
    },
    get feetY() {
      return feetY;
    },
    get sizeMultiplier() {
      return sizeMultiplier;
    },
    get catEnabled() {
      return catEnabled;
    },
    get isFrog() {
      return typeof isFrogPet === "function" ? isFrogPet() : false;
    },
    get isSkeleton() {
      return typeof isSkeletonPet === "function" ? isSkeletonPet() : false;
    },
    get autoFishSpawnEnabled() {
      return (freePlayMode || unlockAll) ? false : autoFishSpawnEnabled;
    },
    get fishSpawnTimer() {
      return fishSpawnTimer;
    },
    set fishSpawnTimer(value) {
      fishSpawnTimer = value;
    },
    get state() {
      return state;
    },
    get targetFish() {
      return targetFish;
    },
    set targetFish(value) {
      targetFish = value;
    },
    get draggedFish() {
      return draggedFish;
    },
    set draggedFish(value) {
      draggedFish = value;
    },
    set fishDragOffsetX(value) {
      fishDragOffsetX = value;
    },
    set fishDragOffsetY(value) {
      fishDragOffsetY = value;
    },
    set lastFishDragX(value) {
      lastFishDragX = value;
    },
    set lastFishDragY(value) {
      lastFishDragY = value;
    },
    set lastFishDragTs(value) {
      lastFishDragTs = value;
    },
  });
  const { spawnFishTreat, updateFishes } = fishModule;

  const activeSpiders = PixelCatRuntime.spiders;
  const activeWebs = PixelCatRuntime.webs;
  function nextSpiderSpawnDelay() {
    return 120 + Math.random() * 240;
  }

  let spiderSpawnTimer = 60 + Math.random() * 60; 
  let spiderTimerPausedForObject = false;

  draggedSpider = null;
  let spiderDragOffsetX = 0;
  let spiderDragOffsetY = 0;
  let lastSpiderDragX = 0;
  let lastSpiderDragY = 0;
  let lastSpiderDragTs = 0;

  const SPIDER_SHEET = u("assets/animations/spider.png");
  const SPIDER_CELL = 32;
  const SPIDER_SCALE = 2.0;

  function spiderRenderScale() {
    return SPIDER_SCALE * sizeMultiplier;
  }

  function getWeightShakePower() {
    if (sizeMultiplier < 2.0) return 0;
    const weight = (sizeMultiplier - 2.0) / 0.5;
    return Math.max(0, Math.min(1, weight));
  }

  function getScreenShakeTarget() {
    const selectors = [
      "ytd-watch-flexy #columns",
      "ytd-watch-flexy #primary",
      "ytd-browse ytd-rich-grid-renderer #contents",
      "ytd-rich-grid-renderer #contents",
      "ytd-two-column-browse-results-renderer #contents",
      "ytd-search ytd-section-list-renderer #contents",
      "ytd-section-list-renderer #contents",
      "ytd-playlist-panel-renderer #items",
      "ytmusic-app-layout ytmusic-section-list-renderer #contents",
      "ytmusic-app-layout ytmusic-grid-renderer #items",
    ];

    for (let i = 0; i < selectors.length; i++) {
      const el = document.querySelector(selectors[i]);
      if (!el || el === document.body || el === document.documentElement)
        continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 120 && rect.height > 120) return el;
    }
    return null;
  }

  function shakeScreen(strength, duration) {
    const power = getWeightShakePower();
    if (!power || isCompanion) return;

    const target = getScreenShakeTarget();
    if (!target) return;

    const now = safeNow();
    const amp = Math.min(2.4, Math.max(0.35, strength * power * 0.32));
    const ms = Math.min(260, Math.max(130, duration || 170));
    if (now < weightShakeUntil && amp < 1.15) return;
    weightShakeUntil = now + ms * 0.8;

    try {
      if (weightShakeAnimation) weightShakeAnimation.cancel();
      target.style.willChange = "transform";
      target.style.transformOrigin = "50% 50%";
      weightShakeAnimation = target.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(${amp * 0.16}px, ${-amp}px, 0)` },
          { transform: `translate3d(${-amp * 0.12}px, ${amp * 0.48}px, 0)` },
          { transform: `translate3d(${amp * 0.05}px, ${-amp * 0.18}px, 0)` },
          { transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: ms,
          easing: "cubic-bezier(.18,.82,.28,1)",
          fill: "none",
        },
      );
      const currentShake = weightShakeAnimation;
      currentShake.onfinish = currentShake.oncancel = () => {
        if (weightShakeAnimation === currentShake) {
          weightShakeAnimation = null;
          target.style.willChange = "";
          target.style.transformOrigin = "";
        }
      };
    } catch (error) {
      
    }
  }

  function updateWeightFootsteps(dt) {
    if (!onGround || isJumping || isDragging) {
      weightStepTimer = 0;
      return;
    }

    const absVelX = Math.abs(velX);
    const isHeavyWalk =
      state === "wander" ||
      state === "patrol" ||
      state === "chase" ||
      state === "chasefish" ||
      state === "ball_chase";
    const isHeavyRun =
      state === "zoomies" ||
      state === "spook" ||
      state === "attack" ||
      state === "knockoff" ||
      state === "ui_mischief";
    if (absVelX < SPEED_WALK * 0.45 || (!isHeavyWalk && !isHeavyRun)) {
      weightStepTimer = 0;
      return;
    }

    const isRun = absVelX >= SPEED_RUN * 0.7 || isHeavyRun;
    const interval = isRun ? 0.26 : 0.38;
    weightStepTimer -= dt;
    if (weightStepTimer <= 0) {
      weightStepTimer = interval;
      shakeScreen(isRun ? 2.2 : 1.35, isRun ? 180 : 210);
    }
  }

  const SPIDER_ANIMS = {
    idle: { r: 0, fr: 5, fps: 6 },
    move: { r: 1, fr: 6, fps: 10 },
    jump: { r: 2, fr: 9, fps: 12 },
    drop: { r: 3, fr: 1, fps: 1 },
    shoot: { r: 4, fr: 4, fps: 8 },
    damage: { r: 5, fr: 3, fps: 6 },
    death: { r: 6, fr: 9, fps: 10 },
    proj: { r: 7, fr: 6, fps: 12 },
  };

  function releaseSpider(spider) {
    if (!spider || spider.pickupReleased) return;
    spider.pickupReleased = true;
    releaseActivePickup("spider");
  }

  function spawnSpider() {
    if (!document.body)
      return false;
    if (activeSpiders.length >= 1) return false;
    if (hasActivePickup()) return false;
    if (!claimActivePickup("spider")) return false;

    const sEl = document.createElement("div");
    sEl.className = "pixel-spider";
    sEl.style.position = "fixed";
    sEl.style.left = "0px";
    sEl.style.top = "0px";
    const spiderScale = spiderRenderScale();
    sEl.style.width = SPIDER_CELL * spiderScale + "px";
    sEl.style.height = SPIDER_CELL * spiderScale + "px";
    sEl.style.zIndex = "9999990";
    sEl.style.pointerEvents = "auto";
    sEl.style.cursor = "grab";
    sEl.style.backgroundImage = `url("${SPIDER_SHEET}")`;
    sEl.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
    sEl.style.backgroundRepeat = "no-repeat";
    sEl.style.willChange = "transform";
    sEl.style.overflow = "hidden";
    sEl.style.transform = "translate3d(-2000px, -2000px, 0)";

    const sx = 40 + Math.random() * (_vw - 80);
    const sy = -50;

    const lineEl = document.createElement("div");
    lineEl.style.position = "fixed";
    lineEl.style.width = "2px";
    lineEl.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    lineEl.style.backgroundImage = "none";
    lineEl.style.left = "0px";
    lineEl.style.top = "0px";
    lineEl.style.height = "1px";
    lineEl.style.transformOrigin = "top left";
    lineEl.style.transform = `translate3d(${sx}px, 0px, 0) scaleY(0)`;
    lineEl.style.zIndex = "9999989";
    lineEl.style.pointerEvents = "none";
    lineEl.style.willChange = "transform";

    document.body.appendChild(sEl);
    document.body.appendChild(lineEl);

    const spider = {
      el: sEl,
      lineEl: lineEl,
      x: sx,
      y: 32,
      vx: 0,
      vy: 0,
      state: "ceiling_move",
      stateTimer: 3000 + Math.random() * 7000,
      facingLeft: Math.random() > 0.5,
      animAccum: 0,
      curFrame: 0,
      dead: false,
      prevState: "ceiling_move",
      isHeld: false,
      pickupReleased: false,
      health: Math.random() < 0.5 ? 2 : 3,
      maxHealth: 3,
      hitRadiusX: 50,
      hitRadiusY: 55,
      webSpeed: 400,
      webKnockback: 0,
      moveSpeed: 52 + Math.random() * 34,
      groundSpeed: 52 + Math.random() * 34,
    };

    sEl.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      spider.isHeld = true;
      markUserDrivenTarget(spider, "spider");
      draggedSpider = spider;
      spiderDragOffsetX = e.clientX - spider.x;
      spiderDragOffsetY = e.clientY - spider.y;
      spider.vx = 0;
      spider.vy = 0;

      spider.dragVisualTransform = "";
      if (spider.state === "ceiling_move" || spider.state === "ceiling_idle") {
        spider.dragVisualTransform = " scaleY(-1)";
      } else if (spider.state === "wall_move" || spider.state === "wall_idle") {
        const rot = spider.onLeftWall
          ? spider.facingUp
            ? -90
            : -270
          : spider.facingUp
            ? 90
            : 270;
        spider.dragVisualTransform = ` rotate(${rot}deg)`;
      }

      spider.state = "held";
      if (spider.lineEl) {
        spider.lineEl.remove();
        spider.lineEl = null;
      }
      targetSpider = spider;
      lastSpiderDragX = spider.x;
      lastSpiderDragY = spider.y;
      lastSpiderDragTs = safeNow();
      sEl.style.cursor = "grabbing";
      
      if (state !== "dragged" && state !== "chasing_bug") go("chasing_bug");
    });

    sEl.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        spider.isHeld = true;
        markUserDrivenTarget(spider, "spider");
        draggedSpider = spider;
        spiderDragOffsetX = t.clientX - spider.x;
        spiderDragOffsetY = t.clientY - spider.y;
        spider.vx = 0;
        spider.vy = 0;

        spider.dragVisualTransform = "";
        if (
          spider.state === "ceiling_move" ||
          spider.state === "ceiling_idle"
        ) {
          spider.dragVisualTransform = " scaleY(-1)";
        } else if (
          spider.state === "wall_move" ||
          spider.state === "wall_idle"
        ) {
          const rot = spider.onLeftWall
            ? spider.facingUp
              ? -90
              : -270
            : spider.facingUp
              ? 90
              : 270;
          spider.dragVisualTransform = ` rotate(${rot}deg)`;
        }

        spider.state = "held";
        if (spider.lineEl) {
          spider.lineEl.remove();
          spider.lineEl = null;
        }
        targetSpider = spider;
        lastSpiderDragX = spider.x;
        lastSpiderDragY = spider.y;
        lastSpiderDragTs = safeNow();
        sEl.style.cursor = "grabbing";
        if (state !== "dragged" && state !== "chasing_bug") go("chasing_bug");
      },
      { passive: false },
    );

    activeSpiders.push(spider);
    return true;
  }

  function spawnWebProjectile(sx, sy, tx, ty, options) {
    if (!document.body) return;
    const isBigWeb = false;
    const wEl = document.createElement("div");
    wEl.className = "pixel-spider-web";
    wEl.style.position = "fixed";
    wEl.style.left = "0px";
    wEl.style.top = "0px";
    const spiderScale = spiderRenderScale();
    wEl.style.width = SPIDER_CELL * spiderScale + "px";
    wEl.style.height = SPIDER_CELL * spiderScale + "px";
    wEl.style.zIndex = "9999991";
    wEl.style.pointerEvents = "none";
    wEl.style.backgroundImage = `url("${SPIDER_SHEET}")`;
    wEl.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
    wEl.style.backgroundRepeat = "no-repeat";
    wEl.style.willChange = "transform";
    wEl.style.overflow = "hidden";
    wEl.style.transform = "translate3d(-2000px, -2000px, 0)";

    document.body.appendChild(wEl);

    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const speed = (options && options.speed) || 400;

    activeWebs.push({
      el: wEl,
      startX: sx,
      x: sx,
      y: sy,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      facingLeft: dx < 0,
      animAccum: 0,
      curFrame: 0,
      life: 3.5,
      knockback: 0,
    });
  }

  function updateSpiders(dt) {

    if (!catEnabled && (activeSpiders.length > 0 || activeWebs.length > 0)) {
      for (let i = 0; i < activeSpiders.length; i++) {
        releaseSpider(activeSpiders[i]);
        activeSpiders[i].el.remove();
        if (activeSpiders[i].lineEl) activeSpiders[i].lineEl.remove();
      }
      for (let i = 0; i < activeWebs.length; i++) {
        activeWebs[i].el.remove();
      }
      activeSpiders.length = 0;
      activeWebs.length = 0;
      targetSpider = null;
      draggedSpider = null;
      return;
    }

    for (let i = activeSpiders.length - 1; i >= 0; i--) {
      const s = activeSpiders[i];
      if (s.dead && s.curFrame === SPIDER_ANIMS.death.fr - 1) {
        let dustY = _vh;
        if (typeof computeFloor === "function") dustY = computeFloor(s.x);
        spawnDust(s.x, dustY);
        releaseSpider(s);
        s.el.remove();
        if (s.lineEl) s.lineEl.remove();
        activeSpiders.splice(i, 1);
        continue;
      }

      if (s.isHeld) {
        
        if (!s.heldDirectionTimer) s.heldDirectionTimer = 0;
        s.heldDirectionTimer += dt * 1000;
        if (s.heldDirectionTimer > 1000 + Math.random() * 2000) {
          s.facingLeft = Math.random() < 0.5;
          s.heldDirectionTimer = 0;
        }

        s.animAccum += dt * 1000;
        const animDef = SPIDER_ANIMS.move; 
        const msPerFrame = 1000 / animDef.fps;
        if (s.animAccum > msPerFrame) {
          s.animAccum -= msPerFrame;
          s.curFrame = (s.curFrame + 1) % animDef.fr;
        }

        const spiderScale = spiderRenderScale();
        let row = animDef.r;
        if (!s.facingLeft) row += 8;

        if (s.lastScale !== spiderScale) {
          s.lastScale = spiderScale;
          s.el.style.width = SPIDER_CELL * spiderScale + "px";
          s.el.style.height = SPIDER_CELL * spiderScale + "px";
          s.el.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
        }

        if (s.lastFrame !== s.curFrame || s.lastRow !== row || s.lastScaleChanged) {
          s.lastFrame = s.curFrame;
          s.lastRow = row;
          s.lastScaleChanged = false;
          s.el.style.backgroundPosition = `-${s.curFrame * SPIDER_CELL * spiderScale}px -${row * SPIDER_CELL * spiderScale}px`;
        }

        const newTrans = `translate3d(${(s.x - (SPIDER_CELL * spiderScale) / 2) | 0}px, ${(s.y - (SPIDER_CELL * spiderScale) / 2) | 0}px, 0)` + (s.dragVisualTransform || "");
        if (s.lastTrans !== newTrans) {
          s.lastTrans = newTrans;
          s.el.style.transform = newTrans;
        }
        continue;
      }

      let floorY = _vh;
      if (typeof computeFloor === "function") {
        floorY = computeFloor(s.x);
      }
      const targetY = floorY - (SPIDER_CELL * spiderRenderScale()) / 2;

      if (s.dead) {
        if (s.y < targetY) {
          s.vy = (s.vy || 0) + GRAVITY * dt;
          s.y += s.vy * dt;
          if (s.y > targetY) {
            s.y = targetY;
            s.vy = 0;
          }
        }
      } else {
        s.stateTimer -= dt * 1000;

        let nearestCat = null;
        let minDist = 999999;
        const cats = PixelCatRuntime.instances;
        for (let ci = 0; ci < cats.length; ci++) {
          const cat = cats[ci];
          const dx = cat.feetX - s.x;
          const dy = cat.feetY - s.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDist) {
            minDist = distSq;
            nearestCat = cat;
          }
        }
        minDist = Math.sqrt(minDist);

        const catX = nearestCat ? nearestCat.feetX : 0;
        const catY = nearestCat ? nearestCat.feetY : 0;

        switch (s.state) {
          case "ceiling_move":
            s.y = 32;
            
            s.moveSpeed = s.moveSpeed || 52 + Math.random() * 34; 
            s.vx = (s.facingLeft ? -1 : 1) * s.moveSpeed;
            s.x += s.vx * dt;
            if (s.lineEl) {
              const newTrans = `translate3d(${s.x}px, 0px, 0) scaleY(0)`;
              if (s.lastLineTrans !== newTrans) {
                s.lastLineTrans = newTrans;
                s.lineEl.style.transform = newTrans;
              }
            }
            if (s.x < 10) {
              s.x = 10;
              s.facingLeft = false;
            }
            if (s.x > _vw - 10) {
              s.x = _vw - 10;
              s.facingLeft = true;
            }
            if (s.stateTimer <= 0) {
              const roll = Math.random();
              if (roll < 0.5) {
                s.state = "ceiling_idle";
                s.stateTimer = 1500 + Math.random() * 4500; 
              } else {
                s.state = "dangle";
                s.stateTimer = 2000 + Math.random() * 5000; 
                s.vy = 30 + Math.random() * 70; 
              }
            }
            break;

          case "ceiling_idle":
            s.y = 32;
            s.vx *= 0.8;
            s.x += s.vx * dt;
            if (s.lineEl) {
              const newTrans = `translate3d(${s.x}px, 0px, 0) scaleY(0)`;
              if (s.lastLineTrans !== newTrans) {
                s.lastLineTrans = newTrans;
                s.lineEl.style.transform = newTrans;
              }
            }
            if (s.stateTimer <= 0) {
              const roll = Math.random();
              if (roll < 0.6) {
                s.state = "ceiling_move";
                s.stateTimer = 2000 + Math.random() * 6000; 
                s.moveSpeed = 52 + Math.random() * 34;
              } else {
                s.state = "dangle";
                s.stateTimer = 2000 + Math.random() * 5000;
                s.vy = 30 + Math.random() * 70;
              }
              s.facingLeft = Math.random() < 0.5;
            }
            break;

          case "dangle":
            s.y += s.vy * dt;
            if (s.lineEl) {
              const newTrans = `translate3d(${s.x - 1}px, 0px, 0) scaleY(${Math.max(0, s.y + 15)})`;
              if (s.lastLineTrans !== newTrans) {
                s.lastLineTrans = newTrans;
                s.lineEl.style.transform = newTrans;
              }
            }
            if (s.y > targetY - 60) {
              s.state = "jump";
              s.vy = JUMP_V * (0.3 + Math.random() * 0.2); 
              s.vx = 0;
              if (s.lineEl) {
                s.lineEl.remove();
                s.lineEl = null;
              }
            } else if (s.stateTimer <= 0) {
              s.state = "dangle_pause";
              s.stateTimer = 800 + Math.random() * 2200; 
              
              if (
                Math.random() < 0.1 &&
                minDist < 450
              ) {
                spawnWebProjectile(s.x, s.y, catX, catY - 20, {
                  speed: s.webSpeed,
                  knockback: s.webKnockback,
                });
                s.facingLeft = catX < s.x;
              }
            }
            break;

          case "dangle_pause":
            if (s.lineEl) {
              const newTrans = `translate3d(${s.x - 1}px, 0px, 0) scaleY(${Math.max(0, s.y + 15)})`;
              if (s.lastLineTrans !== newTrans) {
                s.lastLineTrans = newTrans;
                s.lineEl.style.transform = newTrans;
              }
            }
            if (s.stateTimer <= 0) {
              if (Math.random() < 0.3 || s.y > targetY - 150) {
                s.state = "jump";
                s.vy = 0;
                s.vx = 0;
                if (s.lineEl) {
                  s.lineEl.remove();
                  s.lineEl = null;
                }
              } else {
                s.state = "dangle";
                s.stateTimer = 1000 + Math.random() * 2000;
                s.vy = 30 + Math.random() * 50;
              }
            }
            break;

          case "drop":
            s.y += s.vy * dt;
            if (s.y > targetY - 60 || s.stateTimer <= 0) {
              s.state = "jump";
              s.vy = JUMP_V * 0.4;
              s.vx = (Math.random() < 0.5 ? 1 : -1) * 150;
              if (s.lineEl) {
                s.lineEl.remove();
                s.lineEl = null;
              }
            }
            break;
          case "jump":
            s.vy += GRAVITY * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.y >= targetY) {
              s.y = targetY;
              s.state = "move";
              s.stateTimer = 1000 + Math.random() * 2000;
              s.groundSpeed = 52 + Math.random() * 34;
            }
            break;
          case "damage":
            s.vy += GRAVITY * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vx *= 0.94;
            if (s.x < 10) {
              s.x = 10;
              s.vx = Math.abs(s.vx) * 0.35;
            }
            if (s.x > _vw - 10) {
              s.x = _vw - 10;
              s.vx = -Math.abs(s.vx) * 0.35;
            }
            if (s.y >= targetY) {
              s.y = targetY;
              s.vy = 0;
            }
            if (s.stateTimer <= 0) {
              s.state = "move";
              s.stateTimer = 900 + Math.random() * 1400;
              s.groundSpeed = 52 + Math.random() * 34;
              s.facingLeft = catX > s.x;
            }
            break;
          case "idle":
            s.y = targetY; 
            s.vx *= 0.8;
            s.x += s.vx * dt;
            
            if (minDist < 250) {
              s.state = "move";
              s.stateTimer = 1500 + Math.random() * 2500; 
              s.groundSpeed = 52 + Math.random() * 34;
              s.facingLeft = catX > s.x; 
            } else if (s.stateTimer <= 0) {
              const roll = Math.random();
              if (roll < 0.4) {
                s.state = "move";
                s.stateTimer = 1000 + Math.random() * 3000; 
                s.groundSpeed = 52 + Math.random() * 34;
              } else {
                s.state = "idle";
                s.stateTimer = 1000 + Math.random() * 2500; 
              }
              s.facingLeft = Math.random() < 0.5;
            }
            break;
          case "move":
            s.y = targetY; 
            
            s.groundSpeed =
              s.groundSpeed || (52 + Math.random() * 34); 
            s.vx = (s.facingLeft ? -1 : 1) * s.groundSpeed;
            s.x += s.vx * dt;
            if (s.x < 10) {
              s.x = 10;
              s.facingLeft = false;
            }
            if (s.x > _vw - 10) {
              s.x = _vw - 10;
              s.facingLeft = true;
            }

            if (minDist < 350 && minDist > 80 && Math.random() < 0.002) {
              s.state = "shoot";
              s.stateTimer = 400 + Math.random() * 200; 
              s.facingLeft = catX < s.x; 
              s.curFrame = 0;
            } else if (s.stateTimer <= 0) {
              s.state = "idle";
              s.stateTimer = 800 + Math.random() * 1700; 
            }
            break;
          case "shoot":
            s.y = targetY; 
            s.vx = 0;
            if (s.stateTimer <= 0) {
              spawnWebProjectile(s.x, s.y, catX, catY - 20, {
                speed: s.webSpeed,
                knockback: s.webKnockback,
              });
              s.state = "move";
              s.stateTimer = 1200 + Math.random() * 1800; 
              s.groundSpeed = 52 + Math.random() * 34;
              s.facingLeft = catX > s.x; 
            }
            break;
          case "damage":
            s.vy = (s.vy || 0) + GRAVITY * dt;
            s.x += (s.vx || 0) * dt;
            s.y += s.vy * dt;
            if (s.y >= targetY) {
              s.y = targetY;
              s.vy = 0;
            }
            break;
        }
      }

      if (s.state !== s.prevState) {
        s.curFrame = 0;
        s.animAccum = 0;
        s.prevState = s.state;
      }
      s.animAccum += dt * 1000;
      let animDef = SPIDER_ANIMS[s.state] || SPIDER_ANIMS.idle;
      if (s.state === "ceiling_move") animDef = SPIDER_ANIMS.move;
      if (s.state === "ceiling_idle") animDef = SPIDER_ANIMS.idle;
      if (s.state === "wall_move") animDef = SPIDER_ANIMS.move;
      if (s.state === "wall_idle") animDef = SPIDER_ANIMS.idle;
      if (s.state === "dangle" || s.state === "dangle_pause")
        animDef = SPIDER_ANIMS.drop;
      if (s.dead) animDef = SPIDER_ANIMS.death;
      else if (s.state === "damage") animDef = SPIDER_ANIMS.damage;

      const msPerFrame = 1000 / animDef.fps;
      if (s.animAccum > msPerFrame) {
        s.animAccum -= msPerFrame;
        if (!s.dead || s.curFrame < animDef.fr - 1) {
          s.curFrame = (s.curFrame + 1) % animDef.fr;
        }
      }

      let row = animDef.r;
      if (!s.facingLeft) row += 8;

      const spiderScale = spiderRenderScale();
      if (s.lastScale !== spiderScale) {
        s.lastScale = spiderScale;
        s.el.style.width = SPIDER_CELL * spiderScale + "px";
        s.el.style.height = SPIDER_CELL * spiderScale + "px";
        s.el.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
      }

      if (s.lastFrame !== s.curFrame || s.lastRow !== row) {
        s.lastFrame = s.curFrame;
        s.lastRow = row;
        s.el.style.backgroundPosition = `-${s.curFrame * SPIDER_CELL * spiderScale}px -${row * SPIDER_CELL * spiderScale}px`;
      }

      const isDmg = s.dead || s.state === "damage";
      if (s.lastDmg !== isDmg) {
        s.lastDmg = isDmg;
        s.el.style.opacity = isDmg ? "0.8" : "1";
        if (isDmg) s.el.classList.add("spider-damage-tint");
        else s.el.classList.remove("spider-damage-tint");
      }

      let trans = `translate3d(${(s.x - (SPIDER_CELL * spiderScale) / 2) | 0}px, ${(s.y - (SPIDER_CELL * spiderScale) / 2) | 0}px, 0)`;
      if (s.state === "ceiling_move" || s.state === "ceiling_idle") {
        trans += " scaleY(-1)";
      } else if (s.state === "wall_move" || s.state === "wall_idle") {
        const rot = s.onLeftWall ? (s.facingUp ? -90 : -270) : (s.facingUp ? 90 : 270);
        trans += ` rotate(${rot}deg)`;
      }
      
      if (s.lastTrans !== trans) {
        s.lastTrans = trans;
        s.el.style.transform = trans;
      }
    }

    for (let i = activeWebs.length - 1; i >= 0; i--) {
      const w = activeWebs[i];
      w.life -= dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;

      let hit = false;
      PixelCatRuntime.instances.forEach((cat) => {
        if (cat.state === "webbed_stun") return;
        const dx = cat.feetX - w.x;
        const dy = cat.feetY - w.y;
        const catScale = Math.max(1, cat.sizeMultiplier || 1);
        const hitRadius = (w.big ? 70 : 50) + (catScale - 1) * 26;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          cat.go("webbed_stun");
          if (w.big && typeof cat.knockbackFrom === "function") {
            cat.knockbackFrom(w.x, w.knockback || 560);
          }
          hit = true;
        }
      });

      const distTraveled = Math.abs(w.x - (w.startX || w.x));
      const maxDist = _vw / 2;
      let op = 1;
      if (distTraveled > maxDist) {
        op = Math.max(0, 1 - (distTraveled - maxDist) / 150);
        if (op <= 0) w.life = 0;
      }
      if (w.lastOpacity !== op) {
        w.lastOpacity = op;
        w.el.style.opacity = op;
      }

      if (
        hit ||
        w.life <= 0 ||
        w.x < -100 ||
        w.x > _vw + 100 ||
        w.y > _vh + 100
      ) {
        w.el.remove();
        activeWebs.splice(i, 1);
        continue;
      }

      w.animAccum += dt * 1000;
      const msPerFrame = 1000 / SPIDER_ANIMS.proj.fps;
      if (w.animAccum > msPerFrame) {
        w.animAccum -= msPerFrame;
        w.curFrame = (w.curFrame + 1) % SPIDER_ANIMS.proj.fr;
      }
      let row = SPIDER_ANIMS.proj.r;
      if (!w.facingLeft) row += 8;

      const spiderScale = spiderRenderScale();
      if (w.lastScale !== spiderScale) {
        w.lastScale = spiderScale;
        w.el.style.width = SPIDER_CELL * spiderScale + "px";
        w.el.style.height = SPIDER_CELL * spiderScale + "px";
        w.el.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
      }

      if (w.lastFrame !== w.curFrame || w.lastRow !== row) {
        w.lastFrame = w.curFrame;
        w.lastRow = row;
        w.el.style.backgroundPosition = `-${w.curFrame * SPIDER_CELL * spiderScale}px -${row * SPIDER_CELL * spiderScale}px`;
      }

      const trans = `translate3d(${(w.x - (SPIDER_CELL * spiderScale) / 2) | 0}px, ${(w.y - (SPIDER_CELL * spiderScale) / 2) | 0}px, 0)` + (w.big ? " scale(1.2)" : "");
      if (w.lastTrans !== trans) {
        w.lastTrans = trans;
        w.el.style.transform = trans;
      }
    }
  }

  var spiderRafId = null;
  var lastSpiderTs = null;
  function startSpiderLoop() {
    if (spiderRafId) return;
    const spiderTick = (ts) => {
      spiderRafId = requestAnimationFrame(spiderTick);
      if (
        isDestroyed ||
        !isTabVisible ||
        isCompanion ||
        (!spiderEnabled &&
          activeSpiders.length === 0 &&
          activeWebs.length === 0)
      ) {
        lastSpiderTs = null;
        return;
      }
      if (!lastSpiderTs) {
        lastSpiderTs = ts;
        return;
      }
      const rawDt = Math.max(0, (ts - lastSpiderTs) / 1000);
      lastSpiderTs = ts;
      const dt = Math.min(0.05, rawDt);
      updateSpiders(dt);
    };
    spiderRafId = requestAnimationFrame(spiderTick);
  }
  startSpiderLoop();

  const activeBalls = PixelCatRuntime.balls;
  let ballSpawnTimer = 28 + Math.random() * 35; 
  let targetBall = null;

  let ballDragOffsetX = 0;
  let ballDragOffsetY = 0;
  let lastBallDragX = 0;
  let lastBallDragY = 0;
  let lastBallDragTs = 0;

  function cleanupEntityList(items, extraKeys) {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (!item) continue;

      if (item.el && item.el.isConnected) {
        item.el.remove();
      }

      if (extraKeys) {
        extraKeys.forEach((key) => {
          if (item[key] && item[key].isConnected) {
            item[key].remove();
          }
        });
      }
    }

    items.length = 0;
  }

  function cleanupAllVisualArtifacts() {
    
    const dustElements = document.querySelectorAll('.pixel-dust');
    dustElements.forEach(el => el.remove());

    const heartElements = document.querySelectorAll('.pixel-heart');
    heartElements.forEach(el => el.remove());

    const zzzElements = document.querySelectorAll('.pixel-zzz');
    zzzElements.forEach(el => el.remove());

    const coinPopups = document.querySelectorAll('.coin-popup');
    coinPopups.forEach(el => el.remove());

    const fishElements = document.querySelectorAll('.pixel-fish, .pixel-fly');
    fishElements.forEach(el => el.remove());
    
    const ballElements = document.querySelectorAll('.pixel-ball');
    ballElements.forEach(el => el.remove());
    
    const spiderElements = document.querySelectorAll('.pixel-spider');
    spiderElements.forEach(el => el.remove());
    
    const webElements = document.querySelectorAll('.pixel-spider-web');
    webElements.forEach(el => el.remove());
    
    const portalElements = document.querySelectorAll('.pixel-portal');
    portalElements.forEach(el => el.remove());
    
    const coinDrops = document.querySelectorAll('.pixel-coin-drop');
    coinDrops.forEach(el => el.remove());

    const bubbles = document.querySelectorAll('.pixel-cat-bubble');
    bubbles.forEach(el => el.remove());

    const bubbleTraps = document.querySelectorAll('.pixelcat-trap-bubble');
    bubbleTraps.forEach(el => el.remove());

    const menus = document.querySelectorAll('.pixelcat-action-menu');
    menus.forEach(el => el.remove());
  }

  function cleanupGlobalArtifacts() {
    cleanupEntityList(activeFishes);
    cleanupEntityList(activeSpiders, ["lineEl"]);
    cleanupEntityList(activeWebs);
    cleanupEntityList(activeBalls);
    if (typeof cleanupPortals === "function") cleanupPortals();
    targetFish = null;
    draggedFish = null;
    targetBall = null;
    draggedBall = null;
    targetSpider = null;
    draggedSpider = null;
    PixelCatRuntime.activePickupKind = null;
  }

  function enforceClippyRestrictions() {
    if (!isClippyPet()) return;
    autoFishSpawnEnabled = false;
    ballEnabled = false;
    portalEnabled = false;
    spiderEnabled = false;
    rareEventsEnabled = false;
    uiMischiefEnabled = false;
    isLoyalMode = false;
    if (state === "loyal_follow") {
      velX = 0;
      go("sit");
    }
    if (isCompanion) {
      destroy();
    }
    if (coinModule && typeof coinModule.cleanupCoinEffects === "function") {
      coinModule.cleanupCoinEffects();
    }
    if (typeof cleanupBubbleTrap === "function") cleanupBubbleTrap();
    cleanupEntityList(activeFishes);
    cleanupEntityList(activeBalls);
    if (typeof activeSpiders !== "undefined" && activeSpiders) {
      activeSpiders.forEach(releaseSpider);
      cleanupEntityList(activeSpiders, ["lineEl"]);
    }
    if (typeof activeWebs !== "undefined" && activeWebs) {
      cleanupEntityList(activeWebs);
    }
    targetFish = null;
    draggedFish = null;
    targetBall = null;
    draggedBall = null;
    if (typeof cleanupPortals === "function") cleanupPortals();
    releaseActivePickup("fish");
    releaseActivePickup("ball");
    if (state === "chasefish" || state === "eatfish" || state === "ball_play" || state === "portal_seek" || state === "bubble_trap") {
      velX = 0;
      go("sit");
    }
  }

  function enforcePigeonRestrictions() {
    if (!isPigeonPet()) return;
    autoFishSpawnEnabled = false;
    ballEnabled = false;
    portalEnabled = false;
    cleanupEntityList(activeFishes);
    cleanupEntityList(activeBalls);
    targetFish = null;
    draggedFish = null;
    targetBall = null;
    draggedBall = null;
    if (typeof cleanupPortals === "function") cleanupPortals();
    releaseActivePickup("fish");
    releaseActivePickup("ball");
    if (state === "chasefish" || state === "eatfish" || state === "ball_play" || state === "portal_seek") {
      velX = 0;
      velY = 0;
      onGround = true;
      isJumping = false;
      feetY = computeFloor(feetX);
      go("sit");
    }
  }

  function enforceFrogRestrictions() {
    if (!isFrogPet()) return;
    stopSkinAnimation();
    if (catEl) {
      if (isCompanion) {
        catEl.style.filter = "sepia(0.6) hue-rotate(65deg) saturate(2.2) brightness(0.72) contrast(1.15)";
      } else {
        catEl.style.filter = "none";
      }
    }
    ballEnabled = false;
    cleanupEntityList(activeBalls);
    targetBall = null;
    draggedBall = null;
    releaseActivePickup("ball");
    if (state === "ball_play") {
      velX = 0;
      velY = 0;
      onGround = true;
      isJumping = false;
      feetY = computeFloor(feetX);
      go("sit");
    }
  }

  function applyEcoRuntimeRestrictions() {

    autoFishSpawnEnabled = false;
    ballEnabled = false;
    spiderEnabled = false;
    portalEnabled = false;
    rareEventsEnabled = false;
    uiMischiefEnabled = false;
    speechEnabled = false;
    memoryEnabled = false;
    isAggressiveMode = false;
    if (catEnergyLevel === "hyper") {
      catEnergyLevel = "sleepy";
      applyEnergyLevel();
    }
    if (speechModule) hideSpeechBubble();
    if (typeof cleanupBubbleTrap === "function") cleanupBubbleTrap();
    cleanupGlobalArtifacts();
    if (coinModule && typeof coinModule.cleanupCoinEffects === "function")
      coinModule.cleanupCoinEffects();
    fishSpawnTimer = 90 + Math.random() * 120;
    ballSpawnTimer = 180 + Math.random() * 180;
    spiderSpawnTimer = 240 + Math.random() * 240;
    portalSpawnTimer = 300 + Math.random() * 300;
    bubbleSpawnTimer = randomBubbleTrapDelay(
      BUBBLE_REPEAT_DELAY_MIN,
      BUBBLE_REPEAT_DELAY_MAX,
    );
  }

  let _activeBallId = "ball_baseball";

  getLocal({ activeBall: "ball_baseball" })
    .then((d) => {
      _activeBallId = d.activeBall || "ball_baseball";
    })
    .catch(() => {});

  const ballModule = window.PixelCatBalls({
    u,
    safeNow,
    GRAVITY,
    addTimeout,
    spawnDust,
    speakObjectInteraction,
    activeBalls,
    hasActivePickup,
    claimActivePickup,
    releaseActivePickup,
    get vw() {
      return _vw;
    },
    get vh() {
      return _vh;
    },
    get sizeMultiplier() {
      return sizeMultiplier;
    },
    get catEnabled() {
      return catEnabled;
    },
    get ballEnabled() {
      return ballEnabled;
    },
    go,
    get state() {
      return state;
    },
    get activeBallId() {
      return _activeBallId;
    },
    get ballSpawnTimer() {
      return ballSpawnTimer;
    },
    set ballSpawnTimer(value) {
      ballSpawnTimer = value;
    },
    get targetBall() {
      return targetBall;
    },
    set targetBall(value) {
      targetBall = value;
    },
    get draggedBall() {
      return draggedBall;
    },
    set draggedBall(value) {
      draggedBall = value;
    },
    set ballDragOffsetX(value) {
      ballDragOffsetX = value;
    },
    set ballDragOffsetY(value) {
      ballDragOffsetY = value;
    },
    set lastBallDragX(value) {
      lastBallDragX = value;
    },
    set lastBallDragY(value) {
      lastBallDragY = value;
    },
    set lastBallDragTs(value) {
      lastBallDragTs = value;
    },
  });
  const { spawnBall, updateBalls } = ballModule;

  function nextPortalSpawnDelay() {
    return 180 + Math.random() * 300;
  }

  let portalSpawnTimer = 90 + Math.random() * 90; 
  let portalTimerPausedForObject = false;
  let portalEnabled = false; 
  let isInPortal = false;
  let portalCooldown = 0;

  const portalModule = window.PixelCatPortals({
    u,
    addTimeout,
    hasActivePickup,
    claimActivePickup,
    releaseActivePickup,
    get vw() {
      return _vw;
    },
    get vh() {
      return _vh;
    },
    get sizeMultiplier() {
      return sizeMultiplier;
    },
    get catEnabled() {
      return catEnabled;
    },
  });
  const {
    spawnPortalPair,
    updatePortals,
    checkCatPortalCollision,
    teleportCat,
    cleanup: cleanupPortals,
  } = portalModule;

  let quickSpawnMenuOpen = false;
  let quickSpawnMenuCalmAnim = "";
  let quickSpawnMenuAutoCloseTimer = null;

  function chooseQuickMenuCalmAnim() {
    if (isPenguinPet()) return ANIMS.lying ? "lying" : "sleep";
    const options = ["idle1", "idle2", "sleep"];
    const available = options.filter((name) => ANIMS && ANIMS[name]);
    return available.length
      ? available[(Math.random() * available.length) | 0]
      : "idle1";
  }

  function holdPetForQuickMenu(forceNewAnim) {
    if (
      bubbleTrap.active ||
      bubbleTrap.popping ||
      isDragging ||
      state === "dragged"
    )
      return;
    velX = 0;
    targetX = feetX;

    if ((isFairyPet() || isPigeonPet()) && !onGround) {
      velY = 0;
      globalRot = 0;
      visualRot = 0;
      state = "quick_menu_hold";
      stateTimer = 999999;
      setAnim(isPigeonPet() ? "fly" : "idle1", true);
      applyTransform();
      return;
    }

    if (onGround) {
      velY = 0;
      isJumping = false;
      state = "quick_menu_hold";
      stateTimer = 999999;
      if (isSkeletonPet()) {
        if (curAnim !== ANIMS.crumple && curAnim !== ANIMS.pile) {
          setAnimLocked("crumple", 875);
          addTimeout(() => {
            if (quickSpawnMenuOpen && state === "quick_menu_hold") setAnim("pile");
          }, 875);
        }
      } else if (isPenguinPet()) {
        quickSpawnMenuCalmAnim = ANIMS.lying ? "lying" : "sleep";
        setAnim(quickSpawnMenuCalmAnim, true);
      } else {
        if (!quickSpawnMenuCalmAnim || forceNewAnim)
          quickSpawnMenuCalmAnim = chooseQuickMenuCalmAnim();
        setAnim(quickSpawnMenuCalmAnim, true);
      }
    } else {
      isJumping = true;
      stateTimer = Math.max(stateTimer, 350);
      if (state !== "jump") setAnim("jump", true);
    }
  }

  const QUICK_MENU_XP_REQUIREMENTS = {
    fish: 0,
    ball: 10,
    spider: 25,
    portal: 135,
    bubble: 0,
  };
  const QUICK_MENU_LEVEL_LABELS = {
    ball: "Level 2",
    spider: "Level 3",
    portal: "Level 7",
  };
  const QUICK_MENU_BALL_IMAGES = {
    ball_baseball: "baseball.png",
    ball_tennis: "tennis.png",
    ball_golf: "golf.png",
    ball_basketball: "basketball.png",
    ball_football: "football.png",
    ball_volleyball: "valleyball.png",
    ball_bowling: "bowling.png",
  };

  function removeExistingQuickMenus() {
    if (quickSpawnMenuAutoCloseTimer) {
      removeTimeout(quickSpawnMenuAutoCloseTimer);
      quickSpawnMenuAutoCloseTimer = null;
    }
    document
      .querySelectorAll(".pixelcat-action-menu")
      .forEach((menu) => menu.remove());
    const wasMenuOpen = quickSpawnMenuOpen || state === "quick_menu_hold";
    quickSpawnMenuOpen = false;
    quickSpawnMenuCalmAnim = "";
    if (wasMenuOpen && !isDragging && state !== "dragged") {
      if (isFairyPet()) {
        if (!onGround && !fairyGroundedByUser) {
          beginFairyFlight();
          go("wander");
        } else {
          go("sit");
        }
      } else if (isSkeletonPet()) {
        setAnimLocked("wake", 875);
        addTimeout(() => {
          if (!isDragging && state !== "dragged") go("sit");
        }, 875);
      } else {
        go("sit");
      }
    }
  }

  function scheduleQuickMenuAutoClose(menu) {
    if (quickSpawnMenuAutoCloseTimer) {
      removeTimeout(quickSpawnMenuAutoCloseTimer);
      quickSpawnMenuAutoCloseTimer = null;
    }
    quickSpawnMenuAutoCloseTimer = addTimeout(() => {
      quickSpawnMenuAutoCloseTimer = null;
      if (menu && menu.isConnected && quickSpawnMenuOpen) {
        removeExistingQuickMenus();
      }
    }, 5000);
  }

  function getQuickMenuBallIcon(activeBallId) {
    const file =
      QUICK_MENU_BALL_IMAGES[activeBallId] ||
      QUICK_MENU_BALL_IMAGES.ball_baseball;
    return u(`assets/balls/${file}`);
  }

  function startManualBubbleTrap() {
    if (bubbleTrap.active || bubbleTrap.popping) return false;
    if (!catEnabled || !isTabVisible || document.hidden || isDestroyed)
      return false;
    if (lowPowerMode || !rareEventsEnabled || isDragging || state === "dragged")
      return false;
    lastBubbleTrapEndedAt = 0;
    startBubbleTrap();
    return true;
  }

  function nextQuickMenuFishResetDelay() {
    return 45 + Math.random() * 120 + (Math.random() < 0.2 ? 60 : 0);
  }

  function nextQuickMenuBallResetDelay() {
    return 90 + Math.random() * 180 + (Math.random() < 0.15 ? 60 : 0);
  }

  function resetAutoSpawnTimersAfterMenuAction() {
    fishSpawnTimer = nextQuickMenuFishResetDelay();
    ballSpawnTimer = nextQuickMenuBallResetDelay();
    spiderSpawnTimer = nextSpiderSpawnDelay();
    portalSpawnTimer = nextPortalSpawnDelay();
    bubbleSpawnTimer = randomBubbleTrapDelay(
      BUBBLE_REPEAT_DELAY_MIN,
      BUBBLE_REPEAT_DELAY_MAX,
    );
  }

  function canQuickMenuForceReaction() {
    return (
      catEnabled &&
      isTabVisible &&
      !document.hidden &&
      !isDestroyed &&
      !lowPowerMode &&
      !bubbleTrap.active &&
      !bubbleTrap.popping &&
      !isDragging &&
      state !== "dragged"
    );
  }

  function getQuickMenuFishTarget() {
    return (
      activeFishes.find(
        (fish) => fish && !fish.removing && fish.el && fish.el.isConnected,
      ) || null
    );
  }

  function getQuickMenuBallTarget() {
    return (
      activeBalls.find(
        (ball) =>
          ball &&
          !ball.exiting &&
          !ball.removing &&
          ball.el &&
          ball.el.isConnected,
      ) || null
    );
  }

  function getQuickMenuSpiderTarget() {
    return (
      activeSpiders.find(
        (spider) =>
          spider && !spider.dead && spider.el && spider.el.isConnected,
      ) || null
    );
  }

  function isQuickItemActive(kind) {
    if (kind === "follow_mode") return isFairyPet() ? fairyFollowsCursor : pigeonFollowsCursor;
    if (kind === "shuffle_mode") return isFairyPet() ? !fairyFollowsCursor : !pigeonFollowsCursor;
    if (kind === "ball") return !!getQuickMenuBallTarget();
    if (kind === "fish") return !!getQuickMenuFishTarget();
    if (kind === "spider") return !!getQuickMenuSpiderTarget();
    if (kind === "portal") return !!getQuickMenuPortalTarget();
    if (kind === "bubble") return !!(bubbleTrap && (bubbleTrap.active || bubbleTrap.trapped || bubbleTrap.el));
    if (kind === "chat") return !!(speechModule && typeof speechModule.isChatOpen === "function" && speechModule.isChatOpen());
    return false;
  }

  function cancelQuickItem(kind) {
    if (kind === "chat" || kind === "cancel_all") {
      if (speechModule && typeof speechModule.closeChatPrompt === "function") {
        speechModule.closeChatPrompt();
      }
    }
    if (kind === "ball" || kind === "cancel_all") {
      if (typeof activeBalls !== "undefined" && Array.isArray(activeBalls)) {
        activeBalls.forEach((b) => {
          if (b && b.el) b.el.remove();
        });
        activeBalls.length = 0;
      }
      targetBall = null;
      releaseActivePickup("ball");
    }
    if (kind === "fish" || kind === "cancel_all") {
      if (typeof activeFishes !== "undefined" && Array.isArray(activeFishes)) {
        activeFishes.forEach((f) => {
          if (f && f.el) f.el.remove();
        });
        activeFishes.length = 0;
      }
      targetFish = null;
      releaseActivePickup("fish");
    }
    if (kind === "spider" || kind === "cancel_all") {
      if (typeof activeSpiders !== "undefined" && Array.isArray(activeSpiders)) {
        activeSpiders.forEach((s) => {
          if (s && s.el) s.el.remove();
          if (s && s.lineEl) s.lineEl.remove();
        });
        activeSpiders.length = 0;
      }
      targetSpider = null;
      releaseActivePickup("spider");
    }
    if (kind === "portal" || kind === "cancel_all") {
      document.querySelectorAll(".pixel-portal").forEach((p) => p.remove());
      if (typeof cleanupPortals === "function") {
        cleanupPortals();
      }
      releaseActivePickup("portal");
    }
    if (kind === "bubble" || kind === "cancel_all") {
      if (typeof cleanupBubbleTrap === "function") cleanupBubbleTrap();
      releaseActivePickup("bubble");
    }

    releaseActivePickup();
    resetAutoSpawnTimersAfterMenuAction();

    if (state === "chasing_bug" || state === "ball_play" || state === "chasefish" || state === "eatfish" || state === "portal_seek" || state === "quick_menu_hold") {
      go("sit");
    }
  }

  function getQuickMenuPortalTarget() {
    if (
      !portalModule ||
      !portalModule.activePortals ||
      !portalModule.activePortals.length
    )
      return null;
    const openGroundPortal = portalModule.activePortals.find(
      (portal) =>
        portal && portal.placement === "ground" && portal.state !== "closing",
    );
    if (openGroundPortal) return openGroundPortal;
    return (
      portalModule.activePortals.find(
        (portal) => portal && portal.state !== "closing",
      ) || null
    );
  }

  function markUserDrivenTarget(target, kind) {
    if (!target) return target;
    target.manualSpawned = true;
    target.userInteracted = true;
    target.persistentChase = true;
    target.lastUserEngagedAt = safeNow();
    target.userEngagedKind = kind || target.userEngagedKind || "item";
    return target;
  }

  function isUserDrivenTarget(target) {
    return !!(
      target &&
      (target.manualSpawned ||
        target.userInteracted ||
        target.persistentChase ||
        target.isHeld)
    );
  }

  function refreshUserDrivenChaseTimer(target, minMs) {
    if (!isUserDrivenTarget(target)) return false;
    stateTimer = Math.max(stateTimer, minMs || 12000);
    return true;
  }

  function forceTargetChase(kind, target) {
    if (!target || !canQuickMenuForceReaction()) return false;
    markUserDrivenTarget(target, kind);

    if (kind === "fish") {
      targetFish = target;
      targetBall = null;
      targetSpider = null;
      if (typeof speakObjectInteraction === "function")
        speakObjectInteraction("fishing");
      go("chasefish");
      stateTimer = Math.max(stateTimer, 18000);
      return true;
    }

    if (kind === "ball") {
      targetBall = target;
      targetFish = null;
      targetSpider = null;
      if (typeof speakObjectInteraction === "function")
        speakObjectInteraction("ball");
      go("ball_play");
      stateTimer = Math.max(stateTimer, 18000);
      return true;
    }

    if (kind === "spider") {
      targetSpider = target;
      targetFish = null;
      targetBall = null;
      if (typeof speakObjectInteraction === "function")
        speakObjectInteraction("spider");
      go("chasing_bug");
      stateTimer = Math.max(stateTimer, 18000);
      return true;
    }

    return false;
  }

  function forceQuickMenuSpawnReaction(kind) {
    if (!canQuickMenuForceReaction()) return false;

    if (kind === "fish") {
      const fish = getQuickMenuFishTarget();
      return !!fish && forceTargetChase("fish", fish);
    }

    if (kind === "ball") {
      const ball = getQuickMenuBallTarget();
      return !!ball && forceTargetChase("ball", ball);
    }

    if (kind === "spider") {
      const spider = getQuickMenuSpiderTarget();
      return !!spider && forceTargetChase("spider", spider);
    }

    if (kind === "portal") {
      const portal = getQuickMenuPortalTarget();
      if (!portal) return false;
      markUserDrivenTarget(portal, "portal");
      targetFish = null;
      targetBall = null;
      targetSpider = null;
      go("portal_seek");
      stateTimer = Math.max(stateTimer, 12000);
      return true;
    }

    return false;
  }

  function runQuickMenuAction(kind) {
    if (kind === "follow_mode") {
      if (isFairyPet()) fairyFollowsCursor = true;
      if (isPigeonPet()) pigeonFollowsCursor = true;
      if (onGround) {
        onGround = false;
        isJumping = true;
        beginFairyFlight();
      }
      return true;
    }
    if (kind === "shuffle_mode") {
      if (isFairyPet()) fairyFollowsCursor = false;
      if (isPigeonPet()) pigeonFollowsCursor = false;
      if (onGround) {
        onGround = false;
        isJumping = true;
        beginFairyFlight();
      }
      return true;
    }
    if (isFairyPet() && (kind === "fish" || kind === "ball" || kind === "portal" || kind === "spider")) return false;
    if (isPigeonPet() && (kind === "fish" || kind === "ball" || kind === "portal" || kind === "spider")) return false;
    if (isFrogPet() && kind === "ball") return false;
    if (isSkeletonPet() && kind === "fish") return false;
    if (kind === "aim") {
      enterAimMode();
      return true;
    }
    if (kind === "chat") {
      if (speechModule && typeof speechModule.openChatPrompt === "function") {
        speechModule.openChatPrompt();
      }
      return true;
    }
    if (kind === "hamburger") {
      return true;
    }

    if (kind === "fish") {
      const ok = !!spawnFishTreat();
      if (ok) {
        resetAutoSpawnTimersAfterMenuAction();
        forceQuickMenuSpawnReaction("fish");
      }
      return ok;
    }
    if (kind === "ball") {
      const ok = !!spawnBall();
      if (ok) {
        resetAutoSpawnTimersAfterMenuAction();
        forceQuickMenuSpawnReaction("ball");
      }
      return ok;
    }
    if (kind === "spider") {
      const ok = !!spawnSpider();
      if (ok) {
        resetAutoSpawnTimersAfterMenuAction();
        forceQuickMenuSpawnReaction("spider");
      }
      return ok;
    }
    if (kind === "portal") {
      const ok = !!spawnPortalPair();
      if (ok) {
        resetAutoSpawnTimersAfterMenuAction();
        forceQuickMenuSpawnReaction("portal");
      }
      return ok;
    }
    if (kind === "bubble") {
      const ok = startManualBubbleTrap();
      if (ok) resetAutoSpawnTimersAfterMenuAction();
      return ok;
    }
    return false;
  }

  function getQuickMenuDisabledReason(kind, xp, isFreePlay) {
    if (isFairyPet() && (kind === "fish" || kind === "ball" || kind === "portal" || kind === "spider")) {
      return "Unavailable for Fairy";
    }
    if (isPigeonPet() && (kind === "fish" || kind === "ball" || kind === "portal" || kind === "spider")) {
      return "Unavailable while Pigeon is active";
    }
    if (isFrogPet() && kind === "ball") {
      return "Unavailable for Frog";
    }
    if (isSkeletonPet() && kind === "fish") {
      return "Unavailable for Skeleton";
    }
    if (kind === "chat" && !ollamaEnabled) {
      return "Enable AI Chat first";
    }
    const requiredXP = QUICK_MENU_XP_REQUIREMENTS[kind] || 0;
    if (!isFreePlay && xp < requiredXP) {
      return `Locked until ${QUICK_MENU_LEVEL_LABELS[kind] || "a higher level"}`;
    }
    if (lowPowerMode) return "Turn off Eco Mode first";
    if (bubbleTrap.active && kind !== "bubble") return "Bubble is active";
    if (kind === "bubble") {
      if (bubbleTrap.active || bubbleTrap.popping)
        return "Bubble already active";
      if (!rareEventsEnabled) return "Rare Events is off";
      if (lowPowerMode) return "Power saving is on";
      if (isDragging || state === "dragged") return "Drop the pet first";
      return "";
    }
    if (hasActivePickup()) return "Another item is active";
    if (kind === "spider" && activeSpiders.length >= 1)
      return "Spider already active";
    if (kind === "portal" && portalModule.activePortals.length > 0)
      return "Portal already active";
    return "";
  }

  function makeQuickMenuIconStyle(item, activeBallId) {
    if (item.kind === "follow_mode") {
      return {
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWxpbmUgcG9pbnRzPSIxNyAxIDIxIDUgMTcgOSIvPjxwYXRoIGQ9Ik0zIDExVjlhNCA0IDAgMCAxIDQtNGgxNCIvPjxwYXRoIGQ9Ik03IDIzIDMgMTkgNyAxNSIvPjxwYXRoIGQ9Ik0yMSAxM3YyYTQgNCAwIDAgMS00IDRIMyIvPjwvc3ZnPg==",
        size: "60%",
        position: "center",
      };
    }
    if (item.kind === "shuffle_mode") {
      return {
        image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWxpbmUgcG9pbnRzPSIxNiAzIDIxIDMgMjEgOCIvPjxsaW5lIHgxPSI0IiB5MT0iMjAiIHgyPSIyMSIgeTI9IjMiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNiAyMSAyMSAxNiAyMSIvPjxsaW5lIHgxPSIxNSIgeTE9IjE1IiB4Mj0iMjEiIHkyPSIyMSIvPjxsaW5lIHgxPSI0IiB5MT0iNCIgeDI9IjkiIHkyPSI5Ii8+PC9zdmc+",
        size: "60%",
        position: "center",
      };
    }
    if (item.kind === "aim") {
      return {
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNyAwaDJ2Nkg3VjB6TTcgMTBoMnY2SDd2LTZ6TTAgN2g2djJIMFY3ek0xMCA3aDZ2MmgtNlY3eiIgZmlsbD0iYmxhY2siLz48L3N2Zz4=',
        size: "contain",
        position: "center",
      };
    }
    if (item.kind === "ball") {
      return {
        image: getQuickMenuBallIcon(activeBallId),
        size: "contain",
        position: "center",
      };
    }
    if (item.kind === "fish") {
      if (isFrogPet()) {
        return {
          image: u("assets/animations/frog/fly.png"),
          size: "260% 520%",
          position: "center 13.5%",
        };
      }
      return {
        image: u("assets/fishes/fish3.png"),
        size: "contain",
        position: "center",
      };
    }
    if (item.kind === "portal") {
      return {
        image: u("assets/icons/menu_portal.png"),
        size: "contain",
        position: "center",
      };
    }
    if (item.kind === "spider") {
      return {
        image: u("assets/icons/menu_spider.png"),
        size: "contain",
        position: "center",
      };
    }
    if (item.kind === "chat") {
      return {
        image: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 10h6"/><path d="M9 13h4"/></svg>'),
        size: "contain",
        position: "center",
      };
    }
    if (item.kind === "hamburger") {
      return {
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjMiIHkxPSIxMiIgeDI9IjIxIiB5Mj0iMTIiPjwvbGluZT48bGluZSB4MT0iMyIgeTE9IjYiIHgyPSIyMSIgeTI9IjYiPjwvbGluZT48bGluZSB4MT0iMyIgeTE9IjE4IiB4Mj0iMjEiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==',
        size: "contain",
        position: "center",
      };
    }
    return {
      image: u("assets/icons/menu_bubble.png"),
      size: "contain",
      position: "center",
    };
  }

  function stopSpeechForQuickMenu() {
    if (speechModule && typeof speechModule.hideSpeechBubble === "function") {
      speechModule.hideSpeechBubble();
    } else if (typeof hideSpeechBubble === "function") {
      hideSpeechBubble();
    }
  }

  function getQuickMenuAnchorPoint(evt) {
    const fallbackX = evt && Number.isFinite(evt.clientX) ? evt.clientX : feetX;
    const fallbackY = evt && Number.isFinite(evt.clientY) ? evt.clientY : feetY;
    const petX = Number.isFinite(feetX) ? feetX : fallbackX;
    const petFeetY = Number.isFinite(feetY) ? feetY : fallbackY;
    const isWallState =
      state === "wall_left" ||
      state === "wall_right" ||
      state === "wall_left_sit" ||
      state === "wall_right_sit" ||
      state === "ninja_climb";
    const isBubbleTrapState =
      !!(bubbleTrap && (bubbleTrap.active || bubbleTrap.popping)) ||
      state === "bubble_trap";
    const sizeScale = Math.max(1, (VIS * sizeMultiplier) / 80);
    const gap = Math.max(6, POSITIONING.BUBBLE_GAP * sizeScale);

    let top;
    let mid;
    let bottom;
    let halfW;

    if (isBubbleTrapState) {
      const bubbleWidth = Math.max(
        VIS * sizeMultiplier * 0.95,
        bubbleTrap ? bubbleTrap.width : 0,
      );
      const bubbleHeight = Math.max(
        VIS * sizeMultiplier * 1.05,
        bubbleTrap ? bubbleTrap.height : 0,
      );
      const bubbleCenterY = petFeetY - bubbleHeight * 0.245;
      top = bubbleCenterY - bubbleHeight * 0.5;
      mid = bubbleCenterY;
      bottom = bubbleCenterY + bubbleHeight * 0.31;
      halfW = bubbleWidth * 0.5;
    } else if (isWallState) {
      top = petFeetY - VIS * sizeMultiplier * 0.42;
      mid = petFeetY - VIS * sizeMultiplier * 0.08;
      bottom = petFeetY + VIS * sizeMultiplier * 0.28;
      halfW = VIS * sizeMultiplier * 0.22;
    } else if (isFairyPet()) {
      top = petFeetY - VIS * sizeMultiplier * (onGround ? 0.48 : 0.58);
      mid = petFeetY - VIS * sizeMultiplier * 0.32;
      bottom = petFeetY;
      halfW = VIS * sizeMultiplier * 0.4;
    } else if (isClippyPet()) {
      top = petFeetY - VIS * sizeMultiplier * 0.82;
      mid = petFeetY - VIS * sizeMultiplier * 0.52;
      bottom = petFeetY - VIS * sizeMultiplier * 0.22;
      halfW = VIS * sizeMultiplier * 0.28;
    } else {
      top = petFeetY - VIS * sizeMultiplier * 0.35;
      mid = petFeetY - VIS * sizeMultiplier * 0.18;
      bottom = petFeetY;
      halfW = VIS * sizeMultiplier * 0.5;
    }

    return {
      x: petX,
      top,
      mid,
      bottom,
      left: petX - halfW,
      right: petX + halfW,
      gap,
      margin: Math.max(8, POSITIONING.BUBBLE_MARGIN * sizeScale),
    };
  }

  function placeQuickMenu(menu, clientX, clientY, anchorPoint) {
    const rect = menu.getBoundingClientRect();
    const anchor = anchorPoint || getQuickMenuAnchorPoint({ clientX, clientY });
    const width = rect.width || 150;
    const height = rect.height || 42;
    const margin = Number.isFinite(anchor.margin) ? anchor.margin : 8;
    const gap = Number.isFinite(anchor.gap) ? anchor.gap : 6;
    const anchorX = Number.isFinite(anchor.x) ? anchor.x : clientX;
    const anchorTop = Number.isFinite(anchor.top) ? anchor.top : clientY;
    const anchorBottom = Number.isFinite(anchor.bottom)
      ? anchor.bottom
      : clientY;

    const candidates = [
      {
        anchor: "top",
        tail: "bottom",
        x: anchorX - width / 2,
        y: anchorTop - height - gap,
      },
      {
        anchor: "bottom",
        tail: "top",
        x: anchorX - width / 2,
        y: anchorBottom + gap,
      },
    ];

    let chosen = candidates[0];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (c.y >= margin && c.y + height <= _vh - margin) {
        chosen = c;
        break;
      }
    }

    let left = Math.max(margin, Math.min(_vw - width - margin, chosen.x));
    let top = Math.max(margin, Math.min(_vh - height - margin, chosen.y));

    menu.dataset.tail = chosen.tail;
    menu.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }

  let aimTargetRect = null;
  let aimModeActive = false;
  let aimOverlay = null;

  function exitAimMode() {
    if (!aimModeActive) return;
    aimModeActive = false;
    document.body.style.cursor = "";
    if (aimOverlay) {
      aimOverlay.remove();
      aimOverlay = null;
    }
    document.removeEventListener("mousemove", handleAimMouseMove, true);
    document.removeEventListener("click", handleAimClick, true);
    document.removeEventListener("keydown", handleAimKeyDown, true);
  }

  function handleAimMouseMove(e) {
    if (!aimModeActive || !aimOverlay) return;
    aimOverlay.style.display = "none";
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== document.body && el !== document.documentElement && !el.closest(".youtube-pixel-cat") && !el.closest(".pixelcat-action-menu")) {
      const rect = el.getBoundingClientRect();
      aimOverlay.style.display = "block";
      aimOverlay.style.left = rect.left + "px";
      aimOverlay.style.top = rect.top + "px";
      aimOverlay.style.width = rect.width + "px";
      aimOverlay.style.height = rect.height + "px";
    }
  }

  function handleAimClick(e) {
    if (!aimModeActive) return;
    e.preventDefault();
    e.stopPropagation();
    
    aimOverlay.style.display = "none";
    const el = document.elementFromPoint(e.clientX, e.clientY);
    exitAimMode();

    if (el && el !== document.body && el !== document.documentElement && !el.closest(".youtube-pixel-cat") && !el.closest(".pixelcat-action-menu")) {
      aimTargetRect = { el: el, rect: el.getBoundingClientRect() };
      
      const r = aimTargetRect.rect;
      envRects.push({
        el: el,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        w: r.width,
        h: r.height,
        isPlatform: true,
      });

      feetX = r.left + r.width / 2;
      feetY = getPlatformStandY({ top: r.top });
      velY = 0;
      velX = 0;
      onGround = true;
      isJumping = false;
      if (typeof clearGroundedPlatformAnchor === "function") clearGroundedPlatformAnchor();
      if (typeof scanInteractableElements === "function") scanInteractableElements();
      go("sit");
      applyTransform(); 
    }
  }
  
  function handleAimKeyDown(e) {
    if (e.key === "Escape") exitAimMode();
  }

  function enterAimMode() {
    if (aimModeActive) return;
    aimModeActive = true;
    removeExistingQuickMenus();
    
    document.body.style.cursor = "crosshair";
    
    aimOverlay = document.createElement("div");
    aimOverlay.style.position = "fixed";
    aimOverlay.style.zIndex = "999999999";
    aimOverlay.style.pointerEvents = "none";
    aimOverlay.style.border = "3px dashed rgba(239, 68, 68, 0.8)";
    aimOverlay.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
    aimOverlay.style.boxSizing = "border-box";
    aimOverlay.style.display = "none";
    document.body.appendChild(aimOverlay);
    
    document.addEventListener("mousemove", handleAimMouseMove, true);
    document.addEventListener("click", handleAimClick, true);
    document.addEventListener("keydown", handleAimKeyDown, true);
  }

  async function openQuickSpawnMenu(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (
      (bubbleTrap &&
        (bubbleTrap.active || bubbleTrap.popping || bubbleTrap.trapped)) ||
      state === "bubble_trap"
    ) {
      removeExistingQuickMenus();
      return;
    }

    if (!catEnabled || isDestroyed) return;

    stopSpeechForQuickMenu();
    removeExistingQuickMenus();
    quickSpawnMenuOpen = true;
    holdPetForQuickMenu(true);

    let data = { catXP: 0, activeBall: _activeBallId, rareEventsEnabled, freePlayMode, unlockAll };
    try {
      data = await getLocal({
        catXP: 0,
        activeBall: _activeBallId,
        rareEventsEnabled: true,
        freePlayMode: false,
        unlockAll: false,
      });
    } catch (_) {
      
    }

    const xp = Math.min(270, Math.max(0, Number(data.catXP) || 0));
    const isFreePlay = Boolean(data.freePlayMode || data.unlockAll || freePlayMode || unlockAll);
    const activeBallId =
      typeof data.activeBall === "string" &&
      QUICK_MENU_BALL_IMAGES[data.activeBall]
        ? data.activeBall
        : _activeBallId;
    rareEventsEnabled =
      typeof data.rareEventsEnabled === "boolean"
        ? data.rareEventsEnabled
        : rareEventsEnabled;

    const menu = document.createElement("div");
    menu.className = "pixelcat-action-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "PixelCat quick spawn menu");

    let items = [
      { kind: "aim", label: "Aim" },
      { kind: "ball", label: "Ball" },
      { kind: "fish", label: isFrogPet() ? "Fly" : "Fish" },
      { kind: "portal", label: "Portal" },
      { kind: "spider", label: "Spider" },
      { kind: "bubble", label: "Bubble" },
    ];
    if (isClippyPet()) {
      items = [
        { kind: "aim", label: "Aim" },
        { kind: "chat", label: "Chat" },
        { kind: "hamburger", label: "Menu" }
      ];
    }

    if (isFairyPet() || isPigeonPet()) {
      items.push(
        { kind: "follow_mode", label: "Follow Cursor" },
        { kind: "shuffle_mode", label: "Free Roam" }
      );
    }

    const visibleItems = items.filter((item) => {
      if (item.kind === "follow_mode" || item.kind === "shuffle_mode") return true;
      const isActive = isQuickItemActive(item.kind);
      const reason = isActive ? "" : getQuickMenuDisabledReason(item.kind, xp, isFreePlay);
      if ((isFairyPet() || isPigeonPet()) && reason) {
        return false; 
      }
      return true;
    });

    visibleItems.forEach((item) => {
      const isActive = isQuickItemActive(item.kind);
      const reason = (item.kind === "follow_mode" || item.kind === "shuffle_mode") ? "" : (isActive ? "" : getQuickMenuDisabledReason(item.kind, xp, isFreePlay));
      const button = document.createElement("button");
      button.className = "pixelcat-action-menu-btn" + (isActive ? " is-active-item" : "");
      button.type = "button";
      button.setAttribute("role", "menuitem");
      button.setAttribute(
        "aria-label",
        isActive ? `Cancel ${item.label}` : (reason ? `${item.label}. ${reason}.` : item.label),
      );
      button.title = isActive ? `Cancel ${item.label}` : (reason || item.label);
      button.dataset.kind = item.kind;
      if (reason) {
        button.disabled = true;
        button.classList.add("is-disabled");
      }

      const iconStyle = makeQuickMenuIconStyle(item, activeBallId);
      const icon = document.createElement("span");
      icon.className = `pixelcat-action-menu-icon pixelcat-action-${item.kind}`;
      icon.style.setProperty(
        "--pixelcat-action-image",
        `url("${iconStyle.image}")`,
      );
      icon.style.setProperty("--pixelcat-action-size", iconStyle.size);
      icon.style.setProperty("--pixelcat-action-position", iconStyle.position);
      button.appendChild(icon);

      if (isActive) {
        const cancelBadge = document.createElement("span");
        cancelBadge.className = "pixelcat-action-menu-cancel";
        cancelBadge.textContent = "X";
        button.appendChild(cancelBadge);
      } else if (reason) {
        const lock = document.createElement("span");
        lock.className = "pixelcat-action-menu-lock";
        lock.setAttribute("aria-hidden", "true");
        button.appendChild(lock);
      }

      let handled = false;
      const handleAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (handled || button.disabled) return;
        handled = true;
        try {
          if (isActive) {
            cancelQuickItem(item.kind);
          } else {
            const ok = runQuickMenuAction(item.kind);
            if (
              !ok &&
              speechModule &&
              typeof speechModule.speakFromCategory === "function"
            ) {
              speechModule.speakFromCategory("confused", {
                durationMs: 2200,
                cooldownMs: 3500,
              });
            }
          }
        } finally {
          removeExistingQuickMenus();
        }
      };

      button.addEventListener("mousedown", handleAction);
      button.addEventListener("click", handleAction);

      menu.appendChild(button);
    });

    document.body.appendChild(menu);
    scheduleQuickMenuAutoClose(menu);
    holdPetForQuickMenu(false);
    requestAnimationFrame(() => {
      stopSpeechForQuickMenu();
      placeQuickMenu(
        menu,
        evt.clientX,
        evt.clientY,
        getQuickMenuAnchorPoint(evt),
      );
    });
  }

  addManagedEventListener(catEl, "contextmenu", openQuickSpawnMenu);
  addManagedEventListener(
    document,
    "mousedown",
    (evt) => {
      const menu = document.querySelector(".pixelcat-action-menu");
      if (!menu || menu.contains(evt.target) || evt.target === catEl) return;
      removeExistingQuickMenus();
    },
    true,
  );
  addManagedEventListener(document, "keydown", (evt) => {
    if (evt.key === "Escape") removeExistingQuickMenus();
  });
  addManagedEventListener(window, "resize", removeExistingQuickMenus);
  addManagedEventListener(window, "scroll", removeExistingQuickMenus, {
    passive: true,
  });

  function hitBall(ball, vx, vy) {
    if (!ball || ball.exiting || ball.removing) return false;
    ball.vx = vx;
    ball.vy = vy;
    ball.onGround = false;
    ball.hitCount = (ball.hitCount || 0) + 1;
    ball.vrot = (vx || 0) * 2;

    if (isUserDrivenTarget(ball)) {
      ball.exitOnWall = false;
      ball.lifetime = Math.max(Number(ball.lifetime) || 0, 25);
      return true;
    }

    const age = Number(ball.age) || 0;
    const exitAfter = Number(ball.exitAfter) || 30;
    const hitTarget = Number(ball.exitHitAfter) || 6;
    const isPastNaturalTime = age >= exitAfter;
    const isGettingOld = age >= exitAfter * 0.7 && ball.hitCount >= hitTarget;
    const randomFinish = isGettingOld && Math.random() < 0.35;

    ball.exitOnWall = isPastNaturalTime || randomFinish;
    return true;
  }

  function rewardBallHit() {
    earnXP(0.25); 
    recordQuestEvent("ball_catches", 1);
  }

  function getFoxActionPrefix(kind) {
    return kind === "fish" ? "foxFishPounce" : "foxBallPounce";
  }

  function beginFoxPreAction(target, kind, options) {
    if (!isFoxPet() || !target || target.exiting || target.removing)
      return false;
    const opts = options || {};
    const prefix = getFoxActionPrefix(kind);
    const now = safeNow();
    const readyKey = `${prefix}ReadyAt`;
    const byKey = `${prefix}By`;

    if (target[byKey] === api && Number(target[readyKey]) > now) return true;

    target[byKey] = api;
    target[readyKey] = now + (opts.delayMs || (kind === "ball" ? 180 : 260));
    target[`${prefix}StartedAt`] = now;

    const dx = (Number(target.x) || feetX) - feetX;
    const dir = Math.abs(dx) > 5 ? (dx > 0 ? 1 : -1) : facingLeft ? -1 : 1;
    setDir(dir < 0);

    if (kind === "ball") {

      const step =
        Math.abs(dx) > 10
          ? dir *
            Math.min(
              SPEED_WALK * 0.85,
              Math.max(SPEED_WALK * 0.25, Math.abs(dx) * 2.4),
            )
          : 0;
      velX = step;
      velY = 0;
      if (onGround) {
        isJumping = false;
        setAnimLocked(ANIMS.catch ? "catch" : "paw", opts.lockMs || 360);
      } else {
        setAnimLocked(ANIMS.catch ? "catch" : "jump", opts.lockMs || 300);
      }
      stateTimer = Math.max(stateTimer, opts.extendStateTimer || 900);
      return true;
    }

    if (onGround) spawnDust(feetX, feetY);
    velX =
      dir *
      Math.min(SPEED_RUN * 0.95, Math.max(SPEED_WALK * 0.35, Math.abs(dx) * 4));
    velY = JUMP_V * (opts.jumpPower || 0.62);
    onGround = false;
    isJumping = true;
    setAnimLocked("jump", opts.lockMs || 360);
    stateTimer = Math.max(stateTimer, opts.extendStateTimer || 900);
    return true;
  }

  function isFoxPreActionReady(target, kind) {
    if (!isFoxPet()) return true;
    if (!target) return false;
    const prefix = getFoxActionPrefix(kind);
    return (
      target[`${prefix}By`] === api &&
      safeNow() >= Number(target[`${prefix}ReadyAt`] || 0)
    );
  }

  function clearFoxPreAction(target, kind) {
    if (!target) return;
    const prefix = getFoxActionPrefix(kind);
    delete target[`${prefix}By`];
    delete target[`${prefix}ReadyAt`];
    delete target[`${prefix}StartedAt`];
  }

  function maybeFoxHeldFishHop(fish, fishDist, fishRawYDist, fishDir) {
    if (!isFoxPet() || !fish || !fish.isHeld) return false;
    if (!onGround || isJumping || animLockTimer > 0) return false;

    const fishAbove = -fishRawYDist;
    const closeEnoughX = fishDist < 155 + (sizeMultiplier - 1) * 35;
    const goodTeaseHeight =
      fishAbove > 28 && fishAbove < 175 + (sizeMultiplier - 1) * 35;
    if (!closeEnoughX || !goodTeaseHeight) return false;

    const now = safeNow();
    if (now - Number(fish.foxHeldFoodHopAt || 0) < 620) return false;
    fish.foxHeldFoodHopAt = now;

    const dir =
      Math.abs(fish.x - feetX) > 3 ? (fish.x > feetX ? 1 : -1) : fishDir;
    setDir(dir < 0);

    const heightRatio = Math.max(0, Math.min(1, (fishAbove - 28) / 145));
    const jumpPower = 0.24 + heightRatio * 0.16 + Math.random() * 0.04; 
    const horizontalPower = 0.42 + Math.min(0.42, fishDist / 240);

    if (onGround) spawnDust(feetX, feetY);
    velX = dir * SPEED_RUN * horizontalPower;
    velY = JUMP_V * jumpPower;
    onGround = false;
    isJumping = true;
    setAnimLocked(ANIMS.catch ? "catch" : "jump", 420);
    stateTimer = Math.max(stateTimer, 900);
    return true;
  }

  function pickIdleVariant() {
    if (isFrogPet()) {
      if (frogIdleCooldownCycles > 0) {
        frogIdleCooldownCycles--;
        frogConsecutiveCroaks = 0;
        chosenIdle = Math.random() < 0.25 ? "idle2" : "idle1";
      } else if (frogConsecutiveCroaks >= 2) {
        frogConsecutiveCroaks = 0;
        frogIdleCooldownCycles = 2 + ((Math.random() * 2) | 0);
        chosenIdle = "idle1";
      } else if (Math.random() < 0.22) {
        frogConsecutiveCroaks++;
        chosenIdle = "clean1";
      } else {
        frogConsecutiveCroaks = 0;
        chosenIdle = Math.random() < 0.25 ? "idle2" : "idle1";
      }
    } else {
      chosenIdle = Math.random() < 0.5 ? "idle1" : "idle2";
    }
    return chosenIdle;
  }
  function pickCleanVariant() {
    chosenClean = Math.random() < 0.5 ? "clean1" : "clean2";
    return chosenClean;
  }

  function isElVisible(el) {
    if (!el || !el.isConnected) return false;
    
    if (el.offsetParent === null && el.tagName !== "BODY") return false;

    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    return true;
  }

  const envRects = PixelCatRuntime.envRects;
  let envPending = false;
  let mutationScanTimeout = null;
  let lastEnvScanAt = 0;

  let pageSettlingUntil = 0;
  function markPageSettling(ms) {
    pageSettlingUntil = Math.max(pageSettlingUntil, safeNow() + (ms || 1200));
  }
  function isPageSettling() {
    return safeNow() < pageSettlingUntil;
  }

  const currentHost = (location.hostname || "").toLowerCase();
  const IS_GOOGLE_PAGE = /(^|\.)google\.(com|co\.ma)$/.test(currentHost);
  const GOOGLE_PATH = (location.pathname || "").toLowerCase();
  const GOOGLE_Q = new URLSearchParams(location.search || "").get("q");
  const IS_GOOGLE_SEARCH_RESULTS =
    IS_GOOGLE_PAGE && (!!GOOGLE_Q || GOOGLE_PATH === "/search");
  const IS_YOUTUBE_PAGE = /(^|\.)youtube\.com$/.test(currentHost);
  const SUPPORTS_ENVIRONMENT_SCAN =
    IS_YOUTUBE_PAGE ||
    IS_GOOGLE_PAGE ||
    currentHost === "reddit.com" ||
    currentHost.endsWith(".reddit.com");

  function safeMatches(el, selector) {
    if (!el || typeof el.matches !== "function") return false;
    try {
      return el.matches(selector);
    } catch (_) {
      return false;
    }
  }

  const _platSels = [
    "ytd-rich-item-renderer",
    "ytd-rich-grid-media",
    "ytd-rich-section-renderer",
    "ytd-compact-video-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "yt-lockup-view-model",
    "yt-thumbnail-view-model",
    "ytd-channel-renderer",
    "ytd-playlist-renderer",
    "ytd-radio-renderer",
    "ytd-shelf-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-rich-grid-row",
    "ytd-playlist-panel-video-renderer",
    "ytd-comment-thread-renderer",
    "ytd-reel-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-reel-shelf-renderer",
    "ytm-shorts-lockup-view-model",

    'form[role="search"]',
    'form[action="/search"]',
    "div.RNNXgb",
    "div.A8SBwf",
    'div[role="search"]',
    'textarea[name="q"]',
    'input[name="q"]',
    'center input[name="btnK"]',
    'center input[name="btnI"]',
    'input[name="btnK"]',
    'input[name="btnI"]',
    "#search .MjjYud",
    "#search .g",
    "#rso .MjjYud",
    "#rso .g",
    "#rhs .g",
    "#rhs",
    "#botstuff",
    "#botstuff .g",
    "#bres",
    "g-scrolling-carousel",
    "div.isv-r",
    'div[role="contentinfo"]',
    "footer",
    "#fbar",
    "shreddit-post",
    "shreddit-comment",
    "shreddit-feed",
    "reddit-sidebar-nav",
    "faceplate-tracker",
    "faceplate-hovercard",

  ];
  const _attackSels = [
    "#video-title",
    "h3.ytd-rich-grid-media",
    "yt-formatted-string#video-title",
    "a#video-title",
    "yt-lockup-metadata-view-model",
    "yt-lockup-view-model",
    ".ytp-title-text",
    "ytd-thumbnail",
    "yt-thumbnail-view-model",
    "ytd-thumbnail-overlay-time-status-renderer",
    ".ytd-channel-name a",
    "ytd-channel-name",
    "ytd-channel-renderer",
    "ytd-playlist-renderer",
    "ytd-radio-renderer",
    "ytd-chip-cloud-chip-renderer",
    "yt-chip-cloud-chip-renderer",
    "yt-related-chip-cloud-chip-renderer",
    "ytd-comment-renderer #content-text",
    "ytd-comment-view-model",
    "ytd-comment-thread-renderer",
    "#info-strings span",
    "#owner-sub-count",
    "#subscribe-button",
    "#top-level-buttons-computed",
    "yt-button-shape",
    "button.yt-spec-button-shape-next",
    "ytd-playlist-panel-video-renderer",
    "ytd-reel-player-overlay-renderer",
    "yt-reel-metapanel-view-model",
    "yt-reel-channel-bar-view-model",
    "yt-reel-video-title-view-model",
    "yt-reel-action-bar-view-model",
    "ytd-logo",
    "a#logo",
    "#search-input",
    "#search-form",
    "ytd-searchbox",
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    
    'textarea[name="q"]',
    'input[name="q"]',
    'input[name="btnK"]',
    'input[name="btnI"]',
    'a[href*="gmail"]',
    'a[href*="imghp"]',
    'a[aria-label*="Google apps"]',
    'a[aria-label*="Google Account"]',
    "#search a h3",
    "#search .MjjYud a",
    "#search .g a",
    "#rhs a",
    "#botstuff a",
    "#top_nav a",
    'a[href*="tbm=isch"]',
    'a[href*="tbm=nws"]',
    'a[href*="tbm=vid"]',
    'div[role="contentinfo"] a',
    "footer a",
    "#fbar a",
    "shreddit-post",
    "shreddit-comment",
    "faceplate-tracker",
    "a.title",
    "a[data-click-id='body']",
    ".post-title",
  ];

  const _blockedPlatformTags = new Set([
    "HTML",
    "BODY",
    "SCRIPT",
    "STYLE",
    "LINK",
    "META",
    "NOSCRIPT",
    "IFRAME",
    "SVG",
    "PATH",
    "SPAN",
    "P",
    "A",
    "BUTTON",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "LABEL",
    "TIME",
    "SMALL",
    "STRONG",
    "EM",
    "B",
    "I",
    "CODE",
    "PRE",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
  ]);

  const _genericSurfaceNameRe =
    /(?:^|[\s_\-])(card|post|tile|feed|item|product|result|entry|article|panel|box|media|story|thread)(?:$|[\s_\-])/i;
  const _badPlatformNameRe =
    /(tooltip|popover|popup|dropdown|menu|modal|overlay|toast|drawer|sidebar|navbar|header|footer|cookie|consent|advert|ads-|sponsor|sponsored|pixelcat|youtube-pixel-cat)/i;

  function elementTextName(el) {
    if (!el) return "";
    const cls = typeof el.className === "string" ? el.className : "";
    return `${el.tagName || ""} ${el.id || ""} ${cls}`;
  }

  function isTransparentColor(value) {
    if (!value || value === "transparent") return true;
    return /^rgba\([^)]*,\s*(0|0\.0+)\)$/i.test(value);
  }

  function hasVisibleMediaSurface(el) {
    if (!el || typeof el.querySelectorAll !== "function") return false;
    let media = null;
    try {
      media = el.querySelectorAll("img, video, canvas, picture, svg");
    } catch (_) {
      return false;
    }
    for (let i = 0; i < media.length && i < 4; i++) {
      const m = media[i];
      if (!m || !m.isConnected) continue;
      const r = m.getBoundingClientRect();
      if (
        r.width >= 34 &&
        r.height >= 24 &&
        r.bottom > 0 &&
        r.top < _vh &&
        r.right > 0 &&
        r.left < _vw
      )
        return true;
    }
    return false;
  }

  function hasPaintedSurface(style) {
    if (!style) return false;
    if (!isTransparentColor(style.backgroundColor)) return true;
    if (style.boxShadow && style.boxShadow !== "none") return true;
    if (
      style.outlineStyle &&
      style.outlineStyle !== "none" &&
      parseFloat(style.outlineWidth || "0") > 0
    )
      return true;
    const borderTop = parseFloat(style.borderTopWidth || "0");
    const borderBottom = parseFloat(style.borderBottomWidth || "0");
    const borderLeft = parseFloat(style.borderLeftWidth || "0");
    const borderRight = parseFloat(style.borderRightWidth || "0");
    return borderTop + borderBottom + borderLeft + borderRight > 0;
  }

  function isYouTubePlatformTag(tag) {
    return /^YTD/.test(tag) || /^YT-/.test(tag) || /^YTM/.test(tag);
  }

  function findGoogleSearchBarElement(el) {
    if (!IS_GOOGLE_PAGE || !el) return null;
    if (safeMatches(el, "div.RNNXgb, div.A8SBwf")) return el;

    let queryField = null;
    if (safeMatches(el, 'textarea[name="q"], input[name="q"]')) {
      queryField = el;
    } else if (typeof el.querySelector === "function") {
      try {
        queryField = el.querySelector('textarea[name="q"], input[name="q"]');
      } catch (_) {
        queryField = null;
      }
    }
    if (!queryField) return null;

    const directBox =
      queryField.closest && queryField.closest("div.RNNXgb, div.A8SBwf");
    if (directBox) return directBox;

    let best = null;
    let cur = queryField.parentElement;
    for (let depth = 0; cur && depth < 8; depth++, cur = cur.parentElement) {
      if (cur === document.body || cur === document.documentElement) break;
      const r = cur.getBoundingClientRect();
      if (
        r.width >= 180 &&
        r.height >= 30 &&
        r.height <= 88 &&
        r.width <= _vw * 0.82 &&
        r.top >= 4 &&
        r.bottom <= _vh - 4
      ) {
        best = cur;
      }
    }
    return best;
  }

  function normalizeGooglePlatformElement(el, selector) {
    if (!IS_GOOGLE_PAGE || !el) return el;
    const sel = selector || "";
    if (
      /form\[|textarea\[name="q"\]|input\[name="q"\]|RNNXgb|A8SBwf|role="search"/.test(
        sel,
      ) ||
      isGoogleSearchSurfaceLoose(el)
    ) {
      const searchBox = findGoogleSearchBarElement(el);
      if (searchBox) return searchBox;
      if (safeMatches(el, 'form[role="search"], form[action="/search"]'))
        return null;
    }
    return el;
  }

  function isGoogleSearchSurfaceLoose(el) {
    return (
      IS_GOOGLE_PAGE &&
      !!(
        el &&
        (safeMatches(
          el,
          'form[role="search"], form[action="/search"], div.RNNXgb, div.A8SBwf, div[role="search"], textarea[name="q"], input[name="q"]',
        ) ||
          (el.closest &&
            el.closest(
              'form[role="search"], form[action="/search"], div.RNNXgb, div.A8SBwf',
            )))
      )
    );
  }

  function isGoogleSearchSurface(el) {
    if (!IS_GOOGLE_PAGE || !el) return false;
    const box = findGoogleSearchBarElement(el);
    return !!box && box === el;
  }

  function isGoogleButtonSurface(el) {
    return (
      IS_GOOGLE_PAGE &&
      safeMatches(el, 'input[name="btnK"], input[name="btnI"]')
    );
  }

  function isGoogleFooterSurface(el) {
    return (
      IS_GOOGLE_PAGE &&
      (safeMatches(el, 'div[role="contentinfo"], footer, #fbar') ||
        !!(
          el.closest &&
          el.closest('div[role="contentinfo"], footer, #fbar') === el
        ))
    );
  }

  function isGoogleResultSurface(el) {
    if (!IS_GOOGLE_SEARCH_RESULTS || !el) return false;
    if (
      safeMatches(
        el,
        "#search .MjjYud, #search .g, #rso .MjjYud, #rso .g, #rhs, #rhs .g, #botstuff, #botstuff .g, #bres, g-scrolling-carousel, div.isv-r",
      )
    )
      return true;
    const block =
      el.closest &&
      el.closest(
        "#search .MjjYud, #search .g, #rso .MjjYud, #rso .g, #rhs, #rhs .g, #botstuff, #botstuff .g, #bres, g-scrolling-carousel, div.isv-r",
      );
    return !!block && block === el;
  }

  function isGoogleStandableSurface(el, rect) {
    if (!IS_GOOGLE_PAGE || !el || !rect) return false;
    if (
      rect.right <= 0 ||
      rect.left >= _vw ||
      rect.bottom <= 40 ||
      rect.top >= _vh - 4
    )
      return false;

    if (isGoogleSearchSurface(el)) {

      if (rect.height > 88 || rect.width > _vw * 0.82) return false;
      if (IS_GOOGLE_SEARCH_RESULTS) {
        return (
          rect.width >= 220 &&
          rect.height >= 34 &&
          rect.top > 4 &&
          rect.top < 170
        );
      }
      return (
        rect.width >= 180 &&
        rect.height >= 28 &&
        rect.top > 70 &&
        rect.top < _vh * 0.72
      );
    }

    if (isGoogleButtonSurface(el)) {
      return (
        rect.width >= 50 &&
        rect.height >= 22 &&
        rect.top > 100 &&
        rect.top < _vh * 0.78
      );
    }

    if (isGoogleResultSurface(el)) {
      if (rect.width < Math.min(220, _vw * 0.24) || rect.height < 48)
        return false;
      if (rect.top < 100 || rect.top > _vh - 54) return false;
      return true;
    }

    if (isGoogleFooterSurface(el)) {
      return (
        rect.width >= Math.min(260, _vw * 0.45) &&
        rect.height >= 36 &&
        rect.top > _vh * 0.55
      );
    }

    return false;
  }

  function isStandablePlatformCandidate(el, rect, selector) {
    if (!el || !rect || !el.isConnected) return false;
    if (
      el === document.body ||
      el === document.documentElement ||
      el === catEl ||
      catEl.contains(el)
    )
      return false;
    const tag = (el.tagName || "").toUpperCase();
    const googleSurface = isGoogleStandableSurface(el, rect);
    if (_blockedPlatformTags.has(tag) && !googleSurface) return false;
    if (
      !googleSurface &&
      (rect.width < 90 || rect.height < 42 || rect.width * rect.height < 5200)
    )
      return false;
    if (
      (googleSurface ? rect.top < 4 : rect.top < 38) ||
      rect.bottom <= 42 ||
      rect.top >= _vh - 8 ||
      rect.right <= 0 ||
      rect.left >= _vw
    )
      return false;
    if (!googleSurface && rect.width > _vw * 0.98 && rect.height > _vh * 0.42)
      return false;
    if (!googleSurface && rect.height > _vh * 0.62) return false;

    const name = elementTextName(el);
    if (!googleSurface && _badPlatformNameRe.test(name)) return false;

    let style = null;
    try {
      style = getComputedStyle(el);
    } catch (_) {
      return false;
    }
    if (
      !style ||
      style.display === "none" ||
      style.display === "contents" ||
      style.visibility === "hidden"
    )
      return false;
    if (parseFloat(style.opacity || "1") < 0.08) return false;
    if (style.pointerEvents === "none" && !googleSurface) return false;
    if (
      !googleSurface &&
      !isYouTubePlatformTag(tag) &&
      (style.position === "fixed" || style.position === "sticky")
    )
      return false;
    if (googleSurface) return true;

    const role = (el.getAttribute && (el.getAttribute("role") || "")) || "";
    const semanticSurface =
      tag === "ARTICLE" || role === "article" || role === "listitem";
    const namedSurface = _genericSurfaceNameRe.test(name);
    const paintedSurface = hasPaintedSurface(style);
    const mediaSurface = hasVisibleMediaSurface(el);

    if (!isYouTubePlatformTag(tag)) {
      if (tag === "LI" && !namedSurface && !mediaSurface && !paintedSurface)
        return false;
      if (!semanticSurface && !namedSurface && !paintedSurface && !mediaSurface)
        return false;
      if (rect.height < 56 && !paintedSurface && !mediaSurface) return false;
    }

    return true;
  }

  function horizontalOverlap(a, b) {
    return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  }

  function pushEnvRect(out, data) {
    if (!data || !data.el) return;
    if (!data.isPlatform) {
      out.push(data);
      return;
    }
    const newArea = data.w * data.h;
    for (let i = 0; i < out.length; i++) {
      const old = out[i];
      if (!old || !old.isPlatform || old.el === data.el) continue;
      const overlap = horizontalOverlap(old, data);
      const minWidth = Math.min(old.w, data.w);
      const sameSurfaceLine =
        Math.abs(getPlatformStandY(old) - getPlatformStandY(data)) < 8 &&
        overlap > minWidth * 0.72;
      if (!sameSurfaceLine) continue;
      const oldArea = old.w * old.h;
      
      if (newArea < oldArea * 0.88) out[i] = data;
      return;
    }
    out.push(data);
  }

  function doEnvScan() {
    envPending = false;
    if (!SUPPORTS_ENVIRONMENT_SCAN) return;
    _logicRectCache.clear();
    if (isDestroyed || !isTabVisible || document.hidden) return;
    if (isPageSettling()) {
      scheduleContentSettledScan(500);
      return;
    }
    if (isScrolling) {
      scheduleContentSettledScan(650);
      return;
    }
    const out = [];
    const vh = _vh,
      vw = _vw;

    function collect(sels, isPlatform, isAttack) {
      const root = document.querySelector("ytd-app") || document.body;
      for (let s = 0; s < sels.length; s++) {
        if (out.length >= 36) break;
        try {
          const els = root.querySelectorAll(sels[s]);
          const minH = sels[s].indexOf("ytp") !== -1 ? 2 : 10;
          for (let i = 0; i < els.length && out.length < 36; i++) {
            let el = els[i];
            if (isPlatform && IS_GOOGLE_PAGE) {
              const normalized = normalizeGooglePlatformElement(el, sels[s]);
              if (!normalized) continue;
              el = normalized;
            }
            if (!isElVisible(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 10 || r.height < minH) continue;
            if (r.top >= vh || r.bottom <= 40 || r.right <= 0 || r.left >= vw)
              continue;
            if (isPlatform && !isStandablePlatformCandidate(el, r, sels[s]))
              continue;

            const tag = el.tagName.toUpperCase();
            const isChip = tag === "YTD-CHIP-CLOUD-CHIP-RENDERER";
            const isLogo =
              tag === "YTD-LOGO" || el.id === "logo" || el.closest("ytd-logo");
            const isSearch =
              el.id === "search" ||
              tag === "YTD-SEARCHBOX" ||
              el.closest("#search");

            pushEnvRect(out, {
              el,
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              w: r.width,
              h: r.height,
              isPlatform,
              isAttack,
              isChip,
              isLogo,
              isSearch,
            });
          }
        } catch (_) {
          
        }
      }
    }
    collect(_platSels, true, false);
    collect(_attackSels, false, true);
    
    if (typeof aimTargetRect !== "undefined" && aimTargetRect && aimTargetRect.el && aimTargetRect.el.isConnected) {
      const r = aimTargetRect.el.getBoundingClientRect();
      aimTargetRect.rect = r;
      out.push({
        el: aimTargetRect.el,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        w: r.width,
        h: r.height,
        isPlatform: true,
      });
    } else if (typeof aimTargetRect !== "undefined" && aimTargetRect) {
      aimTargetRect = null; 
    }
    
    PixelCatRuntime.envRects.length = 0;
    PixelCatRuntime.envRects.push(...out);
    lastEnvScanAt = safeNow();
  }

  function shiftCachedEnvForScroll(deltaY) {
    if (!deltaY || !envRects.length) return;
    const viewportDelta = -deltaY;
    for (let i = envRects.length - 1; i >= 0; i--) {
      const r = envRects[i];
      if (!r || !r.el || !r.el.isConnected) {
        envRects.splice(i, 1);
        continue;
      }
      r.top += viewportDelta;
      r.bottom += viewportDelta;
      if (r.bottom < -200 || r.top > _vh + 200) envRects.splice(i, 1);
    }
  }

  function runEnvScanWhenReady() {
    const run = () => {
      if (isDestroyed || !isTabVisible || document.hidden) {
        envPending = false;
        return;
      }
      doEnvScan();
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => requestAnimationFrame(run), {
        timeout: 700,
      });
    } else {
      requestAnimationFrame(run);
    }
  }

  function scheduleEnvScan(delay) {
    if (isCompanion || !SUPPORTS_ENVIRONMENT_SCAN) return;
    if (isDestroyed || !isTabVisible || document.hidden) return;
    if (envPending) return;
    if (
      lowPowerMode &&
      PixelCatRuntime.envRects.length > 0 &&
      safeNow() - lastEnvScanAt < 20000
    )
      return;
    if (isPageSettling()) {
      scheduleContentSettledScan(
        Math.max(lowPowerMode ? 1800 : 450, delay == null ? 0 : delay),
      );
      return;
    }
    envPending = true;
    const requestedDelay = delay == null ? 0 : delay;
    addTimeout(
      runEnvScanWhenReady,
      lowPowerMode ? Math.max(1800, requestedDelay) : requestedDelay,
    );
  }

  function scheduleContentSettledScan(delay) {
    if (isCompanion || isDestroyed || !isTabVisible || document.hidden) return;
    removeTimeout(mutationScanTimeout);
    mutationScanTimeout = addTimeout(
      () => {
        mutationScanTimeout = null;
        if (isScrolling) {
          scheduleContentSettledScan(650);
          return;
        }
        scheduleEnvScan(0);
      },
      delay == null ? 900 : delay,
    );
  }

  scheduleEnvScan(document.readyState === "complete" ? 600 : 1200);
  addInterval(() => {
    if (lowPowerMode) return;
    if (!catEnabled || !isTabVisible || document.hidden) return;
    if (isScrolling || envPending || mutationScanTimeout) return;
    scheduleEnvScan(0);
  }, 8000);

  const activeSmashes = [];

  function smashElement(el) {
    if (!el || !el.isConnected) return;
    const existing = activeSmashes.find((s) => s.el === el);
    if (existing) {
      existing.t = 0;
      return;
    }

    activeSmashes.push({
      el,
      t: 0,
      origT: el.style.transform || "",
      origO: el.style.opacity || "",
      origTransition: el.style.transition || "",
    });
    el.style.transition = "none"; 
  }

  function updateSmashes(dt) {
    for (let i = activeSmashes.length - 1; i >= 0; i--) {
      const s = activeSmashes[i];
      if (!s.el.isConnected) {
        activeSmashes.splice(i, 1);
        continue;
      }

      s.t += dt * 1000;
      if (s.t < 400) {
        
        const rot = (Math.random() - 0.5) * 3;
        const tx = (Math.random() - 0.5) * 4;
        const ty = (Math.random() - 0.5) * 3;
        s.el.style.transform = `rotate(${rot}deg) translate3d(${tx}px,${ty}px, 0)`;
      } else {
        
        const finalRot =
          (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);
        s.el.style.transition = "transform 0.4s cubic-bezier(.18,.89,.32,1.15)";
        s.el.style.transform = `rotate(${finalRot}deg)`;

        const elToReset = s.el;
        const oT = s.origT,
          oO = s.origO,
          oTransition = s.origTransition;
        addTimeout(() => {
          if (elToReset.isConnected) {
            elToReset.style.transition =
              "transform 0.6s ease, opacity 0.6s ease";
            elToReset.style.transform = oT;
            elToReset.style.opacity = oO;
            addTimeout(() => {
              if (elToReset.isConnected)
                elToReset.style.transition = oTransition;
            }, 650);
          }
        }, 3000);

        activeSmashes.splice(i, 1);
      }
    }
  }

  function cleanupSmashIntervals() {
    activeSmashes.forEach((s) => {
      if (s.el && s.el.isConnected) {
        s.el.style.transition = s.origTransition || "";
        s.el.style.transform = s.origT || "";
        s.el.style.opacity = s.origO || "";
      }
    });
    activeSmashes.length = 0;
  }

  const activeBounces = new Map();

  function restoreBouncedElement(el, original) {
    if (el && el.isConnected) {
      el.style.transition = original.transition;
      el.style.transform = original.transform;
    }
    activeBounces.delete(el);
  }

  function cleanupBouncedElements() {
    activeBounces.forEach((original, el) =>
      restoreBouncedElement(el, original),
    );
    activeBounces.clear();
  }

  function bounceElement(el, impactVelocity) {
    if (!el || !el.isConnected) return;
    let original = activeBounces.get(el);
    if (!original) {
      original = {
        transition: el.style.transition || "",
        transform: el.style.transform || "",
      };
      activeBounces.set(el, original);
    }

    const intensity = Math.min(1.0, impactVelocity / 600);
    const squash = 1 - 0.05 * intensity; 
    const translate = 3 * intensity; 

    el.style.transition = "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.transform = `scaleY(${squash}) translateY(${translate}px)`;

    addTimeout(() => {
      if (activeBounces.get(el) !== original) return;
      if (isDestroyed || !el.isConnected) {
        restoreBouncedElement(el, original);
        return;
      }
      if (el.isConnected) {
        el.style.transition =
          "transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)"; 
        el.style.transform = original.transform;

        addTimeout(() => {
          if (activeBounces.get(el) === original)
            restoreBouncedElement(el, original);
        }, 400);
      }
    }, 100);
  }

  addManagedEventListener(document, "yt-navigate-start", () => {

    markPageSettling(2200);
    cleanupSmashIntervals();
    cleanupBouncedElements();
    if (envRects) envRects.length = 0;
    attackEl = null;
    targetFish = null;
    targetBall = null;
    velX = 0;
    velY = 0;
    isJumping = false;
    globalRot = 0;
    visualRot = 0;
    lastTs = null;
    lastUpdateTs = null;
    animAccum = 0;
    removeTimeout(mutationScanTimeout);
    mutationScanTimeout = null;
    scheduleContentSettledScan(900);

    if (!isDragging && !bubbleTrap.active && !isDeepSleep) {
      if (!isBatPet() && !onGround) {
        feetY = _vh;
        onGround = true;
        velY = 0;
        isJumping = false;
      }
      go("sit");
    }
  });
  addManagedEventListener(document, "yt-navigate-finish", () => {
    markPageSettling(900);
    scheduleContentSettledScan(750);

    addTimeout(() => {
      if (!isDragging && !bubbleTrap.active && !isDeepSleep) {
        
        if (!isBatPet() && !onGround) {
          feetY = _vh;
          onGround = true;
          velY = 0;
          isJumping = false;
        }
        
        if (state === "sit" || state === "nap") {
          go(null); 
        }
      }
    }, 1800);
  });

  let isScrolling = false;
  let _scrollEndTimeout = null;
  let _scrollTrackY = window.scrollY;
  let _scrollRaf = 0;
  let _pendingScrollDeltaY = 0;
  let lastScrollActivityAt = safeNow();

  function syncCatToScrolledPlatform(deltaY) {
    if (
      !deltaY ||
      !onGround ||
      isDragging ||
      isClippyPet() ||
      state === "dragged" ||
      state === "hide" ||
      state === "hidden"
    )
      return;
    if (feetY >= _vh - 8) return;

    const expectedY = feetY - deltaY;
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r || !r.isPlatform || !r.el || !r.el.isConnected) continue;
      const inset = getPlatformInset(r);
      if (feetX < r.left + inset || feetX > r.right - inset) continue;
      const dist = Math.abs(getPlatformStandY(r) - expectedY);
      if (dist < 90 && dist < bestDist) {
        best = r;
        bestDist = dist;
      }
    }

    if (!best) return;
    captureGroundedPlatform(best);
    feetY = getPlatformStandY(best);
    velY = 0;
    isJumping = false;
    lastTransformStr = "";
    lastTransformOriginStr = "";
    applyPos();
    if (typeof positionSpeechBubble === "function") positionSpeechBubble(true);
  }

  addManagedEventListener(
    document,
    "scroll",
    () => {
      const currentY = window.scrollY;
      const deltaY = currentY - _scrollTrackY;
      _scrollTrackY = currentY;
      _pendingScrollDeltaY += deltaY;
      lastScrollActivityAt = safeNow();
      isScrolling = true;

      if (!_scrollRaf) {
        _scrollRaf = requestAnimationFrame(() => {
          _scrollRaf = 0;
          if (isDestroyed) return;
          const dy = _pendingScrollDeltaY;
          _pendingScrollDeltaY = 0;
          shiftCachedEnvForScroll(dy);
          if (!syncGroundedPlatformAnchor(false)) syncCatToScrolledPlatform(dy);
        });
      }

      removeTimeout(_scrollEndTimeout);
      _scrollEndTimeout = addTimeout(() => {
        isScrolling = false;
        scheduleEnvScan(90);
      }, 220);
    },
    { passive: true, capture: true },
  );

  function getPortalSeekTargetPoint() {
    const portal = getQuickMenuPortalTarget();
    return portal ? { x: portal.x, y: portal.y } : null;
  }

  function getActiveChaseTargetPoint() {
    if (state === "chasefish" && targetFish)
      return { x: targetFish.x, y: targetFish.y, target: targetFish };
    if (state === "ball_play" && targetBall)
      return { x: targetBall.x, y: targetBall.y, target: targetBall };
    if (state === "chasing_bug" && targetSpider)
      return { x: targetSpider.x, y: targetSpider.y, target: targetSpider };
    if (state === "portal_seek") return getPortalSeekTargetPoint();
    if (state === "coinchase" && coinChaseTarget) {
      const coinSize = 16 * sizeMultiplier;
      return {
        x: coinChaseTarget.x + coinSize / 2,
        y: coinChaseTarget.y + coinSize / 2,
        target: coinChaseTarget,
      };
    }
    return null;
  }

  function shouldIgnorePlatformsForLowerChaseTarget() {
    if (velY <= 0 || onGround) return false;
    if (safeNow() < chaseDropThroughUntil) return true;
    const targetPoint = getActiveChaseTargetPoint();
    if (!targetPoint) return false;
    return targetPoint.y - feetY > 34;
  }

  function computeFloor(catX) {
    const base = isClippyPet() ? Math.round(_vh - 35) : _vh;

    if (shouldIgnorePlatformsForLowerChaseTarget()) {
      return base;
    }
    let best = base;
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform) continue;
      const inset = getPlatformInset(r);
      if (catX < r.left + inset || catX > r.right - inset) continue;
      const standY = getPlatformStandY(r);
      if (
        feetY <= standY + getPlatformSnapTolerance() &&
        standY < best &&
        standY > 50
      ) {
        best = standY;
      }
    }
    return best;
  }

  function getCurrentPlatform() {
    if (!onGround) return null;
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      const inset = getPlatformInset(r);
      if (
        feetX >= r.left + inset &&
        feetX <= r.right - inset &&
        Math.abs(feetY - getPlatformStandY(r)) < getPlatformAttachTolerance()
      ) {
        return r;
      }
    }
    return null;
  }

  function getLivePlatformRect(el) {
    if (!el || !el.isConnected || !isElVisible(el)) return null;
    const r = el.getBoundingClientRect();
    if (!r || r.width < 10 || r.height < 10) return null;
    if (r.bottom <= -80 || r.top >= _vh + 80 || r.right <= 0 || r.left >= _vw)
      return null;
    if (!isStandablePlatformCandidate(el, r, "live")) return null;
    return {
      el,
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      w: r.width,
      h: r.height,
      isPlatform: true,
      isAttack: false,
    };
  }

  function clearGroundedPlatformAnchor() {
    groundedPlatformEl = null;
    groundedPlatformOffsetX = 0;
    groundedPlatformGraceUntil = 0;
  }

  function captureGroundedPlatform(platform) {
    if (
      !platform ||
      !platform.el ||
      !platform.el.isConnected ||
      feetY >= _vh - 8
    ) {
      clearGroundedPlatformAnchor();
      return;
    }
    groundedPlatformEl = platform.el;
    groundedPlatformOffsetX = Math.max(
      0,
      Math.min(
        platform.w || platform.right - platform.left || 0,
        feetX - platform.left,
      ),
    );
    groundedPlatformLastSeenAt = safeNow();
    groundedPlatformGraceUntil = groundedPlatformLastSeenAt + 850;
  }

  function syncGroundedPlatformAnchor(allowGrace) {
    if (
      !onGround ||
      isDragging ||
      isClippyPet() ||
      state === "dragged" ||
      state === "hide" ||
      state === "hidden"
    ) {
      if (!onGround || isDragging) clearGroundedPlatformAnchor();
      return false;
    }
    if (feetY >= _vh - 8) {
      clearGroundedPlatformAnchor();
      return false;
    }

    let live = getLivePlatformRect(groundedPlatformEl);
    if (!live) {
      const current = getCurrentPlatform();
      if (current) {
        captureGroundedPlatform(current);
        live = getLivePlatformRect(current.el) || current;
      }
    }

    if (!live) {
      return allowGrace !== false && safeNow() < groundedPlatformGraceUntil;
    }

    const inset = getPlatformInset(live);
    const minX = live.left + inset;
    const maxX = live.right - inset;
    if (maxX > minX) {

      if (
        (velX > 2 && feetX > maxX) ||
        (velX < -2 && feetX < minX)
      ) {
        clearGroundedPlatformAnchor();
        return false;
      }

      if (Math.abs(velX) > 2) {
        groundedPlatformOffsetX = Math.max(
          0,
          Math.min(
            live.w || live.right - live.left || 0,
            feetX - live.left,
          ),
        );
      }
      const desiredOffset =
        groundedPlatformOffsetX ||
        Math.min(Math.max(feetX - live.left, inset), live.w - inset);
      feetX = Math.max(minX, Math.min(maxX, live.left + desiredOffset));
    }
    feetY = getPlatformStandY(live);
    velY = 0;
    isJumping = false;
    groundedPlatformLastSeenAt = safeNow();
    groundedPlatformGraceUntil = groundedPlatformLastSeenAt + 850;
    return true;
  }

  function isPlatformStillValid(platform) {
    if (!platform || !platform.el) return false;
    return !!getLivePlatformRect(platform.el);
  }

  function getPlatformAt(x, y) {
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      if (
        x >= r.left &&
        x <= r.right &&
        Math.abs(y - getPlatformStandY(r)) < 30
      ) {
        return r;
      }
    }
    return null;
  }

  function isNearPlatformEdge(catX, direction) {
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      const inset = getPlatformInset(r);
      if (catX < r.left + inset || catX > r.right - inset) continue;
      if (Math.abs(feetY - getPlatformStandY(r)) > getPlatformAttachTolerance())
        continue;
      const edgeZone = Math.max(50, inset + 22);
      if (direction > 0 && catX > r.right - edgeZone) return true;
      if (direction < 0 && catX < r.left + edgeZone) return true;
    }
    return false;
  }

  function findAdjacentPlatform(catX, direction) {
    let bestDist = Infinity,
      bestPlat = null;
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      if (Math.abs(r.top - feetY) > 60) continue;
      if (direction > 0) {
        const dist = r.left - catX;
        if (dist > 0 && dist < 250 && dist < bestDist) {
          bestDist = dist;
          bestPlat = r;
        }
      } else {
        const dist = catX - r.right;
        if (dist > 0 && dist < 250 && dist < bestDist) {
          bestDist = dist;
          bestPlat = r;
        }
      }
    }
    return bestPlat;
  }

  function startChaseDropThrough(edgeDir, speedMultiplier = 1.45) {
    const dir = edgeDir < 0 ? -1 : 1;
    chaseDropThroughUntil = safeNow() + 2200;
    clearGroundedPlatformAnchor();
    velX = dir * SPEED_RUN * speedMultiplier;
    velY = Math.max(velY, 150);
    onGround = false;
    isJumping = true;
    setDir(velX < 0);
    setAnim("jump", true);
  }

  function platformCoversLowerTarget(platform, tx, ty, horizontalWindow = 90) {
    if (!platform || ty - feetY <= 40) return false;
    const inset = getPlatformInset(platform);
    const width = Math.max(0, platform.right - platform.left);
    const petInside =
      feetX >= platform.left + inset && feetX <= platform.right - inset;
    const targetInside =
      tx >= platform.left + inset && tx <= platform.right - inset;
    if (!petInside || !targetInside) return false;

    const distToLeft = Math.max(0, feetX - platform.left);
    const distToRight = Math.max(0, platform.right - feetX);
    const nearestEdgeDist = Math.min(distToLeft, distToRight);
    const isBroadSurface =
      width > _vw * 0.68 || (IS_GOOGLE_PAGE && width > _vw * 0.48);
    const isGoogleFullFooter =
      IS_GOOGLE_PAGE && platform.el && isGoogleFooterSurface(platform.el);
    const targetNearlyUnderPet = Math.abs(tx - feetX) <= horizontalWindow;

    return (
      isGoogleFullFooter ||
      isBroadSurface ||
      nearestEdgeDist > 220 ||
      targetNearlyUnderPet
    );
  }

  function startChaseDropThroughToward(tx, ty, speedMultiplier = 0.65) {
    const dx = tx - feetX;
    const dir =
      Math.abs(dx) > 8 ? (dx > 0 ? 1 : -1) : Math.random() < 0.5 ? -1 : 1;
    chaseDropThroughUntil = safeNow() + 2600;
    clearGroundedPlatformAnchor();
    velX = dir * SPEED_RUN * speedMultiplier;
    velY = Math.max(velY, 220);
    onGround = false;
    isJumping = true;
    setDir(velX < 0);
    setAnim("jump", true);
  }

  function maybeDropThroughCurrentPlatformForLowerTarget(
    tx,
    ty,
    horizontalWindow = 90,
  ) {
    if (!onGround || isJumping) return false;
    if (ty - feetY <= 40) return false;
    const catPlat = getCurrentPlatform();
    if (!catPlat || catPlat.top >= _vh - 30) return false;
    if (!platformCoversLowerTarget(catPlat, tx, ty, horizontalWindow))
      return false;
    startChaseDropThroughToward(tx, ty);
    return true;
  }

  function moveToDropEdgeForLowerTarget(tx, ty, horizontalWindow = 90) {
    if (!onGround || isJumping) return false;
    if (ty - feetY <= 40) return false;

    const catPlat = getCurrentPlatform();
    if (!catPlat || catPlat.top >= _vh - 30) return false;
    if (platformCoversLowerTarget(catPlat, tx, ty, horizontalWindow)) {
      startChaseDropThroughToward(tx, ty);
      return true;
    }

    const dx = tx - feetX;
    const distToLeft = Math.max(0, feetX - catPlat.left);
    const distToRight = Math.max(0, catPlat.right - feetX);

    let edgeDir;
    if (tx < catPlat.left - 20) edgeDir = -1;
    else if (tx > catPlat.right + 20) edgeDir = 1;
    else if (Math.abs(dx) > horizontalWindow) edgeDir = dx > 0 ? 1 : -1;
    else edgeDir = distToLeft <= distToRight ? -1 : 1;

    const edgeDist = edgeDir < 0 ? distToLeft : distToRight;
    velX = edgeDir * SPEED_RUN * 1.2;
    setDir(velX < 0);
    setAnim("run");

    if (edgeDist < 58) {
      startChaseDropThrough(edgeDir);
    }
    return true;
  }

  function planRouteToTarget(tx, ty) {
    const dx = tx - feetX;
    const dy = ty - feetY; 
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const dir = dx > 0 ? 1 : -1;
    const catPlat = onGround ? getCurrentPlatform() : null;

    if (absDy < 60 && absDx < 400) {
      return { type: "walk", dir };
    }

    if (dy < -40) {
      
      let bestStep = null,
        bestScore = Infinity;
      for (let i = 0; i < envRects.length; i++) {
        const r = envRects[i];
        if (!r.isPlatform || !r.el.isConnected) continue;
        
        if (r.top >= feetY - 10 || r.top < ty - 50) continue;
        
        const platCenterX = r.left + r.w / 2;
        const distFromCat = Math.abs(platCenterX - feetX);
        if (distFromCat > 200) continue;
        
        const distFromTarget = Math.hypot(platCenterX - tx, r.top - ty);
        const score = distFromTarget + distFromCat * 0.3;
        if (score < bestScore) {
          bestScore = score;
          bestStep = r;
        }
      }

      if (bestStep) {
        const platX = bestStep.left + bestStep.w / 2;
        return {
          type: "jump-to-platform",
          platX,
          platY: bestStep.top,
          dir: platX > feetX ? 1 : -1,
          heightDiff: feetY - bestStep.top,
        };
      }

      if (feetX < 80) {
        return { type: "climb-wall", wall: "left" };
      }
      if (feetX > _vw - 80) {
        return { type: "climb-wall", wall: "right" };
      }

      const nearestWall = feetX < _vw / 2 ? "left" : "right";
      return {
        type: "run-to-wall",
        wall: nearestWall,
        dir: nearestWall === "left" ? -1 : 1,
      };
    }

    if (dy > 60 && catPlat) {
      const distToLeft = feetX - catPlat.left;
      const distToRight = catPlat.right - feetX;
      const dropDir = distToLeft < distToRight ? -1 : 1;
      
      const smartDir = dx > 0 ? 1 : -1;
      const edgeDir = distToLeft < 60 || distToRight < 60 ? dropDir : smartDir;
      return { type: "drop-down", dir: edgeDir };
    }

    if (absDx > 300 && onGround) {
      const adj = findAdjacentPlatform(feetX, dir);
      if (adj) {
        return { type: "hop-platform", dir, plat: adj };
      }
    }

    return { type: "walk", dir };
  }

  function executeRoute(route) {
    if (!route || !onGround || isJumping) return false;
    if (route.type === "walk") return false; 
    if (pathfindCooldown > 0) return false; 
    pathfindCooldown = 2.0; 

    switch (route.type) {
      case "jump-to-platform": {
        
        const jumpPow = Math.min(1.2, 0.6 + route.heightDiff / 300);
        const horizPow = 0.9 + Math.random() * 0.4;
        velY = JUMP_V * jumpPow;
        velX = route.dir * SPEED_RUN * horizPow * 1.3;
        setDir(velX < 0);
        setAnim("jump", true);
        isJumping = true;
        onGround = false;
        return true;
      }
      case "climb-wall": {
        if (!wallClimbEnabled) return false;
        if (route.wall === "left") {
          feetX = getWallAttachX("left");
          go("wall_left");
        } else {
          feetX = getWallAttachX("right");
          go("wall_right");
        }
        return true;
      }
      case "run-to-wall": {
        velX = route.dir * SPEED_RUN * 1.3;
        setDir(velX < 0);
        setAnim("run");
        return true;
      }
      case "drop-down": {
        startChaseDropThrough(route.dir, 1.25);
        return true;
      }
      case "hop-platform": {
        const hp = 0.6 + Math.random() * 0.4;
        velY = JUMP_V * hp;
        velX = route.dir * SPEED_RUN * 1.2;
        setDir(velX < 0);
        setAnim("jump", true);
        isJumping = true;
        onGround = false;
        return true;
      }
      default:
        return false;
    }
  }

  function pickAttackRect() {
    const pool = envRects.filter(
      (r) => r.isAttack && r.el.isConnected && r.top > 50,
    );
    return pool.length ? pool[~~(Math.random() * pool.length)] : null;
  }

  const _logicRectCache = new Map();
  function getCachedRect(el) {
    if (!el || !el.isConnected)
      return { left: 0, top: 0, w: 0, h: 0, width: 0, height: 0 };
    for (let i = 0; i < envRects.length; i++) {
      if (envRects[i].el === el) return envRects[i];
    }
    if (_logicRectCache.has(el)) return _logicRectCache.get(el);
    const r = el.getBoundingClientRect();
    const result = {
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      w: r.width,
      h: r.height,
      width: r.width,
      height: r.height,
    };
    _logicRectCache.set(el, result);
    return result;
  }

  function getUiActionTarget() {
    const candidates = [];

    if (IS_GOOGLE_PAGE) {
      const googleTargets = document.querySelectorAll(
        'input[name="btnK"], input[name="btnI"], textarea[name="q"], input[name="q"], a[href*="gmail"], a[href*="imghp"], a[aria-label*="Google apps"], a[aria-label*="Google Account"], #search a h3, #search .MjjYud a, #search .g a, #rhs a, #botstuff a, #top_nav a, a[href*="tbm=isch"], a[href*="tbm=nws"], a[href*="tbm=vid"], div[role="contentinfo"] a, footer a, #fbar a',
      );
      for (let i = 0; i < googleTargets.length && candidates.length < 16; i++) {
        const el = googleTargets[i];
        if (!el || !el.isConnected || !isElVisible(el)) continue;
        const r = el.getBoundingClientRect();
        if (
          r.width < 8 ||
          r.height < 8 ||
          r.bottom < 0 ||
          r.top > _vh ||
          r.right < 0 ||
          r.left > _vw
        )
          continue;
        candidates.push({ type: "google", el });
      }
      if (candidates.length) {
        const pick = candidates[(Math.random() * candidates.length) | 0];
        const r = pick.el.getBoundingClientRect();
        return {
          type: pick.type,
          el: pick.el,
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        };
      }
    }

    const topButtons = document.querySelectorAll(
      "#top-level-buttons-computed ytd-toggle-button-renderer button, ytd-menu-renderer ytd-toggle-button-renderer button",
    );
    for (let i = 0; i < topButtons.length; i++) {
      const btn = topButtons[i];
      if (!btn || !btn.isConnected) continue;
      const label = (
        (btn.getAttribute("aria-label") || "") +
        " " +
        (btn.getAttribute("title") || "")
      ).toLowerCase();
      if (label.includes("dislike"))
        candidates.push({ type: "dislike", el: btn });
      else if (label.includes("like"))
        candidates.push({ type: "like", el: btn });
    }

    const progress = document.querySelector(
      ".ytp-progress-bar, .ytp-progress-bar-container",
    );
    if (progress && progress.isConnected) {
      candidates.push({ type: "progress", el: progress });
    }

    if (!candidates.length) return null;
    const pick = candidates[(Math.random() * candidates.length) | 0];
    const r = pick.el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > _vh) return null;
    return {
      type: pick.type,
      el: pick.el,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    };
  }

  function triggerUiClick(el) {
    if (!el || !el.isConnected) return;
    try {
      
      el.classList.remove("pixelcat-fake-tap");
      void el.offsetWidth;
      el.classList.add("pixelcat-fake-tap");
      addTimeout(() => {
        if (el && el.isConnected) el.classList.remove("pixelcat-fake-tap");
      }, 360);
    } catch (_) {
      
    }
  }

  const personality = Math.random();

  const STATES = [
    { s: "wander", w: 14, e: 0.3, b: 0.4 },
    { s: "sit", w: personality < 0.3 ? 20 : 16, e: 0, b: 0 },
    { s: "groom", w: personality < 0.3 ? 12 : 8, e: 0.1, b: 0 },
    { s: "chase", w: personality > 0.7 ? 10 : 6, e: 0.5, b: 0.7 },
    { s: "attack", w: 12, e: 0.5, b: 0.5 },
    { s: "hide", w: 8, e: 0.3, b: 0.2 },
    { s: "zoomies", w: personality > 0.7 ? 8 : 3, e: 0.8, b: 1.0 },
    { s: "jump", w: 5, e: 0.4, b: 0.3 },
    { s: "stare", w: 10, e: 0, b: 0 },
    { s: "spook", w: 3, e: 0.2, b: 0 },
    { s: "climbtop", w: 6, e: 0.6, b: 0.4 },
    { s: "patrol", w: 10, e: 0.4, b: 0.5 },
    { s: "pounce", w: personality > 0.7 ? 6 : 3, e: 0.6, b: 0.6 },
    { s: "nap", w: personality < 0.3 ? 10 : 5, e: 0, b: 0 },
    { s: "stretch", w: 5, e: 0.1, b: 0 },
    { s: "watchvideo", w: 10, e: 0, b: 0 },
    { s: "knockoff", w: 4, e: 0.4, b: 0.8 },
    { s: "ui_mischief", w: 5, e: 0.35, b: 0.9 },
    { s: "pawplay", w: 6, e: 0.2, b: 0.2 },
    { s: "edgesit", w: 7, e: 0.1, b: 0.1 },
    { s: "headtilt", w: 5, e: 0.1, b: 0 },
    { s: "explore", w: 8, e: 0.3, b: 0.6 },
    { s: "ninja_climb", w: 5, e: 0.8, b: 0.5 },
    { s: "peek_a_boo", w: 7, e: 0.3, b: 0.3 },
    { s: "logo_hunt", w: 6, e: 0.3, b: 0.5 },
    { s: "chip_pounce", w: 8, e: 0.4, b: 0.7 },
    { s: "search_paw", w: 5, e: 0.2, b: 0.4 },
    { s: "ball_play", w: 12, e: 0.5, b: 0.8 },
  ];

  const AGGRESSIVE_STATES = new Set([
    "attack",
    "knockoff",
    "pounce",
    "ui_mischief",
  ]);

  function pick(excl) {
    let total = 0;
    const weights = new Array(STATES.length);

    for (let i = 0; i < STATES.length; i++) {
      const x = STATES[i];
      if (excl && excl.includes(x.s)) {
        weights[i] = 0;
        continue;
      }
      if (isFoxPet() && FOX_DISABLED_STATES.has(x.s)) {
        weights[i] = 0;
        continue;
      }
      if (!isAggressiveMode && AGGRESSIVE_STATES.has(x.s)) {
        weights[i] = 0;
        continue;
      }
      if (!wallClimbEnabled && (x.s === "ninja_climb" || x.s === "wall_left" || x.s === "wall_right" || x.s === "wall_left_sit" || x.s === "wall_right_sit")) {
        weights[i] = 0;
        continue;
      }
      if (!uiMischiefEnabled && x.s === "ui_mischief") {
        weights[i] = 0;
        continue;
      }
      let weight = x.w;

      if (x.e && catEnergy < x.e) weight *= 0.1;
      if (x.e && catEnergy > 0.7) weight *= 1.5;
      if (
        catEnergy < 0.2 &&
        (x.s === "nap" || x.s === "sit" || x.s === "groom")
      )
        weight *= 3;

      if (catBoredom > 0.6 && x.b > 0.5) weight *= 2.5;
      if (catBoredom > 0.8 && x.s === "zoomies") weight *= 5;

      if (
        catHunger > 0.8 &&
        (x.s === "stare" || x.s === "headtilt" || x.s === "chase")
      )
        weight *= 3;

      if (x.s === "sit" || x.s === "groom" || x.s === "nap") weight *= 2.0;
      if (x.s === "zoomies" || x.s === "attack") weight *= 0.5;

      total += weight;
      weights[i] = weight;
    }

    let r = Math.random() * total;
    for (let i = 0; i < STATES.length; i++) {
      r -= weights[i];
      if (r <= 0) return STATES[i].s;
    }
    return "sit";
  }
  function randFrom(arr) {
    return arr[~~(Math.random() * arr.length)];
  }

  function clampWalls() {
    const vw = _vw;
    let hitWall = false;
    const wallMargin = getSideWallMargin();

    if (feetX < wallMargin) {
      feetX = wallMargin;
      const wasRunning = Math.abs(velX) > SPEED_RUN * 0.65;
      velX = Math.abs(velX) * 0.3;
      setDir(false);
      recoverFromSideWall("left", wasRunning);
      if (wasRunning) hitWall = true;
    }
    if (feetX > vw - wallMargin) {
      feetX = vw - wallMargin;
      const wasRunning = Math.abs(velX) > SPEED_RUN * 0.65;
      velX = -Math.abs(velX) * 0.3;
      setDir(true);
      recoverFromSideWall("right", wasRunning);
      if (wasRunning) hitWall = true;
    }
    if (hitWall) maybeSpeakConfused();
    return hitWall;
  }

  function recoverFromSideWall(side, force) {
    const margin = getSideWallMargin();
    feetX = side === "left" ? margin : _vw - margin;

    const runningIntoLeft = side === "left" && velX < 0;
    const runningIntoRight = side === "right" && velX > 0;
    if (!force && !runningIntoLeft && !runningIntoRight) return;

    const dir = side === "left" ? 1 : -1;
    const wallRunStates = new Set([
      "wander",
      "zoomies",
      "spook",
      "patrol",
      "explore",
      "chase",
      "attack",
      "hide",
      "knockoff",
      "logo_hunt",
      "chip_pounce",
      "search_paw",
      "ball_chase",
      "ball_play",
      "coinchase",
    ]);

    velX = dir * Math.min(SPEED_WALK, Math.max(40, Math.abs(velX) * 0.35));
    targetX = Math.max(
      margin,
      Math.min(_vw - margin, feetX + dir * (90 + Math.random() * 140)),
    );
    setDir(dir < 0);

    if (wallRunStates.has(state)) {
      if (Math.abs(velX) > SPEED_WALK * 0.75) setAnim("walk", true);
      state = "wander";
      stateTimer = 900 + Math.random() * 900;
    }
  }

  function maybeSpeakForStateEntry(nextState) {
    if (
      isCompanion ||
      !speechModule ||
      typeof speechModule.maybeSpeakAction !== "function"
    )
      return;
    if (
      isDragging ||
      nextState === "dragged" ||
      nextState === "hidden" ||
      document.hidden
    )
      return;

    let category = "";
    let chance = 0;
    let minGapMs = 18000;
    let repeatGapMs = 45000;

    switch (nextState) {

      case "wander":
      case "patrol":
      case "explore":
      case "edgesit":
      case "zoomies":
      case "spook":
      case "peek_a_boo":
      case "wall_sit":
      case "logo_hunt":
      case "chip_pounce":
      case "search_paw":
      case "chase":
      case "attack":
      case "hide":
      case "climbtop":
      case "wall_left":
      case "wall_right":
      case "wall_left_sit":
      case "wall_right_sit":
      case "ninja_climb":
      case "jump":
      case "pounce":
      case "groom":
      case "stretch":
      case "watchvideo":
        return;

      case "knockoff":
      case "ui_mischief":
        category = "mischief";
        chance = 0.22;
        break;
      case "coinchase":
        category = "coin";
        chance = 0.2;
        break;
      case "ball_play":
        category = "ball";
        chance = 0.3;
        break;
      case "chasefish":
        category = "fishing";
        chance = 0.28;
        break;
      case "eatfish":
        category = "eating";
        chance = 0.45;
        minGapMs = 12000;
        repeatGapMs = 30000;
        break;
      case "chasing_bug":
        category = "spider";
        chance = 0.28;
        break;
      case "webbed_stun":
        category = "webbed";
        chance = 0.45;
        minGapMs = 12000;
        repeatGapMs = 30000;
        break;
      default:
        return;
    }

    speechModule.maybeSpeakAction(category, {
      chance,
      minGapMs,
      repeatGapMs,
      durationMs: 2600 + Math.random() * 800,
      cooldownMs: 12000,
    });
  }

  document.addEventListener("keydown", (e) => {
    if (isClippyPet()) {
        const tag = e.target.tagName ? e.target.tagName.toLowerCase() : "";
        const isTyping = tag === "input" || tag === "textarea" || e.target.isContentEditable;
        
        if (e.ctrlKey || e.metaKey) {
            let triggered = false;
            if (e.key === 's') {
                if (speechModule) speechModule.showSpeech("It looks like you're trying to save your work. Would you like to use the Save As command?", { force: true, durationMs: 4000 });
                triggered = true;
            } else if (e.key === 'p') {
                if (speechModule) speechModule.showSpeech("It looks like you're printing a document. Need help with page setup?", { force: true, durationMs: 4000 });
                triggered = true;
            } else if (e.key === 'c') {
                if (speechModule) speechModule.showSpeech("It looks like you're creating a duplicate...", { force: true, durationMs: 4000 });
                triggered = true;
            }
            if (triggered) {
                go("headtilt");
                stateTimer = 2500;
                return;
            }
        }

        if (isTyping) {
            if (state !== "pawplay") {
                go("pawplay");
                stateTimer = 1500;
                
                if (speechModule && typeof speechModule.showSpeech === "function" && Math.random() < 0.2) {
                    const clippyLines = [
                        "It looks like you're writing a letter. Would you like help?",
                        "I see you're typing. Need assistance?",
                        "Can I help you format this document?",
                        "It looks like you're browsing the web!"
                    ];
                    const text = clippyLines[Math.floor(Math.random() * clippyLines.length)];
                    speechModule.showSpeech(text, { force: false, durationMs: 4000, cooldownMs: 15000 });
                }
            } else {
                stateTimer = 1500;
                window.clippyWantsToExit = false;
            }
        }
    }
  }, { passive: true });

  document.addEventListener("input", (e) => {
    if (isClippyPet()) {
        const tag = e.target.tagName ? e.target.tagName.toLowerCase() : "";
        const isTyping = tag === "input" || tag === "textarea" || e.target.isContentEditable;
        if (!isTyping) return;
        
        let val = "";
        if (e.target.isContentEditable) val = e.target.innerText;
        else val = e.target.value;
        if (!val) return;
        
        val = val.toLowerCase();
        
        let triggered = false;
        if (val.endsWith("dear ")) {
            if (speechModule) speechModule.showSpeech("It looks like you're writing a letter. Would you like help?", { force: true, durationMs: 4000 });
            triggered = true;
        } else if (val.endsWith("resume") || val.endsWith("experience")) {
            if (speechModule) speechModule.showSpeech("It looks like you're writing a resume. Do you want help with that?", { force: true, durationMs: 4000 });
            triggered = true;
        }
        
        if (triggered) {
            go("headtilt");
            stateTimer = 2500;
        }
    }
  }, { passive: true });

  function go(s, excl) {

    if (isPigeonPet() && !onGround && !pigeonGroundedByUser && state !== "dragged") {
      if (!s || s === "sit" || s === "sleep" || s === "nap" || s === "groom" || s === "idle1" || s === "idle2" || s === "jump" || s === "stretch" || s === "scratch") {
        s = "wander";
      }
    }
    
    if (
      isLoyalMode &&
      !s &&
      state !== "chasefish" &&
      state !== "eatfish" &&
      state !== "breed_approach" &&
      state !== "dragged" &&
      state !== "deepsleep"
    ) {
      s = "loyal_follow";
    }
    if ((isPigeonPet() || isFairyPet()) && onGround && s === "loyal_follow") {
      s = Math.random() < 0.5 ? "sit" : "wander";
    }
    if (!wallClimbEnabled && s && (s === "wall_left" || s === "wall_right" || s === "wall_left_sit" || s === "wall_right_sit" || s === "ninja_climb")) {
      s = onGround && !isJumping ? "sit" : "jump";
    }
    if (isFoxPet() && s && FOX_DISABLED_STATES.has(s)) {
      s = onGround && !isJumping ? "jump" : "wander";
    }
    if (isPigeonPet() && s && PIGEON_DISABLED_STATES.has(s)) {
      s = onGround && !isJumping ? "sit" : "jump";
    }
    if (isSkeletonPet() && s && SKELETON_DISABLED_STATES.has(s)) {
      s = onGround && !isJumping ? "sit" : "jump";
    }
    if (isFrogPet() && s && FROG_DISABLED_STATES.has(s)) {
      s = onGround && !isJumping ? "sit" : "jump";
    }
    if (isFairyPet() && s && FAIRY_DISABLED_STATES.has(s)) {
      s = onGround && !isJumping ? "sit" : "jump";
    }
    attackEl = null;
    attackPhase = "move";
    if (s !== "ui_mischief" && s !== "wall_left" && s !== "wall_right") {
      uiTarget = null;
      uiWallTask = null;
    }
    state = s || pick(excl);
    
    stateTimer = 0;
    idleAccum = 0;
    animLockTimer = 0; 
    window.clippyWantsToExit = false;
    stuckCheckTimer = 0; 
    lastFishChaseX = feetX; 
    coinStuckCheckTimer = 0;
    lastCoinChaseX = feetX;
    ballStuckCheckTimer = 0;
    lastBallChaseX = feetX;
    chaseStuckTimer = 0; 
    lastChaseDistToTarget = 9999;
    chaseDropThroughUntil = 0;
    generalStuckTimer = 0;
    stuckSampleTimer = 0;
    lastStuckSampleX = feetX;
    lastStuckSampleY = feetY;

    catEl.style.zIndex = "9999999";
    catEl.style.opacity = "1";

    if (
      !isFairyPet() &&
      !isPigeonPet() &&
      state !== "wall_left" &&
      state !== "wall_right" &&
      state !== "ninja_climb" &&
      state !== "wall_left_sit" &&
      state !== "wall_right_sit"
    ) {
      if (globalRot !== 0 || visualRot !== 0) {
        globalRot = 0;
        visualRot = 0;
        applyTransform();
      }
    }

    switch (state) {
      
      case "wander": {
        const fast = Math.abs(velX) >= SPEED_RUN * 0.68;
        const speed = fast ? SPEED_RUN : SPEED_WALK;
        velX = speed * (Math.random() < 0.5 ? -1 : 1);
        setDir(velX < 0);
        const wanderAnim = (isPigeonPet() && onGround) ? "walk"
          : isPigeonPet() ? "fly"
          : (fast ? "run" : "walk");
        setAnim(wanderAnim);
        stateTimer = 2000 + Math.random() * 3000;
        break;
      }
      
      case "fight_seek": {
        stateTimer = 6000;
        const otherPet = PixelCatRuntime.instances.find(c => c.isCompanion !== isCompanion);
        if (!otherPet) {
          state = "sit";
          break;
        }
        targetX = otherPet.feetX;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        break;
      }
      
      case "fight_action": {
        velX = 0;
        stateTimer = 3500;
        fightAnimCount = 0;
        const otherPet = PixelCatRuntime.instances.find(c => c.isCompanion !== isCompanion);
        if (otherPet) setDir(otherPet.feetX < feetX);
        break;
      }

      case "sit": {
        velX = 0;
        if (isSkeletonPet()) {
          setAnim(Math.random() < 0.18 ? "inactive" : "idle2");
          stateTimer = 2000 + Math.random() * 4000;
        } else {
          setAnim(pickIdleVariant());
          stateTimer = 2000 + Math.random() * 4000;
        }
        break;
      }

      case "groom": {
        velX = 0;
        if (isSkeletonPet()) setAnim("clean1");
        else setAnim(pickCleanVariant());
        stateTimer = 3000 + Math.random() * 3000;
        break;
      }

      case "nap": {
        velX = 0;
        if (isSkeletonPet()) {
          setAnimLocked("crumple", 875);
          addTimeout(() => {
            if (state === "nap") setAnim("pile");
          }, 875);
        } else {
          setAnim("sleep");
        }
        stateTimer = 5000 + Math.random() * 5000;
        break;
      }

      case "jealous_approach": {
        stateTimer = 15000;
        break;
      }
      case "jealous_tantrum": {
        velX = 0;
        setAnimLocked("scared", 2000);
        stateTimer = 2000;
        break;
      }

      case "stretch": {
        velX = 0;
        if (isSkeletonPet()) {
          setAnimLocked("wake", 875);
          stateTimer = 875;
        } else {
          setAnim("clean2");
          stateTimer = 1800 + Math.random() * 1200;
        }
        break;
      }

      case "pawplay": {
        velX = 0;
        setAnimLocked("paw", 1200);
        stateTimer = 1800 + Math.random() * 1500;
        break;
      }
      case "searching": {
        velX = 0;
        setAnimLocked("searching", 1200);
        stateTimer = 1800 + Math.random() * 1500;
        break;
      }

      case "watchvideo": {
        const player = document.querySelector(".html5-video-player");
        if (!player) {
          go("sit");
          return;
        }
        attackEl = player;
        velX = 0;
        setAnim(pickIdleVariant()); 
        stateTimer = 8000;
        break;
      }

      case "knockoff": {
        if (isFoxPet()) {
          go("jump");
          return;
        }
        const tgt = pickAttackRect();
        if (!tgt) {
          go("sit");
          return;
        }
        attackEl = tgt.el;
        attackPhase = "approach";
        const kr = tgt;
        
        const distL = Math.abs(kr.left - feetX);
        const distR = Math.abs(kr.right - feetX);
        targetX = distL < distR ? kr.left : kr.right;

        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 5000;
        break;
      }

      case "aim_seek": {
        if (!aimTargetRect) {
          go("sit");
          return;
        }
        stateTimer = 25000;
        setAnim("run");
        break;
      }

      case "ui_mischief": {
        if (isFoxPet()) {
          go("jump");
          return;
        }
        if (!isAggressiveMode || !uiMischiefEnabled) {
          go("sit");
          return;
        }
        uiTarget = getUiActionTarget();
        if (!uiTarget || !uiTarget.el || !uiTarget.el.isConnected) {
          go("sit");
          return;
        }
        attackEl = uiTarget.el;
        attackPhase = "approach";
        stateTimer = 7000;

        if (uiTarget.type === "progress") {
          uiWallTask = {
            targetY: Math.max(70, uiTarget.y + 20),
            scrollDir: Math.random() < 0.5 ? -1 : 1,
          };
          if (uiTarget.x < _vw / 2) {
            feetX = getWallAttachX("left");
            go("wall_left");
          } else {
            feetX = getWallAttachX("right");
            go("wall_right");
          }
          return;
        }

        targetX = uiTarget.x;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        break;
      }

      case "chase": {
        
        const cdx = cursorX - feetX;
        const dist = Math.abs(cdx);
        if (dist > 170) {
          velX = (cdx > 0 ? 1 : -1) * SPEED_RUN;
          setDir(velX < 0);
          setAnim("run");
        } else if (dist > 40) {
          velX = (cdx > 0 ? 1 : -1) * SPEED_WALK;
          setDir(velX < 0);
          setAnim("walk");
        } else {
          velX = 0;
          setAnim(pickIdleVariant());
        }
        attackPhase = "pursue"; 
        chaseStuckTimer = 0;
        stateTimer = 6000 + Math.random() * 4000;
        break;
      }

      case "attack": {
        const tgt = pickAttackRect();
        if (!tgt) {
          go("sit");
          return;
        }
        attackEl = tgt.el;
        attackPhase = Math.random() < 0.15 ? "stalk" : "move";
        const r = tgt;
        targetX = r.left + (r.width || r.w) * 0.4;
        if (attackPhase === "stalk") {
          velX = SPEED_WALK * 0.4 * (targetX > feetX ? 1 : -1);
          setDir(velX < 0);
          setAnim("walk");
        } else {
          velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
          setDir(velX < 0);
          setAnim("run");
        }
        stateTimer = 5000;
        break;
      }

      case "hide": {
        const cards = envRects.filter(
          (r) => r.isPlatform && r.el.isConnected && r.w > 120 && r.h > 80,
        );
        if (!cards.length) {
          go("sit");
          return;
        }
        const ch = randFrom(cards);
        attackEl = ch.el;
        targetX = ch.left + ch.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 4000;
        break;
      }

      case "zoomies": {
        velX = SPEED_RUN * 1.15 * (Math.random() < 0.5 ? -1 : 1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 1200 + Math.random() * 1000;
        break;
      }

      case "jump": {
        if (onGround) {
          velY = JUMP_V * 0.8;
          velX =
            (Math.random() < 0.5 ? -1 : 1) * (SPEED_WALK + Math.random() * 40);
          setDir(velX < 0);
          setAnim("jump", true);
          isJumping = true;
          onGround = false;
        }
        stateTimer = 3000;
        break;
      }

      case "stare": {
        velX = 0;
        setAnim(pickIdleVariant());
        stateTimer = 2500 + Math.random() * 3000;
        break;
      }

      case "spook": {
        const away = cursorX > feetX ? -1 : 1;
        velX = SPEED_RUN * away;
        setDir(velX < 0);
        
        setAnimLocked("scared", 300);
        addTimeout(() => {
          if (state === "spook") setAnim("run");
        }, 300);
        stateTimer = 1000 + Math.random() * 600;
        break;
      }

      case "climbtop": {
        const plats = envRects.filter(
          (r) =>
            r.isPlatform && r.el.isConnected && r.w > 80 && r.top < feetY - 30,
        );
        if (!plats.length) {
          go("sit");
          return;
        }
        const p = randFrom(plats);
        targetX = p.left + p.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 4000;
        break;
      }

      case "patrol": {
        velX = SPEED_WALK * 0.6 * (Math.random() < 0.5 ? -1 : 1);
        setDir(velX < 0);
        setAnim("walk");
        stateTimer = 3000 + Math.random() * 2000;
        break;
      }

      case "pounce": {
        const tgt2 = pickAttackRect();
        if (!tgt2) {
          go("sit");
          return;
        }
        attackEl = tgt2.el;
        const r2 = tgt2;
        targetX = r2.left + (r2.width || r2.w) * 0.4;
        if (onGround) {
          velY = JUMP_V * 0.5;
          velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
          setDir(velX < 0);
          setAnim("jump", true);
          isJumping = true;
          onGround = false;
        }
        stateTimer = 2500;
        break;
      }

      case "edgesit": {
        const plats = envRects.filter(
          (r) =>
            r.isPlatform &&
            r.el.isConnected &&
            r.w > 60 &&
            Math.abs(feetY - r.top) < 30,
        );
        if (!plats.length) {
          go("sit");
          return;
        }
        const p = randFrom(plats);
        
        targetX = Math.random() < 0.5 ? p.left + 20 : p.right - 20;
        velX = SPEED_WALK * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("walk");
        stateTimer = 5000;
        break;
      }

      case "headtilt": {
        velX = 0;
        setDir(cursorX < feetX);
        setAnim(pickIdleVariant());
        stateTimer = 2000 + Math.random() * 2000;
        break;
      }

      case "explore": {
        const targets = envRects.filter(
          (r) =>
            (r.isPlatform || r.isAttack) &&
            r.el.isConnected &&
            Math.abs(r.top - feetY) < 80,
        );
        if (!targets.length) {
          go("wander");
          return;
        }
        const t = randFrom(targets);
        attackEl = t.el;
        targetX = t.left + t.w / 2;
        velX = SPEED_WALK * 0.8 * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("walk");
        stateTimer = 4000;
        break;
      }

      case "loyal_follow": {
        velX = 0;
        setAnim(pickIdleVariant());
        stateTimer = 999999; 
        break;
      }

      case "deepsleep": {
        
        targetX = _vw - 60;
        velX = SPEED_WALK * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim(isSkeletonPet() ? "crumple" : "walk");
        stateTimer = 999999; 
        break;
      }

      case "peek_a_boo": {
        const isLeft = Math.random() < 0.5;
        
        targetX = getWallAttachX(isLeft ? "left" : "right");
        velX = SPEED_RUN * 1.2 * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 8000;
        break;
      }

      case "wall_sit": {
        const wsIsLeft = Math.random() < 0.5;
        targetX = getWallAttachX(wsIsLeft ? "left" : "right");
        velX = SPEED_RUN * 1.5 * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 10000;
        break;
      }

      case "ninja_climb": {
        velX = Math.random() < 0.5 ? -SPEED_RUN * 1.5 : SPEED_RUN * 1.5;
        setDir(velX < 0);
        setAnim("run", true);
        stateTimer = 5000;
        break;
      }

      case "wall_left": {
        globalRot = 90;
        setDir(true);
        applyTransform();
        setAnim("run", true);
        velY = -SPEED_RUN * 0.75; 
        velX = 0;
        attackPhase = "climb";

        const heightChoice = Math.random();
        if (heightChoice < 0.4) {
          
          targetX = _vh * (0.45 + Math.random() * 0.25);
        } else if (heightChoice < 0.8) {
          
          targetX = _vh * (0.25 + Math.random() * 0.2);
        } else {
          
          targetX = _vh * (0.15 + Math.random() * 0.1);
        }
        
        targetX = Math.max(_vh * 0.15, targetX);

        stateTimer = 8000 + Math.random() * 4000;
        break;
      }

      case "wall_right": {
        globalRot = -90;
        setDir(false);
        applyTransform();
        setAnim("run", true);
        velY = -SPEED_RUN * 0.75; 
        velX = 0;
        attackPhase = "climb";

        const heightChoice = Math.random();
        if (heightChoice < 0.4) {
          targetX = _vh * (0.45 + Math.random() * 0.25);
        } else if (heightChoice < 0.8) {
          targetX = _vh * (0.25 + Math.random() * 0.2);
        } else {
          targetX = _vh * (0.15 + Math.random() * 0.1);
        }
        
        targetX = Math.max(_vh * 0.15, targetX);

        stateTimer = 8000 + Math.random() * 4000;
        break;
      }

      case "wall_left_sit": {
        globalRot = 90;
        setDir(true);
        applyTransform();
        setAnim("run", true);
        velY = -SPEED_RUN * 0.8;
        velX = 0;

        targetX = Math.max(_vh * 0.15, _vh - 100 - Math.random() * (_vh * 0.5));
        stateTimer = 10000;
        break;
      }

      case "wall_right_sit": {
        globalRot = -90;
        setDir(false);
        applyTransform();
        setAnim("run", true);
        velY = -SPEED_RUN * 0.8;
        velX = 0;
        
        targetX = Math.max(_vh * 0.15, _vh - 100 - Math.random() * (_vh * 0.5));
        stateTimer = 10000;
        break;
      }

      case "logo_hunt": {
        if (isFoxPet()) {
          go("jump");
          return;
        }
        const logo = envRects.find((r) => r.isLogo);
        if (!logo) {
          go("sit");
          return;
        }
        attackEl = logo.el;
        targetX = logo.left + logo.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 6000;
        break;
      }

      case "chip_pounce": {
        if (isFoxPet()) {
          go("jump");
          return;
        }
        const chips = envRects.filter((r) => r.isChip);
        if (!chips.length) {
          go("wander");
          return;
        }
        const chip = randFrom(chips);
        attackEl = chip.el;
        targetX = chip.left + chip.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 5000;
        break;
      }

      case "search_paw": {
        if (isFoxPet()) {
          go("jump");
          return;
        }
        const search = envRects.find((r) => r.isSearch);
        if (!search) {
          go("sit");
          return;
        }
        attackEl = search.el;
        targetX = search.left + search.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = 5000;
        break;
      }

      case "ball_play": {
        
        if ((!targetBall || targetBall.exiting) && activeBalls.length > 0) {
          targetBall =
            activeBalls.find((ball) => !ball.exiting && !ball.removing) || null;
          if (!targetBall) {
            go("sit");
            return;
          }
          let closestDist = Math.abs(targetBall.x - feetX);
          for (let i = 1; i < activeBalls.length; i++) {
            if (activeBalls[i].exiting || activeBalls[i].removing) continue;
            const d = Math.abs(activeBalls[i].x - feetX);
            if (d < closestDist) {
              closestDist = d;
              targetBall = activeBalls[i];
            }
          }
        }
        if (!targetBall || targetBall.exiting || targetBall.removing) {
          targetBall = null;
          go("sit");
          return;
        }
        targetX = targetBall.x;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim("run");
        stateTimer = targetBall.manualSpawned ? 9000 : 6000;
        break;
      }

      case "portal_seek": {
        const portal = getQuickMenuPortalTarget();
        if (!portal) {
          go("sit");
          return;
        }
        targetX = portal.x;
        const dx = targetX - feetX;
        velX = Math.abs(dx) > 36 ? SPEED_RUN * (dx > 0 ? 1 : -1) : 0;
        setDir(dx < 0);
        setAnim(Math.abs(dx) > 36 ? "run" : chosenIdle);
        stateTimer = 7000;
        break;
      }

      case "chasefish": {
        setAnim("run");
        stateTimer = 30000; 
        stuckCheckTimer = 0;
        lastFishChaseX = feetX;
        break;
      }

      case "webbed_stun": {
        velX *= 0.1;
        setAnimLocked("scared", 3000);
        stateTimer = 3000;
        break;
      }
      case "chasing_bug": {
        setAnim("run");
        stateTimer = 15000;
        break;
      }

      case "eatfish": {
        if (!isFrogPet()) {
          velX = 0;
          velY = 0;
          onGround = true;
          isJumping = false;
        }
        if (isPigeonPet()) {
          setAnimLocked("eat", 1700);
          stateTimer = 1700;
        } else if (isFoxPet() && ANIMS.catch) {
          setAnimLocked("catch", 950);
          stateTimer = 1000;
        } else if (isSkeletonPet()) {
          setAnimLocked("clean1", 1200);
          stateTimer = 1200;
        } else {
          setAnimLocked("clean1", 2200); 
          stateTimer = 2200;
        }
        break;
      }
    }

    maybeSpeakForStateEntry(state);
  }

  let knockoffCheckAccum = 0;

  const _criticalStates = new Set([
    "eatfish",
    "breed_approach",
    "chasefish",
    "ball_play",
    "dragged",
    "stunned",
    "bat_dead",
    "wall_left",
    "wall_right",
    "ninja_climb",
    "deepsleep",
    "bubble_trap",
    "fight_seek",
    "fight_action",
  ]);
  const _sittingStates = new Set([
    "sit",
    "stare",
    "groom",
    "stretch",
    "pawplay",
    "headtilt",
  ]);
  const _restingStates = new Set([
    "sit",
    "stare",
    "headtilt",
    "edgesit",
    "groom",
  ]);
  const _sleepingStates = new Set(["nap", "sleep", "deepsleep"]);

  function tickNeeds(dt) {
    
    const isResting = _restingStates.has(state);
    const isSleeping = _sleepingStates.has(state);

    if (isResting) {
      catBoredom = Math.min(1.0, catBoredom + dt * 0.02);
      catEnergy = Math.min(1.0, catEnergy + dt * 0.015);
    } else if (isSleeping) {
      catBoredom = Math.max(0.0, catBoredom - dt * 0.01);
      catEnergy = Math.min(1.0, catEnergy + dt * 0.05);
    } else {
      catBoredom = Math.max(0.0, catBoredom - dt * 0.04);
      catEnergy = Math.max(0.0, catEnergy - dt * 0.02);
    }

    if (state === "eatfish") {
      catHunger = 0.0;
      catEnergy = Math.min(1.0, catEnergy + 0.4);
      catBoredom = 0.0;
    } else {
      catHunger = Math.min(1.0, catHunger + dt * 0.005);
    }
  }

  function updateState(dt) {
    if (isDragging) return;
    
    if (isClippyPet()) {
        tickNeeds(dt);
        const allowedStates = ["sit", "dragged", "bubble_trap", "pawplay", "headtilt", "eat", "searching"];
        if (!allowedStates.includes(state)) {
            go("sit");
            setAnim("idle1", true);
        } else if (state !== "sit" && state !== "dragged" && stateTimer <= 0) {
            if (!window.clippyWantsToExit) {
                window.clippyWantsToExit = true;
            }
        }
        
        if (isScrolling && state !== "dragged" && state !== "bubble_trap") {
            if (state !== "searching") {
                go("searching");
                stateTimer = 1500;
            } else {
                stateTimer = 1500;
                window.clippyWantsToExit = false;
            }
        }
        
        stateTimer -= dt * 1000;
        
        const now = Date.now();
        const afk = now - lastUserActivity;
        
        if (typeof window.clippyIdleLevel === "undefined") {
            window.clippyIdleLevel = 0;
        }

        if (afk < 5000 && window.clippyIdleLevel > 0) {
            window.clippyIdleLevel = 0;
            if (animLockTimer > 0 && state === "sit") {
                animLockTimer = 0; 
                setAnim("idle1", true);
            }
        }

        let targetFreq = 9999999;
        let pool = [];

        if (afk > 120000) {
            targetFreq = 60000 + Math.random() * 30000;
            pool = ["sleep", "fly"];
            window.clippyIdleLevel = 3;
        } else if (afk > 30000) {
            targetFreq = 35000 + Math.random() * 25000;
            pool = ["idle2", "clean1"];
            window.clippyIdleLevel = 2;
        } else if (afk > 5000) {
            targetFreq = 25000 + Math.random() * 20000;
            pool = ["idle1"];
            window.clippyIdleLevel = 1;
        }

        if (pool.length > 0 && now - lastClippyIdleAnim > targetFreq && animLockTimer <= 0) {
            lastClippyIdleAnim = now;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            let duration = 4000 + Math.random() * 2000;
            if (pick === "sleep" || pick === "fly") duration = 10000 + Math.random() * 5000;
            setAnimLocked(pick, duration); 
        }
        return;
    }

    stateTimer -= dt * 1000;
    tickNeeds(dt);
    if (bubbleTrap.active) return;

    if (isBatPet() && batCeilingHang) {
      return;
    }

    if (isBatPet() && state === "bat_dead") {
      if (stateTimer <= 0) {
        state = "wander";
        stateTimer = 4000;
        onGround = false;
        isJumping = true;
        beginFairyFlight();
      }
      return;
    }

    tickPetting(dt);
    if (isPurring) return; 

    if (!isDeepSleep && Date.now() - lastUserActivity > AFK_THRESHOLD) {
      if (state !== "deepsleep" && state !== "dragged") {
        isDeepSleep = true;
        go("deepsleep");
        return;
      }
    }

    if (isPigeonPet()) {
      pigeonPeckCooldown -= dt * 1000;
      if (
        onGround &&
        !isJumping &&
        IDLE_STATES.has(state) &&
        stateTimer <= 0 &&
        pigeonPeckCooldown <= 0 &&
        Math.random() < 0.1
      ) {
        pigeonPeckCooldown = 14000 + Math.random() * 28000;
        go("eatfish");
        return;
      }
    }

    if (PixelCatRuntime.instances.length > 1 && !_criticalStates.has(state)) {
      const otherPet = PixelCatRuntime.instances.find(c => c.isCompanion !== isCompanion);
      if (otherPet && !_criticalStates.has(otherPet.state) && !isDragging) {
        
        if (otherPet.state === "fight_seek" || otherPet.state === "fight_action") {
          if (state !== "fight_seek" && state !== "fight_action") {
            go(otherPet.state);
            return;
          }
        } 
        
        else if (state !== "fight_seek" && state !== "fight_action" && Math.random() < 0.0003) {
          go("fight_seek");
          return;
        }
      }
    }

    if (
      !isPigeonPet() &&
      !freePlayMode &&
      !unlockAll &&
      autoFishSpawnEnabled &&
      catHunger >= 1.0 &&
      fishSpawnTimer > 0 &&
      Math.random() < 0.01
    ) {
      fishSpawnTimer = 0; 
    }

    if (!isPigeonPet() && activeFishes.length > 0 && !_criticalStates.has(state)) {
      
      let closestFish = activeFishes[0];
      let closestDist = Math.abs(closestFish.x - feetX);
      for (let i = 1; i < activeFishes.length; i++) {
        const d = Math.abs(activeFishes[i].x - feetX);
        if (d < closestDist) {
          closestDist = d;
          closestFish = activeFishes[i];
        }
      }

      let interestLevel = 0.3; 

      if (catHunger > 0.7) interestLevel += 0.5;
      else if (catHunger > 0.4) interestLevel += 0.2;

      if (catEnergy < 0.3)
        interestLevel -= 0.3; 
      else if (catEnergy > 0.7) interestLevel += 0.2; 

      if (catBoredom > 0.6) interestLevel += 0.3;

      if (closestDist > 400) interestLevel -= 0.2;
      else if (closestDist < 200) interestLevel += 0.2;

      if (catEnergyLevel === "hyper") interestLevel += 0.2;
      else if (catEnergyLevel === "sleepy") interestLevel -= 0.3;

      const moodRoll = Math.random();

      let shouldChase = isFrogPet() || (moodRoll < interestLevel);

      const otherCat = PixelCatRuntime.instances.find((c) => c !== api);
      if (
        otherCat &&
        otherCat.state === "chasefish" &&
        otherCat.targetFish === closestFish
      ) {
        
        if (Math.random() < 0.7) {
          shouldChase = false;
          
          if (Math.random() < 0.3) {
            facingLeft = closestFish.x < feetX;
            applyTransform();
          }
        }
      }

      if (
        shouldChase &&
        (closestFish !== targetFish || state !== "chasefish")
      ) {
        targetFish = closestFish;
        go("chasefish");
        return;
      }
    }

    if (
      coinChaseTarget &&
      !coinChaseTarget.caught &&
      state !== "chasefish" &&
      !isDragging
    ) {
      if (state !== "coinchase") {
        go("coinchase");
        return;
      }
    } else if (
      state === "coinchase" &&
      (!coinChaseTarget || coinChaseTarget.caught)
    ) {
      go("sit");
      return;
    }

    if (
      !isPigeonPet() &&
      (spiderEnabled || activeSpiders.length > 0) &&
      activeSpiders.length > 0 &&
      !_criticalStates.has(state) &&
      state !== "chasefish" &&
      state !== "chasing_bug"
    ) {
      let closestSp = null;
      let closestDist = 999999;
      for (let i = 0; i < activeSpiders.length; i++) {
        const sp = activeSpiders[i];
        if (sp.dead) continue;
        const dy = sp.y - feetY;
        
        if (dy > -350) {
          const d = Math.hypot(sp.x - feetX, dy);
          if (d < closestDist) {
            closestDist = d;
            closestSp = sp;
          }
        }
      }

      if (closestSp && closestDist < 650) {
        targetSpider = closestSp;
        go("chasing_bug");
        return;
      }
    }

    if (
      !isPigeonPet() &&
      ballEnabled &&
      activeBalls.length > 0 &&
      !_criticalStates.has(state) &&
      state !== "chasefish"
    ) {
      
      let closestBall = activeBalls.find(
        (ball) => !ball.exiting && !ball.removing,
      );
      if (!closestBall) return;
      let closestDist = Math.abs(closestBall.x - feetX);
      for (let i = 1; i < activeBalls.length; i++) {
        if (activeBalls[i].exiting || activeBalls[i].removing) continue;
        const d = Math.abs(activeBalls[i].x - feetX);
        if (d < closestDist) {
          closestDist = d;
          closestBall = activeBalls[i];
        }
      }

      if (closestDist < 600) {
        
        let playfulness = 0.25; 

        if (catBoredom > 0.7) playfulness += 0.4;
        else if (catBoredom > 0.4) playfulness += 0.2;

        if (catEnergy < 0.3)
          playfulness -= 0.3; 
        else if (catEnergy > 0.7) playfulness += 0.3; 

        if (catHunger > 0.6) playfulness -= 0.3;

        if (closestDist > 400) playfulness -= 0.2;
        else if (closestDist < 250) playfulness += 0.2;

        if (catEnergyLevel === "hyper") playfulness += 0.3;
        else if (catEnergyLevel === "sleepy") playfulness -= 0.4;

        const moodRoll = Math.random();
        let shouldPlay = moodRoll < playfulness;

        const otherCat = PixelCatRuntime.instances.find((c) => c !== api);
        if (
          otherCat &&
          otherCat.state === "ball_play" &&
          otherCat.targetBall === closestBall
        ) {
          
          if (Math.random() < 0.5) {
            shouldPlay = false; 
          } else if (Math.random() < 0.7) {
            shouldPlay = true; 
          }
        }

        if (
          shouldPlay &&
          (closestBall !== targetBall || state !== "ball_play")
        ) {
          targetBall = closestBall;
          go("ball_play");
          return;
        }
      }
    }

    const _cdx = cursorX - feetX;
    const _cdy = cursorY - feetY;
    const cdist = Math.sqrt(_cdx * _cdx + _cdy * _cdy);

    if (_sittingStates.has(state) && velX === 0) {
      idleAccum += dt * 1000;
    } else {
      idleAccum = 0;
    }

    if (idleAccum > 10000 && state === "sit" && Math.random() < 0.002) {
      go("nap");
      return;
    }
    
    if (idleAccum > 5000 && state === "sit" && Math.random() < 0.003) {
      go("groom");
      return;
    }
    
    if (state === "sit" && onGround && animLockTimer <= 0) {
      if (isFrogPet()) {
        if (frogIdleCooldownCycles <= 0 && frogConsecutiveCroaks < 2 && Math.random() < 0.0008) {
          frogConsecutiveCroaks++;
          setAnimLocked("clean1", 1400);
          addTimeout(() => {
            if (state === "sit") setAnim("idle1");
          }, 1400);
        }
      } else if (Math.random() < 0.0005) {
        setAnimLocked("paw", 1200);
        addTimeout(() => {
          if (state === "sit") setAnim(chosenIdle);
        }, 1200);
      }
    }

    switch (state) {
      
      case "wander": {
        if (clampWalls()) {
          setAnimLocked("scared", 500);
          state = "stunned";
          stateTimer = 500 + Math.random() * 300;
          velX *= 0.1;
          return;
        }
        if (onGround && !isJumping && Math.abs(velX) > 10) {
          const dir = velX > 0 ? 1 : -1;
          if (isNearPlatformEdge(feetX, dir)) {
            
            if (isPigeonPet() && pigeonGroundedByUser) {
              velX = -velX;
              setDir(velX < 0);
            } else {
              const adj = findAdjacentPlatform(feetX, dir);
              if (adj) {
                
                const jumpPower = 0.6 + Math.random() * 0.5;
                const horizPower = 0.7 + Math.random() * 0.6;
                velY = JUMP_V * jumpPower;
                velX = dir * SPEED_RUN * horizPower;
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
              } else {
                
                velX = -velX;
                setDir(velX < 0);
              }
            }
          }
        }
        if (cdist < 160 && Math.random() < 0.003) {
          go(Math.random() < 0.5 ? "chase" : "spook");
          return;
        }
        if (envRects.length && Math.random() < 0.0006) {
          go("climbtop");
          return;
        }
        if (stateTimer <= 0) go(null, ["wander"]);
        break;
      }
      
      case "fight_seek": {
        const otherPet = PixelCatRuntime.instances.find(c => c.isCompanion !== isCompanion);
        if (!otherPet || otherPet.state === "dragged" || otherPet.state === "hidden") {
          go("sit");
          return;
        }
        
        targetX = otherPet.feetX;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);

        if (Math.abs(targetX - feetX) < 50 && Math.abs(otherPet.feetY - feetY) < 40) {
          go("fight_action");
          return;
        }
        if (stateTimer <= 0) go("sit");
        break;
      }

      case "fight_action": {
        velX = 0;
        const otherPet = PixelCatRuntime.instances.find(c => c.isCompanion !== isCompanion);
        if (!otherPet) {
          go("sit");
          return;
        }
        setDir(otherPet.feetX < feetX);
        
        if (animLockTimer <= 0 && fightAnimCount < 3) {
          if (stateTimer < 3000) { 
            const attackAnim = isSkeletonPet() ? "toss" : "paw";
            setAnimLocked(attackAnim, 600);
            if (Math.random() < 0.7) {
              const dx = otherPet.feetX - feetX;
              spawnDust(feetX + (dx > 0 ? 25 : -25), feetY - 15);
              if (typeof otherPet.pushBy === "function") {
                otherPet.pushBy(dx > 0 ? 80 : -80);
              }
            }
            fightAnimCount++;
          }
        }
        
        if (stateTimer <= 0) go("sit");
        break;
      }

      case "zoomies": {
        if (clampWalls()) {
          setAnimLocked("scared", 500);
          state = "stunned";
          stateTimer = 500 + Math.random() * 300;
          velX *= 0.1;
          return;
        }
        if (stateTimer <= 0) go(null, ["zoomies"]);
        break;
      }

      case "sit":
      case "stare":
      case "headtilt":
      case "groom":
      case "stretch":
      case "pawplay": {
        if (onGround) {
          velX = 0;
          if (cdist < 220) setDir(cursorX < feetX);
        }
        if (isFrogPet() && onGround) {
          const cursorAbove = Math.abs(cursorX - feetX) < 130 && cursorY < feetY - 15;
          if (cursorAbove) {
            setAnim("idle2", true);
          } else if (animLockTimer <= 0) {
            if (cdist < 100 && Math.random() < 0.005) {
              setAnimLocked("paw", 1800);
            } else if (curAnim === ANIMS.idle2) {
              setAnim("idle1");
            } else if (curAnim !== ANIMS.paw && curAnim !== ANIMS.idle1) {
              setAnim("idle1", true);
            }
          }
        } else if (!isFrogPet() && isSkeletonPet() && state === "pawplay" && animLockTimer <= 0) {
          setAnim("paw", true);
        }
        if (stateTimer <= 0) go(null, [state]);
        break;
      }

      case "nap": {
        velX = 0;
        if (cdist < 100 && Math.random() < 0.01) {
          state = "stunned";
          stateTimer = 600;
          setAnimLocked("scared", 600);
          addTimeout(() => go("stretch"), 600);
          return;
        }
        if (stateTimer <= 0) go("stretch");
        break;
      }

      case "watchvideo": {
        if (isFoxPet() && FOX_DISABLED_STATES.has(state)) {
          go("jump");
          return;
        }
        if (!attackEl || !attackEl.isConnected) {
          go("sit");
          return;
        }
        const pr = getCachedRect(attackEl);
        const txp = pr.left + (pr.width || pr.w) / 2;
        const dx = txp - feetX;
        if (Math.abs(dx) < 60) {
          velX = 0;
          setDir(txp < feetX);
          setAnim(chosenIdle);
        } else {
          velX = SPEED_WALK * (dx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("walk");
        }
        if (stateTimer <= 0) go(null, ["watchvideo"]);
        break;
      }

      case "spook": {
        if (clampWalls()) {
          setAnimLocked("scared", 400);
          state = "stunned";
          stateTimer = 400;
          velX *= 0.1;
          return;
        }
        if (stateTimer <= 0) {
          velX = 0;
          go("sit");
        }
        break;
      }

      case "stunned": {
        velX *= 0.9;
        if (isSkeletonPet() && animLockTimer <= 0) setAnim("hurt", true);
        if (Math.abs(velX) < 1) velX = 0;
        if (stateTimer <= 0) {
          velX = 0;
          if (targetSpider && !targetSpider.dead && activeSpiders.includes(targetSpider)) {
            go("chasing_bug");
          } else {
            go("sit");
          }
        }
        break;
      }

      case "chase": {
        if (stateTimer <= 0) {
          go(null, ["chase"]);
          return;
        }
        const cdx = cursorX - feetX;
        const cdy = cursorY - feetY; 
        const dist = Math.abs(cdx);
        const vdist = Math.abs(cdy);

        if (dist < 50 && vdist < 70) {
          velX = 0;
          if (isFrogPet()) {
            if (cdy < -15) {
              setAnim("idle2", true);
            } else if (frogIdleCooldownCycles <= 0 && frogConsecutiveCroaks < 2 && Math.random() < 0.22) {
              frogConsecutiveCroaks++;
              setAnimLocked("clean1", 1400);
            } else {
              setAnim("idle1", true);
            }
          } else if (onGround) {
            setAnimLocked("paw", 1200);
          }
          state = "pawplay";
          stateTimer = 1500;
          break;
        }
        if (attackPhase === "pursue") {
          const cursorDirectlyAbove = isFrogPet() ? (dist < 130 && cdy < -15) : (dist < 45 && cdy < -60);

          if (!cursorDirectlyAbove && onGround && !isJumping) {

            let chaseDir = facingLeft ? -1 : 1;
            if (dist > 40) {
              chaseDir = cdx > 0 ? 1 : -1;
            }

            if (isNearPlatformEdge(feetX, chaseDir)) {
              const adj = findAdjacentPlatform(feetX, chaseDir);
              if (adj) {
                velY = JUMP_V * (0.5 + Math.random() * 0.3);
                velX = chaseDir * SPEED_RUN * (0.9 + Math.random() * 0.4);
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
                break;
              } else if (cdy > 30) {
                velX = chaseDir * SPEED_RUN;
                velY = 50;
                onGround = false;
                isJumping = true;
                setAnim("jump", true);
                break;
              } else {
                
                velX = 0;
                setDir(cdx < 0);
              }
            } else {
              
              const runThresh = (curAnim && (curAnim === ANIMS.run || curAnim.name === "run")) ? 150 : 170;
              const spd = dist > runThresh ? SPEED_RUN : SPEED_WALK;
              const animName = isFrogPet()
                ? (dist > runThresh ? "run" : "walk")  
                : (dist > runThresh ? "run" : "walk");
              velX = chaseDir * spd;
              setDir(velX < 0);
              setAnim(animName);
            }
          } else if (cursorDirectlyAbove && onGround) {
            
            velX = 0;
            setDir(cursorX < feetX);
            if (animLockTimer <= 0) {
              
              if (isFrogPet()) setAnim("idle2");
              else setAnim(chosenIdle);
            }
          }

          if (cdy < -80 && onGround) {
            chaseStuckTimer += dt;
          } else {
            chaseStuckTimer = Math.max(0, chaseStuckTimer - dt * 0.5);
          }

          const thinkThreshold = cursorDirectlyAbove
            ? 0.8
            : 1.5 + Math.random() * 1.0;
          if (chaseStuckTimer > thinkThreshold) {
            attackPhase = "thinking";
            chaseStuckTimer = 0;
            velX = 0;
            setDir(cursorX < feetX);
            setAnim(pickIdleVariant());
          }
          break;
        }

        if (attackPhase === "thinking") {
          if (onGround) {
            velX = 0;
            setDir(cursorX < feetX);
          }
          chaseStuckTimer += dt;

          if (chaseStuckTimer > 0.4 && animLockTimer <= 0) {
            if (isFrogPet()) {
              if (cursorY < feetY - 15) {
                setAnim("idle2", true);
              } else if (Math.random() < 0.05) {
                setAnimLocked("paw", 1800);
              }
            } else {
              if (Math.random() < 0.02) setAnimLocked("paw", 600);
            }
          }

          if (chaseStuckTimer > 0.8 + Math.random() * 0.7) {
            const roll = Math.random();

            if (roll < 0.45) {
              
              attackPhase = "wall_approach";
              const nearestWall = feetX < _vw / 2 ? "left" : "right";
              targetX = nearestWall === "left" ? 15 : _vw - 15;
              velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
              setDir(velX < 0);
              setAnim("run");
            } else if (roll < 0.8) {
              
              let bestPlat = null,
                bestScore = Infinity;
              for (let i = 0; i < envRects.length; i++) {
                const r = envRects[i];
                if (!r.isPlatform || !r.el.isConnected) continue;
                if (r.top >= feetY - 15) continue; 
                const px = r.left + r.w / 2;
                const d = Math.abs(px - feetX);
                if (d > 250) continue; 
                
                const towardCursor =
                  Math.abs(px - cursorX) < Math.abs(feetX - cursorX) ? -50 : 0;
                const score = d + towardCursor;
                if (score < bestScore) {
                  bestScore = score;
                  bestPlat = r;
                }
              }
              if (bestPlat) {
                attackPhase = "hop_up";
                targetX = bestPlat.left + bestPlat.w / 2;
                velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
                setDir(velX < 0);
                setAnim("run");
              } else {
                
                attackPhase = "wall_approach";
                const nearestWall = feetX < _vw / 2 ? "left" : "right";
                targetX = nearestWall === "left" ? 15 : _vw - 15;
                velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
                setDir(velX < 0);
                setAnim("run");
              }
            } else {
              
              attackPhase = "pursue";
              go(Math.random() < 0.5 ? "sit" : "groom");
              return;
            }
            chaseStuckTimer = 0;
          }
          break;
        }

        if (attackPhase === "wall_approach") {
          
          const wallDx = targetX - feetX;
          if (Math.abs(wallDx) < 25) {
            
            if (targetX < _vw / 2) {
              feetX = getWallAttachX("left");
              go("wall_left");
            } else {
              feetX = getWallAttachX("right");
              go("wall_right");
            }
          } else {
            
            velX = (wallDx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0);
            setAnim("run");
            
            const wallTouch = getSideWallMargin();
            if (feetX <= wallTouch || feetX >= _vw - wallTouch) {
              if (feetX <= wallTouch) {
                feetX = getWallAttachX("left");
                go("wall_left");
              } else {
                feetX = getWallAttachX("right");
                go("wall_right");
              }
            }
          }
          break;
        }

        if (attackPhase === "hop_up") {
          clampWalls();
          const hopDx = targetX - feetX;
          if (Math.abs(hopDx) < 60 && onGround && !isJumping) {
            
            const jumpPow = 0.7 + Math.random() * 0.4;
            const horizPow = 0.8 + Math.random() * 0.5;
            velY = JUMP_V * jumpPow;
            velX = (hopDx > 0 ? 1 : -1) * SPEED_RUN * horizPow;
            setDir(velX < 0);
            setAnim("jump", true);
            isJumping = true;
            onGround = false;
            attackPhase = "traverse"; 
          } else if (onGround) {
            velX = (hopDx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0);
            setAnim("run");
          }
          break;
        }

        if (attackPhase === "traverse") {
          if (onGround && !isJumping) {
            
            if (dist < 50) {
              
              if (vdist < 80) {
                
                velX = 0;
                setAnimLocked("paw", 1200);
                state = "pawplay";
                stateTimer = 1500;
                break;
              } else if (cdy < -60) {
                
                attackPhase = "thinking";
                chaseStuckTimer = 0;
                break;
              } else {
                
                velX = (cdx > 0 ? 1 : -1) * SPEED_WALK;
                setDir(velX < 0);
                setAnim("walk");
              }
            } else {
              
              const tDir = cdx > 0 ? 1 : -1;
              if (isNearPlatformEdge(feetX, tDir)) {
                const adj = findAdjacentPlatform(feetX, tDir);
                if (adj) {
                  
                  velY = JUMP_V * (0.4 + Math.random() * 0.3);
                  velX = tDir * SPEED_RUN * (0.8 + Math.random() * 0.4);
                  setAnim("jump", true);
                  isJumping = true;
                  onGround = false;
                  break;
                } else {
                  
                  velX = tDir * SPEED_RUN * 0.8;
                  velY = 30;
                  onGround = false;
                  isJumping = true;
                  setAnim("jump", true);
                  break;
                }
              }
              
              const tSpd = dist > 150 ? SPEED_RUN : SPEED_WALK;
              velX = tDir * tSpd;
              setDir(velX < 0);
              setAnim(dist > 150 ? "run" : "walk");
            }
          }
          
          if (onGround && feetY >= _vh - 20) {
            attackPhase = "pursue";
          }
          break;
        }

        break;
      }

      case "attack": {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          go(null, ["attack"]);
          return;
        }
        clampWalls();
        if (attackPhase === "stalk") {
          const lr = getCachedRect(attackEl);
          const dx = lr.left + (lr.width || lr.w) * 0.4 - feetX;
          if (Math.abs(dx) < 120) {
            attackPhase = "move";
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN * 1.1;
            setDir(velX < 0);
            setAnim("run");
          }
        } else if (attackPhase === "move") {
          const lr = getCachedRect(attackEl);
          const dx = lr.left + (lr.width || lr.w) * 0.4 - feetX;
          if (Math.abs(dx) < 50 && Math.random() < 0.08) {
            velX = 0;
            setAnimLocked("scared", 700);
            state = "stunned";
            stateTimer = 700;
            return;
          }
          if (Math.abs(dx) < 50) {
            attackPhase = "strike";
            velX = 0;
            setAnimLocked("paw", 1200);
            attackHitTimer = 1200;
            smashElement(attackEl);

            try {
              const title = (attackEl.textContent || "").toLowerCase();
              if (
                title.includes("cat") ||
                title.includes("kitty") ||
                title.includes("pixel")
              ) {
                addTimeout(
                  () => spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5),
                  400,
                );
              } else if (title.includes("fish") || title.includes("treat")) {
                catHunger = Math.max(0, catHunger - 0.1);
                addTimeout(
                  () => spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5),
                  400,
                );
              } else if (title.includes("dog") || title.includes("scary")) {
                addTimeout(() => setAnimLocked("scared", 800), 1200);
              }
            } catch (e) {}
          } else {
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0);
            setAnim("run");
          }
        } else {
          attackHitTimer -= dt * 1000;
          if (attackHitTimer <= 0) {
            go(Math.random() < 0.3 ? "attack" : null, ["attack"]);
          }
        }
        break;
      }

      case "knockoff": {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          go(null, ["knockoff"]);
          return;
        }
        clampWalls();
        const tgX = targetX; 
        const dx = tgX - feetX;

        if (attackPhase === "approach") {
          if (Math.abs(dx) < 80 && onGround && !isJumping) {
            attackPhase = "jumpstrike";
            velY = JUMP_V * 0.6; 
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN * 1.5; 
            setAnim("jump", true);
            isJumping = true;
            onGround = false;
          } else if (onGround && Math.abs(dx) >= 80) {
            velX = SPEED_RUN * (dx > 0 ? 1 : -1);
            setDir(velX < 0);
            setAnim("run");
          }
        } else if (attackPhase === "jumpstrike") {
          if (Math.abs(dx) < 30) {
            attackPhase = "bouncing";
            velX = -velX * 0.5; 
            velY = JUMP_V * 0.3; 
            setDir(velX > 0); 
            setAnimLocked("scared", 800); 

            const pushDir = dx > 0 ? 1 : -1;
            attackEl.style.transition =
              "transform 0.2s cubic-bezier(.18,.89,.32,1.2)";
            attackEl.style.transform = `translateX(${pushDir * 12}px) rotate(${pushDir * 2}deg)`;
            const el = attackEl;
            addTimeout(() => {
              if (el.isConnected) {
                el.style.transition = "transform 0.6s ease";
                el.style.transform = "";
              }
            }, 500);
          }
        } else if (attackPhase === "bouncing") {
          if (onGround) {
            velX = 0;
            go("sit");
          }
        }
        break;
      }

      case "ui_mischief": {
        if (isFoxPet()) {
          go("jump");
          return;
        }
        if (
          !isAggressiveMode ||
          !uiTarget ||
          !uiTarget.el ||
          !uiTarget.el.isConnected
        ) {
          uiTarget = null;
          uiWallTask = null;
          go("sit");
          return;
        }

        const rr = getCachedRect(uiTarget.el);
        const tx = rr.left + rr.w / 2;
        const dx = tx - feetX;

        if (attackPhase === "approach") {
          if (Math.abs(dx) < 42) {
            velX = 0;
            setDir(dx < 0);
            setAnimLocked("paw", 850);
            attackPhase = "tap";
            attackHitTimer = 850;
            if (
              (uiTarget.type === "like" || uiTarget.type === "dislike") &&
              Math.random() < 0.7
            ) {
              triggerUiClick(uiTarget.el);
              earnXP(0.2); 
            }
          } else {
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0);
            setAnim("run");
          }
        } else {
          attackHitTimer -= dt * 1000;
          if (attackHitTimer <= 0 || stateTimer <= 0) {
            uiTarget = null;
            uiWallTask = null;
            go("sit");
          }
        }
        break;
      }

      case "search_paw":
      case "ball_play": {
        if (state === "ball_play") {
          if (
            !targetBall ||
            targetBall.exiting ||
            targetBall.removing ||
            !activeBalls.includes(targetBall)
          ) {
            targetBall = null;
            go("sit");
            return;
          }
          if (isUserDrivenTarget(targetBall)) {
            refreshUserDrivenChaseTimer(
              targetBall,
              targetBall.isHeld ? 22000 : 16000,
            );
          }

          if (!targetBall.manualSpawned && Math.random() < 0.002) {
            
            let continueInterest = 0.65; 

            if (catEnergy < 0.3) continueInterest -= 0.4;

            if (stateTimer < 3000) continueInterest -= 0.15;

            const distToBall = Math.sqrt(
              (targetBall.x - feetX) ** 2 + (targetBall.y - feetY) ** 2,
            );
            if (distToBall > 600) continueInterest -= 0.3;

            if (catEnergyLevel === "sleepy") continueInterest -= 0.4;

            if (catEnergyLevel === "hyper") continueInterest += 0.2;

            if (catBoredom > 0.7) continueInterest += 0.2;

            if (Math.random() > continueInterest) {
              
              targetBall = null;
              const randomAction = Math.random();
              if (randomAction < 0.25) {
                go("sit"); 
              } else if (randomAction < 0.5) {
                go("groom"); 
              } else if (randomAction < 0.75) {
                go("wander"); 
              } else {
                go("nap"); 
              }
              break;
            }
          }

          const otherCat = PixelCatRuntime.instances.find((c) => c !== api);
          const isVolleyballMode =
            otherCat &&
            otherCat.state === "ball_play" &&
            otherCat.targetBall === targetBall;

          const bdx = targetBall.x - feetX;
          const bdy = targetBall.y - feetY;
          const distToBall = Math.sqrt(bdx * bdx + bdy * bdy);
          const ballReachX = 60 + (sizeMultiplier - 1) * 28;
          const ballReachY = 80 + (sizeMultiplier - 1) * 34;

          if (moveToDropEdgeForLowerTarget(targetBall.x, targetBall.y, 120)) {
            ballStuckCheckTimer = 0;
            stateTimer = Math.max(stateTimer, 2500);
            break;
          }

          if (isVolleyballMode) {

            const cat1 = PixelCatRuntime.instances[0];
            const cat2 = PixelCatRuntime.instances[1];

            let mySide, myCourtPosition, otherCourtPosition;
            if (api === cat1) {
              mySide = "left";
              myCourtPosition = _vw * 0.25; 
              otherCourtPosition = _vw * 0.75; 
            } else {
              mySide = "right";
              myCourtPosition = _vw * 0.75;
              otherCourtPosition = _vw * 0.25;
            }

            const courtCenter = _vw / 2;
            const courtWidth = _vw * 0.9; 
            const leftBoundary = (_vw - courtWidth) / 2;
            const rightBoundary = _vw - leftBoundary;
            
            const myHardMin =
              mySide === "left" ? leftBoundary + 30 : courtCenter + 80;
            const myHardMax =
              mySide === "left" ? courtCenter - 80 : rightBoundary - 30;

            const ballSide = targetBall.x < courtCenter ? "left" : "right";
            const ballInMyCourt = ballSide === mySide;

            if (ballInMyCourt) {
              
              if (distToBall < ballReachX + 20) {
                velX = 0;

                const ballHeight = _vh - targetBall.y;
                const canHit =
                  ballHeight < 150 || (targetBall.vy > 0 && ballHeight < 250);

                if (canHit && animLockTimer <= 0) {
                  
                  const useAcrobatic =
                    !isFoxPet() && Math.random() < 0.35 && catEnergy > 0.4;

                  if (useAcrobatic && onGround) {
                    
                    setDir(targetBall.x < feetX); 
                    velY = JUMP_V * 0.85;
                    isJumping = true;
                    setAnimLocked("jump", 450);
                    addTimeout(() => {
                      
                      if (
                        targetBall &&
                        !targetBall.exiting &&
                        Math.abs(targetBall.x - feetX) < ballReachX + 30 &&
                        Math.abs(targetBall.y - feetY) < ballReachY + 40
                      ) {
                        setDir(targetBall.x < feetX); 
                        
                        const hitDir = mySide === "left" ? 1 : -1;
                        const powerMultiplier = 1.2 + Math.random() * 0.3;
                        if (
                          hitBall(
                            targetBall,
                            hitDir *
                              (450 + Math.random() * 250) *
                              powerMultiplier,
                            -350 - Math.random() * 150,
                          )
                        ) {
                          rewardBallHit();
                          clearFoxPreAction(targetBall, "ball");
                        }
                        spawnDust(feetX, feetY);
                        catEnergy = Math.max(0, catEnergy - 0.02); 
                      }
                    }, 220);
                  } else if (onGround) {

                    if (
                      Math.abs(targetBall.x - feetX) < ballReachX + 25 &&
                      Math.abs(targetBall.y - feetY) < ballReachY
                    ) {
                      if (
                        isFoxPet() &&
                        !isFoxPreActionReady(targetBall, "ball")
                      ) {
                        beginFoxPreAction(targetBall, "ball", {
                          delayMs: 180,
                          lockMs: 380,
                          extendStateTimer: 900,
                        });
                        break;
                      }
                      setDir(targetBall.x < feetX); 
                      setAnimLocked(
                        isFoxPet() && ANIMS.catch ? "catch" : "paw",
                        isFoxPet() ? 760 : 650,
                      );
                      const hitDir = mySide === "left" ? 1 : -1;

                      const targetDist = Math.abs(otherCourtPosition - feetX);
                      const powerFactor = Math.min(1.2, targetDist / 400);

                      if (
                        hitBall(
                          targetBall,
                          hitDir * (380 + Math.random() * 320) * powerFactor,
                          -280 - Math.random() * 220,
                        )
                      ) {
                        rewardBallHit();
                        clearFoxPreAction(targetBall, "ball");
                      }
                      spawnDust(feetX, feetY);
                      catEnergy = Math.max(0, catEnergy - 0.01);
                    }
                  }
                } else {
                  
                  setDir(targetBall.x < feetX);
                  if (Math.random() < 0.03) {
                    setAnimLocked("paw", 300); 
                  } else {
                    setAnim(chosenIdle);
                  }
                }
              } else {
                
                const interceptX = targetBall.x + targetBall.vx * 0.25; 

                const targetPos = Math.max(
                  myHardMin,
                  Math.min(myHardMax, interceptX),
                );
                const finalDx = targetPos - feetX;

                velX = SPEED_RUN * 1.1 * (finalDx > 0 ? 1 : -1);
                setDir(velX < 0);
                setAnim("run");
              }
            } else {
              
              let waitPosition = myCourtPosition;

              if (Math.abs(targetBall.vx) > 300) {
                const netOffset = mySide === "left" ? 70 : -70;
                waitPosition = courtCenter + netOffset;
              }

              waitPosition = Math.max(
                myHardMin,
                Math.min(myHardMax, waitPosition),
              );

              const dx = waitPosition - feetX;

              if (Math.abs(dx) > 40) {
                
                velX = SPEED_WALK * 1.2 * (dx > 0 ? 1 : -1);
                setDir(velX < 0);
                setAnim("walk");
              } else {
                
                velX = 0;
                setDir(targetBall.x < feetX); 

                if (Math.random() < 0.025) {
                  const readyAnim = Math.random();
                  if (readyAnim < 0.4) {
                    setAnimLocked("paw", 350); 
                  } else if (readyAnim < 0.7) {
                    setAnimLocked("clean2", 400); 
                  } else {
                    
                    if (
                      !isFoxPet() &&
                      onGround &&
                      Math.abs(targetBall.vx) > 350
                    ) {
                      velY = JUMP_V * 0.3;
                      isJumping = true;
                    }
                  }
                } else {
                  setAnim(chosenIdle);
                }
              }
            }
          } else {
            
            if (distToBall < ballReachX) {
              velX = 0;

              if (isFoxPet()) {
                if (!isFoxPreActionReady(targetBall, "ball")) {
                  beginFoxPreAction(targetBall, "ball", {
                    delayMs: 180,
                    lockMs: 380,
                    extendStateTimer: 900,
                  });
                  break;
                }
                if (
                  animLockTimer <= 0 ||
                  curAnim === ANIMS.catch ||
                  curAnim === ANIMS.jump
                ) {
                  const liveBdx = targetBall.x - feetX;
                  setDir(liveBdx < 0);
                  setAnimLocked(ANIMS.catch ? "catch" : "paw", 760);
                  velX = 0;
                  if (
                    hitBall(
                      targetBall,
                      (liveBdx > 0 ? 1 : -1) * (420 + Math.random() * 360),
                      -320 - Math.random() * 240,
                    )
                  ) {
                    rewardBallHit();
                    clearFoxPreAction(targetBall, "ball");
                  }
                  spawnDust(feetX, feetY);
                }
                
              } else if (
                Math.random() < 0.2 &&
                onGround &&
                animLockTimer <= 0
              ) {
                setDir(bdx < 0); 
                velY = JUMP_V * 0.7;
                isJumping = true;
                setAnimLocked("jump", 400);
                addTimeout(() => {
                  if (
                    targetBall &&
                    !targetBall.exiting &&
                    Math.abs(targetBall.x - feetX) < ballReachX
                  ) {
                    const liveBdx = targetBall.x - feetX;
                    setDir(liveBdx < 0); 
                    if (
                      hitBall(
                        targetBall,
                        (liveBdx > 0 ? 1 : -1) * (400 + Math.random() * 400),
                        -300 - Math.random() * 250,
                      )
                    ) {
                      rewardBallHit();
                    }
                    spawnDust(feetX, feetY);
                  }
                }, 200);
              } else if (animLockTimer <= 0) {
                setDir(bdx < 0); 
                setAnimLocked("paw", 600);
                velX = 0; 
                if (
                  hitBall(
                    targetBall,
                    (bdx > 0 ? 1 : -1) * (350 + Math.random() * 400),
                    -250 - Math.random() * 300,
                  )
                ) {
                  rewardBallHit();
                }
                spawnDust(feetX, feetY);
              }
            } else {
              
              if (animLockTimer <= 0) {
                velX = SPEED_RUN * (bdx > 0 ? 1 : -1);
                setDir(velX < 0);
                setAnim("run");
              }
            }
          }

          ballStuckCheckTimer += dt * 1000;
          if (ballStuckCheckTimer > 1200) {
            const moved = Math.abs(feetX - lastBallChaseX);
            if (
              moved < 5 &&
              onGround &&
              !isJumping &&
              targetBall &&
              !targetBall.exiting
            ) {
              if (targetBall.y - feetY > 35) {
                const plat = getCurrentPlatform();
                if (plat) {
                  const leftDist = feetX - plat.left;
                  const rightDist = plat.right - feetX;
                  startChaseDropThrough(leftDist <= rightDist ? -1 : 1);
                }
              } else if (Math.abs(targetBall.x - feetX) > 25) {
                const recoverDir = targetBall.x > feetX ? 1 : -1;
                velX = recoverDir * SPEED_RUN;
                setDir(recoverDir < 0);
                if (isFoxPet()) {
                  setAnim(
                    ANIMS.catch &&
                      Math.abs(targetBall.x - feetX) < ballReachX + 20
                      ? "catch"
                      : "run",
                  );
                } else {
                  velY = JUMP_V * 0.35;
                  onGround = false;
                  isJumping = true;
                  setAnim("jump", true);
                }
              }
            }
            lastBallChaseX = feetX;
            ballStuckCheckTimer = 0;
          }

          if (stateTimer <= 0) {
            if (
              isUserDrivenTarget(targetBall) &&
              targetBall &&
              !targetBall.exiting &&
              !targetBall.removing
            ) {
              stateTimer = 12000;
            } else {
              go("sit");
            }
          }
          break;
        }

        if (!attackEl || !attackEl.isConnected) {
          go("sit");
          return;
        }
        
        const r = getCachedRect(attackEl);
        const tx = r.left + r.w / 2;
        const dx = tx - feetX;

        if (Math.abs(dx) < 50) {
          velX = 0;
          setDir(dx < 0);
          if (animLockTimer <= 0) {
            setAnimLocked("paw", 1000);
            if (state === "logo_hunt") {
              if (Math.random() < 0.05)
                spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
            } else if (state === "chip_pounce" && Math.random() < 0.3) {
              triggerUiClick(attackEl);
              spawnDust(feetX, feetY);
            }
          }
          if (stateTimer <= 0) go("sit");
        } else {
          velX = SPEED_RUN * (dx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("run");
        }
        break;
      }

      case "hide": {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          velX = 0;
          go(null, ["hide"]);
          return;
        }
        clampWalls();
        const hideDx = targetX - feetX;
        if (Math.abs(hideDx) < 40) {
          velX = 0;
          const cardZ = parseInt(getComputedStyle(attackEl).zIndex) || 0;
          catEl.style.zIndex = String(Math.max(cardZ - 1, 0));
          state = "hidden";
          stateTimer = 2500 + Math.random() * 2000;
          setAnim(chosenIdle);
        } else {
          
          velX = (hideDx > 0 ? 1 : -1) * SPEED_RUN;
          setDir(velX < 0);
          setAnim("run");
        }
        break;
      }

      case "hidden": {
        if (Math.random() < 0.012) {
          const newDir = !facingLeft;
          setDir(newDir);
          feetX += newDir ? -5 : 5;
        }
        if (stateTimer <= 0) {
          catEl.style.zIndex = "9999999";
          catEl.style.opacity = "1";
          go(Math.random() < 0.5 ? "attack" : "jump");
        }
        break;
      }

      case "jump": {
        clampWalls();
        if (onGround && stateTimer < 2800) {
          isJumping = false;
          go(null, ["jump"]);
        }
        break;
      }

      case "climbtop": {
        if (stateTimer <= 0 && onGround) {
          go(null, ["climbtop"]);
          return;
        }
        clampWalls();
        const dx2 = targetX - feetX;
        if (Math.abs(dx2) < 85 && onGround && !isJumping) {
          velY = JUMP_V * 0.75;
          velX = (dx2 > 0 ? 1 : -1) * (SPEED_WALK + 20);
          setAnim("jump", true);
          isJumping = true;
          onGround = false;
          stateTimer = -1;
        } else if (!isJumping) {
          setDir(velX < 0);
          setAnim("run");
        }
        break;
      }

      case "patrol": {
        clampWalls();
        if (onGround && !isJumping && Math.abs(velX) > 5) {
          const dir = velX > 0 ? 1 : -1;
          if (isNearPlatformEdge(feetX, dir)) {
            const adj = findAdjacentPlatform(feetX, dir);
            if (adj) {
              
              const jumpPower = 0.5 + Math.random() * 0.4;
              const horizPower = 0.8 + Math.random() * 0.5;
              velY = JUMP_V * jumpPower;
              velX = dir * SPEED_WALK * horizPower * 1.5;
              setAnim("jump", true);
              isJumping = true;
              onGround = false;
            } else {
              
              velX = -velX;
              setDir(velX < 0);
            }
          }
        }
        if (stateTimer <= 0) go(null, ["patrol"]);
        break;
      }

      case "pounce": {
        clampWalls();
        if (stateTimer <= 0) {
          isJumping = false;
          go("sit");
          return;
        }
        if (onGround && !isJumping && attackEl && attackEl.isConnected) {
          const pr = getCachedRect(attackEl);
          if (Math.abs(pr.left + (pr.width || pr.w) / 2 - feetX) < 140) {
            velX = 0;
            setAnimLocked("paw", 1000);
            smashElement(attackEl);
            state = "sit";
            stateTimer = 1200;
          } else {
            go("sit");
          }
          return;
        }
        if (onGround && !attackEl) go("sit");
        break;
      }

      case "edgesit": {
        if (stateTimer <= 0) {
          go(null, ["edgesit"]);
          return;
        }
        clampWalls();
        const edgeDx = targetX - feetX;
        if (Math.abs(edgeDx) < 15) {
          velX = 0;
          
          setDir(targetX < feetX);
          setAnim(chosenIdle);
          
        } else {
          velX = SPEED_WALK * (edgeDx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("walk");
        }
        break;
      }

      case "headtilt": {
        velX = 0;
        setDir(cursorX < feetX);
        if (isSkeletonPet() && Math.random() < 0.005 && animLockTimer <= 0) {
          setAnimLocked("clean1", 900);
          break;
        }
        if (cdist < 120 && Math.random() < 0.005 && animLockTimer <= 0) {
          setAnimLocked("paw", 800);
          addTimeout(() => {
            if (state === "headtilt") setAnim(chosenIdle);
          }, 800);
        }
        if (stateTimer <= 0) go(null, ["headtilt"]);
        break;
      }

      case "explore": {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          go(null, ["explore"]);
          return;
        }
        clampWalls();
        const expDx = targetX - feetX;
        if (Math.abs(expDx) < 30) {
          velX = 0;
          setDir(targetX < feetX);
          
          if (
            curAnim !== ANIMS["clean1"] &&
            curAnim !== ANIMS["clean2"] &&
            animLockTimer <= 0
          ) {
            setAnim(pickCleanVariant());
          }
        } else {
          velX = SPEED_WALK * 0.8 * (expDx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("walk");
        }
        break;
      }

      case "peek_a_boo": {
        
        const pvw = _vw;
        const pdx = targetX - feetX;
        if (onGround && Math.abs(pdx) < 20) {
          velX = 0;
          setDir(targetX > pvw / 2); 
          setAnim(chosenIdle);
          if (Math.random() < 0.05) {
            setDir(!facingLeft);
            addTimeout(() => {
              if (state === "peek_a_boo") setDir(targetX > pvw / 2);
            }, 400);
          }
        } else if (onGround && Math.abs(velX) < 10) {
          velX = SPEED_RUN * 1.2 * (pdx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("run");
        }
        if (stateTimer <= 0) go("sit");
        break;
      }

      case "wall_sit": {
        
        if (state !== "wall_sit") break;
        const wsDx = targetX - feetX;
        if (Math.abs(wsDx) < 25) {
          velX = 0;
          go(targetX < _vw / 2 ? "wall_left" : "wall_right");
        } else {
          velX = (wsDx > 0 ? 1 : -1) * SPEED_RUN * 1.4;
          setDir(velX < 0);
          setAnim("run");
          
          const wallTouch = getSideWallMargin();
          if (feetX <= wallTouch) {
            feetX = getWallAttachX("left");
            go("wall_left");
            break;
          }
          if (feetX >= _vw - wallTouch) {
            feetX = getWallAttachX("right");
            go("wall_right");
            break;
          }
        }
        if (stateTimer <= 0) go("sit");
        break;
      }

      case "wall_left_sit":
      case "wall_right_sit": {
        if (stateTimer <= 0) {
          globalRot = 0;
          applyTransform();
          velY = 0;
          velX = state === "wall_left_sit" ? SPEED_RUN : -SPEED_RUN;
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          state = "jump";
          stateTimer = 3000;
        }
        break;
      }

      case "loyal_follow": {
        if (!isLoyalMode || ((isPigeonPet() || isFairyPet()) && onGround)) {
          go("sit");
          break;
        }
        clampWalls();
        const ldx = cursorX - feetX;
        const ldy = cursorY - feetY;
        const ldist = Math.abs(ldx);
        const lvdist = Math.abs(ldy);

        const moveThreshold = (Math.abs(velX) < 5) ? 70 : 40;
        if (ldist < moveThreshold && lvdist < 70) {
          velX *= 0.85;
          if (Math.abs(velX) < 5) velX = 0;
          setDir(cursorX < feetX);
          if (animLockTimer <= 0) setAnim(chosenIdle);
          chaseStuckTimer = 0;
          attackPhase = "pursue";
          break;
        }

        if (ldy < -100 && onGround && !isJumping) {
          chaseStuckTimer += dt;
          if (chaseStuckTimer > 2.0) {
            
            go("chase");
            return;
          }
        } else {
          chaseStuckTimer = Math.max(0, chaseStuckTimer - dt * 0.3);
        }

        if (onGround && !isJumping && ldist > 50) {
          const lDir = ldx > 0 ? 1 : -1;
          if (isNearPlatformEdge(feetX, lDir)) {
            const adj = findAdjacentPlatform(feetX, lDir);
            if (adj) {
              velY = JUMP_V * (0.5 + Math.random() * 0.3);
              velX = lDir * SPEED_RUN * (0.9 + Math.random() * 0.3);
              setAnim("jump", true);
              isJumping = true;
              onGround = false;
              break;
            } else if (ldy > 30) {
              velX = lDir * SPEED_RUN;
              velY = 50;
              onGround = false;
              isJumping = true;
              setAnim("jump", true);
              break;
            }
          }
        }

        if (onGround && !isJumping && ldist >= moveThreshold) {
          const runThresh = (curAnim && (curAnim === ANIMS.run || curAnim.name === "run")) ? 180 : 200;
          const lspd = ldist > runThresh ? SPEED_RUN : SPEED_WALK;
          velX = (ldx > 0 ? 1 : -1) * lspd;
          setDir(velX < 0);
          setAnim(ldist > runThresh ? "run" : "walk");
        }
        break;
      }

      case "deepsleep": {
        if (!isDeepSleep) {
          if (isSkeletonPet() && curAnim === ANIMS.pile) {
            setAnimLocked("wake", 875);
            addTimeout(() => {
              if (state === "deepsleep") go("stretch");
            }, 875);
          } else {
            go("stretch");
          }
          break;
        }
        const dsDx = targetX - feetX;
        if (isFairyPet() || isPigeonPet()) break;
        if (Math.abs(dsDx) < 30) {
          velX = 0;
          if (isSkeletonPet()) {
            if (curAnim !== ANIMS.crumple && curAnim !== ANIMS.pile) {
              setAnimLocked("crumple", 875);
              addTimeout(() => {
                if (state === "deepsleep") setAnim("pile");
              }, 875);
            }
          } else {
            if (curAnim !== ANIMS.sleep) setAnim("sleep");
          }
          
          if (Math.random() < 0.008) spawnZzz();
        } else {
          velX = SPEED_WALK * 0.7 * (dsDx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("walk");
        }
        break;
      }

      case "portal_seek": {
        const portal = getQuickMenuPortalTarget();
        if (!portal) {
          go("sit");
          break;
        }
        if (isUserDrivenTarget(portal))
          refreshUserDrivenChaseTimer(portal, 12000);

        targetX = portal.x;
        const pdx = portal.x - feetX;
        const pdy = portal.y - feetY;
        const nearPortal = Math.abs(pdx) < 44 && Math.abs(pdy) < 90;

        if (
          !nearPortal &&
          moveToDropEdgeForLowerTarget(portal.x, portal.y, 120)
        ) {
          stateTimer = Math.max(stateTimer, 3000);
          break;
        }

        if (Math.abs(pdx) > 38) {
          velX = (pdx > 0 ? 1 : -1) * SPEED_RUN * 1.05;
          setDir(velX < 0);
          setAnim("run");
        } else {
          velX = 0;
          setDir(pdx < 0);
          if (onGround && !isJumping && pdy < -50) {
            velY = JUMP_V * 0.55;
            onGround = false;
            isJumping = true;
            setAnim("jump", true);
          } else {
            setAnim(chosenIdle);
          }
        }

        if (stateTimer <= 0) go("sit");
        break;
      }

      case "chasefish": {
        
        if (
          !targetFish ||
          !activeFishes.includes(targetFish) ||
          activeFishes.length === 0
        ) {
          targetFish = null;
          const fishEater = PixelCatRuntime.instances && PixelCatRuntime.instances.find(c => c !== api && c.state === "eatfish");
          if (fishEater) {
            jealousTarget = fishEater;
            go("jealous_approach");
          } else {
            go("sit");
          }
          break;
        }
        if (isUserDrivenTarget(targetFish)) {
          refreshUserDrivenChaseTimer(
            targetFish,
            targetFish.isHeld ? 26000 : 18000,
          );
        }

        if (!targetFish.manualSpawned && !isFrogPet() && Math.random() < 0.002) {
          
          let continueInterest = 0.7; 

          if (catEnergy < 0.3) continueInterest -= 0.4;

          if (stateTimer < 20000) continueInterest -= 0.2;

          const distToFish = Math.abs(targetFish.x - feetX);
          if (distToFish > 500) continueInterest -= 0.3;

          if (catEnergyLevel === "sleepy") continueInterest -= 0.3;

          if (Math.random() > continueInterest) {
            
            targetFish = null;
            const randomAction = Math.random();
            if (randomAction < 0.3) {
              go("sit"); 
            } else if (randomAction < 0.6) {
              go("groom"); 
            } else {
              go("wander");
            }
            break;
          }
        }

        if (activeFishes.length > 1) {
          let closest = activeFishes[0];
          let closestDist = Math.abs(closest.x - feetX);
          for (let i = 1; i < activeFishes.length; i++) {
            const d = Math.abs(activeFishes[i].x - feetX);
            if (d < closestDist) {
              closest = activeFishes[i];
              closestDist = d;
            }
          }
          if (
            closest !== targetFish &&
            Math.abs(closest.x - feetX) < Math.abs(targetFish.x - feetX) * 0.6
          ) {
            targetFish = closest;
          }
        }

        targetX = targetFish.x;
        const fishDist = Math.abs(feetX - targetX);
        const fishRawYDist = targetFish.y - feetY; 
        const fishYDist = Math.abs(fishRawYDist);

        const fishCatchX = (isFrogPet() ? 35 : (isFoxPet() ? 62 : 45)) + (sizeMultiplier - 1) * 28;
        const fishCatchY = (isFrogPet() ? 40 : (isFoxPet() ? 64 : 55)) + (sizeMultiplier - 1) * 30;
        const foxFishReady =
          isFoxPet() && isFoxPreActionReady(targetFish, "fish");
        const fishInCatchRange =
          fishDist < fishCatchX && fishYDist < fishCatchY;
        const fishInFoxPounceRange =
          isFoxPet() &&
          foxFishReady &&
          fishDist < fishCatchX + 34 &&
          fishYDist < fishCatchY + 38;
        if (fishInCatchRange || fishInFoxPounceRange) {
          if (isFoxPet() && !foxFishReady) {
            beginFoxPreAction(targetFish, "fish", {
              jumpPower: targetFish.isHeld ? 0.38 : 0.62,
              delayMs: targetFish.isHeld ? 210 : 250,
              lockMs: targetFish.isHeld ? 430 : 380,
              extendStateTimer: 1300,
            });
            break;
          }

          const caughtFish = targetFish;
          const fidx = activeFishes.indexOf(caughtFish);
          if (fidx > -1) {
            const catchX = caughtFish.x;
            const catchY = caughtFish.y;
            if (!isFrogPet()) {
              feetX = Math.max(
                getSideWallMargin(),
                Math.min(_vw - getSideWallMargin(), catchX),
              );
              feetY = Math.max(40, Math.min(_vh, catchY + (isFoxPet() ? 2 : 0)));
              velX = 0;
              velY = 0;
              onGround = true;
              isJumping = false;
              if (Math.abs(catchX - feetX) > 1) setDir(catchX < feetX);
            } else {
              if (Math.abs(catchX - feetX) > 1) setDir(catchX < feetX);
            }
            clearFoxPreAction(caughtFish, "fish");

            releaseActivePickup("fish");
            caughtFish.el.remove();
            activeFishes.splice(fidx, 1);
            
            if (draggedFish === caughtFish) {
              draggedFish = null;
            }
            targetFish = null;
            spawnDust(feetX, feetY);
            earnXP(1.0); 
            awardCoins(getFishCoinReward());
            recordQuestEvent("fish_served", 1);
            lastFishEatenAt = safeNow();
            addTimeout(() => {
              if (!isDestroyed) spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
            }, 250);
            go("eatfish");
            if (PixelCatRuntime.instances && PixelCatRuntime.instances.length >= 2) {
              const _now = safeNow();
              const _lastBred = PixelCatRuntime.lastBreedingTime || 0;
              if (_now - _lastBred > 25000) {
                const _partner = PixelCatRuntime.instances.find(
                  (c) => c !== api && c.lastFishEatenAt && (_now - c.lastFishEatenAt < 12000)
                );
                if (_partner) {
                  PixelCatRuntime.lastBreedingTime = _now;
                  const _midpoint = (feetX + _partner.feetX) / 2;
                  addTimeout(() => {
                    startBreeding(_midpoint, _partner);
                    if (typeof _partner.startBreeding === "function") {
                      _partner.startBreeding(_midpoint, api);
                    }
                  }, 2500);
                }
              }
            }
          } else {
            
            targetFish = null;
            const fishEater = PixelCatRuntime.instances && PixelCatRuntime.instances.find(c => c !== api && c.state === "eatfish");
            if (fishEater) {
              jealousTarget = fishEater;
              go("jealous_approach");
            } else {
              go("sit");
            }
          }
          break;
        }

        const fishIsBelow = fishRawYDist > 40;
        const catPlat = onGround ? getCurrentPlatform() : null;
        const catIsOnPlatform = catPlat !== null && catPlat.top < _vh - 30;

        if (
          fishIsBelow &&
          catIsOnPlatform &&
          maybeDropThroughCurrentPlatformForLowerTarget(
            targetFish.x,
            targetFish.y,
            90,
          )
        ) {
          stuckCheckTimer = 0;
          stateTimer = Math.max(stateTimer, 18000);
          break;
        }

        let fishDir;
        if (fishIsBelow && fishDist < 60) {
          
          if (catIsOnPlatform) {
            const distToLeft = feetX - catPlat.left;
            const distToRight = catPlat.right - feetX;
            fishDir = distToLeft < distToRight ? -1 : 1;
          } else {
            
            fishDir = targetFish.x > feetX ? 1 : -1;
          }
        } else {
          fishDir = targetFish.x > feetX ? 1 : -1;
        }

        const chaseSpeed = fishDist > 200 ? SPEED_RUN * 1.3 : SPEED_RUN;
        velX = fishDir * chaseSpeed;
        setDir(velX < 0);

        if (onGround && !isJumping && animLockTimer <= 0) {
          const chaseAnim = isPigeonPet() ? "fly" : "run";
          if (curAnim !== ANIMS[chaseAnim]) setAnim(chaseAnim, true);
        }

        if (maybeFoxHeldFishHop(targetFish, fishDist, fishRawYDist, fishDir)) {
          break;
        }

        stuckCheckTimer += dt * 1000;
        if (stuckCheckTimer > 1200) {
          
          const moved = Math.abs(feetX - lastFishChaseX);
          if (moved > 15) {
            stateTimer = Math.max(stateTimer, 15000);
          }
          lastFishChaseX = feetX;

          if (moved < 6 && onGround && !isJumping) {
            if (fishIsBelow && catIsOnPlatform) {
              if (
                platformCoversLowerTarget(
                  catPlat,
                  targetFish.x,
                  targetFish.y,
                  90,
                )
              ) {
                startChaseDropThroughToward(targetFish.x, targetFish.y, 0.75);
              } else {
                
                const distToLeft = feetX - catPlat.left;
                const distToRight = catPlat.right - feetX;
                const edgeDir = distToLeft < distToRight ? -1 : 1;
                
                startChaseDropThrough(edgeDir, 1.5);
              }
            } else if (fishRawYDist < -40) {
              
              const jumpH = 0.7 + Math.random() * 0.4;
              velY = JUMP_V * jumpH;
              velX = fishDir * SPEED_RUN * (1.0 + Math.random() * 0.5);
              if (!isFrogPet()) {
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
              }
            } else {
              
              velY = JUMP_V * (isFoxPet() ? 0.22 + Math.random() * 0.14 : 0.5 + Math.random() * 0.3);
              velX = fishDir * SPEED_RUN * (isFoxPet() ? 0.9 + Math.random() * 0.25 : 1.2 + Math.random() * 0.6);
              if (!isFrogPet()) {
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
              }
            }
          }
          stuckCheckTimer = 0;
        }

        if (onGround && !isJumping) {
          
          if (fishIsBelow && catIsOnPlatform) {
            if (
              platformCoversLowerTarget(catPlat, targetFish.x, targetFish.y, 90)
            ) {
              startChaseDropThroughToward(targetFish.x, targetFish.y, 0.7);
              break;
            }

            const distToLeft = feetX - catPlat.left;
            const distToRight = catPlat.right - feetX;
            const nearestEdgeDist = Math.min(distToLeft, distToRight);
            const edgeDir = distToLeft < distToRight ? -1 : 1;

            velX = edgeDir * SPEED_RUN;
            setDir(velX < 0);

            if (nearestEdgeDist < 50) {
              
              const towardFish = targetFish.x > feetX ? 1 : -1;
              startChaseDropThrough(towardFish, 1.25);
              break;
            }
            break; 
          }

          const fishPlat = getPlatformAt(targetFish.x, targetFish.y);
          if (
            fishPlat &&
            catPlat &&
            Math.abs(fishPlat.top - catPlat.top) > 30
          ) {
            if (isNearPlatformEdge(feetX, fishDir)) {
              const jumpDist = Math.abs(
                fishPlat.left + fishPlat.width / 2 - feetX,
              );
              const heightDiff = fishPlat.top - catPlat.top;

              let jumpPower = 0.7;
              let horizPower = 1.2;

              if (heightDiff < -50) {
                jumpPower = Math.min(1.3, 0.8 + Math.abs(heightDiff) / 150);
              }
              
              else if (heightDiff > 50) {
                jumpPower = 0.3;
              }
              if (jumpDist > 150) {
                horizPower = Math.min(2.2, 1.3 + jumpDist / 200);
              }

              const rf = 0.85 + Math.random() * 0.25;
              velY = JUMP_V * jumpPower * rf;
              velX = fishDir * SPEED_RUN * horizPower * rf;
              if (!isFrogPet()) {
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
              }
              break;
            }
          }

          if (isNearPlatformEdge(feetX, fishDir)) {
            const adj = findAdjacentPlatform(feetX, fishDir);

            if (fishIsBelow) {
              startChaseDropThrough(fishDir, 1.35);
            } else if (adj) {
              
              const jp = 0.6 + Math.random() * 0.5;
              const hp = 0.9 + Math.random() * 0.6;
              velY = JUMP_V * jp;
              velX = fishDir * SPEED_RUN * hp * 1.3;
              if (!isFrogPet()) {
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
              }
            } else {
              
              velY = JUMP_V * 0.3;
              velX = fishDir * SPEED_RUN * 1.5;
              if (!isFrogPet()) {
                setAnim("jump", true);
                isJumping = true;
                onGround = false;
              }
            }
          }
        }

        if (
          targetFish.y < feetY - 40 &&
          fishDist < (isFoxPet() ? 120 : 200) &&
          onGround &&
          !isJumping &&
          targetFish.vy > -150 &&
          !isFrogPet()
        ) {
          const interceptPower = isFoxPet()
            ? 0.45 + Math.random() * 0.2
            : 0.8 + Math.random() * 0.5;
          velX = fishDir * SPEED_RUN * (isFoxPet() ? 1.05 : 1.8) * interceptPower;
          velY = -Math.min(
            isFoxPet() ? 260 : 400,
            Math.max(
              isFoxPet() ? 130 : 200,
              (feetY - targetFish.y) * (isFoxPet() ? 0.9 : 1.5) + 50,
            ),
          ) * interceptPower;
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          break;
        }

        const fishOffScreen =
          targetFish.x < -200 ||
          targetFish.x > _vw + 200 ||
          targetFish.y > _vh + 200;
        if (
          fishOffScreen ||
          (stateTimer <= 0 && !isUserDrivenTarget(targetFish))
        ) {
          targetFish = null;
          go("sit");
        } else if (stateTimer <= 0) {
          stateTimer = 15000;
        }
        break;
      }

      case "eatfish": {
        if (onGround) velX = 0;
        if (stateTimer <= 0) go("sit");
        break;
      }

      case "jealous_approach": {
        if (!jealousTarget || stateTimer <= 0) {
          go("sit");
          break;
        }
        clampWalls();
        const partnerX = typeof jealousTarget.feetX === "number" ? jealousTarget.feetX : feetX;
        const bdx = partnerX - feetX;
        if (Math.abs(bdx) < 40) {
          velX = 0;
          setDir(feetX > partnerX);
          jealousTarget = null;
          go("jealous_tantrum");
        } else {
          velX = SPEED_RUN * (bdx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("run");
        }
        break;
      }

      case "jealous_tantrum": {
        velX = 0;
        if (stateTimer <= 0) go("sit");
        break;
      }

      case "breed_approach": {
        if (!breedingPartner || stateTimer > 12000) {
          go("sit");
          break;
        }
        clampWalls();
        const partnerX = typeof breedingPartner.feetX === "number" ? breedingPartner.feetX : breedingTargetX;
        const bdx = breedingTargetX - feetX;
        if (Math.abs(bdx) < 25) {
          velX = 0;
          setDir(feetX > partnerX);
          setAnim("clean1");
          if (breedingPhase === "walk") {
            breedingPhase = "heart_burst";
            stateTimer = 3000;
            addTimeout(() => {
              if (isDestroyed) return;
              spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
              if (breedingPartner && catId < breedingPartner.catId) {
                const partnerX = typeof breedingPartner.feetX === "number" ? breedingPartner.feetX : feetX;
                const partnerY = typeof breedingPartner.feetY === "number" ? breedingPartner.feetY : feetY;
                const midX = (feetX + partnerX) / 2;
                const midY = (feetY + partnerY) / 2;
                spawnHeart(midX, midY - VIS * sizeMultiplier * 0.85);
              }
            }, 200);

          } else if (stateTimer <= 0) {
            breedingPartner = null;
            go("sit");
          }
        } else {
          velX = SPEED_WALK * (bdx > 0 ? 1 : -1);
          setDir(velX < 0);
          setAnim("walk");
        }
        break;
      }

      case "webbed_stun": {
        velX *= 0.9;
        if (stateTimer <= 0) {
          velX = 0;
          go("sit");
        }
        break;
      }

      case "chasing_bug": {
        if (
          !targetSpider ||
          targetSpider.dead ||
          !activeSpiders.includes(targetSpider)
        ) {
          targetSpider = null;
          go("sit");
          break;
        }
        if (isUserDrivenTarget(targetSpider)) {
          refreshUserDrivenChaseTimer(
            targetSpider,
            targetSpider.isHeld ? 22000 : 16000,
          );
        }

        const dx = targetSpider.x - feetX;
        const dy = targetSpider.y - feetY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let catchX = targetSpider.hitRadiusX || 50;
        let catchY = targetSpider.hitRadiusY || 55;
        let isSkeletonThrow = false;
        let isFairyMagic = false;
        
        if (isSkeletonPet() && dist < 300 && dist > 50 && targetSpider.y < feetY + 100 && targetSpider.y > feetY - 200) {
           isSkeletonThrow = true;
           catchX = 300;
           catchY = 300;
        } else if (isFairyPet() && dist < 320 && dist > 40 && targetSpider.y < feetY + 140 && targetSpider.y > feetY - 240) {
           isFairyMagic = true;
           catchX = 320;
           catchY = 320;
        }

        if (Math.abs(dx) < catchX && Math.abs(dy) < catchY) {
          
          velX = 0;
          if (isSkeletonThrow) {
             setAnimLocked("toss", 500);
             const sp = targetSpider;
             setTimeout(() => {
               throwBoneAtSpider(feetX, feetY - 30, sp);
             }, 250);
             targetSpider = null;
             state = "stunned";
             stateTimer = 500;
             break;
          } else if (isFairyMagic) {
             setAnimLocked("cast", 500);
             const sp = targetSpider;
             setTimeout(() => {
               shootMagicAtSpider(feetX, feetY - 20, sp);
             }, 200);
             targetSpider = null;
             state = "stunned";
             stateTimer = 450;
             break;
          }

          const defaultHealth = 3;
          targetSpider.health = Math.max(0, (targetSpider.health ?? defaultHealth) - 1);
          spawnDust(feetX, feetY);
          setAnimLocked("paw", 450);

          if (targetSpider.health > 0) {
            const pushDir = feetX < targetSpider.x ? -1 : 1;
            targetSpider.state = "damage";
            targetSpider.curFrame = 0;
            targetSpider.animAccum = 0;

            targetSpider.stateTimer = 500;
            targetSpider.vx = -pushDir * 180;
            targetSpider.vy = -100;
            
            velX = pushDir * 80;
            velY = Math.min(velY, JUMP_V * 0.3);
            
            onGround = false;
            isJumping = true;
            state = "stunned";
            stateTimer = 400;
            break;
          }

          targetSpider.dead = true;
          targetSpider.curFrame = 0;
          targetSpider.animAccum = 0;
          targetSpider.state = "death";
          awardCoins(3); 
          recordQuestEvent("spiders_caught", 1);
          targetSpider = null;
          go("sit");
          break;
        }

        if (moveToDropEdgeForLowerTarget(targetSpider.x, targetSpider.y, 110)) {
          break;
        }

        if (onGround && !isJumping && targetSpider.y - feetY > 45) {
          const route = planRouteToTarget(targetSpider.x, targetSpider.y);
          if (route && route.type === "drop-down" && executeRoute(route)) break;
        }

        if (onGround && !isJumping) {
          if (dy < -150) {
            
            velX *= 0.8;
            if (Math.abs(velX) < 10) velX = 0;
            setDir(dx < 0);
            setAnim(chosenIdle); 
          } else {
            if (Math.abs(dx) < 20) {
              velX *= 0.8;
              if (Math.abs(velX) < 10) velX = 0;
              setAnim(chosenIdle); 
            } else {
              velX = (dx > 0 ? 1 : -1) * SPEED_RUN * 1.4;
              setAnim("run");
            }
            setDir(dx < 0);

            if (
              dy < -40 &&
              dist < 100 &&
              (targetSpider.state === "drop" ||
                targetSpider.state === "dangle" ||
                targetSpider.state === "dangle_pause" ||
                targetSpider.state === "held")
            ) {
              velY = JUMP_V * 0.8;
              onGround = false;
              isJumping = true;
              setAnim("jump", true);
            }
          }
        }

        if (stateTimer <= 0) {
          if (
            isUserDrivenTarget(targetSpider) &&
            targetSpider &&
            !targetSpider.dead
          ) {
            stateTimer = 12000;
          } else {
            targetSpider = null;
            go("sit");
          }
        }
        break;
      }

      case "coinchase": {
        if (!coinChaseTarget || coinChaseTarget.caught) {
          coinChaseTarget = null;
          go("sit");
          break;
        }

        const coinSize = 16 * sizeMultiplier;
        const coinTargetX = coinChaseTarget.x + coinSize / 2;
        const coinTargetY = coinChaseTarget.y + coinSize / 2;
        const coinDx = coinTargetX - feetX;
        const coinDy = coinTargetY - feetY;

        if (moveToDropEdgeForLowerTarget(coinTargetX, coinTargetY, 110)) {
          stateTimer = 20000;
          break;
        }

        setDir(coinDx < 0);
        if (Math.abs(coinDx) > 30) {
          velX = (coinDx > 0 ? 1 : -1) * SPEED_RUN * 1.2;
          setAnim("run");
        } else if (coinDy < -45 && onGround && !isJumping) {
          velX = 0;
          velY = JUMP_V * 0.55;
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
        } else {
          velX *= 0.7;
          setAnim("walk");
        }

        coinStuckCheckTimer += dt * 1000;
        if (coinStuckCheckTimer > 1000) {
          const moved = Math.abs(feetX - lastCoinChaseX);
          if (moved < 5 && onGround && !isJumping) {
            if (coinDy > 35) {
              const plat = getCurrentPlatform();
              if (plat) {
                const leftDist = feetX - plat.left;
                const rightDist = plat.right - feetX;
                startChaseDropThrough(leftDist <= rightDist ? -1 : 1);
              }
            } else {
              const route = planRouteToTarget(coinTargetX, coinTargetY);
              if (!executeRoute(route) && Math.abs(coinDx) > 20) {
                velY = JUMP_V * 0.35;
                velX = (coinDx > 0 ? 1 : -1) * SPEED_RUN;
                onGround = false;
                isJumping = true;
                setAnim("jump", true);
              }
            }
          }
          lastCoinChaseX = feetX;
          coinStuckCheckTimer = 0;
        }

        stateTimer = 20000;
        break;
      }
    }
  }

  function isNavigationLikeState() {
    if (
      isDragging ||
      state === "dragged" ||
      state === "hidden" ||
      state === "deepsleep"
    )
      return false;
    if (
      state === "sit" ||
      state === "stare" ||
      state === "headtilt" ||
      state === "nap"
    )
      return false;
    if (state === "wall_left_sit" || state === "wall_right_sit") return false;

    const activeStates = new Set([
      "wander",
      "zoomies",
      "spook",
      "patrol",
      "explore",
      "chase",
      "attack",
      "jump",
      "climbtop",
      "ninja_climb",
      "wall_left",
      "wall_right",
      "chasefish",
      "eatfish",
      "coinchase",
      "ball_chase",
      "ball_play",
      "portal_seek",
      "loyal_follow",
      "ui_mischief",
      "knockoff",
      "logo_hunt",
      "chip_pounce",
      "search_paw",
      "pounce",
    ]);

    return (
      activeStates.has(state) ||
      Math.abs(velX) > 22 ||
      Math.abs(velY) > 22 ||
      isJumping ||
      !onGround
    );
  }

  function recoverFromGeneralStuck(reason) {
    const now = safeNow();
    if (now - lastGeneralUnstuckAt < 1200) return false;
    lastGeneralUnstuckAt = now;
    generalStuckTimer = 0;
    stuckSampleTimer = 0;
    chaseStuckTimer = 0;
    coinStuckCheckTimer = 0;
    ballStuckCheckTimer = 0;
    stuckCheckTimer = 0;
    pathfindCooldown = 0.8;
    chaseDropThroughUntil = safeNow() + 650;

    const wallMargin = getSideWallMargin();
    const sidePad = Math.max(wallMargin + 8, 28);

    if (
      state === "wall_left" ||
      state === "wall_left_sit" ||
      feetX <= wallMargin + 4
    ) {
      globalRot = 0;
      visualRot = 0;
      feetX = Math.min(_vw - sidePad, Math.max(sidePad, wallMargin + 24));
      velX = SPEED_WALK * 0.95;
      velY = JUMP_V * 0.18;
      onGround = false;
      isJumping = true;
      setDir(false);
      setAnim("jump", true);
      state = "jump";
      stateTimer = 1100;
      applyTransform();
      scheduleEnvScan(0);
      return true;
    }

    if (
      state === "wall_right" ||
      state === "wall_right_sit" ||
      feetX >= _vw - wallMargin - 4
    ) {
      globalRot = 0;
      visualRot = 0;
      feetX = Math.max(sidePad, Math.min(_vw - sidePad, _vw - wallMargin - 24));
      velX = -SPEED_WALK * 0.95;
      velY = JUMP_V * 0.18;
      onGround = false;
      isJumping = true;
      setDir(true);
      setAnim("jump", true);
      state = "jump";
      stateTimer = 1100;
      applyTransform();
      scheduleEnvScan(0);
      return true;
    }

    if (onGround) {
      const dir =
        Math.abs(velX) > 8 ? (velX > 0 ? -1 : 1) : Math.random() < 0.5 ? -1 : 1;
      feetX = Math.max(sidePad, Math.min(_vw - sidePad, feetX + dir * 12));
      velX = dir * SPEED_WALK * 1.05;
      velY = JUMP_V * 0.16;
      onGround = false;
      isJumping = true;
      setDir(velX < 0);
      setAnim("jump", true);
      state = "jump";
      stateTimer = 900 + Math.random() * 500;
      scheduleEnvScan(0);
      return true;
    }

    const airDir =
      Math.abs(velX) > 8 ? (velX > 0 ? 1 : -1) : Math.random() < 0.5 ? -1 : 1;
    feetX = Math.max(sidePad, Math.min(_vw - sidePad, feetX + airDir * 10));
    velX = airDir * SPEED_WALK;
    velY = Math.max(90, velY || 0);
    setDir(velX < 0);
    setAnim("jump", true);
    scheduleEnvScan(0);
    return true;
  }

  function monitorGeneralStuck(dt) {
    if (isPageSettling() || isScrolling || envPending || mutationScanTimeout) {
      generalStuckTimer = 0;
      stuckSampleTimer = 0;
      lastStuckSampleX = feetX;
      lastStuckSampleY = feetY;
      return;
    }

    if (!isNavigationLikeState()) {
      generalStuckTimer = 0;
      stuckSampleTimer = 0;
      lastStuckSampleX = feetX;
      lastStuckSampleY = feetY;
      return;
    }

    stuckSampleTimer += dt;
    if (stuckSampleTimer < 0.42) return;

    const moved = Math.hypot(
      feetX - lastStuckSampleX,
      feetY - lastStuckSampleY,
    );
    const expectedMoving =
      Math.abs(velX) > 24 ||
      Math.abs(velY) > 24 ||
      state === "wall_left" ||
      state === "wall_right" ||
      state === "chasefish" ||
      state === "coinchase" ||
      state === "ball_chase" ||
      state === "ball_play" ||
      state === "chasing_bug" ||
      state === "portal_seek" ||
      state === "attack" ||
      state === "chase";

    if (expectedMoving && moved < 2.4) {
      generalStuckTimer += stuckSampleTimer;
    } else {
      generalStuckTimer = Math.max(
        0,
        generalStuckTimer - stuckSampleTimer * 0.75,
      );
    }

    lastStuckSampleX = feetX;
    lastStuckSampleY = feetY;
    stuckSampleTimer = 0;

    const threshold =
      state === "wall_left" || state === "wall_right" ? 1.25 : 1.65;
    if (generalStuckTimer >= threshold) {
      recoverFromGeneralStuck("watchdog");
    }
  }

  function updatePhysics(dt) {
    if (bubbleTrap.active) return;
    if (isDragging) return;
    if (state === "dragged") return; 
    
    if (isClippyPet()) {
        velX = 0;
        velY = 0;
        onGround = true;
        return;
    }

    const vw = _vw;
    const baseFloor = _vh;
    let activeFloor = baseFloor;

    if (!isFairyPet() && !isPigeonPet() && onGround && feetY < baseFloor - 30) {
      const currentPlat = getCurrentPlatform();
      if (!currentPlat || !isPlatformStillValid(currentPlat)) {
        onGround = false;
        isJumping = true;
        activeFloor = baseFloor;
      }
    }

    if (state === "wall_left") {
      feetX = getWallAttachX("left");
      velX = 0; 
      feetY += velY * dt;
      
      if (feetY < 10) {
        feetY = 10;
        if (velY < 0) velY = 0;
      }

      if (uiWallTask && feetY <= uiWallTask.targetY) {
        window.scrollBy({
          top: uiWallTask.scrollDir * (70 + Math.random() * 90),
          left: 0,
          behavior: "smooth",
        });
        setAnimLocked("paw", 550);
        uiWallTask = null;
        uiTarget = null;
        globalRot = 0;
        applyTransform();
        velX = SPEED_RUN * 0.9;
        velY = JUMP_V * 0.25;
        onGround = false;
        isJumping = true;
        setAnim("jump", true);
        state = "jump";
        stateTimer = 2200;
        return;
      }

      if (attackPhase === "climb") {

        const wallElapsed = Math.max(0, (10000 - stateTimer) / 1000); 
        const wallGravity = 8 + wallElapsed * 2; 
        velY += wallGravity * dt;
        
        velY = Math.max(velY, -SPEED_RUN * 1.1);

        const slipChance = catEnergy < 0.3 ? 0.0005 : 0.0001;
        const suddenFallChance = catEnergy < 0.2 ? 0.0001 : 0.00002;

        if (Math.random() < slipChance) {
          attackPhase = "slide";
          velY = SPEED_RUN * (0.3 + Math.random() * 0.5); 
          setAnim("scared", true);
          catEnergy = Math.max(0, catEnergy - 0.08);
        }

        if (Math.random() < suddenFallChance) {
          globalRot = 0;
          applyTransform();
          velX = 70 + Math.random() * 100;
          velY = JUMP_V * (0.12 + Math.random() * 0.25); 
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          setAnimLocked("scared", 800);
          state = "jump";
          stateTimer = 2500 + Math.random() * 1000;
          catEnergy = Math.max(0, catEnergy - 0.12);
          return;
        }

        if (stateTimer < 4000 && catEnergy < 0.4) {
          velY = Math.max(velY, -SPEED_RUN * 0.5);
        }

        if (feetY <= targetX) {
          feetY = targetX;
          globalRot = 0;
          applyTransform();

          const heightReached = (_vh - feetY) / _vh;
          
          const jumpPower = Math.min(0.5, 0.25 + Math.random() * 0.3);
          
          const horizPower = Math.min(1.4, 0.5 + Math.random() * 0.6);

          velY = JUMP_V * jumpPower; 
          velX = SPEED_RUN * horizPower * 1.8; 
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          state = "jump";
          stateTimer = 3000 + Math.random() * 800;

          const spinChance = catEnergyLevel === "hyper" ? 0.07 : (catEnergyLevel === "active" ? 0.015 : 0);
          if (Math.random() < spinChance) {
            let sp = 0;
            const t0 = safeNow();
            const tick = (now) => {
              if (isDestroyed || !catEnabled || !catEl.isConnected) return;
              sp = ((now - t0) / 30) * 15;
              if (sp >= 360 || onGround) {
                globalRot = 0;
                applyTransform();
              } else {
                globalRot = sp;
                applyTransform();
                requestAnimationFrame(tick);
              }
            };
            requestAnimationFrame(tick);
          }
          return;
        }
      }

      if (attackPhase === "slide") {

        const slideSpeed = Math.abs(velY);
        const kineticFriction = 0.8; 
        const staticGrip = 28 + Math.random() * 18; 
        velY = velY * kineticFriction - staticGrip * dt;
        
        velY = Math.max(0, velY);
        
        velY = Math.min(velY, SPEED_RUN * 1.8);

        if (curAnim !== ANIMS["run"]) setAnim("run");

        const regripChance =
          (catEnergy > 0.5 ? 0.006 : 0.003) *
          (1 - slideSpeed / (SPEED_RUN * 2));

        if (Math.random() < regripChance) {
          attackPhase = "climb";
          velY = -(SPEED_RUN * (0.4 + Math.random() * 0.4));
          setAnim("run", true);
          catEnergy = Math.max(0, catEnergy - 0.04);
        }

        if (slideSpeed > SPEED_RUN * 1.4 && Math.random() < 0.0012) {
          globalRot = 0;
          applyTransform();
          velX = 50 + Math.random() * 70;
          velY = 80 + Math.random() * 120;
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          setAnimLocked("scared", 1000);
          state = "jump";
          stateTimer = 3000;
          catEnergy = Math.max(0, catEnergy - 0.15);
          return;
        }

        if (feetY >= _vh - 5) {
          feetY = _vh;
          velY = 0;
          globalRot = 0;
          applyTransform();
          setAnimLocked("scared", 600 + Math.random() * 400);
          catEnergy = Math.max(0, catEnergy - 0.08);
          go("sit");
          return;
        }
      }

      if (feetY >= _vh) {
        feetY = _vh;
        globalRot = 0;
        applyTransform();
        go("sit");
      }
      return;
    }
    
    if (state === "wall_right") {
      feetX = getWallAttachX("right");
      velX = 0; 
      feetY += velY * dt;
      
      if (feetY < 10) {
        feetY = 10;
        if (velY < 0) velY = 0;
      }

      if (uiWallTask && feetY <= uiWallTask.targetY) {
        window.scrollBy({
          top: uiWallTask.scrollDir * (70 + Math.random() * 90),
          left: 0,
          behavior: "smooth",
        });
        setAnimLocked("paw", 550);
        uiWallTask = null;
        uiTarget = null;
        globalRot = 0;
        applyTransform();
        velX = -SPEED_RUN * 0.9;
        velY = JUMP_V * 0.25;
        onGround = false;
        isJumping = true;
        setAnim("jump", true);
        state = "jump";
        stateTimer = 2200;
        return;
      }

      if (attackPhase === "climb") {
        
        const wallElapsed = Math.max(0, (10000 - stateTimer) / 1000);
        const wallGravity = 8 + wallElapsed * 2;
        velY += wallGravity * dt;
        velY = Math.max(velY, -SPEED_RUN * 1.1);

        const slipChance = catEnergy < 0.3 ? 0.0005 : 0.0001;
        const suddenFallChance = catEnergy < 0.2 ? 0.0001 : 0.00002;

        if (Math.random() < slipChance) {
          attackPhase = "slide";
          velY = SPEED_RUN * (0.3 + Math.random() * 0.5);
          setAnim("scared", true);
          catEnergy = Math.max(0, catEnergy - 0.08);
        }

        if (Math.random() < suddenFallChance) {
          globalRot = 0;
          applyTransform();
          velX = -(70 + Math.random() * 100); 
          velY = JUMP_V * (0.12 + Math.random() * 0.25);
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          setAnimLocked("scared", 800);
          state = "jump";
          stateTimer = 2500 + Math.random() * 1000;
          catEnergy = Math.max(0, catEnergy - 0.12);
          return;
        }

        if (stateTimer < 4000 && catEnergy < 0.4) {
          velY = Math.max(velY, -SPEED_RUN * 0.5);
        }

        if (feetY <= targetX) {
          feetY = targetX;
          globalRot = 0;
          applyTransform();

          const jumpPower = Math.min(0.5, 0.25 + Math.random() * 0.3);
          const horizPower = Math.min(1.4, 0.5 + Math.random() * 0.6);

          velY = JUMP_V * jumpPower; 
          velX = -(SPEED_RUN * horizPower * 1.8); 
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          state = "jump";
          stateTimer = 3000 + Math.random() * 800;

          const spinChance = catEnergyLevel === "hyper" ? 0.07 : (catEnergyLevel === "active" ? 0.015 : 0);
          if (Math.random() < spinChance) {
            let sp = 0;
            const t0 = safeNow();
            const tick = (now) => {
              if (isDestroyed || !catEnabled || !catEl.isConnected) return;
              sp = ((now - t0) / 30) * 15;
              if (sp >= 360 || onGround) {
                globalRot = 0;
                applyTransform();
              } else {
                globalRot = -sp;
                applyTransform();
                requestAnimationFrame(tick);
              }
            };
            requestAnimationFrame(tick);
          }
          return;
        }
      }

      if (attackPhase === "slide") {
        
        const slideSpeed = Math.abs(velY);
        const kineticFriction = 0.8;
        const staticGrip = 28 + Math.random() * 18;
        velY = velY * kineticFriction - staticGrip * dt;
        velY = Math.max(0, velY);
        velY = Math.min(velY, SPEED_RUN * 1.8);

        if (curAnim !== ANIMS["run"]) setAnim("run");

        const regripChance =
          (catEnergy > 0.5 ? 0.006 : 0.003) *
          (1 - slideSpeed / (SPEED_RUN * 2));

        if (Math.random() < regripChance) {
          attackPhase = "climb";
          velY = -(SPEED_RUN * (0.4 + Math.random() * 0.4));
          setAnim("run", true);
          catEnergy = Math.max(0, catEnergy - 0.05);
        }

        if (slideSpeed > SPEED_RUN * 1.4 && Math.random() < 0.0012) {
          globalRot = 0;
          applyTransform();
          velX = -(50 + Math.random() * 70); 
          velY = 80 + Math.random() * 120;
          onGround = false;
          isJumping = true;
          setAnim("jump", true);
          setAnimLocked("scared", 1000);
          state = "jump";
          stateTimer = 3000;
          catEnergy = Math.max(0, catEnergy - 0.2);
          return;
        }

        if (feetY >= _vh - 5) {
          feetY = _vh;
          velY = 0;
          globalRot = 0;
          applyTransform();
          setAnimLocked("scared", 600 + Math.random() * 400);
          catEnergy = Math.max(0, catEnergy - 0.1);
          go("sit");
          return;
        }
      }

      if (feetY >= _vh) {
        feetY = _vh;
        globalRot = 0;
        applyTransform();
        go("sit");
      }
      return;
    }

    if (state === "wall_left_sit") {
      feetX = getWallAttachX("left");
      velX = 0; 
      feetY += velY * dt;
      if (feetY < 10) {
        feetY = 10;
        if (velY < 0) velY = 0;
      } 
      if (feetY <= targetX && velY !== 0) {
        feetY = targetX;
        velY = 0;
        setAnim(chosenIdle); 
      }
      return;
    }

    if (state === "wall_right_sit") {
      feetX = getWallAttachX("right");
      velX = 0; 
      feetY += velY * dt;
      if (feetY < 10) {
        feetY = 10;
        if (velY < 0) velY = 0;
      } 
      if (feetY <= targetX && velY !== 0) {
        feetY = targetX;
        velY = 0;
        setAnim(chosenIdle); 
      }
      return;
    }

    if (isFairyPet() || isPigeonPet()) {
      if (updateFairyFlight(dt)) {
        feetX = Math.max(30, Math.min(_vw - 30, feetX + velX * dt));
        if (!onGround) {
          const yMax = state === "bat_dead" ? _vh : _vh - 60;
          feetY = Math.max(50, Math.min(yMax, feetY + velY * dt));
        }
        applyTransform();
        return;
      }
      if (
        onGround &&
        !isDragging &&
        !isPigeonPet() &&
        !(isFairyPet() && fairyGroundedByUser) &&
        (state === "wander" || state === "patrol" || state === "explore" || state === "chase" || state === "run" || state === "zoomies")
      ) {
        beginFairyFlight();
      }
    }
    const nextX = feetX + velX * dt;

    activeFloor =
      state !== "hide" && state !== "hidden" ? computeFloor(nextX) : baseFloor;

    const physicsNow = safeNow();
    const layoutSettling =
      isPageSettling() ||
      isScrolling ||
      !!mutationScanTimeout ||
      envPending ||
      physicsNow - lastScrollActivityAt < 450;
    if (layoutSettling && onGround && feetY < baseFloor - 24) {
      if (syncGroundedPlatformAnchor()) {
        activeFloor = feetY;
        velY = 0;
        isJumping = false;
      } else {
        activeFloor = baseFloor;
        onGround = false;
        isJumping = true;
      }
    }

    if (!onGround) {
      clearGroundedPlatformAnchor();
      if (!isFairyPet() && !isPigeonPet() && !isClippyPet()) {
        velY += GRAVITY * dt;
        if (catThrowHeavyTimer > 0) {
          catThrowHeavyTimer = Math.max(0, catThrowHeavyTimer - dt);
          velX *= Math.pow(0.91, dt * 60);
          if (velY < 0) velY *= Math.pow(0.84, dt * 60);
          velY += GRAVITY * 0.38 * dt;
        }
      } else {
        
        velY *= Math.pow(0.88, dt * 60);
        velX *= Math.pow(0.90, dt * 60);
      }
    }

    let applyVelX = velX;
    if (isFrogPet() && curAnim) {
      const isWalkAnim = curAnim === ANIMS.walk;
      const isRunAnim  = curAnim === ANIMS.run || curAnim === ANIMS.jump || curAnim === ANIMS.fly;

      if (isWalkAnim && onGround) {
        if (curFrame === 0 || curFrame === 3) {
          applyVelX = 0;
        }
      }

      if (isRunAnim && onGround) {
        if (curFrame <= 7) {
          applyVelX = 0; 
        } else if (!isJumping && (curFrame === 8 || curFrame === 9)) {
          if (state === "chasefish" && targetFish) {
            const fishDist = Math.abs(feetX - targetFish.x);
            const fishRawYDist = targetFish.y - feetY;
            const fishDir = targetFish.x > feetX ? 1 : -1;

            if (fishDist < 45) {
              
              applyVelX = fishDir * SPEED_RUN * 0.6;
            } else {
              const heightBoost = Math.min(0.2, Math.max(0, -fishRawYDist / 450));
              velY = JUMP_V * (0.55 + heightBoost);
              velX = fishDir * Math.min(240, 130 + fishDist * 0.7);
              setDir(velX < 0);
              onGround = false;
              isJumping = true;
              animLockTimer = 800;
              applyVelX = velX;
              curFrame = 9;
            }
          } else {
            velY = JUMP_V * 0.46;
            if (Math.abs(velX) < 170) {
              velX = (velX < 0 || (velX === 0 && facingLeft)) ? -170 : 170;
            } else {
              velX *= 1.75;
            }
            onGround = false;
            isJumping = true;
            animLockTimer = 800;
            applyVelX = velX;
            curFrame = 9;
          }
        }
      }
    }

    feetX += applyVelX * dt;
    feetY += velY * dt;

    if (state !== "hide" && state !== "hidden" && state !== "peek_a_boo") {
      const wallMargin = getSideWallMargin();
      if (feetX < wallMargin) {
        feetX = wallMargin;
        
        if (wallClimbEnabled && state === "ninja_climb" && velX < 0) {
          go("wall_left");
          return;
        } else if (wallClimbEnabled && velX < -150 && Math.random() < 0.2) {
          go("wall_left");
          return;
        }
        recoverFromSideWall("left");
      }
      if (feetX > vw - wallMargin) {
        feetX = vw - wallMargin;
        
        if (wallClimbEnabled && state === "ninja_climb" && velX > 0) {
          go("wall_right");
          return;
        } else if (wallClimbEnabled && velX > 150 && Math.random() < 0.2) {
          go("wall_right");
          return;
        }
        recoverFromSideWall("right");
      }
    }

    if (!isBatPet() && feetY >= activeFloor) {
      feetY = activeFloor;

      const landingVelY = velY;
      velY = 0;

      if (!onGround) {
        onGround = true;
        isJumping = false;
        catThrowHeavyTimer = 0;
        if (aimTargetRect && aimTargetRect.el && aimTargetRect.el.isConnected) {
          const aimedRect = aimTargetRect.el.getBoundingClientRect();
          const aimedStandY = getPlatformStandY({ top: aimedRect.top });
          if (Math.abs(feetY - aimedStandY) < 18) {
            feetY = aimedStandY;
            velY = 0;
            onGround = true;
            isJumping = false;
            clearGroundedPlatformAnchor();
            return;
          }
        }
        if (!isFrogPet()) {
          spawnDust(feetX, feetY);
        } else if (curAnim === ANIMS.run || curAnim === ANIMS.jump || curAnim === ANIMS.fly) {

          curFrame = 2;
          animAccum = 0;
          animLockTimer = 0;
        }

        if (activeFloor < baseFloor) {
          const catPlat = getCurrentPlatform();
          if (catPlat && catPlat.el && catPlat.el.isConnected) {
            captureGroundedPlatform(catPlat);
            if (landingVelY > 150) bounceElement(catPlat.el, landingVelY);
          }
        } else {
          clearGroundedPlatformAnchor();
        }

            if (state === "jump" || state === "climbtop") {
          if (isSkeletonPet()) {
            setAnimLocked("land", 220);
            addTimeout(() => go(null, ["jump", "climbtop"]), 220);
          } else {
            go(null, ["jump", "climbtop"]);
          }
        }
      }
    } else {
      onGround = false;
    }

    if (onGround && feetY < baseFloor - 20) {
      const catPlat = getCurrentPlatform();
      if (catPlat) captureGroundedPlatform(catPlat);
      const platformGone = !catPlat || !isPlatformStillValid(catPlat);
      const waitForFreshLayout =
        (layoutSettling && physicsNow - lastScrollActivityAt < 900) ||
        safeNow() < groundedPlatformGraceUntil;
      if (platformGone && !waitForFreshLayout) {
        onGround = false;
        isJumping = true;
        velY = Math.max(
          velY,
          isScrolling || mutationScanTimeout || envPending ? 420 : 220,
        );
        if (state !== "chasefish" && state !== "dragged") {
          setAnim(isSkeletonPet() ? "jump" : "jump", true);
        }
      }
    }

    if (feetY > _vh + 100) {
      feetY = baseFloor;
      velY = 0;
      onGround = true;
      isJumping = false;
      velX = 0;
      catThrowHeavyTimer = 0;
      go("sit");
    }
    if (feetY < -20) {
      feetY = -20;
      if (velY < 0) velY = 0;
    }

    if (
      onGround &&
      !isJumping &&
      (state === "wander" ||
        state === "zoomies" ||
        state === "spook" ||
        state === "patrol")
    ) {
      if (velX > 8) setDir(false);
      else if (velX < -8) setDir(true);
      if (Math.abs(velX) < 5 && animLockTimer <= 0) {
        setAnim(chosenIdle);
      } else if (animLockTimer <= 0) {
        const absVelX = Math.abs(velX);
        if (absVelX >= SPEED_RUN * 0.7) {
          const fastAnim = (isPigeonPet() && onGround) ? "walk"
            : isPigeonPet() ? "fly"
            : isFairyPet() ? "fly"
            : "run";
          if (curAnim !== ANIMS[fastAnim]) setAnim(fastAnim);
        } else if (absVelX >= SPEED_WALK * 0.5) {
          if (curAnim !== ANIMS["walk"]) setAnim("walk");
        }
      }
    }

    if (!onGround && isJumping && state !== "attack" && state !== "pounce") {
      if (animLockTimer <= 0) {
        if (isPigeonPet() || isFairyPet()) setAnim("fly", true);
        else if (isSkeletonPet() && Math.abs(velY) < 80) setAnim("prepare", true);
        else if (isFrogPet()) setAnim("run", true);
        else setAnim("jump", true);
      }
    }

    if (
      onGround &&
      !isJumping &&
      (curAnim === ANIMS["jump"] || (isFrogPet() && curAnim === ANIMS["run"])) &&
      animLockTimer <= 0
    ) {
      if (state === "chasefish") {
        setAnim("run", true);
      } else if (state === "ball_play" && animLockTimer > 0) {
        
      } else {
        const absVelX = Math.abs(velX);
        if (absVelX >= SPEED_RUN * 0.7) {
          if (curAnim !== ANIMS["run"]) setAnim("run");
        } else if (absVelX >= SPEED_WALK * 0.5) {
          if (curAnim !== ANIMS["walk"]) setAnim("walk");
        } else {
          setAnim(chosenIdle);
        }
      }
    }
    syncMovementAnimation(false);

    if (state === "ball_play" && animLockTimer > 0 && onGround) {
      velX *= 0.7;
      if (Math.abs(velX) < 8) velX = 0;
    }

    if (onGround && !isJumping && !isDragging &&
        (state === "wander" || state === "patrol" || state === "sit" ||
         state === "idle1" || state === "idle2")) {
      const absV = Math.abs(velX);
      if (absV > 2) {
        
        velX *= Math.pow(0.85, dt * 60);
      } else {
        velX = 0;
      }
    }
  }

  function clampThrowVelocity(value, limit) {
    return Math.max(-limit, Math.min(limit, value || 0));
  }

  function resetCatDragTracking(clientX, clientY) {
    lastCatDragX = clientX - dragOffX;
    lastCatDragY = clientY - dragOffY;
    lastCatDragTs = safeNow();
    catDragVX = 0;
    catDragVY = 0;
  }

  function updateCatDragFromPointer(clientX, clientY) {
    const now = safeNow();
    const nx = clientX - dragOffX;
    const ny = clientY - dragOffY;
    const dtMs = now - lastCatDragTs; 

    if (dtMs < 12) {

      feetX = nx;
      feetY = ny;
      return;
    }

    if (dtMs <= 140) {
      const instantVX = clampThrowVelocity(
        ((nx - lastCatDragX) / dtMs) * 1000,
        1550,
      );
      const instantVY = clampThrowVelocity(
        ((ny - lastCatDragY) / dtMs) * 1000,
        1550,
      );
      catDragVX = catDragVX * 0.35 + instantVX * 0.65;
      catDragVY = catDragVY * 0.35 + instantVY * 0.65;
    } else {
      catDragVX *= 0.35;
      catDragVY *= 0.35;
    }

    globalRot = clampThrowVelocity(catDragVX / 55, 8);

    feetX = nx;
    feetY = ny;

    lastCatDragX = nx;
    lastCatDragY = ny;
    lastCatDragTs = now;
  }

  let dragSyncRaf = null;
  const WINDOW_TRANSFER_MARGIN = 25;
  function stopDragSync() {
    if (dragSyncRaf) {
      cancelAnimationFrame(dragSyncRaf);
      dragSyncRaf = null;
    }
  }
  function startDragSync() {
    if (dragSyncRaf) return;
    dragSyncRaf = requestAnimationFrame(broadcastDragSync);
  }
  function broadcastDragSync() {
    if (!isDragging) {
      stopDragSync();
      return;
    }
    dragSyncRaf = requestAnimationFrame(broadcastDragSync);
  }

  let lastScreenX = 0;
  let lastScreenY = 0;

  function isDropPointOutsideWindow() {
    if (!lastScreenX && !lastScreenY) return false;
    const winLeft = window.screenX;
    const winTop = window.screenY;
    const winRight = winLeft + window.outerWidth;
    const winBottom = winTop + window.outerHeight;
    return (
      lastScreenX < winLeft - WINDOW_TRANSFER_MARGIN ||
      lastScreenX > winRight + WINDOW_TRANSFER_MARGIN ||
      lastScreenY < winTop - WINDOW_TRANSFER_MARGIN ||
      lastScreenY > winBottom + WINDOW_TRANSFER_MARGIN
    );
  }

  function canCrossWindowTransfer() {
    return !showOnAllTabsEnabled && !isCompanion;
  }

  function attemptWindowTransfer() {
    const petScreenX = Math.round(window.screenX + feetX);
    const petScreenY = Math.round(window.screenY + feetY);
    sendRuntimeMessageWithResponse({
      action: "transfer_pet_window",
      screenX: petScreenX,
      screenY: petScreenY,
      dropVX: 0,
      dropVY: 0,
    }, 4000).then((response) => {
      if (isDestroyed) return;
      if (response && response.success) {
        api.destroyInstant();
      } else {
        finishDrop();
      }
    });
  }

  addManagedEventListener(catEl, "mousedown", (e) => {
    if (e.button !== 0) return;
    removeExistingQuickMenus();
    if (bubbleTrap.active) {
      e.preventDefault();
      e.stopPropagation();
      popBubbleTrap();
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    // Clear any old bubble, then let the cat react immediately to being grabbed.
    if (speechModule && speechModule.hideSpeechBubble) {
      speechModule.hideSpeechBubble();
    }

    isDragging = true;
    clearGroundedPlatformAnchor();
    catEl.style.cursor = "grabbing";
    catEl.style.zIndex = "10000005"; // Higher than speech bubble to be safe

    lastScreenX = e.screenX || lastScreenX;
    lastScreenY = e.screenY || lastScreenY;
    startDragSync();

    dragOffX = e.clientX - feetX;
    dragOffY = e.clientY - feetY;
    resetCatDragTracking(e.clientX, e.clientY);
    velX = 0;
    velY = 0;
    onGround = false;
    isJumping = false;

    if (globalRot !== 0) {
      globalRot = 0;
      visualRot = 0; // Reset visual rotation instantly for drag
      applyTransform();
    }

    catEl.style.opacity = "1";
    setAnimLocked("scared", 99999); // stay scared whole drag
    state = "dragged";
    if (typeof speakGrabbed === "function") speakGrabbed();
  });

  addManagedEventListener(
    catEl,
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      removeExistingQuickMenus();
      if (bubbleTrap.active) {
        e.preventDefault();
        e.stopPropagation();
        popBubbleTrap();
        return;
      }

      // Clear any old bubble, then let the cat react immediately to being grabbed.
      if (speechModule && speechModule.hideSpeechBubble) {
        speechModule.hideSpeechBubble();
      }

      isDragging = true;
      clearGroundedPlatformAnchor();
      catEl.style.cursor = "grabbing";
      catEl.style.zIndex = "10000005";

      lastScreenX = t.screenX || lastScreenX;
      lastScreenY = t.screenY || lastScreenY;
      startDragSync();

      dragOffX = t.clientX - feetX;
      dragOffY = t.clientY - feetY;
      resetCatDragTracking(t.clientX, t.clientY);
      velX = 0;
      velY = 0;
      onGround = false;
      isJumping = false;

      if (globalRot !== 0) {
        globalRot = 0;
        visualRot = 0; // Reset visual rotation instantly for drag
        applyTransform();
      }

      catEl.style.opacity = "1";
      setAnimLocked("scared", 99999);
      state = "dragged";
      if (typeof speakGrabbed === "function") speakGrabbed();
      e.preventDefault();
    },
    { passive: false },
  );

  let cursorReactionLastX = cursorX;
  let cursorReactionLastY = cursorY;
  let cursorReactionLastTs = safeNow();
  let cursorApproachScore = 0;
  let lastCursorReactionAt = 0;

  function maybeReactToSuspiciousCursor(now, prevX, prevY, pointerSpeed) {
    if (isCompanion || !catEnabled || !isTabVisible || document.hidden) return;
    if (
      isDragging ||
      state === "dragged" ||
      state === "hidden" ||
      state === "deepsleep"
    )
      return;
    if (isPurring || speechModule?.speechVisible) return;
    if (
      _criticalStates.has(state) &&
      state !== "sit" &&
      state !== "headtilt" &&
      state !== "pawplay"
    )
      return;

    const dx = cursorX - feetX;
    const dy = cursorY - feetY;
    const dist = Math.hypot(dx, dy);
    const prevDist = Math.hypot(prevX - feetX, prevY - feetY);
    const isApproaching = dist < prevDist - 7;
    const isFastApproach = isApproaching && pointerSpeed > 760;
    const tooSoon = now - lastCursorReactionAt < 45000;

    if (dist < 120 && isApproaching) {
      cursorApproachScore = Math.min(
        8,
        cursorApproachScore + (isFastApproach ? 1.5 : 0.75),
      );
    } else if (dist > 170 || !isApproaching) {
      cursorApproachScore = Math.max(0, cursorApproachScore - 0.8);
    }

    if (
      tooSoon ||
      !speechModule ||
      typeof speechModule.speakFromCategory !== "function"
    )
      return;

    if (dist < 34 && pointerSpeed > 720 && Math.random() < 0.65) {
      lastCursorReactionAt = now;
      speechModule.speakFromCategory("cursorPanic", {
        durationMs: 3000,
        cooldownMs: 12000,
      });
      if (onGround && state !== "spook") go("spook");
      return;
    }

    if (cursorApproachScore >= 6.5 && dist < 85 && Math.random() < 0.55) {
      lastCursorReactionAt = now;
      const category =
        dist < 58 || isFastApproach ? "cursorThreat" : "cursorSuspicious";
      speechModule.speakFromCategory(category, {
        durationMs: 3000,
        cooldownMs: 12000,
      });
      if (dist < 60 && onGround && Math.random() < 0.3) go("spook");
      else if ((state === "sit" || state === "stare") && Math.random() < 0.25)
        go("headtilt");
      cursorApproachScore = 0;
    }
  }

  addManagedEventListener(document, "mousemove", (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    PixelCatRuntime.cursorX = cursorX;
    PixelCatRuntime.cursorY = cursorY;

    const cursorReactionNow = safeNow();
    const cursorReactionDt = Math.max(
      16,
      cursorReactionNow - cursorReactionLastTs,
    );
    if (cursorReactionDt >= 220) {
      const cursorReactionSpeed =
        (Math.hypot(
          cursorX - cursorReactionLastX,
          cursorY - cursorReactionLastY,
        ) /
          cursorReactionDt) *
        1000;
      maybeReactToSuspiciousCursor(
        cursorReactionNow,
        cursorReactionLastX,
        cursorReactionLastY,
        cursorReactionSpeed,
      );
      cursorReactionLastX = cursorX;
      cursorReactionLastY = cursorY;
      cursorReactionLastTs = cursorReactionNow;
    }

    // Companion cat should also read global cursor position
    if (isCompanion && !isDragging) {
      cursorX = PixelCatRuntime.cursorX || cursorX;
      cursorY = PixelCatRuntime.cursorY || cursorY;
    }

    if (draggedFish && draggedFish.el && draggedFish.el.isConnected) {
      const now = safeNow();
      const nx = e.clientX - fishDragOffsetX;
      const ny = e.clientY - fishDragOffsetY;
      const dtMs = Math.max(1, now - lastFishDragTs);
      draggedFish.vx = ((nx - lastFishDragX) / dtMs) * 1000;
      draggedFish.vy = ((ny - lastFishDragY) / dtMs) * 1000;
      draggedFish.x = nx;
      draggedFish.y = ny;
      draggedFish.rot *= 0.9;
      draggedFish.onGround = false;
      markUserDrivenTarget(draggedFish, "fish");
      targetFish = draggedFish;
      if (!isDragging && state !== "dragged" && state !== "chasefish")
        go("chasefish");
      stateTimer = Math.max(stateTimer, 18000);
      lastFishDragX = nx;
      lastFishDragY = ny;
      lastFishDragTs = now;
      return;
    }

    if (draggedBall && draggedBall.el && draggedBall.el.isConnected) {
      const now = safeNow();
      const nx = e.clientX - ballDragOffsetX;
      const ny = e.clientY - ballDragOffsetY;
      const dtMs = Math.max(1, now - lastBallDragTs);
      draggedBall.vx = ((nx - lastBallDragX) / dtMs) * 1000;
      draggedBall.vy = ((ny - lastBallDragY) / dtMs) * 1000;
      draggedBall.x = nx;
      draggedBall.y = ny;
      draggedBall.onGround = false;
      markUserDrivenTarget(draggedBall, "ball");
      targetBall = draggedBall;
      if (!isDragging && state !== "dragged" && state !== "ball_play")
        go("ball_play");
      stateTimer = Math.max(stateTimer, 18000);
      lastBallDragX = nx;
      lastBallDragY = ny;
      lastBallDragTs = now;
      return;
    }

    if (draggedSpider && draggedSpider.el && draggedSpider.el.isConnected) {
      const now = safeNow();
      const nx = e.clientX - spiderDragOffsetX;
      const ny = e.clientY - spiderDragOffsetY;
      const dtMs = Math.max(1, now - lastSpiderDragTs);
      draggedSpider.vx = ((nx - lastSpiderDragX) / dtMs) * 1000;
      draggedSpider.vy = ((ny - lastSpiderDragY) / dtMs) * 1000;
      draggedSpider.x = nx;
      draggedSpider.y = ny;
      markUserDrivenTarget(draggedSpider, "spider");
      targetSpider = draggedSpider;
      if (!isDragging && state !== "dragged" && state !== "chasing_bug")
        go("chasing_bug");
      stateTimer = Math.max(stateTimer, 18000);
      lastSpiderDragX = nx;
      lastSpiderDragY = ny;
      lastSpiderDragTs = now;
      return;
    }

    if (isDragging) {
      lastScreenX = e.screenX || lastScreenX;
      lastScreenY = e.screenY || lastScreenY;
      updateCatDragFromPointer(e.clientX, e.clientY);
      if (
        speechModule &&
        typeof speechModule.updateGrabbedSpeech === "function"
      ) {
        speechModule.updateGrabbedSpeech({
          speed: Math.hypot(catDragVX || 0, catDragVY || 0),
        });
      }
      applyTransform();
      applyPos();
    }
  });
  addManagedEventListener(
    document,
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      // FIX: Check fish/spider/ball drag BEFORE companion early-return guard.
      // These entities are owned by the main cat, so the companion guard must NOT block them.
      // Also call e.preventDefault() so browser scroll doesn't cancel the drag.
      if (draggedFish && draggedFish.el && draggedFish.el.isConnected) {
        e.preventDefault();
        const now = safeNow();
        const nx = touch.clientX - fishDragOffsetX;
        const ny = touch.clientY - fishDragOffsetY;
        const dtMs = Math.max(1, now - lastFishDragTs);
        draggedFish.vx = ((nx - lastFishDragX) / dtMs) * 1000;
        draggedFish.vy = ((ny - lastFishDragY) / dtMs) * 1000;
        draggedFish.x = nx;
        draggedFish.y = ny;
        draggedFish.rot *= 0.9;
        draggedFish.onGround = false;
        markUserDrivenTarget(draggedFish, "fish");
        targetFish = draggedFish;
        if (!isDragging && state !== "dragged" && state !== "chasefish")
          go("chasefish");
        stateTimer = Math.max(stateTimer, 18000);
        lastFishDragX = nx;
        lastFishDragY = ny;
        lastFishDragTs = now;
        return;
      }

      if (draggedBall && draggedBall.el && draggedBall.el.isConnected) {
        e.preventDefault();
        const now = safeNow();
        const nx = touch.clientX - ballDragOffsetX;
        const ny = touch.clientY - ballDragOffsetY;
        const dtMs = Math.max(1, now - lastBallDragTs);
        draggedBall.vx = ((nx - lastBallDragX) / dtMs) * 1000;
        draggedBall.vy = ((ny - lastBallDragY) / dtMs) * 1000;
        draggedBall.x = nx;
        draggedBall.y = ny;
        draggedBall.onGround = false;
        markUserDrivenTarget(draggedBall, "ball");
        targetBall = draggedBall;
        if (!isDragging && state !== "dragged" && state !== "ball_play")
          go("ball_play");
        stateTimer = Math.max(stateTimer, 18000);
        lastBallDragX = nx;
        lastBallDragY = ny;
        lastBallDragTs = now;
        return;
      }

      if (draggedSpider && draggedSpider.el && draggedSpider.el.isConnected) {
        e.preventDefault();
        const now = safeNow();
        const nx = touch.clientX - spiderDragOffsetX;
        const ny = touch.clientY - spiderDragOffsetY;
        const dtMs = Math.max(1, now - lastSpiderDragTs);
        draggedSpider.vx = ((nx - lastSpiderDragX) / dtMs) * 1000;
        draggedSpider.vy = ((ny - lastSpiderDragY) / dtMs) * 1000;
        draggedSpider.x = nx;
        draggedSpider.y = ny;
        markUserDrivenTarget(draggedSpider, "spider");
        targetSpider = draggedSpider;
        if (!isDragging && state !== "dragged" && state !== "chasing_bug")
          go("chasing_bug");
        stateTimer = Math.max(stateTimer, 18000);
        lastSpiderDragX = nx;
        lastSpiderDragY = ny;
        lastSpiderDragTs = now;
        return;
      }

      // Companion cat: only handle its own drag (fish/spider/ball already handled above)
      if (isCompanion && !isDragging) return;

      if (isDragging) {
        e.preventDefault();
        lastScreenX = touch.screenX || lastScreenX;
        lastScreenY = touch.screenY || lastScreenY;
        updateCatDragFromPointer(touch.clientX, touch.clientY);
        if (
          speechModule &&
          typeof speechModule.updateGrabbedSpeech === "function"
        ) {
          speechModule.updateGrabbedSpeech({
            speed: Math.hypot(catDragVX || 0, catDragVY || 0),
          });
        }
        applyTransform();
        applyPos();
      }
    },
    { passive: false },
  ); // FIX: must be non-passive to allow preventDefault()

  function releaseDraggedFish() {
    if (!draggedFish) return;
    draggedFish.isHeld = false;
    if (draggedFish.el && draggedFish.el.isConnected)
      draggedFish.el.style.cursor = "grab";
    draggedFish.vx = Math.max(-1000, Math.min(1000, draggedFish.vx));
    draggedFish.vy = Math.max(-1000, Math.min(1000, draggedFish.vy));

    draggedFish.vrot = draggedFish.vx * 0.7;
    markUserDrivenTarget(draggedFish, "fish");
    targetFish = draggedFish;
    if (!isDragging && state !== "dragged") {
      go("chasefish");
      stateTimer = Math.max(stateTimer, 18000);
    }
    draggedFish = null;
  }

  function releaseDraggedBall() {
    if (!draggedBall) return;
    draggedBall.isHeld = false;
    if (draggedBall.el && draggedBall.el.isConnected)
      draggedBall.el.style.cursor = "grab";
    draggedBall.vx = Math.max(-1300, Math.min(1300, draggedBall.vx));
    draggedBall.vy = Math.max(-1300, Math.min(1300, draggedBall.vy));

    draggedBall.vrot = draggedBall.vx * 2;
    markUserDrivenTarget(draggedBall, "ball");
    targetBall = draggedBall;
    if (!isDragging && state !== "dragged") {
      go("ball_play");
      stateTimer = Math.max(stateTimer, 18000);
    }
    draggedBall = null;
  }

  function releaseDraggedSpider() {
    if (!draggedSpider) return;
    draggedSpider.isHeld = false;
    draggedSpider.heldDirectionTimer = 0; // Reset direction timer
    if (draggedSpider.el && draggedSpider.el.isConnected)
      draggedSpider.el.style.cursor = "grab";
    // Clamp velocities to reasonable values
    draggedSpider.vx = Math.max(-800, Math.min(800, draggedSpider.vx));
    draggedSpider.vy = Math.max(-800, Math.min(800, draggedSpider.vy));
    // Spider transitions to jump state after being thrown
    draggedSpider.state = "jump";
    draggedSpider.stateTimer = 1000 + Math.random() * 500;
    draggedSpider.curFrame = 0;
    draggedSpider.animAccum = 0;
    markUserDrivenTarget(draggedSpider, "spider");
    targetSpider = draggedSpider;
    if (!isDragging && state !== "dragged") {
      go("chasing_bug");
      stateTimer = Math.max(stateTimer, 18000);
    }
    draggedSpider = null;
  }

  function dropCat(e) {
    if (!isDragging) return;
    stopDragSync();
    const eligible = (!e || e.type !== "blur") && canCrossWindowTransfer() && isDropPointOutsideWindow();
    if (eligible) {
      isDragging = false;
      catEl.style.cursor = "grab";
      attemptWindowTransfer();
      return;
    }
    finishDrop();
  }

  function finishDrop() {
    const releaseAge = safeNow() - lastCatDragTs;
    const staleFactor = releaseAge > 180 ? 0.25 : 1;
    // Punchier throws: higher release multiplier and caps so a fast flick
    // really sends the pet flying, while gentle drops stay unchanged.
    let releaseVX = clampThrowVelocity(catDragVX * staleFactor * 1.85, 1550);
    let releaseVY = clampThrowVelocity(catDragVY * staleFactor * 1.85, 1650);

    if (releaseVY < 0) releaseVY = Math.max(releaseVY, JUMP_V * 1.2);
    const releaseSpeed = Math.hypot(releaseVX, releaseVY);

    isDragging = false;
    catEl.style.cursor = "grab";
    animLockTimer = 0; // clear drag lock
    if (speechModule && typeof speechModule.speakDropped === "function") {
      speechModule.speakDropped({ releaseSpeed });
    } else {
      maybeSpeakAngry();
    }

    // Check if dropped near edges and adjust position
    const vw = _vw;
    const vh = _vh;
    const margin = 50;
    const wallSnap = getSideWallMargin() + 50; // distance from wall to snap for wall-walk

    // Clamp to safe zone if too close to edges
    if (feetX < margin) feetX = margin;
    if (feetX > vw - margin) feetX = vw - margin;
    if (feetY < margin) feetY = margin;

    // If placed gently near the side, keep the wall-climb shortcut. Fast releases are throws.
    if (releaseSpeed < 180 && feetY < vh - 90 && feetX < wallSnap) {
      feetX = getWallAttachX("left");
      globalRot = 0;
      go("wall_left");
      return;
    }

    if (releaseSpeed < 180 && feetY < vh - 90 && feetX > vw - wallSnap) {
      feetX = getWallAttachX("right");
      globalRot = 0;
      go("wall_right");
      return;
    }

    // Real throw: keep the velocity built up while dragging, like fish/balls do.
    // FIX: snap BOTH globalRot and visualRot to 0 instantly on release
    // so the cat doesn't stay tilted for ~100ms from the lerp residue.
    if (globalRot !== 0 || visualRot !== 0) {
      globalRot = 0;
      visualRot = 0;
      applyTransform();
    }
    onGround = false;
    isJumping = true;
    if (releaseSpeed < 90) {
      releaseVX = 0;
      releaseVY = feetY < 80 ? 190 : 110;
    }
    if (feetY < 90 && releaseVY < 0) releaseVY *= 0.25;
    if (releaseVY < 40) releaseVY += 55;
    velX = releaseVX;
    velY = releaseVY;
    catThrowHeavyTimer = Math.min(0.75, 0.28 + releaseSpeed / 1800);
    if (Math.abs(velX) > 20) setDir(velX < 0);
    catDragVX = 0;
    catDragVY = 0;
    setAnim("jump", true);
    state = "jump";
    stateTimer = 3000;
  }
  function releaseDraggedEntities() {
    if (isCompanion) return;
    releaseDraggedFish();
    releaseDraggedBall();
    releaseDraggedSpider();
  }

  addManagedEventListener(document, "mouseup", dropCat);
  addManagedEventListener(document, "touchend", dropCat);
  addManagedEventListener(document, "touchcancel", dropCat);
  addManagedEventListener(window, "blur", dropCat);
  addManagedEventListener(document, "mouseup", releaseDraggedEntities);
  addManagedEventListener(document, "touchend", releaseDraggedEntities);
  addManagedEventListener(document, "touchcancel", releaseDraggedEntities);
  addManagedEventListener(window, "blur", releaseDraggedEntities);

  addManagedEventListener(catEl, "dblclick", (e) => {
    e.stopPropagation();
    const nextLoyalMode = !isLoyalMode;
    setLocal({ loyalMode: nextLoyalMode }); 

    isLoyalMode = nextLoyalMode;

    if (isLoyalMode) {
      
      if (onGround) {
        velY = JUMP_V * 0.3;
        onGround = false;
        isJumping = true;
      }
      setAnimLocked("paw", 800);
      spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
      spawnHeart(
        feetX + 15 * sizeMultiplier,
        feetY - VIS * sizeMultiplier * 0.6,
      );
      addTimeout(() => {
        if (state !== "dragged") go("loyal_follow");
      }, 800);
    } else {
      setAnimLocked("scared", 500);
      addTimeout(() => {
        if (state !== "dragged") go("sit");
      }, 500);
    }
  });

  let lastScrollY = window.scrollY;
  let scrollAccum = 0;
  addManagedEventListener(
    document,
    "scroll",
    () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      scrollAccum += delta;
    },
    { passive: true },
  );

  addInterval(() => {
    if (lowPowerMode) {
      scrollAccum = 0;
      return;
    }
    if (
      scrollAccum > 1100 &&
      !isScrolling &&
      !mutationScanTimeout &&
      !isDragging &&
      state !== "dragged" &&
      state !== "stunned"
    ) {
      
      if (
        state === "wall_left" ||
        state === "wall_right" ||
        state === "ninja_climb"
      ) {
        go("spook");
        velY = 100; 
        velX = 0;
        onGround = false;
      } else if (Math.random() < 0.22) {
        setAnimLocked("scared", 650);
        state = "stunned";
        stateTimer = 650;
        velX = 0;
      }
    }
    scrollAccum = 0;
  }, 700);

  addInterval(() => {
    if (lowPowerMode) return;
    if (
      isDragging ||
      state === "hidden" ||
      state === "dragged" ||
      state === "stunned"
    )
      return;
    if (isLoyalMode || isDeepSleep || isPurring || speechModule?.speechVisible)
      return;
    if (Math.random() < 0.1) go(null, [state]);
  }, 8000);

  if (!isCompanion) {
    addInterval(
      () => {
        if (catEnabled && isTabVisible && state !== "deepsleep") {
          earnXP(1);
        }
      },
      5 * 60 * 1000,
    );

    addInterval(() => {
      if (!catEnabled || !isTabVisible || document.hidden) return;
      if (!isYouTubeVideoPlaying()) return;
      recordQuestEvent("watch_seconds", 15);
    }, 15000);

    let googleVisitQuestRecorded = false;
    let lastGoogleSearchQuestValue = "";

    function getGoogleQuestSearchValue() {
      if (!IS_GOOGLE_PAGE) return "";
      try {
        const url = new URL(location.href);
        const value = (url.searchParams.get("q") || "").trim();
        if (value) return value.slice(0, 120);
      } catch (e) {}
      const searchInput = document.querySelector(
        'textarea[name="q"], input[name="q"]',
      );
      return searchInput && typeof searchInput.value === "string"
        ? searchInput.value.trim().slice(0, 120)
        : "";
    }

    function recordGoogleQuestVisitOnce() {
      if (
        googleVisitQuestRecorded ||
        !IS_GOOGLE_PAGE ||
        !catEnabled ||
        document.hidden
      )
        return;
      googleVisitQuestRecorded = true;
      recordQuestEvent("google_visits", 1);
    }

    function recordGoogleQuestSearchIfNeeded() {
      if (!IS_GOOGLE_PAGE || !catEnabled || document.hidden) return;
      const value = getGoogleQuestSearchValue();
      if (!value || value === lastGoogleSearchQuestValue) return;
      lastGoogleSearchQuestValue = value;
      recordQuestEvent("google_searches", 1);
    }

    if (IS_GOOGLE_PAGE) {
      addTimeout(() => {
        recordGoogleQuestVisitOnce();
        recordGoogleQuestSearchIfNeeded();
      }, 1200);

      addManagedEventListener(
        document,
        "submit",
        () => {
          addTimeout(recordGoogleQuestSearchIfNeeded, 350);
        },
        true,
      );

      addInterval(() => {
        if (!catEnabled || !isTabVisible || document.hidden) return;
        recordQuestEvent("google_active_seconds", 15);
        recordGoogleQuestSearchIfNeeded();
      }, 15000);

      addInterval(recordGoogleQuestSearchIfNeeded, 2500);
    }
  }

  addInterval(() => {
    if (lowPowerMode) return;
    if (isFoxPet() || !isAggressiveMode || !uiMischiefEnabled || !catEnabled)
      return;
    if (
      isDragging ||
      state === "dragged" ||
      state === "chasefish" ||
      state === "eatfish" ||
      state === "deepsleep"
    )
      return;
    if (Math.random() < (uiMischiefRate / 100) * 0.55) go("ui_mischief");
  }, 20000);

  let cursorNearTimer = 0;
  addInterval(() => {
    if (lowPowerMode) return;
    if (isDragging || state === "dragged" || speechModule?.speechVisible)
      return;
    const cdist = Math.hypot(cursorX - feetX, cursorY - feetY);
    if (cdist < 72) {
      cursorNearTimer += 700;
      if (cursorNearTimer > 3600 && state === "sit") {
        
        if (Math.random() < 0.22) go("headtilt");
        else if (Math.random() < 0.18) go("pawplay");
        cursorNearTimer = 0;
      }
    } else {
      cursorNearTimer = 0;
    }
  }, 700);

  let attachedVideoEl = null;
  let detachVideoPlayListener = null;
  let detachVideoPauseListener = null;
  let lastVideoReactionSpeechAt = 0;

  function maybeSpeakVideoReaction(category) {
    if (
      isCompanion ||
      !speechModule ||
      typeof speechModule.speakFromCategory !== "function"
    )
      return;
    if (
      !catEnabled ||
      !isTabVisible ||
      document.hidden ||
      speechModule.speechVisible
    )
      return;
    const now = safeNow();
    if (now - lastVideoReactionSpeechAt < 30000) return;
    if (Math.random() < 0.25) {
      lastVideoReactionSpeechAt = now;
      speechModule.speakFromCategory(category);
    }
  }

  function handleVideoPlay() {
    if (typeof updateWatchMemory === "function") updateWatchMemory(false);
    maybeSpeakVideoReaction("videoPlay");
    if (
      (state === "sit" || state === "groom" || state === "nap") &&
      Math.random() < 0.18
    ) {
      go("watchvideo");
    }
  }

  function handleVideoPause() {
    maybeSpeakVideoReaction("videoPause");
    
    if (state === "watchvideo" && Math.random() < 0.32) {
      go("headtilt");
    }
  }

  function detachVideoListeners() {
    if (detachVideoPlayListener) {
      detachVideoPlayListener();
      detachVideoPlayListener = null;
    }
    if (detachVideoPauseListener) {
      detachVideoPauseListener();
      detachVideoPauseListener = null;
    }
    attachedVideoEl = null;
  }

  function attachVideoListeners() {
    const videoEl = document.querySelector("video");
    if (!videoEl || videoEl === attachedVideoEl) return;

    detachVideoListeners();
    attachedVideoEl = videoEl;
    detachVideoPlayListener = addManagedEventListener(
      videoEl,
      "play",
      handleVideoPlay,
    );
    detachVideoPauseListener = addManagedEventListener(
      videoEl,
      "pause",
      handleVideoPause,
    );
  }

  let lastUiMouseoverPounceAt = 0;
  function handleUiMouseover(e) {
    if (!isAggressiveMode || !uiMischiefEnabled || !catEnabled) return;
    if (
      state === "chasefish" ||
      state === "dragged" ||
      state === "deepsleep" ||
      isPurring
    )
      return;
    const now = safeNow();
    if (now - lastUiMouseoverPounceAt < 14000) return;

    const thumb = e.target.closest(
      "ytd-thumbnail, ytd-rich-grid-media, ytd-compact-video-renderer",
    );
    if (thumb && Math.random() < 0.035) {
      lastUiMouseoverPounceAt = now;
      attackEl = thumb;
      go("pounce");
    }
  }

  attachVideoListeners();
  addManagedEventListener(document, "mouseover", handleUiMouseover, {
    passive: true,
  });
  addManagedEventListener(document, "yt-navigate-finish", () => {
    addTimeout(attachVideoListeners, 500);
    addTimeout(() => {
      if (typeof updateWatchMemory === "function") updateWatchMemory(true);
    }, 1500);
  });

  addManagedEventListener(document, "visibilitychange", () => {
    isTabVisible = !document.hidden;
    if (!isTabVisible && typeof flushXP === "function") flushXP();
    if (isTabVisible) {
      if (!isCompanion) {
        safeSendRuntimeMessage({ action: "notify_tab_active" });
      }
      _scrollTrackY = window.scrollY;
      lastTs = null;
      lastUpdateTs = null;
      animAccum = 0; 
      scheduleEnvScan(300);
      if (
        !isCompanion &&
        speechModule &&
        typeof speechModule.speakFromCategory === "function" &&
        Math.random() < 0.22
      ) {
        speechModule.speakFromCategory("tabComeback", {
          cooldownMs: 12000,
          durationMs: 3000,
        });
      }
      if (typeof updateWatchMemory === "function") updateWatchMemory(false);
    }
  });

  addManagedEventListener(window, "focus", () => {
    isTabVisible = !document.hidden;
    if (isTabVisible && !isCompanion) {
      safeSendRuntimeMessage({ action: "notify_tab_active" });
    }
  });

  addManagedEventListener(
    window,
    "pagehide",
    () => {
      if (typeof flushXP === "function") flushXP();
    },
    { capture: true },
  );

  addManagedEventListener(
    window,
    "beforeunload",
    () => {
      if (typeof flushXP === "function") flushXP();
    },
    { capture: true },
  );

  let lastUpdateTs = null;
  let lastLogicTs = 0;
  let companionThinkTimer = 0;

  let ACTIVE_FRAME_MS = 0;
  let IDLE_FRAME_MS = 1000 / 15;

  function applyPowerModeSettings() {
    if (lowPowerMode) {
      ACTIVE_FRAME_MS = 1000 / 30;
      IDLE_FRAME_MS = 1000 / 8;
    } else {
      ACTIVE_FRAME_MS = 0;
      IDLE_FRAME_MS = 1000 / 15;
    }
  }

  function isIdleTickState() {
    if (isDragging || isJumping || !onGround) return false;
    if (
      activeFishes.length > 0 ||
      activeBalls.some((b) => !b.onGround || Math.abs(b.vx) > 5)
    )
      return false;
    if (targetFish || targetBall) return false;
    return IDLE_STATES.has(state);
  }

  function playSpawnCursorAnimation() {
    if (isFairyPet()) {

      feetX = Math.round(120 + Math.random() * Math.max(100, _vw - 240));
      feetY = Math.round(100 + Math.random() * Math.max(100, _vh * 0.55));
      velX = (Math.random() - 0.5) * 180;
      velY = (Math.random() - 0.5) * 100;
      onGround = false;
      isJumping = true;
      isPlayingSpawnCarry = false;
      
      applyTransform(typeof performance !== 'undefined' ? performance.now() : Date.now()); 

      if (catEl) {
        catEl.style.setProperty("visibility", "visible", "important");
        catEl.style.setProperty("opacity", "1", "important");
        catEl.style.setProperty("display", "block", "important");
      }
      
      beginFairyFlight();
      go("wander");
      return;
    }

    let targetX = Math.round(_vw * (0.2 + Math.random() * 0.6));
    let targetY = Math.round(
      Math.random() < 0.5 
        ? _vh 
        : _vh * (0.3 + Math.random() * 0.4)
    );

    if (isClippyPet()) {
        targetX = Math.round(_vw - 87);
        targetY = Math.round(_vh - 25);
    }

    if (dragHandEnabled === false) {
      if (isClippyPet()) {
          feetX = targetX;
          feetY = targetY;
      } else {
          feetX = isCompanion ? Math.round(_vw * 0.42) : Math.round(_vw * 0.38);
          feetY = FLOOR_Y();
      }
      velX = 0;
      velY = 0;
      isJumping = false;
      isPlayingSpawnCarry = false;
      onGround = true;
      
      applyTransform(typeof performance !== 'undefined' ? performance.now() : Date.now()); 

      catEl.style.setProperty("visibility", "visible", "important");
      catEl.style.setProperty("opacity", "1", "important");
      catEl.style.setProperty("display", "block", "important");
      
      if (typeof spawnDust === "function") spawnDust(feetX, feetY, true);
      go('sit');
      return;
    }

    const spawnFromLeft = Math.random() < 0.5;
    const startX = spawnFromLeft ? -150 : _vw + 150;
    const startY = Math.round(-150 + Math.random() * 200);

    spawnStartX = startX;
    spawnStartY = startY;
    goodbyeHandEntryX = startX;
    isPlayingSpawnCarry = true;

    feetX = startX;
    feetY = startY;
    state = "dragged"; 
    setAnimLocked("scared", 99999); 
    facingLeft = targetX < feetX;

    const handEl = document.createElement("div");
    spawnHandEl = handEl;
    handEl.className = "pixelcat-spawn-hand";
    handEl.style.position = "fixed";
    handEl.style.left = "0";
    handEl.style.top = "0";
    handEl.style.width = "32px";
    handEl.style.height = "32px";
    handEl.style.backgroundImage = `url("${u("assets/Cursor/light/grab.png")}")`;
    handEl.style.backgroundSize = "contain";
    handEl.style.backgroundRepeat = "no-repeat";
    handEl.style.zIndex = "10000005";
    handEl.style.pointerEvents = "none";
    handEl.style.imageRendering = "pixelated";
    handEl.style.imageRendering = "crisp-edges";
    handEl.style.imageRendering = "-moz-crisp-edges";
    
    handEl.style.willChange = "transform";
    handEl.style.backfaceVisibility = "hidden";
    handEl.style.contain = "layout paint";
    handEl.style.isolation = "isolate";
    document.body.appendChild(handEl);

    let handX = -150;
    let handY = -150;

    const vs = getCatVisualScale();
    const petH = Math.round(activePetDef.cssHeight * vs);

    const updateHandPos = () => {
      handX = feetX - 16;
      handY = feetY - petH + 12;
      handEl.style.transform = `translate3d(${Math.round(handX)}px, ${Math.round(handY)}px, 0)`;
    };

    const startTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = 1500; 

    const animateIn = (now) => {
      if (isDestroyed || !catEl.isConnected) {
        
        return;
      }
      const elapsed = now - startTs;
      const t = Math.min(1, elapsed / duration);

      const ease = 1 - Math.pow(1 - t, 3);
      
      feetX = startX + (targetX - startX) * ease;
      feetY = startY + (targetY - startY) * ease;
      
      applyTransform(now);
      updateHandPos();

      if (t < 1) {
        spawnRafId = requestAnimationFrame(animateIn);
      } else {
        isPlayingSpawnCarry = false;
        spawnHandEl = null;
        spawnRafId = null;

        handEl.style.backgroundImage = `url("${u("assets/Cursor/light/cursor.png")}")`;
        animLockTimer = 0; 

        onGround = feetY >= _vh - 4;
        if (onGround) {
          feetY = _vh;
          velX = 0;
          velY = 0;
          isJumping = false;
          go("sit");
        } else {
          velX = (Math.random() - 0.5) * 120; 
          velY = 120; 
          isJumping = true;
          setAnim("jump", true);
          state = "jump";
        }

        const exitStartTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const exitDuration = 800;
        const startHandX = handX;
        const startHandY = handY;
        const exitTargetX = targetX < _vw / 2 ? -100 : _vw + 100;
        const exitTargetY = -100;

        const animateExit = (exitNow) => {
          const exitElapsed = exitNow - exitStartTs;
          const et = Math.min(1, exitElapsed / exitDuration);
          const easeIn = et * et; 

          const hx = startHandX + (exitTargetX - startHandX) * easeIn;
          const hy = startHandY + (exitTargetY - startHandY) * easeIn;

          handEl.style.transform = `translate3d(${Math.round(hx)}px, ${Math.round(hy)}px, 0)`;

          if (et < 1) {
            requestAnimationFrame(animateExit);
          } else {
            handEl.remove();
          }
        };
        requestAnimationFrame(animateExit);
      }
    };
    catEl.style.setProperty("visibility", "visible", "important");
    catEl.style.setProperty("opacity", "1", "important");
    catEl.style.setProperty("display", "block", "important");
    spawnRafId = requestAnimationFrame(animateIn);
  }

  function playGoodbyeAnimation(onComplete) {
    
    if (!catEl || !catEl.isConnected || isDestroyed) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    isDestroyed = true;
    isPlayingGoodbye = true;  

    cleanupAllVisualArtifacts();

    if (dragHandEnabled === false) {
      
      addTimeout(() => {
        isPlayingGoodbye = false;
        if (typeof onComplete === 'function') onComplete();
      }, 300);
      return;
    }

    const handEl = document.createElement("div");
    goodbyeHandEl = handEl;
    handEl.className = "pixelcat-spawn-hand";
    handEl.style.position = "fixed";
    handEl.style.left = "0";
    handEl.style.top = "0";
    handEl.style.width = "32px";
    handEl.style.height = "32px";
    handEl.style.backgroundImage = `url("${u("assets/Cursor/light/cursor.png")}")`;
    handEl.style.backgroundSize = "contain";
    handEl.style.backgroundRepeat = "no-repeat";
    handEl.style.zIndex = "10000005";
    handEl.style.pointerEvents = "none";
    handEl.style.imageRendering = "pixelated";
    handEl.style.imageRendering = "whitespace-normal"; 
    handEl.style.imageRendering = "crisp-edges";
    handEl.style.imageRendering = "-moz-crisp-edges";
    
    handEl.style.willChange = "transform";
    handEl.style.backfaceVisibility = "hidden";
    handEl.style.contain = "layout paint";
    handEl.style.isolation = "isolate";
    document.body.appendChild(handEl);

    const enterFromLeft = Math.random() < 0.5;
    const startHandX = enterFromLeft ? -100 : _vw + 100;
    const exitX = enterFromLeft ? _vw + 150 : -150;
    const exitY = -150 + Math.random() * 100;
    const startHandY = -100;
    goodbyeHandEntryX = startHandX;

    const vs = getCatVisualScale();
    const petH = Math.round(activePetDef.cssHeight * vs);

    const updateHandPos = (hx, hy) => {
      handEl.style.transform = `translate3d(${Math.round(hx)}px, ${Math.round(hy)}px, 0)`;
    };

    const phase1StartTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const phase1Duration = 600;

    const animatePhase1 = (now) => {
      const elapsed = now - phase1StartTs;
      const t = Math.min(1, elapsed / phase1Duration);
      const ease = 1 - Math.pow(1 - t, 3); 

      goodbyeHandX = startHandX + ((feetX - 16) - startHandX) * ease;
      goodbyeHandY = startHandY + ((feetY - petH + 12) - startHandY) * ease;
      
      updateHandPos(goodbyeHandX, goodbyeHandY);

      if (t < 1) {
        goodbyeRafId = requestAnimationFrame(animatePhase1);
      } else {
        
        handEl.style.backgroundImage = `url("${u("assets/Cursor/light/grab.png")}")`;

        isDragging = false;
        state = "dragged";
        setAnimLocked("scared", 99999);

        goodbyeTimeoutId = setTimeout(() => {
          const startX = feetX;
          const startY = feetY;

          const phase2StartTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const phase2Duration = 1200;

          const animatePhase2 = (now) => {
            const elapsed = now - phase2StartTs;
            const t = Math.min(1, elapsed / phase2Duration);
            const ease = t * t; 

            feetX = startX + (exitX - startX) * ease;
            feetY = startY + (exitY - startY) * ease;
            facingLeft = exitX < startX;

            applyTransform(now);

            goodbyeHandX = feetX - 16;
            goodbyeHandY = feetY - petH + 12;
            updateHandPos(goodbyeHandX, goodbyeHandY);

            if (t < 1) {
              goodbyeRafId = requestAnimationFrame(animatePhase2);
            } else {
              
              isPlayingGoodbye = false;
              handEl.remove();
              goodbyeHandEl = null;
              goodbyeRafId = null;
              goodbyeTimeoutId = null;
              if (typeof onComplete === 'function') onComplete();
            }
          };

          goodbyeRafId = requestAnimationFrame(animatePhase2);
        }, 150); 
      }
    };

    goodbyeRafId = requestAnimationFrame(animatePhase1);
  }

  function cancelGoodbyeAnimation() {
    if (!isPlayingGoodbye) return;
    
    isDestroyed = false;
    isPlayingGoodbye = false;
    isDragging = false; 
    lastTs = null;      
    lastUpdateTs = null;
    
    if (goodbyeHandEl) {
      const exitHandEl = goodbyeHandEl;
      goodbyeHandEl = null; 
      
      const startX = goodbyeHandX;
      const startY = goodbyeHandY;
      const targetX = goodbyeHandEntryX < _vw / 2 ? -100 : _vw + 100;
      const targetY = -100;
      
      const startTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const duration = 800; 
      
      const animateHandExit = (now) => {
        const elapsed = now - startTs;
        const t = Math.min(1, elapsed / duration);
        const easeIn = t * t; 
        
        const hx = startX + (targetX - startX) * easeIn;
        const hy = startY + (targetY - startY) * easeIn;
        
        exitHandEl.style.transform = `translate3d(${Math.round(hx)}px, ${Math.round(hy)}px, 0)`;
        
        if (t < 1) {
          requestAnimationFrame(animateHandExit);
        } else {
          exitHandEl.remove();
        }
      };

      exitHandEl.style.backgroundImage = `url("${u("assets/Cursor/light/cursor.png")}")`;
      requestAnimationFrame(animateHandExit);
    }
    
    if (goodbyeRafId) {
      cancelAnimationFrame(goodbyeRafId);
      goodbyeRafId = null;
    }
    if (goodbyeTimeoutId) {
      clearTimeout(goodbyeTimeoutId);
      goodbyeTimeoutId = null;
    }
    
    animLockTimer = 0; 
    if (state === "dragged") {
      state = "jump"; 
      onGround = false;
      isJumping = true;
      velX = 0;
      velY = 120; 
    }
    applyTransform();
  }

  function abortSpawnAndCarryOut(onComplete) {
    
    if (spawnRafId) {
      cancelAnimationFrame(spawnRafId);
      spawnRafId = null;
    }
    
    isDestroyed = true;
    isPlayingSpawnCarry = false;
    isPlayingGoodbye = true; 
    
    const handEl = spawnHandEl;
    goodbyeHandEl = handEl; 
    goodbyeHandEntryX = spawnStartX; 
    
    if (!handEl) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }
    
    const startX = feetX;
    const startY = feetY;
    const exitX = spawnStartX;
    const exitY = spawnStartY;
    
    const vs = getCatVisualScale();
    const petH = Math.round(activePetDef.cssHeight * vs);
    
    const updateHandPos = (hx, hy) => {
      handEl.style.transform = `translate3d(${Math.round(hx)}px, ${Math.round(hy)}px, 0)`;
    };
    
    const startTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = 1000; 
    
    const animateAbort = (now) => {
      const elapsed = now - startTs;
      const t = Math.min(1, elapsed / duration);
      const ease = t * t; 
      
      feetX = startX + (exitX - startX) * ease;
      feetY = startY + (exitY - startY) * ease;
      facingLeft = exitX < startX;
      
      applyTransform(now);
      
      goodbyeHandX = feetX - 16;
      goodbyeHandY = feetY - petH + 12;
      updateHandPos(goodbyeHandX, goodbyeHandY);
      
      if (t < 1) {
        goodbyeRafId = requestAnimationFrame(animateAbort);
      } else {
        isPlayingGoodbye = false;
        handEl.remove();
        goodbyeHandEl = null;
        goodbyeRafId = null;
        goodbyeTimeoutId = null;
        spawnHandEl = null;
        if (typeof onComplete === 'function') onComplete();
      }
    };
    
    goodbyeRafId = requestAnimationFrame(animateAbort);
  }

  function revealCatWhenReady() {
    let revealed = false;
    const reveal = () => {
      if (revealed || isDestroyed || !catEl.isConnected) return;
      revealed = true;
      if (skipSpawnAnimation) return;
      playSpawnCursorAnimation();
    };

    const startRevealSequence = () => {
      
      const img = new Image();
      img.onload = () => addTimeout(reveal, 40);
      img.onerror = reveal;
      img.src =
        activePetDef && activePetDef.sheet ? activePetDef.sheet : CAT_SHEET;
      addTimeout(reveal, 700);
    };

    const scheduleReveal = () => {

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => {

          addTimeout(startRevealSequence, 400);
        }, { timeout: 3000 }); 
      } else {
        
        addTimeout(startRevealSequence, 1200);
      }
    };

    if (document.readyState === "complete") {
      scheduleReveal();
    } else {
      window.addEventListener("load", scheduleReveal, { once: true });
    }
  }

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    
    if ((!catEnabled && !isPlayingGoodbye) || !isTabVisible) {
      lastTs = null;
      lastUpdateTs = null;
      return;
    }
    if (!lastTs) {
      lastTs = ts;
      lastUpdateTs = ts;
      lastLogicTs = ts;
      return;
    }

    if (!isDragging) {
      const targetFrameMs = isIdleTickState() ? IDLE_FRAME_MS : ACTIVE_FRAME_MS;
      if (targetFrameMs > 0 && ts - lastTs < targetFrameMs - 0.5) return;
    }
    lastTs = ts;

    const rawDt = Math.max(0, (ts - lastUpdateTs) / 1000);
    const frameDt = Math.min(0.16, rawDt);
    const dt = Math.min(0.05, frameDt);
    lastUpdateTs = ts;

    const pageSettling = isPageSettling();
    if (!lowPowerMode) {
      updateBubbleTrap(dt, pageSettling);
    }

    if (!isDragging && !isInPortal) {
      if (quickSpawnMenuOpen) {

        holdPetForQuickMenu(false);
        lastLogicTs = ts;
      } else {

        if (!pageSettling && ts - lastLogicTs > 100) {
          const logicDt = Math.min(
            0.22,
            Math.max(0.01, (ts - lastLogicTs) / 1000),
          );
          _logicRectCache.clear();
          updateState(logicDt);
          lastLogicTs = ts;
        } else if (pageSettling && onGround && feetY < _vh - 24) {
          velX *= 0.55;
          velY = 0;
          isJumping = false;
        }
      }

      const physicsSteps =
        !pageSettling && !lowPowerMode && frameDt > 0.026
          ? Math.min(5, Math.ceil(frameDt / (1 / 60)))
          : 1;
      const physicsDt = physicsSteps > 1 ? frameDt / physicsSteps : dt;
      for (let step = 0; step < physicsSteps; step++) {
        updatePhysics(physicsDt);
        if (!pageSettling) updateSmashes(physicsDt);
      }
      if (!pageSettling) monitorGeneralStuck(frameDt);
      syncMovementAnimation(false);
      normalizeGroundedCalmAnimation();
    }

    tickAnim(frameDt);
    applyPos(ts);
    if (!lowPowerMode) updateWeightFootsteps(dt);

    companionThinkTimer += dt;
    if (
      !lowPowerMode &&
      PixelCatRuntime.instances.length > 1 &&
      !isDragging &&
      !quickSpawnMenuOpen &&
      companionThinkTimer >= 0.35
    ) {
      companionThinkTimer = 0;
      const other = PixelCatRuntime.instances.find((c) => c !== api);
      if (other) {
        const dx = other.feetX - feetX;
        const dy = other.feetY - feetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isClose = dist < 80;

        if (
          isIdleTickState() &&
          isClose &&
          other.isJumping &&
          other.velY > 200 &&
          Math.random() < 0.2
        ) {
          facingLeft = dx < 0; 
          applyTransform();
          setAnimLocked("scared", 1000);
          state = "stunned";
          stateTimer = 1000;
        }

        if (
          isIdleTickState() &&
          isClose &&
          other.state !== "jump" &&
          other.state !== "stunned" &&
          Math.random() < 0.025
        ) {
          
          if (Math.random() < 0.1 && other.state !== "scared") {
            facingLeft = dx < 0;
            applyTransform();
            setAnimLocked("scared", 800);
            state = "stunned";
            stateTimer = 800;
            other.go("spook"); 
            
          } else if (Math.random() < 0.25) {
            facingLeft = dx < 0;
            applyTransform();
            setAnimLocked("paw", 1500);
            
            if (Math.random() < 0.5) {
              other.facingLeft = !facingLeft;
              other.go("pawplay");
            }
            
          } else if (Math.random() < 0.4) {
            facingLeft = dx < 0;
            applyTransform();
            go("headtilt");
            
          } else if (Math.random() < 0.5) {
            facingLeft = dx < 0;
            applyTransform();
            go("sit");
          }
        } else if (
          isIdleTickState() &&
          !isClose &&
          dist < 300 &&
          Math.random() < 0.01
        ) {
          
          if (isCompanion || Math.random() < 0.3) {
            targetX = other.feetX + (Math.random() < 0.5 ? 40 : -40);
            go("wander"); 
          }
        }
      }
    }

    if (!pageSettling && !lowPowerMode) {
      if (!isCompanion && !isPigeonPet() && !isClippyPet()) {
        updateFishes(dt);
        updateBalls(dt);
      } else if (isPigeonPet()) {
        enforcePigeonRestrictions();
      } else if (isFrogPet()) {
        enforceFrogRestrictions();
      } else if (isClippyPet()) {
        enforceClippyRestrictions();
      }

      if (!isPigeonPet() && (portalEnabled || portalModule.activePortals.length > 0)) {
        updatePortals(dt);

        if (!isCompanion && portalEnabled) {
          const portalSpawnBlocked =
            portalModule.activePortals.length > 0 || hasActivePickup();
          if (portalSpawnBlocked) {
            portalTimerPausedForObject = true;
          } else {
            if (portalTimerPausedForObject) {
              portalSpawnTimer = nextPortalSpawnDelay();
              portalTimerPausedForObject = false;
            }
            portalSpawnTimer -= dt;
            if (portalSpawnTimer <= 0) {
              if (spawnPortalPair()) {
                portalSpawnTimer = nextPortalSpawnDelay();
                portalTimerPausedForObject = true;
              } else {
                portalSpawnTimer = nextPortalSpawnDelay();
              }
            }
          }
        } else if (!portalEnabled) {
          portalTimerPausedForObject = false;
        }

        if (portalCooldown > 0) {
          portalCooldown -= dt;
        } else {
          const portal = checkCatPortalCollision(feetX, feetY);
          if (portal && !isInPortal) {
            const destination = teleportCat(portal);
            if (destination) {
              
              isInPortal = true;
              const prevVelX = velX;
              const prevVelY = velY;
              velX = 0;
              velY = 0;

              const startX = feetX;
              const startY = feetY;
              const enterDuration = 450; 
              const exitDuration = 450;  
              const startTime = performance.now();

              setAnimLocked("jump", enterDuration + exitDuration + 200);

              const stepEnter = (now) => {
                if (!isInPortal) return;
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / enterDuration);
                const ease = progress * progress; 

                feetX = startX + (portal.x - startX) * ease;
                feetY = startY + (portal.y - startY) * ease;
                portalTransformScale = Math.max(0, 1.0 - ease);
                portalTransformRotate = ease * 720; 
                applyPos();

                if (progress < 1) {
                  requestAnimationFrame(stepEnter);
                } else {
                  catEl.style.opacity = "0";
                  addTimeout(() => {
                    if (!isInPortal) return;
                    const destPortal = destination.portal;
                    const outStartX = destPortal ? destPortal.x : destination.x;
                    const outStartY = destPortal ? destPortal.y : destination.y;
                    const outTargetX = destination.x;
                    const outTargetY = destination.y;
                    const outStartTime = performance.now();
                    catEl.style.opacity = "1";

                    const stepExit = (now2) => {
                      if (!isInPortal) return;
                      const elapsed2 = now2 - outStartTime;
                      const progress2 = Math.min(1, elapsed2 / exitDuration);
                      const ease2 = 1 - Math.pow(1 - progress2, 3); 

                      feetX = outStartX + (outTargetX - outStartX) * ease2;
                      feetY = outStartY + (outTargetY - outStartY) * ease2;
                      portalTransformScale = ease2; 
                      portalTransformRotate = (1 - ease2) * -720;
                      applyPos();

                      if (progress2 < 1) {
                        requestAnimationFrame(stepExit);
                      } else {
                        portalTransformScale = 1.0;
                        portalTransformRotate = 0;
                        applyPos();
                        velX = prevVelX;
                        velY = prevVelY;
                        portalCooldown = 1.5;
                        isInPortal = false;
                        if (portalModule.closePortal) {
                          portalModule.closePortal(portal);
                        }
                      }
                    };
                    requestAnimationFrame(stepExit);
                  }, 120);
                }
              };
              requestAnimationFrame(stepEnter);
            }
          }
        }
      }

      if (
        !isCompanion &&
        (spiderEnabled || activeSpiders.length > 0 || activeWebs.length > 0)
      ) {
        if (spiderEnabled) {
          const spiderSpawnBlocked =
            activeSpiders.length > 0 ||
            activeWebs.length > 0 ||
            hasActivePickup();
          if (spiderSpawnBlocked) {
            spiderTimerPausedForObject = true;
          } else {
            if (spiderTimerPausedForObject) {
              spiderSpawnTimer = nextSpiderSpawnDelay();
              spiderTimerPausedForObject = false;
            }
            spiderSpawnTimer -= dt;
            if (spiderSpawnTimer <= 0) {
              if (spawnSpider()) {
                spiderSpawnTimer = nextSpiderSpawnDelay();
                spiderTimerPausedForObject = true;
              } else {
                spiderSpawnTimer = nextSpiderSpawnDelay();
              }
            }
          }
        } else {
          spiderTimerPausedForObject = false;
        }
      }
      
      if (!isCompanion) updateCoinDrops(dt);
    }
  }

  applySkin(catSkinStr);
  pickIdleVariant();
  setAnim("idle1");
  setDir(false);
  applyPos();
  revealCatWhenReady();
  go("sit");
  applyPowerModeSettings();
  if (lowPowerMode) applyEcoRuntimeRestrictions();
  scheduleIdleChatter(15000 + Math.random() * 30000);
  if (!PixelCatRuntime.instances.includes(api)) {
    PixelCatRuntime.instances.push(api);
  }
  getLocal({ showOnAllTabs: false })
    .then((d) => {
      if (!isDestroyed) showOnAllTabsEnabled = d.showOnAllTabs === true;
    })
    .catch(() => {});
  rafId = requestAnimationFrame(loop);

  function normalizePet(pet) {
    if (pet === "pet_fox" || pet === "fox") return "fox";
    if (pet === "pet_red_panda" || pet === "red_panda") return "red_panda";
    if (pet === "pet_pigeon" || pet === "pigeon") return "pigeon";
    if (pet === "pet_skeleton" || pet === "skeleton") return "skeleton";
    if (pet === "pet_frog" || pet === "frog") return "frog";
    if (pet === "pet_penguin" || pet === "penguin") return "penguin";
    if (pet === "pet_fairy" || pet === "fairy") return "fairy";
    if (pet === "pet_clippy" || pet === "clippy") return "clippy";
    if (pet === "pet_bat" || pet === "bat") return "bat";
    return "cat";
  }

  function getStoragePetId(pet) {
    const norm = normalizePet(pet);
    if (norm === "fox") return "pet_fox";
    if (norm === "red_panda") return "pet_red_panda";
    if (norm === "pigeon") return "pet_pigeon";
    if (norm === "skeleton") return "pet_skeleton";
    if (norm === "frog") return "pet_frog";
    if (norm === "babycat") return "pet_babycat";
    if (norm === "penguin") return "pet_penguin";
    if (norm === "fairy") return "pet_fairy";
    if (norm === "clippy") return "pet_clippy";
    if (norm === "bat") return "pet_bat";
    return "pet_cat";
  }

  function applyPet(pet) {
    // --- Release any active traps/pickups ---
    if (bubbleTrap && bubbleTrap.active) releaseFromBubbleTrap();
    releaseActivePickup("fish");
    releaseActivePickup("ball");

    // --- Clear combat / mischief / UI attack state ---
    attackEl = null;
    attackPhase = "move";
    attackHitTimer = 0;
    uiTarget = null;
    uiWallTask = null;
    fightAnimCount = 0;

    // --- Clear breeding state ---
    breedingPartner = null;
    breedingTargetX = 0;
    breedingPhase = null;
    jealousTarget = null;

    // --- Clear pigeon-specific state ---
    pigeonGroundedByUser = false;
    pigeonFollowsCursor = false;
    pigeonFlightPhase = 0;
    pigeonPeckCooldown = 15000;

    // --- Clear fairy-specific state ---
    fairyGroundedByUser = false;
    fairyFlightPhase = 0;
    fairyFlightTime = 0;
    fairyFlightTargetX = 0;
    fairyFlightTargetY = 0;

    // --- Clear frog-specific state ---
    frogConsecutiveCroaks = 0;
    frogIdleCooldownCycles = 0;

    // --- Clear physics & drag state ---
    velX = 0;
    velY = 0;
    catDragVX = 0;
    catDragVY = 0;
    isDragging = false;
    dragOffX = 0;
    dragOffY = 0;
    lastCatDragX = 0;
    lastCatDragY = 0;
    lastCatDragTs = 0;
    catThrowHeavyTimer = 0;
    globalRot = 0;
    visualRot = 0;
    portalTransformScale = 1.0;
    portalTransformRotate = 0;

    // --- Clear stuck / pathfind timers ---
    pathfindCooldown = 0;
    chaseStuckTimer = 0;
    lastChaseDistToTarget = 9999;
    chaseDropThroughUntil = 0;
    coinStuckCheckTimer = 0;
    lastCoinChaseX = 0;
    ballStuckCheckTimer = 0;
    lastBallChaseX = 0;
    generalStuckTimer = 0;
    stuckSampleTimer = 0;
    lastStuckSampleX = 0;
    lastStuckSampleY = 0;
    lastGeneralUnstuckAt = 0;
    stuckCheckTimer = 0;
    lastFishChaseX = 0;

    // --- Clear platform grounding state ---
    groundedPlatformEl = null;
    groundedPlatformOffsetX = 0;
    groundedPlatformLastSeenAt = 0;
    groundedPlatformGraceUntil = 0;

    // --- Clear deep sleep & energy accumulators ---
    isDeepSleep = false;
    idleAccum = 0;
    catBoredom = 0;
    catHunger = 0;

    // --- Clear animation lock & timing ---
    curAnim = null;
    animLockTimer = 0;
    stateTimer = 0;
    lastAnimTs = 0;
    weightStepTimer = 0;
    weightShakeUntil = 0;
    if (weightShakeAnimation) {
      try { weightShakeAnimation.cancel(); } catch (e) {}
      weightShakeAnimation = null;
    }
    stopSkinAnimation();

    // --- Apply new pet identity ---
    const normalizedPet = normalizePet(pet);
    activePet = normalizedPet;
    activePetStr = getStoragePetId(normalizedPet);
    activePetDef = PET_DEFS[normalizedPet] || PET_DEFS.cat;
    ANIMS = activePetDef.anims;
    spriteYOffset = activePetDef.yOffset;

    catEl.classList.remove(
      "pixelcat-pet-cat",
      "pixelcat-pet-fox",
      "pixelcat-pet-red-panda",
      "pixelcat-pet-pigeon",
      "pixelcat-pet-skeleton",
      "pixelcat-pet-frog",
      "pixelcat-pet-babycat",
      "pixelcat-pet-penguin",
      "pixelcat-pet-fairy",
      "pixelcat-pet-bat"
    );
    catEl.classList.add(activePetDef.className);
    catEl.style.backgroundImage = `url("${activePetDef.sheet}")`;

    updateCatElementSize();
    updateSpeed();

    // --- Clear any leftover visual particles from the previous pet ---
    cleanupAllVisualArtifacts();

// --- Restore position ---
    if (normalizedPet === "fairy" || isBatPet()) {
      // Fairies/bats spawn mid-air — put them at a random aerial position
      // to avoid landing-dust + ground-relaunch loop
      feetX = Math.round(Math.max(120, Math.min(_vw - 120, feetX)));
      feetY = Math.round(Math.max(80, Math.min(_vh * 0.5, _vh * (0.25 + Math.random() * 0.3))));
      onGround = false;
      isJumping = true;
      velX = (Math.random() - 0.5) * 120;
      velY = (Math.random() - 0.5) * 60;
    } else if (normalizedPet === "clippy") {
      feetX = Math.round(_vw - 90);
      feetY = Math.round(_vh - 35);
      onGround = true;
      isJumping = false;
      velX = 0;
      velY = 0;
    } else {
      onGround = true;
      isJumping = false;
      feetY = computeFloor(feetX);
    }

    setAnim(ANIMS[chosenIdle] ? chosenIdle : "idle1", true);
    clampCatInsideViewport();
    lastTransformStr = "";
    lastTransformOriginStr = "";
    applyTransform();

    // --- Apply per-pet skin & behavioral defaults ---
    if (normalizedPet === "fox" || normalizedPet === "red_panda") {
      applySkin(resolveFoxSkin(foxSkinStr));
      isAggressiveMode = false;
      uiMischiefEnabled = false;
      if (FOX_DISABLED_STATES.has(state)) go("sit");
    } else if (normalizedPet === "pigeon") {
      applySkin(resolvePigeonSkin(pigeonSkinStr));
      isAggressiveMode = false;
      uiMischiefEnabled = false;
      enforcePigeonRestrictions();
    } else if (normalizedPet === "clippy") {
      catEl.style.filter = "none";
      enforceClippyRestrictions();
    } else if (normalizedPet === "skeleton") {
      catEl.style.filter = "none";
      isAggressiveMode = false;
      uiMischiefEnabled = false;
      if (SKELETON_DISABLED_STATES.has(state)) go("sit");
    } else if (normalizedPet === "penguin") {
      catEl.style.filter = "none";
      isAggressiveMode = false;
      uiMischiefEnabled = false;
    } else if (normalizedPet === "bat") {
      applySkin(resolveBatSkin(batSkinStr));
      isAggressiveMode = false;
      uiMischiefEnabled = false;
      beginFairyFlight();
      go("wander");
    } else if (normalizedPet === "frog") {
      catEl.style.filter = "none";
      enforceFrogRestrictions();
    } else if (normalizedPet === "fairy") {
      catEl.style.filter = "none";
      beginFairyFlight();
      go("wander");
    } else {
      applySkin(resolveCatSkin(catSkinStr));
    }
  }

  function normalizeCatSkin(skin) {
    return ["white", "orange", "rainbow", "blue"].includes(skin) ? skin : "white";
  }

  function normalizeFoxSkin(skin) {
    return ["white", "orange", "rainbow", "blue"].includes(skin) ? skin : "orange";
  }

  function normalizePigeonSkin(skin) {
    return ["black", "white", "rainbow"].includes(skin) ? skin : "black";
  }

  function getAlternateSkin(skin) {
    if (skin === "orange") return "white";
    if (skin === "rainbow") return "orange";
    if (skin === "blue") return "orange";
    return "orange";
  }

  function resolveCatSkin(mainSkin) {
    const normalized = normalizeCatSkin(mainSkin);
    return isCompanion ? getAlternateSkin(normalized) : normalized;
  }

  function resolveFoxSkin(mainSkin) {
    const normalized = normalizeFoxSkin(mainSkin);
    return isCompanion ? getAlternateSkin(normalized) : normalized;
  }

  function resolvePigeonSkin(mainSkin) {
    const normalized = normalizePigeonSkin(mainSkin);
    if (!isCompanion) return normalized;
    if (normalized === "black") return "white";
    if (normalized === "white") return "black";
    if (normalized === "rainbow") return "white";
    return "white";
  }

  function stopSkinAnimation() {
    if (!skinAnimation) return;
    try {
      skinAnimation.cancel();
    } catch (e) {}
    skinAnimation = null;
  }

  function applySkin(skin) {
    if (isBatPet()) {
      const resolvedSkin = normalizeCatSkin(skin);
      batSkinStr = resolvedSkin;
      stopSkinAnimation();
      // Bat variants: Vampire (white/blue default), Fire (orange), Zombie (rainbow)
      const sheet =
        resolvedSkin === "white" || resolvedSkin === "blue"
          ? BAT_VAMPIRE_SHEET
          : resolvedSkin === "rainbow"
            ? BAT_ZOMBIE_SHEET
            : BAT_SHEET;
      if (PET_DEFS.bat.sheet !== sheet) {
        PET_DEFS.bat.sheet = sheet;
        if (catEl) catEl.style.backgroundImage = `url("${sheet}")`;
      }
      if (catEl) {
        if (resolvedSkin === "orange") {
          catEl.style.filter =
            "sepia(0.9) saturate(8) hue-rotate(-15deg) brightness(0.9) contrast(1.1)";
        } else {
          catEl.style.filter = "none";
        }
      }
      return;
    }
    if (isFrogPet()) {
      stopSkinAnimation();
      if (catEl) {
        if (isCompanion) {
          catEl.style.filter = "sepia(0.6) hue-rotate(65deg) saturate(2.2) brightness(0.72) contrast(1.15)";
        } else {
          catEl.style.filter = "none";
        }
      }
      return;
    }
    if (isClippyPet() || isSkeletonPet() || isPenguinPet()) {
      stopSkinAnimation();
      if (catEl) catEl.style.filter = "none";
      return;
    }
    if (isPigeonPet()) {
      const resolvedSkin = normalizePigeonSkin(skin);
      pigeonSkinStr = resolvedSkin;
      stopSkinAnimation();
      if (resolvedSkin === "white") {
        catEl.style.filter = "grayscale(1) brightness(2.1) contrast(1.15)";
        return;
      }
      if (resolvedSkin === "rainbow") {
        const rainbowBase =
          "sepia(1) saturate(7) hue-rotate(0deg) brightness(1.08) contrast(1.08)";
        catEl.style.filter = rainbowBase;
        if (typeof catEl.animate === "function") {
          skinAnimation = catEl.animate(
            [
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(0deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(72deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(144deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(216deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(288deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(360deg) brightness(1.08) contrast(1.08)",
              },
            ],
            { duration: 3600, iterations: Infinity, easing: "linear" },
          );
        }
        return;
      }
      catEl.style.filter = "none";
      return;
    }
    if (activePet === "fox" || activePet === "red_panda") {
      const resolvedSkin = normalizeFoxSkin(skin);
      foxSkinStr = resolvedSkin;
      stopSkinAnimation();
      if (resolvedSkin === "white") {
        catEl.style.filter = "grayscale(1) brightness(1.9) contrast(1.06)";
        return;
      }
      if (resolvedSkin === "blue") {
        catEl.style.filter = "hue-rotate(190deg) saturate(2.2) brightness(0.95) contrast(1.15)";
        return;
      }
      if (resolvedSkin === "rainbow") {
        const rainbowBase =
          "sepia(1) saturate(7) hue-rotate(0deg) brightness(1.08) contrast(1.08)";
        catEl.style.filter = rainbowBase;
        if (typeof catEl.animate === "function") {
          skinAnimation = catEl.animate(
            [
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(0deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(72deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(144deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(216deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(288deg) brightness(1.08) contrast(1.08)",
              },
              {
                filter:
                  "sepia(1) saturate(7) hue-rotate(360deg) brightness(1.08) contrast(1.08)",
              },
            ],
            { duration: 3600, iterations: Infinity, easing: "linear" },
          );
        }
        return;
      }
      catEl.style.filter = "none";
      return;
    }

    const resolvedSkin = normalizeCatSkin(skin);
    catSkinStr = resolvedSkin;
    stopSkinAnimation();
    if (resolvedSkin === "orange") {
      catEl.style.filter =
        "sepia(1) saturate(8) hue-rotate(-35deg) brightness(0.95) contrast(1.1)";
      return;
    }
    if (resolvedSkin === "blue") {
      catEl.style.filter =
        "sepia(1) saturate(8) hue-rotate(185deg) brightness(0.95) contrast(1.1)";
      return;
    }
    if (resolvedSkin === "rainbow") {
      const rainbowBase =
        "sepia(1) saturate(7) hue-rotate(0deg) brightness(1.08) contrast(1.08)";
      catEl.style.filter = rainbowBase;
      if (typeof catEl.animate === "function") {
        skinAnimation = catEl.animate(
          [
            {
              filter:
                "sepia(1) saturate(7) hue-rotate(0deg) brightness(1.08) contrast(1.08)",
            },
            {
              filter:
                "sepia(1) saturate(7) hue-rotate(72deg) brightness(1.08) contrast(1.08)",
            },
            {
              filter:
                "sepia(1) saturate(7) hue-rotate(144deg) brightness(1.08) contrast(1.08)",
            },
            {
              filter:
                "sepia(1) saturate(7) hue-rotate(216deg) brightness(1.08) contrast(1.08)",
            },
            {
              filter:
                "sepia(1) saturate(7) hue-rotate(288deg) brightness(1.08) contrast(1.08)",
            },
            {
              filter:
                "sepia(1) saturate(7) hue-rotate(360deg) brightness(1.08) contrast(1.08)",
            },
          ],
          { duration: 3600, iterations: Infinity, easing: "linear" },
        );
      }
      return;
    }
    catEl.style.filter = "none";
  }
} 

function getRuntimeFairPlay() {
  return typeof globalThis !== "undefined" ? globalThis.PixelCatFairPlay : null;
}

function isExtensionContextValid() {
  try {
    const api = typeof browser !== "undefined" ? browser : (typeof chrome !== "undefined" ? chrome : null);
    return !!(api && api.runtime && api.runtime.id);
  } catch (_) {
    return false;
  }
}

function getLocal(keys) {
  if (!isExtensionContextValid() || !extensionAPI || !extensionAPI.storage || !extensionAPI.storage.local) {
    return Promise.resolve(Object.assign({}, RUNTIME_SETTINGS_DEFAULTS, keys));
  }
  const fairPlay = getRuntimeFairPlay();
  try {
    if (
      fairPlay &&
      typeof fairPlay.hasProtectedKey === "function" &&
      fairPlay.hasProtectedKey(keys)
    ) {
      return fairPlay.ensure(extensionAPI.storage.local, keys).catch(() => Promise.resolve(Object.assign({}, RUNTIME_SETTINGS_DEFAULTS, keys)));
    }
    const result = extensionAPI.storage.local.get(keys, (res) => {
      if (extensionAPI && extensionAPI.runtime && extensionAPI.runtime.lastError) {}
    });
    if (result && typeof result.then === "function") {
      return result.catch(() => Promise.resolve(Object.assign({}, RUNTIME_SETTINGS_DEFAULTS, keys)));
    }
    return new Promise((resolve) => {
      try {
        extensionAPI.storage.local.get(keys, (res) => resolve(res || Object.assign({}, RUNTIME_SETTINGS_DEFAULTS, keys)));
      } catch (_) {
        resolve(Object.assign({}, RUNTIME_SETTINGS_DEFAULTS, keys));
      }
    });
  } catch (err) {
    return Promise.resolve(Object.assign({}, RUNTIME_SETTINGS_DEFAULTS, keys));
  }
}

function setLocal(data) {
  if (!isExtensionContextValid() || !extensionAPI || !extensionAPI.storage || !extensionAPI.storage.local) {
    return Promise.resolve();
  }
  const fairPlay = getRuntimeFairPlay();
  try {
    if (
      fairPlay &&
      typeof fairPlay.hasProtectedKey === "function" &&
      fairPlay.hasProtectedKey(data)
    ) {
      return fairPlay.commit(extensionAPI.storage.local, data).catch(() => Promise.resolve());
    }
    const result = extensionAPI.storage.local.set(data, () => {
      if (extensionAPI && extensionAPI.runtime && extensionAPI.runtime.lastError) {}
    });
    if (result && typeof result.then === "function") {
      return result.catch(() => Promise.resolve());
    }
    return new Promise((resolve) => {
      try {
        extensionAPI.storage.local.set(data, () => resolve());
      } catch (_) {
        resolve();
      }
    });
  } catch (err) {
    return Promise.resolve();
  }
}

const RUNTIME_SETTINGS_DEFAULTS = {
  catEnabled: true,
  companionEnabled: false,
  catSkin: "white",
  foxSkin: "orange",
  pigeonSkin: "black",
  activeHat: "hat_none",
  spiderEnabled: false,
  ballEnabled: false,
  portalEnabled: false,
  aggressiveMode: true,
  wallClimbEnabled: false,
  uiMischiefEnabled: false,
  speechEnabled: false,
  memoryEnabled: false,
  rareEventsEnabled: true,
  autoFishSpawnEnabled: false,
  lowPowerMode: false,
  hideInFullscreen: false,
  showOnAllTabs: false,
  sizeMultiplier: 1.0,
  uiMischiefRate: 11,
  catEnergyLevel: "active",
  speedMultiplier: 1.0,
  loyalMode: false,
  uiLanguage: "en",
  ollamaEnabled: false,
  catXP: 0,
  shopOwned: [],
  shopActiveBoosts: null,
  activeBall: "ball_baseball",
  activePet: "pet_cat",
  disabledSites: "none",
  disabledSitesList: [],
  siteFilterMode: "blacklist",
  petName: "",
  petSex: "",
  dragHandEnabled: false,
  freePlayMode: false,
  unlockAll: false,
};

function isSiteBlocked(disabledSites, disabledSitesList, siteFilterMode) {
  const host = (location.hostname || location.host || "").toLowerCase();
  if (!host) return false;

  const mode = siteFilterMode || "blacklist";

  let matchesList = false;
  if (Array.isArray(disabledSitesList) && disabledSitesList.length > 0) {
    for (let site of disabledSitesList) {
      if (!site || typeof site !== "string") continue;
      const cleanSite = site.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (cleanSite.length > 0) {
        if (host === cleanSite || host.endsWith('.' + cleanSite)) {
          matchesList = true;
          break;
        }
      }
    }
  }

  if (!matchesList && disabledSites && disabledSites !== "none") {
    if (disabledSites === "youtube" && (host === "youtube.com" || host.endsWith(".youtube.com"))) matchesList = true;
    if (disabledSites === "google" && (host === "google.com" || host.endsWith(".google.com"))) matchesList = true;
    if (disabledSites === "reddit" && (host === "reddit.com" || host.endsWith(".reddit.com"))) matchesList = true;
  }

  if (mode === "allowlist") {
    return !matchesList;
  } else {
    return matchesList;
  }
}

function requestActivePetState() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value || null);
    };
    try {
      const message = { action: "get_active_pet_state" };
      if (typeof browser !== "undefined" && browser.runtime && typeof browser.runtime.sendMessage === "function") {
        browser.runtime.sendMessage(message).then(finish).catch(() => finish(null));
      } else if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.sendMessage === "function") {
        chrome.runtime.sendMessage(message, finish);
      } else {
        finish(null);
      }
    } catch (_) {
      finish(null);
    }
    setTimeout(() => finish(null), 1500);
  });
}

let _ownershipRetryTimer = null;
function scheduleOwnershipRetry() {
  if (_ownershipRetryTimer) return;
  _ownershipRetryTimer = setTimeout(() => {
    _ownershipRetryTimer = null;
    initCatSpawning();
  }, 700);
}

let lastTransferReceivedAt = 0;
function withinTransferGracePeriod() {
  return Date.now() - lastTransferReceivedAt < 1500;
}

function initCatSpawning(onResult) {
  Promise.all([getLocal(RUNTIME_SETTINGS_DEFAULTS), requestActivePetState()]).then(([rawData, ownerState]) => {
    const data = sanitizeLevelLockedSettings(rawData);

    const blocked = isSiteBlocked(data.disabledSites, data.disabledSitesList, data.siteFilterMode);
    const ownerKnown = ownerState && typeof ownerState.isOwner === "boolean";
    if (!ownerKnown && data.showOnAllTabs !== true) {
      // The background script didn't answer in time (its service worker was
      // likely asleep). Do NOT guess from document.hidden here: when several
      // browser windows are open side by side, every one of their visible
      // tabs reports document.hidden === false, so guessing "active" used to
      // make multiple windows spawn their own pet at once (the "ghost pet"
      // running invisibly / stray dust in tabs that shouldn't have one).
      // Safer to spawn nothing and retry shortly, once the background script
      // has had a chance to wake up and answer definitively.
      scheduleOwnershipRetry();
    }
    const allowSpawn = data.showOnAllTabs === true
      ? true
      : (ownerKnown ? ownerState.isOwner === true : false);

    const wantMain = data.catEnabled === true && !blocked && allowSpawn;
    const wantComp = data.companionEnabled === true && !blocked && allowSpawn;

    const existingMainInst = PixelCatRuntime.instances.find((cat) => !cat.isCompanion);
    const existingCompInst = PixelCatRuntime.instances.find((cat) => cat.isCompanion);

    const foxLike =
      data.activePet === "pet_fox" ||
      data.activePet === "fox" ||
      data.activePet === "pet_skeleton" ||
      data.activePet === "skeleton" ||
      data.activePet === "pet_red_panda" ||
      data.activePet === "red_panda";
    const skin = foxLike ? data.foxSkin || "orange" : data.catSkin || "white";

    if (wantMain) {
      if (existingMainInst) {
        if (existingMainInst.isPlayingGoodbye) {
          try { existingMainInst.cancelGoodbye(); } catch (_) {}
        }
      } else {
        spawnPixelCat("youtube-pixel-cat-main", false, skin);
      }
    } else {
      if (existingMainInst && !withinTransferGracePeriod()) {
        try {
          if (typeof existingMainInst.destroyInstant === "function") existingMainInst.destroyInstant();
          else existingMainInst.destroy();
        } catch (_) {}
      }
    }

    if (wantComp) {
      if (existingCompInst) {
        if (existingCompInst.isPlayingGoodbye) {
          try { existingCompInst.cancelGoodbye(); } catch (_) {}
        }
      } else {
        spawnPixelCat("youtube-pixel-cat-companion", true, skin);
      }
    } else {
      if (existingCompInst && !withinTransferGracePeriod()) {
        try {
          if (typeof existingCompInst.destroyInstant === "function") existingCompInst.destroyInstant();
          else existingCompInst.destroy();
        } catch (_) {}
      }
    }

    PixelCatRuntime.instances.forEach((cat) => {
      if (cat.updateSettings) cat.updateSettings(data);
    });

    if (typeof onResult === "function") onResult(true);
  });
}

function removeStaleCatPets() {
  try {
    if (typeof PixelCatRuntime !== "undefined" && Array.isArray(PixelCatRuntime.instances)) {
      PixelCatRuntime.instances.slice().forEach((inst) => {
        try { if (inst && typeof inst.destroy === "function") inst.destroy(); } catch (_) {}
      });
      PixelCatRuntime.instances.length = 0;
    }

    const root = document.body || document.documentElement;
    if (!root) return;
    root.querySelectorAll("#youtube-pixel-cat-main, #youtube-pixel-cat-companion").forEach((el) => {
      try {
        if (el && el.isConnected) el.remove();
      } catch (_) {}
    });
  } catch (_) {}
}

function startFreshSpawning() {
  removeStaleCatPets();
  initCatSpawning();
}

if (document.body) {
  startFreshSpawning();
} else {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      startFreshSpawning();
    },
    { once: true },
  );
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    setTimeout(() => initCatSpawning(), 80);
  }
});

window.addEventListener("pageshow", () => {
  setTimeout(() => initCatSpawning(), 80);
});

// --- Ownership reconciliation ---
// Runs quietly in the background of every tab. Its only job is to correct
// two failure modes that no single message-based trigger can fully cover:
//   1) A tab keeps a pet running (and animating/spawning dust) after it
//      should have handed ownership off — e.g. a "deactivate_tab_pet"
//      message got dropped, or the tab wasn't tracked as the previous owner
//      in the first place. This is the "ghost pet still running in a tab
//      with no visible pet" behavior.
//   2) A tab that legitimately owns the pet has none running — e.g. a
//      missed "activate_tab_pet" message. This is the "pet disappears for
//      no reason" behavior.
// Both self-correct within one interval tick without needing the user to
// switch tabs or reload.
let _reconcileOwnershipInFlight = false;
function reconcileOwnership() {
  if (_reconcileOwnershipInFlight || document.hidden) return;
  _reconcileOwnershipInFlight = true;
  Promise.all([
    getLocal({ showOnAllTabs: false, catEnabled: true }),
    requestActivePetState(),
  ]).then(([data, ownerState]) => {
    _reconcileOwnershipInFlight = false;
    if (data.showOnAllTabs === true) return; // nothing to reconcile in this mode

    const ownerKnown = ownerState && typeof ownerState.isOwner === "boolean";
    if (!ownerKnown) return; // background didn't answer this round; try again next tick

    const hasInstances = PixelCatRuntime.instances.length > 0;
    if (!ownerState.isOwner && hasInstances && !withinTransferGracePeriod()) {
      PixelCatRuntime.instances.slice().forEach((cat) => {
        try {
          if (cat && typeof cat.destroyInstant === "function") cat.destroyInstant();
          else if (cat && typeof cat.destroy === "function") cat.destroy();
        } catch (_) {}
      });
      PixelCatRuntime.instances.length = 0;
    } else if (ownerState.isOwner && !hasInstances && data.catEnabled) {
      initCatSpawning();
    }
  }).catch(() => {
    _reconcileOwnershipInFlight = false;
  });
}
setInterval(reconcileOwnership, 6000);

function clampRuntimeNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeLevelLockedSettings(data) {
  const xp = Math.min(270, Math.max(0, Number(data.catXP) || 0));
  const isFreePlay = Boolean(data && (data.freePlayMode || data.unlockAll));
  const foxActive =
    data.activePet === "pet_fox" ||
    data.activePet === "fox" ||
    data.activePet === "pet_skeleton" ||
    data.activePet === "skeleton" ||
    data.activePet === "pet_red_panda" ||
    data.activePet === "red_panda" ||
    data.activePet === "pet_penguin" ||
    data.activePet === "penguin";
  const clippyActive =
    data.activePet === "pet_clippy" || data.activePet === "clippy";
  const batActive =
    data.activePet === "pet_bat" || data.activePet === "bat";
  if (batActive) data.companionEnabled = false;
  if (!clippyActive) data.speechEnabled = false;
  if (clippyActive) {
    data.companionEnabled = false;
    data.loyalMode = false;
  }
  if (!isFreePlay && xp < 10) data.speechEnabled = false;
  if (!isFreePlay && xp < 10) data.ballEnabled = false;
  if (!isFreePlay && xp < 25) data.spiderEnabled = false;
  if (!isFreePlay && xp < 25 && data.catSkin === "rainbow") data.catSkin = "white";
  if (!isFreePlay && xp < 25 && data.foxSkin === "rainbow") data.foxSkin = "orange";
  if (!isFreePlay && xp < 25 && data.pigeonSkin === "rainbow") data.pigeonSkin = "black";
  if (!isFreePlay && xp < 70) data.companionEnabled = false;
  if (!isFreePlay && xp < 100 && !foxActive) data.uiMischiefEnabled = false;
  if (foxActive) data.uiMischiefEnabled = false;
  if (foxActive) data.aggressiveMode = false;
  const pigeonActive =
    data.activePet === "pet_pigeon" || data.activePet === "pigeon";
  if (pigeonActive) {
    data.autoFishSpawnEnabled = false;
    data.ballEnabled = false;
    data.portalEnabled = false;
  }
  if (!isFreePlay && xp < 135) data.portalEnabled = false;
  if (!isFreePlay && xp < 175 && data.catEnergyLevel === "hyper")
    data.catEnergyLevel = "active";
  if (data.lowPowerMode) {
    data.companionEnabled = false;
    data.aggressiveMode = false;
    data.uiMischiefEnabled = false;
    data.speechEnabled = false;
    data.memoryEnabled = false;
    data.rareEventsEnabled = false;
    data.autoFishSpawnEnabled = false;
    data.ballEnabled = false;
    data.spiderEnabled = false;
    data.portalEnabled = false;
    data.catEnergyLevel = "sleepy";
  }

  return data;
}

function sanitizeRuntimeSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings))
    return null;
  const clean = {};
  const boolKeys = [
    "loyalMode",
    "aggressiveMode",
    "wallClimbEnabled",
    "uiMischiefEnabled",
    "speechEnabled",
    "ollamaEnabled",
    "memoryEnabled",
    "rareEventsEnabled",
    "autoFishSpawnEnabled",
    "ballEnabled",
    "spiderEnabled",
    "portalEnabled",
    "lowPowerMode",
    "hideInFullscreen",
    "showOnAllTabs",
    "dragHandEnabled",
    "freePlayMode",
    "unlockAll",
  ];
  boolKeys.forEach((key) => {
    if (typeof settings[key] === "boolean") clean[key] = settings[key];
  });
  if ("speedMultiplier" in settings)
    clean.speedMultiplier = clampRuntimeNumber(
      settings.speedMultiplier,
      0.5,
      2.5,
      1.0,
    );
  if ("sizeMultiplier" in settings)
    clean.sizeMultiplier = clampRuntimeNumber(
      settings.sizeMultiplier,
      0.5,
      2.5,
      1.0,
    );
  if ("uiMischiefRate" in settings)
    clean.uiMischiefRate = Math.round(
      clampRuntimeNumber(settings.uiMischiefRate, 0, 100, 11),
    );
  if (["sleepy", "active", "hyper"].includes(settings.catEnergyLevel))
    clean.catEnergyLevel = settings.catEnergyLevel;
  if (["en", "fr", "it", "ar"].includes(settings.uiLanguage))
    clean.uiLanguage = settings.uiLanguage;
  if (["white", "orange", "rainbow", "blue"].includes(settings.catSkin))
    clean.catSkin = settings.catSkin;
  if (["white", "orange", "rainbow", "blue"].includes(settings.foxSkin))
    clean.foxSkin = settings.foxSkin;
  if (["black", "white", "rainbow"].includes(settings.pigeonSkin))
    clean.pigeonSkin = settings.pigeonSkin;
  if (
    typeof settings.activeBall === "string" &&
    /^ball_[a-z0-9_]{1,40}$/.test(settings.activeBall)
  )
    clean.activeBall = settings.activeBall;
  if (
    typeof settings.activePet === "string" &&
    /^pet_[a-z0-9_]{1,40}$/.test(settings.activePet)
  )
    clean.activePet = settings.activePet;
  if (
    typeof settings.activeHat === "string" &&
    /^hat_[a-z0-9_]{1,40}$/.test(settings.activeHat)
  )
    clean.activeHat = settings.activeHat;
  if (["none", "youtube", "google", "reddit"].includes(settings.disabledSites))
    clean.disabledSites = settings.disabledSites;
  if (Array.isArray(settings.disabledSitesList)) {
    clean.disabledSitesList = settings.disabledSitesList
      .filter((s) => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().toLowerCase())
      .slice(0, 100);
  }
  if (["blacklist", "allowlist"].includes(settings.siteFilterMode)) {
    clean.siteFilterMode = settings.siteFilterMode;
  }
  if (typeof settings.petName === "string")
    clean.petName = settings.petName.slice(0, 40);
  if (["", "male", "female"].includes(settings.petSex))
    clean.petSex = settings.petSex;
  if (Array.isArray(settings.shopOwned)) {
    clean.shopOwned = settings.shopOwned
      .filter((id) => typeof id === "string" && /^[a-z0-9_]{1,40}$/.test(id))
      .slice(0, 50);
  }
  if (Array.isArray(settings.shopActiveBoosts)) {
    clean.shopActiveBoosts = settings.shopActiveBoosts
      .filter((id) => typeof id === "string" && /^[a-z0-9_]{1,40}$/.test(id))
      .slice(0, 50);
  }
  return Object.keys(clean).length ? clean : null;
}

extensionAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object" || typeof msg.action !== "string") {
    sendResponse({ success: false });
    return;
  }

  if (msg.action === "toggleCat") {
    const main = PixelCatRuntime.instances.find((c) => !c.isCompanion);
    if (main) {
      if (main.isPlayingGoodbye) {
        main.cancelGoodbye();
        sendResponse({ success: true, action: "restored" });
      } else {
        main.destroy();
        
        sendResponse({ success: true, action: "destroyed" });
      }
    } else {
      getLocal(RUNTIME_SETTINGS_DEFAULTS).then((data) => {
        data = sanitizeLevelLockedSettings(data);
        spawnPixelCat(
          "youtube-pixel-cat-main",
          false,
          data.activePet === "pet_fox" ||
            data.activePet === "fox" ||
            data.activePet === "pet_skeleton" ||
            data.activePet === "skeleton" ||
            data.activePet === "pet_red_panda"
            ? data.foxSkin || "orange"
            : data.catSkin || "white",
        );
        const spawned = PixelCatRuntime.instances.find((c) => !c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true, action: "spawned" });
      });
      return true;
    }
  } else if (msg.action === "toggleCompanion") {
    const comp = PixelCatRuntime.instances.find((c) => c.isCompanion);
    if (comp) {
      if (comp.isPlayingGoodbye) {
        comp.cancelGoodbye();
        sendResponse({ success: true, action: "restored" });
      } else {
        comp.destroy();
        
        sendResponse({ success: true, action: "destroyed" });
      }
    } else {
      getLocal(RUNTIME_SETTINGS_DEFAULTS).then((data) => {
        data = sanitizeLevelLockedSettings(data);
        if (!data.companionEnabled) {
          sendResponse({
            success: false,
            locked: true,
          });
          return;
        }
        spawnPixelCat(
          "youtube-pixel-cat-companion",
          true,
          data.activePet === "pet_fox" ||
            data.activePet === "fox" ||
            data.activePet === "pet_red_panda"
            ? data.foxSkin || "orange"
            : data.catSkin || "white",
        );
        const spawned = PixelCatRuntime.instances.find((c) => c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true, action: "spawned" });
      });
      return true;
    }
  } else if (msg.action === "startCat") {
    const existing = PixelCatRuntime.instances.find((c) => !c.isCompanion);
    if (!existing) {
      getLocal(RUNTIME_SETTINGS_DEFAULTS).then((data) => {
        data = sanitizeLevelLockedSettings(data);
        spawnPixelCat(
          "youtube-pixel-cat-main",
          false,
          data.activePet === "pet_fox" ||
            data.activePet === "fox" ||
            data.activePet === "pet_red_panda"
            ? data.foxSkin || "orange"
            : data.catSkin || "white",
        );
        const spawned = PixelCatRuntime.instances.find((c) => !c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true });
      });
      return true;
    }
    if (existing.isPlayingGoodbye) {
      existing.cancelGoodbye();
    }
    sendResponse({ success: true, alreadyExists: true });
  } else if (msg.action === "stopCat") {
    const main = PixelCatRuntime.instances.find((c) => !c.isCompanion);
    if (main) main.destroy();
    sendResponse({ success: true });
  } else if (msg.action === "startCompanion") {
    const existing = PixelCatRuntime.instances.find((c) => c.isCompanion);
    if (!existing) {
      getLocal(RUNTIME_SETTINGS_DEFAULTS).then((data) => {
        data = sanitizeLevelLockedSettings(data);
        if (!data.companionEnabled) {
          sendResponse({ success: false, locked: true });
          return;
        }
        spawnPixelCat(
          "youtube-pixel-cat-companion",
          true,
          data.activePet === "pet_fox" ||
            data.activePet === "fox" ||
            data.activePet === "pet_red_panda"
            ? data.foxSkin || "orange"
            : data.catSkin || "white",
        );
        const spawned = PixelCatRuntime.instances.find((c) => c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true });
      });
      return true;
    }
    if (existing.isPlayingGoodbye) {
      existing.cancelGoodbye();
    }
    sendResponse({ success: true, alreadyExists: true });
  } else if (msg.action === "stopCompanion") {
    const comp = PixelCatRuntime.instances.find((c) => c.isCompanion);
    if (comp) comp.destroy();
    sendResponse({ success: true });
  } else if (msg.action === "updateSettings") {
    const safeSettings = sanitizeRuntimeSettings(msg.settings);
    if (safeSettings) {
      if (
        safeSettings.activePet === "pet_fox" ||
        safeSettings.activePet === "pet_skeleton" ||
        safeSettings.activePet === "pet_red_panda"
      ) {
        safeSettings.aggressiveMode = false;
        safeSettings.uiMischiefEnabled = false;
      }
      if (
        safeSettings.activePet === "pet_clippy" ||
        safeSettings.activePet === "clippy"
      ) {
        safeSettings.companionEnabled = false;
        safeSettings.loyalMode = false;
      }
      if (
        safeSettings.activePet === "pet_bat" ||
        safeSettings.activePet === "bat"
      ) {
        safeSettings.companionEnabled = false;
      }

      if (safeSettings.disabledSites !== undefined || safeSettings.disabledSitesList !== undefined || safeSettings.siteFilterMode !== undefined) {
        getLocal(RUNTIME_SETTINGS_DEFAULTS).then((data) => {
          data = sanitizeLevelLockedSettings(data);
          if (safeSettings.disabledSites !== undefined) data.disabledSites = safeSettings.disabledSites;
          if (safeSettings.disabledSitesList !== undefined) data.disabledSitesList = safeSettings.disabledSitesList;
          if (safeSettings.siteFilterMode !== undefined) data.siteFilterMode = safeSettings.siteFilterMode;

          const blocked = isSiteBlocked(data.disabledSites, data.disabledSitesList, data.siteFilterMode);
          if (blocked) {
            
            PixelCatRuntime.instances.slice().forEach((cat) => {
              if (cat && typeof cat.destroy === "function") {
                try {
                  cat.destroy();
                } catch (_) {}
              }
            });
          } else {
            
            if (data.catEnabled && !isSiteBlocked(data.disabledSites, data.disabledSitesList, data.siteFilterMode)) {
              const existing = PixelCatRuntime.instances.find(
                (c) => !c.isCompanion,
              );
              if (!existing) {
                spawnPixelCat(
                  "youtube-pixel-cat-main",
                  false,
                  data.activePet === "pet_fox" ||
                    data.activePet === "fox" ||
                    data.activePet === "pet_skeleton" ||
                    data.activePet === "skeleton" ||
                    data.activePet === "pet_red_panda"
                    ? data.foxSkin || "orange"
                    : data.catSkin || "white",
                );
              }
            }
            if (data.companionEnabled && !isSiteBlocked(data.disabledSites, data.disabledSitesList, data.siteFilterMode)) {
              const existingComp = PixelCatRuntime.instances.find(
                (c) => c.isCompanion,
              );
              if (!existingComp) {
                spawnPixelCat(
                  "youtube-pixel-cat-companion",
                  true,
                  data.activePet === "pet_fox" ||
                    data.activePet === "fox" ||
                    data.activePet === "pet_skeleton" ||
                    data.activePet === "skeleton" ||
                    data.activePet === "pet_red_panda"
                    ? data.foxSkin || "orange"
                    : data.catSkin || "white",
                );
              }
            }
            PixelCatRuntime.instances.forEach((cat) => {
              if (cat.updateSettings) cat.updateSettings(data);
            });
          }
        });
        sendResponse({ success: true });
        return true;
      } else {
        if (safeSettings.showOnAllTabs !== undefined) {
          initCatSpawning();
        }
        PixelCatRuntime.instances.forEach((cat) => {
          if (cat.updateSettings) {
            cat.updateSettings(safeSettings);
          }
        });
      }
    }
    sendResponse({ success: true });
  } else if (msg.action === "clearSpeechMemory") {
    PixelCatRuntime.instances.forEach((cat) => {
      if (cat.clearSpeechMemory) {
        cat.clearSpeechMemory();
      }
    });
    sendResponse({ success: true });
  } else if (msg.action === "deactivate_tab_pet") {
    getLocal({ showOnAllTabs: false }).then((data) => {
      if (!data.showOnAllTabs && !withinTransferGracePeriod()) {
        PixelCatRuntime.instances.slice().forEach((cat) => {
          try {
            if (cat && typeof cat.destroyInstant === "function") cat.destroyInstant();
            else if (cat && typeof cat.destroy === "function") cat.destroy();
          } catch (_) {}
        });
        PixelCatRuntime.instances.length = 0;
      }
    });
    sendResponse({ success: true });
    return;
  } else if (msg.action === "activate_tab_pet") {
    initCatSpawning();
    sendResponse({ success: true });
    return;
  } else if (msg.action === "receive_transferred_pet") {
    getLocal(RUNTIME_SETTINGS_DEFAULTS).then((data) => {
      data = sanitizeLevelLockedSettings(data);
      const isComp = msg.petType === "companion";
      const catId = isComp ? "youtube-pixel-cat-companion" : "youtube-pixel-cat-main";

      const blocked = isSiteBlocked(data.disabledSites, data.disabledSitesList, data.siteFilterMode);
      if (blocked || (isComp ? !data.companionEnabled : !data.catEnabled)) {
        sendResponse({ success: false, error: "Pet not available in this tab" });
        return;
      }

      PixelCatRuntime.instances.slice().forEach((inst) => {
        if (inst && inst.isCompanion === isComp && typeof inst.destroyInstant === "function") {
          try { inst.destroyInstant(); } catch (_) {}
        }
      });

      const foxLike =
        data.activePet === "pet_fox" ||
        data.activePet === "fox" ||
        data.activePet === "pet_skeleton" ||
        data.activePet === "skeleton" ||
        data.activePet === "pet_red_panda" ||
        data.activePet === "red_panda";
      const skin = foxLike ? data.foxSkin || "orange" : data.catSkin || "white";

      spawnPixelCat(catId, isComp, skin);

      const instance = PixelCatRuntime.instances.find((c) => c.isCompanion === isComp);
      if (instance) {
        lastTransferReceivedAt = Date.now();
        if (typeof instance.updateSettings === "function") {
          instance.updateSettings(data);
        }
        const localX = Math.max(50, Math.min(window.innerWidth - 50, msg.screenX - window.screenX));
        const localY = Math.max(50, Math.min(window.innerHeight - 50, msg.screenY - window.screenY));
        if (instance.forceDropAt) {
          instance.forceDropAt(localX, localY, msg.dropVX || 0, msg.dropVY || 0);
        }
        sendResponse({ success: true });
      } else {
        // Spawning genuinely failed — tell the origin honestly so it falls
        // back to dropping locally instead of vanishing on both ends.
        sendResponse({ success: false, error: "Failed to spawn pet in target tab" });
      }
    });
    return true;
  } else {
    sendResponse({ success: false });
  }

  return false;
});

})();
