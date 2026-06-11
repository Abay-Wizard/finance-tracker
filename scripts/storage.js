const KEY = 'app:data';
const SETTINGS_KEY = 'app:settings';

/** Load all records from localStorage. Returns [] if empty/corrupt. */
export function load() {
  // TODO: JSON.parse with try/catch; fall back to []
}

/** Persist the full records array. */
export function save(records) {
  // TODO: localStorage.setItem(KEY, JSON.stringify(records))
}

/** Load/save user settings (cap, currency rates, etc.). */
export function loadSettings() { /* TODO */ }
export function saveSettings(settings) { /* TODO */ }

/**
 * Validate the SHAPE of imported JSON before accepting it.
 * Return { ok: true, records } or { ok: false, error }.
 * Check: is it an array? does each item have id, the numeric field, date?
 */
export function validateImport(raw) {
  // TODO: parse + structural checks; never trust the file
}

/** Serialize current records for download (export). */
export function exportJSON(records) {
  // TODO: return a JSON string (pretty-printed)
}
