// What every mode's page needs: which variant and day this is, the answer list, saved
// progress, and two DOM helpers.

import { MODE, MODES, CLUES, parseVariant, variantId, variantName, variantOffset } from './modes.js';
import { DEFAULT_TUPLES, TUPLE_CHOICES, parseTuples } from './groups.js';
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

// Which attributes are picked together, and in "find the person" coloured together. "Hit
// the score" joins the same ones but has no colours, so the colour rule and the number of
// guesses that comes with it are not its own. Line-up has no guess to join.
const asked = parseTuples(params.get('tuples'));
export const tuples = mode === 'person' ? asked
  : parseTuples(mode === 'score' ? asked.id.replace(/-all$/, '') : 'none');
const tupleExtra = asked.id === DEFAULT_TUPLES ? {} : { tuples: asked.id };
const TUPLE_NAMES = { [DEFAULT_TUPLES]: '', none: 'one by one', 'pairs-all': 'no yellow' };

const name = [variantName(mode, clue), mode === 'person' ? TUPLE_NAMES[tuples.id] ?? `tuples ${tuples.id}` : '']
  .filter(Boolean).join(', ');
export const label = (practice ? 'practice' : `#${day}`) + (name ? ` ${name}` : '');
export const shareUrl = practice ? '' : location.origin + location.pathname + variantQuery(mode, clue, tupleExtra);

// The original game keeps its original key, so games saved before there were modes are
// still there. In "find the person" a game with tuples is another game: its guesses are
// coloured differently. In "hit the score" it is the same game drawn another way, so it
// keeps its key and a game saved before the choices were joined is still there.
const id = [variantId(mode, clue), mode !== 'person' || tuples.id === 'none' ? '' : `t-${tuples.id}`]
  .filter(Boolean).join(':');
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
function variantHref(toMode, toClue, toTuples = asked.id) {
  const extra = toTuples === DEFAULT_TUPLES ? {} : { tuples: toTuples };
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
    $('tuple-picker').append('Rules: ', ...TUPLE_CHOICES.map((t) => link(
      t.label, variantHref(mode, clue, t.id), t.id === tuples.id)));
  }
  $('help-tuples').hidden = mode !== 'person' || tuples.id === 'none';
  $('help-joined-score').hidden = mode !== 'score' || tuples.id === 'none';
  // With joined choices the two guessing modes fit a desktop screen: guesses on the left,
  // choices on the right.
  if (tuples.id !== 'none') document.body.dataset.layout = 'split';
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
