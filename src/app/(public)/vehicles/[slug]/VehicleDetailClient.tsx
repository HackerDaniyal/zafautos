'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gauge, Fuel, Calendar, MapPin, Ship, Heart, MessageSquare, Share2, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleImageGallery } from '@/components/marketplace/VehicleImageGallery';
import { VehicleSpecsTable } from '@/components/marketplace/VehicleSpecsTable';
import { VehicleContactForm } from '@/components/marketplace/VehicleContactForm';
import { SimilarVehicles } from '@/components/marketplace/SimilarVehicles';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { ChequeredDivider } from '@/components/ui/ChequeredDivider';
import { formatPrice, formatMileage, cn } from '@/lib/utils';
import {
  toggleWishlist,
  checkWishlistStatus,
  trackVehicleView,
  trackWhatsappClick,
} from '@/server/actions/publicConversionActions';

interface VehicleDetailClientProps {
  vehicle: VehicleCardData & {
    driveType?: string;
    color?: string;
    vin?: string | null;
    engineSize?: number | null;
    horsepower?: number | null;
    doors?: number | null;
    seats?: number | null;
    arrivalEstimate?: string | null;
    manufacturerId?: string | null;
    modelId?: string | null;
    bodyTypeId?: string | null;
    country?: string;
    auctionGrade?: string | null;
  };
  images: Array<{ id: string; imageUrl: string; isPrimary: boolean; sortOrder: number | null }>;
  features: string[];
  similar: VehicleCardData[];
}

function WhatsAppButton({ vehicleId, vehicle }: { vehicleId: string; vehicle: { year: number; make: string; model: string; stockId?: string | null } }) {
  const message = encodeURIComponent(
    `Hello ZafAutos,\n\nI'm interested in:\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.stockId ? `\nStock: ${vehicle.stockId}` : ''}\n\nVehicle URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
  );
  const whatsappUrl = `https://wa.me/?text=${message}`;

  function handleClick() {
    trackWhatsappClick(vehicleId, 'vehicle_detail');
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 w-full rounded-[6px] border border-emerald-600/50 bg-emerald-900/20 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-600/70 transition-colors"
    >
      <Phone className="h-4 w-4" />
      WhatsApp Us
    </a>
  );
}

function SpecBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-gray-500" />
      <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      <span className="text-[13px] font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function VehicleDetailClient({ vehicle, images, features, similar }: VehicleDetailClientProps) {
  const priceFormatted = formatPrice(vehicle.price, vehicle.currency);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  // Track view + check wishlist on mount
  useEffect(() => {
    trackVehicleView(vehicle.id);
    checkWishlistStatus(vehicle.id).then((r) => setWishlisted(r.wishlisted ?? false));
  }, [vehicle.id]);

  const scrollToEnquiry = () => {
    document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const result = await toggleWishlist(vehicle.id);
      if (result.success && result.wishlisted !== undefined) {
        setWishlisted(result.wishlisted);
      } else if (result.code === 'AUTH_REQUIRED') {
        // Could redirect to login or show modal
        alert('Please log in to add vehicles to your wishlist.');
      }
    } catch {
      // Silent fail
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} on ZafAutos`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const galleryImages = images
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => img.imageUrl);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
        <Link href="/vehicles" className="hover:text-gray-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Inventory
        </Link>
        <span className="text-gray-500">/</span>
        <Link href={`/vehicles?make=${encodeURIComponent(vehicle.make)}`} className="hover:text-gray-900 transition-colors">
          {vehicle.make}
        </Link>
        <span className="text-gray-500">/</span>
        <span className="text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: Gallery + Details */}
        <div className="space-y-8">
          {/* Image Gallery */}
          <VehicleImageGallery images={galleryImages} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />

          {/* Title + Price (Mobile) */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {vehicle.stockId && (
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500 uppercase">{vehicle.stockId}</span>
              )}
              {vehicle.condition && (
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-600">{vehicle.condition}</span>
              )}
              {vehicle.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-[3px] bg-signal-red px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-900">Featured</span>
              )}
            </div>
            <h1 className="font-[Oswald] text-2xl font-bold uppercase tracking-[0.3px] text-gray-900 md:text-3xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="font-[Oswald] text-xl font-bold text-signal-red mt-2">{priceFormatted}</p>
          </div>

          <ChequeredDivider />

          {/* Quick Specs Strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <SpecBadge icon={Calendar} label="Year" value={String(vehicle.year)} />
            {vehicle.mileage > 0 && <SpecBadge icon={Gauge} label="Mileage" value={`${formatMileage(vehicle.mileage)} km`} />}
            {vehicle.fuelType && <SpecBadge icon={Fuel} label="Fuel" value={vehicle.fuelType} />}
            {vehicle.transmission && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-gray-500">Trans</span>
                <span className="text-[13px] font-medium text-gray-900">{vehicle.transmission}</span>
              </div>
            )}
            {vehicle.bodyType && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-gray-500">Body</span>
                <span className="text-[13px] font-medium text-gray-900">{vehicle.bodyType}</span>
              </div>
            )}
            {vehicle.location && <SpecBadge icon={MapPin} label="Location" value={vehicle.location} />}
          </div>

          {vehicle.arrivalEstimate && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-[6px] px-4 py-3">
              <Ship className="h-4 w-4 text-gray-500 shrink-0" />
              <span>Estimated Arrival: <span className="font-medium text-gray-900">{vehicle.arrivalEstimate}</span></span>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <>
              <ChequeredDivider />
              <section className="rounded-[10px] border border-gray-200 bg-white p-4">
                <h2 className="font-[Oswald] text-base font-bold uppercase tracking-wider text-gray-900 mb-3">Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <ChequeredDivider />

          {/* Full Specifications */}
          <VehicleSpecsTable
            specs={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              bodyType: vehicle.bodyType,
              fuelType: vehicle.fuelType,
              transmission: vehicle.transmission,
              driveType: vehicle.driveType ?? undefined,
              mileage: vehicle.mileage,
              condition: vehicle.condition,
              location: vehicle.location,
              stockNumber: vehicle.stockId ?? undefined,
              vin: vehicle.vin ?? undefined,
              color: vehicle.color ?? undefined,
              engineSize: vehicle.engineSize != null ? String(vehicle.engineSize) : undefined,
              horsepower: vehicle.horsepower != null ? String(vehicle.horsepower) : undefined,
              doors: vehicle.doors != null ? String(vehicle.doors) : undefined,
              seats: vehicle.seats != null ? String(vehicle.seats) : undefined,
            }}
          />
        </div>

        {/* Right: Sticky Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
          {/* Title + Price + CTA (Desktop) */}
          <div className="hidden lg:block rounded-[10px] border border-gray-200 bg-white p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {vehicle.stockId && (
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500 uppercase">{vehicle.stockId}</span>
                )}
                {vehicle.condition && (
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-600">{vehicle.condition}</span>
                )}
              </div>
              <h1 className="font-[Oswald] text-2xl font-bold uppercase tracking-[0.3px] text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="font-[Oswald] text-xl font-bold text-signal-red mt-2">{priceFormatted}</p>
              {vehicle.fobPrice && <span className="text-[10px] uppercase font-medium text-gray-500 tracking-wider">FOB Price</span>}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <Button
                onClick={scrollToEnquiry}
                className="w-full bg-signal-red hover:bg-deep-red text-gray-900 rounded-[6px] font-[Oswald] uppercase tracking-wider h-11"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enquire About This Vehicle
              </Button>

              <WhatsAppButton vehicleId={vehicle.id} vehicle={vehicle} />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-[6px] border px-3 py-2.5 text-sm font-medium transition-colors',
                    wishlisted
                      ? 'border-signal-red/50 bg-signal-red/10 text-signal-red'
                      : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400',
                  )}
                >
                  <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
                  {wishlisted ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-[6px] border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <VehicleContactForm
            vehicleId={vehicle.id}
            vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            onSubmitted={() => setEnquirySubmitted(true)}
          />

          {/* Mobile action buttons (below form) */}
          <div className="lg:hidden space-y-2.5">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={cn(
                'flex items-center justify-center gap-2 w-full rounded-[6px] border px-3 py-2.5 text-sm font-medium transition-colors',
                wishlisted
                  ? 'border-signal-red/50 bg-signal-red/10 text-signal-red'
                  : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400',
              )}
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
              {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Similar Vehicles */}
      {similar.length > 0 && (
        <div className="mt-16">
          <ChequeredDivider className="mb-8" />
          <SimilarVehicles vehicles={similar} />
        </div>
      )}
    </div>
  );
}
