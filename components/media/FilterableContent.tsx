'use client';
import { useState, useTransition } from 'react';
import { HorizontalRow } from './HorizontalRow';
import { Media } from '@/types/tmdb';
import { MediaGrid } from './MediaGrid';
import { GENRES_MAP } from '@/lib/genres';

export function FilterableContent({ sections }: { sections: { title: string; items: Media[] }[] }) {
  const [activeGenres, setActiveGenres] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleFilter = (genreId: number | null) => {
    startTransition(() => {
      if (genreId === null) setActiveGenres([]);
      else setActiveGenres(prev =>
        prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
      );
    });
  };

  // Collect all unique genres
  const allGenreIds = new Set<number>();
  sections.forEach(s => s.items.forEach(i => i.genre_ids?.forEach(id => allGenreIds.add(id))));
  const availableGenres = Array.from(allGenreIds)
    .map(id => ({ id, name: GENRES_MAP[id] }))
    .filter(g => g.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-2 w-full z-20 relative">
      {/* Genre filter pills */}
      <div className="relative">
        <div 
          className="px-6 md:px-14 flex items-center gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-mandatory" 
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <button
            onClick={() => handleFilter(null)}
            className="flex-shrink-0 snap-start h-[32px] px-[14px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200"
            style={{
              background: activeGenres.length === 0 ? 'var(--brand-500)' : 'rgba(255,255,255,0.05)',
              color: activeGenres.length === 0 ? '#fff' : 'rgba(255,255,255,0.5)',
              border: activeGenres.length === 0 ? '1px solid var(--brand-500)' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: activeGenres.length === 0 ? '0 0 12px color-mix(in srgb, var(--brand-500) 40%, transparent)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (activeGenres.length !== 0) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeGenres.length !== 0) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }
            }}
          >
            All
          </button>
          {availableGenres.map(genre => {
            const active = activeGenres.includes(genre.id);
            return (
              <button
                key={genre.id}
                onClick={() => handleFilter(genre.id)}
                className="flex-shrink-0 snap-start h-[32px] px-[14px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200"
                style={{
                  background: active ? 'var(--brand-500)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: active ? '1px solid var(--brand-500)' : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: active ? '0 0 12px color-mix(in srgb, var(--brand-500) 40%, transparent)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                  }
                }}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
        {/* Right edge fade gradient mask */}
        <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none bg-gradient-to-l from-[#0a0a0f] to-transparent z-10" />
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-0 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {sections.map(section => {
          const filtered = activeGenres.length > 0
            ? section.items.filter(item => activeGenres.some(g => item.genre_ids?.includes(g)))
            : section.items;
          if (filtered.length === 0) return null;
          return (
            <HorizontalRow
              key={section.title}
              title={section.title}
              items={filtered}
            />
          );
        })}

        {sections.every(section => {
          const filtered = activeGenres.length > 0
            ? section.items.filter(item => activeGenres.some(g => item.genre_ids?.includes(g)))
            : section.items;
          return filtered.length === 0;
        }) && (
          <div className="flex items-center justify-center py-24 px-4 text-center">
            <div>
              <p
                className="text-6xl mb-4"
                style={{ filter: 'grayscale(1)', opacity: 0.3 }}
              >🎬</p>
              <p className="text-xl font-display font-bold text-white/30 mb-1">No matches found</p>
              <p className="text-sm text-white/20">Try a different genre filter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
