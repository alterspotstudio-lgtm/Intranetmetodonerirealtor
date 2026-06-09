// /api/upload-idrive-url.js — Método NERI · subida directa a IDrive e2
// Genera una URL firmada S3-compatible para que el navegador suba videos
// directo al bucket, sin pasar el archivo por Vercel Functions.
//
// Variables Vercel necesarias:
//   IDRIVE_E2_ENDPOINT=https://s3.us-west-2.idrivee2.com
//   IDRIVE_E2_REGION=us-west-2
//   IDRIVE_E2_BUCKET=metodoneri
//   IDRIVE_E2_ACCESS_KEY_ID=...
//   IDRIVE_E2_SECRET_ACCESS_KEY=...
//   IDRIVE_E2_PUBLIC_BASE=https://s3.us-west-2.idrivee2.com/metodoneri
//   NERI_SESSION_SECRET=...

import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Tipos permitidos y su límite de tamaño en MB.
// Videos para la landing + imágenes (portada, foto de perfil) + PDFs.
const ALLOWED_TYPES = new Map([
  ['video/mp4',        500],
  ['video/quicktime',  500],
  ['video/x-m4v',      500],
  ['image/jpeg',        30],
  ['image/jpg',         30],
  ['image/png',         30],
  ['image/webp',        30],
  ['image/heic',        30],
  ['image/heif',        30],
  ['application/pdf',   50],
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const session = verifySession(req);
  if (!session) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  const cfg = readConfig();
  if (cfg.error) return res.status(500).json({ error: cfg.error });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const filename = cleanFilename(body.filename || 'video.mp4');
    const contentType = String(body.contentType || 'video/mp4').trim().toLowerCase();
    const size = Number(body.size || 0);
    const folio = cleanPathPart(body.folio || 'sin-folio');
    const doc = cleanPathPart(body.doc || 'video');
    const asesor = cleanPathPart(session.slug || session.user || session.nombre || 'asesor');

    if (!ALLOWED_TYPES.has(contentType)) {
      return res.status(400).json({ error: 'Tipo de archivo no permitido. Solo videos MP4/MOV, imágenes (JPG/PNG/WEBP/HEIC) o PDF.' });
    }
    const maxMb = ALLOWED_TYPES.get(contentType);
    if (size > maxMb * 1024 * 1024) {
      return res.status(413).json({ error: `El archivo supera el límite operativo de ${maxMb} MB para este tipo.` });
    }

    const ext = extensionFrom(filename, contentType);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = crypto.randomBytes(5).toString('hex');
    const key = `metodo-neri/${asesor}/${folio}/${doc}/${stamp}-${rand}${ext}`;

    const s3 = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 15 * 60 });
    const publicBase = (cfg.publicBase || `${cfg.endpoint.replace(/\/$/, '')}/${cfg.bucket}`).replace(/\/$/, '');
    const url = `${publicBase}/${key.split('/').map(encodeURIComponent).join('/')}`;

    return res.status(200).json({
      uploadUrl,
      url,
      key,
      method: 'PUT',
      expiresIn: 900,
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo preparar subida IDrive e2: ' + (err?.message || err) });
  }
}

function readConfig(){
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

function cleanPathPart(v){
  return String(v || 'sin-dato')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'sin-dato';
}
function cleanFilename(v){
  return String(v || 'video.mp4')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 120) || 'video.mp4';
}
function extensionFrom(filename, contentType){
  const m = String(filename).match(/\.[a-zA-Z0-9]{2,6}$/);
  if(m) return m[0].toLowerCase();
  const map = {
    'video/quicktime': '.mov',
    'video/mp4': '.mp4',
    'video/x-m4v': '.m4v',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/pdf': '.pdf',
  };
  return map[contentType] || '.bin';
}
