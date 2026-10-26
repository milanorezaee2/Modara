import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getLatestBlogPosts, type BlogPreviewPost } from '../../lib/catalog';
import { formatDate, imageSrcSet, optimizedAsset } from '../../lib/format';

type BlogPreviewProps = {
  onNavigate: (view: string, param?: string) => void;
};

/** Latest editorial posts shown near the bottom of the home page. */
export default function BlogPreview({ onNavigate }: BlogPreviewProps) {
  const [posts, setPosts] = useState<BlogPreviewPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLatestBlogPosts(3).then((data) => {
      if (cancelled) return;
      setPosts(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold text-dark-900 sm:text-3xl">آخرین مقالات</h2>
          <p className="text-dark-500">راهنمای مد و استایل</p>
        </div>
        <button
          onClick={() => onNavigate('blog')}
          className="group flex w-fit items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 sm:text-base"
        >
          مشاهده همه
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {loading
          ? [1, 2, 3].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-dark-100 bg-white">
                <div className="shimmer-bg aspect-video" />
                <div className="space-y-3 p-5">
                  <div className="shimmer-bg h-3 w-1/2 rounded" />
                  <div className="shimmer-bg h-4 w-3/4 rounded" />
                  <div className="shimmer-bg h-3 w-full rounded" />
                </div>
              </div>
            ))
          : posts.map((post, i) => (
              <button
                key={post.id}
                onClick={() => onNavigate('blog-post', post.slug)}
                className="animate-fade-in-up group overflow-hidden rounded-2xl border border-dark-100 bg-white text-right transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="aspect-video overflow-hidden bg-dark-50">
                  <img
                    src={optimizedAsset(post.image_url, 640)}
                    srcSet={imageSrcSet(post.image_url, [640, 960])}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    alt={post.title}
                    width={640}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs text-dark-400">
                    <span>{formatDate(post.created_at)}</span>
                    <span>•</span>
                    <span>{post.author}</span>
                  </div>
                  <h3 className="mb-2 line-clamp-2 font-bold text-dark-900 transition-colors group-hover:text-amber-700">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-dark-500">{post.excerpt}</p>
                </div>
              </button>
            ))}
      </div>
    </section>
  );
}
