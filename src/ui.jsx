// Piezas visuales compartidas por las pantallas nuevas (login, cuentas)
import { C } from "./Vortex";

export const inp = { border: `1px solid ${C.line}`, background: "#fff", color: C.ink, outline: "none" };
export const Campo = ({ l, children }) => (
  <label className="block space-y-1.5"><span className="text-xs font-medium" style={{ color: C.mute }}>{l}</span>{children}</label>
);
export const Boton = ({ children, tono = "grad", ...r }) => (
  <button {...r} className={`w-full py-3 rounded-xl font-semibold text-sm ${r.className || ""}`}
    style={{ background: tono === "grad" ? C.grad : tono === "rojo" ? C.redSoft : C.lilaSoft, color: tono === "grad" ? "#fff" : tono === "rojo" ? C.red : C.lilaDk, opacity: r.disabled ? 0.6 : 1, ...(r.style || {}) }}>
    {children}
  </button>
);
export const Error = ({ t }) => (t ? <div className="text-xs rounded-lg px-3 py-2" style={{ background: C.redSoft, color: C.red }}>{t}</div> : null);
