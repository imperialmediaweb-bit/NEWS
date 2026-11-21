'use client';

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface DragState {
  /** Current drag delta along the configured axis in px (0 when idle). */
  deltaX: number;
  dragging: boolean;
}

export interface UseDragNavigationOptions {
  /** Pixels to travel before a swipe is committed. Default 60. */
  threshold?: number;
  /** Velocity (px/ms) that commits a swipe regardless of distance. Default 0.5. */
  velocityThreshold?: number;
  onSwipe: (direction: 1 | -1) => void;
  disabled?: boolean;
  /** Axis to track. Default "x". */
  axis?: 'x' | 'y';
  /** Called on every move while dragging (for live feedback). */
  onMove?: (delta: number) => void;
}

/**
 * Pointer-based horizontal swipe detection (mouse, touch, pen) using Pointer Events.
 * Returns bind props for the draggable surface and the live drag state for feedback.
 */
export function useDragNavigation({
  threshold = 60,
  velocityThreshold = 0.5,
  onSwipe,
  disabled = false,
  axis = 'x',
  onMove,
}: UseDragNavigationOptions) {
  const [state, setState] = useState<DragState>({ deltaX: 0, dragging: false });
  const start = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const axisLocked = useRef<'x' | 'y' | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled || e.button !== 0) return;
      start.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      axisLocked.current = null;
    },
    [disabled],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (!axisLocked.current) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axisLocked.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axisLocked.current === axis) e.currentTarget.setPointerCapture(e.pointerId);
      }
      if (axisLocked.current !== axis) return;
      const delta = axis === 'x' ? dx : dy;
      onMove?.(delta);
      setState({ deltaX: delta, dragging: true });
    },
    [axis, onMove],
  );

  const finish = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      start.current = null;
      if (axisLocked.current === axis) {
        const delta = axis === 'x' ? e.clientX - s.x : e.clientY - s.y;
        const dt = Math.max(1, performance.now() - s.t);
        const velocity = Math.abs(delta) / dt;
        if (Math.abs(delta) > threshold || velocity > velocityThreshold) {
          onSwipe(delta < 0 ? 1 : -1);
        }
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
      }
      axisLocked.current = null;
      setState({ deltaX: 0, dragging: false });
    },
    [onSwipe, threshold, velocityThreshold, axis],
  );

  return {
    state,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      style: { touchAction: axis === 'x' ? ('pan-y' as const) : ('pan-x' as const) },
    },
  };
}
