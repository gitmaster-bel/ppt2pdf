import React from 'react';
import { tmdb } from '@/lib/tmdb';
import nextDynamic from 'next/dynamic';
import { Media } from '@/types/tmdb';

const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));

export async function TopRatedFeed({ countryCode, isRegional }: { countryCode: string; isRegional: boolean }) {
  const [
    popMovies,
    popTv,
    topMovies,
    topTv,
    regionalTopMovies,
    regionalTopTv
  ] = await Promise.all([
    tmdb.getPopular('movie'),
    tmdb.getPopular('tv'),
    tmdb.getTopRated('movie'),
    tmdb.getTopRated('tv'),
    isRegional ? tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '100' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
    isRegional ? tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'vote_average.desc', 'vote_count.gte': '50' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
  ]);

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

  const blendedTopMovies = blend5050(topMovies.results || [], regionalTopMovies?.results || []);
  const blendedTopTv = blend5050(topTv.results || [], regionalTopTv?.results || []);

  return (
    <>
      <HorizontalRow title="Critically Acclaimed Movies" subtitle="Highest rated of all time" items={blendedTopMovies as Media[]} seeAllHref="/movies/top-rated" />
      <HorizontalRow title="Top Rated Series" subtitle="Must-watch television" items={blendedTopTv as Media[]} seeAllHref="/tv/top-rated" />
    </>
  );
}
