// Field rules for roadmap rows — spec v2.0 Section 9 "Validation rules".
// Shared by the Adjust measures panel (lenient: field text from inputs) and by the
// save-roadmap Netlify Function (strict: JSON types). The function is the rule.
import { SETTINGS } from './settings.js';

export const LIMITS = { maxBytes: 50 * 1024, maxRows: 200, nameMax: 60, businessMax: 40 };
export const FIELDS = ['rowType', 'name', 'startYear', 'endYear', 'value', 'scope', 'scope3Category', 'business', 'status', 'singleColumn'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const { baseYear, actualYear, targetYear } = SETTINGS;

/** Allowed [first, last] year for a row, by type and status. */
export function yearRange(rowType, status) {
  if (rowType === 'base') return [baseYear, baseYear];
  if (status === 'done') return [baseYear, actualYear];
  return [actualYear + 1, targetYear];
}

function toNumber(v, lenient) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (lenient && typeof v === 'string' && v.trim() !== '') {
    const n = Number(v.trim().replace(/\s/g, '').replace(',', '.').replace('−', '-'));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

const isInt = (n) => Number.isInteger(n);
const oneDecimal = (n) => Math.abs(Math.round(n * 10) - n * 10) < 1e-9;

/**
 * Validate one row. Returns { errors: {field: message}, clean } — clean is the
 * normalised row (numbers, trimmed text, nulls) when errors is empty.
 */
export function validateRow(row, { lenient = false } = {}) {
  const errors = {};
  const rowType = row.rowType;
  if (rowType !== 'base' && rowType !== 'measure') errors.rowType = 'Row type must be base or measure';
  const isBase = rowType === 'base';

  let name = null;
  if (!isBase) {
    if (typeof row.name !== 'string' || row.name.trim() === '') errors.name = 'Name is required';
    else if (row.name.trim().length > LIMITS.nameMax) errors.name = `Name: at most ${LIMITS.nameMax} characters`;
    else name = row.name.trim();
  } else if (row.name != null && row.name !== '') errors.name = 'Base-year rows have no name';

  let status = null;
  if (!isBase) {
    if (row.status !== 'done' && row.status !== 'planned') errors.status = 'Choose Done or Planned';
    else status = row.status;
  } else if (row.status != null && row.status !== '') errors.status = 'Base-year rows have no status';

  const start = toNumber(row.startYear, lenient);
  const end = toNumber(row.endYear, lenient);
  if (!isInt(start) || !isInt(end)) errors.years = 'Choose a start and an end year';
  else if (isBase) {
    if (start !== baseYear || end !== baseYear) errors.years = `Base-year rows are always ${baseYear}`;
  } else if (start > end) errors.years = 'The start year must not be after the end year';
  else if (status === 'planned' && (start < actualYear + 1 || end > targetYear)) errors.years = `Planned measures run ${actualYear + 1}–${targetYear}`;
  else if (status === 'done' && (start < baseYear || end > actualYear)) errors.years = `Done measures run ${baseYear}–${actualYear}`;
  else if (status === 'done' && start === end && start === baseYear) errors.years = `A single-year done measure runs ${baseYear + 1}–${actualYear}`;

  const value = toNumber(row.value, lenient);
  if (Number.isNaN(value)) errors.value = 'Enter a number';
  else if (!oneDecimal(value)) errors.value = 'At most one decimal';
  else if (isBase && (value < 0 || value > 10_000_000)) errors.value = 'Base-year emissions: 0 to 10,000,000 t';
  else if (!isBase && value === 0) errors.value = 'Must not be 0';
  else if (!isBase && (value < -1_000_000 || value > 1_000_000)) errors.value = 'Between −1,000,000 and 1,000,000 t';

  const scope = toNumber(row.scope, lenient);
  if (![1, 2, 3].includes(scope)) errors.scope = 'Choose Scope 1, 2 or 3';

  let scope3Category = null;
  const hasCat = row.scope3Category != null && row.scope3Category !== '';
  if (scope === 3) {
    const c = toNumber(row.scope3Category, lenient);
    if (!hasCat || !isInt(c) || c < 1 || c > 15) errors.scope3Category = 'Choose a Scope 3 category';
    else scope3Category = c;
  } else if (hasCat) errors.scope3Category = 'Only Scope 3 rows have a category';

  let business = null;
  if (typeof row.business !== 'string' || row.business.trim() === '') errors.business = 'Business is required';
  else if (row.business.trim().length > LIMITS.businessMax) errors.business = `Business: at most ${LIMITS.businessMax} characters`;
  else business = row.business.trim();

  if (typeof row.singleColumn !== 'boolean' && !(isBase && row.singleColumn == null)) errors.singleColumn = 'One column must be yes or no';
  const singleColumn = !isBase && row.singleColumn === true && start !== end;

  const clean = { rowType, name, startYear: start, endYear: end, value, scope, scope3Category, business, status, singleColumn };
  return { errors, clean };
}

function label(row, i) {
  const who = typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : row?.rowType === 'base' ? 'Base row' : 'New measure';
  return `${who} (row ${i + 1})`;
}

/**
 * Validate a whole Save request body: { updates: [...], inserts: [...], deletes: [ids] }.
 * Returns { ok: true, updates, inserts, deletes } with clean rows, or { ok: false, error }.
 */
export function validateSave(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'The request must be an object.' };
  const extra = Object.keys(body).filter((k) => !['updates', 'inserts', 'deletes'].includes(k));
  if (extra.length) return { ok: false, error: `Unknown field: ${extra[0]}.` };
  const updates = body.updates ?? [];
  const inserts = body.inserts ?? [];
  const deletes = body.deletes ?? [];
  if (![updates, inserts, deletes].every(Array.isArray)) return { ok: false, error: 'updates, inserts and deletes must be lists.' };
  const total = updates.length + inserts.length + deletes.length;
  if (total === 0) return { ok: false, error: 'There were no changes to save.' };
  if (total > LIMITS.maxRows) return { ok: false, error: `At most ${LIMITS.maxRows} changed rows per save (this one has ${total}).` };

  const ids = [];
  const cleanUpdates = [];
  for (const [i, row] of updates.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { ok: false, error: `Change ${i + 1} is not a row.` };
    const unknown = Object.keys(row).filter((k) => k !== 'id' && !FIELDS.includes(k));
    if (unknown.length) return { ok: false, error: `Unknown field: ${unknown[0]} — ${label(row, i)}.` };
    const missing = FIELDS.filter((k) => !(k in row) && !(k === 'singleColumn' && row.rowType === 'base'));
    if (missing.length) return { ok: false, error: `Missing field: ${missing[0]} — ${label(row, i)}.` };
    if (typeof row.id !== 'string' || !UUID.test(row.id)) return { ok: false, error: `Unknown row id — ${label(row, i)}.` };
    const { errors, clean } = validateRow(row);
    const first = Object.values(errors)[0];
    if (first) return { ok: false, error: `${first} — ${label(row, i)}.` };
    ids.push(row.id);
    cleanUpdates.push({ id: row.id, ...clean });
  }
  const cleanInserts = [];
  for (const [i, row] of inserts.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { ok: false, error: `New row ${i + 1} is not a row.` };
    const unknown = Object.keys(row).filter((k) => !FIELDS.includes(k));
    if (unknown.length) return { ok: false, error: `Unknown field: ${unknown[0]} — ${label(row, updates.length + i)}.` };
    const { errors, clean } = validateRow(row);
    const first = Object.values(errors)[0];
    if (first) return { ok: false, error: `${first} — ${label(row, updates.length + i)}.` };
    cleanInserts.push(clean);
  }
  for (const id of deletes) {
    if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, error: 'Unknown row id in the rows to delete.' };
    ids.push(id);
  }
  if (new Set(ids).size !== ids.length) return { ok: false, error: 'The same row appears twice in one save.' };
  return { ok: true, updates: cleanUpdates, inserts: cleanInserts, deletes };
}
