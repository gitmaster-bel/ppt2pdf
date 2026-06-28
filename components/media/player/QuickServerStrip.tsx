import { Source, TOP_8_IDS } from '@/lib/sources';

interface QuickServerStripProps {
  isFullscreen: boolean;
  currentSourceId: string;
  sources: Source[];
  handleSwitchServer: (id: string) => void;
  setShowSettingsModal: (show: boolean) => void;
  activeTabRef: React.RefObject<HTMLButtonElement | null>;
}

export function QuickServerStrip({
  isFullscreen,
  currentSourceId,
  sources,
  handleSwitchServer,
  setShowSettingsModal,
  activeTabRef
}: QuickServerStripProps) {
  const top7 = sources.filter(s => TOP_8_IDS.includes(s.id));
  // Multilingual servers — always surface these for dubbed/subbed content
  const multilingualIds = new Set(['peachify', 'vidsrcwtf2']);

  // Responsive visibility:
  // - Mobile (<768px): show 4 servers (current first, then 3 others)
  // - Tablet (768-1023px): show 5 servers
  // - Desktop (≥1024px): show all 7 always

  // Build ordered list: current server first, then rest in TOP_8_IDS order
  const currentInTop7 = TOP_8_IDS.includes(currentSourceId);
  const orderedStrip = currentInTop7
    ? [
        top7.find(s => s.id === currentSourceId)!,
        ...top7.filter(s => s.id !== currentSourceId),
      ]
    : [...top7];

  return (
    <div className="px-3 pt-2.5 pb-1.5 bg-void-950 border-b border-zinc-800/40 shrink-0">
      {/* Desktop: all 7 always visible */}
      <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
        {top7.map((s) => {
              const isActive = s.id === currentSourceId;
              const isMultilingual = s.hasLanguageOptions || multilingualIds.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => !isActive && handleSwitchServer(s.id)}
              title={isActive ? `Currently on ${s.publicName}` : `Switch to ${s.publicName}${isMultilingual ? ' — Multi-language' : ''}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 border shrink-0 ${
                isActive
                  ? 'bg-brand-500/20 border-brand-500/60 text-brand-400 shadow-[0_0_10px_color-mix(in srgb, var(--brand-500) 20%, transparent)] cursor-default'
                  : 'bg-void-900 border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-zinc-800/60 active:scale-95 cursor-pointer'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-premium-gradient shadow-[0_0_6px_var(--brand-500)]' : 'bg-zinc-600'}`} />
              {s.publicName}
              {isActive && <span className="text-[9px] font-bold uppercase tracking-widest text-brand-500/80 ml-0.5">LIVE</span>}
              {!isActive && s.noAds && <span className="text-[9px] text-emerald-500">●</span>}
              {isMultilingual && <span title="Multi-language subtitles & dubs available">🌐</span>}
            </button>
          );
        })}
      </div>

      {/* Tablet: first 5 */}
      <div className="hidden md:flex lg:hidden items-center gap-1.5 flex-wrap">
        {orderedStrip.slice(0, 5).map((s) => {
              const isActive = s.id === currentSourceId;
              const isMultilingual = s.hasLanguageOptions || multilingualIds.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => !isActive && handleSwitchServer(s.id)}
              title={isActive ? `Currently on ${s.publicName}` : `Switch to ${s.publicName}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 border shrink-0 ${
                isActive
                  ? 'bg-brand-500/20 border-brand-500/60 text-brand-400 shadow-[0_0_10px_color-mix(in srgb, var(--brand-500) 20%, transparent)] cursor-default'
                  : 'bg-void-900 border-zinc-700/60 text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-zinc-800/60 active:scale-95 cursor-pointer'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-premium-gradient shadow-[0_0_6px_var(--brand-500)]' : 'bg-zinc-600'}`} />
              {s.publicName}
              {isActive && <span className="text-[9px] font-bold uppercase tracking-widest text-brand-500/80 ml-0.5">LIVE</span>}
              {!isActive && s.noAds && <span className="text-[9px] text-emerald-500">●</span>}
              {isMultilingual && <span title="Multi-language">🌐</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="text-[10px] text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-full border border-zinc-800 hover:border-zinc-600"
        >
          +{top7.length - 5} more
        </button>
      </div>

      {/* Mobile Tab Bar (<768px) */}
      <div className="md:hidden flex flex-col w-full">
        <div className="relative w-full">
          <div 
            className="flex items-center overflow-x-auto snap-x snap-mandatory w-full relative z-0 pb-1 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {orderedStrip.map((s) => {
              const isActive = s.id === currentSourceId;
              const isMultilingual = s.hasLanguageOptions || multilingualIds.has(s.id);
              return (
                <button
                  key={s.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => !isActive && handleSwitchServer(s.id)}
                  className={`shrink-0 flex items-center justify-center gap-1.5 h-[32px] px-3 text-[12px] whitespace-nowrap snap-start border-b-2 transition-all duration-200 bg-transparent ${
                    isActive
                      ? 'border-brand-500 text-white font-bold cursor-default'
                      : 'border-transparent text-zinc-400 hover:text-white active:bg-white/5 cursor-pointer'
                  }`}
                >
                  {s.publicName}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-premium-gradient shadow-[0_0_6px_var(--brand-500)] shrink-0" />}
                  {!isActive && s.noAds && <span className="text-[10px] text-emerald-500 shrink-0">●</span>}
                  {isMultilingual && <span className="text-[14px] shrink-0 leading-none">🌐</span>}
                </button>
              );
            })}
            {/* Extra padding so the last item can scroll past the fade */}
            <div className="shrink-0 w-8" />
          </div>
          {/* Right Edge Fade Mask */}
          <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-void-950 to-transparent pointer-events-none z-10" />
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-full text-center text-[12px] text-brand-500 font-bold py-[6px] mt-1"
        >
          All {sources.length} servers ↑
        </button>
      </div>

      <p className="hidden md:block text-[10px] text-zinc-600 mt-1.5 leading-snug">
        🌐 = Multi-language subtitles &amp; dubs &nbsp;·&nbsp; ● = No ads &nbsp;·&nbsp;{' '}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
        >
          All {sources.length} servers ↑
        </button>
      </p>
    </div>
  );
}
