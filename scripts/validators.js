export const RULES = {
  description: {
    label: "Description",
    max: 120,
    // advanced: a word immediately repeated, e.g. "the the", "is is"
    doubledWord: /\b([\p{L}\d]+)\s+\1\b/iu,
  },
  amount: {
    label: "Amount",
    // optional sign, plain integer OR comma-grouped thousands, optional 1–2 decimals
    pattern: /^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/,
  },
  category: {
    label: "Category",
    // starts with a letter; letters, spaces, & and - ; up to 40 chars
    pattern: /^[\p{L}][\p{L}\s&-]{0,39}$/u,
  },
  date: {
    label: "Date",
    pattern: /^\d{4}-\d{2}-\d{2}$/,
  },
};

/* ---- helpers --------------------------------------------------------- */
export function normalizeAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (value == null) return NaN;
  const n = Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export function isRealDate(iso) {
  if (!RULES.date.pattern.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

/* ---- per-field validators ------------------------------------------- */
export function validateDescription(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Add a description.";
  if (v.length > RULES.description.max)
    return `Keep it under ${RULES.description.max} characters.`;
  if (RULES.description.doubledWord.test(v))
    return "Looks like a doubled word — check the wording.";
  return "";
}

export function validateAmount(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Enter an amount.";
  if (!RULES.amount.pattern.test(v)) return "Use a number like 12.50 or -5.";
  if (normalizeAmount(v) === 0) return "Amount can’t be zero.";
  return "";
}

export function validateCategory(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Pick or type a category.";
  if (!RULES.category.pattern.test(v))
    return "Use letters, spaces, & or - (max 40).";
  return "";
}

export function validateDate(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Choose a date.";
  if (!isRealDate(v)) return "Use a real date (YYYY-MM-DD).";
  if (v > todayISO()) return "Date can’t be in the future.";
  return "";
}

/* ---- collect all field errors --------------------------------------- */
export function validateRecord(rec) {
  const errors = {};
  const checks = {
    description: validateDescription(rec.description),
    amount: validateAmount(rec.amount),
    category: validateCategory(rec.category),
    date: validateDate(rec.date),
  };
  for (const [field, msg] of Object.entries(checks))
    if (msg) errors[field] = msg;
  return { valid: Object.keys(errors).length === 0, errors };
}
