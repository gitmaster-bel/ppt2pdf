import React from 'react';

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden bg-void-950 animate-pulse transform-gpu">
      {/* Background Gradient Mock */}
      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/60 to-transparent z-10" />
      
      {/* Content Skeleton */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-4 pb-24 md:px-12 md:pb-32">
        <div className="max-w-3xl flex flex-col gap-4">
          {/* Logo / Title Skeleton */}
          <div className="w-[300px] md:w-[450px] h-[80px] md:h-[120px] bg-white/10 rounded-xl" />
          
          {/* Meta Info Skeleton */}
          <div className="flex items-center gap-4 mt-2">
            <div className="w-12 h-6 bg-white/10 rounded" />
            <div className="w-16 h-6 bg-white/10 rounded" />
            <div className="w-24 h-6 bg-white/10 rounded" />
          </div>
          
          {/* Description Skeleton */}
          <div className="flex flex-col gap-2 mt-4 hidden md:flex">
            <div className="w-full h-4 bg-white/10 rounded" />
            <div className="w-5/6 h-4 bg-white/10 rounded" />
            <div className="w-4/6 h-4 bg-white/10 rounded" />
          </div>
          
          {/* Buttons Skeleton */}
          <div className="flex items-center gap-4 mt-6">
            <div className="w-32 h-12 bg-white/10 rounded-full" />
            <div className="w-32 h-12 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
