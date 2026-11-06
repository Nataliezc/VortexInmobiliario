-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 15: usuarios preferentes
--  Solo el administrador puede marcar a alguien como "preferente"
--  (acceso gratis sin vencimiento). Un agente no puede dárselo a sí mismo.
--  Pégalo en SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if auth.uid() is null or public.es_admin() then return new; end if;
  new.rol := old.rol; new.email := old.email; new.nombre := old.nombre;
  foreach k in array array['plan','est','venc','ant','prueba','pref'] loop
    if old.datos ? k then new.datos := jsonb_set(new.datos, array[k], old.datos->k);
    else new.datos := new.datos - k; end if;
  end loop;
  return new;
end $$;
-- ✅ Listo.
