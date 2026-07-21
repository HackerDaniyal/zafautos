import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Vehicles', href: '/vehicles' },
  { name: 'Compare', href: '/compare' },
  { name: 'Wishlist', href: '/wishlist' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-iron bg-race-black/95 backdrop-blur supports-[backdrop-filter]:bg-race-black/80">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-signal-red text-[10px] font-bold text-pure-white">
              ZA
            </div>
            <span className="font-[Oswald] text-lg font-bold uppercase tracking-wide text-pure-white">
              ZafAutos <span className="text-sm font-medium text-ash">Japan</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-ash transition-colors hover:text-pure-white"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* CTA & Mobile Nav */}
        <div className="flex items-center gap-3">
          <Link href="/contact" className="hidden md:block">
            <Button variant="ghost" className="text-ash hover:text-pure-white hover:bg-white/5">
              Login
            </Button>
          </Link>
          <Link href="/contact" className="hidden md:block">
            <Button className="bg-signal-red text-pure-white hover:bg-deep-red rounded-[6px] px-5 py-2.5 text-sm font-medium uppercase tracking-wider">
              Enquire
            </Button>
          </Link>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="px-0 md:hidden text-pure-white hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-iron bg-race-black pr-0">
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-signal-red text-[10px] font-bold text-pure-white">
                  ZA
                </div>
                <span className="font-[Oswald] text-lg font-bold uppercase tracking-wide text-pure-white">
                  ZafAutos
                </span>
              </Link>
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-ash font-medium hover:text-pure-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="h-4" />
                <Link href="/contact" className="w-full">
                  <Button variant="outline" className="w-full justify-start border-iron text-pure-white hover:bg-white/5 rounded-[6px]">
                    Login
                  </Button>
                </Link>
                <Link href="/contact" className="w-full">
                  <Button className="w-full justify-start bg-signal-red text-pure-white hover:bg-deep-red rounded-[6px]">
                    Enquire
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
