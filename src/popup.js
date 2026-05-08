(function() {
  const API = typeof browser !== 'undefined' ? browser : chrome;
  const QuestEngine = globalThis.PixelCatQuests || null;
  const FairPlay = globalThis.PixelCatFairPlay || null;

  const defaultSettings = {
    catEnabled: true,
    companionEnabled: false,
    loyalMode: false,
    aggressiveMode: true,
    speedMultiplier: 1.0,
    catSkin: 'white',
    uiMischiefEnabled: false,
    speechEnabled: false,
    memoryEnabled: false,
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
    activePet: 'pet_cat',
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
      balls: 'Balls', boosts: 'Boosts', pets: 'Pets',
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
      hideFullscreen: 'Masquer plein écran', language: 'Langue', lowPowerMode: 'Mode éco',
      level5needed: 'Niveau 5 requis', pageMischief: 'Espièglerie de page', rareEvents: 'Événements rares',
      requiresLevel5: 'Niveau 5 requis', mischiefRate: 'Taux de bêtises',
      size: 'Taille', sizeWarning: 'Risque de bug',
      clearMemory: 'Effacer la mémoire', resetProgress: 'Réinitialiser la progression',
      balls: 'Balles', boosts: 'Boosts', pets: 'Animaux',
    },
    it: {
      "coins": "Monete",
      "xpHint": "Dai pesci o gioca a palla per guadagnare XP",
      "dailyBonusReady": "Bonus giornaliero pronto!",
      "tapToClaim": "Tocca per reclamare le tue monete",
      "claim": "Riscatta",
      "level4needed": "Livello 4 richiesto",
      "companion": "Compagno",
      "loyalMode": "Modalità fedele",
      "catSkin": "Skin gatto",
      "quests": "Missioni",
      "achievements": "Obiettivi",
      "dailyQuests": "Missioni giornaliere",
      "energyLevel": "Livello energia",
      "affectsSpeed": "Influisce sulla velocità di movimento",
      "sleepy": "Sonnolento",
      "active": "Attivo",
      "autoSpawn": "Spawn automatico",
      "aggressiveMode": "Modalità aggressiva",
      "basic": "Base",
      "advanced": "Avanzato",
      "danger": "Pericolo",
      "speed": "Velocità",
      "requiresLevel2": "Richiede livello 2",
      "speechBubbles": "Fumetti",
      "smartMemory": "Memoria intelligente",
      "hideFullscreen": "Nascondi a schermo intero",
      "language": "Lingua",
      "lowPowerMode": "Modalità risparmio",
      "level5needed": "Livello 5 richiesto",
      "pageMischief": "Dispetti pagina",
      "rareEvents": "Eventi rari",
      "requiresLevel5": "Richiede livello 5",
      "mischiefRate": "Tasso dispetti",
      "size": "Dimensione",
      "sizeWarning": "Potrebbe causare comportamenti strani",
      "clearMemory": "Cancella memoria",
      "resetProgress": "Reimposta progressi",
      "balls": "Palle",
      "boosts": "Boost",
      "pets": "Animali"
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
      balls: 'كرات', boosts: 'مُعززات', pets: 'حيوانات',
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
      petCat: 'Cat', petFox: 'Fox',
      boostFeather: 'Feather Wand', boostFeatherDesc: '+2 coins per pet', boostTreat: 'Golden Treat',
      boostTreatDesc: 'Double fish coins', boostMagnet: 'Coin Magnet', boostMagnetDesc: 'Pulls nearby coins to the cat',
      boostLucky: 'Lucky Charm', boostLuckyDesc: 'More frequent drops',
      questPet: 'Pet Session', questFish: 'Give Fish', questWatch: 'Watch Together', questCoins: 'Collect Coins',
      questFetch: 'Play Fetch', questSpiders: 'Catch Spiders', questDoubleAffection: 'Double Affection',
      questFishFeast: 'Fish Feast', questLongSession: 'Long Session',
      showToggleInfo: 'Show setting info', hideToggleInfo: 'Hide setting info',
      infoCompanion: 'Adds a second cat when unlocked.',
      infoLoyal: 'Makes the cat follow your cursor.',
      infoAggressive: 'Makes reactions and spider fights bolder.',
      infoSpeech: 'Lets the cat talk in speech bubbles.',
      infoMemory: 'Remembers simple moments for better reactions.',
      infoFullscreen: 'Hides PixelCat during fullscreen videos.',
      infoLowPower: 'Less animation, smoother mode.',
      infoMischief: 'Allows small playful page interactions.',
      infoRareEvents: 'Enables occasional surprise events.',
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
      petCat: 'Chat', petFox: 'Renard',
      boostFeather: 'Baguette plume', boostFeatherDesc: '+2 pièces par caresse', boostTreat: 'Friandise dorée',
      boostTreatDesc: 'Pièces poisson x2', boostMagnet: 'Aimant à pièces', boostMagnetDesc: 'Attire les pièces',
      boostLucky: 'Porte-bonheur', boostLuckyDesc: 'Butins fréquents',
      questPet: 'Session câlin', questFish: 'Donner du poisson', questWatch: 'Regarder ensemble', questCoins: 'Collecter des pièces',
      questFetch: 'Jouer à rapporter', questSpiders: 'Attraper des araignées', questDoubleAffection: 'Double affection',
      questFishFeast: 'Festin de poisson', questLongSession: 'Longue session',
      showToggleInfo: 'Voir l’info', hideToggleInfo: 'Masquer l’info',
      infoCompanion: 'Ajoute un deuxième chat une fois débloqué.',
      infoLoyal: 'Le chat suit votre curseur.',
      infoAggressive: 'Réactions et combats plus audacieux.',
      infoSpeech: 'Active les bulles de dialogue du chat.',
      infoMemory: 'Retient de petits moments pour mieux réagir.',
      infoFullscreen: 'Cache PixelCat en plein écran.',
      infoLowPower: 'Moins d’animations, plus fluide.',
      infoMischief: 'Autorise de petites interactions avec la page.',
      infoRareEvents: 'Active des surprises occasionnelles.',
      confirm: 'Confirmer', cancel: 'Annuler', openInfo: 'Ouvrir les infos'
    },
    it: {
      "disabled": "Disattivato",
      "fish": "Pesce",
      "ball": "Palla",
      "spider": "Ragno",
      "portal": "Portale",
      "hyper": "Iper",
      "about": "Info",
      "stats": "Statistiche",
      "unavailable": "Non disponibile",
      "objectivesUnavailable": "Obiettivi non disponibili in questa sessione.",
      "remaining": "{time} rimanenti",
      "streak": "Serie: {count}",
      "complete": "Completo",
      "allObjectivesComplete": "Tutti gli obiettivi completati. {count} completati in totale.",
      "remainingToday": "{remaining} rimanenti oggi. {count} completati in totale.",
      "level": "Livello {level}",
      "xpProgress": "{current} / {needed} XP",
      "requires": "Richiede {level}",
      "unlockSpeechBall": "Raggiungi il livello 2 per sbloccare fumetti e palla",
      "unlockSpiders": "Raggiungi il livello 3 per sbloccare i ragni",
      "unlockCompanion": "Raggiungi il livello 5 per sbloccare il gatto compagno",
      "unlockSize": "Raggiungi il livello 4 per sbloccare la dimensione",
      "unlockMischief": "Raggiungi il livello 6 per sbloccare i dispetti pagina",
      "unlockPortals": "Raggiungi il livello 7 per sbloccare i portali",
      "unlockHyper": "Raggiungi il livello 8 per sbloccare energia iper",
      "level9Hint": "Livello 9 - Quasi un compagno maestro!",
      "level10Hint": "Livello 10 - Livello massimo raggiunto!",
      "maxLevel": "Livello massimo! Tutte le funzioni sbloccate.",
      "showSkillsTree": "Mostra albero abilità",
      "hideSkillsTree": "Nascondi albero abilità",
      "aboutPixelCatTitle": "Che cos è PixelCat?",
      "aboutPixelCatBody": "Un pet pixel per YouTube, creato da IMAD. Gira, gioca e cresce mentre guardi video.",
      "aboutLevelsTitle": "Come funzionano i livelli",
      "aboutLevelsBody": "Guadagna XP accarezzando, nutrendo e giocando. Sali di livello per sbloccare nuove funzioni.",
      "aboutCoinsTitle": "Guadagnare monete",
      "aboutCoinsBody": "Le monete cadono durante il gioco. Cliccale per raccoglierle! Apri il popup per il bonus giornaliero.",
      "aboutQuestsTitle": "Missioni giornaliere",
      "aboutQuestsBody": "Completa 3 attività ogni giorno per ottenere ricompense e mantenere la serie.",
      "aboutAchievementsTitle": "Obiettivi",
      "aboutAchievementsBody": "Ottieni badge per traguardi speciali, come la prima carezza o tanti ragni catturati.",
      "aboutSpawningTitle": "Generazione oggetti",
      "aboutSpawningBody": "Usa Spawn automatico per far cadere pesci, palle o ragni con cui il gatto può giocare.",
      "aboutShopTitle": "Shop e boost",
      "aboutShopBody": "Usa le monete per comprare nuove skin per le palle e boost permanenti.",
      "aboutTipsTitle": "Consigli",
      "aboutTipsBody": "Accarezza il gatto dopo che mangia per un bonus. Usa Modalità fedele per farlo seguire il mouse.",
      "supportPixelCat": "Supporta PixelCat",
      "supportKoFi": "Supporta PixelCat su Ko-fi",
      "statFishEaten": "Pesci mangiati",
      "statSpidersCaught": "Ragni catturati",
      "statPetSessions": "Sessioni carezze",
      "statCoinsCollected": "Monete raccolte",
      "statBallCatches": "Prese palla",
      "statQuestsDone": "Missioni completate",
      "statPerfectDays": "Giorni perfetti",
      "statDailyStreak": "Serie giornaliera",
      "skillsTree": "Albero abilità",
      "dragTree": "Trascina l albero per esplorare",
      "basicInstincts": "Istinti base",
      "core": "Base",
      "speechBubble": "Fumetto",
      "fishHunt": "Caccia al pesce",
      "wallNinja": "Ninja sul muro",
      "sizeWeight": "Dimensione e peso",
      "petBond": "Legame pet",
      "ballChaser": "Cacciatore di palla",
      "spiderHunter": "Cacciatore di ragni",
      "companionMode": "Modalità compagno",
      "portalTraveler": "Viaggiatore portali",
      "hyperEnergy": "Energia iper",
      "madeBy": "Creato da",
      "firstFriend": "Primo amico",
      "hundredPets": "100 carezze",
      "sevenDayStreak": "Serie 7 giorni",
      "masterMischief": "Maestro dei dispetti",
      "buyCoins": "{price} monete",
      "activeItem": "Attivo",
      "setActive": "Rendi attivo",
      "enable": "Attiva",
      "disable": "Disattiva",
      "claimCoinsToday": "Riscatta +{count} monete oggi",
      "coinsAmount": "+{count} monete",
      "ballBaseball": "Baseball",
      "ballTennis": "Palla da tennis",
      "ballGolf": "Palla da golf",
      "ballBasketball": "Basketball",
      "ballFootball": "Pallone",
      "ballVolleyball": "Pallavolo",
      "ballBowling": "Palla da bowling",
      "petCat": "Gatto",
      "petFox": "Volpe",
      "boostFeather": "Bacchetta piuma",
      "boostFeatherDesc": "+2 monete per carezza",
      "boostTreat": "Dolcetto dorato",
      "boostTreatDesc": "Monete pesce doppie",
      "boostMagnet": "Magnete monete",
      "boostMagnetDesc": "Attira monete vicine al gatto",
      "boostLucky": "Portafortuna",
      "boostLuckyDesc": "Drop più frequenti",
      "questPet": "Sessione coccole",
      "questFish": "Dai un pesce",
      "questWatch": "Guarda insieme",
      "questCoins": "Raccogli monete",
      "questFetch": "Gioca al riporto",
      "questSpiders": "Cattura ragni",
      "questDoubleAffection": "Doppio affetto",
      "questFishFeast": "Banchetto di pesce",
      "questLongSession": "Sessione lunga",
      "showToggleInfo": "Mostra info impostazione",
      "hideToggleInfo": "Nascondi info impostazione",
      "infoCompanion": "Aggiunge un secondo gatto quando sbloccato.",
      "infoLoyal": "Fa seguire il cursore al gatto.",
      "infoAggressive": "Rende reazioni e lotte con ragni più forti.",
      "infoSpeech": "Permette al gatto di parlare con i fumetti.",
      "infoMemory": "Ricorda piccoli momenti per reazioni migliori.",
      "infoFullscreen": "Nasconde PixelCat durante i video a schermo intero.",
      "infoLowPower": "Meno animazione, modalità più fluida.",
      "infoMischief": "Permette piccole interazioni giocose con la pagina.",
      "infoRareEvents": "Attiva eventi sorpresa occasionali.",
      "confirm": "Conferma",
      "cancel": "Annulla",
      "openInfo": "Apri info"
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
      petCat: 'قطة', petFox: 'ثعلب',
      boostFeather: 'عصا الريشة', boostFeatherDesc: '+2 عملات لكل مداعبة', boostTreat: 'حلوى ذهبية',
      boostTreatDesc: 'عملات السمك x2', boostMagnet: 'مغناطيس العملات', boostMagnetDesc: 'يجذب العملات',
      boostLucky: 'تميمة الحظ', boostLuckyDesc: 'إسقاطات أكثر',
      questPet: 'جلسة مداعبة', questFish: 'قدّم السمك', questWatch: 'شاهدوا معاً', questCoins: 'اجمع العملات',
      questFetch: 'العب جلب الكرة', questSpiders: 'اصطد العناكب', questDoubleAffection: 'عاطفة مضاعفة',
      questFishFeast: 'وليمة سمك', questLongSession: 'جلسة طويلة',
      showToggleInfo: 'إظهار المعلومات', hideToggleInfo: 'إخفاء المعلومات',
      infoCompanion: 'يضيف قطاً ثانياً بعد فتحه.',
      infoLoyal: 'يجعل القط يتبع المؤشر.',
      infoAggressive: 'يجعل ردود الفعل أقوى.',
      infoSpeech: 'يفعّل فقاعات كلام القط.',
      infoMemory: 'يتذكر لحظات بسيطة لتحسين التفاعل.',
      infoFullscreen: 'يخفي PixelCat في وضع ملء الشاشة.',
      infoLowPower: 'حركات أقل، أداء أفضل.',
      infoMischief: 'يسمح بتفاعلات صغيرة مع الصفحة.',
      infoRareEvents: 'يفعّل مفاجآت نادرة أحياناً.',
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
    // - PETS -
    { id: 'pet_cat', imgFile: 'cat_icon.png', name: 'Cat', nameKey: 'petCat', price: 0, type: 'pet', free: true },
    { id: 'pet_fox', imgFile: 'fox_icon.png', name: 'Fox', nameKey: 'petFox', price: 50, type: 'pet' },
    // - BOOSTS -
    { id: 'toy_feather',  emoji: '✨', name: 'Feather Wand',  nameKey: 'boostFeather', desc: '+2 coins per pet',        descKey: 'boostFeatherDesc', price: 30,  type: 'boost', effect: 'petCoins' },
    { id: 'treat_gold',   emoji: '🍖', name: 'Golden Treat',  nameKey: 'boostTreat',   desc: 'Double fish coins',       descKey: 'boostTreatDesc',   price: 50,  type: 'boost', effect: 'fishCoins' },
    { id: 'coin_magnet',  emoji: '🧲', name: 'Coin Magnet',   nameKey: 'boostMagnet',  desc: 'Pulls nearby coins to the cat', descKey: 'boostMagnetDesc', price: 80,  type: 'boost', effect: 'coinMagnet' },
    { id: 'lucky_charm',  emoji: '🍀', name: 'Lucky Charm',   nameKey: 'boostLucky',   desc: 'More frequent drops',     descKey: 'boostLuckyDesc',   price: 100, type: 'boost', effect: 'luckyDrops' },
  ];

  //  LEVEL / XP MILESTONE DEFINITIONS  (10-level system)
  // Per-level XP to earn: 10, 15, 20, 25, 30, 35, 40, 45, 50
  // Cumulative totals:     0, 10, 25, 45, 70, 100, 135, 175, 220, 270
  const MAX_LEVEL_XP = 270;
  const MILESTONES = {
    speech:          { xp: 10,  level: 2,  label: 'Level 2'  },
    ball:            { xp: 10,  level: 2,  label: 'Level 2'  },
    spider:          { xp: 25,  level: 3,  label: 'Level 3'  },
    rainbowSkin:     { xp: 25,  level: 3,  label: 'Level 3'  },
    size:            { xp: 45,  level: 4,  label: 'Level 4'  },
    companion:       { xp: 70,  level: 5,  label: 'Level 5'  },
    uiMischief:      { xp: 100, level: 6,  label: 'Level 6'  },
    mischiefRate:    { xp: 100, level: 6,  label: 'Level 6'  },
    portal:          { xp: 135, level: 7,  label: 'Level 7'  },
    hyper:           { xp: 175, level: 8,  label: 'Level 8'  },
  };

  const toggle = document.getElementById('toggle');
  const statusText = document.getElementById('status-text');
  const dot = document.getElementById('dot');
  const loyalToggle = document.getElementById('loyalToggle');
  const companionToggle = document.getElementById('companionToggle');
  const aggroToggle = document.getElementById('aggroToggle');
  const aggroRow = aggroToggle ? aggroToggle.closest('.control-row') : null;
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
  const skinSelect = document.getElementById('skinSelect');
  const skinRow = skinSelect ? skinSelect.closest('.control-row') : null;
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
  let latestActivePet = defaultSettings.activePet;
  let latestDailyStreak = 0;
  let latestAchievementStats = {};

  const TOGGLE_INFO_ITEMS = [
    { toggleId: 'companionToggle', key: 'infoCompanion' },
    { toggleId: 'loyalToggle', key: 'infoLoyal' },
    { toggleId: 'aggroToggle', key: 'infoAggressive' },
    { toggleId: 'speechToggle', key: 'infoSpeech' },
    { toggleId: 'memoryToggle', key: 'infoMemory' },
    { toggleId: 'hideInFullscreenToggle', key: 'infoFullscreen' },
    { toggleId: 'lowPowerToggle', key: 'infoLowPower' },
    { toggleId: 'uiMischiefToggle', key: 'infoMischief' },
    { toggleId: 'rareEventsToggle', key: 'infoRareEvents' }
  ];

  setupToggleInfoButtons();

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
    if (FairPlay && typeof FairPlay.hasProtectedKey === 'function' && FairPlay.hasProtectedKey(keys)) {
      return FairPlay.ensure(API.storage.local, keys);
    }
    if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
      return API.storage.local.get(keys);
    }
    return new Promise((resolve) => API.storage.local.get(keys, resolve));
  }

  function setLocal(data) {
    if (FairPlay && typeof FairPlay.hasProtectedKey === 'function' && FairPlay.hasProtectedKey(data)) {
      return FairPlay.commit(API.storage.local, data);
    }
    if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1) {
      return API.storage.local.set(data);
    }
    return new Promise((resolve) => API.storage.local.set(data, resolve));
  }

  function getQuestStorageArea() {
    if (!FairPlay || typeof FairPlay.ensure !== 'function' || typeof FairPlay.commit !== 'function') {
      return API.storage.local;
    }
    return {
      get: (defaults) => FairPlay.ensure(API.storage.local, defaults),
      set: (values) => FairPlay.commit(API.storage.local, values)
    };
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
    const shopPetsView = document.getElementById('shopPetsView');
    const shopBoostsView = document.getElementById('shopBoostsView');
    if (shopBallsView) shopBallsView.style.display = shoptab === 'balls' ? 'grid' : 'none';
    if (shopPetsView) shopPetsView.style.display = shoptab === 'pets' ? 'grid' : 'none';
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

  const toggleInfoAutoHideTimers = new Map();

  function syncToggleInfoState(button, panel, isOpen) {
    if (!button || !panel) return;
    panel.hidden = !isOpen;
    button.classList.toggle('active', isOpen);
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const titleKey = isOpen ? 'hideToggleInfo' : 'showToggleInfo';
    button.title = t(titleKey);
    button.setAttribute('aria-label', t(titleKey));
    const ownerRow = panel._ownerRow || null;
    if (ownerRow) ownerRow.classList.toggle('info-open', isOpen);
  }

  function clearToggleInfoTimer(button) {
    const existing = toggleInfoAutoHideTimers.get(button);
    if (existing) {
      clearTimeout(existing);
      toggleInfoAutoHideTimers.delete(button);
    }
  }

  function scheduleToggleInfoAutoHide(button, panel) {
    clearToggleInfoTimer(button);
    const timer = setTimeout(() => {
      syncToggleInfoState(button, panel, false);
      toggleInfoAutoHideTimers.delete(button);
    }, 3000);
    toggleInfoAutoHideTimers.set(button, timer);
  }

  function closeOtherToggleInfo(activeButton, activePanel) {
    document.querySelectorAll('.toggle-info-panel').forEach((panel) => {
      const button = document.querySelector(`.toggle-info-btn[data-info-for="${panel.dataset.infoPanelFor}"]`);
      if (panel !== activePanel) {
        if (button) clearToggleInfoTimer(button);
        syncToggleInfoState(button, panel, false);
      }
    });
    document.querySelectorAll('.toggle-info-btn').forEach((button) => {
      if (button !== activeButton && !toggleInfoAutoHideTimers.has(button)) {
        button.title = t('showToggleInfo');
        button.setAttribute('aria-label', t('showToggleInfo'));
      }
    });
  }

  function setupToggleInfoButtons() {
    TOGGLE_INFO_ITEMS.forEach(({ toggleId, key }) => {
      const input = document.getElementById(toggleId);
      const switchEl = input ? input.closest('.switch') : null;
      const row = input ? input.closest('.control-row') : null;
      const label = row ? row.querySelector('.control-label') : null;
      if (!input || !switchEl || !row || !label) return;
      if (label.querySelector('.control-desc:not(.toggle-info-line)')) return;
      if (document.querySelector(`[data-info-for="${toggleId}"]`)) return;

      const parentContainer = row.parentElement;
      const insideCard = !!(parentContainer && (parentContainer.classList.contains('locked-card') || parentContainer.classList.contains('warning-card')));
      let infoGroup = null;
      if (!insideCard) {
        infoGroup = row.closest('.toggle-info-group');
        if (!infoGroup) {
          infoGroup = document.createElement('div');
          infoGroup.className = 'toggle-info-group';
          parentContainer.insertBefore(infoGroup, row);
          infoGroup.appendChild(row);
        }
      }

      const infoPanel = document.createElement('div');
      infoPanel.className = 'toggle-info-panel';
      infoPanel.dataset.infoPanelFor = toggleId;
      infoPanel.hidden = true;
      infoPanel._ownerRow = row;

      const infoText = document.createElement('span');
      infoText.className = 'toggle-info-panel-text';
      infoText.dataset.i18n = key;
      infoText.textContent = t(key);
      infoPanel.appendChild(infoText);

      const infoButton = document.createElement('button');
      infoButton.type = 'button';
      infoButton.className = 'toggle-info-btn';
      infoButton.dataset.infoFor = toggleId;
      infoButton.dataset.infoKey = key;
      infoButton.textContent = '?';
      infoButton.title = t('showToggleInfo');
      infoButton.setAttribute('aria-label', t('showToggleInfo'));
      infoButton.setAttribute('aria-expanded', 'false');
      infoButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const shouldOpen = infoPanel.hidden;
        closeOtherToggleInfo(infoButton, infoPanel);
        syncToggleInfoState(infoButton, infoPanel, shouldOpen);
        if (shouldOpen) {
          scheduleToggleInfoAutoHide(infoButton, infoPanel);
        } else {
          clearToggleInfoTimer(infoButton);
        }
      });

      row.insertBefore(infoButton, switchEl);
      if (insideCard) {
        row.parentNode.insertBefore(infoPanel, row.nextSibling);
      } else if (infoGroup) {
        infoGroup.appendChild(infoPanel);
      }
    });

    refreshToggleInfoText();
  }

  function refreshToggleInfoText() {
    document.querySelectorAll('.toggle-info-panel-text').forEach((line) => {
      const key = line.dataset.i18n;
      if (key) line.textContent = t(key);
    });
    document.querySelectorAll('.toggle-info-btn').forEach((button) => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      const titleKey = isOpen ? 'hideToggleInfo' : 'showToggleInfo';
      button.title = t(titleKey);
      button.setAttribute('aria-label', t(titleKey));
    });
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
        el.textContent = t(key) + ' ';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = 'IMAD';
        el.appendChild(nameSpan);
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

    refreshToggleInfoText();
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
      refreshQuests().catch(() => renderQuestPanel(null));
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

  function applyPetSpecificLocks(activePet) {
    const foxActive = activePet === 'pet_fox';
    const companionUnlocked = latestXP >= MILESTONES.companion.xp;
    const mischiefUnlocked = latestXP >= MILESTONES.uiMischief.xp;
    const mischiefRateUnlocked = latestXP >= MILESTONES.mischiefRate.xp;

    if (companionToggle) {
      companionToggle.disabled = foxActive || !companionUnlocked;
      if (foxActive || !companionUnlocked) companionToggle.checked = false;
    }
    if (companionSwitchWrap) companionSwitchWrap.classList.toggle('control-locked', foxActive || !companionUnlocked);
    if (companionRow) companionRow.classList.toggle('control-locked', foxActive || !companionUnlocked);

    if (skinSelect) skinSelect.classList.toggle('control-locked', foxActive);
    if (skinRow) skinRow.classList.toggle('control-locked', foxActive);
    document.querySelectorAll('.color-box').forEach((box) => {
      if (foxActive) {
        box.classList.add('skin-locked');
        box.classList.remove('active');
        box.setAttribute('aria-disabled', 'true');
        box.title = 'Cat-only while fox is active';
      }
    });

    if (aggroToggle) {
      aggroToggle.disabled = foxActive;
      if (foxActive) aggroToggle.checked = false;
    }
    if (aggroRow) aggroRow.classList.toggle('control-locked', foxActive);

    if (uiMischiefToggle) {
      uiMischiefToggle.disabled = foxActive || !mischiefUnlocked;
      if (foxActive || !mischiefUnlocked) uiMischiefToggle.checked = false;
    }
    if (mischiefSwitchWrap) mischiefSwitchWrap.classList.toggle('control-locked', foxActive || !mischiefUnlocked);
    if (mischiefRow) mischiefRow.classList.toggle('control-locked', foxActive || !mischiefUnlocked);
    if (mischiefMinus) mischiefMinus.disabled = foxActive || !mischiefRateUnlocked;
    if (mischiefPlus) mischiefPlus.disabled = foxActive || !mischiefRateUnlocked;
    if (mischiefRateRow) mischiefRateRow.classList.toggle('control-locked', foxActive || !mischiefRateUnlocked);
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

  function getLevelFromXP(value) {
    const xp = Math.min(MAX_LEVEL_XP, Math.max(0, Number(value) || 0));
    if (xp >= 270) return 10;
    if (xp >= 220) return 9;
    if (xp >= 175) return 8;
    if (xp >= 135) return 7;
    if (xp >= 100) return 6;
    if (xp >= 70)  return 5;
    if (xp >= 45)  return 4;
    if (xp >= 25)  return 3;
    if (xp >= 10)  return 2;
    return 1;
  }

  function getLevelProgress(value) {
    const totalXP = Math.min(MAX_LEVEL_XP, Math.max(0, Number(value) || 0));
    const level = getLevelFromXP(totalXP);
    const levelStarts = {
      1: 0,    2: 10,   3: 25,   4: 45,   5: 70,
      6: 100,  7: 135,  8: 175,  9: 220,  10: 270
    };
    const levelEnds = {
      1: 10,   2: 25,   3: 45,   4: 70,   5: 100,
      6: 135,  7: 175,  8: 220,  9: 270,  10: 270
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
    const foxActive = data.activePet === 'pet_fox';

    if (xp < MILESTONES.speech.xp && data.speechEnabled) patch.speechEnabled = false;
    if (xp < MILESTONES.ball.xp && data.ballEnabled) patch.ballEnabled = false;
    if (xp < MILESTONES.spider.xp && data.spiderEnabled) patch.spiderEnabled = false;
    if (xp < MILESTONES.rainbowSkin.xp && data.catSkin === 'rainbow') patch.catSkin = 'white';
    if (xp < MILESTONES.size.xp && Number(data.sizeMultiplier) !== 1.0) patch.sizeMultiplier = 1.0;
    if ((xp < MILESTONES.companion.xp || foxActive) && data.companionEnabled) patch.companionEnabled = false;
    if ((xp < MILESTONES.uiMischief.xp || foxActive) && data.uiMischiefEnabled) patch.uiMischiefEnabled = false;
    if (foxActive && data.aggressiveMode) patch.aggressiveMode = false;
    if (xp < MILESTONES.hyper.xp && data.catEnergyLevel === 'hyper') patch.catEnergyLevel = 'active';
    if (xp < MILESTONES.portal.xp && data.portalEnabled) patch.portalEnabled = false;
    return patch;
  }

  async function forceCatOnlySettingsOffForFox(activePet) {
    if (activePet !== 'pet_fox') return;
    const patch = { companionEnabled: false, aggressiveMode: false, uiMischiefEnabled: false };
    await setLocal(patch);
    await sendMessageToTabs({ action: 'stopCompanion' });
    await sendMessageToTabs({ action: 'updateSettings', settings: patch });
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
    if (dailyQuestsView && !dailyQuestsView.style.display) {
      dailyQuestsView.style.display = 'flex';
    }

    if (!questList) return;

    if (!snapshot) {
      if (questResetText) questResetText.textContent = t('unavailable');
      if (questCompletedValue) questCompletedValue.textContent = '--';
      if (questPerfectDaysValue) questPerfectDaysValue.textContent = '--';
      const empty = document.createElement('div');
      empty.className = 'quest-empty-card';
      empty.textContent = t('objectivesUnavailable') || 'Quests are not available right now. Reopen the popup to refresh.';
      questList.replaceChildren(empty);
      return;
    }

    // Update achievements based on lifetime stats
    updateAchievements(snapshot.stats);

    const remainingCount = Math.max(0, snapshot.totalCount - snapshot.completedCount);
    const overallPct = snapshot.totalCount > 0 ? Math.round((snapshot.completedCount / snapshot.totalCount) * 100) : 0;

    if (questResetText) questResetText.textContent = t('remaining', { time: formatResetCountdown(snapshot.secondsUntilReset) });
    if (questCompletedValue) questCompletedValue.textContent = `${snapshot.completedCount} / ${snapshot.totalCount}`;
    if (questPerfectDaysValue) questPerfectDaysValue.textContent = t('streak', { count: snapshot.stats.perfectDays });
    

    if (!Array.isArray(snapshot.quests) || snapshot.quests.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'quest-empty-card';
      empty.textContent = t('objectivesUnavailable') || 'No quests available right now. Reopen the popup to refresh.';
      questList.replaceChildren(empty);
      return;
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

    try {
      const snapshot = await QuestEngine.getSnapshot(getQuestStorageArea());
      renderQuestPanel(snapshot);
    } catch (error) {
      // Self-heal older or partially protected installs: fall back to raw local storage once.
      try {
        const snapshot = await QuestEngine.getSnapshot(API.storage.local);
        renderQuestPanel(snapshot);
      } catch (_) {
        renderQuestPanel(null);
      }
    }
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
    } else if (pct < 25) {
      xpHint.textContent = t('unlockSpiders');
    } else if (pct < 45) {
      xpHint.textContent = t('unlockSize');
    } else if (pct < 70) {
      xpHint.textContent = t('unlockCompanion');
    } else if (pct < 100) {
      xpHint.textContent = t('unlockMischief');
    } else if (pct < 135) {
      xpHint.textContent = t('unlockPortals');
    } else if (pct < 175) {
      xpHint.textContent = t('unlockHyper');
    } else if (pct < 220) {
      xpHint.textContent = t('level9Hint');
    } else if (pct < 270) {
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
        iconSvg.innerHTML = '';
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '3'); rect.setAttribute('y', '11'); rect.setAttribute('width', '18'); rect.setAttribute('height', '11'); rect.setAttribute('rx', '2'); rect.setAttribute('ry', '2');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M7 11V7a5 5 0 0 1 10 0v4');
        iconSvg.appendChild(rect);
        iconSvg.appendChild(path); // Lock
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

    const currentSkinBox = document.querySelector('.color-box.active');
    const currentSkin = currentSkinBox ? currentSkinBox.dataset.skin : 'white';
    updateSkinSwatches(currentSkin, latestActivePet);

    prevXP = pct;
  }


  function updateSkinSwatches(activeSkin, activePet = 'pet_cat') {
    const foxActive = activePet === 'pet_fox';
    const rainbowUnlocked = isMilestoneUnlocked('rainbowSkin');
    document.querySelectorAll('.color-box').forEach((box) => {
      const skin = box.dataset.skin;
      const locked = foxActive || (skin === 'rainbow' && !rainbowUnlocked);
      box.classList.toggle('skin-locked', locked);
      box.classList.toggle('active', !foxActive && skin === activeSkin && !locked);
      box.setAttribute('aria-disabled', String(locked));
      if (foxActive) {
        box.title = 'Cat-only while fox is active';
      } else if (skin === 'rainbow') {
        box.title = rainbowUnlocked ? 'Rainbow' : 'Rainbow - Level 3';
      } else {
        box.title = skin.charAt(0).toUpperCase() + skin.slice(1);
      }
    });
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
    latestActivePet = data.activePet || 'pet_cat';
    updateMainToggleUI(data.catEnabled);
    companionToggle.checked = latestActivePet === 'pet_fox' ? false : data.companionEnabled;
    loyalToggle.checked = data.loyalMode;
    aggroToggle.checked = data.activePet === 'pet_fox' ? false : data.aggressiveMode;
    if (data.spiderEnabled) spiderSpawnBtn.classList.add('active');
    else spiderSpawnBtn.classList.remove('active');
    uiMischiefToggle.checked = latestActivePet === 'pet_fox' ? false : data.uiMischiefEnabled;
    speechToggle.checked = data.speechEnabled;
    memoryToggle.checked = data.memoryEnabled;
    rareEventsToggle.checked = data.rareEventsEnabled;
    lowPowerToggle.checked = data.lowPowerMode;
    if (hideInFullscreenToggle) hideInFullscreenToggle.checked = data.hideInFullscreen;
    speedVal.textContent = parseFloat(data.speedMultiplier).toFixed(1) + 'x';
    sizeVal.textContent = parseFloat(data.sizeMultiplier).toFixed(1) + 'x';
    mischiefRateVal.textContent = `${parseInt(data.uiMischiefRate, 10)}%`;
    if (latestActivePet === 'pet_fox' && (data.companionEnabled || data.aggressiveMode || data.uiMischiefEnabled)) {
      data.companionEnabled = false;
      data.aggressiveMode = false;
      data.uiMischiefEnabled = false;
      companionToggle.checked = false;
      uiMischiefToggle.checked = false;
      await forceCatOnlySettingsOffForFox(latestActivePet);
    }

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

    // Apply level / XP UI
    applyXpUI(data.catXP || 0, false);
    applyPetSpecificLocks(latestActivePet);
    updateSkinSwatches(data.catSkin, latestActivePet);
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
    const active = await getLocal({ activePet: 'pet_cat' });
    if (active.activePet === 'pet_fox') {
      e.target.checked = false;
      await forceCatOnlySettingsOffForFox('pet_fox');
      return;
    }
    if (!isMilestoneUnlocked('companion')) {
      e.target.checked = false;
      return;
    }
    const next = e.target.checked;
    await setLocal({ companionEnabled: next });
    await sendMessageToTabs({ action: next ? 'startCompanion' : 'stopCompanion' });
  });

  aggroToggle.addEventListener('change', async (e) => {
    const active = await getLocal({ activePet: 'pet_cat' });
    if (active.activePet === 'pet_fox') {
      e.target.checked = false;
      await setLocal({ aggressiveMode: false });
      await sendMessageToTabs({ action: 'updateSettings', settings: { aggressiveMode: false } });
      return;
    }
    const next = e.target.checked;
    await setLocal({ aggressiveMode: next });
    await sendMessageToTabs({ action: 'updateSettings', settings: { aggressiveMode: next } });
  });

  uiMischiefToggle.addEventListener('change', async (e) => {
    const active = await getLocal({ activePet: 'pet_cat' });
    if (active.activePet === 'pet_fox') {
      e.target.checked = false;
      await setLocal({ uiMischiefEnabled: false });
      await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefEnabled: false } });
      return;
    }
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
    let data = await getLocal({ uiMischiefRate: 11, activePet: 'pet_cat' });
    if (data.activePet === 'pet_fox') {
      await forceCatOnlySettingsOffForFox('pet_fox');
      return;
    }
    let val = parseInt(data.uiMischiefRate, 10);
    val = Math.max(5, val - 5);
    mischiefRateVal.textContent = `${val}%`;
    await setLocal({ uiMischiefRate: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefRate: val } });
  });

  mischiefPlus.addEventListener('click', async () => {
    let data = await getLocal({ uiMischiefRate: 11, activePet: 'pet_cat' });
    if (data.activePet === 'pet_fox') {
      await forceCatOnlySettingsOffForFox('pet_fox');
      return;
    }
    let val = parseInt(data.uiMischiefRate, 10);
    val = Math.min(30, val + 5);
    mischiefRateVal.textContent = `${val}%`;
    await setLocal({ uiMischiefRate: val });
    await sendMessageToTabs({ action: 'updateSettings', settings: { uiMischiefRate: val } });
  });

  document.querySelectorAll('.color-box').forEach(box => {
    box.addEventListener('click', async () => {
      const active = await getLocal({ activePet: 'pet_cat' });
      if (active.activePet === 'pet_fox') {
        box.classList.remove('lock-shake');
        void box.offsetWidth;
        box.classList.add('lock-shake');
        setTimeout(() => box.classList.remove('lock-shake'), 260);
        updateSkinSwatches('white', 'pet_fox');
        return;
      }
      const skin = box.dataset.skin;
      if (skin === 'rainbow' && !isMilestoneUnlocked('rainbowSkin')) {
        box.classList.remove('lock-shake');
        void box.offsetWidth;
        box.classList.add('lock-shake');
        setTimeout(() => box.classList.remove('lock-shake'), 260);
        return;
      }
      latestActivePet = active.activePet || 'pet_cat';
      updateSkinSwatches(skin, latestActivePet);
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
        const nextXP = Math.min(MAX_LEVEL_XP, Math.max(0, Number(changes.catXP.newValue) || 0));
        applyXpUI(nextXP, true);
        if (nextXP < MILESTONES.rainbowSkin.xp) {
          getLocal({ catSkin: 'white' }).then((data) => {
            if (data.catSkin === 'rainbow') {
              setLocal({ catSkin: 'white' });
              sendMessageToTabs({ action: 'updateSettings', settings: { catSkin: 'white' } });
              updateSkinSwatches('white', latestActivePet);
            }
          }).catch(() => {});
        }
      }
      if (changes.activePet) {
        latestActivePet = changes.activePet.newValue || 'pet_cat';
        applyPetSpecificLocks(latestActivePet);
        getLocal({ catSkin: 'white' }).then((data) => updateSkinSwatches(data.catSkin || 'white', latestActivePet)).catch(() => {});
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
  const shopPetsView   = document.getElementById('shopPetsView');
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
  function buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, container) {
    const normalizedOwned = Array.isArray(owned) ? owned : [];
    const isFree    = !!item.free || item.id === 'pet_cat';
    const isOwned   = isFree || normalizedOwned.includes(item.id);
    const isActive  = item.type === 'ball'
      ? activeBall === item.id
      : (item.type === 'pet' ? activePet === item.id : isOwned && activeBoosts.includes(item.id));
    const canAfford = coins >= item.price;

    // Card classes
    let cardClass = 'shop-item';
    if (isActive)                     cardClass += ' ball-active';
    else if (isOwned)                 cardClass += ' owned';
    else if (!canAfford && !isOwned)  cardClass += ' cant-afford';
    
    const card = document.createElement('div');
    card.className = cardClass;
    card.classList.add(`shop-type-${item.type}`);
    card.dataset.id = item.id;

    // Icon: real <img> for balls/pets, emoji for boosts
    if (item.imgFile) {
      const basePath = item.type === 'pet' ? 'assets/animations' : 'assets/balls';
      const src = (typeof browser !== 'undefined' ? browser : chrome).runtime.getURL(`${basePath}/${item.imgFile}`);
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
    if (item.type === 'ball' || item.type === 'pet') {
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

    if (item.type !== 'ball' && item.type !== 'pet' && item.desc) {
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
        const result = await updateLocal({ coins: 0, shopOwned: [], shopActiveBoosts: null, activeBall: 'ball_baseball', activePet: 'pet_cat' }, (fresh) => {
          const freshCoins = fresh.coins || 0;
          const freshOwned = Array.isArray(fresh.shopOwned) ? fresh.shopOwned : [];
          const freshOwnedSet = new Set(freshOwned);
          const freshActiveBoosts = Array.isArray(fresh.shopActiveBoosts)
            ? fresh.shopActiveBoosts
            : freshOwned.filter(id => SHOP_ITEMS.some(shopItem => shopItem.id === id && shopItem.type === 'boost'));
          const nowOwned = item.free || item.id === 'pet_cat' || freshOwnedSet.has(item.id);

          if (item.type === 'ball') {
            if (nowOwned) {
              return {
                values: { activeBall: item.id },
                settings: { activeBall: item.id }
              };
            }
            if (freshCoins < item.price) return null;
            const newOwned = Array.from(new Set([...freshOwned, item.id]));
            return {
              values: { coins: freshCoins - item.price, shopOwned: newOwned, activeBall: item.id },
              settings: { activeBall: item.id, shopOwned: newOwned }
            };
          }

          if (item.type === 'pet') {
            const foxPatch = item.id === 'pet_fox' ? { companionEnabled: false, aggressiveMode: false, uiMischiefEnabled: false } : {};
            if (nowOwned) {
              return {
                values: { activePet: item.id, ...foxPatch },
                settings: { activePet: item.id, ...foxPatch }
              };
            }
            if (freshCoins < item.price) return null;
            const newOwned = Array.from(new Set([...freshOwned, item.id]));
            return {
              values: { coins: freshCoins - item.price, shopOwned: newOwned, activePet: item.id, ...foxPatch },
              settings: { activePet: item.id, shopOwned: newOwned, ...foxPatch }
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
          const newOwned = Array.from(new Set([...freshOwned, item.id]));
          const newActive = Array.from(new Set([...freshActiveBoosts, item.id]));
          return {
            values: { coins: freshCoins - item.price, shopOwned: newOwned, shopActiveBoosts: newActive },
            settings: { shopOwned: newOwned, shopActiveBoosts: newActive }
          };
        });

        if (!result) return;
        if (result.settings) {
          sendMessageToTabs({ action: 'updateSettings', settings: result.settings }).catch(() => {});
          if (result.settings.activePet === 'pet_fox' || result.settings.companionEnabled === false) {
            sendMessageToTabs({ action: 'stopCompanion' }).catch(() => {});
          }
        }

        card.classList.add('just-bought');
        setTimeout(() => card.classList.remove('just-bought'), 500);
        await refreshShop();
        if (item.type === 'pet') {
          await refreshQuests().catch(() => {});
        }
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
    const data = await getLocal({ coins: 0, shopOwned: [], shopActiveBoosts: null, dailyStreak: 0, lastStreakDate: '', activeBall: 'ball_baseball', activePet: 'pet_cat' });
    const coins      = data.coins || 0;
    const owned      = Array.from(new Set(Array.isArray(data.shopOwned) ? data.shopOwned : []));
    const activeBoosts = Array.isArray(data.shopActiveBoosts)
      ? data.shopActiveBoosts
      : owned.filter(id => SHOP_ITEMS.some(item => item.id === id && item.type === 'boost'));
    const streak     = data.dailyStreak || 0;
    const lastDate   = data.lastStreakDate || '';
    const activeBall = data.activeBall || 'ball_baseball';
    const activePet  = data.activePet || 'pet_cat';
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
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopBallsView);
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

    // --- Render Pets grid ---
    if (shopPetsView) {
      shopPetsView.replaceChildren();
      SHOP_ITEMS.filter(i => i.type === 'pet').forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopPetsView);
        card.style.animationDelay = `${idx * 40}ms`;
      });
    }

    // --- Render Boosts grid ---
    if (shopBoostsView) {
      shopBoostsView.replaceChildren();
      SHOP_ITEMS.filter(i => i.type === 'boost').forEach((item, idx) => {
        const card = buildShopCard(item, coins, owned, activeBall, activePet, activeBoosts, shopBoostsView);
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

  // Sync popup UI when content scripts update progress, quests, or stats.
  if (API.storage && API.storage.onChanged) {
    let refreshScheduled = false;
    const schedulePopupRefresh = () => {
      if (refreshScheduled) return;
      refreshScheduled = true;
      setTimeout(() => {
        refreshScheduled = false;
        refresh().catch(() => {});
        refreshShop().catch(() => {});
      }, 80);
    };

    API.storage.onChanged.addListener((changes, areaName) => {
      if (areaName && areaName !== 'local') return;
      if (!changes) return;
      const keys = Object.keys(changes);
      const affectsProgress = keys.some((key) => [
        'catXP', 'coins', 'dailyQuestState', 'dailyQuestStats',
        'dailyStreak', 'lastStreakDate', 'shopOwned', 'shopActiveBoosts', 'activeBall', 'activePet'
      ].includes(key));
      if (affectsProgress) schedulePopupRefresh();
    });
  }

  refreshShop().catch(() => {});
})();
