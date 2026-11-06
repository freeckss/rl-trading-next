'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { UnitImage } from '@/types/database';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Camera,
  Car,
} from 'lucide-react';

interface PhotoGalleryProps {
  images?: UnitImage[];
  unitTitle: string;
}

export default function PhotoGallery({ images = [], unitTitle }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  const totalPhotos = images.length;
  const currentImage = images[activeIndex];

  // Safe navigation handlers
  const handlePrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? totalPhotos - 1 : prev - 1));
  }, [totalPhotos]);

  const handleNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev === totalPhotos - 1 ? 0 : prev + 1));
  }, [totalPhotos]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Keep active thumbnail visible in scroll view
  useEffect(() => {
    if (!thumbnailStripRef.current) return;
    const activeThumb = thumbnailStripRef.current.children[activeIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (diff > minSwipeDistance) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -minSwipeDistance) {
      // Swiped right -> prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // If no photos exist, show clean fallback placeholder
  if (totalPhotos === 0 || !currentImage) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 aspect-[16/10] w-full flex flex-col items-center justify-center text-zinc-500 gap-3 p-8 text-center">
        <div className="p-4 rounded-full bg-zinc-800/80 text-zinc-400">
          <Car className="w-12 h-12" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-zinc-300">No Photos Available</h4>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Detailed showcase images for this vehicle will be uploaded shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Showcase Image Display */}
      <div
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 cursor-pointer shadow-xl select-none"
        onClick={() => setIsLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={currentImage.image_url}
          alt={`${unitTitle} - Photo ${activeIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 65vw"
          priority
          className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Counter Badge & Expand Hint */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-semibold border border-white/10 shadow-lg">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {activeIndex + 1} / {totalPhotos}
            </span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-zinc-300 text-xs font-medium border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand</span>
          </span>
        </div>

        {/* Previous & Next Arrow Buttons on Main Display */}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Scrollable Thumbnail Strip (Up to 40 photos) */}
      {totalPhotos > 1 && (
        <div
          ref={thumbnailStripRef}
          className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar select-none"
        >
          {images.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Select photo ${idx + 1}`}
                className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.03]'
                    : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                <Image
                  src={img.image_url}
                  alt={`${unitTitle} thumbnail ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Full-Screen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar with Title, Counter, and Close Button */}
          <div
            className="flex items-center justify-between text-white py-2 px-2 max-w-7xl mx-auto w-full z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                {unitTitle}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-xs font-semibold text-amber-400">
                {activeIndex + 1} / {totalPhotos}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close full-screen lightbox"
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Full-Screen Photo Container */}
          <div
            className="relative flex-1 flex items-center justify-center my-2 max-w-7xl mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full h-full max-h-[75vh]">
              <Image
                src={currentImage.image_url}
                alt={`${unitTitle} - Full Screen ${activeIndex + 1}`}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>

            {/* Lightbox Nav Arrows */}
            {totalPhotos > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous photo in lightbox"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 transition-transform active:scale-95 shadow-2xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next photo in lightbox"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 transition-transform active:scale-95 shadow-2xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails Strip */}
          {totalPhotos > 1 && (
            <div
              className="flex items-center justify-center gap-2 overflow-x-auto py-2 max-w-4xl mx-auto w-full no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={`lightbox-${img.id || idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border transition-all ${
                    idx === activeIndex
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                      : 'border-zinc-800 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

