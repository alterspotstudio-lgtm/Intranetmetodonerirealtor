// =============================================================================
//  /api/alerta-expediente.js  ·  Método NERI
//  ALERTA AUTOMÁTICA — Documentos del propietario pendientes a las 48 horas.
//
//  Qué hace (sin que nadie tenga que recordarlo):
//    - Revisa la tabla "Expediente Documentos".
//    - Busca documentos que sigan en "Pendiente" cuya solicitud ya pasó de 48h.
//    - Marca el lead (campo "Progreso Expediente") con una etiqueta de atención
//      para que el asesor lo vea en la intranet.
//    - Marca el documento con "Alerta 48h Enviada" para no repetir el aviso.
//
//  Cómo se dispara:
//    - Automáticamente por Vercel Cron (ver vercel.json) cada pocas horas.
//    - También puede llamarse manualmente abriendo /api/alerta-expediente.
//
//  Degradación elegante: si la tabla todavía no existe o el token no tiene
//  permiso de escritura, la función no truena: responde y no bloquea nada.
//
//  Variables Vercel (ya en uso): AIRTABLE_TOKEN, AIRTABLE_BASE.
// =============================================================================

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';
const DOCS_TABLE = 'Expediente Documentos';

const HORAS_ALERTA = 48;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!BASE || !TOKEN) {
    return res.status(200).json({ ok: false, motivo: 'Faltan variables de Airtable.', revisados: 0, alertados: 0 });
  }

  try {
    const pendientes = await airListPendientes();
    if (pendientes === null) {
      // La tabla aún no existe (o sin permiso de lectura): no es un error fatal.
      return res.status(200).json({ ok: true, tabla_lista: false, revisados: 0, alertados: 0 });
    }

    const ahora = Date.now();
    const limite = HORAS_ALERTA * 60 * 60 * 1000;
    const vencidos = pendientes.filter(function (r) {
      const f = r.fields || {};
      if (f['Alerta 48h Enviada'] === true) return false;
      const solicitada = f['Fecha Solicitud'];
      if (!solicitada) return false;
      const t = Date.parse(solicitada);
      if (isNaN(t)) return false;
      return (ahora - t) >= limite;
    });

    // Agrupar por Folio para escribir una sola etiqueta por lead.
    const porFolio = {};
    vencidos.forEach(function (r) {
      const folio = (r.fields && r.fields['Folio']) ? String(r.fields['Folio']) : '';
      if (!folio) return;
      (porFolio[folio] = porFolio[folio] || []).push(r);
    });

    let alertados = 0;
    for (const folio of Object.keys(porFolio)) {
      const docs = porFolio[folio];
      const nombres = docs
        .map(function (d) { return (d.fields && d.fields['Tipo de Documento']) || ''; })
        .filter(Boolean);
      const etiqueta = 'Atención: ' + docs.length + ' documento(s) pendiente(s) +48h'
        + (nombres.length ? (' · ' + nombres.slice(0, 4).join(', ')) : '');

      // 1) Marcar el lead para que el asesor lo vea.
      const lead = await airFindLead(folio);
      if (lead) {
        try { await airPatch(LEADS_TABLE, lead.id, { 'Progreso Expediente': etiqueta }); } catch (_) {}
      }

      // 2) Marcar cada documento como ya alertado (guarda anti-repetición).
      for (const d of docs) {
        try { await airPatch(DOCS_TABLE, d.id, { 'Alerta 48h Enviada': true }); alertados++; } catch (_) {}
      }
    }

    return res.status(200).json({
      ok: true,
      tabla_lista: true,
      revisados: pendientes.length,
      vencidos: vencidos.length,
      alertados: alertados,
      leads_marcados: Object.keys(porFolio).length
    });
  } catch (e) {
    // Nunca tumbar el cron: reportar y seguir.
    return res.status(200).json({ ok: false, motivo: String(e && e.message || e), revisados: 0, alertados: 0 });
  }
};

/* ───────── Airtable helpers ───────── */
function airHeaders() {
  return { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };
}
async function airListPendientes() {
  // Documentos en estado Pendiente. Si la tabla no existe, devuelve null.
  const formula = "{Estado del Documento}='Pendiente'";
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(DOCS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}&pageSize=100`;
  const r = await fetch(url, { headers: airHeaders() });
  if (!r.ok) return null;
  const data = await r.json();
  return data.records || [];
}
async function airFindLead(folio) {
  const formula = "{Folio}='" + String(folio).replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  if (!r.ok) return null;
  const data = await r.json();
  return (data.records && data.records[0]) || null;
}
async function airPatch(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
