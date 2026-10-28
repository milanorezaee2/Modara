import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Gem,
  Glasses,
  Package,
  Shirt,
  ShoppingBag,
  Star,
  Watch,
} from 'lucide-react';
import type { ProductPreview } from '../lib/catalog';
import { getProductsBySlugs } from '../lib/catalog';
import { asset, formatPrice, imageSrcSet, optimizedAsset } from '../lib/format';

type CinematicMaisonHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type Chapter = {
  key: string;
  label: string;
  headline: string;
  note: string;
  poster: string;
  posterAlt: string;
  posterFocus: string;
  productSlug: string;
  backgroundFallback: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CHAPTER_MS = 7200;
const HERO_THEME_EVENT = 'modara:hero-theme';

/**
 * Six “frames” of a single maison film. Each chapter pairs an editorial poster
 * with the hero product of one catalogue category, so the opening screen shows
 * the whole range at once without changing any catalogue content.
 */
const CHAPTERS: Chapter[] = [
  {
    key: 'clothing',
    label: 'لباس',
    headline: 'خطِ اولِ استایل',
    note: 'ترنچ‌کت‌ها، پیراهن‌ها و بلیزرهایی که فرم روز شما را می‌سازند.',
    poster: '/images/hero-atelier/look-minimal.jpg',
    posterAlt: 'بانویی با لباس کرم در رواق آجری روشن — کالکشن لباس مُدارا',
    posterFocus: '24% 52%',
    productSlug: 'trench-coat-camel-women',
    backgroundFallback: '/images/categories/category-clothing.jpg',
  },
  {
    key: 'pants',
    label: 'شلوار',
    headline: 'فرمِ بی‌زمان',
    note: 'برش‌های راسته و فراخ که با هر قدم، وقار را همراه می‌کنند.',
    poster: '/images/hero-lux-1.jpg',
    posterAlt: 'بانویی با پالتوی شتری و شلوار مشکی در رواق تراورتن',
    posterFocus: '28% 50%',
    productSlug: 'wide-leg-trousers-black-women',
    backgroundFallback: '/images/categories/category-pants.jpg',
  },
  {
    key: 'glasses',
    label: 'عینک',
    headline: 'قابِ نگاه',
    note: 'فریم‌هایی که صورت را قاب می‌گیرند و نگاه را به یاد می‌سپارند.',
    poster: '/images/hero-lux-3.jpg',
    posterAlt: 'کیف چرم عسلی، عینک خلبانی و ساعت طلایی روی سکوی سنگی',
    posterFocus: '26% 56%',
    productSlug: 'luxury-sunglasses-classic',
    backgroundFallback: '/images/categories/category-glasses.jpg',
  },
  {
    key: 'watch',
    label: 'ساعت',
    headline: 'وزنِ ثانیه‌ها',
    note: 'ساعت‌هایی که دقت را به طلا و فولاد ترجمه می‌کنند.',
    poster: '/images/hero-atelier/look-tailored.jpg',
    posterAlt: 'آقایی با کت شلوار سرمه‌ای در حال بستن ساعت در بوتیک',
    posterFocus: '30% 50%',
    productSlug: 'steel-chronograph-watch',
    backgroundFallback: '/images/categories/category-watch.jpg',
  },
  {
    key: 'bag',
    label: 'کیف',
    headline: 'همراهِ همیشگی',
    note: 'چرم‌های دست‌دوز که با گذر زمان، شخصی‌تر می‌شوند.',
    poster: '/images/hero-atelier/look-noir.jpg',
    posterAlt: 'بانویی با کیف زنجیردار مشکی در راهروی طلایی کاخ',
    posterFocus: '33% 50%',
    productSlug: 'leather-tote-bag-tan',
    backgroundFallback: '/images/categories/category-bag.jpg',
  },
  {
    key: 'accessory',
    label: 'اکسسوری',
    headline: 'جزئیاتِ ماندگار',
    note: 'کمربند، جواهر و کلاه؛ امضاهای کوچکِ یک استایل کامل.',
    poster: '/images/hero-fashion-poster.png',
    posterAlt: 'جزئیات پالتوی مشکی، ساعت طلایی و کمربند چرم',
    posterFocus: '48% 45%',
    productSlug: 'womens-jewelry-set',
    backgroundFallback: '/images/categories/category-accessory.jpg',
  },
];

/** Slower, independent cadence for the film that runs behind the stage. */
const BACKDROP_MS = 9200;

/** Crop focus per still, so the vertical catalogue photos read well full-bleed. */
const BACKDROP_FOCUS: Record<string, string> = {
  clothing: '50% 44%',
  pants: '50% 40%',
  glasses: '50% 50%',
  watch: '50% 42%',
  bag: '50% 52%',
  accessory: '50% 46%',
};

/** Deterministic dust motes floating through the projector light. */
const DUST_MOTES = Array.from({ length: 20 }, (_, i) => ({
  left: 3 + ((i * 37) % 94),
  top: 6 + ((i * 29) % 88),
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  delay: (i % 8) * 1.15,
  duration: 16 + (i % 6) * 3.5,
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 9),
}));

const chapterIcons: Record<string, ReactNode> = {
  clothing: <Shirt className="h-3.5 w-3.5" aria-hidden="true" />,
  pants: <Package className="h-3.5 w-3.5" aria-hidden="true" />,
  glasses: <Glasses className="h-3.5 w-3.5" aria-hidden="true" />,
  watch: <Watch className="h-3.5 w-3.5" aria-hidden="true" />,
  bag: <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />,
  accessory: <Gem className="h-3.5 w-3.5" aria-hidden="true" />,
};

const faDigits = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
const faIndex = (value: number) => faDigits(value).padStart(2, '۰');

/** Splits a headline into two masked lines: the noun stays gold. */
function headlineLines(headline: string): string[] {
  const words = headline.trim().split(/\s+/);
  if (words.length < 2) return [headline];
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
}

const copyVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.085, delayChildren: 0.15 } },
};

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: EASE },
  },
};

const lineVariants: Variants = {
  hidden: { y: '112%' },
  show: (line: number) => ({
    y: '0%',
    transition: { duration: 1.15, delay: line * 0.1, ease: EASE },
  }),
};

export default function CinematicMaisonHero({ onNavigate }: CinematicMaisonHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [products, setProducts] = useState<Record<string, ProductPreview>>({});

  const prefersReducedMotion = useReducedMotion();
  const chapter = CHAPTERS[index];
  /* With reduced motion the backdrop simply mirrors the active chapter. */
  const backdropIndex = prefersReducedMotion ? index : bgIndex;
  const backdropSlide = CHAPTERS[backdropIndex];
  const product = products[chapter.productSlug];

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const posterScrollY = useTransform(scrollYProgress, [0, 1], [0, 64]);
  const copyScrollY = useTransform(scrollYProgress, [0, 1], [0, 34]);
  const backdropScrollY = useTransform(scrollYProgress, [0, 1], [0, 130]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.9 });
  const smoothY = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.9 });
  const backdropParallaxX = useTransform(smoothX, [-0.5, 0.5], [26, -26]);
  const backdropParallaxY = useTransform(smoothY, [-0.5, 0.5], [18, -18]);
  const posterParallaxX = useTransform(smoothX, [-0.5, 0.5], [12, -12]);
  const posterParallaxY = useTransform(smoothY, [-0.5, 0.5], [9, -9]);
  const copyParallaxX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const auraX = useTransform(smoothX, [-0.5, 0.5], [-22, 22]);
  const auraY = useTransform(smoothY, [-0.5, 0.5], [-16, 16]);

  /* Lift the opening curtain even if the animation callback is skipped. */
  useEffect(() => {
    const timer = window.setTimeout(() => setCurtainOpen(true), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  /* The header adapts to the dark stage above the fold. */
  useEffect(() => {
    const emit = (theme: 'dark' | 'light') =>
      window.dispatchEvent(new CustomEvent(HERO_THEME_EVENT, { detail: theme }));
    emit('dark');
    return () => {
      emit('light');
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
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Hero products of all six categories, fetched in one round trip. */
  useEffect(() => {
    let cancelled = false;
    getProductsBySlugs(CHAPTERS.map((item) => item.productSlug))
      .then((list) => {
        if (cancelled) return;
        const map: Record<string, ProductPreview> = {};
        list.forEach((item) => {
          map[item.slug] = item;
        });
        setProducts(map);
      })
      .catch(() => {
        /* The hero stays usable with the poster alone. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Warm the decoder for the next frame so transitions never flash. */
  useEffect(() => {
    const next = CHAPTERS[(index + 1) % CHAPTERS.length];
    const img = new Image();
    img.src = asset(next.poster);
  }, [index]);

  const goTo = useCallback((next: number) => {
    setIndex(((next % CHAPTERS.length) + CHAPTERS.length) % CHAPTERS.length);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || paused || tabHidden || !inView) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % CHAPTERS.length);
    }, CHAPTER_MS);
    return () => window.clearInterval(timer);
  }, [index, inView, paused, prefersReducedMotion, tabHidden]);

  /* The background film keeps its own tempo, independent of the chapter cuts. */
  useEffect(() => {
    if (prefersReducedMotion || tabHidden || !inView) return;
    const timer = window.setInterval(() => {
      setBgIndex((current) => (current + 1) % CHAPTERS.length);
    }, BACKDROP_MS);
    return () => window.clearInterval(timer);
  }, [bgIndex, inView, prefersReducedMotion, tabHidden]);

  /* Warm the next backdrop still so the wipe never reveals a blank frame. */
  useEffect(() => {
    const next = CHAPTERS[(bgIndex + 1) % CHAPTERS.length];
    const img = new Image();
    img.src = asset(next.backgroundFallback);
  }, [bgIndex]);

  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
    setPaused(false);
  };

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      aria-label="فیلم سینمایی کالکشن مُدارا"
      aria-roledescription="carousel"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goTo(index + 1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          goTo(index - 1);
        }
      }}
      className="relative isolate overflow-hidden bg-[#0b0907] text-[#f6efe2]"
    >
      {/* ——— Opening curtain ——— */}
      {!curtainOpen && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 1.15, ease: EASE, delay: 0.1 }}
          onAnimationComplete={() => setCurtainOpen(true)}
          className="pointer-events-none absolute inset-0 z-40 bg-[#0b0907]"
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gold-300/45 to-transparent" />
        </motion.div>
      )}

      {/* ——— Backdrop: a slow film running beneath the stage ——— */}
      <motion.div
        aria-hidden="true"
        style={{ y: backdropScrollY }}
        className="pointer-events-none absolute -inset-x-10 -top-32 bottom-0"
      >
        <div className="absolute inset-0 bg-[#0a0806]" />

        {/* Gate weave: the tiny, organic drift of real projector film */}
        <div className={prefersReducedMotion ? 'absolute inset-0' : 'maison-weave absolute inset-0'}>
          <AnimatePresence initial={false}>
            <motion.div
              key={`backdrop-${backdropIndex}`}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, clipPath: 'inset(0 0 0 100%)' }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, clipPath: 'inset(0 0 0 0%)' }
              }
              exit={{
                opacity: 0,
                transition: { duration: prefersReducedMotion ? 0.3 : 2, ease: EASE },
              }}
              transition={{ duration: prefersReducedMotion ? 0.4 : 1.9, ease: [0.76, 0, 0.24, 1] }}
              style={{ willChange: 'clip-path, opacity' }}
              className="absolute inset-0"
            >
              {/* Sharp, heavily graded still */}
              <motion.div
                style={{ x: backdropParallaxX, y: backdropParallaxY }}
                className="absolute -inset-8"
              >
                <img
                  src={asset(backdropSlide.backgroundFallback)}
                  alt=""
                  loading={backdropIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ objectPosition: BACKDROP_FOCUS[backdropSlide.key] ?? '50% 45%' }}
                  className={`h-full w-full object-cover opacity-[0.58] [filter:brightness(.56)_contrast(1.08)_saturate(.82)] ${
                    prefersReducedMotion
                      ? ''
                      : backdropIndex % 2 === 0
                        ? 'maison-pan-a'
                        : 'maison-pan-b'
                  }`}
                />
              </motion.div>

              {/* Bloom pass: the same still, dissolved into ambient light */}
              <div className="absolute -inset-12 hidden sm:block">
                <img
                  src={asset(backdropSlide.backgroundFallback)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full scale-110 object-cover opacity-[0.34] blur-[64px] saturate-125"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Colour grade + legibility scrims (copy sits on the right in RTL) */}
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(8,7,6,0.96)_0%,rgba(9,8,6,0.82)_34%,rgba(10,8,6,0.34)_62%,rgba(8,7,6,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_26%_26%,rgba(217,189,130,0.2),transparent_52%),radial-gradient(ellipse_at_80%_80%,rgba(118,80,36,0.3),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,6,0.94)_0%,transparent_32%,transparent_68%,rgba(8,7,6,0.97)_100%)]" />

        {/* Drifting light leak, like a projector lamp breathing */}
        {!prefersReducedMotion && (
          <div className="maison-leak absolute -inset-1/4 bg-[radial-gradient(circle_at_50%_50%,rgba(255,214,150,0.26),transparent_56%)] mix-blend-screen" />
        )}

        {/* Projector wipe: a sliver of light travels with every cut */}
        {!prefersReducedMotion && (
          <span
            key={`wipe-${backdropIndex}`}
            className="maison-wipe absolute inset-y-0 z-10 w-px bg-gradient-to-b from-transparent via-gold-100/80 to-transparent shadow-[0_0_46px_16px_rgba(217,189,130,0.28)]"
          />
        )}

        {/* Dust in the beam */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden">
            {DUST_MOTES.map((mote, moteIndex) => (
              <span
                key={`mote-${moteIndex}`}
                className="maison-mote absolute rounded-full bg-gold-100/70"
                style={
                  {
                    left: `${mote.left}%`,
                    top: `${mote.top}%`,
                    width: mote.size,
                    height: mote.size,
                    animationDelay: `${mote.delay}s`,
                    animationDuration: `${mote.duration}s`,
                    '--dust-x': `${mote.drift}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Vertical hairlines + brushed-metal sheen */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-[18%] w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
        <div className="absolute inset-y-0 right-[18%] w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.035)_48%,transparent_60%)]" />
        <div className="maison-grain absolute inset-0 opacity-[0.05]" />
        <div className="absolute inset-0 shadow-[inset_0_0_220px_90px_rgba(0,0,0,0.72)]" />
      </div>

      {/* ——— Cinematic frame: letterbox bars + gold registration ticks ——— */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/85 to-transparent sm:h-20" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute inset-3 rounded-[1.6rem] border border-white/[0.07] sm:inset-5 sm:rounded-[2rem]" />
        <span className="absolute left-4 top-6 h-px w-10 bg-white/20 sm:left-8" />
        <span className="absolute right-4 top-6 h-px w-10 bg-white/20 sm:right-8" />
        <span className="absolute bottom-8 left-8 hidden h-3 w-px bg-gold-200/40 lg:block" />
        <span className="absolute bottom-8 right-8 hidden h-3 w-px bg-gold-200/40 lg:block" />
      </div>

      {/* Gold light streak that sweeps across the frame on every cut */}
      {!prefersReducedMotion && (
        <div
          key={`streak-${chapter.key}`}
          aria-hidden="true"
          className="maison-streak pointer-events-none absolute inset-y-0 left-1/3 z-20 w-24 bg-[linear-gradient(90deg,transparent,rgba(233,205,146,0.5),transparent)] blur-[2px]"
        />
      )}

      {/* ——— Stage ——— */}
      <p className="sr-only">
        {`فصل ${chapter.label}: ${chapter.headline} — ${chapter.note}`}
      </p>

      <div
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[92rem] flex-col justify-center gap-9 px-5 pb-20 pt-24 sm:px-8 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:px-12 lg:py-24"
      >
        {/* ——— Copy column ——— */}
        <motion.div
          style={{ x: copyParallaxX, y: copyScrollY }}
          className="relative z-20 order-1 text-center lg:text-right"
        >
          {/* Oversized chapter numeral, set like a title card */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 right-0 hidden select-none overflow-hidden lg:block"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`numeral-${chapter.key}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14, transition: { duration: 0.25 } }}
                transition={{ duration: 0.9, ease: EASE }}
                className="block text-[11rem] font-black leading-none text-white/[0.045] xl:text-[13rem]"
              >
                {faIndex(index + 1)}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div
            variants={copyVariants}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-xl lg:mx-0"
          >
            {/* Eyebrow */}
            <motion.div
              variants={riseVariants}
              className="mb-6 flex items-center justify-center gap-3 lg:justify-start"
            >
              <span className="h-px w-10 bg-gradient-to-l from-gold-400/80 to-transparent sm:w-14" />
              <span
                dir="ltr"
                className="font-display text-[10px] font-semibold uppercase tracking-[0.42em] text-gold-200/85 sm:text-[11px]"
              >
                Modara Maison
              </span>
              <span className="h-px w-10 bg-gradient-to-r from-gold-400/80 to-transparent sm:w-14" />
            </motion.div>

            {/* Chapter marker */}
            <motion.div
              variants={riseVariants}
              className="mb-4 flex items-center justify-center gap-3 lg:justify-start"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-200/25 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-gold-100/90 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300" />
                </span>
                فصل {faIndex(index + 1)} از {faIndex(CHAPTERS.length)}
              </span>
              <span className="text-[11px] font-semibold tracking-[0.18em] text-white/45">
                {chapter.label}
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="relative text-[2.15rem] font-black leading-[1.22] tracking-[-0.01em] text-[#fdf8ec] sm:text-5xl lg:text-[3.6rem] xl:text-[4.1rem]">
              <span className="sr-only">مُدارا — فروشگاه آنلاین مد و فشن</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`headline-${chapter.key}`}
                  aria-hidden="true"
                  className="block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  {headlineLines(chapter.headline).map((line, lineIndex) => (
                    <span
                      key={`${chapter.key}-line-${lineIndex}`}
                      className="block overflow-hidden py-[0.06em]"
                    >
                      <motion.span
                        custom={lineIndex}
                        variants={lineVariants}
                        initial="hidden"
                        animate="show"
                        className="block"
                      >
                        {lineIndex === 0 ? (
                          line
                        ) : (
                          <span className="bg-gradient-to-l from-gold-100 via-gold-300 to-gold-500 bg-clip-text text-transparent">
                            {line}
                          </span>
                        )}
                      </motion.span>
                    </span>
                  ))}
                </motion.span>
              </AnimatePresence>
            </h1>

            {/* Chapter note */}
            <div className="relative mt-4 min-h-[3.5rem] sm:min-h-[3.25rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`note-${chapter.key}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.22 } }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
                  className="mx-auto max-w-lg text-[13px] leading-7 text-white/62 sm:text-[15px] lg:mx-0"
                >
                  {chapter.note}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <motion.div
              variants={riseVariants}
              className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
            >
              <button
                type="button"
                onClick={() => onNavigate('shop', chapter.key)}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-l from-gold-200 via-gold-300 to-gold-500 px-7 py-3.5 text-[13px] font-extrabold text-[#1a1305] shadow-[0_18px_40px_-18px_rgba(217,189,130,0.75)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:text-sm"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">ورود به کالکشن {chapter.label}</span>
                <ArrowLeft className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-6 py-3.5 text-[13px] font-bold text-white/85 backdrop-blur-sm transition-colors duration-300 hover:border-gold-200/60 hover:bg-white/[0.07] hover:text-white sm:text-sm"
              >
                همهٔ محصولات
                <ChevronLeft className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Chapter chips */}
            <motion.div variants={riseVariants} className="mt-8">
              <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                {CHAPTERS.map((item, itemIndex) => {
                  const active = itemIndex === index;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => goTo(itemIndex)}
                      aria-current={active ? 'true' : undefined}
                      aria-label={`نمایش فصل ${item.label}`}
                      className={`relative flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold transition-all duration-500 sm:text-xs ${
                        active
                          ? 'border-gold-200/60 bg-gold-200/15 text-gold-50 shadow-[0_0_24px_-8px_rgba(217,189,130,0.8)]'
                          : 'border-white/10 bg-white/[0.02] text-white/55 hover:border-white/25 hover:text-white/85'
                      }`}
                    >
                      <span className={active ? 'text-gold-200' : 'text-white/40'}>
                        {chapterIcons[item.key] ?? <SparkIcon />}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ——— Poster column ——— */}
        <motion.div
          style={{ y: posterScrollY }}
          className="relative order-2 mx-auto w-full max-w-[21rem] sm:max-w-[24rem] lg:mx-0 lg:max-w-[34rem] lg:justify-self-center"
        >
          <div className="relative [perspective:1400px]">
            {/* Warm aura behind the arch */}
            <motion.div
              aria-hidden="true"
              style={{ x: auraX, y: auraY }}
              className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,190,122,0.3),rgba(168,120,50,0.12)_45%,transparent_72%)] blur-2xl"
            />

            {/* Offset hairline frame */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 translate-x-3 -translate-y-3 rounded-t-full border border-gold-200/20 sm:translate-x-4 sm:-translate-y-4"
            />

            <motion.div
              style={{ x: posterParallaxX, y: posterParallaxY }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="relative aspect-[4/5] overflow-hidden rounded-t-full border border-gold-200/30 bg-[#141009] shadow-[0_50px_90px_-40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.14)] sm:aspect-[5/6] lg:aspect-auto lg:h-[min(68vh,36rem)]"
            >
              {/* Film frame */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={`poster-${chapter.key}`}
                  initial={{ opacity: 0, scale: 1.09 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.015, transition: { duration: 0.8, ease: EASE } }}
                  transition={{ duration: 1.25, ease: EASE }}
                  className="absolute inset-0"
                >
                  <img
                    src={asset(chapter.poster)}
                    alt={chapter.posterAlt}
                    width={1376}
                    height={768}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={() => setPosterReady(true)}
                    onError={() => setPosterReady(true)}
                    style={{ objectPosition: chapter.posterFocus }}
                    className={`h-full w-full object-cover ${
                      prefersReducedMotion ? '' : 'maison-kenburns'
                    }`}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Cinematic grade over the frame */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,6,0.62)_0%,transparent_26%,transparent_56%,rgba(10,8,6,0.86)_100%)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(255,236,196,0.18),transparent_58%)] mix-blend-screen"
              />
              <div
                aria-hidden="true"
                className="maison-grain pointer-events-none absolute inset-0 opacity-[0.09]"
              />

              {/* Arch inner rim */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[10px] rounded-t-full border border-white/10 sm:inset-3"
              />

              {/* Frame slate inside the arch */}
              <div className="pointer-events-none absolute inset-x-0 top-[18%] z-20 flex flex-col items-center gap-2 px-6 sm:top-[15%]">
                <span aria-hidden="true" className="h-px w-8 bg-gold-200/50" />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`slate-${chapter.key}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
                    dir="ltr"
                    className="text-center font-display text-[9px] font-semibold uppercase tracking-[0.34em] text-white/75"
                  >
                    Modara — Frame {faIndex(index + 1)}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Frame controls */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full border border-white/15 bg-[#0d0a07]/70 px-1.5 py-1.5 backdrop-blur-md sm:bottom-5 sm:left-5">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="قاب قبلی"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-gold-100"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-1 px-1" aria-hidden="true">
                  {CHAPTERS.map((item, itemIndex) => (
                    <span
                      key={`dot-${item.key}`}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        itemIndex === index
                          ? 'w-5 bg-gradient-to-l from-gold-200 to-gold-500'
                          : 'w-1.5 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="قاب بعدی"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-gold-100"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Loading shimmer until the first frame decodes */}
              {!posterReady && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 animate-pulse bg-[linear-gradient(160deg,#1b150e,#0e0b08)]"
                />
              )}
            </motion.div>
          </div>

          {/* ——— Floating product label ——— */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="relative z-10 mt-11 w-full sm:mt-12 lg:absolute lg:-bottom-12 lg:-right-6 lg:mt-0 lg:w-[19.5rem] xl:-right-10"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.aside
                key={`product-${chapter.key}`}
                aria-label={`محصول شاخص ${chapter.label}`}
                initial={{ opacity: 0, y: 22, rotate: -1.2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: 14, transition: { duration: 0.28, ease: EASE } }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
                className="relative overflow-hidden rounded-[1.4rem] border border-gold-200/25 bg-[#fbf6ea]/95 p-3.5 text-[#1b1409] shadow-[0_34px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-gold-500/70 to-transparent"
                />
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => (product ? onNavigate('product', product.slug) : onNavigate('shop', chapter.key))}
                    aria-label={product ? `مشاهده ${product.name}` : `مشاهده دسته ${chapter.label}`}
                    className="group relative h-[5.5rem] w-[4.35rem] shrink-0 overflow-hidden rounded-xl bg-[#efe6d5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600"
                  >
                    <img
                      src={
                        product
                          ? optimizedAsset(product.image_url, 480)
                          : asset(chapter.backgroundFallback)
                      }
                      srcSet={
                        product ? imageSrcSet(product.image_url, [480, 720]) : undefined
                      }
                      sizes="72px"
                      alt={product ? product.name : chapter.label}
                      width={480}
                      height={640}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 ring-1 ring-inset ring-black/10"
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold-700">
                        {chapterIcons[chapter.key]}
                        {chapter.label}
                      </span>
                      {product && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1b1409]/55">
                          <Star className="h-3 w-3 fill-gold-500 text-gold-600" aria-hidden="true" />
                          {faDigits(product.rating)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] font-black leading-5 text-[#1b1409]">
                      {product ? product.name : `منتخب‌های دسته ${chapter.label}`}
                    </p>
                    <p className="mt-1 text-[12px] font-extrabold text-[#3a2c15]">
                      {product ? formatPrice(product.price) : 'کالکشن کامل در فروشگاه'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      product ? onNavigate('product', product.slug) : onNavigate('shop', chapter.key)
                    }
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#171008] px-3 py-2 text-[11px] font-extrabold text-gold-100 transition-colors hover:bg-gold-500 hover:text-[#171008]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                    دیدن محصول
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop', chapter.key)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#1b1409]/15 px-3 py-2 text-[11px] font-extrabold text-[#1b1409]/70 transition-colors hover:border-gold-600/50 hover:text-[#1b1409]"
                  >
                    کل دسته
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Auto-advance progress */}
                {!prefersReducedMotion && !paused && (
                  <span
                    key={`progress-${chapter.key}`}
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-[2px] bg-gradient-to-l from-gold-300 via-gold-500 to-gold-300"
                    style={{
                      animation: `heroProgress ${CHAPTER_MS}ms linear forwards`,
                      transformOrigin: 'right center',
                    }}
                  />
                )}
              </motion.aside>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ——— Bottom rail: brand line + scroll cue ——— */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 hidden items-end justify-between px-8 lg:flex xl:px-12">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/35" dir="ltr">
          Maison Collection
        </p>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/45">اسکرول</span>
          <span className="relative h-10 w-px overflow-hidden bg-white/15">
            <span className="hero-scroll-dot absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-gold-200 to-transparent" />
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/35" dir="ltr">
          Cinematic Edition
        </p>
      </div>
    </section>
  );
}

function SparkIcon() {
  return <Gem className="h-3.5 w-3.5" aria-hidden="true" />;
}
