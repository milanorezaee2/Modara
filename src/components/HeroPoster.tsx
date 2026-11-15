import { useEffect } from 'react';
import { asset } from '../lib/format';

/**
 * Instant, dependency-free stand-in for the 3D vitrine.
 * It paints the first frame of the maison stage while the three.js chunk
 * downloads, so the hero never shows an empty box.
 */
export default function HeroPoster() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modara:hero-theme', { detail: 'dark' }));
  }, []);

  return (
    <section
      dir="rtl"
      aria-label="در حال آماده‌سازی ویترین سه‌بعدی مُدارا"
      aria-busy="true"
      className="relative isolate overflow-hidden"
      style={{ minHeight: '100svh', backgroundColor: '#080605' }}
    >
      <img
        src={asset('/images/hero-atelier/look-minimal.jpg')}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        style={{ objectPosition: '26% 48%', filter: 'brightness(.72) saturate(.9)' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(270deg, rgba(8,7,6,.94) 0%, rgba(9,8,6,.75) 32%, rgba(10,8,6,.25) 60%, rgba(8,7,6,.9) 100%)',
        }}
      />
      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-end gap-4 px-6 pb-24">
        <span
          dir="ltr"
          className="font-display text-[10px] font-semibold uppercase tracking-[0.42em]"
          style={{ color: 'rgba(237,218,166,.85)' }}
        >
          Modara Maison · 3D
        </span>
        <span
          className="h-px w-24 overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,.14)' }}
        >
          <span
            className="block h-px w-1/2 animate-pulse"
            style={{ backgroundImage: 'linear-gradient(to left, #e2c279, transparent)' }}
          />
        </span>
      </div>
    </section>
  );
}
