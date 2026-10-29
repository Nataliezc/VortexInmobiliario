// Mantiene activo el proyecto de Supabase (el plan gratuito se pausa tras 7 días sin uso).
// Netlify ejecuta esta función automáticamente una vez al día.
export default async () => {
  const URL_SB = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY;
  if (!URL_SB || !KEY) { console.log("Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"); return new Response("sin configurar"); }
  const r = await fetch(`${URL_SB}/rest/v1/rpc/catalogo_publico?limit=1`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: "{}" });
  console.log("Supabase respondió", r.status);
  return new Response(`ok ${r.status}`);
};
export const config = { schedule: "@daily" };
