// Notificaciones en el celular (Web Push).
// La clave pública es segura de compartir; la privada va SOLO en Netlify (VAPID_PRIVATE_KEY).
import { supabase } from "./supabase";

export const VAPID_PUBLIC = "BEnYB_ULEndYyFi2OosHg01cl0KDnmtiKTuSuwzSiodyS5gYEJPlvozGjehUFvA63ByAO8smU4n-XI8hWwd5NmM";

const aBytes = (b64) => { const p = "=".repeat((4 - (b64.length % 4)) % 4); const raw = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))); };

export const pushSoportado = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export const instaladaComoApp = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export async function estadoPush() {
  if (!pushSoportado()) return "no";
  if (Notification.permission === "denied") return "bloqueado";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub && Notification.permission === "granted" ? "activo" : "inactivo";
}

export async function activarPush() {
  if (!pushSoportado()) throw new Error(esIOS() ? "En iPhone primero agrega Vortex a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrelo desde ahí." : "Este navegador no permite notificaciones.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("No diste permiso para las notificaciones. Puedes activarlo en los ajustes del navegador.");
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(VAPID_PUBLIC) }));
  const j = sub.toJSON();
  const { error } = await supabase.from("push_suscripciones").upsert({ endpoint: j.endpoint, datos: j }, { onConflict: "usuario,endpoint" });
  if (error) throw error;
  return true;
}

export async function desactivarPush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) { await supabase.from("push_suscripciones").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
}

// Pide al servidor (función de Netlify) que avise por notificación.
// evento: "pago" | "registro" | "pago_revisado" | "verificado" | "visita"
export async function notificar(evento, datos = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch("/.netlify/functions/notificar", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ evento, datos }) });
  } catch (e) { console.warn("notificar", e); }
}
