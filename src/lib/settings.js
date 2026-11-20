// Settings stay in the code (spec v2.0 Section 5): not in the database, not editable in the tool.
export const SETTINGS = {
  baseYear: 2020,
  actualYear: 2025,
  targetYear: 2030,
  targetReduction: 0.5, // default position of the TARGET REDUCTION slider
  targetReductionRange: [0, 0.99],
  unit: 't CO2',
};

export const VERSION = 'v2.0';
export const SEED_LABEL = 'seeded from the Excel (v1.2)';
export const CONTACT = 'ghgroadmap@icloud.com';
