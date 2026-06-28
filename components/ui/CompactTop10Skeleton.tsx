import React from 'react';

interface CompactTop10SkeletonProps {
  title?: string;
}

export function CompactTop10Skeleton({ title }: CompactTop10SkeletonProps) {
  return (
    <section className="relative group/row w-full flex flex-col overflow-hidden animate-pulse transform-gpu">
      {/* Title Skeleton */}
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-14 flex items-center justify-between mt-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 md:w-1.5 md:h-6 rounded-full bg-premium-gradient" />
          <div className="flex flex-col">
            <h2 className="text-lg md:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-white/80">🔥</span>
              {title ? title : <div className="h-6 w-48 bg-white/5 rounded-md" />}
            </h2>
          </div>
        </div>
      </div>

      <div className="relative group/scroll">
        <div 
          className="flex gap-5 md:gap-7 overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain"
          style={{
            paddingLeft: 'clamp(1.5rem, 4vw, 4.5rem)',
            paddingRight: 'clamp(1rem, 3.5vw, 3.5rem)',
            paddingTop: '20px',
            paddingBottom: '30px',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative group/compact flex-shrink-0 w-[140px] md:w-[160px] lg:w-[180px] xl:w-[200px] transform-gpu h-full mt-2">
              {/* Media Card Skeleton */}
              <div className="w-full aspect-[2/3] bg-white/5 rounded-xl border border-white/5 shadow-lg transform-gpu" />
              
              {/* Title & Subtitle Skeleton */}
              <div className="mt-2 px-1">
                <div className="h-3 w-3/4 bg-white/10 rounded-sm mb-1.5" />
                <div className="h-2 w-1/2 bg-white/5 rounded-sm" />
              </div>

              {/* Massive Number Skeleton */}
              <div 
                className="absolute bottom-[36px] md:bottom-[30px] -left-3 md:-left-5 z-40 text-transparent font-display font-black leading-none tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-none"
                style={{ 
                  fontSize: 'clamp(5.5rem, 10vw, 8rem)', 
                  WebkitTextStroke: '2px rgba(255,255,255,0.4)'
                }}
              >
                {i}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
