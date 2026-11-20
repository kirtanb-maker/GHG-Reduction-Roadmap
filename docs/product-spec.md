# Product Spec — GHG Reduction Roadmap

**Version:** 2.0
**Date:** 20 November 2026
**Author:** Kirtan Bergheim
**Status:** Confirmed
> The Tool Architect sets this to **Confirmed** when the builder confirms the Phase 10 summary. The Project Governor will not accept a spec in any other status.

---

## Section 1 — Tool Summary

**Tool name:** GHG Reduction Roadmap

**What it does:** A single interactive waterfall chart. It runs from the base-year emissions (2020), through every done reduction measure, to the actual emissions (2025). It then continues through every planned measure and the remaining gap to the 2030 target. Users can filter by Scope, Business and Scope 3 category. They can switch on stacked colouring by scope or by business, collapse past measures into one "Reductions" bar, and move a slider to try a different target reduction (0 to −99 %). From v2.0, anyone with the link can open **"Adjust measures"**: a panel listing every base-year row, done measure and planned measure. There they can edit, add and delete rows, see the chart recalculate as they type, and click **Save** to store the changes for everyone. **Undo last save** restores the roadmap as it was before the most recent Save.

**Who uses it:** The sustainability team at The Company (a global glass manufacturer) and the colleagues they share the link with. These people need to see, at a glance, how far decarbonisation has come and what is still missing to reach the target. They also need to keep the roadmap current as measures are planned, changed, completed or dropped.

**Why it exists:** The roadmap used to live in an Excel table, and every change meant editing the Excel and re-converting it through Claude Code. The tool turns it into one clear, filterable picture of base year → done measures → actual → planned measures → gap → target. From v2.0 the roadmap is kept up to date on the page itself, without touching the Excel or the code.

**Build status:** Iteration — previous version was v1.2: the waterfall on fixed data built into the code (`src/data/roadmap.json`, converted from the Excel), with span columns, the target slider, a public link and no database. This build (v2.0) moves every row into a Supabase database, seeded once from the current data. It adds the "Adjust measures" panel (edit every field of base-year rows, done and planned measures; New Measure; tick boxes and Delete; Save and Cancel; Undo last save), a live chart preview of unsaved edits, Netlify Functions for all reads and writes, and the "About this tool" page. The tier changes from 1 to 2.

---

## Section 2 — Classification

This section defines the architecture of the tool. Every downstream decision follows from this.

### Data Model

**Decision:** D3

| Label | What it means | This tool? |
|-------|--------------|-----------|
| D1 — Hardcoded | All data is written into the code by the developer. Users cannot input anything that persists. The tool displays what the developer put in. | No (was D1 up to v1.2) |
| D2 — Session | Data enters the tool during use and disappears when the tab closes. No database. Covers both uploaded files and form inputs. | No |
| D3 — Persisted | Data is written to a database and survives after the session ends. Supabase is required. | Yes |

**Reason:** Edits made in "Adjust measures" must be saved for everyone and still be there after the tab closes, so the roadmap rows live in a database.

**D3 is triggered if any of the following are true — check all that apply:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [x] An audit trail or history is needed (only the snapshot that makes "Undo last save" possible; no browsable history)
- [x] Data submitted by one person must be visible to another
- [ ] Results must be accessible via a URL after the session ends
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A1

| Label | What it means | This tool? |
|-------|--------------|-----------|
| A1 — Public | Anyone with the URL can use it. No login, no account required. | Yes |
| A2 — Authentication | Users must log in. All logged-in users see the same thing and have the same permissions. Admin work (creating users, maintaining lists) happens in the Supabase dashboard, not in the app; the moment one logged-in person has an admin action in the app, the tool is A3. | No |
| A3 — Authorization | Users must log in and have different roles. Different roles see different data or have different permissions. | No |

**Reason:** The builder chose, on 20 November 2026, that anyone with the link can view the chart and adjust the roadmap, with no login. A login for editing was offered as the recommended option and declined for this version; it stays on the backlog (Section 12). The risks of a public write are handled by the public-tool protections (Section 3), the hidden-but-restorable delete and "Undo last save".

> **Promotion rule:** Auth requires a database. If the access model is A2 or A3, the data model is D3 — even when all displayed content is fixed. D1/D2 combined with A2/A3 are not valid classifications; they resolve to D3.

> **Target, not state:** the access model here is what this tool is designed for. In the AILab workflow the Access Architect writes the write-only rules the moment this spec goes to D3, and the database is built with RLS on every table and those rules from the first table. Where the build actually stands lives in PROGRESS.md, never here.

---

### If Access Model is A2 — N/A

### If Access Model is A3 — N/A

No login is planned. No reading role behind a login is planned either, so there is no named first holder.

---

### Tier

**Tier:** 2

| Tier | D+A combination | Stack | Deployment |
|------|----------------|-------|------------|
| 1 | D1+A1 or D2+A1 | Netlify only | Netlify |
| 2 | D3+A1 | Netlify + Supabase (no auth) | Netlify |
| 3 | D3+A2 or D3+A3 | Netlify + Supabase (auth + RLS) | Netlify |

This is a Tier 2 tool: its data is stored in a database (Supabase), and anyone with the link uses it without a login.

---

### Standalone or Stack

**This tool is:** Standalone. It is the only tool in its Supabase project for now; the project is named after the organisation so later tools can join it.

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

The "Adjust measures" panel is a public form: anyone with the link can save, delete and undo.

| Detail | Answer |
|--------|--------|
| Protections | Every read and every write goes through Netlify Functions in the tool's repo (`roadmap` to read, `save-roadmap` to save, `undo-save` to undo). Only these functions hold the Supabase secret key; the browser never talks to the database and carries no Supabase key. The save function refuses an oversized body (over 50 KB or over 200 changed rows), validates every field against the rules in Section 9, refuses unknown fields and unknown or already-deleted row ids, and applies a Save completely or not at all. **Supersede rule:** the most recent Save wins; there is no conflict detection between two people editing at once. Delete is a soft delete: the row is hidden for everyone but kept in the database, marked with the time it was deleted, and can be restored. Before every Save, the function snapshots the rows it changes, so "Undo last save" can restore them. No anon policy and no anon grant on any table. No rate limit. |
| Bot check | **Bot check: not in this version (known risk, see caution).** The caution is in Section 15. |

---

## Section 4 — Stack and Deployment

### All Tiers

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind. The waterfall stays the hand-written SVG chart built in v1.0 (an allowed equivalent of Recharts, recorded in PROGRESS.md). Netlify Functions (in `netlify/functions/`) for reading and writing. |
| Deployment target | Netlify |
| Deployment | GitHub push → Netlify auto-deploy. **Always a branch, one per session (one intent):** Claude Code works on the session's branch and pushes it. It never pushes to main and never merges. The session ends with a pull request on GitHub, and Netlify builds a Deploy Preview of it (`deploy-preview-[n]--ghgreductionroadmap.netlify.app`, linked from the pull request). The builder does their checks there, merges on GitHub and deletes the branch; then main deploys. **A Deploy Preview talks to the one live database; there is no preview database.** Edits made while checking a preview are real edits, and "Undo last save" or the seed reset (Section 5) brings the data back. Iteration migrations are additive (never drop or rename in the same change), and a table with real rows is exported before a migration touches it. Netlify is NOT connected to Claude: no Netlify connector or MCP is used or needed in this workflow. The repo is already connected to the site (Branch to deploy: main). One new one-time builder step in the Netlify dashboard: connect Supabase to the site with the Supabase extension (below). |
| Supabase ↔ Netlify connection (Tier 2/3) | **The Supabase extension in Netlify, never copy-paste.** Netlify dashboard → Extensions → Supabase → Install; then on the site → Connect → sign into Supabase → pick the project `the-company-sustainability` and the framework Vite. The extension writes into the site's environment (variable names and key values to verify on the first live build, then recorded here): `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, plus the browser-side variables with the framework prefix (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; if Vite is not listed, choose Other and set the prefix to `VITE_`). This tool's functions read only the server-side variables; the browser-side ones are written but unused. Then redeploy. **When:** new project, so after Claude Code creates it early in the build session and before the first functional Deploy Preview. **Key check, once:** the values should start with `sb_` (publishable / secret); if they start with `eyJ` the extension wrote the retiring legacy keys. The public one is then replaced by hand with the publishable key, and rotating the secret one is a dated handover item. This is a Netlify-to-Supabase link, set once; it has nothing to do with Claude. |
| Platform owner | The builder (Kirtan Bergheim), on their own personal Netlify and Supabase accounts. |

**GitHub — pre-build requirement for all Tier 1, 2, and 3 tools:**
The repo `kirtanb-maker/GHG-Reduction-Roadmap` exists and is the tool's repo; this iteration keeps it. The Tool Architect, the Access Architect and the Project Governor run in Claude Code inside it. Their files sit in docs/ (intent notes, product-spec.md, checks.md, user-stories.md, access-matrix.md) and at the root (CLAUDE.md, PROGRESS.md, .claude/settings.json). The brand skill is at `.claude/skills/the-company-brand/SKILL.md`, and the source Excel at `docs/source/GHG_reduction_roadmap.xlsx`. Claude Code commits regularly, always on the session's branch, and every session ends with one pull request. It does not create or configure the repo.

---

### CONDITIONAL: Supabase project — Tier 2

**Supabase project status:** New — Claude Code will create it at the start of the build session.

**Supabase plan:** Free — for building, testing and exploring: no backups; paused after roughly one week without use. **Switches to Pro before the link is shared beyond the builder's own testing** (about 25 USD a month per organisation; daily backups kept 7 days; never paused). The handover package explains the cost.

**If new:**

| Detail | Answer |
|--------|--------|
| Proposed project name | the-company-sustainability |
| Confirmed project name | the-company-sustainability (confirmed by the builder on 20 November 2026) |
| Region | EU (Frankfurt, `eu-central-1`) |

> Claude Code will pause at the start of the session, confirm the project name, and create the Supabase project via MCP before building anything. The project ID will be recorded in supabase-setup.md once created.

**supabase-setup.md:**
Claude Code creates `docs/supabase-setup.md` in the build session and updates it every time it touches the database. It lives permanently in docs/ and records the project name, project ID, region, all tables and fields, RLS state and policies (none for anon), the database functions, and how to restore a deleted row and how to reset to the seed. It is the schema source of truth for all future build sessions.

---

### CONDITIONAL: Stack — N/A (standalone)

---

## Section 5 — Data Architecture

### D3

**Source of the first data:** the current data, i.e. `src/data/roadmap.json` as converted by `scripts/convert_excel.py` from `docs/source/GHG_reduction_roadmap.xlsx` (v1.2). Claude Code seeds the database with it once, in a named migration. **From then on the database is the source of truth**: the app no longer reads `roadmap.json`. The file and the Excel stay in the repo as the seed record and the fallback. Re-converting an Excel later would overwrite every edit made on the page, so it is an admin action: Claude Code does it only when the builder asks explicitly, after exporting the table.

**Settings stay in the code** (a settings file in `src/`, not in the database, not editable in the tool):

| Setting | Value |
|---------|-------|
| Base year | 2020 |
| Actual year | 2025 |
| Target year | 2030 |
| Target reduction vs. base year (default) | 50 % — the starting position of the target slider |
| Target slider range | 0 % to 99 %, steps of 1 % (shown as 0 % … −99 %) |
| Unit | t CO2 (stored and calculated in tonnes; displayed in kt CO2 on the chart; entered in t CO2 in the panel) |

The v1.2 one-column list ("Up/Downsizing", "Energy Efficiency", "Green Tariffs") is replaced by the per-row field `single_column`, seeded `true` for the rows with those names.

**What data is collected or stored in this tool:**

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|---------------------|-----------|----------------|-----------|
| id | Row identifier | Unique id | Automatic | Yes |
| row_type | Base-year row or measure | `base` / `measure` (cannot change after creation) | Seed, or the panel (New Measure → `measure`; New base row → `base`) | Yes |
| name | Measure name | Text, 1–60 characters, trimmed | Anyone, in the panel | Yes for measures; empty for base rows |
| start_year | Start year | Whole number | Anyone, in the panel | Yes (base rows: always 2020) |
| end_year | End year | Whole number, ≥ start_year | Anyone, in the panel | Yes (base rows: always 2020) |
| value_t | Emissions, t CO2 (negative = reduction, positive = increase) | Number, up to 1 decimal | Anyone, in the panel | Yes |
| scope | Scope | 1, 2 or 3 | Anyone, in the panel | Yes |
| scope3_category | Scope 3 category | GHG Protocol category number 1–15 (shown with its name, e.g. "1 Purchased goods and services") | Anyone, in the panel | Required when scope = 3; empty otherwise |
| business | Business unit | Text, 1–40 characters; chosen from the existing businesses or typed in as a new one | Anyone, in the panel | Yes |
| status | Done or planned | `done` / `planned` | Anyone, in the panel | Yes for measures; empty for base rows |
| single_column | Show as one span column | Yes / no | Anyone, in the panel | Yes (default no; only matters when start ≠ end) |
| sort_order | Position in the list and within a year | Whole number; seed = Excel row order; a new row goes to the end | Automatic | Yes |
| created_at / updated_at | When the row was created / last changed | Date and time | Automatic | Yes |
| created_by / updated_by | Who created / changed it | Empty (no login exists) | — | No |
| deleted_at | When the row was deleted (empty = visible) | Date and time | Automatic on Delete; cleared on restore or Undo | No |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|---------------|-----------|
| roadmap_rows | One row per base-year emission line or measure (4 base rows and 14 measures at seed) | id, row_type, name, start_year, end_year, value_t, scope, scope3_category, business, status, single_column, sort_order, created_at, updated_at, deleted_at |
| roadmap_saves | One row per Save: the state, before the Save, of every row that Save changed (including rows it created, so Undo can remove them) | id, saved_at, rows_before (snapshot), undone_at |

The save function keeps the 20 most recent saves and removes older ones. They are not shown in the tool; only the latest Save that has not been undone can be undone.

**Main record and its states:**

| Detail | Answer |
|--------|--------|
| Main record | One row of `roadmap_rows` = one base-year emission line or one measure |
| States, in order | Measures: planned ⇄ done (either way, through the panel). Any row: visible → deleted (soft; `deleted_at` set) → visible again (restored by the builder or by Undo). No final state. |
| Login-ready columns | Seeded by the Governor: `created_by` and `updated_by` (empty; no login exists or is planned), `status`, `created_at`, `updated_at`. No `profiles` table: Section 6 names no login target. |

**File storage:** No

**Derived or calculated data:** Yes. Actual, Gap and Target (from the slider), the per-year split of multi-year measures, the span columns and the "Reductions" bar are calculated in the browser from the visible rows plus any unsaved edits (Section 9). None of them is stored.

---

## Section 6 — Access and Permissions

### CONDITIONAL: A2/A3 only — N/A (A1, public link, no login)

Everyone with the link has the same rights: view the chart, and adjust, add, delete and undo through the panel. They do this only through the tool's functions, never against the database directly. The rules the database itself enforces (anon: nothing on any table; the functions write with the secret key) live in `docs/access-matrix.md`, produced by the Access Architect's short run; Claude Code builds them from that file. This section does not duplicate them.

---

## Section 7 — GDPR

**GDPR outcome:** Not applicable — confirmed by the builder on 20 November 2026. The tool stores only emissions figures and measure names, per scope, business unit and year. It collects no names, emails or other information about people through its panel, and it has no login, so there are no user accounts.

**Personal data the tool holds:** none. (No login identities: the tool has no login.) Netlify and Supabase may log technical request data such as IP addresses as part of hosting; the tool itself stores none.

---

## Section 8 — Screen and UI Structure

Two views: the Roadmap (with the "Adjust measures" panel) and About this tool.

### Roadmap (the main screen)

- **Purpose:** Show the GHG reduction pathway from base year to target as a waterfall, filterable and switchable between a plain view and a stacked, colour-coded view. Let anyone keep the roadmap rows current.
- **What is visible, top to bottom:**
  1. **Header:** "The Company" text lockup (Spectral Medium, per the brand skill; no logo yet) and the page title "GHG Reduction Roadmap" (Spectral). The subtitle shows the unit, period and chosen target: "kt CO2 · Base year 2020 → Target 2030 (−50 %)"; the percentage follows the slider.
  2. **Filter bar:**
     - **Scope**: multi-select chips "Scope 1", "Scope 2", "Scope 3". All selected by default. While no Scope 3 row exists, "Scope 3" carries a small "no data yet" hint.
     - **Business**: multi-select chips, one per business found in the visible rows ("Manufacturing", "Stores" at seed). All selected by default. A new business typed into the panel appears as a new chip, selected.
     - **Scope 3 category**: a dropdown, disabled while no row has a Scope 3 category, showing "No Scope 3 data yet". Once one exists, it lists the categories that occur (multi-select, all by default) and filters Scope 3 rows only. Scope 1/2 rows are unaffected by it.
     - **Target reduction**: a slider labelled "TARGET REDUCTION" with the current value next to it (e.g. "−50 %"). Range 0 % to −99 % in steps of 1 %; starts at −50 % (the settings). It is the browser's standard range control, so it works with the keyboard and by touch. Moving it recalculates the Target, the Gap / "Target reached", the stacked segments, the summary line and the subtitle instantly. It is not a filter: it changes no rows, and it is never saved.
  3. **Toggles (switches):**
     - **Show Scope 1, 2, 3** — off by default.
     - **Show Business** — off by default.
     - **Show detail for past measures** — on by default.
     - "Show Scope 1, 2, 3" and "Show Business" are mutually exclusive: switching one on switches the other off.
  4. **The waterfall chart** (see "Chart behaviour" below), with a legend. While unsaved edits exist, a small label above the chart reads "Preview — unsaved changes".
  5. **Summary line under the chart:** Base, Actual, Target, Gap (or "Target reached") in kt CO2 for the current filter and target, with % vs. base for Actual, Target (the slider's value) and Gap.
  6. **"Adjust measures" button** under the summary line, with the **"Undo last save"** button next to it (see the panel).
  7. **The "Adjust measures" panel** (folded away by default; see below).
  8. **Footer:** "Data: live roadmap database · last saved [date and time of the latest Save, or 'seeded from the Excel (v1.2)' if none]", the tool version (v2.0), and a link "About this tool".
- **Loading and failure:** while the rows load, the chart area shows "Loading roadmap…". If the read function fails (for example a paused Free project), the chart area shows "Roadmap data could not be loaded. Please try again later." and the panel cannot be opened. There is no fallback to old numbers.
- **User actions:** select or deselect filter chips; move the target slider; switch the three toggles; hover (desktop) or tap (phone) a bar to see its tooltip; open the panel and adjust rows; Undo last save.
- **What happens next:** filters, slider and toggles recalculate in the browser and are never saved; a reload returns them to the defaults (target −50 %). Row edits are stored only on Save. Other viewers see a Save when they next load or reload the page.

#### "Adjust measures" panel

Clicking **Adjust measures** unfolds a panel below the chart (white card, brand styling). The button label changes to "Close measures". Closing with unsaved edits asks "Discard your unsaved changes?" (Discard / Keep editing).

- **Three groups, each a table**, with headers in uppercase DM Sans:
  1. **Base year 2020**: one line per base row. Columns: tick box, Scope, Scope 3 category, Business, t CO2. A **New base row** button under the group adds an empty base line.
  2. **Done measures**, and 3. **Planned measures**: one line per measure, in `sort_order`. Columns: tick box, Name, Done/Planned, Scope, Scope 3 category, Business, Start year, End year, One column (checkbox), t CO2. Changing Done/Planned moves the line to the other group as soon as the change is made; the years must then fit the new status (Section 9).
- The panel lists **every visible row, whatever the filters and toggles are set to**, so nothing is hidden from editing.
- **Fields:** Name is a text field; Done/Planned, Scope and Start/End year are dropdowns (years limited to the status's range); Scope 3 category is a dropdown of the 15 GHG Protocol categories, enabled only when Scope = 3 (switching away from Scope 3 clears it); Business is a dropdown of the existing businesses plus "New business…", which turns it into a text field; One column is a checkbox, enabled only when start ≠ end; t CO2 is a number field.
- **Buttons, above the tables:** **New Measure** (adds an empty planned line at the end of Planned measures: name empty, Scope 1, the first business, years 2030–2030, one column off, 0 t; the cursor goes into its Name field), **Delete** (enabled when at least one tick box is ticked; removes the ticked lines from the panel and the chart preview; a counter shows "[n] rows to delete"), **Save** (enabled when there are changes and no field is invalid), **Cancel** (throws away every unsaved change, after "Discard your unsaved changes?").
- **Live preview:** every change (edit, new line, delete) updates the chart, summary, Gap and filter chips immediately, before Save. Changed lines carry a small "changed" marker, new lines "new".
- **Validation in the panel:** an invalid field is outlined and shows its message under it (e.g. "Name is required", "Planned measures run 2026–2030", "Choose a Scope 3 category", "Enter a number"). A line with an invalid field is left out of the chart preview until it is fixed, and Save stays disabled. The same rules are checked again by the save function (Section 9).
- **Save:** sends all changes in one request. While it runs the button reads "Saving…". **Success:** the panel shows "Saved for everyone · [time]", the markers clear, the footer's "last saved" updates, and Undo last save becomes available. **Refused or failed:** the panel shows the function's message, naming the row and field where there is one ("Planned measures run 2026–2030 — Heat Pump (row 6)") or "Could not save. Your changes are still here; please try again." Nothing is stored and every edit stays in the panel.
- **Undo last save** (next to the Adjust measures button): enabled only when the latest Save has not been undone and there are no unsaved edits (otherwise its hint reads "Save or cancel your changes first"). Clicking it asks "Undo the last save from [date, time]? This restores every row it changed, for everyone, even if someone else made it." (Undo / Keep). On Undo the rows return to their state before that Save: edits reverted, rows it created removed, rows it deleted visible again. The message "Last save undone" appears, and the button is disabled until the next Save. Undo cannot be undone.
- **Deleted rows** disappear from the chart and the panel for everyone after Save. They stay in the database with `deleted_at` set, and the builder restores one by clearing `deleted_at` in the Supabase Table Editor, or by asking Claude Code. This is described in docs/supabase-setup.md.
- **Phone width:** the panel's tables scroll horizontally inside their own frame (like the chart); the buttons wrap; the page never scrolls sideways.

**Chart behaviour:**

- **X-axis: the bars in this order.**
  1. **Base year 2020.**
  2. **The done measures**, one bar per measure per year, sorted by year, then by `sort_order`; then the done **span columns** (see below), in `sort_order`, directly before Actual.
  3. **Actual 2025.**
  4. **The planned measures**, one bar per measure per year, in the same order; then the planned span columns, directly before Gap.
  5. **Gap.**
  6. **Target 2030.**
  - **Span columns:** a multi-year measure with `single_column` = yes is shown as ONE column for its whole span instead of one per year, labelled "Name (start–end)", e.g. "Up/Downsizing (2020–2025)", "Energy Efficiency (2020–2025)", "Green Tariffs (2026–2030)", "Energy Efficiency (2026–2030)". Its value is the measure's full value. A multi-year measure with `single_column` = no is split per year (Section 9).
  - Measure labels read "Name (year)", e.g. "Electric Boiler (2023)", or "Name (start–end)" for a span column. Under the bars, the axis shows the year groups (2021, 2022, …) so the year progression is visible; under a span column the band shows its span ("2020–2025").
  - Rows that share a measure name and a year (or the same span, both flagged one column) are merged into one bar (e.g. Up/Downsizing for Manufacturing and for Stores). Stacking shows the split.
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
  - Any additional business gets the next brand accent, blue `#8DBAED`.
- **Gap bar in stacked mode:** drawn as one bar in the gap colour (the net gap for the current filter), not stacked. Its tooltip lists the gap per segment, including any segment that already over-achieves its target (shown as "−4.0 kt (target exceeded)").
- **Legend:** shows the colours in use, including "Done" and "Planned" shades.
- **Tooltip:** shows the bar name, year (or span), value in kt CO2 and status (Done/Planned). In stacked mode it also shows the value per segment. For a per-year piece of a split multi-year measure it adds: "part of [name] [start]–[end], total [value] spread over [n] years". For a span column it adds: "[name] [start]–[end], total over [n] years". The Target tooltip names the chosen reduction (e.g. "−50 % vs. base year").
- **Empty selection:** if the filters leave no rows (no scope selected, no business selected, or Scope 3 only while no Scope 3 row exists), the chart area shows "No data for this selection" instead of an empty chart.
- **Phone width:** the filter bar and toggles wrap. If the chart has more bars than fit, it scrolls horizontally inside its own frame; the page itself never scrolls sideways.

### About this tool — standard view on every D3 tool (built last, before deploy)

- **Purpose:** Tell the people who use the tool what it is, who runs it and what happens to the data. Operational transparency.
- **What is visible:**
  - **What it is for and who runs it:** The Company's GHG reduction roadmap, run by the sustainability team (Kirtan Bergheim), with a contact address supplied by the builder (Section 15).
  - **What it stores:** emissions figures and measure names per scope, Scope 3 category, business unit and year; no personal data and no user accounts.
  - **Who can change it:** anyone with the link. Saves are visible to everyone, deleted rows can be restored by the team, and the most recent Save can be undone.
  - **Where the data is kept and processed:** Supabase (EU, Frankfurt) and Netlify.
  - **How long it is kept:** for as long as the roadmap is in use. Deleted rows are kept, hidden, until the team removes them. For corrections, contact the address above.
  - **Login:** none.
  - **Version and update:** version 2.0, last updated [the build date].
- **User actions:** read; follow the contact link; "Back to the roadmap".
- **What happens next:** nothing; it is a page. Linked from the footer of the Roadmap.

---

## Section 9 — Logic and Calculations

**What is calculated:** the per-year split of multi-year measures, the span columns, the running totals, Actual, Target, Gap and the collapsed "Reductions" bar. They are always calculated for the rows that pass the current filters, with the panel's unsaved edits applied, and for the target reduction chosen on the slider. The save function also validates every change.

**Inputs:** the visible rows of `roadmap_rows` (from the read function), with any unsaved panel edits applied; the settings (base year, actual year, target year, default target reduction); the filters by Scope, Business and Scope 3 category; and the slider's target reduction r (0–99 %, default 50 %).

**Formula or rules:**

1. **Filter first.** Every calculation below uses only the rows whose scope, business and Scope 3 category are selected. Rows with `deleted_at` set are never read.
2. **Span columns.** A multi-year measure (start < end) with `single_column` = yes is NOT split. It becomes one bar "Name (start–end)" carrying its full value, placed after the per-year bars of its status (done: directly before Actual; planned: directly before Gap), in `sort_order`. Rows with the same name, the same span and `single_column` = yes merge. Example: Up/Downsizing Manufacturing −6,000 + Stores −1,000 → "Up/Downsizing (2020–2025)" −7,000.
3. **Splitting the other multi-year measures.** For a measure with start < end and `single_column` = no:
   - If the start year equals the base year, the measure spreads over start+1 … end. Example: 2020–2025 → 2021–2025, 5 years.
   - Otherwise it spreads over start … end inclusive. Example: 2026–2030 → 5 years.
   - Each year receives value ÷ number of years. Example: Green Tariffs −10,000 over 2026–2030 with one column off → "Green Tariffs (2026)" … "(2030)" at −2,000 each.
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

**Validation rules** (checked in the panel and again by the save function, which refuses the whole Save if any rule fails):

| Field | Rule |
|-------|------|
| Request | Body at most 50 KB; at most 200 changed rows (edits + new + deletes); only the known fields; every id exists and is not deleted |
| row_type | `base` or `measure`; cannot change on an existing row |
| name | Measures: required, 1–60 characters after trimming. Base rows: empty |
| status | Measures: `done` or `planned`. Base rows: empty |
| start_year / end_year | Whole numbers, start ≤ end. Base rows: 2020–2020 (not editable). Done measures: within 2020–2025, and a single-year done measure in 2021–2025. Planned measures: within 2026–2030 |
| value_t | A number with at most one decimal. Base rows: 0 to 10,000,000. Measures: −1,000,000 to +1,000,000, not 0 |
| scope | 1, 2 or 3 |
| scope3_category | 1–15 when scope = 3 (required); empty otherwise |
| business | 1–40 characters after trimming |
| single_column | yes or no; stored as no when start = end |

**Save and Undo:**
- **Save** applies all edits, new rows and deletes in one transaction, after recording in `roadmap_saves` the state before the Save of every row it touches. Either everything is stored or nothing is. Delete sets `deleted_at`; it never removes the row. The last Save wins; there is no check whether someone else saved in between.
- **Undo last save** takes the newest `roadmap_saves` entry not yet undone and puts every row it lists back exactly as recorded: edited rows get their old values, rows the Save created get `deleted_at` set, and rows the Save deleted get `deleted_at` cleared. It then marks the entry undone. Only the newest entry can be undone, and only once. If the newest entry is already undone, Undo is unavailable until the next Save.
- **Reset to the seed** (admin, Claude Code only, on request): export the table, then restore the 18 seed rows and hide every other row.

**Output:** the chart bars, the tooltips, the subtitle's target percentage, the summary line (Base, Actual, Target, Gap / Target reached), the panel's validation messages and the saved rows.

**Edge cases:**
- **No rows after filtering:** show "No data for this selection"; no zero-height chart.
- **Measures but no base rows in the selection** (e.g. Scope 3 selected once a Scope 3 measure exists): show the waterfall from 0 and a note "No base-year emissions in this selection".
- **Positive measure values:** drawn as upward steps in the same Done/Planned colours.
- **Slider at 0 %:** Target = Base; with any net reduction the Gap shows "Target reached". **Slider at −99 %:** Target = 1 % of Base. The slider cannot go below 0 % or beyond −99 %.
- **A one-column measure that is single-year:** shown as a normal single-year bar.
- **Every row deleted:** the chart shows "No data for this selection"; the panel shows the empty groups with their New buttons.
- **A row outside the year rules that reached the database by another route** (e.g. edited in the Supabase dashboard): a measure dated before the base year or after the target year is excluded from the chart and listed in the browser console as a data warning; a done measure after the actual year, or a planned measure on or before it, is shown where its status puts it and flagged in the console.
- **Two people edit at once:** the later Save wins; the earlier editor sees the other person's changes on reload. Undo reverts only the newest Save, whoever made it.
- **The read or save function is unreachable:** see Section 8 (loading and failure; Save failure keeps the edits).

---

## Section 10 — Brand and Visual Direction

**Brand reference:** Brand skill `the-company-brand`, already installed at `.claude/skills/the-company-brand/SKILL.md`. Claude Code applies it as the UI tokens, including for the panel's tables, fields, buttons and messages.

The brand skill covers:
- **Colours:** black text; grey `#8C8985` for labels and inactive states; warm panel `#F0EEE4` for chips and the filter panel; off-white `#FAFAF7` page background; white cards.
- **Accents:** green `#77BB78`, blue `#8DBAED`, pink `#F8AAB6`, yellow `#FCCF61`, with their tints.
- **Fonts:** Spectral for titles and DM Sans for body text, loaded from Google Fonts. Labels and toggles are uppercase letter-spaced DM Sans.
- **Logo:** none; the "The Company" text lockup in Spectral Medium.

The chart colour mapping is fixed in Section 8. The panel uses the brand's neutral tokens; no Tailwind gray/blue defaults.

**Visual feel:** Clean, calm and professional. The chart is the hero on a white card on the off-white page. The filters and toggles sit in a warm-neutral panel above it; the "Adjust measures" panel is a white card below it, compact and table-like.

**Reference or inspiration:** A classic corporate decarbonisation waterfall (base year → measures → actual → planned → gap → target), with a spreadsheet-like editing table underneath.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|--------------------------|-------------|-------------------|
| Google Fonts | Loads Spectral and DM Sans | None | — |
| Supabase | Database (`roadmap_rows`, `roadmap_saves`); no Auth, no file storage | **Secret key** (`sb_secret_…`; server-side only, bypasses RLS) used by the three Netlify Functions. The **publishable key** is written by the extension but not used: the browser never talks to Supabase. | Netlify environment variables, written by the Supabase extension; value checked once (starts with `sb_`) |
| Public-tool protections (A1) | Every read and write goes through the Netlify Functions; the save function refuses an oversized body, validates every field, applies the last-save-wins rule; no anon policy or grant. No rate limit. No bot check (Section 3). | None (uses the Supabase secret key above) | — |

> **Security rule — no exceptions:** No API key, token, password, or credential may appear in any HTML file, any JavaScript file, or any file committed to GitHub. Keys used by Netlify Functions are stored as **Netlify environment variables**. Claude Code must enforce this regardless of tier or context.

**Environment variable contract — the exact names Claude Code reads, never a value:**

| Variable name (exact) | Read by | Set where | Public or secret |
|-----------------------|---------|-----------|------------------|
| `SUPABASE_DATABASE_URL` | Netlify Functions (`roadmap`, `save-roadmap`, `undo-save`): the project's API URL | Netlify env, written by the Supabase extension | secret (kept server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify Functions only | Netlify env, written by the Supabase extension | **secret**; its value is the **secret** key (`sb_secret_…`); never `VITE_`-prefixed, never in client code; the variable keeps its historical name |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Not read by this tool | Netlify env, written by the Supabase extension | public; left in place, unused |

> The Supabase variable names and values above are recorded from the extension's documentation and are **verified on the first live build**. If the extension writes different names or legacy values, this table, CLAUDE.md and supabase-setup.md are corrected in the same session. After connecting the extension the builder looks at the values once: `sb_` is right; `eyJ` means the legacy keys were written, and rotating to the new secret key is a dated handover item. The Project Governor derives its environment-variable list from this table and from nothing else.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|----------------|
| Supabase URL, secret (service role) key | Written into Netlify by the Supabase extension once Claude Code has created the project | Netlify → Extensions → Supabase; site → Connect |
| Supabase account | The builder's own (to be created at supabase.com if it does not exist yet, before the build session) | supabase.com |

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-----------------|----------------------|
| Logins / user accounts (e.g. editing only for named people) | Declined for v2.0 in favour of an open link; would make the tool Tier 3 (login plus access rules) |
| Bot check (Cloudflare Turnstile) on Save | Not in this version; known risk, see the caution in Section 15. About 15 minutes to add on request |
| A browsable change history ("who changed what, when") | Only the snapshot behind "Undo last save" is kept; without a login there is no "who" |
| Undo of more than the last Save | One step is enough to recover from a mistake; older snapshots stay in the database for Claude Code |
| Live push of other people's Saves without a reload | Reload is enough for a small team |
| Editing the settings in the tool (base, actual and target year, default target, slider range) | Stay in the code; a change to them is a fix-lane request to Claude Code |
| Uploading a new Excel in the browser to redraw the chart | The panel replaces it; re-conversion stays an admin action through Claude Code |
| Downloads (PNG of the chart, CSV of the data) | Keep the tool lean |
| Stacking by Scope and Business at the same time | Clashes with the Done/Planned shading; the two toggles are mutually exclusive for now |

---

## Section 13 — Acceptance Criteria (the checks)

The Project Governor writes this section out as `docs/checks.md`. The known input is the seed: the 18 rows of `src/data/roadmap.json` (v1.2), also kept as the fixture `src/fixtures/roadmap-seed.json`. The calculation checks D2–D14 run against that fixture and against the seeded database. The edit checks D15–D24 run through the Netlify Functions against the live database (locally with `netlify dev`, or on the Deploy Preview), and each ends by restoring the seed. All values are in tonnes (the screen shows kt). A failing check is fixed in the tool, never in the check.

**Data checks**

| # | Given (data and filter) | Expected result | Performed by |
|---|---------------------------|-----------------|--------------|
| D1 | The database after the seed migration, compared to `docs/source/GHG_reduction_roadmap.xlsx` (v1.2) and `src/data/roadmap.json` | 4 base rows (total 120,000; Scope 2 Manufacturing 20,000) and 14 measure rows, with names, years, values, scopes, businesses and statuses matching the v1.2 data; `single_column` = yes exactly on the Up/Downsizing, Energy Efficiency and Green Tariffs rows; no Actual/Gap/Target rows; `roadmap_saves` empty; RLS on for both tables | Claude Code, verifier |
| D2 | Seed, default filters, detail on, slider −50 % | Base 120,000; Actual 97,900; running total after planned 73,700; Target 60,000; Gap 13,700 | Claude Code, verifier |
| D3 | Seed, default filters, detail on | 17 bars in this order: Base; CHP shutdown (2021), Energy Attribute Certificates (2022), Electric Boiler (2023), Photovoltaics (2024), Up/Downsizing (2020–2025), Energy Efficiency (2020–2025); Actual; Electric Boiler (2027), Energy Attribute Certificates (2028), Photovoltaics (2029), Electrification Furnace (2029), Heat Pump (2029), Green Tariffs (2026–2030), Energy Efficiency (2026–2030); Gap; Target | Claude Code, verifier |
| D4 | Seed, default filters, detail on | "Up/Downsizing (2020–2025)" = −7,000; "Energy Efficiency (2020–2025)" = −3,000; "Green Tariffs (2026–2030)" = −10,000; "Energy Efficiency (2026–2030)" = −1,000; no per-year Up/Downsizing, Energy Efficiency or Green Tariffs bar; no measure bar in 2020 | Claude Code, verifier |
| D5 | Seed, default filters, "Show detail for past measures" off | 12 bars; one "Reductions" bar = −22,100 between Base and Actual; Actual still 97,900; planned bars unchanged | Claude Code, verifier |
| D6 | Seed, Scope 1 only | Base 70,000; Actual 56,900; after planned 47,700; Target 35,000; Gap 12,700 | Claude Code, verifier |
| D7 | Seed, Scope 2 only | Base 50,000; Actual 41,000; after planned 26,000; Target 25,000; Gap 1,000 | Claude Code, verifier |
| D8 | Seed, Stores only | Base 35,000; Actual 34,000; after planned 19,000; Target 17,500; Gap 1,500 | Claude Code, verifier |
| D9 | Seed, Scope 3 only (or no scope selected) | "No data for this selection"; no chart bars | Claude Code, verifier |
| D10 | Seed, "Show Business" on | Base segments Manufacturing 85,000 / Stores 35,000; Actual segments Manufacturing 63,900 / Stores 34,000; each bar's segments sum to its unstacked value | Claude Code, verifier |
| D11 | Seed, "Show Scope 1, 2, 3" on | Actual segments Scope 1 56,900 / Scope 2 41,000; Gap bar single colour 13,700, tooltip lists Scope 1 12,700 and Scope 2 1,000 | Claude Code, verifier |
| D12 | Seed, slider −30 % | Target 84,000; "Target reached" with 10,300 beyond target; Target bar still drawn | Claude Code, verifier |
| D13 | Seed, slider −40 %, "Show Scope 1, 2, 3" on | Target 72,000 (Scope 1 42,000 / Scope 2 30,000); Gap bar 1,700, tooltip lists Scope 1 5,700 and Scope 2 −4,000 (target exceeded) | Claude Code, verifier |
| D14 | Seed, slider at its ends | 0 %: Target 120,000, "Target reached" with 46,300 beyond target. −99 %: Target 1,200, Gap 72,500. Nothing below 0 % or beyond −99 % | Claude Code, verifier |
| D15 | Save: Heat Pump (2029) planned −2,200 → −3,200 | Saved; after reload: after planned 72,700; Gap 12,700; `updated_at` set on that row only | Claude Code, verifier |
| D16 | Save: new measure "Test Measure", planned, 2030–2030, −1,000, Scope 1, Manufacturing | Saved; "Test Measure (2030)" appears after Heat Pump (2029) and before the planned span columns; after planned 72,700; Gap 12,700 | Claude Code, verifier |
| D17 | Save: delete Green Tariffs (2026–2030) | After planned 83,700; Gap 23,700; the row is still in `roadmap_rows` with `deleted_at` set and is absent from the read function's answer; clearing `deleted_at` brings back Gap 13,700 | Claude Code, verifier |
| D18 | Save: done measure Photovoltaics (2024) −600 → −1,600 | Actual 96,900; after planned 72,700; Gap 12,700 | Claude Code, verifier |
| D19 | Save: base row Scope 2 Stores 30,000 → 40,000 | Base 130,000; Actual 107,900; after planned 83,700; Target 65,000; Gap 18,700 | Claude Code, verifier |
| D20 | Save: Electric Boiler (2027) planned → done, years 2025–2025 | Actual 93,900; after planned 73,700; "Electric Boiler (2025)" among the done bars before the done span columns; no Electric Boiler (2027) bar | Claude Code, verifier |
| D21 | Save: Green Tariffs one column → off | Five bars "Green Tariffs (2026)" … "(2030)" at −2,000 each, in their years; totals unchanged (Gap 13,700) | Claude Code, verifier |
| D22 | After D19's Save: Undo last save | Base 120,000 and every row equal to the seed; Undo unavailable until the next Save; Undo after a Save that created a row (D16) hides that row; Undo after a Save that deleted a row (D17) shows it again | Claude Code, verifier |
| D23 | Save refused, one call each: body over 50 KB; 201 changed rows; planned measure 2031; done measure 2026; Scope 3 without category; Scope 1 with a category; empty name; value 0; value "abc"; base row value −1; unknown field; unknown id; changing row_type | Each refused with a message naming the row and field (or the size); no row changed and no `roadmap_saves` entry created | Claude Code, verifier |
| D24 | Save: new measure "Supplier engagement", planned, 2028, −500, Scope 3, category 1, Manufacturing | The Scope 3 chip loses "no data yet"; the Scope 3 category dropdown is enabled and lists "1 Purchased goods and services"; default view after planned 73,200, Gap 13,200; Scope 3 only: the waterfall from 0 with "No base-year emissions in this selection" | Claude Code, verifier |
| D25 | The built site (`dist/`) and the browser's network calls | No Supabase key or URL in the bundle; the browser calls only `/.netlify/functions/…`; `netlify.toml` has the build command, `dist` and the functions folder; `npm run build` succeeds | Claude Code, verifier |

**Screen checks**

| # | Screen | What must be true | Performed by |
|---|--------|-------------------|--------------|
| S1 | Roadmap — layout | Header with "The Company" lockup, title and subtitle "kt CO2 · Base year 2020 → Target 2030 (−50 %)"; filter bar (Scope, Business, disabled Scope 3 category showing "No Scope 3 data yet", Target reduction slider at −50 %); three toggles with their default states; chart; legend; summary line; "Adjust measures" and "Undo last save" buttons; footer with "last saved", v2.0 and "About this tool". Brand fonts and colours from Section 10. | builder, verifier |
| S2 | Roadmap — colours | Default view: Base/Actual grey, Target black, done measures darker green, planned measures lighter green, Gap pink. Done vs. planned is clearly distinguishable. | builder |
| S3 | Roadmap — toggles | "Show Scope 1, 2, 3" stacks every bar by scope, and "Show Business" stacks every bar by business, each with its legend. Switching one on switches the other off. Planned segments are lighter than done segments. | builder |
| S4 | Roadmap — collapse | Switching "Show detail for past measures" off replaces all done bars with one "Reductions" bar; switching it on restores them. | builder |
| S5 | Roadmap — tooltip | Hovering a bar shows name, year (or span), value and status. A span column (e.g. Green Tariffs (2026–2030)) shows "… total over 5 years". The Target tooltip shows the chosen % vs. base year. In stacked mode the tooltip shows segment values. | builder |
| S6 | Roadmap — phone | At phone width (≈375 px) filters, slider, toggles and panel buttons wrap, the slider can be moved by touch, the chart and the panel tables scroll horizontally inside their frames and the page has no sideways scroll. | builder, verifier |
| S7 | Roadmap — target slider | The slider starts at −50 %. Moving it to −30 % makes the Target bar taller, the Gap turns into "Target reached", and the subtitle and summary show −30 %; moving it to −70 % makes the Gap bar larger. The arrow keys move it in 1 % steps. A page reload returns it to −50 %. | builder, verifier |
| S8 | Roadmap — span columns | "Up/Downsizing (2020–2025)" and "Energy Efficiency (2020–2025)" each appear as ONE column directly before Actual; "Green Tariffs (2026–2030)" and "Energy Efficiency (2026–2030)" each as one column directly before Gap; the year band under the span columns reads their span. | builder, verifier |
| S9 | Adjust measures — panel | Clicking "Adjust measures" unfolds the panel with three groups (Base year 2020: 4 lines; Done measures: 7; Planned measures: 7), each line with its tick box and fields as in Section 8, whatever the filters are set to; New Measure, New base row, Delete (disabled), Save (disabled) and Cancel are visible; the button reads "Close measures". | builder, verifier |
| S10 | Adjust measures — edit, preview, save | Changing Heat Pump to −3,200 t updates the chart and summary at once and shows "Preview — unsaved changes"; Save shows "Saved for everyone"; opening the site in a second browser (or a private window) shows the new value; a reload keeps it. | builder |
| S11 | Adjust measures — new measure | New Measure adds an empty planned line with the cursor in Name; Save is disabled with "Name is required" until a name is typed; after a name, a year and a value, the bar appears in the preview and is stored on Save. | builder |
| S12 | Adjust measures — delete | Ticking two lines enables Delete and shows "2 rows to delete"; Delete removes them from the panel and the chart; Save stores it; after a reload they are gone. | builder |
| S13 | Adjust measures — cancel and close | After edits, Cancel asks "Discard your unsaved changes?"; Discard restores the saved state in the panel and chart. Closing the panel with edits asks the same. | builder |
| S14 | Undo last save | After a Save, "Undo last save" is enabled; with unsaved edits it is disabled with "Save or cancel your changes first"; clicking it asks for confirmation with the Save's time; Undo restores the previous values (and deleted rows) for everyone, shows "Last save undone", and the button is disabled again. | builder, verifier |
| S15 | Adjust measures — validation and status | A planned line set to 2031 is impossible (the year list stops at 2030); switching a line from Planned to Done moves it to Done measures and flags its year until it fits 2020–2025; Scope 3 enables the category dropdown and requires a category; an invalid line is left out of the preview and Save stays disabled. | builder |
| S16 | Roadmap — data unavailable | With the read function failing (simulated locally), the chart area shows "Roadmap data could not be loaded. Please try again later." and the panel cannot be opened; a failed Save keeps every edit in the panel with "Could not save…". | Claude Code, verifier |
| S17 | About this tool | Linked from the footer; shows what the tool is for, who runs it with a contact, what it stores (no personal data), that anyone with the link can change it, Supabase (EU, Frankfurt) and Netlify, retention and correction route, "Login: none", version 2.0 and the date; "Back to the roadmap" returns. | builder, verifier |

**Refusal checks**

| # | Reference | Performed by |
|---|-----------|--------------|
| R1 | Every `no` cell in `docs/access-matrix.md` (the short run): with the publishable key and no key, direct REST calls to `roadmap_rows` and `roadmap_saves` (select, insert, update, delete) are all refused; the functions are the only way in. No `own` cells exist (no login). | Claude Code (through the API), verifier |
| R2 | The function boundary: the save and undo functions refuse a GET and any other method than POST; the read function never returns rows with `deleted_at` set; D23's refusals leave the data unchanged. | Claude Code, verifier |

---

## Section 14 — Build Path

**This tool's tier:** Tier 2

### Pre-build steps — complete these before the build

- [x] GitHub repo reused (`kirtanb-maker/GHG-Reduction-Roadmap`), open in Claude Code; Netlify site already connected (Branch to deploy: main)
- [x] The change, in the builder's own words, saved as `docs/intent-2026-11-20-b.md`
- [x] Tool Architect (Iteration Mode) — delta interview complete, this spec v2.0 written and confirmed by the builder
- [ ] Access Architect, short run — population pattern "public stays anonymous"; `docs/access-matrix.md` and `docs/user-stories.md` in their short form (the write-only rules: anon reaches no table; all reads and writes through the functions), written against spec v2.0. Two minutes.
- [ ] Project Governor (Iteration Mode) — CLAUDE.md, PROGRESS.md, docs/checks.md and `.claude/settings.json` updated to v2.0 (and the matrix)
- [x] Brand skill in the repo (`.claude/skills/the-company-brand/SKILL.md`)
- [ ] The builder has a Supabase account (their own) and Claude Code's Supabase connection can reach it
- [ ] Type Start in the same session: Claude Code reads CLAUDE.md and PROGRESS.md and proposes the plan

### Tier 2 — build session (iteration, on the session's branch)

- [ ] Claude Code reads product-spec.md, CLAUDE.md, PROGRESS.md, docs/checks.md and docs/access-matrix.md, proposes the plan for the session; the builder approves; the plan goes into PROGRESS.md
- [ ] **Supabase — new project:** Claude Code proposes `the-company-sustainability` (EU, Frankfurt), waits for the builder's confirmation, then creates the project via Supabase MCP
- [ ] Claude Code builds both tables via Supabase MCP (every change a named migration, saved as a file in the repo) with **RLS enabled on every table from creation**, the login-ready columns, and the rules from docs/access-matrix.md (no anon policy, no anon grant); seeds the 18 rows from `src/data/roadmap.json` (check D1)
- [ ] Claude Code creates docs/supabase-setup.md (project, ID, region, tables, RLS, the save/undo mechanism, how to restore a deleted row, how to reset to the seed)
- [ ] Claude Code builds the three Netlify Functions (read, save, undo) with the validation rules; switches the screen from `roadmap.json` to the read function; builds the "Adjust measures" panel, the live preview and Undo; then the About this tool page
- [ ] Claude Code runs the checks (D2–D14 against the fixture and the seeded database; D15–D25 and R1–R2 through the functions, restoring the seed after each; the screen checks it can see), pastes the results into PROGRESS.md, runs the verifier
- [ ] NEW project: the builder connects Supabase to the Netlify site with the Supabase extension (Extensions → Supabase → Install; site → Connect; project `the-company-sustainability`, framework Vite); checks the key values start with `sb_`; redeploy
- [ ] The save function refuses an oversized body and validates every field before the first public deploy
- [ ] Claude Code pushes the branch (confirmed on GitHub) and opens the pull request; Netlify builds a Deploy Preview against the live database; the builder says *checks* and does the builder rows; failures are fixed in the same session; Claude Code resets the data to the seed (or the builder's intended state) after the checks
- [ ] Claude Code runs the reviewer on the branch; blockers fixed; the builder merges on GitHub and deletes the branch → main deploys

### Tier 1 / Tier 3 — N/A

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|---------------|-----------|
| **Known risk, public form without a bot check.** This is a public form: anyone with the link can send it, and so can a bot. While you are testing with your own entries, that is fine. Before you share it beyond testing, add a bot check. That means a free Cloudflare account, a Turnstile widget for your site's address, two keys in Netlify (the site key for the form, the secret key for the submit function), and a check in the submit function. About 15 minutes. Ask me when you are ready and I will add it. | Builder, before sharing beyond testing | No — can resolve after the build |
| **Anyone with the link can change or delete the roadmap.** Deletes are restorable and the last Save can be undone, but a determined visitor could make many Saves, and Undo reaches back only one. Accepted for v2.0 on 20 November 2026; a login for editing (Tier 3) is on the backlog. Revisit before sharing beyond the team. | Builder | No — accepted for now |
| **Switch to Supabase Pro** before the link is shared beyond the builder's own testing (backups, no pause). | Builder | No — before sharing |
| Which contact address appears on the About this tool page (a team mailbox is better than a personal one)? | Builder | No — needed before the About page is built |
| The brand skill describes The Company's tools as internal (non-public). This tool is a public link with no login, so anyone who has the URL can see, and now change, the emission figures. Is that acceptable? | Builder — answered 20 November 2026: accepted for the MVP; editing without login accepted for v2.0 | No — resolved for now; revisit before sharing beyond the team |
| When Scope 3 data arrives, will it be entered in the panel or come in a new Excel? (The panel supports it from v2.0.) | Builder | No |
| Is "Actual 2025" always the last year of done measures, or will the actual year move forward each year (e.g. 2026)? The settings carry it so it can be changed through Claude Code. | Builder | No |

---

## Section 16 — Tool Version History

Bump the version whenever the spec changes (the change lane). v1.x for an addition inside the same tier and access model; the next major version when the tier or the access model changes. Small bug fixes and UI polish (the fix lane) do not touch the spec.

> **On an iteration, never reset.** Keep every existing row below and append the new one.

| Version | Date | What changed in the tool |
|---------|------|--------------------------|
| v1.0 | 20 November 2026 | Initial build |
| v1.2 | 20 November 2026 | Updated Excel (Base Scope 2 Manufacturing 20,000; EAC 2022 −9,000; "Efficiency measures" renamed "Energy Efficiency"); Up/Downsizing, Energy Efficiency and Green Tariffs shown as one column per time span (absorbs the agreed v1.1 change); target slider 0 to −99 % (default −50 %) recalculating Target, Gap and summary; display in kt CO2 written into the spec |
| v2.0 | 20 November 2026 | Tier 1 → Tier 2: the roadmap rows move into a Supabase database (project `the-company-sustainability`, EU), seeded from the v1.2 data. "Adjust measures" panel: edit every field of base-year rows, done and planned measures (incl. Done/Planned and the one-column flag, which replaces the fixed list); New Measure, New base row; tick boxes and Delete (soft, restorable); Save and Cancel; live chart preview of unsaved edits; Undo last save. All reads and writes through Netlify Functions with validation and size limits; no bot check (known risk). About this tool page. |

---

*This spec is written for Claude Code. It assumes zero prior context. Every decision, rule, and requirement must be explicit enough that the builder can hand this document to Claude Code without a single verbal explanation.*
