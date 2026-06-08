// ───────────────────────────────────────────────────────────────
//  /api/upload.js   —  Subida DIRECTA a Vercel Blob (client upload)
//
//  Por qué existe:
//   La ruta vieja /api/upload-documento metía el archivo COMPLETO en
//   memoria dentro de la función (navegador → función → Blob) y chocaba
//   con el tope de 4.5MB. Eso era lo que alentaba la ficha al subir
//   fotos y videos.
//
//   Aquí el navegador sube el archivo DIRECTO a Vercel Blob usando un
//   token de un solo uso. El archivo NO pasa por la función → rápido,
//   sin tope práctico de tamaño, no bloquea la ficha.
//
//  Autorización:
//   La subida directa NO manda header Authorization (la librería arma
//   su propia petición), así que la sesión del asesor viaja dentro de
//   clientPayload y se valida en onBeforeGenerateToken. Sin sesión
//   válida no se emite token y no se sube nada.
//
//  Requisitos en Vercel:
//   - @vercel/blob (ya en package.json)
//   - BLOB_READ_WRITE_TOKEN
//   - NERI_SESSION_SECRET
// ───────────────────────────────────────────────────────────────

import { handleUpload } from '@vercel/blob/client';
import crypto from 'node:crypto';

const TIPOS_PERMITIDOS = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime',
  'application/pdf',
];
const MAX_MB = 300; // fotos y videos verticales caben de sobra

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Falta BLOB_READ_WRITE_TOKEN en Vercel.' });
  }

  try {
    const result = await handleUpload({
      body: req.body,
      request: req,

      // Se llama ANTES de subir. Aquí autorizamos con la sesión que viene
      // dentro de clientPayload (no por header) y fijamos las reglas.
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {};
        try { payload = clientPayload ? JSON.parse(clientPayload) : {}; }
        catch (_) { payload = {}; }

        const ok = verifySessionToken(payload.session);
        if (!ok) {
          throw new Error('Sesión inválida o vencida.');
        }

        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          maximumSizeInBytes: MAX_MB * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            folio: payload.folio || '',
            doc: payload.doc || '',
            scope: payload.scope || 'asesor',
          }),
        };
      },

      // Vercel avisa al servidor cuando termina la subida.
      // No escribimos en Airtable aquí: la intranet guarda la URL que
      // recibe en el navegador mediante su proxy /api/airtable.
      onUploadCompleted: async ({ blob }) => {
        console.log('Archivo subido directo:', blob.url);
      },
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Error al subir' });
  }
}

// Valida el mismo token de sesión que usa el resto de la intranet,
// pero leído desde clientPayload en vez del header Authorization.
function verifySessionToken(token) {
  const secret = process.env.NERI_SESSION_SECRET;
  if (!secret || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', secret)
    .update(parts[0] + '.' + parts[1]).digest('base64url');
  const aa = Buffer.from(String(expected));
  const bb = Buffer.from(String(parts[2]));
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch (_) { return null; }
}
