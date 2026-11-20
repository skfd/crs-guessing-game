// What does joining attributes into tuples do to the game? Plays every answer in
// data/answers.json under each grouping in src/groups.js, with two players.
//
//   node tools/simulate-tuples.mjs            every grouping and rule
//   node tools/simulate-tuples.mjs pairs      one grouping
//   node tools/simulate-tuples.mjs pairs total   under the total-only clue (minutes)
//
// The clicker ignores the score and narrows each cell by its own colour, picking the
// middle of what is left: what the marked chips let a person do without thinking.
//
// The reasoner starts from everyone who has the hidden person's four section subtotals
// (the full clue) or only the same total (the total-only clue), guesses one of them at random, and keeps whoever would have drawn the
// same colours. It is not the best possible player, but it never forgets anything.
//
// A grouping is worth playing when the clicker fails and the reasoner does not. Takes
// about ten seconds: it scores every profile there is, once.

import fs from 'node:fs';
import { ATTRIBUTES, KEYS } from '../src/attributes.js';
import { score, tidy } from '../src/score.js';
import { canonical } from '../src/profile.js';
import { GROUPINGS, RULES, combos, compareGrouped, stillPossibleGroup } from '../src/groups.js';
import { rng } from '../src/rng.js';

const file = JSON.parse(fs.readFileSync(new URL('../data/answers.json', import.meta.url), 'utf8'));
const answers = file.answers.map((entry) => ({
  profile: Object.fromEntries(KEYS.map((k, i) => [k, entry.p[i]])), sp: entry.sp,
}));
const LIMIT = 12;
const only = process.argv[2] === 'all' ? '' : process.argv[2];
const clue = process.argv[3] === 'total' ? 'total' : 'full';

// ---- everyone with the same four sections ------------------------------------------------

const SIZES = ATTRIBUTES.map((a) => a.options.length);
const pack = (p) => KEYS.reduce((n, k, i) => n * SIZES[i] + p[k], 0);
function unpack(n) {
  const p = {};
  for (let i = KEYS.length - 1; i >= 0; i -= 1) { p[KEYS[i]] = n % SIZES[i]; n = Math.floor(n / SIZES[i]); }
  return p;
}
// What a profile must share with the hidden person to be a candidate. Under the
// total-only clue that is the total, less the spouse points a guess with a spouse borrows.
const clueKey = (s) => (clue === 'total' ? s.total : (s.core * 128 + s.transfer) * 1024 + s.additional);

const totals = answers.map((a) => score(a.profile, a.sp).total);
function findCandidates() {
  const wanted = new Map(); // clue key of a spouseless score -> the answers it could be
  const want = (key, i) => { if (!wanted.get(key)?.includes(i)) wanted.set(key, [...(wanted.get(key) ?? []), i]); };
  answers.forEach((a, i) => {
    const s = score(a.profile, a.sp);
    want(clueKey({ ...s, total: s.total - s.spouse }), i);
    if (clue === 'total') { want(s.total, i); want(s.total - a.sp, i); }
  });
  const found = answers.map(() => []);
  const isCanonical = new Map();
  const p = {};
  const walk = (depth) => {
    if (depth === KEYS.length) {
      const t = tidy(p);
      if (t.lang2 !== p.lang2 || t.hw !== p.hw) return; // cannot exist
      const bare = score(p, 0);
      const hits = wanted.get(clueKey(bare));
      if (!hits) return;
      for (const i of hits) {
        const a = answers[i];
        // A spouse in a guess brings the hidden spouse's points.
        const lent = p.spouse ? a.sp : 0;
        if (clue === 'total' ? bare.total + lent !== totals[i] : lent !== (a.profile.spouse ? a.sp : 0)) continue;
        const n = pack(p);
        if (!isCanonical.has(n)) isCanonical.set(n, canonical({ ...p }, a.sp).lowered.length === 0);
        if (isCanonical.get(n)) found[i].push(n);
      }
      return;
    }
    for (let v = 0; v < SIZES[depth]; v += 1) { p[KEYS[depth]] = v; walk(depth + 1); }
  };
  walk(0);
  return found;
}

// ---- the two players ---------------------------------------------------------------------

const signature = (cells) => cells.map((c) => `${c.state[0]}${c.arrow ? c.arrow[0] : ''}${c.right}`).join(' ');

function clicker(answer, grouping, rule) {
  const possible = grouping.map((g) => combos(g).map((_, i) => i));
  const avoid = grouping.map(() => new Set()); // picks that were lowered: try others first
  for (let n = 1; n <= LIMIT; n += 1) {
    const picks = grouping.map((g, j) => {
      const fresh = possible[j].filter((i) => !avoid[j].has(i));
      const from = fresh.length ? fresh : possible[j];
      return from[Math.floor(from.length / 2)];
    });
    const raw = {};
    grouping.forEach((g, j) => g.keys.forEach((k, x) => { raw[k] = combos(g)[picks[j]][x]; }));
    const { profile } = canonical(raw, answer.sp);
    const { cells, won } = compareGrouped(grouping, profile, answer.profile, rule);
    if (won) return n;
    grouping.forEach((g, j) => {
      if (g.keys.some((k) => profile[k] !== raw[k])) avoid[j].add(picks[j]);
      const open = stillPossibleGroup(g, [cells[j]], rule);
      possible[j] = possible[j].filter((i) => open[i]);
    });
  }
  return LIMIT + 1;
}

function reasoner(answer, candidates, grouping, rule, random) {
  let left = candidates;
  for (let n = 1; n <= LIMIT; n += 1) {
    const guess = unpack(left[Math.floor(random() * left.length)]);
    const { cells, won } = compareGrouped(grouping, guess, answer.profile, rule);
    if (won) return n;
    const seen = signature(cells);
    left = left.filter((c) => signature(compareGrouped(grouping, guess, unpack(c), rule).cells) === seen);
  }
  return LIMIT + 1;
}

// ---- run ---------------------------------------------------------------------------------

console.log('Scoring every profile...');
const candidates = findCandidates();
const sizes = candidates.map((c) => c.length).sort((a, b) => a - b);
console.log(`People with the same ${clue === 'total' ? 'total' : 'four sections'} as the hidden one: median ${sizes[sizes.length >> 1]}, `
  + `smallest ${sizes[0]}, largest ${sizes.at(-1)}.\n`);

const by = (used, n) => `${Math.round(100 * used.filter((u) => u <= n).length / used.length)}%`.padStart(5);
console.log('grouping  rule   cells  most chips | clicker by 4    6    8 | reasoner by 3    4    5    6  mean');
for (const [name, grouping] of Object.entries(GROUPINGS)) {
  if (only && name !== only) continue;
  for (const rule of name === 'none' ? ['count'] : RULES) {
    const clicks = answers.map((a) => clicker(a, grouping, rule));
    const random = rng(20261120);
    const thinks = answers.map((a, i) => reasoner(a, candidates[i], grouping, rule, random));
    const mean = thinks.reduce((s, n) => s + n, 0) / thinks.length;
    console.log([
      name.padEnd(9), rule.padEnd(6), String(grouping.length).padStart(5),
      String(Math.max(...grouping.map((g) => combos(g).length))).padStart(10), ' |          ',
      by(clicks, 4), by(clicks, 6), by(clicks, 8), ' |           ',
      by(thinks, 3), by(thinks, 4), by(thinks, 5), by(thinks, 6), mean.toFixed(2).padStart(6),
    ].join(' '));
  }
}
