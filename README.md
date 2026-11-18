# crs-guessing-game

**Status: first prototype is playable.** One mode ("find the hidden person"), a year of
daily answers, no hosting yet. Nobody but its author has played it.

```
npm run serve     # http://localhost:5173  (ES modules do not load from file://)
npm test
```

`?day=N` plays a given day, `?practice` a random person without saving.

## The goal

A daily browser guessing game in the Wordle family, modelled on
[Tradle](https://oec.world/en/tradle/): you are shown a CRS score (Canada's Express Entry
Comprehensive Ranking System) and have to work out the person behind it: age, education,
language level, Canadian and foreign work experience, marital status, and extras such as
French, a sibling in Canada or a provincial nomination.

It is a game, not a calculator. Every existing CRS tool goes profile -> score; this goes
score -> profile.

Fun first. Social commentary on how the system ranks people is a later layer, not the
starting point.

## Decisions already made

Made with the user on 2026-11-18. Change them on purpose, not by drift.

- **First prototype: find the hidden person.** One specific profile is the answer. Up front
  the player sees the CRS total plus the four-section breakdown (core human capital, spouse,
  skill transferability, additional points). Each guess is a full profile; feedback is a
  colour per attribute plus the guess's own computed score against the target. Six guesses.
- **Two mode axes, to explore after the first prototype.**
  - Win condition: find the hidden person / hit the exact score with any profile / pick
    the matching person from a line-up of short bios.
  - Up-front clue: total only / total plus section breakdown / breakdown revealed one
    section per wrong guess.
- **Hidden profiles are synthetic**, sampled so that their scores follow IRCC's published
  score-band distribution of the pool. IRCC does not publish attributes, only score bands.
- **Score with the 3 November 2026 rules only**, once they are verified against canada.ca
  and IRCC's own calculator. No "would this person be invited" line until a draw has
  happened under the new rules.

## What the prototype does

Choices made while building it, on 2026-11-18, without the user. All are provisional and
each is one place in the code.

- **Stack:** a static page, plain ES modules, no build step and no dependencies. Node is
  only used for the tests and the tools.
- **A guess has 13 attributes** (`src/attributes.js`): spouse, age, education, first
  language, second language, stronger in English or French, Canadian work, high-wage tier
  of that work, job offer, foreign work, study in Canada, sibling, nomination. That is more
  than the eight first imagined; the Labour Market Integration factor alone needs three.
- **Plateaus are one option.** Ages 20 to 29 score the same, so they are a single choice;
  likewise CLB 4-5 for a first language, 5-6 / 7-8 / 9+ for a second, and 1-2 years of
  foreign work. The player is never asked to tell apart things the tables do not.
- **Language is one level across all four abilities**, by role (first and second official
  language) rather than by English and French. "Stronger in" says which one is French,
  which only matters for the French bonus.
- **The spouse is a given, not a guess.** A guess says only whether there is an
  accompanying spouse. The hidden spouse's points (0 to 40) are in the clue and are lent to
  any guess that has a spouse. Guessing the spouse's education, language and work would
  add three columns for at most 40 points.
- **Left out:** the trade certificate of qualification (50 transferability points). A
  hidden person never has one and a guess cannot claim one.
- **What the score cannot see is lowered** (`canonical` in `src/profile.js`). A job offer
  that loses to the work-experience path, a sibling under a nomination's 600-point cap,
  foreign work with weak language and no Canadian work: each is read as the lowest option
  that scores the same, and the cell is marked ∅. Answers are stored in this form, so every
  attribute of an answer moves the score.
- **Winning means every cell green.** A different person with identical points in all four
  sections is not a win; the game says "same points, different person".
- **Yellow bands:** two steps for age, one step for education, languages, Canadian work,
  wage tier and job offer; none for the three-option attributes. Every wrong ordinal cell
  carries an arrow, grey ones included.
- **Day 1 is 18 November 2026**; the person changes at the player's local midnight.
  Progress is kept in `localStorage`. `data/answers.json` holds 366 people and wraps.
- **Sampling** (`tools/make-answers.mjs`): a score band is drawn by IRCC's weights
  (`data/bands.json`, pool as of 25 October 2026), then people are generated as a life
  lived forward (age, an education possible by that age, work years that fit after it)
  until one lands in the band. Every weight for age, education, language and the rest is
  an invented guess. The list is committed, so changing the sampler does not move answers
  until the list is rebuilt on purpose.

## Design notes from the prior-art survey

- The score is a free Tradle-style closeness signal: show each guess's CRS, the gap and the
  direction.
- With a total-only clue, "find the person" and "hit the exact score" are nearly the same
  game; they differ in whether per-attribute colours are shown and whether one profile or
  any matching profile wins. "Hit the score" may fall out as a hard mode with colours off.
- The breakdown clue must stay at section level. A per-factor breakdown gives the answer
  away: outside the 20 to 29 plateau, age points map to at most two ages (18 and 31 share
  a value, as do 19 and 30).
- Line-up is a different game loop (Higher Lower, Housle) and the only mode that needs
  written bios.
- Feedback encoding used by Poeltl and Spotle: green exact; yellow "close" with an up/down
  arrow for ordinal attributes (age, education, language level, years of work). Yellow means
  "close" only, never "misplaced". Marital status and yes/no extras get green or grey.
- Share grid: one row per guess, one square per attribute, a `Name #N 3/6` header, nothing
  that spoils.
- Tone: describe the hidden person by CRS attributes only, with no name, nationality or
  origin. Papers, Please and TIME's 2017 RAISE Act quiz were criticised for stereotyping and
  trivialising. Avoid timers; speed was what read as trivialising. Commit-then-reveal (NYT
  "You Draw It") carries commentary well.

## Rules: what was checked

- **canada.ca grid page** (dated 2026-11-03, read 2026-11-18): every table in
  `src/tables.js` was copied from it. The two worries in the first brief are settled: the
  "flat 100" for a job offer is the maximum of the 50 / 70 / 100 table, and the maximum
  total is 1,270 (570 core without a spouse, 100 transferability, 600 additional). The
  1,200 on third-party sites is the old maximum.
- **IRCC's calculator** (page dated 2026-11-18) already asks the new high-wage questions.
  Its scoring script was read in full and `src/score.js` follows it: the labour market
  factor is `max(work length + high-wage bonus, job offer)`, transferability uses the
  length of Canadian work whichever path won, the second language is capped at 22 only
  with a spouse, additional points are capped at 600.
- **Not done: a machine comparison with the calculator.** `tools/ircc-oracle.mjs` would run
  the calculator's script on 600 random profiles and save the outputs as
  `test/ircc-vectors.json`, which `npm test` then checks. It has never been run: executing
  a downloaded script was blocked in the session that wrote it. Until someone runs it, the
  evidence is a reading of the script plus hand-worked cases in `test/score.test.mjs`.
- The reference repos under Leads were not used.

## Open questions

- **Six guesses is too many as built.** `node tools/simulate.mjs` plays all 366 answers
  with a player that ignores the score and only halves each attribute by its own colour and
  arrow: 90% found in three guesses, all in four. With arrows on yellow cells only
  (`--close-only`) the same player needs five for most and fails some. A person reading the
  section points will do better than either. Fewer guesses, arrows only on yellow, or a
  total-only clue are the levers; play-test before choosing.
- **Is 13 columns too wide?** It fits a desktop; on a phone the board scrolls sideways and
  the share grid is 13 squares per row. Nomination and spouse are nearly free cells when
  the breakdown is shown (a nomination is 600 points; spouse points above zero mean a
  spouse).
- **Is lowering understandable?** A guess of "3+ years abroad" can come back as a green
  "1–2 years ∅" when both score the same. Correct, but it may read as the game changing
  the player's answer.
- **Are the sampled people plausible?** The weights are guesses; nobody has looked at a
  month of answers in a row.
- **Stale pool data.** The band weights are from before 3 November 2026. Replace
  `data/bands.json` and rebuild once IRCC publishes a distribution under the new rules.
- **Hosting.** Any static host works. Not chosen.
- **Name.** "CRS guessing game" is a working title; it is one constant in `src/daily.js`
  plus the page title.
- The other modes on the two axes above are untouched.

## Layout

```
index.html, style.css     the page
src/tables.js             point tables, with source and date
src/attributes.js         the attributes of a guess and their options
src/score.js              profile -> section points
src/profile.js            canonical form, feedback colours
src/daily.js              day number, today's answer, share text
src/game.js               the DOM
data/bands.json           IRCC's pool distribution used as weights
data/answers.json         the hidden people, built by tools/make-answers.mjs
tools/                    make-answers, simulate, serve, ircc-oracle
test/                     node --test
```

## Conventions

Text files are LF (`.gitattributes`). Scripts write with `newline="\n"`; compare text
ignoring `\r`.

## Leads (unverified, evaluate before using)

Found by web search in one session. Most were read from search results or a single page,
and none of the code was run.

Rules and data:

- CRS tables: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html>
- Change notice: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html>
- IRCC's calculator: <https://ircc.canada.ca/english/immigrate/skilled/crs-tool.asp>
- High-wage occupation list: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/high-wage.html>
- Rounds of invitations as JSON, with the pool by score band per round:
  <https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json>
- Draws are paused from 3 November 2026 while scores are recalculated (stated on the grid
  page); cut-offs and distributions from before that date are not comparable to new-rules
  scores. The last round in the JSON is #453 of 28 October 2026.
- `~/Code/express_entry_score_stats` is the user's own repo on cut-off history. Not opened.

Scoring code, all MIT per the GitHub API, none checked against IRCC's tool:

- <https://github.com/muhac/ee-crs-planner> (TypeScript, claims the November 2026 rules)
- <https://github.com/pushpinderbal/immigration-tools> (TypeScript)
- <https://github.com/stevenleung2018/crs_calculator> (Python, dated rule sets)

Prior art:

- No CRS or Express Entry guessing game was found. Reddit could not be searched, and
  itch.io and Product Hunt were only covered by general queries, so this is "none found".
- Points of Entry (Persuasive Games for the NYT, 2007): tune an immigrant's attributes
  under a US merit-points proposal to out-score a rival.
  <https://persuasivegames.com/game/nytimmigration>
- The Green Card Game (Cato Institute, 2023): persona -> outcome, the opposite direction.
  <https://www.thegreencardgame.com/factor/welcome>
- Mechanics: Tradle, Worldle (distance, direction, proximity per guess); Poeltl, Spotle
  (one coloured cell per attribute); Housle (more revealed after each miss); NYT Digits and
  Countle (many valid answers, graded on closeness).
- Tradle fork source, for the share-grid logic: <https://github.com/sleien/tradle>
