// Subida de imágenes (fotos de propiedades, comprobantes, carnet, QR...)
// al bucket "vortex" de Supabase Storage. Las fotos se reducen antes de
// subir para que carguen rápido y ocupen poco espacio.
import { supabase, BUCKET } from "./supabase";
import { aviso } from "./datos";

let subiendo = 0;
const marcar = (d) => { subiendo += d; window.dispatchEvent(new CustomEvent("vortex-subiendo", { detail: subiendo })); };

export async function comprimir(file, max = 1600) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = URL.createObjectURL(file); });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(img.src);
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/jpeg", 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch { return file; }
}

export async function subir(file) {
  if (!file) return null;
  marcar(1);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session ? session.user.id : "anon";
    const blob = await comprimir(file);
    const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "bin").toLowerCase();
    const ruta = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: blob.type || file.type, upsert: false });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  } catch (e) {
    aviso(`No se pudo subir la imagen: ${(e && e.message) || e}. Revisa que exista el bucket "${BUCKET}".`);
    return null;
  } finally { marcar(-1); }
}

export async function subirVarios(files) {
  const urls = [];
  for (const f of Array.from(files || [])) { const u = await subir(f); if (u) urls.push(u); }
  return urls;
}

// Elimina del almacenamiento las fotos indicadas (por ejemplo, al cerrar una captación)
export async function borrarFotos(urls) {
  const marca = `/object/public/${BUCKET}/`;
  const rutas = (urls || []).map((u) => { const i = String(u).indexOf(marca); return i >= 0 ? decodeURIComponent(String(u).slice(i + marca.length).split("?")[0]) : null; }).filter(Boolean);
  if (!rutas.length) return true;
  try { const { error } = await supabase.storage.from(BUCKET).remove(rutas); if (error) throw error; return true; }
  catch (e) { console.warn("No se pudieron borrar fotos", e); return false; }
}

// ── Carnets: carpeta PRIVADA "carnets". Se guarda una referencia "priv:<ruta>" ──
export const BUCKET_PRIV = "carnets";
export async function subirPrivado(file, cliente = supabase) {
  if (!file) return null;
  marcar(1);
  try {
    const { data: { session } } = await cliente.auth.getSession();
    if (!session) throw new Error("Debes iniciar sesión");
    const blob = await comprimir(file);
    const ruta = `${session.user.id}/carnet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await cliente.storage.from(BUCKET_PRIV).upload(ruta, blob, { contentType: blob.type || "image/jpeg" });
    if (error) throw error;
    return `priv:${ruta}`;
  } catch (e) {
    aviso(`No se pudo subir el carnet: ${(e && e.message) || e}. Revisa que exista la carpeta privada "${BUCKET_PRIV}".`);
    return null;
  } finally { marcar(-1); }
}
const cacheFirmas = {};
export async function urlSegura(ref) {
  if (!ref || !String(ref).startsWith("priv:")) return ref;
  const ruta = String(ref).slice(5), c = cacheFirmas[ruta];
  if (c && c.hasta > Date.now()) return c.url;
  const { data, error } = await supabase.storage.from(BUCKET_PRIV).createSignedUrl(ruta, 3600);
  if (error) return null;
  cacheFirmas[ruta] = { url: data.signedUrl, hasta: Date.now() + 50 * 6e4 };
  return data.signedUrl;
}
