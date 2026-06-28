'use client';
import { useEffect, useState } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { CompactTop10Row } from './CompactTop10Row';
import { getRegionalTrendingAction } from '@/app/actions';
import { Media } from '@/types/tmdb';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { RowSkeleton } from '@/components/ui/RowSkeleton';

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

export function RegionalContent() {
  const router = useRouter();
  const { preferences, updatePreferences } = usePreferences();
  const [movies, setMovies] = useState<Media[]>([]);
  const [shows, setShows] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryName, setCountryName] = useState('');

  useEffect(() => {
    let isMounted = true;

    const detectAndFetch = async () => {
      let countryCode = preferences.country;

      // 1. Auto-detect location if not already done
      if (!preferences.locationAutoDetected) {
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          const ipData = await ipRes.json();
          if (ipData && ipData.country_code) {
            countryCode = ipData.country_code;
            updatePreferences({ country: countryCode, locationAutoDetected: true });
            router.refresh();
          }
        } catch (e) {
          console.warn('IP detection failed, using fallback country:', countryCode);
        }
      }

      // 2. Check if country is in our highly-localized targets
      const localizedTitle = REGIONAL_TITLES[countryCode];
      if (!localizedTitle) {
        if (isMounted) setLoading(false); // Global country, don't show the row
        return;
      }

      // 3. Fetch regional content
      try {
        const data = await getRegionalTrendingAction(countryCode);
        if (isMounted) {
          if (data && data.results && data.results.length > 0) {
            setMovies((data.movies as Media[]) || []);
            setShows((data.shows as Media[]) || []);
            // Extract the country name from the localized title, e.g., "Trending in India" -> "India"
            setCountryName(localizedTitle.replace('Trending in ', ''));
          }
        }
      } catch (e) {
        console.error('Failed to fetch regional content', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    detectAndFetch();

    return () => {
      isMounted = false;
    };
  }, [preferences.country, preferences.locationAutoDetected]); // depend on country directly

  if (!loading && movies.length === 0 && shows.length === 0) return null;

  return (
    <div className="w-full relative min-h-[600px] flex flex-col gap-6 md:gap-10">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col gap-6 md:gap-10"
          >
            <RowSkeleton title="Top Movies" />
            <RowSkeleton title="Top TV Shows" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex flex-col gap-6 md:gap-10"
          >
            {movies.length > 0 && (
              <CompactTop10Row
                title={`${countryName}'s Top Movies`}
                items={movies}
                limit={15}
              />
            )}
            {shows.length > 0 && (
              <CompactTop10Row
                title={`${countryName}'s Top TV Shows`}
                items={shows}
                limit={15}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
