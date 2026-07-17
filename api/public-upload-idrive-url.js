// /api/public-upload-idrive-url.js — Método NERI · subida pública (landing de recepción de clientes)
// Variante SIN sesión de asesor: la usa la landing pública donde un prospecto/cliente
// sube sus propios videos. Restringida a video, tamaño limitado y protegida con un
// secreto simple en el query (?k=) para frenar abuso automatizado — no es autenticación
// real, es solo un candado ligero porque el endpoint queda abierto en internet.
//
// Variables Vercel necesarias (las mismas que ya tienes para IDrive e2, más una nueva):
//   IDRIVE_E2_ENDPOINT, IDRIVE_E2_REGION, IDRIVE_E2_BUCKET,
//   IDRIVE_E2_ACCESS_KEY_ID, IDRIVE_E2_SECRET_ACCESS_KEY, IDRIVE_E2_PUBLIC_BASE
//   NERI_PUBLIC_UPLOAD_SECRET=alguna-palabra-larga-solo-tuya

import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MAX_VIDEO_MB = 500;
const ALLOWED_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-m4v']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const secret = process.env.NERI_PUBLIC_UPLOAD_SECRET;
  const provided = String(req.query?.k || '');
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const cfg = readConfig();
  if (cfg.error) return res.status(500).json({ error: cfg.error });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const filename = cleanFilename(body.filename || 'video.mp4');
    const contentType = String(body.contentType || 'video/mp4').trim().toLowerCase();
    const size = Number(body.size || 0);
    const cliente = cleanPathPart(body.cliente || 'sin-nombre');
    const telefono = cleanPathPart(body.telefono || 'sin-telefono');

    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ error: 'Solo se permiten videos MP4/MOV.' });
    }
    if (size > MAX_VIDEO_MB * 1024 * 1024) {
      return res.status(413).json({ error: `El video supera el límite de ${MAX_VIDEO_MB} MB.` });
    }

    const ext = extensionFrom(filename, contentType);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = crypto.randomBytes(5).toString('hex');
    const key = `clientes-landing/${telefono}-${cliente}/${stamp}-${rand}${ext}`;

    const s3 = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });

    const command = new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 20 * 60 });
    const publicBase = (cfg.publicBase || `${cfg.endpoint.replace(/\/$/, '')}/${cfg.bucket}`).replace(/\/$/, '');
    const url = `${publicBase}/${key.split('/').map(encodeURIComponent).join('/')}`;

    return res.status(200).json({ uploadUrl, url, key, method: 'PUT', headers: { 'Content-Type': contentType } });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo preparar la subida: ' + (err?.message || err) });
  }
}

function readConfig() {
  const endpoint = (process.env.IDRIVE_E2_ENDPOINT || '').replace(/\/$/, '');
  const region = process.env.IDRIVE_E2_REGION || 'us-west-2';
  const bucket = process.env.IDRIVE_E2_BUCKET || 'metodoneri';
  const accessKeyId = process.env.IDRIVE_E2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.IDRIVE_E2_SECRET_ACCESS_KEY;
  const publicBase = process.env.IDRIVE_E2_PUBLIC_BASE || '';
  if (!endpoint) return { error: 'Falta IDRIVE_E2_ENDPOINT.' };
  if (!bucket) return { error: 'Falta IDRIVE_E2_BUCKET.' };
  if (!accessKeyId || !secretAccessKey) return { error: 'Faltan credenciales IDrive e2 en Vercel.' };
  return { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBase };
}
function cleanPathPart(v) {
  return String(v || 'sin-dato').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sin-dato';
}
function cleanFilename(v) {
  return String(v || 'video.mp4').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120) || 'video.mp4';
}
function extensionFrom(filename, contentType) {
  const m = String(filename).match(/\.[a-zA-Z0-9]{2,6}$/);
  if (m) return m[0].toLowerCase();
  if (contentType === 'video/quicktime') return '.mov';
  return '.mp4';
}
