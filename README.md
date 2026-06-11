# Finance Tracker

> TODO: one-line description of the app.

**Live demo (GitHub Pages):** TODO add URL

## Chosen theme
TODO: Student Finance Tracker / Campus Life Planner / Book & Notes Vault

## Features
- TODO: list the implemented features (records, search, stats, import/export, etc.)

## Regex catalog
| Field | Pattern | Example pass | Example fail |
|-------|---------|--------------|--------------|
| Description | `^\S(?:.*\S)?$` | `Lunch` | `" Lunch "` |
| Amount | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `12.50` | `12.500` |
| Date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | `2025-09-25` | `2025-13-40` |
| Category | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Food` | `Food1` |
| Double word (advanced, back-ref) | `\b(\w+)\s+\1\b` | finds `the the` | — |

> TODO: add your search-pattern examples too.

## Keyboard map
| Key | Action |
|-----|--------|
| Tab / Shift+Tab | TODO |
| Enter | TODO |
| Esc | TODO |

## Accessibility notes
- TODO: landmarks, skip link, focus styles, ARIA live regions, contrast.

## Running tests
- TODO: open `tests.html` in a browser; results print to the page.

## How to run locally
- TODO: serve over a local server (ES modules need http), e.g. `python3 -m http.server`.
