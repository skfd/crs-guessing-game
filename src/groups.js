// Tuples: attributes that are picked together and coloured together. No DOM in here.
//
// A grouping is a list of groups in board order. A group of one attribute behaves as that
// attribute always has (green, yellow with an arrow, grey). A group of several is one pick
// in the form and one cell on the board, and the cell does not say which part was wrong.

import { ATTRIBUTES, BY_KEY } from './attributes.js';
import { LANG1_CLB, LANG2_CLB } from './tables.js';
import { compareAttribute } from './profile.js';

// Puts each joined group where its first attribute stands and leaves the rest single.
function arrange(joined) {
  const taken = new Set(joined.flatMap((g) => g.keys));
  return ATTRIBUTES.flatMap((a) => {
    const group = joined.find((g) => g.keys[0] === a.key);
    if (group) return [{ id: group.keys.join('+'), ...group }];
    return taken.has(a.key) ? [] : [{ id: a.key, label: a.label, keys: [a.key] }];
  });
}

// `name` is what a combination is called on its chip and in its cell; without one the
// short labels of its parts are joined.
const short = (key, i) => BY_KEY[key].short[i];
const WORK = {
  label: 'Canadian work', keys: ['cwe', 'hw'],
  name: ([cwe, hw]) => (cwe === 0 ? 'None' : short('cwe', cwe) + (hw ? ` ${short('hw', hw)}` : '')),
};
const LANGUAGES = {
  label: 'Languages', keys: ['lang1', 'lang2'],
  name: ([lang1, lang2]) => short('lang1', lang1) + (lang2 ? ` + ${short('lang2', lang2)}` : ''),
};

export const GROUPINGS = {
  none: arrange([]),
  work: arrange([WORK]),
  lang: arrange([LANGUAGES]),
  pairs: arrange([
    {
      label: 'Education', keys: ['edu', 'canEdu'],
      name: ([edu, canEdu]) => short('edu', edu) + (canEdu ? ` + CA ${short('canEdu', canEdu)}` : ''),
    },
    LANGUAGES,
    WORK,
    {
      label: 'Offer, foreign work', keys: ['offer', 'foreign'],
      name: ([offer, foreign]) => [offer ? `Offer ${short('offer', offer)}` : '', foreign ? `Abroad ${short('foreign', foreign)}` : '']
        .filter(Boolean).join(' + ') || 'Neither',
    },
    {
      label: 'Sibling, nomination', keys: ['sibling', 'pnp'],
      name: ([sibling, pnp]) => ['Neither', 'Nomination', 'Sibling', 'Both'][sibling * 2 + pnp],
    },
  ]),
  // Too many combinations to lay out as chips (84 for work); here for the simulator.
  themes: arrange([
    { label: 'Family', keys: ['spouse', 'sibling', 'pnp'] },
    { label: 'Education', keys: ['edu', 'canEdu'] },
    { label: 'Languages', keys: ['lang1', 'lang2', 'first'] },
    { label: 'Work', keys: ['cwe', 'hw', 'offer', 'foreign'] },
  ]),
};

// How a cell of several attributes is coloured.
//   'count'  green all right, yellow some right (the cell says how many), grey none right
//   'all'    green all right, grey otherwise
export const RULES = ['count', 'all'];

// What the page offers, by what follows ?tuples= in the address; the first is what the
// bare address plays. Any grouping above that has chips can also be named there, with
// "-all" after it for the 'all' rule: "none" is the game with nothing joined, which the
// page stopped offering on 2026-11-20 because it plays itself.
export const TUPLE_CHOICES = [
  { id: 'pairs', label: 'Yellow hints, six guesses' },
  { id: 'pairs-all', label: 'No yellow, four guesses' },
];
export const DEFAULT_TUPLES = TUPLE_CHOICES[0].id;
const MOST_CHIPS = 40;
// Where a choice has its own number of guesses. Four on pairs-all is where a player who
// forgets nothing still loses one day in ten (tools/simulate-tuples.mjs).
const GUESSES = { 'pairs-all': 4 };

// Reads ?tuples=. Anything unknown is the default.
export function parseTuples(asked) {
  const [, name, all] = /^([a-z]+?)(-all)?$/.exec(asked ?? '') ?? [];
  const grouping = GROUPINGS[name];
  if (!grouping || (name === 'none' && all) || grouping.some((g) => combos(g).length > MOST_CHIPS)) {
    return parseTuples(DEFAULT_TUPLES);
  }
  const id = name + (all ?? '');
  return { id, grouping, rule: all ? 'all' : 'count', guesses: GUESSES[id] };
}

// What a combination is called, short (chip, cell) and in full (tooltip, the line above
// the chips).
export function comboName(group, values) {
  return group.name ? group.name(values) : values.map((v, i) => short(group.keys[i], v)).join(' · ');
}
export function comboWording(group, values) {
  if (group.keys.length === 1) return BY_KEY[group.keys[0]].options[values[0]];
  return values.map((v, i) => `${BY_KEY[group.keys[i]].label}: ${BY_KEY[group.keys[i]].options[v]}`).join('; ');
}

// The two things a profile cannot hold (see tidy in score.js), for the parts a group has.
function canExist(keys, values) {
  const v = (k) => values[keys.indexOf(k)];
  if (keys.includes('lang1') && keys.includes('lang2') && LANG2_CLB[v('lang2')] > LANG1_CLB[v('lang1')]) return false;
  if (keys.includes('cwe') && keys.includes('hw') && v('cwe') === 0 && v('hw') !== 0) return false;
  return true;
}

// Every combination a group can be set to: arrays of option indexes in the order of
// group.keys, the first attribute changing slowest.
const comboCache = new Map();
export function combos(group) {
  if (!comboCache.has(group.id)) {
    let list = [[]];
    for (const k of group.keys) list = list.flatMap((c) => BY_KEY[k].options.map((_, i) => [...c, i]));
    comboCache.set(group.id, list.filter((c) => canExist(group.keys, c)));
  }
  return comboCache.get(group.id);
}

// Feedback for one group, given the guess's and the answer's values for its attributes:
// { state, arrow, right }. `right` is how many of its attributes match.
export function compareValues(group, guess, answer, rule = 'count') {
  if (group.keys.length === 1) {
    return { ...compareAttribute(group.keys[0], guess[0], answer[0]), right: guess[0] === answer[0] ? 1 : 0 };
  }
  let right = 0;
  for (let i = 0; i < guess.length; i += 1) if (guess[i] === answer[i]) right += 1;
  const state = right === guess.length ? 'hit' : right > 0 && rule === 'count' ? 'close' : 'miss';
  return { state, arrow: null, right: rule === 'count' ? right : state === 'hit' ? right : 0 };
}

// Full feedback for a guess against the answer, one cell per group. Both must already be
// canonical.
export function compareGrouped(grouping, guess, answer, rule = 'count') {
  const cells = grouping.map((g) => {
    const values = g.keys.map((k) => guess[k]);
    return { id: g.id, keys: g.keys, values, ...compareValues(g, values, g.keys.map((k) => answer[k]), rule) };
  });
  return { cells, won: cells.every((c) => c.state === 'hit') };
}

// Which combinations of a group are still open after its cells so far: one boolean per
// entry of combos(group). A combination is open if it would have drawn exactly what each
// cell showed, so this knows nothing the player was not shown.
export function stillPossibleGroup(group, cells, rule = 'count') {
  return combos(group).map((combo) => cells.every((c) => {
    const seen = compareValues(group, c.values, combo, rule);
    return seen.state === c.state && seen.arrow === c.arrow && seen.right === c.right;
  }));
}
