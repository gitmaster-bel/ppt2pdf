'use client';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { HorizontalRow } from '@/components/media/HorizontalRow';
import { RowSkeleton } from '@/components/ui/RowSkeleton';
import { Media } from '@/types/tmdb';
import { useEffect, useState } from 'react';

export function ContinueWatching() {
  const { history } = useWatchHistory();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <RowSkeleton title="Continue Watching" />;
  }

  if (!history || history.length === 0) return null;

  const historyMedia = history.slice(0, 10).map(item => ({
    ...item,
    media_type: item.type,
    poster_path: item.poster,
    backdrop_path: null,
    genre_ids: [],
    popularity: 0,
    vote_average: 0,
    vote_count: 0,
    overview: '',
    contextType: 'history',
  })) as unknown as Media[];

  return <HorizontalRow title="Continue Watching" items={historyMedia} />;
}
