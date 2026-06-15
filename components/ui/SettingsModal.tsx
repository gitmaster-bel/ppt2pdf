'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Download, Upload, MonitorPlay, Shield, Database, ChevronRight, Palette, WifiOff, Wifi } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useEffect, useRef, useState } from 'react';

const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 878, name: "Sci-Fi" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animation" },
  { id: 14, name: "Fantasy" },
  { id: 53, name: "Thriller" },
];

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'ta', name: 'Tamil' },
  { id: 'te', name: 'Telugu' },
  { id: 'ml', name: 'Malayalam' },
  { id: 'kn', name: 'Kannada' },
  { id: 'bn', name: 'Bengali' },
  { id: 'mr', name: 'Marathi' },
  { id: 'gu', name: 'Gujarati' },
  { id: 'pa', name: 'Punjabi' },
  { id: 'ko', name: 'Korean' },
  { id: 'ja', name: 'Japanese' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'zh', name: 'Chinese' },
  { id: 'ru', name: 'Russian' },
  { id: 'ar', name: 'Arabic' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'it', name: 'Italian' },
  { id: 'id', name: 'Indonesian' },
  { id: 'th', name: 'Thai' },
  { id: 'vi', name: 'Vietnamese' },
  { id: 'tr', name: 'Turkish' },
  { id: 'nl', name: 'Dutch' },
  { id: 'pl', name: 'Polish' }
];

const REGIONS = [
  { id: 'IN', name: 'India' },
  { id: 'US', name: 'United States' },
  { id: 'GB', name: 'United Kingdom' },
  { id: 'CA', name: 'Canada' },
  { id: 'AU', name: 'Australia' },
  { id: 'JP', name: 'Japan' },
  { id: 'KR', name: 'South Korea' },
  { id: 'FR', name: 'France' },
  { id: 'DE', name: 'Germany' },
  { id: 'ES', name: 'Spain' },
  { id: 'IT', name: 'Italy' },
  { id: 'BR', name: 'Brazil' },
  { id: 'MX', name: 'Mexico' },
  { id: 'AE', name: 'United Arab Emirates' },
  { id: 'SA', name: 'Saudi Arabia' },
  { id: 'RU', name: 'Russia' },
  { id: 'ZA', name: 'South Africa' },
  { id: 'SG', name: 'Singapore' },
  { id: 'NL', name: 'Netherlands' }
];

type TabId = 'content' | 'playback' | 'data' | 'appearance';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { preferences, updatePreferences } = usePreferences();
  const [activeTab, setActiveTab] = useState<TabId>('appearance');

  const applyTheme = (theme: string) => {
    if (theme === 'violet') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    updatePreferences({ theme: theme as any });
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleToggleGenre = (id: number) => {
    let current = [...preferences.preferredGenres];
    if (current.includes(id)) current = current.filter(g => g !== id);
    else current.push(id);
    updatePreferences({ preferredGenres: current });
  };

  const handleToggleLang = (id: string) => {
    let current = [...preferences.originalLanguage];
    if (current.includes(id)) current = current.filter(l => l !== id);
    else current.push(id);
    updatePreferences({ originalLanguage: current });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = localStorage.getItem('voidstream_app_state_v2');
    if (!data) return alert("No data found to export.");
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zivox_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object') {
           localStorage.setItem('voidstream_app_state_v2', JSON.stringify(json));
           alert("Data imported successfully! Reloading...");
           window.location.reload();
        }
      } catch(err) {
        alert("Invalid backup file. Please upload a valid Zivox backup JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Content for each tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        return (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            <section>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-premium-gradient rounded-full"></span>
                Primary Region
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Set your default region to see accurate streaming platform availability.</p>
              <select
                value={preferences.country || 'US'}
                onChange={(e) => updatePreferences({ country: e.target.value })}
                className="bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjMgNiA2IDkgOSA2Ii8+PC9zdmc+')] bg-no-repeat bg-[position:calc(100%-15px)_center] w-full md:w-64"
              >
                {REGIONS.map(r => <option key={r.id} value={r.id} className="bg-zinc-900">{r.name}</option>)}
              </select>
            </section>

            <section>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-premium-gradient rounded-full"></span>
                Favorite Genres
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Select genres to personalize your Discover feed.</p>
              <div className="flex flex-wrap gap-2.5">
                {GENRES.map(genre => {
                  const isSelected = preferences.preferredGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      onClick={() => handleToggleGenre(genre.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isSelected 
                          ? 'bg-premium-gradient text-white shadow-lg shadow-brand-500/20' 
                          : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-premium-gradient rounded-full"></span>
                Preferred Languages
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Prioritize content originally produced in these languages.</p>
              <div className="flex flex-wrap gap-2.5">
                {LANGUAGES.map(lang => {
                  const isSelected = preferences.originalLanguage.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleToggleLang(lang.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isSelected 
                          ? 'bg-premium-gradient text-white shadow-lg shadow-brand-500/20' 
                          : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>
              {preferences.originalLanguage.length === 0 && (
                <p className="text-xs text-zinc-500 mt-3 italic">Showing all global content by default.</p>
              )}
            </section>
          </motion.div>
        );

      case 'playback':
        return (
          <motion.div
            key="playback"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-premium-gradient rounded-full"></span>
                Display & Playback
              </h3>
              
              <button 
                onClick={() => updatePreferences({ adultContent: !preferences.adultContent })}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div>
                  <h4 className="font-semibold text-white">Include Mature Content</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">Show 18+ and restricted content in recommendations</p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${preferences.adultContent ? 'bg-premium-gradient' : 'bg-black/50 border border-white/20'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.adultContent ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </button>

              <button 
                onClick={() => updatePreferences({ showRatings: !preferences.showRatings })}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div>
                  <h4 className="font-semibold text-white">Show Content Ratings</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">Display IMDb/TMDB star ratings on movie cards</p>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${preferences.showRatings ? 'bg-premium-gradient' : 'bg-black/50 border border-white/20'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.showRatings ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </button>

              <button
                onClick={() => updatePreferences({ dataSaver: !preferences.dataSaver })}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${preferences.dataSaver ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                    {preferences.dataSaver ? <WifiOff size={16} className="text-cyan-400" /> : <Wifi size={16} className="text-zinc-500" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Data Saver Mode</h4>
                    <p className="text-zinc-400 text-xs mt-0.5">Disables auto-playing trailers on movie/show pages — saves bandwidth on mobile</p>
                  </div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${preferences.dataSaver ? 'bg-cyan-500' : 'bg-black/50 border border-white/20'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.dataSaver ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </button>
            </section>
          </motion.div>
        );

      case 'data':
        return (
          <motion.div
            key="data"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-premium-gradient rounded-full"></span>
                  Data Management
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                  Zivox stores all your Watch History, Favorites, and Preferences locally on your device. Export your data to back it up or transfer it to another browser.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Download size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-400">Export Backup</h4>
                      <p className="text-emerald-400/60 text-xs mt-0.5">Download your profile as a JSON file</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-emerald-400/50" />
                </button>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Upload size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-400">Import Backup</h4>
                      <p className="text-purple-400/60 text-xs mt-0.5">Restore your profile from a JSON file</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-purple-400/50" />
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  className="hidden" 
                />
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mt-6">
                <h4 className="text-red-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <Shield size={16} /> Danger Zone
                </h4>
                <p className="text-red-400/70 text-xs mb-3">Clearing your browser cache will permanently delete your Watch History if you haven't exported a backup.</p>
              </div>
            </section>
          </motion.div>
        );
      case 'appearance': {
        const THEMES = [
          { id: 'violet', label: 'Amethyst', color: '#7c3aed', colorLight: '#a78bfa', desc: 'Cyberpunk & futuristic' },
          { id: 'blue', label: 'Sapphire', color: '#2563eb', colorLight: '#60a5fa', desc: 'Cool, calm & premium' },
          { id: 'red', label: 'Cinematic', color: '#e50914', colorLight: '#ef4444', desc: 'Classic bold energy' },
          { id: 'emerald', label: 'Matrix', color: '#059669', colorLight: '#34d399', desc: 'Fresh, alive & vibrant' },
          { id: 'rose', label: 'Cyber Rose', color: '#e11d48', colorLight: '#fb7185', desc: 'Vibrant & passionate' },
          { id: 'amber', label: 'Golden Hour', color: '#f59e0b', colorLight: '#fbbf24', desc: 'Warm cinematic glow' },
          { id: 'cyan', label: 'Neon Cyan', color: '#0ea5e9', colorLight: '#38bdf8', desc: 'High-tech & sleek' },
          { id: 'silicon', label: 'Silicon White', color: '#f8fafc', colorLight: '#ffffff', desc: 'Pure ultra-modern contrast' },
        ];
        return (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            <section>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="w-1 h-4 bg-premium-gradient rounded-full" />
                Accent Color
              </h3>
              <p className="text-xs text-zinc-500 mb-6">Changes buttons, highlights and ambient glow across the entire platform. Takes effect instantly.</p>
              <div className="grid grid-cols-1 gap-3">
                {THEMES.map(theme => {
                  const active = (preferences.theme || 'red') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left ${
                        active
                          ? 'bg-white/8 border-white/20 shadow-lg'
                          : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15'
                      }`}
                      style={active ? { borderColor: theme.color + '50', boxShadow: `0 0 20px ${theme.color}15` } : {}}
                    >
                      {/* Color swatch */}
                      <div
                        className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ 
                          background: `linear-gradient(to top right, ${theme.color} 0%, ${theme.color} 70%, ${theme.colorLight} 100%)`, 
                          boxShadow: active ? `0 0 16px ${theme.color}60` : 'none',
                          color: theme.color 
                        }}
                      >
                        {active && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{theme.label}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{theme.desc}</div>
                      </div>
                      {active && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: theme.color + '20', color: theme.color }}>Active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {isOpen && (
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[95%] max-w-4xl h-[80vh] max-h-[800px] bg-void-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
            {/* Left Sidebar Navigation */}
            <div className="w-full md:w-[280px] shrink-0 bg-black/40 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col relative z-10">
              <div className="p-6 pb-4 flex items-center justify-between md:block">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <Settings size={16} className="text-brand-500" />
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">Settings</h2>
                </div>
                <button
                  onClick={onClose}
                  className="md:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/70"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex overflow-x-auto md:flex-col gap-2 p-3 md:p-4 no-scrollbar shadow-[inset_-20px_0_20px_-20px_rgba(0,0,0,0.8)] md:shadow-none">
                <button 
                  onClick={() => setActiveTab('appearance')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 text-[13px] md:px-4 md:py-3 md:text-base rounded-xl transition-all font-semibold whitespace-nowrap shrink-0 ${
                    activeTab === 'appearance' 
                      ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Palette size={18} className={activeTab === 'appearance' ? 'text-brand-400' : 'text-zinc-500'} />
                  Appearance
                </button>
                <button 
                  onClick={() => setActiveTab('content')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 text-[13px] md:px-4 md:py-3 md:text-base rounded-xl transition-all font-semibold whitespace-nowrap shrink-0 ${
                    activeTab === 'content' 
                      ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Settings size={18} className={activeTab === 'content' ? 'text-white' : 'text-zinc-500'} />
                  Content Preferences
                </button>
                <button 
                  onClick={() => setActiveTab('playback')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 text-[13px] md:px-4 md:py-3 md:text-base rounded-xl transition-all font-semibold whitespace-nowrap shrink-0 ${
                    activeTab === 'playback' 
                      ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <MonitorPlay size={18} className={activeTab === 'playback' ? 'text-white' : 'text-zinc-500'} />
                  Playback & UI
                </button>
                <button 
                  onClick={() => setActiveTab('data')}
                  className={`flex items-center gap-2 md:gap-3 px-3 py-2 text-[13px] md:px-4 md:py-3 md:text-base rounded-xl transition-all font-semibold whitespace-nowrap shrink-0 ${
                    activeTab === 'data' 
                      ? 'bg-white/10 text-white shadow-lg border border-white/5' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Database size={18} className={activeTab === 'data' ? 'text-white' : 'text-zinc-500'} />
                  Data & Privacy
                </button>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-void-950 relative md:h-full overflow-hidden">
              {/* Close button for desktop */}
              <button
                onClick={onClose}
                className="hidden md:flex absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                <AnimatePresence mode="wait">
                  {renderTabContent()}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
