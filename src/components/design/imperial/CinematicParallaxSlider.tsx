'use client';

/**
 * 28.10.2026 — copiat din Imperial Design System (`packages/sliders`), tradus în română
 * (etichetele pentru cititoarele de ecran) și adaptat la React 18 (`inert`). Folosit în
 * deschiderea ziarelor după machete (`design/judet/HomeMacheta.tsx`).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap, useGSAP, resolveEase, useReducedMotion } from './motion';
import type { RenderImage, SliderCommonProps } from './types';
import { useSlideIndex } from './useSlideIndex';
import { useAutoplay } from './useAutoplay';
import { useDragNavigation } from './useDragNavigation';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { SliderControls } from './SliderControls';

export interface CinematicSlide {
  id: string;
  image: string;
  alt: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  /** Optional overlay colour (CSS color) blended over the image for legibility. */
  overlay?: string;
}

export interface CinematicParallaxSliderProps extends SliderCommonProps {
  slides: CinematicSlide[];
  /** 0–1. How far the image layer lags behind the slide panel. Default 0.35. */
  parallaxIntensity?: number;
  /** 0–0.5. Cinematic zoom amount applied to the active image. Default 0.12. */
  zoomIntensity?: number;
  /** Height of the slider. Default "100svh". */
  height?: string;
  showArrows?: boolean;
  showDots?: boolean;
  showProgress?: boolean;
  /** Plug in `next/image` or any custom renderer. */
  renderImage?: RenderImage;
  /** Extra content layered above the slides (logos, scroll hints). */
  children?: ReactNode;
}

const defaultRenderImage: RenderImage = ({ src, alt, className, priority, onLoad }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
    draggable={false}
    onLoad={onLoad}
  />
);

/**
 * SLIDER 01 — Cinematic Parallax Slider
 *
 * Fullscreen imagery with layered parallax (the image lags behind its panel while
 * sliding), a slow cinematic zoom on the active frame, masked word-by-word text reveals
 * and premium easing. Falls back to a crossfade under reduced motion.
 */
export function CinematicParallaxSlider({
  slides,
  initialIndex = 0,
  loop = true,
  autoplay = false,
  interval = 6000,
  duration = 1.4,
  ease = 'cinematic',
  parallaxIntensity = 0.35,
  zoomIntensity = 0.12,
  height = '100svh',
  showArrows = true,
  showDots = true,
  showProgress = true,
  reducedMotion = 'auto',
  label = 'Top stories',
  renderImage = defaultRenderImage,
  onChange,
  className,
  children,
}: CinematicParallaxSliderProps) {
  const reduced = useReducedMotion(reducedMotion);
  const rootRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animating = useRef(false);
  const previousIndex = useRef(initialIndex);
  const baseId = useId();

  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  // Slides that have been visited keep their image mounted; neighbours of the active
  // slide are mounted ahead of time so navigation never shows an empty frame.
  const [visited, setVisited] = useState<number[]>(() => [initialIndex]);

  const count = slides.length;
  const handleChange = useCallback(
    (i: number) => {
      setVisited((v) => (v.includes(i) ? v : [...v, i]));
      onChange?.(i);
    },
    [onChange],
  );
  const { index, direction, goTo, next, prev, canNext, canPrev } = useSlideIndex(count, {
    initialIndex,
    loop,
    onChange: handleChange,
    isLocked: () => animating.current,
  });
  const mounted = useMemo(() => {
    const set = new Set(visited);
    set.add(index);
    set.add((((index + 1) % count) + count) % count);
    set.add((((index - 1) % count) + count) % count);
    return set;
  }, [visited, index, count]);

  const autoplayEnabled = autoplay && !reduced && count > 1;
  const player = useAutoplay({ enabled: autoplayEnabled, interval, onTick: next, resetKey: index });

  const easeStr = useMemo(() => resolveEase(ease), [ease]);

  // ---- Transition timeline ---------------------------------------------------
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const slideEls = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
      const from = previousIndex.current;
      const to = index;
      const fromEl = slideEls[from];
      const toEl = slideEls[to];
      if (!toEl) return;

      // Initial mount: set up the first slide without animating.
      if (from === to) {
        slideEls.forEach((el, i) => {
          gsap.set(el, { autoAlpha: i === to ? 1 : 0, zIndex: i === to ? 2 : 1, xPercent: 0 });
          gsap.set(el.querySelector('[data-slide-image]'), { xPercent: 0, scale: 1 });
        });
        const words = toEl.querySelectorAll('[data-word-inner]');
        gsap.set(words, { yPercent: 0 });
        return;
      }
      previousIndex.current = to;
      animating.current = true;

      const toImage = toEl.querySelector<HTMLElement>('[data-slide-image]');
      const fromImage = fromEl?.querySelector<HTMLElement>('[data-slide-image]') ?? null;
      const toWords = Array.from(toEl.querySelectorAll<HTMLElement>('[data-word-inner]'));
      const toMeta = Array.from(toEl.querySelectorAll<HTMLElement>('[data-slide-meta]'));
      const fromWords: HTMLElement[] = fromEl
        ? Array.from(fromEl.querySelectorAll<HTMLElement>('[data-word-inner]'))
        : [];
      const fromMeta: HTMLElement[] = fromEl
        ? Array.from(fromEl.querySelectorAll<HTMLElement>('[data-slide-meta]'))
        : [];

      const tl = gsap.timeline({
        defaults: { ease: easeStr, duration },
        onComplete: () => {
          animating.current = false;
          if (fromEl) gsap.set(fromEl, { zIndex: 1 });
        },
      });

      if (reduced) {
        tl.set(toEl, { zIndex: 3, xPercent: 0 })
          .fromTo(toEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'power1.inOut' })
          .set(toWords, { yPercent: 0 })
          .set(toMeta, { autoAlpha: 1, y: 0 });
        if (fromEl) tl.to(fromEl, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, 0);
        return;
      }

      const dir = direction; // 1 = forward (new slide enters from the right)
      const lag = parallaxIntensity * 100;

      tl.set(toEl, { zIndex: 3, autoAlpha: 1, xPercent: 100 * dir })
        .set(toImage, { xPercent: -lag * dir, scale: 1 + zoomIntensity })
        .set(toWords, { yPercent: 110 })
        .set(toMeta, { autoAlpha: 0, y: 24 })
        // Panels slide; images lag behind their panels (layered parallax).
        .to(toEl, { xPercent: 0 }, 0)
        .to(toImage, { xPercent: 0, scale: 1 }, 0);

      if (fromEl) {
        tl.to(fromEl, { xPercent: -40 * dir }, 0)
          .to(fromImage ?? fromEl, { xPercent: lag * 0.6 * dir, scale: 1 + zoomIntensity * 0.6 }, 0)
          .to(
            fromWords,
            { yPercent: -110, duration: duration * 0.45, stagger: 0.02, ease: 'power3.in' },
            0,
          )
          .to(fromMeta, { autoAlpha: 0, y: -16, duration: duration * 0.4, ease: 'power2.in' }, 0)
          .set(fromEl, { autoAlpha: 0, xPercent: 0 });
      }

      // Staggered text reveal lands as the panel settles.
      tl.to(
        toWords,
        { yPercent: 0, duration: duration * 0.8, stagger: 0.045, ease: 'expo.out' },
        duration * 0.35,
      ).to(
        toMeta,
        { autoAlpha: 1, y: 0, duration: duration * 0.7, stagger: 0.08, ease: 'power3.out' },
        duration * 0.5,
      );
    },
    { dependencies: [index], scope: rootRef },
  );

  // Slow "Ken Burns" drift on the active image between transitions.
  useGSAP(
    () => {
      if (reduced) return;
      const root = rootRef.current;
      const active = root?.querySelectorAll<HTMLElement>('[data-slide]')[index];
      const img = active?.querySelector('[data-slide-image]');
      if (!img) return;
      gsap.to(img, {
        scale: 1 + zoomIntensity * 0.6,
        duration: Math.max(interval / 1000, 6),
        ease: 'none',
        delay: duration,
      });
    },
    { dependencies: [index, reduced], scope: rootRef },
  );

  // Autoplay progress bar.
  useGSAP(
    () => {
      const bar = progressRef.current;
      if (!bar) return;
      gsap.killTweensOf(bar);
      if (!player.playing || player.suspended) {
        gsap.set(bar, { scaleX: 0 });
        return;
      }
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: interval / 1000, ease: 'none' });
    },
    { dependencies: [index, player.playing, player.suspended, interval], scope: rootRef },
  );

  // ---- Interaction -----------------------------------------------------------
  const onKeyDown = useKeyboardNavigation({
    next,
    prev,
    first: () => goTo(0, -1),
    last: () => goTo(count - 1, 1),
  });

  const { state: drag, bind } = useDragNavigation({
    onSwipe: (d) => (d === 1 ? next() : prev()),
    disabled: count < 2,
  });

  // Live drag feedback: nudge the active panel with resistance, then spring back.
  useEffect(() => {
    const root = rootRef.current;
    const active = root?.querySelectorAll<HTMLElement>('[data-slide]')[index];
    if (!active || animating.current || reduced) return;
    if (drag.dragging) {
      gsap.set(active, { x: drag.deltaX * 0.25 });
    } else {
      gsap.to(active, { x: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    }
  }, [drag.dragging, drag.deltaX, index, reduced]);

  const announce = slides[index] ? `Story ${index + 1} of ${count}: ${slides[index]!.title}` : '';

  const markLoaded = useCallback(
    (id: string) => setLoaded((l) => (l[id] ? l : { ...l, [id]: true })),
    [],
  );

  return (
    <section
      ref={rootRef}
      className={className}
      data-imperial-slider="cinematic-parallax"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={player.suspend}
      onMouseLeave={player.resume}
      onFocus={player.suspend}
      onBlur={player.resume}
      style={{
        position: 'relative',
        height,
        overflow: 'hidden',
        outline: 'none',
        backgroundColor: '#000',
      }}
    >
      <div
        data-imperial-track
        {...bind}
        style={{
          position: 'absolute',
          inset: 0,
          ...bind.style,
          cursor: drag.dragging ? 'grabbing' : 'grab',
        }}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          const isMounted = mounted.has(i);
          const words = slide.title.split(/\s+/);
          return (
            <article
              key={slide.id}
              data-slide
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={active ? undefined : ("" as unknown as boolean)}
              id={`${baseId}-slide-${i}`}
              style={{
                position: 'absolute',
                inset: 0,
                visibility: 'hidden',
                willChange: 'transform',
              }}
            >
              <div
                data-slide-image
                style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
              >
                {isMounted
                  ? renderImage({
                      src: slide.image,
                      alt: slide.alt,
                      priority: i === initialIndex,
                      onLoad: () => markLoaded(slide.id),
                      className: 'imperial-slide-img',
                    })
                  : null}
                {!loaded[slide.id] ? <div data-imperial-skeleton aria-hidden /> : null}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      slide.overlay ??
                      'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.75) 100%)',
                  }}
                />
              </div>
              <div data-slide-content>
                {slide.eyebrow ? (
                  <p data-slide-meta data-slide-eyebrow>
                    {slide.eyebrow}
                  </p>
                ) : null}
                <h2 data-slide-title aria-label={slide.title}>
                  {words.map((w, wi) => (
                    <span
                      key={wi}
                      data-word
                      aria-hidden
                      style={{
                        display: 'inline-block',
                        overflow: 'hidden',
                        verticalAlign: 'bottom',
                      }}
                    >
                      <span
                        data-word-inner
                        style={{ display: 'inline-block', willChange: 'transform' }}
                      >
                        {w}
                        {wi < words.length - 1 ? ' ' : ''}
                      </span>
                    </span>
                  ))}
                </h2>
                {slide.subtitle ? (
                  <p data-slide-meta data-slide-subtitle>
                    {slide.subtitle}
                  </p>
                ) : null}
                {slide.cta ? (
                  <a
                    data-slide-meta
                    data-slide-cta
                    href={slide.cta.href}
                    tabIndex={active ? 0 : -1}
                  >
                    {slide.cta.label}
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {children}

      {count > 1 ? (
        <SliderControls
          count={count}
          index={index}
          onPrev={prev}
          onPrevDisabled={!canPrev}
          onNext={next}
          onNextDisabled={!canNext}
          onGoTo={(i) => goTo(i)}
          labels={slides.map((s) => s.title)}
          showArrows={showArrows}
          showDots={showDots}
          autoplay={
            autoplayEnabled ? { playing: player.playing, toggle: player.toggle } : undefined
          }
        />
      ) : null}

      {showProgress && autoplayEnabled ? (
        <div data-imperial-progress aria-hidden>
          <div ref={progressRef} data-imperial-progress-bar />
        </div>
      ) : null}

      <div data-imperial-counter aria-hidden>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span data-imperial-counter-sep />
        <span>{String(count).padStart(2, '0')}</span>
      </div>

      <div aria-live={player.playing ? 'off' : 'polite'} aria-atomic="true" style={visuallyHidden}>
        {announce}
      </div>
    </section>
  );
}

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
