'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

const THEMES = [
  { id: 'violet', name: 'Amethyst', color: '#7c3aed', colorLight: '#a78bfa' },
  { id: 'blue', name: 'Sapphire', color: '#2563eb', colorLight: '#60a5fa' },
  { id: 'red', name: 'Cinematic', color: '#e50914', colorLight: '#ef4444' },
  { id: 'emerald', name: 'Matrix', color: '#059669', colorLight: '#34d399' },
  { id: 'rose', name: 'Cyber Rose', color: '#e11d48', colorLight: '#fb7185' },
  { id: 'amber', name: 'Golden Hour', color: '#f59e0b', colorLight: '#fbbf24' },
  { id: 'cyan', name: 'Neon Cyan', color: '#0ea5e9', colorLight: '#38bdf8' },
  { id: 'silicon', name: 'Silicon White', color: '#f8fafc', colorLight: '#ffffff' }
];

export function ThemePromptModal() {
  const { preferences, updatePreferences } = usePreferences();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after 10 seconds of usage on their first visit, stay on screen until interacted with
    const showTimer = setTimeout(() => {
      try {
        const hasDismissed = localStorage.getItem('zivox_theme_prompt_dismissed');
        const visits = parseInt(localStorage.getItem('player_visits') || '0', 10);
        // Only show if they haven't dismissed it AND they've visited the player at least 3 times
        if (!hasDismissed && visits >= 3) {
          setIsVisible(true);
        }
      } catch (e) {}
    }, 10000);

    return () => clearTimeout(showTimer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('zivox_theme_prompt_dismissed', 'true');
  };

  const applyTheme = (themeId: string) => {
    if (themeId === 'violet') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    updatePreferences({ theme: themeId as any });
    localStorage.setItem('zivox_theme_prompt_dismissed', 'true');
    
    // Give them a moment to see it, then dismiss
    setTimeout(() => {
      setIsVisible(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[250] w-[calc(100%-32px)] md:w-80 bg-void-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)' }}
        >
          <div className="p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-brand-500" />
              <h3 className="text-sm font-bold text-white tracking-tight">Personalize ZIVOX</h3>
            </div>
            
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Make the platform yours. Choose a theme color that fits your mood. You can always change this in settings.
            </p>

            <div className="grid grid-cols-4 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className="group relative aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: `linear-gradient(to top right, ${t.color} 0%, ${t.color} 70%, ${t.colorLight} 100%)` }}
                  title={t.name}
                >
                  {preferences.theme === t.id && (
                    <motion.div layoutId="theme-check" className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full shadow-sm ${t.id === 'silicon' ? 'bg-void-950' : 'bg-white'}`} />
                    </motion.div>
                  )}
                  <div className={`absolute inset-0 rounded-full ring-2 transition-all duration-300 ${t.id === 'silicon' ? 'ring-black/0 group-hover:ring-black/20' : 'ring-white/0 group-hover:ring-white/50'}`} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
