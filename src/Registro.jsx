// Registro libre de nuevos agentes: nombre, WhatsApp, correo y contraseña (el carnet se pide en el primer pago).
// Al terminar, la cuenta queda con 48 h de prueba y la sesión iniciada.
import { useState } from "react";
import { supabase } from "./supabase";
import { notificar } from "./push";
import { TerminosModal } from "./Extras";
import { C, LOGO_ISO } from "./Vortex";
import { inp, Campo, Boton, MsgError, ClaveInput } from "./ui";

const limpiarMsg = (m = "") => m.replace(/^.*?ERROR:\s*/i, "");

export default function Registro({ onLogin, onVolver, terminos }) {
  const [acepto, setAcepto] = useState(false);
  const [verTerm, setVerTerm] = useState(false);
  const [f, setF] = useState({ nombre: "", tel: "", email: "", pass: "", pass2: "" });
  const [err, setErr] = useState("");
  const [paso, setPaso] = useState("");
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const registrar = async () => {
    setErr("");
    const email = f.email.trim().toLowerCase();
    if (f.nombre.trim().split(/\s+/).length < 2) return setErr("Escribe tu nombre y apellido.");
    if (f.tel.replace(/\D/g, "").length < 8) return setErr("Escribe tu número de WhatsApp.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Escribe un correo válido.");
    if (f.pass.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    if (f.pass !== f.pass2) return setErr("Las contraseñas no coinciden.");
    if (!acepto) return setErr("Debes aceptar los términos y la política de privacidad.");
    let creada = false;
    try {
      setPaso("Creando tu cuenta…");
      const { error: e1 } = await supabase.rpc("registrarse", { p_email: email, p_password: f.pass, p_nombre: f.nombre.trim(), p_tel: f.tel.trim(), p_terminos: true });
      if (e1) throw new Error(/registrarse/.test(e1.message) && /function/i.test(e1.message) ? "Falta ejecutar el archivo 5_acceso_libre.sql en Supabase." : limpiarMsg(e1.message));
      creada = true;
      setPaso("Entrando…");
      const { error: e4 } = await supabase.auth.signInWithPassword({ email, password: f.pass });
      if (e4) throw e4;
      notificar("registro", { nombre: f.nombre.trim() });
    } catch (e) {
      setErr(creada ? "Tu cuenta se creó. Inicia sesión con tu correo y contraseña." : limpiarMsg(e.message || String(e)));
      setPaso("");
    }
  };

  return (
    <div className="vx-shell">
      <div className="vx-frame relative flex flex-col overflow-y-auto" style={{ background: C.bg }}>
        <div style={{ height: 4, background: C.grad }} />
        <div className="px-5 py-5 space-y-4" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <button onClick={onVolver} className="text-sm" style={{ color: C.brandDk }}>‹ Volver</button>
          <div className="flex items-center gap-3"><img src={LOGO_ISO} alt="Vortex" style={{ height: 44 }} /><div><div className="text-lg font-bold" style={{ color: C.ink }}>Crea tu cuenta de agente</div><div className="text-xs" style={{ color: C.mute }}>Gratis · incluye 48 h de prueba con acceso completo</div></div></div>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <Campo l="Nombre y apellido (así te verán los demás agentes)"><input value={f.nombre} onChange={s("nombre")} autoComplete="name" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
            <Campo l="WhatsApp"><input value={f.tel} onChange={s("tel")} inputMode="tel" placeholder="Ej. 70012345" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
            <Campo l="Correo electrónico"><input type="email" value={f.email} onChange={s("email")} autoComplete="email" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo l="Contraseña"><ClaveInput value={f.pass} onChange={s("pass")} autoComplete="new-password" /></Campo>
              <Campo l="Repetir contraseña"><ClaveInput value={f.pass2} onChange={s("pass2")} autoComplete="new-password" /></Campo>
            </div>
            <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: C.ink }}><input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5" /><span>Acepto los <button type="button" onClick={() => setVerTerm(true)} className="underline font-semibold" style={{ color: C.lilaDk }}>términos de uso y la política de privacidad</button> de Vortex.</span></label>
            <div className="text-xs rounded-lg p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>Tu prueba de 48 h empieza apenas creas tu cuenta. Cuando elijas un plan de pago te pediremos la foto de tu carnet una sola vez.</div>
            <MsgError t={err} />
            <Boton onClick={registrar} disabled={!!paso}>{paso || "Crear mi cuenta"}</Boton>
            <button onClick={onLogin} className="w-full text-xs underline" style={{ color: C.mute }}>¿Ya tienes cuenta? Inicia sesión</button>
          </div>
        </div>
      </div>
      {verTerm && <TerminosModal texto={terminos} onClose={() => setVerTerm(false)} />}
    </div>
  );
}
