# IRCC's published statistics, as downloaded

Collected on 2026-11-20 at the user's request ("collect this, not doing anything with
this data for now"). Nothing in the game reads any of it. The files are as IRCC serves
them, byte for byte (`.gitattributes` keeps git from touching their line endings).

Licence: Open Government Licence - Canada, <https://open.canada.ca/en/open-government-licence-canada>.

## What is here

| Folder | What | Source |
|---|---|---|
| `invited/` | 13 files: people invited to apply, by year, province, program and one more attribute | <https://open.canada.ca/data/en/dataset/593e9165-c6ce-4f9b-b519-03d315f92cd4> |
| `admitted/` | 7 files: people granted permanent residence through Express Entry, by month, province and one more attribute | <https://open.canada.ca/data/en/dataset/52e4b14b-597a-4ecf-a184-23a6e69b0d57> |
| `report/` | Express Entry Year-End Report 2024, the page and the PDF. The latest edition; no 2025 edition existed | <https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/express-entry-year-end-report-2024.html> |
| `ee_rounds_123_en.json` | Every round of invitations, with the pool by score band. `../bands.json` was copied from round 453 of an earlier download | <https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json> |
| `meta/` | The two dataset records from the portal's API: titles, descriptions and the address of every file | `https://open.canada.ca/data/api/3/action/package_show?id=` and the dataset id |

Both datasets were last modified on 2026-11-17 and cover up to September 2026. Only the
bilingual CSVs were taken; each also exists as an English and a French XLSX with the
same numbers, listed in `meta/`.

## Reading the files

- They are named `.csv` but are **tab-separated**, UTF-8, CRLF, with every label in
  English and in French.
- **Counts are rounded to the nearest 5, and 0 to 5 is written `--`**, so rows do not
  add up to their totals.
- `invited/` is by year only, 2015 to 2026. `admitted/` has year, quarter and month.
- `invited/ODP-EE_candidates-ITA_score.csv` is the only file with scores: the score at
  invitation in bands (51-100, then 50 wide up to 500, then 100 wide from 501 to 1200),
  by year, province and program. It is not joined to age, education or anything else.
- The age groups are coarse and differ: 19-29, 30-39, 40-64 for people invited;
  15-29, 30-44 and so on for people admitted.
- The four `Occ_` files in `invited/` are one program each, by province and occupation.

## What was looked at

Only this: each file's header, its line count, the first and last rows of the score and
age files, and the list of score bands. No totals were checked against the report.

The report's tables 7 to 10 (age, education, first-language CLB, Canadian and foreign
work, additional points of the 98,903 people invited in 2024) were read through a
fetching agent on the same day; the numbers are in the page saved here.

Everything is from before the rules of 3 November 2026.
