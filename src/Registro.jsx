// Registro libre de nuevos agentes: nombre, WhatsApp, correo, contraseña y carnet.
// Al terminar, la cuenta queda con 48 h de prueba y la sesión iniciada.
import { useState } from "react";
import { supabase, clienteTemporal } from "./supabase";
import { comprimir, BUCKET_PRIV } from "./archivos";
import { notificar } from "./push";
import { TerminosModal } from "./Extras";
import { C, LOGO_ISO } from "./Vortex";
import { inp, Campo, Boton, MsgError, ClaveInput } from "./ui";

const limpiarMsg = (m = "") => m.replace(/^.*?ERROR:\s*/i, "");

export default function Registro({ onLogin, onVolver, terminos }) {
  const [acepto, setAcepto] = useState(false);
  const [verTerm, setVerTerm] = useState(false);
  const [f, setF] = useState({ nombre: "", tel: "", email: "", pass: "", pass2: "" });
  const [ci, setCi] = useState({ front: null, back: null });
  const [err, setErr] = useState("");
  const [paso, setPaso] = useState("");
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const foto = (k) => (e) => { const file = e.target.files && e.target.files[0]; if (file) setCi((x) => ({ ...x, [k]: { file, url: URL.createObjectURL(file) } })); };

  const registrar = async () => {
    setErr("");
    const email = f.email.trim().toLowerCase();
    if (f.nombre.trim().split(/\s+/).length < 2) return setErr("Escribe tu nombre y apellido.");
    if (f.tel.replace(/\D/g, "").length < 8) return setErr("Escribe tu número de WhatsApp.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Escribe un correo válido.");
    if (f.pass.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    if (f.pass !== f.pass2) return setErr("Las contraseñas no coinciden.");
    if (!ci.front || !ci.back) return setErr("Sube la foto de tu carnet por ambos lados.");
    if (!acepto) return setErr("Debes aceptar los términos y la política de privacidad.");
    let creada = false;
    try {
      setPaso("Creando tu cuenta…");
      const { error: e1 } = await supabase.rpc("registrarse", { p_email: email, p_password: f.pass, p_nombre: f.nombre.trim(), p_tel: f.tel.trim(), p_terminos: true });
      if (e1) throw new Error(/registrarse/.test(e1.message) && /function/i.test(e1.message) ? "Falta ejecutar el archivo 5_acceso_libre.sql en Supabase." : limpiarMsg(e1.message));
      creada = true;
      setPaso("Subiendo tu carnet…");
      const tmp = clienteTemporal();
      const { data: ses, error: e2 } = await tmp.auth.signInWithPassword({ email, password: f.pass });
      if (e2) throw e2;
      const uid = ses.user.id, urls = {};
      for (const k of ["front", "back"]) {
        const blob = await comprimir(ci[k].file);
        const ruta = `${uid}/carnet-${k}-${Date.now()}.jpg`;
        const { error } = await tmp.storage.from(BUCKET_PRIV).upload(ruta, blob, { contentType: blob.type || "image/jpeg" });
        if (error) throw error;
        urls[k] = `priv:${ruta}`; // carpeta privada: solo la ve el administrador
      }
      const { error: e3 } = await tmp.rpc("guardar_carnet", { p_front: urls.front, p_back: urls.back });
      if (e3) throw e3;
      await tmp.auth.signOut();
      setPaso("Entrando…");
      const { error: e4 } = await supabase.auth.signInWithPassword({ email, password: f.pass });
      if (e4) throw e4;
      notificar("registro", { nombre: f.nombre.trim() });
    } catch (e) {
      setErr(creada ? "Tu cuenta se creó, pero no se pudo subir el carnet. Inicia sesión: te lo pediremos al elegir un plan." : limpiarMsg(e.message || String(e)));
      setPaso("");
    }
  };

  return (
    <div className="vx-shell">
      <div className="vx-frame relative flex flex-col overflow-y-auto" style={{ background: C.bg }}>
        <div style={{ height: 4, background: C.grad }} />
        <div className="px-5 py-5 space-y-4" style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
          <button onClick={onVolver} className="text-sm" style={{ color: C.brandDk }}>‹ Volver</button>
          <div className="flex items-center gap-3"><img src={LOGO_ISO} alt="Vortex" style={{ height: 44 }} /><div><div className="text-lg font-bold" style={{ color: C.ink }}>Crea tu cuenta de agente</div><div className="text-xs" style={{ color: C.mute }}>Gratis · incluye 48 h de prueba al verificar tu carnet</div></div></div>
          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <Campo l="Nombre y apellido (así te verán los demás agentes)"><input value={f.nombre} onChange={s("nombre")} autoComplete="name" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
            <Campo l="WhatsApp"><input value={f.tel} onChange={s("tel")} inputMode="tel" placeholder="Ej. 70012345" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
            <Campo l="Correo electrónico"><input type="email" value={f.email} onChange={s("email")} autoComplete="email" className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo l="Contraseña"><ClaveInput value={f.pass} onChange={s("pass")} autoComplete="new-password" /></Campo>
              <Campo l="Repetir contraseña"><ClaveInput value={f.pass2} onChange={s("pass2")} autoComplete="new-password" /></Campo>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium" style={{ color: C.mute }}>🪪 Foto de tu carnet de identidad (solo la ve el administrador)</div>
              <div className="grid grid-cols-2 gap-2">{[["front", "Anverso"], ["back", "Reverso"]].map(([k, l]) => (
                <label key={k} className="flex items-center justify-center rounded-xl text-xs text-center cursor-pointer overflow-hidden" style={{ height: 100, border: `1px dashed ${C.mute}`, color: C.mute }}>
                  {ci[k] ? <img src={ci[k].url} alt={l} className="w-full h-full object-cover" /> : `📷 ${l}`}
                  <input type="file" accept="image/*" className="hidden" onChange={foto(k)} />
                </label>))}</div>
            </div>
            <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: C.ink }}><input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5" /><span>Acepto los <button type="button" onClick={() => setVerTerm(true)} className="underline font-semibold" style={{ color: C.lilaDk }}>términos de uso y la política de privacidad</button> de Vortex.</span></label>
            <div className="text-xs rounded-lg p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>Revisaremos tu carnet y, cuando lo aprobemos, se activarán tus 48 h de prueba con acceso completo.</div>
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
