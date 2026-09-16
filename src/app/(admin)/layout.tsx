'use client';

import * as React from 'react';
import { Sidebar } from '@/components/admin/navigation/sidebar';
import { Topbar } from '@/components/admin/navigation/topbar';
import { ToastProvider } from '@/components/admin/ui/toast-provider';
import { cn } from '@/lib/utils';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="admin-theme flex min-h-screen">
      <ToastProvider />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar collapsed={collapsed} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 bg-race-black">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
