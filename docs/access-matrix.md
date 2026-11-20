# Access Matrix — GHG Reduction Roadmap

**Written against:** product-spec.md v2.0 · supabase-setup.md as of not yet created — short run
**Population pattern:** P1 public, stays anonymous
**Date:** 20 November 2026
**Author:** Kirtan Bergheim
**Status:** Confirmed
**Companion file:** user-stories.md

> The source of truth for who may do what. The Project Governor lifts Section 7 into
> CLAUDE.md. Claude Code builds every line of Section 6 with the mechanism that line names.
> The handover ships this file unchanged. Section 6 of product-spec.md points here from
> v2.0 on and holds no grid of its own.
>
> **Short form.** Nobody logs in, now or in the plan, so there is one population: the
> public visitor (`anon`). Unlike a plain public form, this visitor reads, edits, hides and
> undoes roadmap rows. Every one of those actions goes **only through a Netlify Function
> holding the Supabase secret key**; the visitor has no policy and no table grant on any
> table. For each function's path, the function is the rule (RLS does not apply to the
> secret key), so each function validates every input itself and does only its one job.
> This matrix is final until someone logs in.

---

## 1. The matrix

Legend: `yes` = all rows · `own` = rows the role owns · `no` = refused, in the database or
in the function, not only in the screen · `via fn` = allowed only through the named
function, which enforces the rule stated in Section 6 · `—` = not applicable.

### roadmap_rows (one row = one base-year emission line or one measure)

| Action | anon (no login), direct to the table | anon, through the functions |
|---|---|---|
| create | no | via fn `save-roadmap` (new measure or base row; validated) |
| read | no | via fn `roadmap` (visible rows only: `deleted_at` empty) |
| update | no | via fn `save-roadmap` (every field except `row_type`, `id`, `sort_order` and the audit columns; validated) |
| change state (planned ⇄ done; visible → hidden; hidden → visible) | no | via fn `save-roadmap` (status; Delete sets `deleted_at`) and `undo-save` (restores the previous state of the newest Save) |
| delete (remove the row) | no | no — Delete hides the row (`deleted_at`), it never removes it |
| export | no | — (out of scope) |
| maintain lists | — | — (no lookup tables; GHG Protocol categories 1–15 and the settings are fixed in the code) |

### roadmap_saves (one row = the state, before one Save, of every row that Save touched)

| Action | anon, direct to the table | anon, through the functions |
|---|---|---|
| create | no | via fn `save-roadmap` (one snapshot per Save, written in the same transaction) |
| read | no | no — the functions read it internally; `roadmap` returns only "Undo available" and the time of the last Save, never a snapshot |
| update | no | via fn `undo-save` (sets `undone_at` on the newest entry only) |
| change state | no | via fn `undo-save` (open → undone, once) |
| delete | no | `save-roadmap` removes entries beyond the 20 most recent; nothing else |
| export | no | — |
| maintain lists | — | — |

Restoring a hidden row outside Undo, resetting to the seed, and any other repair are done by
the platform owner in the Supabase dashboard or by Claude Code on the builder's request,
never through the app.

---

## 2. Ownership

Not yet — nobody logs in. Rows belong to nobody; every visitor has the same rights, through
the functions only.

## 3. The people

| Role | Named first holder | Layer | Screens |
|---|---|---|---|
| anon (the public visitor) | — (no name; anyone with the link) | public, no login | Roadmap (with the Adjust measures panel), About this tool |
| platform owner | Kirtan Bergheim (own accounts) | outside the app | Supabase, Netlify |

No business roles and no app admin: nobody logs in.

## 4. Exceptions

None.

## 5. Schema delta

Not yet — nobody logs in. The login-ready columns `created_by` and `updated_by` exist on
`roadmap_rows` from day one and stay empty. No `profiles` table: the spec names no login
target.

---

## 6. Policy plan

| # | Table | Action | Role | Rule in words | Mechanism | Test |
|---|---|---|---|---|---|---|
| 1 | roadmap_rows, roadmap_saves | any (select, insert, update, delete) | anon | nothing directly: RLS on, no policy, and anon's (and authenticated's) table grants revoked | none (default deny) | a REST call with the publishable key, and one with no key, to each table for each action returns a permission error, not an empty list |
| 2 | roadmap_rows | read | anon | only through `roadmap` (GET), which returns the visible rows (`deleted_at` empty) and the fields the chart needs, plus `canUndo` and `lastSavedAt`; never a snapshot, never a hidden row | function (`roadmap`, secret key) | the answer contains no row with `deleted_at` set and no `roadmap_saves` content |
| 3 | roadmap_rows | create / update / hide | anon | only through `save-roadmap` (POST only): body ≤ 50 KB, ≤ 200 changed rows, only known fields, known and visible ids, every field rule in spec Section 9; `row_type`, `id`, `sort_order` and the audit columns never taken from the request; Delete sets `deleted_at`, never removes; snapshot then apply, in one transaction; all or nothing; last Save wins | function (`save-roadmap`, secret key) + one database function for the transaction | each refusal in checks D23 leaves the data unchanged and creates no `roadmap_saves` entry |
| 4 | roadmap_rows, roadmap_saves | undo | anon | only through `undo-save` (POST only): restores the rows listed in the newest `roadmap_saves` entry with `undone_at` empty, exactly as recorded, then sets `undone_at`; refused when the newest entry is already undone | function (`undo-save`, secret key) + one database function for the transaction | a second Undo in a row is refused; Undo after a Save that created a row hides it; after a Save that deleted a row shows it again |
| 5 | roadmap_rows | delete (remove) | everyone | no policy, and no function removes a row | none (default deny) | after any Delete the row is still in the table with `deleted_at` set |
| 6 | roadmap_saves | read | anon | no function returns a snapshot | none | no function's response contains `rows_before` |
| 7 | every function | any method other than the one named | anon | `roadmap` answers GET only; `save-roadmap` and `undo-save` answer POST only | function | a GET to `save-roadmap` or `undo-save` is refused and changes nothing |

Database functions that run a Save or an Undo in one transaction follow the function
contract in CLAUDE.md: execute revoked from `anon`, `authenticated` and `public`; called only
by the Netlify Functions with the secret key; a fixed search_path.

No bot check and no rate limit: a known risk, named in product-spec.md Section 15. The
handover says what adding Cloudflare Turnstile would take.

---

## 7. Hard rules for CLAUDE.md (the Governor lifts these verbatim)

1. The refusal happens in the database, or in a server function that holds the secret key and checks every request itself; never only in the screen. A hidden button is not a rule. RLS is enabled on every table and never disabled to make something work. `anon` has no policy and no table grant on any table; every read, save and undo goes only through the Netlify Functions `roadmap`, `save-roadmap` and `undo-save`. A function that holds the secret key bypasses RLS, so for its path the function is the rule: it validates every input and does only its one job.
2. Nobody logs in, so no role, admin or active flag exists to change; if a login is ever added, that is a new spec version and a full run of the Access Architect first.
3. There is no final state: every row stays editable through `save-roadmap`. The only way back is "Undo last save" (the newest Save, once) or a repair by the platform owner in the Supabase dashboard.
4. Nothing is removed through the app. Delete sets `deleted_at` and the row stays in the table, restorable; no `DELETE` policy exists on any table, and no function removes a roadmap row. `save-roadmap` removes only `roadmap_saves` entries beyond the 20 most recent.
5. `roadmap_rows` carries `created_by`, `created_at`, `updated_by`, `updated_at` (`created_by`/`updated_by` stay empty: no login); `roadmap_saves` holds the state before every Save, written by `save-roadmap` in the same transaction.

---

## 8. Handover paragraph (for the handover package, plain language)

The GHG Reduction Roadmap has one kind of user: anyone with the link. They see the chart and can adjust the roadmap (edit, add and hide rows, and undo the most recent Save). Nobody logs in. Visitors never touch the database directly: every read and every change goes through three small server functions in the tool's code, which check every value, refuse anything malformed or oversized, and keep a snapshot so the last Save can be undone. Nothing is ever removed; a deleted row is hidden and can be restored from the Supabase dashboard. There is no bot check and no rate limit, so anyone who has the link (or a bot that finds it) can change the numbers; adding a bot check takes about 15 minutes, and a login for editing would be the next version. The Supabase and Netlify accounts are held by Kirtan Bergheim on their own accounts; moving them to a company account changes nothing in the rules.
