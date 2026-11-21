'use client';

import type { CSSProperties } from 'react';

export interface SliderControlsProps {
  count: number;
  index: number;
  onPrev: () => void;
  onPrevDisabled?: boolean;
  onNext: () => void;
  onNextDisabled?: boolean;
  onGoTo: (i: number) => void;
  /** Autoplay toggle; omitted when autoplay is off. */
  autoplay?: { playing: boolean; toggle: () => void };
  showArrows?: boolean;
  showDots?: boolean;
  /** Slide labels used for the dot buttons' accessible names. */
  labels?: string[];
  className?: string;
  style?: CSSProperties;
  /** Layout direction of the control bar. Default "horizontal". */
  orientation?: 'horizontal' | 'vertical';
}

/** Unstyled-ish shared control bar. Styling hooks via `data-imperial-*` attributes. */
export function SliderControls({
  count,
  index,
  onPrev,
  onPrevDisabled,
  onNext,
  onNextDisabled,
  onGoTo,
  autoplay,
  showArrows = true,
  showDots = true,
  labels,
  className,
  style,
  orientation = 'horizontal',
}: SliderControlsProps) {
  return (
    <div className={className} style={style} data-imperial-controls data-orientation={orientation}>
      {showArrows ? (
        <button
          type="button"
          data-imperial-arrow="prev"
          aria-label="Previous story"
          onClick={onPrev}
          disabled={onPrevDisabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
      {showDots ? (
        <div
          data-imperial-dots
          role="tablist"
          aria-label="Choose a story"
          aria-orientation={orientation}
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={labels?.[i] ? `Story ${i + 1}: ${labels[i]}` : `Story ${i + 1}`}
              data-imperial-dot
              data-nr={String(i + 1).padStart(2, "0")}
              data-active={i === index || undefined}
              tabIndex={i === index ? 0 : -1}
              onClick={() => onGoTo(i)}
            />
          ))}
        </div>
      ) : null}
      {showArrows ? (
        <button
          type="button"
          data-imperial-arrow="next"
          aria-label="Next story"
          onClick={onNext}
          disabled={onNextDisabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
      {autoplay ? (
        <button
          type="button"
          data-imperial-autoplay
          aria-pressed={!autoplay.playing}
          aria-label={autoplay.playing ? 'Pause' : 'Play'}
          onClick={autoplay.toggle}
        >
          {autoplay.playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );
}
