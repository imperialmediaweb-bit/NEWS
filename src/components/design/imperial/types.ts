import type { ReactNode } from 'react';
import type { EasingName } from './motion';
import type { ReducedMotionMode } from './motion';

/** Image rendering escape hatch so apps can plug in `next/image`. */
export type RenderImage = (props: {
  src: string;
  alt: string;
  className?: string;
  /** `true` for the initially visible slide (load eagerly). */
  priority: boolean;
  onLoad: () => void;
}) => ReactNode;

export interface SliderCommonProps {
  /** Start on this slide (0-based). */
  initialIndex?: number;
  /** Wrap around at the ends. Default true. */
  loop?: boolean;
  /** Advance automatically. Default false. */
  autoplay?: boolean;
  /** Autoplay interval in milliseconds. Default 6000. */
  interval?: number;
  /** Transition duration in seconds. */
  duration?: number;
  /** Named easing or raw GSAP ease string. */
  ease?: EasingName | (string & {});
  /** Reduced motion handling. Default "auto" (follows the OS). */
  reducedMotion?: ReducedMotionMode;
  /** Accessible name for the carousel region. */
  label?: string;
  /** Called after the active index changes. */
  onChange?: (index: number) => void;
  className?: string;
}
