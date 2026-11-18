// The page: clue, guess form, feedback rows, end screen. Rules live in score.js and
// profile.js; this file only draws.

import { ATTRIBUTES, KEYS } from './attributes.js';
import { LANG1_CLB, LANG2_CLB } from './tables.js';
import { score, sameScore, SECTIONS } from './score.js';
import { canonical, compare } from './profile.js';
import { MAX_GUESSES, answerForDay, dayNumber, shareText } from './daily.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};
const ARROW = { up: '↑', down: '↓' };
const START = { spouse: 0, age: 2, edu: 4, lang1: 3, lang2: 0, first: 0, cwe: 0, hw: 0,
  offer: 0, foreign: 0, canEdu: 0, sibling: 0, pnp: 0 };

const params = new URLSearchParams(location.search);
const practice = params.has('practice');
const answersFile = await (await fetch('data/answers.json')).json();
const day = practice
  ? 1 + Math.floor(Math.random() * answersFile.answers.length)
  : Number(params.get('day')) || dayNumber();
const answer = answerForDay(answersFile, day);
const answerScore = score(answer.profile, answer.spousePoints);
const label = practice ? 'practice' : `#${day}`;
const storageKey = `crs-guessing-game:v1:day:${day}`;

// Guesses are kept as the raw form values; feedback is recomputed from them.
let guesses = [];
if (!practice) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (Array.isArray(saved)) guesses = saved.slice(0, MAX_GUESSES);
  } catch { /* a broken save is the same as no save */ }
}

function evaluate(raw) {
  // A guess that says "spouse" borrows the hidden spouse's points: the spouse is a given,
  // not something to guess.
  const { profile, lowered } = canonical(raw, answer.spousePoints);
  const result = compare(profile, answer.profile);
  return { profile, lowered, ...result, score: score(profile, answer.spousePoints) };
}

// ---- clue -------------------------------------------------------------------------------

$('day-label').textContent = label;
$('clue-total').textContent = answerScore.total;
$('clue-sections').append(...SECTIONS.map((s) => el('div', {}, [
  el('dt', { textContent: s.label }),
  el('dd', { textContent: answerScore[s.key] }),
])));

// ---- form -------------------------------------------------------------------------------

const selects = {};
for (const a of ATTRIBUTES) {
  const select = el('select', { name: a.key }, a.options.map(
    (text, i) => el('option', { value: i, textContent: text })));
  selects[a.key] = select;
  select.addEventListener('change', syncForm);
  $('fields').append(el('label', {}, [a.label, select]));
}

function readForm() {
  return Object.fromEntries(KEYS.map((k) => [k, Number(selects[k].value)]));
}
function writeForm(profile) {
  for (const k of KEYS) selects[k].value = profile[k];
  syncForm();
}
// Greys out what cannot be: a second language above the first, a wage tier with no work.
function syncForm() {
  const p = readForm();
  [...selects.lang2.options].forEach((option, i) => {
    option.disabled = LANG2_CLB[i] > LANG1_CLB[p.lang1];
  });
  while (selects.lang2.selectedOptions[0].disabled) selects.lang2.value -= 1;
  selects.hw.disabled = p.cwe === 0;
  if (p.cwe === 0) selects.hw.value = 0;
}

// ---- board ------------------------------------------------------------------------------

$('board-head').append(
  ...ATTRIBUTES.map((a) => el('th', { scope: 'col', textContent: a.label })),
  el('th', { scope: 'col', textContent: 'Score' }),
);

function guessRows(result) {
  const cells = result.cells.map((c) => {
    const a = ATTRIBUTES.find((x) => x.key === c.key);
    const wasLowered = result.lowered.includes(c.key);
    const td = el('td', { className: `cell ${c.state}` });
    if (wasLowered) td.append(el('span', { className: 'lowered', textContent: '∅' }));
    td.append(a.short[c.value]);
    if (c.arrow) td.append(el('span', { className: 'arrow', textContent: ARROW[c.arrow] }));
    td.title = `${a.label}: ${a.options[c.value]}`
      + (wasLowered ? ' (your choice made no difference to the score)' : '');
    return td;
  });
  const gap = answerScore.total - result.score.total;
  const gapText = gap === 0 ? 'same score' : `${Math.abs(gap)} ${gap > 0 ? 'too low ↑' : 'too high ↓'}`;
  const scoreCell = el('td', { className: 'score' }, [
    el('span', { className: 'guess-total', textContent: result.score.total }),
    el('span', { className: 'gap', textContent: gapText }),
  ]);
  const parts = SECTIONS.flatMap((s, i) => {
    const diff = answerScore[s.key] - result.score[s.key];
    const mark = diff === 0 ? '✓' : diff > 0 ? '↑' : '↓';
    const span = el('span', {
      className: diff === 0 ? 'ok' : '',
      textContent: `${s.label} ${result.score[s.key]} ${mark}`,
    });
    return i ? [' · ', span] : [span];
  });
  return [
    el('tr', { className: 'guess' }, [...cells, scoreCell]),
    el('tr', { className: 'breakdown' }, [el('td', { colSpan: ATTRIBUTES.length + 1 }, parts)]),
  ];
}

function render() {
  const results = guesses.map(evaluate);
  const won = results.some((r) => r.won);
  const over = won || guesses.length >= MAX_GUESSES;

  const body = $('board-body');
  body.replaceChildren(...results.flatMap(guessRows));
  for (let i = guesses.length; i < MAX_GUESSES && !over; i += 1) {
    body.append(el('tr', {}, [
      ...ATTRIBUTES.map(() => el('td', { className: 'cell empty' })), el('td'),
    ]));
  }

  // Mark what is already known in the form and carry the last guess forward.
  const last = results.at(-1);
  for (const a of ATTRIBUTES) {
    const known = results.some((r) => r.cells.find((c) => c.key === a.key).state === 'hit');
    selects[a.key].classList.toggle('known', known);
  }
  if (last) writeForm(last.profile);

  $('note').textContent = last && !last.won && sameScore(last.score, answerScore)
    ? 'Same points in every section, but a different person. Keep looking.'
    : '';

  $('guess-form').hidden = over;
  $('guess-button').textContent = `Guess ${guesses.length + 1} of ${MAX_GUESSES}`;
  $('end').hidden = !over;
  if (over) renderEnd(results, won);
}

function renderEnd(results, won) {
  $('end-title').textContent = won
    ? `Found in ${results.length} of ${MAX_GUESSES}.`
    : 'Not found. This was the person:';
  $('end-answer').replaceChildren(...ATTRIBUTES.map((a) => el('div', {}, [
    el('dt', { textContent: a.label }),
    el('dd', { textContent: a.options[answer.profile[a.key]] }),
  ])));
  const text = shareText({
    label,
    rows: results.map((r) => r.cells.map((c) => c.state)),
    won,
    url: practice ? '' : location.origin + location.pathname,
  });
  $('share-preview').textContent = text;
  $('share-button').onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      $('share-button').textContent = 'Copied';
    } catch {
      $('share-preview').hidden = false; // no clipboard: show it to copy by hand
    }
  };
}

$('guess-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (guesses.length >= MAX_GUESSES) return;
  guesses.push(readForm());
  if (!practice) localStorage.setItem(storageKey, JSON.stringify(guesses));
  render();
});

writeForm(START);
render();
