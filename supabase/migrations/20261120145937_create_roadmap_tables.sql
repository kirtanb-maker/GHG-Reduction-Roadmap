-- GHG Reduction Roadmap v2.0 — tables, RLS, grants.
-- Rules: docs/access-matrix.md (short form, P1). anon and authenticated have no
-- policy and no grant on any table; only the Netlify Functions (secret key) reach them.

create table public.roadmap_rows (
  id              uuid primary key default gen_random_uuid(),
  row_type        text not null check (row_type in ('base', 'measure')),
  name            text,
  start_year      integer not null,
  end_year        integer not null,
  value_t         numeric(12, 1) not null,
  scope           smallint not null check (scope between 1 and 3),
  scope3_category smallint check (scope3_category between 1 and 15),
  business        text not null check (char_length(business) between 1 and 40),
  status          text check (status in ('done', 'planned')),
  single_column   boolean not null default false,
  sort_order      integer not null,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_by      uuid,
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint years_ordered check (start_year <= end_year),
  constraint scope3_category_iff_scope3 check ((scope = 3) = (scope3_category is not null)),
  constraint base_shape check (
    row_type <> 'base' or (name is null and status is null and start_year = 2020 and end_year = 2020 and value_t >= 0)
  ),
  constraint measure_shape check (
    row_type <> 'measure' or (name is not null and char_length(name) between 1 and 60 and status is not null and value_t <> 0)
  )
);

comment on table public.roadmap_rows is
  'One row = one base-year emission line or one measure. Soft delete via deleted_at. Written only by the save-roadmap / undo-save Netlify Functions.';

create table public.roadmap_saves (
  id          bigint generated always as identity primary key,
  saved_at    timestamptz not null default now(),
  rows_before jsonb not null,
  undone_at   timestamptz
);

comment on table public.roadmap_saves is
  'State before each Save of every row it touched (created rows marked _created). Newest not-undone entry can be undone once.';

alter table public.roadmap_rows enable row level security;
alter table public.roadmap_saves enable row level security;

revoke all on table public.roadmap_rows from anon, authenticated, public;
revoke all on table public.roadmap_saves from anon, authenticated, public;
revoke all on sequence public.roadmap_saves_id_seq from anon, authenticated, public;

grant select, insert, update on table public.roadmap_rows to service_role;
grant select, insert, update, delete on table public.roadmap_saves to service_role;
grant usage on sequence public.roadmap_saves_id_seq to service_role;
