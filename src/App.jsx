// Pantalla principal: verifica la conexión, el inicio de sesión,
// carga los datos desde Supabase y muestra la app Vortex.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, configurado } from "./supabase";
import { cargarTodo, cargarPublico, hayPendientes } from "./datos";
import Vortex, { fijarUsuario, C, LOGO_ISO } from "./Vortex";
import Login from "./Login";
import Registro from "./Registro";
import { CrearUsuario, AccionesUsuario, MenuCuenta, NuevaClave } from "./Cuentas";
import { TerminosModal } from "./Extras";

const Centro = ({ children }) => (
  <div className="vx-shell"><div className="vx-frame flex flex-col items-center justify-center text-center p-6 space-y-4" style={{ background: C.bg }}>
    <img src={LOGO_ISO} alt="Vortex" style={{ height: 56 }} />{children}
  </div></div>
);

function SinConfigurar() {
  return (
    <Centro>
      <div className="text-lg font-bold" style={{ color: C.ink }}>Falta conectar la base de datos</div>
      <div className="text-sm text-left space-y-2" style={{ color: C.mute, maxWidth: 360 }}>
        <p>Abre el archivo <b>config.js</b> y pega los dos datos de tu proyecto de Supabase:</p>
        <p>1. <b>SUPABASE_URL</b> → Project URL<br />2. <b>SUPABASE_KEY</b> → clave pública (anon / publishable)</p>
        <p>Los encuentras en Supabase → <b>Project Settings → API</b>. Luego vuelve a publicar la carpeta.</p>
      </div>
    </Centro>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(undefined); // undefined = verificando
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [avisoTxt, setAvisoTxt] = useState("");
  const [subiendo, setSubiendo] = useState(0);
  const ultima = useRef(Date.now());
  const [sim, setSim] = useState("admin");       // "Ver la app como" (solo administradores)
  const [finPrueba, setFinPrueba] = useState(0);
  const [modo, setModo] = useState(null);
  const [recuperar, setRecuperar] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false); // null = visitante | "login" | "registro"
  const [publico, setPublico] = useState(null);
  const [errPub, setErrPub] = useState("");

  // Sesión
  useEffect(() => {
    if (!configurado) return;
    supabase.auth.getSession().then(({ data }) => setSesion(data.session || null));
    if (/type=recovery/.test(window.location.hash)) setRecuperar(true);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (_e === "PASSWORD_RECOVERY") setRecuperar(true);
      setSesion((prev) => (prev && s && prev.user.id === s.user.id ? prev : s || null));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Perfil + datos al iniciar sesión
  useEffect(() => {
    setMenu(false); setSim("admin");
    if (!sesion) { setPerfil(null); setDatos(null); setError(""); return; }
    let vivo = true;
    (async () => {
      try {
        const { data: p, error: e1 } = await supabase.from("perfiles").select("id, nombre, email, rol, datos").eq("id", sesion.user.id).maybeSingle();
        if (e1) throw e1;
        if (!p) throw new Error("Tu usuario existe pero no tiene perfil. Ejecuta de nuevo el archivo 1_esquema.sql en Supabase (crea los perfiles que falten).");
        const est = (p.datos || {}).est;
        if (p.rol !== "admin" && (est === "Bloqueado" || est === "Suspendido")) throw new Error(`Tu cuenta está ${est.toLowerCase()}. Comunícate con el administrador de Vortex.`);
        fijarUsuario(p.nombre);
        const d = await cargarTodo();
        if (!vivo) return;
        ultima.current = Date.now();
        setPerfil({ uid: p.id, nombre: p.nombre, email: p.email, rol: p.rol });
        setDatos(d);
      } catch (e) {
        if (vivo) setError(e.message || String(e));
      }
    })();
    return () => { vivo = false; };
  }, [sesion]);

  // Catálogo público para visitantes sin cuenta
  useEffect(() => {
    if (!configurado || sesion !== null) return;
    setModo(null);
    cargarPublico().then((d) => { fijarUsuario(""); setPublico(d); setErrPub(""); }).catch((e) => setErrPub(e.message || String(e)));
  }, [sesion]);

  // Recarga periódica (para ver lo que hacen los demás usuarios)
  const recargar = useCallback(async (intentos = 6) => {
    if (hayPendientes()) { if (intentos > 0) setTimeout(() => recargar(intentos - 1), 700); return; }
    try {
      const d = await cargarTodo();
      ultima.current = Date.now();
      window.dispatchEvent(new CustomEvent("vortex-recarga", { detail: d }));
    } catch (e) { console.warn(e); }
  }, []);
  useEffect(() => {
    if (!datos) return;
    const tick = () => { if (document.visibilityState === "visible" && Date.now() - ultima.current > 30000) recargar(0); };
    const i = setInterval(() => { if (document.visibilityState === "visible" && Date.now() - ultima.current > 90000) recargar(0); }, 15000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => { clearInterval(i); document.removeEventListener("visibilitychange", tick); window.removeEventListener("focus", tick); };
  }, [datos, recargar]);

  // Avisos de error y de subida de archivos
  useEffect(() => {
    let t;
    const a = (e) => { setAvisoTxt(e.detail); clearTimeout(t); t = setTimeout(() => setAvisoTxt(""), 7000); };
    const s = (e) => setSubiendo(e.detail);
    const salir = (e) => { if (hayPendientes()) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("vortex-aviso", a);
    window.addEventListener("vortex-subiendo", s);
    window.addEventListener("beforeunload", salir);
    return () => { window.removeEventListener("vortex-aviso", a); window.removeEventListener("vortex-subiendo", s); window.removeEventListener("beforeunload", salir); };
  }, []);

  const perfilRef = useRef(null);
  perfilRef.current = perfil;
  const cuentas = useMemo(() => ({
    Crear: (p) => <CrearUsuario {...p} recargar={recargar} />,
    Acciones: (p) => <AccionesUsuario {...p} recargar={recargar} sesion={perfilRef.current || {}} />,
  }), [recargar]);

  if (!configurado) return <SinConfigurar />;
  const textoTerminos = (datos && datos.cfg && datos.cfg.terminos) || (publico && publico.cfg && publico.cfg.terminos) || null;
  const modalTerminos = verTerminos && <TerminosModal texto={textoTerminos} onClose={() => setVerTerminos(false)} />;
  if (recuperar && sesion) return <NuevaClave onListo={() => { setRecuperar(false); window.history.replaceState(null, "", window.location.pathname); }} />;
  if (sesion === undefined) return <Centro><div className="text-sm" style={{ color: C.mute }}>Cargando…</div></Centro>;
  if (!sesion) {
    if (modo === "login") return <>{<Login onRegistro={() => setModo("registro")} onVolver={() => setModo(null)} onTerminos={() => setVerTerminos(true)} />}{modalTerminos}</>;
    if (modo === "registro") return <Registro onLogin={() => setModo("login")} onVolver={() => setModo(null)} terminos={textoTerminos} />;
    if (errPub) return (
      <Centro>
        <div className="text-base font-bold" style={{ color: C.ink }}>Bienvenido a Vortex</div>
        <div className="text-sm" style={{ color: C.mute, maxWidth: 340 }}>{errPub}</div>
        <button onClick={() => setModo("login")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.lila }}>Iniciar sesión</button>
      </Centro>
    );
    if (!publico) return <Centro><div className="text-sm" style={{ color: C.mute }}>Cargando propiedades…</div></Centro>;
    return <Vortex key="visitante" inicial={publico} sesion={{ uid: null, nombre: "", email: "", rol: "visitante" }} onIngresar={() => setModo("login")} onRegistro={() => setModo("registro")} />;
  }
  if (error) return (
    <Centro>
      <div className="text-base font-bold" style={{ color: C.red }}>No se pudo abrir Vortex</div>
      <div className="text-sm" style={{ color: C.ink, maxWidth: 360 }}>{error}</div>
      <button onClick={() => supabase.auth.signOut()} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.lila }}>Cerrar sesión</button>
    </Centro>
  );
  if (!datos || !perfil) return <Centro><div className="text-sm" style={{ color: C.mute }}>Cargando tus datos…</div></Centro>;

  return (
    <>
      <Vortex key={perfil.uid} inicial={datos} sesion={perfil} onMenu={() => setMenu(true)} cuentas={perfil.rol === "admin" ? cuentas : null} sim={sim} setSim={setSim} finPrueba={finPrueba} />
      {modalTerminos}
      {menu && <MenuCuenta onTerminos={() => { setMenu(false); setVerTerminos(true); }} sesion={perfil} onClose={() => setMenu(false)} vista={perfil.rol === "admin" ? { sim, setSim, terminarPrueba: () => { setFinPrueba(Date.now()); setMenu(false); } } : null} />}
      {(avisoTxt || subiendo > 0) && (
        <div className="fixed left-0 right-0 z-50 flex justify-center px-4" style={{ top: "calc(12px + env(safe-area-inset-top, 0px))" }}>
          <div className="text-sm px-4 py-2.5 rounded-xl shadow-lg" style={{ maxWidth: 440, background: avisoTxt ? C.red : C.ink, color: "#fff" }}>
            {avisoTxt || "Subiendo imagen…"}
          </div>
        </div>
      )}
    </>
  );
}
