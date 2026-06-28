const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '../app/actions.ts');
const code = `
export async function getRegionalTrendingAction(countryCode: string) {
  try {
    const movieRes = await tmdb.discover('movie', {
      with_origin_country: countryCode,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10', // Filter out completely unknown junk
    }).catch(() => null);

    const tvRes = await tmdb.discover('tv', {
      with_origin_country: countryCode,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10',
    }).catch(() => null);

    const movies = movieRes?.results?.slice(0, 10) || [];
    const shows = tvRes?.results?.slice(0, 10) || [];
    
    // Interleave them for a balanced mix
    const combined = [];
    const maxLen = Math.max(movies.length, shows.length);
    for (let i = 0; i < maxLen; i++) {
      if (movies[i]) combined.push({ ...movies[i], media_type: 'movie' });
      if (shows[i]) combined.push({ ...shows[i], media_type: 'tv' });
    }

    // Filter duplicates
    const seen = new Set();
    const unique = combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return { results: unique };
  } catch (e) {
    console.error('Regional fetch failed:', e);
    return { results: [] };
  }
}
`;
fs.appendFileSync(filepath, code);
console.log('Appended action');
