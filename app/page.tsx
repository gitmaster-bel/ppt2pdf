import { Suspense } from 'react';
import { ThemedLoader } from '@/components/ui/ThemedLoader';
import { PROVIDERS } from '@/lib/providers';
import nextDynamic from 'next/dynamic';
import { tmdb, getHeroItemsWithLogos } from '@/lib/tmdb';
import { getCuratedCollectionsPool } from '@/lib/collectionsData';
import { HeroSlider } from '@/components/media/HeroSlider';
import { ContinueWatching } from '@/components/media/ContinueWatching';
import { RecommendedForYou } from '@/components/media/RecommendedForYou';
import { getRegionalTrendingAction } from '@/app/actions';
import { cookies, headers } from 'next/headers';
import { Media } from '@/types/tmdb';

const CollectionsRow = nextDynamic(() => import('@/components/media/CollectionsRow').then(mod => mod.CollectionsRow));
const TimeBasedWidget = nextDynamic(() => import('@/components/home/TimeBasedWidget').then(mod => mod.TimeBasedWidget));
import { ProvidersGrid } from '@/components/providers/ProvidersGrid';
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row));
const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));
const ProviderHeroShelf = nextDynamic(() => import('@/components/providers/ProviderHeroShelf').then(mod => mod.ProviderHeroShelf));
const RegionalContent = nextDynamic(() => import('@/components/media/RegionalContent').then(mod => mod.RegionalContent));

// Map of highly localized regions for blending
const REGIONAL_MARKETS = new Set(['IN', 'PK', 'JP', 'KR', 'BR', 'ES', 'FR', 'DE', 'IT', 'MX', 'PH', 'TH', 'ID', 'NG', 'TR']);

async function DeferredRows({ countryCode, isRegional, regionalTrending, excludeIds, trendingResults }: any) {
  // Parallel fetch for global data and (if applicable) regional data
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
    netflixDataPage1,
    netflixDataPage2,
    netflixTvDataPage1,
    netflixTvDataPage2,
    primeDataPage1,
    primeDataPage2,
    primeTvDataPage1,
    primeTvDataPage2,
    regionalNetflixData,
    regionalNetflixTvData,
    regionalPrimeData,
    regionalPrimeTvData,
    regionalTopMovies,
    regionalTopTv
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
    tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
    isRegional ? tmdb.discover('movie', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_watch_providers: '8', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: countryCode, with_origin_country: countryCode, sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '100' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '50' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
  ]);

  const netflixData = { results: [...(netflixDataPage1?.results || []), ...(netflixDataPage2?.results || [])] };
  const netflixTvData = { results: [...(netflixTvDataPage1?.results || []), ...(netflixTvDataPage2?.results || [])] };
  const primeData = { results: [...(primeDataPage1?.results || []), ...(primeDataPage2?.results || [])] };
  const primeTvData = { results: [...(primeTvDataPage1?.results || []), ...(primeTvDataPage2?.results || [])] };

  const blend5050 = (globalArr: any[], regionalArr: any[], total = 20) => {
    if (!isRegional || regionalArr.length === 0) return Array.from(new Map(globalArr.map(item => [item.id, item])).values()).slice(0, total);
    const result: any[] = [];
    let g = 0, r = 0;
    while (result.length < total && (g < globalArr.length || r < regionalArr.length)) {
      if (r < regionalArr.length) {
        if (!result.some(i => i.id === regionalArr[r].id)) result.push(regionalArr[r]);
        r++;
      }
      if (g < globalArr.length && result.length < total) {
        if (!result.some(i => i.id === globalArr[g].id)) result.push(globalArr[g]);
        g++;
      }
    }
    return Array.from(new Map(result.map(item => [item.id, item])).values()).slice(0, total);
  };


const blendProviderData = (
    globalMovies: any[], 
    globalTv: any[], 
    regionalMovies: any[], 
    regionalTv: any[], 
    total = 20
  ) => {
    // Add media_type
    const gM = (globalMovies || []).map(m => ({...m, media_type: 'movie'}));
    const gT = (globalTv || []).map(t => ({...t, media_type: 'tv'}));
    const rM = (regionalMovies || []).map(m => ({...m, media_type: 'movie'}));
    const rT = (regionalTv || []).map(t => ({...t, media_type: 'tv'}));

    const regionalLangs: Record<string, string[]> = {
      'IN': ['hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'ur', 'or', 'as'],
      'PK': ['ur', 'pa', 'sd', 'ps'],
      'JP': ['ja'],
      'KR': ['ko'],
      'BR': ['pt'],
      'ES': ['es'],
      'FR': ['fr'],
      'DE': ['de'],
      'IT': ['it'],
      'MX': ['es'],
      'PH': ['tl', 'fil'],
      'TH': ['th'],
      'ID': ['id'],
      'TR': ['tr']
    };
    const curCode = countryCode.toUpperCase();
    const rLangs = regionalLangs[curCode] || [];

    // Filter global to strictly EXCLUDE regional origin or regional languages
    const isGlobalStrict = (item: any) => {
      const originCountries = item.origin_country || [];
      if (originCountries.includes(curCode)) return false;
      if (rLangs.includes(item.original_language)) return false;
      return true;
    };

    const cleanGlobalMovies = gM.filter(isGlobalStrict);
    const cleanGlobalTv = gT.filter(isGlobalStrict);

    if (!isRegional || (rM.length === 0 && rT.length === 0)) {
      // Just blend global movies & tv (assure 30% TV)
      const pickedTv = cleanGlobalTv.slice(0, 6);
      const pickedMovies = cleanGlobalMovies.slice(0, total - pickedTv.length);
      const mix = [...pickedTv, ...pickedMovies];
      return Array.from(new Map(mix.map(item => [item.id, item])).values()).slice(0, total);
    }

    // Helper to shuffle
    const getDailyRandom = () => {
      const d = new Date();
      let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };
    const rng = getDailyRandom();
    
    const shuffle = (array: any[]) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };


    // --- REGIONAL SELECTION (Exactly 10, At least 3 TV) ---
    const shuffledRM = shuffle(rM);
    const shuffledRT = shuffle(rT);
    const pickedRegional: any[] = [];

    // Force exactly 3 regional TV shows first (or as many as available up to 3)
    const regionalTvLimit = Math.min(3, shuffledRT.length);
    for (let i = 0; i < regionalTvLimit; i++) {
      pickedRegional.push(shuffledRT[i]);
    }

    // Fill the rest of the 10 spots with regional movies and remaining regional TV shows
    const remainingRegionalPool = shuffle([
      ...shuffledRM,
      ...shuffledRT.slice(regionalTvLimit)
    ]);
    for (let i = 0; pickedRegional.length < 10 && i < remainingRegionalPool.length; i++) {
      pickedRegional.push(remainingRegionalPool[i]);
    }

    // --- GLOBAL SELECTION (Exactly 10, At least 3 TV) ---
    const shuffledGM = shuffle(cleanGlobalMovies);
    const shuffledGT = shuffle(cleanGlobalTv);
    const pickedGlobal: any[] = [];

    // Force exactly 3 global TV shows first (or as many as available up to 3)
    const globalTvLimit = Math.min(3, shuffledGT.length);
    for (let i = 0; i < globalTvLimit; i++) {
      pickedGlobal.push(shuffledGT[i]);
    }

    // Fill the rest of the 10 spots with global movies and remaining global TV shows
    const remainingGlobalPool = shuffle([
      ...shuffledGM,
      ...shuffledGT.slice(globalTvLimit)
    ]);
    for (let i = 0; pickedGlobal.length < 10 && i < remainingGlobalPool.length; i++) {
      pickedGlobal.push(remainingGlobalPool[i]);
    }

    // Deduplicate pools just in case
    const uniqueRegional = Array.from(new Map(pickedRegional.map(item => [item.id, item])).values());
    const uniqueGlobal = Array.from(new Map(pickedGlobal.map(item => [item.id, item])).values());

    // --- ARRANGEMENT ---
    // Any 3 random regional titles from that 10 regional titles be showed in first 3 of row
    const shuffledUniqueRegional = shuffle(uniqueRegional);
    const firstThree = shuffledUniqueRegional.slice(0, 3);
    const remainingRegionalItems = shuffledUniqueRegional.slice(3);

    // Remaining 17 spots: mix of other 7 regional + 10 global
    const finalRest = shuffle([...remainingRegionalItems, ...uniqueGlobal]);

    const finalMix = [...firstThree, ...finalRest];
    return Array.from(new Map(finalMix.map(item => [item.id, item])).values()).slice(0, total);
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

  const blendedTopMovies = blend5050(topMovies.results || [], regionalTopMovies.results || [], 20);
  const blendedTopTv = blend5050(topTv.results || [], regionalTopTv.results || [], 20);

  const widgetPool = [
    ...(classicMovies.results || []), 
    ...(classicTv.results || []), 
    ...(underratedMovies.results || []), 
    ...(underratedTv.results || []),
    ...blendedTopMovies,
    ...blendedTopTv
  ];

  const { uniqueIds: allIds, CURATED_TAGLINES: taglines } = getCuratedCollectionsPool();

  const regionalCollectionMap: Record<string, number[]> = {
    IN: [350309, 44976, 246091, 483464, 142015, 485645, 256433, 44722, 921781, 977824, 506940, 259256, 1029834, 142022, 657153, 1213248, 489399, 557748, 282971, 605068, 20970, 343944, 244500, 1397777, 341455, 505479, 1639816, 476740],
    JP: [210303, 425164, 23616, 39199, 148065, 117354, 247028, 263101, 143302, 374509, 374511, 96850, 386410],
    KR: [619537, 619802, 531566, 619533, 660359, 1517098, 736824, 707622, 535790, 620873, 1185967, 421904],
    BR: [119581, 455278, 342577, 743415, 369380, 429234, 620873, 386410, 263101, 148065, 39199],
    ES: [74508, 388180, 2248, 624920, 492969, 669836, 9649, 778680, 86027, 117354]
  };
  const currentCountry = countryCode.toUpperCase();
  const regionalIds = regionalCollectionMap[currentCountry] || [];

  let regionalColls = allIds.filter(id => regionalIds.includes(id));
  let globalColls = allIds.filter(id => !regionalIds.includes(id));

  const getDailyRandom = () => {
    const d = new Date();
    let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };
  const rng = getDailyRandom();

  const shuffle = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  regionalColls = shuffle(regionalColls);
  globalColls = shuffle(globalColls);

  const finalIds = [
    ...regionalColls.slice(0, 4),
    ...globalColls.slice(0, 15 - Math.min(regionalColls.length, 4))
  ];

  // Chunking the fetches to prevent abort errors if >15 or slow
  const chunkSize = 5;
  const rawCollections = [];
  for (let i = 0; i < finalIds.length; i += chunkSize) {
    const chunk = finalIds.slice(i, i + chunkSize);
    const res = await Promise.all(chunk.map(id => tmdb.getCollection(id.toString()).catch(() => null)));
    rawCollections.push(...res);
  }
  
  const collectionsData = rawCollections.filter(Boolean).map(c => ({
    id: c.id,
    name: c.name.replace(' Collection', ''),
    backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
    poster: c.poster_path,
    movieCount: c.parts?.length || 0,
    tagline: taglines[c.id] || ''
  }));

  return (
    <>
      <div className="md:hidden block mt-4 z-20 relative">
        <TimeBasedWidget items={widgetPool} variant="mobile" />
      </div>
      <div className="flex flex-col relative z-20 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-16 md:mt-4 gap-6 md:gap-10">
        <div className="mt-2">
          <ProvidersGrid />
        </div>
        
        <RegionalContent />
        

        
        {collectionsData.length > 0 && <CollectionsRow collections={collectionsData} />}
        
        <RecommendedForYou mediaType="all" excludeIds={excludeIds} />

        <div className="hidden md:block">
          <Top10Row title="Top 10 Today" items={trendingResults.slice(0, 10) as Media[]} />
        </div>
        
        <HorizontalRow title="Global Trending" subtitle="What the world is watching today" items={trendingResults.slice(10) as Media[]} seeAllHref="/trending/all" />
        
        <div className="hidden md:block">
          <TimeBasedWidget items={widgetPool} variant="desktop" />
        </div>
        
        <ProviderHeroShelf 
          title="Top on Netflix"
          provider={PROVIDERS.find(p => p.id === 8)!}
          items={blendedNetflix as Media[]}
        />
        
        <ProviderHeroShelf 
          title="Prime Video Exclusives"
          provider={PROVIDERS.find(p => p.id === 9)!}
          items={blendedPrime as Media[]}
        />

        {(popAnime.results && popAnime.results.length > 0) && (
          <HorizontalRow title="Trending Anime" subtitle="Top animated series right now" items={popAnime.results || []} seeAllHref="/anime/trending" />
        )}
        
        <HorizontalRow title="Critically Acclaimed Movies" subtitle="Highest rated of all time" items={blendedTopMovies as Media[]} seeAllHref="/movies/top-rated" />
        <HorizontalRow title="Top Rated Series" subtitle="Must-watch television" items={blendedTopTv as Media[]} seeAllHref="/tv/top-rated" />
        <HorizontalRow title="Modern Classics" subtitle="Iconic movies (1980-2014)" items={classicMovies.results || []} />
        <HorizontalRow title="Underrated Gems" subtitle="High ratings, fewer votes" items={underratedMovies.results || []} />
      </div>
    </>
  );
}

async function HomeDataFetcher() {
  const cookieStore = await cookies();
  let countryCode = cookieStore.get('user_country')?.value;
  if (!countryCode) {
    const headersList = await headers();
    countryCode = headersList.get('x-vercel-ip-country') || 'US';
  }
  const isRegional = REGIONAL_MARKETS.has(countryCode.toUpperCase());

  // ONLY FETCH HERO DATA HERE to make page load instantly
  const [
    trendingPage1,
    trendingPage2,
    regionalTrendingRes
  ] = await Promise.all([
    tmdb.getTrending('all', 1),
    tmdb.getTrending('all', 2),
    isRegional ? getRegionalTrendingAction(countryCode) : Promise.resolve({ results: [] })
  ]);
  
  const regionalTrending = regionalTrendingRes || { results: [] };
  const rawTrendingResults = [...(trendingPage1.results || []), ...(trendingPage2.results || [])];
  const trendingResults = Array.from(new Map(rawTrendingResults.map((item: any) => [item.id, item])).values());
  const trendingMovies = trendingResults.filter((item: any) => item.media_type === 'movie');
  const trendingTvs = trendingResults.filter((item: any) => item.media_type === 'tv');

  const excludeIds = [
    ...(regionalTrending.results ? regionalTrending.results.map((item: any) => item.id) : []),
    ...(trendingResults.slice(0, 10).map((item: any) => item.id))
  ];
  
  const mixedHeroItems: any[] = [];
  let hGIdx = 0, hRIdx = 0;
  const regHero = regionalTrending.results?.slice(0, 5) || [];
  const globHero = [...trendingMovies, ...trendingTvs];

  while (mixedHeroItems.length < 6) {
    if (isRegional && hRIdx < regHero.length) {
      mixedHeroItems.push(regHero[hRIdx++]);
    }
    if (hGIdx < globHero.length && mixedHeroItems.length < 6) {
      if (!mixedHeroItems.some(i => i.id === globHero[hGIdx].id)) {
        mixedHeroItems.push(globHero[hGIdx]);
      }
      hGIdx++;
    }
    if ((!isRegional || hRIdx >= regHero.length) && hGIdx >= globHero.length) break;
  }
  
  const heroItemsWithLogos = await getHeroItemsWithLogos(mixedHeroItems);

  return (
    <div className="flex flex-col min-h-screen -mt-[72px]">
      <HeroSlider items={heroItemsWithLogos} />
      
      <div className="relative z-20 md:mt-4">
        <ContinueWatching />
      </div>
      
      <Suspense fallback={<div className="h-96 w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
        <DeferredRows 
          countryCode={countryCode} 
          isRegional={isRegional} 
          regionalTrending={regionalTrending} 
          excludeIds={excludeIds} 
          trendingResults={trendingResults} 
        />
      </Suspense>
    </div>
  );
}

export default function Home() {
  return (
    <main className="w-full bg-void-950 min-h-screen overflow-x-hidden">
      <Suspense fallback={<div className="min-h-screen"><ThemedLoader /></div>}>
        <HomeDataFetcher />
      </Suspense>
    </main>
  );
}
