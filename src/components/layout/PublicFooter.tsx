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

const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'tiktok'];

export function PublicFooter({ menuItems = [], company }: PublicFooterProps) {
  const companyName = company?.companyName || 'ZafAutos Japan';
  const companyDescription = company?.description || 'Your trusted partner for high-quality Japanese used vehicles. Exporting worldwide with full transparency and support.';

  const customLinks = menuItems
    .filter((item) => item.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const hasCustomLinks = customLinks.length > 0;

  const socialLinks = company?.socialLinks || {};

  return (
    <footer className="border-t border-iron bg-race-black">
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <span className="inline-block font-[Oswald] font-bold text-xl uppercase tracking-wider text-pure-white">{companyName}</span>
            </Link>
            <p className="mb-6 text-sm text-ash pr-4">
              {companyDescription}
            </p>
            <div className="flex gap-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const url = socialLinks[platform];
                if (!url) return null;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded bg-iron/30 hover:bg-iron flex items-center justify-center text-xs text-steel hover:text-pure-white transition-colors capitalize"
                  >
                    {platform[0].toUpperCase()}
                  </a>
                );
              })}
              {Object.keys(socialLinks).length === 0 && (
                <>
                  <div className="h-8 w-8 rounded bg-iron" />
                  <div className="h-8 w-8 rounded bg-iron" />
                  <div className="h-8 w-8 rounded bg-iron" />
                  <div className="h-8 w-8 rounded bg-iron" />
                </>
              )}
            </div>
          </div>

          {hasCustomLinks ? (
            <>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Marketplace</h3>
                <ul className="space-y-3 text-sm text-ash">
                  {customLinks.filter((item) => {
                    const href = resolveHref(item);
                    return href.startsWith('/vehicles') || href === '/';
                  }).slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link href={resolveHref(item)} className="hover:text-pure-white transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Company</h3>
                <ul className="space-y-3 text-sm text-ash">
                  {customLinks.filter((item) => {
                    const href = resolveHref(item);
                    return !href.startsWith('/vehicles') && href !== '/';
                  }).slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <Link href={resolveHref(item)} className="hover:text-pure-white transition-colors">
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
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Marketplace</h3>
                <ul className="space-y-3 text-sm text-ash">
                  {DEFAULT_MARKETPLACE_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-pure-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Company</h3>
                <ul className="space-y-3 text-sm text-ash">
                  {DEFAULT_COMPANY_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-pure-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-[Oswald] text-sm font-bold uppercase tracking-wider text-pure-white">Support</h3>
                <ul className="space-y-3 text-sm text-ash">
                  {DEFAULT_SUPPORT_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-pure-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-iron pt-8 md:flex-row">
          <p className="text-sm text-ash">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-ash">
            <Link href="/terms" className="hover:text-pure-white transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-pure-white transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-pure-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
