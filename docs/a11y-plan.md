# Accessibility Plan

## Landmarks & headings
Header, Navigation, Main, Dashboard Section, Records Section, Add/Edit Record Section, Settings Section, About Section, Footer.
Heading hierarchy: H1 Finance Tracker, H2 Dashboard, Records, Add/Edit Record, Settings, About, H3 Total Records, Total Spent, Top Category.

## Skip link & focus
Skip link goes from the top of the page to the main content section. Visible focus indicators on navigation links, search box, checkbox, sort dropdown, form inputs, buttons, table actions, and import/export controls.
Focus styling uses `:focus-visible`; default outlines are never removed without an equal or stronger replacement.

## Live regions
Polite: record added, updated, deleted, import/export completed, search results updated.
Assertive: validation errors, failed import/export, spending cap exceeded warning.
Polite is used for non-critical updates; assertive is used for errors and urgent notifications.

## Keyboard flow
Tab order: Skip Link → Navigation → Search → Checkbox → Sort Control → Records/Table → Edit/Delete Actions → Form Fields (Description → Amount → Category → Date) → Save Button → Settings Controls → About Links.
Enter submits forms and activates buttons. Esc closes dialogs or cancels editing mode.

## Color contrast
Target WCAG 2.1 AA compliance: minimum 4.5:1 for normal text and 3:1 for UI components and focus indicators. Contrast will be checked using Lighthouse, WAVE, and browser accessibility tools.