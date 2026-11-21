// Line-up portraits: a face built from parts, drawn in soft greys, then pushed through a
// "copy of a copy" filter so that only toner and paper are left. No DOM: both exports
// are strings of SVG.
//
// A look says how a person differs from the next one. Every field has a default, so {}
// is a person too.
//   head    face 0-5 (the outline), headW and headH (its stretch), tilt (degrees)
//   body    build (shoulder width), slope (shoulder height), neck (width), sit (how far
//           down the frame), size
//   skin    tone 0-4, as how much of the face the copier turns to toner
//   face    eyes, eyeGap, nose, lips, brows, mouth, age 0-3 (lines and bags)
//   hair    hair, hairTone, beard
//   worn    hat, glasses, top, topTone, extra, extra2
//   light   'r' for light from the right
// Some of the hats and clothes belong to no real place: the cast is from everywhere and
// from nowhere in particular.

const K = '#080808';
const W = '#f8f8f8';
const SKIN = ['#ececec', '#d2d2d2', '#9a9a9a', '#6a6a6a', '#525252'];
const OUT = `stroke="${K}" stroke-width="1.3" stroke-linejoin="round"`;
const THIN = `stroke="${K}" stroke-width=".8" fill="none" stroke-linecap="round"`;

// One hidden <svg> of these goes on the page; every portrait refers to it.
export const PORTRAIT_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="pt-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
  <filter id="pt-softer" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.3"/></filter>
  <linearGradient id="pt-lid" x1="0" x2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="pt-vig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
  ${[3, 11, 27, 42].map((seed, i) => `<filter id="pt-burn${i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="3" seed="${seed}"/>
    <feColorMatrix type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1" result="grain"/>
    <feTurbulence type="fractalNoise" baseFrequency=".035 .02" numOctaves="2" seed="${seed + 5}"/>
    <feColorMatrix type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1" result="blotch"/>
    <feGaussianBlur in="SourceGraphic" stdDeviation=".5" result="soft"/>
    <feComposite in="soft" in2="grain" operator="arithmetic" k2="1" k3="1.5" k4="-.75" result="grainy"/>
    <feComposite in="grainy" in2="blotch" operator="arithmetic" k2="1" k3=".9" k4="-.45"/>
    <feComponentTransfer><feFuncR type="linear" slope="18" intercept="-8.4"/><feFuncG type="linear" slope="18" intercept="-8.4"/><feFuncB type="linear" slope="18" intercept="-8.4"/></feComponentTransfer>
    <feColorMatrix type="matrix" values=".85 0 0 0 .09  0 .84 0 0 .09  0 0 .78 0 .09  0 0 0 1 0"/>
  </filter>`).join('')}
  <clipPath id="pt-neck"><rect x="49" y="78" width="22" height="30"/></clipPath>
</defs></svg>`;

const HEADS = [
  'M38 54 Q38 28 60 28 Q82 28 82 54 Q82 70 74 80 Q67 88 60 88 Q53 88 46 80 Q38 70 38 54Z', // oval
  'M37 54 Q37 28 60 28 Q83 28 83 54 Q83 72 77 81 Q70 89 60 89 Q50 89 43 81 Q37 72 37 54Z', // round
  'M38 52 Q38 28 60 28 Q82 28 82 52 L81 72 Q78 84 68 88 L52 88 Q42 84 39 72Z',             // square
  'M39 52 Q39 27 60 27 Q81 27 81 52 Q81 68 72 80 Q66 90 60 90 Q54 90 48 80 Q39 68 39 52Z', // long
  'M37 50 Q37 27 60 27 Q83 27 83 50 Q83 62 75 74 Q66 91 60 91 Q54 91 45 74 Q37 62 37 50Z', // pointed chin
  'M39 50 Q39 28 60 28 Q81 28 81 50 L84 70 Q82 86 68 89 L52 89 Q38 86 36 70Z',             // heavy jaw
];

const mirror = (d) => `<g transform="translate(120 0) scale(-1 1)">${d}</g>`;
const both = (d) => d + mirror(d);

// ---- hair: [behind the head, in front of it] ----
function hair(style, tone) {
  const fill = tone === 'light' ? `fill="${W}" ${OUT}` : tone === 'grey' ? 'fill="#6e6e6e"' : `fill="${K}"`;
  const shine = tone === 'dark' ? W : K;
  const strand = (d) => `<path d="${d}" stroke="${shine}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".9"/>`;
  const crop = `<path d="M37 54 Q33 23 60 22 Q87 23 83 54 Q81 42 74 37 Q60 32 46 37 Q39 42 37 54Z" ${fill}/>`;
  switch (style) {
    case 'bald': return ['', `<path d="M48 33 Q54 30 60 30" stroke="${K}" stroke-width=".7" fill="none"/>`];
    case 'buzz': return ['', `<path d="M38 50 Q36 26 60 25 Q84 26 82 50 Q78 38 60 36 Q42 38 38 50Z" fill="#7a7a7a"/>`];
    case 'part': return ['', `<path d="M37 55 Q32 22 62 21 Q89 23 83 55 Q82 43 77 38 Q62 41 49 32 Q41 40 37 55Z" ${fill}/>${strand('M52 27 Q62 25 74 31')}${strand('M56 31 Q64 30 72 34')}`];
    case 'fringe': return ['', `<path d="M37 56 Q32 22 60 21 Q88 22 83 56 Q82 46 80 44 Q70 47 60 45 Q50 47 40 44 Q38 46 37 56Z" ${fill}/>${strand('M48 30 Q47 37 49 43')}${strand('M60 28 L60 43')}${strand('M72 30 Q73 37 71 43')}`];
    case 'bob': return [`<path d="M33 52 Q30 19 60 19 Q90 19 87 52 L88 86 Q78 90 73 82 L47 82 Q42 90 32 86Z" ${fill}/>`,
      `<path d="M37 56 Q34 24 60 23 Q86 24 83 56 Q80 42 60 41 Q40 42 37 56Z" ${fill}/>${strand('M46 30 Q52 27 60 27')}${strand('M82 60 L83 80')}`];
    case 'long': return [`<path d="M32 54 Q28 17 60 17 Q92 17 88 54 L94 122 L26 122Z" ${fill}/>`,
      `${both(`<path d="M60 26 Q43 28 37 60 Q33 34 46 25 Q54 21 60 26Z" ${fill}/>`)}${strand('M30 70 Q31 95 29 116')}${strand('M90 70 Q89 95 91 116')}${strand('M34 80 L33 110')}`];
    case 'bun': return [`<circle cx="60" cy="15" r="9.5" ${fill}/>`, `${crop}${strand('M55 12 Q60 9 65 13')}`];
    case 'ponytail': return [`<path d="M80 34 Q102 38 97 84 Q94 96 90 84 Q92 60 82 52Z" ${fill}/>`, `${crop}${strand('M92 50 Q95 64 93 78')}`];
    case 'curly': {
      let c = '';
      for (let a = 190; a <= 350; a += 20) {
        const x = 60 + 24 * Math.cos((a * Math.PI) / 180);
        const y = 48 + 23 * Math.sin((a * Math.PI) / 180);
        c += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.5" ${fill}/>`;
      }
      return ['', `${c}<path d="M40 44 Q42 30 60 29 Q78 30 80 44 Q60 36 40 44Z" ${fill}/>${strand('M46 26 Q49 22 53 25')}${strand('M66 23 Q70 20 74 25')}`];
    }
    case 'afro': {
      let c = `<circle cx="60" cy="42" r="29" ${fill}/>`;
      for (let a = 160; a <= 380; a += 20) {
        const x = 60 + 29 * Math.cos((a * Math.PI) / 180);
        const y = 42 + 29 * Math.sin((a * Math.PI) / 180);
        c += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" ${fill}/>`;
      }
      return [c, `<path d="M39 48 Q41 31 60 30 Q79 31 81 48 Q60 38 39 48Z" ${fill}/>`];
    }
    case 'receding': return ['', `${both(`<path d="M37 58 Q33 34 45 27 Q50 26 50 30 Q44 36 43 46 Q39 48 37 58Z" ${fill}/>`)}<path d="M52 27 Q60 24 68 27" stroke="${K}" stroke-width="1.2" fill="none"/>`];
    case 'mohawk': return ['', `<path d="M53 34 Q49 8 60 4 Q71 8 67 34 Q60 30 53 34Z" ${fill}/>${strand('M58 10 L57 28')}${strand('M63 10 L64 28')}`];
    case 'pigtails': return [both(`<path d="M36 44 Q18 46 20 78 Q24 88 30 78 Q28 62 38 56Z" ${fill}/>`), `${crop}${strand('M60 23 L60 33')}`];
    case 'locs': {
      let ropes = '';
      for (let i = 0; i < 9; i += 1) {
        const x = 32 + i * 7;
        const len = 96 + ((i * 37) % 22);
        ropes += `<rect x="${x - 2.8}" y="36" width="5.600" height="${len - 36}" rx="2.800" ${fill}/>`;
      }
      return [ropes, `${crop}${strand('M52 24 L50 33')}${strand('M60 23 L60 32')}${strand('M68 24 L70 33')}`];
    }
    case 'braids': {
      let b = '';
      for (let y = 56; y <= 116; y += 6.5) b += `<ellipse cx="32" cy="${y}" rx="4.600" ry="4" ${fill}/><ellipse cx="88" cy="${y}" rx="4.600" ry="4" ${fill}/>`;
      return [b, `${crop}${strand('M60 23 L60 34')}`];
    }
    case 'wavy': return [`<path d="M33 50 Q29 18 60 18 Q91 18 87 50 Q95 62 86 72 Q96 84 87 96 Q94 108 84 116 L36 116 Q26 108 33 96 Q24 84 34 72 Q25 62 33 50Z" ${fill}/>`,
      `${both(`<path d="M60 26 Q43 28 37 60 Q33 34 46 25 Q54 21 60 26Z" ${fill}/>`)}${strand('M30 66 Q34 76 29 88')}${strand('M90 66 Q86 76 91 88')}`];
    case 'coils': {
      let c = `<path d="M38 48 Q37 25 60 24 Q83 25 82 48 Q72 36 60 35 Q48 36 38 48Z" ${fill}/>`;
      for (let a = 180; a <= 360; a += 15) {
        const x = 60 + 23 * Math.cos((a * Math.PI) / 180);
        const y = 47 + 23 * Math.sin((a * Math.PI) / 180);
        c += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" ${fill}/>`;
      }
      return ['', c];
    }
    case 'thin': return ['', `${both(`<path d="M37 58 Q34 40 41 34 Q43 44 41 50 Q39 52 37 58Z" ${fill}/>`)}<path d="M44 33 Q60 25 76 33 M47 30 Q60 23 73 30 M52 27.500 Q60 23 68 27.500" stroke="${K}" stroke-width=".9" fill="none"/>`];
    default: return ['', `${crop}${strand('M48 30 Q54 26 62 27')}`];
  }
}
const TALL_HAIR = new Set(['bun', 'afro', 'mohawk', 'curly', 'coils', 'thin']);

// ---- what is worn ----
function top(style, tone) {
  const fill = { dark: '#161616', mid: '#8a8a8a', light: '#f2f2f2' }[tone] ?? '#8a8a8a';
  const ink = tone === 'dark' ? W : K;
  const body = `<path d="M8 142 Q8 106 40 100 L50 96 L70 96 L80 100 Q112 106 112 142Z" fill="${fill}" ${OUT}/>`;
  const line = (d, w = 1) => `<path d="${d}" stroke="${ink}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  switch (style) {
    case 'shirt': return ['', `${body}${both(`<path d="M50 95 L60 108 L47 114Z" fill="${fill}" ${OUT}/>`)}${line('M60 108 L60 142')}<circle cx="60" cy="118" r="1.1" fill="${ink}"/><circle cx="60" cy="130" r="1.1" fill="${ink}"/>`];
    case 'blazer': return ['', `${body}<path d="M49 96 L60 130 L71 96Z" fill="${W}" ${OUT}/>${both(`<path d="M49 96 L44 112 L52 116 L60 130" fill="none" stroke="${ink}" stroke-width="1.1"/>`)}`];
    case 'hoodie': return [`<path d="M34 104 Q36 80 60 80 Q84 80 86 104 Q60 116 34 104Z" fill="${fill}" ${OUT}/>`,
      `${body}<path d="M46 100 Q60 114 74 100" fill="none" stroke="${ink}" stroke-width="1.2"/>${line('M54 108 L53 126', 1.3)}${line('M66 108 L67 126', 1.3)}`];
    case 'turtleneck': return ['', `${body}<rect x="46.5" y="86" width="27" height="16" rx="3" fill="${fill}" ${OUT}/>${line('M52 88 L52 100', 0.7)}${line('M60 88 L60 100', 0.7)}${line('M68 88 L68 100', 0.7)}`];
    case 'plaid': return ['', `${body}<g stroke="${ink}" stroke-width="2.2" opacity=".8"><path d="M26 106 L26 142 M43 100 L43 142 M77 100 L77 142 M94 106 L94 142 M12 118 L108 118 M9 132 L111 132"/></g>${both(`<path d="M50 95 L60 107 L48 112Z" fill="${fill}" ${OUT}/>`)}`];
    case 'chef': return ['', `${body}${line('M52 98 L70 142', 1.1)}${[112, 124, 136].map((y) => `<circle cx="50" cy="${y}" r="1.6" fill="${ink}"/><circle cx="${62 + (y - 112) / 2.6}" cy="${y}" r="1.6" fill="${ink}"/>`).join('')}`];
    case 'parka': return ['', `${body}${line('M60 104 L60 142', 1.6)}<path d="M32 104 Q36 90 48 92 Q60 104 72 92 Q84 90 88 104 Q76 114 60 110 Q44 114 32 104Z" fill="#e9e9e9" ${OUT}/>${line('M40 100 Q42 104 46 104', 0.7)}${line('M74 104 Q78 104 80 100', 0.7)}`];
    case 'overalls': return ['', `${body}<path d="M42 142 L42 122 L78 122 L78 142Z" fill="#161616" ${OUT}/>${both(`<path d="M44 100 L50 99 L47 123 L42 123Z" fill="#161616" ${OUT}/>`)}<circle cx="45" cy="121" r="1.4" fill="${W}"/><circle cx="75" cy="121" r="1.4" fill="${W}"/>`];
    case 'scarf': return ['', `${body}<path d="M42 90 Q60 101 78 90 L80 102 Q60 114 40 102Z" fill="#e9e9e9" ${OUT}/><path d="M66 104 L72 130 L62 130 L60 108Z" fill="#e9e9e9" ${OUT}/><g stroke="${K}" stroke-width=".9"><path d="M48 95 L47 105 M56 98 L56 109 M64 98 L64 108 M72 95 L73 104 M64 118 L70 118 M63 124 L71 124"/></g>`];
    case 'vneck': return ['', `${body}<path d="M48 97 L60 118 L72 97 Q60 101 48 97Z" fill="#c2c2c2" ${OUT}/>`];
    case 'scrubs': return ['', `${body}<path d="M48 97 L60 116 L72 97 Q60 101 48 97Z" fill="#c2c2c2" ${OUT}/><rect x="72" y="122" width="14" height="12" fill="none" stroke="${ink}" stroke-width="1"/>`];
    case 'hiviz': return ['', `${body}${both(`<path d="M30 104 L44 100 L50 142 L34 142Z" fill="${W}" ${OUT}/><path d="M36 112 L46 110 M38 126 L48 125" stroke="${K}" stroke-width="2.4"/>`)}`];
    case 'ruff': {
      const r = [];
      for (let a = 0; a < 360; a += 24) {
        const x = 60 + 24 * Math.cos((a * Math.PI) / 180);
        const y = 101 + 7 * Math.sin((a * Math.PI) / 180);
        r.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.500" fill="${W}" ${OUT}/>`);
      }
      // The far half of the ruff goes behind the neck.
      return [r.slice(8).join(''), `${body}${r.slice(0, 8).join('')}`];
    }
    case 'yoke': return ['', `${body}<path d="M34 102 L60 130 L86 102 Q60 110 34 102Z" fill="#ededed" ${OUT}/><path d="M42 108 L48 113 L54 108 L60 113 L66 108 L72 113 L78 108" stroke="${K}" stroke-width="1.200" fill="none"/><circle cx="60" cy="121" r="1.800" fill="${K}"/><circle cx="53" cy="117" r="1" fill="${K}"/><circle cx="67" cy="117" r="1" fill="${K}"/>`];
    case 'cloak': return [both(`<path d="M34 108 L40 78 L52 98Z" fill="${fill}" ${OUT}/>`),
      `${body}${line('M60 104 L60 142', 1.2)}<path d="M46 106 Q60 112 74 106" stroke="${ink}" stroke-width="1" fill="none" stroke-dasharray="1 1.600"/><circle cx="48" cy="107" r="3.600" fill="${W}" ${OUT}/><circle cx="72" cy="107" r="3.600" fill="${W}" ${OUT}/>`];
    default: return ['', `${body}<path d="M47 98 Q60 109 73 98" fill="none" stroke="${ink}" stroke-width="1.6"/>`]; // tee
  }
}

function hat(style) {
  switch (style) {
    case 'toque': return `<path d="M43 25 Q30 10 45 5 Q50 -5 60 0 Q70 -5 75 5 Q90 10 77 25Z" fill="${W}" ${OUT}/><rect x="42.5" y="23" width="35" height="10" rx="1.5" fill="${W}" ${OUT}/><path d="M50 6 Q52 14 50 22 M60 3 L60 22 M70 6 Q68 14 70 22" ${THIN}/>`;
    case 'beanie': return `<path d="M37 42 Q35 14 60 14 Q85 14 83 42Z" fill="#3a3a3a" ${OUT}/><rect x="35.5" y="36" width="49" height="9" rx="3.5" fill="#e9e9e9" ${OUT}/><circle cx="60" cy="10" r="6.5" fill="#e9e9e9" ${OUT}/><path d="M44 38 L44 43 M52 38 L52 43 M60 38 L60 43 M68 38 L68 43 M76 38 L76 43" ${THIN}/>`;
    case 'cap': return `<path d="M37 42 Q36 16 60 16 Q84 16 83 42Z" fill="#1c1c1c" ${OUT}/><path d="M34 42 Q60 33 86 42 Q92 49 60 46 Q28 49 34 42Z" fill="${K}"/><rect x="51" y="22" width="18" height="10" rx="2" fill="#e9e9e9" ${OUT}/>`;
    case 'hardhat': return `<path d="M35 41 Q35 12 60 12 Q85 12 85 41Z" fill="${W}" ${OUT}/><path d="M29 41 L91 41 L91 46 Q60 43 29 46Z" fill="${W}" ${OUT}/><path d="M56 12 L55 40 M64 12 L65 40" ${THIN}/>`;
    case 'beret': return `<path d="M33 37 Q36 14 62 15 Q92 18 86 38 Q60 28 33 37Z" fill="#141414" ${OUT}/><path d="M62 15 L64 10" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
    case 'headphones': return `<path d="M36 58 Q32 16 60 16 Q88 16 84 58" stroke="${K}" stroke-width="4" fill="none"/>${both(`<rect x="30" y="50" width="9" height="18" rx="3.5" fill="#1c1c1c" stroke="${W}" stroke-width=".8"/>`)}`;
    case 'helmet': return `<path d="M35 44 Q33 13 60 13 Q87 13 85 44 Q60 36 35 44Z" fill="#e9e9e9" ${OUT}/><path d="M45 20 Q43 28 43 38 M55 15 L54 36 M65 15 L66 36 M75 20 Q77 28 77 38" stroke="${K}" stroke-width="3" stroke-linecap="round"/>${both(`<path d="M39 44 L50 86" ${THIN}/>`)}`;
    case 'strawhat': return `<ellipse cx="60" cy="38" rx="42" ry="8" fill="#dedede" ${OUT}/><path d="M40 37 Q40 13 60 13 Q80 13 80 37Z" fill="#dedede" ${OUT}/><path d="M40 33 Q60 38 80 33" stroke="${K}" stroke-width="3.5" fill="none"/><path d="M24 39 L96 39 M30 42 L90 42" ${THIN}/>`;
    case 'bandana': return `<path d="M37 44 Q36 22 60 21 Q84 22 83 44 Q60 34 37 44Z" fill="#2a2a2a" ${OUT}/><path d="M82 40 L94 36 L90 46 L96 52 L84 48Z" fill="#2a2a2a" ${OUT}/><g fill="${W}"><circle cx="48" cy="31" r="1.2"/><circle cx="60" cy="27" r="1.2"/><circle cx="72" cy="31" r="1.2"/><circle cx="54" cy="35" r="1.2"/><circle cx="66" cy="35" r="1.2"/></g>`;
    case 'tophat': return `<rect x="43" y="-2" width="34" height="30" fill="${K}"/><rect x="43" y="19" width="34" height="5" fill="#e9e9e9"/><path d="M30 28 Q60 22 90 28 L90 32 Q60 27 30 32Z" fill="${K}"/>`;
    case 'coil': return `<path d="M38 41 Q33 25 44 15 Q45 0 60 -3 Q75 0 76 15 Q87 25 82 41 Q60 30 38 41Z" fill="#ededed" ${OUT}/><path d="M39 33 Q60 22 81 33 M41 23 Q60 12 79 23 M46 12 Q60 4 74 12" ${THIN}/><circle cx="60" cy="31" r="3" fill="${K}" stroke="${W}" stroke-width=".8"/>`;
    case 'halo': return `<path d="M37 45 Q60 35 83 45" stroke="${K}" stroke-width="4" fill="none"/><path d="M37 45 Q60 35 83 45" stroke="${W}" stroke-width="1.200" fill="none" stroke-dasharray="1.500 2.500"/>`;
    case 'veil': {
      let dots = '';
      for (let i = 0; i <= 8; i += 1) {
        const x = 40 + i * 5;
        const y = 47 - 9 * Math.sin((Math.PI * i) / 8);
        dots += `<circle cx="${x}" cy="${y.toFixed(1)}" r="1.300" fill="${W}"/>`;
      }
      return `<path d="M36 54 Q34 22 60 17 Q86 22 84 54 Q80 40 60 36 Q40 40 36 54Z" fill="#262626" ${OUT}/><path d="M60 17 L55 5 L65 5Z" fill="#262626" ${OUT}/>${dots}`;
    }
    case 'peaks': return `${both(`<path d="M38 42 Q34 20 24 -2 Q48 6 59 31Z" fill="#ededed" ${OUT}/><path d="M33 14 L46 21 M37 26 L52 28" ${THIN}/>`)}<path d="M36 45 Q60 34 84 45 L84 38 Q60 27 36 38Z" fill="#2a2a2a" ${OUT}/>`;
    case 'cowl': return `<path d="M35 58 Q30 19 60 16 Q90 19 85 58 Q85 31 60 29 Q35 31 35 58Z" fill="#202020" ${OUT}/><path d="M83 24 Q106 26 101 58 Q96 42 82 35Z" fill="#202020" ${OUT}/>`;
    case 'beadband': {
      let beads = '';
      for (let i = 0; i <= 8; i += 1) {
        const x = 40 + i * 5;
        const y = 46 - 6 * Math.sin((Math.PI * i) / 8);
        beads += `<circle cx="${x}" cy="${y.toFixed(1)}" r="2.400" fill="${W}" ${OUT}/>`;
      }
      return `${beads}<path d="M60 42 L60 47" stroke="${K}" stroke-width="1"/><circle cx="60" cy="49" r="2" fill="${K}" stroke="${W}" stroke-width=".7"/>`;
    }
    default: return '';
  }
}

// The part of a hat that hangs behind the head.
function hatBack(style) {
  switch (style) {
    case 'halo': {
      let rays = '';
      for (let a = 150; a <= 390; a += 15) {
        const c = Math.cos((a * Math.PI) / 180);
        const q = Math.sin((a * Math.PI) / 180);
        rays += `M${(60 + 27 * c).toFixed(1)} ${(46 + 27 * q).toFixed(1)} L${(60 + 35 * c).toFixed(1)} ${(46 + 35 * q).toFixed(1)} `;
      }
      return `<circle cx="60" cy="46" r="36" fill="#ededed" ${OUT}/><circle cx="60" cy="46" r="26" fill="none" stroke="${K}" stroke-width=".8"/><path d="${rays}" stroke="${K}" stroke-width="1.400"/>`;
    }
    case 'veil': return `<path d="M31 62 Q26 16 60 13 Q94 16 89 62 L100 128 L20 128Z" fill="#262626" ${OUT}/>`;
    case 'cowl': return `<path d="M27 108 Q20 18 60 13 Q100 18 93 108Z" fill="#202020" ${OUT}/>`;
    default: return '';
  }
}
const COVERS_HAIR = new Set(['veil', 'cowl', 'coil']);

function glasses(style) {
  const arms = `<path d="M43.5 55 L38 53 M76.5 55 L82 53 M57 55.5 Q60 53.5 63 55.5" ${THIN.replace('.8', '1.3')}/>`;
  if (style === 'round') return `${both(`<circle cx="50.5" cy="56" r="6.8" fill="${W}" fill-opacity=".35" stroke="${K}" stroke-width="1.5"/>`)}${arms}`;
  if (style === 'square') return `${both(`<rect x="43.5" y="50.5" width="14" height="10.5" rx="2" fill="${W}" fill-opacity=".35" stroke="${K}" stroke-width="1.7"/>`)}${arms}`;
  if (style === 'shades') return `${both(`<path d="M43 51 L57.5 51 L56.5 60 Q50 63 44 60Z" fill="${K}"/><path d="M46 53 L49 53" stroke="${W}" stroke-width="1"/>`)}${arms}`;
  return '';
}

function beard(style, head, tone) {
  const fill = tone === 'light' ? `fill="${W}" ${OUT}` : tone === 'grey' ? 'fill="#5c5c5c"' : `fill="${K}"`;
  const clip = `<clipPath id="pt-b"><path d="${head}"/></clipPath>`;
  switch (style) {
    case 'stubble': return `${clip}<g clip-path="url(#pt-b)"><path d="M36 66 Q48 72 52 73 Q60 70 68 73 Q72 72 84 66 L84 92 L36 92Z" fill="#6a6a6a" opacity=".8"/></g>`;
    case 'moustache': return `<path d="M48 76 Q54 70.5 60 74 Q66 70.5 72 76 Q66 79.5 60 77 Q54 79.5 48 76Z" ${fill}/>`;
    case 'handlebar': return `<path d="M44 72 Q46 77 54 74 Q58 72 60 74 Q62 72 66 74 Q74 77 76 72 Q76 81 66 78.5 Q62 77.5 60 78 Q58 77.5 54 78.5 Q44 81 44 72Z" ${fill}/>`;
    case 'goatee': return `<path d="M51 76 Q60 71 69 76 L68 84 Q60 92 52 84Z" ${fill}/><path d="M55 78.5 Q60 80 65 78.5" stroke="${tone === 'dark' ? W : K}" stroke-width="1.1" fill="none"/>`;
    case 'full': return `${clip}<g clip-path="url(#pt-b)"><path d="M36 62 Q42 70 50 72 Q60 68 70 72 Q78 70 84 62 L84 94 L36 94Z" ${fill}/></g><path d="M54 78 Q60 80.5 66 78" stroke="${tone === 'dark' ? W : K}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    case 'long': return `<path d="M39 64 Q44 71 50 72 Q60 68 70 72 Q76 71 81 64 Q84 92 60 112 Q36 92 39 64Z" ${fill}/><path d="M54 78 Q60 80.5 66 78" stroke="${tone === 'dark' ? W : K}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}

const BROWS = {
  flat: 'M45 49.5 Q50 48 56 49.5',
  raised: 'M45 48 Q50 44.5 56 47.5',
  stern: 'M45 47 Q51 48 56.5 51',
  worried: 'M45 50 Q50 46.5 56 46.5',
  thick: 'M44.5 49.5 Q50 46.5 56.5 49.5',
};
const MOUTHS = {
  flat: `<path d="M53 77.5 Q60 76.5 67 77.5" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  smile: `<path d="M52 76 Q60 81.5 68 76" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  smirk: `<path d="M53 78 Q61 79 68 74.5" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  grin: `<path d="M51 75.5 Q60 77 69 75.5 Q60 85 51 75.5Z" fill="${W}" stroke="${K}" stroke-width="1.3"/>`,
  frown: `<path d="M53 79 Q60 75.5 67 79" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  o: `<ellipse cx="60" cy="78" rx="3" ry="3.4" fill="${K}"/>`,
};
// The line of each mouth that is a line: start, control point, end.
const LIP_LINES = {
  flat: [53, 77.5, 60, 76.5, 67, 77.5],
  smile: [52, 76, 60, 81.5, 68, 76],
  smirk: [53, 78, 61, 79, 68, 74.5],
  frown: [53, 79, 60, 75.5, 67, 79],
};

// A mouth on dark skin, where a black line would not show and a white one looks cut out.
// The light is drawn instead, one of three ways:
//   glint    the light on the lower lip
//   rim      the edge of the lower lip, thinly
//   stipple  both lips in a grey the copier cannot make up its mind about
// A grin is its teeth and an "o" is a hole, so those two are left as they are.
const DARK_LIPS = ['glint', 'rim', 'glint', 'rim', 'stipple'];
function darkMouth(kind, full, how) {
  const at = LIP_LINES[kind];
  if (!at) return MOUTHS[kind].replaceAll(`stroke="${K}"`, `stroke="${W}"`);
  const [x0, y0, cx, cy, x1, y1] = at;
  const part = `<path d="M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}" stroke="${K}" stroke-width="1.300" fill="none" stroke-linecap="round"/>`;
  // A lip is the space between the mouth's line and the same line pulled up or down.
  const lip = (pull, inset = 0) => `M${x0 + inset} ${y0} Q${cx} ${cy} ${x1 - inset} ${y1} Q${cx} ${cy + pull} ${x0 + inset} ${y0}Z`;
  const deep = full ? 9 : 6.5;
  if (how === 'stipple') return `<path d="${lip(deep)}" fill="#a4a4a4"/><path d="${lip(full ? -5 : -3.5)}" fill="#a4a4a4"/>${part}`;
  if (how === 'rim') return `${part}<path d="M${x0 + 2} ${y0 + 1.2} Q${cx} ${cy + deep} ${x1 - 2} ${y1 + 1.2}" stroke="${W}" stroke-width=".800" fill="none" stroke-linecap="round"/>`;
  return `<path d="${lip(deep, 1.5)}" fill="${W}"/>${part}`;
}

function extra(kind) {
  switch (kind) {
    case 'tie': return `<path d="M57 107 L63 107 L62 112 L65 136 L60 141 L55 136 L58 112Z" fill="${K}" stroke="${W}" stroke-width=".6"/>`;
    case 'bowtie': return `<path d="M60 104 L50 99 L50 110Z M60 104 L70 99 L70 110Z" fill="${K}" stroke="${W}" stroke-width=".6"/><circle cx="60" cy="104.500" r="2" fill="${K}" stroke="${W}" stroke-width=".6"/>`;
    case 'stethoscope': return `<path d="M47 100 Q44 126 58 128 Q72 126 73 100" stroke="${K}" stroke-width="2.2" fill="none"/><path d="M47 100 Q44 126 58 128 Q72 126 73 100" stroke="${W}" stroke-width=".6" fill="none"/><circle cx="58" cy="131" r="4" fill="#e9e9e9" ${OUT}/>`;
    case 'lanyard': return `<path d="M49 99 L58 124 M71 99 L62 124" stroke="${K}" stroke-width="1.6"/><rect x="52" y="123" width="16" height="12" rx="1" fill="${W}" ${OUT}/><path d="M55 128 L65 128 M55 131 L62 131" stroke="${K}" stroke-width=".8"/>`;
    case 'earrings': return both(`<circle cx="37" cy="69" r="2.6" fill="none" stroke="${K}" stroke-width="1.3"/>`);
    case 'necklace': return `<path d="M50 98 Q60 112 70 98" stroke="${K}" stroke-width="1" fill="none" stroke-dasharray=".5 2" stroke-linecap="round"/><circle cx="60" cy="106" r="2" fill="${W}" ${OUT}/>`;
    case 'pencil': return `<path d="M80 60 L92 40" stroke="${W}" stroke-width="3.4" stroke-linecap="round"/><path d="M80 60 L92 40" stroke="${K}" stroke-width="2" stroke-linecap="round"/>`;
    case 'mic': return `<path d="M84 60 Q86 76 70 80" stroke="${K}" stroke-width="1.6" fill="none"/><ellipse cx="68" cy="80.500" rx="3.4" ry="2.4" fill="${K}"/>`;
    case 'flower': return `<g transform="translate(79 40)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(4 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" cy="${(4 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" r="3" fill="${W}" ${OUT}/>`).join('')}<circle r="2" fill="${K}"/></g>`;
    case 'whistle': return `<path d="M50 99 L60 122 L70 99" stroke="${K}" stroke-width="1" fill="none"/><rect x="55" y="121" width="11" height="6" rx="2" fill="${W}" ${OUT}/>`;
    case 'bandaid': return `<g transform="rotate(-25 71 66)"><rect x="66" y="64" width="10" height="4" rx="1.5" fill="${W}" ${OUT}/></g>`;
    case 'freckles': return `<g fill="${K}">${[[47, 64], [50, 66], [53, 63.5], [67, 63.5], [70, 66], [73, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6"/>`).join('')}</g>`;
    case 'scar': return `<path d="M68 44 L73 58 M68.500 50 L72 49 M70 55 L73.500 54" stroke="${K}" stroke-width=".8"/>`;
    case 'monocle': return `<circle cx="69.500" cy="56" r="6.5" fill="${W}" fill-opacity=".3" stroke="${K}" stroke-width="1.5"/><path d="M75 60 Q80 80 74 100" ${THIN}/>`;
    case 'browdots': return `<g fill="${K}" stroke="${W}" stroke-width=".500"><circle cx="54" cy="43.500" r="1.300"/><circle cx="60" cy="41.500" r="1.600"/><circle cx="66" cy="43.500" r="1.300"/></g>`;
    case 'neckrings': return [86, 91, 96].map((y) => `<rect x="46.500" y="${y}" width="27" height="4.400" rx="2.200" fill="#ededed" ${OUT}/>`).join('');
    default: return '';
  }
}

const EYES = {
  almond: 'M46.500 56 Q50.500 52.800 54.800 56 Q50.500 58.200 46.500 56Z',
  round: 'M47.700 55.800 Q47.700 52.600 50.700 52.600 Q53.700 52.600 53.700 55.800 Q53.700 58.600 50.700 58.600 Q47.700 58.600 47.700 55.800Z',
  narrow: 'M46 56.300 Q50.500 54 55.300 56 Q50.500 57.500 46 56.300Z',
  hooded: 'M46.500 56.500 Q50.500 54 54.800 56.500 Q50.500 58.600 46.500 56.500Z M45.500 54.200 Q50.500 51.200 55.800 54.200 L55.800 55 Q50.500 52.400 45.500 55Z',
  wide: 'M45.500 56 Q50.500 51.500 55.800 56 Q50.500 59.300 45.500 56Z',
};
const NOSES = { mid: [1, 1], narrow: [0.72, 1], wide: [1.38, 1.05], long: [0.9, 1.5], button: [0.8, 0.7] };

const ON_TOP = new Set(['browdots', 'pencil', 'flower', 'freckles', 'scar', 'bandaid', 'monocle', 'earrings', 'mic']);

function lcg(seed) {
  let s = (seed * 2654435761 + 12345) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// The picture of one person. `seed` moves the dirt around, so no two copies are alike.
export function portrait(look = {}, seed = 1) {
  const r = lcg(seed);
  const head = HEADS[look.face ?? 0] ?? HEADS[0];
  const tone = look.tone ?? 0;
  const skin = SKIN[tone] ?? SKIN[0];
  // On dark skin the copier leaves highlights, not shadows: the marks turn white.
  const dark = tone >= 3;
  const mark = dark ? W : K;
  const hatted = look.hat && !['headphones', 'halo', 'beadband'].includes(look.hat);
  const style = COVERS_HAIR.has(look.hat) ? 'bald' : hatted && TALL_HAIR.has(look.hair) ? 'crop' : look.hair;
  let [hairBack, hairFront] = hair(style, look.hairTone ?? 'dark');
  if (COVERS_HAIR.has(look.hat)) { hairBack = ''; hairFront = ''; }
  const [topBack, topFront] = top(look.top, look.topTone ?? 'mid');
  const flip = look.light === 'r' ? 'transform="translate(120 0) scale(-1 1)"' : '';
  const id = `pt-h${seed}`;
  // Most extras sit on the clothes; a few go on the face or over the hair.
  const extras = [look.extra, look.extra2].filter(Boolean);
  const onTop = extras.filter((e) => ON_TOP.has(e));
  const worn = extras.filter((e) => !ON_TOP.has(e));
  const brow = BROWS[look.brows] ?? BROWS.flat;
  const gap = look.eyeGap ?? 0;
  const eyePath = EYES[look.eyes] ?? EYES.almond;
  const oneEye = dark
    ? `<path d="${EYES.wide}" fill="${W}"/><circle cx="50.700" cy="55.800" r="1.900" fill="${K}"/>`
    : `<path d="${eyePath}" fill="${K}"/><circle cx="51.300" cy="55.300" r=".55" fill="${W}"/>`;
  const eyes = look.glasses === 'shades' ? '' : both(`<g transform="translate(${-gap} 0)">${oneEye}</g>`);
  const [nw, nh] = NOSES[look.nose] ?? NOSES.mid;
  const nose = `<g transform="translate(60 71) scale(${nw} ${nh}) translate(-60 -71)"><path d="M55 70.500 Q57 68.800 58.500 70.800 Q60 72 61.500 70.800 Q63 68.800 65 70.500 Q62.500 73.200 60 72.600 Q57.500 73.200 55 70.500Z" fill="${K}"/>${dark ? `<path d="M58.500 56 L58 67" stroke="${W}" stroke-width="2" stroke-linecap="round" filter="url(#pt-softer)"/>` : ''}</g>`;
  const fullLips = look.lips === 'full' && ['flat', 'smile', 'smirk', undefined].includes(look.mouth)
    ? `<path d="M54 78.500 Q60 84.500 66 78.500 Q60 80.500 54 78.500Z" fill="#5a5a5a"/>` : '';
  const age = look.age ?? 1;
  const wear = (d, w = 0.8) => `<path d="${d}" stroke="${mark}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const lines = (age >= 2 ? both(wear('M54 69.500 Q50.500 74 52 79.500') + wear('M47 60 Q50.500 62.300 54.500 60.200', 0.7)) : '')
    + (age >= 3 ? wear('M50 40.500 Q60 38.500 70 40.500') + wear('M52 44.500 Q60 43 68 44.500')
      + both(wear('M43.800 54 L41.600 52.600 M43.800 56.200 L41.400 56.800', 0.7) + wear('M44 78 Q45 84.500 50.500 86.500')) : '');

  // Shadows on light skin; on dark skin, what little the light still catches.
  const shade = [0.92, 0.92, 0.8, 0.5, 0.3][tone] ?? 0.92;
  const shine = [0, 0, 0.55, 0.9, 0.9][tone] ?? 0;
  const face = `<clipPath id="${id}"><path d="${head}"/></clipPath>
    <g clip-path="url(#${id})">
      <rect x="30" y="20" width="60" height="76" fill="${skin}"/>
      <g ${flip}>
        <path d="M70 22 Q76 44 71 62 Q69 76 74 96 L96 96 L96 22Z" fill="#000" opacity="${shade}" filter="url(#pt-soft)"/>
        <path d="M61 52 L66.500 69 L60.500 71.500Z" fill="#000" opacity="${shade * 0.8}" filter="url(#pt-softer)"/>
        <ellipse cx="60" cy="90" rx="13" ry="4" fill="#000" opacity=".5" filter="url(#pt-soft)"/>
        ${shine ? `<g fill="#fff" opacity="${shine}" filter="url(#pt-softer)"><ellipse cx="52" cy="40" rx="${tone === 4 ? 7.500 : 9}" ry="${tone === 4 ? 4.500 : 5.500}"/><ellipse cx="47" cy="65" rx="${tone === 4 ? 4 : 4.500}" ry="${tone === 4 ? 4.500 : 5}"/><ellipse cx="57" cy="84" rx="4" ry="2.200"/></g>` : ''}
      </g>
      ${both(`<ellipse cx="50.500" cy="54.500" rx="7" ry="4.200" fill="#000" opacity="${dark ? 0.7 : 0.42}" filter="url(#pt-softer)"/>`)}
      <ellipse cx="60" cy="82.500" rx="5.500" ry="1.800" fill="#000" opacity=".45" filter="url(#pt-softer)"/>
    </g>
    <path d="${head}" fill="none" stroke="${K}" stroke-width="1.100"/>
    ${both(`<g transform="translate(${-gap} 0)"><path d="${brow}" stroke="${K}" stroke-width="${look.brows === 'thick' ? 3 : 2}" fill="none" stroke-linecap="round"/></g>`)}
    ${eyes}${nose}${lines}
    ${dark ? darkMouth(MOUTHS[look.mouth] ? look.mouth : 'flat', look.lips === 'full', DARK_LIPS[(seed * 7 + 3) % DARK_LIPS.length]) : (MOUTHS[look.mouth] ?? MOUTHS.flat) + fullLips}`;

  const neckW = look.neck ?? 22;
  const neck = `<clipPath id="${id}n"><rect x="${60 - neckW / 2}" y="78" width="${neckW}" height="30"/></clipPath>
    <g clip-path="url(#${id}n)"><rect x="40" y="78" width="40" height="30" fill="${skin}"/>
      <ellipse cx="${look.light === 'r' ? 56 : 64}" cy="91" rx="15" ry="8" fill="#000" opacity=".85" filter="url(#pt-soft)"/></g>
    <path d="M${60 - neckW / 2} 84 L${60 - neckW / 2} 100 M${60 + neckW / 2} 84 L${60 + neckW / 2} 100" stroke="${K}" stroke-width="1"/>`;
  const ears = COVERS_HAIR.has(look.hat) && look.hat !== 'coil' ? ''
    : both(`<path d="M38.500 53 Q33 51 33.500 59 Q34 66 39 67Z" fill="${skin}" stroke="${K}" stroke-width="1"/>`);

  // The head stretches and tips about the chin; the body about the bottom of the frame.
  const headAt = `transform="rotate(${look.tilt ?? 0} 60 88) translate(60 88) scale(${look.headW ?? 1} ${look.headH ?? 1}) translate(-60 -88)"`;
  const bodyAt = `transform="translate(60 142) scale(${look.build ?? 1} ${look.slope ?? 1}) translate(-60 -142)"`;
  const sitAt = `transform="translate(0 ${look.sit ?? 0}) translate(60 142) scale(${look.size ?? 1}) translate(-60 -142)"`;

  // Dirt: the copier lid's shadow, a toner streak, a dropout line, specks.
  const streak = (20 + r() * 80).toFixed(1);
  const drop = (15 + r() * 90).toFixed(1);
  const lidSide = r() < 0.5;
  let specks = '';
  for (let i = 0; i < 9; i += 1) {
    specks += `<circle cx="${(r() * 120).toFixed(1)}" cy="${(r() * 140).toFixed(1)}" r="${(0.3 + r() * 0.9).toFixed(2)}" fill="#000"/>`;
  }
  const tilt = (r() * 3.2 - 1.6).toFixed(2);

  return `<svg viewBox="0 0 120 140" class="portrait" role="img" aria-hidden="true"><g filter="url(#pt-burn${seed % 4})">
    <rect width="120" height="140" fill="#000"/>
    <g transform="rotate(${tilt} 60 70)">
      <rect x="-6" y="${(1 + r() * 2).toFixed(1)}" width="132" height="146" fill="#dcdcdc"/>
      <rect x="-6" y="0" width="132" height="146" fill="url(#pt-vig)"/>
      <g ${sitAt}>
        <g ${headAt}>${hatBack(look.hat)}${hairBack}</g>
        <g ${bodyAt}>${topBack}</g>${neck}<g ${bodyAt}>${topFront}</g>${worn.map(extra).join('')}
        <g ${headAt}>${ears}${face}${beard(look.beard, head, look.hairTone ?? 'dark').replaceAll("pt-b", `${id}b`)}${hairFront}${glasses(look.glasses)}${hat(look.hat)}
        ${onTop.map(extra).join('')}</g>
      </g>
    </g>
    <rect ${lidSide ? 'x="0"' : 'x="104" transform="translate(224 0) scale(-1 1)"'} width="16" height="140" fill="url(#pt-lid)"/>
    <rect x="${streak}" width="${(0.5 + r() * 0.9).toFixed(2)}" height="140" fill="#000" opacity=".7"/>
    <rect x="${drop}" width="${(0.6 + r() * 1.2).toFixed(2)}" height="140" fill="#fff" opacity=".8"/>
    <rect y="${(20 + r() * 100).toFixed(1)}" width="120" height="${(3 + r() * 6).toFixed(1)}" fill="#fff" opacity=".22"/>
    ${specks}
  </g></svg>`;
}
