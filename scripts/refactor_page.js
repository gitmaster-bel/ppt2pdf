const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../app/page.tsx');
let content = fs.readFileSync(file, 'utf8');

const regexHomeDataFetcher = /async function HomeDataFetcher\(\) \{[\s\S]*?export default function Home\(\) \{/m;

const newImplementation = `async function DeferredRows({ countryCode, isRegional, regionalTrending, excludeIds, trendingResults }: any) {
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
    netflixData,
    primeData,
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
    tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    isRegional ? tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '100' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '50' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
  ]);

  const blend5050 = (globalArr: any[], regionalArr: any[], total = 20) => {
    if (!isRegional || regionalArr.length === 0) return globalArr.slice(0, total);
    const result = [];
    let g = 0, r = 0;
    while (result.length < total && (g < globalArr.length || r < regionalArr.length)) {
      if (r < regionalArr.length) result.push(regionalArr[r++]);
      if (g < globalArr.length && result.length < total) {
        if (!result.some(i => i.id === globalArr[g].id)) result.push(globalArr[g]);
        g++;
      }
    }
    return result;
  };

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
    IN: [350309, 44976, 246091, 483464, 142015, 485645, 256433, 44722, 921781, 977824, 506940, 259256, 1029834, 142022, 657153, 1213248, 489399, 557748, 282971, 605068, 20970, 343944, 244500, 1397777, 341455, 505479, 17929, 476740, 669960, 673213, 413369, 480243],
    JP: [210303, 425164, 23616, 39199, 148065, 117354, 247028, 263101, 143302, 374509, 374511, 96850, 386410],
    KR: [619537, 619802, 531566, 619533, 660359, 1517098, 736824, 707622, 535790, 620873, 1185967, 421904],
    BR: [119581, 455278, 342577, 743415, 369380, 429234, 620873, 386410, 263101, 148065, 39199],
    ES: [74508, 388180, 2248, 624920, 492969, 669836, 9649, 778680, 86027, 117354]
  };
  const currentCountry = countryCode.toUpperCase();
  const regionalIds = regionalCollectionMap[currentCountry] || [];

  let regionalColls = allIds.filter(id => regionalIds.includes(id));
  let globalColls = allIds.filter(id => !regionalIds.includes(id));

  const shuffle = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
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
        <ContinueWatching />
        
        <RecommendedForYou mediaType="all" excludeIds={excludeIds} />
        
        <RegionalContent />

        {collectionsData.length > 0 && <CollectionsRow collections={collectionsData} />}

        <div className="hidden md:block">
          <Top10Row title="Top 10 Today" items={blend5050(trendingResults, regionalTrending.results || [], 10) as Media[]} />
        </div>

        <HorizontalRow title="Global Trending" subtitle="What the world is watching today" items={trendingResults as Media[]} seeAllHref="/trending/all" />
        
        <ProviderHeroShelf 
          title="Top on Netflix"
          provider={PROVIDERS.find(p => p.id === 8)!}
          items={(netflixData.results || []) as Media[]}
        />

        <HorizontalRow title="Critically Acclaimed Movies" subtitle="Highest rated of all time" items={blendedTopMovies as Media[]} seeAllHref="/movies/top-rated" />
        <HorizontalRow title="Top Rated Series" subtitle="Must-watch television" items={blendedTopTv as Media[]} seeAllHref="/tv/top-rated" />
        
        <ProviderHeroShelf 
          title="Prime Video Exclusives"
          provider={PROVIDERS.find(p => p.id === 9)!}
          items={(primeData.results || []) as Media[]}
        />

        <div className="hidden md:block">
          <TimeBasedWidget items={widgetPool} variant="desktop" />
        </div>

        {(popAnime.results && popAnime.results.length > 0) && (
          <HorizontalRow title="Trending Anime" subtitle="Top animated series right now" items={popAnime.results || []} seeAllHref="/anime/trending" />
        )}
        
        <HorizontalRow title="Modern Classics" subtitle="Iconic movies (1980-2014)" items={classicMovies.results || []} />
        <HorizontalRow title="Underrated Gems" subtitle="High ratings, fewer votes" items={underratedMovies.results || []} />
        
        <div className="px-4 md:px-12 mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Explore Platforms</h2>
          <ProvidersGrid />
        </div>
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
    trending,
    regionalTrendingRes
  ] = await Promise.all([
    tmdb.getTrending('all'),
    isRegional ? getRegionalTrendingAction(countryCode) : Promise.resolve({ results: [] })
  ]);
  
  const regionalTrending = regionalTrendingRes || { results: [] };
  const excludeIds = regionalTrending.results ? regionalTrending.results.map((item: any) => item.id) : [];

  const trendingResults = trending.results || [];
  const trendingMovies = trendingResults.filter((item: any) => item.media_type === 'movie');
  const trendingTvs = trendingResults.filter((item: any) => item.media_type === 'tv');
  
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

export default function Home() {`;

content = content.replace(regexHomeDataFetcher, newImplementation);
fs.writeFileSync(file, content);
console.log('Successfully refactored app/page.tsx');
