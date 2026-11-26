/** vector-math.ts — small numeric helpers for dense retrieval. */

export function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const inv = sum > 0 ? 1 / Math.sqrt(sum) : 0;
  return v.map((x) => x * inv);
}

/** Dot product; equals cosine similarity when both inputs are L2-normalized. */
export function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
