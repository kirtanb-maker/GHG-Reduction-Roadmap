# GHG Reduction Roadmap

## Identity
A single interactive waterfall chart (base year → done measures → actual → planned measures → gap → target) with a target slider, for The Company's GHG roadmap, opened by anyone with the link.
Tier: 1 — fixed data built into the tool, public link, no login, no database (D1+A1)
Spec version governed: v1.2 — the version of docs/product-spec.md these rules were derived from.
Position: Standalone

## Session Protocol
You open in plan mode (.claude/settings.json). You read and propose; you change nothing until the builder approves the plan.

At the start of every session:
1. Pull the latest from main before reading anything else.
2. Branch rule: you never work on main, never push to main and never merge. In a cloud session, work on the session's branch (`claude/...`); locally, create one named for the intent. Every session ends with a pull request the builder merges.
3. If docs/product-spec.md's version is newer than "Spec version governed" above, STOP: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building."
4. Read PROGRESS.md (if missing, recreate it with the structure below, then continue) and docs/checks.md (what "done" means). If **Live URL:** reads none yet but the builder has connected Netlify and merged before, ask for the site address and record it.
5. Increment the session number and date in PROGRESS.md. If "Notes for next session" has content, repeat it back, treat it as this session's priority, then clear it.
6. Plan first. State the lane: **fix** (the tool is not yet what the spec says) or **change** (someone new sees or does something, something new is remembered, a new screen, arm or connection). A change while the spec version has not moved: STOP — "That is a change, so it needs its own session: describe it there in your own words; the Tool Architect, the Governor and the build happen in that session." Offer to add it to the Backlog. Otherwise propose the plan (what changes, in what order, which rows of docs/checks.md prove it, what could break), wait for approval, write it into PROGRESS.md "Plan for this session", then build.
7. If this is session 1, run First Session Setup before any build work.

Save point — after any module, feature or fix: (1) update PROGRESS.md (current state, remaining work, build decisions, known issues); (2) commit and push the branch and confirm with `git ls-remote origin <branch>` — never report an unconfirmed push; (3) tell the builder: "Save point pushed: [what changed]." Never start the next piece of work, or end a session, without one.

Done means the checks pass — at the end of every phase: run every row of docs/checks.md you can perform and write result and date in Last result (a failing row is fixed in the tool, never in the row); run the verifier agent and paste its report under "Check results" in PROGRESS.md; report the phase done only when both pass.

End of the session — every session ends with a pull request:
1. If **Live URL:** reads none yet, tell the builder before the pull request: "Next: connect Netlify once. Add new project → Import an existing project → GitHub → GHG-Reduction-Roadmap. Check that Branch to deploy says main. Keep the build settings (netlify.toml sets them). Tell me when it is connected." Netlify is never connected to Claude.
2. Push the branch (confirmed), open the pull request with the session's pull-request tool, or give https://github.com/kirtanb-maker/GHG-Reduction-Roadmap/compare/main...[branch]?expand=1 ("Open this link and click Create pull request"). Give its link: the Deploy Preview appears on it in a minute or two.
3. Tell the builder: "The build is not confirmed until your checks pass. Open the Deploy Preview from the pull request, then say *checks*." On *checks*, give every builder row for this change at once as a numbered list of actions, one line each (what to do, what you should see), no questions inside. Ask for the failed numbers or "all pass". Record results in docs/checks.md and PROGRESS.md; fix failures in this session and re-list only affected rows. Decisions for the builder are asked separately, never inside the list.
4. When the builder's rows pass: record **First deploy:** [date] if it reads "not yet", push, and say: "All checks pass. Merge the pull request and delete the branch; the live site updates. [First build: Then send me the site address.]" You never merge.
5. After the merge on a first build: check the live site loads and shows the tool; the address goes into PROGRESS.md next session. Then: "This session is done. For the next idea or change, start a new session and describe it in your own words."

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md, every intent note (intent.md, intent-[date].md) and checks.md into it; docs/source/GHG_reduction_roadmap.xlsx stays where it is. Leave .claude/settings.json in place. Check every file is in docs/; if one is missing stop: "I cannot find [file]; add it to the repo root and I will move it."
2. Write netlify.toml at the root: `[build]` `command = "npm run build"`, `publish = "dist"`.
3. The brand skill is already installed at .claude/skills/the-company-brand/SKILL.md; confirm it is there.
4. Announce what moved, then commit and push the branch before building anything.

PROGRESS.md structure (recreate rule): status header (Session / Last updated / Live URL / First deploy / Stage), Plan for this session, Current state, Last session, Remaining work, Check results, Build decisions, Known issues, Backlog, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · shadcn/ui · Recharts · Netlify. No database, no environment variables, no API keys.
Deployment: GitHub push → Netlify auto-deploys. You work on a branch; the builder opens the pull request, checks the Deploy Preview against docs/checks.md, merges on GitHub and deletes the branch; main deploys. No Netlify connector or MCP; the builder connects the repo to a Netlify site once in the dashboard.

## Hard Rules
- No API key, token or credential in any file or commit. This tool needs none; if a change seems to need one, it is a change-lane item.
- Data lives only in src/data/roadmap.json (converted from docs/source/GHG_reduction_roadmap.xlsx by scripts/convert_excel.py). No database, no form, no upload, nothing saved; the browser only filters, toggles and moves the target slider.
- Complexity: build no rate limit, queue, retry, scan, monitor or test framework. The checks in docs/checks.md are not a framework and are never skipped.
- Done means the checks pass and the verifier agrees. You never edit docs/checks.md to make a check pass (it changes only through the Governor).
- Branch rule: never push to main, never merge (exception: a new tool's documents at Session 0). One intent per session, one branch, one pull request; the builder merges.

## Things Claude gets wrong
Read before every save point. When the builder corrects the same mistake a second time, add it here as one line, in that session, before anything else is built.
- Writing a key value into a file or a command. Keys live in Netlify's environment; only the variable NAME appears anywhere else.
- Treating the Excel's Actual/Gap/Target rows as data. They are calculated, never imported.
- Reporting a phase done without running its rows in docs/checks.md and the verifier.

## Brand
Governed by the the-company-brand skill at .claude/skills/the-company-brand/SKILL.md. Invoke it for any UI work. Hard rules even if it is not loaded:
- Page background #FAFAF7, cards #FFFFFF, warm panel #F0EEE4 for the filter bar; text #000000, labels/inactive #8C8985 — never Tailwind gray/blue defaults
- Fonts: Spectral (titles, "The Company" text lockup, no logo file), DM Sans (everything else; labels uppercase, letter-spacing ~0.08em), from Google Fonts

## Business Rules
- Rows: `base` and `measure` only; Actual, Gap and Target are calculated. Settings in the data file: base year 2020, actual year 2025, target year 2030, default target reduction 50 %, one-column list ["Up/Downsizing", "Energy Efficiency", "Green Tariffs"], unit t CO2.
- Target slider "TARGET REDUCTION": native range control, 0 % to −99 %, step 1 %, starts at −50 % (data file setting); reload resets it; not a filter. It drives r in Target and is shown in the subtitle ("kt CO2 · Base year 2020 → Target 2030 (−50 %)"), the summary and the Target tooltip.
- Every calculation uses only rows passing the filters (Scope 1/2/3, Business, Scope 3 category). Defaults: all selected; Scope 3 shows "no data yet"; Scope 3 category dropdown disabled ("No Scope 3 data yet") while no category exists, and later filters Scope 3 rows only.
- Span columns: a multi-year measure in the one-column list is ONE bar "Name (start–end)" (e.g. "Up/Downsizing (2020–2025)") with its full value, never split; same name and span merge; year band shows the span.
- Other multi-year measures split: if startYear = base year, spread over startYear+1…endYear, else startYear…endYear inclusive; value ÷ years per year. Calculate in tonnes at full precision; display in kt CO2 with one decimal (axis ticks without decimals), summary % with one decimal, slider value in whole %.
- One bar per measure name per year (rows with the same name and year merge); order: Base 2020 → done per-year bars by year then Excel row order → done span columns (Excel row order) → Actual 2025 → planned per-year bars likewise → planned span columns → Gap → Target 2030. Labels "Name (year)" or "Name (start–end)".
- Actual = Base + sum(done). Target = Base × (1 − r), r = slider value (default 0.5). Gap = Base + sum(done) + sum(planned) − Target. Gap ≤ 0 → "Target reached" marker with the over-achievement; Target still drawn. Per-segment targets use the same r.
- Summary % vs. Base: Actual = sum(done)/Base; Target = −r; Gap = −Gap/Base (target reached: −over-achievement/Base, "beyond target"). Reductions negative.
- Positive measure values step up. Measures before the base year or after the target year are excluded with a console data warning.
- "Show detail for past measures" (default on); off → all done bars become one bar "Reductions" = sum(done). Planned bars always in detail.
- "Show Scope 1, 2, 3" and "Show Business" (both default off) are mutually exclusive; on → every bar stacked by segment; each bar's segments sum to its unstacked value. Gap bar stays one colour (net) with per-segment gaps in its tooltip.
- Colours, unstacked: Base and Actual #8C8985; Target #000000; done and Reductions #77BB78; planned #A9D6AA; Gap #F8AAB6. By scope: S1 #77BB78, S2 #8DBAED, S3 #FCCF61. By business: Manufacturing #FCCF61, Stores #F8AAB6, further businesses #8DBAED. Planned segments use a lighter shade of their colour (S1 #A9D6AA, S2 #BBD6F4).
- Empty selection → "No data for this selection". Phone width: controls wrap, the chart scrolls horizontally inside its frame, never the page.

Out of scope — do not build:
- Adding/editing measures in the tool or saving anything · Excel upload in the browser · Logins / user accounts · Scope 3 data (filters exist, empty) · Downloads (PNG, CSV) · Stacking by Scope and Business at once

## Reference Docs
- docs/intent.md — why the tool exists, in the builder's words; a new one per change
- docs/product-spec.md — full chart behaviour (Section 8), logic (Section 9), dataset (Section 5)
- docs/checks.md — what done means; run its rows, never edit them
- docs/source/GHG_reduction_roadmap.xlsx — the source data
- .claude/skills/the-company-brand/SKILL.md — full brand system
PROGRESS.md in the root is read at every session start per the Session Protocol.
