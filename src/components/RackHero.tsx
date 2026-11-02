import {
  Fragment,
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
import { asset, formatPrice, imageSrcSet, optimizedAsset } from '../lib/format';
import { toneFor } from '../lib/productPalette';
import { hangerFor } from '../lib/hangerGarments';

type RackHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

const ALL = 'all';
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Warm ambient light per department, used only to frame the stage. */
const CATEGORY_TINT: Record<string, string> = {
  clothing: 'rgba(178,132,62,0.22)',
  pants: 'rgba(96,112,92,0.22)',
  glasses: 'rgba(126,110,86,0.22)',
  watch: 'rgba(150,128,92,0.24)',
  bag: 'rgba(168,118,72,0.22)',
  accessory: 'rgba(182,148,98,0.24)',
};

/**
 * Full-length pieces, like the reference rack: one repeating rhythm of six
 * lengths so neighbours always differ, but the line still reads as curated.
 */
const HEIGHT_STEPS = [248, 312, 276, 330, 258, 296];
const LIGHT_TONE = 55;

function fa(number: number): string {
  return new Intl.NumberFormat('fa-IR').format(number);
}

function shortPrice(price: number): string {
  const nf = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
  if (price >= 1_000_000) return `${nf.format(price / 1_000_000)} میلیون`;
  if (price >= 1_000) return `${nf.format(Math.round(price / 1_000))} هزار`;
  return nf.format(price);
}

/** Narrow, full-length garment band cut from the product photo (see scripts/). */
function rackSlice(image: string | null | undefined): string {
  if (!image) return '';
  return image.replace(/^\/images\//, '/images/rack/').replace(/\.(jpe?g|png)$/i, '.webp');
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

type RackGroup = {
  key: string;
  name: string;
  slug: string;
  products: Product[];
};

/**
 * Curated order: inside a department the pieces alternate light/dark, exactly
 * how a stylist spaces colour on a rail. Deterministic, so it never shuffles.
 */
function curate(products: Product[]): Product[] {
  const light = products
    .filter((product) => toneFor(product.image_url).l >= LIGHT_TONE)
    .sort((a, b) => toneFor(b.image_url).l - toneFor(a.image_url).l);
  const dark = products
    .filter((product) => toneFor(product.image_url).l < LIGHT_TONE)
    .sort((a, b) => toneFor(a.image_url).l - toneFor(b.image_url).l);

  const ordered: Product[] = [];
  while (light.length || dark.length) {
    const nextLight = light.shift();
    if (nextLight) ordered.push(nextLight);
    const nextDark = dark.shift();
    if (nextDark) ordered.push(nextDark);
  }
  return ordered;
}

/** Departments in catalogue order: a showroom, neatly separated. */
function groupByDepartment(products: Product[], categories: Category[]): RackGroup[] {
  const groups: RackGroup[] = categories.map((category) => ({
    key: category.slug,
    slug: category.slug,
    name: category.name,
    products: [],
  }));
  const bySlug = new Map(groups.map((group) => [group.slug, group]));
  const categorySlugById = new Map(categories.map((category) => [category.id, category.slug]));

  for (const product of products) {
    const slug = categorySlugById.get(product.category_id ?? '');
    const group = slug ? bySlug.get(slug) : undefined;
    if (group) group.products.push(product);
  }

  return groups
    .filter((group) => group.products.length > 0)
    .map((group) => ({ ...group, products: curate(group.products) }));
}

/** A thin brass rail across the stage, with wall plates at both ends. */
function RailBar() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[6px] z-20 h-[16px]"
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-[6px] h-[3px] rounded-full bg-[linear-gradient(90deg,#cdb68c_0%,#b1946a_16%,#e7d5b0_38%,#9d8050_60%,#dcc7a0_82%,#c3aa7c_100%)] shadow-[0_1px_0_rgba(255,255,255,0.55)_inset,0_2px_4px_rgba(72,52,26,0.22)]" />
      <div className="absolute inset-x-0 top-[9px] h-[6px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(84,62,32,0.18),transparent_72%)] blur-[2px]" />
      <span className="absolute -top-[3px] left-[1.5%] h-[22px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f6ecd6,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.2)]" />
      <span className="absolute -top-[3px] right-[1.5%] h-[22px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f6ecd6,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.2)]" />
    </div>
  );
}

/** A wire hanger, drawn so every piece visibly hangs from the rail. */
function Hanger({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 48 22"
      preserveAspectRatio="none"
      className={`block h-[20px] w-full transition-colors duration-300 ${
        active ? 'text-[#8a6a34]' : 'text-[#9d907c]'
      }`}
      aria-hidden="true"
    >
      {/* hook */}
      <path
        d="M24 6.2c0-2 .1-3.6 1.7-4.2 1.4-.5 2.6.4 2.6 1.7 0 1.4-1.2 2-2.4 1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* shoulders */}
      <path
        d="M24 6.4 2.5 18.4M24 6.4 45.5 18.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modara:hero-theme', { detail: 'light' }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllProducts(), getCategories()])
      .then(([nextProducts, nextCategories]) => {
        if (cancelled) return;
        setProducts(nextProducts);
        setCategories(nextCategories);
        setActiveId((current) => current ?? nextProducts[0]?.id ?? null);
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

  const allGroups = useMemo(() => groupByDepartment(products, categories), [products, categories]);

  const groups = useMemo(
    () =>
      activeCategory === ALL
        ? allGroups
        : allGroups.filter((group) => group.slug === activeCategory),
    [activeCategory, allGroups],
  );

  const visible = useMemo(() => groups.flatMap((group) => group.products), [groups]);
  const indexById = useMemo(
    () => new Map(visible.map((product, index) => [product.id, index])),
    [visible],
  );

  useEffect(() => {
    if (!visible.length) return;
    setActiveId((current) =>
      current && visible.some((product) => product.id === current) ? current : visible[0].id,
    );
  }, [visible]);

  const activeProduct = visible.find((product) => product.id === activeId) ?? visible[0] ?? null;
  const activeHanger = activeProduct ? hangerFor(activeProduct.slug) : undefined;
  const activeIndex = activeProduct ? (indexById.get(activeProduct.id) ?? -1) : -1;
  const activeCategoryMeta = activeProduct
    ? categories.find((category) => category.id === activeProduct.category_id)
    : undefined;
  const activeTone = activeHanger
    ? { hex: activeHanger.hex, l: 50 }
    : activeProduct
      ? toneFor(activeProduct.image_url)
      : null;
  const tint = activeTone
    ? withAlpha(activeTone.hex, 0.26)
    : (CATEGORY_TINT[activeCategoryMeta?.slug ?? ''] ?? 'rgba(176,132,64,0.22)');

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

  /** Keep the active piece inside the visible part of the rack. */
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
    const nextProduct = visible[(from + step + visible.length) % visible.length];
    setActiveId(nextProduct.id);
    revealPiece(nextProduct.id);
  };

  const nudgeTrack = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(240, track.clientWidth * 0.72),
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
    } else if (event.key === 'Home' && visible[0]) {
      event.preventDefault();
      setActiveId(visible[0].id);
      revealPiece(visible[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = visible[visible.length - 1];
      if (last) {
        setActiveId(last.id);
        revealPiece(last.id);
      }
    }
  };

  const filters = useMemo(
    () => [
      { slug: ALL, name: 'همه', count: products.length },
      ...allGroups.map((group) => ({
        slug: group.slug,
        name: group.name,
        count: group.products.length,
      })),
    ],
    [allGroups, products.length],
  );

  return (
    <section
      aria-label="رگال کالکشن مُدارا"
      className="relative isolate overflow-hidden bg-[#efeae1] pb-10 pt-24 sm:pt-28"
    >
      {/* Studio light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 92% at 50% -12%, #fcf9f4 0%, #f4efe6 40%, #ece6db 72%, #e3dccd 100%)',
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
        className="pointer-events-none absolute -right-32 top-10 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92),transparent_70%)] blur-2xl"
      />
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
            <span>کالکشن پاییز مُدارا</span>
            <span className="h-1 w-1 rounded-full bg-[#c3ac81]" aria-hidden="true" />
            <span>{loading ? 'در حال چیدن…' : `${fa(products.length)} قطعه`}</span>
            <span className="h-px w-8 bg-[#bda77c] sm:w-12" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-balance text-[clamp(1.6rem,4.4vw,3.05rem)] font-extrabold leading-[1.3] text-[#241d14]">
            همه‌ی کالکشن، آویزان روی یک رگال
            <span className="mt-1 block text-[#8b6f3e] sm:mt-2">
              لباس‌ها و شلوارها از بغل؛ هر قطعه که جلو بیاید، کامل دیده می‌شود
            </span>
          </h1>
        </motion.div>

        {/* Department filters */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
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

        {/* Stage: the active piece, shown in full */}
        <div className="mt-8 grid items-center gap-7 sm:mt-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
          <div className="relative mx-auto w-full max-w-[296px] sm:max-w-[344px] lg:max-w-[368px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 rounded-[46px] opacity-80 blur-3xl"
              style={{ background: `radial-gradient(circle at 50% 58%, ${tint}, transparent 70%)` }}
            />

            <div className="relative aspect-[4/5] w-full">
              <div className="absolute inset-0 overflow-hidden rounded-[22px] bg-[#e7e1d6] shadow-[0_44px_80px_-48px_rgba(45,33,18,0.75),0_2px_0_rgba(255,255,255,0.65)_inset] ring-1 ring-[#d6c9b1]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {activeProduct ? (
                    activeHanger ? (
                      <motion.div
                        key={`${activeProduct.id}-hanger`}
                        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 1.01 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.55, ease: EASE }}
                        className="flex h-full w-full items-start justify-center bg-[radial-gradient(120%_80%_at_50%_0%,#fdfaf3,#efe8dc_62%,#e4dbcb)] px-4 pt-5"
                      >
                        <img
                          src={asset(activeHanger.image)}
                          alt={activeProduct.name}
                          className="max-h-full w-auto max-w-full select-none object-contain object-top drop-shadow-[0_26px_30px_rgba(56,42,22,0.22)]"
                          decoding="async"
                        />
                      </motion.div>
                    ) : (
                      <motion.img
                        key={activeProduct.id}
                        initial={reduceMotion ? false : { opacity: 0, scale: 1.05, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 1.015, y: -6 }}
                        transition={{ duration: 0.55, ease: EASE }}
                        src={optimizedAsset(activeProduct.image_url, 720)}
                        srcSet={imageSrcSet(activeProduct.image_url, [480, 720])}
                        sizes="(min-width: 1024px) 34vw, 86vw"
                        alt={activeProduct.name}
                        className="h-full w-full object-cover"
                        decoding="async"
                      />
                    )
                  ) : (
                    <div className="h-full w-full animate-pulse bg-[#ded6c8]" aria-hidden="true" />
                  )}
                </AnimatePresence>

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/25"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,255,255,0.28),transparent_55%,rgba(24,17,8,0.16))]"
                />

                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                  <span className="rounded-full bg-[#fdfaf2]/92 px-2.5 py-1 text-[10px] font-bold text-[#54452f] shadow-[0_8px_18px_-12px_rgba(45,33,18,0.8)] backdrop-blur-sm">
                    {activeCategoryMeta?.name ?? 'کالکشن'}
                  </span>
                  {activeIndex >= 0 && (
                    <span className="rounded-full bg-[#241d14]/80 px-2.5 py-1 text-[10px] font-bold tabular-nums text-[#f2e7cf] backdrop-blur-sm">
                      {fa(activeIndex + 1)} / {fa(visible.length)}
                    </span>
                  )}
                </div>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[#fdfaf2]/70"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-12 h-3 w-3 border-r border-t border-[#fdfaf2]/50"
                />
              </div>

              {activeProduct && (
                <div className="absolute -bottom-4 -left-4 sm:-left-6">
                  <span className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#a3783a] bg-[#fdfaf2] px-2.5 py-1.5 text-[11px] font-bold text-[#3f3527] shadow-[0_16px_26px_-16px_rgba(45,33,18,0.9)]">
                    <span
                      className="h-2 w-2 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: activeTone?.hex ?? '#a3783a' }}
                      aria-hidden="true"
                    />
                    {formatPrice(activeProduct.price)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spec sheet */}
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
                  <h2 className="mt-2 text-balance text-[clamp(1.15rem,2.4vw,1.85rem)] font-bold leading-snug text-[#241d14]">
                    {activeProduct.name}
                  </h2>

                  <div className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-[#d9cdb6] overflow-hidden rounded-xl border border-[#d9cdb6] bg-[#fdfaf2]/62 text-center backdrop-blur-sm">
                    <div className="px-2 py-2.5">
                      <p className="text-[9.5px] font-semibold text-[#9a8f7c]">دسته</p>
                      <p className="mt-0.5 truncate text-[12px] font-bold text-[#3f3527]">
                        {activeCategoryMeta?.name ?? '—'}
                      </p>
                    </div>
                    <div className="px-2 py-2.5">
                      <p className="text-[9.5px] font-semibold text-[#9a8f7c]">امتیاز</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#3f3527]">
                        <Star
                          className="h-3 w-3 fill-[#c0913f] text-[#c0913f]"
                          aria-hidden="true"
                        />
                        {fa(Number(activeProduct.rating.toFixed(1)))}
                      </p>
                    </div>
                    <div className="px-2 py-2.5">
                      <p className="text-[9.5px] font-semibold text-[#9a8f7c]">موجودی</p>
                      <p className="mt-0.5 text-[12px] font-bold text-[#3f3527]">
                        {activeProduct.stock > 0 ? `${fa(activeProduct.stock)} عدد` : 'ناموجود'}
                      </p>
                    </div>
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

        {/* ---------------- the rack ---------------- */}
        <div className="relative mt-12 sm:mt-16">
          <RailBar />

          {/* Every product hangs edge-on; the camera curves away from the piece in focus */}
          <div className="relative">
            <ul
              ref={trackRef}
              aria-label="همهٔ محصولات روی رگال"
              onKeyDown={onRackKeyDown}
              className="scrollbar-hide -mx-4 flex snap-x snap-mandatory items-start gap-0 overflow-x-auto px-4 pb-7 pt-0 sm:mx-0 sm:px-0 [perspective:1400px] [perspective-origin:50%_14%]"
              style={{ '--rack-w': 'clamp(48px, 5.2vw, 64px)' } as CSSProperties}
            >
              {loading &&
                Array.from({ length: 20 }).map((_, index) => (
                  <li
                    key={`skeleton-${index}`}
                    aria-hidden="true"
                    className="shrink-0 animate-pulse rounded-t-[12px] bg-[#ded6c8] first:ms-0 ms-[10px] sm:ms-[14px]"
                    style={{
                      width: 'var(--rack-w)',
                      height: `${HEIGHT_STEPS[index % HEIGHT_STEPS.length]}px`,
                    }}
                  />
                ))}

              {!loading &&
                groups.map((group) => (
                  <Fragment key={group.key}>
                    {groups.length > 1 && (
                      <li
                        aria-hidden="true"
                        className="relative z-10 ms-[18px] shrink-0 snap-start self-stretch first:ms-0"
                      >
                        <div className="flex h-full flex-col items-center pt-[9px]">
                          <div className="flex w-max flex-col items-center rounded-[5px] border border-[#d3c3a4] bg-[#fdfaf2]/95 px-2 py-1 shadow-[0_10px_18px_-14px_rgba(45,33,18,0.85)]">
                            <span className="text-[9.5px] font-bold leading-none text-[#54452f]">
                              {group.name}
                            </span>
                            <span className="mt-0.5 text-[8.5px] font-semibold leading-none text-[#a99c86]">
                              {fa(group.products.length)}
                            </span>
                          </div>
                          <span className="mt-2 w-px flex-1 bg-[linear-gradient(180deg,rgba(177,148,106,0.5),rgba(177,148,106,0))]" />
                        </div>
                      </li>
                    )}

                    {group.products.map((product, groupProductIndex) => {
                      const index = indexById.get(product.id) ?? groupProductIndex;
                      const isActive = product.id === activeProduct?.id;
                      const tone = toneFor(product.image_url);
                      const distance = index - activeIndex;
                      const clamped = Math.max(-10, Math.min(10, distance));
                      const rotate = clamped * 2.1;
                      const depth = Math.min(66, Math.abs(distance) * 5);
                      const height = HEIGHT_STEPS[index % HEIGHT_STEPS.length];

                      return (
                        <li
                          key={product.id}
                          className="relative shrink-0 snap-center first:ms-0 ms-[10px] sm:ms-[14px]"
                          style={
                            {
                              transform: isActive
                                ? 'translateY(-10px) translateZ(40px)'
                                : `rotateY(${rotate}deg) translateZ(${-depth}px)`,
                              transformOrigin: 'top center',
                              transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
                              zIndex: isActive ? 30 : 1,
                            } as CSSProperties
                          }
                        >
                          <button
                            id={`rack-piece-${product.id}`}
                            data-piece={product.id}
                            type="button"
                            aria-pressed={isActive}
                            aria-label={`${product.name} — ${formatPrice(product.price)}`}
                            onMouseEnter={() => setActiveId(product.id)}
                            onFocus={() => setActiveId(product.id)}
                            onClick={() => setActiveId(product.id)}
                            className="group/sliver relative flex flex-col items-center outline-none"
                          >
                            {/* spotlight behind the piece in focus */}
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none absolute -inset-x-10 -top-4 bottom-0 -z-10 rounded-[999px] bg-[radial-gradient(ellipse_at_50%_30%,rgba(255,248,232,0.98),rgba(255,238,208,0.4)_55%,transparent_74%)] blur-md transition-opacity duration-500 ${
                                isActive ? 'opacity-100' : 'opacity-0'
                              }`}
                            />

                            {(() => {
                              const hanger = hangerFor(product.slug);
                              if (hanger) {
                                /* the real garment, on its own hanger */
                                return (
                                  <span
                                    className={`relative block transition-transform duration-500 ${
                                      isActive ? 'scale-[1.04]' : 'scale-100'
                                    }`}
                                    style={{ height: 'clamp(196px, 27vh, 316px)' }}
                                  >
                                    <img
                                      src={asset(hanger.image)}
                                      alt=""
                                      aria-hidden="true"
                                      loading={index < 26 ? 'eager' : 'lazy'}
                                      decoding="async"
                                      draggable={false}
                                      className={`h-full w-auto max-w-none select-none object-contain object-top transition-[filter,opacity] duration-500 ${
                                        isActive
                                          ? 'opacity-100 drop-shadow-[0_26px_26px_rgba(56,42,22,0.3)]'
                                          : 'opacity-[0.94] drop-shadow-[0_16px_18px_rgba(56,42,22,0.2)]'
                                      }`}
                                    />
                                    {isActive && (
                                      <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-full"
                                        style={{ backgroundColor: hanger.hex }}
                                      />
                                    )}
                                  </span>
                                );
                              }

                              /* departments without a cut-out yet keep the narrow edge-on slice */
                              return (
                                <>
                                  <Hanger active={isActive} />
                                  <span
                                    className={`relative block transition-[box-shadow,filter] duration-500 ${
                                      isActive
                                        ? 'shadow-[-16px_30px_38px_-30px_rgba(45,33,18,0.95),0_0_0_1px_rgba(163,120,58,0.9)]'
                                        : 'shadow-[-10px_18px_26px_-24px_rgba(45,33,18,0.85)]'
                                    }`}
                                    style={
                                      {
                                        width: 'var(--rack-w)',
                                        height: `clamp(180px, 26vh, ${height}px)`,
                                        borderRadius: '14px 14px 7px 7px',
                                      } as CSSProperties
                                    }
                                  >
                                    <span
                                      className="absolute inset-0 overflow-hidden"
                                      style={{ borderRadius: '14px 14px 7px 7px' }}
                                    >
                                      <img
                                        src={asset(rackSlice(product.image_url))}
                                        alt=""
                                        aria-hidden="true"
                                        loading={index < 26 ? 'eager' : 'lazy'}
                                        decoding="async"
                                        draggable={false}
                                        className={`h-full w-full select-none object-cover transition-[filter,transform] duration-500 ${
                                          isActive
                                            ? 'scale-[1.03] saturate-100'
                                            : 'saturate-[0.9] group-hover/sliver:saturate-100'
                                        }`}
                                        style={{ objectPosition: '50% 46%' }}
                                      />
                                      <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.05)_28%,rgba(24,17,8,0.05)_64%,rgba(24,17,8,0.36)_100%)] mix-blend-soft-light"
                                      />
                                      <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-x-0 top-0 h-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0))]"
                                      />
                                      <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(0deg,rgba(28,21,12,0.3),transparent)]"
                                      />
                                      <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-y-0 left-0 w-[7px] bg-[linear-gradient(90deg,rgba(36,29,20,0.45),rgba(36,29,20,0))]"
                                      />
                                      <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-y-0 right-0 w-[3px] opacity-80"
                                        style={{
                                          background: `linear-gradient(180deg, ${tone.hex}, ${withAlpha(
                                            tone.hex,
                                            0.55,
                                          )})`,
                                        }}
                                      />
                                      <span
                                        aria-hidden="true"
                                        className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-500 ${
                                          isActive ? 'h-[3px] bg-[#a3783a]' : 'h-[2px] bg-[#241d14]/10'
                                        }`}
                                      />
                                    </span>
                                    <span
                                      aria-hidden="true"
                                      className={`pointer-events-none absolute -bottom-[7px] left-1/2 h-[7px] -translate-x-1/2 rounded-full bg-[#241d14] blur-[4px] transition-all duration-500 ${
                                        isActive ? 'w-[88%] opacity-40' : 'w-[64%] opacity-20'
                                      }`}
                                    />
                                  </span>
                                </>
                              );
                            })()}

                            {/* price whisper under the active piece */}
                            <span
                              className={`mt-2 hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 sm:block ${
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
                  </Fragment>
                ))}
            </ul>

            {/* shelf floor */}
            <div
              aria-hidden="true"
              className="pointer-events-none -mt-6 h-12 bg-[linear-gradient(180deg,rgba(36,29,20,0.1),rgba(36,29,20,0.02)_38%,transparent)]"
            />

            {/* edge fades */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-14 bg-[linear-gradient(270deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 ${
                hasScrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-14 bg-[linear-gradient(90deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 ${
                canScrollMore ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Rack controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nudgeTrack(1)}
                aria-label="قطعه‌های قبلی"
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9ae] bg-[#fdfaf2]/85 text-[#6b5d45] transition-all hover:border-[#a3783a] ${
                  hasScrolled ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => nudgeTrack(-1)}
                aria-label="قطعه‌های بعدی"
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9ae] bg-[#fdfaf2]/85 text-[#6b5d45] transition-all hover:border-[#a3783a] ${
                  canScrollMore ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex min-w-[190px] flex-col items-center gap-1.5">
              <span className="text-[10.5px] font-semibold text-[#8d8271]">
                {activeIndex >= 0
                  ? `قطعهٔ ${fa(activeIndex + 1)} از ${fa(visible.length)}`
                  : 'رگال در حال چیدن است'}
              </span>
              <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#d8cbb2]">
                <span
                  className="absolute inset-y-0 right-0 rounded-full bg-[#a3783a] transition-[width] duration-500"
                  style={{
                    width: `${
                      visible.length > 1
                        ? Math.max(4, ((activeIndex + 1) / visible.length) * 100)
                        : 100
                    }%`,
                  }}
                />
              </span>
            </div>

            <p className="text-[10px] text-[#a99c86]">
              هاور، لمس یا کلیدهای ← → قطعه را جلو می‌آورند
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-md text-center text-[12px] leading-6 text-[#6b6152]">
            پارچه‌های تمام‌پشم، برشِ تیلور و دوختِ محدود؛ انتخاب‌شده برای پوشیدنِ هر روز.
          </p>
        </div>
      </div>
    </section>
  );
}
