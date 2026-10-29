-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 8: requerimientos de la red + "Borrar todo"
--  Pégalo completo en SQL Editor → Run. Se puede repetir sin problema.
-- ════════════════════════════════════════════════════════════════

-- 1) REQUERIMIENTOS DE LA RED
--    Cada agente ve lo que buscan los clientes de los demás (sin el nombre
--    del cliente ni sus notas), para poder ofrecerles propiedades.
--    No aparecen los requerimientos marcados como privados ni los cerrados.
create or replace function public.requerimientos_red()
returns table (id text, agente text, tel text, datos jsonb, creado_en timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, p.nombre, coalesce(p.datos->'perfil'->>'tel', ''),
         jsonb_build_object('op', c.datos->'op', 'ciudad', c.datos->'ciudad', 'zona', c.datos->'zona',
                            'max', c.datos->'max', 'mon', c.datos->'mon', 'dorm', c.datos->'dorm',
                            'garaje', c.datos->'garaje', 'mascotas', c.datos->'mascotas',
                            'amoblado', c.datos->'amoblado', 'mov', c.datos->'mov'),
         c.creado_en
  from public.clientes c
  join public.perfiles p on p.id = c.creado_por
  where auth.uid() is not null
    and c.creado_por <> auth.uid()
    and coalesce(c.datos->>'priv', 'false') <> 'true'
    and coalesce(c.datos->>'etapa', 'Nuevo') not in ('Cerrado ganado', 'Perdido')
  order by c.creado_en desc
  limit 500;
$$;
revoke execute on function public.requerimientos_red() from public, anon;
grant execute on function public.requerimientos_red() to authenticated;

-- 2) BORRAR TODO (solo administradores): elimina los datos de prueba.
--    Conserva las cuentas de administrador. Opcionalmente borra las cuentas
--    de agentes y restablece la configuración.
create or replace function public.admin_borrar_todo(p_confirmacion text, p_usuarios boolean default true, p_config boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare v_us int := 0;
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede borrar los datos'; end if;
  if p_confirmacion is distinct from 'BORRAR TODO' then raise exception 'Escribe BORRAR TODO para confirmar'; end if;

  delete from public.propiedades    where id is not null;
  delete from public.operaciones    where id is not null;
  delete from public.resenas        where id is not null;
  delete from public.reportes       where id is not null;
  delete from public.sugerencias    where id is not null;
  delete from public.pagos          where id is not null;
  delete from public.visitas        where id is not null;
  delete from public.auditoria      where id is not null;
  delete from public.clientes       where id is not null;
  delete from public.favoritos      where id is not null;
  delete from public.notificaciones where id is not null;
  delete from public.busquedas      where id is not null;
  delete from public.ajustes_usuario where clave is not null;

  if p_usuarios then
    select count(*) into v_us from public.perfiles where rol <> 'admin';
    delete from auth.users where id in (select id from public.perfiles where rol <> 'admin');
  end if;

  if p_config then
    update public.ajustes set valor = '{
      "dia": 5,
      "planes": [{"nombre":"Inicial","precio":49},{"nombre":"Profesional","precio":99},{"nombre":"Premium","precio":169}],
      "titular": "", "banco": "", "cuenta": "", "qr": null, "waSoporte": "", "slaPrio": ""
    }'::jsonb, actualizado_en = now() where clave = 'cfg';
  end if;

  return 'Datos borrados' || case when p_usuarios then ' · ' || v_us || ' cuentas de agentes eliminadas' else '' end;
end $$;
revoke execute on function public.admin_borrar_todo(text, boolean, boolean) from public, anon;
grant execute on function public.admin_borrar_todo(text, boolean, boolean) to authenticated;

-- 3) El administrador puede eliminar archivos de la carpeta de fotos (para vaciarla)
do $$
begin
  drop policy if exists vortex_borrar_admin on storage.objects;
  create policy vortex_borrar_admin on storage.objects for delete to authenticated
    using (bucket_id in ('vortex', 'carnets') and public.es_admin());
exception when others then
  raise notice 'No se pudo crear el permiso de borrado de archivos: %', sqlerrm;
end $$;

-- ✅ Listo. Debe aparecer "Success. No rows returned".
