// ───────────────────────────────────────────────────────────────
//  /api/upload.js   —  Endpoint de subida para la intranet NERI
//
//  Qué hace:
//   1. El asesor elige un archivo (foto o video) en la intranet.
//   2. El navegador sube el archivo DIRECTO a Vercel Blob (no pasa
//      por Airtable, así soporta videos pesados sin límite de 4.5MB).
//   3. Vercel Blob devuelve una URL pública y permanente.
//   4. La intranet guarda SOLO esa URL en el campo de texto de Airtable.
//   5. La landing (Link Comprador) lee esa URL y pinta la foto/video.
//
//  Requisitos en Vercel:
//   - npm i @vercel/blob
//   - Variable de entorno: BLOB_READ_WRITE_TOKEN  (Storage → Blob → conectar)
//
//  Por qué "client upload" (handleUpload): permite subir archivos grandes
//  (videos verticales) directo al storage sin tocar el límite de la función.
// ───────────────────────────────────────────────────────────────

import { handleUpload } from '@vercel/blob/client';
import crypto from 'node:crypto';

// Carpetas/tipos permitidos. Mantén la lista corta y controlada.
const TIPOS_PERMITIDOS = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime',
];
const MAX_MB = 200; // tope por archivo (videos verticales caben de sobra)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error:'Falta BLOB_READ_WRITE_TOKEN en Vercel.' });
  }

  try {
    const body = req.body;

    const result = await handleUpload({
      body,
      request: req,

      // Se llama ANTES de subir: aquí autorizas y defines reglas.
      // La sesión NO viaja en el header (la subida cliente de Vercel Blob no
      // lo manda): viaja dentro del clientPayload que arma la intranet. Por eso
      // se valida AQUÍ y no al inicio del handler.
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let datos = {};
        try { datos = clientPayload ? JSON.parse(clientPayload) : {}; } catch (_) { datos = {}; }
        if (!verifySessionToken(datos.session)) {
          throw new Error('Sesión inválida o vencida.');
        }
        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          maximumSizeInBytes: MAX_MB * 1024 * 1024,
          addRandomSuffix: true, // evita que dos archivos con el mismo nombre se pisen
          // tokenPayload opcional: podrías pasar el folio de la propiedad
        };
      },

      // Se llama CUANDO TERMINA la subida (Vercel avisa al servidor).
      // Aquí NO escribimos en Airtable: lo hace la intranet con la URL
      // que recibe en el navegador, usando su proxy seguro /api/airtable.
      onUploadCompleted: async ({ blob }) => {
        // blob.url = URL pública final. Útil para logs.
        console.log('Archivo subido:', blob.url);
      },
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Error al subir' });
  }
}


function verifySessionToken(token){
  const secret = process.env.NERI_SESSION_SECRET;
  if(!secret) return null;
  token = String(token || '');
  if(token.startsWith('Bearer ')) token = token.slice(7);
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
