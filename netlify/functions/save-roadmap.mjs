// POST /.netlify/functions/save-roadmap — one Save: edits, new rows and deletes,
// applied all together or not at all. This function is the rule for its path
// (docs/access-matrix.md §6 line 3): size limits, every field validated, then one
// database call that snapshots, applies and records the Save.
import { LIMITS, validateSave } from '../../src/lib/validate.js';
import { rpc, json, fail, toDb, logError, ConfigError } from '../lib/supabase.mjs';

const NOTHING = ' Nothing was saved.';
const DB_MESSAGES = {
  unknown_id: 'A row you changed no longer exists or was deleted by someone else. Reload the page and try again.',
  duplicate_id: 'The same row appears twice in one save.',
  row_type_change: 'A base-year row cannot become a measure, or the other way round.',
  no_changes: 'There were no changes to save.',
};

export default async (req) => {
  if (req.method !== 'POST') return fail(405, 'Method not allowed.');
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > LIMITS.maxBytes) return fail(413, `This save is too large (over 50 KB).${NOTHING}`);
  const text = await req.text();
  if (new TextEncoder().encode(text).length > LIMITS.maxBytes) return fail(413, `This save is too large (over 50 KB).${NOTHING}`);

  let body;
  try { body = JSON.parse(text); } catch { return fail(400, `The request was not valid JSON.${NOTHING}`); }
  const v = validateSave(body);
  if (!v.ok) return fail(400, `${v.error}${NOTHING}`);

  try {
    const res = await rpc('apply_roadmap_save', {
      p_updates: v.updates.map(toDb),
      p_inserts: v.inserts.map(toDb),
      p_deletes: v.deletes,
    });
    if (!res.ok) {
      const code = res.data && res.data.message;
      if (code in DB_MESSAGES) return fail(409, `${DB_MESSAGES[code]}${NOTHING}`);
      logError('save-roadmap', { status: res.status, code: res.data && res.data.code });
      return fail(res.status === 400 ? 400 : 502, `Could not save.${NOTHING}`);
    }
    return json(200, { savedAt: res.data.saved_at, createdIds: res.data.created_ids });
  } catch (err) {
    logError('save-roadmap', err);
    return fail(err instanceof ConfigError ? 503 : 502, `Could not save.${NOTHING}`);
  }
};
