// 
//  PIXELCAT SPEECH SYSTEM - Complete speech module with context awareness
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
  const getVw = () => config._vw;
  const getVh = () => config._vh;
  const getIdleStates = () => config.IDLE_STATES;

  // 
  //  CONFIGURATION CONSTANTS
  // 
  
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
    CAT_TOP_OFFSET: 0.35,    // Multiplier for cat top position
    CAT_MID_OFFSET: 0.18,    // Multiplier for cat mid position
    BUBBLE_GAP: 6,           // Gap between bubble and cat
    BUBBLE_MARGIN: 8,        // Margin from screen edges
    ARROW_MIN_OFFSET: 12     // Minimum arrow offset from bubble edge
  };
  
  const AFK_CONFIG = {
    WALL_SPEAK_COOLDOWN: 2500 // 2.5 seconds between wall speeches
  };

  const MEMORY_KEY = 'pixelCatSpeechMemoryV1';
  const MEMORY_SAVE_DELAY = 1200;
  const MEMORY_MIN_VIDEO_MS = 12000;

  const TOPIC_RULES = [
    { id: 'music', label: 'music', speech: 'topicMusic', words: ['music', 'song', 'beat', 'mix', 'album', 'lyrics', 'lofi', 'playlist', 'concert', 'remix'] },
    { id: 'gaming', label: 'gaming', speech: 'topicGaming', words: ['game', 'gaming', 'minecraft', 'roblox', 'fortnite', 'gta', 'speedrun', 'walkthrough', 'boss', 'playthrough'] },
    { id: 'coding', label: 'coding', speech: 'topicTech', words: ['code', 'coding', 'programming', 'javascript', 'python', 'html', 'css', 'react', 'developer', 'tutorial'] },
    { id: 'tech', label: 'tech', speech: 'topicTech', words: ['tech', 'ai', 'computer', 'pc', 'phone', 'iphone', 'android', 'gpu', 'cpu', 'robot', 'software', 'hardware', 'gadget'] },
    { id: 'science', label: 'science', speech: 'topicScience', words: ['science', 'space', 'physics', 'chemistry', 'biology', 'experiment', 'nasa', 'planet', 'math', 'engineering'] },
    { id: 'food', label: 'food', speech: 'topicFood', words: ['food', 'recipe', 'cooking', 'cook', 'cake', 'pizza', 'burger', 'kitchen', 'chef', 'baking'] },
    { id: 'sports', label: 'sports', speech: 'topicSports', words: ['football', 'soccer', 'basketball', 'nba', 'fifa', 'goal', 'match', 'boxing', 'ufc', 'workout'] },
    { id: 'dogs', label: 'dog videos', speech: 'topicDogs', words: ['dog', 'dogs', 'puppy', 'puppies', 'husky', 'golden retriever', 'bulldog', 'chihuahua', 'bark', 'woofer'] },
    { id: 'squirrels', label: 'squirrel videos', speech: 'topicSquirrels', words: ['squirrel', 'squirrels', 'chipmunk', 'acorn', 'tree rat'] },
    { id: 'rats', label: 'rat videos', speech: 'topicRats', words: ['rat', 'rats', 'mouse', 'mice', 'rodent', 'hamster', 'guinea pig'] },
    { id: 'birds', label: 'bird videos', speech: 'topicBirds', words: ['bird', 'birds', 'parrot', 'crow', 'pigeon', 'eagle', 'owl', 'duck', 'chicken'] },
    { id: 'ocean', label: 'ocean videos', speech: 'topicOcean', words: ['ocean', 'sea', 'shark', 'whale', 'fish', 'aquarium', 'octopus', 'crab', 'dolphin'] },
    { id: 'animals', label: 'animal videos', speech: 'topicAnimals', words: ['cat', 'kitten', 'animal', 'pet', 'wildlife', 'zoo', 'bear', 'fox', 'raccoon', 'monkey', 'lion', 'tiger'] },
    { id: 'anime', label: 'anime', speech: 'topicAnime', words: ['anime', 'manga', 'naruto', 'one piece', 'dragon ball', 'jujutsu', 'demon slayer', 'aot'] },
    { id: 'movies', label: 'movies', speech: 'topicMovies', words: ['movie', 'film', 'cinema', 'trailer', 'scene', 'netflix', 'marvel', 'dc', 'actor'] },
    { id: 'horror', label: 'horror', speech: 'topicHorror', words: ['horror', 'scary', 'ghost', 'haunted', 'creepy', 'monster', 'backrooms', 'analog horror'] },
    { id: 'history', label: 'history', speech: 'topicHistory', words: ['history', 'ancient', 'war', 'empire', 'medieval', 'ww2', 'documentary', 'civilization'] },
    { id: 'art', label: 'art', speech: 'topicArt', words: ['art', 'drawing', 'painting', 'sketch', 'animation', 'design', 'artist', 'blender', 'photoshop'] },
    { id: 'money', label: 'money', speech: 'topicMoney', words: ['money', 'finance', 'stock', 'crypto', 'bitcoin', 'business', 'investing', 'market', 'millionaire'] },
    { id: 'news', label: 'news', speech: 'topicNews', words: ['news', 'breaking', 'live', 'politics', 'election', 'update', 'report', 'explained'] },
    { id: 'cars', label: 'car videos', speech: 'topicCars', words: ['car', 'cars', 'truck', 'engine', 'tesla', 'drift', 'racing', 'garage', 'mechanic', 'motor'] },
    { id: 'fashion', label: 'style videos', speech: 'topicStyle', words: ['fashion', 'makeup', 'outfit', 'style', 'hair', 'skincare', 'beauty', 'haul'] }
  ];

  // 
  //  ENHANCED SPEECH LIBRARY - Context-aware phrases
  // 
  
  const SPEECH_LIBRARY = {
    happy: [
      'Purr...', 'Soft.', 'Cozy.', '<3', 'Yay!', 'Warm.', 'Nice.', 'Purr.', 'Good.', ':3',
      'Love this!', 'So comfy!', 'Perfect.', 'Bliss~', 'Happy cat!', 'Content.', 'Peaceful.',
      'Mmm...', 'Relaxed.', 'Vibing.', 'Chill mode.', 'This is nice.', 'Purrfect!',
      'Feeling good!', 'Best day!', 'So happy!', 'Joy!', 'Delighted!', 'Wonderful!',
      'Amazing!', 'Fantastic!', 'Lovely!', 'Sweet!', 'Blessed!', 'Grateful!',
      'Tiny joy detected.', 'This feels cozy.', 'Good screen weather.', 'My paws approve.',
      'Warm pixels today.', 'Happy little loaf.', 'Big purr energy.', 'Certified comfy moment.',
      'Joy mode online.', 'Tail says yes.', 'Good vibes saved.', 'Cozy level rising.',
      'This is premium.', 'Soft moment secured.', 'Happy paws engaged.', 'Mood: very shiny.',
      'Ten outta ten.', 'I like this.', 'Purr engine ready.', 'Tiny celebration time.',
      'Everything feels warm.', 'My heart pixels glow.', 'This screen sparkles.', 'Nice little moment.',
      '#$@! yeah, cozy.', 'This slaps softly.', '#$@!, good vibes.', 'Peak little moment.',
      'Absolute purr cinema.', 'My tail approves.', 'Cozy as heck.', 'This is the good stuff.',
      'Tiny win secured.', 'Big soft energy.', 'I am spoiled.', 'Happy little menace.'
    ],
    angry: [
      'Hey!', 'Hmph.', 'Rude.', 'Grr.', 'Stop.', 'No.', 'Why?', 'Meh.', '>:(',
      'Not cool!', 'Annoyed.', 'Seriously?', 'Ugh.', 'Leave me!', 'Go away.',
      'Hiss!', 'Bad human!', 'Nope.', 'Angry cat!', 'Meow!',
      'Irritated!', 'Frustrated!', 'Enough!', 'Quit it!', 'Knock it off!', 'Grumpy!',
      'Mad!', 'Furious!', 'Upset!', 'Displeased!',
      'Side eye activated.', 'Absolutely not.', 'I object loudly.', 'Tiny rage loading.',
      'My whiskers disagree.', 'Personal space please.', 'Unhand the fluff.', 'That was illegal.',
      'Complaint filed.', 'No thank you.', 'Respect the paws.', 'Mood: spicy.',
      'I saw that.', 'Very rude behavior.', 'Paws are offended.', 'Hmph squared.',
      'What the #$@!?', 'Rude as #$@!.', 'Back off, nerd.', 'Absolute clown move.',
      'You little menace.', 'That was #$@!.', 'I hate that.', 'Do not touch.',
      'Hands off, chaos goblin.', 'Dumb idea, human.', 'That sucked.', 'Try manners.',
      'You absolute walnut.', 'I am pissed.', 'Nope, #$@! that.', 'Unbelievable behavior.',
      'I will bite pixels.', 'Bad move, buddy.', 'The audacity.', 'Not your toy.',
      'Stop being weird.', 'Rude little gremlin.', '#$@! no.', 'I demand damages.'
    ],
    confused: [
      '???', 'Huh?', 'What?', 'Lag?', 'Umm.', 'Eh?', 'Wait.', 'Woah.',
      'Confused...', 'Where am I?', 'What now?', 'Lost?', 'Hmm?', 'Weird.',
      'Strange.', 'Odd.', 'Curious.', 'Interesting...', 'What is this?',
      'Puzzled.', 'Baffled.', 'Perplexed.', 'Bewildered.', 'Mystified.', 'Unclear.',
      'Not sure...', 'Maybe?', 'Dunno.', 'Uncertain.',
      'Brain loading...', 'Explain slowly?', 'Math broke me.', 'Screen did magic.',
      'Where did that go?', 'I blinked once.', 'Unexpected plot.', 'Tiny question mark.',
      'This is suspicious.', 'Need more data.', 'Hmm, strange pixels.', 'I require context.',
      'What just happened?', 'Logic escaped.', 'Processing the chaos.', 'Confusion has entered.',
      'What the heck?', 'That was cursed.', 'Explain, coward.', 'My brain left.',
      'Who approved this?', 'That made no sense.', 'Weird as #$@!.', 'Tiny brain reboot.',
      'What is this nonsense?', 'I distrust it.', 'The plot escaped.', 'No thoughts found.'
    ],
    hungry: [
      'Snack?', 'Fish.', 'Food!', 'Starving.', 'Feed.', 'Hungry.', 'Treat?',
      'Nom nom?', 'Want fish!', 'Feed me!', 'So hungry!', 'Tuna?', 'Dinner time?',
      'Empty belly.', 'Need food.', 'Snack time!', 'Yummy?', 'Got treats?',
      'Famished!', 'Craving!', 'Peckish.', 'Appetite!', 'Munchies!', 'Feast?',
      'Salmon?', 'Chicken?', 'Tasty?', 'Delicious?', 'Gimme food!',
      'Belly says hello.', 'Snack radar active.', 'Emergency dinner?', 'Any crumbs nearby?',
      'Food thoughts only.', 'Feed the legend.', 'Tiny tummy drama.', 'I smell treats.',
      'Lunch negotiations?', 'Snack contract pending.', 'Need crunchy payment.', 'Hungry little engine.',
      'Treat economy now.', 'Bowl status empty?', 'Fish forecast please.', 'Chew mode ready.',
      'Feed me, coward.', 'Snack debt unpaid.', 'I need #$@! fish.', 'Where is dinner?',
      'Belly is yelling.', 'Crumbs or betrayal?', 'This is starvation.', 'Hand over treats.',
      'Food, you monster?', 'I smell lies.', 'Snackless again?', 'Give fish now.'
    ],
    sleepy: [
      'Zzz...', 'Sleep.', 'Nap.', 'Tired.', 'Yawn.', 'Bed.', 'Snooze.',
      'So sleepy...', 'Need rest.', 'Exhausted.', 'Nap time!', 'Drowsy.',
      'Sleepy cat.', 'Rest now.', 'Comfy spot.', 'Dream time.', 'Night night.',
      'Dozing.', 'Slumber.', 'Weary.', 'Fatigued.', 'Drained.', 'Wiped out.',
      'Need sleep.', 'Bedtime!', 'Cozy nap.', 'Sweet dreams.', 'Resting.',
      'Battery very low.', 'Soft reboot needed.', 'Paws entering sleep.', 'Dreams loading now.',
      'Blanket thoughts only.', 'Nap appointment booked.', 'Quiet mode please.', 'Eyes doing gravity.',
      'Sleep cloud nearby.', 'Do not disturb.', 'Tiny snooze scheduled.', 'Yawn protocol active.',
      'Comfy systems online.', 'Resting my pixels.', 'Brain is buffering.', 'Need pillow support.',
      'Too tired for nonsense.', 'Wake me and perish.', 'Nap or riot.', 'I am offline.',
      'Sleepy as #$@!.', 'Let me melt.', 'No thoughts, bed.', 'Snooze tax due.',
      'I quit consciousness.', 'Dreaming of crimes.', 'Tiny coma mode.', 'Do not perceive me.'
    ],
    random: [
      'Meow.', 'Boop.', 'Pixels.', 'Cool.', 'Hi.', 'Mew.', 'Sup.', 'Chillin.',
      'Just vibing.', 'Cat stuff.', 'Doing cat things.', 'Beep boop.', 'Nya~',
      'Mrow.', 'Prrt.', 'Chirp!', 'Mrrp?', 'Watching.', 'Observing.',
      'Pixel life.', 'Digital cat.', 'Screen time.', 'Browsing.',
      'Existing.', 'Being cat.', 'Living.', 'Chilling.', 'Hanging out.',
      'Present.', 'Here.', 'Alive.', 'Awake.', 'Around.', 'Nearby.',
      'I live here.', 'Screen roommate reporting.', 'Tiny paws online.', 'Keyboard throne soon.',
      'I saw that.', 'Just cat thoughts.', 'Pixels taste crunchy.', 'Important tail business.',
      'Blink if snacks.', 'Your cursor suspicious.', 'I supervise everything.', 'Soft chaos loading.',
      'Screen patrol active.', 'I am decorative.', 'Tiny boss present.', 'Doing important nothing.',
      'The pixels whisper.', 'I inspect vibes.', 'Cursor tax due.', 'This tab is mine.',
      'I bring ambience.', 'Meow in progress.', 'Standing by cutely.', 'Certified desk spirit.',
      'Tiny status update.', 'No thoughts, purrs.', 'Professional screen loaf.', 'I approve maybe.',
      'I pay no rent.', 'This is my job.', 'Respect the loaf.', 'I know secrets.',
      'Tiny nonsense patrol.', 'Chaos intern here.', 'Your mouse is guilty.', 'I own this tab.',
      'Just lurking cutely.', 'I am the vibe.', 'Mildly judging you.', 'What a weird website.'
    ],
    interactive: [
      'Pet me?', 'Fish?', 'Play?', 'Good cat?', 'Treat?', 'Nap time?',
      'Wanna play?', 'Attention?', 'Notice me!', 'Play with me?', 'Bored!',
      'Entertain me!', 'Got time?', 'Hang out?', 'Friends?', 'Like me?',
      'Love me?', 'Cuddle?', 'Scratch?', 'Belly rub?', 'Head pat?',
      'Talk to me?', 'Interact?', 'Engage?', 'Respond?', 'React?',
      'Rate my meow?', 'Approve this cat?', 'Tiny review time?', 'Pat button please?',
      'Human feedback needed.', 'Purr survey open.', 'Am I cute?', 'Validate the fluff.',
      'Click for purrs?', 'Opinion requested.', 'Choose my fate?', 'Tiny poll open.',
      'Praise button?', 'I await judgment.', 'Is this charming?', 'Petition for snacks.',
      'Support my paws?', 'Compliment window open.', 'Approve the loaf?', 'Kindness button?',
      'Give me attention?', 'Emotional support click?', 'Be honest, human.', 'Meow back maybe?',
      'Click, coward.', 'Praise me now.', 'Validate my nonsense.', 'Do the nice thing.',
      'Tiny bribe accepted.', 'You like me, right?', 'Choose wisely, human.', 'Petition approved?',
      'Pay attention, nerd.', 'I require votes.', 'Love the loaf?', 'Be useful briefly.'
    ],
    // Context-aware categories
    walking: [
      'Walking.', 'Strolling.', 'On patrol.', 'Exploring.', 'Wandering.',
      'Just walking.', 'Going places.', 'Adventure!', 'Where to?', 'Roaming.',
      'Trotting.', 'Pacing.', 'Marching.', 'Striding.', 'Stepping.',
      'Moving.', 'Traveling.', 'Journeying.', 'Venturing.', 'Prowling.',
      'Tiny patrol route.', 'Floor inspection time.', 'Serious business walk.', 'Destination unknown.',
      'Paws have plans.', 'Just passing through.', 'Casual screen tour.', 'Route looks legal.',
      'Walking with purpose.', 'Soft steps only.', 'On official duty.', 'Taking the scenic tab.',
      'Tiny tax inspection.', 'Checking for nonsense.', 'Step step, idiot.', 'Patrol of doom.',
      'Paws on business.', 'This floor owes me.', 'Route looks suspicious.', 'Official cat walk.'
    ],
    running: [
      'Zoom!', 'Fast!', 'Running!', 'Speedy!', 'Gotta go!', 'Quick!',
      'Zoomies!', 'So fast!', 'Nyoom!', 'Racing!', 'Dash!',
      'Sprinting!', 'Rushing!', 'Hurrying!', 'Bolting!', 'Flying!',
      'Blazing!', 'Zooming!', 'Rapid!', 'Swift!', 'Lightning!',
      'Speed mode unlocked.', 'Tiny blur incoming.', 'Paws at maximum.', 'No brakes installed.',
      'Important sprint!', 'Turbo tail active.', 'Fast pixels only.', 'Velocity is art.',
      'Catch me maybe.', 'Screen speedrun time.', 'Running from boredom.', 'Urgent cat business.',
      'Move, peasants.', 'Zooming like #$@!.', 'Too fast, sorry.', 'Speed crimes!',
      'I heard snacks.', 'Run first, think never.', 'Floor is lava-ish.', 'Tiny panic sprint.'
    ],
    jumping: [
      'Wheee!', 'Jump!', 'Boing!', 'Up!', 'Flying!', 'Leap!',
      'Parkour!', 'Airborne!', 'Hop!', 'Bounce!', 'Acrobat!',
      'Spring!', 'Vault!', 'Soar!', 'Launch!', 'Elevate!',
      'Ascending!', 'Rising!', 'Upward!', 'Skyward!', 'Hopping!',
      'Gravity was optional.', 'Tiny launch sequence.', 'Paws left ground.', 'Air time achieved.',
      'Jump math good.', 'Soft landing planned.', 'Certified bounce.', 'Up I go.',
      'Sky paws engaged.', 'Brief flight moment.', 'I meant that.', 'Landing soon maybe.',
      '#$@! gravity.', 'Air jail time.', 'Oops, airborne.', 'I am majestic.',
      'Floor betrayed me.', 'Tiny yeet.', 'Physics can wait.', 'This is fine.',
      '#$@! gravity.', 'No, I seek height.', 'Gravity can #$@! off.', 'I reject down.',
      'Up is my religion.', 'Floor? never heard.', 'Newton can wait.', 'Ceiling looks tasty.',
      'I am sky now.', 'Down is for cowards.', 'Gravity lost today.', 'Paws versus physics.',
      'This is not falling.', 'It is tactical flying.', 'I meant to launch.', 'Air owes me rent.',
      'No laws up here.', 'Physics is cancelled.', '#$@! the floor.', 'Sky tax paid.'
    ],
    grooming: [
      'Cleaning.', 'Grooming.', 'Bath time.', 'Hygiene!', 'Washing.',
      'Must be clean.', 'Lick lick.', 'Tidy cat.', 'Neat freak.', 'Spotless!',
      'Preening.', 'Polishing.', 'Scrubbing.', 'Freshening.', 'Primping.',
      'Tidying.', 'Sprucing.', 'Beautifying.', 'Maintaining.', 'Perfecting.',
      'Pixel spa time.', 'Fur audit underway.', 'Cleanliness is power.', 'Shine mode active.',
      'One paw moment.', 'Beauty routine serious.', 'Must look legendary.', 'Professional grooming.',
      'Dust has lost.', 'Fresh paws soon.', 'Do not interrupt.', 'Important polish work.',
      'I was filthy.', 'Look away, weirdo.', 'Paw spa, #$@!.', 'Fluff requires work.',
      'I am art.', 'Cleaning my crimes.', 'Fresh as #$@!.', 'No dusty paws.'
    ],
    watching: [
      'Watching...', 'Interesting.', 'Hmm...', 'Observing.', 'Studying.',
      'What is this?', 'Curious!', 'Analyzing.', 'Inspecting.', 'Monitoring.',
      'Examining.', 'Surveying.', 'Viewing.', 'Gazing.', 'Staring.',
      'Peering.', 'Looking.', 'Seeing.', 'Noticing.', 'Spotting.',
      'This plot thickens.', 'Video smells interesting.', 'I am invested.', 'Big screen mystery.',
      'This needs snacks.', 'Academic cat mode.', 'I judge thumbnails.', 'Continue the lore.',
      'I need answers.', 'This is cinema.', 'Thumbnail trial begins.', 'Plot paws engaged.',
      'Watching respectfully.', 'Screen drama detected.', 'I follow along.', 'Very educational maybe.',
      'Pause for snacks?', 'This has layers.', 'I have theories.', 'Let it cook.',
      'This got weird.', 'What a plot.', 'I distrust him.', 'She knows too much.',
      'Thumbnail lied again.', 'This better pay off.', 'Drama smells good.', 'I am nosy.',
      '#$@!, plot twist.', 'That was bold.', 'Rewind that nonsense.', 'I need popcorn.'
    ],
    mischief: [
      'Hehe...', 'Mischief!', 'Chaos time!', 'Trouble!', 'Oops!',
      'Not sorry.', 'Mayhem!', 'Naughty cat.', 'Rebel!', 'Breaking stuff!',
      'Destruction!', 'Smash!', 'Knock knock!', 'Chaos mode!',
      'Troublemaker!', 'Prankster!', 'Rascal!', 'Scamp!', 'Mischievous!',
      'Devious!', 'Sneaky!', 'Crafty!', 'Wicked!', 'Playful chaos!',
      'Tiny chaos permit.', 'I did nothing.', 'Probably an accident.', 'Evidence is missing.',
      'Mischief legally approved.', 'Oops was planned.', 'No witnesses here.', 'Chaos, but cute.',
      'Tiny crime scene.', 'Prank mode active.', 'Rules look flexible.', 'I regret nothing.',
      'Crime time.', 'Hehe, dumb button.', 'Chaos tax collected.', 'I plead cute.',
      '#$@! that element.', 'Yeet approved.', 'This page annoyed me.', 'Oops, sabotage.',
      'I am the problem.', 'Tiny villain arc.', 'Mayhem with paws.', 'Not sorry, nerd.'
    ],
    fishing: [
      'Fish!', 'Catch it!', 'Hunting!', 'Got it!', 'Mine!',
      'Fishy!', 'Yum!', 'Prey!', 'Hunter mode!', 'Gotcha!',
      'Stalking!', 'Tracking!', 'Pursuing!', 'Chasing!', 'Targeting!',
      'Locked on!', 'Focus!', 'Almost!', 'So close!', 'Come here!',
      'Snack acquired soon.', 'Fish math begins.', 'Tiny hunter focus.', 'Dinner is moving.',
      'No escape today.', 'I see lunch.', 'Paws on mission.', 'Tactical snack chase.',
      'Fish, explain yourself.', 'Almost in range.', 'Hunter paws ready.', 'This is personal.',
      'Get over here.', '#$@! fish runs.', 'Lunch has legs.', 'Fish owes me.',
      'No mercy, snack.', 'Tiny hunter rage.', 'I will eat you.', 'Stop dodging, coward.'
    ],
    ball: [
      'Ball!', 'Smack it!', 'Mine now.', 'Rolling crime.',
      'I got this.', 'Paw cannon ready.', 'Bonk incoming.', 'Ball looks guilty.',
      'Tiny sports moment.', 'Kick it? maybe.', 'That ball is rude.', 'Chase the circle.',
      'Professional athlete.', 'Do not bounce away.', 'Come back, orb.', 'I saw it move.',
      'Ball tax collected.', 'This is training.', 'Paws versus sphere.', 'Absolute ball nonsense.',
      'I meant that hit.', 'Wall, catch this.', 'Tiny league game.', 'No rules, only paws.',
      'Orb must answer.', 'This ball owes rent.', 'Smack physics time.', 'I am the goalie.',
      'Round idiot spotted.', 'Catball championship.', 'Bonk economy rising.', 'This sport is mine.'
    ],
    spider: [
      'Spider!', 'Absolutely not.', 'Tiny enemy.', 'Bug patrol.',
      'Get back here.', 'Eight legs? rude.', 'I see you.', 'No ceiling crimes.',
      'Come fight me.', 'Spooky snack?', 'Web idiot spotted.', 'Stop crawling weird.',
      'I am hunting.', 'Leggy little menace.', 'This bug has attitude.', 'Paws versus spider.',
      'No web today.', 'Get off my screen.', 'Creepy thing detected.', 'I dislike that.',
      'Spider owes coins.', 'Tiny boss battle.', 'Come down, coward.', 'That thing blinked.',
      'Web crimes reported.', 'Chasing the menace.', 'Leg math is wrong.', 'I will bap it.',
      'Too many legs.', 'Bug court now.', 'Screen pest located.', 'Spider drama begins.'
    ],
    bigSpider: [
      'Boss spider?!', 'That is too many legs.', 'Need stronger paws.', 'Round two, then.',
      'Big web energy.', 'Nope, giant bug.', 'I need backup.', 'That one has health bars.',
      'Spider boss fight.', 'Tiny cat, huge problem.', 'Not dead yet?', 'Okay, rude upgrade.',
      'Bap harder.', 'This bug is cheating.', 'Web tank spotted.', 'I can still win.',
      'One paw was not enough.', 'Big spider tax.', 'Stop being huge.', 'This is #$@! dramatic.'
    ],
    webbed: [
      'I hate this.', 'Sticky nonsense.', 'Webbed. rude.', 'Help, maybe?',
      'This is #$@!.', 'Spider cheated.', 'I demand justice.', 'Can not move.',
      'Tiny glue prison.', 'Not my fault.', 'Web jail sucks.', 'Unstick me.',
      'This is embarrassing.', 'Spider plays dirty.', 'I was betrayed.', 'Sticky paws bad.',
      'Someone saw nothing.', 'Do not laugh.', 'I meant this.', 'Very unfair.',
      'Web tax unpaid.', 'Freedom pending.', 'This web is rude.', 'Personal space violation.'
    ],
    coin: [
      'Coin!', 'Shiny thing!', 'Money spotted.', 'Mine mine.',
      'Tiny payday.', 'Get the shiny.', 'Coin run!', 'Pocket change prey.',
      'That coin is fleeing.', 'Cash snack.', 'Shiny little idiot.', 'Come to cat.',
      'Money has legs.', 'Paws on profit.', 'Tip jar time.', 'I smell coins.',
      'Rich cat soon.', 'Coin owes me.', 'Financial hunting.', 'Shiny tax due.',
      'Magnet brain says yes.', 'Currency chase.', 'Loot detected.', 'Tiny treasure sprint.',
      'Give me that.', 'Coin gobbled soon.', 'Profit paws.', 'Cash meow.'
    ],
    eating: [
      'Nom.', 'Worth it.', 'Good fish.', 'Tiny feast.',
      'Delicious crime.', 'Snack acquired.', 'No regrets.', 'Fish defeated.',
      'I needed that.', 'Tastes like victory.', 'Lunch complete.', 'Happy belly.',
      'That fish was doomed.', 'Five stars.', 'Chef meow.', 'More please.'
    ],
    topicDogs: [
      'Dog detected.', 'Loud friend alert.', 'Bark machine spotted.', 'That dog is extra.',
      'Too much tail.', 'Suspiciously happy dog.', 'Dog energy is wild.', 'Why so loud?',
      'Puppy propaganda.', 'Big slobber vibes.', 'That dog needs a job.', 'Fluffy chaos cousin.',
      'Bark tax unpaid.', 'I could outrun it.', 'Dog has no chill.', 'Respectfully, woof.'
    ],
    topicSquirrels: [
      'Squirrel spotted.', 'Tree criminal.', 'Acorn goblin alert.', 'That squirrel plots.',
      'Tiny parkour rat.', 'Too fast, too smug.', 'Acorn thief content.', 'I distrust the tail.',
      'Tree ninja detected.', 'Nut economy drama.', 'That thing is twitchy.', 'Chase instinct rising.',
      'Squirrel has secrets.', 'Nature speedrun.', 'Bush menace.', 'Tiny fuzzy criminal.'
    ],
    topicRats: [
      'Rat content?', 'Small whisker cousin.', 'Rodent drama.', 'Cheese politics.',
      'Tiny basement boss.', 'That rat looks smart.', 'Mouse meeting?', 'Suspicious nibblers.',
      'Little pocket villain.', 'Rodent council live.', 'Whiskers respect whiskers.', 'Tiny tunnel friend.',
      'That mouse owes rent.', 'Snack thief vibes.', 'Small but chaotic.', 'Cheese crime documentary.'
    ],
    topicBirds: [
      'Bird detected.', 'Flying snack?', 'Feathered nonsense.', 'Sky creature content.',
      'That bird talks too much.', 'Wings are cheating.', 'Parrot has attitude.', 'Crow looks guilty.',
      'Tiny dinosaur vibes.', 'Bird law is weird.', 'Do not trust beaks.', 'Flap drama.',
      'That duck knows things.', 'Owl judgmental.', 'Chicken chaos.', 'Sky rat episode.'
    ],
    topicOcean: [
      'Water episode.', 'Fish universe.', 'Big wet screen.', 'Ocean snacks everywhere.',
      'Shark looks rude.', 'Whale is huge.', 'Octopus has too many plans.', 'Crab walk approved.',
      'Aquarium mode.', 'Deep sea weirdos.', 'That fish owes me.', 'Wet mystery.',
      'Ocean is suspicious.', 'Too much water.', 'Seafood documentary?', 'Bubble nonsense.'
    ],
    topicAnimals: [
      'Animal chaos.', 'Wildlife drama.', 'Nature is weird.', 'That creature has lore.',
      'Zoo meeting?', 'Fur council content.', 'Tiny instincts activated.', 'I know animal nonsense.',
      'Nature made choices.', 'Creature episode.', 'Wild little guy.', 'Animal politics again.',
      'That thing runs funny.', 'Sniff test pending.', 'Outdoor chaos.', 'Beast documentary.'
    ],
    topicTech: [
      'Tech stuff?', 'Computer ritual.', 'Robot cousin?',
      'That GPU is hot.', 'Code goblin hours.', 'Keyboard magic.', 'Machine thinking loudly.',
      'Nerd tab detected.', 'Silicon snack?', 'Too many cables.', 'Computer has opinions.',
      'Bug hunt begins.', 'Update it, coward.', 'That code blinked.', 'Tech wizard nonsense.'
    ],
    topicGaming: [
      'Game time.', 'Boss fight smell.', 'Skill issue?', 'Loot goblin mode.',
      'Click faster.', 'That enemy cheats.', 'Respawn energy.', 'Inventory full?',
      'Pixel violence approved.', 'Gaming posture detected.', 'One more round?', 'You got this maybe.',
      'Controller rage soon.', 'NPC looks guilty.', 'Quest accepted.', 'Loot first, morals later.'
    ],
    topicMusic: [
      'Beat detected.', 'Tiny head bob.', 'This song slaps.', 'Purr tempo found.',
      'Bass shook whiskers.', 'Playlist ritual.', 'Lo-fi loaf mode.', 'Good ear snack.',
      'Encore, maybe?', 'Rhythm paws.', 'That drop was spicy.', 'Meow in key.',
      'Music nap approved.', 'Chorus smells good.', 'Volume respectfully up.', 'Tiny dance loading.'
    ],
    topicScience: [
      'Science smell.', 'Big brain tab.', 'Space is rude.', 'Physics again?',
      'Experiment time.', 'Tiny lab assistant.', 'Math has claws.', 'Planet drama.',
      'Nasa cat when?', 'Chemistry soup.', 'Gravity owes me.', 'Microscope gossip.',
      'Universe being weird.', 'Data tastes crunchy.', 'Science wizardry.', 'I require goggles.'
    ],
    topicFood: [
      'Food video?', 'Cruel choice.', 'Now I am hungry.', 'Share with cat.',
      'That looks illegal.', 'Recipe detected.', 'Kitchen magic.', 'Snack jealousy.',
      'Chef is powerful.', 'Pizza? hello?', 'Cake diplomacy.', 'Baking smells imagined.',
      'Give me a bite.', 'Food content hurts.', 'Tasty pixels.', 'Dinner propaganda.'
    ],
    topicSports: [
      'Sports yelling.', 'Ball humans.', 'Run, tall people.', 'Goal drama.',
      'Ref looks suspicious.', 'Tiny coach mode.', 'That was a foul.', 'Crowd is loud.',
      'Kick the thing.', 'Sweaty strategy.', 'Champion paws watching.', 'Scoreboard smells tense.',
      'Athlete zoomies.', 'Boxing paws?', 'Team chaos.', 'Sports math.'
    ],
    topicAnime: [
      'Anime arc?', 'Power-up soon.', 'Hair physics wild.', 'Main character detected.',
      'Villain monologue time.', 'Friendship laser?', 'That sword is huge.', 'Episode smells dramatic.',
      'Opening song rules.', 'Training arc?', 'Plot armor thick.', 'Cat needs subtitles.',
      'Big emotions incoming.', 'Anime yelling.', 'Final form when?', 'This is peak nonsense.'
    ],
    topicMovies: [
      'Movie mode.', 'Trailer voice.', 'Cinema paws.', 'Plot incoming.',
      'This actor again?', 'Explosion soon?', 'Dramatic lighting.', 'I smell sequel.',
      'That scene has lore.', 'Popcorn needed.', 'Camera doing tricks.', 'Movie magic nonsense.',
      'Hero looks tired.', 'Villain has style.', 'Big screen vibes.', 'Credits when?'
    ],
    topicHorror: [
      'Nope content.', 'Scary tab.', 'I heard that.', 'Do not open door.',
      'Ghost? rude.', 'Hide behind me.', 'Actually, you hide.', 'Creepy hallway tax.',
      'That shadow moved.', 'Horror smells bad.', 'Jump scare incoming.', 'I am brave-ish.',
      'Monster has issues.', 'Turn lights on.', 'Absolutely cursed.', 'No thank you.'
    ],
    topicHistory: [
      'History lore.', 'Old human drama.', 'Empire nonsense.', 'War documentary?',
      'Ancient beef.', 'Tiny historian mode.', 'Those helmets slap.', 'Castle gossip.',
      'People never learn.', 'Map changed again.', 'Medieval mess.', 'Timeline smells dusty.',
      'Old drama rerun.', 'Civilization speedrun.', 'Historical tea.', 'Big sword era.'
    ],
    topicArt: [
      'Art time.', 'Pretty pixels.', 'Brush wizard.', 'Drawing spell.',
      'That line is clean.', 'Color snack.', 'Sketch magic.', 'Artist paws impressed.',
      'Design goblin hours.', 'Canvas drama.', 'Animation soup.', 'That shading slaps.',
      'Creative chaos.', 'Tiny art critic.', 'Paint smells imagined.', 'Masterpiece maybe.'
    ],
    topicMoney: [
      'Money talk.', 'Coin lore?', 'Rich human ritual.', 'Charts are scary.',
      'Line went up.', 'Line went down.', 'Finance goblin tab.', 'Buy snacks instead.',
      'Market chaos.', 'Crypto smells hot.', 'Stonks maybe.', 'Business paws confused.',
      'Millionaire bait?', 'Profit meow.', 'Invest in treats.', 'Wallet drama.'
    ],
    topicNews: [
      'News face on.', 'World is loud.', 'Breaking what now?', 'Serious tab.',
      'Humans did it again.', 'Headline drama.', 'I need context.', 'Live chaos.',
      'Politics smells spicy.', 'Report voice.', 'Big update energy.', 'Everyone calm down.',
      'News snack needed.', 'World doing nonsense.', 'That sounds important.', 'Cat remains neutral.'
    ],
    topicCars: [
      'Car noises.', 'Engine purr?', 'Fast metal box.', 'Garage smell.',
      'That drift was rude.', 'Mechanic wizard.', 'Truck looks chunky.', 'Vroom politics.',
      'Wheel creature.', 'Racing zoomies.', 'Tesla tab?', 'Motor drama.',
      'Car has attitude.', 'Oil snack? no.', 'Speed machine.', 'Road beast.'
    ],
    topicStyle: [
      'Style check.', 'Outfit lore.', 'Hair ritual.', 'Makeup magic.',
      'That fit works.', 'Fashion paws judging.', 'Skincare science.', 'Mirror boss fight.',
      'Beauty spell.', 'Tiny stylist mode.', 'Color choice spicy.', 'Closet drama.',
      'Fresh look.', 'Glow-up detected.', 'Fabric gossip.', 'Runway cat when?'
    ],
    climbing: [
      'Climbing!', 'Up we go!', 'Ninja cat!', 'Scaling!', 'Spider cat!',
      'Wall walk!', 'Defying gravity!', 'Parkour!', 'Vertical!',
      'Ascending!', 'Mounting!', 'Rising!', 'Upward!', 'Higher!',
      'To the top!', 'Clambering!', 'Scrambling!', 'Gripping!', 'Holding on!',
      'Wall says no.', 'I say yes.', 'Vertical business time.', 'Tiny mountaineer mode.',
      'Grip check passed.', 'Higher for reasons.', 'Wall patrol active.', 'Upward problem solving.',
      'This is fine.', 'Paws are sticky.', 'Climb plan working.', 'Top shelf dreams.',
      'Wall, shut up.', 'I own this wall.', 'Gravity is rude.', 'Upward nonsense.',
      'Tiny wall crime.', 'Do not question.', 'Climbing like a fool.', 'Wall accepted defeat.',
      'No, I seek height.', '#$@! gravity.', 'Gravity is a scam.', 'I am above rules.',
      'Wall obeys cat.', 'Upward, idiot.', 'Floor is boring.', 'Ceiling appointment.',
      'I crave altitude.', 'Gravity can cry.', 'Sticky paws supremacy.', 'This wall is mine.',
      'Newton hates me.', 'I choose vertical.', 'No down, only up.', 'Gravity? never met her.',
      'I ascend, nerd.', 'Wall crime ongoing.', 'Tiny cliffhanger.', 'I lick danger.'
    ],
    stuck: [
      'Stuck?', 'Help!', 'Uh oh.', 'Trapped!', 'Can\'t move!',
      'Blocked!', 'Wall!', 'No way!', 'Dead end!', 'Hmm...',
      'Wedged!', 'Jammed!', 'Cornered!', 'Stranded!', 'Immobile!',
      'Frozen!', 'Halted!', 'Stopped!', 'Impeded!', 'Obstructed!',
      'Path unavailable.', 'Send assistance.', 'Navigation failed.', 'Tiny traffic jam.',
      'Feet disagree.', 'Map is broken.', 'Obstacle has won.', 'Recalculating paws.',
      'I meant this.', 'Strategic pause.', 'Need alternate route.', 'Physics is rude.',
      '#$@! wall.', 'This is #$@!.', 'I blame the page.', 'Move, stupid obstacle.',
      'Tiny stuck idiot.', 'Not my fault.', 'Help, maybe?', 'I am trapped-ish.'
    ],
    content: [
      'Reading?', 'Watching?', 'Scrolling?', 'Browsing?', 'Busy?',
      'Whatcha doing?', 'Interesting page.', 'Cool content!', 'Nice video!',
      'Good stuff!', 'Learning?', 'Researching?', 'Working hard?',
      'Studying?', 'Focused?', 'Concentrating?', 'Engaged?', 'Absorbed?',
      'Immersed?', 'Invested?', 'Attentive?', 'Productive?', 'Diligent?',
      'This looks important.', 'I remember vibes.', 'New video smell.', 'Same rabbit hole?',
      'You watch carefully.', 'Another deep dive.', 'Screen snack acquired.', 'Learning arc continues.',
      'Focus aura detected.', 'Interesting choice today.', 'You are locked in.', 'Brain snacks happening.',
      'Serious screen time.', 'This tab has power.', 'Content buffet open.', 'I study too.',
      'Notes not included.', 'Curiosity looks tasty.', 'Another knowledge bite.', 'We are researching.',
      'You nerding out?', 'This looks serious.', 'Learning, huh?', 'Big brain tab.',
      'I am copying you.', '#$@!, focus mode.', 'This better be useful.', 'Research goblin hours.'
    ],
    memory: [
      'I remember this.', 'Your usual vibe.', 'Classic you choice.', 'Back here again?',
      'Pattern detected.', 'Favorite trail found.', 'I know this mood.', 'This feels familiar.',
      'Your watch ritual.', 'The lore continues.', 'I saw the trend.', 'Memory paws active.',
      'Saved in whiskers.', 'I know your vibe.', 'This is familiar.', 'History says hello.',
      'Tiny memory ping.', 'Old path detected.', 'Comfort content again.', 'I noticed patterns.',
      'Your habits sparkle.', 'This feels regular.', 'My notes agree.', 'Memory tail twitch.',
      'Back again, huh?', 'I knew it.', 'Classic you.', 'Same chaos flavor.',
      'You do this often.', 'I remember, nerd.', 'Comfort loop detected.', 'Your usual nonsense.'
    ],
    newTopic: [
      'New flavor today.', 'Plot twist content.', 'Different tunnel now.', 'New hobby unlocked.',
      'Fresh screen scent.', 'Interesting switch up.', 'Unexpected video path.', 'New obsession maybe?',
      'Fresh rabbit hole.', 'New playlist energy.', 'Different vibes detected.', 'Surprise topic day.',
      'A new arc begins.', 'Screen changed flavor.', 'Curiosity took over.', 'Fresh trail found.',
      'New chaos unlocked.', 'Different nonsense today.', 'Who are you now?', 'Fresh bad idea?'
    ],
    favoriteTopic: [
      'More {topic}, huh?', '{topic} again today?', 'You love {topic}.', '{topic} is winning.',
      'Your {topic} era.', 'Back to {topic}.', '{topic} detected again.', 'Strong {topic} pattern.',
      '{topic} owns this tab.', '{topic} has returned.', 'Classic {topic} mood.', 'More {topic} fuel.',
      '{topic} streak continues.', 'You and {topic}.', '{topic} comfort zone.', '{topic} again? Nice.',
      '{topic}, obviously.', '{topic} addiction noted.', '#$@!, more {topic}.', 'You missed {topic}.'
    ],
    channelMemory: [
      'This channel again.', 'Familiar channel scent.', 'You know this one.', 'Back to this creator.',
      'Regular stop detected.', 'This place returns.', 'Channel memory unlocked.', 'I remember them.',
      'Your regular stop.', 'This creator returns.', 'Known channel energy.', 'We have been here.',
      'Familiar upload smell.', 'Back to the source.', 'Repeated channel noted.', 'This one again?',
      'Same place, huh?', 'They got you again.', 'Your usual channel.', 'This creator owns you.'
    ]
  };

  const LOCALIZED_TOPIC_LABELS = {
    fr: {
      music: 'la musique', gaming: 'les jeux', coding: 'le code', tech: 'la tech', science: 'la science',
      food: 'la cuisine', sports: 'le sport', dogs: 'les vidéos de chiens', squirrels: 'les écureuils',
      rats: 'les rongeurs', birds: 'les oiseaux', ocean: 'l’océan', animals: 'les animaux',
      anime: 'l’anime', movies: 'les films', horror: 'l’horreur', history: 'l’histoire',
      art: 'l’art', money: 'la finance', news: 'les infos', cars: 'les voitures', fashion: 'le style'
    },
    ar: {
      music: 'الموسيقى', gaming: 'الألعاب', coding: 'البرمجة', tech: 'التقنية', science: 'العلم',
      food: 'الطبخ', sports: 'الرياضة', dogs: 'فيديوهات الكلاب', squirrels: 'السناجب',
      rats: 'القوارض', birds: 'الطيور', ocean: 'البحر', animals: 'الحيوانات',
      anime: 'الأنمي', movies: 'الأفلام', horror: 'الرعب', history: 'التاريخ',
      art: 'الفن', money: 'المال', news: 'الأخبار', cars: 'السيارات', fashion: 'الأناقة'
    }
  };

  const LOCALIZED_SPEECH_SEEDS = {
    fr: {
      happy: ['Ronron...', 'Tout doux.', 'Bien au chaud.', 'Joie !', 'J’adore ça !', 'Tellement confortable.', 'Moment parfait.', 'Chat heureux !', 'Mes pattes valident.', 'Bonne humeur sauvegardée.'],
      angry: ['Hé !', 'Hmph.', 'Pas sympa.', 'Grr.', 'Stop.', 'Non.', 'Sérieux ?', 'Laisse-moi !', 'Je proteste.', 'Respecte les pattes.'],
      confused: ['???', 'Hein ?', 'Quoi ?', 'Attends.', 'Bizarre.', 'Je suis perdu.', 'Besoin de contexte.', 'Mon cerveau charge.', 'Ça n’a aucun sens.', 'Question de chat.'],
      hungry: ['Snack ?', 'Poisson.', 'À manger !', 'J’ai faim.', 'Nourris-moi !', 'Thon ?', 'Ventre vide.', 'Heure du goûter.', 'Je sens les friandises.', 'Contrat de croquettes ouvert.'],
      sleepy: ['Zzz...', 'Dodo.', 'Sieste.', 'Fatigué.', 'Bâillement.', 'Au lit.', 'Besoin de repos.', 'Ne pas déranger.', 'Rêves en chargement.', 'Batterie très basse.'],
      random: ['Miaou.', 'Boop.', 'Pixels.', 'Salut.', 'Mrrp ?', 'Je surveille.', 'Vie de pixel.', 'Je vis ici.', 'Pattes en ligne.', 'Cette page est à moi.'],
      interactive: ['Une caresse ?', 'Poisson ?', 'On joue ?', 'Attention ?', 'Remarque-moi !', 'Tu m’aimes ?', 'Gratte la tête ?', 'Bouton de gentillesse ?', 'Avis demandé.', 'Clique pour ronrons.'],
      walking: ['Je marche.', 'Balade.', 'En patrouille.', 'J’explore.', 'Je rôde.', 'Petits pas.', 'Tour de l’écran.', 'Mission officielle.', 'Route inconnue.', 'Inspection du sol.'],
      running: ['Zoom !', 'Vite !', 'Je cours !', 'Trop rapide !', 'Zou !', 'Sprint important.', 'Pattes au maximum.', 'Mode turbo.', 'Course urgente.', 'Pas de freins.'],
      jumping: ['Youpi !', 'Saut !', 'Boing !', 'En haut !', 'Je vole !', 'Parkour !', 'Décollage.', 'Temps en l’air.', 'Gravité optionnelle.', 'Atterrissage prévu.'],
      grooming: ['Toilette.', 'Je me nettoie.', 'Bain express.', 'Hygiène !', 'Tout propre.', 'Spa de pixels.', 'Routine beauté.', 'Ne pas interrompre.', 'Pattes fraîches.', 'Je suis impeccable.'],
      watching: ['Je regarde...', 'Intéressant.', 'Hmm...', 'Observation.', 'J’étudie.', 'Bon contenu.', 'Choix curieux.', 'Je prends des notes.', 'Vidéo validée.', 'Concentration féline.'],
      mischief: ['Petite bêtise.', 'Oups.', 'Je n’ai rien fait.', 'Plan brillant.', 'Chaos léger.', 'Bouton suspect.', 'Page à tester.', 'Mission malice.', 'Très légal.', 'Ça bouge tout seul.'],
      fishing: ['Poisson repéré.', 'Chasse au poisson.', 'Viens ici.', 'Cible humide.', 'Snack qui nage.', 'Mission thon.', 'Pattes prêtes.', 'Je l’aurai.', 'Menu du jour.', 'Bulle de faim.'],
      ball: ['Balle !', 'Lance-la !', 'Je l’attrape.', 'Joli rebond.', 'Sport de chat.', 'Encore une fois.', 'La balle est mienne.', 'Mode jeu.', 'Objectif rond.', 'Passe parfaite.'],
      spider: ['Araignée !', 'Je chasse.', 'Petite cible.', 'Viens là.', 'Filet interdit.', 'Patte d’attaque.', 'Gardien de page.', 'Je protège tout.', 'Cible repérée.', 'Bond tactique.'],
      bigSpider: ['Grosse araignée !', 'Chef cible.', 'Combat sérieux.', 'Elle est énorme.', 'Plan courage.', 'Pattes prêtes.', 'Boss de page.', 'Je gère.', 'Pas de panique.', 'Attaque brillante.'],
      webbed: ['Collé !', 'Aide ?', 'Toile partout.', 'Je boude.', 'Pas pratique.', 'Pattes coincées.', 'Situation gluante.', 'Liberté demandée.', 'Je vais m’en sortir.', 'Toile injuste.'],
      coin: ['Pièce !', 'Brillant !', 'Butin.', 'Je poursuis.', 'Trésor proche.', 'À moi !', 'Ça scintille.', 'Mode collection.', 'Petite richesse.', 'Paiement trouvé.'],
      eating: ['Miam.', 'Délicieux.', 'Crunch.', 'Merci.', 'Bon poisson.', 'Repas validé.', 'Encore ?', 'Ventre heureux.', 'Service parfait.', 'Très bon.'],
      climbing: ['Je grimpe.', 'Mur ninja.', 'Plus haut.', 'Pattes accrochées.', 'Vertical parfait.', 'Ascension.', 'Mur approuvé.', 'Je défie la gravité.', 'Vue intéressante.', 'Route murale.'],
      stuck: ['Coincé ?', 'Un souci.', 'Je calcule.', 'Sortie où ?', 'Petit blocage.', 'Besoin d’un plan.', 'Obstacle repéré.', 'Je réfléchis.', 'Presque libre.', 'Chemin compliqué.'],
      content: ['Lecture ?', 'Tu regardes ?', 'Défilement ?', 'Page intéressante.', 'Bonne vidéo.', 'Tu apprends ?', 'Focus détecté.', 'Recherche sérieuse.', 'Curiosité active.', 'Je regarde aussi.'],
      memory: ['Je m’en souviens.', 'Ton ambiance habituelle.', 'Déjà vu.', 'Motif détecté.', 'Ça me semble familier.', 'Mémoire activée.', 'Je connais ce choix.', 'Retour ici.', 'Habitude notée.', 'Boucle confortable.'],
      newTopic: ['Nouveau sujet.', 'Changement intéressant.', 'Nouvelle piste.', 'Curiosité fraîche.', 'Autre ambiance.', 'Surprise du jour.', 'Nouvelle aventure.', 'Écran différent.', 'Chemin inédit.', 'Idée fraîche.'],
      favoriteTopic: ['Encore {topic} ?', 'Tu aimes {topic}.', '{topic} revient.', 'Période {topic}.', 'Retour à {topic}.', 'Motif {topic} fort.', '{topic} gagne.', 'Zone confortable : {topic}.', 'Plus de {topic}.', '{topic}, évidemment.'],
      channelMemory: ['Encore cette chaîne.', 'Créateur familier.', 'Retour ici.', 'Je les connais.', 'Arrêt régulier.', 'Endroit connu.', 'Mémoire de chaîne.', 'Déjà vu cette chaîne.', 'Source habituelle.', 'Ils t’ont repris.'],
      topicDogs: ['Vidéo de chiens.', 'Chiens repérés.', 'Ça aboie peut-être.', 'Pattes concurrentes.', 'Je surveille les chiens.', 'Museaux à l’écran.'],
      topicSquirrels: ['Écureuils repérés.', 'Trop rapides.', 'Noix suspecte.', 'Queue agitée.', 'Je surveille l’arbre.', 'Petite course.'],
      topicRats: ['Rongeur repéré.', 'Petite moustache.', 'Cible rapide.', 'Tunnel suspect.', 'Je regarde prudemment.', 'Queue fine.'],
      topicBirds: ['Oiseau repéré.', 'Plumes à l’écran.', 'Ça vole.', 'Je fixe fort.', 'Chirp contrôlé.', 'Cible aérienne.'],
      topicOcean: ['Océan repéré.', 'Beaucoup d’eau.', 'Poisson possible.', 'Vagues suspectes.', 'Snack marin ?', 'Bulle bleue.'],
      topicAnimals: ['Animal repéré.', 'Ambiance zoo.', 'Je compare.', 'Copain potentiel.', 'Nature à l’écran.', 'Patte sauvage.'],
      topicTech: ['Tech détectée.', 'Pixels sérieux.', 'Machine intéressante.', 'Code peut-être.', 'Je supervise.', 'Circuit curieux.'],
      topicGaming: ['Jeu détecté.', 'Partie en cours.', 'Boss possible.', 'Manette imaginaire.', 'Stratégie féline.', 'Niveau suivant.'],
      topicMusic: ['Musique détectée.', 'Bon rythme.', 'Queue en tempo.', 'Playlist validée.', 'Son agréable.', 'Petite vibe.'],
      topicScience: ['Science détectée.', 'Cerveau actif.', 'Expérience ?', 'Espace peut-être.', 'Données savoureuses.', 'Hypothèse de chat.'],
      topicFood: ['Cuisine détectée.', 'Ça donne faim.', 'Recette repérée.', 'Assiette virtuelle.', 'Je veux goûter.', 'Odeur imaginaire.'],
      topicSports: ['Sport détecté.', 'Ça bouge vite.', 'Score ?', 'Pattes échauffées.', 'Match à l’écran.', 'Esprit d’équipe.'],
      topicAnime: ['Anime détecté.', 'Énergie spéciale.', 'Arc nouveau.', 'Héros à l’écran.', 'Style validé.', 'Drama incoming.'],
      topicMovies: ['Film détecté.', 'Cinéma de page.', 'Scène intéressante.', 'Popcorn virtuel.', 'Je regarde.', 'Plan dramatique.'],
      topicHorror: ['Ambiance peur.', 'Je reste prudent.', 'Ombres suspectes.', 'Pas rassuré.', 'Frisson pixel.', 'Je surveille.'],
      topicHistory: ['Histoire détectée.', 'Passé à l’écran.', 'Archives ouvertes.', 'Empire peut-être.', 'Leçon du jour.', 'Chronique de chat.'],
      topicArt: ['Art détecté.', 'Joli trait.', 'Couleurs validées.', 'Création en cours.', 'Je pose pour toi.', 'Palette curieuse.'],
      topicMoney: ['Finance détectée.', 'Pièces sérieuses.', 'Marché à l’écran.', 'Je compte aussi.', 'Richesse virtuelle.', 'Budget de friandises.'],
      topicNews: ['Infos détectées.', 'Actualité à l’écran.', 'Je reste attentif.', 'Message important.', 'Résumé demandé.', 'Page sérieuse.'],
      topicCars: ['Voiture détectée.', 'Moteur imaginaire.', 'Ça roule vite.', 'Garage à l’écran.', 'Course peut-être.', 'Vroum discret.'],
      topicStyle: ['Style détecté.', 'Look validé.', 'Élégance à l’écran.', 'Routine beauté.', 'Très chic.', 'Pattes stylées.']
    },
    ar: {
      happy: ['خرخرة...', 'لطيف.', 'دافئ.', 'ياي!', 'أحب هذا!', 'مريح جداً.', 'لحظة مثالية.', 'قط سعيد!', 'موافقة من الكفوف.', 'تم حفظ المزاج الجميل.'],
      angry: ['مهلاً!', 'همف.', 'هذا مزعج.', 'غرر.', 'توقف.', 'لا.', 'حقاً؟', 'اتركني!', 'أعترض بقوة.', 'احترم الكفوف.'],
      confused: ['؟؟؟', 'ها؟', 'ماذا؟', 'انتظر.', 'غريب.', 'أنا تائه.', 'أحتاج سياقاً.', 'العقل يحمل.', 'هذا غير مفهوم.', 'علامة سؤال صغيرة.'],
      hungry: ['وجبة؟', 'سمك.', 'طعام!', 'أنا جائع.', 'أطعمني!', 'تونة؟', 'بطن فارغ.', 'وقت الوجبة.', 'أشم الحلوى.', 'عقد القرمشة مفتوح.'],
      sleepy: ['ززز...', 'نوم.', 'قيلولة.', 'متعب.', 'تثاؤب.', 'إلى السرير.', 'أحتاج راحة.', 'الرجاء عدم الإزعاج.', 'الأحلام تحمل.', 'البطارية منخفضة جداً.'],
      random: ['مياو.', 'بوب.', 'بكسلات.', 'مرحباً.', 'مرر؟', 'أنا أراقب.', 'حياة بكسل.', 'أنا أعيش هنا.', 'الكفوف متصلة.', 'هذه الصفحة لي.'],
      interactive: ['مداعبة؟', 'سمك؟', 'نلعب؟', 'انتباه؟', 'لاحظني!', 'تحبني؟', 'حك الرأس؟', 'زر اللطف؟', 'رأيك مطلوب.', 'اضغط للخرخرة.'],
      walking: ['أمشي.', 'نزهة.', 'في دورية.', 'أستكشف.', 'أتجول.', 'خطوات صغيرة.', 'جولة الشاشة.', 'مهمة رسمية.', 'وجهة مجهولة.', 'تفتيش الأرض.'],
      running: ['زووم!', 'سريع!', 'أركض!', 'سريع جداً!', 'انطلاق!', 'ركض مهم.', 'الكفوف بأقصى سرعة.', 'وضع توربو.', 'مهمة عاجلة.', 'لا توجد فرامل.'],
      jumping: ['ويي!', 'قفزة!', 'بوينغ!', 'إلى الأعلى!', 'أنا أطير!', 'باركور!', 'إقلاع.', 'وقت في الهواء.', 'الجاذبية اختيارية.', 'هبوط مخطط.'],
      grooming: ['تنظيف.', 'أهتم بفرائي.', 'حمام سريع.', 'نظافة!', 'نظيف تماماً.', 'سبا بكسل.', 'روتين جمال.', 'لا تقاطعني.', 'كفوف منعشة.', 'أنا مرتب.'],
      watching: ['أشاهد...', 'مثير للاهتمام.', 'همم...', 'مراقبة.', 'أدرس.', 'محتوى جيد.', 'اختيار غريب.', 'أسجل ملاحظات.', 'فيديو مقبول.', 'تركيز قططي.'],
      mischief: ['عبث صغير.', 'أوبس.', 'لم أفعل شيئاً.', 'خطة ذكية.', 'فوضى خفيفة.', 'زر مشبوه.', 'صفحة للاختبار.', 'مهمة شقاوة.', 'قانوني جداً.', 'تحرك وحده.'],
      fishing: ['رأيت سمكة.', 'صيد السمك.', 'تعالي هنا.', 'هدف مائي.', 'وجبة تسبح.', 'مهمة التونة.', 'الكفوف جاهزة.', 'سأمسكها.', 'قائمة اليوم.', 'فقاعة جوع.'],
      ball: ['كرة!', 'ارمها!', 'سألتقطها.', 'ارتداد جميل.', 'رياضة القط.', 'مرة أخرى.', 'الكرة لي.', 'وضع اللعب.', 'هدف دائري.', 'تمريرة مثالية.'],
      spider: ['عنكبوت!', 'أنا أصطاد.', 'هدف صغير.', 'تعال هنا.', 'الشبكة ممنوعة.', 'كف الهجوم.', 'حارس الصفحة.', 'أحمي كل شيء.', 'هدف مرصود.', 'قفزة تكتيكية.'],
      bigSpider: ['عنكبوت كبير!', 'هدف زعيم.', 'قتال جاد.', 'إنه ضخم.', 'خطة شجاعة.', 'الكفوف جاهزة.', 'زعيم الصفحة.', 'سأتولى الأمر.', 'لا ذعر.', 'هجوم لامع.'],
      webbed: ['علقت!', 'مساعدة؟', 'شبك في كل مكان.', 'أنا منزعج.', 'غير عملي.', 'الكفوف محبوسة.', 'وضع لزج.', 'أطلب الحرية.', 'سأخرج.', 'شبكة غير عادلة.'],
      coin: ['عملة!', 'لامع!', 'غنيمة.', 'أطارد.', 'كنز قريب.', 'لي!', 'إنها تلمع.', 'وضع الجمع.', 'ثراء صغير.', 'دفعة موجودة.'],
      eating: ['يم.', 'لذيذ.', 'قرمشة.', 'شكراً.', 'سمك جيد.', 'وجبة مقبولة.', 'المزيد؟', 'بطن سعيد.', 'خدمة ممتازة.', 'جيد جداً.'],
      climbing: ['أتسلق.', 'نينجا الجدار.', 'أعلى.', 'الكفوف مثبتة.', 'عمودي مثالي.', 'صعود.', 'الجدار موافق.', 'أتحدى الجاذبية.', 'منظر مثير.', 'طريق جداري.'],
      stuck: ['عالق؟', 'هناك مشكلة.', 'أحسب.', 'أين المخرج؟', 'تعطل صغير.', 'أحتاج خطة.', 'عائق مرصود.', 'أفكر.', 'قريباً حر.', 'طريق معقد.'],
      content: ['قراءة؟', 'تشاهد؟', 'تمرير؟', 'صفحة مثيرة.', 'فيديو جيد.', 'تتعلم؟', 'تم رصد التركيز.', 'بحث جاد.', 'فضول نشط.', 'أنا أشاهد أيضاً.'],
      memory: ['أتذكر هذا.', 'مزاجك المعتاد.', 'رأيته من قبل.', 'نمط مرصود.', 'هذا مألوف.', 'الذاكرة تعمل.', 'أعرف هذا الاختيار.', 'عدنا هنا.', 'عادة مسجلة.', 'حلقة مريحة.'],
      newTopic: ['موضوع جديد.', 'تغيير مثير.', 'مسار جديد.', 'فضول جديد.', 'أجواء أخرى.', 'مفاجأة اليوم.', 'مغامرة جديدة.', 'الشاشة اختلفت.', 'طريق غير معروف.', 'فكرة جديدة.'],
      favoriteTopic: ['المزيد من {topic}؟', 'أنت تحب {topic}.', '{topic} عاد.', 'مرحلة {topic}.', 'عودة إلى {topic}.', 'نمط {topic} قوي.', '{topic} يفوز.', 'منطقة الراحة: {topic}.', 'وقود {topic}.', '{topic} طبعاً.'],
      channelMemory: ['هذه القناة مجدداً.', 'منشئ مألوف.', 'عدنا هنا.', 'أنا أعرفهم.', 'محطة معتادة.', 'مكان معروف.', 'ذاكرة القناة تعمل.', 'رأيت هذه القناة.', 'المصدر المعتاد.', 'أمسكوا بك ثانية.'],
      topicDogs: ['فيديو كلاب.', 'تم رصد كلاب.', 'ربما نباح.', 'كفوف منافسة.', 'أراقب الكلاب.', 'أنوف على الشاشة.'],
      topicSquirrels: ['سناجب مرصودة.', 'سريعة جداً.', 'جوزة مشبوهة.', 'ذيل يتحرك.', 'أراقب الشجرة.', 'سباق صغير.'],
      topicRats: ['قارض مرصود.', 'شارب صغير.', 'هدف سريع.', 'نفق مشبوه.', 'أراقب بحذر.', 'ذيل رفيع.'],
      topicBirds: ['طائر مرصود.', 'ريش على الشاشة.', 'إنه يطير.', 'أحدق بقوة.', 'زقزقة تحت السيطرة.', 'هدف جوي.'],
      topicOcean: ['بحر مرصود.', 'ماء كثير.', 'ربما سمك.', 'موج مشبوه.', 'وجبة بحرية؟', 'فقاعة زرقاء.'],
      topicAnimals: ['حيوان مرصود.', 'أجواء حديقة.', 'أقارن.', 'صديق محتمل.', 'طبيعة على الشاشة.', 'كف بري.'],
      topicTech: ['تقنية مرصودة.', 'بكسلات جادة.', 'آلة مثيرة.', 'ربما كود.', 'أنا أشرف.', 'دائرة غريبة.'],
      topicGaming: ['لعبة مرصودة.', 'جولة جارية.', 'ربما زعيم.', 'يد تحكم خيالية.', 'استراتيجية قططية.', 'المستوى التالي.'],
      topicMusic: ['موسيقى مرصودة.', 'إيقاع جيد.', 'الذيل على النغمة.', 'قائمة مقبولة.', 'صوت لطيف.', 'أجواء صغيرة.'],
      topicScience: ['علم مرصود.', 'العقل نشط.', 'تجربة؟', 'ربما فضاء.', 'بيانات لذيذة.', 'فرضية قط.'],
      topicFood: ['طبخ مرصود.', 'يجوعني.', 'وصفة مرصودة.', 'طبق افتراضي.', 'أريد التذوق.', 'رائحة خيالية.'],
      topicSports: ['رياضة مرصودة.', 'حركة سريعة.', 'النتيجة؟', 'الكفوف جاهزة.', 'مباراة على الشاشة.', 'روح الفريق.'],
      topicAnime: ['أنمي مرصود.', 'طاقة خاصة.', 'قوس جديد.', 'بطل على الشاشة.', 'أسلوب مقبول.', 'دراما قادمة.'],
      topicMovies: ['فيلم مرصود.', 'سينما الصفحة.', 'مشهد مثير.', 'فشار افتراضي.', 'أنا أشاهد.', 'لقطة درامية.'],
      topicHorror: ['أجواء رعب.', 'سأبقى حذراً.', 'ظلال مشبوهة.', 'غير مطمئن.', 'قشعريرة بكسل.', 'أنا أراقب.'],
      topicHistory: ['تاريخ مرصود.', 'الماضي على الشاشة.', 'الأرشيف مفتوح.', 'ربما إمبراطورية.', 'درس اليوم.', 'سجل قططي.'],
      topicArt: ['فن مرصود.', 'خط جميل.', 'ألوان مقبولة.', 'إبداع جارٍ.', 'سأقف كنموذج.', 'لوحة غريبة.'],
      topicMoney: ['مال مرصود.', 'عملات جادة.', 'سوق على الشاشة.', 'أعد أيضاً.', 'ثراء افتراضي.', 'ميزانية الحلوى.'],
      topicNews: ['أخبار مرصودة.', 'حدث على الشاشة.', 'سأنتبه.', 'رسالة مهمة.', 'أحتاج ملخصاً.', 'صفحة جادة.'],
      topicCars: ['سيارة مرصودة.', 'محرك خيالي.', 'تسير بسرعة.', 'مرآب على الشاشة.', 'ربما سباق.', 'فروم هادئ.'],
      topicStyle: ['أناقة مرصودة.', 'مظهر مقبول.', 'ستايل على الشاشة.', 'روتين جمال.', 'شيك جداً.', 'كفوف أنيقة.']
    }
  };

  const LOCALIZED_SUFFIXES = {
    fr: ['', ' maintenant.', ' ici.', ' aussi.', ' vraiment.', ' petit moment.', ' côté écran.', ' pour moi.'],
    ar: ['', ' الآن.', ' هنا.', ' أيضاً.', ' فعلاً.', ' للحظة.', ' على الشاشة.', ' من أجلي.']
  };

  const LOCALIZED_BONUS_VARIANTS = {
    fr: ['', ' Je note ça dans mon carnet de moustaches.'],
    ar: ['', ' سأكتبها في دفتر الشوارب.']
  };

  const LOCALIZED_BONUS_SPEECH_SEEDS = {
    fr: {
      happy: [
        'J’ai le ronron en mode turbo.',
        'Cette ambiance mérite une médaille en croquettes.',
        'Mon petit coeur de pixel fait des bonds.',
        'Je suis officiellement un coussin heureux.',
        'Tout est doux, même les boutons.'
      ],
      angry: [
        'Qui a déplacé mon royaume de trois pixels ?',
        'Je demande un avocat spécialisé en pâtée.',
        'Cette offense sera jugée par le tribunal du canapé.',
        'Mes moustaches viennent de voter non.',
        'Je boude avec une précision professionnelle.'
      ],
      confused: [
        'Mon cerveau a ouvert trop d’onglets.',
        'Je viens de perdre le manuel du monde.',
        'Même ma queue demande une réunion.',
        'Il me faut un schéma, et peut-être du thon.',
        'La logique est partie sans laisser d’adresse.'
      ],
      hungry: [
        'Mon ventre compose une chanson triste.',
        'Je sens une absence grave de poisson.',
        'Le service snack a douze secondes de retard.',
        'Je suis une urgence gastronomique à pattes.',
        'Une croquette tomberait très bien maintenant.'
      ],
      sleepy: [
        'Je vais mettre mon âme en veille.',
        'Mes paupières font de la musculation.',
        'Réunion annulée, je deviens couverture.',
        'Le mode coussin vient de s’activer.',
        'Je rêve déjà d’un poisson très poli.'
      ],
      random: [
        'Je suis décoratif mais avec des opinions.',
        'Le curseur me doit toujours un loyer.',
        'Je patrouille pour des raisons très floues.',
        'Ce pixel a l’air louche.',
        'Je suis petit, donc techniquement discret.'
      ],
      interactive: [
        'Tu peux cliquer, je ne jugerai presque pas.',
        'Un vote pour moi est un vote pour le ronron.',
        'Besoin d’attention, version miniature.',
        'Appuie gentiment, le chat observe.',
        'Je propose une alliance basée sur les snacks.'
      ],
      walking: [
        'Je marche comme si j’avais un rendez-vous important.',
        'Inspection officielle du sol numérique.',
        'Chaque pas est une petite décision royale.',
        'Je traverse ce territoire avec panache.',
        'Mes pattes rédigent un rapport.'
      ],
      running: [
        'Je cours après une idée que je n’ai pas comprise.',
        'Vitesse maximale, dignité minimale.',
        'Quelqu’un a pensé au thon trop fort.',
        'Je suis une virgule orange dans l’univers.',
        'Urgence imaginaire parfaitement réelle.'
      ],
      jumping: [
        'Le sol et moi faisons une pause.',
        'Je monte vérifier si le plafond est comestible.',
        'La gravité recevra mon avis plus tard.',
        'Petit décollage, grande confiance.',
        'J’ai sauté avant de lire les consignes.'
      ],
      grooming: [
        'Je polis mon charisme à la patte.',
        'La poussière vient de perdre une bataille.',
        'Routine beauté supervisée par personne.',
        'Je nettoie les preuves de mes exploits.',
        'Un poil parfait demande du sérieux.'
      ],
      watching: [
        'Je regarde avec une intensité de critique cinéma.',
        'Cette vidéo a reçu trois clignements approbateurs.',
        'Je comprends tout, sauf les parties compliquées.',
        'Je suis le comité de surveillance du canapé.',
        'Le contenu passe le test des moustaches.'
      ],
      mischief: [
        'Je n’ai rien cassé, j’ai réorganisé.',
        'Petite expérience scientifique non autorisée.',
        'La page avait besoin de caractère.',
        'Je pratique l’art délicat du désordre.',
        'Si ça bouge, c’est probablement ma faute.'
      ],
      fishing: [
        'Poisson en vue, dignité en pause.',
        'Je prépare une négociation très croquante.',
        'Cette nageoire ignore mon autorité.',
        'Approche discrète, regard de prédateur minuscule.',
        'Le menu vient de clignoter.'
      ],
      ball: [
        'La balle croit pouvoir s’échapper.',
        'Objet rond détecté, cerveau éteint.',
        'Je vais expliquer la physique à ma façon.',
        'Ce rebond manque de respect.',
        'Encore une passe et je deviens légende.'
      ],
      spider: [
        'Araignée repérée, courage en téléchargement.',
        'Huit pattes, zéro autorisation.',
        'Je protège l’écran avec mon petit chaos.',
        'Cette chose a trop de jambes pour être honnête.',
        'Mission chasse, moustaches verrouillées.'
      ],
      coin: [
        'Brillant repéré, morale oubliée.',
        'Une pièce vient de signer son destin.',
        'Je poursuis l’économie locale.',
        'Petit trésor, grandes priorités.',
        'La richesse roule, je roule aussi.'
      ],
      content: [
        'Tu regardes ça, donc maintenant moi aussi.',
        'Ce sujet sent la curiosité fraîche.',
        'Je classe cette page dans intéressant bizarre.',
        'Le savoir croustille un peu.',
        'Je supervise ton cerveau depuis le coin.'
      ],
      memory: [
        'Je reconnais cette odeur de vidéo.',
        'Tes habitudes ont laissé des traces de pattes.',
        'Déjà vu, mais avec plus de moustaches.',
        'Je garde les archives du canapé.',
        'Ce choix ressemble beaucoup à toi.'
      ],
      climbing: [
        'Le mur est juste un sol ambitieux.',
        'Je monte pour des raisons verticales.',
        'Mes griffes ont demandé une promotion.',
        'Ascension féline, budget zéro.',
        'Je transforme la paroi en trottoir.'
      ]
    },
    ar: {
      happy: [
        'الخرخرة عندي دخلت وضع التيربو.',
        'هذه الأجواء تستحق ميدالية كروكيت.',
        'قلبي البكسلي يقفز من الفرح.',
        'أنا وسادة سعيدة بشكل رسمي.',
        'كل شيء ناعم، حتى الأزرار.'
      ],
      angry: [
        'من حرك مملكتي ثلاث بكسلات؟',
        'أطلب محامياً متخصصاً في التونة.',
        'هذه الإهانة ستذهب إلى محكمة الأريكة.',
        'شواربي صوتت بالرفض.',
        'أنا أعبس باحتراف كامل.'
      ],
      confused: [
        'عقلي فتح تبويبات كثيرة.',
        'أضعت دليل استخدام العالم.',
        'حتى ذيلي يطلب اجتماعاً.',
        'أحتاج رسماً توضيحياً وربما تونة.',
        'المنطق غادر بلا عنوان.'
      ],
      hungry: [
        'بطني يؤلف أغنية حزينة.',
        'أشم نقصاً خطيراً في السمك.',
        'خدمة الوجبات متأخرة اثنتي عشرة ثانية.',
        'أنا حالة طعام طارئة على أربع كفوف.',
        'سقوط قطعة كروكيت سيكون رائعاً.'
      ],
      sleepy: [
        'سأضع روحي في وضع السكون.',
        'جفوني تتمرن بقوة.',
        'الاجتماع ملغى، سأصبح بطانية.',
        'تم تفعيل وضع الوسادة.',
        'أحلم بسمكة مهذبة جداً.'
      ],
      random: [
        'أنا للزينة لكن عندي آراء.',
        'المؤشر ما زال يدين لي بالإيجار.',
        'أقوم بدورية لأسباب غامضة جداً.',
        'هذا البكسل يبدو مشبوهاً.',
        'أنا صغير، إذن أنا متخفي قانونياً.'
      ],
      interactive: [
        'يمكنك الضغط، لن أحكم كثيراً.',
        'صوت واحد لي يعني خرخرة أكثر.',
        'أحتاج انتباهاً بنسخة مصغرة.',
        'اضغط بلطف، القط يراقب.',
        'أقترح تحالفاً مبنياً على الوجبات.'
      ],
      walking: [
        'أمشي كأن لدي موعداً مهماً.',
        'تفتيش رسمي للأرض الرقمية.',
        'كل خطوة قرار ملكي صغير.',
        'أعبر هذه المملكة بكبرياء.',
        'كفوفي تكتب تقريراً.'
      ],
      running: [
        'أركض خلف فكرة لم أفهمها.',
        'سرعة قصوى ووقار قليل.',
        'شخص ما فكر بالتونة بصوت عال.',
        'أنا فاصلة برتقالية في الكون.',
        'طوارئ خيالية لكنها حقيقية تماماً.'
      ],
      jumping: [
        'الأرض وأنا في استراحة.',
        'أصعد لأتأكد هل السقف صالح للأكل.',
        'سأراجع الجاذبية لاحقاً.',
        'إقلاع صغير وثقة كبيرة.',
        'قفزت قبل قراءة التعليمات.'
      ],
      grooming: [
        'ألمع هيبتي بالكف.',
        'الغبار خسر معركة للتو.',
        'روتين جمال بلا مشرف.',
        'أنظف أدلة إنجازاتي.',
        'الشعر المثالي يحتاج جدية.'
      ],
      watching: [
        'أشاهد بتركيز ناقد سينمائي.',
        'هذا الفيديو حصل على ثلاث رمشات موافقة.',
        'أفهم كل شيء إلا الأجزاء الصعبة.',
        'أنا لجنة مراقبة الأريكة.',
        'المحتوى اجتاز اختبار الشوارب.'
      ],
      mischief: [
        'لم أكسر شيئاً، فقط أعدت ترتيبه.',
        'تجربة علمية صغيرة غير مرخصة.',
        'الصفحة كانت تحتاج شخصية.',
        'أمارس فن الفوضى الهادئة.',
        'إذا تحرك شيء فغالباً أنا السبب.'
      ],
      fishing: [
        'سمكة في الأفق والوقار في إجازة.',
        'أحضر مفاوضات مقرمشة جداً.',
        'هذه الزعنفة تتجاهل سلطتي.',
        'اقتراب هادئ ونظرة مفترس صغير.',
        'القائمة رمشت للتو.'
      ],
      ball: [
        'الكرة تظن أنها ستهرب.',
        'جسم دائري مرصود، العقل توقف.',
        'سأشرح الفيزياء بطريقتي.',
        'هذا الارتداد قليل الأدب.',
        'تمريرة أخرى وأصبح أسطورة.'
      ],
      spider: [
        'عنكبوت مرصود، الشجاعة قيد التحميل.',
        'ثماني أرجل وصفر تصريح.',
        'أحمي الشاشة بفوضاي الصغيرة.',
        'هذا الشيء لديه أرجل كثيرة ليكون صادقاً.',
        'مهمة صيد، الشوارب مقفلة.'
      ],
      coin: [
        'لامع مرصود، الأخلاق مؤجلة.',
        'عملة وقعت مصيرها للتو.',
        'أطارد الاقتصاد المحلي.',
        'كنز صغير وأولويات كبيرة.',
        'الثروة تتدحرج وأنا كذلك.'
      ],
      content: [
        'أنت تشاهد هذا، إذن أنا أيضاً.',
        'هذا الموضوع رائحته فضول جديد.',
        'أسجل هذه الصفحة تحت خانة غريب ومثير.',
        'المعرفة تقرمش قليلاً.',
        'أشرف على عقلك من الزاوية.'
      ],
      memory: [
        'أتعرف على رائحة هذا الفيديو.',
        'عاداتك تركت آثار كفوف.',
        'رأيته من قبل لكن بشوارب أكثر.',
        'أحفظ أرشيف الأريكة.',
        'هذا الاختيار يشبهك كثيراً.'
      ],
      climbing: [
        'الجدار مجرد أرض طموحة.',
        'أصعد لأسباب عمودية.',
        'مخالبي طلبت ترقية.',
        'تسلق قططي بميزانية صفر.',
        'أحول الجدار إلى رصيف.'
      ]
    }
  };

  function stripTerminalPunctuation(text) {
    return String(text || '').replace(/[.!؟?…]+$/u, '');
  }

  function expandLocalizedPhrases(seed, count, lang) {
    const base = Array.isArray(seed) && seed.length ? seed : LOCALIZED_SPEECH_SEEDS[lang].random;
    const suffixes = LOCALIZED_SUFFIXES[lang] || [''];
    const result = [];
    for (let i = 0; i < count; i++) {
      const phrase = base[i % base.length];
      if (i < base.length || phrase.includes('{topic}')) {
        result.push(phrase);
      } else {
        result.push(stripTerminalPunctuation(phrase) + suffixes[Math.floor(i / base.length) % suffixes.length]);
      }
    }
    return result;
  }

  function buildLocalizedSpeechLibrary(lang) {
    const seeds = LOCALIZED_SPEECH_SEEDS[lang] || {};
    const library = {};
    Object.keys(SPEECH_LIBRARY).forEach((category) => {
      library[category] = expandLocalizedPhrases(seeds[category], SPEECH_LIBRARY[category].length, lang);
    });
    return library;
  }

  const LOCALIZED_SPEECH_LIBRARY = {
    fr: buildLocalizedSpeechLibrary('fr'),
    ar: buildLocalizedSpeechLibrary('ar')
  };

  function buildLocalizedBonusSpeech(lang, category) {
    const seeds = LOCALIZED_BONUS_SPEECH_SEEDS[lang] && LOCALIZED_BONUS_SPEECH_SEEDS[lang][category];
    if (!Array.isArray(seeds)) return [];
    const variants = LOCALIZED_BONUS_VARIANTS[lang] || [''];
    const phrases = [];
    seeds.forEach((seed) => {
      variants.forEach((suffix, index) => {
        phrases.push(index === 0 ? seed : stripTerminalPunctuation(seed) + suffix);
      });
    });
    return phrases;
  }

  Object.keys(LOCALIZED_BONUS_SPEECH_SEEDS).forEach((lang) => {
    Object.keys(LOCALIZED_BONUS_SPEECH_SEEDS[lang]).forEach((category) => {
      if (!LOCALIZED_SPEECH_LIBRARY[lang][category]) LOCALIZED_SPEECH_LIBRARY[lang][category] = [];
      LOCALIZED_SPEECH_LIBRARY[lang][category].push(...buildLocalizedBonusSpeech(lang, category));
    });
  });
  
  const IDLE_SPEECH_CATEGORIES = ['happy', 'sleepy', 'hungry', 'random', 'content', 'memory'];

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
  let memoryState = createEmptyMemory();
  let memoryLoaded = false;
  let memorySaveTimer = null;
  let lastMemoryVideoKey = '';
  let lastMemoryStartedAt = 0;

  // 
  //  SMART RANDOMIZATION - Avoids repetition across reloads
  // 
  
  function createEmptyMemory() {
    return {
      topics: {},
      channels: {},
      recentVideoKeys: [],
      recentPhrases: [],
      lastTopic: '',
      lastChannel: '',
      totalVideos: 0,
      updatedAt: 0
    };
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
    return lang === 'fr' || lang === 'ar' ? lang : 'en';
  }

  function getSpeechList(category) {
    const lang = getUiLanguage();
    const localized = LOCALIZED_SPEECH_LIBRARY[lang] && LOCALIZED_SPEECH_LIBRARY[lang][category];
    return localized || SPEECH_LIBRARY[category] || SPEECH_LIBRARY.random;
  }

  function getLocalizedTopicLabel(topic) {
    if (!topic) return getUiLanguage() === 'ar' ? 'هذا الشيء' : (getUiLanguage() === 'fr' ? 'ce sujet' : 'this stuff');
    const lang = getUiLanguage();
    return (LOCALIZED_TOPIC_LABELS[lang] && LOCALIZED_TOPIC_LABELS[lang][topic.id]) || topic.label;
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
      topics: raw.topics && typeof raw.topics === 'object' ? raw.topics : {},
      channels: raw.channels && typeof raw.channels === 'object' ? raw.channels : {},
      recentVideoKeys: Array.isArray(raw.recentVideoKeys) ? raw.recentVideoKeys.slice(-18) : [],
      recentPhrases: Array.isArray(raw.recentPhrases) ? raw.recentPhrases.slice(-50) : [],
      lastTopic: typeof raw.lastTopic === 'string' ? raw.lastTopic : '',
      lastChannel: typeof raw.lastChannel === 'string' ? raw.lastChannel : '',
      totalVideos: Math.max(0, Number(raw.totalVideos) || 0),
      updatedAt: Math.max(0, Number(raw.updatedAt) || 0)
    };
  }

  function loadSpeechMemory() {
    if (!getMemoryEnabled()) {
      memoryLoaded = true;
      return;
    }
    getLocal({ [MEMORY_KEY]: null }).then((data) => {
      memoryState = normalizeMemory(data && data[MEMORY_KEY]);
      memoryLoaded = true;
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
    return removeLocal(MEMORY_KEY).catch(() => {});
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
      '#owner #channel-name a',
      'ytd-video-owner-renderer #channel-name a',
      '#upload-info #channel-name a',
      'ytd-watch-metadata ytd-channel-name a',
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
    const selectors = [
      'h1.ytd-watch-metadata',
      'h1.title',
      '#title h1',
      'meta[property="og:title"]'
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = selector.startsWith('meta') ? cleanText(el && el.getAttribute('content')) : cleanText(el && el.textContent);
      if (text) return text.slice(0, 140);
    }
    return cleanText(document.title.replace(/ - YouTube$/i, '')).slice(0, 140);
  }

  function detectTopic(title) {
    const haystack = cleanText(title).toLowerCase();
    if (!haystack) return null;
    let best = null;
    let bestScore = 0;
    TOPIC_RULES.forEach((topic) => {
      let score = 0;
      topic.words.forEach((word) => {
        if (haystack.includes(word)) score += 1;
      });
      if (score > bestScore) {
        best = topic;
        bestScore = score;
      }
    });
    return best;
  }

  function getCurrentTopicSpeechCategory() {
    const topic = detectTopic(getCurrentVideoTitle());
    if (!topic || !topic.speech || !SPEECH_LIBRARY[topic.speech]) return null;
    return topic.speech;
  }

  function incrementCounter(map, key) {
    if (!key) return;
    map[key] = Math.min(999, (Number(map[key]) || 0) + 1);
  }

  function getFavoriteTopic() {
    let bestId = '';
    let bestCount = 0;
    Object.keys(memoryState.topics || {}).forEach((id) => {
      const count = Number(memoryState.topics[id]) || 0;
      if (count > bestCount) {
        bestId = id;
        bestCount = count;
      }
    });
    const topic = TOPIC_RULES.find((item) => item.id === bestId);
    return topic && bestCount >= 2 ? topic : null;
  }

  function updateWatchMemory(force) {
    if (!memoryLoaded) return;
    if (!getMemoryEnabled()) return;
    const title = getCurrentVideoTitle();
    const channel = getCurrentChannelName();
    const videoKey = getVideoId();
    if (!title || !videoKey) return;

    const now = Date.now();
    if (!force && videoKey === lastMemoryVideoKey && now - lastMemoryStartedAt < MEMORY_MIN_VIDEO_MS) return;
    if (memoryState.recentVideoKeys.includes(videoKey)) return;

    const topic = detectTopic(title);
    lastMemoryVideoKey = videoKey;
    lastMemoryStartedAt = now;
    memoryState.recentVideoKeys.push(videoKey);
    memoryState.recentVideoKeys = memoryState.recentVideoKeys.slice(-18);
    memoryState.totalVideos += 1;

    if (topic) {
      incrementCounter(memoryState.topics, topic.id);
      memoryState.lastTopic = topic.id;
    }
    if (channel) {
      incrementCounter(memoryState.channels, channel);
      memoryState.lastChannel = channel;
    }

    scheduleMemorySave();
  }

  function rememberPhrase(phrase) {
    if (!phrase) return;
    memoryState.recentPhrases = Array.isArray(memoryState.recentPhrases) ? memoryState.recentPhrases : [];
    memoryState.recentPhrases.push(phrase);
    memoryState.recentPhrases = memoryState.recentPhrases.slice(-50);
    scheduleMemorySave();
  }

  function fillTemplate(text) {
    const favorite = getFavoriteTopic();
    const topicLabel = getLocalizedTopicLabel(favorite);
    return String(text || '').replace(/\{topic\}/g, topicLabel);
  }

  function getMemorySpeechText() {
    updateWatchMemory(false);
    const title = getCurrentVideoTitle();
    const channel = getCurrentChannelName();
    const currentTopic = detectTopic(title);
    const favoriteTopic = getFavoriteTopic();
    const channelCount = channel ? Number(memoryState.channels[channel]) || 0 : 0;

    if (channelCount >= 2 && Math.random() < 0.35) {
      return getSmartRandomPhrase('channelMemory');
    }
    if (currentTopic && currentTopic.speech && SPEECH_LIBRARY[currentTopic.speech] && Math.random() < 0.45) {
      return getSmartRandomPhrase(currentTopic.speech);
    }
    if (currentTopic && favoriteTopic && currentTopic.id !== favoriteTopic.id && Math.random() < 0.45) {
      return getSmartRandomPhrase('newTopic');
    }
    if (favoriteTopic && Math.random() < 0.6) {
      return getSmartRandomPhrase('favoriteTopic');
    }
    return getSmartRandomPhrase('memory');
  }

  function getSmartRandomPhrase(category) {
    const list = getSpeechList(category);
    if (!list || list.length === 0) return getUiLanguage() === 'ar' ? 'مياو.' : (getUiLanguage() === 'fr' ? 'Miaou.' : 'Meow.');
    
    // Get recently used phrases from storage
    const recentKey = 'recentPhrases_' + catId;
    let recentPhrases = [];
    try {
      const stored = sessionStorage.getItem(recentKey);
      if (stored) {
        recentPhrases = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore storage errors
    }
    
    const memoryRecent = Array.isArray(memoryState.recentPhrases) ? memoryState.recentPhrases : [];

    // Filter out recently used phrases
    let availablePhrases = list.filter(phrase => !recentPhrases.includes(phrase) && !memoryRecent.includes(phrase));
    
    // If all phrases were used recently, reset and use full list
    if (availablePhrases.length === 0) {
      availablePhrases = list.filter(phrase => !recentPhrases.includes(phrase));
    }
    if (availablePhrases.length === 0) {
      availablePhrases = [...list];
      recentPhrases = [];
    }
    
    // Use crypto.getRandomValues for better randomness if available
    let randomIndex;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      randomIndex = randomBuffer[0] % availablePhrases.length;
    } else {
      // Add time-based seed for more randomness
      const timeSeed = Date.now() % 1000;
      const mathRandom = Math.random();
      randomIndex = Math.floor((mathRandom + timeSeed / 1000) * availablePhrases.length) % availablePhrases.length;
    }
    
    const selectedPhrase = fillTemplate(availablePhrases[randomIndex]);
    
    // Track this phrase as recently used
    recentPhrases.push(selectedPhrase);
    
    // Keep only last 40% of phrases in history to allow some repetition but not too soon
    const maxRecent = Math.ceil(list.length * 0.4);
    if (recentPhrases.length > maxRecent) {
      recentPhrases = recentPhrases.slice(-maxRecent);
    }
    
    // Save to session storage
    try {
      sessionStorage.setItem(recentKey, JSON.stringify(recentPhrases));
    } catch (e) {
      // Ignore storage errors
    }
    rememberPhrase(selectedPhrase);
    
    return selectedPhrase;
  }

  // 
  //  CONTEXT-AWARE SPEECH SELECTION
  // 
  
  function getWeightedRandomCategory() {
    const categories = IDLE_SPEECH_CATEGORIES;
    const weights = [22, 16, 12, 18, 18, memoryLoaded && memoryState.totalVideos > 0 ? 14 : 2];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < categories.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return categories[i];
      }
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
    const topicCategory = getCurrentTopicSpeechCategory();
    
    // Priority 1: Active behaviors
    if (state === 'webbed_stun' && SPEECH_LIBRARY.webbed) {
      category = 'webbed';
    } else if (state === 'chasing_bug' && targetSpider && targetSpider.isBig && SPEECH_LIBRARY.bigSpider) {
      category = 'bigSpider';
    } else if (state === 'chasing_bug' && SPEECH_LIBRARY.spider) {
      category = 'spider';
    } else if (state === 'coinchase' && SPEECH_LIBRARY.coin) {
      category = 'coin';
    } else if (state === 'ball_play' && SPEECH_LIBRARY.ball) {
      category = 'ball';
    } else if (state === 'eatfish' && SPEECH_LIBRARY.eating) {
      category = 'eating';
    } else if ((targetFish || state === 'chasefish') && SPEECH_LIBRARY.fishing) {
      category = 'fishing';
    } else if (isJumping && SPEECH_LIBRARY.jumping) {
      category = 'jumping';
    } else if (state === 'groom' && SPEECH_LIBRARY.grooming) {
      category = 'grooming';
    } else if ((state === 'nap' || state === 'sleep' || state === 'deepsleep') && SPEECH_LIBRARY.sleepy) {
      category = 'sleepy';
    } else if ((state === 'wall_left' || state === 'wall_right' || state === 'ninja_climb') && SPEECH_LIBRARY.climbing) {
      category = 'climbing';
    } else if ((state === 'knockoff' || state === 'ui_mischief') && SPEECH_LIBRARY.mischief) {
      category = 'mischief';
    } else if (state === 'watchvideo' && topicCategory && Math.random() < 0.55) {
      category = topicCategory;
    } else if (state === 'watchvideo' && SPEECH_LIBRARY.watching) {
      category = 'watching';
    } else if (topicCategory && Math.random() < 0.32) {
      category = topicCategory;
    } else if (state === 'wander' && Math.abs(velX) > 100 && SPEECH_LIBRARY.running) {
      category = 'running';
    } else if (state === 'wander' && SPEECH_LIBRARY.walking) {
      category = 'walking';
    } else {
      // Default to weighted random idle speech
      category = getWeightedRandomCategory();
    }
    
    return category === 'memory' ? getMemorySpeechText() : getSmartRandomPhrase(category);
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
    speechLikeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 11V10l5-8a3 3 0 0 1 3 3v4h5a2 2 0 0 1 2 2l-1 7a4 4 0 0 1-4 4H7z"/></svg>';
    speechLikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSpeechVote(true);
    });

    speechDislikeBtn = document.createElement('button');
    speechDislikeBtn.type = 'button';
    speechDislikeBtn.className = 'bubble-btn dislike';
    speechDislikeBtn.setAttribute('aria-label', 'Dislike');
    speechDislikeBtn.setAttribute('title', 'Dislike');
    speechDislikeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3m0-11v12l-5 8a3 3 0 0 1-3-3v-4H4a2 2 0 0 1-2-2l1-7a4 4 0 0 1 4-4h10z"/></svg>';
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
    const sizeScale = Math.max(1, VIS / 80);
    const margin = POSITIONING.BUBBLE_MARGIN * sizeScale;
    const gap = isWallState
      ? Math.max(8, POSITIONING.BUBBLE_GAP * sizeScale * 0.45)
      : POSITIONING.BUBBLE_GAP * sizeScale;
    const catTop = isWallState
      ? feetY - VIS * 0.42
      : feetY - VIS * POSITIONING.CAT_TOP_OFFSET;
    const catMid = isWallState
      ? feetY - VIS * 0.08
      : feetY - VIS * POSITIONING.CAT_MID_OFFSET;
    const catBottom = isWallState ? feetY + VIS * 0.28 : feetY;
    const catHalfW = VIS * (isWallState ? 0.22 : 0.5);
    const catSafe = {
      left: feetX - catHalfW - gap,
      right: feetX + catHalfW + gap,
      top: catTop - gap,
      bottom: catBottom + gap
    };

    const candidates = isWallState ? [
      { anchor: state === 'wall_right' || state === 'wall_right_sit' ? 'left' : 'right', x: (state === 'wall_right' || state === 'wall_right_sit') ? catSafe.left - speechSizeW : catSafe.right, y: catMid - speechSizeH / 2 },
      { anchor: 'top', x: feetX - speechSizeW / 2, y: catTop - speechSizeH - gap },
      { anchor: 'bottom', x: feetX - speechSizeW / 2, y: catBottom + gap },
      { anchor: state === 'wall_right' || state === 'wall_right_sit' ? 'right' : 'left', x: (state === 'wall_right' || state === 'wall_right_sit') ? catSafe.right : catSafe.left - speechSizeW, y: catMid - speechSizeH / 2 }
    ] : [
      { anchor: 'top', x: feetX - speechSizeW / 2, y: catTop - speechSizeH - gap },
      { anchor: 'bottom', x: feetX - speechSizeW / 2, y: catBottom + gap },
      { anchor: 'left', x: catSafe.left - speechSizeW, y: catMid - speechSizeH / 2 },
      { anchor: 'right', x: catSafe.right, y: catMid - speechSizeH / 2 }
    ];

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

    // Smooth frame-synced positioning
    requestAnimationFrame(() => {
        if (!speechBubble || !speechBubble.isConnected) return;
        const pixelX = Math.round(clampedX);
        const pixelY = Math.round(clampedY);
        speechBubble.style.transform = `translate(${pixelX}px, ${pixelY}px)`;

        const arrowMin = POSITIONING.ARROW_MIN_OFFSET * sizeScale;
        if (chosen.anchor === 'top' || chosen.anchor === 'bottom') {
            const arrowX = Math.max(arrowMin, Math.min(speechSizeW - arrowMin, (feetX - clampedX)));
            speechBubble.style.setProperty('--arrow-offset', `${Math.round(arrowX)}px`);
        } else {
            const arrowY = Math.max(arrowMin, Math.min(speechSizeH - arrowMin, (catMid - clampedY)));
            speechBubble.style.setProperty('--arrow-offset', `${Math.round(arrowY)}px`);
        }
    });  }

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
    const hideDelay = speechInteractive ? SPEECH_CONFIG.INTERACTIVE_DELAY : 7000;
    speechHideTimer = addTimeout(() => hideSpeechBubble(), hideDelay);

    speechCooldownUntil = Date.now() + (speechInteractive ? SPEECH_CONFIG.COOLDOWN_INTERACTIVE : SPEECH_CONFIG.COOLDOWN_NORMAL);
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
    hideSpeechBubble();
    scheduleIdleChatter(SPEECH_CONFIG.INTERACTIVE_DELAY + Math.random() * SPEECH_CONFIG.INTERACTIVE_VARIANCE);
  }

  // 
  //  SPEECH SCHEDULING & TIMING
  // 
  
  function scheduleIdleChatter(delayMs) {
    if (speechIdleTimer) removeTimeout(speechIdleTimer);
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
    
    const activeSpeechStates = new Set([
      'watchvideo', 'chasing_bug', 'coinchase', 'ball_play', 
      'eatfish', 'chasefish', 'jumping', 'wall_left', 'wall_right', 
      'ninja_climb', 'knockoff', 'ui_mischief', 'wander', 'webbed_stun'
    ]);
    
    return IDLE_STATES.has(state) || activeSpeechStates.has(state);
  }

  function maybeIdleChatter() {
    updateWatchMemory(false);

    if (!isSpeechIdleState()) {
      scheduleIdleChatter(SPEECH_CONFIG.RETRY_DELAY_MIN + Math.random() * SPEECH_CONFIG.RETRY_DELAY_MAX);
      return;
    }

    const interactive = Math.random() < 0.2;
    
    // Use context-aware speech based on what the cat is doing
    let text;
    if (interactive) {
      text = getSmartRandomPhrase('interactive');
    } else {
      text = getContextAwareSpeechText();
    }
    
    showSpeech(text, { interactive });
    scheduleIdleChatter();
  }

  function speakFromCategory(category, options) {
    const now = Date.now();
    const force = options && options.force;
    if (!force && now < speechCooldownUntil) return;

    const text = getSmartRandomPhrase(category);
    showSpeech(text, { interactive: options && options.interactive });
  }

  function maybeSpeakConfused() {
    if (!getSpeechEnabled()) return;
    const now = Date.now();
    if (now - lastWallSpeakTs < AFK_CONFIG.WALL_SPEAK_COOLDOWN) return;
    if (Math.random() < 0.35) {
      lastWallSpeakTs = now;
      speakFromCategory('confused', { force: true });
    }
  }

  function maybeSpeakAngry() {
    if (!getSpeechEnabled()) return;
    if (Math.random() < 0.3) {
      speakFromCategory('angry', { force: true });
    }
  }

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
  }

  loadSpeechMemory();

  // 
  //  PUBLIC API
  // 
  
  return {
    scheduleIdleChatter,
    speakFromCategory,
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
