// =============================================================
//  api/vendedor-expediente.js  —  Método NERI · Portal del propietario
//
//  El "portero" del portal de expediente documental. Cuando el propietario
//  abre el link (?folio=...&token=...), valida folio + token y devuelve los
//  datos del expediente para pintar el encabezado. Sin token válido: 401.
//
//  Validación de token (compatible hacia atrás):
//   - Si el lead ya tiene Token Expediente guardado → se compara contra ese.
//   - Si está vacío → se compara contra el token determinista
//     HMAC('expediente:'+folio) y, si coincide, se guarda (activación tardía).
//
//  Variables Vercel: AIRTABLE_TOKEN, AIRTABLE_BASE, NERI_SESSION_SECRET
// =============================================================

import crypto from 'node:crypto';

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const SECRET = process.env.NERI_SESSION_SECRET;
const LEADS_TABLE = 'tblQHdwEucTaNrLzm';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  if (!TOKEN || !BASE || !SECRET) return res.status(500).json({ error: 'Faltan variables de entorno en Vercel.' });

  const { folio, token } = getQuery(req);
  if (!folio || !token) return res.status(400).json({ error: 'Faltan folio y token en el enlace.' });

  try {
    const lead = await findLeadByFolio(folio);
    if (!lead) return res.status(404).json({ error: 'No se encontró el expediente.' });

    const stored = String(lead.fields['Token Expediente'] || '').trim();
    const deterministic = crypto.createHmac('sha256', SECRET).update('expediente:' + folio).digest('base64url');

    let valid = false;
    if (stored) {
      valid = safeEqual(token, stored);
    } else if (safeEqual(token, deterministic)) {
      valid = true;
      // Activación tardía: deja constancia del token para futuras validaciones.
      try { await airPatch(lead.id, { 'Token Expediente': deterministic }); } catch (_) {}
    }
    if (!valid) return res.status(401).json({ error: 'Token inválido para este expediente.' });

    const f = lead.fields;
    return res.status(200).json({
      record_id: lead.id,
      folio,
      nombre: f['Nombre Completo'] || 'Propietario',
      telefono: f['Teléfono WhatsApp'] || '',
      tipo_propiedad: f['Tipo de Propiedad'] || '',
      zona: f['Zona'] || '',
      precio: pickName(f['Precio Estimado']) || '',
      asesor: f['Asesor'] || 'Asesor Método NERI',
      estado_documental: f['Progreso Expediente'] || 'Pendiente de carga',
      expediente_activado: true,
      aviso_privacidad_aceptado: false,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'No se pudo cargar el expediente.' });
  }
}

function getQuery(req) {
  const q = req.query || {};
  const host = req.headers?.host || 'localhost';
  const u = new URL(req.url || '/', 'https://' + host);
  return {
    folio: String(q.folio || u.searchParams.get('folio') || '').trim(),
    token: String(q.token || u.searchParams.get('token') || '').trim(),
  };
}
function airHeaders() { return { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }; }
async function findLeadByFolio(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Error consultando el expediente.');
  return (data.records && data.records[0]) || null;
}
async function airPatch(id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}/${id}`;
  await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields }) });
}
function pickName(v) { if (!v) return ''; if (typeof v === 'string') return v; if (v.name) return v.name; return String(v); }
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}
