
/* ═══════════════════════════════════════════════════
   ESTADO
═══════════════════════════════════════════════════ */
let SESSION = null;

// MODO PRUEBA — ADMIN TOTAL SIN CONTRASEÑA
// Activo mientras se construye y se prueba la intranet.
// Cuando la intranet quede completa, cambiar a false y conectar login real.
const TEST_MODE_ADMIN_TOTAL = true;
const TEST_ADMIN_SESSION = {
  user:'admin-prueba',
  pass:'',
  nombre:'Administrador Prueba',
  rol:'admin',
  slug:'admin-prueba',
  whatsapp:'',
  empresa:'Método NERI · Modo prueba',
  pixel:'',
  estado:'Activo',
  tipo:'Administrador'
};

/* ═══════════════════════════════════════════════════
   USUARIOS / CREDENCIALES (demo)
═══════════════════════════════════════════════════ */
const USERS = {
  'enrique':  { pass:'neri2024', nombre:'Enrique Neri',  rol:'asesor',   slug:'enrique', whatsapp:'527779855687', empresa:'Century 21 Haus · Cuernavaca', pixel:'1308747473990434' },
  'asesor':   { pass:'neri2024', nombre:'Asesor Nuevo',  rol:'asesor',   slug:'asesor', whatsapp:'', empresa:'Método NERI', pixel:'' },
  'gerente':  { pass:'neri2024', nombre:'Ana Gutiérrez', rol:'gerente',  slug:'ana',     whatsapp:'527779855687', empresa:'Método NERI', pixel:'' },
  'director': { pass:'neri2024', nombre:'Carlos Neri',   rol:'director', slug:'carlos',  whatsapp:'527779855687', empresa:'Método NERI', pixel:'' },
  'admin':    { pass:'neri2024', nombre:'Admin Sistema', rol:'admin',    slug:'admin',   whatsapp:'527779855687', empresa:'Método NERI', pixel:'' },
};

/* ═══════════════════════════════════════════════════
   MENÚ POR ROL
═══════════════════════════════════════════════════ */
const NAV_ROL = {
  asesor: [
    { section:'Principal' },
    { id:'hoy',         label:'Hoy',               icon:'⬡' },
    { id:'perfil',     label:'Mi Perfil',         icon:'◎' },
    { id:'airtable',    label:'Mi CRM',       icon:'◈', highlight:true },
    { section:'Captación' },
    { id:'sala',        label:'Sala de Mensajes',   icon:'⚡' },
    { id:'compradores', label:'Landing Compradores',icon:'⊕' },
    { id:'vendedores',  label:'Landing Vendedores', icon:'🏠' },
    { section:'Seguimiento' },
    { id:'citas',       label:'Panel de Citas',     icon:'📋' },
    { id:'progreso',    label:'Portal Progreso',     icon:'◎' },
    { id:'opciones',    label:'Opciones de Compra', icon:'⊞' },
  ],
  gerente: [
    { section:'Principal' },
    { id:'hoy',         label:'Dashboard',          icon:'⬡' },
    { id:'perfil',     label:'Perfil Asesor',     icon:'◎' },
    { id:'airtable',    label:'Mi CRM',       icon:'◈', highlight:true },
    { section:'Equipo' },
    { id:'sala',        label:'Sala de Mensajes',   icon:'⚡' },
    { id:'reportes',    label:'Reportes',           icon:'◫' },
    { section:'Operación' },
    { id:'compradores', label:'Landing Compradores',icon:'⊕' },
    { id:'vendedores',  label:'Landing Vendedores', icon:'🏠' },
    { id:'citas',       label:'Panel de Citas',     icon:'📋' },
  ],
  director: [
    { section:'Dirección' },
    { id:'hoy',         label:'Dashboard',          icon:'⬡' },
    { id:'perfil',     label:'Perfil Asesor',     icon:'◎' },
    { id:'airtable',    label:'Mi CRM',       icon:'◈', highlight:true },
    { id:'reportes',    label:'Reportes',           icon:'◫' },
    { section:'Sistema' },
    { id:'sala',        label:'Sala de Mensajes',   icon:'⚡' },
    { id:'compradores', label:'Landing Compradores',icon:'⊕' },
    { id:'vendedores',  label:'Landing Vendedores', icon:'🏠' },
    { id:'citas',       label:'Panel de Citas',     icon:'📋' },
    { id:'progreso',    label:'Portal Progreso',     icon:'◎' },
  ],
  admin: [
    { section:'Sistema' },
    { id:'hoy',         label:'Dashboard',          icon:'⬡' },
    { id:'perfil',     label:'Perfil Asesor',     icon:'◎' },
    { id:'airtable',    label:'Mi CRM',       icon:'◈', highlight:true },
    { section:'Herramientas' },
    { id:'sala',        label:'Sala de Mensajes',   icon:'⚡' },
    { id:'compradores', label:'Landing Compradores',icon:'⊕' },
    { id:'vendedores',  label:'Landing Vendedores', icon:'🏠' },
    { id:'citas',       label:'Panel de Citas',     icon:'📋' },
    { id:'progreso',    label:'Portal Progreso',     icon:'◎' },
    { id:'opciones',    label:'Opciones de Compra', icon:'⊞' },
    { id:'reportes',    label:'Reportes',           icon:'◫' },
  ],
};

/* ═══════════════════════════════════════════════════
   TOOLS CONFIG (cada herramienta en su propio archivo)
═══════════════════════════════════════════════════ */
const CITA_VERCEL_BASE = 'https://cita-sable.vercel.app/'; // URL única para panel/link de cita
const TOOLS = {
  sala:        { name:'Sala de Mensajes',    url:'https://mensajesmaestros.vercel.app',                  ext:true },
  compradores: { name:'Landing Compradores', url:'https://captacion.vercel.app',             ext:true },
  vendedores:  { name:'Landing Vendedores',  url:'https://ahuatlan32m.vercel.app',      ext:true },
  citas:       { name:'Panel de Citas',      url:CITA_VERCEL_BASE,                                  ext:true },
  progreso:    { name:'Portal Progreso',      url:'https://captacion.vercel.app',        ext:true },
  opciones:    { name:'Opciones de Compra',  url:'https://opcionesdecompra.vercel.app',     ext:true },
  reportes:    { name:'Reportes',            url:'./Reportes.html',                       ext:true },
};

/* ═══════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════ */
function quickLogin(rol){
  document.getElementById('l-user').value = rol;
  document.getElementById('l-pass').value = 'neri2024';
  document.getElementById('l-rol').value = rol;
}

function startTestAdminMode(){
  SESSION = { ...TEST_ADMIN_SESSION };
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('hidden');
  bootApp();
  setTimeout(()=>showToast('Modo prueba: administrador total sin contraseña'), 300);
}

function doLogin(){
  if(TEST_MODE_ADMIN_TOTAL){ startTestAdminMode(); return; }
  const user = document.getElementById('l-user').value.trim().toLowerCase();
  const pass = document.getElementById('l-pass').value;
  const rol  = document.getElementById('l-rol').value;
  const err  = document.getElementById('login-err');

  if(!user || !pass || !rol){ err.textContent='Completa todos los campos.'; return; }

  let u = USERS[user];
  // Modo prueba: cualquier slug de asesor con la contraseña demo entra como ese asesor.
  if(!u){
    if(pass !== 'neri2024'){ err.textContent='Credenciales incorrectas. (Demo: contraseña = neri2024)'; return; }
    const bonito = user.charAt(0).toUpperCase()+user.slice(1);
    u = { pass:'neri2024', nombre:bonito, rol, slug:user, whatsapp:'527779855687', empresa:'Método NERI', pixel:'' };
  } else if(u.pass !== pass || u.rol !== rol){
    err.textContent='Credenciales incorrectas. (Demo: contraseña = neri2024)';
    return;
  }

  SESSION = { ...u, user };
  err.textContent = '';
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('hidden');
  bootApp();
  // Identidad real desde Airtable (Asesor captación) — fuente única, no rompe nada.
  enrichIdentity(SESSION.slug);
}

/* Trae nombre/whatsapp/empresa/pixel reales del asesor desde Airtable por slug.
   Best-effort: si falla, la sesión sigue con el perfil local. */
async function enrichIdentity(slug){
  if(!slug) return;
  try{
    const formula = encodeURIComponent(`LOWER({Slug})='${String(slug).toLowerCase()}'`);
    const data = await atFetch(`tblIRPmLIyj8sWyEk?filterByFormula=${formula}&maxRecords=1`);
    const rec = (data.records||[])[0];
    if(!rec) return;
    const f = rec.fields || {};
    if(f['Nombre'])            SESSION.nombre   = f['Nombre'];
    if(f['Teléfono WhatsApp'] || f['WhatsApp']) SESSION.whatsapp = String(f['Teléfono WhatsApp'] || f['WhatsApp']).replace(/\D/g,'');
    if(f['Email'])             SESSION.email    = f['Email'];
    if(f['Frase'])             SESSION.frase    = f['Frase'];
    if(f['Pixel ID Meta'])     SESSION.pixel    = f['Pixel ID Meta'];
    if(f['Estado'])            SESSION.estado   = f['Estado'];
    if(f['Tipo'])              SESSION.tipo     = f['Tipo'];
    if(f['Link Captación'])    SESSION.linkCaptacion = f['Link Captación'];
    SESSION.empresa = f['Tipo'] || SESSION.empresa;
    refreshChrome();
    showToast('Identidad: '+SESSION.nombre);
  }catch(e){ /* sin conexión: se queda el perfil local */ }
}

function refreshChrome(){
  const s = SESSION; if(!s) return;
  const a=document.getElementById('sb-name'); if(a) a.textContent=s.nombre;
  const b=document.getElementById('sb-role'); if(b) b.textContent=s.rol.toUpperCase()+' · '+s.empresa;
  const c=document.getElementById('tb-user'); if(c) c.textContent=s.nombre;
  // Re-pinta el saludo del dashboard con la identidad correcta
  const nameEl=document.querySelector('#panel-hoy .hoy-name'); if(nameEl) nameEl.textContent=s.nombre;
  const roleEl=document.querySelector('#panel-hoy .hoy-role'); if(roleEl) roleEl.innerHTML=`${s.empresa} · <span style="text-transform:capitalize">${s.rol}</span>`;
}

function doLogout(){
  if(TEST_MODE_ADMIN_TOTAL){
    showToast('Modo prueba activo: sigues como administrador total');
    return;
  }
  SESSION = null;
  document.getElementById('screen-app').classList.add('hidden');
  document.getElementById('screen-login').classList.remove('hidden');
  document.getElementById('l-pass').value = '';
  document.getElementById('login-err').textContent = '';
}

/* ═══════════════════════════════════════════════════
   BOOT APP
═══════════════════════════════════════════════════ */
function bootApp(){
  const s = SESSION;
  document.getElementById('sb-name').textContent = s.nombre;
  document.getElementById('sb-role').textContent = s.rol.toUpperCase() + ' · ' + s.empresa;
  document.getElementById('tb-user').textContent = s.nombre;

  buildNav();
  buildPanels();
  goTo('hoy');
  updateClock();
}

/* ── NAV ── */
function buildNav(){
  const nav = document.getElementById('sb-nav');
  const items = NAV_ROL[SESSION.rol] || NAV_ROL.asesor;
  nav.innerHTML = '';
  items.forEach(item=>{
    if(item.section){
      nav.insertAdjacentHTML('beforeend',`<div class="sb-section">${item.section}</div>`);
    } else {
      nav.insertAdjacentHTML('beforeend',`
        <button class="sb-btn" id="nav-${item.id}" onclick="goTo('${item.id}')">
          <span class="sb-icon">${item.icon}</span>
          <span class="sb-lbl">${item.label}</span>
        </button>`);
    }
  });
}

/* ── PANELS ── */
function buildPanels(){
  const ca = document.getElementById('content-area');
  ca.innerHTML = '';
  _crmLoaded = false; // reset para nueva sesión

  // Panel HOY siempre se construye
  ca.insertAdjacentHTML('beforeend', buildHoyPanel());

  // Panel PERFIL
  ca.insertAdjacentHTML('beforeend', buildPerfilPanel());

  // Panel AIRTABLE
  ca.insertAdjacentHTML('beforeend', buildAirtablePanel());

  // Panels de iframe para cada tool
  Object.entries(TOOLS).forEach(([id, tool])=>{
    ca.insertAdjacentHTML('beforeend', buildIframePanel(id, tool));
  });
}

/* ═══════════════════════════════════════════════════
   PANEL HOY
═══════════════════════════════════════════════════ */
let _hoyLoaded = false;

function buildHoyPanel(){
  const s = SESSION;
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'BUENOS DÍAS' : hora < 19 ? 'BUENAS TARDES' : 'BUENAS NOCHES';

  const nav = NAV_ROL[s.rol].filter(i=>i.id && i.id !== 'hoy');
  const cards = nav.slice(0,8).map((item,i)=>`
    <button class="tool-card" onclick="goTo('${item.id}')">
      <div class="tc-num">${String(i+1).padStart(2,'0')}</div>
      <div class="tc-tag">${getSectionForId(item.id, s.rol)}</div>
      <div class="tc-title">${item.label.toUpperCase()}</div>
      <div class="tc-desc">${getToolDesc(item.id)}</div>
      <div class="tc-action">Abrir <span class="tc-arrow">→</span></div>
    </button>`).join('');

  const kpi = l=>`<div class="kpi"><div class="kpi-num">—</div><div class="kpi-lbl">${l}</div></div>`;
  const skel = `<div class="hoy-empty">Cargando…</div>`;

  return `<div class="panel" id="panel-hoy">
    <div class="hoy-body">
      <div class="ph-head">
        <div class="ph-eyebrow">Sistema Operativo</div>
        <div class="ph-title">${saludo}<br><em>DE VUELTA</em></div>
      </div>
      <div class="hoy-banner">
        <div>
          <div class="hoy-name">${s.nombre}</div>
          <div class="hoy-role">${s.empresa} · <span style="text-transform:capitalize">${s.rol}</span></div>
        </div>
        <div class="hoy-banner-right">
          <span class="pill pill-green">● Sesión activa</span>
          <button class="hoy-refresh" id="hoy-refresh" onclick="loadHoyData(true)" title="Actualizar">↻</button>
        </div>
      </div>

      <div class="hoy-brief" id="hoy-brief">Cargando tu día…</div>

      <div class="kpi-strip" id="hoy-kpis">
        ${kpi('Citas activas')}${kpi('Leads HOT')}${kpi('Apartados')}${kpi('Dormidos +7d')}
      </div>

      <div class="hoy-grid">
        <section class="hoy-col">
          <div class="hoy-col-head"><span class="hoy-col-dot gold"></span>Agenda <span class="hoy-col-count" id="hoy-agenda-count"></span></div>
          <div class="hoy-list" id="hoy-agenda">${skel}</div>
        </section>
        <section class="hoy-col">
          <div class="hoy-col-head"><span class="hoy-col-dot red"></span>No dejes esto pendiente <span class="hoy-col-count" id="hoy-accion-count"></span></div>
          <div class="hoy-list" id="hoy-accion">${skel}</div>
        </section>
      </div>

      <div class="hoy-ops-head">
        <div><span class="hoy-ops-eyebrow">El diferenciador</span><div class="hoy-ops-title">Operaciones en curso · guía paso a paso</div></div>
        <div class="hoy-ops-hint">Como un pedido en línea: cada cliente sabe dónde va y qué falta.</div>
      </div>
      <div id="hoy-ops">${skel}</div>

      <div class="hoy-launch-label">Herramientas</div>
      <div class="hoy-tools-grid">${cards}</div>
    </div>
  </div>`;
}

/* ── DASHBOARD HOY: datos en vivo (lectura, aditivo) ── */
function _isToday(str){
  if(!str) return false;
  const d = new Date(str); if(isNaN(d)) return false;
  const n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}
function _daysSince(str){
  if(!str) return null;
  const d = new Date(str); if(isNaN(d)) return null;
  return Math.floor((Date.now()-d.getTime())/86400000);
}
function _setKpis(arr){
  const el = document.getElementById('hoy-kpis'); if(!el) return;
  el.innerHTML = arr.map(([n,l])=>`<div class="kpi"><div class="kpi-num">${n}</div><div class="kpi-lbl">${l}</div></div>`).join('');
}

async function loadHoyData(force){
  if(_hoyLoaded && !force) return;
  _hoyLoaded = true;
  const rb = document.getElementById('hoy-refresh'); if(rb) rb.classList.add('spin');
  try{
    const cCfg = CRM_CFG.compradores, kCfg = CRM_CFG.citas, pCfg = CRM_CFG.progreso;
    const [comp, cit, prog] = await Promise.all([
      atFetch(`${cCfg.tableId}?maxRecords=100`),
      atFetch(`${kCfg.tableId}?maxRecords=100`),
      atFetch(`${pCfg.tableId}?maxRecords=100`)
    ]);
    renderHoy(comp.records||[], cit.records||[], prog.records||[]);
  }catch(e){
    const a = document.getElementById('hoy-agenda');
    if(a) a.innerHTML = '<div class="hoy-empty err">No se pudo cargar. Pulsa ↻ para reintentar.</div>';
    const k = document.getElementById('hoy-accion');
    if(k) k.innerHTML = '<div class="hoy-empty err">—</div>';
    const o = document.getElementById('hoy-ops');
    if(o) o.innerHTML = '<div class="hoy-empty err">No se pudieron cargar las operaciones.</div>';
    const b = document.getElementById('hoy-brief');
    if(b) b.textContent = 'Hubo un problema al leer tus datos. Pulsa ↻ arriba.';
  } finally {
    if(rb) rb.classList.remove('spin');
  }
}

function _waLink(phone, msg){
  const num = String(phone||'').replace(/\D/g,'');
  if(!num) return null;
  const t = msg ? ('?text='+encodeURIComponent(msg)) : '';
  return 'https://wa.me/'+num+t;
}

function renderHoy(comp, cit, prog){
  prog = prog || [];
  // Citas activas (Pendiente / Confirmada / Reagendada)
  const activas = cit.filter(r=>{
    const e = _fval(r,'Estado Cita');
    return e==='Pendiente' || e==='Confirmada' || e==='Reagendada';
  });

  // KPIs con valores REALES de Airtable
  const hot       = comp.filter(r=>_fval(r,'Clasificación')==='HOT' || _fval(r,'Status del Lead')==='HOT').length;
  const apartados = comp.filter(r=>_fval(r,'Conversión')==='Apartado').length;
  const dormidos  = comp.filter(r=>{ const d=_daysSince(_fval(r,'Última interacción')); return d!=null && d>=7 && _fval(r,'Conversión')!=='Apartado' && _fval(r,'Conversión')!=='No calificó'; }).length;
  _setKpis([
    [activas.length,'Citas activas'],
    [hot,'Leads HOT'],
    [apartados,'Apartados'],
    [dormidos,'Dormidos +7d'],
  ]);

  // Briefing cálido — recuerda sin regañar
  const citasHoy = activas.filter(r=>_isToday(_fval(r,'Fecha de la Cita'))).length;
  const briefEl = document.getElementById('hoy-brief');
  if(briefEl){
    const partes = [];
    if(citasHoy) partes.push(`<b>${citasHoy}</b> ${citasHoy===1?'cita es hoy':'citas son hoy'}`);
    if(dormidos) partes.push(`<b>${dormidos}</b> ${dormidos===1?'cliente espera tu llamada':'clientes esperan tu llamada'}`);
    if(prog.length) partes.push(`<b>${prog.length}</b> ${prog.length===1?'operación avanzando':'operaciones avanzando'}`);
    briefEl.innerHTML = partes.length
      ? `Listo para hoy: ${partes.join(' · ')}. Vamos cerrando, paso a paso. 💪`
      : `Todo en orden por ahora. Buen momento para reactivar un cliente. ✨`;
  }

  // Agenda
  const agEl = document.getElementById('hoy-agenda');
  const agC  = document.getElementById('hoy-agenda-count');
  if(!activas.length){ agEl.innerHTML='<div class="hoy-empty">Sin citas pendientes.</div>'; if(agC)agC.textContent=''; }
  else{
    if(agC) agC.textContent = activas.length;
    activas.sort((a,b)=> (_isToday(_fval(b,'Fecha de la Cita'))?1:0) - (_isToday(_fval(a,'Fecha de la Cita'))?1:0));
    agEl.innerHTML = activas.slice(0,8).map(r=>{
      const hoy = _isToday(_fval(r,'Fecha de la Cita'));
      const est = _fval(r,'Estado Cita');
      const estCls = est==='Confirmada' ? 'green' : 'gold';
      return `<div class="hoy-item${hoy?' is-today':''}">
        <div class="hi-main">
          <div class="hi-title">${_esc(_fval(r,'Comprador')||'—')}${hoy?' <span class="hi-today">HOY</span>':''}</div>
          <div class="hi-sub">${_esc(_fval(r,'Propiedad')||'')}</div>
        </div>
        <div class="hi-meta">
          <div class="hi-when">${_esc((_fval(r,'Fecha de la Cita')||'')+' '+(_fval(r,'Hora')||''))}</div>
          <span class="hi-pill ${estCls}">${_esc(est||'—')}</span>
        </div>
      </div>`;
    }).join('');
  }

  // No dejes esto pendiente — tono motivador (sin regaño)
  const scored = [];
  comp.forEach(r=>{
    const diag = _fval(r,'Diagnóstico comercial');
    const conv = _fval(r,'Conversión');
    const clas = _fval(r,'Clasificación');
    const stat = _fval(r,'Status del Lead');
    const dias = _daysSince(_fval(r,'Última interacción'));
    const dormido = (dias!=null && dias>=7);

    let tag=null, cls='gold', order=99;
    if(conv==='Apartado'){ tag='EN PROCESO'; cls='green'; order=0; }
    else if(diag==='Listo para Banco'){ tag='LISTO ✓'; cls='green'; order=1; }
    else if(clas==='HOT' || stat==='HOT'){ tag='CALIENTE'; cls='gold'; order=2; }
    else if(conv==='Cita'){ tag='CON CITA'; cls='gold'; order=3; }
    else if(dormido){ tag='RECONECTAR'; cls='amber'; order=4; }
    if(!tag) return;
    if(dormido && cls!=='amber'){ cls='amber'; order -= 0.5; }

    const jugada = _fval(r,'Siguiente jugada') || _fval(r,'Riesgo principal') || _fval(r,'Propiedad de Interés') || 'Dale seguimiento';
    const sub = (dormido ? `${dias} días sin contacto · ` : '') + jugada;
    const wa = _waLink(_fval(r,'Teléfono WhatsApp'), _fval(r,'Mensaje sugerido'));
    scored.push({ nombre:_fval(r,'Nombre Completo')||'—', tag, cls, order, sub, wa });
  });
  scored.sort((a,b)=>a.order-b.order);

  const acEl = document.getElementById('hoy-accion');
  const acC  = document.getElementById('hoy-accion-count');
  if(!scored.length){ acEl.innerHTML='<div class="hoy-empty">Nada urgente. ¡Vas al corriente! 🎉</div>'; if(acC)acC.textContent=''; }
  else{
    if(acC) acC.textContent = scored.length;
    acEl.innerHTML = scored.slice(0,10).map(o=>{
      const waBtn = o.wa
        ? `<a class="hi-wa" href="${o.wa}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="WhatsApp con mensaje sugerido">WhatsApp</a>`
        : '';
      return `<div class="hoy-item act" onclick="goTo('airtable')">
        <div class="hi-main">
          <div class="hi-title">${_esc(o.nombre)} <span class="hi-pill ${o.cls}">${o.tag}</span></div>
          <div class="hi-sub">${_esc(o.sub||'')}</div>
        </div>
        <div class="hi-actions">${waBtn}<span class="hi-go">→</span></div>
      </div>`;
    }).join('');
  }

  renderOperaciones(prog);
}

/* ── Rastreador estilo Amazon: fases + qué debe estar listo ── */
const FASES_PROGRESO = [
  { n:'Apartado',                 listo:'Comprobante de apartado, INE del comprador, datos de contacto.' },
  { n:'Revisión de compra',       listo:'Confirmar precio y condiciones, definir forma de pago (crédito o contado) y tiempos.' },
  { n:'Preparando documentos',    listo:'INE, CURP, comprobante de domicilio, comprobante de ingresos, RFC. Si es crédito: precalificación.' },
  { n:'Acuerdo de compra',        listo:'Contrato de compraventa firmado, anticipo, autorización de crédito (si aplica).' },
  { n:'Revisión en notaría',      listo:'Avalúo, libertad de gravamen, predial al corriente, agua y servicios al día, documentos del vendedor.' },
  { n:'Últimas confirmaciones',   listo:'Fecha de firma agendada, fondos listos, revisión final de la escritura.' },
  { n:'Día de firma',             listo:'Identificaciones, fondos disponibles, firma de escritura ante notario.' },
  { n:'Entrega de llaves',        listo:'Acta de entrega, llaves, finiquito de servicios. ¡Operación cerrada!' },
];
function _faseIndex(nombre){
  const i = FASES_PROGRESO.findIndex(f=>f.n===nombre);
  return i<0 ? 0 : i;
}
function renderOperaciones(prog){
  const el = document.getElementById('hoy-ops'); if(!el) return;
  if(!prog.length){
    el.innerHTML = '<div class="hoy-empty">Aún no hay operaciones en curso. En cuanto marques un <b>Apartado</b>, aparece aquí su recorrido completo.</div>';
    return;
  }
  el.innerHTML = prog.map(r=>{
    const fase = _fval(r,'Fase Actual') || 'Apartado';
    const idx  = _faseIndex(fase);
    const total = FASES_PROGRESO.length;
    const pct = Math.round(((idx+1)/total)*100);
    const sig = FASES_PROGRESO[Math.min(idx+1,total-1)];
    const pasoTxt = _fval(r,'Próximo paso') || (idx>=total-1 ? '¡Operación completada!' : 'Continúa con: '+sig.n);
    const pend = _fval(r,'Pendientes visibles') || '';
    const link = _fval(r,'Link Portal') || '';

    const dots = FASES_PROGRESO.map((f,i)=>{
      const st = i<idx ? 'done' : (i===idx ? 'now' : 'next');
      return `<div class="step ${st}" title="${_esc(f.n)}"><span class="step-dot"></span><span class="step-lbl">${_esc(f.n)}</span></div>`;
    }).join('<span class="step-bar"></span>');

    const docsAhora = FASES_PROGRESO[idx] ? FASES_PROGRESO[idx].listo : '';
    const docsSig   = (idx<total-1) ? sig.listo : '';

    return `<div class="op-card">
      <div class="op-top">
        <div>
          <div class="op-name">${_esc(_fval(r,'Comprador')||'—')}</div>
          <div class="op-prop">${_esc(_fval(r,'Propiedad')||'')} ${link?`· <a href="${_esc(link)}" target="_blank" rel="noopener" class="op-link">Ver portal del cliente ↗</a>`:''}</div>
        </div>
        <div class="op-pct"><span>${pct}%</span><small>${_esc(fase)}</small></div>
      </div>
      <div class="op-steps">${dots}</div>
      <div class="op-progress"><div class="op-progress-fill" style="width:${pct}%"></div></div>
      <div class="op-foot">
        <div class="op-next"><span class="op-next-lbl">Siguiente paso</span>${_esc(pasoTxt)}</div>
        <div class="op-docs"><span class="op-docs-lbl">Para avanzar debe estar listo</span>${_esc(docsSig || docsAhora)}</div>
        ${pend?`<div class="op-pend"><span class="op-pend-lbl">Pendientes</span>${_esc(pend)}</div>`:''}
      </div>
    </div>`;
  }).join('');
}

function getSectionForId(id, rol){
  const nav = NAV_ROL[rol] || [];
  let currentSection = '';
  for(const item of nav){
    if(item.section) currentSection = item.section;
    if(item.id === id) return currentSection;
  }
  return '';
}

function getToolDesc(id){
  const descs = {
    airtable:    'Registros reales · edita directo desde aquí.',
    sala:        'Mensajes y comunicación con el equipo.',
    compradores: 'Landing personalizada para captar compradores.',
    vendedores:  'Diagnóstico profesional para propietarios.',
    citas:       'Agenda, documentos y avances de cada cliente.',
    progreso:    'Portal de seguimiento solo para clientes con apartado.',
    opciones:    'Esquemas de compra para presentar al cliente.',
    reportes:    'Métricas y resultados del equipo.',
  };
  return descs[id] || 'Herramienta del sistema NERI.';
}


/* ═══════════════════════════════════════════════════
   PANEL PERFIL ASESOR — alta/edición directa en Airtable
════════════════════════════════════════════════════ */
const ASESOR_TABLE_ID = 'tblIRPmLIyj8sWyEk';
const CAPTACION_BASE_URL = 'https://captacion.vercel.app/';
let perfilState = { loaded:false, recordId:null, fields:{}, isNew:false, slug:'' };

function _firstField(f, names, fallback=''){
  for(const n of names){
    const v = f?.[n];
    if(v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return fallback;
}
function _firstAttachmentUrl(v){
  if(Array.isArray(v) && v[0]) return v[0].thumbnails?.large?.url || v[0].url || '';
  if(typeof v === 'string') return v;
  return '';
}
function _slugifyPerfil(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,60);
}
function perfilCurrentSlug(){
  return _slugifyPerfil(SESSION?.slug || SESSION?.user || SESSION?.nombre || 'asesor');
}
function perfilBuildLink(slug){
  const s = _slugifyPerfil(slug || perfilCurrentSlug());
  return s ? `${CAPTACION_BASE_URL}?asesor=${encodeURIComponent(s)}` : '';
}

function buildPerfilPanel(){
  return `<div class="panel" id="panel-perfil">
    <div class="perfil-body">
      <div class="perfil-wrap">
        <div class="ph-eyebrow">Configuración del asesor</div>
        <div class="ph-title">MI <em>PERFIL</em></div>
        <div class="perfil-sub">Este es el flujo correcto: el asesor llena su perfil aquí y la intranet lo crea o actualiza en Airtable. Estado, tipo y link de captación se ven bloqueados porque no se escriben manualmente.</div>

        <div class="perfil-grid">
          <section class="perfil-card">
            <div class="perfil-title">Datos <em>editables</em></div>
            <div class="perfil-sub">Nombre, WhatsApp, email, foto, frase y Pixel ID Meta.</div>
            <div id="perfil-editable" class="perfil-fields">
              <div class="hoy-empty">Cargando perfil…</div>
            </div>
            <div class="perfil-actions">
              <button class="btn btn-ghost" onclick="perfilLoad(true)">Recargar</button>
              <button class="btn btn-primary" id="perfil-save-btn" onclick="perfilSave()">Guardar perfil</button>
            </div>
            <div id="perfil-status" class="perfil-status"></div>
          </section>

          <aside class="perfil-card gold">
            <div class="perfil-title">Datos <em>bloqueados</em></div>
            <div class="perfil-sub">Estos se ven aquí, pero no los escribe el asesor.</div>
            <div id="perfil-readonly" class="perfil-readonly">
              <div class="hoy-empty">Cargando permisos…</div>
            </div>
            <div class="perfil-note">El Link Captación se genera por sistema con el usuario/slug de acceso. El asesor lo copia para WhatsApp, redes o campañas.</div>
          </aside>
        </div>
      </div>
    </div>
  </div>`;
}

async function perfilLoad(force=false){
  if(perfilState.loaded && !force) return;
  perfilState.loaded = true;
  const edit = document.getElementById('perfil-editable');
  const ro = document.getElementById('perfil-readonly');
  const st = document.getElementById('perfil-status');
  if(edit) edit.innerHTML = '<div class="hoy-empty">Cargando perfil…</div>';
  if(ro) ro.innerHTML = '<div class="hoy-empty">Cargando permisos…</div>';
  if(st) { st.style.color='var(--w50)'; st.textContent = ''; }

  const slug = perfilCurrentSlug();
  perfilState.slug = slug;

  try{
    const formula = encodeURIComponent(`LOWER({Slug})='${slug}'`);
    const data = await atFetch(`${ASESOR_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`);
    const rec = (data.records || [])[0];

    if(rec){
      perfilState.recordId = rec.id;
      perfilState.fields = rec.fields || {};
      perfilState.isNew = false;
      perfilRender();
      return;
    }

    // No existe en Airtable: NO es error. Se muestra formulario listo para crear.
    perfilState.recordId = null;
    perfilState.isNew = true;
    perfilState.fields = {
      'Nombre': (SESSION?.nombre && SESSION.nombre !== 'Asesor Nuevo') ? SESSION.nombre : '',
      'WhatsApp': SESSION?.whatsapp || '',
      'Email': SESSION?.email || '',
      'Frase': SESSION?.frase || '',
      'Pixel ID Meta': SESSION?.pixel || '',
      'Slug': slug,
      'Link Captación': perfilBuildLink(slug)
    };
    perfilRender();
    if(st) st.textContent = 'Perfil nuevo: al guardar se creará el registro en Airtable.';
  }catch(e){
    if(edit) edit.innerHTML = `<div class="hoy-empty err">No se pudo consultar Airtable: ${_esc(e.message)}</div>`;
    if(ro) ro.innerHTML = '<div class="hoy-empty err">Sin datos para mostrar.</div>';
    if(st) { st.style.color='var(--red)'; st.textContent='Revisa la conexión Airtable o variables de Vercel.'; }
  }
}

function perfilRender(){
  const f = perfilState.fields || {};
  const slug = perfilState.slug || _firstField(f, ['Slug'], perfilCurrentSlug());
  const nombre = _firstField(f, ['Nombre'], SESSION?.nombre || '');
  const whats  = _firstField(f, ['WhatsApp','Teléfono WhatsApp'], SESSION?.whatsapp || '');
  const email  = _firstField(f, ['Email','Correo'], SESSION?.email || '');
  const frase  = _firstField(f, ['Frase'], SESSION?.frase || '');
  const pixel  = _firstField(f, ['Pixel ID Meta'], SESSION?.pixel || '');
  const fotoUrl= _firstAttachmentUrl(_firstField(f, ['Foto'], ''));
  const estado = perfilState.isNew ? 'Pendiente de administración' : _firstField(f, ['Estado'], SESSION?.estado || '—');
  const tipo   = perfilState.isNew ? 'Pendiente de administración' : _firstField(f, ['Tipo'], SESSION?.tipo || '—');
  const link   = _firstField(f, ['Link Captación'], SESSION?.linkCaptacion || perfilBuildLink(slug) || '—');

  const initials = (nombre||'A').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const avatar = fotoUrl ? `<img class="perfil-avatar" src="${_escAttr(fotoUrl)}" alt="Foto asesor">` : `<div class="perfil-avatar-empty">${_esc(initials)}</div>`;
  const modo = perfilState.isNew ? '<div class="perfil-note full" style="color:var(--gold)">Este perfil todavía no existe en Airtable. Cuando presiones Guardar perfil, la intranet lo va a crear.</div>' : '';

  document.getElementById('perfil-editable').innerHTML = `
    ${modo}
    <div class="form-group"><label>Nombre</label><input class="form-inp" id="pf-nombre" value="${_escAttr(nombre)}"></div>
    <div class="form-group"><label>WhatsApp</label><input class="form-inp" id="pf-whatsapp" value="${_escAttr(whats)}"></div>
    <div class="form-group"><label>Email</label><input class="form-inp" id="pf-email" value="${_escAttr(email)}"></div>
    <div class="form-group"><label>Pixel ID Meta</label><input class="form-inp" id="pf-pixel" value="${_escAttr(pixel)}"></div>
    <div class="form-group full"><label>Frase</label><textarea class="form-inp" id="pf-frase" rows="3">${_esc(frase)}</textarea></div>
    <div class="form-group full"><label>Foto</label>
      <div class="perfil-photo-row">${avatar}<div style="flex:1">
        <input class="form-inp" type="file" id="pf-foto-file" accept="image/jpeg,image/png,image/webp">
        <input class="form-inp" style="margin-top:8px" type="text" id="pf-foto-url" placeholder="O pegar URL pública de foto" value="">
        <div class="perfil-note">Si subes archivo, se guarda en Blob y Airtable recibe solo la URL.</div>
      </div></div>
    </div>`;

  document.getElementById('perfil-readonly').innerHTML = `
    <div class="perfil-lock"><div class="perfil-lock-k">Estado</div><div class="perfil-lock-v">${_esc(estado)}</div></div>
    <div class="perfil-lock"><div class="perfil-lock-k">Tipo</div><div class="perfil-lock-v">${_esc(tipo)}</div></div>
    <div class="perfil-lock"><div class="perfil-lock-k">Link Captación</div><div class="perfil-lock-v">${link && link !== '—' ? `<a href="${_escAttr(link)}" target="_blank" rel="noopener">${_esc(link)}</a>` : '—'}</div></div>
    ${link && link !== '—' ? `<button class="btn btn-ghost" onclick="perfilCopyLink()">Copiar link</button>` : ''}`;

  const btn = document.getElementById('perfil-save-btn');
  if(btn) btn.textContent = perfilState.isNew ? 'Crear perfil' : 'Guardar perfil';
}

function perfilCopyLink(){
  const f = perfilState.fields || {};
  const link = _firstField(f, ['Link Captación'], SESSION?.linkCaptacion || perfilBuildLink(perfilState.slug));
  if(!link) return showToast('No hay link para copiar');
  navigator.clipboard.writeText(link).then(()=>showToast('Link copiado')).catch(()=>showToast('No se pudo copiar'));
}

function _perfilCleanFields(fields){
  const out = {};
  Object.keys(fields).forEach(k=>{
    const v = fields[k];
    if(v === undefined) return;
    if(typeof v === 'string' && v.trim() === '') return;
    out[k] = v;
  });
  return out;
}
function _perfilAltPhone(fields){
  if(!('WhatsApp' in fields)) return null;
  const alt = { ...fields, 'Teléfono WhatsApp': fields['WhatsApp'] };
  delete alt['WhatsApp'];
  return alt;
}
function _perfilWithoutLink(fields){
  if(!('Link Captación' in fields)) return null;
  const alt = { ...fields };
  delete alt['Link Captación'];
  return alt;
}
function _perfilUniqueCandidates(fields){
  const list = [];
  const push = f => {
    if(!f) return;
    const clean = _perfilCleanFields(f);
    const key = JSON.stringify(clean);
    if(Object.keys(clean).length && !list.some(x=>JSON.stringify(x)===key)) list.push(clean);
  };
  push(fields);
  push(_perfilAltPhone(fields));
  push(_perfilWithoutLink(fields));
  push(_perfilWithoutLink(_perfilAltPhone(fields) || {}));
  return list;
}
async function _perfilPersist(fields){
  const candidates = _perfilUniqueCandidates(fields);
  let lastError = null;

  for(const candidate of candidates){
    try{
      if(perfilState.recordId){
        return await atFetch(`${ASESOR_TABLE_ID}/${perfilState.recordId}`, {
          method:'PATCH', body: JSON.stringify({ fields:candidate, typecast:true })
        });
      }
      const data = await atFetch(`${ASESOR_TABLE_ID}`, {
        method:'POST', body: JSON.stringify({ records:[{ fields:candidate }], typecast:true })
      });
      return (data.records || [])[0] || data;
    }catch(e){ lastError = e; }
  }
  throw lastError || new Error('No se pudo guardar el perfil.');
}

async function perfilSave(){
  const btn = document.getElementById('perfil-save-btn');
  const st = document.getElementById('perfil-status');
  const slug = perfilState.slug || perfilCurrentSlug();
  const linkCaptacion = perfilBuildLink(slug);
  if(!slug){ if(st) st.textContent='No hay usuario/slug para crear el perfil.'; return; }

  const nombre = (document.getElementById('pf-nombre')?.value || '').trim();
  const whatsapp = (document.getElementById('pf-whatsapp')?.value || '').trim();
  if(!nombre){ if(st) { st.style.color='var(--red)'; st.textContent='Escribe el nombre del asesor.'; } return; }

  btn.disabled = true; btn.textContent = perfilState.isNew ? 'Creando...' : 'Guardando...';
  if(st) { st.style.color='var(--w50)'; st.textContent=''; }

  try{
    const fields = {
      'Nombre': nombre,
      'WhatsApp': whatsapp,
      'Email': (document.getElementById('pf-email')?.value || '').trim(),
      'Frase': (document.getElementById('pf-frase')?.value || '').trim(),
      'Pixel ID Meta': (document.getElementById('pf-pixel')?.value || '').trim(),
    };

    const fotoFile = document.getElementById('pf-foto-file')?.files?.[0];
    const fotoUrl  = (document.getElementById('pf-foto-url')?.value || '').trim();
    if(fotoFile){
      btn.textContent = 'Subiendo foto...';
      const url = await uploadBlobFile(fotoFile, slug || 'asesor', 'foto-perfil');
      fields['Foto'] = [{ url }];
    } else if(fotoUrl){
      fields['Foto'] = [{ url: fotoUrl }];
    }

    // Al crear: la intranet registra el asesor en Airtable y genera su link.
    // No manda Estado ni Tipo porque esos pertenecen a administración.
    if(!perfilState.recordId){
      fields['Slug'] = slug;
      fields['Link Captación'] = linkCaptacion;
    } else {
      const linkActual = _firstField(perfilState.fields || {}, ['Link Captación'], '');
      if(!linkActual) fields['Link Captación'] = linkCaptacion;
    }

    const saved = await _perfilPersist(fields);
    perfilState.recordId = saved?.id || perfilState.recordId;
    perfilState.fields = saved?.fields || { ...(perfilState.fields || {}), ...fields, 'Slug':slug, 'Link Captación':linkCaptacion };
    perfilState.isNew = false;
    perfilState.slug = slug;

    Object.assign(SESSION, {
      nombre: nombre || SESSION.nombre,
      whatsapp: String(whatsapp || SESSION.whatsapp || '').replace(/\D/g,''),
      email: fields['Email'] || '',
      frase: fields['Frase'] || '',
      pixel: fields['Pixel ID Meta'] || '',
      slug,
      linkCaptacion
    });
    refreshChrome();
    perfilRender();
    showToast('✓ Perfil guardado en Airtable');
    if(st) st.textContent = perfilState.recordId ? 'Guardado correctamente en Airtable.' : 'Guardado.';
  }catch(e){
    if(st) { st.style.color='var(--red)'; st.textContent='Error al guardar en Airtable: '+e.message; }
  }finally{
    btn.disabled = false; btn.textContent = perfilState.isNew ? 'Crear perfil' : 'Guardar perfil';
  }
}

/* ═══════════════════════════════════════════════════
   PANEL AIRTABLE — el más importante, embebido
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   CRM — CONFIG (Airtable REST API directa)
═══════════════════════════════════════════════════ */
// Token y base viven en el servidor (Vercel env vars). El frontend NO los conoce.
const AT_PROXY = '/api/airtable';
// Rutas relativas: el proxy añade la base automáticamente
// Usamos solo tableId + params en cada llamada

const CRM_CFG = {
  compradores: {
    tableId: 'tblOdlY3bBlGi64qR',
    label: 'Leads Compradores',
    dot: 'compradores',
    ficha: true,
    portalBase: 'https://progreso-zeta.vercel.app/',
    fichaExtra: ['Riesgo principal','Diagnóstico comercial','Estado emocional','Siguiente jugada','Mensaje sugerido','Última interacción','Propiedad de Interés','Status del Lead','Clasificación','Folio Propiedad NERI','Folio del Comprador'],
    cols: ['Folio','Nombre','WhatsApp','Propiedad Interés','Status','Clasificación','Crédito','Asesor','Fecha'],
    fields: ['Folio','Nombre Completo','Teléfono WhatsApp','Propiedad de Interés','Status del Lead','Clasificación','Método / Crédito','Asesor','Fecha de Entrada'],
    editable: [
      {f:'Nombre Completo',       type:'text'},
      {f:'Teléfono WhatsApp',     type:'text'},
      {f:'Propiedad de Interés',  type:'text'},
      {f:'Status del Lead',       type:'select', opts:['Nuevo','HOT','WARM','COLD']},
      {f:'Clasificación',         type:'select', opts:['HOT','WARM','COLD','Frío']},
      {f:'Conversión',            type:'select', opts:['En seguimiento','Cita','Apartado','No calificó']},
      {f:'Diagnóstico comercial', type:'select', opts:['Listo para Banco','Comparar Antes de Firmar','Preparación Inteligente','Solo explorando','No viable por ahora']},
      {f:'Riesgo principal',      type:'text'},
      {f:'Estado emocional',      type:'text'},
      {f:'Siguiente jugada',      type:'text'},
      {f:'Última interacción',    type:'text'},
      {f:'Método / Crédito',      type:'text'},
      {f:'Asesor',                type:'text'},
      {f:'Score del Lead',        type:'text'},
    ]
  },
  vendedores: {
    tableId: 'tblQHdwEucTaNrLzm',
    label: 'Leads Vendedores',
    dot: 'vendedores',
    ficha: 'vendedor',
    cols: ['Folio','Nombre','Tipo','Zona','Precio','Conversión','Asesor','Fecha'],
    fields: ['Folio','Nombre Completo','Tipo de Propiedad','Zona','Precio Estimado','Conversión','Asesor','Fecha de Entrada'],
    fichaExtra: [
      'Teléfono WhatsApp','Fuente','Estado','Hora de Entrada',
      'Habitaciones','Baños','Medios Baños','Estacionamientos',
      'Tiempo de Venta','Razón de Venta',
      'Diagnóstico Fiscal','Detalle Fiscal',
      'Progreso Expediente','Documentos','Propiedad Creada'
    ],
    editable: [
      {f:'Nombre Completo',    type:'text'},
      {f:'Teléfono WhatsApp',  type:'text'},
      {f:'Fuente',             type:'text'},
      {f:'Asesor',             type:'text'},
      {f:'Tipo de Propiedad',  type:'text'},
      {f:'Zona',               type:'text'},
      {f:'Estado',             type:'text'},
      {f:'Precio Estimado',    type:'select', opts:['Menos de $1M','$1M \u2013 $2M','$2M \u2013 $4M','$4M \u2013 $7M','Más de $7M','No lo sé aún']},
      {f:'Habitaciones',       type:'text'},
      {f:'Baños',              type:'text'},
      {f:'Medios Baños',       type:'text'},
      {f:'Estacionamientos',   type:'text'},
      {f:'Tiempo de Venta',    type:'text'},
      {f:'Razón de Venta',     type:'text'},
      {f:'Diagnóstico Fiscal', type:'text'},
      {f:'Detalle Fiscal',     type:'textarea'},
      {f:'Conversión',         type:'select', opts:['Firma exclusiva','Firma venta directa','En seguimiento','No calificó']},
      {f:'Progreso Expediente',type:'text'},
      {f:'Documentos',         type:'textarea'},
    ]
  },
  progreso: {
    tableId: 'tblyC9VjjtoRKJPQL',
    label: 'Portal Progreso',
    dot: 'progreso',
    cols: ['Folio','Comprador','Propiedad','Precio','Fase Actual','Asesor','WhatsApp Asesor','Próximo paso'],
    fields: ['Folio','Comprador','Propiedad','Precio','Fase Actual','Asesor','WhatsApp Asesor','Próximo paso'],
    editable: [
      {f:'Comprador',                        type:'text'},
      {f:'Propiedad',                        type:'text'},
      {f:'Precio',                           type:'text'},
      {f:'Fase Actual',                      type:'select', asText:true, opts:['Apartado','Expediente','Valuación','Crédito','Escrituración','Firma','Entrega','Completado']},
      {f:'Asesor',                           type:'text'},
      {f:'WhatsApp Asesor',                  type:'text'},
      {f:'Etiqueta WhatsApp',                type:'text'},
      {f:'Próximo paso',                     type:'textarea'},
      {f:'Pendientes visibles',              type:'textarea'},
      {f:'Mensaje WhatsApp Actualización',   type:'textarea'},
    ]
  },
  citas: {
    tableId: 'tblaAfbSD3pqSLdAA', // tabla Citas real (base appRh791vGXRdOJs3)
    label: 'Citas',
    dot: 'citas',
    cita: true,
    cols: ['Folio Cita','Folio Origen','Comprador','Propiedad','Fecha','Hora','Tipo','Estado','Asesor'],
    fields: ['Folio Cita','Folio Cliente Origen','Comprador','Propiedad','Fecha de la Cita','Hora','Tipo de Cita','Estado Cita','Asesor'],
    editable: [
      {f:'Comprador',       type:'text'},
      {f:'Propiedad',       type:'text'},
      {f:'Fecha de la Cita',type:'text'},
      {f:'Hora',            type:'text'},
      {f:'Tipo de Cita',    type:'select', opts:['Visita presencial','Videollamada','Segunda visita','Visita con familia','Visita con valuador']},
      {f:'Estado Cita',     type:'select', opts:['Pendiente','Confirmada','Realizada','Cancelada','Reagendada']},
      {f:'Asesor',          type:'text'},
      {f:'Notas de la Cita',type:'textarea'},
    ]
  },
  propiedades: {
    tableId: 'tblmco2JyXRiZGhaY',
    label: 'Propiedades',
    dot: 'propiedades',
    landing: true,
    landingFields: ['Nombre Propiedad','Folio NERI','Folio Vendedor','Link Comprador','Link Portal','Frase Portada','Frase Inicio','Foto de portada','Precio Lista','Precio Minimo','Moneda','Plusvalia Valor','Plusvalia Texto','Video Sala','Video Sala MP4','Video Cocina','Video Cocina MP4','Video Recamara','Video Recamara MP4','Video Jardin','Video Jardin MP4','Video Alberca','Video Alberca MP4','Nombre Video Extra','Video Extra MP4','Tipo de Propiedad','Estado Propiedad','Habitaciones','Banos','Medios Banos','Estacionamientos','Metros Construccion','Metros Terreno','Zona / Colonia','Municipio','Estado / Entidad','Direccion','Link Tour Virtual','Google Maps URL'],
    cols: ['Nombre','Tipo','Estado','Zona','Municipio','Precio Lista','Recámaras','Asesor'],
    fields: ['Nombre Propiedad','Tipo de Propiedad','Estado Propiedad','Zona / Colonia','Municipio','Precio Lista','Habitaciones','Asesor'],
    editable: [
      {f:'Nombre Propiedad',   type:'text'},
      {f:'Tipo de Propiedad',  type:'select', opts:['Casa','Departamento','Terreno','Local','Oficina','Bodega']},
      {f:'Estado Propiedad',   type:'select', opts:['Disponible','Apartada','Vendida','En proceso','Suspendida']},
      {f:'Zona / Colonia',     type:'text'},
      {f:'Municipio',          type:'text'},
      {f:'Precio Lista',       type:'text'},
      {f:'Habitaciones',       type:'text'},
      {f:'Asesor',             type:'text'},
      {f:'Direccion',          type:'text'},
      {f:'Notas Internas',     type:'textarea'},
    ]
  }
};

const STATUS_BADGE = {
  'HOT':'badge-hot','WARM':'badge-warm','COLD':'badge-cold','Frío':'badge-cold','Frio':'badge-cold',
  'Listo para Banco':'badge-close','Comparar Antes de Firmar':'badge-contact',
  'Preparación Inteligente':'badge-warm','Solo explorando':'badge-visit','No viable por ahora':'badge-lost',
  'Cita':'badge-new',
  'Nuevo':'badge-new','Contactado':'badge-contact','Cita agendada':'badge-visit',
  'Visita realizada':'badge-visit','Oferta presentada':'badge-offer',
  'Apartado':'badge-offer','Cerrado':'badge-close','Perdido':'badge-lost',
  'Disponible':'badge-active','Vendida':'badge-close','Apartada':'badge-offer',
  'En proceso':'badge-visit','Suspendida':'badge-lost',
  'A — Caliente':'badge-close','B — Tibio':'badge-offer',
  'C — Frío':'badge-visit','D — Descartado':'badge-lost',
  'Firma exclusiva':'badge-offer','Firma venta directa':'badge-close',
  'En seguimiento':'badge-visit','No calificó':'badge-lost',
  'Pendiente':'badge-cita-pend','Confirmada':'badge-cita-conf',
  'Realizada':'badge-cita-real','Cancelada':'badge-cita-canc','Reagendada':'badge-visit',
};

let crmState = { tab:'compradores', records:[], editId:null, isNew:false, citaFromLead:null };
// citaFromLead: { folioClienteOrigen, comprador, propiedad, asesor } — se limpia después del POST

/* ─── API helpers — usa el proxy de Vercel ─────────── */
async function atFetch(path, opts={}){
  // Eliminamos el slash inicial para construir el query param
  const cleanPath = path.replace(/^\//, '');
  const proxyUrl  = AT_PROXY + '?path=' + encodeURIComponent(cleanPath);

  const r = await fetch(proxyUrl, {
    method:  opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
    ...(opts.body ? { body: opts.body } : {}),
  });
  if(!r.ok) throw new Error('HTTP ' + r.status + ' — ' + await r.text());
  return r.json();
}

/* ─── LOAD RECORDS ─────────────────────────────────── */
async function crmLoad(tab, force=false){
  crmState.tab = tab;
  const cfg = CRM_CFG[tab];

  const loading = document.getElementById('crm-loading');
  const wrap    = document.getElementById('crm-body');
  const errEl   = document.getElementById('crm-error');
  if(!loading) return;

  loading.style.display = 'flex';
  wrap.style.display = 'none';
  errEl.style.display = 'none';

  try {
    // Robusto: sin fields[] (si un nombre no existe, Airtable rechaza TODO con 422)
    // y sin view fija (falla si la vista fue renombrada). Trae todos los campos.
    const data = await atFetch(`${cfg.tableId}?maxRecords=100`);
    crmState.records = data.records || [];
    crmRender(tab, crmState.records);
    const tabCountEl = document.getElementById('tab-count-' + tab);
    if(tabCountEl) tabCountEl.textContent = crmState.records.length;
    loading.style.display = 'none';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
  } catch(e){
    loading.style.display = 'none';
    errEl.style.display = 'block';
    document.getElementById('crm-error-msg').innerHTML =
      'No se pudo cargar <b>' + (cfg.label || tab) + '</b><br><br>' +
      '<span style="color:var(--w50);font-size:11px">' + e.message + '</span><br><br>' +
      '<span style="color:var(--w30);font-size:10px;line-height:1.6">' +
      '404 → falta /api/airtable en Vercel · 401/403 → token inválido · 422 → revisa el ID de tabla</span>';
  }
}

/* ─── RENDER TABLE ─────────────────────────────────── */
function crmRender(tab, records){
  const cfg = CRM_CFG[tab];
  document.getElementById('crm-count').textContent = records.length + ' registros';

  const ths = ['', ...cfg.cols].map((c,i) =>
    i===0 ? `<th style="width:44px"></th>` : `<th>${c}</th>`
  ).join('');

  const FOLIO_FIELDS = ['Folio','Folio Cita'];
  const NAME_FIELDS  = ['nombre completo','nombre','comprador','nombre propiedad'];

  const trs = records.map(rec => {
    const cells = cfg.fields.map((fname) => {
      let val = rec.fields?.[fname] ?? '';
      if(typeof val === 'object') val = Array.isArray(val) ? val.map(v=>v?.name||v).join(', ') : (val?.name ?? JSON.stringify(val));
      val = String(val);
      const isBadge = !!STATUS_BADGE[val];
      const inner = isBadge
        ? `<span class="badge ${STATUS_BADGE[val]}">${val}</span>`
        : (val ? _esc(val) : '<span style="color:var(--w20)">—</span>');
      let cls = '';
      if(FOLIO_FIELDS.includes(fname)) cls = 'folio';
      else if(NAME_FIELDS.includes(fname.toLowerCase())) cls = 'name';
      else if(!isBadge && val.length > 22) cls = 'clip';
      const title = cls==='clip' ? ` title="${_escAttr(val)}"` : '';
      return `<td${cls?` class="${cls}"`:''}${title}>${inner}</td>`;
    }).join('');
    return `<tr onclick="crmOpenRow('${rec.id}')" title="Clic para abrir expediente">
      <td>◎</td>${cells}</tr>`;
  }).join('') || `<tr><td colspan="20"><div class="crm-empty">
    <div class="crm-empty-icon">◎</div>
    <div class="crm-empty-text">Sin registros en esta tabla</div>
  </div></td></tr>`;

  document.getElementById('crm-table-wrap').innerHTML =
    `<table class="at-table" id="crm-main-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function crmFilter(q){
  const tbl = document.getElementById('crm-main-table');
  if(!tbl) return;
  let v = 0;
  tbl.querySelectorAll('tbody tr').forEach(r => {
    const m = r.textContent.toLowerCase().includes(q.toLowerCase());
    r.style.display = m ? '' : 'none';
    if(m) v++;
  });
  document.getElementById('crm-count').textContent = v + ' registros';
}

function crmSwitchTab(tab){
  document.querySelectorAll('.at-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('crm-tab-' + tab)?.classList.add('active');
  document.getElementById('crm-search').value = '';
  crmLoad(tab, true);
}

/* ─── MODAL EDITAR / NUEVO ─────────────────────────── */
function crmOpenEdit(recId){
  const rec = crmState.records.find(r => r.id === recId);
  if(!rec) return;
  crmState.editId = recId;
  crmState.isNew  = false;
  crmBuildModal('EDITAR REGISTRO', CRM_CFG[crmState.tab].editable, rec.fields || {});
}

function crmDefaultsForNew(tab){
  const values = {};
  // Para nuevos leads vendedores, el asesor debe salir del usuario configurado
  // en la sesión, no de un nombre fijo. Si después se borra manualmente, se guarda en blanco.
  if(tab === 'vendedores' && SESSION?.nombre){
    values['Asesor'] = SESSION.nombre;
  }
  return values;
}

function crmOpenNew(){
  if(crmState.tab === 'citas'){ citaOpenNew(); return; }
  crmState.editId = null;
  crmState.isNew  = true;
  crmBuildModal('NUEVO REGISTRO', CRM_CFG[crmState.tab].editable, crmDefaultsForNew(crmState.tab));
}

/* ─── FICHA PREMIUM (solo lectura) ─────────────────── */
function crmOpenRow(recId){
  const cfg = CRM_CFG[crmState.tab];
  if(cfg && cfg.landing) landOpenEditor(recId);
  else if(cfg && cfg.cita) citaOpenFicha(recId);
  else if(cfg && cfg.ficha === 'vendedor') vendedorOpenFicha(recId);
  else if(cfg && cfg.ficha) crmOpenFicha(recId);
  else crmOpenEdit(recId);
}

function _fval(rec, name){
  let v = rec.fields?.[name];
  if(v == null || v === '') return '';
  if(typeof v === 'object') v = v.name ?? (Array.isArray(v) ? v.map(x=>x?.name||x).join(', ') : '');
  return String(v);
}

function crmOpenFicha(recId){
  const rec = crmState.records.find(r => r.id === recId);
  if(!rec) return;
  const cfg = CRM_CFG[crmState.tab];
  crmState.editId = recId;
  crmState.isNew  = false;

  const nombre = _fval(rec,'Nombre Completo') || 'Sin nombre';
  // Folio correcto para el lead: NO usar el campo primario "Folio" cuando venga vacío o '-'
  const folioLead = _fval(rec,'Folio del Comprador') || _fval(rec,'Folio Propiedad NERI') || '';
  const folioOp   = _fval(rec,'Folio Propiedad NERI') || folioLead.replace(/-\d+$/,'');
  const diag   = _fval(rec,'Diagnóstico comercial');
  const status = _fval(rec,'Status del Lead');
  const clasif = _fval(rec,'Clasificación');
  const propied= _fval(rec,'Propiedad de Interés');
  const wa     = _fval(rec,'Teléfono WhatsApp');

  const sd = v => v ? v : '<span class="fk-empty">Sin definir</span>';
  // Un lead comprador todavía NO tiene portal de cliente.
  // El portal nace hasta Apartado → Portal Progreso Clientes.
  const portalUrl = ''; // intencional: no mostrar portal en ficha de lead

  const rows = [
    ['Riesgo principal',     _fval(rec,'Riesgo principal')],
    ['Estado emocional',     _fval(rec,'Estado emocional')],
    ['Siguiente jugada',     _fval(rec,'Siguiente jugada')],
    ['Última interacción',   _fval(rec,'Última interacción')],
  ].map(([k,v]) => `<div class="fk-row"><div class="fk-k">${k}</div><div class="fk-v">${sd(v)}</div></div>`).join('');

  const msg = _fval(rec,'Mensaje sugerido');
  const msgBlock = `<div class="fk-msg-wrap">
      <div class="fk-msg-head"><span>Mensaje sugerido</span>
        ${msg ? `<button class="fk-copy" onclick="fichaCopy(this)" data-msg="${msg.replace(/"/g,'&quot;')}">Copiar</button>` : ''}
      </div>
      <div class="fk-msg">${msg ? msg.replace(/</g,'&lt;') : '<span class="fk-empty">Sin definir</span>'}</div>
    </div>`;

  document.getElementById('crm-ficha-body').innerHTML = `
    <div class="fk-top">
      <div>
        <div class="fk-name">${nombre}</div>
        <div class="fk-folio">${folioLead || '— sin folio —'}</div>
        ${folioOp && folioOp!==folioLead ? `<div class="fk-op">Operación: ${folioOp}</div>` : ''}
      </div>
      <div class="fk-tags">
        ${clasif ? `<span class="badge ${STATUS_BADGE[clasif]||''}">${clasif}</span>`:''}
        ${status ? `<span class="badge ${STATUS_BADGE[status]||''}">${status}</span>`:''}
      </div>
    </div>
    <div class="fk-sub">${propied ? '◈ '+propied : 'Sin propiedad ligada'}${wa ? ' · '+wa : ''}</div>

    <div class="fk-diag ${diag ? 'on':''}">
      <span class="fk-diag-lbl">Diagnóstico comercial</span>
      <span class="fk-diag-val">${diag || 'Sin diagnóstico'}</span>
    </div>

    <div class="fk-grid">${rows}</div>
    ${msgBlock}`;

  // No mostrar Portal del cliente en ficha de lead comprador.
  const portalBtn = document.getElementById('crm-ficha-portal');
  if(portalBtn) portalBtn.style.display='none';

  document.getElementById('crm-ficha').style.display = 'flex';
}

function crmCloseFicha(){ document.getElementById('crm-ficha').style.display = 'none'; }

/* ─── FICHA PREMIUM — LEAD VENDEDOR ──────────────────────────────────
   Diseño orientado al asesor: origen del lead arriba, propiedad en el
   centro, intención de venta e info fiscal al fondo.
   Los campos candado (Folio, Propiedad Creada, Fecha creada) son solo
   lectura; el botón "Editar" abre el modal genérico de edición.       */

function vendedorOpenFicha(recId){
  const rec = crmState.records.find(r => r.id === recId);
  if(!rec) return;
  crmState.editId = recId;
  crmState.isNew  = false;

  const fv = f => _fval(rec, f);
  const sd = v => v || '<span class="fv-row-v empty">Sin datos</span>';

  // Datos clave
  const nombre    = fv('Nombre Completo') || 'Sin nombre';
  const folio     = fv('Folio') || '— sin folio —';
  const wa        = fv('Teléfono WhatsApp');
  const fuente    = fv('Fuente');
  const asesor    = fv('Asesor');
  const fechaEnt  = fv('Fecha de Entrada');
  const horaEnt   = fv('Hora de Entrada');
  const estado    = fv('Estado');

  // Propiedad
  const tipo      = fv('Tipo de Propiedad');
  const zona      = fv('Zona');
  const precio    = fv('Precio Estimado');
  const hab       = fv('Habitaciones');
  const ban       = fv('Baños');
  const mban      = fv('Medios Baños');
  const est       = fv('Estacionamientos');

  // Intención
  const tiempo    = fv('Tiempo de Venta');
  const razon     = fv('Razón de Venta');
  const diagFisc  = fv('Diagnóstico Fiscal');
  const detFisc   = fv('Detalle Fiscal');

  // Operación
  const conv      = fv('Conversión');
  const progExp   = fv('Progreso Expediente');
  const docs      = fv('Documentos');
  const propCreada= fv('Propiedad Creada');

  // WhatsApp link
  const waClean = wa.replace(/\D/g,'');
  const waLink  = waClean ? `https://wa.me/52${waClean}` : '';

  // Clase de conversión para color
  const convClass = {
    'Firma exclusiva': 'firma-exc',
    'Firma venta directa': 'firma-dir',
    'En seguimiento': 'seguimiento',
    'No calificó': 'no-cal',
  }[conv] || '';

  const convDesc = {
    'Firma exclusiva': 'La propiedad pasa a Propiedades NERI.',
    'Firma venta directa': 'Venta sin exclusiva previa.',
    'En seguimiento': 'Prospecto activo, sin firma aún.',
    'No calificó': 'Lead descartado del proceso.',
  }[conv] || '';

  // Números de la propiedad
  const numBlock = (val, lbl) => `
    <div class="fv-num${val ? '' : ' empty'}">
      <div class="fv-num-val">${val || '—'}</div>
      <div class="fv-num-lbl">${lbl}</div>
    </div>`;

  // Fila de dato
  const row = (k, v, full, isLong) => `
    <div class="fv-row${full ? ' full' : ''}">
      <div class="fv-row-k">${k}</div>
      <div class="fv-row-v${isLong ? ' long' : ''}">${v ? _esc(v) : '<span class="fv-row-v empty">Sin datos</span>'}</div>
    </div>`;

  const html = `
    <!-- HEADER -->
    <div class="fv-header">
      <div>
        <div class="fv-nombre">${_esc(nombre)}</div>
        <div class="fv-wa">
          ${wa ? `<span>${_esc(wa)}</span>
            ${waLink ? `<a class="fv-wa-btn" href="${waLink}" target="_blank">↗ WhatsApp</a>` : ''}` : '<span style="color:var(--w30);font-size:11px">Sin teléfono</span>'}
        </div>
        <div class="fv-meta">
          ${asesor   ? `<div class="fv-meta-chip">Asesor <em>${_esc(asesor)}</em></div>` : ''}
          ${fuente   ? `<div class="fv-meta-chip">Fuente <em>${_esc(fuente)}</em></div>` : ''}
          ${fechaEnt ? `<div class="fv-meta-chip">Entrada <em>${_esc(fechaEnt)}${horaEnt ? ' · '+_esc(horaEnt) : ''}</em></div>` : ''}
        </div>
      </div>
      <div>
        <div class="fv-folio-lbl">Folio</div>
        <div class="fv-folio">${_esc(folio)}</div>
        ${conv ? `<div style="margin-top:8px;text-align:right"><span class="badge ${crmBadgeForConv(conv)}">${_esc(conv)}</span></div>` : ''}
      </div>
    </div>

    <!-- BODY -->
    <div class="fv-body">

      <!-- SECCIÓN: La propiedad -->
      <div class="fv-sec">
        <div class="fv-sec-title"><em>◈</em>La propiedad</div>
        <div class="fv-grid">
          ${row('Tipo', tipo)}
          ${row('Zona', zona)}
          ${row('Precio estimado', precio)}
          ${row('Estado / Entidad', estado)}
        </div>
        <div class="fv-nums" style="margin-top:2px">
          ${numBlock(hab,  'Rec.')}
          ${numBlock(ban,  'Baños')}
          ${numBlock(mban, 'Medios')}
          ${numBlock(est,  'Est.')}
        </div>
      </div>

      <!-- SECCIÓN: Intención de venta -->
      <div class="fv-sec">
        <div class="fv-sec-title"><em>◎</em>Intención de venta</div>
        <div class="fv-grid">
          ${row('¿Cuándo quiere vender?', tiempo)}
          ${row('Razón de venta', razon)}
          ${row('Diagnóstico fiscal', diagFisc)}
          ${detFisc ? `<div class="fv-row full"><div class="fv-row-k">Detalle fiscal</div><div class="fv-row-v long">${_esc(detFisc)}</div></div>` : ''}
        </div>
      </div>

      <!-- SECCIÓN: Operación -->
      <div class="fv-sec">
        <div class="fv-sec-title"><em>⊕</em>Operación</div>
        <div class="fv-conversion ${convClass}">
          <div>
            <div class="fv-conv-lbl">Conversión</div>
            <div class="fv-conv-val">${conv ? _esc(conv) : '— Sin definir —'}</div>
            ${convDesc ? `<div class="fv-conv-desc">${convDesc}</div>` : ''}
          </div>
        </div>
        ${progExp ? `<div class="fv-grid" style="margin-top:2px">${row('Progreso expediente', progExp, true)}</div>` : ''}
        ${docs    ? `<div class="fv-grid" style="margin-top:2px"><div class="fv-row full"><div class="fv-row-k">Documentos</div><div class="fv-row-v long">${_esc(docs)}</div></div></div>` : ''}
      </div>

      <!-- SECCIÓN: Sistema (solo lectura) -->
      <div class="fv-sec">
        <div class="fv-sec-title"><em>🔒</em>Sistema</div>
        <div class="le-banner" style="margin-bottom:10px">Campos generados automáticamente. No se editan desde la intranet.</div>
        <div class="fv-lock">
          <div class="fv-lock-k">🔒 Folio</div>
          <div class="fv-lock-v">${_esc(folio)}</div>
        </div>
        <div class="fv-lock" style="margin-top:4px">
          <div class="fv-lock-k">🔒 Propiedad creada en sistema</div>
          <span class="fv-lock-badge ${propCreada ? 'on' : 'off'}">${propCreada ? '✓ Creada' : '○ Pendiente'}</span>
        </div>
      </div>

    </div><!-- /fv-body -->
  `;

  document.getElementById('crm-fv-inner').innerHTML = html;
  document.getElementById('crm-ficha-vendedor').style.display = 'flex';
}

function crmBadgeForConv(conv){
  return {
    'Firma exclusiva':'badge-offer',
    'Firma venta directa':'badge-close',
    'En seguimiento':'badge-visit',
    'No calificó':'badge-lost',
  }[conv] || '';
}

function vendedorClose(){
  document.getElementById('crm-ficha-vendedor').style.display = 'none';
}

function vendedorEditFromFicha(){
  vendedorClose();
  crmOpenEdit(crmState.editId);
}

/* ─── AGENDAR VISITA desde la ficha del lead comprador ─────
   Abre el modal de citas en modo NUEVO, pre-rellenado con los
   datos del lead. Folio Cliente Origen viaja en crmState.citaFromLead
   y se inyecta en el POST sin que el asesor lo toque.            */
function fichaAgendarCita(){
  const rec = crmState.records.find(r => r.id === crmState.editId);
  if(!rec) return;

  // Folio correcto: "Folio del Comprador" (lookup de la propiedad) o "Folio Propiedad NERI"
  // El campo primario "Folio" suele estar vacío en Leads Compradores — no usarlo
  const folioClienteOrigen =
    _fval(rec,'Folio del Comprador') ||
    _fval(rec,'Folio Propiedad NERI') ||
    '';

  const comprador = _fval(rec,'Nombre Completo') || '';
  const propiedad = _fval(rec,'Propiedad de Interés') || '';
  const asesor    = _fval(rec,'Asesor') || '';

  // Guardar contexto para que citaSave() lo incluya en el POST
  crmState.citaFromLead = { folioClienteOrigen, comprador, propiedad, asesor };

  // Cerrar la ficha y abrir el modal de cita en modo nuevo, pre-rellenado
  crmCloseFicha();

  // Reutilizar el modal existente de cita: modo creación
  crmState.isNew  = true;
  crmState.editId = null;

  const TIPO_OPTS   = ['Visita presencial','Videollamada','Segunda visita','Visita con familia','Visita con valuador'];
  const ESTADO_OPTS = ['Pendiente','Confirmada','Realizada','Cancelada','Reagendada'];

  const _sel = (name, opts, cur) =>
    `<div class="form-group full">
       <label class="form-label">${name}</label>
       <select class="form-inp" data-field="${_escAttr(name)}" data-ftype="select" data-orig="${_escAttr(cur)}">
         <option value="">— Sin selección</option>
         ${opts.map(o=>`<option value="${_escAttr(o)}"${cur===o?' selected':''}>${o}</option>`).join('')}
       </select></div>`;

  const _inp = (name, val, full) =>
    `<div class="form-group${full?' full':''}">
       <label class="form-label">${name}</label>
       <input class="form-inp" type="text" data-field="${_escAttr(name)}" data-ftype="text"
              data-orig="" value="${_escAttr(val)}"></div>`;

  const _ta = (name, val) =>
    `<div class="form-group full">
       <label class="form-label">${name}</label>
       <textarea class="form-inp" data-field="${_escAttr(name)}" data-ftype="text"
                 data-orig="" rows="2">${_esc(val)}</textarea></div>`;

  const bannerHtml = folioClienteOrigen
    ? `<div class="le-banner" style="margin-bottom:12px">
         Lead de origen: <strong>${_esc(folioClienteOrigen)}</strong> — el folio se registra automáticamente.
       </div>`
    : `<div class="le-banner" style="margin-bottom:12px;border-color:var(--amber,#e8a838)">
         ⚠ No se encontró folio en este lead. Verifica en Airtable.
       </div>`;

  const previewHtml = `
    <div class="cita-ticket" style="margin-bottom:16px">
      <div>
        <div class="cita-folio-tag">Nueva cita</div>
        <div class="cita-nombre">${_esc(comprador || 'Sin nombre')}</div>
        <div class="cita-propiedad">◈ ${_esc(propiedad || 'Sin propiedad')}</div>
      </div>
      <span class="le-vstatus off">Folio lo asigna Make</span>
    </div>`;

  const formHtml = `
    ${bannerHtml}
    ${previewHtml}
    <div class="cita-sec-title"><span>◷</span>Fecha y hora</div>
    <div class="cita-grid">
      ${_inp('Fecha de la Cita', '', false)}
      ${_inp('Hora', '', false)}
    </div>
    <div class="cita-sec-title"><span>◈</span>Detalles</div>
    <div class="cita-grid">
      ${_inp('Comprador', comprador, false)}
      ${_inp('Propiedad', propiedad, false)}
      ${_inp('Asesor', asesor, false)}
      ${_sel('Tipo de Cita', TIPO_OPTS, 'Visita presencial')}
      ${_sel('Estado Cita', ESTADO_OPTS, 'Pendiente')}
      ${_ta('Notas de la Cita', '')}
    </div>`;

  document.getElementById('crm-cita-err').textContent = '';
  document.getElementById('crm-cita-body').innerHTML = formHtml;
  document.getElementById('crm-cita-ver').style.display = 'none';
  document.getElementById('crm-cita').style.display = 'flex';
}

function fichaEditFromFicha(){
  crmCloseFicha();
  crmOpenEdit(crmState.editId);
}

function fichaCopy(btn){
  const t = btn.getAttribute('data-msg') || '';
  navigator.clipboard?.writeText(t).then(()=>{ showToast('✓ Mensaje copiado'); },
    ()=>{ showToast('No se pudo copiar'); });
}

/* ─── EDITOR DE LANDING (Ficha de Propiedad) ───────── */
/* Solo lectura del folio; edita SOLO campos de contenido de la landing.
   Folio NERI / Links / contadores son fórmula/Make → bloqueados.        */
const LANDING_FORM = [
  {title:'Portada', ico:'◫', fields:[
    {f:'Frase Portada',  type:'text',     full:true},
    {f:'Frase Inicio',   type:'textarea', full:true},
    {f:'Foto de portada',type:'attach',   full:true, img:true},
  ]},
  {title:'Precio', ico:'$', fields:[
    {f:'Precio Lista',  type:'number'},
    {f:'Precio Minimo', type:'number'},
    {f:'Moneda',        type:'select', opts:['MXN','USD']},
  ]},
  {title:'Plusvalía', ico:'↗', fields:[
    {f:'Plusvalia Valor', type:'text'},
    {f:'Plusvalia Texto', type:'textarea', full:true},
  ]},
  {title:'Videos de la landing', ico:'▶', videos:[
    {room:'Sala',     yt:'Video Sala',         mp4:'Video Sala MP4'},
    {room:'Cocina',   yt:'Video Cocina',       mp4:'Video Cocina MP4'},
    {room:'Recámara', yt:'Video Recamara',     mp4:'Video Recamara MP4'},
    {room:'Jardín',   yt:'Video Jardin',       mp4:'Video Jardin MP4'},
    {room:'Alberca',  yt:'Video Alberca',      mp4:'Video Alberca MP4'},
    {room:'Extra',    yt:'Nombre Video Extra', mp4:'Video Extra MP4', extra:true},
  ]},
  {title:'Datos de la casa', ico:'⌂', fields:[
    {f:'Tipo de Propiedad', type:'select', opts:['Casa','Departamento','Terreno','Local','Oficina','Bodega']},
    {f:'Estado Propiedad',  type:'select', opts:['Disponible','Apartada','Vendida','En proceso','Suspendida']},
    {f:'Habitaciones',       type:'number'},
    {f:'Banos',              type:'number'},
    {f:'Medios Banos',       type:'number'},
    {f:'Estacionamientos',   type:'number'},
    {f:'Metros Construccion',type:'number'},
    {f:'Metros Terreno',     type:'number'},
    {f:'Zona / Colonia',     type:'text'},
    {f:'Municipio',          type:'text'},
    {f:'Estado / Entidad',   type:'text'},
    {f:'Direccion',          type:'text', full:true},
  ]},
  {title:'Links', ico:'↗', fields:[
    {f:'Link Tour Virtual', type:'url', full:true},
    {f:'Google Maps URL',   type:'url', full:true},
  ]},
];

// Metadatos de tipo, para guardar con el formato correcto
const LANDING_META = (() => {
  const m = {};
  LANDING_FORM.forEach(sec => (sec.fields||[]).forEach(fl => { m[fl.f] = fl.type; }));
  // videos: YouTube ID / nombre extra = texto plano
  LANDING_FORM.forEach(sec => (sec.videos||[]).forEach(v => { m[v.yt] = 'text'; }));
  return m;
})();

function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function _attInfo(rec, name){
  const a = rec.fields?.[name];
  if(Array.isArray(a) && a.length){
    const f0 = a[0] || {};
    return { has:true, count:a.length, url:f0.url||'', thumb:(f0.thumbnails&&f0.thumbnails.small&&f0.thumbnails.small.url)||'' };
  }
  return { has:false, count:0, url:'', thumb:'' };
}

function _safeDocKey(s){
  return String(s || 'archivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Za-z0-9\-_.]/g,'_')
    .slice(0,80);
}

let _blobClientUploadPromise = null;
async function getBlobClientUpload(){
  if(window.__neriBlobUpload) return window.__neriBlobUpload;
  if(!_blobClientUploadPromise){
    _blobClientUploadPromise = import('https://esm.sh/@vercel/blob@latest/client')
      .then(mod => {
        if(!mod.upload) throw new Error('No se pudo cargar @vercel/blob/client.');
        window.__neriBlobUpload = mod.upload;
        return mod.upload;
      });
  }
  return _blobClientUploadPromise;
}

async function uploadBlobFile(file, folio, doc){
  if(!file) return null;
  const maxBytes = 200 * 1024 * 1024;
  if(file.size > maxBytes) throw new Error('El archivo supera 200 MB. Comprime el video o usa un enlace externo.');

  const safeFolio = _safeDocKey(folio || 'sin-folio');
  const safeDoc   = _safeDocKey(doc || 'archivo');
  const safeName  = _safeDocKey(file.name || 'archivo');
  const pathname  = `intranet/${safeFolio}/${safeDoc}-${Date.now()}-${safeName}`;

  try{
    const upload = await getBlobClientUpload();
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: JSON.stringify({ folio: safeFolio, doc: safeDoc })
    });
    if(!blob?.url) throw new Error('Blob no devolvió URL.');
    return blob.url;
  }catch(e){
    // Respaldo controlado: solo para archivos pequeños. Vercel Functions tienen límite de 4.5 MB.
    if(file.size <= 4 * 1024 * 1024){
      const qs = new URLSearchParams({ folio: folio || 'sin-folio', doc: safeDoc, filename: file.name || 'archivo' });
      const r = await fetch('/api/upload-documento?' + qs.toString(), {
        method:'POST',
        headers:{ 'x-content-type': file.type || 'application/octet-stream' },
        body:file
      });
      const data = await r.json().catch(() => ({}));
      if(!r.ok) throw new Error(data.error || ('No se pudo subir ' + (file.name || 'archivo')));
      if(!data.url) throw new Error('Blob no devolvió URL para ' + (file.name || 'archivo'));
      return data.url;
    }
    throw new Error('No se pudo subir directo a Vercel Blob. Revisa BLOB_READ_WRITE_TOKEN y que Blob esté conectado al proyecto. Detalle: ' + (e?.message || e));
  }
}

function _landInput(fl, rec){
  const name = fl.f;
  let val = _fval(rec, name);
  const orig = val;

  if(fl.type === 'attach'){
    const info = _attInfo(rec, name);
    const thumb = (fl.img && info.thumb)
      ? `<img class="le-thumb" src="${_escAttr(info.thumb)}" alt="">`
      : `<div class="le-thumb-empty">${info.has?'▣':'＋'}</div>`;
    const status = info.has
      ? `<span class="le-vstatus on">Cargado${info.count>1?' ('+info.count+')':''}</span>`
      : `<span class="le-vstatus off">Vacío</span>`;
    return `<div class="form-group full">
        <label class="form-label">${name}</label>
        <div class="le-attach">${thumb}${status}</div>
        <div class="le-upload">
          <input class="form-inp" type="file" data-upload-attach="${_escAttr(name)}" data-upload-doc="${_escAttr(name)}" accept="image/*,video/mp4,video/quicktime,application/pdf">
        </div>
        <input class="form-inp" type="text" data-attach="${_escAttr(name)}"
               placeholder="O pegar URL pública para reemplazar (opcional)">
        <div class="le-note">Puedes subir el archivo desde aquí. La intranet lo manda directo a Vercel Blob y guarda solo la URL en Airtable.</div>
      </div>`;
  }
  if(fl.type === 'select'){
    const os = (fl.opts||[]).map(o => `<option value="${_escAttr(o)}"${val===o?' selected':''}>${o}</option>`).join('');
    return `<div class="form-group${fl.full?' full':''}">
        <label class="form-label">${name}</label>
        <select class="form-inp" data-field="${_escAttr(name)}" data-ftype="select" data-orig="${_escAttr(orig)}">
          <option value="">— Sin selección</option>${os}</select></div>`;
  }
  if(fl.type === 'textarea'){
    return `<div class="form-group${fl.full?' full':''}">
        <label class="form-label">${name}</label>
        <textarea class="form-inp" data-field="${_escAttr(name)}" data-ftype="text" data-orig="${_escAttr(orig)}" rows="2">${_esc(val)}</textarea></div>`;
  }
  const inType = fl.type === 'number' ? 'number' : 'text';
  const ft = fl.type === 'number' ? 'number' : 'text';
  return `<div class="form-group${fl.full?' full':''}">
      <label class="form-label">${name}</label>
      <input class="form-inp" type="${inType}" data-field="${_escAttr(name)}" data-ftype="${ft}" data-orig="${_escAttr(orig)}" value="${_escAttr(val)}"></div>`;
}

function _landVideoRow(v, rec){
  const ytVal = _fval(rec, v.yt);
  const info  = _attInfo(rec, v.mp4);
  const mp4 = info.has
    ? `<span class="le-vstatus on">MP4 ✓</span>`
    : `<span class="le-vstatus off">MP4 —</span>`;
  const ph = v.extra ? 'Nombre (ej. Estudio)' : 'ID de YouTube';
  return `<div class="le-vrow">
      <span class="le-vroom">${v.room}</span>
      <div>
        <input class="form-inp" type="text" data-field="${_escAttr(v.yt)}" data-ftype="text" data-orig="${_escAttr(ytVal)}" value="${_escAttr(ytVal)}" placeholder="${ph}">
        <div class="le-upload">
          <input class="form-inp" type="file" data-upload-attach="${_escAttr(v.mp4)}" data-upload-doc="${_escAttr(v.mp4)}" accept="video/mp4,video/quicktime">
        </div>
      </div>
      ${mp4}
    </div>`;
}

function landOpenEditor(recId){
  const rec = crmState.records.find(r => r.id === recId);
  if(!rec) return;
  crmState.editId = recId;
  crmState.isNew  = false;
  document.getElementById('crm-landing-err').textContent = '';

  const nombre   = _fval(rec,'Nombre Propiedad') || 'Propiedad sin nombre';
  const folioNeri= _fval(rec,'Folio NERI');
  const linkComp = _fval(rec,'Link Comprador');
  const linkPort = _fval(rec,'Link Portal');

  const secs = LANDING_FORM.map(sec => {
    let inner;
    if(sec.videos){
      inner = `<div class="le-note" style="margin:0 0 8px">Puedes pegar ID de YouTube o subir el MP4 aquí. La intranet sube directo a Blob y guarda la URL en Airtable.</div>`
            + sec.videos.map(v => _landVideoRow(v, rec)).join('');
    } else {
      inner = `<div class="le-grid">${sec.fields.map(fl => _landInput(fl, rec)).join('')}</div>`;
    }
    return `<div class="le-sec">
        <div class="le-sec-title"><span class="le-ico">${sec.ico}</span>${sec.title}</div>
        ${inner}</div>`;
  }).join('');

  const lockRow = (k, v) => v ? `<div class="le-lock">
      <div class="le-lock-k">🔒 ${k}</div><div class="le-lock-v">${_esc(v)}</div></div>` : '';

  const lockBlock = `<div class="le-sec">
      <div class="le-sec-title"><span class="le-ico">🔒</span>Folio y enlaces (solo lectura)</div>
      <div class="le-banner">Estos los arma el sistema solo (folio maestro y links). La intranet nunca los escribe.</div>
      <div style="margin-top:10px">
        ${lockRow('Folio NERI', folioNeri)}
        ${lockRow('Link Comprador (landing)', linkComp)}
        ${lockRow('Link Portal del cliente', linkPort)}
      </div></div>`;

  document.getElementById('crm-landing-body').innerHTML = `
    <div style="margin-bottom:4px">
      <div class="fk-name">${_esc(nombre)}</div>
      <div class="fk-folio">${folioNeri || '— sin folio aún —'}</div>
    </div>
    ${secs}
    ${lockBlock}`;

  const viewBtn = document.getElementById('crm-landing-view');
  if(linkComp){ viewBtn.style.display=''; viewBtn.onclick = () => window.open(linkComp,'_blank'); }
  else { viewBtn.style.display='none'; }

  document.getElementById('crm-landing').style.display = 'flex';
}

function landClose(){ document.getElementById('crm-landing').style.display = 'none'; }

async function landSave(){
  const btn   = document.getElementById('crm-landing-save');
  const errEl = document.getElementById('crm-landing-err');
  const cfg   = CRM_CFG['propiedades'];
  btn.textContent = 'Guardando...'; btn.disabled = true; errEl.textContent = '';

  const fields = {};

  // 1) Campos de texto / número / select: solo lo que cambió
  document.querySelectorAll('#crm-landing-body [data-field]').forEach(el => {
    const name = el.dataset.field;
    const ftype= el.dataset.ftype;
    const orig = (el.dataset.orig || '').trim();
    const nv   = (el.value || '').trim();
    if(nv === orig) return;                       // sin cambios → no tocar

    if(ftype === 'number'){
      if(nv === ''){ fields[name] = null; }        // se limpió
      else { const n = Number(nv.replace(/[, $]/g,'')); if(!isNaN(n)) fields[name] = n; }
    } else if(ftype === 'select'){
      fields[name] = nv === '' ? null : nv;   // typecast:true maneja la conversión
    } else {
      fields[name] = nv === '' ? null : nv;        // texto / textarea / url / youtube id
    }
  });

  // 2) Adjuntos por URL pegada: solo si se pegó una URL nueva (nunca se borran sin querer)
  document.querySelectorAll('#crm-landing-body [data-attach]').forEach(el => {
    const name = el.dataset.attach;
    const url  = (el.value || '').trim();
    if(url) fields[name] = [{ url }];
  });

  // 3) Adjuntos por archivo: sube a Vercel Blob y guarda SOLO la URL en Airtable
  const currentRec = crmState.records.find(r => r.id === crmState.editId);
  const folioUpload = _fval(currentRec || {}, 'Folio NERI') || _fval(currentRec || {}, 'Nombre Propiedad') || crmState.editId;
  const uploadInputs = Array.from(document.querySelectorAll('#crm-landing-body [data-upload-attach]'))
    .filter(el => el.files && el.files[0]);

  if(uploadInputs.length){
    btn.textContent = uploadInputs.length === 1 ? 'Subiendo archivo...' : 'Subiendo archivos...';
    for(const el of uploadInputs){
      const name = el.dataset.uploadAttach;
      const doc  = el.dataset.uploadDoc || name;
      const file = el.files[0];
      const url = await uploadBlobFile(file, folioUpload, doc);
      fields[name] = [{ url }];
    }
  }

  if(Object.keys(fields).length === 0){
    errEl.style.color = 'var(--w50)';
    errEl.textContent = 'No hay cambios para guardar.';
    btn.textContent = 'Guardar cambios'; btn.disabled = false;
    return;
  }

  try {
    await atFetch(`${cfg.tableId}/${crmState.editId}`, {
      method:'PATCH', body: JSON.stringify({ fields, typecast:true })
    });
    landClose();
    showToast('✓ Landing actualizada');
    await crmLoad('propiedades', true);
  } catch(e){
    errEl.style.color = 'var(--red)';
    errEl.textContent = 'Error al guardar: ' + e.message;
  } finally {
    btn.textContent = 'Guardar cambios'; btn.disabled = false;
  }
}

/* ─── FICHA DE CITA ───────────────────────────────── */
/*  Patrón: abre modal de solo lectura/edición de una cita.
    Si no existe cita para ese folio lead → modo creación.
    Nunca escribe el Folio Cita (campo calculado / Make).     */

function citaOpenFicha(recId){
  const rec = crmState.records.find(r => r.id === recId);
  if(!rec) return;
  crmState.editId = recId;
  crmState.isNew  = false;

  const cfg = CRM_CFG['citas'];
  document.getElementById('crm-cita-err').textContent = '';

  const folioCita = _fval(rec,'Folio Cita');
  const comprador = _fval(rec,'Comprador');
  const propiedad = _fval(rec,'Propiedad');
  const fecha     = _fval(rec,'Fecha de la Cita');
  const hora      = _fval(rec,'Hora');
  const tipo      = _fval(rec,'Tipo de Cita');
  const estado    = _fval(rec,'Estado Cita');
  const asesor    = _fval(rec,'Asesor');
  const notas     = _fval(rec,'Notas de la Cita');

  const citaUrl = folioCita ? (CITA_VERCEL_BASE + '?cita=' + encodeURIComponent(folioCita)) : '';

  // Bloque de ticket superior
  const ticketHtml = `
    <div class="cita-ticket">
      <div>
        <div class="cita-folio-tag">Cita agendada</div>
        <div class="cita-nombre">${_esc(comprador || 'Comprador sin nombre')}</div>
        <div class="cita-propiedad">◈ ${_esc(propiedad || 'Propiedad sin ligar')}</div>
      </div>
      <div>${folioCita ? `<div class="cita-folio-code">${_esc(folioCita)}</div>` : '<span class="le-vstatus off">Sin folio aún</span>'}</div>
    </div>`;

  // Bloque editable: fecha, hora, tipo, estado, notas
  const TIPO_OPTS = ['Visita presencial','Videollamada','Segunda visita','Visita con familia','Visita con valuador'];
  const ESTADO_OPTS = ['Pendiente','Confirmada','Realizada','Cancelada','Reagendada'];

  const _sel = (name, opts, cur) =>
    `<div class="form-group full">
       <label class="form-label">${name}</label>
       <select class="form-inp" data-field="${_escAttr(name)}" data-ftype="select" data-orig="${_escAttr(cur)}">
         <option value="">— Sin selección</option>
         ${opts.map(o=>`<option value="${_escAttr(o)}"${cur===o?' selected':''}>${o}</option>`).join('')}
       </select></div>`;

  const _inp = (name, val, full) =>
    `<div class="form-group${full?' full':''}">
       <label class="form-label">${name}</label>
       <input class="form-inp" type="text" data-field="${_escAttr(name)}" data-ftype="text"
              data-orig="${_escAttr(val)}" value="${_escAttr(val)}"></div>`;

  const _ta = (name, val) =>
    `<div class="form-group full">
       <label class="form-label">${name}</label>
       <textarea class="form-inp" data-field="${_escAttr(name)}" data-ftype="text"
                 data-orig="${_escAttr(val)}" rows="2">${_esc(val)}</textarea></div>`;

  const formHtml = `
    <div class="cita-sec-title"><span>◷</span>Fecha y hora</div>
    <div class="cita-grid">
      ${_inp('Fecha de la Cita', fecha)}
      ${_inp('Hora', hora)}
    </div>
    <div class="cita-sec-title"><span>◈</span>Detalles</div>
    <div class="cita-grid">
      ${_inp('Asesor', asesor)}
      ${_sel('Tipo de Cita', TIPO_OPTS, tipo)}
      ${_sel('Estado Cita', ESTADO_OPTS, estado)}
      ${_ta('Notas de la Cita', notas)}
    </div>`;

  // Bloque de confirmación (solo lectura, visible si hay fecha/hora)
  const confirmHtml = (fecha || hora) ? `
    <div class="cita-confirm-block">
      <div class="cita-confirm-title">◎ Resumen de la cita</div>
      ${[['Comprador', comprador],['Propiedad', propiedad],['Fecha', fecha],['Hora', hora],
         ['Tipo', tipo],['Estado', estado],['Asesor', asesor]]
        .filter(([,v])=>v)
        .map(([k,v])=>`<div class="cita-confirm-row"><div class="cita-ck">${k}</div><div class="cita-cv">${_esc(v)}</div></div>`)
        .join('')}
      ${citaUrl ? `<button class="cita-link-chip" onclick="window.open('${_escAttr(citaUrl)}','_blank')">↗ Link de la cita</button>` : ''}
    </div>` : '';

  // Bloque folio — solo lectura
  const lockHtml = `
    <div class="cita-sec-title"><span>🔒</span>Sistema (solo lectura)</div>
    <div class="le-banner">El Folio de Cita lo genera Make automáticamente. La intranet nunca lo escribe.</div>
    ${folioCita ? `<div class="le-lock" style="margin-top:10px">
      <div class="le-lock-k">🔒 Folio Cita</div>
      <div class="le-lock-v">${_esc(folioCita)}</div>
    </div>` : ''}
    ${citaUrl ? `<div class="le-lock">
      <div class="le-lock-k">🔒 Link de la cita</div>
      <div class="le-lock-v">${_esc(citaUrl)}</div>
    </div>` : ''}`;

  document.getElementById('crm-cita-body').innerHTML = ticketHtml + formHtml + confirmHtml + lockHtml;

  // Botón "Ver cita"
  const verBtn = document.getElementById('crm-cita-ver');
  if(citaUrl){ verBtn.style.display=''; verBtn.onclick = () => window.open(citaUrl,'_blank'); }
  else { verBtn.style.display='none'; }

  document.getElementById('crm-cita').style.display = 'flex';
}

function citaClose(){
  document.getElementById('crm-cita').style.display = 'none';
}

async function citaSave(){
  const btn   = document.getElementById('crm-cita-save');
  const errEl = document.getElementById('crm-cita-err');
  const cfg   = CRM_CFG['citas'];
  btn.textContent = 'Guardando...'; btn.disabled = true; errEl.textContent = '';

  const fields = {};
  document.querySelectorAll('#crm-cita-body [data-field]').forEach(el => {
    const name  = el.dataset.field;
    const ftype = el.dataset.ftype;
    const orig  = (el.dataset.orig || '').trim();
    const nv    = (el.value || '').trim();
    // En edición: guardar solo cambios. En nueva cita: guardar todo lo que venga lleno,
    // incluyendo valores default como Tipo de Cita y Estado Cita.
    if(crmState.isNew){
      if(nv === '') return;
    } else {
      if(nv === orig) return;
    }

    if(ftype === 'select'){
      // Con typecast:true Airtable acepta el string directamente para singleSelect.
      // Usar {name:val} falla con 422 si hay diferencia de mayúsculas/minúsculas.
      fields[name] = nv;
    } else {
      fields[name] = nv;
    }
  });

  if(Object.keys(fields).length === 0){
    errEl.style.color = 'var(--w50)';
    errEl.textContent = 'No hay cambios para guardar.';
    btn.textContent = 'Guardar cambios'; btn.disabled = false;
    return;
  }

  // Si la cita viene de la ficha del lead, heredar Folio Cliente Origen automáticamente
  if(crmState.isNew && crmState.citaFromLead){
    const ctx = crmState.citaFromLead;
    if(ctx.folioClienteOrigen && !fields['Folio Cliente Origen']){
      fields['Folio Cliente Origen'] = ctx.folioClienteOrigen;
    }
  }

  try {
    if(crmState.isNew){
      await atFetch(cfg.tableId, { method:'POST', body: JSON.stringify({ fields, typecast:true }) });
    } else {
      await atFetch(`${cfg.tableId}/${crmState.editId}`, {
        method:'PATCH', body: JSON.stringify({ fields, typecast:true })
      });
    }
    crmState.citaFromLead = null; // limpiar contexto del lead
    citaClose();
    showToast('✓ Cita guardada');
    await crmLoad('citas', true);
  } catch(e){
    errEl.style.color = 'var(--red)';
    errEl.textContent = 'Error al guardar: ' + e.message;
  } finally {
    btn.textContent = 'Guardar cambios'; btn.disabled = false;
  }
}

function citaCloseAndClear(){
  crmState.citaFromLead = null;
  citaClose();
}

function citaOpenNew(){
  crmState.editId = null;
  crmState.isNew  = true;
  crmBuildModal('NUEVA CITA', CRM_CFG['citas'].editable, {});
}

/* ─── BUILD MODAL HTML ─────────────────────────────── */
function crmBuildModal(title, editable, values){
  document.getElementById('crm-modal-title').innerHTML = title;
  document.getElementById('crm-modal-sub').textContent = CRM_CFG[crmState.tab]?.label || '';
  document.getElementById('crm-modal-err').textContent = '';

  const html = editable.map(({f, type, opts}) => {
    let val = values[f] ?? '';
    if(typeof val === 'object') val = val?.name ?? '';
    val = String(val);

    const fieldAttr = _escAttr(f);
    const valueAttr = _escAttr(val);

    if(type === 'select'){
      const os = (opts||[]).map(o =>
        `<option value="${_escAttr(o)}"${val===o?' selected':''}>${_esc(o)}</option>`).join('');
      return `<div class="form-group">
        <label class="form-label">${_esc(f)}</label>
        <select class="form-inp" data-field="${fieldAttr}" data-ftype="select" data-orig="${valueAttr}"><option value="">— Sin selección</option>${os}</select></div>`;
    }
    if(type === 'textarea'){
      return `<div class="form-group full">
        <label class="form-label">${_esc(f)}</label>
        <textarea class="form-inp" data-field="${fieldAttr}" data-orig="${valueAttr}" rows="3">${_esc(val)}</textarea></div>`;
    }
    return `<div class="form-group">
      <label class="form-label">${_esc(f)}</label>
      <input class="form-inp" type="text" data-field="${fieldAttr}" data-orig="${valueAttr}" value="${valueAttr}"></div>`;
  }).join('');

  document.getElementById('crm-modal-fields').innerHTML = html;
  document.getElementById('crm-modal').style.display = 'flex';
}

function crmCloseModal(){
  document.getElementById('crm-modal').style.display = 'none';
}

/* ─── SAVE (create / update) ───────────────────────── */
async function crmSave(){
  const btn   = document.getElementById('crm-save-btn');
  const errEl = document.getElementById('crm-modal-err');
  btn.textContent = 'Guardando...';
  btn.disabled = true;
  errEl.textContent = '';

  const cfg = CRM_CFG[crmState.tab];
  const inputs = document.querySelectorAll('#crm-modal-fields [data-field]');
  const fields = {};
  // Mapa de campos: select normal → string plano con typecast:true, asText → texto plano
  const fieldMeta = {};
  (cfg.editable || []).forEach(({f, type, asText}) => { fieldMeta[f] = {type, asText}; });
  inputs.forEach(el => {
    const val  = el.value.trim();
    const orig = (el.dataset.orig || '').trim();
    const meta = fieldMeta[el.dataset.field] || {};

    // En registros nuevos no mandamos campos vacíos.
    // En edición, si el usuario borra un campo que antes tenía valor, mandamos null
    // para limpiar Airtable de verdad. Esto evita que "Asesor" se quede pegado.
    if(!val){
      if(!crmState.isNew && orig) fields[el.dataset.field] = null;
      return;
    }

    // Con typecast:true Airtable acepta string directo para singleSelect; evita 422 por mayúsculas
    fields[el.dataset.field] = val;
  });

  try {
    if(crmState.isNew){
      await atFetch(`${cfg.tableId}`, {
        method:'POST', body: JSON.stringify({fields, typecast:true})
      });
    } else {
      await atFetch(`${cfg.tableId}/${crmState.editId}`, {
        method:'PATCH', body: JSON.stringify({fields, typecast:true})
      });
    }
    crmCloseModal();
    showToast(crmState.isNew ? '✓ Registro creado' : '✓ Cambios guardados');
    await crmLoad(crmState.tab, true);
  } catch(e){
    errEl.textContent = 'Error al guardar: ' + e.message;
  } finally {
    btn.textContent = 'Guardar cambios';
    btn.disabled = false;
  }
}

/* ─── BUILD PANEL HTML ─────────────────────────────── */
function buildAirtablePanel(){
  const tabs = Object.entries(CRM_CFG).map(([id, cfg]) =>
    `<button class="at-tab${id==='compradores'?' active':''}" id="crm-tab-${id}" onclick="crmSwitchTab('${id}')">
      <span class="at-tab-dot ${cfg.dot}"></span>${cfg.label}
      <span class="tab-count" id="tab-count-${id}">—</span>
    </button>`).join('');

  return `<div class="panel" id="panel-airtable">
    <div class="airtable-layout">

      <!-- HEADER -->
      <div class="airtable-header">
        <div class="airtable-title-row">
          <div class="at-title">
            MI <em>CRM</em>
            <span class="at-title-sub">Base de datos</span>
          </div>
          <div class="at-right">
            <button class="at-btn" onclick="crmLoad(crmState.tab,true)" title="Recargar">
              <svg viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
              Recargar
            </button>
            <button class="at-btn primary" onclick="crmOpenNew()">
              + Nuevo
            </button>
          </div>
        </div>
        <div class="at-tabs">${tabs}</div>
      </div>

      <!-- CONTENIDO -->
      <div class="airtable-content">

        <!-- LOADING con skeleton -->
        <div id="crm-loading" style="display:flex;flex-direction:column;overflow:hidden">
          <div class="at-table-bar" style="opacity:.4">
            <div class="at-search-wrap"><span class="at-search-icon">⌕</span><span style="font-size:11px;color:var(--w30)">Cargando...</span></div>
            <span class="at-count">—</span>
          </div>
          <div class="at-table-wrap">
            <table class="at-table">
              <thead><tr>${[...Array(6)].map(()=>'<th><div class="crm-skeleton-cell" style="width:80px"></div></th>').join('')}</tr></thead>
              <tbody>${[...Array(8)].map(()=>`<tr class="crm-skeleton-row">${[...Array(6)].map((_,i)=>`<td><div class="crm-skeleton-cell" style="width:${[60,120,90,70,80,55][i]||80}px"></div></td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        </div>

        <!-- TABLA REAL -->
        <div id="crm-body" style="display:none;flex-direction:column;flex:1;overflow:hidden">
          <div class="at-table-bar">
            <div class="at-search-wrap">
              <span class="at-search-icon">⌕</span>
              <input class="at-search" id="crm-search" placeholder="Buscar registro..." oninput="crmFilter(this.value)">
            </div>
            <div class="at-divider"></div>
            <span class="at-count" id="crm-count">—</span>
          </div>
          <div class="at-table-wrap" id="crm-table-wrap"></div>
        </div>

        <!-- ERROR -->
        <div id="crm-error" style="display:none;padding:48px;text-align:center">
          <div style="font-size:28px;margin-bottom:12px;opacity:.3">⚠</div>
          <div style="color:var(--red);font-size:12px;line-height:1.7;max-width:360px;margin:0 auto" id="crm-error-msg"></div>
          <button class="at-btn" style="margin-top:20px" onclick="crmLoad(crmState.tab,true)">Reintentar</button>
        </div>

      </div>
    </div>
  </div>

  <!-- MODAL EDITAR / NUEVO -->
  <div id="crm-modal">
    <div class="crm-modal-box" style="animation:fadeUp .25s var(--ease)">
      <div class="crm-modal-head">
        <div>
          <div class="crm-modal-title" id="crm-modal-title">EDITAR <em>REGISTRO</em></div>
          <div style="font-size:9px;color:var(--w30);letter-spacing:2px;text-transform:uppercase;margin-top:6px" id="crm-modal-sub">—</div>
        </div>
        <button class="crm-modal-close" onclick="crmCloseModal()">✕</button>
      </div>
      <div class="crm-modal-grid" id="crm-modal-fields"></div>
      <div id="crm-modal-err" style="color:var(--red);font-size:11px;min-height:16px;margin-top:8px;text-align:center"></div>
      <div class="crm-modal-actions">
        <button class="btn btn-ghost" onclick="crmCloseModal()">Cancelar</button>
        <button class="btn btn-primary" id="crm-save-btn" onclick="crmSave()">Guardar cambios</button>
      </div>
    </div>
  </div>

  <div id="crm-ficha">
    <div class="crm-modal-box fk-box" style="animation:fadeUp .25s var(--ease)">
      <div class="crm-modal-head">
        <div>
          <div class="crm-modal-title">EXPEDIENTE <em>VIVO</em></div>
          <div style="font-size:9px;color:var(--w30);letter-spacing:2px;text-transform:uppercase;margin-top:6px">Ficha del comprador</div>
        </div>
        <button class="crm-modal-close" onclick="crmCloseFicha()">✕</button>
      </div>
      <div id="crm-ficha-body"></div>
      <div class="crm-modal-actions">
        <button class="btn btn-ghost" onclick="crmCloseFicha()">Cerrar</button>
        <button class="btn btn-cita" onclick="fichaAgendarCita()" title="Agendar visita desde este lead">📅 Agendar visita</button>
        <button class="btn btn-primary" onclick="fichaEditFromFicha()">Editar registro</button>
      </div>
    </div>
  </div>

  <!-- MODAL FICHA VENDEDOR -->
  <div id="crm-ficha-vendedor">
    <div class="fv-box">
      <div id="crm-fv-inner"></div>
      <div class="fv-actions">
        <button class="btn btn-ghost" onclick="vendedorClose()">Cerrar</button>
        <button class="btn btn-primary" onclick="vendedorEditFromFicha()">Editar registro</button>
      </div>
    </div>
  </div>

  <!-- MODAL EDITOR DE LANDING (Ficha de Propiedad) -->
  <div id="crm-landing">
    <div class="crm-modal-box le-box" style="animation:fadeUp .25s var(--ease)">
      <div class="crm-modal-head">
        <div>
          <div class="crm-modal-title">EDITOR DE <em>LANDING</em></div>
          <div style="font-size:9px;color:var(--w30);letter-spacing:2px;text-transform:uppercase;margin-top:6px">Ficha de la propiedad</div>
        </div>
        <button class="crm-modal-close" onclick="landClose()">✕</button>
      </div>
      <div id="crm-landing-body"></div>
      <div id="crm-landing-err" style="color:var(--red);font-size:11px;min-height:16px;margin-top:8px;text-align:center"></div>
      <div class="crm-modal-actions">
        <button class="btn btn-ghost" onclick="landClose()">Cerrar</button>
        <button class="btn btn-ghost" id="crm-landing-view">◎ Ver landing</button>
        <button class="btn btn-primary" id="crm-landing-save" onclick="landSave()">Guardar cambios</button>
      </div>
    </div>
  </div>

  <!-- MODAL FICHA DE CITA -->
  <div id="crm-cita">
    <div class="crm-modal-box cita-box" style="animation:fadeUp .25s var(--ease)">
      <div class="crm-modal-head">
        <div>
          <div class="crm-modal-title">FICHA DE <em>CITA</em></div>
          <div style="font-size:9px;color:var(--w30);letter-spacing:2px;text-transform:uppercase;margin-top:6px">Agenda · confirmación · link</div>
        </div>
        <button class="crm-modal-close" onclick="citaCloseAndClear()">✕</button>
      </div>
      <div id="crm-cita-body"></div>
      <div id="crm-cita-err" style="color:var(--red);font-size:11px;min-height:16px;margin-top:8px;text-align:center"></div>
      <div class="crm-modal-actions">
        <button class="btn btn-ghost" onclick="citaCloseAndClear()">Cancelar</button>
        <button class="btn btn-ghost" id="crm-cita-ver" style="display:none">↗ Ver cita</button>
        <button class="btn btn-primary" id="crm-cita-save" onclick="citaSave()">Guardar cambios</button>
      </div>
    </div>
  </div>`;
}

/* ─── AUTO-CARGA al activar el panel ───────────────── */
let _crmLoaded = false;
function onAirtablePanelActivate(){
  const loading = document.getElementById('crm-loading');
  if(!loading) return;
  // Primera vez: cargar. Siguientes veces: solo recargar si no hay datos aún.
  if(!_crmLoaded){
    _crmLoaded = true;
    crmLoad('compradores', true);
  } else {
    // Recargar si la tabla está vacía (por ejemplo al volver de otro panel)
    const body = document.getElementById('crm-body');
    if(body && body.style.display === 'none') crmLoad(crmState.tab, true);
  }
}

/* ═══════════════════════════════════════════════════
   PANEL IFRAME GENÉRICO
═══════════════════════════════════════════════════ */
function buildIframePanel(id, tool){
  return `<div class="panel" id="panel-${id}">
    <div class="iframe-toolbar">
      <div class="it-left">
        <div class="it-dots">
          <div class="it-dot r"></div>
          <div class="it-dot y"></div>
          <div class="it-dot g"></div>
        </div>
        <span class="it-name">${tool.name}</span>
        <span class="it-url" id="it-url-${id}">${tool.url}</span>
      </div>
      <div class="it-actions">
        <button class="it-btn" onclick="reloadIframe('${id}')">↻ Recargar</button>
        <button class="it-btn primary" onclick="openExternal('${id}')">↗ Nueva pestaña</button>
      </div>
    </div>
    <div class="iframe-wrap" id="iframe-wrap-${id}">
      <div class="iframe-placeholder" id="placeholder-${id}">
        <div class="ip-icon">⬡</div>
        <div class="ip-title">${tool.name.toUpperCase()}</div>
        <div class="ip-sub">Esta herramienta vive en su propio archivo. Presiona el botón para cargarla.</div>
        <button class="ip-btn" onclick="loadIframe('${id}','${tool.url}')">Cargar herramienta →</button>
      </div>
    </div>
  </div>`;
}

function loadIframe(id, url){
  const wrap = document.getElementById('iframe-wrap-'+id);
  const placeholder = document.getElementById('placeholder-'+id);
  if(!wrap) return;
  
  // Construir URL con parámetros del perfil si existe SESSION
  let fullUrl = url;
  if(SESSION){
    const params = new URLSearchParams({
      asesor:   SESSION.slug || SESSION.user,            // las landings resuelven por SLUG desde Airtable
      nombre:   SESSION.nombre || '',
      whatsapp: SESSION.whatsapp || '527779855687',
      firma:    (SESSION.nombre||'') + ' · ' + (SESSION.empresa||''),
      pixel:    SESSION.pixel || '',
      webhook:  id === 'vendedores'
        ? 'https://hook.us2.make.com/vx9xx6qdg2dlldvdgfmvwxi54ibwwmcz'
        : 'https://hook.us2.make.com/qqsrjs8gtm0sdn7iba8hxmyfnc3m9y8j'
    });
    fullUrl = url + '?' + params.toString();
  }

  document.getElementById('it-url-'+id).textContent = fullUrl;

  if(placeholder) placeholder.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'iframe-'+id;
  iframe.src = fullUrl;
  iframe.allow = 'clipboard-write';
  wrap.appendChild(iframe);
}

function reloadIframe(id){
  const iframe = document.getElementById('iframe-'+id);
  if(iframe){ iframe.src = iframe.src; showToast('Recargando...'); }
  else { showToast('Carga la herramienta primero.'); }
}

function openExternal(id){
  const iframe = document.getElementById('iframe-'+id);
  const tool = TOOLS[id];
  if(iframe) window.open(iframe.src,'_blank');
  else if(tool) window.open(tool.url,'_blank');
}

/* ═══════════════════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════════════════ */
const LABELS = {
  hoy:'Inicio', perfil:'Mi Perfil', airtable:'Mi CRM', sala:'Sala de Mensajes',
  compradores:'Landing Compradores', vendedores:'Landing Vendedores',
  citas:'Panel de Citas', progreso:'Portal Progreso',
  opciones:'Opciones de Compra', reportes:'Reportes'
};

function goTo(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.sb-btn').forEach(b=>b.classList.remove('active'));

  const panel = document.getElementById('panel-'+id);
  if(panel) panel.classList.add('active');

  const navBtn = document.getElementById('nav-'+id);
  if(navBtn) navBtn.classList.add('active');

  document.getElementById('tb-label').textContent = LABELS[id] || id;
  if(id === 'airtable') setTimeout(onAirtablePanelActivate, 60);
  if(id === 'perfil') setTimeout(()=>perfilLoad(false), 60);
  if(id === 'hoy') setTimeout(()=>loadHoyData(false), 60);
}

/* ═══════════════════════════════════════════════════
   RELOJ
═══════════════════════════════════════════════════ */
function updateClock(){
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('tb-clock').textContent = h+':'+m+':'+s;
}
setInterval(updateClock, 1000);

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
let toastTimeout;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>t.classList.remove('show'), 2400);
}

/* ═══════════════════════════════════════════════════
   ENTER EN LOGIN
═══════════════════════════════════════════════════ */
document.addEventListener('keydown', e=>{
  if(e.key==='Enter' && !document.getElementById('screen-login').classList.contains('hidden')){
    doLogin();
  }
});

/* Inicio en modo prueba */
if(TEST_MODE_ADMIN_TOTAL){
  startTestAdminMode();
} else {
  document.getElementById('l-user').value = 'asesor';
  document.getElementById('l-pass').value = 'neri2024';
  document.getElementById('l-rol').value  = 'asesor';
}
