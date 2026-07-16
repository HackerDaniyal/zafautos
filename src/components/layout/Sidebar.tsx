import React from 'react';

export function Sidebar({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block md:w-64">
      <div className="h-full py-6 pr-6 lg:py-8">
        <div className="w-full">
          {children || <p className="text-sm text-muted-foreground">Navigation Items</p>}
        </div>
      </div>
    </aside>
  );
}
