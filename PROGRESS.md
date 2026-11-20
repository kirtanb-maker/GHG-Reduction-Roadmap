# PROGRESS — GHG Reduction Roadmap

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 0 — build not started
**Last updated:** 20 November 2026 — by Project Governor, pre-build
**Live URL:** none yet [Rule: fill in after the first successful deploy]
**First deploy:** not yet [Rule: the date the first pull request was merged with all builder checks passing; a record only]
**Stage:** business logic [Rule: one of — business logic and database / second screen and access design / login and access rules together / deploy and maintain. Advance it when that stage's items are absorbed into Current state. Decided by what exists, never by a week or a version number.]

## Plan for this session
None yet. [Rule: Claude Code opens in plan mode, states the lane (fix / change), proposes the plan, and writes the approved plan here (3–8 lines: what changes, in what order, which rows of docs/checks.md prove it). Replaced each session. A change whose spec version has not moved is not planned here; it goes to the Tool Architect.]

## Current state
Nothing built. Repo contains CLAUDE.md, PROGRESS.md, product-spec.md, intent.md, checks.md, .claude/settings.json, docs/source/GHG_reduction_roadmap.xlsx (source data), and the-company-brand skill (already installed at .claude/skills/the-company-brand/).
[Rule: this section describes what exists and works right now — never what is planned. Completed checklist items get absorbed here in compressed form.]

## Last session
None — the first build session has not happened yet.
[Rule: 3–5 lines maximum. Replace each session — what was built, changed, or fixed.]

## Remaining work
- [ ] First Session Setup: create docs/, move the spec, intent.md and checks.md into it and check each is there, confirm the brand skill is in place, write netlify.toml for the stack, commit and push (see CLAUDE.md Session Protocol)
- [ ] Convert docs/source/GHG_reduction_roadmap.xlsx into src/data/roadmap.json (settings + 4 base rows + 14 measure rows; Actual/Gap/Target rows not imported; spec Section 5) and note how in docs/ — then run check D1
- [ ] Build Roadmap — the waterfall with filters, the three toggles, legend, tooltips and summary line (spec Sections 8–9) — then run its rows in docs/checks.md and the verifier
- [ ] Checks pass for this stage — every row in docs/checks.md shows a pass dated today; the verifier's report pasted under Check results
- [ ] First build only, before the pull request: the builder connects the repo to a Netlify site (Add new project → Import an existing project → GitHub → this repo; Branch to deploy: main)
- [ ] Push the branch and confirm it reached GitHub; open the pull request (or give the builder the prefilled compare link) and give the builder its link
- [ ] Builder checks: on request, the builder rows of docs/checks.md as a numbered list of actions; record the results; fix failures in this session
- [ ] Builder: merge the pull request and delete the branch → main deploys. Claude Code never merges. First build: the builder sends the site address; Claude Code checks the live site and records it as Live URL next session. This session is then done.
[Rule: completed items leave this list and are absorbed into Current state. This list only shrinks.]

## Check results
None yet. [Rule: the verifier's report per phase and per branch, with the date: one line per row, PASS or FAIL, and the builder's rows as performed. Kept, never cleared; the handover package copies it. A FAIL is fixed in the tool and re-run, never edited away.]

## Build decisions
None yet.
[Rule: one line per decision made during the build that is not in the spec — prompt structures, field formats, naming choices, library picks. Future sessions depend on these to stay consistent.]

## Known issues
- Data checks run against src/data/roadmap.json (the real dataset), not src/fixtures/ — this tool has no database, so its built-in data is the known input.
[Rule: bugs, edge cases, and deferred fixes. One line each. Remove when resolved.]

## Backlog
- Adding/editing measures in the tool, saved for everyone — needs a database (Tier 2/3); validate the chart first
- Excel upload in the browser — not needed to validate the idea
- Logins / user accounts — needs a database and access rules (Tier 3); the public link was accepted for the MVP on 20 November 2026
- Scope 3 data — not available yet; filters exist but stay empty
- Downloads (PNG of the chart, CSV of the data) — keep the MVP lean
- Stacking by Scope and Business at the same time — clashes with Done/Planned shading
- Handover: alerts (Netlify Free: check Deploys after each push); the Netlify account is the builder's own; who supports the tool; how to retire it
[Rule: deferred and approved items live here, nowhere else. When a new stage starts or the spec is revised, review this list: an item now in scope is promoted into Remaining work and removed from here, with a Build decisions line saying so. Nothing here is built without being promoted.]

## Notes for next session
None.
[Rule: the builder writes here between sessions. Claude Code reads these aloud at session start, acts on them, then clears this section.]
