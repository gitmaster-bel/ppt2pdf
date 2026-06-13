import { Metadata } from 'next';
import { tmdb, getImageUrl } from '@/lib/tmdb';
import { MovieClient } from './MovieClient';
import { MediaGrid } from '@/components/media/MediaGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateSlug, getSiteUrl } from '@/lib/utils';

export const revalidate = 2592000; // 30 day ISR — Drastically reduces Vercel ISR writes

// ─── Pre-render Top 50 Movies ──────────────────────────────────────────────────
// Pre-building 50 top IDs keeps ISR Write costs minimal. Less popular titles
// are served by on-demand ISR (still fast, just generated on first request).
export async function generateStaticParams() {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return [];

    // 1 page each of popular + top_rated = up to 40 unique movies
    const fetches = await Promise.allSettled([
      fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=1`, {
        next: { revalidate: 86400 },
      }).then((r) => r.json()),
      fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&page=1`, {
        next: { revalidate: 86400 },
      }).then((r) => r.json()),
    ]);

    const allMovies: Array<{ id: number; title?: string }> = [];
    for (const result of fetches) {
      if (result.status === 'fulfilled' && result.value?.results) {
        allMovies.push(...result.value.results);
      }
    }

    // Deduplicate and cap at 50
    const unique = [...new Map(allMovies.map((m) => [m.id, m])).values()].slice(0, 50);

    return unique.map((movie) => ({
      id: generateSlug(movie.id.toString(), movie.title || ''),
    }));
  } catch {
    return [];
  }
}

const siteUrl = getSiteUrl();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rawId = id.split('-')[0];

  const movie = await tmdb.getDetails('movie', rawId);

  const title = movie.title
    ? `Watch ${movie.title} in HD on ZIVOX`
    : 'Watch Movies in HD on ZIVOX';

  // Truncate description to ≤160 chars for Google
  const rawDesc = movie.overview || 'Stream movies in premium HD quality on ZIVOX.';
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc;

  // Prefer backdrop for a cinematic 16:9 Open Graph large image preview
  const image = getImageUrl(movie.backdrop_path || movie.poster_path, 'original');
  const slug = generateSlug(rawId, movie.title);
  const canonicalUrl = `${siteUrl}/watch/movie/${slug}`;

  const genreKeywords = movie.genres?.map((g: { name: string }) => g.name) ?? [];
  const year = movie.release_date?.substring(0, 4) ?? '';
  const keywords = [
    movie.title,
    `watch ${movie.title} free`,
    `${movie.title} full movie`,
    `${movie.title} HD`,
    `${movie.title} ${year}`,
    `${movie.title} online`,
    ...genreKeywords,
    'free streaming',
    'watch free',
    'ZIVOX',
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1280, height: 720, alt: movie.title ?? 'Movie preview' }],
      type: 'video.movie',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function WatchMovie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawId = id.split('-')[0];
  const movie = await tmdb.getDetails('movie', rawId);
  const similar = movie.similar?.results?.slice(0, 18) || [];

  // ── Rich JSON-LD: Movie schema ─────────────────────────────────────────────
  const directors =
    movie.credits?.crew
      ?.filter((c: { job: string }) => c.job === 'Director')
      .slice(0, 3)
      .map((c: { name: string }) => ({ '@type': 'Person', name: c.name })) ?? [];

  const actors =
    movie.credits?.cast
      ?.slice(0, 10)
      .map((c: { name: string }) => ({ '@type': 'Person', name: c.name })) ?? [];

  const slug = generateSlug(rawId, movie.title);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    url: `${siteUrl}/watch/movie/${slug}`,
    image: getImageUrl(movie.poster_path, 'w780'),
    description: movie.overview,
    datePublished: movie.release_date,
    inLanguage: movie.original_language ?? 'en',
    genre: movie.genres?.map((g: { name: string }) => g.name) ?? [],
    director: directors.length > 0 ? directors : undefined,
    actor: actors.length > 0 ? actors : undefined,
    aggregateRating:
      movie.vote_count && movie.vote_count > 50
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(movie.vote_average.toFixed(1)),
            bestRating: 10,
            worstRating: 1,
            ratingCount: movie.vote_count,
          }
        : undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Movies', item: `${siteUrl}/movies` },
      { '@type': 'ListItem', position: 3, name: movie.title, item: `${siteUrl}/watch/movie/${slug}` },
    ],
  };

  return (
    <div className="flex flex-col gap-8 w-full pt-28 md:pt-32 pb-28 md:pb-20">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
      <MovieClient movie={movie} />
      {similar.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 w-full">
          <MediaGrid title="More Like This" items={similar} />
        </div>
      )}
    </div>
  );
}
