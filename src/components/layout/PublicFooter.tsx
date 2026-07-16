import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="inline-block font-bold">ZafAutos Japan</span>
            </Link>
            <p className="mb-6 text-sm text-muted-foreground pr-4">
              Your trusted partner for high-quality Japanese used vehicles. Exporting worldwide with full transparency and support.
            </p>
            <div className="flex gap-4">
              {/* Social Placeholders */}
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Marketplace</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/vehicles" className="hover:text-foreground">Browse Vehicles</Link></li>
              <li><Link href="/vehicles?type=suv" className="hover:text-foreground">SUVs</Link></li>
              <li><Link href="/vehicles?type=sedan" className="hover:text-foreground">Sedans</Link></li>
              <li><Link href="/vehicles?type=truck" className="hover:text-foreground">Trucks</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="/news" className="hover:text-foreground">News</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Support</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-foreground">Shipping Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ZafAutos Japan. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
