// =============================================================
//  api/activar-expediente.js  —  Método NERI · Expediente del vendedor
//
//  Genera (de forma determinista y firmada) el token del expediente
//  documental del propietario y lo escribe en el lead, junto con el
//  link listo para enviar. Es el "motor" que faltaba: sin esto el link
//  salía sin token y el portal del propietario se quedaba en candado.
//
//  Quién lo llama:
//   · La intranet / cabina del asesor (sesión NERI firmada). El asesor
//     NO ve ni manipula el token; el servidor lo calcula y lo guarda.
//
//  Token: HMAC-SHA256( NERI_SESSION_SECRET , "expediente:" + folio ).
//   · Determinista → no hay que almacenar nada para validarlo; cualquier
//     endpoint lo recalcula. Lo guardamos en Airtable solo para que la
//     cabina y Make puedan armar el link sin pedir el secreto.
//   · No requiere variables de entorno nuevas: reutiliza el secreto que
//     ya valida las sesiones de la intranet.
//
//  Variables de entorno (ya existentes en tu Vercel):
//   - AIRTABLE_TOKEN
//   - AIRTABLE_BASE (o AIRTABLE_BASE_ID)
//   - NERI_SESSION_SECRET
//   - (opcional) EXP_DOC_BASE  → dominio del portal del propietario
// =============================================================

import crypto from 'node:crypto';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const SESSION_SECRET = process.env.NERI_SESSION_SECRET;
const VENDEDORES_TABLE = process.env.AIRTABLE_VENDEDORES_TABLE || 'tblQHdwEucTaNrLzm';
const EXP_DOC_BASE = (process.env.EXP_DOC_BASE || 'https://expediente-propietario.vercel.app').replace(/\/+$/, '');

const F_TOKEN = 'Token Expediente';
const F_LINK = 'Link Expediente Documental';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!TOKEN || !BASE_ID) return res.status(500).json({ error: 'Faltan AIRTABLE_TOKEN y/o AIRTABLE_BASE en Vercel.' });
  if (!SESSION_SECRET) return res.status(500).json({ error: 'Falta NERI_SESSION_SECRET para firmar el expediente.' });

  // Solo la intranet (asesor con sesión válida) puede activar un expediente.
  const session = verifySession(req);
  if (!session) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const folioIn = String(body.folio || '').trim();
    const recordId = String(body.recordId || body.recId || '').trim();
    if (!folioIn && !recordId) return res.status(400).json({ error: 'Falta el folio o el recordId del lead.' });

    // Localizar el lead (por recordId si viene, si no por Folio).
    const rec = recordId ? await getRecordById(recordId) : await findByFolio(folioIn);
    if (!rec) return res.status(404).json({ error: 'No se encontró el lead para ese folio.' });

    const folio = fieldValue(rec.fields?.['Folio']) || folioIn;
    if (!folio) return res.status(422).json({ error: 'El lead no tiene Folio; no se puede activar el expediente.' });

    const token = expedienteToken(folio);
    const link = `${EXP_DOC_BASE}/?folio=${encodeURIComponent(folio)}&token=${encodeURIComponent(token)}`;

    // Escribir token + link en el lead (idempotente: el token es determinista).
    await patchRecord(rec.id, { [F_TOKEN]: token, [F_LINK]: link });

    return res.status(200).json({ ok: true, folio, token, link, recordId: rec.id });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo activar el expediente: ' + (err?.message || err) });
  }
}

// ── Token del expediente ───────────────────────────────────────────────
export function expedienteToken(folio) {
  return crypto.createHmac('sha256', SESSION_SECRET)
    .update('expediente:' + String(folio))
    .digest('base64url');
}

// ── Airtable helpers ───────────────────────────────────────────────────
async function findByFolio(folio) {
  const formula = encodeURIComponent(`{Folio}='${String(folio).replace(/'/g, "\\'")}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${VENDEDORES_TABLE}?filterByFormula=${formula}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Error consultando Airtable.');
  return data.records?.[0] || null;
}
async function getRecordById(id) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${VENDEDORES_TABLE}/${id}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const data = await r.json();
  if (!r.ok) return null;
  return data;
}
async function patchRecord(id, fields) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${VENDEDORES_TABLE}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'No se pudo escribir el token en el lead.');
  return data;
}

function fieldValue(v) {
  if (Array.isArray(v)) return v.map(x => x?.name || x).join(', ');
  if (v && typeof v === 'object') return v.name || v.url || '';
  return v == null ? '' : String(v);
}

// ── Validación de sesión NERI (mismo esquema que airtable.js / login.js) ─
function verifySession(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const tok = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const p = tok.split('.');
  if (p.length !== 3) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(p[0] + '.' + p[1]).digest('base64url');
  const aa = Buffer.from(String(expected)), bb = Buffer.from(String(p[2]));
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try {
    const payload = JSON.parse(Buffer.from(p[1], 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (_) { return null; }
}
