import { load, save } from './storage.js';

let records = []; // the single source of truth — nothing else holds the list

/** Boot state from storage. Call once at startup. */
export function init() { /* TODO: records = load() */ }

export function getAll() { /* TODO: return a copy, not the live array */ }

/** Create a record: assign id (rec_XXXX), createdAt, updatedAt; persist. */
export function add(data) {
  // TODO: build record, push, save(), return it
}

/** Update by id: merge changes, refresh updatedAt, persist. */
export function update(id, changes) { /* TODO */ }

/** Remove by id, persist. */
export function remove(id) { /* TODO */ }

/** Generate the next unique id, e.g. rec_0001. */
function nextId() { /* TODO */ }
