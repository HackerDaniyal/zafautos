import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { CmsService } from '@/server/services/cmsService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | ZafAutos',
  description: 'Read the latest news and articles from ZafAutos.',
};

const cmsService = new CmsService();

export default async function BlogPage() {
  const result = await cmsService.getPublishedBlogPosts({ limit: 20 });
  const posts = result.items || [];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-gray-500 mb-8">Read the latest news and articles from ZafAutos.</p>
          {posts.length === 0 ? (
            <p className="text-gray-500">No blog posts available yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="border-gray-200/30 bg-white hover:border-signal-red/50 transition-colors h-full">
                    {post.featuredImageUrl && (
                      <div className="aspect-video overflow-hidden rounded-t-[10px]">
                        <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      {post.category && <Badge variant="outline" className="mb-2">{post.category}</Badge>}
                      <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                      {post.excerpt && <p className="text-gray-500 text-sm line-clamp-3">{post.excerpt}</p>}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        {post.author && <span>By {post.author}</span>}
                        {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
