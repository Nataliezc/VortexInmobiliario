// "Agregar a la pantalla de inicio" en Android/Chrome/Edge.
// Chrome decide solo, con reglas internas, cuándo puede ofrecer el banner automático
// (visitas repetidas, tiempo en el sitio, etc.), así que muchas personas nunca lo ven
// aunque el sitio cumpla los requisitos técnicos. Por eso guardamos el evento y mostramos
// nuestro propio botón "Instalar app", que funciona siempre que Chrome lo permita.
let evento = null;
let avisar = () => {};
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); evento = e; avisar(true); });
window.addEventListener("appinstalled", () => { evento = null; avisar(false); });

export const puedeInstalar = () => !!evento;
export const onCambioInstalar = (cb) => { avisar = cb; return () => { avisar = () => {}; }; };
export async function instalarApp() {
  if (!evento) return "no-disponible";
  evento.prompt();
  const { outcome } = await evento.userChoice;
  evento = null;
  return outcome; // "accepted" | "dismissed"
}
export const esIOSInstalar = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
export const instaladaYa = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
