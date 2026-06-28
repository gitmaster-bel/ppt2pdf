'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Media } from '@/types/tmdb';
import { MediaCard } from '@/components/media/MediaCard';
import { Provider } from '@/lib/providers';

interface ProviderHeroShelfProps {
  provider: Provider;
  title: string;
  items: Media[];
}

export function ProviderHeroShelf({ provider, title, items }: ProviderHeroShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);


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
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);
  }, []);

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
  }, [checkScroll, items]);

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

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.75 : -(el.clientWidth * 0.75), behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  if (!items || items.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative group/row mb-6 md:mb-10">
      {/* Provider Header */}
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-14 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Brand Accent Bar */}
          <div className="w-1 h-5 md:w-1.5 md:h-6 rounded-full" style={{ backgroundColor: provider.color, boxShadow: `0 0 12px ${provider.color}80` }} />
          
          <Link href={`/providers/${provider.slug}`} className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={provider.logo} alt={provider.name} className="h-7 w-auto object-contain hidden sm:block" />
            <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              {title}
              <ArrowRight size={18} className="opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ color: provider.color }} />
            </h2>
          </Link>
        </div>
        
        <Link
          href={`/providers/${provider.slug}`}
          className="flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-white transition-colors duration-200 group"
        >
          See All
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      <div className="relative group/scroll">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-4 md:left-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10
            hidden md:flex items-center justify-center rounded-full transition-[opacity,transform] duration-200
            ${canScrollLeft ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-4 md:right-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10
            hidden md:flex items-center justify-center rounded-full transition-[opacity,transform] duration-200
            ${canScrollRight ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronRight size={20} className="text-white" />
        </button>

        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-20 pointer-events-none transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, #0a0a0f, transparent)', opacity: canScrollLeft ? 1 : 0 }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-20 pointer-events-none transition-opacity duration-300"
          style={{ background: 'linear-gradient(to left, #0a0a0f, transparent)', opacity: canScrollRight ? 1 : 0 }} />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={() => setHasInteracted(true)}
          className="w-full flex gap-3 md:gap-4 overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth transform-gpu will-change-transform pb-8"
          style={{ 
            paddingLeft: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingRight: 'clamp(1rem, 3.5vw, 3.5rem)',
            overscrollBehaviorX: 'contain', 
            willChange: 'transform', 
            transform: 'translateZ(0)' 
          }}
        >
          <div className="flex gap-3 md:gap-4 w-max">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="w-[140px] sm:w-[160px] md:w-[200px] lg:w-[220px] shrink-0">
                <MediaCard media={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
