import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Soft rise-in reveal used across the home sections. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  eyebrowEn: string;
  title: string;
  description?: string;
  dark?: boolean;
  action?: ReactNode;
};

/** Consistent luxury section header: gold eyebrow + Latin micro-label + title. */
export default function SectionHeading({
  eyebrow,
  eyebrowEn,
  title,
  description,
  dark = false,
  action,
}: SectionHeadingProps) {
  return (
    <Reveal>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 sm:mb-10">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span
              aria-hidden="true"
              className="h-px w-12 bg-gradient-to-l from-gold-500 to-transparent"
            />
            <span className={`text-sm font-bold ${dark ? 'text-gold-300' : 'text-gold-700'}`}>
              {eyebrow}
            </span>
            <span
              dir="ltr"
              className={`font-display text-[10px] font-medium tracking-[0.34em] ${
                dark ? 'text-white/40' : 'text-[#211a12]/40'
              }`}
            >
              {eyebrowEn}
            </span>
          </div>
          <h2
            className={`mt-4 text-3xl font-extrabold leading-tight sm:text-4xl ${
              dark ? 'text-[#f7f1e5]' : 'text-[#211a12]'
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className={`mt-3 leading-8 ${dark ? 'text-white/60' : 'text-dark-500'}`}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Reveal>
  );
}
