const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add the 4 new TV fetches to the top variables list
content = content.replace(
  /    netflixData,\s*\n\s*primeData,\s*\n\s*regionalNetflixData,\s*\n\s*regionalPrimeData,\s*\n\s*regionalTopMovies,/,
  `    netflixData,
    netflixTvData,
    primeData,
    primeTvData,
    regionalNetflixData,
    regionalNetflixTvData,
    regionalPrimeData,
    regionalPrimeTvData,
    regionalTopMovies,`
);

// 2. Add the 4 new TV fetches to Promise.all
content = content.replace(
  /    tmdb\.discover\('movie', \{ with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity\.desc' \}\)\.catch\(\(\) => \(\{ results: \[\] \}\)\),\s*\n\s*tmdb\.discover\('movie', \{ with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity\.desc' \}\)\.catch\(\(\) => \(\{ results: \[\] \}\)\),\s*\n\s*isRegional \? tmdb\.discover\('movie', \{ with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity\.desc' \}\)\.catch\(\(\) => \(\{ results: \[\] \}\)\) : Promise\.resolve\(\{ results: \[\] \}\),\s*\n\s*isRegional \? tmdb\.discover\('movie', \{ with_watch_providers: '9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity\.desc' \}\)\.catch\(\(\) => \(\{ results: \[\] \}\)\) : Promise\.resolve\(\{ results: \[\] \}\),/,
  `    tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    isRegional ? tmdb.discover('movie', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('movie', { with_watch_providers: '9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_watch_providers: '9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),`
);

// 3. Rewrite blendProviderData to handle Movies vs TV and exactly 50% regional, 30% TV
const newBlendFunc = `
  const blendProviderData = (
    globalMovies: any[], 
    globalTv: any[], 
    regionalMovies: any[], 
    regionalTv: any[], 
    total = 20
  ) => {
    // Add media_type just to be safe
    const gM = globalMovies.map(m => ({...m, media_type: 'movie'}));
    const gT = globalTv.map(t => ({...t, media_type: 'tv'}));
    const rM = regionalMovies.map(m => ({...m, media_type: 'movie'}));
    const rT = regionalTv.map(t => ({...t, media_type: 'tv'}));

    const regionalArr = [...rM, ...rT].sort((a, b) => b.popularity - a.popularity);
    const globalArr = [...gM, ...gT].sort((a, b) => b.popularity - a.popularity);

    if (!isRegional || regionalArr.length === 0) {
      // Just blend global movies & tv (assure 30% TV)
      const mix = [...gT.slice(0, 6), ...gM, ...gT.slice(6)];
      return Array.from(new Map(mix.map(item => [item.id, item])).values()).slice(0, total);
    }
    
    const result: any[] = [];
    const usedIds = new Set();
    
    // 1. Force first 3 spots to be regional (Mix of movie and TV if possible)
    let tvCount = 0;
    for (let i = 0; i < 3 && i < regionalArr.length; i++) {
      if (!usedIds.has(regionalArr[i].id)) {
        result.push(regionalArr[i]);
        usedIds.add(regionalArr[i].id);
        if (regionalArr[i].media_type === 'tv') tvCount++;
      }
    }
    
    // 2. We need at least 10 regional total (50% of 20). 
    let remainingRegionalPool = regionalArr.filter(r => !usedIds.has(r.id));
    
    // We also need at least 6 TV total (30% of 20).
    const additionalRegionalNeeded = Math.max(0, 10 - result.length);
    const guaranteedRegional = remainingRegionalPool.splice(0, additionalRegionalNeeded);
    guaranteedRegional.forEach(r => {
      usedIds.add(r.id);
      if (r.media_type === 'tv') tvCount++;
    });
    
    // 3. Filter global pool to ensure no overlap with regional
    let globalPool = globalArr.filter(g => !usedIds.has(g.id));
    
    // 4. Force TV items if we haven't hit 6 yet
    const tvNeeded = Math.max(0, 6 - tvCount);
    const guaranteedTv: any[] = [];
    
    if (tvNeeded > 0) {
       // Pull from remaining regional TV first, then global TV
       const regionalTvLeft = remainingRegionalPool.filter(r => r.media_type === 'tv');
       const globalTvLeft = globalPool.filter(g => g.media_type === 'tv');
       
       for (const tvShow of [...regionalTvLeft, ...globalTvLeft]) {
          if (guaranteedTv.length < tvNeeded && !usedIds.has(tvShow.id)) {
             guaranteedTv.push(tvShow);
             usedIds.add(tvShow.id);
          }
       }
    }
    
    // Update pools after extracting guaranteed TV
    remainingRegionalPool = remainingRegionalPool.filter(r => !usedIds.has(r.id));
    globalPool = globalPool.filter(g => !usedIds.has(g.id));
    
    // 5. Pool all the rest together and shuffle them
    const restPool = [...remainingRegionalPool, ...globalPool];
    for (let i = restPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [restPool[i], restPool[j]] = [restPool[j], restPool[i]];
    }
    
    // 6. Combine and enforce absolute uniqueness
    const remainingToFill = total - result.length;
    const finalMix = [...guaranteedRegional, ...guaranteedTv, ...restPool].slice(0, remainingToFill);
    
    const rawResult = [...result, ...finalMix];
    return Array.from(new Map(rawResult.map(item => [item.id, item])).values()).slice(0, total);
  };

  const blendedNetflix = blendProviderData(
    netflixData.results || [], 
    netflixTvData.results || [], 
    regionalNetflixData.results || [], 
    regionalNetflixTvData.results || []
  );
  
  const blendedPrime = blendProviderData(
    primeData.results || [], 
    primeTvData.results || [], 
    regionalPrimeData.results || [], 
    regionalPrimeTvData.results || []
  );
`;

const regexProvider = /  const blendProviderData = \([\s\S]*?const blendedPrime = blendProviderData\(primeData\.results \|\| \[\], regionalPrimeData\.results \|\| \[\]\);/m;

content = content.replace(regexProvider, newBlendFunc.trim());

fs.writeFileSync(file, content);
console.log('Updated Netflix and Prime to include 50% regional and 30% TV.');
