import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';
import { getAllProducts, getCategories } from '../lib/catalog';
import type { Category, Product } from '../lib/supabase';
import { formatPrice, imageSrcSet, optimizedAsset } from '../lib/format';

type RackHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

const ALL = 'all';

/** Warm ambient light per department, so the stage changes mood with the piece. */
const CATEGORY_TINT: Record<string, string> = {
  clothing: 'rgba(176,132,64,0.20)',
  pants: 'rgba(92,108,88,0.20)',
  glasses: 'rgba(126,110,86,0.20)',
  watch: 'rgba(150,128,92,0.22)',
  bag: 'rgba(166,118,74,0.20)',
  accessory: 'rgba(180,148,100,0.22)',
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function fa(number: number): string {
  return new Intl.NumberFormat('fa-IR').format(number);
}

/** Price tags are tiny: millions read better than nine digits at this size. */
function shortPrice(price: number): string {
  const nf = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
  if (price >= 1_000_000) return `${nf.format(price / 1_000_000)} میلیون`;
  if (price >= 1_000) return `${nf.format(Math.round(price / 1_000))} هزار`;
  return nf.format(price);
}

/**
 * A packed wardrobe reads best when departments alternate, so the rack is
 * interleaved category by category instead of showing 17 shirts in a row.
 * Deterministic, so the order is stable between renders.
 */
function interleaveByCategory(products: Product[]): Product[] {
  const buckets = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.category_id ?? '';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(product);
    else buckets.set(key, [product]);
  }
  const lists = [...buckets.values()];
  const result: Product[] = [];
  let index = 0;
  while (result.length < products.length) {
    for (const list of lists) {
      const item = list[index];
      if (item) result.push(item);
    }
    index += 1;
  }
  return result;
}

/** The brass rail the whole rack hangs from (it stays put while pieces slide). */
function RailBar() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[7px] z-0 h-[18px]"
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-[6px] h-[3px] rounded-full bg-[linear-gradient(90deg,#cdb68c_0%,#b1946a_16%,#e7d5b0_38%,#9d8050_60%,#dcc7a0_82%,#c3aa7c_100%)] shadow-[0_2px_3px_rgba(72,52,26,0.18)]" />
      <div className="absolute inset-x-0 top-[9px] h-[5px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(84,62,32,0.16),transparent_72%)] blur-[2px]" />
      <span className="absolute -top-2 left-[2%] h-[22px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f4ead4,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.2)]" />
      <span className="absolute -top-2 right-[2%] h-[22px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f4ead4,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.2)]" />
    </div>
  );
}

export default function RackHero({ onNavigate }: RackHeroProps) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  /* The header floats transparently over this stage: keep its ink dark. */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modara:hero-theme', { detail: 'light' }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllProducts(), getCategories()])
      .then(([nextProducts, nextCategories]) => {
        if (cancelled) return;
        const ordered = interleaveByCategory(nextProducts);
        setProducts(ordered);
        setCategories(nextCategories);
        setActiveId((current) => current ?? ordered[0]?.id ?? null);
      })
      .catch(() => {
        /* the hero degrades to its headings instead of breaking the page */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryBySlug = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  const visible = useMemo(
    () =>
      activeCategory === ALL
        ? products
        : products.filter((product) => {
            const category = categoryBySlug.get(product.category_id ?? '');
            return category?.slug === activeCategory;
          }),
    [activeCategory, categoryBySlug, products],
  );

  /* Filter changes land on the first piece of the new selection. */
  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [activeCategory]);

  useEffect(() => {
    if (!visible.length) return;
    setActiveId((current) =>
      current && visible.some((product) => product.id === current) ? current : visible[0].id,
    );
  }, [visible]);

  const activeProduct =
    visible.find((product) => product.id === activeId) ?? visible[0] ?? null;
  const activeIndex = activeProduct
    ? visible.findIndex((product) => product.id === activeProduct.id)
    : -1;
  const activeCategoryMeta = activeProduct
    ? categoryBySlug.get(activeProduct.category_id ?? '')
    : undefined;
  const tint = CATEGORY_TINT[activeCategoryMeta?.slug ?? ''] ?? 'rgba(176,132,64,0.2)';

  const updateScrollHints = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    // In RTL the scroll origin sits at the right edge, so progress is negative.
    const offset = Math.abs(track.scrollLeft);
    setHasScrolled(offset > 8);
    setCanScrollMore(offset < max - 8);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', updateScrollHints, { passive: true });
    window.addEventListener('resize', updateScrollHints);
    return () => {
      track.removeEventListener('scroll', updateScrollHints);
      window.removeEventListener('resize', updateScrollHints);
    };
  }, [updateScrollHints, visible.length]);

  /** Keep the arrow-key selection inside the visible part of the rack. */
  const revealPiece = useCallback(
    (id: string) => {
      const track = trackRef.current;
      if (!track) return;
      const piece = track.querySelector<HTMLElement>(`[data-piece="${id}"]`);
      if (!piece) return;
      const pieceRect = piece.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      if (pieceRect.right > trackRect.right || pieceRect.left < trackRect.left) {
        piece.scrollIntoView({
          inline: 'center',
          block: 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      }
    },
    [reduceMotion],
  );

  const moveActive = (step: 1 | -1) => {
    if (visible.length < 2) return;
    const from = activeIndex < 0 ? 0 : activeIndex;
    const next = (from + step + visible.length) % visible.length;
    const nextProduct = visible[next];
    setActiveId(nextProduct.id);
    revealPiece(nextProduct.id);
  };

  /** In RTL the next piece sits to the left, so the arrows and keys invert. */
  const nudgeTrack = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(220, track.clientWidth * 0.7),
      behavior: 'smooth',
    });
  };

  const onRackKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      if (visible[0]) {
        setActiveId(visible[0].id);
        revealPiece(visible[0].id);
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = visible[visible.length - 1];
      if (last) {
        setActiveId(last.id);
        revealPiece(last.id);
      }
    }
  };

  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      const slug = categoryBySlug.get(product.category_id ?? '')?.slug ?? '';
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return [
      { slug: ALL, name: 'همه', count: products.length },
      ...categories.map((category) => ({
        slug: category.slug,
        name: category.name,
        count: counts.get(category.slug) ?? 0,
      })),
    ];
  }, [categories, categoryBySlug, products]);

  return (
    <section
      aria-label="رگال کالکشن مُدارا"
      className="relative isolate overflow-hidden bg-[#efeae1] pb-12 pt-24 sm:pb-16 sm:pt-28"
    >
      {/* Warm studio light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, #fbf8f3 0%, #f3eee5 42%, #ebe5da 72%, #e4ddd0 100%)',
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ backgroundColor: tint }}
        transition={{ duration: 0.9, ease: EASE }}
        className="pointer-events-none absolute -left-40 top-1/4 -z-10 h-[560px] w-[560px] rounded-full blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-10 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_70%)] blur-2xl"
      />
      {/* A whisper of film grain so the studio light feels photographed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8">
        {/* Headline */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: EASE }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] font-bold text-[#9a8358] sm:text-[11.5px]">
            <span className="h-px w-8 bg-[#bda77c] sm:w-12" aria-hidden="true" />
            <span>رگال مُدارا</span>
            <span className="h-1 w-1 rounded-full bg-[#c3ac81]" aria-hidden="true" />
            <span>{loading ? 'در حال چیدن…' : `${fa(products.length)} قطعه`}</span>
            <span className="h-px w-8 bg-[#bda77c] sm:w-12" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-balance text-[clamp(1.6rem,4.4vw,3.05rem)] font-extrabold leading-[1.3] text-[#241d14]">
            تمامِ کالکشن، از بغل روی یک رگال
            <span className="mt-1 block text-[#8b6f3e] sm:mt-2">
              روی هر قطعه بایستید تا کامل باز شود
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-balance text-[13px] leading-6 text-[#6b6152] sm:text-sm sm:leading-7">
            همهٔ محصولات فروشگاه، قطعه‌به‌قطعه کنار هم چیده شده‌اند؛ از بغل فقط لبه‌شان پیداست.
            با هاور یا کلیدهای جهت‌دار، هر قطعه کامل نمایش داده می‌شود.
          </p>
        </motion.div>

        {/* Department filters */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:mt-8">
          {filters.map((filter) => {
            const isActive = filter.slug === activeCategory;
            return (
              <button
                key={filter.slug}
                type="button"
                onClick={() => setActiveCategory(filter.slug)}
                aria-pressed={isActive}
                className={`group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition-all duration-300 sm:text-xs ${
                  isActive
                    ? 'border-[#241d14] bg-[#241d14] text-[#f7f1e4] shadow-[0_10px_24px_-14px_rgba(36,29,20,0.9)]'
                    : 'border-[#d8cbb2] bg-[#fdfaf2]/60 text-[#6b6152] hover:border-[#a3783a] hover:text-[#8b6f3e]'
                }`}
              >
                {filter.name}
                <span
                  className={`text-[9.5px] font-bold ${
                    isActive ? 'text-[#d9bd84]' : 'text-[#a99c86]'
                  }`}
                >
                  {fa(filter.count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stage: whatever piece you are on, shown in full */}
        <div className="mt-8 grid items-center gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
          <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70 blur-3xl"
              style={{ background: `radial-gradient(circle at 50% 60%, ${tint}, transparent 70%)` }}
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] bg-[#e7e1d6] shadow-[0_40px_70px_-45px_rgba(45,33,18,0.7)] ring-1 ring-[#d9cdb6]/70">
              <AnimatePresence mode="popLayout" initial={false}>
                {activeProduct ? (
                  <motion.img
                    key={activeProduct.id}
                    initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.55, ease: EASE }}
                    src={optimizedAsset(activeProduct.image_url, 720)}
                    srcSet={imageSrcSet(activeProduct.image_url, [480, 720])}
                    sizes="(min-width: 1024px) 44vw, 90vw"
                    alt={activeProduct.name}
                    className="h-full w-full object-cover"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[#ded6c8]" aria-hidden="true" />
                )}
              </AnimatePresence>

              {/* Stage chrome: department badge + position in the rack */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
                <span className="rounded-full bg-[#fdfaf2]/92 px-2.5 py-1 text-[10px] font-bold text-[#54452f] shadow-[0_8px_18px_-12px_rgba(45,33,18,0.8)] backdrop-blur-sm">
                  {activeCategoryMeta?.name ?? 'کالکشن'}
                </span>
                {activeIndex >= 0 && (
                  <span className="rounded-full bg-[#241d14]/78 px-2.5 py-1 text-[10px] font-bold text-[#f2e7cf] backdrop-blur-sm">
                    {fa(activeIndex + 1)} / {fa(visible.length)}
                  </span>
                )}
              </div>

              {/* The price, on the shop's hang tag */}
              {activeProduct && (
                <div className="pointer-events-none absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
                  <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#a3783a] bg-[#fdfaf2]/95 px-2.5 py-1.5 text-[11px] font-bold text-[#3f3527] shadow-[0_12px_24px_-14px_rgba(45,33,18,0.9)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#a3783a]" aria-hidden="true" />
                    {formatPrice(activeProduct.price)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stage copy */}
          <div className="text-center lg:text-right">
            <AnimatePresence mode="wait" initial={false}>
              {activeProduct && (
                <motion.div
                  key={activeProduct.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <p className="text-[11px] font-bold text-[#a3854c]">
                    {activeCategoryMeta?.name ?? 'محصول مُدارا'}
                  </p>
                  <h2 className="mt-2 text-balance text-[clamp(1.15rem,2.4vw,1.9rem)] font-bold leading-snug text-[#241d14]">
                    {activeProduct.name}
                  </h2>

                  <div className="mt-3 flex items-center justify-center gap-2 lg:justify-start">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fdfaf2]/80 px-2 py-1 text-[11px] font-bold text-[#54452f] ring-1 ring-[#ded3bd]">
                      <Star className="h-3 w-3 fill-[#c0913f] text-[#c0913f]" aria-hidden="true" />
                      {fa(Number(activeProduct.rating.toFixed(1)))}
                    </span>
                    <span className="text-[11px] text-[#8d8271]">
                      {activeProduct.stock > 0
                        ? `${fa(activeProduct.stock)} عدد موجود`
                        : 'ناموجود'}
                    </span>
                  </div>

                  <p className="mx-auto mt-3 line-clamp-2 max-w-md text-[12.5px] leading-6 text-[#6b6152] lg:mx-0">
                    {activeProduct.description}
                  </p>

                  <div className="mt-5 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center lg:justify-start">
                    <button
                      type="button"
                      onClick={() => onNavigate('product', activeProduct.slug)}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241d14] px-6 py-3 text-[13px] font-semibold text-[#f7f1e4] shadow-[0_18px_34px_-18px_rgba(36,29,20,0.85)] transition-all duration-300 hover:bg-[#3a2f20] active:scale-[0.98] sm:w-auto"
                    >
                      مشاهدهٔ محصول
                      <ArrowLeft
                        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop')}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#c9bba0] bg-[#fdfaf2]/70 px-6 py-3 text-[13px] font-semibold text-[#4c4234] backdrop-blur-sm transition-all duration-300 hover:border-[#a3783a] hover:text-[#8b6f3e] sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4 text-[#b99a63]" aria-hidden="true" />
                      همهٔ محصولات
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* The rack: every product, edge-on */}
        <div className="relative mt-9 sm:mt-11">
          <RailBar />

          <div className="relative">
            <ul
              ref={trackRef}
              aria-label="همهٔ محصولات روی رگال"
              onKeyDown={onRackKeyDown}
              className="scrollbar-hide -mx-4 flex snap-x snap-mandatory items-start gap-0 overflow-x-auto px-4 pb-2 pt-1 sm:mx-0 sm:px-0"
            >
              {loading &&
                Array.from({ length: 18 }).map((_, index) => (
                  <li
                    key={`skeleton-${index}`}
                    aria-hidden="true"
                    className="shrink-0 animate-pulse rounded-t-[8px] bg-[#ded6c8]"
                    style={{
                      width: 'clamp(38px, 5vw, 54px)',
                      height: `${132 + (index % 4) * 26}px`,
                    }}
                  />
                ))}

              {!loading &&
                visible.map((product, index) => {
                  const isActive = product.id === activeProduct?.id;
                  const height = 170 + ((index * 3 + (index % 4)) % 4) * 26; // 170–248px rhythm
                  return (
                    <li
                      key={product.id}
                      className={`shrink-0 snap-center ${
                        index === 0 ? '' : '-ms-[6px] first:ms-0'
                      }`}
                    >
                      <button
                        id={`rack-piece-${product.id}`}
                        data-piece={product.id}
                        type="button"
                        aria-pressed={isActive}
                        aria-label={`${product.name}، ${formatPrice(product.price)}`}
                        onMouseEnter={() => setActiveId(product.id)}
                        onFocus={() => setActiveId(product.id)}
                        onClick={() => setActiveId(product.id)}
                        className={`group/sliver relative flex flex-col items-center outline-none ${
                          isActive ? 'z-20' : 'z-0'
                        }`}
                      >
                        {/* hanger hook on the rail */}
                        <span
                          aria-hidden="true"
                          className={`flex flex-col items-center transition-colors duration-300 ${
                            isActive ? 'text-[#8a6a34]' : 'text-[#a99a80]'
                          }`}
                        >
                          <span className="h-[7px] w-[6px] rounded-full border border-current" />
                          <span className="h-[7px] w-px bg-current" />
                        </span>

                        {/* the piece itself: a narrow, edge-on slice of the product */}
                        <span
                          className={`relative block overflow-hidden rounded-t-[9px] border-e border-[#241d14]/12 transition-all duration-500 ease-out ${
                            isActive
                              ? '-translate-y-[5px] shadow-[0_22px_30px_-20px_rgba(45,33,18,0.9)] ring-2 ring-[#a3783a] ring-offset-2 ring-offset-[#efeae1]'
                              : 'shadow-[0_10px_18px_-14px_rgba(45,33,18,0.7)] group-hover/sliver:-translate-y-[3px]'
                          }`}
                          style={
                            {
                              width: 'clamp(38px, 5vw, 54px)',
                              height: `clamp(${Math.round(height * 0.72)}px, ${Math.round(
                                height * 0.16,
                              )}vh, ${height}px)`,
                              backgroundColor: '#e3dbcd',
                            } as CSSProperties
                          }
                        >
                          <img
                            src={optimizedAsset(product.image_url, 160)}
                            alt=""
                            aria-hidden="true"
                            loading={index < 24 ? 'eager' : 'lazy'}
                            decoding="async"
                            draggable={false}
                            className={`h-full w-full select-none object-cover transition-[filter,transform] duration-500 ${
                              isActive
                                ? 'scale-[1.02] saturate-100'
                                : 'saturate-[0.92] group-hover/sliver:saturate-100'
                            }`}
                            style={{ objectPosition: '50% 34%' }}
                          />
                          {/* side light, so each sliver reads as a garment edge */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.34),rgba(255,255,255,0)_34%,rgba(24,17,8,0.14))] mix-blend-soft-light"
                          />
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-500 ${
                              isActive ? 'h-[3px] bg-[#a3783a]' : 'h-[2px] bg-[#241d14]/12'
                            }`}
                          />
                        </span>

                        {/* price whisper under the active piece */}
                        <span
                          className={`mt-1.5 whitespace-nowrap text-[9px] font-bold transition-all duration-300 ${
                            isActive
                              ? 'translate-y-0 text-[#8b6f3e] opacity-100'
                              : 'translate-y-1 text-[#a99c86] opacity-0'
                          }`}
                        >
                          {shortPrice(product.price)}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>

            {/* edge fades */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 ${
                hasScrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 ${
                canScrollMore ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Rack controls */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => nudgeTrack(1)}
              aria-label="قطعه‌های قبلی"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9ae] bg-[#fdfaf2]/80 text-[#6b5d45] transition-opacity hover:border-[#a3783a] ${
                hasScrolled ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-[10.5px] text-[#8d8271]">
              {activeIndex >= 0
                ? `${fa(activeIndex + 1)} از ${fa(visible.length)} — برای دیدن بقیه، رگال را بکشید`
                : 'برای دیدن بقیه، رگال را بکشید'}
            </span>
            <button
              type="button"
              onClick={() => nudgeTrack(-1)}
              aria-label="قطعه‌های بعدی"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9ae] bg-[#fdfaf2]/80 text-[#6b5d45] transition-opacity hover:border-[#a3783a] ${
                canScrollMore ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
