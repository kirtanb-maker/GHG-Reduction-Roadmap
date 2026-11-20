# Product Spec — GHG Reduction Roadmap

**Version:** 1.2
**Date:** 20 November 2026
**Author:** Kirtan Bergheim
**Status:** Confirmed
> The Tool Architect sets this to **Confirmed** when the builder confirms the Phase 10 summary. The Project Governor will not accept a spec in any other status.

---

## Section 1 — Tool Summary

**Tool name:** GHG Reduction Roadmap

**What it does:** A single interactive waterfall chart. It runs from the base-year emissions (2020), through every done reduction measure, to the actual emissions (2025). It then continues through every planned measure and the remaining gap to the 2030 target. Users can filter by Scope, Business and Scope 3 category. They can switch on stacked colouring by scope or by business, collapse past measures into one "Reductions" bar, and move a slider to try a different target reduction (0 to −99 %).

**Who uses it:** The sustainability team at The Company (a global glass manufacturer) and the colleagues they share the link with. These people need to see, at a glance, how far decarbonisation has come and what is still missing to reach the target.

**Why it exists:** The roadmap currently lives in an Excel table. The tool turns it into one clear, filterable picture of base year → done measures → actual → planned measures → gap → target. It shows how much has been achieved, what is planned and how big the remaining gap is, for the whole company or any scope or business.

**Build status:** Iteration — previous version was v1.0 (the MVP waterfall on the first Excel, every multi-year measure split per year, target fixed at −50 %). This build (v1.2, which also absorbs the agreed v1.1 change) brings the updated Excel (new numbers; "Efficiency measures" renamed "Energy Efficiency"), shows Up/Downsizing, Energy Efficiency and Green Tariffs as one column per time span, adds a target slider (0 to −99 %, default −50 %), and aligns the spec with the kt display already on screen.

---

## Section 2 — Classification

### Data Model

**Decision:** D1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | Yes |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | No |

**Reason:** All emission and measure data comes from the builder's Excel (`docs/source/GHG_reduction_roadmap.xlsx`). It is converted once into a data file in the repo (`src/data/roadmap.json`). Users only filter, toggle and move the target slider; nothing is entered or saved, and a reload returns to the defaults.

**D3 is triggered if any of the following are true — check all that apply:**
- [ ] Data must be retrievable after the session ends
- [ ] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed
- [ ] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

None apply.

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. Admin work (creating users, maintaining lists) happens in the Supabase dashboard, not in the app; the moment one logged-in person has an admin action in the app, the tool is A3. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** The builder chose an open link with no login for the MVP. Logins are deferred to the backlog (Section 12). See Section 15 for the open question on confidentiality.

> **Promotion rule:** Auth requires a database. If the access model is A2 or A3, the data model is D3 — even when all displayed content is fixed. D1/D2 combined with A2/A3 are not valid classifications; they resolve to D3.

> **Target, not state:** the access model here is what this tool is designed for. Where the build actually stands lives in PROGRESS.md, never here.

---

### If Access Model is A2 — N/A

### If Access Model is A3 — N/A

---

### Tier

**Tier:** 1

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

This is a Tier 1 tool: fixed data, no login, no database, Netlify only.

---

### Standalone or Stack

**This tool is:** Standalone — it does not share a database with any other tool (it has no database).

---

## Section 3 — Arms

Arms are capabilities added to the tool. They do not change the tier.

> **Document search and AI knowledge bases are outside this framework version.** Not requested for this tool.

### AI API Arm

**Active:** No

### Export Arm

**Active:** No (downloads such as a PNG of the chart or a CSV of the data are on the backlog, Section 12).

### Email Arm

**Active:** No

### Scheduled Automation Arm

**Active:** No

### Public-tool protections (A1 with a form, an AI arm or an email arm)

| Detail | Answer |
|--------|--------|
| Protections | Not applicable — the tool has no form, no AI arm and no email arm. Nothing is written anywhere; there is no server function. |
| Bot check | Not applicable — no form. |

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind. Chart library: Recharts. The waterfall is built as a stacked bar chart with an invisible "offset" series, so each step floats at the right height. If Recharts cannot draw the stacked floating bars cleanly, Claude Code may propose an equivalent open-source chart library in its plan. |
| Deployment target | Netlify |
| Deployment | GitHub push → Netlify auto-deploy. **Always a branch, one per session (one intent):** Claude Code works on the session's branch and pushes it. It never pushes to main and never merges (the one exception: a new tool's documents, pushed to main by the Architect and the Governor before the build). The session ends with a pull request on GitHub, and Netlify builds a Deploy Preview of it (`deploy-preview-[n]--[site].netlify.app`, linked from the pull request). The builder does their checks there, merges on GitHub and deletes the branch; then main deploys. On the first build the builder connects the repo to a Netlify site once, when the first pull request is open. Netlify is NOT connected to Claude: no Netlify connector or MCP is used or needed in this workflow. One-time builder step in the Netlify dashboard: connect the repo to a site (on the first pull request). |
| Supabase ↔ Netlify connection (Tier 2/3) | Not applicable — Tier 1, no database. |
| Platform owner | The builder (Kirtan Bergheim), on their own personal Netlify account. |

**GitHub — pre-build requirement for all Tier 1, 2, and 3 tools:**
The repo `kirtanb-maker/GHG-Reduction-Roadmap` exists and is the tool's repo. The Tool Architect and the Project Governor run in Claude Code inside it and write their files at the repo root (intent.md, product-spec.md, CLAUDE.md, PROGRESS.md, checks.md, .claude/settings.json). The brand skill is already installed at `.claude/skills/the-company-brand/SKILL.md`. The source Excel is at `docs/source/GHG_reduction_roadmap.xlsx`. In its first build session Claude Code moves every document into docs/ and checks that each one is there before building. It commits regularly, always on the session's branch, and every session ends with one pull request. It does not create or configure the repo.

---

### CONDITIONAL: Supabase project — N/A (Tier 1)

### CONDITIONAL: Stack — N/A (standalone)

---

## Section 5 — Data Architecture

### CONDITIONAL: D3 only — N/A (D1)

There is no database. For Claude Code, the built-in data is described here because the whole chart depends on it.

**Source:** `docs/source/GHG_reduction_roadmap.xlsx`, sheet "Tabelle1", rows 3–32. Claude Code converts it once into `src/data/roadmap.json` and records in `docs/` how the conversion was done. The Excel was updated for v1.2 (20 November 2026) and is re-converted with the same script. To update numbers later, the builder asks Claude Code to edit the JSON (or re-convert an updated Excel); that is a fix-lane change, not a new spec.

**Settings in the data file:**

| Setting | Value |
|---------|-------|
| Base year | 2020 |
| Actual year | 2025 |
| Target year | 2030 |
| Target reduction vs. base year (default) | 50 % — the starting position of the target slider |
| Target slider range | 0 % to 99 %, steps of 1 % (shown as 0 % … −99 %) |
| Measures shown as one column per span | "Up/Downsizing", "Energy Efficiency", "Green Tariffs" (list in the data file; any other multi-year measure is split per year) |
| Unit | t CO2 (stored and calculated in tonnes; displayed in kt CO2) |

**Row types and fields:**

| Field | Meaning | Values in the MVP |
|-------|---------|-------------------|
| type | `base` or `measure` | Excel rows labelled "Base year" → `base`; every named measure → `measure`. The Excel's "Actual", "Gap" and "Target" rows are NOT imported: they are calculated (Section 9). |
| name | Measure name (for `measure`) | e.g. "Up/Downsizing", "Energy Efficiency", "Electric Boiler" |
| startYear / endYear | Year or year range as written in the Excel | "2023" → 2023/2023; "2020-2025" → 2020/2025; "2026-2030" → 2026/2030 |
| value | t CO2; negative = reduction, positive = increase | e.g. −6000 |
| scope | 1, 2 or 3 | 1 and 2 only in the MVP |
| scope3Category | Scope 3 category, or empty | empty ("-" in the Excel) for all rows |
| business | Business unit | "Manufacturing", "Stores" |
| status | `done` or `planned` (measures only) | from the Excel column "Done/planned" |
| order | The row's position in the Excel | used to order bars within a year |

**The MVP dataset (from the Excel):**

Base year 2020: Scope 1 Manufacturing 65,000; Scope 1 Stores 5,000; Scope 2 Manufacturing 20,000; Scope 2 Stores 30,000 (total 120,000).

| Measure | Year(s) | t CO2 | Scope | Business | Status |
|---------|---------|-------|-------|----------|--------|
| Up/Downsizing | 2020-2025 | −6,000 | 1 | Manufacturing | Done |
| Up/Downsizing | 2020-2025 | −1,000 | 1 | Stores | Done |
| Energy Efficiency | 2020-2025 | −3,000 | 1 | Manufacturing | Done |
| Electric Boiler | 2023 | −2,000 | 1 | Manufacturing | Done |
| CHP shutdown | 2021 | −500 | 1 | Manufacturing | Done |
| Photovoltaics | 2024 | −600 | 1 | Manufacturing | Done |
| Energy Attribute Certificates | 2022 | −9,000 | 2 | Manufacturing | Done |
| Green Tariffs | 2026-2030 | −10,000 | 2 | Stores | Planned |
| Electric Boiler | 2027 | −4,000 | 1 | Manufacturing | Planned |
| Energy Efficiency | 2026-2030 | −1,000 | 1 | Manufacturing | Planned |
| Energy Attribute Certificates | 2028 | −5,000 | 2 | Stores | Planned |
| Photovoltaics | 2029 | −1,200 | 1 | Manufacturing | Planned |
| Electrification Furnace | 2029 | −800 | 1 | Manufacturing | Planned |
| Heat Pump | 2029 | −2,200 | 1 | Manufacturing | Planned |

**File storage:** No

**Derived or calculated data:** Yes — Actual, Gap, Target (from the slider), the per-year split of multi-year measures and the one-column spans; see Section 9.

---

## Section 6 — Access and Permissions

### CONDITIONAL: A2/A3 only — N/A (A1, public link, no login)

---

## Section 7 — GDPR

### D3 only — N/A

The tool is D1: no database, no forms, no uploads. It holds no personal data, only aggregated emissions figures per scope and business unit.

---

## Section 8 — Screen and UI Structure

One view.

### Roadmap (the only screen)

- **Purpose:** Show the GHG reduction pathway from base year to target as a waterfall, filterable and switchable between a plain view and a stacked, colour-coded view.
- **What is visible, top to bottom:**
  1. **Header:** "The Company" text lockup (Spectral Medium, per the brand skill; no logo yet) and the page title "GHG Reduction Roadmap" (Spectral). The subtitle shows the unit, period and chosen target: "kt CO2 · Base year 2020 → Target 2030 (−50 %)"; the percentage follows the slider.
  2. **Filter bar:**
     - **Scope**: multi-select chips "Scope 1", "Scope 2", "Scope 3". All selected by default. "Scope 3" carries a small "no data yet" hint.
     - **Business**: multi-select chips "Manufacturing", "Stores". All selected by default. The list of businesses is derived from the data file, so new businesses appear automatically.
     - **Scope 3 category**: a dropdown, disabled while the data contains no Scope 3 category, showing "No Scope 3 data yet". When Scope 3 data with categories arrives later, the dropdown lists them (multi-select, all by default) and filters Scope 3 rows only. Scope 1/2 rows are unaffected by it.
     - **Target reduction**: a slider labelled "TARGET REDUCTION" with the current value next to it (e.g. "−50 %"). Range 0 % to −99 % in steps of 1 %; starts at −50 % (the data file's setting). It is the browser's standard range control, so it works with the keyboard and by touch. Moving it recalculates the Target, the Gap / "Target reached", the stacked segments, the summary line and the subtitle instantly. It is not a filter: it changes no rows.
  3. **Toggles (switches):**
     - **Show Scope 1, 2, 3** — off by default.
     - **Show Business** — off by default.
     - **Show detail for past measures** — on by default.
     - "Show Scope 1, 2, 3" and "Show Business" are mutually exclusive: switching one on switches the other off.
  4. **The waterfall chart** (see "Chart behaviour" below), with a legend.
  5. **Summary line under the chart:** Base, Actual, Target, Gap (or "Target reached") in kt CO2 for the current filter and target, with % vs. base for Actual, Target (the slider's value) and Gap.
  6. **Footer:** "Data: GHG reduction roadmap (Excel), version as of [date of the data file]" and the tool version.
- **User actions:** select or deselect filter chips; move the target slider; switch the three toggles; hover (desktop) or tap (phone) a bar to see its tooltip.
- **What happens next:** the chart and summary recalculate instantly in the browser. Nothing is saved. A page reload returns to the defaults (target −50 %).

**Chart behaviour:**

- **X-axis: the bars in this order.**
  1. **Base year 2020.**
  2. **The done measures**, one bar per measure per year, sorted by year, then by Excel row order; then the done **span columns** (see below), in Excel row order, directly before Actual.
  3. **Actual 2025.**
  4. **The planned measures**, one bar per measure per year, in the same order; then the planned span columns, directly before Gap.
  5. **Gap.**
  6. **Target 2030.**
  - **Span columns:** a multi-year measure whose name is in the data file's one-column list ("Up/Downsizing", "Energy Efficiency", "Green Tariffs") is shown as ONE column for its whole span instead of one per year, labelled with the span as written in the Excel: "Up/Downsizing (2020–2025)", "Energy Efficiency (2020–2025)", "Green Tariffs (2026–2030)", "Energy Efficiency (2026–2030)". Its value is the measure's full value. Any other multi-year measure (none in the current data) is still split per year.
  - Measure labels read "Name (year)", e.g. "Electric Boiler (2023)", or "Name (start–end)" for a span column. Under the bars, the axis shows the year groups (2021, 2022, …) so the year progression is visible; under a span column the band shows its span ("2020–2025").
  - Excel rows that share a measure name and a year (or the same span) are merged into one bar (e.g. Up/Downsizing for Manufacturing and for Stores). Stacking shows the split.
- **Y-axis:** kt CO2, starting at 0, ticks without decimals.
- **Totals and steps:** Base, Actual and Target are full bars from zero. Each measure is a floating step from the previous running total. A reduction steps down; a positive value (an increase) steps up. Gap is a floating step from the running total after all planned measures down to the Target.
- **Value labels:** each bar shows its value in kt with one decimal (e.g. "−7.0") where space allows; otherwise the value is in the tooltip only.
- **Show detail for past measures = off:** all done measure bars are replaced by one bar labelled **"Reductions"** between Base year and Actual, equal to the sum of all done measures in the current filter. Planned measures always show in detail.
- **Default colouring (no stacking toggle on):** one colour per bar type, from the brand skill.
  - Base year and Actual: grey `#8C8985`.
  - Target: black `#000000`.
  - Done measures and "Reductions": green `#77BB78`, the darker shade.
  - Planned measures: a lighter green `#A9D6AA`, about halfway between `#77BB78` and its tint `#D6EBD6`. It must still be clearly visible on the off-white background.
  - Gap: pink `#F8AAB6`.
- **Show Scope 1, 2, 3 = on:** every bar (Base, measures, Reductions, Actual, Target) is stacked by scope.
  - Scope 1 is green `#77BB78`, Scope 2 blue `#8DBAED` and Scope 3 yellow `#FCCF61`.
  - Done measures use the scope colour at full strength. Planned measures use a lighter shade of the same scope colour (Scope 1 `#A9D6AA`, Scope 2 `#BBD6F4`, Scope 3 a lighter yellow of the same step).
  - Base, Actual and Target segments use the full scope colour.
- **Show Business = on:** the same, stacked by business.
  - Manufacturing is yellow `#FCCF61` and Stores pink `#F8AAB6`.
  - Planned measures use a lighter shade of the same colour.
  - Any additional business in the data gets the next brand accent, blue `#8DBAED`.
- **Gap bar in stacked mode:** drawn as one bar in the gap colour (the net gap for the current filter), not stacked. Its tooltip lists the gap per segment, including any segment that already over-achieves its target (shown as "−4.0 kt (target exceeded)").
- **Legend:** shows the colours in use, including "Done" and "Planned" shades.
- **Tooltip:** shows the bar name, year (or span), value in kt CO2 and status (Done/Planned). In stacked mode it also shows the value per segment. For a per-year piece of a split multi-year measure it adds: "part of [name] [start]–[end], total [value] spread over [n] years". For a span column it adds: "[name] [start]–[end], total over [n] years". The Target tooltip names the chosen reduction (e.g. "−50 % vs. base year").
- **Empty selection:** if the filters leave no rows (no scope selected, no business selected, or Scope 3 only), the chart area shows "No data for this selection" instead of an empty chart.
- **Phone width:** the filter bar and toggles wrap. If the chart has more bars than fit, it scrolls horizontally inside its own frame; the page itself never scrolls sideways.

### About this tool — N/A (standard view only on D3 tools)

---

## Section 9 — Logic and Calculations

**What is calculated:** the per-year split of multi-year measures, the span columns, the running totals, Actual, Target, Gap and the collapsed "Reductions" bar, always for the rows that pass the current filters and for the target reduction chosen on the slider.

**Inputs:** the rows of `src/data/roadmap.json` and the settings (base year, actual year, target year, default target reduction, one-column list), filtered by Scope, Business and Scope 3 category; and the slider's target reduction r (0–99 %, default 50 %).

**Formula or rules:**

1. **Filter first.** Every calculation below uses only the rows whose scope, business and Scope 3 category are selected.
2. **Span columns.** A multi-year measure whose name is in the one-column list is NOT split: it becomes one bar "Name (start–end)" carrying its full value, placed after the per-year bars of its status (done: directly before Actual; planned: directly before Gap), in Excel row order. Rows with the same name and the same span merge. Example: Up/Downsizing Manufacturing −6,000 + Stores −1,000 → "Up/Downsizing (2020–2025)" −7,000.
3. **Splitting the other multi-year measures.** For a measure with startYear < endYear that is not in the one-column list:
   - If startYear equals the base year, the measure spreads over startYear+1 … endYear. Example: 2020-2025 → 2021–2025, 5 years.
   - Otherwise it spreads over startYear … endYear inclusive. Example: 2026-2030 → 5 years.
   - Each year receives value ÷ number of years. Example: a measure of −10,000 over 2026–2030 → "Name (2026)" … "(2030)" at −2,000 each. (No measure in the current data is split this way; the rule stays for future rows.)
   - Single-year measures stay in their year.
   - Calculations keep full precision in tonnes; only displayed values are rounded (kt CO2 with one decimal, axis ticks without decimals; summary percentages with one decimal; the slider's own value in whole percent).
4. **Base** = sum of all `base` rows.
5. **Reductions (done)** = sum of all `done` measure values.
6. **Actual** = Base + Reductions (done). Values are negative for reductions, so this is "base year minus the sum of done measures".
7. **Planned** = sum of all `planned` measure values.
8. **Target** = Base × (1 − r), where r is the slider's target reduction (default 50 %; 0 % → Target = Base; 99 % → Target = 1 % of Base).
9. **Gap** = (Base + Reductions (done) + Planned) − Target.
   - If Gap > 0, the Gap bar steps down from the running total to the Target.
   - If Gap ≤ 0, the Gap bar is replaced by a marker labelled **"Target reached"**, showing the over-achievement (e.g. "Target reached · 10.3 kt beyond target"). The Target bar is still drawn.
10. **Stacked views.** Steps 4–9 are computed per segment (per scope or per business) for the stacked segments and tooltips. Each segment's Target uses the same r. Each bar's total always equals the unstacked value. The Gap bar is shown as the net value (Section 8).
11. **Summary percentages (vs. Base).** Actual: Reductions (done) ÷ Base; Target: −r; Gap: −Gap ÷ Base (when the target is reached: −over-achievement ÷ Base, shown as beyond target). Reductions read negative, increases positive.

**Output:** the chart bars, the tooltips, the subtitle's target percentage and the summary line (Base, Actual, Target, Gap / Target reached).

**Edge cases:**
- **No rows after filtering:** show "No data for this selection"; no zero-height chart.
- **Measures but no base rows in the selection** (cannot happen with MVP data, but possible later): show the waterfall from 0 and a note "No base-year emissions in this selection".
- **Positive measure values:** drawn as upward steps in the same Done/Planned colours.
- **Slider at 0 %:** Target = Base; with any net reduction the Gap shows "Target reached". **Slider at −99 %:** Target = 1 % of Base. The slider cannot go below 0 % or beyond −99 %.
- **A one-column-list measure that is single-year:** shown as a normal single-year bar.
- **A measure dated after the target year or before the base year:** excluded from the chart and listed in the browser console as a data warning. Claude Code also reports it when converting the data.
- **A done measure dated after the actual year, or a planned measure dated on or before it:** shown where its status puts it (done before Actual, planned after) and flagged as a data warning in the console.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** Brand skill `the-company-brand`, already installed at `.claude/skills/the-company-brand/SKILL.md`. Claude Code applies it as the UI tokens.

The brand skill covers:
- **Colours:** black text; grey `#8C8985` for labels and inactive states; warm panel `#F0EEE4` for chips and the filter panel; off-white `#FAFAF7` page background; white cards.
- **Accents:** green `#77BB78`, blue `#8DBAED`, pink `#F8AAB6`, yellow `#FCCF61`, with their tints.
- **Fonts:** Spectral for titles and DM Sans for body text, loaded from Google Fonts. Labels and toggles are uppercase letter-spaced DM Sans.
- **Logo:** none; the "The Company" text lockup in Spectral Medium.

The chart colour mapping is fixed in Section 8.

**Visual feel:** Clean, calm and professional. The chart is the hero on a white card on the off-white page. The filters and toggles sit in a warm-neutral panel above it.

**Reference or inspiration:** A classic corporate decarbonisation waterfall (base year → measures → actual → planned → gap → target).

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Google Fonts | Loads Spectral and DM Sans | None | — |

No database, no AI, no email: this tool needs no API key of any kind.

> **Security rule — no exceptions:** No API key, token, password, or credential may appear in any HTML file, any JavaScript file, or any file committed to GitHub.

**Environment variable contract:** none. The tool reads no environment variables.

**Credentials readiness:** nothing to create. A Netlify account (the builder's own) is the only account needed.

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Adding and editing measures in the tool, saved for everyone | Needs a database (Tier 2/3); validate the chart first |
| Uploading a new Excel in the browser to redraw the chart | Not needed to validate the idea; data is updated through the repo for now |
| Logins / user accounts | Not needed for the MVP; would need a database and access rules (Tier 3) |
| Scope 3 data | Not available yet; the Scope 3 filter and the Scope 3 category filter exist but stay empty |
| Downloads (PNG of the chart, CSV of the data) | Keep the MVP lean |
| Stacking by Scope and Business at the same time | Clashes with the Done/Planned shading; the two toggles are mutually exclusive for now |

---

## Section 13 — Acceptance Criteria (the checks)

The Project Governor writes this section out as `docs/checks.md`. For this D1 tool the known input is the real data file `src/data/roadmap.json` (converted from the v1.2 Excel). Its expected values are fixed below, in tonnes (the screen shows them in kt). A failing check is fixed in the tool, never in the check.

**Data checks**

| # | Given (data and filter) | Expected result | Performed by |
|---|---------------------------|-----------------|--------------|
| D1 | `src/data/roadmap.json` compared to `docs/source/GHG_reduction_roadmap.xlsx` (v1.2 Excel) | 4 base rows (total 120,000; Scope 2 Manufacturing 20,000) and 14 measure rows, with values, scopes, businesses and statuses matching Section 5; "Energy Efficiency" used for both efficiency rows, no "Efficiency measures"; Energy Attribute Certificates 2022 = −9,000; no Actual/Gap/Target rows imported; settings carry default target 50 % and the one-column list (Up/Downsizing, Energy Efficiency, Green Tariffs) | Claude Code, verifier |
| D2 | Default filters, detail on, slider −50 % | Base 120,000; Actual 97,900; running total after planned 73,700; Target 60,000; Gap 13,700 | Claude Code, verifier |
| D3 | Default filters, detail on | 17 bars in this order: Base; CHP shutdown (2021), Energy Attribute Certificates (2022), Electric Boiler (2023), Photovoltaics (2024), Up/Downsizing (2020–2025), Energy Efficiency (2020–2025); Actual; Electric Boiler (2027), Energy Attribute Certificates (2028), Photovoltaics (2029), Electrification Furnace (2029), Heat Pump (2029), Green Tariffs (2026–2030), Energy Efficiency (2026–2030); Gap; Target | Claude Code, verifier |
| D4 | Default filters, detail on | "Up/Downsizing (2020–2025)" = −7,000; "Energy Efficiency (2020–2025)" = −3,000; "Green Tariffs (2026–2030)" = −10,000; "Energy Efficiency (2026–2030)" = −1,000; no per-year Up/Downsizing, Energy Efficiency or Green Tariffs bar; no measure bar in 2020 | Claude Code, verifier |
| D5 | Default filters, "Show detail for past measures" off | 12 bars; one "Reductions" bar = −22,100 between Base and Actual; Actual still 97,900; planned bars unchanged (incl. Green Tariffs (2026–2030) and Energy Efficiency (2026–2030)) | Claude Code, verifier |
| D6 | Scope filter: Scope 1 only | Base 70,000; Actual 56,900; after planned 47,700; Target 35,000; Gap 12,700 | Claude Code, verifier |
| D7 | Scope filter: Scope 2 only | Base 50,000; Actual 41,000; after planned 26,000; Target 25,000; Gap 1,000 | Claude Code, verifier |
| D8 | Business filter: Stores only | Base 35,000; Actual 34,000; after planned 19,000; Target 17,500; Gap 1,500 | Claude Code, verifier |
| D9 | Scope filter: Scope 3 only (or no scope selected) | "No data for this selection"; no chart bars | Claude Code, verifier |
| D10 | "Show Business" on, default filters | Base segments Manufacturing 85,000 / Stores 35,000; Actual segments Manufacturing 63,900 / Stores 34,000; each bar's segments sum to its unstacked value | Claude Code, verifier |
| D11 | "Show Scope 1, 2, 3" on, default filters | Actual segments Scope 1 56,900 / Scope 2 41,000; Gap bar single colour 13,700, tooltip lists Scope 1 12,700 and Scope 2 1,000 | Claude Code, verifier |
| D12 | Slider −30 %, default filters | Target 84,000; Gap shown as "Target reached" with 10,300 beyond target; Target bar still drawn | Claude Code, verifier |
| D13 | Slider −40 %, "Show Scope 1, 2, 3" on, default filters | Target 72,000 (segments Scope 1 42,000 / Scope 2 30,000); Gap bar 1,700, tooltip lists Scope 1 5,700 and Scope 2 −4,000 (target exceeded) | Claude Code, verifier |
| D14 | Slider at its ends, default filters | 0 %: Target 120,000, "Target reached" with 46,300 beyond target. −99 %: Target 1,200, Gap 72,500. The slider offers nothing below 0 % or beyond −99 % | Claude Code, verifier |

**Screen checks**

| # | Screen | What must be true | Performed by |
|---|--------|-------------------|--------------|
| S1 | Roadmap — layout | Header with "The Company" lockup, title and subtitle "kt CO2 · Base year 2020 → Target 2030 (−50 %)"; filter bar (Scope, Business, disabled Scope 3 category showing "No Scope 3 data yet", Target reduction slider at −50 %); three toggles with their default states; chart; legend; summary line; footer. Brand fonts and colours from Section 10. | builder, verifier |
| S2 | Roadmap — colours | Default view: Base/Actual grey, Target black, done measures darker green, planned measures lighter green, Gap pink. Done vs. planned is clearly distinguishable. | builder |
| S3 | Roadmap — toggles | "Show Scope 1, 2, 3" stacks every bar by scope, and "Show Business" stacks every bar by business, each with its legend. Switching one on switches the other off. Planned segments are lighter than done segments. | builder |
| S4 | Roadmap — collapse | Switching "Show detail for past measures" off replaces all done bars with one "Reductions" bar; switching it on restores them. | builder |
| S5 | Roadmap — tooltip | Hovering a bar shows name, year (or span), value and status. A span column (e.g. Green Tariffs (2026–2030)) shows "… total over 5 years". The Target tooltip shows the chosen % vs. base year. In stacked mode the tooltip shows segment values. | builder |
| S6 | Roadmap — phone | At phone width (≈375 px) filters, slider and toggles wrap, the slider can be moved by touch, the chart scrolls horizontally inside its frame and the page has no sideways scroll. | builder, verifier |
| S7 | Roadmap — target slider | The slider starts at −50 %. Moving it to −30 % makes the Target bar taller, the Gap turns into "Target reached", and the subtitle and summary show −30 %; moving it to −70 % makes the Gap bar larger. The arrow keys move it in 1 % steps. A page reload returns it to −50 %. | builder, verifier |
| S8 | Roadmap — span columns | "Up/Downsizing (2020–2025)" and "Energy Efficiency (2020–2025)" each appear as ONE column directly before Actual; "Green Tariffs (2026–2030)" and "Energy Efficiency (2026–2030)" each as one column directly before Gap; no per-year Green Tariffs bars; the year band under the span columns reads their span. | builder, verifier |

**Refusal checks**

| # | Reference | Performed by |
|---|-----------|--------------|
| R1 | Not applicable — Tier 1, no database, no login, no access matrix. | — |

---

## Section 14 — Build Path

**This tool's tier:** Tier 1

### Pre-build steps — complete these before opening Claude Code

- [x] GitHub repo reused (`kirtanb-maker/GHG-Reduction-Roadmap`), open in Claude Code; Netlify site already connected (Branch to deploy: main)
- [x] The change, in the builder's own words, saved as `docs/intent-2026-11-20.md`
- [x] Updated Excel in the repo (`docs/source/GHG_reduction_roadmap.xlsx`, v1.2)
- [x] Tool Architect (Iteration Mode) — delta interview complete, this spec v1.2 written and confirmed by the builder
- [ ] Project Governor (Iteration Mode) — CLAUDE.md, PROGRESS.md and docs/checks.md updated to v1.2
- [x] Brand skill in the repo (`.claude/skills/the-company-brand/SKILL.md`)

### Tier 1 — build session (iteration, same session, on the session's branch)

- [ ] Claude Code reads product-spec.md, CLAUDE.md, PROGRESS.md and docs/checks.md, proposes the plan for the session; the builder approves; the plan goes into PROGRESS.md
- [ ] Claude Code re-converts the Excel into `src/data/roadmap.json` (check D1), adds the span columns and the target slider, runs the data and screen checks it can, pastes the results into PROGRESS.md, runs the verifier
- [ ] Claude Code pushes the branch (confirmed on GitHub) and opens the pull request (or gives the prefilled compare link); Netlify builds a Deploy Preview
- [ ] The builder says *checks*; Claude Code lists the builder rows as a numbered list of actions; the builder replies with the failed numbers or "all pass"; failures are fixed in the same session
- [ ] The builder merges the pull request and deletes the branch → main deploys; the session is done

### Tier 2 / Tier 3 — N/A

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| The brand skill describes The Company's tools as internal (non-public). This tool is a public link with no login, so anyone who has the URL can see the emission figures. Is that acceptable for these numbers? If not, a login goes on in a later iteration (Tier 3, see Section 12). | Builder — answered 20 November 2026: accepted for the MVP | No — resolved for now; revisit before sharing beyond the team |
| The Excel lists measure values per year range but no Scope 3 data yet. When Scope 3 arrives, which Scope 3 categories (GHG Protocol 1–15) will be used, and will they come in the same Excel format? | Builder | No |
| Is "Actual 2025" always the last year of done measures, or will the actual year move forward each year (e.g. 2026)? The data file carries it as a setting so it can be changed. | Builder | No |

---

## Section 16 — Tool Version History

Bump the version whenever the spec changes (the change lane). v1.x for an addition inside the same tier and access model; the next major version when the tier or the access model changes. Small bug fixes and UI polish (the fix lane) do not touch the spec.

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 20 November 2026 | Initial build |
| v1.2 | 20 November 2026 | Updated Excel (Base Scope 2 Manufacturing 20,000; EAC 2022 −9,000; "Efficiency measures" renamed "Energy Efficiency"); Up/Downsizing, Energy Efficiency and Green Tariffs shown as one column per time span (absorbs the agreed v1.1 change); target slider 0 to −99 % (default −50 %) recalculating Target, Gap and summary; display in kt CO2 written into the spec |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
