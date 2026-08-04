'use client';

import Link from 'next/link';
import { Plus, ShoppingCart, Users, Globe, Settings } from 'lucide-react';

const actions = [
  { label: 'New Vehicle', href: '/admin/vehicles/new', icon: Plus },
  { label: 'New Order', href: '/admin/orders/new', icon: ShoppingCart },
  { label: 'New Customer', href: '/admin/customers/new', icon: Users },
  { label: 'Countries', href: '/admin/settings/countries', icon: Globe },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

function DashboardQuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="inline-flex items-center gap-2 rounded-[6px] border border-iron/30 bg-carbon px-4 py-2 text-sm font-medium text-ash hover:bg-white/5 hover:text-pure-white transition-colors"
        >
          <a.icon className="size-4" />
          {a.label}
        </Link>
      ))}
    </div>
  );
}

export { DashboardQuickActions };
