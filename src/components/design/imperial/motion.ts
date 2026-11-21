"use client";

/**
 * 28.10.2026 (user: „folosește și Imperial design, ai acolo ce trebuie") — piesele de mișcare
 * din Imperial Design System (`packages/motion`) de care are nevoie sliderul cinematic,
 * copiate aici (proiectul e pe React 18 / Next 14, pachetele Imperial pe React 19).
 */
import { useSyncExternalStore } from "react";
import { gsap } from "gsap";
export { gsap };
export { useGSAP } from "@gsap/react";

export const easings = {
  imperial: "expo.out", cinematic: "power4.inOut", snap: "power3.out", soft: "power2.out",
  elastic: "elastic.out(1, 0.6)", back: "back.out(1.4)", linear: "none",
} as const;
export type EasingName = keyof typeof easings;
export function resolveEase(ease: EasingName | (string & {}) | undefined, fallback: EasingName = "imperial"): string {
  if (!ease) return easings[fallback];
  return (easings as Record<string, string>)[ease] ?? ease;
}

export type ReducedMotionMode = "auto" | "always" | "never";
const QUERY = "(prefers-reduced-motion: reduce)";
function abonareMiscare(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}
export function useReducedMotion(mode: ReducedMotionMode = "auto"): boolean {
  const prefers = useSyncExternalStore(abonareMiscare, () => window.matchMedia(QUERY).matches, () => false);
  if (mode === "always") return true;
  if (mode === "never") return false;
  return prefers;
}
function abonareVizibil(cb: () => void) {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
export function usePageVisibility(): boolean {
  return useSyncExternalStore(abonareVizibil, () => document.visibilityState === "visible", () => true);
}
