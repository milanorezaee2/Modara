import { useEffect, useMemo, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import {
  getFeaturedReviews,
  getReviewRatings,
  type ReviewPreview,
} from '../../lib/catalog';
import SectionHeading, { Reveal } from './SectionHeading';

type TestimonialsProps = {
  onNavigate: (view: string, param?: string) => void;
};

const faNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

/** Picks a diverse set of the best real customer reviews. */
function pickReviews(reviews: ReviewPreview[]): ReviewPreview[] {
  const usable = reviews.filter((r) => r.comment && r.comment.trim().length >= 18);
  const seenProducts = new Set<string>();
  const picked: ReviewPreview[] = [];
  for (const minRating of [5, 4]) {
    for (const review of usable) {
      if (picked.length >= 6) break;
      if (review.rating < minRating || seenProducts.has(review.product_id)) continue;
      seenProducts.add(review.product_id);
      picked.push(review);
    }
  }
  return picked;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`امتیاز ${faNumber(rating)} از ۵`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-gold-400 text-gold-400' : 'text-white/25'}`}
        />
      ))}
    </span>
  );
}

/** Dark luxury testimonials section, powered by real product reviews. */
export default function Testimonials({ onNavigate }: TestimonialsProps) {
  const [reviews, setReviews] = useState<ReviewPreview[]>([]);
  const [ratings, setRatings] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Candidate reviews carry only the product fields shown here. A separate
    // rating-only query preserves the exact review count/average without
    // downloading hundreds of comments or the entire product catalogue.
    Promise.all([getFeaturedReviews(60), getReviewRatings(1000)]).then(
      ([featuredReviews, allRatings]) => {
        if (cancelled) return;
        setReviews(featuredReviews);
        setRatings(allRatings);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const picked = useMemo(() => pickReviews(reviews), [reviews]);
  const average = useMemo(
    () => (ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0),
    [ratings],
  );

  return (
    <section className="relative overflow-hidden bg-[#14100c] py-16 sm:py-24" dir="rtl">
      {/* Decor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(192,145,63,0.16),transparent_38%),radial-gradient(circle_at_88%_90%,rgba(192,145,63,0.10),transparent_42%)]"
      />
      <div
        aria-hidden="true"
        dir="ltr"
        className="pointer-events-none absolute -top-8 left-0 select-none font-display text-[16vw] font-semibold leading-none tracking-[0.06em] text-transparent opacity-[0.55]"
        style={{ WebkitTextStroke: '1px rgba(232,201,122,0.10)' }}
      >
        MODARA
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          dark
          eyebrow="حرف‌های مشتریان ما"
          eyebrowEn="TESTIMONIALS"
          title="اعتماد، باارزش‌ترین دارایی مُداراست"
          description="این‌ها نظرهای واقعی خریداران محصولات ماست؛ همان‌هایی که همین حالا در صفحهٔ هر محصول می‌بینید."
          action={
            !loading && ratings.length > 0 ? (
              <div className="flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
                <span className="text-2xl font-extrabold leading-none text-white">
                  {faNumber(Math.round(average * 10) / 10, 1)}
                </span>
                <span>
                  <Stars rating={Math.round(average)} />
                  <span className="mt-1 block text-[11px] text-white/50">
                    میانگین امتیاز از {faNumber(ratings.length)} نظر
                  </span>
                </span>
              </div>
            ) : undefined
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {loading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 h-4 w-24 animate-pulse rounded bg-white/10" />
                  <div className="mb-2 h-3.5 w-full animate-pulse rounded bg-white/10" />
                  <div className="mb-2 h-3.5 w-5/6 animate-pulse rounded bg-white/10" />
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/10" />
                </div>
              ))
            : picked.map((review, i) => {
                const product = review.product;
                return (
                  <Reveal key={review.id} delay={0.07 * i} className="h-full">
                    <figure className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-gold-400/30 sm:p-7">
                      <div className="flex items-center justify-between">
                        <Stars rating={review.rating} />
                        <Quote aria-hidden="true" className="h-6 w-6 text-gold-500/50" />
                      </div>
                      <blockquote className="mt-4 flex-1 leading-8 text-white/80">
                        {review.comment}
                      </blockquote>
                      <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-base font-extrabold text-gold-300 ring-1 ring-gold-400/25"
                        >
                          {review.name?.trim().charAt(0) || 'م'}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-white">
                            {review.name}
                          </span>
                          {product && (
                            <button
                              type="button"
                              onClick={() => onNavigate('product', product.slug)}
                              className="mt-0.5 block max-w-full truncate text-xs text-gold-300/80 transition-colors hover:text-gold-200"
                            >
                              خریدار {product.name}
                            </button>
                          )}
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                );
              })}
        </div>
      </div>
    </section>
  );
}
