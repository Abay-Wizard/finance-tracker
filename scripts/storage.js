import { normalizeAmount, isRealDate } from "./validators.js";

const KEY = { records: "ft:records", settings: "ft:settings", ui: "ft:ui" };

export const DEFAULT_SETTINGS = {
  cap: 0,
  base: "USD",
  alts: [
    { code: "EUR", rate: 0.92 },
    { code: "GBP", rate: 0.79 },
  ],
};
export const DEFAULT_UI = {
  search: "",
  ci: true,
  sortField: "date",
  sortDir: "desc",
  display: "USD",
};

let writable = true;
export const storageOK = () => writable;

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    writable = false;
    return false;
  }
}

/* ---- records --------------------------------------------------------- */
export function load() {
  const r = read(KEY.records, []);
  return Array.isArray(r) ? r : [];
}
export const save = (records) => write(KEY.records, records);

/* ---- settings -------------------------------------------------------- */
export const loadSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...read(KEY.settings, {}),
});
export const saveSettings = (s) => write(KEY.settings, s);

/* ---- ui prefs -------------------------------------------------------- */
export const loadUI = () => ({ ...DEFAULT_UI, ...read(KEY.ui, {}) });
export const saveUI = (u) => write(KEY.ui, u);

/* ---- import / export ------------------------------------------------- */
export function sanitizeRecord(r, i = 0) {
  return {
    id: r && r.id ? String(r.id) : `r${Date.now().toString(36)}${i}`,
    description: String(r?.description ?? "").slice(0, 120),
    amount: normalizeAmount(r?.amount),
    category: String(r?.category ?? "Uncategorised").slice(0, 40),
    date: isRealDate(r?.date) ? r.date : todayISO(),
  };
}

export function validateImport(data) {
  const incoming = Array.isArray(data) ? data : data?.records;
  if (!Array.isArray(incoming))
    return { ok: false, error: "That file has no records array." };

  const records = incoming
    .map(sanitizeRecord)
    .filter((r) => r.description && Number.isFinite(r.amount));

  const settings =
    !Array.isArray(data) && data.settings && data.settings.base
      ? { ...DEFAULT_SETTINGS, ...data.settings }
      : null;

  return { ok: true, records, settings };
}

export function exportJSON({ records, settings }) {
  return JSON.stringify(
    { version: 1, exported: new Date().toISOString(), records, settings },
    null,
    2,
  );
}
