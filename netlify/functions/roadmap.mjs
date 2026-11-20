// GET /.netlify/functions/roadmap — the visible roadmap rows, whether Undo is
// available and when the last Save happened. Never returns a hidden row or a snapshot.
// Rule: docs/access-matrix.md §6 line 2.
import { rest, json, fail, fromDb, logError, ConfigError } from '../lib/supabase.mjs';

const COLUMNS = 'id,row_type,name,start_year,end_year,value_t,scope,scope3_category,business,status,single_column,sort_order';

export default async (req) => {
  if (req.method !== 'GET') return fail(405, 'Method not allowed.');
  try {
    const [rows, last] = await Promise.all([
      rest(`roadmap_rows?select=${COLUMNS}&deleted_at=is.null&order=sort_order.asc`),
      rest('roadmap_saves?select=saved_at,undone_at&order=id.desc&limit=1'),
    ]);
    if (!rows.ok || !last.ok) {
      logError('roadmap', { rows: rows.status, last: last.status });
      return fail(502, 'Roadmap data could not be loaded.');
    }
    const latest = last.data[0] || null;
    return json(200, {
      rows: rows.data.map(fromDb),
      canUndo: !!latest && !latest.undone_at,
      lastSavedAt: latest ? latest.saved_at : null,
    });
  } catch (err) {
    logError('roadmap', err);
    return fail(err instanceof ConfigError ? 503 : 502, 'Roadmap data could not be loaded.');
  }
};
