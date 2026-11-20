-- GHG Reduction Roadmap v2.0 — seed: the 18 rows of src/data/roadmap.json (v1.2 Excel).
-- single_column = true for the Up/Downsizing, Energy Efficiency and Green Tariffs span rows.
insert into public.roadmap_rows
  (row_type, name, start_year, end_year, value_t, scope, scope3_category, business, status, single_column, sort_order)
values
  ('base', null, 2020, 2020, 65000.0, 1, null, 'Manufacturing', null, false, 1),
  ('base', null, 2020, 2020, 5000.0, 1, null, 'Stores', null, false, 2),
  ('base', null, 2020, 2020, 20000.0, 2, null, 'Manufacturing', null, false, 3),
  ('base', null, 2020, 2020, 30000.0, 2, null, 'Stores', null, false, 4),
  ('measure', 'Up/Downsizing', 2020, 2025, -6000.0, 1, null, 'Manufacturing', 'done', true, 5),
  ('measure', 'Up/Downsizing', 2020, 2025, -1000.0, 1, null, 'Stores', 'done', true, 6),
  ('measure', 'Energy Efficiency', 2020, 2025, -3000.0, 1, null, 'Manufacturing', 'done', true, 7),
  ('measure', 'Electric Boiler', 2023, 2023, -2000.0, 1, null, 'Manufacturing', 'done', false, 8),
  ('measure', 'CHP shutdown', 2021, 2021, -500.0, 1, null, 'Manufacturing', 'done', false, 9),
  ('measure', 'Photovoltaics', 2024, 2024, -600.0, 1, null, 'Manufacturing', 'done', false, 10),
  ('measure', 'Energy Attribute Certificates', 2022, 2022, -9000.0, 2, null, 'Manufacturing', 'done', false, 11),
  ('measure', 'Green Tariffs', 2026, 2030, -10000.0, 2, null, 'Stores', 'planned', true, 16),
  ('measure', 'Electric Boiler', 2027, 2027, -4000.0, 1, null, 'Manufacturing', 'planned', false, 17),
  ('measure', 'Energy Efficiency', 2026, 2030, -1000.0, 1, null, 'Manufacturing', 'planned', true, 18),
  ('measure', 'Energy Attribute Certificates', 2028, 2028, -5000.0, 2, null, 'Stores', 'planned', false, 19),
  ('measure', 'Photovoltaics', 2029, 2029, -1200.0, 1, null, 'Manufacturing', 'planned', false, 20),
  ('measure', 'Electrification Furnace', 2029, 2029, -800.0, 1, null, 'Manufacturing', 'planned', false, 21),
  ('measure', 'Heat Pump', 2029, 2029, -2200.0, 1, null, 'Manufacturing', 'planned', false, 22);
