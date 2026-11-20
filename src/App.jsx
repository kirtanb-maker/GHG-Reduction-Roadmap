import { useEffect, useMemo, useState } from 'react';
import data from './data/roadmap.json';
import { computeRoadmap, listBusinesses, listScope3Categories, SCOPES } from './lib/roadmap.js';
import { UNSTACKED, segmentPalette } from './lib/colors.js';
import { DISPLAY_UNIT, fmt, fmtPct } from './lib/format.js';
import WaterfallChart from './components/WaterfallChart.jsx';

const VERSION = 'v1.0';
const { baseYear, targetYear } = data.settings;
const unit = DISPLAY_UNIT;
const BUSINESSES = listBusinesses(data);
const S3_CATEGORIES = listScope3Categories(data);
const HAS_SCOPE3 = data.rows.some((r) => r.scope === 3);

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

function Legend({ stackBy, segmentKeys }) {
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
        const p = segmentPalette(stackBy, k, BUSINESSES);
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

export default function App() {
  const [scopes, setScopes] = useState(SCOPES);
  const [businesses, setBusinesses] = useState(BUSINESSES);
  const [s3cats, setS3cats] = useState(S3_CATEGORIES);
  const [showScope, setShowScope] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [detailPast, setDetailPast] = useState(true);

  const stackBy = showScope ? 'scope' : showBusiness ? 'business' : null;
  const result = useMemo(
    () => computeRoadmap(data, {
      scopes, businesses, scope3Categories: S3_CATEGORIES.length ? s3cats : null, detailPast, stackBy,
    }),
    [scopes, businesses, s3cats, detailPast, stackBy],
  );

  useEffect(() => {
    result.warnings.forEach((w) => console.warn(`[roadmap data] ${w}`));
  }, [result.warnings]);

  const s = result.summary;
  // Share of the base year; reductions negative, increases positive.
  const pct = (v) => (s && s.base ? fmtPct(v / s.base) : '–');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <div className="font-display text-lg font-medium">The Company</div>
        <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">GHG Reduction Roadmap</h1>
        <p className="mt-1 text-sm text-muted">{unit} · Base year {baseYear} → Target {targetYear}</p>
      </header>

      <section aria-label="Filters and view options" className="mb-4 space-y-4 rounded bg-panel p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <div className="label mb-2">Scope</div>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((sc) => (
                <Chip key={sc} active={scopes.includes(sc)} onClick={() => setScopes(toggleIn(scopes, sc))}
                  hint={sc === 3 && !HAS_SCOPE3 ? 'no data yet' : null}>
                  Scope {sc}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-2">Business</div>
            <div className="flex flex-wrap gap-2">
              {BUSINESSES.map((b) => (
                <Chip key={b} active={businesses.includes(b)} onClick={() => setBusinesses(toggleIn(businesses, b))}>{b}</Chip>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="s3cat" className="label mb-2 block">Scope 3 category</label>
            {S3_CATEGORIES.length === 0 ? (
              <select id="s3cat" disabled className="rounded border border-muted/40 bg-white px-3 py-1 text-sm text-muted">
                <option>No Scope 3 data yet</option>
              </select>
            ) : (
              <select id="s3cat" multiple value={s3cats} onChange={(e) => setS3cats([...e.target.selectedOptions].map((o) => o.value))}
                className="rounded border border-muted/40 bg-white px-3 py-1 text-sm">
                {S3_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-muted/20 pt-4">
          <Switch label="Show Scope 1, 2, 3" checked={showScope} onChange={(v) => { setShowScope(v); if (v) setShowBusiness(false); }} />
          <Switch label="Show Business" checked={showBusiness} onChange={(v) => { setShowBusiness(v); if (v) setShowScope(false); }} />
          <Switch label="Show detail for past measures" checked={detailPast} onChange={setDetailPast} />
        </div>
      </section>

      <section aria-label="Chart" className="rounded bg-white p-4">
        {result.empty ? (
          <div className="flex h-72 items-center justify-center text-muted">No data for this selection</div>
        ) : (
          <>
            {result.noBase && <p className="mb-2 text-sm text-muted">No base-year emissions in this selection</p>}
            <div className="mb-3"><Legend stackBy={stackBy} segmentKeys={result.segmentKeys} /></div>
            <WaterfallChart result={result} stackBy={stackBy} businesses={BUSINESSES} unit={unit} />
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-panel pt-4 sm:grid-cols-4" data-testid="summary">
              <div>
                <dt className="label">Base {baseYear}</dt>
                <dd className="font-display text-xl">{fmt(s.base)} <span className="font-sans text-sm text-muted">kt</span></dd>
              </div>
              <div>
                <dt className="label">Actual {data.settings.actualYear}</dt>
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

      <footer className="mt-6 text-xs text-muted">
        Data: GHG reduction roadmap (Excel), version as of {data.dataAsOf} · GHG Reduction Roadmap {VERSION}
      </footer>
    </div>
  );
}
