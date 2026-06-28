'use client';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { HorizontalRow } from '@/components/media/HorizontalRow';
import { RowSkeleton } from '@/components/ui/RowSkeleton';
import { Media } from '@/types/tmdb';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ContinueWatching() {
  const { history } = useWatchHistory();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full relative min-h-[300px]">
        <RowSkeleton title="Continue Watching" />
      </div>
    );
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

  return (
    <div className="w-full relative min-h-[300px]">
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <HorizontalRow title="Continue Watching" items={historyMedia} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
