const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../app/actions.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function getHistorySimilarsAction\([\s\S]*?\}\n\}/;
const newFunc = `export async function getHistorySimilarsAction(historyData: { id: string, type: 'movie'|'tv', progress: number }[]) {
  try {
    const { tmdb } = await import('@/lib/tmdb');
    // 1. Filter out items watched > 50%
    const validHistory = historyData.filter(h => h.progress < 0.5).slice(0, 5); // Limit to top 5 recent valid ones
    
    const allSimilar = [];
    
    // 2. Fetch details AND similars for each
    await Promise.all(validHistory.map(async (seed) => {
      try {
        // We need the original language of the seed to match
        const details = await tmdb.getDetails(seed.type, seed.id);
        const originalLang = details?.original_language;
        
        const similarsRes = await tmdb.getSimilar(seed.type, seed.id);
        if (similarsRes && similarsRes.results && similarsRes.results.length > 0) {
          // Filter similars by same language
          let matching = similarsRes.results;
          if (originalLang) {
             matching = matching.filter(m => m.original_language === originalLang);
          }
          
          if (matching.length > 0) {
            // Sort by vote average or popularity
            matching.sort((a, b) => b.vote_average - a.vote_average);
            // Pick ONLY ONE top rated
            allSimilar.push(matching[0]);
          }
        }
      } catch (e) {
        // ignore individual failures
      }
    }));
    
    // Deduplicate
    const unique = Array.from(new Map(allSimilar.map(item => [item.id, item])).values());
    
    // Final sort
    unique.sort((a, b) => b.popularity - a.popularity);
    
    return unique;
  } catch (e) {
    return [];
  }
}`;

content = content.replace(regex, newFunc);
fs.writeFileSync(file, content);
console.log('Updated getHistorySimilarsAction');
