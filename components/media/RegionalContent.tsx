import { CompactTop10Row } from './CompactTop10Row';
import { getRegionalTrendingAction } from '@/app/actions';
import { Media } from '@/types/tmdb';

// Map of ISO 3166-1 alpha-2 country codes to localized row titles.
// Global countries (US, GB, CA, AU) are intentionally omitted to avoid duplication with default trending rows.
const REGIONAL_TITLES: Record<string, string> = {
  IN: 'Trending in India',
  PK: 'Trending in Pakistan',
  JP: 'Trending in Japan',
  KR: 'Trending in South Korea',
  BR: 'Trending in Brazil',
  ES: 'Trending in Spain',
  FR: 'Trending in France',
  DE: 'Trending in Germany',
  IT: 'Trending in Italy',
  MX: 'Trending in Mexico',
  PH: 'Trending in Philippines',
  TH: 'Trending in Thailand',
  ID: 'Trending in Indonesia',
  NG: 'Trending in Nigeria',
  TR: 'Trending in Turkey',
};

export async function RegionalContent({ countryCode }: { countryCode: string }) {
  const localizedTitle = REGIONAL_TITLES[countryCode];
  if (!localizedTitle) return null;

  let movies: Media[] = [];
  let shows: Media[] = [];
  let countryName = '';

  try {
    const data = await getRegionalTrendingAction(countryCode);
    if (data && data.results && data.results.length > 0) {
      movies = (data.movies as Media[]) || [];
      shows = (data.shows as Media[]) || [];
      countryName = localizedTitle.replace('Trending in ', '');
    }
  } catch (e) {
    console.error('Failed to fetch regional content', e);
  }

  if (movies.length === 0 && shows.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-6 md:gap-10">
      {movies.length > 0 && (
        <CompactTop10Row
          title={`${countryName}'s Top Movies`}
          items={movies}
          limit={15}
        />
      )}
      {shows.length > 0 && (
        <CompactTop10Row
          title={`${countryName}'s Top Shows`}
          items={shows}
          limit={15}
        />
      )}
    </div>
  );
}
