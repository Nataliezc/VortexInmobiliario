// Cliente de Supabase.
// Los datos de conexión se toman, en este orden:
//   1) public/config.js (si tiene datos reales)
//   2) Variables de entorno de Netlify: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
import { createClient } from "@supabase/supabase-js";

const cfg = (typeof window !== "undefined" && window.VORTEX_CONFIG) || {};
const env = import.meta.env || {};
const limpio = (v) => (typeof v === "string" && v.trim() && !/TU-PROYECTO|PEGA-AQUI/i.test(v) ? v.trim() : "");

export const SUPABASE_URL = limpio(cfg.SUPABASE_URL) || limpio(env.VITE_SUPABASE_URL);
export const SUPABASE_KEY = limpio(cfg.SUPABASE_KEY) || limpio(env.VITE_SUPABASE_ANON_KEY) || limpio(env.VITE_SUPABASE_KEY);
export const configurado = /^https:\/\/.+/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;
export const BUCKET = "vortex";

export const supabase = configurado
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
