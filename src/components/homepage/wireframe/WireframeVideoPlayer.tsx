'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Maximize2, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface WireframeVideoPlayerProps {
  title: string;
  badge?: string;
  posterSrc: string;
  videoSrc?: string;
  className?: string;
  durationSec?: number;
  autoPlay?: boolean;
}

export default function WireframeVideoPlayer({
  title,
  badge = 'Interactive Scroll',
  posterSrc,
  videoSrc,
  className = '',
  durationSec = 90,
  autoPlay = true,
}: WireframeVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasUserManuallyPausedRef = useRef<boolean>(false);

  // Autoplay when the user scrolls into this section (IntersectionObserver)
  useEffect(() => {
    if (!autoPlay) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // User scrolled into this section
          if (!hasUserManuallyPausedRef.current) {
            setIsPlaying(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                // If browser autoplay policy requires user gesture, keep state graceful
              });
            }
          }
        } else {
          // User scrolled away from this section: pause video to save CPU/GPU
          setIsPlaying(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      {
        threshold: 0.25, // Trigger when 25% of the video player is in view
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [autoPlay]);

  // Auto-scroll simulation when playing without actual video source
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !videoSrc) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Loop back smoothly in simulation
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return 0;
          }
          return prev + 1;
        });

        if (scrollContainerRef.current) {
          const el = scrollContainerRef.current;
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll > 0) {
            const nextScroll = (progress / 100) * maxScroll;
            el.scrollTo({ top: nextScroll, behavior: 'smooth' });
          }
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress, videoSrc]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    hasUserManuallyPausedRef.current = !nextState;

    if (videoRef.current) {
      if (nextState) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(0);
    setIsPlaying(true);
    hasUserManuallyPausedRef.current = false;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const formatTime = (pct: number) => {
    const total = durationSec;
    const current = Math.floor((pct / 100) * total);
    const m = Math.floor(current / 60);
    const s = current % 60;
    const tm = Math.floor(total / 60);
    const ts = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} / ${tm}:${ts < 10 ? '0' : ''}${ts}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[24px] overflow-hidden bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/80 shadow-[0_4px_70px_12px_rgba(0,0,0,0.25)] group ${className}`}
      data-testid="wireframe-video-player"
    >
      {/* Top Browser / Document Header Bar (Figma style) */}
      <div className="h-11 px-4.5 bg-[#f8fafc] dark:bg-muted/40 border-b border-[#e2e8f0] dark:border-border/70 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#f87171] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#fbbf24] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#34d399] inline-block" />
          <span className="ml-2 text-xs font-semibold text-[#64748b] dark:text-muted-foreground font-mono truncate max-w-[220px] sm:max-w-[360px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#e8eeff] text-[#1f3faf] dark:bg-blue-950/70 dark:text-blue-300 text-[10.5px] font-bold font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] animate-pulse" />
            {badge}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-mono">
            4K
          </span>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={scrollContainerRef}
        onClick={togglePlay}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[1263/711] overflow-y-auto overflow-x-hidden bg-[#0f172a] cursor-pointer scrollbar-thin scrollbar-thumb-slate-300"
      >
        {/* Real Video or High-res Document Screenshot */}
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            playsInline
            muted={isMuted}
            loop
            preload="metadata"
            onTimeUpdate={() => {
              if (videoRef.current) {
                const current = videoRef.current.currentTime;
                const total = videoRef.current.duration || durationSec;
                if (total > 0) {
                  setProgress((current / total) * 100);
                }
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="relative w-full min-h-full">
            <Image
              src={posterSrc}
              alt={title}
              width={1280}
              height={720}
              className="w-full h-auto object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-[1.01]"
              priority
            />
          </div>
        )}

        {/* Ambient Dark Gradient Vignette for Video Look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Floating Centered Play/Pause Button Overlay (Hidden when playing, visible on hover) */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 dark:bg-black/90 backdrop-blur-md shadow-2xl flex items-center justify-center text-[#3c61dd] transform transition-transform group-hover:scale-110 active:scale-95">
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
            )}
          </div>
        </div>

        {/* Bottom Video Controls Strip */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white flex flex-col gap-2 select-none z-10"
        >
          {/* Progress Bar */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
              setProgress(newPct);
              if (videoRef.current) {
                const total = videoRef.current.duration || durationSec;
                videoRef.current.currentTime = (newPct / 100) * total;
              }
            }}
            className="w-full h-1.5 bg-white/30 hover:h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
          >
            <div
              className="h-full bg-[#3c61dd] rounded-full transition-all relative"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls & Time */}
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="hover:text-[#60a5fa] transition-colors p-1"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="hover:text-[#60a5fa] transition-colors p-1"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] text-white/90 font-medium">
                {formatTime(progress)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleMute}
                className="hover:text-[#60a5fa] transition-colors p-1"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (scrollContainerRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      scrollContainerRef.current.requestFullscreen?.();
                    }
                  }
                }}
                className="hover:text-[#60a5fa] transition-colors p-1"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
