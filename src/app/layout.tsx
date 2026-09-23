import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
