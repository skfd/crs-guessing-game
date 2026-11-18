# crs-guessing-game

**Status: empty, nothing built yet.** This README is the brief. There is no code to look for.

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

## Design notes from the prior-art survey

- The score is a free Tradle-style closeness signal: show each guess's CRS, the gap and the
  direction.
- With a total-only clue, "find the person" and "hit the exact score" are nearly the same
  game; they differ in whether per-attribute colours are shown and whether one profile or
  any matching profile wins. "Hit the score" may fall out as a hard mode with colours off.
- The breakdown clue must stay at section level. A per-factor breakdown probably gives the
  answer away, because age points map to an age nearly one-to-one. Not yet checked against
  the new tables.
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

## Open questions

- **Are the November 2026 tables what the survey says?** The grid page reportedly
  contradicts itself on job-offer points (flat 100 vs a 50/70/100 table), and the maximum
  total is unclear (sections sum to 1,270; third-party sites say 1,200). Read the page
  first.
- **Which attributes does a guess contain?** Roughly eight was the working number. The new
  Labour Market Integration factor (Canadian experience plus a high-wage bonus, or a
  high-wage job offer) may add inputs. More attributes means a wider share grid.
- **How close is "close"?** A yellow band per attribute; age and language level have
  different ranges, so a single flat band will not do.
- **Is six guesses right** for that many attributes, given how much the score itself
  reveals? Needs play-testing, possibly on paper first.
- **How is a profile sampled** so that it is plausible as well as score-weighted? The score
  bands constrain the total, not the mix of age, education and language.
- **Is the answer unique enough?** Two profiles can share a total and a section breakdown.
  Decide whether a different profile with identical points counts as a win.
- **Stack and hosting.** Not decided. A static page with a client-side scoring function is
  the obvious shape, but nothing has been chosen.
- **Name.** The folder name is a working title.

## Conventions

Text files are LF (`.gitattributes`). Scripts write with `newline="\n"`; compare text
ignoring `\r`.

## Leads (unverified, evaluate before using)

Found by web search in one session. Most were read from search results or a single page,
and none of the code was run.

Rules and data:

- CRS tables: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html>
- Change notice: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html>
- High-wage occupation list: <https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/high-wage.html>
- Rounds of invitations as JSON, with the pool by score band per round:
  <https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json>
- Draws were reported paused from 3 November 2026 while scores are recalculated; cut-offs
  and distributions from before that date are not comparable to new-rules scores.
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
