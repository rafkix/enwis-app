"use client";

import { useEffect, useState } from "react";

/**
 * True when the viewport is narrower than `breakpoint` (default 768px,
 * Tailwind's `md`). Used to switch regular web (non-Telegram) between the
 * desktop/tablet sidebar layout and the mobile bottom-nav layout.
 *
 * Starts as `false` (desktop-first) so SSR/first paint has no sidebar
 * flash, then syncs to the real width on mount and on resize.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
