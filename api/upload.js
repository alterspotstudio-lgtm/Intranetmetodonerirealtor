// ───────────────────────────────────────────────────────────────
//  /api/upload.js — Método NERI · Vercel Blob client uploads
//
//  Función correcta para archivos grandes:
//  - El navegador solicita un token temporal a esta función.
//  - El archivo sube DIRECTO del navegador a Vercel Blob.
//  - No pasa completo por Vercel Functions, por eso evita el límite 4.5 MB.
//
//  Requisito en Vercel:
//  - BLOB_READ_WRITE_TOKEN en Environment Variables.
// ───────────────────────────────────────────────────────────────

import { handleUpload } from '@vercel/blob/client';

const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
];
const MAX_MB = 200;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'Falta BLOB_READ_WRITE_TOKEN en Vercel. Activa Storage → Blob y conecta el proyecto.',
    });
  }

  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!String(pathname || '').startsWith('intranet/')) {
          throw new Error('Ruta de archivo no autorizada.');
        }

        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ pathname, clientPayload }),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Método NERI · Blob subido:', blob.url, tokenPayload || '');
      },
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'Error al generar token de subida.' });
  }
}
