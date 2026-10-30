import { useState } from "react";
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
export function ClaveInput({ value, onChange, placeholder, autoComplete, className = "w-full rounded-xl px-3 py-2.5 text-sm" }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input type={ver ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} className={className} style={{ ...inp, paddingRight: 44 }} />
      <button type="button" onClick={() => setVer(!ver)} title={ver ? "Ocultar contraseña" : "Ver contraseña"} aria-label={ver ? "Ocultar contraseña" : "Ver contraseña"} className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-lg" style={{ color: C.mute, background: "transparent" }}>{ver ? "🙈" : "👁"}</button>
    </div>
  );
}
export const MsgError = ({ t }) => (t ? <div className="text-xs rounded-lg px-3 py-2" style={{ background: C.redSoft, color: C.red }}>{t}</div> : null);
