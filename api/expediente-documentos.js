// =============================================================
//  api/expediente-documentos.js  —  Método NERI · Registro + validación
//
//  Una sola puerta para el ciclo de cada documento del expediente:
//
//   GET  ?folio=&token=                 → lista los documentos del folio
//   POST {action:'documento_recibido'}  → el propietario subió un archivo
//                                          (auth: folio + token)  · CHECK-IN
//   POST {action:'validar'|'rechazar'}  → el asesor revisa un documento
//                                          (auth: sesión NERI Bearer)
//
//  Cada subida hace "check-in" en el lead (campo Progreso Expediente) para que
//  la intranet vea que el expediente avanzó. La tabla guarda un renglón por
//  documento, con estado, archivo, fecha y guarda de alerta de 48 h.
//
//  Variables Vercel: AIRTABLE_TOKEN, AIRTABLE_BASE, NERI_SESSION_SECRET
// =============================================================

import crypto from 'node:crypto';

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const SECRET = process.env.NERI_SESSION_SECRET;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';
const DOCS_TABLE = 'Expediente Documentos';

const DOCS = [
  { id: 'escritura',         tipo: 'Escritura',                                 descripcion: 'Documento base que acredita la propiedad.',                   critico: true },
  { id: 'predial',           tipo: 'Predial',                                   descripcion: 'Boleta o comprobante de predial reciente.',                   critico: true },
  { id: 'ine',               tipo: 'Identificación Oficial (INE)',              descripcion: 'Identificación vigente del propietario.',                     critico: true },
  { id: 'libertad_gravamen', tipo: 'Libertad de Gravamen',                      descripcion: 'Para verificar si la propiedad está libre de gravamen.',      critico: true },
  { id: 'agua_luz',          tipo: 'Agua / Luz',                                descripcion: 'Comprobante de servicios recientes.',                          critico: false },
  { id: 'constancia_fiscal', tipo: 'Constancia Situación Fiscal',               descripcion: 'Necesaria para revisar correctamente el tema fiscal.',         critico: false },
  { id: 'domicilio',         tipo: 'Comprobante de Domicilio',                  descripcion: 'Comprobante vigente del propietario.',                         critico: false },
  { id: 'acta_matrimonio',   tipo: 'Acta de Matrimonio / Régimen Matrimonial',  descripcion: 'Aplica cuando la situación civil lo requiere.',                critico: false },
];
const DOC_BY_ID = Object.fromEntries(DOCS.map(d => [d.id, d]));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!TOKEN || !BASE || !SECRET) return res.status(500).json({ error: 'Faltan variables de entorno en Vercel.' });

  try {
    if (req.method === 'GET') return await handleList(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Error en expediente-documentos.' });
  }
}

/* ───────── GET: listar documentos del folio ───────── */
async function handleList(req, res) {
  const { folio, token } = getQuery(req);
  if (!folio || !token) return res.status(400).json({ error: 'Faltan folio y token.' });

  const lead = await findLeadByFolio(folio);
  if (!lead) return res.status(404).json({ error: 'Expediente no encontrado.' });
  if (!validToken(folio, token, lead.fields['Token Expediente'])) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const rows = await airListDocs(folio);
  if (rows === null) return res.status(200).json({ documents: [] }); // tabla aún no creada → portal muestra checklist base

  const documents = rows.map(r => {
    const f = r.fields || {};
    const docId = f['Document ID'] || '';
    const base = DOC_BY_ID[docId] || {};
    return {
      id: docId || r.id,
      tipo: f['Tipo de Documento'] || base.tipo || 'Documento',
      descripcion: base.descripcion || 'Carga el archivo correspondiente a este documento.',
      estado: pickName(f['Estado del Documento']) || 'Pendiente',
      critico: Boolean(f['Documento Crítico']),
      archivo_url: f['Archivo URL'] || '',
      fecha_carga: f['Fecha de Carga'] || '',
      motivo_rechazo: f['Motivo de Rechazo'] || '',
    };
  });
  return res.status(200).json({ documents });
}

/* ───────── POST: ruteo por acción ───────── */
async function handlePost(req, res) {
  const body = parseBody(req);
  const action = String(body.action || '').trim();

  if (action === 'documento_recibido') return await handleReceived(req, res, body);
  if (action === 'validar' || action === 'rechazar') return await handleReview(req, res, body, action);
  return res.status(400).json({ error: 'Acción no reconocida.' });
}

/* CHECK-IN del propietario (o asesor con token) */
async function handleReceived(req, res, body) {
  const folio = String(body.folio || '').trim();
  const token = String(body.token || '').trim();
  if (!folio || !token) return res.status(400).json({ error: 'Faltan folio y token.' });

  const lead = await findLeadByFolio(folio);
  if (!lead) return res.status(404).json({ error: 'Expediente no encontrado.' });
  if (!validToken(folio, token, lead.fields['Token Expediente'])) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const documentId = String(body.document_id || '').trim() || slug(body.tipo_documento || 'documento');
  const tipo = body.tipo_documento || (DOC_BY_ID[documentId] && DOC_BY_ID[documentId].tipo) || documentId;
  const critico = DOC_BY_ID[documentId] ? DOC_BY_ID[documentId].critico : false;
  const fields = {
    'Documento': folio + ' · ' + tipo,
    'Folio': folio,
    'Tipo de Documento': tipo,
    'Document ID': documentId,
    'Estado del Documento': 'Recibido',
    'Documento Crítico': critico,
    'Archivo URL': body.archivo_url || '',
    'Nombre Archivo': body.filename || '',
    'Subido por': body.subido_por === 'Asesor' ? 'Asesor' : 'Cliente',
    'Fecha de Carga': body.uploaded_at || new Date().toISOString(),
    'Motivo de Rechazo': '',
    'Alerta 48h Enviada': false,
    'Asesor': lead.fields['Asesor'] || '',
  };

  let guardado = false;
  await ensureDocsTable();
  const existing = await airListDocs(folio);
  if (existing !== null) {
    const row = existing.find(r => (r.fields && r.fields['Document ID']) === documentId);
    try {
      if (row) await airPatch(DOCS_TABLE, row.id, fields);
      else await airCreate(DOCS_TABLE, [{ fields }]);
      guardado = true;
    } catch (_) { guardado = false; }
  }

  // Check-in al lead: la intranet lee este campo
  try { await checkInLead(lead, folio, existing, documentId); } catch (_) {}

  // Aunque la tabla falle, el archivo ya está en Blob: nunca rompemos la subida.
  return res.status(200).json({ ok: true, registrado: guardado, document_id: documentId });
}

/* REVISIÓN del asesor: validar / rechazar */
async function handleReview(req, res, body, action) {
  if (!verifySession(req)) return res.status(401).json({ error: 'Sesión de asesor inválida o vencida.' });
  const folio = String(body.folio || '').trim();
  const documentId = String(body.document_id || '').trim();
  const recordId = String(body.record_id || '').trim();
  if (!folio || (!documentId && !recordId)) return res.status(400).json({ error: 'Falta folio y documento.' });

  const rows = await airListDocs(folio);
  if (!rows || !rows.length) return res.status(404).json({ error: 'No hay documentos registrados para ese folio.' });
  const row = recordId ? rows.find(r => r.id === recordId) : rows.find(r => (r.fields && r.fields['Document ID']) === documentId);
  if (!row) return res.status(404).json({ error: 'Documento no encontrado.' });

  const fields = action === 'validar'
    ? { 'Estado del Documento': 'Validado', 'Motivo de Rechazo': '' }
    : { 'Estado del Documento': 'Rechazado', 'Motivo de Rechazo': String(body.motivo || 'Documento ilegible o incompleto.') };
  await airPatch(DOCS_TABLE, row.id, fields);

  try {
    const lead = await findLeadByFolio(folio);
    if (lead) await checkInLead(lead, folio, await airListDocs(folio), null);
  } catch (_) {}

  return res.status(200).json({ ok: true, estado: fields['Estado del Documento'] });
}

/* ───────── check-in: escribe el avance en el lead ───────── */
async function checkInLead(lead, folio, rows, lastDocId) {
  let recibidos = 0;
  if (Array.isArray(rows)) {
    recibidos = rows.filter(r => ['Recibido', 'Validado'].includes(pickName(r.fields && r.fields['Estado del Documento']))).length;
    if (lastDocId && !rows.some(r => (r.fields && r.fields['Document ID']) === lastDocId)) recibidos += 1;
  } else if (lastDocId) {
    recibidos = 1;
  }
  const total = DOCS.length;
  const label = recibidos >= total
    ? 'Documentos completos (' + total + '/' + total + ') · listo para revisión'
    : 'Documentos recibidos: ' + recibidos + '/' + total;
  await airPatch(LEADS_TABLE, lead.id, { 'Progreso Expediente': label });
}

/* ───────── Airtable REST ───────── */
function airHeaders() { return { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }; }
async function findLeadByFolio(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Error consultando el lead.');
  return (data.records && data.records[0]) || null;
}
async function airListDocs(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(DOCS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  if (!r.ok) return null;
  const data = await r.json();
  return data.records || [];
}
async function airPatch(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
async function airCreate(table, records) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`;
  const r = await fetch(url, { method: 'POST', headers: airHeaders(), body: JSON.stringify({ records, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error creando registros.'); }
  return r.json();
}
async function ensureDocsTable() {
  const probe = await airListDocs('__probe__');
  if (probe !== null) return true;
  const schema = {
    name: DOCS_TABLE,
    description: 'Un renglón por documento del expediente del propietario. La intranet escribe sola.',
    fields: [
      { name: 'Documento', type: 'singleLineText' },
      { name: 'Folio', type: 'singleLineText' },
      { name: 'Tipo de Documento', type: 'singleLineText' },
      { name: 'Document ID', type: 'singleLineText' },
      { name: 'Estado del Documento', type: 'singleSelect', options: { choices: [
        { name: 'Pendiente' }, { name: 'Recibido' }, { name: 'Validado' }, { name: 'Rechazado' }, { name: 'No aplica' } ] } },
      { name: 'Documento Crítico', type: 'checkbox', options: { icon: 'check', color: 'redBright' } },
      { name: 'Archivo URL', type: 'url' },
      { name: 'Nombre Archivo', type: 'singleLineText' },
      { name: 'Subido por', type: 'singleSelect', options: { choices: [ { name: 'Cliente' }, { name: 'Asesor' }, { name: 'Sistema' } ] } },
      { name: 'Fecha Solicitud', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Fecha de Carga', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Motivo de Rechazo', type: 'multilineText' },
      { name: 'Alerta 48h Enviada', type: 'checkbox', options: { icon: 'check', color: 'yellowBright' } },
      { name: 'Asesor', type: 'singleLineText' },
    ],
  };
  const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, { method: 'POST', headers: airHeaders(), body: JSON.stringify(schema) });
  return r.ok;
}

/* ───────── utilidades ───────── */
function getQuery(req) {
  const q = req.query || {};
  const host = req.headers?.host || 'localhost';
  const u = new URL(req.url || '/', 'https://' + host);
  return {
    folio: String(q.folio || u.searchParams.get('folio') || '').trim(),
    token: String(q.token || u.searchParams.get('token') || '').trim(),
  };
}
function parseBody(req) { if (!req.body) return {}; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } return req.body; }
function pickName(v) { if (!v) return ''; if (typeof v === 'string') return v; if (v.name) return v.name; return String(v); }
function slug(v) {
  return String(v || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'documento';
}
function validToken(folio, token, stored) {
  const s = String(stored || '').trim();
  if (s) return safeEqual(token, s);
  const deterministic = crypto.createHmac('sha256', SECRET).update('expediente:' + folio).digest('base64url');
  return safeEqual(token, deterministic);
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}
function verifySession(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(parts[0] + '.' + parts[1]).digest('base64url');
  const aa = Buffer.from(String(expected)); const bb = Buffer.from(String(parts[2]));
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try { const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); if (p.exp && Date.now() > p.exp) return null; return p; }
  catch (_) { return null; }
}
