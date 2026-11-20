// Runs the data checks D2–D11 of docs/checks.md against src/data/roadmap.json.
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

// D2
let r = run({});
check('D2', r.summary.base === 110000 && r0(r.summary.actual) === 85900 && r0(r.summary.afterPlanned) === 61700 && r.summary.target === 55000 && r0(r.summary.gap) === 6700,
  JSON.stringify(r.summary));
// D3
const kinds = (res, k) => res.bars.filter((b) => b.kind === k).length;
check('D3', r.bars.length === 33 && kinds(r, 'done') === 14 && kinds(r, 'planned') === 15, `${r.bars.length} bars, ${kinds(r, 'done')} done, ${kinds(r, 'planned')} planned`);
// D4
const v = (l) => r0(bar(r, l)?.total ?? NaN);
check('D4', v('Up/Downsizing (2021)') === -1400 && v('Efficiency measures (2021)') === -600 && v('Green Tariffs (2026)') === -2000 && v('Energy Efficiency (2026)') === -200 && !r.bars.some((b) => (b.kind === 'done' || b.kind === 'planned') && b.year === 2020),
  ['Up/Downsizing (2021)', 'Efficiency measures (2021)', 'Green Tariffs (2026)', 'Energy Efficiency (2026)'].map(v).join(', '));
// D5
r = run({ detailPast: false });
const red = bar(r, 'Reductions');
const iRed = r.bars.indexOf(red);
check('D5', r.bars.length === 20 && red && r0(red.total) === -24100 && r.bars[iRed - 1].kind === 'base' && r.bars[iRed + 1].kind === 'actual' && r0(r.summary.actual) === 85900,
  `${r.bars.length} bars, Reductions ${red && r0(red.total)}`);
// D6
const s = (res) => [res.summary.base, res.summary.actual, res.summary.afterPlanned, res.summary.target, res.summary.gap].map(r0).join('/');
r = run({ scopes: [1] });
check('D6', s(r) === '70000/56900/47700/35000/12700', s(r));
// D7
r = run({ scopes: [2] });
const g7 = r.bars.find((b) => b.kind === 'gap');
check('D7', s(r) === '40000/29000/14000/20000/-6000' && g7.reached && g7.label === 'Target reached' && r0(g7.beyond) === 6000, `${s(r)} reached=${g7.reached}`);
// D8
r = run({ businesses: ['Stores'] });
check('D8', s(r) === '35000/34000/19000/17500/1500', s(r));
// D9
check('D9', run({ scopes: [3] }).empty && run({ scopes: [] }).empty, 'Scope 3 only and no scope: empty');
// D10
r = run({ stackBy: 'business' });
const b10 = bar(r, 'Base year 2020'); const a10 = bar(r, 'Actual 2025');
const segsSum = r.bars.filter((b) => b.kind !== 'gap').every((b) => Math.abs(Object.values(b.segs).reduce((x, y) => x + y, 0) - b.total) < 1e-6);
check('D10', b10.segs.Manufacturing === 75000 && b10.segs.Stores === 35000 && r0(a10.segs.Manufacturing) === 51900 && r0(a10.segs.Stores) === 34000 && segsSum,
  `base ${JSON.stringify(b10.segs)} actual ${JSON.stringify(a10.segs)} segsSum=${segsSum}`);
// D11
r = run({ stackBy: 'scope' });
const a11 = bar(r, 'Actual 2025'); const g11 = r.bars.find((b) => b.kind === 'gap');
check('D11', r0(a11.segs['Scope 1']) === 56900 && r0(a11.segs['Scope 2']) === 29000 && Object.keys(g11.segs).length === 1 && r0(-g11.total) === 6700 && r0(g11.gapSegs['Scope 1']) === 12700 && r0(g11.gapSegs['Scope 2']) === -6000,
  `actual ${JSON.stringify(a11.segs)} gap ${r0(-g11.total)} gapSegs ${JSON.stringify(g11.gapSegs)}`);

for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'} ${x.id} — ${x.detail}`);
process.exit(results.every((x) => x.ok) ? 0 : 1);
