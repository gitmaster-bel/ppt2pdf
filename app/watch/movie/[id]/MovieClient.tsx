'use client';
// Force Next.js HMR rebuild 2
import { useState, useEffect } from 'react';
import { MediaDetails } from '@/types/tmdb';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { TrailerModal } from '@/components/media/TrailerModal';
import { CastSection } from '@/components/media/CastSection';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, Heart, Play, Video, ArrowLeft, Share2, Check } from 'lucide-react';
import { ShareModal } from '@/components/ui/ShareModal';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { getLanguageName, generateSlug } from '@/lib/utils';
import Link from 'next/link';
import { useAmbientColor } from '@/hooks/useAmbientColor';
import { YoutubeBackgroundPlayer } from '@/components/media/YoutubeBackgroundPlayer';
import { UpcomingBanner, type UpcomingMeta } from '@/components/media/UpcomingBanner';


// ΓöÇΓöÇΓöÇ Content State Detection ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const UNRELEASED_STATUSES = new Set([
  'Planned', 'Rumored', 'In Production', 'Post Production', 'Announced',
]);

function detectMovieState(movie: MediaDetails): {
  isUpcoming: boolean;
  meta: UpcomingMeta;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const releaseDate = movie.release_date ? new Date(movie.release_date + 'T00:00:00') : null;
  const isUnreleasedByDate = releaseDate ? releaseDate > today : false;
  const isUnreleasedByStatus = !!movie.status && UNRELEASED_STATUSES.has(movie.status);

  const isUpcoming = isUnreleasedByDate || isUnreleasedByStatus;

  return {
    isUpcoming,
    meta: {
      reason: 'movie_unreleased',
      releaseDate: movie.release_date || undefined,
      platform: 'In Theatres',
    },
  };
}

// ΓöÇΓöÇΓöÇ Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export function MovieClient({ movie }: { movie: MediaDetails }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPlay = searchParams.get('play') === '1';
  const serverParam = searchParams.get('server') || undefined;
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bgTrailerPlaying, setBgTrailerPlaying] = useState(false);
  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');



  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useWatchHistory();
  const idStr = movie.id.toString();
  const onWatchlist = isInWatchlist(idStr);
  const onFavorites = isFavorite(idStr);

  const watchItem = history.find(i => i.id === idStr);
  const progress = watchItem?.progress || 0;
  const isWatched = progress >= 95;
  const continueWatching = progress > 0 && !isWatched;

  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const bgColor = useAmbientColor(getImageUrl(movie.poster_path || movie.backdrop_path, 'w500'));

  const { isUpcoming, meta } = detectMovieState(movie);

  useEffect(() => {
    if (bgColor) document.documentElement.style.setProperty('--ambient-color', bgColor);
    return () => { document.documentElement.style.removeProperty('--ambient-color'); };
  }, [bgColor]);

  return (
    <div className="flex flex-col gap-8 md:gap-12 w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Back button & Watching Indicator */}
      <div className="flex flex-wrap items-center gap-3 w-full -mb-2 md:-mb-6">
        <button
          onClick={() => {
            if (isPlaying) setIsPlaying(false);
            else router.back();
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
              Watching: <span className="text-amber-400 font-bold">{movie.title}</span>
              {movie.release_date && (
                <span className="text-zinc-600 text-xs ml-1">({movie.release_date.substring(0, 4)})</span>
              )}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {/* ΓöÇΓöÇ UPCOMING: show UpcomingBanner ΓöÇΓöÇ */}
        {isUpcoming ? (
          <UpcomingBanner media={movie} meta={meta} />
        ) : (
          /* ΓöÇΓöÇ RELEASED: normal player UI ΓöÇΓöÇ */
          <div className="flex-1 flex flex-col gap-6">
            {/* Sticky player on mobile ΓÇö stays visible while scrolling info */}
            <div className="sticky top-[56px] md:static z-30 md:z-auto">
              <div className="relative w-full max-w-5xl mx-auto">
                {/* Dynamic YouTube-style ambient backlight */}
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
                        backdropPath={movie.backdrop_path || movie.poster_path}
                        title={movie.title || ''}
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
                    <VideoPlayer type="movie" id={movie.id.toString()} title={movie.title} poster={movie.poster_path} releaseYear={movie.release_date} initialServer={serverParam} blockTutorial={false} />
                  )}
                </div>
              </div>
            </div>

            {/* Info panel ΓÇö collapses cleanly with max-height transition (no layout glitch) */}
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
                    {movie.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-400">
                    <span className="text-green-500 font-bold">{(movie.vote_average * 10).toFixed(0)}% Match</span>
                    <span>{movie.release_date?.substring(0, 4)}</span>
                    <span>{runtime}</span>
                    {movie.original_language && (
                      <span className="border border-zinc-700 bg-void-900 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-zinc-300">
                        {getLanguageName(movie.original_language)}
                      </span>
                    )}
                    <span className="border border-zinc-700 bg-void-900 px-1.5 py-0.5 rounded text-[10px] uppercase">HD</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {movie.genres?.map((g: { id: number; name: string }, i: number) => (
                      <span key={g.id || `genre-${i}`} className="text-xs font-medium text-zinc-300 bg-void-900 border border-zinc-800 px-2 py-1 rounded-md">{g.name}</span>
                    ))}
                  </div>

                  {movie.overview && (
                    <p className="mt-6 text-zinc-300 text-sm md:text-base leading-relaxed max-w-3xl font-light">
                      {movie.overview}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 min-w-[200px] shrink-0">
                  {!isPlaying && (
                    <button
                      onClick={() => setIsPlaying(true)}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all font-bold uppercase tracking-wider text-sm shadow-xl active:scale-95 ${
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
                      onClick={() => toggleWatchlist({ id: idStr, type: 'movie', title: movie.title || '', poster: movie.poster_path, release_date: movie.release_date })}
                      className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 rounded-xl transition-all active:scale-95 font-bold uppercase tracking-wider text-[10px] ${onWatchlist ? 'bg-brand-500/10 border-brand-500/20 text-brand-500' : 'bg-void-900 border-zinc-800 hover:bg-void-800 text-zinc-300'}`}
                    >
                      <Bookmark size={14} className={onWatchlist ? 'fill-brand-500' : ''} /> {onWatchlist ? 'Watchlisted' : 'Watchlist'}
                    </button>
                    <button
                      onClick={() => toggleFavorite({ id: idStr, type: 'movie', title: movie.title || '', poster: movie.poster_path, release_date: movie.release_date })}
                      className={`flex items-center justify-center gap-1.5 border px-3 py-2.5 rounded-xl transition-all active:scale-95 font-bold uppercase tracking-wider text-[10px] ${onFavorites ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' : 'bg-void-900 border-zinc-800 hover:bg-void-800 text-zinc-300'}`}
                    >
                      <Heart size={14} className={onFavorites ? 'fill-pink-500' : ''} /> {onFavorites ? 'Favorited' : 'Favorite'}
                    </button>
                  </div>
                </div>
              </div>

              {movie.belongs_to_collection && (
                <Link
                  href={`/collection/${generateSlug(movie.belongs_to_collection.id.toString(), movie.belongs_to_collection.name)}`}
                  className="inline-flex items-center gap-2 text-sm font-bold bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/25 px-4 py-2 rounded-full text-brand-400 hover:text-brand-300 transition-all w-fit shadow-md mt-2 active:scale-95"
                >
                  <span>≡ƒÄ¼</span>
                  <span>Part of <span className="text-white">{movie.belongs_to_collection.name}</span></span>
                  <span className="text-brand-500/60 text-xs">ΓåÆ</span>
                </Link>
              )}
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

        <CastSection cast={movie.credits?.cast} crew={movie.credits?.crew} />
      </div>

      <TrailerModal isOpen={trailerOpen} onClose={() => setTrailerOpen(false)} videoKey={trailer?.key || null} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title={`Watch ${movie.title} on ZIVOX`} shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/watch/movie/${generateSlug(movie.id.toString(), movie.title)}` : undefined} />

    </div>
  );
}
