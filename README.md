# Vortex · Red de agentes inmobiliarios (React + Vite + Tailwind + Supabase)

## Conexión con Supabase
Usa las variables de entorno de Netlify (Site configuration → Environment variables):
- `VITE_SUPABASE_URL` → Project URL
- `VITE_SUPABASE_ANON_KEY` → clave pública (anon / publishable)

Después de crearlas o cambiarlas: Deploys → Trigger deploy → Clear cache and deploy site.
(Alternativa: escribir los datos en `public/config.js`.)

## Base de datos
Scripts en `supabase/`, en este orden, en el SQL Editor de Supabase:
1. `1_esquema.sql`
2. `2_crear_admin.sql` (después de crear tu usuario en Authentication con "Auto Confirm User")
3. `3_solo_si_fallan_las_fotos.sql` (solo si falla la subida de imágenes)

## Archivos
- `src/Vortex.jsx` → pantallas y lógica de la app
- `src/datos.js` → guarda/lee cada lista en su tabla de Supabase
- `src/archivos.js` → sube imágenes al bucket `vortex`
- `src/App.jsx`, `src/Login.jsx`, `src/Cuentas.jsx` → sesión, login y gestión de usuarios

## Comandos
npm install · npm run dev (local) · npm run build (genera dist/)
