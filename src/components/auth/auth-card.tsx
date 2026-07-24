import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  footer?: React.ReactNode;
}

function AuthCard({ children, title, description, className, footer }: AuthCardProps) {
  return (
    <Card className={cn('w-full max-w-md border-iron/50 bg-carbon/80 backdrop-blur-sm', className)}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-ash text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && (
        <div className="border-t border-iron/50 px-6 py-4 text-center text-sm text-ash">
          {footer}
        </div>
      )}
    </Card>
  );
}

function AuthLogo() {
  return (
    <Link href="/" className="flex items-center justify-center gap-2 mb-6">
      <div className="flex items-center gap-1">
        <span className="font-display text-2xl font-bold text-signal-red tracking-wider">
          ZAF
        </span>
        <span className="font-display text-2xl font-bold text-pure-white tracking-wider">
          AUTOS
        </span>
      </div>
      <span className="text-xs text-steel font-medium tracking-widest uppercase">
        Japan
      </span>
    </Link>
  );
}

export { AuthCard, AuthLogo };
