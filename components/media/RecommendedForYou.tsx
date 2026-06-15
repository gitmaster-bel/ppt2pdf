'use client';
import { useEffect, useState } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { HorizontalRow } from './HorizontalRow';
import { discoverMedia, getTopRatedAction } from '@/app/actions';
import { Media } from '@/types/tmdb';
import { RefreshCw } from 'lucide-react';

export function RecommendedForYou({ mediaType = 'movie' }: { mediaType?: 'movie' | 'tv' | 'all' }) {
  const { preferences } = usePreferences();
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      if (preferences.preferredGenres.length === 0 && preferences.originalLanguage.length === 0) {
        setIsFallback(true);
        // Fallback to top rated
        const res = await getTopRatedAction(mediaType === 'all' ? 'movie' : mediaType);
        if (res && res.results) {
          setRecommendations(res.results.slice(0, 30));
        }
        return;
      }

      setIsFallback(false);
      const baseParams: Record<string, string> = {
          sort_by: 'popularity.desc',
          include_adult: preferences.adultContent ? 'true' : 'false'
        };

        if (preferences.preferredGenres.length > 0) {
          baseParams.with_genres = preferences.preferredGenres.join('|');
        }

        const langs = preferences.originalLanguage || [];
        const nativeLangs = langs.filter(l => l !== 'en');
        const hasEnglish = langs.includes('en');

        let combinedResults: any[] = [];

        const fetchByType = async (type: 'movie' | 'tv') => {
          let typeResults: any[] = [];
          if (nativeLangs.length > 0 && hasEnglish) {
            const nativeData = await discoverMedia(type, { ...baseParams, with_original_language: nativeLangs.join('|') });
            const enData = await discoverMedia(type, { ...baseParams, with_original_language: 'en' });
            
            let natives = (nativeData.results || []).slice(0, 20);
            const maxEnglish = Math.floor(natives.length * (3 / 7));
            let engs = natives.length === 0 ? (enData.results?.slice(0, 20) || []) : (enData.results?.slice(0, maxEnglish || 6) || []);

            const finalArr = [];
            let nIdx = 0, eIdx = 0;
            while (nIdx < natives.length || eIdx < engs.length) {
              if (nIdx < natives.length) finalArr.push(natives[nIdx++]);
              if (nIdx < natives.length) finalArr.push(natives[nIdx++]);
              if (eIdx < engs.length) finalArr.push(engs[eIdx++]);
            }
            typeResults = finalArr;
          } else if (langs.length > 0) {
            const p1 = await discoverMedia(type, { ...baseParams, with_original_language: langs.join('|'), page: '1' });
            const p2 = await discoverMedia(type, { ...baseParams, with_original_language: langs.join('|'), page: '2' });
            typeResults = [...(p1.results || []), ...(p2.results || [])];
          } else {
            const p1 = await discoverMedia(type, { ...baseParams, page: '1' });
            const p2 = await discoverMedia(type, { ...baseParams, page: '2' });
            typeResults = [...(p1.results || []), ...(p2.results || [])];
          }
          return typeResults.map(item => ({ ...item, media_type: type }));
        };

        if (mediaType === 'all') {
          const [movies, tvShows] = await Promise.all([fetchByType('movie'), fetchByType('tv')]);
          
          let mIdx = 0, tIdx = 0;
          while (mIdx < movies.length || tIdx < tvShows.length) {
            // 2 movies for every 1 TV show = 33% TV shows
            if (mIdx < movies.length) combinedResults.push(movies[mIdx++]);
            if (mIdx < movies.length) combinedResults.push(movies[mIdx++]);
            if (tIdx < tvShows.length) combinedResults.push(tvShows[tIdx++]);
          }
        } else {
          combinedResults = await fetchByType(mediaType);
        }

        // Deduplicate
        const seen = new Set();
        const uniqueResults = combinedResults.filter(item => {
           if (seen.has(item.id)) return false;
           seen.add(item.id);
           return true;
        });

        if (uniqueResults.length > 0) {
          setRecommendations(uniqueResults.slice(0, 30));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetchRecommendations();
  }, [preferences.preferredGenres, preferences.adultContent, preferences.originalLanguage, mediaType]);

  const handleRefresh = () => {
    setRecommendations(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <HorizontalRow 
        title={isFallback ? "Critically Loved Movies" : "Recommended For You"} 
        subtitle={isFallback ? undefined : "Based on your taste"}
        actionNode={
          !isFallback && (
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors group"
              aria-label="Refresh recommendations"
            >
              <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
          )
        }
        items={recommendations.slice(0, 15)} 
        seeAllHref={`/recommended/${mediaType}`}
      />
    </div>
  );
}
