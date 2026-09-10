'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMenuClick?: () => void;
}

function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  return (
    <header className="flex items-center justify-between border-b border-iron/30 bg-deep-carbon px-4 py-3 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-steel hover:text-pure-white"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && <ChevronRight className="size-3 text-steel" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-pure-white font-medium">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="text-ash hover:text-pure-white transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-steel hover:text-pure-white"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-signal-red" />
        </Button>
      </div>
    </header>
  );
}

export { Topbar };
