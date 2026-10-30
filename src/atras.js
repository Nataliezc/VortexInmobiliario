// Botón "atrás" del celular: en vez de salir de la app, cierra lo último que se abrió.
// Cada pantalla o ventana abierta se registra con useAtras(activo, cerrar).
import { useEffect, useRef } from "react";

export const PILA_ATRAS = [];
const avisar = () => window.dispatchEvent(new Event("vx-pila"));

export function useAtras(activo, cerrar) {
  const ref = useRef(cerrar);
  ref.current = cerrar;
  useEffect(() => {
    if (!activo) return;
    const h = () => ref.current();
    PILA_ATRAS.push(h); avisar();
    return () => { const i = PILA_ATRAS.lastIndexOf(h); if (i >= 0) PILA_ATRAS.splice(i, 1); avisar(); };
  }, [activo]);
}

// Se usa una sola vez (en App): mantiene una entrada en el historial mientras haya algo abierto.
export function useTrampaAtras() {
  useEffect(() => {
    let trampa = false, ignorar = 0;
    const sync = () => {
      if (PILA_ATRAS.length && !trampa) { history.pushState({ vx: 1 }, ""); trampa = true; }
      else if (!PILA_ATRAS.length && trampa) { trampa = false; ignorar++; history.back(); }
    };
    const pop = () => {
      if (ignorar) { ignorar--; return; }
      trampa = false;
      const h = PILA_ATRAS[PILA_ATRAS.length - 1];
      if (h) h();
      setTimeout(sync, 0);
    };
    window.addEventListener("vx-pila", sync);
    window.addEventListener("popstate", pop);
    return () => { window.removeEventListener("vx-pila", sync); window.removeEventListener("popstate", pop); };
  }, []);
}
