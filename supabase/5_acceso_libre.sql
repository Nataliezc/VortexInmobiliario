-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 5: acceso libre + registro de nuevos agentes
--
--  Permite que cualquier persona entre a la app SIN cuenta (plan
--  Gratuito, solo datos básicos de las propiedades) y que se
--  registre sola con correo, contraseña y foto de su carnet.
--
--  Pégalo completo en SQL Editor → Run. Se puede repetir sin problema.
-- ════════════════════════════════════════════════════════════════

-- 1) Catálogo público: SOLO datos básicos (sin captador, teléfono,
--    fotos, descripción ni condiciones) para quien no inició sesión.
create or replace function public.catalogo_publico()
returns table (id text, datos jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, jsonb_build_object(
    'id', p.datos->'id', 'op', p.datos->'op', 'tipo', p.datos->'tipo',
    'ciudad', p.datos->'ciudad', 'zona', p.datos->'zona',
    'precio', p.datos->'precio', 'mon', p.datos->'mon',
    'dorm', p.datos->'dorm', 'ban', p.datos->'ban', 'm2', p.datos->'m2',
    'est', p.datos->'est', 'dias', p.datos->'dias', '_conf', p.datos->'_conf', 'hue', p.datos->'hue',
    'cap', jsonb_build_object('n', '', 'ciu', p.datos->'ciudad'),
    'fotos', '[]'::jsonb)
  from public.propiedades p
  where coalesce(p.datos->>'est', 'Disponible') not in ('Cerrado', 'Caído')
  order by p.creado_en desc
  limit 2000;
$$;
grant execute on function public.catalogo_publico() to anon, authenticated;

-- 2) Los visitantes pueden leer la configuración de planes y precios
grant select on public.ajustes to anon;
drop policy if exists ajustes_ver_publico on public.ajustes;
create policy ajustes_ver_publico on public.ajustes for select to anon using (clave = 'cfg');

-- 3) Registro libre: crea la cuenta ya confirmada (con 48 h de prueba)
create or replace function public.registrarse(p_email text, p_password text, p_nombre text, p_tel text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_nom   text := trim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g'));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El correo no es válido'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  if length(v_nom) < 5 then raise exception 'Escribe tu nombre y apellido'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'Ya existe una cuenta con ese correo. Inicia sesión.'; end if;
  if exists (select 1 from public.perfiles where lower(nombre) = lower(v_nom)) then raise exception 'Ya hay un agente con ese nombre. Agrega tu segundo apellido.'; end if;
  if (select count(*) from auth.users where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Hay demasiados registros en este momento. Intenta de nuevo en unos minutos.';
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nombre', v_nom),
          now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());

  update public.perfiles
     set datos = datos || jsonb_build_object('perfil', jsonb_build_object('tel', coalesce(p_tel, ''), 'bio', '', 'ciu', '[]'::jsonb))
   where id = v_id;
  return v_id;
end $$;
grant execute on function public.registrarse(text, text, text, text) to anon, authenticated;

-- 4) Guardar las fotos del carnet en el perfil del usuario que se registró
create or replace function public.guardar_carnet(p_front text, p_back text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  update public.perfiles
     set datos = datos || jsonb_build_object('ci', jsonb_build_object('front', p_front, 'back', p_back))
   where id = auth.uid();
end $$;
revoke execute on function public.guardar_carnet(text, text) from public, anon;
grant execute on function public.guardar_carnet(text, text) to authenticated;

-- ✅ Listo. Debe aparecer "Success. No rows returned".
