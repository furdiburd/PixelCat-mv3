var PixelCatRuntime = globalThis.__PixelCatRuntime;
if (!PixelCatRuntime) {
  PixelCatRuntime = {
    instances: [],
    preloadCache: Object.create(null),
    fishes: [],
    spiders: [],
    webs: [],
    balls: [],
    envRects: [],
    cursorX: 0,
    cursorY: 0
  };
  Object.defineProperty(globalThis, '__PixelCatRuntime', { value: PixelCatRuntime, configurable: false });
}


function spawnPixelCat(catId, isCompanion, initialSkin) {
  'use strict';
  if (!document.body) return;
  if (document.getElementById(catId)) return;

  const API = typeof browser !== 'undefined' ? browser : chrome;
  const QuestEngine = globalThis.PixelCatQuests || null;
  const u   = (p) => API.runtime.getURL(p);

  // Asset preloading to ensure smooth animations
  const PRELOAD_IMAGES = [
    u('assets/animations/cat.png'),
    u('assets/animations/dust.png'),
    u('assets/animations/spider.png'),
    u('assets/animations/coins_sheet.png'),
    u('assets/fishes/fish1.png'),
    u('assets/fishes/fish2.png'),
    u('assets/fishes/fish3.png'),
    u('assets/balls/baseball.png')
  ];
  const PRELOAD_CACHE = PixelCatRuntime.preloadCache;
  PRELOAD_IMAGES.forEach((url) => {
    if (PRELOAD_CACHE[url]) return;
    const img = new Image();
    img.src = url;
    PRELOAD_CACHE[url] = img;
  });

  let isDestroyed = false;
  const managedListenerCleanups = new Set();
  
    const safeNow = () => {
    try {
      if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
        return performance.now();
      }
    } catch (e) {
    }
    return Date.now();
  };

  function addManagedEventListener(target, type, listener, options) {
    if (!target || typeof target.addEventListener !== 'function') {
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

  const api = {
    get feetX() { return feetX; },
    get feetY() { return feetY; },
    get velY()  { return velY; },
    get state() { return state; },
    get sizeMultiplier() { return sizeMultiplier; },
    get isJumping() { return isJumping; },
    get targetFish() { return targetFish; },
    set facingLeft(val) { facingLeft = val; applyTransform(); },
    get facingLeft() { return facingLeft; },
    go: function(s) { go(s); },
    knockbackFrom: function(sourceX, power) {
      const dir = feetX >= sourceX ? 1 : -1;
      velX = dir * Math.max(260, Number(power) || 420);
      velY = Math.min(velY, JUMP_V * 0.45);
      onGround = false;
      isJumping = true;
      setAnimLocked('scared', 650);
    },
    destroy: function() {
        if (isDestroyed) return;
        isDestroyed = true;
        catEnabled = false;
        cleanupManagedEventListeners();
        if (contentMutationObserver) {
          contentMutationObserver.disconnect();
          contentMutationObserver = null;
        }
        detachVideoListeners();
        cleanupSmashIntervals();
        cleanupBouncedElements();
        if (coinModule && typeof coinModule.cleanupCoinEffects === 'function') coinModule.cleanupCoinEffects();
        removeTimeout(_resizeTimeout);
        removeTimeout(_scrollEndTimeout);
        removeTimeout(mutationScanTimeout);
        if (_scrollRaf) {
          cancelAnimationFrame(_scrollRaf);
          _scrollRaf = 0;
        }
        if (catEl) catEl.remove();
        if (speechModule) speechModule.cleanup();
        managedIntervals.forEach(clearInterval);
        managedTimeouts.forEach(clearTimeout);
        managedIntervals.clear();
        managedTimeouts.clear();
        if (rafId) cancelAnimationFrame(rafId);
        if (!isCompanion) {
          cleanupGlobalArtifacts();
          cleanupLevelUnlockSpeech();
        }
        const idx = PixelCatRuntime.instances.indexOf(api);
        if (idx > -1) PixelCatRuntime.instances.splice(idx, 1);
    },
    isCompanion: isCompanion,
      updateSettings: function(settings) {
      settings = sanitizeRuntimeSettings(settings) || {};
      if (settings.loyalMode !== undefined) {
        isLoyalMode = settings.loyalMode;
        if (isLoyalMode && state === 'sit') {
          go('loyal_follow');
        } else if (!isLoyalMode && state === 'loyal_follow') {
          go('sit');
        }
      }
      if (settings.aggressiveMode !== undefined) {
        isAggressiveMode = settings.aggressiveMode;
      }
      if (settings.uiMischiefEnabled !== undefined) {
        uiMischiefEnabled = settings.uiMischiefEnabled;
      }
      if (settings.speechEnabled !== undefined) {
        speechEnabled = settings.speechEnabled;
        if (!speechEnabled && speechModule) hideSpeechBubble();
      }
      if (settings.memoryEnabled !== undefined) {
        memoryEnabled = settings.memoryEnabled;
      }
      if (settings.rareEventsEnabled !== undefined) {
        rareEventsEnabled = settings.rareEventsEnabled;
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
        if (typeof updateFullscreenVisibility === 'function') updateFullscreenVisibility();
      }
      if (settings.uiMischiefRate !== undefined) {
        uiMischiefRate = settings.uiMischiefRate;
      }
      if (settings.speedMultiplier !== undefined) {
        const mult = settings.speedMultiplier;
        SPEED_WALK = BASE_SPEED_WALK * mult;
        SPEED_RUN = BASE_SPEED_RUN * mult;
      }
      if (settings.sizeMultiplier !== undefined) {
        applySizeMultiplier(settings.sizeMultiplier);
      }
      if (settings.catSkin !== undefined) {
        applySkin(settings.catSkin);
      }
      if (settings.ballEnabled !== undefined) {
        ballEnabled = settings.ballEnabled;
      }
      if (settings.activeBall !== undefined) {
        _activeBallId = settings.activeBall;
      }
      if (settings.spiderEnabled !== undefined) {
        spiderEnabled = settings.spiderEnabled;
      }
      if (settings.portalEnabled !== undefined) {
        portalEnabled = settings.portalEnabled;
        if (!portalEnabled && typeof cleanupPortals === 'function') {
          cleanupPortals();
        }
        if (portalEnabled) {
          portalSpawnTimer = 60 + Math.random() * 120;
        }
      }
      if (settings.catEnergyLevel !== undefined) {
        catEnergyLevel = settings.catEnergyLevel;
        applyEnergyLevel();
      }
      if (settings.uiLanguage !== undefined) {
        uiLanguage = settings.uiLanguage;
        if (speechModule && speechModule.markSpeechMeasure) speechModule.markSpeechMeasure();
      }
      if (settings.shopOwned !== undefined) {
        updateOwnedShopItems(settings.shopOwned);
      }
      if (settings.shopActiveBoosts !== undefined) {
        updateActiveShopBoosts(settings.shopActiveBoosts);
      }
      if (settings.shopEffect !== undefined) {
        ownedShopItems.add(settings.shopEffect);
        activeShopBoosts.add(settings.shopEffect);
      }
    },
    clearSpeechMemory: function() {
      if (typeof clearSpeechMemory === 'function') {
        clearSpeechMemory();
      }
    }
  };

  function applyEnergyLevel() {
    let mult = 1.0;
    if (catEnergyLevel === 'sleepy') mult = 0.6;
    if (catEnergyLevel === 'hyper') mult = 1.6;
    
    SPEED_WALK = BASE_SPEED_WALK * mult;
    SPEED_RUN = BASE_SPEED_RUN * mult;
    catEnergy = catEnergyLevel === 'sleepy' ? 0.2 : (catEnergyLevel === 'hyper' ? 1.0 : 0.6);
  }

  const missingPixelCatModules = ['PixelCatStorage', 'PixelCatCoins', 'PixelCatFish', 'PixelCatBalls', 'PixelCatPortals']
    .filter((name) => typeof window[name] !== 'function');
  if (missingPixelCatModules.length) return;


  const levelUnlockSpeechQueue = [];
  let levelUnlockSpeechActive = false;
  let levelUnlockSpeechTimer = 0;

  function getLocalizedUnlockSkills(skills, language) {
    const clean = Array.isArray(skills) ? skills.filter(Boolean) : [];
    const labels = {
      fr: {
        'Speech bubbles': 'les bulles de dialogue',
        'Ball play': 'le jeu de balle',
        'Spider events': 'les araignées',
        'Cat size control': 'le contrôle de taille',
        'Companion mode': 'le mode compagnon',
        'Page mischief': 'les bêtises sur la page',
        'Portals': 'les portails',
        'Hyper energy': 'l’énergie hyper',
        'Final level badge': 'le badge final'
      },
      ar: {
        'Speech bubbles': 'فقاعات الكلام',
        'Ball play': 'اللعب بالكرة',
        'Spider events': 'العناكب',
        'Cat size control': 'تغيير الحجم',
        'Companion mode': 'وضع الرفيق',
        'Page mischief': 'العبث بالصفحة',
        'Portals': 'البوابات',
        'Hyper energy': 'الطاقة الفائقة',
        'Final level badge': 'شارة المستوى الأخير'
      }
    };
    return clean.map((skill) => (labels[language] && labels[language][skill]) || skill);
  }

  function formatSkillList(skills, language) {
    const clean = getLocalizedUnlockSkills(skills, language);
    if (!clean.length) {
      if (language === 'fr') return 'une nouvelle compétence';
      if (language === 'ar') return 'مهارة جديدة';
      return 'a new skill';
    }
    if (clean.length === 1) return clean[0];
    if (language === 'fr') return clean.slice(0, -1).join(', ') + ' et ' + clean[clean.length - 1];
    if (language === 'ar') return clean.slice(0, -1).join('، ') + ' و' + clean[clean.length - 1];
    if (clean.length === 2) return clean[0] + ' and ' + clean[1];
    return clean.slice(0, -1).join(', ') + ', and ' + clean[clean.length - 1];
  }

  function getLevelReachedSpeechText(detail) {
    const language = uiLanguage || 'en';
    const level = Math.max(1, Number(detail && detail.level) || 1);

    if (language === 'fr') return `Niveau ${level} atteint.`;
    if (language === 'ar') return `وصلت للمستوى ${level}.`;
    return `Reached level ${level}.`;
  }

  function getLevelUnlockSpeechText(detail) {
    const language = uiLanguage || 'en';
    const level = Math.max(1, Number(detail && detail.level) || 1);

    const shortMessages = {
      en: {
        2: 'Speech and ball.',
        3: 'Spiders unlocked now.',
        4: 'Size control unlocked.',
        5: 'Companion mode unlocked.',
        6: 'Page mischief unlocked.',
        7: 'Portals unlocked now.',
        8: 'Hyper mode unlocked.',
        9: 'Final badge unlocked.',
        10: 'Max level reached.'
      },
      fr: {
        2: 'Dialogue et balle.',
        3: 'Araignées débloquées maintenant.',
        4: 'Contrôle taille débloqué.',
        5: 'Mode compagnon débloqué.',
        6: 'Bêtises débloquées maintenant.',
        7: 'Portails débloqués maintenant.',
        8: 'Mode hyper débloqué.',
        9: 'Badge final débloqué.',
        10: 'Niveau maximum atteint.'
      },
      ar: {
        2: 'الكلام والكرة مفتوحان.',
        3: 'العناكب صارت مفتوحة.',
        4: 'التحكم بالحجم مفتوح.',
        5: 'وضع الرفيق مفتوح.',
        6: 'العبث بالصفحة مفتوح.',
        7: 'البوابات صارت مفتوحة.',
        8: 'الوضع الفائق مفتوح.',
        9: 'شارة النهاية مفتوحة.',
        10: 'وصلت لأقصى مستوى.'
      }
    };

    return (shortMessages[language] && shortMessages[language][level])
      || shortMessages.en[level]
      || (language === 'fr' ? 'Nouvelle fonction débloquée.' : language === 'ar' ? 'تم فتح ميزة جديدة.' : 'New feature unlocked.');
  }

  function showNextLevelUnlockSpeech() {
    if (levelUnlockSpeechActive || !levelUnlockSpeechQueue.length || isDestroyed || isCompanion) return;
    if (!speechModule || typeof speechModule.showSpeech !== 'function') return;

    levelUnlockSpeechActive = true;
    const message = levelUnlockSpeechQueue.shift();
    speechModule.showSpeech(message, { force: true });

    levelUnlockSpeechTimer = addTimeout(() => {
      levelUnlockSpeechActive = false;
      levelUnlockSpeechTimer = 0;
      showNextLevelUnlockSpeech();
    }, 4200);
  }

  function queueLevelUnlockSpeech(detail) {
    if (isCompanion || !detail || isDestroyed) return;
    levelUnlockSpeechQueue.push(getLevelReachedSpeechText(detail));
    levelUnlockSpeechQueue.push(getLevelUnlockSpeechText(detail));
    showNextLevelUnlockSpeech();
  }

  function cleanupLevelUnlockSpeech() {
    levelUnlockSpeechQueue.length = 0;
    levelUnlockSpeechActive = false;
    if (levelUnlockSpeechTimer) {
      removeTimeout(levelUnlockSpeechTimer);
      levelUnlockSpeechTimer = 0;
    }
  }

  const storageModule = window.PixelCatStorage({
    API,
    QuestEngine,
    get isCompanion() { return isCompanion; },
    addTimeout: (fn, ms) => addTimeout(fn, ms),
    onLevelUnlock: (detail) => queueLevelUnlockSpeech(detail),
    getOwnedShopItems: () => ownedShopItems,
    setOwnedShopItems: (items) => {
      ownedShopItems = new Set(items);
      activeShopBoosts = new Set(Array.from(activeShopBoosts).filter((id) => ownedShopItems.has(id)));
    },
    getActiveShopBoosts: () => activeShopBoosts,
    setActiveShopBoosts: (items) => {
      activeShopBoosts = new Set((Array.isArray(items) ? items : []).filter((id) => ownedShopItems.has(id)));
    }
  });
  const {
    getLocal,
    setLocal,
    mutateStoredNumber,
    updateOwnedShopItems,
    updateActiveShopBoosts,
    hasShopBoost,
    loadXPAndShop,
    earnXP,
    awardCoins,
    recordQuestEvent
  } = storageModule;
  
  // Sprite sheet layout: 10 rows, 32x32 cells.
  // Row mapping: idle1, idle2, clean1, clean2, walk, run, sleep, paw, jump, scared.
  const SHEET   = u('assets/animations/cat.png');
  const CELL    = 32;
  const SCALE   = 2.5;
  const VIS     = CELL * SCALE;            // 80 px rendered

  function clampSizeMultiplier(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 1.0;
    return Math.max(0.5, Math.min(2.5, Math.round(num * 10) / 10));
  }

  function applySizeMultiplier(value) {
    sizeMultiplier = clampSizeMultiplier(value);
    document.documentElement.style.setProperty('--pixelcat-size', sizeMultiplier.toFixed(1));
    clampCatInsideViewport();
    lastTransformStr = '';
    markSpeechMeasure();
    applyTransform();
    positionSpeechBubble(true);
  }

  function getCatRenderedWidth() {
    return CELL * SCALE * sizeMultiplier;
  }

  function getSideWallMargin() {
    return Math.max(10, getCatRenderedWidth() / 2 + 4);
  }

  function getWallClimbMargin() {
    return Math.max(8, 7 + sizeMultiplier * 5);
  }

  function getWallAttachX(side) {
    const margin = getWallClimbMargin();
    return side === 'left' ? margin : _vw - margin;
  }

  function getPlatformInset(r) {
    const width = r ? (r.right - r.left) : 0;
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

  function clampCatInsideViewport() {
    const margin = getSideWallMargin();
    if (state === 'wall_left' || state === 'wall_left_sit') feetX = getWallAttachX('left');
    else if (state === 'wall_right' || state === 'wall_right_sit') feetX = getWallAttachX('right');
    else feetX = Math.max(margin, Math.min(_vw - margin, feetX));
  }

  let _vw = window.innerWidth;
  let _vh = window.innerHeight;
  let _resizeRaf = 0;
  let _resizeTimeout = null;
  addManagedEventListener(window, 'resize', () => {
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
  }, { passive: true });

  function updateFullscreenVisibility() {
    if (hideInFullscreen && (document.fullscreenElement || document.webkitFullscreenElement)) {
      document.body.classList.add('pixelcat-hidden-fullscreen');
    } else {
      document.body.classList.remove('pixelcat-hidden-fullscreen');
    }
  }
  addManagedEventListener(document, 'fullscreenchange', updateFullscreenVisibility);
  addManagedEventListener(document, 'webkitfullscreenchange', updateFullscreenVisibility);

  const FLOOR_Y = () => _vh;

  const ANIMS = {
    idle1:   { row: 0, fr: 4, fps: 2   },  // slow, gentle breathing
    idle2:   { row: 1, fr: 4, fps: 2   },  // slow, subtle bob
    clean1:  { row: 2, fr: 4, fps: 3   },  // grooming lick
    clean2:  { row: 3, fr: 4, fps: 3   },  // grooming variation
    walk:    { row: 4, fr: 8, fps: 8   },  // walk cycle
    run:     { row: 5, fr: 8, fps: 9   },  // run cycle (matched to movement speed)
    sleep:   { row: 6, fr: 4, fps: 1.5 },  // very slow sleep breathing
    paw:     { row: 7, fr: 6, fps: 6   },  // deliberate paw swipe
    jump:    { row: 8, fr: 7, fps: 10  },  // snappy jump
    scared:  { row: 9, fr: 8, fps: 6   },  // dramatic scared hold
  };

  const NON_MOVEMENT_ANIM_STATES = new Set([
    'sit', 'stare', 'headtilt', 'groom', 'stretch', 'pawplay', 'nap', 'deepsleep',
    'dragged', 'held', 'hidden', 'stunned', 'wall_left', 'wall_right',
    'wall_left_sit', 'wall_right_sit', 'peek_a_boo'
  ]);

  let SPEED_WALK = 80;
  let SPEED_RUN  = 120;
  const BASE_SPEED_WALK = 80;
  const BASE_SPEED_RUN  = 120;
  
  let isAggressiveMode = true;
  let uiMischiefEnabled = false;
  let speechEnabled = false;
  let memoryEnabled = true;
  let rareEventsEnabled = true;
  let autoFishSpawnEnabled = false;
  let ballEnabled = false;
  let spiderEnabled = false;
  let lowPowerMode = false;
  let hideInFullscreen = false;
  let uiMischiefRate = 11;
  let sizeMultiplier = 1.0;
  let catSkinStr = initialSkin || 'white';
  let catEnergyLevel = 'active';
  let uiLanguage = 'en';
  let ownedShopItems = new Set();
  let activeShopBoosts = new Set();
  const GRAVITY    = 1100;
  const JUMP_V     = -500;
  
  const SPEECH_CONFIG = {
    IDLE_DELAY_MIN: 30000,        // 30 seconds
    IDLE_DELAY_MAX: 60000,        // 60 seconds  
    INTERACTIVE_DELAY: 14000,     // 14 seconds
    INTERACTIVE_VARIANCE: 12000,  // 12 seconds
    COOLDOWN_INTERACTIVE: 6500,   // 6.5 seconds
    COOLDOWN_NORMAL: 3500,        // 3.5 seconds
    RETRY_DELAY_MIN: 5000,        // 5 seconds
    RETRY_DELAY_MAX: 6000         // 6 seconds
  };
  
  const POSITIONING = {
    CAT_TOP_OFFSET: 0.8125,  // Top of the cat (26px height)
    CAT_MID_OFFSET: 0.4,     // Middle of the cat
    BUBBLE_GAP: 6,           // Gap between bubble and cat
    BUBBLE_MARGIN: 8,        // Margin from screen edges
    ARROW_MIN_OFFSET: 12     // Minimum arrow offset from bubble edge
  };
  
  const AFK_CONFIG = {
    THRESHOLD_MS: 180000,    // 3 minutes in milliseconds
    WALL_SPEAK_COOLDOWN: 2500 // 2.5 seconds between wall speeches
  };
  
  const IDLE_STATES = new Set(['sit', 'stare', 'groom', 'stretch', 'pawplay', 'nap', 'headtilt', 'deepsleep']);
  
  
  loadXPAndShop();

  let coinChaseTarget = null;
  let activePickupKind = null;

  function hasActivePickup() {
    return activePickupKind !== null;
  }

  function claimActivePickup(kind) {
    if (activePickupKind !== null) return false;
    activePickupKind = kind;
    return true;
  }

  function releaseActivePickup(kind) {
    if (activePickupKind === kind) activePickupKind = null;
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
    setAnimLocked,
    go,
    addTimeout,
    get vw() { return _vw; },
    get vh() { return _vh; },
    get sizeMultiplier() { return sizeMultiplier; },
    get catEnabled() { return catEnabled; },
    get isCompanion() { return isCompanion; },
    get feetX() { return feetX; },
    get feetY() { return feetY; },
    get velY() { return velY; },
    set velY(value) { velY = value; },
    get onGround() { return onGround; },
    set onGround(value) { onGround = value; },
    get isJumping() { return isJumping; },
    set isJumping(value) { isJumping = value; },
    get state() { return state; },
    get isDragging() { return isDragging; },
    get criticalStates() { return _criticalStates; },
    get coinChaseTarget() { return coinChaseTarget; },
    set coinChaseTarget(value) { coinChaseTarget = value; }
  });
  const {
    getPetCoinReward,
    getFishCoinReward,
    updateCoinDrops,
    showCoinPopup
  } = coinModule;

  const speechModule = window.PixelCatSpeech({
    API,
    catId,
    addTimeout,
    removeTimeout,
    setAnimLocked,
    awardCoins,
    earnXP,
    showCoinPopup,
    spawnHeart,
    get feetX() { return feetX; },
    get feetY() { return feetY; },
    get VIS() { return VIS * sizeMultiplier; },
    get state() { return state; },
    get isJumping() { return isJumping; },
    get velX() { return velX; },
    get targetFish() { return targetFish; },
    get targetSpider() { return targetSpider; },
    get isDragging() { return isDragging; },
    get isPurring() { return isPurring; },
    get isDeepSleep() { return isDeepSleep; },
    get catEnabled() { return catEnabled; },
    get speechEnabled() { return speechEnabled; },
    get memoryEnabled() { return memoryEnabled; },
    get uiLanguage() { return uiLanguage; },
    get isTabVisible() { return isTabVisible; },
    get _vw() { return _vw; },
    get _vh() { return _vh; },
    get IDLE_STATES() { return IDLE_STATES; },
    get catEnergy() { return catEnergy; },
    set catEnergy(val) { catEnergy = val; }
  });
  const {
    scheduleIdleChatter,
    speakFromCategory,
    maybeSpeakConfused,
    maybeSpeakAngry,
    showSpeech,
    hideSpeechBubble,
    positionSpeechBubble,
    markSpeechMeasure,
    updateWatchMemory,
    clearMemory: clearSpeechMemory
  } = speechModule;

  const managedIntervals = new Set();
  const managedTimeouts  = new Set();
  let   rafId            = null;
  let   isTabVisible     = !document.hidden;

  function addInterval(fn, ms) {
    const id = setInterval(fn, ms);
    managedIntervals.add(id);
    return id;
  }
  function removeInterval(id) {
    if (id != null) { clearInterval(id); managedIntervals.delete(id); }
  }
  function addTimeout(fn, ms) {
    const id = setTimeout(() => { managedTimeouts.delete(id); fn(); }, ms);
    managedTimeouts.add(id);
    return id;
  }
  function removeTimeout(id) {
    if (id != null) { clearTimeout(id); managedTimeouts.delete(id); }
  }

  const catEl = document.createElement('div');
  catEl.id = catId;
  catEl.classList.add('youtube-pixel-cat');
  catEl.style.backgroundImage = `url("${SHEET}")`;
  catEl.style.visibility = 'hidden';
  document.body.appendChild(catEl);

  // 
  //  STATE
  // 
  // Spawn cats next to each other, facing each other
  let feetX, feetY;
  if (isCompanion) {
    // Companion spawns on the right, facing left (toward main cat)
    feetX = window.innerWidth * 0.42;
    feetY = FLOOR_Y();
  } else {
    // Main cat spawns on the left, facing right (toward companion)
    feetX = window.innerWidth * 0.38;
    feetY = FLOOR_Y();
  }
  
  let velX  = 0, velY = 0;
  let onGround  = true;
  let facingLeft = isCompanion;  // Companion faces left, main faces right
  let isJumping  = false;

  let curAnim = null, curFrame = 0, animAccum = 0;
  let lastDirVal = null;

  let isDragging = false, dragOffX = 0, dragOffY = 0;
  let lastCatDragX = 0, lastCatDragY = 0, lastCatDragTs = 0;
  let catDragVX = 0, catDragVY = 0;
  let catThrowHeavyTimer = 0;
  let cursorX = window.innerWidth  / 2;
  let cursorY = window.innerHeight / 2;

  let state = 'sit', stateTimer = 0, targetX = 0;
  let attackEl = null, attackPhase = 'move', attackHitTimer = 0;
  let lastTs = null;
  let idleAccum = 0;

  //  TRANSFORM TRACKING 
  let globalRot = 0;
  let visualRot = 0;
  let lastTransformStr = '';
  let weightStepTimer = 0;
  let weightShakeUntil = 0;
  let weightShakeAnimation = null;
  
  //  FISH SUBSYSTEM 
  const activeFishes = PixelCatRuntime.fishes;
  let fishSpawnTimer = 5; // Start spawning quickly since only one type can be active
  let targetFish = null;
  let stuckCheckTimer = 0;
  let lastFishChaseX = 0;
  let draggedFish = null;
  let fishDragOffsetX = 0;
  let fishDragOffsetY = 0;
  let lastFishDragX = 0;
  let lastFishDragY = 0;
  let lastFishDragTs = 0;

  //  UI INTERACTION TASK 
  let uiTarget = null;
  let uiWallTask = null;


  //  ANIMATION LOCK 
  // When set, prevents other systems from overriding the animation
  // until the lock timer expires. Used for one-shot anims (paw, scared).
  let animLockTimer = 0;

  //  PERSISTENT VARIANT 
  // Chosen once per state entry, NOT randomly per frame.
  // Prevents the idle1idle2 glitch.
  let chosenIdle  = 'idle1';
  let chosenClean = 'clean1';

  //  NEEDS SYSTEM 
  let catEnergy  = 1.0;   // 1.0 = rested, 0.0 = exhausted
  let catBoredom = 0.0;   // 0.0 = entertained, 1.0 = bored
  let catHunger  = 0.0;   // 0.0 = full, 1.0 = starving

  // Speech is handled by the PixelCatSpeech module (cat-speech.js)
  let pathfindCooldown = 0;  // seconds remaining before next pathfind jump
  let chaseStuckTimer = 0;  // tracks how long chase has been stuck
  let lastChaseDistToTarget = 9999;

  //  LOYAL FOLLOWER MODE 
  let isLoyalMode = false;

  //  LIGHTS OUT / AFK DETECTION 
  let lastUserActivity = Date.now();
  let isDeepSleep = false;
  const AFK_THRESHOLD = 180000;  // 3 minutes in ms

  function onUserActivity() {
    lastUserActivity = Date.now();
    if (isDeepSleep) {
      isDeepSleep = false;
      if (state === 'deepsleep') {
        setAnimLocked('scared', 600);
        addTimeout(() => go('stretch'), 600);
      }
    }
  }
  addManagedEventListener(document, 'mousemove', onUserActivity, { passive: true });
  addManagedEventListener(document, 'keydown', onUserActivity, { passive: true });
  addManagedEventListener(document, 'click', onUserActivity, { passive: true });
  addManagedEventListener(document, 'scroll', onUserActivity, { passive: true });

  //  PETTING SYSTEM 
  let petMeter = 0;
  let lastPetX = 0;
  let petDirectionChanges = 0;
  let lastPetDir = 0;
  let isPurring = false;

  // 
  //  ANIMATION ENGINE
  // 
  function setAnim(name, force) {
    const d = ANIMS[name];
    if (!d) return;
  
    if (curAnim === d) return;
    // If animation is locked (one-shot playing), don't override unless forced
    if (!force && animLockTimer > 0) return;
    curAnim   = d;
    curFrame  = 0;
    animAccum = 0;
    _lastBgX = 0; _lastBgY = -(d.row * CELL) - 6; // -6px shift to align 32px sprite in 26px box
    catEl.style.backgroundPosition = `0px ${_lastBgY}px`;
  }

  // Set animation AND lock it for `lockMs` to prevent override
  function setAnimLocked(name, lockMs) {
    animLockTimer = lockMs || 0;
    const d = ANIMS[name];
    if (!d) return;
    curAnim   = d;
    curFrame  = 0;
    animAccum = 0;
    _lastBgX = 0; _lastBgY = -(d.row * CELL) - 6; // -6px shift to align 32px sprite in 26px box
    catEl.style.backgroundPosition = `0px ${_lastBgY}px`;
  }

  // Track last background-position values to skip redundant DOM writes
  let _lastBgX = 0, _lastBgY = 0;

  function tickAnim(dt) {
    if (!curAnim) return;
    // Tick down animation lock
    if (animLockTimer > 0) animLockTimer -= dt * 1000;
    animAccum += dt * 1000;
    const dur = 1000 / curAnim.fps;
    // Advance frames
    let advanced = 0;
    while (animAccum >= dur && advanced < 2) {
      animAccum -= dur;
      curFrame = (curFrame + 1) % curAnim.fr;
      advanced++;
    }
    // WATCHDOG: if accumulator grew huge without advancing (freeze detection), reset it
    if (animAccum > dur * 3) animAccum = 0;
    // Only write to DOM if the sprite position actually changed
    // Use integer offsets to prevent shaking/jitter in pixelated rendering
    // -6px offset to align the 32px source sprite with the bottom of the 26px container
    const newBgX = -curFrame * CELL;
    const newBgY = (-curAnim.row * CELL) - 6; 
    if (newBgX !== _lastBgX || newBgY !== _lastBgY) {
      _lastBgX = newBgX;
      _lastBgY = newBgY;
      catEl.style.backgroundPosition = `${newBgX}px ${newBgY}px`;
    }
  }

  function applyTransform() {
    const scaled = SCALE * sizeMultiplier;
    const sx = facingLeft ? -scaled : scaled;

    // Smoothly interpolate rotation toward target globalRot
    const rotDiff = globalRot - visualRot;
    if (Math.abs(rotDiff) > 0.1) {
      visualRot += rotDiff * 0.3;
    } else {
      visualRot = globalRot;
    }

    let offsetX = CELL / 2;
    let offsetY = 26; // Match new height to keep feet on the floor
    if (state === 'wall_left') { offsetX = CELL * 0.9; offsetY = 13; }
    else if (state === 'wall_right') { offsetX = CELL * 0.1; offsetY = 13; }

    // Use Math.round for pixel-perfect alignment to the screen grid.
    // This prevents sub-pixel shimmering in pixel art.
    const tx = Math.round(feetX - offsetX);
    const ty = Math.round(feetY - offsetY);

    // GPU-accelerated positioning using translate3d
    const str = `translate3d(${tx}px, ${ty}px, 0) rotate(${visualRot.toFixed(1)}deg) scaleX(${sx}) scaleY(${scaled})`;

    if (lastTransformStr !== str) {
      lastTransformStr = str;
      catEl.style.transform = str;
    }
  }
  function setDir(left) {
    if (facingLeft !== left || lastTransformStr === '') {
      facingLeft = left;
      applyTransform();
    }
  }

  // 
  //  POSITION
  // 
  function applyPos() {
    applyTransform();
    positionSpeechBubble(false);
  }

  function isHorizontalMovementState() {
    return onGround && !isJumping && !isDragging && Math.abs(velX) > 12 && !NON_MOVEMENT_ANIM_STATES.has(state);
  }

  function syncMovementAnimation(force) {
    if (animLockTimer > 0 && !force) return;
    if (!isHorizontalMovementState()) return;
    setDir(velX < 0);
    const absVelX = Math.abs(velX);
    const desired = absVelX >= SPEED_RUN * 0.68 ? 'run' : 'walk';
    if (curAnim !== ANIMS[desired] || force) setAnim(desired, force);
  }

  // 
  //  DUST ANIMATION
  // 
  // Pre-cache dust image URL (avoid building it each time)
  const _dustImgUrl = `url("${u('assets/animations/dust.png')}")`;

  function spawnDust(x, y) {
    const d = document.createElement('div');
    d.className = 'pixel-dust';
    d.style.backgroundImage = _dustImgUrl;
    const tx = Math.round(x - (CELL * sizeMultiplier) / 2);
    const ty = Math.round(y - (CELL * sizeMultiplier));
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

  // 
  //  HEART PARTICLE (for petting / loyal mode)
  //  Pixel-art style  55 grid drawn with box-shadow
  // 
  function spawnHeart(x, y) {
    const h = document.createElement('div');
    h.className = 'pixel-heart';
    const tx = ((x + (Math.random() - 0.5) * 24) | 0);
    const ty = (y | 0);
    h.style.setProperty('--x', tx + 'px');
    h.style.setProperty('--y', ty + 'px');
    document.body.appendChild(h);
    addTimeout(() => { if (h.isConnected) h.remove(); }, 1200);
  }

  // 
  //  ZZZ PARTICLE (for deep sleep)
  // 
  function spawnZzz() {
    const z = document.createElement('div');
    z.className = 'pixel-zzz';
    z.textContent = 'z';
    const tx = ((feetX + 10) | 0);
    const ty = ((feetY - VIS * sizeMultiplier * 0.7) | 0);
    z.style.setProperty('--x', tx + 'px');
    z.style.setProperty('--y', ty + 'px');
    document.body.appendChild(z);
    addTimeout(() => { if (z.isConnected) z.remove(); }, 1500);
  }

  // 
  //  PETTING DETECTION
  // 
  function tickPetting(dt) {
    // Check if cursor is over the cat sprite
    const catW = VIS * sizeMultiplier;
    const catH = VIS * sizeMultiplier;
    const catLeft = feetX - catW / 2;
    const catTop  = feetY - catH;
    const overCat = cursorX >= catLeft && cursorX <= catLeft + catW &&
                    cursorY >= catTop  && cursorY <= catTop + catH;

    if (!overCat) {
      petMeter = Math.max(0, petMeter - dt * 2);
      petDirectionChanges = 0;
      if (isPurring && petMeter <= 0) {
        isPurring = false;
        go('stretch');
      }
      return;
    }

    // Detect direction changes (left-right wiggling)
    const curDir = cursorX > lastPetX ? 1 : (cursorX < lastPetX ? -1 : 0);
    const speed = Math.abs(cursorX - lastPetX);
    if (curDir !== 0 && curDir !== lastPetDir && speed > 3) {
      petDirectionChanges++;
      petMeter = Math.min(1.0, petMeter + 0.12);
    }
    lastPetDir = curDir || lastPetDir;
    lastPetX = cursorX;

    // Decay direction changes over time
    if (petDirectionChanges > 0) {
      petDirectionChanges = Math.max(0, petDirectionChanges - dt * 2);
    }

    // Start purring!
    if (petMeter >= 0.8 && !isPurring) {
      isPurring = true;
      catEnergy  = Math.min(1.0, catEnergy + 0.5);
      catBoredom = 0;
      catHunger  = Math.max(0, catHunger - 0.3);
      earnXP(0.2); // XP: petting earns XP.
      awardCoins(getPetCoinReward());
      recordQuestEvent('pet_sessions', 1);
      velX = 0;
      setAnim('sleep');  // Closed eyes = content purring
      spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
    }

    // Keep spawning hearts while purring
    if (isPurring && Math.random() < 0.04) {
      spawnHeart(feetX + (Math.random() - 0.5) * 30 * sizeMultiplier, feetY - VIS * sizeMultiplier * 0.4 - Math.random() * 20 * sizeMultiplier);
    }
  }

  const fishModule = window.PixelCatFish({
    u,
    safeNow,
    GRAVITY,
    go,
    activeFishes,
    hasActivePickup,
    claimActivePickup,
    releaseActivePickup,
    get vw() { return _vw; },
    get vh() { return _vh; },
    get sizeMultiplier() { return sizeMultiplier; },
    get catEnabled() { return catEnabled; },
    get autoFishSpawnEnabled() { return autoFishSpawnEnabled; },
    get fishSpawnTimer() { return fishSpawnTimer; },
    set fishSpawnTimer(value) { fishSpawnTimer = value; },
    get state() { return state; },
    get targetFish() { return targetFish; },
    set targetFish(value) { targetFish = value; },
    get draggedFish() { return draggedFish; },
    set draggedFish(value) { draggedFish = value; },
    set fishDragOffsetX(value) { fishDragOffsetX = value; },
    set fishDragOffsetY(value) { fishDragOffsetY = value; },
    set lastFishDragX(value) { lastFishDragX = value; },
    set lastFishDragY(value) { lastFishDragY = value; },
    set lastFishDragTs(value) { lastFishDragTs = value; }
  });
  const { spawnFishTreat, updateFishes } = fishModule;


  // 
  //  SPIDER SUBSYSTEM
  // 
  const activeSpiders = PixelCatRuntime.spiders;
  const activeWebs = PixelCatRuntime.webs;
  let spiderSpawnTimer = 45 + Math.random() * 30; // 45-75 seconds initial delay - more varied
  let targetSpider = null;
  let draggedSpider = null;
  let spiderDragOffsetX = 0;
  let spiderDragOffsetY = 0;
  let lastSpiderDragX = 0;
  let lastSpiderDragY = 0;
  let lastSpiderDragTs = 0;
  
  const SPIDER_SHEET = u('assets/animations/spider.png');
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
      'ytd-watch-flexy #columns',
      'ytd-watch-flexy #primary',
      'ytd-browse ytd-rich-grid-renderer #contents',
      'ytd-rich-grid-renderer #contents',
      'ytd-two-column-browse-results-renderer #contents',
      'ytd-search ytd-section-list-renderer #contents',
      'ytd-section-list-renderer #contents',
      'ytd-playlist-panel-renderer #items',
      'ytmusic-app-layout ytmusic-section-list-renderer #contents',
      'ytmusic-app-layout ytmusic-grid-renderer #items'
    ];

    for (let i = 0; i < selectors.length; i++) {
      const el = document.querySelector(selectors[i]);
      if (!el || el === document.body || el === document.documentElement) continue;
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
      target.style.willChange = 'transform';
      target.style.transformOrigin = '50% 50%';
      weightShakeAnimation = target.animate([
        { transform: 'translate3d(0, 0, 0)' },
        { transform: `translate3d(${amp * 0.16}px, ${-amp}px, 0)` },
        { transform: `translate3d(${-amp * 0.12}px, ${amp * 0.48}px, 0)` },
        { transform: `translate3d(${amp * 0.05}px, ${-amp * 0.18}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' }
      ], {
        duration: ms,
        easing: 'cubic-bezier(.18,.82,.28,1)',
        fill: 'none'
      });
      const currentShake = weightShakeAnimation;
      currentShake.onfinish = currentShake.oncancel = () => {
        if (weightShakeAnimation === currentShake) {
          weightShakeAnimation = null;
          target.style.willChange = '';
          target.style.transformOrigin = '';
        }
      };
    } catch (error) {
      // Some pages block Web Animations; ignore and keep the cat running.
    }
  }

  function updateWeightFootsteps(dt) {
    if (!onGround || isJumping || isDragging) {
      weightStepTimer = 0;
      return;
    }

    const absVelX = Math.abs(velX);
    const isHeavyWalk = state === 'wander' || state === 'patrol' || state === 'chase' || state === 'chasefish' || state === 'ball_chase';
    const isHeavyRun = state === 'zoomies' || state === 'spook' || state === 'attack' || state === 'knockoff' || state === 'ui_mischief';
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
    idle:   { r: 0, fr: 5, fps: 6 },
    move:   { r: 1, fr: 6, fps: 10 },
    jump:   { r: 2, fr: 9, fps: 12 },
    drop:   { r: 3, fr: 1, fps: 1 },
    shoot:  { r: 4, fr: 4, fps: 8 },
    damage: { r: 5, fr: 3, fps: 6 },
    death:  { r: 6, fr: 9, fps: 10 },
    proj:   { r: 7, fr: 6, fps: 12 }
  };

  function spawnSpider() {
    if (!document.body || PixelCatRuntime.instances.indexOf(api) !== 0) return; // Only main cat

    const isBigSpider = rareEventsEnabled && Math.random() < 0.05; // Rare 1-in-20 boss spider.
    const sEl = document.createElement('div');
    sEl.className = isBigSpider ? 'pixel-spider pixel-spider-big' : 'pixel-spider';
    sEl.style.position = 'fixed';
    sEl.style.left = '0px';
    sEl.style.top = '0px';
    const spiderScale = spiderRenderScale();
    sEl.style.width = (SPIDER_CELL * spiderScale) + 'px';
    sEl.style.height = (SPIDER_CELL * spiderScale) + 'px';
    sEl.style.zIndex = '9999990';
    sEl.style.pointerEvents = 'auto';
    sEl.style.cursor = 'grab';
    sEl.style.backgroundImage = `url("${SPIDER_SHEET}")`;
    sEl.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
    sEl.style.backgroundRepeat = 'no-repeat';
    
    const sx = 40 + Math.random() * (_vw - 80);
    const sy = -50;
    
    const lineEl = document.createElement('div');
    lineEl.style.position = 'fixed';
    lineEl.style.width = '2px';
    lineEl.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    lineEl.style.backgroundImage = 'none';
    lineEl.style.left = (sx) + 'px';
    lineEl.style.top = '0px';
    lineEl.style.height = '0px';
    lineEl.style.zIndex = '9999989';
    lineEl.style.pointerEvents = 'none';
    
    document.body.appendChild(sEl);
    document.body.appendChild(lineEl);
    
    const spider = {
      el: sEl,
      lineEl: lineEl,
      x: sx,
      y: 32,
      vx: 0,
      vy: 0,
      state: 'ceiling_move',
      stateTimer: 3000 + Math.random() * 7000,
      facingLeft: Math.random() > 0.5,
      animAccum: 0,
      curFrame: 0,
      dead: false,
      prevState: 'ceiling_move',
      isHeld: false,
      isBig: isBigSpider,
      health: isBigSpider ? 3 : 1,
      maxHealth: isBigSpider ? 3 : 1,
      hitRadiusX: isBigSpider ? 78 : 50,
      hitRadiusY: isBigSpider ? 82 : 55,
      webSpeed: isBigSpider ? 520 : 400,
      webKnockback: isBigSpider ? 560 : 0,
      moveSpeed: isBigSpider ? (45 + Math.random() * 20) : (60 + Math.random() * 40),
      groundSpeed: isBigSpider ? (45 + Math.random() * 25) : (60 + Math.random() * 40)
    };
    
    // Add dragging functionality to spider
    sEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      spider.isHeld = true;
      draggedSpider = spider;
      spiderDragOffsetX = e.clientX - spider.x;
      spiderDragOffsetY = e.clientY - spider.y;
      spider.vx = 0;
      spider.vy = 0;
      
      // Preserve visual orientation while held so it doesn't jump
      spider.dragVisualTransform = '';
      if (spider.state === 'ceiling_move' || spider.state === 'ceiling_idle') {
          spider.dragVisualTransform = ' scaleY(-1)';
      } else if (spider.state === 'wall_move' || spider.state === 'wall_idle') {
          const rot = spider.onLeftWall ? (spider.facingUp ? -90 : -270) : (spider.facingUp ? 90 : 270);
          spider.dragVisualTransform = ` rotate(${rot}deg)`;
      }
      
      spider.state = 'held';
      if (spider.lineEl) {
        spider.lineEl.remove();
        spider.lineEl = null;
      }
      targetSpider = spider;
      lastSpiderDragX = spider.x;
      lastSpiderDragY = spider.y;
      lastSpiderDragTs = safeNow();
      sEl.style.cursor = 'grabbing';
      // Trigger cat chase
      if (state !== 'dragged' && state !== 'chasing_bug') go('chasing_bug');
    });

    sEl.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      spider.isHeld = true;
      draggedSpider = spider;
      spiderDragOffsetX = t.clientX - spider.x;
      spiderDragOffsetY = t.clientY - spider.y;
      spider.vx = 0;
      spider.vy = 0;
      
      // Preserve visual orientation while held so it doesn't jump
      spider.dragVisualTransform = '';
      if (spider.state === 'ceiling_move' || spider.state === 'ceiling_idle') {
          spider.dragVisualTransform = ' scaleY(-1)';
      } else if (spider.state === 'wall_move' || spider.state === 'wall_idle') {
          const rot = spider.onLeftWall ? (spider.facingUp ? -90 : -270) : (spider.facingUp ? 90 : 270);
          spider.dragVisualTransform = ` rotate(${rot}deg)`;
      }
      
      spider.state = 'held';
      if (spider.lineEl) {
        spider.lineEl.remove();
        spider.lineEl = null;
      }
      targetSpider = spider;
      lastSpiderDragX = spider.x;
      lastSpiderDragY = spider.y;
      lastSpiderDragTs = safeNow();
      sEl.style.cursor = 'grabbing';
      if (state !== 'dragged' && state !== 'chasing_bug') go('chasing_bug');
    }, { passive: false });
    
    activeSpiders.push(spider);
  }

  function spawnWebProjectile(sx, sy, tx, ty, options) {
    if (!document.body) return;
    const isBigWeb = !!(options && options.isBig);
    const wEl = document.createElement('div');
    wEl.className = isBigWeb ? 'pixel-spider-web pixel-spider-web-big' : 'pixel-spider-web';
    wEl.style.position = 'fixed';
    wEl.style.left = '0px';
    wEl.style.top = '0px';
    const spiderScale = spiderRenderScale();
    wEl.style.width = (SPIDER_CELL * spiderScale) + 'px';
    wEl.style.height = (SPIDER_CELL * spiderScale) + 'px';
    wEl.style.zIndex = '9999991';
    wEl.style.pointerEvents = 'none';
    wEl.style.backgroundImage = `url("${SPIDER_SHEET}")`;
    wEl.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
    wEl.style.backgroundRepeat = 'no-repeat';
    
    document.body.appendChild(wEl);
    
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
    const speed = (options && options.speed) || (isBigWeb ? 520 : 400);
    
    activeWebs.push({
      el: wEl,
      x: sx,
      y: sy,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      facingLeft: dx < 0,
      animAccum: 0,
      curFrame: 0,
      life: isBigWeb ? 4.0 : 3.5,
      big: isBigWeb,
      knockback: isBigWeb ? ((options && options.knockback) || 560) : 0
    });
  }

  function updateSpiders(dt) {
    // Cleanup if spiders disabled
    if (!spiderEnabled && (activeSpiders.length > 0 || activeWebs.length > 0)) {
      for (let i = 0; i < activeSpiders.length; i++) {
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
    
    // Spiders
    for (let i = activeSpiders.length - 1; i >= 0; i--) {
      const s = activeSpiders[i];
      if (s.dead && s.curFrame === SPIDER_ANIMS.death.fr - 1) {
         s.el.remove();
         if (s.lineEl) s.lineEl.remove();
         activeSpiders.splice(i, 1);
         continue;
      }
      
      if (s.isHeld) {
        // Occasionally change facing direction while being held (every 1-3 seconds)
        if (!s.heldDirectionTimer) s.heldDirectionTimer = 0;
        s.heldDirectionTimer += dt * 1000;
        if (s.heldDirectionTimer > 1000 + Math.random() * 2000) {
          s.facingLeft = Math.random() < 0.5;
          s.heldDirectionTimer = 0;
        }
        
        // Update walking animation for held spider
        s.animAccum += dt * 1000;
        const animDef = SPIDER_ANIMS.move; // Use walking animation instead of drop
        const msPerFrame = 1000 / animDef.fps;
        if (s.animAccum > msPerFrame) {
          s.animAccum -= msPerFrame;
          s.curFrame = (s.curFrame + 1) % animDef.fr;
        }
        
        // Render held spider position with walking animation
        const spiderScale = spiderRenderScale();
        let row = animDef.r;
        if (!s.facingLeft) row += 8;
        s.el.style.width = (SPIDER_CELL * spiderScale) + 'px';
        s.el.style.height = (SPIDER_CELL * spiderScale) + 'px';
        s.el.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
        s.el.style.backgroundPosition = `-${s.curFrame * SPIDER_CELL * spiderScale}px -${row * SPIDER_CELL * spiderScale}px`;
        s.el.style.transform = `translate3d(${(s.x - (SPIDER_CELL*spiderScale)/2) | 0}px, ${(s.y - (SPIDER_CELL*spiderScale)/2) | 0}px, 0)` + (s.dragVisualTransform || '') + (s.isBig ? ' scale(1.35)' : '');
        continue;
      }
      
      if (!s.dead) {
        s.stateTimer -= dt * 1000;
        
        // Nearest Cat
        let nearestCat = null;
        let minDist = 999999;
        const cats = PixelCatRuntime.instances;
        for (let ci = 0; ci < cats.length; ci++) {
           const cat = cats[ci];
           const dx = cat.feetX - s.x;
           const dy = cat.feetY - s.y;
           const distSq = dx * dx + dy * dy;
           if (distSq < minDist) { minDist = distSq; nearestCat = cat; }
        }
        minDist = Math.sqrt(minDist);
        
        const catX = nearestCat ? nearestCat.feetX : 0;
        const catY = nearestCat ? nearestCat.feetY : 0;
        
        let floorY = _vh;
        if (typeof computeFloor === 'function') {
           floorY = computeFloor(s.x);
        }
        const targetY = floorY - (SPIDER_CELL * spiderRenderScale()) / 2;

        switch (s.state) {
          case 'ceiling_move':
            s.y = 32;
            // Vary speed based on spider personality
            s.moveSpeed = s.moveSpeed || (60 + Math.random() * 40); // 60-100 px/s
            s.vx = (s.facingLeft ? -1 : 1) * s.moveSpeed;
            s.x += s.vx * dt;
            if (s.lineEl) { s.lineEl.style.height = '0px'; s.lineEl.style.left = s.x + 'px'; }
            if (s.x < 10) { s.x = 10; s.facingLeft = false; }
            if (s.x > _vw - 10) { s.x = _vw - 10; s.facingLeft = true; }
            if (s.stateTimer <= 0) {
               const roll = Math.random();
               if (roll < 0.5) {
                 s.state = 'ceiling_idle';
                 s.stateTimer = 1500 + Math.random() * 4500; // 1.5-6s idle
               } else {
                 s.state = 'dangle';
                 s.stateTimer = 2000 + Math.random() * 5000; // 2-7s dangle
                 s.vy = 30 + Math.random() * 70; // Varied drop speed
               }
            }
            break;
            
          case 'ceiling_idle':
            s.y = 32;
            s.vx *= 0.8;
            s.x += s.vx * dt;
            if (s.lineEl) { s.lineEl.style.height = '0px'; s.lineEl.style.left = s.x + 'px'; }
            if (s.stateTimer <= 0) {
               const roll = Math.random();
               if (roll < 0.6) {
                 s.state = 'ceiling_move';
                 s.stateTimer = 2000 + Math.random() * 6000; // 2-8s move
                 s.moveSpeed = s.isBig ? (45 + Math.random() * 20) : (60 + Math.random() * 40);
               } else {
                 s.state = 'dangle';
                 s.stateTimer = 2000 + Math.random() * 5000;
                 s.vy = 30 + Math.random() * 70;
               }
               s.facingLeft = Math.random() < 0.5;
            }
            break;
            
          case 'dangle':
            s.y += s.vy * dt;
            if (s.lineEl) {
               s.lineEl.style.height = Math.max(0, s.y + 15) + 'px';
               s.lineEl.style.left = (s.x - 1) + 'px';
            }
            if (s.y > targetY - 60) {
               s.state = 'jump';
               s.vy = JUMP_V * (0.3 + Math.random() * 0.2); // Varied jump strength
               s.vx = 0;
               if (s.lineEl) { s.lineEl.remove(); s.lineEl = null; }
            } else if (s.stateTimer <= 0) {
               s.state = 'dangle_pause';
               s.stateTimer = 800 + Math.random() * 2200; // 0.8-3s pause
               // Shoot web at cat if close enough
               if (Math.random() < (s.isBig ? 0.5 : 0.35) && minDist < (s.isBig ? 520 : 450)) {
                  spawnWebProjectile(s.x, s.y, catX, catY - 20, { isBig: s.isBig, speed: s.webSpeed, knockback: s.webKnockback });
                  s.facingLeft = catX < s.x;
               }
            }
            break;
            
          case 'dangle_pause':
            if (s.lineEl) {
               s.lineEl.style.height = Math.max(0, s.y + 15) + 'px';
               s.lineEl.style.left = (s.x - 1) + 'px';
            }
            if (s.stateTimer <= 0) {
               if (Math.random() < 0.3 || s.y > targetY - 150) {
                  s.state = 'jump';
                  s.vy = 0;
                  s.vx = 0;
                  if (s.lineEl) { s.lineEl.remove(); s.lineEl = null; }
               } else {
                  s.state = 'dangle';
                  s.stateTimer = 1000 + Math.random() * 2000;
                  s.vy = 30 + Math.random() * 50;
               }
            }
            break;

          case 'drop':
            s.y += s.vy * dt;
            if (s.y > targetY - 60 || s.stateTimer <= 0) {
               s.state = 'jump';
               s.vy = JUMP_V * 0.4;
               s.vx = (Math.random() < 0.5 ? 1 : -1) * 150;
               if (s.lineEl) { s.lineEl.remove(); s.lineEl = null; }
            }
            break;
          case 'jump':
            s.vy += GRAVITY * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.y >= targetY) {
              s.y = targetY;
              s.state = 'move';
              s.stateTimer = 1000 + Math.random() * 2000;
              s.groundSpeed = s.isBig ? (45 + Math.random() * 25) : (60 + Math.random() * 40);
            }
            break;
          case 'damage':
            s.vy += GRAVITY * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vx *= 0.94;
            if (s.x < 10) { s.x = 10; s.vx = Math.abs(s.vx) * 0.35; }
            if (s.x > _vw - 10) { s.x = _vw - 10; s.vx = -Math.abs(s.vx) * 0.35; }
            if (s.y >= targetY) {
              s.y = targetY;
              s.vy = 0;
            }
            if (s.stateTimer <= 0) {
              s.state = 'move';
              s.stateTimer = 900 + Math.random() * 1400;
              s.groundSpeed = s.isBig ? (50 + Math.random() * 30) : (60 + Math.random() * 40);
              s.facingLeft = catX > s.x;
            }
            break;
          case 'idle':
            s.y = targetY; // stick to moving platforms
            s.vx *= 0.8;
            s.x += s.vx * dt;
            // React to nearby cats
            if (minDist < 250) {
              s.state = 'move';
              s.stateTimer = 1500 + Math.random() * 2500; // 1.5-4s
              s.groundSpeed = s.isBig ? (45 + Math.random() * 25) : (60 + Math.random() * 40);
              s.facingLeft = catX > s.x; // run away from cat
            } else if (s.stateTimer <= 0) {
              const roll = Math.random();
              if (roll < 0.4) {
                s.state = 'move';
                s.stateTimer = 1000 + Math.random() * 3000; // 1-4s
                s.groundSpeed = s.isBig ? (45 + Math.random() * 25) : (60 + Math.random() * 40);
              } else {
                s.state = 'idle';
                s.stateTimer = 1000 + Math.random() * 2500; // 1-3.5s
              }
              s.facingLeft = Math.random() < 0.5;
            }
            break;
          case 'move':
            s.y = targetY; // stick to moving platforms
            // Varied movement speed
            s.groundSpeed = s.groundSpeed || (s.isBig ? (45 + Math.random() * 25) : (60 + Math.random() * 40)); // 60-100 px/s
            s.vx = (s.facingLeft ? -1 : 1) * s.groundSpeed;
            s.x += s.vx * dt;
            if (s.x < 10) { s.x = 10; s.facingLeft = false; }
            if (s.x > _vw - 10) { s.x = _vw - 10; s.facingLeft = true; }
            
            // Shoot web at cat if in range
            if (minDist < 350 && minDist > 80 && Math.random() < 0.008) {
              s.state = 'shoot';
              s.stateTimer = 400 + Math.random() * 200; // 0.4-0.6s
              s.facingLeft = catX < s.x; // face cat to shoot
              s.curFrame = 0;
            } else if (s.stateTimer <= 0) {
              s.state = 'idle';
              s.stateTimer = 800 + Math.random() * 1700; // 0.8-2.5s
            }
            break;
          case 'shoot':
            s.y = targetY; // stick to moving platforms
            s.vx = 0;
            if (s.stateTimer <= 0) {
               spawnWebProjectile(s.x, s.y, catX, catY - 20, { isBig: s.isBig, speed: s.webSpeed, knockback: s.webKnockback });
               s.state = 'move';
               s.stateTimer = 1200 + Math.random() * 1800; // 1.2-3s
               s.groundSpeed = s.isBig ? (50 + Math.random() * 30) : (60 + Math.random() * 40);
               s.facingLeft = catX > s.x; // run away after shooting
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
      if (s.state === 'ceiling_move') animDef = SPIDER_ANIMS.move;
      if (s.state === 'ceiling_idle') animDef = SPIDER_ANIMS.idle;
      if (s.state === 'wall_move') animDef = SPIDER_ANIMS.move;
      if (s.state === 'wall_idle') animDef = SPIDER_ANIMS.idle;
      if (s.state === 'dangle' || s.state === 'dangle_pause') animDef = SPIDER_ANIMS.drop;
      if (s.dead) animDef = SPIDER_ANIMS.death;
      else if (s.state === 'damage') animDef = SPIDER_ANIMS.damage;

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
      s.el.style.width = (SPIDER_CELL * spiderScale) + 'px';
      s.el.style.height = (SPIDER_CELL * spiderScale) + 'px';
      s.el.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
      s.el.style.backgroundPosition = `-${s.curFrame * SPIDER_CELL * spiderScale}px -${row * SPIDER_CELL * spiderScale}px`;
      let trans = `translate3d(${(s.x - (SPIDER_CELL*spiderScale)/2) | 0}px, ${(s.y - (SPIDER_CELL*spiderScale)/2) | 0}px, 0)`;
      if (s.state === 'ceiling_move' || s.state === 'ceiling_idle') {
          trans += ' scaleY(-1)';
      } else if (s.state === 'wall_move' || s.state === 'wall_idle') {
          const rot = s.onLeftWall ? (s.facingUp ? -90 : -270) : (s.facingUp ? 90 : 270);
          trans += ` rotate(${rot}deg)`;
      }
      if (s.isBig) trans += ' scale(1.35)';
      s.el.style.transform = trans;
    }

    // Webs
    for (let i = activeWebs.length - 1; i >= 0; i--) {
       const w = activeWebs[i];
       w.life -= dt;
       w.x += w.vx * dt;
       w.y += w.vy * dt;
       
       let hit = false;
       PixelCatRuntime.instances.forEach(cat => {
         if (cat.state === 'webbed_stun') return;
         const dx = cat.feetX - w.x;
         const dy = cat.feetY - w.y;
         const catScale = Math.max(1, cat.sizeMultiplier || 1);
         const hitRadius = (w.big ? 70 : 50) + (catScale - 1) * 26;
         if (dx*dx + dy*dy < hitRadius * hitRadius) {
            cat.go('webbed_stun');
            if (w.big && typeof cat.knockbackFrom === 'function') {
              cat.knockbackFrom(w.x, w.knockback || 560);
            }
            hit = true;
         }
       });
       
       if (hit || w.life <= 0 || w.x < -100 || w.x > _vw + 100 || w.y > _vh + 100) {
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
       w.el.style.width = (SPIDER_CELL * spiderScale) + 'px';
       w.el.style.height = (SPIDER_CELL * spiderScale) + 'px';
       w.el.style.backgroundSize = `${9 * SPIDER_CELL * spiderScale}px ${16 * SPIDER_CELL * spiderScale}px`;
       w.el.style.backgroundPosition = `-${w.curFrame * SPIDER_CELL * spiderScale}px -${row * SPIDER_CELL * spiderScale}px`;
       w.el.style.transform = `translate3d(${(w.x - (SPIDER_CELL*spiderScale)/2) | 0}px, ${(w.y - (SPIDER_CELL*spiderScale)/2) | 0}px, 0)` + (w.big ? ' scale(1.2)' : '');
    }
  }

  // 
  //  BALL SUBSYSTEM
  // 
  const activeBalls = PixelCatRuntime.balls;
  let ballSpawnTimer = 5; // Start spawning quickly since only one type can be active
  let targetBall = null;
  let draggedBall = null;
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

  function cleanupGlobalArtifacts() {
    cleanupEntityList(activeFishes);
    cleanupEntityList(activeSpiders, ['lineEl']);
    cleanupEntityList(activeWebs);
    cleanupEntityList(activeBalls);
    if (typeof cleanupPortals === 'function') cleanupPortals();
    targetFish = null;
    draggedFish = null;
    targetBall = null;
    draggedBall = null;
    targetSpider = null;
    draggedSpider = null;
    activePickupKind = null;
  }

  let _activeBallId = 'ball_baseball';

  // Load active ball from storage (updates when changed via shop)
  getLocal({ activeBall: 'ball_baseball' }).then(d => {
    _activeBallId = d.activeBall || 'ball_baseball';
  }).catch(() => {});

  const ballModule = window.PixelCatBalls({
    u,
    safeNow,
    GRAVITY,
    addTimeout,
    spawnDust,
    activeBalls,
    hasActivePickup,
    claimActivePickup,
    releaseActivePickup,
    get vw() { return _vw; },
    get vh() { return _vh; },
    get sizeMultiplier() { return sizeMultiplier; },
    get catEnabled() { return catEnabled; },
    get ballEnabled() { return ballEnabled; },
    get activeBallId() { return _activeBallId; },
    get ballSpawnTimer() { return ballSpawnTimer; },
    set ballSpawnTimer(value) { ballSpawnTimer = value; },
    get targetBall() { return targetBall; },
    set targetBall(value) { targetBall = value; },
    get draggedBall() { return draggedBall; },
    set draggedBall(value) { draggedBall = value; },
    set ballDragOffsetX(value) { ballDragOffsetX = value; },
    set ballDragOffsetY(value) { ballDragOffsetY = value; },
    set lastBallDragX(value) { lastBallDragX = value; },
    set lastBallDragY(value) { lastBallDragY = value; },
    set lastBallDragTs(value) { lastBallDragTs = value; }
  });
  const { spawnBall, updateBalls } = ballModule;

  // 
  //  PORTAL SUBSYSTEM
  // 
  // portalEnabled is loaded from storage via updateSettings({ portalEnabled }) â€” starts off
  // Spawn timer: very long & randomized so portals feel like a rare, magical surprise
  let portalSpawnTimer = 90 + Math.random() * 90; // First portal: 90-180s after enabling
  let portalEnabled = false; // Loaded from storage (Level 7 skill unlock required)
  let isInPortal = false;
  let portalCooldown = 0;

  const portalModule = window.PixelCatPortals({
    u,
    addTimeout,
    get vw() { return _vw; },
    get vh() { return _vh; },
    get sizeMultiplier() { return sizeMultiplier; },
    get catEnabled() { return catEnabled; }
  });
  const { spawnPortalPair, updatePortals, checkCatPortalCollision, teleportCat, cleanup: cleanupPortals } = portalModule;

  function hitBall(ball, vx, vy) {
    if (!ball || ball.exiting || ball.removing) return;
    ball.vx = vx;
    ball.vy = vy;
    ball.onGround = false;
    ball.hitCount = (ball.hitCount || 0) + 1;
    ball.vrot = (vx || 0) * 2;

    const age = Number(ball.age) || 0;
    const exitAfter = Number(ball.exitAfter) || 30;
    const hitTarget = Number(ball.exitHitAfter) || 6;
    const isPastNaturalTime = age >= exitAfter;
    const isGettingOld = age >= exitAfter * 0.7 && ball.hitCount >= hitTarget;
    const randomFinish = isGettingOld && Math.random() < 0.35;

    ball.exitOnWall = isPastNaturalTime || randomFinish;
  }

  // 
  //  HELPERS
  // 
  // Pick idle/clean variant ONCE per state entry (stored in chosenIdle/chosenClean)
  function pickIdleVariant()  { chosenIdle  = Math.random() < 0.5 ? 'idle1' : 'idle2'; return chosenIdle; }
  function pickCleanVariant() { chosenClean = Math.random() < 0.5 ? 'clean1' : 'clean2'; return chosenClean; }

  function isElVisible(el) {
    if (!el || !el.isConnected) return false;
    // offsetParent is null for display:none and fixed elements  cheap check
    if (el.offsetParent === null && el.tagName !== 'BODY') return false;
    // Skip getComputedStyle (expensive)  offsetParent already filters display:none
    // Only check offsetWidth/Height as a fast proxy for visibility
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    return true;
  }

  // 
  //  ENVIRONMENT SCANNER
  // 
  const envRects = PixelCatRuntime.envRects;
  let envPending  = false;
  let contentMutationObserver = null;
  let mutationScanTimeout = null;
  let lastMutationScanNudge = 0;

  // Hoist selector arrays outside function  no re-allocation each scan
  const _platSels = [
    'ytd-rich-item-renderer',
    'ytd-rich-grid-media',
    'ytd-rich-section-renderer',
    'ytd-compact-video-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'yt-lockup-view-model',
    'yt-thumbnail-view-model',
    'ytd-channel-renderer',
    'ytd-playlist-renderer',
    'ytd-radio-renderer',
    'ytd-shelf-renderer',
    'ytd-rich-shelf-renderer',
    'ytd-rich-grid-row',
    'ytd-playlist-panel-video-renderer',
    'ytd-comment-thread-renderer',
    'ytd-reel-video-renderer',
    'ytd-reel-item-renderer',
    'ytd-reel-shelf-renderer',
    'ytm-shorts-lockup-view-model',
    // NOTE: video player controls (.ytp-chrome-bottom, .ytp-progress-bar-container) intentionally
    // EXCLUDED from platforms â€” they hide/show dynamically and cause the cat to float mid-air.
    // They remain in _attackSels so the cat can still interact with them.
  ];
  const _attackSels = [
    '#video-title',
    'h3.ytd-rich-grid-media',
    'yt-formatted-string#video-title',
    'a#video-title',
    'yt-lockup-metadata-view-model',
    'yt-lockup-view-model',
    '.ytp-title-text',
    'ytd-thumbnail',
    'yt-thumbnail-view-model',
    'ytd-thumbnail-overlay-time-status-renderer',
    '.ytd-channel-name a',
    'ytd-channel-name',
    'ytd-channel-renderer',
    'ytd-playlist-renderer',
    'ytd-radio-renderer',
    'ytd-chip-cloud-chip-renderer',
    'yt-chip-cloud-chip-renderer',
    'yt-related-chip-cloud-chip-renderer',
    'ytd-comment-renderer #content-text',
    'ytd-comment-view-model',
    'ytd-comment-thread-renderer',
    '#info-strings span',
    '#owner-sub-count',
    '#subscribe-button',
    '#top-level-buttons-computed',
    'yt-button-shape',
    'button.yt-spec-button-shape-next',
    'ytd-playlist-panel-video-renderer',
    'ytd-reel-player-overlay-renderer',
    'yt-reel-metapanel-view-model',
    'yt-reel-channel-bar-view-model',
    'yt-reel-video-title-view-model',
    'yt-reel-action-bar-view-model',
    'ytd-logo',
    'a#logo',
    '#search-input',
    '#search-form',
    'ytd-searchbox',
    'ytd-guide-entry-renderer',
    'ytd-mini-guide-entry-renderer',
  ];

  function doEnvScan() {
    envPending = false;
    _logicRectCache.clear();
    if (isDestroyed || !isTabVisible || document.hidden) return;
    if (isScrolling) {
      scheduleContentSettledScan(650);
      return;
    }
    const out = [];
    const vh = _vh, vw = _vw;

    function collect(sels, isPlatform, isAttack) {
      const root = document.querySelector('ytd-app') || document.body;
      for (let s = 0; s < sels.length; s++) {
        if (out.length >= 30) break;
        try {
          const els = root.querySelectorAll(sels[s]);
          const minH = sels[s].indexOf('ytp') !== -1 ? 2 : 10;
          for (let i = 0; i < els.length && out.length < 30; i++) {
            const el = els[i];
            if (!isElVisible(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 10 || r.height < minH) continue;
            if (r.top >= vh || r.bottom <= 40 || r.right <= 0 || r.left >= vw) continue;
            if (isPlatform && r.height > vh * 0.6) continue;

            const tag = el.tagName.toUpperCase();
            const isChip = tag === 'YTD-CHIP-CLOUD-CHIP-RENDERER';
            const isLogo = tag === 'YTD-LOGO' || el.id === 'logo' || el.closest('ytd-logo');
            const isSearch = el.id === 'search' || tag === 'YTD-SEARCHBOX' || el.closest('#search');

            out.push({
              el,
              left: r.left, right: r.right,
              top: r.top, bottom: r.bottom,
              w: r.width, h: r.height,
              isPlatform, isAttack,
              isChip, isLogo, isSearch
            });
          }
        } catch (_) { /* ignore */ }
      }
    }
    collect(_platSels, true, false);
    collect(_attackSels, false, true);
    PixelCatRuntime.envRects.length = 0;
    PixelCatRuntime.envRects.push(...out);
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

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => requestAnimationFrame(run), { timeout: 700 });
    } else {
      requestAnimationFrame(run);
    }
  }

  function scheduleEnvScan(delay) {
    if (isCompanion) return;
    if (isDestroyed || !isTabVisible || document.hidden) return;
    if (envPending) return;
    envPending = true;
    addTimeout(runEnvScanWhenReady, delay == null ? 0 : delay);
  }

  function scheduleContentSettledScan(delay) {
    if (isCompanion || isDestroyed || !isTabVisible || document.hidden) return;
    removeTimeout(mutationScanTimeout);
    mutationScanTimeout = addTimeout(() => {
      mutationScanTimeout = null;
      if (isScrolling) {
        scheduleContentSettledScan(650);
        return;
      }
      scheduleEnvScan(0);
    }, delay == null ? 900 : delay);
  }

  function observeContentSettling() {
    if (isCompanion || typeof MutationObserver !== 'function') return;
    const root = document.querySelector('ytd-app') || document.body;
    if (!root) return;
    contentMutationObserver = new MutationObserver((mutations) => {
      if (isDestroyed || !isTabVisible || document.hidden) return;
      const now = safeNow();
      if (now - lastMutationScanNudge < 450) return;
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length || mutations[i].removedNodes.length) {
          lastMutationScanNudge = now;
          scheduleContentSettledScan(700);
          return;
        }
      }
    });
    contentMutationObserver.observe(root, { childList: true, subtree: true });
  }

  scheduleEnvScan(document.readyState === 'complete' ? 600 : 1200);
  observeContentSettling();
  // Scan every 4s instead of 3s  env changes slowly
  addInterval(() => {
    if (!catEnabled || !isTabVisible || document.hidden) return;
    if (isScrolling) return;
    scheduleEnvScan(0);
  }, 4000);
  // NOTE: scroll-triggered scans are now handled by the isScrolling scroll listener above

  // 
  //  SMASH ELEMENT
  // 
  const activeSmashes = [];

  function smashElement(el) {
    if (!el || !el.isConnected) return;
    const existing = activeSmashes.find(s => s.el === el);
    if (existing) { existing.t = 0; return; }
    
    activeSmashes.push({
      el,
      t: 0,
      origT: el.style.transform || '',
      origO: el.style.opacity   || '',
      origTransition: el.style.transition || '',
    });
    el.style.transition = 'none'; // Clear transition for manual vibration
  }

  function updateSmashes(dt) {
    for (let i = activeSmashes.length - 1; i >= 0; i--) {
      const s = activeSmashes[i];
      if (!s.el.isConnected) { activeSmashes.splice(i, 1); continue; }
      
      s.t += dt * 1000;
      if (s.t < 400) {
        // Shaking phase
        const rot = (Math.random() - 0.5) * 3;
        const tx  = (Math.random() - 0.5) * 4;
        const ty  = (Math.random() - 0.5) * 3;
        s.el.style.transform = `rotate(${rot}deg) translate3d(${tx}px,${ty}px, 0)`;
      } else {
        // Finished shaking - apply final tilt
        const finalRot = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);
        s.el.style.transition = 'transform 0.4s cubic-bezier(.18,.89,.32,1.15)';
        s.el.style.transform  = `rotate(${finalRot}deg)`;
        
        const elToReset = s.el;
        const oT = s.origT, oO = s.origO, oTransition = s.origTransition;
        addTimeout(() => {
          if (elToReset.isConnected) {
            elToReset.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
            elToReset.style.transform  = oT;
            elToReset.style.opacity    = oO;
            addTimeout(() => {
              if (elToReset.isConnected) elToReset.style.transition = oTransition;
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
        s.el.style.transition = s.origTransition || '';
        s.el.style.transform = s.origT || '';
        s.el.style.opacity = s.origO || '';
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
    activeBounces.forEach((original, el) => restoreBouncedElement(el, original));
    activeBounces.clear();
  }

  //  NEW: Gentle spring bounce for cards when cat lands on them
  function bounceElement(el, impactVelocity) {
    if (!el || !el.isConnected) return;
    let original = activeBounces.get(el);
    if (!original) {
      original = {
        transition: el.style.transition || '',
        transform: el.style.transform || ''
      };
      activeBounces.set(el, original);
    }
    
    // Calculate intensity based on landing velocity (cap to a safe visual limit)
    const intensity = Math.min(1.0, impactVelocity / 600);
    const squash = 1 - (0.05 * intensity);  // Max 5% squash
    const translate = 3 * intensity;        // Max 3px translate
    
    // Apply swift downward squash
    el.style.transition = 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)';
    el.style.transform = `scaleY(${squash}) translateY(${translate}px)`;
    
    // Spring back up after short delay
    addTimeout(() => {
      if (activeBounces.get(el) !== original) return;
      if (isDestroyed || !el.isConnected) {
        restoreBouncedElement(el, original);
        return;
      }
      if (el.isConnected) {
        el.style.transition = 'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)'; // spring
        el.style.transform = original.transform;
        
        // Cleanup inline transition styles after it finishes
        addTimeout(() => {
          if (activeBounces.get(el) === original) restoreBouncedElement(el, original);
        }, 400);
      }
    }, 100);
  }

  addManagedEventListener(document, 'yt-navigate-start', () => {
    cleanupSmashIntervals();
    cleanupBouncedElements();
    if (envRects) envRects.length = 0;
    attackEl = null;
    scheduleEnvScan(100);
  });
  addManagedEventListener(document, 'yt-navigate-finish', () => scheduleEnvScan(600));

  // 
  //  SCROLL STATE TRACKING
  // 
  // During active scrolling, keep cached platform rects in viewport space by applying
  // scroll deltas. This avoids expensive rescans while preventing "fall through" glitches.
  let isScrolling = false;
  let _scrollEndTimeout = null;
  let _scrollTrackY = window.scrollY;
  let _scrollRaf = 0;
  let _pendingScrollDeltaY = 0;
  let lastScrollActivityAt = safeNow();

  function syncCatToScrolledPlatform(deltaY) {
    if (!deltaY || !onGround || isDragging || state === 'dragged' || state === 'hide' || state === 'hidden') return;
    if (feetY >= _vh - 8) return;

    const expectedY = feetY - deltaY;
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r || !r.isPlatform || !r.el || !r.el.isConnected) continue;
      const inset = getPlatformInset(r);
      if (feetX < r.left + inset || feetX > r.right - inset) continue;
      const dist = Math.abs(r.top - expectedY);
      if (dist < 90 && dist < bestDist) {
        best = r;
        bestDist = dist;
      }
    }

    if (!best) return;
    feetY = best.top;
    velY = 0;
    isJumping = false;
    lastTransformStr = '';
    applyPos();
    if (typeof positionSpeechBubble === 'function') positionSpeechBubble(true);
  }

  addManagedEventListener(document, 'scroll', () => {
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
        syncCatToScrolledPlatform(dy);
      });
    }

    removeTimeout(_scrollEndTimeout);
    _scrollEndTimeout = addTimeout(() => {
      isScrolling = false;
      scheduleEnvScan(90);
    }, 220);
  }, { passive: true, capture: true });

  // 
  //  PLATFORM FLOOR
  // 
  function computeFloor(catX) {
    const base = _vh;
    //  When cat is intentionally dropping during chasefish, skip platforms
    if (state === 'chasefish' && velY > 0 && !onGround) {
      return base;
    }
    let best = base;
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform) continue;
      const inset = getPlatformInset(r);
      if (catX < r.left + inset || catX > r.right - inset) continue;
      const standY = r.top;
      if (feetY <= standY + getPlatformSnapTolerance() && standY < best && standY > 50) {
        best = standY;
      }
    }
    return best;
  }

  // Find platform cat is currently standing on
  function getCurrentPlatform() {
    if (!onGround) return null;
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      const inset = getPlatformInset(r);
      if (feetX >= r.left + inset && feetX <= r.right - inset && Math.abs(feetY - r.top) < getPlatformAttachTolerance()) {
        return r;
      }
    }
    return null;
  }

  // Check if the platform the cat is standing on still exists and is visible
  function isPlatformStillValid(platform) {
    if (!platform || !platform.el) return false;
    if (!platform.el.isConnected) return false;
    if (!isElVisible(platform.el)) return false;
    return true;
  }

  // Find platform that target is on
  function getPlatformAt(x, y) {
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      if (x >= r.left && x <= r.right && Math.abs(y - r.top) < 30) {
        return r;
      }
    }
    return null;
  }

  // 
  //  CARD EDGE DETECTION
  // 
  function isNearPlatformEdge(catX, direction) {
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      const inset = getPlatformInset(r);
      if (catX < r.left + inset || catX > r.right - inset) continue;
      if (Math.abs(feetY - r.top) > getPlatformAttachTolerance()) continue;
      const edgeZone = Math.max(50, inset + 22);
      if (direction > 0 && catX > r.right - edgeZone) return true;
      if (direction < 0 && catX < r.left + edgeZone)  return true;
    }
    return false;
  }

  function findAdjacentPlatform(catX, direction) {
    let bestDist = Infinity, bestPlat = null;
    for (let i = 0; i < envRects.length; i++) {
      const r = envRects[i];
      if (!r.isPlatform || !r.el.isConnected) continue;
      if (Math.abs(r.top - feetY) > 60) continue;
      if (direction > 0) {
        const dist = r.left - catX;
        if (dist > 0 && dist < 250 && dist < bestDist) { bestDist = dist; bestPlat = r; }
      } else {
        const dist = catX - r.right;
        if (dist > 0 && dist < 250 && dist < bestDist) { bestDist = dist; bestPlat = r; }
      }
    }
    return bestPlat;
  }

  // 
  //  ADVANCED PATHFINDING ENGINE
  //  Evaluates environment to determine optimal route
  //  to reach any target (tx, ty) from current position.
  //  Returns action: { type, ... } with navigation hints.
  // 
  function planRouteToTarget(tx, ty) {
    const dx = tx - feetX;
    const dy = ty - feetY;  // positive = target below
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const dir = dx > 0 ? 1 : -1;
    const catPlat = onGround ? getCurrentPlatform() : null;

    //  CASE 1: Target is reachable on same ground level 
    if (absDy < 60 && absDx < 400) {
      return { type: 'walk', dir };
    }

    //  CASE 2: Target is ABOVE  find stepping stone platforms 
    if (dy < -40) {
      // Find a platform between cat and target that we can jump to
      let bestStep = null, bestScore = Infinity;
      for (let i = 0; i < envRects.length; i++) {
        const r = envRects[i];
        if (!r.isPlatform || !r.el.isConnected) continue;
        // Platform must be ABOVE cat but BELOW or AT target
        if (r.top >= feetY - 10 || r.top < ty - 50) continue;
        // Must be horizontally reachable (within jump range)
        const platCenterX = r.left + r.w / 2;
        const distFromCat = Math.abs(platCenterX - feetX);
        if (distFromCat > 200) continue;
        // Score: prefer platforms that move us TOWARD the target
        const distFromTarget = Math.hypot(platCenterX - tx, r.top - ty);
        const score = distFromTarget + distFromCat * 0.3;
        if (score < bestScore) { bestScore = score; bestStep = r; }
      }

      if (bestStep) {
        const platX = bestStep.left + bestStep.w / 2;
        return {
          type: 'jump-to-platform',
          platX,
          platY: bestStep.top,
          dir: platX > feetX ? 1 : -1,
          heightDiff: feetY - bestStep.top
        };
      }

      // No stepping platform  check if near a wall, climb it
      if (feetX < 80) {
        return { type: 'climb-wall', wall: 'left' };
      }
      if (feetX > _vw - 80) {
        return { type: 'climb-wall', wall: 'right' };
      }

      // Run toward nearest wall to climb
      const nearestWall = feetX < _vw / 2 ? 'left' : 'right';
      return { type: 'run-to-wall', wall: nearestWall, dir: nearestWall === 'left' ? -1 : 1 };
    }

    //  CASE 3: Target is BELOW  need to drop down 
    if (dy > 60 && catPlat) {
      const distToLeft = feetX - catPlat.left;
      const distToRight = catPlat.right - feetX;
      const dropDir = distToLeft < distToRight ? -1 : 1;
      // Prefer dropping toward target X
      const smartDir = dx > 0 ? 1 : -1;
      const edgeDir = (distToLeft < 60 || distToRight < 60) ? dropDir : smartDir;
      return { type: 'drop-down', dir: edgeDir };
    }

    //  CASE 4: Target is far horizontally  platform hop 
    if (absDx > 300 && onGround) {
      const adj = findAdjacentPlatform(feetX, dir);
      if (adj) {
        return { type: 'hop-platform', dir, plat: adj };
      }
    }

    //  CASE 5: Direct approach 
    return { type: 'walk', dir };
  }

  // Execute a route plan  returns true if an action was taken
  function executeRoute(route) {
    if (!route || !onGround || isJumping) return false;
    if (route.type === 'walk') return false;  // walk is handled by caller
    if (pathfindCooldown > 0) return false;    // cooldown active
    pathfindCooldown = 2.0;  // 2 second cooldown after any pathfind action

    switch (route.type) {
      case 'jump-to-platform': {
        // Jump toward the platform stepping stone
        const jumpPow = Math.min(1.2, 0.6 + route.heightDiff / 300);
        const horizPow = 0.9 + Math.random() * 0.4;
        velY = JUMP_V * jumpPow;
        velX = route.dir * SPEED_RUN * horizPow * 1.3;
        setDir(velX < 0);
        setAnim('jump', true);
        isJumping = true; onGround = false;
        return true;
      }
      case 'climb-wall': {
        if (route.wall === 'left') {
          feetX = getWallAttachX('left');
          go('wall_left');
        } else {
          feetX = getWallAttachX('right');
          go('wall_right');
        }
        return true;
      }
      case 'run-to-wall': {
        velX = route.dir * SPEED_RUN * 1.3;
        setDir(velX < 0);
        setAnim('run');
        return true;
      }
      case 'drop-down': {
        velX = route.dir * SPEED_RUN * 1.2;
        velY = 50;
        onGround = false; isJumping = true;
        setAnim('jump', true);
        return true;
      }
      case 'hop-platform': {
        const hp = 0.6 + Math.random() * 0.4;
        velY = JUMP_V * hp;
        velX = route.dir * SPEED_RUN * 1.2;
        setDir(velX < 0);
        setAnim('jump', true);
        isJumping = true; onGround = false;
        return true;
      }
      default:
        return false;
    }
  }

  // 
  //  ATTACK TARGET PICKER & CACHING
  // 
  function pickAttackRect() {
    const pool = envRects.filter(r => r.isAttack && r.el.isConnected && r.top > 50);
    return pool.length ? pool[~~(Math.random() * pool.length)] : null;
  }

  const _logicRectCache = new Map();
  function getCachedRect(el) {
    if (!el || !el.isConnected) return { left: 0, top: 0, w: 0, h: 0, width: 0, height: 0 };
    for (let i = 0; i < envRects.length; i++) {
      if (envRects[i].el === el) return envRects[i];
    }
    if (_logicRectCache.has(el)) return _logicRectCache.get(el);
    const r = el.getBoundingClientRect();
    const result = { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height, width: r.width, height: r.height };
    _logicRectCache.set(el, result);
    return result;
  }

  function getUiActionTarget() {
    const candidates = [];
    const topButtons = document.querySelectorAll('#top-level-buttons-computed ytd-toggle-button-renderer button, ytd-menu-renderer ytd-toggle-button-renderer button');
    for (let i = 0; i < topButtons.length; i++) {
      const btn = topButtons[i];
      if (!btn || !btn.isConnected) continue;
      const label = ((btn.getAttribute('aria-label') || '') + ' ' + (btn.getAttribute('title') || '')).toLowerCase();
      if (label.includes('dislike')) candidates.push({ type: 'dislike', el: btn });
      else if (label.includes('like')) candidates.push({ type: 'like', el: btn });
    }

    const progress = document.querySelector('.ytp-progress-bar, .ytp-progress-bar-container');
    if (progress && progress.isConnected) {
      candidates.push({ type: 'progress', el: progress });
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
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      if (typeof el.click === 'function') el.click();
    } catch (_) {
      // Some YouTube controls may ignore synthetic events; ignore safely.
    }
  }

  // 
  //  PERSONALITY & BEHAVIOR STATES
  // 
  const personality = Math.random();

  const STATES = [
    { s: 'wander',     w: 14, e: 0.3, b: 0.4 },
    { s: 'sit',        w: personality < 0.3 ? 20 : 16, e: 0, b: 0 },
    { s: 'groom',      w: personality < 0.3 ? 12 : 8, e: 0.1, b: 0 },
    { s: 'chase',      w: personality > 0.7 ? 10 : 6, e: 0.5, b: 0.7 },
    { s: 'attack',     w: 12, e: 0.5, b: 0.5 },
    { s: 'hide',       w: 8, e: 0.3, b: 0.2 },
    { s: 'zoomies',    w: personality > 0.7 ? 8 : 3, e: 0.8, b: 1.0 },
    { s: 'jump',       w: 5, e: 0.4, b: 0.3 },
    { s: 'stare',      w: 10, e: 0, b: 0 },
    { s: 'spook',      w: 3, e: 0.2, b: 0 },
    { s: 'climbtop',   w: 6, e: 0.6, b: 0.4 },
    { s: 'patrol',     w: 10, e: 0.4, b: 0.5 },
    { s: 'pounce',     w: personality > 0.7 ? 6 : 3, e: 0.6, b: 0.6 },
    { s: 'nap',        w: personality < 0.3 ? 10 : 5, e: 0, b: 0 },
    { s: 'stretch',    w: 5, e: 0.1, b: 0 },
    { s: 'watchvideo', w: 10, e: 0, b: 0 },
    { s: 'knockoff',   w: 4, e: 0.4, b: 0.8 },
    { s: 'ui_mischief',w: 5, e: 0.35, b: 0.9 },
    { s: 'pawplay',    w: 6, e: 0.2, b: 0.2 },
    { s: 'edgesit',    w: 7, e: 0.1, b: 0.1 },
    { s: 'headtilt',   w: 5, e: 0.1, b: 0 },
    { s: 'explore',    w: 8, e: 0.3, b: 0.6 },
    { s: 'ninja_climb',w: 5, e: 0.8, b: 0.5 },
    { s: 'peek_a_boo', w: 7, e: 0.3, b: 0.3 },
    { s: 'logo_hunt',  w: 6, e: 0.3, b: 0.5 },
    { s: 'chip_pounce',w: 8, e: 0.4, b: 0.7 },
    { s: 'search_paw', w: 5, e: 0.2, b: 0.4 },
    { s: 'ball_play',  w: 12, e: 0.5, b: 0.8 },
  ];

  const AGGRESSIVE_STATES = new Set(['attack', 'knockoff', 'pounce', 'ui_mischief']);

  function pick(excl) {
    let total = 0;
    const weights = new Array(STATES.length);
    
    for (let i = 0; i < STATES.length; i++) {
      const x = STATES[i];
      if (excl && excl.includes(x.s)) { weights[i] = 0; continue; }
      if (!isAggressiveMode && AGGRESSIVE_STATES.has(x.s)) { weights[i] = 0; continue; }
      if (!uiMischiefEnabled && x.s === 'ui_mischief') { weights[i] = 0; continue; }
      let weight = x.w;
      
      // Energy constraints and preferences
      if (x.e && catEnergy < x.e) weight *= 0.1;
      if (x.e && catEnergy > 0.7) weight *= 1.5;
      if (catEnergy < 0.2 && (x.s === 'nap' || x.s === 'sit' || x.s === 'groom')) weight *= 3;
      
      // Boredom solver
      if (catBoredom > 0.6 && x.b > 0.5) weight *= 2.5;
      if (catBoredom > 0.8 && x.s === 'zoomies') weight *= 5;
      
      // Hunger begging behaviors
      if (catHunger > 0.8 && (x.s === 'stare' || x.s === 'headtilt' || x.s === 'chase')) weight *= 3;
      
      // Calm behavior: prefer resting and grooming over high-energy states
      if (x.s === 'sit' || x.s === 'groom' || x.s === 'nap') weight *= 2.0;
      if (x.s === 'zoomies' || x.s === 'attack') weight *= 0.5;

      total += weight;
      weights[i] = weight;
    }

    let r = Math.random() * total;
    for (let i = 0; i < STATES.length; i++) {
      r -= weights[i];
      if (r <= 0) return STATES[i].s;
    }
    return 'sit';
  }
  function randFrom(arr) { return arr[~~(Math.random() * arr.length)]; }

  // 
  //  CLAMP
  // 
  function clampWalls() {
    const vw = _vw;
    let hitWall = false;
    const wallMargin = getSideWallMargin();
    
    if (feetX < wallMargin) {
      feetX = wallMargin;
      const wasRunning = Math.abs(velX) > SPEED_RUN * 0.65;
      velX = Math.abs(velX) * 0.3;
      setDir(false);
      recoverFromSideWall('left', wasRunning);
      if (wasRunning) hitWall = true;
    }
    if (feetX > vw - wallMargin) {
      feetX = vw - wallMargin;
      const wasRunning = Math.abs(velX) > SPEED_RUN * 0.65;
      velX = -Math.abs(velX) * 0.3;
      setDir(true);
      recoverFromSideWall('right', wasRunning);
      if (wasRunning) hitWall = true;
    }
    if (hitWall) maybeSpeakConfused();
    return hitWall;
  }

  function recoverFromSideWall(side, force) {
    const margin = getSideWallMargin();
    feetX = side === 'left' ? margin : _vw - margin;

    const runningIntoLeft = side === 'left' && velX < 0;
    const runningIntoRight = side === 'right' && velX > 0;
    if (!force && !runningIntoLeft && !runningIntoRight) return;

    const dir = side === 'left' ? 1 : -1;
    const wallRunStates = new Set([
      'wander', 'zoomies', 'spook', 'patrol', 'explore', 'chase', 'attack',
      'hide', 'knockoff', 'logo_hunt', 'chip_pounce', 'search_paw',
      'ball_chase', 'ball_play', 'coinchase'
    ]);

    velX = dir * Math.min(SPEED_WALK, Math.max(40, Math.abs(velX) * 0.35));
    targetX = Math.max(margin, Math.min(_vw - margin, feetX + dir * (90 + Math.random() * 140)));
    setDir(dir < 0);

    if (wallRunStates.has(state)) {
      if (Math.abs(velX) > SPEED_WALK * 0.75) setAnim('walk', true);
      state = 'wander';
      stateTimer = 900 + Math.random() * 900;
    }
  }

  // 
  //  GO  enter a new state
  // 
  function go(s, excl) {
    // Loyal mode override: if loyal and not in critical states, force follow
    if (isLoyalMode && !s && state !== 'chasefish' && state !== 'eatfish' && state !== 'dragged' && state !== 'deepsleep') {
      s = 'loyal_follow';
    }
    attackEl    = null;
    attackPhase = 'move';
    if (s !== 'ui_mischief' && s !== 'wall_left' && s !== 'wall_right') {
      uiTarget = null;
      uiWallTask = null;
    }
    state       = s || pick(excl);
    stateTimer  = 0;
    idleAccum   = 0;
    animLockTimer = 0;  // clear any animation lock
    stuckCheckTimer = 0;  // reset stuck detection
    lastFishChaseX = feetX;  // reset position tracking
    chaseStuckTimer = 0;  // reset pathfinding stuck tracker
    lastChaseDistToTarget = 9999;

    catEl.style.zIndex  = '9999999';
    catEl.style.opacity = '1';

    // Reset rotation if leaving ninja states
    if (state !== 'wall_left' && state !== 'wall_right' && state !== 'ninja_climb' && state !== 'wall_left_sit' && state !== 'wall_right_sit') {
       if (globalRot !== 0) { globalRot = 0; applyTransform(); }
    }

    switch (state) {

      /*  WANDER  */
      case 'wander': {
        const fast = Math.random() < 0.2;
        velX = (fast ? SPEED_RUN : SPEED_WALK) * (Math.random() < 0.5 ? -1 : 1);
        setDir(velX < 0);
        setAnim(fast ? 'run' : 'walk');
        stateTimer = 2000 + Math.random() * 3000;
        break;
      }

      /*  SIT  */
      case 'sit': {
        velX = 0;
        setAnim(pickIdleVariant());  // pick once, stored in chosenIdle
        stateTimer = 2000 + Math.random() * 4000;
        break;
      }

      /*  GROOM  */
      case 'groom': {
        velX = 0;
        setAnim(pickCleanVariant());
        stateTimer = 3000 + Math.random() * 3000;
        break;
      }

      /*  NAP  */
      case 'nap': {
        velX = 0;
        setAnim('sleep');
        stateTimer = 5000 + Math.random() * 5000;
        break;
      }

      /*  STRETCH  */
      case 'stretch': {
        velX = 0;
        setAnim('clean2');
        stateTimer = 1800 + Math.random() * 1200;
        break;
      }

      /*  PAW PLAY  */
      case 'pawplay': {
        velX = 0;
        setAnimLocked('paw', 1200);
        stateTimer = 1800 + Math.random() * 1500;
        break;
      }

      /*  WATCH VIDEO  */
      case 'watchvideo': {
        const player = document.querySelector('.html5-video-player');
        if (!player) { go('sit'); return; }
        attackEl = player;
        velX = 0;
        setAnim(pickIdleVariant());   // start with idle, updateState will walk toward it
        stateTimer = 8000;
        break;
      }

      /*  KNOCKOFF  */
      case 'knockoff': {
        const tgt = pickAttackRect();
        if (!tgt) { go('sit'); return; }
        attackEl = tgt.el;
        attackPhase = 'approach';
        const kr = tgt;
        // target nearest edge of the card
        const distL = Math.abs(kr.left - feetX);
        const distR = Math.abs(kr.right - feetX);
        targetX = distL < distR ? kr.left : kr.right;
        
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 5000;
        break;
      }

      /*  UI MISCHIEF  */
      case 'ui_mischief': {
        if (!isAggressiveMode || !uiMischiefEnabled) { go('sit'); return; }
        uiTarget = getUiActionTarget();
        if (!uiTarget || !uiTarget.el || !uiTarget.el.isConnected) {
          go('sit');
          return;
        }
        attackEl = uiTarget.el;
        attackPhase = 'approach';
        stateTimer = 7000;

        if (uiTarget.type === 'progress') {
          uiWallTask = {
            targetY: Math.max(70, uiTarget.y + 20),
            scrollDir: Math.random() < 0.5 ? -1 : 1
          };
        if (uiTarget.x < _vw / 2) {
          feetX = getWallAttachX('left');
          go('wall_left');
        } else {
          feetX = getWallAttachX('right');
          go('wall_right');
        }
          return;
        }

        targetX = uiTarget.x;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0);
        setAnim('run');
        break;
      }
      


      /*  CHASE  */
      case 'chase': {
        // Set initial chase animation based on distance
        const cdx = cursorX - feetX;
        const dist = Math.abs(cdx);
        if (dist > 170) {
          velX = (cdx > 0 ? 1 : -1) * SPEED_RUN;
          setDir(velX < 0); setAnim('run');
        } else if (dist > 40) {
          velX = (cdx > 0 ? 1 : -1) * SPEED_WALK;
          setDir(velX < 0); setAnim('walk');
        } else {
          velX = 0; setAnim(pickIdleVariant());
        }
        attackPhase = 'pursue';  // start in normal pursuit
        chaseStuckTimer = 0;
        stateTimer = 6000 + Math.random() * 4000;
        break;
      }

      /*  ATTACK  */
      case 'attack': {
        const tgt = pickAttackRect();
        if (!tgt) { go('sit'); return; }
        attackEl    = tgt.el;
        attackPhase = Math.random() < 0.15 ? 'stalk' : 'move';
        const r     = tgt;
        targetX     = r.left + (r.width || r.w) * 0.4;
        if (attackPhase === 'stalk') {
          velX = SPEED_WALK * 0.4 * (targetX > feetX ? 1 : -1);
          setDir(velX < 0); setAnim('walk');
        } else {
          velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
          setDir(velX < 0); setAnim('run');
        }
        stateTimer = 5000;
        break;
      }

      /*  HIDE  */
      case 'hide': {
        const cards = envRects.filter(r => r.isPlatform && r.el.isConnected && r.w > 120 && r.h > 80);
        if (!cards.length) { go('sit'); return; }
        const ch = randFrom(cards);
        attackEl = ch.el;
        targetX  = ch.left + ch.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 4000;
        break;
      }

      /*  ZOOMIES  */
      case 'zoomies': {
        velX = SPEED_RUN * 1.15 * (Math.random() < 0.5 ? -1 : 1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 1200 + Math.random() * 1000;
        break;
      }

      /*  JUMP  */
      case 'jump': {
        if (onGround) {
          velY = JUMP_V * 0.8;
          velX = (Math.random() < 0.5 ? -1 : 1) * (SPEED_WALK + Math.random() * 40);
          setDir(velX < 0);
          setAnim('jump', true);
          isJumping = true; onGround = false;
        }
        stateTimer = 3000;
        break;
      }

      /*  STARE  */
      case 'stare': {
        velX = 0;
        setAnim(pickIdleVariant());
        stateTimer = 2500 + Math.random() * 3000;
        break;
      }

      /*  SPOOK  */
      case 'spook': {
        const away = cursorX > feetX ? -1 : 1;
        velX = SPEED_RUN * away;
        setDir(velX < 0);
        // Start with scared for a brief moment, then run
        setAnimLocked('scared', 300);
        addTimeout(() => { if (state === 'spook') setAnim('run'); }, 300);
        stateTimer = 1000 + Math.random() * 600;
        break;
      }

      /*  CLIMB  */
      case 'climbtop': {
        const plats = envRects.filter(r =>
          r.isPlatform && r.el.isConnected && r.w > 80 && r.top < feetY - 30);
        if (!plats.length) { go('sit'); return; }
        const p = randFrom(plats);
        targetX = p.left + p.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 4000;
        break;
      }

      /*  PATROL  */
      case 'patrol': {
        velX = SPEED_WALK * 0.6 * (Math.random() < 0.5 ? -1 : 1);
        setDir(velX < 0); setAnim('walk');
        stateTimer = 3000 + Math.random() * 2000;
        break;
      }

      /*  POUNCE  */
      case 'pounce': {
        const tgt2 = pickAttackRect();
        if (!tgt2) { go('sit'); return; }
        attackEl = tgt2.el;
        const r2 = tgt2;
        targetX  = r2.left + (r2.width || r2.w) * 0.4;
        if (onGround) {
          velY = JUMP_V * 0.5;
          velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
          setDir(velX < 0);
          setAnim('jump', true);
          isJumping = true; onGround = false;
        }
        stateTimer = 2500;
        break;
      }

      /*  EDGE SIT  find platform edge and dangle legs */
      case 'edgesit': {
        const plats = envRects.filter(r =>
          r.isPlatform && r.el.isConnected && r.w > 60 &&
          Math.abs(feetY - r.top) < 30);
        if (!plats.length) { go('sit'); return; }
        const p = randFrom(plats);
        // Pick left or right edge of the platform
        targetX = Math.random() < 0.5 ? p.left + 20 : p.right - 20;
        velX = SPEED_WALK * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('walk');
        stateTimer = 5000;
        break;
      }

      /*  HEAD TILT  look at cursor curiously */
      case 'headtilt': {
        velX = 0;
        setDir(cursorX < feetX);
        setAnim(pickIdleVariant());
        stateTimer = 2000 + Math.random() * 2000;
        break;
      }

      /*  EXPLORE  */
      case 'explore': {
        const targets = envRects.filter(r =>
          (r.isPlatform || r.isAttack) && r.el.isConnected && Math.abs(r.top - feetY) < 80);
        if (!targets.length) { go('wander'); return; }
        const t = randFrom(targets);
        attackEl = t.el;
        targetX = t.left + t.w / 2;
        velX = SPEED_WALK * 0.8 * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('walk');
        stateTimer = 4000;
        break;
      }

      /*  LOYAL FOLLOW  */
      case 'loyal_follow': {
        velX = 0;
        setAnim(pickIdleVariant());
        stateTimer = 999999;  // indefinite until toggled off
        break;
      }

      /*  DEEP SLEEP (AFK)  */
      case 'deepsleep': {
        // Walk to the bottom-right corner and sleep
        targetX = _vw - 60;
        velX = SPEED_WALK * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('walk');
        stateTimer = 999999;  // indefinite until user wakes
        break;
      }

      /*  PEEK A BOO  */
      case 'peek_a_boo': {
        const isLeft = Math.random() < 0.5;
        // Target is AT the wall edge (not beyond it)
        targetX = getWallAttachX(isLeft ? 'left' : 'right');
        velX = SPEED_RUN * 1.2 * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 8000;
        break;
      }

      /*  WALL SIT  */
      case 'wall_sit': {
        const wsIsLeft = Math.random() < 0.5;
        targetX = getWallAttachX(wsIsLeft ? 'left' : 'right');
        velX = SPEED_RUN * 1.5 * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 10000;
        break;
      }

      case 'ninja_climb': {
        velX = (Math.random() < 0.5) ? -SPEED_RUN * 1.5 : SPEED_RUN * 1.5;
        setDir(velX < 0);
        setAnim('run', true);
        stateTimer = 5000;
        break;
      }
      
      case 'wall_left': {
        globalRot = 90;
        setDir(true);
        applyTransform();
        setAnim('run', true);
        velY = -SPEED_RUN * 0.75;  // start a bit slower  more natural
        velX = 0;
        attackPhase = 'climb';
        
        //  SAFE TARGET HEIGHT  never gets too close to the top
        // Low (40%): bottom half of screen, Medium (40%): middle zone, High (20%): upper quarter
        const heightChoice = Math.random();
        if (heightChoice < 0.40) {
          // Low: 45-70% down from top = cat stops in lower/mid area
          targetX = _vh * (0.45 + Math.random() * 0.25);
        } else if (heightChoice < 0.80) {
          // Medium: 25-45% down from top
          targetX = _vh * (0.25 + Math.random() * 0.20);
        } else {
          // High (rare 20%): 15-25% down from top  never near the very top
          targetX = _vh * (0.15 + Math.random() * 0.10);
        }
        // Hard clamp: minimum 15% screen height from top
        targetX = Math.max(_vh * 0.15, targetX);
        
        stateTimer = 8000 + Math.random() * 4000;
        break;
      }
      
      case 'wall_right': {
        globalRot = -90;
        setDir(false);
        applyTransform();
        setAnim('run', true);
        velY = -SPEED_RUN * 0.75;  // start a bit slower  more natural
        velX = 0;
        attackPhase = 'climb';
        
        //  SAFE TARGET HEIGHT  same distribution as wall_left
        const heightChoice = Math.random();
        if (heightChoice < 0.40) {
          targetX = _vh * (0.45 + Math.random() * 0.25);
        } else if (heightChoice < 0.80) {
          targetX = _vh * (0.25 + Math.random() * 0.20);
        } else {
          targetX = _vh * (0.15 + Math.random() * 0.10);
        }
        // Hard clamp: minimum 15% screen height from top
        targetX = Math.max(_vh * 0.15, targetX);
        
        stateTimer = 8000 + Math.random() * 4000;
        break;
      }

      case 'wall_left_sit': {
        globalRot = 90;
        setDir(true);
        applyTransform();
        setAnim('run', true);
        velY = -SPEED_RUN * 0.8;
        velX = 0;
        // Borrow targetX to store target Y height to climb to
        // FIX: clamp min to 15% of screen height
        targetX = Math.max(_vh * 0.15, _vh - 100 - Math.random() * (_vh * 0.5));
        stateTimer = 10000;
        break;
      }
      
      case 'wall_right_sit': {
        globalRot = -90;
        setDir(false);
        applyTransform();
        setAnim('run', true);
        velY = -SPEED_RUN * 0.8;
        velX = 0;
        // FIX: clamp min to 15% of screen height
        targetX = Math.max(_vh * 0.15, _vh - 100 - Math.random() * (_vh * 0.5));
        stateTimer = 10000;
        break;
      }

      /*  LOGO HUNT  */
      case 'logo_hunt': {
        const logo = envRects.find(r => r.isLogo);
        if (!logo) { go('sit'); return; }
        attackEl = logo.el;
        targetX = logo.left + logo.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 6000;
        break;
      }

      /*  CHIP POUNCE  */
      case 'chip_pounce': {
        const chips = envRects.filter(r => r.isChip);
        if (!chips.length) { go('wander'); return; }
        const chip = randFrom(chips);
        attackEl = chip.el;
        targetX = chip.left + chip.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 5000;
        break;
      }

      /*  SEARCH PAW  */
      case 'search_paw': {
        const search = envRects.find(r => r.isSearch);
        if (!search) { go('sit'); return; }
        attackEl = search.el;
        targetX = search.left + search.w / 2;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 5000;
        break;
      }

      /*  BALL PLAY  */
      case 'ball_play': {
        // Find closest ball if we don't have a target
        if ((!targetBall || targetBall.exiting) && activeBalls.length > 0) {
          targetBall = activeBalls.find((ball) => !ball.exiting && !ball.removing) || null;
          if (!targetBall) { go('sit'); return; }
          let closestDist = Math.abs(targetBall.x - feetX);
          for (let i = 1; i < activeBalls.length; i++) {
            if (activeBalls[i].exiting || activeBalls[i].removing) continue;
            const d = Math.abs(activeBalls[i].x - feetX);
            if (d < closestDist) { closestDist = d; targetBall = activeBalls[i]; }
          }
        }
        if (!targetBall || targetBall.exiting || targetBall.removing) { targetBall = null; go('sit'); return; }
        targetX = targetBall.x;
        velX = SPEED_RUN * (targetX > feetX ? 1 : -1);
        setDir(velX < 0); setAnim('run');
        stateTimer = 6000;
        break;
      }

      case 'chasefish': {
        setAnim('run');
        stateTimer = 30000;  // 30 seconds max - refreshes while making progress
        stuckCheckTimer = 0;
        lastFishChaseX = feetX;
        break;
      }
      
      case 'webbed_stun': {
         velX *= 0.1;
         setAnimLocked('scared', 3000);
         stateTimer = 3000;
         break;
      }
      case 'chasing_bug': {
         setAnim('run');
         stateTimer = 15000;
         break;
      }
      
      case 'eatfish': {
        velX = 0;
        setAnimLocked('clean1', 3000); // Grooming animation acts as eating
        stateTimer = 3000;
        break;
      }


    }
  }

  // 
  //  UPDATE STATE
  // 
  let knockoffCheckAccum = 0;
  
  // Hoisted outside updateState  avoids per-frame array allocation
  const _criticalStates = new Set(['eatfish', 'chasefish', 'ball_play', 'dragged', 'stunned', 'wall_left', 'wall_right', 'ninja_climb', 'deepsleep']);
  const _sittingStates  = new Set(['sit', 'stare', 'groom', 'stretch', 'pawplay', 'headtilt']);
  const _restingStates  = new Set(['sit', 'stare', 'headtilt', 'edgesit', 'groom']);
  const _sleepingStates = new Set(['nap', 'sleep', 'deepsleep']);
  
  function tickNeeds(dt) {
    // Determine state activity level
    const isResting = _restingStates.has(state);
    const isSleeping = _sleepingStates.has(state);
    
    // Update Energy and Boredom
    if (isResting) {
      catBoredom = Math.min(1.0, catBoredom + dt * 0.02);
      catEnergy  = Math.min(1.0, catEnergy + dt * 0.015);
    } else if (isSleeping) {
      catBoredom = Math.max(0.0, catBoredom - dt * 0.01);
      catEnergy  = Math.min(1.0, catEnergy + dt * 0.05);
    } else {
      catBoredom = Math.max(0.0, catBoredom - dt * 0.04);
      catEnergy  = Math.max(0.0, catEnergy - dt * 0.02);
    }
    
    // Update Hunger
    if (state === 'eatfish') {
      catHunger = 0.0;
      catEnergy = Math.min(1.0, catEnergy + 0.4);
      catBoredom = 0.0;
    } else {
      catHunger = Math.min(1.0, catHunger + dt * 0.005);
    }
  }

  function updateState(dt) {
    if (isDragging) return;
    stateTimer -= dt * 1000;
    tickNeeds(dt);
    
    //  PETTING DETECTION 
    tickPetting(dt);
    if (isPurring) return; // Don't change state while being petted
    
    //  AFK / LIGHTS OUT CHECK 
    if (!isDeepSleep && (Date.now() - lastUserActivity > AFK_THRESHOLD)) {
      if (state !== 'deepsleep' && state !== 'dragged') {
        isDeepSleep = true;
        go('deepsleep');
        return;
      }
    }
    
    //  TRIGGER FISH TREAT IF STARVING 
     if (autoFishSpawnEnabled && catHunger >= 1.0 && fishSpawnTimer > 0 && Math.random() < 0.01) {
       fishSpawnTimer = 0; // Force spawn a fish
    }
    
    //  TARGET FISH INTERRUPTION 
    // Cats don't always chase fish - depends on mood, energy, and hunger
    if (activeFishes.length > 0 && !_criticalStates.has(state)) {
      // Find the closest fish
      let closestFish = activeFishes[0];
      let closestDist = Math.abs(closestFish.x - feetX);
      for (let i = 1; i < activeFishes.length; i++) {
        const d = Math.abs(activeFishes[i].x - feetX);
        if (d < closestDist) { closestDist = d; closestFish = activeFishes[i]; }
      }
      
      // Realistic interest calculation
      let interestLevel = 0.3; // Base 30% interest
      
      // Hunger increases interest dramatically
      if (catHunger > 0.7) interestLevel += 0.5;
      else if (catHunger > 0.4) interestLevel += 0.2;
      
      // Energy affects interest
      if (catEnergy < 0.3) interestLevel -= 0.3; // Too tired to care
      else if (catEnergy > 0.7) interestLevel += 0.2; // Energetic and playful
      
      // Boredom increases interest in new activities
      if (catBoredom > 0.6) interestLevel += 0.3;
      
      // Distance matters - far fish are less interesting
      if (closestDist > 400) interestLevel -= 0.2;
      else if (closestDist < 200) interestLevel += 0.2;
      
      // Energy level personality
      if (catEnergyLevel === 'hyper') interestLevel += 0.2;
      else if (catEnergyLevel === 'sleepy') interestLevel -= 0.3;
      
      // Random mood variation
      const moodRoll = Math.random();
      
      let shouldChase = moodRoll < interestLevel;
      
      const otherCat = PixelCatRuntime.instances.find(c => c !== api);
      if (otherCat && otherCat.state === 'chasefish' && otherCat.targetFish === closestFish) {
          // If the other cat is already chasing it, less interested
          if (Math.random() < 0.7) {
              shouldChase = false;
              // occasionally face it and watch
              if (Math.random() < 0.3) {
                  facingLeft = closestFish.x < feetX;
                  applyTransform();
              }
          }
      }

      // Only interrupt if interested and conditions are right
      if (shouldChase && (closestFish !== targetFish || state !== 'chasefish')) {
        targetFish = closestFish;
        go('chasefish');
        return;
      }
    }

    // - COIN DROP INTERRUPTION - // Cat runs toward a falling coin (lower priority than fish)
    if (coinChaseTarget && !coinChaseTarget.caught && state !== 'chasefish' && !isDragging) {
      if (state !== 'coinchase') {
        go('coinchase');
        return;
      }
    } else if (state === 'coinchase' && (!coinChaseTarget || coinChaseTarget.caught)) {
      go('sit');
      return;
    }

    //  TARGET SPIDER INTERRUPTION 
    if (spiderEnabled && activeSpiders.length > 0 && !_criticalStates.has(state) && state !== 'chasefish' && state !== 'chasing_bug') {
      let closestSp = null;
      let closestDist = 999999;
      for (let i = 0; i < activeSpiders.length; i++) {
        const sp = activeSpiders[i];
        const dy = sp.y - feetY;
        // Only target if the spider is low enough (not on ceiling or super high web)
        if (dy > -120) {
           const d = Math.abs(sp.x - feetX);
           if (d < closestDist) { closestDist = d; closestSp = sp; }
        }
      }
      
      if (closestSp && closestDist < 500 && Math.random() < 0.3) {
        targetSpider = closestSp;
        go('chasing_bug');
        return;
      }
    }
    
    //  TARGET BALL INTERRUPTION 
    // Cats play with balls based on mood and personality - not always
    if (ballEnabled && activeBalls.length > 0 && !_criticalStates.has(state) && state !== 'chasefish') {
      // Find the closest ball
      let closestBall = activeBalls.find((ball) => !ball.exiting && !ball.removing);
      if (!closestBall) return;
      let closestDist = Math.abs(closestBall.x - feetX);
      for (let i = 1; i < activeBalls.length; i++) {
        if (activeBalls[i].exiting || activeBalls[i].removing) continue;
        const d = Math.abs(activeBalls[i].x - feetX);
        if (d < closestDist) { closestDist = d; closestBall = activeBalls[i]; }
      }
      
      // Only notice balls within reasonable distance
      if (closestDist < 600) {
        // Realistic playfulness calculation
        let playfulness = 0.25; // Base 25% interest in playing
        
        // Boredom makes cats more playful
        if (catBoredom > 0.7) playfulness += 0.4;
        else if (catBoredom > 0.4) playfulness += 0.2;
        
        // Energy affects playfulness
        if (catEnergy < 0.3) playfulness -= 0.3; // Too tired
        else if (catEnergy > 0.7) playfulness += 0.3; // Full of energy
        
        // Hunger reduces interest in play
        if (catHunger > 0.6) playfulness -= 0.3;
        
        // Distance matters
        if (closestDist > 400) playfulness -= 0.2;
        else if (closestDist < 250) playfulness += 0.2;
        
        // Energy level personality
        if (catEnergyLevel === 'hyper') playfulness += 0.3;
        else if (catEnergyLevel === 'sleepy') playfulness -= 0.4;
        

        const moodRoll = Math.random();
        let shouldPlay = moodRoll < playfulness;
        
        const otherCat = PixelCatRuntime.instances.find(c => c !== api);
        if (otherCat && otherCat.state === 'ball_play' && otherCat.targetBall === closestBall) {
          // If the other cat is playing, might join or ignore
          if (Math.random() < 0.5) {
            shouldPlay = false; // Let them play alone
          } else if (Math.random() < 0.7) {
            shouldPlay = true; // Join the fun!
          }
        }

        // Only interrupt to play if in the mood
        if (shouldPlay && (closestBall !== targetBall || state !== 'ball_play')) {
          targetBall = closestBall;
          go('ball_play');
          return;
        }
      }
    }

    const _cdx = cursorX - feetX;
    const _cdy = cursorY - feetY;
    const cdist = Math.sqrt(_cdx * _cdx + _cdy * _cdy);

    // idle accumulator  auto-transitions from sitting
    if (_sittingStates.has(state) && velX === 0) {
      idleAccum += dt * 1000;
    } else {
      idleAccum = 0;
    }

    // Auto-sleep after long idle
    if (idleAccum > 10000 && state === 'sit' && Math.random() < 0.002) {
      go('nap'); return;
    }
    // Auto-groom after moderate idle
    if (idleAccum > 5000 && state === 'sit' && Math.random() < 0.003) {
      go('groom'); return;
    }
    // Occasional paw swipe while sitting (playful)  use animLock
    if (state === 'sit' && animLockTimer <= 0 && Math.random() < 0.0005) {
      setAnimLocked('paw', 1200);
      addTimeout(() => { if (state === 'sit') setAnim(chosenIdle); }, 1200);
    }

    switch (state) {

      /*  WANDER  */
      case 'wander': {
        if (clampWalls()) {
          setAnimLocked('scared', 500);
          state = 'stunned'; stateTimer = 500 + Math.random() * 300;
          velX *= 0.1;
          return;
        }
        if (onGround && !isJumping && Math.abs(velX) > 10) {
          const dir = velX > 0 ? 1 : -1;
          if (isNearPlatformEdge(feetX, dir)) {
            const adj = findAdjacentPlatform(feetX, dir);
            if (adj) {
              // Randomized jump strength
              const jumpPower = 0.6 + Math.random() * 0.5;
              const horizPower = 0.7 + Math.random() * 0.6;
              velY = JUMP_V * jumpPower;
              velX = dir * SPEED_RUN * horizPower;
              setAnim('jump', true);
              isJumping = true; onGround = false;
            } else {
              // No adjacent platform - turn around
              velX = -velX;
              setDir(velX < 0);
            }
          }
        }
        if (cdist < 160 && Math.random() < 0.003)
          { go(Math.random() < 0.5 ? 'chase' : 'spook'); return; }
        if (envRects.length && Math.random() < 0.0006) { go('climbtop'); return; }
        if (stateTimer <= 0) go(null, ['wander']);
        break;
      }

      /*  ZOOMIES  */
      case 'zoomies': {
        if (clampWalls()) {
          setAnimLocked('scared', 500);
          state = 'stunned'; stateTimer = 500 + Math.random() * 300;
          velX *= 0.1;
          return;
        }
        if (stateTimer <= 0) go(null, ['zoomies']);
        break;
      }

      /*  SIT / STARE / HEADTILT  */
      case 'sit': case 'stare': case 'headtilt': {
        velX = 0;
        if (cdist < 200) setDir(cursorX < feetX);
        if (stateTimer <= 0) go(null, [state]);
        break;
      }

      /*  GROOM / STRETCH / PAWPLAY  */
      case 'groom': case 'stretch': case 'pawplay': {
        velX = 0;
        if (stateTimer <= 0) go(null, [state]);
        break;
      }

      /*  NAP  */
      case 'nap': {
        velX = 0;
        if (cdist < 100 && Math.random() < 0.01) {
          state = 'stunned'; stateTimer = 600;
          setAnimLocked('scared', 600);
          addTimeout(() => go('stretch'), 600);
          return;
        }
        if (stateTimer <= 0) go('stretch');
        break;
      }

      /*  WATCH VIDEO  */
      case 'watchvideo': {
        if (!attackEl || !attackEl.isConnected) { go('sit'); return; }
        const pr = getCachedRect(attackEl);
        const txp = pr.left + (pr.width || pr.w) / 2;
        const dx  = txp - feetX;
        if (Math.abs(dx) < 60) {
          velX = 0; setDir(txp < feetX); setAnim(chosenIdle);
        } else {
          velX = SPEED_WALK * (dx > 0 ? 1 : -1);
          setDir(velX < 0); setAnim('walk');
        }
        if (stateTimer <= 0) go(null, ['watchvideo']);
        break;
      }

      /*  SPOOK  */
      case 'spook': {
        if (clampWalls()) {
          setAnimLocked('scared', 400);
          state = 'stunned'; stateTimer = 400;
          velX *= 0.1;
          return;
        }
        if (stateTimer <= 0) { velX = 0; go('sit'); }
        break;
      }

      /*  STUNNED  */
      case 'stunned': {
        velX *= 0.9;
        if (Math.abs(velX) < 1) velX = 0;
        if (stateTimer <= 0) { velX = 0; go('sit'); }
        break;
      }

      /*  CHASE (multi-phase sub-state machine)  */
      case 'chase': {
        if (stateTimer <= 0) { go(null, ['chase']); return; }
        const cdx  = cursorX - feetX;
        const cdy  = cursorY - feetY;  // negative = cursor above
        const dist = Math.abs(cdx);
        const vdist = Math.abs(cdy);
        
        // Arrived at cursor  paw at it
        if (dist < 50 && vdist < 70) {
          velX = 0;
          setAnimLocked('paw', 1200);
          state = 'pawplay'; stateTimer = 1500;
          break;
        }
        
        // ========== PHASE: PURSUE ==========
        // Normal horizontal chase. Detect when stuck (cursor is unreachable vertically).
        if (attackPhase === 'pursue') {
          
          //  SPIN FIX: If cursor is almost directly above, don't run horizontally at all.
          // Skip straight to stuck detection.
          const cursorDirectlyAbove = dist < 45 && cdy < -60;
          
          if (!cursorDirectlyAbove && onGround && !isJumping) {
            // Direction hysteresis: only change dir if cursor moved 40px+ from cat
            // This prevents rapid oscillation (spinning)
            let chaseDir = facingLeft ? -1 : 1;
            if (dist > 40) {
              chaseDir = cdx > 0 ? 1 : -1;
            }
            
            // Platform edge handling
            if (isNearPlatformEdge(feetX, chaseDir)) {
              const adj = findAdjacentPlatform(feetX, chaseDir);
              if (adj) {
                velY = JUMP_V * (0.5 + Math.random() * 0.3);
                velX = chaseDir * SPEED_RUN * (0.9 + Math.random() * 0.4);
                setAnim('jump', true);
                isJumping = true; onGround = false;
                break;
              } else if (cdy > 30) {
                velX = chaseDir * SPEED_RUN;
                velY = 50;
                onGround = false; isJumping = true;
                setAnim('jump', true);
                break;
              } else {
                // At edge, can't jump - stop or turn around
                velX = 0;
                setDir(cdx < 0);
              }
            } else {
              const spd = dist > 170 ? SPEED_RUN : SPEED_WALK;
              velX = chaseDir * spd;
              setDir(velX < 0);
              setAnim(dist > 170 ? 'run' : 'walk');
            }
          } else if (cursorDirectlyAbove && onGround) {
            // Cursor is directly above  stop and look up
            velX = 0;
            setDir(cursorX < feetX);
            if (animLockTimer <= 0) setAnim(chosenIdle);
          }
          
          // Stuck detection: cursor is significantly above for a while
          if (cdy < -80 && onGround) {
            chaseStuckTimer += dt;
          } else {
            chaseStuckTimer = Math.max(0, chaseStuckTimer - dt * 0.5);
          }
          
          // Faster transition when cursor is directly above (0.8s vs 1.5s)
          const thinkThreshold = cursorDirectlyAbove ? 0.8 : (1.5 + Math.random() * 1.0);
          if (chaseStuckTimer > thinkThreshold) {
            attackPhase = 'thinking';
            chaseStuckTimer = 0;
            velX = 0;
            setDir(cursorX < feetX);
            setAnim(pickIdleVariant());
          }
          break;
        }
        
        // ========== PHASE: THINKING ==========
        // Cat pauses, looks up at cursor, deciding what to do.
        if (attackPhase === 'thinking') {
          velX = 0;
          setDir(cursorX < feetX);
          chaseStuckTimer += dt;
          
          // Cute head-tilt while thinking
          if (chaseStuckTimer > 0.4 && animLockTimer <= 0) {
            if (Math.random() < 0.02) setAnimLocked('paw', 600);
          }
          
          // After 0.8-1.5s of thinking, pick a strategy
          if (chaseStuckTimer > 0.8 + Math.random() * 0.7) {
            const roll = Math.random();
            
            if (roll < 0.45) {
              // STRATEGY A: Run to nearest wall and climb
              attackPhase = 'wall_approach';
              const nearestWall = feetX < _vw / 2 ? 'left' : 'right';
              targetX = nearestWall === 'left' ? 15 : _vw - 15;
              velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
              setDir(velX < 0); setAnim('run');
            } else if (roll < 0.80) {
              // STRATEGY B: Try to hop onto a nearby higher platform
              let bestPlat = null, bestScore = Infinity;
              for (let i = 0; i < envRects.length; i++) {
                const r = envRects[i];
                if (!r.isPlatform || !r.el.isConnected) continue;
                if (r.top >= feetY - 15) continue;  // must be above cat
                const px = r.left + r.w / 2;
                const d = Math.abs(px - feetX);
                if (d > 250) continue;  // too far to jump
                // Score: prefer close platforms that are toward cursor
                const towardCursor = Math.abs(px - cursorX) < Math.abs(feetX - cursorX) ? -50 : 0;
                const score = d + towardCursor;
                if (score < bestScore) { bestScore = score; bestPlat = r; }
              }
              if (bestPlat) {
                attackPhase = 'hop_up';
                targetX = bestPlat.left + bestPlat.w / 2;
                velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
                setDir(velX < 0); setAnim('run');
              } else {
                // No platform found  fall back to wall approach
                attackPhase = 'wall_approach';
                const nearestWall = feetX < _vw / 2 ? 'left' : 'right';
                targetX = nearestWall === 'left' ? 15 : _vw - 15;
                velX = (targetX > feetX ? 1 : -1) * SPEED_RUN;
                setDir(velX < 0); setAnim('run');
              }
            } else {
              // STRATEGY C: Cat gives up temporarily, sits and grooms
              attackPhase = 'pursue';
              go(Math.random() < 0.5 ? 'sit' : 'groom');
              return;
            }
            chaseStuckTimer = 0;
          }
          break;
        }
        
        // ========== PHASE: WALL_APPROACH ==========
        // Cat is running toward a wall to climb it.
        if (attackPhase === 'wall_approach') {
          // Don't clampWalls here  we're intentionally heading TO the wall
          const wallDx = targetX - feetX;
          if (Math.abs(wallDx) < 25) {
            // Reached the wall  start climbing
            if (targetX < _vw / 2) {
              feetX = getWallAttachX('left');
              go('wall_left');
            } else {
              feetX = getWallAttachX('right');
              go('wall_right');
            }
          } else {
            // Keep running toward wall, prevent overshoot
            velX = (wallDx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0); setAnim('run');
            // Safety: if somehow past the wall, snap
            const wallTouch = getSideWallMargin();
            if (feetX <= wallTouch || feetX >= _vw - wallTouch) {
              if (feetX <= wallTouch) { feetX = getWallAttachX('left'); go('wall_left'); }
              else { feetX = getWallAttachX('right'); go('wall_right'); }
            }
          }
          break;
        }
        
        // ========== PHASE: HOP_UP ==========
        // Cat is running toward a platform to jump onto it.
        if (attackPhase === 'hop_up') {
          clampWalls();
          const hopDx = targetX - feetX;
          if (Math.abs(hopDx) < 60 && onGround && !isJumping) {
            // Close enough  JUMP!
            const jumpPow = 0.7 + Math.random() * 0.4;
            const horizPow = 0.8 + Math.random() * 0.5;
            velY = JUMP_V * jumpPow;
            velX = (hopDx > 0 ? 1 : -1) * SPEED_RUN * horizPow;
            setDir(velX < 0);
            setAnim('jump', true);
            isJumping = true; onGround = false;
            attackPhase = 'traverse';  // after landing, traverse across cards
          } else if (onGround) {
            velX = (hopDx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0); setAnim('run');
          }
          break;
        }
        
        // ========== PHASE: TRAVERSE ==========
        // Cat landed on a higher platform. Walk across cards toward cursor X.
        if (attackPhase === 'traverse') {
          if (onGround && !isJumping) {
            // Walk toward cursor X on this platform level
            if (dist < 50) {
              // Close to cursor X  check if we're also close vertically
              if (vdist < 80) {
                // Reached cursor!
                velX = 0;
                setAnimLocked('paw', 1200);
                state = 'pawplay'; stateTimer = 1500;
                break;
              } else if (cdy < -60) {
                // Still below cursor  need to go higher, re-think
                attackPhase = 'thinking';
                chaseStuckTimer = 0;
                break;
              } else {
                // Above cursor now? Just walk off the edge toward it
                velX = (cdx > 0 ? 1 : -1) * SPEED_WALK;
                setDir(velX < 0); setAnim('walk');
              }
            } else {
              // Platform edge handling during traverse
              const tDir = cdx > 0 ? 1 : -1;
              if (isNearPlatformEdge(feetX, tDir)) {
                const adj = findAdjacentPlatform(feetX, tDir);
                if (adj) {
                  // Hop to next card
                  velY = JUMP_V * (0.4 + Math.random() * 0.3);
                  velX = tDir * SPEED_RUN * (0.8 + Math.random() * 0.4);
                  setAnim('jump', true);
                  isJumping = true; onGround = false;
                  break;
                } else {
                  // No more cards  drop down toward cursor
                  velX = tDir * SPEED_RUN * 0.8;
                  velY = 30;
                  onGround = false; isJumping = true;
                  setAnim('jump', true);
                  break;
                }
              }
              // Walk across the row
              const tSpd = dist > 150 ? SPEED_RUN : SPEED_WALK;
              velX = tDir * tSpd;
              setDir(velX < 0);
              setAnim(dist > 150 ? 'run' : 'walk');
            }
          }
          // If fallen back to ground level, return to pursue
          if (onGround && feetY >= _vh - 20) {
            attackPhase = 'pursue';
          }
          break;
        }
        
        break;
      }

      /*  ATTACK  */
      case 'attack': {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          go(null, ['attack']); return;
        }
        clampWalls();
        if (attackPhase === 'stalk') {
          const lr = getCachedRect(attackEl);
          const dx = (lr.left + (lr.width || lr.w) * 0.4) - feetX;
          if (Math.abs(dx) < 120) {
            attackPhase = 'move';
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN * 1.1;
            setDir(velX < 0); setAnim('run');
          }
        } else if (attackPhase === 'move') {
          const lr = getCachedRect(attackEl);
          const dx = (lr.left + (lr.width || lr.w) * 0.4) - feetX;
          if (Math.abs(dx) < 50 && Math.random() < 0.08) {
            velX = 0;
            setAnimLocked('scared', 700);
            state = 'stunned'; stateTimer = 700; return;
          }
          if (Math.abs(dx) < 50) {
            attackPhase = 'strike'; velX = 0;
            setAnimLocked('paw', 1200);
            attackHitTimer = 1200;
            smashElement(attackEl);
            
            try {
              const title = (attackEl.textContent || '').toLowerCase();
              if (title.includes('cat') || title.includes('kitty') || title.includes('pixel')) {
                addTimeout(() => spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5), 400);
              } else if (title.includes('fish') || title.includes('treat')) {
                catHunger = Math.max(0, catHunger - 0.1);
                addTimeout(() => spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5), 400);
              } else if (title.includes('dog') || title.includes('scary')) {
                addTimeout(() => setAnimLocked('scared', 800), 1200);
              }
            } catch (e) {}
          } else {
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0); setAnim('run');
          }
        } else {
          attackHitTimer -= dt * 1000;
          if (attackHitTimer <= 0) {
            go(Math.random() < 0.3 ? 'attack' : null, ['attack']);
          }
        }
        break;
      }

      /*  KNOCKOFF  */
      case 'knockoff': {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          go(null, ['knockoff']); return;
        }
        clampWalls();
        const tgX = targetX; // target edge
        const dx = tgX - feetX;

        if (attackPhase === 'approach') {
           if (Math.abs(dx) < 80 && onGround && !isJumping) {
              attackPhase = 'jumpstrike';
              velY = JUMP_V * 0.6; // medium jump
              velX = (dx > 0 ? 1 : -1) * SPEED_RUN * 1.5; // leap forward
              setAnim('jump', true);
              isJumping = true; onGround = false;
           } else if (onGround && Math.abs(dx) >= 80) {
              velX = SPEED_RUN * (dx > 0 ? 1 : -1);
              setDir(velX < 0); setAnim('run');
           }
        } 
        else if (attackPhase === 'jumpstrike') {
           if (Math.abs(dx) < 30) {
              attackPhase = 'bouncing';
              velX = -velX * 0.5; // bounce back
              velY = JUMP_V * 0.3; // tiny hop backward
              setDir(velX > 0); // face the card while bouncing backwards
              setAnimLocked('scared', 800); // look surprised from bump
              
              const pushDir = dx > 0 ? 1 : -1;
              attackEl.style.transition = 'transform 0.2s cubic-bezier(.18,.89,.32,1.2)';
              attackEl.style.transform = `translateX(${pushDir * 12}px) rotate(${pushDir * 2}deg)`;
              const el = attackEl;
              addTimeout(() => {
                if (el.isConnected) {
                  el.style.transition = 'transform 0.6s ease';
                  el.style.transform = '';
                }
              }, 500);
           }
        }
        else if (attackPhase === 'bouncing') {
           if (onGround) {
              velX = 0;
              go('sit');
           }
        }
        break;
      }

      /*  UI MISCHIEF  */
      case 'ui_mischief': {
        if (!isAggressiveMode || !uiTarget || !uiTarget.el || !uiTarget.el.isConnected) {
          uiTarget = null;
          uiWallTask = null;
          go('sit');
          return;
        }

        // Use cached rect from env scan  avoids live getBoundingClientRect every frame
        const rr = getCachedRect(uiTarget.el);
        const tx = rr.left + rr.w / 2;
        const dx = tx - feetX;

        if (attackPhase === 'approach') {
          if (Math.abs(dx) < 42) {
            velX = 0;
            setDir(dx < 0);
            setAnimLocked('paw', 850);
            attackPhase = 'tap';
            attackHitTimer = 850;
            if ((uiTarget.type === 'like' || uiTarget.type === 'dislike') && Math.random() < 0.7) {
              triggerUiClick(uiTarget.el);
              earnXP(0.2); // XP: mischief earns XP.
            }
          } else {
            velX = (dx > 0 ? 1 : -1) * SPEED_RUN;
            setDir(velX < 0);
            setAnim('run');
          }
        } else {
          attackHitTimer -= dt * 1000;
          if (attackHitTimer <= 0 || stateTimer <= 0) {
            uiTarget = null;
            uiWallTask = null;
            go('sit');
          }
        }
        break;
      }

      /*  LOGO HUNT / CHIP POUNCE / SEARCH PAW  */
      case 'search_paw':
      case 'ball_play': {
        if (state === 'ball_play') {
          if (!targetBall || targetBall.exiting || targetBall.removing || !activeBalls.includes(targetBall)) { targetBall = null; go('sit'); return; }
          
          // REALISTIC: Cat might lose interest mid-play
          // Check every few seconds if still interested
          if (Math.random() < 0.002) { // ~0.2% per frame = check every few seconds
            let continueInterest = 0.65; // Base 65% to continue (slightly lower than fish)
            
            // Low energy = lose interest faster
            if (catEnergy < 0.3) continueInterest -= 0.4;
            
            // If playing for too long, lose interest
            // stateTimer starts at 6000 and counts DOWN, so < 3000 means > 3s elapsed
            if (stateTimer < 3000) continueInterest -= 0.15;
            
            // If ball is very far, might give up
            const distToBall = Math.sqrt((targetBall.x - feetX) ** 2 + (targetBall.y - feetY) ** 2);
            if (distToBall > 600) continueInterest -= 0.3;
            
            // Sleepy cats give up easier
            if (catEnergyLevel === 'sleepy') continueInterest -= 0.4;
            
            // Hyper cats are more persistent
            if (catEnergyLevel === 'hyper') continueInterest += 0.2;
            

            // Very bored cats are more likely to keep playing
            if (catBoredom > 0.7) continueInterest += 0.2;
            
            if (Math.random() > continueInterest) {
              // Lost interest! Do something else
              targetBall = null;
              const randomAction = Math.random();
              if (randomAction < 0.25) {
                go('sit'); // Just sit down
              } else if (randomAction < 0.5) {
                go('groom'); // Groom instead
              } else if (randomAction < 0.75) {
                go('wander'); // Wander off
              } else {
                go('nap'); // Take a nap
              }
              break;
            }
          }
          
          // Check if there's another cat to play volleyball with
          const otherCat = PixelCatRuntime.instances.find(c => c !== api);
          const isVolleyballMode = otherCat && otherCat.state === 'ball_play' && otherCat.targetBall === targetBall;
          
          const bdx = targetBall.x - feetX;
          const bdy = targetBall.y - feetY;
          const distToBall = Math.sqrt(bdx * bdx + bdy * bdy);
          const ballReachX = 60 + (sizeMultiplier - 1) * 28;
          const ballReachY = 80 + (sizeMultiplier - 1) * 34;
          
          // PROFESSIONAL VOLLEYBALL MODE: cats take sides and coordinate
          if (isVolleyballMode) {
            // Determine court sides based on initial positions when both cats started playing
            // Use a consistent side assignment to prevent switching
            const cat1 = PixelCatRuntime.instances[0];
            const cat2 = PixelCatRuntime.instances[1];
            
            // Assign sides: cat with lower index gets left, higher gets right
            let mySide, myCourtPosition, otherCourtPosition;
            if (api === cat1) {
              mySide = 'left';
              myCourtPosition = _vw * 0.25;  // 25% from left
              otherCourtPosition = _vw * 0.75; // 75% from left
            } else {
              mySide = 'right';
              myCourtPosition = _vw * 0.75;
              otherCourtPosition = _vw * 0.25;
            }
            
            // Define court boundaries  each cat stays strictly on its side
            const courtCenter = _vw / 2;
            const courtWidth = _vw * 0.9; // Use 90% of viewport width
            const leftBoundary = (_vw - courtWidth) / 2;
            const rightBoundary = _vw - leftBoundary;
            // Hard per-side limits  cats must not cross the net
            const myHardMin = mySide === 'left' ? leftBoundary + 30 : courtCenter + 80;
            const myHardMax = mySide === 'left' ? courtCenter - 80 : rightBoundary - 30;
            
            // Determine ball position relative to court
            const ballSide = targetBall.x < courtCenter ? 'left' : 'right';
            const ballInMyCourt = ballSide === mySide;
            
            // MY TURN: Ball is STRICTLY in my court (do NOT trigger if only moving toward me)
            // FIX: Removed the loose ballMovingTowardMe fallback that caused both cats to rush
            if (ballInMyCourt) {
              
              // Chase the ball  but stay within own side
              if (distToBall < ballReachX + 20) {
                velX = 0;
                
                // Wait for optimal hit timing (when ball is close to ground or within reach)
                const ballHeight = _vh - targetBall.y;
                const canHit = ballHeight < 150 || (targetBall.vy > 0 && ballHeight < 250);
                
                if (canHit && animLockTimer <= 0) {
                  // Decide hit type based on ball position and energy
                  const useAcrobatic = Math.random() < 0.35 && catEnergy > 0.4;
                  
                  if (useAcrobatic && onGround) {
                    // Acrobatic jump hit - more powerful and flashy
                    velY = JUMP_V * 0.85;
                    isJumping = true;
                    setAnimLocked('jump', 450);
                    addTimeout(() => {
                      // FIX: Confirm ball is still actually close before applying velocity
                      if (targetBall && !targetBall.exiting && Math.abs(targetBall.x - feetX) < ballReachX + 30 && Math.abs(targetBall.y - feetY) < ballReachY + 40) {
                        // Aim toward other cat's position with arc
                        const hitDir = mySide === 'left' ? 1 : -1;
                        const powerMultiplier = 1.2 + Math.random() * 0.3;
                        hitBall(targetBall, hitDir * (450 + Math.random() * 250) * powerMultiplier, -350 - Math.random() * 150);
                        spawnDust(feetX, feetY);
                        catEnergy = Math.max(0, catEnergy - 0.02); // Costs energy
                      }
                    }, 220);
                  } else if (onGround) {
                    // Regular paw hit  only fire if ball is truly within paw range
                    // FIX: Check dist at fire time (updateState runs at 10Hz; ball moves fast)
                    if (Math.abs(targetBall.x - feetX) < ballReachX + 25 && Math.abs(targetBall.y - feetY) < ballReachY) {
                      setAnimLocked('paw', 650);
                      const hitDir = mySide === 'left' ? 1 : -1;
                      
                      // Aim toward other cat's court position
                      const targetDist = Math.abs(otherCourtPosition - feetX);
                      const powerFactor = Math.min(1.2, targetDist / 400);
                      
                      hitBall(targetBall, hitDir * (380 + Math.random() * 320) * powerFactor, -280 - Math.random() * 220);
                      spawnDust(feetX, feetY);
                      catEnergy = Math.max(0, catEnergy - 0.01);
                    }
                  }
                } else {
                  // Wait in ready position, tracking ball
                  setDir(targetBall.x < feetX);
                  if (Math.random() < 0.03) {
                    setAnimLocked('paw', 300); // Ready stance wiggle
                  } else {
                    setAnim(chosenIdle);
                  }
                }
              } else {
                // Run to intercept ball  strictly within own side
                const interceptX = targetBall.x + (targetBall.vx * 0.25); // Predict position
                
                // FIX: Clamp intercept target to OWN court side  never cross center
                const targetPos = Math.max(myHardMin, Math.min(myHardMax, interceptX));
                const finalDx = targetPos - feetX;
                
                velX = SPEED_RUN * 1.1 * (finalDx > 0 ? 1 : -1);
                setDir(velX < 0);
                setAnim('run');
              }
              
            } else {
                
              // Calculate optimal waiting position based on ball trajectory
              let waitPosition = myCourtPosition;
              
              // If ball is moving fast, creep slightly toward center (but not past it)
              if (Math.abs(targetBall.vx) > 300) {
                const netOffset = mySide === 'left' ? 70 : -70;
                waitPosition = courtCenter + netOffset;
              }
              
              // FIX: Tighter hard clamping  cats never cross the net while waiting
              waitPosition = Math.max(myHardMin, Math.min(myHardMax, waitPosition));
              
              const dx = waitPosition - feetX;
              
              if (Math.abs(dx) > 40) {
                // Move to position
                velX = SPEED_WALK * 1.2 * (dx > 0 ? 1 : -1);
                setDir(velX < 0);
                setAnim('walk');
              } else {
                // In position - ready stance
                velX = 0;
                setDir(targetBall.x < feetX); // Always face the ball
                
                // Dynamic ready animations
                if (Math.random() < 0.025) {
                  const readyAnim = Math.random();
                  if (readyAnim < 0.4) {
                    setAnimLocked('paw', 350); // Paw ready
                  } else if (readyAnim < 0.7) {
                    setAnimLocked('clean2', 400); // FIX: 'stretch' is a state not an anim; 'clean2' is correct
                  } else {
                    // Small anticipation jump
                    if (onGround && Math.abs(targetBall.vx) > 350) {
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
            // Solo play mode - regular ball chasing
            if (distToBall < ballReachX) {
              velX = 0;
              
              // Acrobatic moves (20% chance)
              if (Math.random() < 0.2 && onGround && animLockTimer <= 0) {
                velY = JUMP_V * 0.7;
                isJumping = true;
                setAnimLocked('jump', 400);
                addTimeout(() => {
                  if (targetBall && !targetBall.exiting && Math.abs(targetBall.x - feetX) < ballReachX) {
                    hitBall(targetBall, (bdx > 0 ? 1 : -1) * (400 + Math.random() * 400), -300 - Math.random() * 250);
                    spawnDust(feetX, feetY);
                  }
                }, 200);
              } else if (animLockTimer <= 0) {
                setAnimLocked('paw', 600);
                velX = 0;  // FIX: stop sliding immediately  don't wait for next logic tick
                setDir(bdx > 0);  // FIX: face ball during paw swipe, eliminates 1-frame visual glitch
                hitBall(targetBall, (bdx > 0 ? 1 : -1) * (350 + Math.random() * 400), -250 - Math.random() * 300);
                spawnDust(feetX, feetY);
                earnXP(0.25);  // XP: playing ball earns XP.
                recordQuestEvent('ball_catches', 1);
              }
            } else {
              // FIX: Only run toward ball if not in the middle of a paw animation
              if (animLockTimer <= 0) {
                velX = SPEED_RUN * (bdx > 0 ? 1 : -1);
                setDir(velX < 0);
                setAnim('run');
              }
            }
          }
          
          if (stateTimer <= 0) go('sit');
          break;
        }

        if (!attackEl || !attackEl.isConnected) { go('sit'); return; }
        // Use cached rect  avoids per-frame forced reflow
        const r = getCachedRect(attackEl);
        const tx = r.left + r.w / 2;
        const dx = tx - feetX;
        
        if (Math.abs(dx) < 50) {
          velX = 0;
          setDir(dx < 0);
          if (animLockTimer <= 0) {
            setAnimLocked('paw', 1000);
            if (state === 'logo_hunt') {
              if (Math.random() < 0.05) spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
            } else if (state === 'chip_pounce' && Math.random() < 0.3) {
              triggerUiClick(attackEl);
              spawnDust(feetX, feetY);
            }
          }
          if (stateTimer <= 0) go('sit');
        } else {
          velX = SPEED_RUN * (dx > 0 ? 1 : -1);
          setDir(velX < 0); setAnim('run');
        }
        break;
      }

      /*  HIDE  */
      case 'hide': {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          velX = 0; go(null, ['hide']); return;
        }
        clampWalls();
        const hideDx = targetX - feetX;
        if (Math.abs(hideDx) < 40) {
          velX = 0;
          const cardZ = parseInt(getComputedStyle(attackEl).zIndex) || 0;
          catEl.style.zIndex  = String(Math.max(cardZ - 1, 0));
          state = 'hidden'; stateTimer = 2500 + Math.random() * 2000;
          setAnim(chosenIdle);
        } else {
          // Keep running toward hide target
          velX = (hideDx > 0 ? 1 : -1) * SPEED_RUN;
          setDir(velX < 0);
          setAnim('run');
        }
        break;
      }

      /*  HIDDEN  */
      case 'hidden': {
        if (Math.random() < 0.012) {
          const newDir = !facingLeft;
          setDir(newDir);
          feetX += newDir ? -5 : 5;
        }
        if (stateTimer <= 0) {
          catEl.style.zIndex  = '9999999';
          catEl.style.opacity = '1';
          go(Math.random() < 0.5 ? 'attack' : 'jump');
        }
        break;
      }

      /*  JUMP  */
      case 'jump': {
        clampWalls();
        if (onGround && stateTimer < 2800) {
          isJumping = false; go(null, ['jump']);
        }
        break;
      }

      /*  CLIMB  */
      case 'climbtop': {
        if (stateTimer <= 0 && onGround) { go(null, ['climbtop']); return; }
        clampWalls();
        const dx2 = targetX - feetX;
        if (Math.abs(dx2) < 85 && onGround && !isJumping) {
          velY = JUMP_V * 0.75;
          velX = (dx2 > 0 ? 1 : -1) * (SPEED_WALK + 20);
          setAnim('jump', true);
          isJumping = true; onGround = false;
          stateTimer = -1;
        } else if (!isJumping) {
          setDir(velX < 0); setAnim('run');
        }
        break;
      }

      /*  PATROL  */
      case 'patrol': {
        clampWalls();
        if (onGround && !isJumping && Math.abs(velX) > 5) {
          const dir = velX > 0 ? 1 : -1;
          if (isNearPlatformEdge(feetX, dir)) {
            const adj = findAdjacentPlatform(feetX, dir);
            if (adj) {
              // Randomized jump
              const jumpPower = 0.5 + Math.random() * 0.4;
              const horizPower = 0.8 + Math.random() * 0.5;
              velY = JUMP_V * jumpPower;
              velX = dir * SPEED_WALK * horizPower * 1.5;
              setAnim('jump', true);
              isJumping = true; onGround = false;
            } else {
              // Turn around at edge
              velX = -velX;
              setDir(velX < 0);
            }
          }
        }
        if (stateTimer <= 0) go(null, ['patrol']);
        break;
      }

      /*  POUNCE  */
      case 'pounce': {
        clampWalls();
        if (stateTimer <= 0) { isJumping = false; go('sit'); return; }
        if (onGround && !isJumping && attackEl && attackEl.isConnected) {
          const pr = getCachedRect(attackEl);
          if (Math.abs((pr.left + (pr.width || pr.w) / 2) - feetX) < 140) {
            velX = 0;
            setAnimLocked('paw', 1000);
            smashElement(attackEl);
            state = 'sit'; stateTimer = 1200;
          } else {
            go('sit');
          }
          return;
        }
        if (onGround && !attackEl) go('sit');
        break;
      }

      /*  EDGE SIT  walk to platform edge, sit and dangle */
      case 'edgesit': {
        if (stateTimer <= 0) { go(null, ['edgesit']); return; }
        clampWalls();
        const edgeDx = targetX - feetX;
        if (Math.abs(edgeDx) < 15) {
          velX = 0;
          // Face outward from the platform edge
          setDir(targetX < feetX);
          setAnim(chosenIdle);
          // Just sit here  stateTimer will eventually expire
        } else {
          velX = SPEED_WALK * (edgeDx > 0 ? 1 : -1);
          setDir(velX < 0); setAnim('walk');
        }
        break;
      }

      /*  HEAD TILT  look at cursor, occasionally paw at it */
      case 'headtilt': {
        velX = 0;
        setDir(cursorX < feetX);
        if (cdist < 120 && Math.random() < 0.005 && animLockTimer <= 0) {
          setAnimLocked('paw', 800);
          addTimeout(() => { if (state === 'headtilt') setAnim(chosenIdle); }, 800);
        }
        if (stateTimer <= 0) go(null, ['headtilt']);
        break;
      }

      /*  EXPLORE  walk to element, sniff (clean anim), then move on */
      case 'explore': {
        if (stateTimer <= 0 || !attackEl || !attackEl.isConnected) {
          go(null, ['explore']); return;
        }
        clampWalls();
        const expDx = targetX - feetX;
        if (Math.abs(expDx) < 30) {
          velX = 0;
          setDir(targetX < feetX);
          // "Sniff" the element  use clean animation
          if (curAnim !== ANIMS['clean1'] && curAnim !== ANIMS['clean2'] && animLockTimer <= 0) {
            setAnim(pickCleanVariant());
          }
        } else {
          velX = SPEED_WALK * 0.8 * (expDx > 0 ? 1 : -1);
          setDir(velX < 0); setAnim('walk');
        }
        break;
      }

      /*  PEEK A BOO (updateState)  */
      case 'peek_a_boo': {
        // Deliberately DO NOT call clampWalls
        const pvw = _vw;
        const pdx = targetX - feetX;
        if (onGround && Math.abs(pdx) < 20) {
          velX = 0;
          setDir(targetX < pvw / 2); // face INWARD
          setAnim(chosenIdle);
          if (Math.random() < 0.05) {
             setDir(!facingLeft);
             addTimeout(() => { if (state === 'peek_a_boo') setDir(targetX < pvw / 2); }, 400);
          }
        } else if (onGround && Math.abs(velX) < 10) {
           velX = SPEED_RUN * 1.2 * (pdx > 0 ? 1 : -1);
           setDir(velX < 0); setAnim('run');
        }
        if (stateTimer <= 0) go('sit');
        break;
      }

      /*  WALL SIT (updateState)  */
      case 'wall_sit': {
        // Don't use clampWalls  we're heading TO the wall intentionally
        if (state !== 'wall_sit') break;
        const wsDx = targetX - feetX;
        if (Math.abs(wsDx) < 25) {
           velX = 0;
           go(targetX < _vw / 2 ? 'wall_left' : 'wall_right');
        } else {
          velX = (wsDx > 0 ? 1 : -1) * SPEED_RUN * 1.4;
          setDir(velX < 0); setAnim('run');
          // Safety: if already touching the wall, just transition
          const wallTouch = getSideWallMargin();
          if (feetX <= wallTouch) { feetX = getWallAttachX('left'); go('wall_left'); break; }
          if (feetX >= _vw - wallTouch) { feetX = getWallAttachX('right'); go('wall_right'); break; }
        }
        if (stateTimer <= 0) go('sit');
        break;
      }

      case 'wall_left_sit': 
      case 'wall_right_sit': {
         if (stateTimer <= 0) {
            globalRot = 0; applyTransform();
            velY = 0; velX = state === 'wall_left_sit' ? SPEED_RUN : -SPEED_RUN;
            onGround = false; isJumping = true;
            setAnim('jump', true);
            state = 'jump'; stateTimer = 3000;
         }
         break;
      }

      /*  LOYAL FOLLOW (updateState)  */
      case 'loyal_follow': {
        if (!isLoyalMode) { go('sit'); break; }
        clampWalls();
        const ldx = cursorX - feetX;
        const ldy = cursorY - feetY;
        const ldist = Math.abs(ldx);
        const lvdist = Math.abs(ldy);
        
        // Arrived near cursor
        if (ldist < 50 && lvdist < 70) {
          velX *= 0.85;
          if (Math.abs(velX) < 5) velX = 0;
          setDir(cursorX < feetX);
          if (animLockTimer <= 0) setAnim(chosenIdle);
          chaseStuckTimer = 0;
          attackPhase = 'pursue';
          break;
        }
        
        // Cursor above detection for loyal mode
        if (ldy < -100 && onGround && !isJumping) {
          chaseStuckTimer += dt;
          if (chaseStuckTimer > 2.0) {
            // Transition to chase to use the pathfinding brain
            go('chase');
            return;
          }
        } else {
          chaseStuckTimer = Math.max(0, chaseStuckTimer - dt * 0.3);
        }
        
        // Platform edge awareness
        if (onGround && !isJumping && ldist > 50) {
          const lDir = ldx > 0 ? 1 : -1;
          if (isNearPlatformEdge(feetX, lDir)) {
            const adj = findAdjacentPlatform(feetX, lDir);
            if (adj) {
              velY = JUMP_V * (0.5 + Math.random() * 0.3);
              velX = lDir * SPEED_RUN * (0.9 + Math.random() * 0.3);
              setAnim('jump', true);
              isJumping = true; onGround = false;
              break;
            } else if (ldy > 30) {
              velX = lDir * SPEED_RUN;
              velY = 50;
              onGround = false; isJumping = true;
              setAnim('jump', true);
              break;
            }
          }
        }
        
        // Default horizontal follow
        if (onGround && !isJumping && ldist > 50) {
          const lspd = ldist > 200 ? SPEED_RUN : SPEED_WALK;
          velX = (ldx > 0 ? 1 : -1) * lspd;
          setDir(velX < 0);
          setAnim(ldist > 200 ? 'run' : 'walk');
        }
        break;
      }

      /*  DEEP SLEEP (updateState)  */
      case 'deepsleep': {
        if (!isDeepSleep) { go('stretch'); break; }
        const dsDx = targetX - feetX;
        if (Math.abs(dsDx) < 30) {
          velX = 0;
          if (curAnim !== ANIMS['sleep']) setAnim('sleep');
          // Spawn Zzz particles occasionally
          if (Math.random() < 0.008) spawnZzz();
        } else {
          velX = SPEED_WALK * 0.7 * (dsDx > 0 ? 1 : -1);
          setDir(velX < 0); setAnim('walk');
        }
        break;
      }

      /*  CHASE FISH  */
      case 'chasefish': {
        // Fish gone or despawned? Stop chasing
        if (!targetFish || !activeFishes.includes(targetFish) || activeFishes.length === 0) {
           targetFish = null;
           go('sit'); break;
        }
        
        // REALISTIC: Cat might lose interest mid-chase
        // Check every few seconds if still interested
        if (Math.random() < 0.002) { // ~0.2% per frame = check every few seconds
          let continueInterest = 0.7; // Base 70% to continue
          
          // Low energy = lose interest faster
          if (catEnergy < 0.3) continueInterest -= 0.4;
          
          // If chase is taking too long, lose interest
          // stateTimer starts at 30000 and counts DOWN; < 20000 means >10s elapsed  correct
          if (stateTimer < 20000) continueInterest -= 0.2;
          
          // If fish is very far, might give up
          const distToFish = Math.abs(targetFish.x - feetX);
          if (distToFish > 500) continueInterest -= 0.3;
          
          // Sleepy cats give up easier
          if (catEnergyLevel === 'sleepy') continueInterest -= 0.3;
          
          if (Math.random() > continueInterest) {
            // Lost interest! Do something else
            targetFish = null;
            const randomAction = Math.random();
            if (randomAction < 0.3) {
              go('sit'); // Just sit down
            } else if (randomAction < 0.6) {
              go('groom'); // Groom instead
            } else {
              go('wander');
            }
            break;
          }
        }
        
        // Re-target closest fish if a closer one appeared
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
          if (closest !== targetFish && Math.abs(closest.x - feetX) < Math.abs(targetFish.x - feetX) * 0.6) {
            targetFish = closest;
          }
        }
        
        targetX = targetFish.x;
        const fishDist = Math.abs(feetX - targetX);
        const fishRawYDist = targetFish.y - feetY;  // positive = fish is BELOW
        const fishYDist = Math.abs(fishRawYDist);
        
        // EAT! Cat caught the fish
        const fishCatchX = 45 + (sizeMultiplier - 1) * 28;
        const fishCatchY = 55 + (sizeMultiplier - 1) * 30;
        if (fishDist < fishCatchX && fishYDist < fishCatchY) {
           const fidx = activeFishes.indexOf(targetFish);
           if (fidx > -1) {
               releaseActivePickup('fish');
               targetFish.el.remove();
               activeFishes.splice(fidx, 1);
               // FIX: Clear draggedFish if the player was holding this fish when the cat caught it
               if (draggedFish === targetFish) { draggedFish = null; }
               targetFish = null;
               spawnDust(feetX, feetY);
               earnXP(1.0);  // XP: eating fish earns XP.
               awardCoins(getFishCoinReward());
               recordQuestEvent('fish_served', 1);
               go('eatfish');
           } else {
               // The other cat ate it first!
               targetFish = null;
               go('sit');
           }
           break;
        }
        
        //  KEY STATE: Is the fish below the cat? 
        const fishIsBelow = fishRawYDist > 40;
        const catPlat = onGround ? getCurrentPlatform() : null;
        const catIsOnPlatform = catPlat !== null && catPlat.top < _vh - 30;
        
        //  DIRECTION WITH HYSTERESIS 
        // Prevent rapid left-right oscillation when fish is roughly below
        let fishDir;
        if (fishIsBelow && fishDist < 60) {
          // Fish is directly below  don't oscillate, pick nearest edge and go there
          if (catIsOnPlatform) {
            const distToLeft = feetX - catPlat.left;
            const distToRight = catPlat.right - feetX;
            fishDir = distToLeft < distToRight ? -1 : 1;
          } else {
            // Not on a platform, just go toward fish X
            fishDir = targetFish.x > feetX ? 1 : -1;
          }
        } else {
          fishDir = targetFish.x > feetX ? 1 : -1;
        }
        
        //  SET VELOCITY 
        const chaseSpeed = fishDist > 200 ? SPEED_RUN * 1.3 : SPEED_RUN;
        velX = fishDir * chaseSpeed;
        setDir(velX < 0);
        
        // Force run animation if on ground
        if (onGround && !isJumping && animLockTimer <= 0) {
          if (curAnim !== ANIMS['run']) setAnim('run', true);
        }
        
        //  PROGRESS TRACKING & STUCK DETECTION 
        stuckCheckTimer += dt * 1000;
        if (stuckCheckTimer > 1200) {  // increased from 800ms
          const moved = Math.abs(feetX - lastFishChaseX);
          if (moved > 15) {
            stateTimer = Math.max(stateTimer, 15000);
          }
          lastFishChaseX = feetX;
          
          if (moved < 6 && onGround && !isJumping) {
            if (fishIsBelow && catIsOnPlatform) {
              // Find nearest edge of current platform
              const distToLeft = feetX - catPlat.left;
              const distToRight = catPlat.right - feetX;
              const edgeDir = distToLeft < distToRight ? -1 : 1;
              // Small horizontal push off the edge + tiny downward velocity
              velX = edgeDir * SPEED_RUN * 1.5;
              velY = 50;  // Push DOWN
              onGround = false;
              isJumping = true;
              setAnim('jump', true);
            } else if (fishRawYDist < -40) {
              // Fish is ABOVE  jump up toward it
              const jumpH = 0.7 + Math.random() * 0.4;
              velY = JUMP_V * jumpH;
              velX = fishDir * SPEED_RUN * (1.0 + Math.random() * 0.5);
              setAnim('jump', true);
              isJumping = true;
              onGround = false;
} else {
              // Same level stuck  hop toward fish
              velY = JUMP_V * (0.5 + Math.random() * 0.3);
              velX = fishDir * SPEED_RUN * (1.2 + Math.random() * 0.6);
              setAnim('jump', true);
              isJumping = true;
              onGround = false;
            }
          }
          stuckCheckTimer = 0;
        }
        
        //  INTELLIGENT PATHFINDING (only when grounded) 
        if (onGround && !isJumping) {
          
          //  PRIORITY 1: Fish is below and cat is on a platform  GET DOWN
          if (fishIsBelow && catIsOnPlatform) {
            const distToLeft = feetX - catPlat.left;
            const distToRight = catPlat.right - feetX;
            const nearestEdgeDist = Math.min(distToLeft, distToRight);
            const edgeDir = distToLeft < distToRight ? -1 : 1;
            
            // Override fishDir  head toward nearest edge
            velX = edgeDir * SPEED_RUN;
            setDir(velX < 0);
            
            // At the edge? DROP OFF (don't jump to adjacent!)
            if (nearestEdgeDist < 50) {
              // Small hop off the edge with horizontal push toward fish
              const towardFish = targetFish.x > feetX ? 1 : -1;
              velX = towardFish * SPEED_RUN * 1.2;
              velY = 50;  // Gentle downward push  let gravity do the rest
              onGround = false;
              isJumping = true;
              setAnim('jump', true);
              break;
            }
            break;  // Don't run other pathfinding  just run to edge
          }
          
          //  PRIORITY 2: Fish on a different platform (same level or above)
          const fishPlat = getPlatformAt(targetFish.x, targetFish.y);
          if (fishPlat && catPlat && Math.abs(fishPlat.top - catPlat.top) > 30) {
            if (isNearPlatformEdge(feetX, fishDir)) {
              const jumpDist = Math.abs(fishPlat.left + fishPlat.width/2 - feetX);
              const heightDiff = fishPlat.top - catPlat.top;
              
              let jumpPower = 0.7;
              let horizPower = 1.2;
              
              // Fish platform is above
              if (heightDiff < -50) {
                jumpPower = Math.min(1.3, 0.8 + (Math.abs(heightDiff) / 150));
              }
              // Fish platform is below  gentle hop
              else if (heightDiff > 50) {
                jumpPower = 0.3;
              }
              if (jumpDist > 150) {
                horizPower = Math.min(2.2, 1.3 + (jumpDist / 200));
              }
              
              const rf = 0.85 + Math.random() * 0.25;
              velY = JUMP_V * jumpPower * rf;
              velX = fishDir * SPEED_RUN * horizPower * rf;
              setAnim('jump', true);
              isJumping = true;
              onGround = false;
              break;
            }
          }
          
          //  PRIORITY 3: At platform edge  decide: adjacent or drop
          if (isNearPlatformEdge(feetX, fishDir)) {
            const adj = findAdjacentPlatform(feetX, fishDir);
            
            // If fish is below and there's an adjacent platform,
            // DON'T jump to it  drop down instead
            if (fishIsBelow) {
              velX = fishDir * SPEED_RUN * 1.3;
              velY = 50;  // Downward push
              onGround = false;
              isJumping = true;
              setAnim('jump', true);
            } else if (adj) {
              // Fish is roughly same level or above  jump to adjacent
              const jp = 0.6 + Math.random() * 0.5;
              const hp = 0.9 + Math.random() * 0.6;
              velY = JUMP_V * jp;
              velX = fishDir * SPEED_RUN * hp * 1.3;
              setAnim('jump', true);
              isJumping = true;
              onGround = false;
            } else {
              // No adjacent platform  hop off the edge
              velY = JUMP_V * 0.3;
              velX = fishDir * SPEED_RUN * 1.5;
              setAnim('jump', true);
              isJumping = true;
              onGround = false;
            }
          }
        }
        
        //  HIGH JUMP INTERCEPT  fish falling from above 
        if (targetFish.y < feetY - 40 && fishDist < 200 && onGround && !isJumping && targetFish.vy > -150) {
           const interceptPower = 0.8 + Math.random() * 0.5;
           velX = fishDir * SPEED_RUN * 1.8 * interceptPower;
           velY = -Math.min(400, Math.max(200, (feetY - targetFish.y) * 1.5 + 50)) * interceptPower;
           onGround = false;
           isJumping = true;
           setAnim('jump', true);
           break;
        }
        
        // Only give up on absolute timeout (30s) or fish truly off-screen
        const fishOffScreen = targetFish.x < -200 || targetFish.x > _vw + 200 ||
                              targetFish.y > _vh + 200;
        if (stateTimer <= 0 || fishOffScreen) {
          targetFish = null;
          go('sit');
        }
        break;
      }
      
      /*  EAT FISH  */
      case 'eatfish': {
        velX = 0;
        if (stateTimer <= 0) go('sit');
        break;
      }

      /*  WEBBED STUN  */
      case 'webbed_stun': {
         velX *= 0.9;
         if (stateTimer <= 0) { velX = 0; go('sit'); }
         break;
      }

      /*  CHASING BUG  */
      case 'chasing_bug': {
         if (!targetSpider || targetSpider.dead || !activeSpiders.includes(targetSpider)) {
            targetSpider = null;
            go('sit');
            break;
         }
         
         const dx = targetSpider.x - feetX;
         const dy = targetSpider.y - feetY;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         const catchX = targetSpider.hitRadiusX || 50;
         const catchY = targetSpider.hitRadiusY || 55;
         if (Math.abs(dx) < catchX && Math.abs(dy) < catchY) { // Hit it
            velX = 0;
            targetSpider.health = Math.max(0, (targetSpider.health || 1) - 1);
            spawnDust(feetX, feetY);
            setAnimLocked('paw', targetSpider.isBig ? 850 : 1000);

            if (targetSpider.health > 0) {
               const pushDir = feetX < targetSpider.x ? -1 : 1;
               targetSpider.state = 'damage';
               targetSpider.stateTimer = 550;
               targetSpider.curFrame = 0;
               targetSpider.animAccum = 0;
               targetSpider.vx = -pushDir * (targetSpider.isBig ? 180 : 120);
               targetSpider.vy = targetSpider.isBig ? -120 : -80;
               velX = pushDir * (targetSpider.isBig ? 300 : 180);
               velY = Math.min(velY, JUMP_V * 0.35);
               onGround = false;
               isJumping = true;
               targetSpider = null;
               state = 'stunned';
               stateTimer = 650;
               break;
            }

            targetSpider.dead = true;
            targetSpider.curFrame = 0;
            targetSpider.animAccum = 0;
            targetSpider.state = 'death';
            awardCoins(targetSpider.isBig ? 12 : 3);   // Coins: spider caught.
            recordQuestEvent('spiders_caught', 1);
            targetSpider = null;
            go('sit');
            break;
         }
         
         if (onGround && !isJumping) {
            if (dy < -150) {
               // Spider is too high on the ceiling/web, stare up
               velX *= 0.8;
               if (Math.abs(velX) < 10) velX = 0;
               setDir(dx < 0);
               setAnim(chosenIdle); // stare uses idle sprite
            } else {
                if (Math.abs(dx) < 20) {
                   velX *= 0.8;
                   if (Math.abs(velX) < 10) velX = 0;
                   setAnim(chosenIdle); // stare uses idle sprite
                 } else {
                    velX = (dx > 0 ? 1 : -1) * SPEED_RUN * 1.4;
                    setAnim('run');
                 }
                setDir(dx < 0);
               
               if (dy < -40 && dist < 100 && (targetSpider.state === 'drop' || targetSpider.state === 'dangle' || targetSpider.state === 'dangle_pause' || targetSpider.state === 'held')) {
                  velY = JUMP_V * 0.8;
                  onGround = false; isJumping = true;
                  setAnim('jump', true);
               }
            }
         }
         
         if (stateTimer <= 0) {
            targetSpider = null;
            go('sit');
         }
         break;
      }

      /* COIN CHASE */
      case 'coinchase': {
        if (!coinChaseTarget || coinChaseTarget.caught) {
          coinChaseTarget = null;
          go('sit');
          break;
        }
        
        const coinDx = coinChaseTarget.x - feetX;
        const coinDy = coinChaseTarget.y - feetY;
        const coinIsBelow = coinDy > 40;
        const catPlat = onGround ? getCurrentPlatform() : null;
        const catIsOnPlatform = catPlat !== null && catPlat.top < _vh - 30;

        if (catIsOnPlatform && coinIsBelow && Math.abs(coinDx) < 60) {
          const distToLeft = feetX - catPlat.left;
          const distToRight = catPlat.right - feetX;
          const nearestEdgeDist = Math.min(distToLeft, distToRight);
          const edgeDir = distToLeft < distToRight ? -1 : 1;
          
          velX = edgeDir * SPEED_RUN * 1.2;
          setDir(velX < 0);
          setAnim('run');
          
          if (nearestEdgeDist < 40 && onGround && !isJumping) {
            velX = edgeDir * SPEED_RUN * 1.5;
            velY = 50;
            onGround = false;
            isJumping = true;
            setAnim('jump', true);
          }
        } else {
          setDir(coinDx < 0);
          if (Math.abs(coinDx) > 30) {
            velX = (coinDx > 0 ? 1 : -1) * SPEED_RUN * 1.2;
            setAnim('run');
          } else {
            velX *= 0.7;
            setAnim('walk');
          }
        }
        stateTimer = 20000;
        break;
      }


    }
  }

  // 
  //  PHYSICS
  // 
  function updatePhysics(dt) {
    if (isDragging) return;
    const vw = _vw;
    const baseFloor = _vh;

    //  WALL_LEFT PHYSICS 
    if (state === 'wall_left') {
      feetX = getWallAttachX('left');
      velX = 0;  // FIX: never allow horizontal drift while on wall
      feetY += velY * dt;
      // FIX: clamp to screen top  prevents cat from clipping above the viewport
      if (feetY < 10) { feetY = 10; if (velY < 0) velY = 0; }

      if (uiWallTask && feetY <= uiWallTask.targetY) {
        window.scrollBy({ top: uiWallTask.scrollDir * (70 + Math.random() * 90), left: 0, behavior: 'smooth' });
        setAnimLocked('paw', 550);
        uiWallTask = null;
        uiTarget = null;
        globalRot = 0;
        applyTransform();
        velX = SPEED_RUN * 0.9;
        velY = JUMP_V * 0.25;
        onGround = false;
        isJumping = true;
        setAnim('jump', true);
        state = 'jump';
        stateTimer = 2200;
        return;
      }
      
      if (attackPhase === 'climb') {
        //  REALISTIC CONTINUOUS WALL GRAVITY 
        // Gravity increases the longer the cat stays on the wall  like real fatigue
        // stateTimer counts DOWN from initial, so elapsed = initial - current
        const wallElapsed = Math.max(0, (10000 - stateTimer) / 1000); // seconds on wall (approx)
        const wallGravity = 8 + wallElapsed * 2; // Reduced aggression from 15 + wallElapsed * 4
        velY += wallGravity * dt;
        // Cap climb speed  cat can't run up infinitely fast
        velY = Math.max(velY, -SPEED_RUN * 1.1);
        
        // Cat struggles to maintain grip - more likely to slip when tired or climbing fast
        const slipChance = catEnergy < 0.3 ? 0.0005 : 0.0001;
        const suddenFallChance = catEnergy < 0.2 ? 0.0001 : 0.00002;
        
        // Random slip: paws lose grip  slide phase
        if (Math.random() < slipChance) {
          attackPhase = 'slide';
          velY = SPEED_RUN * (0.3 + Math.random() * 0.5);  // start slide slowly
          setAnim('scared', true);
          catEnergy = Math.max(0, catEnergy - 0.08);
        }
        
        // Random complete failure: falls off wall entirely
        if (Math.random() < suddenFallChance) {
          globalRot = 0; applyTransform();
          velX = 70 + Math.random() * 100;
          velY = JUMP_V * (0.12 + Math.random() * 0.25);  // smaller fall jump
          onGround = false; isJumping = true;
          setAnim('jump', true);
          setAnimLocked('scared', 800);
          state = 'jump'; stateTimer = 2500 + Math.random() * 1000;
          catEnergy = Math.max(0, catEnergy - 0.12);
          return;
        }
        
        // Fatigue: climbing gets slower over time
        if (stateTimer < 4000 && catEnergy < 0.4) {
          velY = Math.max(velY, -SPEED_RUN * 0.5);
        }
        
        //  JUMP OFF AT TARGET HEIGHT 
        if (feetY <= targetX) {
          feetY = targetX;
          globalRot = 0; applyTransform();
          
          const heightReached = (_vh - feetY) / _vh;
          // jumpPower capped at 0.5 max  was 0.75
          const jumpPower = Math.min(0.5, 0.25 + Math.random() * 0.3);
          // horizPower capped at 1.4 max  was 1.6
          const horizPower = Math.min(1.4, 0.5 + Math.random() * 0.6);
          
          velY = JUMP_V * jumpPower;   // max: -375 (was -650)
          velX = SPEED_RUN * horizPower * 1.8;  // max ~346 (was ~528)
          onGround = false; isJumping = true;
          setAnim('jump', true);
          state = 'jump'; stateTimer = 3000 + Math.random() * 800;
          
          // Rare spin jump
          if (Math.random() < 0.07) {
            let sp = 0; const t0 = safeNow();
            const tick = (now) => {
              if (isDestroyed || !catEnabled || !catEl.isConnected) return;
              sp = ((now - t0) / 30) * 15;
              if (sp >= 360 || onGround) { globalRot = 0; applyTransform(); }
              else { globalRot = sp; applyTransform(); requestAnimationFrame(tick); }
            };
            requestAnimationFrame(tick);
          }
          return;
        }
      }
      
      if (attackPhase === 'slide') {
        //  REALISTIC FRICTION-BASED SLIDING 
        // Kinetic friction model: deceleration proportional to speed + constant static grip
        const slideSpeed = Math.abs(velY);
        const kineticFriction = 0.80; // friction coefficient (lower = slides faster)
        const staticGrip = 28 + Math.random() * 18; // paw grip force
        velY = velY * kineticFriction - staticGrip * dt;
        // Ensure slide doesn't go negative (we'd be climbing again)
        velY = Math.max(0, velY);
        // Cap slide speed  terminal velocity on the wall
        velY = Math.min(velY, SPEED_RUN * 1.8);
        
        // Paws scrabbling animation
        if (curAnim !== ANIMS['run']) setAnim('run');
        
        // Chance to re-grip  harder when sliding fast, easier when slow
        const regripChance = (catEnergy > 0.5 ? 0.006 : 0.003) * (1 - slideSpeed / (SPEED_RUN * 2));
        
        if (Math.random() < regripChance) {
          attackPhase = 'climb';
          velY = -(SPEED_RUN * (0.4 + Math.random() * 0.4));
          setAnim('run', true);
          catEnergy = Math.max(0, catEnergy - 0.04);
        }
        
        // If sliding fast enough, might lose grip entirely
        if (slideSpeed > SPEED_RUN * 1.4 && Math.random() < 0.0012) {
          globalRot = 0; applyTransform();
          velX = 50 + Math.random() * 70;
          velY = 80 + Math.random() * 120;
          onGround = false; isJumping = true;
          setAnim('jump', true);
          setAnimLocked('scared', 1000);
          state = 'jump'; stateTimer = 3000;
          catEnergy = Math.max(0, catEnergy - 0.15);
          return;
        }
        
        // Slid all the way back to floor
        if (feetY >= _vh - 5) {
          feetY = _vh; velY = 0;
          globalRot = 0; applyTransform();
          setAnimLocked('scared', 600 + Math.random() * 400);
          catEnergy = Math.max(0, catEnergy - 0.08);
          go('sit');
          return;
        }
      }
      
      // Timeout or reached floor - stop wall climbing
      if (feetY >= _vh) { 
        feetY = _vh; 
        globalRot = 0; 
        applyTransform(); 
        go('sit'); 
      }
      return;
    }
    //  WALL_RIGHT PHYSICS 
    if (state === 'wall_right') {
      feetX = getWallAttachX('right');
      velX = 0;  // FIX: never allow horizontal drift while on wall
      feetY += velY * dt;
      // FIX: clamp to screen top  prevents cat from clipping above the viewport
      if (feetY < 10) { feetY = 10; if (velY < 0) velY = 0; }

      if (uiWallTask && feetY <= uiWallTask.targetY) {
        window.scrollBy({ top: uiWallTask.scrollDir * (70 + Math.random() * 90), left: 0, behavior: 'smooth' });
        setAnimLocked('paw', 550);
        uiWallTask = null;
        uiTarget = null;
        globalRot = 0;
        applyTransform();
        velX = -SPEED_RUN * 0.9;
        velY = JUMP_V * 0.25;
        onGround = false;
        isJumping = true;
        setAnim('jump', true);
        state = 'jump';
        stateTimer = 2200;
        return;
      }
      
      if (attackPhase === 'climb') {
        //  REALISTIC CONTINUOUS WALL GRAVITY  (right wall mirror)
        const wallElapsed = Math.max(0, (10000 - stateTimer) / 1000);
        const wallGravity = 15 + wallElapsed * 4;
        velY += wallGravity * dt;
        velY = Math.max(velY, -SPEED_RUN * 1.1);
        
        const slipChance = catEnergy < 0.3 ? 0.0005 : 0.0001;
        const suddenFallChance = catEnergy < 0.2 ? 0.0001 : 0.00002;
        
        if (Math.random() < slipChance) {
          attackPhase = 'slide';
          velY = SPEED_RUN * (0.3 + Math.random() * 0.5);
          setAnim('scared', true);
          catEnergy = Math.max(0, catEnergy - 0.08);
        }
        
        if (Math.random() < suddenFallChance) {
          globalRot = 0; applyTransform();
          velX = -(70 + Math.random() * 100);  // negative = push left (away from right wall)
          velY = JUMP_V * (0.12 + Math.random() * 0.25);
          onGround = false; isJumping = true;
          setAnim('jump', true);
          setAnimLocked('scared', 800);
          state = 'jump'; stateTimer = 2500 + Math.random() * 1000;
          catEnergy = Math.max(0, catEnergy - 0.12);
          return;
        }
        
        if (stateTimer < 4000 && catEnergy < 0.4) {
          velY = Math.max(velY, -SPEED_RUN * 0.5);
        }
        
        //  CAPPED JUMP OFF RIGHT WALL 
        if (feetY <= targetX) {
          feetY = targetX;
          globalRot = 0; applyTransform();
          
          const jumpPower = Math.min(0.75, 0.35 + Math.random() * 0.4);
          const horizPower = Math.min(1.6, 0.6 + Math.random() * 0.8);
          
          velY = JUMP_V * jumpPower;            // max: -375
          velX = -(SPEED_RUN * horizPower * 1.8); // negative = leftward, max ~-346
          onGround = false; isJumping = true;
          setAnim('jump', true);
          state = 'jump'; stateTimer = 3000 + Math.random() * 800;
          
          if (Math.random() < 0.07) {
            let sp = 0; const t0 = safeNow();
            const tick = (now) => {
              if (isDestroyed || !catEnabled || !catEl.isConnected) return;
              sp = ((now - t0) / 30) * 15;
              if (sp >= 360 || onGround) { globalRot = 0; applyTransform(); }
              else { globalRot = -sp; applyTransform(); requestAnimationFrame(tick); }
            };
            requestAnimationFrame(tick);
          }
          return;
        }
      }
      
      if (attackPhase === 'slide') {
        //  REALISTIC FRICTION-BASED SLIDING (right wall mirror) 
        const slideSpeed = Math.abs(velY);
        const kineticFriction = 0.80;
        const staticGrip = 28 + Math.random() * 18;
        velY = velY * kineticFriction - staticGrip * dt;
        velY = Math.max(0, velY);
        velY = Math.min(velY, SPEED_RUN * 1.8);
        
        if (curAnim !== ANIMS['run']) setAnim('run');
        
        const regripChance = (catEnergy > 0.5 ? 0.006 : 0.003) * (1 - slideSpeed / (SPEED_RUN * 2));
        
        if (Math.random() < regripChance) {
          attackPhase = 'climb';
          velY = -(SPEED_RUN * (0.4 + Math.random() * 0.4));
          setAnim('run', true);
          catEnergy = Math.max(0, catEnergy - 0.05);
        }
        
        if (slideSpeed > SPEED_RUN * 1.4 && Math.random() < 0.0012) {
          globalRot = 0; applyTransform();
          velX = -(50 + Math.random() * 70);  // push left (away from right wall)
          velY = 80 + Math.random() * 120;
          onGround = false; isJumping = true;
          setAnim('jump', true);
          setAnimLocked('scared', 1000);
          state = 'jump'; stateTimer = 3000;
          catEnergy = Math.max(0, catEnergy - 0.2);
          return;
        }
        
        if (feetY >= _vh - 5) {
          feetY = _vh; velY = 0;
          globalRot = 0; applyTransform();
          setAnimLocked('scared', 600 + Math.random() * 400);
          catEnergy = Math.max(0, catEnergy - 0.1);
          go('sit');
          return;
        }
      }
      
      // Timeout or reached floor - stop wall climbing
      if (feetY >= _vh) { 
        feetY = _vh; 
        globalRot = 0; 
        applyTransform(); 
        go('sit'); 
      }
      return;
    }

    if (state === 'wall_left_sit') {
      feetX = getWallAttachX('left');
      velX = 0;  // FIX: no horizontal drift on wall
      feetY += velY * dt;
      if (feetY < 10) { feetY = 10; if (velY < 0) velY = 0; }  // top clamp
      if (feetY <= targetX && velY !== 0) {
         feetY = targetX;
         velY = 0;
         setAnim(chosenIdle); // stop running and hang out
      }
      return;
    }
    
    if (state === 'wall_right_sit') {
      feetX = getWallAttachX('right');
      velX = 0;  // FIX: no horizontal drift on wall
      feetY += velY * dt;
      if (feetY < 10) { feetY = 10; if (velY < 0) velY = 0; }  // top clamp
      if (feetY <= targetX && velY !== 0) {
         feetY = targetX;
         velY = 0;
         setAnim(chosenIdle); // stop running and hang out
      }
      return;
    }

    //  NORMAL PHYSICS 
    const nextX     = feetX + velX * dt;

    let activeFloor = (state !== 'hide' && state !== 'hidden')
      ? computeFloor(nextX)
      : baseFloor;

    // YouTube virtualizes cards while scrolling/loading. Hold the cat briefly on
    // its last platform height instead of letting stale layout data make it
    // slowly sink through the page.
    const physicsNow = safeNow();
    const layoutSettling = isScrolling || !!mutationScanTimeout || envPending || (physicsNow - lastScrollActivityAt < 450);
    if (layoutSettling && onGround && feetY < baseFloor - 24 && activeFloor === baseFloor) {
      activeFloor = feetY;
      velY = 0;
      isJumping = false;
    }

    if (!onGround) {
      velY += GRAVITY * dt;
      if (catThrowHeavyTimer > 0) {
        catThrowHeavyTimer = Math.max(0, catThrowHeavyTimer - dt);
        velX *= Math.pow(0.91, dt * 60);
        if (velY < 0) velY *= Math.pow(0.84, dt * 60);
        velY += GRAVITY * 0.38 * dt;
      }
    }

    feetX += velX * dt;
    feetY += velY * dt;

    if (state !== 'hide' && state !== 'hidden' && state !== 'peek_a_boo') {
      const wallMargin = getSideWallMargin();
      if (feetX < wallMargin) {
        feetX = wallMargin;
        // FIX: Only enter wall_left if actually moving LEFT (ninja_climb could be going right)
        if (state === 'ninja_climb' && velX < 0) {
          go('wall_left'); return;
        } else if (velX < -150 && Math.random() < 0.2) {
          go('wall_left'); return;
        }
        recoverFromSideWall('left');
      }
      if (feetX > vw - wallMargin) {
        feetX = vw - wallMargin;
        // FIX: Only enter wall_right if actually moving RIGHT
        if (state === 'ninja_climb' && velX > 0) {
          go('wall_right'); return;
        } else if (velX > 150 && Math.random() < 0.2) {
          go('wall_right'); return;
        }
        recoverFromSideWall('right');
      }
    }

    if (feetY >= activeFloor) {
      feetY = activeFloor;
      
      // Store landing velocity before zeroing it
      const landingVelY = velY;
      velY  = 0;
      
      if (!onGround) {
        onGround  = true;
        isJumping = false;
        catThrowHeavyTimer = 0;
        spawnDust(feetX, feetY);
        shakeScreen(Math.min(4.8, 1.8 + landingVelY / 220), Math.min(320, 180 + landingVelY / 6));
        
        //  BOUNCE EFFECT ON LANDING 
        if (landingVelY > 150 && activeFloor < baseFloor) {
          // We landed hard on a platform! Let's bounce it.
          const catPlat = getCurrentPlatform();
          if (catPlat && catPlat.el && catPlat.el.isConnected) {
            bounceElement(catPlat.el, landingVelY);
          }
        }

        if (state === 'jump' || state === 'climbtop')
          go(null, ['jump', 'climbtop']);
      }
    } else {
      onGround = false;
    }

    //  CRITICAL FIX: Check if cat is standing on a platform that disappeared or became hidden.
    // When YouTube is virtualizing/loading cards, wait briefly; after that, drop fast
    // instead of slowly floating or sinking on stale platform data.
    if (onGround && feetY < baseFloor - 20) {
      const catPlat = getCurrentPlatform();
      const platformGone = !catPlat || !isPlatformStillValid(catPlat);
      const waitForFreshLayout = layoutSettling && (physicsNow - lastScrollActivityAt < 650);
      if (platformGone && !waitForFreshLayout) {
        onGround = false;
        isJumping = true;
        velY = Math.max(velY, (isScrolling || mutationScanTimeout || envPending) ? 420 : 220);
        if (state !== 'chasefish' && state !== 'dragged') {
          setAnim('jump', true);
        }
      }
    }

    // Safety net
    if (feetY > _vh + 100) {
      feetY = baseFloor; velY = 0;
      onGround = true; isJumping = false; velX = 0; catThrowHeavyTimer = 0;
      go('sit');
    }
    if (feetY < -20) { feetY = -20; if (velY < 0) velY = 0; }

    // Auto-direction while walking/running
    if (onGround && !isJumping && (state === 'wander' || state === 'zoomies' || state === 'spook' || state === 'patrol')) {
      if      (velX >  8) setDir(false);
      else if (velX < -8) setDir(true);
      // Only set idle if truly stopped AND not anim-locked
      if (Math.abs(velX) < 5 && animLockTimer <= 0) {
        setAnim(chosenIdle);  // use stored variant, no randomness
      } else if (animLockTimer <= 0) {
        // Ensure proper walk/run animation based on speed
        const absVelX = Math.abs(velX);
        if (absVelX >= SPEED_RUN * 0.7) {
          if (curAnim !== ANIMS['run']) setAnim('run');
        } else if (absVelX >= SPEED_WALK * 0.5) {
          if (curAnim !== ANIMS['walk']) setAnim('walk');
        }
      }
    }

    // Airborne  always use jump anim (unless anim-locked)
    if (!onGround && isJumping && state !== 'attack' && state !== 'pounce') {
      if (curAnim !== ANIMS['jump'] && animLockTimer <= 0) setAnim('jump', true);
    }
    
    // Landing transition - restore movement animation
    if (onGround && !isJumping && curAnim === ANIMS['jump'] && animLockTimer <= 0) {
      if (state === 'chasefish') {
        // Always restore run animation when landing during fish chase
        setAnim('run', true);
      } else if (state === 'ball_play' && animLockTimer > 0) {
        // FIX: Don't override paw animation during ball_play hit  skip
      } else {
        const absVelX = Math.abs(velX);
        if (absVelX >= SPEED_RUN * 0.7) {
          setAnim('run');
        } else if (absVelX >= SPEED_WALK * 0.5) {
          setAnim('walk');
        } else {
          setAnim(chosenIdle);
        }
      }
    }
    
    // Movement animation watchdog: fixes rare sliding when YouTube jank or a one-shot
    // animation leaves the cat moving on an idle frame.
    syncMovementAnimation(false);

    // FIX: During ball_play paw animation, damp velX in physics so the cat doesn't slide
    // This bridges the gap between the 10Hz logic tick and 30Hz physics tick
    if (state === 'ball_play' && animLockTimer > 0 && onGround) {
      velX *= 0.7;
      if (Math.abs(velX) < 8) velX = 0;
    }
  }

  // 
  //  DRAG
  // 
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
    const dtMs = Math.max(1, now - lastCatDragTs);

    if (dtMs <= 140) {
      const instantVX = clampThrowVelocity(((nx - lastCatDragX) / dtMs) * 1000, 1300);
      const instantVY = clampThrowVelocity(((ny - lastCatDragY) / dtMs) * 1000, 1300);
      catDragVX = catDragVX * 0.35 + instantVX * 0.65;
      catDragVY = catDragVY * 0.35 + instantVY * 0.65;
    } else {
      catDragVX *= 0.35;
      catDragVY *= 0.35;
    }

    feetX = nx;
    feetY = ny;
    lastCatDragX = nx;
    lastCatDragY = ny;
    lastCatDragTs = now;
  }

  function updateDragWallLean() {
    const wallProximity = 70;
    if (feetX < wallProximity) {
      const t = Math.min(1, 1 - (feetX / wallProximity));
      globalRot = t * 90;
    } else if (feetX > _vw - wallProximity) {
      const t = Math.min(1, 1 - ((_vw - feetX) / wallProximity));
      globalRot = t * -90;
    } else {
      globalRot = clampThrowVelocity(catDragVX / 32, 16);
    }
  }

  addManagedEventListener(catEl, 'mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    
    // Completely hide speech bubble to prevent sub-pixel artifacts
    if (speechModule && speechModule.hideSpeechBubble) {
      speechModule.hideSpeechBubble();
    }
    
    isDragging = true; 
    catEl.style.cursor = 'grabbing';
    catEl.style.zIndex = '10000005'; // Higher than speech bubble to be safe
    
    dragOffX = e.clientX - feetX; 
    dragOffY = e.clientY - feetY;
    resetCatDragTracking(e.clientX, e.clientY);
    velX = 0; velY = 0; onGround = false; isJumping = false;
    
    if (globalRot !== 0) { 
      globalRot = 0; 
      visualRot = 0; // Reset visual rotation instantly for drag
      applyTransform(); 
    }
    
    catEl.style.opacity = '1';
    setAnimLocked('scared', 99999);  // stay scared whole drag
    state = 'dragged';
  });

  addManagedEventListener(catEl, 'touchstart', e => {
    const t = e.touches[0];
    if (!t) return;
    
    // Completely hide speech bubble to prevent sub-pixel artifacts
    if (speechModule && speechModule.hideSpeechBubble) {
      speechModule.hideSpeechBubble();
    }
    
    isDragging = true; 
    catEl.style.cursor = 'grabbing';
    catEl.style.zIndex = '10000005';
    
    dragOffX = t.clientX - feetX; 
    dragOffY = t.clientY - feetY;
    resetCatDragTracking(t.clientX, t.clientY);
    velX = 0; velY = 0; onGround = false; isJumping = false;
    
    if (globalRot !== 0) { 
      globalRot = 0; 
      visualRot = 0; // Reset visual rotation instantly for drag
      applyTransform(); 
    }
    
    catEl.style.opacity = '1';
    setAnimLocked('scared', 99999);
    state = 'dragged'; 
    e.preventDefault();
  }, { passive: false });

  addManagedEventListener(document, 'mousemove', e => {
    cursorX = e.clientX; cursorY = e.clientY;
    PixelCatRuntime.cursorX = cursorX;
    PixelCatRuntime.cursorY = cursorY;

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
      lastSpiderDragX = nx;
      lastSpiderDragY = ny;
      lastSpiderDragTs = now;
      return;
    }

    if (isDragging) {
      updateCatDragFromPointer(e.clientX, e.clientY);
      updateDragWallLean();
      applyTransform();
      applyPos();
    }
  });
  addManagedEventListener(document, 'touchmove', e => {
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
      lastSpiderDragX = nx;
      lastSpiderDragY = ny;
      lastSpiderDragTs = now;
      return;
    }

    // Companion cat: only handle its own drag (fish/spider/ball already handled above)
    if (isCompanion && !isDragging) return;

    if (isDragging) {
      e.preventDefault();
      updateCatDragFromPointer(touch.clientX, touch.clientY);
      updateDragWallLean();
      applyTransform();
      applyPos();
    }
  }, { passive: false });  // FIX: must be non-passive to allow preventDefault()

  function releaseDraggedFish() {
    if (!draggedFish) return;
    draggedFish.isHeld = false;
    if (draggedFish.el && draggedFish.el.isConnected) draggedFish.el.style.cursor = 'grab';
    draggedFish.vx = Math.max(-450, Math.min(450, draggedFish.vx));
    draggedFish.vy = Math.max(-450, Math.min(450, draggedFish.vy));
    draggedFish.vrot = draggedFish.vx * 0.7;
    draggedFish = null;
  }

  function releaseDraggedBall() {
    if (!draggedBall) return;
    draggedBall.isHeld = false;
    if (draggedBall.el && draggedBall.el.isConnected) draggedBall.el.style.cursor = 'grab';
    draggedBall.vx = Math.max(-800, Math.min(800, draggedBall.vx));
    draggedBall.vy = Math.max(-800, Math.min(800, draggedBall.vy));
    draggedBall.vrot = draggedBall.vx * 2;
    draggedBall = null;
  }

  function releaseDraggedSpider() {
    if (!draggedSpider) return;
    draggedSpider.isHeld = false;
    draggedSpider.heldDirectionTimer = 0; // Reset direction timer
    if (draggedSpider.el && draggedSpider.el.isConnected) draggedSpider.el.style.cursor = 'grab';
    // Clamp velocities to reasonable values
    draggedSpider.vx = Math.max(-600, Math.min(600, draggedSpider.vx));
    draggedSpider.vy = Math.max(-600, Math.min(600, draggedSpider.vy));
    // Spider transitions to jump state after being thrown
    draggedSpider.state = 'jump';
    draggedSpider.stateTimer = 1000 + Math.random() * 500;
    draggedSpider.curFrame = 0;
    draggedSpider.animAccum = 0;
    draggedSpider = null;
  }

  function dropCat() {
    if (!isDragging) return;
    const releaseAge = safeNow() - lastCatDragTs;
    const staleFactor = releaseAge > 180 ? 0.25 : 1;
    let releaseVX = clampThrowVelocity(catDragVX * staleFactor * 0.62, 640);
    let releaseVY = clampThrowVelocity(catDragVY * staleFactor * 0.62, 760);
    if (releaseVY < 0) releaseVY = Math.max(releaseVY, -430);
    const releaseSpeed = Math.hypot(releaseVX, releaseVY);

    isDragging = false; catEl.style.cursor = 'grab';
    animLockTimer = 0;  // clear drag lock
    maybeSpeakAngry();
    
    // Check if dropped near edges and adjust position
    const vw = _vw;
    const vh = _vh;
    const margin = 50;
    const wallSnap = getSideWallMargin() + 50;  // distance from wall to snap for wall-walk
    
    // Clamp to safe zone if too close to edges
    if (feetX < margin) feetX = margin;
    if (feetX > vw - margin) feetX = vw - margin;
    if (feetY < margin) feetY = margin;
    
    // If placed gently near the side, keep the wall-climb shortcut. Fast releases are throws.
    if (releaseSpeed < 180 && feetX < wallSnap) {
      feetX = getWallAttachX('left');
      globalRot = 0;
      go('wall_left');
      return;
    }
    
    if (releaseSpeed < 180 && feetX > vw - wallSnap) {
      feetX = getWallAttachX('right');
      globalRot = 0;
      go('wall_right');
      return;
    }
    
    // Real throw: keep the velocity built up while dragging, like fish/balls do.
    if (globalRot !== 0) { globalRot = 0; applyTransform(); }
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
    setAnim('jump', true);
    state = 'jump'; stateTimer = 3000;
  }
  addManagedEventListener(document, 'mouseup', dropCat);
  addManagedEventListener(document, 'touchend', dropCat);
  addManagedEventListener(document, 'mouseup', () => { if (!isCompanion) { releaseDraggedFish(); releaseDraggedBall(); releaseDraggedSpider(); } });
  addManagedEventListener(document, 'touchend', () => { if (!isCompanion) { releaseDraggedFish(); releaseDraggedBall(); releaseDraggedSpider(); } });

  addManagedEventListener(catEl, 'dblclick', e => {
    e.stopPropagation();
    const nextLoyalMode = !isLoyalMode;
    API.storage.local.set({ loyalMode: nextLoyalMode }); // Sync to popup
    
    // We update local state immediately so celebration triggers instantly
    isLoyalMode = nextLoyalMode;
    
    if (isLoyalMode) {
      // Celebration: little jump + heart
      if (onGround) { velY = JUMP_V * 0.3; onGround = false; isJumping = true; }
      setAnimLocked('paw', 800);
      spawnHeart(feetX, feetY - VIS * sizeMultiplier * 0.5);
      spawnHeart(feetX + 15 * sizeMultiplier, feetY - VIS * sizeMultiplier * 0.6);
      addTimeout(() => {
        if (state !== 'dragged') go('loyal_follow');
      }, 800);
    } else {
      setAnimLocked('scared', 500);
      addTimeout(() => {
        if (state !== 'dragged') go('sit');
      }, 500);
    }
  });

  //  SCROLL REACTION 
  // Cat gets startled by fast scrolling
  let lastScrollY = window.scrollY;
  let scrollAccum = 0;
  addManagedEventListener(document, 'scroll', () => {
    const delta = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    scrollAccum += delta;
  }, { passive: true });

  // Check scroll reaction periodically
  addInterval(() => {
    if (scrollAccum > 900 && !isScrolling && !mutationScanTimeout && !isDragging && state !== 'dragged' && state !== 'stunned') {
      // Fast scroll  reaction
      if (state === 'wall_left' || state === 'wall_right' || state === 'ninja_climb') {
         go('spook');
         velY = 100; // Drop down slightly
         velX = 0;
         onGround = false;
      } else if (Math.random() < 0.4) {
        setAnimLocked('scared', 800);
        state = 'stunned'; stateTimer = 800;
        velX = 0;
      }
    }
    scrollAccum = 0;
  }, 500);

  // Random behavior nudge
  addInterval(() => {
    if (isDragging || state === 'hidden' || state === 'dragged' || state === 'stunned') return;
    if (isLoyalMode || isDeepSleep || isPurring) return;
    if (Math.random() < 0.18) go(null, [state]);
  }, 5000);

  if (!isCompanion) {
    addInterval(() => {
      if (catEnabled && isTabVisible && state !== 'deepsleep') {
        earnXP(1);
      }
    }, 5 * 60 * 1000);

    addInterval(() => {
      if (!catEnabled || !isTabVisible || document.hidden) return;
      const videoEl = document.querySelector('video');
      if (!videoEl || videoEl.paused || videoEl.ended || videoEl.readyState < 2) return;
      recordQuestEvent('watch_seconds', 15);
    }, 15000);
  }

  // Occasional UI interactions (like/dislike/progress prank).
  addInterval(() => {
    if (!isAggressiveMode || !uiMischiefEnabled || !catEnabled) return;
    if (isDragging || state === 'dragged' || state === 'chasefish' || state === 'eatfish' || state === 'deepsleep') return;
    if (Math.random() < (uiMischiefRate / 100)) go('ui_mischief');
  }, 12000);

  //  CURSOR PROXIMITY REACTION 
  // If cursor hovers very close for a while, cat might react
  let cursorNearTimer = 0;
  addInterval(() => {
    if (isDragging || state === 'dragged') return;
    const cdist = Math.hypot(cursorX - feetX, cursorY - feetY);
    if (cdist < 80) {
      cursorNearTimer += 500;
      if (cursorNearTimer > 2000 && state === 'sit') {
        // Cat notices and looks at cursor
        if (Math.random() < 0.3) go('headtilt');
        else if (Math.random() < 0.3) go('pawplay');
        cursorNearTimer = 0;
      }
    } else {
      cursorNearTimer = 0;
    }
  }, 500);

  // 
  //  VIDEO EVENT LISTENERS
  // 
  let attachedVideoEl = null;
  let detachVideoPlayListener = null;
  let detachVideoPauseListener = null;

  function handleVideoPlay() {
    if (typeof updateWatchMemory === 'function') updateWatchMemory(false);
    if ((state === 'sit' || state === 'groom' || state === 'nap') && Math.random() < 0.3) {
      go('watchvideo');
    }
  }

  function handleVideoPause() {
    // Cat looks around when video pauses
    if (state === 'watchvideo' && Math.random() < 0.5) {
      go('headtilt');
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
    const videoEl = document.querySelector('video');
    if (!videoEl || videoEl === attachedVideoEl) return;

    detachVideoListeners();
    attachedVideoEl = videoEl;
    detachVideoPlayListener = addManagedEventListener(videoEl, 'play', handleVideoPlay);
    detachVideoPauseListener = addManagedEventListener(videoEl, 'pause', handleVideoPause);
  }

  function handleUiMouseover(e) {
    if (!isAggressiveMode || !uiMischiefEnabled || !catEnabled) return;
    if (state === 'chasefish' || state === 'dragged' || state === 'deepsleep' || isPurring) return;

    const thumb = e.target.closest('ytd-thumbnail, ytd-rich-grid-media, ytd-compact-video-renderer');
    if (thumb && Math.random() < 0.08) {
      attackEl = thumb;
      go('pounce');
    }
  }

  attachVideoListeners();
  addManagedEventListener(document, 'mouseover', handleUiMouseover, { passive: true });
  addManagedEventListener(document, 'yt-navigate-finish', () => {
    addTimeout(attachVideoListeners, 500);
    addTimeout(() => {
      if (typeof updateWatchMemory === 'function') updateWatchMemory(true);
    }, 1500);
  });

  // 
  //  TAB VISIBILITY
  // 
  addManagedEventListener(document, 'visibilitychange', () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) {
      _scrollTrackY = window.scrollY;
      lastTs = null;
      lastUpdateTs = null;
      animAccum = 0;  // reset anim accumulator to prevent glitch
      scheduleEnvScan(300);
    }
  });

  // 
  // 
  let catEnabled = true;
  let lastUpdateTs = null;
  let lastLogicTs = 0;
  let companionThinkTimer = 0;
  let ACTIVE_FRAME_MS = 1000 / 30;
  let IDLE_FRAME_MS = 1000 / 15;
  // IDLE_STATES moved to top of file (before speech module initialization)

  function applyPowerModeSettings() {
    if (lowPowerMode) {
      ACTIVE_FRAME_MS = 1000 / 24;
      IDLE_FRAME_MS = 1000 / 10;
    } else {
      ACTIVE_FRAME_MS = 1000 / 30;
      IDLE_FRAME_MS = 1000 / 15;
    }
  }

  function isIdleTickState() {
    if (isDragging || isJumping || !onGround) return false;
    if (activeFishes.length > 0 || activeBalls.some(b => !b.onGround || Math.abs(b.vx) > 5)) return false;
    if (targetFish || targetBall) return false;
    return IDLE_STATES.has(state);
  }

  function revealCatWhenReady() {
    let revealed = false;
    const reveal = () => {
      if (revealed || isDestroyed || !catEl.isConnected) return;
      revealed = true;
      catEl.style.visibility = '';
    };
    const img = new Image();
    img.onload = () => addTimeout(reveal, 40);
    img.onerror = reveal;
    img.src = SHEET;
    addTimeout(reveal, 700);
  }

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    if (!catEnabled || !isTabVisible) { lastTs = null; lastUpdateTs = null; return; }
    if (!lastTs) { lastTs = ts; lastUpdateTs = ts; lastLogicTs = ts; return; }

    // CALCULATE DT: keep animation smooth, but let physics catch up after
    // YouTube scroll/content jank so the cat does not fall in slow motion.
    const rawDt = Math.max(0, (ts - lastUpdateTs) / 1000);
    const frameDt = Math.min(0.16, rawDt);
    const dt = Math.min(0.05, frameDt);
    lastUpdateTs = ts;

    if (!isDragging) { 
      // DECISION MAKING: Throttled to 10Hz. Use true logic delta, not frame dt,
      // so state timers do not crawl during normal 30/60fps rendering.
      if (ts - lastLogicTs > 100) {
        const logicDt = Math.min(0.22, Math.max(0.01, (ts - lastLogicTs) / 1000));
        _logicRectCache.clear();
        updateState(logicDt); 
        lastLogicTs = ts;
      }

      const physicsSteps = (!lowPowerMode && frameDt > 0.026) ? Math.min(5, Math.ceil(frameDt / (1 / 60))) : 1;
      const physicsDt = physicsSteps > 1 ? frameDt / physicsSteps : dt;
      for (let step = 0; step < physicsSteps; step++) {
        updatePhysics(physicsDt); 
        updateSmashes(physicsDt);
      }
      syncMovementAnimation(false);
    }

    // ANIMATION & RENDERING: Always run at full refresh rate
    tickAnim(dt);
    applyPos();
    updateWeightFootsteps(dt);

    companionThinkTimer += dt;
    if (PixelCatRuntime.instances.length > 1 && !isDragging && companionThinkTimer >= 0.35) {
      companionThinkTimer = 0;
      const other = PixelCatRuntime.instances.find(c => c !== api);
      if (other) {
         const dx = other.feetX - feetX;
         const dy = other.feetY - feetY;
         const dist = Math.sqrt(dx*dx + dy*dy);
         const isClose = dist < 80;

         // Jump Scare Mechanic
         // If I am idle, and the other cat is falling FAST nearby, I get scared
         if (isIdleTickState() && isClose && other.isJumping && other.velY > 200 && Math.random() < 0.2) {
             facingLeft = dx > 0; // face the falling cat
             applyTransform();
             setAnimLocked('scared', 1000);
             state = 'stunned'; stateTimer = 1000;
         }

         // Idle Proximity Interactions
         if (isIdleTickState() && isClose && other.state !== 'jump' && other.state !== 'stunned' && Math.random() < 0.025) {
             // 10% Mutual scare
             if (Math.random() < 0.1 && other.state !== 'scared') {
                 facingLeft = dx > 0;
                 applyTransform();
                 setAnimLocked('scared', 800);
                 state = 'stunned'; stateTimer = 800;
                 other.go('spook'); // FIX: 'scared' is not a valid state  use 'spook'
             // 25% Paw Fight / Play
             } else if (Math.random() < 0.25) {
                 facingLeft = dx > 0;
                 applyTransform();
                 setAnimLocked('paw', 1500);
                 // 50% chance the other cat swipes back!
                 if (Math.random() < 0.5) {
                     other.facingLeft = !facingLeft;
                     other.go('pawplay');
                 }
             // 40% Face Off (stare at each other)
             } else if (Math.random() < 0.4) {
                 facingLeft = dx > 0;
                 applyTransform();
                 go('headtilt');
             // 25% Mutual Nuzzle/Sleep
             } else if (Math.random() < 0.5) {
                facingLeft = dx > 0;
                applyTransform();
                go('sit');
             }
         } else if (isIdleTickState() && !isClose && dist < 300 && Math.random() < 0.01) {
             // Follow the other cat if they wander away
             if (isCompanion || Math.random() < 0.3) {
                 targetX = other.feetX + (Math.random() < 0.5 ? 40 : -40);
                 go('wander');  // FIX: 'walk' is not a valid state; 'wander' is the correct one
             }
         }
      }
    }
    // Only update fish if there are any or timer is close to spawning (Main Cat Only solves drop-doubling!)
    if (!isCompanion) {
      if (activeFishes.length > 0 || fishSpawnTimer < 1) {
        updateFishes(dt);
      } else {
        fishSpawnTimer -= dt;
      }
      // Update ball
      if (ballEnabled) {
        updateBalls(dt);
      }
      
      // Update portals
      if (portalEnabled) {
        updatePortals(dt);
        
        // Spawn new portal pairs rarely â€” feels like a magical surprise, not a routine event.
        // After first pair, wait 3-8 minutes before spawning another.
        portalSpawnTimer -= dt;
        if (portalSpawnTimer <= 0 && portalModule.activePortals.length < 2) {
          spawnPortalPair();
          // 3-8 minute gap: 180-480 seconds. Weighted toward longer gaps for rarity.
          portalSpawnTimer = 180 + Math.random() * 300;
        }
        
        // Check portal collision and teleport
        if (portalCooldown > 0) {
          portalCooldown -= dt;
        } else {
          const portal = checkCatPortalCollision(feetX, feetY);
          if (portal && !isInPortal) {
            const destination = teleportCat(portal);
            if (destination) {
              // Start teleport sequence
              isInPortal = true;
              const prevState = state;
              const prevVelX = velX;
              const prevVelY = velY;
              
              // Hide cat briefly during teleport
              catEl.style.opacity = '0';
              setAnimLocked('jump', 300);
              
              addTimeout(() => {
                // Teleport cat to destination
                feetX = destination.x;
                feetY = destination.y;
                applyPos();
                
                // Show cat again
                catEl.style.opacity = '1';
                
                // Restore velocity
                velX = prevVelX;
                velY = prevVelY;
                
                // Set cooldown to prevent immediate re-teleport
                portalCooldown = 1.5;
                isInPortal = false;
              }, 300);
            }
          }
        }
      }
      
      if (spiderEnabled || activeSpiders.length > 0 || activeWebs.length > 0) {
        if (!spiderEnabled || activeSpiders.length > 0 || activeWebs.length > 0 || spiderSpawnTimer < 1) {
          updateSpiders(dt);
          if (spiderEnabled && spiderSpawnTimer < 1 && activeSpiders.length < 2) { // Max 2 spiders at once
             spawnSpider();
             // More varied spawn timing: 2-6 minutes
             spiderSpawnTimer = 120 + Math.random() * 240;
          }
        } else {
          spiderSpawnTimer -= dt;
        }
      }
      // Coin drops (main cat only)
      updateCoinDrops(dt);
    }
  }

  // 
  //  BOOT
  // 
  applySkin(catSkinStr);
  pickIdleVariant();
  setAnim('idle1');
  setDir(false);
  applyPos();
  revealCatWhenReady();
  go('sit');
  scheduleIdleChatter(15000 + Math.random() * 30000);
  if (!PixelCatRuntime.instances.includes(api)) {
    PixelCatRuntime.instances.push(api);
  }
  rafId = requestAnimationFrame(loop);

  function applySkin(skin) {
    if (skin === 'orange') catEl.style.filter = 'sepia(1) saturate(8) hue-rotate(-35deg) brightness(0.95) contrast(1.1)';
    else catEl.style.filter = 'none';
  }


} // end spawnPixelCat

const API = typeof browser !== 'undefined' ? browser : chrome;
function getLocal(keys) {
  if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
    return API.storage.local.get(keys);
  }
  return new Promise((resolve) => API.storage.local.get(keys, resolve));
}

getLocal({
  catEnabled: true,
  companionEnabled: false,
  catSkin: 'white',
  spiderEnabled: false,
  ballEnabled: false,
  portalEnabled: false,
  aggressiveMode: true,
  uiMischiefEnabled: false,
  speechEnabled: false,
  memoryEnabled: true,
  rareEventsEnabled: true,
  autoFishSpawnEnabled: false,
  lowPowerMode: false,
  sizeMultiplier: 1.0,
  uiMischiefRate: 11,
  catEnergyLevel: 'active',
  speedMultiplier: 1.0,
  loyalMode: false,
  uiLanguage: 'en',
  catXP: 0,
  shopOwned: [],
  shopActiveBoosts: null
}).then((data) => {
  const xp = Math.min(460, Math.max(0, Number(data.catXP) || 0));
  if (xp < 10)  data.speechEnabled = false;
  if (xp < 10)  data.ballEnabled = false;
  if (xp < 30)  data.spiderEnabled = false;
  if (xp < 60)  data.sizeMultiplier = 1.0;
  if (xp < 100) data.companionEnabled = false;
  if (xp < 150) data.uiMischiefEnabled = false;
  if (xp < 280 && data.catEnergyLevel === 'hyper') data.catEnergyLevel = 'active';
  if (xp < 210) data.portalEnabled = false;

  PixelCatRuntime.instances.slice().forEach((cat) => {
    if (cat && typeof cat.destroy === 'function') {
      try {
        cat.destroy();
      } catch (_) {}
    }
  });
  PixelCatRuntime.instances.length = 0;

  const existingMain = document.getElementById('youtube-pixel-cat-main');
  if (existingMain) existingMain.remove();
  const existingComp = document.getElementById('youtube-pixel-cat-companion');
  if (existingComp) existingComp.remove();
  
  const mainExists = PixelCatRuntime.instances.find(c => !c.isCompanion);
  const companionExists = PixelCatRuntime.instances.find(c => c.isCompanion);
  
  if (data.catEnabled && !mainExists) {
    spawnPixelCat('youtube-pixel-cat-main', false, data.catSkin);
  }
  if (data.companionEnabled && !companionExists) {
    spawnPixelCat('youtube-pixel-cat-companion', true, data.catSkin === 'white' ? 'orange' : 'white');
  }
  
  // Apply all settings immediately after spawning
  PixelCatRuntime.instances.forEach(cat => {
    if (cat.updateSettings) {
      cat.updateSettings(data);
    }
  });
});

function clampRuntimeNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeLevelLockedSettings(data) {
  const xp = Math.min(460, Math.max(0, Number(data.catXP) || 0));
  if (xp < 10)  data.speechEnabled = false;
  if (xp < 10)  data.ballEnabled = false;
  if (xp < 30)  data.spiderEnabled = false;
  if (xp < 60)  data.sizeMultiplier = 1.0;
  if (xp < 100) data.companionEnabled = false;
  if (xp < 150) data.uiMischiefEnabled = false;
  if (xp < 210) data.portalEnabled = false;
  if (xp < 280 && data.catEnergyLevel === 'hyper') data.catEnergyLevel = 'active';
  return data;
}

function sanitizeRuntimeSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null;
  const clean = {};
  const boolKeys = [
    'loyalMode',
    'aggressiveMode',
    'uiMischiefEnabled',
    'speechEnabled',
    'memoryEnabled',
    'rareEventsEnabled',
    'autoFishSpawnEnabled',
    'ballEnabled',
    'spiderEnabled',
    'portalEnabled',
    'lowPowerMode',
    'hideInFullscreen'
  ];
  boolKeys.forEach((key) => {
    if (typeof settings[key] === 'boolean') clean[key] = settings[key];
  });
  if ('speedMultiplier' in settings) clean.speedMultiplier = clampRuntimeNumber(settings.speedMultiplier, 0.5, 2.5, 1.0);
  if ('sizeMultiplier' in settings) clean.sizeMultiplier = clampRuntimeNumber(settings.sizeMultiplier, 0.5, 2.5, 1.0);
  if ('uiMischiefRate' in settings) clean.uiMischiefRate = Math.round(clampRuntimeNumber(settings.uiMischiefRate, 0, 100, 11));
  if (['sleepy', 'active', 'hyper'].includes(settings.catEnergyLevel)) clean.catEnergyLevel = settings.catEnergyLevel;
  if (['en', 'fr', 'ar'].includes(settings.uiLanguage)) clean.uiLanguage = settings.uiLanguage;
  if (['white', 'orange'].includes(settings.catSkin)) clean.catSkin = settings.catSkin;
  if (typeof settings.activeBall === 'string' && /^ball_[a-z0-9_]{1,40}$/.test(settings.activeBall)) clean.activeBall = settings.activeBall;
  if (typeof settings.shopEffect === 'string' && /^[a-z0-9_]{1,40}$/.test(settings.shopEffect)) clean.shopEffect = settings.shopEffect;
  if (Array.isArray(settings.shopOwned)) {
    clean.shopOwned = settings.shopOwned
      .filter((id) => typeof id === 'string' && /^[a-z0-9_]{1,40}$/.test(id))
      .slice(0, 50);
  }
  if (Array.isArray(settings.shopActiveBoosts)) {
    clean.shopActiveBoosts = settings.shopActiveBoosts
      .filter((id) => typeof id === 'string' && /^[a-z0-9_]{1,40}$/.test(id))
      .slice(0, 50);
  }
  return Object.keys(clean).length ? clean : null;
}

API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object' || typeof msg.action !== 'string') {
    sendResponse({ success: false });
    return;
  }

  if (msg.action === 'toggleCat') {
    const main = PixelCatRuntime.instances.find(c => !c.isCompanion);
    if (main) {
      main.destroy();
      const mainEl = document.getElementById('youtube-pixel-cat-main');
      if (mainEl) mainEl.remove();
      sendResponse({ success: true, action: 'destroyed' });
    } else {
      getLocal({ catSkin: 'white', speechEnabled: false, sizeMultiplier: 1.0, catXP: 0, shopOwned: [], shopActiveBoosts: null, uiLanguage: 'en' }).then(data => {
        data = sanitizeLevelLockedSettings(data);
        spawnPixelCat('youtube-pixel-cat-main', false, data.catSkin || 'white');
        const spawned = PixelCatRuntime.instances.find(c => !c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true, action: 'spawned' });
      });
      return true;
    }
  } else if (msg.action === 'toggleCompanion') {
    const comp = PixelCatRuntime.instances.find(c => c.isCompanion);
    if (comp) {
      comp.destroy();
      const companionEl = document.getElementById('youtube-pixel-cat-companion');
      if (companionEl) companionEl.remove();
      sendResponse({ success: true, action: 'destroyed' });
    } else {
      getLocal({ catSkin: 'white', speechEnabled: false, sizeMultiplier: 1.0, catXP: 0, shopOwned: [], shopActiveBoosts: null, uiLanguage: 'en' }).then(data => {
        data = sanitizeLevelLockedSettings(data);
        spawnPixelCat('youtube-pixel-cat-companion', true, data.catSkin === 'white' ? 'orange' : 'white');
        const spawned = PixelCatRuntime.instances.find(c => c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true, action: 'spawned' });
      });
      return true;
    }
  } else if (msg.action === 'startCat') {
    const existing = PixelCatRuntime.instances.find(c => !c.isCompanion);
    if (!existing) {
      getLocal({ catSkin: 'white', speechEnabled: false, sizeMultiplier: 1.0, catXP: 0, shopOwned: [], shopActiveBoosts: null, uiLanguage: 'en' }).then(data => {
        data = sanitizeLevelLockedSettings(data);
        spawnPixelCat('youtube-pixel-cat-main', false, data.catSkin || 'white');
        const spawned = PixelCatRuntime.instances.find(c => !c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true });
      });
      return true;
    }
    sendResponse({ success: true, alreadyExists: true });
  } else if (msg.action === 'stopCat') {
    const main = PixelCatRuntime.instances.find(c => !c.isCompanion);
    if (main) main.destroy();
    const mainEl = document.getElementById('youtube-pixel-cat-main');
    if (mainEl) mainEl.remove();
    sendResponse({ success: true });
  } else if (msg.action === 'startCompanion') {
    const existing = PixelCatRuntime.instances.find(c => c.isCompanion);
    if (!existing) {
      getLocal({ catSkin: 'white', speechEnabled: false, sizeMultiplier: 1.0, catXP: 0, shopOwned: [], shopActiveBoosts: null, uiLanguage: 'en' }).then(data => {
        data = sanitizeLevelLockedSettings(data);
        spawnPixelCat('youtube-pixel-cat-companion', true, data.catSkin === 'white' ? 'orange' : 'white');
        const spawned = PixelCatRuntime.instances.find(c => c.isCompanion);
        if (spawned && spawned.updateSettings) spawned.updateSettings(data);
        sendResponse({ success: true });
      });
      return true;
    }
    sendResponse({ success: true, alreadyExists: true });
  } else if (msg.action === 'stopCompanion') {
    const comp = PixelCatRuntime.instances.find(c => c.isCompanion);
    if (comp) comp.destroy();
    const companionEl = document.getElementById('youtube-pixel-cat-companion');
    if (companionEl) companionEl.remove();
    sendResponse({ success: true });
  } else if (msg.action === 'updateSettings') {
    const safeSettings = sanitizeRuntimeSettings(msg.settings);
    if (safeSettings) {
      PixelCatRuntime.instances.forEach(cat => {
        if (cat.updateSettings) {
          cat.updateSettings(safeSettings);
        }
      });
    }
    sendResponse({ success: true });
  } else if (msg.action === 'clearSpeechMemory') {
    PixelCatRuntime.instances.forEach(cat => {
      if (cat.clearSpeechMemory) {
        cat.clearSpeechMemory();
      }
    });
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false });
  }
  
  return false;
});

