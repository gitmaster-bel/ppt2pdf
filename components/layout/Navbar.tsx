'use client';
import Link from 'next/link';
import { Search, User, Home, Film, Tv, Compass, Sparkles, CalendarDays, Dices, ArrowLeft, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { useRef } from 'react';
import { DonationButton } from '@/components/ui/DonationButton';
import { Logo } from '@/components/ui/Logo';
import { AISearchModal } from '@/components/ui/AISearchModal';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Shows' },
  { href: '/anime', label: 'Anime' },
  { href: '/schedule', label: 'Schedule' },
];

const BROWSE_ITEMS = [
  { href: '/discover', label: 'Discover' },
  { href: '/collections', label: 'Collections' },
  { href: '/blog', label: 'Blog' },
  { href: '/providers', label: 'Providers' },
  { href: '/guide', label: 'Guide' },
];

const MOBILE_DOCK_ITEMS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/movies', label: 'Movies', Icon: Film },
  { href: '/tv', label: 'TV Shows', Icon: Tv },
  { href: '/anime', label: 'Anime', Icon: Sparkles },
  { href: '/discover', label: 'Discover', Icon: Compass },
  { href: '/schedule', label: 'Schedule', Icon: CalendarDays },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  useAutoLocation();
  const [randomMoviePreview, setRandomMoviePreview] = useState<any>(null);
  const [isHoveringRandom, setIsHoveringRandom] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const browseRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleRandomHover = async () => {
    setIsHoveringRandom(true);
    if (!randomMoviePreview) {
      try {
        const res = await fetch('/api/random?json=true');
        if (res.ok) {
          const data = await res.json();
          setRandomMoviePreview(data);
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    const handleOpenAI = () => setIsAISearchOpen(true);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('open-ai-search', handleOpenAI);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-ai-search', handleOpenAI);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (browseRef.current && !browseRef.current.contains(event.target as Node)) {
        setIsBrowseOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsBrowseOpen(false);
  }, [pathname]);

  const clearIframes = () => {
    document.querySelectorAll('iframe').forEach(i => (i.src = ''));
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href !== pathname && !href.startsWith('http')) {
      e.preventDefault();
      clearIframes();
      // Instantly trigger the loader
      window.dispatchEvent(new CustomEvent('trigger-loader', { detail: href }));
      // Delay navigation by 50ms so the loader mounts before React starts blocking the main thread
      setTimeout(() => {
        router.push(href);
      }, 50);
    } else {
      clearIframes();
    }
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  if (pathname?.startsWith('/watch')) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center md:justify-start px-4 py-4 md:px-6 pointer-events-none">
        <div className="flex items-center gap-4 bg-void-950/60 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 pointer-events-auto shadow-2xl transition-all duration-300 hover:bg-void-950/80 hover:border-white/20">
           <Logo size="sm" onClick={clearIframes} />
           <div className="w-[1px] h-5 bg-white/15 hidden sm:block" />
           <Link href="/" onClick={(e) => handleNavigation(e, '/')} className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 font-bold text-xs uppercase tracking-widest">
             <Home size={15} strokeWidth={2.5} /> 
             <span>Home</span>
           </Link>
           <div className="w-[1px] h-5 bg-white/15 hidden sm:block" />
           <Link href="/search" onClick={(e) => handleNavigation(e, '/search')} className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"><Search size={16} strokeWidth={2.5} /></Link>
           <Link href="/profile" onClick={(e) => handleNavigation(e, '/profile')} className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"><User size={16} strokeWidth={2.5} /></Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* ── MOBILE TOP NAV ── */}
      <nav className={`md:hidden fixed top-0 left-0 right-0 z-[200] px-4 h-[52px] flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-[#050505]/70 backdrop-blur-[20px] saturate-[1.6]' : 'bg-transparent'}`}>
        <Logo size="md" onClick={(e) => handleNavigation(e, '/')} />
        <div className="flex items-center gap-4 z-10">
          <button onClick={() => setIsAISearchOpen(true)} className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 active:scale-95">
            <Sparkles size={20} strokeWidth={2.5} className="text-brand-400" />
          </button>
          <Link href="/search" onClick={clearIframes} className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 active:scale-95"><Search size={20} strokeWidth={2.5} /></Link>
          <DonationButton />
          <button onClick={() => setIsSettingsOpen(true)} className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 active:scale-95"><Settings size={20} strokeWidth={2.5} /></button>
          <Link href="/profile" onClick={clearIframes} className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 active:scale-95"><User size={20} strokeWidth={2.5} /></Link>
        </div>
      </nav>

      {/* ── DESKTOP FLOATING PILL NAV ── */}
      <nav
        className={`hidden md:flex fixed z-[200] left-0 right-0 justify-center px-4 transition-all duration-500 pointer-events-none ${scrolled ? 'top-3' : 'top-6'}`}
      >
        <div
          className="group relative flex items-center px-5 py-2.5 gap-5 rounded-full transition-all duration-300 pointer-events-auto"
          style={{
            backgroundColor: 'rgba(10, 8, 12, 0.45)',
            backdropFilter: 'blur(20px) saturate(180%) contrast(120%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%) contrast(120%) brightness(1.1)',
            border: '1px solid rgba(255, 165, 80, 0.15)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(255, 165, 80, 0.1)',
          }}
        >
          {/* ── Inner Reflections ── */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none overflow-hidden opacity-50 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-70"
            style={{
              background: `
                linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 20%, transparent 50%, rgba(255,255,255,0.02) 80%, rgba(255,255,255,0.2) 100%),
                linear-gradient(to right, rgba(255,255,255,0.1) 0%, transparent 10%, transparent 90%, rgba(255,255,255,0.1) 100%)
              `
            }}
          />

          {/* ── ZIVOX Logo ── */}
          <Logo size="md" onClick={(e) => handleNavigation(e, '/')} />

          {/* Nav Links */}
          <div className="flex items-center gap-6 z-10 mx-2">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => handleNavigation(e, href)}
                  className={`relative text-[14px] font-medium tracking-wide transition-all duration-300 hover:-translate-y-[1px] ${
                    active
                      ? 'text-white font-semibold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                      : 'text-white/60 hover:text-white/95'
                  }`}
                >
                  {label}
                  {active && (
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(to right, var(--brand-500), transparent)' }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Browse Dropdown */}
            <div ref={browseRef} className="relative flex items-center h-full py-4 -my-4">
              <button 
                onClick={() => setIsBrowseOpen(!isBrowseOpen)}
                className={`flex items-center gap-1 text-[14px] font-medium tracking-wide transition-all duration-300 outline-none ${isBrowseOpen ? 'text-white/95' : 'text-white/60 hover:text-white/95'}`}
              >
                Browse
                <svg className={`w-4 h-4 opacity-70 transition-transform duration-300 ${isBrowseOpen ? 'rotate-180 opacity-100' : 'hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              <div 
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 rounded-xl overflow-hidden z-50 transition-all duration-300 transform origin-top ${isBrowseOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}
                style={{
                  backgroundColor: 'rgba(10, 8, 12, 0.85)',
                  backdropFilter: 'blur(30px) saturate(180%) contrast(120%) brightness(1.1)',
                  WebkitBackdropFilter: 'blur(30px) saturate(180%) contrast(120%) brightness(1.1)',
                  border: '1px solid rgba(255, 165, 80, 0.15)',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(255, 165, 80, 0.1)',
                }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay" style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 20%, transparent 50%, rgba(255,255,255,0.02) 80%, rgba(255,255,255,0.2) 100%)'
                }} />
                <div className="flex flex-col p-1.5 relative z-10">
                  {BROWSE_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        handleNavigation(e, item.href);
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      }}
                      className={`px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 flex items-center ${isActive(item.href) ? 'bg-white/10 text-white font-semibold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-white/60 hover:bg-white/5 hover:text-white/95'}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Separator */}
            <div className="w-[1px] h-5 bg-white/10 mx-2 hidden lg:block"></div>

            {/* AI Search Bar */}
            <button
              onClick={() => setIsAISearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-brand-500/10 hover:border-brand-500/30 transition-all duration-300 group shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_25px_color-mix(in_srgb,var(--brand-500)_20%,transparent)]"
            >
              <Sparkles size={13} strokeWidth={2.5} className="text-brand-400 shrink-0" />
              <span className="text-xs font-medium tracking-wide text-white/60 group-hover:text-white transition-colors">AI Search...</span>
            </button>
            {/* Normal search icon — still accessible */}
            <Link
              href="/search"
              onClick={clearIframes}
              title="Regular Search"
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all duration-200 active:scale-95"
            >
              <Search size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Action Icons (Right) */}
          <div className="flex items-center gap-4 z-10 ml-2">
            <div 
              className="relative group flex items-center"
              onMouseEnter={handleRandomHover}
              onMouseLeave={() => setIsHoveringRandom(false)}
            >
              <Link
                href={randomMoviePreview ? `/watch/movie/${randomMoviePreview.slug}` : "/api/random"}
                onClick={() => {
                  clearIframes();
                  setRandomMoviePreview(null);
                }}
                className="text-white/60 hover:text-brand-400 transition-all duration-300 hover:scale-110 active:scale-95 group relative"
                aria-label="Random Movie"
              >
                <Dices size={17} strokeWidth={2} className="group-hover:animate-spin" />
              </Link>
              
              <AnimatePresence>
                {isHoveringRandom && randomMoviePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-4 right-0 w-48 bg-void-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col pointer-events-none"
                  >
                    <div className="relative w-full aspect-[2/3] bg-void-950">
                       {randomMoviePreview.poster_path && (
                         <img src={`https://image.tmdb.org/t/p/w300${randomMoviePreview.poster_path}`} className="object-cover w-full h-full" alt="Poster" />
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                       <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col">
                         <span className="text-xs font-bold text-white leading-tight mb-1">{randomMoviePreview.title}</span>
                         <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider text-brand-400">Play Random</span>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <DonationButton />

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-white/60 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Settings"
            >
              <Settings size={17} strokeWidth={2} />
            </button>
            <Link
              href="/profile"
              onClick={clearIframes}
              className="text-white/60 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Profile"
            >
              <User size={17} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM DOCK ── */}
      <nav
        className="md:hidden fixed left-0 right-0 z-[100]"
        style={{
          bottom: '-20px', // Extend 20px below the viewport to guarantee no gaps
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)', // Push content back up
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(10px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(10px) saturate(1.8)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-center justify-around h-[64px]">
          {MOBILE_DOCK_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  if (href === '/') {
                     if (pathname === '/') {
                        e.preventDefault();
                        clearIframes();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                     } else {
                        handleNavigation(e, href);
                     }
                  } else {
                     handleNavigation(e, href);
                  }
                }}
                className={`relative flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200 ${
                  active ? 'text-brand-500' : 'text-white/35 hover:text-white/70'
                }`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-premium-gradient shadow-[0_0_8px_color-mix(in srgb, var(--brand-500) 80%, transparent)] rounded-b-sm" />
                )}
                <Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium tracking-[0.02em]">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AISearchModal isOpen={isAISearchOpen} onClose={() => setIsAISearchOpen(false)} />
    </>
  );
}
