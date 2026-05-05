(function() {
  const API = typeof browser !== 'undefined' ? browser : chrome;
  const QuestEngine = globalThis.PixelCatQuests || null;

  const defaultSettings = {
    catEnabled: true,
    companionEnabled: false,
    loyalMode: false,
    aggressiveMode: true,
    speedMultiplier: 1.0,
    catSkin: 'white',
    uiMischiefEnabled: false,
    speechEnabled: false,
    memoryEnabled: true,
    rareEventsEnabled: true,
    autoFishSpawnEnabled: false,
    lowPowerMode: false,
    hideInFullscreen: false,
    sizeMultiplier: 1.0,
    uiMischiefRate: 11,
    catEnergyLevel: 'active',
    ballEnabled: false,
    spiderEnabled: false,
    portalEnabled: false,
    catXP: 0,
    coins: 0,
    shopOwned: [],
    shopActiveBoosts: null,
    dailyStreak: 0,
    lastStreakDate: '',
    activeBall: 'ball_baseball',
    uiLanguage: 'en'
  };

  const TRANSLATIONS = {
    en: {
      coins: 'Coins', xpHint: 'Feed fish or play ball to earn XP',
      dailyBonusReady: 'Daily Bonus Ready!', tapToClaim: 'Tap to claim your coins', claim: 'Claim',
      level4needed: 'Level 4 needed', companion: 'Companion', loyalMode: 'Loyal Mode', catSkin: 'Cat Skin',
      quests: 'Quests', achievements: 'Achievements', dailyQuests: 'Daily Quests',
      energyLevel: 'Energy Level', affectsSpeed: 'Affects movement speed',
      sleepy: 'Sleepy', active: 'Active', autoSpawn: 'Auto Spawn', aggressiveMode: 'Aggressive Mode',
      basic: 'Basic', advanced: 'Advanced', danger: 'Danger', speed: 'Speed',
      requiresLevel2: 'Requires Level 2', speechBubbles: 'Speech Bubbles', smartMemory: 'Smart Memory',
      hideFullscreen: 'Hide in Fullscreen', language: 'Language', lowPowerMode: 'Low Power Mode',
      level5needed: 'Level 5 needed', pageMischief: 'Page Mischief', rareEvents: 'Rare Events',
      requiresLevel5: 'Requires Level 5', mischiefRate: 'Mischief Rate',
      size: 'Size', sizeWarning: 'This might cause unexpected behavior',
      clearMemory: 'Clear Memory', resetProgress: 'Reset Progress',
      balls: 'Balls', boosts: 'Boosts',
    },
    fr: {
      coins: 'Pièces', xpHint: 'Nourrissez le chat ou jouez pour gagner de l\'XP',
      dailyBonusReady: 'Bonus quotidien prêt !', tapToClaim: 'Appuyez pour réclamer vos pièces', claim: 'Réclamer',
      level4needed: 'Niveau 4 requis', companion: 'Compagnon', loyalMode: 'Mode Loyal', catSkin: 'Apparence',
      quests: 'Quêtes', achievements: 'Succès', dailyQuests: 'Quêtes du jour',
      energyLevel: 'Niveau d\'énergie', affectsSpeed: 'Affecte la vitesse de déplacement',
      sleepy: 'Somnolent', active: 'Actif', autoSpawn: 'Invocation auto', aggressiveMode: 'Mode agressif',
      basic: 'Basique', advanced: 'Avancé', danger: 'Danger', speed: 'Vitesse',
      requiresLevel2: 'Niveau 2 requis', speechBubbles: 'Bulles de dialogue', smartMemory: 'Mémoire intelligente',
      hideFullscreen: 'Masquer en plein écran', language: 'Langue', lowPowerMode: 'Mode économie d\'énergie',
      level5needed: 'Niveau 5 requis', pageMischief: 'Espièglerie de page', rareEvents: 'Événements rares',
      requiresLevel5: 'Niveau 5 requis', mischiefRate: 'Taux de bêtises',
      size: 'Taille', sizeWarning: 'Risque de bug',
      clearMemory: 'Effacer la mémoire', resetProgress: 'Réinitialiser la progression',
      balls: 'Balles', boosts: 'Boosts',
    },
    ar: {
      coins: 'عملات', xpHint: 'أطعم القطة أو العب لكسب نقاط الخبرة',
      dailyBonusReady: 'المكافأة اليومية جاهزة!', tapToClaim: 'اضغط للمطالبة بعملاتك', claim: 'اطلب',
      level4needed: 'المستوى 4 مطلوب', companion: 'رفيق', loyalMode: 'الوضع الوفي', catSkin: 'مظهر القطة',
      quests: 'مهام', achievements: 'إنجازات', dailyQuests: 'المهام اليومية',
      energyLevel: 'مستوى الطاقة', affectsSpeed: 'يؤثر على سرعة الحركة',
      sleepy: 'نعسان', active: 'نشيط', autoSpawn: 'إنتاج تلقائي', aggressiveMode: 'الوضع العدواني',
      basic: 'أساسي', advanced: 'متقدم', danger: 'خطر', speed: 'السرعة',
      requiresLevel2: 'يتطلب المستوى 2', speechBubbles: 'فقاعات الكلام', smartMemory: 'الذاكرة الذكية',
      hideFullscreen: 'إخفاء عند ملء الشاشة', language: 'اللغة', lowPowerMode: 'وضع توفير الطاقة',
      level5needed: 'المستوى 5 مطلوب', pageMischief: 'شقاوة الصفحة', rareEvents: 'أحداث نادرة',
      requiresLevel5: 'يتطلب المستوى 5', mischiefRate: 'معدل الشقاوة',
      size: 'الحجم', sizeWarning: 'قد يسبب خللاً',
      clearMemory: 'مسح الذاكرة', resetProgress: 'إعادة تعيين التقدم',
      balls: 'كرات', boosts: 'مُعززات',
    }
  };

  const I18N_EXTRA = {
    en: {
      disabled: 'Disabled', fish: 'Fish', ball: 'Ball', spider: 'Spider', portal: 'Portal', hyper: 'Hyper',
      about: 'About', stats: 'Stats', unavailable: 'Unavailable', objectivesUnavailable: 'Objectives are unavailable in this session.',
      remaining: '{time} remaining', streak: 'Streak: {count}', complete: 'Complete',
      allObjectivesComplete: 'All objectives complete. {count} finished overall.',
      remainingToday: '{remaining} remaining today. {count} finished overall.',
      level: 'Level {level}', xpProgress: '{current} / {needed} XP', requires: 'Requires {level}',
      unlockSpeechBall: 'Reach Level 2 to unlock Speech & Ball', unlockSpiders: 'Reach Level 3 to unlock Spiders',
      unlockCompanion: 'Reach Level 5 to unlock Companion Cat', unlockSize: 'Reach Level 4 to unlock Size Scaling',
      unlockMischief: 'Reach Level 6 to unlock Page Mischief', unlockPortals: 'Reach Level 7 to unlock Portals',
      unlockHyper: 'Reach Level 8 to unlock Hyper Energy', level9Hint: 'Level 9 - Almost a master companion!',
      level10Hint: 'Level 10 - Max level reached!', maxLevel: 'Max Level! All features unlocked.',
      showSkillsTree: 'Show Skills Tree', hideSkillsTree: 'Hide Skills Tree',
      aboutPixelCatTitle: 'What is PixelCat?', aboutPixelCatBody: 'A pixel pet for YouTube, made by IMAD. It roams, plays, and grows as you watch videos.',
      aboutLevelsTitle: 'How levels work', aboutLevelsBody: 'Earn XP by petting, feeding, and playing. Level up to unlock new features.',
      aboutCoinsTitle: 'Earning coins', aboutCoinsBody: 'Coins drop during play. Click them to collect! Get daily bonuses by opening the popup.',
      aboutQuestsTitle: 'Daily quests', aboutQuestsBody: 'Complete 3 tasks every day to earn rewards and keep your streak going.',
      aboutAchievementsTitle: 'Achievements', aboutAchievementsBody: 'Earn badges for special milestones, like your first pet or catching many spiders.',
      aboutSpawningTitle: 'Spawning items', aboutSpawningBody: 'Use Auto Spawn to drop fish, balls, or spiders for your cat to play with.',
      aboutShopTitle: 'Shop & boosts', aboutShopBody: 'Use coins to buy new ball skins and permanent boosts that help you earn more.',
      aboutTipsTitle: 'Tips & tricks', aboutTipsBody: 'Pet your cat after it eats for a bonus. Use Loyal Mode to make it follow your mouse.',
      supportPixelCat: 'Support PixelCat', supportKoFi: 'Support PixelCat on Ko-fi',
      statFishEaten: 'Fish Eaten', statSpidersCaught: 'Spiders Caught', statPetSessions: 'Pet Sessions',
      statCoinsCollected: 'Coins Collected', statBallCatches: 'Ball Catches', statQuestsDone: 'Quests Done',
      statPerfectDays: 'Perfect Days', statDailyStreak: 'Daily Streak',
      skillsTree: 'Skills Tree', dragTree: 'Drag the tree to explore', basicInstincts: 'Basic Instincts',
      core: 'Core', speechBubble: 'Speech Bubble', fishHunt: 'Fish Hunt', wallNinja: 'Wall Ninja',
      sizeWeight: 'Size & Weight', petBond: 'Pet Bond', ballChaser: 'Ball Chaser', spiderHunter: 'Spider Hunter',
      companionMode: 'Companion Mode', portalTraveler: 'Portal Traveler', hyperEnergy: 'Hyper Energy', madeBy: 'Made by',
      firstFriend: 'First Friend', hundredPets: '100 Pets', sevenDayStreak: '7 Day Streak', masterMischief: 'Master of Mischief',
      buyCoins: '{price} coins', activeItem: 'Active', setActive: 'Set Active', enable: 'Enable', disable: 'Disable',
      claimCoinsToday: 'Claim +{count} coins today', coinsAmount: '+{count} coins',
      ballBaseball: 'Baseball', ballTennis: 'Tennis Ball', ballGolf: 'Golf Ball', ballBasketball: 'Basketball',
      ballFootball: 'Football', ballVolleyball: 'Volleyball', ballBowling: 'Bowling Ball',
      boostFeather: 'Feather Wand', boostFeatherDesc: '+2 coins per pet', boostTreat: 'Golden Treat',
      boostTreatDesc: 'Double fish coins', boostMagnet: 'Coin Magnet', boostMagnetDesc: 'Pulls nearby coins to the cat',
      boostLucky: 'Lucky Charm', boostLuckyDesc: 'More frequent drops',
      questPet: 'Pet the Cat', questFish: 'Give Fish', questWatch: 'Watch Together', questCoins: 'Collect Coins',
      questFetch: 'Play Fetch', questSpiders: 'Catch Spiders', questDoubleAffection: 'Double Affection',
      questFishFeast: 'Fish Feast', questLongSession: 'Long Session',
      confirm: 'Confirm', cancel: 'Cancel', openInfo: 'Open info'
    },
    fr: {
      coins: 'Pièces', xpHint: 'Poisson ou balle = XP',
      active: 'Actif', disabled: 'Désactivé', autoSpawn: 'Apparition auto', boosts: 'Bonus',
      fish: 'Poisson', ball: 'Balle', spider: 'Araignée', portal: 'Portail', hyper: 'Hyper',
      about: 'À propos', stats: 'Stats', unavailable: 'Indisponible', objectivesUnavailable: 'Objectifs indisponibles.',
      remaining: '{time} restantes', streak: 'Série : {count}', complete: 'Terminé',
      allObjectivesComplete: 'Tout est fini. Total : {count}.',
      remainingToday: '{remaining} restants. Total : {count}.',
      level: 'Niveau {level}', xpProgress: '{current} / {needed} XP', requires: '{level} requis',
      unlockSpeechBall: 'Niv. 2 : dialogue et balle', unlockSpiders: 'Niv. 3 : araignées',
      unlockCompanion: 'Niv. 5 : compagnon', unlockSize: 'Niv. 4 : taille',
      unlockMischief: 'Niv. 6 : bêtises', unlockPortals: 'Niv. 7 : portails',
      unlockHyper: 'Niv. 8 : hyper', level9Hint: 'Niv. 9 : presque maître !',
      level10Hint: 'Niv. 10 : défi final !', maxLevel: 'Niveau max ! Tout débloqué.',
      showSkillsTree: 'Afficher l’arbre', hideSkillsTree: 'Masquer l’arbre',
      aboutPixelCatTitle: 'Qu’est-ce que PixelCat ?', aboutPixelCatBody: 'Un chat pixel pour YouTube, créé par IMAD.',
      aboutLevelsTitle: 'Niveaux', aboutLevelsBody: 'Gagnez de l’XP pour débloquer des fonctions.',
      aboutCoinsTitle: 'Pièces', aboutCoinsBody: 'Cliquez les pièces et prenez le bonus du jour.',
      aboutQuestsTitle: 'Quêtes du jour', aboutQuestsBody: 'Terminez 3 tâches pour garder votre série.',
      aboutAchievementsTitle: 'Succès', aboutAchievementsBody: 'Des badges pour les grands moments.',
      aboutSpawningTitle: 'Apparitions', aboutSpawningBody: 'Ajoutez poissons, balles ou araignées.',
      aboutShopTitle: 'Boutique', aboutShopBody: 'Achetez des balles et bonus permanents.',
      aboutTipsTitle: 'Astuces', aboutTipsBody: 'Caressez après un repas pour un bonus.',
      supportPixelCat: 'Soutenir PixelCat', supportKoFi: 'Soutenir le développement sur Ko-fi',
      statFishEaten: 'Poissons mangés', statSpidersCaught: 'Araignées attrapées', statPetSessions: 'Câlins',
      statCoinsCollected: 'Pièces collectées', statBallCatches: 'Balles attrapées', statQuestsDone: 'Quêtes faites',
      statPerfectDays: 'Jours parfaits', statDailyStreak: 'Série quotidienne',
      skillsTree: 'Arbre des talents', dragTree: 'Faites glisser pour explorer', basicInstincts: 'Instincts de base',
      core: 'Base', speechBubble: 'Bulle de dialogue', fishHunt: 'Chasse au poisson', wallNinja: 'Ninja mural',
      sizeWeight: 'Taille et poids', petBond: 'Lien affectif', ballChaser: 'Chasseur de balle', spiderHunter: 'Chasseur d’araignées',
      companionMode: 'Mode compagnon', portalTraveler: 'Voyageur de portails', hyperEnergy: 'Énergie hyper', madeBy: 'Créé par',
      firstFriend: 'Premier ami', hundredPets: '100 caresses', sevenDayStreak: 'Série de 7 jours', masterMischief: 'Maître des bêtises',
      buyCoins: '{price} pièces', activeItem: 'Actif', setActive: 'Activer', enable: 'Activer', disable: 'Désactiver',
      claimCoinsToday: '+{count} pièces aujourd’hui', coinsAmount: '+{count} pièces',
      ballBaseball: 'Balle de baseball', ballTennis: 'Balle de tennis', ballGolf: 'Balle de golf', ballBasketball: 'Ballon de basket',
      ballFootball: 'Ballon de football', ballVolleyball: 'Ballon de volley', ballBowling: 'Boule de bowling',
      boostFeather: 'Baguette plume', boostFeatherDesc: '+2 pièces par caresse', boostTreat: 'Friandise dorée',
      boostTreatDesc: 'Pièces poisson x2', boostMagnet: 'Aimant à pièces', boostMagnetDesc: 'Attire les pièces',
      boostLucky: 'Porte-bonheur', boostLuckyDesc: 'Butins fréquents',
      questPet: 'Caresser le chat', questFish: 'Donner du poisson', questWatch: 'Regarder ensemble', questCoins: 'Collecter des pièces',
      questFetch: 'Jouer à rapporter', questSpiders: 'Attraper des araignées', questDoubleAffection: 'Double affection',
      questFishFeast: 'Festin de poisson', questLongSession: 'Longue session',
      confirm: 'Confirmer', cancel: 'Annuler', openInfo: 'Ouvrir les infos'
    },
    ar: {
      coins: 'عملات', xpHint: 'أطعم السمك أو العب بالكرة لكسب الخبرة',
      active: 'نشط', disabled: 'متوقف', autoSpawn: 'ظهور تلقائي', boosts: 'تعزيزات',
      fish: 'سمك', ball: 'كرة', spider: 'عنكبوت', portal: 'بوابة', hyper: 'فائق',
      about: 'حول', stats: 'الإحصائيات', unavailable: 'غير متاح', objectivesUnavailable: 'الأهداف غير متاحة.',
      remaining: 'متبقٍ {time}', streak: 'السلسلة: {count}', complete: 'مكتمل',
      allObjectivesComplete: 'اكتملت كلها. المجموع: {count}.',
      remainingToday: 'متبقٍ: {remaining}. المجموع: {count}.',
      level: 'المستوى {level}', xpProgress: '{current} / {needed} خبرة', requires: 'يتطلب {level}',
      unlockSpeechBall: 'مستوى 2: الكلام والكرة', unlockSpiders: 'مستوى 3: العناكب',
      unlockCompanion: 'مستوى 5: الرفيق', unlockSize: 'مستوى 4: الحجم',
      unlockMischief: 'مستوى 6: العبث', unlockPortals: 'مستوى 7: البوابات',
      unlockHyper: 'مستوى 8: طاقة فائقة', level9Hint: 'مستوى 9: اقتربت!',
      level10Hint: 'مستوى 10: التحدي الأخير!', maxLevel: 'المستوى الأقصى! الكل مفتوح.',
      showSkillsTree: 'إظهار شجرة المهارات', hideSkillsTree: 'إخفاء شجرة المهارات',
      aboutPixelCatTitle: 'ما هو PixelCat؟', aboutPixelCatBody: 'قط بكسل ليوتيوب، صنعه IMAD.',
      aboutLevelsTitle: 'المستويات', aboutLevelsBody: 'اكسب الخبرة لفتح ميزات جديدة.',
      aboutCoinsTitle: 'العملات', aboutCoinsBody: 'اجمع العملات وخذ مكافأة اليوم.',
      aboutQuestsTitle: 'مهام اليوم', aboutQuestsBody: 'أكمل 3 مهام للحفاظ على السلسلة.',
      aboutAchievementsTitle: 'الإنجازات', aboutAchievementsBody: 'شارات للحظات المهمة.',
      aboutSpawningTitle: 'العناصر', aboutSpawningBody: 'أضف سمكاً أو كرات أو عناكب.',
      aboutShopTitle: 'المتجر', aboutShopBody: 'اشتر كرات وتعزيزات دائمة.',
      aboutTipsTitle: 'نصائح', aboutTipsBody: 'داعبه بعد الطعام لمكافأة.',
      supportPixelCat: 'ادعم PixelCat', supportKoFi: 'ادعم التطوير على Ko-fi',
      statFishEaten: 'السمك المأكول', statSpidersCaught: 'العناكب المصادة', statPetSessions: 'جلسات المداعبة',
      statCoinsCollected: 'العملات المجمعة', statBallCatches: 'الكرات الملتقطة', statQuestsDone: 'المهام المكتملة',
      statPerfectDays: 'الأيام المثالية', statDailyStreak: 'السلسلة اليومية',
      skillsTree: 'شجرة المهارات', dragTree: 'اسحب الشجرة للاستكشاف', basicInstincts: 'الغرائز الأساسية',
      core: 'أساسي', speechBubble: 'فقاعة الكلام', fishHunt: 'صيد السمك', wallNinja: 'نينجا الجدار',
      sizeWeight: 'الحجم والوزن', petBond: 'رابطة المداعبة', ballChaser: 'مطارد الكرة', spiderHunter: 'صياد العناكب',
      companionMode: 'وضع الرفيق', portalTraveler: 'مسافر البوابات', hyperEnergy: 'طاقة فائقة', madeBy: 'صنع بواسطة',
      firstFriend: 'أول صديق', hundredPets: '100 مداعبة', sevenDayStreak: 'سلسلة 7 أيام', masterMischief: 'سيد العبث',
      buyCoins: '{price} عملات', activeItem: 'نشط', setActive: 'اجعله نشطاً', enable: 'تفعيل', disable: 'تعطيل',
      claimCoinsToday: '+{count} عملات اليوم', coinsAmount: '+{count} عملات',
      ballBaseball: 'كرة بيسبول', ballTennis: 'كرة تنس', ballGolf: 'كرة غولف', ballBasketball: 'كرة سلة',
      ballFootball: 'كرة قدم', ballVolleyball: 'كرة طائرة', ballBowling: 'كرة بولينغ',
      boostFeather: 'عصا الريشة', boostFeatherDesc: '+2 عملات لكل مداعبة', boostTreat: 'حلوى ذهبية',
      boostTreatDesc: 'عملات السمك x2', boostMagnet: 'مغناطيس العملات', boostMagnetDesc: 'يجذب العملات',
      boostLucky: 'تميمة الحظ', boostLuckyDesc: 'إسقاطات أكثر',
      questPet: 'داعب القط', questFish: 'قدّم السمك', questWatch: 'شاهدوا معاً', questCoins: 'اجمع العملات',
      questFetch: 'العب جلب الكرة', questSpiders: 'اصطد العناكب', questDoubleAffection: 'عاطفة مضاعفة',
      questFishFeast: 'وليمة سمك', questLongSession: 'جلسة طويلة',
      confirm: 'تأكيد', cancel: 'إلغاء', openInfo: 'فتح المعلومات'
    }
  };

  Object.keys(I18N_EXTRA).forEach(lang => {
    TRANSLATIONS[lang] = Object.assign({}, TRANSLATIONS[lang] || {}, I18N_EXTRA[lang]);
  });

  let currentLanguage = 'en';

  function t(key, vars) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    const fallback = TRANSLATIONS.en[key] || key;
    let text = dict[key] || fallback;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(vars[name]));
      });
    }
    return text;
  }

  function applyTranslations(lang) {
    currentLanguage = lang || 'en';
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    // RTL support for Arabic
    document.documentElement.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLanguage);
    document.body.classList.toggle('rtl-ui', currentLanguage === 'ar');
    updateMainToggleUI(toggle ? toggle.checked : false);
    refreshStaticI18nText();
    if (xpBarFill && xpValue && xpHint) applyXpUI(latestXP, false);
  }

  //  SHOP CATALOG 
  const SHOP_ITEMS = [
    // - BALLS -
    { id: 'ball_baseball',  imgFile: 'baseball.png',  name: 'Baseball',    nameKey: 'ballBaseball',   price: 0,   type: 'ball', free: true },
    { id: 'ball_tennis',    imgFile: 'tennis.png',    name: 'Tennis Ball', nameKey: 'ballTennis',     price: 15,  type: 'ball' },
    { id: 'ball_golf',      imgFile: 'golf.png',      name: 'Golf Ball',   nameKey: 'ballGolf',       price: 15,  type: 'ball' },
    { id: 'ball_basketball',imgFile: 'basketball.png',name: 'Basketball',  nameKey: 'ballBasketball', price: 20,  type: 'ball' },
    { id: 'ball_football',  imgFile: 'football.png',  name: 'Football',    nameKey: 'ballFootball',   price: 20,  type: 'ball' },
    { id: 'ball_volleyball',imgFile: 'valleyball.png',name: 'Volleyball',  nameKey: 'ballVolleyball', price: 25,  type: 'ball' },
    { id: 'ball_bowling',   imgFile: 'bowling.png',   name: 'Bowling Ball',nameKey: 'ballBowling',    price: 30,  type: 'ball' },
    // - BOOSTS -
    { id: 'toy_feather',  emoji: '✨', name: 'Feather Wand',  nameKey: 'boostFeather', desc: '+2 coins per pet',        descKey: 'boostFeatherDesc', price: 30,  type: 'boost', effect: 'petCoins' },
    { id: 'treat_gold',   emoji: '🍖', name: 'Golden Treat',  nameKey: 'boostTreat',   desc: 'Double fish coins',       descKey: 'boostTreatDesc',   price: 50,  type: 'boost', effect: 'fishCoins' },
    { id: 'coin_magnet',  emoji: '🧲', name: 'Coin Magnet',   nameKey: 'boostMagnet',  desc: 'Pulls nearby coins to the cat', descKey: 'boostMagnetDesc', price: 80,  type: 'boost', effect: 'coinMagnet' },
    { id: 'lucky_charm',  emoji: '🍀', name: 'Lucky Charm',   nameKey: 'boostLucky',   desc: 'More frequent drops',     descKey: 'boostLuckyDesc',   price: 100, type: 'boost', effect: 'luckyDrops' },
  ];

  //  LEVEL / XP MILESTONE DEFINITIONS  (10-level system)
  // Per-level XP to earn: 10, 20, 30, 40, 50, 60, 70, 80, 100
  // Cumulative totals:     0, 10, 30, 60,100,150,210,280,360,460
  const MAX_LEVEL_XP = 460;
  const MILESTONES = {
    speech:          { xp: 10,  level: 2,  label: 'Level 2'  },
    ball:            { xp: 10,  level: 2,  label: 'Level 2'  },
    spider:          { xp: 30,  level: 3,  label: 'Level 3'  },
    size:            { xp: 60,  level: 4,  label: 'Level 4'  },
    companion:       { xp: 100, level: 5,  label: 'Level 5'  },
    uiMischief:      { xp: 150, level: 6,  label: 'Level 6'  },
    mischiefRate:    { xp: 150, level: 6,  label: 'Level 6'  },
    portal:          { xp: 210, level: 7,  label: 'Level 7'  },
    hyper:           { xp: 280, level: 8,  label: 'Level 8'  },
  };

  const toggle = document.getElementById('toggle');
  const statusText = document.getElementById('status-text');
  const dot = document.getElementById('dot');
  const loyalToggle = document.getElementById('loyalToggle');
  const companionToggle = document.getElementById('companionToggle');
  const aggroToggle = document.getElementById('aggroToggle');
  const spiderSpawnBtn = document.getElementById('spiderSpawnBtn');
  const uiMischiefToggle = document.getElementById('uiMischiefToggle');
  const speechToggle = document.getElementById('speechToggle');
  const memoryToggle = document.getElementById('memoryToggle');
  const rareEventsToggle = document.getElementById('rareEventsToggle');
  const fishSpawnBtn = document.getElementById('fishSpawnBtn');
  const ballSpawnBtn = document.getElementById('ballSpawnBtn');
  const lowPowerToggle = document.getElementById('lowPowerToggle');
  const hideInFullscreenToggle = document.getElementById('hideInFullscreenToggle');
  const speedMinus = document.getElementById('speedMinus');
  const speedPlus = document.getElementById('speedPlus');
  const speedVal = document.getElementById('speedVal');
  const sizeMinus = document.getElementById('sizeMinus');
  const sizePlus = document.getElementById('sizePlus');
  const sizeVal = document.getElementById('sizeVal');
  const mischiefMinus = document.getElementById('mischiefMinus');
  const mischiefPlus = document.getElementById('mischiefPlus');
  const mischiefRateVal = document.getElementById('mischiefRateVal');
  const energyGroup = document.getElementById('energyGroup');
  const infoToggle = document.getElementById('infoToggle');
  const tabButtons = document.querySelectorAll('.tab-button');
  const panels = document.querySelectorAll('.settings-panel');
  const subTabButtons = document.querySelectorAll('[data-subtab]');
  const settingsTabButtons = document.querySelectorAll('[data-settingstab]');
  const infoTabButtons = document.querySelectorAll('[data-infotab]');
  const dailyQuestsView = document.getElementById('dailyQuestsView');
  const achievementsView = document.getElementById('achievementsView');
  const settingsBasicView = document.getElementById('settingsBasicView');
  const settingsAdvancedView = document.getElementById('settingsAdvancedView');
  const settingsDangerView = document.getElementById('settingsDangerView');
  const aboutInfoView = document.getElementById('aboutInfoView');
  const statsInfoView = document.getElementById('statsInfoView');
  const questList = document.getElementById('questList');
  const questResetText = document.getElementById('questResetText');
  const questCompletedValue = document.getElementById('questCompletedValue');
  const questPerfectDaysValue = document.getElementById('questPerfectDaysValue');
  const questSummaryLine = document.getElementById('questSummaryLine');

  // Level / XP UI elements
  const xpBarFill = document.getElementById('xpBarFill');
  const xpValue = document.getElementById('xpValue');
  const levelValue = document.getElementById('levelValue');
  const xpHint = document.getElementById('xpHint');
  const coinCount = document.getElementById('coinCount');
  const statFish = document.getElementById('statFish');
  const statSpiders = document.getElementById('statSpiders');
  const statPets = document.getElementById('statPets');
  const statCoinsCollected = document.getElementById('statCoinsCollected');
  const statBalls = document.getElementById('statBalls');
  const statQuests = document.getElementById('statQuests');
  const statPerfectDays = document.getElementById('statPerfectDays');
  const statDailyStreak = document.getElementById('statDailyStreak');

  // Lock elements
  const companionLock = document.getElementById('companionLock');
  const companionSwitchWrap = document.getElementById('companionSwitchWrap');
  const companionRow = document.getElementById('companionRow');
  const speechLock = document.getElementById('speechLock');
  const speechSwitchWrap = document.getElementById('speechSwitchWrap');
  const speechRow = document.getElementById('speechRow');
  const sizeLock = document.getElementById('sizeLock');
  const sizeRow = document.getElementById('sizeRow');
  const mischiefLock = document.getElementById('mischiefLock');
  const mischiefSwitchWrap = document.getElementById('mischiefSwitchWrap');
  const mischiefRow = document.getElementById('mischiefRow');
  const mischiefRateRow = document.getElementById('mischiefRateRow');
  const mischiefRateLock = document.getElementById('mischiefRateLock');
  const hyperBtn = document.getElementById('hyperBtn');
  const hyperLock = document.getElementById('hyperLock');
  const ballLock = document.getElementById('ballLock');
  const spiderLock = document.getElementById('spiderLock');
  const portalSpawnBtn = document.getElementById('portalSpawnBtn');
  const portalLock = document.getElementById('portalLock');
  const languageSelect = document.getElementById('languageSelect');

  // Track previous XP to detect unlocks. The storage key remains catXP for older installs.
  let prevXP = -1;
  let latestXP = 0;
  let latestDailyStreak = 0;
  let latestAchievementStats = {};

  // Apply saved language immediately so the UI doesn't flash English first
  getLocal({ uiLanguage: 'en' }).then(result => {
    applyTranslations(result.uiLanguage || 'en');
    if (languageSelect) languageSelect.value = currentLanguage;
  });

  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      const lang = languageSelect.value;
      applyTranslations(lang);
      setLocal({ uiLanguage: lang });
      sendMessageToTabs({ action: 'updateSettings', settings: { uiLanguage: lang } });
      refreshQuests().catch(() => {});
      refreshShop().catch(() => {});
    });
  }

  function getLocal(keys) {
    if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
      return API.storage.local.get(keys);
    }
    return new Promise((resolve) => API.storage.local.get(keys, resolve));
  }

  function setLocal(data) {
    if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1) {
      return API.storage.local.set(data);
    }
    return new Promise((resolve) => API.storage.local.set(data, resolve));
  }

  function removeLocal(keys) {
    if (typeof API.storage.local.remove === 'function' && API.storage.local.remove.length <= 1) {
      return API.storage.local.remove(keys);
    }
    return new Promise((resolve) => API.storage.local.remove(keys, resolve));
  }

  let storageWriteQueue = Promise.resolve();
  function updateLocal(defaults, updater) {
    storageWriteQueue = storageWriteQueue.catch(() => {}).then(async () => {
      const current = await getLocal(defaults);
      const next = updater(current);
      if (next && next.values) {
        await setLocal(next.values);
      }
      return next;
    });
    return storageWriteQueue;
  }

  function sendRuntimeMessage(message) {
    try {
      const result = API.runtime.sendMessage(message);
      if (result && typeof result.then === 'function') {
        return result;
      }
    } catch (error) {
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      API.runtime.sendMessage(message, (response) => {
        if (API.runtime.lastError) {
          reject(new Error(API.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  function sendMessageToTabs(message) {
    return sendRuntimeMessage(message).catch(() => undefined);
  }

  function updateMainToggleUI(enabled) {
    toggle.checked = enabled;
    statusText.textContent = enabled ? t('active') : t('disabled');
    if (enabled) {
      dot.classList.add('active');
      document.body.classList.remove('pixelcat-disabled');
    } else {
      dot.classList.remove('active');
      document.body.classList.add('pixelcat-disabled');
    }
  }

  function setActiveSubTab(subTabName) {
    subTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.subtab === subTabName);
    });
    if (dailyQuestsView) dailyQuestsView.style.display = subTabName === 'daily' ? 'flex' : 'none';
    if (achievementsView) achievementsView.style.display = subTabName === 'achievements' ? 'grid' : 'none';
  }

  function setActiveSettingsTab(settingsTabName) {
    settingsTabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.settingstab === settingsTabName);
    });
    if (settingsBasicView) settingsBasicView.style.display = settingsTabName === 'basic' ? 'flex' : 'none';
    if (settingsAdvancedView) settingsAdvancedView.style.display = settingsTabName === 'advanced' ? 'flex' : 'none';
    if (settingsDangerView) settingsDangerView.style.display = settingsTabName === 'danger' ? 'flex' : 'none';
  }

  function setActiveShopTab(shoptab) {
    document.querySelectorAll('[data-shoptab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shoptab === shoptab);
    });
    const shopBallsView = document.getElementById('shopBallsView');
    const shopBoostsView = document.getElementById('shopBoostsView');
    if (shopBallsView) shopBallsView.style.display = shoptab === 'balls' ? 'grid' : 'none';
    if (shopBoostsView) shopBoostsView.style.display = shoptab === 'boosts' ? 'grid' : 'none';
  }

  function setActiveInfoTab(infotab) {
    infoTabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.infotab === infotab);
    });
    if (aboutInfoView) aboutInfoView.style.display = infotab === 'about' ? 'flex' : 'none';
    if (statsInfoView) statsInfoView.style.display = infotab === 'stats' ? 'grid' : 'none';
    if (infotab === 'stats') refreshStats().catch(() => {});
  }

  const STATIC_TEXT_TARGETS = [
    ['[data-infotab="about"]', 'about'],
    ['[data-infotab="stats"]', 'stats'],
    ['#homeBonusTitle', 'dailyBonusReady'],
    ['#toggleTreeBtn', 'showSkillsTree'],
    ['.coffee-title', 'supportPixelCat'],
    ['.coffee-desc', 'supportKoFi'],
    ['.tree-header > span:first-child', 'skillsTree'],
    ['.tree-header-sub', 'dragTree'],
    ['#treeNodeBase .tree-title', 'basicInstincts'],
    ['#treeNodeBase .tree-meta', 'core'],
    ['#treeNodeSpeech .tree-title', 'speechBubble'],
    ['#treeNodeFish .tree-title', 'fishHunt'],
    ['#treeNodeFish .tree-meta', 'core'],
    ['#treeNodeClimb .tree-title', 'wallNinja'],
    ['#treeNodeClimb .tree-meta', 'core'],
    ['#treeNodeSize .tree-title', 'sizeWeight'],
    ['#treeNodePetting .tree-title', 'petBond'],
    ['#treeNodePetting .tree-meta', 'core'],
    ['#treeNodeBall .tree-title', 'ballChaser'],
    ['#treeNodeSpider .tree-title', 'spiderHunter'],
    ['#treeNodeCompanion .tree-title', 'companionMode'],
    ['#treeNodeMischief .tree-title', 'pageMischief'],
    ['#treeNodePortal .tree-title', 'portalTraveler'],
    ['#treeNodeHyper .tree-title', 'hyperEnergy'],
    ['.popup-footer', 'madeBy']
  ];

  const ABOUT_CARD_KEYS = [
    ['aboutPixelCatTitle', 'aboutPixelCatBody'],
    ['aboutLevelsTitle', 'aboutLevelsBody'],
    ['aboutCoinsTitle', 'aboutCoinsBody'],
    ['aboutQuestsTitle', 'aboutQuestsBody'],
    ['aboutAchievementsTitle', 'aboutAchievementsBody'],
    ['aboutSpawningTitle', 'aboutSpawningBody'],
    ['aboutShopTitle', 'aboutShopBody'],
    ['aboutTipsTitle', 'aboutTipsBody']
  ];

  const STAT_LABEL_KEYS = [
    ['statFish', 'statFishEaten', '🐟'],
    ['statSpiders', 'statSpidersCaught', '🕷️'],
    ['statPets', 'statPetSessions', '✨'],
    ['statCoinsCollected', 'statCoinsCollected', ''],
    ['statBalls', 'statBallCatches', '🎾'],
    ['statQuests', 'statQuestsDone', '📜'],
    ['statPerfectDays', 'statPerfectDays', '🏆'],
    ['statDailyStreak', 'statDailyStreak', '🔥']
  ];

  function refreshStaticI18nText() {
    STATIC_TEXT_TARGETS.forEach(([selector, key]) => {
      const el = document.querySelector(selector);
      if (!el) return;
      if (selector === '.popup-footer') {
        el.innerHTML = `${t(key)} <span>IMAD</span>`;
      } else {
        el.textContent = t(key);
      }
    });

    document.querySelectorAll('.about-card').forEach((card, index) => {
      const keys = ABOUT_CARD_KEYS[index];
      if (!keys) return;
      const title = card.querySelector('.about-card-title');
      const body = card.querySelector('.about-card-body');
      if (title) title.textContent = t(keys[0]);
      if (body) body.textContent = t(keys[1]);
    });

    STAT_LABEL_KEYS.forEach(([valueId, key, icon]) => {
      const valueEl = document.getElementById(valueId);
      const card = valueEl ? valueEl.closest('.stat-card') : null;
      const label = card ? card.querySelector('.stat-label') : null;
      if (!label) return;
      if (valueId === 'statCoinsCollected') {
        const svg = label.querySelector('svg');
        label.textContent = '';
        if (svg) label.appendChild(svg);
        label.append(` ${t(key)}`);
      } else {
        label.textContent = `${icon} ${t(key)}`;
      }
    });

    document.querySelectorAll('.achievement-item').forEach((item) => {
      const name = item.querySelector('.achievement-name');
      if (!name) return;
      const id = item.id;
      if (id === 'achievementFirstFriend') name.textContent = t('firstFriend');
      if (id === 'achievementSpiderHunter') name.textContent = t('spiderHunter');
      if (id === 'achievement100Pets') name.textContent = t('hundredPets');
      if (id === 'achievement7DayStreak') name.textContent = t('sevenDayStreak');
      if (id === 'achievementMasterMischief') name.textContent = t('masterMischief');
    });

    [
      ['#treeNodeSpeech .tree-meta', 2], ['#treeNodeSize .tree-meta', 4],
      ['#treeNodeBall .tree-meta', 2], ['#treeNodeSpider .tree-meta', 3],
      ['#treeNodeCompanion .tree-meta', 5], ['#treeNodeMischief .tree-meta', 6],
      ['#treeNodePortal .tree-meta', 7], ['#treeNodeHyper .tree-meta', 8]
    ].forEach(([selector, level]) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = t('level', { level });
    });

    if (toggleTreeBtn && treatsTreeContainer) {
      const isTreeVisible = treatsTreeContainer.style.display !== 'none';
      toggleTreeBtn.textContent = isTreeVisible ? t('hideSkillsTree') : t('showSkillsTree');
    }

    [
      [fishSpawnBtn, 'fish', null],
      [ballSpawnBtn, 'ball', ballLock],
      [spiderSpawnBtn, 'spider', spiderLock],
      [portalSpawnBtn, 'portal', portalLock],
      [hyperBtn, 'hyper', hyperLock]
    ].forEach(([button, key, lockEl]) => {
      if (!button) return;
      Array.from(button.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .forEach((node) => node.remove());
      button.insertBefore(document.createTextNode(t(key) + (lockEl ? ' ' : '')), lockEl || button.firstChild);
    });

    [
      [infoToggle, 'openInfo'],
      [document.getElementById('confirmReset'), 'confirm'],
      [document.getElementById('cancelReset'), 'cancel'],
      [document.getElementById('confirmClearMemory'), 'confirm'],
      [document.getElementById('cancelClearMemory'), 'cancel']
    ].forEach(([el, key]) => {
      if (!el) return;
      el.title = t(key);
      el.setAttribute('aria-label', t(key));
    });
  }

  function setActiveTab(tabName) {
    tabButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    if (infoToggle) infoToggle.classList.toggle('active', tabName === 'info');
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === tabName);
    });

    // Default sub-tabs when entering main panels
    if (tabName === 'quests') {
      setActiveSubTab('daily');
    } else if (tabName === 'shop') {
      setActiveShopTab('balls');
    } else if (tabName === 'advanced') {
      setActiveSettingsTab('basic');
    } else if (tabName === 'info') {
      setActiveInfoTab('about');
    }
  }

  function updateAchievements(stats) {
    latestAchievementStats = stats || latestAchievementStats || {};
    const achievementStats = latestAchievementStats;
    const achievements = [
      { id: 'achievementFirstFriend', unlocked: achievementStats.lifetimePets >= 1 || achievementStats.lifetimeFish >= 1 },
      { id: 'achievementSpiderHunter', unlocked: achievementStats.lifetimeSpidersCaught >= 10 },
      { id: 'achievement100Pets', unlocked: achievementStats.lifetimePets >= 100 },
      { id: 'achievement7DayStreak', unlocked: latestDailyStreak >= 7 },
      { id: 'achievementMasterMischief', unlocked: latestXP >= MILESTONES.uiMischief.xp }
    ];

    achievements.forEach(ach => {
      const el = document.getElementById(ach.id);
      if (el) {
        el.classList.toggle('locked', !ach.unlocked);
        el.classList.toggle('unlocked', ach.unlocked);
      }
    });
  }

  function formatResetCountdown(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }
    return `${minutes}m`;
  }

  function formatDurationI18n(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const minLabel = currentLanguage === 'ar' ? 'د' : 'min';
    const secLabel = currentLanguage === 'ar' ? 'ث' : (currentLanguage === 'fr' ? 's' : 'sec');
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return remainder === 0
        ? `${minutes} ${minLabel}`
        : `${minutes} ${minLabel} ${String(remainder).padStart(2, '0')} ${secLabel}`;
    }
    return `${seconds} ${secLabel}`;
  }

  function formatXpGap(value) {
    return Number.parseFloat(Math.max(0, value).toFixed(1)).toString();
  }

  function getLevelFromXP(value) {
    const xp = Math.min(MAX_LEVEL_XP, Math.max(0, Number(value) || 0));
    if (xp >= 460) return 10;
    if (xp >= 360) return 9;
    if (xp >= 280) return 8;
    if (xp >= 210) return 7;
    if (xp >= 150) return 6;
    if (xp >= 100) return 5;
    if (xp >= 60)  return 4;
    if (xp >= 30)  return 3;
    if (xp >= 10)  return 2;
    return 1;
  }

  function getLevelProgress(value) {
    const totalXP = Math.min(MAX_LEVEL_XP, Math.max(0, Number(value) || 0));
    const level = getLevelFromXP(totalXP);
    const levelStarts = {
      1: 0,    2: 10,   3: 30,   4: 60,   5: 100,
      6: 150,  7: 210,  8: 280,  9: 360,  10: 460
    };
    const levelEnds = {
      1: 10,   2: 30,   3: 60,   4: 100,  5: 150,
      6: 210,  7: 280,  8: 360,  9: 460,  10: 460
    };
    const start = levelStarts[level] || 0;
    const end = levelEnds[level] || MAX_LEVEL_XP;
    const needed = Math.max(1, end - start);
    const current = Math.min(needed, Math.max(0, totalXP - start));
    const percent = level >= 10 && totalXP >= MAX_LEVEL_XP ? 100 : Math.min(100, (current / needed) * 100);
    return { level, current, needed, percent, totalXP };
  }

  function isMilestoneUnlocked(key) {
    const milestone = MILESTONES[key];
    return !milestone || latestXP >= milestone.xp;
  }

  function formatLevelRequirement(milestone) {
    return t('level', { level: milestone.level });
  }

  function getLockedSettingsPatch(data) {
    const xp = Math.min(MAX_LEVEL_XP, Math.max(0, Number(data.catXP) || 0));
    const patch = {};
    if (xp < MILESTONES.speech.xp && data.speechEnabled) patch.speechEnabled = false;
    if (xp < MILESTONES.ball.xp && data.ballEnabled) patch.ballEnabled = false;
    if (xp < MILESTONES.spider.xp && data.spiderEnabled) patch.spiderEnabled = false;
    if (xp < MILESTONES.size.xp && Number(data.sizeMultiplier) !== 1.0) patch.sizeMultiplier = 1.0;
    if (xp < MILESTONES.companion.xp && data.companionEnabled) patch.companionEnabled = false;
    if (xp < MILESTONES.uiMischief.xp && data.uiMischiefEnabled) patch.uiMischiefEnabled = false;
    if (xp < MILESTONES.hyper.xp && data.catEnergyLevel === 'hyper') patch.catEnergyLevel = 'active';
    if (xp < MILESTONES.portal.xp && data.portalEnabled) patch.portalEnabled = false;
    return patch;
  }

  const QUEST_TITLE_KEYS = {
    pet_sessions: 'questPet',
    fish_served: 'questFish',
    watch_seconds: 'questWatch',
    coins_collected: 'questCoins',
    ball_catches: 'questFetch',
    spiders_caught: 'questSpiders'
  };

  function getQuestTitle(quest) {
    if (!quest) return '';
    if (quest.title === 'Double Affection') return t('questDoubleAffection');
    if (quest.title === 'Fish Feast') return t('questFishFeast');
    if (quest.title === 'Long Session') return t('questLongSession');
    return t(QUEST_TITLE_KEYS[quest.type] || '', {}) || quest.title;
  }

  function renderQuestPanel(snapshot) {
    if (!questList || !questResetText || !questCompletedValue || !questPerfectDaysValue || !questSummaryLine) {
      return;
    }

    if (!snapshot) {
      questResetText.textContent = t('unavailable');
      questCompletedValue.textContent = '--';
      questPerfectDaysValue.textContent = '--';
      questSummaryLine.textContent = t('objectivesUnavailable');
      questList.replaceChildren();
      return;
    }

    // Update achievements based on lifetime stats
    updateAchievements(snapshot.stats);

    const remainingCount = Math.max(0, snapshot.totalCount - snapshot.completedCount);
    const overallPct = snapshot.totalCount > 0 ? Math.round((snapshot.completedCount / snapshot.totalCount) * 100) : 0;

    questResetText.textContent = t('remaining', { time: formatResetCountdown(snapshot.secondsUntilReset) });
    questCompletedValue.textContent = `${snapshot.completedCount} / ${snapshot.totalCount}`;
    questPerfectDaysValue.textContent = t('streak', { count: snapshot.stats.perfectDays });
    
    if (snapshot.allComplete) {
      questSummaryLine.textContent = t('allObjectivesComplete', { count: snapshot.stats.lifetimeCompleted });
    } else {
      questSummaryLine.textContent = t('remainingToday', { remaining: remainingCount, count: snapshot.stats.lifetimeCompleted });
    }

    const questCards = snapshot.quests.map((quest) => {
      const progressPct = quest.target > 0 ? Math.round((quest.progress / quest.target) * 100) : 0;
      const card = document.createElement('article');
      card.className = `quest-card${quest.completed ? ' quest-complete' : ''}`;
      const body = document.createElement('div');
      body.className = 'quest-card-body';
      const top = document.createElement('div');
      top.className = 'quest-card-top';
      const title = document.createElement('div');
      title.className = 'quest-card-title';
      title.textContent = getQuestTitle(quest);
      let displayLabel = quest.progressLabel;
      if (quest.type === 'watch_seconds') {
        const duration = document.createElement('span');
        duration.className = 'quest-title-meta';
        duration.textContent = ` (${formatDurationI18n(quest.target)})`;
        title.appendChild(duration);
        const progMins = Math.floor(quest.progress / 60);
        const targMins = Math.floor(quest.target / 60);
        displayLabel = quest.target >= 60
          ? `${progMins} / ${targMins}`
          : `${quest.progress} / ${quest.target}`;
      }

      const status = document.createElement('div');
      status.className = 'quest-card-status';
      status.textContent = quest.completed ? t('complete') : t('active');
      top.append(title, status);

      const row = document.createElement('div');
      row.className = 'quest-progress-row';
      const track = document.createElement('div');
      track.className = 'quest-progress-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div');
      fill.className = 'quest-progress-fill';
      fill.style.width = `${progressPct}%`;
      track.appendChild(fill);
      const label = document.createElement('span');
      label.className = 'quest-progress-label';
      label.textContent = displayLabel;
      row.append(track, label);

      body.append(top, row);
      card.appendChild(body);
      return card;
    });
    questList.replaceChildren(...questCards);
  }

  async function refreshQuests() {
    if (!QuestEngine) {
      renderQuestPanel(null);
      return;
    }

    const snapshot = await QuestEngine.getSnapshot(API.storage.local);
    renderQuestPanel(snapshot);
  }

  function setStat(el, value) {
    if (el) el.textContent = Math.max(0, Number(value) || 0).toLocaleString();
  }

  async function refreshStats() {
    const defaults = { dailyStreak: 0 };
    if (QuestEngine) {
      defaults[QuestEngine.STATS_KEY] = null;
    }

    const data = await getLocal(defaults);
    const stats = QuestEngine && data[QuestEngine.STATS_KEY] ? data[QuestEngine.STATS_KEY] : {};
    setStat(statFish, stats.lifetimeFish);
    setStat(statSpiders, stats.lifetimeSpidersCaught);
    setStat(statPets, stats.lifetimePets);
    setStat(statCoinsCollected, stats.lifetimeCoins);
    setStat(statBalls, stats.lifetimeBallCatches);
    setStat(statQuests, stats.lifetimeCompleted);
    setStat(statPerfectDays, stats.perfectDays);
    setStat(statDailyStreak, data.dailyStreak);
    latestDailyStreak = Math.max(0, Number(data.dailyStreak) || 0);
    updateAchievements(stats);
  }

  //  LEVEL / XP UI UPDATE
  function applyXpUI(xp, flash) {
    const pct = Math.min(MAX_LEVEL_XP, Math.max(0, xp));
    const levelProgress = getLevelProgress(pct);
    const level = levelProgress.level;
    latestXP = pct;
    updateAchievements(latestAchievementStats);
    const currentLevelXP = Math.floor(levelProgress.current);
    const neededLevelXP = Math.floor(levelProgress.needed);
    xpBarFill.style.width = levelProgress.percent + '%';
    if (levelValue) levelValue.textContent = t('level', { level });
    xpValue.textContent = t('xpProgress', { current: currentLevelXP, needed: neededLevelXP });

    if (pct < 10) {
      xpHint.textContent = t('unlockSpeechBall');
    } else if (pct < 30) {
      xpHint.textContent = t('unlockSpiders');
    } else if (pct < 60) {
      xpHint.textContent = t('unlockSize');
    } else if (pct < 100) {
      xpHint.textContent = t('unlockCompanion');
    } else if (pct < 150) {
      xpHint.textContent = t('unlockMischief');
    } else if (pct < 210) {
      xpHint.textContent = t('unlockPortals');
    } else if (pct < 280) {
      xpHint.textContent = t('unlockHyper');
    } else if (pct < 360) {
      xpHint.textContent = t('level9Hint');
    } else if (pct < 460) {
      xpHint.textContent = t('level10Hint');
    } else {
      xpHint.textContent = t('maxLevel');
    }

    function updateLockBanner(bannerEl, unlocked, milestone) {
      if (!bannerEl) return;
      const textSpan = bannerEl.querySelector('.lock-text');
      const iconSvg = bannerEl.querySelector('.lock-icon');
      if (!textSpan || !iconSvg) return;
      
      if (unlocked) {
        bannerEl.classList.add('unlocked');
      } else {
        textSpan.textContent = t('requires', { level: formatLevelRequirement(milestone) });
        bannerEl.classList.remove('unlocked');
        iconSvg.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'; // Lock
      }
    }

    function updateLockedButton(button, lockEl, unlocked) {
      if (!button) return;
      button.disabled = !unlocked;
      button.classList.toggle('control-locked', !unlocked);
      button.setAttribute('aria-disabled', String(!unlocked));
      if (lockEl) lockEl.style.display = unlocked ? 'none' : '';
      if (unlocked) {
        button.style.opacity = '';
        button.style.pointerEvents = '';
      } else {
        button.classList.remove('active');
        button.style.opacity = '0.45';
        button.style.pointerEvents = 'none';
      }
    }

    //  SPEECH BUBBLES lock
    const speechUnlocked = pct >= MILESTONES.speech.xp;
    updateLockBanner(speechLock, speechUnlocked, MILESTONES.speech);
    if (speechUnlocked) {
      speechSwitchWrap.classList.remove('control-locked');
      speechToggle.disabled = false;
    } else {
      speechSwitchWrap.classList.add('control-locked');
      speechToggle.checked = false;
      speechToggle.disabled = true;
    }

    //  BALL SPAWN lock
    const ballUnlocked = pct >= MILESTONES.ball.xp;
    if (ballUnlocked) {
      updateLockedButton(ballSpawnBtn, ballLock, true);
    } else {
      updateLockedButton(ballSpawnBtn, ballLock, false);
    }

    //  SPIDER SPAWN lock
    const spiderUnlocked = pct >= MILESTONES.spider.xp;
    if (spiderUnlocked) {
      updateLockedButton(spiderSpawnBtn, spiderLock, true);
    } else {
      updateLockedButton(spiderSpawnBtn, spiderLock, false);
    }

    //  SIZE lock
    const sizeUnlocked = pct >= MILESTONES.size.xp;
    updateLockBanner(sizeLock, sizeUnlocked, MILESTONES.size);
    if (sizeUnlocked) {
      sizeRow.classList.remove('control-locked');
      sizeMinus.disabled = false;
      sizePlus.disabled = false;
    } else {
      sizeRow.classList.add('control-locked');
      sizeMinus.disabled = true;
      sizePlus.disabled = true;
      sizeVal.textContent = '1.0x';
    }

    //  COMPANION lock
    const companionUnlocked = pct >= MILESTONES.companion.xp;
    updateLockBanner(companionLock, companionUnlocked, MILESTONES.companion);
    if (companionUnlocked) {
      companionSwitchWrap.classList.remove('control-locked');
      companionToggle.disabled = false;
    } else {
      companionSwitchWrap.classList.add('control-locked');
      companionToggle.checked = false;
      companionToggle.disabled = true;
    }

    //  UI MISCHIEF lock
    const mischiefUnlocked = pct >= MILESTONES.uiMischief.xp;
    updateLockBanner(mischiefLock, mischiefUnlocked, MILESTONES.uiMischief);
    if (mischiefUnlocked) {
      mischiefSwitchWrap.classList.remove('control-locked');
      uiMischiefToggle.disabled = false;
    } else {
      mischiefSwitchWrap.classList.add('control-locked');
      uiMischiefToggle.checked = false;
      uiMischiefToggle.disabled = true;
    }

    //  MISCHIEF RATE lock
    const mischiefRateUnlocked = pct >= MILESTONES.mischiefRate.xp;
    updateLockBanner(mischiefRateLock, mischiefRateUnlocked, MILESTONES.mischiefRate);
    if (mischiefRateUnlocked) {
      mischiefMinus.disabled = false;
      mischiefPlus.disabled = false;
    } else {
      mischiefMinus.disabled = true;
      mischiefPlus.disabled = true;
    }

    //  PORTAL SPAWN lock
    const portalUnlocked = pct >= MILESTONES.portal.xp;
    if (portalSpawnBtn) {
      if (portalUnlocked) {
        updateLockedButton(portalSpawnBtn, portalLock, true);
      } else {
        updateLockedButton(portalSpawnBtn, portalLock, false);
      }
    }

    //  HYPER lock
    const hyperUnlocked = pct >= MILESTONES.hyper.xp;
    if (hyperUnlocked) {
      updateLockedButton(hyperBtn, hyperLock, true);
    } else {
      updateLockedButton(hyperBtn, hyperLock, false);
    }

    // Flash newly unlocked rows
    if (flash && prevXP >= 0) {
      const milestones = [
        { threshold: MILESTONES.speech.xp,          el: speechRow },
        { threshold: MILESTONES.ball.xp,            el: ballSpawnBtn.closest('.control-row') },
        { threshold: MILESTONES.spider.xp,          el: spiderSpawnBtn.closest('.control-row') },
        { threshold: MILESTONES.size.xp,            el: sizeRow },
        { threshold: MILESTONES.companion.xp,       el: companionRow },
        { threshold: MILESTONES.uiMischief.xp,      el: mischiefRow },
        { threshold: MILESTONES.mischiefRate.xp,    el: mischiefRateRow },
        { threshold: MILESTONES.hyper.xp,           el: hyperBtn.closest('.control-row') || hyperBtn.parentElement },
        { threshold: MILESTONES.portal.xp,          el: portalSpawnBtn ? portalSpawnBtn.closest('.control-row') : null },
      ];
      milestones.forEach(m => {
        if (prevXP < m.threshold && pct >= m.threshold && m.el) {
          m.el.classList.remove('unlock-flash');
          void m.el.offsetWidth; // force reflow
          m.el.classList.add('unlock-flash');
          setTimeout(() => m.el.classList.remove('unlock-flash'), 900);
        }
      });
    }

    //  TREATS TREE UPDATE 
    document.querySelectorAll('.tree-item[data-xp]').forEach((node) => {
      const requiredXP = Number(node.dataset.xp) || 0;
      const unlocked = pct >= requiredXP;
      node.classList.toggle('unlocked', unlocked);
    });

    prevXP = pct;
  }

  async function refresh() {
    const data = await getLocal(defaultSettings);
    const lockedPatch = getLockedSettingsPatch(data);
    if (Object.keys(lockedPatch).length) {
      Object.assign(data, lockedPatch);
      await setLocal(lockedPatch);
      await sendMessageToTabs({ action: 'updateSettings', settings: lockedPatch });
      if (lockedPatch.companionEnabled === false) {
        await sendMessageToTabs({ action: 'stopCompanion' });
      }
    }
    updateMainToggleUI(data.catEnabled);
    companionToggle.checked = data.companionEnabled;
    loyalToggle.checked = data.loyalMode;
    aggroToggle.checked = data.aggressiveMode;
    if (data.spiderEnabled) spiderSpawnBtn.classList.add('active');
    else spiderSpawnBtn.classList.remove('active');
    uiMischiefToggle.checked = data.uiMischiefEnabled;
    speechToggle.checked = data.speechEnabled;
    memoryToggle.checked = data.memoryEnabled;
    rareEventsToggle.checked = data.rareEventsEnabled;
    lowPowerToggle.checked = data.lowPowerMode;
    if (hideInFullscreenToggle) hideInFullscreenToggle.checked = data.hideInFullscreen;
    speedVal.textContent = parseFloat(data.speedMultiplier).toFixed(1) + 'x';
    sizeVal.textContent = parseFloat(data.sizeMultiplier).toFixed(1) + 'x';
    mischiefRateVal.textContent = `${parseInt(data.uiMischiefRate, 10)}%`;

    // Coins
    if (coinCount) coinCount.textContent = (data.coins || 0).toLocaleString();

    // Update spawn buttons
    if (data.autoFishSpawnEnabled) fishSpawnBtn.classList.add('active');
    else fishSpawnBtn.classList.remove('active');
    
    if (data.ballEnabled) ballSpawnBtn.classList.add('active');
    else ballSpawnBtn.classList.remove('active');

    if (portalSpawnBtn) {
      if (data.portalEnabled) portalSpawnBtn.classList.add('active');
      else portalSpawnBtn.classList.remove('active');
    }
    
    document.querySelectorAll('#energyGroup .group-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.energy === data.catEnergyLevel);
    });

    document.querySelectorAll('.color-box').forEach((box) => {
      if (box.dataset.skin === data.catSkin) box.classList.add('active');
      else box.classList.remove('active');
    });

    // Apply level / XP UI
    applyXpUI(data.catXP || 0, false);
    await refreshQuests();
    await refreshStats();
  }

  toggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ catEnabled: next });
    await sendMessageToTabs({ action: next ? 'startCat' : 'stopCat' });
    updateMainToggleUI(next);
  });

  loyalToggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ loyalMode: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { loyalMode: next } });
  });

  companionToggle.addEventListener('change', async (e) => {
    if (!isMilestoneUnlocked('companion')) {
      e.target.checked = false;
      return;
    }
    const next = e.target.checked;
    await setLocal({ companionEnabled: next });
    await sendMessageToTabs({ action: next ? 'startCompanion' : 'stopCompanion' });
  });

  aggroToggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ aggressiveMode: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { aggressiveMode: next } });
  });

  uiMischiefToggle.addEventListener('change', async (e) => {
    if (!isMilestoneUnlocked('uiMischief')) {
      e.target.checked = false;
      return;
    }
    const next = e.target.checked;
    await setLocal({ uiMischiefEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefEnabled: next } });
  });

  speechToggle.addEventListener('change', async (e) => {
    if (!isMilestoneUnlocked('speech')) {
      e.target.checked = false;
      return;
    }
    const next = e.target.checked;
    await setLocal({ speechEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { speechEnabled: next } });
  });

  memoryToggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ memoryEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { memoryEnabled: next } });
  });

  rareEventsToggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ rareEventsEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { rareEventsEnabled: next } });
  });

  // ─── SPAWN BUTTONS: each is an independent toggle, multiple can be active ───
  // When more than one is on, each type spawns on its own natural random timer
  // in content.js — giving organic, unpredictable variety without coordination.

  spiderSpawnBtn.addEventListener('click', async () => {
    if (!isMilestoneUnlocked('spider')) return;
    const next = !spiderSpawnBtn.classList.contains('active');
    spiderSpawnBtn.classList.toggle('active', next);
    await setLocal({ spiderEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { spiderEnabled: next } });
  });

  fishSpawnBtn.addEventListener('click', async () => {
    const next = !fishSpawnBtn.classList.contains('active');
    fishSpawnBtn.classList.toggle('active', next);
    await setLocal({ autoFishSpawnEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { autoFishSpawnEnabled: next } });
  });

  ballSpawnBtn.addEventListener('click', async () => {
    if (!isMilestoneUnlocked('ball')) return;
    const next = !ballSpawnBtn.classList.contains('active');
    ballSpawnBtn.classList.toggle('active', next);
    await setLocal({ ballEnabled: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { ballEnabled: next } });
  });

  if (portalSpawnBtn) {
    portalSpawnBtn.addEventListener('click', async () => {
      if (!isMilestoneUnlocked('portal')) return;
      const next = !portalSpawnBtn.classList.contains('active');
      portalSpawnBtn.classList.toggle('active', next);
      await setLocal({ portalEnabled: next });
      await sendMessageToTabs({ action: 'updateSettings', settings: { portalEnabled: next } });
    });
  }

  document.querySelectorAll('#energyGroup .group-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.energy === 'hyper' && !isMilestoneUnlocked('hyper')) return;
      document.querySelectorAll('#energyGroup .group-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const energy = btn.dataset.energy;
      await setLocal({ catEnergyLevel: energy });
      await sendMessageToTabs({ action: 'updateSettings', settings: { catEnergyLevel: energy } });
    });
  });

  lowPowerToggle.addEventListener('change', async (e) => {
    const next = e.target.checked;
    await setLocal({ lowPowerMode: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { lowPowerMode: next } });
  });

  if (hideInFullscreenToggle) {
    hideInFullscreenToggle.addEventListener('change', async (e) => {
      const next = e.target.checked;
      await setLocal({ hideInFullscreen: next });
      await sendMessageToTabs({ action: 'updateSettings', settings: { hideInFullscreen: next } });
    });
  }


  speedMinus.addEventListener('click', async () => {
    let data = await getLocal({ speedMultiplier: 1.0 });
    let val = parseFloat(data.speedMultiplier);
    val = Math.max(0.5, val - 0.5);
    speedVal.textContent = val.toFixed(1) + 'x';
    await setLocal({ speedMultiplier: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { speedMultiplier: val } });
  });

  speedPlus.addEventListener('click', async () => {
    let data = await getLocal({ speedMultiplier: 1.0 });
    let val = parseFloat(data.speedMultiplier);
    val = Math.min(2.5, val + 0.5);
    speedVal.textContent = val.toFixed(1) + 'x';
    await setLocal({ speedMultiplier: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { speedMultiplier: val } });
  });

  sizeMinus.addEventListener('click', async () => {
    if (!isMilestoneUnlocked('size')) return;
    let data = await getLocal({ sizeMultiplier: 1.0 });
    let val = parseFloat(data.sizeMultiplier);
    val = Math.max(0.5, Math.round((val - 0.1) * 10) / 10);
    sizeVal.textContent = val.toFixed(1) + 'x';
    await setLocal({ sizeMultiplier: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { sizeMultiplier: val } });
  });

  sizePlus.addEventListener('click', async () => {
    if (!isMilestoneUnlocked('size')) return;
    let data = await getLocal({ sizeMultiplier: 1.0 });
    let val = parseFloat(data.sizeMultiplier);
    val = Math.min(2.5, Math.round((val + 0.1) * 10) / 10);
    sizeVal.textContent = val.toFixed(1) + 'x';
    await setLocal({ sizeMultiplier: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { sizeMultiplier: val } });
  });

  mischiefMinus.addEventListener('click', async () => {
    let data = await getLocal({ uiMischiefRate: 11 });
    let val = parseInt(data.uiMischiefRate, 10);
    val = Math.max(5, val - 5);
    mischiefRateVal.textContent = `${val}%`;
    await setLocal({ uiMischiefRate: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefRate: val } });
  });

  mischiefPlus.addEventListener('click', async () => {
    let data = await getLocal({ uiMischiefRate: 11 });
    let val = parseInt(data.uiMischiefRate, 10);
    val = Math.min(30, val + 5);
    mischiefRateVal.textContent = `${val}%`;
    await setLocal({ uiMischiefRate: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefRate: val } });
  });

  document.querySelectorAll('.color-box').forEach(box => {
    box.addEventListener('click', async (e) => {
      document.querySelectorAll('.color-box').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const skin = e.target.dataset.skin;
      await setLocal({ catSkin: skin });
      await sendMessageToTabs({ action: 'updateSettings', settings: { catSkin: skin } });
    });
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveTab(btn.dataset.tab);
    });
  });

  const infoIconInfo   = document.getElementById('infoIconInfo');
  const infoIconReturn = document.getElementById('infoIconReturn');

  let _lastTabBeforeInfo = 'essential';

  function openInfoPanel() {
    _lastTabBeforeInfo = document.querySelector('.tab-button.active')?.dataset.tab || 'essential';
    document.body.classList.add('info-panel-open');
    if (infoToggle) infoToggle.classList.add('active');
    if (infoIconInfo)   infoIconInfo.style.display   = 'none';
    if (infoIconReturn) infoIconReturn.style.display = '';
    // activate the info panel itself
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === 'info'));
    tabButtons.forEach(b => b.classList.remove('active'));
    setActiveInfoTab('about');
  }

  function closeInfoPanel() {
    document.body.classList.remove('info-panel-open');
    if (infoToggle) infoToggle.classList.remove('active');
    if (infoIconInfo)   infoIconInfo.style.display   = '';
    if (infoIconReturn) infoIconReturn.style.display = 'none';
    setActiveTab(_lastTabBeforeInfo);
  }

  if (infoToggle) {
    infoToggle.addEventListener('click', () => {
      if (document.body.classList.contains('info-panel-open')) {
        closeInfoPanel();
      } else {
        openInfoPanel();
      }
    });
  }

  subTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveSubTab(btn.dataset.subtab);
    });
  });

  settingsTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveSettingsTab(btn.dataset.settingstab);
    });
  });

  infoTabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveInfoTab(btn.dataset.infotab);
    });
  });

  const toggleTreeBtn = document.getElementById('toggleTreeBtn');
  const statsCardsContainer = document.getElementById('statsCardsContainer');
  const treatsTreeContainer = document.getElementById('treatsTreeContainer');
  const skillTreeMap = document.getElementById('skillTreeMap');
  const skillTreeViewport = skillTreeMap ? skillTreeMap.closest('.skill-tree-viewport') : null;
  let skillTreePanX = 0;
  let skillTreePanY = 0;
  let skillTreeDragging = false;
  let skillTreeDragStartX = 0;
  let skillTreeDragStartY = 0;
  let skillTreeDragBaseX = 0;
  let skillTreeDragBaseY = 0;

  function updateSkillTreePan() {
    if (!skillTreeMap) return;
    skillTreeMap.style.setProperty('--tree-pan-x', `${skillTreePanX}px`);
    skillTreeMap.style.setProperty('--tree-pan-y', `${skillTreePanY}px`);
  }

  function clampSkillTreePan() {
    if (!skillTreeMap || !skillTreeViewport) return;
    // Calculate dynamic limits based on current map and viewport dimensions
    const mapW = skillTreeMap.offsetWidth || 800;
    const mapH = skillTreeMap.offsetHeight || 1000;
    const viewW = skillTreeViewport.offsetWidth || 215;
    const viewH = skillTreeViewport.offsetHeight || 266;

    const limitX = Math.max(0, (mapW - viewW) / 2);
    const limitY = Math.max(0, (mapH - viewH) / 2);

    skillTreePanX = Math.max(-limitX, Math.min(limitX, skillTreePanX));
    skillTreePanY = Math.max(-limitY, Math.min(limitY, skillTreePanY));
  }

  if (skillTreeViewport) {
    skillTreeViewport.addEventListener('pointerdown', (event) => {
      skillTreeDragging = true;
      skillTreeDragStartX = event.clientX;
      skillTreeDragStartY = event.clientY;
      skillTreeDragBaseX = skillTreePanX;
      skillTreeDragBaseY = skillTreePanY;
      skillTreeViewport.classList.add('is-dragging');
      skillTreeViewport.setPointerCapture(event.pointerId);
    });

    skillTreeViewport.addEventListener('pointermove', (event) => {
      if (!skillTreeDragging) return;
      skillTreePanX = skillTreeDragBaseX + event.clientX - skillTreeDragStartX;
      skillTreePanY = skillTreeDragBaseY + event.clientY - skillTreeDragStartY;
      clampSkillTreePan();
      updateSkillTreePan();
    });

    function stopSkillTreeDrag(event) {
      if (!skillTreeDragging) return;
      skillTreeDragging = false;
      skillTreeViewport.classList.remove('is-dragging');
      if (event && skillTreeViewport.hasPointerCapture(event.pointerId)) {
        skillTreeViewport.releasePointerCapture(event.pointerId);
      }
    }

    skillTreeViewport.addEventListener('pointerup', stopSkillTreeDrag);
    skillTreeViewport.addEventListener('pointercancel', stopSkillTreeDrag);
  }
  
  if (toggleTreeBtn && statsCardsContainer && treatsTreeContainer) {
    toggleTreeBtn.addEventListener('click', () => {
      const isTreeVisible = treatsTreeContainer.style.display !== 'none';
      if (isTreeVisible) {
        treatsTreeContainer.style.display = 'none';
        statsCardsContainer.style.display = 'grid';
        toggleTreeBtn.textContent = t('showSkillsTree');
      } else {
        treatsTreeContainer.style.display = 'flex';
        statsCardsContainer.style.display = 'none';
        toggleTreeBtn.textContent = t('hideSkillsTree');
        updateSkillTreePan();
      }
    });
  }

  document.querySelectorAll('.about-card').forEach((card) => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      // Close all cards first
      document.querySelectorAll('.about-card').forEach((c) => {
        c.classList.remove('open');
        c.setAttribute('aria-expanded', 'false');
      });
      // If this card was closed, open it; if it was already open, leave it closed
      if (!isOpen) {
        card.classList.add('open');
        card.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const resetCard = document.getElementById('resetCard');
  const resetActions = document.getElementById('resetActions');
  const resetIcon = document.getElementById('resetIcon');
  const confirmReset = document.getElementById('confirmReset');
  const cancelReset = document.getElementById('cancelReset');
  const clearMemoryCard = document.getElementById('clearMemoryCard');
  const clearMemoryActions = document.getElementById('clearMemoryActions');
  const clearMemoryIcon = document.getElementById('clearMemoryIcon');
  const confirmClearMemory = document.getElementById('confirmClearMemory');
  const cancelClearMemory = document.getElementById('cancelClearMemory');

  if (clearMemoryCard && clearMemoryActions) {
    clearMemoryCard.addEventListener('click', (e) => {
      if (e.target.closest('.confirm-box')) return;
      clearMemoryActions.style.display = 'flex';
      clearMemoryIcon.style.display = 'none';
    });

    cancelClearMemory.addEventListener('click', (e) => {
      e.stopPropagation();
      clearMemoryActions.style.display = 'none';
      clearMemoryIcon.style.display = 'block';
    });

    confirmClearMemory.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeLocal('pixelCatSpeechMemoryV1');
      await sendMessageToTabs({ action: 'clearSpeechMemory' });
      clearMemoryActions.style.display = 'none';
      clearMemoryIcon.style.display = 'block';
    });
  }

  if (resetCard && resetActions) {
    resetCard.addEventListener('click', (e) => {
      if (e.target.closest('.confirm-box')) return;
      
      resetActions.style.display = 'flex';
      resetIcon.style.display = 'none';
    });

    cancelReset.addEventListener('click', (e) => {
      e.stopPropagation();
      resetActions.style.display = 'none';
      resetIcon.style.display = 'block';
    });

    confirmReset.addEventListener('click', async (e) => {
      e.stopPropagation();
      await API.storage.local.clear();
      await setLocal(defaultSettings);
      await sendMessageToTabs({ action: defaultSettings.catEnabled ? 'startCat' : 'stopCat' });
      await sendMessageToTabs({ action: defaultSettings.companionEnabled ? 'startCompanion' : 'stopCompanion' });
      await sendMessageToTabs({ action: 'updateSettings', settings: defaultSettings });
      window.location.reload();
    });
  }

  // \u2500\u2500 LIVE XP REFRESH \u2500\u2500
  if (API.storage.onChanged) {
    API.storage.onChanged.addListener((changes) => {
      if (changes.catXP) {
        applyXpUI(changes.catXP.newValue || 0, true);
      }
      if (changes.coins && coinCount) {
        const newVal = changes.coins.newValue || 0;
        coinCount.textContent = newVal.toLocaleString();
        document.querySelectorAll('.shop-buy-btn').forEach(btn => {
           const price = parseInt(btn.textContent.replace(/[^\d]/g, ''), 10);
           if (!isNaN(price) && !btn.classList.contains('owned-btn') && !btn.classList.contains('ball-active-btn') && !btn.classList.contains('set-active-btn')) {
             btn.disabled = newVal < price;
           }
        });
      }
      if ((QuestEngine && changes[QuestEngine.STORAGE_KEY]) || (QuestEngine && changes[QuestEngine.STATS_KEY])) {
        refreshQuests().catch(() => {});
        refreshStats().catch(() => {});
      }
      if (changes.dailyStreak) {
        refreshStats().catch(() => {});
      }
    });
  }

  setActiveTab('essential');
  refresh().catch(() => {});

  //  SHOP SYSTEM 
  const shopBallsView  = document.getElementById('shopBallsView');
  const shopBoostsView = document.getElementById('shopBoostsView');
  const homeBonusBanner = document.getElementById('homeBonusBanner');
  const homeBonusTitle  = document.getElementById('homeBonusTitle');
  const homeBonusSub    = document.getElementById('homeBonusSub');
  const homeBonusIcon   = document.getElementById('homeBonusIcon');
  const homeBonusBtn    = document.getElementById('homeBonusBtn');
  let _shopBallPage = 0; // current ball pagination page

  // Shop sub-tab switching
  document.querySelectorAll('[data-shoptab]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveShopTab(btn.dataset.shoptab);
    });
  });

  // Streak rewards: [day1, day2, day3, day4, day5, day6, day7+]
  const STREAK_REWARDS = [5, 8, 12, 15, 20, 25, 35];

  function getDateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Build a single shop item card
  function buildShopCard(item, coins, owned, activeBall, activeBoosts, container) {
    const isFree    = !!item.free;
    const isOwned   = isFree || owned.includes(item.id);
    const isActive  = item.type === 'ball'
      ? activeBall === item.id
      : isOwned && activeBoosts.includes(item.id);
    const canAfford = coins >= item.price;

    // Card classes
    let cardClass = 'shop-item';
    if (isActive)                     cardClass += ' ball-active';
    else if (isOwned)                 cardClass += ' owned';
    else if (!canAfford && !isOwned)  cardClass += ' cant-afford';
    
    const card = document.createElement('div');
    card.className = cardClass;
    card.dataset.id = item.id;

    // Icon: real <img> for balls, emoji for boosts
    if (item.imgFile) {
      const src = (typeof browser !== 'undefined' ? browser : chrome).runtime.getURL(`assets/balls/${item.imgFile}`);
      const img = document.createElement('img');
      img.className = 'shop-item-img';
      img.src = src;
      img.alt = item.nameKey ? t(item.nameKey) : item.name;
      card.appendChild(img);
    } else {
      const emoji = document.createElement('div');
      emoji.className = 'shop-item-emoji';
      emoji.textContent = item.emoji;
      card.appendChild(emoji);
    }

    // Button label/state
    let btnLabel, btnClass, btnDisabled;
    if (item.type === 'ball') {
      if (isActive) {
        btnLabel = `* ${t('activeItem')}`; btnClass = 'shop-buy-btn ball-active-btn'; btnDisabled = true;
      } else if (isOwned) {
        btnLabel = t('setActive'); btnClass = 'shop-buy-btn set-active-btn'; btnDisabled = false;
      } else if (canAfford) {
        btnLabel = t('buyCoins', { price: item.price }); btnClass = 'shop-buy-btn'; btnDisabled = false;
      } else {
        btnLabel = t('buyCoins', { price: item.price }); btnClass = 'shop-buy-btn'; btnDisabled = true;
      }
    } else {
      // boost
      if (isOwned) {
        btnLabel = isActive ? t('disable') : t('enable');
        btnClass = isActive ? 'shop-buy-btn boost-active-btn' : 'shop-buy-btn set-active-btn';
        btnDisabled = false;
      } else {
        btnLabel = t('buyCoins', { price: item.price }); btnClass = 'shop-buy-btn'; btnDisabled = !canAfford;
      }
    }

    const name = document.createElement('div');
    name.className = 'shop-item-name';
    name.textContent = item.nameKey ? t(item.nameKey) : item.name;
    card.appendChild(name);

    if (item.type !== 'ball' && item.desc) {
      const desc = document.createElement('div');
      desc.className = 'shop-item-desc';
      desc.textContent = item.descKey ? t(item.descKey) : item.desc;
      card.appendChild(desc);
    }

    const btn = document.createElement('button');
    btn.className = btnClass;
    btn.disabled = btnDisabled;
    btn.textContent = btnLabel;
    card.appendChild(btn);
    if (!btnDisabled) {
      btn.addEventListener('click', async () => {
        const result = await updateLocal({ coins: 0, shopOwned: [], shopActiveBoosts: null, activeBall: 'ball_baseball' }, (fresh) => {
          const freshCoins = fresh.coins || 0;
          const freshOwned = Array.isArray(fresh.shopOwned) ? fresh.shopOwned : [];
          const freshActiveBoosts = Array.isArray(fresh.shopActiveBoosts)
            ? fresh.shopActiveBoosts
            : freshOwned.filter(id => SHOP_ITEMS.some(shopItem => shopItem.id === id && shopItem.type === 'boost'));
          const nowOwned = item.free || freshOwned.includes(item.id);

          if (item.type === 'ball') {
            if (nowOwned) {
              return {
                values: { activeBall: item.id },
                settings: { activeBall: item.id }
              };
            }
            if (freshCoins < item.price) return null;
            const newOwned = [...freshOwned, item.id];
            return {
              values: { coins: freshCoins - item.price, shopOwned: newOwned, activeBall: item.id },
              settings: { activeBall: item.id, shopOwned: newOwned }
            };
          }

          if (nowOwned) {
            const activeSet = new Set(freshActiveBoosts);
            if (activeSet.has(item.id)) activeSet.delete(item.id);
            else activeSet.add(item.id);
            const nextActive = Array.from(activeSet);
            return {
              values: { shopActiveBoosts: nextActive },
              settings: { shopActiveBoosts: nextActive }
            };
          }

          if (freshCoins < item.price) return null;
          const newOwned = [...freshOwned, item.id];
          const newActive = Array.from(new Set([...freshActiveBoosts, item.id]));
          return {
            values: { coins: freshCoins - item.price, shopOwned: newOwned, shopActiveBoosts: newActive },
            settings: { shopOwned: newOwned, shopActiveBoosts: newActive }
          };
        });

        if (!result) return;
        if (result.settings) {
          sendMessageToTabs({ action: 'updateSettings', settings: result.settings }).catch(() => {});
        }

        card.classList.add('just-bought');
        setTimeout(() => card.classList.remove('just-bought'), 500);
        await refreshShop();
      });
    }

    container.appendChild(card);
    return card;
  }

  async function performStreakClaim() {
    const today = getDateKey();
    const result = await updateLocal({ coins: 0, dailyStreak: 0, lastStreakDate: '' }, (data) => {
      if (data.lastStreakDate === today) return null;

      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      const isConsecutive = data.lastStreakDate === yKey;
      const newStreak = isConsecutive ? (data.dailyStreak || 0) + 1 : 1;
      const rewardIdx = Math.min((data.dailyStreak || 0), STREAK_REWARDS.length - 1);
      const reward = STREAK_REWARDS[rewardIdx];
      const newCoins = (data.coins || 0) + reward;

      return {
        values: { coins: newCoins, dailyStreak: newStreak, lastStreakDate: today },
        coins: newCoins
      };
    });
    if (!result) return;
    await refreshShop();
    // Sync coin display on home tab
    if (coinCount) coinCount.textContent = result.coins.toLocaleString();
  }

  async function refreshShop() {
    const data = await getLocal({ coins: 0, shopOwned: [], shopActiveBoosts: null, dailyStreak: 0, lastStreakDate: '', activeBall: 'ball_baseball' });
    const coins      = data.coins || 0;
    const owned      = data.shopOwned || [];
    const activeBoosts = Array.isArray(data.shopActiveBoosts)
      ? data.shopActiveBoosts
      : owned.filter(id => SHOP_ITEMS.some(item => item.id === id && item.type === 'boost'));
    const streak     = data.dailyStreak || 0;
    const lastDate   = data.lastStreakDate || '';
    const activeBall = data.activeBall || 'ball_baseball';
    const today      = getDateKey();

    const alreadyClaimed = lastDate === today;
    const rewardIdx  = Math.min(streak, STREAK_REWARDS.length - 1);
    const nextReward = STREAK_REWARDS[rewardIdx];

    // --- Home banner ---
    if (homeBonusBanner) {
      if (!alreadyClaimed) {
        homeBonusBanner.style.display = 'flex';
        if (homeBonusTitle) homeBonusTitle.textContent = t('dailyBonusReady');
        if (homeBonusSub) homeBonusSub.textContent = t('claimCoinsToday', { count: nextReward });
        if (homeBonusBtn) homeBonusBtn.textContent = t('coinsAmount', { count: nextReward });
      } else {
        homeBonusBanner.style.transition = 'opacity 0.35s ease';
        homeBonusBanner.style.opacity = '0';
        setTimeout(() => { homeBonusBanner.style.display = 'none'; homeBonusBanner.style.opacity = ''; }, 380);
      }
    }

    // --- Render Balls grid with pagination ---
    if (shopBallsView) {
      shopBallsView.replaceChildren();
      const allBalls = SHOP_ITEMS.filter(i => i.type === 'ball');
      const PAGE_SIZE = 4;
      const totalPages = Math.ceil(allBalls.length / PAGE_SIZE);
      if (_shopBallPage >= totalPages) _shopBallPage = Math.max(0, totalPages - 1);
      const pageBalls = allBalls.slice(_shopBallPage * PAGE_SIZE, (_shopBallPage + 1) * PAGE_SIZE);

      // Add items with a tiny staggered delay for premium feel
      pageBalls.forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activeBoosts, shopBallsView);
        card.style.animationDelay = `${idx * 40}ms`;
      });

      // Pagination row (always shown if more than 1 page)
      if (totalPages > 1) {
        const nav = document.createElement('div');
        nav.className = 'ball-page-nav';
        const prev = document.createElement('button');
        prev.className = 'ball-page-btn';
        prev.id = 'ballPrev';
        prev.disabled = _shopBallPage === 0;
        prev.textContent = '<';
        const label = document.createElement('span');
        label.className = 'ball-page-label';
        label.textContent = `${_shopBallPage + 1} / ${totalPages}`;
        const next = document.createElement('button');
        next.className = 'ball-page-btn';
        next.id = 'ballNext';
        next.disabled = _shopBallPage >= totalPages - 1;
        next.textContent = '>';
        nav.append(prev, label, next);
        shopBallsView.appendChild(nav);
        prev.addEventListener('click', () => {
          if (_shopBallPage > 0) { _shopBallPage--; refreshShop(); }
        });
        next.addEventListener('click', () => {
          if (_shopBallPage < totalPages - 1) { _shopBallPage++; refreshShop(); }
        });
      }
    }

    // --- Render Boosts grid ---
    if (shopBoostsView) {
      shopBoostsView.replaceChildren();
      SHOP_ITEMS.filter(i => i.type === 'boost').forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activeBoosts, shopBoostsView);
        card.style.animationDelay = `${idx * 40}ms`;
      });
    }
  }

  // Home banner claim button
  if (homeBonusBtn) {
    homeBonusBtn.addEventListener('click', performStreakClaim);
  }

  // Refresh shop when shop tab is opened
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'shop') refreshShop().catch(() => {});
    });
  });

  // Sync when storage changes
  if (API.storage && API.storage.onChanged) {
    API.storage.onChanged.addListener((changes) => {
      if (changes.coins || changes.shopOwned || changes.shopActiveBoosts || changes.dailyStreak || changes.lastStreakDate) {
        refreshShop().catch(() => {});
      }
    });
  }

  refreshShop().catch(() => {});
})();
