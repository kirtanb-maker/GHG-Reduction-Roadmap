# Checks — GHG Reduction Roadmap

Written against product-spec.md v1.0 · 20 November 2026 · by Project Governor

> What "done" means for this tool. Claude Code runs the rows it can perform at the
> end of every phase and writes the result and date in the last column; the verifier
> agent re-runs them in a fresh context; the builder performs the rows marked
> "builder" on the Deploy Preview before merging. A row that fails is fixed in the
> tool, never in this file. This file changes only when the spec changes (through the
> Project Governor); Claude Code never edits a row.

## Data checks
Known input in, known result out. This tool has no database: the known input is the built-in dataset `src/data/roadmap.json` (converted from `docs/source/GHG_reduction_roadmap.xlsx`), so the expected values are known in advance.

| # | Given (data and filter) | Expected result | Performed by | Last result |
|---|---------------------------|-----------------|--------------|-------------|
| D1 | `src/data/roadmap.json` compared to `docs/source/GHG_reduction_roadmap.xlsx` | 4 base rows (total 110,000) and 14 measure rows, with values, scopes, businesses and statuses matching Section 5; no Actual/Gap/Target rows imported | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D2 | Default filters, detail on | Base 110,000; Actual 85,900; running total after planned 61,700; Target 55,000; Gap 6,700 | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D3 | Default filters, detail on | 33 bars: Base, 14 done-measure bars, Actual, 15 planned-measure bars, Gap, Target | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D4 | Default filters, detail on | "Up/Downsizing (2021)" = −1,400; "Efficiency measures (2021)" = −600; "Green Tariffs (2026)" = −2,000; "Energy Efficiency (2026)" = −200; no measure bar in 2020 | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D5 | Default filters, "Show detail for past measures" off | 20 bars; one "Reductions" bar = −24,100 between Base and Actual; Actual still 85,900 | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D6 | Scope filter: Scope 1 only | Base 70,000; Actual 56,900; after planned 47,700; Target 35,000; Gap 12,700 | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D7 | Scope filter: Scope 2 only | Base 40,000; Actual 29,000; after planned 14,000; Target 20,000; Gap shown as "Target reached" with 6,000 beyond target | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D8 | Business filter: Stores only | Base 35,000; Actual 34,000; after planned 19,000; Target 17,500; Gap 1,500 | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D9 | Scope filter: Scope 3 only (or no scope selected) | "No data for this selection"; no chart bars | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D10 | "Show Business" on, default filters | Base segments Manufacturing 75,000 / Stores 35,000; Actual segments Manufacturing 51,900 / Stores 34,000; each bar's segments sum to its unstacked value | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D11 | "Show Scope 1, 2, 3" on, default filters | Actual segments Scope 1 56,900 / Scope 2 29,000; Gap bar single colour 6,700, tooltip lists Scope 1 12,700 and Scope 2 −6,000 (target exceeded) | Claude Code, verifier || PASS 2026-11-20 (Claude Code) |
| D12 | netlify.toml at the repo root | netlify.toml matches the stack (React/Vite: npm run build, publish dist) | Claude Code || PASS 2026-11-20 (Claude Code) |

## Screen checks
What must be visible and what must happen.

| # | Screen | What must be true | Performed by | Last result |
|---|--------|-------------------|--------------|-------------|
| S1 | Roadmap — layout | Header with "The Company" lockup and title; filter bar (Scope, Business, disabled Scope 3 category showing "No Scope 3 data yet"); three toggles with their default states; chart; legend; summary line; footer. Brand fonts and colours from Section 10. | builder, verifier || PASS 2026-11-20 (Claude Code, screenshot) |
| S2 | Roadmap — colours | Default view: Base/Actual grey, Target black, done measures darker green, planned measures lighter green, Gap pink. Done vs. planned is clearly distinguishable. | builder | |
| S3 | Roadmap — toggles | "Show Scope 1, 2, 3" stacks every bar by scope, and "Show Business" stacks every bar by business, each with its legend. Switching one on switches the other off. Planned segments are lighter than done segments. | builder | |
| S4 | Roadmap — collapse | Switching "Show detail for past measures" off replaces all done bars with one "Reductions" bar; switching it on restores them. | builder | |
| S5 | Roadmap — tooltip | Hovering a bar shows name, year, value and status. A multi-year piece shows "part of … spread over n years". In stacked mode the tooltip shows segment values. | builder | |
| S6 | Roadmap — phone | At phone width (≈375 px) filters and toggles wrap, the chart scrolls horizontally inside its frame and the page has no sideways scroll. | builder, verifier || PASS 2026-11-20 (Claude Code, iPhone 13 emulation: page 390 px = viewport, chart scrolls in frame) |

## Refusal checks
Not applicable: no database, no login.

## How a result is written
`PASS 2026-11-16 (Claude Code)` · `PASS 2026-11-16 (verifier)` · `PASS 2026-11-17
(builder, branch address)` · `FAIL 2026-11-16 (verifier): [one line why]`. A FAIL
stays until the row passes again; the earlier FAIL is kept in PROGRESS.md Check
results, not here.
