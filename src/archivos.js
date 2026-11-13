// Subida de imágenes (fotos de propiedades, comprobantes, carnet, QR...)
// al bucket "vortex" de Supabase Storage. Las fotos se reducen antes de
// subir para que carguen rápido y ocupen poco espacio.
import { supabase, BUCKET } from "./supabase";
import { aviso } from "./datos";

let subiendo = 0;
const marcar = (d) => { subiendo += d; window.dispatchEvent(new CustomEvent("vortex-subiendo", { detail: subiendo })); };

// Fotos de iPhone en formato HEIC/HEIF: la mayoría de navegadores (Android, Windows)
// no pueden mostrarlas. Las convertimos a JPEG antes de comprimir y subir.
const esHeic = (file) => /heic|heif/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "");
async function esperarHeic2any(ms = 4000) {
  const fin = Date.now() + ms;
  while (!window.heic2any && Date.now() < fin) await new Promise((r) => setTimeout(r, 100));
  return window.heic2any || null;
}
async function aJpegSiHaceFalta(file) {
  if (!esHeic(file)) return file;
  const conv = await esperarHeic2any();
  if (!conv) throw new Error("No se pudo preparar el conversor de fotos HEIC. Revisa tu conexión a internet e inténtalo de nuevo.");
  try {
    const r = await conv({ blob: file, toType: "image/jpeg", quality: 0.85 });
    const out = Array.isArray(r) ? r[0] : r;
    return new File([out], (file.name || "foto").replace(/\.(heic|heif)$/i, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    throw new Error('Esta foto está en formato HEIC (típico de iPhone) y no se pudo convertir. En tu iPhone, ve a Ajustes → Cámara → Formatos y elige "Más compatible", o toma la foto de nuevo e inténtalo otra vez.');
  }
}

export async function comprimir(file, max = 1600) {
  const original = await aJpegSiHaceFalta(file);
  if (!original.type.startsWith("image/") || original.type === "image/gif" || original.type === "image/svg+xml") return original;
  try {
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = URL.createObjectURL(original); });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(img.src);
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/jpeg", 0.82));
    return blob && blob.size < original.size ? blob : original;
  } catch { return original; }
}

async function miniaturaBlob(file, max = 420) {
  try {
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = URL.createObjectURL(file); });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(img.src);
    return await new Promise((ok) => cv.toBlob(ok, "image/jpeg", 0.75));
  } catch { return null; }
}
const textoError = (e) => {
  const m = (e && (e.message || e.error)) || String(e);
  if (/bucket not found/i.test(m)) return `No existe la carpeta de fotos "${BUCKET}" en Supabase (o no es pública). Ejecuta el archivo 14_reparar_carpeta_fotos.sql.`;
  if (/row-level security|unauthorized|not allowed|403/i.test(m)) return "Supabase no dio permiso para subir la foto. Ejecuta el archivo 14_reparar_carpeta_fotos.sql.";
  if (/payload too large|413|size/i.test(m)) return "La imagen es demasiado grande.";
  return m;
};

// Igual que subir(), pero además devuelve el motivo exacto si falla (para mostrarlo junto al botón).
export async function subirConError(file) {
  if (!file) return { url: null, error: null };
  marcar(1);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session ? session.user.id : "anon";
    const blob = await comprimir(file);
    const esImg = blob.type === "image/jpeg" || file.type.startsWith("image/");
    const nombre = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const ruta = esImg && blob.type === "image/jpeg" ? `${nombre}-m.jpg` : `${nombre}.${(file.name.split(".").pop() || "bin").toLowerCase()}`;
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: blob.type || file.type, upsert: false });
    if (error) throw error;
    if (ruta.endsWith("-m.jpg")) { const t = await miniaturaBlob(blob); if (t) await supabase.storage.from(BUCKET).upload(`${nombre}-t.jpg`, t, { contentType: "image/jpeg", upsert: false }); }
    return { url: supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl, error: null };
  } catch (e) {
    const msg = textoError(e);
    aviso(`No se pudo subir la imagen: ${msg}`);
    return { url: null, error: msg };
  } finally { marcar(-1); }
}

export async function subir(file) {
  const { url } = await subirConError(file);
  return url;
}

export async function subirVarios(files) {
  const urls = [];
  for (const f of Array.from(files || [])) { const u = await subir(f); if (u) urls.push(u); }
  return urls;
}

// Elimina del almacenamiento las fotos indicadas (por ejemplo, al cerrar una captación)
export async function borrarFotos(urls) {
  const marca = `/object/public/${BUCKET}/`;
  const rutas = (urls || []).map((u) => { const i = String(u).indexOf(marca); return i >= 0 ? decodeURIComponent(String(u).slice(i + marca.length).split("?")[0]) : null; }).filter(Boolean)
    .flatMap((r) => (/-m\.jpg$/.test(r) ? [r, r.replace(/-m\.jpg$/, "-t.jpg")] : [r]));
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
    aviso(`No se pudo subir el carnet: ${/bucket not found/i.test((e && e.message) || "") ? `no existe la carpeta privada "${BUCKET_PRIV}". Ejecuta el archivo 14_reparar_carpeta_fotos.sql.` : textoError(e)}`);
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

// Vacía por completo una carpeta del almacenamiento (solo administradores)
export async function vaciarCarpeta(bucket) {
  let borrados = 0;
  const quitar = async (rutas) => { for (let i = 0; i < rutas.length; i += 100) { const { error } = await supabase.storage.from(bucket).remove(rutas.slice(i, i + 100)); if (!error) borrados += Math.min(100, rutas.length - i); } };
  const listar = async (dir) => { const { data } = await supabase.storage.from(bucket).list(dir, { limit: 1000 }); return data || []; };
  const raiz = await listar("");
  await quitar(raiz.filter((x) => x.id).map((x) => x.name));
  for (const carpeta of raiz.filter((x) => !x.id)) {
    const archivos = await listar(carpeta.name);
    await quitar(archivos.filter((x) => x.id).map((x) => `${carpeta.name}/${x.name}`));
  }
  return borrados;
}
