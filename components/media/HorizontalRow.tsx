'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Media } from '@/types/tmdb';
import { MediaCard } from './MediaCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ReactNode } from 'react';

interface HorizontalRowProps {
  title: string;
  subtitle?: string;
  items: Media[];
  seeAllHref?: string;
  variant?: 'default' | 'numbered';
  actionNode?: ReactNode;
}

export function HorizontalRow({ title, subtitle, items, seeAllHref, variant = 'default', actionNode }: HorizontalRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // ── CSS-based reveal (no Framer Motion IntersectionObserver overhead) ────────
  // One shared IntersectionObserver class-swap instead of per-row Framer Motion
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('row-revealed');
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '-60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cache dimensions to avoid layout thrashing
  const dimensions = useRef({ width: 0, client: 0 });

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Only read layout properties if not cached or resizing
    if (dimensions.current.client === 0) {
      dimensions.current.width = el.scrollWidth;
      dimensions.current.client = el.clientWidth;
    }
    
    const maxScroll = dimensions.current.width - dimensions.current.client;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < maxScroll - 15);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // Reset cache on resize
      dimensions.current.client = 0;
      checkScroll();
    };
    
    // Run initial check and set a small timeout in case images push width
    handleResize();
    const timer = setTimeout(handleResize, 500);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll, items]);

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

  if (!items || items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative group/row row-hidden"
    >
      {/* Header */}
      <SectionTitle
        title={title}
        subtitle={subtitle}
        viewAllHref={seeAllHref}
        actionNode={actionNode}
        className="!mt-0 !mb-3"
      />

      <div className="relative group/scroll">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={`absolute left-0 md:left-14 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10
            flex items-center justify-center rounded-full transition-[opacity,transform] duration-200
            ${canScrollLeft ? 'opacity-0 md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={`absolute right-0 md:right-14 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-10 md:h-10
            flex items-center justify-center rounded-full transition-[opacity,transform] duration-200
            ${canScrollRight ? (hasInteracted ? 'opacity-100' : 'opacity-80') + ' md:opacity-0 md:group-hover/scroll:opacity-100 hover:scale-110 active:scale-95' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(6,6,6,0.9)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          <ChevronRight size={20} className="text-white" />
        </button>

        {/* Edge fades */}
        <div className={`absolute left-0 top-0 bottom-0 w-8 md:w-24 z-20 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-[#0a0a0f] to-transparent ${canScrollLeft ? 'opacity-30 md:opacity-100' : 'opacity-0'}`} />
        <div className={`absolute right-0 top-0 bottom-0 w-8 md:w-24 z-20 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-[#0a0a0f] to-transparent ${canScrollRight ? 'opacity-30 md:opacity-100' : 'opacity-0'}`} />

        {/* Scroll track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={() => setHasInteracted(true)}
          className="flex gap-3 md:gap-4 overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain transform-gpu"
          style={{
            paddingLeft: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingRight: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingTop: '8px',
            paddingBottom: '24px',
            WebkitOverflowScrolling: 'touch',
            willChange: 'transform',
            transform: 'translateZ(0)',
            // touchAction: 'pan-x' removed to allow native vertical scrolling on mobile
          }}
        >
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="relative flex-shrink-0 snap-start"
              style={{ width: 'clamp(140px, 15vw, 190px)' }}
            >
              {variant === 'numbered' && (
                <span
                  className="absolute -left-3 bottom-[52px] z-10 font-display font-black leading-none select-none pointer-events-none"
                  style={{
                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                    color: 'transparent',
                    WebkitTextStroke: '2px rgba(255,255,255,0.25)',
                    lineHeight: 1,
                  }}
                >
                  {idx + 1}
                </span>
              )}
              <MediaCard media={item} />
            </div>
          ))}
          <div className="flex-shrink-0 w-4 md:w-8" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
