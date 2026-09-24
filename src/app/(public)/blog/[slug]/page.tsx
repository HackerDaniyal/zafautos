import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { CmsService } from '@/server/services/cmsService';
import { sanitizeCmsHtml } from '@/lib/utils/htmlSanitize';

type Props = { params: Promise<{ slug: string }> };

const cmsService = new CmsService();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await cmsService.getPublishedBlogPostBySlug(slug);
    return { title: `${post.title} | ZafAutos Blog`, description: post.seoDescription || post.excerpt || '' };
  } catch { return { title: 'Blog Post | ZafAutos' }; }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post;
  try { post = await cmsService.getPublishedBlogPostBySlug(slug); } catch { notFound(); }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="mb-6">
            {post.category && <Badge variant="outline" className="mb-2">{post.category}</Badge>}
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {post.author && <span>By {post.author}</span>}
              {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
            </div>
          </div>
          {post.featuredImageUrl && (
            <div className="mb-8 aspect-video overflow-hidden rounded-[10px]">
              <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          {post.content && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(post.content) }} />
          )}
          {post.tags && (
            <div className="mt-8 pt-4 border-t border-gray-200/30">
              <span className="text-sm text-gray-500">Tags: </span>
              {post.tags.split(',').map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="mr-1">{tag.trim()}</Badge>
              ))}
            </div>
          )}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
