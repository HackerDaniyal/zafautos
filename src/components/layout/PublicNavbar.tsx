"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NavbarCurrencySwitcher } from '@/components/marketplace/NavbarCurrencySwitcher';

interface MenuItem {
  id: string;
  label: string;
  url: string | null;
  pageSlug: string | null;
  externalUrl: string | null;
  openInNewTab: boolean;
  isEnabled: boolean;
  displayOrder: number;
  parentId: string | null;
}

interface PublicNavbarProps {
  menuItems?: MenuItem[];
}

function resolveHref(item: MenuItem): string {
  if (item.externalUrl) return item.externalUrl;
  if (item.pageSlug) return `/${item.pageSlug}`;
  if (item.url) return item.url;
  return '/';
}

const DEFAULT_NAV_ITEMS: { name: string; href: string; external?: boolean; openInNewTab?: boolean }[] = [
  { name: 'Home', href: '/' },
  { name: 'Vehicles', href: '/vehicles' },
  { name: 'Compare', href: '/compare' },
  { name: 'Wishlist', href: '/wishlist' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export function PublicNavbar({ menuItems = [] }: PublicNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hasMenuItems = menuItems.length > 0;
  const navItems = hasMenuItems
    ? menuItems
        .filter((item) => item.isEnabled && !item.parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => ({
          name: item.label,
          href: resolveHref(item),
          external: !!item.externalUrl,
          openInNewTab: item.openInNewTab,
        }))
    : DEFAULT_NAV_ITEMS;

  return (
      <header
      className={`sticky top-0 z-50 w-full bg-[#0A0A0A] backdrop-blur-lg supports-[backdrop-filter]:bg-[#0A0A0A]/95 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#1A1A1A] shadow-lg shadow-black/30'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="ZafAutos" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  target={item.openInNewTab ? '_blank' : undefined}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>
        </div>

        {/* CTA & Mobile Nav */}
        <div className="flex items-center gap-2 md:gap-3">
          <NavbarCurrencySwitcher />
          <Link href="/login" className="hidden md:block">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
              Login
            </Button>
          </Link>
          <Link href="/contact" className="hidden md:block">
            <Button className="bg-signal-red text-white hover:bg-deep-red rounded-[6px] px-5 py-2.5 text-sm font-medium uppercase tracking-wider">
              Enquire
            </Button>
          </Link>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="px-0 md:hidden text-white hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-white/10 bg-[#0A0A0A] pr-0">
              <Link href="/" className="flex items-center mb-8">
                <img src="/logo.png" alt="ZafAutos" className="h-10 w-auto" />
              </Link>
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="text-gray-300 font-medium hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-300 font-medium hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )
                ))}
                <div className="h-4" />
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10 rounded-[6px]">
                    Login
                  </Button>
                </Link>
                <Link href="/contact" className="w-full">
                  <Button className="w-full justify-start bg-signal-red text-white hover:bg-deep-red rounded-[6px]">
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
