// "Adjust measures" panel — spec v2.0 Section 8. Every visible row in three groups;
// edits stay in the draft (and the chart preview) until Save.
import { useState } from 'react';
import { SCOPE3_CATEGORIES } from '../lib/ghg.js';
import { yearRange } from '../lib/validate.js';

const NEW_BUSINESS = '__new__';
const input = 'w-full rounded border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ink';
const border = (bad) => (bad ? 'border-[#D9485F]' : 'border-muted/40');

function Field({ error, children }) {
  return (
    <div>
      {children}
      {error && <div className="mt-0.5 text-xs leading-tight text-[#B3263C]" role="alert">{error}</div>}
    </div>
  );
}

function YearSelect({ value, range, onChange, bad, label }) {
  const opts = [];
  for (let y = range[0]; y <= range[1]; y++) opts.push(y);
  if (Number.isInteger(value) && !opts.includes(value)) opts.unshift(value); // shown, flagged
  return (
    <select aria-label={label} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} className={`${input} ${border(bad)}`}>
      {opts.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );
}

function BusinessField({ row, businesses, onChange, error }) {
  const known = businesses.includes(row.business);
  const [typing, setTyping] = useState(!known && row.business !== '');
  if (typing || (!known && row.business)) {
    return (
      <Field error={error}>
        <input aria-label="Business" value={row.business} maxLength={40} placeholder="New business"
          onChange={(e) => onChange(e.target.value)} className={`${input} ${border(error)}`} autoFocus={typing && !row.business} />
        <button type="button" className="mt-0.5 text-xs text-muted underline" onClick={() => { setTyping(false); onChange(businesses[0] || ''); }}>
          choose from list
        </button>
      </Field>
    );
  }
  return (
    <Field error={error}>
      <select aria-label="Business" value={row.business}
        onChange={(e) => { if (e.target.value === NEW_BUSINESS) { setTyping(true); onChange(''); } else onChange(e.target.value); }}
        className={`${input} ${border(error)}`}>
        {businesses.map((b) => <option key={b} value={b}>{b}</option>)}
        <option value={NEW_BUSINESS}>New business…</option>
      </select>
    </Field>
  );
}

function Marker({ isNew, changed }) {
  if (!isNew && !changed) return null;
  return (
    <span className={`ml-1 rounded px-1 text-[10px] font-medium uppercase tracking-label ${isNew ? 'bg-blue-soft text-ink' : 'bg-panel text-ink'}`}>
      {isNew ? 'new' : 'changed'}
    </span>
  );
}

function ScopeCells({ row, errors, update }) {
  return (
    <>
      <td className="min-w-[104px] p-1 align-top">
        <Field error={errors.scope}>
          <select aria-label="Scope" value={row.scope}
            onChange={(e) => { const scope = Number(e.target.value); update({ scope, scope3Category: scope === 3 ? row.scope3Category : null }); }}
            className={`${input} ${border(errors.scope)}`}>
            {[1, 2, 3].map((s) => <option key={s} value={s}>Scope {s}</option>)}
          </select>
        </Field>
      </td>
      <td className="w-[220px] min-w-[180px] max-w-[260px] p-1 align-top">
        <Field error={errors.scope3Category}>
          <select aria-label="Scope 3 category" value={row.scope3Category ?? ''} disabled={row.scope !== 3}
            onChange={(e) => update({ scope3Category: e.target.value === '' ? null : Number(e.target.value) })}
            className={`${input} ${border(errors.scope3Category)} disabled:bg-page disabled:text-muted`}>
            <option value="">{row.scope === 3 ? 'Choose…' : '—'}</option>
            {SCOPE3_CATEGORIES.map(([n, l]) => <option key={n} value={n}>{n} {l}</option>)}
          </select>
        </Field>
      </td>
    </>
  );
}

function ValueCell({ row, errors, update }) {
  return (
    <td className="min-w-[110px] p-1 align-top">
      <Field error={errors.value}>
        <input aria-label="Emissions, t CO2" inputMode="decimal" value={row.value} onChange={(e) => update({ value: e.target.value })}
          className={`${input} ${border(errors.value)} text-right tabular-nums`} />
      </Field>
    </td>
  );
}

function Tick({ row, selected, toggle }) {
  const label = row.rowType === 'base' ? `Select base row Scope ${row.scope} ${row.business}` : `Select ${row.name || 'new measure'}`;
  return (
    <td className="p-1 pt-2 align-top">
      <input type="checkbox" aria-label={label} checked={selected.has(row.key)} onChange={() => toggle(row.key)} className="h-4 w-4 accent-ink" />
    </td>
  );
}

const TH = ({ children, className = '' }) => <th className={`label whitespace-nowrap p-1 text-left font-medium ${className}`}>{children}</th>;

function BaseTable({ rows, ctx }) {
  return (
    <table className="w-full min-w-[640px] border-collapse">
      <thead><tr><TH className="w-8" /><TH>Scope</TH><TH>Scope 3 category</TH><TH>Business</TH><TH className="text-right">t CO2</TH></tr></thead>
      <tbody>
        {rows.map((row) => {
          const errors = ctx.errors[row.key] || {};
          const update = (patch) => ctx.updateRow(row.key, patch);
          return (
            <tr key={row.key} className="border-t border-panel" data-testid="base-row">
              <Tick row={row} selected={ctx.selected} toggle={ctx.toggle} />
              <ScopeCells row={row} errors={errors} update={update} />
              <td className="p-1 align-top">
                <BusinessField row={row} businesses={ctx.businesses} onChange={(business) => update({ business })} error={errors.business} />
              </td>
              <ValueCell row={row} errors={errors} update={update} />
              <td className="min-w-[72px] whitespace-nowrap p-1 pt-2 align-top"><Marker isNew={!row.id} changed={ctx.changedKeys.has(row.key)} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MeasureTable({ rows, ctx, testid }) {
  return (
    <table className="w-full min-w-[1240px] border-collapse">
      <thead>
        <tr>
          <TH className="w-8" /><TH>Name</TH><TH>Done / planned</TH><TH>Scope</TH><TH>Scope 3 category</TH><TH>Business</TH>
          <TH>Start year</TH><TH>End year</TH><TH>One column</TH><TH className="text-right">t CO2</TH><TH />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const errors = ctx.errors[row.key] || {};
          const update = (patch) => ctx.updateRow(row.key, patch);
          const range = yearRange('measure', row.status);
          return (
            <tr key={row.key} className="border-t border-panel" data-testid={testid}>
              <Tick row={row} selected={ctx.selected} toggle={ctx.toggle} />
              <td className="min-w-[200px] p-1 align-top">
                <Field error={errors.name}>
                  <input aria-label="Name" value={row.name ?? ''} maxLength={60} onChange={(e) => update({ name: e.target.value })}
                    autoFocus={ctx.focusKey === row.key} className={`${input} ${border(errors.name)}`} />
                </Field>
              </td>
              <td className="min-w-[112px] p-1 align-top">
                <Field error={errors.status}>
                  <select aria-label="Done or planned" value={row.status} onChange={(e) => update({ status: e.target.value })}
                    className={`${input} ${border(errors.status)}`}>
                    <option value="done">Done</option>
                    <option value="planned">Planned</option>
                  </select>
                </Field>
              </td>
              <ScopeCells row={row} errors={errors} update={update} />
              <td className="min-w-[140px] p-1 align-top">
                <BusinessField row={row} businesses={ctx.businesses} onChange={(business) => update({ business })} error={errors.business} />
              </td>
              <td className="min-w-[88px] p-1 align-top">
                <YearSelect label="Start year" value={row.startYear} range={range} bad={!!errors.years}
                  onChange={(startYear) => update({ startYear, endYear: Math.max(startYear, row.endYear ?? startYear) })} />
              </td>
              <td className="min-w-[88px] p-1 align-top">
                <Field error={errors.years}>
                  <YearSelect label="End year" value={row.endYear} range={range} bad={!!errors.years} onChange={(endYear) => update({ endYear })} />
                </Field>
              </td>
              <td className="p-1 pt-2 text-center align-top">
                <input type="checkbox" aria-label="One column" checked={!!row.singleColumn && row.startYear !== row.endYear}
                  disabled={row.startYear === row.endYear} onChange={(e) => update({ singleColumn: e.target.checked })} className="h-4 w-4 accent-ink" />
              </td>
              <ValueCell row={row} errors={errors} update={update} />
              <td className="min-w-[72px] whitespace-nowrap p-1 pt-2 align-top"><Marker isNew={!row.id} changed={ctx.changedKeys.has(row.key)} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Group({ title, count, children, action }) {
  return (
    <div className="mt-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="label text-ink">{title} <span className="text-muted">· {count}</span></h3>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const btn = 'rounded border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';
export const BTN = {
  primary: `${btn} border-ink bg-ink text-white hover:bg-ink/80`,
  secondary: `${btn} border-muted/50 bg-white text-ink hover:border-ink`,
  danger: `${btn} border-[#D9485F] bg-white text-[#B3263C] hover:bg-pink-soft`,
};

export default function MeasuresPanel({ analysis, businesses, updateRow, addMeasure, addBaseRow, deleteRows, onSave, onCancel, saving, message, focusKey }) {
  const [selected, setSelected] = useState(new Set());
  const toggle = (key) => setSelected((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const visibleSelected = [...selected].filter((k) => analysis.rows.some((r) => r.key === k));
  const ctx = { errors: analysis.errors, changedKeys: analysis.changedKeys, businesses, updateRow, selected, toggle, focusKey };
  const base = analysis.rows.filter((r) => r.rowType === 'base');
  const done = analysis.rows.filter((r) => r.rowType === 'measure' && r.status === 'done');
  const planned = analysis.rows.filter((r) => r.rowType === 'measure' && r.status !== 'done');
  const errorCount = Object.keys(analysis.errors).length;

  return (
    <section aria-label="Adjust measures" className="mt-4 rounded bg-white p-4" data-testid="measures-panel">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={BTN.secondary} onClick={addMeasure}>New Measure</button>
        <button type="button" className={BTN.danger} disabled={visibleSelected.length === 0}
          onClick={() => { deleteRows(visibleSelected); setSelected(new Set()); }}>
          Delete{visibleSelected.length ? ` (${visibleSelected.length})` : ''}
        </button>
        <span className="mx-1 hidden h-6 w-px bg-panel sm:inline-block" />
        <button type="button" className={BTN.primary} disabled={!analysis.dirty || !analysis.valid || saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className={BTN.secondary} disabled={!analysis.dirty || saving} onClick={onCancel}>Cancel</button>
        <div className="ml-auto text-sm" aria-live="polite">
          {analysis.deleteCount > 0 && <span className="mr-3 text-[#B3263C]" data-testid="delete-count">{analysis.deleteCount} {analysis.deleteCount === 1 ? 'row' : 'rows'} to delete</span>}
          {errorCount > 0 && <span className="mr-3 text-[#B3263C]">{errorCount} {errorCount === 1 ? 'line needs' : 'lines need'} fixing</span>}
          {message && <span className={message.ok ? 'text-ink' : 'text-[#B3263C]'} data-testid="panel-message">{message.text}</span>}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">Emissions in t CO2; reductions negative. Changes show in the chart at once and are stored for everyone only when you click Save.</p>

      <Group title="Base year 2020" count={base.length}
        action={<button type="button" className="text-sm underline" onClick={addBaseRow}>New base row</button>}>
        <BaseTable rows={base} ctx={ctx} />
      </Group>
      <Group title="Done measures" count={done.length}>
        <MeasureTable rows={done} ctx={ctx} testid="done-row" />
      </Group>
      <Group title="Planned measures" count={planned.length}>
        <MeasureTable rows={planned} ctx={ctx} testid="planned-row" />
      </Group>
    </section>
  );
}
