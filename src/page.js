// What every mode's page needs: which variant and day this is, the answer list, saved
// progress, and two DOM helpers.

import { MODE, MODES, CLUES, parseVariant, variantId, variantName, variantOffset } from './modes.js';
import { TUPLE_CHOICES, parseTuples } from './groups.js';
import { practiceDay } from './rounds.js';
import { dayNumber } from './daily.js';

export const $ = (id) => document.getElementById(id);
export const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

export const params = new URLSearchParams(location.search);
export const practice = params.has('practice');
export const { mode, clue } = parseVariant(params);
export const answersFile = await (await fetch('data/answers.json')).json();
export const day = practice
  ? practiceDay(Math.random, answersFile.answers.length, variantOffset(mode, clue), dayNumber())
  : Number(params.get('day')) || dayNumber();

// Which attributes are picked and coloured together. Only "find the person" has colours
// to join.
export const tuples = parseTuples(mode === 'person' ? params.get('tuples') : '');
const tupleExtra = tuples.id ? { tuples: tuples.id } : {};

const name = [variantName(mode, clue), tuples.id ? `tuples ${tuples.id}` : ''].filter(Boolean).join(', ');
export const label = (practice ? 'practice' : `#${day}`) + (name ? ` ${name}` : '');
export const shareUrl = practice ? '' : location.origin + location.pathname + variantQuery(mode, clue, tupleExtra);

// The original game keeps its original key, so games saved before there were modes are
// still there. A game with tuples is another game: its guesses are coloured differently.
const id = [variantId(mode, clue), tuples.id ? `t-${tuples.id}` : ''].filter(Boolean).join(':');
const storageKey = `crs-guessing-game:v1:day:${day}${id ? `:${id}` : ''}`;

// Saved progress for this day and variant; practice games are never saved.
export function load() {
  if (practice) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return []; // a broken save is the same as no save
  }
}
export function save(value) {
  if (!practice) localStorage.setItem(storageKey, JSON.stringify(value));
}

// The query string that names a variant; empty for the original game.
function variantQuery(toMode, toClue, extra = {}) {
  const q = new URLSearchParams();
  if (toMode !== 'person') q.set('mode', toMode);
  if (toClue && toClue !== MODE[toMode].clue) q.set('clue', toClue);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const text = q.toString().replace(/=(?=&|$)/g, '');
  return text ? `?${text}` : '';
}
// A link to another variant that stays on the same day, or stays in practice.
function variantHref(toMode, toClue, toTuples = tuples.id) {
  const extra = toTuples && toMode === 'person' ? { tuples: toTuples } : {};
  if (practice) extra.practice = '';
  else if (params.has('day')) extra.day = params.get('day');
  return variantQuery(toMode, toClue, extra) || location.pathname;
}

// Draws the mode and clue pickers and everything else that depends only on the variant.
export function drawChrome() {
  const link = (text, href, current) => el('a', {
    textContent: text, href, className: current ? 'current' : '',
    ...(current ? { ariaCurrent: 'page' } : {}),
  });
  $('mode-picker').append(...MODES.map((m) => link(
    m.label, variantHref(m.key, m.key === mode ? clue : m.clue), m.key === mode)));
  $('clue-picker').hidden = mode === 'lineup';
  if (mode !== 'lineup') {
    $('clue-picker').append('Clue: ', ...CLUES.map((c) => link(
      c.label, variantHref(mode, c.key), c.key === clue)));
  }
  $('tuple-picker').hidden = mode !== 'person';
  if (mode === 'person') {
    $('tuple-picker').append('Choices: ', ...TUPLE_CHOICES.map((t) => link(
      t.label, variantHref(mode, clue, t.id), t.id === tuples.id)));
  }
  $('help-tuples').hidden = !tuples.id;
  document.body.dataset.mode = mode;
  $('day-label').textContent = label;
  $('tagline').textContent = MODE[mode].tagline;
  for (const node of document.querySelectorAll('[data-only]')) {
    node.hidden = !node.dataset.only.split(' ').includes(mode);
  }
  for (const a of document.querySelectorAll('a.practice-link')) {
    a.href = variantQuery(mode, clue, { ...tupleExtra, practice: '' });
  }
}
