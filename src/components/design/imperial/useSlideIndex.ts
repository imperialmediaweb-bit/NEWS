'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { wrapIndex } from './wrapIndex';

export interface SlideIndexApi {
  index: number;
  /** +1 for forward, -1 for backward (set on the last navigation). */
  direction: 1 | -1;
  goTo: (next: number, direction?: 1 | -1) => void;
  next: () => void;
  prev: () => void;
  canNext: boolean;
  canPrev: boolean;
}

/** Index state machine shared by every slider. Rejects navigation while locked. */
export function useSlideIndex(
  length: number,
  {
    initialIndex = 0,
    loop = true,
    onChange,
    isLocked,
  }: {
    initialIndex?: number;
    loop?: boolean;
    onChange?: (index: number) => void;
    /** Return true while a transition is running to drop extra navigation. */
    isLocked?: () => boolean;
  },
): SlideIndexApi {
  const [index, setIndex] = useState(() => wrapIndex(initialIndex, length, false));
  const [direction, setDirection] = useState<1 | -1>(1);
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const goTo = useCallback(
    (next: number, dir?: 1 | -1) => {
      if (isLocked?.()) return;
      const target = wrapIndex(next, length, loop);
      if (target === indexRef.current) return;
      setDirection(dir ?? (target > indexRef.current ? 1 : -1));
      setIndex(target);
      indexRef.current = target;
      onChange?.(target);
    },
    [length, loop, onChange, isLocked],
  );

  const nextSlide = useCallback(() => goTo(indexRef.current + 1, 1), [goTo]);
  const prevSlide = useCallback(() => goTo(indexRef.current - 1, -1), [goTo]);

  return {
    index,
    direction,
    goTo,
    next: nextSlide,
    prev: prevSlide,
    canNext: loop || index < length - 1,
    canPrev: loop || index > 0,
  };
}
