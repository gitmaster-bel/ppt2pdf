const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../app/actions.ts');
let content = fs.readFileSync(file, 'utf8');

const missingFuncs = `
export async function getRegionalTrendingAction(countryCode: string) {
  try {
    const { tmdb } = await import('@/lib/tmdb');
    const movieRes = await tmdb.discover('movie', {
      with_origin_country: countryCode,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10',
    }).catch(() => null);

    const tvRes = await tmdb.discover('tv', {
      with_origin_country: countryCode,
      sort_by: 'popularity.desc',
      'vote_count.gte': '10',
    }).catch(() => null);

    const movies = movieRes?.results?.slice(0, 10) || [];
    const shows = tvRes?.results?.slice(0, 10) || [];
    
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

export async function getHistorySimilarsAction(tmdbIds: string[]) {
  try {
    const { tmdb } = await import('@/lib/tmdb');
    const limitedIds = tmdbIds.slice(0, 3);
    const promises = limitedIds.map(id => tmdb.getSimilar('movie', id).catch(() => null));
    const results = await Promise.all(promises);
    
    const allSimilar = [];
    for (const res of results) {
      if (res && res.results) {
        allSimilar.push(...res.results);
      }
    }
    
    const unique = Array.from(new Map(allSimilar.map(item => [item.id, item])).values());
    unique.sort((a, b) => b.popularity - a.popularity);
    
    return unique.slice(0, 20);
  } catch (e) {
    return [];
  }
}
`;

content += '\n' + missingFuncs;
fs.writeFileSync(file, content);
console.log('Appended missing functions to app/actions.ts');
