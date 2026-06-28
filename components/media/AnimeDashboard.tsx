'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Media } from '@/types/tmdb';
import { MediaCard } from './MediaCard';
import { HorizontalRow } from './HorizontalRow';
import { Top10Row } from './Top10Row';
import { Sparkles, Flame, Heart, HelpCircle, RefreshCw, Volume2, Play, Gift, Award, HelpCircle as HelpIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

interface AnimeDashboardProps {
  trendingAnime: Media[];
  topRatedAnime: Media[];
}

// 🌸 Sakura Particle Canvas Component
function SakuraCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout>;
    let frameCount = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const handleScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { isScrolling = false; }, 300);
    };
    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animationFrameId);
      else if (!isScrolling) render();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    class Petal {
      x = Math.random() * width;
      y = Math.random() * height - height;
      r = Math.random() * 7 + 3;
      s = Math.random() * 1.2 + 0.4;
      w = Math.random() * 0.018;
      sway = Math.random() * 100;
      angle = Math.random() * 360;
      rotationSpeed = Math.random() * 0.6 - 0.3;
      color = `rgba(255, ${180 + Math.floor(Math.random() * 50)}, ${200 + Math.floor(Math.random() * 55)}, ${0.35 + Math.random() * 0.4})`;

      update() {
        this.y += this.s;
        this.sway += this.w;
        this.x += Math.sin(this.sway) * 0.35;
        this.angle += this.rotationSpeed;
        if (this.y > height + 20) {
          this.y = -20;
          this.x = Math.random() * width;
          this.s = Math.random() * 1.2 + 0.4;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate((this.angle * Math.PI) / 180);
        c.beginPath();
        c.ellipse(0, 0, this.r, this.r / 2, 0, 0, 2 * Math.PI);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
      }
    }

    // Cap at 25 petals (was 60) — massive savings on mobile
    const petalCount = Math.min(25, Math.floor((width * height) / 40000));
    const petals: Petal[] = Array.from({ length: petalCount }, () => new Petal());

    const render = () => {
      frameCount++;
      animationFrameId = requestAnimationFrame(render);
      if (frameCount % 2 !== 0) return; // ~30fps instead of 60fps
      if (isScrolling || document.hidden) return; // pause during scroll
      ctx.clearRect(0, 0, width, height);
      petals.forEach((p) => { p.update(); p.draw(ctx); });
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(scrollTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 z-10 pointer-events-none w-full h-full" style={{ willChange: 'transform' }} />;
}



// 💬 Dynamic Character Quotes List
const ANIME_QUOTES = [
  {
    text: "Throughout Heaven and Earth, I alone am the honored one.",
    char: "Gojo Satoru",
    anime: "Jujutsu Kaisen",
  },
  {
    text: "If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be!",
    char: "Naruto Uzumaki",
    anime: "Naruto",
  },
  {
    text: "Being weak is nothing to be ashamed of... Staying weak is!",
    char: "Fuegoleon Vermillion",
    anime: "Black Clover",
  },
  {
    text: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger as well as kinder.",
    char: "Gildarts Clive",
    anime: "Fairy Tail",
  },
  {
    text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.",
    char: "Kenshin Himura",
    anime: "Rurouni Kenshin",
  },
  {
    text: "People's dreams... HAVE NO END!",
    char: "Marshall D. Teach",
    anime: "One Piece",
  },
  {
    text: "We are all like fireworks: we climb, we shine and always go our separate ways.",
    char: "Hitsugaya Toshiro",
    anime: "Bleach",
  },
];

// Anime genre codes mapping
const ANIME_GENRES = [
  { id: null, name: "All Genres", emoji: "💮" },
  { id: 10759, name: "Shonen & Action", emoji: "⚔️" },
  { id: 35, name: "Comedy & Cozy", emoji: "🌸" },
  { id: 18, name: "Drama & Tears", emoji: "🎭" },
  { id: 10765, name: "Fantasy & Magic", emoji: "🔮" },
  { id: 9648, name: "Mystery & Psychology", emoji: "🧠" },
];

export function AnimeDashboard({ trendingAnime, topRatedAnime }: AnimeDashboardProps) {
  const [otakuMode, setOtakuMode] = useState(false);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [mascotStatus, setMascotStatus] = useState("Okaeri!");
  
  // Interactive global preference: Sub vs Dub (Every anime lover's debate!)
  const [audioPref, setAudioPref] = useState<'sub' | 'dub'>('sub');

  // Filtering & Pagination State
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [visibleMasterpieces, setVisibleMasterpieces] = useState(18);
  const [isGenreTransitioning, setIsGenreTransitioning] = useState(false);

  // Widget Mode tabs: Quiz vs Gacha Pull
  const [activeWidgetTab, setActiveWidgetTab] = useState<'quiz' | 'gacha'>('quiz');

  // Quiz State
  const [quizStep, setQuizStep] = useState(0); 
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizMatch, setQuizMatch] = useState<Media | null>(null);

  // Gacha State
  const [gachaSpinning, setGachaSpinning] = useState(false);
  const [gachaResult, setGachaResult] = useState<Media | null>(null);
  const [gachaTier, setGachaTier] = useState<'SR' | 'SSR' | 'UR'>('SSR');

  // Quote rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuoteIdx((prev) => (prev + 1) % ANIME_QUOTES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = ANIME_QUOTES[currentQuoteIdx];

  // Mascot phrases triggered on action
  const triggerMascotPhrase = () => {
    const phrases = [
      "Senpai noticed me! (≧◡≦)",
      "NANI?! Is that your watch list? (o_O)",
      "UwU... Anime is literal life!",
      "Yamete kudasai! Don't click too fast!",
      "Ramen smells so good right now... 🍜",
      "Powering up past 9000! ⚡",
    ];
    setMascotStatus(phrases[Math.floor(Math.random() * phrases.length)]);
  };

  const handleAudioPrefChange = (pref: 'sub' | 'dub') => {
    setAudioPref(pref);
    if (pref === 'sub') {
      setMascotStatus("A true person of culture! Subbed is peak! (✿◡‿◡)");
    } else {
      setMascotStatus("Nani?! You watch dub? Senpai, I won't judge... much! (¬_¬)");
    }
  };

  // Combine and deduplicate all anime into a general pool
  const allAnime = useMemo(() => {
    const combined = [...trendingAnime, ...topRatedAnime];
    return combined.filter((item, index, self) => 
      item && item.id && index === self.findIndex((t) => t.id === item.id)
    );
  }, [trendingAnime, topRatedAnime]);

  // Tropes category compiling
  const categories = useMemo(() => {
    const shonenList: Media[] = [];
    const sliceOfLifeList: Media[] = [];
    const emotionalList: Media[] = [];
    const masters: Media[] = [];

    allAnime.forEach((media) => {
      const title = (media.title || media.name || "").toLowerCase();
      const genres = media.genre_ids || [];
      const score = media.vote_average || 0;

      if (genres.includes(10759) || genres.includes(10765) || title.includes("naruto") || title.includes("slayer") || title.includes("titan") || title.includes("hunter") || title.includes("kaisen")) {
        shonenList.push(media);
      }
      if (genres.includes(35) || title.includes("family") || title.includes("camp") || title.includes("bocchi") || title.includes("friend")) {
        sliceOfLifeList.push(media);
      }
      if (genres.includes(18) || score >= 8.3) {
        emotionalList.push(media);
      }
      if (score >= 8.0) {
        masters.push(media);
      }
    });

    return {
      shonen: shonenList.length > 0 ? shonenList : allAnime.slice(0, 15),
      cozy: sliceOfLifeList.length > 0 ? sliceOfLifeList : allAnime.slice(5, 20),
      tears: emotionalList.length > 0 ? emotionalList : allAnime.slice(8, 23),
      masterpieces: masters.length > 0 ? masters : allAnime.slice(0, 20),
    };
  }, [allAnime]);

  // Quiz calculations
  const quizQuestions = [
    {
      title: "What is your absolute battle status right now?",
      options: [
        { label: "⚡ Screaming to power up for 3 episodes", value: "action" },
        { label: "🧠 Solving hyper-complex cases with notebooks", value: "mystery" },
        { label: "🌸 Cozying up under a warm blanket with green tea", value: "cozy" },
        { label: "😭 Crying in the corner over beautiful friendships", value: "emotional" },
      ],
    },
    {
      title: "How resilient are your tear ducts today?",
      options: [
        { label: "🧱 Absolute steel, I physically cannot cry", value: "tough" },
        { label: "💧 Highly sensitive, a beautiful soundtrack makes me teary", value: "tear" },
        { label: "🌧️ Hand me the tissues, let me feel the void", value: "depression" },
      ],
    },
    {
      title: "Pick your legendary companion!",
      options: [
        { label: "🐈 A mysterious talking black cat", value: "magical" },
        { label: "👹 A literal demon sealed inside my belly", value: "shonen" },
        { label: "🍜 A cute girl who wants to build a school club", value: "cozy" },
        { label: "🕶️ An ridiculously OP teacher who covers his eyes", value: "hype" },
      ],
    },
  ];

  const handleQuizAnswer = (val: string) => {
    const nextAnswers = [...quizAnswers, val];
    setQuizAnswers(nextAnswers);

    if (quizStep < quizQuestions.length) {
      setQuizStep(quizStep + 1);
    }

    if (nextAnswers.length === quizQuestions.length) {
      const categoryType = nextAnswers[0];
      let pool: Media[] = [];

      if (categoryType === "action") {
        pool = categories.shonen;
      } else if (categoryType === "cozy") {
        pool = categories.cozy;
      } else if (categoryType === "emotional") {
        pool = categories.tears;
      } else {
        pool = categories.masterpieces;
      }

      const sortedPool = [...pool].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      const match = sortedPool[Math.floor(Math.random() * Math.min(4, sortedPool.length))] || allAnime[0];
      setQuizMatch(match);
      setQuizStep(4);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizMatch(null);
  };

  // 🎟️ Daily Anime Gacha Pull Simulation (SSR Rate 100%!)
  const rollGacha = () => {
    setGachaSpinning(true);
    setGachaResult(null);
    setMascotStatus("Wishing upon the stars... Gacha rolling! 💫");

    setTimeout(() => {
      // Pick a random anime from topRated list
      const show = topRatedAnime[Math.floor(Math.random() * topRatedAnime.length)] || allAnime[0];
      const rating = show.vote_average || 0;
      
      // Tier allocations based on score
      if (rating >= 8.3) setGachaTier('UR');
      else if (rating >= 7.8) setGachaTier('SSR');
      else setGachaTier('SR');

      setGachaResult(show);
      setGachaSpinning(false);
      setMascotStatus("🎉 ULTRA SSR PULL SUCCESS! 🎉");
    }, 1500);
  };

  // Dynamic filter lists
  const filteredTrending = useMemo(() => {
    return trendingAnime.filter(item => selectedGenre === null || item.genre_ids?.includes(selectedGenre));
  }, [trendingAnime, selectedGenre]);

  const filteredTopRated = useMemo(() => {
    return topRatedAnime.filter(item => selectedGenre === null || item.genre_ids?.includes(selectedGenre));
  }, [topRatedAnime, selectedGenre]);

  const handleGenreChange = (genreId: number | null) => {
    if (genreId === selectedGenre) return; // no-op if same genre
    setIsGenreTransitioning(true);
    // Brief delay to allow fade-out before content changes
    setTimeout(() => {
      setSelectedGenre(genreId);
      setVisibleMasterpieces(18);
      setMascotStatus(`Browsing ${genreId ? ANIME_GENRES.find(g => g.id === genreId)?.name : 'All Vaults'}!`);
      setIsGenreTransitioning(false);
    }, 150);
  };

  return (
    <div
      className={`flex flex-col min-h-screen relative pb-28 md:pb-20 transition-all duration-700 ease-in-out bg-black overflow-hidden ${
        otakuMode
          ? 'text-pink-100 shadow-[inset_0_0_100px_rgba(255,121,198,0.15)] bg-slate-950'
          : 'text-white'
      }`}
    >
      <AnimatedBackground />
      <SakuraCanvas active={otakuMode} />

      {otakuMode && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-30 animate-pulse duration-[8s]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 121, 198, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 121, 198, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 95%)',
          }}
        />
      )}

      {/* ── HEADER & SUB VS DUB DEBATE ── */}
      <header className="relative z-20 px-6 md:px-14 pt-28 md:pt-36 pb-6 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <motion.div
            animate={otakuMode ? { rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
            onClick={triggerMascotPhrase}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 cursor-pointer select-none relative ${
              otakuMode
                ? 'bg-pink-500/20 border border-pink-400/50 shadow-[0_0_20px_rgba(255,121,198,0.5)]'
                : 'bg-zinc-900 border border-zinc-800'
            }`}
          >
            <span className="text-3xl">🌸</span>
            <AnimatePresence>
              {mascotStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={mascotStatus}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-pink-400 text-pink-400 text-[10px] font-black tracking-wide py-1 px-2.5 rounded-xl whitespace-nowrap shadow-xl z-30"
                >
                  {mascotStatus}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1
                className={`text-3xl md:text-5xl font-display font-black tracking-tight leading-none uppercase ${
                  otakuMode
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(255,121,198,0.6)] font-extrabold'
                    : 'text-white'
                }`}
              >
                {otakuMode ? "Otaku Sanctuary 💮" : "Anime Central"}
              </h1>
              {otakuMode && (
                <span className="bg-pink-500 text-white text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase animate-bounce">
                  Weeb Mode ON
                </span>
              )}
            </div>
            {/* Sub vs Dub Interactive debate toggles */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Sanctuary Preference:</span>
              <div className="inline-flex rounded-full bg-zinc-950 p-0.5 border border-zinc-900 select-none">
                <button
                  onClick={() => handleAudioPrefChange('sub')}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${audioPref === 'sub' ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  🔊 Sub
                </button>
                <button
                  onClick={() => handleAudioPrefChange('dub')}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${audioPref === 'dub' ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  🗣️ Dub
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setOtakuMode(!otakuMode);
            setMascotStatus(!otakuMode ? "🔥 BANKAI activated! 🔥" : "Weeb Mode OFF!");
          }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 select-none active:scale-95 z-30 ${
            otakuMode
              ? 'bg-pink-500 text-white shadow-[0_0_25px_rgba(255,121,198,0.6)] border border-pink-300/40 hover:bg-pink-400'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-350 hover:bg-zinc-850 hover:text-white'
          }`}
        >
          {otakuMode ? <Flame className="w-4 h-4 fill-current animate-pulse" /> : <Sparkles className="w-4 h-4" />}
          {otakuMode ? "⚡ Unleash Clean Mode" : "🌸 Activate Otaku Mode"}
        </button>
      </header>

      {/* ── ANIME QUOTES ROTATOR ── */}
      <section className="relative z-20 px-6 md:px-14 mb-10">
        <div
          className={`w-full max-w-[1800px] mx-auto p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-center gap-5 transition-all duration-500 border ${
            otakuMode
              ? 'bg-pink-500/5 border-pink-500/35 shadow-[0_4px_30px_rgba(255,121,198,0.05)]'
              : 'bg-zinc-950/80 border-zinc-900'
          }`}
        >
          <div className={`p-2 rounded-xl flex items-center justify-center flex-shrink-0 ${otakuMode ? 'bg-pink-500/10 text-pink-400' : 'bg-zinc-900 text-zinc-500'}`}>
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
              💬 Quote of the Day
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className={`text-base md:text-lg font-medium leading-relaxed italic ${otakuMode ? 'text-pink-100' : 'text-zinc-200'}`}>
                  &ldquo;{currentQuote.text}&rdquo;
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5">
                  <span className={`text-xs font-bold ${otakuMode ? 'text-pink-400' : 'text-zinc-400'}`}>
                    — {currentQuote.char}
                  </span>
                  <span className="text-zinc-600 text-xs">•</span>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {currentQuote.anime}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              setCurrentQuoteIdx((prev) => (prev + 1) % ANIME_QUOTES.length);
              triggerMascotPhrase();
            }}
            className={`p-2 rounded-full border transition-all duration-300 hover:scale-110 active:scale-95 ${
              otakuMode 
                ? 'border-pink-500/30 text-pink-400 bg-pink-500/10 hover:bg-pink-500/25' 
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
            title="Next Quote"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── 🔮 QUIZ & Daily Gacha Pull WIDGETS ── */}
      <section className="relative z-20 px-6 md:px-14 mb-14">
        <div className="w-full max-w-[1800px] mx-auto">
          <div
            className={`p-6 md:p-8 rounded-3xl transition-all duration-500 border ${
              otakuMode
                ? 'bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-cyan-500/5 border-pink-400/40 shadow-[0_0_40px_rgba(255,121,198,0.15)]'
                : 'bg-zinc-950 border-zinc-900 shadow-xl'
            }`}
          >
            {/* Tab Toggles */}
            <div className="flex items-center gap-4 mb-6 border-b border-zinc-900 pb-3">
              <button
                onClick={() => {
                  setActiveWidgetTab('quiz');
                  resetQuiz();
                }}
                className={`flex items-center gap-2 pb-2 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeWidgetTab === 'quiz'
                    ? 'text-pink-500 border-b-2 border-pink-500 font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Soulmate Quiz Matcher
              </button>
              <button
                onClick={() => {
                  setActiveWidgetTab('gacha');
                  setGachaResult(null);
                }}
                className={`flex items-center gap-2 pb-2 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeWidgetTab === 'gacha'
                    ? 'text-pink-500 border-b-2 border-pink-500 font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Gift className="w-4 h-4" />
                Daily Anime Gacha (SSR!)
              </button>
            </div>

            {/* TAB WINDOW CONTENT */}
            <div className="relative overflow-hidden min-h-[220px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                
                {/* ── TAB 1: QUIZ ── */}
                {activeWidgetTab === 'quiz' && (
                  <motion.div
                    key="quiz-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full"
                  >
                    {quizStep === 0 && (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        <span className="text-4xl mb-3 animate-bounce">🔮</span>
                        <h3 className="text-base font-bold mb-2">Feeling overwhelmed by too many shows?</h3>
                        <p className="text-xs text-zinc-400 max-w-md mb-4">
                          Let the anime algorithms align with your cosmic otaku frequency. Answer 3 quick choices to find your destiny!
                        </p>
                        <button
                          onClick={() => {
                            setQuizStep(1);
                            setMascotStatus("Let's go, Senpai! (✿＞◡＜)");
                          }}
                          className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-300"
                        >
                          Start Matcher ⚔️
                        </button>
                      </div>
                    )}

                    {quizStep >= 1 && quizStep <= 3 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-pink-400">
                            Question {quizStep} of 3
                          </span>
                          <span className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                            <span
                              className="h-full bg-pink-500 block"
                              style={{ width: `${(quizStep / 3) * 100}%` }}
                            />
                          </span>
                        </div>

                        <h3 className="text-base md:text-lg font-bold text-zinc-200">
                          {quizQuestions[quizStep - 1].title}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                          {quizQuestions[quizStep - 1].options.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleQuizAnswer(opt.value)}
                              className={`w-full text-left p-4 rounded-2xl border text-xs font-semibold transition-all duration-200 active:scale-98 cursor-pointer ${
                                otakuMode
                                  ? 'border-pink-500/20 bg-pink-500/5 text-pink-100 hover:border-pink-500/60 hover:bg-pink-500/10'
                                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {quizStep === 4 && quizMatch && (
                      <div className="flex flex-col md:flex-row items-center gap-6 p-2">
                        <div className="relative w-36 aspect-[2/3] rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl border border-pink-400/20">
                          <img
                            src={`https://media.themoviedb.org/t/p/w500${quizMatch.poster_path}`}
                            alt={quizMatch.name || quizMatch.title}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-pink-500/20 text-pink-400 border border-pink-500/20 mb-2">
                            🎉 Destiny Match Found!
                          </span>
                          <h3 className={`text-xl md:text-2xl font-display font-black leading-tight ${otakuMode ? 'text-pink-300' : 'text-white'}`}>
                            {quizMatch.name || quizMatch.title}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-3 mt-2 leading-relaxed font-medium">
                            {quizMatch.overview}
                          </p>
                          
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                            <Link
                              href={`/watch/tv/${quizMatch.id}`}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-pink-600/30"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Stream Episode 1
                            </Link>
                            
                            <button
                              onClick={resetQuiz}
                              className={`flex items-center gap-1 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer ${
                                otakuMode
                                  ? 'border-pink-500/30 text-pink-400 hover:bg-pink-500/10'
                                  : 'border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3" />
                              Try Again
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── TAB 2: Daily Gacha (SSR PULL) ── */}
                {activeWidgetTab === 'gacha' && (
                  <motion.div
                    key="gacha-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full flex flex-col items-center justify-center text-center p-2"
                  >
                    {!gachaResult && !gachaSpinning && (
                      <div className="max-w-md">
                        <span className="text-4xl mb-3 animate-bounce block">🎟️</span>
                        <h3 className="text-base font-bold mb-2">Daily Gacha Summoning Banner</h3>
                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-medium">
                          Summon a random peak anime using the Gacha system! Every single roll is guaranteed to pull an **SR**, **SSR**, or **UR** rated masterpiece!
                        </p>
                        <button
                          onClick={rollGacha}
                          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xl shadow-pink-500/15 cursor-pointer"
                        >
                          🔮 Summon 1x Gacha (100% SSR+!)
                        </button>
                      </div>
                    )}

                    {/* SPINNING ANIMATION */}
                    {gachaSpinning && (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-12 h-12 rounded-full border-4 border-pink-600/30 border-t-pink-500 animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-pink-400 animate-pulse">
                          summoning glowing stars...
                        </p>
                      </div>
                    )}

                    {/* SUMMON RESULTS (SSR Holographic Card!) */}
                    {gachaResult && !gachaSpinning && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col md:flex-row items-center gap-6 p-2 w-full text-left"
                      >
                        {/* SSR Holographic Card Body */}
                        <div className="relative w-36 aspect-[2/3] rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_0_30px_rgba(255,121,198,0.4)] border-2 border-pink-400/50 group select-none">
                          <img
                            src={`https://media.themoviedb.org/t/p/w500${gachaResult.poster_path}`}
                            alt={gachaResult.name || gachaResult.title}
                            className="object-cover w-full h-full"
                          />
                          {/* Rare holographic banner overlay */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest rounded-md shadow-md animate-pulse">
                            {gachaTier}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-500/25 text-yellow-400 border border-yellow-500/20 mb-2">
                            ✨ SUMMON RATING: {gachaTier === 'UR' ? 'ULTRA RARE' : 'SSR MASTERPIECE'}
                          </span>
                          <h3 className={`text-xl md:text-2xl font-display font-black leading-tight ${otakuMode ? 'text-pink-300' : 'text-white'}`}>
                            {gachaResult.name || gachaResult.title}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-3 mt-2 leading-relaxed font-medium">
                            {gachaResult.overview}
                          </p>

                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                            <Link
                              href={`/watch/tv/${gachaResult.id}`}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-pink-600/30"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Stream Episode 1
                            </Link>
                            
                            <button
                              onClick={rollGacha}
                              className={`flex items-center gap-1 px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer ${
                                otakuMode
                                  ? 'border-pink-500/30 text-pink-400 hover:bg-pink-500/10'
                                  : 'border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3" />
                              Re-summon Gacha
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP 10 ANIME ROW (TRENDING DAILY) ── */}
      <section className="relative z-20 mb-10">
        <Top10Row
          title={otakuMode ? "🏆 Absolutely Peak — Top 10 Today" : "Top 10 Hype Shows Today"}
          items={trendingAnime.slice(0, 10)}
        />
      </section>

      {/* ── 🌟 GENRE-WISE VAULT (THE GRAND OTAKU VAULT) ── */}
      <section className="relative z-20 px-6 md:px-14 py-8 mb-12">
        <div className="w-full max-w-[1800px] mx-auto flex flex-col gap-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-900 pb-5 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 block mb-1">
                ⛩️ Infinite Selection
              </span>
              <h2 className={`text-2xl md:text-4xl font-display font-black tracking-tight leading-none ${otakuMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(255,121,198,0.35)]' : 'text-white'}`}>
                {otakuMode ? "The Grand Otaku Vault" : "Genre-Wise Anime Vault"}
              </h2>
              <p className={`text-xs mt-1.5 transition-colors ${otakuMode ? 'text-pink-300/40' : 'text-zinc-500'}`}>
                Select a genre to browse matching current trending hits (~30 total today) and legendary top-rated masterpieces (~100+ total).
              </p>
            </div>
          </div>

          <div 
            data-lenis-prevent="true" 
            className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar select-none overscroll-contain"
            style={{ touchAction: 'pan-x' }}
          >
            {ANIME_GENRES.map((genre) => {
              const active = selectedGenre === genre.id;
              return (
                <button
                  key={genre.name}
                  onClick={() => handleGenreChange(genre.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-300 hover:-translate-y-[1px] active:scale-95 cursor-pointer ${
                    active
                      ? otakuMode
                        ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(255,121,198,0.65)] border border-pink-400/50'
                        : 'bg-white text-black shadow-lg shadow-white/10 border border-white'
                      : otakuMode
                        ? 'bg-pink-500/5 border border-pink-500/20 text-pink-300/70 hover:border-pink-500/60 hover:text-white'
                        : 'bg-zinc-950/80 border border-zinc-900 text-zinc-450 hover:border-zinc-800 hover:text-white'
                  }`}
                >
                  <span>{genre.emoji}</span>
                  <span>{genre.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-10 mt-2" style={{ opacity: isGenreTransitioning ? 0 : 1, transition: 'opacity 0.15s ease' }}>
            
            {filteredTrending.length > 0 ? (
              <HorizontalRow
                title={
                  selectedGenre === null 
                    ? otakuMode 
                      ? "🔥 Today's Hype (Trending Hits)" 
                      : "Today's Trending Anime"
                    : otakuMode
                      ? `🔥 Trending ${ANIME_GENRES.find(g => g.id === selectedGenre)?.name}`
                      : `${ANIME_GENRES.find(g => g.id === selectedGenre)?.name} - Trending Today`
                }
                items={filteredTrending.slice(0, 30)}
              />
            ) : null}

            {filteredTopRated.length > 0 ? (
              <div className="flex flex-col gap-5 pt-4">
                <h3 className={`text-xl font-display font-black tracking-tight flex items-center gap-2 ${otakuMode ? 'text-pink-300' : 'text-white'}`}>
                  <span>✨</span>
                  <span>
                    {selectedGenre === null 
                      ? otakuMode 
                        ? "🏆 All-Time Masterpieces" 
                        : "All-Time Top Rated Masterpieces"
                      : otakuMode
                        ? `🏆 ${ANIME_GENRES.find(g => g.id === selectedGenre)?.name} Masterpieces`
                        : `${ANIME_GENRES.find(g => g.id === selectedGenre)?.name} - Top Rated`
                    }
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 tracking-wider">
                    ({filteredTopRated.length} titles available)
                  </span>
                </h3>

                <motion.div 
                  layout="position" 
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6 mt-2"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredTopRated.slice(0, visibleMasterpieces).map((item, index) => (
                      <motion.div
                        layout="position"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ duration: 0.25 }}
                        key={`vault-${item.id}-${index}`}
                        className={otakuMode ? "relative rounded-xl hover:shadow-[0_0_18px_rgba(255,121,198,0.25)] border border-pink-500/5 transition-[box-shadow] duration-300" : ""}
                      >
                        <MediaCard media={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {filteredTopRated.length > visibleMasterpieces ? (
                  <div className="flex items-center justify-center pt-8">
                    <button
                      onClick={() => {
                        setVisibleMasterpieces(prev => prev + 18);
                        setMascotStatus("Unleashing more anime energy! ⚡");
                      }}
                      className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl select-none cursor-pointer ${
                        otakuMode
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/20 border border-pink-400/35'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-350 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      {otakuMode ? "⚡ Unleash More Masterpieces ⚡" : "Show More Masterpieces"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {filteredTrending.length === 0 && filteredTopRated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-zinc-900/40 bg-zinc-950/20 rounded-3xl">
                <span className="text-5xl mb-4 animate-bounce">🍥</span>
                <h4 className="text-lg font-display font-black text-zinc-400">Nani?! No titles match this combo...</h4>
                <p className="text-xs text-zinc-650 mt-1 max-w-sm">
                  The otaku satellites couldn't match this exact query. Try another genre, senpai!
                </p>
                <button
                  onClick={() => handleGenreChange(null)}
                  className="mt-4 text-xs font-extrabold text-pink-500 hover:text-pink-400 cursor-pointer"
                >
                  Show All Genres 💮
                </button>
              </div>
            ) : null}

          </div>
        </div>
      </section>

      {/* ── CURATED OTAKU TROPES SECTIONS ── */}
      <div className="flex flex-col relative z-20 gap-10 md:gap-14">
        <HorizontalRow
          title={otakuMode ? "⚡ God-Tier Shonen & Intense Fights" : "🔥 Popular Action & Hype Anime"}
          items={categories.shonen}
          seeAllHref="/anime"
        />

        <HorizontalRow
          title={otakuMode ? "🍡 Cozy Slice of Life & Fluffy Comedy" : "🌸 Cozy Slice of Life & Comedy"}
          items={categories.cozy}
          seeAllHref="/anime"
        />

        <HorizontalRow
          title={otakuMode ? "😭 Emotional Damage & Tearjerkers" : "🌟 Highly Rated & Emotional"}
          items={categories.tears}
          seeAllHref="/anime"
        />
      </div>
    </div>
  );
}
