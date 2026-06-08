// =============================================================
//  api/activar-expediente.js  —  Método NERI · Expediente documental
//
//  Qué hace (lo llama la intranet, NO el propietario):
//   1. El asesor pide el link del expediente de un lead firmado.
//   2. El servidor genera UNA sola vez el token de seguridad (idempotente),
//      lo guarda en el lead (Token Expediente) junto con el link armado.
//   3. Asegura que exista la tabla "Expediente Documentos" (la crea si falta)
//      y siembra el checklist de 8 documentos en estado "Pendiente".
//   4. Devuelve SOLO el link armado (nunca el token suelto).
//
//  Variables Vercel necesarias (ya existen):
//   - AIRTABLE_TOKEN, AIRTABLE_BASE, NERI_SESSION_SECRET
// =============================================================

import crypto from 'node:crypto';

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const SECRET = process.env.NERI_SESSION_SECRET;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';            // Leads Vendedores
const DOCS_TABLE = 'Expediente Documentos';         // se direcciona por nombre
const EXP_DOC_BASE = 'https://expedientedocumentalpropietario.vercel.app';
const ETAPAS_FIRMADAS = ['Firma exclusiva', 'Firma venta directa'];

// Checklist canónico (mismo que muestra el portal del propietario)
const DOCS = [
  { id: 'escritura',         tipo: 'Escritura',                                 critico: true },
  { id: 'predial',           tipo: 'Predial',                                   critico: true },
  { id: 'ine',               tipo: 'Identificación Oficial (INE)',              critico: true },
  { id: 'libertad_gravamen', tipo: 'Libertad de Gravamen',                      critico: true },
  { id: 'agua_luz',          tipo: 'Agua / Luz',                                critico: false },
  { id: 'constancia_fiscal', tipo: 'Constancia Situación Fiscal',               critico: false },
  { id: 'domicilio',         tipo: 'Comprobante de Domicilio',                  critico: false },
  { id: 'acta_matrimonio',   tipo: 'Acta de Matrimonio / Régimen Matrimonial',  critico: false },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!TOKEN || !BASE) return res.status(500).json({ error: 'Faltan AIRTABLE_TOKEN y/o AIRTABLE_BASE en Vercel.' });
  if (!SECRET) return res.status(500).json({ error: 'Falta NERI_SESSION_SECRET en Vercel.' });

  if (!verifySession(req)) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  try {
    const body = parseBody(req);
    const folio = String(body.folio || '').trim();
    if (!folio) return res.status(400).json({ error: 'Falta el folio del lead.' });

    // 1) Localizar el lead vendedor por Folio
    const lead = await findLeadByFolio(folio);
    if (!lead) return res.status(404).json({ error: 'No se encontró un lead vendedor con ese folio.' });

    const conv = pickName(lead.fields['Conversión']);
    if (ETAPAS_FIRMADAS.indexOf(conv) === -1) {
      return res.status(409).json({ error: 'El expediente sólo se activa en Firma exclusiva o Firma venta directa.' });
    }

    // 2) Token idempotente: si ya existe, se reusa; si no, se genera y guarda
    let token = String(lead.fields['Token Expediente'] || '').trim();
    const link = buildLink(folio, token || (token = deterministicToken(folio)));

    const patch = {};
    if (!lead.fields['Token Expediente']) patch['Token Expediente'] = token;
    if (lead.fields['Link Expediente Documental'] !== link) patch['Link Expediente Documental'] = link;
    if (!lead.fields['Progreso Expediente']) patch['Progreso Expediente'] = 'Expediente activado · esperando documentos';
    if (Object.keys(patch).length) {
      await airPatch(LEADS_TABLE, lead.id, patch);
    }

    // 3) Asegurar tabla + sembrar checklist (no bloquea la respuesta si falla)
    let tablaLista = false;
    try {
      tablaLista = await ensureDocsTable();
      if (tablaLista) await seedChecklist(folio, lead);
    } catch (_) { tablaLista = false; }

    return res.status(200).json({ ok: true, folio, link, tabla_documentos: tablaLista });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'No se pudo activar el expediente.' });
  }
}

/* ───────── token ───────── */
function deterministicToken(folio) {
  return crypto.createHmac('sha256', SECRET).update('expediente:' + folio).digest('base64url');
}
function buildLink(folio, token) {
  return EXP_DOC_BASE + '/?folio=' + encodeURIComponent(folio) + '&token=' + encodeURIComponent(token);
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
async function airPatch(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
async function airListDocs(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(DOCS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  if (!r.ok) return null;                 // tabla aún no existe o sin acceso
  const data = await r.json();
  return data.records || [];
}
async function airCreate(table, records) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`;
  const r = await fetch(url, { method: 'POST', headers: airHeaders(), body: JSON.stringify({ records, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error creando registros.'); }
  return r.json();
}

/* ───────── bootstrap de la tabla "Expediente Documentos" ───────── */
async function ensureDocsTable() {
  // ¿Ya existe? (intento de lectura por nombre)
  const probe = await airListDocs('__probe__');
  if (probe !== null) return true;

  // Crear vía Meta API (requiere scope schema.bases:write en el token)
  const schema = {
    name: DOCS_TABLE,
    description: 'Un renglón por documento del expediente del propietario. Estado, archivo, validación y alerta de 48 h. La intranet escribe sola.',
    fields: [
      { name: 'Documento', type: 'singleLineText' },
      { name: 'Folio', type: 'singleLineText' },
      { name: 'Tipo de Documento', type: 'singleLineText' },
      { name: 'Document ID', type: 'singleLineText' },
      { name: 'Estado del Documento', type: 'singleSelect', options: { choices: [
        { name: 'Pendiente' }, { name: 'Recibido' }, { name: 'Validado' }, { name: 'Rechazado' }, { name: 'No aplica' },
      ] } },
      { name: 'Documento Crítico', type: 'checkbox', options: { icon: 'check', color: 'redBright' } },
      { name: 'Archivo URL', type: 'url' },
      { name: 'Nombre Archivo', type: 'singleLineText' },
      { name: 'Subido por', type: 'singleSelect', options: { choices: [
        { name: 'Cliente' }, { name: 'Asesor' }, { name: 'Sistema' },
      ] } },
      { name: 'Fecha Solicitud', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Fecha de Carga', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Motivo de Rechazo', type: 'multilineText' },
      { name: 'Alerta 48h Enviada', type: 'checkbox', options: { icon: 'check', color: 'yellowBright' } },
      { name: 'Asesor', type: 'singleLineText' },
    ],
  };
  const url = `https://api.airtable.com/v0/meta/bases/${BASE}/tables`;
  const r = await fetch(url, { method: 'POST', headers: airHeaders(), body: JSON.stringify(schema) });
  return r.ok;                            // si falla (sin scope), seguimos sin tabla
}

async function seedChecklist(folio, lead) {
  const existing = await airListDocs(folio);
  if (existing === null) return;          // tabla no disponible
  if (existing.length > 0) return;        // ya sembrado (idempotente)
  const asesor = String(lead.fields['Asesor'] || '');
  const now = new Date().toISOString();
  const records = DOCS.map(d => ({
    fields: {
      'Documento': folio + ' · ' + d.tipo,
      'Folio': folio,
      'Tipo de Documento': d.tipo,
      'Document ID': d.id,
      'Estado del Documento': 'Pendiente',
      'Documento Crítico': d.critico,
      'Subido por': 'Sistema',
      'Fecha Solicitud': now,
      'Asesor': asesor,
    },
  }));
  // Airtable permite hasta 10 por request; son 8.
  await airCreate(DOCS_TABLE, records);
}

/* ───────── utilidades ───────── */
function pickName(v) { if (!v) return ''; if (typeof v === 'string') return v; if (v.name) return v.name; return String(v); }
function parseBody(req) { if (!req.body) return {}; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } return req.body; }

function verifySession(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(parts[0] + '.' + parts[1]).digest('base64url');
  const aa = Buffer.from(String(expected));
  const bb = Buffer.from(String(parts[2]));
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (_) { return null; }
}
