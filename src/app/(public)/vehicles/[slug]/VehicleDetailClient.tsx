'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gauge, Fuel, Calendar, MapPin, Ship, Heart, MessageSquare, Share2, Phone, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleImageGallery } from '@/components/marketplace/VehicleImageGallery';
import { VehicleSpecsTable } from '@/components/marketplace/VehicleSpecsTable';
import { VehicleContactForm } from '@/components/marketplace/VehicleContactForm';
import { SimilarVehicles } from '@/components/marketplace/SimilarVehicles';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { ChequeredDivider } from '@/components/ui/ChequeredDivider';
import { formatMileage, cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
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
      className="flex items-center justify-center gap-2.5 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Chat on WhatsApp
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
  const { formatConvertedPrice } = useCurrency();
  const priceFormatted = formatConvertedPrice(vehicle.price, vehicle.currency);
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
          <div className="lg:hidden space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {vehicle.stockId && (
                <span className="inline-flex items-center font-mono bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  {vehicle.stockId}
                </span>
              )}
              {vehicle.condition && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gray-900 text-white">
                  {vehicle.condition}
                </span>
              )}
            </div>
            <h1 className="font-[Oswald] text-[24px] font-bold uppercase leading-tight text-gray-900 md:text-3xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="font-[Oswald] text-[24px] font-bold text-signal-red">{priceFormatted}</p>
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
        <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
          {/* Title + Price + CTA (Desktop) */}
          <div className="hidden lg:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-signal-red via-signal-red/80 to-signal-red/40" />

            <div className="p-6 space-y-5">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {vehicle.stockId && (
                  <span className="inline-flex items-center font-mono bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    {vehicle.stockId}
                  </span>
                )}
                {vehicle.condition && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-gray-900 text-white">
                    {vehicle.condition}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-[Oswald] text-[22px] font-bold uppercase leading-tight text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>

              {/* Price */}
              <div className="space-y-0.5">
                <p className="font-[Oswald] text-[28px] font-bold text-signal-red leading-none">
                  {priceFormatted}
                </p>
                {vehicle.fobPrice && (
                  <span className="text-[11px] uppercase font-semibold text-gray-400 tracking-widest">FOB Price</span>
                )}
              </div>

              {/* Quick trust indicators */}
              <div className="flex items-center gap-4 text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Verified Dealer</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>Fast Response</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={scrollToEnquiry}
                  className="w-full bg-signal-red hover:bg-deep-red text-white rounded-lg font-[Oswald] text-sm font-semibold uppercase tracking-wider h-12 transition-all duration-200 shadow-sm shadow-signal-red/20 hover:shadow-md hover:shadow-signal-red/30"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enquire About This Vehicle
                </Button>

                <WhatsAppButton vehicleId={vehicle.id} vehicle={vehicle} />
              </div>

              {/* Save + Share */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                    wishlisted
                      ? 'border-signal-red/30 bg-signal-red/5 text-signal-red'
                      : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50',
                  )}
                >
                  <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
                  {wishlisted ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
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
          <div className="lg:hidden space-y-3">
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={cn(
                'flex items-center justify-center gap-2 w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                wishlisted
                  ? 'border-signal-red/30 bg-signal-red/5 text-signal-red'
                  : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50',
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
