'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, AlertCircle, Server } from 'lucide-react';

interface ToastData {
  id: string;
  message: string;
  icon: 'info' | 'alert' | 'server';
}

interface PlayerToastsProps {
  serverName?: string;
  serverIsNoAds?: boolean;
  isPaused?: boolean;
}

export function PlayerToasts({ serverName, serverIsNoAds, isPaused }: PlayerToastsProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);
  const initialToastsTriggered = useRef(false);
  const prevServerName = useRef<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fire initial toasts only AFTER portal is ready (mounted=true) and not paused
  useEffect(() => {
    if (!mounted) return;
    if (isPaused) return;
    if (initialToastsTriggered.current) return;
    initialToastsTriggered.current = true;

    // Set initial prevServerName without triggering server switch toast
    prevServerName.current = serverName;

    if (serverIsNoAds) {
      // For no-ads servers: just one simple helpful toast
      const msgs: ToastData[] = [
        {
          id: `init-1-${Date.now()}`,
          icon: 'info',
          message: 'Content unavailable on this server? Switch to another from the Servers & Settings menu.'
        }
      ];
      setTimeout(() => {
        setToasts(prev => {
          if (prev.some(t => t.id === msgs[0].id)) return prev;
          return [...prev, msgs[0]];
        });
      }, 1000);
    } else {
      // For other servers: show all informational toasts
      const messages: ToastData[] = [
        {
          id: `init-1-${Date.now()}`,
          icon: 'info',
          message: 'Some servers may trigger redirects from 3rd-party sources — not from ZIVOX. Sandbox Shield protects you!'
        },
        {
          id: `init-2-${Date.now() + 1}`,
          icon: 'alert',
          message: 'If a video fails to load, try disabling Sandbox in Settings. Some sources require it off.'
        },
        {
          id: `init-3-${Date.now() + 2}`,
          icon: 'info',
          message: 'Too many ads? Switch servers from the Servers & Settings menu for a cleaner experience.'
        }
      ];

      const timeouts = messages.map((msg, idx) =>
        setTimeout(() => {
          setToasts(prev => {
            if (prev.some(t => t.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }, 800 + idx * 2200)
      );
      return () => timeouts.forEach(clearTimeout);
    }
  }, [mounted, serverName, serverIsNoAds, isPaused]);

  // Watch for Server Name changes (skip the very first assignment)
  useEffect(() => {
    if (!mounted) return;
    if (!initialToastsTriggered.current) return;
    if (prevServerName.current === undefined) {
      prevServerName.current = serverName;
      return;
    }
    prevServerName.current = serverName;
  }, [serverName, mounted]);

  // Per-toast 8s expiry
  useEffect(() => {
    if (toasts.length === 0) return;
    const latestToast = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== latestToast.id));
    }, 8000);
    return () => clearTimeout(timer);
  }, [toasts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-16 right-4 md:right-6 md:top-16 z-[9999] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            layout
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.92, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="backdrop-blur-2xl border rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 pointer-events-auto relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(6, 6, 8, 0.94)',
              borderColor: 'var(--ambient-color, rgba(255,255,255,0.15))',
              boxShadow: '0 6px 28px -8px var(--ambient-color, rgba(0,0,0,0.8))'
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-xl"
              style={{ background: 'radial-gradient(ellipse at top left, var(--ambient-color, transparent), transparent 70%)' }}
            />

            <div className={`mt-0.5 shrink-0 relative z-10 ${
              toast.icon === 'alert' ? 'text-amber-400' :
              toast.icon === 'server' ? 'text-emerald-400' : 'text-sky-400'
            }`}>
              {toast.icon === 'alert' ? <AlertCircle size={16} /> :
               toast.icon === 'server' ? <Server size={16} /> : <Info size={16} />}
            </div>

            <p className="text-[12px] text-white/80 leading-snug flex-1 relative z-10 font-medium">
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/25 hover:text-white/60 transition-colors shrink-0 p-0.5 relative z-10 mt-0.5"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
