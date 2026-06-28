const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '../lib/collectionsData.ts');
let content = fs.readFileSync(filepath, 'utf8');

// I need to replace the getCuratedCollections function.
const newFunction = `export async function getCuratedCollections() {
  // A massive pool of global and regional collections
  const collectionIds = [
    // Global Blockbusters & Classics
    263, 119, 230, 131292, 1241, 84, 10, 404609, 87359, 645, 2344, 328, 10194, 173710, 9485,
    8650, 295, 531330, 131635, 163459, 344830,
    
    // Regional (India)
    350309, 44976, 246091, 483464, 142015, 485645,
    
    // Regional (Japan / Anime)
    210303, 425164, 23616,
    
    // Regional (Korea)
    619537, 619802,
    
    // Regional (Spain / Brazil / etc)
    74508, 119581
  ];
  const rawCollections = await Promise.all(collectionIds.map(id => tmdb.getCollection(id.toString()).catch(() => null)));
  
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
    531330: "The titans clash", 163459: "The legendary vampire romance", 344830: "The intense romance trilogy",
    74508: "Spanish found-footage terror", 119581: "Brazil's explosive crime saga"
  };

  return rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''),
    backdrop: c.backdrop_path,
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: CURATED_TAGLINES[c.id] || ''
  }));
}`;

content = content.replace(/export async function getCuratedCollections\(\) \{[\s\S]*?\}\n/, newFunction + '\n');
fs.writeFileSync(filepath, content);
console.log('Updated collectionsData.ts');
