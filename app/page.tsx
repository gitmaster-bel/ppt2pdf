import { Suspense } from 'react';
import { HeroSkeleton } from '@/components/ui/HeroSkeleton';

export const runtime = 'nodejs';
export const revalidate = 0;
import { tmdb, getHeroItemsWithLogos } from '@/lib/tmdb';
import { HeroSlider } from '@/components/media/HeroSlider';
import { ContinueWatching } from '@/components/media/ContinueWatching';
import { RecommendedForYou } from '@/components/media/RecommendedForYou';
import { getRegionalTrendingAction } from '@/app/actions';
import { cookies, headers } from 'next/headers';
import { Media } from '@/types/tmdb';
import { ProvidersGrid } from '@/components/providers/ProvidersGrid';
import { RowSkeleton } from '@/components/ui/RowSkeleton';
import { ProviderRowSkeleton } from '@/components/ui/ProviderRowSkeleton';
import { CompactTop10Skeleton } from '@/components/ui/CompactTop10Skeleton';
import { PROVIDERS } from '@/lib/providers';

import nextDynamic from 'next/dynamic';

const RegionalContent = nextDynamic(() => import('@/components/media/RegionalContent').then(mod => mod.RegionalContent), { loading: () => <div className="flex flex-col gap-6 md:gap-10 w-full"><CompactTop10Skeleton title="Top Movies" /><CompactTop10Skeleton title="Top TV Shows" /></div> });
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row), { loading: () => <RowSkeleton /> });
const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow), { loading: () => <RowSkeleton /> });

// Async feed components
import { CollectionsFeed } from '@/components/home/CollectionsFeed';
const ClientProviderShelves = nextDynamic(() => import('@/components/home/ClientProviderShelves').then(mod => mod.ClientProviderShelves), { loading: () => <div className="flex flex-col gap-6 md:gap-10 w-full"><ProviderRowSkeleton title="Popular on Netflix" provider={PROVIDERS.find(p => p.id === 8)} /><ProviderRowSkeleton title="Popular on Prime Video" provider={PROVIDERS.find(p => p.id === 9)} /></div> });
import { TopRatedFeed } from '@/components/home/TopRatedFeed';
import { ClassicsFeed } from '@/components/home/ClassicsFeed';
import { AnimeFeed } from '@/components/home/AnimeFeed';
import { TimeBasedWidgetFeed } from '@/components/home/TimeBasedWidgetFeed';

const REGIONAL_MARKETS = new Set(['IN', 'PK', 'JP', 'KR', 'BR', 'ES', 'FR', 'DE', 'IT', 'MX', 'PH', 'TH', 'ID', 'NG', 'TR']);

const REGIONAL_TITLES: Record<string, string> = {
  IN: 'Trending in India',
  PK: 'Trending in Pakistan',
  JP: 'Trending in Japan',
  KR: 'Trending in South Korea',
  BR: 'Trending in Brazil',
  ES: 'Trending in Spain',
  FR: 'Trending in France',
  DE: 'Trending in Germany',
  IT: 'Trending in Italy',
  MX: 'Trending in Mexico',
  PH: 'Trending in Philippines',
  TH: 'Trending in Thailand',
  ID: 'Trending in Indonesia',
  NG: 'Trending in Nigeria',
  TR: 'Trending in Turkey',
};

async function getCountryCode() {
  const headersList = await headers();
  const cookieStore = await cookies();
  
  let savedCountry = cookieStore.get('user_country')?.value || null;
  if (!savedCountry) {
    try {
      const prefsStr = cookieStore.get('preferences')?.value;
      if (prefsStr) savedCountry = JSON.parse(prefsStr).country;
    } catch(e) {}
  }

  const defaultCountry = process.env.NODE_ENV === 'development' ? 'IN' : 'US';
  return (
    savedCountry ||
    // Cloudflare Workers injects CF-IPCountry
    headersList.get('cf-ipcountry') ||
    // Vercel injects x-vercel-ip-country (kept as fallback)
    headersList.get('x-vercel-ip-country') ||
    // Custom override header
    headersList.get('x-user-country') ||
    defaultCountry
  ).toUpperCase();
}

async function HeroSectionFetcher() {
  const countryCode = await getCountryCode();
  const isRegional = REGIONAL_MARKETS.has(countryCode);

  let trendingPage1 = { results: [] };
  let trendingPage2 = { results: [] };
  let regionalTrendingRes = { results: [] };

  try {
    const responses = await Promise.all([
      tmdb.getTrending('all', 1),
      tmdb.getTrending('all', 2),
      isRegional ? getRegionalTrendingAction(countryCode) : Promise.resolve({ results: [] })
    ]);
    trendingPage1 = responses[0] || { results: [] };
    trendingPage2 = responses[1] || { results: [] };
    regionalTrendingRes = responses[2] || { results: [] };
  } catch (e) {
    console.error("HeroSectionFetcher failed:", e);
  }
  
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
    <div className="animate-in fade-in duration-500">
      <HeroSlider items={heroItemsWithLogos} />
    </div>
  );
}

async function TrendingRowsFetcher() {
  const countryCode = await getCountryCode();
  const isRegional = REGIONAL_MARKETS.has(countryCode);

  let trendingPage1 = { results: [] };
  let trendingPage2 = { results: [] };
  let regionalTrendingRes = { results: [] };

  try {
    const responses = await Promise.all([
      tmdb.getTrending('all', 1),
      tmdb.getTrending('all', 2),
      isRegional ? getRegionalTrendingAction(countryCode) : Promise.resolve({ results: [] })
    ]);
    trendingPage1 = responses[0] || { results: [] };
    trendingPage2 = responses[1] || { results: [] };
    regionalTrendingRes = responses[2] || { results: [] };
  } catch (e) {
    console.error("TrendingRowsFetcher failed:", e);
  }
  
  const regionalTrending = regionalTrendingRes || { results: [] };
  const rawTrendingResults = [...(trendingPage1.results || []), ...(trendingPage2.results || [])];
  const trendingResults = Array.from(new Map(rawTrendingResults.map((item: any) => [item.id, item])).values());
  
  const excludeIds = [
    ...(regionalTrending.results ? regionalTrending.results.map((item: any) => item.id) : []),
    ...(trendingResults.slice(0, 10).map((item: any) => item.id))
  ];

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6 md:gap-10">
      <RecommendedForYou mediaType="all" excludeIds={excludeIds} />
      <Top10Row title="Top 10 Today" items={trendingResults.slice(0, 10) as Media[]} />
      <HorizontalRow title="Global Trending" subtitle="What the world is watching today" items={trendingResults.slice(10) as Media[]} seeAllHref="/trending/all" />
    </div>
  );
}

export default async function Home() {
  const countryCode = await getCountryCode();
  const isRegional = REGIONAL_MARKETS.has(countryCode);

  return (
    <main className="w-full bg-void-950 min-h-screen overflow-x-hidden flex flex-col">
      <div className="flex flex-col -mt-[72px]">
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSectionFetcher />
        </Suspense>
        
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
          
          {isRegional ? (
            <Suspense fallback={
              <div className="flex flex-col gap-6 md:gap-10 w-full">
                <CompactTop10Skeleton title={`${REGIONAL_TITLES[countryCode]?.replace('Trending in ', '') || ''}'s Top Movies`} />
                <CompactTop10Skeleton title={`${REGIONAL_TITLES[countryCode]?.replace('Trending in ', '') || ''}'s Top TV Shows`} />
              </div>
            }>
              <RegionalContent />
            </Suspense>
          ) : (
            <RegionalContent />
          )}
          
          <Suspense fallback={<RowSkeleton />}>
            <CollectionsFeed countryCode={countryCode} />
          </Suspense>
          
          <Suspense fallback={<div className="flex flex-col gap-6 md:gap-10"><RowSkeleton title="Recommended For You"/><RowSkeleton title="Top 10 Today"/><RowSkeleton title="Global Trending"/></div>}>
            <TrendingRowsFetcher />
          </Suspense>
          
          <div className="hidden md:block">
            <Suspense fallback={<RowSkeleton />}>
              <TimeBasedWidgetFeed variant="desktop" />
            </Suspense>
          </div>
          
          <Suspense fallback={
            <div className="flex flex-col gap-6 md:gap-10 w-full">
              <ProviderRowSkeleton title="Popular on Netflix" provider={PROVIDERS.find(p => p.id === 8)} />
              <ProviderRowSkeleton title="Popular on Prime Video" provider={PROVIDERS.find(p => p.id === 9)} />
              {countryCode === 'IN' ? (
                <ProviderRowSkeleton title="Popular on JioHotstar" provider={PROVIDERS.find(p => p.id === "122|532|2336")} />
              ) : (
                <>
                  <ProviderRowSkeleton title="Popular on Disney+" provider={PROVIDERS.find(p => p.id === 337)} />
                  <ProviderRowSkeleton title="Popular on Max" provider={PROVIDERS.find(p => p.id === 1899)} />
                </>
              )}
            </div>
          }>
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
    </main>
  );
}
