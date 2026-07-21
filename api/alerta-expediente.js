// =============================================================================
//  /api/alerta-expediente.js  ·  Método NERI
//  CRON DIARIO (9am, ver vercel.json) — salud del expediente documental.
//
//  Reconstruido: la versión anterior leía "Expediente Docs" (JSON en el lead),
//  un campo que ya no se usa. La fuente real es la tabla Expediente Documentos
//  (21+ tipos, no 8). Este archivo hace dos cosas, ambas de solo lectura sobre
//  el estado real, nunca escribe "Estado del Documento":
//
//  1. 48h sin subir: si un documento sigue "Pendiente" +48h desde que se pidió,
//     dice en el lead (campo "Progreso Expediente") cuáles. Usa el checkbox
//     "Alerta 48h Enviada" por documento para no repetir el mismo aviso.
//
//  2. Semáforo de vigencia: entre los documentos YA validados que caducan a
//     los 60 días (mismo cálculo que expedientedocumentalpropietario), busca
//     el peor caso — Vigente / Por vencer / Vencido — y lo escribe en
//     Propiedades NERI > "Semáforo Documentos". De ahí lo lee la ficha.
//
//  Nunca truena el cron: reporta y sigue. También puede abrirse a mano:
//  /api/alerta-expediente.
//
//  Variables Vercel (ya en uso): AIRTABLE_TOKEN, AIRTABLE_BASE.
// =============================================================================

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';        // Leads Vendedores
const PROPS_TABLE = 'tblmco2JyXRiZGhaY';        // Propiedades NERI
const DOCS_TABLE = 'tblD7EpvfsFh0PLRr';         // Expediente Documentos

const HORAS_ALERTA = 48;

// Mismos 60 días que expediente-documentos.js — mantener alineado si cambia allá.
const VIGENCIA_DIAS = {
  constancia_fiscal: 60, domicilio: 60, predial: 60, agua_luz: 60,
  no_adeudo_predial: 60, no_adeudo_agua: 60, plano_catastral: 60,
  no_adeudo_mantenimiento: 60, carta_saldo: 60, exencion_isr: 60,
  licencia_terminacion_obra: 60, clabe_bancaria: 60,
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!BASE || !TOKEN) {
    return res.status(200).json({ ok: false, motivo: 'Faltan variables de Airtable.', revisados: 0 });
  }

  try {
    const [leads, props, docs] = await Promise.all([
      airList(LEADS_TABLE, "NOT({Token Expediente}='')", ['Folio', 'Progreso Expediente']),
      airList(PROPS_TABLE, "NOT({Folio Vendedor}='')", ['Folio Vendedor']),
      airList(DOCS_TABLE, '', ['Folio', 'Document ID', 'Estado del Documento', 'Fecha de Carga', 'Fecha Solicitud', 'Alerta 48h Enviada', 'Tipo de Documento']),
    ]);
    if (leads === null || props === null || docs === null) {
      return res.status(200).json({ ok: false, motivo: 'No se pudo leer Airtable.', revisados: 0 });
    }

    const propByFolio = new Map();
    for (const p of props) {
      const folio = p.fields['Folio Vendedor'];
      if (folio) propByFolio.set(folio, p.id);
    }

    const docsByFolio = new Map();
    for (const d of docs) {
      const folio = d.fields['Folio'];
      if (!folio) continue;
      if (!docsByFolio.has(folio)) docsByFolio.set(folio, []);
      docsByFolio.get(folio).push(d);
    }

    const ahora = Date.now();
    const limite48h = HORAS_ALERTA * 60 * 60 * 1000;
    let alertados48h = 0, semaforosEscritos = 0;

    for (const lead of leads) {
      const folio = lead.fields['Folio'];
      if (!folio) continue;
      const misDocs = docsByFolio.get(folio) || [];
      if (!misDocs.length) continue;

      // 1) 48h sin subir
      const pendientes48h = misDocs.filter(d => {
        const f = d.fields;
        if ((f['Estado del Documento'] || 'Pendiente') !== 'Pendiente') return false;
        if (f['Alerta 48h Enviada']) return false;
        const base = Date.parse(f['Fecha Solicitud'] || '');
        return !isNaN(base) && (ahora - base) >= limite48h;
      });
      if (pendientes48h.length) {
        const nombres = pendientes48h.map(d => d.fields['Tipo de Documento']).filter(Boolean).slice(0, 4);
        const etiqueta = 'Atención: ' + pendientes48h.length + ' documento(s) pendiente(s) +48h'
          + (nombres.length ? (' · ' + nombres.join(', ')) : '');
        try {
          await airPatch(LEADS_TABLE, lead.id, { 'Progreso Expediente': etiqueta });
          await Promise.all(pendientes48h.map(d => airPatch(DOCS_TABLE, d.id, { 'Alerta 48h Enviada': true }).catch(() => {})));
          alertados48h++;
        } catch (_) {}
      }

      // 2) Semáforo de vigencia — solo entre los que ya están Validados
      const propId = propByFolio.get(folio);
      if (!propId) continue;
      let peor = 'Vigente';
      for (const d of misDocs) {
        const f = d.fields;
        if (f['Estado del Documento'] !== 'Validado') continue;
        const dias = VIGENCIA_DIAS[f['Document ID']];
        if (!dias) continue;
        const vig = calcVigencia(f['Fecha de Carga'], dias);
        if (vig.estado === 'Vencido') { peor = 'Vencido'; break; }
        if (vig.estado === 'Por vencer' && peor !== 'Vencido') peor = 'Por vencer';
      }
      try {
        await airPatch(PROPS_TABLE, propId, { 'Semáforo Documentos': peor });
        semaforosEscritos++;
      } catch (_) {}
    }

    return res.status(200).json({ ok: true, revisados: leads.length, alertados48h, semaforosEscritos });
  } catch (e) {
    return res.status(200).json({ ok: false, motivo: String(e && e.message || e), revisados: 0 });
  }
};

/* ───────── mismo cálculo que expediente-documentos.js ───────── */
function calcVigencia(fechaCarga, vigenciaDias) {
  const dias = Number(vigenciaDias || 0);
  if (!dias || !fechaCarga) return { estado: '', dias_para_vencer: null };
  const loaded = new Date(fechaCarga);
  if (Number.isNaN(loaded.getTime())) return { estado: '', dias_para_vencer: null };
  const vence = new Date(loaded.getTime() + dias * 86400000);
  const diff = Math.ceil((vence.getTime() - Date.now()) / 86400000);
  return { estado: diff < 0 ? 'Vencido' : (diff <= 15 ? 'Por vencer' : 'Vigente'), dias_para_vencer: diff };
}

/* ───────── Airtable helpers ───────── */
function airHeaders() { return { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }; }

async function airList(table, formula, fields) {
  let url = `https://api.airtable.com/v0/${BASE}/${table}?pageSize=100`
    + (formula ? `&filterByFormula=${encodeURIComponent(formula)}` : '')
    + fields.map(f => `&fields%5B%5D=${encodeURIComponent(f)}`).join('');
  const out = [];
  let offset = null;
  do {
    const r = await fetch(offset ? (url + '&offset=' + encodeURIComponent(offset)) : url, { headers: airHeaders() });
    if (!r.ok) return null;
    const data = await r.json();
    (data.records || []).forEach(rec => out.push(rec));
    offset = data.offset || null;
  } while (offset);
  return out;
}
async function airPatch(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${table}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
