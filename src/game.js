// The page for the two guessing modes, "find the person" and "hit the score": clue, guess
// form, feedback rows, end screen. Rules live in score.js, profile.js and modes.js; this
// file only draws.

import { ATTRIBUTES, KEYS } from './attributes.js';
import { LANG1_CLB, LANG2_CLB } from './tables.js';
import { score, sameScore, tidy, SECTIONS } from './score.js';
import { canonical, compare } from './profile.js';
import { answerForDay, shareText } from './daily.js';
import { MODE, closeness, revealedSections, steps, variantOffset } from './modes.js';
import { $, el, answersFile, clue, day, label, load, mode, save, shareUrl } from './page.js';

const ARROW = { up: '↑', down: '↓' };
const START = { spouse: 0, age: 2, edu: 4, lang1: 3, lang2: 0, first: 0, cwe: 0, hw: 0,
  offer: 0, foreign: 0, canEdu: 0, sibling: 0, pnp: 0 };
const MAX = MODE[mode].guesses;
const hitTheScore = mode === 'score';

const answer = answerForDay(answersFile, day + variantOffset(mode, clue));
const answerScore = score(answer.profile, answer.spousePoints);

// Guesses are kept as the raw form values; feedback is recomputed from them.
let guesses = load().slice(0, MAX);

// A guess that says "spouse" borrows the hidden spouse's points: the spouse is a given,
// not something to guess.
function evaluate(raw) {
  if (hitTheScore) {
    // Any profile with the right total wins, so there is nothing to colour. Each cell
    // says instead what a step either way would have been worth.
    const profile = tidy(raw);
    const result = score(profile, answer.spousePoints);
    const hints = steps(profile, answer.spousePoints);
    return {
      profile, lowered: [], score: result, won: result.total === answerScore.total,
      cells: ATTRIBUTES.map((a) => ({ key: a.key, value: profile[a.key], state: 'plain', hint: hints[a.key] })),
    };
  }
  const { profile, lowered } = canonical(raw, answer.spousePoints);
  return { profile, lowered, ...compare(profile, answer.profile), score: score(profile, answer.spousePoints) };
}

// ---- form -------------------------------------------------------------------------------

const selects = {};
for (const a of ATTRIBUTES) {
  const select = el('select', { name: a.key }, a.options.map(
    (text, i) => el('option', { value: i, textContent: text })));
  selects[a.key] = select;
  select.addEventListener('change', syncForm);
  $('fields').append(el('label', {}, [a.label, select]));
}
if (hitTheScore) {
  $('form-note').textContent = answer.spousePoints
    ? `An accompanying spouse brings ${answer.spousePoints} points of their own here.`
    : 'An accompanying spouse brings no points of their own here.';
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

const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

function guessRows(result, revealed) {
  const cells = result.cells.map((c) => {
    const a = ATTRIBUTES.find((x) => x.key === c.key);
    const wasLowered = result.lowered.includes(c.key);
    const td = el('td', { className: `cell ${c.state}` });
    td.dataset.label = a.label; // shown above the value where the header row is not
    if (wasLowered) td.append(el('span', { className: 'lowered', textContent: '∅' }));
    td.append(a.short[c.value]);
    if (c.arrow) td.append(el('span', { className: 'arrow', textContent: ARROW[c.arrow] }));
    td.title = `${a.label}: ${a.options[c.value]}`
      + (wasLowered ? ' (your choice made no difference to the score)' : '');
    if (c.hint) {
      const parts = [];
      if (c.hint.up !== null) parts.push(`▲${signed(c.hint.up)}`);
      if (c.hint.down !== null) parts.push(`▼${signed(c.hint.down)}`);
      td.append(el('span', { className: 'steps', textContent: parts.join(' ') || '–' }));
    }
    return td;
  });
  const gap = answerScore.total - result.score.total;
  const gapText = gap === 0 ? 'same score' : `${Math.abs(gap)} ${gap > 0 ? 'too low ↑' : 'too high ↓'}`;
  const scoreCell = el('td', { className: 'score' }, [
    el('span', { className: 'guess-total', textContent: result.score.total }),
    el('span', { className: 'gap', textContent: gapText }),
  ]);
  // The guess's own section points are always shown; whether each is more or fewer than
  // the hidden person's is only shown for sections the clue has revealed.
  const parts = SECTIONS.flatMap((s, i) => {
    const diff = answerScore[s.key] - result.score[s.key];
    const open = revealed.includes(s.key);
    const mark = !open ? '' : diff === 0 ? ' ✓' : diff > 0 ? ' ↑' : ' ↓';
    const span = el('span', {
      className: open && diff === 0 ? 'ok' : '',
      textContent: `${s.label} ${result.score[s.key]}${mark}`,
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
  const over = won || guesses.length >= MAX;
  const revealed = revealedSections(clue, guesses.length, over);

  $('clue-total').textContent = answerScore.total;
  $('clue-sections').replaceChildren(...SECTIONS.map((s) => {
    const open = revealed.includes(s.key);
    return el('div', { className: open ? '' : 'hidden-section' }, [
      el('dt', { textContent: s.label }),
      el('dd', { textContent: open ? answerScore[s.key] : '?' }),
    ]);
  }));
  $('clue-sections').hidden = clue === 'total' && !over;

  const body = $('board-body');
  body.replaceChildren(...results.flatMap((r) => guessRows(r, revealed)));
  for (let i = guesses.length; i < MAX && !over; i += 1) {
    body.append(el('tr', { className: 'blank' }, [
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

  let note = '';
  if (last && !last.won && !hitTheScore && last.score.total === answerScore.total) {
    note = revealed.length === SECTIONS.length && sameScore(last.score, answerScore)
      ? 'Same points in every section, but a different person. Keep looking.'
      : 'Same total, but a different person. Keep looking.';
  }
  $('note').textContent = note;

  $('guess-form').hidden = over;
  $('guess-button').textContent = `Guess ${guesses.length + 1} of ${MAX}`;
  $('end').hidden = !over;
  if (over) renderEnd(results, won);
}

function renderEnd(results, won) {
  if (hitTheScore) {
    $('end-title').textContent = won ? `Hit in ${results.length} of ${MAX}.` : 'Not hit.';
    $('end-lead').textContent = `The ${answerScore.total} came from this person:`;
  } else {
    $('end-title').textContent = won ? `Found in ${results.length} of ${MAX}.` : 'Not found. This was the person:';
    $('end-lead').textContent = '';
  }
  $('end-answer').replaceChildren(...ATTRIBUTES.map((a) => el('div', {}, [
    el('dt', { textContent: a.label }),
    el('dd', { textContent: a.options[answer.profile[a.key]] }),
  ])));
  // "Find the person" shares a line of squares per guess; "hit the score" has no cells to
  // show, so it shares one square per guess for how near the total was.
  const text = hitTheScore
    ? shareText({
      label, won, url: shareUrl, max: MAX, result: won ? results.length : 'X',
      rows: [results.map((r) => closeness(answerScore.total - r.score.total))],
    })
    : shareText({ label, won, url: shareUrl, max: MAX, rows: results.map((r) => r.cells.map((c) => c.state)) });
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
  if (guesses.length >= MAX) return;
  // The same guess twice teaches nothing, and under the section-per-miss clue it would
  // buy a section for free. Compared as the game reads them, so a guess that is lowered
  // to an earlier one counts as the same.
  const raw = readForm();
  const same = (a, b) => KEYS.every((k) => a[k] === b[k]);
  const read = evaluate(raw).profile;
  if (guesses.some((g) => same(evaluate(g).profile, read))) {
    $('note').textContent = 'You have already guessed that. Change something first.';
    return;
  }
  guesses.push(raw);
  save(guesses);
  render();
});

$('guess-game').hidden = false;
writeForm(START);
render();
