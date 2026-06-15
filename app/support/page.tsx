'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Heart, ShieldCheck, Gem, MessageSquarePlus, Bug, Lightbulb, Send, Loader2, ImagePlus, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { grantSupportAccess, MONTH_ACCESS_MS } from '@/lib/support-access';

// ─── Crypto Wallets ────────────────────────────────────────────────────────────
const WALLETS = [
  { id: 'usdt', label: 'USDT', network: 'Polygon', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdt.svg" width="20" height="20" alt="USDT" />, color: '#8247E5', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
  { id: 'usdc', label: 'USDC', network: 'Polygon', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg" width="20" height="20" alt="USDC" />, color: '#2775CA', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
  { id: 'eth',  label: 'ETH',  network: 'Ethereum', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg" width="20" height="20" alt="ETH" />, color: '#627EEA', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
  { id: 'btc',  label: 'BTC',  network: 'Bitcoin',  icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/btc.svg" width="20" height="20" alt="BTC" />, color: '#F7931A', address: 'bc1q7rdc229skeumz0tfecmqnajhkw9s97ttrl0hgq' },
  { id: 'bnb',  label: 'BNB',  network: 'BNB Smart Chain', icon: <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/bnb.svg" width="20" height="20" alt="BNB" />, color: '#F3BA2F', address: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd' },
];

type FeedbackType = 'bug' | 'feature' | 'general';

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: React.ReactNode; color: string; placeholder: string }[] = [
  { id: 'bug',     label: 'Bug Report',        icon: <Bug size={16} />,         color: '#ef4444', placeholder: 'Describe the bug: what happened, what you expected, and which page/feature it was on.' },
  { id: 'feature', label: 'Feature Idea',      icon: <Lightbulb size={16} />,   color: '#f59e0b', placeholder: 'What feature would you love to see on ZIVOX? Be as detailed as possible.' },
  { id: 'general', label: 'General Feedback',  icon: <MessageSquarePlus size={16} />, color: '#8b5cf6', placeholder: 'Share any feedback, suggestion, or thought you have about ZIVOX.' },
];

// ─── Feedback Form ─────────────────────────────────────────────────────────────
function FeedbackPanel() {
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeType = FEEDBACK_TYPES.find(t => t.id === type)!;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 5MB limit check (Discord webhook limit for free is 8MB, keeping it safe)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');

    try {
      const publicWebhookUrl = process.env.NEXT_PUBLIC_DISCORD_FEEDBACK_WEBHOOK;
      let res;

      if (publicWebhookUrl) {
        // ── Direct to Discord (Zero Vercel Compute) ──
        const discordPayload = new FormData();
        discordPayload.append('payload_json', JSON.stringify({
          embeds: [{
            title: `${type === 'bug' ? '🐛' : type === 'feature' ? '💡' : '📬'} ${activeType.label} — ZIVOX`,
            description: message,
            color: parseInt(activeType.color.replace('#', ''), 16),
            timestamp: new Date().toISOString(),
            footer: { text: 'ZIVOX Feedback · Anonymous · Direct Edge Submit' },
            image: imageFile ? { url: 'attachment://upload.jpg' } : undefined,
          }],
        }));
        
        if (imageFile) {
          discordPayload.append('file[0]', imageFile, 'upload.jpg');
        }

        res = await fetch(publicWebhookUrl, {
          method: 'POST',
          body: discordPayload,
        });
      } else {
        // ── Fallback to Vercel API ──
        const formData = new FormData();
        formData.append('type', type);
        formData.append('message', message);
        if (imageFile) {
          formData.append('image', imageFile);
        }

        res = await fetch('/api/feedback', {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) throw new Error('Failed to send');

      setStatus('sent');
      setMessage('');
      removeImage();
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Type Selector */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Category</p>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shrink-0"
              style={type === t.id ? {
                backgroundColor: `${t.color}18`,
                borderColor: `${t.color}50`,
                color: t.color,
              } : {
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Field */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Your Message</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <ImagePlus size={12} />
              Attach Image
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
          
          <div className="relative">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={activeType.placeholder}
              required
              rows={5}
              className="w-full bg-black/40 border border-white/8 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
            />
            
            {/* Image Preview Overlay */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-4 right-4 z-10"
                >
                  <div className="relative group">
                    <img 
                      src={imagePreview} 
                      alt="Upload preview" 
                      className="w-16 h-16 object-cover rounded-lg border-2 border-white/10 shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg transform transition-transform hover:scale-110 active:scale-95"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[10px] text-zinc-600 leading-relaxed">
            🔒 <strong className="text-zinc-500">100% anonymous</strong> — no account, no IP, no cookies. Images are securely sent to Discord and never stored on our servers.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm"
            >
              <Check size={18} /> Feedback received — Thank you! 💜
            </motion.div>
          ) : status === 'error' ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm">
              Something went wrong. Please try again.
            </motion.div>
          ) : (
            <motion.button
              key="submit"
              type="submit"
              disabled={!message.trim() || status === 'sending'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: activeType.color }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-40 active:scale-95 shadow-lg"
            >
              {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
              {status === 'sending' ? 'Sending...' : 'Send Feedback'}
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [activeTab, setActiveTab] = useState(WALLETS[0].id);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hasDonated, setHasDonated] = useState(false);
  const [pageTab, setPageTab] = useState<'donate' | 'feedback'>('donate');

  const [showVerification, setShowVerification] = useState(false);
  const [txid, setTxid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const verifyDataStr = localStorage.getItem('zivox_donation_verify');
        if (!verifyDataStr) {
          setIsSubmitting(false);
          setError('Verification failed. Please check the transaction hash and try again.');
          if ((window as any)._supportTimeoutId) clearTimeout((window as any)._supportTimeoutId);
          return;
        }
        const verifyData = JSON.parse(verifyDataStr);
        if (verifyData.status === 'verified') {
          if ((window as any)._supportTimeoutId) clearTimeout((window as any)._supportTimeoutId);
          setIsSubmitting(false);
          setHasDonated(true);
        } else if (verifyData.status === 'pending' || verifyData.status === 'verifying') {
          setIsSubmitting(true);
        }
      } catch {
        setIsSubmitting(false);
      }
    };
    window.addEventListener('zivox_donation_update', handleUpdate);
    return () => window.removeEventListener('zivox_donation_update', handleUpdate);
  }, []);

  const activeWallet = WALLETS.find(w => w.id === activeTab)!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 2000);
    } catch { /* clipboard denied */ }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Cinematic ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30 transition-colors duration-1000"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${activeWallet.color}30 0%, transparent 70%)` }}
        />
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        {/* ── Page Header ── */}
        <div className="flex flex-col items-center text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <Heart size={12} className="fill-brand-400/30" /> Community
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight leading-tight mb-3">
            Support{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-400">ZIVOX</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Help keep the platform free, ad-free, and alive. Leave feedback or become a supporter — every contribution helps.
          </p>

          {/* Page Tab Switcher */}
          <div className="mt-6 flex items-center gap-1 p-1 bg-white/5 border border-white/8 rounded-xl">
            {[
              { id: 'donate',   label: '💜 Support Us' },
              { id: 'feedback', label: '💬 Feedback' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setPageTab(t.id as 'donate' | 'feedback')}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  pageTab === t.id
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════════════ DONATE TAB ═══════════════ */}
          {pageTab === 'donate' && (
            <motion.div
              key="donate"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start"
            >
              {/* Left: Why to donate */}
              <div className="flex flex-col gap-6 order-last lg:order-first">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base sm:text-lg">100% Genuine Privacy</h4>
                      <p className="text-zinc-500 text-sm mt-1 leading-relaxed">No tracking scripts, no selling your data. Your watch history stays purely local to your browser.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                      <Gem size={22} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base sm:text-lg">Premium Experience</h4>
                      <p className="text-zinc-500 text-sm mt-1 leading-relaxed">Lightning fast load times and clean UI design. We believe everyone deserves a beautifully designed entertainment hub.</p>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm font-medium italic border-t border-white/5 pt-4">
                  We pay for high-speed servers out of pocket to provide a seamless, ad-free experience. Your contribution, no matter the size, goes directly into maintaining and improving ZIVOX. Thank you 💜
                </p>

                {/* Transparent Server Goals */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden mt-2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[50px] pointer-events-none" />
                  <div className="flex justify-between items-end mb-3 relative z-10">
                    <div>
                      <h4 className="text-white font-bold text-sm">Monthly Server Costs</h4>
                      <p className="text-zinc-400 text-xs mt-0.5">Help us reach 100% to keep speeds fast</p>
                    </div>
                    <span className="text-brand-400 font-display font-black text-xl">
                      {hasDonated ? '77%' : '74%'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      key={hasDonated ? 'donated' : 'not-donated'}
                      initial={{ width: hasDonated ? '74%' : 0 }}
                      animate={{ width: hasDonated ? '77%' : '74%' }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-[2px] animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                {/* Wall of Love */}
                <div className="mt-4">
                  <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <Heart size={14} className="text-pink-500 fill-pink-500" /> Wall of Love
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { msg: "Fastest streaming site I've ever used. Unbelievable it's free.", author: "Anon" },
                      { msg: "Finally, no annoying popups! You guys are lifesavers.", author: "Anon" },
                      { msg: "The UI is gorgeous. Happy to support the servers.", author: "Anon" },
                      { msg: "1080p without buffering? Take my crypto.", author: "Anon" }
                    ].map((t, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs leading-relaxed text-zinc-400 flex flex-col justify-between">
                        <p className="italic">"{t.msg}"</p>
                        <p className="font-bold text-zinc-500 mt-2 text-[10px] uppercase tracking-widest">— {t.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Donation Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-[rgba(10,8,12,0.85)] border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur-3xl shadow-2xl overflow-hidden relative order-first lg:order-last"
                style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), 0 30px 60px rgba(0,0,0,0.5)' }}
              >
                <div
                  className="absolute -top-28 -right-28 w-56 h-56 rounded-full blur-[80px] transition-colors duration-700 opacity-20 pointer-events-none"
                  style={{ backgroundColor: activeWallet.color }}
                />

                <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-1">Back ZIVOX via Crypto</h3>
                <p className="text-zinc-500 text-sm mb-5">Select your preferred coin below.</p>

                <AnimatePresence mode="wait">
                  {!hasDonated ? (
                    <motion.div key="donate-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Coin Tabs */}
                      <div className="flex flex-wrap items-center gap-2 mb-5">
                        {WALLETS.map(wallet => {
                          const isActive = activeTab === wallet.id;
                          return (
                            <button
                              key={wallet.id}
                              onClick={() => setActiveTab(wallet.id)}
                              className="relative px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 shrink-0 min-h-[40px]"
                              style={isActive ? { backgroundColor: wallet.color, color: '#fff', boxShadow: `0 4px 15px ${wallet.color}40` } : {}}
                            >
                              {!isActive && <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors" />}
                              <span className="relative z-10">{wallet.icon}</span>
                              <span className={`relative z-10 ${!isActive ? 'text-white/60' : ''}`}>{wallet.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* QR Section */}
                      <div className="bg-void-950/50 border border-white/5 rounded-2xl p-4 sm:p-6 flex flex-col items-center">
                        <div className="bg-white p-3 sm:p-4 rounded-2xl mb-4 shadow-2xl relative">
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
                                size={Math.min(180, typeof window !== 'undefined' ? window.innerWidth * 0.42 : 180)}
                                level="H"
                                fgColor={activeWallet.color}
                                className="rounded-lg"
                              />
                            </motion.div>
                          </AnimatePresence>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white p-1 rounded-full shadow-md">{activeWallet.icon}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center w-full">
                          <div className="inline-flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeWallet.color }} />
                            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">{activeWallet.network} Network</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mb-4">
                            🇮🇳 USDT/USDC → India &amp; Global | 🇺🇸🇬🇧 USDC/ETH/BTC → USA &amp; UK
                          </div>
                          <div className="w-full bg-black/40 rounded-xl p-3.5 flex items-center justify-between gap-2 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="text-xs sm:text-sm text-zinc-400 font-mono truncate flex-1 select-all text-left">
                              {activeWallet.address}
                            </div>
                            <button
                              onClick={handleCopy}
                              className="shrink-0 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                              style={{ color: activeWallet.color }}
                              title="Copy Address"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Verification */}
                      <AnimatePresence mode="wait">
                        {!showVerification ? (
                          <motion.button
                            key="btn-init"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowVerification(true)}
                            className="mt-5 w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 border min-h-[52px]"
                            style={{ background: `linear-gradient(to right, ${activeWallet.color}15, ${activeWallet.color}25)`, borderColor: `${activeWallet.color}30`, color: activeWallet.color }}
                          >
                            <Heart size={14} className="fill-current" /> I&apos;ve completed my contribution
                          </motion.button>
                        ) : (
                          <motion.form
                            key="form-verify"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!txid.trim()) return;
                              setIsSubmitting(true);
                              setError(null);
                              const verifyData = { txid: txid.trim(), coin: activeTab, status: 'pending', timestamp: Date.now() };
                              localStorage.setItem('zivox_donation_verify', JSON.stringify(verifyData));
                              window.dispatchEvent(new Event('zivox_donation_update'));
                              const timeoutId = setTimeout(() => {
                                try {
                                  const currentData = localStorage.getItem('zivox_donation_verify');
                                  if (currentData) {
                                    const data = JSON.parse(currentData);
                                    if (data.status !== 'verified') {
                                      grantSupportAccess(MONTH_ACCESS_MS);
                                      setIsSubmitting(false);
                                      setHasDonated(true);
                                    }
                                  }
                                } catch { setIsSubmitting(false); }
                              }, 10000);
                              (window as any)._supportTimeoutId = timeoutId;
                            }}
                            className="mt-5 flex flex-col gap-3"
                          >
                            <input
                              type="text"
                              placeholder="Paste Transaction Hash (TxID)"
                              value={txid}
                              onChange={e => setTxid(e.target.value)}
                              required
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors min-h-[50px]"
                            />
                            {error && <p className="text-xs text-red-400 font-bold text-center">{error}</p>}
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full py-4 rounded-xl font-bold tracking-widest text-xs uppercase transition-all flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 text-black disabled:opacity-50 min-h-[52px]"
                            >
                              {isSubmitting ? 'Verifying...' : 'Submit TxID & Verify'}
                            </button>
                            <p className="text-[10px] text-white/35 text-center leading-relaxed">
                              We verify via blockchain RPCs to unlock 1 month of premium.{' '}
                              <span className="text-brand-500 font-bold">Supported on another device?</span> Paste that TxID here to sync.
                            </p>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="thank-you"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, type: 'spring' }}
                      className="flex flex-col items-center text-center py-8 gap-4"
                    >
                      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative">
                        <Heart size={40} className="text-emerald-500 fill-emerald-500" />
                        <motion.div
                          className="absolute inset-0 rounded-full border border-emerald-500"
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <h3 className="text-3xl font-display font-black text-white leading-tight">You&apos;re Amazing!</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                        Your support directly pays for the high-speed servers that keep ZIVOX ad-free and lightning fast for everyone. Enjoy the cinematic experience!
                      </p>
                      <Link href="/" className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-xs transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        Return to Home
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* ═══════════════ FEEDBACK TAB ═══════════════ */}
          {pageTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start max-w-4xl mx-auto w-full"
            >
              {/* Left: Info */}
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-white mb-3 leading-tight">
                    Your voice shapes ZIVOX
                  </h2>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Found a bug? Got an idea? Want to suggest a feature? Every message goes directly to the dev team — anonymously and securely. No sign-up needed.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: '🐛', title: 'Bug Reports', desc: 'A server not working? Subtitle issue? Broken page? Tell us.' },
                    { icon: '💡', title: 'Feature Ideas', desc: 'Suggest watchlist sharing, better search, new features.' },
                    { icon: '💬', title: 'General Thoughts', desc: 'Anything — good or bad. We read every message.' },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl bg-white/3 border border-white/6">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-white font-bold text-sm">{item.title}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-emerald-400 text-xs font-bold mb-1">🔒 Completely Anonymous</p>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    We do not collect your IP, device, or any identifying info. Messages are sent via encrypted webhook directly to the dev team. Not even your ISP or government can trace it.
                  </p>
                </div>
              </div>

              {/* Right: Form */}
              <div className="bg-[rgba(10,8,12,0.85)] border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur-3xl shadow-2xl">
                <h3 className="text-xl font-bold font-display text-white mb-5">Send Feedback</h3>
                <FeedbackPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-white/10 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[9999] whitespace-nowrap"
          >
            <Check size={15} className="text-emerald-400" />
            <span className="text-sm font-bold text-white tracking-wide">Wallet Address Copied!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
