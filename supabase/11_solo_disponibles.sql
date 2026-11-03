-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 11: el buscador público muestra solo propiedades
--  DISPONIBLES y el estado "Caído" pasa a llamarse "Retirada".
--  Pégalo en SQL Editor → Run. (Reemplaza a los archivos 9 y 10.)
-- ════════════════════════════════════════════════════════════════

-- 1) Renombrar el estado en las propiedades que ya existen
update public.propiedades
   set datos = jsonb_set(datos, '{est}', '"Retirada"')
 where datos->>'est' = 'Caído';

-- 2) Catálogo para visitantes: solo disponibles (con fotos y tipo de cambio)
create or replace function public.catalogo_publico()
returns table (id text, datos jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, jsonb_build_object(
    'id', p.datos->'id', 'op', p.datos->'op', 'tipo', p.datos->'tipo',
    'ciudad', p.datos->'ciudad', 'zona', p.datos->'zona',
    'precio', p.datos->'precio', 'mon', p.datos->'mon', 'tcModo', p.datos->'tcModo', 'tc', p.datos->'tc',
    'dorm', p.datos->'dorm', 'ban', p.datos->'ban', 'm2', p.datos->'m2',
    'est', p.datos->'est', 'dias', p.datos->'dias', '_conf', p.datos->'_conf', 'hue', p.datos->'hue',
    'cap', jsonb_build_object('n', '', 'ciu', p.datos->'ciudad'),
    'fotos', coalesce(p.datos->'fotos', '[]'::jsonb))
  from public.propiedades p
  where coalesce(p.datos->>'est', 'Disponible') = 'Disponible'
  order by p.creado_en desc
  limit 2000;
$$;
grant execute on function public.catalogo_publico() to anon, authenticated;
-- ✅ Listo.
