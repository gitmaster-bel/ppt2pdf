import { Suspense } from 'react';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PROVIDERS } from '@/lib/providers';
import { tmdb } from '@/lib/tmdb';
import { Media } from '@/types/tmdb';
import { ProviderSidebar } from '@/components/providers/ProviderSidebar';
import { ProviderContentGrid } from '@/components/providers/ProviderContentGrid';
import { ProviderHeroShelf } from '@/components/providers/ProviderHeroShelf';
import { BackButton } from '@/components/ui/BackButton';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return PROVIDERS.map((provider) => ({
    slug: provider.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const provider = PROVIDERS.find((p) => p.slug === resolvedParams.slug);
  return {
    title: provider ? provider.name : 'Provider Not Found',
    robots: { index: false, follow: false },
  };
}

export default async function ProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const provider = PROVIDERS.find((p) => p.slug === resolvedParams.slug);

  if (!provider) {
    notFound();
  }

  // Fetch trending shelf data globally
  let trendingData: { results: Media[] } = { results: [] };
  if (provider.hasTrending) {
    try {
      trendingData = await tmdb.discoverGlobalProvider(provider.id.toString(), provider.region);
    } catch (e) {
      console.error(`Failed to fetch trending for ${provider.name}`);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black -mt-[72px] relative overflow-hidden">
      
      {/* Massive Ambient Background Glow & Logo */}
      <div 
        className="fixed top-0 left-0 w-full h-[100vh] pointer-events-none z-0 opacity-20"
        style={{ 
          background: `radial-gradient(circle at 50% 0%, ${provider.color} 0%, transparent 80%)`,
          filter: 'blur(100px)'
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] md:w-[80vw] h-[80vh] pointer-events-none z-0 opacity-10 mix-blend-screen blur-[30px] md:blur-[60px]">
        <Image
          src={provider.logo}
          alt=""
          fill
          className="object-contain object-top"
          priority
        />
      </div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-12 md:pt-40 md:pb-20 flex flex-col items-center justify-center z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center w-full mt-6 md:mt-10">
          {/* Back Button in normal flow */}
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 mb-8 flex justify-start">
            <BackButton href="/providers" />
          </div>

          <div className="w-[160px] h-[80px] md:w-[280px] md:h-[140px] relative mb-6">
            <Image
              src={provider.logo}
              alt={provider.name}
              fill
              className="object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              priority
            />
          </div>
          
          <p className="text-zinc-300 text-base md:text-xl font-medium tracking-wide drop-shadow-md text-center px-4 max-w-2xl">
            {provider.tagline}
          </p>
          
          <div className="flex items-center gap-3 mt-8 text-[10px] md:text-xs font-bold tracking-widest uppercase text-white/40 bg-void-950/40 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
            {provider.categories.includes('movie') && <span className="text-white/80">Movies</span>}
            {provider.categories.length === 2 && <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
            {provider.categories.includes('tv') && <span className="text-white/80">Series</span>}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: provider.color || 'rgba(255,255,255,0.2)' }} />
            <span className="text-white font-black">Global Access</span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 flex flex-col w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 pb-20">
        
        {/* Trending Shelf (SSR) */}
        {provider.hasTrending && trendingData.results.length > 0 && (
          <div className="pt-4 pb-8 border-b border-white/5 mb-8">
            <ProviderHeroShelf 
              provider={provider} 
              title={`Trending Globally on ${provider.name}`} 
              items={trendingData.results.slice(0, 20)} 
            />
          </div>
        )}

        {/* 2-Column Layout */}
        <div id="provider-grid" className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full mt-4 scroll-mt-24">
          {/* Left Sidebar */}
          <Suspense fallback={<div className="w-full md:w-64 shrink-0 h-96 bg-white/5 rounded-2xl animate-pulse"></div>}>
            <ProviderSidebar provider={provider} />
          </Suspense>

          {/* Right Content Grid */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="w-full h-96 bg-white/5 rounded-2xl animate-pulse"></div>}>
              <ProviderContentGrid provider={provider} />
            </Suspense>
          </div>
        </div>

      </div>
    </div>
  );
}

