-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 4 (OPCIONAL): crea 5 cuentas de prueba, una por
--  cada tipo, para entrar desde otro celular o navegador y ver cómo
--  funciona cada una con sus restricciones.
--
--  Todas usan la contraseña:  Vortex2026
--    prueba@example.com       → Prueba (48 h de acceso completo)
--    gratuito@example.com     → Gratuito (acceso limitado)
--    inicial@example.com      → Plan Inicial
--    profesional@example.com  → Plan Profesional
--    premium@example.com      → Plan Premium
--  (El SuperAdmin es tu propio usuario.)
--
--  Pégalo en SQL Editor → Run. Puedes ejecutarlo de nuevo cuando
--  quieras: reinicia las 5 cuentas (la prueba vuelve a tener 48 h).
--  Para borrarlas: Panel SuperAdmin → Usuarios → 🗑 Eliminar cuenta.
-- ════════════════════════════════════════════════════════════════

do $$
declare
  c record;
  v_id uuid;
  v_ms bigint := (extract(epoch from now()) * 1000)::bigint;
  v_venc text := to_char((date_trunc('month', now()) + interval '1 month' + interval '4 days')::date, 'YYYY-MM-DD');
begin
  for c in select * from (values
    ('prueba@example.com',      'Cuenta Prueba',      jsonb_build_object('plan','Prueba','est','Prueba','ant',0,'prueba', jsonb_build_object('inicio', v_ms, 'fin', v_ms + 48*3600*1000))),
    ('gratuito@example.com',    'Cuenta Gratuito',    jsonb_build_object('plan','Gratuito','est','Vencido','ant',0)),
    ('inicial@example.com',     'Cuenta Inicial',     jsonb_build_object('plan','Inicial','est','Activo','ant',0,'venc', v_venc, 'insc', jsonb_build_object('plan','Inicial','f', to_char(now(),'YYYY-MM-DD')))),
    ('profesional@example.com', 'Cuenta Profesional', jsonb_build_object('plan','Profesional','est','Activo','ant',0,'venc', v_venc, 'insc', jsonb_build_object('plan','Profesional','f', to_char(now(),'YYYY-MM-DD')))),
    ('premium@example.com',     'Cuenta Premium',     jsonb_build_object('plan','Premium','est','Activo','ant',0,'venc', v_venc, 'insc', jsonb_build_object('plan','Premium','f', to_char(now(),'YYYY-MM-DD'))))
  ) as t(email, nombre, datos)
  loop
    select id into v_id from auth.users where lower(email) = c.email;
    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', c.email,
              extensions.crypt('Vortex2026', extensions.gen_salt('bf')), now(),
              '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nombre', c.nombre),
              now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_id, v_id::text,
              jsonb_build_object('sub', v_id::text, 'email', c.email, 'email_verified', true),
              'email', now(), now(), now());
    else
      update auth.users set encrypted_password = extensions.crypt('Vortex2026', extensions.gen_salt('bf')) where id = v_id;
    end if;
    update public.perfiles set rol = 'agente', datos = c.datos where id = v_id;
  end loop;
end $$;

-- Comprobación: deben aparecer las 5 cuentas
select email, nombre, datos->>'plan' as plan, datos->>'est' as estado
from public.perfiles where email like '%@example.com' order by creado_en;
