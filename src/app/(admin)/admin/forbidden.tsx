import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

export default function AdminForbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <ShieldOff className="mb-6 size-16 text-signal-red" />
      <h1 className="font-[Oswald] text-8xl font-bold text-pure-white">403</h1>
      <h2 className="mt-4 font-[Oswald] text-2xl font-bold uppercase tracking-wider text-pure-white">
        Access Denied
      </h2>
      <p className="mt-3 max-w-md text-ash">
        You don&apos;t have permission to access this page.
      </p>
      <div className="mt-8">
        <Link
          href="/admin"
          className="rounded-[6px] border border-iron bg-signal-red px-6 py-3 text-sm font-medium uppercase tracking-wider text-pure-white transition-colors hover:bg-deep-red"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
