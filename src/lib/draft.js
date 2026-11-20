// Unsaved edits in the Adjust measures panel: a working copy of the rows, the rows
// marked for deletion, and the comparison with the saved rows that builds a Save.
import { FIELDS, validateRow } from './validate.js';
import { SETTINGS } from './settings.js';

let tmp = 0;
export const newKey = () => `new-${++tmp}`;

/** Saved rows → editable rows (value as text, a stable key). */
export function toDraftRows(rows) {
  return rows.map((r) => ({ ...r, key: r.id, value: String(r.value) }));
}

export function newMeasure(business) {
  return {
    key: newKey(), id: null, rowType: 'measure', name: '', status: 'planned', scope: 1, scope3Category: null,
    business, startYear: SETTINGS.targetYear, endYear: SETTINGS.targetYear, singleColumn: false, value: '0', sortOrder: null,
  };
}

export function newBaseRow(business) {
  return {
    key: newKey(), id: null, rowType: 'base', name: null, status: null, scope: 1, scope3Category: null,
    business, startYear: SETTINGS.baseYear, endYear: SETTINGS.baseYear, singleColumn: false, value: '0', sortOrder: null,
  };
}

const pick = (r) => Object.fromEntries(FIELDS.map((k) => [k, r[k]]));

/** True when an existing row's fields differ from its saved version. */
export function isChanged(row, saved) {
  if (!saved) return false;
  const { clean } = validateRow(row, { lenient: true });
  return FIELDS.some((k) => {
    const a = k === 'value' ? clean.value : k === 'singleColumn' ? clean.singleColumn : row[k] ?? null;
    const b = saved[k] ?? null;
    return k === 'name' || k === 'business' ? String(a ?? '').trim() !== String(b ?? '') : a !== b;
  });
}

/**
 * Everything the panel needs from the draft: visible rows, errors per row, the rows
 * the chart preview may use (valid ones), whether anything changed, and the Save body.
 */
export function analyseDraft(draft, savedRows) {
  const savedById = new Map(savedRows.map((r) => [r.id, r]));
  const rows = draft.rows.filter((r) => !draft.deleted.has(r.key));
  const errors = {};
  const previewRows = [];
  let maxOrder = Math.max(0, ...savedRows.map((r) => r.sortOrder || 0));
  for (const r of rows) {
    const { errors: e, clean } = validateRow(r, { lenient: true });
    if (Object.keys(e).length) { errors[r.key] = e; continue; }
    previewRows.push({ ...clean, id: r.id, key: r.key, sortOrder: r.sortOrder ?? ++maxOrder });
  }
  const updates = rows.filter((r) => r.id && isChanged(r, savedById.get(r.id)));
  const inserts = rows.filter((r) => !r.id);
  const deletes = [...draft.deleted].filter((k) => savedById.has(k));
  const changedKeys = new Set(updates.map((r) => r.key));
  const dirty = updates.length + inserts.length + deletes.length > 0;
  const valid = Object.keys(errors).length === 0;
  const payload = {
    updates: updates.map((r) => ({ id: r.id, ...validateRow(r, { lenient: true }).clean })),
    inserts: inserts.map((r) => validateRow(r, { lenient: true }).clean),
    deletes,
  };
  return { rows, errors, previewRows, changedKeys, dirty, valid, payload, deleteCount: deletes.length };
}

export { pick };
