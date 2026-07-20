// =============================================================
//  api/activar-expediente.js  —  Método NERI · Expediente documental
//
//  Qué hace (lo llama la intranet, NO el propietario):
//   1. El asesor pide el link del expediente de un lead firmado.
//   2. El servidor genera UNA sola vez el token de seguridad (idempotente),
//      lo guarda en el lead (Token Expediente) junto con el link armado.
//   3. Asegura que exista la tabla "Expediente Documentos" y siembra / sincroniza
//      el checklist canónico del propietario en estado "Pendiente".
//   4. Devuelve SOLO el link armado (nunca el token suelto).
//
//  Variables Vercel necesarias:
//   - AIRTABLE_TOKEN, AIRTABLE_BASE, NERI_SESSION_SECRET
// =============================================================

import crypto from 'node:crypto';

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const SECRET = process.env.NERI_SESSION_SECRET;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';            // Leads Vendedores
const DOCS_TABLE = 'Expediente Documentos';         // se direcciona por nombre
const EXP_DOC_BASE = 'https://expedientedocumentalpropietario.vercel.app';
const ETAPAS_FIRMADAS = ['Firma exclusiva', 'Firma venta directa'];

// Checklist canónico del propietario. Debe mantenerse alineado con api/expediente-documentos.js
const DOCS = [
  // Bloque 1 · Identidad y persona — siempre
  { id: 'ine',               tipo: 'Identificación oficial vigente',            bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Identificación vigente del propietario.',                                  critico: true },
  { id: 'curp',              tipo: 'CURP',                                      bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Clave Única de Registro de Población.',                                  critico: true },
  { id: 'constancia_fiscal', tipo: 'RFC / constancia fiscal',                   bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Necesaria para revisar correctamente el tema fiscal e ISR.',              critico: true },
  { id: 'acta_nacimiento',   tipo: 'Acta de nacimiento',                        bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Acredita identidad y datos legales para escritura.',                      critico: true },
  { id: 'domicilio',         tipo: 'Comprobante de domicilio',                  bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Comprobante vigente del propietario.',                                    critico: true },
  // Reclasificado: se pide desde el inicio (no en notaría), pero no bloquea publicación.
  { id: 'clabe_bancaria',    tipo: 'CLABE bancaria',                            bloque: 'Notaría',              aplica: 'siempre',     gate_publicacion: false, descripcion: 'Cuenta para dispersión del pago al cierre.',                              critico: true },

  // Bloque 2 · Estado civil y representación — condicional
  { id: 'acta_matrimonio',   tipo: 'Acta de matrimonio / régimen matrimonial',  bloque: 'Estado civil y representación', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica cuando la situación civil lo requiere.',                           critico: false },
  { id: 'conyuge_id_docs',   tipo: 'ID y documentos del cónyuge',               bloque: 'Estado civil y representación', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si hay sociedad conyugal o firma del cónyuge.',                     critico: false },
  { id: 'poder_notarial',    tipo: 'Poder notarial + ID apoderado',             bloque: 'Estado civil y representación', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si firma un apoderado.',                                         critico: false },

  // Bloque 3 · Propiedad / legal — siempre
  { id: 'escritura',         tipo: 'Escritura pública o título inscrito',        bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Documento base que acredita la propiedad.',                               critico: true },
  { id: 'predial',           tipo: 'Último predial / boleta predial',            bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Boleta o comprobante de predial reciente.',                              critico: true },
  { id: 'agua_luz',          tipo: 'Último recibo de agua',                     bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Recibo de agua reciente. La luz no forma parte del set canónico.',        critico: true },
  { id: 'no_adeudo_predial', tipo: 'Certificado no adeudo predial',              bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Documento de Catastro municipal para notaría / ISABI.',                   critico: true },
  { id: 'no_adeudo_agua',    tipo: 'Certificado no adeudo agua',                 bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Documento del organismo de agua para notaría / cierre.',                 critico: true },
  { id: 'plano_catastral',   tipo: 'Plano catastral actualizado',                bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Necesario para avalúo / ISABI cuando corresponda.',                       critico: true },

  // Bloques condicionales
  { id: 'regimen_condominio',       tipo: 'Régimen de condominio',               bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica cuando la propiedad está en condominio.',                         critico: false },
  { id: 'reglamento_condominio',    tipo: 'Reglamento de condominio',            bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica cuando la administración lo requiere.',                            critico: false },
  { id: 'no_adeudo_mantenimiento',  tipo: 'Constancia no adeudo mantenimiento',  bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica en condominios o fraccionamientos con mantenimiento.',            critico: false },
  { id: 'carta_saldo',              tipo: 'Carta saldo',                         bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si existe crédito vigente sobre la vivienda.',                    critico: false },
  { id: 'exencion_isr',             tipo: 'Comprobantes exención ISR',           bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si el propietario busca exención de ISR.',                          critico: false },
  { id: 'licencia_terminacion_obra', tipo: 'Licencia / terminación obra / uso suelo', bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si existe irregularidad o regularización municipal.',             critico: false },
  { id: 'libertad_gravamen',        tipo: 'Libertad de gravamen',                bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Documento legal/notarial si se solicita para verificar gravamen.',          critico: false },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!TOKEN || !BASE) return res.status(500).json({ error: 'Faltan AIRTABLE_TOKEN y/o AIRTABLE_BASE en Vercel.' });
  if (!SECRET) return res.status(500).json({ error: 'Falta NERI_SESSION_SECRET en Vercel.' });

  if (!verifySession(req)) return res.status(401).json({ error: 'Sesión inválida o vencida.' });

  try {
    const body = parseBody(req);
    const folio = String(body.folio || '').trim();
    if (!folio) return res.status(400).json({ error: 'Falta el folio del lead.' });

    // 1) Localizar el lead vendedor por Folio
    const lead = await findLeadByFolio(folio);
    if (!lead) return res.status(404).json({ error: 'No se encontró un lead vendedor con ese folio.' });

    const conv = pickName(lead.fields['Conversión']);
    if (ETAPAS_FIRMADAS.indexOf(conv) === -1) {
      return res.status(409).json({ error: 'El expediente sólo se activa en Firma exclusiva o Firma venta directa.' });
    }

    // 2) Token idempotente: si ya existe, se reusa; si no, se genera y guarda
    let token = String(lead.fields['Token Expediente'] || '').trim();
    const link = buildLink(folio, token || (token = deterministicToken(folio)));

    const patch = {};
    if (!lead.fields['Token Expediente']) patch['Token Expediente'] = token;
    if (lead.fields['Link Expediente Documental'] !== link) patch['Link Expediente Documental'] = link;
    if (!lead.fields['Progreso Expediente']) patch['Progreso Expediente'] = 'Expediente activado · esperando documentos';
    if (Object.keys(patch).length) {
      await airPatch(LEADS_TABLE, lead.id, patch);
    }

    // 3) Asegurar tabla + sembrar/sincronizar checklist (no bloquea la respuesta si falla)
    let tablaLista = false;
    try {
      tablaLista = await ensureDocsTable();
      if (tablaLista) await seedChecklist(folio, lead);
    } catch (_) { tablaLista = false; }

    return res.status(200).json({ ok: true, folio, link, tabla_documentos: tablaLista });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'No se pudo activar el expediente.' });
  }
}

/* ───────── token ───────── */
function deterministicToken(folio) {
  return crypto.createHmac('sha256', SECRET).update('expediente:' + folio).digest('base64url');
}
function buildLink(folio, token) {
  return EXP_DOC_BASE + '/?folio=' + encodeURIComponent(folio) + '&token=' + encodeURIComponent(token);
}

/* ───────── Airtable REST ───────── */
function airHeaders() { return { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }; }

async function findLeadByFolio(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${LEADS_TABLE}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Error consultando el lead.');
  return (data.records && data.records[0]) || null;
}
async function airPatch(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
async function airListDocs(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(DOCS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  if (!r.ok) return null;                 // tabla aún no existe o sin acceso
  const data = await r.json();
  return data.records || [];
}
async function airCreate(table, records) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`;
  const r = await fetch(url, { method: 'POST', headers: airHeaders(), body: JSON.stringify({ records, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error creando registros.'); }
  return r.json();
}

/* ───────── bootstrap de la tabla "Expediente Documentos" ───────── */
async function ensureDocsTable() {
  // ¿Ya existe? (intento de lectura por nombre)
  const probe = await airListDocs('__probe__');
  if (probe !== null) return true;

  // Crear vía Meta API (requiere scope schema.bases:write en el token)
  const schema = {
    name: DOCS_TABLE,
    description: 'Un renglón por documento del expediente del propietario. Estado, archivo, validación y alerta de 48 h. La intranet escribe sola.',
    fields: [
      { name: 'Documento', type: 'singleLineText' },
      { name: 'Folio', type: 'singleLineText' },
      { name: 'Tipo de Documento', type: 'singleLineText' },
      { name: 'Document ID', type: 'singleLineText' },
      { name: 'Estado del Documento', type: 'singleSelect', options: { choices: [
        { name: 'Pendiente' }, { name: 'Recibido' }, { name: 'Validado' }, { name: 'Rechazado' }, { name: 'No aplica' },
      ] } },
      { name: 'Documento Crítico', type: 'checkbox', options: { icon: 'check', color: 'redBright' } },
      { name: 'Archivo URL', type: 'url' },
      { name: 'Nombre Archivo', type: 'singleLineText' },
      { name: 'Subido por', type: 'singleSelect', options: { choices: [
        { name: 'Cliente' }, { name: 'Asesor' }, { name: 'Sistema' },
      ] } },
      { name: 'Fecha Solicitud', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Fecha de Carga', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Motivo de Rechazo', type: 'multilineText' },
      { name: 'Alerta 48h Enviada', type: 'checkbox', options: { icon: 'check', color: 'yellowBright' } },
      { name: 'Asesor', type: 'singleLineText' },
    ],
  };
  const url = `https://api.airtable.com/v0/meta/bases/${BASE}/tables`;
  const r = await fetch(url, { method: 'POST', headers: airHeaders(), body: JSON.stringify(schema) });
  return r.ok;                            // si falla (sin scope), seguimos sin tabla
}

// Capa C: condicionales que se resuelven solos según las características de la operación
// que el asesor marca en el lead. Si el campo no está marcado, el documento nace
// "No aplica" en vez de "Pendiente". Documentos sin caso aquí abajo se comportan
// igual que siempre (nacen Pendiente), sea "siempre" o "condicional".
function condicionalAplica(docId, leadFields) {
  const estadoCivil = String((leadFields && leadFields['Estado civil']) || '');
  switch (docId) {
    case 'acta_matrimonio':
    case 'conyuge_id_docs':
      return estadoCivil === 'Casado';
    case 'poder_notarial':
      return Boolean(leadFields && leadFields['Firma por apoderado']);
    case 'regimen_condominio':
    case 'reglamento_condominio':
    case 'no_adeudo_mantenimiento':
      return Boolean(leadFields && leadFields['En condominio']);
    case 'carta_saldo':
      return Boolean(leadFields && leadFields['Crédito vigente']);
    case 'exencion_isr':
      return String((leadFields && leadFields['Exención ISR (casa habitación)']) || '') === 'Aplica';
    case 'licencia_terminacion_obra':
      return Boolean(leadFields && leadFields['Construcción irregular / uso de suelo']);
    default:
      return true;
  }
}

async function seedChecklist(folio, lead) {
  const existing = await airListDocs(folio);
  if (existing === null) return;          // tabla no disponible

  const existingIds = new Set((existing || []).map(r => r.fields && r.fields['Document ID']).filter(Boolean));
  const missing = DOCS.filter(d => !existingIds.has(d.id));
  if (!missing.length) return;            // ya sembrado / sincronizado (idempotente)

  const asesor = String(lead.fields['Asesor'] || '');
  const now = new Date().toISOString();
  const records = missing.map(d => {
    const aplica = d.aplica !== 'condicional' || condicionalAplica(d.id, lead.fields);
    return {
      fields: {
        'Documento': folio + ' · ' + d.tipo,
        'Folio': folio,
        'Tipo de Documento': d.tipo,
        'Document ID': d.id,
        'Estado del Documento': aplica ? 'Pendiente' : 'No aplica',
        'Documento Crítico': Boolean(d.critico),
        'Subido por': 'Sistema',
        'Fecha Solicitud': now,
        'Asesor': asesor,
      },
    };
  });
  for (let i = 0; i < records.length; i += 10) {
    await airCreate(DOCS_TABLE, records.slice(i, i + 10));
  }
}

/* ───────── utilidades ───────── */
function pickName(v) { if (!v) return ''; if (typeof v === 'string') return v; if (v.name) return v.name; return String(v); }
function parseBody(req) { if (!req.body) return {}; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } return req.body; }

function verifySession(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(parts[0] + '.' + parts[1]).digest('base64url');
  const aa = Buffer.from(String(expected));
  const bb = Buffer.from(String(parts[2]));
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (_) { return null; }
}
