-- GHG Reduction Roadmap v2.0 — Save and Undo, each one transaction.
-- Function contract: SECURITY INVOKER, fixed search_path, schema-qualified names;
-- execute revoked from public, anon, authenticated; granted to service_role only
-- (called by the Netlify Functions save-roadmap / undo-save with the secret key).
-- Field validation happens in the Netlify Function first; the table constraints are the backstop.

create or replace function public.apply_roadmap_save(p_updates jsonb, p_inserts jsonb, p_deletes jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ids       uuid[];
  v_snapshot  jsonb;
  v_new_ids   uuid[] := '{}';
  v_next      integer;
  v_item      jsonb;
  v_ord       bigint;
  v_id        uuid;
  v_save_id   bigint;
  v_now       timestamptz := now();
begin
  perform pg_advisory_xact_lock(hashtext('roadmap_save'));

  p_updates := coalesce(p_updates, '[]'::jsonb);
  p_inserts := coalesce(p_inserts, '[]'::jsonb);
  p_deletes := coalesce(p_deletes, '[]'::jsonb);

  if jsonb_array_length(p_updates) + jsonb_array_length(p_inserts) + jsonb_array_length(p_deletes) = 0 then
    raise exception 'no_changes' using errcode = 'P0001';
  end if;

  v_ids := array(select (e->>'id')::uuid from jsonb_array_elements(p_updates) e)
        || array(select d::uuid from jsonb_array_elements_text(p_deletes) d);

  if (select count(*) from unnest(v_ids)) <> (select count(distinct i) from unnest(v_ids) i) then
    raise exception 'duplicate_id' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from unnest(v_ids) i
    where not exists (select 1 from public.roadmap_rows r where r.id = i and r.deleted_at is null)
  ) then
    raise exception 'unknown_id' using errcode = 'P0001';
  end if;

  -- row_type never changes
  if exists (
    select 1 from jsonb_array_elements(p_updates) e
    join public.roadmap_rows r on r.id = (e->>'id')::uuid
    where e ? 'row_type' and e->>'row_type' is distinct from r.row_type
  ) then
    raise exception 'row_type_change' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) into v_snapshot
  from public.roadmap_rows r where r.id = any(v_ids);

  update public.roadmap_rows r set
    name            = e->>'name',
    start_year      = (e->>'start_year')::integer,
    end_year        = (e->>'end_year')::integer,
    value_t         = (e->>'value_t')::numeric,
    scope           = (e->>'scope')::smallint,
    scope3_category = (e->>'scope3_category')::smallint,
    business        = e->>'business',
    status          = e->>'status',
    single_column   = coalesce((e->>'single_column')::boolean, false)
                      and (e->>'start_year')::integer <> (e->>'end_year')::integer,
    updated_at      = v_now
  from jsonb_array_elements(p_updates) e
  where r.id = (e->>'id')::uuid;

  update public.roadmap_rows set deleted_at = v_now, updated_at = v_now
  where id in (select d::uuid from jsonb_array_elements_text(p_deletes) d);

  select coalesce(max(sort_order), 0) into v_next from public.roadmap_rows;
  for v_item, v_ord in select e, o from jsonb_array_elements(p_inserts) with ordinality as t(e, o) loop
    insert into public.roadmap_rows
      (row_type, name, start_year, end_year, value_t, scope, scope3_category, business, status, single_column, sort_order)
    values (
      v_item->>'row_type',
      v_item->>'name',
      (v_item->>'start_year')::integer,
      (v_item->>'end_year')::integer,
      (v_item->>'value_t')::numeric,
      (v_item->>'scope')::smallint,
      (v_item->>'scope3_category')::smallint,
      v_item->>'business',
      v_item->>'status',
      coalesce((v_item->>'single_column')::boolean, false)
        and (v_item->>'start_year')::integer <> (v_item->>'end_year')::integer,
      v_next + v_ord::integer
    )
    returning id into v_id;
    v_new_ids := v_new_ids || v_id;
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object('id', v_id, '_created', true));
  end loop;

  insert into public.roadmap_saves (saved_at, rows_before) values (v_now, v_snapshot)
  returning id into v_save_id;

  delete from public.roadmap_saves
  where id not in (select id from public.roadmap_saves order by id desc limit 20);

  return jsonb_build_object('save_id', v_save_id, 'saved_at', v_now, 'created_ids', to_jsonb(v_new_ids));
end;
$$;

create or replace function public.undo_roadmap_save()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_save  public.roadmap_saves%rowtype;
  v_elem  jsonb;
  v_now   timestamptz := now();
begin
  perform pg_advisory_xact_lock(hashtext('roadmap_save'));

  select * into v_save from public.roadmap_saves order by id desc limit 1;
  if not found or v_save.undone_at is not null then
    raise exception 'nothing_to_undo' using errcode = 'P0001';
  end if;

  for v_elem in select e from jsonb_array_elements(v_save.rows_before) e loop
    if coalesce((v_elem->>'_created')::boolean, false) then
      update public.roadmap_rows set deleted_at = v_now, updated_at = v_now
      where id = (v_elem->>'id')::uuid;
    else
      update public.roadmap_rows r set
        (name, start_year, end_year, value_t, scope, scope3_category, business, status,
         single_column, sort_order, deleted_at)
        = (select p.name, p.start_year, p.end_year, p.value_t, p.scope, p.scope3_category,
                  p.business, p.status, p.single_column, p.sort_order, p.deleted_at
           from jsonb_populate_record(null::public.roadmap_rows, v_elem) p),
        updated_at = v_now
      where r.id = (v_elem->>'id')::uuid;
    end if;
  end loop;

  update public.roadmap_saves set undone_at = v_now where id = v_save.id;

  return jsonb_build_object('undone_save_id', v_save.id, 'saved_at', v_save.saved_at);
end;
$$;

revoke execute on function public.apply_roadmap_save(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.undo_roadmap_save() from public, anon, authenticated;
grant execute on function public.apply_roadmap_save(jsonb, jsonb, jsonb) to service_role;
grant execute on function public.undo_roadmap_save() to service_role;
