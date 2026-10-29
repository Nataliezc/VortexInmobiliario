-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 7: carnets privados, verificación de nuevos
--  registros, términos y notificaciones en el celular.
--  Pégalo completo en SQL Editor → Run. Se puede repetir sin problema.
-- ════════════════════════════════════════════════════════════════

-- 1) CARPETA PRIVADA PARA CARNETS ("carnets")
--    Solo la persona dueña del carnet y los administradores pueden verlo.
do $$
begin
  insert into storage.buckets (id, name, public) values ('carnets', 'carnets', false)
  on conflict (id) do update set public = false;

  drop policy if exists carnets_subir  on storage.objects;
  drop policy if exists carnets_ver    on storage.objects;
  drop policy if exists carnets_borrar on storage.objects;
  create policy carnets_subir on storage.objects for insert to authenticated
    with check (bucket_id = 'carnets' and (storage.foldername(name))[1] = auth.uid()::text);
  create policy carnets_ver on storage.objects for select to authenticated
    using (bucket_id = 'carnets' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));
  create policy carnets_borrar on storage.objects for delete to authenticated
    using (bucket_id = 'carnets' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));
exception when others then
  raise notice 'No se pudo crear la carpeta "carnets" automáticamente: %. Créala a mano en Storage (privada).', sqlerrm;
end $$;

-- 2) REGISTRO: la cuenta nueva queda "en verificación" hasta que el administrador revise el carnet.
--    También guarda la aceptación de los términos.
drop function if exists public.registrarse(text, text, text, text);
create or replace function public.registrarse(p_email text, p_password text, p_nombre text, p_tel text default '', p_terminos boolean default false)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_nom   text := trim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g'));
begin
  if not coalesce(p_terminos, false) then raise exception 'Debes aceptar los términos y la política de privacidad'; end if;
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
     set datos = (datos - 'prueba') || jsonb_build_object(
           'plan', 'Prueba', 'est', 'Verificación',
           'terminos', to_char(now(), 'YYYY-MM-DD'),
           'perfil', jsonb_build_object('tel', coalesce(p_tel, ''), 'bio', '', 'ciu', '[]'::jsonb))
   where id = v_id;
  return v_id;
end $$;
grant execute on function public.registrarse(text, text, text, text, boolean) to anon, authenticated;

-- 3) NOTIFICACIONES EN EL CELULAR: dónde se guarda cada celular que las activó
create table if not exists public.push_suscripciones (
  usuario   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint  text not null,
  datos     jsonb not null,
  creado_en timestamptz not null default now(),
  primary key (usuario, endpoint)
);
alter table public.push_suscripciones enable row level security;
drop policy if exists push_propio on public.push_suscripciones;
create policy push_propio on public.push_suscripciones for all to authenticated
  using (usuario = auth.uid()) with check (usuario = auth.uid());
grant select, insert, update, delete on public.push_suscripciones to authenticated;

-- A quién enviar cada aviso (lo usa la función "notificar" de Netlify)
create or replace function public.push_destinos(p_evento text, p_para text default null)
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_evento in ('pago', 'registro') then
    -- avisos para los administradores
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.rol = 'admin';
  elsif p_evento in ('pago_revisado', 'verificado') then
    -- solo un administrador puede avisar a un agente sobre su pago o verificación
    if not public.es_admin() then raise exception 'No permitido'; end if;
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.nombre = p_para;
  elsif p_evento = 'visita' then
    -- aviso al agente captador de una visita agendada
    return query select s.datos from public.push_suscripciones s join public.perfiles p on p.id = s.usuario where p.nombre = p_para and p.id <> auth.uid();
  end if;
end $$;
revoke execute on function public.push_destinos(text, text) from public, anon;
grant execute on function public.push_destinos(text, text) to authenticated;

-- ✅ Listo. Debe aparecer "Success. No rows returned".
