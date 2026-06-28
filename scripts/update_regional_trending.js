const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/actions.ts');
let content = fs.readFileSync(file, 'utf8');

const rewriteAction = `
export async function getRegionalTrendingAction(countryCode: string) {
  try {
    const { tmdb } = await import('@/lib/tmdb');
    const [movie1, movie2, tv1, tv2] = await Promise.all([
      tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '1' }).catch(() => null),
      tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '2' }).catch(() => null),
      tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '1' }).catch(() => null),
      tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '2' }).catch(() => null)
    ]);

    const movies = [...(movie1?.results || []), ...(movie2?.results || [])].slice(0, 20);
    const shows = [...(tv1?.results || []), ...(tv2?.results || [])].slice(0, 20);
    
    const combined = [];
    const maxLen = Math.max(movies.length, shows.length);
    for (let i = 0; i < maxLen; i++) {
      if (movies[i]) combined.push({ ...movies[i], media_type: 'movie' });
      if (shows[i]) combined.push({ ...shows[i], media_type: 'tv' });
    }
    return { results: combined };
  } catch (e) {
    return { results: [] };
  }
}
`;

const regexAction = /export async function getRegionalTrendingAction\(countryCode: string\) \{[\s\S]*?return \{ results: \[\] \};\n  \}\n\}/m;

content = content.replace(regexAction, rewriteAction.trim());

fs.writeFileSync(file, content);
console.log('Rewrote getRegionalTrendingAction to fetch double pages (40 items total).');
