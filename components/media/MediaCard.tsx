'use client';
import { useState, memo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Media } from "@/types/tmdb";
import { getImageUrl } from "@/lib/tmdb";
import { cn, generateSlug } from "@/lib/utils";
import { Bookmark, Trash2, Heart, Play, Pause, Volume2, VolumeX, Star, Plus, Check, ArrowRight, Bell, BellOff } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { getTrailerAction } from "@/app/actions";

import { useFavorites } from "@/hooks/useFavorites";
import { usePreferences } from "@/hooks/usePreferences";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";

export const MediaCard = memo(function MediaCard({
  media,
  className,
  onRemove,
  variant = 'default',
  isUpcoming = false,
  hideTitle = false,
}: {
  media: Media & { progress?: number; season?: number; episode?: number; contextType?: 'history' | 'watchlist' | 'favorites' | 'notifications' };
  className?: string;
  onRemove?: (id: string, type: 'history' | 'watchlist' | 'favorites' | 'notifications') => void;
  variant?: 'default' | 'top10';
  isUpcoming?: boolean;
  hideTitle?: boolean;
}) {
  const router = useRouter();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const { hasNotification, toggleNotification } = useNotifications();
  const { preferences } = usePreferences();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isFavorite, toggleFavorite } = useFavorites();

  const title = media.title || media.name;
  const type = media.media_type || (media.name ? "tv" : "movie");
  const isMovie = type === "movie";
  const year = (media.release_date || media.first_air_date || "").substring(0, 4);
  const href = `/watch/${isMovie ? "movie" : "tv"}/${generateSlug(media.id.toString(), title)}${
    !isMovie && media.season && media.episode ? `?season=${media.season}&episode=${media.episode}` : ""
  }`;
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerFailed, setTrailerFailed] = useState(false);
  const [expandOrigin, setExpandOrigin] = useState<'center' | 'left' | 'right'>('center');
  const [trailerPlaying, setTrailerPlaying] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [trailerPaused, setTrailerPaused] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);

  const toggleTrailerPlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextState = !trailerPaused;
    setTrailerPaused(nextState);
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: nextState ? 'pauseVideo' : 'playVideo', args: '' }), '*');
  };

  const toggleTrailerMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const nextState = !trailerMuted;
    setTrailerMuted(nextState);
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: nextState ? 'mute' : 'unMute', args: '' }), '*');
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let expandTimeoutId: NodeJS.Timeout;
    let minTimeId: NodeJS.Timeout;
    
    if (isHovered && !isMobileExpanded && typeof window !== 'undefined' && window.innerWidth >= 768) {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const expandedWidth = rect.width * 1.6;
        const diff = (expandedWidth - rect.width) / 2;
        if (rect.left - diff < 10) {
          setExpandOrigin('left');
        } else if (rect.right + diff > window.innerWidth - 10) {
          setExpandOrigin('right');
        } else {
          setExpandOrigin('center');
        }
      }

      expandTimeoutId = setTimeout(() => {
        setIsExpanded(true);
      }, 400);

      minTimeId = setTimeout(() => {
        setMinTimeElapsed(true);
      }, 2000);

      if (!preferences.dataSaver) {
        timeoutId = setTimeout(async () => {
          if (!trailerKey && !trailerFailed) {
            const key = await getTrailerAction(media.id.toString(), type as 'movie'|'tv');
            if (key) {
              setTrailerKey(key);
            } else {
              setTrailerFailed(true);
            }
          }
        }, 400);
      }
    } else {
      setIsExpanded(false);
      setTrailerPlaying(false);
      setMinTimeElapsed(false);
      setTrailerPaused(false);
      setTrailerMuted(true);
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(expandTimeoutId);
      clearTimeout(minTimeId);
    };
  }, [isHovered, media.id, type, trailerKey, trailerFailed, isMobileExpanded, preferences.dataSaver]);

  useEffect(() => {
    if (!isExpanded || !trailerKey || trailerFailed) return;

    let isMounted = true;
    const failsafeId = setTimeout(() => {
      if (isMounted && !trailerPlaying) setTrailerFailed(true);
    }, 10000);

    const handleMessage = (e: MessageEvent) => {
      if (!isMounted) return;
      if (!e.origin.includes('youtube.com') && !e.origin.includes('youtube-nocookie.com')) return;
      
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.playerState === 1) {
            clearTimeout(failsafeId);
            setTimeout(() => {
              if (isMounted) setTrailerPlaying(true);
            }, 1200);
          }
          if (data.info.errorCode) {
            setTrailerFailed(true);
          }
        }
        if (data.event === 'onStateChange' && data.info === 1) {
          clearTimeout(failsafeId);
          setTimeout(() => {
            if (isMounted) setTrailerPlaying(true);
          }, 1200);
        }
        if (data.event === 'onError') {
          setTrailerFailed(true);
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
      clearTimeout(failsafeId);
    };
  }, [isExpanded, trailerKey, trailerFailed, trailerPlaying]);

  const onWatchlist = isInWatchlist(media.id.toString());
  const onFavorites = isFavorite(media.id.toString());

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist({ id: media.id.toString(), type: type as any, title: title || '', poster: media.poster_path });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({ id: media.id.toString(), type: type as any, title: title || '', poster: media.poster_path });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      if (!isMobileExpanded) {
        e.preventDefault();
        setIsMobileExpanded(true);
      }
    }
  };

  const toggleReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleNotification({
      id: media.id.toString(),
      type: type as 'movie'|'tv',
      title: title || '',
      poster: media.poster_path,
      releaseDate: media.release_date || media.first_air_date
    });
  };

  const isReminded = hasNotification(media.id.toString());

  const handleReminderClick = (e: React.MouseEvent) => {
    toggleReminder(e);
  };

  return (
    <div 
      ref={cardRef}
      className="relative group block" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsMobileExpanded(false); setIsHovered(false); }}
    >
      <Link href={href} className={cn("relative block", className)} onClick={handleCardClick}>
        <div
          className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer will-change-transform"
          style={{
            background: 'linear-gradient(135deg, #0d0d0f 0%, #141418 40%, #0d0d0f 100%)',
          }}
        >
          {/* Shimmer skeleton shown while poster loads */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear',
            }}
          />
          {/* Poster */}
          <Image
            src={getImageUrl(media.poster_path, "w500", title, year)}
            alt={title || "Poster"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 15vw"
            className={cn(
              "object-cover transition-transform duration-300 ease-out",
              variant === 'top10'
                ? "group-hover:-translate-y-1.5 group-hover:scale-[1.04]"
                : "group-hover:scale-[1.05]"
            )}
            referrerPolicy="no-referrer"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAECAYAAABLLYUHAAAAGklEQVQI12NgYGD4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg=="
            draggable={false}
            style={{ userSelect: 'none' }}
          />

          {/* Top Left Badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex">
             {preferences.showRatings && media.vote_average ? (
               <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 px-2 py-1 rounded-md shadow-lg">
                 <Star size={10} className="text-yellow-400 fill-yellow-400" />
                 <span className="text-white text-[10px] font-bold">{media.vote_average.toFixed(1)}</span>
               </div>
             ) : null}
          </div>

          {/* Desktop Hover Overlay (Fades out when expanded) */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:flex flex-col justify-end p-3.5 z-20 ${isExpanded ? 'opacity-0 group-hover:opacity-0' : ''}`}
            style={{
              background: variant === 'top10'
                ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            }}
          >
            {!preferences.alwaysShowTitles && (
              <>
                <h3 className="text-white font-bold text-[14px] leading-tight truncate drop-shadow-md">{title}</h3>
                <p className="text-white/60 font-semibold text-[11px] mt-0.5 drop-shadow-md">{year} • {isMovie ? 'Movie' : 'Series'}</p>
              </>
            )}
          </div>

          {/* Desktop Play Button */}
          <div className={`absolute inset-0 z-20 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250 ${isExpanded ? 'opacity-0 group-hover:opacity-0 hidden' : ''}`}>
            <div className="translate-y-3 group-hover:translate-y-0 transition-transform duration-250">
              {!isUpcoming && (
                <div className="w-12 h-12 bg-black/60 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
                  <Play size={20} className="text-white fill-white ml-1" />
                </div>
              )}
            </div>
          </div>

          {/* Desktop Quick Actions */}
          <div className="absolute top-2 right-2 z-30 flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-[opacity,transform] duration-200 hidden md:flex">
            <button
              onClick={handleWatchlist}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-[background-color,border-color] duration-150 active:scale-90 shadow-lg"
              style={{
                background: onWatchlist ? 'var(--brand-500)' : 'rgba(0,0,0,0.82)',
                border: `1px solid ${onWatchlist ? 'var(--brand-500)' : 'rgba(255,255,255,0.2)'}`,
              }}
              title={onWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              <Bookmark size={12} className={`text-white ${onWatchlist ? 'fill-white' : ''}`} />
            </button>
            {isUpcoming && (
              <button
                onClick={handleReminderClick}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-[background-color,border-color] duration-150 active:scale-90 shadow-lg"
                style={{
                  background: isReminded ? 'var(--brand-500)' : 'rgba(0,0,0,0.82)',
                  border: `1px solid ${isReminded ? 'var(--brand-500)' : 'rgba(255,255,255,0.2)'}`,
                }}
                title={isReminded ? "Remove Reminder" : "Set Reminder"}
              >
                {isReminded ? <BellOff size={12} className="text-white" /> : <Bell size={12} className="text-white" />}
              </button>
            )}
            {(media.contextType === 'history' || media.contextType === 'favorites') && (
              <button
                onClick={handleFavorite}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-[background-color,border-color] duration-150 active:scale-90 shadow-lg"
                style={{
                  background: onFavorites ? '#ec4899' : 'rgba(0,0,0,0.82)',
                  border: `1px solid ${onFavorites ? '#ec4899' : 'rgba(255,255,255,0.2)'}`,
                }}
                title={onFavorites ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart size={12} className={`text-white ${onFavorites ? 'fill-white' : ''}`} />
              </button>
            )}
          </div>

          {/* MOBILE EXPANDED OVERLAY */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 transition-opacity duration-300 md:hidden z-50 flex flex-col justify-between ${
              isMobileExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
             <div className="flex justify-end p-2 gap-1.5">
                <button 
                  className="w-8 h-8 bg-black/50 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform pointer-events-auto" 
                  onClick={handleWatchlist}
                >
                   {onWatchlist ? <Check size={14} className="text-white"/> : <Plus size={14} className="text-white" />}
                </button>
                {isUpcoming && (
                  <button
                    className="w-8 h-8 bg-black/50 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform pointer-events-auto"
                    onClick={handleReminderClick}
                  >
                    {isReminded ? <BellOff size={14} className="text-white"/> : <Bell size={14} className="text-white" />}
                  </button>
                )}
                {(media.contextType === 'history' || media.contextType === 'favorites') && (
                  <button
                    onClick={handleFavorite}
                    className="w-8 h-8 bg-black/50 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-sm active:scale-90 transition-transform pointer-events-auto"
                  >
                    <Heart size={14} className={`text-white ${onFavorites ? 'fill-white' : ''}`} />
                  </button>
                )}
             </div>
             
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {!isUpcoming && (
                   <div className="w-12 h-12 bg-black/60 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
                       <Play size={20} className="text-white fill-white ml-1" />
                   </div>
                 )}
             </div>

             <div className="p-3 mt-auto relative z-10 pointer-events-none">
                <h3 className="text-white font-bold text-[13px] leading-tight truncate drop-shadow-md">{title}</h3>
                <p className="text-white/60 font-semibold text-[11px] mt-0.5 drop-shadow-md">{year} • {isMovie ? 'Movie' : 'Series'}</p>
             </div>
          </div>

          {/* Progress bar */}
          {media.contextType === 'history' && media.progress !== undefined && media.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-30">
              <div
                className="h-full rounded-r-full"
                style={{
                  width: `${Math.min(100, Math.max(0, media.progress))}%`,
                  background: 'linear-gradient(to right, var(--brand-500), #ff3d47)',
                  boxShadow: '0 0 8px color-mix(in srgb, var(--brand-500) 50%, transparent)',
                }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Continue Watching Episode Label (Mobile) */}
      {media.contextType === 'history' && media.season && media.episode && (
        <div className="mt-1.5 px-1 md:hidden">
          <span className="text-[10px] text-white/50 font-medium tracking-wide">
            S{media.season} E{media.episode}
          </span>
        </div>
      )}

      {/* Always Show Titles Preference */}
      {preferences.alwaysShowTitles && !hideTitle && (
        <div className={`mt-2 px-1 transition-opacity duration-300 ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
          <h3 className="text-white font-bold text-[13px] leading-tight truncate">{title}</h3>
          <p className="text-white/50 text-[10px] mt-0.5 truncate">{year} • {isMovie ? 'Movie' : 'Series'}</p>
        </div>
      )}

      {/* Remove button (history / notifications) */}
      {onRemove && (media.contextType === 'history' || media.contextType === 'notifications') && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(media.id.toString(), media.contextType!); }}
          className={`absolute -top-2 -right-2 z-40 w-6 h-6 bg-void-900 hover:from-brand-500 hover:to-brand-400 border border-white/10 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-[opacity,background-color] duration-200 hover:scale-110 shadow-xl ${isExpanded ? 'hidden' : ''}`}
          title={`Remove from ${media.contextType === 'history' ? 'History' : 'Notifications'}`}
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* ── EXPANDED POP-OUT CARD ── */}
      {isExpanded && (
        <div 
          className={cn(
            "absolute -top-4 h-[calc(100%+2rem)] w-[160%] bg-void-950 rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] z-50 overflow-hidden pointer-events-auto border border-zinc-800 flex flex-col transform animate-in fade-in duration-300 ease-out zoom-in-[0.85]",
            expandOrigin === 'center' ? "left-1/2 -translate-x-1/2 origin-center" :
            expandOrigin === 'left' ? "left-0 origin-left" :
            "right-0 origin-right"
          )}
          onMouseLeave={() => { setIsExpanded(false); setIsHovered(false); }}
        >
          <div 
            onClick={() => router.push(href)}
            className="flex-1 flex flex-col cursor-pointer"
          >
            {/* Top part: Trailer / Poster */}
            <div className="relative w-full h-[60%] bg-black overflow-hidden border-b border-white/5">
              <Image
                src={getImageUrl(media.backdrop_path || media.poster_path, "w500")}
                alt={title || "Poster"}
                fill
                className={`object-cover transition-opacity duration-700 ${trailerPlaying && minTimeElapsed && !trailerFailed ? 'opacity-0' : 'opacity-60'}`}
                sizes="30vw"
                draggable={false}
                style={{ userSelect: 'none' }}
              />
              {!preferences.dataSaver && trailerKey && !trailerFailed && (
                <div className={`absolute inset-0 bg-black overflow-hidden pointer-events-none transition-opacity duration-700 ${trailerPlaying && minTimeElapsed ? 'opacity-100' : 'opacity-0'}`}>
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
                    className="absolute top-1/2 left-1/2 w-[300%] h-[200%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    allow="autoplay; encrypted-media"
                    title="Trailer"
                    onLoad={() => {
                      if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
                      }
                      // Fallback: If YouTube JS API fails to broadcast, reveal after a longer safe time (4s) so UI is guaranteed gone
                      setTimeout(() => {
                        setTrailerPlaying(true);
                      }, 4000);
                    }}
                  />
                </div>
              )}
              {!preferences.dataSaver && trailerKey && trailerPlaying && !trailerFailed && (
                 <div className="absolute top-2 right-2 flex items-center gap-1.5 z-50 animate-in fade-in duration-300">
                    <button 
                      onClick={toggleTrailerMute} 
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all active:scale-90"
                      title={trailerMuted ? "Unmute" : "Mute"}
                    >
                       {trailerMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button 
                      onClick={toggleTrailerPlayPause} 
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all active:scale-90"
                      title={trailerPaused ? "Play" : "Pause"}
                    >
                       {trailerPaused ? <Play size={12} className="ml-0.5 fill-white" /> : <Pause size={12} className="fill-white" />}
                    </button>
                 </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom part: Metadata & Play */}
            <div className="relative flex flex-col justify-end px-4 py-3 h-[40%] bg-void-950 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Link
                    href={`${href}?play=1`}
                    className="flex items-center justify-center bg-white text-black hover:bg-gray-200 w-8 h-8 rounded-full transition-all active:scale-95 shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Play size={14} className="fill-black ml-0.5" />
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleWatchlist(e); }}
                    className="flex items-center justify-center bg-void-800 hover:bg-void-700 border border-white/20 text-white w-8 h-8 rounded-full transition-all active:scale-95"
                  >
                    {onWatchlist ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                  {(media.contextType === 'history' || media.contextType === 'favorites') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFavorite(e); }}
                      className="flex items-center justify-center bg-void-800 hover:bg-void-700 border border-white/20 text-white w-8 h-8 rounded-full transition-all active:scale-95"
                    >
                      <Heart size={14} className={onFavorites ? 'fill-pink-500 text-pink-500' : ''} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-sm leading-tight truncate drop-shadow-md">{title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-green-500 font-semibold text-[10px] drop-shadow-md">{(media.vote_average ? (media.vote_average * 10).toFixed(0) : '90')}% Match</p>
                  <p className="text-white/60 font-semibold text-[10px] drop-shadow-md border border-white/20 px-1 rounded-sm">{year}</p>
                  <p className="text-white/60 font-semibold text-[10px] drop-shadow-md">{isMovie ? 'Movie' : 'Series'}</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {media.genre_ids?.slice(0, 3).map(id => {
                    const genreMap: Record<number, string> = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 27: 'Horror', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 37: 'Western', 10759: 'Action & Adv.', 10765: 'Sci-Fi & Fantasy' };
                    return genreMap[id] ? <span key={id} className="text-[9px] text-white/50">{genreMap[id]}</span> : null;
                  }).reduce((prev, curr) => curr ? (prev === null ? [curr] : [...prev, <span key={`dot-${curr.key}`} className="text-[9px] text-white/20">•</span>, curr]) : prev, null as any)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
  </div>
  );
});
