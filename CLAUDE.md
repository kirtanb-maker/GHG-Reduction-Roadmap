# GHG Reduction Roadmap

## Identity
An interactive waterfall chart (base year → done → actual → planned → gap → target) with a target slider and an "Adjust measures" panel, for The Company's GHG roadmap; anyone with the link views and edits, no login.
Tier: 2 — data persists in Supabase, public link, no login (D3+A1). Population pattern P1 (public, anonymous); a login for editing may come later as a new spec version.
Spec version governed: v2.0 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone (Supabase project "the-company-sustainability", named for later tools).

## Session Protocol
You open in plan mode (.claude/settings.json). You read and propose; you change nothing until the builder approves the plan.

At the start of every session:
1. Pull the latest from main before reading anything else.
2. Branch rule: never work on main, never push to main, never merge. In a cloud session work on the session's branch (`claude/...`); locally create one named for the intent. Every session ends with a pull request the builder merges.
3. If docs/product-spec.md's version is newer than "Spec version governed", STOP: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building."
4. Read PROGRESS.md (if missing, recreate it with the structure below) and docs/checks.md (what "done" means). If **Live URL:** reads none yet but the builder has merged before, ask for the address.
5. Increment the session number and date in PROGRESS.md. If "Notes for next session" has content, repeat it back, treat it as the priority, then clear it.
6. Plan first. State the lane: **fix** (not yet what the spec says) or **change** (someone new sees or does something, something new is remembered, a new screen, arm or connection). A change while the spec version has not moved: STOP — "That is a change, so it needs its own session: describe it there in your own words." Offer the Backlog. Otherwise propose the plan (what changes, in what order, which rows of docs/checks.md prove it, what could break), wait for approval, write it into PROGRESS.md "Plan for this session", then build.

Save point — after any module, feature, fix or schema change: (1) update PROGRESS.md; (2) if the database was touched, update docs/supabase-setup.md and commit the migration file in supabase/migrations/ with it; (3) commit, push the branch, confirm with `git ls-remote origin <branch>` — never report an unconfirmed push; (4) tell the builder: "Save point pushed: [what changed]." Never start the next piece, or end a session, without one.

Done means the checks pass — at the end of every phase: run every row of docs/checks.md you can perform and write result and date in Last result (a failing row is fixed in the tool, never in the row); run the verifier agent and paste its report under "Check results" in PROGRESS.md; report done only when both pass.

End of the session — every session ends with a pull request:
1. Push the branch (confirmed), open the pull request with the session's pull-request tool, or give https://github.com/kirtanb-maker/GHG-Reduction-Roadmap/compare/main...[branch]?expand=1 ("Open this link and click Create pull request"). Give its link: the Deploy Preview appears on it in a minute or two. The preview talks to the one live database.
2. Tell the builder: "The build is not confirmed until your checks pass. Open the Deploy Preview from the pull request, then say *checks*." On *checks*, give every builder row for this change at once as a numbered list of actions, one line each, no questions inside. Ask for the failed numbers or "all pass". Record results in docs/checks.md and PROGRESS.md; fix failures in this session and re-list only affected rows. Decisions are asked separately. After the checks, put the data back to the state the builder wants (seed or their edits) and say so.
3. Run the reviewer agent on the branch; fix every blocker; record findings in PROGRESS.md.
4. When the builder's rows pass: "All checks pass. Merge the pull request and delete the branch; the live site updates. Reviewer: [Safe to merge / N blockers fixed]." You never merge.
5. Then: "This session is done. For the next idea or change, start a new session and describe it in your own words."

PROGRESS.md structure (recreate rule): status header (Session / Last updated / Live URL / First deploy / Stage / Supabase project), Plan for this session, Current state, Last session, Remaining work, Check results, Build decisions, Known issues, Backlog, Notes for next session.

## Commands
`npm install` · `npm run dev` · `npm run build` · `netlify dev` (the site with its functions, locally)

## Tech Stack
React · Vite · Tailwind CSS · hand-written SVG chart · Netlify (+ Netlify Functions) · Supabase. No Resend, no AI.
Deployment: GitHub push → Netlify auto-deploys. You work on a branch; the builder opens the pull request, checks the Deploy Preview against docs/checks.md, the reviewer passes, the builder merges and deletes the branch; main deploys. No Netlify connector or MCP. The builder connects Supabase to the site once with the Supabase extension (after you create the project), then redeploys. A missing Supabase variable is fixed by that connection, never by a pasted value.

## Environment Variables
SUPABASE_DATABASE_URL — written by the Supabase extension — Netlify Functions only — the project API URL, kept server-side
SUPABASE_SERVICE_ROLE_KEY — written by the Supabase extension — Netlify Functions only — SECRET; value is the secret key (`sb_secret_…`); never VITE_-prefixed, never in client code
Names and values (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are also written but NOT read: the browser never talks to Supabase) are verified on the first live build; record the real names in docs/supabase-setup.md §8. Values must start with `sb_`; `eyJ` means legacy keys: tell the builder (rotation is a dated handover item). No value ever appears in code, a command or a commit.

## Supabase
Project "the-company-sustainability", region EU (Frankfurt), plan Free for building and testing (no backups; pauses after ~1 week idle); the switch to Pro is a manual billing step, due before the link is shared beyond the builder's testing. If PROGRESS.md shows it not yet created: confirm the name with the builder, create it via Supabase MCP, record the ref in PROGRESS.md and docs/supabase-setup.md.
Every schema, policy, trigger and function change goes through `apply_migration` with a descriptive name AND is saved as supabase/migrations/[timestamp]_[name].sql, committed with the save point. `execute_sql` is for reads and data fixes only.
Build this schema — authoritative until docs/supabase-setup.md exists (detail: spec Section 5):
roadmap_rows: id, row_type (base|measure), name, start_year, end_year, value_t, scope, scope3_category, business, status (done|planned), single_column, sort_order, created_by (empty, no login), created_at, updated_by (empty), updated_at, deleted_at
roadmap_saves: id, saved_at, rows_before (snapshot of every row the Save touched), undone_at
Seed roadmap_rows once from src/data/roadmap.json (18 rows; single_column = true for Up/Downsizing, Energy Efficiency, Green Tariffs).
RLS — enabled on every table from creation, never disabled. Population pattern P1. `anon` (and `authenticated`) have no policy and no table grant on either table; revoke the grants after creation. Every rule comes from docs/access-matrix.md: reads only through netlify/functions/roadmap (GET; visible rows only, never a snapshot); create, update and hide only through netlify/functions/save-roadmap (POST); undo only through netlify/functions/undo-save (POST). Save and Undo each run in one database function (one transaction), execute revoked from public, anon, authenticated, fixed search_path, called only by the Netlify Functions with the secret key.
After setup write docs/supabase-setup.md and keep it current, in this order: (1) header — name, ref, URL, region, plan, key system; (2) tables with fields, types, constraints, defaults; (3) rules per table with mechanism and access-matrix source line; (4) triggers; (5) functions — security, who may call, what it checks first, what it does; (6) buckets (none); (7) Auth (none yet); (8) environment variable names; (9) notes and flags, incl. how to restore a hidden row and reset to the seed; (10) change log — one line per migration file and date.

## Hard Rules
- API keys never in any frontend file, command or commit. The secret key lives only in Netlify env vars, read only by the three Netlify Functions.
- Netlify Identity: never. Supabase Auth is not configured: nobody logs in.
- The refusal happens in the database, or in a server function that holds the secret key and checks every request itself; never only in the screen. A hidden button is not a rule. RLS is enabled on every table and never disabled to make something work. `anon` has no policy and no table grant on any table; every read, save and undo goes only through the Netlify Functions `roadmap`, `save-roadmap` and `undo-save`. A function that holds the secret key bypasses RLS, so for its path the function is the rule: it validates every input and does only its one job.
- Nobody logs in, so no role, admin or active flag exists to change; if a login is ever added, that is a new spec version and a full run of the Access Architect first.
- There is no final state: every row stays editable through `save-roadmap`. The only way back is "Undo last save" (the newest Save, once) or a repair by the platform owner in the Supabase dashboard.
- Nothing is removed through the app. Delete sets `deleted_at` and the row stays in the table, restorable; no `DELETE` policy exists on any table, and no function removes a roadmap row. `save-roadmap` removes only `roadmap_saves` entries beyond the 20 most recent.
- `roadmap_rows` carries `created_by`, `created_at`, `updated_by`, `updated_at` (`created_by`/`updated_by` stay empty: no login); `roadmap_saves` holds the state before every Save, written by `save-roadmap` in the same transaction.
- Public endpoint protections: the browser never writes to a table. save-roadmap rejects bodies over 50 KB or over 200 changed rows, unknown fields, unknown or hidden ids, and any field breaking spec Section 9; it never takes row_type changes, id, sort_order or audit columns from the request; the whole Save applies or nothing does; the last Save wins. save-roadmap and undo-save answer POST only, roadmap GET only. No rate limit; do not build one.
- Public form without a bot check: known risk, see the spec; do not add one unless the builder asks. The visitor's IP is never stored or logged.
- Every access rule comes from docs/access-matrix.md with the mechanism its policy plan names; if a query needs a rule the matrix does not state, stop and tell the builder. Migrations in an iteration are additive (never drop or rename in the same change). Before a migration touches a table with real rows, export it to a file outside the repo and tell the builder where. There is no preview database.
- Complexity: build no rate limit, queue, retry, scan, monitor or test framework; put such asks on the Backlog. The checks in docs/checks.md are never skipped. Done means the checks pass and the verifier agrees. You never edit docs/checks.md, docs/access-matrix.md or docs/user-stories.md to make a check pass. Branch rule: never push to main, never merge. One intent per session, one branch, one pull request; the builder merges.

## Things Claude gets wrong
Read before every save point. When the builder corrects the same mistake a second time, add it here as one line, in that session, before anything else is built.
- Writing a key value into a file or a command. Keys live in Netlify's environment; only the variable NAME appears anywhere else.
- Disabling RLS, adding an anon policy, or loosening a table to make a screen work. Fix the function or the query; every rule comes from docs/access-matrix.md.
- Reporting a phase done without running its rows in docs/checks.md and the verifier.
- Treating the Excel's Actual/Gap/Target rows as data. They are calculated, never stored.

## Brand
Governed by the the-company-brand skill at .claude/skills/the-company-brand/SKILL.md. Invoke it for any UI work, the panel included. Hard rules even if it is not loaded:
- Page background #FAFAF7, cards #FFFFFF, warm panel #F0EEE4 for the filter bar; text #000000, labels/inactive #8C8985 — never Tailwind gray/blue defaults
- Fonts: Spectral (titles, "The Company" text lockup, no logo file), DM Sans (everything else; labels uppercase, letter-spacing ~0.08em), from Google Fonts

## Business Rules
- Rows: `base` and `measure` only; Actual, Gap and Target are calculated. Settings stay in a settings file in src/: base year 2020, actual year 2025, target year 2030, default target 50 %, slider 0–99 % step 1, unit t CO2.
- Slider "TARGET REDUCTION": native range, 0 % to −99 %, starts −50 %, never saved, reload resets; drives r in Target; shown in subtitle, summary and Target tooltip.
- Calculations use only visible rows passing the filters (Scope 1/2/3, Business, Scope 3 category), with unsaved panel edits applied (live preview). Business chips come from the rows. Scope 3 category dropdown disabled ("No Scope 3 data yet") until a row has a category; it filters Scope 3 rows only.
- Span columns: a multi-year measure with single_column = yes is ONE bar "Name (start–end)" with its full value; same name, span and flag merge. Other multi-year measures split: startYear = base year → startYear+1…end, else start…end; value ÷ years. Full precision in tonnes; display kt CO2 one decimal (axis no decimals), summary % one decimal, slider whole %. One bar per measure name per year; order: Base → done per-year bars by year then sort_order → done span columns → Actual → planned per-year → planned span columns → Gap → Target.
- Actual = Base + sum(done). Target = Base × (1 − r). Gap = Base + sum(done) + sum(planned) − Target; Gap ≤ 0 → "Target reached" marker, Target still drawn. Per-segment targets use the same r. Summary %: Actual = sum(done)/Base; Target = −r; Gap = −Gap/Base.
- "Show detail for past measures" (on) / off → one "Reductions" bar. "Show Scope 1, 2, 3" and "Show Business" (off) are mutually exclusive stacks; Gap bar stays one colour with per-segment gaps in its tooltip. Colours per spec Section 8.
- Panel validation (and again in save-roadmap): name 1–60 for measures; done years 2020–2025 (single-year done 2021–2025), planned 2026–2030, base 2020 fixed; value one decimal, base 0–10,000,000, measures −1,000,000…1,000,000 and not 0; scope 1–3; scope3_category 1–15 required iff scope 3; business 1–40; row_type never changes.
- Undo restores the rows of the newest not-undone Save exactly (created rows hidden, deleted rows visible again), once; disabled while unsaved edits exist. Read failure → "Roadmap data could not be loaded. Please try again later."; Save failure keeps every edit. Empty selection → "No data for this selection". Phone: controls wrap; chart and panel tables scroll inside their frames, never the page.

Out of scope — do not build: logins (until a new spec version) · bot check (until asked) · browsable change history · undo beyond the last Save · live push without reload · editing settings in the tool · Excel upload · downloads · stacking by Scope and Business at once

## Reference Docs
- docs/intent.md, docs/intent-2026-11-20.md, docs/intent-2026-11-20-b.md — why, in the builder's words; docs/product-spec.md — chart behaviour and panel (Section 8), logic and validation (Section 9), data (Section 5)
- docs/checks.md — what done means; run its rows, never edit them
- docs/access-matrix.md — read before touching a table, function or grant (short form, P1)
- docs/user-stories.md — read before changing a screen; every acceptance line is a test
- docs/supabase-setup.md — schema record (created in the build session)
- docs/source/GHG_reduction_roadmap.xlsx, src/data/roadmap.json — the seed record; .claude/skills/the-company-brand/SKILL.md — full brand system
PROGRESS.md in the root is read at every session start per the Session Protocol.
