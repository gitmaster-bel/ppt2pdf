import { motion, AnimatePresence } from 'motion/react';
import { Source } from '@/lib/sources';

interface ConnectingOverlayProps {
  isConnecting: boolean;
  poster: string | null | undefined;
  networkSpeed: 'fast' | 'medium' | 'slow';
  source: Source;
  connectProgress: number;
}

export function ConnectingOverlay({ isConnecting, poster, networkSpeed, source, connectProgress }: ConnectingOverlayProps) {
  return (
    <AnimatePresence>
      {isConnecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-30 bg-void-950 flex flex-col items-center justify-center p-4 text-center pointer-events-none overflow-hidden"
        >
          {/* Blurred poster background */}
          {poster && (
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url(https://media.themoviedb.org/t/p/w500${poster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(50px) saturate(2)',
                transform: 'scale(1.15)',
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/80 to-void-950/60" />

          <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-[280px] sm:max-w-sm">
            {/* Animated server ring */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <motion.div
                className="absolute w-24 h-24 rounded-full border border-brand-500/20"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Middle ring */}
              <motion.div
                className="absolute w-16 h-16 rounded-full border border-brand-500/40"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
              {/* Spinning arc */}
              <div
                className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-brand-500 animate-spin"
                style={{ animationDuration: '1.2s' }}
              />
              {/* Center dot */}
              <div className="absolute w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_12px_var(--brand-500)]" />
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-display font-black uppercase tracking-widest text-white">
                  Connecting to Server
                </h3>
                {/* Network speed badge */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  networkSpeed === 'fast'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : networkSpeed === 'slow'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {networkSpeed === 'fast' ? '⚡ Fast' : networkSpeed === 'slow' ? '🐢 Slow' : '📶 OK'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
                Establishing encrypted stream via{' '}
                <span className="text-brand-400 font-bold">{source.publicName}</span>
                <span className="animate-pulse">...</span>
              </p>
            </div>

            {/* Server status dots */}
            <div className="flex items-center gap-3">
              {['Auth', 'CDN', 'Stream'].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-brand-500"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                    style={{ boxShadow: '0 0 6px var(--brand-500)' }}
                  />
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">{label}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-[9px] font-mono text-zinc-600 mb-2 uppercase tracking-widest">
                <span>Loading stream</span>
                <span className="text-brand-500 font-bold">{Math.round(connectProgress)}%</span>
              </div>
              <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
                  style={{
                    width: `${connectProgress}%`,
                    boxShadow: '0 0 10px color-mix(in srgb, var(--brand-500) 60%, transparent)',
                    transition: 'width 0.15s ease-out',
                  }}
                />
              </div>
              <p className="text-[9px] text-zinc-700 mt-2 text-center">
                Content loading in background — will be ready instantly ✓
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
