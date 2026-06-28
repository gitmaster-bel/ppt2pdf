import React from 'react';
import { tmdb } from '@/lib/tmdb';
import nextDynamic from 'next/dynamic';

const TimeBasedWidget = nextDynamic(() => import('@/components/home/TimeBasedWidget').then(mod => mod.TimeBasedWidget));

export async function TimeBasedWidgetFeed({ variant }: { variant: 'mobile' | 'desktop' }) {
  const [
    popMovies,
    popTv,
    topMovies,
    topTv,
    classicMovies,
    classicTv,
    underratedMovies,
    underratedTv,
  ] = await Promise.all([
    tmdb.getPopular('movie').catch(() => ({ results: [] })),
    tmdb.getPopular('tv').catch(() => ({ results: [] })),
    tmdb.getTopRated('movie').catch(() => ({ results: [] })),
    tmdb.getTopRated('tv').catch(() => ({ results: [] })),
    tmdb.discover('movie', { 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '2014-12-31', 'vote_count.gte': '3000', sort_by: 'vote_average.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { 'first_air_date.gte': '1990-01-01', 'first_air_date.lte': '2014-12-31', 'vote_count.gte': '1500', sort_by: 'vote_average.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('movie', { 'vote_average.gte': '7.2', 'vote_count.gte': '300', 'vote_count.lte': '2500', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    tmdb.discover('tv', { 'vote_average.gte': '7.5', 'vote_count.gte': '200', 'vote_count.lte': '2000', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
  ]);

  const widgetPool = [
    ...(classicMovies.results || []), 
    ...(classicTv.results || []), 
    ...(underratedMovies.results || []), 
    ...(underratedTv.results || []),
    ...(popMovies.results || []),
    ...(popTv.results || []),
    ...(topMovies.results || []),
    ...(topTv.results || [])
  ];

  if (!widgetPool || widgetPool.length === 0) return null;

  return <TimeBasedWidget items={widgetPool} variant={variant} />;
}
