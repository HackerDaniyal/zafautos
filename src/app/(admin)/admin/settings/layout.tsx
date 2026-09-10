'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNav = [
  { label: 'General', href: '/admin/settings/general' },
  { label: 'Countries', href: '/admin/settings/countries' },
  { label: 'Continents', href: '/admin/settings/continents' },
  { label: 'Currencies', href: '/admin/settings/currencies' },
  { label: 'Languages', href: '/admin/settings/languages' },
  { label: 'Company', href: '/admin/settings/company' },
  { label: 'Tax', href: '/admin/settings/tax' },
  { label: 'Email', href: '/admin/settings/email' },
  { label: 'Notifications', href: '/admin/settings/notifications' },
  { label: 'SEO', href: '/admin/settings/seo' },
  { label: 'Storage', href: '/admin/settings/storage' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
          Settings
        </h1>
        <p className="text-sm text-ash">Platform configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-56 shrink-0">
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-2">
            {settingsNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-[6px] px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-signal-red/10 text-signal-red'
                      : 'text-ash hover:bg-white/5 hover:text-pure-white'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
