// Small seeded generator (mulberry32). Returns a function giving floats in [0, 1).
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks an index with probability proportional to its weight.
export function pickWeighted(random, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let x = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}
