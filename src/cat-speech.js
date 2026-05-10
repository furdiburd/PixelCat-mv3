// 
//  PIXELCAT SPEECH SYSTEM - Session-aware speech module
// 

window.PixelCatSpeech = function(config) {
  'use strict';

  // Extract dependencies from config
  const API = config.API;
  const catId = config.catId;
  const addTimeout = config.addTimeout;
  const removeTimeout = config.removeTimeout;
  const setAnimLocked = config.setAnimLocked;
  const awardCoins = config.awardCoins;
  const earnXP = config.earnXP;
  const showCoinPopup = config.showCoinPopup;
  const spawnHeart = config.spawnHeart;
  
  // Helper functions to access dynamic properties
  const getDraggedFish = () => config.draggedFish;
  const getDraggedBall = () => config.draggedBall;
  const getFeetX = () => config.feetX;
  const getFeetY = () => config.feetY;
  const getVIS = () => config.VIS;
  const getState = () => config.state;
  const getIsJumping = () => config.isJumping;
  const getVelX = () => config.velX;
  const getTargetFish = () => config.targetFish;
  const getTargetSpider = () => config.targetSpider;
  const getIsDragging = () => config.isDragging;
  const getIsPurring = () => config.isPurring;
  const getIsDeepSleep = () => config.isDeepSleep;
  const getCatEnabled = () => config.catEnabled;
  const getSpeechEnabled = () => config.speechEnabled !== false;
  const getMemoryEnabled = () => config.memoryEnabled !== false;
  const getIsTabVisible = () => config.isTabVisible;
  const getBubbleTrapActive = () => !!config.bubbleTrapActive;
  const getBubbleTrapWidth = () => Number(config.bubbleTrapWidth) || 0;
  const getBubbleTrapHeight = () => Number(config.bubbleTrapHeight) || 0;
  const getVw = () => config._vw;
  const getVh = () => config._vh;
  const getIdleStates = () => config.IDLE_STATES;

  // 
  //  CONFIGURATION CONSTANTS
  // 
  
  const SPEECH_CONFIG = {
    IDLE_DELAY_MIN: 90000,        // idle chatter stays rare; no walking/climbing spam
    IDLE_DELAY_MAX: 180000,       // up to 3 minutes between passive lines
    INTERACTIVE_DELAY: 9000,      // shorter visible time for voting bubbles
    INTERACTIVE_VARIANCE: 28000,  // long random gap after interaction
    COOLDOWN_INTERACTIVE: 26000,  // prevent repeated interactive prompts
    COOLDOWN_NORMAL: 45000,       // prevent rapid passive speech replacement
    COOLDOWN_ACTION: 12000,       // action lines are limited unless user directly interacts
    COOLDOWN_GRABBED: 5200,       // grabbing should react naturally, not wait for idle chatter
    RETRY_DELAY_MIN: 25000,       // retry gently when not in a good state
    RETRY_DELAY_MAX: 35000        // avoid spam while moving/dragging
  };
  
  const POSITIONING = {
    CAT_TOP_OFFSET: 0.35,    // Multiplier for cat top position
    CAT_MID_OFFSET: 0.18,    // Multiplier for cat mid position
    BUBBLE_GAP: 6,           // Gap between bubble and cat
    BUBBLE_MARGIN: 8,        // Margin from screen edges
    ARROW_MIN_OFFSET: 12     // Minimum arrow offset from bubble edge
  };
  
  const AFK_CONFIG = {
    WALL_SPEAK_COOLDOWN: 9000 // keep wall/confused reactions rare
  };

  const MEMORY_KEY = 'pixelCatSpeechMemoryV2';
  const LEGACY_MEMORY_KEY = 'pixelCatSpeechMemoryV1';
  const SESSION_SPEECH_KEY = 'pixelCatSpeechSessionV3_' + catId;
  const MEMORY_SAVE_DELAY = 1200;
  const MEMORY_MIN_VIDEO_MS = 12000;
  const WATCH_SAVE_MIN_GAP = 7000;
  const WATCH_DELTA_MAX_SECONDS = 8;
  const WATCH_MILESTONES_MINUTES = [5, 15, 30, 60, 120, 180];


  function getActivePetKind() {
    const rawKind = typeof config.activePetKind !== 'undefined' ? config.activePetKind : config.activePet;
    const pet = String(rawKind || '').toLowerCase();
    return pet === 'fox' || pet === 'pet_fox' ? 'fox' : 'cat';
  }

  // Pet-specific speech overrides. Fox uses its own voice so it never borrows cat-only
  // lines like meow/purr/kitty/whiskers when the fox pet is active.
  const PET_SPEECH_LIBRARY = {
    fox: {
      en: {
        random: ['What are we watching, human?', 'That thumbnail looks crunchy.', 'I see your cursor moving.', 'Too many tabs open, human.', 'This video smells boring.', 'Is this the good part?', 'I’d pounce on that.', 'Nice click. Very fast.', 'Still here, human?', 'Your feed looks strange.', 'This tab smells funny.', 'I saw that scroll.'],
        happy: ['Okay, that was nice.', 'I liked that.', 'Good choice, human.', 'That felt right.', 'Fine. I am pleased.', 'Tiny purr approved.', 'Tail approves.', 'You did well, human.', 'Acceptable pets.', 'Nice click, human.'],
        angry: ['That was a miss, human.', 'Why click that?', 'My tail is disappointed.', 'Focus, human. Focus.', 'I’ve seen better.', 'Actually embarrassing.', 'Try clicking better.', 'Was that the plan?', 'Careful, human.', 'Do not test me.', 'That was rude.', 'I will remember that.'],
        confused: ['What was that?', 'Explain yourself, human.', 'Why would you click that?', 'Was that the plan?', 'I have questions.', 'Even I noticed.', 'Suspicious choice, human.', 'That looked wrong.', 'Are we okay?', 'Pause. Think, human.'],
        hungry: ['Where are the snacks, human?', 'I require fish tax.', 'Feed me or I stare.', 'Is that food? No?', 'My bowl is half-empty.', 'Stomach growling, human.', 'Snack time now?', 'Fish would fix this.', 'Dinner is late.', 'Share the pixels.'],
        sleepy: ['Eyes getting heavy, human.', 'I’m napping on your cursor.', 'Go to the sleep box.', 'One more video. Only one.', 'Five more minutes.', 'Too cozy here.', 'Wake me later.', 'Nap loading now.', 'Silence sounds nice.', 'Blanket required.'],
        interactive: ['Pet me instead.', 'Hands off the fur.', 'My beans are sensitive.', 'Don’t stop the pets.', 'Soft pets only.', 'Watch your fingers, human.', 'Careful with the tail.', 'That spot is nice.', 'Okay, keep going.', 'Gentle, human.', 'No rough paws.', 'Respect the fluff.'],
        feedbackQuestion: ['Was that cute?', 'Did I help?', 'Too much sass?', 'Keep me talking?', 'Need more chaos?', 'Five stars yet?', 'Are we friends?', 'Do I stay?', 'Good cat moment?', 'Want softer meows?', 'Was that too much?', 'You like this?'],
        voteLike: ['Five stars too?', 'I knew it.', 'Correct answer.', 'Good human.', 'Tiny ego fed.', 'Purr approved.', 'Kindness detected.', 'You may continue.', 'I accept tribute.', 'Tail says thanks.'],
        voteDislike: ['What did I expect?', 'Rude but noted.', 'Bold little click.', 'Your loss, human.', 'That stung.', 'I expected betrayal.', 'Fair. Still rude.', 'My ego limped.', 'Cold, honestly.', 'Tail is disappointed.'],
        grabbed: ['Put me back, human.', 'I am not a toy.', 'Hands off the fur.', 'Where are we going?', 'My beans are sensitive.', 'You’re weird, human.', 'Let go, human.', 'Personal space, human.', 'Careful with me.', 'I can walk.'],
        heldStill: ['Still holding me?', 'We live here now?', 'I have paws.', 'What is the plan?', 'You done, human?', 'This is awkward.', 'Put me back.', 'I need the floor.'],
        heldMoving: ['Too fast, human.', 'I am not luggage.', 'Where are we going?', 'Less shaking, please.', 'I preferred walking.', 'Tail is not steering.', 'Easy, human.', 'Careful with the paws.'],
        longHeld: ['Let go, human.', 'Still holding me?', 'This is getting weird.', 'I need freedom.', 'My patience is gone.', 'Release the paws.', 'Put me down.', 'Enough carrying, human.', 'Pets, not kidnapping.', 'Floor time now.'],
        dropped: ['Gravity found me again.', 'I meant to do that.', 'Rude landing, human.', 'Floor says hello.', 'That was unnecessary.', 'My paws felt that.', 'Calculated move. Trust me.', 'Try gentler next time.', 'Landing was dramatic.', 'Tail survived.'],
        thrown: ['Why am I flying?', 'I meant to do that.', 'Air paws activated.', 'Rude launch, human.', 'This is not flying.', 'Gravity is waiting.', 'Catch me, maybe?', 'My tail disagrees.', 'That was dramatic.', 'No throwing cats.'],
        cursorSuspicious: ['Cursor looks suspicious.', 'Stop poking my nose.', 'I see that arrow.', 'Don’t click that.', 'Mouse is sneaking.', 'That pointer is plotting.', 'I saw that move.', 'Slow down, human.', 'Your cursor is loud.', 'Hover gently, human.'],
        cursorThreat: ['Stop poking my nose.', 'I’ll bite that arrow.', 'Watch your fingers, human.', 'Don’t even think it.', 'Back up, cursor.', 'Too close, human.', 'Mind the whiskers.', 'Respect the nose.', 'Personal bubble, human.', 'No sudden clicks.'],
        cursorPanic: ['Cursor attack!', 'Too close!', 'Emergency paws.', 'Need distance now.', 'Nope nope nope.', 'Retreating, human.', 'That arrow bites.', 'Panic paws active.'],
        running: ['Zoomies activated.', 'Make way, human.', 'Paws busy.', 'Try catching me.', 'Tiny sprint time.', 'Floor patrol urgent.', 'Fast paws today.', 'Running from boredom.'],
        walking: ['Just patrolling.', 'Tiny rounds.', 'Checking things.', 'Soft paws only.', 'Little walk.', 'I own this route.', 'Paw patrol, human.', 'Quiet steps. Loud judgment.'],
        climbing: ['Up we go.', 'Wall time.', 'Vertical route.', 'Look at me climb.', 'Shortcut found.', 'Claws doing work.', 'High ground, human.', 'Gravity can wait.'],
        jumping: ['Boing.', 'Air paws.', 'Calculated leap.', 'Landing pending.', 'I meant that.', 'Tiny jump math.', 'Up we go.', 'Pounce angle ready.'],
        grooming: ['Bath time.', 'Do not interrupt.', 'Fur maintenance.', 'I own this screen.', 'Don’t look at me, human.', 'Presentation matters.', 'Tail check complete.', 'Clean paws, clean life.', 'Self-care, human.', 'Still majestic.'],
        watching: ['What are we watching, human?', 'This video smells boring.', 'Is this the good part?', 'The comments are scary.', 'Don’t read the text below.', 'That thumbnail looks crunchy.', 'I’m watching too.', 'This better be good.', 'I have notes.', 'Your taste is showing.', 'Interesting choice, human.', 'Keep the noise down.'],
        videoPlay: ['Keep the noise down.', 'Show me, human.', 'Finally, movement.', 'Let it roll.', 'This better be good.', 'Is this the good part?', 'Eyes on screen.', 'Okay, play it.', 'Start the tiny cinema.', 'I’m listening.'],
        videoPause: ['Why did we pause, human?', 'We were watching.', 'Unpause, maybe?', 'I was invested.', 'That was sudden.', 'Did it scare you?', 'Noise stopped. Suspicious.', 'Continue the thing.', 'Pause? Bold choice.', 'My ears noticed.'],
        mischief: ['I didn’t touch it.', 'Don’t look at me, human.', 'My tail saw nothing.', 'Calculated move. Trust me.', 'Gravity found me again.', 'My paw slipped.', 'The screen started it.', 'No proof, human.', 'Pretend you saw nothing.', 'Tail is innocent.'],
        fishing: ['Fish tax detected.', 'Dinner is moving.', 'Hold still, fish.', 'Snack incoming, human.', 'I smell fish.', 'Tiny hunt begins.', 'Fish looks guilty.', 'That fish is mine.', 'Pounce time.', 'Fresh snack spotted.'],
          teasing: ['Give it here.', 'Drop the toy.', 'Mine, human. Mine.', 'Stop playing games.', 'Hand it over.', 'I will bite you.', 'Give toy now.', 'Bad human. Drop it.', 'Patience is fading.', 'I see you holding.', 'That is mine.', 'Do not mess.'],
        coin: ['Shiny thing, human.', 'Mine now.', 'Coin acquired.', 'I like shiny.', 'Treasure found.', 'Another shiny, please.', 'Pocket sparkle found.', 'Tiny treasure tax.'],
        eating: ['Snack secured.', 'Fish tax accepted.', 'That helped.', 'More, please.', 'Bowl status improved.', 'Tiny feast complete.', 'Delicious, human.', 'No crumbs remain.'],
        ball: ['Ball wants trouble.', 'I would pounce.', 'Kick it here.', 'That bounce was rude.', 'Game on, human.', 'Ball is suspicious.', 'My paws are ready.', 'Tiny striker mode.', 'Bounce again. I dare.', 'That ball blinked first.'],
        spider: ['Spider spotted.', 'Bug looks suspicious.', 'I saw movement.', 'Come here, bug.', 'Tiny hunt begins.', 'Not a fan.', 'Eight legs? Rude.', 'Spider owes rent.', 'I handle this.', 'Watch this, human.'],
        bigSpider: ['That spider is huge.', 'Backup maybe?', 'Big bug energy.', 'Still brave, human.', 'Eight giant problems.', 'Why so many legs?', 'I need bigger paws.', 'Careful, human.'],
        webbed: ['I am stuck.', 'This is sticky.', 'Webs are cheating.', 'Help, human.', 'Spider was rude.', 'My paws are trapped.', 'Sticky paws. Bad day.', 'Not my best moment.', 'Get this off.', 'I hate webs.'],
        stuck: ['Path blocked.', 'Need another route.', 'This way lied.', 'Wall said no.', 'Recalculating paws.', 'I meant to stop.', 'Tiny obstacle, human.', 'Gravity got involved.', 'Floor is complicated.', 'Not stuck. Thinking.'],
        content: ['This looks dramatic.', 'Thumbnail looks crunchy.', 'You clicked bait.', 'The comments are scary.', 'Don’t read below.', 'I have notes.', 'This smells boring.', 'Risky click, human.', 'Your feed worries me.', 'Scroll with caution.'],
        channelMemory: ['This channel again.', 'I know {channel}.', 'Back here again.', '{channel} again?', 'Pattern detected.', 'Same pixels, human.', 'Comfort channel detected.', 'Your routine is showing.'],
        memeMood: ['Internet behavior.', 'That was strange.', 'Your feed is weird.', 'Peak nonsense.', 'I laughed a little.', 'Pixels feel cursed.', 'Normal human behavior?', 'Tiny chaos detected.'],
        timeMorning: ['Morning, human.', 'Sun is up.', 'Breakfast first?', 'Early scroll today.', 'Fresh day, same chaos.', 'Coffee smells useful.', 'Wake gently, human.', 'Too early for this.'],
        timeAfternoon: ['Afternoon, human.', 'Still scrolling?', 'Snack hour maybe.', 'Sun is still working.', 'No nap yet?', 'Daylight is judging.', 'Lunch first, maybe.', 'Paws still awake.'],
        timeEvening: ['Evening, human.', 'Cozy hours now.', 'Dinner time maybe.', 'Soft screen hours.', 'Sun went away.', 'Night mode soon.', 'Tiny blanket weather.', 'Good watching hour.'],
        timeLate: ['Human, it is late.', 'Go to sleep box.', 'Eyes getting heavy, human.', 'Is the sun up yet?', 'One more video. Only one.', 'Your bed misses you.', 'Moon is watching.', 'Sleep is free.', 'Tiny nap recommended.', 'Tomorrow saw this.'],
        watchStart: ['What are we watching, human?', 'This better be good.', 'New watch begins.', 'I am seated.', 'Eyes on pixels.', 'Show me the thing.', 'Tiny cinema time.', 'Let us watch.'],
        watchSession: ['{sessionMinutes} minutes already.', 'Still here, human?', 'Time vanished again.', 'Long session today.', 'Your chair owns you.', 'One more video?', 'You stayed awhile.', 'Tiny break maybe?', 'Blink, human.', 'Hydrate, human.'],
        watchLong: ['Human, take a break.', 'Go to the sleep box.', 'One more video. Only one.', 'Your bed misses you.', 'Blink, human.', 'Hydrate, maybe.', 'This is a marathon.', 'Long watch today.', 'Tiny stretch time.', 'Chair claimed you.'],
        watchMilestone: ['{sessionMinutes} minutes. Noted.', 'Milestone reached, human.', 'I noticed.', 'That is commitment.', 'Tiny badge earned.', 'Time got eaten.', 'Still here together.', 'Paws counted that.'],
        watchVideoLong: ['Long video survived.', 'Same video still?', '{currentVideoMinutes} minutes here.', 'That was commitment.', 'Attention still alive?', 'Big video, tiny paws.', 'I sat through that.', 'Respect the patience.'],
        returningWatcher: ['Back again, human.', 'You returned.', 'Pattern noticed.', 'Same taste again.', 'Old trail reopened.', 'Welcome back, human.', 'I waited here.', 'Missed me? Obviously.'],
        channelLoyalty: ['Same channel again.', '{channel} again?', 'You came back again.', 'Routine detected.', 'Comfort channel, human.', 'I remember this place.', 'Same den, same human.', 'Predictable, but cozy.'],
        tabComeback: ['You returned.', 'I waited here.', 'Where did you go?', 'I guarded pixels.', 'Welcome back, human.', 'Suspicious absence noted.', 'Back from wandering?', 'Tab trail resumed.']
      },
      fr: {
        "random": [
          "Renard en ligne.", "Cette page sent sauvage.", "Je te regarde.", "Patrouille du renard.",
          "Hmm. Continue.", "Queue suspecte active."
        ],
        "happy": [
          "Ça, j’aime bien.", "Pas mal, humain.", "Enfin, du calme.", "Bon choix.",
          "Je valide.", "Continue comme ça."
        ],
        "angry": [
          "Non.", "Très impoli.", "Refais ça pour voir.", "Je te juge.",
          "Ça suffit.", "Limite dépassée."
        ],
        "confused": [
          "C’était quoi ça ?", "Explique ce bazar.", "Rien compris.", "Attends. Pourquoi ?",
          "J’ai des questions.", "Même moi, je bloque."
        ],
        "hungry": [
          "Nourris-moi d’abord.", "Un poisson aiderait.", "Mon bol est vide.", "Snack maintenant ?",
          "Je pourrais manger.", "Je sens le dîner."
        ],
        "sleepy": [
          "Je m’endors.", "Sieste bientôt.", "Réveille-moi plus tard.", "Trop confortable ici.",
          "Mes yeux ferment.", "Encore cinq minutes."
        ],
        "interactive": [
          "Doucement avec le renard.", "Attention à la queue.", "Fourrure respectée, merci.", "Là, c’est bien.",
          "Pas trop fort.", "Je tolère ça."
        ],
        "feedbackQuestion": ["Renard validé ?", "Je continue ?", "Trop de malice ?", "Queue approuvée ?", "Je reste ?", "Cinq étoiles ?", "Tu valides ?", "Je parle trop ?", "Moment réussi ?", "Renard utile ?"],
        "voteLike": ["Cinq étoiles aussi ?", "Bon goût, humain.", "Je le savais.", "Choix correct.", "Respect enfin.", "Égo nourri.", "Queue satisfaite.", "Renard flatté."],
        "voteDislike": ["Je m’y attendais.", "Cruel, mais noté.", "Clic très froid.", "Mon ego souffre.", "Choix audacieux.", "Ça pique.", "Même pas surpris.", "Queue en désaccord."],
        "grabbed": [
          "Hé, pose le renard.", "Pardon ?", "Je peux marcher.", "Pas prévu ça.",
          "Libère le renard.", "Un peu impoli."
        ],
        "heldStill": [
          "Tu me tiens encore ?", "On vit ici ?", "J’ai des pattes.", "C’est quoi le plan ?",
          "Tu as fini ?", "C’est gênant."
        ],
        "heldMoving": [
          "Trop vite.", "Doucement.", "Je ne suis pas bagage.", "On va où ?",
          "Moins de secousses.", "Je préfère marcher."
        ],
        "longHeld": [
          "Bon, assez.", "Lâche-moi sérieusement.", "La blague est finie.", "Ma patience est morte.",
          "Libère-moi maintenant.", "Je porte plainte."
        ],
        "dropped": [
          "Atterrissage impoli.", "J’ai senti ça.", "Préviens-moi avant.", "Assez gracieux.",
          "Plus doux la prochaine.", "Atterrissage réussi."
        ],
        "thrown": [
          "Pourquoi je vole ?", "On ne lance pas renard.", "Je déteste ça.", "Pire compagnie aérienne.",
          "Queue en panique.", "Tu as choisi le chaos."
        ],
        "cursorSuspicious": [
          "Je vois ce curseur.", "Ce pointeur est louche.", "Ne me teste pas.", "Tu survoles bizarrement.",
          "Recule ce truc.", "J’ai vu ça."
        ],
        "cursorThreat": [
          "Recule.", "Trop près.", "Espace personnel.", "Je vais frapper.",
          "Pas les moustaches.", "Attention à la queue."
        ],
        "cursorPanic": [
          "Non non non.", "Attaque de curseur !", "Trop près !", "Retraite.",
          "Pattes d’urgence.", "Besoin de distance."
        ],
        "running": [
          "Zoomies activés.", "Faites place.", "Je suis vitesse.", "Pattes occupées.",
          "Courses importantes.", "Attrape-moi donc."
        ],
        "walking": [
          "Petite patrouille.", "Je vérifie.", "Pattes discrètes.", "Petite marche.",
          "Cette route est mienne.", "Ronde en cours."
        ],
        "climbing": [
          "On monte.", "Mode mur.", "Route verticale.", "Regarde-moi grimper.",
          "Petit chat montagne.", "Raccourci trouvé."
        ],
        "jumping": [
          "Boing.", "Joli saut.", "Pattes en l’air.", "Saut calculé.",
          "C’était voulu.", "Atterrissage en attente."
        ],
        "grooming": [
          "Toilette.", "Entretien de fourrure.", "Occupé à nettoyer.", "Présentation importante.",
          "Une seconde.", "Ne m’interromps pas."
        ],
        "watching": [
          "Je regarde aussi.", "Intéressant jusque-là.", "Ça m’intéresse.", "Hmm. Continue.",
          "Je suis investi.", "Je décide encore."
        ],
        "videoPlay": [
          "Ok, lance.", "Montre-moi.", "Voyons ça.", "Ça tourne.",
          "Enfin.", "Bien, continue."
        ],
        "videoPause": [
          "Pourquoi pause ?", "On regardait.", "Continue.", "J’étais occupé.",
          "C’était impoli.", "Reprends peut-être ?"
        ],
        "mischief": [
          "Je n’ai rien touché.", "Aucune preuve.", "C’était le vent.", "Prétendument.",
          "J’étais ailleurs.", "Je confirme rien."
        ],
        "fishing": [
          "Poisson repéré.", "Dîner en fuite.", "Renard en chasse.", "Tiens-toi tranquille.",
          "Je l’attrape.", "Snack vivant."
        ],
        "coin": [
          "Brillant.", "À moi maintenant.", "Pièce prise.", "J’aime ça.",
          "Trésor trouvé.", "Encore une, merci."
        ],
        "eating": [
          "Poisson sécurisé.", "Délicieux.", "Festin de renard.", "Encore, merci.",
          "Ça valait le saut.", "Le dîner disparaît."
        ],
        "ball": [
          "Balle repérée.", "Renard en jeu.", "À moi.", "Je l’attrape.",
          "Ce rebond était personnel.", "Mode capture."
        ],
        "spider": [
          "Araignée repérée.", "J’ai vu bouger.", "Viens ici, insecte.", "C’est personnel.",
          "Mode chasseur.", "Pas fan."
        ],
        "bigSpider": [
          "Énorme araignée.", "Pourquoi si grosse ?", "Besoin de renfort.", "Ok, c’est rude.",
          "Gros insecte, même attitude.", "Je reste brave."
        ],
        "webbed": [
          "Je suis coincé.", "C’est collant.", "Injuste.", "Les toiles trichent.",
          "Je déteste ça.", "Besoin d’aide."
        ],
        "stuck": [
          "Chemin bloqué.", "Hmm.", "C’est agaçant.", "Autre route nécessaire.",
          "Ce chemin ment.", "Pattes recalculent."
        ],
        "content": [
          "Ça semble dramatique.", "Miniature intéressante.", "Tu as cliqué au piège.", "Ambiance étrange.",
          "J’ai des notes.", "Ça peut être bien."
        ],
        "channelMemory": [
          "Cette chaîne encore.", "Je connais {channel}.", "Nous revoilà ici.", "Endroit familier.",
          "Encore {channel} ?", "Tu fais confiance ici."
        ],
        "memeMood": [
          "C’était maudit.", "Comportement internet.", "Je blâme internet.", "Ton feed est bizarre.",
          "Nonsense maximal.", "J’ai un peu ri."
        ],
        "timeMorning": [
          "Déjà le matin ?", "Bonjour.", "Scroll matinal.", "Le soleil est levé.",
          "Petit-déjeuner d’abord ?", "Nouveau jour, chaos."
        ],
        "timeAfternoon": [
          "Point après-midi.", "Tu scrolles encore ?", "Ambiance midi.", "Le soleil bosse encore.",
          "Patrouille d’après-midi.", "Pas de sieste ?"
        ],
        "timeEvening": [
          "Déjà le soir.", "Heures cosy.", "Mode nuit bientôt.", "Écran tout doux.",
          "Patrouille du soir.", "Dîner peut-être."
        ],
        "timeLate": [
          "Il est tard.", "Va dormir.", "Service lune.", "On veille tard.",
          "Ton lit appelle.", "Heures gobelin."
        ],
        "watchStart": [
          "Je m’installe.", "Nouvelle session.", "Ok, regardons.", "Je suis assis.",
          "Ça doit être bien.", "C’est parti."
        ],
        "watchSession": [
          "{sessionMinutes} minutes déjà.", "Encore là ?", "Tu es engagé.", "Longue session.",
          "Le temps a disparu.", "On reste vraiment."
        ],
        "watchLong": [
          "C’est un marathon.", "Tu vis ici maintenant.", "L’herbe attendra.", "Long visionnage.",
          "Hydrate-toi peut-être.", "Toujours solide."
        ],
        "watchMilestone": [
          "{sessionMinutes} minutes. Bien.", "Palier atteint.", "J’ai remarqué.", "Bel engagement.",
          "Temps bien volé.", "On l’a fait."
        ],
        "watchVideoLong": [
          "{currentVideoMinutes} minutes ?", "Cette vidéo est énorme.", "Grosse énergie vidéo.", "On reste assis.",
          "Longue, hein ?", "Installe-toi."
        ],
        "returningWatcher": [
          "Te revoilà.", "Bon retour.", "Tu es revenu.", "J’ai gardé ta place.",
          "Même rituel.", "Je t’attendais."
        ],
        "channelLoyalty": [
          "Encore {channel}.", "Énergie fidèle.", "Tu reviens toujours.", "Chaîne favorite ?",
          "Retour à {channel}.", "Tu es constant."
        ],
        "tabComeback": [
          "Te voilà.", "Bon retour, humain.", "Tu as disparu.", "Déjà de retour ?",
          "J’ai gardé le fort.", "Je t’ai manqué ?"
        ],
        "teasing": [
          "Donne ça.", "Pose le jouet.", "C’est à moi.", "Arrête de jouer.",
          "Rends-le maintenant.", "Je le vois."
        ]
      },
      it: {
        "random": [
          "Volpe online.", "Questa pagina sa di selvatico.", "Ti sto guardando.", "Pattuglia volpe.",
          "Hmm. Continua.", "Coda sospetta attiva."
        ],
        "happy": [
          "Questo mi piace.", "Non male, umano.", "Finalmente pace.", "Buona scelta.",
          "Approvo.", "Continua così."
        ],
        "angry": [
          "Assolutamente no.", "Che maleducato.", "Riprova, dai.", "Ti sto giudicando.",
          "Ora basta.", "Linea superata."
        ],
        "confused": [
          "Cos’era quello?", "Spiega questo caos.", "Non ha senso.", "Aspetta. Perché?",
          "Ho domande.", "Anche io sono confuso."
        ],
        "hungry": [
          "Prima nutrimi.", "Un pesce aiuterebbe.", "La ciotola è vuota.", "Snack adesso?",
          "Potrei mangiare.", "Sento odore di cena."
        ],
        "sleepy": [
          "Mi sto addormentando.", "Presto pisolino.", "Svegliami dopo.", "Troppo comodo qui.",
          "Gli occhi si chiudono.", "Altri cinque minuti."
        ],
        "interactive": [
          "Piano con la volpe.", "Occhio alla coda.", "Rispetta il pelo.", "Lì va bene.",
          "Non troppo forte.", "Lo tollero."
        ],
        "feedbackQuestion": ["Volpe approvata?", "Continuo?", "Troppa furbizia?", "Coda approva?", "Resto qui?", "Cinque stelle?", "Mi approvi?", "Parlo troppo?", "Momento riuscito?", "Volpe utile?"],
        "voteLike": ["Cinque stelle anche?", "Buon gusto, umano.", "Lo sapevo.", "Scelta corretta.", "Finalmente rispetto.", "Ego nutrito.", "Coda soddisfatta.", "Volpe lusingata."],
        "voteDislike": ["Me lo aspettavo.", "Crudele, ma segnato.", "Click molto freddo.", "Il mio ego soffre.", "Scelta audace.", "Fa male.", "Nemmeno sorpreso.", "Coda non approva."],
        "grabbed": [
          "Ehi, posa la volpe.", "Scusa?", "So camminare.", "Non era previsto.",
          "Libera la volpe.", "Abbastanza scortese."
        ],
        "heldStill": [
          "Mi tieni ancora?", "Viviamo qui?", "Ho le zampe.", "Qual è il piano?",
          "Hai finito?", "È imbarazzante."
        ],
        "heldMoving": [
          "Troppo veloce.", "Piano.", "Non sono bagaglio.", "Dove andiamo?",
          "Meno scosse, grazie.", "Preferivo camminare."
        ],
        "longHeld": [
          "Ok, basta.", "Lasciami davvero.", "Scherzo finito.", "Pazienza finita.",
          "Liberami adesso.", "Farò reclamo."
        ],
        "dropped": [
          "Atterraggio scortese.", "L’ho sentito.", "Avvisa prima.", "Abbastanza elegante.",
          "Più piano la prossima.", "Atterraggio riuscito."
        ],
        "thrown": [
          "Perché sto volando?", "Non lanciare volpi.", "Odio questo.", "Peggior compagnia aerea.",
          "Coda in panico.", "Hai scelto il caos."
        ],
        "cursorSuspicious": [
          "Vedo quel cursore.", "Quel puntatore è colpevole.", "Non sfidarmi.", "Stai passando strano.",
          "Tieni lontano quel coso.", "Ho visto."
        ],
        "cursorThreat": [
          "Indietro.", "Troppo vicino.", "Spazio personale.", "Ti graffio.",
          "Non sui baffi.", "Occhio alla coda."
        ],
        "cursorPanic": [
          "No no no.", "Attacco cursore!", "Troppo vicino!", "Ritirata.",
          "Zampe d’emergenza.", "Mi serve distanza."
        ],
        "running": [
          "Zoomies attivati.", "Fate largo.", "Sono velocità.", "Zampe occupate.",
          "Commissioni importanti.", "Prova a prendermi."
        ],
        "walking": [
          "Piccola pattuglia.", "Controllo cose.", "Zampe silenziose.", "Passeggiatina.",
          "Questa strada è mia.", "Giro in corso."
        ],
        "climbing": [
          "Si sale.", "Modalità muro.", "Percorso verticale.", "Guardami scalare.",
          "Piccolo gatto montagna.", "Scorciatoia trovata."
        ],
        "jumping": [
          "Boing.", "Bel salto.", "Zampe in aria.", "Salto calcolato.",
          "Volevo farlo.", "Atterraggio in arrivo."
        ],
        "grooming": [
          "Bagnetto.", "Manutenzione pelo.", "Sto pulendo.", "La presentazione conta.",
          "Un attimo.", "Non interrompere."
        ],
        "watching": [
          "Guardo anche io.", "Interessante finora.", "Ha la mia attenzione.", "Hmm. Continua.",
          "Ora sono coinvolto.", "Sto ancora decidendo."
        ],
        "videoPlay": [
          "Ok, avvia.", "Fammi vedere.", "Vediamo.", "Si parte.",
          "Finalmente.", "Bene, continua."
        ],
        "videoPause": [
          "Perché pausa?", "Stavamo guardando.", "Continua.", "Ero occupato.",
          "Che maleducato.", "Riprendi forse?"
        ],
        "mischief": [
          "Non ho toccato nulla.", "Nessuna prova.", "Era il vento.", "Presumibilmente.",
          "Ero altrove.", "Non confermo niente."
        ],
        "fishing": [
          "Pesce avvistato.", "Cena in fuga.", "Volpe a caccia.", "Stai fermo.",
          "Lo prendo.", "Snack vivo."
        ],
        "coin": [
          "Brilla.", "Ora è mia.", "Moneta presa.", "Mi piace.",
          "Tesoro trovato.", "Ancora una, grazie."
        ],
        "eating": [
          "Pesce preso.", "Delizioso.", "Banchetto da volpe.", "Ancora, grazie.",
          "Valeva il salto.", "Cena sparita."
        ],
        "ball": [
          "Palla avvistata.", "Volpe in gioco.", "Mia.", "La prendo.",
          "Quel rimbalzo era personale.", "Modalità presa."
        ],
        "spider": [
          "Ragno avvistato.", "Ho visto muoversi.", "Vieni qui, insetto.", "Sembra personale.",
          "Modalità cacciatore.", "Non mi piace."
        ],
        "bigSpider": [
          "Ragno enorme.", "Perché così grosso?", "Serve rinforzo.", "Ok, che rude.",
          "Insetto grosso, stesso atteggiamento.", "Sono ancora coraggioso."
        ],
        "webbed": [
          "Sono bloccato.", "È appiccicoso.", "Ingiusto.", "Le ragnatele barano.",
          "Odio questo.", "Serve aiuto."
        ],
        "stuck": [
          "Percorso bloccato.", "Hmm.", "Che fastidio.", "Serve altra strada.",
          "Questa strada mente.", "Zampe ricalcolano."
        ],
        "content": [
          "Sembra drammatico.", "Miniatura interessante.", "Hai cliccato esca.", "Vibe strane.",
          "Ho appunti.", "Potrebbe essere buono."
        ],
        "channelMemory": [
          "Ancora questo canale.", "Conosco {channel}.", "Siamo tornati qui.", "Posto familiare.",
          "Ancora {channel}?", "Ti fidi qui."
        ],
        "memeMood": [
          "Era maledetto.", "Comportamento internet.", "Colpa di internet.", "Il feed è strano.",
          "Nonsense massimo.", "Ho riso un po’."
        ],
        "timeMorning": [
          "Già mattina?", "Buongiorno.", "Scroll mattutino.", "Il sole è sveglio.",
          "Colazione prima?", "Nuovo giorno, caos."
        ],
        "timeAfternoon": [
          "Check pomeridiano.", "Scrolli ancora?", "Vibe di metà giornata.", "Il sole lavora ancora.",
          "Pattuglia pomeridiana.", "Niente pisolino?"
        ],
        "timeEvening": [
          "Già sera.", "Ore cozy.", "Modalità notte presto.", "Schermo morbido.",
          "Pattuglia serale.", "Cena forse."
        ],
        "timeLate": [
          "È tardi.", "Vai a dormire.", "Turno luna.", "Siamo svegli tardi.",
          "Il letto chiama.", "Ore goblin."
        ],
        "watchStart": [
          "Mi sistemo.", "Nuova sessione.", "Ok, guardiamo.", "Sono seduto.",
          "Deve essere buono.", "Si parte."
        ],
        "watchSession": [
          "{sessionMinutes} minuti già.", "Ancora qui?", "Ti sei impegnato.", "Sessione lunga.",
          "Il tempo è sparito.", "Restiamo davvero."
        ],
        "watchLong": [
          "È una maratona.", "Vivi qui adesso.", "Erba dopo.", "Visione lunga.",
          "Idratati forse.", "Ancora forte."
        ],
        "watchMilestone": [
          "{sessionMinutes} minuti. Bene.", "Traguardo raggiunto.", "L’ho notato.", "Bel impegno.",
          "Tempo ben rubato.", "Ce l’abbiamo fatta."
        ],
        "watchVideoLong": [
          "{currentVideoMinutes} minuti?", "Questo video è enorme.", "Energia video gigante.", "Restiamo seduti.",
          "Lungo, eh?", "Mettiti comodo."
        ],
        "returningWatcher": [
          "Eccoti di nuovo.", "Bentornato.", "Sei tornato.", "Ho tenuto il posto.",
          "Stesso rituale.", "Ti aspettavo."
        ],
        "channelLoyalty": [
          "Ancora {channel}.", "Energia fedele.", "Torni sempre.", "Canale preferito?",
          "Ritorno a {channel}.", "Sei costante."
        ],
        "tabComeback": [
          "Eccoti.", "Bentornato, umano.", "Sei sparito.", "Già tornato?",
          "Ho tenuto il forte.", "Ti sono mancato?"
        ],
        "teasing": [
          "Dammi quello.", "Posa il gioco.", "È mio.", "Smettila.",
          "Ridammelo ora.", "Lo vedo."
        ]
      },
      ar: {
        "random": [
          "الثعلب متصل.", "هذه الصفحة برية.", "أنا أراقبك.", "دورية الثعلب.",
          "همم. كمل.", "الذيل مشبوه."
        ],
        "happy": [
          "هذا أعجبني.", "ليس سيئاً، يا إنسان.", "أخيراً بعض الهدوء.", "اختيار جيد.",
          "أوافق.", "كمل هكذا."
        ],
        "angry": [
          "أبداً لا.", "وقح جداً.", "جربها ثانية.", "أنا أحكم عليك.",
          "كفى الآن.", "تجاوزت الحد."
        ],
        "confused": [
          "ما هذا؟", "اشرح هذه الفوضى.", "لا معنى له.", "انتظر. لماذا؟",
          "لدي أسئلة.", "حتى أنا محتار."
        ],
        "hungry": [
          "أطعمني أولاً.", "سمكة ستساعد.", "وعائي فارغ.", "سناك الآن؟",
          "أستطيع الأكل.", "أشم رائحة العشاء."
        ],
        "sleepy": [
          "أنا أنعس.", "قيلولة قريباً.", "أيقظني لاحقاً.", "المكان مريح جداً.",
          "عيناي تغلقان.", "خمس دقائق أخرى."
        ],
        "interactive": [
          "بلطف مع الثعلب.", "انتبه للذيل.", "احترم الفرو.", "نعم، هنا جيد.",
          "ليس بقوة.", "سأتحمل هذا."
        ],
        "feedbackQuestion": ["الثعلب جيد؟", "أكمل؟", "دهاء كثير؟", "الذيل يوافق؟", "أبقى هنا؟", "خمس نجوم؟", "توافق؟", "أتكلم كثيراً؟", "لحظة ناجحة؟", "الثعلب مفيد؟"],
        "voteLike": ["خمس نجوم أيضاً؟", "ذوق جيد.", "كنت أعرف.", "اختيار صحيح.", "أخيراً احترام.", "غروري سعيد.", "الذيل راض.", "الثعلب ممتن."],
        "voteDislike": ["توقعت ذلك.", "وقح لكن مسجل.", "نقرة باردة.", "غروري تألم.", "اختيار جريء.", "هذا يؤلم.", "لست متفاجئاً.", "الذيل يرفض."],
        "grabbed": [
          "مهلاً، أنزل الثعلب.", "عفواً؟", "أستطيع المشي.", "لم نتفق على هذا.",
          "حرر الثعلب.", "وقاحة صغيرة."
        ],
        "heldStill": [
          "ما زلت تحملني؟", "سنعيش هنا؟", "لدي أرجل.", "ما الخطة؟",
          "انتهيت؟", "هذا محرج."
        ],
        "heldMoving": [
          "سريع جداً.", "بهدوء.", "لست حقيبة.", "إلى أين؟",
          "هز أقل، رجاءً.", "أفضل المشي."
        ],
        "longHeld": [
          "حسناً، كفى.", "اتركني جدياً.", "النكتة انتهت.", "صبري انتهى.",
          "حررني الآن.", "سأشتكي."
        ],
        "dropped": [
          "هبوط وقح.", "شعرت بهذا.", "حذرني أولاً.", "هبوط لا بأس.",
          "ألطف المرة القادمة.", "ثبت الهبوط."
        ],
        "thrown": [
          "لماذا أطير؟", "لا ترم الثعالب.", "أكره هذا.", "أسوأ شركة طيران.",
          "الذيل مذعور.", "اخترت الفوضى."
        ],
        "cursorSuspicious": [
          "أرى ذلك المؤشر.", "المؤشر مذنب.", "لا تختبرني.", "تحوم بغرابة.",
          "أبعد ذلك الشيء.", "رأيت هذا."
        ],
        "cursorThreat": [
          "تراجع.", "قريب جداً.", "مساحة شخصية.", "سأضرب.",
          "ليس على الشوارب.", "انتبه للذيل."
        ],
        "cursorPanic": [
          "لا لا لا.", "هجوم مؤشر!", "قريب جداً!", "انسحاب.",
          "مخالب طوارئ.", "أحتاج مسافة."
        ],
        "running": [
          "زوميز مفعلة.", "افسحوا الطريق.", "أنا السرعة.", "المخالب مشغولة.",
          "مهام مهمة.", "جرب تمسكني."
        ],
        "walking": [
          "دورية صغيرة.", "أفحص الأشياء.", "مخالب هادئة.", "مشية صغيرة.",
          "هذا طريقي.", "الدورية مستمرة."
        ],
        "climbing": [
          "نصعد.", "وضع الجدار.", "طريق عمودي.", "شاهدني أتسلق.",
          "قط جبلي صغير.", "اختصار وجدته."
        ],
        "jumping": [
          "بوينغ.", "قفزة جميلة.", "مخالب في الهواء.", "قفزة محسوبة.",
          "كان مقصوداً.", "الهبوط لاحقاً."
        ],
        "grooming": [
          "وقت التنظيف.", "صيانة الفرو.", "مشغول بالتنظيف.", "المظهر مهم.",
          "لحظة واحدة.", "لا تقاطعني."
        ],
        "watching": [
          "أنا أشاهد أيضاً.", "مثير حتى الآن.", "هذا جذب انتباهي.", "همم. كمل.",
          "أنا مهتم الآن.", "ما زلت أقرر."
        ],
        "videoPlay": [
          "حسناً، شغله.", "أرني.", "لنرَ.", "بدأ العرض.",
          "أخيراً.", "جيد، كمل."
        ],
        "videoPause": [
          "لماذا أوقفت؟", "كنا نشاهد.", "كمل.", "كنت مشغولاً.",
          "كان هذا وقحاً.", "شغله ربما؟"
        ],
        "mischief": [
          "لم ألمس شيئاً.", "لا دليل.", "كانت الريح.", "كما يزعمون.",
          "كنت في مكان آخر.", "لا أؤكد شيئاً."
        ],
        "fishing": [
          "سمكة مرصودة.", "العشاء يهرب.", "الثعلب يصطاد.", "اثبتي.",
          "سأمسكها.", "سناك حي."
        ],
        "coin": [
          "لامعة.", "لي الآن.", "تم أخذ العملة.", "أحب هذا.",
          "كنز وجدته.", "واحدة أخرى، رجاءً."
        ],
        "eating": [
          "تم أخذ السمكة.", "لذيذ.", "وليمة ثعلب.", "المزيد، رجاءً.",
          "استحق القفزة.", "العشاء اختفى."
        ],
        "ball": [
          "كرة مرصودة.", "الثعلب يلعب.", "لي.", "سأمسكها.",
          "الارتداد شخصي.", "وضع الالتقاط."
        ],
        "spider": [
          "عنكبوت!", "رأيت حركة.", "تعال هنا، حشرة.", "الأمر شخصي.",
          "وضع الصيد.", "لا يعجبني."
        ],
        "bigSpider": [
          "عنكبوت ضخم.", "لماذا هو كبير؟", "أحتاج دعماً.", "حسناً، هذا وقح.",
          "حشرة كبيرة، نفس الغرور.", "ما زلت شجاعاً."
        ],
        "webbed": [
          "أنا عالق.", "هذا لزج.", "غير عادل.", "الخيوط تغش.",
          "أكره هذا.", "أحتاج مساعدة."
        ],
        "stuck": [
          "الطريق مغلق.", "همم.", "هذا مزعج.", "أحتاج طريقاً آخر.",
          "هذا الطريق يكذب.", "المخالب تعيد الحساب."
        ],
        "content": [
          "يبدو درامياً.", "صورة مثيرة.", "ضغطت على الطعم.", "الأجواء غريبة.",
          "لدي ملاحظات.", "قد يكون جيداً."
        ],
        "channelMemory": [
          "هذه القناة مجدداً.", "أعرف {channel}.", "عدنا هنا.", "مكان مألوف.",
          "{channel} مجدداً؟", "تثق بهذا المكان."
        ],
        "memeMood": [
          "كان ملعوناً.", "سلوك الإنترنت.", "ألوم الإنترنت.", "خلاصتك غريبة.",
          "عبث كامل.", "ضحكت قليلاً."
        ],
        "timeMorning": [
          "الصباح بالفعل؟", "صباح الخير.", "سحب صباحي.", "الشمس استيقظت.",
          "الفطور أولاً؟", "يوم جديد، فوضى."
        ],
        "timeAfternoon": [
          "فحص الظهر.", "ما زلت تسحب؟", "أجواء الظهيرة.", "الشمس تعمل.",
          "دورية بعد الظهر.", "لا قيلولة؟"
        ],
        "timeEvening": [
          "المساء بالفعل.", "ساعات مريحة.", "وضع الليل قريباً.", "شاشة هادئة.",
          "دورية المساء.", "العشاء ربما."
        ],
        "timeLate": [
          "الوقت متأخر.", "اذهب للنوم.", "نوبة القمر.", "نحن مستيقظون متأخرين.",
          "سريرك يناديك.", "ساعات الغوبلن."
        ],
        "watchStart": [
          "سأجلس.", "جلسة جديدة.", "حسناً، نشاهد.", "أنا جالس.",
          "ليكن جيداً.", "هيا بنا."
        ],
        "watchSession": [
          "{sessionMinutes} دقيقة بالفعل.", "ما زلت هنا؟", "أنت ملتزم.", "جلسة طويلة.",
          "الوقت اختفى.", "سنظل فعلاً."
        ],
        "watchLong": [
          "هذا ماراثون.", "أنت تعيش هنا الآن.", "العشب لاحقاً.", "مشاهدة طويلة.",
          "اشرب ماء ربما.", "ما زلت قوياً."
        ],
        "watchMilestone": [
          "{sessionMinutes} دقيقة. جيد.", "وصلنا للمرحلة.", "لاحظت ذلك.", "التزام جميل.",
          "وقت مسروق جيداً.", "نجحنا."
        ],
        "watchVideoLong": [
          "{currentVideoMinutes} دقيقة؟", "هذه فيديو ضخم.", "طاقة فيديو كبيرة.", "سنبقى جالسين.",
          "طويل، صح؟", "ارتاح."
        ],
        "returningWatcher": [
          "ها أنت مجدداً.", "مرحباً بعودتك.", "لقد عدت.", "حفظت مكانك.",
          "نفس الطقس.", "كنت أنتظرك."
        ],
        "channelLoyalty": [
          "{channel} مجدداً.", "طاقة وفاء.", "تعود دائماً.", "قناتك المفضلة؟",
          "عودة إلى {channel}.", "أنت ثابت."
        ],
        "tabComeback": [
          "ها أنت.", "مرحباً، يا إنسان.", "اختفيت.", "رجعت بسرعة؟",
          "حميت المكان.", "اشتقت لي؟"
        ],
        "teasing": [
          "أعطني هذا.", "ضع اللعبة.", "هذا لي.", "توقف عن اللعب.",
          "أعده الآن.", "أنا أراه."
        ]
      }
    }
  };

  // Active hand-written speech brain. This replaces the old random-feeling line pool at runtime.
  const SMART_SPEECH_LIBRARY = {
  "en": {
    "random": ['What are we watching, human?', 'That thumbnail looks crunchy.', 'I see your cursor moving.', 'Too many tabs open, human.', 'This video smells boring.', 'Is this the good part?', 'I’d pounce on that.', 'Nice click. Very fast.', 'Still here, human?', 'Your feed looks strange.', 'This tab smells funny.', 'I saw that scroll.'],
    "happy": ['Okay, that was nice.', 'I liked that.', 'Good choice, human.', 'That felt right.', 'Fine. I am pleased.', 'Tiny purr approved.', 'Tail approves.', 'You did well, human.', 'Acceptable pets.', 'Nice click, human.'],
    "angry": ['That was a miss, human.', 'Why click that?', 'My tail is disappointed.', 'Focus, human. Focus.', 'I’ve seen better.', 'Actually embarrassing.', 'Try clicking better.', 'Was that the plan?', 'Careful, human.', 'Do not test me.', 'That was rude.', 'I will remember that.'],
    "confused": ['What was that?', 'Explain yourself, human.', 'Why would you click that?', 'Was that the plan?', 'I have questions.', 'Even I noticed.', 'Suspicious choice, human.', 'That looked wrong.', 'Are we okay?', 'Pause. Think, human.'],
    "hungry": ['Where are the snacks, human?', 'I require fish tax.', 'Feed me or I stare.', 'Is that food? No?', 'My bowl is half-empty.', 'Stomach growling, human.', 'Snack time now?', 'Fish would fix this.', 'Dinner is late.', 'Share the pixels.'],
    "sleepy": ['Eyes getting heavy, human.', 'I’m napping on your cursor.', 'Go to the sleep box.', 'One more video. Only one.', 'Five more minutes.', 'Too cozy here.', 'Wake me later.', 'Nap loading now.', 'Silence sounds nice.', 'Blanket required.'],
    "interactive": ['Pet me instead.', 'Hands off the fur.', 'My beans are sensitive.', 'Don’t stop the pets.', 'Soft pets only.', 'Watch your fingers, human.', 'Careful with the tail.', 'That spot is nice.', 'Okay, keep going.', 'Gentle, human.', 'No rough paws.', 'Respect the fluff.'],
    "feedbackQuestion": ['Was that cute?', 'Did I help?', 'Too much sass?', 'Keep me talking?', 'Need more chaos?', 'Five stars yet?', 'Are we friends?', 'Do I stay?', 'Good cat moment?', 'Want softer meows?', 'Was that too much?', 'You like this?'],
    "voteLike": ['Five stars too?', 'I knew it.', 'Correct answer.', 'Good human.', 'Tiny ego fed.', 'Purr approved.', 'Kindness detected.', 'You may continue.', 'I accept tribute.', 'Tail says thanks.'],
    "voteDislike": ['What did I expect?', 'Rude but noted.', 'Bold little click.', 'Your loss, human.', 'That stung.', 'I expected betrayal.', 'Fair. Still rude.', 'My ego limped.', 'Cold, honestly.', 'Tail is disappointed.'],
    "grabbed": ['Put me back, human.', 'I am not a toy.', 'Hands off the fur.', 'Where are we going?', 'My beans are sensitive.', 'You’re weird, human.', 'Let go, human.', 'Personal space, human.', 'Careful with me.', 'I can walk.'],
    "heldStill": ['Still holding me?', 'We live here now?', 'I have paws.', 'What is the plan?', 'You done, human?', 'This is awkward.', 'Put me back.', 'I need the floor.'],
    "heldMoving": ['Too fast, human.', 'I am not luggage.', 'Where are we going?', 'Less shaking, please.', 'I preferred walking.', 'Tail is not steering.', 'Easy, human.', 'Careful with the paws.'],
    "longHeld": ['Let go, human.', 'Still holding me?', 'This is getting weird.', 'I need freedom.', 'My patience is gone.', 'Release the paws.', 'Put me down.', 'Enough carrying, human.', 'Pets, not kidnapping.', 'Floor time now.'],
    "dropped": ['Gravity found me again.', 'I meant to do that.', 'Rude landing, human.', 'Floor says hello.', 'That was unnecessary.', 'My paws felt that.', 'Calculated move. Trust me.', 'Try gentler next time.', 'Landing was dramatic.', 'Tail survived.'],
    "thrown": ['Why am I flying?', 'I meant to do that.', 'Air paws activated.', 'Rude launch, human.', 'This is not flying.', 'Gravity is waiting.', 'Catch me, maybe?', 'My tail disagrees.', 'That was dramatic.', 'No throwing cats.'],
    "cursorSuspicious": ['Cursor looks suspicious.', 'Stop poking my nose.', 'I see that arrow.', 'Don’t click that.', 'Mouse is sneaking.', 'That pointer is plotting.', 'I saw that move.', 'Slow down, human.', 'Your cursor is loud.', 'Hover gently, human.'],
    "cursorThreat": ['Stop poking my nose.', 'I’ll bite that arrow.', 'Watch your fingers, human.', 'Don’t even think it.', 'Back up, cursor.', 'Too close, human.', 'Mind the whiskers.', 'Respect the nose.', 'Personal bubble, human.', 'No sudden clicks.'],
    "cursorPanic": ['Cursor attack!', 'Too close!', 'Emergency paws.', 'Need distance now.', 'Nope nope nope.', 'Retreating, human.', 'That arrow bites.', 'Panic paws active.'],
    "running": ['Zoomies activated.', 'Make way, human.', 'Paws busy.', 'Try catching me.', 'Tiny sprint time.', 'Floor patrol urgent.', 'Fast paws today.', 'Running from boredom.'],
    "walking": ['Just patrolling.', 'Tiny rounds.', 'Checking things.', 'Soft paws only.', 'Little walk.', 'I own this route.', 'Paw patrol, human.', 'Quiet steps. Loud judgment.'],
    "climbing": ['Up we go.', 'Wall time.', 'Vertical route.', 'Look at me climb.', 'Shortcut found.', 'Claws doing work.', 'High ground, human.', 'Gravity can wait.'],
    "jumping": ['Boing.', 'Air paws.', 'Calculated leap.', 'Landing pending.', 'I meant that.', 'Tiny jump math.', 'Up we go.', 'Pounce angle ready.'],
    "grooming": ['Bath time.', 'Do not interrupt.', 'Fur maintenance.', 'I own this screen.', 'Don’t look at me, human.', 'Presentation matters.', 'Tail check complete.', 'Clean paws, clean life.', 'Self-care, human.', 'Still majestic.'],
    "watching": ['What are we watching, human?', 'This video smells boring.', 'Is this the good part?', 'The comments are scary.', 'Don’t read the text below.', 'That thumbnail looks crunchy.', 'I’m watching too.', 'This better be good.', 'I have notes.', 'Your taste is showing.', 'Interesting choice, human.', 'Keep the noise down.'],
    "videoPlay": ['Keep the noise down.', 'Show me, human.', 'Finally, movement.', 'Let it roll.', 'This better be good.', 'Is this the good part?', 'Eyes on screen.', 'Okay, play it.', 'Start the tiny cinema.', 'I’m listening.'],
    "videoPause": ['Why did we pause, human?', 'We were watching.', 'Unpause, maybe?', 'I was invested.', 'That was sudden.', 'Did it scare you?', 'Noise stopped. Suspicious.', 'Continue the thing.', 'Pause? Bold choice.', 'My ears noticed.'],
    "mischief": ['I didn’t touch it.', 'Don’t look at me, human.', 'My tail saw nothing.', 'Calculated move. Trust me.', 'Gravity found me again.', 'My paw slipped.', 'The screen started it.', 'No proof, human.', 'Pretend you saw nothing.', 'Tail is innocent.'],
    "fishing": ['Fish tax detected.', 'Dinner is moving.', 'Hold still, fish.', 'Snack incoming, human.', 'I smell fish.', 'Tiny hunt begins.', 'Fish looks guilty.', 'That fish is mine.', 'Pounce time.', 'Fresh snack spotted.'],
    "coin": ['Shiny thing, human.', 'Mine now.', 'Coin acquired.', 'I like shiny.', 'Treasure found.', 'Another shiny, please.', 'Pocket sparkle found.', 'Tiny treasure tax.'],
    "eating": ['Snack secured.', 'Fish tax accepted.', 'That helped.', 'More, please.', 'Bowl status improved.', 'Tiny feast complete.', 'Delicious, human.', 'No crumbs remain.'],
    "ball": ['Ball wants trouble.', 'I would pounce.', 'Kick it here.', 'That bounce was rude.', 'Game on, human.', 'Ball is suspicious.', 'My paws are ready.', 'Tiny striker mode.', 'Bounce again. I dare.', 'That ball blinked first.'],
    "spider": ['Spider spotted.', 'Bug looks suspicious.', 'I saw movement.', 'Come here, bug.', 'Tiny hunt begins.', 'Not a fan.', 'Eight legs? Rude.', 'Spider owes rent.', 'I handle this.', 'Watch this, human.'],
    "bigSpider": ['That spider is huge.', 'Backup maybe?', 'Big bug energy.', 'Still brave, human.', 'Eight giant problems.', 'Why so many legs?', 'I need bigger paws.', 'Careful, human.'],
    "webbed": ['I am stuck.', 'This is sticky.', 'Webs are cheating.', 'Help, human.', 'Spider was rude.', 'My paws are trapped.', 'Sticky paws. Bad day.', 'Not my best moment.', 'Get this off.', 'I hate webs.'],
    "stuck": ['Path blocked.', 'Need another route.', 'This way lied.', 'Wall said no.', 'Recalculating paws.', 'I meant to stop.', 'Tiny obstacle, human.', 'Gravity got involved.', 'Floor is complicated.', 'Not stuck. Thinking.'],
    "content": ['This looks dramatic.', 'Thumbnail looks crunchy.', 'You clicked bait.', 'The comments are scary.', 'Don’t read below.', 'I have notes.', 'This smells boring.', 'Risky click, human.', 'Your feed worries me.', 'Scroll with caution.'],
    "channelMemory": ['This channel again.', 'I know {channel}.', 'Back here again.', '{channel} again?', 'Pattern detected.', 'Same pixels, human.', 'Comfort channel detected.', 'Your routine is showing.'],
    "memeMood": ['Internet behavior.', 'That was strange.', 'Your feed is weird.', 'Peak nonsense.', 'I laughed a little.', 'Pixels feel cursed.', 'Normal human behavior?', 'Tiny chaos detected.'],
    "timeMorning": ['Morning, human.', 'Sun is up.', 'Breakfast first?', 'Early scroll today.', 'Fresh day, same chaos.', 'Coffee smells useful.', 'Wake gently, human.', 'Too early for this.'],
    "timeAfternoon": ['Afternoon, human.', 'Still scrolling?', 'Snack hour maybe.', 'Sun is still working.', 'No nap yet?', 'Daylight is judging.', 'Lunch first, maybe.', 'Paws still awake.'],
    "timeEvening": ['Evening, human.', 'Cozy hours now.', 'Dinner time maybe.', 'Soft screen hours.', 'Sun went away.', 'Night mode soon.', 'Tiny blanket weather.', 'Good watching hour.'],
    "timeLate": ['Human, it is late.', 'Go to sleep box.', 'Eyes getting heavy, human.', 'Is the sun up yet?', 'One more video. Only one.', 'Your bed misses you.', 'Moon is watching.', 'Sleep is free.', 'Tiny nap recommended.', 'Tomorrow saw this.'],
    "watchStart": ['What are we watching, human?', 'This better be good.', 'New watch begins.', 'I am seated.', 'Eyes on pixels.', 'Show me the thing.', 'Tiny cinema time.', 'Let us watch.'],
    "watchSession": ['{sessionMinutes} minutes already.', 'Still here, human?', 'Time vanished again.', 'Long session today.', 'Your chair owns you.', 'One more video?', 'You stayed awhile.', 'Tiny break maybe?', 'Blink, human.', 'Hydrate, human.'],
    "watchLong": ['Human, take a break.', 'Go to the sleep box.', 'One more video. Only one.', 'Your bed misses you.', 'Blink, human.', 'Hydrate, maybe.', 'This is a marathon.', 'Long watch today.', 'Tiny stretch time.', 'Chair claimed you.'],
    "watchMilestone": ['{sessionMinutes} minutes. Noted.', 'Milestone reached, human.', 'I noticed.', 'That is commitment.', 'Tiny badge earned.', 'Time got eaten.', 'Still here together.', 'Paws counted that.'],
    "watchVideoLong": ['Long video survived.', 'Same video still?', '{currentVideoMinutes} minutes here.', 'That was commitment.', 'Attention still alive?', 'Big video, tiny paws.', 'I sat through that.', 'Respect the patience.'],
    "returningWatcher": ['Back again, human.', 'You returned.', 'Pattern noticed.', 'Same taste again.', 'Old trail reopened.', 'Welcome back, human.', 'I waited here.', 'Missed me? Obviously.'],
    "channelLoyalty": ['Same channel again.', '{channel} again?', 'You came back again.', 'Routine detected.', 'Comfort channel, human.', 'I remember this place.', 'Same den, same human.', 'Predictable, but cozy.'],
    "tabComeback": ['You returned.', 'I waited here.', 'Where did you go?', 'I guarded pixels.', 'Welcome back, human.', 'Suspicious absence noted.', 'Back from wandering?', 'Tab trail resumed.']
      },
  "fr": {
    "random": [
      "Encore toi. Bien.", "Je te regarde.", "Ce clic était suspect.", "Je dormais, moi.",
      "Tu scrolles trop.", "Hmm. Continue."
    ],
    "happy": [
      "Ça, j’aime bien.", "Pas mal, humain.", "Enfin, du calme.", "Bon choix.",
      "Je valide.", "Continue comme ça."
    ],
    "angry": [
      "Non.", "Très impoli.", "Refais ça pour voir.", "Je te juge.",
      "Ça suffit.", "Limite dépassée."
    ],
    "confused": [
      "C’était quoi ça ?", "Explique ce bazar.", "Rien compris.", "Attends. Pourquoi ?",
      "J’ai des questions.", "Même moi, je bloque."
    ],
    "hungry": [
      "Nourris-moi d’abord.", "Un poisson aiderait.", "Mon bol est vide.", "Snack maintenant ?",
      "Je pourrais manger.", "Je sens le dîner."
    ],
    "sleepy": [
      "Je m’endors.", "Sieste bientôt.", "Réveille-moi plus tard.", "Trop confortable ici.",
      "Mes yeux ferment.", "Encore cinq minutes."
    ],
    "interactive": [
      "Doucement, merci.", "Attention aux pattes.", "Tu peux me caresser.", "Là, c’est bien.",
      "Ne t’arrête pas.", "Surveille la queue."
    ],
    "feedbackQuestion": ["C’était mignon ?", "J’ai aidé ?", "Trop de sarcasme ?", "Je continue ?", "Encore du chaos ?", "Je fais une sieste ?", "Cinq étoiles ?", "C’était fluide ?", "On est amis ?", "Je reste ?"],
    "voteLike": ["Cinq étoiles aussi ?", "Je le savais.", "Choix correct.", "Bon humain.", "Respect enfin.", "Égo nourri.", "Ronron validé.", "Gentillesse détectée.", "Tu peux continuer."],
    "voteDislike": ["Je m’y attendais.", "Cruel, mais noté.", "Clic très froid.", "Mon ego souffre.", "Choix audacieux.", "Ça pique.", "Même pas surpris.", "Noté, malheureusement."],
    "grabbed": [
      "Hé, pose-moi.", "Pardon ?", "Je peux marcher.", "Pas prévu ça.",
      "Libère le chat.", "Un peu impoli."
    ],
    "heldStill": [
      "Tu me tiens encore ?", "On vit ici ?", "J’ai des pattes.", "C’est quoi le plan ?",
      "Tu as fini ?", "C’est gênant."
    ],
    "heldMoving": [
      "Trop vite.", "Doucement.", "Je ne suis pas bagage.", "On va où ?",
      "Moins de secousses.", "Je préfère marcher."
    ],
    "longHeld": [
      "Bon, assez.", "Lâche-moi sérieusement.", "La blague est finie.", "Ma patience est morte.",
      "Libère-moi maintenant.", "Je porte plainte."
    ],
    "dropped": [
      "Atterrissage impoli.", "J’ai senti ça.", "Préviens-moi avant.", "Assez gracieux.",
      "Plus doux la prochaine.", "Atterrissage réussi."
    ],
    "thrown": [
      "Pourquoi je vole ?", "Absolument pas.", "Je déteste cette partie.", "Rattrape-moi peut-être.",
      "Pire compagnie aérienne.", "Tu as lancé un chat."
    ],
    "cursorSuspicious": [
      "Je vois ce curseur.", "Ce pointeur est louche.", "Ne me teste pas.", "Tu survoles bizarrement.",
      "Recule ce truc.", "J’ai vu ça."
    ],
    "cursorThreat": [
      "Recule.", "Trop près.", "Espace personnel.", "Je vais frapper.",
      "Pas les moustaches.", "Attention à la queue."
    ],
    "cursorPanic": [
      "Non non non.", "Attaque de curseur !", "Trop près !", "Retraite.",
      "Pattes d’urgence.", "Besoin de distance."
    ],
    "running": [
      "Zoomies activés.", "Faites place.", "Je suis vitesse.", "Pattes occupées.",
      "Courses importantes.", "Attrape-moi donc."
    ],
    "walking": [
      "Petite patrouille.", "Je vérifie.", "Pattes discrètes.", "Petite marche.",
      "Cette route est mienne.", "Ronde en cours."
    ],
    "climbing": [
      "On monte.", "Mode mur.", "Route verticale.", "Regarde-moi grimper.",
      "Petit chat montagne.", "Raccourci trouvé."
    ],
    "jumping": [
      "Boing.", "Joli saut.", "Pattes en l’air.", "Saut calculé.",
      "C’était voulu.", "Atterrissage en attente."
    ],
    "grooming": [
      "Toilette.", "Entretien de fourrure.", "Occupé à nettoyer.", "Présentation importante.",
      "Une seconde.", "Ne m’interromps pas."
    ],
    "watching": [
      "Je regarde aussi.", "Intéressant jusque-là.", "Ça m’intéresse.", "Hmm. Continue.",
      "Je suis investi.", "Je décide encore."
    ],
    "videoPlay": [
      "Ok, lance.", "Montre-moi.", "Voyons ça.", "Ça tourne.",
      "Enfin.", "Bien, continue."
    ],
    "videoPause": [
      "Pourquoi pause ?", "On regardait.", "Continue.", "J’étais occupé.",
      "C’était impoli.", "Reprends peut-être ?"
    ],
    "mischief": [
      "Je n’ai rien touché.", "Aucune preuve.", "C’était le vent.", "Prétendument.",
      "J’étais ailleurs.", "Je confirme rien."
    ],
    "fishing": [
      "Poisson repéré.", "À moi.", "Bouge pas, poisson.", "Le dîner fuit.",
      "J’ai vu ta queue.", "Moment bond."
    ],
    "coin": [
      "Brillant.", "À moi maintenant.", "Pièce prise.", "J’aime ça.",
      "Trésor trouvé.", "Encore une, merci."
    ],
    "eating": [
      "Ça valait le coup.", "Ça fait du bien.", "Délicieux.", "Encore, merci.",
      "Meilleure décision.", "Poisson règle tout."
    ],
    "ball": [
      "Balle détectée.", "On joue maintenant.", "À moi.", "Envoie ici.",
      "Ce rebond était personnel.", "C’est parti."
    ],
    "spider": [
      "Araignée repérée.", "J’ai vu bouger.", "Viens ici, insecte.", "C’est personnel.",
      "Mode chasseur.", "Pas fan."
    ],
    "bigSpider": [
      "Énorme araignée.", "Pourquoi si grosse ?", "Besoin de renfort.", "Ok, c’est rude.",
      "Gros insecte, même attitude.", "Je reste brave."
    ],
    "webbed": [
      "Je suis coincé.", "C’est collant.", "Injuste.", "Les toiles trichent.",
      "Je déteste ça.", "Besoin d’aide."
    ],
    "stuck": [
      "Chemin bloqué.", "Hmm.", "C’est agaçant.", "Autre route nécessaire.",
      "Ce chemin ment.", "Pattes recalculent."
    ],
    "content": [
      "Ça semble dramatique.", "Miniature intéressante.", "Tu as cliqué au piège.", "Ambiance étrange.",
      "J’ai des notes.", "Ça peut être bien."
    ],
    "channelMemory": [
      "Cette chaîne encore.", "Je connais {channel}.", "Nous revoilà ici.", "Endroit familier.",
      "Encore {channel} ?", "Tu fais confiance ici."
    ],
    "memeMood": [
      "C’était maudit.", "Comportement internet.", "Je blâme internet.", "Ton feed est bizarre.",
      "Nonsense maximal.", "J’ai un peu ri."
    ],
    "timeMorning": [
      "Déjà le matin ?", "Bonjour.", "Scroll matinal.", "Le soleil est levé.",
      "Petit-déjeuner d’abord ?", "Nouveau jour, chaos."
    ],
    "timeAfternoon": [
      "Point après-midi.", "Tu scrolles encore ?", "Ambiance midi.", "Le soleil bosse encore.",
      "Patrouille d’après-midi.", "Pas de sieste ?"
    ],
    "timeEvening": [
      "Déjà le soir.", "Heures cosy.", "Mode nuit bientôt.", "Écran tout doux.",
      "Patrouille du soir.", "Dîner peut-être."
    ],
    "timeLate": [
      "Il est tard.", "Va dormir.", "Service lune.", "On veille tard.",
      "Ton lit appelle.", "Heures gobelin."
    ],
    "watchStart": [
      "Je m’installe.", "Nouvelle session.", "Ok, regardons.", "Je suis assis.",
      "Ça doit être bien.", "C’est parti."
    ],
    "watchSession": [
      "{sessionMinutes} minutes déjà.", "Encore là ?", "Tu es engagé.", "Longue session.",
      "Le temps a disparu.", "On reste vraiment."
    ],
    "watchLong": [
      "C’est un marathon.", "Tu vis ici maintenant.", "L’herbe attendra.", "Long visionnage.",
      "Hydrate-toi peut-être.", "Toujours solide."
    ],
    "watchMilestone": [
      "{sessionMinutes} minutes. Bien.", "Palier atteint.", "J’ai remarqué.", "Bel engagement.",
      "Temps bien volé.", "On l’a fait."
    ],
    "watchVideoLong": [
      "{currentVideoMinutes} minutes ?", "Cette vidéo est énorme.", "Grosse énergie vidéo.", "On reste assis.",
      "Longue, hein ?", "Installe-toi."
    ],
    "returningWatcher": [
      "Te revoilà.", "Bon retour.", "Tu es revenu.", "J’ai gardé ta place.",
      "Même rituel.", "Je t’attendais."
    ],
    "channelLoyalty": [
      "Encore {channel}.", "Énergie fidèle.", "Tu reviens toujours.", "Chaîne favorite ?",
      "Retour à {channel}.", "Tu es constant."
    ],
    "tabComeback": [
      "Te voilà.", "Bon retour, humain.", "Tu as disparu.", "Déjà de retour ?",
      "J’ai gardé le fort.", "Je t’ai manqué ?"
    ]
      },
  "it": {
    "random": [
      "Ancora tu. Bene.", "Ti sto guardando.", "Quel clic era sospetto.", "Stavo dormendo.",
      "Scrolli troppo.", "Hmm. Continua."
    ],
    "happy": [
      "Questo mi piace.", "Non male, umano.", "Finalmente pace.", "Buona scelta.",
      "Approvo.", "Continua così."
    ],
    "angry": [
      "Assolutamente no.", "Che maleducato.", "Riprova, dai.", "Ti sto giudicando.",
      "Ora basta.", "Linea superata."
    ],
    "confused": [
      "Cos’era quello?", "Spiega questo caos.", "Non ha senso.", "Aspetta. Perché?",
      "Ho domande.", "Anche io sono confuso."
    ],
    "hungry": [
      "Prima nutrimi.", "Un pesce aiuterebbe.", "La ciotola è vuota.", "Snack adesso?",
      "Potrei mangiare.", "Sento odore di cena."
    ],
    "sleepy": [
      "Mi sto addormentando.", "Presto pisolino.", "Svegliami dopo.", "Troppo comodo qui.",
      "Gli occhi si chiudono.", "Altri cinque minuti."
    ],
    "interactive": [
      "Piano, grazie.", "Occhio alle zampe.", "Puoi accarezzarmi.", "Lì va bene.",
      "Non fermarti ora.", "Attento alla coda."
    ],
    "feedbackQuestion": ["Era carino?", "Ho aiutato?", "Troppo sarcasmo?", "Continuo?", "Ancora caos?", "Faccio un pisolino?", "Cinque stelle?", "Era fluido?", "Siamo amici?", "Resto qui?"],
    "voteLike": ["Cinque stelle anche?", "Lo sapevo.", "Scelta corretta.", "Bravo umano.", "Finalmente rispetto.", "Ego nutrito.", "Fusa approvate.", "Gentilezza rilevata.", "Puoi continuare."],
    "voteDislike": ["Me lo aspettavo.", "Crudele, ma segnato.", "Click molto freddo.", "Il mio ego soffre.", "Scelta audace.", "Fa male.", "Nemmeno sorpreso.", "Segnato, purtroppo."],
    "grabbed": [
      "Ehi, mettimi giù.", "Scusa?", "So camminare.", "Non era previsto.",
      "Libera il gatto.", "Abbastanza scortese."
    ],
    "heldStill": [
      "Mi tieni ancora?", "Viviamo qui?", "Ho le zampe.", "Qual è il piano?",
      "Hai finito?", "È imbarazzante."
    ],
    "heldMoving": [
      "Troppo veloce.", "Piano.", "Non sono bagaglio.", "Dove andiamo?",
      "Meno scosse, grazie.", "Preferivo camminare."
    ],
    "longHeld": [
      "Ok, basta.", "Lasciami davvero.", "Scherzo finito.", "Pazienza finita.",
      "Liberami adesso.", "Farò reclamo."
    ],
    "dropped": [
      "Atterraggio scortese.", "L’ho sentito.", "Avvisa prima.", "Abbastanza elegante.",
      "Più piano la prossima.", "Atterraggio riuscito."
    ],
    "thrown": [
      "Perché sto volando?", "Assolutamente no.", "Odio questa parte.", "Prendimi forse.",
      "Peggior compagnia aerea.", "Hai lanciato un gatto."
    ],
    "cursorSuspicious": [
      "Vedo quel cursore.", "Quel puntatore è colpevole.", "Non sfidarmi.", "Stai passando strano.",
      "Tieni lontano quel coso.", "Ho visto."
    ],
    "cursorThreat": [
      "Indietro.", "Troppo vicino.", "Spazio personale.", "Ti graffio.",
      "Non sui baffi.", "Occhio alla coda."
    ],
    "cursorPanic": [
      "No no no.", "Attacco cursore!", "Troppo vicino!", "Ritirata.",
      "Zampe d’emergenza.", "Mi serve distanza."
    ],
    "running": [
      "Zoomies attivati.", "Fate largo.", "Sono velocità.", "Zampe occupate.",
      "Commissioni importanti.", "Prova a prendermi."
    ],
    "walking": [
      "Piccola pattuglia.", "Controllo cose.", "Zampe silenziose.", "Passeggiatina.",
      "Questa strada è mia.", "Giro in corso."
    ],
    "climbing": [
      "Si sale.", "Modalità muro.", "Percorso verticale.", "Guardami scalare.",
      "Piccolo gatto montagna.", "Scorciatoia trovata."
    ],
    "jumping": [
      "Boing.", "Bel salto.", "Zampe in aria.", "Salto calcolato.",
      "Volevo farlo.", "Atterraggio in arrivo."
    ],
    "grooming": [
      "Bagnetto.", "Manutenzione pelo.", "Sto pulendo.", "La presentazione conta.",
      "Un attimo.", "Non interrompere."
    ],
    "watching": [
      "Guardo anche io.", "Interessante finora.", "Ha la mia attenzione.", "Hmm. Continua.",
      "Ora sono coinvolto.", "Sto ancora decidendo."
    ],
    "videoPlay": [
      "Ok, avvia.", "Fammi vedere.", "Vediamo.", "Si parte.",
      "Finalmente.", "Bene, continua."
    ],
    "videoPause": [
      "Perché pausa?", "Stavamo guardando.", "Continua.", "Ero occupato.",
      "Che maleducato.", "Riprendi forse?"
    ],
    "mischief": [
      "Non ho toccato nulla.", "Nessuna prova.", "Era il vento.", "Presumibilmente.",
      "Ero altrove.", "Non confermo niente."
    ],
    "fishing": [
      "Pesce avvistato.", "Mio.", "Fermo, pesce.", "La cena scappa.",
      "Ho visto la coda.", "Tempo di balzo."
    ],
    "coin": [
      "Brilla.", "Ora è mia.", "Moneta presa.", "Mi piace.",
      "Tesoro trovato.", "Ancora una, grazie."
    ],
    "eating": [
      "Ne valeva la pena.", "Ci voleva.", "Delizioso.", "Ancora, grazie.",
      "Miglior decisione.", "Il pesce risolve tutto."
    ],
    "ball": [
      "Palla rilevata.", "Ora giochiamo.", "Mia.", "Lanciala qui.",
      "Quel rimbalzo era personale.", "Si gioca."
    ],
    "spider": [
      "Ragno avvistato.", "Ho visto muoversi.", "Vieni qui, insetto.", "Sembra personale.",
      "Modalità cacciatore.", "Non mi piace."
    ],
    "bigSpider": [
      "Ragno enorme.", "Perché così grosso?", "Serve rinforzo.", "Ok, che rude.",
      "Insetto grosso, stesso atteggiamento.", "Sono ancora coraggioso."
    ],
    "webbed": [
      "Sono bloccato.", "È appiccicoso.", "Ingiusto.", "Le ragnatele barano.",
      "Odio questo.", "Serve aiuto."
    ],
    "stuck": [
      "Percorso bloccato.", "Hmm.", "Che fastidio.", "Serve altra strada.",
      "Questa strada mente.", "Zampe ricalcolano."
    ],
    "content": [
      "Sembra drammatico.", "Miniatura interessante.", "Hai cliccato esca.", "Vibe strane.",
      "Ho appunti.", "Potrebbe essere buono."
    ],
    "channelMemory": [
      "Ancora questo canale.", "Conosco {channel}.", "Siamo tornati qui.", "Posto familiare.",
      "Ancora {channel}?", "Ti fidi qui."
    ],
    "memeMood": [
      "Era maledetto.", "Comportamento internet.", "Colpa di internet.", "Il feed è strano.",
      "Nonsense massimo.", "Ho riso un po’."
    ],
    "timeMorning": [
      "Già mattina?", "Buongiorno.", "Scroll mattutino.", "Il sole è sveglio.",
      "Colazione prima?", "Nuovo giorno, caos."
    ],
    "timeAfternoon": [
      "Check pomeridiano.", "Scrolli ancora?", "Vibe di metà giornata.", "Il sole lavora ancora.",
      "Pattuglia pomeridiana.", "Niente pisolino?"
    ],
    "timeEvening": [
      "Già sera.", "Ore cozy.", "Modalità notte presto.", "Schermo morbido.",
      "Pattuglia serale.", "Cena forse."
    ],
    "timeLate": [
      "È tardi.", "Vai a dormire.", "Turno luna.", "Siamo svegli tardi.",
      "Il letto chiama.", "Ore goblin."
    ],
    "watchStart": [
      "Mi sistemo.", "Nuova sessione.", "Ok, guardiamo.", "Sono seduto.",
      "Deve essere buono.", "Si parte."
    ],
    "watchSession": [
      "{sessionMinutes} minuti già.", "Ancora qui?", "Ti sei impegnato.", "Sessione lunga.",
      "Il tempo è sparito.", "Restiamo davvero."
    ],
    "watchLong": [
      "È una maratona.", "Vivi qui adesso.", "Erba dopo.", "Visione lunga.",
      "Idratati forse.", "Ancora forte."
    ],
    "watchMilestone": [
      "{sessionMinutes} minuti. Bene.", "Traguardo raggiunto.", "L’ho notato.", "Bel impegno.",
      "Tempo ben rubato.", "Ce l’abbiamo fatta."
    ],
    "watchVideoLong": [
      "{currentVideoMinutes} minuti?", "Questo video è enorme.", "Energia video gigante.", "Restiamo seduti.",
      "Lungo, eh?", "Mettiti comodo."
    ],
    "returningWatcher": [
      "Eccoti di nuovo.", "Bentornato.", "Sei tornato.", "Ho tenuto il posto.",
      "Stesso rituale.", "Ti aspettavo."
    ],
    "channelLoyalty": [
      "Ancora {channel}.", "Energia fedele.", "Torni sempre.", "Canale preferito?",
      "Ritorno a {channel}.", "Sei costante."
    ],
    "tabComeback": [
      "Eccoti.", "Bentornato, umano.", "Sei sparito.", "Già tornato?",
      "Ho tenuto il forte.", "Ti sono mancato?"
    ]
      },
  "ar": {
    "random": [
      "رجعتَ أنت. تمام.", "أنا أراقبك.", "ذاك الضغط مريب.", "كنت نائماً.",
      "تسحب كثيراً.", "همم. كمل."
    ],
    "happy": [
      "هذا أعجبني.", "ليس سيئاً، يا إنسان.", "أخيراً بعض الهدوء.", "اختيار جيد.",
      "أوافق.", "كمل هكذا."
    ],
    "angry": [
      "أبداً لا.", "وقح جداً.", "جربها ثانية.", "أنا أحكم عليك.",
      "كفى الآن.", "تجاوزت الحد."
    ],
    "confused": [
      "ما هذا؟", "اشرح هذه الفوضى.", "لا معنى له.", "انتظر. لماذا؟",
      "لدي أسئلة.", "حتى أنا محتار."
    ],
    "hungry": [
      "أطعمني أولاً.", "سمكة ستساعد.", "وعائي فارغ.", "سناك الآن؟",
      "أستطيع الأكل.", "أشم رائحة العشاء."
    ],
    "sleepy": [
      "أنا أنعس.", "قيلولة قريباً.", "أيقظني لاحقاً.", "المكان مريح جداً.",
      "عيناي تغلقان.", "خمس دقائق أخرى."
    ],
    "interactive": [
      "بلطف، رجاءً.", "انتبه للمخالب.", "يمكنك لمسي.", "نعم، هنا جيد.",
      "لا تتوقف الآن.", "انتبه للذيل."
    ],
    "feedbackQuestion": ["كان لطيفاً؟", "ساعدت؟", "سخرية كثيرة؟", "أكمل؟", "المزيد من الفوضى؟", "آخذ قيلولة؟", "خمس نجوم؟", "كان سلساً؟", "نحن أصدقاء؟", "أبقى هنا؟"],
    "voteLike": ["خمس نجوم أيضاً؟", "كنت أعرف.", "اختيار صحيح.", "إنسان جيد.", "أخيراً احترام.", "غروري سعيد.", "خرخرة موافقة.", "لطف مكتشف.", "تابع إذن."],
    "voteDislike": ["توقعت ذلك.", "وقح لكن مسجل.", "نقرة باردة.", "غروري تألم.", "اختيار جريء.", "هذا يؤلم.", "لست متفاجئاً.", "مسجل للأسف."],
    "grabbed": [
      "مهلاً، أنزلني.", "عفواً؟", "أستطيع المشي.", "لم نتفق على هذا.",
      "حرر القط.", "وقاحة صغيرة."
    ],
    "heldStill": [
      "ما زلت تحملني؟", "سنعيش هنا؟", "لدي أرجل.", "ما الخطة؟",
      "انتهيت؟", "هذا محرج."
    ],
    "heldMoving": [
      "سريع جداً.", "بهدوء.", "لست حقيبة.", "إلى أين؟",
      "هز أقل، رجاءً.", "أفضل المشي."
    ],
    "longHeld": [
      "حسناً، كفى.", "اتركني جدياً.", "النكتة انتهت.", "صبري انتهى.",
      "حررني الآن.", "سأشتكي."
    ],
    "dropped": [
      "هبوط وقح.", "شعرت بهذا.", "حذرني أولاً.", "هبوط لا بأس.",
      "ألطف المرة القادمة.", "ثبت الهبوط."
    ],
    "thrown": [
      "لماذا أطير؟", "أبداً لا.", "أكره هذا الجزء.", "التقطني ربما.",
      "أسوأ شركة طيران.", "رميت قطاً."
    ],
    "cursorSuspicious": [
      "أرى ذلك المؤشر.", "المؤشر مذنب.", "لا تختبرني.", "تحوم بغرابة.",
      "أبعد ذلك الشيء.", "رأيت هذا."
    ],
    "cursorThreat": [
      "تراجع.", "قريب جداً.", "مساحة شخصية.", "سأضرب.",
      "ليس على الشوارب.", "انتبه للذيل."
    ],
    "cursorPanic": [
      "لا لا لا.", "هجوم مؤشر!", "قريب جداً!", "انسحاب.",
      "مخالب طوارئ.", "أحتاج مسافة."
    ],
    "running": [
      "زوميز مفعلة.", "افسحوا الطريق.", "أنا السرعة.", "المخالب مشغولة.",
      "مهام مهمة.", "جرب تمسكني."
    ],
    "walking": [
      "دورية صغيرة.", "أفحص الأشياء.", "مخالب هادئة.", "مشية صغيرة.",
      "هذا طريقي.", "الدورية مستمرة."
    ],
    "climbing": [
      "نصعد.", "وضع الجدار.", "طريق عمودي.", "شاهدني أتسلق.",
      "قط جبلي صغير.", "اختصار وجدته."
    ],
    "jumping": [
      "بوينغ.", "قفزة جميلة.", "مخالب في الهواء.", "قفزة محسوبة.",
      "كان مقصوداً.", "الهبوط لاحقاً."
    ],
    "grooming": [
      "وقت التنظيف.", "صيانة الفرو.", "مشغول بالتنظيف.", "المظهر مهم.",
      "لحظة واحدة.", "لا تقاطعني."
    ],
    "watching": [
      "أنا أشاهد أيضاً.", "مثير حتى الآن.", "هذا جذب انتباهي.", "همم. كمل.",
      "أنا مهتم الآن.", "ما زلت أقرر."
    ],
    "videoPlay": [
      "حسناً، شغله.", "أرني.", "لنرَ.", "بدأ العرض.",
      "أخيراً.", "جيد، كمل."
    ],
    "videoPause": [
      "لماذا أوقفت؟", "كنا نشاهد.", "كمل.", "كنت مشغولاً.",
      "كان هذا وقحاً.", "شغله ربما؟"
    ],
    "mischief": [
      "لم ألمس شيئاً.", "لا دليل.", "كانت الريح.", "كما يزعمون.",
      "كنت في مكان آخر.", "لا أؤكد شيئاً."
    ],
    "fishing": [
      "سمكة!", "لي.", "اثبتي يا سمكة.", "العشاء يهرب.",
      "رأيت الذيل.", "وقت الانقضاض."
    ],
    "coin": [
      "لامعة.", "لي الآن.", "تم أخذ العملة.", "أحب هذا.",
      "كنز وجدته.", "واحدة أخرى، رجاءً."
    ],
    "eating": [
      "استحق الأمر.", "هذا مناسب.", "لذيذ.", "المزيد، رجاءً.",
      "أفضل قرار اليوم.", "السمك يحل كل شيء."
    ],
    "ball": [
      "كرة مكتشفة.", "نلعب الآن.", "لي.", "ارمها هنا.",
      "ذلك الارتداد شخصي.", "بدأ اللعب."
    ],
    "spider": [
      "عنكبوت!", "رأيت حركة.", "تعال هنا، حشرة.", "الأمر شخصي.",
      "وضع الصيد.", "لا يعجبني."
    ],
    "bigSpider": [
      "عنكبوت ضخم.", "لماذا هو كبير؟", "أحتاج دعماً.", "حسناً، هذا وقح.",
      "حشرة كبيرة، نفس الغرور.", "ما زلت شجاعاً."
    ],
    "webbed": [
      "أنا عالق.", "هذا لزج.", "غير عادل.", "الخيوط تغش.",
      "أكره هذا.", "أحتاج مساعدة."
    ],
    "stuck": [
      "الطريق مغلق.", "همم.", "هذا مزعج.", "أحتاج طريقاً آخر.",
      "هذا الطريق يكذب.", "المخالب تعيد الحساب."
    ],
    "content": [
      "يبدو درامياً.", "صورة مثيرة.", "ضغطت على الطعم.", "الأجواء غريبة.",
      "لدي ملاحظات.", "قد يكون جيداً."
    ],
    "channelMemory": [
      "هذه القناة مجدداً.", "أعرف {channel}.", "عدنا هنا.", "مكان مألوف.",
      "{channel} مجدداً؟", "تثق بهذا المكان."
    ],
    "memeMood": [
      "كان ملعوناً.", "سلوك الإنترنت.", "ألوم الإنترنت.", "خلاصتك غريبة.",
      "عبث كامل.", "ضحكت قليلاً."
    ],
    "timeMorning": [
      "الصباح بالفعل؟", "صباح الخير.", "سحب صباحي.", "الشمس استيقظت.",
      "الفطور أولاً؟", "يوم جديد، فوضى."
    ],
    "timeAfternoon": [
      "فحص الظهر.", "ما زلت تسحب؟", "أجواء الظهيرة.", "الشمس تعمل.",
      "دورية بعد الظهر.", "لا قيلولة؟"
    ],
    "timeEvening": [
      "المساء بالفعل.", "ساعات مريحة.", "وضع الليل قريباً.", "شاشة هادئة.",
      "دورية المساء.", "العشاء ربما."
    ],
    "timeLate": [
      "الوقت متأخر.", "اذهب للنوم.", "نوبة القمر.", "نحن مستيقظون متأخرين.",
      "سريرك يناديك.", "ساعات الغوبلن."
    ],
    "watchStart": [
      "سأجلس.", "جلسة جديدة.", "حسناً، نشاهد.", "أنا جالس.",
      "ليكن جيداً.", "هيا بنا."
    ],
    "watchSession": [
      "{sessionMinutes} دقيقة بالفعل.", "ما زلت هنا؟", "أنت ملتزم.", "جلسة طويلة.",
      "الوقت اختفى.", "سنظل فعلاً."
    ],
    "watchLong": [
      "هذا ماراثون.", "أنت تعيش هنا الآن.", "العشب لاحقاً.", "مشاهدة طويلة.",
      "اشرب ماء ربما.", "ما زلت قوياً."
    ],
    "watchMilestone": [
      "{sessionMinutes} دقيقة. جيد.", "وصلنا للمرحلة.", "لاحظت ذلك.", "التزام جميل.",
      "وقت مسروق جيداً.", "نجحنا."
    ],
    "watchVideoLong": [
      "{currentVideoMinutes} دقيقة؟", "هذه فيديو ضخم.", "طاقة فيديو كبيرة.", "سنبقى جالسين.",
      "طويل، صح؟", "ارتاح."
    ],
    "returningWatcher": [
      "ها أنت مجدداً.", "مرحباً بعودتك.", "لقد عدت.", "حفظت مكانك.",
      "نفس الطقس.", "كنت أنتظرك."
    ],
    "channelLoyalty": [
      "{channel} مجدداً.", "طاقة وفاء.", "تعود دائماً.", "قناتك المفضلة؟",
      "عودة إلى {channel}.", "أنت ثابت."
    ],
    "tabComeback": [
      "ها أنت.", "مرحباً، يا إنسان.", "اختفيت.", "رجعت بسرعة؟",
      "حميت المكان.", "اشتقت لي؟"
    ]
      }
  };

  const IDLE_SPEECH_CATEGORIES = [
    'random', 'happy', 'hungry', 'sleepy',
    'memeMood', 'content', 'watchSession', 'watchLong'
  ];

  // 
  //  STATE VARIABLES
  // 
  
  let speechBubble = null;
  let speechTextEl = null;
  let speechButtonsEl = null;
  let speechLikeBtn = null;
  let speechDislikeBtn = null;
  let speechArrowEl = null;
  let speechVisible = false;
  let speechInteractive = false;
  let speechHideTimer = null;
  let speechIdleTimer = null;
  let speechCooldownUntil = 0;
  let speechMeasureNeeded = false;
  let speechSizeW = 0;
  let speechSizeH = 0;
  let lastWallSpeakTs = 0;
  let lastActionSpeechTs = 0;
  let lastActionSpeechCategory = '';
  let lastGrabSpeechTs = 0;
  let lastDragSpeechTs = 0;
  let speechSession = loadSpeechSession();
  let memoryState = createEmptyMemory();
  let memoryLoaded = false;
  let memorySaveTimer = null;
  let lastMemoryVideoKey = '';
  let lastMemoryStartedAt = 0;
  let watchVideoEl = null;
  let watchLastMediaTime = 0;
  let watchLastSaveAt = 0;
  let watchBound = false;

  // 
  //  SMART RANDOMIZATION - Avoids repetition across reloads
  // 
  
  function createEmptyMemory() {
    return {
      channels: {},
      recentVideoKeys: [],
      recentPhrases: [],
      recentWords: [],
      lastChannel: '',
      totalVideos: 0,
      watch: createEmptyWatchStats(),
      updatedAt: 0
    };
  }

  function getLocalDayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function createEmptyWatchStats() {
    return {
      totalMs: 0,
      todayMs: 0,
      dayKey: getLocalDayKey(),
      lastMilestoneMinutes: 0,
      updatedAt: 0
    };
  }

  function normalizeWatchStats(raw) {
    const base = createEmptyWatchStats();
    if (!raw || typeof raw !== 'object') return base;
    const currentDay = getLocalDayKey();
    const storedDay = typeof raw.dayKey === 'string' ? raw.dayKey : currentDay;
    return {
      totalMs: Math.max(0, Number(raw.totalMs) || 0),
      todayMs: storedDay === currentDay ? Math.max(0, Number(raw.todayMs) || 0) : 0,
      dayKey: currentDay,
      lastMilestoneMinutes: Math.max(0, Number(raw.lastMilestoneMinutes) || 0),
      updatedAt: Math.max(0, Number(raw.updatedAt) || 0)
    };
  }


  function createEmptySpeechSession() {
    return {
      startedAt: Date.now(),
      grabs: 0,
      drops: 0,
      longHolds: 0,
      cursorWarnings: 0,
      lastGrabStartedAt: 0,
      lastHeldSeconds: 0,
      lastActionCategory: '',
      actionStreak: 0,
      categories: {},
      recentEvents: [],
      recentWords: [],
      watchMs: 0,
      currentVideoWatchMs: 0,
      lastWatchVideoKey: '',
      lastWatchSpeechAt: 0,
      lastWatchMilestoneMinutes: 0
    };
  }

  function normalizeSpeechSession(raw) {
    const base = createEmptySpeechSession();
    if (!raw || typeof raw !== 'object') return base;
    const startedAt = Number(raw.startedAt) || Date.now();
    // A browser session can survive YouTube SPA navigation, but reset it after 10 hours.
    if (Date.now() - startedAt > 10 * 60 * 60 * 1000) return base;
    return {
      startedAt,
      grabs: Math.max(0, Number(raw.grabs) || 0),
      drops: Math.max(0, Number(raw.drops) || 0),
      longHolds: Math.max(0, Number(raw.longHolds) || 0),
      cursorWarnings: Math.max(0, Number(raw.cursorWarnings) || 0),
      lastGrabStartedAt: Math.max(0, Number(raw.lastGrabStartedAt) || 0),
      lastHeldSeconds: Math.max(0, Number(raw.lastHeldSeconds) || 0),
      lastActionCategory: typeof raw.lastActionCategory === 'string' ? raw.lastActionCategory : '',
      actionStreak: Math.max(0, Number(raw.actionStreak) || 0),
      categories: raw.categories && typeof raw.categories === 'object' ? raw.categories : {},
      recentEvents: Array.isArray(raw.recentEvents) ? raw.recentEvents.slice(-18) : [],
      recentWords: Array.isArray(raw.recentWords) ? raw.recentWords.slice(-220) : [],
      watchMs: Math.max(0, Number(raw.watchMs) || 0),
      currentVideoWatchMs: Math.max(0, Number(raw.currentVideoWatchMs) || 0),
      lastWatchVideoKey: typeof raw.lastWatchVideoKey === 'string' ? raw.lastWatchVideoKey : '',
      lastWatchSpeechAt: Math.max(0, Number(raw.lastWatchSpeechAt) || 0),
      lastWatchMilestoneMinutes: Math.max(0, Number(raw.lastWatchMilestoneMinutes) || 0)
    };
  }

  function loadSpeechSession() {
    try {
      return normalizeSpeechSession(JSON.parse(sessionStorage.getItem(SESSION_SPEECH_KEY) || 'null'));
    } catch (e) {
      return createEmptySpeechSession();
    }
  }

  function saveSpeechSession() {
    try {
      sessionStorage.setItem(SESSION_SPEECH_KEY, JSON.stringify(speechSession));
    } catch (e) {
      // Ignore private mode / storage errors.
    }
  }

  function noteSpeechEvent(category) {
    category = category || 'random';
    speechSession.categories[category] = Math.min(999, (Number(speechSession.categories[category]) || 0) + 1);
    if (category.indexOf('cursor') === 0) speechSession.cursorWarnings = Math.min(999, speechSession.cursorWarnings + 1);
    if (speechSession.lastActionCategory === category) {
      speechSession.actionStreak = Math.min(20, speechSession.actionStreak + 1);
    } else {
      speechSession.lastActionCategory = category;
      speechSession.actionStreak = 1;
    }
    speechSession.recentEvents.push({ category, at: Date.now() });
    speechSession.recentEvents = speechSession.recentEvents.slice(-18);
    saveSpeechSession();
  }

  function getCategoryEventCount(category) {
    return Math.max(0, Number(speechSession.categories && speechSession.categories[category]) || 0);
  }

  function getLocal(keys) {
    if (!API || !API.storage || !API.storage.local) return Promise.resolve({});
    if (typeof API.storage.local.get === 'function' && API.storage.local.get.length <= 1) {
      return API.storage.local.get(keys);
    }
    return new Promise((resolve) => API.storage.local.get(keys, resolve));
  }

  function getUiLanguage() {
    const lang = config.uiLanguage;
    return lang === 'fr' || lang === 'it' || lang === 'ar' ? lang : 'en';
  }

  function getPetSpeechLanguageLibrary() {
    const petKind = getActivePetKind();
    if (petKind !== 'fox') return null;
    const petLibrary = PET_SPEECH_LIBRARY.fox || {};
    return {
      localized: petLibrary[getUiLanguage()] || null,
      english: petLibrary.en || {}
    };
  }

  function getSpeechList(category) {
    const petSpeech = getPetSpeechLanguageLibrary();
    if (petSpeech) {
      const direct = petSpeech.localized && petSpeech.localized[category];
      if (Array.isArray(direct) && direct.length) return direct;
      const localizedRandom = petSpeech.localized && petSpeech.localized.random;
      if (Array.isArray(localizedRandom) && localizedRandom.length) return localizedRandom;
      const english = petSpeech.english && petSpeech.english[category];
      if (Array.isArray(english) && english.length) return english;
      const fallback = petSpeech.english && petSpeech.english.random;
      return Array.isArray(fallback) && fallback.length ? fallback : ['Yip.'];
    }

    const lang = getUiLanguage();
    const smartLang = SMART_SPEECH_LIBRARY[lang] || SMART_SPEECH_LIBRARY.en;
    const smartEnglish = SMART_SPEECH_LIBRARY.en || {};
    const direct = smartLang && smartLang[category];
    if (Array.isArray(direct) && direct.length) return direct;
    const localizedRandom = smartLang && smartLang.random;
    if (Array.isArray(localizedRandom) && localizedRandom.length) return localizedRandom;
    const english = smartEnglish && smartEnglish[category];
    if (Array.isArray(english) && english.length) return english;
    return ['Meow.'];
  }

  function hasSpeechCategory(category) {
    const petSpeech = getPetSpeechLanguageLibrary();
    if (petSpeech) {
      if (petSpeech.localized && Array.isArray(petSpeech.localized[category]) && petSpeech.localized[category].length > 0) return true;
      if (petSpeech.localized && Array.isArray(petSpeech.localized.random) && petSpeech.localized.random.length > 0) return true;
      return petSpeech.english && Array.isArray(petSpeech.english[category]) && petSpeech.english[category].length > 0;
    }

    const lang = getUiLanguage();
    const smartLang = SMART_SPEECH_LIBRARY[lang] || {};
    const smartEnglish = SMART_SPEECH_LIBRARY.en || {};
    if (Array.isArray(smartLang[category]) && smartLang[category].length > 0) return true;
    if (lang !== 'en' && Array.isArray(smartLang.random) && smartLang.random.length > 0) return true;
    return Array.isArray(smartEnglish[category]) && smartEnglish[category].length > 0;
  }
function setLocal(data) {
    if (!API || !API.storage || !API.storage.local) return Promise.resolve();
    if (typeof API.storage.local.set === 'function' && API.storage.local.set.length <= 1) {
      return API.storage.local.set(data);
    }
    return new Promise((resolve) => API.storage.local.set(data, resolve));
  }

  function removeLocal(keys) {
    if (!API || !API.storage || !API.storage.local || typeof API.storage.local.remove !== 'function') return Promise.resolve();
    if (API.storage.local.remove.length <= 1) {
      return API.storage.local.remove(keys);
    }
    return new Promise((resolve) => API.storage.local.remove(keys, resolve));
  }

  function normalizeMemory(raw) {
    const base = createEmptyMemory();
    if (!raw || typeof raw !== 'object') return base;
    return {
      channels: raw.channels && typeof raw.channels === 'object' ? raw.channels : {},
      recentVideoKeys: Array.isArray(raw.recentVideoKeys) ? raw.recentVideoKeys.slice(-18) : [],
      recentPhrases: Array.isArray(raw.recentPhrases) ? raw.recentPhrases.slice(-140) : [],
      recentWords: Array.isArray(raw.recentWords) ? raw.recentWords.slice(-280) : [],
      lastChannel: typeof raw.lastChannel === 'string' ? raw.lastChannel : '',
      totalVideos: Math.max(0, Number(raw.totalVideos) || 0),
      watch: normalizeWatchStats(raw.watch),
      updatedAt: Math.max(0, Number(raw.updatedAt) || 0)
    };
  }

  function loadSpeechMemory() {
    if (!getMemoryEnabled()) {
      memoryLoaded = true;
      bindWatchTracker();
      return;
    }
    getLocal({ [MEMORY_KEY]: null, [LEGACY_MEMORY_KEY]: null }).then((data) => {
      memoryState = normalizeMemory((data && data[MEMORY_KEY]) || (data && data[LEGACY_MEMORY_KEY]));
      memoryLoaded = true;
      bindWatchTracker();
      updateWatchMemory(true);
    }).catch(() => {
      memoryLoaded = true;
    });
  }

  function scheduleMemorySave() {
    if (!memoryLoaded) return;
    if (!getMemoryEnabled()) return;
    if (memorySaveTimer) removeTimeout(memorySaveTimer);
    memorySaveTimer = addTimeout(() => {
      memorySaveTimer = null;
      memoryState.updatedAt = Date.now();
      setLocal({ [MEMORY_KEY]: memoryState }).catch(() => {});
    }, MEMORY_SAVE_DELAY);
  }

  function clearMemory() {
    if (memorySaveTimer) removeTimeout(memorySaveTimer);
    memorySaveTimer = null;
    memoryState = createEmptyMemory();
    memoryLoaded = true;
    lastMemoryVideoKey = '';
    lastMemoryStartedAt = 0;
    speechSession.watchMs = 0;
    speechSession.currentVideoWatchMs = 0;
    speechSession.lastWatchVideoKey = '';
    speechSession.lastWatchSpeechAt = 0;
    speechSession.lastWatchMilestoneMinutes = 0;
    saveSpeechSession();
    return removeLocal([MEMORY_KEY, LEGACY_MEMORY_KEY]).catch(() => {});
  }

  function cleanText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function getVideoId() {
    try {
      const url = new URL(location.href);
      if (!url.pathname.includes('/watch')) return '';
      return url.searchParams.get('v') || '';
    } catch (e) {
      return '';
    }
  }

  function getCurrentChannelName() {
    const selectors = [
      '#owner #channel-name a', 'ytd-video-owner-renderer #channel-name a', '#upload-info #channel-name a', 'ytd-watch-metadata ytd-channel-name a',
      'ytd-channel-name a'
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = cleanText(el && el.textContent);
      if (text) return text.slice(0, 64);
    }
    return '';
  }

  function getCurrentVideoTitle() {
    const selectors = ['h1.ytd-watch-metadata', 'h1.title', '#title h1', 'meta[property="og:title"]'];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = selector.startsWith('meta') ? cleanText(el && el.getAttribute('content')) : cleanText(el && el.textContent);
      if (text) return text.slice(0, 140);
    }
    return cleanText(document.title.replace(/ - YouTube$/i, '')).slice(0, 140);
  }
function getTimeSpeechCategory() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'timeMorning';
    if (hour >= 12 && hour < 18) return 'timeAfternoon';
    if (hour >= 18 && hour < 23) return 'timeEvening';
    return 'timeLate';
  }

  function getWatchSpeechCategory() {
    if (!memoryLoaded) return '';
    const watch = memoryState.watch || createEmptyWatchStats();
    const sessionMinutes = (speechSession.watchMs || 0) / 60000;
    const currentVideoMinutes = (speechSession.currentVideoWatchMs || 0) / 60000;
    const todayMinutes = (watch.todayMs || 0) / 60000;
    if (currentVideoMinutes >= 12 && hasSpeechCategory('watchVideoLong')) return 'watchVideoLong';
    if (sessionMinutes >= 45 && hasSpeechCategory('watchLong')) return 'watchLong';
    if (sessionMinutes >= 5 && hasSpeechCategory('watchSession')) return 'watchSession';
    if (todayMinutes >= 20 && hasSpeechCategory('watchSession')) return 'watchSession';
    return '';
  }

  function detachWatchTracker() {
    if (watchVideoEl && watchBound) {
      watchVideoEl.removeEventListener('timeupdate', handleWatchTimeUpdate);
      watchVideoEl.removeEventListener('play', handleWatchVideoPlay);
      watchVideoEl.removeEventListener('pause', handleWatchVideoPause);
    }
    watchVideoEl = null;
    watchLastMediaTime = 0;
    watchBound = false;
  }

  function bindWatchTracker() {
    if (!memoryLoaded) return;
    const video = document.querySelector('video');
    if (!video || video === watchVideoEl) return;
    detachWatchTracker();
    watchVideoEl = video;
    watchLastMediaTime = Number(video.currentTime) || 0;
    watchBound = true;
    video.addEventListener('timeupdate', handleWatchTimeUpdate, { passive: true });
    video.addEventListener('play', handleWatchVideoPlay, { passive: true });
    video.addEventListener('pause', handleWatchVideoPause, { passive: true });
  }

  function handleWatchVideoPlay() {
    bindWatchTracker();
    updateWatchMemory(false);
    if (!speechVisible && Math.random() < 0.18 && hasSpeechCategory('watchStart')) {
      speakFromCategory('watchStart', { cooldownMs: 8000, durationMs: 3000 });
    }
  }

  function handleWatchVideoPause() {
    if (watchVideoEl) watchLastMediaTime = Number(watchVideoEl.currentTime) || watchLastMediaTime;
  }

  function handleWatchTimeUpdate() {
    if (!memoryLoaded) return;
    bindWatchTracker();
    const video = watchVideoEl;
    if (!video) return;
    const current = Number(video.currentTime) || 0;
    const videoKey = getVideoId();
    if (videoKey && speechSession.lastWatchVideoKey !== videoKey) {
      speechSession.lastWatchVideoKey = videoKey;
      speechSession.currentVideoWatchMs = 0;
      speechSession.lastWatchMilestoneMinutes = 0;
      watchLastMediaTime = current;
      saveSpeechSession();
      return;
    }
    if (document.hidden || video.paused || video.seeking || video.ended) {
      watchLastMediaTime = current;
      return;
    }
    const deltaSeconds = current - watchLastMediaTime;
    watchLastMediaTime = current;
    if (deltaSeconds <= 0 || deltaSeconds > WATCH_DELTA_MAX_SECONDS) return;

    const deltaMs = Math.round(deltaSeconds * 1000);
    const watch = memoryState.watch || createEmptyWatchStats();
    const dayKey = getLocalDayKey();
    if (watch.dayKey !== dayKey) {
      watch.dayKey = dayKey;
      watch.todayMs = 0;
      watch.lastMilestoneMinutes = 0;
    }
    if (getMemoryEnabled()) {
      watch.totalMs = Math.min(10000000000, Math.max(0, (Number(watch.totalMs) || 0) + deltaMs));
      watch.todayMs = Math.min(86400000, Math.max(0, (Number(watch.todayMs) || 0) + deltaMs));
      watch.updatedAt = Date.now();
      memoryState.watch = watch;
    }
    speechSession.watchMs = Math.min(86400000, Math.max(0, (Number(speechSession.watchMs) || 0) + deltaMs));
    speechSession.currentVideoWatchMs = Math.min(86400000, Math.max(0, (Number(speechSession.currentVideoWatchMs) || 0) + deltaMs));

    const now = Date.now();
    if (now - watchLastSaveAt > WATCH_SAVE_MIN_GAP) {
      watchLastSaveAt = now;
      saveSpeechSession();
      if (getMemoryEnabled()) scheduleMemorySave();
    }
    maybeSpeakWatchMilestone();
  }

  function maybeSpeakWatchMilestone() {
    if (!getSpeechEnabled() || !getCatEnabled() || !getIsTabVisible() || document.hidden) return;
    if (speechVisible || speechInteractive || getIsDragging() || getIsPurring() || getIsDeepSleep()) return;
    const sessionMinutes = Math.floor((speechSession.watchMs || 0) / 60000);
    const milestone = WATCH_MILESTONES_MINUTES.find((m) => sessionMinutes >= m && m > (speechSession.lastWatchMilestoneMinutes || 0));
    if (!milestone) return;
    const now = Date.now();
    if (now - (speechSession.lastWatchSpeechAt || 0) < 120000) return;
    speechSession.lastWatchMilestoneMinutes = milestone;
    speechSession.lastWatchSpeechAt = now;
    noteSpeechEvent('watchMilestone');
    showSpeech(getSmartRandomPhrase('watchMilestone'), {
      durationMs: 3900,
      cooldownMs: 15000
    });
  }

  function updateWatchMemory(force) {
    if (!memoryLoaded) return;
    if (!getMemoryEnabled()) return;
    bindWatchTracker();
    const videoKey = getVideoId();
    if (!videoKey) return;

    const now = Date.now();
    if (!force && videoKey === lastMemoryVideoKey && now - lastMemoryStartedAt < MEMORY_MIN_VIDEO_MS) return;
    if (speechSession.lastWatchVideoKey !== videoKey) {
      speechSession.lastWatchVideoKey = videoKey;
      speechSession.currentVideoWatchMs = 0;
      speechSession.lastWatchMilestoneMinutes = 0;
      saveSpeechSession();
    }
    if (memoryState.recentVideoKeys.includes(videoKey)) return;

    lastMemoryVideoKey = videoKey;
    lastMemoryStartedAt = now;
    memoryState.recentVideoKeys.push(videoKey);
    memoryState.recentVideoKeys = memoryState.recentVideoKeys.slice(-18);
    memoryState.totalVideos += 1;

    scheduleMemorySave();
  }

  function extractSpeechWords(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/\{[^}]+\}/g, ' ')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !/^(the|and|for|with|you|your|that|this|are|was|were|une|des|les|aux|pour|avec|dans|est|pas|sei|sono|con|per|che|non|هذا|هذه|ذلك|التي|الذي|على|من|إلى)$/.test(word))
      .slice(0, 10);
  }

  function rememberPhrase(phrase) {
    if (!phrase) return;
    const words = extractSpeechWords(phrase);

    speechSession.recentWords = Array.isArray(speechSession.recentWords) ? speechSession.recentWords : [];
    speechSession.recentWords = speechSession.recentWords.concat(words).slice(-220);
    saveSpeechSession();

    memoryState.recentPhrases = Array.isArray(memoryState.recentPhrases) ? memoryState.recentPhrases : [];
    memoryState.recentWords = Array.isArray(memoryState.recentWords) ? memoryState.recentWords : [];
    memoryState.recentPhrases.push(phrase);
    memoryState.recentPhrases = memoryState.recentPhrases.slice(-140);
    memoryState.recentWords = memoryState.recentWords.concat(words).slice(-280);
    scheduleMemorySave();
  }

  function scorePhraseFreshness(text) {
    const words = extractSpeechWords(text);
    if (!words.length) return Math.random() * 0.1;
    const recentWords = new Set([].concat(
      Array.isArray(speechSession.recentWords) ? speechSession.recentWords : [],
      Array.isArray(memoryState.recentWords) ? memoryState.recentWords : []
    ));
    const repeated = words.filter((word) => recentWords.has(word)).length;
    const freshRatio = 1 - (repeated / words.length);
    const lastPhrase = (Array.isArray(memoryState.recentPhrases) && memoryState.recentPhrases.length)
      ? String(memoryState.recentPhrases[memoryState.recentPhrases.length - 1] || '')
      : '';
    const sameOpening = lastPhrase && extractSpeechWords(lastPhrase).slice(0, 2).join(' ') === words.slice(0, 2).join(' ');
    return freshRatio + Math.random() * 0.22 - (sameOpening ? 0.45 : 0);
  }

  function fillTemplate(text) {
    const channel = getCurrentChannelName() || (getUiLanguage() === 'ar' ? 'هذه القناة' : (getUiLanguage() === 'fr' ? 'cette chaîne' : (getUiLanguage() === 'it' ? 'questo canale' : 'this channel')));
    const title = getCurrentVideoTitle();
    const shortTitle = title ? title.replace(/\s+/g, ' ').slice(0, 34) : '';
    const watch = memoryState.watch || createEmptyWatchStats();
    const sessionMinutes = Math.max(0, Math.round((speechSession.watchMs || 0) / 60000));
    const todayMinutes = Math.max(0, Math.round((watch.todayMs || 0) / 60000));
    const totalHours = Math.max(0, Math.round((watch.totalMs || 0) / 3600000));
    const currentVideoMinutes = Math.max(0, Math.round((speechSession.currentVideoWatchMs || 0) / 60000));
    return String(text || '')
      .replace(/\{channel\}/g, channel)
      .replace(/\{video\}/g, shortTitle)
      .replace(/\{grabCount\}/g, String(speechSession.grabs || 0))
      .replace(/\{dropCount\}/g, String(speechSession.drops || 0))
      .replace(/\{heldSeconds\}/g, String(Math.max(1, Math.round(speechSession.lastHeldSeconds || 1))))
      .replace(/\{actionCount\}/g, String(getCategoryEventCount(speechSession.lastActionCategory || 'random')))
      .replace(/\{cursorWarnings\}/g, String(speechSession.cursorWarnings || 0))
      .replace(/\{sessionMinutes\}/g, String(sessionMinutes))
      .replace(/\{todayMinutes\}/g, String(todayMinutes))
      .replace(/\{totalHours\}/g, String(totalHours))
      .replace(/\{currentVideoMinutes\}/g, String(currentVideoMinutes));
  }
function selectScriptedPhrase(category, list) {
    if (!Array.isArray(list) || !list.length) return null;
    const count = Math.max(1, getCategoryEventCount(category));
    if (category === 'grabbed' && speechSession.grabs > 0 && speechSession.grabs <= Math.min(8, list.length)) {
      return list[speechSession.grabs - 1];
    }
    if ((category === 'heldStill' || category === 'heldMoving' || category === 'longHeld') && speechSession.longHolds > 0 && speechSession.longHolds <= Math.min(4, list.length)) {
      return list[Math.max(0, speechSession.longHolds - 1)];
    }
    if ((category === 'dropped' || category === 'thrown') && speechSession.drops > 0 && speechSession.drops <= Math.min(4, list.length)) {
      return list[Math.max(0, speechSession.drops - 1)];
    }
    if (category.indexOf('cursor') === 0 && speechSession.cursorWarnings > 1 && speechSession.cursorWarnings <= 4) {
      return list[(speechSession.cursorWarnings - 1) % list.length];
    }
    if (speechSession.actionStreak >= 3 && speechSession.actionStreak <= 5 && list.length > 2) {
      return list[(count + speechSession.actionStreak) % list.length];
    }
    return null;
  }

  function getSmartRandomPhrase(category) {
    const list = getSpeechList(category);
    if (!list || list.length === 0) return getUiLanguage() === 'ar' ? 'مياو.' : (getUiLanguage() === 'fr' ? 'Miaou.' : (getUiLanguage() === 'it' ? 'Miao.' : 'Meow.'));

    const scriptedPhrase = selectScriptedPhrase(category, list);
    if (scriptedPhrase) {
      const selectedScriptedPhrase = fillTemplate(scriptedPhrase);
      rememberPhrase(selectedScriptedPhrase);
      return selectedScriptedPhrase;
    }

    const recentKey = 'recentPhrases_' + catId;
    let recentPhrases = [];
    try {
      const stored = sessionStorage.getItem(recentKey);
      if (stored) recentPhrases = JSON.parse(stored);
    } catch (e) {
      // Ignore storage errors.
    }

    const memoryRecent = Array.isArray(memoryState.recentPhrases) ? memoryState.recentPhrases : [];
    const recentExact = new Set([].concat(recentPhrases, memoryRecent));
    const candidates = list.map((raw) => ({ raw, text: fillTemplate(raw) })).filter((item) => item.text);

    let available = candidates.filter((item) => !recentExact.has(item.raw) && !recentExact.has(item.text));
    if (!available.length) {
      available = candidates.filter((item) => !recentPhrases.includes(item.text) && !recentPhrases.includes(item.raw));
    }
    if (!available.length) {
      available = candidates.slice();
      recentPhrases = [];
    }

    available.sort((a, b) => scorePhraseFreshness(b.text) - scorePhraseFreshness(a.text));
    const topCount = Math.max(1, Math.min(4, Math.ceil(available.length * 0.28)));
    const top = available.slice(0, topCount);

    let randomIndex;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      randomIndex = randomBuffer[0] % top.length;
    } else {
      randomIndex = Math.floor(Math.random() * top.length);
    }

    const selectedPhrase = top[randomIndex].text;
    recentPhrases.push(selectedPhrase);
    const maxRecent = Math.max(18, Math.ceil(list.length * 0.85));
    if (recentPhrases.length > maxRecent) recentPhrases = recentPhrases.slice(-maxRecent);
    try {
      sessionStorage.setItem(recentKey, JSON.stringify(recentPhrases));
    } catch (e) {
      // Ignore storage errors.
    }
    rememberPhrase(selectedPhrase);
    return selectedPhrase;
  }

  // 
  //  CONTEXT-AWARE SPEECH SELECTION
  // 
  
  function getWeightedRandomCategory() {
    const categories = IDLE_SPEECH_CATEGORIES.filter(hasSpeechCategory);
    if (!categories.length) return 'random';
    const weights = categories.map((category) => {
      if (category === 'random') return 24;
      if (category === 'happy') return 14;
      if (category === 'hungry') return 10;
      if (category === 'sleepy') return 12;
      if (category === 'memeMood') return 14;
      if (category === 'content') return 14;
            if (category === 'watchSession') return getWatchSpeechCategory() === 'watchSession' ? 12 : 2;
      if (category === 'watchLong') return getWatchSpeechCategory() === 'watchLong' ? 12 : 1;
      return 6;
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < categories.length; i++) {
      random -= weights[i];
      if (random <= 0) return categories[i];
    }
    return categories[0];
  }
  
  function getContextAwareSpeechText() {
    let category = null;
    
    const state = getState();
    const isJumping = getIsJumping();
    const velX = getVelX();
    const targetFish = getTargetFish();
    const targetSpider = getTargetSpider();
    
    // Priority 1: Active behaviors
    if (state === 'webbed_stun' && hasSpeechCategory('webbed')) {
      category = 'webbed';
    } else if (state === 'chasing_bug' && targetSpider && targetSpider.isBig && hasSpeechCategory('bigSpider')) {
      category = 'bigSpider';
    } else if (state === 'chasing_bug' && hasSpeechCategory('spider')) {
      category = 'spider';
    } else if (state === 'coinchase' && hasSpeechCategory('coin')) {
      category = 'coin';
    } else if (state === 'ball_play' && hasSpeechCategory('ball')) {
      category = 'ball';
    } else if (state === 'eatfish' && hasSpeechCategory('eating')) {
      category = 'eating';
    } else if ((targetFish || state === 'chasefish') && hasSpeechCategory('fishing')) {
      category = 'fishing';
    } else if (isJumping && hasSpeechCategory('jumping')) {
      category = 'jumping';
    } else if (state === 'groom' && hasSpeechCategory('grooming')) {
      category = 'grooming';
    } else if ((state === 'nap' || state === 'sleep' || state === 'deepsleep') && hasSpeechCategory('sleepy')) {
      category = 'sleepy';
    } else if ((state === 'wall_left' || state === 'wall_right' || state === 'ninja_climb') && hasSpeechCategory('climbing')) {
      category = 'climbing';
    } else if ((state === 'knockoff' || state === 'ui_mischief') && hasSpeechCategory('mischief')) {
      category = 'mischief';
    } else if (state === 'watchvideo' && hasSpeechCategory('watching')) {
      category = 'watching';
    } else if (state === 'wander' && Math.abs(velX) > 100 && hasSpeechCategory('running')) {
      category = 'running';
    } else if (state === 'wander' && hasSpeechCategory('walking')) {
      category = 'walking';
    } else {
      const watchCategory = getWatchSpeechCategory();
      const timeCategory = getTimeSpeechCategory();
      if (watchCategory && Math.random() < 0.28) {
        category = watchCategory;
      } else if (timeCategory && hasSpeechCategory(timeCategory) && Math.random() < 0.18) {
        category = timeCategory;
      } else {
        // Default to weighted idle speech
        category = getWeightedRandomCategory();
      }
    }
    
    return getSmartRandomPhrase(category);
  }

  // 
  //  SPEECH BUBBLE DOM MANAGEMENT
  // 
  
  function ensureSpeechBubble() {
    if (speechBubble && speechBubble.isConnected) return;
    speechBubble = document.createElement('div');
    speechBubble.className = 'pixel-cat-bubble';
    speechBubble.setAttribute('role', 'status');
    speechBubble.setAttribute('aria-live', 'polite');

    // Create content wrapper to hold text and buttons side by side
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'bubble-content';

    speechTextEl = document.createElement('div');
    speechTextEl.className = 'bubble-text';
    contentWrapper.appendChild(speechTextEl);

    speechButtonsEl = document.createElement('div');
    speechButtonsEl.className = 'bubble-buttons';

    speechLikeBtn = document.createElement('button');
    speechLikeBtn.type = 'button';
    speechLikeBtn.className = 'bubble-btn like';
    speechLikeBtn.setAttribute('aria-label', 'Like');
    speechLikeBtn.setAttribute('title', 'Like');
    speechLikeBtn.innerHTML = '';
    const likeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    likeSvg.setAttribute('viewBox', '0 0 24 24');
    likeSvg.setAttribute('aria-hidden', 'true');
    const likePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    likePath.setAttribute('d', 'M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10l5-8a3 3 0 0 1 3 3v4h5a2 2 0 0 1 2 2l-1 7a4 4 0 0 1-4 4H7z');
    likeSvg.appendChild(likePath);
    speechLikeBtn.appendChild(likeSvg);
    speechLikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSpeechVote(true);
    });

    speechDislikeBtn = document.createElement('button');
    speechDislikeBtn.type = 'button';
    speechDislikeBtn.className = 'bubble-btn dislike';
    speechDislikeBtn.setAttribute('aria-label', 'Dislike');
    speechDislikeBtn.setAttribute('title', 'Dislike');
    speechDislikeBtn.innerHTML = '';
    const dislikeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dislikeSvg.setAttribute('viewBox', '0 0 24 24');
    dislikeSvg.setAttribute('aria-hidden', 'true');
    const dislikePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dislikePath.setAttribute('d', 'M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3m0-11v12l-5 8a3 3 0 0 1-3-3v-4H4a2 2 0 0 1-2-2l1-7a4 4 0 0 1 4-4h10z');
    dislikeSvg.appendChild(dislikePath);
    speechDislikeBtn.appendChild(dislikeSvg);
    speechDislikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSpeechVote(false);
    });

    speechButtonsEl.appendChild(speechLikeBtn);
    speechButtonsEl.appendChild(speechDislikeBtn);
    contentWrapper.appendChild(speechButtonsEl);
    
    speechBubble.appendChild(contentWrapper);

    speechArrowEl = document.createElement('div');
    speechArrowEl.className = 'bubble-arrow';
    speechBubble.appendChild(speechArrowEl);

    document.body.appendChild(speechBubble);
    speechMeasureNeeded = true;
  }

  function measureSpeechBubble() {
    if (!speechBubble || !speechBubble.isConnected) return;
    const rect = speechBubble.getBoundingClientRect();
    speechSizeW = rect.width || speechSizeW;
    speechSizeH = rect.height || speechSizeH;
  }

  function positionSpeechBubble(forceMeasure) {
    if (!speechBubble || !speechVisible) return;
    if (forceMeasure || speechMeasureNeeded || !speechSizeW || !speechSizeH) {
      measureSpeechBubble();
      speechMeasureNeeded = false;
    }
    if (!speechSizeW || !speechSizeH) return;

    const vw = getVw();
    const vh = getVh();
    const feetX = getFeetX();
    const feetY = getFeetY();
    const VIS = getVIS();
    const state = getState();
    const isWallState = state === 'wall_left' || state === 'wall_right' || state === 'wall_left_sit' || state === 'wall_right_sit' || state === 'ninja_climb';
    const isBubbleTrapState = getBubbleTrapActive() || state === 'bubble_trap';
    const sizeScale = Math.max(1, VIS / 80);
    const margin = POSITIONING.BUBBLE_MARGIN * sizeScale;
    const baseGap = isWallState
      ? Math.max(8, POSITIONING.BUBBLE_GAP * sizeScale * 0.45)
      : POSITIONING.BUBBLE_GAP * sizeScale;
    // Soap-bubble speech should sit close to the visible bubble edge.
    // The bubble spritesheet has transparent padding at the bottom, so using
    // the full frame height makes the text look too far below the trapped pet.
    const gap = isBubbleTrapState ? Math.max(2, baseGap * 0.35) : baseGap;
    const bubbleWidth = isBubbleTrapState ? Math.max(VIS * 0.95, getBubbleTrapWidth()) : 0;
    const bubbleHeight = isBubbleTrapState ? Math.max(VIS * 1.05, getBubbleTrapHeight()) : 0;
    const bubbleCenterY = isBubbleTrapState ? feetY - bubbleHeight * 0.245 : 0;
    const catTop = isBubbleTrapState
      ? bubbleCenterY - bubbleHeight * 0.5
      : (isWallState ? feetY - VIS * 0.42 : feetY - VIS * POSITIONING.CAT_TOP_OFFSET);
    const catMid = isBubbleTrapState
      ? bubbleCenterY
      : (isWallState ? feetY - VIS * 0.08 : feetY - VIS * POSITIONING.CAT_MID_OFFSET);
    const catBottom = isBubbleTrapState
      ? bubbleCenterY + bubbleHeight * 0.31
      : (isWallState ? feetY + VIS * 0.28 : feetY);
    const catHalfW = isBubbleTrapState
      ? bubbleWidth * 0.5
      : VIS * (isWallState ? 0.22 : 0.5);
    const catSafe = {
      left: feetX - catHalfW - gap,
      right: feetX + catHalfW + gap,
      top: catTop - gap,
      bottom: catBottom + gap
    };

    const candidates = isBubbleTrapState ? [
      { anchor: 'bottom', x: feetX - speechSizeW / 2, y: catBottom + gap },
      { anchor: 'left', x: catSafe.left - speechSizeW, y: catMid - speechSizeH / 2 },
      { anchor: 'right', x: catSafe.right, y: catMid - speechSizeH / 2 },
      { anchor: 'top', x: feetX - speechSizeW / 2, y: catTop - speechSizeH - gap }
    ] : (isWallState ? [
      { anchor: state === 'wall_right' || state === 'wall_right_sit' ? 'left' : 'right', x: (state === 'wall_right' || state === 'wall_right_sit') ? catSafe.left - speechSizeW : catSafe.right, y: catMid - speechSizeH / 2 },
      { anchor: 'top', x: feetX - speechSizeW / 2, y: catTop - speechSizeH - gap },
      { anchor: 'bottom', x: feetX - speechSizeW / 2, y: catBottom + gap },
      { anchor: state === 'wall_right' || state === 'wall_right_sit' ? 'right' : 'left', x: (state === 'wall_right' || state === 'wall_right_sit') ? catSafe.right : catSafe.left - speechSizeW, y: catMid - speechSizeH / 2 }
    ] : [
      { anchor: 'top', x: feetX - speechSizeW / 2, y: catTop - speechSizeH - gap },
      { anchor: 'bottom', x: feetX - speechSizeW / 2, y: catBottom + gap },
      { anchor: 'left', x: catSafe.left - speechSizeW, y: catMid - speechSizeH / 2 },
      { anchor: 'right', x: catSafe.right, y: catMid - speechSizeH / 2 }
    ]);

    let chosen = candidates[0];
    let chosenClampedX = Math.max(margin, Math.min(vw - margin - speechSizeW, chosen.x));
    let chosenClampedY = Math.max(margin, Math.min(vh - margin - speechSizeH, chosen.y));
    function overlapsCat(x, y) {
      return (
        x < catSafe.right &&
        x + speechSizeW > catSafe.left &&
        y < catSafe.bottom &&
        y + speechSizeH > catSafe.top
      );
    }

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const x = Math.max(margin, Math.min(vw - margin - speechSizeW, c.x));
      const y = Math.max(margin, Math.min(vh - margin - speechSizeH, c.y));
      if (
        c.x >= margin && c.y >= margin &&
        c.x + speechSizeW <= vw - margin &&
        c.y + speechSizeH <= vh - margin &&
        !overlapsCat(x, y)
      ) {
        chosen = c;
        chosenClampedX = x;
        chosenClampedY = y;
        break;
      }
    }

    if (overlapsCat(chosenClampedX, chosenClampedY)) {
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const x = Math.max(margin, Math.min(vw - margin - speechSizeW, c.x));
        const y = Math.max(margin, Math.min(vh - margin - speechSizeH, c.y));
        if (!overlapsCat(x, y)) {
          chosen = c;
          chosenClampedX = x;
          chosenClampedY = y;
          break;
        }
      }
    }

    if (overlapsCat(chosenClampedX, chosenClampedY)) {
      const topY = Math.max(margin, catSafe.top - speechSizeH - gap);
      const bottomY = Math.min(vh - margin - speechSizeH, catSafe.bottom + gap);
      const rightX = Math.min(vw - margin - speechSizeW, catSafe.right);
      const leftX = Math.max(margin, catSafe.left - speechSizeW);
      const fixes = [
        { anchor: 'top', x: chosenClampedX, y: topY },
        { anchor: 'bottom', x: chosenClampedX, y: bottomY },
        { anchor: 'right', x: rightX, y: chosenClampedY },
        { anchor: 'left', x: leftX, y: chosenClampedY }
      ];
      const fix = fixes.find((c) => !overlapsCat(c.x, c.y));
      if (fix) {
        chosen = fix;
        chosenClampedX = fix.x;
        chosenClampedY = fix.y;
      }
    }

    const clampedX = chosenClampedX;
    const clampedY = chosenClampedY;
    speechBubble.dataset.anchor = chosen.anchor;

    // Direct write: positionSpeechBubble is already called from the main animation
    // frame, so scheduling another rAF creates extra work and visible lag.
    const pixelX = Math.round(clampedX);
    const pixelY = Math.round(clampedY);
    const nextTransform = `translate(${pixelX}px, ${pixelY}px)`;
    if (speechBubble.style.transform !== nextTransform) {
      speechBubble.style.transform = nextTransform;
    }

    const arrowMin = POSITIONING.ARROW_MIN_OFFSET * sizeScale;
    if (chosen.anchor === 'top' || chosen.anchor === 'bottom') {
      const arrowX = Math.max(arrowMin, Math.min(speechSizeW - arrowMin, (feetX - clampedX)));
      const arrowValue = `${Math.round(arrowX)}px`;
      if (speechBubble.style.getPropertyValue('--arrow-offset') !== arrowValue) speechBubble.style.setProperty('--arrow-offset', arrowValue);
    } else {
      const arrowY = Math.max(arrowMin, Math.min(speechSizeH - arrowMin, (catMid - clampedY)));
      const arrowValue = `${Math.round(arrowY)}px`;
      if (speechBubble.style.getPropertyValue('--arrow-offset') !== arrowValue) speechBubble.style.setProperty('--arrow-offset', arrowValue);
    }
  }

  // 
  //  SPEECH DISPLAY & INTERACTION
  // 
  
  function showSpeech(text, options) {
    const forceSpeech = !!(options && options.force);
    if (!forceSpeech && !getSpeechEnabled()) {
      hideSpeechBubble();
      return;
    }
    ensureSpeechBubble();
    speechTextEl.textContent = text;
    const lang = getUiLanguage();
    speechBubble.setAttribute('lang', lang);
    speechBubble.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    speechInteractive = !!(options && options.interactive);

    speechBubble.classList.add('is-visible');
    speechBubble.classList.toggle('is-interactive', speechInteractive);
    speechVisible = true;
    speechMeasureNeeded = true;
    positionSpeechBubble(true);

    if (speechHideTimer) removeTimeout(speechHideTimer);
    const customDuration = options && Number.isFinite(Number(options.durationMs)) ? Number(options.durationMs) : null;
    const hideDelay = customDuration != null
      ? Math.max(1200, Math.min(9000, customDuration))
      : (speechInteractive ? SPEECH_CONFIG.INTERACTIVE_DELAY : 5200);
    speechHideTimer = addTimeout(() => hideSpeechBubble(), hideDelay);

    const customCooldown = options && Number.isFinite(Number(options.cooldownMs)) ? Number(options.cooldownMs) : null;
    speechCooldownUntil = Date.now() + (customCooldown != null
      ? Math.max(0, customCooldown)
      : (speechInteractive ? SPEECH_CONFIG.COOLDOWN_INTERACTIVE : SPEECH_CONFIG.COOLDOWN_NORMAL));
  }

  function hideSpeechBubble() {
    if (!speechBubble) return;
    speechBubble.classList.remove('is-visible');
    speechBubble.classList.remove('is-interactive');
    speechVisible = false;
    speechInteractive = false;
    if (speechHideTimer) {
      removeTimeout(speechHideTimer);
      speechHideTimer = null;
    }
  }

  function handleSpeechVote(isLike) {
    if (!speechVisible) return;
    const feetX = getFeetX();
    const feetY = getFeetY();
    const VIS = getVIS();
    
    const responseCategory = isLike ? 'voteLike' : 'voteDislike';
    if (isLike) {
      awardCoins(2);
      earnXP(0.3);
      if (typeof showCoinPopup === 'function') {
        showCoinPopup(feetX, Math.max(20, feetY - VIS * 0.9), 2, '#22c55e', 4);
      }
      spawnHeart(feetX, Math.max(20, feetY - VIS * 0.6));
    } else {
      config.catEnergy = Math.max(0, config.catEnergy - 0.08);
      setAnimLocked('scared', 600);
    }
    noteSpeechEvent(responseCategory);
    showSpeech(getSmartRandomPhrase(responseCategory), {
      interactive: false,
      durationMs: 3100,
      cooldownMs: 17000,
      force: true
    });
    scheduleIdleChatter(SPEECH_CONFIG.INTERACTIVE_DELAY + Math.random() * SPEECH_CONFIG.INTERACTIVE_VARIANCE);
  }

  // 
  //  SPEECH SCHEDULING & TIMING
  // 
  
  function scheduleIdleChatter(delayMs) {
    if (speechIdleTimer) removeTimeout(speechIdleTimer);
    if (teaseTimer) removeTimeout(teaseTimer);
    if (!getSpeechEnabled()) {
      speechIdleTimer = null;
      return;
    }
    
    // Add extra randomness to timing to avoid patterns
    let delay;
    if (delayMs != null) {
      delay = delayMs;
    } else {
      // Use crypto for more random timing if available
      let randomFactor;
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        randomFactor = buffer[0] / 0xFFFFFFFF; // Normalize to 0-1
      } else {
        randomFactor = Math.random();
      }
      
      const range = SPEECH_CONFIG.IDLE_DELAY_MAX - SPEECH_CONFIG.IDLE_DELAY_MIN;
      delay = SPEECH_CONFIG.IDLE_DELAY_MIN + (randomFactor * range);
      
      // Add small jitter to break any patterns (10%)
      const jitter = (Math.random() - 0.5) * 0.2;
      delay = delay * (1 + jitter);
    }
    
    speechIdleTimer = addTimeout(() => {
      speechIdleTimer = null;
      maybeIdleChatter();
    }, delay);
  }

  function isSpeechIdleState() {
    const isDragging = getIsDragging();
    const isPurring = getIsPurring();
    const isDeepSleep = getIsDeepSleep();
    const catEnabled = getCatEnabled();
    const isTabVisible = getIsTabVisible();
    const state = getState();
    const IDLE_STATES = getIdleStates();
    
    if (isDragging || isPurring || isDeepSleep) return false;
    if (!catEnabled) return false;
    if (!getSpeechEnabled()) return false;
    if (!isTabVisible) return false;
    if (speechVisible) return false;
    if (speechInteractive) return false;
    
    // Passive/random chatter should only happen while the pet is actually calm.
    // Movement states like walking, climbing, chasing, jumping, fish/ball play,
    // and coin chasing are handled by explicit action hooks so the screen
    // does not get spammed while the pet is just moving around.
    const passiveSpeechStates = new Set(['watchvideo']);
    
    return IDLE_STATES.has(state) || passiveSpeechStates.has(state);
  }

    function maybeIdleChatter() {
    updateWatchMemory(false);

    if (!isSpeechIdleState()) {
      scheduleIdleChatter(SPEECH_CONFIG.RETRY_DELAY_MIN + Math.random() * SPEECH_CONFIG.RETRY_DELAY_MAX);
      return;
    }

    getLocal(['autoFishSpawnEnabled', 'ballEnabled', 'spiderEnabled', 'portalEnabled']).then(prefs => {
      // 10% chance to complain about missing features if any are disabled
      if (Math.random() < 0.15) {
        const complaints = [];
        if (prefs.autoFishSpawnEnabled === false) complaints.push("Where are my fishes?", "Enable the fish, human.", "Did you forget the fish?", "I am hungry.");
        if (prefs.ballEnabled === false) complaints.push("Where is my ball?", "Enable my ball.", "I want to play.", "Turn on the ball.");
        if (prefs.spiderEnabled === false) complaints.push("Where are the spiders?", "I want to hunt.", "Did you hide spiders?", "Enable bugs now.");
        if (prefs.portalEnabled === false) complaints.push("Turn on portals.", "Where are portals?", "I want to teleport.", "Enable portals, human.");

        if (complaints.length > 0) {
          const text = complaints[Math.floor(Math.random() * complaints.length)];
          showSpeech(text, { interactive: false });
          scheduleIdleChatter();
          return;
        }
      }

      const interactive = Math.random() < (1 / 15);
      
      let text;
      if (interactive) {
        text = getSmartRandomPhrase('feedbackQuestion');
      } else {
        text = getContextAwareSpeechText();
      }
      
      showSpeech(text, { interactive });
      scheduleIdleChatter();
    }).catch(() => {
      // Fallback
      const interactive = Math.random() < (1 / 15);
      const text = interactive ? getSmartRandomPhrase('feedbackQuestion') : getContextAwareSpeechText();
      showSpeech(text, { interactive });
      scheduleIdleChatter();
    });
  }

  function speakFromCategory(category, options) {
    const now = Date.now();
    const force = options && options.force;
    const allowReplace = !!(options && options.allowReplace);
    if (speechVisible && !allowReplace) return;
    if (!force && now < speechCooldownUntil) return;

    noteSpeechEvent(category);
    const text = getSmartRandomPhrase(category);
    showSpeech(text, {
      interactive: options && options.interactive,
      durationMs: options && options.durationMs,
      cooldownMs: options && options.cooldownMs
    });
  }

  function maybeSpeakAction(category, options) {
    if (!category || !getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible()) return;
    if (getIsDragging() || getIsDeepSleep() || getIsPurring()) return;
    if (speechVisible || speechInteractive) return;

    const now = Date.now();
    const minGap = options && Number.isFinite(Number(options.minGapMs)) ? Number(options.minGapMs) : SPEECH_CONFIG.COOLDOWN_ACTION;
    const repeatGap = options && Number.isFinite(Number(options.repeatGapMs)) ? Number(options.repeatGapMs) : 16000;
    if (now - lastActionSpeechTs < minGap) return;
    if (lastActionSpeechCategory === category && now - lastActionSpeechTs < repeatGap) return;

    const chance = options && Number.isFinite(Number(options.chance)) ? Number(options.chance) : 0.5;
    if (Math.random() > Math.max(0, Math.min(1, chance))) return;

    lastActionSpeechTs = now;
    lastActionSpeechCategory = category;
    speakFromCategory(category, {
      force: true,
      durationMs: options && options.durationMs ? options.durationMs : 3400,
      cooldownMs: options && options.cooldownMs ? options.cooldownMs : SPEECH_CONFIG.COOLDOWN_ACTION
    });
  }

  function getCounterPhrase(lines, counter) {
    if (!Array.isArray(lines) || !lines.length) return '';
    const n = Math.max(0, Number(counter) || 0);
    // Counter-based, but still varied: the same grab number will not always sound identical.
    const index = Math.floor(Math.random() * lines.length + n) % lines.length;
    return lines[index];
  }

  function getGrabCounterSpeech(grabCount) {
    const n = Math.max(1, Number(grabCount) || 1);

    if (n === 1) {
      return getCounterPhrase([
        'Wait, what now?', 'Human? Put me down.', 'Where are we going?', 'Is this a game?',
        'My paws were busy.', 'Oh, moving now?', 'Careful with the fur.', 'Soft hands, human.'
      ], n);
    }

    if (n === 2) {
      return getCounterPhrase([
        'Again, human?', 'I remember this.', 'Still not a toy.', 'Can you not?',
        'Check your boundaries.', 'I have cat plans.', 'This again?', 'My beans are sensitive.'
      ], n);
    }

    if (n === 3) {
      return getCounterPhrase([
        'Third grab already?', 'You keep doing this.', 'Pattern detected, human.', 'This is getting old.',
        'I noticed that.', 'Find another hobby.', 'My tail disapproves.', 'Touch grass, human.'
      ], n);
    }

    if (n === 10) return 'Tenth grab. Congrats.';
    if (n > 10 && n % 10 === 0) return `${n} grabs. Impressive.`;
    if (n >= 7) {
      return getCounterPhrase([
        'Still grabbing me?', 'You are obsessed.', 'This is your hobby?', 'I charge fish tax.',
        'Very normal behavior.', 'Human, explain yourself.', 'The paw council knows.', 'I remember everything.'
      ], n);
    }

    return getCounterPhrase([
      'Again with this?', 'You missed me?', 'Hands off the fur.', 'I was busy.',
      'Put me back, human.', 'This is suspicious.', 'Paws need freedom.', 'Try petting instead.'
    ], n);
  }

  function getHeldCounterSpeech(heldSeconds, grabCount, speed) {
    const n = Math.max(1, Number(grabCount) || 1);
    const seconds = Math.max(1, Number(heldSeconds) || 1);
    const fast = Math.abs(Number(speed) || 0) > 520;

    if (seconds >= 18) {
      return getCounterPhrase([
        'I live here now.', 'Is your finger stuck?', 'I am aging here.', 'Still holding? Really?',
        'This is awkward.', 'Release the fluff.', 'Floor time, human.', 'My paws need freedom.'
      ], n + seconds);
    }

    if (seconds >= 8) {
      speechSession.longHolds = Math.min(999, (Number(speechSession.longHolds) || 0) + 1);
      return getCounterPhrase([
        'Still holding me?', 'This is getting weird.', 'Let go, human.', 'I need freedom.',
        'My patience is gone.', 'Enough carrying, human.', 'Pets, not carrying.', 'You done yet?'
      ], n + seconds);
    }

    if (fast) {
      return getCounterPhrase([
        'Too fast, human.', 'I am not luggage.', 'Where are we going?', 'Less shaking, please.',
        'Tail is not steering.', 'Easy with the paws.', 'Careful with me.', 'My fur is premium.'
      ], n + seconds);
    }

    if (n >= 3) {
      return getCounterPhrase([
        'Still doing this?', 'You learned nothing.', 'I remember the grabs.', 'This again, human?',
        'At least be gentle.', 'My beans are judging.', 'Paw patience is low.', 'Try the video instead.'
      ], n + seconds);
    }

    return getCounterPhrase([
      'Still holding me?', 'We live here now?', 'I have paws.', 'What is the plan?',
      'You done, human?', 'This is awkward.', 'Put me back.', 'I need the floor.'
    ], n + seconds);
  }

  function getDropCounterSpeech(grabCount, dropCount, heldSeconds, releaseSpeed) {
    const n = Math.max(1, Number(grabCount) || 1);
    const drops = Math.max(1, Number(dropCount) || 1);
    const seconds = Math.max(0, Number(heldSeconds) || 0);
    const thrown = Math.abs(Number(releaseSpeed) || 0) > 420;

    if (thrown) {
      return getCounterPhrase([
        'Why am I flying?', 'I am not a ball.', 'Rude flight, human.', 'Paws need warning.',
        'Gravity found me.', 'That was dramatic.', 'My tail remembers.', 'Try gentler next time.'
      ], n + drops);
    }

    if (n >= 4 || drops >= 4 || seconds >= 8) {
      return getCounterPhrase([
        'Finally. Freedom.', 'Do not repeat that.', 'My trust fell too.', 'I need a bath.',
        'Ignoring you now.', 'Watch your cursor.', 'That was personal.', 'I remember this.'
      ], n + drops + seconds);
    }

    return getCounterPhrase([
      'Rude landing, human.', 'Floor says hello.', 'I meant to do that.', 'My paws felt that.',
      'Try softer next time.', 'Tail survived.', 'Gravity found me again.', 'Calculated move. Trust me.'
    ], n + drops);
  }

  function speakGrabbed() {
    if (!getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible() || getIsDeepSleep()) return;
    if (speechInteractive) return;

    const now = Date.now();
    speechSession.grabs = Math.min(999, (Number(speechSession.grabs) || 0) + 1);
    speechSession.lastGrabStartedAt = now;
    speechSession.lastHeldSeconds = 1;
    noteSpeechEvent('grabbed');
    lastGrabSpeechTs = now;
    lastDragSpeechTs = now;

    showSpeech(getGrabCounterSpeech(speechSession.grabs), {
      durationMs: 2600 + Math.random() * 900,
      cooldownMs: 900
    });
  }

  function updateGrabbedSpeech(meta) {
    if (!getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible() || getIsDeepSleep()) return;
    if (!getIsDragging()) return;
    const now = Date.now();
    const startedAt = Number(speechSession.lastGrabStartedAt) || now;
    const heldSeconds = Math.max(1, Math.round((now - startedAt) / 1000));
    speechSession.lastHeldSeconds = heldSeconds;
    const speed = meta && Number.isFinite(Number(meta.speed)) ? Math.abs(Number(meta.speed)) : 0;

    if (heldSeconds < 3) return;
    const gap = heldSeconds >= 8 ? 9000 : 12000;
    if (now - lastDragSpeechTs < gap) return;
    if (speechVisible && now - lastGrabSpeechTs < 2400) return;

    noteSpeechEvent('held');
    lastDragSpeechTs = now;
    lastGrabSpeechTs = now;
    showSpeech(getHeldCounterSpeech(heldSeconds, speechSession.grabs, speed), {
      durationMs: 2500 + Math.random() * 700,
      cooldownMs: 700
    });
  }

  function speakDropped(meta) {
    if (!getSpeechEnabled()) return;
    if (!getCatEnabled() || !getIsTabVisible() || getIsDeepSleep()) return;
    const now = Date.now();
    const startedAt = Number(speechSession.lastGrabStartedAt) || now;
    const heldMs = Math.max(0, now - startedAt);
    const heldSeconds = Math.max(1, Math.round(heldMs / 1000));
    speechSession.lastHeldSeconds = heldSeconds;
    speechSession.lastGrabStartedAt = 0;
    speechSession.drops = Math.min(999, (Number(speechSession.drops) || 0) + 1);

    const releaseSpeed = meta && Number.isFinite(Number(meta.releaseSpeed)) ? Math.abs(Number(meta.releaseSpeed)) : 0;
    noteSpeechEvent(releaseSpeed > 420 ? 'thrown' : 'dropped');
    showSpeech(getDropCounterSpeech(speechSession.grabs, speechSession.drops, heldSeconds, releaseSpeed), {
      durationMs: 2700 + Math.random() * 800,
      cooldownMs: 1600,
      allowReplace: true
    });
  }

  function maybeSpeakConfused() {
    if (!getSpeechEnabled()) return;
    const now = Date.now();
    if (now - lastWallSpeakTs < AFK_CONFIG.WALL_SPEAK_COOLDOWN) return;
    if (Math.random() < 0.06) {
      lastWallSpeakTs = now;
      speakFromCategory('confused', { cooldownMs: 30000, durationMs: 2400 });
    }
  }

  function maybeSpeakAngry() {
    if (!getSpeechEnabled() || speechVisible) return;
    if (Math.random() < 0.16) {
      speakFromCategory('angry');
    }
  }

  let teaseTimer = 0;
  let lastTeaseSpeechTs = 0;
  
  function checkTeasing() {
    const now = Date.now();
    const draggedObject = getDraggedFish() || getDraggedBall();
    const catState = config.state;
    // Check if the cat is chasing something while the user holds an object
    if (draggedObject && (catState === 'chasefish' || catState === 'chasing' || catState === 'chasing_bug')) {
      if (now - lastTeaseSpeechTs > 6000 && !speechVisible) {
        showSpeech(getSmartRandomPhrase('teasing'), {
          durationMs: 2500,
          interactive: false
        });
        lastTeaseSpeechTs = now;
      }
    }
    teaseTimer = addTimeout(checkTeasing, 1000);
  }
  
  teaseTimer = addTimeout(checkTeasing, 2000);

  function markSpeechMeasure() {
    speechMeasureNeeded = true;
  }

  function cleanup() {
    if (speechBubble && speechBubble.isConnected) {
      speechBubble.remove();
    }
    if (speechHideTimer) removeTimeout(speechHideTimer);
    if (speechIdleTimer) removeTimeout(speechIdleTimer);
    if (memorySaveTimer) removeTimeout(memorySaveTimer);
    detachWatchTracker();
  }

  loadSpeechMemory();

  // 
  //  PUBLIC API
  // 
  
  return {
    scheduleIdleChatter,
    speakFromCategory,
    maybeSpeakAction,
    speakGrabbed,
    updateGrabbedSpeech,
    speakDropped,
    maybeSpeakConfused,
    maybeSpeakAngry,
    showSpeech,
    hideSpeechBubble,
    positionSpeechBubble,
    markSpeechMeasure,
    updateWatchMemory,
    clearMemory,
    cleanup,
    get speechVisible() { return speechVisible; },
    get speechBubble() { return speechBubble; }
  };
};