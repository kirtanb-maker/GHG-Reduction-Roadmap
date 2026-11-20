# User Stories — GHG Reduction Roadmap

**Written against:** product-spec.md v2.0 · supabase-setup.md as of not yet created — short run
**Date:** 20 November 2026
**Author:** Kirtan Bergheim
**Status:** Confirmed
**Population pattern:** P1, as in access-matrix.md
**Companion file:** access-matrix.md (every story below cites exactly one cell of it: `[table · action · role]`)

> Read by the Project Governor and by Claude Code. Each acceptance line is a check. Stories
> whose cell is `no` are refusal tests and are as important as the others.

---

## The people

| Role | Named first holder | Layer | Opens |
|---|---|---|---|
| anon (the public visitor) | — (no name; anyone with the link) | public, no login | Roadmap (with the Adjust measures panel), About this tool |
| platform owner | Kirtan Bergheim | outside the app | Supabase and Netlify dashboards |

---

## Stories — anon, Roadmap screen

- **As a visitor, I see the roadmap as it is saved now, so that I know where we stand.** `[roadmap_rows · read · anon]` (via fn `roadmap`)
  Acceptance: the visitor opens the link and the chart shows every visible row; a hidden (deleted) row never appears.
- **As a visitor, I add a measure or a base row and save it, so that the roadmap is complete.** `[roadmap_rows · create · anon]` (via fn `save-roadmap`)
  Acceptance: the visitor clicks New Measure, fills the line, clicks Save; after a reload in another browser the bar is there.
- **As a visitor, I correct any field of a row and save it, so that the roadmap stays current.** `[roadmap_rows · update · anon]` (via fn `save-roadmap`)
  Acceptance: the visitor changes Heat Pump to −3,200 t and saves; the function checks every field; the change shows for everyone after reload.
- **As a visitor, I mark a planned measure done, or delete ticked rows, so that the roadmap reflects what happened.** `[roadmap_rows · change state · anon]` (via fn `save-roadmap`)
  Acceptance: the line moves to Done (years 2020–2025); deleted rows disappear for everyone and remain in the table with `deleted_at` set.
- **As a visitor, I undo the most recent Save, so that a mistake is recoverable.** `[roadmap_saves · change state · anon]` (via fn `undo-save`)
  Acceptance: after Undo every row the Save touched is back as before; a second Undo is refused until the next Save.

## Stories that are refusals

- **As a visitor, I cannot read or write any table directly, so that only the checked functions reach the data.** `[roadmap_rows · read · anon]` (direct = no)
  Acceptance: a REST call with the publishable key, or no key, returns a permission error for select, insert, update and delete on `roadmap_rows`.
- **As a visitor, I cannot see the saved snapshots, so that hidden or old values are not exposed.** `[roadmap_saves · read · anon]` (= no)
  Acceptance: a direct call returns a permission error, and no function response contains a snapshot.
- **As a visitor, I cannot remove a row for good, so that every deletion can be restored.** `[roadmap_rows · delete · anon]` (= no)
  Acceptance: after Delete and Save, the row is still in the table with `deleted_at` set.
- **As a visitor, I cannot save malformed or oversized data, so that the chart stays correct.** `[roadmap_rows · update · anon]` (via fn, refused)
  Acceptance: each refusal in check D23 returns a message and changes nothing.

| # | Who | Tries | Result | Cell |
|---|---|---|---|---|
| 1 | anyone | select / insert / update / delete on `roadmap_rows` with the publishable key or no key | permission error | roadmap_rows · read/create/update/delete · anon (direct) |
| 2 | anyone | select / insert / update / delete on `roadmap_saves` directly | permission error | roadmap_saves · all · anon (direct) |
| 3 | anyone | remove a row for good | not possible; Delete hides it | roadmap_rows · delete · anon |
| 4 | anyone | Save with a 60 KB body, 201 rows, a planned year 2031, an unknown field or id | refused, nothing changed | roadmap_rows · update · anon (via fn) |
| 5 | anyone | GET on `save-roadmap` or `undo-save` | refused, nothing changed | roadmap_rows · update · anon (via fn) |
| 6 | anyone | Undo twice in a row | the second is refused | roadmap_saves · change state · anon (via fn) |

---

## Later list (not this version)

- A login for editing (named editors; the chart stays public) — a new spec version and the Access Architect's full run
- A bot check (Cloudflare Turnstile) on Save and Undo
- A browsable change history (who changed what, when) — needs a login for "who"
