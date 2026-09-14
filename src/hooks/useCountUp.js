import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp - animates a number from its previous value to `target` over
 * `duration` ms using requestAnimationFrame. Returns the raw interpolated
 * number (not a formatted string) so callers can run it through their own
 * formatter (e.g. formatCurrency) every frame instead of animating text.
 */
export const useCountUp = (target, { duration = 800 } = {}) => {
  const [value, setValue] = useState(target || 0);
  const fromRef = useRef(value);
  const frameRef = useRef(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const targetNumber = Number.isFinite(target) ? target : 0;

    if (prefersReducedMotion.current) {
      setValue(targetNumber);
      return undefined;
    }

    const from = fromRef.current;
    const delta = targetNumber - from;
    const start = performance.now();

    if (delta === 0) return undefined;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + delta * eased;
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = targetNumber;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = targetNumber;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- duration intentionally not a dependency, only target restarts the animation
  }, [target]);

  return value;
};

export default useCountUp;
