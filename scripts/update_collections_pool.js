const fs = require('fs');
const path = require('path');

const collPath = path.join(__dirname, '../lib/collectionsData.ts');
let collContent = fs.readFileSync(collPath, 'utf8');

// Change function name and remove async
collContent = collContent.replace(/export async function getCuratedCollections\(\) \{/, 'export function getCuratedCollectionsPool() {');

// Remove the `rawCollections` fetch line
collContent = collContent.replace(/  const rawCollections = await Promise\.all\(uniqueIds\.map\(id => tmdb\.getCollection\(id\.toString\(\)\)\.catch\(\(\) => null\)\)\);\n/g, '');

// Replace the return statement
const oldReturn = `  return rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''),
    backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: CURATED_TAGLINES[c.id] || ''
  }));`;
const newReturn = `  return { uniqueIds, CURATED_TAGLINES };`;
collContent = collContent.replace(oldReturn, newReturn);

fs.writeFileSync(collPath, collContent);
console.log('Updated collectionsData.ts');
