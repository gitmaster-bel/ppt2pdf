import { tmdb, getHeroItemsWithLogos } from '@/lib/tmdb';
import { getCuratedCollections } from '@/lib/collectionsData';
import { HeroSlider } from '@/components/media/HeroSlider';
import { ContinueWatching } from '@/components/media/ContinueWatching';
import { RecommendedForYou } from '@/components/media/RecommendedForYou';

import { Suspense } from 'react';
import { ThemedLoader } from '@/components/ui/ThemedLoader';
import { PROVIDERS } from '@/lib/providers';
import nextDynamic from 'next/dynamic';


const CollectionsRow = nextDynamic(() => import('@/components/media/CollectionsRow').then(mod => mod.CollectionsRow));
const TimeBasedWidget = nextDynamic(() => import('@/components/home/TimeBasedWidget').then(mod => mod.TimeBasedWidget));
import { ProvidersGrid } from '@/components/providers/ProvidersGrid';
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row));
const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));
const ProviderHeroShelf = nextDynamic(() => import('@/components/providers/ProviderHeroShelf').then(mod => mod.ProviderHeroShelf));

export const revalidate = 3600;

async function HomeDataFetcher() {
  // ─── Single cached render replaces 12+ parallel TMDB calls ────────────────
  // The page itself exports `revalidate = 3600`. This means Next.js will only
  // run this function and hit TMDB ONCE per hour. All other user requests
  // will be served the pre-rendered HTML from Vercel's Edge CDN instantly.

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
  ] = await Promise.all([
    tmdb.getTrending('all'),
    tmdb.getPopular('movie'),
    tmdb.getPopular('tv'),
    tmdb.getTopRated('movie'),
    tmdb.getTopRated('tv'),
    tmdb.getAnime('1').catch(() => ({ results: [] })),
    tmdb.discover('movie', {
      'primary_release_date.gte': '1980-01-01',
      'primary_release_date.lte': '2014-12-31',
      'vote_count.gte': '3000',
      sort_by: 'vote_average.desc',
    }).catch(() => ({ results: [] })),
    tmdb.discover('tv', {
      'first_air_date.gte': '1990-01-01',
      'first_air_date.lte': '2014-12-31',
      'vote_count.gte': '1500',
      sort_by: 'vote_average.desc',
    }).catch(() => ({ results: [] })),
    tmdb.discover('movie', {
      'vote_average.gte': '7.2',
      'vote_count.gte': '300',
      'vote_count.lte': '2500',
      sort_by: 'popularity.desc',
    }).catch(() => ({ results: [] })),
    tmdb.discover('tv', {
      'vote_average.gte': '7.5',
      'vote_count.gte': '200',
      'vote_count.lte': '2000',
      sort_by: 'popularity.desc',
    }).catch(() => ({ results: [] })),
    tmdb.discover('movie', {
      with_watch_providers: '8',
      watch_region: 'US',
      sort_by: 'popularity.desc',
    }).catch(() => ({ results: [] })),
    tmdb.discover('movie', {
      with_watch_providers: '9',
      watch_region: 'US',
      sort_by: 'popularity.desc',
    }).catch(() => ({ results: [] })),
  ]);

  // Extract and interleave movie and tv items to ensure a balanced cinematic mix in the Hero slider
  const trendingResults = trending.results || [];
  const trendingMovies = trendingResults.filter((item: any) => item.media_type === 'movie');
  const trendingTvs = trendingResults.filter((item: any) => item.media_type === 'tv');

  const mixedHeroItems: any[] = [];
  const maxLen = Math.max(trendingMovies.length, trendingTvs.length);
  for (let i = 0; i < maxLen; i++) {
    if (trendingMovies[i] && mixedHeroItems.length < 6) mixedHeroItems.push(trendingMovies[i]);
    if (trendingTvs[i] && mixedHeroItems.length < 6) mixedHeroItems.push(trendingTvs[i]);
  }

  // Fallback to normal slice if for some reason we don't have enough mixed items
  if (mixedHeroItems.length < 6) {
    const remaining = trendingResults.filter((item: any) => !mixedHeroItems.includes(item));
    mixedHeroItems.push(...remaining.slice(0, 6 - mixedHeroItems.length));
  }

  const heroItemsWithLogos = await getHeroItemsWithLogos(mixedHeroItems);
  
  // Use classics and underrated gems for the time-based recommendations
  const widgetPool = [
    ...(classicMovies.results || []), 
    ...(classicTv.results || []), 
    ...(underratedMovies.results || []), 
    ...(underratedTv.results || []),
    ...(topMovies.results || []),
    ...(topTv.results || [])
  ];

  // Fetch fresh collection data for the curated row
  const collectionsData = await getCuratedCollections();


  return (
    <div className="flex flex-col min-h-screen -mt-[72px]">

      {/* Cinematic hero — full screen, sits behind nav */}
      <HeroSlider items={heroItemsWithLogos} />

      <div className="md:hidden block mt-4 z-20 relative">
        <TimeBasedWidget items={widgetPool} variant="mobile" />
      </div>

      {/* Content rows */}
      <div className="flex flex-col relative z-20 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-16 md:mt-4 gap-6 md:gap-10">
        
        {/* Priority Rows (Above Fold) */}
        <ContinueWatching />
        <RecommendedForYou mediaType="all" />

        {/* Movie Collections — curated iconic franchises */}
        {collectionsData.length > 0 && <CollectionsRow collections={collectionsData} />}

        <div className="hidden md:block">
          <TimeBasedWidget items={widgetPool} variant="desktop" />
        </div>

        <ProvidersGrid />

        {/* Top 10 Today — Custom UI */}
        <Top10Row
          title="Top 10 Today"
          items={trending.results?.slice(0, 10) || []}
        />

        <HorizontalRow
          title="Popular Movies"
          items={popMovies.results?.slice(0, 20) || []}
          seeAllHref="/movies"
        />

        <HorizontalRow
          title="Trending TV Shows"
          items={popTv.results?.slice(0, 20) || []}
          seeAllHref="/tv"
        />

        <HorizontalRow
          title="Anime Corner"
          items={popAnime.results?.slice(0, 20) || []}
          seeAllHref="/anime"
        />

        {/* Provider Shelves */}
        <ProviderHeroShelf provider={PROVIDERS.find(p => p.id === 8)!} title="Trending on Netflix" items={netflixData.results?.slice(0, 20) || []} />
        <ProviderHeroShelf provider={PROVIDERS.find(p => p.id === 9)!} title="New on Prime Video" items={primeData.results?.slice(0, 20) || []} />

        <HorizontalRow
          title="Top Rated TV Shows"
          items={topTv.results?.slice(0, 20) || []}
          seeAllHref="/tv"
        />
        

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Suspense fallback={<ThemedLoader theme="home" />}>
        <HomeDataFetcher />
      </Suspense>
    </div>
  );
}
