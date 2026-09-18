import React from 'react';
import Link from 'next/link';

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

interface CompanySettings {
  companyName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  description?: string;
  socialLinks?: Record<string, string>;
  footerInfo?: string;
}

interface PublicFooterProps {
  menuItems?: MenuItem[];
  company?: CompanySettings | null;
}

function resolveHref(item: MenuItem): string {
  if (item.externalUrl) return item.externalUrl;
  if (item.pageSlug) return `/${item.pageSlug}`;
  if (item.url) return item.url;
  return '/';
}

const DEFAULT_MARKETPLACE_LINKS = [
  { label: 'Browse Vehicles', href: '/vehicles' },
  { label: 'SUVs', href: '/vehicles?type=suv' },
  { label: 'Sedans', href: '/vehicles?type=sedan' },
  { label: 'Trucks', href: '/vehicles?type=truck' },
];

const DEFAULT_COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const DEFAULT_SUPPORT_LINKS = [
  { label: 'Help Center', href: '/contact' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

const SOCIAL_PLATFORMS = [
  { name: 'facebook', label: 'Facebook', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { name: 'twitter', label: 'X (Twitter)', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { name: 'instagram', label: 'Instagram', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { name: 'youtube', label: 'YouTube', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { name: 'linkedin', label: 'LinkedIn', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { name: 'tiktok', label: 'TikTok', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
];

export function PublicFooter({ menuItems = [], company }: PublicFooterProps) {
  const companyName = company?.companyName || 'ZafAutos Japan';
  const companyDescription = company?.description || 'Your trusted partner for high-quality Japanese used vehicles. Exporting worldwide with full transparency and support.';

  const customLinks = menuItems
    .filter((item) => item.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const hasCustomLinks = customLinks.length > 0;

  const socialLinks = company?.socialLinks || {};

  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A]">
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:py-16 lg:py-20 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center">
              <img src="/logo.png" alt="ZafAutos" className="h-10 w-auto" />
            </Link>
            <p className="mb-6 text-sm text-gray-400 pr-4">
              {companyDescription}
            </p>
            <div className="flex gap-3">
              {SOCIAL_PLATFORMS.map((platform) => {
                const url = socialLinks[platform.name];
                return (
                  <a
                    key={platform.name}
                    href={url || '#'}
                    target={url ? '_blank' : undefined}
                    rel={url ? 'noopener noreferrer' : undefined}
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-signal-red flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    aria-label={platform.label}
                  >
                    {platform.icon}
                  </a>
                );
              })}
            </div>
          </div>

          {hasCustomLinks ? (
            <>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-white">Marketplace</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  {customLinks.filter((item) => {
                    const href = resolveHref(item);
                    return href.startsWith('/vehicles') || href === '/';
                  }).slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link href={resolveHref(item)}                         className="hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-white">Company</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  {customLinks.filter((item) => {
                    const href = resolveHref(item);
                    return !href.startsWith('/vehicles') && href !== '/';
                  }).slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link href={resolveHref(item)}                         className="hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-white">Marketplace</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  {DEFAULT_MARKETPLACE_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}                         className="hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-white">Company</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  {DEFAULT_COMPANY_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}                         className="hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-white">Support</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  {DEFAULT_SUPPORT_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}                         className="hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <span>Developed by</span>
              <a
                href="https://daniyalalam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-signal-red transition-colors"
              >
                Daniyal Alam
              </a>
            </div>
            <div className="flex gap-4 text-sm text-gray-400">
              <Link href="/terms"                         className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy-policy"                         className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/contact"                         className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
