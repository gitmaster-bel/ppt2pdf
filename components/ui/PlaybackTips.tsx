import { Maximize, Zap, ShieldCheck, HelpCircle, VolumeX, Server } from 'lucide-react';

export function PlaybackTips() {
  return (
    <div className="w-full bg-void-950/80 border border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-sm mt-4">
      <h3 className="text-white font-display font-bold text-base md:text-lg flex items-center gap-2 mb-4">
        <span className="text-brand-500">💡</span> Pro Tips for Smooth Streaming
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Tip 1 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <Maximize size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Lagging or buffering?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hit <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded mx-0.5">F</strong> for Fullscreen. Browsers dedicate more resources to fullscreen videos, unlocking buttery smooth 60fps playback. Press <strong className="text-white bg-white/10 px-1.5 py-0.5 rounded mx-0.5">ESC</strong> to exit.
            </p>
          </div>
        </div>

        {/* Tip 2 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <Server size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Dev&apos;s Favorite Servers</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Servers <strong className="text-zinc-200">2 & 8</strong> are highly reliable. Look for symbols on the servers: ⚡ = Fastest speed, <span className="text-emerald-500">●</span> = No Ads, and 🌐 = Multi-lingual dubs/subs.
            </p>
          </div>
        </div>

        {/* Tip 3 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <VolumeX size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">No sound?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Some external servers are muted by default. Be sure to check the volume icon <strong className="text-zinc-200">inside the video player</strong> to unmute and turn it up.
            </p>
          </div>
        </div>

        {/* Tip 4 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50">
          <ShieldCheck size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Ad Protection Sandbox</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We securely isolate servers in a <strong className="text-zinc-200">sandbox</strong> to protect you from malicious pop-ups. For ultimate peace of mind, an ad-blocker like uBlock Origin is also recommended.
            </p>
          </div>
        </div>

        {/* Tip 5 */}
        <div className="flex gap-3 items-start bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors p-4 rounded-xl border border-zinc-800/50 md:col-span-2 lg:col-span-1">
          <HelpCircle size={18} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Casting to TV?</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use <strong className="text-white">Safari</strong> on Apple devices to cast to Apple TV. For Chromecast, use <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong> on PC/Android.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
