# Data conversion

`src/data/roadmap.json` is generated from `docs/source/GHG_reduction_roadmap.xlsx` by
`scripts/convert_excel.py` (run from the repo root: `python3 scripts/convert_excel.py`; needs `openpyxl`).

- "Base year" rows become `type: "base"`; every named measure becomes `type: "measure"`.
- The Excel's "Actual", "Gap" and "Target" rows are not imported: the tool calculates them.
- "2020-2025" becomes `startYear: 2020, endYear: 2025`; a single year sets both.
- "-" in Scope 3 Category becomes `null`. Status is lower-cased (`done` / `planned`).
- `order` is the row's position in the sheet; it orders bars within a year.
- Settings (base year 2020, actual year 2025, target year 2030, target reduction 50 %, unit t CO2) are set in the script.

To update the numbers: replace the Excel (same columns), run the script, run `npm run check:data`.
The expected values in docs/checks.md belong to the v1.0 dataset; new numbers mean the spec and checks are revised too.
