import React from 'react';
import Link from 'next/link';
import { AuthLogo } from './auth-card';

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-race-black">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AuthLogo />
          {children}
        </div>
      </main>
      <footer className="border-t border-iron/30 py-6 text-center text-xs text-steel">
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="hover:text-pure-white transition-colors">
            Home
          </Link>
          <span className="text-iron">|</span>
          <Link href="/vehicles" className="hover:text-pure-white transition-colors">
            Vehicles
          </Link>
          <span className="text-iron">|</span>
          <Link href="/contact" className="hover:text-pure-white transition-colors">
            Contact
          </Link>
        </div>
        <p className="mt-3">
          &copy; {new Date().getFullYear()} ZafAutos Japan. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export { AuthLayout };
