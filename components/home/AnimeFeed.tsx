import React from 'react';
import { tmdb } from '@/lib/tmdb';
import nextDynamic from 'next/dynamic';

const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));

export async function AnimeFeed() {
  const popAnime = await tmdb.getAnime('1').catch(() => ({ results: [] }));

  if (!popAnime.results || popAnime.results.length === 0) return null;

  return (
    <HorizontalRow 
      title="Trending Anime" 
      subtitle="Top animated series right now" 
      items={popAnime.results || []} 
      seeAllHref="/anime/trending" 
    />
  );
}
