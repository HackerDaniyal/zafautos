'use client';

import React, { useState } from 'react';
import { Heart, Trash2, ShoppingBag, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { VehicleCard, type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { placeholderVehicles } from '@/data/placeholderVehicles';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { Button } from '@/components/ui/button';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import Link from 'next/link';

// â”€â”€â”€ Empty State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WishlistEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background border shadow-sm">
        <Heart className="h-10 w-10 text-muted-foreground opacity-50" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h2>
        <p className="text-muted-foreground">
          Save vehicles you love by clicking the heart icon on any vehicle card. Revisit them here anytime to compare or enquire.
        </p>
      </div>
      <Button asChild size="lg" className="mt-4 font-bold shadow-sm">
        <Link href="/vehicles">Browse Marketplace</Link>
      </Button>
    </div>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Seed: first 6 placeholder vehicles are pre-wishlisted for demo
const INITIAL_WISHLIST_IDS = placeholderVehicles.slice(0, 6).map((v) => v.id);

export default function WishlistPage() {
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set(INITIAL_WISHLIST_IDS));
  const [sort, setSort] = useState('price-asc');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const wishlistedVehicles: VehicleCardData[] = placeholderVehicles
    .filter((v) => wishlistIds.has(v.id))
    .sort((a, b) => {
      switch (sort) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'year-asc': return a.year - b.year;
        case 'year-desc': return b.year - a.year;
        case 'mileage-asc': return a.mileage - b.mileage;
        default: return 0;
      }
    });

  const removeFromWishlist = (id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    // Also remove from compare if it was there
    setCompareIds((prev) => prev.filter(x => x !== id));
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      setWishlistIds(new Set());
      setCompareIds([]);
    }
  };

  const moveToCompare = (id: string) => {
    if (!compareIds.includes(id) && compareIds.length < 4) {
      setCompareIds([...compareIds, id]);
    }
    // Don't remove from wishlist automatically to keep it available
  };

  const isComparing = (id: string) => compareIds.includes(id);

  return (
    <SectionWrapper className="space-y-6 pb-20 pt-6 md:pt-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <PageHeader
          title="My Wishlist"
          description={
            wishlistedVehicles.length > 0
              ? `You have ${wishlistedVehicles.length} saved vehicle${wishlistedVehicles.length !== 1 ? 's' : ''} ready to compare or purchase.`
              : "Vehicles you've saved will appear here."
          }
        />
        {wishlistedVehicles.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <SortSelect onChange={setSort} className="w-[180px] sm:w-[220px]" />
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="flex items-center gap-1.5 h-10 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-semibold"
            >
              <Trash2 className="h-4 w-4" /> Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {wishlistedVehicles.length === 0 ? (
        <WishlistEmpty />
      ) : (
        <>
          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card shadow-sm px-6 py-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Saved</p>
                  <p className="text-sm font-bold">{wishlistedVehicles.length} Vehicles</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg. Price</p>
                  <p className="text-sm font-bold">
                    ${Math.round(
                      wishlistedVehicles.reduce((s, v) => s + v.price, 0) / wishlistedVehicles.length,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="hidden md:block w-px h-8 bg-border" />
              <div className="hidden md:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Price Range</p>
                  <p className="text-sm font-bold">
                    ${Math.min(...wishlistedVehicles.map((v) => v.price)).toLocaleString()}
                    {' â€“ '}
                    ${Math.max(...wishlistedVehicles.map((v) => v.price)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {compareIds.length > 0 && (
              <Button asChild className="font-bold shadow-sm">
                <Link href={`/compare?ids=${compareIds.join(',')}`}>
                  Compare Selected ({compareIds.length})
                </Link>
              </Button>
            )}
          </div>

          {compareIds.length === 4 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>You can compare up to 4 vehicles at a time. Remove one to add another.</p>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="relative group flex flex-col h-full">
                <VehicleCard
                  vehicle={vehicle}
                  variant="grid"
                  isWishlisted={true}
                  onWishlistToggle={() => removeFromWishlist(vehicle.id)}
                  isCompared={isComparing(vehicle.id)}
                  onCompareToggle={() => moveToCompare(vehicle.id)}
                />
                
                {/* Remove Overlay Action */}
                <button
                  type="button"
                  onClick={() => removeFromWishlist(vehicle.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-3 right-14 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition-all hover:bg-destructive hover:text-destructive-foreground text-muted-foreground opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionWrapper>
  );
}
