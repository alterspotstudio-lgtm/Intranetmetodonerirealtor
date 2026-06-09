// /api/idrive-read-url.js — Método NERI · lectura temporal desde IDrive e2 privado
// Genera una URL firmada de lectura para videos/archivos guardados en el bucket privado.
// No reemplaza /api/upload-idrive-url.js. Solo resuelve la visualización.

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const EXPIRES_IN_SECONDS = 60 * 60; // 1 hora
const KEY_PREFIX = 'metodo-neri/';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST', 'HEAD'].includes(req.method)) {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const cfg = readConfig();
  if (cfg.error) return res.status(500).json({ error: cfg.error });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const input = String(req.query?.url || req.query?.key || body.url || body.key || '').trim();
    const key = extractKey(input, cfg);

    if (!key) return res.status(400).json({ error: 'Falta URL o key del archivo.' });
    if (!key.startsWith(KEY_PREFIX)) return res.status(403).json({ error: 'Ruta no permitida.' });
    if (key.includes('..')) return res.status(403).json({ error: 'Ruta inválida.' });

    const s3 = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: EXPIRES_IN_SECONDS });

    // Para <video src="/api/idrive-read-url?..."> funciona mejor redirigir al link firmado.
    res.setHeader('Location', signedUrl);
    return res.status(302).end();
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo preparar lectura IDrive e2: ' + (err?.message || err) });
  }
}

function readConfig() {
  const endpoint = (process.env.IDRIVE_E2_ENDPOINT || '').replace(/\/$/, '');
  const region = process.env.IDRIVE_E2_REGION || 'us-west-2';
  const bucket = process.env.IDRIVE_E2_BUCKET || 'metodoneri';
  const accessKeyId = process.env.IDRIVE_E2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.IDRIVE_E2_SECRET_ACCESS_KEY;
  const publicBase = (process.env.IDRIVE_E2_PUBLIC_BASE || `${endpoint}/${bucket}`).replace(/\/$/, '');

  if (!endpoint) return { error: 'Falta IDRIVE_E2_ENDPOINT.' };
  if (!bucket) return { error: 'Falta IDRIVE_E2_BUCKET.' };
  if (!accessKeyId || !secretAccessKey) return { error: 'Faltan credenciales IDrive e2 en Vercel.' };

  return { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBase };
}

function extractKey(input, cfg) {
  if (!input) return '';

  // Si llega directo como key: metodo-neri/asesor/folio/video/archivo.mp4
  if (!/^https?:\/\//i.test(input)) {
    return decodeURIComponent(input).replace(/^\/+/, '').replace(new RegExp('^' + escapeRegExp(cfg.bucket) + '/'), '');
  }

  const u = new URL(input);
  let path = decodeURIComponent(u.pathname || '').replace(/^\/+/, '');

  // Formato path-style: /metodoneri/metodo-neri/...
  if (path.startsWith(cfg.bucket + '/')) {
    path = path.slice(cfg.bucket.length + 1);
  }

  return path;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
