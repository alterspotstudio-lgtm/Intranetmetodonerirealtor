// =============================================================
//  api/upload-documento.js  —  Método Neri · Expediente
//  Sube el archivo del documento a Vercel Blob y devuelve { url }.
//  El archivo NO se guarda en Airtable: en Airtable solo se guarda
//  la liga (url) que devuelve este endpoint.
//
//  REQUISITOS (una sola vez):
//   1) En el proyecto de la intranet (el que tiene /api/airtable):
//        npm i @vercel/blob
//   2) Conecta un Blob Store al proyecto y marca
//      "Add a read-write token env var" → crea BLOB_READ_WRITE_TOKEN
//      (igual que ya lo hiciste para los videos).
//
//  La ficha llama así (ya quedó wireado en indexActualizado_8.html):
//    POST /api/upload-documento?folio=...&doc=...&filename=...
//    body = el archivo crudo, header x-content-type = tipo MIME
// =============================================================

import { put } from '@vercel/blob';

export const config = { runtime: 'edge' }; // streaming: admite archivos grandes

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const { searchParams } = new URL(req.url);
  const folio    = (searchParams.get('folio') || 'sin-folio').replace(/[^A-Za-z0-9\-_.]/g, '');
  const doc      = (searchParams.get('doc') || 'doc').replace(/[^A-Za-z0-9\-_.]/g, '');
  const filename = (searchParams.get('filename') || 'archivo').replace(/[^A-Za-z0-9\-_.]/g, '_');
  const contentType = req.headers.get('x-content-type') || 'application/octet-stream';

  if (!req.body) return json({ error: 'No se recibió el archivo.' }, 400);

  try {
    const blob = await put(
      `expedientes/${folio}/${doc}-${Date.now()}-${filename}`,
      req.body,
      {
        access: 'public',
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );
    return json({ url: blob.url });
  } catch (e) {
    return json({ error: e.message || 'Error al subir a Blob.' }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
