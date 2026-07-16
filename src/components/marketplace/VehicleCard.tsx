import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Scale, Fuel, Gauge, Calendar, MapPin, Share2, Camera, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface VehicleCardData {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  location: string;
  condition: string;
  isFeatured?: boolean;
  isReserved?: boolean;
  imageUrl?: string;
  imageCount?: number;
  stockId?: string;
  fobPrice?: boolean;
  arrivalEstimate?: string;
  recentlyAdded?: boolean;
}

interface VehicleCardProps {
  vehicle: VehicleCardData;
  variant?: 'grid' | 'list';
  isWishlisted?: boolean;
  isCompared?: boolean;
  onWishlistToggle?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
}

export function VehicleCard({
  vehicle,
  variant = 'grid',
  isWishlisted = false,
  isCompared = false,
  onWishlistToggle,
  onCompareToggle,
}: VehicleCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [compared, setCompared] = useState(isCompared);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted((p) => !p);
    onWishlistToggle?.(vehicle.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    setCompared((p) => !p);
    onCompareToggle?.(vehicle.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real app, this might open a share dialog or use navigator.share
    console.log('Share clicked for', vehicle.id);
  };

  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: vehicle.currency,
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  if (variant === 'list') {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="flex flex-col sm:flex-row h-full">
          <Link href={`/vehicles/${vehicle.slug}`} className="relative shrink-0 sm:w-64 xl:w-72 block overflow-hidden group">
            <div className="aspect-[4/3] sm:aspect-auto sm:h-full bg-muted flex items-center justify-center text-muted-foreground text-sm relative">
              {vehicle.imageUrl ? (
                <Image 
                  src={vehicle.imageUrl} 
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} 
                  fill 
                  unoptimized 
                  className="object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Camera className="h-8 w-8 opacity-20" />
                  <span>No Photo</span>
                </div>
              )}
              {/* Image Count Indicator */}
              {vehicle.imageCount && vehicle.imageCount > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm z-10">
                  <Camera className="h-3 w-3" />
                  {vehicle.imageCount}
                </div>
              )}
            </div>
            
            {/* Badges Top Left */}
            <div className="absolute left-2 top-2 flex flex-col gap-1.5 items-start z-10">
              {vehicle.isFeatured && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-none shadow-amber-900/20">Featured</Badge>
              )}
              {vehicle.recentlyAdded && (
                <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-sm border-none shadow-green-900/20">New Arrival</Badge>
              )}
            </div>

            {/* Badges Top Right */}
            {vehicle.isReserved && (
              <Badge variant="secondary" className="absolute right-2 top-2 bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-sm z-10">Reserved</Badge>
            )}
          </Link>
          
          <div className="flex flex-1 flex-col justify-between">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-1">
                    {vehicle.stockId && <span>Ref: {vehicle.stockId}</span>}
                    {vehicle.stockId && <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>}
                    <span className={cn(
                      "font-medium",
                      vehicle.condition.includes('Grade S') || vehicle.condition.includes('Grade 5') ? "text-amber-600" : ""
                    )}>{vehicle.condition}</span>
                  </div>
                  
                  <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-primary transition-colors inline-block group-hover:text-primary">
                    <h3 className="font-bold text-lg leading-tight text-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                  </Link>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                  <div className="flex flex-col items-start sm:items-end">
                    <p className="text-2xl font-bold text-primary leading-none">{priceFormatted}</p>
                    {vehicle.fobPrice && <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-1">FOB Price</span>}
                  </div>
                </div>
              </div>

              {vehicle.arrivalEstimate && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50/50 w-fit px-2 py-1 rounded-md border border-blue-100">
                  <Ship className="h-3.5 w-3.5" />
                  <span>Est. Arrival: <span className="font-semibold">{vehicle.arrivalEstimate}</span></span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="font-medium text-foreground">{vehicle.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Fuel className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="font-medium text-foreground">{vehicle.fuelType}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="font-medium text-foreground">{vehicle.year}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="font-medium text-foreground truncate max-w-[120px]">{vehicle.location}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-muted/10 p-3 sm:px-5 flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWishlist}
                  className={cn(
                    'h-8 w-8 rounded-full transition-colors',
                    wishlisted ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
                  )}
                  title="Add to wishlist"
                >
                  <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCompare}
                  className={cn(
                    'h-8 w-8 rounded-full transition-colors',
                    compared ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  )}
                  title="Compare"
                >
                  <Scale className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <Button asChild size="sm" className="shrink-0 font-medium px-6 shadow-sm hover:shadow">
                <Link href={`/vehicles/${vehicle.slug}`}>View Details</Link>
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group flex flex-col h-full border-border/60">
      <Link href={`/vehicles/${vehicle.slug}`} className="relative block shrink-0 overflow-hidden">
        <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground text-sm relative">
          {vehicle.imageUrl ? (
            <Image
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Camera className="h-8 w-8 opacity-20" />
              <span>No Photo</span>
            </div>
          )}
          
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
          
          {/* Image Count Indicator */}
          {vehicle.imageCount && vehicle.imageCount > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm z-20">
              <Camera className="h-3 w-3" />
              {vehicle.imageCount}
            </div>
          )}
        </div>
        
        {/* Badges Top Left */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5 items-start z-20">
          {vehicle.isFeatured && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-none shadow-amber-900/20">Featured</Badge>
          )}
          {vehicle.recentlyAdded && (
            <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-sm border-none shadow-green-900/20">New Arrival</Badge>
          )}
        </div>
        
        {/* Badges Top Right */}
        {vehicle.isReserved && (
          <Badge variant="secondary" className="absolute right-2 top-2 bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-sm z-20">Reserved</Badge>
        )}
      </Link>
      
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1.5">
            {vehicle.stockId && <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">{vehicle.stockId}</span>}
          </div>
          <span className={cn(
            "font-medium",
            vehicle.condition.includes('Grade S') || vehicle.condition.includes('Grade 5') ? "text-amber-600" : ""
          )}>{vehicle.condition}</span>
        </div>

        <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-primary transition-colors inline-block group-hover:text-primary mb-1">
          <h3 className="font-bold text-base leading-tight line-clamp-1 text-foreground" title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>
        
        <div className="flex items-end gap-2 mt-1 mb-3">
          <p className="text-xl font-bold text-primary leading-none">{priceFormatted}</p>
          {vehicle.fobPrice && <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">FOB</span>}
        </div>

        {vehicle.arrivalEstimate && (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-blue-600 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100 w-full">
            <Ship className="h-3 w-3 shrink-0" />
            <span className="truncate">Est. Arrival: <span className="font-semibold">{vehicle.arrivalEstimate}</span></span>
          </div>
        )}

        {/* Specifications Grid */}
        <div className="mt-auto grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5" title="Mileage">
            <Gauge className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="font-medium text-foreground truncate">{vehicle.mileage.toLocaleString()} km</span>
          </div>
          <div className="flex items-center gap-1.5" title="Fuel Type">
            <Fuel className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="font-medium text-foreground truncate">{vehicle.fuelType}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Transmission">
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="font-medium text-foreground truncate">{vehicle.transmission}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Location">
            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="font-medium text-foreground truncate">{vehicle.location}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/10 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 -ml-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWishlist}
            className={cn(
              'h-8 w-8 rounded-full transition-colors',
              wishlisted ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
            )}
            title="Add to wishlist"
          >
            <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCompare}
            className={cn(
              'h-8 w-8 rounded-full transition-colors',
              compared ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
            )}
            title="Compare"
          >
            <Scale className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <Button asChild size="sm" className="shrink-0 h-8 font-medium shadow-sm hover:shadow text-xs px-4">
          <Link href={`/vehicles/${vehicle.slug}`}>Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Placeholder data for development
export const placeholderVehicles: VehicleCardData[] = Array.from({ length: 12 }, (_, i) => ({
  id: `v-${i + 1}`,
  slug: `toyota-land-cruiser-prado-2019-${i + 1}`,
  make: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru'][i % 5],
  model: ['Land Cruiser Prado', 'CR-V', 'X-Trail', 'CX-5', 'Forester'][i % 5],
  year: 2018 + (i % 5),
  price: 15000 + i * 3500,
  currency: 'USD',
  mileage: 25000 + i * 8000,
  fuelType: i % 3 === 0 ? 'Hybrid' : 'Petrol',
  transmission: i % 4 === 0 ? 'Manual' : 'Automatic',
  bodyType: ['SUV', 'Sedan', 'Hatchback', 'SUV', 'Wagon'][i % 5],
  location: ['Tokyo', 'Osaka', 'Nagoya', 'Yokohama', 'Kobe'][i % 5],
  condition: i % 6 === 0 ? 'Grade 4.5' : (i % 5 === 0 ? 'Grade S' : 'Grade 4.0'),
  isFeatured: i < 3,
  isReserved: i === 7,
  imageCount: 15 + (i % 10),
  stockId: `ZAF-${1000 + i}`,
  fobPrice: true,
  arrivalEstimate: i % 4 === 0 ? 'Mid August' : undefined,
  recentlyAdded: i % 3 === 0,
}));
