// /api/idrive-read-url.js — Método NERI · lectura firmada desde IDrive e2 (bucket privado)
// El bucket "metodoneri" es PRIVADO. Este endpoint recibe la URL (o el key) de un
// objeto de iDrive guardado como TEXTO en Airtable, firma una URL GET temporal y
// redirige (302) a ella. Así el <video>/<img> de la landing —y el ingestor de
// attachments de Airtable— cargan el archivo privado sin exponer credenciales.
//
// Uso:
//   /api/idrive-read-url?url=<URL iDrive con encodeURIComponent>
//   /api/idrive-read-url?key=<key del objeto con encodeURIComponent>
//
// Variables Vercel necesarias (las mismas de la subida):
//   IDRIVE_E2_ENDPOINT, IDRIVE_E2_REGION, IDRIVE_E2_BUCKET,
//   IDRIVE_E2_ACCESS_KEY_ID, IDRIVE_E2_SECRET_ACCESS_KEY, IDRIVE_E2_PUBLIC_BASE (opcional)

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SIGNED_TTL = 6 * 60 * 60;      // 6 horas: no caduca a media reproducción
const KEY_PREFIX = 'metodo-neri/';   // solo se sirven objetos de nuestra carpeta

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const cfg = readConfig();
  if (cfg.error) return res.status(500).json({ error: cfg.error });

  let key = '';
  try {
    const rawKey = String(req.query?.key || '').trim();
    const rawUrl = String(req.query?.url || '').trim();
    if (rawKey)      key = cleanKey(rawKey, cfg);
    else if (rawUrl) key = keyFromUrl(rawUrl, cfg);
  } catch (e) {
    return res.status(400).json({ error: 'Parámetro url/key inválido: ' + (e?.message || e) });
  }

  if (!key) return res.status(400).json({ error: 'Falta ?url= o ?key= del objeto en IDrive e2.' });
  if (!key.startsWith(KEY_PREFIX)) return res.status(403).json({ error: 'Ruta no permitida.' });
  if (key.includes('..')) return res.status(403).json({ error: 'Ruta inválida.' });

  try {
    const s3 = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });

    const signed = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
      { expiresIn: SIGNED_TTL }
    );

    // Cache del redirect un poco menor al TTL de la firma: el navegador reutiliza
    // el redirect sin que la firma caduque a media reproducción.
    res.setHeader('Cache-Control', `public, max-age=${SIGNED_TTL - 600}`);
    res.writeHead(302, { Location: signed });
    return res.end();
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo firmar lectura IDrive e2: ' + (err?.message || err) });
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

// Limpia un key recibido directo: quita slashes iniciales y prefijo de bucket.
function cleanKey(raw, cfg) {
  let k = decodeURIComponent(raw).replace(/^\/+/, '');
  if (k.startsWith(cfg.bucket + '/')) k = k.slice(cfg.bucket.length + 1);
  return k;
}

// Convierte una URL de iDrive en el key del objeto, validando que pertenezca a
// nuestro endpoint/bucket (evita open-redirect / SSRF hacia otros hosts).
function keyFromUrl(raw, cfg) {
  const url = decodeURIComponent(raw);
  let u;
  try { u = new URL(url); } catch (_) { throw new Error('URL inválida'); }

  const hostOf = (s) => { try { return new URL(s).host; } catch (_) { return ''; } };
  const okHost = u.host === hostOf(cfg.endpoint) || (cfg.publicBase && u.host === hostOf(cfg.publicBase));
  if (!okHost) throw new Error('Host no permitido');

  let path = decodeURIComponent(u.pathname || '').replace(/^\/+/, '');
  if (path.startsWith(cfg.bucket + '/')) path = path.slice(cfg.bucket.length + 1);
  return path;
}
