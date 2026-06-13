'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSource, sources, TOP_7_IDS, encodeServer, decodeServer } from '@/lib/sources';
import { Settings, Check, X, Heart, Server, Shield, ShieldOff, Play, Maximize, ExternalLink, RotateCcw, Share2, Copy, Twitter, Facebook, MessageCircle, ArrowUp, ArrowUpRight, Sparkles, Globe } from 'lucide-react';
import { ShareModal } from '@/components/ui/ShareModal';
import Link from 'next/link';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { storage } from '@/lib/storage';
import { useFavorites } from '@/hooks/useFavorites';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { PlayerToasts } from './PlayerToasts';
import { usePreferences } from '@/hooks/usePreferences';
import { SupportPopupModal } from '@/components/ui/SupportPopupModal';


interface VideoPlayerProps {
  type: 'movie' | 'tv';
  id: string;
  season?: number;
  episode?: number;
  title?: string;
  poster?: string | null;
  releaseYear?: string;
  onProgress?: (progress: number) => void;
  onPlayNext?: () => void;
  hasNextEpisode?: boolean;
  /** Pre-select a specific server (from URL ?server= param). Bypasses source-testing. */
  initialServer?: string;
  /** Delay showing tutorial instructions if a parent modal is open */
  blockTutorial?: boolean;
}

export function VideoPlayer({ type, id, season, episode, title, poster, releaseYear, onProgress, onPlayNext, hasNextEpisode, initialServer, blockTutorial = false }: VideoPlayerProps) {
  const [currentSourceId, setCurrentSourceId] = useState(sources[0].id);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [useSandbox, setUseSandbox] = useState(true);
  const [autoSandboxOnSwitch, setAutoSandboxOnSwitch] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [favoriteServers, setFavoriteServers] = useState<string[]>([]);
  const [showAllServers, setShowAllServers] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showRotateHint, setShowRotateHint] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCountdown, setTutorialCountdown] = useState(15);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [showValueToast, setShowValueToast] = useState(false);
  const hasSupportedRef = useRef(false);

  const [testingSources, setTestingSources] = useState(!initialServer);
  const [testProgress, setTestProgress] = useState(0);
  const [testingCurrentName, setTestingCurrentName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectProgress, setConnectProgress] = useState(0);
  const [networkSpeed, setNetworkSpeed] = useState<'fast' | 'medium' | 'slow'>('medium');
  const connectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedFavs = localStorage.getItem('favorite_servers');
    if (savedFavs) {
      try {
        setFavoriteServers(JSON.parse(savedFavs));
      } catch (e) {}
    }

    // ── Handle ?server= URL param ──
    // If a specific server was shared in the URL, skip testing and jump straight to it.
    // The URL contains a codename (e.g. "alpha"), decode it to the real internal id.
    const rawParam = initialServer || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('server') : null);
    const serverToUse = rawParam ? decodeServer(rawParam) : null;
    if (serverToUse && sources.find(s => s.id === serverToUse)) {
      const s = sources.find(s => s.id === serverToUse)!;
      setCurrentSourceId(s.id);
      if (s.autoDisableSandbox) {
        setUseSandbox(false);
      } else {
        const savedPref = localStorage.getItem('sandbox_pref_' + s.id);
        setUseSandbox(savedPref !== null ? savedPref === 'true' : true);
      }
      sessionStorage.setItem(`working_source_${id}`, s.id);
      setTestingSources(false);
    }

    // Portrait detection for mobile rotate hint
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    // ── Visit Logging ──
    try {
      const visits = parseInt(localStorage.getItem('player_visits') || '0', 10) + 1;
      localStorage.setItem('player_visits', visits.toString());
      
      const supportVal = localStorage.getItem('has_supported_zivox');
      if (supportVal === 'true') {
        hasSupportedRef.current = true;
      } else if (supportVal) {
        const expiry = parseInt(supportVal, 10);
        hasSupportedRef.current = !isNaN(expiry) && Date.now() < expiry;
      } else {
        hasSupportedRef.current = false;
      }

      // ── Value Saved Toast ──
      if (!hasSupportedRef.current && visits > 0 && visits % 3 === 0) {
        setTimeout(() => {
          setShowValueToast(true);
          setTimeout(() => setShowValueToast(false), 8000); // Show for 8 seconds
        }, 10000); // 10 seconds into the video
      }
    } catch (e) {}

    // ── Multilingual Hint Toast ──
    setTimeout(() => {
      showToast('For Hindi/Multilingual, switch servers and change audio inside player');
    }, 6000);

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // ── Background Crypto Transaction Validation ──
  // Listen to global donation updates (verified / revoked)
  useEffect(() => {
    const handleDonationUpdate = () => {
      try {
        const supportVal = localStorage.getItem('has_supported_zivox');
        if (supportVal === 'true') {
          hasSupportedRef.current = true;
          setShowSupportPopup(false);
        } else if (supportVal) {
          const expiry = parseInt(supportVal, 10);
          const isValid = !isNaN(expiry) && Date.now() < expiry;
          hasSupportedRef.current = isValid;
          if (isValid) {
            setShowSupportPopup(false);
          } else {
            setShowSupportPopup(true);
          }
        } else {
          hasSupportedRef.current = false;
          setShowSupportPopup(true);
        }
      } catch (e) {}
    };

    window.addEventListener('zivox_donation_update', handleDonationUpdate);
    return () => window.removeEventListener('zivox_donation_update', handleDonationUpdate);
  }, []);

  // ── Tutorial Spotlight Trigger (Delayed until blockTutorial is false) ──
  useEffect(() => {
    if (!blockTutorial) {
      try {
        const visits = parseInt(localStorage.getItem('player_visits') || '0', 10);
        if (visits > 0 && (visits & (visits - 1)) === 0) {
          setShowTutorial(true);
          setTutorialCountdown(15);
        }
      } catch (e) {}
    }
  }, [blockTutorial]);

  // ── Support Popup Timer (2 Minutes) ──
  useEffect(() => {
    if (testingSources || hasSupportedRef.current) return;

    const timer = setTimeout(() => {
      if (!hasSupportedRef.current && !showSupportPopup) {
        // Force exit native fullscreen so the user can see our React overlay
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setShowSupportPopup(true);
      }
    }, 300000);

    return () => clearTimeout(timer);
  }, [testingSources, showSupportPopup]);

  useEffect(() => {
    if (testingSources) return;

    // ── Detect network speed to tune animation duration ──
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    let speed: 'fast' | 'medium' | 'slow' = 'medium';
    if (connection) {
      const rtt = connection.rtt || 150;
      const downlink = connection.downlink || 5;
      if (rtt < 80 && downlink > 10) speed = 'fast';
      else if (rtt > 250 || downlink < 2) speed = 'slow';
    }
    setNetworkSpeed(speed);

    // Duration adapts to network: fast=8s, medium=12s, slow=20s
    // Iframe loads content in bg during this time so it's ready when anim ends
    const duration = speed === 'fast' ? 8000 : speed === 'slow' ? 20000 : 12000;

    setIsConnecting(true);
    setConnectProgress(0);

    // Smooth progress bar that fills over the duration
    const step = 100 / (duration / 120); // tick every 120ms
    connectIntervalRef.current = setInterval(() => {
      setConnectProgress(p => {
        if (p >= 95) return p; // Hold at 95% — jump to 100 when done
        return Math.min(95, p + step);
      });
    }, 120);

    connectTimerRef.current = setTimeout(() => {
      setConnectProgress(100);
      if (connectIntervalRef.current) clearInterval(connectIntervalRef.current);
      setTimeout(() => setIsConnecting(false), 400); // Brief 100% flash
    }, duration);

    return () => {
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      if (connectIntervalRef.current) clearInterval(connectIntervalRef.current);
    };
  }, [currentSourceId, testingSources]);

  // Auto-scroll active server tab into view
  useEffect(() => {
    if (!testingSources && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentSourceId, testingSources]);

  const { addToHistory, history } = useWatchHistory();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(id);

  const hasAddedHistory = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!testingSources) return;
    
    let isMounted = true;
    const testAllSources = async () => {
      const cached = sessionStorage.getItem(`working_source_${id}`);
      if (cached && sources.find(s => s.id === cached)) {
        const cachedSource = sources.find(s => s.id === cached)!;
          setCurrentSourceId(cachedSource.id);
          const savedPref = localStorage.getItem('sandbox_pref_' + cachedSource.id);
          setUseSandbox(savedPref !== null ? savedPref === 'true' : true);
          setTestingSources(false);
        showToast("Loaded from cache");
        return;
      }

      for (let i = 0; i < sources.length; i++) {
        if (!isMounted) return;
        const s = sources[i];
        setTestingCurrentName(s.publicName); // Use publicName (Server 1, Server 2...)
        setTestProgress(((i) / sources.length) * 100);
        
        const checkTime = Math.random() * 800 + 400;
        await new Promise(r => setTimeout(r, checkTime));
        
        const works = Math.random() > (i === 0 ? 0.1 : 0.4); 
        
        if (works || i === sources.length - 1) {
          if (isMounted) {
            setCurrentSourceId(s.id);
            // Auto-disable sandbox for peachify
            if (s.autoDisableSandbox) {
              setUseSandbox(false);
              localStorage.setItem('sandbox_pref_' + s.id, 'false');
            } else {
              const savedPref = localStorage.getItem('sandbox_pref_' + s.id);
              setUseSandbox(savedPref !== null ? savedPref === 'true' : true);
            }
            sessionStorage.setItem(`working_source_${id}`, s.id);
            setTestingSources(false);
            setTestProgress(100);
            showToast(`Connected to ${s.publicName}`);
          }
          break;
        }
      }
    };

    testAllSources();
    return () => { isMounted = false; };
  }, [id, testingSources]);

  useEffect(() => {
    setAutoPlayNext(storage.get().settings?.autoPlayNext ?? true);
  }, []);

  const toggleAutoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newAutoPlay = !autoPlayNext;
    setAutoPlayNext(newAutoPlay);
    storage.set({ settings: { ...storage.get().settings, autoPlayNext: newAutoPlay } });
  };

  useEffect(() => {
    const key = `${id}-${season || 'x'}-${episode || 'x'}`;
    if (title && id && hasAddedHistory.current !== key) {
      hasAddedHistory.current = key;
      const existingHistory = storage.get().history || [];
      const item = existingHistory.find(h => h.id === id && h.season === season && h.episode === episode);
      
      let startProgress = item?.progress || 0;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tParam = params.get('t');
        if (tParam && !isNaN(Number(tParam))) {
          startProgress = Number(tParam);
        }
      }
      
      addToHistory({ id, type, title, poster: poster || null, timestamp: Date.now(), season, episode, progress: startProgress, release_date: releaseYear });
      setProgress(startProgress);
      setShowNextOverlay(false);
      setCountdown(10);
    }
  }, [id, type, title, poster, season, episode, addToHistory]);

  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    const saveProgress = () => {
      if (title && id) {
        addToHistory({ id, type, title, poster: poster || null, timestamp: Date.now(), season, episode, progress: progressRef.current, release_date: releaseYear });
      }
    };
    window.addEventListener('beforeunload', saveProgress);
    return () => {
      window.removeEventListener('beforeunload', saveProgress);
      // Defer the final write so back-navigation is immediately responsive
      queueMicrotask(saveProgress);
    };
  }, [id, type, title, poster, season, episode, addToHistory, releaseYear]);

  // postMessage listener: sync real progress and episode changes from iframes that broadcast them
  useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data || typeof data !== 'object') return;

        // Progress sync: some embeds send currentTime/duration
        if (data.currentTime !== undefined && data.duration !== undefined && data.duration > 0) {
          const realProgress = Math.min(100, (data.currentTime / data.duration) * 100);
          setProgress(realProgress);
          if (title && id) {
            addToHistory({ id, type, title, poster: poster || null, timestamp: Date.now(), season, episode, progress: realProgress, release_date: releaseYear });
          }
          if (onProgress) onProgress(realProgress);
          if (type === 'tv' && hasNextEpisode && realProgress >= 90 && !showNextOverlay) {
            setShowNextOverlay(true);
          }
        }

        // Episode change: some embeds send season/episode data when user navigates within embed
        if (data.season !== undefined && data.episode !== undefined) {
          const newSeason = Number(data.season);
          const newEpisode = Number(data.episode);
          if (
            type === 'tv' &&
            (newSeason !== season || newEpisode !== episode) &&
            newSeason > 0 && newEpisode > 0
          ) {
            // Update URL to reflect the new episode without full page reload
            const url = new URL(window.location.href);
            url.searchParams.set('season', String(newSeason));
            url.searchParams.set('episode', String(newEpisode));
            window.history.replaceState({}, '', url.toString());
            // Log it to history
            if (title) {
              addToHistory({ id, type, title, poster: poster || null, timestamp: Date.now(), season: newSeason, episode: newEpisode, progress: 0, release_date: releaseYear });
            }
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
    // Removed showNextOverlay from deps — it changes every second from the interval
    // causing this listener to re-register constantly. Use a ref instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, title, poster, season, episode, addToHistory, onProgress, hasNextEpisode]);

  useEffect(() => {
    // Run every 10s instead of every 1s — reduces localStorage writes by 10x
    // Progress display uses React state updated every 10s; visual accuracy is acceptable
    const interval = setInterval(() => {
      setProgress(p => {
        const nextP = Math.min(100, p + (100 / (45 * 6))); // 10s steps for 45min film
        
        // Debounced history write — max once per 8 seconds
        const now = Date.now();
        if (title && id && now - lastSaveRef.current > 8000) {
          lastSaveRef.current = now;
          addToHistory({ id, type, title, poster: poster || null, timestamp: now, season, episode, progress: nextP, release_date: releaseYear });
        }
        if (onProgress) onProgress(nextP);
        if (type === 'tv' && hasNextEpisode && nextP >= 95) {
          setShowNextOverlay(true);
        }
        return nextP;
      });
    }, 10000);

    return () => clearInterval(interval);
  // Stable deps only — showNextOverlay intentionally excluded to prevent re-registration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, title, poster, season, episode, addToHistory, onProgress, hasNextEpisode]);

  useEffect(() => {
    let countInterval: NodeJS.Timeout;
    if (showNextOverlay && countdown > 0) {
      countInterval = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
             if (autoPlayNext && onPlayNext) onPlayNext();
             return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countInterval);
  }, [showNextOverlay, countdown, autoPlayNext, onPlayNext]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showTutorial && tutorialCountdown > 0) {
      timer = setInterval(() => {
        setTutorialCountdown(c => c - 1);
      }, 1000);
    } else if (showTutorial && tutorialCountdown <= 0) {
      setShowTutorial(false);
    }
    return () => clearInterval(timer);
  }, [showTutorial, tutorialCountdown]);

  // Lock scroll when tutorial is active
  useEffect(() => {
    if (showTutorial) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showTutorial]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        showToast(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Prevent iframe from stealing keyboard focus so our shortcuts (like 'f') always work
  useEffect(() => {
    const handleBlur = () => {
      // Small delay allows the initial click (e.g. play/pause) to register in the iframe first
      setTimeout(() => {
        if (document.activeElement?.tagName === 'IFRAME') {
          window.focus();
        }
      }, 50);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger if user is typing
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
      ) return;

      // Only handle F for fullscreen when video container is focused/hovered
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }

      // Space: only prevent page scroll, let the iframe handle play/pause natively
      if (e.key === ' ') {
        // Prevent page scroll
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      // Show rotate hint only on mobile portrait
      if (fs && window.innerHeight > window.innerWidth && window.innerWidth < 768) {
        setShowRotateHint(true);
        setTimeout(() => setShowRotateHint(false), 4000);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Attempt landscape orientation lock when entering fullscreen on mobile
  // This is a best-effort — many browsers deny it, so we silently catch errors
  useEffect(() => {
    const handleFsChange = async () => {
      if (document.fullscreenElement && window.innerWidth < 768) {
        try {
          await (screen.orientation as any).lock?.('landscape');
        } catch (_) { /* browser denied — fine */ }
      } else if (!document.fullscreenElement) {
        try {
          (screen.orientation as any).unlock?.();
        } catch (_) {}
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Top 7 servers — shown with publicName (Server 1..7), real name in settings
  const top7Sources = sources.filter(s => TOP_7_IDS.includes(s.id) && !favoriteServers.includes(s.id));
  const favoriteSources = sources.filter(s => favoriteServers.includes(s.id));
  const remainingSources = sources.filter(s => !TOP_7_IDS.includes(s.id) && !favoriteServers.includes(s.id));

  const toggleFavServer = (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    const newFavs = favoriteServers.includes(serverId) 
      ? favoriteServers.filter(fid => fid !== serverId)
      : [...favoriteServers, serverId];
    setFavoriteServers(newFavs);
    localStorage.setItem('favorite_servers', JSON.stringify(newFavs));
  };

  // When switching server: handle peachify auto-disable sandbox
  const handleSwitchServer = (sId: string) => {
    const s = sources.find(x => x.id === sId)!;
    setCurrentSourceId(sId);
    
    let toastMsg = `Switched to ${s.publicName}`;
    
    if (sId === 'peachify') {
      setUseSandbox(false);
      localStorage.setItem('sandbox_pref_' + sId, 'false');
      toastMsg = 'You may get ads. Sorry, we were not able to make this server work without ads.';
    } else if (s.autoDisableSandbox) {
      setUseSandbox(false);
      localStorage.setItem('sandbox_pref_' + sId, 'false');
      toastMsg = 'Sandbox disabled — ads or redirects may appear';
    } else {
      const savedPref = localStorage.getItem('sandbox_pref_' + sId);
      if (savedPref !== null) {
        setUseSandbox(savedPref === 'true');
      } else if (autoSandboxOnSwitch) {
        setUseSandbox(true);
      }
    }
    
    sessionStorage.setItem(`working_source_${id}`, sId);
    setShowSettingsModal(false);
    showToast(toastMsg);
  };

  const { preferences } = usePreferences();
  
  const themeHexMap: Record<string, string> = {
    violet: '7c3aed',
    blue: '2563eb',
    red: 'e50914',
    emerald: '059669',
    silicon: 'f8fafc',
    rose: 'e11d48',
    amber: 'f59e0b',
    cyan: '0ea5e9'
  };
  const activeThemeHex = themeHexMap[preferences.theme || 'violet'] || '7c3aed';

  const source = getSource(currentSourceId);
  const embedUrl = source.url(type, id, season, episode, activeThemeHex);

  const sandboxAttrs = useSandbox 
    ? source.sandboxFlags 
    : undefined; // Completely removes sandbox attribute for true unsandboxed play

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col w-full relative bg-void-950 rounded-2xl overflow-hidden border border-zinc-800/60"
      style={{
        boxShadow: '0 0 80px -20px var(--brand-ambient), 0 0 30px -10px var(--brand-glow)',
        contain: 'layout style',
      }}
    >
      <PlayerToasts key={id} serverName={source.publicName} serverIsNoAds={source.noAds} isPaused={showTutorial} />

      {/* First-time Tutorial Spotlight - Precise Tooltips */}
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
                    {/* Add gradient background for mobile to make text readable over video */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent md:hidden pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center w-full px-4 mt-8 md:mt-0">
                      {/* Optional preview image could go here */}
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

      {/* Inline toast message (server switch) via portal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[9998] bg-black/80 text-white px-5 py-2.5 rounded-full font-bold tracking-widest text-xs backdrop-blur-md pointer-events-none border border-white/10"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Value Saved Toast (Quantify Value) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showValueToast && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed top-24 right-4 z-[9998] bg-[#0a080c] border border-brand-500/30 text-white p-4 sm:p-5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-[320px] pointer-events-auto"
            >
              <h4 className="font-bold text-sm text-brand-400 mb-1.5 flex items-center gap-1.5 leading-tight"><Sparkles size={14} /> You just saved ~15 mins of ads!</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 font-medium">If you love the uninterrupted ZIVOX experience, please consider backing us.</p>
              <Link href="/support" className="inline-flex items-center justify-center bg-brand-500 text-black px-3 py-2.5 rounded-xl text-[10px] font-black w-full uppercase tracking-widest hover:bg-brand-400 transition-colors shadow-lg active:scale-95">Buy us a coffee ☕</Link>
              <button onClick={() => setShowValueToast(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-md p-1"><X size={12}/></button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Rotate phone hint (mobile fullscreen portrait) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showRotateHint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[9997] flex items-center justify-center pointer-events-none"
            >
              <div className="flex flex-col items-center gap-3 bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 shadow-2xl">
                <RotateCcw size={32} className="text-white animate-spin" style={{ animationDuration: '2s' }} />
                <p className="text-white font-bold text-sm tracking-wide text-center">Rotate your phone<br/><span className="text-zinc-400 font-normal text-xs">for the best experience</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Settings Modal via Portal (renders outside iframe, proper z-index on mobile) */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSettingsModal && (
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
                          const isTop7 = TOP_7_IDS.includes(s.id);
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
                                            setCurrentSourceId(s.id);
                                            const savedPref = localStorage.getItem('sandbox_pref_' + s.id);
                                            if (savedPref !== null) setUseSandbox(savedPref === 'true');
                                            else if (autoSandboxOnSwitch) setUseSandbox(true);
                                            sessionStorage.setItem(`working_source_${id}`, s.id);
                                            setShowSettingsModal(false);
                                            showToast(`${s.publicName}`);
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
                                            {s.noAds && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">âœ“</span>}
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
                        localStorage.setItem('sandbox_pref_' + currentSourceId, n.toString());
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
                        localStorage.setItem('auto_sandbox_on_switch', n.toString());
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

                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={title || ''}
        shareUrl={mounted ? (() => {
          try {
            const u = new URL(window.location.href);
            u.searchParams.set('play', '1');
            u.searchParams.delete('t');
            return u.toString();
          } catch { return window.location.href; }
        })() : ''}
        subtitle={`Via ${source.publicName}`}
      >
        {/* ── Copy with Autoplay */}
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('play', '1');
            url.searchParams.delete('server');
            url.searchParams.delete('t');
            navigator.clipboard.writeText(url.toString());
            showToast('Autoplay link copied! ▶');
            setShowShareModal(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-brand-500/10 hover:bg-brand-500/15 border border-brand-500/30 rounded-2xl transition-all active:scale-[0.98] mt-2"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
            <Play size={15} className="text-brand-400 fill-brand-400 ml-0.5" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-bold text-white">Copy with Autoplay</span>
            <span className="text-[11px] text-white/40">Recipient lands directly in the player</span>
          </div>
        </button>

        {/* ── Copy with Server + Autoplay */}
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('play', '1');
            url.searchParams.set('server', encodeServer(currentSourceId));
            url.searchParams.delete('t');
            navigator.clipboard.writeText(url.toString());
            showToast(`Link with ${source.publicName} copied!`);
            setShowShareModal(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 rounded-2xl transition-all active:scale-[0.98] mt-2"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <Server size={15} className="text-purple-400" />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-bold text-white">Copy with Server</span>
            <span className="text-[11px] text-white/40 truncate w-full">Opens on {source.publicName} automatically</span>
          </div>
        </button>

      </ShareModal>

      {/* ── PLAYER TOP BAR ── */}
      {!isFullscreen && (
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
                localStorage.setItem('sandbox_pref_' + currentSourceId, n.toString());
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
              onClick={(e) => { e.stopPropagation(); toggleFavorite({ id, type, title: title || '', poster, release_date: releaseYear }); }}
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
      )}

      {/* Video Container — proper 16:9 aspect ratio, works on all screens */}

      {/* ── QUICK SERVER STRIP ─────────────────────────────────────────────────
           Shows the current server + 3 alternatives from the Top 7 as pills.
           Tapping switches instantly. A note below points to full settings.
      ─────────────────────────────────────────────────────────────────────── */}
      {!isFullscreen && (() => {
        const top7 = sources.filter(s => TOP_7_IDS.includes(s.id));
        // Multilingual servers — always surface these for dubbed/subbed content
        const multilingualIds = new Set(['peachify', 'vidsrcwtf2']);

        // Responsive visibility:
        // - Mobile (<768px): show 4 servers (current first, then 3 others)
        // - Tablet (768-1023px): show 5 servers
        // - Desktop (≥1024px): show all 7 always

        // Build ordered list: current server first, then rest in TOP_7_IDS order
        const currentInTop7 = TOP_7_IDS.includes(currentSourceId);
        const orderedStrip = currentInTop7
          ? [
              top7.find(s => s.id === currentSourceId)!,
              ...top7.filter(s => s.id !== currentSourceId),
            ]
          : [...top7];

        return (
          <div className={`px-3 pt-2.5 pb-1.5 bg-void-950 border-b border-zinc-800/40 shrink-0 ${isFullscreen ? 'hidden' : ''}`}>
            {/* Desktop: all 7 always visible */}
            <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
              {top7.map((s) => {
                const isActive = s.id === currentSourceId;
                const isMultilingual = multilingualIds.has(s.id);
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
                const isMultilingual = multilingualIds.has(s.id);
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
                    const isMultilingual = multilingualIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        ref={isActive ? activeTabRef : null}
                        onClick={() => !isActive && handleSwitchServer(s.id)}
                        className={`shrink-0 flex items-center justify-center gap-1.5 h-[32px] px-3 text-[12px] whitespace-nowrap snap-start border-b-2 transition-all duration-200 bg-transparent ${
                          isActive
                            ? 'border-brand-500 text-[var(--premium-text,#ffffff)] font-bold cursor-default'
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
      })()}


      <div className={`relative w-full bg-black transition-all ${isFullscreen ? 'flex-1 h-full' : isPortrait ? 'aspect-[4/3] min-h-[380px] sm:aspect-video' : 'aspect-video'}`}>

        {testingSources ? (
          <div className="absolute inset-0 z-40 bg-void-950 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            {poster && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/w500${poster})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(40px) saturate(1.5)',
                  transform: 'scale(1.1)',
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/70 to-void-950/50 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center gap-5 max-w-xs w-full">
              <div className="relative">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin"
                  style={{ animationDuration: '1s' }}
                />
                <div
                  className="absolute inset-2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-500) 15%, transparent) 0%, transparent 70%)',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                />
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <h3 className="text-[12px] text-[#9ca3af] font-medium flex items-center">
                  Fetching media / Trying streaming servers<span className="animate-pulse tracking-widest">...</span>
                </h3>
                <p className="text-zinc-500 text-[11px] text-center max-w-[200px] leading-relaxed">
                  Testing <span className="text-white font-semibold">{testingCurrentName}</span>
                </p>
              </div>
              
              <div className="w-full max-w-[200px]">
                <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-zinc-600 mb-1.5 uppercase tracking-widest">
                  <span>Scanning</span>
                  <span className="text-brand-500">{Math.round(testProgress)}%</span>
                </div>
                <div className="w-full h-[2px] bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-premium-gradient-dark rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${testProgress}%`,
                      boxShadow: '0 0 8px color-mix(in srgb, var(--brand-500) 60%, transparent)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── IFRAME — always rendered so content loads in background ──────────
                During isConnecting, the iframe is invisible (opacity-0) but still
                loading content. By the time the animation finishes, the video is ready.
            */}
            <iframe
              key={`iframe-${currentSourceId}-${useSandbox ? 'sandbox' : 'nosandbox'}`}
              src={embedUrl}
              className={`absolute inset-0 w-full h-full border-0 transition-opacity duration-700 ${
                isConnecting
                  ? 'opacity-0 pointer-events-none'
                  : showSupportPopup
                    ? 'opacity-40 pointer-events-none'
                    : 'pointer-events-auto opacity-100'
              }`}
              style={{
                // Promote to own GPU compositing layer — isolates it from
                // backdrop-blur / box-shadow repaints in parent stacking contexts.
                // This is the key fix for windowed buffering/lag.
                willChange: 'transform',
                transform: 'translateZ(0)',
                // Only apply blur filter when strictly needed (support popup)
                ...((!isConnecting && showSupportPopup) ? { filter: 'blur(4px) grayscale(1)' } : {})
              }}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              sandbox={sandboxAttrs}
            />

            {/* ── CONNECTING ANIMATION OVERLAY ─────────────────────────────────
                Shows while the iframe loads in the background.
                Duration: 8s (fast network) / 12s (medium) / 20s (slow).
                Progress bar reflects real time elapsed so user knows it's working.
            */}
            <AnimatePresence>
              {isConnecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-30 bg-void-950 flex flex-col items-center justify-center p-4 text-center pointer-events-none overflow-hidden"
                >
                  {/* Blurred poster background */}
                  {poster && (
                    <div
                      className="absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage: `url(https://image.tmdb.org/t/p/w500${poster})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(50px) saturate(2)',
                        transform: 'scale(1.15)',
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-950/80 to-void-950/60" />

                  <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-[280px] sm:max-w-sm">
                    {/* Animated server ring */}
                    <div className="relative flex items-center justify-center">
                      {/* Outer pulse ring */}
                      <motion.div
                        className="absolute w-24 h-24 rounded-full border border-brand-500/20"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* Middle ring */}
                      <motion.div
                        className="absolute w-16 h-16 rounded-full border border-brand-500/40"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                      />
                      {/* Spinning arc */}
                      <div
                        className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-brand-500 animate-spin"
                        style={{ animationDuration: '1.2s' }}
                      />
                      {/* Center dot */}
                      <div className="absolute w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_12px_var(--brand-500)]" />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-display font-black uppercase tracking-widest text-white">
                          Connecting to Server
                        </h3>
                        {/* Network speed badge */}
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          networkSpeed === 'fast'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : networkSpeed === 'slow'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {networkSpeed === 'fast' ? '⚡ Fast' : networkSpeed === 'slow' ? '🐢 Slow' : '📶 OK'}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
                        Establishing encrypted stream via{' '}
                        <span className="text-brand-400 font-bold">{source.publicName}</span>
                        <span className="animate-pulse">...</span>
                      </p>
                    </div>

                    {/* Server status dots */}
                    <div className="flex items-center gap-3">
                      {['Auth', 'CDN', 'Stream'].map((label, i) => (
                        <div key={label} className="flex flex-col items-center gap-1.5">
                          <motion.div
                            className="w-2 h-2 rounded-full bg-brand-500"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                            style={{ boxShadow: '0 0 6px var(--brand-500)' }}
                          />
                          <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full">
                      <div className="flex justify-between text-[9px] font-mono text-zinc-600 mb-2 uppercase tracking-widest">
                        <span>Loading stream</span>
                        <span className="text-brand-500 font-bold">{Math.round(connectProgress)}%</span>
                      </div>
                      <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
                          style={{
                            width: `${connectProgress}%`,
                            boxShadow: '0 0 10px color-mix(in srgb, var(--brand-500) 60%, transparent)',
                            transition: 'width 0.15s ease-out',
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-zinc-700 mt-2 text-center">
                        Content loading in background — will be ready instantly ✓
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

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

        {/* 20-Second Support Popup */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <SupportPopupModal
            isOpen={showSupportPopup}
            mediaType={type}
            title={title}
            onComplete={() => {
              setShowSupportPopup(false);
              hasSupportedRef.current = true;
              window.dispatchEvent(new Event('zivox_donation_update'));
            }}
          />,
          document.body
        )}
      </div>

    </motion.div>
  );
}
