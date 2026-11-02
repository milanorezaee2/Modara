import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { getClothingProducts } from '../lib/catalog';
import type { Product } from '../lib/supabase';
import { asset } from '../lib/format';
import { hangerFor } from '../lib/hangerGarments';

type RackHeroProps = {
  onNavigate: (view: string, param?: string) => void;
};

type RackItem = {
  id: string;
  /** Product page target. */
  slug: string;
  /** Accessible name. */
  name: string;
  /** The garment itself, on its wooden hanger. */
  image: string;
  /** Average fabric colour — used only for the soft glow behind the rack. */
  hex: string;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
/** The cut-outs are all 520px tall; the rail shows them at this height. */
const PIECE_HEIGHT = 'clamp(210px, 30vh, 300px)';

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/** A thin brass rail, with wall plates at both ends. Nothing else. */
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

/**
 * The home rack: the clothing line, nothing else. Every garment hangs as
 * itself — a transparent cut-out on a wooden hanger — and each one opens its
 * own product page. No stage, no filters, no labels, no prices, no counters.
 */
export default function RackHero({ onNavigate }: RackHeroProps) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLUListElement>(null);
  const [items, setItems] = useState<RackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modara:hero-theme', { detail: 'light' }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getClothingProducts()
      .then((products: Product[]) => {
        if (cancelled) return;
        const hanging = products
          .map((product) => {
            const garment = hangerFor(product.slug);
            if (!garment) return null;
            return {
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: garment.image,
              hex: garment.hex,
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
  const activeGlow = activeItem ? withAlpha(activeItem.hex, 0.26) : 'rgba(176,132,64,0.2)';

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

  return (
    <section
      aria-label="رگال لباس مُدارا"
      className="relative isolate overflow-hidden bg-[#efeae1] pt-20 sm:pt-24"
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
        animate={{ backgroundColor: activeGlow }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE }}
        className="pointer-events-none absolute left-1/2 top-20 -z-10 h-[380px] w-[680px] -translate-x-1/2 rounded-full blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />

      {/* The rail, and the garments on it. Nothing else. */}
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-12 sm:px-8 sm:pb-14">
        <div className="relative">
          <RailBar />

          <ul
            ref={trackRef}
            aria-label="لباس‌های مُدارا روی رگال"
            className="scrollbar-hide -mx-4 flex items-start gap-0 overflow-x-auto px-4 pb-2 pt-0 sm:mx-0 sm:px-0"
          >
            {loading &&
              Array.from({ length: 12 }).map((_, index) => (
                <li
                  key={`skeleton-${index}`}
                  aria-hidden="true"
                  className="shrink-0 animate-pulse rounded-[16px] bg-[#ded6c8] first:ms-0 ms-[4px] sm:ms-[10px]"
                  style={{ width: 'clamp(96px, 9vw, 150px)', height: PIECE_HEIGHT }}
                />
              ))}

            {!loading &&
              items.map((item, index) => {
                const isActive = item.id === activeItem?.id;

                return (
                  <li
                    key={item.id}
                    className="relative shrink-0 first:ms-0 ms-[2px] sm:ms-[6px]"
                    style={{ zIndex: isActive ? 30 : 1 }}
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
                      className="group/piece relative flex items-start outline-none"
                    >
                      {/* the only thing a hover adds: a soft glow behind the garment */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute -inset-x-6 -top-4 bottom-0 -z-10 rounded-[999px] bg-[radial-gradient(ellipse_at_50%_32%,rgba(255,250,238,0.98),rgba(255,240,212,0.42)_56%,transparent_74%)] blur-md transition-opacity duration-500 ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />

                      {/* the garment itself, on its wooden hanger, hung from the rail */}
                      <img
                        src={asset(item.image)}
                        alt=""
                        aria-hidden="true"
                        loading={index < 12 ? 'eager' : 'lazy'}
                        decoding="async"
                        draggable={false}
                        className={`w-auto max-w-none select-none object-contain object-top transition-[transform,filter,opacity] duration-500 ease-out ${
                          isActive
                            ? '-translate-y-[5px] opacity-100 drop-shadow-[0_30px_30px_rgba(56,42,22,0.3)]'
                            : 'opacity-[0.96] drop-shadow-[0_18px_20px_rgba(56,42,22,0.2)] group-hover/piece:-translate-y-[3px] group-hover/piece:opacity-100'
                        }`}
                        style={{ height: PIECE_HEIGHT }}
                      />
                    </button>
                  </li>
                );
              })}
          </ul>

          {/* edge fades keep the rail reading as a long rack, not a carousel */}
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
        </div>
      </div>
    </section>
  );
}
