'use client';
// Force Next.js HMR rebuild 2
import { useState, useEffect, Suspense, useCallback } from 'react';
import { MediaDetails } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { getSeasonDetailsAction } from '@/app/actions';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { Bookmark, Heart, MonitorPlay, Info, ChevronDown, Play, Star, CheckCircle2, Circle, ArrowLeft, Share2, Check, CalendarDays, Bell, Video, LayoutList, Sidebar } from 'lucide-react';
import { ShareModal } from '@/components/ui/ShareModal';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { storage } from '@/lib/storage';
import { getLanguageName, generateSlug } from '@/lib/utils';
import { TrailerModal } from '@/components/media/TrailerModal';
import { CastSection } from '@/components/media/CastSection';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { useNotifications } from '@/hooks/useNotifications';
import { Select } from '@/components/ui/Select';
import { useAmbientColor } from '@/hooks/useAmbientColor';
import { YoutubeBackgroundPlayer } from '@/components/media/YoutubeBackgroundPlayer';
import { UpcomingBanner, type UpcomingMeta, type UpcomingReason } from '@/components/media/UpcomingBanner';


// ΓöÇΓöÇΓöÇ TV Content State Engine ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
//
// State matrix:
//
// 1. fully_upcoming    ΓåÆ no seasons have aired (first_air_date > today OR status says so)
// 2. show_new_season   ΓåÆ ΓëÑ1 aired season exists, but newest season hasn't aired yet
// 3. mid_season        ΓåÆ current season partially aired (next_episode_to_air exists)
// 4. available         ΓåÆ fully available, normal player
//
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

type TvContentState =
  | 'fully_upcoming'
  | 'new_season_upcoming'
  | 'mid_season'
  | 'available';

interface TvStateResult {
  state: TvContentState;
  meta: UpcomingMeta;
  /** Seasons that are available to watch (have aired + have episodes) */
  availableSeasons: NonNullable<MediaDetails['seasons']>;
  /** Season number of the upcoming season (for new_season_upcoming) */
  upcomingSeasonNum?: number;
}

function detectTvState(show: MediaDetails): TvStateResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstAirDate = show.first_air_date ? new Date(show.first_air_date + 'T00:00:00') : null;

  // ΓöÇΓöÇ 1. Fully upcoming: no air date or air date is in the future ΓöÇΓöÇ
  const isFullyUpcoming =
    !firstAirDate ||
    firstAirDate > today ||
    show.status === 'In Production' ||
    show.status === 'Planned' ||
    show.status === 'Announced';

  // Seasons with real episodes (exclude "Specials" season 0 and future seasons)
  const allSeasons = (show.seasons || []).filter(s => s.season_number > 0);
  const airedSeasons = allSeasons.filter(s => {
    if (s.episode_count === 0) return false;
    if (!s.air_date) return false;
    const d = new Date(s.air_date + 'T00:00:00');
    return d <= today;
  });
  const futureSeasons = allSeasons.filter(s => {
    if (!s.air_date) return false;
    const d = new Date(s.air_date + 'T00:00:00');
    return d > today;
  });

  if (isFullyUpcoming && airedSeasons.length === 0) {
    return {
      state: 'fully_upcoming',
      meta: {
        reason: 'show_fully_upcoming',
        releaseDate: show.first_air_date || undefined,
        platform: 'New Show',
      },
      availableSeasons: [],
    };
  }

  // ΓöÇΓöÇ 2. New season upcoming: some seasons aired, but upcoming season exists ΓöÇΓöÇ
  if (airedSeasons.length > 0 && futureSeasons.length > 0) {
    const nextSeason = futureSeasons.sort((a, b) => a.season_number - b.season_number)[0];
    return {
      state: 'new_season_upcoming',
      meta: {
        reason: 'show_new_season_upcoming',
        releaseDate: nextSeason.air_date || undefined,
        upcomingSeason: nextSeason.season_number,
      },
      availableSeasons: airedSeasons,
      upcomingSeasonNum: nextSeason.season_number,
    };
  }

  // ΓöÇΓöÇ 3. Mid-season: currently airing with next episode coming ΓöÇΓöÇ
  // TMDB provides `next_episode_to_air` on the show details object
  const nextEp = (show as any).next_episode_to_air;
  if (nextEp && nextEp.air_date) {
    const nextAir = new Date(nextEp.air_date + 'T00:00:00');
    if (nextAir > today) {
      return {
        state: 'mid_season',
        meta: {
          reason: 'show_mid_season',
          nextEpisodeDate: nextEp.air_date,
          nextEpisodeNumber: nextEp.episode_number,
          upcomingSeason: nextEp.season_number,
        },
        availableSeasons: airedSeasons.length > 0 ? airedSeasons : allSeasons,
      };
    }
  }

  // ΓöÇΓöÇ 4. Fully available ΓöÇΓöÇ
  return {
    state: 'available',
    meta: { reason: 'show_fully_upcoming' }, // unused
    availableSeasons: airedSeasons.length > 0 ? airedSeasons : allSeasons,
  };
}

// ΓöÇΓöÇΓöÇ Main TvPlayer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function TvPlayerContent({ show }: { show: MediaDetails }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect content state once
  const { state: tvState, meta, availableSeasons, upcomingSeasonNum } = detectTvState(show);
  const isUpcoming = tvState === 'fully_upcoming';

  const [season, setSeason] = useState(parseInt(searchParams.get('season') || '1'));
  const [episode, setEpisode] = useState<number>(1);
  const [layout, setLayout] = useState<'standard' | 'sidebar'>('standard');

  useEffect(() => {
    const savedLayout = localStorage.getItem('zivox_tv_layout');
    if (savedLayout === 'standard' || savedLayout === 'sidebar') {
      setLayout(savedLayout);
    }
  }, []);

  const handleLayoutToggle = () => {
    const newLayout = layout === 'standard' ? 'sidebar' : 'standard';
    setLayout(newLayout);
    localStorage.setItem('zivox_tv_layout', newLayout);
  };
  const [episodes, setEpisodes] = useState<any[]>([]);
  const { history, addToHistory } = useWatchHistory();
  const autoPlay = searchParams.get('play') === '1';
  const serverParam = searchParams.get('server') || undefined;
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);


  const [bgTrailerPlaying, setBgTrailerPlaying] = useState(false);
  const trailer = show.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { hasNotification, toggleNotification } = useNotifications();
  const idStr = show.id.toString();
  const onWatchlist = isInWatchlist(idStr);
  const onFavorites = isFavorite(idStr);
  const hasReminder = hasNotification(idStr);

  useEffect(() => {
    if (isUpcoming) return; // don't load episodes for fully upcoming shows
    getSeasonDetailsAction(show.id.toString(), season).then(data => {
      setEpisodes(data.episodes || []);
    });
  }, [show.id, season, isUpcoming]);

  useEffect(() => {
    const s = searchParams.get('season');
    const e = searchParams.get('episode');
    if (s) setSeason(parseInt(s));
    if (e) setEpisode(parseInt(e));
  }, [searchParams]);

  const goToEpisode = useCallback((s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
    setIsPlaying(true);
    window.history.replaceState(null, '', `/watch/tv/${show.id}?season=${s}&episode=${e}`);
  }, [show.id]);

  const playNextEpisode = useCallback(() => {
    const currentEpIndex = episodes.findIndex(ep => ep.episode_number === episode);
    if (currentEpIndex >= 0 && currentEpIndex < episodes.length - 1) {
      goToEpisode(season, episodes[currentEpIndex + 1].episode_number);
    } else if (currentEpIndex === episodes.length - 1) {
      const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === season);
      if (currentSeasonIndex >= 0 && currentSeasonIndex < availableSeasons.length - 1) {
        const nextSeason = availableSeasons[currentSeasonIndex + 1];
        if (nextSeason.season_number > 0) goToEpisode(nextSeason.season_number, 1);
      }
    }
  }, [episodes, episode, season, goToEpisode, availableSeasons]);

  const hasNextEpisode = useCallback(() => {
    const currentEpIndex = episodes.findIndex(ep => ep.episode_number === episode);
    if (currentEpIndex >= 0 && currentEpIndex < episodes.length - 1) return true;
    if (currentEpIndex === episodes.length - 1) {
      const currentSeasonIndex = availableSeasons.findIndex(s => s.season_number === season);
      return currentSeasonIndex >= 0 && currentSeasonIndex < availableSeasons.length - 1;
    }
    return false;
  }, [episodes, episode, season, availableSeasons]);

  const toggleWatched = (ep: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const isWatched = history.some(
      i => i.id === idStr && i.season === season && i.episode === ep.episode_number && (i.progress || 0) >= 95
    );
    addToHistory({
      id: idStr, type: 'tv', title: show.name || '', poster: show.poster_path,
      timestamp: Date.now(), season, episode: ep.episode_number, progress: isWatched ? 0 : 100,
      first_air_date: show.first_air_date
    });
  };

  const watchItem = history.find(i => i.id === idStr && i.season === season && i.episode === episode);
  const progress = watchItem?.progress || 0;
  const isWatched = progress >= 95;
  const continueWatching = progress > 0 && !isWatched;

  const bgColor = useAmbientColor(getImageUrl(show.poster_path || show.backdrop_path, 'w500'));

  useEffect(() => {
    if (bgColor) document.documentElement.style.setProperty('--ambient-color', bgColor);
    return () => { document.documentElement.style.removeProperty('--ambient-color'); };
  }, [bgColor]);

  // Filter out episodes that haven't aired yet (for mid-season state)
  const airedEpisodes = tvState === 'mid_season'
    ? episodes.filter(ep => {
        if (!ep.air_date) return false;
        const d = new Date(ep.air_date + 'T00:00:00');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return d <= today;
      })
    : episodes;

  return (
    <div className="flex flex-col gap-8 md:gap-12 w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Back button & Watching Indicator */}
      <div className="flex flex-wrap items-center gap-3 w-full -mb-2 md:-mb-6">
        <button
          onClick={() => {
            if (isPlaying) {
              setIsPlaying(false);
            } else {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                router.push('/');
              }
            }
          }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors min-h-[44px] px-2 rounded-xl active:bg-white/5 md:active:bg-transparent shrink-0"
        >
          <ArrowLeft size={20} /> 
          <span className="font-bold text-sm">
            {isPlaying ? 'Back to Details' : 'Back'}
          </span>
        </button>

        {isPlaying && (
          <>
            <span className="text-zinc-700 font-light select-none">|</span>
            <span className="text-zinc-400 text-xs sm:text-sm font-medium truncate max-w-[280px] sm:max-w-xl">
              Watching: <span className="text-amber-400 font-bold">{show.name}</span>
              <span className="text-zinc-500 font-semibold ml-2">S{season}:E{episode}</span>
              {episodes.find(ep => ep.episode_number === episode)?.name && (
                <span className="text-zinc-600 font-normal ml-1.5 hidden sm:inline">
                  - {episodes.find(ep => ep.episode_number === episode).name}
                </span>
              )}
            </span>
          </>
        )}
      </div>
      {/* ΓöÇΓöÇ FULLY UPCOMING: UpcomingBanner only ΓöÇΓöÇ */}
      {tvState === 'fully_upcoming' && (
        <UpcomingBanner media={show} meta={meta} />
      )}

      {/* ΓöÇΓöÇ HAS AIRED CONTENT: Normal player (+ optional new-season banner) ΓöÇΓöÇ */}
      {tvState !== 'fully_upcoming' && (
        <>
          {/* New season banner on top */}
          {tvState === 'new_season_upcoming' && (
            <UpcomingBanner media={show} meta={meta} />
          )}

          {/* Mid-season "next episode" info will now be integrated directly into the player below */}

          {/* ΓöÇΓöÇ Player section ΓöÇΓöÇ */}
          <div className={`flex gap-8 transition-all duration-500 ${layout === 'standard' ? 'flex-col items-center' : 'flex-col xl:flex-row items-start'}`}>
            <div className={`flex flex-col gap-6 w-full ${layout === 'standard' ? 'xl:w-full' : 'flex-1'}`}>
              {/* Sticky player on mobile */}
              <div className="sticky top-[56px] md:static z-30 md:z-auto">
              <div className="relative w-full max-w-5xl mx-auto">
                <div
                  className={`absolute inset-[-5%] md:inset-[-8%] blur-[40px] md:blur-[60px] opacity-100 transition-colors duration-1000 ease-in-out pointer-events-none z-[-1] ${isPlaying ? 'hidden' : 'opacity-100'}`}
                  style={{ backgroundColor: bgColor, willChange: 'background-color', transform: 'translateZ(0)' }}
                />
                <div
                  className={`relative w-full border border-zinc-800 bg-void-950 group ${
                    !isPlaying ? 'rounded-2xl overflow-hidden aspect-video md:aspect-[2.39/1] max-h-[520px] cursor-pointer' : 'min-h-[300px] flex flex-col'
                  }`}
                  onClick={() => !isPlaying && setIsPlaying(true)}
                >
                  {!isPlaying ? (
                    <div className="absolute inset-0 z-10">
                      <YoutubeBackgroundPlayer
                        videoKey={trailer?.key || null}
                        backdropPath={show.backdrop_path || show.poster_path}
                        title={show.name || ''}
                        onPlayingChange={setBgTrailerPlaying}
                      />
                      {bgTrailerPlaying && (
                        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md text-white/70 text-[9px] font-bold uppercase tracking-widest select-none pointer-events-none shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Trailer Playing
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/20 to-transparent pointer-events-none" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal(true);
                        }}
                        className="absolute top-4 right-4 md:top-6 md:right-6 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition-all active:scale-95 font-bold text-sm shadow-xl"
                      >
                        <span className="hidden sm:inline">Share</span>
                        <Share2 size={16} />
                      </button>
                      <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-700 ${bgTrailerPlaying ? 'opacity-0' : 'opacity-100'}`}>
                        <div
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 opacity-80 shadow-2xl pointer-events-auto"
                          style={{
                            background: `radial-gradient(circle, ${bgColor || 'rgba(var(--brand-500),0.9)'} 0%, rgba(0,0,0,0.7) 100%)`,
                            boxShadow: `0 0 40px 10px ${bgColor || 'rgba(var(--brand-500),0.3)'}`,
                          }}
                        >
                          <Play size={28} fill="white" className="text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                    <VideoPlayer
                      type="tv"
                      id={idStr}
                      season={season}
                      episode={episode}
                      title={show.name}
                      poster={show.poster_path}
                      onProgress={() => {}}
                      onPlayNext={playNextEpisode}
                      hasNextEpisode={hasNextEpisode()}
                      releaseYear={show.first_air_date}
                      initialServer={serverParam}
                      blockTutorial={false}
                    />
                    <div className="w-full max-w-7xl mx-auto mt-2 px-4">
                      <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 flex flex-col gap-2">
                        <h3 className="text-brand-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                          <Info className="w-4 h-4" /> 
                          Developer&apos;s Tips for the Best Experience
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed">
                          <strong>Experiencing video lag?</strong> Go <strong className="text-white">Full Screen (F)</strong>! This forces your browser to unlock butter-smooth 60fps playback.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">
                            <strong className="text-brand-400">⚡ Fast:</strong> Server 3
                          </span>
                          <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">
                            <strong className="text-brand-400">🟢 No ads:</strong> Server 2, 4, 6, 7, 8
                          </span>
                          <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">
                            <strong className="text-brand-400">🌐 Multi-lingual:</strong> Server 2, 5, 7
                          </span>
                        </div>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </div>
              </div>

              {/* Info panel ΓÇö smooth max-height collapse, no layout glitch */}
              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: isPlaying ? '0px' : '2000px',
                  opacity: isPlaying ? 0 : 1,
                  transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
                }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between flex-wrap gap-6">
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-tight mb-2">
                      {show.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-400">
                      <span className="text-green-500 font-bold">{(show.vote_average * 10).toFixed(0)}% Match</span>
                      <span>{show.first_air_date?.substring(0, 4)}</span>
                      {availableSeasons.length > 0 && (
                        <span>{availableSeasons.length} Season{availableSeasons.length > 1 ? 's' : ''}</span>
                      )}
                      {show.original_language && (
                        <span className="border border-zinc-700 bg-void-900 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-zinc-300">
                          {getLanguageName(show.original_language)}
                        </span>
                      )}
                      <span className="border border-zinc-700 bg-void-900 px-1.5 py-0.5 rounded text-[10px] uppercase">HD</span>
                      {show.episode_run_time?.[0] ? <span>~{show.episode_run_time[0]}m per EP</span> : null}
                      {show.status && (
                        <span className="border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 rounded text-[10px] uppercase">{show.status}</span>
                      )}
                      
                      {tvState === 'mid_season' && meta.nextEpisodeDate && (
                        <div className="flex items-center gap-1.5 border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 rounded">
                           <CalendarDays size={12} className="text-brand-400" />
                           <span className="text-[10px] uppercase font-bold text-brand-400">
                             Ep {meta.nextEpisodeNumber} in {Math.max(1, Math.ceil((new Date(meta.nextEpisodeDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))}d
                           </span>
                           <div className="w-[1px] h-3 bg-brand-500/30 mx-0.5" />
                           <button 
                             onClick={() => toggleNotification({
                               id: idStr, type: 'tv', title: show.name || '', poster: show.poster_path, releaseDate: meta.nextEpisodeDate!
                             })}
                             className="opacity-70 hover:opacity-100 hover:text-white transition-opacity outline-none"
                             title={hasReminder ? 'Remove Reminder' : 'Remind Me'}
                           >
                             {hasReminder ? <Check size={12} className="text-green-400" /> : <Bell size={12} />}
                           </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {show.genres?.map((g: any, i: number) => (
                        <span key={g.id || `genre-${i}`} className="text-xs font-medium text-zinc-300 bg-void-900 border border-zinc-800 px-2 py-1 rounded-md">{g.name}</span>
                      ))}
                    </div>

                    {show.overview && (
                      <p className="mt-6 text-zinc-300 text-sm md:text-base leading-relaxed max-w-3xl font-light">
                        {show.overview}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px] shrink-0">
                    {!isPlaying && (
                      <button
                        onClick={() => setIsPlaying(true)}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all active:scale-95 font-bold uppercase tracking-wider text-sm shadow-xl ${
                          continueWatching
                            ? 'bg-premium-gradient hover:bg-premium-gradient-dark text-white shadow-brand-500/20'
                            : 'bg-white hover:bg-gray-200 text-black shadow-white/10'
                        }`}
                      >
                        <Play fill="currentColor" size={20} />
                        {continueWatching ? 'Continue Watching' : 'Play'}
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {trailer && (
                        <button
                          onClick={() => setTrailerOpen(true)}
                          className="col-span-2 flex items-center justify-center gap-2 bg-void-900 hover:bg-void-800 border border-zinc-800 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 font-bold uppercase tracking-wider text-xs"
                        >
                          <Video size={16} /> Watch Trailer
                        </button>
                      )}
                      <button
                        onClick={() => toggleWatchlist({ id: idStr, type: 'tv', title: show.name || '', poster: show.poster_path, first_air_date: show.first_air_date })}
                        className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 rounded-xl transition-all active:scale-95 font-bold uppercase tracking-wider text-[10px] ${onWatchlist ? 'bg-brand-500/10 border-brand-500/20 text-brand-500' : 'bg-void-900 border-zinc-800 hover:bg-void-800 text-zinc-300'}`}
                      >
                        <Bookmark size={14} className={onWatchlist ? 'fill-brand-500' : ''} /> {onWatchlist ? 'Watchlisted' : 'Watchlist'}
                      </button>
                      <button
                        onClick={() => toggleFavorite({ id: idStr, type: 'tv', title: show.name || '', poster: show.poster_path, first_air_date: show.first_air_date })}
                        className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 rounded-xl transition-all active:scale-95 font-bold uppercase tracking-wider text-[10px] ${onFavorites ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' : 'bg-void-900 border-zinc-800 hover:bg-void-800 text-zinc-300'}`}
                      >
                        <Heart size={14} className={onFavorites ? 'fill-pink-500' : ''} /> {onFavorites ? 'Favorited' : 'Favorite'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            {availableSeasons.length > 0 && (
              <div className={`w-full flex flex-col gap-4 transition-all duration-500 delay-100 ${layout === 'standard' ? 'xl:w-full max-w-5xl mx-auto' : 'xl:w-96 shrink-0'}`}>
                <div className="relative z-50 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Select
                      value={season}
                    onChange={(val) => { setSeason(val as number); setEpisode(1); }}
                    options={availableSeasons.map(s => ({
                      label: s.name,
                      value: s.season_number,
                      description: `(${s.episode_count} Episodes)`,
                    }))}
                  />
                  </div>
                  <button
                    onClick={handleLayoutToggle}
                    className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-void-900 hover:bg-void-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider shrink-0"
                    title={layout === 'standard' ? 'Switch to Sidebar View' : 'Switch to Standard View'}
                  >
                    {layout === 'standard' ? (
                      <><Sidebar size={14} /> Sidebar</>
                    ) : (
                      <><LayoutList size={14} /> Standard</>
                    )}
                  </button>
                </div>

                <div className="bg-void-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col max-h-[600px] shadow-lg">
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                      Episodes
                      {tvState === 'mid_season' && (
                        <span className="ml-2 text-brand-500 normal-case font-normal">(Aired only)</span>
                      )}
                    </h3>
                  </div>
                  <div data-lenis-prevent="true" className="overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
                    {airedEpisodes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
                        <p className="text-sm font-semibold text-white/60 mb-1">No episodes available yet</p>
                        <p className="text-xs text-white/35">Episodes will appear here once they air.</p>
                      </div>
                    ) : (
                      airedEpisodes.map(ep => {
                        const isActive = ep.episode_number === episode;
                        const epState = history.find(i => i.id === idStr && i.season === season && i.episode === ep.episode_number);
                        const epProgress = epState?.progress || 0;
                        const epWatched = epProgress >= 95;

                        return (
                          <div
                            key={ep.id || `ep-${ep.episode_number}-${ep.name}`}
                            onClick={() => goToEpisode(season, ep.episode_number)}
                            role="button"
                            tabIndex={0}
                            className={`w-full flex flex-col gap-3 p-3 text-left transition-colors border-b border-zinc-800/50 last:border-0 relative overflow-hidden group cursor-pointer ${isActive ? 'bg-zinc-900/50' : 'hover:bg-zinc-900/30'}`}
                          >
                            <div className="flex gap-3">
                              <div className="relative w-32 aspect-video bg-void-950 rounded overflow-hidden flex-shrink-0 border border-zinc-800">
                                <Image src={getImageUrl(ep.still_path, 'w500')} alt={ep.name} fill sizes="128px" className="object-cover opacity-80" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Play size={16} className={isActive ? 'text-brand-500 fill-brand-500' : 'text-white opacity-0 group-hover:opacity-100 transition-opacity'} />
                                </div>
                                {epProgress > 0 && !epWatched && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 opacity-80">
                                    <div className="h-full bg-premium-gradient" style={{ width: `${Math.min(100, Math.max(0, epProgress))}%` }} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 py-1 flex flex-col">
                                <div className="flex justify-between items-start">
                                  <h4 className={`text-xs font-semibold truncate pr-2 ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                    {ep.episode_number}. {ep.name}
                                  </h4>
                                  <button onClick={(e) => toggleWatched(ep, e)} className="text-zinc-500 hover:text-white transition-colors" title={epWatched ? 'Mark Unwatched' : 'Mark Watched'}>
                                    {epWatched ? <CheckCircle2 size={16} className="text-brand-500" /> : <Circle size={16} />}
                                  </button>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 flex-1">{ep.overview}</p>
                                {ep.vote_average > 0 && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-zinc-400">
                                    <Star size={10} className="text-yellow-500 fill-yellow-500" /> {ep.vote_average.toFixed(1)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cast & About section ΓÇö also collapses when playing */}
          <div
            style={{
              overflow: 'hidden',
              maxHeight: isPlaying ? '0px' : '4000px',
              opacity: isPlaying ? 0 : 1,
              transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
            }}
            className="flex flex-col gap-12"
          >

            <CastSection cast={show.credits?.cast} crew={show.credits?.crew} createdBy={show.created_by} />
          </div>
        </>
      )}

      {/* Cast for fully upcoming */}
      {tvState === 'fully_upcoming' && (
        <CastSection cast={show.credits?.cast} crew={show.credits?.crew} createdBy={show.created_by} />
      )}

      <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} videoKey={trailer?.key || null} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title={`Watch ${show.name} on ZIVOX`} shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/watch/tv/${generateSlug(show.id.toString(), show.name)}` : undefined} />

    </div>
  );
}

export function TvPlayer({ show }: { show: MediaDetails }) {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-3xl mx-auto rounded-3xl bg-void-900 animate-pulse border border-zinc-800" />}>
      <TvPlayerContent show={show} />
    </Suspense>
  );
}
