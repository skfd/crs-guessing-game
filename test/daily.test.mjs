import test from 'node:test';
import assert from 'node:assert/strict';
import { answerForDay, dayNumber, shareText } from '../src/daily.js';

test('day 1 is 18 November 2026 and the day turns at local midnight', () => {
  assert.equal(dayNumber(new Date(2026, 10, 18, 0, 0, 1)), 1);
  assert.equal(dayNumber(new Date(2026, 10, 18, 23, 59, 59)), 1);
  assert.equal(dayNumber(new Date(2026, 10, 19, 0, 0, 1)), 2);
  assert.equal(dayNumber(new Date(2027, 2, 29, 12)), 132); // across a clock change
});

test('the answer list wraps around', () => {
  const file = { answers: [{ p: [0, 1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], sp: 0 }, { p: [1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0], sp: 12 }] };
  assert.equal(answerForDay(file, 1).profile.age, 1);
  assert.equal(answerForDay(file, 2).spousePoints, 12);
  assert.equal(answerForDay(file, 3).profile.age, 1);
});

test('the share text shows squares and nothing else', () => {
  const text = shareText({ label: '#12', rows: [['hit', 'close', 'miss'], ['hit', 'hit', 'hit']], won: true, url: 'https://example.test/' });
  assert.equal(text, 'CRS guessing game #12 2/6\n🟩🟨⬜\n🟩🟩🟩\nhttps://example.test/');
  assert.match(shareText({ label: '#12', rows: [['miss']], won: false }), /#12 X\/6\n⬜$/);
  assert.match(shareText({ label: '#12', rows: [['hit']], won: true, hard: true }), /#12 1\/6\*\n🟩$/);
});
