import { tmdb } from '@/lib/tmdb';
import { AnimeDashboard } from '@/components/media/AnimeDashboard';
import { Media } from '@/types/tmdb';

export const revalidate = 86400; // 24h

export const metadata = {
  title: 'Anime',
  robots: { index: false, follow: false },
};

function deduplicate(items: Media[]) {
  return items.filter((item, index, self) => 
    item && item.id && index === self.findIndex((t) => t.id === item.id)
  );
}

import { Suspense } from 'react';
import { ThemedLoader } from '@/components/ui/ThemedLoader';

async function AnimeDataFetcher() {
  const [trendP1, trendP2, topP1, topP2, topP3, topP4, topP5] = await Promise.all([
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc", page: "1" }),
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc", page: "2" }).catch(() => ({ results: [] })),
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "vote_average.desc", "vote_count.gte": "100", page: "1" }),
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "vote_average.desc", "vote_count.gte": "100", page: "2" }).catch(() => ({ results: [] })),
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "vote_average.desc", "vote_count.gte": "100", page: "3" }).catch(() => ({ results: [] })),
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "vote_average.desc", "vote_count.gte": "100", page: "4" }).catch(() => ({ results: [] })),
    tmdb.discover("tv", { with_genres: "16", with_original_language: "ja", sort_by: "vote_average.desc", "vote_count.gte": "100", page: "5" }).catch(() => ({ results: [] })),
  ]);

  const trending = deduplicate([...(trendP1.results || []), ...(trendP2.results || [])]);
  const topRated = deduplicate([
    ...(topP1.results || []),
    ...(topP2.results || []),
    ...(topP3.results || []),
    ...(topP4.results || []),
    ...(topP5.results || [])
  ]);

  return (
      <AnimeDashboard trendingAnime={trending} topRatedAnime={topRated} />
  );
}

export default function AnimePage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Suspense fallback={<ThemedLoader theme="anime" />}>
        <AnimeDataFetcher />
      </Suspense>
    </div>
  );
}
