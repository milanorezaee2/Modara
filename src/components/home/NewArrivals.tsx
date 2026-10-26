import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../lib/supabase';
import { getNewestProducts } from '../../lib/catalog';
import ProductCard from '../ProductCard';
import SectionHeading, { Reveal } from './SectionHeading';

type NewArrivalsProps = {
  onNavigate: (view: string, param?: string) => void;
};

/** Horizontally scrolling rail of the newest products (by created_at). */
export default function NewArrivals({ onNavigate }: NewArrivalsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNewestProducts(10).then((data) => {
      if (cancelled) return;
      setProducts(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollRail = (direction: 'next' | 'prev') => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.round(rail.clientWidth * 0.75);
    // In RTL the viewport moves towards decreasing scrollLeft to go forward.
    rail.scrollBy({ left: direction === 'next' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8" dir="rtl">
      <SectionHeading
        eyebrow="تازه رسیده‌ها"
        eyebrowEn="NEW ARRIVALS"
        title="جدیدترین‌های مُدارا"
        description="آخرین قطعه‌هایی که به ویترین ما اضافه شده‌اند؛ پیش از آن‌که تمام شوند، کشفشان کنید."
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => scrollRail('prev')}
              aria-label="محصولات قبلی"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#211a12]/15 bg-white text-[#211a12] transition-all duration-300 hover:border-gold-600 hover:bg-gold-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollRail('next')}
              aria-label="محصولات بعدی"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#211a12]/15 bg-white text-[#211a12] transition-all duration-300 hover:border-gold-600 hover:bg-gold-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="group mr-2 hidden items-center gap-2 text-sm font-bold text-gold-700 transition-colors hover:text-gold-800 sm:inline-flex"
            >
              مشاهده فروشگاه
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        }
      />

      <Reveal>
        <div
          ref={railRef}
          className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[240px] shrink-0 rounded-2xl border border-dark-100 bg-white p-4 sm:w-[280px]"
                >
                  <div className="shimmer-bg mb-4 aspect-[3/4] rounded-xl" />
                  <div className="shimmer-bg mb-2 h-4 w-3/4 rounded" />
                  <div className="shimmer-bg h-4 w-1/2 rounded" />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className="w-[240px] shrink-0 snap-start sm:w-[280px]">
                  <ProductCard product={product} onView={(slug) => onNavigate('product', slug)} />
                </div>
              ))}
        </div>
      </Reveal>
    </section>
  );
}
