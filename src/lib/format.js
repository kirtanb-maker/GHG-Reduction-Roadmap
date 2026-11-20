const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Whole tonnes with thousands separators; a real minus sign for negatives. */
export function fmt(n) {
  const r = Math.round(n);
  return (r < 0 ? '−' : '') + nf.format(Math.abs(r));
}

/** Signed step value: "−1,400" or "+300". */
export function fmtStep(n) {
  const r = Math.round(n);
  return (r > 0 ? '+' : '') + fmt(r);
}
