// /api/admin-user.js — Método Neri · alta administrativa real
// Crea/actualiza registros en Asesor Captación usando SOLO los campos confirmados:
// Nombre, Slug, Activo, Independiente, Puesto.
// No escribe Tipo, Estado, Cuenta, Link Captación ni contraseña en Airtable.

import crypto from 'node:crypto';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const SESSION_SECRET = process.env.NERI_SESSION_SECRET;
const ASESOR_TABLE = process.env.AIRTABLE_ASESORES_TABLE || 'tblIRPmLIyj8sWyEk';

const PUESTOS_VALIDOS = new Set(['Asesor Inmobiliario','Gerente de ventas','Director general','Asesor independiente']);

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Methods','POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(!['POST','PATCH'].includes(req.method)) return res.status(405).json({error:'Método no permitido'});
  if(!TOKEN || !BASE_ID) return res.status(500).json({error:'Faltan AIRTABLE_TOKEN y/o AIRTABLE_BASE.'});
  if(!SESSION_SECRET) return res.status(500).json({error:'Falta NERI_SESSION_SECRET.'});

  const session = verifySession(req);
  if(!session || !isAdmin(session)) return res.status(403).json({error:'Solo administrador puede crear o editar accesos.'});

  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body || {});
    const recordId = String(body.recordId || '').trim();
    const nombre = String(body.nombre || '').trim();
    const slug = slugify(body.slug || nombre);
    const tipoCuenta = String(body.tipoCuenta || 'Asesor independiente').trim();
    const activo = body.activo !== false && String(body.activo) !== 'false';
    const puesto = normalizePuesto(body.puesto, tipoCuenta);
    const independiente = tipoCuenta !== 'Inmobiliaria';

    if(!nombre) return res.status(400).json({error:'Falta Nombre.'});
    if(!slug) return res.status(400).json({error:'Falta Slug.'});

    if(req.method === 'POST'){
      const duplicate = await findBySlug(slug);
      if(duplicate) return res.status(409).json({error:'Ya existe un usuario con ese slug.'});
    }

    const fields = {
      'Nombre': nombre,
      'Slug': slug,
      'Activo': activo,
      'Independiente': independiente,
      'Puesto': puesto
    };

    const url = `https://api.airtable.com/v0/${BASE_ID}/${ASESOR_TABLE}${req.method==='PATCH' ? '/' + encodeURIComponent(recordId) : ''}`;
    if(req.method === 'PATCH' && !recordId) return res.status(400).json({error:'Falta recordId para editar.'});

    const r = await fetch(url, {
      method: req.method,
      headers: { Authorization:`Bearer ${TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ fields, typecast:true })
    });
    const data = await r.json();
    if(!r.ok){
      return res.status(r.status).json({error: data?.error?.message || 'Airtable rechazó el guardado.', detail:data});
    }

    return res.status(200).json({
      ok:true,
      record:data,
      slug,
      linkCaptacion:`https://captacion.vercel.app/?asesor=${encodeURIComponent(slug)}`,
      temporaryPassword: tempPassword(slug),
      authMode:'temporary-derived',
      note:'La contraseña temporal se genera desde el servidor. No se guarda en Airtable porque la tabla Asesor Captación no tiene campo de contraseña en el reporte actual.'
    });
  }catch(err){
    return res.status(500).json({error: err?.message || String(err)});
  }
}

function verifySession(req){
  const raw = req.headers?.authorization || req.headers?.Authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const p = token.split('.');
  if(p.length !== 3) return null;
  const expected = crypto.createHmac('sha256',SESSION_SECRET).update(p[0]+'.'+p[1]).digest('base64url');
  const aa = Buffer.from(String(expected)); const bb = Buffer.from(String(p[2]));
  if(aa.length !== bb.length || !crypto.timingSafeEqual(aa,bb)) return null;
  try{
    const payload = JSON.parse(Buffer.from(p[1],'base64url').toString('utf8'));
    if(payload.exp && Date.now() > payload.exp) return null;
    return payload;
  }catch(_){ return null; }
}
function isAdmin(s){ return ['admin','administrador'].includes(String(s?.rol||'').toLowerCase()); }
function slugify(txt){
  return String(txt||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/ñ/g,'n').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);
}
function normalizePuesto(puesto, tipoCuenta){
  const p = String(puesto||'').trim();
  if(PUESTOS_VALIDOS.has(p)) return p;
  const t = String(tipoCuenta||'').toLowerCase();
  if(t.includes('grupo')) return 'Gerente de ventas';
  if(t.includes('inmobiliaria')) return 'Asesor Inmobiliario';
  return 'Asesor independiente';
}
function tempPassword(slug){
  const raw = crypto.createHmac('sha256', SESSION_SECRET).update('temp-password:'+String(slug||'').toLowerCase()).digest('hex').slice(0,8).toUpperCase();
  return `NERI-${raw}`;
}
async function findBySlug(slug){
  const formula = encodeURIComponent(`LOWER({Slug})='${String(slug).toLowerCase().replace(/'/g,"\\'")}'`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${ASESOR_TABLE}?filterByFormula=${formula}&maxRecords=1`;
  const r = await fetch(url,{headers:{Authorization:`Bearer ${TOKEN}`}});
  const data = await r.json();
  if(!r.ok) throw new Error(data?.error?.message || 'No se pudo revisar duplicado de slug.');
  return data.records?.[0] || null;
}
