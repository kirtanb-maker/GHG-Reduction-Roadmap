// Data checks of docs/checks.md (spec v2.0), calculation side, against the seed fixture
// src/fixtures/roadmap-seed.json — the same 18 rows the database seed migration inserts.
// D1 (fixture side), D2–D14, the calculation half of D15–D21 and D24, and the
// validation half of D23. The database and function halves are run through the
// Netlify Functions (see PROGRESS.md Check results).
// Usage: npm run check:data
import { readFileSync } from 'node:fs';
import { computeRoadmap } from '../src/lib/roadmap.js';
import { SETTINGS } from '../src/lib/settings.js';
import { validateSave, validateRow } from '../src/lib/validate.js';

const seed = JSON.parse(readFileSync(new URL('../src/fixtures/roadmap-seed.json', import.meta.url))).rows;
const json12 = JSON.parse(readFileSync(new URL('../src/data/roadmap.json', import.meta.url)));
const data = { settings: SETTINGS, rows: seed };
const ALL = { scopes: [1, 2, 3], businesses: ['Manufacturing', 'Stores'], scope3Categories: null, detailPast: true, stackBy: null };
const run = (o, rows = seed) => computeRoadmap({ settings: SETTINGS, rows }, { ...ALL, ...o });
const r0 = (n) => Math.round(n);
const results = [];
const check = (id, cond, detail) => results.push({ id, ok: !!cond, detail });
const bar = (res, label) => res.bars.find((b) => b.label === label);
const s = (res) => [res.summary.base, res.summary.actual, res.summary.afterPlanned, res.summary.target, res.summary.gap].map(r0).join('/');

// D1 (fixture side): the seed equals the v1.2 data file; one-column flag on the three span measures
const base = seed.filter((r) => r.rowType === 'base');
const meas = seed.filter((r) => r.rowType === 'measure');
const same = json12.rows.length === seed.length && json12.rows.every((o, i) => o.name === seed[i].name && o.value === seed[i].value
  && o.startYear === seed[i].startYear && o.endYear === seed[i].endYear && o.scope === seed[i].scope && o.business === seed[i].business
  && o.status === seed[i].status && o.order === seed[i].sortOrder && o.type === seed[i].rowType);
const singles = [...new Set(seed.filter((r) => r.singleColumn).map((r) => r.name))];
check('D1', same && base.length === 4 && base.reduce((a, r) => a + r.value, 0) === 120000 && meas.length === 14
  && JSON.stringify(singles) === '["Up/Downsizing","Energy Efficiency","Green Tariffs"]' && seed.filter((r) => r.singleColumn).length === 5
  && !seed.some((r) => ['Actual', 'Gap', 'Target'].includes(r.name)),
  `fixture = roadmap.json: ${same}; ${base.length} base, ${meas.length} measures; single_column on ${singles.join(', ')}`);

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
  && JSON.stringify(SETTINGS.targetReductionRange) === '[0,0.99]' && r0(lo.summary.target) === 120000 && r0(hi.summary.target) === 1200,
  `0%: target ${r0(r0p.summary.target)} beyond ${r0(g0.beyond)}; −99%: target ${r0(r99.summary.target)} gap ${r0(r99.summary.gap)}; out-of-range clamped`);

// D15–D21, D24 — calculation half: the same edits applied to the seed rows
const edit = (fn) => seed.map((r) => ({ ...r })).map((r) => fn(r) || r);
const plus = (rows) => [...seed.map((r) => ({ ...r })), ...rows];
r = run({}, edit((x) => { if (x.name === 'Heat Pump') x.value = -3200; }));
check('D15 (calc)', r0(r.summary.afterPlanned) === 72700 && r0(r.summary.gap) === 12700, s(r));
r = run({}, plus([{ rowType: 'measure', name: 'Test Measure', startYear: 2030, endYear: 2030, value: -1000, scope: 1, scope3Category: null, business: 'Manufacturing', status: 'planned', singleColumn: false, sortOrder: 23 }]));
const lb = r.bars.map((b) => b.label);
check('D16 (calc)', r0(r.summary.afterPlanned) === 72700 && r0(r.summary.gap) === 12700 && lb.indexOf('Test Measure (2030)') === lb.indexOf('Heat Pump (2029)') + 1
  && lb.indexOf('Test Measure (2030)') < lb.indexOf('Green Tariffs (2026–2030)'), `${s(r)}; ${lb.slice(8, 16).join(' | ')}`);
r = run({}, seed.filter((x) => x.name !== 'Green Tariffs'));
check('D17 (calc)', r0(r.summary.afterPlanned) === 83700 && r0(r.summary.gap) === 23700, s(r));
r = run({}, edit((x) => { if (x.name === 'Photovoltaics' && x.startYear === 2024) x.value = -1600; }));
check('D18 (calc)', r0(r.summary.actual) === 96900 && r0(r.summary.afterPlanned) === 72700 && r0(r.summary.gap) === 12700, s(r));
r = run({}, edit((x) => { if (x.rowType === 'base' && x.scope === 2 && x.business === 'Stores') x.value = 40000; }));
check('D19 (calc)', s(r) === '130000/107900/83700/65000/18700', s(r));
r = run({}, edit((x) => { if (x.name === 'Electric Boiler' && x.startYear === 2027) { x.status = 'done'; x.startYear = 2025; x.endYear = 2025; } }));
const l20 = r.bars.map((b) => b.label);
check('D20 (calc)', r0(r.summary.actual) === 93900 && r0(r.summary.afterPlanned) === 73700 && l20.includes('Electric Boiler (2025)')
  && l20.indexOf('Electric Boiler (2025)') < l20.indexOf('Up/Downsizing (2020–2025)') && !l20.includes('Electric Boiler (2027)'), `${s(r)}`);
r = run({}, edit((x) => { if (x.name === 'Green Tariffs') x.singleColumn = false; }));
const gt = r.bars.filter((b) => /^Green Tariffs \(\d{4}\)$/.test(b.label));
check('D21 (calc)', gt.length === 5 && gt.every((b) => r0(b.total) === -2000) && gt.map((b) => b.year).join() === '2026,2027,2028,2029,2030' && r0(r.summary.gap) === 13700,
  gt.map((b) => `${b.label} ${r0(b.total)}`).join(', '));
const s3 = { rowType: 'measure', name: 'Supplier engagement', startYear: 2028, endYear: 2028, value: -500, scope: 3, scope3Category: 1, business: 'Manufacturing', status: 'planned', singleColumn: false, sortOrder: 23 };
r = run({}, plus([s3]));
const r3 = run({ scopes: [3], scope3Categories: [1] }, plus([s3]));
check('D24 (calc)', r0(r.summary.afterPlanned) === 73200 && r0(r.summary.gap) === 13200 && !r3.empty && r3.noBase, `${s(r)}; Scope 3 only: noBase=${r3.noBase}`);

// D23 — validation half: every refusal from the spec, as validateSave sees it
const okRow = { rowType: 'measure', name: 'X', startYear: 2028, endYear: 2028, value: -1, scope: 1, scope3Category: null, business: 'Manufacturing', status: 'planned', singleColumn: false };
const ID = '00000000-0000-4000-8000-000000000001';
const refusals = {
  '201 rows': { inserts: Array.from({ length: 201 }, () => okRow) },
  'planned 2031': { inserts: [{ ...okRow, startYear: 2031, endYear: 2031 }] },
  'done 2026': { inserts: [{ ...okRow, status: 'done', startYear: 2026, endYear: 2026 }] },
  'scope 3 without category': { inserts: [{ ...okRow, scope: 3 }] },
  'scope 1 with category': { inserts: [{ ...okRow, scope3Category: 4 }] },
  'empty name': { inserts: [{ ...okRow, name: '  ' }] },
  'value 0': { inserts: [{ ...okRow, value: 0 }] },
  'value "abc"': { inserts: [{ ...okRow, value: 'abc' }] },
  'base value −1': { inserts: [{ ...okRow, rowType: 'base', name: null, status: null, startYear: 2020, endYear: 2020, value: -1 }] },
  'unknown field': { inserts: [{ ...okRow, colour: 'red' }] },
  'unknown top-level field': { inserts: [okRow], extra: 1 },
  'bad id': { deletes: ['not-an-id'] },
  'sort_order from request': { updates: [{ ...okRow, id: ID, sortOrder: 1 }] },
  'no changes': {},
};
const notRefused = Object.entries(refusals).filter(([, b]) => validateSave(b).ok).map(([k]) => k);
const accepted = validateSave({ inserts: [okRow], updates: [{ ...okRow, id: ID }], deletes: [] }).ok
  && Object.keys(validateRow({ ...okRow, value: '−1,5' }, { lenient: true }).errors).length === 0;
check('D23 (validation)', notRefused.length === 0 && accepted, notRefused.length ? `not refused: ${notRefused.join(', ')}` : `${Object.keys(refusals).length} refusals refused; valid rows accepted`);

for (const x of results) console.log(`${x.ok ? 'PASS' : 'FAIL'} ${x.id} — ${x.detail}`);
process.exit(results.every((x) => x.ok) ? 0 : 1);
