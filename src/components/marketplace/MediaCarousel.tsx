'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';

type MediaSlide =
  | { type: 'video'; url: string }
  | { type: 'image'; url: string; alt?: string };

interface Props {
  video?: { url: string; durationSeconds?: number } | null;
  gallery?: { id: string; url: string; displayOrder: number }[];
  altTitle?: string;
}

const AUTO_ADVANCE_MS = 5000;

export function MediaCarousel({ video, gallery, altTitle }: Props) {
  // 1. Build the ordered slides array: video first (if present), then gallery images sorted by displayOrder
  const slides: MediaSlide[] = [];
  if (video?.url) {
    slides.push({ type: 'video', url: video.url });
  }
  (gallery ?? [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((g) => slides.push({ type: 'image', url: g.url, alt: altTitle }));

  const [index, setIndex] = useState(0);
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = slides[index];
  const hasSlides = slides.length > 0;

  // 2. Auto-advance timer — only for image slides, not for video slides
  useEffect(() => {
    if (slides.length <= 1) return;
    if (current?.type === 'video') return; // Video slide doesn't auto-advance

    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [index, current?.type, slides.length]);

  // 3. Video hover — play/pause behavior
  useEffect(() => {
    if (current?.type !== 'video' || !videoRef.current) return;

    if (isHoveringVideo) {
      videoRef.current.play().catch(() => {
        // Silent catch — autoplay may be blocked
      });
    } else {
      videoRef.current.pause();
      // Reset to first frame so poster is visible when idle
      videoRef.current.currentTime = 0;
    }
  }, [isHoveringVideo, current?.type, index]);

  // Reset hover state when slide changes
  useEffect(() => {
    setIsHoveringVideo(false);
  }, [index]);

  // Empty state. Must come after every hook: gallery data arrives async, so an
  // early return above would change hook count between renders once it populates.
  if (!hasSlides) {
    return (
      <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      {current.type === 'image' && (
        <img
          src={resolveProviderMediaUrl(current.url)}
          alt={current.alt ?? 'Service image'}
          className="w-full h-full object-cover"
        />
      )}

      {current.type === 'video' && (
        <div
          className="w-full h-full"
          onMouseEnter={() => setIsHoveringVideo(true)}
          onMouseLeave={() => setIsHoveringVideo(false)}
        >
          <video
            ref={videoRef}
            src={resolveProviderMediaUrl(current.url)}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>
      )}

      {/* Prev/Next arrows — only shown if multiple slides, hidden by default and appear on hover */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2
                       bg-background/70 hover:bg-background/90
                       rounded-full p-2 shadow-md
                       opacity-0 group-hover:opacity-100
                       transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2
                       bg-background/70 hover:bg-background/90
                       rounded-full p-2 shadow-md
                       opacity-0 group-hover:opacity-100
                       transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Slide counter overlay (top-right) */}
      {slides.length > 1 && (
        <div className="absolute top-2 right-2 bg-background/70
                        text-foreground text-xs px-2 py-1 rounded-md">
          {index + 1} / {slides.length}
        </div>
      )}
    </div>
  );
}
