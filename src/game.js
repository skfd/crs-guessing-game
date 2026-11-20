// The page for the two guessing modes, "find the person" and "hit the score": clue, guess
// form, feedback rows, end screen. Rules live in score.js, profile.js and modes.js; this
// file only draws.

import { ATTRIBUTES, KEYS } from './attributes.js';
import { LANG1_CLB, LANG2_CLB } from './tables.js';
import { score, sameScore, tidy, SECTIONS } from './score.js';
import { canonical, carryForward } from './profile.js';
import { combos, comboName, comboWording, compareGrouped, stillPossibleGroup } from './groups.js';
import { answerForDay, shareText } from './daily.js';
import { MODE, closeness, revealedSections, steps, variantOffset } from './modes.js';
import { $, el, answersFile, clue, day, label, load, mode, save, shareUrl, tuples } from './page.js';

// One group is one pick in the form and one cell on the board. Unless the address asks
// for tuples, every group is a single attribute.
const { grouping: GROUPS, rule: RULE } = tuples;
const comboIndex = (g, profile) => combos(g).findIndex((c) => c.every((v, x) => v === profile[g.keys[x]]));

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
      cells: GROUPS.map((g) => ({
        id: g.id, keys: g.keys, values: g.keys.map((k) => profile[k]), state: 'plain', hint: hints[g.keys[0]],
      })),
    };
  }
  const { profile, lowered } = canonical(raw, answer.spousePoints);
  return {
    profile, lowered, ...compareGrouped(GROUPS, profile, answer.profile, RULE),
    score: score(profile, answer.spousePoints),
  };
}

// ---- form -------------------------------------------------------------------------------

// Every option of every attribute is a chip that stays on screen, so that what the
// guesses have ruled out can be marked on it, as on Wordle's keyboard. A chip is a label
// around a radio button.
// A group of several attributes has a chip for every combination that can exist, a line
// of them for each value of its first attribute.
const fields = {};
for (const g of GROUPS) {
  const list = combos(g);
  const wording = list.map((c) => comboWording(g, c));
  const inputs = list.map((_, i) => el('input', { type: 'radio', name: g.id, value: i, ariaLabel: wording[i] }));
  const chips = inputs.map((input, i) => el('label', { className: 'chip', title: wording[i] }, [input, comboName(g, list[i])]));
  const picked = el('span', { className: 'picked' });
  // Shown on a settled attribute, whose chips are folded away: brings them back.
  const reopen = el('button', { type: 'button', className: 'reopen', textContent: 'change', hidden: true });
  const joined = g.keys.length > 1;
  const lines = joined
    ? [...new Set(list.map((c) => c[0]))].map((first) => el('div', { className: 'chip-line' }, chips.filter((_, i) => list[i][0] === first)))
    : chips;
  const node = el('div', { className: `field${list.length > 7 ? ' wide' : ''}${joined ? ' joined' : ''}`, role: 'radiogroup', ariaLabel: g.label }, [
    el('div', { className: 'field-head' }, [`${g.label}: `, picked, ' ', reopen]),
    el('div', { className: 'chips' }, lines),
  ]);
  // `hit` is the option known to be right, or -1; `open` is what stillPossibleGroup says;
  // `opened` is true while the player has unfolded a settled attribute.
  const field = { inputs, chips, wording, picked, reopen, node, hit: -1, open: null, opened: false };
  fields[g.id] = field;
  inputs.forEach((input, i) => input.addEventListener('change', () => {
    if (i === field.hit) field.opened = false; // back on the right option: fold again
    syncForm();
  }));
  reopen.addEventListener('click', () => {
    field.opened = true;
    syncForm();
    inputs[field.hit].focus();
  });
  $('fields').append(node);
}
if (hitTheScore) {
  $('form-note').textContent = answer.spousePoints
    ? `An accompanying spouse brings ${answer.spousePoints} points of their own here.`
    : 'An accompanying spouse brings no points of their own here.';
}

const pickedIndex = (g) => fields[g.id].inputs.findIndex((input) => input.checked);
// The form as a profile; -1 for every attribute of a group with nothing picked.
function readForm() {
  return Object.fromEntries(GROUPS.flatMap((g) => {
    const combo = combos(g)[pickedIndex(g)];
    return g.keys.map((k, x) => [k, combo ? combo[x] : -1]);
  }));
}
// What the form is set to for each group: an index into its combinations, -1 for none.
function writeForm(picks) {
  for (const g of GROUPS) fields[g.id].inputs.forEach((input, i) => { input.checked = i === picks[g.id]; });
  syncForm();
}
const unset = () => GROUPS.filter((g) => pickedIndex(g) < 0);
// Disables what cannot be: a second language above the first, a wage tier with no work.
// A choice that has become impossible falls back to the highest one that is not. This is
// not the same as ruled out: a ruled-out option can still be picked. Where the two are
// joined in one group there is nothing to disable: it only has combinations that can be.
function syncForm() {
  const p = readForm();
  const allow = {
    lang2: (i) => p.lang1 < 0 || LANG2_CLB[i] <= LANG1_CLB[p.lang1],
    hw: (i) => i === 0 || p.cwe !== 0,
  };
  for (const [key, allowed] of Object.entries(allow)) {
    if (!fields[key]) continue;
    const { inputs } = fields[key];
    inputs.forEach((input, i) => { input.disabled = !allowed(i); });
    let i = p[key];
    if (i >= 0) while (inputs[i].disabled) i -= 1;
    // Nothing chosen and only one thing possible: that is the choice.
    else if (inputs.filter((input) => !input.disabled).length === 1) i = inputs.findIndex((input) => !input.disabled);
    inputs.forEach((input, j) => { input.checked = j === i; });
  }
  for (const g of GROUPS) {
    const field = fields[g.id];
    const i = pickedIndex(g);
    field.picked.textContent = i < 0 ? 'choose one' : field.wording[i];
    field.node.classList.toggle('unset', i < 0);
    // An attribute that is known and set to what is known needs no chips: one line.
    const settled = i >= 0 && i === field.hit && !field.opened;
    field.node.classList.toggle('settled', settled);
    field.reopen.hidden = !settled;
  }
  // A guess needs every attribute. After a guess, the ones it ruled out are left unset.
  const missing = unset().map((a) => a.label);
  const barred = ruledOutPicks().map((a) => a.label);
  $('guess-button').disabled = missing.length > 0 || barred.length > 0;
  if (!hitTheScore) {
    $('form-note').textContent = [
      missing.length ? `Still to choose: ${missing.join(', ')}.` : '',
      barred.length ? `Hard mode: ${barred.join(', ')} ${barred.length > 1 ? 'are' : 'is'} set to something ruled out.` : '',
    ].filter(Boolean).join(' ');
  }
}

// Hard mode: a guess may not use a choice the guesses so far have ruled out. The setting
// is the player's, kept across days; it is not part of a saved game.
const HARD_KEY = 'crs-guessing-game:v1:hard';
const hardMode = $('hard-mode');
try { hardMode.checked = localStorage.getItem(HARD_KEY) === '1'; } catch { /* no storage: off */ }
hardMode.addEventListener('change', () => {
  try { localStorage.setItem(HARD_KEY, hardMode.checked ? '1' : '0'); } catch { /* not kept */ }
  syncForm();
});
// The attributes that hard mode will not let through as the form stands.
function ruledOutPicks() {
  if (hitTheScore || !hardMode.checked) return [];
  return GROUPS.filter((g) => {
    const i = pickedIndex(g);
    return i >= 0 && fields[g.id].open && !fields[g.id].open[i];
  });
}
// Whether no guess used a choice that the guesses before it had ruled out.
function playedHard(results) {
  return guesses.every((raw, n) => GROUPS.every((g, j) => stillPossibleGroup(
    g, results.slice(0, n).map((r) => r.cells[j]), RULE)[comboIndex(g, raw)]));
}

// Marks each chip with what the guesses so far say about it: green for the option known
// to be right, grey for one that cannot be. "Hit the score" has no hidden person to rule
// anything out against, so its chips stay plain.
function markForm(results) {
  if (hitTheScore) return;
  GROUPS.forEach((g, j) => {
    const field = fields[g.id];
    const cells = results.map((r) => r.cells[j]);
    const open = stillPossibleGroup(g, cells, RULE);
    const found = cells.some((c) => c.state === 'hit');
    // A yellow cell leaves only an option or two next to it: those are yellow too. In a
    // joined group it leaves the combinations that share a part with the guess.
    const near = !found && cells.some((c) => c.state === 'close');
    field.open = open;
    field.hit = found ? open.indexOf(true) : -1;
    field.chips.forEach((chip, i) => {
      chip.classList.toggle('hit', found && open[i]);
      chip.classList.toggle('near', near && open[i]);
      chip.classList.toggle('out', !open[i]);
      const what = !open[i] ? ' (ruled out)' : found ? ' (right)' : near ? ' (close)' : '';
      field.inputs[i].ariaLabel = field.wording[i] + what;
      chip.title = field.wording[i] + what;
    });
  });
}

// ---- board ------------------------------------------------------------------------------

$('board-head').append(
  ...GROUPS.map((g) => el('th', { scope: 'col', textContent: g.label })),
  el('th', { scope: 'col', textContent: 'Score' }),
);

const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

function guessRows(result, revealed) {
  const cells = result.cells.map((c, j) => {
    const g = GROUPS[j];
    const wasLowered = c.keys.some((k) => result.lowered.includes(k));
    const td = el('td', { className: `cell ${c.state}` });
    td.dataset.label = g.label; // shown above the value where the header row is not
    if (wasLowered) td.append(el('span', { className: 'lowered', textContent: '∅' }));
    td.append(comboName(g, c.values));
    if (c.arrow) td.append(el('span', { className: 'arrow', textContent: ARROW[c.arrow] }));
    // A yellow joined cell says how many of its parts are right, never which.
    const partly = c.keys.length > 1 && c.state === 'close';
    if (partly) td.append(el('span', { className: 'parts', textContent: `${c.right} of ${c.keys.length}` }));
    td.title = (c.keys.length > 1 ? comboWording(g, c.values) : `${g.label}: ${comboWording(g, c.values)}`)
      + (partly ? ` (${c.right} of ${c.keys.length} right)` : '')
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
    el('tr', { className: 'breakdown' }, [el('td', { colSpan: GROUPS.length + 1 }, parts)]),
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
      ...GROUPS.map(() => el('td', { className: 'cell empty' })), el('td'),
    ]));
  }

  // Mark what is already known in the form and carry the last guess forward.
  const last = results.at(-1);
  // The next guess starts from the last one, minus every choice a guess has ruled out:
  // those are left for the player to make again.
  markForm(results);
  if (last) {
    writeForm(Object.fromEntries(GROUPS.map((g) => {
      const i = comboIndex(g, last.profile);
      return [g.id, hitTheScore ? i : carryForward(fields[g.id].open, i)];
    })));
  }

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
    : shareText({
      label, won, url: shareUrl, max: MAX, rows: results.map((r) => r.cells.map((c) => c.state)),
      hard: hardMode.checked && playedHard(results),
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
  if (guesses.length >= MAX || unset().length || ruledOutPicks().length) return;
  // The same guess twice teaches nothing, and under the section-per-miss clue it would
  // buy a section for free. Compared as the game reads them, so a guess that is lowered
  // to an earlier one counts as the same.
  const raw = readForm();
  const same = (a, b) => KEYS.every((k) => a[k] === b[k]);
  const read = evaluate(raw).profile;
  if (guesses.some((g) => same(evaluate(g).profile, read))) {
    $('note').textContent = guesses.some((g) => same(g, raw))
      ? 'You have already guessed that. Change something first.'
      : 'That change makes no difference to the score, so it reads as a guess you have already made.';
    return;
  }
  guesses.push(raw);
  save(guesses);
  render();
});

$('guess-game').hidden = false;
writeForm(Object.fromEntries(GROUPS.map((g) => [g.id, comboIndex(g, START)])));
render();
