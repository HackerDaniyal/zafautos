'use client';

import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <MapPinOff className="mb-6 size-16 text-signal-red" />
      <h1 className="font-[Oswald] text-8xl font-bold text-pure-white">404</h1>
      <h2 className="mt-4 font-[Oswald] text-2xl font-bold uppercase tracking-wider text-pure-white">
        Page Not Found
      </h2>
      <p className="mt-3 max-w-md text-ash">
        The admin page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/admin"
          className="rounded-[6px] border border-iron bg-signal-red px-6 py-3 text-sm font-medium uppercase tracking-wider text-pure-white transition-colors hover:bg-deep-red"
        >
          Return to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="rounded-[6px] border border-iron bg-transparent px-6 py-3 text-sm font-medium uppercase tracking-wider text-pure-white transition-colors hover:bg-white/5 hover:border-pure-white"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
