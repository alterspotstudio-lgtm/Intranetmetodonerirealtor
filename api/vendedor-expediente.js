// =============================================================
//  api/vendedor-expediente.js  —  Método NERI · Expediente del vendedor
//
//  El portal del propietario (expediente-propietario.vercel.app) llama
//  a este endpoint al abrir, con ?folio=...&token=... Valida el par y,
//  si es correcto, devuelve los datos del lead para pintar el expediente.
//  Sin esto el portal no podía cargar (mostraba candado / "no se encontró").
//
//  Token: el mismo HMAC determinista que genera /api/activar-expediente.
//  No se almacena para validar: se recalcula y se compara con timing-safe.
//
//  Variables de entorno (ya existentes):
//   - AIRTABLE_TOKEN
//   - AIRTABLE_BASE (o AIRTABLE_BASE_ID)
//   - NERI_SESSION_SECRET
// =============================================================

import crypto from 'node:crypto';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const SESSION_SECRET = process.env.NERI_SESSION_SECRET;
const VENDEDORES_TABLE = process.env.AIRTABLE_VENDEDORES_TABLE || 'tblQHdwEucTaNrLzm';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  if (!TOKEN || !BASE_ID) return res.status(500).json({ error: 'Faltan AIRTABLE_TOKEN y/o AIRTABLE_BASE en Vercel.' });
  if (!SESSION_SECRET) return res.status(500).json({ error: 'Falta NERI_SESSION_SECRET.' });

  const { folio, token } = readParams(req);
  if (!folio || !token) return res.status(400).json({ error: 'Faltan folio y/o token.' });
  if (!validTokenFor(folio, token)) return res.status(401).json({ error: 'Acceso no válido para este expediente.' });

  try {
    const rec = await findByFolio(folio);
    if (!rec) return res.status(404).json({ error: 'No se encontró el expediente.' });
    const f = rec.fields || {};
    return res.status(200).json({
      ok: true,
      record_id: rec.id,
      folio,
      nombre: fieldValue(f['Nombre Completo']) || 'Propietario',
      zona: fieldValue(f['Zona']),
      estado: fieldValue(f['Estado/Entidad'] || f['Estado / Entidad']),
      asesor: fieldValue(f['Asesor']),
      documentos_requeridos: fieldValue(f['Documentos Requeridos'] || f['Documentos'] || f['Checklist Documentos']),
      expediente_pct: fieldValue(f['% Expediente'] || f['Expediente %']),
      aviso_privacidad_aceptado: truthy(f['Aviso Privacidad Aceptado'] || f['Aviso de Privacidad']),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Error consultando el expediente: ' + (err?.message || err) });
  }
}

// ── Token ──────────────────────────────────────────────────────────────
function expedienteToken(folio) {
  return crypto.createHmac('sha256', SESSION_SECRET).update('expediente:' + String(folio)).digest('base64url');
}
function validTokenFor(folio, token) {
  const expected = expedienteToken(folio);
  const aa = Buffer.from(String(expected)), bb = Buffer.from(String(token));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

// ── Airtable ─────────────────────────────────────────────────────────────
async function findByFolio(folio) {
  const formula = encodeURIComponent(`{Folio}='${String(folio).replace(/'/g, "\\'")}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${VENDEDORES_TABLE}?filterByFormula=${formula}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Error consultando Airtable.');
  return data.records?.[0] || null;
}

// ── Utils ────────────────────────────────────────────────────────────────
function readParams(req) {
  const q = req.query || {};
  const host = req.headers?.host || 'localhost';
  let sp;
  try { sp = new URL(req.url || '/', `https://${host}`).searchParams; } catch (_) { sp = new URLSearchParams(); }
  return {
    folio: String(q.folio || sp.get('folio') || '').trim(),
    token: String(q.token || sp.get('token') || '').trim(),
  };
}
function fieldValue(v) {
  if (Array.isArray(v)) return v.map(x => x?.name || x).join(', ');
  if (v && typeof v === 'object') return v.name || v.url || '';
  return v == null ? '' : String(v);
}
function truthy(v) {
  const s = String(v).toLowerCase();
  return v === true || s === 'true' || s === 'sí' || s === 'si' || s === 'aceptado';
}
