"use client";

import { useEffect, useState } from "react";

/**
 * Current time in ms, available only after the page has loaded in the browser.
 * Returns null during server rendering so `next build` can prerender safely.
 */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  return now;
}
