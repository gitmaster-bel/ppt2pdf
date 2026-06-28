'use client';

import { useState } from 'react';
import { PROVIDERS } from '@/lib/providers';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/ui/SectionTitle';

const TOP_PROVIDERS = [
  'netflix', 'prime-video', 'disney-plus', 'max', 'jiohotstar', 
  'apple-tv-plus', 'hulu', 'sonyliv', 'crunchyroll', 'zee5',
  'paramount-plus', 'peacock',
];

function ProviderCard({ p }: { p: typeof PROVIDERS[0] }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/providers/${p.slug}`}
      className="group relative flex-shrink-0 flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-white/[0.04] transition-all duration-700 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)] hover:z-10 hover:border-white/20"
      style={{
        width: 'clamp(140px, 16vw, 180px)',
        height: 'clamp(90px, 10vw, 110px)',
        background: `linear-gradient(135deg, ${p.color}15 0%, #0a0a0a 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${p.color}50 0%, transparent 70%)`,
        }}
      />

      {/* Logo or Fallback */}
      <div className="relative w-[75%] h-[44px] md:h-[52px] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
        {!imgError ? (
          <Image
            src={p.logo}
            alt={p.name}
            fill
            className="object-contain opacity-85 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg"
            sizes="130px"
            onError={() => setImgError(true)}
            unoptimized={p.logo.includes('tmdb')} // Bypass optimization if TMDB blocks server IP
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <span className="font-display font-black text-xl text-white/80 tracking-tighter uppercase drop-shadow-md text-center leading-none">
              {p.name}
            </span>
          </div>
        )}
      </div>

      {/* Name on hover (if logo is successfully loaded) */}
      {!imgError && (
        <div className="absolute bottom-0 left-0 right-0 h-[28px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0"
          style={{ background: `${p.color}30`, backdropFilter: 'blur(4px)' }}
        >
          <span className="text-[10px] font-bold text-white/90 tracking-wider uppercase truncate px-2 drop-shadow-md">
            {p.name}
          </span>
        </div>
      )}
    </Link>
  );
}

export function ProvidersGrid() {
  const baseProviders = TOP_PROVIDERS
    .map(slug => PROVIDERS.find(p => p.slug === slug))
    .filter(Boolean) as typeof PROVIDERS;
    
  // Duplicate for seamless infinite marquee
  const providers = [...baseProviders, ...baseProviders];

  return (
    <section className="w-full flex flex-col gap-2 overflow-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 80s linear infinite;
          will-change: transform;
        }
        .group\\/marquee:hover .animate-marquee {
          animation-play-state: paused;
        }
        /* Gradient fade edges for the marquee */
        .mask-edges {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>

      {/* Header */}
      <SectionTitle
        title="Stream by Platform"
        viewAllHref="/providers"
        className="!mt-0 !mb-0 relative z-10"
      />

      {/* Scrolling Row */}
      <div className="relative group/marquee w-full mask-edges pb-6 pt-2">
        <div className="flex gap-4 w-max animate-marquee" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
          {providers.map((p, idx) => (
            <ProviderCard key={`${p.id}-${idx}`} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
