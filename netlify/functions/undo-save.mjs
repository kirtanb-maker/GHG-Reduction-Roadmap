// POST /.netlify/functions/undo-save — undo the newest Save that has not been undone,
// once. Rule: docs/access-matrix.md §6 line 4.
import { rpc, json, fail, logError, ConfigError } from '../lib/supabase.mjs';

export default async (req) => {
  if (req.method !== 'POST') return fail(405, 'Method not allowed.');
  try {
    const res = await rpc('undo_roadmap_save', {});
    if (!res.ok) {
      if (res.data && res.data.message === 'nothing_to_undo') return fail(409, 'There is no save to undo.');
      logError('undo-save', { status: res.status, code: res.data && res.data.code });
      return fail(502, 'Could not undo. Nothing was changed.');
    }
    return json(200, { undoneSaveId: res.data.undone_save_id, savedAt: res.data.saved_at });
  } catch (err) {
    logError('undo-save', err);
    return fail(err instanceof ConfigError ? 503 : 502, 'Could not undo. Nothing was changed.');
  }
};
