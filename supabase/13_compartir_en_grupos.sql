-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 13: vista previa de propiedades al compartir el
--  enlace en grupos de WhatsApp (foto, tipo, zona, precio).
--  Pégalo en SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════
create or replace function public.propiedad_publica(p_id text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.datos->'id', 'op', p.datos->'op', 'tipo', p.datos->'tipo',
    'ciudad', p.datos->'ciudad', 'zona', p.datos->'zona',
    'precio', p.datos->'precio', 'mon', p.datos->'mon', 'tcModo', p.datos->'tcModo', 'tc', p.datos->'tc',
    'dorm', p.datos->'dorm', 'ban', p.datos->'ban', 'm2', p.datos->'m2',
    'garaje', p.datos->'garaje', 'mascotas', p.datos->'mascotas',
    'foto', p.datos->'fotos'->0)
  from public.propiedades p
  where p.id = p_id and coalesce(p.datos->>'est', 'Disponible') = 'Disponible';
$$;
grant execute on function public.propiedad_publica(text) to anon, authenticated;
-- ✅ Listo.
