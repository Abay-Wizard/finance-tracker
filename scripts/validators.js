// --- Regex catalog (document these in README) ---
export const RULES = {
  description: /^\S(?:.*\S)?$/,                       // no leading/trailing space
  amount:      /^(0|[1-9]\d*)(\.\d{1,2})?$/,          // money / numeric
  date:        /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category:    /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,        // letters, spaces, hyphens
  doubleWord:  /\b(\w+)\s+\1\b/,                       // ADVANCED: back-reference
};

/** Each validator returns { valid: boolean, message: string }. */
export function validateDescription(value) { /* TODO: test RULES.description + doubleWord */ }
export function validateAmount(value)      { /* TODO */ }
export function validateDate(value)        { /* TODO */ }
export function validateCategory(value)    { /* TODO */ }

/** Validate a whole record object; collect all field errors. */
export function validateRecord(data) {
  // TODO: run each validator, return { valid, errors: { field: message } }
}
