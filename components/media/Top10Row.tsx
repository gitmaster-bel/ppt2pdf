'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Media } from '@/types/tmdb';
import { MediaCard } from './MediaCard';
import { motion } from 'motion/react';
import { SectionTitle } from '@/components/ui/SectionTitle';

interface Top10RowProps {
  title: string;
  items: Media[];
}

function Top10Card({ item, index }: { item: Media; index: number }) {
  return (
    <div
      className="relative flex items-end group/top10 flex-shrink-0"
      style={{ width: 'clamp(210px, 22vw, 290px)' }}
    >
      <div
        className="absolute bottom-[-12px] left-0 z-0 text-transparent pointer-events-none select-none font-display font-black leading-none tracking-tighter"
        style={{ fontSize: 'clamp(7.5rem, 15vw, 13rem)', WebkitTextStroke: '2.5px rgba(255,255,255,0.18)' }}
      >
        <span className="group-hover/top10:text-white transition-colors duration-300">
          {index + 1}
        </span>
      </div>
      <div className="relative z-10 w-[65%] ml-auto h-full">
        <MediaCard media={item} variant="top10" />
      </div>
    </div>
  );
}

export function Top10Row({ title, items, limit = 10 }: Top10RowProps & { limit?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.75 : -(el.clientWidth * 0.75), behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  useEffect(() => {
    checkScroll();
    // Re-check after images/layout load completely
    const timer = setTimeout(checkScroll, 500);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, items]);

  if (!items || items.length === 0) return null;

  return (
    <section
      className="relative group/row"
    >
      <SectionTitle
        title={title}
        icon="🏆"
        accent="brand"
        className="!mt-0 !mb-4"
      />

      <div className="relative group/scroll">
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-4 md:left-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10
            flex items-center justify-center rounded-full transition-[opacity,transform] duration-200
            ${canScrollLeft ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-4 md:right-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10
            flex items-center justify-center rounded-full transition-[opacity,transform] duration-200
            ${canScrollRight ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronRight size={20} className="text-white" />
        </button>

        <div className={`absolute left-0 top-0 bottom-0 w-8 md:w-24 z-20 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-[#0a0a0f] to-transparent ${canScrollLeft ? 'opacity-30 md:opacity-100' : 'opacity-0'}`} />
        <div className={`absolute right-0 top-0 bottom-0 w-8 md:w-24 z-20 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-[#0a0a0f] to-transparent ${canScrollRight ? 'opacity-30 md:opacity-100' : 'opacity-0'}`} />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto overflow-y-hidden  no-scrollbar scroll-smooth overscroll-x-contain"
          style={{
            paddingLeft: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingRight: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingTop: '32px',
            paddingBottom: '24px',
            willChange: 'transform',
            transform: 'translateZ(0)',
            touchAction: 'pan-x pan-y',
          }}
        >
          {items.slice(0, limit).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="h-full">
              <Top10Card item={item} index={idx} />
            </div>
          ))}
          <div className="flex-shrink-0 w-4 md:w-8" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
