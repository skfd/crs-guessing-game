// CRS point tables, rules in force from 3 November 2026.
//
// Source: https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html
// Page dated 2026-11-03, read 2026-11-18. Cross-checked against the script of IRCC's own
// calculator (https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp), see
// tools/ircc-oracle.mjs and test/ircc-vectors.json.
//
// Every two-element pair is [with an accompanying spouse, without]. Arrays are indexed by
// the option index of the matching attribute in attributes.js, so the two files must
// change together.

export const SOURCE = {
  url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html',
  pageDate: '2026-11-03',
  readOn: '2026-11-18',
};

// Age options: 18, 19, 20-29 (one plateau), 30 ... 44, 45 or more.
export const AGE = [
  [90, 95, 100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 35, 25, 15, 5, 0],
  [99, 105, 110, 105, 99, 94, 88, 83, 77, 72, 66, 61, 55, 50, 39, 28, 17, 6, 0],
];

// Education: less than secondary, secondary, one-year, two-year, bachelor's (3+ years),
// two or more credentials, master's or professional, doctorate.
export const EDUCATION = [
  [0, 28, 84, 91, 112, 119, 126, 140],
  [0, 30, 90, 98, 120, 128, 135, 150],
];

// First official language, points per ability. Options: CLB 3 or less, 4-5, 6, 7, 8, 9, 10+.
export const LANG1_PER_ABILITY = [
  [0, 6, 8, 16, 22, 29, 32],
  [0, 6, 9, 17, 23, 31, 34],
];
// The CLB level each first-language option stands for (lowest of a merged pair is enough:
// nothing in the tables separates 4 from 5 for a first language).
export const LANG1_CLB = [3, 5, 6, 7, 8, 9, 10];

// Second official language, points per ability. Options: none (CLB 4 or less), 5-6, 7-8, 9+.
export const LANG2_PER_ABILITY = [0, 1, 3, 6];
export const LANG2_CAP = [22, 24];
export const LANG2_CLB = [0, 5, 7, 9];

// Labour Market Integration factor = max(work-length + high-wage bonus, job offer).
// Canadian work: none, 1, 2, 3, 4, 5+ years.
export const CANADIAN_WORK = [
  [0, 35, 46, 56, 63, 70],
  [0, 40, 53, 64, 72, 80],
];
// High-wage tier of that Canadian work: none, 1.3x, 1.5x, 2x the median wage.
export const HIGH_WAGE_WORK = [0, 20, 40, 70];
// High-wage job offer: none, 1.3x, 1.5x, 2x.
export const JOB_OFFER = [0, 50, 70, 100];

// Skill transferability. Rows: credential tier (0 none or secondary, 1 one post-secondary
// credential, 2 two-or-more / master's / doctorate), or foreign work (0 none, 1 one or two
// years, 2 three or more). Columns: strength of the other half (0 none, 1, 2).
//   language half: CLB 7-8 on everything = 1, CLB 9+ on everything = 2
//   Canadian work half: 1 year = 1, 2+ years = 2
export const TRANSFER = [
  [0, 0, 0],
  [0, 13, 25],
  [0, 25, 50],
];
export const TRANSFER_PAIR_CAP = 50; // education pair, and foreign-work pair, each
export const TRANSFER_CAP = 100;

// Additional points.
export const SIBLING = 15;
export const CANADIAN_EDUCATION = [0, 15, 30]; // none, 1-2 year credential, 3+ years
export const FRENCH_BONUS = { withWeakEnglish: 25, withEnglish: 50 }; // English CLB <=4 / 5+
export const NOMINATION = 600;
export const ADDITIONAL_CAP = 600;

// Spouse factors are not modelled per attribute in this prototype: the hidden person's
// spouse points (0-40) are part of the clue. See README.
export const SPOUSE_MAX = 40;
