'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Expand, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleImageGalleryProps {
  images?: string[];
  alt?: string;
  className?: string;
}

function ImageWithFallback({
  src,
  alt,
  className,
  fill,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-300', className)}>
        <Camera className="h-10 w-10" strokeWidth={1} />
        <span className="text-[10px] font-medium uppercase tracking-[0.15em]">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}

export function VehicleImageGallery({ images = [], alt = 'Vehicle', className }: VehicleImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const displayImages = images.filter(Boolean);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && selectedIndex > 0) {
      setSelectedIndex((p) => p - 1);
    }
    if (e.key === 'ArrowRight' && selectedIndex < displayImages.length - 1) {
      setSelectedIndex((p) => p + 1);
    }
    if (e.key === 'Escape') {
      setIsDialogOpen(false);
    }
  }, [selectedIndex, displayImages.length]);

  // Empty state
  if (displayImages.length === 0) {
    return (
      <div className={cn('relative overflow-hidden rounded-[10px] border border-gray-200 bg-gray-50 aspect-[4/3] flex flex-col items-center justify-center gap-3', className)}>
        <Camera className="h-16 w-16 text-gray-200" strokeWidth={1} />
        <div className="text-center">
          <p className="font-[Oswald] text-sm font-bold uppercase tracking-wider text-gray-300">No Photo Available</p>
          <p className="text-[11px] text-gray-300 mt-1">Photos will be added soon</p>
        </div>
      </div>
    );
  }

  // Single image — no thumbnails
  if (displayImages.length === 1) {
    return (
      <div className={cn('space-y-3', className)}>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="relative group overflow-hidden rounded-[10px] border border-gray-200 bg-gray-50">
            <div className="aspect-[4/3] relative w-full">
              <ImageWithFallback
                src={displayImages[0]}
                alt={`${alt} — main photo`}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-3 right-3 z-10 rounded-full bg-black/50 hover:bg-gray-900 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                aria-label="View fullscreen"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </div>
          <DialogContent className="max-w-7xl w-full h-[90vh] p-2 sm:p-0 bg-black/95 border-none" onKeyDown={handleKeyDown}>
            <button onClick={() => setIsDialogOpen(false)} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white transition-colors" aria-label="Close">
              <X className="h-6 w-6" />
            </button>
            <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
              <img src={displayImages[0]} alt={`${alt} — fullscreen`} className="max-w-full max-h-full object-contain" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Multiple images — thumbnails + carousel
  return (
    <div className={cn('space-y-3', className)} role="region" aria-label="Vehicle image gallery">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Main Image */}
        <div className="relative group overflow-hidden rounded-[10px] border border-gray-200 bg-gray-50">
          <div className="aspect-[4/3] relative w-full">
            <ImageWithFallback
              src={displayImages[selectedIndex]}
              alt={`${alt} — photo ${selectedIndex + 1} of ${displayImages.length}`}
              className="object-cover transition-transform duration-500"
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              priority={selectedIndex === 0}
            />
          </div>

          {/* Counter badge */}
          <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums">
            {selectedIndex + 1} / {displayImages.length}
          </div>

          {/* Fullscreen trigger */}
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 hover:bg-gray-900 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm"
              aria-label="View fullscreen"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          {/* Nav arrows on main image */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={() => setSelectedIndex((p) => (p > 0 ? p - 1 : displayImages.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={() => setSelectedIndex((p) => (p < displayImages.length - 1 ? p + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Fullscreen Dialog */}
          <DialogContent className="max-w-7xl w-full h-[90vh] p-2 sm:p-0 bg-black/95 border-none" onKeyDown={handleKeyDown}>
            <button onClick={() => setIsDialogOpen(false)} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white transition-colors" aria-label="Close fullscreen">
              <X className="h-6 w-6" />
            </button>
            <Carousel
              className="w-full h-full flex flex-col"
              opts={{ startIndex: selectedIndex, loop: true }}
              setApi={(api) => {
                if (!api) return;
                api.on('select', () => setSelectedIndex(api.selectedScrollSnap()));
              }}
            >
              <div className="absolute top-4 left-4 z-50 text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md text-sm tabular-nums">
                {selectedIndex + 1} / {displayImages.length}
              </div>
              <CarouselContent className="h-full flex-1 ml-0">
                {displayImages.map((src, idx) => (
                  <CarouselItem key={idx} className="relative h-full flex items-center justify-center pl-0">
                    <div className="relative w-full h-full p-4 sm:p-6 md:p-16">
                    <img
                      src={src}
                      alt={`${alt} — fullscreen ${idx + 1}`}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute inset-y-0 left-4 flex items-center">
              <CarouselPrevious className="relative left-0 translate-y-0 h-12 w-12 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm" />
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center">
              <CarouselNext className="relative right-0 translate-y-0 h-12 w-12 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm" />
            </div>
          </Carousel>
        </DialogContent>
      </Dialog>

      {/* Thumbnails Strip */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {displayImages.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                'relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 overflow-hidden rounded-md border-2 transition-all duration-150',
                selectedIndex === idx
                  ? 'border-signal-red ring-1 ring-signal-red/30'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300',
              )}
              aria-label={`View photo ${idx + 1}`}
            >
              <ImageWithFallback
                src={src}
                alt={`Thumbnail ${idx + 1}`}
                className="object-cover"
                fill
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
