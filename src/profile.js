// Canonical form of a profile, and the per-attribute feedback for a guess.

import { ATTRIBUTES, BY_KEY, LOWER_ORDER } from './attributes.js';
import { score, sameScore, tidy } from './score.js';

// Lowers every attribute that makes no difference to the score to its first option that
// scores the same: a job offer that loses to the work-experience path becomes "none", a
// sibling under a nomination (capped at 600) becomes "no". Hidden answers are always in
// this form and guesses are put into it before they are compared, so the player is never
// asked to guess something the score cannot see.
//
// Returns { profile, lowered } where `lowered` lists the keys that were changed.
export function canonical(input, spousePoints = 0) {
  let p = tidy(input);
  const target = score(p, spousePoints);
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of LOWER_ORDER) {
      for (let i = 0; i < p[key]; i += 1) {
        const q = tidy({ ...p, [key]: i });
        if (q[key] === i && sameScore(score(q, spousePoints), target)) {
          p = q;
          changed = true;
          break;
        }
      }
    }
  }
  const lowered = ATTRIBUTES.map((a) => a.key).filter((k) => p[k] !== input[k]);
  return { profile: p, lowered };
}

// Whether a grey (wrong and not close) ordinal cell also gets an arrow. With arrows on
// every wrong cell a player who never looks at the score finds 90% of people in three
// guesses (tools/simulate.mjs), so the arrow comes with yellow only.
export const ARROW_ON_MISS = false;

// Feedback for one attribute: { state: 'hit' | 'close' | 'miss', arrow: 'up' | 'down' | null }.
// The arrow points from the guess towards the answer and is only given for ordinals.
export function compareAttribute(key, guessIndex, answerIndex) {
  const a = BY_KEY[key];
  if (guessIndex === answerIndex) return { state: 'hit', arrow: null };
  if (a.kind !== 'ordinal') return { state: 'miss', arrow: null };
  const distance = Math.abs(guessIndex - answerIndex);
  const state = distance <= (a.close ?? 0) ? 'close' : 'miss';
  const arrow = answerIndex > guessIndex ? 'up' : 'down';
  return { state, arrow: state === 'close' || ARROW_ON_MISS ? arrow : null };
}

// Full feedback for a guess against the answer. Both must already be canonical.
export function compare(guess, answer) {
  const cells = ATTRIBUTES.map((a) => ({
    key: a.key, value: guess[a.key], ...compareAttribute(a.key, guess[a.key], answer[a.key]),
  }));
  return { cells, won: cells.every((c) => c.state === 'hit') };
}
