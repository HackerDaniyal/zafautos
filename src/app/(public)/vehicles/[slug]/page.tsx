'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Heart,
  Scale,
  Share2,
  Phone,
  MapPin,
  Shield,
  FileText,
  Truck,
  CreditCard,
  CheckCircle2,
  Tag,
  AlertCircle,
  Download,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';
import { cn } from '@/lib/utils';

import { VehicleImageGallery } from '@/components/marketplace/VehicleImageGallery';
import { VehicleSpecsTable } from '@/components/marketplace/VehicleSpecsTable';
import { VehicleContactForm } from '@/components/marketplace/VehicleContactForm';
import { SimilarVehicles } from '@/components/marketplace/SimilarVehicles';
import { WishlistToggle } from '@/components/marketplace/WishlistToggle';
import { CompareBar } from '@/components/marketplace/CompareBar';
import { placeholderVehicles } from '@/components/marketplace/VehicleCard';

// ─── Placeholder detail data ──────────────────────────────────────────────────

const PLACEHOLDER_FEATURES = [
  'Leather Seats',
  'Sunroof / Moonroof',
  'Rear-View Camera',
  'Bluetooth',
  'Cruise Control',
  'Keyless Entry',
  'Navigation System',
  'Heated Seats',
  'Apple CarPlay / Android Auto',
  'Lane Departure Warning',
  'Parking Sensors',
  'Alloy Wheels',
];

const PLACEHOLDER_DOCUMENTS = [
  { label: 'Auction Sheet', available: true },
  { label: 'Export Certificate', available: true },
  { label: 'Service History', available: false },
  { label: 'Vehicle Inspection Report', available: true },
  { label: 'Title / Registration', available: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeaturesGrid({ features }: { features: string[] }) {
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-bold">Features & Equipment</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500 mt-0.5" aria-hidden="true" />
              <span className="font-medium text-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DocumentsSection({ docs }: { docs: { label: string; available: boolean }[] }) {
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 p-0 sm:p-0">
        <ul className="divide-y divide-border/50">
          {docs.map((d) => (
            <li key={d.label} className="flex flex-wrap items-center justify-between py-3 px-4 sm:px-6 hover:bg-muted/10 transition-colors group">
              <span className="font-medium text-sm text-foreground">{d.label}</span>
              <div className="flex items-center gap-3">
                {d.available ? (
                  <>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold text-green-700 bg-green-100 border-green-200">
                      Available
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex text-muted-foreground hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 border-border">
                    Not Available
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SellerCard({ location }: { location: string }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Seller Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary text-sm border border-primary/20">
            ZA
          </div>
          <div className="space-y-1 mt-0.5">
            <h3 className="font-bold text-base leading-none">ZafAutos Japan</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {location}, Japan
            </p>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-0.5 rounded border border-green-100 mt-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Exporter
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full text-xs font-semibold" size="sm">
            View Profile
          </Button>
          <Button variant="outline" className="w-full text-xs font-semibold flex items-center gap-1.5" size="sm">
            <Phone className="h-3.5 w-3.5" /> Call Seller
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancingCard({ price, currency }: { price: number; currency: string }) {
  const monthly = Math.round((price * 1.08) / 60);
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-2">
        <AlertCircle className="h-4 w-4 text-muted-foreground/30" />
      </div>
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" /> Finance Estimate
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="rounded-xl bg-muted/30 border border-border/50 p-4 text-center space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Est. Monthly Payment</p>
          <p className="text-3xl font-extrabold text-foreground">
            {currency} {monthly.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Over 60 months at 8% p.a.
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          * Indicative only. Rates vary based on credit score, deposit, and location. Contact us for actual options.
        </p>
        <Button className="w-full font-semibold shadow-sm" variant="outline">
          Get Finance Quote
        </Button>
      </CardContent>
    </Card>
  );
}

function ShippingCard({ location }: { location: string }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" /> Shipping Info
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4 text-sm">
        <ul className="space-y-3">
          <li className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0">
            <span className="text-muted-foreground font-medium">Origin</span>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {location}, Japan
            </span>
          </li>
          <li className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0">
            <span className="text-muted-foreground font-medium">Est. transit</span>
            <span className="font-semibold text-foreground">3 – 5 weeks</span>
          </li>
          <li className="flex items-center justify-between pb-3 border-b border-border/50 last:border-0 last:pb-0">
            <span className="text-muted-foreground font-medium">Shipping type</span>
            <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded text-xs">RO-RO / Container</span>
          </li>
        </ul>
        <div className="pt-2">
          <Button className="w-full font-semibold shadow-sm" variant="outline">
            Calculate Shipping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VehicleDetailPage({ params }: { params: { slug: string } }) {
  const vehicle =
    placeholderVehicles.find((v) => v.slug === params.slug) ?? placeholderVehicles[0];

  const [wishlisted, setWishlisted] = useState(false);
  const [compared, setCompared] = useState(false);

  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: vehicle.currency,
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const specs = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    bodyType: vehicle.bodyType,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission,
    mileage: vehicle.mileage,
    condition: vehicle.condition,
    location: vehicle.location,
    stockNumber: vehicle.stockId || `ZAF-${vehicle.id.toUpperCase()}`,
  };

  const similarVehicles = placeholderVehicles
    .filter((v) => v.id !== vehicle.id && v.make === vehicle.make)
    .slice(0, 6);

  return (
    <>
      <SectionWrapper className="pb-0 pt-6 md:pt-8">
        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList className="sm:text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/vehicles">Marketplace</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/vehicles?make=${vehicle.make}`}>{vehicle.make}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/vehicles?make=${vehicle.make}&model=${vehicle.model}`}>{vehicle.model}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground max-w-[150px] sm:max-w-xs truncate" title={vehicleTitle}>
                {vehicleTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ── Title row ───────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-border/50 pb-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={vehicle.isReserved ? 'destructive' : 'secondary'} className="text-xs font-bold uppercase tracking-wider">
                {vehicle.isReserved ? 'Reserved' : vehicle.condition}
              </Badge>
              {vehicle.isFeatured && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-500 border-amber-400/30 gap-1 text-[10px] uppercase font-bold tracking-wider">
                  <Tag className="h-3 w-3" /> Featured
                </Badge>
              )}
              {vehicle.stockId && (
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                  Ref: {vehicle.stockId}
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{vehicleTitle}</h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4" /> {vehicle.location}, Japan
              </span>
              {vehicle.fobPrice && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                  <span className="font-semibold text-foreground">FOB Available</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant={compared ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setCompared((c) => !c)}
              className="flex items-center gap-2 h-10 px-4 font-semibold shadow-sm transition-all"
            >
              <Scale className="h-4 w-4" />
              {compared ? 'Comparing' : 'Compare'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Share"
              className="h-10 w-10 shadow-sm"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <WishlistToggle 
              initialAdded={wishlisted} 
              onToggle={setWishlisted} 
              className="h-10 w-10 shadow-sm border border-input bg-background hover:bg-red-50 hover:border-red-200"
            />
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper className="pt-0 pb-16">
        {/* ── Main layout: content + right sidebar ─────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px]">

          {/* ── Left Column: Content ──────────────────────────────────── */}
          <div className="space-y-10 min-w-0">
            
            {/* Image gallery */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
              <VehicleImageGallery
                images={vehicle.imageUrl ? [vehicle.imageUrl] : undefined}
                className="w-full"
              />
            </div>

            {/* Price (mobile/tablet only - hidden on lg) */}
            <div className="lg:hidden rounded-2xl border border-border shadow-sm bg-card p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">Vehicle Price</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-extrabold text-foreground tracking-tight">{priceFormatted}</p>
                    {vehicle.fobPrice && <span className="text-xs uppercase font-bold text-muted-foreground mb-1.5 tracking-wider bg-muted px-2 py-0.5 rounded">FOB</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button size="lg" className="w-full font-bold shadow-md h-12 text-base">
                  <Phone className="mr-2 h-5 w-5" /> Enquire
                </Button>
                <Button size="lg" variant="secondary" className="w-full font-bold shadow-sm h-12 text-base">
                  Get Quote
                </Button>
              </div>
            </div>

            {/* Vehicle Summary (Specs) */}
            <div id="specifications" className="scroll-mt-24">
              <VehicleSpecsTable specs={specs} className="shadow-sm border-border/60" />
            </div>

            {/* Features */}
            <div id="features" className="scroll-mt-24">
              <FeaturesGrid features={PLACEHOLDER_FEATURES} />
            </div>
            
            {/* Documents */}
            <div id="documents" className="scroll-mt-24">
              <DocumentsSection docs={PLACEHOLDER_DOCUMENTS} />
            </div>
          </div>

          {/* ── Right Column: Sidebar ────────────────────────────── */}
          <div className="space-y-6">
            
            {/* Price card (desktop sticky) */}
            <div className="hidden lg:block sticky top-24 z-10">
              <Card className="border-border/60 shadow-lg border-primary/20 overflow-hidden">
                <div className="h-1.5 w-full bg-primary" />
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Vehicle Price</p>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-extrabold text-foreground tracking-tight">{priceFormatted}</p>
                      {vehicle.fobPrice && <span className="text-xs uppercase font-bold text-muted-foreground mb-1.5 tracking-wider bg-muted px-2 py-0.5 rounded">FOB</span>}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Plus shipping &amp; local duties
                    </p>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <Button size="lg" className="w-full font-bold shadow-md h-14 text-lg">
                      <Phone className="mr-2 h-5 w-5" /> Enquire Now
                    </Button>
                    <Button size="lg" variant="secondary" className="w-full font-bold shadow-sm h-12">
                      Request Shipping Quote
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center pt-2">
                    <Button variant="link" size="sm" onClick={() => setWishlisted(!wishlisted)} className="text-muted-foreground hover:text-primary">
                      <Heart className={cn("mr-2 h-4 w-4", wishlisted && "fill-red-500 text-red-500")} />
                      {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seller info */}
            <SellerCard location={vehicle.location} />

            {/* Shipping info */}
            <ShippingCard location={vehicle.location} />

            {/* Finance estimate */}
            <FinancingCard price={vehicle.price} currency={vehicle.currency} />

            {/* Enquiry form */}
            <div id="enquire" className="scroll-mt-24">
              <VehicleContactForm vehicleTitle={vehicleTitle} className="shadow-sm border-border/60" />
            </div>
          </div>
        </div>

        {/* ── Similar Vehicles ─────────────────────────────────────────────── */}
        {similarVehicles.length > 0 && (
          <div className="mt-20 border-t border-border/50 pt-16">
            <SimilarVehicles
              vehicles={similarVehicles}
              title={`Explore More ${vehicle.make} Vehicles`}
              viewAllHref={`/vehicles?make=${vehicle.make}`}
            />
          </div>
        )}
      </SectionWrapper>

      {/* ── Compare bar ──────────────────────────────────────────────────── */}
      <CompareBar
        selectedIds={compared ? [vehicle.id] : []}
        onRemove={() => setCompared(false)}
        onCompare={() => {
          window.location.href = `/compare?ids=${vehicle.id}`;
        }}
        className="z-50 border-t-2 border-primary"
      />
    </>
  );
}
