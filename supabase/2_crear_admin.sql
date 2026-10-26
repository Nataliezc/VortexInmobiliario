-- ════════════════════════════════════════════════════════════════
--  VORTEX · ARCHIVO 2 DE 2: convierte tu usuario en ADMINISTRADOR
--
--  Antes de ejecutarlo:
--   1. Ejecuta primero 1_esquema.sql
--   2. En Supabase → Authentication → Users → "Add user" → "Create new user"
--      escribe tu correo y contraseña y MARCA "Auto Confirm User".
--
--  Ahora cambia SOLO las dos líneas marcadas con 👉 y presiona Run.
-- ════════════════════════════════════════════════════════════════

update public.perfiles
set rol    = 'admin',
    nombre = 'Administrador Vortex',            -- 👉 tu nombre como aparecerá en la app
    datos  = (datos - 'prueba') || '{"plan":"Premium","est":"Activo","venc":"2099-12-31","ant":0}'::jsonb
where email = lower('admin@tuempresa.com');     -- 👉 el mismo correo que creaste en Authentication

-- Comprobación: debe aparecer una fila con rol = admin
select email, nombre, rol from public.perfiles where rol = 'admin';
