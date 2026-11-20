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
French or a sibling in Canada.

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
- **Nobody is nominated by a province, in any mode.** The user, 2026-11-20: "they always
  have insane score". A nomination is 600 points, so the score says "nominated" and
  little else. See "Nominations are out" below.

## What the prototype does

Choices made while building it, on 2026-11-18, without the user. All are provisional and
each is one place in the code.

- **Stack:** a static page, plain ES modules, no build step and no dependencies. Node is
  only used for the tests and the tools.
- **A guess has 12 attributes** (`src/attributes.js`): spouse, age, education, first
  language, second language, stronger in English or French, Canadian work, high-wage tier
  of that work, job offer, foreign work, study in Canada, sibling. That is more than the
  eight first imagined; the Labour Market Integration factor alone needs three. There
  were 13 until the nomination went on 2026-11-20.
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
  that loses to the work-experience path, French-first where English-first scores the same,
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
  until one lands in the band. The band above 600 is left out: those are nominated
  people. Every weight for age, education, language and the rest is an invented guess. The list is committed, so changing the sampler does not move answers
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
  variant never picks a person any variant hides today or in the next seven days
  (`practiceDay` in `src/rounds.js`). The line-up has had its own cast since 2026-11-20
  and no longer needs the care.
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
  - Nobody stands in two rounds of one day.
  - What scores is described by a template (`bioLines`). What a description leaves out,
    the person does not have. A spouse is one phrase, "with a spouse who brings 18
    points".
  - The clue axis does not apply: a line-up shows the total only.

## The line-up cast

Decided with the user on 2026-11-20, replacing "no names, origins or occupations" for
this mode only.

- **A hundred invented people of its own** (`tools/lineup-cast.mjs`, written by hand,
  built into `data/lineup.json` by `node tools/make-lineup.mjs`). Each has a name, a job
  and a quirk on top of what scores. None of the three scores anything or hints at it.
- **No origin in the text, ever.** A name says nothing about which language is the
  stronger one.
- **The picture may suggest a culture, but an invented one.** About a quarter wear
  something that belongs to no real place (a coiled wrap, a veil with a crest, a halo
  disc, twin peaks, a cowl, a bead band, a ruff, a yoke, a cloak), next to toques,
  parkas, plaid and hi-viz. Dress is dealt across names and skin tones on purpose.
- **A picture must not be a clue to the score.** Skin tone is dealt out down the list of
  scores, so each tone averages the same (368 to 373). The first
  build let the cast list say the tone and the darker faces came out a hundred points
  ahead. Invented dress averages 347 against 383 without. `make-lineup.mjs` prints both.
- **Portraits are a burnt-out photocopy** (`src/portrait.js`): a face built from parts
  in soft greys, then thresholded through noise, so only toner and paper are left. No
  height chart and no placard; the user asked for the look, not a literal mugshot.
- **What varies:** head outline and stretch, build, neck, how the person sits in the
  frame, skin as five levels of toner coverage (dark skin keeps highlights, not
  shadows), eyes, nose, lips, hair style and texture, beard, glasses, hat, clothes, one
  or two extras. The cast list says hair, hat, clothes and extras; the rest is drawn
  from the name, so it is stable between builds.
- **Age shows**, in lines and grey hair, following the age in the description. It is the
  only thing in a picture that follows a scoring attribute.
- **Stored as the game reads them** (`canonical`), so 17 of the 100 lost something that
  made no difference: mostly work abroad with weak language, and French-first where
  English-first scores the same.
- **Nobody is nominated.** Eleven were until 2026-11-20; they are the same people 600
  points lower, and scores now run from 112 to 592. 21 of 1,830 rounds in a year still
  take whoever is nearest, down from 29.
- **On a desktop it has the frame of the guessing modes**, asked for by the user on
  2026-11-20: from 84rem wide, the score and the round on the left, the four people two
  by two where the choices are. At 1,366 by 768 a round fits the screen before the pick;
  with the scores shown it is within a few pixels of the bottom. Narrower, it is one column.
- **Open:** each person returns about every five days with the same score, so a regular
  could learn them. The user: "we're still prototyping". Saved picks from before the
  cast point at different people. `art/cast.html` shows all hundred; the pictures have
  only been checked at that size.

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
  against. Since 2026-11-20 its chips are joined as well, see below.
- Chips carry the short labels the board uses; the full wording of the current choice is
  beside the attribute's name (on its own line on a phone). The wording of a chip that is
  not picked is only in its tooltip, which a phone does not have.
- The form is taller for it: about 870px on a 375px-wide phone, more than a screen, before
  anything is known.
- **A settled attribute folds to one line** ("Spouse: No accompanying spouse ✓"), so the
  form shrinks as the player learns; after two guesses of one practice game it was 470px
  on that phone. "change" unfolds it, and picking the right option again folds it back.
  It only folds while the form is set to the right option.
- **The next guess starts from the last one, minus what it ruled out** (`carryForward` in
  `src/profile.js`). A choice still open is kept. A ruled-out choice is left unset, shown
  as "choose one", and Guess is disabled until every attribute is chosen, with a line
  naming what is missing. If only one option is left open it is picked for the player.
  The form's own rules still apply: no Canadian work sets the wage tier to "not high-wage".
- **Yellow chips.** After a yellow cell, the option or two it leaves open are yellow, until
  the attribute is found. With one left it is also picked, as above.
- **Hard mode** is a tick box under the choices, in "find the person" only, kept in
  `localStorage` across days. With it on, Guess is disabled while any choice is one the
  guesses have ruled out, and a line says which. A result is shared with Wordle's `*`
  when hard mode is on at the end and no guess used a ruled-out choice. It asks little
  now that ruled-out choices are left unset anyway: what it forbids is picking one on
  purpose, which is only useful for watching the section points move.
- **Why unset and not moved.** The first build moved a ruled-out choice to the nearest
  open option. A player who only pressed Guess then found 363 of the 366 people within
  six guesses; with choices left unset that player finds 3 and is stopped on the rest.
  Measured on 2026-11-20 with a throwaway script, not kept.

## Tuples: attributes picked and coloured together

An experiment, built on 2026-11-20 because the user found the game "basically
autoguessing": every attribute is narrowed by its own colour, the chips keep the score,
and nothing is left to work out. In "find the person" only.

**Since 2026-11-20 this is the game.** The user found the two joined versions better and
asked for "one by one" and "work joined" to go. The bare address plays `pairs`; the
"Rules" links offer it ("yellow hints, six guesses") and `pairs-all` ("no yellow, four
guesses"). The game with nothing joined is still at `?tuples=none`, with its old saved
games, and `work` and `lang` still answer by address; no link leads to them.

- **A tuple is one pick and one cell** (`src/groups.js`). The chip names a combination
  ("2y 1.5×"), and only combinations that can exist are offered. The cell is green when
  the whole combination is right. It never says which part is wrong, so the section
  points are what tells the player which part to change.
- **Two rules for a joined cell.** `count`: yellow when some part is right, with "1 of 2"
  in the cell, grey when none is. `all` (`-all` in the address, "no yellow" on the page, four guesses):
  green or grey and nothing else. Single attributes keep their yellow and arrow.
- **Groupings.** `work` joins Canadian work with its wage tier; `lang` joins first and
  second language; `pairs` joins four: education with study in Canada, the two languages,
  work with wage tier, job offer with foreign work. That is 8 cells in place of 12.
  (Sibling was joined with the nomination until that went, and is now a cell of its
  own.) `themes` (five cells, up to 252 combinations) is in the simulator
  only: too many to lay out as chips.
- **Measured** with `node tools/simulate-tuples.mjs`, over all 366 people. The clicker
  ignores the score and takes the middle of what each cell's colours leave open, which is
  what the marked chips let a person do without thinking. The reasoner knows the point
  tables: it starts from everyone who has the hidden person's four sections (median 172
  people, at most 844), guesses one, and keeps whoever would have drawn the same colours.

  | grouping, rule | cells | clicker by 6 | by 8 | reasoner by 3 | by 6 |
  |---|---|---|---|---|---|
  | nothing joined | 12 | 100% | 100% | 100% | 100% |
  | work, count | 11 | 62% | 100% | 99% | 100% |
  | work, all | 11 | 11% | 14% | 95% | 100% |
  | lang, count | 11 | 99% | 100% | 100% | 100% |
  | pairs, count | 8 | 58% | 100% | 94% | 100% |
  | pairs, all | 8 | 3% | 4% | 63% | 100% |
  | themes, count | 5 | 29% | 65% | 90% | 100% |
  | themes, all | 5 | 0% | 1% | 51% | 98% |

  Run again on 2026-11-20 without the nomination. Only the clicker moved, on `pairs`
  with `count` (48% and 98% before) and on `themes` (27% and 64%): sibling alone is an
  easier cell than sibling with nomination.

  So `pairs` with `count` is the one on the page first: not thinking loses four times in
  ten and thinking always wins. `pairs-all` is there as the hard end. A real player is
  between the two: no point tables, but can read the sections.
- **The reasoner's column says something about the game as it was:** with the full clue
  and the tables, two guesses are enough on average (2.10) with nothing joined, and
  joining costs that player little: 2.56 for `pairs` with `count`, 3.19 for `pairs-all`,
  3.58 for `themes` under `all`. The colours matter most to a player who cannot do the
  arithmetic.
- **Days that cannot be won**, asked for by the user on 2026-11-20: a game a good player
  sometimes loses. Two knobs, both measured with the reasoner.
  - **`pairs-all` has four guesses, not six** (`GUESSES` in `src/groups.js`). With the
    full clue the reasoner finds 63% by three guesses, 90% by four, 98% by five: four
    guesses is one lost day in ten for a player who forgets nothing.
  - **The total-only clue** (`node tools/simulate-tuples.mjs pairs total`, a few
    minutes). Nothing was built for it; `?clue=total` already combined with `?tuples=`.

    | total-only clue | reasoner by 3 | by 4 | by 5 | by 6 | mean |
    |---|---|---|---|---|---|
    | nothing joined | 99% | 100% | 100% | 100% | 2.37 |
    | pairs, count | 67% | 97% | 100% | 100% | 3.25 |
    | pairs, all | 12% | 33% | 58% | 75% | 5.44 |

    Run again on 2026-11-20 without the nomination: every number the same.

    So `pairs` with the total alone is hard but always winnable in six, and `pairs-all`
    with the total alone and its four guesses is lost two days in three even by the
    reasoner: probably too far.
- **Still automatic.** The chips are still marked, a group with one combination left is
  still picked for the player, and a green group still folds. In one game, after two
  guesses seven of the eight groups were settled. The next knob, if it still plays
  itself, is to stop marking joined groups.
- **A pair is a table of chips.** A line for each value of its first attribute, named at
  the start of the line, and on it a chip for each value of the second; a caption says
  which runs down and which across. The chip says only the second value ("1.5×"); the
  group's name line and the board cell say the combination ("2y 1.5×").
- **Cost: the form is twice as tall on a phone.** 1,694px on a 375px-wide phone before
  anything is known, against 870px with nothing joined. (The joined form of a practice game was 1,658px on
  2026-11-20, after the nomination went; not known to be measured the same way.)
- **On a desktop it is one screen**, asked for by the user on 2026-11-20. From 84rem
  (1,344px) wide, "find the person" puts the clue and the guesses on the left and the
  choices on the right, with the header on two lines and smaller chips. Measured at
  1,366 by 768: nothing scrolls before the first guess or with six guesses on the
  board. Between 48rem and 84rem the page is one column as before and does scroll.
  `?tuples=none` keeps the old layout; for the other two modes see below.
- **Not done.** `?tuples=none` hides the same person as the joined game for the same
  clue, so playing both on a day spoils one. `pairs` and `pairs-all` share a person too.
  `tools/simulate.mjs` still plays the game with nothing joined.

## The other modes get the same form and layout

Done on 2026-11-20, when the user asked for what "find the person" had gained to go to
the other modes. Read as: the joined choices and the one-screen desktop page. Colours,
marked chips, hard mode and the "Rules" links stay where there is a hidden person to
colour against.

- **"Hit the score" has the joined choices**: the same four pairs, the same tables of
  chips, eight cells on the board in place of 12. It joins what the address joins, so
  `?mode=score&tuples=none` is still the twelve separate choices. `-all` means nothing
  there and is ignored: eight guesses either way.
- **A joined cell has a line of steps for each part**, with a word in front saying which
  ("1st ▲+24 ▼−45", "2nd ▲+4"). All 12 step hints are still on the board, which is what
  the simulator's 83% in eight guesses assumes.
- **The saved game is the same game.** A guess is saved attribute by attribute, so a game
  begun with separate choices is still there, drawn with joined cells. Checked with an
  eight-guess game saved before the change.
- **On a desktop it has the two columns of "find the person"** from 84rem wide. It is not
  one screen for the whole game. Measured at 1,366 by 768 by playing a practice game:
  nothing scrolls before the first guess or with three guesses on the board, the fourth
  makes the page 770px, and each one after adds about 79px, to 1,087px with all eight.
  A guess is about 81px tall with its section line, and fitting eight would need 56px.
  A cell is three to five lines there, where a cell of "find the person" is one or two.
- **The board never runs wider than its column.** The step lines wrap and the name of a
  combination keeps its lines. Checked with the widest values a guess can have ("Offer
  1.5× + Abroad 1–2y"); with the lines kept whole that guess was 46px too wide.
- **On a 375px phone** a guess is two rows of four cells, as in "find the person", and
  the step lines wrap inside a cell where they have to.
- **Line-up takes the short header** from 84rem wide and stays one column. At 1,366 by
  768 a round fits with everyone's score shown, in the five rounds of one day; the
  result box under the last round made the page 819px. Before, a round of another
  day with its scores shown was 856px.
- **Fixed on the way:** in a light colour scheme the value in a cell of "hit the score"
  was white on white, and only the steps under it could be read. It had been so since
  the mode was built; a dark scheme hid it.

## Nominations are out

Asked for by the user on 2026-11-20: "i dont think we should ever consider nominated by
province -- they always have insane score. remove this from all modes".

- **No guess can claim one.** The attribute is gone from `src/attributes.js`, so from the
  form, the board, the step hints and the share grid of both guessing modes.
- **Nobody hidden has one.** One of the 366 did, day 60. That person stays, without it:
  309 points where there were 909. The other 365 are untouched, so the list was edited,
  not rebuilt; a rebuild would have moved every day. `tools/make-answers.mjs` leaves
  out the band above 600 the next time it is run.
- **Nobody in the line-up has one.** Eleven of the cast did. The cast was rebuilt, and
  since skin tone is dealt down the list of scores, 49 of the 100 faces changed tone.
  `art/cast.png` was taken again.
- **The line-up's rounds moved.** Rounds are drawn by score, so only 34 of the 366 days
  kept all five rounds. Day 3, the day of the change, kept its first three and changed
  the last two; a pick saved before the change may point at someone else.
- **The scorer still knows the rule.** `src/score.js` adds 600 for `pnp`, which nothing
  in the game sets. IRCC's calculator was checked with it, and 52 of the 600 vectors and
  the second-opinion tests still test it. `tools/ircc-oracle.mjs` carries the yes-or-no
  itself, so it still makes the same 600 profiles.
- **A saved guess that claimed one is read without it** (`src/game.js`). Checked in a
  browser with such a guess saved in three games: 326 points, not 926.
- **Nothing can be lowered under the 600-point cap any more**, so a sibling and study in
  Canada always count and are out of `LOWER_ORDER`.
- **Not measured again:** the page heights and widths above, taken while the form had a
  nomination row or chip. The form is a little shorter now. At 1,366 by 768 "find the
  person", "hit the score" before a guess and the line-up still fit the screen.

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
- **A machine comparison with the calculator, 2026-11-20: it agrees.** IRCC's calculator
  scored 600 random profiles and `src/score.js` gives the same five numbers (four
  sections and the total) for every one. They are in `test/ircc-vectors.json`, which
  `npm test` checks. 306 of the 600 have a spouse and 52 a nomination. The game has had
  no nomination since 2026-11-20; `src/score.js` keeps the rule and the vectors keep
  testing it.
  - The calculator's script was not downloaded or run by node. `tools/ircc-oracle.mjs
    snippet` prints a snippet to paste into the browser console on the calculator's page
    (which now redirects to canada.ca's "Check your score"); it makes the profiles from a
    fixed seed, fires the form's own submit handler for each, and returns one line of
    subtotals with a checksum. `tools/ircc-oracle.mjs build` turns that line into the file.
  - How the line got from the page to the file that day: it was not copied. This game's
    own line for the same profiles had the same length, the same two checksums and the
    same column sums as the page's, so the file was built from the game's copy.
  - It covers what the game can express and the nomination, with one fixed spouse (bachelor's, one year of
    Canadian work, CLB 7: 25 points). Not covered: mixed levels across language
    abilities, the certificate of qualification, other spouses.
  - Re-run it when IRCC changes the tool. The snippet reads the page's results by their
    wording, so a reworded page gives "?" and `build` refuses it.
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
  arithmetic homework, and the hint row makes a 12-column board denser still.
- **Is line-up too hard or too easy?** A pick is one in four by luck. Nobody has played a
  week of it. The 12-to-70-point window is the knob.
- **A hidden clue still leaks the spouse section.** A guess with a spouse borrows the
  hidden spouse's points, so its own "Spouse N" is the hidden person's spouse section even
  when the clue has not shown it. Hiding the number would not help: the guess's total
  carries it too. It goes away only if the spouse stops being a given.
- **Six variants a day is a lot.** They exist so each can be tried; the point of trying
  them is to drop most.
- **Is 12 columns too wide?** (With nothing joined; the game on the page has 8.) It fits
  a desktop. Below 48rem each guess is laid out as a
  block of labelled cells, four across, with the score last, and the form is two columns,
  so nothing scrolls sideways;
  the cost is height, about three guesses to a phone screen. The share grid has a square
  per cell. Spouse is a nearly free cell when the breakdown is shown (spouse points
  above zero mean a spouse).
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
src/groups.js             tuples: which attributes are joined, their combinations and colours
src/daily.js              day number, today's answer, share text
src/modes.js              modes and clues: which variant, what the clue shows, step hints
src/rounds.js             line-up: the day's rounds and how a person is described
src/main.js               entry: draws the pickers, loads the page for the mode
src/page.js               variant, day, saved progress, DOM helpers
src/game.js               the DOM for the two guessing modes
src/lineup.js             the DOM for line-up
src/portrait.js           line-up portraits: a look -> SVG
data/bands.json           IRCC's pool distribution used as weights
data/answers.json         the hidden people, built by tools/make-answers.mjs
data/lineup.json          the line-up cast, built by tools/make-lineup.mjs from tools/lineup-cast.mjs
art/                      style samples and a sheet of the whole cast
tools/                    make-answers, simulate, simulate-score, simulate-tuples, serve, ircc-oracle
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
