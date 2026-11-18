// Builds test/ircc-vectors.json by running IRCC's own calculator script on random profiles.
//
//   curl -L -A "Mozilla/5.0" -o tool.html https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp
//   node tools/ircc-oracle.mjs path/to/tool.html
//
// The page's script is not copied into this repo. It is read from the downloaded page, its
// point tables and submit handler are run in a sandbox with a fake jQuery, and only the
// inputs and the resulting subtotals are kept. Re-run this when IRCC changes the tool.

import fs from 'node:fs';
import vm from 'node:vm';
import { ATTRIBUTES } from '../src/attributes.js';
import { tidy } from '../src/score.js';
import { rng } from '../src/rng.js';

const [toolPath, outPath = new URL('../test/ircc-vectors.json', import.meta.url)] = process.argv.slice(2);
if (!toolPath) {
  console.error('usage: node tools/ircc-oracle.mjs path/to/tool.html [out.json]');
  process.exit(1);
}
const html = fs.readFileSync(toolPath, 'utf8');

function slice(from, to) {
  const start = html.indexOf(from);
  const end = html.indexOf(to, start);
  if (start < 0 || end < 0) throw new Error(`cannot find "${from}" ... "${to}" in the page`);
  return html.slice(start, end);
}
const tablesCode = slice('var with_spouse = false;', '// Question 1:');
const handlerCode = slice('$( "#crs-form" ).submit(', '</script>');

function runIrcc(inputs, withSpouse) {
  const elements = {};
  const context = {
    handler: null,
    fol_lang: 'eng',
    parseInt,
    Math,
    document: {
      getElementById: (id) => (elements[id] ??= { innerHTML: '', style: {} }),
    },
  };
  context.$ = (selector) => ({
    append() {},
    submit(fn) { context.handler = fn; },
    val() { return inputs[selector.trim().replace(/^#/, '').split(' ')[0]]; },
  });
  vm.createContext(context);
  vm.runInContext(tablesCode, context);
  vm.runInContext(handlerCode, context);
  context.with_spouse = withSpouse;
  context.handler({ preventDefault() {} });
  const all = Object.values(elements).map((e) => e.innerHTML).join('\n');
  const grab = (re) => {
    const m = all.match(re);
    if (!m) throw new Error(`no match for ${re}`);
    return Number(m[1]);
  };
  return {
    core: grab(/Subtotal - Core\/Human capital factors<\/strong> = (\d+)/),
    spouse: grab(/Subtotal - Spouse factors<\/strong> = (\d+)/),
    transfer: grab(/Subtotal Skill transferability factors<\/strong> = (\d+)/),
    additional: grab(/Subtotal Additional points<\/strong> = (\d+)/),
    total: grab(/grand total<\/strong>&nbsp;= (\d+)/),
  };
}

// Our option indexes -> the calculator's option letters.
const AGE = ['B', 'C', 'D', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC'];
const LETTERS = 'ABCDEFGH';
const LANG1 = ['A', 'C', 'D', 'E', 'F', 'G', 'H']; // CLB 0-3, 5, 6, 7, 8, 9, 10
const LANG2 = ['A', 'C', 'E', 'G']; // none, CLB 5, 7, 9
const FOREIGN = ['A', 'B', 'D'];
const OFFER = [null, 'C', 'B', 'A'];
const ABILITIES = ['speaking', 'listening', 'reading', 'writing'];

function toInputs(p) {
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
    q6v: FOREIGN[p.foreign],
    q7: 'A',
    q8: p.offer > 0 ? 'B' : 'A',
    q8a: OFFER[p.offer] ?? undefined,
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

const random = rng(20261103);
const vectors = [];
for (let n = 0; n < 600; n += 1) {
  const raw = {};
  for (const a of ATTRIBUTES) raw[a.key] = Math.floor(random() * a.options.length);
  // Nominations swamp everything else, so keep them to a minority of the vectors.
  if (random() < 0.8) raw.pnp = 0;
  const profile = tidy(raw);
  const expected = runIrcc(toInputs(profile), profile.spouse === 1);
  vectors.push({ profile, spousePoints: expected.spouse, expected });
}

fs.writeFileSync(outPath, `${JSON.stringify({
  source: 'https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp',
  generated: new Date().toISOString().slice(0, 10),
  note: 'Outputs of IRCC\'s calculator script for random profiles. Built by tools/ircc-oracle.mjs.',
  vectors,
})}\n`);
console.log(`wrote ${vectors.length} vectors`);
