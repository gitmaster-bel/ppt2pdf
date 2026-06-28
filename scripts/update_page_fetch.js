const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Update import
pageContent = pageContent.replace(/import \{ getCuratedCollections \} from '@\/lib\/collectionsData';/, "import { getCuratedCollectionsPool } from '@/lib/collectionsData';\nimport { tmdb } from '@/lib/tmdb';");

// Replace the collections processing block
const searchBlockRegex = /  let collectionsData = await getCuratedCollections\(\);\s*\/\*[\s\S]*?collectionsData = finalCollections;/;

// If we can't find it exactly with regex, we can just replace a chunk of lines manually, but let's try a robust replace based on markers.
const blockStart = "  let collectionsData = await getCuratedCollections();";
const blockEnd = "  collectionsData = finalCollections;";

if (pageContent.includes(blockStart) && pageContent.includes(blockEnd)) {
  const before = pageContent.substring(0, pageContent.indexOf(blockStart));
  const after = pageContent.substring(pageContent.indexOf(blockEnd) + blockEnd.length);

  const newBlock = `  const { uniqueIds: allIds, CURATED_TAGLINES: taglines } = getCuratedCollectionsPool();

  const regionalCollectionMap: Record<string, number[]> = {
    IN: [350309, 44976, 246091, 483464, 142015, 485645, 256433, 44722, 921781, 977824, 506940, 259256, 1029834, 142022, 657153, 1213248, 489399, 557748, 282971, 605068, 20970, 343944, 244500, 1397777, 341455, 505479, 17929, 476740, 669960, 673213, 413369, 480243],
    JP: [210303, 425164, 23616, 39199, 148065, 117354, 247028, 263101, 143302, 374509, 374511, 96850, 386410],
    KR: [619537, 619802, 531566, 619533, 660359, 1517098, 736824, 707622, 535790, 620873, 1185967, 421904],
    BR: [119581, 455278, 342577, 743415, 369380, 429234, 620873, 386410, 263101, 148065, 39199],
    ES: [74508, 388180, 2248, 624920, 492969, 669836, 9649, 778680, 86027, 117354]
  };
  const currentCountry = countryCode.toUpperCase();
  const regionalIds = regionalCollectionMap[currentCountry] || [];

  let regionalColls = allIds.filter(id => regionalIds.includes(id));
  let globalColls = allIds.filter(id => !regionalIds.includes(id));

  const shuffle = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  regionalColls = shuffle(regionalColls);
  globalColls = shuffle(globalColls);

  const finalIds = [
    ...regionalColls.slice(0, 4),
    ...globalColls.slice(0, 15 - Math.min(regionalColls.length, 4))
  ];

  const rawCollections = await Promise.all(finalIds.map(id => tmdb.getCollection(id.toString()).catch(() => null)));
  
  const collectionsData = rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''),
    backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: taglines[c.id] || ''
  }));`;

  pageContent = before + newBlock + after;
  fs.writeFileSync(pagePath, pageContent);
  console.log('Updated app/page.tsx');
} else {
  console.log('Could not find block');
}
