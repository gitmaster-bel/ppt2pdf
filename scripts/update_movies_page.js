const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/movies/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

pageContent = pageContent.replace(/import \{ getCuratedCollections \} from '@\/lib\/collectionsData';/, "import { getCuratedCollectionsPool } from '@/lib/collectionsData';");

const oldCode = "  const collectionsData = await getCuratedCollections();";
const newCode = `  const { uniqueIds, CURATED_TAGLINES } = getCuratedCollectionsPool();
  // Fisher-Yates shuffle
  const shuffledIds = [...uniqueIds];
  for (let i = shuffledIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
  }
  const randomIds = shuffledIds.slice(0, 15);
  const rawCollections = await Promise.all(randomIds.map(id => tmdb.getCollection(id.toString()).catch(() => null)));
  const collectionsData = rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''),
    backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: CURATED_TAGLINES[c.id] || ''
  }));`;

pageContent = pageContent.replace(oldCode, newCode);
fs.writeFileSync(pagePath, pageContent);
console.log('Updated app/movies/page.tsx');
