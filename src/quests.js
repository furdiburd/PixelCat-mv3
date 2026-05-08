(function(global) {
  'use strict';

  const STORAGE_KEY = 'dailyQuestState';
  const STATS_KEY = 'dailyQuestStats';
  const QUEST_VERSION = 1;

  // minXP: quest only enters the pool once catXP >= this value
  const QUEST_DEFINITIONS = [
    //  Always available 
    {
      type: 'pet_sessions',
      icon: 'care',
      title: 'Pet the Cat',
      minXP: 0,
      targets: [1, 2, 3],
      description: (t) => `Complete ${t} pet session${t === 1 ? '' : 's'}.`
    },
    {
      type: 'fish_served',
      icon: 'treat',
      title: 'Give Fish',
      minXP: 0,
      targets: [1, 2, 3],
      description: (t) => `Give ${t} fish treat${t === 1 ? '' : 's'}.`
    },
    {
      type: 'watch_seconds',
      icon: 'playback',
      title: 'Watch Together',
      minXP: 0,
      targets: [60, 120, 180],
      description: (t) => `Stay active for ${formatDuration(t)}.`
    },
    {
      type: 'coins_collected',
      icon: 'coin',
      title: 'Collect Coins',
      minXP: 0,
      targets: [3, 5, 8],
      description: (t) => `Collect ${t} coin drop${t === 1 ? '' : 's'}.`
    },
    //  Unlocked at XP 10 (ball) 
    {
      type: 'ball_catches',
      icon: 'ball',
      title: 'Play Fetch',
      minXP: 10,
      targets: [2, 4, 6],
      description: (t) => `Cat catches ${t} ball${t === 1 ? '' : 's'}.`
    },
    //  Unlocked at XP 25 (spider) 
    {
      type: 'spiders_caught',
      icon: 'shield',
      title: 'Catch Spiders',
      minXP: 25,
      targets: [1, 2, 3],
      description: (t) => `Catch ${t} spider${t === 1 ? '' : 's'}.`
    },
    //  Unlocked at XP 70 (companion) 
    {
      type: 'pet_sessions',
      icon: 'care',
      title: 'Double Affection',
      minXP: 70,
      targets: [4, 5],
      description: (t) => `Complete ${t} pet sessions in one day.`
    },
    //  Unlocked at XP 100 (mischief/fish) 
    {
      type: 'fish_served',
      icon: 'treat',
      title: 'Fish Feast',
      minXP: 100,
      targets: [4, 5],
      description: (t) => `Feed ${t} fish treats in one day.`
    },
    {
      type: 'watch_seconds',
      icon: 'playback',
      title: 'Long Session',
      minXP: 100,
      targets: [300, 600],
      description: (t) => `Stay active for ${formatDuration(t)}.`
    },
  ];

  function localGet(storageArea, defaults) {
    try {
      const result = storageArea.get(defaults);
      if (result && typeof result.then === 'function') return result;
    } catch (e) { return Promise.reject(e); }
    return new Promise((resolve) => storageArea.get(defaults, resolve));
  }

  function localSet(storageArea, values) {
    try {
      const result = storageArea.set(values);
      if (result && typeof result.then === 'function') return result;
    } catch (e) { return Promise.reject(e); }
    return new Promise((resolve) => storageArea.set(values, resolve));
  }

  function clampInteger(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function getDateKey(date) {
    const source = date || new Date();
    return `${source.getFullYear()}-${String(source.getMonth()+1).padStart(2,'0')}-${String(source.getDate()).padStart(2,'0')}`;
  }

  function seedFromString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function() {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(values, random) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }

  function normalizeStats(rawStats) {
    const stats = rawStats && typeof rawStats === 'object' ? rawStats : {};
    return {
      lifetimeCompleted:     clampInteger(stats.lifetimeCompleted),
      lifetimeSpidersCaught: clampInteger(stats.lifetimeSpidersCaught),
      lifetimePets:          clampInteger(stats.lifetimePets),
      lifetimeFish:          clampInteger(stats.lifetimeFish),
      lifetimeCoins:         clampInteger(stats.lifetimeCoins),
      lifetimeBallCatches:   clampInteger(stats.lifetimeBallCatches),
      perfectDays:           clampInteger(stats.perfectDays),
      lastPerfectDate:       typeof stats.lastPerfectDate === 'string' ? stats.lastPerfectDate : ''
    };
  }

  function getDefinition(type) {
    return QUEST_DEFINITIONS.find((d) => d.type === type) || null;
  }

  // Generate today's quests filtered by current XP level
  function generateState(dateKey, catXP) {
    const xp = Math.max(0, catXP || 0);
    const random = mulberry32(seedFromString(`pixelcat:${dateKey}:quests`));

    // Only pool quests whose minXP <= current XP
    const pool = QUEST_DEFINITIONS.filter(d => xp >= d.minXP);
    const chosen = shuffle(pool, random).slice(0, 3);

    return {
      version: QUEST_VERSION,
      dateKey,
      quests: chosen.map((definition, index) => {
        const target = definition.targets[Math.floor(random() * definition.targets.length)];
        return {
          id: `${dateKey}:${definition.type}:${index}`,
          type: definition.type,
          target,
          progress: 0,
          completed: false
        };
      })
    };
  }

  function normalizeQuest(quest) {
    const definition = getDefinition(quest && quest.type);
    if (!definition) return null;
    const target = clampInteger(quest.target) || definition.targets[0];
    const progress = Math.min(target, clampInteger(quest.progress));
    return {
      id: typeof quest.id === 'string' ? quest.id : `${definition.type}:${target}`,
      type: definition.type,
      target,
      progress,
      completed: Boolean(quest.completed) || progress >= target
    };
  }

  function ensureState(rawState, dateKey, catXP) {
    const normalizedDateKey = dateKey || getDateKey();
    const state = rawState && typeof rawState === 'object' ? rawState : null;

    if (!state || state.version !== QUEST_VERSION || state.dateKey !== normalizedDateKey || !Array.isArray(state.quests)) {
      return { state: generateState(normalizedDateKey, catXP), changed: true };
    }

    const quests = state.quests.map(normalizeQuest).filter(Boolean);
    const changed = quests.length !== state.quests.length || quests.some((quest, index) => {
      const original = state.quests[index];
      return !original || quest.id !== original.id || quest.progress !== original.progress ||
             quest.completed !== original.completed || quest.target !== original.target;
    });

    return { state: { version: QUEST_VERSION, dateKey: normalizedDateKey, quests }, changed };
  }

  function formatDuration(seconds) {
    const s = clampInteger(seconds);
    if (s >= 60) {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return r === 0 ? `${m} min` : `${m} min ${String(r).padStart(2,'0')} sec`;
    }
    return `${s} sec`;
  }

  function formatQuestProgress(quest) {
    if (quest.type === 'watch_seconds') {
      return `${formatDuration(quest.progress)} / ${formatDuration(quest.target)}`;
    }
    return `${quest.progress} / ${quest.target}`;
  }

  function buildSnapshot(state, stats) {
    const quests = state.quests.map((quest) => {
      const definition = getDefinition(quest.type);
      return {
        id: quest.id,
        type: quest.type,
        icon: definition ? definition.icon : 'care',
        title: definition ? definition.title : quest.type,
        description: definition ? definition.description(quest.target) : '',
        target: quest.target,
        progress: quest.progress,
        completed: quest.completed,
        progressLabel: formatQuestProgress(quest)
      };
    });

    const completedCount = quests.filter((q) => q.completed).length;
    const totalCount = quests.length;
    return {
      storageKey: STORAGE_KEY,
      dateKey: state.dateKey,
      quests,
      completedCount,
      totalCount,
      allComplete: totalCount > 0 && completedCount === totalCount,
      stats,
      secondsUntilReset: getSecondsUntilReset()
    };
  }

  function getSecondsUntilReset(now) {
    const current = now || new Date();
    const next = new Date(current);
    next.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((next.getTime() - current.getTime()) / 1000));
  }

  async function getSnapshot(storageArea) {
    const data = await localGet(storageArea, { [STORAGE_KEY]: null, [STATS_KEY]: null, catXP: 0 });
    const ensured = ensureState(data[STORAGE_KEY], getDateKey(), data.catXP || 0);
    const stats = normalizeStats(data[STATS_KEY]);
    if (ensured.changed) {
      await localSet(storageArea, { [STORAGE_KEY]: ensured.state, [STATS_KEY]: stats });
    }
    return buildSnapshot(ensured.state, stats);
  }

  let recordEventQueue = Promise.resolve();

  function recordEvent(storageArea, type, amount) {
    recordEventQueue = recordEventQueue.catch(() => {}).then(() => recordEventNow(storageArea, type, amount));
    return recordEventQueue;
  }

  async function recordEventNow(storageArea, type, amount) {
    const increment = Math.max(0, Number(amount) || 0);
    if (!increment) return getSnapshot(storageArea);

    const data = await localGet(storageArea, { [STORAGE_KEY]: null, [STATS_KEY]: null, catXP: 0 });
    const ensured = ensureState(data[STORAGE_KEY], getDateKey(), data.catXP || 0);
    const state = ensured.state;
    const stats = normalizeStats(data[STATS_KEY]);
    let stateChanged = ensured.changed;
    let statsChanged = false;
    let questsJustCompleted = 0;
    let perfectDayJustUnlocked = false;

    if (type === 'spiders_caught')  { stats.lifetimeSpidersCaught += increment; statsChanged = true; }
    if (type === 'pet_sessions')    { stats.lifetimePets += increment; statsChanged = true; }
    if (type === 'fish_served')     { stats.lifetimeFish += increment; statsChanged = true; }
    if (type === 'coins_collected') { stats.lifetimeCoins += increment; statsChanged = true; }
    if (type === 'ball_catches')    { stats.lifetimeBallCatches += increment; statsChanged = true; }

    state.quests.forEach((quest) => {
      if (quest.type !== type || quest.completed) return;
      const nextProgress = Math.min(quest.target, quest.progress + increment);
      if (nextProgress !== quest.progress) {
        quest.progress = nextProgress;
        stateChanged = true;
      }
      if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        stats.lifetimeCompleted += 1;
        questsJustCompleted += 1;
        stateChanged = true;
        statsChanged = true;
      }
    });

    if (state.quests.length > 0 && state.quests.every((q) => q.completed) && stats.lastPerfectDate !== state.dateKey) {
      stats.perfectDays += 1;
      stats.lastPerfectDate = state.dateKey;
      perfectDayJustUnlocked = true;
      statsChanged = true;
    }

    if (stateChanged || statsChanged) {
      await localSet(storageArea, { [STORAGE_KEY]: state, [STATS_KEY]: stats });
    }

    const snapshot = buildSnapshot(state, stats);
    snapshot.questsJustCompleted = questsJustCompleted;
    snapshot.perfectDayJustUnlocked = perfectDayJustUnlocked;
    return snapshot;
  }

  global.PixelCatQuests = {
    STORAGE_KEY,
    STATS_KEY,
    QUEST_DEFINITIONS,
    formatDuration,
    getDateKey,
    getSecondsUntilReset,
    getSnapshot,
    getDefinition,
    recordEvent
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
