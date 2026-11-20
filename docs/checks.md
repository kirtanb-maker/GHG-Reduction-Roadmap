# Checks — GHG Reduction Roadmap

Written against product-spec.md v1.2 · 20 November 2026 · by Project Governor

> What "done" means for this tool. Claude Code runs the rows it can perform at the
> end of every phase and writes the result and date in the last column; the verifier
> agent re-runs them in a fresh context; the builder performs the rows marked
> "builder" on the Deploy Preview before merging. A row that fails is fixed in the
> tool, never in this file. This file changes only when the spec changes (through the
> Project Governor); Claude Code never edits a row.

## Data checks
Known input in, known result out. This tool has no database: the known input is the built-in dataset `src/data/roadmap.json` (converted from `docs/source/GHG_reduction_roadmap.xlsx`), so the expected values are known in advance. Values in tonnes; the screen shows them in kt.

| # | Given (data and filter) | Expected result | Performed by | Last result |
|---|---------------------------|-----------------|--------------|-------------|
| D1 | `src/data/roadmap.json` compared to `docs/source/GHG_reduction_roadmap.xlsx` (v1.2 Excel) | 4 base rows (total 120,000; Scope 2 Manufacturing 20,000) and 14 measure rows, with values, scopes, businesses and statuses matching Section 5; "Energy Efficiency" used for both efficiency rows, no "Efficiency measures"; Energy Attribute Certificates 2022 = −9,000; no Actual/Gap/Target rows imported; settings carry default target 50 % and the one-column list (Up/Downsizing, Energy Efficiency) | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D2 | Default filters, detail on, slider −50 % | Base 120,000; Actual 97,900; running total after planned 73,700; Target 60,000; Gap 13,700 | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D3 | Default filters, detail on | 21 bars in this order: Base; CHP shutdown (2021), Energy Attribute Certificates (2022), Electric Boiler (2023), Photovoltaics (2024), Up/Downsizing (2020–2025), Energy Efficiency (2020–2025); Actual; Green Tariffs (2026), Green Tariffs (2027), Electric Boiler (2027), Green Tariffs (2028), Energy Attribute Certificates (2028), Green Tariffs (2029), Photovoltaics (2029), Electrification Furnace (2029), Heat Pump (2029), Green Tariffs (2030), Energy Efficiency (2026–2030); Gap; Target | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D4 | Default filters, detail on | "Up/Downsizing (2020–2025)" = −7,000; "Energy Efficiency (2020–2025)" = −3,000; "Energy Efficiency (2026–2030)" = −1,000; "Green Tariffs (2026)" = −2,000; no per-year Up/Downsizing or Energy Efficiency bar; no measure bar in 2020 | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D5 | Default filters, "Show detail for past measures" off | 16 bars; one "Reductions" bar = −22,100 between Base and Actual; Actual still 97,900; planned bars unchanged (incl. Energy Efficiency (2026–2030)) | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D6 | Scope filter: Scope 1 only | Base 70,000; Actual 56,900; after planned 47,700; Target 35,000; Gap 12,700 | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D7 | Scope filter: Scope 2 only | Base 50,000; Actual 41,000; after planned 26,000; Target 25,000; Gap 1,000 | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D8 | Business filter: Stores only | Base 35,000; Actual 34,000; after planned 19,000; Target 17,500; Gap 1,500 | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D9 | Scope filter: Scope 3 only (or no scope selected) | "No data for this selection"; no chart bars | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D10 | "Show Business" on, default filters | Base segments Manufacturing 85,000 / Stores 35,000; Actual segments Manufacturing 63,900 / Stores 34,000; each bar's segments sum to its unstacked value | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D11 | "Show Scope 1, 2, 3" on, default filters | Actual segments Scope 1 56,900 / Scope 2 41,000; Gap bar single colour 13,700, tooltip lists Scope 1 12,700 and Scope 2 1,000 | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D12 | Slider −30 %, default filters | Target 84,000; Gap shown as "Target reached" with 10,300 beyond target; Target bar still drawn | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D13 | Slider −40 %, "Show Scope 1, 2, 3" on, default filters | Target 72,000 (segments Scope 1 42,000 / Scope 2 30,000); Gap bar 1,700, tooltip lists Scope 1 5,700 and Scope 2 −4,000 (target exceeded) | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D14 | Slider at its ends, default filters | 0 %: Target 120,000, "Target reached" with 46,300 beyond target. −99 %: Target 1,200, Gap 72,500. The slider offers nothing below 0 % or beyond −99 % | Claude Code, verifier | PASS 2026-11-20 (Claude Code) |
| D15 | netlify.toml at the repo root | netlify.toml matches the stack (React/Vite: npm run build, publish dist) | Claude Code | PASS 2026-11-20 (Claude Code) |

## Screen checks
What must be visible and what must happen.

| # | Screen | What must be true | Performed by | Last result |
|---|--------|-------------------|--------------|-------------|
| S1 | Roadmap — layout | Header with "The Company" lockup, title and subtitle "kt CO2 · Base year 2020 → Target 2030 (−50 %)"; filter bar (Scope, Business, disabled Scope 3 category showing "No Scope 3 data yet", Target reduction slider at −50 %); three toggles with their default states; chart; legend; summary line; footer. Brand fonts and colours from Section 10. | builder, verifier | PASS 2026-11-20 (Claude Code, 1440 px screenshot) |
| S2 | Roadmap — colours | Default view: Base/Actual grey, Target black, done measures darker green, planned measures lighter green, Gap pink. Done vs. planned is clearly distinguishable. | builder |  |
| S3 | Roadmap — toggles | "Show Scope 1, 2, 3" stacks every bar by scope, and "Show Business" stacks every bar by business, each with its legend. Switching one on switches the other off. Planned segments are lighter than done segments. | builder |  |
| S4 | Roadmap — collapse | Switching "Show detail for past measures" off replaces all done bars with one "Reductions" bar; switching it on restores them. | builder |  |
| S5 | Roadmap — tooltip | Hovering a bar shows name, year, value and status. A Green Tariffs piece shows "part of … spread over 5 years"; a span column shows "… total over n years". In stacked mode the tooltip shows segment values. | builder | PASS 2026-11-20 (Claude Code, Playwright hover) |
| S6 | Roadmap — phone | At phone width (≈375 px) filters, slider and toggles wrap, the slider can be moved by touch, the chart scrolls horizontally inside its frame and the page has no sideways scroll. | builder, verifier | PASS 2026-11-20 (Claude Code, iPhone 13: page 390 = viewport, chart scrolls in frame, slider moves by tap) |
| S7 | Roadmap — target slider | The slider starts at −50 %. Moving it to −30 % makes the Target bar taller, the Gap turns into "Target reached", and the subtitle and summary show −30 %; moving it to −70 % makes the Gap bar larger. The arrow keys move it in 1 % steps. A page reload returns it to −50 %. | builder, verifier | PASS 2026-11-20 (Claude Code, Playwright: arrow keys, −30/−70/0/−99, reload → −50 %) |
| S8 | Roadmap — span columns | "Up/Downsizing (2020–2025)" and "Energy Efficiency (2020–2025)" each appear as ONE column directly before Actual; "Energy Efficiency (2026–2030)" as one column directly before Gap; Green Tariffs still shows one bar per year 2026–2030; the year band under a span column reads its span. | builder, verifier | PASS 2026-11-20 (Claude Code, screenshot) |

## Refusal checks
Not applicable: no database, no login.

## How a result is written
`PASS 2026-11-16 (Claude Code)` · `PASS 2026-11-16 (verifier)` · `PASS 2026-11-17
(builder, branch address)` · `FAIL 2026-11-16 (verifier): [one line why]`. A FAIL
stays until the row passes again; the earlier FAIL is kept in PROGRESS.md Check
results, not here.
