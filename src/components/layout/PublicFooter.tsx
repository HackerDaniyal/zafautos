import React from 'react';
import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-iron bg-race-black">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <span className="inline-block font-[Oswald] font-bold text-xl uppercase tracking-wider text-pure-white">ZafAutos Japan</span>
            </Link>
            <p className="mb-6 text-sm text-ash pr-4">
              Your trusted partner for high-quality Japanese used vehicles. Exporting worldwide with full transparency and support.
            </p>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded bg-iron" />
              <div className="h-8 w-8 rounded bg-iron" />
              <div className="h-8 w-8 rounded bg-iron" />
              <div className="h-8 w-8 rounded bg-iron" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Marketplace</h3>
            <ul className="space-y-3 text-sm text-ash">
              <li><Link href="/vehicles" className="hover:text-pure-white transition-colors">Browse Vehicles</Link></li>
              <li><Link href="/vehicles?type=suv" className="hover:text-pure-white transition-colors">SUVs</Link></li>
              <li><Link href="/vehicles?type=sedan" className="hover:text-pure-white transition-colors">Sedans</Link></li>
              <li><Link href="/vehicles?type=truck" className="hover:text-pure-white transition-colors">Trucks</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Company</h3>
            <ul className="space-y-3 text-sm text-ash">
              <li><Link href="/about" className="hover:text-pure-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-pure-white transition-colors">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-pure-white transition-colors">Careers</Link></li>
              <li><Link href="/news" className="hover:text-pure-white transition-colors">News</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Support</h3>
            <ul className="space-y-3 text-sm text-ash">
              <li><Link href="/help" className="hover:text-pure-white transition-colors">Help Center</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-pure-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/terms" className="hover:text-pure-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-pure-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-iron pt-8 md:flex-row">
          <p className="text-sm text-ash">
            &copy; {new Date().getFullYear()} ZafAutos Japan. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-ash">
            <Link href="/terms" className="hover:text-pure-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-pure-white transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-pure-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
