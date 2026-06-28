const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/actions.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newAction = `export async function getDynamicCollectionsAction(_pageChunk: number) {
  try {
    const { getCuratedCollectionsPool } = await import('@/lib/collectionsData');
    const { tmdb } = await import('@/lib/tmdb');
    const { uniqueIds, CURATED_TAGLINES } = getCuratedCollectionsPool();

    // Chunk the fetches to prevent network exhaustion
    const chunkSize = 20;
    const rawCollections = [];
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      const res = await Promise.all(chunk.map(id => tmdb.getCollection(id.toString()).catch(() => null)));
      rawCollections.push(...res);
    }

    const collections = rawCollections.filter(Boolean).map((c: any) => ({
      id: c.id,
      name: c.name.replace(' Collection', ''),
      backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
      poster: c.poster_path,
      movieCount: c.parts?.length || 0,
      tagline: CURATED_TAGLINES[c.id] || ''
    }));

    // Map to the shape the collections page expects
    const results = collections.map(c => ({
      id: c.id,
      name: c.name,
      backdrop_path: c.backdrop,
      poster_path: c.poster,
      overview: c.tagline,
      parts: Array.from({ length: c.movieCount }), // length hint for UI
    }));

    return {
      page: 1,
      results,
      total_pages: 1, // Static — no infinite scroll needed
    };
  } catch {
    return { page: 1, results: [], total_pages: 1 };
  }
}`;

content = content.replace(/export async function getDynamicCollectionsAction\(_pageChunk: number\) \{[\s\S]*?\}\n\}/, newAction);
fs.writeFileSync(filePath, content);
console.log('Updated actions.ts');
