// Pantallas y piezas nuevas: términos, ciudades, verificación de registros,
// métricas y respaldos, plantillas de respuestas rápidas, imágenes privadas.
import { useEffect, useState } from "react";
import { C, Chip, Fld, inp, fechaL, isoOf, isoD, bs, waLink, waNum, HOY, serif, copiarTexto } from "./Vortex";
import { urlSegura } from "./archivos";
import { notificar } from "./push";

// ───────── Imagen privada (carnets) ─────────
export function ImgSegura({ src, alt, ...r }) {
  const [url, setUrl] = useState(src && !String(src).startsWith("priv:") ? src : null);
  useEffect(() => { let vivo = true; if (src && String(src).startsWith("priv:")) urlSegura(src).then((u) => vivo && setUrl(u)); else setUrl(src); return () => { vivo = false; }; }, [src]);
  if (!url) return <div className="flex items-center justify-center rounded-lg text-xs" style={{ ...(r.style || {}), background: C.line, color: C.mute }}>🔒</div>;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={alt} {...r} /></a>;
}

// ───────── Términos y privacidad ─────────
export const TERMINOS_BASE = `TÉRMINOS DE USO Y POLÍTICA DE PRIVACIDAD — VORTEX

1. Qué es Vortex
Vortex es una plataforma para agentes inmobiliarios independientes que permite publicar captaciones, compartir información de propiedades entre agentes, coordinar visitas y registrar cierres.

2. Registro y cuenta
Para usar las funciones de agente debes registrarte con datos reales: nombre, correo, número de WhatsApp y foto de tu carnet de identidad. Eres responsable de mantener tu contraseña en reserva y de toda la actividad realizada con tu cuenta. Vortex puede verificar tu identidad antes de activar tu cuenta y puede rechazar o suspender cuentas con datos falsos.

3. Uso correcto
Te comprometes a publicar información veraz y actualizada, a respetar los acuerdos de comisión entre agentes, a tratar con respeto a otros agentes y clientes, y a no usar la plataforma para fines ilegales o engañosos. Los reportes de mala conducta son revisados por el administrador y pueden derivar en la suspensión de la cuenta.

4. Planes y pagos
Los planes de pago se cobran por mes con un día de corte común. El acceso se habilita cuando el administrador verifica el comprobante. Si no se renueva el pago, la cuenta pasa al plan Gratuito con acceso limitado. Los precios pueden actualizarse avisando con anticipación.

5. Datos personales que recopilamos
Nombre, correo, WhatsApp, foto del carnet, información de tus captaciones, clientes, visitas, cierres y pagos.

6. Para qué usamos tus datos
Para verificar tu identidad, operar la plataforma, mostrar tus captaciones a otros agentes, procesar tus pagos, enviarte avisos y mejorar el servicio. No vendemos tus datos a terceros.

7. Quién ve tus datos
Tu nombre, WhatsApp y captaciones son visibles para otros agentes registrados. Tu carnet de identidad solo lo ve el administrador y se guarda en una carpeta privada. Tus clientes y requerimientos solo los ves tú.

8. Seguridad y conservación
Tus datos se guardan en servidores seguros con acceso restringido. Las fotos de captaciones cerradas se eliminan. Puedes pedir la eliminación de tu cuenta y tus datos escribiendo al administrador.

9. Responsabilidad
Vortex facilita el contacto entre agentes, pero no es parte de las operaciones inmobiliarias ni garantiza su resultado. Cada agente es responsable de la información que publica y de sus acuerdos.

10. Cambios
Estos términos pueden actualizarse. Si hay cambios importantes, se te pedirá aceptarlos nuevamente.

Al registrarte y usar Vortex aceptas estos términos y el tratamiento de tus datos como se describe aquí.`;

export function TerminosModal({ texto, onClose, onAceptar }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: "rgba(30,27,58,.55)" }} onClick={onAceptar ? undefined : onClose}>
      <div className="w-full rounded-t-3xl flex flex-col" style={{ background: C.card, maxWidth: 520, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${C.line}` }}><div className="font-bold" style={{ color: C.ink }}>📄 Términos y privacidad</div>{!onAceptar && <button onClick={onClose} className="text-xl" style={{ color: C.mute }}>✕</button>}</div>
        <div className="p-4 overflow-y-auto text-sm whitespace-pre-line" style={{ color: C.ink }}>{texto || TERMINOS_BASE}</div>
        <div className="p-4 space-y-2" style={{ borderTop: `1px solid ${C.line}`, paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          {onAceptar ? <button onClick={onAceptar} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>He leído y acepto</button>
            : <button onClick={onClose} className="w-full py-3 rounded-xl font-semibold" style={{ background: C.lilaSoft, color: C.lilaDk }}>Cerrar</button>}
        </div>
      </div>
    </div>
  );
}

// ───────── Ciudades y zonas (panel del administrador) ─────────

export function AdminCiudades({ ciudades, setCiudades, log }) {
  const [abierta, setAbierta] = useState(null);
  const [nuevaC, setNuevaC] = useState("");
  const [nuevaZ, setNuevaZ] = useState("");
  const [borrar, setBorrar] = useState(null);
  const cap = (s) => s.trim().replace(/\s+/g, " ").replace(/(^|\s)\S/g, (l) => l.toUpperCase());
  const addCiudad = () => { const c = cap(nuevaC); if (!c || ciudades[c]) return; setCiudades({ ...ciudades, [c]: [] }); log(`Ciudad agregada: ${c}`); setNuevaC(""); setAbierta(c); };
  const addZona = (c) => { const z = cap(nuevaZ); if (!z || ciudades[c].includes(z)) return; setCiudades({ ...ciudades, [c]: [...ciudades[c], z] }); setNuevaZ(""); };
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold" style={{ color: C.ink }}>🏙 Ciudades y zonas</div>
      <div className="text-xs" style={{ color: C.mute }}>Estas ciudades aparecen al publicar captaciones, al registrar requerimientos y en el buscador. Las zonas son sugerencias: los agentes también pueden escribir otra.</div>
      {Object.keys(ciudades).map((c) => (
        <div key={c} className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${abierta === c ? C.lila : C.line}` }}>
          <button onClick={() => setAbierta(abierta === c ? null : c)} className="w-full px-3 py-2.5 flex justify-between text-sm" style={{ color: C.ink }}><span className="font-semibold">{c}</span><span className="text-xs" style={{ color: C.mute }}>{ciudades[c].length} zonas {abierta === c ? "▲" : "▼"}</span></button>
          {abierta === c && <div className="px-3 pb-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">{ciudades[c].map((z) => <span key={z} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: C.lilaSoft, color: C.lilaDk }}>{z}<button onClick={() => setCiudades({ ...ciudades, [c]: ciudades[c].filter((x) => x !== z) })} className="font-bold" title="Quitar zona">×</button></span>)}</div>
            <div className="flex gap-2"><input value={nuevaZ} onChange={(e) => setNuevaZ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addZona(c)} placeholder="Nueva zona" className="flex-1 rounded-lg px-2 py-1.5 text-sm" style={inp} /><button onClick={() => addZona(c)} className="px-3 rounded-lg text-xs font-semibold text-white" style={{ background: C.lila }}>Agregar</button></div>
            {borrar === c ? <div className="flex gap-2 text-xs"><button onClick={() => { const { [c]: _, ...resto } = ciudades; setCiudades(resto); log(`Ciudad eliminada: ${c}`); setBorrar(null); setAbierta(null); }} className="flex-1 py-1.5 rounded-lg font-semibold text-white" style={{ background: C.red }}>Sí, quitar {c}</button><button onClick={() => setBorrar(null)} className="flex-1 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.mute }}>Cancelar</button></div>
              : <button onClick={() => setBorrar(c)} className="text-xs underline" style={{ color: C.red }}>Quitar esta ciudad</button>}
          </div>}
        </div>
      ))}
      <div className="flex gap-2"><input value={nuevaC} onChange={(e) => setNuevaC(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCiudad()} placeholder="Nueva ciudad (ej. Montero)" className="flex-1 rounded-xl px-3 py-2 text-sm" style={inp} /><button onClick={addCiudad} className="px-4 rounded-xl text-sm font-semibold text-white" style={{ background: C.grad }}>+ Ciudad</button></div>
    </div>
  );
}

// ───────── Verificación de nuevos registros ─────────
export function AdminVerificar({ users, setU }) {
  const [mot, setMot] = useState({});
  const lista = users.filter((u) => u.est === "Verificación");
  if (!lista.length) return <div className="text-xs rounded-xl p-2.5" style={{ background: C.okSoft, color: C.ok }}>✓ No hay registros por verificar.</div>;
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold" style={{ color: C.ink }}>🪪 Registros por verificar ({lista.length})</div>
      {lista.map((u) => (
        <div key={u._uid || u.n} className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `2px solid ${C.amber}` }}>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>{u.n}</div>
          <div className="text-xs" style={{ color: C.mute }}>{u._email}{u.perfil && u.perfil.tel ? ` · WhatsApp ${u.perfil.tel}` : ""}{u._alta ? ` · se registró el ${fechaL(new Date(u._alta))}` : ""}</div>
          <div className="flex gap-2">{[["front", "Anverso"], ["back", "Reverso"]].map(([k, l]) => u.ci && u.ci[k] ? <ImgSegura key={k} src={u.ci[k]} alt={l} className="rounded-lg object-cover" style={{ width: 130, height: 86 }} /> : <div key={k} className="flex items-center justify-center rounded-lg text-xs" style={{ width: 130, height: 86, border: `1px dashed ${C.mute}`, color: C.mute }}>🪪 Sin {l.toLowerCase()}</div>)}</div>
          {u.perfil && u.perfil.tel && <a href={waLink(u.perfil.tel, `Hola ${u.n.split(" ")[0]}, te escribimos de Vortex sobre la verificación de tu cuenta.`)} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: C.brandDk }}>Escribirle por WhatsApp</a>}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setU(u.n, { est: "Prueba", plan: "Prueba", prueba: { inicio: Date.now(), fin: Date.now() + 48 * 36e5 }, verif: isoOf(HOY), motRech: null }, "identidad verificada · prueba de 48 h activada"); notificar("verificado", { para: u.n, ok: true }); }} className="py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.ok }}>✓ Aprobar</button>
            <button onClick={() => { const m = (mot[u.n] || "").trim(); if (!m) { setMot({ ...mot, [u.n]: " " }); return; } setU(u.n, { est: "Rechazado", motRech: m }, `verificación rechazada: ${m}`); notificar("verificado", { para: u.n, ok: false, mot: m }); }} className="py-2 rounded-lg text-sm font-semibold" style={{ background: C.redSoft, color: C.red }}>Rechazar</button>
          </div>
          {mot[u.n] !== undefined && <input value={mot[u.n].trimStart()} onChange={(e) => setMot({ ...mot, [u.n]: e.target.value })} placeholder="Motivo del rechazo (ej. foto borrosa) y presiona Rechazar" className="w-full rounded-lg px-2 py-1.5 text-sm" style={inp} />}
        </div>
      ))}
    </div>
  );
}

// ───────── Métricas del negocio + respaldos ─────────
const plano = (o) => { const r = {}; Object.entries(o || {}).forEach(([k, v]) => { if (k === "desc") r[k] = v; else r[k] = v !== null && typeof v === "object" ? JSON.stringify(v) : v; }); return r; };
const bajarArchivo = (blob, nombre) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };

export function AdminMetricas({ users, pagos, props, ops, cfg, respaldo, flash }) {
  const [ocupado, setOcupado] = useState(false);
  const hoyIso = isoOf(HOY);
  const agentes = users.filter((u) => u._rol !== "admin");
  const precio = (plan) => (cfg.planes.find((p) => p.nombre === plan) || {}).precio || 0;
  const activos = agentes.filter((u) => u.est === "Activo" && u.venc && u.venc >= hoyIso && precio(u.plan));
  const aprobados = pagos.filter((p) => p.est === "Aprobado");
  const pagaron = new Set(aprobados.map((p) => p.de));
  const conv = agentes.length ? Math.round((100 * agentes.filter((u) => pagaron.has(u.n)).length) / agentes.length) : 0;
  const bajas = agentes.filter((u) => pagaron.has(u.n) && !activos.includes(u)).length;
  const mrr = activos.reduce((a, u) => a + precio(u.plan), 0);
  // registros por semana (últimas 8)
  const lunes = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const semanas = Array.from({ length: 8 }, (_, i) => { const ini = lunes(HOY); ini.setDate(ini.getDate() - 7 * (7 - i)); const fin = new Date(ini); fin.setDate(fin.getDate() + 7); return { l: `${ini.getDate()}/${ini.getMonth() + 1}`, n: agentes.filter((u) => u._alta && new Date(u._alta) >= ini && new Date(u._alta) < fin).length }; });
  const maxS = Math.max(1, ...semanas.map((s) => s.n));
  // ingresos por mes (últimos 6)
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(HOY.getFullYear(), HOY.getMonth() - (5 - i), 1); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; return { l: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][d.getMonth()], n: aprobados.filter((p) => (p.revF || p.iso || "").startsWith(k)).reduce((a, p) => a + (p.monto || 0), 0) }; });
  const maxM = Math.max(1, ...meses.map((m) => m.n));
  const porPlan = cfg.planes.map((p) => [p.nombre, activos.filter((u) => u.plan === p.nombre).length]);
  const otros = [["En prueba", agentes.filter((u) => u.est === "Prueba").length], ["Por verificar", agentes.filter((u) => u.est === "Verificación").length], ["Gratuito / vencido", agentes.filter((u) => !activos.includes(u) && !["Prueba", "Verificación"].includes(u.est)).length]];

  const excel = async () => {
    setOcupado(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const hoja = (nombre, filas) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas.length ? filas : [{ info: "Sin datos" }]), nombre.slice(0, 31));
      hoja("Usuarios", respaldo.perfiles.map((u) => ({ nombre: u.n, correo: u._email, rol: u._rol, plan: u.plan, estado: u.est, vence: u.venc || "", alta: u._alta ? u._alta.slice(0, 10) : "", whatsapp: (u.perfil && u.perfil.tel) || "", carnet: u.ci ? "Sí" : "No", terminos: u.terminos || "" })));
      hoja("Propiedades", respaldo.propiedades.map((p) => plano({ ...p, captador: p.cap && p.cap.n, telCaptador: p.cap && p.cap.tel, cap: undefined })));
      hoja("Pagos", respaldo.pagos.map(plano));
      hoja("Cierres", respaldo.operaciones.map(plano));
      hoja("Visitas", respaldo.visitas.map(plano));
      hoja("Reportes", respaldo.reportes.map(plano));
      hoja("Sugerencias", respaldo.sugerencias.map(plano));
      hoja("Reseñas", respaldo.resenas.map((r) => (Array.isArray(r) ? { id: r[0], agente: r[1], estrellas: r[2], de: r[3] } : plano(r))));
      hoja("Auditoría", respaldo.auditoria.map(plano));
      hoja("Configuración", Object.entries(respaldo.cfg).map(([k, v]) => ({ clave: k, valor: typeof v === "object" ? JSON.stringify(v) : v })));
      XLSX.writeFile(wb, `respaldo-vortex-${hoyIso}.xlsx`);
      flash("Respaldo en Excel descargado.");
    } catch (e) { flash(`No se pudo crear el Excel: ${e.message || e}`); }
    setOcupado(false);
  };
  const json = () => { bajarArchivo(new Blob([JSON.stringify({ fecha: new Date().toISOString(), ...respaldo }, null, 1)], { type: "application/json" }), `respaldo-vortex-${hoyIso}.json`); flash("Respaldo técnico descargado."); };

  const Barras = ({ datos, max, fmt }) => <div className="flex items-end gap-1.5" style={{ height: 110 }}>{datos.map((d, i) => <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1"><span style={{ fontSize: 9, color: C.mute }}>{d.n ? fmt(d.n) : ""}</span><div className="w-full rounded-t-md" style={{ height: `${Math.max(3, (d.n / max) * 80)}px`, background: C.grad }} /><span style={{ fontSize: 9, color: C.mute }}>{d.l}</span></div>)}</div>;
  const Tarjeta = ({ v, l, s }) => <div className="rounded-xl p-3" style={{ background: C.lilaSoft }}><div style={{ ...serif, color: C.lilaDk, fontSize: 22, fontWeight: 700 }}>{v}</div><div className="text-xs" style={{ color: C.ink }}>{l}</div>{s && <div style={{ fontSize: 10, color: C.mute }}>{s}</div>}</div>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Tarjeta v={agentes.length} l="Agentes registrados" />
        <Tarjeta v={activos.length} l="Con plan de pago activo" />
        <Tarjeta v={`${conv}%`} l="Conversión a pago" s="agentes que pagaron alguna vez" />
        <Tarjeta v={bajas} l="Dejaron de pagar" s="pagaron antes y hoy no están activos" />
        <Tarjeta v={bs(mrr)} l="Ingreso mensual estimado" s="suma de planes activos" />
        <Tarjeta v={props.filter((p) => ["Disponible", "Reservado"].includes(p.est || "Disponible")).length} l="Propiedades activas" s={`${ops.length} cierres registrados`} />
      </div>
      <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}><div className="text-sm font-semibold" style={{ color: C.ink }}>Nuevos registros por semana</div><Barras datos={semanas} max={maxS} fmt={(n) => n} /></div>
      <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}><div className="text-sm font-semibold" style={{ color: C.ink }}>Ingresos por mes (pagos aprobados)</div><Barras datos={meses} max={maxM} fmt={(n) => Math.round(n)} /></div>
      <div className="rounded-2xl p-3 space-y-1.5 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
        <div className="font-semibold">Agentes por plan</div>
        {[...porPlan, ...otros].map(([l, n]) => <div key={l} className="flex items-center gap-2"><span className="w-32 text-xs">{l}</span><div className="flex-1 rounded-full overflow-hidden" style={{ background: C.line, height: 8 }}><div style={{ width: `${agentes.length ? (100 * n) / agentes.length : 0}%`, height: 8, background: C.lila }} /></div><span className="text-xs w-6 text-right">{n}</span></div>)}
      </div>
      <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold" style={{ color: C.ink }}>💾 Respaldo de la información</div>
        <div className="text-xs" style={{ color: C.mute }}>Descarga una copia de usuarios, propiedades, pagos, cierres, visitas, reportes, reseñas, auditoría y configuración. Guárdala en tu computadora o en Google Drive. Recomendado: una vez por semana.</div>
        <button disabled={ocupado} onClick={excel} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.grad }}>{ocupado ? "Preparando…" : "⬇ Descargar respaldo en Excel"}</button>
        <button onClick={json} className="w-full py-2 rounded-xl text-xs" style={{ border: `1px solid ${C.line}`, color: C.mute }}>⬇ Respaldo técnico completo (JSON)</button>
        <div style={{ fontSize: 10, color: C.mute }}>No incluye las fotos ni los datos privados de cada agente (sus clientes y búsquedas).</div>
      </div>
    </div>
  );
}

// ───────── Plantillas de respuestas rápidas (Premium) ─────────
export const PLANTILLAS_BASE = [
  { id: "p1", titulo: "Requisitos para alquilar", txt: "Hola {cliente} 👋, para alquilar este inmueble los requisitos son:\n• Fotocopia de carnet de identidad\n• Garantía (a convenir con el propietario)\n• Mes adelantado\n• Contrato mínimo de 1 año\n¿Te ayudo a coordinar una visita? — {agente}" },
  { id: "p2", titulo: "Documentos para comprar", txt: "Hola {cliente}, para avanzar con la compra se necesita:\n• Carnet de identidad vigente\n• Documento de respaldo de fondos o pre-aprobación bancaria\n• Revisión del folio real y planos del inmueble\nCon gusto te acompaño en cada paso. — {agente}" },
  { id: "p3", titulo: "Gracias por la visita", txt: "Hola {cliente}, muchas gracias por tu tiempo en la visita a {propiedad}. Si tienes alguna duda o quieres comparar con otras opciones, aquí estoy para ayudarte. — {agente}" },
  { id: "p4", titulo: "Ya no está disponible", txt: "Hola {cliente}, te cuento que {propiedad} ya no está disponible. Tengo otras opciones parecidas que podrían interesarte, ¿te las envío? — {agente}" },
  { id: "p5", titulo: "Pedir referidos", txt: "Hola {cliente}, fue un gusto ayudarte. Si conoces a alguien que esté buscando comprar, vender o alquilar, te agradecería mucho que me recomiendes. ¡Gracias! — {agente}" },
];
export const llenarPlantilla = (txt, d) => String(txt || "").replace(/\{cliente\}/g, d.cliente || "").replace(/\{propiedad\}/g, d.propiedad || "la propiedad").replace(/\{agente\}/g, d.agente || "").replace(/ {2,}/g, " ").replace(/Hola ,/g, "Hola,");

export function Plantillas({ plantillas, setPlantillas, agente, flash }) {
  const [edit, setEdit] = useState(null);
  const guardar = () => { if (!edit.titulo.trim() || !edit.txt.trim()) { flash("Escribe un título y el mensaje."); return; } setPlantillas(plantillas.some((p) => p.id === edit.id) ? plantillas.map((p) => (p.id === edit.id ? edit : p)) : [...plantillas, edit]); setEdit(null); flash("Plantilla guardada."); };
  return (
    <div className="space-y-2">
      <div className="text-xs rounded-xl p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>💬 Tus mensajes frecuentes, listos para enviar en un toque. Usa <b>{"{cliente}"}</b>, <b>{"{propiedad}"}</b> y <b>{"{agente}"}</b>: se reemplazan solos al usarlos desde una visita o una ficha.</div>
      {edit ? <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `2px solid ${C.lila}` }}>
        <Fld l="Título"><input value={edit.titulo} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l="Mensaje"><textarea rows={6} value={edit.txt} onChange={(e) => setEdit({ ...edit, txt: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <div className="grid grid-cols-2 gap-2"><button onClick={guardar} className="py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.lila }}>Guardar</button><button onClick={() => setEdit(null)} className="py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.line}`, color: C.mute }}>Cancelar</button></div>
      </div> : <button onClick={() => setEdit({ id: "p" + Date.now(), titulo: "", txt: "" })} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: C.grad }}>+ Nueva plantilla</button>}
      {plantillas.map((p) => (
        <div key={p.id} className="rounded-2xl p-3 space-y-1.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex justify-between gap-2"><span className="text-sm font-semibold" style={{ color: C.ink }}>{p.titulo}</span><span className="flex gap-3 text-xs"><button onClick={() => setEdit(p)} className="underline" style={{ color: C.brandDk }}>Editar</button><button onClick={() => setPlantillas(plantillas.filter((x) => x.id !== p.id))} className="underline" style={{ color: C.red }}>Borrar</button></span></div>
          <div className="text-xs whitespace-pre-line" style={{ color: C.mute }}>{p.txt}</div>
          <button onClick={async () => { const ok = await copiarTexto(llenarPlantilla(p.txt, { agente })); flash(ok ? "Mensaje copiado." : "No se pudo copiar."); }} className="text-xs font-semibold underline" style={{ color: C.lilaDk }}>📋 Copiar</button>
        </div>
      ))}
      {!plantillas.length && <button onClick={() => setPlantillas(PLANTILLAS_BASE)} className="w-full text-xs underline" style={{ color: C.mute }}>Restaurar plantillas sugeridas</button>}
    </div>
  );
}

export function RespuestasRapidas({ plantillas, datos, onClose, flash }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: "rgba(30,27,58,.55)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-4 space-y-2 overflow-y-auto" style={{ background: C.card, maxHeight: "85%" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><div className="font-semibold" style={{ color: C.ink }}>💬 Respuestas rápidas{datos.cliente ? ` · ${datos.cliente}` : ""}</div><button onClick={onClose} className="text-xl" style={{ color: C.mute }}>✕</button></div>
        {!plantillas.length && <div className="text-sm" style={{ color: C.mute }}>Aún no tienes plantillas. Créalas en Perfil → Plantillas.</div>}
        {plantillas.map((p) => { const txt = llenarPlantilla(p.txt, datos); return (
          <div key={p.id} className="rounded-xl p-3 space-y-1.5" style={{ border: `1px solid ${C.line}` }}>
            <div className="text-sm font-semibold" style={{ color: C.ink }}>{p.titulo}</div>
            <div className="text-xs whitespace-pre-line" style={{ color: C.mute }}>{txt}</div>
            <div className="grid grid-cols-2 gap-2">
              <a href={waNum(datos.tel).length >= 8 ? waLink(datos.tel, txt) : `https://wa.me/?text=${encodeURIComponent(txt)}`} target="_blank" rel="noreferrer" className="block text-center py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "#25D366" }}>Enviar por WhatsApp</a>
              <button onClick={async () => { const ok = await copiarTexto(txt); flash(ok ? "Mensaje copiado." : "No se pudo copiar."); }} className="py-2 rounded-lg text-xs font-semibold" style={{ background: C.lilaSoft, color: C.lilaDk }}>📋 Copiar</button>
            </div>
          </div>); })}
      </div>
    </div>
  );
}
