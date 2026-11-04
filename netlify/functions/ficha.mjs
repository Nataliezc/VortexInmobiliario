// Página de vista previa de una propiedad para WhatsApp/Facebook (enlace /p/ID).
// WhatsApp lee estas etiquetas y muestra foto + título + descripción en el grupo.
// Las personas que tocan el enlace son llevadas a la app, directo a esa propiedad.
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (n) => Number(n || 0).toLocaleString("es-BO");

export default async (req) => {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "").replace(/[^\w-]/g, "");
  const base = `${url.protocol}//${url.host}`;
  const destino = id ? `${base}/?p=${encodeURIComponent(id)}` : base;
  let p = null;
  try {
    const r = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/propiedad_publica`, {
      method: "POST",
      headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_id: id }),
    });
    if (r.ok) p = await r.json();
  } catch (e) { console.warn(e); }

  let titulo = "Vortex · Red de agentes inmobiliarios", desc = "Propiedades en venta y alquiler en Bolivia, compartidas por agentes verificados.", img = `${base}/icono-512.png`;
  if (p && p.op) {
    const precio = `${p.mon === "USD" ? "USD" : "Bs"} ${num(p.precio)}${p.mon === "USD" ? (p.tcModo === "fijo" && p.tc ? ` (TC ${p.tc})` : " (TC del día)") : ""}`;
    titulo = `${p.tipo || "Inmueble"} en ${String(p.op).toLowerCase()} · ${p.zona ? p.zona + ", " : ""}${p.ciudad || ""} · ${precio}`;
    desc = [p.dorm ? `🛏 ${p.dorm} dorm.` : "", p.ban ? `🚿 ${p.ban} baños` : "", p.m2 ? `📐 ${p.m2} m²` : "", `🚗 Garaje: ${p.garaje ? "sí" : "no"}`, p.mascotas ? `🐾 Mascotas: ${String(p.mascotas).toLowerCase()}` : ""].filter(Boolean).join(" · ") + " — Mira las fotos en Vortex.";
    if (p.foto) img = p.foto;
  }
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vortex">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(`${base}/p/${id}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(destino)}">
</head><body style="font-family:sans-serif;padding:24px">
<p>Abriendo la propiedad en Vortex… <a href="${esc(destino)}">Toca aquí si no se abre</a>.</p>
<script>location.replace(${JSON.stringify(destino)});</script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
};
