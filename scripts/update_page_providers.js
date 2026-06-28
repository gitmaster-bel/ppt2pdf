const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const rewriteScript = `
    const [
      popMovies,
      popTv,
      topMovies,
      topTv,
      popAnime,
      classicMovies,
      classicTv,
      underratedMovies,
      underratedTv,
      regionalTopMovies,
      regionalTopTv,
      // Global Netflix
      netMov1, netMov2, netTv1, netTv2,
      // Global Prime
      priMov1, priMov2, priTv1, priTv2,
      // Regional Netflix
      rNetMov, rNetTv,
      // Regional Prime
      rPriMov, rPriTv,
      // Specific TV Injection
      tvInjectionRaw
    ] = await Promise.all([
      tmdb.getPopular('movie'),
      tmdb.getPopular('tv'),
      tmdb.getTopRated('movie'),
      tmdb.getTopRated('tv'),
      tmdb.getAnime('1').catch(() => ({ results: [] })),
      tmdb.discover('movie', { 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '2014-12-31', 'vote_count.gte': '3000', sort_by: 'vote_average.desc' }).catch(() => ({ results: [] })),
      tmdb.discover('tv', { 'first_air_date.gte': '1990-01-01', 'first_air_date.lte': '2014-12-31', 'vote_count.gte': '1500', sort_by: 'vote_average.desc' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { 'vote_average.gte': '7.2', 'vote_count.gte': '300', 'vote_count.lte': '2500', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
      tmdb.discover('tv', { 'vote_average.gte': '7.5', 'vote_count.gte': '200', 'vote_count.lte': '2000', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
      isRegional ? tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '100' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      isRegional ? tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '50' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      
      // Global Netflix (Strict US Origin, Pages 1 & 2)
      tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      tmdb.discover('tv', { with_watch_providers: '8', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('tv', { with_watch_providers: '8', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      
      // Global Prime (Strict US Origin, Pages 1 & 2)
      tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: 'US', with_origin_country: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),

      // Regional Netflix
      isRegional ? tmdb.discover('movie', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      isRegional ? tmdb.discover('tv', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      
      // Regional Prime
      isRegional ? tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      isRegional ? tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      
      // Target injection
      countryCode === 'IN' ? tmdb.getDetails('tv', '262838').catch(() => null) : Promise.resolve(null)
    ]);

    // Reconstruct the grouped arrays for blendProviderData
    const netflixData = { results: [...(netMov1.results||[]), ...(netMov2.results||[])] };
    const netflixTvData = { results: [...(netTv1.results||[]), ...(netTv2.results||[])] };
    const primeData = { results: [...(priMov1.results||[]), ...(priMov2.results||[])] };
    const primeTvData = { results: [...(priTv1.results||[]), ...(priTv2.results||[])] };
    
    const regionalNetflixData = rNetMov;
    const regionalNetflixTvData = rNetTv;
    const regionalPrimeData = rPriMov;
    const regionalPrimeTvData = rPriTv;

    // Inject target TV show into regionalTrending if IN
    if (countryCode === 'IN' && tvInjectionRaw) {
       const tvObj = { ...tvInjectionRaw, media_type: 'tv' };
       if (regionalTrending && regionalTrending.results) {
         // check if it's already in there
         if (!regionalTrending.results.some((r: any) => r.id === tvObj.id)) {
           const maxIdx = Math.min(5, regionalTrending.results.length);
           const randomIdx = Math.floor(Math.random() * maxIdx);
           regionalTrending.results.splice(randomIdx, 0, tvObj);
         }
       }
    }
`;

const regexPromiseAll = /    const \[\s*popMovies,[\s\S]*?\] = await Promise\.all\(\[[\s\S]*?isRegional \? tmdb\.discover\('tv', \{ with_origin_country: countryCode, sort_by: 'vote_average\.desc', 'vote_count\.gte': '50' \}\)\.catch\(\(\) => \(\{ results: \[\] \}\)\) : Promise\.resolve\(\{ results: \[\] \}\),\s*\]\);/m;

content = content.replace(regexPromiseAll, rewriteScript.trim());

fs.writeFileSync(file, content);
console.log('Replaced Promise.all block with strict massive fetch and TV injection.');
