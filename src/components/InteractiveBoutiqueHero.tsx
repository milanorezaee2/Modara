import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import { ArrowLeft, Plus, ShoppingBag, Sparkles, Star, X } from 'lucide-react';
import type { Product } from '../lib/supabase';
import { getProductsBySlugs, type ProductPreview } from '../lib/catalog';
import { formatPrice, imageSrcSet, optimizedAsset } from '../lib/format';

type InteractiveBoutiqueHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type SpotKind = 'rack' | 'shelf';

type BoutiqueSpot = {
  key: string;
  categorySlug: string;
  categoryLabel: string;
  productSlug: string;
  layer: string;
  layerAlt: string;
  kind: SpotKind;
  positionClass: string;
  depth: number;
  swayDelay: number;
  anchor: { x: number; y: number };
  pullX: number;
  cardClass: string;
  cardAnchor: { x: number; y: number };
  cardOrigin: { x: number; y: number };
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const AUTO_TOUR_MS = 4500;
const HERO_THEME_EVENT = 'modara:hero-theme';

const boutiqueSpots: BoutiqueSpot[] = [
  {
    key: 'clothing',
    categorySlug: 'clothing',
    categoryLabel: 'لباس',
    productSlug: 'trench-coat-camel-women',
    layer: '/images/hero-boutique/layer-trench.webp',
    layerAlt: 'ترنچ‌کت شتری روی رگال بوتیک مُدارا',
    kind: 'rack',
    positionClass: 'left-[1%] top-[22%] w-[31%] lg:left-[2%] lg:top-[21.5%] lg:w-[27%]',
    depth: 16,
    swayDelay: 0,
    anchor: { x: 15, y: 52 },
    pullX: 12,
    cardClass: 'lg:left-[31%] lg:top-[29%]',
    cardAnchor: { x: 31, y: 40 },
    cardOrigin: { x: -130, y: 28 },
  },
  {
    key: 'pants',
    categorySlug: 'pants',
    categoryLabel: 'شلوار',
    productSlug: 'paperbag-pants-cream-women',
    layer: '/images/hero-boutique/layer-pants.webp',
    layerAlt: 'شلوار کرم آویخته روی رگال بوتیک مُدارا',
    kind: 'rack',
    positionClass: 'left-[54%] top-[22.5%] w-[18%] lg:left-[56%] lg:top-[21.5%] lg:w-[15%]',
    depth: 15,
    swayDelay: 0.7,
    anchor: { x: 63, y: 42 },
    pullX: -10,
    cardClass: 'lg:left-[18%] lg:top-[34%]',
    cardAnchor: { x: 55, y: 45 },
    cardOrigin: { x: 190, y: 8 },
  },
  {
    key: 'bag',
    categorySlug: 'bag',
    categoryLabel: 'کیف',
    productSlug: 'quilted-chain-bag',
    layer: '/images/hero-boutique/layer-bag.webp',
    layerAlt: 'کیف زنجیردار مشکی روی شلف بوتیک مُدارا',
    kind: 'shelf',
    positionClass: 'left-[73%] top-[20%] w-[26%] lg:left-[73.5%] lg:top-[16.2%] lg:w-[24%]',
    depth: 13,
    swayDelay: 0,
    anchor: { x: 86, y: 25 },
    pullX: -6,
    cardClass: 'lg:left-[36%] lg:top-[17%]',
    cardAnchor: { x: 73, y: 28 },
    cardOrigin: { x: 170, y: 12 },
  },
  {
    key: 'watch',
    categorySlug: 'watch',
    categoryLabel: 'ساعت',
    productSlug: 'luxury-gold-watch',
    layer: '/images/hero-boutique/layer-watch.webp',
    layerAlt: 'ساعت طلایی روی شلف بوتیک مُدارا',
    kind: 'shelf',
    positionClass: 'left-[80%] top-[36.5%] w-[12.5%] lg:left-[80.5%] lg:top-[31.5%] lg:w-[11.5%]',
    depth: 12,
    swayDelay: 0,
    anchor: { x: 86, y: 42 },
    pullX: -4,
    cardClass: 'lg:left-[36%] lg:top-[34%]',
    cardAnchor: { x: 73, y: 45 },
    cardOrigin: { x: 170, y: 22 },
  },
  {
    key: 'glasses',
    categorySlug: 'glasses',
    categoryLabel: 'عینک',
    productSlug: 'aviator-gold-sunglasses',
    layer: '/images/hero-boutique/layer-glasses.webp',
    layerAlt: 'عینک خلبانی طلایی روی شلف بوتیک مُدارا',
    kind: 'shelf',
    positionClass: 'left-[72.5%] top-[58.5%] w-[26%] lg:left-[72.5%] lg:top-[56%] lg:w-[26%]',
    depth: 12,
    swayDelay: 0,
    anchor: { x: 86, y: 61 },
    pullX: -6,
    cardClass: 'lg:left-[36%] lg:top-[50%]',
    cardAnchor: { x: 73, y: 61 },
    cardOrigin: { x: 170, y: 34 },
  },
  {
    key: 'accessory',
    categorySlug: 'accessory',
    categoryLabel: 'اکسسوری',
    productSlug: 'fedora-hat-beige',
    layer: '/images/hero-boutique/layer-fedora.webp',
    layerAlt: 'کلاه شاپو بژ روی شلف بوتیک مُدارا',
    kind: 'shelf',
    positionClass: 'left-[73%] top-[71.5%] w-[25%] lg:left-[73%] lg:top-[67%] lg:w-[25%]',
    depth: 13,
    swayDelay: 0,
    anchor: { x: 86, y: 75 },
    pullX: -6,
    cardClass: 'lg:left-[36%] lg:top-[56%]',
    cardAnchor: { x: 73, y: 67 },
    cardOrigin: { x: 170, y: 52 },
  },
];

const boutiqueProductSlugs = boutiqueSpots.map((spot) => spot.productSlug);

const fallbackProducts: Product[] = [
  {
    id: 'prod-trench-coat-camel-women',
    name: 'ترنچ‌کت زنانه شتری',
    slug: 'trench-coat-camel-women',
    description: null,
    price: 3900000,
    image_url: '/images/clothing/trench-coat-camel-women.jpg',
    category_id: 'cat-clothing',
    rating: 4.9,
    stock: 30,
    created_at: '2026-05-05T09:26:52.827Z',
  },
  {
    id: 'prod-paperbag-pants-cream-women',
    name: 'شلوار پیپربگ زنانه کرم',
    slug: 'paperbag-pants-cream-women',
    description: null,
    price: 1390000,
    image_url: '/images/pants/paperbag-pants-cream-women.jpg',
    category_id: 'cat-pants',
    rating: 4.6,
    stock: 72,
    created_at: '2026-05-24T09:26:52.827Z',
  },
  {
    id: 'prod-quilted-chain-bag',
    name: 'کیف زنجیردار لوزی‌دوزی',
    slug: 'quilted-chain-bag',
    description: null,
    price: 2450000,
    image_url: '/images/bag/quilted-chain-bag.jpg',
    category_id: 'cat-bag',
    rating: 4.8,
    stock: 42,
    created_at: '2026-07-10T09:26:52.827Z',
  },
  {
    id: 'prod-luxury-gold-watch',
    name: 'ساعت مچی لوکس طلایی',
    slug: 'luxury-gold-watch',
    description: null,
    price: 4500000,
    image_url: '/images/watch/luxury-gold-watch.jpg',
    category_id: 'cat-watch',
    rating: 4.8,
    stock: 30,
    created_at: '2026-06-10T09:26:52.827Z',
  },
  {
    id: 'prod-aviator-gold-sunglasses',
    name: 'عینک آفتابی خلبانی طلایی',
    slug: 'aviator-gold-sunglasses',
    description: null,
    price: 2150000,
    image_url: '/images/glasses/aviator-gold-sunglasses.jpg',
    category_id: 'cat-glasses',
    rating: 4.8,
    stock: 45,
    created_at: '2026-05-28T09:26:52.827Z',
  },
  {
    id: 'prod-fedora-hat-beige',
    name: 'کلاه شاپو بژ',
    slug: 'fedora-hat-beige',
    description: null,
    price: 980000,
    image_url: '/images/accessory/fedora-hat-beige.jpg',
    category_id: 'cat-accessory',
    rating: 4.5,
    stock: 60,
    created_at: '2026-07-25T09:26:52.827Z',
  },
];

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 34, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.95, ease: EASE },
  },
};

const headlineLineVariants: Variants = {
  hidden: { y: '112%' },
  show: (line: number) => ({
    y: '0%',
    transition: { duration: 1.05, delay: line * 0.13, ease: EASE },
  }),
};

const dustParticles = Array.from({ length: 10 }, (_, index) => ({
  left: 6 + ((index * 29) % 82),
  top: 18 + ((index * 17) % 58),
  size: index % 3 === 0 ? 3 : 2,
  delay: (index % 7) * 0.55,
  duration: 6 + (index % 5),
}));

function DepthLayer({
  depth,
  pointerX,
  pointerY,
  className = '',
  children,
}: {
  depth: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  className?: string;
  children: ReactNode;
}) {
  const x = useTransform(pointerX, [-0.5, 0.5], [depth, -depth]);
  const y = useTransform(pointerY, [-0.5, 0.5], [depth * 0.62, -depth * 0.62]);

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

function BoutiqueItem({
  spot,
  index,
  isActive,
  tourRunning,
  pointerX,
  pointerY,
  prefersReducedMotion,
  onPreview,
  onRelease,
  onSelect,
}: {
  spot: BoutiqueSpot;
  index: number;
  isActive: boolean;
  tourRunning: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  prefersReducedMotion: boolean;
  onPreview: () => void;
  onRelease: () => void;
  onSelect: () => void;
}) {
  return (
    <DepthLayer
      depth={spot.depth}
      pointerX={pointerX}
      pointerY={pointerY}
      className={`absolute z-20 ${spot.positionClass}`}
    >
      <motion.button
        type="button"
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: spot.kind === 'rack' ? -30 : 22, scale: 0.94 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: prefersReducedMotion ? 0 : 0.68 + index * 0.11,
          type: 'spring',
          stiffness: 150,
          damping: 19,
          mass: 0.8,
        }}
        aria-label={`نمایش محصول شاخص دسته ${spot.categoryLabel}`}
        aria-pressed={isActive}
        onMouseEnter={onPreview}
        onMouseLeave={onRelease}
        onFocus={onPreview}
        onBlur={onRelease}
        onClick={onSelect}
        className="group relative block w-full cursor-pointer rounded-[2rem] outline-none transition focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7efdd]"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-[10%] rounded-full bg-gold-300/0 blur-2xl transition-all duration-500 ${
            isActive ? 'scale-110 bg-gold-300/40' : 'scale-75'
          }`}
        />
        <span
          aria-hidden="true"
          className={`absolute bottom-[1%] left-1/2 h-[8%] w-[72%] -translate-x-1/2 rounded-[50%] bg-[#4a3410]/25 blur-md transition-all duration-500 ${
            isActive ? 'scale-125 opacity-80' : 'scale-90 opacity-45'
          }`}
        />
        <motion.span
          aria-hidden="true"
          animate={
            prefersReducedMotion || spot.kind !== 'rack'
              ? { rotate: 0 }
              : { rotate: [-0.65, 0.65, -0.65] }
          }
          transition={
            prefersReducedMotion || spot.kind !== 'rack'
              ? { duration: 0.2 }
              : {
                  duration: 5.2,
                  delay: spot.swayDelay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          style={{ transformOrigin: '50% 0%' }}
          className="relative block"
        >
          <motion.img
            src={optimizedAsset(spot.layer, 640)}
            alt={spot.layerAlt}
            draggable={false}
            decoding="async"
            animate={{
              scale: isActive ? 1.17 : 1,
              x: isActive ? spot.pullX : 0,
              y: isActive ? (spot.kind === 'shelf' ? -13 : 6) : 0,
              rotateY: isActive ? -7 : 0,
              rotateZ: isActive && spot.kind === 'rack' ? -1.25 : 0,
            }}
            transition={{ type: 'spring', stiffness: 170, damping: 20, mass: 0.75 }}
            style={{ transformPerspective: 900 }}
            className={`relative z-10 w-full select-none object-contain transition-[filter] duration-500 ${
              isActive
                ? 'drop-shadow-[0_30px_28px_rgba(70,48,16,0.38)]'
                : 'drop-shadow-[0_18px_18px_rgba(70,48,16,0.22)] group-hover:drop-shadow-[0_24px_24px_rgba(70,48,16,0.3)]'
            }`}
          />
        </motion.span>

        <span
          aria-hidden="true"
          className={`absolute left-[7%] top-[7%] z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-all duration-500 ${
            isActive
              ? 'rotate-45 border-gold-300 bg-[#171208] text-gold-200'
              : 'border-white/60 bg-white/85 text-gold-700 group-hover:bg-[#171208] group-hover:text-gold-200'
          }`}
        >
          {isActive && (
            <svg
              aria-hidden="true"
              viewBox="0 0 36 36"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="rgba(216,185,109,0.28)"
                strokeWidth="1.5"
              />
              <motion.circle
                key={`${spot.key}-${tourRunning ? 'running' : 'holding'}`}
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#d8b96d"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="97"
                initial={{ strokeDashoffset: tourRunning ? 97 : 0 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{
                  duration: tourRunning ? AUTO_TOUR_MS / 1000 : 0.35,
                  ease: 'linear',
                }}
              />
            </svg>
          )}
          <Plus className="relative h-4 w-4" strokeWidth={2.4} />
        </span>

        <span
          aria-hidden="true"
          className={`absolute bottom-[3%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/50 bg-white/90 px-3 py-1 text-[11px] font-extrabold text-[#211a12] shadow-lg transition-all duration-500 ${
            isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:opacity-90'
          }`}
        >
          {spot.categoryLabel}
        </span>
      </motion.button>
    </DepthLayer>
  );
}

function RackAndShelves({
  activeSpotKey,
  activeKind,
  prefersReducedMotion,
}: {
  activeSpotKey: string;
  activeKind: SpotKind;
  prefersReducedMotion: boolean;
}) {
  const shelves = [
    { key: 'bag', top: 35 },
    { key: 'watch', top: 53 },
    { key: 'glasses', top: 68 },
    { key: 'accessory', top: 84 },
  ];

  return (
    <>
      {/* Clothing rack */}
      <div aria-hidden="true" className="absolute left-[2%] top-[24%] h-[63%] w-[70%] lg:top-[23.5%]">
        <span
          className={`absolute -top-8 left-[8%] right-[8%] h-10 rounded-[50%] bg-gold-300/30 blur-2xl transition-all duration-700 ${
            activeKind === 'rack' ? 'scale-100 opacity-100' : 'scale-75 opacity-35'
          }`}
        />
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.38, duration: 0.9, ease: EASE }}
          style={{ transformOrigin: 'right center' }}
          className="absolute inset-x-0 top-0 block h-[3px] overflow-hidden rounded-full bg-gradient-to-l from-[#8a611f] via-[#d8b96d] to-[#8a611f] shadow-[0_2px_8px_rgba(70,48,16,0.35)]"
        >
          {!prefersReducedMotion && (
            <motion.span
              initial={{ x: '-130%', skewX: -16, opacity: 0 }}
              animate={{ x: ['-130%', '360%'], opacity: [0, 1, 0] }}
              transition={{ duration: 1.7, delay: 1.9, repeat: Infinity, repeatDelay: 5.6, ease: EASE }}
              className="absolute inset-y-0 left-0 block w-1/4 bg-gradient-to-r from-transparent via-white/80 to-transparent"
            />
          )}
        </motion.span>
        <motion.span
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.52, duration: 0.85, ease: EASE }}
          style={{ transformOrigin: 'top center' }}
          className="absolute left-[3%] top-0 block h-full w-[3px] rounded-full bg-gradient-to-b from-[#c9a45c] via-[#8a611f] to-[#5f4215] shadow-[2px_0_8px_rgba(70,48,16,0.2)]"
        />
        <motion.span
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.52, duration: 0.85, ease: EASE }}
          style={{ transformOrigin: 'top center' }}
          className="absolute right-[3%] top-0 block h-full w-[3px] rounded-full bg-gradient-to-b from-[#c9a45c] via-[#8a611f] to-[#5f4215] shadow-[2px_0_8px_rgba(70,48,16,0.2)]"
        />
        <span className="absolute bottom-0 left-0 h-[3px] w-[19%] rounded-full bg-[#7a551d]" />
        <span className="absolute bottom-0 right-0 h-[3px] w-[19%] rounded-full bg-[#7a551d]" />
        <span className="absolute -top-[5px] left-[3%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#d8b96d] shadow" />
        <span className="absolute -top-[5px] right-[3%] h-2.5 w-2.5 translate-x-1/2 rounded-full bg-[#d8b96d] shadow" />
        <span className="absolute -bottom-3 left-[8%] right-[8%] h-5 rounded-[50%] bg-[#4a3410]/15 blur-md" />
      </div>

      {/* Floating stone shelves */}
      {shelves.map((shelf, shelfIndex) => {
        const isActiveShelf = activeSpotKey === shelf.key;
        return (
          <motion.div
            key={shelf.key}
            aria-hidden="true"
            initial={{ opacity: 0, x: -26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.48 + shelfIndex * 0.1, duration: 0.75, ease: EASE }}
            style={{ top: `${shelf.top}%` }}
            className="absolute left-[72.5%] w-[26%]"
          >
            <span
              className={`absolute -top-7 inset-x-2 h-8 rounded-[50%] bg-gold-300/35 blur-xl transition-all duration-700 ${
                isActiveShelf ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
              }`}
            />
            <span
              className={`relative block h-2.5 rounded-[3px] bg-[linear-gradient(180deg,#f3e5c8_0%,#d9c29a_55%,#a9854d_100%)] transition-shadow duration-700 sm:h-3 ${
                isActiveShelf
                  ? 'shadow-[0_14px_24px_rgba(146,104,35,0.42)]'
                  : 'shadow-[0_10px_18px_rgba(70,48,16,0.28)]'
              }`}
            />
            <span className="absolute left-[12%] top-full h-4 w-px bg-[#8a611f]/60" />
            <span className="absolute right-[12%] top-full h-4 w-px bg-[#8a611f]/60" />
            <span className="absolute inset-x-3 top-full mt-1 h-3 rounded-[50%] bg-[#4a3410]/15 blur-sm" />
          </motion.div>
        );
      })}
    </>
  );
}

export default function InteractiveBoutiqueHero({ onNavigate }: InteractiveBoutiqueHeroProps) {
  const [products, setProducts] = useState<ProductPreview[]>(fallbackProducts);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [inView, setInView] = useState(true);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const backgroundY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : 38],
  );
  const stageY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : -18],
  );

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 55, damping: 18, mass: 0.45 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 55, damping: 18, mass: 0.45 });

  const activeSpot = boutiqueSpots[activeIndex];
  const activeProduct =
    products.find((product) => product.slug === activeSpot.productSlug) ??
    fallbackProducts.find((product) => product.slug === activeSpot.productSlug);
  const nextSpot = boutiqueSpots[(activeIndex + 1) % boutiqueSpots.length];
  const nextProduct =
    products.find((product) => product.slug === nextSpot.productSlug) ??
    fallbackProducts.find((product) => product.slug === nextSpot.productSlug);
  const tourRunning = !paused && !locked && !tabHidden && inView && !prefersReducedMotion;

  /* Live catalogue when available; the six curated rows above are the instant fallback. */
  useEffect(() => {
    let alive = true;
    getProductsBySlugs(boutiqueProductSlugs).then((data) => {
      if (alive && data.length) setProducts(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* Warm only the next tour card after the current frame has settled. */
  useEffect(() => {
    if (!nextProduct?.image_url || tabHidden || !inView) return;
    let idleId: number | undefined;
    let timer: number | undefined;
    const preload = () => {
      const image = new Image();
      image.src = optimizedAsset(nextProduct.image_url, 480);
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(preload, { timeout: 1200 });
    } else {
      timer = window.setTimeout(preload, 650);
    }
    return () => {
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [inView, nextProduct?.image_url, tabHidden]);

  /* Keep the fixed header in its light theme over the ivory boutique. */
  useEffect(() => {
    const emitTheme = () =>
      window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: 'light' }));
    emitTheme();
    return () => {
      emitTheme();
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.04 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || locked || tabHidden || !inView || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % boutiqueSpots.length);
    }, AUTO_TOUR_MS);
    return () => window.clearInterval(timer);
  }, [inView, locked, paused, prefersReducedMotion, tabHidden]);

  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetInteraction = () => {
    pointerX.set(0);
    pointerY.set(0);
    setPaused(false);
    setLocked(false);
  };

  const previewSpot = (index: number) => {
    setActiveIndex(index);
    setPaused(true);
  };

  const releasePreview = () => {
    if (!locked) setPaused(false);
  };

  const selectSpot = (index: number) => {
    setActiveIndex(index);
    setPaused(true);
    setLocked(true);
    setMobileOpen(true);
  };

  const closeMobileSheet = () => {
    setMobileOpen(false);
    setLocked(false);
    setPaused(false);
  };

  const faNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      aria-label="بوتیک تعاملی مُدارا"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetInteraction}
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeMobileSheet();
      }}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#f3ead8] text-[#211a12] lg:block"
    >
      {/* Boutique architecture */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0" aria-hidden="true">
        <DepthLayer
          depth={3}
          pointerX={smoothPointerX}
          pointerY={smoothPointerY}
          className="absolute -inset-8"
        >
          <motion.img
            src={optimizedAsset('/images/hero-boutique/boutique-bg.jpg', 960)}
            srcSet={imageSrcSet('/images/hero-boutique/boutique-bg.jpg', [960, 1376])}
            sizes="100vw"
            alt=""
            width={1376}
            height={768}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            initial={{ scale: prefersReducedMotion ? 1.05 : 1.16 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 2.8, ease: EASE }}
            className="h-full w-full object-cover object-[34%_center] lg:object-center"
          />
        </DepthLayer>
      </motion.div>

      {/* Readability and cinematic atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,246,238,0.72)_0%,transparent_34%,transparent_72%,rgba(250,248,245,0.55)_100%)] lg:bg-[linear-gradient(to_left,rgba(250,246,238,0.22)_0%,transparent_42%,rgba(250,248,245,0.16)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_52%,rgba(73,52,20,0.13)_100%)]"
      />

      {/* Cinematic opening: two ivory panels part around a gold seam */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            aria-hidden="true"
            initial={{ y: 0 }}
            animate={{ y: '-102%' }}
            transition={{ delay: 0.18, duration: 1.05, ease: EASE }}
            className="pointer-events-none absolute inset-x-0 top-0 z-[35] h-[51%] bg-[#f7efe0]"
          >
            <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold-500 to-transparent" />
          </motion.div>
          <motion.div
            aria-hidden="true"
            initial={{ y: 0 }}
            animate={{ y: '102%' }}
            transition={{ delay: 0.18, duration: 1.05, ease: EASE }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[35] h-[51%] bg-[#f7efe0]"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-500 to-transparent" />
          </motion.div>
        </>
      )}

      {/* Copy */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 px-5 pb-2 pt-24 sm:px-8 lg:absolute lg:right-[4%] lg:top-1/2 lg:w-[31%] lg:-translate-y-1/2 lg:px-0 lg:pb-0 lg:pt-0"
      >
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.72, duration: 0.8, ease: EASE }}
            style={{ transformOrigin: 'right center' }}
            className="h-px w-12 bg-gradient-to-l from-gold-600 to-transparent"
          />
          <span className="text-sm font-extrabold text-gold-700 sm:text-base">بوتیک تعاملی مُدارا</span>
          <span dir="ltr" className="font-display text-[9px] font-semibold tracking-[0.34em] text-[#211a12]/40">
            THE INTERACTIVE BOUTIQUE
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-4 text-[2.35rem] font-black leading-[1.14] sm:text-5xl lg:mt-5 lg:text-[3.4rem] xl:text-[4rem]"
        >
          <span className="-my-1 block overflow-hidden py-1">
            <motion.span custom={0} variants={headlineLineVariants} className="block">
              امضای استایل شما،
            </motion.span>
          </span>
          <span className="-my-1 mt-1 block overflow-hidden py-1 pb-3">
            <motion.span
              custom={1}
              variants={headlineLineVariants}
              className="block bg-gradient-to-l from-[#7c5518] via-[#bd9448] to-[#8a611f] bg-clip-text text-transparent"
            >
              روی رگالِ مُدارا
            </motion.span>
          </span>
        </motion.h1>

        <motion.div variants={itemVariants} aria-hidden="true" className="mt-3 flex items-center gap-3">
          <span className="h-px w-16 bg-gold-600/70" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold-600" />
          <span className="h-px w-6 bg-gold-600/45" />
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-4 max-w-xl text-[15px] leading-8 text-[#211a12]/70 sm:text-base lg:text-lg lg:leading-9"
        >
          میان پوشاک و اکسسوری‌های منتخب حرکت کنید؛ روی هر قطعه بایستید تا از صحنه جلو بیاید و جزئیات واقعی‌اش را ببینید.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-6 flex flex-wrap items-center gap-4 lg:mt-8">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#17120b] py-1.5 pe-1.5 ps-7 text-sm font-bold text-[#f7efdc] shadow-[0_18px_40px_-16px_rgba(23,18,11,0.55)] transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:py-2 sm:pe-2 sm:ps-9 sm:text-base"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-[101%] bg-gradient-to-l from-gold-300 via-gold-500 to-gold-600 transition-transform duration-500 ease-out group-hover:translate-x-0"
            />
            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                initial={{ x: '-170%', skewX: -14, opacity: 0 }}
                animate={{ x: ['-170%', '300%'], opacity: [0, 1, 0] }}
                transition={{ duration: 1.35, delay: 2.5, repeat: Infinity, repeatDelay: 5.4, ease: EASE }}
                className="absolute inset-y-0 left-0 z-[1] w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            )}
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#171208]">
              مشاهده همه محصولات
            </span>
            <span
              aria-hidden="true"
              className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[#171208] transition-colors duration-300 group-hover:bg-[#171208] group-hover:text-gold-300 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 sm:h-5 sm:w-5" />
            </span>
          </button>

          <span className="inline-flex items-center gap-2 text-xs font-bold text-[#211a12]/55 sm:text-sm">
            <Sparkles className="h-4 w-4 text-gold-600" aria-hidden="true" />
            <span className="lg:hidden">برای کشف هر قطعه، آن را لمس کنید</span>
            <span className="hidden lg:inline">برای کشف هر قطعه، روی آن حرکت کنید</span>
          </span>
        </motion.div>
      </motion.div>

      {/* Layered boutique stage */}
      <motion.div
        style={{ y: stageY }}
        role="group"
        aria-label="رگال و شلف تعاملی محصولات مُدارا"
        className="relative z-10 h-[30rem] w-full shrink-0 [perspective:1200px] sm:h-[34rem] lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[62%]"
      >
        <motion.div
          aria-hidden="false"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.045 }}
          animate={{
            opacity: 1,
            scale: prefersReducedMotion ? 1 : 1.018,
            x: prefersReducedMotion ? 0 : (50 - activeSpot.anchor.x) * 0.14,
            y: prefersReducedMotion ? 0 : (48 - activeSpot.anchor.y) * 0.1,
          }}
          transition={{
            opacity: { duration: 0.7, ease: EASE },
            scale: { duration: 1.7, ease: EASE },
            x: { type: 'spring', stiffness: 55, damping: 18, mass: 0.9 },
            y: { type: 'spring', stiffness: 55, damping: 18, mass: 0.9 },
          }}
          className="absolute inset-0 z-[3] [transform-style:preserve-3d]"
        >
        {/* Spotlight separation around the active piece */}
        <AnimatePresence>
          <motion.div
            key={`spotlight-${activeSpot.key}`}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: paused || locked ? 0.72 : 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{
              background: `radial-gradient(circle at ${activeSpot.anchor.x}% ${activeSpot.anchor.y}%, transparent 0%, transparent 13%, rgba(38,27,12,0.13) 44%, rgba(38,27,12,0.2) 100%)`,
            }}
            className="pointer-events-none absolute inset-0 z-[6]"
          />
        </AnimatePresence>

        {/* Warm light pool cast beneath the featured piece */}
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{
            left: `${activeSpot.anchor.x}%`,
            top: `${Math.min(activeSpot.anchor.y + 30, 88)}%`,
            opacity: paused || locked ? 0.82 : 0.55,
          }}
          transition={{ type: 'spring', stiffness: 55, damping: 18, mass: 0.9 }}
          style={{ x: '-50%', y: '-50%' }}
          className="pointer-events-none absolute z-[1] h-[13%] w-[30%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(232,201,122,0.42)_0%,rgba(232,201,122,0.14)_48%,transparent_72%)] blur-xl"
        />

        {/* A soft ceiling beam follows the active piece */}
        <div
          aria-hidden="true"
          style={{
            left: `${activeSpot.anchor.x}%`,
            height: `${Math.min(activeSpot.anchor.y + 24, 92)}%`,
            transform: 'translateX(-50%)',
            clipPath: 'polygon(43% 0, 57% 0, 92% 100%, 8% 100%)',
          }}
          className="pointer-events-none absolute top-0 z-[5] w-[21%] bg-[linear-gradient(to_bottom,rgba(255,224,150,0.34),rgba(255,224,150,0.08)_58%,transparent)] opacity-70 blur-[1px] transition-[left,height,opacity] duration-700 ease-out"
        />

        {/* Gold dust drifting through the boutique light */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[15] hidden sm:block">
          {dustParticles.map((particle, particleIndex) => (
            <motion.span
              key={particleIndex}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size,
              }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.16 }
                  : { y: [0, -26, 0], x: [0, 10, 0], opacity: [0.08, 0.55, 0.08] }
              }
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full bg-gold-300 shadow-[0_0_10px_rgba(216,185,109,0.8)]"
            />
          ))}
        </div>

        <DepthLayer
          depth={7}
          pointerX={smoothPointerX}
          pointerY={smoothPointerY}
          className="pointer-events-none absolute inset-0 z-[2]"
        >
          <RackAndShelves
            activeSpotKey={activeSpot.key}
            activeKind={activeSpot.kind}
            prefersReducedMotion={prefersReducedMotion}
          />
        </DepthLayer>

        {/* Non-interactive garments that make the rail feel like a real boutique */}
        <DepthLayer
          depth={9}
          pointerX={smoothPointerX}
          pointerY={smoothPointerY}
          className="pointer-events-none absolute left-[20%] top-[23.5%] z-[4] w-[52%] lg:left-[22%] lg:top-[23.5%] lg:w-[50%]"
        >
          <motion.img
            src={optimizedAsset('/images/hero-boutique/layer-rack-fill.webp', 720)}
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 0.95, y: 0 }}
            transition={{ delay: 0.58, duration: 0.9, ease: EASE }}
            className="w-full select-none object-contain drop-shadow-[0_16px_16px_rgba(70,48,16,0.18)]"
          />
        </DepthLayer>

        {boutiqueSpots.map((spot, index) => (
          <BoutiqueItem
            key={spot.key}
            spot={spot}
            index={index}
            isActive={index === activeIndex}
            tourRunning={tourRunning}
            pointerX={smoothPointerX}
            pointerY={smoothPointerY}
            prefersReducedMotion={prefersReducedMotion}
            onPreview={() => previewSpot(index)}
            onRelease={releasePreview}
            onSelect={() => selectSpot(index)}
          />
        ))}

        {/* Golden thread drawn from the piece to its product card */}
        {activeProduct && (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-[25] hidden h-full w-full lg:block"
          >
            <defs>
              <linearGradient id="boutique-card-thread" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8a611f" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#d8b96d" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#8a611f" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <motion.path
              key={`thread-${activeSpot.key}`}
              d={`M ${activeSpot.anchor.x} ${activeSpot.anchor.y} C ${(activeSpot.anchor.x + activeSpot.cardAnchor.x) / 2} ${activeSpot.anchor.y}, ${(activeSpot.anchor.x + activeSpot.cardAnchor.x) / 2} ${activeSpot.cardAnchor.y}, ${activeSpot.cardAnchor.x} ${activeSpot.cardAnchor.y}`}
              fill="none"
              stroke="url(#boutique-card-thread)"
              strokeWidth="1.25"
              strokeDasharray="3 3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ delay: 0.28, duration: 0.85, ease: EASE }}
            />
          </svg>
        )}
        </motion.div>

        {/* Desktop product card that springs out of the selected piece */}
        <AnimatePresence mode="wait">
          {activeProduct && (
            <motion.aside
              key={`desktop-card-${activeProduct.slug}`}
              aria-live="polite"
              initial={{
                opacity: 0,
                scale: 0.76,
                x: activeSpot.cardOrigin.x,
                y: activeSpot.cardOrigin.y,
                rotate: -1.2,
              }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12, transition: { duration: 0.22, ease: EASE } }}
              transition={{ type: 'spring', stiffness: 175, damping: 21, mass: 0.8 }}
              whileHover={{ y: -4, rotate: -0.25 }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => {
                if (!locked) setPaused(false);
              }}
              className={`absolute z-30 hidden w-[20.5rem] overflow-hidden rounded-[1.6rem] border border-white/55 bg-[#fffaf0]/90 shadow-[0_32px_70px_-28px_rgba(56,38,16,0.55)] lg:block ${activeSpot.cardClass}`}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-7 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/80 to-transparent"
              />
              {!prefersReducedMotion && (
                <motion.span
                  aria-hidden="true"
                  initial={{ x: '-180%', skewX: -14, opacity: 0 }}
                  animate={{ x: '360%', opacity: [0, 1, 0] }}
                  transition={{ delay: 0.42, duration: 1.15, ease: EASE }}
                  className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                />
              )}
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: tourRunning ? AUTO_TOUR_MS / 1000 : 0.35,
                  ease: 'linear',
                }}
                style={{ transformOrigin: 'right center' }}
                className="absolute bottom-0 right-0 z-10 h-[2px] w-full bg-gradient-to-l from-gold-400 via-gold-600 to-gold-300"
              />
              <div className="flex gap-4 p-4">
                <button
                  type="button"
                  onClick={() => onNavigate('product', activeProduct.slug)}
                  aria-label={`مشاهده ${activeProduct.name}`}
                  className="group relative h-36 w-28 shrink-0 overflow-hidden rounded-[1.15rem] bg-[#f3ede0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <img
                    src={optimizedAsset(activeProduct.image_url, 480)}
                    srcSet={imageSrcSet(activeProduct.image_url, [480, 720])}
                    sizes="112px"
                    alt={activeProduct.name}
                    width={480}
                    height={640}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </button>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-extrabold text-gold-700">
                      {activeSpot.categoryLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#211a12]/65">
                      <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" aria-hidden="true" />
                      {faNumber(activeProduct.rating)}
                    </span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-[15px] font-black leading-6 text-[#211a12]">
                    {activeProduct.name}
                  </h2>
                  <p className="mt-2 text-sm font-black text-[#211a12]">
                    {formatPrice(activeProduct.price)}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('product', activeProduct.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#171208] px-3.5 py-2 text-[11px] font-extrabold text-gold-200 transition hover:bg-gold-500 hover:text-[#171208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                      مشاهده محصول
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop', activeSpot.categorySlug)}
                      className="rounded-full px-2.5 py-2 text-[11px] font-extrabold text-gold-700 transition hover:bg-gold-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      همهٔ این دسته
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile product sheet */}
        <AnimatePresence>
          {mobileOpen && activeProduct && (
            <motion.aside
              key={`mobile-sheet-${activeProduct.slug}`}
              role="dialog"
              aria-label={`محصول شاخص دسته ${activeSpot.categoryLabel}`}
              initial={{ opacity: 0, y: 84, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 64, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 190, damping: 23, mass: 0.85 }}
              className="absolute inset-x-3 bottom-3 z-40 overflow-hidden rounded-[1.6rem] border border-white/55 bg-[#fffaf0]/95 shadow-[0_32px_70px_-28px_rgba(56,38,16,0.55)] lg:hidden"
            >
              <button
                type="button"
                onClick={closeMobileSheet}
                aria-label="بستن نمایش محصول"
                className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#171208]/85 text-gold-200 shadow-lg backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex gap-4 p-4">
                <button
                  type="button"
                  onClick={() => onNavigate('product', activeProduct.slug)}
                  aria-label={`مشاهده ${activeProduct.name}`}
                  className="h-32 w-24 shrink-0 overflow-hidden rounded-[1.1rem] bg-[#f3ede0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <img
                    src={optimizedAsset(activeProduct.image_url, 480)}
                    srcSet={imageSrcSet(activeProduct.image_url, [480, 720])}
                    sizes="96px"
                    alt={activeProduct.name}
                    width={480}
                    height={640}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center gap-3 pe-8">
                    <span className="text-[11px] font-extrabold text-gold-700">
                      {activeSpot.categoryLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#211a12]/65">
                      <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" aria-hidden="true" />
                      {faNumber(activeProduct.rating)}
                    </span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-[15px] font-black leading-6">{activeProduct.name}</h2>
                  <p className="mt-1.5 text-sm font-black">{formatPrice(activeProduct.price)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('product', activeProduct.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#171208] px-3.5 py-2 text-[11px] font-extrabold text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                      مشاهده محصول
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('shop', activeSpot.categorySlug)}
                      className="rounded-full px-2.5 py-2 text-[11px] font-extrabold text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      همهٔ این دسته
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Soft transition into the page below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-14 bg-gradient-to-t from-[#faf8f5]/90 to-transparent"
      />
    </section>
  );
}
