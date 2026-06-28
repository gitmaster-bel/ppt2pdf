const fs = require('fs');
const path = require('path');
const filepath = path.join(__dirname, '../app/page.tsx');

const newContent = `import { Suspense } from 'react';
import { ThemedLoader } from '@/components/ui/ThemedLoader';
import { PROVIDERS } from '@/lib/providers';
import nextDynamic from 'next/dynamic';
import { tmdb, getHeroItemsWithLogos } from '@/lib/tmdb';
import { getCuratedCollections } from '@/lib/collectionsData';
import { HeroSlider } from '@/components/media/HeroSlider';
import { ContinueWatching } from '@/components/media/ContinueWatching';
import { RecommendedForYou } from '@/components/media/RecommendedForYou';
import { getRegionalTrendingAction } from '@/app/actions';
import { cookies, headers } from 'next/headers';

const CollectionsRow = nextDynamic(() => import('@/components/media/CollectionsRow').then(mod => mod.CollectionsRow));
const TimeBasedWidget = nextDynamic(() => import('@/components/home/TimeBasedWidget').then(mod => mod.TimeBasedWidget));
import { ProvidersGrid } from '@/components/providers/ProvidersGrid';
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row));
const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));
const ProviderHeroShelf = nextDynamic(() => import('@/components/providers/ProviderHeroShelf').then(mod => mod.ProviderHeroShelf));
const RegionalContent = nextDynamic(() => import('@/components/media/RegionalContent').then(mod => mod.RegionalContent));

// Map of highly localized regions for blending
const REGIONAL_MARKETS = new Set(['IN', 'PK', 'JP', 'KR', 'BR', 'ES', 'FR', 'DE', 'IT', 'MX', 'PH', 'TH', 'ID', 'NG', 'TR']);

async function HomeDataFetcher() {
  const cookieStore = await cookies();
  let countryCode = cookieStore.get('user_country')?.value;
  if (!countryCode) {
    const headersList = await headers();
    countryCode = headersList.get('x-vercel-ip-country') || 'US';
  }
  const isRegional = REGIONAL_MARKETS.has(countryCode.toUpperCase());

  // Parallel fetch for global data and (if applicable) regional data
  const [
    trending,
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
    regionalTrending,
    regionalTopMovies,
    regionalTopTv
  ] = await Promise.all([
    tmdb.getTrending('all'),
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
    // Regional Fetching
    isRegional ? getRegionalTrendingAction(countryCode) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '100' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '50' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
  ]);

  // Extract Regional Excludes for RecommendedForYou
  const excludeIds = regionalTrending.results ? regionalTrending.results.map((item: any) => item.id) : [];

  // --- 50/50 HERO BLENDING ---
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
      // Don't duplicate if global happens to be the regional blockbuster
      if (!mixedHeroItems.some(i => i.id === globHero[hGIdx].id)) {
        mixedHeroItems.push(globHero[hGIdx]);
      }
      hGIdx++;
    }
    if ((!isRegional || hRIdx >= regHero.length) && hGIdx >= globHero.length) break;
  }
  
  const heroItemsWithLogos = await getHeroItemsWithLogos(mixedHeroItems);

  // --- 50/50 TOP RATED BLENDING ---
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

  // --- TIME BASED WIDGET POOL ---
  const widgetPool = [
    ...(classicMovies.results || []), 
    ...(classicTv.results || []), 
    ...(underratedMovies.results || []), 
    ...(underratedTv.results || []),
    ...blendedTopMovies,
    ...blendedTopTv
  ];

  // --- COLLECTIONS BLENDING ---
  let collectionsData = await getCuratedCollections();
  if (isRegional) {
    // Sort to prioritize collections matching country name/culture if defined
    // For now we assume some heuristic or just standard for collections
    // In future, a real collection taxonomy could map Country -> CollectionID
    // As requested: "have more collection from every regional countries so we can show those collection first and rank for better feed"
    const countryNameMap: Record<string, string> = { IN: 'Bollywood', JP: 'Anime', KR: 'K-Drama' };
    const keyword = countryNameMap[countryCode.toUpperCase()];
    if (keyword) {
      collectionsData = [
        ...collectionsData.filter(c => c.title.includes(keyword) || c.description.includes(keyword)),
        ...collectionsData.filter(c => !c.title.includes(keyword) && !c.description.includes(keyword))
      ];
    }
  }

  return (
    <div className="flex flex-col min-h-screen -mt-[72px]">
      <HeroSlider items={heroItemsWithLogos} />

      <div className="md:hidden block mt-4 z-20 relative">
        <TimeBasedWidget items={widgetPool} variant="mobile" />
      </div>

      <div className="flex flex-col relative z-20 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-16 md:mt-4 gap-6 md:gap-10">
        <ContinueWatching />
        
        {/* RecommendedForYou now gets excludeIds to prevent duplication with Regional Content */}
        <RecommendedForYou mediaType="all" excludeIds={excludeIds} />
        
        {/* We keep RegionalContent so they get the dedicated "Trending in [Country]" row */}
        <RegionalContent />

        {collectionsData.length > 0 && <CollectionsRow collections={collectionsData} />}

        <div className="hidden md:block">
          <Top10Row items={blend5050(trendingResults, regionalTrending.results || [], 10)} />
        </div>

        <HorizontalRow title="Global Trending" subtitle="What the world is watching today" items={trendingResults} seeAllHref="/trending/all" />
        
        <ProviderHeroShelf 
          title="Top on Netflix"
          subtitle="Global hits streaming now"
          provider={PROVIDERS.find(p => p.id === 8)!}
          items={netflixData.results || []}
          theme="red"
        />

        <HorizontalRow title="Critically Acclaimed Movies" subtitle="Highest rated of all time" items={blendedTopMovies} seeAllHref="/movies/top-rated" />
        <HorizontalRow title="Top Rated Series" subtitle="Must-watch television" items={blendedTopTv} seeAllHref="/tv/top-rated" />
        
        <ProviderHeroShelf 
          title="Prime Video Exclusives"
          subtitle="Trending on Amazon"
          provider={PROVIDERS.find(p => p.id === 9)!}
          items={primeData.results || []}
          theme="cyan"
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
    </div>
  );
}

export default function Home() {
  return (
    <main className="w-full bg-void-950 min-h-screen overflow-x-hidden">
      <Suspense fallback={<ThemedLoader className="min-h-screen" />}>
        <HomeDataFetcher />
      </Suspense>
    </main>
  );
}
`;

fs.writeFileSync(filepath, newContent);
console.log('Rewrote app/page.tsx');
