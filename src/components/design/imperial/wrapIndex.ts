/** Wrap `index` into `[0, length)`; clamps when `loop` is false. */
export function wrapIndex(index: number, length: number, loop = true): number {
  if (length <= 0) return 0;
  if (loop) return ((index % length) + length) % length;
  return Math.min(Math.max(index, 0), length - 1);
}
