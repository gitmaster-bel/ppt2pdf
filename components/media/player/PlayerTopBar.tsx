import { Share2, Shield, ShieldOff, Heart, Maximize, Server } from 'lucide-react';
import { Source } from '@/lib/sources';

interface PlayerTopBarProps {
  isFullscreen: boolean;
  setShowSettingsModal: (show: boolean) => void;
  source: Source;
  setShowShareModal: (show: boolean) => void;
  useSandbox: boolean;
  setUseSandbox: (use: boolean) => void;
  currentSourceId: string;
  showToast: (msg: string) => void;
  isFav: boolean;
  toggleFavorite: () => void;
  toggleFullscreen: () => void;
}

export function PlayerTopBar({
  isFullscreen,
  setShowSettingsModal,
  source,
  setShowShareModal,
  useSandbox,
  setUseSandbox,
  currentSourceId,
  showToast,
  isFav,
  toggleFavorite,
  toggleFullscreen
}: PlayerTopBarProps) {
  return (
    <div className="relative flex items-center justify-between gap-2 px-2.5 py-2 bg-void-950 border-b border-zinc-800/60 shrink-0 w-full">
      {/* Desktop Fullscreen Hint */}
      <div className="hidden md:flex absolute -top-6 right-2 text-zinc-500 font-medium tracking-wide text-[10px] pointer-events-none">
        Press <span className="text-zinc-300 font-bold mx-1">F</span> to fullscreen and <span className="text-zinc-300 font-bold mx-1">ESC/F</span> to exit
      </div>
      
      {/* Left: Servers & Settings button + current server info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-1.5 bg-void-900 hover:bg-void-800 border border-zinc-800 text-white px-2.5 py-1.5 rounded-lg transition-all active:scale-95 font-bold text-xs shadow-md shrink-0 whitespace-nowrap"
        >
          <Server size={12} className="text-brand-500 shrink-0" />
          <span className="hidden xs:hidden sm:inline">Servers &amp; Settings</span>
          <span className="inline sm:hidden">Servers</span>
        </button>
        {/* Current server name + no-ads badge — hidden on very small screens */}
        <div className="hidden md:flex items-center gap-2 min-w-0">
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-xs font-semibold text-zinc-300 truncate">{source.publicName}</span>
          {source.noAds && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">✓ No Ads</span>}
        </div>
      </div>

      {/* Right: icon controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Share */}
        <button
          onClick={() => setShowShareModal(true)}
          title="Share"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500/50 bg-premium-gradient-dark hover:bg-premium-gradient text-white transition-all active:scale-95 font-bold text-xs shadow-lg shadow-brand-900/20"
        >
          <span className="hidden sm:inline">Share</span>
          <Share2 size={14} />
        </button>

        {/* Sandbox toggle — icon only */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const n = !useSandbox;
            setUseSandbox(n);
            localStorage.setItem('sandbox_pref_' + currentSourceId, JSON.stringify(n));
            showToast(`Sandbox ${n ? 'ON' : 'OFF'}`);
          }}
          title={useSandbox ? 'Sandbox ON — Protected' : 'Sandbox OFF — Risky'}
          className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95 ${
            useSandbox ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
          }`}
        >
          {useSandbox ? <Shield size={14} /> : <ShieldOff size={14} />}
        </button>

        {/* Favorite — icon only */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
          className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all active:scale-95 ${
            isFav ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-void-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-void-800'
          }`}
          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart size={14} className={isFav ? 'fill-pink-500' : ''} />
        </button>

        <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-800 bg-void-900 hover:bg-void-800 text-zinc-400 hover:text-white transition-all active:scale-95"
        >
          <Maximize size={14} />
        </button>
      </div>
    </div>
  );
}
