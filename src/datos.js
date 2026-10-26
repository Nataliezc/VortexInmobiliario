// ─────────────────────────────────────────────────────────────
//  Conexión entre la app y la base de datos (Supabase).
//  Cada lista de la app (propiedades, clientes, visitas...) se
//  guarda automáticamente en su tabla cuando cambia.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

const DIA = 864e5;

// orden: "desc" = lo más nuevo primero; "asc" = lo más antiguo primero
export const TABLAS = {
  propiedades: { orden: "desc" },
  operaciones: { orden: "desc" },
  resenas: { orden: "desc" },
  reportes: { orden: "desc" },
  sugerencias: { orden: "desc" },
  pagos: { orden: "desc" },
  visitas: { orden: "asc" },
  auditoria: { orden: "desc" },
  clientes: { privada: true, orden: "asc" },
  favoritos: { privada: true, orden: "asc", clave: (f) => `${f.pid}-${f.cid}` },
  notificaciones: { privada: true, orden: "desc" },
  busquedas: { privada: true, orden: "asc" },
};

const claveDe = (t, x) => (t === "perfiles" ? x._uid : TABLAS[t] && TABLAS[t].clave ? TABLAS[t].clave(x) : String(x.id));

const haceCuanto = (t) => {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return "Ahora";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
};

// Lo que llega de la base de datos → como lo usa la app
function desde(t, datos, fila) {
  if (t === "perfiles") return { ...(fila.datos || {}), n: fila.nombre, _uid: fila.id, _email: fila.email, _rol: fila.rol };
  if (t === "propiedades" && datos._conf) return { ...datos, dias: Math.max(0, Math.floor((Date.now() - datos._conf) / DIA)) };
  if (t === "notificaciones" && datos._t) return { ...datos, h: haceCuanto(datos._t) };
  return datos;
}

// Lo que tiene la app → como se guarda en la base de datos
function hacia(t, x, prev) {
  if (t === "perfiles") { const { n, _uid, _email, _rol, ...resto } = x; return resto; }
  if (t === "propiedades") {
    const conf = x._conf == null || !prev || prev.dias !== x.dias ? Date.now() - (x.dias || 0) * DIA : x._conf;
    return { ...x, _conf: conf };
  }
  if (t === "notificaciones") return { ...x, _t: x._t || (prev && prev._t) || Date.now() };
  return x;
}

const mapa = (t, lista) => {
  const m = new Map();
  (lista || []).forEach((x) => { if (x) m.set(claveDe(t, x), { obj: x, json: JSON.stringify(t === "perfiles" ? hacia(t, x) : x) }); });
  return m;
};

// ── avisos y estado global ──
const pendientes = {};
export const hayPendientes = () => Object.values(pendientes).some(Boolean);
export const aviso = (msg) => window.dispatchEvent(new CustomEvent("vortex-aviso", { detail: msg }));
const errTxt = (e) => (e && (e.message || e.error_description)) || String(e);

// ── carga inicial de todo ──
export async function cargarTodo() {
  const out = {};
  await Promise.all(Object.entries(TABLAS).map(async ([t, cfg]) => {
    const { data, error } = await supabase.from(t).select("id, datos").order("creado_en", { ascending: cfg.orden === "asc" }).limit(5000);
    if (error) throw new Error(`No se pudo leer "${t}": ${error.message}`);
    out[t] = data.map((r) => desde(t, r.datos || {}, r));
  }));
  const pf = await supabase.from("perfiles").select("id, nombre, email, rol, datos").order("creado_en", { ascending: true });
  if (pf.error) throw new Error(`No se pudo leer "perfiles": ${pf.error.message}`);
  out.perfiles = pf.data.map((r) => desde("perfiles", null, r));
  const cfg = await supabase.from("ajustes").select("valor").eq("clave", "cfg").maybeSingle();
  if (cfg.error) throw new Error(`No se pudo leer "ajustes": ${cfg.error.message}`);
  out.cfg = cfg.data ? cfg.data.valor : null;
  const au = await supabase.from("ajustes_usuario").select("valor").eq("clave", "autos").maybeSingle();
  out.autos = au.data ? au.data.valor : null;
  return out;
}

// ── escribir cambios de una lista ──
async function escribir(t, cambios, borrar, ses) {
  const admin = ses.rol === "admin";
  if (t === "perfiles") {
    for (const c of cambios) {
      if (!admin && c.obj._uid !== ses.uid) continue; // cada agente solo modifica su propio perfil
      const { error } = await supabase.from("perfiles").update({ datos: hacia(t, c.obj) }).eq("id", c.obj._uid);
      if (error) throw error;
    }
    return;
  }
  let lista = cambios, quitar = borrar;
  if (t === "propiedades" && !admin) {
    // De propiedades ajenas solo se guardan los contadores (vistas / guardados)
    const ajena = (o) => !o.cap || o.cap.n !== ses.nombre;
    for (const c of cambios.filter((c) => c.prev && ajena(c.obj))) {
      for (const campo of ["vistas", "guardados"]) {
        const d = (c.obj[campo] || 0) - (c.prev[campo] || 0);
        if (d > 0) await supabase.rpc("sumar_contador", { p_id: c.k, p_campo: campo, p_n: d });
      }
    }
    lista = cambios.filter((c) => !(c.prev && ajena(c.obj)));
    quitar = borrar.filter((b) => !ajena(b.obj));
  }
  const priv = TABLAS[t].privada;
  if (lista.length) {
    const ahora = new Date().toISOString();
    const filas = lista.map((c) => ({ ...(priv ? { creado_por: ses.uid } : {}), id: c.k, datos: hacia(t, c.obj, c.prev), actualizado_en: ahora }));
    const { error } = await supabase.from(t).upsert(filas, { onConflict: priv ? "creado_por,id" : "id" });
    if (error) throw error;
  }
  if (quitar.length) {
    let q = supabase.from(t).delete().in("id", quitar.map((b) => b.k));
    if (priv) q = q.eq("creado_por", ses.uid);
    const { error } = await q;
    if (error) throw error;
  }
}

// ── Hook: una lista sincronizada con su tabla ──
export function useSync(t, inicial, ses) {
  const [val, setVal] = useState(inicial || []);
  const base = useRef(mapa(t, inicial));
  const valRef = useRef(val);
  const timer = useRef(null);
  const ocupado = useRef(false);
  valRef.current = val;

  const guardar = async () => {
    if (ocupado.current) { timer.current = setTimeout(() => { timer.current = null; guardar(); }, 300); return; }
    ocupado.current = true;
    const nuevo = mapa(t, valRef.current);
    try {
      const cambios = [], borrar = [];
      for (const [k, v] of nuevo) { const b = base.current.get(k); if (!b || b.json !== v.json) cambios.push({ k, obj: v.obj, prev: b && b.obj }); }
      for (const [k, b] of base.current) if (!nuevo.has(k)) borrar.push({ k, obj: b.obj });
      if (cambios.length || borrar.length) await escribir(t, cambios, borrar, ses);
    } catch (e) {
      console.error(t, e);
      aviso(`No se pudo guardar (${t}): ${errTxt(e)}`);
    } finally {
      base.current = nuevo;
      ocupado.current = false;
      pendientes[t] = !!timer.current;
    }
  };

  useEffect(() => {
    clearTimeout(timer.current);
    pendientes[t] = true;
    timer.current = setTimeout(() => { timer.current = null; guardar(); }, 500);
  }, [val]);

  useEffect(() => {
    const h = (e) => {
      const nuevos = e.detail && e.detail[t];
      if (!nuevos || pendientes[t] || ocupado.current) return;
      base.current = mapa(t, nuevos);
      setVal(nuevos);
    };
    window.addEventListener("vortex-recarga", h);
    return () => window.removeEventListener("vortex-recarga", h);
  }, []);

  return [val, setVal];
}

// ── Hook: un objeto de ajustes sincronizado (cfg global o ajustes del usuario) ──
export function useSyncObj(t, clave, inicial, ses) {
  const [val, setVal] = useState(inicial);
  const base = useRef(JSON.stringify(inicial));
  const timer = useRef(null);
  const id = `${t}:${clave}`;
  useEffect(() => {
    const json = JSON.stringify(val);
    if (json === base.current) return;
    pendientes[id] = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        if (t === "ajustes") {
          if (ses.rol !== "admin") return;
          const { error } = await supabase.from("ajustes").upsert({ clave, valor: val, actualizado_en: new Date().toISOString() }, { onConflict: "clave" });
          if (error) throw error;
        } else {
          const { error } = await supabase.from("ajustes_usuario").upsert({ usuario: ses.uid, clave, valor: val }, { onConflict: "usuario,clave" });
          if (error) throw error;
        }
      } catch (e) {
        aviso(`No se pudo guardar la configuración: ${errTxt(e)}`);
      } finally {
        base.current = json;
        pendientes[id] = false;
      }
    }, 500);
  }, [val]);
  useEffect(() => {
    const h = (e) => {
      const k = t === "ajustes" ? "cfg" : clave;
      const nuevo = e.detail && e.detail[k];
      if (!nuevo || pendientes[id]) return;
      const merged = { ...val, ...nuevo };
      base.current = JSON.stringify(merged);
      setVal(merged);
    };
    window.addEventListener("vortex-recarga", h);
    return () => window.removeEventListener("vortex-recarga", h);
  });
  return [val, setVal];
}
