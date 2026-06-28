'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Film, ArrowRight } from 'lucide-react';
import { generateSlug } from '@/lib/utils';
import { SectionTitle } from '@/components/ui/SectionTitle';

export interface CollectionData {
  id: number;
  name: string;
  backdrop: string;
  poster: string;
  movieCount: number;
  tagline: string;
}

export function CollectionsRow({ collections }: { collections: CollectionData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Cache dimensions to avoid layout thrashing
  const dimensions = useRef({ width: 0, client: 0 });

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    if (dimensions.current.client === 0) {
      dimensions.current.width = el.scrollWidth;
      dimensions.current.client = el.clientWidth;
    }
    
    const maxScroll = dimensions.current.width - dimensions.current.client;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < maxScroll - 15);
  }, []);

  // Throttle scroll events via requestAnimationFrame for 60fps buttery smooth scrolling
  const isScrolling = useRef(false);
  const handleScroll = useCallback(() => {
    if (!isScrolling.current) {
      isScrolling.current = true;
      requestAnimationFrame(() => {
        checkScroll();
        isScrolling.current = false;
      });
    }
  }, [checkScroll]);

  useEffect(() => {
    const handleResize = () => {
      dimensions.current.client = 0;
      checkScroll();
    };
    handleResize();
    const timer = setTimeout(handleResize, 500);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll, collections]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.75 : -(el.clientWidth * 0.75), behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  return (
    <section ref={sectionRef} className="relative group/row">
      {/* Header */}
      <SectionTitle
        title="Iconic Collections"
        viewAllHref="/collections"
        className="!px-4 md:!px-14 !mt-0 !mb-3"
      />

      <div className="relative group/scroll">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-4 md:left-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-[opacity,transform] duration-200 ${canScrollLeft ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-4 md:right-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full transition-[opacity,transform] duration-200 ${canScrollRight ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronRight size={20} className="text-white" />
        </button>

        {/* Edge fades */}
        <div className="absolute right-0 top-0 bottom-0 w-24 z-20 pointer-events-none transition-opacity duration-300"
          style={{ background: 'linear-gradient(to left, #0a0a0f, transparent)', opacity: canScrollRight ? 1 : 0 }} />

        {/* Scroll track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto overflow-y-hidden  no-scrollbar scroll-smooth"
          style={{
            paddingLeft: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingRight: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingTop: '8px',
            paddingBottom: '24px',
            willChange: 'transform',
            transform: 'translateZ(0)',
            touchAction: 'pan-x pan-y',
          }}
        >
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collection/${generateSlug(col.id.toString(), col.name)}`}
              className="relative flex-shrink-0 group/card rounded-xl overflow-hidden cursor-pointer bg-zinc-900 border border-zinc-800"
              style={{ width: 'clamp(240px, 28vw, 340px)', aspectRatio: '16/9' }}
            >
              {/* Backdrop image */}
              {col.backdrop && (
                <Image
                  src={`https://media.themoviedb.org/t/p/w780${col.backdrop}`}
                  alt={col.name}
                  fill
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 30vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover/card:scale-[1.05]"
                />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              {/* Active scale effect on hover */}
              <div className="absolute inset-0 border border-white/0 group-hover/card:border-white/15 rounded-xl transition-colors duration-300" />

              {/* Movie count badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-full">
                <Film size={9} className="text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-300">{col.movieCount}</span>
              </div>

              {/* Bottom text */}
              <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                <div>
                  <h3 className="text-white font-display font-bold text-sm md:text-base leading-tight">
                    {col.name}
                  </h3>
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-tight opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    {col.tagline}
                  </p>
                </div>
                <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center gap-1 text-white text-xs font-bold">
                  Explore <ArrowRight size={12} />
                </div>
              </div>
            </Link>
          ))}
          <div className="flex-shrink-0 w-4 md:w-8" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
