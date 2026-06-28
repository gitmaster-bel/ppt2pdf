import React from 'react';

interface CompactTop10SkeletonProps {
  title?: string;
}

export function CompactTop10Skeleton({ title }: CompactTop10SkeletonProps) {
  return (
    <section className="relative group/row w-full flex flex-col overflow-hidden animate-pulse transform-gpu">
      {/* Title Skeleton */}
      <div className="flex items-center gap-2 mb-4 px-4 md:px-14">
        <span className="text-xl md:text-2xl text-brand-500 opacity-60">🔥</span>
        {title ? (
          <h2 className="text-xl md:text-2xl font-black text-white/40 tracking-tight">{title}</h2>
        ) : (
          <div className="h-6 w-48 bg-white/5 rounded-md transform-gpu"></div>
        )}
      </div>

      <div className="relative group/scroll">
        <div className="flex gap-3 px-4 md:px-14 overflow-x-auto no-scrollbar pb-6 pt-2 transform-gpu">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="relative group/compact flex-shrink-0 w-[140px] md:w-[160px] lg:w-[180px] xl:w-[200px] transform-gpu">
              {/* Media Card Skeleton */}
              <div className="w-full aspect-[2/3] bg-white/5 rounded-xl border border-white/5 shadow-lg transform-gpu" />
              
              {/* Massive Number Skeleton */}
              <div 
                className="absolute bottom-[36px] md:bottom-[30px] -left-3 md:-left-5 z-40 text-transparent pointer-events-none"
                style={{ 
                  fontSize: 'clamp(5.5rem, 10vw, 8rem)', 
                  WebkitTextStroke: '2px rgba(255,255,255,0.2)'
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
