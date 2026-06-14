import { PROVIDERS } from '@/lib/providers';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Streaming Platforms',
  robots: { index: false, follow: false },
};

export default function ProvidersDirectoryPage() {
  const majors = PROVIDERS.filter((p) => p.tier === 'major');
  const regionals = PROVIDERS.filter((p) => p.tier === 'regional');
  const niches = PROVIDERS.filter((p) => p.tier === 'niche');

  return (
    <div className="flex flex-col min-h-screen pb-20 pt-24 px-4 sm:px-6 max-w-[1800px] mx-auto w-full relative">
      <AnimatedBackground />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
        <div>
          <div className="mb-6">
            <BackButton />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2">
            All Streaming Platforms
          </h1>
          <p className="text-zinc-400 text-lg">
            Browse content from 40+ services worldwide
          </p>
        </div>
      </div>

      {/* Major Platforms */}
      <section className="mb-16 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 rounded-full bg-premium-gradient shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
          <h2 className="text-2xl font-bold text-white">Major Platforms</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {majors.map(p => (
            <div key={p.id} className="w-full flex justify-center">
              <ProviderCard provider={p} size="xl" showName />
            </div>
          ))}
        </div>
      </section>

      {/* Regional Services */}
      <section className="mb-16 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
          <h2 className="text-2xl font-bold text-white">Regional Services</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {regionals.map(p => (
            <div key={p.id} className="w-full flex justify-center">
              <ProviderCard provider={p} size="xl" showName />
            </div>
          ))}
        </div>
      </section>

      {/* Free & Niche */}
      <section className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 rounded-full bg-zinc-400 shadow-[0_0_12px_rgba(161,161,170,0.6)]" />
          <h2 className="text-2xl font-bold text-white">Free & Niche</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {niches.map(p => (
            <div key={p.id} className="w-full flex justify-center">
              <ProviderCard provider={p} size="xl" showName />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
