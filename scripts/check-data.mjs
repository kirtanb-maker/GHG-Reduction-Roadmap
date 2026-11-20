// Runs the data checks D1–D14 of docs/checks.md against src/data/roadmap.json (spec v1.2).
// Usage: npm run check:data
import { readFileSync } from 'node:fs';
import { computeRoadmap } from '../src/lib/roadmap.js';

const data = JSON.parse(readFileSync(new URL('../src/data/roadmap.json', import.meta.url)));
const ALL = { scopes: [1, 2, 3], businesses: ['Manufacturing', 'Stores'], scope3Categories: null, detailPast: true, stackBy: null };
const run = (o) => computeRoadmap(data, { ...ALL, ...o });
const r0 = (n) => Math.round(n);
const results = [];
const check = (id, cond, detail) => results.push({ id, ok: !!cond, detail });
const bar = (res, label) => res.bars.find((b) => b.label === label);
const s = (res) => [res.summary.base, res.summary.actual, res.summary.afterPlanned, res.summary.target, res.summary.gap].map(r0).join('/');

// D1 (data file side; the Excel comparison is done by scripts/convert_excel.py + a field-by-field read)
const base = data.rows.filter((r) => r.type === 'base');
const meas = data.rows.filter((r) => r.type === 'measure');
const eac22 = meas.find((r) => r.name === 'Energy Attribute Certificates' && r.startYear === 2022);
const s2m = base.find((r) => r.scope === 2 && r.business === 'Manufacturing');
check('D1', base.length === 4 && base.reduce((a, r) => a + r.value, 0) === 120000 && s2m.value === 20000 && meas.length === 14
  && !data.rows.some((r) => r.name === 'Efficiency measures') && meas.filter((r) => r.name === 'Energy Efficiency').length === 2
  && eac22.value === -9000 && !data.rows.some((r) => ['Actual', 'Gap', 'Target'].includes(r.name))
  && data.settings.targetReduction === 0.5 && JSON.stringify(data.settings.singleColumnMeasures) === '["Up/Downsizing","Energy Efficiency","Green Tariffs"]',
  `${base.length} base (${base.reduce((a, r) => a + r.value, 0)}), ${meas.length} measures, EAC 2022 ${eac22.value}, settings ${JSON.stringify(data.settings)}`);

// D2
let r = run({});
check('D2', s(r) === '120000/97900/73700/60000/13700', s(r));
// D3
const expected = ['Base year 2020', 'CHP shutdown (2021)', 'Energy Attribute Certificates (2022)', 'Electric Boiler (2023)', 'Photovoltaics (2024)',
  'Up/Downsizing (2020–2025)', 'Energy Efficiency (2020–2025)', 'Actual 2025', 'Electric Boiler (2027)', 'Energy Attribute Certificates (2028)',
  'Photovoltaics (2029)', 'Electrification Furnace (2029)', 'Heat Pump (2029)', 'Green Tariffs (2026–2030)', 'Energy Efficiency (2026–2030)', 'Gap', 'Target 2030'];
const labels = r.bars.map((b) => b.label);
check('D3', JSON.stringify(labels) === JSON.stringify(expected), `${labels.length} bars: ${labels.join(' | ')}`);
// D4
const v = (l) => r0(bar(r, l)?.total ?? NaN);
check('D4', v('Up/Downsizing (2020–2025)') === -7000 && v('Energy Efficiency (2020–2025)') === -3000 && v('Energy Efficiency (2026–2030)') === -1000
  && v('Green Tariffs (2026–2030)') === -10000
  && !r.bars.some((b) => /^(Up\/Downsizing|Energy Efficiency|Green Tariffs) \(\d{4}\)$/.test(b.label))
  && !r.bars.some((b) => (b.kind === 'done' || b.kind === 'planned') && b.year === 2020),
  ['Up/Downsizing (2020–2025)', 'Energy Efficiency (2020–2025)', 'Green Tariffs (2026–2030)', 'Energy Efficiency (2026–2030)'].map(v).join(', '));
// D5
r = run({ detailPast: false });
const red = bar(r, 'Reductions');
const iRed = r.bars.indexOf(red);
check('D5', r.bars.length === 12 && red && r0(red.total) === -22100 && r.bars[iRed - 1].kind === 'base' && r.bars[iRed + 1].kind === 'actual'
  && r0(r.summary.actual) === 97900 && bar(r, 'Energy Efficiency (2026–2030)') && bar(r, 'Green Tariffs (2026–2030)') && r.bars.filter((b) => b.kind === 'planned').length === 7,
  `${r.bars.length} bars, Reductions ${red && r0(red.total)}`);
// D6–D8
r = run({ scopes: [1] }); check('D6', s(r) === '70000/56900/47700/35000/12700', s(r));
r = run({ scopes: [2] }); check('D7', s(r) === '50000/41000/26000/25000/1000' && !r.bars.find((b) => b.kind === 'gap').reached, s(r));
r = run({ businesses: ['Stores'] }); check('D8', s(r) === '35000/34000/19000/17500/1500', s(r));
// D9
check('D9', run({ scopes: [3] }).empty && run({ scopes: [] }).empty, 'Scope 3 only and no scope: empty');
// D10
r = run({ stackBy: 'business' });
const b10 = bar(r, 'Base year 2020'); const a10 = bar(r, 'Actual 2025');
const segsSum = (res) => res.bars.filter((b) => b.kind !== 'gap').every((b) => Math.abs(Object.values(b.segs).reduce((x, y) => x + y, 0) - b.total) < 1e-6);
check('D10', b10.segs.Manufacturing === 85000 && b10.segs.Stores === 35000 && r0(a10.segs.Manufacturing) === 63900 && r0(a10.segs.Stores) === 34000 && segsSum(r),
  `base ${JSON.stringify(b10.segs)} actual ${JSON.stringify(a10.segs)} segsSum=${segsSum(r)}`);
// D11
r = run({ stackBy: 'scope' });
const a11 = bar(r, 'Actual 2025'); const g11 = r.bars.find((b) => b.kind === 'gap');
check('D11', r0(a11.segs['Scope 1']) === 56900 && r0(a11.segs['Scope 2']) === 41000 && Object.keys(g11.segs).length === 1 && r0(-g11.total) === 13700
  && r0(g11.gapSegs['Scope 1']) === 12700 && r0(g11.gapSegs['Scope 2']) === 1000 && segsSum(r),
  `actual ${JSON.stringify(a11.segs)} gap ${r0(-g11.total)} gapSegs ${JSON.stringify(g11.gapSegs)}`);
// D12
r = run({ targetReduction: 0.3 });
let g = r.bars.find((b) => b.kind === 'gap');
check('D12', r0(r.summary.target) === 84000 && g.reached && g.label === 'Target reached' && r0(g.beyond) === 10300 && r0(bar(r, 'Target 2030').total) === 84000,
  `target ${r0(r.summary.target)} reached=${g.reached} beyond ${r0(g.beyond)}`);
// D13
r = run({ targetReduction: 0.4, stackBy: 'scope' });
g = r.bars.find((b) => b.kind === 'gap'); const t13 = bar(r, 'Target 2030');
check('D13', r0(t13.total) === 72000 && r0(t13.segs['Scope 1']) === 42000 && r0(t13.segs['Scope 2']) === 30000 && r0(-g.total) === 1700
  && r0(g.gapSegs['Scope 1']) === 5700 && r0(g.gapSegs['Scope 2']) === -4000 && segsSum(r),
  `target ${JSON.stringify(t13.segs)} gap ${r0(-g.total)} gapSegs ${JSON.stringify(g.gapSegs)}`);
// D14
const r0p = run({ targetReduction: 0 }); const r99 = run({ targetReduction: 0.99 });
const g0 = r0p.bars.find((b) => b.kind === 'gap');
const lo = run({ targetReduction: -0.2 }); const hi = run({ targetReduction: 1.5 });
check('D14', r0(r0p.summary.target) === 120000 && g0.reached && r0(g0.beyond) === 46300 && r0(r99.summary.target) === 1200 && r0(r99.summary.gap) === 72500
  && JSON.stringify(data.settings.targetReductionRange) === '[0,0.99]' && r0(lo.summary.target) === 120000 && r0(hi.summary.target) === 1200,
  `0%: target ${r0(r0p.summary.target)} beyond ${r0(g0.beyond)}; −99%: target ${r0(r99.summary.target)} gap ${r0(r99.summary.gap)}; out-of-range clamped`);

for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'} ${x.id} — ${x.detail}`);
process.exit(results.every((x) => x.ok) ? 0 : 1);
