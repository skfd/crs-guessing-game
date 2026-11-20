import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ATTRIBUTES, KEYS, LOWER_ORDER } from '../src/attributes.js';
import { score, sameScore, tidy } from '../src/score.js';
import { canonical, compare, compareAttribute, nearestOpen, stillPossible } from '../src/profile.js';
import { rng } from '../src/rng.js';

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const answersFile = read('../data/answers.json');
const bandsFile = read('../data/bands.json');
const answers = answersFile.answers.map((a) => ({
  profile: Object.fromEntries(KEYS.map((k, i) => [k, a.p[i]])), spousePoints: a.sp,
}));

function randomProfile(random) {
  const p = {};
  for (const a of ATTRIBUTES) p[a.key] = Math.floor(random() * a.options.length);
  return p;
}

test('canonical keeps the score, is stable, and leaves nothing lowerable', () => {
  const random = rng(7);
  for (let n = 0; n < 3000; n += 1) {
    const raw = randomProfile(random);
    const sp = raw.spouse ? Math.floor(random() * 41) : 0;
    const { profile } = canonical(raw, sp);
    const s = score(profile, sp);
    assert.ok(sameScore(s, score(raw, sp)), 'score changed');
    assert.deepEqual(canonical(profile, sp).profile, profile, 'not stable');
    for (const key of LOWER_ORDER) {
      for (let i = 0; i < profile[key]; i += 1) {
        const q = tidy({ ...profile, [key]: i });
        if (q[key] !== i) continue;
        assert.ok(!sameScore(score(q, sp), s), `${key} could still be lowered: ${JSON.stringify(profile)}`);
      }
    }
  }
});

test('canonical drops what the score cannot see', () => {
  const base = {
    spouse: 0, age: 2, edu: 6, lang1: 5, lang2: 0, first: 0, cwe: 0, hw: 0, offer: 0,
    foreign: 0, canEdu: 0, sibling: 0, pnp: 0,
  };
  // sibling and Canadian study under a nomination
  assert.deepEqual(canonical({ ...base, pnp: 1, sibling: 1, canEdu: 2 }).lowered, ['canEdu', 'sibling']);
  // an offer that loses to the work path
  assert.deepEqual(canonical({ ...base, cwe: 3, hw: 2, offer: 3 }).lowered, ['offer']);
  // foreign work with weak language and no Canadian work
  assert.deepEqual(canonical({ ...base, lang1: 2, foreign: 2 }).lowered, ['foreign']);
  // "stronger in French" below NCLC 7
  assert.deepEqual(canonical({ ...base, lang1: 2, first: 1 }).lowered, ['first']);
  // nothing to drop
  assert.deepEqual(canonical({ ...base, foreign: 2, sibling: 1 }).lowered, []);
});

test('feedback colours and arrows', () => {
  assert.deepEqual(compareAttribute('age', 5, 5), { state: 'hit', arrow: null });
  assert.deepEqual(compareAttribute('age', 5, 7), { state: 'close', arrow: 'up' });
  assert.deepEqual(compareAttribute('age', 5, 8), { state: 'miss', arrow: null });
  assert.deepEqual(compareAttribute('edu', 6, 5), { state: 'close', arrow: 'down' });
  assert.deepEqual(compareAttribute('foreign', 0, 1), { state: 'miss', arrow: null });
  assert.deepEqual(compareAttribute('sibling', 0, 1), { state: 'miss', arrow: null });
  const a = answers[0].profile;
  assert.ok(compare(a, a).won);
  assert.ok(!compare({ ...a, age: (a.age + 1) % 19 }, a).won);
});

test('feedback never rules out the right option, and a hit leaves only it', () => {
  const random = rng(11);
  for (const { profile: answer, spousePoints } of answers) {
    const seen = Object.fromEntries(KEYS.map((k) => [k, []]));
    for (let n = 0; n < 6; n += 1) {
      const guess = canonical(randomProfile(random), spousePoints).profile;
      for (const c of compare(guess, answer).cells) {
        seen[c.key].push(c);
        const open = stillPossible(c.key, seen[c.key]);
        assert.ok(open[answer[c.key]], `${c.key}: the answer was ruled out`);
        assert.ok(!open[c.value] || c.state === 'hit', `${c.key}: a wrong guess is still open`);
        if (c.state === 'hit') assert.equal(open.filter(Boolean).length, 1);
      }
    }
  }
});

test('nearestOpen stays put when it can and otherwise takes the nearest, lower on a tie', () => {
  assert.equal(nearestOpen([false, true, false, true], 1), 1);
  assert.equal(nearestOpen([true, false, false, false, true], 2), 0);
  assert.equal(nearestOpen([false, false, false, true], 0), 3);
  assert.equal(nearestOpen([true, false, false], 2), 0);
});

test('every answer is a valid canonical profile', () => {
  assert.deepEqual(answersFile.keys, KEYS);
  assert.ok(answers.length >= 365);
  const seen = new Set();
  for (const { profile, spousePoints } of answers) {
    for (const a of ATTRIBUTES) {
      assert.ok(Number.isInteger(profile[a.key]) && profile[a.key] >= 0
        && profile[a.key] < a.options.length, `${a.key} out of range`);
    }
    assert.ok(spousePoints >= 0 && spousePoints <= 40);
    if (!profile.spouse) assert.equal(spousePoints, 0);
    assert.deepEqual(canonical(profile, spousePoints).profile, profile);
    seen.add(JSON.stringify(profile));
  }
  assert.equal(seen.size, answers.length, 'duplicate answers');
});

test('answer scores follow the published bands', () => {
  const total = bandsFile.bands.reduce((s, b) => s + b.count, 0);
  // Coarse groups, so that a year of answers is enough to compare.
  const groups = [[601, 1270], [501, 600], [451, 500], [401, 450], [351, 400], [0, 350]];
  for (const [lo, hi] of groups) {
    const expected = bandsFile.bands.filter((b) => b.lo >= lo && b.hi <= hi)
      .reduce((s, b) => s + b.count, 0) / total;
    const got = answers.filter(({ profile, spousePoints }) => {
      const t = score(profile, spousePoints).total;
      return t >= lo && t <= hi;
    }).length / answers.length;
    assert.ok(Math.abs(got - expected) < 0.08, `${lo}-${hi}: expected ${expected.toFixed(3)}, got ${got.toFixed(3)}`);
  }
});
