'use server';

import { tmdb, fetchTMDB } from '@/lib/tmdb';
import { Media, TMDBResponse } from '@/types/tmdb';

function fuzzyMatch(title: string, query: string): boolean {
  const cleanTitle = title.toLowerCase().trim();
  const cleanQuery = query.toLowerCase().trim();
  
  if (!cleanQuery) return true;
  
  // 1. Direct substring check
  if (cleanTitle.includes(cleanQuery)) return true;
  
  // 2. Word prefix check (e.g., query "was" matches "Wasseypur" in "Gangs of Wasseypur")
  const titleWords = cleanTitle.split(/[\s:,\-–—._]+/);
  if (titleWords.some(word => word.startsWith(cleanQuery))) return true;
  
  // 3. Acronym / Initials check (e.g. "g of w" or "gow" -> "Gangs of Wasseypur")
  const queryParts = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryParts.length > 1) {
    let titleWordIdx = 0;
    let matchCount = 0;
    for (const part of queryParts) {
      while (titleWordIdx < titleWords.length) {
        if (titleWords[titleWordIdx].startsWith(part)) {
          matchCount++;
          titleWordIdx++;
          break;
        }
        titleWordIdx++;
      }
    }
    if (matchCount === queryParts.length) return true;
  } else {
    // Single word query acronym check (e.g. "gow" -> "Gangs of Wasseypur")
    const initials = titleWords
      .filter(w => w.length > 0)
      .map(w => w[0])
      .join('');
    if (initials.includes(cleanQuery)) return true;
  }
  
  // 4. Space-stripped substring check
  const titleNoSpaces = cleanTitle.replace(/\s+/g, '');
  const queryNoSpaces = cleanQuery.replace(/\s+/g, '');
  if (titleNoSpaces.includes(queryNoSpaces)) return true;

  return false;
}

export async function searchMedia(
  query: string,
  page: number = 1,
  includeAdult: boolean = false,
  language: string = 'en-US'
): Promise<TMDBResponse<Media>> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      page: 1,
      results: [],
      total_pages: 1,
      total_results: 0,
    };
  }

  const include_adult = includeAdult ? 'true' : 'false';
  const params = {
    query: trimmedQuery,
    page: page.toString(),
    include_adult,
    language,
  };

  let moviesResults: Media[] = [];
  let tvResults: Media[] = [];
  let totalPages = 1;
  let totalResults = 0;

  try {
    const [moviesRes, tvRes] = await Promise.all([
      fetchTMDB<TMDBResponse<Media>>('/search/movie', params).catch(() => null),
      fetchTMDB<TMDBResponse<Media>>('/search/tv', params).catch(() => null),
    ]);

    if (moviesRes) {
      moviesResults = (moviesRes.results || []).map(item => ({ ...item, media_type: 'movie' }));
      totalPages = Math.max(totalPages, moviesRes.total_pages);
      totalResults += moviesRes.total_results;
    }
    if (tvRes) {
      tvResults = (tvRes.results || []).map(item => ({ ...item, media_type: 'tv' }));
      totalPages = Math.max(totalPages, tvRes.total_pages);
      totalResults += tvRes.total_results;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Search fetch failed:', err);
    }
  }

  // Combine and de-duplicate by ID
  let results = [...moviesResults, ...tvResults].filter((item, index, self) =>
    index === self.findIndex((t) => t.id === item.id)
  );

  // Filter out 'person' media types and unreleased content
  const now = new Date().toISOString().split('T')[0];
  results = results.filter(item => {
    if (item.media_type === 'person') return false;
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return false;
    if (releaseDate > now) return false;
    return true;
  });

  // Sort by popularity desc
  results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return {
    page,
    results,
    total_pages: totalPages,
    total_results: Math.max(results.length, totalResults),
  };
}

export async function getSearchSuggestions(): Promise<Media[]> {
  try {
    // Use direct fetch so Next.js can cache this at the data layer (1h TTL).
    // Previously tmdb.getTrending was called with no cache on every search page mount.
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return [];

    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=en-US`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    if (!res.ok) return [];

    const data = await res.json();
    const now = new Date().toISOString().split('T')[0];
    return ((data.results || []) as Media[]).filter((item) => {
      if (item.media_type === 'person') return false;
      const releaseDate = item.release_date || item.first_air_date;
      if (!releaseDate) return false;
      if (releaseDate > now) return false;
      return true;
    });
  } catch {
    return [];
  }
}


export async function discoverMedia(type: "movie" | "tv", params: Record<string, string>) {
  // Cache discover results at the data layer — same query params within 30 min hit this cache.
  // This dramatically reduces function invocations from the /discover page.
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return { results: [], total_pages: 1, total_results: 0 };
  const qs = new URLSearchParams({ ...params, api_key: apiKey }).toString();
  try {
    const res = await fetch(`https://api.themoviedb.org/3/discover/${type}?${qs}`, {
      next: { revalidate: 1800 }, // 30 min data-layer cache
    });
    if (!res.ok) return { results: [], total_pages: 1, total_results: 0 };
    const data = await res.json();
    if (data.results) {
      const now = new Date().toISOString().split('T')[0];
      data.results = data.results.filter((item: any) => {
        const date = item.release_date || item.first_air_date;
        if (!date) return false;
        return date <= now;
      });
    }
    return data;
  } catch {
    return { results: [], total_pages: 1, total_results: 0 };
  }
}

export async function getTopRatedAction(type: "movie" | "tv") {
  return await tmdb.getTopRated(type);
}

export async function getSeasonDetailsAction(tvId: string, seasonNumber: number) {
  return await tmdb.getSeasonDetails(tvId, seasonNumber);
}

export async function getTrailerAction(id: string, type: 'movie' | 'tv'): Promise<string | null> {
  try {
    const data = await fetchTMDB<any>(`/${type}/${id}/videos`);
    if (!data || !data.results) return null;
    
    // Find a YouTube trailer
    const trailer = data.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') 
                 || data.results.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser')
                 || data.results.find((v: any) => v.site === 'YouTube');
                 
    return trailer ? trailer.key : null;
  } catch (error) {
    return null;
  }
}

// ─── Schedule Action ──────────────────────────────────────────────────────────

export interface ScheduleParams {
  tab: 'released' | 'upcoming';
  type: 'all' | 'movie' | 'tv';
  gte: string;   // e.g. "2026-06-01"
  lte: string;   // e.g. "2026-06-30"
  country: string; // single country code, e.g. "US"
  page: number;
}

// Retry with exponential backoff — prevents silent TMDB rate-limit drops
async function fetchTMDBWithRetry<T>(url: string, params: Record<string, string>, retries = 2): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchTMDB<T>(url, params);
    } catch (err) {
      if (attempt === retries) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[TMDB] Failed after ${retries + 1} attempts for ${url}:`, err);
        }
        return null;
      }
      await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt))); // 600ms, 1.2s
    }
  }
  return null;
}

export async function fetchScheduleAction(params: ScheduleParams): Promise<TMDBResponse<Media>> {
  const { tab, type, gte, lte, page, country } = params;

  const movieSort = tab === 'released' ? 'primary_release_date.desc' : 'primary_release_date.asc';
  const tvSort    = tab === 'released' ? 'first_air_date.desc'        : 'first_air_date.asc';

  const baseParams: Record<string, string> = {
    language:        'en-US',
    include_adult:   'false',
    'vote_count.gte': '0',
    with_origin_country: country,
    page:            String(page),
  };

  const fetchMovies = type !== 'tv';
  const fetchTv     = type !== 'movie';

  let movieResults: Media[] = [];
  let tvResults:    Media[] = [];
  let maxTotalPages = 1;

  // Fetch movie + tv sequentially to be respectful of rate limits.
  // Each call is its own retried request.
  if (fetchMovies) {
    const res = await fetchTMDBWithRetry<TMDBResponse<Media>>('/discover/movie', {
      language:            'en-US',
      include_adult:       'false',
      sort_by:             movieSort,
      'release_date.gte':  gte,
      'release_date.lte':  lte,
      region:              country,          // use region for movies (wider match)
      page:                String(page),
    });
    if (res?.results) {
      movieResults = res.results.map(item => ({
        ...item,
        media_type: 'movie' as const,
        origin_country: item.origin_country?.length ? item.origin_country : [country],
      }));
      maxTotalPages = Math.max(maxTotalPages, res.total_pages);
    }
  }

  if (fetchTv) {
    const res = await fetchTMDBWithRetry<TMDBResponse<Media>>('/discover/tv', {
      language:              'en-US',
      include_adult:         'false',
      sort_by:               tvSort,
      'first_air_date.gte':  gte,
      'first_air_date.lte':  lte,
      with_origin_country:   country,        // origin country works well for TV
      page:                  String(page),
    });
    if (res?.results) {
      tvResults = res.results.map(item => ({
        ...item,
        media_type: 'tv' as const,
        origin_country: item.origin_country?.length ? item.origin_country : [country],
      }));
      maxTotalPages = Math.max(maxTotalPages, res.total_pages);
    }
  }

  // Combine and dedupe by (id, media_type)
  const seen = new Set<string>();
  const combined: Media[] = [];
  for (const item of [...movieResults, ...tvResults]) {
    const key = `${item.media_type}-${item.id}`;
    if (!seen.has(key)) { seen.add(key); combined.push(item); }
  }

  return {
    page,
    results: combined,
    total_pages: Math.max(1, maxTotalPages),
    total_results: combined.length,
  };
}

// ─── Collection Actions ───────────────────────────────────────────────────────

export async function getCollectionsAction(ids: number[], forceProxy: boolean = false) {
  const promises = ids.map(id => tmdb.getCollection(id.toString(), forceProxy));
  const data = await Promise.all(promises);
  return data.filter(Boolean);
}

// ─── getDynamicCollectionsAction ─────────────────────────────────────────────
// REPLACED: The original version made 150+ parallel TMDB calls per invocation
// (8 page fetches → ~150 movie detail fetches → collection fetches).
// Now uses the static curated list — zero live TMDB calls, instant response.
export async function getDynamicCollectionsAction(_pageChunk: number) {
  try {
    const { getCuratedCollectionsPool } = await import('@/lib/collectionsData');
    const { tmdb } = await import('@/lib/tmdb');
    const { uniqueIds, CURATED_TAGLINES } = getCuratedCollectionsPool();

    // Chunk the fetches to prevent network exhaustion
    const chunkSize = 20;
    const rawCollections = [];
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      const res = await Promise.all(chunk.map(id => tmdb.getCollection(id.toString()).catch(() => null)));
      rawCollections.push(...res);
    }

    const collections = rawCollections.filter(Boolean).map((c: any) => ({
      id: c.id,
      name: c.name.replace(' Collection', ''),
      backdrop: c.backdrop_path || (c.parts && c.parts.length > 0 ? c.parts[0].backdrop_path : null),
      poster: c.poster_path,
      movieCount: c.parts?.length || 0,
      tagline: CURATED_TAGLINES[c.id] || ''
    }));

    // Map to the shape the collections page expects
    const results = collections.map(c => ({
      id: c.id,
      name: c.name,
      backdrop_path: c.backdrop,
      poster_path: c.poster,
      overview: c.tagline,
      parts: Array.from({ length: c.movieCount }), // length hint for UI
    }));

    return {
      page: 1,
      results,
      total_pages: 1, // Static — no infinite scroll needed
    };
  } catch {
    return { page: 1, results: [], total_pages: 1 };
  }
}

export async function searchCollectionsAction(query: string, page: number = 1) {
  // 1. Hit the standard Collection search
  const collectionRes = await tmdb.searchCollections(query, page);
  let nativeResults = collectionRes.results || [];
  
  let finalCollections: any[] = [];
  
  // 2. The "Supercharged" Phase: Only on Page 1
  if (page === 1) {
    try {
      // Search for movies with the query
      const movieRes = await fetchTMDB<TMDBResponse<Media>>("/search/movie", { query, page: '1' });
      // Take top 20 most relevant movies to cast a wide net
      const topMovies = (movieRes.results || []).slice(0, 20);
      
      // Fetch full details for these 20 movies in parallel to find hidden collections
      const movieDetailsPromises = topMovies.map(m => fetchTMDB<any>(`/movie/${m.id}`).catch(() => null));
      const movieDetails = await Promise.all(movieDetailsPromises);
      
      // Extract unique collection IDs from the movies
      const newCollectionIds = new Set<number>();
      movieDetails.forEach(movie => {
        if (movie && movie.belongs_to_collection) {
          newCollectionIds.add(movie.belongs_to_collection.id);
        }
      });
      
      // Add the native collection IDs too
      nativeResults.forEach((c: any) => newCollectionIds.add(c.id));
      
      // Fetch the ACTUAL rich collection data for ALL found collections
      if (newCollectionIds.size > 0) {
        finalCollections = await getCollectionsAction(Array.from(newCollectionIds));
        
        // ULTIMATE SORTING: Sort by the number of movies in the franchise (largest first)
        finalCollections.sort((a, b) => {
          const aCount = a.parts ? a.parts.length : 0;
          const bCount = b.parts ? b.parts.length : 0;
          return bCount - aCount; // Descending
        });
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Supercharged search failed:', e);
      }
      finalCollections = nativeResults; // fallback
    }
  } else {
    // For page 2+, just use native results
    finalCollections = nativeResults;
  }

  // Deduplicate just to be safe
  finalCollections = finalCollections.filter((item: any, index: number, self: any[]) => 
    index === self.findIndex((t: any) => t.id === item.id)
  );

  return {
    ...collectionRes,
    results: finalCollections
  };
}

// ─── Provider Global Actions ──────────────────────────────────────────────────

export async function discoverGlobalProviderAction(
  providerId: string,
  type: 'movie' | 'tv',
  params: Record<string, string>,
  regions: string[]
) {
  try {
    const promises = regions.map(region => {
      const regionParams = { ...params, with_watch_providers: providerId, watch_region: region };
      return fetchTMDB<TMDBResponse<Media>>(`/discover/${type}`, regionParams).catch(() => null);
    });

    const responses = await Promise.all(promises);
    
    // Merge and deduplicate
    let allResults: Media[] = [];
    let maxPage = 1;
    let maxTotalPages = 1;

    responses.forEach(res => {
      if (res) {
        if (res.results) allResults.push(...res.results);
        if (res.page > maxPage) maxPage = res.page;
        if (res.total_pages > maxTotalPages) maxTotalPages = res.total_pages;
      }
    });

    // Deduplicate by ID
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
    
    // Sort by popularity descending since that's the default
    uniqueResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return {
      page: params.page ? parseInt(params.page) : 1,
      results: uniqueResults,
      total_pages: maxTotalPages,
      total_results: uniqueResults.length
    };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Global provider fetch failed:', e);
    }
    return { page: 1, results: [], total_pages: 1, total_results: 0 };
  }
}

export async function searchProviderAction(
  query: string,
  providerId: string,
  type: 'movie' | 'tv',
  region: string,
  page: number = 1
) {
  try {
    // 1. Fetch search results for the given type
    const searchRes = await fetchTMDB<TMDBResponse<Media>>(`/search/${type}`, {
      query,
      page: page.toString(),
      include_adult: 'false'
    }).catch(() => null);

    if (!searchRes || !searchRes.results || searchRes.results.length === 0) {
      return { page, results: [], total_pages: 1, total_results: 0 };
    }

    // 2. For each result, fetch its watch providers
    const items = searchRes.results;
    const providerPromises = items.map(item => tmdb.getWatchProviders(type, item.id.toString()));
    const providersArray = await Promise.all(providerPromises);

    // 3. Filter items that are available on the requested provider
    const filteredItems = items.filter((item, index) => {
      const providers = providersArray[index];
      if (!providers || !providers.results) return false;

      const targetProviderId = parseInt(providerId, 10);

      const checkRegion = (regData: any) => {
        if (!regData) return false;
        const allOptions = [
          ...(regData.flatrate || []),
          ...(regData.free || []),
          ...(regData.ads || [])
        ];
        return allOptions.some(p => p.provider_id === targetProviderId);
      };

      if (region === 'ALL') {
        // Global search: check if ANY region has this provider
        return Object.values(providers.results).some(regData => checkRegion(regData));
      } else {
        // Specific region search
        return checkRegion(providers.results[region]);
      }
    });

    return {
      page: searchRes.page,
      results: filteredItems,
      total_pages: searchRes.total_pages,
      total_results: searchRes.total_results // Note: this is the unfiltered total, used for pagination boundary
    };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Provider search failed:', e);
    }
    return { page: 1, results: [], total_pages: 1, total_results: 0 };
  }
}


export async function getRegionalTrendingAction(countryCode: string) {
  try {
    const { tmdb } = await import('@/lib/tmdb');
    const [movie1, movie2, tv1, tv2, targetTvDetails] = await Promise.all([
      tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '1' }).catch(() => null),
      tmdb.discover('movie', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '2' }).catch(() => null),
      tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '1' }).catch(() => null),
      tmdb.discover('tv', { with_origin_country: countryCode, sort_by: 'popularity.desc', 'vote_count.gte': '10', page: '2' }).catch(() => null),
      countryCode.toUpperCase() === 'IN' ? tmdb.getDetails('tv', '262838').catch(() => null) : Promise.resolve(null)
    ]);

    const movies = [...(movie1?.results || []), ...(movie2?.results || [])].slice(0, 20);
    const shows = [...(tv1?.results || []), ...(tv2?.results || [])].slice(0, 20);
    
    let combined: any[] = [];
    const maxLen = Math.max(movies.length, shows.length);
    for (let i = 0; i < maxLen; i++) {
      if (movies[i]) combined.push({ ...movies[i], media_type: 'movie' });
      if (shows[i]) combined.push({ ...shows[i], media_type: 'tv' });
    }

    // De-duplicate
    combined = combined.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );

    // De-duplicate movies and shows arrays as well
    let finalMovies = movies.map(m => ({...m, media_type: 'movie'})).filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
    let finalShows = shows.map(s => ({...s, media_type: 'tv'})).filter((item, index, self) => index === self.findIndex(t => t.id === item.id));

    // Injection of TV 262838 in India
    if (targetTvDetails && countryCode.toUpperCase() === 'IN') {
      const targetTv = { ...targetTvDetails, media_type: 'tv' };
      // Filter out if already in array
      combined = combined.filter(item => item.id !== targetTv.id);
      finalShows = finalShows.filter(item => item.id !== targetTv.id);
      
      // Place in first 5 slots (index 0 to 4) randomly
      const getDailyRandom = () => {
        const d = new Date();
        let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      };
      const insertIdx = Math.floor(getDailyRandom()() * Math.min(5, combined.length + 1));
      
      combined.splice(insertIdx, 0, targetTv);
      finalShows.splice(Math.min(insertIdx, finalShows.length), 0, targetTv);
    }

    return { results: combined, movies: finalMovies, shows: finalShows };
  } catch (e) {
    return { results: [], movies: [], shows: [] };
  }
}

export async function getHistorySimilarsAction(historyData: { id: string, type: 'movie'|'tv', progress: number }[]) {
  try {
    const { tmdb } = await import('@/lib/tmdb');
    // 1. Filter out items watched > 50%
    const validHistory = historyData.filter(h => h.progress < 0.5).slice(0, 5); // Limit to top 5 recent valid ones
    
    const allSimilar: any[] = [];
    
    // 2. Fetch details AND similars for each
    await Promise.all(validHistory.map(async (seed) => {
      try {
        // We need the original language of the seed to match
        const details = await tmdb.getDetails(seed.type, seed.id);
        const originalLang = details?.original_language;
        
        const similarsRes = await tmdb.getSimilar(seed.type, seed.id);
        if (similarsRes && similarsRes.results && similarsRes.results.length > 0) {
          // Filter similars by same language
          let matching = similarsRes.results;
          if (originalLang) {
             matching = matching.filter(m => m.original_language === originalLang);
          }
          
          if (matching.length > 0) {
            // Sort by vote average or popularity
            matching.sort((a, b) => b.vote_average - a.vote_average);
            // Pick ONLY ONE top rated
            allSimilar.push(matching[0]);
          }
        }
      } catch (e) {
        // ignore individual failures
      }
    }));
    
    // Deduplicate
    const unique = Array.from(new Map(allSimilar.map(item => [item.id, item])).values());
    
    // Final sort
    unique.sort((a, b) => b.popularity - a.popularity);
    
    return unique;
  } catch (e) {
    return [];
  }
}

const getRegionalLangs = (countryCode: string) => {
  const regionalLangs: Record<string, string[]> = {
    'IN': ['hi', 'te', 'ta', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'ur', 'or', 'as'],
    'PK': ['ur', 'pa', 'sd', 'ps'],
    'JP': ['ja'],
    'KR': ['ko'],
    'BR': ['pt'],
    'ES': ['es'],
    'FR': ['fr'],
    'DE': ['de'],
    'IT': ['it'],
    'MX': ['es'],
    'PH': ['tl', 'fil'],
    'TH': ['th'],
    'ID': ['id'],
    'TR': ['tr']
  };
  return regionalLangs[countryCode.toUpperCase()]?.join('|') || '';
};

export async function getRegionalProviderShelvesAction(countryCode: string) {
  try {
    const isRegional = countryCode !== 'US' && countryCode !== 'GB' && countryCode !== 'CA' && countryCode !== 'AU';
    const curCode = countryCode.toUpperCase();
    
    const [
      netflixDataPage1,
      netflixDataPage2,
      primeDataPage1,
      primeDataPage2,
      disneyDataPage1,
      disneyDataPage2,
      hboDataPage1,
      hboDataPage2,
      regionalMovies,
      regionalTv,
      globalMovies,
      globalTv,
      jioGlobalMovies,
      jioGlobalTv,
      jioRegionalMovies,
      jioRegionalTv
    ] = await Promise.all([
      tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '8', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '9', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '337', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '337', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: 'US', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })),
      tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: 'US', sort_by: 'popularity.desc', page: '2' }).catch(() => ({ results: [] })),
      isRegional ? tmdb.discover('movie', { with_watch_providers: '8', watch_region: curCode, with_original_language: getRegionalLangs(curCode), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      isRegional ? tmdb.discover('tv', { with_watch_providers: '8', watch_region: curCode, with_original_language: getRegionalLangs(curCode), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      isRegional ? tmdb.discover('movie', { with_watch_providers: '119|9', watch_region: curCode, with_original_language: getRegionalLangs(curCode), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      isRegional ? tmdb.discover('tv', { with_watch_providers: '119|9', watch_region: curCode, with_original_language: getRegionalLangs(curCode), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      curCode === 'IN' ? tmdb.discover('movie', { with_watch_providers: '2336', watch_region: 'IN', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      curCode === 'IN' ? tmdb.discover('tv', { with_watch_providers: '2336', watch_region: 'IN', sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      curCode === 'IN' ? tmdb.discover('movie', { with_watch_providers: '2336', watch_region: 'IN', with_original_language: getRegionalLangs('IN'), sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] }),
      curCode === 'IN' ? tmdb.discover('tv', { with_watch_providers: '2336', watch_region: 'IN', with_original_language: getRegionalLangs('IN'), sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] })) : Promise.resolve({ results: [] })
    ]);

    const netflixData = { results: [...(netflixDataPage1?.results || []), ...(netflixDataPage2?.results || [])] };
    const primeData = { results: [...(primeDataPage1?.results || []), ...(primeDataPage2?.results || [])] };
    const disneyData = { results: [...(disneyDataPage1?.results || []), ...(disneyDataPage2?.results || [])] };
    const hboData = { results: [...(hboDataPage1?.results || []), ...(hboDataPage2?.results || [])] };

    const getMixed = (regionalMovies: any, regionalTv: any, globalMovies: any, globalTv: any) => {
      const rM = (regionalMovies || []).map((m: any) => ({...m, media_type: 'movie'}));
      const rT = (regionalTv || []).map((t: any) => ({...t, media_type: 'tv'}));
      const rLangs = getRegionalLangs(curCode).split('|').filter(Boolean);

      const isGlobalStrict = (item: any) => {
        const originCountries = item.origin_country || [];
        if (originCountries.includes(curCode)) return false;
        if (rLangs.includes(item.original_language)) return false;
        return true;
      };

      const gM = (globalMovies || []).map((m: any) => ({...m, media_type: 'movie'})).filter(isGlobalStrict);
      const gT = (globalTv || []).map((t: any) => ({...t, media_type: 'tv'})).filter(isGlobalStrict);

      // 1. Regional Bucket (10 items)
      const shuffledRT = rT.sort(() => Math.random() - 0.5);
      const regionalTvSelected = shuffledRT.slice(0, 3);
      const remainingRegional = [...shuffledRT.slice(3), ...rM].sort(() => Math.random() - 0.5);
      let regionalBucket = [...regionalTvSelected, ...remainingRegional.slice(0, 7)];
      regionalBucket.sort(() => Math.random() - 0.5);
      const pinnedRegional = regionalBucket.slice(0, 3);
      const unpinnedRegional = regionalBucket.slice(3);

      // 2. Global Bucket (10 items)
      const shuffledGT = gT.sort(() => Math.random() - 0.5);
      const globalTvSelected = shuffledGT.slice(0, 3);
      const remainingGlobal = [...shuffledGT.slice(3), ...gM].sort(() => Math.random() - 0.5);
      let globalBucket = [...globalTvSelected, ...remainingGlobal.slice(0, 7)];

      // 3. Final Arrangement
      const mixedRest = [...unpinnedRegional, ...globalBucket].sort(() => Math.random() - 0.5);
      const mixed = [...pinnedRegional, ...mixedRest];

      return Array.from(new Map(mixed.map(item => [item.id, item])).values()).slice(0, 20);
    };

    const netflixMixed = isRegional ? getMixed(regionalMovies?.results, regionalTv?.results, netflixDataPage1?.results, netflixDataPage2?.results) : netflixData.results.slice(0, 20);
    const primeMixed = isRegional ? getMixed(globalMovies?.results, globalTv?.results, primeDataPage1?.results, primeDataPage2?.results) : primeData.results.slice(0, 20);
    const jioMixed = curCode === 'IN' ? getMixed(jioRegionalMovies?.results, jioRegionalTv?.results, jioGlobalMovies?.results, jioGlobalTv?.results) : [];

    return {
      netflix: netflixMixed as Media[],
      prime: primeMixed as Media[],
      disney: disneyData.results.slice(0, 20) as Media[],
      hbo: hboData.results.slice(0, 20) as Media[],
      jio: jioMixed as Media[]
    };
  } catch (e) {
    return null;
  }
}
