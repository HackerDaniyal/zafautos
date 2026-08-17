'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  Shield,
  ShoppingBag,
  CreditCard,
  Truck,
  FileText,
  PenTool,
  File,
  Image,
  UsersRound,
  KeyRound,
  Settings,
  BarChart3,
  ScrollText,
  Tag,
  Layers,
  Box,
  Fuel,
  Palette,
  Menu,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavigation, type NavItem } from './navigation-data';
import { logout } from '@/server/actions/authActions';
import { useRouter } from 'next/navigation';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Car,
  Users,
  Shield,
  ShoppingBag,
  CreditCard,
  Truck,
  FileText,
  PenTool,
  File,
  Image,
  UsersRound,
  KeyRound,
  Settings,
  BarChart3,
  ScrollText,
  Tag,
  Layers,
  Box,
  Fuel,
  Palette,
  Menu,
};

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    () => new Set(['Overview', 'Inventory', 'People', 'Commerce', 'Content', 'System'])
  );

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-iron/30 bg-deep-carbon transition-all',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-iron/30',
        collapsed ? 'justify-center px-2 py-4' : 'justify-between px-6 py-4'
      )}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-1">
            <span className="font-[Oswald] text-lg font-bold text-signal-red uppercase">ZAF</span>
            <span className="font-[Oswald] text-lg font-bold text-pure-white uppercase">AUTOS</span>
          </Link>
        )}
      </div>

      {/* Label */}
      {!collapsed && (
        <div className="px-6 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-steel">
            Admin Panel
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {adminNavigation.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between rounded-[6px] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-steel hover:text-ash"
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    'size-3 transition-transform',
                    !expandedGroups.has(group.label) && '-rotate-90'
                  )}
                />
              </button>
            )}

            {(collapsed || expandedGroups.has(group.label)) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-signal-red/10 text-signal-red'
                          : 'text-ash hover:bg-white/5 hover:text-pure-white',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      {Icon && <Icon className="size-4 shrink-0" />}
                      {!collapsed && item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-iron/30 px-3 py-3">
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium text-ash hover:bg-white/5 hover:text-pure-white transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
