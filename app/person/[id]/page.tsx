import { tmdb, getImageUrl } from '@/lib/tmdb';
import { MediaGrid } from '@/components/media/MediaGrid';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { BackButton } from '@/components/ui/BackButton';
import { Metadata } from 'next';
import { getSiteUrl } from '@/lib/utils';

export const revalidate = 2592000; // 30 day ISR — person data rarely changes

// ─── Pre-render Top 200 People ────────────────────────────────────────────────
// This converts /person/[id] from 0% cached (25K live renders) to ~95%+ cached.
// The most-visited person pages are served as static HTML — zero function cost.
export async function generateStaticParams() {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return [];

    // Fetch 4 pages of popular people = ~80 each = ~320 unique actors/directors
    const pages = await Promise.allSettled(
      [1, 2, 3, 4].map((page) =>
        fetch(
          `https://api.themoviedb.org/3/person/popular?api_key=${TMDB_API_KEY}&page=${page}`,
          { next: { revalidate: 86400 } }
        ).then((r) => r.json())
      )
    );

    const people: { id: number }[] = [];
    for (const result of pages) {
      if (result.status === 'fulfilled' && result.value?.results) {
        people.push(...result.value.results);
      }
    }

    // Deduplicate and return top 200
    const unique = [...new Map(people.map((p) => [p.id, p])).values()].slice(0, 200);
    return unique.map((p) => ({ id: p.id.toString() }));
  } catch {
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const person = await tmdb.getPerson(rawId);
  const siteUrl = getSiteUrl();

  if (!person) return { title: 'Person Not Found | ZIVOX' };

  const title = `${person.name} — Movies & TV Shows | ZIVOX`;
  const description =
    person.biography
      ? person.biography.slice(0, 157) + (person.biography.length > 157 ? '...' : '')
      : `Watch movies and TV shows featuring ${person.name} on ZIVOX.`;
  const image = getImageUrl(person.profile_path, 'w500');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 500, height: 750, alt: person.name }],
      url: `${siteUrl}/person/${rawId}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [image],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Support both plain numeric IDs and slug-style IDs (e.g. "123-tom-hanks")
  const rawId = resolvedParams.id.split('-')[0];
  const person = await tmdb.getPerson(rawId);
  
  if (!person) {
    notFound();
  }

  // Deduplicate and sort works by popularity
  const works = person.combined_credits?.cast || [];
  const uniqueWorksMap = new Map();
  works.forEach((w: any) => {
    if (!uniqueWorksMap.has(w.id)) {
      uniqueWorksMap.set(w.id, { ...w });
    }
  });
  
  const sortedWorks = Array.from(uniqueWorksMap.values()).sort((a: any, b: any) => b.popularity - a.popularity);

  return (
    <div className="container mx-auto px-4 pt-28 md:pt-32 pb-28 md:pb-20 max-w-7xl">
      <BackButton />
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/50 bg-void-950 glow-brand-sm group">
            <Image 
              src={getImageUrl(person.profile_path, 'w500', person.name)} 
              alt={person.name} 
              fill 
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover" 
              priority
            />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display mb-2 text-white">{person.name}</h1>
            <p className="text-zinc-400 font-semibold">{person.known_for_department}</p>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
            {person.birthday && (
              <div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-zinc-600 mb-1">Born</span>
                <span className="text-zinc-200">{person.birthday}</span>
              </div>
            )}
            {person.place_of_birth && (
              <div>
                <span className="block text-[10px] uppercase tracking-widest font-bold text-zinc-600 mb-1">Place of Birth</span>
                <span className="text-zinc-200">{person.place_of_birth}</span>
              </div>
            )}
          </div>
          
          {person.biography && (
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 mb-2">Biography</h3>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed whitespace-pre-line max-w-4xl">
                {person.biography}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {sortedWorks.length > 0 && (
        <div className="mt-8">
          <MediaGrid title="Known For" items={sortedWorks} />
        </div>
      )}
    </div>
  );
}


