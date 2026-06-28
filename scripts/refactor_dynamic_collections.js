const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../app/actions.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function getDynamicCollectionsAction\(_pageChunk: number\) \{[\s\S]*?total_pages: 1, \/\/ Static — no infinite scroll needed\n    \};\n  \} catch \{\n    return \{ page: 1, results: \[\], total_pages: 1 \};\n  \}\n\}/m;

const newImplementation = `export async function getDynamicCollectionsAction(pageChunk: number) {
  try {
    const { getCuratedCollectionsPool } = await import('@/lib/collectionsData');
    const { tmdb } = await import('@/lib/tmdb');
    const { uniqueIds, CURATED_TAGLINES } = getCuratedCollectionsPool();

    const PAGE_SIZE = 20;
    const startIndex = (pageChunk - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    
    // Only fetch the slice for the current page
    const chunk = uniqueIds.slice(startIndex, endIndex);
    
    if (chunk.length === 0) {
      return { page: pageChunk, results: [], total_pages: Math.ceil(uniqueIds.length / PAGE_SIZE) };
    }

    const rawCollections = await Promise.all(
      chunk.map(id => tmdb.getCollection(id.toString()).catch(() => null))
    );

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
      page: pageChunk,
      results,
      total_pages: Math.ceil(uniqueIds.length / PAGE_SIZE),
    };
  } catch {
    return { page: pageChunk, results: [], total_pages: 1 };
  }
}`;

content = content.replace(regex, newImplementation);
fs.writeFileSync(file, content);
console.log('Fixed getDynamicCollectionsAction in app/actions.ts');
