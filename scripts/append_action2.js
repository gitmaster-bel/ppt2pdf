const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '../app/actions.ts');
const code = `
export async function getHistorySimilarsAction(historyItems: { id: string; type: 'movie' | 'tv'; lang?: string; progress?: number }[]) {
  try {
    // Only process items where progress < 50%
    const validItems = historyItems.filter(item => (item.progress || 0) < 50).slice(0, 10);
    if (validItems.length === 0) return { results: [] };

    const promises = validItems.map(item => fetchTMDB<TMDBResponse<Media>>(\`/\${item.type}/\${item.id}/similar\`, { page: '1' }).catch(() => null));
    const resultsArrays = await Promise.all(promises);

    const picks = [];
    resultsArrays.forEach((res, index) => {
      if (!res || !res.results) return;
      const sourceItem = validItems[index];
      
      // Try to find highest rated in the same language
      let candidates = res.results;
      if (sourceItem.lang) {
        const sameLang = candidates.filter(c => c.original_language === sourceItem.lang);
        if (sameLang.length > 0) candidates = sameLang;
      }
      
      // Sort by vote average to get highest rated
      candidates.sort((a, b) => b.vote_average - a.vote_average);
      
      if (candidates.length > 0) {
        picks.push({ ...candidates[0], media_type: sourceItem.type });
      }
    });

    return { results: picks };
  } catch (e) {
    console.error('History similars fetch failed:', e);
    return { results: [] };
  }
}
`;
fs.appendFileSync(filepath, code);
console.log('Appended getHistorySimilarsAction');
