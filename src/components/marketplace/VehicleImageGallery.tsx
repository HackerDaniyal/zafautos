'use client';

import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Expand, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleImageGalleryProps {
  images?: string[];
  className?: string;
}

const placeholderImages = [
  'https://placehold.co/800x500/1A1A1A/E5231B?text=Front+View',
  'https://placehold.co/800x500/1A1A1A/E5231B?text=Side+View',
  'https://placehold.co/800x500/1A1A1A/E5231B?text=Rear+View',
  'https://placehold.co/800x500/1A1A1A/E5231B?text=Interior',
  'https://placehold.co/800x500/1A1A1A/E5231B?text=Engine+Bay',
];

export function VehicleImageGallery({ images = placeholderImages, className }: VehicleImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Use valid image set
  const displayImages = images.length > 0 ? images : placeholderImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image View */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="relative group overflow-hidden rounded-[10px] border border-iron bg-deep-carbon">
          <div className="aspect-[4/3] relative w-full flex items-center justify-center">
            {displayImages[selectedIndex] ? (
              <img 
                src={displayImages[selectedIndex]} 
                alt={`Vehicle main view ${selectedIndex + 1}`} 
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center text-steel gap-2">
                <Camera className="h-10 w-10 opacity-20" />
                <span>No Image Available</span>
              </div>
            )}
          </div>
          
          {/* Top Overlays */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          </div>
          
          {/* Actions */}
          <DialogTrigger asChild>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute top-3 right-3 z-10 rounded-full bg-race-black/80 hover:bg-race-black text-pure-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="View fullscreen"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>

        {/* Fullscreen Dialog Content */}
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none flex flex-col justify-center overflow-hidden">
          <Carousel 
            className="w-full h-full flex flex-col" 
            opts={{ startIndex: selectedIndex, loop: true }}
            setApi={(api) => {
              if (!api) return;
              api.on('select', () => setSelectedIndex(api.selectedScrollSnap()));
            }}
          >
            <div className="absolute top-4 left-4 z-50 text-white font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md">
              {selectedIndex + 1} / {displayImages.length}
            </div>
            
            <CarouselContent className="h-full flex-1 ml-0">
              {displayImages.map((src, idx) => (
                <CarouselItem key={idx} className="relative h-full flex items-center justify-center pl-0">
                  <div className="relative w-full h-full p-8 md:p-16">
                    <img 
                      src={src} 
                      alt={`Vehicle full view ${idx + 1}`} 
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
        <Carousel 
          className="w-full" 
          opts={{ align: 'start', slidesToScroll: 2, containScroll: 'trimSnaps' }}
        >
          <CarouselContent className="-ml-2">
            {displayImages.map((src, idx) => (
              <CarouselItem key={idx} className="pl-2 basis-1/4 sm:basis-1/5 lg:basis-1/6">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={cn(
                    "relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition-all duration-200",
                    selectedIndex === idx 
                      ? "border-signal-red ring-2 ring-signal-red/20 ring-offset-1" 
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-steel/50"
                  )}
                >
                  <img src={src} alt={`Thumbnail ${idx + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-2">
            <CarouselPrevious className="static translate-y-0 h-8 w-8" />
            <CarouselNext className="static translate-y-0 h-8 w-8" />
          </div>
        </Carousel>
      )}
    </div>
  );
}
