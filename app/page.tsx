import { Suspense } from 'react';
import { ThemedLoader } from '@/components/ui/ThemedLoader';
import { tmdb, getHeroItemsWithLogos } from '@/lib/tmdb';
import { HeroSlider } from '@/components/media/HeroSlider';
import { ContinueWatching } from '@/components/media/ContinueWatching';
import { RecommendedForYou } from '@/components/media/RecommendedForYou';
import { getRegionalTrendingAction } from '@/app/actions';
import { cookies, headers } from 'next/headers';
import { Media } from '@/types/tmdb';
import { ProvidersGrid } from '@/components/providers/ProvidersGrid';
import { RowSkeleton } from '@/components/ui/RowSkeleton';

import nextDynamic from 'next/dynamic';

const RegionalContent = nextDynamic(() => import('@/components/media/RegionalContent').then(mod => mod.RegionalContent), { loading: () => <RowSkeleton /> });
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row), { loading: () => <RowSkeleton /> });
const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow), { loading: () => <RowSkeleton /> });

// Async feed components
import { CollectionsFeed } from '@/components/home/CollectionsFeed';
const ClientProviderShelves = nextDynamic(() => import('@/components/home/ClientProviderShelves').then(mod => mod.ClientProviderShelves), { loading: () => <RowSkeleton /> });
import { TopRatedFeed } from '@/components/home/TopRatedFeed';
import { ClassicsFeed } from '@/components/home/ClassicsFeed';
import { AnimeFeed } from '@/components/home/AnimeFeed';
import { TimeBasedWidgetFeed } from '@/components/home/TimeBasedWidgetFeed';

const REGIONAL_MARKETS = new Set(['IN', 'PK', 'JP', 'KR', 'BR', 'ES', 'FR', 'DE', 'IT', 'MX', 'PH', 'TH', 'ID', 'NG', 'TR']);

async function HomeDataFetcher() {
  const headersList = await headers();
  const cookieStore = await cookies();
  
  let savedCountry = null;
  try {
    const prefsStr = cookieStore.get('preferences')?.value;
    if (prefsStr) savedCountry = JSON.parse(prefsStr).country;
  } catch(e) {}

  const countryCode = (savedCountry || headersList.get('x-vercel-ip-country') || 'US').toUpperCase();
  const isRegional = REGIONAL_MARKETS.has(countryCode);

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

      <div className="md:hidden block mt-4 z-20 relative">
        <Suspense fallback={<RowSkeleton />}>
          <TimeBasedWidgetFeed variant="mobile" />
        </Suspense>
      </div>

      <div className="flex flex-col relative z-20 pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-16 md:mt-4 gap-6 md:gap-10">
        <div className="mt-2">
          <ProvidersGrid />
        </div>
        
        <RegionalContent />
        
        <Suspense fallback={<RowSkeleton />}>
          <CollectionsFeed countryCode={countryCode} />
        </Suspense>
        
        <RecommendedForYou mediaType="all" excludeIds={excludeIds} />

        <Top10Row title="Top 10 Today" items={trendingResults.slice(0, 10) as Media[]} />
        
        <HorizontalRow title="Global Trending" subtitle="What the world is watching today" items={trendingResults.slice(10) as Media[]} seeAllHref="/trending/all" />
        
        <div className="hidden md:block">
          <Suspense fallback={<RowSkeleton />}>
            <TimeBasedWidgetFeed variant="desktop" />
          </Suspense>
        </div>
        
        <Suspense fallback={<RowSkeleton />}>
          <ClientProviderShelves />
        </Suspense>

        <Suspense fallback={<RowSkeleton />}>
          <AnimeFeed />
        </Suspense>
        
        <Suspense fallback={<RowSkeleton />}>
          <TopRatedFeed countryCode={countryCode} isRegional={isRegional} />
        </Suspense>

        <Suspense fallback={<RowSkeleton />}>
          <ClassicsFeed />
        </Suspense>
      </div>
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
