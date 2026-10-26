/**
 * Lightweight static backdrop. The previous version animated several huge
 * blurred/backdrop-filtered layers over the whole viewport, which forced the
 * browser to repaint them continuously while scrolling. These layered CSS
 * gradients keep the same warm ivory/gold atmosphere at near-zero runtime cost.
 */
export default function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#faf8f5]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 55% 42% at 72% -6%, rgba(245,158,11,0.10), transparent 68%)',
            'radial-gradient(ellipse 48% 38% at 8% 48%, rgba(251,146,60,0.07), transparent 68%)',
            'radial-gradient(ellipse 52% 40% at 84% 82%, rgba(217,119,6,0.06), transparent 70%)',
            'linear-gradient(180deg, #faf8f5 0%, #f7f5f1 28%, #f8f6f2 62%, #faf8f5 100%)',
          ].join(','),
        }}
      />

      {/* Quiet geometric accents, rendered once as simple bordered gradients. */}
      <div className="absolute left-[8%] top-[12%] h-44 w-44 rounded-[40%] border border-amber-200/25 bg-gradient-to-br from-amber-400/[0.05] to-orange-400/[0.02]" />
      <div className="absolute left-[76%] top-[58%] h-52 w-52 rounded-[40%] border border-amber-200/20 bg-gradient-to-br from-amber-500/[0.04] to-orange-400/[0.015]" />
      <div className="absolute left-[52%] top-[30%] h-32 w-32 rounded-[40%] border border-amber-200/15 bg-gradient-to-br from-amber-400/[0.035] to-transparent" />

      {/* Subtle perspective floor; a single transformed layer, no animation. */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[38vh] opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,36,53,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(30,36,53,0.55) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          transform: 'perspective(420px) rotateX(60deg)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, black 0%, transparent 82%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 82%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 52%, rgba(15,19,32,0.035) 100%)',
        }}
      />
    </div>
  );
}
