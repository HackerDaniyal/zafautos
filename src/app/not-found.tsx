import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h2 className="font-display text-8xl font-bold text-primary mb-4">404</h2>
      <h3 className="font-display text-2xl font-bold uppercase mb-4">Page Not Found</h3>
      <p className="text-muted-foreground mb-8 max-w-md">
        The vehicle or page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="border border-border text-foreground px-6 py-3 rounded-md font-medium uppercase text-sm tracking-wide hover:bg-accent transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
