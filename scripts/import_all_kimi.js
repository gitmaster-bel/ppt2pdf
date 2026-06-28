const fs = require('fs');
const path = require('path');

const kimi1 = [
  { "id": 264, "name": "Back to the Future Collection", "tagline": "Time-traveling adventures in a DeLorean", "region": "Global" },
  { "id": 304, "name": "Ocean's Collection", "tagline": "The slickest heist crew ever assembled", "region": "Global" },
  { "id": 528, "name": "The Terminator Collection", "tagline": "Humanity's war against the machines", "region": "Global" },
  { "id": 556, "name": "Spider-Man Collection", "tagline": "With great power comes great responsibility", "region": "Global" },
  { "id": 86311, "name": "The Avengers Collection", "tagline": "Earth's mightiest heroes, united", "region": "Global" },
  { "id": 131295, "name": "Captain America Collection", "tagline": "The star-spangled supersoldier saga", "region": "Global" },
  { "id": 131296, "name": "Thor Collection", "tagline": "The God of Thunder strikes again", "region": "Global" },
  { "id": 284433, "name": "Guardians of the Galaxy Collection", "tagline": "Intergalactic misfits save the universe", "region": "Global" },
  { "id": 531241, "name": "Spider-Man (MCU) Collection", "tagline": "Your friendly neighborhood hero's MCU journey", "region": "Global" },
  { "id": 618529, "name": "Doctor Strange Collection", "tagline": "Sorcery, multiverses, and pure madness", "region": "Global" },
  { "id": 8537, "name": "Superman Collection", "tagline": "The original superhero's legendary arc", "region": "Global" },
  { "id": 121938, "name": "The Hobbit Collection", "tagline": "An unexpected journey through Middle-earth", "region": "Global" },
  { "id": 8091, "name": "Alien Collection", "tagline": "In space, no one can hear you scream", "region": "Global" },
  { "id": 948485, "name": "The Batman Collection", "tagline": "A darker, grittier Dark Knight rises", "region": "Global" },
  { "id": 151, "name": "Star Trek: The Original Series Collection", "tagline": "Boldly going where no one has gone before", "region": "Global" },
  { "id": 468222, "name": "The Incredibles Collection", "tagline": "The world's most extraordinary superhero family", "region": "Global" },
  { "id": 120794, "name": "Batman Collection", "tagline": "Burton and Schumacher's Gothic Gotham saga", "region": "Global" },
  { "id": 1709, "name": "Planet of the Apes (Original) Collection", "tagline": "When apes ruled and humans cowered", "region": "Global" },
  { "id": 9744, "name": "Fantastic Four Collection", "tagline": "Marvel's first family of superheroes", "region": "Global" },
  { "id": 535313, "name": "Godzilla (Monsterverse) Collection", "tagline": "Monsters of legend clash on the big screen", "region": "Global" },
  { "id": 256433, "name": "Dabangg Collection", "tagline": "Salman Khan's fearless cop universe", "region": "IN" },
  { "id": 44722, "name": "Munna Bhai Collection", "tagline": "Gangster with a heart of gold", "region": "IN" },
  { "id": 921781, "name": "Pushpa Collection", "tagline": "The fiery rise of a sandalwood king", "region": "IN" },
  { "id": 977824, "name": "Bhool Bhulaiyaa Collection", "tagline": "Bollywood's iconic haunted horror comedy", "region": "IN" },
  { "id": 506940, "name": "Baaghi Collection", "tagline": "Tiger Shroff's explosive rebel action saga", "region": "IN" },
  { "id": 259256, "name": "Race Collection", "tagline": "High-stakes betrayal and Bollywood thrills", "region": "IN" },
  { "id": 1029834, "name": "Drishyam Collection", "tagline": "A father's desperate bid to save his family", "region": "IN" },
  { "id": 142022, "name": "Hera Pheri Collection", "tagline": "Bollywood's most beloved comedy trio", "region": "IN" },
  { "id": 657153, "name": "K.G.F Collection", "tagline": "Rocky's blood-soaked rise to power", "region": "IN" },
  { "id": 1213248, "name": "Salaar Collection", "tagline": "Brotherhood forged in fire and war", "region": "IN" },
  { "id": 39199, "name": "Detective Conan Collection", "tagline": "The tiny detective with a giant mind", "region": "JP" },
  { "id": 148065, "name": "Doraemon Movies", "tagline": "A robotic cat's magical movie adventures", "region": "JP" },
  { "id": 117354, "name": "Crayon Shin-chan Collection", "tagline": "Japan's naughtiest five-year-old saves the day", "region": "JP" },
  { "id": 247028, "name": "Rurouni Kenshin Collection", "tagline": "Japan's legendary wandering swordsman", "region": "JP" },
  { "id": 263101, "name": "Sailor Moon Collection", "tagline": "The iconic 90s magical girl trilogy", "region": "JP" },
  { "id": 143302, "name": "Mobile Suit Gundam Collection", "tagline": "The mecha saga that defined a generation", "region": "JP" },
  { "id": 374509, "name": "Godzilla (Showa) Collection", "tagline": "The original kaiju monster epics", "region": "JP" },
  { "id": 374511, "name": "Godzilla (Heisei) Collection", "tagline": "Japan's iconic monster reborn for a new era", "region": "JP" },
  { "id": 96850, "name": "Neon Genesis Evangelion Collection", "tagline": "Humanity's last stand against the Angels", "region": "JP" },
  { "id": 386410, "name": "Dragon Ball Collection", "tagline": "Goku's legendary journey begins here", "region": "JP" },
  { "id": 531566, "name": "Along with the Gods Collection", "tagline": "Korea's epic journey through the afterlife", "region": "KR" },
  { "id": 619533, "name": "The Witch Collection", "tagline": "Cloned warriors and science gone wrong", "region": "KR" },
  { "id": 660359, "name": "Admiral Yi Trilogy", "tagline": "Korea's greatest naval hero on screen", "region": "KR" },
  { "id": 1517098, "name": "Ode to My Father Collection", "tagline": "Korea's sweeping saga of sacrifice and love", "region": "KR" },
  { "id": 736824, "name": "Confidential Assignment Collection", "tagline": "North-South detectives partner up for justice", "region": "KR" },
  { "id": 707622, "name": "Detective Conan Drama Special Collection", "tagline": "Conan's live-action mystery drama specials", "region": "KR" },
  { "id": 535790, "name": "Godzilla (Anime) Collection", "tagline": "Kaiju apocalypse 20,000 years in the future", "region": "KR" },
  { "id": 620873, "name": "Dragon Ball Super Collection", "tagline": "Goku's godlike power beyond imagination", "region": "KR" },
  { "id": 1185967, "name": "Lupin the Third Collection", "tagline": "The world's greatest thief strikes again", "region": "KR" },
  { "id": 421904, "name": "Batman (DC Animated) Collection", "tagline": "The Dark Knight's animated legacy collected", "region": "KR" },
  { "id": 388180, "name": "Spanish Affair Collection", "tagline": "Spain's funniest north-meets-south romcom", "region": "ES" },
  { "id": 2248, "name": "Torrente Collection", "tagline": "Spain's hilariously corrupt detective saga", "region": "ES" },
  { "id": 624920, "name": "Mortadelo & Filemon Collection", "tagline": "Spain's beloved bumbling secret agents", "region": "ES" },
  { "id": 492969, "name": "Tadeo Jones Collection", "tagline": "Spain's animated Indiana Jones adventure", "region": "ES" },
  { "id": 669836, "name": "Padre No Hay Más Que Uno Collection", "tagline": "Spain's chaotic family comedy franchise", "region": "ES" },
  { "id": 9649, "name": "Mexico (El Mariachi) Collection", "tagline": "Rodriguez's explosive guitar-case trilogy", "region": "ES" },
  { "id": 778680, "name": "Mortadelo y Filemón (Estudios Vara)", "tagline": "Spain's beloved animated comic classics", "region": "ES" },
  { "id": 86027, "name": "Aladdin Collection", "tagline": "A magical world of wishes and wonders", "region": "ES" },
  { "id": 117354, "name": "Crayon Shin-chan Collection", "tagline": "Japan's naughtiest kid saves the day", "region": "ES" },
  { "id": 455278, "name": "Minha Mãe É Uma Peça Collection", "tagline": "Brazil's most beloved comedy mom", "region": "BR" },
  { "id": 342577, "name": "Até que a Sorte nos Separe Collection", "tagline": "A lottery win turns life upside down", "region": "BR" },
  { "id": 743415, "name": "De Pernas Pro Ar Collection", "tagline": "Brazil's hilarious sex shop comedy saga", "region": "BR" },
  { "id": 369380, "name": "Se Eu Fosse Você Collection", "tagline": "Brazil's iconic body-swap comedy trilogy", "region": "BR" },
  { "id": 429234, "name": "Coffin Joe Collection", "tagline": "Brazil's cult horror icon haunts forever", "region": "BR" },
  { "id": 620873, "name": "Dragon Ball Super Collection", "tagline": "Super Saiyan battles beyond all limits", "region": "BR" },
  { "id": 386410, "name": "Dragon Ball Collection", "tagline": "Goku's legendary journey begins here", "region": "BR" },
  { "id": 263101, "name": "Sailor Moon Collection", "tagline": "The iconic 90s magical girl trilogy", "region": "BR" },
  { "id": 148065, "name": "Doraemon Movies", "tagline": "A robotic cat's magical adventures", "region": "BR" },
  { "id": 39199, "name": "Detective Conan Collection", "tagline": "The tiny detective with a giant mind", "region": "BR" }
];

const kimi2 = [
  { "id": 1570, "name": "Die Hard Collection", "tagline": "Wrong place, wrong time, right hero", "region": "Global" },
  { "id": 1575, "name": "Rocky Collection", "tagline": "Philadelphia's underdog fights to the top", "region": "Global" },
  { "id": 748, "name": "X-Men Collection", "tagline": "Mutants fighting a world that fears them", "region": "Global" },
  { "id": 2602, "name": "Scream Collection", "tagline": "Ghostface never truly goes away", "region": "Global" },
  { "id": 31562, "name": "The Bourne Collection", "tagline": "A spy who forgot — and remembered everything", "region": "Global" },
  { "id": 391860, "name": "Kingsman Collection", "tagline": "Manners maketh the deadliest spy", "region": "Global" },
  { "id": 313086, "name": "The Conjuring Collection", "tagline": "The Warrens face unspeakable terror", "region": "Global" },
  { "id": 86055, "name": "Men in Black Collection", "tagline": "Protecting Earth one alien at a time", "region": "Global" },
  { "id": 553717, "name": "Creed Collection", "tagline": "Apollo's son fights for his legacy", "region": "Global" },
  { "id": 14890, "name": "Bad Boys Collection", "tagline": "Miami's baddest cops ride or die", "region": "Global" },
  { "id": 8580, "name": "The Karate Kid Collection", "tagline": "Wax on, wax off — legends never die", "region": "Global" },
  { "id": 86066, "name": "Despicable Me Collection", "tagline": "Gru's chaotic family defies all evil", "region": "Global" },
  { "id": 488924, "name": "Paddington Collection", "tagline": "A Peruvian bear wins London's heart", "region": "Global" },
  { "id": 720879, "name": "Sonic the Hedgehog Collection", "tagline": "Gotta go fast and save the world", "region": "Global" },
  { "id": 14740, "name": "Madagascar Collection", "tagline": "Zoo animals gone wonderfully wild", "region": "Global" },
  { "id": 90863, "name": "Rush Hour Collection", "tagline": "East meets West at breakneck speed", "region": "Global" },
  { "id": 70068, "name": "Ip Man Collection", "tagline": "Wing Chun's legendary grandmaster rises", "region": "Global" },
  { "id": 1069584, "name": "Gladiator Collection", "tagline": "Rome's arena demands blood and glory", "region": "Global" },
  { "id": 295130, "name": "The Maze Runner Collection", "tagline": "Escape the maze, face the scorched truth", "region": "Global" },
  { "id": 2150, "name": "Shrek Collection", "tagline": "Happily ever after was never this messy", "region": "Global" },
  { "id": 77816, "name": "Kung Fu Panda Collection", "tagline": "This panda is the chosen one", "region": "Global" },
  { "id": 89137, "name": "How to Train Your Dragon Collection", "tagline": "A Viking and his dragon conquer everything", "region": "Global" },
  { "id": 8354, "name": "Ice Age Collection", "tagline": "A mammoth, sloth and tiger survive everything", "region": "Global" },
  { "id": 656, "name": "Saw Collection", "tagline": "Jigsaw wants to play a deadly game", "region": "Global" },
  { "id": 8864, "name": "Final Destination Collection", "tagline": "Death has a design — and it never stops", "region": "Global" },
  { "id": 489399, "name": "Fukrey Collection", "tagline": "Delhi's lovable idiots strike lucky gold", "region": "IN" },
  { "id": 557748, "name": "Jolly LLB Collection", "tagline": "India's underdog lawyer fights for justice", "region": "IN" },
  { "id": 282971, "name": "Aashiqui Collection", "tagline": "Love, heartbreak and music bound forever", "region": "IN" },
  { "id": 605068, "name": "Once Upon a Time in Mumbai Collection", "tagline": "Mumbai's underworld dynasties in bloody war", "region": "IN" },
  { "id": 20970, "name": "Sarkar Collection", "tagline": "India's Godfather commands absolute power", "region": "IN" },
  { "id": 343944, "name": "Singam Collection", "tagline": "Tamil Nadu's fearless lion roars loudly", "region": "IN" },
  { "id": 244500, "name": "Gangs of Wasseypur Collection", "tagline": "Coal mafia's brutal multigenerational blood feud", "region": "IN" },
  { "id": 1397777, "name": "Raid Collection", "tagline": "An incorruptible taxman vs ruthless power", "region": "IN" },
  { "id": 341455, "name": "Tanu Weds Manu Collection", "tagline": "Small-town romance, very big complications", "region": "IN" },
  { "id": 505479, "name": "Pyaar Ka Punchnama Collection", "tagline": "Three guys, three girls, zero logic", "region": "IN" },
  { "id": 727761, "name": "Terrifier Collection", "tagline": "Art the Clown never stops killing", "region": "Global" },
  { "id": 325470, "name": "The Lego Movie Collection", "tagline": "Everything is awesome when built in bricks", "region": "Global" },
  { "id": 1022790, "name": "Inside Out Collection", "tagline": "Every emotion lives inside Riley's mind", "region": "Global" },
  { "id": 544669, "name": "Minions Collection", "tagline": "Yellow, chaotic, and utterly unstoppable", "region": "Global" },
  { "id": 85943, "name": "Night at the Museum Collection", "tagline": "History comes shockingly alive after dark", "region": "Global" },
  { "id": 1733, "name": "The Mummy Collection", "tagline": "Ancient curses and relentless undead terror", "region": "Global" },
  { "id": 17235, "name": "Hellboy Collection", "tagline": "Hell's own hero fights for humankind", "region": "Global" },
  { "id": 17929, "name": "Stree Collection", "tagline": "Chanderi's terrifying ghost will not spare you", "region": "IN" },
  { "id": 476740, "name": "Mardaani Collection", "tagline": "Rani Mukerji battles child trafficking alone", "region": "IN" },
  { "id": 669960, "name": "Vikram Collection", "tagline": "Tamil cinema's most ferocious revenge mission", "region": "IN" },
  { "id": 673213, "name": "RRR Collection", "tagline": "Two legends, one unstoppable rebellion", "region": "IN" },
  { "id": 413369, "name": "Mersal Collection", "tagline": "Vijay's triple role defies all odds", "region": "IN" },
  { "id": 480243, "name": "Kaala Collection", "tagline": "Rajinikanth's king of Dharavi rises", "region": "IN" },
  { "id": 575, "name": "James Bond Collection", "tagline": "Shaken, not stirred — 007 never rests", "region": "Global" }
];

const allData = [...kimi1, ...kimi2];

// Deduplicate allData by id to prevent TS1117 duplicate keys in CURATED_TAGLINES
const uniqueDataMap = new Map();
for (const item of allData) {
  uniqueDataMap.set(item.id, item);
}
const dedupedData = Array.from(uniqueDataMap.values());

const globalIds = allData.filter(c => c.region === 'Global').map(c => c.id);
const inIds = allData.filter(c => c.region === 'IN').map(c => c.id);
const jpIds = allData.filter(c => c.region === 'JP').map(c => c.id);
const krIds = allData.filter(c => c.region === 'KR').map(c => c.id);
const esIds = allData.filter(c => c.region === 'ES').map(c => c.id);
const brIds = allData.filter(c => c.region === 'BR').map(c => c.id);

const taglineEntries = dedupedData.map(c => "    " + c.id + ": \"" + c.tagline.replace(/"/g, '\\"') + "\"").join(',\\n');

// 1. Rewrite lib/collectionsData.ts

const collPath = path.join(__dirname, '../lib/collectionsData.ts');
let collContent = fs.readFileSync(collPath, 'utf8');

const newFunction = [
  "export async function getCuratedCollections() {",
  "  const collectionIds = [",
  "    // Global",
  "    263, 119, 230, 131292, 1241, 84, 10, 404609, 87359, 645, 2344, 328, 10194, 173710, 9485,",
  "    8650, 295, 531330, 131635, 344830, " + globalIds.join(', ') + ",",
  "    ",
  "    // Regional (India)",
  "    350309, 44976, 246091, 483464, 142015, 485645, " + inIds.join(', ') + ",",
  "    ",
  "    // Regional (Japan)",
  "    210303, 425164, 23616, " + jpIds.join(', ') + ",",
  "    ",
  "    // Regional (Korea)",
  "    619537, 619802, " + krIds.join(', ') + ",",
  "    ",
  "    // Regional (Spain)",
  "    74508, " + esIds.join(', ') + ",",
  "",
  "    // Regional (Brazil)",
  "    119581, " + brIds.join(', '),
  "  ];",
  "",
  "  // Deduplicate",
  "  const uniqueIds = Array.from(new Set(collectionIds));",
  "",
  "  const rawCollections = await Promise.all(uniqueIds.map(id => tmdb.getCollection(id.toString()).catch(() => null)));",
  "  ",
  "  const CURATED_TAGLINES: Record<number, string> = {",
  "    263: \"Nolan's definitive superhero epic\", 119: \"The greatest fantasy trilogy\", 230: \"Cinema's greatest achievement\",",
  "    131292: \"The ultimate connected universe\", 1241: \"The boy who lived\", 84: \"The original adventure hero\",",
  "    10: \"Where it all began\", 404609: \"Modern action at its finest\", 87359: \"The best ongoing action franchise\",",
  "    645: \"60 years of the greatest spy\", 2344: \"The sci-fi landmark\", 328: \"30 years of dino carnage\",",
  "    10194: \"Pixar's timeless masterpiece\", 173710: \"The reboot done right\", 9485: \"Family. Always.\",",
  "    350309: \"India's greatest epic\", 44976: \"High-octane Bollywood heist\", 246091: \"India's beloved superhero\",",
  "    483464: \"Bollywood's biggest comedy franchise\", 142015: \"Crazy family drama & comedy\", 485645: \"The ultimate Indian spy universe\",",
  "    619537: \"Korean zombie masterpiece\", 619802: \"Ma Seok-do's brutal justice\", 210303: \"Japanese mecha phenomenon\", ",
  "    425164: \"The iconic anime saga\", 23616: \"The path of the ninja\",",
  "    131635: \"May the odds be ever in your favor\", 8650: \"Robots in disguise\", 295: \"A pirate's life for me\", ",
  "    531330: \"The titans clash\", 344830: \"The intense romance trilogy\",",
  "    74508: \"Spanish found-footage terror\", 119581: \"Brazil's explosive crime saga\",",
  taglineEntries,
  "  };",
  "",
  "  return rawCollections.filter(Boolean).map(c => ({",
  "    id: c.id,",
  "    name: c.name.replace(' Collection', ''),",
  "    backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),",
  "    poster: c.poster_path,",
  "    movieCount: c.parts?.length || 0,",
  "    tagline: CURATED_TAGLINES[c.id] || ''",
  "  }));",
  "}"
].join('\\n');

collContent = collContent.replace(/export async function getCuratedCollections\(\) \{[\s\S]*?\}\n/, newFunction + '\\n');
fs.writeFileSync(collPath, collContent);
console.log('Updated collectionsData.ts');

// 2. Rewrite app/page.tsx regional map

const pagePath = path.join(__dirname, '../app/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const newMapStr = "  const regionalCollectionMap: Record<string, number[]> = {\\n" +
"    IN: [350309, 44976, 246091, 483464, 142015, 485645, " + inIds.join(', ') + "],\\n" +
"    JP: [210303, 425164, 23616, " + jpIds.join(', ') + "],\\n" +
"    KR: [619537, 619802, " + krIds.join(', ') + "],\\n" +
"    BR: [119581, " + brIds.join(', ') + "],\\n" +
"    ES: [74508, " + esIds.join(', ') + "]\\n" +
"  };";

pageContent = pageContent.replace(/const regionalCollectionMap: Record<string, number\[\]> = \{[\s\S]*?\};\n/, newMapStr + '\\n');
fs.writeFileSync(pagePath, pageContent);
console.log('Updated app/page.tsx');
