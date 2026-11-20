# crs-guessing-game

**Status: three modes are playable**, live at <https://skfd.github.io/crs-guessing-game/>.
Nobody but its author has played any of them.

| | |
|---|---|
| Find the person | <https://skfd.github.io/crs-guessing-game/> |
| Hit the score | <https://skfd.github.io/crs-guessing-game/?mode=score> |
| Line-up | <https://skfd.github.io/crs-guessing-game/?mode=lineup> |

```
npm run serve     # http://localhost:5173  (ES modules do not load from file://)
npm test
```

`?day=N` plays a given day, `?practice` a random one without saving. `?mode=score` and
`?mode=lineup` pick the mode; `?clue=full`, `?clue=total` and `?clue=reveal` pick the clue
in the two guessing modes. The page has links for all of these.

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
  wage tier and job offer; none for the three-option attributes. The arrow comes with
  yellow only; a grey cell says "wrong and not close" and nothing more (`ARROW_ON_MISS` in
  `src/profile.js`).
- **Day 1 is 18 November 2026**; the person changes at the player's local midnight.
  Progress is kept in `localStorage`. `data/answers.json` holds 366 people and wraps.
- **Sampling** (`tools/make-answers.mjs`): a score band is drawn by IRCC's weights
  (`data/bands.json`, pool as of 25 October 2026), then people are generated as a life
  lived forward (age, an education possible by that age, work years that fit after it)
  until one lands in the band. Every weight for age, education, language and the rest is
  an invented guess. The list is committed, so changing the sampler does not move answers
  until the list is rebuilt on purpose.

## The other modes

Built on 2026-11-20, overnight and without the user, who asked for the rest of the two
axes to be built. Every choice here is provisional.

- **One page, picked by the address.** The bare address is still "find the person" with
  the full clue, with the same save key as before, so nothing saved was lost.
- **Each guessing variant hides its own person.** Two modes times three clues is six
  variants a day. Finishing one shows its person, so each takes its person from a
  different place in the answer list, 53 days apart (`PERSON_VARIANTS` in `src/modes.js`).
- **A repeated guess is refused**, in the original game too. Guesses are compared as the
  game reads them, so a guess that is lowered to an earlier one is refused as well, with
  a note saying the change made no difference. Under the section-per-miss clue a repeat
  would otherwise buy a section for nothing.
- **Practice keeps away from this week's hidden people.** A practice game of a guessing
  variant never picks a person any variant hides today or in the next seven days, and a
  practice line-up never shows one (`practiceDay` and `roundsForDay` in `src/rounds.js`).
- **Clue "total only"** shows the total and nothing else. **Clue "a section per miss"**
  shows one more section after each wrong guess: additional, spouse, transferability, core
  last. Under both, a guess still shows its own four section subtotals, but the ✓ ↑ ↓
  against the hidden person only appears for sections the clue has shown
  (`revealedSections`). Everything is shown when the game ends.
- **Hit the score.** Any profile with exactly the hidden person's total wins. Nothing is
  coloured. Each cell of a guess says what one step up and one step down would have
  changed (`steps` in `src/modes.js`): without that, the mode is a blind search, since
  the player has no point tables. Eight guesses; see the simulator numbers below. Guesses
  are not lowered, as there is no hidden person to compare with. A spouse in a guess
  brings the hidden person's spouse points (none if that person is single), and the form
  says how many. The share text has one square per guess: green exact, yellow within 20
  points, white further.
- **Line-up.** Five rounds a day. Each shows a score and four people described in a few
  lines; one has exactly that score. After a pick, everyone's score and sections are
  shown. The result is the number right out of five.
  - The wrong three score 12 to 70 points away from the round's score and at least 8
    points from each other (`src/rounds.js`). Nearer and only a calculator tells them
    apart; further and the round answers itself. Both numbers are guesses.
  - The people come from the same 366 as the daily answers, minus anyone a guessing
    variant hides today or in the next seven days, since a line-up shows whole people
    with their scores. Nobody stands in two rounds of one day.
  - Descriptions are built from the attributes by a template (`bioLines`): no names,
    origins or occupations. What a description leaves out, the person does not have.
    A spouse is one phrase, "with a spouse who brings 18 points".
  - The clue axis does not apply: a line-up shows the total only.

## The guess form

Changed on 2026-11-20, at the user's request for something like Wordle's keyboard.

- **Every option is a chip that stays on screen**, where there used to be thirteen
  dropdowns. A dropdown hides its options until it is opened, and a phone's picker
  ignores colours on them, so marks inside one would not have been seen.
- **A chip is marked with what the guesses so far say.** Green is the option known to be
  right. Grey and struck through is ruled out, and can still be picked, as a grey letter
  can in Wordle. The marks come from the colours and arrows already shown and nothing
  else (`stillPossible` in `src/profile.js`, which `tools/simulate.mjs` now plays with
  too), so they tell the player nothing new; they only save the bookkeeping.
- **Faint and dashed is something else:** an option the rest of the form makes impossible
  (a second language above the first, a wage tier with no Canadian work). It cannot be
  picked.
- **"Hit the score" has the chips but no marks.** It hides no one to rule options out
  against.
- Chips carry the short labels the board uses; the full wording of the current choice is
  beside the attribute's name, and of any chip in its tooltip.

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
- **A second opinion, 2026-11-20.** `test/second-opinion.test.mjs` holds the numbers that
  the test suite of <https://github.com/muhac/ee-crs-planner> asserts for the same rules,
  re-expressed as profiles of this game: every age, education, first-language, Canadian
  work, high-wage and job-offer value without a spouse; with a spouse, all of those except
  that only eight of the ages and only the second-language cap are covered; the
  transferability pairs and caps, the additional points, and one whole married person. `src/score.js` agrees with
  all of them. Only its numbers were taken; its code was not run. It is an independent
  reading of the same pages, not IRCC's calculator. Not covered, because this game cannot
  express them: mixed levels across language abilities, the certificate of
  qualification, and the spouse's own factors.
- The other two reference repos under Leads were not used.

## Open questions

- **Is six guesses right?** Probably generous. `node tools/simulate.mjs` plays all 366
  answers with a player that ignores the score and only narrows each attribute by its own
  colour and arrow: 30% found in three guesses, 49% in four, 99% in five, all in six. With
  arrows on grey cells too (the first build) it was 90% in three and all in four, which is
  why they were turned off. A person who reads the section points should beat this player,
  so five guesses or a total-only clue may be the better game. Play-test before choosing.
- **Is hit-the-score a game?** `node tools/simulate-score.mjs` plays all 366 answers with a
  player that knows no tables, learns only from the step hints, and ignores how attributes
  combine: 40% hit in four guesses, 73% in six, 83% in eight, 94% in twelve. With a
  "what this choice is worth" number in place of the step hints it was 32% in six. So
  eight guesses with step hints is a guess at "hard but fair". It may instead read as
  arithmetic homework, and the hint row makes a 13-column board denser still.
- **Is line-up too hard or too easy?** A pick is one in four by luck. Nobody has played a
  week of it. The 12-to-70-point window is the knob.
- **A hidden clue still leaks the spouse section.** A guess with a spouse borrows the
  hidden spouse's points, so its own "Spouse N" is the hidden person's spouse section even
  when the clue has not shown it. Hiding the number would not help: the guess's total
  carries it too. It goes away only if the spouse stops being a given.
- **Six variants a day is a lot.** They exist so each can be tried; the point of trying
  them is to drop most.
- **Is 13 columns too wide?** It fits a desktop. Below 48rem each guess is laid out as a
  block of labelled cells, four across, with the score last, and the form is two columns,
  so nothing scrolls sideways;
  the cost is height, about three guesses to a phone screen. The share grid is still 13
  squares per row. Nomination and spouse are nearly free cells when
  the breakdown is shown (a nomination is 600 points; spouse points above zero mean a
  spouse).
- **Is lowering understandable?** A guess of "3+ years abroad" can come back as a green
  "1–2 years ∅" when both score the same. Worse is the reverse: the player picks the right
  value, it makes no difference next to the rest of that guess, and it comes back lowered
  and grey; the form then carries the lowered value into the next guess. Correct by the
  rules of the game, but it may read as the game changing the player's answer.
- **Are the sampled people plausible?** The weights are guesses; nobody has looked at a
  month of answers in a row.
- **Stale pool data.** The band weights are from before 3 November 2026. Replace
  `data/bands.json` and rebuild once IRCC publishes a distribution under the new rules.
- **Hosting.** GitHub Pages serves `main` from the repo root, so every push to `main` is a
  release. The repo is public because Pages on a free plan needs it to be.
- **Name.** "CRS guessing game" is a working title; it is one constant in `src/daily.js`
  plus the page title.

## Layout

```
index.html, style.css     the page
src/tables.js             point tables, with source and date
src/attributes.js         the attributes of a guess and their options
src/score.js              profile -> section points
src/profile.js            canonical form, feedback colours
src/daily.js              day number, today's answer, share text
src/modes.js              modes and clues: which variant, what the clue shows, step hints
src/rounds.js             line-up: the day's rounds and how a person is described
src/main.js               entry: draws the pickers, loads the page for the mode
src/page.js               variant, day, saved progress, DOM helpers
src/game.js               the DOM for the two guessing modes
src/lineup.js             the DOM for line-up
data/bands.json           IRCC's pool distribution used as weights
data/answers.json         the hidden people, built by tools/make-answers.mjs
tools/                    make-answers, simulate, simulate-score, serve, ircc-oracle
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
