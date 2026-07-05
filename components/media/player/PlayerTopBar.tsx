import { Share2, Shield, ShieldOff, Heart, Maximize, Server, Globe } from 'lucide-react';
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
  serverLanguage: string;
  updatePreferences: (prefs: any) => void;
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
  toggleFullscreen,
  serverLanguage,
  updatePreferences
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
        {/* Current server info & language options */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-xs font-semibold text-zinc-300 truncate">{source.publicName}</span>
            {source.noAds && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">✓ No Ads</span>}
          </div>
          
          {source.hasLanguageOptions && (
            <div className="hidden md:flex items-center gap-2">
              <div className="h-4 w-px bg-zinc-800 ml-1" />
              <div className="relative flex items-center group">
                <Globe size={12} className="text-brand-500 absolute left-2 pointer-events-none" />
                <select
                  value={serverLanguage}
                  onChange={(e) => updatePreferences({ serverLanguage: e.target.value })}
                  className="appearance-none bg-void-900 border border-zinc-800 hover:border-brand-500/50 text-white text-[10px] font-bold uppercase tracking-wider pl-6 pr-6 py-1 rounded-md focus:outline-none focus:border-brand-500 cursor-pointer transition-colors shadow-sm"
                  title="Select Dub/Sub Language"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                  <option value="ta">Tamil</option>
                  <option value="ml">Malayalam</option>
                  <option value="kn">Kannada</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Mandarin</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ru">Russian</option>
                  <option value="ar">Arabic</option>
                </select>
                <div className="absolute right-2 pointer-events-none text-zinc-500 group-hover:text-white transition-colors">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
          )}
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
