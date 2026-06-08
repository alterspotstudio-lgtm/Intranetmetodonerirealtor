// =============================================================================
//  /api/alerta-expediente.js  ·  Método NERI
//  ALERTA AUTOMÁTICA — Documentos del propietario pendientes a las 48 horas.
//
//  Lee el expediente que vive en la fila de cada vendedor (campo "Expediente
//  Docs", JSON). Si pasaron +48h desde que se solicitó y siguen documentos en
//  "Pendiente", marca el lead (campo "Progreso Expediente") con una etiqueta de
//  atención para que el asesor lo vea, y deja una guarda para no repetir.
//
//  Se dispara solo por Vercel Cron (ver vercel.json). También puede abrirse a
//  mano: /api/alerta-expediente. Nunca truena el cron: reporta y sigue.
//
//  Variables Vercel (ya en uso): AIRTABLE_TOKEN, AIRTABLE_BASE.
// =============================================================================

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';   // Leads Vendedores
const DOCS_FIELD = 'Expediente Docs';

const HORAS_ALERTA = 48;
const TOTAL_DOCS = 8;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!BASE || !TOKEN) {
    return res.status(200).json({ ok: false, motivo: 'Faltan variables de Airtable.', revisados: 0, alertados: 0 });
  }

  try {
    const leads = await airListLeadsConExpediente();
    if (leads === null) {
      return res.status(200).json({ ok: true, revisados: 0, alertados: 0 });
    }

    const ahora = Date.now();
    const limite = HORAS_ALERTA * 60 * 60 * 1000;
    let alertados = 0;

    for (const lead of leads) {
      const exp = parseExp(lead.fields[DOCS_FIELD]);
      if (!exp) continue;
      if (exp.alerta48_at) continue;                          // ya se alertó una vez

      const base = Date.parse(exp.solicitado_at || '');
      if (isNaN(base) || (ahora - base) < limite) continue;   // aún no cumple 48h

      const pendientes = exp.docs.filter(d => (d.estado || 'Pendiente') === 'Pendiente');
      if (!pendientes.length) continue;                       // ya no hay pendientes

      const nombres = pendientes.map(d => d.tipo).filter(Boolean).slice(0, 4);
      const etiqueta = 'Atención: ' + pendientes.length + ' de ' + TOTAL_DOCS
        + ' documento(s) pendiente(s) +48h'
        + (nombres.length ? (' · ' + nombres.join(', ')) : '');

      exp.alerta48_at = new Date().toISOString();
      try {
        await airPatch(lead.id, { 'Progreso Expediente': etiqueta, [DOCS_FIELD]: JSON.stringify(exp) });
        alertados++;
      } catch (_) {}
    }

    return res.status(200).json({ ok: true, revisados: leads.length, alertados });
  } catch (e) {
    return res.status(200).json({ ok: false, motivo: String(e && e.message || e), revisados: 0, alertados: 0 });
  }
};

/* ───────── Airtable helpers ───────── */
function airHeaders() { return { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }; }

async function airListLeadsConExpediente() {
  // Solo leads que ya tienen expediente sembrado.
  const formula = "NOT({" + DOCS_FIELD + "}='')";
  let url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}?pageSize=100&filterByFormula=${encodeURIComponent(formula)}`
    + `&fields%5B%5D=${encodeURIComponent(DOCS_FIELD)}&fields%5B%5D=${encodeURIComponent('Folio')}`;
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
async function airPatch(id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
function parseExp(raw) {
  if (!raw) return null;
  try { const o = JSON.parse(raw); return (o && Array.isArray(o.docs)) ? o : null; }
  catch (_) { return null; }
}
