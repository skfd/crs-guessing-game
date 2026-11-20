// The page for line-up mode: a score, four people, pick whose it is, five times.

import { SECTIONS } from './score.js';
import { shareText } from './daily.js';
import { ROUNDS, bioLines, roundsForDay } from './rounds.js';
import { $, el, answersFile, day, label, load, save, shareUrl } from './page.js';

const rounds = roundsForDay(answersFile, day);
const LETTERS = ['A', 'B', 'C', 'D'];

// One pick per finished round: the index of the person chosen.
let picks = load().slice(0, ROUNDS).filter((i) => Number.isInteger(i) && i >= 0 && i < LETTERS.length);
// The round on screen. A finished round stays up, with everyone's score, until "next".
let showing = Math.min(picks.length, ROUNDS - 1);
let finished = picks.length === ROUNDS;

function card(round, person, i, picked) {
  const answered = picked !== undefined;
  const button = el('button', { type: 'button', className: 'person', disabled: answered }, [
    el('span', { className: 'letter', textContent: LETTERS[i] }),
    el('ul', {}, bioLines(person.profile, person.spousePoints).map((line) => el('li', { textContent: line }))),
  ]);
  if (answered) {
    if (i === round.answer) button.classList.add('right');
    else if (i === picked) button.classList.add('wrong');
    button.append(el('span', { className: 'reveal' }, [
      el('strong', { textContent: person.score.total }),
      ` ${SECTIONS.map((s) => `${s.label} ${person.score[s.key]}`).join(' · ')}`,
    ]));
  } else {
    button.addEventListener('click', () => {
      picks.push(i);
      save(picks);
      render();
    });
  }
  return button;
}

function render() {
  const round = rounds[showing];
  const picked = picks[showing];
  const answered = picked !== undefined;
  $('clue-total').textContent = round.total;
  $('round-label').textContent = `Round ${showing + 1} of ${ROUNDS}`;
  $('people').replaceChildren(...round.people.map((p, i) => card(round, p, i, picked)));
  $('round-result').textContent = !answered ? ''
    : picked === round.answer ? 'Right.' : `No: it is ${LETTERS[round.answer]}.`;
  const last = showing === ROUNDS - 1;
  $('next-button').hidden = !answered || (last && finished);
  $('next-button').textContent = last ? 'See the result' : 'Next round';
  $('progress').replaceChildren(...rounds.map((r, i) => el('span', {
    className: picks[i] === undefined ? 'dot' : picks[i] === r.answer ? 'dot right' : 'dot wrong',
  })));
  $('end').hidden = !finished;
  if (finished) renderEnd();
}

function renderEnd() {
  const states = rounds.map((r, i) => (picks[i] === r.answer ? 'hit' : 'miss'));
  const right = states.filter((s) => s === 'hit').length;
  $('end-title').textContent = `${right} of ${ROUNDS} right.`;
  const text = shareText({ label, rows: [states], result: right, max: ROUNDS, url: shareUrl });
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

$('next-button').addEventListener('click', () => {
  if (showing === ROUNDS - 1) finished = true;
  else showing += 1;
  render();
});

$('clue-sections').hidden = true;
$('lineup-game').hidden = false;
render();
