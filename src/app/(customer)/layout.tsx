'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Car, ShoppingBag, MessageSquare, Settings, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/server/actions/authActions';

const NAV_ITEMS = [
  { href: '/customer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customer/vehicles', label: 'My Vehicles', icon: Car },
  { href: '/customer/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/customer/messages', label: 'Messages', icon: MessageSquare },
  { href: '/customer/settings', label: 'Settings', icon: Settings },
];

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-race-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-iron/30 bg-deep-carbon transition-transform lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-iron/30 px-6 py-4">
            <Link href="/" className="flex items-center gap-1">
              <span className="font-display text-lg font-bold text-signal-red">ZAF</span>
              <span className="font-display text-lg font-bold text-pure-white">AUTOS</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-steel hover:text-pure-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/customer' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-signal-red/10 text-signal-red'
                      : 'text-ash hover:bg-white/5 hover:text-pure-white'
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-iron/30 px-3 py-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ash hover:bg-white/5 hover:text-pure-white transition-colors"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-4 border-b border-iron/30 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-steel hover:text-pure-white"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-1">
            <span className="font-display text-lg font-bold text-signal-red">ZAF</span>
            <span className="font-display text-lg font-bold text-pure-white">AUTOS</span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
