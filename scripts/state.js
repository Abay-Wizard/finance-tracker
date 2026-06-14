import * as storage from "./storage.js";
import { normalizeAmount } from "./validators.js";

export const state = { records: [], settings: null, ui: null };

let seq = 0;
export const nextId = () =>
  `r${Date.now().toString(36)}${(seq++).toString(36)}`;

/* ---- lifecycle ------------------------------------------------------- */
export function init() {
  state.records = storage.load();
  state.settings = storage.loadSettings();
  state.ui = storage.loadUI();
  if (!currencyCodes().includes(state.ui.display))
    state.ui.display = state.settings.base;
  return state;
}

/* ---- record mutations (persist every change) ------------------------- */
export function add(rec) {
  const record = { id: nextId(), ...rec, amount: normalizeAmount(rec.amount) };
  state.records.push(record);
  storage.save(state.records);
  return record;
}
export function update(id, rec) {
  const i = state.records.findIndex((r) => r.id === id);
  if (i > -1)
    state.records[i] = { id, ...rec, amount: normalizeAmount(rec.amount) };
  storage.save(state.records);
}
export function remove(id) {
  state.records = state.records.filter((r) => r.id !== id);
  storage.save(state.records);
}
export function setRecords(list) {
  state.records = list;
  storage.save(state.records);
}
export const find = (id) => state.records.find((r) => r.id === id);

/* ---- settings & ui --------------------------------------------------- */
export function setSettings(s) {
  state.settings = s;
  if (!currencyCodes().includes(state.ui.display)) state.ui.display = s.base;
  storage.saveSettings(s);
  storage.saveUI(state.ui);
}
export function setUI(patch) {
  state.ui = { ...state.ui, ...patch };
  storage.saveUI(state.ui);
}

/* ---- currency (derived from settings) -------------------------------- */
export function currencies() {
  const { base, alts } = state.settings;
  const list = [{ code: base, rate: 1 }];
  for (const a of alts)
    if (a.code) list.push({ code: a.code, rate: Number(a.rate) || 0 });
  return list;
}
export const currencyCodes = () => currencies().map((c) => c.code);
export const rateFor = (code) =>
  currencies().find((c) => c.code === code)?.rate ?? 1;
