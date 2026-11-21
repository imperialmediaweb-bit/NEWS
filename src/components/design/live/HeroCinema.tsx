"use client";

import { CinematicParallaxSlider } from "@/components/design/imperial/CinematicParallaxSlider";

/** The Imperial Design System cinematic slider, with the top stories of the day. */
export default function HeroCinema({ slides }: { slides: Array<{ id: string; image: string; title: string; subtitle?: string; eyebrow?: string; href: string }> }) {
  return (
    <CinematicParallaxSlider
      key={slides.map((s) => s.id).join("|")}
      slides={slides.map((s) => ({ id: s.id, image: s.image, alt: s.title, title: s.title, subtitle: s.subtitle, eyebrow: s.eyebrow, cta: { label: "Read the story →", href: s.href } }))}
      autoplay
      interval={7000}
      height="clamp(460px, 46vw, 640px)"
      className="lv-cinema"
      showArrows
      showDots
      renderImage={({ src, alt, className, priority, onLoad }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} draggable={false} onLoad={onLoad} {...(priority ? { fetchpriority: "high" } : {})} />
      )}
    />
  );
}
