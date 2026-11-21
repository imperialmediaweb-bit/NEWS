'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageVisibility } from './motion';

export interface UseAutoplayOptions {
  enabled: boolean;
  interval: number;
  onTick: () => void;
  /** Restart the timer whenever this value changes (e.g. the active index). */
  resetKey: unknown;
}

export interface AutoplayApi {
  /** True when autoplay is enabled and not paused by the user. */
  playing: boolean;
  /** True while temporarily suspended (hover, focus, hidden tab). */
  suspended: boolean;
  toggle: () => void;
  pause: () => void;
  play: () => void;
  suspend: () => void;
  resume: () => void;
}

/**
 * Autoplay timer that pauses on hover/focus (via suspend/resume), in hidden tabs,
 * and exposes a user-facing play/pause toggle (WCAG 2.2.2).
 */
export function useAutoplay({
  enabled,
  interval,
  onTick,
  resetKey,
}: UseAutoplayOptions): AutoplayApi {
  const [userPaused, setUserPaused] = useState(false);
  const [suspendCount, setSuspendCount] = useState(0);
  const visible = usePageVisibility();
  const tickRef = useRef(onTick);
  useEffect(() => {
    tickRef.current = onTick;
  }, [onTick]);

  const playing = enabled && !userPaused;
  const suspended = suspendCount > 0 || !visible;
  const active = playing && !suspended;

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => tickRef.current(), interval);
    return () => window.clearTimeout(id);
  }, [active, interval, resetKey]);

  const suspend = useCallback(() => setSuspendCount((c) => c + 1), []);
  const resume = useCallback(() => setSuspendCount((c) => Math.max(0, c - 1)), []);

  return {
    playing,
    suspended,
    toggle: useCallback(() => setUserPaused((p) => !p), []),
    pause: useCallback(() => setUserPaused(true), []),
    play: useCallback(() => setUserPaused(false), []),
    suspend,
    resume,
  };
}
