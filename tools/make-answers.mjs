// Builds data/answers.json: the fixed list of hidden people, one per day.
//
//   node tools/make-answers.mjs
//
// A person is sampled as a life lived forward (age, then an education possible by that age,
// then work years that fit after it), so the mix is plausible. A score band is drawn first,
// weighted by IRCC's published distribution of the pool (data/bands.json), and people are
// sampled until one lands in that band. Every weight below is this prototype's own guess:
// IRCC publishes score bands, not attributes.
//
// Nobody is nominated by a province, so the band above 600 is left out: a nomination is
// 600 points and such a score says nothing else about the person. Nobody scores under 250
// either: the band up to 300 is 3% of the pool, and the few people far down in it had
// nothing in most cells and stood 50 points clear of everyone else.
//
// The list is committed and the game reads it by day number, so changing this file does not
// move past or future answers until the list is deliberately rebuilt.

import fs from 'node:fs';
import { KEYS } from '../src/attributes.js';
import { score } from '../src/score.js';
import { canonical } from '../src/profile.js';
import { rng, pickWeighted } from '../src/rng.js';

const SEED = 20261118;
const DAYS = 366;
const TOP = 600; // bands that start above this are nominated people
const BOTTOM = 250; // nobody scores less: the lowest band is drawn as 250 to 300

const EDU_WEIGHT = [1, 5, 5, 8, 35, 12, 30, 4];
const EDU_MIN_AGE = [0, 18, 19, 20, 21, 23, 23, 27];
const EDU_DONE_AT = [16, 18, 19, 20, 22, 24, 24, 28];
const LANG1_WEIGHT = [1, 4, 8, 20, 22, 28, 17];
const LANG2_FLOOR = [0, 5, 7, 9];
const LANG1_CLB = [3, 5, 6, 7, 8, 9, 10];
const CWE_WEIGHT = [45, 25, 13, 9, 4, 4];
const HW_WEIGHT = [70, 15, 10, 5];
const OFFER_WEIGHT = [92, 3, 3, 2];
const SPOUSE_EDU = [0, 2, 6, 7, 8, 9, 10, 10];
const SPOUSE_LANG = [0, 4, 12, 20];
const SPOUSE_LANG_WEIGHT = [30, 25, 30, 15];
const SPOUSE_WORK = [0, 5, 7, 8, 9, 10];
const SPOUSE_WORK_WEIGHT = [60, 15, 10, 7, 4, 4];

function ageIndex(years) {
  if (years <= 19) return years - 18;
  if (years <= 29) return 2;
  if (years >= 45) return 18;
  return years - 27;
}

export function samplePerson(random) {
  // Age 19-48, bell-shaped around 30.
  const ages = Array.from({ length: 30 }, (_, i) => 19 + i);
  const years = ages[pickWeighted(random, ages.map((a) => Math.exp(-((a - 30) ** 2) / 72)))];

  const edu = pickWeighted(random, EDU_WEIGHT.map((w, i) => (years >= EDU_MIN_AGE[i] ? w : 0)));
  const workable = Math.max(0, years - EDU_DONE_AT[edu]);

  const lang1 = pickWeighted(random, LANG1_WEIGHT);
  let lang2 = 0;
  if (random() < 0.15) {
    const allowed = LANG2_FLOOR.map((floor, i) => (i > 0 && floor <= LANG1_CLB[lang1] ? 1 : 0));
    if (allowed.some(Boolean)) lang2 = pickWeighted(random, allowed);
  }
  const first = random() < 0.06 ? 1 : 0;

  const cwe = pickWeighted(random, CWE_WEIGHT.map((w, i) => (i <= workable ? w : 0)));
  const hw = cwe > 0 ? pickWeighted(random, HW_WEIGHT) : 0;
  const offer = pickWeighted(random, OFFER_WEIGHT);
  const left = workable - cwe;
  const foreign = pickWeighted(random, [35, left >= 1 ? 25 : 0, left >= 3 ? 40 : 0]);

  let canEdu = 0;
  if (random() < (cwe > 0 ? 0.45 : 0.08)) {
    canEdu = pickWeighted(random, [0, edu >= 2 ? 1 : 0, edu >= 4 ? 1 : 0].map((w, i) => (i ? w : 0)));
    if (edu < 2) canEdu = 0;
  }

  const spouse = random() < 0.3 ? 1 : 0;
  const spousePoints = spouse
    ? SPOUSE_EDU[pickWeighted(random, EDU_WEIGHT)]
      + SPOUSE_LANG[pickWeighted(random, SPOUSE_LANG_WEIGHT)]
      + SPOUSE_WORK[pickWeighted(random, SPOUSE_WORK_WEIGHT)]
    : 0;

  const raw = {
    spouse, age: ageIndex(years), edu, lang1, lang2, first, cwe, hw, offer, foreign, canEdu,
    sibling: random() < 0.08 ? 1 : 0,
  };
  return { profile: canonical(raw, spousePoints).profile, spousePoints };
}

export function makeAnswers(allBands, { seed = SEED, days = DAYS } = {}) {
  const bands = allBands.filter((b) => b.lo <= TOP).map((b) => ({ ...b, lo: Math.max(b.lo, BOTTOM) }));
  const random = rng(seed);
  const weights = bands.map((b) => b.count);
  const seen = new Set();
  const answers = [];
  while (answers.length < days) {
    const band = bands[pickWeighted(random, weights)];
    for (let tries = 0; tries < 200000; tries += 1) {
      const person = samplePerson(random);
      const { total } = score(person.profile, person.spousePoints);
      const id = JSON.stringify(person.profile);
      if (total >= band.lo && total <= band.hi && !seen.has(id)) {
        seen.add(id);
        answers.push({ p: KEYS.map((k) => person.profile[k]), sp: person.spousePoints });
        break;
      }
    }
  }
  return answers;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`
  || import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const bandsFile = JSON.parse(fs.readFileSync(new URL('../data/bands.json', import.meta.url), 'utf8'));
  const answers = makeAnswers(bandsFile.bands);
  const out = {
    note: 'Hidden people, one per day, in order. Built by tools/make-answers.mjs. p is the option index of each attribute in the order of ATTRIBUTES; sp is the spouse section points.',
    seed: SEED,
    bandsAsOf: bandsFile.asOf,
    keys: KEYS,
    answers,
  };
  const lines = answers.map((a) => `    ${JSON.stringify(a)}`).join(',\n');
  const head = JSON.stringify({ ...out, answers: [] }, null, 2).replace(/"answers": \[\]/, `"answers": [\n${lines}\n  ]`);
  fs.writeFileSync(new URL('../data/answers.json', import.meta.url), `${head}\n`);
  console.log(`wrote ${answers.length} answers`);
}
