// Builds data/lineup.json from the hand-written cast in tools/lineup-cast.mjs, and says
// what it found: profiles the game would read differently, how the scores spread, which
// options nobody has, and how often a round has to fall back on "whoever is nearest".
//
//   node tools/make-lineup.mjs          write the file
//   node tools/make-lineup.mjs --check  report only

import fs from 'node:fs';
import { ATTRIBUTES, KEYS } from '../src/attributes.js';
import { canonical } from '../src/profile.js';
import { score } from '../src/score.js';
import { cast, roundsForDay, roundIsFair, ROUNDS } from '../src/rounds.js';
import { CAST } from './lineup-cast.mjs';

const LANG1 = { 3: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5, 10: 6 };
const LANG2 = { 5: 1, 7: 2, 9: 3 };

function parseProfile(words) {
  const p = Object.fromEntries(KEYS.map((k) => [k, 0]));
  let sp = 0;
  for (const w of words.split(/\s+/)) {
    let m;
    if (/^\d+$/.test(w)) {
      const age = Number(w);
      p.age = age <= 19 ? age - 18 : age <= 29 ? 2 : age >= 45 ? 18 : age - 27;
    } else if ((m = /^e(\d)$/.exec(w))) p.edu = Number(m[1]);
    else if ((m = /^(EN|FR)(\d+)(?:\/(\d))?$/.exec(w))) {
      p.first = m[1] === 'FR' ? 1 : 0;
      p.lang1 = LANG1[m[2]];
      p.lang2 = m[3] ? LANG2[m[3]] : 0;
    } else if ((m = /^c(\d)$/.exec(w))) p.cwe = Number(m[1]);
    else if ((m = /^h(\d)$/.exec(w))) p.hw = Number(m[1]);
    else if ((m = /^o(\d)$/.exec(w))) p.offer = Number(m[1]);
    else if ((m = /^w(\d)$/.exec(w))) p.foreign = Number(m[1]);
    else if ((m = /^s(\d)$/.exec(w))) p.canEdu = Number(m[1]);
    else if (w === 'sib') p.sibling = 1;
    else if (w === 'pnp') p.pnp = 1;
    else if ((m = /^sp(\d+)$/.exec(w))) { p.spouse = 1; sp = Number(m[1]); }
    else throw new Error(`profile word not understood: ${w}`);
  }
  for (const k of KEYS) if (!Number.isInteger(p[k])) throw new Error(`bad ${k} in "${words}"`);
  return { p, sp };
}

const HAIR = ['bald', 'buzz', 'crop', 'part', 'fringe', 'bob', 'long', 'bun', 'ponytail', 'curly', 'afro', 'receding', 'mohawk', 'pigtails'];
const HATS = ['toque', 'beanie', 'cap', 'hardhat', 'beret', 'headphones', 'helmet', 'strawhat', 'bandana', 'tophat'];
const TOPS = ['tee', 'shirt', 'blazer', 'hoodie', 'turtleneck', 'plaid', 'chef', 'parka', 'overalls', 'scarf', 'vneck', 'scrubs', 'hiviz'];
const GLASSES = ['round', 'square', 'shades'];
const BEARDS = { stubble: 'stubble', moustache: 'moustache', handlebar: 'handlebar', goatee: 'goatee', fullbeard: 'full', longbeard: 'long' };
const BROWS = ['raised', 'stern', 'worried', 'thick'];
const MOUTHS = ['smile', 'smirk', 'grin', 'frown', 'o', 'flat'];
const EXTRAS = ['tie', 'bowtie', 'stethoscope', 'lanyard', 'earrings', 'necklace', 'pencil', 'mic', 'flower', 'whistle', 'bandaid', 'freckles', 'scar', 'monocle'];

function parseLook(words) {
  const look = {};
  for (const w of words.split(/\s+/)) {
    const [name, tone] = w.split(':');
    let m;
    if (HAIR.includes(w)) look.hair = w;
    else if (HATS.includes(w)) look.hat = w;
    else if (TOPS.includes(name)) { look.top = name; if (tone) look.topTone = tone; }
    else if (GLASSES.includes(w)) look.glasses = w;
    else if (w in BEARDS) look.beard = BEARDS[w];
    else if (BROWS.includes(w)) look.brows = w;
    else if (MOUTHS.includes(w)) look.mouth = w;
    else if (EXTRAS.includes(w)) {
      // One extra is drawn; freckles, a scar and a plaster can sit with another.
      if (look.extra) look.extra2 = w; else look.extra = w;
    } else if ((m = /^f(\d)$/.exec(w))) look.face = Number(m[1]);
    else if ((m = /^t(\d)$/.exec(w))) look.tone = Number(m[1]);
    else if (w === 'r') look.light = 'r';
    else if (w === 'grey') look.hairTone = 'grey';
    else if (w === 'white' || w === 'light') look.hairTone = 'light';
    else throw new Error(`look word not understood: ${w}`);
  }
  return look;
}

const people = [];
let lowered = 0;
for (const [name, job, quirk, profileWords, lookWords] of CAST) {
  const { p, sp } = parseProfile(profileWords);
  const c = canonical(p, sp);
  if (c.lowered.length) {
    lowered += 1;
    console.log(`  ${name}: ${c.lowered.join(', ')} made no difference and ${c.lowered.length > 1 ? 'were' : 'was'} lowered`);
  }
  people.push({ name, job, quirk, p: KEYS.map((k) => c.profile[k]), sp, look: parseLook(lookWords) });
}

const file = {
  note: 'The line-up cast, built by tools/make-lineup.mjs from tools/lineup-cast.mjs. p is the option index of each attribute in the order of keys; sp is the spouse section points.',
  keys: KEYS,
  people,
};

// ---- the report ----
const all = cast(file);
const names = new Set(all.map((x) => x.name));
if (names.size !== all.length) throw new Error('two people share a name');
const totals = all.map((x) => x.score.total).sort((a, b) => a - b);
console.log(`${all.length} people, ${lowered} lowered. Totals ${totals[0]} to ${totals[totals.length - 1]}.`);
const dupes = totals.filter((t, i) => t === totals[i - 1]);
console.log(`Totals shared by more than one person: ${dupes.length ? [...new Set(dupes)].join(', ') : 'none'}`);
const bands = {};
for (const t of totals) bands[Math.floor(t / 50) * 50] = (bands[Math.floor(t / 50) * 50] ?? 0) + 1;
console.log('By band of 50:', Object.entries(bands).map(([b, n]) => `${b}:${n}`).join(' '));
for (const a of ATTRIBUTES) {
  const used = new Set(all.map((x) => x.profile[a.key]));
  const missing = a.options.map((_, i) => i).filter((i) => !used.has(i));
  if (missing.length) console.log(`  nobody has ${a.label}: ${missing.map((i) => a.short[i]).join(', ')}`);
}
let unfair = 0;
const DAYS = 366;
for (let day = 1; day <= DAYS; day += 1) {
  for (const round of roundsForDay(all, day)) if (!roundIsFair(round)) unfair += 1;
}
console.log(`Rounds that fell back on the nearest scores: ${unfair} of ${DAYS * ROUNDS}`);
void score;

if (!process.argv.includes('--check')) {
  const json = `${JSON.stringify(file, null, 1)
    .replace(/\[\s+([\d,\s]+?)\s+\]/g, (_, body) => `[${body.replace(/\s+/g, '')}]`)}\n`;
  fs.writeFileSync(new URL('../data/lineup.json', import.meta.url), json);
  console.log('Wrote data/lineup.json');
}
