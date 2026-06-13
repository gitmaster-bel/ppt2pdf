'use client';
import Link from 'next/link';
import { Github, Twitter, Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Movies', href: '/movies' },
  { label: 'TV Shows', href: '/tv' },
  { label: 'Anime', href: '/anime' },
  { label: 'Discover', href: '/discover' },
  { label: 'Search', href: '/search' },
  { label: 'Support Us', href: '/support' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Profile', href: '/profile' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'DMCA', href: '/dmca' },
  { label: 'Contact', href: 'mailto:zivox.tv@proton.me' },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/watch')) return null;

  return (
    <footer
      className="relative z-20 mt-auto overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, transparent, rgba(5,5,5,0.97) 20%, #050505)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Crimson glow line at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--brand-500) 50%, transparent), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-14 pt-12 pb-28 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Logo size="lg" />
            <p className="text-sm text-white/35 leading-relaxed max-w-xs">
              Premium cinematic streaming experience. Discover, watch, and enjoy
              thousands of movies and TV shows — all in one place.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://discord.gg/9bYvTbQ6n"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(88,101,242,0.15)',
                  border: '1px solid rgba(88,101,242,0.25)',
                }}
              >
                <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-white/30 mb-4">
              Navigate
            </h3>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`text-sm transition-all duration-300 flex items-center gap-2 w-fit group ${
                      label === 'Support Us' 
                        ? 'text-white/80 hover:text-white font-bold hover:drop-shadow-[0_0_10px_var(--brand-500)]' 
                        : 'text-white/45 hover:text-white/90'
                    }`}
                  >
                    {label === 'Support Us' && <Heart size={12} className="fill-brand-500 text-brand-500 group-hover:scale-125 transition-transform duration-300" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-white/30 mb-4">
              Contact Us
            </h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:zivox.tv@proton.me" className="text-sm font-medium text-white hover:text-brand-400 transition-colors">
                zivox.tv@proton.me
              </a>
              <p className="text-xs text-white/40">
                For business inquiries, DMCA notices, or support.
              </p>
            </div>

            {/* Legal links */}
            <div className="flex flex-col gap-2 mt-6">
              {LEGAL_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm text-white/45 hover:text-white/90 transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="pt-8 pb-6 border-t border-white/5 mt-4">
          <p className="text-sm text-zinc-400 text-center max-w-4xl mx-auto leading-relaxed bg-zinc-900/40 p-4 md:p-5 rounded-2xl border border-zinc-800/50 shadow-inner">
            <strong className="text-zinc-200">Disclaimer:</strong> ZIVOX is an intermediary search engine that indexes publicly available links. We do not host, store, or distribute any video content. All media is hosted by non-affiliated third parties.
          </p>
        </div>



        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-white/5"
        >
          <p className="text-[11px] font-mono text-white/20 tracking-wider">
            © {new Date().getFullYear()} ZIVOX. For educational purposes only.
          </p>
          <p className="text-[11px] font-mono text-white/15 tracking-wider">
            This product uses the TMDB API but is not endorsed by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
