import { useState, useMemo, useEffect } from "react";
import { useSync, useSyncObj } from "./datos";
import { subir, subirVarios } from "./archivos";

// Fecha de hoy (a medianoche). Antes era una fecha fija de demostración.
const hoy0 = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

const C = { ink: "#10142C", bg: "#F6F4FC", card: "#FFFFFF", line: "#E4E0F0", mute: "#6B6F8A", brand: "#08BFC5", brandDk: "#07868C", brandSoft: "#D6F6F7", lila: "#7928CA", lila2: "#B76AF2", lilaSoft: "#F0E6FB", lilaDk: "#5A1E9E", grad: "linear-gradient(135deg, #08BFC5, #7928CA)", amber: "#B45309", amberSoft: "#FDF0D5", red: "#B42318", redSoft: "#FDE7E4", ok: "#15803D", okSoft: "#DCF5E4" };
const BOB = 6.96;
const serif = { fontFamily: "'Montserrat', 'Segoe UI', system-ui, sans-serif" };

const PROPS = [
  { id: 1, op: "Alquiler", tipo: "Departamento", t: "Depto luminoso con vista al parque", ciudad: "Cochabamba", zona: "Norte", precio: 450, mon: "USD", dorm: 2, ban: 2, m2: 85, garaje: true, mascotas: "Condicionado", amoblado: "Semi-amoblado", dias: 1, cap: { n: "Carla Rojas", tel: "591 700 11122", ciu: "Cochabamba" }, com: "Propietario paga 50% del primer mes", hue: 170 },
  { id: 2, op: "Venta", tipo: "Departamento", t: "3 dormitorios con garaje, edificio nuevo", ciudad: "Cochabamba", zona: "Norte", precio: 120000, mon: "USD", dorm: 3, ban: 2, m2: 120, garaje: true, mascotas: "Sí", amoblado: "Vacío", dias: 6, cap: { n: "Marcelo Vargas", tel: "591 700 33344", ciu: "Cochabamba" }, com: "3% pagado por el propietario", hue: 215 },
  { id: 3, op: "Alquiler", tipo: "Casa", t: "Casa con jardín cerca de colegios", ciudad: "Cochabamba", zona: "Sur", precio: 3800, mon: "BOB", dorm: 3, ban: 2, m2: 160, garaje: true, mascotas: "Sí", amoblado: "Vacío", dias: 9, cap: { n: "Daniela Soria", tel: "591 700 55566", ciu: "Cochabamba" }, com: "Un mes de alquiler", hue: 30 },
  { id: 4, op: "Anticrético", tipo: "Departamento", t: "Anticrético en Sopocachi, 2 dormitorios", ciudad: "La Paz", zona: "Sopocachi", precio: 38000, mon: "USD", dorm: 2, ban: 1, m2: 78, garaje: false, mascotas: "No", amoblado: "Vacío", dias: 3, cap: { n: "Raúl Mamani", tel: "591 700 77788", ciu: "La Paz" }, com: "Propietario no paga; lo asume el inquilino", hue: 260 },
  { id: 5, op: "Alquiler", tipo: "Oficina", t: "Oficina en Equipetrol, piso 5", ciudad: "Santa Cruz", zona: "Equipetrol", precio: 900, mon: "USD", dorm: 0, ban: 1, m2: 60, garaje: true, mascotas: "No", amoblado: "Amoblado", dias: 17, cap: { n: "Paola Egüez", tel: "591 700 99900", ciu: "Santa Cruz" }, com: "Un mes de alquiler", hue: 340 },
  { id: 6, op: "Venta", tipo: "Terreno", t: "Terreno 400 m² esquina, Urubó", ciudad: "Santa Cruz", zona: "Urubó", precio: 95000, mon: "USD", dorm: 0, ban: 0, m2: 400, garaje: false, mascotas: "Sí", amoblado: "Vacío", dias: 40, cap: { n: "Iván Suárez", tel: "591 700 22233", ciu: "Santa Cruz" }, com: "3% pagado por el propietario", hue: 95 },
];

const CLIENTES = [
  { id: 1, n: "Juan Pérez", op: "Alquiler", ciudad: "Cochabamba", zona: "Norte", max: 500, mon: "USD", dorm: 2, ban: 1, garaje: "Obligatorio", mascotas: "Indiferente", amoblado: "Preferido" },
  { id: 2, n: "Familia Quispe", op: "Venta", ciudad: "Cochabamba", zona: "Norte", max: 125000, mon: "USD", dorm: 3, ban: 2, garaje: "Obligatorio", mascotas: "Indiferente", amoblado: "Indiferente" },
];

const VISITAS0 = [
  { id: 1, p: 1, cl: "Juan Pérez", f: "2026-10-10", h: "10:00", ag: "Carla Rojas", est: "Confirmada" },
  { id: 2, p: 2, cl: "Familia Quispe", f: "2026-10-11", h: "16:30", ag: "Marcelo Vargas", est: "Pendiente" },
  { id: 3, p: 1, cl: "Cliente de Marcelo", f: "2026-10-13", h: "11:00", ag: "Carla Rojas", de: "Marcelo Vargas", est: "Pendiente" },
];

const NOTIFS = [
  { id: 1, ic: "🔔", t: "Nueva propiedad compatible con el requerimiento de Juan Pérez", s: "Depto en Cochabamba Norte, USD 450", to: { tab: "buscar", p: 1 }, h: "Hace 12 min" },
  { id: 2, ic: "⏳", t: "Tu propiedad requiere actualización", s: "Casa con jardín cerca de colegios · confirma que sigue disponible", to: { tab: "buscar", p: 3 }, h: "Hace 2 h" },
  { id: 3, ic: "📅", t: "Visita mañana a las 10:00", s: "Juan Pérez · Depto luminoso con vista al parque", to: { tab: "visitas" }, h: "Ayer" },
];

const tolerancia = (op) => (op === "Venta" || op === "Preventa" || op === "Terreno" ? 3 : 1);
function vigencia(p, det = true) {
  const k = tolerancia(p.op === "Venta" ? "Venta" : p.op) , base = 7 * k;
  if (p.dias <= base) return { n: 0, l: !det ? "Confirmado" : p.dias <= 1 ? "Confirmado hoy" : `Confirmado hace ${p.dias} d`, c: C.ok, bg: C.okSoft };
  if (p.dias <= base * 2) return { n: 1, l: "Requiere actualización", c: C.amber, bg: C.amberSoft };
  return { n: 2, l: "Disponibilidad no confirmada", c: C.red, bg: C.redSoft };
}
const usd = (p) => (p.mon === "USD" ? p.precio : p.precio / BOB);
const reqUsd = (r) => (r.mon === "USD" ? r.max : r.max / BOB);
const money = (p) => `${p.mon === "USD" ? "USD" : "Bs"} ${p.precio.toLocaleString("es-BO")}`;

function match(r, p) {
  const strict = [
    ["Operación", p.op === r.op, p.op],
    ["Ciudad", p.ciudad === r.ciudad, p.ciudad],
    ["Presupuesto", usd(p) <= reqUsd(r) * 1.0, money(p)],
    ["Dormitorios", p.dorm >= r.dorm, `${p.dorm} dormitorios`],
  ];
  const weighted = [
    ["Zona", p.zona === r.zona, p.zona === r.zona ? p.zona : `Zona diferente (${p.zona})`, 3],
    ["Garaje", r.garaje === "Indiferente" || (r.garaje === "Obligatorio" ? p.garaje : true), p.garaje ? "Con garaje" : "Sin garaje", r.garaje === "Obligatorio" ? 3 : 1],
    ["Mascotas", r.mascotas === "Indiferente" || (r.mascotas === "Sí" ? p.mascotas !== "No" : p.mascotas !== "Sí"), `Mascotas: ${p.mascotas}`, 1],
    ["Amoblado", r.amoblado === "Indiferente" || p.amoblado !== "Vacío", p.amoblado, 1],
  ];
  if (strict.some((s) => !s[1])) return null;
  const tot = weighted.reduce((a, w) => a + w[3], 0), got = weighted.reduce((a, w) => a + (w[1] ? w[3] : 0), 0);
  const pct = Math.round(60 + 40 * (got / tot));
  return { pct, strict, weighted, tag: pct >= 95 ? "Coincidencia exacta" : pct >= 80 ? "Coincidencia cercana" : "Alternativa" };
}

const Chip = ({ on, children, ...r }) => (
  <button {...r} className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap" style={{ background: on ? C.lila : C.card, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.lila : C.line}` }}>{children}</button>
);
const EstBadge = ({ est }) => {
  const c = { Reservado: [C.amber, C.amberSoft], "En pausa": [C.mute, C.lilaSoft], "Caído": [C.red, C.redSoft] }[est];
  return c ? <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: c[1], color: c[0] }}>{EMO[est]} {est}</span> : null;
};
const RK = { Disponible: 0, Reservado: 1, "En pausa": 2, "Caído": 3 };
const Badge = ({ v }) => (<span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: v.bg, color: v.c }}>{v.l}</span>);
const Photo = ({ hue, h = 120, label, src }) => (
  <div className="w-full flex items-end p-2" style={{ height: h, background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, hsl(${hue} 45% 78%), hsl(${hue + 30} 40% 55%))`, borderRadius: 12 }}>
    {label && <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,.85)", color: C.ink }}>{label}</span>}
  </div>
);

function Card({ p, onOpen, locked, rate, perm }) {
  const v = vigencia(p, perm.vigDet), est = p.est || "Disponible";
  return (
    <button onClick={() => onOpen(p)} className="text-left w-full rounded-2xl p-3 flex gap-3" style={{ background: C.card, border: `1px solid ${C.line}`, opacity: v.n === 2 || est === "En pausa" || est === "Caído" ? 0.7 : 1 }}>
      <div style={{ width: 92, flexShrink: 0 }}><Photo hue={p.hue} h={92} src={locked ? null : p.fotos?.[0]} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.mute }}><span>{p.op}</span><span>{p.tipo}</span></div>
        <div className="font-semibold leading-snug" style={{ color: C.ink, fontSize: 15 }}>{locked ? tBasico(p) : p.t}</div>
        <div className="text-xs mt-0.5" style={{ color: C.mute }}>{p.zona}, {p.ciudad}{p.dorm ? ` · ${p.dorm} dorm · ${p.ban} baños` : ""} · {p.m2} m²</div>
        <div className="flex items-center justify-between mt-1.5">
          <span style={{ ...serif, color: C.ink, fontSize: 18, fontWeight: 700 }}>{money(p)}</span>
          <span className="flex gap-1 items-center"><EstBadge est={est} /><Badge v={v} /></span>
        </div>
        {locked && <div className="text-xs mt-1" style={{ color: C.mute }}>🔒 Captador y contacto con suscripción activa</div>}
        {!locked && rate(p.cap.n) && <div className="text-xs mt-1" style={{ color: C.mute }}>{p.cap.n} · ⭐ {rate(p.cap.n).avg.toFixed(1)}</div>}
      </div>
    </button>
  );
}

function Detalle(a) {
  const ant = (a.users.find((x) => x.n === a.p.cap.n) || { ant: 0 }).ant;
  return DetalleInner({ ...a, ant });
}
function DetalleInner({ p, acceso, onBack, onVisit, onReport, ant, rate, onProfile, favs, toggleFav, clientes, onSub, perm, flash }) {
  const [share, setShare] = useState(false);
  const v = vigencia(p, perm.vigDet);
  const locked = acceso === "vencido";
  const isFav = (cid) => favs.some((f) => f.pid === p.id && f.cid === cid);
  const msg = `🏠 ${p.op} · ${p.tipo}\n${p.t}\n📍 ${p.zona}, ${p.ciudad}\n💰 ${money(p)}\n${p.dorm ? `🛏 ${p.dorm} dorm · 🚿 ${p.ban} baños · ` : ""}${p.m2} m²\nVer ficha: vortex.app/p/${p.id}`;
  return (
    <div className="p-4 pb-8 space-y-3">
      <button onClick={onBack} className="text-sm" style={{ color: C.brandDk }}>‹ Volver a resultados</button>
      {!locked && p.fotos && p.fotos.length ? <Galeria fotos={p.fotos} titulo={p.t} texto={`${p.t} · ${money(p)} · ${p.zona}, ${p.ciudad}`} /> : <Photo hue={p.hue} h={190} src={null} label={locked ? "Fotos con suscripción" : "Sin fotos"} />}
      <div className="flex items-center justify-between"><span className="text-sm" style={{ color: C.mute }}>{p.op} · {p.tipo}</span><span className="flex gap-1 items-center"><EstBadge est={p.est || "Disponible"} /><Badge v={v} /></span></div>
      <h2 className="font-semibold text-xl leading-snug" style={{ color: C.ink }}>{locked ? tBasico(p) : p.t}</h2>
      <div style={{ ...serif, fontSize: 28, fontWeight: 700, color: C.ink }}>{money(p)}</div>
      {perm.fav && <div className="flex gap-2 overflow-x-auto items-center">
        <Chip on={isFav(null)} onClick={() => toggleFav(p.id, null)}>{isFav(null) ? "♥ Guardada" : "♡ Guardar"}</Chip>
        {perm.cliente && clientes.map((c) => <Chip key={c.id} on={isFav(c.id)} onClick={() => toggleFav(p.id, c.id)}>Para {c.n.split(" ")[0]}</Chip>)}
      </div>}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Dormitorios", p.dorm || "—"], ["Baños", p.ban || "—"], ["Superficie", `${p.m2} m²`]].map(([a, b]) => (
          <div key={a} className="rounded-xl py-2" style={{ background: C.card, border: `1px solid ${C.line}` }}><div className="font-semibold" style={{ color: C.ink }}>{b}</div><div className="text-xs" style={{ color: C.mute }}>{a}</div></div>
        ))}
      </div>
      <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
        <div>📍 {p.zona}, {p.ciudad}</div>
        {locked ? (
          <div style={{ color: C.mute }}>Dirección exacta, garaje, mascotas y condiciones disponibles con suscripción activa.</div>
        ) : (
          <>
            <div>🚗 Garaje: {p.garaje ? `Sí${p.gTipo ? ` (${p.gTipo.toLowerCase()})` : ""}` : "No"}{p.gAparte ? ` · se alquila aparte en el edificio${p.gPrecio ? `: ${p.mon === "USD" ? "USD" : "Bs"} ${p.gPrecio}/mes` : ""}` : ""}</div>
            <div>🐾 Mascotas: {p.mascotas}{p.mascCond ? `: ${p.mascCond}` : ""}</div>
            <div>🛋 {p.amoblado}</div>
            <div>💼 Comisión: {p.com}</div>
            {p.condComp && <div>📄 Condiciones: {p.condComp}</div>}
            {p.desc && <div className="pt-1 whitespace-pre-line" style={{ color: C.mute }}>{p.desc}</div>}
          </>
        )}
      </div>
      {locked ? (
        <div className="rounded-2xl p-4 text-center space-y-2" style={{ background: C.amberSoft, border: `1px solid #F1D79B` }}>
          <div className="font-semibold" style={{ color: C.amber }}>Estás en el plan Gratuito</div>
          <div className="text-sm" style={{ color: C.ink }}>Puedes ver que la propiedad existe, pero necesitas una suscripción activa para ver el captador y contactarlo.</div>
          <button onClick={onSub} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.lila }}>Activar suscripción</button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: C.grad }}>{p.cap.n[0]}</div>
            <div className="flex-1"><div className="font-semibold" style={{ color: C.ink }}>{p.cap.n}</div><div className="text-xs" style={{ color: C.mute }}>Captador · {p.cap.ciu}{rate(p.cap.n) ? ` · ⭐ ${rate(p.cap.n).avg.toFixed(1)} (${rate(p.cap.n).n})` : ""}</div><div className="text-xs" style={{ color: ant ? C.amber : C.ok }}>{ant ? `⚠️ ${ant} antecedente${ant > 1 ? "s" : ""} confirmado${ant > 1 ? "s" : ""} por la administración` : "✓ Sin antecedentes confirmados"}</div></div>
            <button onClick={() => onProfile(p.cap.n)} className="text-xs px-2 py-1 rounded-md" style={{ background: C.lilaSoft, color: C.lilaDk }}>Ver perfil</button>
          </div>
          <div className="text-xs rounded-xl p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>Colaboración 50/50: si cierras con tu cliente, la comisión se divide en partes iguales con el captador.</div>
          <button onClick={async () => { const ok = await copiarTexto(textoCopy(p, miTel())); flash && flash(ok ? (waNum(miTel()).length < 8 ? "Copy copiado. Tip: agrega tu WhatsApp en Mis datos para incluir tu enlace." : "Copy copiado con tu WhatsApp. Pégalo en el chat de tu cliente.") : "No se pudo copiar automáticamente."); }} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.lilaSoft, color: C.lilaDk }}>📋 Copiar copy para enviar a un cliente</button>
          <div className={`grid ${perm.share ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
            <button onClick={() => window.open(`https://wa.me/${p.cap.tel.replace(/\D/g, "")}?text=${encodeURIComponent("Hola " + p.cap.n + ", vi tu captación en Vortex: " + p.t)}`, "_blank")} className="py-3 rounded-xl font-semibold text-white" style={{ background: "#1FA855" }}>Escribir por WhatsApp</button>
            {perm.share && <button onClick={() => setShare(!share)} className="py-3 rounded-xl font-semibold" style={{ background: C.card, border: `1px solid ${C.ink}`, color: C.ink }}>Compartir con cliente</button>}
          </div>
          {share && (() => { const txt = textoCopy(p, miTel()); return (
            <div className="rounded-xl p-3 space-y-2" style={{ background: "#E7F6DD", color: "#1B3A12" }}>
              <div className="text-xs font-semibold">Así le llegará a tu cliente (con tu WhatsApp, no el del captador):</div>
              <div className="text-sm whitespace-pre-line rounded-lg p-2.5" style={{ background: "#fff", maxHeight: 260, overflowY: "auto" }}>{txt}</div>
              {waNum(miTel()).length < 8 && <div className="text-xs" style={{ color: C.amber }}>⚠️ Agrega tu WhatsApp en Perfil → Mis datos para que el mensaje incluya tu enlace de contacto.</div>}
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(txt)}`} target="_blank" rel="noreferrer" className="block text-center py-2 rounded-lg text-white font-semibold text-sm" style={{ background: "#1FA855" }}>Enviar por WhatsApp</a>
                <button onClick={async () => { const ok = await copiarTexto(txt); flash && flash(ok ? "Copy copiado. Pégalo en el chat de tu cliente." : "No se pudo copiar automáticamente."); }} className="py-2 rounded-lg font-semibold text-sm" style={{ background: "#fff", color: "#1B3A12" }}>📋 Copiar copy</button>
              </div>
              {p.fotos && p.fotos.length > 0 && <div className="text-xs">Las fotos las envías con el botón “📤 Enviar fotos” de arriba.</div>}
            </div>); })()}
          {perm.report && <button onClick={() => onReport(p)} className="w-full text-xs underline" style={{ color: C.mute }}>Reportar a este agente</button>}
          <button onClick={() => onVisit(p)} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.lila }}>Agendar visita</button>
        </>
      )}
      {v.n > 0 && <div className="text-xs" style={{ color: C.mute }}>El captador debe confirmar que esta propiedad sigue disponible. Mientras tanto aparece con menos prioridad en las búsquedas.</div>}
    </div>
  );
}

function Buscar({ acceso, open, props, rate, favs, perm, goSub, busq, setBusq }) {
  const [op, setOp] = useState("Todas");
  const [ciu, setCiu] = useState("Todas");
  const [max, setMax] = useState("");
  const [gar, setGar] = useState(false);
  const [fv, setFv] = useState(false);
  const [dorm, setDorm] = useState("Todos");
  const [masc, setMasc] = useState(false);
  const list = useMemo(() => props.filter((p) => (p.est || "Disponible") !== "Cerrado" && (dorm === "Todos" || (dorm === "4+" ? p.dorm >= 4 : p.dorm === Number(dorm))) && (!masc || p.mascotas !== "No") && (!fv || favs.some((f) => f.pid === p.id)) && (op === "Todas" || p.op === op) && (ciu === "Todas" || p.ciudad === ciu) && (!gar || p.garaje) && (!max || usd(p) <= Number(max))).sort((a, b) => RK[a.est || "Disponible"] - RK[b.est || "Disponible"] || vigencia(a).n - vigencia(b).n || a.dias - b.dias), [op, ciu, max, gar, fv, dorm, masc, favs, props]);
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">{["Todas", "Venta", "Alquiler", "Anticrético", "Preventa"].map((o) => <Chip key={o} on={op === o} onClick={() => setOp(o)}>{o}</Chip>)}</div>
      <div className="flex gap-2">
        <select value={ciu} onChange={(e) => setCiu(e.target.value)} className="flex-1 rounded-xl px-3 py-2 text-sm" style={{ border: `1px solid ${C.line}`, background: C.card, color: C.ink }}>
          {["Todas", "Cochabamba", "La Paz", "Santa Cruz"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Máx. USD" disabled={!perm.filtros} inputMode="numeric" className="w-28 rounded-xl px-3 py-2 text-sm" style={{ border: `1px solid ${C.line}`, background: C.card }} />
        <Chip on={gar} disabled={!perm.filtros} onClick={() => setGar(!gar)}>Garaje</Chip>
        <Chip on={fv} disabled={!perm.fav} onClick={() => setFv(!fv)}>♥</Chip>
      </div>
      {!perm.ficha && <div className="rounded-xl p-2.5 text-xs flex items-center justify-between gap-2" style={{ background: C.lilaSoft, color: C.lilaDk }}><span>Modo limitado: fichas resumidas y filtros básicos. Suscríbete para ver la ficha completa y contactar al captador.</span><button onClick={goSub} className="underline font-semibold shrink-0">Ver planes</button></div>}
      {perm.busq && <div className="flex gap-2 overflow-x-auto items-center"><button onClick={() => setBusq([...busq, { id: Date.now(), n: [op, ciu, dorm !== "Todos" ? dorm + " dorm" : "", max ? "≤" + max : "", gar ? "garaje" : "", masc ? "mascotas" : ""].filter((x) => x && x !== "Todas").join(" · ") || "Todas", op, ciu, max, gar, dorm, masc }])} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap" style={{ border: `1px dashed ${C.lila}`, color: C.lilaDk }}>💾 Guardar búsqueda</button>{busq.map((b) => <span key={b.id} className="flex items-center rounded-full text-xs whitespace-nowrap" style={{ background: C.lilaSoft, color: C.lilaDk }}><button onClick={() => { setOp(b.op); setCiu(b.ciu); setMax(b.max); setGar(b.gar); setDorm(b.dorm); setMasc(b.masc); }} className="pl-3 pr-1 py-1.5">{b.n}</button><button onClick={() => setBusq(busq.filter((x) => x.id !== b.id))} className="pr-2">✕</button></span>)}</div>}
      <div className="flex gap-2 overflow-x-auto items-center" style={{ opacity: perm.filtros ? 1 : 0.4, pointerEvents: perm.filtros ? "auto" : "none" }}><span className="text-xs" style={{ color: C.mute }}>Dormitorios</span>{["Todos", "1", "2", "3", "4+"].map((x) => <Chip key={x} on={dorm === x} onClick={() => setDorm(x)}>{x}</Chip>)}<Chip on={masc} onClick={() => setMasc(!masc)}>🐾 Mascotas</Chip></div>
      <div className="text-xs" style={{ color: C.mute }}>{list.length} propiedades · primero las disponibles y confirmadas</div>
      {list.map((p) => <Card key={p.id} p={p} onOpen={open} locked={acceso === "vencido"} rate={rate} perm={perm} />)}
      {!list.length && <div className="text-center py-10 text-sm" style={{ color: C.mute }}>Sin resultados. Prueba quitando algún filtro o crea un requerimiento en la pestaña "Requerimientos".</div>}
    </div>
  );
}

function Clientes({ acceso, open, props, clientes, setClientes, favs, toggleFav, delCliente, perm, visitas, goSub }) {
  const [conf, setConf] = useState(false);
  const [nota, setNota] = useState("");
  const [sel, setSel] = useState(clientes[0] ? clientes[0].id : null);
  const [nuevo, setNuevo] = useState(false);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ n: "", op: "Alquiler", ciudad: "Cochabamba", zona: "", max: "", mon: "USD", dorm: "2", garaje: "Indiferente", mascotas: "Indiferente", amoblado: "Indiferente" });
  const s = (k) => (v) => setF({ ...f, [k]: v });
  const num = (k) => (e) => s(k)(e.target.value.replace(/\D/g, ""));
  const tri = ["Obligatorio", "Preferido", "Indiferente"];
  const save = () => {
    if (!f.n || !f.max) { setErr("Indica el nombre del cliente y su presupuesto máximo."); return; }
    const c = { id: Date.now(), n: f.n, op: f.op, ciudad: f.ciudad, zona: f.zona, max: +f.max, mon: f.mon, dorm: +f.dorm || 0, garaje: f.garaje, mascotas: f.mascotas, amoblado: f.amoblado, etapa: "Nuevo", mov: isoOf(HOY), notas: [], prox: null };
    setClientes([...clientes, c]); setSel(c.id); setNuevo(false); setErr("");
  };
  if (nuevo) return (
    <div className="p-4 space-y-4">
      <button onClick={() => setNuevo(false)} className="text-sm" style={{ color: C.brandDk }}>‹ Volver</button>
      <h2 className="font-semibold text-lg" style={{ color: C.ink }}>Nuevo requerimiento</h2>
      <Fld l="Nombre del cliente"><input value={f.n} onChange={(e) => s("n")(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <Fld l="Operación"><Seg o={["Venta", "Alquiler", "Anticrético", "Preventa"]} v={f.op} set={s("op")} /></Fld>
      <Fld l="Ciudad"><Seg o={Object.keys(ZONAS)} v={f.ciudad} set={s("ciudad")} /></Fld>
      <Fld l="Zona preferida"><input value={f.zona} onChange={(e) => s("zona")(e.target.value)} placeholder="Ej. Norte" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <div className="grid grid-cols-2 gap-3">
        <Fld l="Presupuesto máximo"><input value={f.max} onChange={num("max")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l="Moneda"><Seg o={["USD", "BOB"]} v={f.mon} set={s("mon")} /></Fld>
        <Fld l="Dormitorios (mín.)"><input value={f.dorm} onChange={num("dorm")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      </div>
      <Fld l="Garaje"><Seg o={tri} v={f.garaje} set={s("garaje")} /></Fld>
      <Fld l="Mascotas"><Seg o={["Sí", "No", "Indiferente"]} v={f.mascotas} set={s("mascotas")} /></Fld>
      <Fld l="Amoblado"><Seg o={tri} v={f.amoblado} set={s("amoblado")} /></Fld>
      {err && <div className="text-sm" style={{ color: C.red }}>{err}</div>}
      <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>Guardar requerimiento</button>
    </div>
  );
  const r = clientes.find((c) => c.id === sel) || clientes[0];
  const upd = (id, patch) => setClientes(clientes.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const res = r && perm.match ? props.filter((p) => ["Disponible", "Reservado"].includes(p.est || "Disponible")).map((p) => ({ p, m: match(r, p) })).filter((x) => x.m).sort((a, b) => b.m.pct - a.m.pct) : [];
  const guardadas = r ? favs.filter((x) => x.cid === r.id).map((x) => props.find((p) => p.id === x.pid)).filter(Boolean) : [];
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-lg" style={{ color: C.ink }}>Mis requerimientos</h2><button onClick={() => setNuevo(true)} className="text-sm px-3 py-1.5 rounded-full text-white" style={{ background: C.grad }}>+ Nuevo requerimiento</button></div>
      {!r && <div className="text-center py-10 text-sm" style={{ color: C.mute }}>Aún no tienes requerimientos. Registra lo que busca tu primer cliente.</div>}
      {r && <>
        <div className="flex gap-2 overflow-x-auto">{clientes.map((c) => <Chip key={c.id} on={r.id === c.id} onClick={() => { setSel(c.id); setConf(false); }}>{c.n}</Chip>)}</div>
        <div className="rounded-xl p-3 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
          <b>{r.op}</b> en {r.ciudad}{r.zona ? `, zona ${r.zona}` : ""} · hasta {r.mon} {r.max.toLocaleString("es-BO")} · {r.dorm}+ dorm<br />
          <span style={{ color: C.mute }}>Garaje: {r.garaje} · Mascotas: {r.mascotas} · Amoblado: {r.amoblado}</span>
        </div>
        {perm.seg && <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>Seguimiento de la oportunidad</div>
          <div className="flex gap-2 overflow-x-auto text-xs" style={{ color: C.mute }}>{ETAPAS.map((e) => <span key={e} className="whitespace-nowrap">{e}: <b style={{ color: C.ink }}>{clientes.filter((c) => (c.etapa || "Nuevo") === e).length}</b></span>)}</div>
          <div className="flex gap-2 overflow-x-auto">{ETAPAS.map((e) => <Chip key={e} on={(r.etapa || "Nuevo") === e} onClick={() => upd(r.id, { etapa: e, mov: isoOf(HOY) })}>{e}</Chip>)}</div>
          <div className="grid grid-cols-5 gap-2"><input value={(r.prox && r.prox.t) || ""} onChange={(e) => upd(r.id, { prox: { t: e.target.value, f: (r.prox && r.prox.f) || "" } })} placeholder="Próxima acción (ej. llamar el lunes)" className="col-span-3 rounded-xl px-3 py-2 text-sm" style={inp} /><input type="date" value={(r.prox && r.prox.f) || ""} onChange={(e) => upd(r.id, { prox: { t: (r.prox && r.prox.t) || "", f: e.target.value } })} className="col-span-2 rounded-xl px-2 py-2 text-sm" style={inp} /></div>
          <div className="flex gap-2"><input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Agregar nota de seguimiento" className="flex-1 rounded-xl px-3 py-2 text-sm" style={inp} /><button onClick={() => { if (!nota.trim()) return; upd(r.id, { notas: [{ f: new Date().toLocaleString("es-BO"), t: nota.trim() }, ...(r.notas || [])], mov: isoOf(HOY) }); setNota(""); }} className="px-3 rounded-xl text-sm font-semibold text-white" style={{ background: C.grad }}>Agregar</button></div>
          {(r.notas || []).map((n, i) => <div key={i} className="text-xs" style={{ color: C.ink }}><span style={{ color: C.mute }}>{n.f} · </span>{n.t}</div>)}
          {visitas.filter((v) => v.cl === r.n).length > 0 && <div className="text-xs pt-1" style={{ color: C.mute }}>Visitas: {visitas.filter((v) => v.cl === r.n).map((v) => `${v.f} ${v.h} (${v.est})`).join(" · ")}</div>}
        </div>}
        <div className="flex justify-end">{conf ? <div className="flex items-center gap-2 text-sm"><span style={{ color: C.ink }}>¿Eliminar el requerimiento de {r.n}?</span><button onClick={() => { delCliente(r.id); setConf(false); setSel(null); }} className="px-3 py-1 rounded-lg text-white" style={{ background: C.red }}>Sí, eliminar</button><button onClick={() => setConf(false)} style={{ color: C.mute }}>No</button></div> : <button onClick={() => setConf(true)} className="text-xs underline" style={{ color: C.red }}>Eliminar este requerimiento</button>}</div>
        {guardadas.length > 0 && <div className="rounded-xl p-3 space-y-1.5" style={{ background: C.lilaSoft }}>
          <div className="text-sm font-semibold" style={{ color: C.lilaDk }}>Guardadas para {r.n.split(" ")[0]} ({guardadas.length})</div>
          {guardadas.map((p) => <div key={p.id} className="flex justify-between items-center text-sm" style={{ color: C.ink }}><button onClick={() => open(p)} className="text-left underline">{p.t}</button><button onClick={() => toggleFav(p.id, r.id)} style={{ color: C.mute }}>Quitar</button></div>)}
        </div>}
        {perm.match ? <div className="text-sm font-semibold" style={{ color: C.ink }}>{res.length} propiedades compatibles</div> : <Lock t="Coincidencias con propiedades" plan="Profesional" go={goSub} />}
        {res.map(({ p, m }) => !perm.matchAv ? (
          <button key={p.id} onClick={() => open(p)} className="w-full text-left rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}><div className="font-semibold text-sm" style={{ color: C.ink }}>{p.t}</div><div className="text-xs" style={{ color: C.mute }}>{money(p)} · {p.zona}, {p.ciudad} · compatible con este requerimiento</div></button>
        ) : (
          <button key={p.id} onClick={() => open(p)} className="w-full text-left rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between"><span className="font-semibold text-sm" style={{ color: C.ink }}>{p.t}</span><span className="font-bold" style={{ ...serif, color: m.pct >= 95 ? C.ok : C.amber, fontSize: 20 }}>{m.pct}%</span></div>
            <div className="text-xs" style={{ color: C.mute }}>{m.tag} · {money(p)} {acceso === "vencido" ? "· 🔒 contacto bloqueado" : ""}</div>
            <div className="flex flex-wrap gap-1.5">
              {[...m.strict, ...m.weighted].map((x) => <span key={x[0]} className="text-xs px-2 py-0.5 rounded-md" style={{ background: x[1] ? C.okSoft : C.amberSoft, color: x[1] ? C.ok : C.amber }}>{x[1] ? "✅" : "⚠️"} {x[2]}</span>)}
            </div>
          </button>
        ))}
      </>}
    </div>
  );
}

function Visitas({ visitas, setVisitas, props, clientes, flash, notify, users, perm, autos }) {
  const reg = (n) => users.some((u) => u.n === n);
  const [vm, setVm] = useState({ y: HOY.getFullYear(), m: HOY.getMonth() });
  const [sel, setSel] = useState(isoOf(HOY));
  const [nuevo, setNuevo] = useState(false);
  const [v, setV] = useState({ pid: "", cid: "", h: "10:00", modo: "Captador de la propiedad", otro: "", cotro: "", ptxt: "", tel: "", agTel: "", waCli: true, waAg: true, waCuando: 1440, txtCli: null, txtAg: null });
  const next = { Pendiente: "Confirmada", Confirmada: "Realizada", Realizada: "Pendiente", Cancelada: "Pendiente", Reprogramada: "Confirmada" };
  const col = { Pendiente: [C.amber, C.amberSoft], Confirmada: [C.brandDk, C.brandSoft], Realizada: [C.ok, C.okSoft], Cancelada: [C.red, C.redSoft], Reprogramada: [C.amber, C.amberSoft] };
  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${vm.y}-${pad(vm.m + 1)}-${pad(d)}`;
  const off = (new Date(vm.y, vm.m, 1).getDay() + 6) % 7;
  const dias = new Date(vm.y, vm.m + 1, 0).getDate();
  const cells = [...Array(off).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  const go = (n) => { const d = new Date(vm.y, vm.m + n, 1); setVm({ y: d.getFullYear(), m: d.getMonth() }); setSel(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`); setNuevo(false); };
  const [sy, sm, sd] = sel.split("-").map(Number);
  const delDia = visitas.filter((x) => x.f === sel).sort((a, b) => a.h.localeCompare(b.h));
  const abiertas = props.filter((p) => !["Cerrado", "Caído"].includes(p.est || "Disponible"));
  const prop = abiertas.find((p) => String(p.id) === v.pid);
  const manual = v.pid === "__otra";
  const cli = clientes.find((c) => String(c.id) === v.cid);
  const cOtro = v.cid === "__otro";
  const cNombre = cOtro ? v.cotro.trim() : cli ? cli.n : "";
  const otro = v.modo === "Otro agente";
  const agNombre = otro ? v.otro.trim() : manual ? ME : prop ? prop.cap.n : "";
  const agUser = users.find((u) => u.n === agNombre);
  const agTelAuto = !otro && prop ? prop.cap.tel || "" : (agUser && agUser.perfil && agUser.perfil.tel) || "";
  const telAg = v.agTel.trim() || agTelAuto;
  const telCli = v.tel.trim() || (cli && cli.tel) || "";
  const esPremium = !!perm.auto;
  const datosMsg = { cl: cNombre || "cliente", pt: prop ? prop.t : manual && v.ptxt.trim() ? v.ptxt.trim() : "la propiedad", zona: prop ? `${prop.zona}, ${prop.ciudad}` : "", fecha: `${sd} de ${MESES[sm - 1].toLowerCase()}`, h: v.h || "10:00", ag: agNombre || "el agente", yo: ME };
  const txtCli = v.txtCli ?? plantillaWa("cli", datosMsg);
  const txtAg = v.txtAg ?? plantillaWa("ag", datosMsg);
  const conAg = !!agNombre && agNombre !== ME;
  const marcarWa = (id, k) => setVisitas((vs) => vs.map((y) => (y.id === id ? { ...y, wa: { ...y.wa, [k]: { ...y.wa[k], env: true, envF: Date.now() } } } : y)));
  const porEnviar = pendWa(visitas);
  const save = () => {
    if ((!prop && !(manual && v.ptxt.trim())) || !cNombre) { flash(manual ? "Escribe la descripción o dirección de la propiedad y el nombre del cliente." : "Elige la propiedad y el cliente, o escribe su nombre."); return; }
    if (otro && !v.otro.trim()) { flash("Escribe el nombre del agente."); return; }
    if (esPremium && v.waCli && waNum(telCli).length < 8) { flash("Escribe el WhatsApp del cliente o desactiva el mensaje al cliente."); return; }
    if (esPremium && v.waAg && conAg && waNum(telAg).length < 8) { flash("Escribe el WhatsApp del agente o desactiva el mensaje al agente."); return; }
    const ag = agNombre;
    const wa = esPremium && (v.waCli || (v.waAg && conAg)) ? { cuando: v.waCuando, cli: v.waCli ? { tel: telCli, txt: txtCli, env: false } : null, ag: v.waAg && conAg ? { tel: telAg, txt: txtAg, env: false } : null } : null;
    setVisitas([...visitas, { id: Date.now(), p: prop ? prop.id : null, ...(manual ? { pTxt: v.ptxt.trim() } : {}), cl: cNombre, clTel: telCli, f: sel, h: v.h || "10:00", ag, agTel: telAg, de: ME, rec: perm.recordatorios ? autos.recDef || 0 : 0, est: "Pendiente", ...(wa ? { wa } : {}) }]);
    notify("Visita agendada", `${cNombre} · ${prop ? prop.t : v.ptxt.trim()} · ${sd} ${MESES[sm - 1].toLowerCase()}, ${v.h}`, { tab: "visitas" });
    flash(ag === ME ? "Visita agendada." : reg(ag) ? `Visita agendada y también en el calendario de ${ag}. Le llegó una notificación.` : `Visita agendada. ${ag} no está en la app: avísale por WhatsApp.`);
    if (wa) flash(v.waCuando === 0 ? "Visita agendada. Los mensajes de WhatsApp están listos arriba para enviar." : `Visita agendada. Los mensajes de WhatsApp quedan programados (${MOMENTOS_WA.find((m) => m[0] === v.waCuando)[1].toLowerCase()}).`);
    setNuevo(false); setV({ ...v, pid: "", ptxt: "", modo: "Captador de la propiedad", cid: "", otro: "", cotro: "", tel: "", agTel: "", txtCli: null, txtAg: null });
  };
  return (
    <div className="p-4 space-y-3">
      {porEnviar.length > 0 && <div className="rounded-2xl p-3 space-y-2" style={{ background: "#E7F8EE", border: "1.5px solid #25D366" }}>
        <div className="text-sm font-bold" style={{ color: "#0F7A3D" }}>📲 Mensajes de WhatsApp listos para enviar ({porEnviar.length})</div>
        {porEnviar.map(({ x, k, m }) => (
          <div key={x.id + k} className="rounded-xl p-2.5 space-y-1.5" style={{ background: "#fff" }}>
            <div className="text-xs font-semibold" style={{ color: C.ink }}>{k === "cli" ? `Al cliente: ${x.cl}` : `Al agente: ${x.ag}`} · visita {fechaL(isoD(x.f))}, {x.h}</div>
            <div className="text-xs" style={{ color: C.mute }}>{m.txt}</div>
            <a href={waLink(m.tel, m.txt)} target="_blank" rel="noreferrer" onClick={() => marcarWa(x.id, k)} className="block text-center py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#25D366" }}>Enviar por WhatsApp</a>
          </div>
        ))}
      </div>}
      <div className="flex items-center justify-between">
        <button onClick={() => go(-1)} className="px-3 py-1 rounded-lg text-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }}>‹</button>
        <h2 className="font-semibold" style={{ color: C.ink }}>{MESES[vm.m]} {vm.y}</h2>
        <button onClick={() => go(1)} className="px-3 py-1 rounded-lg text-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }}>›</button>
      </div>
      <div className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1" style={{ color: C.mute }}>{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <div key={i}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => d === null ? <div key={i} /> : (
            <button key={i} onClick={() => { setSel(iso(d)); setNuevo(false); }} className="relative rounded-lg py-2 text-sm" style={{ background: sel === iso(d) ? C.lila : "transparent", color: sel === iso(d) ? "#fff" : C.ink, border: iso(d) === isoOf(HOY) ? `1.5px solid ${C.brand}` : "1.5px solid transparent" }}>
              {d}
              {visitas.some((x) => x.f === iso(d)) && <span className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ bottom: 3, width: 5, height: 5, background: sel === iso(d) ? "#fff" : C.brand }} />}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center text-xs mt-2" style={{ color: C.mute }}>
          <span>Hoy: {fechaL(HOY)} (borde turquesa). Los puntos marcan días con visitas.</span>
          <button onClick={() => { setVm({ y: HOY.getFullYear(), m: HOY.getMonth() }); setSel(isoOf(HOY)); }} className="underline" style={{ color: C.brandDk }}>Ir a hoy</button>
        </div>
      </div>
      <div className="flex items-center justify-between"><div className="font-semibold" style={{ color: C.ink }}>{sd} de {MESES[sm - 1].toLowerCase()} de {sy}</div><button onClick={() => setNuevo(!nuevo)} className="text-sm px-3 py-1.5 rounded-full text-white" style={{ background: C.grad }}>{nuevo ? "Cerrar" : "+ Registrar visita"}</button></div>
      {nuevo && (
        <div className="rounded-2xl p-3 space-y-3" style={{ background: C.lilaSoft }}>
          <Fld l="Propiedad"><select value={v.pid} onChange={(e) => { const pid = e.target.value; setV({ ...v, pid, modo: pid === "__otra" ? (v.modo === "Otro agente" ? "Otro agente" : "La atiendo yo") : v.modo === "La atiendo yo" ? "Captador de la propiedad" : v.modo }); }} className="w-full rounded-xl px-3 py-2 text-sm" style={inp}><option value="">Elige una propiedad</option>{abiertas.map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}<option value="__otra">✏️ Otra propiedad (no está en Vortex)</option></select></Fld>
          {manual && <Fld l="Descripción o dirección de la propiedad"><textarea rows={2} value={v.ptxt} onChange={(e) => setV({ ...v, ptxt: e.target.value })} placeholder="Ej. Casa 3 dorm. en Av. América #123, zona Queru Queru" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
          <Fld l="Cliente"><select value={v.cid} onChange={(e) => setV({ ...v, cid: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp}><option value="">Elige un cliente</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.n}</option>)}<option value="__otro">➕ Otro cliente (no registrado)</option></select></Fld>
          {cOtro && <Fld l="Nombre del cliente"><input value={v.cotro} onChange={(e) => setV({ ...v, cotro: e.target.value })} placeholder="Escribe el nombre del cliente" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
          {(cOtro || (esPremium && cli)) && <Fld l={`WhatsApp del cliente${esPremium ? "" : " (opcional)"}`}><input value={v.tel || (cli && cli.tel) || ""} onChange={(e) => setV({ ...v, tel: e.target.value })} inputMode="tel" placeholder="Ej. 70012345" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
          <Fld l="Hora"><input type="time" value={v.h} onChange={(e) => setV({ ...v, h: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
          <Fld l="Agente que atiende la visita"><Seg o={[manual ? "La atiendo yo" : "Captador de la propiedad", "Otro agente"]} v={v.modo} set={(m) => setV({ ...v, modo: m })} /></Fld>
          {otro ? <Fld l="Nombre del agente"><input value={v.otro} onChange={(e) => setV({ ...v, otro: e.target.value })} placeholder="Escribe su nombre (puede no estar en la app)" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
            : prop ? <div className="text-xs" style={{ color: C.lilaDk }}>Agente: {prop.cap.n === ME ? "tú (captador)" : prop.cap.n + ", recibirá una notificación"}</div> : manual ? <div className="text-xs" style={{ color: C.lilaDk }}>Agente: tú</div> : null}
          {conAg && (!agTelAuto || otro) && <Fld l={`WhatsApp de ${agNombre || "el agente"}${esPremium ? "" : " (opcional)"}`}><input value={v.agTel || agTelAuto} onChange={(e) => setV({ ...v, agTel: e.target.value })} inputMode="tel" placeholder="Ej. 70012345" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
          {esPremium ? <div className="rounded-xl p-3 space-y-2.5" style={{ background: "#fff", border: "1.5px solid #25D366" }}>
            <div className="text-sm font-semibold" style={{ color: "#0F7A3D" }}>📲 Confirmación por WhatsApp</div>
            <div className="flex flex-wrap gap-2"><Chip on={v.waCli} onClick={() => setV({ ...v, waCli: !v.waCli })}>{v.waCli ? "✓ " : ""}Al cliente</Chip>{conAg && <Chip on={v.waAg} onClick={() => setV({ ...v, waAg: !v.waAg })}>{v.waAg ? "✓ " : ""}Al agente ({agNombre.split(" ")[0]})</Chip>}</div>
            {(v.waCli || (v.waAg && conAg)) && <>
              <Fld l="¿Cuándo enviar?"><Seg o={MOMENTOS_WA.map((m) => m[1])} v={MOMENTOS_WA.find((m) => m[0] === v.waCuando)[1]} set={(l) => setV({ ...v, waCuando: MOMENTOS_WA.find((m) => m[1] === l)[0] })} /></Fld>
              {v.waCli && <Fld l="Mensaje para el cliente"><textarea rows={4} value={txtCli} onChange={(e) => setV({ ...v, txtCli: e.target.value })} className="w-full rounded-xl px-3 py-2 text-xs" style={inp} /></Fld>}
              {v.waAg && conAg && <Fld l={`Mensaje para ${agNombre}`}><textarea rows={3} value={txtAg} onChange={(e) => setV({ ...v, txtAg: e.target.value })} className="w-full rounded-xl px-3 py-2 text-xs" style={inp} /></Fld>}
              {(v.txtCli !== null || v.txtAg !== null) && <button onClick={() => setV({ ...v, txtCli: null, txtAg: null })} className="text-xs underline" style={{ color: C.mute }}>Restaurar mensajes sugeridos</button>}
              <div className="text-xs" style={{ color: C.mute }}>A la hora elegida, el mensaje aparece arriba en Visitas y en Alertas, listo para enviarse con un toque desde tu WhatsApp.</div>
            </>}
          </div> : <div className="text-xs rounded-xl p-2.5" style={{ background: "#fff", color: C.mute }}>🔒 Programar confirmaciones por WhatsApp al cliente y al agente: disponible en el plan Premium.</div>}
          <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.lila }}>Agendar para el {sd} de {MESES[sm - 1].toLowerCase()}</button>
        </div>
      )}
      {delDia.map((x) => {
        const p = props.find((q) => q.id === x.p);
        return (
          <div key={x.id} className="rounded-2xl p-3 space-y-1.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between"><span className="font-semibold text-sm" style={{ color: C.ink }}>{x.h}</span><span className="text-xs px-2 py-0.5 rounded-md" style={{ background: col[x.est][1], color: col[x.est][0] }}>{x.est}</span></div>
            <div className="text-sm" style={{ color: C.ink }}>{p ? p.t : x.pTxt ? <>✏️ {x.pTxt}</> : "Propiedad"}</div>
            <div className="text-xs" style={{ color: C.mute }}>Cliente: {x.cl}{x.clTel ? ` (${x.clTel})` : ""} · Agente: {x.ag}</div>
            {x.wa && (x.de === ME || !x.de) && ["cli", "ag"].filter((k) => x.wa[k]).map((k) => <div key={k} className="flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1.5" style={{ background: "#E7F8EE", color: "#0F7A3D" }}><span>📲 {k === "cli" ? "Cliente" : x.ag.split(" ")[0]}: {x.wa[k].env ? "✓ mensaje enviado" : `programado · ${(MOMENTOS_WA.find((m) => m[0] === x.wa.cuando) || [0, ""])[1].toLowerCase()}`}</span><a href={waLink(x.wa[k].tel, x.wa[k].txt)} target="_blank" rel="noreferrer" onClick={() => marcarWa(x.id, k)} className="underline font-semibold shrink-0">{x.wa[k].env ? "Reenviar" : "Enviar ahora"}</a></div>)}
            {x.de && x.de !== ME ? <div className="text-xs" style={{ color: C.lilaDk }}>📥 Agendada por {x.de} directamente en tu calendario</div> : x.ag === ME ? null : reg(x.ag) ? <div className="text-xs" style={{ color: C.ok }}>✓ También agendada en el calendario de {x.ag}</div> : <div className="text-xs" style={{ color: C.amber }}>⚠️ {x.ag} no está en la app · <a href={waLink(x.agTel, `Hola ${x.ag}, te confirmo la visita del ${fechaL(isoD(x.f))} a las ${x.h} con mi cliente ${x.cl}${p ? " en " + p.t : ""}. — ${ME}`)} target="_blank" rel="noreferrer" className="underline">Avisar por WhatsApp</a></div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setVisitas(visitas.map((y) => (y.id === x.id ? { ...y, est: next[y.est] } : y)))} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }}>Pasar a {next[x.est]}</button>
              <button onClick={() => setVisitas(visitas.map((y) => (y.id === x.id ? { ...y, est: "Cancelada" } : y)))} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.red }}>Cancelar</button>
            </div>
            {perm.recordatorios && <div className="flex flex-wrap items-center gap-2 pt-1"><span className="text-xs" style={{ color: C.mute }}>🔔 Recordarme:</span>{RECS.map(([m, l]) => <Chip key={m} on={(x.rec || 0) === m} onClick={() => setVisitas(visitas.map((y) => (y.id === x.id ? { ...y, rec: m } : y)))}>{l}</Chip>)}<a href={x.clTel ? waLink(x.clTel, `Hola ${x.cl}, te recuerdo la visita del ${fechaL(isoD(x.f))} a las ${x.h}${p ? " a " + p.t : ""}.`) : `https://wa.me/?text=${encodeURIComponent(`Hola ${x.cl}, te recuerdo la visita del ${fechaL(isoD(x.f))} a las ${x.h}${p ? " a " + p.t : ""}.`)}`} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: C.brandDk }}>Recordar al cliente por WhatsApp</a></div>}
          </div>
        );
      })}
      {!delDia.length && !nuevo && <div className="text-center py-6 text-sm" style={{ color: C.mute }}>Sin visitas este día. Toca "Registrar visita" para agendar una.</div>}
    </div>
  );
}

function Alertas({ go, notifs, visitas, props, clientes, perm, autos, goSub }) {
  const ahora = new Date();
  const extra = [];
  if (perm.recordatorios) visitas.filter((v) => v.rec && !["Cancelada", "Realizada"].includes(v.est)).forEach((v) => { const dt = new Date(`${v.f}T${v.h}:00`); if (dt > ahora && dt - v.rec * 6e4 <= ahora) { const pp = props.find((q) => q.id === v.p); extra.push({ id: "r" + v.id, ic: "⏰", t: `Recordatorio: visita ${v.f} a las ${v.h}`, s: `${v.cl}${pp ? " · " + pp.t : v.pTxt ? " · " + v.pTxt : ""}`, to: { tab: "visitas" }, h: "Recordatorio de agenda" }); } });
  pendWa(visitas).forEach(({ x, k }) => extra.push({ id: `w${x.id}${k}`, ic: "📲", t: `Enviar confirmación por WhatsApp a ${k === "cli" ? x.cl : x.ag}`, s: `Visita ${fechaL(isoD(x.f))}, ${x.h} · toca para abrir Visitas y enviarlo`, to: { tab: "visitas" }, h: "Mensaje programado" }));
  if (perm.auto) {
    const act = props.filter((p) => p.cap.n === ME && ["Disponible", "Reservado"].includes(p.est || "Disponible"));
    if (autos.vig.on) act.filter((p) => p.dias >= autos.vig.n).forEach((p) => extra.push({ id: "a1" + p.id, ic: "🤖", t: "Captación sin confirmar", s: `${p.t} lleva ${p.dias} días sin confirmarse`, to: { tab: "perfil" }, h: "Automatización" }));
    if (autos.vis.on) act.filter((p) => (p.vistas || 0) < autos.vis.n).forEach((p) => extra.push({ id: "a2" + p.id, ic: "🤖", t: "Pocas visualizaciones", s: `${p.t} tiene ${p.vistas || 0} visualizaciones`, to: { tab: "perfil" }, h: "Automatización" }));
    if (autos.req.on) clientes.filter((c) => (HOY - isoD(c.mov || isoOf(HOY))) / 864e5 >= autos.req.n).forEach((c) => extra.push({ id: "a3" + c.id, ic: "🤖", t: "Requerimiento sin movimiento", s: `${c.n} no cambia de etapa hace ${Math.round((HOY - isoD(c.mov || isoOf(HOY))) / 864e5)} días`, to: { tab: "clientes" }, h: "Automatización" }));
  }
  return (
    <div className="p-4 space-y-2">
      <h2 className="font-semibold text-lg" style={{ color: C.ink }}>Notificaciones</h2>
      {[...extra, ...notifs].map((n) => { const bloq = n.pro && !perm.auto; return (
        <button key={n.id} onClick={() => (bloq ? goSub && goSub() : go(n.to))} className="w-full text-left rounded-2xl p-3 flex gap-3" style={{ background: C.card, border: `1px solid ${bloq ? C.lilaSoft : C.line}` }}>
          <span className="text-xl">{bloq ? "🔒" : n.ic}</span>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.ink }}>{bloq ? n.tPro || n.t : n.t}</div>
            {bloq ? <><div className="text-xs select-none" style={{ color: C.mute, filter: "blur(4px)" }}>{n.s}</div><div className="text-xs mt-1 font-semibold" style={{ color: C.lilaDk }}>Mejora a Premium para ver el detalle completo ›</div></>
              : <div className="text-xs" style={{ color: C.mute }}>{n.s}</div>}
            <div className="text-xs mt-1" style={{ color: C.mute }}>{n.h}</div></div>
        </button>); })}
    </div>
  );
}


function Cierre({ p, props, setProps, ops, setOps, reviews, setReviews, flash, onDone }) {
  const [f, setF] = useState({ monto: "", com: "", modo: "Agente de la red", ag: "", libre: "", tel: "", pt: 0, txt: "" });
  const [err, setErr] = useState("");
  const s = (k) => (v) => setF({ ...f, [k]: v });
  const num = (k) => (e) => s(k)(e.target.value.replace(/\D/g, ""));
  const libre = f.modo !== "Agente de la red";
  const colab = libre ? f.libre.trim() : f.ag;
  const com = +f.com || 0;
  const agentes = [...new Set(props.map((x) => x.cap.n))].filter((n) => n !== ME);
  const lbl = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];
  const save = () => {
    if (!f.monto || !f.com || !colab) { setErr("Indica el monto, la comisión y con quién se hizo el cierre."); return; }
    if (!f.pt) { setErr("Califica tu experiencia con el otro agente para terminar el cierre."); return; }
    setOps([{ id: Date.now(), de: ME, pid: p.id, t: p.t, op: p.op, monto: +f.monto, com, mon: p.mon, colab, reg: !libre, tel: f.tel, rol: "Captador", fecha: fechaL(HOY), iso: isoOf(HOY), pt: f.pt, txt: f.txt }, ...ops]);
    setReviews([{ id: Date.now() + 1, ag: colab, s: f.pt, de: ME }, ...reviews]);
    setProps(props.map((x) => (x.id === p.id ? { ...x, est: "Cerrado", opPend: false } : x)));
    flash("Captación cerrada y cierre registrado. La encuentras en Perfil → Cierres.");
    onDone(true);
  };
  return (
    <div className="p-4 space-y-4">
      <button onClick={onDone} className="text-sm" style={{ color: C.brandDk }}>‹ Volver a mi perfil</button>
      <div><h2 className="font-semibold text-lg" style={{ color: C.ink }}>Cerrar captación</h2><div className="text-sm" style={{ color: C.mute }}>{p.t} · {money(p)}</div></div>
      <div className="grid grid-cols-2 gap-3">
        <Fld l={`Monto del cierre (${p.mon})`}><input value={f.monto} onChange={num("monto")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l={`Comisión total (${p.mon})`}><input value={f.com} onChange={num("com")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      </div>
      <Fld l="¿Con quién se hizo el cierre?"><Seg o={["Agente de la red", "Agente no registrado"]} v={f.modo} set={s("modo")} /></Fld>
      {libre ? (
        <div className="space-y-3">
          <Fld l="Nombre del agente"><input value={f.libre} onChange={(e) => s("libre")(e.target.value)} placeholder="Escribe su nombre" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
          <Fld l="WhatsApp (opcional)"><input value={f.tel} onChange={(e) => s("tel")(e.target.value)} inputMode="tel" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
          <div className="text-xs" style={{ color: C.mute }}>Este agente no está en la app. Tu calificación se guarda y se asociará a su perfil si se registra.</div>
        </div>
      ) : (
        <Fld l="Agente"><select value={f.ag} onChange={(e) => s("ag")(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={inp}><option value="">Elige un agente</option>{agentes.map((n) => <option key={n} value={n}>{n}</option>)}</select></Fld>
      )}
      <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: C.lilaSoft, color: C.lilaDk }}>
        <div className="font-semibold">Reparto 50/50</div>
        <div>Tu parte: {fm(com / 2, p.mon)}</div>
        <div>{colab || "Otro agente"}: {fm(com / 2, p.mon)}</div>
      </div>
      <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold" style={{ color: C.ink }}>Califica tu experiencia con {colab || "el otro agente"}</div>
        <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => s("pt")(n)} className="text-3xl leading-none" style={{ color: C.lila }}>{n <= f.pt ? "★" : "☆"}</button>)}<span className="text-sm ml-2" style={{ color: C.mute }}>{lbl[f.pt]}</span></div>
        <textarea rows={2} value={f.txt} onChange={(e) => s("txt")(e.target.value)} placeholder="Comentario (opcional)" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
        <div className="text-xs" style={{ color: C.mute }}>Si hubo mal trabajo, además de calificar puedes reportarlo con pruebas desde Perfil → Cierres.</div>
      </div>
      {err && <div className="text-sm" style={{ color: C.red }}>{err}</div>}
      <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>Confirmar cierre</button>
    </div>
  );
}

const fm = (n, mon) => `${mon === "USD" ? "USD" : "Bs"} ${n.toLocaleString("es-BO")}`;
const MOTIVOS = ["Incumplimiento de acuerdos", "Información falsa", "Conducta poco profesional", "Problemas con colaboración", "No respetó la regla 50/50", "Otro"];
const SUG_CATS = ["Buscador", "Captaciones", "Visitas", "Requerimientos", "Cierres", "Reportes", "Otra"];
const SUG_EST = ["Nueva", "En análisis", "Planificada", "Implementada", "Descartada"];
const SUG_COL = { Nueva: [C.lilaDk, C.lilaSoft], "En análisis": [C.brandDk, C.brandSoft], Planificada: [C.amber, C.amberSoft], Implementada: [C.ok, C.okSoft], Descartada: [C.mute, C.line] };
const REP_COL = { Pendiente: [C.amber, C.amberSoft], "En revisión": [C.brandDk, C.brandSoft], Resuelto: [C.ok, C.okSoft], Descartado: [C.mute, C.lilaSoft] };

function Reportar({ p, onClose, onSend }) {
  const [m, setM] = useState("");
  const [d, setD] = useState("");
  const [fo, setFo] = useState([]);
  const [intento, setIntento] = useState(false);
  const faltan = d.trim().length < 20 ? 20 - d.trim().length : 0;
  const ok = m && !faltan;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: "rgba(30,27,58,.55)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-4 space-y-3 overflow-y-auto" style={{ background: C.card, maxHeight: "92%" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center sticky top-0 -mx-4 -mt-4 px-4 pt-4 pb-2" style={{ background: C.card }}><button onClick={onClose} className="text-sm" style={{ color: C.brandDk }}>‹ Volver</button><div className="font-semibold" style={{ color: C.ink }}>Reportar a {p.cap.n}</div><button onClick={onClose} className="text-xl leading-none" style={{ color: C.mute }}>✕</button></div>
        <div className="text-xs font-medium" style={{ color: C.mute }}>1. Elige el motivo</div>
        <Seg o={MOTIVOS} v={m} set={setM} />
        <div className="text-xs font-medium" style={{ color: C.mute }}>2. Cuenta qué pasó</div>
        <textarea rows={4} value={d} onChange={(e) => setD(e.target.value)} placeholder="Cuenta qué pasó, con fechas y datos concretos (mínimo 20 caracteres)" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
        {faltan > 0 && d.length > 0 && <div className="text-xs" style={{ color: C.mute }}>Faltan {faltan} caracteres.</div>}
        <label className="block w-full py-2.5 rounded-xl text-sm text-center cursor-pointer" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>📎 Subir pruebas (capturas de chat, fotos)<input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const u = await subirVarios(e.target.files); setFo((a) => [...a, ...u]); }} /></label>
        {fo.length > 0 && <div className="flex gap-2 overflow-x-auto">{fo.map((u, i) => <div key={u} className="relative shrink-0"><img src={u} alt="Prueba" className="rounded-lg object-cover" style={{ width: 64, height: 64 }} /><button onClick={() => setFo(fo.filter((_, j) => j !== i))} className="absolute top-0 right-0 text-xs px-1 rounded-bl-lg" style={{ background: `linear-gradient(135deg, ${C.lila}, ${C.brand})`, color: "#fff" }}>✕</button></div>)}</div>}
        <div className="text-xs" style={{ color: C.mute }}>Solo el equipo administrador ve este reporte ni sus pruebas. No se publica ni afecta el perfil del agente hasta que sea revisado y confirmado. Los reportes falsos pueden sancionarse.</div>
        {intento && !ok && <div className="text-xs rounded-lg px-3 py-2" style={{ background: C.redSoft, color: C.red }}>{!m ? "Elige el motivo del reporte." : `Describe lo que pasó (faltan ${faltan} caracteres).`}</div>}
        <button onClick={() => { setIntento(true); if (ok) onSend({ id: Date.now(), tipo: "Agente", ag: p.cap.n, m, det: d.trim(), de: ME, pruebas: fo, prio: false, est: "Pendiente" }); }} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: ok ? C.lila : C.mute }}>Enviar reporte</button>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.line}`, color: C.mute }}>Cancelar</button>
      </div>
    </div>
  );
}

function Extra({ onRepublicar, sub, ops, setOps, props, setProps, reports, flash, reviews, setReviews, onReport, pre, clearPre, sugs, setSugs, perm, goSub, nivel, setReports, cfg, clientes, visitas, favs, autos, setAutos, pagos }) {
  const [nuevo, setNuevo] = useState(false);
  const [o, setO] = useState({ pid: "", monto: "", com: "", colab: "" });
  const [d, setD] = useState(() => ({ tel: "", bio: "", ciu: [], ...(PERFIL.datos || {}) }));
  const [sg, setSg] = useState({ cat: "", txt: "" });
  const [rfOpen, setRfOpen] = useState(false);
  useEffect(() => { if (pre) { setNuevo(true); setO((x) => ({ ...x, pid: pre })); clearPre(); } }, [pre]);
  if (sub === "dash") return perm.stats ? <Dash ops={ops} /> : <Lock t="Estadísticas y rendimiento" plan="Premium" go={goSub} />;
  if (sub === "sug") {
    const mias = sugs.filter((x) => x.de === ME);
    const ok = sg.cat && sg.txt.trim().length >= 10;
    return (
      <div className="space-y-3">
        <div className="text-sm" style={{ color: C.ink }}>¿Qué mejorarías de Vortex? Tu sugerencia llega directo al equipo administrador.</div>
        <Fld l="Categoría"><Seg o={SUG_CATS} v={sg.cat} set={(c) => setSg({ ...sg, cat: c })} /></Fld>
        <Fld l="Tu sugerencia"><textarea rows={4} value={sg.txt} onChange={(e) => setSg({ ...sg, txt: e.target.value })} placeholder="Cuéntanos qué te gustaría que hiciera la app o qué te complica hoy (mínimo 10 caracteres)" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <button disabled={!ok} onClick={() => { setSugs([{ id: Date.now(), de: ME, cat: sg.cat, txt: sg.txt.trim(), est: "Nueva", f: fechaL(HOY) }, ...sugs]); setSg({ cat: "", txt: "" }); flash("Sugerencia enviada. ¡Gracias por ayudarnos a mejorar!"); }} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: ok ? C.grad : C.mute }}>Enviar sugerencia</button>
        {mias.length > 0 && <div className="text-sm font-semibold pt-1" style={{ color: C.ink }}>Mis sugerencias</div>}
        {mias.map((x) => (
          <div key={x.id} className="rounded-2xl p-3 space-y-1" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex justify-between items-center"><span className="text-xs" style={{ color: C.mute }}>{x.cat} · {x.f}</span><span className="text-xs px-2 py-0.5 rounded-md" style={{ background: SUG_COL[x.est][1], color: SUG_COL[x.est][0] }}>{x.est}</span></div>
            <div className="text-sm" style={{ color: C.ink }}>{x.txt}</div>
          </div>
        ))}
      </div>
    );
  }
  if (sub === "inf") return perm.informes ? <Informes props={props} clientes={clientes} ops={ops} visitas={visitas} favs={favs} /> : <Lock t="Informes avanzados" plan="Premium" go={goSub} />;
  if (sub === "auto") return perm.auto ? <Autos autos={autos} setAutos={setAutos} /> : <Lock t="Automatizaciones" plan="Premium" go={goSub} />;
  if (sub === "datos") return (
    <div className="space-y-4">
      <Fld l="Nombre"><input value={ME} readOnly className="w-full rounded-xl px-3 py-2 text-sm" style={{ ...inp, background: C.lilaSoft }} /></Fld>
      <Fld l="WhatsApp de contacto"><input value={d.tel} onChange={(e) => setD({ ...d, tel: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <Fld l="Ciudades donde trabajas"><div className="flex flex-wrap gap-2">{Object.keys(ZONAS).map((c) => <Chip key={c} on={d.ciu.includes(c)} onClick={() => setD({ ...d, ciu: d.ciu.includes(c) ? d.ciu.filter((x) => x !== c) : [...d.ciu, c] })}>{c}</Chip>)}</div></Fld>
      <Fld l="Presentación profesional"><textarea rows={3} value={d.bio} onChange={(e) => setD({ ...d, bio: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <button className="w-full py-3 rounded-xl text-sm" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>📷 Cambiar foto de perfil</button>
      <button onClick={() => { PERFIL.guardar(d); flash("Datos guardados."); }} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>Guardar cambios</button>
    </div>
  );
  if (sub === "rep") return (
    <div className="space-y-2">
      {perm.soporte && <div className="rounded-2xl p-3 space-y-1.5 text-white" style={{ background: "linear-gradient(135deg,#8B6FD6,#0B8794)" }}><div className="font-semibold">⭐ Soporte prioritario</div><div className="text-xs opacity-90">Tus consultas y reportes se marcan como prioritarios para el equipo.{cfg.slaPrio ? ` Respuesta objetivo: ${cfg.slaPrio} h.` : ""}</div>{cfg.waSoporte ? <button onClick={() => window.open(`https://wa.me/${cfg.waSoporte.replace(/\D/g, "")}`, "_blank")} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: "#fff", color: C.lilaDk }}>Chatear por WhatsApp</button> : <div className="text-xs opacity-90">El administrador aún no configuró el WhatsApp de soporte.</div>}</div>}
      {rfOpen ? <NuevoReporte perm={perm} props={props} pagos={pagos} ops={ops} visitas={visitas} nivel={nivel} onClose={() => setRfOpen(false)} onSend={(r) => { setReports([r, ...reports]); setRfOpen(false); flash(r.prio ? "Reporte enviado con prioridad." : "Reporte enviado. El equipo lo revisará."); }} /> : <button onClick={() => setRfOpen(true)} className="w-full py-2.5 rounded-xl font-semibold text-white" style={{ background: C.grad }}>+ Nuevo reporte o consulta</button>}
      <div className="text-xs" style={{ color: C.mute }}>Reportes que enviaste. Un administrador los revisa antes de tomar cualquier decisión.</div>
      {reports.filter((r) => r.de === ME).map((r) => <div key={r.id} className="rounded-2xl p-3 flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.line}` }}><div><div className="text-sm font-semibold" style={{ color: C.ink }}>{r.prio ? "⭐ " : ""}{r.ag || r.tipo}</div><div className="text-xs" style={{ color: C.mute }}>{r.m}{r.pruebas && r.pruebas.length ? ` · 📎 ${r.pruebas.length}` : ""}</div></div><span className="text-xs px-2 py-0.5 rounded-md" style={{ background: REP_COL[r.est][1], color: REP_COL[r.est][0] }}>{r.est}</span></div>)}
      {!reports.some((r) => r.de === ME) && <div className="text-center py-8 text-sm" style={{ color: C.mute }}>No has enviado reportes. Puedes reportar a un agente desde la ficha de una de sus propiedades.</div>}
    </div>
  );
  if (!perm.cierre) return <Lock t="Cierres y operaciones" plan="Inicial" go={goSub} />;
  const abiertas = props.filter((p) => !["Cerrado", "Caído"].includes(p.est || "Disponible") || p.opPend);
  const pend = props.filter((p) => p.cap.n === ME && p.est === "Cerrado" && p.opPend);
  const sel = abiertas.find((x) => String(x.id) === o.pid);
  const mia = sel && sel.cap.n === ME;
  const colab = mia ? o.colab : sel ? sel.cap.n : "";
  const com = +o.com || 0;
  const tot = ops.reduce((a, x) => ({ ...a, [x.mon]: (a[x.mon] || 0) + x.com / 2 }), {});
  const save = () => {
    if (!sel || !o.monto || !o.com || !colab) { flash("Completa propiedad, monto, comisión y agente."); return; }
    setOps([{ id: Date.now(), de: ME, pid: sel.id, t: sel.t, op: sel.op, monto: +o.monto, com, mon: sel.mon, colab, rol: mia ? "Captador" : "Con cliente", fecha: fechaL(HOY), iso: isoOf(HOY) }, ...ops]);
    if (mia) setProps(props.map((p) => (p.id === sel.id ? { ...p, est: "Cerrado", opPend: false } : p)));
    flash(mia ? "Cierre registrado. La propiedad pasó a Cerrado." : "Cierre registrado. Se avisará al captador.");
    setO({ pid: "", monto: "", com: "", colab: "" }); setNuevo(false);
  };
  if (nuevo) return (
    <div className="space-y-4">
      <Fld l="Propiedad"><select value={o.pid} onChange={(e) => setO({ ...o, pid: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp}><option value="">Elige una propiedad</option>{abiertas.map((p) => <option key={p.id} value={p.id}>{p.t}</option>)}</select></Fld>
      {sel && <>
        <Fld l={`Monto del cierre (${sel.mon})`}><input value={o.monto} onChange={(e) => setO({ ...o, monto: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l={`Comisión total cobrada (${sel.mon})`}><input value={o.com} onChange={(e) => setO({ ...o, com: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        {mia ? <Fld l="¿Con quién se hizo el cierre? (agente que trajo al cliente)"><input list="agentes" value={o.colab} onChange={(e) => setO({ ...o, colab: e.target.value })} placeholder="Elige de la lista o escribe su nombre" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /><datalist id="agentes">{[...new Set(props.map((x) => x.cap.n))].filter((n) => n !== ME).map((n) => <option key={n} value={n} />)}</datalist></Fld>
          : <div className="text-sm" style={{ color: C.ink }}>Captador: <b>{sel.cap.n}</b>. Cierre hecho con {sel.cap.n}; tú participas como agente con el cliente.</div>}
        <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: C.lilaSoft, color: C.lilaDk }}>
          <div className="font-semibold">Reparto 50/50</div>
          <div>Tu parte: {fm(com / 2, sel.mon)}</div>
          <div>{colab || "Colaborador"}: {fm(com / 2, sel.mon)}</div>
        </div>
      </>}
      <div className="flex gap-2"><button onClick={() => setNuevo(false)} className="flex-1 py-3 rounded-xl" style={{ border: `1px solid ${C.line}`, color: C.ink }}>Cancelar</button><button onClick={save} className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>Registrar cierre</button></div>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="rounded-2xl p-3" style={{ background: C.lilaSoft, display: perm.hist ? undefined : "none" }}>
        <div className="text-xs" style={{ color: C.mute }}>Tu parte acumulada (50% de cada comisión)</div>
        <div style={{ ...serif, color: C.lilaDk, fontSize: 22, fontWeight: 700 }}>{Object.keys(tot).length ? Object.entries(tot).map(([m, v]) => fm(v, m)).join(" · ") : "Sin cierres"}</div>
      </div>
      <button onClick={() => setNuevo(true)} className="w-full py-2.5 rounded-xl font-semibold text-white" style={{ background: C.grad }}>+ Registrar cierre</button>
      {!perm.hist && <div className="text-xs rounded-xl p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>🔒 El historial de cierres y tu parte acumulada están disponibles desde el plan Profesional.</div>}
      {(() => { const cerradas = props.filter((p) => p.cap.n === ME && p.est === "Cerrado" && !p.opPend); return cerradas.length > 0 && <>
        <div className="text-sm font-semibold pt-1" style={{ color: C.ink }}>Mis captaciones cerradas ({cerradas.length})</div>
        {cerradas.map((p) => <div key={p.id} className="rounded-2xl p-3 flex gap-3 items-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {p.fotos && p.fotos[0] ? <img src={p.fotos[0]} alt={p.t} className="rounded-xl object-cover shrink-0" style={{ width: 60, height: 60 }} /> : <div className="shrink-0 rounded-xl" style={{ width: 60, height: 60, background: `hsl(${p.hue || 260} 45% 90%)` }} />}
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.ink }}>{p.t}</div><div className="text-xs" style={{ color: C.mute }}>{p.op} · {money(p)} · {p.zona}</div>
            <button onClick={() => onRepublicar && onRepublicar(p)} className="mt-1 text-xs font-semibold underline" style={{ color: C.lilaDk }}>✏️ Editar y volver a publicar</button></div>
        </div>)}
      </>; })()}
      {pend.map((p) => <div key={p.id} className="rounded-xl p-3 text-sm flex items-center justify-between gap-2" style={{ background: C.amberSoft, color: C.amber }}><span>Cerrada sin registrar: {p.t}</span><button onClick={() => { setO({ pid: String(p.id), monto: "", com: "", colab: "" }); setNuevo(true); }} className="px-3 py-1 rounded-lg text-white shrink-0" style={{ background: C.amber }}>Registrar</button></div>)}
      {(perm.hist ? ops : []).map((x) => (
        <div key={x.id} className="rounded-2xl p-3 space-y-1" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex justify-between gap-2"><span className="text-sm font-semibold" style={{ color: C.ink }}>{x.t}</span><span className="text-xs" style={{ color: C.mute }}>{x.fecha}</span></div>
          <div className="text-xs" style={{ color: C.mute }}>{x.op} · {fm(x.monto, x.mon)} · Comisión {fm(x.com, x.mon)}</div>
          <div className="text-xs" style={{ color: C.ink }}>Tú ({x.rol}) {fm(x.com / 2, x.mon)} · {x.colab}{x.reg === false ? " (fuera de la app)" : ""} {fm(x.com / 2, x.mon)}</div>
          <div className="flex items-center justify-between pt-1">
            {x.pt ? <span className="text-xs" style={{ color: C.ok }}>Puntuaste a {x.colab}: {"★".repeat(x.pt)}</span> : <div className="flex items-center gap-1"><span className="text-xs" style={{ color: C.mute }}>Puntuar a {x.colab.split(" ")[0]}:</span>{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => { setReviews([{ id: Date.now(), ag: x.colab, s: n, de: ME }, ...reviews]); setOps(ops.map((o2) => (o2.id === x.id ? { ...o2, pt: n } : o2))); flash("Puntuación enviada."); }} className="text-lg leading-none" style={{ color: C.lila }}>☆</button>)}</div>}
            <button onClick={() => onReport({ cap: { n: x.colab } })} className="text-xs underline" style={{ color: C.mute }}>Reportar trabajo</button>
          </div>
        </div>
      ))}
    </div>
  );
}

let ME = "";
// Lo fija App.jsx con el nombre del usuario que inició sesión.
export const fijarUsuario = (nombre) => { ME = nombre; };
// Datos del perfil propio (teléfono, bio, ciudades). Vortex los actualiza en cada render.
const PERFIL = { datos: null, guardar: () => {} };
const miTel = () => (PERFIL.datos && PERFIL.datos.tel) || "";
const ZONAS = { Cochabamba: ["Norte", "Sur", "Centro", "Cala Cala"], "La Paz": ["Sopocachi", "Calacoto", "San Miguel", "Miraflores"], "Santa Cruz": ["Equipetrol", "Urubó", "Las Palmas", "Centro"] };
const ESTADOS = ["Disponible", "Reservado", "En pausa", "Cerrado", "Caído"];
const EMO = { Disponible: "🟢", Reservado: "🟡", "En pausa": "⏸️", Cerrado: "🔴", Caído: "⚫" };
const inp = { border: `1px solid ${C.line}`, background: C.card, color: C.ink };
const Seg = ({ o, v, set }) => <div className="flex flex-wrap gap-2">{o.map((x) => <Chip key={x} on={v === x} onClick={() => set(x)}>{x}</Chip>)}</div>;
const Fld = ({ l, children }) => <div className="space-y-1.5"><div className="text-xs font-medium" style={{ color: C.mute }}>{l}</div>{children}</div>;

const TIPOS_INM = ["Casa", "Departamento", "Terreno", "Oficina", "Comercial"];
const toF = (p) => ({ op: p.op, tipo: TIPOS_INM.includes(p.tipo) ? p.tipo : "Otro", tipoOtro: TIPOS_INM.includes(p.tipo) || p.tipo === "Otro" ? "" : p.tipo, ciudad: p.ciudad, zona: p.zona, t: p.t, precio: String(p.precio), mon: p.mon, dorm: String(p.dorm), ban: String(p.ban), m2: String(p.m2), garaje: p.garaje ? "Sí" : "No", gTipo: p.gTipo || "Independiente", gAparte: p.gAparte ? "Sí" : "No", gPrecio: p.gPrecio || "", mascotas: p.mascotas, mascCond: p.mascCond || "", amoblado: p.amoblado, com: p.com, condComp: p.condComp || "", desc: p.desc || "", fotos: p.fotos || [] });

function Form({ onSave, init, maxFotos = 3 }) {
  const [f, setF] = useState(init ? toF(init) : { op: "Alquiler", tipo: "Departamento", tipoOtro: "", ciudad: "La Paz", zona: "", t: "", precio: "", mon: "USD", dorm: "2", ban: "1", m2: "", garaje: "No", gTipo: "Independiente", gAparte: "No", gPrecio: "", mascotas: "No", mascCond: "", amoblado: "Vacío", com: "", condComp: "", desc: "", fotos: [] });
  const [err, setErr] = useState("");
  const s = (k) => (v) => setF({ ...f, [k]: v });
  const num = (k) => (e) => s(k)(e.target.value.replace(/\D/g, ""));
  const vivienda = ["Casa", "Departamento"].includes(f.tipo);
  const save = () => {
    if (!f.t || !f.zona || !f.precio || !f.m2) { setErr("Completa título, zona, precio y superficie."); return; }
    if (f.tipo === "Otro" && !f.tipoOtro.trim()) { setErr("Escribe qué tipo de inmueble es (por ejemplo: Galpón, Quinta, Habitación)."); return; }
    const tipoFinal = f.tipo === "Otro" ? f.tipoOtro.trim().charAt(0).toUpperCase() + f.tipoOtro.trim().slice(1) : f.tipo;
    const b = ({ id: Date.now(), op: f.op, tipo: tipoFinal, t: f.t, ciudad: f.ciudad, zona: f.zona, precio: +f.precio, mon: f.mon, dorm: vivienda ? +f.dorm : 0, ban: vivienda ? +f.ban : 0, m2: +f.m2, garaje: f.garaje === "Sí", gTipo: f.garaje === "Sí" ? f.gTipo : "", gAparte: f.gAparte === "Sí", gPrecio: f.gAparte === "Sí" ? f.gPrecio : "", mascotas: f.mascotas, mascCond: f.mascotas === "Condicionado" ? f.mascCond : "", condComp: f.condComp, desc: f.desc, amoblado: f.amoblado, dias: 0, est: "Disponible", cap: { n: ME, tel: miTel(), ciu: f.ciudad }, com: f.com || "A definir con el captador", hue: Math.floor(Math.random() * 360), fotos: f.fotos });
    onSave(init ? { ...init, ...b, id: init.id, dias: init.dias, est: init.est, hue: init.hue, cap: init.cap } : b);
  };
  return (
    <div className="space-y-4">
      <Fld l="Título del inmueble"><input value={f.t} onChange={(e) => s("t")(e.target.value)} placeholder="Ej. Depto con vista al parque, 2 dormitorios" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <Fld l="Operación"><Seg o={["Venta", "Alquiler", "Anticrético", "Preventa"]} v={f.op} set={s("op")} /></Fld>
      <Fld l="Tipo de inmueble"><Seg o={[...TIPOS_INM, "Otro"]} v={f.tipo} set={s("tipo")} /></Fld>
      {f.tipo === "Otro" && <Fld l="¿Qué tipo de inmueble es?"><input value={f.tipoOtro} onChange={(e) => s("tipoOtro")(e.target.value)} maxLength={30} placeholder="Ej. Galpón, Quinta, Habitación, Edificio" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} autoFocus /></Fld>}
      <Fld l="Ciudad"><Seg o={Object.keys(ZONAS)} v={f.ciudad} set={(v) => setF({ ...f, ciudad: v, zona: "" })} /></Fld>
      <Fld l="Zona o barrio"><input list="zonas" value={f.zona} onChange={(e) => s("zona")(e.target.value)} placeholder="Escribe la zona exacta" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /><datalist id="zonas">{ZONAS[f.ciudad].map((z) => <option key={z} value={z} />)}</datalist></Fld>
      <div className="grid grid-cols-2 gap-3">
        <Fld l="Precio"><input value={f.precio} onChange={num("precio")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l="Moneda"><Seg o={["USD", "BOB"]} v={f.mon} set={s("mon")} /></Fld>
        {vivienda && <Fld l="Dormitorios"><input value={f.dorm} onChange={num("dorm")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
        {vivienda && <Fld l="Baños"><input value={f.ban} onChange={num("ban")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
        <Fld l="Superficie (m²)"><input value={f.m2} onChange={num("m2")} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      </div>
      <Fld l="¿El inmueble incluye garaje?"><Seg o={["Sí", "No"]} v={f.garaje} set={s("garaje")} /></Fld>
      {f.garaje === "Sí" && <Fld l="Tipo de garaje"><Seg o={["Independiente", "Compartido"]} v={f.gTipo} set={s("gTipo")} /></Fld>}
      <Fld l="¿Hay garaje para alquilar aparte en el edificio?"><Seg o={["No", "Sí"]} v={f.gAparte} set={s("gAparte")} /></Fld>
      {f.gAparte === "Sí" && <Fld l={`Precio extra por mes (${f.mon})`}><input value={f.gPrecio} onChange={num("gPrecio")} inputMode="numeric" placeholder="Ej. 50" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
      <Fld l="Mascotas"><Seg o={["Sí", "No", "Condicionado"]} v={f.mascotas} set={s("mascotas")} /></Fld>
      {f.mascotas === "Condicionado" && <Fld l="Condición para mascotas"><input value={f.mascCond} onChange={(e) => s("mascCond")(e.target.value)} placeholder="Ej. Solo perros pequeños, con depósito" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>}
      <Fld l="Estado del inmueble"><Seg o={["Vacío", "Semi-amoblado", "Amoblado"]} v={f.amoblado} set={s("amoblado")} /></Fld>
      <Fld l="Comisión del propietario"><input value={f.com} onChange={(e) => s("com")(e.target.value)} placeholder="Ej. 3% pagado por el propietario" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <Fld l="Condiciones complementarias"><textarea rows={3} value={f.condComp} onChange={(e) => s("condComp")(e.target.value)} placeholder="Garantía, papeles requeridos, tiempo mínimo de contrato…" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <Fld l="Descripción completa (copy)"><textarea rows={6} value={f.desc} onChange={(e) => s("desc")(e.target.value)} placeholder="Pega aquí el texto completo del anuncio" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <div className="text-xs rounded-xl p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>Toda colaboración con otro agente se divide 50/50. No necesitas indicarlo aquí.</div>
      <div className="space-y-2"><label className="block w-full py-3 rounded-xl text-sm text-center cursor-pointer" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>{f.fotos.length >= maxFotos ? `✓ ${f.fotos.length} de ${maxFotos} fotos (máximo de tu plan)` : `📷 Agregar fotografías (${f.fotos.length} de ${maxFotos})`}<input type="file" accept="image/*" multiple className="hidden" disabled={f.fotos.length >= maxFotos} onChange={async (e) => { const libres = maxFotos - f.fotos.length; const sel = Array.from(e.target.files || []); if (sel.length > libres) setErr(`Tu plan permite hasta ${maxFotos} fotos por captación. Se agregarán solo ${Math.max(0, libres)}.`); else setErr(""); e.target.value = ""; const u = await subirVarios(sel.slice(0, Math.max(0, libres))); setF((x) => ({ ...x, fotos: [...x.fotos, ...u].slice(0, Math.max(maxFotos, x.fotos.length)) })); }} /></label>{f.fotos.length > 0 && <div className="flex gap-2 overflow-x-auto">{f.fotos.map((u, i) => <div key={u} className="relative shrink-0"><img src={u} alt="" className="rounded-lg object-cover" style={{ width: 72, height: 72 }} /><button onClick={() => s("fotos")(f.fotos.filter((_, j) => j !== i))} className="absolute top-0 right-0 text-xs px-1 rounded-bl-lg" style={{ background: C.ink, color: "#fff" }}>✕</button></div>)}</div>}</div>
      {err && <div className="text-sm" style={{ color: C.red }}>{err}</div>}
      <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>{init ? "Guardar cambios" : "Publicar captación"}</button>
    </div>
  );
}

function Perfil({ acceso, props, setProps, flash, ops, setOps, reports, favs, reviews, setReviews, onReport, sugs, setSugs, users, setUsers, pagos, setPagos, cfg, subInit, clearSub, perm, nivel, goSub, onPublicada, trial, setReports, clientes, visitas, autos, setAutos }) {
  const [nueva, setNueva] = useState(false); // false | true | captación a editar
  const [sub, setSub] = useState("capt");
  const [pre, setPre] = useState(null);
  const [cerrando, setCerrando] = useState(null);
  useEffect(() => { if (subInit) { setSub(subInit); clearSub(); } }, [subInit]);
  const mine = props.filter((p) => p.cap.n === ME);
  const enLista = mine.filter((p) => p.est !== "Cerrado");
  const upd = (id, patch) => setProps(props.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const vencido = false;
  const activas = mine.filter((p) => ["Disponible", "Reservado"].includes(p.est || "Disponible")).length;
  const ult24 = mine.filter((p) => p.creada && Date.now() - p.creada < 864e5);
  const bloq = nivel === "gratuito" ? ult24.length > 0 : perm.maxCapt ? activas >= perm.maxCapt : false;
  if (nueva) return (
    <div className="p-4 space-y-3">
      <button onClick={() => setNueva(false)} className="text-sm" style={{ color: C.brandDk }}>‹ Volver a mi perfil</button>
      <h2 className="font-semibold text-lg" style={{ color: C.ink }}>{nueva === true ? "Nueva captación" : nueva._repub ? "Volver a publicar captación" : "Editar captación"}</h2>
      {nueva !== true && nueva._repub && <div className="text-xs rounded-xl p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>Revisa y actualiza los datos. Al guardar, la captación vuelve a estar Disponible en el buscador.</div>}
      <Form maxFotos={perm.maxFotos || 3} init={nueva === true ? null : nueva} onSave={(p) => { if (nueva === true) { if (bloq) { flash("Alcanzaste el límite de captaciones de tu plan."); return; } const np = { ...p, creada: Date.now() }; setProps([np, ...props]); onPublicada(np); flash("Captación publicada. Confírmala cada cierto tiempo para mantenerla visible."); } else if (nueva._repub) { if (bloq) { flash("Alcanzaste el límite de captaciones activas de tu plan."); return; } const { _repub, ...limpio } = p; setProps(props.map((x) => (x.id === p.id ? { ...limpio, est: "Disponible", opPend: false, dias: 0, creada: Date.now() } : x))); flash("Captación publicada de nuevo. Ya aparece en el buscador."); setSub("capt"); } else { setProps(props.map((x) => (x.id === p.id ? p : x))); flash("Cambios guardados."); } setNueva(false); }} />
    </div>
  );
  if (cerrando) return <Cierre p={cerrando} props={props} setProps={setProps} ops={ops} setOps={setOps} reviews={reviews} setReviews={setReviews} flash={flash} onDone={(hecho) => { setCerrando(null); if (hecho === true) setSub("ops"); }} />;
  const estado = { prueba: ["En prueba", C.brandSoft, C.brandDk], suscrito: ["Suscripción activa", C.okSoft, C.ok], vencido: ["Suscripción vencida", C.amberSoft, C.amber] }[acceso];
  return (
    <div className="p-4 space-y-3">
      <div className="rounded-2xl p-4 flex gap-3 items-center" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-white" style={{ background: C.lila }}>{ME.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("") || "?"}</div>
        <div className="flex-1">
          <div className="font-semibold text-lg leading-tight" style={{ color: C.ink }}>{ME}</div>
          <div className="text-xs" style={{ color: C.mute }}>Agente inmobiliario independiente{PERFIL.datos && PERFIL.datos.ciu && PERFIL.datos.ciu.length ? " · " + PERFIL.datos.ciu.join(", ") : ""}</div>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: estado[1], color: estado[2] }}>{estado[0]}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Captaciones", enLista.length], ["Cierres", ops.filter((o) => !o.de || o.de === ME).length], ["Vigencia", enLista.length ? Math.round((100 * enLista.filter((p) => vigencia(p).n === 0).length) / enLista.length) + "%" : "—"]].map(([a, b]) => (
          <div key={a} className="rounded-xl py-2" style={{ background: C.lilaSoft }}><div className="font-semibold" style={{ ...serif, color: C.lilaDk, fontSize: 20 }}>{b}</div><div className="text-xs" style={{ color: C.mute }}>{a}</div></div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto">{[["capt", "Captaciones"], ["sus", "Suscripción"], ["dash", "Dashboard"], ["inf", "Informes"], ["auto", "Automatiz."], ["ops", "Cierres"], ["rep", "Reportes"], ["sug", "Sugerencias"], ["datos", "Mis datos"]].map(([k, l]) => <Chip key={k} on={sub === k} onClick={() => setSub(k)}>{l}</Chip>)}</div>
      {sub === "sus" && <Sus acceso={acceso} users={users} setUsers={setUsers} pagos={pagos} setPagos={setPagos} cfg={cfg} flash={flash} nivel={nivel} trial={trial} />}
      {sub !== "capt" && sub !== "sus" && <Extra onRepublicar={(p) => setNueva({ ...p, _repub: true })} sub={sub} ops={ops} setOps={setOps} props={props} setProps={setProps} reports={reports} flash={flash} reviews={reviews} setReviews={setReviews} onReport={onReport} pre={pre} clearPre={() => setPre(null)} sugs={sugs} setSugs={setSugs} perm={perm} goSub={goSub} nivel={nivel} setReports={setReports} cfg={cfg} clientes={clientes} visitas={visitas} favs={favs} autos={autos} setAutos={setAutos} pagos={pagos} />}
      {sub === "capt" && <>
      <div className="flex items-center justify-between pt-1">
        <h2 className="font-semibold" style={{ color: C.ink }}>Mis captaciones</h2>
        <button disabled={bloq} onClick={() => setNueva(true)} className="text-sm px-3 py-1.5 rounded-full text-white" style={{ background: bloq ? C.mute : C.grad }}>+ Nueva captación</button>
      </div>
      <div className="text-xs rounded-xl p-2.5" style={{ background: bloq ? C.amberSoft : C.lilaSoft, color: bloq ? C.amber : C.lilaDk }}>{nivel === "gratuito" ? (ult24.length ? `Plan Gratuito: 1 captación cada 24 horas. Podrás publicar de nuevo a las ${new Date(ult24[0].creada + 864e5).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}.` : "Plan Gratuito: puedes publicar 1 captación cada 24 horas.") : perm.maxCapt ? `Captaciones activas: ${activas} de ${perm.maxCapt} (plan ${nivel}).${bloq ? " Alcanzaste el límite: cierra, pausa o mejora tu plan." : ""}` : "Prueba gratuita: acceso completo. El límite de captaciones durante la prueba está por definir."}</div>
      {enLista.map((p) => {
        const v = vigencia(p), est = p.est || "Disponible";
        return (
          <div key={p.id} className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex gap-3">
              {p.fotos && p.fotos[0] ? <img src={p.fotos[0]} alt={p.t} className="rounded-xl object-cover shrink-0" style={{ width: 76, height: 76 }} /> : <div className="shrink-0 rounded-xl flex items-center justify-center text-xs text-center" style={{ width: 76, height: 76, background: `hsl(${p.hue || 260} 45% 90%)`, color: C.mute }}>Sin foto</div>}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between gap-2"><div className="font-semibold text-sm" style={{ color: C.ink }}>{p.t} <button disabled={vencido} onClick={() => setNueva(p)} className="text-xs underline" style={{ color: C.brandDk }}>Editar</button></div><span style={{ ...serif, color: C.ink, fontWeight: 700 }}>{money(p)}</span></div>
                <div className="text-xs" style={{ color: C.mute }}>{p.op} · {p.tipo} · {p.zona}, {p.ciudad}{p.fotos && p.fotos.length > 1 ? ` · 📷 ${p.fotos.length}` : ""}</div>
                <div className="flex items-center gap-2 flex-wrap"><Badge v={v} />{v.n > 0 && !vencido && <button onClick={() => { upd(p.id, { dias: 0 }); flash("Disponibilidad confirmada."); }} className="text-xs underline font-semibold" style={{ color: C.lilaDk }}>✓ Confirmar que sigue disponible</button>}</div>
              </div>
            </div>
            {perm.stats && <div className="flex gap-3 text-xs" style={{ color: C.lilaDk }}><span>👁 {p.vistas || 0} visualizaciones</span><span>♥ {(p.guardados || 0) + favs.filter((f) => f.pid === p.id).length} guardaron</span></div>}
            <div className="flex gap-2">
              <select disabled={vencido} value={est} onChange={(e) => { const nv = e.target.value; if (nv === "Cerrado") { upd(p.id, { est: "Cerrado", opPend: true }); setPre(String(p.id)); setSub("ops"); flash("Ya no aparece en el buscador. Registra el cierre para completarlo oficialmente."); } else if (["Disponible", "Reservado"].includes(nv) && !["Disponible", "Reservado"].includes(est) && perm.maxCapt && activas >= perm.maxCapt) flash(`Tu plan ${nivel} permite ${perm.maxCapt} captaciones activas.`); else upd(p.id, { est: nv, opPend: false }); }} className="flex-1 rounded-lg px-2 py-1.5 text-sm" style={inp}>{ESTADOS.filter((e) => e !== "Cerrado" || est === "Cerrado").map((e) => <option key={e} value={e}>{EMO[e]} {e}</option>)}</select>
              <button onClick={async () => { const ok = await copiarTexto(textoCopy(p, miTel())); flash(ok ? (waNum(miTel()).length < 8 ? "Copy copiado. Tip: agrega tu WhatsApp en Mis datos para incluir tu enlace." : "Copy copiado con tu enlace de WhatsApp. Pégalo en el chat de tu cliente.") : "No se pudo copiar automáticamente."); }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white" style={{ background: C.lila }}>📋 Copiar copy</button>
            </div>
            {est !== "Cerrado" && <button disabled={!perm.cierre} onClick={() => setCerrando(p)} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ border: `1.5px solid ${!perm.cierre ? C.mute : C.ink}`, color: !perm.cierre ? C.mute : C.ink }}>{!perm.cierre ? "🔒 " : ""}✔ Cerrar captación</button>}
            {est === "Cerrado" ? (p.opPend ? <div className="text-xs" style={{ color: C.amber }}>Ya no aparece en el buscador. Falta registrar el cierre para completarlo oficialmente (pestaña Cierres).</div> : <div className="text-xs" style={{ color: C.mute }}>Cerrada. No aparece en el buscador.</div>) : est !== "Disponible" && <div className="text-xs" style={{ color: C.mute }}>Los demás agentes ven que está {est.toLowerCase()}.</div>}
          </div>
        );
      })}
      {mine.length > enLista.length && <button onClick={() => setSub("ops")} className="w-full text-xs underline" style={{ color: C.mute }}>Ver mis {mine.length - enLista.length} captaciones cerradas en Cierres ›</button>}
      {!mine.length && <div className="text-center py-8 text-sm" style={{ color: C.mute }}>Aún no tienes captaciones. Registra la primera para que otros agentes la encuentren.</div>}
      </>}
    </div>
  );
}

function Admin({ reports, setReports, users, setUsers, audit, setAudit, props, ops, sugs, setSugs, pagos, setPagos, cfg, setCfg, flash, cuentas }) {
  const [s, setS] = useState("pag");
  const [rej, setRej] = useState(null);
  const [mot, setMot] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [verPago, setVerPago] = useState(null);
  const [buscaPago, setBuscaPago] = useState("");
  const [cuantosPagos, setCuantosPagos] = useState(15);
  const [cfm, setCfm] = useState(false);
  const [fc, setFc] = useState("Todas");
  const log = (m) => setAudit((a) => [{ id: Math.random(), m, f: fechaL(new Date()) }, ...a]);
  const setRep = (r, est, ant) => {
    setReports(reports.map((x) => (x.id === r.id ? { ...x, est } : x)));
    log(`Reporte de ${r.de} (${r.tipo || "Agente"}${r.ag ? " contra " + r.ag : ""}): ${est}`);
    if (ant) { setUsers(users.map((u) => (u.n === r.ag ? { ...u, ant: u.ant + 1 } : u))); log(`Antecedente confirmado para ${r.ag}`); }
  };
  const setU = (n, patch, txt) => { setUsers(users.map((u) => (u.n === n ? { ...u, ...patch } : u))); log(`${n}: ${txt}`); };
  const pend = reports.filter((r) => r.est === "Pendiente" || r.est === "En revisión").length;
  const nuevas = sugs.filter((x) => x.est === "Nueva").length;
  const pPend = pagos.filter((p) => p.est === "Pendiente");
  const aprobar = (p) => {
    const u = users.find((x) => x.n === p.de);
    const base = p.tipo === "Renovación" && u && u.venc ? isoD(u.venc) : null;
    const fin = p.tipo === "Mejora de plan" && u && u.venc ? isoD(u.venc) : base ? new Date(base.getFullYear(), base.getMonth() + 1, cfg.dia) : proximoCorte(cfg.dia);
    setUsers(users.map((x) => (x.n === p.de ? { ...x, est: "Activo", plan: p.plan, venc: isoOf(fin), planProx: null } : x)));
    setPagos(pagos.map((x) => (x.id === p.id ? { ...x, est: "Aprobado", revF: isoOf(HOY), hasta: isoOf(fin) } : x)));
    log(`Pago aprobado: ${p.de} · ${p.plan} · ${bs(p.monto)}. Habilitado hasta ${fechaL(fin)}`);
    flash(`Aprobado. ${p.de} habilitado hasta el ${fechaL(fin)}.`);
  };
  const rechazar = (p) => {
    setPagos(pagos.map((x) => (x.id === p.id ? { ...x, est: "Rechazado", mot: mot || "sin motivo indicado", revF: isoOf(HOY) } : x)));
    log(`Pago rechazado: ${p.de} · ${bs(p.monto)} (${mot || "sin motivo"})`);
    setRej(null); setMot(""); flash("Pago rechazado. Se notificó al agente.");
  };
  const renombrar = (i, nuevo) => { const viejo = cfg.planes[i].nombre; setCfg({ ...cfg, planes: cfg.planes.map((q, j) => (j === i ? { ...q, nombre: nuevo } : q)) }); setUsers(users.map((u) => (u.plan === viejo ? { ...u, plan: nuevo } : u))); setPagos(pagos.map((p) => (p.plan === viejo ? { ...p, plan: nuevo } : p))); };
  const activos = users.filter((u) => u.est === "Activo");
  const planes = cfg.planes.map((pl) => ({ p: pl.nombre, n: activos.filter((u) => u.plan === pl.nombre).length }));
  const mrr = planes.reduce((a, x) => a + x.n * precioDe(cfg, x.p), 0);
  const apr = pagos.filter((p) => p.est === "Aprobado");
  const mesKey = isoOf(HOY).slice(0, 7);
  const cobrado = apr.filter((p) => p.iso.startsWith(mesKey)).reduce((a, p) => a + p.monto, 0);
  const meses = [-5, -4, -3, -2, -1, 0].map((k) => { const d = new Date(HOY.getFullYear(), HOY.getMonth() + k, 1); const key = isoOf(d).slice(0, 7); return { l: MES[d.getMonth()], v: apr.filter((p) => p.iso.startsWith(key)).reduce((a, p) => a + p.monto, 0) }; });
  const mmax = Math.max(1, ...meses.map((m) => m.v));
  const corte = proximoCorte(cfg.dia), corteI = isoOf(corte);
  const porRenovar = activos.filter((u) => u.venc && u.venc <= corteI);
  const esperado = porRenovar.reduce((a, u) => a + precioDe(cfg, u.plan), 0);
  const ejecutarCorte = () => { setUsers(users.map((u) => (u.est === "Activo" && u.venc && u.venc <= corteI ? { ...u, est: "Vencido" } : u))); log(`Corte del ${fechaL(corte)} ejecutado: ${porRenovar.length} cuenta(s) pasaron a Vencido`); setCfm(false); flash(`Corte ejecutado: ${porRenovar.length} cuenta(s) vencidas.`); };
  const act = props.filter((p) => ["Disponible", "Reservado"].includes(p.est || "Disponible"));
  return (
    <div className="p-4 space-y-3">
      <style>{`@keyframes vp{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}.vpulse{animation:vp 1.6s infinite}`}</style>
      {pPend.length > 0 ? <button onClick={() => setS("pag")} className="w-full rounded-2xl p-3 text-left text-white vpulse" style={{ background: "linear-gradient(135deg,#F59E0B,#DC2626)" }}><div className="flex justify-between items-center"><div><div className="font-bold">🔔 {pPend.length} pago{pPend.length > 1 ? "s" : ""} por aprobar</div><div className="text-xs opacity-90">{bs(pPend.reduce((a, p) => a + p.monto, 0))} esperando tu verificación</div></div><span className="text-sm font-semibold underline">Revisar ›</span></div></button> : <div className="rounded-xl p-2 text-xs text-center" style={{ background: C.okSoft, color: C.ok }}>✓ Sin pagos pendientes de aprobar</div>}
      <div className="flex gap-2 overflow-x-auto">{[["pag", `💳 Pagos (${pPend.length})`], ["fin", "📊 Finanzas"], ["cfg", "⚙️ Cobros"], ["rep", `Reportes (${pend})`], ["sug", `Sugerencias (${nuevas})`], ["usr", "Usuarios"], ["res", "Resumen"], ["aud", "Auditoría"]].map(([k, l]) => <Chip key={k} on={s === k} onClick={() => setS(k)}>{l}</Chip>)}</div>
      {s === "pag" && <>
        {!pPend.length && <div className="text-center py-6 text-sm" style={{ color: C.mute }}>No hay pagos pendientes. Cuando un agente envíe su comprobante aparecerá aquí.</div>}
        {pPend.map((p) => (
          <div key={p.id} className="rounded-2xl p-4 space-y-3" style={{ background: C.card, border: "2px solid #F59E0B", boxShadow: "0 6px 18px rgba(245,158,11,.28)" }}>
            <div className="flex justify-between items-start gap-2"><div><div className="font-bold" style={{ color: C.ink, fontSize: 16 }}>{p.de}</div><div className="text-xs" style={{ color: C.mute }}>{p.tipo} · {fechaL(isoD(p.iso))}</div></div><div className="text-right"><div className="text-xs" style={{ color: C.mute }}>Debe pagar</div><div style={{ ...serif, color: C.ink, fontSize: 28, fontWeight: 700 }}>{bs(p.monto)}</div></div></div>
            <div className="flex flex-wrap gap-2 text-xs"><span className="px-2 py-1 rounded-md" style={{ background: C.lilaSoft, color: C.lilaDk }}>{p.plan}</span><span className="px-2 py-1 rounded-md" style={{ background: C.brandSoft, color: C.brandDk }}>{p.metodo === "QR" ? "Pago por QR" : "Transferencia"}</span>{p.ref && <span className="px-2 py-1 rounded-md" style={{ background: C.line, color: C.ink }}>Ref. {p.ref}</span>}</div>
            {p.nota && <div className="text-xs" style={{ color: C.lilaDk }}>📐 {p.plan}: {p.nota}</div>}
            <Ci ci={(users.find((x) => x.n === p.de) || {}).ci} />
            {p.comp ? <img src={p.comp} alt="Comprobante" className="w-full rounded-xl object-cover" style={{ maxHeight: 220 }} /> : <div className="rounded-xl py-6 text-center text-xs" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>🧾 Comprobante de ejemplo</div>}
            {rej === p.id ? (
              <div className="space-y-2"><Seg o={["No encuentro el pago", "Monto incorrecto", "Comprobante ilegible", "Otro motivo"]} v={mot} set={setMot} /><div className="grid grid-cols-2 gap-2"><button onClick={() => rechazar(p)} className="py-3 rounded-xl font-bold text-white" style={{ background: C.red }}>Confirmar rechazo</button><button onClick={() => setRej(null)} className="py-3 rounded-xl" style={{ border: `1px solid ${C.line}`, color: C.mute }}>Cancelar</button></div></div>
            ) : (
              <div className="grid grid-cols-2 gap-2"><button onClick={() => aprobar(p)} className="py-3.5 rounded-xl font-bold text-white" style={{ background: C.ok }}>✓ Aprobar y habilitar</button><button onClick={() => { setRej(p.id); setMot(""); }} className="py-3.5 rounded-xl font-bold" style={{ background: C.redSoft, color: C.red }}>✕ Rechazar</button></div>
            )}
          </div>
        ))}
        <div className="text-sm font-semibold pt-2" style={{ color: C.ink }}>Registro de pagos</div>
        <div className="flex gap-2">{["Todos", "Aprobado", "Rechazado"].map((x) => <Chip key={x} on={filtro === x} onClick={() => setFiltro(x)}>{x} ({pagos.filter((p) => p.est !== "Pendiente" && (x === "Todos" || p.est === x)).length})</Chip>)}</div>
        <input value={buscaPago} onChange={(e) => setBuscaPago(e.target.value)} placeholder="Buscar por nombre del agente" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
        {(() => { const lista = pagos.filter((p) => p.est !== "Pendiente" && (filtro === "Todos" || p.est === filtro) && (!buscaPago.trim() || (p.de || "").toLowerCase().includes(buscaPago.trim().toLowerCase()))).sort((a, b) => (b.revF || b.iso).localeCompare(a.revF || a.iso) || String(b.id).localeCompare(String(a.id))); return <>
          {!lista.length && <div className="text-center py-4 text-sm" style={{ color: C.mute }}>No hay pagos {filtro === "Todos" ? "revisados" : filtro.toLowerCase() + "s"} todavía.</div>}
          {lista.slice(0, cuantosPagos).map((p) => { const abierto = verPago === p.id; return (
            <div key={p.id} className="rounded-xl text-sm overflow-hidden" style={{ background: C.card, border: `1px solid ${abierto ? C.lila : C.line}`, color: C.ink }}>
              <button onClick={() => setVerPago(abierto ? null : p.id)} className="w-full p-2.5 flex justify-between items-center text-left"><span>{p.de}<div className="text-xs" style={{ color: C.mute }}>{fechaL(isoD(p.iso))} · {p.plan} · {p.tipo}</div></span><span className="text-right"><b>{bs(p.monto)}</b><div className="text-xs" style={{ color: p.est === "Aprobado" ? C.ok : C.red }}>{p.est} {abierto ? "▲" : "▼"}</div></span></button>
              {abierto && <div className="px-3 pb-3 space-y-2 text-xs" style={{ borderTop: `1px solid ${C.line}` }}>
                <div className="pt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <span style={{ color: C.mute }}>Enviado</span><span>{fechaL(isoD(p.iso))}</span>
                  {p.revF && <><span style={{ color: C.mute }}>{p.est === "Aprobado" ? "Aprobado" : "Rechazado"}</span><span>{fechaL(isoD(p.revF))}</span></>}
                  <span style={{ color: C.mute }}>Método</span><span>{p.metodo === "QR" ? "QR" : "Transferencia"}</span>
                  {p.ref && <><span style={{ color: C.mute }}>Referencia</span><span>{p.ref}</span></>}
                  {p.hasta && <><span style={{ color: C.mute }}>Habilitado hasta</span><span>{fechaL(isoD(p.hasta))}</span></>}
                  {p.nota && <><span style={{ color: C.mute }}>Detalle</span><span>{p.nota}</span></>}
                </div>
                {p.est === "Rechazado" && <div className="rounded-lg px-2.5 py-1.5" style={{ background: C.redSoft, color: C.red }}>Motivo: {p.mot}</div>}
                <div style={{ color: C.mute }}>Carnet</div>
                <Ci ci={(users.find((x) => x.n === p.de) || {}).ci} />
                <div style={{ color: C.mute }}>Comprobante</div>
                {p.comp ? <a href={p.comp} target="_blank" rel="noreferrer"><img src={p.comp} alt="Comprobante" className="w-full rounded-xl object-contain" style={{ maxHeight: 320, background: C.bg }} /><div className="text-center mt-1 underline" style={{ color: C.brandDk }}>Abrir comprobante en tamaño completo</div></a> : <div style={{ color: C.mute }}>Sin comprobante</div>}
              </div>}
            </div>); })}
          {lista.length > cuantosPagos && <button onClick={() => setCuantosPagos(cuantosPagos + 15)} className="w-full py-2 rounded-xl text-sm" style={{ border: `1px solid ${C.line}`, color: C.lilaDk }}>Ver más pagos ({lista.length - cuantosPagos} restantes)</button>}
        </>; })()}
      </>}
      {s === "fin" && <>
        <div className="grid grid-cols-2 gap-2">
          {[["Ingreso mensual fijo", bs(mrr), "de cuentas activas"], [`Cobrado en ${MES[HOY.getMonth()]}`, bs(cobrado), "pagos aprobados"], ["Por aprobar", bs(pPend.reduce((a, p) => a + p.monto, 0)), `${pPend.length} pago(s)`], ["Suscriptores activos", activos.length, `${users.filter((u) => u.est === "Vencido").length} vencidos · ${users.filter((u) => u.est === "Prueba").length} en prueba`]].map(([a, b, c]) => (
            <div key={a} className="rounded-xl p-3" style={{ background: C.lilaSoft }}><div className="text-xs" style={{ color: C.mute }}>{a}</div><div style={{ ...serif, color: C.lilaDk, fontSize: 22, fontWeight: 700 }}>{b}</div><div style={{ fontSize: 11, color: C.mute }}>{c}</div></div>
          ))}
        </div>
        <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>Suscriptores por plan</div>
          {[["Prueba", users.filter((u) => u.est === "Prueba").length, 0, C.mute], ["Gratuito", users.filter((u) => u.est === "Vencido").length, 0, C.line], ...planes.map((x, i) => [x.p, x.n, x.n * precioDe(cfg, x.p), [C.brand, C.lila, "#D9961B"][i % 3]])].map(([l, n, m, c]) => (
            <div key={l} className="flex items-center gap-2 text-xs" style={{ color: C.ink }}><span style={{ width: 70 }}>{l}</span><div className="flex-1 rounded-full" style={{ background: C.line, height: 10 }}><div className="rounded-full" style={{ width: `${(n / Math.max(1, users.length)) * 100}%`, height: 10, background: c }} /></div><span style={{ minWidth: 92, textAlign: "right" }}>{n} · {m ? bs(m) + "/mes" : "gratis"}</span></div>
          ))}
        </div>
        <div className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold mb-2" style={{ color: C.ink }}>Ingresos cobrados por mes (Bs)</div>
          <div className="flex items-end gap-1" style={{ height: 120 }}>{meses.map((m, i) => <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: "100%" }}><span style={{ fontSize: 10, color: C.mute }}>{m.v ? (m.v / 1000).toFixed(1) + "k" : ""}</span><div className="w-full rounded-t-md" style={{ height: `${m.v ? Math.max((m.v / mmax) * 78, 6) : 2}%`, background: m.v ? C.brand : C.line }} /></div>)}</div>
          <div className="flex gap-1 mt-1">{meses.map((m, i) => <div key={i} className="flex-1 text-center" style={{ fontSize: 10, color: C.mute }}>{m.l}</div>)}</div>
        </div>
        <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>Próximo corte: {fechaL(corte)}</div>
          <div className="text-xs" style={{ color: C.mute }}>{porRenovar.length} cuenta(s) deben renovar · esperado {bs(esperado)}. Las que ya renovaron por adelantado no aparecen.</div>
          {porRenovar.map((u) => <div key={u.n} className="flex justify-between text-sm" style={{ color: C.ink }}><span>{u.n} · {u.plan}</span><b>{bs(precioDe(cfg, u.plan))}</b></div>)}
          {cfm ? <div className="flex items-center gap-2 text-sm"><span style={{ color: C.ink }}>¿Pasar {porRenovar.length} cuenta(s) a Vencido?</span><button onClick={ejecutarCorte} className="px-3 py-1 rounded-lg text-white" style={{ background: C.red }}>Sí, ejecutar</button><button onClick={() => setCfm(false)} style={{ color: C.mute }}>No</button></div> : <button disabled={!porRenovar.length} onClick={() => setCfm(true)} className="text-xs underline" style={{ color: porRenovar.length ? C.red : C.mute }}>Ejecutar corte (simulación)</button>}
        </div>
      </>}
      {s === "cfg" && <>
        <div className="rounded-xl p-2.5 text-xs" style={{ background: C.amberSoft, color: C.amber }}>Los datos de la cuenta y el QR son de ejemplo. Define los tuyos.</div>
        <Fld l="Día de corte de todos los pagos"><select value={cfg.dia} onChange={(e) => { setCfg({ ...cfg, dia: +e.target.value }); log(`Día de corte cambiado a ${e.target.value}`); }} className="w-full rounded-xl px-3 py-2 text-sm" style={inp}>{Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Día {d} de cada mes</option>)}</select></Fld>
        <div className="space-y-2"><div className="text-xs font-medium" style={{ color: C.mute }}>Precio de cada plan de pago (Bs por mes)</div>{cfg.planes.map((pl, i) => <div key={i} className="grid grid-cols-5 gap-2"><div className="col-span-3 rounded-xl px-3 py-2 text-sm" style={{ ...inp, background: C.lilaSoft }}>{pl.nombre}</div><input value={pl.precio} onChange={(e) => setCfg({ ...cfg, planes: cfg.planes.map((q, j) => (j === i ? { ...q, precio: +e.target.value.replace(/\D/g, "") || 0 } : q)) })} inputMode="numeric" className="col-span-2 rounded-xl px-3 py-2 text-sm" style={inp} /></div>)}<div className="text-xs" style={{ color: C.mute }}>Los nombres de los planes están fijos porque determinan los permisos de cada nivel.</div></div>
        <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: C.lilaSoft, color: C.lilaDk }}>{cfg.planes.map((pl) => { const x = prorrateo(pl.precio, cfg.dia); return <div key={pl.nombre}>Si alguien se suscribe hoy a {pl.nombre}: paga {bs(x.monto)} ({x.resta} de {x.ciclo} días) hasta el {fechaL(x.fin)}.</div>; })}</div>
        <Fld l="Titular de la cuenta"><input value={cfg.titular} onChange={(e) => setCfg({ ...cfg, titular: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l="Banco"><input value={cfg.banco} onChange={(e) => setCfg({ ...cfg, banco: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <Fld l="Número de cuenta"><input value={cfg.cuenta} onChange={(e) => setCfg({ ...cfg, cuenta: e.target.value })} className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
        <div className="grid grid-cols-2 gap-3"><Fld l="WhatsApp de soporte prioritario"><input value={cfg.waSoporte} onChange={(e) => setCfg({ ...cfg, waSoporte: e.target.value })} placeholder="591..." inputMode="tel" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld><Fld l="Respuesta objetivo (horas)"><input value={cfg.slaPrio} onChange={(e) => setCfg({ ...cfg, slaPrio: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="Opcional" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld></div>
        <label className="block w-full py-3 rounded-xl text-sm text-center cursor-pointer" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>{cfg.qr ? "✓ QR cargado (cambiar)" : "📷 Subir imagen del QR de cobro"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const u = e.target.files[0] && await subir(e.target.files[0]); if (u) setCfg((x) => ({ ...x, qr: u })); }} /></label>
        {cfg.qr && <img src={cfg.qr} alt="QR" className="rounded-xl mx-auto" style={{ width: 140, height: 140, objectFit: "cover" }} />}
      </>}
      {s === "rep" && <>
        <div className="text-xs" style={{ color: C.mute }}>Solo tras resolver y confirmar, el antecedente se muestra en el perfil del agente.</div>
        {[...reports].sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0)).map((r) => (
          <div key={r.id} className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: C.ink }}>{r.prio ? "⭐ Prioritario · " : ""}{r.ag ? `Contra ${r.ag}` : r.tipo}</span><span className="text-xs px-2 py-0.5 rounded-md" style={{ background: REP_COL[r.est][1], color: REP_COL[r.est][0] }}>{r.est}</span></div>
            <div className="text-xs" style={{ color: C.mute }}>Reporta: {r.de} · {r.tipo || "Agente"} · {r.m}{r.rel && !r.ag ? ` · ${r.rel}` : ""}</div>
            <div className="text-sm" style={{ color: C.ink }}>{r.det}</div>
            {r.montos && <div className="text-xs font-semibold" style={{ color: C.amber }}>Pagó {bs(r.montos.pagado)} · debía {bs(r.montos.debia)} · diferencia {bs(r.montos.pagado - r.montos.debia)}</div>}
            {r.pruebas && r.pruebas.length > 0 && <div className="flex gap-2 overflow-x-auto">{r.pruebas.map((u) => <img key={u} src={u} alt="Prueba" className="rounded-lg object-cover shrink-0" style={{ width: 80, height: 80 }} />)}</div>}
            {(r.est === "Pendiente" || r.est === "En revisión") && (
              <div className="flex flex-wrap gap-2">
                {r.est === "Pendiente" && <button onClick={() => setRep(r, "En revisión")} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.ink }}>Pasar a revisión</button>}
                {r.ag ? <button onClick={() => setRep(r, "Resuelto", true)} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: C.lila }}>Confirmar antecedente</button> : <button onClick={() => setRep(r, "Resuelto")} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: C.ok }}>Marcar resuelto</button>}
                <button onClick={() => setRep(r, "Descartado")} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.red }}>Descartar</button>
              </div>
            )}
          </div>
        ))}
        {!reports.length && <div className="text-center py-8 text-sm" style={{ color: C.mute }}>No hay reportes.</div>}
      </>}
      {s === "sug" && <>
        <div className="text-xs" style={{ color: C.mute }}>Lo que piden los agentes. Úsalo para decidir qué mejorar primero.</div>
        <div className="flex gap-2 overflow-x-auto">{["Todas", ...SUG_CATS].map((c) => <Chip key={c} on={fc === c} onClick={() => setFc(c)}>{c} ({c === "Todas" ? sugs.length : sugs.filter((x) => x.cat === c).length})</Chip>)}</div>
        {sugs.filter((x) => fc === "Todas" || x.cat === fc).map((x) => (
          <div key={x.id} className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex justify-between items-center"><span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: C.lilaSoft, color: C.lilaDk }}>{x.cat}</span><span className="text-xs" style={{ color: C.mute }}>{x.f}</span></div>
            <div className="text-sm" style={{ color: C.ink }}>{x.txt}</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs" style={{ color: C.mute }}>De {x.de}</span>
              <select value={x.est} onChange={(e) => { setSugs(sugs.map((y) => (y.id === x.id ? { ...y, est: e.target.value } : y))); log(`Sugerencia de ${x.de} (${x.cat}): ${e.target.value}`); }} className="rounded-lg px-2 py-1 text-sm" style={{ ...inp, color: SUG_COL[x.est][0] }}>{SUG_EST.map((e) => <option key={e}>{e}</option>)}</select>
            </div>
          </div>
        ))}
        {!sugs.some((x) => fc === "Todas" || x.cat === fc) && <div className="text-center py-8 text-sm" style={{ color: C.mute }}>No hay sugerencias en esta categoría.</div>}
      </>}
      {s === "usr" && cuentas && <cuentas.Crear planes={cfg.planes.map((q) => q.nombre)} corte={isoOf(proximoCorte(cfg.dia))} onCreado={(n, plan) => { log(`Cuenta de ${n} creada (${plan === "Prueba" ? "prueba de 48 h" : "plan " + plan})`); flash(`Usuario ${n} creado.`); }} />}
      {s === "usr" && users.map((u) => (
        <div key={u.n} className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: C.ink }}>{u.n}{u._rol === "admin" ? " · Admin" : ""}{u._email && <span className="block text-xs font-normal" style={{ color: C.mute }}>{u._email}</span>}</span><span className="text-xs" style={{ color: C.mute }}>{u.ant ? `⚠️ ${u.ant} antecedente(s)` : "Sin antecedentes"}</span></div>
          <div className="text-xs" style={{ color: C.mute }}>{u.prueba && u.est === "Prueba" ? `Prueba: inicio ${new Date(u.prueba.inicio).toLocaleString("es-BO")} · vence ${new Date(u.prueba.fin).toLocaleString("es-BO")}` : u.venc ? `Acceso hasta ${fechaL(isoD(u.venc))}` : "Sin fecha de vencimiento"}</div>
          <div className="flex flex-wrap gap-2 items-center"><Ci ci={u.ci} />{u.insc && <span className="text-xs" style={{ color: C.lilaDk }}>Se inscribió en {u.insc.plan} · {fechaL(isoD(u.insc.f))}</span>}</div>
          <div className="grid grid-cols-2 gap-2">
            <select value={u.est} onChange={(e) => setU(u.n, { est: e.target.value }, `estado cambiado a ${e.target.value}`)} className="rounded-lg px-2 py-1.5 text-sm" style={inp}>{["Prueba", "Activo", "Vencido", "Suspendido", "Bloqueado"].map((x) => <option key={x}>{x}</option>)}</select>
            <select value={u.plan} onChange={(e) => setU(u.n, { plan: e.target.value }, `plan cambiado a ${e.target.value}`)} className="rounded-lg px-2 py-1.5 text-sm" style={inp}>{["Prueba", "Gratuito", ...cfg.planes.map((q) => q.nombre)].map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          {u.est === "Activo" && (!u.venc || u.venc < isoOf(HOY)) && <button onClick={() => setU(u.n, { venc: isoOf(proximoCorte(cfg.dia)) }, `acceso habilitado hasta ${fechaL(proximoCorte(cfg.dia))}`)} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.okSoft, color: C.ok }}>Habilitar acceso hasta el próximo corte ({fechaL(proximoCorte(cfg.dia))})</button>}
          {cuentas && u._uid && <cuentas.Acciones u={u} onHecho={(t) => { log(`${u.n}: ${t}`); flash(t); }} />}
        </div>
      ))}
      {s === "res" && <div className="grid grid-cols-2 gap-2">
        {[["Agentes", users.length], ["Propiedades activas", act.length], ["Sin confirmar", act.filter((p) => vigencia(p).n === 2).length], ["Cierres", ops.length], ["Reportes abiertos", pend], ["Cuentas vencidas", users.filter((u) => u.est === "Vencido").length]].map(([a, b]) => (
          <div key={a} className="rounded-xl p-3" style={{ background: C.lilaSoft }}><div style={{ ...serif, color: C.lilaDk, fontSize: 26, fontWeight: 700 }}>{b}</div><div className="text-xs" style={{ color: C.mute }}>{a}</div></div>
        ))}
      </div>}
      {s === "aud" && audit.map((a) => <div key={a.id} className="rounded-xl p-3 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>{a.m}<div className="text-xs mt-0.5" style={{ color: C.mute }}>{a.f}</div></div>)}
    </div>
  );
}

function Ficha({ n, props, users, rate, onClose }) {
  const u = users.find((x) => x.n === n) || { ant: 0 };
  const r = rate(n);
  const ciu = [...new Set(props.filter((p) => p.cap.n === n).map((p) => p.cap.ciu))];
  const act = props.filter((p) => p.cap.n === n && ["Disponible", "Reservado"].includes(p.est || "Disponible")).length;
  return (
    <div className="absolute inset-0 z-10 flex items-end" style={{ background: "rgba(30,27,58,.55)" }}>
      <div className="w-full rounded-t-3xl p-4 space-y-3" style={{ background: C.card }}>
        <div className="flex justify-between"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: C.lila }}>{n[0]}</div><div><div className="font-semibold" style={{ color: C.ink }}>{n}</div><div className="text-xs" style={{ color: C.mute }}>Agente inmobiliario independiente</div></div></div><button onClick={onClose} style={{ color: C.mute }}>Cerrar</button></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Puntuación", r ? `⭐ ${r.avg.toFixed(1)}` : "—"], ["Reseñas", r ? r.n : 0], ["Captaciones", act]].map(([a, b]) => <div key={a} className="rounded-xl py-2" style={{ background: C.lilaSoft }}><div className="font-semibold" style={{ ...serif, color: C.lilaDk, fontSize: 18 }}>{b}</div><div className="text-xs" style={{ color: C.mute }}>{a}</div></div>)}
        </div>
        <div className="text-sm" style={{ color: C.ink }}>Trabaja en: {ciu.join(", ") || "—"}</div>
        <div className="text-sm" style={{ color: u.ant ? C.amber : C.ok }}>{u.ant ? `⚠️ ${u.ant} antecedente(s) confirmado(s) por la administración` : "✓ Sin antecedentes confirmados"}</div>
        <div className="text-xs" style={{ color: C.mute }}>La puntuación proviene de agentes que cerraron negocios con este agente.</div>
      </div>
    </div>
  );
}

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const OPS0 = [
  [1, "Depto en Sopocachi", "Alquiler", 400, 400, "USD", "Raúl Mamani", "Con cliente", "2026-10-06"],
  [2, "Casa en Calacoto", "Venta", 145000, 4350, "USD", "Marcelo Vargas", "Captador", "2026-09-24"],
  [3, "Oficina en Equipetrol", "Alquiler", 800, 800, "USD", "Paola Egüez", "Con cliente", "2026-09-16"],
  [4, "Depto en Cala Cala", "Anticrético", 30000, 1200, "USD", "Daniela Soria", "Captador", "2026-09-03"],
  [5, "Terreno en Urubó", "Venta", 80000, 2400, "USD", "Iván Suárez", "Con cliente", "2026-08-12"],
  [6, "Casa zona Sur", "Alquiler", 3500, 3500, "BOB", "Daniela Soria", "Captador", "2026-07-20"],
  [7, "Depto en Miraflores", "Venta", 98000, 2940, "USD", "Raúl Mamani", "Con cliente", "2026-05-14"],
  [8, "Local comercial Centro", "Alquiler", 1200, 1200, "USD", "Paola Egüez", "Captador", "2026-02-27"],
  [9, "Depto en San Miguel", "Anticrético", 25000, 1000, "USD", "Marcelo Vargas", "Con cliente", "2025-11-08"],
  [10, "Casa en Las Palmas", "Venta", 160000, 4800, "USD", "Iván Suárez", "Captador", "2025-06-19"],
  [11, "Depto zona Norte", "Alquiler", 380, 380, "USD", "Raúl Mamani", "Captador", "2026-10-02"],
].map(([id, t, op, monto, com, mon, colab, rol, iso]) => { const [y, m, d] = iso.split("-").map(Number); return { id, t, op, monto, com, mon, colab, rol, iso, fecha: `${d} ${MES[m - 1]} ${y}` }; });

function Dash({ ops }) {
  const [per, setPer] = useState("Meses");
  const [tipo, setTipo] = useState("Todas");
  const [vista, setVista] = useState("Cierres");
  const HOY = hoy0();
  const pb = (o) => (o.mon === "USD" ? o.com * BOB : o.com) / 2;
  const short = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(Math.round(n)));
  const d0 = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const list = ops.filter((o) => tipo === "Todas" || o.op === tipo);
  const bk = [];
  if (per === "Semanas") { const l = new Date(HOY); l.setDate(l.getDate() - ((l.getDay() + 6) % 7)); for (let i = 7; i >= 0; i--) { const s = new Date(l); s.setDate(s.getDate() - 7 * i); const e = new Date(s); e.setDate(e.getDate() + 7); bk.push({ l: `${s.getDate()}/${s.getMonth() + 1}`, s, e }); } }
  else if (per === "Meses") { for (let i = 11; i >= 0; i--) { const s = new Date(HOY.getFullYear(), HOY.getMonth() - i, 1); bk.push({ l: MES[s.getMonth()], s, e: new Date(HOY.getFullYear(), HOY.getMonth() - i + 1, 1) }); } }
  else { for (let y = HOY.getFullYear() - 2; y <= HOY.getFullYear(); y++) bk.push({ l: String(y), s: new Date(y, 0, 1), e: new Date(y + 1, 0, 1) }); }
  const data = bk.map((b) => { const xs = list.filter((o) => { const d = d0(o.iso); return d >= b.s && d < b.e; }); return { l: b.l, n: xs.length, b: xs.reduce((a, o) => a + pb(o), 0) }; });
  const val = (x) => (vista === "Cierres" ? x.n : x.b);
  const max = Math.max(1, ...data.map(val));
  const enP = data.reduce((a, x) => a + x.n, 0);
  const parte = list.reduce((a, o) => a + pb(o), 0);
  const tipos = [["Venta", C.lila], ["Alquiler", C.brand], ["Anticrético", "#D9961B"], ["Preventa", C.ink]].map(([t, c]) => ({ t, c, n: ops.filter((o) => o.op === t).length, b: ops.filter((o) => o.op === t).reduce((a, o) => a + pb(o), 0) }));
  const tot = Math.max(1, ops.length);
  const unidad = per === "Semanas" ? "semana" : per === "Meses" ? "mes" : "año";
  const exportar = () => { const filas = [["Fecha", "Propiedad", "Tipo", "Monto", "Moneda", "Comisión", "Agente", "Rol"], ...ops.map((o) => [o.iso, o.t, o.op, o.monto, o.mon, o.com, o.colab, o.rol])]; const csv = filas.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "mis-cierres.csv"; a.click(); };
  return (
    <div className="space-y-3">
      <div className="text-xs" style={{ color: C.mute }}>Calculado con los cierres registrados. En esta vista previa son datos de ejemplo.</div>
      <button onClick={exportar} className="text-xs underline" style={{ color: C.brandDk }}>⬇ Exportar mis cierres (CSV)</button>
      <div className="flex gap-2">{["Semanas", "Meses", "Años"].map((p) => <Chip key={p} on={per === p} onClick={() => setPer(p)}>{p}</Chip>)}</div>
      <div className="flex gap-2 overflow-x-auto">{["Todas", "Venta", "Alquiler", "Anticrético", "Preventa"].map((x) => <Chip key={x} on={tipo === x} onClick={() => setTipo(x)}>{x}</Chip>)}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Cierres totales", list.length], [per === "Semanas" ? "Últimas 8 sem." : per === "Meses" ? "Últimos 12 meses" : `${HOY.getFullYear() - 2} – ${HOY.getFullYear()}`, enP], ["Tu parte (Bs)", Math.round(parte).toLocaleString("es-BO")]].map(([a, b]) => (
          <div key={a} className="rounded-xl py-2 px-1" style={{ background: C.lilaSoft }}><div className="font-semibold" style={{ ...serif, color: C.lilaDk, fontSize: 20 }}>{b}</div><div style={{ fontSize: 11, color: C.mute }}>{a}</div></div>
        ))}
      </div>
      <div className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold mb-2" style={{ color: C.ink }}>{vista === "Cierres" ? "Cierres" : "Tu parte en Bs"} por {unidad}{tipo !== "Todas" ? ` · ${tipo}` : ""}</div>
        <div className="flex gap-2 mb-2">{["Cierres", "Monto en Bs"].map((x) => <Chip key={x} on={(x === "Cierres") === (vista === "Cierres")} onClick={() => setVista(x === "Cierres" ? "Cierres" : "Monto")}>{x}</Chip>)}</div>
        <div className="flex items-end gap-1" style={{ height: 130 }}>
          {data.map((x, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: "100%" }}>
              <span style={{ fontSize: 11, color: C.mute }}>{val(x) ? (vista === "Cierres" ? x.n : short(x.b)) : ""}</span>
              <div className="w-full rounded-t-md" style={{ height: `${val(x) ? Math.max((val(x) / max) * 80, 6) : 2}%`, background: val(x) ? C.brand : C.line }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">{data.map((x, i) => <div key={i} className="flex-1 text-center" style={{ fontSize: 10, color: C.mute }}>{x.l}</div>)}</div>
        {!enP && <div className="text-xs text-center mt-2" style={{ color: C.mute }}>Sin cierres en este período.</div>}
      </div>
      <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        <div className="text-sm font-semibold" style={{ color: C.ink }}>Cierres por tipo de operación (total · tu parte en Bs)</div>
        {tipos.map((x) => (
          <div key={x.t} className="flex items-center gap-2 text-xs" style={{ color: C.ink }}>
            <span style={{ width: 78 }}>{x.t}</span>
            <div className="flex-1 rounded-full" style={{ background: C.line, height: 10 }}><div className="rounded-full" style={{ width: `${(x.n / tot) * 100}%`, height: 10, background: x.c }} /></div>
            <span style={{ minWidth: 96, textAlign: "right" }}>{x.n} · Bs {Math.round(x.b).toLocaleString("es-BO")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const HOY = hoy0();
const pad2 = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoD = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const fechaL = (d) => `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`;
const bs = (n) => `Bs ${Math.round(n).toLocaleString("es-BO")}`;
const proximoCorte = (dia) => { let d = new Date(HOY.getFullYear(), HOY.getMonth(), dia); if (d <= HOY) d = new Date(HOY.getFullYear(), HOY.getMonth() + 1, dia); return d; };
const prorrateo = (precio, dia) => { const fin = proximoCorte(dia); const ini = new Date(fin.getFullYear(), fin.getMonth() - 1, dia); const ciclo = Math.round((fin - ini) / 864e5), resta = Math.round((fin - HOY) / 864e5); return { fin, resta, ciclo, monto: Math.round((precio * resta) / ciclo) }; };
const PRECIOS = { Inicial: 49, Profesional: 99, Premium: 169 };
const ORD = { gratuito: 0, Inicial: 1, Profesional: 2, Premium: 3, prueba: 3, admin: 3 };
const permisos = (n) => { const r = ORD[n] ?? 0; return { nivel: n, ficha: r >= 1, maxCapt: { Inicial: 5, Profesional: 20, Premium: 40 }[n] || null, maxFotos: { Inicial: 3, Profesional: 5 }[n] || (r >= 3 ? 8 : 3), req: r >= 1, fav: r >= 2, vis: r >= 1, share: r >= 2, report: r >= 1, cierre: r >= 1, filtros: r >= 1, match: r >= 2, matchAv: r >= 2, inversa: r >= 2, cliente: r >= 2, busq: r >= 2, vigDet: r >= 2, hist: r >= 2, seg: r >= 2, recordatorios: r >= 2, stats: r >= 3, informes: r >= 3, auto: r >= 3, soporte: r >= 3 }; };
const CUENTAS = [["admin", "SuperAdmin"], ["prueba", "Prueba"], ["gratuito", "Gratuito"], ["Inicial", "Inicial"], ["Profesional", "Profesional"], ["Premium", "Premium"]];
const RESUMEN = {
  admin: "Panel de administración: aprobar pagos, configurar cobros y planes, crear y gestionar usuarios, revisar reportes, sugerencias y auditoría.",
  prueba: "48 horas con acceso completo (igual que Premium). Al terminar, la cuenta pasa automáticamente a Gratuito hasta que pague un plan.",
  gratuito: "Solo puede buscar y ver datos básicos de las propiedades. Bloqueado: ficha completa, contacto con captadores, requerimientos, visitas, captaciones, reportes y todo lo de los planes.",
  Inicial: "Hasta 5 captaciones · 3 fotos por captación · ficha completa y WhatsApp con captadores · requerimientos de clientes · agenda de visitas · reportes. Sin favoritos, coincidencias avanzadas ni estadísticas.",
  Profesional: "Hasta 20 captaciones · 5 fotos por captación · todo lo de Inicial · coincidencias ponderadas e inversas · favoritos · compartir por WhatsApp · búsquedas guardadas · seguimiento · recordatorios. Sin estadísticas, informes ni automatizaciones.",
  Premium: "Hasta 40 captaciones · 8 fotos por captación · confirmaciones de visita programadas por WhatsApp · todo lo de Profesional · estadísticas · informes con exportación CSV · automatizaciones · soporte prioritario.",
};
const PLAN_BEN = {
  Inicial: ["Hasta 5 captaciones activas", "Hasta 3 fotos por captación", "Ficha completa y contacto por WhatsApp con captadores", "Registro de requerimientos de clientes", "Agenda de visitas", "Reportes y consultas"],
  Profesional: ["Hasta 20 captaciones activas", "Hasta 5 fotos por captación", "Todo lo de Inicial", "Coincidencias ponderadas con explicación y coincidencia inversa", "Favoritos y guardar para clientes", "Compartir propiedades por WhatsApp", "Búsquedas guardadas", "Seguimiento de oportunidades", "Recordatorios de agenda", "Historial de cierres y vigencia detallada"],
  Premium: ["Hasta 40 captaciones activas", "Hasta 8 fotos por captación", "Confirmaciones de visita programadas por WhatsApp", "Todo lo de Profesional", "Estadísticas de captaciones y cierres", "Informes avanzados con exportación CSV", "Automatizaciones configurables", "Soporte prioritario"],
};
const TIPOS_PAGO = { alta: "Primer pago (prorrateo)", renov: "Renovación", mejora: "Mejora de plan" };
const ETAPAS = ["Nuevo", "Contactado", "Visita agendada", "Negociación", "Cerrado ganado", "Perdido"];
const RECS = [[0, "Sin recordatorio"], [1440, "1 día antes"], [120, "2 horas antes"], [30, "30 min antes"]];
const REP_TIPOS = {
  "Pago o suscripción": ["Pagué de más", "Pagué de menos", "Mi pago no aparece", "Cobro incorrecto o duplicado", "Mi plan no se activó", "Quiero un reembolso o ajuste", "Error en el prorrateo"],
  Agente: ["Incumplimiento de acuerdos", "Información falsa", "Conducta poco profesional", "Problemas con colaboración", "No respetó la regla 50/50", "Suplantación de identidad", "Otro"],
  Propiedad: ["Ya no está disponible (fantasma)", "Información falsa o engañosa", "Precio incorrecto", "Publicación duplicada", "Fotos inapropiadas o robadas", "El captador no responde"],
  "Cierre o comisión": ["Disputa por comisión", "Cierre no reconocido", "Monto mal registrado", "Mal trabajo del otro agente"],
  Visita: ["Cancelada sin aviso", "El agente no se presentó", "Dirección incorrecta", "Mala atención al cliente"],
  "Cuenta y acceso": ["No puedo iniciar sesión", "Mi plan o acceso es incorrecto", "Datos de perfil incorrectos", "Quiero eliminar mi cuenta o mis datos"],
  "Error de la app": ["Algo no funciona", "Datos que no se guardan", "Notificación incorrecta", "Problema en el celular"],
  "Contenido o abuso": ["Contenido ofensivo", "Spam o publicidad", "Datos personales expuestos", "Fraude o estafa"],
  "Soporte o consulta": ["Tengo una duda", "Quiero una función nueva", "Otro"],
};
const descargarCsv = (nombre, filas) => { const csv = filas.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = nombre; a.click(); };
// ── WhatsApp ──
const waNum = (t) => { let d = String(t || "").replace(/\D/g, ""); if (d.length === 8) d = "591" + d; return d; };
const waLink = (tel, txt) => `https://wa.me/${waNum(tel)}?text=${encodeURIComponent(txt || "")}`;
const MOMENTOS_WA = [[0, "Al agendar"], [1440, "1 día antes"], [120, "2 horas antes"], [30, "30 min antes"]];
const plantillaWa = (k, d) => k === "cli"
  ? `Hola ${d.cl} 👋, te confirmo la visita a *${d.pt}*${d.zona ? ` (${d.zona})` : ""} el ${d.fecha} a las ${d.h}. ${d.ag === d.yo ? "Te atenderé personalmente." : `Te atenderá ${d.ag}.`} ¿Me confirmas tu asistencia? — ${d.yo}, Vortex`
  : `Hola ${d.ag} 👋, te confirmo la visita a *${d.pt}* el ${d.fecha} a las ${d.h} con mi cliente ${d.cl}. ¿Me confirmas? — ${d.yo}, Vortex`;
const momentoWa = (x) => (x.wa && x.wa.cuando ? new Date(`${x.f}T${x.h}:00`).getTime() - x.wa.cuando * 6e4 : 0);
// Mensajes programados que ya llegó la hora de enviar (solo de visitas que agendé yo)
const pendWa = (visitas) => {
  const ahora = Date.now(), out = [];
  visitas.filter((x) => x.wa && (x.de === ME || !x.de) && !["Cancelada", "Realizada"].includes(x.est)).forEach((x) => {
    const fin = new Date(`${x.f}T${x.h}:00`).getTime() + 36e5;
    if (ahora < momentoWa(x) || ahora > fin) return;
    ["cli", "ag"].forEach((k) => { const m = x.wa[k]; if (m && !m.env) out.push({ x, k, m }); });
  });
  return out;
};
// ── Copy completo de una propiedad, con el WhatsApp de quien lo envía ──
const textoCopy = (p, tel) => [
  `🏠 *${p.t}*`,
  `${p.op} · ${p.tipo}`,
  `💰 ${money(p)}`,
  `📍 ${p.zona}, ${p.ciudad}`,
  [p.dorm ? `🛏 ${p.dorm} dormitorio${p.dorm > 1 ? "s" : ""}` : "", p.ban ? `🚿 ${p.ban} baño${p.ban > 1 ? "s" : ""}` : "", p.m2 ? `📐 ${p.m2} m²` : ""].filter(Boolean).join(" · "),
  `🚗 Garaje: ${p.garaje ? `Sí${p.gTipo ? ` (${p.gTipo.toLowerCase()})` : ""}` : "No"}${p.gAparte ? ` · garaje aparte en el edificio${p.gPrecio ? `: ${p.mon === "USD" ? "USD" : "Bs"} ${p.gPrecio}/mes` : ""}` : ""}`,
  `🐾 Mascotas: ${p.mascotas}${p.mascCond ? ` (${p.mascCond})` : ""}`,
  p.amoblado ? `🛋 ${p.amoblado}` : "",
  p.condComp ? `📄 ${p.condComp}` : "",
  p.desc ? `\n${p.desc.trim()}` : "",
  waNum(tel).length >= 8 ? `\n📲 Más información por WhatsApp: https://wa.me/${waNum(tel)}` : "",
].filter(Boolean).join("\n");
async function copiarTexto(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    try { const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; } catch { return false; }
  }
}
// ── Fotos: descargar o enviar ──
const nombreArchivo = (t) => (t || "foto").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40).toLowerCase() || "foto";
const bajarBlob = async (u) => { const r = await fetch(u, { mode: "cors" }); if (!r.ok) throw new Error("descarga"); return r.blob(); };
async function descargarFotos(urls, base, desde = 1) {
  for (let i = 0; i < urls.length; i++) {
    try {
      const b = await bajarBlob(urls[i]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = `${base}-${desde + i}.${(b.type.split("/")[1] || "jpg").replace("jpeg", "jpg")}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      await new Promise((r) => setTimeout(r, 400));
    } catch { window.open(urls[i], "_blank"); }
  }
}
async function compartirFotos(urls, base, texto) {
  try {
    const files = await Promise.all(urls.map(async (u, i) => { const b = await bajarBlob(u); return new File([b], `${base}-${i + 1}.jpg`, { type: b.type || "image/jpeg" }); }));
    if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, text: texto }); return true; }
  } catch (e) { if (e && e.name === "AbortError") return true; }
  return false;
}
function Galeria({ fotos, titulo, texto }) {
  const [i, setI] = useState(0);
  const [ocup, setOcup] = useState("");
  const base = nombreArchivo(titulo);
  const n = fotos.length, j = Math.min(i, n - 1);
  const compartible = typeof navigator !== "undefined" && !!navigator.share;
  const btn = { background: "rgba(16,20,44,.6)", color: "#fff" };
  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden" style={{ height: 230, background: C.line }}>
        <img src={fotos[j]} alt={`Foto ${j + 1}`} className="w-full h-full object-cover" />
        {n > 1 && <button onClick={() => setI((j - 1 + n) % n)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-lg" style={btn}>‹</button>}
        {n > 1 && <button onClick={() => setI((j + 1) % n)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-lg" style={btn}>›</button>}
        <button onClick={() => descargarFotos([fotos[j]], base, j + 1)} title="Descargar esta foto" className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs" style={btn}>⬇ Esta foto</button>
        <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-md" style={btn}>{j + 1} / {n}</span>
      </div>
      {n > 1 && <div className="flex gap-1.5 overflow-x-auto">{fotos.map((u, k) => <button key={u} onClick={() => setI(k)} className="shrink-0 rounded-lg overflow-hidden" style={{ width: 52, height: 52, border: `2px solid ${k === j ? C.lila : "transparent"}` }}><img src={u} alt="" className="w-full h-full object-cover" /></button>)}</div>}
      <div className={`grid gap-2 ${compartible ? "grid-cols-2" : "grid-cols-1"}`}>
        <button disabled={!!ocup} onClick={async () => { setOcup("d"); await descargarFotos(fotos, base); setOcup(""); }} className="py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.brandSoft, color: C.brandDk }}>{ocup === "d" ? "Descargando…" : `⬇ Descargar ${n > 1 ? `las ${n} fotos` : "la foto"}`}</button>
        {compartible && <button disabled={!!ocup} onClick={async () => { setOcup("c"); const ok = await compartirFotos(fotos, base, texto); if (!ok) await descargarFotos(fotos, base); setOcup(""); }} className="py-2.5 rounded-xl text-sm font-semibold" style={{ background: C.lilaSoft, color: C.lilaDk }}>{ocup === "c" ? "Preparando…" : "📤 Enviar fotos"}</button>}
      </div>
    </div>
  );
}
function Invitacion({ tab, onRegistro, onIngresar }) {
  const t = { clientes: ["👤", "Requerimientos de tus clientes", "Registra lo que buscan tus clientes y Vortex te avisa cuando aparece una propiedad compatible."], visitas: ["📅", "Agenda de visitas", "Organiza tus visitas, envía confirmaciones por WhatsApp y coordina con otros agentes."], alertas: ["🔔", "Alertas", "Recibe avisos de propiedades nuevas para tus clientes y de cambios en las que guardaste."], perfil: ["🧑‍💼", "Tu perfil de agente", "Publica tus captaciones, registra cierres, recibe calificaciones y gestiona tu suscripción."] }[tab] || ["✨", "Funciones para agentes", "Regístrate para usar todas las herramientas de Vortex."];
  return (
    <div className="p-5 space-y-4 text-center">
      <div style={{ fontSize: 44 }}>{t[0]}</div>
      <div className="font-bold text-lg" style={{ color: C.ink }}>{t[1]}</div>
      <div className="text-sm" style={{ color: C.mute }}>{t[2]}</div>
      <div className="rounded-2xl p-4 text-left text-sm space-y-1.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>
        <div className="font-semibold">Al registrarte obtienes:</div>
        <div>✓ 48 horas de prueba con acceso completo</div>
        <div>✓ Fichas completas y contacto directo con los captadores</div>
        <div>✓ Publicar tus propias captaciones</div>
        <div>✓ Después eliges el plan que más te convenga</div>
      </div>
      <button onClick={onRegistro} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: C.grad }}>Registrarme gratis</button>
      <button onClick={onIngresar} className="w-full py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${C.line}`, color: C.ink }}>Ya tengo cuenta · Ingresar</button>
    </div>
  );
}
const tBasico = (p) => `${p.tipo} en ${p.zona}, ${p.ciudad}`;
const Lock = ({ t, plan, go }) => <div className="rounded-2xl p-4 text-center space-y-2" style={{ background: C.lilaSoft }}><div className="text-2xl">🔒</div><div className="text-sm font-semibold" style={{ color: C.lilaDk }}>{t}</div><div className="text-xs" style={{ color: C.mute }}>Disponible desde el plan {plan}.</div><button onClick={go} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: C.lila }}>Ver planes</button></div>;
const precioDe = (cfg, n) => (cfg.planes.find((p) => p.nombre === n) || { precio: 0 }).precio;
const notaPr = (precio) => { const x = prorrateo(precio, 5); return `${x.resta} de ${x.ciclo} días (prorrateo hasta ${fechaL(x.fin)})`; };
const Ci = ({ ci }) => ci ? <div className="flex gap-2">{[["front", "Anverso"], ["back", "Reverso"]].map(([k, l]) => ci[k] ? <img key={k} src={ci[k]} alt={l} className="rounded-lg object-cover" style={{ width: 84, height: 58 }} /> : <div key={k} className="flex items-center justify-center rounded-lg text-center" style={{ width: 84, height: 58, border: `1px dashed ${C.mute}`, color: C.mute, fontSize: 10 }}>🪪 {l}{ci.demo ? " (ej.)" : ""}</div>)}</div> : <span className="text-xs" style={{ color: C.amber }}>🪪 Sin carnet cargado</span>;
const CFG0 = { dia: 5, planes: [{ nombre: "Inicial", precio: 49 }, { nombre: "Profesional", precio: 99 }, { nombre: "Premium", precio: 169 }], titular: "Titular de ejemplo", banco: "Banco de ejemplo", cuenta: "000-000000-0", qr: null, waSoporte: "", slaPrio: "" };
const PAGOS0 = [
  ...[["Carla Rojas", "Profesional", "05"], ["Marcelo Vargas", "Premium", "05"], ["Paola Egüez", "Profesional", "06"], ["Iván Suárez", "Premium", "06"], ["Daniela Soria", "Profesional", "07"], ["Lucía Terán", "Inicial", "08"]].flatMap(([de, plan, desde]) => ["05", "06", "07", "08", "09", "10"].filter((m) => m >= desde && !(de === "Daniela Soria" && m === "10")).map((m) => ({ id: `${de}-${m}`, de, plan, monto: PRECIOS[plan], iso: `2026-${m}-05`, tipo: "Renovación", metodo: de.length % 2 ? "QR" : "Cuenta", ref: "", est: "Aprobado", comp: null }))),
  { id: "p1", de: "Raúl Mamani", plan: "Profesional", monto: prorrateo(99, 5).monto, iso: "2026-10-09", tipo: "Primer pago (prorrateo)", metodo: "QR", ref: "0045123", est: "Pendiente", comp: null, nota: notaPr(99) },
  { id: "p2", de: "Daniela Soria", plan: "Premium", monto: prorrateo(169, 5).monto, iso: "2026-10-09", tipo: "Primer pago (prorrateo)", metodo: "Cuenta", ref: "TRF-88231", est: "Pendiente", comp: null, nota: notaPr(169) },
  { id: "p3", de: "Paola Egüez", plan: "Profesional", monto: 99, iso: "2026-10-08", tipo: "Renovación", metodo: "QR", ref: "0044870", est: "Pendiente", comp: null, nota: "Mes completo" },
];

function Sus({ acceso, users, setUsers, pagos, setPagos, cfg, flash, nivel, trial }) {
  const [plan, setPlan] = useState(["Inicial", "Profesional", "Premium"].includes(nivel) ? nivel : "Profesional");
  const [metodo, setMetodo] = useState("QR");
  const [f, setF] = useState({ ref: "", comp: null });
  const [ci, setCi] = useState({ front: null, back: null });
  const mi = users.find((u) => u.n === ME) || {};
  const renov = acceso === "suscrito";
  const planAct = renov ? nivel : "Profesional";
  const pr = prorrateo(precioDe(cfg, plan), cfg.dia);
  const planRen = mi.planProx || planAct;
  const accion = !renov ? "alta" : plan === planAct ? "renov" : precioDe(cfg, plan) > precioDe(cfg, planAct) ? "mejora" : "baja";
  const monto = accion === "alta" ? pr.monto : accion === "renov" ? precioDe(cfg, planRen) : accion === "mejora" ? Math.round(((precioDe(cfg, plan) - precioDe(cfg, planAct)) * pr.resta) / pr.ciclo) : 0;
  const mios = pagos.filter((p) => p.de === ME).sort((a, b) => b.iso.localeCompare(a.iso));
  const pend = mios.find((p) => p.est === "Pendiente");
  const rech = mios[0] && mios[0].est === "Rechazado" ? mios[0] : null;
  // El carnet se pide UNA sola vez: en la primera inscripción. Renovaciones, mejoras
  // o volver a pagar después de vencer ya no lo piden.
  const yaVerificado = !!(mi.ci && (mi.ci.front || mi.ci.demo)) || !!mi.insc || mios.some((p) => p.est === "Aprobado");
  const necesitaCi = !renov && !yaVerificado;
  const listo = (!necesitaCi || !!(ci.front && ci.back)) && !!f.comp;
  const enviar = () => {
    if (necesitaCi && !(ci.front && ci.back)) { flash("Sube la foto de tu carnet (anverso y reverso) para continuar."); return; }
    if (!f.comp) { flash("Sube la foto del comprobante (baucher) para continuar."); return; }
    setUsers(users.map((u) => (u.n === ME ? { ...u, ...(ci.front && ci.back && !u.ci ? { ci: { front: ci.front, back: ci.back } } : {}), ...(u.insc ? {} : { insc: { plan, f: isoOf(HOY) } }) } : u)));
    setPagos([{ id: "n" + Date.now(), de: ME, plan: accion === "renov" ? planRen : plan, monto, iso: isoOf(HOY), tipo: TIPOS_PAGO[accion], metodo: metodo === "QR" ? "QR" : "Cuenta", ref: f.ref.trim(), est: "Pendiente", comp: f.comp, nota: accion === "renov" ? "Mes completo" : accion === "mejora" ? `Diferencia entre planes · ${pr.resta} de ${pr.ciclo} días` : `${pr.resta} de ${pr.ciclo} días (prorrateo hasta ${fechaL(pr.fin)})` }, ...pagos]);
    setF({ ref: "", comp: null });
    flash("Comprobante enviado. Te avisaremos cuando se verifique el pago.");
  };
  const est = acceso === "prueba" ? [`Prueba gratuita · inicio ${new Date(trial.inicio).toLocaleString("es-BO")} · vence ${new Date(trial.fin).toLocaleString("es-BO")}`, C.brandSoft, C.brandDk] : renov ? [`Plan ${planAct} activo · acceso hasta ${mi.venc ? fechaL(isoD(mi.venc)) : "—"}`, C.okSoft, C.ok] : ["Plan Gratuito · acceso limitado. Elige un plan para ver fichas completas y contactar captadores.", C.amberSoft, C.amber];
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: est[1], color: est[2] }}>{est[0]}</div>
      <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: C.lilaSoft, color: C.lilaDk }}>
        <div className="font-semibold">📅 Cómo se paga</div>
        <div>Todos los pagos se hacen el <b>día {cfg.dia} de cada mes</b>.{renov ? "" : ` Si te suscribes hoy, pagas solo los días que faltan hasta el próximo corte (${fechaL(pr.fin)}) y desde ahí pagas el mes completo.`}</div>
      </div>
      <div className="grid gap-2">{cfg.planes.map((pl) => { const p = pl.nombre; const x = prorrateo(pl.precio, cfg.dia); return (
        <button key={p} onClick={() => setPlan(p)} className="rounded-2xl p-3 text-left" style={{ background: C.card, border: `2px solid ${plan === p ? C.lila : C.line}` }}>
          <div className="font-semibold" style={{ color: C.ink }}>{p}{renov && planAct === p && <span className="text-xs ml-2 px-1.5 py-0.5 rounded-md" style={{ background: C.okSoft, color: C.ok }}>Tu plan</span>}</div>
          <div style={{ ...serif, color: C.ink, fontSize: 20, fontWeight: 700 }}>{bs(pl.precio)}<span className="text-xs" style={{ color: C.mute }}> /mes</span></div>
          <ul className="text-xs mt-1 space-y-0.5" style={{ color: C.mute }}>{(PLAN_BEN[p] || []).map((b) => <li key={b}>• {b}</li>)}</ul>
          <div className="text-xs mt-1 font-semibold" style={{ color: C.lilaDk }}>{!renov ? `Hoy pagas ${bs(x.monto)}` : p === planAct ? `Renovación: ${bs(precioDe(cfg, planRen))}` : pl.precio > precioDe(cfg, planAct) ? `Mejora hoy: ${bs(Math.round(((pl.precio - precioDe(cfg, planAct)) * x.resta) / x.ciclo))}` : "Sin pago ahora · desde el próximo corte"}</div>
        </button>); })}</div>
      <div className="rounded-xl p-3 text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}>
        {accion === "renov" ? <>Tu renovación del mes completo ({planRen}): <b>{bs(monto)}</b>.{mi.planProx ? " Incluye el cambio de plan que programaste." : ""}</> : accion === "mejora" ? <>Mejora a <b>{plan}</b>: hoy pagas solo la diferencia por los {pr.resta} de {pr.ciclo} días que quedan: <b>{bs(monto)}</b>. Desde el próximo corte pagas {bs(precioDe(cfg, plan))}.</> : accion === "baja" ? <>Cambio a <b>{plan}</b>: sin pago ahora.</> : <>Primer pago prorrateado: <b>{bs(monto)}</b> ({pr.resta} de {pr.ciclo} días, hasta el {fechaL(pr.fin)}). Desde el {fechaL(pr.fin)} pagas <b>{bs(precioDe(cfg, plan))}</b> cada mes.</>}
      </div>
      {accion === "baja" ? <div className="rounded-xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}><div className="text-sm" style={{ color: C.ink }}>Bajar a <b>{plan}</b> no genera pago ahora. Mantienes {planAct} hasta el próximo corte y desde entonces pagas {bs(precioDe(cfg, plan))} al mes.</div>{mi.planProx === plan ? <div className="text-xs" style={{ color: C.ok }}>✓ Cambio programado para el próximo corte</div> : <button onClick={() => { setUsers(users.map((u) => (u.n === ME ? { ...u, planProx: plan } : u))); flash(`Cambio a ${plan} programado para el próximo corte.`); }} className="w-full py-2.5 rounded-xl font-semibold text-white" style={{ background: C.lila }}>Programar cambio a {plan}</button>}</div> : pend ? <div className="rounded-xl p-3 text-sm" style={{ background: C.amberSoft, color: C.amber }}>⏳ Tu pago de {bs(pend.monto)} está en verificación. Te habilitaremos en cuanto se confirme.</div> : <>
        {rech && <div className="rounded-xl p-3 text-sm" style={{ background: C.redSoft, color: C.red }}>Tu último pago fue rechazado: {rech.mot}. Puedes enviarlo de nuevo.</div>}
        {necesitaCi ? <div className="rounded-xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>🪪 Verificación de identidad (solo esta vez)</div>
          <div className="text-xs" style={{ color: C.mute }}>Como es tu primera inscripción, necesitamos una foto de tu carnet por ambos lados. Solo la ve el equipo administrador y no se volverá a pedir.</div>
          <div className="grid grid-cols-2 gap-2">{[["front", "Anverso"], ["back", "Reverso"]].map(([k, l]) => <label key={k} className="flex items-center justify-center rounded-xl text-xs text-center cursor-pointer overflow-hidden" style={{ height: 96, border: `1px dashed ${C.mute}`, color: C.mute }}>{ci[k] ? <img src={ci[k]} alt={l} className="w-full h-full object-cover" /> : `📷 ${l}`}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const u = e.target.files[0] && await subir(e.target.files[0]); if (u) setCi((x) => ({ ...x, [k]: u })); }} /></label>)}</div>
        </div> : <div className="rounded-xl p-2.5 text-xs" style={{ background: C.okSoft, color: C.ok }}>🪪 Identidad ya verificada · no necesitas volver a subir tu carnet.</div>}
        <Seg o={["QR", "Cuenta bancaria"]} v={metodo} set={setMetodo} />
        {metodo === "QR" ? <div className="flex flex-col items-center gap-2">{cfg.qr ? <img src={cfg.qr} alt="QR de pago" className="rounded-xl" style={{ width: 170, height: 170, objectFit: "cover" }} /> : <div className="flex items-center justify-center rounded-xl text-xs text-center" style={{ width: 170, height: 170, border: `1px dashed ${C.mute}`, color: C.mute }}>QR de ejemplo<br />(lo sube el administrador)</div>}<div className="text-sm" style={{ color: C.ink }}>Escanea y paga exactamente <b>{bs(monto)}</b></div></div>
          : <div className="rounded-xl p-3 text-sm space-y-0.5" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><div>Titular: <b>{cfg.titular}</b></div><div>Banco: {cfg.banco}</div><div>Cuenta: {cfg.cuenta}</div><div>Monto exacto: <b>{bs(monto)}</b></div></div>}
        <label className="block w-full py-2.5 rounded-xl text-sm text-center cursor-pointer" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>{f.comp ? "✓ Comprobante cargado (cambiar)" : "🧾 Subir foto del comprobante (baucher)"}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const u = e.target.files[0] && await subir(e.target.files[0]); if (u) setF((x) => ({ ...x, comp: u })); }} /></label>
        <input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="Número de comprobante o referencia (opcional)" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} />
        <div className="text-xs space-y-0.5" style={{ color: C.mute }}>{necesitaCi && <div>{ci.front && ci.back ? "✅" : "⬜"} Carnet: anverso y reverso</div>}<div>{f.comp ? "✅" : "⬜"} Foto del comprobante (baucher)</div></div>
        <button onClick={enviar} disabled={!listo} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: listo ? C.grad : C.mute }}>Ya pagué: enviar comprobante</button>
      </>}
      {mios.length > 0 && <div className="text-sm font-semibold pt-1" style={{ color: C.ink }}>Mis pagos</div>}
      {mios.slice(0, 6).map((p) => <div key={p.id} className="rounded-xl p-2.5 flex justify-between items-center text-sm" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }}><span>{fechaL(isoD(p.iso))} · {p.plan}<div className="text-xs" style={{ color: C.mute }}>{p.tipo}</div></span><span className="text-right"><b>{bs(p.monto)}</b><div className="text-xs" style={{ color: p.est === "Aprobado" ? C.ok : p.est === "Rechazado" ? C.red : C.amber }}>{p.est}</div></span></div>)}
    </div>
  );
}

function NuevoReporte({ perm, props, pagos, ops, visitas, onSend, onClose, nivel }) {
  const tipos = Object.keys(REP_TIPOS).filter((k) => perm.report || !["Agente", "Cierre o comisión"].includes(k));
  const [f, setF] = useState({ tipo: "", m: "", rel: "", det: "", pagado: "", debia: "", fo: [] });
  const s = (k) => (v) => setF({ ...f, [k]: v });
  const agentes = [...new Set(props.map((x) => x.cap.n))].filter((n) => n !== ME);
  const opciones = f.tipo === "Pago o suscripción" ? pagos.filter((p) => p.de === ME).map((p) => `${fechaL(isoD(p.iso))} · ${p.plan} · ${bs(p.monto)} · ${p.est}`) : f.tipo === "Agente" ? agentes : f.tipo === "Propiedad" ? props.map((p) => p.t) : f.tipo === "Cierre o comisión" ? ops.map((o) => `${o.fecha} · ${o.t} · con ${o.colab}`) : f.tipo === "Visita" ? visitas.map((v) => `${v.f} ${v.h} · ${v.cl}`) : [];
  const ok = f.tipo && f.m && f.det.trim().length >= 20 && (f.tipo !== "Agente" || f.rel);
  const dif = (+f.pagado || 0) - (+f.debia || 0);
  return (
    <div className="rounded-2xl p-3 space-y-3" style={{ background: C.lilaSoft }}>
      <div className="flex justify-between items-center"><div className="font-semibold text-sm" style={{ color: C.lilaDk }}>Nuevo reporte o consulta</div><button onClick={onClose} className="text-xs" style={{ color: C.mute }}>Cerrar</button></div>
      <Fld l="¿Sobre qué es?"><Seg o={tipos} v={f.tipo} set={(v) => setF({ ...f, tipo: v, m: "", rel: "" })} /></Fld>
      {f.tipo && <Fld l="Motivo"><Seg o={REP_TIPOS[f.tipo]} v={f.m} set={s("m")} /></Fld>}
      {f.tipo && opciones.length > 0 && <Fld l={f.tipo === "Agente" ? "Agente *" : "Relacionado con (opcional)"}><select value={f.rel} onChange={(e) => s("rel")(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={inp}><option value="">Elige</option>{opciones.map((o) => <option key={o} value={o}>{o}</option>)}</select></Fld>}
      {f.tipo === "Pago o suscripción" && <div className="grid grid-cols-2 gap-3"><Fld l="Monto que pagaste (Bs)"><input value={f.pagado} onChange={(e) => s("pagado")(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld><Fld l="Monto que debías pagar (Bs)"><input value={f.debia} onChange={(e) => s("debia")(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>{(f.pagado || f.debia) && <div className="col-span-2 text-xs" style={{ color: dif ? C.amber : C.ok }}>{dif > 0 ? `Pagaste ${bs(dif)} de más` : dif < 0 ? `Pagaste ${bs(-dif)} de menos` : "Los montos coinciden"}</div>}</div>}
      <Fld l="Cuéntanos qué pasó"><textarea rows={4} value={f.det} onChange={(e) => s("det")(e.target.value)} placeholder="Con fechas y datos concretos (mínimo 20 caracteres)" className="w-full rounded-xl px-3 py-2 text-sm" style={inp} /></Fld>
      <label className="block w-full py-2.5 rounded-xl text-sm text-center cursor-pointer" style={{ border: `1px dashed ${C.mute}`, color: C.mute }}>📎 Subir pruebas (capturas, comprobantes, fotos)<input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { const u = await subirVarios(e.target.files); setF((x) => ({ ...x, fo: [...x.fo, ...u] })); }} /></label>
      {f.fo.length > 0 && <div className="flex gap-2 overflow-x-auto">{f.fo.map((u, i) => <div key={u} className="relative shrink-0"><img src={u} alt="Prueba" className="rounded-lg object-cover" style={{ width: 64, height: 64 }} /><button onClick={() => s("fo")(f.fo.filter((_, j) => j !== i))} className="absolute top-0 right-0 text-xs px-1 rounded-bl-lg" style={{ background: C.ink, color: "#fff" }}>✕</button></div>)}</div>}
      <div className="text-xs" style={{ color: C.mute }}>Solo el equipo administrador ve este reporte y sus pruebas.{nivel === "Premium" ? " Como Premium, tu reporte se marca como prioritario." : ""}</div>
      <button disabled={!ok} onClick={() => onSend({ id: Date.now(), tipo: f.tipo, m: f.m, ag: f.tipo === "Agente" ? f.rel : null, rel: f.rel, det: f.det.trim(), de: ME, pruebas: f.fo, prio: nivel === "Premium", montos: f.tipo === "Pago o suscripción" && (f.pagado || f.debia) ? { pagado: +f.pagado || 0, debia: +f.debia || 0 } : null, est: "Pendiente" })} className="w-full py-3 rounded-xl font-semibold text-white" style={{ background: ok ? C.grad : C.mute }}>Enviar</button>
    </div>
  );
}

function Autos({ autos, setAutos }) {
  const set = (k, patch) => setAutos({ ...autos, [k]: { ...autos[k], ...patch } });
  const reglas = [["vig", "Captaciones sin confirmar", "Avisarme cuando una captación activa lleve", "días sin confirmarse"], ["vis", "Pocas visualizaciones", "Avisarme cuando una captación activa tenga menos de", "visualizaciones"], ["req", "Requerimientos sin movimiento", "Avisarme cuando un requerimiento lleve", "días sin cambiar de etapa"]];
  return (
    <div className="space-y-3">
      <div className="text-xs rounded-xl p-2.5" style={{ background: C.lilaSoft, color: C.lilaDk }}>Las alertas automáticas aparecen en tu centro de Alertas, calculadas con tus datos. En la versión final se evaluarán en el servidor de forma programada.</div>
      {reglas.map(([k, tt, a, b]) => (
        <div key={k} className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex justify-between items-center"><span className="text-sm font-semibold" style={{ color: C.ink }}>{tt}</span><Chip on={autos[k].on} onClick={() => set(k, { on: !autos[k].on })}>{autos[k].on ? "Activa" : "Inactiva"}</Chip></div>
          <div className="flex items-center flex-wrap gap-2 text-sm" style={{ color: C.ink }}>{a}<input value={autos[k].n} onChange={(e) => set(k, { n: +e.target.value.replace(/\D/g, "") || 0 })} inputMode="numeric" className="w-16 rounded-lg px-2 py-1 text-sm text-center" style={inp} />{b}</div>
        </div>
      ))}
      <Fld l="Recordatorio por defecto en nuevas visitas"><Seg o={RECS.map((r) => r[1])} v={(RECS.find((r) => r[0] === autos.recDef) || RECS[0])[1]} set={(l) => setAutos({ ...autos, recDef: RECS.find((r) => r[1] === l)[0] })} /></Fld>
    </div>
  );
}

function Informes({ props, clientes, ops, visitas, favs }) {
  const mias = props.filter((p) => p.cap.n === ME);
  const gu = (p) => (p.guardados || 0) + favs.filter((f) => f.pid === p.id).length;
  const filasCapt = [["Propiedad", "Estado", "Visualizaciones", "Guardados", "Visitas", "Días sin confirmar"], ...mias.map((p) => [p.t, p.est || "Disponible", p.vistas || 0, gu(p), visitas.filter((v) => v.p === p.id).length, p.dias])];
  const prom = mias.length ? Math.round(mias.reduce((a, p) => a + (p.vistas || 0), 0) / mias.length) : 0;
  const bsv = (c) => Math.round(c.mon === "USD" ? c.max * BOB : c.max);
  const nComp = (c) => props.filter((p) => (p.est || "Disponible") !== "Cerrado" && match(c, p)).length;
  const filasDem = [["Cliente", "Operación", "Ciudad", "Zona", "Presupuesto máx (Bs)", "Propiedades compatibles"], ...clientes.map((c) => [c.n, c.op, c.ciudad, c.zona || "—", bsv(c), nComp(c)])];
  const sinCoin = clientes.filter((c) => nComp(c) === 0);
  const presProm = clientes.length ? Math.round(clientes.reduce((a, c) => a + bsv(c), 0) / clientes.length) : 0;
  const filasEmb = [["Etapa", "Requerimientos"], ...ETAPAS.map((e) => [e, clientes.filter((c) => (c.etapa || "Nuevo") === e).length])];
  const ganados = clientes.filter((c) => c.etapa === "Cerrado ganado").length;
  const inactivos = clientes.filter((c) => (HOY - isoD(c.mov || isoOf(HOY))) / 864e5 >= 7);
  const Card = ({ tt, nota, filas, arch, children }) => (
    <div className="rounded-2xl p-3 space-y-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <div className="flex justify-between items-center"><div className="text-sm font-semibold" style={{ color: C.ink }}>{tt}</div><button onClick={() => descargarCsv(arch, filas)} className="text-xs underline" style={{ color: C.brandDk }}>⬇ CSV</button></div>
      {children}<div className="text-xs" style={{ color: C.mute }}>{nota}</div>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="text-xs" style={{ color: C.mute }}>Se calculan con tus captaciones, requerimientos, visitas y cierres registrados (en esta vista previa son datos de ejemplo).</div>
      <Card tt="Rendimiento de mis captaciones" arch="informe-captaciones.csv" filas={filasCapt} nota={`Promedio de visualizaciones por captación: ${prom}.`}>
        {mias.map((p) => <div key={p.id} className="flex justify-between text-xs" style={{ color: C.ink }}><span className="truncate pr-2">{p.t}</span><span style={{ whiteSpace: "nowrap" }}>👁 {p.vistas || 0} · ♥ {gu(p)} · 📅 {visitas.filter((v) => v.p === p.id).length}</span></div>)}
        {!mias.length && <div className="text-xs" style={{ color: C.mute }}>Aún no tienes captaciones.</div>}
      </Card>
      <Card tt="Demanda de mis requerimientos" arch="informe-demanda.csv" filas={filasDem} nota="Con tus requerimientos. La demanda agregada de toda la red requiere el servidor en la versión final.">
        <div className="text-xs" style={{ color: C.ink }}>{clientes.length} requerimientos · presupuesto promedio {bs(presProm)} · sin propiedades compatibles: {sinCoin.length}{sinCoin.length ? ` (${sinCoin.map((c) => c.n).join(", ")})` : ""}</div>
        {["Venta", "Alquiler", "Anticrético", "Preventa"].map((o) => <div key={o} className="flex items-center gap-2 text-xs" style={{ color: C.ink }}><span style={{ width: 78 }}>{o}</span><div className="flex-1 rounded-full" style={{ background: C.line, height: 8 }}><div className="rounded-full" style={{ width: `${(clientes.filter((c) => c.op === o).length / Math.max(1, clientes.length)) * 100}%`, height: 8, background: C.lila }} /></div><span>{clientes.filter((c) => c.op === o).length}</span></div>)}
      </Card>
      <Card tt="Clientes y oportunidades" arch="informe-oportunidades.csv" filas={filasEmb} nota={`Cerrados ganados: ${ganados} de ${clientes.length} (${clientes.length ? Math.round((ganados / clientes.length) * 100) : 0}%). Sin movimiento hace 7 días o más: ${inactivos.length}.`}>
        {ETAPAS.map((e) => <div key={e} className="flex items-center gap-2 text-xs" style={{ color: C.ink }}><span style={{ width: 92 }}>{e}</span><div className="flex-1 rounded-full" style={{ background: C.line, height: 8 }}><div className="rounded-full" style={{ width: `${(clientes.filter((c) => (c.etapa || "Nuevo") === e).length / Math.max(1, clientes.length)) * 100}%`, height: 8, background: C.grad }} /></div><span>{clientes.filter((c) => (c.etapa || "Nuevo") === e).length}</span></div>)}
      </Card>
      <Card tt="Mis cierres" arch="informe-cierres.csv" filas={[["Fecha", "Propiedad", "Tipo", "Monto", "Moneda", "Comisión", "Agente", "Rol"], ...ops.map((o) => [o.iso, o.t, o.op, o.monto, o.mon, o.com, o.colab, o.rol])]} nota="Exportación de todos tus cierres registrados." />
    </div>
  );
}

const LOGO_ISO = "data:image/png;base64,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";
const LOGO_WM = "data:image/png;base64,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";
export default function Vortex({ inicial, sesion, onMenu, cuentas, onIngresar, onRegistro }) {
  const esAdmin = sesion.rol === "admin";
  const visitante = sesion.rol === "visitante";
  const [tab, setTab] = useState("buscar");
  const [sim, setSim] = useState(esAdmin ? "admin" : "auto");
  const [sel, setSel] = useState(null);
  const [props, setProps] = useSync("propiedades", inicial.propiedades, sesion);
  const [clientes, setClientes] = useSync("clientes", inicial.clientes, sesion);
  const [favs, setFavs] = useSync("favoritos", inicial.favoritos, sesion);
  const [notifs, setNotifs] = useSync("notificaciones", inicial.notificaciones, sesion);
  const [perfilDe, setPerfilDe] = useState(null);
  const [reviews, setReviews] = useSync("resenas", inicial.resenas, sesion);
  const [fin, setFin] = useState(() => { const yo = inicial.perfiles.find((u) => u.n === ME) || {}; return esAdmin ? Date.now() + 48 * 36e5 : yo.est === "Prueba" && yo.prueba ? yo.prueba.fin : 0; });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const [ops, setOps] = useSync("operaciones", inicial.operaciones, sesion);
  const [reports, setReports] = useSync("reportes", inicial.reportes, sesion);
  const [users, setUsers] = useSync("perfiles", inicial.perfiles, sesion);
  const [audit, setAudit] = useSync("auditoria", inicial.auditoria, sesion);
  const [reportando, setReportando] = useState(null);
  const [pagos, setPagos] = useSync("pagos", inicial.pagos, sesion);
  const [cfg, setCfg] = useSyncObj("ajustes", "cfg", { ...CFG0, ...(inicial.cfg || {}) }, sesion);
  const [perfilSub, setPerfilSub] = useState(null);
  const [busq, setBusq] = useSync("busquedas", inicial.busquedas, sesion);
  const [autos, setAutos] = useSyncObj("ajustes_usuario", "autos", { recDef: 0, vig: { on: true, n: 5 }, vis: { on: false, n: 30 }, req: { on: true, n: 7 }, ...(inicial.autos || {}) }, sesion);
  const [sugs, setSugs] = useSync("sugerencias", inicial.sugerencias, sesion);
  const [visitas, setVisitas] = useSync("visitas", inicial.visitas, sesion);
  const [toast, setToast] = useState("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const mi = users.find((u) => u.n === ME) || {};
  PERFIL.datos = mi.perfil || null;
  PERFIL.guardar = (d) => setUsers((us) => us.map((u) => (u.n === ME ? { ...u, perfil: d } : u)));
  const iniciales = ME.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("") || "?";
  const planUser = mi.est === "Activo" && mi.venc && mi.venc >= isoOf(HOY) && (ORD[mi.plan] || 0) >= 1 ? mi.plan : null;
  const vivo = now < fin;
  const nivel = sim === "admin" ? "admin" : sim === "auto" ? (planUser || (vivo ? "prueba" : "gratuito")) : sim === "prueba" ? (vivo ? "prueba" : "gratuito") : sim;
  const perm = permisos(nivel);
  const acceso = nivel === "gratuito" ? "vencido" : ["Inicial", "Profesional", "Premium"].includes(nivel) ? "suscrito" : nivel;
  useEffect(() => { setUsers((us) => (us.some((u) => u.est === "Prueba" && u.prueba && now > u.prueba.fin) ? us.map((u) => (u.est === "Prueba" && u.prueba && now > u.prueba.fin ? { ...u, est: "Vencido" } : u)) : us)); }, [now]);
  const onPublicada = (p) => { if (!perm.inversa) return; clientes.forEach((r) => { if (match(r, p)) notify("Nueva propiedad compatible", `${p.t} coincide con el requerimiento de ${r.n}`, { tab: "buscar", p: p.id }, "🔔"); }); };
  const goSub = () => { if (visitante) { onRegistro && onRegistro(); return; } setSel(null); setTab("perfil"); setPerfilSub("sus"); };
  // ── Vigilancia: avisa de propiedades nuevas compatibles con mis requerimientos
  //    y de cambios en propiedades que guardé (completo en Premium, resumido en los demás planes)
  const [vig, setVig] = useSyncObj("ajustes_usuario", "vigilancia", { ini: false, f: {}, ...(inicial.vigilancia || {}) }, sesion);
  useEffect(() => {
    const resumen = (p) => ({ pr: p.precio, mo: p.mon, es: p.est || "Disponible", fo: (p.fotos || []).length, t: p.t, d: (p.desc || "").length + (p.condComp || "").length });
    const f = { ...(vig.f || {}) }, nuevos = [];
    let cambio = !vig.ini;
    const ajenas = props.filter((p) => p.cap && p.cap.n !== ME);
    const ids = new Set(ajenas.map((p) => String(p.id)));
    for (const p of ajenas) {
      const k = String(p.id), r = resumen(p), prev = f[k];
      if (!prev) {
        if (vig.ini && !["Cerrado", "Caído"].includes(r.es)) clientes.forEach((c) => { const m = match(c, p); if (m) nuevos.push({ ic: "🏠", t: `Nueva propiedad compatible con ${c.n}`, tPro: "Hay una nueva propiedad compatible con uno de tus requerimientos", s: `${p.t} · ${money(p)} · ${p.zona}, ${p.ciudad} · ${m.pct}% de coincidencia`, to: { tab: "buscar", p: p.id }, pro: true }); });
        f[k] = r; cambio = true;
      } else if (JSON.stringify(prev) !== JSON.stringify(r)) {
        if (favs.some((x) => x.pid === p.id)) {
          const det = [];
          if (prev.pr !== r.pr || prev.mo !== r.mo) det.push(`precio ${money({ ...p, precio: prev.pr, mon: prev.mo })} → ${money(p)}`);
          if (prev.es !== r.es) det.push(`ahora está ${r.es.toLowerCase()}`);
          if (r.fo > prev.fo) det.push(`${r.fo - prev.fo} foto${r.fo - prev.fo > 1 ? "s" : ""} nueva${r.fo - prev.fo > 1 ? "s" : ""}`);
          if (prev.t !== r.t || prev.d !== r.d) det.push("descripción actualizada");
          if (det.length) nuevos.push({ ic: "♥", t: "Se actualizó una propiedad que guardaste", tPro: "Una propiedad que guardaste tuvo cambios", s: `${p.t}: ${det.join(" · ")}`, to: { tab: "buscar", p: p.id }, pro: true });
        }
        f[k] = r; cambio = true;
      }
    }
    for (const k of Object.keys(f)) if (!ids.has(k)) { delete f[k]; cambio = true; }
    if (nuevos.length) setNotifs((n) => [...nuevos.map((x, i) => ({ id: Date.now() + i, h: "Ahora", ...x })), ...n]);
    if (cambio) setVig({ ini: true, f });
  }, [props]);
  const notify = (t, s, to, ic = "📅") => setNotifs((n) => [{ id: Date.now(), ic, t, s, to, h: "Ahora" }, ...n]);
  const open = (p) => { setSel(p); if (!visitante && p.cap.n !== ME) setProps((ps) => ps.map((x) => (x.id === p.id ? { ...x, vistas: (x.vistas || 0) + 1 } : x))); };
  const rate = (n) => { const r = reviews.filter((x) => x.ag === n); return r.length ? { avg: r.reduce((a, x) => a + x.s, 0) / r.length, n: r.length } : null; };
  const delCliente = (id) => { setClientes(clientes.filter((c) => c.id !== id)); setFavs(favs.filter((f) => f.cid !== id)); flash("Requerimiento eliminado."); };
  const toggleFav = (pid, cid) => setFavs(favs.some((f) => f.pid === pid && f.cid === cid) ? favs.filter((f) => !(f.pid === pid && f.cid === cid)) : [...favs, { pid, cid }]);
  const go = (to) => { setTab(to.tab); setSel(to.p ? props.find((x) => x.id === to.p) : null); };
  const agendar = (p) => { const m = new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate() + 1); setVisitas([...visitas, { id: Date.now(), p: p.id, cl: clientes[0] ? clientes[0].n : "Cliente", f: isoOf(m), h: "09:00", ag: p.cap.n, est: "Pendiente" }]); notify("Visita agendada", `${p.t} · ${fechaL(m)}, 09:00`, { tab: "visitas" }); flash(`Visita agendada para mañana (${fechaL(m)}) a las 09:00. Puedes cambiarla en Visitas.`); };
  const rem = Math.max(0, fin - now), cd = [Math.floor(rem / 3.6e6), Math.floor(rem / 6e4) % 60, Math.floor(rem / 1e3) % 60].map((x) => String(x).padStart(2, "0")).join(":");
  const tabs = [["buscar", "🔍", "Buscar"], ["clientes", "👤", "Requerim."], ["visitas", "📅", "Visitas"], ["alertas", "🔔", "Alertas"], ["perfil", "🧑‍💼", "Perfil"]];
  const banner = visitante ? ["👋 Estás como visitante (plan Gratuito) · Regístrate gratis y prueba 48 h con acceso completo", C.lilaSoft, C.lilaDk] : acceso === "prueba" ? [`⏱ Prueba gratuita · te quedan ${cd}`, C.brandSoft, C.brandDk] : acceso === "vencido" ? ["Plan Gratuito · acceso limitado", C.amberSoft, C.amber] : null;

  return (
    <div className="vx-shell" style={{ fontFamily: "'Montserrat', 'Avenir Next', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');`}</style>
      {esAdmin && <div className="vx-simbar" style={{ width: "100%", maxWidth: 520 }}>
        <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 text-xs" style={{ color: C.ink }}>
          <span className="shrink-0 font-semibold">👁 Ver la app como:</span>
          {CUENTAS.map(([k, l]) => <span key={k} className="shrink-0"><Chip on={sim === k} onClick={() => { setSim(k); setSel(null); if (k === "prueba") setFin(Date.now() + 48 * 36e5); }}>{l}</Chip></span>)}
          {sim === "prueba" && vivo && <span className="shrink-0"><Chip on={false} onClick={() => setFin(Date.now() - 1000)}>⏩ Terminar prueba</Chip></span>}
        </div>
        <div className="mx-2 mb-2 rounded-xl px-3 py-2 text-xs" style={{ background: "#fff", color: C.mute, border: `1px solid ${C.line}` }}>
          <b style={{ color: C.lilaDk }}>{sim === "prueba" && !vivo ? "Prueba terminada → Gratuito" : (CUENTAS.find((c) => c[0] === sim) || [0, "Cuenta"])[1]}:</b> {RESUMEN[sim === "prueba" && !vivo ? "gratuito" : sim]}
          {sim !== "admin" && <div className="mt-1" style={{ color: C.amber }}>Vista previa: lo que publiques o registres aquí se guarda con tu usuario de administrador.</div>}
        </div>
      </div>}
      <div className="relative flex flex-col overflow-hidden vx-frame" style={{ background: C.bg }}>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ background: "#fff" }}>
          <div className="flex items-center gap-2"><img src={LOGO_ISO} alt="Vortex" style={{ height: 36 }} /><div><img src={LOGO_WM} alt="Vortex" style={{ height: 17, display: "block" }} /><div style={{ fontSize: 9, letterSpacing: ".12em", color: C.mute, marginTop: 4 }}>{acceso === "admin" ? "PANEL SUPERADMIN" : "RED DE AGENTES INMOBILIARIOS"}</div></div></div>
          {visitante ? <div className="flex items-center gap-2"><button onClick={onIngresar} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: C.lilaSoft, color: C.lilaDk }}>Ingresar</button><button onClick={onRegistro} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: C.grad }}>Registrarme</button></div> : <div className="flex items-center gap-2"><button onClick={onMenu} title="Mi cuenta" className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: C.lilaSoft, color: C.lilaDk }}>⚙️</button><button onClick={() => { setTab("perfil"); setSel(null); }} className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: C.lila }}>{iniciales}</button></div>}
        </div>
        <div style={{ height: 3, background: C.grad }} />
        {banner && <button onClick={goSub} className="w-full text-left text-xs px-4 py-2 font-medium" style={{ background: banner[1], color: banner[2] }}>{banner[0]}{visitante ? " ›" : " · Ver planes ›"}</button>}
        <div className="flex-1 overflow-y-auto">
          {acceso === "admin" ? <Admin reports={reports} setReports={setReports} users={users} setUsers={setUsers} audit={audit} setAudit={setAudit} props={props} ops={ops} sugs={sugs} setSugs={setSugs} pagos={pagos} setPagos={setPagos} cfg={cfg} setCfg={setCfg} flash={flash} cuentas={cuentas} />
            : sel ? <Detalle p={sel} acceso={acceso} onBack={() => setSel(null)} onVisit={agendar} onReport={setReportando} users={users} onSub={goSub} perm={perm} rate={rate} onProfile={setPerfilDe} favs={favs} toggleFav={toggleFav} clientes={clientes} flash={flash} />
            : visitante && tab !== "buscar" ? <Invitacion tab={tab} onRegistro={onRegistro} onIngresar={onIngresar} />
            : tab === "buscar" ? <Buscar acceso={acceso} open={open} props={props} rate={rate} favs={favs} perm={perm} goSub={goSub} busq={busq} setBusq={setBusq} />
            : tab === "clientes" ? (perm.req ? <Clientes acceso={acceso} open={open} props={props} clientes={clientes} setClientes={setClientes} favs={favs} toggleFav={toggleFav} delCliente={delCliente} perm={perm} visitas={visitas} goSub={goSub} /> : <div className="p-4"><Lock t="Requerimientos de clientes" plan="Inicial" go={goSub} /></div>)
            : tab === "visitas" ? (perm.vis ? <Visitas visitas={visitas} setVisitas={setVisitas} props={props} clientes={clientes} flash={flash} notify={notify} users={users} perm={perm} autos={autos} /> : <div className="p-4"><Lock t="Agenda de visitas" plan="Inicial" go={goSub} /></div>)
            : tab === "alertas" ? <Alertas go={go} notifs={notifs} visitas={visitas} props={props} clientes={clientes} perm={perm} autos={autos} goSub={goSub} />
            : <Perfil acceso={acceso} props={props} setProps={setProps} flash={flash} ops={ops} setOps={setOps} reports={reports} favs={favs} reviews={reviews} setReviews={setReviews} onReport={setReportando} sugs={sugs} setSugs={setSugs} users={users} setUsers={setUsers} pagos={pagos} setPagos={setPagos} cfg={cfg} subInit={perfilSub} clearSub={() => setPerfilSub(null)} perm={perm} nivel={nivel} goSub={goSub} onPublicada={onPublicada} trial={{ inicio: fin - 48 * 36e5, fin }} setReports={setReports} clientes={clientes} visitas={visitas} autos={autos} setAutos={setAutos} />}
        </div>
        {perfilDe && <Ficha n={perfilDe} props={props} users={users} rate={rate} onClose={() => setPerfilDe(null)} />}
        {reportando && <Reportar p={reportando} onClose={() => setReportando(null)} onSend={(r) => { setReports([{ ...r, prio: nivel === "Premium" }, ...reports]); setReportando(null); flash(nivel === "Premium" ? "Reporte enviado con prioridad." : "Reporte enviado. Un administrador lo revisará."); }} />}
        {toast && <div className="absolute left-4 right-4 bottom-20 text-sm text-white px-3 py-2 rounded-xl text-center" style={{ background: C.lila }}>{toast}</div>}
        <div className="grid grid-cols-5" style={{ display: acceso === "admin" ? "none" : undefined, background: C.card, borderTop: `1px solid ${C.line}` }}>
          {tabs.map(([k, ic, l]) => (
            <button key={k} onClick={() => { setTab(k); setSel(null); }} className="py-2.5 flex flex-col items-center text-xs" style={{ color: tab === k && !sel ? C.brand : C.mute, fontWeight: tab === k ? 600 : 400 }}>
              <span className="text-lg">{ic}</span>{l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { LOGO_ISO, LOGO_WM, C };
