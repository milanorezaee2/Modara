import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';
import { Reveal } from './SectionHeading';

const STORAGE_KEY = 'modara-newsletter-emails';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'error' | 'joined' | 'already';

/** Modara Club newsletter panel (stored locally in the demo backend). */
export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      return;
    }
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as string[];
      if (stored.includes(value)) {
        setStatus('already');
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, value]));
    } catch {
      // Storage may be unavailable; the signup still confirms for the session.
    }
    setStatus('joined');
    setEmail('');
  };

  const done = status === 'joined' || status === 'already';

  return (
    <section className="mx-auto max-w-7xl px-4 pb-4 pt-6 sm:px-6 sm:pt-10 lg:px-8" dir="rtl">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-[#171208] px-6 py-12 text-center text-white sm:p-14">
          {/* Decor */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(213,171,85,0.28),transparent_55%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_40%)]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-gold-400/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full border border-gold-400/10" />
          <p
            aria-hidden="true"
            dir="ltr"
            className="pointer-events-none absolute inset-x-0 -top-3 select-none text-center font-display text-[13vw] font-semibold leading-none tracking-[0.14em] text-transparent sm:text-[7rem]"
            style={{ WebkitTextStroke: '1px rgba(232,201,122,0.07)' }}
          >
            MODARA CLUB
          </p>

          <div className="relative">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/30 bg-gold-500/10 text-gold-300">
              <Mail className="h-6 w-6" />
            </span>
            <p className="mt-5 text-sm font-bold text-gold-300">باشگاه مشتریان مُدارا</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold leading-snug text-balance sm:text-4xl">
              اولین نفر باشید که از کالکشن جدید باخبر می‌شود
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-8 text-white/60">
              عضو باشگاه شوید تا پیشنهادهای ویژهٔ اعضا و تازه‌ترین قطعه‌های هر فصل، زودتر از همه به
              دست شما برسد.
            </p>

            {done ? (
              <div
                role="status"
                className="mx-auto mt-9 flex max-w-xl flex-col items-center gap-3 rounded-3xl border border-gold-400/25 bg-gold-500/10 px-6 py-6"
              >
                <CheckCircle2 className="h-9 w-9 text-gold-300" />
                <p className="text-lg font-extrabold">
                  {status === 'joined'
                    ? 'به باشگاه مشتریان مُدارا خوش آمدید'
                    : 'شما قبلاً عضو باشگاه مُدارا شده‌اید'}
                </p>
                <p className="text-sm leading-7 text-white/60">
                  منتظر خبرهای خوب باشید؛ کالکشن‌های جدید و پیشنهادهای ویژهٔ اعضا را اول برای شما
                  می‌فرستیم.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mx-auto mt-9 max-w-xl">
                <div
                  className={`flex items-center gap-2 rounded-full border bg-white/[0.07] p-1.5 backdrop-blur-md transition-colors ${
                    status === 'error' ? 'border-red-400/60' : 'border-white/15 focus-within:border-gold-400/60'
                  }`}
                >
                  <label htmlFor="newsletter-email" className="sr-only">
                    ایمیل شما
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-left text-[15px] text-white outline-none placeholder:text-white/35"
                  />
                  <button
                    type="submit"
                    className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-gradient-to-l from-gold-300 via-gold-500 to-gold-600 px-6 py-3 text-sm font-extrabold text-[#171208] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgba(192,145,63,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 active:scale-[0.97] sm:px-7"
                  >
                    عضویت در باشگاه
                    <Send className="h-4 w-4 -scale-x-100 transition-transform duration-300 group-hover:-translate-x-0.5" />
                  </button>
                </div>
                {status === 'error' && (
                  <p role="alert" className="mt-3 text-sm font-semibold text-red-300">
                    لطفاً یک ایمیل معتبر وارد کنید.
                  </p>
                )}
                <p className="mt-4 text-xs leading-6 text-white/40">
                  بدون اسپم؛ فقط کالکشن‌های جدید و پیشنهادهای ویژهٔ اعضا. هر زمان خواستید لغو عضویت
                  کنید.
                </p>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
