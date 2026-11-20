// How many guesses does "hit the score" need? Plays every answer in data/answers.json.
//
//   node tools/simulate-score.mjs
//
// The player knows no point tables. It only knows what the game shows: each guess's total
// and, for every attribute, what one step up and one step down would have changed. From
// those it keeps a rough idea of what every option is worth (options it has not seen are
// extrapolated from the nearest seen one, with a guessed 8 points a step, fewer points
// for more age), and each turn changes one or two attributes to land as near the target
// as that rough idea says. It ignores how attributes combine, so a person who notices
// that should do better.

import fs from 'node:fs';
import { ATTRIBUTES, KEYS } from '../src/attributes.js';
import { score, tidy } from '../src/score.js';
import { steps } from '../src/modes.js';

const file = JSON.parse(fs.readFileSync(new URL('../data/answers.json', import.meta.url), 'utf8'));
const LIMIT = 12;
const START = { spouse: 0, age: 2, edu: 4, lang1: 3, lang2: 0, first: 0, cwe: 0, hw: 0,
  offer: 0, foreign: 0, canEdu: 0, sibling: 0 };
const STEP = { age: -5, spouse: 0, first: 0, sibling: 15 };
const histogram = {};

for (const entry of file.answers) {
  const answer = Object.fromEntries(KEYS.map((k, i) => [k, entry.p[i]]));
  const target = score(answer, entry.sp).total;
  const known = Object.fromEntries(KEYS.map((k) => [k, new Map()]));
  const estimate = (key, i) => {
    const seen = known[key];
    if (seen.has(i)) return seen.get(i);
    let nearest = null;
    for (const j of seen.keys()) if (nearest === null || Math.abs(j - i) < Math.abs(nearest - i)) nearest = j;
    let step = STEP[key] ?? 8;
    if (seen.size > 1) {
      const [a, b] = [...seen.keys()].sort((x, y) => Math.abs(x - i) - Math.abs(y - i));
      step = (seen.get(a) - seen.get(b)) / (a - b);
    }
    return seen.get(nearest) + (i - nearest) * step;
  };
  const tried = new Set();
  let guess = tidy(START);
  let used = LIMIT + 1;
  for (let n = 1; n <= LIMIT; n += 1) {
    tried.add(JSON.stringify(guess));
    const total = score(guess, entry.sp).total;
    if (total === target) { used = n; break; }
    // What this guess teaches: one step up and one step down for every attribute.
    const hints = steps(guess, entry.sp);
    const w = {};
    for (const k of KEYS) {
      w[k] = known[k].size ? estimate(k, guess[k]) : 0;
      known[k].set(guess[k], w[k]);
      if (hints[k].down !== null) known[k].set(guess[k] - 1, w[k] + hints[k].down);
      if (hints[k].up !== null) known[k].set(guess[k] + 1, w[k] + hints[k].up);
    }
    // Every change of one attribute, then every pair of them.
    const moves = [];
    for (const a of ATTRIBUTES) {
      a.options.forEach((_, i) => {
        if (i !== guess[a.key]) moves.push({ key: a.key, i, delta: estimate(a.key, i) - w[a.key] });
      });
    }
    let best = null;
    const consider = (changes, delta) => {
      const next = tidy({ ...guess, ...changes });
      if (tried.has(JSON.stringify(next))) return;
      const miss = Math.abs(total + delta - target);
      if (!best || miss < best.miss) best = { next, miss };
    };
    for (const m of moves) consider({ [m.key]: m.i }, m.delta);
    for (let x = 0; x < moves.length; x += 1) {
      for (let y = x + 1; y < moves.length; y += 1) {
        if (moves[x].key === moves[y].key) continue;
        consider({ [moves[x].key]: moves[x].i, [moves[y].key]: moves[y].i }, moves[x].delta + moves[y].delta);
      }
    }
    guess = best.next;
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
