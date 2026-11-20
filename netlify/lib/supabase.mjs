// Server-side Supabase access for the Netlify Functions only.
// Reads SUPABASE_DATABASE_URL (the project API URL) and SUPABASE_SERVICE_ROLE_KEY
// (the secret key) from Netlify's environment, written by the Supabase extension.
// Never imported by browser code.

export class ConfigError extends Error {}

function baseUrl() {
  const u = (process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (!/^https:\/\//.test(u)) throw new ConfigError('SUPABASE_DATABASE_URL is missing or is not the https project URL');
  return u;
}

function headers() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!key) throw new ConfigError('SUPABASE_SERVICE_ROLE_KEY is missing');
  const h = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`; // legacy service_role JWT
  return h;
}

export async function rest(path, init = {}) {
  const res = await fetch(`${baseUrl()}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init.headers || {}) } });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export const rpc = (fn, args) => rest(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const fail = (status, error) => json(status, { error });

/** Database row → the app's row shape. */
export function fromDb(r) {
  return {
    id: r.id,
    rowType: r.row_type,
    name: r.name,
    startYear: r.start_year,
    endYear: r.end_year,
    value: Number(r.value_t),
    scope: r.scope,
    scope3Category: r.scope3_category,
    business: r.business,
    status: r.status,
    singleColumn: r.single_column,
    sortOrder: r.sort_order,
  };
}

/** A validated row → the database fields apply_roadmap_save reads. */
export function toDb(r) {
  const out = {
    row_type: r.rowType,
    name: r.name,
    start_year: r.startYear,
    end_year: r.endYear,
    value_t: r.value,
    scope: r.scope,
    scope3_category: r.scope3Category,
    business: r.business,
    status: r.status,
    single_column: r.singleColumn,
  };
  if (r.id) out.id = r.id;
  return out;
}

/** Log a server error without request content (no visitor data, no IP). */
export function logError(where, err) {
  console.error(`[${where}]`, err instanceof Error ? err.message : JSON.stringify(err).slice(0, 300));
}
