import { ArrowLeft, Gem, HeartHandshake, ShieldCheck } from 'lucide-react';
import { imageSrcSet, optimizedAsset } from '../../lib/format';
import SectionHeading, { Reveal } from './SectionHeading';

type BrandStoryProps = {
  onNavigate: (view: string, param?: string) => void;
};

const values = [
  {
    icon: ShieldCheck,
    title: 'اصالت تضمین‌شده',
    desc: 'تمام محصولات مُدارا اصل و دارای ضمانت اصالت هستند.',
  },
  {
    icon: Gem,
    title: 'گزینش وسواس‌گونه',
    desc: 'هر قطعه پیش از ورود به ویترین، از نظر کیفیت و ماندگاری سنجیده می‌شود.',
  },
  {
    icon: HeartHandshake,
    title: 'تجربه‌ای آرام و مطمئن',
    desc: 'ارسال سریع، پرداخت امن و امکان بازگشت کالا تا ۷ روز پس از تحویل.',
  },
];

const facts = [
  { value: '۶', label: 'دسته‌بندی تخصصی' },
  { value: '۱۰۰٪', label: 'اصالت تضمین‌شده' },
  { value: '۷ روز', label: 'ضمانت بازگشت کالا' },
];

/** Editorial brand-story section for Modara. */
export default function BrandStory({ onNavigate }: BrandStoryProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8" dir="rtl">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Visual */}
        <Reveal className="relative order-1">
          <div aria-hidden="true" className="absolute -inset-0 translate-x-5 translate-y-5 rounded-[2rem] border border-gold-500/35" />
          <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-gold-900/15">
            <img
              src={optimizedAsset('/images/hero-fashion-poster.png', 720)}
              srcSet={imageSrcSet('/images/hero-fashion-poster.png', [720, 1080])}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt="استایل لوکس مشکی و طلایی مُدارا"
              width={720}
              height={406}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#120d08]/35 to-transparent" />
          </div>
          <div className="absolute -bottom-6 right-5 flex items-center gap-3 rounded-2xl border border-white/50 bg-white/85 px-4 py-3 shadow-xl backdrop-blur-md sm:right-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
              <Gem className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[11px] text-dark-400">امضای مُدارا</span>
              <span className="block text-sm font-bold text-dark-900">هر قطعه، با وسواس انتخاب می‌شود</span>
            </span>
          </div>
        </Reveal>

        {/* Copy */}
        <div className="order-2 pt-4 lg:pt-0">
          <SectionHeading
            eyebrow="داستان مُدارا"
            eyebrowEn="OUR STORY"
            title="جایی که ظرافت، به عادت تبدیل می‌شود"
          />
          <Reveal delay={0.08}>
            <div className="-mt-2 space-y-5 leading-9 text-dark-500">
              <p>
                مُدارا با یک باور ساده شکل گرفت: استایل خوب، حاصل انتخاب‌های درست و ماندگار است؛ نه
                انبوهی از خریدهای گذرا. به همین دلیل ویترین ما کوچک اما دقیق است؛ تازه‌ترین لباس‌ها،
                اکسسوری‌ها و ساعت‌های لوکس، با اصالتی که تضمینش می‌کنیم.
              </p>
              <p>
                ما خودمان را «فروشگاه» نمی‌دانیم؛ مُدارا بوتیکی است که در آن هر قطعه پیش از رسیدن به
                شما، باید از فیلتر سلیقهٔ ما بگذرد تا در کمدتان جایی همیشگی پیدا کند.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 space-y-5">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={0.06 * i}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/30 bg-gold-50 text-gold-700">
                    <value.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-dark-900">{value.title}</span>
                    <span className="mt-1 block text-sm leading-7 text-dark-500">{value.desc}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 grid max-w-md grid-cols-3 border-t border-[#211a12]/10 pt-6">
              {facts.map((fact, i) => (
                <div key={fact.label} className={i > 0 ? 'border-r border-[#211a12]/10 pr-5' : ''}>
                  <p className="text-xl font-extrabold leading-none text-[#211a12] lg:text-2xl">{fact.value}</p>
                  <p className="mt-2 text-xs text-dark-400">{fact.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="group inline-flex items-center gap-3 rounded-full bg-[#171208] py-2 pe-2 ps-7 text-sm font-bold text-[#f7efdc] shadow-[0_18px_40px_-16px_rgba(23,18,11,0.5)] transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:ps-8 sm:text-base"
              >
                آشنایی با کالکشن‌ها
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-[#171208] transition-colors duration-300 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 sm:h-5 sm:w-5" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('blog')}
                className="inline-flex items-center justify-center rounded-full border border-[#211a12]/20 bg-white/60 px-7 py-3.5 text-sm font-bold text-[#211a12] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-600/70 hover:bg-gold-500/10 hover:text-gold-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 active:scale-[0.97] sm:px-8 sm:text-base"
              >
                مجلهٔ استایل مُدارا
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
