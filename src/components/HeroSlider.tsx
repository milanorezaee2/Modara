import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { asset } from '../lib/format';

type HeroSliderProps = {
  onNavigate: (view: string, param?: string) => void;
};

type SlideTheme = 'light' | 'dark';

type Slide = {
  id: string;
  image: string;
  alt: string;
  theme: SlideTheme;
  eyebrow: string;
  eyebrowEn: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  cta: string;
  category: string;
  navLabel: string;
  objectClass: string;
};

const AUTOPLAY_MS = 6500;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HERO_THEME_EVENT = 'modara:hero-theme';

const slides: Slide[] = [
  {
    id: 'women',
    image: '/images/hero-lux-1.jpg',
    alt: 'مدل زن با پالتوی بلند کرم در معماری سنگی مینیمال',
    theme: 'light',
    eyebrow: 'کالکشن پاییز ـ زمستان ۱۴۰۵',
    eyebrowEn: 'AW26 · WOMEN',
    titleLead: 'ظرافت،',
    titleAccent: 'امضای توست',
    description: 'کالکشن جدید پوشاک مُدارا؛ برش‌هایی دقیق، پارچه‌هایی نجیب و حضوری که در خاطر می‌ماند.',
    cta: 'مشاهده کالکشن پوشاک',
    category: 'clothing',
    navLabel: 'پوشاک زنانه',
    objectClass: 'object-[24%_16%] sm:object-center',
  },
  {
    id: 'men',
    image: '/images/hero-lux-2.jpg',
    alt: 'مردی با کت‌وشلوار رسمی و ساعت لوکس در بوتيک تیره و مجلل',
    theme: 'dark',
    eyebrow: 'کالکشن مردانه مُدارا',
    eyebrowEn: 'AW26 · MEN & TIMEPIECES',
    titleLead: 'وقار،',
    titleAccent: 'در جزئیات است',
    description: 'ساعت‌ها و استایل رسمی مردانه؛ جایی که دقتِ ساخت، به امضای شخصیت شما تبدیل می‌شود.',
    cta: 'مشاهده ساعت‌های لوکس',
    category: 'watch',
    navLabel: 'مردانه و ساعت',
    objectClass: 'object-[22%_16%] sm:object-center',
  },
  {
    id: 'accessories',
    image: '/images/hero-lux-3.jpg',
    alt: 'کیف چرم لوکس، عینک طلایی و ساعت روی پایه سنگی تراورتن',
    theme: 'light',
    eyebrow: 'اکسسوری‌های منتخب فصل',
    eyebrowEn: 'THE ACCESSORIES EDIT',
    titleLead: 'جزئیاتِ',
    titleAccent: 'ماندگار',
    description: 'کیف‌های چرمی، عینک و اکسسوری‌های برگزیده؛ قطعه‌هایی کوچک، با تأثیری بزرگ و همیشگی.',
    cta: 'مشاهده اکسسوری‌ها',
    category: 'accessory',
    navLabel: 'کیف و اکسسوری',
    objectClass: 'object-[20%_24%] sm:object-center',
  },
];

const stats = [
  { value: '۱۲۰+', label: 'برند منتخب' },
  { value: '۹۸٪', label: 'رضایت مشتریان' },
  { value: '۷ روز', label: 'ضمانت بازگشت' },
];

const themeStyles: Record<
  SlideTheme,
  {
    text: string;
    eyebrow: string;
    latin: string;
    accent: string;
    description: string;
    ornament: string;
    primary: string;
    primaryBadge: string;
    secondary: string;
    statBorder: string;
    statLabel: string;
    frame: string;
    scrimDesktop: string;
    scrimMobile: string;
    navTrack: string;
    arrow: string;
    watermarkStroke: string;
  }
> = {
  light: {
    text: 'text-[#211a12]',
    eyebrow: 'text-gold-700',
    latin: 'text-[#211a12]/45',
    accent:
      'bg-gradient-to-l from-[#7c5518] via-[#bd9448] to-[#8a611f] bg-clip-text text-transparent',
    description: 'text-[#211a12]/70',
    ornament: 'bg-gold-600',
    primary: 'bg-[#17120b] text-[#f7efdc] shadow-[0_18px_40px_-16px_rgba(23,18,11,0.55)]',
    primaryBadge: 'bg-gold-500 text-[#171208] group-hover:bg-[#171208] group-hover:text-gold-300',
    secondary:
      'border-[#211a12]/25 bg-white/10 text-[#211a12] hover:border-gold-600/70 hover:bg-gold-500/10 hover:text-gold-800',
    statBorder: 'border-[#211a12]/10',
    statLabel: 'text-[#211a12]/55',
    frame: 'border-[#211a12]/15',
    scrimDesktop:
      'bg-[linear-gradient(to_left,rgba(250,246,238,0.95)_0%,rgba(250,246,238,0.74)_34%,rgba(250,246,238,0.20)_58%,transparent_78%)]',
    scrimMobile:
      'bg-[linear-gradient(to_top,rgba(250,246,238,0.98)_0%,rgba(250,246,238,0.90)_40%,rgba(250,246,238,0.28)_66%,transparent_86%)]',
    navTrack: 'bg-[#211a12]/20',
    arrow:
      'border-[#211a12]/20 bg-white/25 text-[#211a12] hover:border-gold-600 hover:bg-gold-500 hover:text-white',
    watermarkStroke: 'rgba(101,78,38,0.16)',
  },
  dark: {
    text: 'text-[#f7f1e5]',
    eyebrow: 'text-gold-300',
    latin: 'text-white/45',
    accent:
      'bg-gradient-to-l from-[#f0d9a0] via-[#d9b968] to-[#b98d3e] bg-clip-text text-transparent',
    description: 'text-white/70',
    ornament: 'bg-gold-400',
    primary: 'bg-[#f3ead6] text-[#1a150c] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]',
    primaryBadge: 'bg-[#171208] text-gold-300 group-hover:bg-[#171208] group-hover:text-gold-300',
    secondary:
      'border-white/35 bg-white/5 text-white hover:border-gold-300/80 hover:bg-gold-400/10 hover:text-gold-200',
    statBorder: 'border-white/15',
    statLabel: 'text-white/55',
    frame: 'border-white/20',
    scrimDesktop:
      'bg-[linear-gradient(to_left,rgba(12,9,6,0.90)_0%,rgba(12,9,6,0.64)_36%,rgba(12,9,6,0.20)_62%,transparent_84%)]',
    scrimMobile:
      'bg-[linear-gradient(to_top,rgba(12,9,6,0.97)_0%,rgba(12,9,6,0.86)_42%,rgba(12,9,6,0.25)_68%,transparent_88%)]',
    navTrack: 'bg-white/25',
    arrow:
      'border-white/25 bg-black/20 text-white hover:border-gold-400 hover:bg-gold-500 hover:text-white',
    watermarkStroke: 'rgba(232,201,122,0.15)',
  },
};

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.35, ease: EASE } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 38 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function HeroSlider({ onNavigate }: HeroSliderProps) {
  const [active, setActive] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const paused = hoverPaused || tabHidden;

  const sectionRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(AUTOPLAY_MS);
  const touchXRef = useRef<number | null>(null);
  const lastThemeRef = useRef<string>('');

  const slide = slides[active];
  const styles = themeStyles[slide.theme];
  const isLight = slide.theme === 'light';

  const goTo = useCallback((index: number) => {
    setActive(((index % slides.length) + slides.length) % slides.length);
  }, []);
  const goNext = useCallback(() => setActive((p) => (p + 1) % slides.length), []);
  const goPrev = useCallback(
    () => setActive((p) => (p - 1 + slides.length) % slides.length),
    [],
  );

  /* Preload campaign imagery for seamless crossfades */
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = asset(s.image);
    });
  }, []);

  /* ---------- Autoplay (with true pause / resume) ---------- */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (prefersReducedMotion) return;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(goNext, remainingRef.current);
  }, [clearTimer, goNext, prefersReducedMotion]);

  useEffect(() => {
    remainingRef.current = AUTOPLAY_MS;
    if (!paused) startTimer();
    return clearTimer;
  }, [active, startTimer, clearTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paused) {
      if (timerRef.current !== null) {
        remainingRef.current = Math.max(
          remainingRef.current - (Date.now() - startedAtRef.current),
          800,
        );
        clearTimer();
      }
    } else {
      startTimer();
    }
  }, [paused, startTimer, clearTimer]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /* ---------- Sync header colour with the active slide ---------- */
  useEffect(() => {
    const emitTheme = () => {
      const el = sectionRef.current;
      const inHero = el ? el.getBoundingClientRect().bottom > 88 : true;
      const theme = inHero ? slides[active].theme : 'light';
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
  }, [active]);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="کمپین‌های مُدارا"
      className={`relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-[#14100c] outline-none transition-colors duration-700 ${styles.text}`}
      onFocus={() => setHoverPaused(true)}
      onBlur={() => setHoverPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goNext();
        if (event.key === 'ArrowRight') goPrev();
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
        if (Math.abs(delta) > 48) {
          if (delta < 0) goNext();
          else goPrev();
        }
      }}
    >
      {/* Campaign imagery */}
      <AnimatePresence>
        <motion.img
          key={slide.id}
          src={asset(slide.image)}
          alt={slide.alt}
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2, ease: EASE },
            scale: {
              duration: prefersReducedMotion ? 0 : AUTOPLAY_MS / 1000 + 1.6,
              ease: 'linear',
            },
          }}
          className={`absolute inset-0 h-full w-full object-cover will-change-transform ${slide.objectClass}`}
          draggable={false}
        />
      </AnimatePresence>

      {/* Legibility scrims (theme-aware) */}
      <AnimatePresence>
        <motion.div
          key={`scrim-${slide.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: EASE }}
          className="pointer-events-none absolute inset-0"
        >
          <div className={`absolute inset-0 hidden sm:block ${styles.scrimDesktop}`} />
          <div className={`absolute inset-0 sm:hidden ${styles.scrimMobile}`} />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic film grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Giant outlined brand watermark */}
      <motion.div
        aria-hidden="true"
        dir="ltr"
        animate={{ x: active * -16 }}
        transition={{ duration: 1.4, ease: EASE }}
        className="pointer-events-none absolute -bottom-4 left-0 z-[2] translate-y-[24%] select-none font-display text-[20vw] font-semibold leading-none tracking-[0.06em]"
        style={{ color: 'transparent', WebkitTextStroke: `1px ${styles.watermarkStroke}` }}
      >
        MODARA
      </motion.div>

      {/* Hairline editorial frame */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-3 bottom-3 top-[4.25rem] z-[5] border transition-colors duration-700 sm:inset-x-5 sm:bottom-5 sm:top-[4.75rem] ${styles.frame}`}
      />

      {/* Slide counter */}
      <div
        dir="ltr"
        className="absolute left-8 top-24 z-20 hidden items-baseline gap-2 font-display sm:left-10 md:flex"
        aria-hidden="true"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="text-3xl font-medium leading-none"
          >
            {pad(active + 1)}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm opacity-45">/ {pad(slides.length)}</span>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto h-full max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="flex h-full max-w-xl items-end pb-32 pt-28 sm:items-center sm:pb-24 sm:pt-24 lg:max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              variants={contentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full"
            >
              {/* Eyebrow */}
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="h-px w-12 bg-gradient-to-l from-gold-500 to-transparent" aria-hidden="true" />
                <span className={`text-sm font-bold sm:text-base ${styles.eyebrow}`}>{slide.eyebrow}</span>
                <span dir="ltr" className={`font-display text-[10px] font-medium tracking-[0.34em] ${styles.latin}`}>
                  {slide.eyebrowEn}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="mt-5 text-[2.55rem] font-extrabold leading-[1.08] sm:mt-6 sm:text-6xl lg:text-7xl xl:text-[5.35rem]"
              >
                {slide.titleLead}
                <span className={`mt-1 block pb-2 ${styles.accent}`}>{slide.titleAccent}</span>
              </motion.h1>

              {/* Ornament */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center gap-3 sm:mt-5" aria-hidden="true">
                <span className={`h-px w-16 opacity-70 ${styles.ornament}`} />
                <span className={`h-1.5 w-1.5 rotate-45 ${styles.ornament}`} />
                <span className={`h-px w-6 opacity-50 ${styles.ornament}`} />
              </motion.div>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className={`mt-4 max-w-lg text-[15px] leading-7 sm:mt-5 sm:text-lg sm:leading-9 ${styles.description}`}
              >
                {slide.description}
              </motion.p>

              {/* CTAs */}
              <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9 sm:gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('shop', slide.category)}
                  className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full py-1.5 pe-1.5 ps-7 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:py-2 sm:pe-2 sm:ps-9 sm:text-base ${styles.primary}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-[101%] bg-gradient-to-l from-gold-300 via-gold-500 to-gold-600 transition-transform duration-500 ease-out group-hover:translate-x-0"
                  />
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-[#171208]">
                    {slide.cta}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 sm:h-10 sm:w-10 ${styles.primaryBadge}`}
                  >
                    <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 sm:h-5 sm:w-5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className={`group inline-flex items-center justify-center rounded-full border px-7 py-3 text-sm font-bold backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:px-9 sm:py-[15px] sm:text-base ${styles.secondary}`}
                >
                  مشاهده همه محصولات
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className={`mt-10 hidden max-w-md grid-cols-3 border-t pt-6 sm:mt-12 sm:grid ${styles.statBorder}`}
              >
                {stats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={i > 0 ? `border-r pr-5 ${styles.statBorder}` : ''}
                  >
                    <p className="text-xl font-extrabold leading-none lg:text-2xl">{stat.value}</p>
                    <p className={`mt-2 text-xs ${styles.statLabel}`}>{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-9 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2.5 lg:flex" aria-hidden="true">
        <span className="text-[11px] font-medium opacity-60">اسکرول کنید</span>
        <span className={`relative block h-10 w-px overflow-hidden ${isLight ? 'bg-[#211a12]/20' : 'bg-white/25'}`}>
          <span className="hero-scroll-dot absolute left-0 top-0 block h-3 w-px bg-gold-500" />
        </span>
      </div>

      {/* Slider navigation */}
      <div
        className="absolute inset-x-0 bottom-0 z-20"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-6 pb-9 sm:px-10 sm:pb-11 lg:px-12">
          {/* Slide selectors */}
          <div className="flex items-end gap-3 sm:gap-5" role="tablist" aria-label="انتخاب اسلاید">
            {slides.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`اسلاید ${i + 1}: ${s.navLabel}`}
                  onClick={() => goTo(i)}
                  className="group flex flex-col items-start gap-2.5 text-right"
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      dir="ltr"
                      className={`font-display text-[13px] font-medium leading-none transition-all duration-300 ${
                        isActive ? 'text-gold-600 opacity-100' : 'opacity-45 group-hover:opacity-80'
                      } ${!isLight && isActive ? '!text-gold-300' : ''}`}
                    >
                      {pad(i + 1)}
                    </span>
                    <span
                      className={`hidden text-xs font-semibold transition-opacity duration-300 md:block ${
                        isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-85'
                      }`}
                    >
                      {s.navLabel}
                    </span>
                  </span>
                  <span className={`relative block h-px w-12 overflow-hidden sm:w-24 ${styles.navTrack}`}>
                    {isActive ? (
                      <span
                        key={`progress-${active}`}
                        className="hero-progress-fill absolute inset-0 block bg-gradient-to-l from-gold-400 to-gold-600"
                        style={{
                          animationDuration: `${AUTOPLAY_MS}ms`,
                          animationPlayState: paused || prefersReducedMotion ? 'paused' : 'running',
                          transform: prefersReducedMotion ? 'scaleX(1)' : undefined,
                        }}
                      />
                    ) : (
                      <span
                        className={`absolute inset-0 block origin-right bg-gold-500/60 transition-transform duration-500 ${
                          i < active ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prev / next */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={goPrev}
              aria-label="اسلاید قبلی"
              className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95 ${styles.arrow}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="اسلاید بعدی"
              className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95 ${styles.arrow}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Soft transition into the page below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-14 bg-gradient-to-t from-[#faf8f5]/90 to-transparent"
      />
    </section>
  );
}
