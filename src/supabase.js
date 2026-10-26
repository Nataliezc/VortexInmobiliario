// Cliente de Supabase. Los datos de conexión se leen de /config.js
// (el único archivo que debes editar).
import { createClient } from "@supabase/supabase-js";

const cfg = (typeof window !== "undefined" && window.VORTEX_CONFIG) || {};
export const SUPABASE_URL = (cfg.SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL || "").trim();
export const SUPABASE_KEY = (cfg.SUPABASE_KEY || import.meta.env?.VITE_SUPABASE_KEY || "").trim();
export const configurado = /^https:\/\/.+/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20 && !SUPABASE_URL.includes("TU-PROYECTO");
export const BUCKET = "vortex";

export const supabase = configurado
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
