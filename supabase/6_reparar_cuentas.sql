-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 6: reparar cuentas que no pueden iniciar sesión
--
--  Corrige las cuentas creadas a mano, por la app o con los scripts:
--  las confirma, completa datos internos vacíos y crea lo que les
--  falte para poder entrar. No borra ni cambia contraseñas.
--  Pégalo completo en SQL Editor → Run. Se puede repetir.
-- ════════════════════════════════════════════════════════════════

-- 1) Completar datos internos vacíos y confirmar el correo
update auth.users set
  email                      = lower(email),
  aud                        = coalesce(aud, 'authenticated'),
  role                       = coalesce(role, 'authenticated'),
  instance_id                = coalesce(instance_id, '00000000-0000-0000-0000-000000000000'),
  email_confirmed_at         = coalesce(email_confirmed_at, now()),
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, ''),
  raw_app_meta_data          = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb
where true;

-- 2) Crear la "identidad de correo" a las cuentas que no la tienen
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', lower(u.email), 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- 3) De aquí en adelante, las cuentas nuevas nunca quedan con datos vacíos
create or replace function public.completar_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.confirmation_token         := coalesce(new.confirmation_token, '');
  new.recovery_token             := coalesce(new.recovery_token, '');
  new.email_change_token_new     := coalesce(new.email_change_token_new, '');
  new.email_change               := coalesce(new.email_change, '');
  new.email_change_token_current := coalesce(new.email_change_token_current, '');
  new.phone_change               := coalesce(new.phone_change, '');
  new.phone_change_token         := coalesce(new.phone_change_token, '');
  new.reauthentication_token     := coalesce(new.reauthentication_token, '');
  return new;
end $$;
drop trigger if exists completar_usuario on auth.users;
create trigger completar_usuario before insert or update on auth.users
  for each row execute function public.completar_usuario();

-- 4) Crear perfil a quien no lo tenga
insert into public.perfiles (id, email, nombre, datos)
select u.id, lower(u.email),
       coalesce(nullif(trim(u.raw_user_meta_data->>'nombre'), ''), split_part(u.email, '@', 1)) || ' ' || substr(u.id::text, 1, 4),
       '{"plan":"Gratuito","est":"Vencido","ant":0}'::jsonb
from auth.users u
where not exists (select 1 from public.perfiles p where p.id = u.id);

-- 5) (OPCIONAL) Poner una contraseña nueva a una cuenta.
--    Quita los dos guiones del inicio de la línea, cambia el correo y la clave y vuelve a ejecutar.
-- update auth.users set encrypted_password = extensions.crypt('NuevaClave123', extensions.gen_salt('bf')) where email = lower('correo@ejemplo.com');

-- Revisión: todas las cuentas deben decir confirmado = true, identidad = true y tener rol
select u.email,
       u.email_confirmed_at is not null as confirmado,
       exists (select 1 from auth.identities i where i.user_id = u.id) as identidad,
       p.nombre, p.rol, p.datos->>'plan' as plan
from auth.users u left join public.perfiles p on p.id = u.id
order by u.created_at;
