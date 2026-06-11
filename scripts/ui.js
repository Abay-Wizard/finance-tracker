import * as state from './state.js';
import { validateRecord } from './validators.js';
import { compileRegex, highlight, filterRecords } from './search.js';

/** Render the records table/cards from a given list. */
export function renderRecords(records) { /* TODO */ }

/** Render dashboard stats (total, sum, top category, 7-day trend). */
export function renderStats(records) { /* TODO */ }

/** Push a message to the polite or assertive live region. */
export function announce(message, assertive = false) { /* TODO */ }

/** Show/clear inline validation errors next to each field. */
export function showErrors(errors) { /* TODO */ }

/** Attach all event listeners (form submit, search input, sort, delete...). */
export function bindEvents() { /* TODO */ }

/** Apply current search + sort and re-render. */
export function refresh() { /* TODO: state.getAll() -> filter -> sort -> render */ }
