const ENT = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export const escapeHTML = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ENT[c]);

/* compile a user pattern, never throwing */
export function compileRegex(pattern, ci = true, global = false) {
  if (pattern == null || pattern === "") return { ok: true, regex: null };
  const flags = (global ? "g" : "") + (ci ? "i" : "");
  try {
    return { ok: true, regex: new RegExp(pattern, flags) };
  } catch {
    return {
      ok: false,
      error: "That is not a valid pattern yet.",
      regex: null,
    };
  }
}

/* filter records whose description or category matches the pattern */
export function filterRecords(records, pattern, ci = true) {
  const { ok, regex, error } = compileRegex(pattern, ci, false); // non-global: lastIndex stays put
  if (!ok) return { ok: false, error, list: [] };
  if (!regex) return { ok: true, list: records };
  const list = records.filter(
    (r) => regex.test(r.description) || regex.test(r.category),
  );
  return { ok: true, list };
}

/* escape-first highlight -> safe HTML string with <mark> around matches */
export function highlight(text, pattern, ci = true) {
  const raw = String(text ?? "");
  const { ok, regex } = compileRegex(pattern, ci, true);
  if (!ok || !regex) return escapeHTML(raw);

  let out = "";
  let last = 0;
  for (const m of raw.matchAll(regex)) {
    if (m[0].length === 0) continue; // skip zero-width matches (e.g. "a*")
    out +=
      escapeHTML(raw.slice(last, m.index)) +
      "<mark>" +
      escapeHTML(m[0]) +
      "</mark>";
    last = m.index + m[0].length;
  }
  return out + escapeHTML(raw.slice(last));
}
