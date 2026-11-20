// Builds test/ircc-vectors.json by having IRCC's own calculator score random profiles.
//
//   node tools/ircc-oracle.mjs snippet          prints a snippet
//   node tools/ircc-oracle.mjs build results    writes test/ircc-vectors.json
//
// IRCC's script is neither copied into this repo nor run by node. It runs where it was
// written to run, in a browser tab on IRCC's page:
//
//   https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp
//
// Open that page, paste the snippet into the browser console, and it puts 600 random
// profiles through the calculator's own submit handler and gives back one line: the
// subtotals the page showed for each, and a checksum. Save that line to a file and pass
// the file to `build`. Only the profiles and those subtotals are kept. Re-run this when
// IRCC changes the tool.
//
// The snippet makes the profiles itself, from the same seed as node does, so that it is
// short enough to paste; the checksums catch the two sides disagreeing, or a line that
// lost something on the way.

import fs from 'node:fs';
import { ATTRIBUTES, KEYS } from '../src/attributes.js';
import { LANG1_CLB, LANG2_CLB } from '../src/tables.js';
import { tidy } from '../src/score.js';
import { rng } from '../src/rng.js';

const SOURCE = 'https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp';
const SEED = 20261103;
const COUNT = 600;
const SECTIONS = ['core', 'spouse', 'transfer', 'additional', 'total'];
// The game has no provincial nomination, but score.js has the rule and the calculator
// asks, so the vectors carry one more yes-or-no after the game's own attributes.
const VECTOR_KEYS = [...KEYS, 'pnp'];
const VECTOR_SIZES = [...ATTRIBUTES.map((a) => a.options.length), 2];

// 32-bit FNV-1a, as eight hex digits. Runs in node and, as text, in the page.
function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

// The profiles, as arrays in VECTOR_KEYS order. Runs in node and, as text, in the page, so it
// may use nothing but its arguments.
function makeProfiles(random, count, sizes, keys, lang1Clb, lang2Clb) {
  const at = Object.fromEntries(keys.map((k, i) => [k, i]));
  const profiles = [];
  for (let n = 0; n < count; n += 1) {
    const p = sizes.map((size) => Math.floor(random() * size));
    // Nominations swamp everything else, so keep them to a minority of the vectors.
    if (random() < 0.8) p[at.pnp] = 0;
    // The two things a profile cannot hold; the same as tidy() in src/score.js.
    while (lang2Clb[p[at.lang2]] > lang1Clb[p[at.lang1]]) p[at.lang2] -= 1;
    if (p[at.cwe] === 0) p[at.hw] = 0;
    profiles.push(p);
  }
  return profiles;
}

// Our option indexes -> the calculator's option letters. Runs in the page.
function toInputs(p) {
  const AGE = ['B', 'C', 'D', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC'];
  const LETTERS = 'ABCDEFGH';
  const LANG1 = ['A', 'C', 'D', 'E', 'F', 'G', 'H']; // CLB 0-3, 5, 6, 7, 8, 9, 10
  const LANG2 = ['A', 'C', 'E', 'G']; // none, CLB 5, 7, 9
  const ABILITIES = ['speaking', 'listening', 'reading', 'writing'];
  const inputs = {
    q3: AGE[p.age],
    q4: LETTERS[p.edu],
    q4c: LETTERS[p.canEdu],
    'q5i-a': p.first ? 'C' : 'A', // TEF (French) or CELPIP (English) as the first language test
    q5ii: 'A',
    q6i: LETTERS[p.cwe],
    q6ii: p.hw > 0 ? 'B' : 'A',
    q6iii: p.hw === 3 ? 'B' : 'A',
    q6iv: p.hw === 2 ? 'B' : 'A',
    q6v: ['A', 'B', 'D'][p.foreign],
    q7: 'A',
    q8: p.offer > 0 ? 'B' : 'A',
    q8a: [undefined, 'C', 'B', 'A'][p.offer],
    q9: p.pnp ? 'B' : 'A',
    q10i: p.sibling ? 'B' : 'A',
  };
  for (const ability of ABILITIES) {
    inputs[`q5i-b-${ability}`] = LANG1[p.lang1];
    inputs[`q5ii-sol-${ability}`] = LANG2[p.lang2];
  }
  if (p.spouse) {
    // A fixed spouse: bachelor's (8), 1 year of Canadian work (5), CLB 7 on everything (12).
    Object.assign(inputs, { q10: 'E', q11: 'B', q12i: 'A' });
    for (const ability of ABILITIES) inputs[`q12ii-fol-${ability}`] = 'E';
  }
  return inputs;
}

// Runs in the calculator's page. The page's submit handler reads every answer as
// $("#q3 option:selected").val() and writes its working into elements it finds by id, so
// for the length of the run `$` is swapped for one that answers from the profile in
// hand. Nothing is submitted anywhere: a scripted submit event runs the handler and
// never sends the form.
function inPage(given) {
  const profiles = given.makeProfiles(given.rng(given.seed), given.count, given.sizes, given.keys, given.lang1Clb, given.lang2Clb);
  if (given.checksum(JSON.stringify(profiles)) !== given.expected) throw new Error('the page made different profiles than node did');
  const real = window.$;
  const form = document.getElementById('crs-form');
  const outputs = ['core_factors', 'spouse_factors', 'skill_factors', 'totals'];
  const patterns = [
    /Subtotal - Core\/Human capital factors<\/strong> = (\d+)/,
    /Subtotal - Spouse factors<\/strong> = (\d+)/,
    /Subtotal Skill transferability factors<\/strong> = (\d+)/,
    /Subtotal Additional points<\/strong> = (\d+)/,
    /grand total<\/strong>(?:&nbsp;|\s)*= (\d+)/,
  ];
  const wasSpouse = window.with_spouse;
  const rows = [];
  let inputs = {};
  window.$ = (selector) => (typeof selector === 'string' && /^\s*#q\d/.test(selector)
    ? { val: () => inputs[selector.trim().slice(1).split(' ')[0]] }
    : real(selector));
  try {
    for (const values of profiles) {
      const p = Object.fromEntries(given.keys.map((k, i) => [k, values[i]]));
      inputs = given.toInputs(p);
      window.with_spouse = p.spouse === 1;
      for (const id of outputs) document.getElementById(id).innerHTML = '';
      // A real submit event, not jQuery's: the page has two copies of jQuery and the
      // handler is not registered with the one `$` names. The handler cancels it.
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      const shown = outputs.map((id) => document.getElementById(id).innerHTML).join('\n');
      rows.push(patterns.map((pattern) => (shown.match(pattern) ?? [0, '?'])[1]).join(','));
    }
  } finally {
    window.$ = real;
    window.with_spouse = wasSpouse;
  }
  const line = rows.join(';');
  return `${line}#${given.checksum(line)}`;
}

const profiles = makeProfiles(rng(SEED), COUNT, VECTOR_SIZES, VECTOR_KEYS, LANG1_CLB, LANG2_CLB);
// The page's copy of tidy() must not drift from the real one.
for (const values of profiles) {
  const p = Object.fromEntries(VECTOR_KEYS.map((k, i) => [k, values[i]]));
  if (JSON.stringify(tidy(p)) !== JSON.stringify(p)) throw new Error('makeProfiles and tidy() disagree');
}

const [command, resultsPath, outPath = new URL('../test/ircc-vectors.json', import.meta.url)] = process.argv.slice(2);
if (command === 'snippet') {
  const given = `{ seed: ${SEED}, count: ${COUNT}, sizes: ${JSON.stringify(VECTOR_SIZES)}, `
    + `keys: ${JSON.stringify(VECTOR_KEYS)}, lang1Clb: ${JSON.stringify(LANG1_CLB)}, lang2Clb: ${JSON.stringify(LANG2_CLB)}, `
    + `expected: '${checksum(JSON.stringify(profiles))}',\n  rng: ${rng},\n  checksum: ${checksum},\n  makeProfiles: ${makeProfiles},\n  toInputs: ${toInputs} }`;
  console.log(`(${inPage})(${given})`);
} else if (command === 'build' && resultsPath) {
  const [line, sum] = fs.readFileSync(resultsPath, 'utf8').replace(/\s+/g, '').replace(/^["']|["']$/g, '').split('#');
  if (checksum(line) !== sum) throw new Error('the results line does not match its checksum: it was cut or changed on the way');
  const rows = line.split(';').map((row) => row.split(',').map(Number));
  if (rows.length !== COUNT) throw new Error(`expected ${COUNT} results, got ${rows.length}`);
  const vectors = rows.map((row, n) => {
    if (row.length !== SECTIONS.length || !row.every(Number.isInteger)) throw new Error(`profile ${n}: the page did not show every subtotal`);
    const expected = Object.fromEntries(SECTIONS.map((key, i) => [key, row[i]]));
    return {
      profile: Object.fromEntries(VECTOR_KEYS.map((k, i) => [k, profiles[n][i]])),
      spousePoints: expected.spouse, expected,
    };
  });
  fs.writeFileSync(outPath, `${JSON.stringify({
    source: SOURCE,
    generated: new Date().toISOString().slice(0, 10),
    note: 'What IRCC\'s calculator showed for random profiles. Built by tools/ircc-oracle.mjs.',
    vectors,
  })}\n`);
  console.log(`wrote ${vectors.length} vectors`);
} else {
  console.error('usage: node tools/ircc-oracle.mjs snippet\n       node tools/ircc-oracle.mjs build results-file [out.json]');
  process.exit(1);
}
