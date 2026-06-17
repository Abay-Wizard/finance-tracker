/* =========================================================================
   ui.js
   All DOM rendering and event binding. Reads/mutates through state.js, never
   touches localStorage directly. Sections are tagged by milestone.
   ========================================================================= */

import * as state from "./state.js";
import { validateRecord } from "./validators.js";
import { filterRecords, highlight } from "./search.js";
import { validateImport, exportJSON, storageOK } from "./storage.js";

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, kids = []) => {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of [].concat(kids)) n.append(k);
  return n;
};
const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

/* =======================================================================
   M5 — live-region announcements
   ===================================================================== */
export function announce(msg, assertive = false) {
  const node = $(assertive ? "live-alert" : "live-status");
  node.textContent = "";
  requestAnimationFrame(() => {
    node.textContent = msg;
  });
}

/* shared money formatter (uses the chosen display currency) */
function fmtMoney(baseValue, code = state.state.ui.display) {
  const v = baseValue * state.rateFor(code);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${code}`;
  }
}

/* =======================================================================
   M3 — inline error messages
   ===================================================================== */
const FIELD_INPUT = {
  description: "f-desc",
  amount: "f-amount",
  category: "f-category",
  date: "f-date",
};

export function showErrors(errors = {}) {
  for (const [field, inputId] of Object.entries(FIELD_INPUT)) {
    const msg = errors[field] || "";
    $(`${inputId}-err`).textContent = msg;
    $(inputId).setAttribute("aria-invalid", msg ? "true" : "false");
  }
}

/* =======================================================================
   M5 — dashboard stats + cap
   ===================================================================== */
let wasOverCap = false;

export function renderStats() {
  const recs = state.state.records;
  const code = state.state.ui.display;

  // sign convention: expenses negative, income positive
  const spent = recs.reduce((t, r) => t + (r.amount < 0 ? -r.amount : 0), 0); // gross outflow (positive)
  const earned = recs.reduce((t, r) => t + (r.amount > 0 ? r.amount : 0), 0); // gross inflow (positive)
  const net = earned - spent;

  $("stat-count").textContent = recs.length;

  // Net balance card (green positive / red negative)
  $("stat-net").textContent = fmtMoney(net, code);
  const netCard = $("stat-net-card");
  netCard.classList.toggle("pos", net >= 0);
  netCard.classList.toggle("neg", net < 0);
  $("stat-net-note").textContent =
    `${fmtMoney(earned, code)} in · ${fmtMoney(spent, code)} out`;

  // Spent card
  $("stat-sum").textContent = fmtMoney(spent, code);

  // Top category — by spending only (expenses), so income can't be a "top spender"
  const byCat = {};
  for (const r of recs)
    if (r.amount < 0) byCat[r.category] = (byCat[r.category] || 0) + -r.amount;
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  $("stat-top").textContent = top ? top[0] : "—";
  $("stat-top-amount").textContent = top ? fmtMoney(top[1], code) : "";

  // Cap applies to spending
  const cap = state.state.settings.cap;
  const over = cap > 0 && spent > cap;
  $("stat-sum-card").classList.toggle("over", over);
  const note = $("stat-cap-note");
  if (cap > 0) {
    note.textContent = over
      ? `Over cap by ${fmtMoney(spent - cap, code)}`
      : `${fmtMoney(cap - spent, code)} left of ${fmtMoney(cap, code)}`;
    note.classList.toggle("over", over);
  } else {
    note.textContent = "No cap set";
    note.classList.remove("over");
  }
  // polite when easing under, assertive when crossing over
  if (over && !wasOverCap)
    announce(
      `Heads up — your spending is now over the cap of ${fmtMoney(cap, code)}.`,
      true,
    );
  if (!over && wasOverCap) announce("Back under your spending cap.");
  wasOverCap = over;

  renderChart(recs, code);
}

function renderChart(recs, code) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    days.push({
      iso,
      label: d.toLocaleDateString(undefined, { weekday: "short" })[0],
      total: 0,
    });
  }
  for (const r of recs) {
    if (r.amount >= 0) continue; // chart shows daily spending (outflow) only
    const day = days.find((x) => x.iso === r.date);
    if (day) day.total += -r.amount;
  }
  const max = Math.max(...days.map((d) => d.total), 1);

  const wrap = $("chart");
  wrap.innerHTML = "";
  const bars = el("div");
  bars.style.cssText =
    "display:flex;align-items:flex-end;gap:5px;height:64px;width:100%";
  for (const d of days) {
    const bar = el("div", {
      className: "chart-bar" + (d.total ? "" : " empty"),
    });
    bar.style.height =
      (d.total > 0 ? Math.max(6, (d.total / max) * 64) : 3) + "px";
    bar.title = `${d.iso}: ${fmtMoney(d.total, code)}`;
    bars.append(bar);
  }
  const axis = el("div", { className: "chart-axis" });
  for (const d of days) axis.append(el("span", { textContent: d.label }));
  wrap.append(bars, axis);
  $("chart-text").textContent =
    "Daily totals: " +
    days.map((d) => `${d.iso} ${fmtMoney(d.total, code)}`).join(", ");
}

/* =======================================================================
   M4 — render records (filter -> sort -> table/cards) + highlight
   ===================================================================== */
function sortRecords(list) {
  const { sortField: f, sortDir: dir } = state.state.ui;
  const mul = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    let c;
    if (f === "amount") c = a.amount - b.amount;
    else if (f === "date") c = a.date.localeCompare(b.date);
    else
      c = String(a[f]).localeCompare(String(b[f]), undefined, {
        sensitivity: "base",
      });
    return c * mul;
  });
}

function emptyState(title, body) {
  return el("div", { className: "empty" }, [
    el("strong", { textContent: title }),
    el("span", { textContent: body }),
  ]);
}

export function renderRecords() {
  const { search, ci, display } = state.state.ui;
  const result = filterRecords(state.state.records, search, ci);

  $("search-err").textContent = result.ok ? "" : result.error;
  const rows = result.ok ? sortRecords(result.list) : [];
  $("results-count").textContent = rows.length;

  const host = $("records-host");
  host.innerHTML = "";

  if (state.state.records.length === 0) {
    host.append(
      emptyState("No records yet.", "Add your first one in the form below."),
    );
    return;
  }
  if (rows.length === 0) {
    host.append(
      emptyState(
        "No matches.",
        result.ok
          ? "Nothing matches your search."
          : "Fix the pattern to see results.",
      ),
    );
    return;
  }

  const table = el("table", { className: "ledger render-in" });
  table.append(
    el("caption", {
      textContent: `${rows.length} of ${state.state.records.length} records, shown in ${display}`,
    }),
  );
  const headRow = el("tr");
  for (const [label, cls] of [
    ["Description", ""],
    ["Category", ""],
    ["Date", ""],
    ["Amount", "amount"],
    ["", "amount"],
  ]) {
    headRow.append(
      el("th", { textContent: label, scope: "col", className: cls }),
    );
  }
  table.append(el("thead", {}, headRow));

  const body = el("tbody");
  for (const r of rows) body.append(recordRow(r, search, ci));
  table.append(body);
  host.append(table);
}

function recordRow(r, search, ci) {
  const tr = el("tr");

  const tdDesc = el("td", { className: "cell-desc" });
  tdDesc.dataset.label = "Description";
  tdDesc.innerHTML = highlight(r.description, search, ci); // escaped inside highlight()

  const tdCat = el("td");
  tdCat.dataset.label = "Category";
  const chip = el("span", { className: "cell-cat" });
  chip.innerHTML = highlight(r.category, search, ci);
  tdCat.append(chip);

  const tdDate = el("td", { className: "cell-date" });
  tdDate.dataset.label = "Date";
  tdDate.textContent = r.date;

  const tdAmt = el("td", { className: "amount" });
  tdAmt.dataset.label = "Amount";
  tdAmt.append(
    el("span", {
      className: "amount-fig" + (r.amount > 0 ? " in" : ""),
      textContent: fmtMoney(r.amount),
    }),
  );

  const tdAct = el("td", { className: "amount actions" });
  tdAct.dataset.label = "Actions";
  const actions = el("div", { className: "row-actions" });
  const edit = el("button", {
    className: "icon-btn",
    type: "button",
    textContent: "Edit",
  });
  edit.dataset.act = "edit";
  edit.dataset.id = r.id;
  edit.setAttribute("aria-label", `Edit ${r.description}`);
  const del = el("button", {
    className: "icon-btn del",
    type: "button",
    textContent: "Delete",
  });
  del.dataset.act = "delete";
  del.dataset.id = r.id;
  del.setAttribute("aria-label", `Delete ${r.description}`);
  actions.append(edit, del);
  tdAct.append(actions);

  tr.append(tdDesc, tdCat, tdDate, tdAmt, tdAct);
  return tr;
}

/* =======================================================================
   M4 — refresh = get -> filter -> sort -> render (+ stats)
   ===================================================================== */
export function refresh() {
  renderStats();
  renderRecords();
}

/* =======================================================================
   M3/M6 — form (add / edit)
   ===================================================================== */
function readForm() {
  return {
    description: $("f-desc").value.trim(),
    amount: $("f-amount").value.trim(), // positive magnitude; toggle owns the sign
    category: $("f-category").value.trim(),
    date: $("f-date").value,
  };
}

const formType = () => ($("f-type-income").checked ? "income" : "expense");
function syncCategoryList() {
  $("f-category").setAttribute(
    "list",
    formType() === "income" ? "cat-income" : "cat-expense",
  );
}
function setFormType(t) {
  $("f-type-income").checked = t === "income";
  $("f-type-expense").checked = t !== "income";
  syncCategoryList();
}

function onSubmitForm(e) {
  e.preventDefault();
  const data = readForm();
  const { valid, errors } = validateRecord(data);
  showErrors(errors);
  if (!valid) {
    announce("Some fields need attention.", true);
    return;
  }

  // apply the sign: expense negative, income positive
  const magnitude = Number(data.amount.replace(/,/g, ""));
  const signed = formType() === "income" ? magnitude : -magnitude;
  const record = { ...data, amount: signed };

  const id = $("record-id").value;
  if (id) {
    state.update(id, record);
    announce("Record updated.");
  } else {
    state.add(record);
    announce("Record added.");
  }
  resetForm();
  refresh();
  $("f-desc").focus();
}

function startEdit(id) {
  const r = state.find(id);
  if (!r) return;
  $("record-id").value = r.id;
  $("f-desc").value = r.description;
  setFormType(r.amount > 0 ? "income" : "expense");
  $("f-amount").value = Math.abs(r.amount); // show positive magnitude
  $("f-category").value = r.category;
  $("f-date").value = r.date;
  $("form-submit").textContent = "Save changes";
  $("form-mode").textContent = `Editing “${r.description}”`;
  $("form").scrollIntoView?.({ behavior: "smooth", block: "start" });
  $("f-desc").focus();
  announce(`Editing ${r.description}.`);
}

function removeRecord(id) {
  const r = state.find(id);
  if (!r) return;
  if (!confirm(`Delete “${r.description}”? This cannot be undone.`)) return;
  state.remove(id);
  refresh();
  announce(`Deleted ${r.description}.`);
}

function resetForm() {
  $("record-form").reset();
  $("record-id").value = "";
  setFormType("expense");
  $("f-date").value = todayISO();
  $("form-submit").textContent = "Add record";
  $("form-mode").textContent = "";
  showErrors({});
}

/* =======================================================================
   M6 — settings, import / export, clear
   ===================================================================== */
function fillSettings() {
  const s = state.state.settings;
  $("s-cap").value = s.cap || "";
  $("s-base").value = s.base;
  $("s-alt1-code").value = s.alts[0]?.code || "";
  $("s-alt1-rate").value = s.alts[0]?.rate ?? "";
  $("s-alt2-code").value = s.alts[1]?.code || "";
  $("s-alt2-rate").value = s.alts[1]?.rate ?? "";
}

function fillCurrencyOptions() {
  const sel = $("display-currency");
  sel.innerHTML = "";
  for (const c of state.currencies())
    sel.append(el("option", { value: c.code, textContent: c.code }));
  sel.value = state.state.ui.display;
}

function onSaveSettings(e) {
  e.preventDefault();
  $("s-cap-err").textContent = "";
  $("s-rate-err").textContent = "";

  let cap = 0;
  const capRaw = $("s-cap").value.trim();
  if (capRaw !== "") {
    cap = Number(capRaw.replace(/,/g, ""));
    if (!Number.isFinite(cap) || cap < 0) {
      $("s-cap-err").textContent = "Use 0 or a positive number.";
      return;
    }
  }
  const base = $("s-base").value.trim().toUpperCase() || "USD";
  const alts = [];
  for (const [c, rt] of [
    ["s-alt1-code", "s-alt1-rate"],
    ["s-alt2-code", "s-alt2-rate"],
  ]) {
    const code = $(c).value.trim().toUpperCase();
    if (!code) continue;
    const rate = Number($(rt).value);
    if (!Number.isFinite(rate) || rate <= 0) {
      $("s-rate-err").textContent = `Give ${code} a rate greater than 0.`;
      return;
    }
    alts.push({ code, rate });
  }

  state.setSettings({ cap, base, alts });
  wasOverCap = false;
  fillCurrencyOptions();
  refresh();
  announce("Settings saved.");
}

function exportData() {
  const url = URL.createObjectURL(
    new Blob([exportJSON(state.state)], { type: "application/json" }),
  );
  const a = el("a", {
    href: url,
    download: `finance-tracker-${todayISO()}.json`,
  });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  announce("Data exported.");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch {
      announce("That file is not valid JSON.", true);
      return;
    }
    const res = validateImport(parsed);
    if (!res.ok) {
      announce(res.error, true);
      return;
    }
    if (
      !confirm(
        `Import ${res.records.length} record(s)? This replaces what you have now.`,
      )
    )
      return;
    state.setRecords(res.records);
    if (res.settings) {
      state.setSettings(res.settings);
      fillSettings();
      fillCurrencyOptions();
    }
    refresh();
    announce(`Imported ${res.records.length} record(s).`);
  };
  reader.readAsText(file);
}

function clearAll() {
  if (state.state.records.length === 0) {
    announce("Nothing to delete.");
    return;
  }
  if (!confirm("Delete every record? This cannot be undone.")) return;
  state.setRecords([]);
  refresh();
  announce("All records deleted.");
}

async function loadSeed() {
  let data;
  try {
    const res = await fetch("./seed.json", { cache: "no-store" });
    if (!res.ok) throw new Error("http");
    data = await res.json();
  } catch {
    announce(
      "Could not load seed.json — make sure the app is served over HTTP.",
      true,
    );
    return;
  }
  const out = validateImport(data);
  if (!out.ok) {
    announce(out.error, true);
    return;
  }
  if (
    !confirm(
      `Load ${out.records.length} sample record(s)? This replaces what you have now.`,
    )
  )
    return;
  state.setRecords(out.records);
  if (out.settings) {
    state.setSettings(out.settings);
    fillSettings();
    fillCurrencyOptions();
  }
  refresh();
  announce(`Loaded ${out.records.length} sample record(s).`);
}

/* =======================================================================
   M4/M6 — event binding + scroll spy + boot helpers
   ===================================================================== */
let searchTimer;
export function bindEvents() {
  $("record-form").addEventListener("submit", onSubmitForm);
  $("form-reset").addEventListener("click", () => {
    resetForm();
    announce("Form cleared.");
  });
  $("f-type-expense").addEventListener("change", syncCategoryList);
  $("f-type-income").addEventListener("change", syncCategoryList);

  $("records-host").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    if (btn.dataset.act === "edit") startEdit(btn.dataset.id);
    else if (btn.dataset.act === "delete") removeRecord(btn.dataset.id);
  });

  $("search").addEventListener("input", (e) => {
    state.setUI({ search: e.target.value });
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderRecords, 120);
  });
  $("search-ci").addEventListener("change", (e) => {
    state.setUI({ ci: e.target.checked });
    renderRecords();
  });
  $("sort-field").addEventListener("change", (e) => {
    state.setUI({ sortField: e.target.value });
    renderRecords();
  });
  $("sort-dir").addEventListener("click", () => {
    const asc = state.state.ui.sortDir === "asc";
    state.setUI({ sortDir: asc ? "desc" : "asc" });
    const btn = $("sort-dir");
    btn.textContent = asc ? "↓ Desc" : "↑ Asc";
    btn.setAttribute("aria-pressed", String(!asc));
    btn.setAttribute("aria-label", asc ? "Sort descending" : "Sort ascending");
    renderRecords();
  });

  $("display-currency").addEventListener("change", (e) => {
    state.setUI({ display: e.target.value });
    refresh();
  });

  $("settings-form").addEventListener("submit", onSaveSettings);
  $("export-btn").addEventListener("click", exportData);
  $("seed-btn").addEventListener("click", loadSeed);
  $("clear-btn").addEventListener("click", clearAll);
  $("import-input").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });
}

function setupScrollSpy() {
  if (typeof IntersectionObserver === "undefined") return;
  const links = [...document.querySelectorAll(".primary-nav a")];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const obs = new IntersectionObserver(
    (entries) => {
      for (const en of entries)
        if (en.isIntersecting) {
          links.forEach((a) => a.removeAttribute("aria-current"));
          byId.get(en.target.id)?.setAttribute("aria-current", "true");
        }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  document.querySelectorAll("main .section").forEach((s) => obs.observe(s));
}

function hydrateUI() {
  const ui = state.state.ui;
  $("search").value = ui.search;
  $("search-ci").checked = ui.ci;
  $("sort-field").value = ui.sortField;
  const btn = $("sort-dir");
  btn.textContent = ui.sortDir === "asc" ? "↑ Asc" : "↓ Desc";
  btn.setAttribute("aria-pressed", String(ui.sortDir === "asc"));
  $("year").textContent = new Date().getFullYear();
  $("f-date").value = todayISO();
}

/* called once by app.js after state.init() */
export function start() {
  hydrateUI();
  fillSettings();
  fillCurrencyOptions();
  bindEvents();
  setupScrollSpy();
  refresh();
  if (!storageOK())
    announce("Storage is unavailable — changes will not be saved.", true);
}
