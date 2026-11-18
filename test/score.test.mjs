import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { score } from '../src/score.js';

// Everything "off": single, 20-29, less than secondary, no language, no work.
const BASE = {
  spouse: 0, age: 2, edu: 0, lang1: 0, lang2: 0, first: 0, cwe: 0, hw: 0, offer: 0,
  foreign: 0, canEdu: 0, sibling: 0, pnp: 0,
};
const person = (changes) => ({ ...BASE, ...changes });

// Expected values worked out by hand from the tables on canada.ca, not from this code.
test('the classic overseas profile: 29, master\'s, CLB 9, three years abroad', () => {
  const s = score(person({ edu: 6, lang1: 5, foreign: 2 }));
  assert.deepEqual(s, { core: 369, spouse: 0, transfer: 100, additional: 0, total: 469 });
});

test('30, bachelor\'s, CLB 10, one year of Canadian work', () => {
  const s = score(person({ age: 3, edu: 4, lang1: 6, cwe: 1 }));
  assert.deepEqual(s, { core: 401, spouse: 0, transfer: 38, additional: 0, total: 439 });
});

test('with a spouse the lower column is used and the spouse points are added', () => {
  const s = score(person({
    spouse: 1, age: 8, edu: 5, lang1: 4, lang2: 1, cwe: 3, hw: 2, offer: 1, foreign: 1,
    canEdu: 1, sibling: 1,
  }), 25);
  assert.deepEqual(s, { core: 377, spouse: 25, transfer: 88, additional: 30, total: 520 });
});

test('spouse points are ignored for a single person', () => {
  assert.equal(score(person({}), 25).spouse, 0);
});

test('labour market factor is the better path, never the sum', () => {
  // 2x offer alone
  assert.equal(score(person({ age: 18, edu: 1, offer: 3 })).core, 130);
  // work path 64 + 40 = 104 beats a 100-point offer
  const both = score(person({ cwe: 3, hw: 2, offer: 3 })).core;
  const workOnly = score(person({ cwe: 3, hw: 2 })).core;
  assert.equal(both, workOnly);
  assert.equal(workOnly - score(person({})).core, 104);
  // with a spouse, 5+ years (70) ties a 1.5x offer (70)
  assert.equal(score(person({ spouse: 1, cwe: 5, offer: 2 })).core,
    score(person({ spouse: 1, cwe: 5 })).core);
});

test('a high-wage tier needs Canadian work', () => {
  assert.deepEqual(score(person({ hw: 3 })), score(person({})));
});

test('transferability: each pair caps at 50 and the section at 100', () => {
  // doctorate + CLB 9 (50) + 2 years Canadian (50) -> 50
  assert.equal(score(person({ edu: 7, lang1: 5, cwe: 2 })).transfer, 50);
  // foreign 3+ with CLB 9 (50) and 2 years Canadian (50) -> 50
  assert.equal(score(person({ lang1: 5, cwe: 2, foreign: 2 })).transfer, 50);
  // both pairs maxed -> 100
  assert.equal(score(person({ edu: 7, lang1: 5, cwe: 2, foreign: 2 })).transfer, 100);
  // CLB 7-8 halves: one-year credential 13, foreign 1-2 years 13
  assert.equal(score(person({ edu: 2, lang1: 3, foreign: 1 })).transfer, 26);
  // secondary school earns nothing
  assert.equal(score(person({ edu: 1, lang1: 6, cwe: 5 })).transfer, 0);
});

test('second language caps at 22 with a spouse, 24 without', () => {
  const single = score(person({ lang1: 5, lang2: 3 })).core - score(person({ lang1: 5 })).core;
  const married = score(person({ spouse: 1, lang1: 5, lang2: 3 })).core
    - score(person({ spouse: 1, lang1: 5 })).core;
  assert.equal(single, 24);
  assert.equal(married, 22);
});

test('French bonus depends on the English level', () => {
  // French first at CLB 7, no English: 25
  assert.deepEqual(score(person({ edu: 4, lang1: 3, first: 1 })),
    { core: 298, spouse: 0, transfer: 13, additional: 25, total: 336 });
  // ... with English at CLB 5-6: 50
  assert.equal(score(person({ edu: 4, lang1: 3, lang2: 1, first: 1 })).total, 365);
  // English first, French second at 7-8: 50
  assert.equal(score(person({ lang1: 4, lang2: 2 })).additional, 50);
  // French below 7 earns nothing
  assert.equal(score(person({ lang1: 2, lang2: 1, first: 1 })).additional, 0);
  assert.equal(score(person({ lang1: 5, lang2: 1 })).additional, 0);
});

test('additional points cap at 600', () => {
  const s = score(person({ edu: 6, lang1: 5, pnp: 1, sibling: 1, canEdu: 2 }));
  assert.deepEqual(s, { core: 369, spouse: 0, transfer: 50, additional: 600, total: 1019 });
});

test('the maximum is 1,270', () => {
  const s = score(person({
    edu: 7, lang1: 6, lang2: 3, cwe: 5, hw: 3, foreign: 2, canEdu: 2, sibling: 1, pnp: 1,
  }));
  assert.deepEqual(s, { core: 570, spouse: 0, transfer: 100, additional: 600, total: 1270 });
});

test('a full married profile', () => {
  const s = score(person({
    spouse: 1, age: 4, edu: 7, lang1: 5, lang2: 3, cwe: 5, hw: 3, foreign: 2, canEdu: 2,
    sibling: 1,
  }), 0);
  assert.deepEqual(s, { core: 508, spouse: 0, transfer: 100, additional: 95, total: 703 });
});

// Outputs of IRCC's own calculator, when someone has built them (tools/ircc-oracle.mjs).
const vectorsUrl = new URL('./ircc-vectors.json', import.meta.url);
test('matches IRCC\'s calculator', { skip: !fs.existsSync(vectorsUrl) && 'test/ircc-vectors.json not built' }, () => {
  const { vectors } = JSON.parse(fs.readFileSync(vectorsUrl, 'utf8'));
  for (const v of vectors) {
    assert.deepEqual(score(v.profile, v.spousePoints), v.expected, JSON.stringify(v.profile));
  }
});
