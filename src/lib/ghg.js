// GHG Protocol Scope 3 categories 1–15 (stored as the number).
export const SCOPE3_CATEGORIES = [
  [1, 'Purchased goods and services'],
  [2, 'Capital goods'],
  [3, 'Fuel- and energy-related activities'],
  [4, 'Upstream transportation and distribution'],
  [5, 'Waste generated in operations'],
  [6, 'Business travel'],
  [7, 'Employee commuting'],
  [8, 'Upstream leased assets'],
  [9, 'Downstream transportation and distribution'],
  [10, 'Processing of sold products'],
  [11, 'Use of sold products'],
  [12, 'End-of-life treatment of sold products'],
  [13, 'Downstream leased assets'],
  [14, 'Franchises'],
  [15, 'Investments'],
];

const NAMES = new Map(SCOPE3_CATEGORIES);
export const categoryLabel = (n) => (NAMES.has(Number(n)) ? `${n} ${NAMES.get(Number(n))}` : String(n));
