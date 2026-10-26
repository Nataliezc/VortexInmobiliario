# Vortex · código fuente (React + Vite + Tailwind + Supabase)

- `public/config.js` → los dos datos de conexión (Project URL y clave pública).
- `supabase/` → scripts SQL (esquema, administrador, permisos de fotos).
- `src/Vortex.jsx` → la aplicación (pantallas y lógica).
- `src/datos.js` → guarda/lee automáticamente cada lista en su tabla de Supabase.
- `src/archivos.js` → sube imágenes al bucket `vortex`.
- `src/App.jsx`, `src/Login.jsx`, `src/Cuentas.jsx` → sesión, inicio de sesión y gestión de usuarios.

Comandos: `npm install`, `npm run dev` (local), `npm run build` (genera `dist/`).
En Netlify: conectar el repositorio; `netlify.toml` ya indica el comando y la carpeta.
