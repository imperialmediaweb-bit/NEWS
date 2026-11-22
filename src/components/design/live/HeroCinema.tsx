"use client";

import { useEffect, useState, type ComponentType } from "react";
import { srcSetOf } from "./shared";

type Slide = { id: string; image: string; title: string; subtitle?: string; eyebrow?: string; href: string };

// The Imperial slider and gsap (about 50 KB) load only once the browser is
// idle after the first paint; until then the first story is drawn with the
// same classes, straight from the server, so the largest paint is the photo
// and nothing blocks the main thread at load.
// The module is fetched first and swapped in only when it is ready, so the
// static first story never disappears and nothing on the page moves.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SliderType = ComponentType<any>;

const HEIGHT = "clamp(460px, 46vw, 640px)";
const SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 60vw";

function StaticFirst({ s }: { s: Slide }) {
  return (
    <section className="lv-cinema" style={{ position: "relative", height: HEIGHT, overflow: "hidden", backgroundColor: "#000" }} aria-label={s.title}>
      <div data-slide-image style={{ position: "absolute", inset: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.image} srcSet={srcSetOf(s.image)} sizes={SIZES} alt={s.title} className="imperial-slide-img" loading="eager" decoding="sync" fetchPriority="high" />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.75) 100%)" }} />
      </div>
      <div data-slide-content>
        {s.eyebrow ? <p data-slide-eyebrow>{s.eyebrow}</p> : null}
        <h2 data-slide-title>{s.title}</h2>
        {s.subtitle ? <p data-slide-subtitle>{s.subtitle}</p> : null}
        <a data-slide-cta href={s.href}>Read the story →</a>
      </div>
    </section>
  );
}

/** The Imperial Design System cinematic slider, with the top stories of the day. */
export default function HeroCinema({ slides }: { slides: Slide[] }) {
  const [Slider, setSlider] = useState<SliderType | null>(null);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => {
      import("@/components/design/imperial/CinematicParallaxSlider").then((m) => setSlider(() => m.CinematicParallaxSlider));
    };
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 3000 });
    else setTimeout(go, 1500);
  }, []);
  if (!slides.length) return null;
  if (!Slider) return <StaticFirst s={slides[0]} />;
  return (
    <Slider
      key={slides.map((s) => s.id).join("|")}
      slides={slides.map((s) => ({ id: s.id, image: s.image, alt: s.title, title: s.title, subtitle: s.subtitle, eyebrow: s.eyebrow, cta: { label: "Read the story →", href: s.href } }))}
      autoplay
      interval={7000}
      height={HEIGHT}
      className="lv-cinema"
      showArrows
      showDots
      renderImage={({ src, alt, className, priority, onLoad }: { src: string; alt: string; className?: string; priority?: boolean; onLoad?: () => void }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} srcSet={srcSetOf(src)} sizes={SIZES} alt={alt} className={className} loading={priority ? "eager" : "lazy"} decoding="async" draggable={false} onLoad={onLoad} />
      )}
    />
  );
}
