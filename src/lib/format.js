// Display formatting. The data file and all calculations stay in tonnes (t CO2);
// the screen shows kilotonnes (kt CO2) with one decimal.

export const DISPLAY_UNIT = 'kt CO2';

const kt1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const ktAxis = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

const sign = (r) => (r < 0 ? '−' : '');
const round1 = (t) => Math.round(t / 100) / 10; // tonnes → kt, one decimal

/** Tonnes shown as kt with one decimal and a real minus sign: 110000 → "110.0". */
export function fmt(tonnes) {
  const k = round1(tonnes);
  return sign(k) + kt1.format(Math.abs(k));
}

/** Signed step value in kt: −1400 → "−1.4", 300 → "+0.3". */
export function fmtStep(tonnes) {
  const k = round1(tonnes);
  return (k > 0 ? '+' : '') + fmt(tonnes);
}

/** Axis tick in kt, no trailing ".0": 25000 → "25". */
export function fmtAxis(tonnes) {
  const k = tonnes / 1000;
  return sign(k) + ktAxis.format(Math.abs(k));
}

/** Share of the base year, one decimal, signed: −0.219 → "−21.9 %", 0.05 → "+5.0 %". */
export function fmtPct(ratio) {
  const p = Math.round(ratio * 1000) / 10;
  if (p === 0) return '0.0 %';
  return (p > 0 ? '+' : '−') + kt1.format(Math.abs(p)) + ' %';
}
