import { useState } from "react";
import { supabase } from "./supabase";
import { C, LOGO_ISO, LOGO_WM } from "./Vortex";
import { inp, Campo, Boton, Error } from "./ui";

const traducir = (m = "") =>
  /invalid login credentials/i.test(m) ? "Correo o contraseña incorrectos."
  : /email not confirmed/i.test(m) ? "Este correo aún no está confirmado. En Supabase, al crear el usuario marca «Auto Confirm User»."
  : /database error|querying schema|converting null/i.test(m) ? "Esta cuenta tiene datos incompletos en Supabase. Ejecuta el archivo 6_reparar_cuentas.sql y vuelve a intentar."
  : /fetch|network/i.test(m) ? "No hay conexión con el servidor. Revisa tu internet o los datos de config.js."
  : m;

export default function Login({ onRegistro, onVolver }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  const [olvido, setOlvido] = useState(false);

  const entrar = async (e) => {
    e && e.preventDefault();
    setErr(""); setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pass });
    setCargando(false);
    if (error) setErr(traducir(error.message));
  };

  return (
    <div className="vx-shell">
      <div className="vx-frame relative flex flex-col overflow-y-auto" style={{ background: C.bg }}>
        <div style={{ height: 4, background: C.grad }} />
        <div className="flex-1 flex flex-col justify-center px-6 py-10 space-y-6" style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
          {onVolver && <button onClick={onVolver} className="text-sm self-start" style={{ color: C.brandDk }}>‹ Seguir como visitante</button>}
          <div className="flex flex-col items-center gap-3">
            <img src={LOGO_ISO} alt="Vortex" style={{ height: 72 }} />
            <img src={LOGO_WM} alt="Vortex" style={{ height: 26 }} />
            <div style={{ fontSize: 10, letterSpacing: ".14em", color: C.mute }}>RED DE AGENTES INMOBILIARIOS</div>
          </div>
          <form onSubmit={entrar} className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="text-lg font-bold" style={{ color: C.ink }}>Iniciar sesión</div>
            <Campo l="Correo electrónico"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} required /></Campo>
            <Campo l="Contraseña"><input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} required /></Campo>
            <Error t={err} />
            <Boton type="submit" disabled={cargando}>{cargando ? "Entrando…" : "Entrar"}</Boton>
            <button type="button" onClick={() => setOlvido(!olvido)} className="w-full text-xs underline" style={{ color: C.mute }}>¿Olvidaste tu contraseña?</button>
            {onRegistro && <button type="button" onClick={onRegistro} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.lilaSoft, color: C.lilaDk }}>¿No tienes cuenta? Regístrate gratis</button>}
            {olvido && <div className="text-xs rounded-lg p-3" style={{ background: C.lilaSoft, color: C.lilaDk }}>Pide al administrador de Vortex que te asigne una nueva contraseña desde el panel de Usuarios.</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
