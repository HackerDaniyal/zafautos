import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h2 className="font-[Oswald] text-8xl font-bold text-pure-white mb-4">404</h2>
      <h3 className="font-[Oswald] text-2xl font-bold uppercase tracking-wider text-pure-white mb-4">Page Not Found</h3>
      <p className="text-ash mb-8 max-w-md">
        The vehicle or page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="border border-iron text-pure-white px-6 py-3 rounded-[6px] font-medium uppercase text-sm tracking-wider hover:bg-white/5 hover:border-pure-white transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
