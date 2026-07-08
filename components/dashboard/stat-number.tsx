"use client";

import { useEffect, useRef } from "react";

/* Count-up numeral for the ruled stat strip. Writes straight to the DOM node
   (no per-frame React state), eases out over 700ms, renders the final value
   immediately under prefers-reduced-motion. */
export function StatNumber({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    const t0 = performance.now();
    const duration = 700;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(value * eased)}${suffix}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, suffix]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
