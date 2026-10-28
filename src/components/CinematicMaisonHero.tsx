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
  bloomStill: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
/** Snappy cadence: the frame and its product change together, and quickly. */
const CHAPTER_MS = 4200;
const CUT_S = 0.8;
const HERO_THEME_EVENT = 'modara:hero-theme';

/** Key art of each chapter. One full-bleed frame per catalogue category. */
const CHAPTERS: Chapter[] = [
  {
    key: 'clothing',
    label: 'لباس',
    headline: 'خطِ اولِ استایل',
    note: 'ترنچ‌کت‌ها، پیراهن‌ها و بلیزرهایی که فرم روز شما را می‌سازند.',
    poster: '/images/hero-atelier/look-minimal.jpg',
    posterAlt: 'بانویی با لباس کرم در رواق آجری روشن — کالکشن لباس مُدارا',
    posterFocus: '26% 48%',
    productSlug: 'trench-coat-camel-women',
    bloomStill: '/images/categories/category-clothing.jpg',
  },
  {
    key: 'pants',
    label: 'شلوار',
    headline: 'فرمِ بی‌زمان',
    note: 'برش‌های راسته و فراخ که با هر قدم، وقار را همراه می‌کنند.',
    poster: '/images/hero-lux-1.jpg',
    posterAlt: 'بانویی با پالتوی شتری و شلوار مشکی در رواق تراورتن',
    posterFocus: '30% 46%',
    productSlug: 'wide-leg-trousers-black-women',
    bloomStill: '/images/categories/category-pants.jpg',
  },
  {
    key: 'glasses',
    label: 'عینک',
    headline: 'قابِ نگاه',
    note: 'فریم‌هایی که صورت را قاب می‌گیرند و نگاه را به یاد می‌سپارند.',
    poster: '/images/hero-lux-3.jpg',
    posterAlt: 'کیف چرم عسلی، عینک خلبانی و ساعت طلایی روی سکوی سنگی',
    posterFocus: '28% 56%',
    productSlug: 'luxury-sunglasses-classic',
    bloomStill: '/images/categories/category-glasses.jpg',
  },
  {
    key: 'watch',
    label: 'ساعت',
    headline: 'وزنِ ثانیه‌ها',
    note: 'ساعت‌هایی که دقت را به طلا و فولاد ترجمه می‌کنند.',
    poster: '/images/hero-atelier/look-tailored.jpg',
    posterAlt: 'آقایی با کت شلوار سرمه‌ای در حال بستن ساعت در بوتیک',
    posterFocus: '34% 48%',
    productSlug: 'steel-chronograph-watch',
    bloomStill: '/images/categories/category-watch.jpg',
  },
  {
    key: 'bag',
    label: 'کیف',
    headline: 'همراهِ همیشگی',
    note: 'چرم‌های دست‌دوز که با گذر زمان، شخصی‌تر می‌شوند.',
    poster: '/images/hero-atelier/look-noir.jpg',
    posterAlt: 'بانویی با کیف زنجیردار مشکی در راهروی طلایی کاخ',
    posterFocus: '36% 50%',
    productSlug: 'leather-tote-bag-tan',
    bloomStill: '/images/categories/category-bag.jpg',
  },
  {
    key: 'accessory',
    label: 'اکسسوری',
    headline: 'جزئیاتِ ماندگار',
    note: 'کمربند، جواهر و کلاه؛ امضاهای کوچکِ یک استایل کامل.',
    poster: '/images/hero-fashion-poster.png',
    posterAlt: 'جزئیات پالتوی مشکی، ساعت طلایی و کمربند چرم',
    posterFocus: '50% 46%',
    productSlug: 'womens-jewelry-set',
    bloomStill: '/images/categories/category-accessory.jpg',
  },
];

const chapterIcons: Record<string, ReactNode> = {
  clothing: <Shirt className="h-3.5 w-3.5" aria-hidden="true" />,
  pants: <Package className="h-3.5 w-3.5" aria-hidden="true" />,
  glasses: <Glasses className="h-3.5 w-3.5" aria-hidden="true" />,
  watch: <Watch className="h-3.5 w-3.5" aria-hidden="true" />,
  bag: <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />,
  accessory: <Gem className="h-3.5 w-3.5" aria-hidden="true" />,
};

/** Splits a headline into two masked lines: the noun stays gold. */
function headlineLines(headline: string): string[] {
  const words = headline.trim().split(/\s+/);
  if (words.length < 2) return [headline];
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
}

/** Deterministic dust motes floating through the projector light. */
const DUST_MOTES = Array.from({ length: 18 }, (_, i) => ({
  left: 3 + ((i * 37) % 94),
  top: 6 + ((i * 29) % 88),
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  delay: (i % 8) * 1.05,
  duration: 15 + (i % 6) * 3,
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 9),
}));

const copyVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: EASE },
  },
};

const lineVariants: Variants = {
  hidden: { y: '112%' },
  show: (line: number) => ({
    y: '0%',
    transition: { duration: 0.85, delay: line * 0.07, ease: EASE },
  }),
};

export default function CinematicMaisonHero({ onNavigate }: CinematicMaisonHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [products, setProducts] = useState<Record<string, ProductPreview>>({});

  const prefersReducedMotion = useReducedMotion();
  const chapter = CHAPTERS[index];
  const product = products[chapter.productSlug];

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const copyScrollY = useTransform(scrollYProgress, [0, 1], [0, 26]);
  const stageScrollY = useTransform(scrollYProgress, [0, 1], [0, 24]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 70, damping: 20, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 70, damping: 20, mass: 0.8 });
  const artParallaxX = useTransform(smoothX, [-0.5, 0.5], [22, -22]);
  const artParallaxY = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const copyParallaxX = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);
  const plateParallaxX = useTransform(smoothX, [-0.5, 0.5], [10, -10]);

  /* Lift the opening curtain even if the animation callback is skipped. */
  useEffect(() => {
    const timer = window.setTimeout(() => setCurtainOpen(true), 1500);
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
        /* The stage stays usable with the key art alone. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Warm the next frame so a cut never reveals a blank plate. */
  useEffect(() => {
    const next = CHAPTERS[(index + 1) % CHAPTERS.length];
    [next.poster, next.bloomStill].forEach((src) => {
      const img = new Image();
      img.src = asset(src);
    });
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

  const cardTone = '#fbf6ea';
  const move = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      aria-label="کالکشن سینمایی مُدارا"
      aria-roledescription="carousel"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={move}
      className="relative isolate overflow-hidden"
      style={{ minHeight: '100svh', backgroundColor: '#0b0907', color: '#f6efe2' }}
    >
      {/* ——— Key art: one full-bleed frame per chapter ——— */}
      <motion.div
        style={{ y: stageScrollY }}
        className="absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0" style={{ backgroundColor: '#0a0806' }} />

        {/* Gate weave: the tiny, organic drift of real projector film */}
        <div className={prefersReducedMotion ? 'absolute inset-0' : 'maison-weave absolute inset-0'}>
          <AnimatePresence initial={false}>
            <motion.div
              key={`frame-${chapter.key}`}
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
                transition: { duration: prefersReducedMotion ? 0.2 : 0.55, ease: EASE },
              }}
              transition={{ duration: prefersReducedMotion ? 0.3 : CUT_S, ease: [0.76, 0, 0.24, 1] }}
              style={{ willChange: 'clip-path, opacity' }}
              className="absolute inset-0"
            >
              <motion.div
                style={{ x: artParallaxX, y: artParallaxY }}
                className="absolute -inset-[6%]"
              >
                <img
                  src={asset(chapter.poster)}
                  alt={chapter.posterAlt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{
                    objectPosition: chapter.posterFocus,
                    filter: 'brightness(.7) contrast(1.06) saturate(.9)',
                  }}
                  className={`h-full w-full object-cover ${
                    prefersReducedMotion ? '' : 'maison-pan-a'
                  }`}
                />
              </motion.div>

              {/* Colour bleed from the catalogue still, so the frame feels lit */}
              <div
                aria-hidden="true"
                className="absolute -inset-10 hidden sm:block"
                style={{
                  backgroundImage: `url(${asset(chapter.bloomStill)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: '50% 45%',
                  filter: 'blur(56px) saturate(1.25)',
                  opacity: 0.2,
                  transform: 'scale(1.15)',
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Projector wipe: a sliver of light travels with every cut */}
        {!prefersReducedMotion && (
          <span
            key={`wipe-${chapter.key}`}
            className="maison-wipe absolute inset-y-0 z-10 w-px"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, transparent, rgba(250,240,214,.85), transparent)',
              boxShadow: '0 0 46px 16px rgba(217,189,130,.26)',
            }}
          />
        )}

        {/* Legibility grade: the copy side stays deep, the art keeps its light */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(270deg, rgba(8,7,6,.94) 0%, rgba(9,8,6,.84) 30%, rgba(10,8,6,.4) 58%, rgba(8,7,6,.9) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 28% 24%, rgba(217,189,130,.18), transparent 55%), radial-gradient(ellipse at 78% 84%, rgba(118,80,36,.28), transparent 60%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(8,7,6,.9) 0%, transparent 28%, transparent 60%, rgba(8,7,6,.96) 100%)',
          }}
        />

        {/* Drifting light leak, like a projector lamp breathing */}
        {!prefersReducedMotion && (
          <div
            aria-hidden="true"
            className="maison-leak absolute -inset-1/4 mix-blend-screen"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(255,214,150,.24), transparent 56%)',
            }}
          />
        )}

        {/* Dust in the beam */}
        {!prefersReducedMotion && (
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            {DUST_MOTES.map((mote, moteIndex) => (
              <span
                key={`mote-${moteIndex}`}
                className="maison-mote absolute rounded-full"
                style={
                  {
                    left: `${mote.left}%`,
                    top: `${mote.top}%`,
                    width: mote.size,
                    height: mote.size,
                    backgroundColor: 'rgba(245,232,203,.7)',
                    animationDelay: `${mote.delay}s`,
                    animationDuration: `${mote.duration}s`,
                    '--dust-x': `${mote.drift}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* Film grain */}
        <div
          aria-hidden="true"
          className="maison-grain pointer-events-none absolute inset-0"
          style={{ opacity: 0.07 }}
        />
      </motion.div>

      {/* ——— Arch frame drawn over the whole frame ——— */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
        <div
          className="absolute inset-x-4 inset-y-16 sm:inset-x-8 sm:inset-y-20 lg:inset-x-12 lg:inset-y-24"
          style={{
            border: '1px solid rgba(217,189,130,.16)',
            borderBottom: 'none',
            borderRadius: '46% 46% 0 0 / 26% 26% 0 0',
          }}
        />
        <div
          className="absolute inset-x-4 inset-y-16 sm:inset-x-8 sm:inset-y-20 lg:inset-x-12 lg:inset-y-24"
          style={{
            border: '1px solid rgba(255,255,255,.05)',
            borderTop: 'none',
            borderRadius: '0 0 18px 18px',
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-16 sm:h-20"
          style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,.88), transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,.9), transparent)' }}
        />
        <span className="absolute left-8 top-7 h-px w-12 bg-white/20 sm:left-12" />
        <span className="absolute right-8 top-7 h-px w-12 bg-white/20 sm:right-12" />
      </div>

      {/* ——— Opening curtain ——— */}
      <AnimatePresence>
        {!curtainOpen && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 1, ease: EASE, delay: 0.1 }}
            onAnimationComplete={() => setCurtainOpen(true)}
            className="pointer-events-none absolute inset-0 z-40"
            style={{ backgroundColor: '#0b0907' }}
          >
            <span
              className="absolute inset-x-0 top-1/2 h-px"
              style={{
                backgroundImage:
                  'linear-gradient(to right, transparent, rgba(226,194,121,.5), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Stage: copy and product plate sit inside the frame ——— */}
      <div className="relative z-30 mx-auto flex w-full max-w-[92rem] flex-col justify-end gap-10 px-6 pb-20 pt-28 sm:px-10 sm:pt-32 lg:grid lg:min-h-[100svh] lg:grid-cols-[1.02fr_.98fr] lg:items-end lg:gap-12 lg:px-16 lg:pb-28">
        {/* Copy */}
        <motion.div
          style={{ x: copyParallaxX, y: copyScrollY }}
          className="relative text-center lg:text-right"
        >
          <motion.div
            variants={copyVariants}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-xl lg:mx-0"
          >
            <motion.div
              variants={riseVariants}
              className="mb-5 flex items-center justify-center gap-3 lg:justify-start"
            >
              <span
                className="h-px w-10 sm:w-14"
                style={{
                  backgroundImage:
                    'linear-gradient(to left, rgba(213,171,85,.85), transparent)',
                }}
              />
              <span
                dir="ltr"
                className="font-display text-[10px] font-semibold uppercase tracking-[0.42em] sm:text-[11px]"
                style={{ color: 'rgba(237,218,166,.9)' }}
              >
                Modara Maison
              </span>
              <span
                className="h-px w-10 sm:w-14"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(213,171,85,.85), transparent)',
                }}
              />
            </motion.div>

            <motion.div
              variants={riseVariants}
              className="mb-4 flex items-center justify-center lg:justify-start"
            >
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
                style={{
                  border: '1px solid rgba(237,218,166,.32)',
                  backgroundColor: 'rgba(255,255,255,.07)',
                  color: 'rgba(246,237,211,.95)',
                }}
              >
                <span
                  className="relative flex h-1.5 w-1.5"
                  style={{ color: 'rgba(226,194,121,.9)' }}
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300" />
                </span>
                {chapter.label}
              </span>
            </motion.div>

            <h1
              className="relative text-[2.2rem] font-black leading-[1.2] tracking-[-0.01em] sm:text-5xl lg:text-[3.65rem] xl:text-[4.15rem]"
              style={{ color: '#fdf8ec' }}
            >
              <span className="sr-only">مُدارا — فروشگاه آنلاین مد و فشن</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`headline-${chapter.key}`}
                  aria-hidden="true"
                  className="block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.18 } }}
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
                          <span
                            style={{
                              backgroundImage:
                                'linear-gradient(to left, #f6edd3, #e2c279 55%, #c0913f)',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                            }}
                          >
                            {line}
                          </span>
                        )}
                      </motion.span>
                    </span>
                  ))}
                </motion.span>
              </AnimatePresence>
            </h1>

            <div className="relative mt-4 min-h-[3.5rem] sm:min-h-[3.25rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`note-${chapter.key}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.06 }}
                  className="mx-auto max-w-lg text-[13px] leading-7 sm:text-[15px] lg:mx-0"
                  style={{ color: 'rgba(255,255,255,.68)' }}
                >
                  {chapter.note}
                </motion.p>
              </AnimatePresence>
            </div>

            <motion.div
              variants={riseVariants}
              className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
            >
              <button
                type="button"
                onClick={() => onNavigate('shop', chapter.key)}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-[13px] font-extrabold transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 sm:text-sm"
                style={{
                  backgroundImage: 'linear-gradient(to left, #eddaa6, #e2c279 52%, #c0913f)',
                  color: '#1a1305',
                  boxShadow: '0 18px 40px -18px rgba(217,189,130,.75)',
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">ورود به کالکشن {chapter.label}</span>
                <ArrowLeft className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-bold transition-colors duration-300 sm:text-sm"
                style={{
                  border: '1px solid rgba(255,255,255,.24)',
                  backgroundColor: 'rgba(255,255,255,.06)',
                  color: 'rgba(255,255,255,.88)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                همهٔ محصولات
                <ChevronLeft className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Category rail */}
            <motion.div variants={riseVariants} className="mt-7">
              <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                {CHAPTERS.map((item, itemIndex) => {
                  const active = itemIndex === index;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => goTo(itemIndex)}
                      aria-current={active ? 'true' : undefined}
                      aria-label={`نمایش کالکشن ${item.label}`}
                      className="flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition-all duration-300 sm:text-xs"
                      style={
                        active
                          ? {
                              border: '1px solid rgba(237,218,166,.6)',
                              backgroundColor: 'rgba(226,194,121,.18)',
                              color: 'rgba(253,248,236,.98)',
                              boxShadow: '0 0 24px -8px rgba(217,189,130,.8)',
                            }
                          : {
                              border: '1px solid rgba(255,255,255,.12)',
                              backgroundColor: 'rgba(255,255,255,.03)',
                              color: 'rgba(255,255,255,.62)',
                            }
                      }
                    >
                      <span style={{ color: active ? '#eddaa6' : 'rgba(255,255,255,.45)' }}>
                        {chapterIcons[item.key]}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Product plate */}
        <motion.div
          style={{ x: plateParallaxX }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative mx-auto w-full max-w-[21rem] sm:max-w-[24rem] lg:mx-0 lg:max-w-[21rem] lg:justify-self-start"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.aside
              key={`product-${chapter.key}`}
              aria-label={`محصول شاخص ${chapter.label}`}
              initial={{ opacity: 0, y: 16, rotate: -0.8 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.16, ease: EASE } }}
              transition={{ duration: 0.42, ease: EASE }}
              className="relative overflow-hidden rounded-[1.4rem] p-3.5 shadow-[0_34px_70px_-30px_rgba(0,0,0,0.92)]"
              style={{
                backgroundColor: cardTone,
                color: '#1b1409',
                border: '1px solid rgba(226,194,121,.4)',
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-px"
                style={{
                  backgroundImage:
                    'linear-gradient(to left, transparent, rgba(192,145,63,.75), transparent)',
                }}
              />
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() =>
                    product ? onNavigate('product', product.slug) : onNavigate('shop', chapter.key)
                  }
                  aria-label={product ? `مشاهده ${product.name}` : `مشاهده دسته ${chapter.label}`}
                  className="group relative h-[5.5rem] w-[4.35rem] shrink-0 overflow-hidden rounded-xl focus-visible:outline-none"
                  style={{ backgroundColor: '#efe6d5' }}
                >
                  <img
                    src={
                      product ? optimizedAsset(product.image_url, 480) : asset(chapter.bloomStill)
                    }
                    srcSet={product ? imageSrcSet(product.image_url, [480, 720]) : undefined}
                    sizes="72px"
                    alt={product ? product.name : chapter.label}
                    width={480}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 ring-1 ring-inset ring-black/10"
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.16em]"
                      style={{ color: '#855d28' }}
                    >
                      {chapterIcons[chapter.key]}
                      {chapter.label}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-black leading-5">
                    {product ? product.name : `منتخب‌های دسته ${chapter.label}`}
                  </p>
                  <p className="mt-1 text-[12px] font-extrabold" style={{ color: '#3a2c15' }}>
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
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-extrabold transition-colors hover:brightness-110"
                  style={{ backgroundColor: '#171008', color: '#f6edd3' }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  دیدن محصول
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('shop', chapter.key)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-extrabold transition-colors"
                  style={{ border: '1px solid rgba(27,20,9,.16)', color: 'rgba(27,20,9,.72)' }}
                >
                  کل دسته
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Auto-advance hairline */}
              {!prefersReducedMotion && !paused && (
                <span
                  key={`progress-${chapter.key}`}
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 h-[2px]"
                  style={{
                    backgroundImage: 'linear-gradient(to left, #e2c279, #c0913f, #e2c279)',
                    animation: `heroProgress ${CHAPTER_MS}ms linear forwards`,
                    transformOrigin: 'right center',
                  }}
                />
              )}
            </motion.aside>
          </AnimatePresence>

          {/* Frame controls */}
          <div
            className="mt-4 flex items-center justify-center gap-2 lg:justify-start"
          >
            <div
              className="flex items-center gap-1 rounded-full px-1.5 py-1.5"
              style={{
                border: '1px solid rgba(255,255,255,.16)',
                backgroundColor: 'rgba(13,10,7,.62)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="قاب قبلی"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 px-1" aria-hidden="true">
                {CHAPTERS.map((item, itemIndex) => (
                  <span
                    key={`dot-${item.key}`}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: itemIndex === index ? 22 : 6,
                      backgroundImage:
                        itemIndex === index
                          ? 'linear-gradient(to left, #eddaa6, #c0913f)'
                          : undefined,
                      backgroundColor:
                        itemIndex === index ? undefined : 'rgba(255,255,255,.28)',
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="قاب بعدی"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,.7)' }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ——— Scroll cue ——— */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 hidden justify-center lg:flex">
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-[10px] font-bold tracking-[0.3em]"
            style={{ color: 'rgba(255,255,255,.5)' }}
          >
            اسکرول
          </span>
          <span
            className="relative h-9 w-px overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,.16)' }}
          >
            <span
              className="hero-scroll-dot absolute inset-x-0 top-0 h-4"
              style={{
                backgroundImage: 'linear-gradient(to bottom, #eddaa6, transparent)',
              }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
