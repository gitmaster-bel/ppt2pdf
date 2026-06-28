import { tmdb } from './tmdb';

export const COLLECTION_CATEGORIES: Record<string, number[]> = {
  'Action & Adventure': [
    131292, // Marvel Cinematic Universe
    86311, // The Avengers
    263, // The Dark Knight
    87359, // Mission: Impossible
    645, // James Bond
    9485, // Fast & Furious
    404609, // John Wick
    1570, // The Bourne
    84, // Indiana Jones
    948, // Die Hard
    119, // The Lord of the Rings
    1241, // Harry Potter
    10, // Star Wars
    307080, // Star Wars Skywalker Saga
    380064, // Star Trek (Kelvin Timeline)
    31322, // The Expendables
    13444, // Spider-Man (Sam Raimi)
    531241, // Spider-Man (Tom Holland)
    556, // Spider-Man (The Amazing)
    528, // The Terminator
    9366, // Rocky
    173710, // Planet of the Apes (Reboot)
    8251, // Planet of the Apes (Original)
    13448, // The Matrix
    328, // Jurassic Park
    102279, // The Hunger Games
    203204, // The Maze Runner
    133869, // Divergent
    384462, // The Purge
  ],
  'Sci-Fi & Fantasy': [
    119, // The Lord of the Rings
    835560, // The Hobbit
    1241, // Harry Potter
    33514, // Fantastic Beasts
    10, // Star Wars Original
    131292, // MCU
    2344, // The Matrix
    528, // Terminator
    328, // Jurassic Park
    380064, // Star Trek
    120794, // Godzilla
    531330, // MonsterVerse
    173710, // Planet of the Apes
    118, // Transformers
    40810, // Alien
    280, // Predator
    535181, // Dune
    643534, // Avatar
    405441, // Pacific Rim
    136437, // Riddick
    325852, // Mad Max
    124976, // Tron
    261623, // Independence Day
  ],
  'Animation': [
    10194, // Toy Story
    1734, // Shrek
    113426, // Despicable Me
    360416, // Kung Fu Panda
    113645, // How to Train Your Dragon
    58129, // Cars
    630138, // The Incredibles
    275990, // Monsters, Inc.
    391129, // Finding Nemo
    605481, // Frozen
    88065, // Ice Age
    200424, // Madagascar
    170821, // Hotel Transylvania
    862121, // Spider-Verse
    408992, // The Secret Life of Pets
    325883, // Sing
    526017, // The Lego Movie
  ],
  'Horror & Thriller': [
    109018, // The Conjuring
    449258, // Annabelle
    56637, // Scream
    135261, // Halloween
    118, // Saw
    59253, // Final Destination
    361099, // The Purge
    92882, // Paranormal Activity
    175658, // Insidious
    432135, // A Quiet Place
    456942, // It
    2599, // The Exorcist
    135262, // A Nightmare on Elm Street
    135265, // Friday the 13th
    135263, // Child's Play / Chucky
    90666, // Resident Evil
    3838, // Underworld
    40810, // Alien
  ],
  'Comedy & Family': [
    106519, // The Hangover
    391557, // Bad Boys
    89314, // Scary Movie
    106191, // Men in Black
    136473, // Jump Street
    9214, // American Pie
    257530, // Pitch Perfect
    487382, // Deadpool
    119561, // Ghostbusters
    118742, // Rush Hour
    115049, // Meet the Parents
    90104, // Austin Powers
    133917, // Night at the Museum
    328509, // Ride Along
    91456, // The Naked Gun
  ],
  'Crime & Drama': [
    230, // The Godfather
    163459, // The Twilight Saga
    1032, // The Rocky
    31100, // Oceans
    101683, // The Millennium Trilogy (Girl with Dragon Tattoo)
    897364, // Knives Out
    800451, // Kingsman
    374944, // Now You See Me
    326305, // Sicario
    325076, // Creed
  ]
};

export function getCuratedCollectionsPool() {
  const collectionIds = [
    // Global
    263, 119, 230, 131292, 1241, 84, 10, 404609, 87359, 645, 2344, 328, 10194, 173710, 9485,
    8650, 295, 531330, 131635, 344830, 264, 304, 528, 556, 86311, 131295, 131296, 284433, 531241, 618529, 8537, 121938, 8091, 948485, 151, 468222, 120794, 1709, 9744, 535313, 1570, 1575, 748, 2602, 31562, 391860, 313086, 86055, 553717, 14890, 8580, 86066, 488924, 720879, 14740, 90863, 70068, 1069584, 295130, 2150, 77816, 89137, 8354, 656, 8864, 727761, 325470, 1022790, 544669, 85943, 1733, 17235, 645,
    
    // Regional (India)
    350309, 44976, 246091, 483464, 142015, 485645, 256433, 44722, 921781, 977824, 506940, 259256, 1029834, 142022, 657153, 1213248, 489399, 557748, 282971, 605068, 20970, 343944, 244500, 1397777, 341455, 505479, 1639816, 736592,
    
    // Regional (Japan)
    210303, 425164, 23616, 39199, 148065, 117354, 247028, 263101, 143302, 374509, 374511, 96850, 386410,
    
    // Regional (Korea)
    619537, 619802, 531566, 619533, 660359, 1517098, 736824, 707622, 535790, 620873, 1185967, 421904,
    
    // Regional (Spain)
    74508, 388180, 2248, 624920, 492969, 669836, 9649, 778680, 86027, 117354,

    // Regional (Brazil)
    119581, 455278, 342577, 743415, 369380, 429234, 620873, 386410, 263101, 148065, 39199
  ];

  // Deduplicate
  const uniqueIds = Array.from(new Set(collectionIds));

  
  const CURATED_TAGLINES: Record<number, string> = {
    263: "Nolan's definitive superhero epic", 119: "The greatest fantasy trilogy", 230: "Cinema's greatest achievement",
    131292: "The ultimate connected universe", 1241: "The boy who lived", 84: "The original adventure hero",
    10: "Where it all began", 404609: "Modern action at its finest", 87359: "The best ongoing action franchise",
    645: "60 years of the greatest spy", 2344: "The sci-fi landmark", 328: "30 years of dino carnage",
    10194: "Pixar's timeless masterpiece", 173710: "The reboot done right", 9485: "Family. Always.",
    350309: "India's greatest epic", 44976: "High-octane Bollywood heist", 246091: "India's beloved superhero",
    483464: "Bollywood's biggest comedy franchise", 142015: "Crazy family drama & comedy", 485645: "The ultimate Indian spy universe",
    619537: "Korean zombie masterpiece", 619802: "Ma Seok-do's brutal justice", 210303: "Japanese mecha phenomenon", 
    425164: "The iconic anime saga", 23616: "The path of the ninja",
    131635: "May the odds be ever in your favor", 8650: "Robots in disguise", 295: "A pirate's life for me", 
    531330: "The titans clash", 344830: "The intense romance trilogy",
    74508: "Spanish found-footage terror", 119581: "Brazil's explosive crime saga",
    264: "Time-traveling adventures in a DeLorean",
    304: "The slickest heist crew ever assembled",
    528: "Humanity's war against the machines",
    556: "With great power comes great responsibility",
    86311: "Earth's mightiest heroes, united",
    131295: "The star-spangled supersoldier saga",
    131296: "The God of Thunder strikes again",
    284433: "Intergalactic misfits save the universe",
    531241: "Your friendly neighborhood hero's MCU journey",
    618529: "Sorcery, multiverses, and pure madness",
    8537: "The original superhero's legendary arc",
    121938: "An unexpected journey through Middle-earth",
    8091: "In space, no one can hear you scream",
    948485: "A darker, grittier Dark Knight rises",
    151: "Boldly going where no one has gone before",
    468222: "The world's most extraordinary superhero family",
    120794: "Burton and Schumacher's Gothic Gotham saga",
    1709: "When apes ruled and humans cowered",
    9744: "Marvel's first family of superheroes",
    535313: "Monsters of legend clash on the big screen",
    256433: "Salman Khan's fearless cop universe",
    44722: "Gangster with a heart of gold",
    921781: "The fiery rise of a sandalwood king",
    977824: "Bollywood's iconic haunted horror comedy",
    506940: "Tiger Shroff's explosive rebel action saga",
    259256: "High-stakes betrayal and Bollywood thrills",
    1029834: "A father's desperate bid to save his family",
    142022: "Bollywood's most beloved comedy trio",
    657153: "Rocky's blood-soaked rise to power",
    1213248: "Brotherhood forged in fire and war",
    39199: "The tiny detective with a giant mind",
    148065: "A robotic cat's magical adventures",
    117354: "Japan's naughtiest kid saves the day",
    247028: "Japan's legendary wandering swordsman",
    263101: "The iconic 90s magical girl trilogy",
    143302: "The mecha saga that defined a generation",
    374509: "The original kaiju monster epics",
    374511: "Japan's iconic monster reborn for a new era",
    96850: "Humanity's last stand against the Angels",
    386410: "Goku's legendary journey begins here",
    531566: "Korea's epic journey through the afterlife",
    619533: "Cloned warriors and science gone wrong",
    660359: "Korea's greatest naval hero on screen",
    1517098: "Korea's sweeping saga of sacrifice and love",
    736824: "North-South detectives partner up for justice",
    707622: "Conan's live-action mystery drama specials",
    535790: "Kaiju apocalypse 20,000 years in the future",
    620873: "Super Saiyan battles beyond all limits",
    1185967: "The world's greatest thief strikes again",
    421904: "The Dark Knight's animated legacy collected",
    388180: "Spain's funniest north-meets-south romcom",
    2248: "Spain's hilariously corrupt detective saga",
    624920: "Spain's beloved bumbling secret agents",
    492969: "Spain's animated Indiana Jones adventure",
    669836: "Spain's chaotic family comedy franchise",
    9649: "Rodriguez's explosive guitar-case trilogy",
    778680: "Spain's beloved animated comic classics",
    86027: "A magical world of wishes and wonders",
    455278: "Brazil's most beloved comedy mom",
    342577: "A lottery win turns life upside down",
    743415: "Brazil's hilarious sex shop comedy saga",
    369380: "Brazil's iconic body-swap comedy trilogy",
    429234: "Brazil's cult horror icon haunts forever",
    1570: "Wrong place, wrong time, right hero",
    1575: "Philadelphia's underdog fights to the top",
    748: "Mutants fighting a world that fears them",
    2602: "Ghostface never truly goes away",
    31562: "A spy who forgot — and remembered everything",
    391860: "Manners maketh the deadliest spy",
    313086: "The Warrens face unspeakable terror",
    86055: "Protecting Earth one alien at a time",
    553717: "Apollo's son fights for his legacy",
    14890: "Miami's baddest cops ride or die",
    8580: "Wax on, wax off — legends never die",
    86066: "Gru's chaotic family defies all evil",
    488924: "A Peruvian bear wins London's heart",
    720879: "Gotta go fast and save the world",
    14740: "Zoo animals gone wonderfully wild",
    90863: "East meets West at breakneck speed",
    70068: "Wing Chun's legendary grandmaster rises",
    1069584: "Rome's arena demands blood and glory",
    295130: "Escape the maze, face the scorched truth",
    2150: "Happily ever after was never this messy",
    77816: "This panda is the chosen one",
    89137: "A Viking and his dragon conquer everything",
    8354: "A mammoth, sloth and tiger survive everything",
    656: "Jigsaw wants to play a deadly game",
    8864: "Death has a design — and it never stops",
    489399: "Delhi's lovable idiots strike lucky gold",
    557748: "India's underdog lawyer fights for justice",
    282971: "Love, heartbreak and music bound forever",
    605068: "Mumbai's underworld dynasties in bloody war",
    20970: "India's Godfather commands absolute power",
    343944: "Tamil Nadu's fearless lion roars loudly",
    244500: "Coal mafia's brutal multigenerational blood feud",
    1397777: "An incorruptible taxman vs ruthless power",
    341455: "Small-town romance, very big complications",
    505479: "Three guys, three girls, zero logic",
    727761: "Art the Clown never stops killing",
    325470: "Everything is awesome when built in bricks",
    1022790: "Every emotion lives inside Riley's mind",
    544669: "Yellow, chaotic, and utterly unstoppable",
    85943: "History comes shockingly alive after dark",
    1733: "Ancient curses and relentless undead terror",
    17235: "Hell's own hero fights for humankind",
    736592: "Rani Mukerji battles child trafficking alone"
  };

  return { uniqueIds, CURATED_TAGLINES };
}
