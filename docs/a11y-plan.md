# Accessibility Plan & Audit

## Landmarks & headings
Header, Navigation, Main, and five sections — Dashboard, Records, Add/Edit
Record, Settings, About — plus Footer.
Heading hierarchy: **H1** Finance Tracker; **H2** Dashboard, Records, Add/Edit
Record, Settings, About; **H3** Total Records, Total Spent, Top Category.

## Skip link & focus
The skip link is the first focusable element and jumps to `<main>`. Visible
focus indicators appear on navigation links, the search box, the ignore-case
checkbox, the sort controls, every form input, all buttons, the table
Edit/Delete actions, and the import/export controls. Focus styling uses
`:focus-visible` with a real `outline` (survives Windows High-Contrast mode);
default outlines are never removed without an equal or stronger replacement.

## Live regions
- **Polite** (`#live-status`): record added/updated/deleted, import/export
  complete, search results updated, back-under-cap.
- **Assertive** (`#live-alert`): validation errors, failed import/export,
  spending-cap-exceeded warning.

## Keyboard flow
Tab order: Skip link → Navigation → Search → Ignore-case → Sort field → Sort
direction → each record's Edit/Delete → Form fields (Description → Type
(Expense/Income) → Amount → Category → Date) → Save → Settings controls →
Import/Export → About links.
`Enter` submits forms and activates buttons; `Space` toggles the checkbox and
presses buttons; `Esc` dismisses the native confirm dialogs.

## Colour contrast — measured (WCAG 2.1 AA)
Target: 4.5:1 normal text, 3:1 UI components and focus indicators.

| Pair | Ratio | Needs |
|---|---|---|
| Text `#15241F` on surface | 16.1:1 | 4.5 |
| Labels `#44544E` on surface | 8.0:1 | 4.5 |
| Muted `#5A6862` on surface | 5.85:1 | 4.5 |
| Figures gold `#86600F` on surface | 5.69:1 | 4.5 |
| Positive amount `#2E7D5B` on surface | 5.0:1 | 4.5 |
| Links/primary teal `#0E5C56` on white | 7.82:1 | 4.5 |
| Errors `#A8362F` on surface | 6.49:1 | 4.5 |
| Field border `#889389` on white | 3.19:1 | 3.0 |
| Focus outline teal on white / paper | 7.82 / 7.06:1 | 3.0 |

## Audit checklist
- [ ] Keyboard-only pass: reach and operate every control, no traps
- [ ] Screen-reader pass: landmarks, headings, live-region announcements
- [ ] Lighthouse accessibility ≥ 95
- [ ] WAVE: zero errors
- [ ] `prefers-reduced-motion` verified (transitions/fade disabled)