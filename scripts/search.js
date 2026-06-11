/** Compile user input to a RegExp safely; null on empty or invalid pattern. */
export function compileRegex(input, flags = 'i') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null; // invalid pattern — UI should show a hint, not crash
  }
}

/** Wrap matches in <mark>. Escape text first if inserting as HTML. */
export function highlight(text, re) {
  // TODO: if no re, return escaped text; else replace matches with <mark>
}

/** Filter records whose searchable fields match the regex. */
export function filterRecords(records, re) {
  // TODO: if no re, return all; else keep records where any field tests true
}
