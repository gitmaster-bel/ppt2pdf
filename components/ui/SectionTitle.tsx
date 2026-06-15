'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  accent?: 'brand' | 'gold' | 'blue';
  icon?: string | ReactNode;
  viewAllHref?: string;
  actionNode?: ReactNode;
  className?: string;
}

export function SectionTitle({
  title,
  subtitle,
  accent = 'brand',
  icon,
  viewAllHref,
  actionNode,
  className
}: SectionTitleProps) {
  const router = useRouter();
  
  const accentColors = {
    brand: 'bg-premium-gradient',
    gold: 'bg-[#f59e0b]',
    blue: 'bg-[#3b82f6]'
  };

  return (
    <div className={cn("w-full max-w-[1920px] mx-auto px-4 md:px-14 flex items-center justify-between mt-4 mb-3", className)}>
      <div className="flex items-center gap-3">
        <div className={cn("w-1 h-5 md:w-1.5 md:h-6 rounded-full", accentColors[accent])} />
        <div className="flex flex-col">
          {viewAllHref ? (
            <Link href={viewAllHref} className="group flex items-center gap-2">
              <h2 className="text-lg md:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2 transition-colors group-hover:text-brand-300">
                {icon && (
                  <span className="text-white/80 group-hover:text-brand-300 transition-colors">
                    {icon}
                  </span>
                )}
                {title}
                <ArrowRight size={18} className="opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-brand-400" />
              </h2>
            </Link>
          ) : (
            <h2 className="text-lg md:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              {icon && (
                <span className="text-white/80">
                  {icon}
                </span>
              )}
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-[11px] text-white/40 mt-0.5 leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {actionNode}
        {viewAllHref && (
          <Link
            href={viewAllHref}
            onMouseEnter={() => router.prefetch(viewAllHref)}
            className="flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-white transition-colors duration-200 group"
          >
            View All
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        )}
      </div>
    </div>
  );
}
