import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KEYS } from '../src/attributes.js';
import { compare } from '../src/profile.js';
import { tidy } from '../src/score.js';
import {
  GROUPINGS, RULES, combos, compareGrouped, compareValues, parseTuples, stillPossibleGroup,
} from '../src/groups.js';

const file = JSON.parse(fs.readFileSync(new URL('../data/answers.json', import.meta.url), 'utf8'));
const people = file.answers.map((entry) => Object.fromEntries(KEYS.map((k, i) => [k, entry.p[i]])));
const group = (name, id) => GROUPINGS[name].find((g) => g.id === id);

test('every grouping holds each attribute exactly once', () => {
  for (const grouping of Object.values(GROUPINGS)) {
    assert.deepEqual(grouping.flatMap((g) => g.keys).sort(), [...KEYS].sort());
  }
});

test('a joined group offers only combinations that can exist', () => {
  assert.equal(combos(group('pairs', 'cwe+hw')).length, 21); // none, then 5 lengths x 4 tiers
  assert.equal(combos(group('pairs', 'lang1+lang2')).length, 19);
  for (const grouping of Object.values(GROUPINGS)) {
    for (const g of grouping) {
      for (const combo of combos(g)) {
        const p = { ...people[0], ...Object.fromEntries(g.keys.map((k, x) => [k, combo[x]])) };
        const kept = tidy(p);
        // Only what the group holds both halves of is the group's to keep possible.
        if (g.keys.includes('lang1') && g.keys.includes('lang2')) assert.equal(kept.lang2, p.lang2);
        if (g.keys.includes('cwe') && g.keys.includes('hw')) assert.equal(kept.hw, p.hw);
      }
    }
  }
});

test('with nothing joined the colours are the ones the game always gave', () => {
  for (let i = 1; i < people.length; i += 1) {
    const was = compare(people[i - 1], people[i]);
    const now = compareGrouped(GROUPINGS.none, people[i - 1], people[i]);
    assert.equal(now.won, was.won);
    assert.deepEqual(now.cells.map((c) => [c.keys[0], c.values[0], c.state, c.arrow]),
      was.cells.map((c) => [c.key, c.value, c.state, c.arrow]));
  }
});

test('a joined cell counts its right parts and never says which', () => {
  const work = group('pairs', 'cwe+hw');
  assert.deepEqual(compareValues(work, [2, 1], [2, 1]), { state: 'hit', arrow: null, right: 2 });
  assert.deepEqual(compareValues(work, [2, 1], [2, 3]), { state: 'close', arrow: null, right: 1 });
  assert.deepEqual(compareValues(work, [2, 1], [3, 1]), { state: 'close', arrow: null, right: 1 });
  assert.deepEqual(compareValues(work, [2, 1], [3, 2]), { state: 'miss', arrow: null, right: 0 });
  // Under 'all' one right part looks the same as none.
  assert.deepEqual(compareValues(work, [2, 1], [2, 3], 'all'), compareValues(work, [2, 1], [3, 2], 'all'));
});

test('the answer is never ruled out, and a green cell leaves only it', () => {
  for (const [name, grouping] of Object.entries(GROUPINGS)) {
    if (name === 'themes') continue; // too many combinations to be worth the time
    for (const rule of RULES) {
      for (let i = 2; i < 40; i += 1) {
        const answer = people[i];
        const seen = [people[i - 1], people[i - 2]].map((guess) => compareGrouped(grouping, guess, answer, rule).cells);
        grouping.forEach((g, j) => {
          const open = stillPossibleGroup(g, seen.map((cells) => cells[j]), rule);
          const at = combos(g).findIndex((c) => c.every((v, x) => v === answer[g.keys[x]]));
          assert.ok(open[at], `${name} ${rule} ${g.id}`);
          if (seen.some((cells) => cells[j].state === 'hit')) assert.equal(open.filter(Boolean).length, 1);
        });
      }
    }
  }
});

test('the address names a grouping, and anything else is the game as it was', () => {
  assert.equal(parseTuples('pairs').grouping, GROUPINGS.pairs);
  assert.deepEqual([parseTuples('pairs-all').id, parseTuples('pairs-all').rule], ['pairs-all', 'all']);
  assert.deepEqual([parseTuples('pairs').guesses, parseTuples('pairs-all').guesses], [undefined, 4]);
  for (const asked of [null, '', 'none', 'nonsense', 'themes', 'pairs-']) {
    assert.deepEqual([parseTuples(asked).id, parseTuples(asked).grouping], ['', GROUPINGS.none]);
  }
});
