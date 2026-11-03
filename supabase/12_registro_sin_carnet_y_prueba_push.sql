-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 12:
--   • Registro SIN carnet: la cuenta nueva empieza de inmediato su prueba
--     de 48 h. El carnet se pide solo en el PRIMER pago.
--   • Botón "Enviar notificación de prueba".
--  Pégalo completo en SQL Editor → Run. Se puede repetir sin problema.
-- ════════════════════════════════════════════════════════════════

create or replace function public.registrarse(p_email text, p_password text, p_nombre text, p_tel text default '', p_terminos boolean default false)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_nom   text := trim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g'));
  v_ms    bigint := (extract(epoch from now()) * 1000)::bigint;
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
     set datos = datos || jsonb_build_object(
           'plan', 'Prueba', 'est', 'Prueba',
           'prueba', jsonb_build_object('inicio', v_ms, 'fin', v_ms + 48 * 3600 * 1000),
           'terminos', to_char(now(), 'YYYY-MM-DD'),
           'perfil', jsonb_build_object('tel', coalesce(p_tel, ''), 'bio', '', 'ciu', '[]'::jsonb))
   where id = v_id;
  return v_id;
end $$;
grant execute on function public.registrarse(text, text, text, text, boolean) to anon, authenticated;

-- A quién enviar cada aviso (se agrega "prueba": te la envía a ti mismo)
create or replace function public.push_destinos(p_evento text, p_para text default null)
returns setof jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  if p_evento = 'prueba' then
    return query select s.datos from public.push_suscripciones s where s.usuario = auth.uid();
  elsif p_evento in ('pago', 'registro') then
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

-- ✅ Listo.
