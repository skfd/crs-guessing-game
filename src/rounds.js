// Line-up mode: which people stand in each round, and how a person is described. No DOM.

import { BY_KEY, KEYS } from './attributes.js';
import { score } from './score.js';
import { rng } from './rng.js';
import { VARIANT_OFFSETS } from './modes.js';

export const ROUNDS = 5;
export const LINEUP_SIZE = 4;
// A line-up shows whole people with their scores, so it must not show anyone the guessing
// modes hide today or will hide in the coming week.
export const KEEP_AWAY_DAYS = 7;
// How far a wrong person's score may sit from the round's score, and how far apart the
// wrong ones are kept from each other. Nearer than this and only a calculator could tell
// them apart; further and the round answers itself.
const NEAREST = 12;
const FURTHEST = 70;
const APART = 8;

export function people(answersFile) {
  return answersFile.answers.map((entry, index) => {
    const profile = Object.fromEntries(KEYS.map((k, i) => [k, entry.p[i]]));
    return { index, profile, spousePoints: entry.sp, score: score(profile, entry.sp) };
  });
}

// Indexes into the answer list that a guessing mode uses on `day` or soon after.
export function reserved(day, count) {
  const set = new Set();
  for (let d = 0; d < KEEP_AWAY_DAYS; d += 1) {
    for (const offset of VARIANT_OFFSETS) set.add((((day - 1 + d + offset) % count) + count) % count);
  }
  return set;
}

function shuffle(list, random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The day's rounds: [{ total, people: [four people], answer: index of the one who has
// that total }]. The same day always gives the same rounds. No two people in a round
// share a total, and nobody stands in two rounds of the same day.
export function roundsForDay(answersFile, day) {
  const random = rng(day * 7919 + 17);
  const all = people(answersFile);
  const away = reserved(day, all.length);
  let pool = shuffle(all.filter((p) => !away.has(p.index)), random);
  const rounds = [];
  for (let r = 0; r < ROUNDS; r += 1) {
    const target = pool[0];
    const others = pool.slice(1).filter((p) => p.score.total !== target.score.total);
    const picked = [];
    const fits = (p) => picked.every((q) => Math.abs(q.score.total - p.score.total) >= APART);
    for (const p of others) {
      if (picked.length === LINEUP_SIZE - 1) break;
      const gap = Math.abs(p.score.total - target.score.total);
      if (gap >= NEAREST && gap <= FURTHEST && fits(p)) picked.push(p);
    }
    // A score with too few neighbours (a nomination puts someone 400 points clear of
    // everybody) takes whoever is nearest instead.
    const nearest = [...others].sort((a, b) =>
      Math.abs(a.score.total - target.score.total) - Math.abs(b.score.total - target.score.total));
    for (const p of nearest) {
      if (picked.length === LINEUP_SIZE - 1) break;
      if (!picked.includes(p) && picked.every((q) => q.score.total !== p.score.total)) picked.push(p);
    }
    const standing = shuffle([target, ...picked], random);
    rounds.push({ total: target.score.total, people: standing, answer: standing.indexOf(target) });
    pool = pool.filter((p) => !standing.includes(p));
  }
  return rounds;
}

const AGE = (text) => {
  if (text === '20 to 29') return 'In their twenties';
  if (text === '45 or more') return '45 or older';
  return `Aged ${text}`;
};
const EDUCATION = ['No secondary school diploma', 'Secondary school diploma',
  'A one-year post-secondary credential', 'A two-year post-secondary credential',
  "A bachelor's degree or other credential of three years or more",
  'Two or more credentials, one of three years or more',
  "A master's or professional degree", 'A doctorate'];
const CLB1 = ['CLB 3 or lower', 'CLB 4–5', 'CLB 6', 'CLB 7', 'CLB 8', 'CLB 9', 'CLB 10 or higher'];
const CLB2 = [null, 'CLB 5–6', 'CLB 7–8', 'CLB 9 or higher'];
const WAGE = [null, '1.3× the median wage', '1.5× the median wage', '2× the median wage'];
const YEARS = [null, 'One year', 'Two years', 'Three years', 'Four years', 'Five or more years'];
const FOREIGN = [null, 'One or two years', 'Three or more years'];
const STUDY = [null, 'a one- or two-year credential', 'a credential of three years or more'];

// A person as a few short lines. Attributes only: no name, origin or occupation. Every
// attribute that scores is in here, so two people with different scores never read alike.
export function bioLines(profile, spousePoints = 0) {
  const p = profile;
  const [strong, weak] = p.first ? ['French', 'English'] : ['English', 'French'];
  const lines = [
    `${AGE(BY_KEY.age.options[p.age])}, ${p.spouse
      ? `with a spouse who brings ${spousePoints} points`
      : 'no accompanying spouse'}.`,
    `${EDUCATION[p.edu]}.`,
    `${strong} at ${CLB1[p.lang1]}; ${p.lang2 ? `${weak} at ${CLB2[p.lang2]}` : `little or no ${weak}`}.`,
    p.cwe
      ? `${YEARS[p.cwe]} of work in Canada${p.hw ? `, paid ${WAGE[p.hw]}` : ''}.`
      : 'No work in Canada.',
  ];
  if (p.offer) lines.push(`A job offer at ${WAGE[p.offer]}.`);
  lines.push(p.foreign ? `${FOREIGN[p.foreign]} of work abroad.` : 'No work abroad.');
  if (p.canEdu) lines.push(`Studied in Canada for ${STUDY[p.canEdu]}.`);
  if (p.sibling) lines.push('Has a sibling in Canada.');
  if (p.pnp) lines.push('Nominated by a province.');
  return lines;
}
