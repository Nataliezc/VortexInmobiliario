// ─────────────────────────────────────────────────────────────
//  Lee el "copy" (texto del anuncio) y detecta los datos de la
//  captación. Lo que no encuentra queda vacío para completarlo.
//  Funciona sin internet ni servicios externos.
// ─────────────────────────────────────────────────────────────

const NUM_PAL = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
const quitarTildes = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// "120.000" → 120000 · "1,500" → 1500 · "3.500,50" → 3500.5 · "85" → 85
export function aNumero(txt) {
  let s = String(txt).replace(/\s/g, "");
  if (!s) return NaN;
  const p = s.lastIndexOf("."), c = s.lastIndexOf(",");
  if (p >= 0 && c >= 0) { const dec = p > c ? "." : ","; s = s.replace(new RegExp(`\\${dec === "." ? "," : "."}`, "g"), "").replace(dec, "."); }
  else if (p >= 0 || c >= 0) {
    const sep = p >= 0 ? "." : ",", partes = s.split(sep);
    s = partes.length > 2 || (partes[partes.length - 1].length === 3 && partes[0].length <= 3) ? partes.join("") : partes.join(".");
  }
  return parseFloat(s);
}

const primero = (texto, reglas) => {
  // reglas: [[regex, valor]] → devuelve el valor de la coincidencia que aparece antes en el texto
  let mejor = null;
  for (const [re, val] of reglas) { const m = texto.match(re); if (m && (mejor === null || m.index < mejor.i)) mejor = { i: m.index, v: typeof val === "function" ? val(m) : val }; }
  return mejor ? mejor.v : "";
};

export function leerCopy(copy, ZONAS) {
  const original = String(copy || "").trim();
  const t = quitarTildes(original.toLowerCase()).replace(/\*/g, "");
  const d = {};

  // Operación
  d.op = primero(t, [[/anticretico/, "Anticrético"], [/pre-?\s?venta/, "Preventa"], [/\b(alquiler|alquila|alquilo|en renta|arriendo|renta mensual)\b/, "Alquiler"], [/\b(venta|se vende|vendo|en venta)\b/, "Venta"]]);

  // Tipo de inmueble
  const tipo = primero(t, [
    [/\b(departamento|depto|dpto|dep\.|monoambiente|garzonier|garsonier|penthouse|duplex|loft)\b/, "Departamento"],
    [/\bcasa\b/, "Casa"], [/\b(terreno|lote)\b/, "Terreno"], [/\boficinas?\b/, "Oficina"],
    [/\b(local comercial|local|tienda|comercial)\b/, "Comercial"],
    [/\b(galpon|quinta|edificio|habitacion|cuarto|cabana|hotel|consultorio|deposito)\b/, (m) => "Otro:" + m[1]],
  ]);
  if (tipo.startsWith("Otro:")) { d.tipo = "Otro"; const w = tipo.slice(5); d.tipoOtro = { galpon: "Galpón", habitacion: "Habitación", cabana: "Cabaña", deposito: "Depósito" }[w] || w.charAt(0).toUpperCase() + w.slice(1); }
  else d.tipo = tipo;

  // Ciudad y zona
  const CIUDADES = Object.keys(ZONAS);
  const alias = { cochabamba: "Cochabamba", cbba: "Cochabamba", "la paz": "La Paz", lpz: "La Paz", "santa cruz": "Santa Cruz", scz: "Santa Cruz" };
  d.ciudad = primero(t, Object.entries(alias).filter(([, c]) => CIUDADES.includes(c)).map(([a, c]) => [new RegExp(`\\b${a}\\b`), c]));
  const zonasPosibles = d.ciudad ? ZONAS[d.ciudad] : [...new Set(Object.values(ZONAS).flat())];
  let zona = primero(t, zonasPosibles.map((z) => [new RegExp(`\\b${quitarTildes(z.toLowerCase())}\\b`), z]));
  if (zona && !d.ciudad) { const c = CIUDADES.filter((c) => ZONAS[c].includes(zona)); if (c.length === 1) d.ciudad = c[0]; }
  if (!zona) {
    const m = original.match(/(?:zona|barrio|urbanizaci[oó]n|urb\.|ubicad[oa] en|ubicaci[oó]n:?)\s*:?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .]{2,28}?)(?=[,.;\n\r(]|\s+-|\s+(?:a |cerca|sobre|con|y )|$)/i);
    if (m) zona = m[1].trim().replace(/\s+/g, " ").replace(/^(la|el)\s+/i, "").replace(/\b\w/g, (l) => l.toUpperCase());
  }
  d.zona = zona || "";

  // Precio y moneda (se ignora el precio que habla del garaje)
  const sinGaraje = t.replace(/(garaje|parqueo|estacionamiento|cochera)[^\n.]{0,60}/g, " ");
  const MON = "(\\$us|us\\$|u\\$s|usd|\\$|dolares|bs\\.?|bolivianos)";
  const NUM = "(?<![\\w.,])(\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)";
  const reAntes = new RegExp(`${MON}\\s*${NUM}\\s*(mil|k)?`, "g");
  const reDesp = new RegExp(`${NUM}\\s*(mil|k)?\\s*${MON}`, "g");
  const cands = [];
  for (const m of sinGaraje.matchAll(reAntes)) cands.push({ i: m.index, mon: m[1], n: m[2], mil: m[3] });
  for (const m of sinGaraje.matchAll(reDesp)) cands.push({ i: m.index, mon: m[3], n: m[1], mil: m[2] });
  const kw = sinGaraje.search(/precio|alquiler|venta|anticretico|costo|valor|mensual/);
  cands.sort((a, b) => (kw >= 0 ? Math.abs(a.i - kw) - Math.abs(b.i - kw) : a.i - b.i));
  const c0 = cands.find((c) => aNumero(c.n) > 0);
  if (c0) {
    let n = aNumero(c0.n); if (c0.mil) n *= 1000;
    d.precio = String(Math.round(n));
    d.mon = /bs|boliviano/.test(c0.mon) ? "BOB" : "USD";
  } else { d.precio = ""; d.mon = ""; }

  // Dormitorios y baños
  const cuenta = (re) => { const m = t.match(re); if (!m) return ""; const v = NUM_PAL[m[1]] || parseInt(m[1], 10); return v ? String(v) : ""; };
  const N = "(\\d{1,2}|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)";
  d.dorm = cuenta(new RegExp(`${N}\\s*(?:dormitorios?|dorms?\\.?|habitaciones|habs?\\.?|recamaras?|cuartos|alcobas|ambientes? para dormir)\\b`));
  if (!d.dorm && /monoambiente|garzonier|garsonier/.test(t)) d.dorm = "1";
  d.ban = cuenta(new RegExp(`${N}\\s*(?:banos?|bano completo|banos completos)\\b`));
  if (!d.ban && /\bbano (privado|completo|social)\b/.test(t)) d.ban = "1";

  // Superficie
  const mm = t.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:m2|m²|mts2|mt2|mts\.?|metros cuadrados|metros|mtrs)(?=[^a-z0-9]|$)/) || t.match(/superficie[^\d]{0,15}(\d+(?:[.,]\d+)?)/);
  d.m2 = mm ? String(Math.round(aNumero(mm[1]))) : "";

  // Garaje
  const G = "(garaje|parqueo|estacionamiento|cochera|parking)";
  if (new RegExp(`(sin|no (tiene|cuenta con|incluye))\\s+${G}`).test(t)) d.garaje = "No";
  else if (new RegExp(`\\b${G}`).test(t) && !new RegExp(`${G}[^\\n.]{0,40}(aparte|adicional|extra|por separado)`).test(t)) d.garaje = "Sí";
  else if (new RegExp(`\\b${G}`).test(t)) d.garaje = "No";
  else d.garaje = "";
  d.gTipo = d.garaje === "Sí" ? (new RegExp(`${G}[^\\n.]{0,30}compartid`).test(t) ? "Compartido" : new RegExp(`${G}[^\\n.]{0,30}(independiente|propio|privado|exclusivo)`).test(t) ? "Independiente" : "") : "";
  const ga = t.match(new RegExp(`${G}[^\\n.]{0,40}(aparte|adicional|extra|por separado)[^\\n\\d]{0,30}(\\d[\\d.,]*)?`));
  d.gAparte = ga ? "Sí" : d.garaje ? "No" : "";
  d.gPrecio = ga && ga[3] ? String(Math.round(aNumero(ga[3]))) : "";

  // Mascotas
  if (/(no se aceptan|no acepta|no se permiten|no permite|sin|prohibid[oa]s?|no)\s+(las\s+)?mascotas/.test(t)) d.mascotas = "No";
  else if (/mascotas[^\n.]{0,40}(pequen|condici|consultar|previa|deposito|solo)/.test(t)) {
    d.mascotas = "Condicionado";
    const s = original.match(/mascotas[^\n.]{0,60}/i); d.mascCond = s ? s[0].replace(/^mascotas\s*:?\s*/i, "").trim() : "";
  } else if (/(acepta|aceptan|se permiten|permite|bienvenidas?)\s+(las\s+)?mascotas|pet\s?friendly|mascotas\s*:?\s*(si|bienvenid)/.test(t)) d.mascotas = "Sí";
  else d.mascotas = "";

  // Amoblado
  d.amoblado = /semi[\s-]?(amoblad|amueblad)/.test(t) ? "Semi-amoblado" : /(sin amoblar|sin muebles|no amoblad|no amueblad|\bvacio\b)/.test(t) ? "Vacío" : /(amoblad|amueblad)/.test(t) ? "Amoblado" : "";

  // Comisión y condiciones
  const com = original.match(/comisi[oó]n\s*:?\s*([^\n]{2,60})/i);
  d.com = com ? com[1].trim().replace(/[.;]$/, "") : "";
  const cond = original.split(/\n|(?<=\.)\s/).map((x) => x.trim()).filter((x) => /garant|contrato|adelanto|dep[oó]sito|requisit|papeles|m[ií]nimo|aval|expensas/i.test(x) && !/mascota/i.test(x));
  d.condComp = cond.join(" · ").slice(0, 300);

  // Título: primera línea con contenido útil
  const lineas = original.split(/\n/).map((x) => x.replace(/[*_#~]/g, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").trim()).filter((x) => x.length >= 8);
  let titulo = (lineas[0] || "").split(/(?<=[a-záéíóúñ0-9)])[.!?](?=\s|$)/i)[0].trim();
  if (titulo.length > 60) { let out = ""; for (const parte of titulo.split(",")) { if ((out + parte).length > 55 && out) break; out += (out ? "," : "") + parte; } titulo = out.trim(); }
  if (titulo.length > 70) titulo = titulo.slice(0, 70).replace(/\s+\S*$/, "");
  const letras = titulo.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, ""), mayus = letras.replace(/[^A-ZÁÉÍÓÚÑ]/g, "");
  if (letras && mayus.length / letras.length > 0.6) titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1).toLowerCase();
  d.t = titulo;

  d.desc = original;
  return d;
}

// Campos obligatorios para que la captación quede completa
export const NOMBRES_CAMPOS = { t: "título", op: "operación", tipo: "tipo de inmueble", tipoOtro: "qué tipo de inmueble es", ciudad: "ciudad", zona: "zona", precio: "precio", mon: "moneda", dorm: "dormitorios", ban: "baños", m2: "superficie", garaje: "garaje", gTipo: "tipo de garaje", gAparte: "garaje aparte", mascotas: "mascotas", mascCond: "condición para mascotas", amoblado: "estado del inmueble" };
export function camposFaltantes(f) {
  const vivienda = ["Casa", "Departamento"].includes(f.tipo);
  const req = ["t", "op", "tipo", "ciudad", "zona", "precio", "mon", "m2", "garaje", "gAparte", "mascotas", "amoblado"];
  if (f.tipo === "Otro") req.push("tipoOtro");
  if (vivienda) req.push("dorm", "ban");
  if (f.garaje === "Sí") req.push("gTipo");
  if (f.mascotas === "Condicionado") req.push("mascCond");
  return req.filter((k) => !String(f[k] ?? "").trim());
}
