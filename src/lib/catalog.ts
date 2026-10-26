import {
  supabase,
  type BlogPost,
  type Category,
  type Product,
  type Review,
} from './supabase';

export const PRODUCT_CARD_COLUMNS =
  'id,name,slug,description,price,image_url,category_id,rating,stock,created_at';
export const PRODUCT_PREVIEW_COLUMNS =
  'id,name,slug,price,image_url,category_id,rating';
export const CATEGORY_COLUMNS = 'id,name,slug,icon,created_at';
export const BLOG_PREVIEW_COLUMNS =
  'id,title,slug,excerpt,image_url,author,created_at';

export type ProductPreview = Pick<
  Product,
  'id' | 'name' | 'slug' | 'price' | 'image_url' | 'category_id' | 'rating'
>;
export type BlogPreviewPost = Omit<BlogPost, 'content'>;
export type ReviewPreview = Pick<
  Review,
  'id' | 'product_id' | 'name' | 'rating' | 'comment' | 'created_at'
> & {
  product?: Pick<Product, 'id' | 'name' | 'slug'>;
};

const CACHE_TTL_MS = 30_000;

type CacheEntry = {
  expiresAt: number;
  promise: Promise<unknown>;
};

const queryCache = new Map<string, CacheEntry>();

function cachedQuery<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = queryCache.get(key);
  if (existing && existing.expiresAt > now) return existing.promise as Promise<T>;

  const promise = loader().catch((error: unknown) => {
    queryCache.delete(key);
    throw error;
  });
  queryCache.set(key, { expiresAt: now + CACHE_TTL_MS, promise });
  return promise;
}

export function clearCatalogCache() {
  queryCache.clear();
}

export function getCategories(orderByName = false): Promise<Category[]> {
  return cachedQuery(`categories:${orderByName ? 'name' : 'default'}`, async () => {
    const query = supabase.from('categories').select(CATEGORY_COLUMNS);
    const { data } = orderByName
      ? await query.order('name', { ascending: true })
      : await query;
    return (data ?? []) as Category[];
  });
}

export function getTopRatedProducts(limit: number): Promise<Product[]> {
  return cachedQuery(`products:top:${limit}`, async () => {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_CARD_COLUMNS)
      .order('rating', { ascending: false })
      .limit(limit);
    return (data ?? []) as Product[];
  });
}

export function getNewestProducts(limit: number): Promise<Product[]> {
  return cachedQuery(`products:newest:${limit}`, async () => {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_CARD_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as Product[];
  });
}

export function getProductsBySlugs(slugs: readonly string[]): Promise<ProductPreview[]> {
  const key = [...slugs].sort().join('|');
  return cachedQuery(`products:slugs:${key}`, async () => {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_PREVIEW_COLUMNS)
      .in('slug', [...slugs]);
    return (data ?? []) as unknown as ProductPreview[];
  });
}

export function getCategoryProducts(categorySlug: string): Promise<Product[]> {
  return cachedQuery(`products:category:${categorySlug}`, async () => {
    const categories = await getCategories();
    const category =
      categories.find((item) => item.slug === categorySlug) ??
      categories.find((item) => item.id === `cat-${categorySlug}`);
    const categoryId = category?.id ?? `cat-${categorySlug}`;

    const { data } = await supabase
      .from('products')
      .select(PRODUCT_CARD_COLUMNS)
      .eq('category_id', categoryId)
      .order('rating', { ascending: false });
    return (data ?? []) as Product[];
  });
}

export function getLatestBlogPosts(limit: number): Promise<BlogPreviewPost[]> {
  return cachedQuery(`blog:latest:${limit}`, async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select(BLOG_PREVIEW_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as unknown as BlogPreviewPost[];
  });
}

export function getFeaturedReviews(limit = 60): Promise<ReviewPreview[]> {
  return cachedQuery(`reviews:featured:${limit}`, async () => {
    const { data } = await supabase
      .from('reviews')
      .select(
        'id,product_id,name,rating,comment,created_at,product:products(id,name,slug)',
      )
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as unknown as ReviewPreview[];
  });
}

export function getReviewRatings(limit = 1000): Promise<number[]> {
  return cachedQuery(`reviews:ratings:${limit}`, async () => {
    const { data } = await supabase.from('reviews').select('rating').limit(limit);
    return ((data ?? []) as Array<{ rating: number }>).map((item) => item.rating || 0);
  });
}
