// How many guesses does a plain strategy need? Plays every answer in data/answers.json.
//
//   node tools/simulate.mjs
//
// The player here ignores the score entirely and only narrows each attribute by its own
// colour and arrow, guessing the middle of what is left. A person who also reads the
// section points should do better, so this is a ceiling, not an estimate of human play.

import fs from 'node:fs';
import { ATTRIBUTES, KEYS } from '../src/attributes.js';
import { canonical, compare } from '../src/profile.js';

const file = JSON.parse(fs.readFileSync(new URL('../data/answers.json', import.meta.url), 'utf8'));
const LIMIT = 12;
const histogram = {};

for (const entry of file.answers) {
  const answer = Object.fromEntries(KEYS.map((k, i) => [k, entry.p[i]]));
  // What is still possible for each attribute: a set of option indexes.
  const possible = Object.fromEntries(ATTRIBUTES.map((a) => [a.key, a.options.map((_, i) => i)]));
  // Picks that were lowered last time: try something else first, or the player loops.
  const avoid = Object.fromEntries(KEYS.map((k) => [k, new Set()]));
  let used = LIMIT + 1;
  for (let n = 1; n <= LIMIT; n += 1) {
    const raw = Object.fromEntries(KEYS.map((k) => {
      const fresh = possible[k].filter((i) => !avoid[k].has(i));
      const from = fresh.length ? fresh : possible[k];
      return [k, from[Math.floor(from.length / 2)]];
    }));
    const { profile } = canonical(raw, entry.sp);
    const { cells, won } = compare(profile, answer);
    if (won) { used = n; break; }
    for (const k of KEYS) if (profile[k] !== raw[k]) avoid[k].add(raw[k]);
    for (const c of cells) {
      const a = ATTRIBUTES.find((x) => x.key === c.key);
      const band = a.close ?? 0;
      possible[c.key] = possible[c.key].filter((i) => {
        if (c.state === 'hit') return i === c.value;
        if (i === c.value) return false;
        if (a.kind !== 'ordinal') return true;
        if (c.arrow && (c.arrow === 'up' ? i < c.value : i > c.value)) return false;
        const near = Math.abs(i - c.value) <= band;
        return c.state === 'close' ? near : !near;
      });
    }
  }
  histogram[used] = (histogram[used] ?? 0) + 1;
}

const total = file.answers.length;
let running = 0;
for (const n of Object.keys(histogram).map(Number).sort((a, b) => a - b)) {
  running += histogram[n];
  const name = n > LIMIT ? `>${LIMIT}` : String(n);
  console.log(`${name.padStart(3)} guesses: ${String(histogram[n]).padStart(4)}  (${(100 * running / total).toFixed(0)}% by then)`);
}
