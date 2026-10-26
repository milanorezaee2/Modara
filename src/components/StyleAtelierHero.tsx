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
import { ArrowLeft, Pause, Play, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';
import { seedProducts } from '../lib/demoSeed';
import { asset, formatPrice } from '../lib/format';

type StyleAtelierHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type LookTheme = 'light' | 'dark';

type LookPiece = {
  slug: string;
  categoryLabel: string;
  anchor: { x: number; y: number };
  cardClass: string;
  cardAnchor: { x: number; y: number };
  cardOrigin: { x: number; y: number };
};

type StyleLook = {
  key: string;
  label: string;
  latinWord: string;
  actLabel: string;
  headline: string;
  description: string;
  image: string;
  detailImage: string;
  imageAlt: string;
  theme: LookTheme;
  pieces: LookPiece[];
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PHASE_DURATIONS = [2200, 3000, 1800];
const LOOK_DURATION_MS = PHASE_DURATIONS.reduce((sum, duration) => sum + duration, 0);
const HERO_THEME_EVENT = 'modara:hero-theme';

const styleLooks: StyleLook[] = [
  {
    key: 'minimal',
    label: 'مینیمالِ روشن',
    latinWord: 'MINIMAL',
    actLabel: 'پردهٔ اول',
    headline: 'سادگی، در روشن‌ترین حالت',
    description: 'ابریشم، کرم و خطوط آرام برای حضوری بی‌صدا اما فراموش‌نشدنی.',
    image: '/images/hero-atelier/look-minimal.jpg',
    detailImage: '/images/hero-atelier/detail-minimal.jpg',
    imageAlt: 'مدل زن با بلوز ابریشمی و شلوار کرم در فضای سنگی روشن',
    theme: 'light',
    pieces: [
      {
        slug: 'silk-blouse-cream-women',
        categoryLabel: 'لباس',
        anchor: { x: 20, y: 36 },
        cardClass: 'lg:left-[30%] lg:top-[23%]',
        cardAnchor: { x: 30, y: 34 },
        cardOrigin: { x: -90, y: 10 },
      },
      {
        slug: 'paperbag-pants-cream-women',
        categoryLabel: 'شلوار',
        anchor: { x: 20, y: 63 },
        cardClass: 'lg:left-[27%] lg:top-[48%]',
        cardAnchor: { x: 27, y: 59 },
        cardOrigin: { x: -70, y: 28 },
      },
      {
        slug: 'aviator-gold-sunglasses',
        categoryLabel: 'عینک',
        anchor: { x: 16, y: 42 },
        cardClass: 'lg:left-[35%] lg:top-[68%]',
        cardAnchor: { x: 35, y: 79 },
        cardOrigin: { x: -120, y: -110 },
      },
    ],
  },
  {
    key: 'tailored',
    label: 'کلاسیکِ قدرتمند',
    latinWord: 'TAILORED',
    actLabel: 'پردهٔ دوم',
    headline: 'وقار، با برش دقیق',
    description: 'خیاطی تیره، جزئیات طلایی و حضوری که قبل از شما وارد اتاق می‌شود.',
    image: '/images/hero-atelier/look-tailored.jpg',
    detailImage: '/images/hero-atelier/detail-tailored.jpg',
    imageAlt: 'مردی با کت پشمی سرمه‌ای و ساعت طلایی در بوتيک تیره',
    theme: 'dark',
    pieces: [
      {
        slug: 'wool-blazer-navy-men',
        categoryLabel: 'لباس',
        anchor: { x: 27, y: 38 },
        cardClass: 'lg:left-[32%] lg:top-[23%]',
        cardAnchor: { x: 32, y: 34 },
        cardOrigin: { x: -50, y: 20 },
      },
      {
        slug: 'formal-trousers-charcoal-men',
        categoryLabel: 'شلوار',
        anchor: { x: 27, y: 65 },
        cardClass: 'lg:left-[28%] lg:top-[48%]',
        cardAnchor: { x: 28, y: 59 },
        cardOrigin: { x: -20, y: 42 },
      },
      {
        slug: 'luxury-gold-watch',
        categoryLabel: 'ساعت',
        anchor: { x: 31, y: 47 },
        cardClass: 'lg:left-[38%] lg:top-[68%]',
        cardAnchor: { x: 38, y: 79 },
        cardOrigin: { x: -50, y: -100 },
      },
    ],
  },
  {
    key: 'noir',
    label: 'طلاییِ شب',
    latinWord: 'NOIR',
    actLabel: 'پردهٔ سوم',
    headline: 'شب، صحنهٔ شماست',
    description: 'ساتن مشکی و برق طلا؛ برای لحظه‌ای که قرار نیست معمولی باشد.',
    image: '/images/hero-atelier/look-noir.jpg',
    detailImage: '/images/hero-atelier/detail-noir.jpg',
    imageAlt: 'مدل زن با کت ساتن مشکی و کیف زنجیردار در تالار شبانه طلایی',
    theme: 'dark',
    pieces: [
      {
        slug: 'satin-blazer-black-women',
        categoryLabel: 'لباس',
        anchor: { x: 52, y: 36 },
        cardClass: 'lg:left-[17%] lg:top-[24%]',
        cardAnchor: { x: 46, y: 35 },
        cardOrigin: { x: 110, y: 8 },
      },
      {
        slug: 'wide-leg-trousers-black-women',
        categoryLabel: 'شلوار',
        anchor: { x: 54, y: 65 },
        cardClass: 'lg:left-[15%] lg:top-[49%]',
        cardAnchor: { x: 44, y: 60 },
        cardOrigin: { x: 120, y: 28 },
      },
      {
        slug: 'quilted-chain-bag',
        categoryLabel: 'کیف',
        anchor: { x: 47, y: 45 },
        cardClass: 'lg:left-[12%] lg:top-[69%]',
        cardAnchor: { x: 41, y: 80 },
        cardOrigin: { x: 110, y: -110 },
      },
    ],
  },
];

const themeStyles: Record<
  LookTheme,
  {
    text: string;
    eyebrow: string;
    latin: string;
    description: string;
    selector: string;
    selectorActive: string;
    card: string;
    cardMuted: string;
    scrimDesktop: string;
    scrimMobile: string;
    stroke: string;
    control: string;
  }
> = {
  light: {
    text: 'text-[#211a12]',
    eyebrow: 'text-gold-700',
    latin: 'text-[#211a12]/40',
    description: 'text-[#211a12]/70',
    selector:
      'border-[#211a12]/20 bg-white/25 text-[#211a12] hover:border-gold-600/70 hover:bg-gold-500/10',
    selectorActive: 'border-[#171208] bg-[#171208] text-gold-200 shadow-[0_16px_34px_-16px_rgba(23,18,8,0.6)]',
    card: 'border-white/55 bg-[#fffaf0]/82 text-[#211a12] shadow-[0_28px_60px_-26px_rgba(56,38,16,0.5)]',
    cardMuted: 'text-[#211a12]/60',
    scrimDesktop:
      'bg-[linear-gradient(to_left,rgba(250,246,238,0.94)_0%,rgba(250,246,238,0.68)_34%,rgba(250,246,238,0.16)_58%,transparent_76%)]',
    scrimMobile:
      'bg-[linear-gradient(to_bottom,rgba(250,246,238,0.97)_0%,rgba(250,246,238,0.82)_42%,rgba(250,246,238,0.18)_72%,transparent_92%)]',
    stroke: 'rgba(101,78,38,0.2)',
    control: 'border-[#211a12]/15 bg-white/40 text-[#211a12] hover:border-gold-600 hover:bg-gold-500 hover:text-white',
  },
  dark: {
    text: 'text-[#f7f1e5]',
    eyebrow: 'text-gold-300',
    latin: 'text-white/40',
    description: 'text-white/70',
    selector:
      'border-white/25 bg-white/[0.06] text-white hover:border-gold-300/80 hover:bg-gold-400/10 hover:text-gold-200',
    selectorActive: 'border-gold-300 bg-gold-400 text-[#171208] shadow-[0_16px_34px_-16px_rgba(216,185,109,0.65)]',
    card: 'border-white/15 bg-[#120d08]/72 text-[#f7f1e5] shadow-[0_28px_60px_-26px_rgba(0,0,0,0.85)]',
    cardMuted: 'text-white/60',
    scrimDesktop:
      'bg-[linear-gradient(to_left,rgba(10,7,4,0.92)_0%,rgba(10,7,4,0.66)_36%,rgba(10,7,4,0.18)_60%,transparent_80%)]',
    scrimMobile:
      'bg-[linear-gradient(to_bottom,rgba(10,7,4,0.97)_0%,rgba(10,7,4,0.84)_44%,rgba(10,7,4,0.2)_74%,transparent_94%)]',
    stroke: 'rgba(232,201,122,0.18)',
    control: 'border-white/20 bg-black/25 text-white hover:border-gold-300 hover:bg-gold-500 hover:text-[#171208]',
  },
};

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
};

const headlineLineVariants: Variants = {
  hidden: { y: '112%' },
  show: (line: number) => ({
    y: '0%',
    transition: { duration: 1, delay: line * 0.12, ease: EASE },
  }),
};

const pad = (value: number) => String(value).padStart(2, '0');

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
  const y = useTransform(pointerY, [-0.5, 0.5], [depth * 0.6, -depth * 0.6]);

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

function AnimatedPrice({
  value,
  active,
  prefersReducedMotion,
}: {
  value: number;
  active: boolean;
  prefersReducedMotion: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (!active) {
      setDisplayValue(prefersReducedMotion ? value : 0);
      return;
    }
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / 900, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, prefersReducedMotion, value]);

  return <>{formatPrice(displayValue)}</>;
}

function ProductPieceCard({
  product,
  piece,
  lookKey,
  index,
  theme,
  mobile = false,
  onNavigate,
  onPause,
}: {
  product: Product;
  piece: LookPiece;
  lookKey: string;
  index: number;
  theme: LookTheme;
  mobile?: boolean;
  onNavigate: (view: string, param?: string) => void;
  onPause: () => void;
}) {
  const styles = themeStyles[theme];
  const faNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

  return (
    <motion.button
      key={`${lookKey}-${product.slug}-${mobile ? 'mobile' : 'desktop'}`}
      type="button"
      onClick={() => onNavigate('product', product.slug)}
      onMouseEnter={onPause}
      onFocus={onPause}
      aria-label={`مشاهده ${product.name}`}
      initial={{ opacity: 0, scale: 0.78, x: piece.cardOrigin.x, y: piece.cardOrigin.y, rotate: -1 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 14, transition: { duration: 0.22, ease: EASE } }}
      transition={{ type: 'spring', stiffness: 175, damping: 21, mass: 0.8, delay: index * 0.16 }}
      whileHover={{ y: -4, rotate: -0.25 }}
      className={`group relative overflow-hidden rounded-[1.35rem] border text-right backdrop-blur-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
        mobile ? 'w-[15rem] shrink-0 snap-start' : `absolute z-30 hidden w-[16rem] lg:block ${piece.cardClass}`
      } ${styles.card}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/80 to-transparent"
      />
      <span className="flex items-center gap-3 p-3">
        <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[1rem] bg-[#f3ede0]">
          <img
            src={asset(product.image_url)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold text-gold-600">{piece.categoryLabel}</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${styles.cardMuted}`}>
              <Star className="h-3 w-3 fill-gold-400 text-gold-500" aria-hidden="true" />
              {faNumber(product.rating)}
            </span>
          </span>
          <span className="mt-1.5 line-clamp-2 block text-[13px] font-black leading-5">
            {product.name}
          </span>
          <span className="mt-1.5 block text-xs font-black">{formatPrice(product.price)}</span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-gold-600">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            مشاهده محصول
          </span>
        </span>
      </span>
    </motion.button>
  );
}

export default function StyleAtelierHero({ onNavigate }: StyleAtelierHeroProps) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const paused = hoverPaused || manualPaused || tabHidden;

  const sectionRef = useRef<HTMLElement | null>(null);
  const touchXRef = useRef<number | null>(null);
  const lastThemeRef = useRef('');
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 42]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -20]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 55, damping: 18, mass: 0.45 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 55, damping: 18, mass: 0.45 });

  const activeLook = styleLooks[activeIndex];
  const nextLook = styleLooks[(activeIndex + 1) % styleLooks.length];
  const styles = themeStyles[activeLook.theme];
  const activePieces = activeLook.pieces
    .map((piece) => ({
      piece,
      product:
        products.find((product) => product.slug === piece.slug) ??
        seedProducts.find((product) => product.slug === piece.slug),
    }))
    .filter((entry): entry is { piece: LookPiece; product: Product } => Boolean(entry.product));
  const lookTotal = activePieces.reduce((sum, entry) => sum + entry.product.price, 0);

  const goToLook = (index: number) => {
    setActiveIndex(((index % styleLooks.length) + styleLooks.length) % styleLooks.length);
    setPhase(prefersReducedMotion ? 2 : 0);
    setCycleKey((current) => current + 1);
  };

  /* Live catalogue when available; curated seed products are the instant fallback. */
  useEffect(() => {
    let alive = true;
    supabase
      .from('products')
      .select('*')
      .order('rating', { ascending: false })
      .limit(120)
      .then(({ data }) => {
        if (alive && data?.length) setProducts(data as Product[]);
      });
    return () => {
      alive = false;
    };
  }, []);

  /* Preload campaign imagery and real product photos. */
  useEffect(() => {
    const sources = [
      ...styleLooks.flatMap((look) => [look.image, look.detailImage]),
      ...styleLooks.flatMap((look) =>
        look.pieces
          .map((piece) => seedProducts.find((product) => product.slug === piece.slug)?.image_url)
          .filter((source): source is string => Boolean(source)),
      ),
    ];
    sources.forEach((source) => {
      const image = new Image();
      image.src = asset(source);
    });
  }, []);

  /* Keep the fixed header legible over each chapter. */
  useEffect(() => {
    const emitTheme = () => {
      const element = sectionRef.current;
      const inHero = element ? element.getBoundingClientRect().bottom > 88 : true;
      const theme = inHero ? activeLook.theme : 'light';
      if (lastThemeRef.current !== theme) {
        lastThemeRef.current = theme;
        window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: theme }));
      }
    };
    emitTheme();
    window.addEventListener('scroll', emitTheme, { passive: true });
    return () => {
      window.removeEventListener('scroll', emitTheme);
      window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: 'light' }));
    };
  }, [activeLook.theme]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* Three cinematic acts, then the next look takes the stage. */
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(2);
      return;
    }
    if (paused) return;

    const timer = window.setTimeout(() => {
      if (phase < 2) {
        setPhase(phase + 1);
      } else {
        setActiveIndex((current) => (current + 1) % styleLooks.length);
        setPhase(0);
        setCycleKey((current) => current + 1);
      }
    }, PHASE_DURATIONS[phase]);

    return () => window.clearTimeout(timer);
  }, [activeIndex, cycleKey, paused, phase, prefersReducedMotion]);

  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
    setHoverPaused(false);
  };

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="آتلیهٔ استایل مُدارا"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      onFocus={() => setHoverPaused(true)}
      onBlur={() => setHoverPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goToLook(activeIndex + 1);
        if (event.key === 'ArrowRight') goToLook(activeIndex - 1);
      }}
      onTouchStart={(event) => {
        touchXRef.current = event.touches[0]?.clientX ?? null;
        setHoverPaused(true);
      }}
      onTouchEnd={(event) => {
        const startX = touchXRef.current;
        const endX = event.changedTouches[0]?.clientX;
        touchXRef.current = null;
        setHoverPaused(false);
        if (startX === null || endX === undefined) return;
        const delta = endX - startX;
        if (Math.abs(delta) > 52) goToLook(activeIndex + (delta < 0 ? 1 : -1));
      }}
      className={`relative flex min-h-[100svh] flex-col overflow-hidden bg-[#14100c] outline-none transition-colors duration-700 lg:block ${styles.text}`}
    >
      {/* Campaign film frame */}
      <motion.div style={{ y: backgroundY }} aria-hidden="true" className="absolute inset-0">
        <DepthLayer
          depth={3}
          pointerX={smoothPointerX}
          pointerY={smoothPointerY}
          className="absolute -inset-8"
        >
          <AnimatePresence>
            <motion.img
              key={activeLook.key}
              src={asset(activeLook.image)}
              alt=""
              draggable={false}
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.09, x: prefersReducedMotion ? 0 : 28 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.15, ease: EASE },
                scale: { duration: prefersReducedMotion ? 0.01 : LOOK_DURATION_MS / 1000 + 0.8, ease: 'linear' },
                x: { duration: 1.5, ease: EASE },
              }}
              className="absolute inset-0 h-full w-full object-cover object-[32%_center] lg:object-center"
            />
          </AnimatePresence>
        </DepthLayer>
      </motion.div>

      {/* Legibility scrims */}
      <AnimatePresence>
        <motion.div
          key={`scrim-${activeLook.key}`}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: EASE }}
          className="pointer-events-none absolute inset-0"
        >
          <div className={`absolute inset-0 hidden lg:block ${styles.scrimDesktop}`} />
          <div className={`absolute inset-0 lg:hidden ${styles.scrimMobile}`} />
        </motion.div>
      </AnimatePresence>

      {/* Fabric-detail wipe opens every chapter */}
      <AnimatePresence>
        <motion.div
          key={`detail-${activeLook.key}-${cycleKey}`}
          aria-hidden="true"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
          animate={{
            clipPath: prefersReducedMotion ? 'inset(0% 0% 0% 100%)' : 'inset(0% 0% 0% 100%)',
            opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.28, duration: prefersReducedMotion ? 0.01 : 1.18, ease: EASE }}
          className="pointer-events-none absolute inset-0 z-[4] overflow-hidden"
        >
          <img
            src={asset(activeLook.detailImage)}
            alt=""
            draggable={false}
            className="h-full w-full scale-110 object-cover"
          />
          <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold-300 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Film grain and vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_50%_42%,transparent_50%,rgba(20,12,4,0.2)_100%)]"
      />

      {/* Copy and stylist choices */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 px-5 pb-3 pt-24 sm:px-8 lg:absolute lg:right-[3.5%] lg:top-1/2 lg:w-[33%] lg:-translate-y-1/2 lg:px-0 lg:pb-0 lg:pt-0"
      >
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.65, duration: 0.8, ease: EASE }}
            style={{ transformOrigin: 'right center' }}
            className="h-px w-12 bg-gradient-to-l from-gold-500 to-transparent"
          />
          <span className={`text-sm font-extrabold sm:text-base ${styles.eyebrow}`}>آتلیهٔ مُدارا</span>
          <span dir="ltr" className={`font-display text-[9px] font-semibold tracking-[0.34em] ${styles.latin}`}>
            THE STYLE ATELIER
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-4 text-[2.25rem] font-black leading-[1.16] sm:text-5xl lg:mt-5 lg:text-[3.25rem] xl:text-[3.8rem]"
        >
          <span className="-my-1 block overflow-hidden py-1">
            <motion.span custom={0} variants={headlineLineVariants} className="block">
              امروز، کدام نسخه از شما
            </motion.span>
          </span>
          <span className="-my-1 mt-1 block overflow-hidden py-1 pb-3">
            <motion.span
              custom={1}
              variants={headlineLineVariants}
              className="block bg-gradient-to-l from-gold-600 via-[#d8b96d] to-gold-500 bg-clip-text text-transparent"
            >
              روی صحنه می‌رود؟
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className={`mt-3 max-w-xl text-sm leading-7 sm:text-base lg:leading-8 ${styles.description}`}
        >
          سه شخصیت، سه نور و سه استایل کامل؛ انتخاب کنید و ببینید هر قطعه چگونه کنار دیگری می‌نشیند.
        </motion.p>

        <motion.div
          variants={itemVariants}
          role="tablist"
          aria-label="انتخاب شخصیت استایل"
          className="mt-5 flex flex-wrap gap-2"
        >
          {styleLooks.map((look, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={look.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`نمایش استایل ${look.label}`}
                onClick={() => goToLook(index)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-extrabold backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:text-sm ${
                  isActive ? styles.selectorActive : styles.selector
                }`}
              >
                <span dir="ltr" className="font-display text-[10px] font-semibold tracking-[0.18em] opacity-70">
                  {pad(index + 1)}
                </span>
                {look.label}
              </button>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} aria-hidden="true" className="mt-5 flex items-center gap-3">
          <span className="h-px w-16 bg-gold-500/70" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
          <span className="h-px w-6 bg-gold-500/45" />
        </motion.div>

        <div className="mt-4 min-h-[9.5rem] lg:min-h-[10rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeLook.key}-copy`}
              initial={{ opacity: 0, y: 24, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)', transition: { duration: 0.28, ease: EASE } }}
              transition={{ duration: 0.65, ease: EASE }}
            >
              <p className={`text-xs font-extrabold ${styles.eyebrow}`}>{activeLook.actLabel} · {activeLook.label}</p>
              <h2 className="mt-2 text-2xl font-black leading-9 sm:text-[1.7rem]">{activeLook.headline}</h2>
              <p className={`mt-2 max-w-lg text-sm leading-7 ${styles.description}`}>{activeLook.description}</p>
              <motion.div
                animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 6 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1"
                aria-live="polite"
              >
                <span className={`text-xs font-bold ${styles.description}`}>قیمت کامل استایل</span>
                <span className="text-lg font-black sm:text-xl">
                  <AnimatedPrice
                    value={lookTotal}
                    active={phase >= 1}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div variants={itemVariants} className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full py-1.5 pe-1.5 ps-7 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:py-2 sm:pe-2 sm:ps-9 sm:text-base ${
              activeLook.theme === 'light'
                ? 'bg-[#17120b] text-[#f7efdc] shadow-[0_18px_40px_-16px_rgba(23,18,11,0.55)]'
                : 'bg-[#f3ead6] text-[#1a150c] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-[101%] bg-gradient-to-l from-gold-300 via-gold-500 to-gold-600 transition-transform duration-500 ease-out group-hover:translate-x-0"
            />
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#171208]">
              مشاهده همه محصولات
            </span>
            <span
              aria-hidden="true"
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 sm:h-10 sm:w-10 ${
                activeLook.theme === 'light'
                  ? 'bg-gold-500 text-[#171208] group-hover:bg-[#171208] group-hover:text-gold-300'
                  : 'bg-[#171208] text-gold-300'
              }`}
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 sm:h-5 sm:w-5" />
            </span>
          </button>

          <span className={`inline-flex items-center gap-2 text-xs font-bold sm:text-sm ${styles.description}`}>
            <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
            <span className="lg:hidden">برای دیدن قطعه‌ها، چند لحظه روی صحنه بمانید</span>
            <span className="hidden lg:inline">برای توقف فیلم، روی صحنه بایستید</span>
          </span>
        </motion.div>
      </motion.div>

      {/* Interactive stage */}
      <motion.div
        style={{ y: stageY }}
        role="group"
        aria-label="صحنهٔ نمایش استایل‌های مُدارا"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
        className="relative z-10 h-[32rem] w-full shrink-0 [perspective:1200px] sm:h-[35rem] lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[62%]"
      >
        <DepthLayer
          depth={8}
          pointerX={smoothPointerX}
          pointerY={smoothPointerY}
          className="pointer-events-none absolute inset-x-0 bottom-[16%] z-[2] hidden select-none lg:block"
        >
          <AnimatePresence>
            <motion.div
              key={`word-${activeLook.key}`}
              dir="ltr"
              aria-hidden="true"
              initial={{ opacity: 0, x: -34 }}
              animate={{ opacity: 1, x: activeIndex * -14 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 1.1, ease: EASE }}
              style={{ color: 'transparent', WebkitTextStroke: `1px ${styles.stroke}` }}
              className="whitespace-nowrap font-display text-[11rem] font-semibold leading-none tracking-[0.04em] xl:text-[13rem]"
            >
              {activeLook.latinWord}
            </motion.div>
          </AnimatePresence>
        </DepthLayer>

        {/* Callouts from model to product cards */}
        <AnimatePresence>
          {phase >= 1 && (
            <svg
              key={`callouts-${activeLook.key}`}
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 z-[15] hidden h-full w-full lg:block"
            >
              <defs>
                <linearGradient id="atelier-callout" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8a611f" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#d8b96d" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#8a611f" stopOpacity="0.35" />
                </linearGradient>
              </defs>
              {activePieces.map(({ piece }, index) => (
                <motion.path
                  key={piece.slug}
                  d={`M ${piece.anchor.x} ${piece.anchor.y} C ${(piece.anchor.x + piece.cardAnchor.x) / 2} ${piece.anchor.y}, ${(piece.anchor.x + piece.cardAnchor.x) / 2} ${piece.cardAnchor.y}, ${piece.cardAnchor.x} ${piece.cardAnchor.y}`}
                  fill="none"
                  stroke="url(#atelier-callout)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.9 }}
                  exit={{ opacity: 0, transition: { duration: 0.18 } }}
                  transition={{ delay: 0.12 + index * 0.14, duration: 0.7, ease: EASE }}
                />
              ))}
            </svg>
          )}
        </AnimatePresence>

        <DepthLayer
          depth={12}
          pointerX={smoothPointerX}
          pointerY={smoothPointerY}
          className="absolute inset-0 z-20 hidden lg:block"
        >
          <AnimatePresence>
            {phase >= 1 &&
              activePieces.map(({ piece, product }, index) => (
                <ProductPieceCard
                  key={`${activeLook.key}-${product.slug}-desktop`}
                  product={product}
                  piece={piece}
                  lookKey={activeLook.key}
                  index={index}
                  theme={activeLook.theme}
                  onNavigate={onNavigate}
                  onPause={() => setHoverPaused(true)}
                />
              ))}
          </AnimatePresence>
        </DepthLayer>

        {/* Mobile product rail */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              key={`mobile-rail-${activeLook.key}`}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="absolute inset-x-3 bottom-16 z-20 flex snap-x gap-3 overflow-x-auto pb-2 lg:hidden"
            >
              {activePieces.map(({ piece, product }, index) => (
                <ProductPieceCard
                  key={`${activeLook.key}-${product.slug}-mobile`}
                  product={product}
                  piece={piece}
                  lookKey={activeLook.key}
                  index={index}
                  theme={activeLook.theme}
                  mobile
                  onNavigate={onNavigate}
                  onPause={() => setHoverPaused(true)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next-act teaser and film controls */}
        <div className="absolute inset-x-4 bottom-4 z-30 flex items-end gap-4 sm:inset-x-6 lg:bottom-7 lg:left-8 lg:right-8">
          <AnimatePresence>
            {phase >= 2 && (
              <motion.button
                key={`next-${nextLook.key}`}
                type="button"
                onClick={() => goToLook(activeIndex + 1)}
                initial={{ opacity: 0, x: -28, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.96 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="group relative hidden w-36 shrink-0 overflow-hidden rounded-[1.15rem] border border-white/25 text-right shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 lg:block"
                aria-label={`نمایش پردهٔ بعد: ${nextLook.label}`}
              >
                <img
                  src={asset(nextLook.image)}
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <span className="absolute bottom-2 right-3 text-[10px] font-bold text-gold-200">پردهٔ بعد</span>
                <span className="absolute bottom-6 right-3 text-xs font-black text-white">{nextLook.label}</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="min-w-0 flex-1" role="tablist" aria-label="خط زمانی پرده‌های استایل">
            <div className="flex items-end gap-3 sm:gap-5">
              {styleLooks.map((look, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={look.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`پردهٔ ${index + 1}: ${look.label}`}
                    onClick={() => goToLook(index)}
                    className="group flex-1 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <span className="mb-2 flex items-baseline gap-2">
                      <span
                        dir="ltr"
                        className={`font-display text-xs font-semibold transition ${
                          isActive ? 'text-gold-500' : activeLook.theme === 'light' ? 'text-[#211a12]/45' : 'text-white/45'
                        }`}
                      >
                        {pad(index + 1)}
                      </span>
                      <span
                        className={`hidden text-xs font-bold transition sm:block ${
                          isActive ? '' : activeLook.theme === 'light' ? 'text-[#211a12]/50' : 'text-white/50'
                        }`}
                      >
                        {look.label}
                      </span>
                    </span>
                    <span
                      className={`relative block h-[3px] overflow-hidden rounded-full ${
                        activeLook.theme === 'light' ? 'bg-[#211a12]/20' : 'bg-white/25'
                      }`}
                    >
                      {isActive ? (
                        <span
                          key={`${look.key}-${cycleKey}`}
                          className="hero-progress-fill absolute inset-0 block bg-gradient-to-l from-gold-400 to-gold-600 shadow-[0_0_10px_rgba(216,185,109,0.7)]"
                          style={{
                            animationDuration: `${LOOK_DURATION_MS}ms`,
                            animationPlayState: paused || prefersReducedMotion ? 'paused' : 'running',
                            transform: prefersReducedMotion ? 'scaleX(1)' : undefined,
                          }}
                        />
                      ) : (
                        <span
                          className={`absolute inset-0 block origin-right bg-gold-500/55 transition-transform duration-500 ${
                            index < activeIndex ? 'scale-x-100' : 'scale-x-0'
                          }`}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManualPaused((current) => !current)}
            aria-label={manualPaused ? 'پخش فیلم استایل' : 'توقف فیلم استایل'}
            aria-pressed={manualPaused}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-95 ${styles.control}`}
          >
            {manualPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-14 bg-gradient-to-t from-[#faf8f5]/90 to-transparent"
      />
    </section>
  );
}
