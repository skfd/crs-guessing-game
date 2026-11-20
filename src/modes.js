// The ways to play: a win condition (mode) and an up-front clue. No DOM in here.

import { ATTRIBUTES } from './attributes.js';
import { score, tidy, SECTIONS } from './score.js';

// `clue` is the clue a mode starts with when the address names none.
export const MODES = [
  {
    key: 'person', label: 'Find the person', clue: 'full', guesses: 6,
    tagline: 'Canada ranks would-be immigrants with a score. Here is a score. Who is behind it?',
  },
  {
    key: 'score', label: 'Hit the score', clue: 'total', guesses: 8,
    tagline: 'Canada ranks would-be immigrants with a score. Here is a score. Describe anyone who gets exactly that.',
  },
  {
    key: 'lineup', label: 'Line-up', clue: null,
    tagline: 'Canada ranks would-be immigrants with a score. Here is a score and four people. Whose is it?',
  },
];
export const CLUES = [
  { key: 'full', label: 'Total and sections' },
  { key: 'total', label: 'Total only' },
  { key: 'reveal', label: 'A section per miss' },
];
export const MODE = Object.fromEntries(MODES.map((m) => [m.key, m]));

// Reads ?mode= and ?clue=. Anything unknown falls back, so the bare address is always
// "find the person" with the full clue.
export function parseVariant(params) {
  const mode = MODE[params.get('mode')] ? params.get('mode') : 'person';
  if (mode === 'lineup') return { mode, clue: null };
  const asked = params.get('clue');
  return { mode, clue: CLUES.some((c) => c.key === asked) ? asked : MODE[mode].clue };
}

// The variants that hide one person a day, in a fixed order. Each takes its person from
// a different place in the answer list: finishing one variant shows its person, who must
// not be the answer to another variant on the same day.
export const PERSON_VARIANTS = [
  'person-full', 'person-total', 'person-reveal', 'score-total', 'score-full', 'score-reveal',
];
const OFFSET_STEP = 53; // 366 answers / 7, so the variants stay weeks apart

// '' for the original game, so its saved games and share text stay as they were.
export function variantId(mode, clue) {
  if (mode === 'lineup') return 'lineup';
  return mode === 'person' && clue === 'full' ? '' : `${mode}-${clue}`;
}
export function variantOffset(mode, clue) {
  return Math.max(0, PERSON_VARIANTS.indexOf(`${mode}-${clue}`)) * OFFSET_STEP;
}
export const VARIANT_OFFSETS = PERSON_VARIANTS.map((_, i) => i * OFFSET_STEP);

// What goes after the day number in the title and the share text.
export function variantName(mode, clue) {
  if (mode === 'lineup') return 'line-up';
  const parts = [];
  if (mode !== 'person') parts.push(MODE[mode].label.toLowerCase());
  if (clue !== MODE[mode].clue) parts.push(CLUES.find((c) => c.key === clue).label.toLowerCase());
  return parts.join(', ');
}

// The order sections are handed out in under the 'reveal' clue: the ones that say least
// first, core (most of the points) last.
export const REVEAL_ORDER = ['additional', 'spouse', 'transfer', 'core'];

// Which section subtotals the player may see after `misses` wrong guesses. Everything
// that compares a guess with the hidden sections has to go through this, or the guess row
// gives away what the clue hides.
export function revealedSections(clue, misses, over = false) {
  if (over || clue === 'full') return SECTIONS.map((s) => s.key);
  if (clue === 'total') return [];
  return REVEAL_ORDER.slice(0, misses);
}

// "Hit the score": for every attribute of a guess, what one step down and one step up
// would have done to its total with the rest left alone, or null where there is no such
// step. This is the only teaching the mode gives, since it has no colours.
export function steps(profile, spousePoints = 0) {
  const p = tidy(profile);
  const total = score(p, spousePoints).total;
  const delta = (key, i) => {
    if (i < 0 || i >= ATTRIBUTES.find((a) => a.key === key).options.length) return null;
    const q = tidy({ ...p, [key]: i });
    return q[key] === i ? score(q, spousePoints).total - total : null;
  };
  return Object.fromEntries(ATTRIBUTES.map((a) => [
    a.key, { down: delta(a.key, p[a.key] - 1), up: delta(a.key, p[a.key] + 1) },
  ]));
}

// A square for one "hit the score" guess: exact, near, or far.
export const NEAR = 20;
export function closeness(gap) {
  if (gap === 0) return 'hit';
  return Math.abs(gap) <= NEAR ? 'close' : 'miss';
}
