'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Share2, Wallet, Check, X } from 'lucide-react';
import { getSiteUrl } from '@/lib/utils';
import { DonationModal } from '@/components/ui/DonationModal';
import { grantSupportAccess, MONTH_ACCESS_MS, SHARE_ACCESS_MS } from '@/lib/support-access';

interface SupportPopupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  title?: string;
  mediaType: 'movie' | 'tv';
}

export function SupportPopupModal({ isOpen, onComplete, onClose, title, mediaType }: SupportPopupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const siteUrl = getSiteUrl();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: `Watch ${title || 'this'} for free on ZIVOX`,
      text: `I'm watching ${title || 'this'} on ZIVOX, the best free HD streaming platform!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        startCountdown('share');
        setShareFeedback({ type: 'success', message: 'Success! You unlocked 8 Hours of Premium.' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setHasShared(true);
        startCountdown('share');
        setShareFeedback({ type: 'success', message: 'Link copied! Thanks for sharing.' });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        setShareFeedback({ type: 'error', message: 'Something went wrong. Please try again.' });
      } else {
        // AbortError
        setShareFeedback({ type: 'error', message: 'Sharing cancelled. Please complete the share to unlock premium!' });
      }
    }
  };

  const [countdown, setCountdown] = useState<number | null>(null);

  const startCountdown = (type: 'share' | 'donate') => {
    if (countdown === null) {
      setCountdown(7);
      grantSupportAccess(type === 'share' ? SHARE_ACCESS_MS : MONTH_ACCESS_MS);
    }
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0) {
      onComplete();
    }
  }, [countdown, onComplete]);

  const handleDonate = () => {
    setShowDonationModal(true);
    // Don't grant premium here! Let DonationModal handle it when they actually submit a TxID.
  };

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="overlay" className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-3 sm:p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[min(28rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(90dvh,720px)] overflow-y-auto no-scrollbar bg-[rgba(10,8,12,0.95)] border border-[rgba(255,255,255,0.08)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center text-center shadow-2xl z-10"
            >
              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5 z-20 cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              )}
          {/* Ambient Background glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6 relative z-10">
            <Heart size={32} className="text-brand-500 fill-brand-500/20" />
            <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          <h2 className="text-2xl font-bold font-display text-white mb-3 relative z-10">
            Enjoying the {mediaType === 'movie' ? 'movie' : 'show'}?
          </h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed relative z-10">
            Share if you want to have a clean 8-hour no-interruption experience, and donate for a 1-year interruption-free experience.
          </p>
          
          <p className="text-[10px] text-zinc-500 mb-6 relative z-10 italic">
            Note: Premium access is per-device. If you already supported us on another device within the past month, click "Back Our Project" and paste your Transaction ID to sync your premium access here.
          </p>

          <div className="flex flex-col w-full gap-3 relative z-10">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all bg-premium-gradient hover:bg-premium-gradient-dark text-white shadow-[0_0_20px_color-mix(in srgb,var(--brand-500)_30%,transparent)] active:scale-95"
            >
              {hasShared ? (
                <>
                  <Check size={18} /> Shared! Thank you
                </>
              ) : (
                <>
                  <Share2 size={18} /> Share ZIVOX to Continue
                </>
              )}
            </button>
            
            <AnimatePresence>
              {shareFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-[10px] font-bold text-center ${shareFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {shareFeedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleDonate}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 active:scale-95"
            >
              <Wallet size={18} /> Back Our Project
            </button>
          </div>

          {/* 7-Second Progress Bar */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="w-full relative z-10 overflow-hidden"
              >
                <div className="flex justify-between items-center text-xs text-brand-400 font-bold mb-2">
                  <span>Thank you! Resuming in...</span>
                  <span>{countdown}s</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 7, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      )}
      </AnimatePresence>

      <DonationModal 
        isOpen={showDonationModal} 
        onClose={() => setShowDonationModal(false)}
        onSuccess={() => {
          setShowDonationModal(false);
          onComplete();
        }}
      />
    </>
  );
}
