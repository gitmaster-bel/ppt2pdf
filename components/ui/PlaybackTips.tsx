import { Maximize, Zap, ShieldCheck, HelpCircle } from 'lucide-react';

export function PlaybackTips() {
  return (
    <div className="w-full bg-void-950/80 border border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-sm mt-4">
      <h3 className="text-white font-display font-bold text-base md:text-lg flex items-center gap-2 mb-4">
        <span className="text-brand-500">💡</span> Pro Tips for Smooth Streaming
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Tip 1 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <Maximize size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Lagging or buffering?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hit <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded mx-0.5">F</strong> for Fullscreen. Browsers dedicate more resources to fullscreen videos, unlocking buttery smooth 60fps playback.
            </p>
          </div>
        </div>

        {/* Tip 2 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <Zap size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Choose the right server</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Look for the badges: ⚡ means <strong className="text-zinc-200">Fast</strong> (Server 3), 🟢 means <strong className="text-zinc-200">No Ads</strong>, and 🌐 means <strong className="text-zinc-200">Multi-lingual</strong> dubs/subs.
            </p>
          </div>
        </div>

        {/* Tip 3 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <HelpCircle size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Casting to TV?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use <strong className="text-white">Safari</strong> on Apple devices to cast to Apple TV. For Chromecast, use <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong> on PC/Android.
            </p>
          </div>
        </div>

        {/* Tip 4 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <ShieldCheck size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Ad-blockers recommended</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Since we aggregate external sources, using a reliable ad-blocker like uBlock Origin ensures a completely seamless, premium experience.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
