import { tmdb, getHeroItemsWithLogos } from '@/lib/tmdb';
import { HeroSlider } from '@/components/media/HeroSlider';
import { RecommendedForYou } from '@/components/media/RecommendedForYou';
import { getCuratedCollections } from '@/lib/collectionsData';

import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';

const CollectionsRow = nextDynamic(() => import('@/components/media/CollectionsRow').then(mod => mod.CollectionsRow));
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row));
const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));

export const revalidate = 86400; // 24h — protects hobby-plan ISR writes

export const metadata = {
  title: 'Movies',
  robots: { index: false, follow: false },
};

const MOODS = [
  { label: 'Feel Good', slug: 'feel-good', image: '/lgotja3xMoJZbynwHfcQcJAEMWH.jpg', genre: '35', desc: 'Comedy & Laughter', color: '#f59e0b', bg: 'from-amber-600/30 to-amber-900/10' },
  { label: 'Thrilling', slug: 'thrilling', image: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg', genre: '53', desc: 'Edge-of-seat tension', color: '#ef4444', bg: 'from-red-600/30 to-red-900/10' },
  { label: 'Epic Adventure', slug: 'epic-adventure', image: '/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg', genre: '12', desc: 'Grand journeys', color: '#3b82f6', bg: 'from-blue-600/30 to-blue-900/10' },
  { label: 'Horror', slug: 'horror', image: '/vh7np635kDIcfO6x2Y9ElgLJsuI.jpg', genre: '27', desc: 'Spine-chilling scares', color: '#7c3aed', bg: 'from-purple-700/30 to-purple-900/10' },
  { label: 'Sci-Fi', slug: 'sci-fi', image: '/2I1OFQJ0L9T0dpU6FobKFWV2PxX.jpg', genre: '878', desc: 'Future worlds', color: '#06b6d4', bg: 'from-cyan-600/30 to-cyan-900/10' },
  { label: 'Emotional', slug: 'emotional', image: '/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg', genre: '18', desc: 'Deep & moving drama', color: '#ec4899', bg: 'from-pink-600/30 to-pink-900/10' },
  { label: 'Classic Cinema', slug: 'classic-cinema', image: '/xnHVX37XZEp33hhCbYlQFq7ux1J.jpg', genre: '10749', desc: 'Timeless romance', color: '#84cc16', bg: 'from-lime-600/30 to-lime-900/10' },
  { label: 'Mystery', slug: 'mystery', image: '/zTnAnYIn0Iv3cn0ZHlzLhou3ybm.jpg', genre: '9648', desc: 'Whodunit puzzles', color: '#f97316', bg: 'from-orange-600/30 to-orange-900/10' },
];

export default async function MoviesPage() {
  const [trendingMovies, popMovies, topMovies, hiddenGems, trueStories, acclaimed, thisYear] = await Promise.all([
    tmdb.getTrending('movie'),
    tmdb.getPopular('movie'),
    tmdb.getTopRated('movie'),
    // All-time hidden gems: high rating, not super popular — no date filter
    tmdb.discover('movie', { 'vote_average.gte': '7.4', 'vote_count.gte': '500', 'vote_count.lte': '3000', sort_by: 'vote_average.desc' }),
    tmdb.discover('movie', { with_keywords: '188065' }),
    tmdb.discover('movie', { 'vote_average.gte': '8.0', 'vote_count.gte': '5000', sort_by: 'vote_average.desc' }),
    tmdb.discover('movie', { 'primary_release_date.gte': '2026-01-01', sort_by: 'popularity.desc' }),
  ]);

  const top6Trending = trendingMovies.results?.slice(0, 6) || [];
  const heroItemsWithLogos = await getHeroItemsWithLogos(top6Trending);
  
  const collectionsData = await getCuratedCollections();

  return (
    <div className="flex flex-col min-h-screen pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-20 bg-[#050505] -mt-[72px]">
      <h1 className="sr-only">Movies</h1>
      {/* Cinematic hero */}
      <HeroSlider items={heroItemsWithLogos} />

      {/* Content rows */}
      <div className="flex flex-col relative z-20 mt-4 gap-6 md:gap-10">
        
        <RecommendedForYou mediaType="movie" />

        <Top10Row
          title="Top 10 Movies Today"
          items={trendingMovies.results?.slice(0, 10) || []}
        />

        {collectionsData.length > 0 && <CollectionsRow collections={collectionsData} />}


        <HorizontalRow
          title="Popular Now"
          items={popMovies.results?.slice(0, 20) || []}
        />

        <HorizontalRow
          title="Hidden Gems"
          items={hiddenGems.results?.slice(0, 20) || []}
        />

        <HorizontalRow
          title="Critically Acclaimed"
          items={acclaimed.results?.slice(0, 20) || []}
        />


        <HorizontalRow
          title="Based on True Stories"
          items={trueStories.results?.slice(0, 20) || []}
        />

        <HorizontalRow
          title="Released This Year"
          items={thisYear.results?.slice(0, 20) || []}
        />

        {/* Browse by Mood */}
        <div className="px-4 md:px-14 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 md:w-1.5 md:h-6 rounded-full bg-[#e50914]" />
            <h2 className="text-lg md:text-2xl font-display font-bold text-white tracking-tight">
              Browse by Mood
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {MOODS.map((mood) => (
              <Link
                key={mood.slug}
                href={`/mood/${mood.slug}`}
                className={`group relative flex flex-col justify-end p-4 md:p-5 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-white/[0.03] hover:border-white/30`}
                style={{
                  minHeight: '120px',
                }}
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w500${mood.image}`}
                  alt={mood.label}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-80 transition-all duration-700 group-hover:scale-[1.1]"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent group-hover:from-[#0a0a0f]/90 transition-all duration-500" />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay"
                  style={{ background: `radial-gradient(circle at top right, ${mood.color}40 0%, transparent 70%)` }}
                />
                
                <div className="relative z-10 w-full">
                  <p className="text-white font-black font-display text-lg md:text-xl leading-tight tracking-tight drop-shadow-md">
                    {mood.label}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5 leading-tight font-medium">
                    {mood.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
