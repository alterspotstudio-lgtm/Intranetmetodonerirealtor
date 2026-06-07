// =============================================================
//  api/upload-documento.js  —  Método Neri · Expediente
//  Sube el archivo del documento a Vercel Blob y devuelve { url }.
//  El archivo NO se guarda en Airtable: en Airtable solo se guarda
//  la liga (url) que devuelve este endpoint.
//
//  IMPORTANTE:
//  Esta función debe correr como Serverless Function de Node.js.
//  NO debe usar runtime: 'edge', porque @vercel/blob/undici usa módulos
//  de Node que Edge no soporta en este flujo.
//
//  Variables necesarias en Vercel:
//   - BLOB_READ_WRITE_TOKEN
// =============================================================

import { put } from '@vercel/blob';
import crypto from 'node:crypto';

// En proyectos tipo Next/Vercel API evita que el body se convierta en JSON.
// Si Vercel no usa esta opción, no rompe nada; simplemente se ignora.
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_MB = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-content-type, x-file-name, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── Autorización dual ────────────────────────────────────────────────
  //  · Asesor desde la intranet (cabina) → sesión NERI firmada (Bearer).
  //  · Propietario desde el portal público → folio + token del expediente.
  //    El portal NO tiene sesión NERI; se autoriza validando folio+token
  //    contra /api/vendedor-expediente (misma fuente de verdad que usa el
  //    portal para cargar el expediente). Sin esto, el propietario recibe
  //    401 en cada subida y la cadena se congela.
  const session = verifySession(req);
  let authorized = !!session;

  if (!authorized) {
    const { folio: authFolio, token: authToken } = getAuthParams(req);
    if (authFolio && authToken) {
      authorized = await validateExpedienteToken(req, authFolio, authToken);
    }
  }

  if (!authorized) {
    return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Falta la variable de entorno BLOB_READ_WRITE_TOKEN en Vercel.',
    });
  }

  try {
    const { folio, doc, filename } = getParams(req);
    const contentType = getHeader(req, 'x-content-type') || getHeader(req, 'content-type') || 'application/octet-stream';

    const contentLength = Number(getHeader(req, 'content-length') || 0);
    if (contentLength > MAX_BYTES) {
      return res.status(413).json({ error: `El archivo supera el límite de ${MAX_MB} MB.` });
    }

    const fileBuffer = await readRawBody(req, MAX_BYTES);
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No se recibió el archivo.' });
    }

    const safeFolio = sanitize(folio || 'sin-folio');
    const safeDoc = sanitize(doc || 'doc');
    const safeFilename = sanitize(filename || 'archivo');

    const blob = await put(
      `expedientes/${safeFolio}/${safeDoc}-${Date.now()}-${safeFilename}`,
      fileBuffer,
      {
        access: 'public',
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const message = err?.message || 'Error al subir a Blob.';
    const status = message.includes('supera el límite') ? 413 : 500;
    return res.status(status).json({ error: message });
  }
}

function getParams(req) {
  const fromQuery = req.query || {};

  // En Vercel/Node normalmente existe req.query. Este fallback cubre casos
  // donde solo venga req.url como string relativo.
  const host = getHeader(req, 'host') || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);

  return {
    folio: fromQuery.folio || url.searchParams.get('folio'),
    doc: fromQuery.doc || url.searchParams.get('doc'),
    filename: fromQuery.filename || url.searchParams.get('filename'),
  };
}

function getHeader(req, name) {
  return req.headers?.[name.toLowerCase()] || req.headers?.[name];
}

// Lee folio + token de la query SIN consumir el body (que es el archivo).
function getAuthParams(req) {
  const fromQuery = req.query || {};
  const host = getHeader(req, 'host') || 'localhost';
  let searchParams;
  try {
    searchParams = new URL(req.url || '/', `https://${host}`).searchParams;
  } catch (_) {
    searchParams = new URLSearchParams();
  }
  return {
    folio: fromQuery.folio || searchParams.get('folio') || '',
    token: fromQuery.token || searchParams.get('token') || '',
  };
}

// Valida el par folio+token del expediente reutilizando el endpoint que ya
// existe y funciona en producción (/api/vendedor-expediente). Si ese endpoint
// responde 200 para ese folio+token, la subida del propietario queda
// autorizada. No reimplementamos el esquema del token aquí: usamos la misma
// fuente de verdad que el portal usa para abrir el expediente.
async function validateExpedienteToken(req, folio, token) {
  try {
    const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host');
    if (!host) return false;
    const proto = getHeader(req, 'x-forwarded-proto') || 'https';
    const url = `${proto}://${host}/api/vendedor-expediente`
      + `?folio=${encodeURIComponent(folio)}&token=${encodeURIComponent(token)}`;
    const r = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } });
    return r.ok;
  } catch (_) {
    return false;
  }
}

function sanitize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\-_.]/g, '_')
    .slice(0, 120);
}

async function readRawBody(req, limitBytes) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body instanceof Uint8Array) return Buffer.from(req.body);

  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;

    if (total > limitBytes) {
      throw new Error(`El archivo supera el límite de ${MAX_MB} MB.`);
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}


function verifySession(req){
  const secret = process.env.NERI_SESSION_SECRET;
  if(!secret) return null;
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const parts = token.split('.');
  if(parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', secret).update(parts[0]+'.'+parts[1]).digest('base64url');
  const aa = Buffer.from(String(expected));
  const bb = Buffer.from(String(parts[2]));
  if(aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try{
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if(payload.exp && Date.now() > payload.exp) return null;
    return payload;
  }catch(_){ return null; }
}
