const items = [
  'ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان',
  'ضمانت اصالت کالا',
  'بازگشت کالا تا ۷ روز پس از تحویل',
  'پرداخت امن آنلاین',
  'کالکشن پاییز ـ زمستان ۱۴۰۵ رسید',
  'تخفیف ویژه برای اعضای مُدارا',
];

function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={item} className="flex items-center whitespace-nowrap">
          <span dir="rtl" className="px-6 text-[13px] font-semibold tracking-wide">
            {item}
          </span>
          <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
        </span>
      ))}
      <span className="flex items-center whitespace-nowrap">
        <span dir="ltr" className="px-6 font-display text-[11px] font-semibold tracking-[0.42em] text-gold-400">
          MODARA
        </span>
        <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-gold-500" />
      </span>
    </div>
  );
}

/** Slim luxury marquee strip shown directly beneath the hero. */
export default function TrustMarquee() {
  return (
    <section
      aria-label="مزایای خرید از مُدارا"
      className="overflow-hidden border-y border-gold-500/20 bg-[#14100c] py-3.5 text-[#e9dcc0]"
    >
      <div
        dir="ltr"
        className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
      >
        <MarqueeRow />
        <MarqueeRow ariaHidden />
      </div>
    </section>
  );
}
