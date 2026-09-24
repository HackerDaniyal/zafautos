import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
});

// Phase 8 — CSP nonce architecture.
// The middleware sets a per-request CSP nonce; Next.js stamps it onto inline
// <script> tags during request-time app-render (getScriptNonceFromHeader).
// Build-time prerendered HTML is served as-is and can never carry a per-request
// nonce, so under `script-src 'nonce-…' 'strict-dynamic'` its inline scripts
// (RSC flight payload) would be blocked and hydration would break. Forcing
// dynamic rendering for the whole tree guarantees every document request is
// rendered with the request nonce. (Middleware also already sends
// Cache-Control: no-store on all responses, so prerendering provided no
// client/CDN caching benefit — only saved server render time.)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Zaf Autos Japan',
  description: 'Imported. Inspected. Ready. Zaf Autos Japan marketplace.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // next-themes renders its own theme-init <script> at render time. Under
  // script-src 'nonce-…' 'strict-dynamic' that inline script is blocked
  // unless it carries the request nonce (it was the only nonce-less script
  // in the document). Middleware forwards the full CSP on the REQUEST
  // headers, so extract the nonce here and hand it to the provider.
  const requestHeaders = await headers();
  const csp = requestHeaders.get('content-security-policy');
  const nonce = csp ? /nonce-([^;'\s]+)/.exec(csp)?.[1] : undefined;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          nonce={nonce}
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
