// profile -> CRS points. The only place the rules are applied.

import * as T from './tables.js';

// Fixes the two combinations a profile cannot hold: a second language stronger than the
// first, and a high-wage tier on Canadian work that does not exist.
export function tidy(p) {
  const q = { ...p };
  while (T.LANG2_CLB[q.lang2] > T.LANG1_CLB[q.lang1]) q.lang2 -= 1;
  if (q.cwe === 0) q.hw = 0;
  return q;
}

// Returns the four section subtotals and the total. `spousePoints` is the spouse section
// (0-40) used when the profile has an accompanying spouse; see README for why the spouse
// is not guessed attribute by attribute.
export function score(profile, spousePoints = 0) {
  const p = tidy(profile);
  const col = p.spouse ? 0 : 1;
  const clb1 = T.LANG1_CLB[p.lang1];
  const clb2 = T.LANG2_CLB[p.lang2];

  // A. Core / human capital
  const age = T.AGE[col][p.age];
  const education = T.EDUCATION[col][p.edu];
  const language1 = 4 * T.LANG1_PER_ABILITY[col][p.lang1];
  const language2 = Math.min(4 * T.LANG2_PER_ABILITY[p.lang2], T.LANG2_CAP[col]);
  const workPath = T.CANADIAN_WORK[col][p.cwe] + T.HIGH_WAGE_WORK[p.hw];
  const offerPath = T.JOB_OFFER[p.offer];
  const labourMarket = Math.max(workPath, offerPath);
  const core = age + education + language1 + language2 + labourMarket;

  // B. Spouse
  const spouse = p.spouse ? spousePoints : 0;

  // C. Skill transferability. Uses the length of Canadian work whichever path won above.
  const langHalf = clb1 >= 9 ? 2 : clb1 >= 7 ? 1 : 0;
  const workHalf = p.cwe >= 2 ? 2 : p.cwe;
  const eduTier = p.edu >= 5 ? 2 : p.edu >= 2 ? 1 : 0;
  const educationPair = Math.min(
    T.TRANSFER[eduTier][langHalf] + T.TRANSFER[eduTier][workHalf], T.TRANSFER_PAIR_CAP);
  const foreignPair = Math.min(
    T.TRANSFER[p.foreign][langHalf] + T.TRANSFER[p.foreign][workHalf], T.TRANSFER_PAIR_CAP);
  const transfer = Math.min(educationPair + foreignPair, T.TRANSFER_CAP);

  // D. Additional. French counts at NCLC 7+; the size of the bonus depends on English.
  let french = 0;
  if (p.first === 1 && clb1 >= 7) {
    french = clb2 >= 5 ? T.FRENCH_BONUS.withEnglish : T.FRENCH_BONUS.withWeakEnglish;
  } else if (p.first === 0 && clb2 >= 7) {
    french = T.FRENCH_BONUS.withEnglish;
  }
  const additional = Math.min(
    (p.sibling ? T.SIBLING : 0) + T.CANADIAN_EDUCATION[p.canEdu] + french
      + (p.pnp ? T.NOMINATION : 0),
    T.ADDITIONAL_CAP);

  return { core, spouse, transfer, additional, total: core + spouse + transfer + additional };
}

export const SECTIONS = [
  { key: 'core', label: 'Core' },
  { key: 'spouse', label: 'Spouse' },
  { key: 'transfer', label: 'Transferability' },
  { key: 'additional', label: 'Additional' },
];

export function sameScore(a, b) {
  return SECTIONS.every((s) => a[s.key] === b[s.key]);
}
