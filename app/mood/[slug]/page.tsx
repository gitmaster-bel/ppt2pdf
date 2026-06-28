import { notFound } from 'next/navigation';
import { tmdb } from '@/lib/tmdb';
import { BackButton } from '@/components/ui/BackButton';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';

const HorizontalRow = nextDynamic(() => import('@/components/media/HorizontalRow').then(mod => mod.HorizontalRow));
const Top10Row = nextDynamic(() => import('@/components/media/Top10Row').then(mod => mod.Top10Row));

export const runtime = 'edge';

const MOODS_MAP: Record<string, { label: string, genre: string, image: string, color: string, desc: string }> = {
  'feel-good': { label: 'Feel Good', genre: '35', image: '/lgotja3xMoJZbynwHfcQcJAEMWH.jpg', color: '#f59e0b', desc: 'Comedy & Laughter' },
  'thrilling': { label: 'Thrilling', genre: '53', image: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg', color: '#ef4444', desc: 'Edge-of-seat tension' },
  'epic-adventure': { label: 'Epic Adventure', genre: '12', image: '/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg', color: '#3b82f6', desc: 'Grand journeys' },
  'horror': { label: 'Horror', genre: '27', image: '/vh7np635kDIcfO6x2Y9ElgLJsuI.jpg', color: '#7c3aed', desc: 'Spine-chilling scares' },
  'sci-fi': { label: 'Sci-Fi', genre: '878', image: '/2I1OFQJ0L9T0dpU6FobKFWV2PxX.jpg', color: '#06b6d4', desc: 'Future worlds' },
  'emotional': { label: 'Emotional', genre: '18', image: '/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg', color: '#ec4899', desc: 'Deep & moving drama' },
  'classic-cinema': { label: 'Classic Cinema', genre: '10749', image: '/xnHVX37XZEp33hhCbYlQFq7ux1J.jpg', color: '#84cc16', desc: 'Timeless romance' },
  'mystery': { label: 'Mystery', genre: '9648', image: '/zTnAnYIn0Iv3cn0ZHlzLhou3ybm.jpg', color: '#f97316', desc: 'Whodunit puzzles' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mood = MOODS_MAP[slug];
  return {
    title: mood ? `${mood.label} Movies` : 'Mood',
    robots: { index: false, follow: false },
  };
}

export default async function MoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mood = MOODS_MAP[slug];

  if (!mood) {
    notFound();
  }

  // Fetch curated collections for this specific mood genre
  const [trending, topRated, newReleases, highlyAcclaimed] = await Promise.all([
    tmdb.discover('movie', { with_genres: mood.genre, sort_by: 'popularity.desc' }),
    tmdb.discover('movie', { with_genres: mood.genre, sort_by: 'vote_average.desc', 'vote_count.gte': '1000' }),
    tmdb.discover('movie', { with_genres: mood.genre, sort_by: 'primary_release_date.desc', 'primary_release_date.lte': new Date().toISOString().split('T')[0], 'vote_count.gte': '50' }),
    tmdb.discover('movie', { with_genres: mood.genre, sort_by: 'vote_average.desc', 'vote_count.gte': '3000' })
  ]);

  return (
    <div className="flex flex-col min-h-screen pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-20 bg-[#050505] -mt-[72px]">
      
      {/* Mood Hero Header */}
      <div className="relative w-full h-[60vh] md:h-[70vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute top-28 left-4 md:left-14 z-50">
          <BackButton />
        </div>
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={`https://media.themoviedb.org/t/p/original${mood.image}`}
            alt={mood.label}
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Gradients to blend into the dark theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]/50" />
          
          {/* Dynamic Radial Glow based on Mood Color */}
          <div 
            className="absolute inset-0 mix-blend-overlay opacity-60"
            style={{
              background: `radial-gradient(circle at center, ${mood.color}40 0%, transparent 60%)`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 md:px-14 pb-12 md:pb-20 w-full max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 max-w-3xl">
            <span 
              className="px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] rounded-full w-fit backdrop-blur-md shadow-lg border border-white/10"
              style={{ backgroundColor: `${mood.color}20`, color: mood.color }}
            >
              Curated Collection
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter drop-shadow-2xl">
              {mood.label}
            </h1>
            <p className="text-lg md:text-2xl text-white/80 font-medium drop-shadow-md max-w-2xl">
              {mood.desc}. Hand-picked movies guaranteed to fit your exact mood right now.
            </p>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="relative z-20 flex flex-col gap-8 md:gap-12 pb-12 -mt-8 md:-mt-12 bg-gradient-to-b from-transparent to-[#050505]">
        
        <Top10Row 
          title={`Trending in ${mood.label}`} 
          items={trending.results?.slice(0, 10) || []} 
        />
        
        <HorizontalRow 
          title="Top Rated" 
          items={topRated.results?.slice(0, 20) || []} 
        />
        
        <HorizontalRow 
          title="New Releases" 
          items={newReleases.results?.slice(0, 20) || []} 
        />
        
        <HorizontalRow 
          title="Critically Acclaimed" 
          items={highlyAcclaimed.results?.slice(0, 20) || []} 
        />

      </div>
    </div>
  );
}
