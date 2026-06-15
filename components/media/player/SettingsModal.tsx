import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Server, Heart, Shield, ShieldOff, Play, Wifi, WifiOff } from 'lucide-react';
import { Source, TOP_8_IDS } from '@/lib/sources';

interface SettingsModalProps {
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  sources: Source[];
  currentSourceId: string;
  handleSwitchServer: (id: string) => void;
  favoriteServers: string[];
  toggleFavServer: (e: React.MouseEvent, id: string) => void;
  showAllServers: boolean;
  setShowAllServers: (show: boolean) => void;
  useSandbox: boolean;
  setUseSandbox: (use: boolean) => void;
  autoSandboxOnSwitch: boolean;
  setAutoSandboxOnSwitch: (use: boolean) => void;
  type: 'movie' | 'tv';
  autoPlayNext: boolean;
  setAutoPlayNext: (play: boolean) => void;
  dataSaver: boolean;
  updatePreferences: (prefs: { dataSaver: boolean }) => void;
  showToast: (msg: string) => void;
  id: string; // for caching
  storage: any; // injected dependency or import it inside
}

export function SettingsModal({
  showSettingsModal,
  setShowSettingsModal,
  sources,
  currentSourceId,
  handleSwitchServer,
  favoriteServers,
  toggleFavServer,
  showAllServers,
  setShowAllServers,
  useSandbox,
  setUseSandbox,
  autoSandboxOnSwitch,
  setAutoSandboxOnSwitch,
  type,
  autoPlayNext,
  setAutoPlayNext,
  dataSaver,
  updatePreferences,
  showToast,
  id,
  storage
}: SettingsModalProps) {
  if (!showSettingsModal) return null;

  const top7Sources = sources.filter(s => TOP_8_IDS.includes(s.id) && !favoriteServers.includes(s.id));
  const favoriteSources = sources.filter(s => favoriteServers.includes(s.id));
  const remainingSources = sources.filter(s => !TOP_8_IDS.includes(s.id) && !favoriteServers.includes(s.id));

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990] bg-black/80 backdrop-blur-md flex flex-col items-stretch justify-end md:items-center md:justify-center"
        onClick={() => setShowSettingsModal(false)}
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#1c1b19] border border-[oklch(1_0_0/0.08)] rounded-t-[16px] md:rounded-[16px] w-full max-w-[100vw] md:max-w-5xl max-h-[92dvh] md:h-auto flex flex-col shadow-2xl relative overflow-hidden mt-auto md:mb-auto md:mt-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-1 md:hidden shrink-0" />
          {/* Background glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Modal header */}
          <div className="px-4 py-3 md:px-5 md:py-4 border-b border-[oklch(1_0_0/0.08)] flex items-center justify-between bg-black/20 relative z-10 shrink-0">
            <h3 className="text-sm md:text-xl font-bold font-display tracking-wider text-white flex items-center gap-2.5 uppercase">
              <Settings size={16} className="text-brand-500 animate-spin md:w-[18px] md:h-[18px]" style={{ animationDuration: '6s' }} /> ZIVOX Control
            </h3>
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 w-9 h-9 flex items-center justify-center rounded-xl active:scale-95"
            >
              <X size={16} className="md:w-[18px] md:h-[18px]" />
            </button>
          </div>

          {/* Modal body */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Left: Server list */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-3 shrink-0 whitespace-nowrap">
                <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-zinc-400">Select Server</h4>
                <span className="text-[11px] md:text-xs bg-brand-500/10 border border-brand-500/20 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-brand-500 font-bold uppercase tracking-wider">{sources.length} Active</span>
              </div>
              <div data-lenis-prevent="true" className="flex flex-col gap-4 md:gap-5 overflow-y-auto flex-1 px-4 md:px-5 pb-4 md:pb-5">
                {(() => {
                  const renderServerCard = (s: typeof sources[0]) => {
                    const isActive = currentSourceId === s.id;
                    const isFav = favoriteServers.includes(s.id);
                    const displayName = s.publicName;
                    
                    // Build description
                    const descParts = [];
                    if (s.feature) descParts.push(s.feature);
                    if (s.noAds) descParts.push('No Ads');
                    if (s.hasPopups) descParts.push('Popups');
                    if (s.autoDisableSandbox) descParts.push('Ads possible');
                    const description = descParts.join(' · ') || 'Standard Server';

                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSwitchServer(s.id)}
                        className={`group flex flex-col justify-between w-full p-3 md:p-4 rounded-lg md:rounded-2xl transition-all duration-300 border border-[oklch(1_0_0/0.08)] text-left cursor-pointer active:scale-[0.98] relative overflow-hidden ${
                          isActive 
                            ? 'bg-brand-500/10 border-brand-500/50 text-white shadow-[0_0_20px_color-mix(in srgb, var(--brand-500) 10%, transparent)]' 
                            : 'bg-black/20 text-zinc-300 hover:bg-black/40 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-transparent animate-pulse pointer-events-none" />
                        )}
                        <div className="flex items-start justify-between w-full gap-2 z-10">
                          <div className="flex items-center gap-2">
                            <Server size={13} className={isActive ? 'text-brand-500' : 'text-zinc-500'} />
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div onClick={(e) => toggleFavServer(e, s.id)} className="hover:scale-110 active:scale-95 transition-transform">
                              <Heart size={13} className={isFav ? "fill-pink-500 text-pink-500" : "text-zinc-600 hover:text-pink-400"} />
                            </div>
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-premium-gradient shadow-[0_0_8px_var(--brand-500)]' : 'bg-zinc-700'}`} />
                          </div>
                        </div>
                        <div className="mt-2 md:mt-3 z-10 flex-1 flex flex-col">
                          <span className="text-sm md:text-sm font-bold leading-tight block mb-0.5 md:mb-1 font-display">{displayName}</span>
                          <span className="text-[12px] text-[#9ca3af] leading-snug truncate">{description}</span>
                        </div>
                      </button>
                    );
                  };

                  return (
                    <>
                      {favoriteSources.length > 0 && (
                        <div>
                          <h5 className="text-[11px] font-bold uppercase tracking-widest text-pink-500 mb-2 flex items-center gap-1.5"><Heart size={11} className="fill-pink-500" /> Favorites</h5>
                          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
                            {favoriteSources.map(s => renderServerCard(s))}
                          </div>
                        </div>
                      )}
                      <div>
                        <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" /> Recommended</h5>
                        <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
                          {top7Sources.map(s => renderServerCard(s))}
                        </div>
                      </div>
                      {remainingSources.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-px bg-zinc-800/80 flex-1" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowAllServers(!showAllServers); }} 
                              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-void-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5 active:scale-95"
                            >
                              {showAllServers ? 'Hide' : `More (${remainingSources.length})`}
                            </button>
                            <div className="h-px bg-zinc-800/80 flex-1" />
                          </div>
                          {showAllServers && (
                            <div className="flex flex-col gap-1">
                              {remainingSources.map((s) => {
                                const isActiveCompact = currentSourceId === s.id;
                                const isFavCompact = favoriteServers.includes(s.id);
                                return (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      handleSwitchServer(s.id);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 border text-left cursor-pointer active:scale-[0.99] ${
                                      isActiveCompact
                                        ? 'bg-brand-500/15 border-brand-500/40 text-white'
                                        : 'bg-void-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActiveCompact ? 'bg-premium-gradient' : 'bg-zinc-700'}`} />
                                      <span className="text-xs font-semibold">{s.publicName}</span>
                                      {s.noAds && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">No ads</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div onClick={(e) => toggleFavServer(e, s.id)} className="hover:scale-110 active:scale-95 transition-transform p-0.5">
                                        <Heart size={11} className={isFavCompact ? "fill-pink-500 text-pink-500" : "text-zinc-600 hover:text-pink-400"} />
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Right: Security controls */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-2 overflow-y-auto px-4 md:px-5 pb-4 md:pb-5 border-t lg:border-t-0 lg:border-l border-[oklch(1_0_0/0.08)] pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Security</h4>
              
              {/* Sandbox Shield */}
              <div className="bg-black/20 border border-[oklch(1_0_0/0.08)] rounded-lg px-4 min-h-[56px] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => {
                  const n = !useSandbox;
                  setUseSandbox(n);
                  localStorage.setItem('sandbox_pref_' + currentSourceId, JSON.stringify(n));
                  showToast(`Sandbox ${n ? 'ON' : 'OFF'}`);
              }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`shrink-0 ${useSandbox ? 'text-[#22c55e]' : 'text-zinc-500'}`}>
                    {useSandbox ? <Shield size={18} /> : <ShieldOff size={18} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-white leading-tight">Sandbox Shield</span>
                    <span className="text-[11px] text-[#9ca3af] truncate">Blocks popups & trackers</span>
                  </div>
                </div>
                <button className={`shrink-0 relative w-10 h-5 rounded-full transition-all duration-300 ${useSandbox ? 'bg-[#22c55e]' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${useSandbox ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Auto-Shield */}
              <div className="bg-black/20 border border-[oklch(1_0_0/0.08)] rounded-lg px-4 min-h-[56px] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => {
                  const n = !autoSandboxOnSwitch;
                  setAutoSandboxOnSwitch(n);
                  localStorage.setItem('auto_sandbox_on_switch', JSON.stringify(n));
              }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`shrink-0 ${autoSandboxOnSwitch ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    <Shield size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-white leading-tight">Auto-Shield</span>
                    <span className="text-[11px] text-[#9ca3af] truncate">Re-enables on switch</span>
                  </div>
                </div>
                <button className={`shrink-0 relative w-10 h-5 rounded-full transition-all duration-300 ${autoSandboxOnSwitch ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${autoSandboxOnSwitch ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Auto-Play Next */}
              {type === 'tv' && (
                <div className="bg-black/20 border border-[oklch(1_0_0/0.08)] rounded-lg px-4 min-h-[56px] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => {
                    const n = !autoPlayNext; setAutoPlayNext(n); storage.set({ settings: { ...storage.get().settings, autoPlayNext: n } });
                }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`shrink-0 ${autoPlayNext ? 'text-brand-500' : 'text-zinc-500'}`}>
                      <Play size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-white leading-tight">Auto-Play Next</span>
                      <span className="text-[11px] text-[#9ca3af] truncate">Plays next episode</span>
                    </div>
                  </div>
                  <button className={`shrink-0 relative w-10 h-5 rounded-full transition-all duration-300 ${autoPlayNext ? 'bg-premium-gradient' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${autoPlayNext ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              )}

              {/* Data Saver */}
              <div className="bg-black/20 border border-[oklch(1_0_0/0.08)] rounded-lg px-4 min-h-[56px] flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform" onClick={() => {
                  updatePreferences({ dataSaver: !dataSaver });
                  showToast(`Data Saver ${!dataSaver ? 'ON — Trailers disabled' : 'OFF'}`);
              }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`shrink-0 ${dataSaver ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    {dataSaver ? <WifiOff size={18} /> : <Wifi size={18} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-white leading-tight">Data Saver</span>
                    <span className="text-[11px] text-[#9ca3af] truncate">Disables auto-playing trailers</span>
                  </div>
                </div>
                <button className={`shrink-0 relative w-10 h-5 rounded-full transition-all duration-300 ${dataSaver ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${dataSaver ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
