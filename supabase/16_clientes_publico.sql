-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 16: cuentas de "cliente" (público general)
--
--  Crea un tercer tipo de cuenta, distinto de agente y administrador:
--  el "cliente" es cualquier persona del público que se registra para
--  buscar propiedades con ficha completa, guardar favoritos, recibir
--  avisos si algo que guardó cambia, y calificar al captador cuando
--  se concreta un cierre con una propiedad que guardó.
--
--  Pégalo completo en Supabase → SQL Editor → Run. Se puede repetir.
-- ════════════════════════════════════════════════════════════════

-- 1) Permitir el nuevo rol "cliente" en perfiles
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check check (rol in ('agente', 'admin', 'cliente'));

-- 2) Registro libre de clientes (público en general, no agentes)
--    No pide carnet, no tiene prueba ni plan: el acceso de cliente no vence.
create or replace function public.registrarse_cliente(p_email text, p_password text, p_nombre text, p_tel text default '', p_terminos boolean default false)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_nom   text := trim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g'));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El correo no es válido'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  if length(v_nom) < 3 then raise exception 'Escribe tu nombre'; end if;
  if not coalesce(p_terminos, false) then raise exception 'Debes aceptar los términos y la política de privacidad'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'Ya existe una cuenta con ese correo. Inicia sesión.'; end if;
  if (select count(*) from auth.users where created_at > now() - interval '1 hour') >= 60 then
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

  -- El perfil ya se creó con el disparador nuevo_usuario(); aquí lo pasamos a rol "cliente"
  -- y guardamos su WhatsApp (si lo dio) sin plan, sin prueba y sin pedirle carnet.
  update public.perfiles
     set rol = 'cliente',
         datos = jsonb_build_object('perfil', jsonb_build_object('tel', coalesce(p_tel, ''), 'bio', '', 'ciu', '[]'::jsonb))
   where id = v_id;
  return v_id;
end $$;
grant execute on function public.registrarse_cliente(text, text, text, text, boolean) to anon, authenticated;

-- 3) Un cliente puede calificar al captador (se guarda en "resenas", igual que las
--    reseñas entre agentes; la columna "de" ya identifica quién la escribió).
--    La tabla "resenas" ya permite insertar/leer a cualquier usuario autenticado
--    (ver archivo 1_esquema.sql), así que no se necesita ningún cambio de permisos.

-- 4) Avisos push para clientes:
--    - "guardado_cambio": una propiedad guardada cambió de estado o ya no existe (al cliente mismo)
--    - "cliente_match": nueva propiedad que coincide con una búsqueda guardada (al cliente mismo)
--    - "cierre_cliente": un cliente avisó que cerró trato con una propiedad (a los administradores)
create or replace function public.push_destinos(p_evento text, p_para text default null)
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_evento in ('prueba', 'guardado_cambio', 'cliente_match') then
    return query select s.datos from public.push_suscripciones s where s.usuario = auth.uid();
  elsif p_evento in ('pago', 'registro', 'cierre_cliente') then
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.rol = 'admin';
  elsif p_evento in ('pago_revisado', 'verificado') then
    if not public.es_admin() then raise exception 'No permitido'; end if;
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.nombre = p_para;
  elsif p_evento = 'visita' then
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.nombre = p_para and p.id <> auth.uid();
  end if;
end $$;
revoke execute on function public.push_destinos(text, text) from public, anon;
grant execute on function public.push_destinos(text, text) to authenticated;

-- ✅ Listo. Debe aparecer "Success. No rows returned". Si ya habías corrido una versión
-- anterior de este archivo, no hay problema: se puede volver a ejecutar completo.
-- Recuerda también actualizar netlify/functions/notificar.mjs (ya incluido en el proyecto)
-- para que reconozca los eventos "guardado_cambio", "cliente_match" y "cierre_cliente".
-- No se necesita ningún otro cambio de base de datos para las búsquedas guardadas, el
-- historial de contactos ni "avisar cierre": usan las tablas "busquedas" y
-- "ajustes_usuario" que ya existen desde el archivo 1_esquema.sql.
