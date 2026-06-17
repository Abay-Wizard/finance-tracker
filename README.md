# Finance Tracker

A private, browser-only spending ledger. No account, no server, no tracking —
records live in your browser's `localStorage` and can be exported any time.
Search with regular expressions, set a spending cap, and convert between
currencies with manual rates.

> **Live demo:** _add your GitHub Pages URL here after deploying (M7)._

![Dashboard screenshot](assets/screenshot-dashboard.png)

## Features
- Add / edit / delete records (description, amount, category, date)
- **Regex search** with a case-insensitive toggle and match highlighting
- Sort by date, amount, description, or category (ascending / descending)
- Dashboard: record count, running total, top category, last-7-days bar chart
- **Spending cap** with live announcements (polite under, assertive over)
- Base currency + two manual rates; switch the display currency anywhere
- Validated JSON **import / export**; load `seed.json` to see demo data
- Responsive (ledger table on desktop, cards on mobile), keyboard-accessible,
  honours `prefers-reduced-motion`

## Regex catalog
The validators (`scripts/validators.js`) and search (`scripts/search.js`) use
these patterns. Flags: `i` case-insensitive, `u` unicode.

| Field | Pattern | Purpose | Matches | Rejects |
|---|---|---|---|---|
| Description (doubled word) | `\b([\p{L}\d]+)\s+\1\b` `iu` | flag an accidentally repeated word | `the the` | `the bill` |
| Amount | `^-?(?:\d{1,3}(?:,\d{3})+\|\d+)(?:\.\d{1,2})?$` | sign, optional thousands, ≤2 decimals | `12.50`, `-5`, `1,250.00` | `12.345`, `$5`, `abc` |
| Category | `^[\p{L}][\p{L}\s&-]{0,39}$` `u` | starts with a letter; letters/spaces/`&`/`-` | `Rent & Utilities` | `123`, `@home` |
| Date | `^\d{4}-\d{2}-\d{2}$` + calendar check | real ISO date, not in the future | `2026-06-01` | `2026-13-01`, `2026-02-31` |
| Search (user input) | compiled at runtime in `try/catch` | live filter over description + category | any valid JS regex | unbalanced `(` → inline error, never throws |

User search patterns are compiled defensively: an invalid pattern shows a quiet
inline message instead of breaking the list, and `highlight()` HTML-escapes every
segment before wrapping matches in `<mark>`, so a description like `<b>Rent</b>`
can never inject markup.

## Keyboard map
| Key | Action |
|---|---|
| `Tab` / `Shift`+`Tab` | Move through: skip link → nav → search → ignore-case → sort field → sort direction → each record's Edit/Delete → form fields → Save → settings → import/export → About links |
| `Enter` | Submit the active form / activate the focused button or link |
| `Space` | Toggle the focused checkbox or press the focused button |
| `Esc` | Dismiss the native confirm dialog (delete / import / clear) |

Every interactive element shows a visible `:focus-visible` outline; the skip link
is the first focusable element and jumps to `<main>`.

## Accessibility notes
- Landmarks: `header`, `nav`, `main`, five labelled `section`s, `footer`
- Headings: H1 → H2 per section → H3 for the dashboard stats
- Two live regions: `#live-status` (polite) for saves/imports/results,
  `#live-alert` (assertive) for validation errors and the over-cap warning
- Colours meet WCAG 2.1 AA: 4.5:1 for text, 3:1 for control borders and the
  focus outline (see `docs/a11y-plan.md` for the measured ratios)
- `prefers-reduced-motion` disables transitions and the render fade

## Project structure
```
.
├── index.html            # structure + landmarks
├── tests.html            # in-browser test suite
├── seed.json             # 12 demo records (import to try it out)
├── README.md
├── .gitignore
├── assets/               # favicon, screenshots
├── styles/
│   ├── base.css          # reset, variables, typography, focus styles
│   ├── layout.css        # landmarks, grid/flex, the ledger, skip-link
│   └── responsive.css    # @media breakpoints (~360 / 768 / 1024)
└── scripts/
    ├── app.js            # entry point: boots state, hands off to UI
    ├── storage.js        # localStorage load/save + import/export
    ├── state.js          # single source of truth + mutations
    ├── validators.js     # RULES + per-field validation
    ├── search.js         # safe regex compile, filter, highlight
    └── ui.js             # all DOM rendering + event binding
```

## Run
The app uses ES modules, which browsers won't load over `file://`. Serve the
folder over HTTP:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Then click **Settings → Load sample data** to populate the 12 demo records in
one click (it fetches `seed.json`). You can also use **Import data** to load any
exported JSON file from disk.

## Test
Open `http://localhost:8000/tests.html`. The page runs the validator, search,
storage/state, and `seed.json` assertions and prints a pass/fail summary (also
logged to the console and shown in the tab title).

## License
MIT — do what you like; no warranty.