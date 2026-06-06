// /api/login.js — Método Neri · sesión firmada para intranet real
// Valida usuario por Slug en Airtable y entrega un token firmado.
// No expone AIRTABLE_TOKEN ni AIRTABLE_BASE al navegador.

import crypto from 'node:crypto';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const SESSION_SECRET = process.env.NERI_SESSION_SECRET;
const ASESOR_TABLE = process.env.AIRTABLE_ASESORES_TABLE || 'tblIRPmLIyj8sWyEk';
const PASS_FIELDS = ['Clave Acceso','Código Acceso','Codigo Acceso','Contraseña','Contrasena','Password','PIN','Access Code'];

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error:'Método no permitido' });
  if(!TOKEN || !BASE_ID) return res.status(500).json({ error:'Faltan variables AIRTABLE_TOKEN y/o AIRTABLE_BASE.' });
  if(!SESSION_SECRET) return res.status(500).json({ error:'Falta NERI_SESSION_SECRET para firmar sesiones.' });
  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body || {});
    const user = clean(body.user || body.slug || '');
    const pass = String(body.pass || '');
    const rolSolicitado = clean(body.rol || 'asesor');
    const modo = 'real';
    if(!user || !pass) return res.status(400).json({ error:'Usuario y contraseña son obligatorios.' });
    // Modo demo eliminado: toda entrada se valida contra administrador o Airtable.
    if(['admin','administrador'].includes(user)){
      const adminCode = process.env.NERI_ADMIN_CODE;
      if(!adminCode || pass !== adminCode) return res.status(401).json({ error:'Credenciales administrativas incorrectas.' });
      const payload = basePayload({ user:'admin', slug:'admin', rol:'admin', nombre:'Administrador Método NERI', whatsapp:'', empresa:'Método NERI', cuenta:'Método NERI', tipo:'Administrador Neri', estado:'Activo', pixel:'' });
      return res.status(200).json({ token: sign(payload), user: payload });
    }
    const rec = await findAsesorBySlug(user);
    if(!rec) return res.status(401).json({ error:'No se encontró asesor activo con ese slug.' });
    const f = rec.fields || {};
    const estado = field(f,'Estado') || (truthy(f['Activo']) ? 'Activo' : '');
    const estadoKey = statusKey(estado);
    if(estadoKey === 'inactivo' || (estadoKey !== 'activo' && !truthy(f['Activo']))) return res.status(403).json({ error:'El asesor no está activo. Revisa activación en Control de Mando.' });
    const fieldPass = PASS_FIELDS.map(k=>f[k]).find(Boolean);
    const globalCode = process.env.NERI_ACCESS_CODE;
    const passOk = fieldPass ? String(fieldPass) === pass : (globalCode && String(globalCode) === pass);
    if(!passOk) return res.status(401).json({ error: fieldPass ? 'Contraseña incorrecta.' : 'Falta configurar NERI_ACCESS_CODE o una clave de acceso en Airtable.' });
    const tipo = field(f,'Tipo') || (truthy(f['Independiente']) ? 'Asesor independiente' : 'Asesor de inmobiliaria');
    const rol = normalizeRole(rolSolicitado, tipo, field(f,'Puesto'));
    const payload = basePayload({
      user, slug: field(f,'Slug') || user, rol,
      nombre: field(f,'Nombre') || user,
      whatsapp: onlyDigits(field(f,'Teléfono WhatsApp') || field(f,'Telefono WhatsApp')),
      email: field(f,'Email'), ciudad: field(f,'Ciudad') || field(f,'Ciudad (texto viejo)'),
      empresa: field(f,'Cuenta') || field(f,'Cuenta asignada') || field(f,'Inmobiliaria') || field(f,'Inmobiliaria / Cuenta') || 'Método NERI',
      cuenta: field(f,'Cuenta') || field(f,'Cuenta asignada') || field(f,'Inmobiliaria') || field(f,'Inmobiliaria / Cuenta') || '',
      tipo, estado: estado || 'Activo', puesto: field(f,'Puesto') || field(f,'Puesto (texto viejo)'),
      pixel: field(f,'Pixel ID Meta'), linkCaptacion: field(f,'Link Captación'), recId: rec.id
    });
    return res.status(200).json({ token: sign(payload), user: payload });
  }catch(err){ return res.status(500).json({ error:'Error al iniciar sesión: '+(err?.message || err) }); }
}
function sign(payload){ const header=b64url(JSON.stringify({ alg:'HS256', typ:'JWT-NERI' })); const body=b64url(JSON.stringify(payload)); const sig=crypto.createHmac('sha256', SESSION_SECRET).update(header+'.'+body).digest('base64url'); return header+'.'+body+'.'+sig; }
function b64url(s){ return Buffer.from(s).toString('base64url'); }
function basePayload(data){ return { ...data, iat:Date.now(), exp:Date.now()+1000*60*60*12 }; }
function clean(v){ return String(v||'').trim().toLowerCase(); }
function onlyDigits(v){ return String(v||'').replace(/\D/g,''); }
function truthy(v){ const s=String(v).toLowerCase(); return v === true || s === 'true' || s === 'activo' || s === 'activa'; }
function statusKey(v){ const s=String(v||'').trim().toLowerCase(); if(s === 'activo' || s === 'activa') return 'activo'; if(s === 'inactivo' || s === 'inactiva') return 'inactivo'; return s || ''; }
function field(f,k){ const v=f?.[k]; if(Array.isArray(v)) return v.map(x=>x?.name||x).join(', '); if(v && typeof v==='object') return v.name || v.url || ''; return v == null ? '' : String(v); }
function normalizeRole(requested, tipo, puesto){ const p=String(puesto||'').toLowerCase(); const t=String(tipo||'').toLowerCase(); if(p.includes('director')) return 'director'; if(p.includes('gerente')||p.includes('coordinador')) return 'gerente'; if(t.includes('independiente')) return 'asesor'; return ['asesor','gerente','director'].includes(requested) ? requested : 'asesor'; }
async function findAsesorBySlug(slug){ const formula=encodeURIComponent(`LOWER({Slug})='${String(slug).toLowerCase().replace(/'/g,"\\'")}'`); const url=`https://api.airtable.com/v0/${BASE_ID}/${ASESOR_TABLE}?filterByFormula=${formula}&maxRecords=1`; const r=await fetch(url,{headers:{Authorization:`Bearer ${TOKEN}`}}); const data=await r.json(); if(!r.ok) throw new Error(data?.error?.message || JSON.stringify(data)); return data.records?.[0] || null; }
