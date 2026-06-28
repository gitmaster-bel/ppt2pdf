import { Source } from '@/lib/sources';

interface TestingSourcesOverlayProps {
  testingSources: boolean;
  poster: string | null | undefined;
  testingCurrentName: string;
  testProgress: number;
}

export function TestingSourcesOverlay({ testingSources, poster, testingCurrentName, testProgress }: TestingSourcesOverlayProps) {
  if (!testingSources) return null;

  return (
    <div className="absolute inset-0 z-40 bg-void-950 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      {poster && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(https://media.themoviedb.org/t/p/w500${poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) saturate(1.5)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/70 to-void-950/50 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-xs w-full">
        <div className="relative">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div
            className="absolute inset-2 rounded-full"
            style={{
              background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-500) 15%, transparent) 0%, transparent 70%)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h3 className="text-[12px] text-[#9ca3af] font-medium flex items-center">
            Fetching media / Trying streaming servers<span className="animate-pulse tracking-widest">...</span>
          </h3>
          <p className="text-zinc-500 text-[11px] text-center max-w-[200px] leading-relaxed">
            Testing <span className="text-white font-semibold">{testingCurrentName}</span>
          </p>
        </div>
        
        <div className="w-full max-w-[200px]">
          <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-zinc-600 mb-1.5 uppercase tracking-widest">
            <span>Scanning</span>
            <span className="text-brand-500">{Math.round(testProgress)}%</span>
          </div>
          <div className="w-full h-[2px] bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-premium-gradient-dark rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${testProgress}%`,
                boxShadow: '0 0 8px color-mix(in srgb, var(--brand-500) 60%, transparent)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
