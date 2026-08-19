'use client';

import { useEffect, useRef } from 'react';

/**
 * usePolling — generic polling utility.
 *
 * Calls `callback` on a repeating `intervalMs` timer.
 * Passing `null` as `intervalMs` stops polling (no-op interval).
 * Cleans up via clearInterval on unmount or when deps change.
 *
 * @param callback  Async function to call on each tick. Should be stable
 *                  (wrap with useCallback) to avoid restarting the interval
 *                  on every render.
 * @param intervalMs  Milliseconds between ticks, or null to disable polling.
 */
export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs: number | null,
): void {
  // Keep a ref to the latest callback so the interval closure is always fresh
  // without needing to restart the interval when callback identity changes.
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (intervalMs === null) return;

    const id = setInterval(() => {
      void callbackRef.current();
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [intervalMs]);
}
