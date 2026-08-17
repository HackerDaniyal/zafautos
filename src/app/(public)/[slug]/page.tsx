import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CmsRepository } from '@/server/repositories';
import { SettingsService } from '@/server/services';
import { MainContainer } from '@/components/layout/MainContainer';

const cmsRepo = new CmsRepository();
const settingsService = new SettingsService();

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

const RESERVED_SLUGS = new Set([
  'vehicles', 'compare', 'wishlist', 'contact', 'login', 'register',
  'admin', 'api', 'dashboard',
]);

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    return {};
  }

  const page = await cmsRepo.findPublishedBySlug(slug);
  if (!page) return {};

  const seoSettings = await settingsService.getSeoSettings();
  const globalTitle = seoSettings?.siteTitle ?? 'ZafAutos Japan';
  const globalDescription = seoSettings?.siteDescription ?? '';
  const globalOgImage = seoSettings?.ogImage ?? null;

  const title = page.seoTitle || `${page.title} | ${globalTitle}`;
  const description = page.metaDescription || globalDescription;
  const ogImage = page.ogImage || globalOgImage;

  const robotsParts: string[] = [];
  if (!page.robotsIndex) robotsParts.push('noindex');
  if (!page.robotsFollow) robotsParts.push('nofollow');
  const robots = robotsParts.length > 0 ? robotsParts.join(', ') : undefined;

  return {
    title,
    description,
    robots,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      type: 'website',
    },
    ...(page.canonicalUrl ? { alternates: { canonical: page.canonicalUrl } } : {}),
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(slug)) {
    notFound();
  }

  const page = await cmsRepo.findPublishedBySlug(slug);
  if (!page) {
    notFound();
  }

  return (
    <MainContainer className="py-12 md:py-16 lg:py-20">
      <article className="mx-auto max-w-4xl">
        <h1 className="font-[Oswald] text-4xl font-bold uppercase tracking-wide text-pure-white md:text-5xl">
          {page.title}
        </h1>
        {page.publishedAt && (
          <time className="mt-4 block text-sm text-steel">
            Published {new Date(page.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
        )}
        {page.content && (
          <div
            className="prose prose-invert prose-lg mt-8 max-w-none text-ash
              prose-headings:font-[Oswald] prose-headings:uppercase prose-headings:tracking-wide
              prose-h2:text-2xl prose-h3:text-xl
              prose-a:text-signal-red prose-a:no-underline hover:prose-a:underline
              prose-strong:text-pure-white
              prose-code:text-signal-red prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-carbon prose-pre:border prose-pre:border-iron
              [&>*:first-child]:mt-0"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </article>
    </MainContainer>
  );
}
