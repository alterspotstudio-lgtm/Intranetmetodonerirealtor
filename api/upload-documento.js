// =============================================================
//  api/upload-documento.js  —  Método NERI · Subida de documento a Blob
//
//  Sube el archivo a Vercel Blob y devuelve { url }. Doble autorización:
//   - ASESOR: sesión NERI por header Authorization: Bearer <token de sesión>.
//   - PROPIETARIO: folio + token del expediente en la querystring
//     (?folio=...&token=...). Así el portal del propietario puede subir
//     sin necesitar una sesión de asesor.
//
//  El registro en Airtable lo hace /api/expediente-documentos (no aquí).
//
//  Variables Vercel:
//   - BLOB_READ_WRITE_TOKEN
//   - NERI_SESSION_SECRET, AIRTABLE_TOKEN, AIRTABLE_BASE
// =============================================================

import { put } from '@vercel/blob';
import crypto from 'node:crypto';

export const config = { api: { bodyParser: false } };

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const SECRET = process.env.NERI_SESSION_SECRET;
const LEADS_TABLE = 'tblQHdwEucTaNrLzm';

const MAX_MB = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-content-type, x-file-name, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Falta la variable BLOB_READ_WRITE_TOKEN en Vercel.' });
  }

  const { folio, doc, filename } = getParams(req);

  // ── Autorización dual ──
  const session = verifySession(req);
  if (!session) {
    const token = getQueryValue(req, 'token');
    const ok = folio && token ? await ownerAllowed(folio, token) : false;
    if (!ok) return res.status(401).json({ error: 'No autorizado. Abre el enlace exacto del expediente o inicia sesión.' });
  }

  try {
    const contentType = getHeader(req, 'x-content-type') || getHeader(req, 'content-type') || 'application/octet-stream';
    const contentLength = Number(getHeader(req, 'content-length') || 0);
    if (contentLength > MAX_BYTES) return res.status(413).json({ error: `El archivo supera el límite de ${MAX_MB} MB.` });

    const fileBuffer = await readRawBody(req, MAX_BYTES);
    if (!fileBuffer || fileBuffer.length === 0) return res.status(400).json({ error: 'No se recibió el archivo.' });

    const safeFolio = sanitize(folio || 'sin-folio');
    const safeDoc = sanitize(doc || 'doc');
    const safeFilename = sanitize(filename || 'archivo');

    const blob = await put(
      `expedientes/${safeFolio}/${safeDoc}-${Date.now()}-${safeFilename}`,
      fileBuffer,
      { access: 'public', contentType, token: process.env.BLOB_READ_WRITE_TOKEN }
    );

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const message = err?.message || 'Error al subir a Blob.';
    const status = message.includes('supera el límite') ? 413 : 500;
    return res.status(status).json({ error: message });
  }
}

/* ───────── autorización del propietario (folio + token) ───────── */
async function ownerAllowed(folio, token) {
  if (!SECRET) return false;
  // 1) token determinista (no requiere Airtable)
  const deterministic = crypto.createHmac('sha256', SECRET).update('expediente:' + folio).digest('base64url');
  if (safeEqual(token, deterministic)) return true;
  // 2) token guardado en el lead (compatibilidad)
  if (!AIRTABLE_TOKEN || !BASE) return false;
  try {
    const formula = "{Folio}='" + String(folio).replace(/'/g, "\\'") + "'";
    const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + AIRTABLE_TOKEN } });
    if (!r.ok) return false;
    const data = await r.json();
    const stored = String(data?.records?.[0]?.fields?.['Token Expediente'] || '').trim();
    return stored ? safeEqual(token, stored) : false;
  } catch (_) { return false; }
}

/* ───────── helpers de request ───────── */
function getParams(req) {
  const fromQuery = req.query || {};
  const host = getHeader(req, 'host') || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);
  return {
    folio: fromQuery.folio || url.searchParams.get('folio'),
    doc: fromQuery.doc || url.searchParams.get('doc'),
    filename: fromQuery.filename || url.searchParams.get('filename'),
  };
}
function getQueryValue(req, key) {
  const fromQuery = req.query || {};
  const host = getHeader(req, 'host') || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);
  return fromQuery[key] || url.searchParams.get(key) || '';
}
function getHeader(req, name) { return req.headers?.[name.toLowerCase()] || req.headers?.[name]; }
function sanitize(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9\-_.]/g, '_').slice(0, 120);
}
async function readRawBody(req, limitBytes) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body instanceof Uint8Array) return Buffer.from(req.body);
  const chunks = []; let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limitBytes) throw new Error(`El archivo supera el límite de ${MAX_MB} MB.`);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}
function verifySession(req) {
  if (!SECRET) return null;
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
