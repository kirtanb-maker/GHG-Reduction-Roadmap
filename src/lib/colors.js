// Chart colours — docs/product-spec.md Section 8 ("Chart behaviour").
// Done = full colour, planned = lighter shade of the same colour.

export const UNSTACKED = {
  base: '#8C8985',
  actual: '#8C8985',
  target: '#000000',
  done: '#77BB78',
  reductions: '#77BB78',
  planned: '#A9D6AA',
  gap: '#F8AAB6',
};

const SCOPE = {
  'Scope 1': { full: '#77BB78', light: '#A9D6AA' },
  'Scope 2': { full: '#8DBAED', light: '#BBD6F4' },
  'Scope 3': { full: '#FCCF61', light: '#FDE3A6' },
};

const BUSINESS_PALETTE = [
  { full: '#FCCF61', light: '#FDE3A6' }, // Manufacturing (first business in the data)
  { full: '#F8AAB6', light: '#FBCCD3' }, // Stores
  { full: '#8DBAED', light: '#BBD6F4' }, // any further business
];
const BUSINESS_FIXED = { Manufacturing: 0, Stores: 1 };

export function segmentPalette(stackBy, key, businesses = []) {
  if (stackBy === 'scope') return SCOPE[key];
  if (stackBy === 'business') {
    const i = key in BUSINESS_FIXED ? BUSINESS_FIXED[key] : Math.min(2, businesses.indexOf(key));
    return BUSINESS_PALETTE[i < 0 ? 2 : i];
  }
  return null;
}

/** Fill for one segment of one bar. */
export function fillFor(bar, segKey, stackBy, businesses) {
  if (bar.kind === 'gap') return UNSTACKED.gap;
  if (!stackBy) return UNSTACKED[bar.kind];
  const p = segmentPalette(stackBy, segKey, businesses);
  return bar.kind === 'planned' ? p.light : p.full;
}
