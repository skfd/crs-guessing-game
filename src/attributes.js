// The attributes a guess is made of. One table, so adding or cutting a column is one edit
// here (plus its points in tables.js and score.js).
//
// A profile is an object of option indexes: { age: 2, edu: 4, ... }.
//
//   kind     'ordinal' options are ordered; feedback carries an up/down arrow
//            'choice'  options are not ordered; feedback is right or wrong
//   close    ordinal only: how many steps away still counts as yellow
//   lower    true when the attribute can stop mattering to the score, in which case it is
//            lowered to its first option that scores the same (see profile.js)

export const ATTRIBUTES = [
  {
    key: 'spouse', label: 'Spouse', kind: 'choice',
    options: ['No accompanying spouse', 'Accompanying spouse'],
    short: ['Single', 'Spouse'],
  },
  {
    key: 'age', label: 'Age', kind: 'ordinal', close: 2,
    options: ['18', '19', '20 to 29', '30', '31', '32', '33', '34', '35', '36', '37', '38',
      '39', '40', '41', '42', '43', '44', '45 or more'],
    short: ['18', '19', '20–29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
      '40', '41', '42', '43', '44', '45+'],
  },
  {
    key: 'edu', label: 'Education', kind: 'ordinal', close: 1,
    options: ['Less than secondary school', 'Secondary school', 'One-year credential',
      'Two-year credential', "Bachelor's or 3+ year credential",
      'Two or more credentials (one 3+ years)', "Master's or professional degree",
      'Doctorate'],
    short: ['< HS', 'HS', '1-yr', '2-yr', 'Bach', '2+ cred', 'Master', 'PhD'],
  },
  {
    key: 'lang1', label: 'First language', kind: 'ordinal', close: 1,
    options: ['CLB 3 or less', 'CLB 4–5', 'CLB 6', 'CLB 7', 'CLB 8', 'CLB 9', 'CLB 10+'],
    short: ['≤3', '4–5', '6', '7', '8', '9', '10+'],
  },
  {
    key: 'lang2', label: 'Second language', kind: 'ordinal', close: 1, lower: true,
    options: ['None (CLB 4 or less)', 'CLB 5–6', 'CLB 7–8', 'CLB 9+'],
    short: ['None', '5–6', '7–8', '9+'],
  },
  {
    key: 'first', label: 'Stronger in', kind: 'choice', lower: true,
    options: ['English', 'French'],
    short: ['EN', 'FR'],
  },
  {
    key: 'cwe', label: 'Canadian work', kind: 'ordinal', close: 1, lower: true,
    options: ['None', '1 year', '2 years', '3 years', '4 years', '5+ years'],
    short: ['0', '1y', '2y', '3y', '4y', '5y+'],
  },
  {
    key: 'hw', label: 'High-wage work', kind: 'ordinal', close: 1, lower: true,
    options: ['Not high-wage', '1.3× median wage', '1.5× median wage', '2× median wage'],
    short: ['No', '1.3×', '1.5×', '2×'],
  },
  {
    key: 'offer', label: 'Job offer', kind: 'ordinal', close: 1, lower: true,
    options: ['None', '1.3× median wage', '1.5× median wage', '2× median wage'],
    short: ['No', '1.3×', '1.5×', '2×'],
  },
  {
    key: 'foreign', label: 'Foreign work', kind: 'ordinal', close: 0, lower: true,
    options: ['None', '1–2 years', '3+ years'],
    short: ['0', '1–2y', '3y+'],
  },
  {
    key: 'canEdu', label: 'Studied in Canada', kind: 'ordinal', close: 0,
    options: ['No', '1–2 year credential', '3+ year credential'],
    short: ['No', '1–2y', '3y+'],
  },
  {
    key: 'sibling', label: 'Sibling in Canada', kind: 'choice',
    options: ['No', 'Yes'],
    short: ['No', 'Yes'],
  },
];
// A provincial nomination is not here, on purpose: it is worth 600 points, so a nominated
// person's score says "nominated" and little else. score.js still knows the rule; nothing
// in the game sets it.

export const KEYS = ATTRIBUTES.map((a) => a.key);
export const BY_KEY = Object.fromEntries(ATTRIBUTES.map((a) => [a.key, a]));

// The order in which score-irrelevant attributes are lowered. The job offer goes first so
// that an offer that loses to the work-experience path is dropped before anything else.
export const LOWER_ORDER = ['offer', 'hw', 'cwe', 'foreign', 'lang2', 'first'];
