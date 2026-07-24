// =============================================================
//  api/expediente-documentos.js  —  Método NERI · Registro + validación
//
//  Una sola puerta para el ciclo de cada documento del expediente:
//
//   GET  ?folio=&token=                 → lista los documentos del folio
//   POST {action:'documento_recibido'}  → el propietario subió un archivo
//                                          (auth: folio + token)  · CHECK-IN
//   POST {action:'validar'|'rechazar'|'no_aplica'}
//                                      → el asesor revisa o marca no aplicable
//                                          (auth: sesión NERI Bearer)
//
//  Cada subida hace "check-in" en el lead (campo Progreso Expediente) para que
//  la intranet vea que el expediente avanzó. La tabla guarda un renglón por
//  documento, con estado, archivo, fecha y guarda de alerta de 48 h.
//
//  Variables Vercel: AIRTABLE_TOKEN, AIRTABLE_BASE, NERI_SESSION_SECRET
// =============================================================

import crypto from 'node:crypto';

const BASE = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const SECRET = process.env.NERI_SESSION_SECRET;

const LEADS_TABLE = 'tblQHdwEucTaNrLzm';
const DOCS_TABLE = 'Expediente Documentos';

const DOCS = [
  // Bloque 1 · Identidad y persona — siempre
  { id: 'ine',               tipo: 'Identificación oficial vigente',            bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Identificación vigente del propietario.',                                  critico: true },
  { id: 'curp',              tipo: 'CURP',                                      bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Clave Única de Registro de Población.',                                  critico: true },
  { id: 'constancia_fiscal', tipo: 'RFC / constancia fiscal',                   bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Necesaria para revisar correctamente el tema fiscal e ISR.',              critico: true, vigencia_dias: 60 },
  { id: 'acta_nacimiento',   tipo: 'Acta de nacimiento',                        bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Acredita identidad y datos legales para escritura.',                      critico: true },
  { id: 'domicilio',         tipo: 'Comprobante de domicilio',                  bloque: 'Identidad y persona', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Comprobante vigente del propietario.',                                    critico: true, vigencia_dias: 60 },

  // Bloque 2 · Estado civil y representación — condicional
  { id: 'acta_matrimonio',   tipo: 'Acta de matrimonio, si está casado',         bloque: 'Estado civil y representación', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica cuando la situación civil lo requiere.',                           critico: false },
  { id: 'conyuge_id_docs',   tipo: 'ID y documentos del cónyuge',               bloque: 'Estado civil y representación', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si hay sociedad conyugal o firma del cónyuge.',                     critico: false },
  { id: 'poder_notarial',    tipo: 'Poder notarial + ID del apoderado',          bloque: 'Estado civil y representación', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si firma un apoderado.',                                         critico: false },

  // Bloque 3 · Propiedad / legal — siempre
  { id: 'escritura',         tipo: 'Escritura pública o título inscrito',        bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Documento base que acredita la propiedad.',                               critico: true },
  { id: 'libertad_gravamen', tipo: 'Libertad de gravamen',                       bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: false, descripcion: 'Certificado de que la propiedad no tiene deudas ni embargos registrados.', critico: true },
  { id: 'predial',           tipo: 'Último predial / boleta predial',            bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Boleta o comprobante de predial reciente.',                              critico: true, vigencia_dias: 60 },
  { id: 'agua_luz',          tipo: 'Último recibo de agua',                     bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: true,  descripcion: 'Recibo de agua reciente. La luz no forma parte del set canónico.',        critico: true, vigencia_dias: 60 },
  { id: 'no_adeudo_predial', tipo: 'Certificado no adeudo predial',              bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: false, descripcion: 'Documento de Catastro municipal para notaría / ISABI.',                   critico: true, vigencia_dias: 60 },
  { id: 'no_adeudo_agua',    tipo: 'Certificado no adeudo agua',                 bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: false, descripcion: 'Documento del organismo de agua para notaría / cierre.',                 critico: true, vigencia_dias: 60 },
  { id: 'plano_catastral',   tipo: 'Plano catastral actualizado',                bloque: 'Propiedad / legal', aplica: 'siempre',     gate_publicacion: false, descripcion: 'Necesario para avalúo / ISABI cuando corresponda.',                       critico: true, vigencia_dias: 60 },

  // Bloques condicionales
  { id: 'regimen_condominio',       tipo: 'Régimen de condominio',               bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica cuando la propiedad está en condominio.',                         critico: false },
  { id: 'reglamento_condominio',    tipo: 'Reglamento de condominio',            bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica cuando la administración lo requiere.',                            critico: false },
  { id: 'no_adeudo_mantenimiento',  tipo: 'Constancia de no adeudo de mantenimiento', bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica en condominios o fraccionamientos con mantenimiento.',            critico: false, vigencia_dias: 60 },
  { id: 'carta_saldo',              tipo: 'Carta saldo, si hay crédito vigente',  bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si existe crédito vigente sobre la vivienda.',                    critico: false, vigencia_dias: 60 },
  { id: 'exencion_isr',             tipo: 'Comprobantes de exención ISR',         bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si el propietario busca exención de ISR.',                          critico: false, vigencia_dias: 60 },
  { id: 'licencia_terminacion_obra', tipo: 'Licencia / terminación de obra / uso de suelo', bloque: 'Condicionales', aplica: 'condicional', gate_publicacion: false, descripcion: 'Aplica si existe irregularidad o regularización municipal.',             critico: false, vigencia_dias: 60 },
  // Reclasificado: se pide desde el inicio (no en notaría), pero no bloquea publicación.
  { id: 'clabe_bancaria',           tipo: 'CLABE bancaria',                      bloque: 'Notaría',       aplica: 'siempre',     gate_publicacion: false, descripcion: 'Cuenta para dispersión del pago al cierre.',                              critico: false, vigencia_dias: 60 },
];
const DOC_BY_ID = Object.fromEntries(DOCS.map(d => [d.id, d]));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!TOKEN || !BASE || !SECRET) return res.status(500).json({ error: 'Faltan variables de entorno en Vercel.' });

  try {
    if (req.method === 'GET') return await handleList(req, res);
    if (req.method === 'POST') return await handlePost(req, res);
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Error en expediente-documentos.' });
  }
}

/* ───────── GET: listar documentos del folio ───────── */
async function handleList(req, res) {
  const { folio, token } = getQuery(req);
  if (!folio || !token) return res.status(400).json({ error: 'Faltan folio y token.' });

  const lead = await findLeadByFolio(folio);
  if (!lead) return res.status(404).json({ error: 'Expediente no encontrado.' });
  if (!validToken(folio, token, lead.fields['Token Expediente'])) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  let rows = await airListDocs(folio);
  if (rows === null) return res.status(200).json({ documents: [] }); // tabla aún no creada → portal muestra checklist base
  rows = await syncChecklist(folio, lead, rows);

  const documents = rowsToDocuments(rows);
  const gate = calcGate(rows);
  return res.status(200).json({ documents, gate });
}

/* ───────── POST: ruteo por acción ───────── */
async function handlePost(req, res) {
  const body = parseBody(req);
  const action = String(body.action || '').trim();

  if (action === 'documento_recibido') return await handleReceived(req, res, body);
  if (action === 'validar' || action === 'rechazar' || action === 'no_aplica') return await handleReview(req, res, body, action);
  if (action === 'resync_condicionales') return await handleResync(req, res, body);
  return res.status(400).json({ error: 'Acción no reconocida.' });
}

/* CHECK-IN del propietario (o asesor con token) */
async function handleReceived(req, res, body) {
  const folio = String(body.folio || '').trim();
  const token = String(body.token || '').trim();
  if (!folio || !token) return res.status(400).json({ error: 'Faltan folio y token.' });

  const lead = await findLeadByFolio(folio);
  if (!lead) return res.status(404).json({ error: 'Expediente no encontrado.' });
  if (!validToken(folio, token, lead.fields['Token Expediente'])) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  const documentId = String(body.document_id || '').trim() || slug(body.tipo_documento || 'documento');
  const tipo = body.tipo_documento || (DOC_BY_ID[documentId] && DOC_BY_ID[documentId].tipo) || documentId;
  const critico = DOC_BY_ID[documentId] ? DOC_BY_ID[documentId].critico : false;
  const fields = {
    'Documento': folio + ' · ' + tipo,
    'Folio': folio,
    'Tipo de Documento': tipo,
    'Document ID': documentId,
    'Estado del Documento': 'Recibido',
    'Documento Crítico': critico,
    'Archivo URL': body.archivo_url || '',
    'Nombre Archivo': body.filename || '',
    'Subido por': body.subido_por === 'Asesor' ? 'Asesor' : 'Cliente',
    'Fecha de Carga': body.uploaded_at || new Date().toISOString(),
    'Motivo de Rechazo': '',
    'Alerta 48h Enviada': false,
    'Asesor': lead.fields['Asesor'] || '',
  };

  let guardado = false;
  await ensureDocsTable();
  let existing = await airListDocs(folio);
  if (existing !== null) {
    existing = await syncChecklist(folio, lead, existing);
    const row = existing.find(r => (r.fields && r.fields['Document ID']) === documentId);
    try {
      if (row) await airPatch(DOCS_TABLE, row.id, fields);
      else await airCreate(DOCS_TABLE, [{ fields }]);
      guardado = true;
    } catch (_) { guardado = false; }
  }

  // Check-in al lead: la intranet lee este campo
  try { await checkInLead(lead, folio, existing, documentId); } catch (_) {}

  // Aunque la tabla falle, el archivo ya está en Blob: nunca rompemos la subida.
  return res.status(200).json({ ok: true, registrado: guardado, document_id: documentId });
}

/* REVISIÓN del asesor: validar / rechazar */
async function handleReview(req, res, body, action) {
  if (!verifySession(req)) return res.status(401).json({ error: 'Sesión de asesor inválida o vencida.' });
  const folio = String(body.folio || '').trim();
  const documentId = String(body.document_id || '').trim();
  const recordId = String(body.record_id || '').trim();
  if (!folio || (!documentId && !recordId)) return res.status(400).json({ error: 'Falta folio y documento.' });

  const rows = await airListDocs(folio);
  if (!rows || !rows.length) return res.status(404).json({ error: 'No hay documentos registrados para ese folio.' });
  const row = recordId ? rows.find(r => r.id === recordId) : rows.find(r => (r.fields && r.fields['Document ID']) === documentId);
  if (!row) return res.status(404).json({ error: 'Documento no encontrado.' });

  const docId = (row.fields && row.fields['Document ID']) || documentId;
  const base = DOC_BY_ID[docId] || {};
  let fields;
  if (action === 'validar') {
    fields = { 'Estado del Documento': 'Validado', 'Motivo de Rechazo': '' };
  } else if (action === 'no_aplica') {
    if (base.aplica !== 'condicional') return res.status(409).json({ error: 'Solo los documentos condicionales pueden marcarse como No aplica.' });
    fields = { 'Estado del Documento': 'No aplica', 'Motivo de Rechazo': String(body.motivo || 'No aplica para esta operación.') };
  } else {
    fields = { 'Estado del Documento': 'Rechazado', 'Motivo de Rechazo': String(body.motivo || 'Documento ilegible o incompleto.') };
  }
  await airPatch(DOCS_TABLE, row.id, fields);

  try {
    const lead = await findLeadByFolio(folio);
    if (lead) await checkInLead(lead, folio, await airListDocs(folio), null);
  } catch (_) {}

  return res.status(200).json({ ok: true, estado: fields['Estado del Documento'] });
}

/* Resincroniza los documentos condicionales cuando cambian los "Datos de la
   operación" (Estado civil, Firma por apoderado, En condominio, Crédito
   vigente, Exención ISR, Construcción irregular) DESPUÉS de que el
   expediente ya existe. Reglas:
   - Si aún no hay expediente para el folio, no hace nada (no es error).
   - Nunca toca un documento ya "Validado".
   - Tampoco toca uno ya "Recibido" (el propietario ya lo subió) — si deja
     de aplicar, lo revisa el asesor a mano en vez de que el sistema lo
     esconda solo.
   - Solo mueve Pendiente <-> No aplica según el nuevo valor de los checks.
   Pedido por Enrique 23-jul-2026 tras la prueba en vivo del lead vendedor. */
async function handleResync(req, res, body) {
  if (!verifySession(req)) return res.status(401).json({ error: 'Sesión de asesor inválida o vencida.' });
  const folio = String(body.folio || '').trim();
  if (!folio) return res.status(400).json({ error: 'Falta folio.' });

  const lead = await findLeadByFolio(folio);
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado.' });

  const rows = await airListDocs(folio);
  if (!rows || !rows.length) {
    return res.status(200).json({ ok: true, actualizados: 0, nota: 'Aún no existe expediente para este folio.' });
  }

  const cambios = [];
  for (const row of rows) {
    const f = row.fields || {};
    const docId = f['Document ID'];
    const base = DOC_BY_ID[docId];
    if (!base || base.aplica !== 'condicional') continue;
    const estadoActual = pickName(f['Estado del Documento']) || 'Pendiente';
    if (estadoActual === 'Validado' || estadoActual === 'Recibido') continue;
    const deberiaSer = condicionalAplica(docId, lead.fields) ? 'Pendiente' : 'No aplica';
    if (estadoActual !== deberiaSer) {
      await airPatch(DOCS_TABLE, row.id, { 'Estado del Documento': deberiaSer });
      cambios.push({ document_id: docId, de: estadoActual, a: deberiaSer });
    }
  }
  return res.status(200).json({ ok: true, actualizados: cambios.length, cambios });
}

/* ───────── check-in: escribe el avance en el lead ───────── */
async function checkInLead(lead, folio, rows, lastDocId) {
  let workRows = Array.isArray(rows) ? rows.slice() : [];
  if (lastDocId && !workRows.some(r => (r.fields && r.fields['Document ID']) === lastDocId)) {
    workRows.push({ fields: { 'Document ID': lastDocId, 'Estado del Documento': 'Recibido', 'Fecha de Carga': new Date().toISOString() } });
  }
  const always = DOCS.filter(d => d.aplica === 'siempre');
  const gateDocs = DOCS.filter(d => d.gate_publicacion);
  const rowById = Object.fromEntries(workRows.map(r => [r.fields && r.fields['Document ID'], r]));
  const stateById = Object.fromEntries(workRows.map(r => [r.fields && r.fields['Document ID'], pickName(r.fields && r.fields['Estado del Documento'])]));
  const baseRecibida = always.filter(d => ['Recibido', 'Validado'].includes(stateById[d.id])).length;
  const gateValidada = gateDocs.filter(d => stateById[d.id] === 'Validado' && !isDocExpired(rowById[d.id] && rowById[d.id].fields, d)).length;
  const gateVencida = gateDocs.filter(d => stateById[d.id] === 'Validado' && isDocExpired(rowById[d.id] && rowById[d.id].fields, d)).length;
  const label = gateValidada >= gateDocs.length && gateVencida === 0
    ? 'Expediente propietario mínimo validado (' + gateValidada + '/' + gateDocs.length + ') · listo para publicar'
    : 'Base recibida: ' + baseRecibida + '/' + always.length + ' · mínimo validado ' + gateValidada + '/' + gateDocs.length + (gateVencida ? ' · vigencia vencida ' + gateVencida : '');
  await airPatch(LEADS_TABLE, lead.id, { 'Progreso Expediente': label });
}


function rowsToDocuments(rows) {
  const order = Object.fromEntries(DOCS.map((d, i) => [d.id, i]));
  return (rows || [])
    .filter(r => DOC_BY_ID[(r.fields && r.fields['Document ID']) || ''])
    .slice().sort((a, b) => {
      const aid = a.fields && a.fields['Document ID'];
      const bid = b.fields && b.fields['Document ID'];
      return (order[aid] ?? 999) - (order[bid] ?? 999);
    }).map(r => {
      const f = r.fields || {};
      const docId = f['Document ID'] || '';
      const base = DOC_BY_ID[docId] || {};
      const vigencia = calcVigencia(f['Fecha de Carga'], base.vigencia_dias);
      return {
        id: docId || r.id,
        tipo: base.tipo || f['Tipo de Documento'] || 'Documento',
        descripcion: base.descripcion || 'Carga el archivo correspondiente a este documento.',
        estado: pickName(f['Estado del Documento']) || 'Pendiente',
        critico: Boolean(base.critico),
        bloque: base.bloque || '',
        aplica: base.aplica || 'siempre',
        gate_publicacion: Boolean(base.gate_publicacion),
        vigencia_dias: Number(base.vigencia_dias || 0),
        fecha_vencimiento: vigencia.fecha_vencimiento,
        vigencia_estado: vigencia.estado,
        dias_para_vencer: vigencia.dias_para_vencer,
        requiere_actualizacion: vigencia.estado === 'Vencido',
        archivo_url: f['Archivo URL'] || '',
        fecha_carga: f['Fecha de Carga'] || '',
        motivo_rechazo: f['Motivo de Rechazo'] || '',
      };
    });
}
function calcGate(rows) {
  const rowById = Object.fromEntries((rows || []).map(r => [r.fields && r.fields['Document ID'], r]));
  const stateById = Object.fromEntries((rows || []).map(r => [r.fields && r.fields['Document ID'], pickName(r.fields && r.fields['Estado del Documento'])]));
  const gateDocs = DOCS.filter(d => d.gate_publicacion);
  const validados = gateDocs.filter(d => stateById[d.id] === 'Validado' && !isDocExpired(rowById[d.id] && rowById[d.id].fields, d)).length;
  const pendientes = gateDocs
    .filter(d => stateById[d.id] !== 'Validado' || isDocExpired(rowById[d.id] && rowById[d.id].fields, d))
    .map(d => {
      const expired = stateById[d.id] === 'Validado' && isDocExpired(rowById[d.id] && rowById[d.id].fields, d);
      return { id: d.id, tipo: d.tipo, estado: expired ? 'Vencido' : (stateById[d.id] || 'Pendiente') };
    });
  const vencidos = pendientes.filter(p => p.estado === 'Vencido');
  return { ok: validados === gateDocs.length && vencidos.length === 0, validados, total: gateDocs.length, pendientes, vencidos };
}
function calcVigencia(fechaCarga, vigenciaDias) {
  const dias = Number(vigenciaDias || 0);
  if (!dias || !fechaCarga) return { estado: '', fecha_vencimiento: '', dias_para_vencer: null };
  const loaded = new Date(fechaCarga);
  if (Number.isNaN(loaded.getTime())) return { estado: '', fecha_vencimiento: '', dias_para_vencer: null };
  const vence = new Date(loaded.getTime() + dias * 86400000);
  const diff = Math.ceil((vence.getTime() - Date.now()) / 86400000);
  return {
    estado: diff < 0 ? 'Vencido' : (diff <= 15 ? 'Por vencer' : 'Vigente'),
    fecha_vencimiento: vence.toISOString(),
    dias_para_vencer: diff,
  };
}
function isDocExpired(fields, base) {
  const vigencia = calcVigencia(fields && fields['Fecha de Carga'], base && base.vigencia_dias);
  return vigencia.estado === 'Vencido';
}
// Capa C: mismo resolver que activar-expediente.js — debe mantenerse alineado.
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

async function syncChecklist(folio, lead, rows) {
  const existingIds = new Set((rows || []).map(r => r.fields && r.fields['Document ID']).filter(Boolean));
  const missing = DOCS.filter(d => !existingIds.has(d.id));
  if (!missing.length) return rows || [];
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
  return await airListDocs(folio) || rows || [];
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
async function airListDocs(folio) {
  const formula = "{Folio}='" + folio.replace(/'/g, "\\'") + "'";
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(DOCS_TABLE)}?filterByFormula=${encodeURIComponent(formula)}`;
  const r = await fetch(url, { headers: airHeaders() });
  if (!r.ok) return null;
  const data = await r.json();
  return data.records || [];
}
async function airPatch(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { method: 'PATCH', headers: airHeaders(), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error guardando en Airtable.'); }
  return r.json();
}
async function airCreate(table, records) {
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`;
  const r = await fetch(url, { method: 'POST', headers: airHeaders(), body: JSON.stringify({ records, typecast: true }) });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d?.error?.message || 'Error creando registros.'); }
  return r.json();
}
async function ensureDocsTable() {
  const probe = await airListDocs('__probe__');
  if (probe !== null) return true;
  const schema = {
    name: DOCS_TABLE,
    description: 'Un renglón por documento del expediente del propietario. La intranet escribe sola.',
    fields: [
      { name: 'Documento', type: 'singleLineText' },
      { name: 'Folio', type: 'singleLineText' },
      { name: 'Tipo de Documento', type: 'singleLineText' },
      { name: 'Document ID', type: 'singleLineText' },
      { name: 'Estado del Documento', type: 'singleSelect', options: { choices: [
        { name: 'Pendiente' }, { name: 'Recibido' }, { name: 'Validado' }, { name: 'Rechazado' }, { name: 'No aplica' } ] } },
      { name: 'Documento Crítico', type: 'checkbox', options: { icon: 'check', color: 'redBright' } },
      { name: 'Archivo URL', type: 'url' },
      { name: 'Nombre Archivo', type: 'singleLineText' },
      { name: 'Subido por', type: 'singleSelect', options: { choices: [ { name: 'Cliente' }, { name: 'Asesor' }, { name: 'Sistema' } ] } },
      { name: 'Fecha Solicitud', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Fecha de Carga', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'America/Mexico_City' } },
      { name: 'Motivo de Rechazo', type: 'multilineText' },
      { name: 'Alerta 48h Enviada', type: 'checkbox', options: { icon: 'check', color: 'yellowBright' } },
      { name: 'Asesor', type: 'singleLineText' },
    ],
  };
  const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, { method: 'POST', headers: airHeaders(), body: JSON.stringify(schema) });
  return r.ok;
}

/* ───────── utilidades ───────── */
function getQuery(req) {
  const q = req.query || {};
  const host = req.headers?.host || 'localhost';
  const u = new URL(req.url || '/', 'https://' + host);
  return {
    folio: String(q.folio || u.searchParams.get('folio') || '').trim(),
    token: String(q.token || u.searchParams.get('token') || '').trim(),
  };
}
function parseBody(req) { if (!req.body) return {}; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } return req.body; }
function pickName(v) { if (!v) return ''; if (typeof v === 'string') return v; if (v.name) return v.name; return String(v); }
function slug(v) {
  return String(v || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'documento';
}
function validToken(folio, token, stored) {
  const s = String(stored || '').trim();
  if (s) return safeEqual(token, s);
  const deterministic = crypto.createHmac('sha256', SECRET).update('expediente:' + folio).digest('base64url');
  return safeEqual(token, deterministic);
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}
function verifySession(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(parts[0] + '.' + parts[1]).digest('base64url');
  const aa = Buffer.from(String(expected)); const bb = Buffer.from(String(parts[2]));
  if (aa.length !== bb.length || !crypto.timingSafeEqual(aa, bb)) return null;
  try { const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); if (p.exp && Date.now() > p.exp) return null; return p; }
  catch (_) { return null; }
}
