'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { Copy, Check, Send } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl?: string;
  subtitle?: string;
  children?: React.ReactNode; // For extra custom copy buttons
}

export function ShareModal({ isOpen, onClose, title, shareUrl, subtitle, children }: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    const urlToShare = shareUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Watch "${title}" on ZIVOX`,
          url: urlToShare,
        });
        onClose();
      } else {
        await handleCopy();
      }
    } catch (err) {
      if (!(err instanceof Error) || err.name !== 'AbortError') {
        console.error('Failed to share', err);
      }
    }
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center overflow-y-auto p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative bg-void-900/95 backdrop-blur-2xl border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-sm max-h-[calc(100dvh-1rem)] sm:max-h-[min(92dvh,760px)] overflow-y-auto no-scrollbar shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* purple gradient top */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-900/30 to-transparent pointer-events-none" />
            <div className="p-6 relative">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6 sm:hidden" />
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-base font-bold text-white">Share</h3>
                {subtitle && (
                  <span className="text-[10px] font-bold text-zinc-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {subtitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 mb-5 truncate">{title}</p>

              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-brand-500 hover:bg-brand-400 text-black rounded-2xl transition-all active:scale-[0.98] mb-3 shadow-lg shadow-brand-500/20"
              >
                <div className="w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                  <Send size={16} />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-black">Share with Friends</span>
                  <span className="text-[11px] text-black/60">Uses your phone or browser share sheet</span>
                </div>
              </button>

              {/* Complete Copy Link */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border rounded-2xl transition-all active:scale-[0.98] ${
                  copied 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${copied ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-white/70" />}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-bold">{copied ? 'Copied to Clipboard' : 'Copy Complete Link'}</span>
                  <span className={`text-[11px] ${copied ? 'text-emerald-500/70' : 'text-white/40'}`}>Includes autoplay and the selected server when available</span>
                </div>
              </button>

              {/* Extra children */}
              {children}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
