-- ════════════════════════════════════════════════════════════════
--  VORTEX · Red de agentes inmobiliarios
--  ARCHIVO 1 DE 2: crea toda la base de datos.
--  Cópialo COMPLETO y pégalo en Supabase → SQL Editor → Run.
--  Se puede ejecutar más de una vez sin problema (no borra datos).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ───────── 1. PERFILES (un registro por cada usuario) ─────────
create table if not exists public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nombre      text not null,
  rol         text not null default 'agente' check (rol in ('agente','admin')),
  datos       jsonb not null default '{}'::jsonb,
  creado_en   timestamptz not null default now()
);
create unique index if not exists perfiles_nombre_unico on public.perfiles (lower(nombre));

-- ¿El usuario conectado es administrador?
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

-- Nombre del usuario conectado
create or replace function public.mi_nombre() returns text
language sql stable security definer set search_path = public as $$
  select nombre from public.perfiles where id = auth.uid();
$$;

-- Crea el perfil automáticamente cuando se crea un usuario en Authentication
create or replace function public.nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nombre text;
begin
  v_nombre := coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1));
  if exists (select 1 from public.perfiles where lower(nombre) = lower(v_nombre)) then
    v_nombre := v_nombre || ' ' || substr(new.id::text, 1, 4);
  end if;
  insert into public.perfiles (id, email, nombre, datos)
  values (new.id, lower(new.email), v_nombre, jsonb_build_object(
    'plan', 'Prueba', 'est', 'Prueba', 'ant', 0, 'venc', null,
    'prueba', jsonb_build_object(
      'inicio', (extract(epoch from now()) * 1000)::bigint,
      'fin',    (extract(epoch from now() + interval '48 hours') * 1000)::bigint)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- Un agente NO puede cambiarse solo su plan, estado, vencimiento ni rol
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if auth.uid() is null or public.es_admin() then return new; end if;
  new.rol := old.rol; new.email := old.email; new.nombre := old.nombre;
  foreach k in array array['plan','est','venc','ant','prueba'] loop
    if old.datos ? k then new.datos := jsonb_set(new.datos, array[k], old.datos->k);
    else new.datos := new.datos - k; end if;
  end loop;
  return new;
end $$;

drop trigger if exists proteger_perfil on public.perfiles;
create trigger proteger_perfil before update on public.perfiles
  for each row execute function public.proteger_perfil();

alter table public.perfiles enable row level security;
drop policy if exists perfiles_ver on public.perfiles;
drop policy if exists perfiles_editar on public.perfiles;
drop policy if exists perfiles_borrar on public.perfiles;
create policy perfiles_ver    on public.perfiles for select to authenticated using (true);
create policy perfiles_editar on public.perfiles for update to authenticated using (id = auth.uid() or public.es_admin()) with check (id = auth.uid() or public.es_admin());
create policy perfiles_borrar on public.perfiles for delete to authenticated using (public.es_admin());

-- Crear perfiles para usuarios que ya existían antes de ejecutar este script
insert into public.perfiles (id, email, nombre, datos)
select u.id, lower(u.email),
       split_part(u.email, '@', 1) || case when exists (select 1 from public.perfiles p where lower(p.nombre) = lower(split_part(u.email, '@', 1))) then ' ' || substr(u.id::text, 1, 4) else '' end,
       jsonb_build_object('plan','Prueba','est','Prueba','ant',0,'venc',null,
         'prueba', jsonb_build_object('inicio',(extract(epoch from now())*1000)::bigint,'fin',(extract(epoch from now()+interval '48 hours')*1000)::bigint))
from auth.users u
where not exists (select 1 from public.perfiles p where p.id = u.id);

-- ───────── 2. TABLAS DE LA APP ─────────
-- Tablas compartidas por la red (cada fila guarda un registro de la app)
do $$
declare t text;
begin
  foreach t in array array['propiedades','operaciones','resenas','reportes','sugerencias','pagos','visitas','auditoria'] loop
    execute format($f$
      create table if not exists public.%I (
        id             text primary key,
        datos          jsonb not null default '{}'::jsonb,
        creado_por     uuid default auth.uid() references auth.users(id) on delete set null,
        creado_en      timestamptz not null default now(),
        actualizado_en timestamptz not null default now()
      )$f$, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create index if not exists %I on public.%I (creado_en)', t || '_creado_idx', t);
  end loop;

  -- Tablas privadas: cada usuario solo ve lo suyo
  foreach t in array array['clientes','favoritos','notificaciones','busquedas'] loop
    execute format($f$
      create table if not exists public.%I (
        creado_por     uuid not null default auth.uid() references auth.users(id) on delete cascade,
        id             text not null,
        datos          jsonb not null default '{}'::jsonb,
        creado_en      timestamptz not null default now(),
        actualizado_en timestamptz not null default now(),
        primary key (creado_por, id)
      )$f$, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_propio', t);
    execute format('create policy %I on public.%I for all to authenticated using (creado_por = auth.uid()) with check (creado_por = auth.uid())', t || '_propio', t);
  end loop;
end $$;

-- Permisos de las tablas compartidas
-- (D = quien lo creó, A = administrador, N = la persona mencionada en el registro)
do $$
declare
  r record;
  D constant text := 'creado_por = auth.uid()';
  A constant text := 'public.es_admin()';
begin
  for r in select * from (values
    -- tabla,        ver,                                                               editar,                                                          borrar
    ('propiedades', 'true',                                                              D||' or '||A,                                                    D||' or '||A),
    ('operaciones', D||' or '||A,                                                        D||' or '||A,                                                    D||' or '||A),
    ('resenas',     'true',                                                              D||' or '||A,                                                    D||' or '||A),
    ('reportes',    D||' or '||A,                                                        D||' or '||A,                                                    A),
    ('sugerencias', D||' or '||A,                                                        D||' or '||A,                                                    D||' or '||A),
    ('pagos',       D||' or '||A||' or datos->>''de'' = public.mi_nombre()',             D||' or '||A,                                                    A),
    ('visitas',     D||' or '||A||' or datos->>''ag'' = public.mi_nombre() or datos->>''de'' = public.mi_nombre()',
                    D||' or '||A||' or datos->>''ag'' = public.mi_nombre() or datos->>''de'' = public.mi_nombre()',  D||' or '||A),
    ('auditoria',   A,                                                                   A,                                                               A)
  ) as v(t, ver, editar, borrar)
  loop
    execute format('drop policy if exists %I on public.%I', r.t||'_ver', r.t);
    execute format('drop policy if exists %I on public.%I', r.t||'_crear', r.t);
    execute format('drop policy if exists %I on public.%I', r.t||'_editar', r.t);
    execute format('drop policy if exists %I on public.%I', r.t||'_borrar', r.t);
    execute format('create policy %I on public.%I for select to authenticated using (%s)', r.t||'_ver', r.t, r.ver);
    execute format('create policy %I on public.%I for insert to authenticated with check (creado_por = auth.uid())', r.t||'_crear', r.t);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (true)', r.t||'_editar', r.t, r.editar);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', r.t||'_borrar', r.t, r.borrar);
  end loop;
end $$;

-- Contadores de vistas / guardados de propiedades ajenas
create or replace function public.sumar_contador(p_id text, p_campo text, p_n int default 1) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_campo not in ('vistas','guardados') or p_n < 1 or p_n > 50 then return; end if;
  update public.propiedades
     set datos = jsonb_set(datos, array[p_campo], to_jsonb(coalesce((datos->>p_campo)::int, 0) + p_n))
   where id = p_id;
end $$;

-- ───────── 3. AJUSTES ─────────
create table if not exists public.ajustes (
  clave          text primary key,
  valor          jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);
alter table public.ajustes enable row level security;
drop policy if exists ajustes_ver on public.ajustes;
drop policy if exists ajustes_admin on public.ajustes;
create policy ajustes_ver   on public.ajustes for select to authenticated using (true);
create policy ajustes_admin on public.ajustes for all    to authenticated using (public.es_admin()) with check (public.es_admin());

create table if not exists public.ajustes_usuario (
  usuario uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clave   text not null,
  valor   jsonb not null default '{}'::jsonb,
  primary key (usuario, clave)
);
alter table public.ajustes_usuario enable row level security;
drop policy if exists ajustes_usuario_propio on public.ajustes_usuario;
create policy ajustes_usuario_propio on public.ajustes_usuario for all to authenticated using (usuario = auth.uid()) with check (usuario = auth.uid());

-- Configuración inicial de cobros (se puede cambiar desde la app: Panel admin → Cobros)
insert into public.ajustes (clave, valor) values ('cfg', '{
  "dia": 5,
  "planes": [{"nombre":"Inicial","precio":49},{"nombre":"Profesional","precio":99},{"nombre":"Premium","precio":169}],
  "titular": "", "banco": "", "cuenta": "", "qr": null, "waSoporte": "", "slaPrio": ""
}'::jsonb) on conflict (clave) do nothing;

-- ───────── 4. GESTIÓN DE USUARIOS DESDE LA APP (solo administradores) ─────────
create or replace function public.crear_usuario(p_email text, p_password text, p_nombre text, p_rol text default 'agente', p_datos jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_nom   text := trim(p_nombre);
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede crear usuarios'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El correo no es válido'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  if length(coalesce(v_nom, '')) < 3 then raise exception 'Escribe el nombre completo'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then raise exception 'Ya existe un usuario con ese correo'; end if;
  if exists (select 1 from public.perfiles where lower(nombre) = lower(v_nom)) then raise exception 'Ya existe un usuario con ese nombre'; end if;

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
     set rol = case when p_rol = 'admin' then 'admin' else 'agente' end,
         datos = jsonb_strip_nulls(datos || coalesce(p_datos, '{}'::jsonb))
   where id = v_id;
  return v_id;
end $$;

create or replace function public.admin_cambiar_clave(p_uid uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede cambiar contraseñas'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La contraseña debe tener al menos 6 caracteres'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_uid;
end $$;

create or replace function public.eliminar_usuario(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede eliminar usuarios'; end if;
  if p_uid = auth.uid() then raise exception 'No puedes eliminar tu propia cuenta'; end if;
  delete from auth.users where id = p_uid;
end $$;

revoke execute on function public.crear_usuario(text, text, text, text, jsonb) from public, anon;
revoke execute on function public.admin_cambiar_clave(uuid, text) from public, anon;
revoke execute on function public.eliminar_usuario(uuid) from public, anon;
revoke execute on function public.sumar_contador(text, text, int) from public, anon;

-- ───────── 5. PERMISOS GENERALES ─────────
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- ───────── 6. ALMACENAMIENTO DE IMÁGENES (bucket "vortex") ─────────
-- Si tu proyecto no permite crearlo por aquí, verás un aviso (NOTICE)
-- y deberás crearlo a mano en Storage (ver instrucciones). El resto queda igual.
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('vortex', 'vortex', true)
  on conflict (id) do update set public = true;

  drop policy if exists vortex_subir  on storage.objects;
  drop policy if exists vortex_ver    on storage.objects;
  drop policy if exists vortex_borrar on storage.objects;
  create policy vortex_subir  on storage.objects for insert to authenticated with check (bucket_id = 'vortex');
  create policy vortex_ver    on storage.objects for select using (bucket_id = 'vortex');
  create policy vortex_borrar on storage.objects for delete to authenticated using (bucket_id = 'vortex' and owner = auth.uid());
exception when others then
  raise notice 'No se pudo preparar el almacenamiento automáticamente: %. Crea el bucket "vortex" (público) a mano en Storage.', sqlerrm;
end $$;

-- ✅ Listo. Si ves "Success. No rows returned", la base de datos quedó creada.
