// Aviso para instalar Vortex como app, visible en cualquier pantalla (visitante o con sesión).
import { useEffect, useState } from "react";
import { C, LOGO_ISO } from "./Vortex";
import { puedeInstalar, onCambioInstalar, instalarApp, esIOSInstalar, instaladaYa } from "./instalar";

export default function InstalarBanner() {
  const [visible, setVisible] = useState(puedeInstalar());
  const [ios, setIos] = useState(false);
  const [cerrado, setCerrado] = useState(() => { try { return sessionStorage.getItem("vx-sin-instalar") === "1"; } catch { return false; } });

  useEffect(() => {
    if (instaladaYa()) return;
    if (esIOSInstalar()) { setIos(true); return; }
    return onCambioInstalar(setVisible);
  }, []);

  const cerrar = () => { setCerrado(true); try { sessionStorage.setItem("vx-sin-instalar", "1"); } catch {} };
  if (cerrado || instaladaYa() || (!visible && !ios)) return null;

  return (
    <div className="fixed left-0 right-0 z-50 flex justify-center px-3" style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="w-full flex items-center gap-3 rounded-2xl p-3 shadow-lg" style={{ maxWidth: 480, background: C.card, border: `1px solid ${C.line}` }}>
        <img src={LOGO_ISO} alt="" style={{ width: 36, height: 36 }} />
        <div className="flex-1 min-w-0 text-xs" style={{ color: C.ink }}>
          <div className="font-semibold">Instala Vortex en tu celular</div>
          {ios ? <div style={{ color: C.mute }}>Toca Compartir <b>⬆️</b> y luego <b>«Agregar a inicio»</b>.</div> : <div style={{ color: C.mute }}>Ábrela como una app, con acceso directo y notificaciones.</div>}
        </div>
        {!ios && <button onClick={async () => { const r = await instalarApp(); if (r !== "no-disponible") cerrar(); }} className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: C.grad }}>Instalar</button>}
        <button onClick={cerrar} aria-label="Cerrar" className="shrink-0 text-lg leading-none px-1" style={{ color: C.mute }}>×</button>
      </div>
    </div>
  );
}
