import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';

interface UpNextOverlayProps {
  showNextOverlay: boolean;
  hasNextEpisode: boolean;
  countdown: number;
  setShowNextOverlay: (show: boolean) => void;
  onPlayNext?: () => void;
}

export function UpNextOverlay({ showNextOverlay, hasNextEpisode, countdown, setShowNextOverlay, onPlayNext }: UpNextOverlayProps) {
  return (
    <AnimatePresence>
      {showNextOverlay && hasNextEpisode && (
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute right-4 bottom-20 md:right-8 md:bottom-24 z-50 bg-black/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl pointer-events-auto text-white max-w-sm w-[calc(100%-2rem)]"
        >
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-500 mb-2">Up Next</h4>
          <p className="text-lg md:text-xl font-bold mb-4 font-display leading-tight">Playing in {countdown}s...</p>
          <div className="flex gap-3 items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowNextOverlay(false); }}
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); if (onPlayNext) onPlayNext(); }}
              className="flex-1 px-4 py-2.5 bg-premium-gradient hover:bg-premium-gradient-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Play size={14} fill="currentColor" /> Play Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
