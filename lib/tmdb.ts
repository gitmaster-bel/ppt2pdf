import { TMDBResponse, Media, MediaDetails } from "@/types/tmdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const PROXY_BASE_URL = "https://db.videasy.net/3";

export async function fetchTMDB<T>(
  path: string,
  params: Record<string, string> = {},
  options: { forceProxy?: boolean } = {}
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || apiKey === "YOUR_TMDB_API_KEY") {
    throw new Error("NO_API_KEY");
  }

  const queryParams = new URLSearchParams(params);
  queryParams.append("api_key", apiKey);
  const queryString = queryParams.toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  // ── Revalidation strategy ────────────────────────────────────────────────
  // - Search endpoints: 86400s (24h)
  // - Trending/popular/discover/details: 604800s (7 days)
  const isSearch = path.startsWith('/search');
  const revalidateSeconds = isSearch ? 86400 : 604800;

  const executeFetch = async (baseUrl: string, isFallback = false): Promise<T> => {
    const url = `${baseUrl}${path}?${queryString}`;
    try {
      const res = await fetch(url, {
        next: { revalidate: revalidateSeconds },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`TMDB API Error: ${res.status} ${res.statusText}`);
      }

      // Development-only logging — never runs in production (saves 121K log writes/12h)
      if (process.env.NODE_ENV === 'development') {
        const tag = isFallback ? '⚠️ FALLBACK' : '✅';
        console.log(`[TMDB ${tag}] ${path}`);
      }

      return res.json() as Promise<T>;
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[TMDB ❌] ${path} | ${msg}`);
      }
      throw err;
    }
  };

  try {
    if (options.forceProxy) {
      return await executeFetch(PROXY_BASE_URL);
    } else {
      return await executeFetch(TMDB_BASE_URL);
    }
  } catch (err) {
    if (!options.forceProxy) {
      // Primary TMDB API failed — silently fall back to proxy
      return await executeFetch(PROXY_BASE_URL, true);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const MOCK_IDS = [
  {
    id: 157336,
    title: "Interstellar",
    type: "movie",
    bg: "/mbm8k3GFhXS0ROd9AD1gqYbIFbM.jpg",
    poster: "/gEU2QlsUUQZnSnDi8OUF0HQBhiH.jpg",
  },
  {
    id: 27205,
    title: "Inception",
    type: "movie",
    bg: "/s3TBrRGB1invgH3na56P5q2k4nZ.jpg",
    poster: "/oYuLEtOZeTCEiOeezPEhqN266n3.jpg",
  },
  {
    id: 1399,
    title: "Game of Thrones",
    type: "tv",
    bg: "/zZOMfX2hhegA0A5z3oP5JAlrK7c.jpg",
    poster: "/1XS1oqL89opfnbLl3WnZY1O1uJx.jpg",
  },
  {
    id: 550,
    title: "Fight Club",
    type: "movie",
    bg: "/hZkgoQYus5iQzjKXCZ9PNkZIN4F.jpg",
    poster: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  },
  {
    id: 63840,
    title: "Narcos",
    type: "tv",
    bg: null,
    poster: null,
  },
  {
    id: 155,
    title: "The Dark Knight",
    type: "movie",
    bg: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    poster: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  },
];

const getMockMedia = (i: number, t: string = "movie"): Media => {
  const m = MOCK_IDS[i % MOCK_IDS.length];
  return {
    id: m.id,
    title: t === "tv" ? undefined : m.title,
    name: t === "tv" || m.type === "tv" ? m.title : undefined,
    overview:
      "This is premium fallback content. Please add a valid TMDB_API_KEY in your settings to view live data. " +
      m.title +
      " is a fantastic watch!",
    poster_path: m.poster,
    backdrop_path: m.bg,
    media_type: m.type as any,
    genre_ids: [12, 16],
    popularity: 900,
    vote_average: 9.0,
    vote_count: 1000,
    release_date: "2014-11-05",
    first_air_date: "2014-11-05",
  };
};

const filterUnreleased = (results: any[]) => {
  if (!results) return [];
  const now = new Date().toISOString().split('T')[0];
  return results.filter(item => {
    if (item.media_type === 'person') return true;
    const date = item.release_date || item.first_air_date;
    if (!date) return false;
    return date <= now;
  });
};

export const tmdb = {
  getTrending: async (type: "all" | "movie" | "tv" | "person" = "all") =>
    fetchTMDB<TMDBResponse<any>>(`/trending/${type}/week`).then(res => {
      res.results = filterUnreleased(res.results);
      return res;
    }).catch(() => ({
      page: 1,
      results: Array.from({ length: 12 }).map((_, i) =>
        type === "person" ? { id: i, name: "Fallback Person", profile_path: null, known_for: [] } : getMockMedia(i, type === "all" ? "movie" : type),
      ),
      total_pages: 1,
      total_results: 12,
    })),
  getPopular: async (type: "movie" | "tv") =>
    fetchTMDB<TMDBResponse<Media>>(`/${type}/popular`).then(res => {
      res.results = filterUnreleased(res.results);
      return res;
    }).catch(() => ({
      page: 1,
      results: Array.from({ length: 12 }).map((_, i) => getMockMedia(i, type)),
      total_pages: 1,
      total_results: 12,
    })),
  getTopRated: async (type: "movie" | "tv") =>
    fetchTMDB<TMDBResponse<Media>>(`/${type}/top_rated`).then(res => {
      res.results = filterUnreleased(res.results);
      return res;
    }).catch(() => ({
      page: 1,
      results: Array.from({ length: 12 }).map((_, i) => getMockMedia(i, type)),
      total_pages: 1,
      total_results: 12,
    })),
  getDetails: async (type: "movie" | "tv", id: string) =>
    fetchTMDB<MediaDetails>(`/${type}/${id}`, {
      append_to_response: "credits,similar,videos",
    }).catch(
      () =>
        ({
          ...getMockMedia(parseInt(id, 10) || 0, type),
          genres: [],
          status: "Released",
          tagline: "Fallback loaded!",
        }) as any,
    ),
  getSeasonDetails: async (tvId: string, seasonNumber: number) =>
    fetchTMDB<any>(`/tv/${tvId}/season/${seasonNumber}`).catch(() => ({
      episodes: Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        episode_number: i + 1,
        name: `Episode ${i + 1}`,
        overview: "This is a mock episode overview because the API key is missing.",
        still_path: null,
      })),
    })),
  search: async (query: string, includeAdult: boolean = false) => {
    try {
      const include_adult = includeAdult ? 'true' : 'false';
      const page1 = await fetchTMDB<TMDBResponse<Media>>("/search/multi", { query, page: "1", include_adult });
      
      let results = [...page1.results];
      if (page1.total_pages > 1) {
        try {
          const page2 = await fetchTMDB<TMDBResponse<Media>>("/search/multi", { query, page: "2", include_adult });
          results = [...results, ...page2.results];
        } catch (e) {
          // ignore page 2 failure
        }
      }
      
      return {
        ...page1,
        results: results.filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        )
      };
    } catch (err) {
      return {
        page: 1,
        results: Array.from({ length: 12 }).map((_, i) =>
          getMockMedia(i, "movie"),
        ),
        total_pages: 1,
        total_results: 12,
      };
    }
  },
  getAnime: async (page: string = "1") =>
    fetchTMDB<TMDBResponse<Media>>("/discover/tv", {
      with_genres: "16",
      with_original_language: "ja",
      page,
    }).then(res => {
      res.results = filterUnreleased(res.results);
      return res;
    }).catch(() => ({
      page: 1,
      results: Array.from({ length: 12 }).map((_, i) => getMockMedia(i, "tv")),
      total_pages: 1,
      total_results: 12,
    })),
  discover: async (type: "movie" | "tv", params: Record<string, string> = {}) =>
    fetchTMDB<TMDBResponse<Media>>(`/discover/${type}`, params).then(res => {
      res.results = filterUnreleased(res.results);
      return res;
    }).catch(() => ({
      page: 1,
      results: Array.from({ length: 12 }).map((_, i) => getMockMedia(i, type)),
      total_pages: 1,
      total_results: 12,
    })),
  discoverGlobalProvider: async (providerId: string, baseRegion: string = 'US') => {
    // Fetch from top regions to create a rich global catalog
    const regions = [baseRegion, 'US', 'IN', 'GB'];
    const uniqueRegions = Array.from(new Set(regions)).slice(0, 3); // Limit to 3 to avoid rate limits

    const moviePromises = uniqueRegions.map(region => 
      fetchTMDB<TMDBResponse<Media>>(`/discover/movie`, {
        with_watch_providers: providerId,
        watch_region: region,
        sort_by: 'popularity.desc'
      }, undefined).catch(() => ({ results: [] }))
    );

    const tvPromises = uniqueRegions.map(region => 
      fetchTMDB<TMDBResponse<Media>>(`/discover/tv`, {
        with_watch_providers: providerId,
        watch_region: region,
        sort_by: 'popularity.desc'
      }, undefined).catch(() => ({ results: [] }))
    );

    const [movieRes, tvRes] = await Promise.all([
      Promise.all(moviePromises),
      Promise.all(tvPromises)
    ]);

    const allMovies = movieRes.flatMap(r => r.results || []);
    const allTv = tvRes.flatMap(r => r.results || []);
    
    // Combine and mark media_type if missing
    const combined = [
      ...allMovies.map(m => ({ ...m, media_type: m.media_type || 'movie' })),
      ...allTv.map(t => ({ ...t, media_type: t.media_type || 'tv' }))
    ];

    // Deduplicate
    const uniqueMap = new Map();
    for (const item of combined) {
      if (item && item.id) {
        uniqueMap.set(`${item.media_type}-${item.id}`, item);
      }
    }
    
    let deduped = Array.from(uniqueMap.values()) as Media[];
    deduped = filterUnreleased(deduped);
    deduped.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return { results: deduped };
  },
  getPerson: async (id: string) =>
    fetchTMDB<any>(`/person/${id}`, {
      append_to_response: "combined_credits",
    }).catch(() => null),
  getImages: async (type: "movie" | "tv", id: string) =>
    fetchTMDB<any>(`/${type}/${id}/images`, { include_image_language: "en,null" }).catch(() => null),
  getCollection: async (id: string, forceProxy?: boolean) =>
    fetchTMDB<any>(`/collection/${id}`, {}, { forceProxy }).catch(() => null),
  searchCollections: async (query: string, page: number = 1) =>
    fetchTMDB<TMDBResponse<any>>("/search/collection", { query, page: page.toString() }).catch(() => ({
      page: 1,
      results: [],
      total_pages: 1,
      total_results: 0,
    })),
  getWatchProviders: async (type: "movie" | "tv", id: string) =>
    fetchTMDB<any>(`/${type}/${id}/watch/providers`).catch(() => null),
};

export const getImageUrl = (
  path: string | null,
  size: "original" | "w500" | "w780" | "w1280" = "w1280",
  title?: string,
  year?: string
) => {
  if (!path || path === "/xoarZqQav1T9r6TzylsB2x1q0v6.jpg" || path === "/vWpeqwGcGZAm724HwO2yK8xLheP.jpg") {
    if (title) {
      // Create a beautifully designed SVG fallback
      const encodedTitle = encodeURIComponent(title.length > 25 ? title.substring(0, 25) + '...' : title).replace(/'/g, "%27");
      const encodedYear = year ? encodeURIComponent(year) : '';
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231f1f2e' /%3E%3Cstop offset='100%25' stop-color='%230d0d12' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='600' fill='url(%23grad)'/%3E%3Crect width='400' height='600' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='4'/%3E%3Ctext x='50%25' y='45%25' font-family='system-ui, -apple-system, sans-serif' font-size='28' font-weight='800' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3E${encodedTitle}%3C/text%3E%3Ctext x='50%25' y='53%25' font-family='system-ui, -apple-system, sans-serif' font-size='18' font-weight='600' fill='%23a1a1aa' text-anchor='middle' dominant-baseline='middle' letter-spacing='2'%3E${encodedYear}%3C/text%3E%3C/svg%3E`;
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect width='400' height='600' fill='%2318181b'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%2352525b' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
  }
  
  // CRITICAL: Since Vercel Image Optimization is disabled to bypass the 1000 limit, 
  // we must never serve "original" (3MB+ files) directly to the user's browser.
  // We force downgrade them to w1280 (HD, ~150kb) which looks identical but loads instantly.
  const optimizedSize = size === "original" ? "w1280" : size;
  
  return `https://image.tmdb.org/t/p/${optimizedSize}${path}`;
};

export async function getHeroItemsWithLogos(items: Media[]) {
  return Promise.all(
    items.map(async (item) => {
      try {
        const type = (item.media_type === 'person' ? 'movie' : item.media_type) || (item.name ? 'tv' : 'movie');
        
        // Fetch both images and details concurrently
        const [images, details] = await Promise.all([
          tmdb.getImages(type as 'movie' | 'tv', item.id.toString()),
          tmdb.getDetails(type as 'movie' | 'tv', item.id.toString())
        ]);
        
        let logo_path = null;
        if (images && images.logos && images.logos.length > 0) {
          // Prefer english logos, fallback to first available
          const logo = images.logos.find((l: any) => l.iso_639_1 === 'en') || images.logos[0];
          logo_path = logo?.file_path;
        }
        
        return {
          ...item,
          ...(logo_path ? { logo_path } : {}),
          ...(details.number_of_seasons ? { number_of_seasons: details.number_of_seasons } : {})
        };
      } catch (e) {
        return item;
      }
    })
  );
}
