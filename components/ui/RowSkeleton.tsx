import React from 'react';

export function RowSkeleton() {
  return (
    <section className="w-full flex flex-col gap-3 py-6 overflow-hidden animate-pulse">
      {/* Title Skeleton */}
      <div className="px-4 md:px-12 flex flex-col gap-2">
        <div className="h-6 w-48 bg-white/5 rounded-md"></div>
        <div className="h-4 w-32 bg-white/5 rounded-md"></div>
      </div>
      
      {/* Cards Skeleton Row */}
      <div className="flex gap-4 px-4 md:px-12 overflow-x-auto no-scrollbar pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 flex flex-col gap-2">
            <div 
              className="w-[140px] md:w-[160px] lg:w-[180px] xl:w-[200px] aspect-[2/3] bg-white/5 rounded-xl border border-white/5"
            ></div>
            <div className="h-3 w-3/4 bg-white/5 rounded mt-1"></div>
            <div className="h-2 w-1/2 bg-white/5 rounded"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
