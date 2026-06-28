import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Provider } from '@/lib/providers';

interface ProviderRowSkeletonProps {
  title?: string;
  provider?: Provider;
}

export function ProviderRowSkeleton({ title, provider }: ProviderRowSkeletonProps) {
  return (
    <section className="relative group/row mb-6 md:mb-10 w-full flex flex-col overflow-hidden animate-pulse transform-gpu">
      {/* Provider Header */}
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-14 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Brand Accent Bar (Real or Skeleton) */}
          <div 
            className="w-1 h-5 md:w-1.5 md:h-6 rounded-full bg-white/10" 
            style={provider ? { backgroundColor: provider.color, boxShadow: `0 0 12px ${provider.color}80` } : {}}
          />
          
          <div className="flex items-center gap-2">
            {provider ? (
               <img src={provider.logo} alt={provider.name} className="h-7 w-auto object-contain hidden sm:block opacity-50 grayscale" />
            ) : (
               <div className="h-7 w-20 bg-white/5 rounded hidden sm:block"></div>
            )}
            
            {title ? (
              <h2 className="text-lg md:text-xl font-display font-bold text-white/40 tracking-tight flex items-center gap-2">
                {title}
              </h2>
            ) : (
              <div className="h-6 w-48 bg-white/5 rounded-md"></div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs font-semibold text-white/20">
          See All
          <ArrowRight size={12} />
        </div>
      </div>
      
      {/* Cards Skeleton Row */}
      <div className="flex gap-4 px-4 md:px-14 overflow-x-auto no-scrollbar pt-2 pb-4 transform-gpu">
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
