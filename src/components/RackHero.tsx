import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getClothingProducts } from '../lib/catalog';
import type { Product } from '../lib/supabase';
import { asset } from '../lib/format';
import { hangerFor, sideFor } from '../lib/hangerGarments';

type RackHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type RackItem = {
  id: string;
  /** Product page target. */
  slug: string;
  /** Accessible name. */
  name: string;
  /** What hangs on the rail: the profile when it has been shot. */
  image: string;
  /** Average fabric colour — used only for the glow behind the rack. */
  hex: string;
  /** width / height of `image`. */
  aspect: number;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const PIECE_HEIGHT = 'clamp(200px, 27vh, 288px)';
const PIECE_GAP = 4;

export default function RackHero({ onNavigate }: RackHeroProps) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const [items, setItems] = useState<RackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const suppressClick = useRef(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modara:hero-theme', { detail: 'light' }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getClothingProducts()
      .then((products: Product[]) => {
        if (cancelled) return;
        /* Every piece hangs as its real profile — nothing is faked by rotation. */
        const hanging = products
          .map((product) => {
            const garment = sideFor(product.slug) ?? hangerFor(product.slug);
            if (!garment) return null;
            return {
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: garment.image,
              hex: garment.hex,
              aspect: garment.aspect,
            } satisfies RackItem;
          })
          .filter((item): item is RackItem => item !== null);
        setItems(hanging);
        setActiveId((current) => current ?? hanging[0]?.id ?? null);
      })
      .catch(() => {
        /* the rack simply stays empty instead of breaking the page */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeIndex = items.findIndex((item) => item.id === activeId);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : (items[0] ?? null);

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
  }, [updateScrollHints, items.length]);

  /** Keep the active piece inside the visible part of the rail. */
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
    if (items.length < 2) return;
    const from = activeIndex < 0 ? 0 : activeIndex;
    const next = items[(from + step + items.length) % items.length];
    setActiveId(next.id);
    revealPiece(next.id);
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
    } else if (event.key === 'Home' && items[0]) {
      event.preventDefault();
      setActiveId(items[0].id);
      revealPiece(items[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = items[items.length - 1];
      if (last) {
        setActiveId(last.id);
        revealPiece(last.id);
      }
    }
  };

  /* Dragging the rail: pieces lean like real hangers being pushed, then settle. */
  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== 'mouse') return;
    const track = trackRef.current;
    if (!track) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startLeft: track.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    if (!track || !drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    track.scrollLeft = drag.current.startLeft - delta;
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    suppressClick.current = drag.current.moved;
    drag.current.active = false;
  };

  return (
    <section
      aria-label="رگال لباس مُدارا"
      className="relative isolate overflow-hidden bg-[#efeae1] pb-10 pt-24 sm:pb-12 sm:pt-28"
    >
      {/* Studio light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 92% at 50% -12%, #fdfaf5 0%, #f5f0e7 42%, #ece6db 74%, #e3dccd 100%)',
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ backgroundColor: activeItem ? `${activeItem.hex}42` : 'rgba(176,132,64,0.2)' }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE }}
        className="pointer-events-none absolute left-1/2 top-32 -z-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-16 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.92),transparent_70%)] blur-2xl"
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
            <span>{loading ? 'در حال چیدن…' : `${new Intl.NumberFormat('fa-IR').format(items.length)} قطعه`}</span>
            <span className="h-px w-8 bg-[#bda77c] sm:w-12" aria-hidden="true" />
          </div>

          <h1 className="mt-5 text-balance text-[clamp(1.6rem,4.4vw,3.05rem)] font-extrabold leading-[1.3] text-[#241d14]">
            همه‌ی لباس‌ها، از بغل روی یک رگال
            <span className="mt-1 block text-[#8b6f3e] sm:mt-2">
              همان‌طور که در بوتیک چیده می‌شوند؛ هر قطعه که جلو بیاید، کمی از ریل بلند می‌شود
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-balance text-[13px] leading-6 text-[#6b6152] sm:text-sm sm:leading-7">
            کت، ترنچ‌کت، هودی و بافت‌ها؛ عکسِ واقعیِ هر لباس در حالت آویزان و از بغل، همان‌طور
            که پارچه روی جالباسی می‌افتد. روی هر قطعه بایستید تا بزرگ‌تر و روشن‌تر شود.
          </p>
        </motion.div>

        {/* The rail, and the garments on it */}
        <div className="relative mt-10 sm:mt-12">
          <div
            className="pointer-events-none absolute inset-x-0 top-[6px] z-20 h-[16px]"
            aria-hidden="true"
          >
            <div className="absolute inset-x-0 top-[6px] h-[3px] rounded-full bg-[linear-gradient(90deg,#cdb68c_0%,#b1946a_16%,#e7d5b0_38%,#9d8050_60%,#dcc7a0_82%,#c3aa7c_100%)] shadow-[0_1px_0_rgba(255,255,255,0.55)_inset,0_2px_4px_rgba(72,52,26,0.22)]" />
            <div className="absolute inset-x-0 top-[9px] h-[6px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(84,62,32,0.18),transparent_72%)] blur-[2px]" />
            <span className="absolute -top-[3px] left-[1.5%] h-[22px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f6ecd6,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.2)]" />
            <span className="absolute -top-[3px] right-[1.5%] h-[22px] w-[5px] rounded-full bg-[linear-gradient(180deg,#f6ecd6,#a98c5c)] shadow-[0_2px_6px_rgba(72,52,26,0.2)]" />
          </div>

          <ul
            ref={trackRef}
            aria-label="لباس‌های مُدارا روی رگال"
            onKeyDown={onRackKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
            onClickCapture={(event) => {
              /* a drag must not open a product page */
              if (!suppressClick.current) return;
              suppressClick.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
            className="scrollbar-hide -mx-4 flex cursor-grab select-none items-start overflow-x-auto px-4 pb-2 pt-0 active:cursor-grabbing sm:mx-0 sm:px-0"
            style={{ '--piece-h': PIECE_HEIGHT } as CSSProperties}
          >
            {loading &&
              Array.from({ length: 17 }).map((_, index) => (
                <li
                  key={`skeleton-${index}`}
                  aria-hidden="true"
                  className="shrink-0 animate-pulse rounded-[10px] bg-[#ded6c8]"
                  style={{
                    width: `calc(var(--piece-h) * ${index < 9 ? 0.26 : 0.62})`,
                    height: PIECE_HEIGHT,
                    marginInlineStart: index === 0 ? 0 : PIECE_GAP,
                  }}
                />
              ))}

            {!loading &&
              items.map((item, index) => {
                const isActive = item.id === activeItem?.id;
                const slotWidth = `calc(var(--piece-h) * ${item.aspect} + 8px)`;

                return (
                  <li
                    key={item.id}
                    data-piece={item.id}
                    className="rack-drop relative shrink-0"
                    style={{
                      width: slotWidth,
                      height: PIECE_HEIGHT,
                      marginInlineStart: index === 0 ? 0 : PIECE_GAP,
                      animationDelay: `${index * 65}ms`,
                      zIndex: isActive ? 30 : 1,
                    }}
                  >
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={item.name}
                      onMouseEnter={() => setActiveId(item.id)}
                      onFocus={() => setActiveId(item.id)}
                      onClick={() => {
                        setActiveId(item.id);
                        onNavigate('product', item.slug);
                      }}
                      className="group/piece absolute inset-y-0 start-1/2 block -translate-x-1/2 outline-none"
                      style={{ width: `calc(var(--piece-h) * ${item.aspect})` }}
                    >
                      {/* soft glow of the garment's own colour */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute -inset-x-6 -top-3 bottom-0 -z-10 rounded-[999px] bg-[radial-gradient(ellipse_at_50%_32%,rgba(255,250,238,0.98),rgba(255,240,212,0.4)_56%,transparent_74%)] blur-md transition-opacity duration-500 ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />

                      {/* the garment: profile photo, or turned away when it has none */}
                      <span
                        className="rack-sway absolute inset-0 block"
                        style={
                          {
                            '--rack-sway-delay': `${(index % 7) * 0.55}s`,
                            '--rack-sway-duration': `${6.4 + (index % 5) * 0.85}s`,
                          } as CSSProperties
                        }
                      >
                        <span
                          className={`absolute inset-0 block origin-top transition-transform duration-500 ease-out ${
                            isActive ? '-translate-y-1.5 scale-[1.03]' : ''
                          }`}
                        >
                          <img
                            src={asset(item.image)}
                            alt=""
                            aria-hidden="true"
                            loading={index < 17 ? 'eager' : 'lazy'}
                            decoding="async"
                            draggable={false}
                            className={`h-full w-full select-none object-contain object-top transition-[filter] duration-500 ${
                              isActive
                                ? 'drop-shadow-[0_30px_30px_rgba(56,42,22,0.3)]'
                                : 'drop-shadow-[0_16px_18px_rgba(56,42,22,0.2)]'
                            }`}
                          />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>

          {/* edge fades keep the rail reading as a long rack */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-[linear-gradient(270deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 ${
              hasScrolled ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-[linear-gradient(90deg,#efeae1,rgba(239,234,225,0))] transition-opacity duration-300 ${
              canScrollMore ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* rack controls */}
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
                  ? `قطعهٔ ${new Intl.NumberFormat('fa-IR').format(activeIndex + 1)} از ${new Intl.NumberFormat('fa-IR').format(items.length)}`
                  : 'رگال در حال چیدن است'}
              </span>
              <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#d8cbb2]">
                <span
                  className="absolute inset-y-0 right-0 rounded-full bg-[#a3783a] transition-[width] duration-500"
                  style={{
                    width: `${
                      items.length > 1
                        ? Math.max(4, ((activeIndex + 1) / items.length) * 100)
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
