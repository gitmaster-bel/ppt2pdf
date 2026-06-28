const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Step 1: Add regionalNetflixData and regionalPrimeData to Promise.all
content = content.replace(
  /    netflixData,\s*\n\s*primeData,\s*\n\s*regionalTopMovies,/,
  '    netflixData,\n    primeData,\n    regionalNetflixData,\n    regionalPrimeData,\n    regionalTopMovies,'
);

content = content.replace(
  /    tmdb\.discover\('movie', \{ with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity\.desc' \}\)\.catch\(\(\) => \(\{ results: \[\] \}\)\),\s*\n\s*isRegional \? tmdb\.discover\('movie', \{ with_origin_country: countryCode/,
  `    tmdb.discover('movie', { with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    isRegional ? tmdb.discover('movie', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('movie', { with_watch_providers: '9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('movie', { with_origin_country: countryCode`
);

// Step 2: Add blendProviderData function
const blendProviderCode = `
  const blendProviderData = (globalArr: any[], regionalArr: any[], total = 20) => {
    if (!isRegional || regionalArr.length === 0) return globalArr.slice(0, total);
    
    const result: any[] = [];
    const usedIds = new Set();
    
    // 1. Force first 3 spots to be regional
    for (let i = 0; i < 3 && i < regionalArr.length; i++) {
      result.push(regionalArr[i]);
      usedIds.add(regionalArr[i].id);
    }
    
    // 2. We need at least 8 regional total (40% of 20). 
    // We already have up to 3. Let's get the remaining regional items we need.
    const remainingRegionalPool = regionalArr.filter(r => !usedIds.has(r.id));
    const globalPool = globalArr.filter(g => !usedIds.has(g.id));
    
    const additionalRegionalNeeded = Math.max(0, 8 - result.length);
    const guaranteedRegional = remainingRegionalPool.splice(0, additionalRegionalNeeded);
    
    // 3. Pool all the rest together and shuffle them
    const restPool = [...remainingRegionalPool, ...globalPool];
    for (let i = restPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [restPool[i], restPool[j]] = [restPool[j], restPool[i]];
    }
    
    // 4. Combine the guaranteed additional regional and the shuffled rest
    const remainingToFill = total - result.length;
    const finalMix = [...guaranteedRegional, ...restPool].slice(0, remainingToFill);
    
    return [...result, ...finalMix];
  };

  const blendedNetflix = blendProviderData(netflixData.results || [], regionalNetflixData.results || []);
  const blendedPrime = blendProviderData(primeData.results || [], regionalPrimeData.results || []);
`;

content = content.replace(
  /  const blendedTopMovies = blend5050\(topMovies\.results \|\| \[\], regionalTopMovies\.results \|\| \[\], 20\);/,
  blendProviderCode + '\n  const blendedTopMovies = blend5050(topMovies.results || [], regionalTopMovies.results || [], 20);'
);

// Step 3: Use blendedNetflix and blendedPrime in the JSX
content = content.replace(
  /items=\{\(netflixData\.results \|\| \[\]\) as Media\[\]\}/,
  'items={blendedNetflix as Media[]}'
);

content = content.replace(
  /items=\{\(primeData\.results \|\| \[\]\) as Media\[\]\}/,
  'items={blendedPrime as Media[]}'
);

fs.writeFileSync(file, content);
console.log('Successfully updated provider blending logic in page.tsx');
