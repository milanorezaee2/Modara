import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type DeferredMountProps = {
  children: ReactNode;
  /** Approximate reserved height keeps page length stable before mounting. */
  minHeight?: CSSProperties['minHeight'];
  rootMargin?: string;
  className?: string;
};

/**
 * Mounts below-the-fold content shortly before it reaches the viewport. This
 * keeps its data requests, image decoding and JavaScript effects out of the
 * critical first-render path without changing the final page structure.
 */
export default function DeferredMount({
  children,
  minHeight = 420,
  rootMargin = '900px 0px',
  className,
}: DeferredMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
