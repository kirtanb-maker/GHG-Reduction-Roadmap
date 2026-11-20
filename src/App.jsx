import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeRoadmap, listBusinesses, listScope3Categories, SCOPES } from './lib/roadmap.js';
import { UNSTACKED, segmentPalette } from './lib/colors.js';
import { DISPLAY_UNIT, fmt, fmtPct, fmtTargetPct } from './lib/format.js';
import { SETTINGS, VERSION, SEED_LABEL } from './lib/settings.js';
import { categoryLabel } from './lib/ghg.js';
import { loadRoadmap, saveRoadmap, undoSave } from './lib/api.js';
import { analyseDraft, newBaseRow, newMeasure, toDraftRows } from './lib/draft.js';
import WaterfallChart from './components/WaterfallChart.jsx';
import MeasuresPanel, { BTN } from './components/MeasuresPanel.jsx';
import About from './components/About.jsx';

const { baseYear, actualYear, targetYear } = SETTINGS;
const DEFAULT_TARGET_PCT = Math.round(SETTINGS.targetReduction * 100);
const [T_MIN, T_MAX] = SETTINGS.targetReductionRange.map((v) => Math.round(v * 100));
const unit = DISPLAY_UNIT;
const LOAD_ERROR = 'Roadmap data could not be loaded. Please try again later.';

const fmtWhen = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function toggleIn(list, item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function Chip({ active, onClick, children, hint }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${active ? 'border-ink bg-ink text-white' : 'border-muted/40 bg-white text-muted hover:border-ink hover:text-ink'}`}>
      {children}
      {hint && <span className={`ml-1 text-xs ${active ? 'text-white/70' : 'text-muted'}`}>· {hint}</span>}
    </button>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-2 text-left">
      <span className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-green' : 'bg-muted/40'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      <span className="text-xs font-medium uppercase tracking-label">{label}</span>
    </button>
  );
}

function Swatch({ color, label, hatch }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm" style={hatch
        ? { background: `repeating-linear-gradient(45deg, ${color} 0 3px, #fff 3px 5px)`, outline: '1px solid #E07F8F' }
        : { background: color }} />
      <span>{label}</span>
    </li>
  );
}

function Legend({ stackBy, segmentKeys, businesses }) {
  const items = [];
  if (!stackBy) {
    items.push(['base', 'Base year / Actual'], ['target', 'Target'], ['done', 'Done measures'], ['planned', 'Planned measures']);
    return (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {items.map(([k, l]) => <Swatch key={k} color={UNSTACKED[k]} label={l} />)}
        <Swatch color={UNSTACKED.gap} label="Gap" hatch />
      </ul>
    );
  }
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {segmentKeys.map((k) => {
        const p = segmentPalette(stackBy, k, businesses);
        return (
          <li key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: p.full }} title="Done" />
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: p.light }} title="Planned" />
            <span>{k}</span>
          </li>
        );
      })}
      <li className="text-muted">darker = done · lighter = planned</li>
      <Swatch color={UNSTACKED.gap} label="Gap" hatch />
    </ul>
  );
}

function Confirm({ text, yes, no, onYes, onNo }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={text} className="fixed inset-0 z-20 flex items-center justify-center bg-ink/30 p-4">
      <div className="w-full max-w-md rounded bg-white p-5">
        <p className="text-sm">{text}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={BTN.secondary} onClick={onNo} autoFocus>{no}</button>
          <button type="button" className={BTN.primary} onClick={onYes}>{yes}</button>
        </div>
      </div>
    </div>
  );
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  return hash === '#about' ? <About /> : <Roadmap />;
}

function Roadmap() {
  // Saved state from the roadmap function.
  const [load, setLoad] = useState({ status: 'loading', rows: [], canUndo: false, lastSavedAt: null });
  // Unsaved edits (null = none).
  const [draft, setDraft] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [focusKey, setFocusKey] = useState(null);

  // View state (never saved).
  const [scopes, setScopes] = useState(SCOPES);
  const [offBusinesses, setOffBusinesses] = useState([]);
  const [offCats, setOffCats] = useState([]);
  const [showScope, setShowScope] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [detailPast, setDetailPast] = useState(true);
  const [targetPct, setTargetPct] = useState(DEFAULT_TARGET_PCT);
  const targetReduction = targetPct / 100;

  const refresh = useCallback(async () => {
    const res = await loadRoadmap();
    if (res.ok && Array.isArray(res.data?.rows)) {
      setLoad({ status: 'ready', rows: res.data.rows, canUndo: !!res.data.canUndo, lastSavedAt: res.data.lastSavedAt });
      return true;
    }
    setLoad((l) => ({ ...l, status: l.status === 'ready' ? 'ready' : 'error' }));
    return false;
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const analysis = useMemo(() => (draft ? analyseDraft(draft, load.rows) : null), [draft, load.rows]);
  const dirty = !!analysis?.dirty;
  const chartRows = analysis ? analysis.previewRows : load.rows;

  const data = useMemo(() => ({ settings: SETTINGS, rows: chartRows }), [chartRows]);
  const businessesAll = useMemo(() => listBusinesses(data), [data]);
  const catsAll = useMemo(() => listScope3Categories(data), [data]);
  const hasScope3 = chartRows.some((r) => r.scope === 3);
  const panelBusinesses = useMemo(() => {
    const fromDraft = draft ? draft.rows.map((r) => r.business).filter((b) => typeof b === 'string' && b.trim()) : [];
    return [...new Set([...listBusinesses({ rows: load.rows }), ...fromDraft])];
  }, [draft, load.rows]);

  const businesses = businessesAll.filter((b) => !offBusinesses.includes(b));
  const scope3Categories = catsAll.length ? catsAll.filter((c) => !offCats.includes(c)) : null;
  const stackBy = showScope ? 'scope' : showBusiness ? 'business' : null;
  const result = useMemo(
    () => computeRoadmap(data, { scopes, businesses, scope3Categories, detailPast, stackBy, targetReduction }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, scopes, businesses.join('|'), (scope3Categories || []).join('|'), detailPast, stackBy, targetReduction],
  );
  useEffect(() => { result.warnings.forEach((w) => console.warn(`[roadmap data] ${w}`)); }, [result.warnings]);

  // Draft editing.
  const ensureDraft = (d) => d || { rows: toDraftRows(load.rows), deleted: new Set() };
  const updateRow = (key, patch) => { setMessage(null); setDraft((d) => { const x = ensureDraft(d); return { ...x, rows: x.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }; }); };
  const addRow = (make) => {
    setMessage(null);
    const row = make(panelBusinesses[0] || 'Manufacturing');
    setFocusKey(row.key);
    setDraft((d) => { const x = ensureDraft(d); return { ...x, rows: [...x.rows, row] }; });
  };
  const deleteRows = (keys) => {
    setMessage(null);
    setDraft((d) => {
      const x = ensureDraft(d);
      const deleted = new Set(x.deleted);
      const rows = x.rows.filter((r) => r.id || !keys.includes(r.key)); // unsaved new rows just vanish
      keys.forEach((k) => { if (x.rows.find((r) => r.key === k && r.id)) deleted.add(k); });
      return { rows, deleted };
    });
  };
  const discard = () => { setDraft(null); setMessage(null); };

  const save = async () => {
    if (!analysis || !analysis.dirty || !analysis.valid) return;
    setSaving(true);
    setMessage(null);
    const res = await saveRoadmap(analysis.payload);
    if (res.ok) {
      await refresh();
      setDraft(null);
      setMessage({ ok: true, text: `Saved for everyone · ${fmtTime(res.data.savedAt)}` });
    } else {
      setMessage({ ok: false, text: res.error || 'Could not save. Your changes are still here; please try again.' });
    }
    setSaving(false);
  };

  const undo = async () => {
    setConfirm(null);
    const res = await undoSave();
    await refresh();
    setMessage(res.ok ? { ok: true, text: 'Last save undone' } : { ok: false, text: res.error || 'Could not undo. Nothing was changed.' });
  };

  const togglePanel = () => {
    if (panelOpen && dirty) {
      setConfirm({ text: 'Discard your unsaved changes?', yes: 'Discard', no: 'Keep editing', onYes: () => { discard(); setPanelOpen(false); setConfirm(null); } });
      return;
    }
    if (panelOpen) setDraft(null);
    setMessage(null);
    setPanelOpen(!panelOpen);
  };

  const s = result.summary;
  const pct = (v) => (s && s.base ? fmtPct(v / s.base) : '–');
  const ready = load.status === 'ready';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <div className="font-display text-lg font-medium">The Company</div>
        <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">GHG Reduction Roadmap</h1>
        <p className="mt-1 text-sm text-muted" data-testid="subtitle">{unit} · Base year {baseYear} → Target {targetYear} ({fmtTargetPct(targetReduction)})</p>
      </header>

      <section aria-label="Filters and view options" className="mb-4 space-y-4 rounded bg-panel p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <div className="label mb-2">Scope</div>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((sc) => (
                <Chip key={sc} active={scopes.includes(sc)} onClick={() => setScopes(toggleIn(scopes, sc))}
                  hint={sc === 3 && !hasScope3 ? 'no data yet' : null}>
                  Scope {sc}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-2">Business</div>
            <div className="flex flex-wrap gap-2">
              {businessesAll.map((b) => (
                <Chip key={b} active={!offBusinesses.includes(b)} onClick={() => setOffBusinesses(toggleIn(offBusinesses, b))}>{b}</Chip>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="s3cat" className="label mb-2 block">Scope 3 category</label>
            {catsAll.length === 0 ? (
              <select id="s3cat" disabled className="rounded border border-muted/40 bg-white px-3 py-1 text-sm text-muted">
                <option>No Scope 3 data yet</option>
              </select>
            ) : (
              <select id="s3cat" multiple value={scope3Categories.map(String)}
                onChange={(e) => { const on = [...e.target.selectedOptions].map((o) => Number(o.value)); setOffCats(catsAll.filter((c) => !on.includes(c))); }}
                className="max-w-xs rounded border border-muted/40 bg-white px-3 py-1 text-sm">
                {catsAll.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            )}
          </div>
          <div className="w-full sm:w-64">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor="target" className="label">Target reduction</label>
              <output htmlFor="target" className="text-sm font-medium" data-testid="target-value">{fmtTargetPct(targetReduction)}</output>
            </div>
            <input id="target" type="range" min={T_MIN} max={T_MAX} step={1} value={targetPct}
              onChange={(e) => setTargetPct(Number(e.target.value))}
              aria-valuetext={`${fmtTargetPct(targetReduction)} vs. base year`}
              className="h-6 w-full cursor-pointer accent-ink" />
            <div className="flex justify-between text-xs text-muted"><span>0 %</span><span>−{T_MAX} %</span></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-muted/20 pt-4">
          <Switch label="Show Scope 1, 2, 3" checked={showScope} onChange={(v) => { setShowScope(v); if (v) setShowBusiness(false); }} />
          <Switch label="Show Business" checked={showBusiness} onChange={(v) => { setShowBusiness(v); if (v) setShowScope(false); }} />
          <Switch label="Show detail for past measures" checked={detailPast} onChange={setDetailPast} />
        </div>
      </section>

      <section aria-label="Chart" className="rounded bg-white p-4">
        {load.status === 'loading' ? (
          <div className="flex h-72 items-center justify-center text-muted" data-testid="chart-status">Loading roadmap…</div>
        ) : load.status === 'error' ? (
          <div className="flex h-72 items-center justify-center px-4 text-center text-muted" data-testid="chart-status">{LOAD_ERROR}</div>
        ) : result.empty ? (
          <div className="flex h-72 items-center justify-center text-muted">No data for this selection</div>
        ) : (
          <>
            {dirty && <p className="label mb-2 text-[#B3263C]" data-testid="preview-label">Preview — unsaved changes</p>}
            {result.noBase && <p className="mb-2 text-sm text-muted">No base-year emissions in this selection</p>}
            <div className="mb-3"><Legend stackBy={stackBy} segmentKeys={result.segmentKeys} businesses={businessesAll} /></div>
            <WaterfallChart result={result} stackBy={stackBy} businesses={businessesAll} unit={unit} />
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-panel pt-4 sm:grid-cols-4" data-testid="summary">
              <div>
                <dt className="label">Base {baseYear}</dt>
                <dd className="font-display text-xl">{fmt(s.base)} <span className="font-sans text-sm text-muted">kt</span></dd>
              </div>
              <div>
                <dt className="label">Actual {actualYear}</dt>
                <dd className="font-display text-xl">{fmt(s.actual)} <span className="font-sans text-sm text-muted">kt</span></dd>
                <dd className="text-sm" data-testid="pct-actual">{pct(s.reductions)} vs. base</dd>
              </div>
              <div>
                <dt className="label">Target {targetYear}</dt>
                <dd className="font-display text-xl">{fmt(s.target)} <span className="font-sans text-sm text-muted">kt</span></dd>
                <dd className="text-sm" data-testid="pct-target">{pct(s.target - s.base)} vs. base</dd>
              </div>
              <div>
                <dt className="label">{s.gap > 0 ? 'Gap' : 'Target reached'}</dt>
                <dd className="font-display text-xl">
                  {s.gap > 0 ? fmt(s.gap) : `${fmt(-s.gap)}`} <span className="font-sans text-sm text-muted">kt{s.gap > 0 ? '' : ' beyond target'}</span>
                </dd>
                <dd className="text-sm" data-testid="pct-gap">{pct(-Math.abs(s.gap))} vs. base</dd>
              </div>
            </dl>
          </>
        )}
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className={panelOpen ? BTN.secondary : BTN.primary} onClick={togglePanel} disabled={!ready} aria-expanded={panelOpen}>
          {panelOpen ? 'Close measures' : 'Adjust measures'}
        </button>
        <button type="button" className={BTN.secondary} disabled={!ready || !load.canUndo || dirty}
          onClick={() => setConfirm({
            text: `Undo the last save from ${fmtWhen(load.lastSavedAt)}? This restores every row it changed, for everyone, even if someone else made it.`,
            yes: 'Undo', no: 'Keep', onYes: undo,
          })}>
          Undo last save
        </button>
        {dirty && load.canUndo && <span className="text-xs text-muted">Save or cancel your changes first</span>}
        {!panelOpen && message && <span className={`text-sm ${message.ok ? '' : 'text-[#B3263C]'}`} data-testid="page-message">{message.text}</span>}
      </div>

      {panelOpen && ready && (
        <MeasuresPanel
          analysis={analysis || analyseDraft({ rows: toDraftRows(load.rows), deleted: new Set() }, load.rows)}
          businesses={panelBusinesses}
          updateRow={updateRow}
          addMeasure={() => addRow(newMeasure)}
          addBaseRow={() => addRow(newBaseRow)}
          deleteRows={deleteRows}
          onSave={save}
          onCancel={() => setConfirm({ text: 'Discard your unsaved changes?', yes: 'Discard', no: 'Keep editing', onYes: () => { discard(); setConfirm(null); } })}
          saving={saving}
          message={message}
          focusKey={focusKey}
        />
      )}

      <footer className="mt-6 text-xs text-muted">
        Data: live roadmap database · last saved {load.lastSavedAt ? fmtWhen(load.lastSavedAt) : SEED_LABEL} · GHG Reduction Roadmap {VERSION} ·{' '}
        <a href="#about" className="underline">About this tool</a>
      </footer>

      {confirm && <Confirm {...confirm} onNo={() => setConfirm(null)} />}
    </div>
  );
}
