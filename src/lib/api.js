// Browser side: talks only to the tool's Netlify Functions, never to Supabase.
async function call(path, init) {
  let res;
  try {
    res = await fetch(`/.netlify/functions/${path}`, init);
  } catch {
    return { ok: false, error: null };
  }
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) return { ok: false, status: res.status, error: body && body.error };
  return { ok: true, data: body };
}

export const loadRoadmap = () => call('roadmap', { method: 'GET', headers: { Accept: 'application/json' } });
export const saveRoadmap = (payload) => call('save-roadmap', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
export const undoSave = () => call('undo-save', { method: 'POST' });
