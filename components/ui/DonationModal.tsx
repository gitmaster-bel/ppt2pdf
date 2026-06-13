'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const WALLETS = [
  { id: 'usdt', label: 'USDT', network: 'Polygon', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdt.svg" width="20" height="20" alt="USDT" />, color: '#8247E5', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
  { id: 'usdc', label: 'USDC', network: 'Polygon', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg" width="20" height="20" alt="USDC" />, color: '#2775CA', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
  { id: 'eth',  label: 'ETH',  network: 'Ethereum',icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg" width="20" height="20" alt="ETH" />, color: '#627EEA', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
  { id: 'btc',  label: 'BTC',  network: 'Bitcoin', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/btc.svg" width="20" height="20" alt="BTC" />, color: '#F7931A', address: 'bc1q7rdc229skeumz0tfecmqnajhkw9s97ttrl0hgq' },
  { id: 'bnb',  label: 'BNB',  network: 'BNB Smart Chain', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/bnb.svg" width="20" height="20" alt="BNB" />, color: '#F3BA2F', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
];

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DonationModal({ isOpen, onClose, onSuccess }: DonationModalProps) {
  const [activeTab, setActiveTab] = useState(WALLETS[0].id);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [showVerification, setShowVerification] = useState(false);
  const [txid, setTxid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Listen to global verification results to update UI status
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      try {
        const verifyDataStr = localStorage.getItem('zivox_donation_verify');
        if (!verifyDataStr) {
          // If the key is deleted, it means verification failed!
          setIsSubmitting(false);
          setError('Verification failed. Please check the transaction hash and try again.');
          if ((window as any)._donationTimeoutId) {
            clearTimeout((window as any)._donationTimeoutId);
          }
          return;
        }

        const verifyData = JSON.parse(verifyDataStr);
        if (verifyData.status === 'verified') {
          if ((window as any)._donationTimeoutId) {
            clearTimeout((window as any)._donationTimeoutId);
          }
          setIsSubmitting(false);
          if (onSuccess) onSuccess();
          else onClose();
        } else if (verifyData.status === 'pending' || verifyData.status === 'verifying') {
          setIsSubmitting(true);
        }
      } catch (e) {
        setIsSubmitting(false);
      }
    };

    window.addEventListener('zivox_donation_update', handleUpdate);
    return () => window.removeEventListener('zivox_donation_update', handleUpdate);
  }, [isOpen, onSuccess, onClose]);

  const activeWallet = WALLETS.find(w => w.id === activeTab)!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txid.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    // Save to localStorage
    const verifyData = {
      txid: txid.trim(),
      coin: activeTab,
      status: 'pending',
      timestamp: Date.now()
    };
    localStorage.setItem('zivox_donation_verify', JSON.stringify(verifyData));

    // Trigger global verification immediately
    window.dispatchEvent(new Event('zivox_donation_update'));
    
    // If it takes longer than 10 seconds, fallback to granting temporary access so the user isn't stuck
    const timeoutId = setTimeout(() => {
      try {
        const currentData = localStorage.getItem('zivox_donation_verify');
        if (currentData) {
          const data = JSON.parse(currentData);
          if (data.status !== 'verified') {
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
            localStorage.setItem('has_supported_zivox', expiry.toString());
            setIsSubmitting(false);
            if (onSuccess) onSuccess();
            else onClose();
          }
        }
      } catch (err) {
        setIsSubmitting(false);
      }
    }, 10000);

    (window as any)._donationTimeoutId = timeoutId;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-[rgba(10,8,12,0.92)] border border-[rgba(255,165,80,0.15)] rounded-2xl w-full max-w-[380px] max-h-[90vh] overflow-y-auto no-scrollbar backdrop-blur-2xl p-6 flex flex-col shadow-2xl"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 20px 40px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 
                className="text-xl font-bold font-display tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.65) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Back ZIVOX
              </h2>
              <button 
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-white/40 text-xs mb-6">
              100% of your contribution goes directly to server and infrastructure costs.
            </p>

            {/* Coin Tabs */}
            <div className="flex flex-wrap justify-center items-center gap-2 pb-2 mb-4">
              {WALLETS.map(wallet => {
                const isActive = activeTab === wallet.id;
                return (
                  <button
                    key={wallet.id}
                    onClick={() => setActiveTab(wallet.id)}
                    className="relative px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shrink-0"
                    style={isActive ? { 
                      backgroundColor: wallet.color, 
                      color: '#ffffff',
                      boxShadow: `0 4px 12px ${wallet.color}40`
                    } : {}}
                  >
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/5 rounded-full transition-colors hover:bg-white/10" />
                    )}
                    <span className="relative z-10">{wallet.icon}</span>
                    <span className={`relative z-10 ${!isActive ? 'text-white/50' : ''}`}>
                      {wallet.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeCoin"
                        className="absolute inset-0 border border-white/20 rounded-full"
                        transition={{ ease: "easeOut", duration: 0.3 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* QR Code and Details Row staggered */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: 'easeOut', duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white p-3 rounded-xl mb-4 shadow-lg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <QRCodeSVG 
                      value={activeWallet.address} 
                      size={160} 
                      level="H"
                      fgColor={activeWallet.color}
                      className="rounded"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeWallet.color }} />
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                  {activeWallet.network} Network
                </span>
              </div>

              <div className="text-[10px] text-white/25 text-center mb-5">
                🇮🇳 USDT/USDC → India & Global | 🇺🇸🇬🇧 USDC/ETH/BTC → USA & UK
              </div>

              {/* Wallet Address Row */}
              <div className="w-full bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3 border border-white/5">
                <div className="text-xs text-white/50 font-mono truncate flex-1 select-all">
                  {activeWallet.address}
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  style={{ color: activeWallet.color }}
                  title="Copy Address"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Verification Flow */}
            <motion.div layout className="mt-4 flex flex-col gap-2">
              <AnimatePresence mode="wait">
                {!showVerification ? (
                  <motion.button
                    key="btn-init"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => setShowVerification(true)}
                    className="w-full py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-1.5 border"
                    style={{
                      background: `linear-gradient(to right, ${activeWallet.color}15, ${activeWallet.color}25)`,
                      borderColor: `${activeWallet.color}30`,
                      color: activeWallet.color
                    }}
                  >
                    I have completed my contribution
                  </motion.button>
                ) : (
                  <motion.form
                    key="form-verify"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleVerifySubmit}
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Paste Transaction Hash (TxID)"
                      value={txid}
                      onChange={(e) => setTxid(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    {error && (
                      <p className="text-[10px] text-red-400 font-bold text-center mt-1">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-400 text-black disabled:opacity-50"
                    >
                      {isSubmitting ? 'Verifying...' : 'Submit TxID & Verify'}
                    </button>
                    <p className="text-[9px] text-white/40 text-center mt-2 leading-relaxed">
                      We check transactions via blockchain RPCs to unlock 1 month of premium. <br/>
                      <span className="text-brand-500 font-bold">Already supported us on another device within the last 30 days?</span> Paste that TxID here to sync your premium access!
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Copy Toast */}
            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl flex items-center gap-2"
                >
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white tracking-wide">Address copied!</span>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
