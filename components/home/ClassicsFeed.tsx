import React from 'react';
import { tmdb } from '@/lib/tmdb';
import nextDynamic from 'next/dynamic';
import { Media } from '@/types/tmdb';

const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));

export async function ClassicsFeed() {
  const [
    classicMovies,
    underratedMovies,
  ] = await Promise.all([
    tmdb.discover('movie', { 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '2014-12-31', 'vote_count.gte': '3000', sort_by: 'vote_average.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { 'vote_average.gte': '7.2', 'vote_count.gte': '300', 'vote_count.lte': '2500', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
  ]);

  return (
    <>
      <HorizontalRow title="Modern Classics" subtitle="Iconic movies (1980-2014)" items={classicMovies.results || []} />
      <HorizontalRow title="Underrated Gems" subtitle="High ratings, fewer votes" items={underratedMovies.results || []} />
    </>
  );
}
