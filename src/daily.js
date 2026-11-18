// Which person is today's, and the text of the share grid. No DOM in here.

import { KEYS } from './attributes.js';

export const TITLE = 'CRS guessing game'; // working title, see README
export const MAX_GUESSES = 6;
const FIRST_DAY = [2026, 10, 18]; // 18 November 2026, local time; month is zero-based

// Day 1 is the first day. Counted in the player's own calendar, so the person changes at
// local midnight.
export function dayNumber(now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - Date.UTC(...FIRST_DAY)) / 86400000) + 1;
}

export function answerForDay(answersFile, day) {
  const list = answersFile.answers;
  const entry = list[(((day - 1) % list.length) + list.length) % list.length];
  return {
    profile: Object.fromEntries(KEYS.map((k, i) => [k, entry.p[i]])),
    spousePoints: entry.sp,
  };
}

const SQUARE = { hit: '🟩', close: '🟨', miss: '⬜' };

// `rows` is one array of cell states per guess. Nothing in the text gives a value away.
export function shareText({ label, rows, won, url }) {
  const result = won ? rows.length : 'X';
  const grid = rows.map((cells) => cells.map((state) => SQUARE[state]).join('')).join('\n');
  return `${TITLE} ${label} ${result}/${MAX_GUESSES}\n${grid}${url ? `\n${url}` : ''}`;
}
