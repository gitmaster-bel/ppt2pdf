import React from 'react';
import { tmdb } from '@/lib/tmdb';
import { PROVIDERS } from '@/lib/providers';
import nextDynamic from 'next/dynamic';
import { Media } from '@/types/tmdb';

const ProviderHeroShelf = nextDynamic(() => import('@/components/providers/ProviderHeroShelf').then(mod => mod.ProviderHeroShelf));

export async function ProviderShelvesFeed({ countryCode, isRegional }: { countryCode: string; isRegional: boolean }) {
  const [
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
  ] = await Promise.all([
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
  ]);

  const netflixData = { results: [...(netflixDataPage1?.results || []), ...(netflixDataPage2?.results || [])] };
  const netflixTvData = { results: [...(netflixTvDataPage1?.results || []), ...(netflixTvDataPage2?.results || [])] };
  const primeData = { results: [...(primeDataPage1?.results || []), ...(primeDataPage2?.results || [])] };
  const primeTvData = { results: [...(primeTvDataPage1?.results || []), ...(primeTvDataPage2?.results || [])] };

  const blendProviderData = (
    globalMovies: any[], 
    globalTv: any[], 
    regionalMovies: any[], 
    regionalTv: any[], 
    total = 20
  ) => {
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

    const isGlobalStrict = (item: any) => {
      const originCountries = item.origin_country || [];
      if (originCountries.includes(curCode)) return false;
      if (rLangs.includes(item.original_language)) return false;
      return true;
    };

    const cleanGlobalMovies = gM.filter(isGlobalStrict);
    const cleanGlobalTv = gT.filter(isGlobalStrict);

    if (!isRegional || (rM.length === 0 && rT.length === 0)) {
      const pickedTv = cleanGlobalTv.slice(0, 6);
      const pickedMovies = cleanGlobalMovies.slice(0, total - pickedTv.length);
      const mix = [...pickedTv, ...pickedMovies];
      return Array.from(new Map(mix.map(item => [item.id, item])).values()).slice(0, total);
    }

    const regPickM = rM.slice(0, 5);
    const regPickT = rT.slice(0, 3);
    const regionalMix = [...regPickM, ...regPickT];
    
    const needed = total - regionalMix.length;
    const globTvNeeded = Math.max(0, 6 - regPickT.length);
    const pickedGlobalTv = cleanGlobalTv.slice(0, globTvNeeded);
    const pickedGlobalMovies = cleanGlobalMovies.slice(0, needed - pickedGlobalTv.length);

    const result = [...regionalMix, ...pickedGlobalTv, ...pickedGlobalMovies];
    
    // Shuffle slightly
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return Array.from(new Map(result.map(item => [item.id, item])).values()).slice(0, total);
  };

  const blendedNetflix = blendProviderData(
    netflixData.results || [], 
    netflixTvData.results || [], 
    regionalNetflixData?.results || [], 
    regionalNetflixTvData?.results || []
  );

  const blendedPrime = blendProviderData(
    primeData.results || [], 
    primeTvData.results || [], 
    regionalPrimeData?.results || [], 
    regionalPrimeTvData?.results || []
  );

  return (
    <>
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
    </>
  );
}
