'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Media } from '@/types/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { generateSlug } from '@/lib/utils';
import { useWatchlist } from '@/hooks/useWatchlist';
import { motion, AnimatePresence } from 'motion/react';

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 27: 'Horror',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 37: 'Western',
  10759: 'Action & Adv.', 10765: 'Sci-Fi & Fantasy',
};

export function HeroSlider({ items }: { items: Media[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % Math.min(items.length, 6));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + Math.min(items.length, 6)) % Math.min(items.length, 6));
  }, [items.length]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(goNext, 8000);
    return () => clearInterval(timer);
  }, [paused, goNext]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchStart.x - e.changedTouches[0].clientX;
    const diffY = touchStart.y - e.changedTouches[0].clientY;
    
    // Only trigger slide if the swipe was mostly horizontal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) goNext();
      else goPrev();
    }
  };

  if (!items.length) return null;

  const visibleItems = items.slice(0, 6);
  const current = visibleItems[currentIndex];
  const title = current.title || current.name || '';
  const isMovie = current.media_type === 'movie' || !current.name;
  const inList = current.id ? isInWatchlist(current.id.toString()) : false;
  const genres = (current.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean);
  const year = (current.release_date || current.first_air_date || '').slice(0, 4);
  const rating = current.vote_average ? current.vote_average.toFixed(1) : null;

  const handleToggleList = () => {
    if (!current.id || !title) return;
    toggleWatchlist({ id: current.id.toString(), type: isMovie ? 'movie' : 'tv', title, poster: current.poster_path });
  };

  return (
    <div className="relative w-full bg-[#050505] z-10">
      <div
        className="relative w-full bg-[#050505] overflow-hidden h-[100dvh] md:h-[95vh] min-h-[450px] md:min-h-[550px] max-h-[1080px] group"
        style={{ contain: 'layout' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
      {/* ── BACKGROUND IMAGE ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`bg-${current.id}-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={getImageUrl(current.backdrop_path, 'original')}
            alt={title}
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-top"
            style={{ animation: 'ken-burns 16s ease-in-out alternate forwards' }}
            priority={currentIndex === 0}
            {...(currentIndex === 0 ? { fetchPriority: "high" } : { loading: "lazy" })}
            referrerPolicy="no-referrer"
            unoptimized={true}
          />
          {/* Gradient overlays — brightened slightly for better visibility */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%),
                linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 5%, rgba(0,0,0,0.2) 30%, transparent 60%),
                linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 15%)
              `,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── LEFT/RIGHT NAV ARROWS ── */}
      <button
        onClick={goPrev}
        aria-label="Previous"
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 opacity-30 hover:opacity-100 group-hover:opacity-100"
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ChevronLeft size={24} className="text-white" />
      </button>
      <button
        onClick={goNext}
        aria-label="Next"
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 opacity-30 hover:opacity-100 group-hover:opacity-100"
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* ── CONTENT — Always Visible ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 sm:px-6 md:px-14 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`content-${current.id}-${currentIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-6 max-w-2xl"
          >
            {/* Title / Logo */}
            {current.logo_path ? (
              <div className="relative h-[140px] sm:h-[180px] max-w-[75vw] sm:max-w-[480px] mb-3 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <Image
                  src={getImageUrl(current.logo_path, 'original')}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 75vw, 480px"
                  className="object-contain object-left-bottom"
                />
              </div>
            ) : (
              <h1
                className="font-display font-black text-white leading-[0.9] mb-3 tracking-tight"
                style={{
                  fontSize: 'clamp(2rem, 8vw, 4.5rem)',
                  textShadow: '0 4px 40px rgba(0,0,0,0.9)',
                }}
              >
                {title}
              </h1>
            )}

            {/* Genre + Year + Rating Row - Pill Badges */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {isMovie ? (
                <div className="flex items-center gap-1.5 bg-premium-gradient px-2 py-0.5 rounded-full shadow-lg">
                  <span className="text-white text-[10px] font-bold uppercase tracking-[0.1em]">Movie</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-premium-gradient px-2 py-0.5 rounded-full shadow-lg">
                  <span className="text-white text-[10px] font-bold uppercase tracking-[0.1em]">Series</span>
                </div>
              )}
              {rating && (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md shadow-lg">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-white text-xs font-bold tracking-wide">{rating}/10</span>
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md shadow-lg">
                  <span className="text-white/80 text-xs font-medium tracking-wide">🗓 {year}</span>
                </div>
              )}
              {(current as any).number_of_seasons && (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md shadow-lg">
                  <span className="text-white/80 text-xs font-medium tracking-wide">
                    {(current as any).number_of_seasons} Season{(current as any).number_of_seasons > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {genres.length > 0 && (
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md shadow-lg">
                  <span className="text-white/80 text-xs font-medium tracking-wide">
                    {genres[0]} {genres.length > 1 ? `& ${genres[1]}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Overview text */}
            <p className="text-white/65 text-sm md:text-base leading-relaxed line-clamp-3 max-w-lg mb-5">
              {current.overview}
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href={`/watch/${isMovie ? 'movie' : 'tv'}/${generateSlug(current.id.toString(), current.title || current.name)}?play=1`}
                className="flex items-center justify-center gap-2.5 px-8 py-3 rounded-full font-bold text-[15px] text-black transition-[opacity,transform] duration-200 active:scale-95 hover:opacity-90 shadow-xl min-w-[140px]"
                style={{
                  background: '#ffffff',
                }}
              >
                <Play size={18} className="fill-black" />
                Play Now
              </Link>
              
              <Link
                href={`/watch/${isMovie ? 'movie' : 'tv'}/${generateSlug(current.id.toString(), current.title || current.name)}`}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95 hover:bg-white/10"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
                aria-label="More info"
              >
                <Info size={18} className="text-white" />
              </Link>
              
              <button
                onClick={handleToggleList}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 active:scale-95 hover:bg-white/10"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
                aria-label={inList ? 'Remove from My List' : 'Add to My List'}
              >
                {inList ? <Check size={18} className="text-white" /> : <Plus size={18} className="text-white" />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── BOTTOM INFO BAR ── */}
        <div className="flex items-center justify-between pb-2 mb-0">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {visibleItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
                className="rounded-full transition-[width,background-color,box-shadow] duration-300 ease-out"
                style={{
                  width: idx === currentIndex ? '40px' : '8px',
                  height: '8px',
                  background: idx === currentIndex ? 'var(--brand-500)' : 'rgba(255,255,255,0.3)',
                  boxShadow: idx === currentIndex ? '0 0 12px color-mix(in srgb, var(--brand-500) 80%, transparent)' : 'none',
                }}
              />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-white/25 text-xs font-mono">
              {String(currentIndex + 1).padStart(2, '0')} / {String(visibleItems.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
      </div>
      
      {/* Subpixel gap cover (bleeds outside overflow) to stamp out mobile subpixel lines */}
      <div className="absolute -bottom-[2px] left-0 right-0 h-[4px] bg-[#050505] z-0 pointer-events-none" />
    </div>
  );
}
