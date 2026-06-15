'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { Play, Pause, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';

interface YoutubeBackgroundPlayerProps {
  videoKey: string | null;
  backdropPath: string | null;
  title: string;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function YoutubeBackgroundPlayer({ videoKey, backdropPath, title, onPlayingChange }: YoutubeBackgroundPlayerProps) {
  const { preferences } = usePreferences();
  const dataSaver = preferences.dataSaver ?? false;
  const [isPlaying, setIsPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    setIsPaused(false);
    setIsMuted(true);

    if (!videoKey) {
      setFailed(true);
      return;
    }

    setIsPlaying(false);
    setFailed(false);

    let isMounted = true;
    
    // Generous 12-second failsafe timeout to prevent premature cutoffs on slow connections
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.debug('[YoutubeBackgroundPlayer] Failsafe triggered, falling back to poster.');
        }
        setFailed(true);
      }
    }, 12000);

    const handleMessage = (e: MessageEvent) => {
      if (!isMounted) return;
      if (!e.origin.includes('youtube.com') && !e.origin.includes('youtube-nocookie.com')) return;

      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        
        // Handle player state changes
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.playerState === 1) {
            setIsPlaying(true);
            clearTimeout(timeoutId);
          }
          if (data.info.errorCode) {
            setFailed(true);
            clearTimeout(timeoutId);
          }
        }
        
        if (data.event === 'onStateChange' && data.info === 1) {
          setIsPlaying(true);
          clearTimeout(timeoutId);
        }

        if (data.event === 'onError') {
          setFailed(true);
          clearTimeout(timeoutId);
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, [videoKey]);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents click bubbling to trigger the details play state
    if (typeof window === 'undefined') return;

    const nextState = !isPaused;
    setIsPaused(nextState);

    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: nextState ? 'pauseVideo' : 'playVideo',
        args: '',
      }),
      '*'
    );
  };

  const handleMuteUnmute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents click bubbling
    if (typeof window === 'undefined') return;

    const nextState = !isMuted;
    setIsMuted(nextState);

    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func: nextState ? 'mute' : 'unMute',
        args: '',
      }),
      '*'
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
      {/* 1. Backdrop Poster (Always rendered behind, visible initially or if playback fails) */}
      <Image
        src={getImageUrl(backdropPath, 'original')}
        alt={title}
        fill
        sizes="100vw"
        className={`object-cover transition-opacity duration-1000 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-60'}`}
        priority
      />

      {/* 2. YouTube Background Iframe — only loaded when Data Saver is OFF */}
      {videoKey && !failed && !dataSaver && (
        <div 
          className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-opacity duration-1000 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <iframe
            suppressHydrationWarning
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&enablejsapi=1`}
            className="w-full h-full md:w-[150%] md:h-[150%] md:-translate-x-[16.6%] md:-translate-y-[16.6%] max-w-none border-0"
            allow="autoplay; encrypted-media"
            style={{ border: 0 }}
            onLoad={() => {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
              }
              setTimeout(() => {
                setIsPlaying(true);
              }, 4000);
            }}
          />
        </div>
      )}

      {/* 2b. Data Saver badge — shown instead of trailer */}
      {dataSaver && (
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <WifiOff size={10} />
          Data Saver ON
        </div>
      )}

      {/* 3. Controls (Play/Pause & Mute/Unmute) - Only visible when trailer is actively playing */}
      {isPlaying && !failed && (
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-30 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-black/55 hover:bg-black/75 hover:border-white/20 backdrop-blur-md text-white transition-all duration-200 active:scale-90 hover:scale-105 shadow-xl cursor-pointer"
            title={isPaused ? "Play Trailer" : "Pause Trailer"}
          >
            {isPaused ? <Play size={16} className="text-white fill-white" /> : <Pause size={16} className="text-white fill-white" />}
          </button>
          <button
            onClick={handleMuteUnmute}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-black/55 hover:bg-black/75 hover:border-white/20 backdrop-blur-md text-white transition-all duration-200 active:scale-90 hover:scale-105 shadow-xl cursor-pointer"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
          </button>
        </div>
      )}
    </div>
  );
}
