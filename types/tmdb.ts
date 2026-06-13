export interface Media {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string | null;
  media_type: 'movie' | 'tv' | 'person';
  genre_ids: number[];
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  origin_country?: string[];
}

export interface MediaDetails extends Media {
  genres: { id: number; name: string }[];
  runtime?: number;
  belongs_to_collection?: { id: number; name: string; poster_path: string; backdrop_path: string };
  created_by?: any[];
  episode_run_time?: number[];
  status: string;
  tagline: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: Season[];
  similar?: {
    results: Media[];
  };
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos?: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  networks?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  vote_count: number;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
