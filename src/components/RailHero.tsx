import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getProductsBySlugs, type ProductPreview } from '../lib/catalog';
import { asset, formatPrice } from '../lib/format';

type RailHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type RailPiece = {
  /** Transparent garment cut-out, hung by its hanger. */
  image: string;
  /** Intrinsic size of the cut-out, used for a shift-free aspect ratio. */
  width: number;
  height: number;
  alt: string;
  /** Short caption under the hem. */
  name: string;
  /** Product page target, when the piece exists in the catalogue. */
  slug?: string;
  /** Shop category target, used for pieces without a product page. */
  category?: string;
  /** Per-piece sway rhythm, so the rail never looks mechanical. */
  swayDelay: number;
  swayDuration: number;
};

/**
 * A wardrobe rail, not a slider: ten real catalogue pieces hang from one bar,
 * alternating silhouettes and colours like a styled capsule. Each piece links
 * to its product page and shows its live price on the hang tag.
 */
const PIECES: RailPiece[] = [
  {
    image: '/images/hero-rail/garment-blouse-cream.webp',
    width: 488,
    height: 705,
    alt: 'بلوز ابریشمی کرم آویزان روی جالباسی طلایی',
    name: 'بلوز ابریشمی کرم',
    slug: 'silk-blouse-cream-women',
    swayDelay: 0,
    swayDuration: 7.4,
  },
  {
    image: '/images/hero-rail/garment-sweater-gray.webp',
    width: 493,
    height: 709,
    alt: 'پلیور بافت مرینوس خاکستری آویزان روی جالباسی',
    name: 'پلیور بافت خاکستری',
    slug: 'knit-sweater-gray-men',
    swayDelay: 1.1,
    swayDuration: 8.6,
  },
  {
    image: '/images/hero-boutique/layer-pants.webp',
    width: 456,
    height: 1145,
    alt: 'شلوار پیپربگ کرم آویزان روی جالباسی با گیره',
    name: 'شلوار پیپربگ کرم',
    slug: 'paperbag-pants-cream-women',
    swayDelay: 0.45,
    swayDuration: 9.2,
  },
  {
    image: '/images/hero-rail/garment-sage-cardigan.webp',
    width: 673,
    height: 721,
    alt: 'کاردیگان بافت سبز مریم‌گلی آویزان روی جالباسی طلایی',
    name: 'کاردیگان بافت سبز',
    category: 'clothing',
    swayDelay: 1.7,
    swayDuration: 8.1,
  },
  {
    image: '/images/hero-wall/garment-black-satin-blazer.webp',
    width: 612,
    height: 924,
    alt: 'کت ساتن مشکی آویزان روی جالباسی چوبی',
    name: 'کت ساتن مشکی',
    slug: 'satin-blazer-black-women',
    swayDelay: 0.9,
    swayDuration: 7.8,
  },
  {
    image: '/images/hero-boutique/layer-trench.webp',
    width: 572,
    height: 1200,
    alt: 'ترنچ‌کت شتری بلند آویزان روی جالباسی',
    name: 'ترنچ‌کت شتری',
    slug: 'trench-coat-camel-women',
    swayDelay: 0.2,
    swayDuration: 8.9,
  },
  {
    image: '/images/hero-rail/garment-hoodie-blush.webp',
    width: 539,
    height: 720,
    alt: 'هودی صورتی کمرنگ آویزان روی جالباسی',
    name: 'هودی صورتی',
    slug: 'hoodie-blush-women',
    swayDelay: 1.35,
    swayDuration: 7.6,
  },
  {
    image: '/images/hero-wall/garment-navy-blazer.webp',
    width: 680,
    height: 1007,
    alt: 'کت تک پشمی سرمه‌ای آویزان روی جالباسی طلایی',
    name: 'کت تک سرمه‌ای',
    slug: 'wool-blazer-navy-men',
    swayDelay: 0.6,
    swayDuration: 8.4,
  },
  {
    image: '/images/hero-rail/garment-polo-green.webp',
    width: 541,
    height: 713,
    alt: 'پولوشرت زیتونی آویزان روی جالباسی',
    name: 'پولوشرت زیتونی',
    slug: 'polo-shirt-green-men',
    swayDelay: 1.9,
    swayDuration: 7.2,
  },
  {
    image: '/images/hero-wall/garment-charcoal-trousers.webp',
    width: 417,
    height: 1083,
    alt: 'شلوار پارچه‌ای ذغالی آویزان روی جالباسی با گیره',
    name: 'شلوار ذغالی',
    slug: 'formal-trousers-charcoal-men',
    swayDelay: 1.0,
    swayDuration: 9.6,
  },
];

const PIECE_SLUGS = PIECES.flatMap((piece) => (piece.slug ? [piece.slug] : []));

/** Price tags are tiny: millions read better than nine digits at 10px. */
function tagPrice(price: number): string {
  const fa = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
  if (price >= 1_000_000) return `${fa.format(price / 1_000_000)} میلیون`;
  if (price >= 1_000) return `${fa.format(Math.round(price / 1_000))} هزار`;
  return fa.format(price);
}

function usePiecePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    getProductsBySlugs(PIECE_SLUGS)
      .then((products: ProductPreview[]) => {
        if (cancelled) return;
        const next: Record<string, number> = {};
        for (const product of products) next[product.slug] = product.price;
        setPrices(next);
      })
      .catch(() => {
        /* the rail still works as a look-book without prices */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return prices;
}

/** The brass bar the pieces hang from, with wall plates at both ends. */
function RailBar() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 z-0 h-[22px] w-screen -translate-x-1/2"
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 top-[10px] h-[3px] rounded-full bg-[linear-gradient(90deg,#cbb488_0%,#b79a6a_14%,#e6d3ac_34%,#9c7f4f_58%,#d8c39a_80%,#c1a877_100%)] shadow-[0_2px_3px_rgba(72,52,26,0.18)]" />
      {/* light bouncing off the underside of the bar */}
      <div className="absolute inset-x-0 top-[13px] h-[6px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(84,62,32,0.15),transparent_70%)] blur-[2px]" />
      {/* wall plates */}
      <span className="absolute -top-2 left-[3%] h-[26px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f4ead4,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.22)]" />
      <span className="absolute -top-2 right-[3%] h-[26px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f4ead4,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.22)]" />
    </div>
  );
}

export default function RailHero({ onNavigate }: RailHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const prices = usePiecePrices();
  const reduceMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  /* The header floats transparently over this stage: tell it to use dark ink. */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modara:hero-theme', { detail: 'light' }));
  }, []);

  /* Scrolling the page gives the whole rail a little gravitational swing. */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const rawSwing = useTransform(scrollYProgress, [0, 0.5, 1], [0, 2.4, -0.8]);
  const swing = useSpring(rawSwing, { stiffness: 60, damping: 18, mass: 0.6 });

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
  }, [updateScrollHints]);

  /** direction 1 = back towards the first piece (right), -1 = forward (left). */
  const nudge = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.max(180, track.clientWidth * 0.6),
      behavior: 'smooth',
    });
  };

  const openPiece = (piece: RailPiece) => {
    if (piece.slug) onNavigate('product', piece.slug);
    else onNavigate('shop', piece.category);
  };

  const countLabel = useMemo(() => new Intl.NumberFormat('fa-IR').format(PIECES.length), []);

  return (
    <section
      ref={sectionRef}
      aria-label="کالکشن تازه مُدارا"
      className="relative isolate overflow-hidden bg-[#efeae1] pb-14 pt-24 sm:pb-20 sm:pt-28"
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(198,158,88,0.16),transparent_66%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-16 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_70%)] blur-2xl"
      />
      {/* A whisper of film grain, so the flat studio light feels photographed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8">
        {/* Kicker + headline */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] font-bold text-[#9a8358] sm:text-[11.5px]">
            <span className="h-px w-8 bg-[#bda77c] sm:w-12" aria-hidden="true" />
            <span>کالکشن پاییز ۱۴۰۴</span>
            <span className="h-1 w-1 rounded-full bg-[#c3ac81]" aria-hidden="true" />
            <span>ساختِ مُدارا</span>
            <span className="h-px w-8 bg-[#bda77c] sm:w-12" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-balance text-[clamp(1.6rem,4.4vw,3.05rem)] font-extrabold leading-[1.3] text-[#241d14]">
            کالکشن تازه رسید؛
            <span className="mt-1 block text-[#8b6f3e] sm:mt-2">هر قطعه را از روی ریل بردارید</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-balance text-[13px] leading-6 text-[#6b6152] sm:text-sm sm:leading-7">
            {countLabel} قطعهٔ منتخب از پاییز امسال؛ آویزان، آماده و با قیمتِ روی برچسب. روی هر
            لباس که بایستید، جزئیات و راهِ خریدش باز می‌شود.
          </p>
        </motion.div>

        {/* The rail */}
        <div className="relative mt-9 sm:mt-12">
          <RailBar />

          <ul
            ref={trackRef}
            className="scrollbar-hide -mx-4 -mt-[13px] flex snap-x snap-mandatory items-start gap-1 overflow-x-auto px-4 pb-1 pt-0 sm:mx-0 sm:gap-2 xl:overflow-visible xl:px-0"
          >
            {PIECES.map((piece, index) => {
              const price = piece.slug ? prices[piece.slug] : undefined;
              const isDimmed = hoveredIndex !== null && hoveredIndex !== index;

              return (
                <li
                  key={piece.image}
                  className="rail-drop group relative w-[clamp(104px,29vw,150px)] shrink-0 snap-center xl:w-auto xl:min-w-0 xl:flex-1"
                  style={{ animationDelay: `${index * 70}ms` }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <button
                    type="button"
                    onClick={() => openPiece(piece)}
                    aria-label={
                      price
                        ? `مشاهدهٔ ${piece.name}، ${formatPrice(price)}`
                        : `مشاهدهٔ ${piece.name}`
                    }
                    className="group/piece block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3783a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#efeae1]"
                  >
                    {/* warm halo behind the piece on hover */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-1 top-4 bottom-8 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(196,155,90,0.3),transparent_68%)] blur-xl transition-opacity duration-500 ${
                        hoveredIndex === index ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <motion.div
                      style={reduceMotion ? undefined : { rotate: swing }}
                      className="relative w-full origin-top"
                    >
                      {/* Hover lifts the piece; the sway lives on the inner layer so
                          the two transforms never fight each other. */}
                      <div className="w-full origin-top transition-transform duration-500 ease-out group-hover/piece:-translate-y-2">
                        <div
                          className={`rail-sway relative w-full origin-top transition-[opacity,filter] duration-500 ease-out ${
                            isDimmed ? 'opacity-70 saturate-[0.86]' : 'opacity-100'
                          }`}
                          style={
                            {
                              '--rail-sway-delay': `${piece.swayDelay}s`,
                              '--rail-sway-duration': `${piece.swayDuration}s`,
                            } as CSSProperties
                          }
                        >
                          <img
                            src={asset(piece.image)}
                            alt={piece.alt}
                            width={piece.width}
                            height={piece.height}
                            loading={index < 6 ? 'eager' : 'lazy'}
                            decoding="async"
                            draggable={false}
                            className="mx-auto block h-auto max-h-[clamp(178px,27vh,300px)] w-full select-none object-contain object-top drop-shadow-[0_16px_18px_rgba(56,42,22,0.16)] transition-[filter] duration-500 group-hover/piece:drop-shadow-[0_24px_26px_rgba(56,42,22,0.22)]"
                          />

                          {/* Hang tag, clipped to the hook area of every piece */}
                          <span className="pointer-events-none absolute left-1/2 top-[9px] flex w-max origin-top flex-col items-center">
                            <span
                              aria-hidden="true"
                              className="h-4 w-px bg-[linear-gradient(180deg,rgba(120,94,55,0.1),rgba(120,94,55,0.5))]"
                            />
                            <span
                              aria-hidden="true"
                              title={price ? formatPrice(price) : undefined}
                              className={`rail-sway-tag mt-0 mr-[6px] inline-flex items-center whitespace-nowrap rounded-[4px] border px-1.5 py-[3px] text-[9px] font-bold leading-none shadow-[0_6px_14px_-6px_rgba(56,42,22,0.45)] transition-colors duration-500 sm:px-2 sm:py-1 sm:text-[10px] ${
                                hoveredIndex === index
                                  ? 'border-[#a3783a] bg-[#a3783a] text-[#fdf8ee]'
                                  : 'border-[#ded3bd] bg-[#fdfaf2]/95 text-[#54452f]'
                              }`}
                            >
                              {price ? tagPrice(price) : 'منتخب'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </button>

                  {/* Label: always visible on touch widths, revealed on hover/focus above that */}
                  <div className="mt-1 px-0.5 text-center sm:mt-2">
                    <p
                      className={`truncate text-[10px] font-semibold transition-colors duration-300 sm:text-[11px] ${
                        hoveredIndex === index ? 'text-[#8b6f3e]' : 'text-[#4c4234]'
                      }`}
                    >
                      {piece.name}
                    </p>
                    <span
                      className={`mt-1 hidden items-center justify-center gap-0.5 text-[9px] font-medium text-[#9a8f7c] transition-all duration-300 sm:inline-flex sm:text-[10px] ${
                        hoveredIndex === index
                          ? 'sm:translate-y-0 sm:opacity-100'
                          : 'sm:translate-y-1 sm:opacity-0'
                      }`}
                    >
                      مشاهده
                      <ArrowLeft className="h-2.5 w-2.5" aria-hidden="true" />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Rail paging: the track scrolls natively until all ten pieces fit */}
          <div className="mt-3 flex items-center justify-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="قطعه‌های قبلی"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9ae] bg-[#fdfaf2]/80 text-[#6b5d45] transition-opacity hover:border-[#a3783a] ${
                hasScrolled ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-[10px] text-[#8d8271]">برای دیدن بقیه، بکشید</span>
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="قطعه‌های بعدی"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c9ae] bg-[#fdfaf2]/80 text-[#6b5d45] transition-opacity hover:border-[#a3783a] ${
                canScrollMore ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Soft fades at the scrollable edges */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-[linear-gradient(270deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 xl:hidden ${
              hasScrolled ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-[linear-gradient(90deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 xl:hidden ${
              canScrollMore ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Closing line + actions */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-2xl text-center sm:mt-12"
        >
          <p className="text-balance text-[12.5px] leading-6 text-[#6b6152] sm:text-[13.5px] sm:leading-7">
            پارچه‌های تمام‌پشم، برشِ تیلور و دوختِ محدود؛ انتخاب‌شده برای پوشیدنِ هر روز.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241d14] px-7 py-3 text-[13px] font-semibold text-[#f7f1e4] shadow-[0_18px_34px_-18px_rgba(36,29,20,0.85)] transition-all duration-300 hover:bg-[#3a2f20] active:scale-[0.98] sm:w-auto"
            >
              <Sparkles className="h-4 w-4 text-[#d9bd84]" aria-hidden="true" />
              مشاهدهٔ کالکشن
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shop', 'clothing')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#c9bba0] bg-[#fdfaf2]/70 px-7 py-3 text-[13px] font-semibold text-[#4c4234] backdrop-blur-sm transition-all duration-300 hover:border-[#a3783a] hover:text-[#8b6f3e] sm:w-auto"
            >
              همهٔ لباس‌ها
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
