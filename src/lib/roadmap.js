// Waterfall calculation for the GHG Reduction Roadmap.
// Pure functions, no React: used by the screen and by scripts/check-data.mjs.
// Rules: docs/product-spec.md Section 9.

export const SCOPES = [1, 2, 3];

/** Distinct business units in data order. */
export function listBusinesses(data) {
  return [...new Set(data.rows.map((r) => r.business))];
}

/** Distinct Scope 3 categories (empty list while there is no Scope 3 data). */
export function listScope3Categories(data) {
  return [
    ...new Set(
      data.rows.filter((r) => r.scope === 3 && r.scope3Category).map((r) => r.scope3Category),
    ),
  ];
}

/** Years a measure is spread over (Section 9 rule 3). */
export function spreadYears(row, baseYear) {
  if (row.startYear === row.endYear) return [row.startYear];
  const first = row.startYear === baseYear ? row.startYear + 1 : row.startYear;
  const years = [];
  for (let y = first; y <= row.endYear; y++) years.push(y);
  return years;
}

function passesFilter(row, f) {
  if (!f.scopes.includes(row.scope)) return false;
  if (!f.businesses.includes(row.business)) return false;
  if (row.scope === 3 && f.scope3Categories && row.scope3Category) {
    if (!f.scope3Categories.includes(row.scope3Category)) return false;
  }
  return true;
}

function segmentKey(row, stackBy) {
  if (stackBy === 'scope') return `Scope ${row.scope}`;
  if (stackBy === 'business') return row.business;
  return 'all';
}

function addTo(obj, key, value) {
  obj[key] = (obj[key] || 0) + value;
}

const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

/**
 * Compute the waterfall.
 * @param data      parsed src/data/roadmap.json
 * @param options   { scopes: number[], businesses: string[], scope3Categories: string[]|null,
 *                    detailPast: boolean, stackBy: null | 'scope' | 'business',
 *                    targetReduction?: number (0–0.99, from the slider; default: data settings) }
 * @returns { empty, noBase, bars, segmentKeys, summary, warnings }
 */
export function computeRoadmap(data, options) {
  const { baseYear, actualYear, targetYear } = data.settings;
  const [rMin, rMax] = data.settings.targetReductionRange || [0, 0.99];
  const r = Math.min(rMax, Math.max(rMin, options.targetReduction ?? data.settings.targetReduction));
  const singleColumn = new Set(data.settings.singleColumnMeasures || []);
  const stackBy = options.stackBy || null;
  const warnings = [];

  const rows = data.rows.filter((r) => passesFilter(r, options));
  if (rows.length === 0) {
    return { empty: true, bars: [], segmentKeys: [], summary: null, warnings };
  }

  // Segment keys in a stable order.
  let segmentKeys;
  if (stackBy === 'scope') {
    segmentKeys = SCOPES.filter((s) => rows.some((r) => r.scope === s)).map((s) => `Scope ${s}`);
  } else if (stackBy === 'business') {
    segmentKeys = listBusinesses(data).filter((b) => rows.some((r) => r.business === b));
  } else {
    segmentKeys = ['all'];
  }

  // Base per segment.
  const baseSegs = {};
  for (const r of rows.filter((r) => r.type === 'base')) addTo(baseSegs, segmentKey(r, stackBy), r.value);

  // Span columns (Section 9 rule 2): one-column-list measures stay one piece per span.
  // Other multi-year measures split into yearly pieces (rule 3). Merge by status + name + year/span.
  const merged = new Map();
  for (const r of rows.filter((r) => r.type === 'measure')) {
    if (r.startYear < baseYear || r.endYear > targetYear) {
      warnings.push(`Excluded "${r.name}" (${r.startYear}-${r.endYear}): outside ${baseYear}-${targetYear}.`);
      continue;
    }
    if (r.status === 'done' && r.endYear > actualYear) {
      warnings.push(`"${r.name}" is done but dated after the actual year ${actualYear}.`);
    }
    if (r.status === 'planned' && r.startYear <= actualYear) {
      warnings.push(`"${r.name}" is planned but dated on or before the actual year ${actualYear}.`);
    }
    const years = spreadYears(r, baseYear);
    if (singleColumn.has(r.name) && years.length > 1) {
      const key = `${r.status}|${r.name}|${r.startYear}-${r.endYear}`;
      if (!merged.has(key)) {
        merged.set(key, {
          kind: r.status, name: r.name, year: null, order: r.order, segs: {}, spread: null,
          span: { start: r.startYear, end: r.endYear, years: years.length, total: 0 },
        });
      }
      const piece = merged.get(key);
      piece.order = Math.min(piece.order, r.order);
      addTo(piece.segs, segmentKey(r, stackBy), r.value);
      piece.span.total += r.value;
      continue;
    }
    const share = r.value / years.length;
    for (const year of years) {
      const key = `${r.status}|${r.name}|${year}`;
      if (!merged.has(key)) {
        merged.set(key, {
          kind: r.status,
          name: r.name,
          year,
          order: r.order,
          segs: {},
          spread: years.length > 1 ? { start: r.startYear, end: r.endYear, years: years.length, total: 0 } : null,
        });
      }
      const piece = merged.get(key);
      piece.order = Math.min(piece.order, r.order);
      addTo(piece.segs, segmentKey(r, stackBy), share);
      if (piece.spread) piece.spread.total += r.value;
    }
  }
  // Per-year pieces by year then Excel row order; span columns after them, in Excel row order.
  const bySpanLastThenYearThenOrder = (a, b) =>
    (a.span ? 1 : 0) - (b.span ? 1 : 0) || (a.year ?? 0) - (b.year ?? 0) || a.order - b.order;
  const done = [...merged.values()].filter((p) => p.kind === 'done').sort(bySpanLastThenYearThenOrder);
  const planned = [...merged.values()].filter((p) => p.kind === 'planned').sort(bySpanLastThenYearThenOrder);
  const pieceLabel = (p) => (p.span ? `${p.name} (${p.span.start}–${p.span.end})` : `${p.name} (${p.year})`);

  // Per-segment totals.
  const doneSegs = {};
  done.forEach((p) => Object.entries(p.segs).forEach(([k, v]) => addTo(doneSegs, k, v)));
  const plannedSegs = {};
  planned.forEach((p) => Object.entries(p.segs).forEach(([k, v]) => addTo(plannedSegs, k, v)));

  const seg = (fn) => Object.fromEntries(segmentKeys.map((k) => [k, fn(k)]));
  const actualSegs = seg((k) => (baseSegs[k] || 0) + (doneSegs[k] || 0));
  const afterSegs = seg((k) => actualSegs[k] + (plannedSegs[k] || 0));
  const targetSegs = seg((k) => (baseSegs[k] || 0) * (1 - r));
  const gapSegs = seg((k) => afterSegs[k] - targetSegs[k]);

  const base = sum(baseSegs);
  const actual = sum(actualSegs);
  const afterPlanned = sum(afterSegs);
  const target = sum(targetSegs);
  const gap = afterPlanned - target;

  // Build bars with running totals.
  const bars = [];
  let running = 0;
  const pushTotal = (kind, label, year, segs) => {
    const total = sum(segs);
    bars.push({ kind, label, year, total, segs, low: Math.min(0, total), high: Math.max(0, total) });
    running = total;
  };
  const pushStep = (kind, label, year, segs, extra = {}) => {
    const total = sum(segs);
    const from = running;
    const to = running + total;
    bars.push({ kind, label, year, total, segs, from, to, low: Math.min(from, to), high: Math.max(from, to), ...extra });
    running = to;
  };

  pushTotal('base', `Base year ${baseYear}`, baseYear, { ...seg((k) => baseSegs[k] || 0) });
  if (options.detailPast) {
    for (const p of done) pushStep('done', pieceLabel(p), p.year, p.segs, { name: p.name, spread: p.spread, span: p.span });
  } else if (done.length) {
    pushStep('reductions', 'Reductions', null, seg((k) => doneSegs[k] || 0), {
      count: done.length,
    });
  }
  pushTotal('actual', `Actual ${actualYear}`, actualYear, actualSegs);
  for (const p of planned) pushStep('planned', pieceLabel(p), p.year, p.segs, { name: p.name, spread: p.spread, span: p.span });

  if (gap > 0) {
    bars.push({
      kind: 'gap', label: 'Gap', year: null, total: -gap, segs: { gap: -gap }, gapSegs,
      from: afterPlanned, to: target, low: target, high: afterPlanned, reached: false,
    });
  } else {
    bars.push({
      kind: 'gap', label: 'Target reached', year: null, total: -gap, segs: { gap: 0 }, gapSegs,
      from: afterPlanned, to: afterPlanned, low: afterPlanned, high: afterPlanned, reached: true, beyond: -gap,
    });
  }
  running = target;
  pushTotal('target', `Target ${targetYear}`, targetYear, targetSegs);
  bars[bars.length - 1].targetReduction = r;

  return {
    empty: false,
    noBase: base === 0,
    bars,
    segmentKeys,
    summary: { base, reductions: sum(doneSegs), actual, planned: sum(plannedSegs), afterPlanned, target, gap, targetReduction: r },
    warnings,
  };
}
