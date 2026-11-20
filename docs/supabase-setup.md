# Supabase setup — GHG Reduction Roadmap

Last updated: 20 November 2026 — session 3

## 1. Header
- Project name: the-company-sustainability
- Project ref: stxgjibxcmznnpjqpedt
- Project URL: https://stxgjibxcmznnpjqpedt.supabase.co
- Region: eu-central-1 (EU, Frankfurt)
- Plan: Free (build and test; no backups; pauses after ~1 week idle). Switch to Pro before the link is shared beyond the builder's testing.
- Organisation: kirtanb-maker's Org (the builder's own account). The org also holds "kirtanb-maker's Project" (not used by this tool; never touched).
- Key system: **legacy (anon / service_role JWT, `eyJ…`)** — the Supabase extension wrote the legacy keys (checked by the builder 20 Nov 2026). They work; rotating to the publishable / secret keys (`sb_…`) is a dated handover item: before the legacy keys are retired (end of 2026). The functions send the legacy key as `apikey` plus `Authorization: Bearer`.

## 2. Tables
**roadmap_rows** — one row = one base-year emission line or one measure.
| Field | Type | Constraint / default |
|---|---|---|
| id | uuid | primary key, `gen_random_uuid()` |
| row_type | text | not null; `base` or `measure` |
| name | text | measures: 1–60 chars; base: null |
| start_year, end_year | integer | not null; start ≤ end; base: 2020/2020 |
| value_t | numeric(12,1) | not null; base ≥ 0; measure ≠ 0 |
| scope | smallint | 1–3 |
| scope3_category | smallint | 1–15; not null exactly when scope = 3 |
| business | text | 1–40 chars |
| status | text | `done` / `planned` for measures; null for base |
| single_column | boolean | default false |
| sort_order | integer | not null; seed = Excel row order |
| created_by, updated_by | uuid | empty (no login) |
| created_at, updated_at | timestamptz | default now() |
| deleted_at | timestamptz | null = visible; set = hidden (soft delete) |

**roadmap_saves** — one row per Save.
| Field | Type | Constraint / default |
|---|---|---|
| id | bigint identity | primary key |
| saved_at | timestamptz | default now() |
| rows_before | jsonb | the full rows the Save touched, before it; created rows as `{id, _created: true}` |
| undone_at | timestamptz | set once by Undo |

## 3. Rules (docs/access-matrix.md, short form, P1)
- roadmap_rows: RLS on; no policy; anon, authenticated, public: no grant (default deny) — matrix §6 line 1. service_role: select, insert, update (no delete) — the Netlify Functions only (lines 2–3, 5).
- roadmap_saves: RLS on; no policy; anon, authenticated, public: no grant — line 1, 6. service_role: select, insert, update, delete (delete only for pruning beyond 20) — lines 3–4.
- The Supabase advisor reports "RLS enabled, no policy" for both tables: intended (default deny).

## 4. Triggers
None.

## 5. Functions
| Function | Security | Callable by | Checks first | Does |
|---|---|---|---|---|
| apply_roadmap_save(p_updates jsonb, p_inserts jsonb, p_deletes jsonb) | invoker, `search_path = ''` | service_role only (execute revoked from public, anon, authenticated) | advisory lock; non-empty; no duplicate ids; every id exists and is visible; row_type unchanged | snapshots the touched rows into roadmap_saves, applies updates, soft-deletes, inserts (sort_order after the max), prunes saves beyond 20 — one transaction |
| undo_roadmap_save() | invoker, `search_path = ''` | service_role only | advisory lock; newest save exists and is not undone (else `nothing_to_undo`) | restores every row in rows_before exactly; hides rows the save created; sets undone_at |

Field validation (years per status, values, names, categories, sizes) happens in the Netlify Function `save-roadmap` first; the table constraints are the backstop.

## 6. Buckets
None.

## 7. Auth
None yet — nobody logs in.

## 8. Environment variable names (never values)
- `SUPABASE_DATABASE_URL` — Netlify Functions — project API URL
- `SUPABASE_SERVICE_ROLE_KEY` — Netlify Functions — secret key
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — written by the extension, not read by this tool
Confirmed on the first live build (20 Nov 2026): the functions find the project URL and the service-role key the extension wrote and read the live database (Deploy Preview of pull request #4); the key values start with `eyJ` (legacy).

## 9. Notes and flags
- **Restore a hidden row:** Supabase dashboard → Table Editor → roadmap_rows → clear `deleted_at` on the row. Or ask Claude Code.
- **Reset to the seed:** export roadmap_rows first; then (data fix via execute_sql) restore the 18 seed rows to their values in supabase/migrations/20261120150141_seed_roadmap_rows.sql, hide every other row, and empty roadmap_saves.
- A Deploy Preview uses this same database: edits made while checking are real.

## 10. Change log
| Session | Date | Migration file | What changed |
|---|---|---|---|
| 3 | 2026-11-20 | 20261120145937_create_roadmap_tables.sql | roadmap_rows, roadmap_saves; RLS on; grants revoked from anon/authenticated/public; service_role grants |
| 3 | 2026-11-20 | 20261120150116_save_and_undo_functions.sql | apply_roadmap_save, undo_roadmap_save (invoker, fixed search_path, service_role only) |
| 3 | 2026-11-20 | 20261120150141_seed_roadmap_rows.sql | 18 seed rows from src/data/roadmap.json |
