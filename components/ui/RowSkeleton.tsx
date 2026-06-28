import React from 'react';

export function RowSkeleton({ title }: { title?: string }) {
  return (
    <section className="w-full flex flex-col gap-3 py-6 overflow-hidden animate-pulse transform-gpu">
      {/* Title Skeleton */}
      <div className="px-4 md:px-12 flex flex-col gap-2">
        {title ? (
          <h2 className="text-xl md:text-2xl font-black text-white/40 tracking-tight">{title}</h2>
        ) : (
          <div className="h-6 w-48 bg-white/5 rounded-md transform-gpu"></div>
        )}
      </div>
      
      {/* Cards Skeleton Row */}
      <div className="flex gap-4 px-4 md:px-12 overflow-x-auto no-scrollbar pt-2 transform-gpu">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 flex flex-col gap-2 transform-gpu">
            <div 
              className="w-[140px] md:w-[160px] lg:w-[180px] xl:w-[200px] aspect-[2/3] bg-white/5 rounded-xl border border-white/5 transform-gpu"
            ></div>
            <div className="h-3 w-3/4 bg-white/5 rounded mt-1 transform-gpu"></div>
            <div className="h-2 w-1/2 bg-white/5 rounded transform-gpu"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
