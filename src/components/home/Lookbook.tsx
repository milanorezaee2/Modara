import { useEffect, useMemo, useState } from 'react';
import { ArrowUpLeft } from 'lucide-react';
import type { Product } from '../../lib/supabase';
import { getTopRatedProducts } from '../../lib/catalog';
import { formatPrice, imageSrcSet, optimizedAsset } from '../../lib/format';
import SectionHeading, { Reveal } from './SectionHeading';

type LookbookProps = {
  onNavigate: (view: string, param?: string) => void;
};

/** One highlight per category first keeps the gallery visually diverse. */
function pickLookbook(products: Product[]): Product[] {
  const seenCategories = new Set<string | null>();
  const picked: Product[] = [];
  for (const product of products) {
    if (!product.image_url || seenCategories.has(product.category_id)) continue;
    seenCategories.add(product.category_id);
    picked.push(product);
    if (picked.length >= 6) break;
  }
  for (const product of products) {
    if (picked.length >= 8) break;
    if (product.image_url && !picked.includes(product)) picked.push(product);
  }
  return picked;
}

/** Editorial masonry row-span pattern: tall, short, short, tall… */
const spanPattern = [
  'row-span-2',
  'row-span-1',
  'row-span-1',
  'row-span-2',
  'row-span-1',
  'row-span-1',
  'row-span-2',
  'row-span-1',
];

/** Shoppable lookbook gallery built from real catalogue imagery. */
export default function Lookbook({ onNavigate }: LookbookProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Twenty-four top-rated rows are enough to cover all six categories and
    // fill the eight-tile gallery; the previous query fetched twice as many.
    getTopRatedProducts(24).then((data) => {
      if (cancelled) return;
      setProducts(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = useMemo(() => pickLookbook(products), [products]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8" dir="rtl">
      <SectionHeading
        eyebrow="لوک‌بوک این فصل"
        eyebrowEn="SHOP THE LOOK"
        title="استایل‌ها، آمادهٔ خرید"
        description="قطعه‌های برگزیدهٔ این فصل از نگاه دوربین ما؛ روی هر تصویر بزنید تا همان محصول را ببینید."
      />

      {loading ? (
        <div className="grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 md:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={`shimmer-bg rounded-3xl ${spanPattern[i]}`} />
          ))}
        </div>
      ) : (
        <div className="grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 md:grid-cols-4">
          {tiles.map((product, i) => (
            <Reveal key={product.id} delay={0.05 * i} className={spanPattern[i % spanPattern.length]}>
              <button
                type="button"
                onClick={() => onNavigate('product', product.slug)}
                aria-label={`مشاهده ${product.name}`}
                className="group relative block h-full w-full overflow-hidden rounded-3xl bg-[#efe7d8] text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <img
                  src={optimizedAsset(product.image_url, 480)}
                  srcSet={imageSrcSet(product.image_url, [480, 720])}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  alt={product.name}
                  width={480}
                  height={640}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.07]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#120d08]/75 via-[#120d08]/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/20 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <ArrowUpLeft className="h-4 w-4" />
                </span>
                <span className="absolute inset-x-0 bottom-0 block translate-y-1 p-4 transition-transform duration-500 group-hover:translate-y-0 sm:p-5">
                  <span className="block truncate text-sm font-bold text-white sm:text-[15px]">
                    {product.name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-gold-300 sm:text-sm">
                    {formatPrice(product.price)}
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
