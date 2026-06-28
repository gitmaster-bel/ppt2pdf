'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import { sources, getSource, TIER_1_SANDBOX, TIER_2_SANDBOX } from '@/lib/sources';
import { Shield, ShieldOff, Play, Server, ExternalLink, ArrowLeft, Terminal, AlertCircle, Database, LayoutGrid, Search } from 'lucide-react';
import Link from 'next/link';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

const API_PRESETS = [
  {
    name: "TMDB Embed API (Inside4ndroid)",
    url: "http://localhost:8787/api/streams/{type}/{tmdbId}",
    notes: "Aggregator API returning JSON stream objects from 10+ providers. Built-in m3u8/ts proxy layers."
  },
  {
    name: "4KHDHub Scraper",
    url: "http://localhost:8787/api/streams/4khdhub/{type}/{tmdbId}",
    notes: "Direct link scraper returning direct file links. Active inside TMDB Embed API."
  },
  {
    name: "LordFlix (9-Server Scraper)",
    url: "http://localhost:8787/api/streams/lordflix/{type}/{tmdbId}",
    notes: "Replaced Vidsync. Active via enc-dec.app relay."
  },
  {
    name: "NoTorrent Stremio Bridge",
    url: "http://localhost:8787/api/streams/notorrent/{type}/{tmdbId}",
    notes: "Addon API bridge for Stremio direct scrapers."
  },
  {
    name: "DahmerMovies Open-Directory",
    url: "http://localhost:8787/api/streams/dahmermovies/{type}/{tmdbId}",
    notes: "Direct file links scraped from open directories with proxy rewrite."
  },
  {
    name: "CinePro Multi-Site Scraper",
    url: "http://localhost:8787/api/streams/cinepro/{type}/{tmdbId}",
    notes: "Backend scraper returning up to 50+ unique playable sources per media."
  }
];

const UNUSED_RESOURCES = [
  {
    name: "Cinetaro",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://cinetaro.tv/src/player/sub.php?id={tmdbId}-movie&server=maple" : "https://cinetaro.tv/src/player/sub.php?id={tmdbId}-tv&season={season}&ep={episode}&server=maple",
    type: "iframe",
    description: "Multi-server player iframe"
  },
  {
    name: "Airflix",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://airflix1.com/movie/{tmdbId}" : "https://airflix1.com/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "Direct movie embed"
  },
  {
    name: "VSEmbed",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vsembed.ru/embed/movie/{tmdbId}" : "https://vsembed.ru/embed/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "Russian-based embed proxy"
  },
  {
    name: "VidLux",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vidlux.xyz/embed/movie/{tmdbId}" : "https://vidlux.xyz/embed/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "Seen serving Hindi dubs"
  },
  {
    name: "CineWave",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://watch.cinewave.qzz.io/watch/movie/{tmdbId}" : "https://watch.cinewave.qzz.io/watch/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "Iframe player"
  },
  {
    name: "FMovies GD",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://fmovies.gd/movie/{tmdbId}" : "https://fmovies.gd/tv/{tmdbId}?s={season}&e={episode}",
    type: "iframe",
    description: "Classic clone embed"
  },
  {
    name: "VidSync",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vidsync.xyz/embed/movie/{tmdbId}" : "https://vidsync.xyz/embed/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "Unused source"
  },
  {
    name: "CandleStream Embed",
    url: (type: 'movie' | 'tv') => type === 'movie' 
      ? "https://candlestream.xyz/candle/{tmdbId}?v=20260521candleembed2&title=Test"
      : "https://candlestream.xyz/candle/tv/{tmdbId}/{season}/{episode}?v=20260521candleembed2&title=Test&season={season}&episode={episode}",
    type: "iframe",
    description: "Highly sophisticated token router"
  },
  {
    name: "ScreenScape",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://screenscape.me/embed?tmdb={tmdbId}&type=movie" : "https://screenscape.me/embed?tmdb={tmdbId}&type=tv&s={season}&e={episode}",
    type: "iframe",
    description: "Dedicated UI for embeds"
  },
  {
    name: "Dulo TV",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://dulo.tv/#/movie/{tmdbId}" : "https://dulo.tv/#/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "SPA-style player"
  },
  {
    name: "1Embed.cc",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://1embed.cc/embed/movie/{tmdbId}?color=3b82f6&auto_play=1" : "https://1embed.cc/embed/tv/{tmdbId}/{season}/{episode}?color=3b82f6&auto_play=1",
    type: "iframe",
    description: "New proxy iframe player"
  },
  {
    name: "VDRK Subtitles",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://sub.vdrk.site/v2/movie/{tmdbId}" : "https://sub.vdrk.site/v2/tv/{tmdbId}/{season}/{episode}",
    type: "api",
    description: "Standalone subtitle fetcher"
  },
  {
    name: "Fed-Subs API",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://fed-subs.pstream.mov/movie/tt{imdbId}" : "https://fed-subs.pstream.mov/tv/tt{imdbId}/{season}/{episode}",
    type: "api",
    description: "Secondary subtitle API"
  },
  {
    name: "HDHub Streams (JSON Scraper)",
    url: (type: 'movie' | 'tv') => type === 'movie' 
      ? "https://hdhub.thevolecitor.qzz.io/eyJ0b3Jib3giOiJ1bnNldCIsInF1YWxpdGllcyI6IjIxNjBwLDEwODBwLDcyMHAiLCJzb3J0IjoiZGVzYyJ9/stream/movie/tt{imdbId}.json"
      : "https://hdhub.thevolecitor.qzz.io/eyJ0b3Jib3giOiJ1bnNldCIsInF1YWxpdGllcyI6IjIxNjBwLDEwODBwLDcyMHAiLCJzb3J0IjoiZGVzYyJ9/stream/series/tt{imdbId}:{season}:{episode}.json",
    type: "api",
    description: "Returns raw stream URLs (2160p, 1080p, 720p)"
  },
  {
    name: "Streamed.pk (Live Sports)",
    url: (type: 'movie' | 'tv') => "https://streamed.pk/api/matches/all-today",
    type: "api",
    description: "Feeds for live sports events"
  },
  {
    name: "VidEasy Trailers",
    url: (type: 'movie' | 'tv') => "https://trailers.videasy.net/getOldestTrailer?id=tt{imdbId}",
    type: "api",
    description: "Fetches trailer links by IMDB ID"
  },
  {
    name: "VidPlus Pro",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://player2.vidplus.pro/embed/movie/{tmdbId}?autoplay=true" : "https://player2.vidplus.pro/embed/tv/{tmdbId}/{season}/{episode}?autoplay=true",
    type: "iframe",
    description: "New VidPlus Pro embed"
  },
  {
    name: "VidPlus To",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://player.vidplus.to/embed/movie/{tmdbId}?autoplay=true" : "https://player.vidplus.to/embed/tv/{tmdbId}/{season}/{episode}?autoplay=true",
    type: "iframe",
    description: "VidPlus alternative domain"
  },
  {
    name: "Autoembed CC",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://player.autoembed.cc/embed/movie/tt{imdbId}?server=2" : "https://player.autoembed.cc/embed/tv/tt{imdbId}/{season}/{episode}?server=2",
    type: "iframe",
    description: "Autoembed .cc proxy"
  },
  {
    name: "YTHD",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://ythd.org/embed/{tmdbId}" : "https://ythd.org/embed/{tmdbId}/{season}-{episode}",
    type: "iframe",
    description: "YTHD streaming embed"
  },
  
  {
    name: "VidBox Dev",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vidbox.dev/api/hdmovies/embed?type=movie&id=tt{imdbId}" : "https://vidbox.dev/api/hdmovies/embed?type=tv&id=tt{imdbId}&s={season}&e={episode}",
    type: "iframe",
    description: "Vidbox Dev iframe"
  },
  {
    name: "Flicky Host",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://flicky.host/embed/movie/?id={tmdbId}" : "https://flicky.host/embed/tv/?id={tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "Flicky host embed"
  },
  {
    name: "VidSrc VIP",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vidsrc.vip/embed/movie/{tmdbId}" : "https://vidsrc.vip/embed/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "VidSrc VIP proxy"
  },
  {
    name: "111Movies COM",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://111movies.com/movie/{tmdbId}" : "https://111movies.com/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "111Movies alternative domain"
  },
  {
    name: "MoviesAPI Club",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://moviesapi.club/movie/{tmdbId}" : "https://moviesapi.club/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "MoviesAPI Club embed"
  },
  {
    name: "VidSrc RIP",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vidsrc.rip/embed/movie/{tmdbId}" : "https://vidsrc.rip/embed/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "VidSrc RIP proxy"
  },
  
  {
    name: "GoDrivePlayer",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://godriveplayer.com/player.php?type=movie&tmdb={tmdbId}" : "https://godriveplayer.com/player.php?type=series&tmdb={tmdbId}&season={season}&episode={episode}",
    type: "iframe",
    description: "GoDrivePlayer PHP embed"
  },
  {
    name: "VidSrc CC v2",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vidsrc.cc/v2/embed/movie/{tmdbId}" : "https://vidsrc.cc/v2/embed/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "VidSrc CC v2 embed"
  },
  {
    name: "VixSrc Direct",
    url: (type: 'movie' | 'tv') => type === 'movie' ? "https://vixsrc.to/movie/{tmdbId}" : "https://vixsrc.to/tv/{tmdbId}/{season}/{episode}",
    type: "iframe",
    description: "VixSrc non-embed direct route"
  }
];

function TestSourcesClient() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '85552'; 
  const initialType = (searchParams.get('type') || 'tv') as 'movie' | 'tv';
  const initialSeason = searchParams.get('season') ? parseInt(searchParams.get('season')!) : 1;
  const initialEpisode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : 1;

  const [id, setId] = useState(initialId);
  const [imdbId, setImdbId] = useState('12879782'); // Without tt prefix
  const [type, setType] = useState<'movie' | 'tv'>(initialType);
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [testLang, setTestLang] = useState('en');

  const [selectedSourceId, setSelectedSourceId] = useState(sources[0].id);
  const [useSandbox, setUseSandbox] = useState(true);
  
  const [customUrl, setCustomUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [isApiEndpoint, setIsApiEndpoint] = useState(false);
  const [useCorsProxy, setUseCorsProxy] = useState(false);
  const [useFrameProxy, setUseFrameProxy] = useState(false);
  const [corsProxyUrl, setCorsProxyUrl] = useState('https://corsproxy.io/?');
  const [iframeReferrerPolicy, setIframeReferrerPolicy] = useState<React.HTMLAttributeReferrerPolicy>('strict-origin-when-cross-origin');
  
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const [embedStrategy, setEmbedStrategy] = useState('embedstream');
  const [customStrategyTemplate, setCustomStrategyTemplate] = useState('https://embedme.top/embed/{source}/{id}');
  const [rawJsonView, setRawJsonView] = useState(false);

  const currentSource = getSource(selectedSourceId);
  
  let parsedMatches: any[] | null = null;
  try {
    if (apiResponse) {
       const obj = JSON.parse(apiResponse);
       if (Array.isArray(obj) && obj.length > 0 && obj[0].category && obj[0].sources) {
         parsedMatches = obj;
       }
    }
  } catch (e) {}

  const handleLiveSourceClick = (matchSource: any) => {
    let url = '';
    if (embedStrategy === 'embedstream') url = `https://embedstream.me/${matchSource.id}`;
    else if (embedStrategy === 'streamedpk') url = `https://streamed.pk/embed/${matchSource.source}?id=${matchSource.id}`;
    else if (embedStrategy === 'vipleague') url = `https://vipleague.im/embed/${matchSource.id}`;
    else if (embedStrategy === 'dlhd') url = `https://dlhd.so/embed/stream-${matchSource.id}.php`;
    else if (embedStrategy === 'custom') url = customStrategyTemplate.replace('{source}', matchSource.source).replace('{id}', matchSource.id);
    
    setCustomUrl(url);
    setUseCustomUrl(true);
    setIsApiEndpoint(false);
    setUseCorsProxy(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Logic to process the URL dynamically
  const getProcessedUrl = () => {
    let rawUrl = '';
    
    if (useCustomUrl && customUrl) {
       rawUrl = customUrl;
       
       // Auto-detect videasy or similar base patterns if pasted without placeholders
       if (rawUrl.endsWith('/movie/')) {
           rawUrl += '{tmdbId}';
       } else if (rawUrl.endsWith('/tv/')) {
           rawUrl += '{tmdbId}/{season}/{episode}';
       }
       
       // Replace placeholders
       return rawUrl
          .replace(/\{tmdbId\}/g, id)
          .replace(/\{imdbId\}/g, imdbId)
          .replace(/\{season\}/g, season.toString())
          .replace(/\{episode\}/g, episode.toString())
          .replace(/\{type\}/g, type);
    }
    
    return currentSource ? currentSource.url(type, id, season, episode, undefined, testLang) : '';
  };

  const getProxiedEmbedUrl = (url: string) => {
    if (useFrameProxy && !isApiEndpoint) {
      return `/api/iframe-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const embedUrl = getProxiedEmbedUrl(getProcessedUrl());

  const handleSourceChange = (newSourceId: string) => {
    const s = getSource(newSourceId);
    setSelectedSourceId(s.id);
    setUseSandbox(true);
    setUseCustomUrl(false);
    setIsApiEndpoint(s.type === 'api');
  };
  
  // Effect for fetching API endpoints automatically when URL changes
  useEffect(() => {
     if (isApiEndpoint && embedUrl && embedUrl.startsWith('http')) {
        setApiLoading(true);
        const isLocalhost = embedUrl.includes('localhost') || embedUrl.includes('127.0.0.1');
        const fetchUrl = (useCorsProxy && !isLocalhost) 
          ? `${corsProxyUrl}${encodeURIComponent(embedUrl)}`
          : embedUrl;

        fetch(fetchUrl)
          .then(res => res.json().catch(() => res.text()))
          .then(data => {
             setApiResponse(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
             setApiLoading(false);
          })
          .catch(err => {
             setApiResponse(`Error: ${err.message}\n\nTip: If you get a CORS or Network error, try enabling the "Fetch via CORS Proxy" option below!`);
             setApiLoading(false);
          });
     }
  }, [embedUrl, isApiEndpoint, useCorsProxy, corsProxyUrl]);

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 md:px-8 flex flex-col gap-8 max-w-7xl mx-auto font-sans">
      <AnimatedBackground />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 font-bold uppercase tracking-wider text-xs transition-colors">
            <ArrowLeft size={16} /> Back to App
          </Link>
          <h1 className="text-3xl md:text-5xl font-display font-black text-white mb-2 tracking-tight">Source Laboratory</h1>
          <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed">
            Evaluate streaming APIs, investigate unused resources, and analyze network behavior. Supports dynamic parsing for <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded mx-0.5">{'{tmdbId}'}</code>, <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded mx-0.5">{'{imdbId}'}</code>, <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded mx-0.5">{'{season}'}</code>, and <code className="text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded mx-0.5">{'{episode}'}</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-void-900 border border-zinc-800 rounded-lg px-4 py-2 flex flex-col items-center justify-center">
             <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Sources</span>
             <span className="text-white font-black text-xl">{sources.length}</span>
          </div>
          <div className="bg-void-900 border border-brand-500/30 rounded-lg px-4 py-2 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.1)]">
             <span className="text-xs text-brand-400 uppercase tracking-widest font-bold">Unused Found</span>
             <span className="text-white font-black text-xl">{UNUSED_RESOURCES.length}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Target Media Box */}
          <div className="bg-void-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-5 flex items-center gap-2">
              <Database size={16} className="text-brand-500" /> Target Media
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex bg-void-900 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => setType('movie')}
                  className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${type === 'movie' ? 'bg-brand-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  Movie
                </button>
                <button
                  onClick={() => setType('tv')}
                  className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${type === 'tv' ? 'bg-brand-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  TV Show
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">TMDB ID</label>
                  <input
                    type="text"
                    value={id}
                    onChange={e => setId(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-700"
                    placeholder="e.g. 157336"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">IMDB ID <span className="opacity-50 lowercase">w/o 'tt'</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">tt</span>
                    <input
                      type="text"
                      value={imdbId}
                      onChange={e => setImdbId(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-700"
                      placeholder="12879782"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Language</label>
                  <select
                    value={testLang}
                    onChange={e => setTestLang(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="en">English (en)</option>
                    <option value="hindi">Hindi (hindi)</option>
                    <option value="telugu">Telugu (telugu)</option>
                    <option value="tamil">Tamil (tamil)</option>
                    <option value="malayalam">Malayalam (malayalam)</option>
                    <option value="kannada">Kannada (kannada)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="zh">Mandarin (zh)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="ru">Russian (ru)</option>
                    <option value="ar">Arabic (ar)</option>
                  </select>
                </div>
              </div>

              {type === 'tv' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Season</label>
                    <input
                      type="number"
                      value={season}
                      onChange={e => setSeason(parseInt(e.target.value) || 1)}
                      className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      min="1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Episode</label>
                    <input
                      type="number"
                      value={episode}
                      onChange={e => setEpisode(parseInt(e.target.value) || 1)}
                      className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Providers List */}
          <div className="bg-void-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col flex-1 max-h-[500px]">
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Server size={16} className="text-emerald-500" /> Active Providers
            </h2>
            <div data-lenis-prevent="true" className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {sources.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSourceChange(s.id)}
                  className={`flex flex-col text-left px-4 py-3 rounded-xl transition-all border ${selectedSourceId === s.id && !useCustomUrl ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'bg-black/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${selectedSourceId === s.id && !useCustomUrl ? 'bg-brand-500 shadow-[0_0_8px_rgba(124,58,237,1)]' : 'bg-zinc-600'}`} />
                    <span className="font-bold text-sm tracking-wide">{s.name}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                        {s.tier === 1 && <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Tier 1</span>}
                        {s.tier === 2 && <span className="text-[9px] uppercase tracking-wider bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-bold">Tier 2</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 break-all leading-relaxed font-mono opacity-80">{s.url(type, id, season, episode).split('?')[0]}...</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Player & Sandbox (Col Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Output / Player Box */}
          <div className="bg-void-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Toolbar above player */}
            <div className="bg-black/60 border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
              
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  {isApiEndpoint ? <Terminal size={14} className="text-brand-400" /> : <Play size={14} className="text-brand-400" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Resolved URL</span>
                  <span className="text-xs font-mono text-zinc-300 truncate w-full pr-4">{embedUrl || 'Waiting for URL...'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Sandbox Toggle (Moved here per request) */}
                {!isApiEndpoint && (
                  <div className="flex items-center gap-2 bg-void-900 border border-zinc-800 rounded-lg px-3 py-1.5" title="Toggle Iframe Sandbox">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      {useSandbox ? <Shield size={12} className="text-emerald-500" /> : <ShieldOff size={12} className="text-orange-500" />}
                      Sandbox
                    </span>
                    <button
                      onClick={() => setUseSandbox(!useSandbox)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useSandbox ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useSandbox ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )}
                
                <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors border border-white/5">
                  <ExternalLink size={14} /> Open
                </a>
              </div>
            </div>

            {/* Video / API Panel */}
            <div className="w-full aspect-video bg-black relative">
              {!embedUrl ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
                    <Search size={32} className="opacity-50" />
                    <span className="font-bold uppercase tracking-widest text-sm">Select a provider or enter a custom URL</span>
                 </div>
              ) : isApiEndpoint ? (
                 <div className="w-full h-full bg-[#0a080c] p-6 overflow-auto custom-scrollbar relative border-t border-zinc-900/50">
                     {apiLoading ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4 bg-black/50 backdrop-blur-sm z-10">
                             <div className="w-8 h-8 border-2 border-t-brand-500 border-zinc-800 rounded-full animate-spin" />
                             <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse text-brand-400">Fetching API...</span>
                         </div>
                     ) : parsedMatches && !rawJsonView ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-500 gap-3">
                             <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                               <Database size={24} className="text-emerald-400" />
                             </div>
                             <span className="text-sm font-bold uppercase tracking-widest text-emerald-400">Live Matches Parsed</span>
                             <span className="text-xs text-emerald-500/70 font-medium">Scroll down to view the Live Sports Dashboard</span>
                             <button onClick={() => setRawJsonView(true)} className="mt-4 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-300 underline underline-offset-4">View Raw JSON Instead</button>
                         </div>
                     ) : apiResponse ? (
                         <div className="h-full flex flex-col">
                            {parsedMatches && <button onClick={() => setRawJsonView(false)} className="mb-4 self-start bg-zinc-800 text-xs text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors font-bold uppercase tracking-wider">Show Live UI</button>}
                            <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed flex-1">{apiResponse}</pre>
                         </div>
                     ) : (
                         <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center text-zinc-600">
                             <AlertCircle size={32} className="opacity-50" />
                             <span className="text-xs uppercase tracking-widest font-bold">No response</span>
                         </div>
                     )}
                 </div>
              ) : (
                 <iframe
                   key={`tester-${embedUrl}-${useSandbox ? 'sandboxed' : 'open'}-${iframeReferrerPolicy}`}
                   src={embedUrl}
                   className="w-full h-full border-0 bg-black"
                   allowFullScreen
                   referrerPolicy={iframeReferrerPolicy}
                   sandbox={useSandbox ? (currentSource?.sandboxFlags || (currentSource?.tier === 1 ? TIER_1_SANDBOX : TIER_2_SANDBOX)) : undefined}
                 />
              )}
            </div>
            
            {/* API Controls Footer (Only shown when Custom URL or API is active) */}
            <div className="bg-void-900/50 border-t border-zinc-800 px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Custom Endpoint Testing</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customUrl}
                      onChange={e => { setCustomUrl(e.target.value); setUseCustomUrl(true); }}
                      onFocus={() => setUseCustomUrl(true)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-brand-500 transition-colors placeholder:text-zinc-700"
                      placeholder="https://your-custom-url.com/{tmdbId}"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-3 shrink-0 bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={isApiEndpoint} 
                          onChange={(e) => setIsApiEndpoint(e.target.checked)} 
                          className="accent-brand-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-wider">JSON API</span>
                      </label>
                      
                      <div className="w-[1px] h-4 bg-zinc-800" />
                      
                      <label className={`flex items-center gap-2 cursor-pointer group ${!isApiEndpoint ? 'opacity-30 pointer-events-none' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={useCorsProxy} 
                          onChange={(e) => setUseCorsProxy(e.target.checked)} 
                          className="accent-brand-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-wider">CORS Proxy</span>
                      </label>

                      <div className="w-[1px] h-4 bg-zinc-800 hidden sm:block" />

                      <div className={`flex items-center gap-2 ${isApiEndpoint ? 'opacity-30 pointer-events-none' : ''}`}>
                         <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Referrer:</span>
                         <select 
                           value={iframeReferrerPolicy}
                           onChange={e => setIframeReferrerPolicy(e.target.value as React.HTMLAttributeReferrerPolicy)}
                           className="bg-transparent text-xs text-brand-400 font-bold uppercase focus:outline-none cursor-pointer"
                         >
                           <option value="strict-origin-when-cross-origin">Default</option>
                           <option value="no-referrer">No-Referrer</option>
                           <option value="origin">Origin</option>
                           <option value="unsafe-url">Unsafe-URL</option>
                         </select>
                      </div>

                      <div className="w-[1px] h-4 bg-zinc-800 hidden sm:block" />

                      <label className={`flex items-center gap-2 cursor-pointer group ${isApiEndpoint ? 'opacity-30 pointer-events-none' : ''}`} title="Proxy the iframe to strip X-Frame-Options blocking">
                        <input 
                          type="checkbox" 
                          checked={useFrameProxy} 
                          onChange={(e) => setUseFrameProxy(e.target.checked)} 
                          className="accent-brand-500 w-4 h-4 rounded shrink-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors uppercase tracking-wider">Strip Frame Protection</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional CORS Selection */}
              {isApiEndpoint && useCorsProxy && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                  <CornerDownRight />
                  <select
                    value={corsProxyUrl}
                    onChange={e => setCorsProxyUrl(e.target.value)}
                    className="flex-1 bg-black/80 border border-brand-500/30 rounded-lg px-3 py-2 text-xs text-brand-100 font-mono focus:outline-none focus:border-brand-500"
                  >
                    <option value="https://corsproxy.io/?">CORSProxy.io (Fast, direct)</option>
                    <option value="https://api.allorigins.win/raw?url=">AllOrigins.win (Bypass rate limits)</option>
                    <option value="https://api.codetabs.com/v1/proxy?quest=">CodeTabs Proxy (Fallback)</option>
                  </select>
                </div>
              )}
            </div>

          </div>

          {/* New Section: Live Sports Dashboard (Only visible when parsedMatches exists) */}
          {parsedMatches && (
            <div className="bg-void-950/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.05)] mt-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-emerald-500/5 border-b border-emerald-500/20 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Play className="text-emerald-400 fill-emerald-400/20" size={18} />
                  <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400">Live Sports Dashboard</h2>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">{parsedMatches.length} Events</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Embed Strategy:</label>
                   <select 
                     value={embedStrategy}
                     onChange={e => setEmbedStrategy(e.target.value)}
                     className="bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider focus:outline-none focus:border-emerald-500"
                   >
                     <option value="embedstream">EmbedStream.me</option>
                     <option value="streamedpk">Streamed.pk Native</option>
                     <option value="vipleague">VIPLeague Proxy</option>
                     <option value="dlhd">DaddyLiveHD (dlhd.so)</option>
                     <option value="custom">Custom Template</option>
                   </select>
                </div>
              </div>
              
              {embedStrategy === 'custom' && (
                <div className="px-6 pt-4 pb-2 border-b border-zinc-800 bg-black/20">
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Custom Embed Template</label>
                   <input
                     type="text"
                     value={customStrategyTemplate}
                     onChange={e => setCustomStrategyTemplate(e.target.value)}
                     className="w-full bg-black/60 border border-zinc-800 rounded-lg px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
                     placeholder="https://myproxy.com/{source}/{id}"
                   />
                   <p className="text-[10px] text-zinc-500 mt-1.5">Available variables: <code className="text-brand-400">{'{source}'}</code>, <code className="text-brand-400">{'{id}'}</code></p>
                </div>
              )}
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                 {parsedMatches.map((match: any, idx: number) => (
                    <div key={match.id || idx} className="bg-void-900 border border-zinc-800 hover:border-emerald-500/30 rounded-xl p-4 flex flex-col gap-3 transition-colors group">
                       <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">{match.category || 'Event'}</span>
                          {match.popular && <span className="text-[9px] uppercase font-black tracking-widest text-orange-400 flex items-center gap-1"><Shield size={10} className="fill-orange-500/20" /> HOT</span>}
                       </div>
                       
                       <h3 className="text-sm font-bold text-white leading-snug group-hover:text-emerald-400 transition-colors">{match.title}</h3>
                       
                       {match.teams && (
                         <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs text-zinc-400 truncate flex-1">{match.teams.home?.name}</span>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase">vs</span>
                            <span className="text-xs text-zinc-400 truncate flex-1 text-right">{match.teams.away?.name}</span>
                         </div>
                       )}
                       
                       {match.date && (
                         <span className="text-[10px] text-zinc-500 font-mono mt-auto pt-2 border-t border-zinc-800/50">
                           {new Date(match.date).toLocaleString()}
                         </span>
                       )}
                       
                       <div className="flex flex-wrap gap-2 mt-2">
                         {match.sources?.map((s: any, sIdx: number) => (
                            <button
                               key={`${match.id}-${s.id}-${sIdx}`}
                               onClick={() => handleLiveSourceClick(s)}
                               className="flex items-center gap-1.5 bg-black hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/50 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                               <Play size={10} className="text-emerald-500" />
                               <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{s.source}</span>
                            </button>
                         ))}
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {/* New Section: Unused Resources & Network Logs */}
          <div className="bg-void-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-xl mt-4">
            <div className="bg-brand-500/5 border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
              <LayoutGrid className="text-brand-400" size={18} />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Unused / Experimental Resources</h2>
              <span className="ml-auto text-[10px] text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full border border-brand-500/20 font-bold uppercase">Discovered in Spy Logs</span>
            </div>
            
            <div className="p-6">
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                These endpoints were intercepted in the wild but are not currently implemented in <code className="text-zinc-300">sources.ts</code>. Click any item to load it into the custom tester above.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {UNUSED_RESOURCES.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomUrl(res.url(type));
                      setUseCustomUrl(true);
                      setIsApiEndpoint(res.type === 'api');
                      setUseCorsProxy(res.type === 'api'); // Default on for APIs
                      
                      // Auto-scroll to top to see result
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex flex-col text-left p-3.5 rounded-xl border border-zinc-800/80 bg-void-900/50 hover:bg-void-800 hover:border-brand-500/40 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-150 group-hover:bg-brand-500/10 transition-transform duration-500" />
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <span className="text-sm font-bold text-zinc-200 group-hover:text-brand-400 transition-colors">{res.name}</span>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${res.type === 'api' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {res.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 leading-tight mb-2 relative z-10">{res.description}</span>
                    <span className="text-[9px] text-zinc-600 font-mono truncate w-full mt-auto relative z-10">{res.url(type)}</span>
                  </button>
                ))}
              </div>
              
              {/* Presets Grid */}
              <div className="mt-8 pt-6 border-t border-zinc-800/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Internal Scraper Presets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {API_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCustomUrl(preset.url);
                        setUseCustomUrl(true);
                        setIsApiEndpoint(true);
                        setUseCorsProxy(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex flex-col text-left px-4 py-3 rounded-lg bg-black/40 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80 transition-colors group"
                    >
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-white mb-1 transition-colors">{preset.name}</span>
                      <span className="text-[10px] text-zinc-500 leading-snug mb-1.5">{preset.notes}</span>
                      <span className="text-[9px] text-zinc-600 font-mono truncate w-full">{preset.url}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Custom icon for the arrow
function CornerDownRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 shrink-0 ml-1">
      <polyline points="15 10 20 15 15 20"></polyline>
      <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
    </svg>
  );
}

export default function TestSourcesPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <TestSourcesClient />
    </Suspense>
  );
}
