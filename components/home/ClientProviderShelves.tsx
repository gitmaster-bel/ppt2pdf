'use client';
import { useEffect, useState } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { Media } from '@/types/tmdb';
import { ProviderHeroShelf } from '@/components/providers/ProviderHeroShelf';
import { ProviderRowSkeleton } from '@/components/ui/ProviderRowSkeleton';
import { PROVIDERS } from '@/lib/providers';

export function ClientProviderShelves() {
  const { preferences } = usePreferences();
  const [data, setData] = useState<{ netflix: Media[]; prime: Media[]; disney: Media[]; hbo: Media[]; jio?: Media[] } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchShelves = async () => {
      const countryCode = preferences.country || 'US';
      try {
        const res = await fetch(`/api/regional-providers?country=${countryCode}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (isMounted && json) {
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch regional provider shelves', e);
      }
    };
    fetchShelves();
    return () => { isMounted = false; };
  }, [preferences.country]);

  if (!data) {
    const countryCode = preferences.country || 'US';
    return (
      <div className="flex flex-col gap-6 md:gap-10">
        <ProviderRowSkeleton title="Popular on Netflix" provider={PROVIDERS.find(p => p.id === 8)} />
        <ProviderRowSkeleton title="Popular on Prime Video" provider={PROVIDERS.find(p => p.id === 9)} />
        {countryCode === 'IN' ? (
          <ProviderRowSkeleton title="Popular on JioHotstar" provider={PROVIDERS.find(p => p.id === "122|532|2336")} />
        ) : (
          <>
            <ProviderRowSkeleton title="Popular on Disney+" provider={PROVIDERS.find(p => p.id === 337)} />
            <ProviderRowSkeleton title="Popular on Max" provider={PROVIDERS.find(p => p.id === 1899)} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <ProviderHeroShelf
        title="Popular on Netflix"
        items={data.netflix}
        provider={PROVIDERS.find(p => p.id === 8)!}
      />
      
      <ProviderHeroShelf
        title="Popular on Prime Video"
        items={data.prime}
        provider={PROVIDERS.find(p => p.id === 9)!}
      />

      {preferences.country === 'IN' ? (
        data.jio && data.jio.length > 0 && (
          <ProviderHeroShelf
            title="Popular on JioHotstar"
            items={data.jio}
            provider={PROVIDERS.find(p => p.id === "122|532|2336")!}
          />
        )
      ) : (
        <>
          <ProviderHeroShelf
            title="Popular on Disney+"
            items={data.disney}
            provider={PROVIDERS.find(p => p.id === 337)!}
          />
          
          <ProviderHeroShelf
            title="Popular on Max"
            items={data.hbo}
            provider={PROVIDERS.find(p => p.id === 1899)!}
          />
        </>
      )}
    </div>
  );
}
