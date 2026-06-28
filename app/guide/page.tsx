'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Settings, Server, Heart, Search, Bell, Sparkles, ChevronRight, CheckCircle2, Tv, LayoutGrid, CalendarDays, Shield, UserCircle, Globe, History, ShieldAlert, Subtitles, Volume2, Maximize, ListVideo, Zap } from 'lucide-react';
import Link from 'next/link';
import { MediaCard } from '@/components/media/MediaCard';

// Dummy data for realistic UI rendering
const dummyMovies = [
  { id: 872585, title: "Oppenheimer", media_type: "movie", release_date: "2023-07-19", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", vote_average: 8.5 },
  { id: 693134, title: "Dune: Part Two", media_type: "movie", release_date: "2024-02-27", poster_path: "/1pdfLvkbY9ohJlCjQH2JGqqO9n.jpg", vote_average: 8.8 },
  { id: 1011985, title: "Kung Fu Panda 4", media_type: "movie", release_date: "2024-03-02", poster_path: "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg", vote_average: 7.2 },
  { id: 823464, title: "Godzilla x Kong", media_type: "movie", release_date: "2024-03-27", poster_path: "/tMefBSflR6PGQLvLuPEHZotZA9E.jpg", vote_average: 7.6 },
];

const dummyAnime = [
  { id: 95479, name: "Jujutsu Kaisen", media_type: "tv", first_air_date: "2020-10-03", poster_path: "/hFWP5HkbVEe40hrptjvqcZYnYs.jpg", vote_average: 8.9 },
  { id: 86034, name: "Spy x Family", media_type: "tv", first_air_date: "2022-04-09", poster_path: "/3r4LYGFBDZulkIxWaljySqkVqk.jpg", vote_average: 8.5 },
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState(0);

  const steps = [
    {
      id: 'player',
      title: 'Cinematic Player Experience',
      icon: <Play className="w-5 h-5" />,
      description: 'Interact with our custom 4K Player UI built for zero interruptions.',
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Zivox bypasses standard iframe players to give you a clean, custom-built UI. You control the streaming server, the subtitles, and the picture-in-picture mode directly.
          </p>
          
          {/* Real-looking Video Player Mockup */}
          <div className="relative w-full aspect-video rounded-xl bg-black border border-white/10 overflow-hidden group shadow-2xl">
            {/* Fake Video Frame */}
            <div className="absolute inset-0 bg-[url('https://media.themoviedb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg')] bg-cover bg-center opacity-40 transition-opacity duration-1000 group-hover:opacity-80" />
            
            {/* Player Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-[-10px] group-hover:translate-y-0">
              <div className="flex flex-col drop-shadow-md">
                <span className="text-xs text-brand-400 font-bold uppercase tracking-widest">Watching Now</span>
                <h3 className="text-white font-display font-black text-lg md:text-2xl tracking-tight">Five Nights at Freddy's</h3>
              </div>
              <button className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg text-white hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Server 1 (VidSrc)</span>
              </button>
            </div>
            
            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100">
              <button className="w-16 h-16 md:w-20 md:h-20 bg-premium-gradient-dark rounded-full flex items-center justify-center pl-1 shadow-[0_0_30px_color-mix(in srgb, var(--brand-500) 50%, transparent)] hover:scale-110 active:scale-95 transition-all cursor-pointer">
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white" />
              </button>
            </div>
            
            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-[10px] group-hover:translate-y-0">
              {/* Progress Bar */}
              <div className="w-full h-1.5 md:h-2 bg-white/20 rounded-full relative cursor-pointer overflow-hidden group/bar">
                <div className="absolute top-0 left-0 bottom-0 w-[45%] bg-premium-gradient rounded-full shadow-[0_0_10px_color-mix(in srgb, var(--brand-500) 80%, transparent)]" />
                <div className="absolute top-0 left-0 bottom-0 w-[60%] bg-white/30 rounded-full" />
              </div>
              
              {/* Controls */}
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-4 md:gap-6">
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-white cursor-pointer hover:text-brand-400 transition-colors" />
                  <Volume2 className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-brand-400 transition-colors" />
                  <span className="text-xs md:text-sm font-mono tracking-wider opacity-80">45:21 / 1:49:00</span>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <ListVideo className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-brand-400 transition-colors hidden sm:block" />
                  <Subtitles className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-brand-400 transition-colors" />
                  <Settings className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-brand-400 transition-colors" />
                  <Maximize className="w-5 h-5 md:w-6 md:h-6 cursor-pointer hover:text-brand-400 transition-colors" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
             <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2">
               <Zap className="w-5 h-5 text-yellow-400" />
               <h5 className="font-bold text-sm text-white">Auto-Play TV</h5>
               <p className="text-xs text-zinc-500">Watching an anime or TV show? When it hits 95%, the next episode auto-loads instantly.</p>
             </div>
             <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2">
               <History className="w-5 h-5 text-emerald-400" />
               <h5 className="font-bold text-sm text-white">Smart Resume</h5>
               <p className="text-xs text-zinc-500">Close your browser. Come back tomorrow. It resumes the movie exactly at 45:21.</p>
             </div>
             <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2">
               <Server className="w-5 h-5 text-blue-400" />
               <h5 className="font-bold text-sm text-white">7+ Backup Links</h5>
               <p className="text-xs text-zinc-500">If a server buffers, click the server button to swap to VidSrc, Smashy, AutoEmbed, and more.</p>
             </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ui',
      title: 'Interactive Poster Cards',
      icon: <LayoutGrid className="w-5 h-5" />,
      description: 'Hover, Click, and Add to Watchlist seamlessly.',
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Every movie and show is represented by our custom <code>MediaCard</code>. On desktop, hover to see the Title, Year, and Play button. On mobile, tap to expand. You can instantly favorite items directly from the card.
          </p>
          
          <div className="p-6 rounded-2xl border border-white/5 bg-black/40 relative overflow-hidden flex flex-col gap-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-premium-gradient animate-pulse" />
              Try Hovering Below
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-2">
              {dummyMovies.map((movie: any) => (
                <div key={movie.id} className="transform transition-transform hover:scale-[1.03] duration-300">
                  <MediaCard media={movie} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      title: 'Live Release Schedule',
      icon: <CalendarDays className="w-5 h-5" />,
      description: 'Track global releases & set push-notification reminders.',
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-zinc-400 text-sm leading-relaxed">
            The Schedule page aggregates TMDB's massive database to build a beautiful timeline of Upcoming and Newly Released titles.
          </p>
          
          <div className="relative p-6 rounded-2xl border border-purple-500/30 bg-purple-950/20 overflow-hidden shadow-[inset_0_0_30px_rgba(147,51,234,0.1)]">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-display font-black text-xl">Releasing Today</h3>
                <div className="flex bg-black/50 border border-purple-500/30 rounded-lg p-1">
                   <button className="px-4 py-1.5 rounded-md bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest">Upcoming</button>
                   <button className="px-4 py-1.5 rounded-md text-zinc-400 text-[10px] font-black uppercase tracking-widest">Released</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {/* Mock Upcoming Card */}
                 <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-3 rounded-xl relative group overflow-hidden">
                    <div className="w-16 h-24 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                       <div className="absolute inset-0 bg-[url('https://media.themoviedb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg')] bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center gap-1 z-10">
                       <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">JULY 19, 2023</span>
                       <h4 className="text-white font-bold text-sm truncate">Oppenheimer</h4>
                       <span className="text-xs text-zinc-500">Drama, History</span>
                    </div>
                    {/* Mock Notification Bell */}
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-purple-600/20 hover:bg-purple-600 flex items-center justify-center transition-colors border border-purple-500/50 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                       <Bell className="w-4 h-4 text-white" />
                    </button>
                 </div>
                 
                 {/* Mock Upcoming Card 2 */}
                 <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-3 rounded-xl relative group overflow-hidden opacity-70">
                    <div className="w-16 h-24 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative">
                       <div className="absolute inset-0 bg-[url('https://media.themoviedb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGqqO9n.jpg')] bg-cover bg-center opacity-80 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col justify-center gap-1 z-10">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">FEB 27, 2024</span>
                       <h4 className="text-white font-bold text-sm truncate">Dune: Part Two</h4>
                       <span className="text-xs text-zinc-500">Sci-Fi, Adventure</span>
                    </div>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors border border-white/10 cursor-pointer">
                       <Bell className="w-4 h-4 text-zinc-400" />
                    </button>
                 </div>
              </div>
              
              <p className="text-xs text-purple-200/60 bg-black/30 p-3 rounded-lg border border-purple-500/20">
                <strong className="text-purple-300">How it works:</strong> Click the glowing bell icon to set a reminder. Zivox saves this to LocalStorage. We run a background check to see when it officially releases and send a visual alert to your screen.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'anime',
      title: 'The Otaku Dashboard',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'A completely isolated environment specifically built for Anime.',
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Anime isn't just a "genre" on Zivox. It has its own dedicated engine, complete with Sub/Dub filtering, Trope vaults, and the SSR Masterpiece Gacha System.
          </p>
          
          <div className="relative p-6 md:p-8 rounded-2xl border border-pink-500/30 bg-[linear-gradient(135deg,#2E0219_0%,#000000_100%)] overflow-hidden shadow-[inset_0_0_50px_rgba(255,121,198,0.15)]">
            <div className="absolute right-[-10%] top-[-20%] text-[150px] opacity-10 rotate-12 pointer-events-none select-none">🌸</div>
            
            <div className="relative z-10 flex flex-col gap-8">
              {/* Anime Top Section Mockup */}
              <div className="flex flex-col items-center text-center gap-3">
                <span className="text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(255,121,198,0.5)]">🍥</span>
                <h3 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  Welcome to the Vault, Senpai.
                </h3>
                
                {/* Fake Sub/Dub Toggle */}
                <div className="flex gap-2 p-1.5 bg-black/60 border border-pink-500/30 rounded-full mt-2 backdrop-blur-md">
                  <div className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/30">
                    SUB (JP)
                  </div>
                  <div className="px-6 py-2 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-widest">
                    DUB (EN)
                  </div>
                </div>
              </div>
              
              {/* Fake Horizontal Trope Selector */}
              <div className="flex gap-3 overflow-x-hidden no-scrollbar pb-2 mask-linear-fade">
                 <button className="flex-shrink-0 px-5 py-2.5 rounded-full bg-pink-500 text-white text-xs font-bold whitespace-nowrap shadow-[0_0_15px_rgba(255,121,198,0.5)] border border-pink-400">🔥 Shonen & Hype</button>
                 <button className="flex-shrink-0 px-5 py-2.5 rounded-full bg-pink-500/10 text-pink-300 text-xs font-bold whitespace-nowrap border border-pink-500/20">😭 Emotional Damage</button>
                 <button className="flex-shrink-0 px-5 py-2.5 rounded-full bg-pink-500/10 text-pink-300 text-xs font-bold whitespace-nowrap border border-pink-500/20">🍡 Cozy Slice of Life</button>
                 <button className="flex-shrink-0 px-5 py-2.5 rounded-full bg-pink-500/10 text-pink-300 text-xs font-bold whitespace-nowrap border border-pink-500/20">🤖 Mecha Gods</button>
              </div>
              
              {/* Gacha Banner Mockup */}
              <div className="w-full rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-pink-400/40 p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group cursor-pointer">
                 <div className="absolute inset-0 bg-[url('https://media.themoviedb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg')] bg-cover bg-center opacity-10 group-hover:scale-110 transition-transform duration-700" />
                 
                 <div className="relative z-10 flex flex-col gap-2 md:max-w-[60%]">
                    <span className="text-pink-300 font-black text-[10px] uppercase tracking-widest">Don't know what to watch?</span>
                    <h4 className="text-white text-xl md:text-2xl font-black italic">Pull the Daily Gacha.</h4>
                    <p className="text-zinc-300 text-xs">Summon a guaranteed God-Tier masterpiece instantly. 100% Drop Rate.</p>
                 </div>
                 
                 <button className="relative z-10 w-full md:w-auto px-8 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform">
                   🔮 Summon 1x
                 </button>
              </div>

            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'profile',
      title: 'Zero-Knowledge Privacy',
      icon: <ShieldAlert className="w-5 h-5" />,
      description: 'Your data never leaves your device. Export it instantly.',
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Zivox has **no backend database** for user accounts. You do not need to sign up. All your Watch History, Favorites, Watchlists, and UI Preferences are stored strictly in your browser's LocalStorage.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5 flex flex-col gap-3">
               <UserCircle className="w-8 h-8 text-emerald-400" />
               <h4 className="text-white font-bold">Custom Avatars</h4>
               <p className="text-zinc-400 text-xs leading-relaxed">
                 Head to Settings to upload your own profile picture. It converts to a Base64 string and saves locally, rendering instantly in the top navbar.
               </p>
             </div>
             
             <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-5 flex flex-col gap-3">
               <History className="w-8 h-8 text-emerald-400" />
               <h4 className="text-white font-bold">Data Export / Import</h4>
               <p className="text-zinc-400 text-xs leading-relaxed">
                 Switching browsers or phones? Go to the advanced settings to download a `zivox_backup.json` file. Upload it on your new device, and your watch history transfers instantly!
               </p>
             </div>
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 md:px-14">
      {/* Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-brand-400" />
            Zivox Master Guide
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black tracking-tight">
            Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-400">Platform</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed mt-2">
            Zivox isn't just another streaming site. It's a premium, ad-free cinema built specifically for power users. Explore the interactive modules below to learn exactly how the UI works.
          </p>
        </div>

        {/* Interactive Tabs Section */}
        <div className="flex flex-col lg:flex-row gap-8 mt-12">
          
          {/* Left Side: Navigation / Steps */}
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            {steps.map((step, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-900 border-brand-500/50 shadow-[0_0_30px_color-mix(in srgb, var(--brand-500) 10%, transparent)] scale-[1.02]' 
                      : 'bg-black border-white/5 hover:border-white/20 hover:bg-zinc-900/50 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-zinc-400'}`}>
                      {step.icon}
                    </div>
                    <h3 className={`font-bold text-sm md:text-base transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                      {step.title}
                    </h3>
                  </div>
                  <p className={`text-xs transition-colors ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {step.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Side: Interactive Content Display */}
          <div className="w-full lg:w-2/3">
            <div className="h-full bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col min-h-[500px] shadow-2xl">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full"
                >
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-3">
                      {steps[activeTab].title}
                    </h2>
                    <div className="h-1 w-16 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full" />
                  </div>
                  
                  {steps[activeTab].content}
                </motion.div>
              </AnimatePresence>

            </div>
          </div>

        </div>

        {/* Global Summary & Legal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors flex flex-col gap-3">
            <Tv className="w-6 h-6 text-emerald-400" />
            <h4 className="text-white font-bold text-sm">Responsive Design</h4>
            <p className="text-zinc-500 text-xs">Built with Next.js 14 and TailwindCSS, Zivox looks stunning on 4K TVs, MacBooks, and mobile phones alike.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors flex flex-col gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h4 className="text-white font-bold text-sm">Premium Aesthetic</h4>
            <p className="text-zinc-500 text-xs">Vibrant color palettes, dark-mode glassmorphism UI, smooth Framer Motion page transitions, and zero visual clutter.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors flex flex-col gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h4 className="text-white font-bold text-sm">Lenis Smooth Scroll</h4>
            <p className="text-zinc-500 text-xs">Scroll hijacking done right. We implemented Lenis for butter-smooth scrolling physics across the entire application.</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors flex flex-col gap-3">
            <Shield className="w-6 h-6 text-brand-400" />
            <h4 className="text-white font-bold text-sm">DMCA Compliant</h4>
            <p className="text-zinc-500 text-xs">Zivox does not host any files on its own servers. All content is provided by non-affiliated third parties.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center p-12 md:p-20 rounded-3xl bg-[url('https://media.themoviedb.org/t/p/original/1pdfLvkbY9ohJlCjQH2JGqqO9n.jpg')] bg-cover bg-center border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm group-hover:bg-black/60 transition-colors duration-700" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-70" />
          
          <div className="relative z-10 flex flex-col items-center">
             <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4 drop-shadow-lg">Ready to dive in?</h2>
             <p className="text-zinc-300 text-sm md:text-base mb-10 max-w-xl mx-auto drop-shadow-md">You now know the platform inside and out. It's time to grab your popcorn, pick a premium server, and start watching in 4K.</p>
             
             <Link 
               href="/"
               className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-black uppercase tracking-widest text-sm transition-all hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_color-mix(in srgb, var(--brand-500) 50%, transparent)]"
             >
               Go to Homepage
               <Play className="w-5 h-5 fill-black" />
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
