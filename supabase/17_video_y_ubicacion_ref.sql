-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 17: el catálogo público para clientes ahora también
--  muestra el video corto de la propiedad (si tiene, plan Premium) y la
--  ubicación referencial (cuando la captación no tiene exclusiva).
--  Pégalo completo en Supabase → SQL Editor → Run. Se puede repetir.
-- ════════════════════════════════════════════════════════════════
create or replace function public.catalogo_publico_cliente()
returns table (id text, datos jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, jsonb_build_object(
    'id', p.datos->'id', 'op', p.datos->'op', 'tipo', p.datos->'tipo',
    'ciudad', p.datos->'ciudad', 'zona', p.datos->'zona',
    'precio', p.datos->'precio', 'mon', p.datos->'mon', 'tcModo', p.datos->'tcModo', 'tc', p.datos->'tc',
    'dorm', p.datos->'dorm', 'ban', p.datos->'ban', 'm2', p.datos->'m2',
    'garaje', p.datos->'garaje', 'gTipo', p.datos->'gTipo', 'gAparte', p.datos->'gAparte', 'gPrecio', p.datos->'gPrecio',
    'mascotas', p.datos->'mascotas', 'mascCond', p.datos->'mascCond', 'amoblado', p.datos->'amoblado',
    'condComp', p.datos->'condComp', 'desc', p.datos->'desc',
    'exclusiva', p.datos->'exclusiva', 'ubic', p.datos->'ubic', 'ubicRef', p.datos->'ubicRef',
    'video', p.datos->'video',
    'est', p.datos->'est', 'dias', p.datos->'dias', '_conf', p.datos->'_conf', 'hue', p.datos->'hue',
    'cap', jsonb_build_object('n', p.datos->'cap'->'n', 'tel', p.datos->'cap'->'tel', 'ciu', p.datos->'ciudad'),
    'fotos', coalesce(p.datos->'fotos', '[]'::jsonb))
  from public.propiedades p
  where coalesce(p.datos->>'est', 'Disponible') = 'Disponible'
  order by p.creado_en desc
  limit 2000;
$$;
grant execute on function public.catalogo_publico_cliente() to anon, authenticated;
-- ✅ Listo. No afecta catalogo_publico() (la vista para visitantes-agente sigue
-- igual de reducida a propósito, para incentivar el registro de agentes).
