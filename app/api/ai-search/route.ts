import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Switch to the requested proxy API
const TMDB_BASE = 'https://db.videasy.to/3';
// Fallback to a placeholder if no token is set (the proxy might not even need it, but good practice)
const TOKEN = process.env.TMDB_ACCESS_TOKEN || 'test';

// ── Helpers ─────────────────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyIncludes(text: string, word: string, maxDist = 1): boolean {
  const tokens = text.split(/\s+/);
  for (const t of tokens) {
    if (Math.abs(t.length - word.length) <= maxDist) {
      if (levenshtein(t, word) <= maxDist) return true;
    }
  }
  return false;
}

// ── Dictionaries ────────────────────────────────────────────────────────────
const GENRE_MAP: Record<string, number> = {
  action: 28, actions: 28,
  adventure: 12, adventures: 12,
  animation: 16, animations: 16, animated: 16, cartoon: 16, cartoons: 16, anime: 16,
  comedy: 35, comedies: 35, funny: 35, humor: 35, humorous: 35,
  crime: 80, crimes: 80,
  documentary: 99, documentaries: 99, docu: 99, docus: 99,
  drama: 18, dramas: 18, dramatic: 18,
  family: 10751, kids: 10751, children: 10751,
  fantasy: 14, fantasies: 14, magic: 14, magical: 14,
  history: 36, historical: 36, biography: 36, biographical: 36,
  horror: 27, horrors: 27, scary: 27, spooky: 27, creep: 27, creepy: 27, zombie: 27, zombies: 27,
  music: 10402, musical: 10402, musicals: 10402, song: 10402, songs: 10402,
  mystery: 9648, mysteries: 9648, detective: 9648, puzzle: 9648,
  romance: 10749, romantic: 10749, love: 10749, romcom: 10749,
  'sci-fi': 878, scifi: 878, 'science fiction': 878, sci_fi: 878, alien: 878, aliens: 878, space: 878, futuristic: 878,
  thriller: 53, thrillers: 53, suspense: 53,
  war: 10752, military: 10752, battle: 10752,
  western: 37, cowboy: 37, cowboys: 37,
  superhero: 28, superheroes: 28
};

const MOOD_MAP: Record<string, { genres: number[]; sort?: string }> = {
  'feel good':   { genres: [35, 10749], sort: 'vote_average.desc' },
  'uplifting':   { genres: [35, 12], sort: 'vote_average.desc' },
  'scary':       { genres: [27, 9648] },
  'dark':        { genres: [80, 53, 27] },
  'funny':       { genres: [35] },
  'romantic':    { genres: [10749] },
  'emotional':   { genres: [18, 10749], sort: 'vote_average.desc' },
  'exciting':    { genres: [28, 12, 53] },
  'mindblowing': { genres: [878, 9648], sort: 'vote_average.desc' },
  'mind blowing':{ genres: [878, 9648], sort: 'vote_average.desc' },
  'nostalgic':   { genres: [10751, 12, 35] },
  'sad':         { genres: [18] },
  'happy':       { genres: [35, 10751] },
  'intense':     { genres: [53, 28] },
  'creepy':      { genres: [27] }
};

const STOP_WORDS = new Set([
  'movie','movies','film','films','series','show','shows','tv','best','top','popular','trending','new','latest',
  'recent','good','great','amazing','like','similar','to','about','with','in','the','a','an','of','and','or','on','for',
  'directed','director','directors','directs','starring','star','stars','acted','acting','actor','actors','featuring','feature','features','by',
  'from','since','before','after','under','over','at'
]);

const LANGUAGE_MAP: Record<string, string> = {
  hindi: 'hi',
  tamil: 'ta',
  telugu: 'te',
  malayalam: 'ml',
  kannada: 'kn',
  bengali: 'bn',
  punjabi: 'pa',
  marathi: 'mr',
  gujarati: 'gu',
  urdu: 'ur',
  bhojpuri: 'bho',
  odia: 'or',
  assamese: 'as',
  japanese: 'ja',
  korean: 'ko',
  spanish: 'es',
  french: 'fr',
  italian: 'it',
  german: 'de',
  chinese: 'zh',
  mandarin: 'zh',
  cantonese: 'zh',
  russian: 'ru',
  english: 'en',
  portuguese: 'pt',
  turkish: 'tr',
  tagalog: 'tl',
  filipino: 'tl',
  dutch: 'nl',
  arabic: 'ar',
  polish: 'pl',
  swedish: 'sv',
  danish: 'da',
  norwegian: 'no',
  finnish: 'fi',
  thai: 'th',
  vietnamese: 'vi',
  indonesian: 'id',
  persian: 'fa',
  farsi: 'fa',
  hebrew: 'he'
};

// ── Parser ──────────────────────────────────────────────────────────────────
function parseQuery(q: string) {
  // Pre-process common decade words before removing non-word characters
  let processedQ = q.toLowerCase()
    .replace(/\bnineties\b/g, '90s')
    .replace(/\beighties\b/g, '80s')
    .replace(/\bseventies\b/g, '70s')
    .replace(/\bsixties\b/g, '60s')
    .replace(/\bfifties\b/g, '50s')
    .replace(/\btwenties\b/g, '20s');

  const lower = processedQ.replace(/[^\w\s]/g, '');
  
  // 1. "Similar to X" Intent Extraction
  const similarMatch = lower.match(/(?:movies|shows|series|films)?\s*(?:like|similar to|resembling)\s+(.+)/);
  let similarTitle = null;
  if (similarMatch && similarMatch[1]) {
    similarTitle = similarMatch[1].trim();
  }

  // 2. Type Detection
  let type: 'movie' | 'tv' | 'both' = 'both';
  if (/\b(series|show|shows|tv|seasons?|episodes?|anime|hentai)\b/.test(lower)) type = 'tv';
  else if (/\b(movies?|films?|cinemas?|flicks?)\b/.test(lower)) type = 'movie';

  // 3. Genre Detection (Fuzzy Typo Tolerant)
  const genres = new Set<number>();
  const tokens = lower.split(/\s+/);
  
  for (const [kw, id] of Object.entries(GENRE_MAP)) {
    if (kw.includes(' ')) {
      if (lower.includes(kw)) genres.add(id);
    } else {
      // 1 char typo allowed for words > 4 chars
      if (fuzzyIncludes(lower, kw, kw.length > 4 ? 1 : 0)) genres.add(id);
    }
  }

  // If hentai is searched, it is Japanese animation
  if (/\bhentai\b/.test(lower)) {
    genres.add(16); // Animation
  }

  // 4. Mood Detection (Fuzzy)
  let sort = 'popularity.desc';
  for (const [mood, cfg] of Object.entries(MOOD_MAP)) {
    if (mood.includes(' ')) {
      if (lower.includes(mood)) {
        cfg.genres.forEach(g => genres.add(g));
        if (cfg.sort) sort = cfg.sort;
      }
    } else {
      if (fuzzyIncludes(lower, mood, mood.length > 4 ? 1 : 0)) {
        cfg.genres.forEach(g => genres.add(g));
        if (cfg.sort) sort = cfg.sort;
      }
    }
  }

  // 5. Ranking Intent
  if (/\b(best|top|top rated|top-rated|highly rated|highly-rated|masterpiece|amazing|greatest)\b/.test(lower)) sort = 'vote_average.desc';
  if (/\b(popular|trending|famous|hype)\b/.test(lower)) sort = 'popularity.desc';
  if (/\b(new|latest|recent|202[0-9])\b/.test(lower)) sort = 'primary_release_date.desc';
  if (/\b(old|classic|retro|[2-9]0s)\b/.test(lower)) sort = 'primary_release_date.asc';

  // 6. Year Detection & Modifiers
  const beforeMatch = lower.match(/\b(?:before|prior to|older than|under|lt)\s+(19\d{2}|20\d{2})\b/);
  const afterMatch = lower.match(/\b(?:after|since|newer than|over|gt)\s+(19\d{2}|20\d{2})\b/);
  const yearMatch = lower.match(/\b(19\d{2}|20\d{2})\b/);

  let year = undefined;
  let releaseDateGte = null;
  let releaseDateLte = null;

  if (beforeMatch) {
    const yVal = parseInt(beforeMatch[1], 10);
    releaseDateLte = `${yVal - 1}-12-31`;
  } else if (afterMatch) {
    const yVal = parseInt(afterMatch[1], 10);
    releaseDateGte = `${yVal + 1}-01-01`;
  } else if (yearMatch) {
    year = yearMatch[1];
  }

  // 7. Min Rating & Quality Logic
  let minRating = 5; // default forgiving rating
  if (/\b(best|highly rated|masterpieces?|amazing|greatest|award[- ]winning|oscar[- ]winning)\b/.test(lower)) {
    minRating = 7.5;
    sort = 'vote_average.desc';
  } else if (/\b(good|decent)\b/.test(lower)) {
    minRating = 6.5;
  }

  // 8. Language Detection
  let languageCode = null;
  for (const [langName, langCode] of Object.entries(LANGUAGE_MAP)) {
    if (lower.includes(langName)) {
      languageCode = langCode;
      break;
    }
  }
  if ((lower.includes('anime') || lower.includes('hentai')) && !languageCode) {
    languageCode = 'ja';
  }

  // 9. Decade Detection
  let decadeText = null;
  const decadeMatch = lower.match(/\b(19\d{2}|20\d{2}|[2-9]0|00|10)\s*s\b/);
  if (decadeMatch) {
    let dec = decadeMatch[1];
    if (dec.length === 2) {
      if (dec === '00') dec = '2000';
      else if (dec === '10') dec = '2010';
      else if (dec === '20') dec = '2020';
      else dec = '19' + dec;
    }
    const yearStart = parseInt(dec, 10);
    releaseDateGte = `${yearStart}-01-01`;
    releaseDateLte = `${yearStart + 9}-12-31`;
    decadeText = `${dec}s`;
  }

  // 10. Adjectives Parsing
  let isUnderrated = false;
  let isOverrated = false;
  let isLessPopular = false;
  let isClassic = false;

  if (/\b(underrated|hidden gem|gems?|unappreciated|obscure)\b/.test(lower)) {
    isUnderrated = true;
  }
  if (/\b(overrated|hype|disappointment|bad|worst)\b/.test(lower)) {
    isOverrated = true;
  }
  if (/\b(less popular|less-popular|unpopular|unknown)\b/.test(lower)) {
    isLessPopular = true;
  }
  if (/\b(classic|retro|golden age|vintage|nostalgic)\b/.test(lower)) {
    isClassic = true;
  }
  if (/\b(cool|awesome|dope|badass|rad|epic)\b/.test(lower)) {
    [28, 12, 878, 53].forEach(g => genres.add(g));
  }

  // 11. Adult Content check
  let isAdultContentRequested = false;
  if (/\b(erotic|hentai|adult|sex|erotica|sensual|sexy|porn|xxx|nudity|nsfw|uncensored)\b/.test(lower)) {
    isAdultContentRequested = true;
  }

  // 11.b Person Role check
  let personRole: 'director' | 'actor' | 'any' = 'any';
  if (/\b(directed by|director|directors|directs)\b/.test(lower)) {
    personRole = 'director';
  } else if (/\b(starring|star|stars|acted by|acting|actor|actors|cast|featuring)\b/.test(lower)) {
    personRole = 'actor';
  }

  // 12. Person Name Candidate Extraction
  let personCandidate = null;
  const personMatch = lower.match(/\b(?:directed by|starring|with|acted by|featuring|by)\s+([a-z\s]+)/);
  if (personMatch && personMatch[1]) {
    let name = personMatch[1].trim();
    // Split at common prepositions to avoid trailing clutter like "from 1990s" or "in 2010"
    const prepMatch = name.match(/^(.+?)\s+\b(from|in|of|for|during|before|after|with|at|on|since|like|similar)\b/);
    if (prepMatch) {
      name = prepMatch[1].trim();
    }
    personCandidate = name;
  } else {
    const cleaned = tokens.filter(t => {
      if (STOP_WORDS.has(t)) return false;
      if (GENRE_MAP[t] || MOOD_MAP[t]) return false;
      if (LANGUAGE_MAP[t] || t === 'anime' || t === 'hentai') return false;
      if (/\b(19\d{2}|20\d{2}|[2-9]0|00|10)\s*s\b/.test(t)) return false;
      if (/\b(underrated|overrated|classic|cool|hentai|erotic|adult|sex|similar|like|popular|less|unpopular|unknown)\b/.test(t)) return false;
      return true;
    });
    // Allow single-name candidates as well (e.g. Scorsese, Spielberg, Tarantino, Nolan)
    if (cleaned.length >= 1 && cleaned.length <= 4) {
      personCandidate = cleaned.join(' ');
    }
  }

  if (personCandidate) {
    personCandidate = personCandidate.split(/\s+/).filter(w => !STOP_WORDS.has(w)).join(' ');
    if (personCandidate.length < 3 || LANGUAGE_MAP[personCandidate] || decadeMatch || /\b(underrated|overrated|classic|cool|hentai|erotic|adult|sex)\b/.test(personCandidate)) {
      personCandidate = null;
    }
  }

  // 13. Keyword Cleanup
  const cleanedTokens = tokens.filter(t => {
    if (STOP_WORDS.has(t)) return false;
    if (/\b(19|20)\d\d\b/.test(t)) return false;
    if (LANGUAGE_MAP[t]) return false;
    if (/\b(underrated|overrated|classic|cool|hentai|erotic|adult|sex|similar|like|popular|less|unpopular|unknown)\b/.test(t)) return false;
    if (/\b(19\d{2}|20\d{2}|[2-9]0|00|10)\s*s\b/.test(t)) return false;
    
    for (const kw of Object.keys(GENRE_MAP)) {
      if (!kw.includes(' ') && levenshtein(t, kw) <= (kw.length > 4 ? 1 : 0)) return false;
    }
    for (const mood of Object.keys(MOOD_MAP)) {
      if (!mood.includes(' ') && levenshtein(t, mood) <= (mood.length > 4 ? 1 : 0)) return false;
    }
    return true;
  });

  return { 
    type, 
    genres: Array.from(genres), 
    sort, 
    year, 
    minRating, 
    keywords: cleanedTokens.join(' '), 
    similarTitle,
    languageCode,
    releaseDateGte,
    releaseDateLte,
    decadeText,
    isUnderrated,
    isOverrated,
    isLessPopular,
    isClassic,
    isAdultContentRequested,
    personRole,
    personCandidate
  };
}

// ── API Fetchers ────────────────────────────────────────────────────────────

async function fetchTMDB(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    next: { revalidate: 300 }
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchKeywordIds(phrase: string): Promise<number[]> {
  const data = await fetchTMDB('/search/keyword', { query: phrase, page: '1' });
  if (!data || !data.results) return [];
  return data.results.slice(0, 3).map((k: any) => k.id);
}

async function fetchDiscover(mediaType: 'movie' | 'tv', params: Record<string, string>): Promise<any[]> {
  const isEnglish = !params.with_original_language || params.with_original_language === 'en';
  const defaultVoteCount = isEnglish ? '20' : '5';
  const data = await fetchTMDB(`/discover/${mediaType}`, {
    language: 'en-US',
    page: '1',
    'vote_count.gte': defaultVoteCount,
    ...params
  });
  return (data?.results || []).slice(0, 15).map((item: any) => ({ ...item, media_type: mediaType }));
}

async function fetchSearch(query: string, mediaType: 'movie' | 'tv' | 'multi'): Promise<any[]> {
  const data = await fetchTMDB(`/search/${mediaType}`, { query, language: 'en-US', page: '1' });
  return (data?.results || []).slice(0, 10).map((item: any) => ({ ...item, media_type: item.media_type || mediaType }));
}

async function fetchRecommendations(id: number, mediaType: 'movie' | 'tv'): Promise<any[]> {
  const data = await fetchTMDB(`/${mediaType}/${id}/recommendations`, { language: 'en-US', page: '1' });
  return (data?.results || []).slice(0, 15).map((item: any) => ({ ...item, media_type: mediaType }));
}

// ── Main Route ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ error: 'Query too short' }, { status: 400 });

  const parsed = parseQuery(q);
  const promises: Promise<any[]>[] = [];

  try {
    let personId: number | null = null;
    let personName: string | null = null;
    let personDepartment: string | null = null;
    let keywordIds: number[] = [];
    let shouldRunDiscover = false;

    if (parsed.personCandidate) {
      try {
        const personSearch = await fetchTMDB('/search/person', { query: parsed.personCandidate, page: '1' });
        if (personSearch && personSearch.results && personSearch.results.length > 0) {
          const bestPerson = personSearch.results[0];
          const nameTokensCount = parsed.personCandidate.trim().split(/\s+/).length;
          // Single-word last name lookup requires higher popularity threshold to avoid matching random titles
          // Multi-word name lookup uses a lower threshold (0.3) to match famous Indian/regional actors
          const minPopularity = nameTokensCount === 1 ? 8.0 : 0.3;
          if (bestPerson.popularity > minPopularity) {
            personId = bestPerson.id;
            personName = bestPerson.name;
            personDepartment = bestPerson.known_for_department;
          }
        }
      } catch (err) {
        console.error('Person lookup error:', err);
      }
    }

    if (personName) {
      const nameTokens = personName.toLowerCase().split(/\s+/);
      parsed.keywords = parsed.keywords.split(/\s+/).filter(w => !nameTokens.includes(w)).join(' ');
    }

    // ── SCENARIO A: "Similar to [Title]" Intent ──
    if (parsed.similarTitle) {
      const searchRes = await fetchSearch(parsed.similarTitle, 'multi');
      const bestMatch = searchRes.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
      if (bestMatch) {
        promises.push(fetchRecommendations(bestMatch.id, bestMatch.media_type as 'movie' | 'tv'));
      } else {
        promises.push(fetchSearch(parsed.similarTitle, 'multi'));
      }
    } 
    // ── SCENARIO B: Cast/Crew (Person) Credits Query ──
    else if (personId) {
      try {
        const credits = await fetchTMDB(`/person/${personId}/combined_credits`, {});
        if (credits) {
          const castList = (credits.cast || []).map((c: any) => ({ ...c, media_type: c.media_type || 'movie' }));
          const crewList = (credits.crew || []).map((c: any) => ({ ...c, media_type: c.media_type || 'movie' }));
          
          let mergedCredits = [];
          if (parsed.personRole === 'director') {
            mergedCredits = crewList.filter((c: any) => c.job === 'Director');
          } else if (parsed.personRole === 'actor') {
            mergedCredits = castList;
          } else {
            if (personDepartment === 'Directing') {
              const directingCrew = crewList.filter((c: any) => c.job === 'Director');
              const otherCrew = crewList.filter((c: any) => c.job !== 'Director');
              mergedCredits = [...directingCrew, ...castList, ...otherCrew];
            } else {
              mergedCredits = [...castList, ...crewList];
            }
          }
          
          const seenIds = new Set<string>();
          const personResults = mergedCredits.filter((item: any) => {
            const key = `${item.media_type}-${item.id}`;
            if (seenIds.has(key)) return false;
            seenIds.add(key);
            return true;
          });
          
          const filtered = personResults.filter((item: any) => {
            if (parsed.type !== 'both' && item.media_type !== parsed.type) return false;
            if (parsed.genres.length > 0) {
              const matchesGenre = parsed.genres.some((gId: number) => item.genre_ids?.includes(gId));
              if (!matchesGenre) return false;
            }
            if (parsed.languageCode && item.original_language !== parsed.languageCode) return false;
            
            const dateStr = item.release_date || item.first_air_date || '';
            if (parsed.releaseDateGte && dateStr && dateStr < parsed.releaseDateGte) return false;
            if (parsed.releaseDateLte && dateStr && dateStr > parsed.releaseDateLte) return false;
            if (parsed.year && dateStr.slice(0, 4) !== parsed.year) return false;
            
            if (parsed.isUnderrated && (item.vote_average || 0) < 7.0) return false;
            if (parsed.isOverrated && (item.vote_average || 0) > 6.0) return false;
            
            return true;
          });
          
          promises.push(Promise.resolve(filtered));
        }
      } catch (err) {
        console.error('Person credits fetch error:', err);
      }
    }
    // ── SCENARIO C: Natural Language / Keyword / Genre Discovery ──
    else {
      if (parsed.keywords.length > 2) {
        keywordIds = await fetchKeywordIds(parsed.keywords);
      }
      
      if (parsed.isAdultContentRequested) {
        const queryLower = q.toLowerCase();
        if (queryLower.includes('hentai')) {
          keywordIds.push(9818);
        }
        if (queryLower.includes('erotic') || queryLower.includes('erotica') || queryLower.includes('sex') || queryLower.includes('sensual')) {
          keywordIds.push(190342); // sexual relations
          keywordIds.push(9748);   // eroticism
          keywordIds.push(222243); // erotic movie
          keywordIds.push(155458); // nudity
        }
      }

      const buildParams = (mediaType: 'movie' | 'tv') => {
        const p: Record<string, string> = {
          sort_by: parsed.sort,
          'vote_average.gte': String(parsed.minRating),
        };
        if (parsed.genres.length > 0) p.with_genres = parsed.genres.slice(0, 3).join(',');
        if (keywordIds.length > 0) p.with_keywords = keywordIds.join('|');
        
        if (parsed.year) {
          if (mediaType === 'movie') p.primary_release_year = parsed.year;
          else p.first_air_date_year = parsed.year;
        }

        if (parsed.languageCode) {
          p.with_original_language = parsed.languageCode;
        }

        if (parsed.releaseDateGte) {
          if (mediaType === 'movie') {
            p['primary_release_date.gte'] = parsed.releaseDateGte;
          } else {
            p['first_air_date.gte'] = parsed.releaseDateGte;
          }
        }
        if (parsed.releaseDateLte) {
          if (mediaType === 'movie') {
            p['primary_release_date.lte'] = parsed.releaseDateLte;
          } else {
            p['first_air_date.lte'] = parsed.releaseDateLte;
          }
        }

        if (parsed.isUnderrated) {
          p.sort_by = 'vote_average.desc';
          p['vote_count.gte'] = '50';
          p['vote_count.lte'] = '1500';
          p['popularity.lte'] = '35';
          p['vote_average.gte'] = '7.0';
        } else if (parsed.isOverrated) {
          p.sort_by = 'popularity.desc';
          p['vote_average.lte'] = '6.0';
          p['vote_count.gte'] = '200';
        } else if (parsed.isLessPopular) {
          p.sort_by = 'vote_average.desc';
          p['popularity.lte'] = '20';
          p['vote_count.gte'] = '10';
        } else if (parsed.isClassic) {
          p.sort_by = 'vote_average.desc';
          p['vote_average.gte'] = '7.0';
          if (mediaType === 'movie') {
            p['primary_release_date.lte'] = '1999-12-31';
          } else {
            p['first_air_date.lte'] = '1999-12-31';
          }
        }

        if (parsed.isAdultContentRequested) {
          p.include_adult = 'true';
        }

        return p;
      };

      const hasFilters = parsed.genres.length > 0 || 
                         keywordIds.length > 0 || 
                         !!parsed.year || 
                         !!parsed.releaseDateGte || 
                         !!parsed.languageCode || 
                         parsed.isUnderrated || 
                         parsed.isOverrated || 
                         parsed.isClassic || 
                         parsed.isAdultContentRequested;

      // Run discover if we have active filters OR if there are no search keywords (implying a general query like "best movies")
      shouldRunDiscover = hasFilters || parsed.keywords.length <= 2;

      if (parsed.type === 'both' || parsed.type === 'movie') {
        if (shouldRunDiscover) {
          promises.push(fetchDiscover('movie', buildParams('movie')));
        }
        if (parsed.keywords.length > 2) {
          promises.push(fetchSearch(parsed.keywords, 'movie'));
        }
      }
      if (parsed.type === 'both' || parsed.type === 'tv') {
        if (shouldRunDiscover) {
          promises.push(fetchDiscover('tv', buildParams('tv')));
        }
        if (parsed.keywords.length > 2) {
          promises.push(fetchSearch(parsed.keywords, 'tv'));
        }
      }
    }

    const allResults = await Promise.all(promises);
    const merged = allResults.flat();

    const seen = new Set<string>();
    let unique = merged.filter(item => {
      if (!item || !item.id || item.media_type === 'person') return false;
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Fallback Retry if 0 results found (only for discovery/keyword searches) ──
    if (unique.length === 0 && !parsed.similarTitle && !personId) {
      console.log("No results. Executing fallback retry with relaxed constraints...");
      const fallbackPromises: Promise<any[]>[] = [];

      const buildFallbackParams = (mediaType: 'movie' | 'tv') => {
        const p: Record<string, string> = {
          sort_by: parsed.sort,
          'vote_average.gte': '2.0', // extremely low rating floor
          'vote_count.gte': '2'      // extremely low vote floor to capture regional indies
        };
        if (parsed.genres.length > 0) p.with_genres = parsed.genres.slice(0, 3).join(',');
        if (keywordIds.length > 0) p.with_keywords = keywordIds.join('|');
        
        if (parsed.year) {
          if (mediaType === 'movie') p.primary_release_year = parsed.year;
          else p.first_air_date_year = parsed.year;
        }
        if (parsed.languageCode) {
          p.with_original_language = parsed.languageCode;
        }
        if (parsed.releaseDateGte) {
          if (mediaType === 'movie') {
            p['primary_release_date.gte'] = parsed.releaseDateGte;
          } else {
            p['first_air_date.gte'] = parsed.releaseDateGte;
          }
        }
        if (parsed.releaseDateLte) {
          if (mediaType === 'movie') {
            p['primary_release_date.lte'] = parsed.releaseDateLte;
          } else {
            p['first_air_date.lte'] = parsed.releaseDateLte;
          }
        }
        if (parsed.isAdultContentRequested) {
          p.include_adult = 'true';
        }
        return p;
      };

      if (parsed.type === 'both' || parsed.type === 'movie') {
        if (shouldRunDiscover) {
          fallbackPromises.push(fetchDiscover('movie', buildFallbackParams('movie')));
        }
        if (parsed.keywords.length > 2) {
          fallbackPromises.push(fetchSearch(parsed.keywords, 'movie'));
        }
      }
      if (parsed.type === 'both' || parsed.type === 'tv') {
        if (shouldRunDiscover) {
          fallbackPromises.push(fetchDiscover('tv', buildFallbackParams('tv')));
        }
        if (parsed.keywords.length > 2) {
          fallbackPromises.push(fetchSearch(parsed.keywords, 'tv'));
        }
      }

      const fallbackResults = await Promise.all(fallbackPromises);
      const fallbackMerged = fallbackResults.flat();
      const fallbackSeen = new Set<string>();
      unique = fallbackMerged.filter(item => {
        if (!item || !item.id || item.media_type === 'person') return false;
        const key = `${item.media_type}-${item.id}`;
        if (fallbackSeen.has(key)) return false;
        fallbackSeen.add(key);
        return true;
      });
    }

    unique.sort((a, b) => {
      if (parsed.sort === 'vote_average.desc') {
        // Bayesian weighted rating formula: (R * v + C * m) / (v + m)
        // where R = average rating, v = vote count, m = min votes (50), C = average vote (6.5)
        const getWeightedRating = (item: any) => {
          const v = item.vote_count || 0;
          const R = item.vote_average || 0;
          const m = 50;
          const C = 6.5;
          return (R * v + C * m) / (v + m);
        };
        return getWeightedRating(b) - getWeightedRating(a);
      }
      if (parsed.sort === 'primary_release_date.desc') {
        const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
        const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
        return dateB - dateA;
      }
      if (parsed.sort === 'primary_release_date.asc') {
        const dateA = new Date(a.release_date || a.first_air_date || 9999999999999).getTime();
        const dateB = new Date(b.release_date || b.first_air_date || 9999999999999).getTime();
        return dateA - dateB;
      }
      // Default: relevance score (combination of vote average and log popularity)
      const scoreA = (a.vote_average || 0) * 0.4 + Math.log1p(a.popularity || 0) * 0.6;
      const scoreB = (b.vote_average || 0) * 0.4 + Math.log1p(b.popularity || 0) * 0.6;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      query: q,
      parsed: {
        type: parsed.type,
        genres: parsed.genres,
        sort: parsed.sort,
        year: parsed.year,
        keywords: parsed.keywords,
        similarTitle: parsed.similarTitle,
        language: parsed.languageCode ? Object.keys(LANGUAGE_MAP).find(k => LANGUAGE_MAP[k] === parsed.languageCode) : null,
        decade: parsed.decadeText,
        person: personName,
        isUnderrated: parsed.isUnderrated,
        isOverrated: parsed.isOverrated,
        isClassic: parsed.isClassic,
        isAdult: parsed.isAdultContentRequested
      },
      results: unique.slice(0, 24),
    });
  } catch (err) {
    console.error('AI Search Error:', err);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
