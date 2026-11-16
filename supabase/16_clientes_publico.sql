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
--    Las reseñas de cliente se guardan con "tipo":"cliente" y pueden llevar un
--    comentario ("coment") además del puntaje; las de colega llevan "tipo":"agente".

-- 3.1) Tabla "solicitudes": un cliente avisa que se cerró trato en una propiedad,
--      pero esto NO cuenta como cierre real hasta que el captador lo confirme.
--      Misma forma que las demás tablas compartidas (propiedades, resenas...).
--      La ve quien la creó (el cliente), el captador mencionado (datos->>'cap')
--      y los administradores; solo el captador o un admin pueden aprobarla/rechazarla.
create table if not exists public.solicitudes (
  id             text primary key,
  datos          jsonb not null default '{}'::jsonb,
  creado_por     uuid default auth.uid() references auth.users(id) on delete set null,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
alter table public.solicitudes enable row level security;
create index if not exists solicitudes_creado_idx on public.solicitudes (creado_en);
drop policy if exists solicitudes_ver on public.solicitudes;
drop policy if exists solicitudes_crear on public.solicitudes;
drop policy if exists solicitudes_editar on public.solicitudes;
drop policy if exists solicitudes_borrar on public.solicitudes;
create policy solicitudes_ver on public.solicitudes for select to authenticated using (
  creado_por = auth.uid() or datos->>'cap' = public.mi_nombre() or public.es_admin()
);
create policy solicitudes_crear on public.solicitudes for insert to authenticated with check (creado_por = auth.uid());
create policy solicitudes_editar on public.solicitudes for update to authenticated using (
  datos->>'cap' = public.mi_nombre() or public.es_admin()
) with check (true);
create policy solicitudes_borrar on public.solicitudes for delete to authenticated using (
  creado_por = auth.uid() or datos->>'cap' = public.mi_nombre() or public.es_admin()
);

-- 3.2) Catálogo público PARA CLIENTES: a diferencia de catalogo_publico() (que
--      oculta al captador y su teléfono para incentivar que el agente se
--      registre), a quien entra como "cliente que busca" sin cuenta SÍ se le
--      muestra el nombre y WhatsApp del captador, para que pueda escribirle
--      de una vez sin necesidad de registrarse. Guardar, avisos y calificar
--      sí siguen pidiendo cuenta (eso se controla en la propia app).
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
    'est', p.datos->'est', 'dias', p.datos->'dias', '_conf', p.datos->'_conf', 'hue', p.datos->'hue',
    'cap', jsonb_build_object('n', p.datos->'cap'->'n', 'tel', p.datos->'cap'->'tel', 'ciu', p.datos->'ciudad'),
    'fotos', coalesce(p.datos->'fotos', '[]'::jsonb))
  from public.propiedades p
  where coalesce(p.datos->>'est', 'Disponible') = 'Disponible'
  order by p.creado_en desc
  limit 2000;
$$;
grant execute on function public.catalogo_publico_cliente() to anon, authenticated;

-- 4) Avisos push para clientes:
--    - "guardado_cambio": una propiedad guardada cambió de estado o ya no existe (al cliente mismo)
--    - "cliente_match": nueva propiedad que coincide con una búsqueda guardada (al cliente mismo)
--    - "cierre_cliente": un cliente avisó un cierre pendiente de confirmar (al captador, p_para = su nombre)
create or replace function public.push_destinos(p_evento text, p_para text default null)
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_evento in ('prueba', 'guardado_cambio', 'cliente_match') then
    return query select s.datos from public.push_suscripciones s where s.usuario = auth.uid();
  elsif p_evento in ('pago', 'registro') then
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.rol = 'admin';
  elsif p_evento in ('pago_revisado', 'verificado') then
    if not public.es_admin() then raise exception 'No permitido'; end if;
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.nombre = p_para;
  elsif p_evento in ('visita', 'cierre_cliente') then
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
-- historial de contactos ni "avisar cierre": usan las tablas "busquedas", "solicitudes"
-- y "ajustes_usuario", ya creadas en este archivo y en 1_esquema.sql.
