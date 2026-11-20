// A second opinion on src/score.js. The expected numbers below are the ones another
// project's test suite asserts for the same rules: muhac/ee-crs-planner (MIT),
// src/engine/crs.test.ts, read on 2026-11-20. Only its numbers were taken, re-expressed as
// profiles of this game; none of its code was run. It was written independently of this
// repo, so agreement here is evidence the tables and caps were read the same way twice.
// It is not IRCC's calculator: that comparison is still tools/ircc-oracle.mjs, never run.
//
// Left out because this game cannot express them: mixed levels across the four language
// abilities, the certificate of qualification, and the spouse's own factors.

import test from 'node:test';
import assert from 'node:assert/strict';
import { score } from '../src/score.js';

// Someone who scores nothing: 45 or older, no schooling, no language, no work.
const ZERO = { spouse: 0, age: 18, edu: 0, lang1: 0, lang2: 0, first: 0, cwe: 0, hw: 0,
  offer: 0, foreign: 0, canEdu: 0, sibling: 0, pnp: 0 };
const of = (changes, spousePoints = 0) => score({ ...ZERO, ...changes }, spousePoints);
const age = (years) => (years <= 19 ? years - 18 : years <= 29 ? 2 : years >= 45 ? 18 : years - 27);
const clb = (level) => (level <= 3 ? 0 : level <= 5 ? 1 : Math.min(level, 10) - 4);
const clb2 = (level) => (level <= 4 ? 0 : level <= 6 ? 1 : level <= 8 ? 2 : 3);

test('second opinion: a person with nothing scores nothing', () => {
  assert.deepEqual(of({}), { core: 0, spouse: 0, transfer: 0, additional: 0, total: 0 });
});

test('second opinion: age', () => {
  const single = [[18, 99], [19, 105], [20, 110], [29, 110], [30, 105], [31, 99], [32, 94],
    [33, 88], [34, 83], [35, 77], [36, 72], [37, 66], [38, 61], [39, 55], [40, 50], [41, 39],
    [42, 28], [43, 17], [44, 6], [45, 0], [50, 0]];
  for (const [years, points] of single) assert.equal(of({ age: age(years) }).core, points, `age ${years}`);
  const married = [[18, 90], [19, 95], [25, 100], [30, 95], [35, 70], [40, 45], [44, 5], [45, 0]];
  for (const [years, points] of married) {
    assert.equal(of({ age: age(years), spouse: 1 }).core, points, `age ${years} with spouse`);
  }
});

test('second opinion: education', () => {
  const cases = [[0, 0], [30, 28], [90, 84], [98, 91], [120, 112], [128, 119], [135, 126], [150, 140]];
  cases.forEach(([single, married], edu) => {
    assert.equal(of({ edu }).core, single);
    assert.equal(of({ edu, spouse: 1 }).core, married);
  });
});

test('second opinion: first and second official language', () => {
  const perAbility = [[3, 0, 0], [4, 6, 6], [5, 6, 6], [6, 9, 8], [7, 17, 16], [8, 23, 22],
    [9, 31, 29], [10, 34, 32], [12, 34, 32]];
  for (const [level, single, married] of perAbility) {
    // Education is left at none, so language adds no transferability to confuse the core.
    assert.equal(of({ lang1: clb(level) }).core, single * 4, `CLB ${level}`);
    assert.equal(of({ lang1: clb(level), spouse: 1 }).core, married * 4, `CLB ${level} with spouse`);
  }
  const first = of({ lang1: clb(9) }).core;
  for (const [level, points] of [[4, 0], [5, 4], [6, 4], [7, 12], [8, 12], [9, 24]]) {
    assert.equal(of({ lang1: clb(9), lang2: clb2(level) }).core - first, points, `second at CLB ${level}`);
  }
  assert.equal(of({ lang1: clb(9), lang2: 3, spouse: 1 }).core - of({ lang1: clb(9), spouse: 1 }).core, 22);
});

test('second opinion: Canadian work, high wage and the job offer', () => {
  const years = [[0, 0, 0], [1, 40, 35], [2, 53, 46], [3, 64, 56], [4, 72, 63], [5, 80, 70]];
  for (const [cwe, single, married] of years) {
    assert.equal(of({ cwe }).core, single);
    assert.equal(of({ cwe, spouse: 1 }).core, married);
  }
  [0, 20, 40, 70].forEach((points, hw) => {
    assert.equal(of({ cwe: 0, hw }).core, 0, 'a wage tier with no work');
    assert.equal(of({ cwe: 1, hw }).core, 40 + points);
    assert.equal(of({ cwe: 1, hw, spouse: 1 }).core, 35 + points);
  });
  assert.equal(of({ cwe: 5, hw: 3 }).core, 150);
  assert.equal(of({ cwe: 5, hw: 3, spouse: 1 }).core, 140);
  [0, 50, 70, 100].forEach((points, offer) => {
    assert.equal(of({ offer }).core, points);
    assert.equal(of({ offer, spouse: 1 }).core, points);
  });
  assert.equal(of({ cwe: 1, offer: 3 }).core, 100, 'the offer wins');
  assert.equal(of({ cwe: 5, hw: 1, offer: 2 }).core, 100, 'the work wins');
  assert.equal(of({ edu: 4, cwe: 2, hw: 3 }).transfer, of({ edu: 4, cwe: 2 }).transfer);
});

test('second opinion: skill transferability', () => {
  const t = (changes) => of(changes).transfer;
  assert.equal(t({ edu: 4, lang1: clb(7) }), 13);
  assert.equal(t({ edu: 4, lang1: clb(9) }), 25);
  for (const edu of [5, 6, 7]) {
    assert.equal(t({ edu, lang1: clb(7) }), 25);
    assert.equal(t({ edu, lang1: clb(9) }), 50);
  }
  assert.equal(t({ edu: 1, lang1: clb(10) }), 0);
  assert.equal(t({ edu: 4, cwe: 1 }), 13);
  assert.equal(t({ edu: 4, cwe: 2 }), 25);
  assert.equal(t({ edu: 6, cwe: 1 }), 25);
  assert.equal(t({ edu: 6, cwe: 2 }), 50);
  assert.equal(t({ edu: 7, lang1: clb(9), cwe: 2 }), 50, 'the education pair caps at 50');
  assert.equal(t({ foreign: 1, lang1: clb(7) }), 13);
  assert.equal(t({ foreign: 1, lang1: clb(9) }), 25);
  assert.equal(t({ foreign: 2, lang1: clb(7) }), 25);
  assert.equal(t({ foreign: 2, lang1: clb(9) }), 50);
  assert.equal(t({ foreign: 2, lang1: clb(6) }), 0);
  assert.equal(t({ foreign: 0, lang1: clb(9) }), 0);
  assert.equal(t({ foreign: 1, cwe: 1 }), 13);
  assert.equal(t({ foreign: 1, cwe: 2 }), 25);
  assert.equal(t({ foreign: 2, cwe: 1 }), 25);
  assert.equal(t({ foreign: 2, cwe: 2 }), 50);
  assert.equal(t({ foreign: 2, cwe: 2, lang1: clb(9) }), 50, 'the foreign pair caps at 50');
  assert.equal(t({ edu: 7, lang1: clb(9), cwe: 2, foreign: 2 }), 100);
});

test('second opinion: additional points', () => {
  const a = (changes) => of(changes).additional;
  assert.equal(a({ sibling: 1 }), 15);
  assert.equal(a({ pnp: 1 }), 600);
  assert.equal(a({ canEdu: 1 }), 15);
  assert.equal(a({ canEdu: 2 }), 30);
  assert.equal(a({ first: 1, lang1: clb(7), lang2: clb2(5) }), 50, 'French first, some English');
  assert.equal(a({ first: 1, lang1: clb(7) }), 25, 'French first, no English');
  assert.equal(a({ first: 0, lang1: clb(9), lang2: clb2(7) }), 50, 'French second');
  assert.equal(a({ pnp: 1, sibling: 1, canEdu: 2, first: 1, lang1: clb(7), lang2: clb2(5) }), 600);
});

test('second opinion: whole people', () => {
  // 29, bachelor's, CLB 9, three years in Canada, a sibling, a spouse worth 23 points.
  assert.deepEqual(
    of({ spouse: 1, age: age(29), edu: 4, lang1: clb(9), cwe: 3, sibling: 1 }, 23),
    { core: 384, spouse: 23, transfer: 50, additional: 15, total: 472 });
  const most = { age: age(25), edu: 7, first: 1, lang1: clb(10), lang2: 3, cwe: 5, hw: 3, foreign: 2, pnp: 1 };
  assert.equal(of(most).total, of({ ...most, spouse: 1 }, 40).total, 'the maximum is the same either way');
});
