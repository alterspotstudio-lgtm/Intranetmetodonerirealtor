// /api/airtable.js — Proxy seguro Método NERI → Airtable
// Aplica control server-side por sesión firmada, rol, slug y cuenta.

import crypto from 'node:crypto';

const BASE_ID = process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const SESSION_SECRET = process.env.NERI_SESSION_SECRET;
const TABLES = {
  compradores: { id:'tblOdlY3bBlGi64qR', ownerField:'Asesor' },
  vendedores: { id:'tblQHdwEucTaNrLzm', ownerField:'Asesor' },
  progreso: { id:'tblyC9VjjtoRKJPQL', ownerField:'Asesor' },
  citas: { id:'tblaAfbSD3pqSLdAA', ownerField:'Asesor' },
  propiedades: { id:'tblmco2JyXRiZGhaY', ownerField:'Asesor' },
  asesores: { id: process.env.AIRTABLE_ASESORES_TABLE || 'tblIRPmLIyj8sWyEk', slugField:'Slug' },
};
const TABLE_BY_ID = Object.fromEntries(Object.values(TABLES).map(t=>[t.id,t]));
const PROFILE_EDITABLE = new Set(['Nombre','Teléfono WhatsApp','Email','Ciudad','Frase','Pixel ID Meta','Foto']);
export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(!TOKEN || !BASE_ID) return res.status(500).json({error:'Faltan variables AIRTABLE_TOKEN y/o AIRTABLE_BASE en Vercel.'});
  if(!SESSION_SECRET) return res.status(500).json({error:'Falta NERI_SESSION_SECRET para validar sesiones.'});
  const session = verifySession(req); if(!session) return res.status(401).json({error:'Sesión inválida o vencida.'});
  const path = req.query.path; if(!path) return res.status(400).json({error:'Falta el parámetro ?path='});
  try{
    const parsed=parseAirtablePath(path); const tableCfg=TABLE_BY_ID[parsed.table];
    if(!tableCfg) return res.status(403).json({error:'Tabla no autorizada por el proxy Método NERI.'});
    if(req.method==='GET') applyReadScope(parsed,tableCfg,session);
    if(req.method==='POST') applyWriteScope(req,tableCfg,session);
    if(req.method==='PATCH') await applyPatchScope(req,parsed,tableCfg,session);
    if(req.method==='DELETE' && !isAdmin(session)) return res.status(403).json({error:'Solo administrador puede eliminar registros.'});
    const airtableRes=await fetch(parsed.toAirtableUrl(BASE_ID),{method:req.method,headers:{Authorization:`Bearer ${TOKEN}`,'Content-Type':'application/json'},...(req.method!=='GET'&&req.body?{body:typeof req.body==='string'?req.body:JSON.stringify(req.body)}:{})});
    const text=await airtableRes.text(); res.status(airtableRes.status); res.setHeader('Content-Type','application/json'); return res.send(text);
  }catch(err){ return res.status(502).json({error:'Error proxy Airtable: '+(err?.message||err)}); }
}
function verifySession(req){ const raw=req.headers.authorization||req.headers.Authorization||''; const token=raw.startsWith('Bearer ')?raw.slice(7):''; const p=token.split('.'); if(p.length!==3) return null; const expected=crypto.createHmac('sha256',SESSION_SECRET).update(p[0]+'.'+p[1]).digest('base64url'); if(!safeEqual(expected,p[2])) return null; const payload=JSON.parse(Buffer.from(p[1],'base64url').toString('utf8')); if(payload.exp&&Date.now()>payload.exp) return null; return payload; }
function safeEqual(a,b){ const aa=Buffer.from(String(a)); const bb=Buffer.from(String(b)); return aa.length===bb.length && crypto.timingSafeEqual(aa,bb); }
function isAdmin(s){ return ['admin','administrador'].includes(String(s.rol||'').toLowerCase()); }
function isManager(s){ return ['director','gerente','coordinador'].includes(String(s.rol||'').toLowerCase()); }
function escFormula(v){ return String(v||'').replace(/'/g,"\\'"); }
function fieldValue(v){ if(Array.isArray(v)) return v.map(x=>x?.name||x).join(', '); if(v&&typeof v==='object') return v.name||v.url||''; return v==null?'':String(v); }
function parseAirtablePath(path){ const decoded=decodeURIComponent(String(path)); const u=new URL('/'+decoded.replace(/^\//,''),'https://neri.local'); const parts=u.pathname.replace(/^\//,'').split('/').filter(Boolean); return { table:parts[0], recordId:parts[1]||'', params:u.searchParams, toAirtableUrl(base){ const q=this.params.toString(); return `https://api.airtable.com/v0/${base}/${this.table}${this.recordId?'/'+this.recordId:''}${q?'?'+q:''}`; } }; }
function mergeFormula(params,formula){ const existing=params.get('filterByFormula'); params.set('filterByFormula', existing?`AND(${existing},${formula})`:formula); }
function ownerFormula(field, session){
  // Coincidencia tolerante: el campo Asesor puede traer el nombre, el slug,
  // o una cadena que los contenga (p. ej. "century21-enrique-neri").
  // Aceptamos coincidencia EXACTA o CONTENIDA, para nombre y slug.
  const f = `LOWER({${field}})`;
  const n = escFormula(String(session.nombre||'').toLowerCase().trim());
  const sl = escFormula(String(session.slug||'').toLowerCase().trim());
  const parts = [];
  if(n){ parts.push(`${f}='${n}'`); parts.push(`FIND('${n}',${f})>0`); }
  if(sl && sl!==n){ parts.push(`${f}='${sl}'`); parts.push(`FIND('${sl}',${f})>0`); }
  if(!parts.length) return `{${field}}=''`;
  return parts.length>1?`OR(${parts.join(',')})`:parts[0];
}
function ownerMatches(value, session){ const v=String(value||'').toLowerCase().trim(); return !!((session.nombre && v===String(session.nombre).toLowerCase().trim()) || (session.slug && v===String(session.slug).toLowerCase().trim())); }
function applyReadScope(parsed,tableCfg,session){ if(isAdmin(session)) return; if(tableCfg.slugField){ mergeFormula(parsed.params,`LOWER({${tableCfg.slugField}})='${escFormula(String(session.slug||'').toLowerCase())}'`); return; } if(tableCfg.ownerField){ mergeFormula(parsed.params, ownerFormula(tableCfg.ownerField, session)); } }
function normalizeBody(req){ if(typeof req.body==='string') req.body=JSON.parse(req.body||'{}'); req.body=req.body||{}; req.body.fields=req.body.fields||{}; return req.body; }
function applyWriteScope(req,tableCfg,session){ const body=normalizeBody(req); if(isAdmin(session)||isManager(session)) return; if(tableCfg.slugField){ body.fields[tableCfg.slugField]=session.slug; stripLockedProfileFields(body.fields); return; } if(tableCfg.ownerField){ const attempted=body.fields[tableCfg.ownerField]; const own=session.nombre||session.slug; if(attempted&&!ownerMatches(fieldValue(attempted),session)) throw new Error('No puedes crear registros para otro asesor.'); body.fields[tableCfg.ownerField]=own; } }
async function applyPatchScope(req,parsed,tableCfg,session){ const body=normalizeBody(req); if(isAdmin(session)||isManager(session)) return; if(!parsed.recordId) throw new Error('PATCH requiere recordId.'); const rec=await readRecord(parsed.table,parsed.recordId); if(tableCfg.slugField){ if(fieldValue(rec.fields?.[tableCfg.slugField]).toLowerCase()!==String(session.slug||'').toLowerCase()) throw new Error('No puedes editar el perfil de otro asesor.'); stripLockedProfileFields(body.fields); return; } if(tableCfg.ownerField){ const owner=fieldValue(rec.fields?.[tableCfg.ownerField]); if(owner&&!ownerMatches(owner,session)) throw new Error('No puedes editar registros de otro asesor.'); if(body.fields[tableCfg.ownerField]&&!ownerMatches(fieldValue(body.fields[tableCfg.ownerField]),session)) throw new Error('No puedes reasignar registros a otro asesor.'); } }
function stripLockedProfileFields(fields){ for(const k of Object.keys(fields)) if(!PROFILE_EDITABLE.has(k)) delete fields[k]; }
async function readRecord(table,id){ const r=await fetch(`https://api.airtable.com/v0/${BASE_ID}/${table}/${id}`,{headers:{Authorization:`Bearer ${TOKEN}`}}); const data=await r.json(); if(!r.ok) throw new Error(data?.error?.message||'No se pudo validar propietario del registro.'); return data; }
