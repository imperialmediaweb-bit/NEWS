'use client';

import { useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface UseKeyboardNavigationOptions {
  next: () => void;
  prev: () => void;
  first?: () => void;
  last?: () => void;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

/** Arrow / Home / End keyboard handling for carousel regions. */
export function useKeyboardNavigation({
  next,
  prev,
  first,
  last,
  orientation = 'horizontal',
  disabled,
}: UseKeyboardNavigationOptions) {
  return useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      const backward = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      switch (e.key) {
        case forward:
          e.preventDefault();
          next();
          break;
        case backward:
          e.preventDefault();
          prev();
          break;
        case 'Home':
          if (first) {
            e.preventDefault();
            first();
          }
          break;
        case 'End':
          if (last) {
            e.preventDefault();
            last();
          }
          break;
      }
    },
    [next, prev, first, last, orientation, disabled],
  );
}
