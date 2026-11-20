import { useEffect, useRef, useState } from 'react';
import { fillFor } from '../lib/colors.js';
import { fmt, fmtAxis, fmtStep } from '../lib/format.js';

const SLOT = 32; // minimum px per bar; below that the chart scrolls inside its frame
const M = { top: 34, right: 8, bottom: 196, left: 58 };
const HEIGHT = 548;

// Axis: 5–6 ticks with a "nice" step (1, 2, 2.5, 5 × 10^n).
function niceStep(v) {
  if (v <= 0) return 1;
  const raw = v / 5;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

const isStep = (b) => b.kind === 'done' || b.kind === 'planned' || b.kind === 'reductions';

export default function WaterfallChart({ result, stackBy, businesses, unit }) {
  const wrapRef = useRef(null);
  const [wrapWidth, setWrapWidth] = useState(800);
  const [hover, setHover] = useState(null); // { i, x, y }

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWrapWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { bars, segmentKeys } = result;
  const width = Math.max(wrapWidth, M.left + M.right + bars.length * SLOT);
  const plotW = width - M.left - M.right;
  const slot = plotW / bars.length;
  const barW = Math.min(34, slot * 0.72);
  const plotH = HEIGHT - M.top - M.bottom;
  const dataMax = Math.max(...bars.map((b) => b.high)) * 1.04;
  const step = niceStep(dataMax);
  const yMax = Math.ceil(dataMax / step) * step;
  const y = (v) => M.top + plotH - (v / yMax) * plotH;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => step * i);
  const cx = (i) => M.left + slot * i + slot / 2;

  // Year groups for the band under the labels.
  const groups = [];
  bars.forEach((b, i) => {
    const last = groups[groups.length - 1];
    if (b.year != null && isStep(b) && last && last.year === b.year && last.end === i - 1) last.end = i;
    else if (b.year != null && isStep(b)) groups.push({ year: b.year, start: i, end: i });
  });

  const hovered = hover != null ? bars[hover.i] : null;

  return (
    <div ref={wrapRef} className="relative w-full">
      {width > wrapWidth + 1 && (
        <p className="mb-1 text-xs text-muted">Scroll sideways to see the whole roadmap →</p>
      )}
      <div className="overflow-x-auto" data-testid="chart-scroll">
        <svg width={width} height={HEIGHT} role="img" aria-label="GHG reduction waterfall chart" style={{ display: 'block' }}>
          <defs>
            <pattern id="gap-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#F8AAB6" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#FFFFFF" strokeWidth="2" />
            </pattern>
          </defs>

          {/* Grid and y-axis */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="#E6E3D8" strokeWidth="1" />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#8C8985">
                {fmtAxis(t)}
              </text>
            </g>
          ))}
          <text x={14} y={M.top + plotH / 2} transform={`rotate(-90 14 ${M.top + plotH / 2})`} textAnchor="middle" fontSize="11" fill="#8C8985" letterSpacing="0.08em">
            {unit.toUpperCase()}
          </text>

          {/* Connectors: running total from each bar to the next */}
          {bars.slice(0, -1).map((b, i) => {
            const level = b.kind === 'gap' ? (b.reached ? b.from : b.to) : b.to ?? b.total;
            return (
              <line key={`c${i}`} x1={cx(i) + barW / 2} x2={cx(i + 1) - barW / 2} y1={y(level)} y2={y(level)} stroke="#8C8985" strokeDasharray="2 2" strokeWidth="1" />
            );
          })}

          {/* Bars */}
          {bars.map((b, i) => {
            const x = cx(i) - barW / 2;
            if (b.kind === 'gap') {
              if (b.reached) {
                return (
                  <g key={i} data-kind="gap-reached">
                    <line x1={x - 4} x2={x + barW + 4} y1={y(b.from)} y2={y(b.from)} stroke="#000" strokeWidth="2" />
                    <text x={cx(i)} y={y(b.from) - 8} textAnchor="middle" fontSize="10" fontWeight="600" fill="#000">✓</text>
                  </g>
                );
              }
              return <rect key={i} data-kind="gap" x={x} y={y(b.high)} width={barW} height={Math.max(1, y(b.low) - y(b.high))} fill="url(#gap-hatch)" stroke="#E07F8F" strokeWidth="1" />;
            }
            let level = b.low;
            const keys = stackBy ? segmentKeys : ['all'];
            return (
              <g key={i} data-kind={b.kind}>
                {keys.map((k) => {
                  const v = Math.abs(b.segs[k] || 0);
                  if (!v) return null;
                  const top = y(level + v);
                  const h = Math.max(0.5, y(level) - top);
                  level += v;
                  return <rect key={k} x={x} y={top} width={barW} height={h} fill={fillFor(b, k, stackBy, businesses)} />;
                })}
              </g>
            );
          })}

          {/* Value labels */}
          {bars.map((b, i) => (
            <text key={`v${i}`} x={cx(i)} y={y(b.high) - 6} textAnchor="middle" fontSize={slot < 40 ? 9 : 10} fill="#000" fontWeight={isStep(b) ? 400 : 600}>
              {b.kind === 'gap' ? (b.reached ? '' : fmt(-b.total)) : isStep(b) ? fmtStep(b.total) : fmt(b.total)}
            </text>
          ))}

          {/* X labels (rotated) */}
          {bars.map((b, i) => (
            <text key={`l${i}`} transform={`translate(${cx(i) + 3}, ${M.top + plotH + 10}) rotate(-50)`} textAnchor="end" fontSize={slot < 40 ? 10 : 11} fill="#000" fontWeight={isStep(b) ? 400 : 600}>
              {b.kind === 'gap' && b.reached ? 'Target reached' : b.label}
            </text>
          ))}

          {/* Year band */}
          {groups.map((g) => {
            const x1 = cx(g.start) - slot / 2 + 3;
            const x2 = cx(g.end) + slot / 2 - 3;
            const yy = HEIGHT - 22;
            return (
              <g key={`${g.year}-${g.start}`}>
                <line x1={x1} x2={x2} y1={yy} y2={yy} stroke="#8C8985" strokeWidth="1" />
                <text x={(x1 + x2) / 2} y={yy + 14} textAnchor="middle" fontSize="11" fill="#8C8985">{g.year}</text>
              </g>
            );
          })}

          {/* Hit areas for tooltips */}
          {bars.map((b, i) => (
            <rect
              key={`h${i}`}
              data-testid={`bar-${i}`}
              aria-label={b.label}
              x={cx(i) - slot / 2}
              y={M.top}
              width={slot}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover({ i })}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover((h) => (h && h.i === i ? null : { i }))}
            />
          ))}
        </svg>
      </div>

      {hovered && (
        <Tooltip bar={hovered} stackBy={stackBy} segmentKeys={segmentKeys} unit={unit}
          left={Math.min(Math.max(cx(hover.i) - (wrapRef.current?.querySelector('[data-testid=chart-scroll]')?.scrollLeft || 0), 110), wrapWidth - 110)}
          top={Math.max(8, y(hovered.high) - 12)} />
      )}
    </div>
  );
}

function Tooltip({ bar, stackBy, segmentKeys, unit, left, top }) {
  const status = bar.kind === 'done' || bar.kind === 'reductions' ? 'Done' : bar.kind === 'planned' ? 'Planned' : null;
  let title = bar.label;
  let value = isStep(bar) ? fmtStep(bar.total) : fmt(bar.total);
  if (bar.kind === 'gap') {
    title = bar.reached ? 'Target reached' : 'Gap';
    value = bar.reached ? `${fmt(bar.beyond)} beyond target` : fmt(-bar.total);
  }
  const segRows = bar.kind === 'gap'
    ? (stackBy ? segmentKeys.map((k) => [k, bar.gapSegs[k]]) : [])
    : stackBy ? segmentKeys.filter((k) => bar.segs[k]).map((k) => [k, bar.segs[k]]) : [];

  return (
    <div role="tooltip" className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded border border-panel bg-white p-3 text-sm shadow-sm" style={{ left, top }}>
      <div className="font-medium">{title}</div>
      {bar.year != null && isStep(bar) && <div className="text-xs text-muted">Year {bar.year}</div>}
      <div className="mt-1">{value} {unit}</div>
      {status && <div className="text-xs text-muted">{status}{bar.kind === 'reductions' ? ` · ${bar.count} yearly measure steps combined` : ''}</div>}
      {bar.spread && (
        <div className="mt-1 text-xs text-muted">
          Part of {bar.name} {bar.spread.start}–{bar.spread.end}, total {fmt(bar.spread.total)} {unit} spread over {bar.spread.years} years
        </div>
      )}
      {segRows.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-panel pt-2 text-xs">
          {segRows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-2">
              <span>{k}</span>
              <span>
                {bar.kind === 'gap' ? fmt(v) : isStep(bar) ? fmtStep(v) : fmt(v)}
                {bar.kind === 'gap' && v <= 0 ? ' (target exceeded)' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
