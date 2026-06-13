"use client";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useFavorites } from "@/hooks/useFavorites";
import { useNotifications } from "@/hooks/useNotifications";
import { MediaGrid } from "@/components/media/MediaGrid";
import { Trash2, User, Heart, Bell, Download, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { Media } from "@/types/tmdb";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export default function ProfilePage() {
  const { history, clearHistory, removeFromHistory } = useWatchHistory();
  const { watchlist, toggleWatchlist } = useWatchlist();
  const { favorites, toggleFavorite } = useFavorites();
  const { notifications, toggleNotification } = useNotifications();
  const [isSupporter, setIsSupporter] = useState(false);

  useEffect(() => {
    try {
      const supportVal = localStorage.getItem('has_supported_zivox');
      if (supportVal === 'true') {
        setIsSupporter(true);
      } else if (supportVal) {
        const expiry = parseInt(supportVal, 10);
        if (!isNaN(expiry) && Date.now() < expiry) {
          setIsSupporter(true);
        }
      }
    } catch(e) {}
  }, []);

  const handleRemove = (id: string, type: 'history'|'watchlist'|'favorites'|'notifications') => {
    if (type === 'history') {
      removeFromHistory(id);
    } else if (type === 'watchlist') {
      const item = watchlist.find(i => i.id.toString() === id);
      if (item) toggleWatchlist({ id: item.id.toString(), type: item.type, title: item.title, poster: item.poster });
    } else if (type === 'favorites') {
      const item = favorites.find(i => i.id.toString() === id);
      if (item) toggleFavorite({ id: item.id.toString(), type: item.type, title: item.title, poster: item.poster });
    } else if (type === 'notifications') {
      const item = notifications.find(i => i.id.toString() === id);
      if (item) toggleNotification({ id: item.id.toString(), type: item.type, title: item.title, poster: item.poster });
    }
  };

  // Convert history items to Media format for MediaGrid
  const historyMedia = history.map((item) => ({
    ...item,
    media_type: item.type,
    poster_path: item.poster,
    contextType: 'history',
  })) as unknown as Media[];

  const watchlistMedia = watchlist.map((item) => ({
    ...item,
    media_type: item.type,
    poster_path: item.poster,
    contextType: 'watchlist',
  })) as unknown as Media[];

  const favoritesMedia = favorites.map((item) => ({
    ...item,
    media_type: item.type,
    poster_path: item.poster,
    contextType: 'favorites',
  })) as unknown as Media[];

  const notificationsMedia = notifications.map((item) => ({
    ...item,
    media_type: item.type,
    poster_path: item.poster,
    contextType: 'notifications',
  })) as unknown as Media[];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = localStorage.getItem('voidstream_app_state_v2');
    if (!data) return alert("No data found to export.");
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zivox_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object') {
           localStorage.setItem('voidstream_app_state_v2', JSON.stringify(json));
           alert("Data imported successfully! Reloading...");
           window.location.reload();
        }
      } catch(err) {
        alert("Invalid backup file. Please upload a valid Zivox backup JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12 py-32 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 pb-8 border-b border-zinc-800">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-900 flex items-center justify-center shadow-2xl shrink-0">
          <User size={40} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white mb-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            My Profile
            {isSupporter && (
              <span className="text-[10px] sm:text-xs bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2.5 py-1 rounded-full uppercase tracking-widest font-bold flex items-center gap-1.5 shadow-[0_0_15px_color-mix(in_srgb,var(--brand-500)_30%,transparent)]">
                <Heart size={12} className="fill-brand-400" /> Supporter
              </span>
            )}
          </h1>
          <p className="text-zinc-400 font-medium">
            Manage your watch history and saved list
          </p>
        </div>
        
        {/* Export/Import Actions */}
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-bold text-white shadow-xl"
          >
            <Download size={16} className="text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-bold text-white shadow-xl"
          >
            <Upload size={16} className="text-purple-400" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider">
            My Watchlist
          </h2>
          <span className="text-sm font-mono text-zinc-500">
            {watchlist.length} ITEMS
          </span>
        </div>
        {watchlist.length > 0 ? (
          <MediaGrid items={watchlistMedia} onRemove={handleRemove} />
        ) : (
          <div className="h-48 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
            <p>Your watchlist is empty.</p>
            <Link
              href="/"
              className="text-brand-500 hover:text-brand-400 mt-2 font-medium"
            >
              Discover movies
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider flex items-center gap-2">
            <Heart size={24} className="text-pink-500" /> My Favorites
          </h2>
          <span className="text-sm font-mono text-zinc-500">
            {favorites.length} ITEMS
          </span>
        </div>
        {favorites.length > 0 ? (
          <MediaGrid items={favoritesMedia} onRemove={handleRemove} />
        ) : (
          <div className="h-48 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
            <p>You haven&apos;t added any favorites yet.</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display uppercase tracking-wider">
              Watch History
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-zinc-500 hidden sm:block">
              {history.length} TITLES
            </span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-brand-500 transition-colors bg-void-900 px-3 py-1.5 rounded-lg border border-zinc-800"
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>
        </div>
        {history.length > 0 ? (
          <MediaGrid items={historyMedia} onRemove={handleRemove} />
        ) : (
          <div className="h-48 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
            <p>No watch history yet.</p>
          </div>
        )}
      </div>

      <div className="space-y-6 pt-12 border-t border-zinc-800/50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider flex items-center gap-2">
            <Bell size={24} className="text-brand-500" /> Upcoming Notifications
          </h2>
          <span className="text-sm font-mono text-zinc-500">
            {notifications.length} ITEMS
          </span>
        </div>
        {notifications.length > 0 ? (
          <MediaGrid items={notificationsMedia} onRemove={handleRemove} />
        ) : (
          <div className="h-48 rounded-xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
            <p>You haven&apos;t set any notifications yet.</p>
            <Link
              href="/schedule"
              className="text-brand-500 hover:text-brand-400 mt-2 font-medium"
            >
              Browse Schedule
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
