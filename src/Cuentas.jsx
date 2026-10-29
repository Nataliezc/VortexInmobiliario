// Gestión de cuentas desde dentro de la app:
//  - El administrador crea usuarios, cambia contraseñas y elimina cuentas.
//  - Cada usuario puede cambiar su propia contraseña y cerrar sesión.
import { useState } from "react";
import { supabase } from "./supabase";
import { C, CUENTAS, RESUMEN } from "./Vortex";
import { inp, Campo, Boton, MsgError } from "./ui";
import { useEffect } from "react";
import { estadoPush, activarPush, desactivarPush, esIOS, instaladaComoApp } from "./push";
import { LOGO_ISO } from "./Vortex";

// Activar las notificaciones en este celular
function PanelPush({ esAdmin }) {
  const [est, setEst] = useState("…");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { estadoPush().then(setEst).catch(() => setEst("no")); }, []);
  const activar = async () => { setOcupado(true); setMsg(""); try { await activarPush(); setEst("activo"); setMsg("✓ Listo. Este celular recibirá las notificaciones."); } catch (e) { setMsg(e.message || String(e)); } setOcupado(false); };
  const apagar = async () => { setOcupado(true); try { await desactivarPush(); setEst("inactivo"); setMsg("Notificaciones desactivadas en este celular."); } catch (e) { setMsg(e.message || String(e)); } setOcupado(false); };
  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ background: C.brandSoft }}>
      <div className="text-sm font-semibold" style={{ color: C.brandDk }}>🔔 Notificaciones en este celular</div>
      <div className="text-xs" style={{ color: C.ink }}>{esAdmin ? "Te avisaremos al instante cuando llegue un pago o un nuevo registro por verificar." : "Te avisaremos cuando aprueben tu pago o tu cuenta, y cuando agenden una visita a tu propiedad."}</div>
      {est === "activo" ? <><div className="text-xs font-semibold" style={{ color: C.ok }}>✓ Activadas</div><button onClick={apagar} disabled={ocupado} className="text-xs underline" style={{ color: C.mute }}>Desactivar en este celular</button></>
        : est === "bloqueado" ? <div className="text-xs" style={{ color: C.red }}>Las bloqueaste en este navegador. Actívalas en los ajustes del navegador (candado junto a la dirección → Notificaciones → Permitir).</div>
        : est === "no" && esIOS() && !instaladaComoApp() ? <div className="text-xs" style={{ color: C.amber }}>En iPhone: toca Compartir ⬆️ → «Agregar a inicio», abre Vortex desde ese ícono y vuelve aquí para activarlas.</div>
        : est === "no" ? <div className="text-xs" style={{ color: C.amber }}>Este navegador no permite notificaciones. Usa Chrome en Android o instala la app en tu iPhone.</div>
        : <button onClick={activar} disabled={ocupado} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.brand }}>{ocupado ? "Activando…" : "Activar notificaciones"}</button>}
      {msg && <div className="text-xs" style={{ color: msg.startsWith("✓") ? C.ok : C.red }}>{msg}</div>}
    </div>
  );
}

// Pantalla para crear contraseña nueva (después del enlace del correo)
export function NuevaClave({ onListo }) {
  const [p1, setP1] = useState(""); const [p2, setP2] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  const guardar = async () => {
    setErr("");
    if (p1.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    if (p1 !== p2) return setErr("Las contraseñas no coinciden.");
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) return setErr(msg(error));
    setOk(true);
  };
  return (
    <div className="vx-shell"><div className="vx-frame flex flex-col justify-center p-6 space-y-4" style={{ background: C.bg }}>
      <img src={LOGO_ISO} alt="Vortex" style={{ height: 56, alignSelf: "center" }} />
      <div className="text-lg font-bold text-center" style={{ color: C.ink }}>Crea tu nueva contraseña</div>
      {ok ? <><div className="text-sm text-center" style={{ color: C.ok }}>✓ Tu contraseña se actualizó.</div><Boton onClick={onListo}>Entrar a Vortex</Boton></> : <>
        <Campo l="Nueva contraseña"><input type="password" value={p1} onChange={(e) => setP1(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
        <Campo l="Repetir contraseña"><input type="password" value={p2} onChange={(e) => setP2(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm" style={inp} /></Campo>
        <MsgError t={err} />
        <Boton onClick={guardar}>Guardar contraseña</Boton>
      </>}
    </div></div>
  );
}

const msg = (e) => (e && e.message ? e.message.replace(/^.*?ERROR:\s*/i, "") : String(e));

export function CrearUsuario({ planes, corte, onCreado, recargar }) {
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ nombre: "", email: "", pass: "", plan: "Prueba", rol: "agente" });
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);
  const s = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const crear = async () => {
    setErr("");
    if (f.nombre.trim().length < 3) return setErr("Escribe el nombre completo.");
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr("Escribe un correo válido.");
    if (f.pass.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    setCargando(true);
    const hoy = new Date().toISOString().slice(0, 10);
    const datos = f.plan === "Prueba" ? {}
      : f.plan === "Gratuito" ? { plan: "Gratuito", est: "Vencido", prueba: null }
      : { plan: f.plan, est: "Activo", venc: corte, prueba: null, insc: { plan: f.plan, f: hoy } };
    const { error } = await supabase.rpc("crear_usuario", { p_email: f.email.trim(), p_password: f.pass, p_nombre: f.nombre.trim(), p_rol: f.rol, p_datos: datos });
    setCargando(false);
    if (error) return setErr(msg(error));
    onCreado && onCreado(f.nombre.trim(), f.plan);
    setF({ nombre: "", email: "", pass: "", plan: "Prueba", rol: "agente" });
    setAbierto(false);
    recargar();
  };

  if (!abierto) return <Boton onClick={() => setAbierto(true)}>➕ Crear nuevo usuario</Boton>;
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: C.card, border: `2px solid ${C.brand}` }}>
      <div className="font-bold" style={{ color: C.ink }}>Nuevo usuario</div>
      <Campo l="Nombre completo (se muestra en la red)"><input value={f.nombre} onChange={s("nombre")} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Campo>
      <Campo l="Correo (con este inicia sesión)"><input type="email" value={f.email} onChange={s("email")} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Campo>
      <Campo l="Contraseña inicial (mínimo 6 caracteres)"><input value={f.pass} onChange={s("pass")} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo l="Tipo de cuenta"><select value={f.rol} onChange={s("rol")} className="w-full rounded-xl px-2 py-2 text-sm" style={inp}><option value="agente">Agente</option><option value="admin">Administrador</option></select></Campo>
        <Campo l="Plan"><select value={f.plan} onChange={s("plan")} className="w-full rounded-xl px-2 py-2 text-sm" style={inp}><option value="Prueba">Prueba 48 h</option><option value="Gratuito">Gratuito</option>{planes.map((p) => <option key={p}>{p}</option>)}</select></Campo>
      </div>
      <div className="text-xs" style={{ color: C.mute }}>{f.plan === "Prueba" ? "Tendrá 48 horas de acceso completo; luego pasa a Gratuito." : f.plan === "Gratuito" ? "Acceso limitado hasta que pague un plan." : `Quedará activo hasta el próximo corte (${corte}) y no se le pedirá carnet.`}</div>
      <MsgError t={err} />
      <div className="grid grid-cols-2 gap-2">
        <Boton onClick={crear} disabled={cargando}>{cargando ? "Creando…" : "Crear usuario"}</Boton>
        <Boton tono="suave" onClick={() => { setAbierto(false); setErr(""); }}>Cancelar</Boton>
      </div>
      <div className="text-xs" style={{ color: C.mute }}>Entrégale al usuario su correo y contraseña. Podrá cambiar la contraseña desde ⚙️ Mi cuenta.</div>
    </div>
  );
}

export function AccionesUsuario({ u, onHecho, recargar, sesion }) {
  const [modo, setModo] = useState(null);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  if (u._uid === sesion.uid) return null;
  const cambiar = async () => {
    if (pass.length < 6) return setErr("Mínimo 6 caracteres.");
    const { error } = await supabase.rpc("admin_cambiar_clave", { p_uid: u._uid, p_password: pass });
    if (error) return setErr(msg(error));
    setModo(null); setPass(""); setErr(""); onHecho("contraseña cambiada");
  };
  const eliminar = async () => {
    const { error } = await supabase.rpc("eliminar_usuario", { p_uid: u._uid });
    if (error) return setErr(msg(error));
    setModo(null); onHecho("cuenta eliminada"); recargar();
  };
  return (
    <div className="space-y-2">
      {!modo && <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setModo("clave")} className="py-2 rounded-lg text-xs" style={{ background: C.lilaSoft, color: C.lilaDk }}>🔑 Nueva contraseña</button>
        <button onClick={() => setModo("borrar")} className="py-2 rounded-lg text-xs" style={{ background: C.redSoft, color: C.red }}>🗑 Eliminar cuenta</button>
      </div>}
      {modo === "clave" && <div className="flex gap-2"><input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Nueva contraseña" className="flex-1 rounded-lg px-2 py-1.5 text-sm" style={inp} /><button onClick={cambiar} className="px-3 rounded-lg text-xs font-semibold text-white" style={{ background: C.lila }}>Guardar</button><button onClick={() => { setModo(null); setErr(""); }} className="px-2 text-xs" style={{ color: C.mute }}>✕</button></div>}
      {modo === "borrar" && <div className="rounded-lg p-2 space-y-2 text-xs" style={{ background: C.redSoft, color: C.red }}>¿Eliminar definitivamente la cuenta de {u.n}? Ya no podrá iniciar sesión.<div className="grid grid-cols-2 gap-2"><button onClick={eliminar} className="py-2 rounded-lg font-semibold text-white" style={{ background: C.red }}>Sí, eliminar</button><button onClick={() => setModo(null)} className="py-2 rounded-lg" style={{ background: "#fff", color: C.mute }}>Cancelar</button></div></div>}
      <MsgError t={err} />
    </div>
  );
}

export function MenuCuenta({ sesion, onClose, vista, onTerminos }) {
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const cambiar = async () => {
    setErr(""); setOk("");
    if (pass.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) return setErr(msg(error));
    setPass(""); setOk("Contraseña actualizada.");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(30,27,58,.55)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 space-y-4 overflow-y-auto" style={{ background: C.card, maxWidth: 480, maxHeight: "92vh", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div><div className="font-bold" style={{ color: C.ink }}>{sesion.nombre}</div><div className="text-xs" style={{ color: C.mute }}>{sesion.email} · {sesion.rol === "admin" ? "Administrador" : "Agente"}</div></div>
          <button onClick={onClose} className="text-xl" style={{ color: C.mute }}>✕</button>
        </div>
        {vista && <div className="rounded-2xl p-3 space-y-2" style={{ background: C.lilaSoft }}>
          <div className="text-sm font-semibold" style={{ color: C.lilaDk }}>👁 Ver la app como</div>
          <div className="grid grid-cols-3 gap-1.5">{CUENTAS.map(([k, l]) => (
            <button key={k} onClick={() => vista.setSim(k)} className="py-2 rounded-xl text-xs font-semibold" style={{ background: vista.sim === k ? C.lila : "#fff", color: vista.sim === k ? "#fff" : C.ink }}>{l}</button>))}</div>
          <div className="text-xs" style={{ color: C.ink }}>{RESUMEN[vista.sim]}</div>
          {vista.sim === "prueba" && <button onClick={vista.terminarPrueba} className="w-full py-2 rounded-xl text-xs font-semibold" style={{ background: "#fff", color: C.amber }}>⏩ Terminar la prueba (ver cómo pasa a Gratuito)</button>}
          {vista.sim !== "admin" && <div className="text-xs" style={{ color: C.amber }}>Vista previa: lo que publiques o registres se guarda con tu usuario de administrador. Para volver al panel elige SuperAdmin.</div>}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.grad }}>Ver la app</button>
        </div>}
        <PanelPush esAdmin={sesion.rol === "admin"} />
        <Campo l="Cambiar mi contraseña"><div className="flex gap-2"><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Nueva contraseña" className="flex-1 rounded-xl px-3 py-2 text-sm" style={inp} /><button onClick={cambiar} className="px-4 rounded-xl text-sm font-semibold text-white" style={{ background: C.lila }}>Guardar</button></div></Campo>
        {ok && <div className="text-xs" style={{ color: C.ok }}>✓ {ok}</div>}
        <MsgError t={err} />
        {onTerminos && <button onClick={onTerminos} className="w-full text-xs underline" style={{ color: C.mute }}>Términos y política de privacidad</button>}
        <Boton tono="rojo" onClick={() => supabase.auth.signOut()}>Cerrar sesión</Boton>
      </div>
    </div>
  );
}
