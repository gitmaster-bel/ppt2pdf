'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSource, sources, TOP_8_IDS, EXTENDED_TOP_IDS, encodeServer, decodeServer } from '@/lib/sources';
import { Settings, X, Heart, Server, Shield, ShieldOff, Play, Maximize, RotateCcw, Share2, ArrowUp, Sparkles, Globe, Wifi, WifiOff } from 'lucide-react';
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
import { getSupportAccess, SUPPORT_ACCESS_KEY, SUPPORT_ACCESS_UPDATED_EVENT } from '@/lib/support-access';
import { SettingsModal } from './player/SettingsModal';
import { QuickServerStrip } from './player/QuickServerStrip';
import { PlayerTopBar } from './player/PlayerTopBar';
import { TutorialSpotlight } from './player/TutorialSpotlight';
import { ConnectingOverlay } from './player/ConnectingOverlay';
import { TestingSourcesOverlay } from './player/TestingSourcesOverlay';
import { UpNextOverlay } from './player/UpNextOverlay';


const SUPPORT_PROMPT_DELAY_MS = 12 * 60 * 1000;
const SUPPORT_TIMER_SLICE_MS = 12 * 60 * 60 * 1000;

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
  const showNextOverlayRef = useRef(false);
  useEffect(() => { showNextOverlayRef.current = showNextOverlay; }, [showNextOverlay]);
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
      
      hasSupportedRef.current = getSupportAccess().isActive;

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
        const access = getSupportAccess();
        hasSupportedRef.current = access.isActive;
        if (access.isActive) setShowSupportPopup(false);
      } catch (e) {}
    };

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === SUPPORT_ACCESS_KEY) {
        handleDonationUpdate();
      }
    };

    window.addEventListener('zivox_donation_update', handleDonationUpdate);
    window.addEventListener(SUPPORT_ACCESS_UPDATED_EVENT, handleDonationUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('zivox_donation_update', handleDonationUpdate);
      window.removeEventListener(SUPPORT_ACCESS_UPDATED_EVENT, handleDonationUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
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
    if (testingSources) return;

    let timer: NodeJS.Timeout | null = null;

    const scheduleSupportPrompt = () => {
      if (timer) clearTimeout(timer);

      const access = getSupportAccess();
      hasSupportedRef.current = access.isActive;

      if (access.isActive && access.expiresAt === null) return;

      const rawDelay = access.isActive && access.expiresAt
        ? Math.max(access.expiresAt - Date.now(), 0)
        : SUPPORT_PROMPT_DELAY_MS;
      const delay = Math.min(rawDelay, SUPPORT_TIMER_SLICE_MS);

      timer = setTimeout(() => {
        const latestAccess = getSupportAccess();
        hasSupportedRef.current = latestAccess.isActive;

        if (latestAccess.isActive) {
          scheduleSupportPrompt();
          return;
        }

        if (!latestAccess.isActive && !showSupportPopup) {
          // Force exit native fullscreen ONLY if the iframe itself is the fullscreen element.
          // If our container is fullscreen, the React overlay will naturally appear on top.
          if (document.fullscreenElement && document.fullscreenElement !== containerRef.current) {
            document.exitFullscreen().catch(() => {});
          }
          setShowSupportPopup(true);
        }
      }, delay);
    };

    const handleAccessUpdate = () => scheduleSupportPrompt();
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === SUPPORT_ACCESS_KEY) scheduleSupportPrompt();
    };

    scheduleSupportPrompt();
    window.addEventListener(SUPPORT_ACCESS_UPDATED_EVENT, handleAccessUpdate);
    window.addEventListener('zivox_donation_update', handleAccessUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(SUPPORT_ACCESS_UPDATED_EVENT, handleAccessUpdate);
      window.removeEventListener('zivox_donation_update', handleAccessUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
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
        
        const checkTime = 500;
        await new Promise(r => setTimeout(r, checkTime));
        
        const works = true; // Deterministic: always prefer the top source or cached source 
        
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
          if (type === 'tv' && hasNextEpisode && realProgress >= 90 && !showNextOverlayRef.current) {
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

  // Removed `handleBlur` focus-stealing effect so iframe can handle its own keyboard shortcuts

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
  const top7Sources = sources.filter(s => EXTENDED_TOP_IDS.includes(s.id) && !favoriteServers.includes(s.id));
  const favoriteSources = sources.filter(s => favoriteServers.includes(s.id));
  const remainingSources = sources.filter(s => !EXTENDED_TOP_IDS.includes(s.id) && !favoriteServers.includes(s.id));

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

  const { preferences, updatePreferences } = usePreferences();
  const dataSaver = preferences.dataSaver ?? false;
  
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
  const embedUrl = source.url(type, id, season, episode, activeThemeHex, preferences.serverLanguage || 'en');

  const sandboxAttrs = useSandbox 
    ? source.sandboxFlags 
    : undefined; // Completely removes sandbox attribute for true unsandboxed play

  const getShareUrl = (options: { play?: boolean; server?: boolean } = {}) => {
    if (!mounted) return '';
    try {
      const url = new URL(window.location.href);
      if (options.play) {
        url.searchParams.set('play', '1');
      } else {
        url.searchParams.delete('play');
      }

      if (options.server) {
        url.searchParams.set('server', encodeServer(currentSourceId));
      } else {
        url.searchParams.delete('server');
      }

      url.searchParams.delete('t');
      return url.toString();
    } catch {
      return typeof window !== 'undefined' ? window.location.href : '';
    }
  };

  const supportPopup = mounted ? (
    <SupportPopupModal
      isOpen={showSupportPopup}
      mediaType={type}
      title={title}
      onComplete={() => {
        setShowSupportPopup(false);
        hasSupportedRef.current = true;
        window.dispatchEvent(new Event('zivox_donation_update'));
      }}
    />
  ) : null;

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col w-full relative bg-void-950 overflow-hidden ${isFullscreen ? 'rounded-none border-none' : 'rounded-2xl border border-zinc-800/60'}`}
      style={{
        boxShadow: '0 0 80px -20px var(--brand-ambient), 0 0 30px -10px var(--brand-glow)',
        contain: 'layout style',
      }}
    >
      <PlayerToasts key={id} serverName={source.publicName} serverIsNoAds={source.noAds} isPaused={showTutorial} />

      {/* First-time Tutorial Spotlight - Precise Tooltips */}
      <TutorialSpotlight showTutorial={showTutorial} setShowTutorial={setShowTutorial} tutorialCountdown={tutorialCountdown} />

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
        <SettingsModal
          showSettingsModal={showSettingsModal}
          setShowSettingsModal={setShowSettingsModal}
          sources={sources}
          currentSourceId={currentSourceId}
          handleSwitchServer={handleSwitchServer}
          favoriteServers={favoriteServers}
          toggleFavServer={toggleFavServer}
          showAllServers={showAllServers}
          setShowAllServers={setShowAllServers}
          useSandbox={useSandbox}
          setUseSandbox={setUseSandbox}
          autoSandboxOnSwitch={autoSandboxOnSwitch}
          setAutoSandboxOnSwitch={setAutoSandboxOnSwitch}
          type={type}
          autoPlayNext={autoPlayNext}
          setAutoPlayNext={setAutoPlayNext}
          dataSaver={dataSaver}
          updatePreferences={updatePreferences}
          showToast={showToast}
          id={id}
          storage={storage}
        />, document.body)}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={title || ''}
        shareUrl={getShareUrl({ play: true, server: true })}
        subtitle={`Via ${source.publicName}`}
      />

      {/* ── PLAYER TOP BAR & SERVER STRIP (Animated for Fullscreen) ── */}
      <AnimatePresence initial={false}>
        {!isFullscreen && (
          <motion.div
            key="player-controls"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden w-full flex flex-col shrink-0"
          >
            <PlayerTopBar
              isFullscreen={isFullscreen}
              setShowSettingsModal={setShowSettingsModal}
              source={source}
              setShowShareModal={setShowShareModal}
              useSandbox={useSandbox}
              setUseSandbox={setUseSandbox}
              currentSourceId={currentSourceId}
              showToast={showToast}
              isFav={isFav}
              toggleFavorite={() => toggleFavorite({ id, type, title: title || '', poster, release_date: releaseYear })}
              toggleFullscreen={toggleFullscreen}
              serverLanguage={preferences.serverLanguage || 'en'}
              updatePreferences={updatePreferences}
            />
            <QuickServerStrip
              isFullscreen={isFullscreen}
              currentSourceId={currentSourceId}
              sources={sources}
              handleSwitchServer={handleSwitchServer}
              setShowSettingsModal={setShowSettingsModal}
              activeTabRef={activeTabRef}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative w-full bg-black transition-all ${isFullscreen ? 'flex-1 h-full' : 'aspect-[4/3] sm:aspect-video w-full min-h-[260px] sm:min-h-[280px] md:min-h-0'}`}>

        {testingSources ? (
          <TestingSourcesOverlay
            testingSources={testingSources}
            poster={poster}
            testingCurrentName={testingCurrentName}
            testProgress={testProgress}
          />
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
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; xr-spatial-tracking; clipboard-write; encrypted-media; gyroscope; accelerometer"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox={sandboxAttrs}
            />

            {/* ── CONNECTING ANIMATION OVERLAY ─────────────────────────────────
                Shows while the iframe loads in the background.
            */}
            <ConnectingOverlay
              isConnecting={isConnecting}
              poster={poster}
              networkSpeed={networkSpeed}
              source={source}
              connectProgress={connectProgress}
            />
          </>
        )}

        <UpNextOverlay
          showNextOverlay={showNextOverlay}
          hasNextEpisode={hasNextEpisode || false}
          countdown={countdown}
          setShowNextOverlay={setShowNextOverlay}
          onPlayNext={onPlayNext}
        />

        {/* Support Popup: portal in normal mode, child in fullscreen mode. */}
        {supportPopup && (isFullscreen ? supportPopup : createPortal(supportPopup, document.body))}
      </div>

    </motion.div>
  );
}
