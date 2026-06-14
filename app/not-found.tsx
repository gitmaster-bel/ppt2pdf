import Link from 'next/link';
import { Home, Film, Tv, Sparkles, Search, Compass } from 'lucide-react';

export const metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/tv', label: 'TV Shows', icon: Tv },
  { href: '/anime', label: 'Anime', icon: Sparkles },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/search', label: 'Search', icon: Search },
];

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-6 text-center px-4 pt-20">
      <div className="text-8xl font-display font-black bg-gradient-to-b from-brand-500 to-brand-500/20 bg-clip-text text-transparent">
        404
      </div>
      <h1 className="text-xl font-bold text-white font-display">Page Not Found</h1>
      <p className="text-zinc-400 text-sm max-w-md">
        The page you're looking for doesn't exist or has been moved. Try one of these instead:
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {quickLinks.map((link) => (
          <Link 
            key={link.href}
            href={link.href} 
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all rounded-full text-sm font-semibold text-zinc-300 hover:text-white active:scale-95"
          >
            <link.icon size={14} className="text-brand-500" />
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
