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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo Placeholder */}
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <span className="inline-block font-bold">ZafAutos Japan</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* CTA & Mobile Nav */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register" className="hidden md:block">
            <Button>Sign Up</Button>
          </Link>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="px-0 md:hidden text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <div className="h-8 w-8 rounded-full bg-primary" />
                <span className="font-bold">ZafAutos Japan</span>
              </Link>
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="h-4" />
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-start">Login</Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button className="w-full justify-start">Sign Up</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
