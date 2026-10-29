// Envía notificaciones push a los celulares (pagos, registros, aprobaciones...).
// Variables necesarias en Netlify: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
import webpush from "web-push";

const MENSAJES = {
  pago: (d) => ({ titulo: "💳 Nuevo pago por verificar", cuerpo: `${d.de || "Un agente"} envió un pago${d.monto ? ` de Bs ${d.monto}` : ""}${d.plan ? ` (plan ${d.plan})` : ""}.`, tag: "pago" }),
  registro: (d) => ({ titulo: "🪪 Nuevo registro por verificar", cuerpo: `${d.nombre || "Un nuevo agente"} se registró y espera la verificación de su carnet.`, tag: "registro" }),
  pago_revisado: (d) => ({ titulo: d.est === "Aprobado" ? "✅ Pago aprobado" : "⚠️ Pago rechazado", cuerpo: d.est === "Aprobado" ? `Tu plan ${d.plan || ""} ya está activo. ¡Gracias!` : `Revisa el motivo en Perfil → Suscripción${d.mot ? `: ${d.mot}` : ""}.` }),
  verificado: (d) => ({ titulo: d.ok ? "✅ Cuenta verificada" : "⚠️ No pudimos verificar tu cuenta", cuerpo: d.ok ? "Tu prueba de 48 horas con acceso completo ya está activa." : `Motivo: ${d.mot || "revisa tu carnet"}.` }),
  visita: (d) => ({ titulo: "📅 Nueva visita agendada", cuerpo: `${d.de || "Un agente"} agendó una visita a ${d.prop || "tu propiedad"} el ${d.fecha || ""} a las ${d.hora || ""}.` }),
};

export default async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  const URL_SB = process.env.VITE_SUPABASE_URL, KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const PUB = process.env.VAPID_PUBLIC_KEY, PRIV = process.env.VAPID_PRIVATE_KEY;
  if (!URL_SB || !KEY || !PUB || !PRIV) return new Response(JSON.stringify({ ok: false, error: "Faltan variables de entorno en Netlify" }), { status: 500 });
  const auth = req.headers.get("authorization") || "";
  let body = {};
  try { body = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
  const armar = MENSAJES[body.evento];
  if (!armar) return new Response("Evento desconocido", { status: 400 });

  // ¿A quién se envía? Lo decide la base de datos (con los permisos del usuario que llama)
  const r = await fetch(`${URL_SB}/rest/v1/rpc/push_destinos`, {
    method: "POST", headers: { apikey: KEY, Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ p_evento: body.evento, p_para: (body.datos && body.datos.para) || null }),
  });
  if (!r.ok) return new Response(JSON.stringify({ ok: false, error: await r.text() }), { status: 403 });
  const destinos = await r.json();

  webpush.setVapidDetails("mailto:soporte@vortex.app", PUB, PRIV);
  const msg = { ...armar(body.datos || {}), url: "/" };
  let enviados = 0;
  await Promise.all((destinos || []).map(async (fila) => {
    const sub = fila.datos || fila.push_destinos || fila;
    try { await webpush.sendNotification(sub, JSON.stringify(msg), { TTL: 86400 }); enviados++; } catch (e) { console.warn("push", e.statusCode); }
  }));
  return new Response(JSON.stringify({ ok: true, enviados }), { headers: { "Content-Type": "application/json" } });
};
