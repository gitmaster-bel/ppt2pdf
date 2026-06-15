import { motion, AnimatePresence } from 'motion/react';
import { Settings, Server, ArrowUp, Globe } from 'lucide-react';

interface TutorialSpotlightProps {
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  tutorialCountdown: number;
}

export function TutorialSpotlight({ showTutorial, setShowTutorial, tutorialCountdown }: TutorialSpotlightProps) {
  return (
    <AnimatePresence>
      {showTutorial && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/50 pointer-events-auto"
            onClick={() => setShowTutorial(false)}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-[48px] left-0 right-0 bottom-0 z-[70] pointer-events-none"
          >
            <div className="w-full h-full relative">
               {/* LEFT: Servers Pointer */}
               <div className="absolute left-2 top-2 flex flex-col items-start w-[45%] md:max-w-[220px]">
                 <div className="ml-4 md:ml-8 mb-1 text-brand-400 animate-bounce">
                   <ArrowUp size={20} className="drop-shadow-[0_0_8px_color-mix(in srgb, var(--brand-500) 80%, transparent)] md:w-6 md:h-6" />
                 </div>
                 <div className="bg-void-900/95 border border-brand-500/60 p-2 md:p-3 rounded-xl shadow-[0_0_20px_color-mix(in srgb, var(--brand-500) 30%, transparent)] pointer-events-auto">
                   <h4 className="text-brand-400 font-bold text-[9px] md:text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5"><Server size={10} className="md:w-3 md:h-3" /> Servers & Audio</h4>
                   <p className="text-zinc-300 text-[8px] md:text-[10px] leading-relaxed">Switch servers to find <strong className="text-white">Multilingual/Hindi</strong> dubs. <span className="text-emerald-400 font-semibold block mt-0.5 flex items-center gap-1"><Globe size={8} className="md:w-3 md:h-3" /> Look for the Globe icon!</span></p>
                 </div>
               </div>

               {/* RIGHT: Fullscreen & Controls Pointer */}
               <div className="absolute right-2 top-2 flex flex-col items-end w-[50%] md:max-w-[260px] text-right">
                 <div className="mr-4 md:mr-8 mb-1 text-brand-400 animate-bounce">
                   <ArrowUp size={20} className="drop-shadow-[0_0_8px_color-mix(in srgb, var(--brand-500) 80%, transparent)] md:w-6 md:h-6" />
                 </div>
                 <div className="bg-void-900/95 border border-brand-500/60 p-2 md:p-3 rounded-xl shadow-[0_0_20px_color-mix(in srgb, var(--brand-500) 30%, transparent)] pointer-events-auto">
                   <h4 className="text-brand-400 font-bold text-[9px] md:text-[11px] uppercase tracking-wider mb-1 flex items-center justify-end gap-1.5">Controls & Fullscreen <Settings size={10} className="md:w-3 md:h-3" /></h4>
                   <p className="text-zinc-300 text-[8px] md:text-[10px] leading-relaxed">
                     Share, Sandbox (Ad-block), or Favorite.<br/>
                     <span className="hidden md:block text-emerald-400 font-bold mt-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">Press F to Fullscreen, Esc/F to exit</span>
                   </p>
                 </div>
               </div>
               
               {/* Center/Bottom Content: Heading + Got It Button */}
               <div className="absolute inset-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 pointer-events-auto flex flex-col items-center justify-center pt-20 md:pt-0 w-full pb-8 md:pb-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent md:hidden pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col items-center w-full px-4 mt-8 md:mt-0">
                    <div className="text-center mb-6">
                      <h2 className="text-[clamp(20px,5vw,28px)] font-bold text-white leading-none drop-shadow-lg">Quick Instructions</h2>
                      <p className="text-brand-500 font-bold mt-2 text-[11px] tracking-[0.1em] uppercase">Read this carefully</p>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowTutorial(false); }}
                      className="bg-premium-gradient text-white font-bold h-[52px] w-full max-w-[340px] rounded-[10px] text-[16px] transition-all shadow-[0_0_20px_color-mix(in srgb, var(--brand-500) 30%, transparent)] active:scale-95 flex items-center justify-center mb-4 md:mb-0"
                    >
                      Got it! ({tutorialCountdown}s)
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
