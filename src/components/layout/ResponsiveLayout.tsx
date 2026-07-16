import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, sidebar, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 ${className}`}>
      {sidebar && sidebar}
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
        <div className="mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}

export function SectionWrapper({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`py-8 md:py-12 ${className}`}>
      <div className="container">
        {children}
      </div>
    </section>
  );
}

export function PageHeader({ 
  title, 
  description,
  action 
}: { 
  title: string; 
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
