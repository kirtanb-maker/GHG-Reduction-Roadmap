"""Convert docs/source/GHG_reduction_roadmap.xlsx into src/data/roadmap.json.

Usage (from the repo root):  python3 scripts/convert_excel.py
Needs: pip install openpyxl

Rules (product-spec.md Section 5):
- "Base year" rows -> type "base"; named measures -> type "measure".
- "Actual", "Gap" and "Target" rows are calculated by the tool and NOT imported.
- Year "2020-2025" -> startYear 2020, endYear 2025; "2023" -> 2023/2023.
- "-" in Scope 3 Category -> null.
"""
import json
import sys
from datetime import date
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "source" / "GHG_reduction_roadmap.xlsx"
OUT = ROOT / "src" / "data" / "roadmap.json"
SKIP = {"Actual", "Gap", "Target"}

SETTINGS = {
    "baseYear": 2020,
    "actualYear": 2025,
    "targetYear": 2030,
    "targetReduction": 0.5,
    "targetReductionRange": [0, 0.99],
    "singleColumnMeasures": ["Up/Downsizing", "Energy Efficiency"],
    "unit": "t CO2",
}


def parse_years(raw):
    text = str(raw).strip()
    if "-" in text:
        a, b = text.split("-", 1)
        return int(a), int(b)
    return int(text), int(text)


def main():
    ws = openpyxl.load_workbook(SRC, data_only=True).worksheets[0]
    rows = []
    for order, r in enumerate(ws.iter_rows(min_row=3, values_only=True), start=1):
        label, year, value, scope, s3cat, business, status = r[:7]
        if not label:
            continue
        label = str(label).strip()
        if label in SKIP:
            continue
        start, end = parse_years(year)
        cat = None if s3cat in (None, "-", "") else str(s3cat).strip()
        row = {
            "type": "base" if label == "Base year" else "measure",
            "name": None if label == "Base year" else label,
            "startYear": start,
            "endYear": end,
            "value": float(value),
            "scope": int(scope),
            "scope3Category": cat,
            "business": str(business).strip(),
            "status": None if label == "Base year" else str(status).strip().lower(),
            "order": order,
        }
        if row["type"] == "measure" and row["status"] not in ("done", "planned"):
            sys.exit(f"Row {order}: unknown status {status!r}")
        rows.append(row)
    data = {
        "settings": SETTINGS,
        "source": "docs/source/GHG_reduction_roadmap.xlsx",
        "dataAsOf": date.today().isoformat(),
        "rows": rows,
    }
    OUT.write_text(json.dumps(data, indent=2) + "\n")
    base = [r for r in rows if r["type"] == "base"]
    print(f"{len(base)} base rows (total {sum(r['value'] for r in base):,.0f}), "
          f"{len(rows) - len(base)} measure rows -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
