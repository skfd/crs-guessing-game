import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ATTRIBUTES, KEYS } from '../src/attributes.js';
import { score, tidy, SECTIONS } from '../src/score.js';
import { shareText } from '../src/daily.js';
import { rng } from '../src/rng.js';
import {
  CLUES, MODES, PERSON_VARIANTS, VARIANT_OFFSETS, closeness, parseVariant, revealedSections,
  steps, variantId, variantName, variantOffset,
} from '../src/modes.js';
import { KEEP_AWAY_DAYS, LINEUP_SIZE, ROUNDS, bioLines, people, reserved, roundsForDay } from '../src/rounds.js';

const answersFile = JSON.parse(fs.readFileSync(new URL('../data/answers.json', import.meta.url), 'utf8'));
const variant = (query) => parseVariant(new URLSearchParams(query));

test('the bare address is the original game, and nonsense falls back to it', () => {
  assert.deepEqual(variant(''), { mode: 'person', clue: 'full' });
  assert.deepEqual(variant('mode=nope&clue=nope'), { mode: 'person', clue: 'full' });
  assert.deepEqual(variant('mode=score'), { mode: 'score', clue: 'total' });
  assert.deepEqual(variant('mode=score&clue=reveal'), { mode: 'score', clue: 'reveal' });
  assert.deepEqual(variant('mode=lineup&clue=full'), { mode: 'lineup', clue: null });
  assert.equal(variantId('person', 'full'), '');
  assert.equal(variantOffset('person', 'full'), 0);
  assert.equal(variantName('person', 'full'), '');
  assert.equal(variantName('score', 'total'), 'hit the score');
  assert.equal(variantName('person', 'reveal'), 'a section per miss');
});

test('every guessing variant has its own save and its own person every day', () => {
  const ids = new Set();
  for (const m of MODES.filter((x) => x.key !== 'lineup')) {
    for (const c of CLUES) {
      assert.ok(PERSON_VARIANTS.includes(`${m.key}-${c.key}`), `${m.key}-${c.key} has no offset`);
      ids.add(variantId(m.key, c.key));
    }
  }
  assert.equal(ids.size, PERSON_VARIANTS.length);
  const count = answersFile.answers.length;
  assert.equal(new Set(VARIANT_OFFSETS.map((o) => o % count)).size, VARIANT_OFFSETS.length);
});

test('a clue never shows more sections than it should', () => {
  const all = SECTIONS.map((s) => s.key);
  assert.deepEqual(revealedSections('full', 0), all);
  assert.deepEqual(revealedSections('total', 5), []);
  assert.deepEqual(revealedSections('total', 5, true), all);
  assert.deepEqual(revealedSections('reveal', 0), []);
  assert.equal(revealedSections('reveal', 2).length, 2);
  assert.deepEqual([...revealedSections('reveal', 9)].sort(), [...all].sort());
  assert.equal(revealedSections('reveal', 3).includes('core'), false, 'core is shown last');
});

test('step hints are the real change in the total', () => {
  const random = rng(11);
  for (let n = 0; n < 500; n += 1) {
    const raw = Object.fromEntries(ATTRIBUTES.map((a) => [a.key, Math.floor(random() * a.options.length)]));
    const sp = raw.spouse ? Math.floor(random() * 41) : 0;
    const p = tidy(raw);
    const total = score(p, sp).total;
    const hints = steps(raw, sp);
    for (const a of ATTRIBUTES) {
      for (const [name, d] of [['down', -1], ['up', 1]]) {
        const i = p[a.key] + d;
        const hint = hints[a.key][name];
        if (i < 0 || i >= a.options.length) { assert.equal(hint, null); continue; }
        const q = tidy({ ...p, [a.key]: i });
        if (q[a.key] !== i) assert.equal(hint, null, 'a step the form does not allow');
        else assert.equal(hint, score(q, sp).total - total);
      }
    }
  }
});

test('closeness squares and the one-line share text', () => {
  assert.equal(closeness(0), 'hit');
  assert.equal(closeness(-20), 'close');
  assert.equal(closeness(21), 'miss');
  assert.equal(
    shareText({ label: '#3 line-up', rows: [['hit', 'miss', 'hit']], result: 2, max: 5 }),
    'CRS guessing game #3 line-up 2/5\n🟩⬜🟩');
});

test('every day of line-up has five fair rounds', () => {
  const count = answersFile.answers.length;
  for (let day = 1; day <= count; day += 1) {
    const rounds = roundsForDay(answersFile, day);
    assert.equal(rounds.length, ROUNDS);
    const away = reserved(day, count);
    const seen = new Set();
    for (const round of rounds) {
      assert.equal(round.people.length, LINEUP_SIZE);
      const matches = round.people.filter((p) => p.score.total === round.total);
      assert.equal(matches.length, 1, `day ${day}: not exactly one match`);
      assert.equal(round.people[round.answer], matches[0]);
      assert.equal(new Set(round.people.map((p) => p.score.total)).size, LINEUP_SIZE);
      assert.equal(new Set(round.people.map((p) => bioLines(p.profile, p.spousePoints).join('|'))).size, LINEUP_SIZE);
      for (const p of round.people) {
        assert.ok(!away.has(p.index), `day ${day}: shows a person a guessing mode hides`);
        assert.ok(!seen.has(p.index), `day ${day}: the same person twice`);
        seen.add(p.index);
      }
    }
  }
  assert.deepEqual(roundsForDay(answersFile, 3), roundsForDay(answersFile, 3), 'not repeatable');
});

test('line-up keeps away from the people the guessing modes hide this week', () => {
  const count = answersFile.answers.length;
  const away = reserved(10, count);
  assert.equal(away.size, KEEP_AWAY_DAYS * VARIANT_OFFSETS.length);
  for (const offset of VARIANT_OFFSETS) assert.ok(away.has((10 - 1 + offset) % count));
});

test('a description covers everything that scores', () => {
  const all = people(answersFile);
  const texts = new Map();
  for (const p of all) {
    const text = bioLines(p.profile, p.spousePoints).join('|');
    assert.doesNotMatch(text, /undefined|null/);
    const key = JSON.stringify([KEYS.map((k) => p.profile[k]), p.spousePoints]);
    if (texts.has(text)) assert.equal(texts.get(text), key, 'two different people read alike');
    texts.set(text, key);
  }
});
