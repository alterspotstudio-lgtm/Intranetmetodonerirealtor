
/* ═══════════════════════════════════════════════════
   ESTADO
═══════════════════════════════════════════════════ */
let SESSION = null;

/* ═══════════════════════════════════════════════════
   USUARIOS / CREDENCIALES (demo)
═══════════════════════════════════════════════════ */
const USERS = {
  'enrique':  { pass:'neri2024', nombre:'Enrique Neri',  rol:'asesor',   slug:'enrique', whatsapp:'527779855687', empresa:'Century 21 Haus · Cuernavaca', pixel:'1308747473990434' },
  'asesor':   { pass:'neri2024', nombre:'Enrique Neri',  rol:'asesor',   slug:'enrique', whatsapp:'527779855687', empresa:'Century 21 Haus · Cuernavaca', pixel:'1308747473990434' },
  'gerente':  { pass:'neri2024', nombre:'Ana Gutiérrez', rol:'gerente',  slug:'ana',     whatsapp:'527779855687', empresa:'Método NERI', pixel:'' },
  'director': { pass:'neri2024', nombre:'Carlos Neri',   rol:'director', slug:'carlos',  whatsapp:'527779855687', empresa:'Método NERI', pixel:'' },
  'admin':    { pass:'neri2024', nombre:'Administrador Método NERI', rol:'admin',    slug:'admin',   whatsapp:'527779855687', empresa:'Método NERI', pixel:'' },
};

/* ═══════════════════════════════════════════════════
   MENÚ POR ROL
═══════════════════════════════════════════════════ */
const NAV_ROL = {
  asesor: [
    { section:'Principal' },
    { id:'hoy',         label:'Hoy',               icon:'⬡' },
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
    { id:'administracion', label:'Administración Base', icon:'▣', highlight:true },
    { id:'airtable',    label:'Mi CRM',       icon:'◈' },
    { section:'Herramientas' },
    { id:'sala',        label:'Sala de Mensajes',   icon:'⚡' },
    { id:'compradores', label:'Landing Compradores',icon:'⊕' },
    { id:'vendedores',  label:'Landing Vendedores', icon:'🏠' },
    { id:'citas',       label:'Panel de Citas',     icon:'📋' },
    { id:'progreso',    label:'Portal Progreso',     icon:'◎' },
    { id:'opciones',    label:'Opciones de Compra', icon:'⊞' },
  ],
};

/* ═══════════════════════════════════════════════════
   TOOLS CONFIG (cada herramienta en su propio archivo)
═══════════════════════════════════════════════════ */
const TOOLS = {
  sala:        { name:'Sala de Mensajes',    url:'https://mensajesmaestros.vercel.app',                  ext:true },
  compradores: { name:'Landing Compradores', url:'https://captacion.vercel.app',             ext:true },
  vendedores:  { name:'Landing Vendedores',  url:'https://ahuatlan32m.vercel.app',      ext:true },
  citas:       { name:'Panel de Citas',      url:'https://citas-vert.vercel.app',                    ext:true },
  progreso:    { name:'Portal Progreso',      url:'https://captacion.vercel.app',        ext:true },
  opciones:    { name:'Opciones de Compra',  url:'https://opcionesdecompra.vercel.app',     ext:true },
  reportes:    { name:'Reportes',            url:'Reportes.html',                        ext:true },
};

/* ═══════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════ */
function quickLogin(rol){
  document.getElementById('l-user').value = rol;
  document.getElementById('l-pass').value = 'neri2024';
  document.getElementById('l-rol').value = rol;
}

function doLogin(){
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
    if(f['Teléfono WhatsApp']) SESSION.whatsapp = String(f['Teléfono WhatsApp']).replace(/\D/g,'');
    if(f['Pixel ID Meta'])     SESSION.pixel    = f['Pixel ID Meta'];
    const ciudad = f['Ciudad'] || f['Ciudad (texto viejo)'] || '';
    const puesto = f['Puesto'] || f['Puesto (texto viejo)'] || '';
    if(ciudad || puesto) SESSION.empresa = [puesto, ciudad].filter(Boolean).join(' · ') || SESSION.empresa;
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

  // Panel ADMINISTRACIÓN BASE
  ca.insertAdjacentHTML('beforeend', buildAdministracionPanel());

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
    administracion: 'Cuentas, usuarios, permisos y activación. No es CRM.',
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
   ADMINISTRACIÓN BASE — Cuentas activas por tipo
   Modo prueba: datos locales en el navegador. No toca CRM ni leads.
═══════════════════════════════════════════════════ */
const ADMIN_STORAGE_KEY = 'neri_admin_base_v6_cuentas_activas';
let adminState = { tab:'cuentas', cuentaTipoTab:'Inmobiliaria', selectedCuentaId:null, selectedUsuarioId:null, data:null };

const ADMIN_TIPOS_CUENTA = ['Inmobiliaria','Asesor independiente','Grupo de asesores sin inmobiliaria'];
const ADMIN_LIMITES_INMOBILIARIA = ['10','15','20','30'];
const ADMIN_PERMISSION_CATALOG = [
  { id:'perfil_publico', title:'Perfil público', desc:'Editar nombre, WhatsApp, email, subir foto, frase, ciudad y Pixel ID Meta.' },
  { id:'copiar_link', title:'Copiar Link Captación', desc:'Ver y copiar el link generado por el slug automático.' },
  { id:'landing_compradores', title:'Landing compradores', desc:'Usar herramientas comerciales de compradores.' },
  { id:'landing_vendedores', title:'Landing vendedores', desc:'Usar diagnóstico de captación de propietarios.' },
  { id:'sala_mensajes', title:'Sala de mensajes', desc:'Consultar biblioteca de mensajes y guías.' },
  { id:'panel_citas', title:'Panel de citas', desc:'Usar módulo operativo de citas.' },
  { id:'reportes_basicos', title:'Reportes básicos', desc:'Ver métricas permitidas por administración.' },
  { id:'branding_cuenta', title:'Branding de cuenta', desc:'Usar logo y marca de inmobiliaria o grupo.' },
];

const ADMIN_DEFAULT_PERMS_INDEPENDIENTE = ['perfil_publico','copiar_link','landing_compradores','landing_vendedores','sala_mensajes','panel_citas','reportes_basicos'];
const ADMIN_DEFAULT_PERMS_ORG = ['perfil_publico','copiar_link','landing_compradores','landing_vendedores','sala_mensajes','panel_citas','reportes_basicos','branding_cuenta'];

function adminPuestoOptions(tipo){
  if(tipo === 'Inmobiliaria') return ['Director','Gerente','Asesor'];
  if(tipo === 'Grupo de asesores sin inmobiliaria') return ['Líder de grupo','Asesor'];
  return ['Asesor independiente'];
}
function adminDefaultPuesto(tipo){
  if(tipo === 'Inmobiliaria') return 'Asesor';
  if(tipo === 'Grupo de asesores sin inmobiliaria') return 'Asesor';
  return 'Asesor independiente';
}
function adminDefaultLimit(tipo){
  if(tipo === 'Inmobiliaria') return 10;
  if(tipo === 'Grupo de asesores sin inmobiliaria') return 5;
  return 1;
}
function adminCuentaMaxUsers(c){
  if(!c) return 0;
  if(c.tipo === 'Inmobiliaria'){
    const n = Number(c.limiteAsesores || 10);
    return [10,15,20,30].includes(n) ? n : 10;
  }
  if(c.tipo === 'Grupo de asesores sin inmobiliaria') return 5;
  return 1;
}
function adminCuentaUsers(cuentaId){ return adminState.data.usuarios.filter(u=>u.cuentaId===cuentaId); }
function adminCuentaUsage(c){ return adminCuentaUsers(c.id).length; }
function adminCanAddUser(c){ return adminCuentaUsage(c) < adminCuentaMaxUsers(c); }
function adminIsCuentaIndependiente(c){ return c?.tipo === 'Asesor independiente'; }
function adminIsCuentaOrganizacion(c){ return c && c.tipo !== 'Asesor independiente'; }
function adminTipoCorto(tipo){
  if(tipo === 'Asesor independiente') return 'Independiente';
  if(tipo === 'Grupo de asesores sin inmobiliaria') return 'Grupo sin inmobiliaria';
  return 'Inmobiliaria';
}
function adminSeedData(){
  return {
    cuentas:[
      { id:'cta-c21-haus', nombre:'Century 21 Haus · Cuernavaca', tipo:'Inmobiliaria', estado:'Pendiente', ciudad:'Cuernavaca', responsable:'Dirección comercial', logo:'', limiteAsesores:10, notas:'Ejemplo de cuenta inmobiliaria. Administración controla estado, cupo, permisos base y branding.' },
      { id:'cta-diana-independiente', nombre:'Diana captación inteligente', tipo:'Asesor independiente', estado:'Activo', ciudad:'Cuernavaca', responsable:'Diana Salgado', logo:'CASITA_METODO_NERI', limiteAsesores:1, notas:'Ejemplo de asesor independiente. No usa logo inmobiliaria; usa casita automática Método NERI.' },
      { id:'cta-metodo-neri', nombre:'Método NERI · Prueba Admin', tipo:'Grupo de asesores sin inmobiliaria', estado:'Activo', ciudad:'Cuernavaca', responsable:'Enrique Neri', logo:'', limiteAsesores:5, notas:'Cuenta grupal chica. Máximo 5 asesores/subcuentas.' },
    ],
    usuarios:[
      {
        id:'usr-c21-director', cuentaId:'cta-c21-haus', nombre:'Director pendiente', whatsapp:'', email:'', foto:'', frase:'', ciudad:'Cuernavaca', pixel:'',
        tipo:'Inmobiliaria', estado:'Pendiente', puesto:'Director', slugSugerido:'', slugOficial:'', permisos:[...ADMIN_DEFAULT_PERMS_ORG]
      },
      {
        id:'usr-diana-salgado', cuentaId:'cta-diana-independiente', nombre:'Diana Salgado', whatsapp:'', email:'', foto:'', frase:'Te ayudo a preparar tu venta con orden.', ciudad:'Cuernavaca', pixel:'',
        tipo:'Asesor independiente', estado:'Activo', puesto:'Asesor independiente', slugSugerido:'diana-salgado', slugOficial:'diana-salgado', permisos:[...ADMIN_DEFAULT_PERMS_INDEPENDIENTE]
      },
      {
        id:'usr-enrique-neri', cuentaId:'cta-metodo-neri', nombre:'Enrique Neri', whatsapp:'527779855687', email:'', foto:'', frase:'El lead es consecuencia de una gestión de calidad.', ciudad:'Cuernavaca', pixel:'1308747473990434',
        tipo:'Grupo de asesores sin inmobiliaria', estado:'Activo', puesto:'Líder de grupo', slugSugerido:'enrique-neri', slugOficial:'enrique-neri', permisos:[...ADMIN_DEFAULT_PERMS_ORG]
      }
    ]
  };
}

function adminLoad(){
  try{
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    adminState.data = raw ? JSON.parse(raw) : adminSeedData();
  }catch(e){ adminState.data = adminSeedData(); }
  adminNormalize();
  adminSave(false);
}
function adminSave(show=true){
  adminApplyBusinessRules();
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminState.data));
  if(show) showToast('✓ Administración Base guardada');
}
function adminNormalize(){
  const d = adminState.data || adminSeedData();
  d.cuentas = Array.isArray(d.cuentas) ? d.cuentas : [];
  d.usuarios = Array.isArray(d.usuarios) ? d.usuarios : [];
  d.cuentas.forEach(c=>{
    if(!c.id) c.id = adminId('cta');
    if(!c.estado) c.estado='Pendiente';
    if(!ADMIN_TIPOS_CUENTA.includes(c.tipo)) c.tipo='Asesor independiente';
    if(c.tipo === 'Asesor independiente') c.logo = 'CASITA_METODO_NERI';
    c.limiteAsesores = adminCuentaMaxUsers(c) || adminDefaultLimit(c.tipo);
  });
  d.usuarios.forEach(u=>{
    if(!u.id) u.id = adminId('usr');
    if(!Array.isArray(u.permisos)) u.permisos=[];
    if(!u.estado) u.estado='Pendiente';
    if(!u.tipo) u.tipo='Asesor independiente';
    if(u.slugOficial) u.slugOficial = adminUniqueSlug(adminSlug(u.slugOficial), u.id);
    if(u.slugSugerido) u.slugSugerido = adminSlug(u.slugSugerido);
  });
  adminState.data = d;
  adminApplyBusinessRules();
  if(!adminState.selectedCuentaId && d.cuentas[0]) adminState.selectedCuentaId = d.cuentas[0].id;
  const selectedCuenta = adminCuenta(adminState.selectedCuentaId);
  if(selectedCuenta) adminState.cuentaTipoTab = selectedCuenta.tipo;
  if(!adminState.selectedUsuarioId && d.usuarios[0]) adminState.selectedUsuarioId = d.usuarios[0].id;
}
function adminApplyBusinessRules(){
  const d = adminState.data; if(!d) return;
  d.cuentas.forEach(c=>{
    if(c.tipo === 'Asesor independiente'){
      c.logo = 'CASITA_METODO_NERI';
      c.limiteAsesores = 1;
      adminEnsureUserForCuenta(c, false);
    }else if(c.tipo === 'Grupo de asesores sin inmobiliaria'){
      c.limiteAsesores = 5;
    }else{
      c.limiteAsesores = adminCuentaMaxUsers(c);
    }
  });
  d.usuarios.forEach(u=>{
    const c = adminCuenta(u.cuentaId);
    if(c){
      u.tipo = c.tipo;
      u.estado = c.estado || 'Pendiente';
      if(c.tipo === 'Asesor independiente'){
        u.puesto = 'Asesor independiente';
        u.permisos = Array.isArray(u.permisos) && u.permisos.length ? u.permisos : [...ADMIN_DEFAULT_PERMS_INDEPENDIENTE];
        u.permisos = u.permisos.filter(p=>p !== 'branding_cuenta');
      }else{
        const allowed = adminPuestoOptions(c.tipo);
        if(!allowed.includes(u.puesto)) u.puesto = adminDefaultPuesto(c.tipo);
        u.permisos = Array.isArray(u.permisos) && u.permisos.length ? u.permisos : [...ADMIN_DEFAULT_PERMS_ORG];
        if(!u.permisos.includes('branding_cuenta')) u.permisos.push('branding_cuenta');
      }
    }
    if(u.slugOficial){
      u.slugOficial = adminUniqueSlug(adminSlug(u.slugOficial), u.id);
      u.slugSugerido = u.slugOficial;
    }
  });
}
function adminId(prefix){ return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7); }
function adminSlug(txt){
  return String(txt||'').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/ñ/g,'n').replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'').slice(0,42) || 'asesor';
}
function adminUniqueSlug(base, userId){
  const d = adminState.data;
  const clean = adminSlug(base || 'asesor');
  if(!d || !Array.isArray(d.usuarios)) return clean;
  let candidate = clean, n = 2;
  while(d.usuarios.some(u=>u.id !== userId && adminSlug(u.slugOficial || u.slugSugerido) === candidate)){
    candidate = `${clean}-${n++}`;
  }
  return candidate;
}
function adminEsc(v){ return _esc(String(v ?? '')); }
function adminBadge(estado){
  const e = String(estado||'Pendiente');
  const cls = e.toLowerCase().replace(/\s+/g,'-');
  return `<span class="admin-badge ab-${adminEsc(cls)}">${adminEsc(e)}</span>`;
}
function adminCuenta(id){ return adminState.data.cuentas.find(c=>c.id===id) || null; }
function adminUsuario(id){ return adminState.data.usuarios.find(u=>u.id===id) || null; }
function adminCuentaName(id){ return adminCuenta(id)?.nombre || 'Sin cuenta asignada'; }
function adminLink(u){ return u && u.slugOficial ? `https://captacion.vercel.app/?asesor=${encodeURIComponent(u.slugOficial)}` : 'Pendiente: se genera al guardar nombre'; }
function adminLogoLabel(c){
  if(c?.tipo === 'Asesor independiente') return '⌂ Casita Método NERI automática';
  return c?.logo ? 'Logo cargado desde administración' : 'Sin logo cargado';
}
function adminDefaultPermsForType(tipo){ return tipo === 'Asesor independiente' ? [...ADMIN_DEFAULT_PERMS_INDEPENDIENTE] : [...ADMIN_DEFAULT_PERMS_ORG]; }
function adminEnsureUserForCuenta(c, selectUser=true){
  if(!c) return null;
  let u = adminState.data.usuarios.find(x=>x.cuentaId === c.id);
  if(!u){
    const nombreBase = c.responsable || c.nombre || 'Nuevo asesor';
    const slug = adminUniqueSlug(adminSlug(nombreBase), null);
    u = {
      id:adminId('usr'), cuentaId:c.id, nombre:nombreBase, whatsapp:'', email:'', foto:'', frase:'', ciudad:c.ciudad||'', pixel:'',
      tipo:c.tipo, estado:c.estado, puesto:c.tipo === 'Asesor independiente' ? 'Asesor independiente' : adminDefaultPuesto(c.tipo),
      slugSugerido:slug, slugOficial:slug, permisos:adminDefaultPermsForType(c.tipo)
    };
    adminState.data.usuarios.unshift(u);
  }else{
    u.tipo = c.tipo;
    u.estado = c.estado;
    if(!u.ciudad) u.ciudad = c.ciudad || '';
    if(!u.slugOficial){
      const slug = adminUniqueSlug(adminSlug(u.nombre || c.responsable || c.nombre), u.id);
      u.slugSugerido = slug; u.slugOficial = slug;
    }
    if(c.tipo === 'Asesor independiente') u.permisos = (u.permisos||adminDefaultPermsForType(c.tipo)).filter(p=>p !== 'branding_cuenta');
  }
  if(selectUser) adminState.selectedUsuarioId = u.id;
  return u;
}

function buildAdministracionPanel(){
  return `<div class="panel" id="panel-administracion">
    <div class="admin-base-body">
      <div class="ph-head">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <div class="ph-eyebrow">Administración Método NERI</div>
            <div class="ph-title">CUENTAS <em>ACTIVAS</em></div>
            <div class="admin-base-note">Administración crea y controla cuentas. Los asesores completan su perfil público. La activación vive en el estado de la cuenta. Este panel no muestra leads, clientes, propiedades, citas, mensajes ni expedientes.</div>
          </div>
          <div class="admin-mode-pill">● Modo prueba abierto</div>
        </div>
      </div>

      <div class="admin-flow" id="admin-flow">
        <div class="admin-flow-step active" onclick="adminSwitchTab('cuentas')"><div class="af-k">Paso 01</div><div class="af-v">Cuentas activas</div><div class="af-d">Inmobiliaria, independiente o grupo sin inmobiliaria.</div><div class="af-num">01</div></div>
        <div class="admin-flow-step" onclick="adminSwitchTab('usuarios')"><div class="af-k">Paso 02</div><div class="af-v">Usuarios / subcuentas</div><div class="af-d">El usuario llena su perfil. Administración controla cuenta, estado, puesto, cupo y permisos.</div><div class="af-num">02</div></div>
        <div class="admin-flow-step" onclick="adminSwitchTab('permisos')"><div class="af-k">Paso 03</div><div class="af-v">Permisos</div><div class="af-d">Permisos base preparados para cuando exista login real.</div><div class="af-num">03</div></div>
      </div>

      <div class="admin-mini-kpis" id="admin-kpis"></div>

      <div class="admin-tabs">
        <button class="admin-tab active" id="admin-tab-cuentas" onclick="adminSwitchTab('cuentas')">Cuentas activas</button>
        <button class="admin-tab" id="admin-tab-usuarios" onclick="adminSwitchTab('usuarios')">Usuarios / Subcuentas</button>
        <button class="admin-tab" id="admin-tab-permisos" onclick="adminSwitchTab('permisos')">Permisos</button>
      </div>

      <div id="admin-content"></div>
    </div>
  </div>`;
}

function onAdministracionPanelActivate(){ adminLoad(); adminRender(); }
function adminSwitchTab(tab){ adminState.tab = tab; adminRender(); }
function adminSwitchCuentaTipo(tipo){
  adminState.cuentaTipoTab = tipo;
  const first = adminState.data.cuentas.find(c=>c.tipo===tipo);
  adminState.selectedCuentaId = first?.id || null;
  if(first){
    const firstUser = adminCuentaUsers(first.id)[0];
    if(firstUser) adminState.selectedUsuarioId = firstUser.id;
  }
  adminRender();
}
function adminRender(){
  if(!adminState.data) adminLoad();
  adminApplyBusinessRules();
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('admin-tab-'+adminState.tab)?.classList.add('active');
  if(!['cuentas','usuarios','permisos'].includes(adminState.tab)) adminState.tab='cuentas';
  const flowMap = ['cuentas','usuarios','permisos'];
  document.querySelectorAll('.admin-flow-step').forEach((el,i)=>el.classList.toggle('active', flowMap[i]===adminState.tab));
  adminRenderKpis();
  const el = document.getElementById('admin-content');
  if(!el) return;
  if(adminState.tab==='cuentas') el.innerHTML = adminRenderCuentas();
  if(adminState.tab==='usuarios') el.innerHTML = adminRenderUsuarios();
  if(adminState.tab==='permisos') el.innerHTML = adminRenderPermisos();
}
function adminRenderKpis(){
  const d = adminState.data;
  const el = document.getElementById('admin-kpis'); if(!el) return;
  const activos = d.cuentas.filter(c=>c.estado==='Activo').length;
  const inmobiliarias = d.cuentas.filter(c=>c.tipo==='Inmobiliaria').length;
  const grupos = d.cuentas.filter(c=>c.tipo==='Grupo de asesores sin inmobiliaria').length;
  const cupos = d.cuentas.reduce((sum,c)=>sum+adminCuentaMaxUsers(c),0);
  el.innerHTML = `
    <div class="admin-mini-kpi"><div class="admin-mini-num">${d.cuentas.length}</div><div class="admin-mini-lbl">Cuentas</div></div>
    <div class="admin-mini-kpi"><div class="admin-mini-num">${inmobiliarias}</div><div class="admin-mini-lbl">Inmobiliarias</div></div>
    <div class="admin-mini-kpi"><div class="admin-mini-num">${grupos}</div><div class="admin-mini-lbl">Grupos</div></div>
    <div class="admin-mini-kpi"><div class="admin-mini-num">${cupos}</div><div class="admin-mini-lbl">Cupos autorizados</div></div>
    <div class="admin-mini-kpi"><div class="admin-mini-num">${activos}</div><div class="admin-mini-lbl">Cuentas activas</div></div>`;
}
function adminTipoTabs(){
  return `<div class="admin-tabs" style="margin-top:0;margin-bottom:18px">
    ${ADMIN_TIPOS_CUENTA.map(tipo=>`<button class="admin-tab ${adminState.cuentaTipoTab===tipo?'active':''}" onclick="adminSwitchCuentaTipo('${adminEsc(tipo)}')">${adminEsc(adminTipoCorto(tipo))}</button>`).join('')}
  </div>`;
}
function adminRenderCuentas(){
  const d=adminState.data;
  if(!ADMIN_TIPOS_CUENTA.includes(adminState.cuentaTipoTab)) adminState.cuentaTipoTab='Inmobiliaria';
  const cuentasFiltradas = d.cuentas.filter(c=>c.tipo===adminState.cuentaTipoTab);
  let selected = adminCuenta(adminState.selectedCuentaId);
  if(!selected || selected.tipo !== adminState.cuentaTipoTab){ selected = cuentasFiltradas[0] || null; }
  if(selected) adminState.selectedCuentaId = selected.id;
  const list = cuentasFiltradas.map(c=>`
    <div class="admin-row ${c.id===adminState.selectedCuentaId?'active':''}" onclick="adminSelectCuenta('${c.id}')">
      <div class="ar-top"><div><div class="ar-name">${adminEsc(c.nombre)}</div><div class="ar-meta">${adminEsc(c.tipo)} · ${adminEsc(c.ciudad||'Sin ciudad')}</div></div>${adminBadge(c.estado)}</div>
      <div class="ar-meta">Responsable: ${adminEsc(c.responsable||'Sin responsable')}</div>
      <div class="ar-link">Subcuentas: ${adminCuentaUsage(c)} / ${adminCuentaMaxUsers(c)} · ${adminEsc(adminLogoLabel(c))}</div>
    </div>`).join('') || `<div class="admin-empty"><div class="big">▣</div>No hay cuentas de este tipo todavía</div>`;
  const form = selected ? adminCuentaForm(selected) : `<div class="admin-empty"><div class="big">▣</div>Crea una cuenta para iniciar este tipo.</div>`;
  return `${adminTipoTabs()}<div class="admin-grid">
    <div class="admin-card"><div class="admin-card-head"><div><div class="admin-card-title">CUENTAS <em>ACTIVAS</em></div><div class="admin-card-sub">${adminEsc(adminTipoCorto(adminState.cuentaTipoTab))}</div></div><button class="btn btn-primary" onclick="adminNewCuenta()">+ ${adminEsc(adminTipoCorto(adminState.cuentaTipoTab))}</button></div><div class="admin-card-body"><div class="admin-list">${list}</div></div></div>
    <div class="admin-card"><div class="admin-card-head"><div><div class="admin-card-title">CONFIGURACIÓN DE <em>CUENTA</em></div><div class="admin-card-sub">Estado, cupo, branding y subcuentas</div></div></div><div class="admin-card-body">${form}</div></div>
  </div>`;
}
function adminCuentaLogoBlock(c){
  if(c.tipo === 'Asesor independiente'){
    return `<div class="form-group full" id="cuenta-logo-wrap"><div class="admin-conditional-note"><b>Identidad visual automática:</b> Asesor independiente no carga logo inmobiliaria. Se usa la casita Método NERI en automático.</div></div>`;
  }
  const label = c.tipo === 'Inmobiliaria' ? 'Logo inmobiliaria' : 'Logo de grupo / cuenta';
  return `<div id="cuenta-logo-wrap" class="form-group full">${adminUploadField(label,'cuenta-logo',c.logo,'Sube el logo desde tu computadora. No se pega URL. Este logo se aplicará como branding de la cuenta.')}</div>`;
}
function adminCuentaLimitBlock(c){
  if(c.tipo === 'Inmobiliaria') return adminSelect('Cupo autorizado de subcuentas','cuenta-limite',String(adminCuentaMaxUsers(c)),ADMIN_LIMITES_INMOBILIARIA);
  if(c.tipo === 'Grupo de asesores sin inmobiliaria') return `<div class="form-group"><label>Cupo autorizado</label><input class="form-inp" id="cuenta-limite" value="5" disabled><small>Grupo sin inmobiliaria: máximo 5 asesores.</small></div>`;
  return `<div class="form-group"><label>Cupo autorizado</label><input class="form-inp" id="cuenta-limite" value="1" disabled><small>Asesor independiente: una cuenta, un perfil.</small></div>`;
}
function adminCuentaHelp(c){
  if(c.tipo === 'Asesor independiente') return 'Cuenta individual. Administración define estado y el sistema prepara un solo perfil público. No aplica logo inmobiliaria.';
  if(c.tipo === 'Inmobiliaria') return 'Cuenta madre de inmobiliaria. Administración define estado, cupo 10/15/20/30, logo, permisos base y roles: Director, Gerente y Asesor. Los asesores se registran como subcuentas hasta llegar al límite autorizado.';
  return 'Grupo de asesores sin inmobiliaria. Funciona como cuenta grupal chica: máximo 5 asesores/subcuentas, sin lenguaje de inmobiliaria.';
}
function adminCuentaForm(c){
  const overLimit = adminCuentaUsage(c) > adminCuentaMaxUsers(c);
  return `<div class="admin-help">${adminEsc(adminCuentaHelp(c))}</div>
  ${overLimit ? `<div class="admin-conditional-note"><b>Atención:</b> esta cuenta tiene más subcuentas registradas que el cupo actual. Sube el cupo o elimina subcuentas antes de activar nuevas.</div>` : ''}
  <div class="admin-form-grid">
    ${adminField('Nombre de cuenta','cuenta-nombre',c.nombre)}
    ${adminSelect('Tipo de cuenta','cuenta-tipo',c.tipo,ADMIN_TIPOS_CUENTA,'onchange="adminHandleCuentaTipoUi(this.value)"')}
    ${adminSelect('Estado / Activación de cuenta','cuenta-estado',c.estado,['Pendiente','Activo','Inactivo'])}
    ${adminCuentaLimitBlock(c)}
    ${adminField('Ciudad','cuenta-ciudad',c.ciudad)}
    ${adminField('Responsable administrativo','cuenta-responsable',c.responsable)}
    ${adminCuentaLogoBlock(c)}
    ${adminArea('Notas administrativas','cuenta-notas',c.notas,'full')}
  </div>
  ${adminCuentaUsersBlock(c)}
  <div class="admin-actions"><button class="btn btn-ghost" onclick="adminDeleteCuenta()">Eliminar cuenta</button><button class="btn btn-primary" onclick="adminSaveCuenta()">Guardar cuenta</button></div>`;
}
function adminCuentaUsersBlock(c){
  const users = adminCuentaUsers(c.id);
  const max = adminCuentaMaxUsers(c);
  const canAdd = adminCanAddUser(c);
  const rows = users.map(u=>`<div class="admin-row" onclick="adminGoUsuario('${u.id}')"><div class="ar-top"><div><div class="ar-name">${adminEsc(u.nombre||'Perfil pendiente')}</div><div class="ar-meta">${adminEsc(u.puesto)} · ${adminEsc(adminLink(u))}</div></div>${adminBadge(u.estado)}</div></div>`).join('') || `<div class="admin-empty"><div class="big">◎</div>Sin subcuentas todavía</div>`;
  let actions = '';
  if(c.tipo === 'Inmobiliaria'){
    actions = `<button class="btn btn-ghost" onclick="adminAddUserToCuenta('${c.id}','Director')" ${!canAdd?'disabled':''}>+ Director</button><button class="btn btn-ghost" onclick="adminAddUserToCuenta('${c.id}','Gerente')" ${!canAdd?'disabled':''}>+ Gerente</button><button class="btn btn-primary" onclick="adminAddUserToCuenta('${c.id}','Asesor')" ${!canAdd?'disabled':''}>+ Simular registro de asesor</button>`;
  }else if(c.tipo === 'Grupo de asesores sin inmobiliaria'){
    actions = `<button class="btn btn-ghost" onclick="adminAddUserToCuenta('${c.id}','Líder de grupo')" ${!canAdd?'disabled':''}>+ Líder de grupo</button><button class="btn btn-primary" onclick="adminAddUserToCuenta('${c.id}','Asesor')" ${!canAdd?'disabled':''}>+ Simular registro de asesor</button>`;
  }else{
    actions = `<button class="btn btn-primary" onclick="adminEnsureUserForCuenta(adminCuenta('${c.id}')); adminSave(); adminRender();">Preparar perfil independiente</button>`;
  }
  return `<div class="admin-lock" style="margin-top:18px"><div class="admin-lock-k">Subcuentas autorizadas</div><div class="admin-lock-v gold">${users.length} / ${max}</div></div>
  <div class="admin-help">Candado de control: no se permiten más registros que el cupo autorizado de la cuenta.</div>
  <div class="admin-list" style="margin-top:12px">${rows}</div>
  <div class="admin-actions">${actions}</div>`;
}
function adminHandleCuentaTipoUi(tipo){
  const wrap = document.getElementById('cuenta-logo-wrap');
  if(wrap){
    if(tipo === 'Asesor independiente'){
      wrap.classList.add('full');
      wrap.innerHTML = `<div class="admin-conditional-note"><b>Identidad visual automática:</b> Asesor independiente no carga logo inmobiliaria. Se usa la casita Método NERI en automático.</div>`;
    }else{
      wrap.classList.add('full');
      const label = tipo === 'Inmobiliaria' ? 'Logo inmobiliaria' : 'Logo de grupo / cuenta';
      if(!document.getElementById('cuenta-logo')) wrap.innerHTML = `${adminUploadField(label,'cuenta-logo','','Sube el logo desde tu computadora. No se pega URL. Este logo se aplicará como branding de la cuenta.')}`;
      const lbl = wrap.querySelector('label'); if(lbl) lbl.textContent = label;
    }
  }
  const lim = document.getElementById('cuenta-limite');
  if(lim){
    if(tipo === 'Inmobiliaria'){ lim.disabled=false; lim.value = '10'; }
    if(tipo === 'Grupo de asesores sin inmobiliaria'){ lim.disabled=true; lim.value = '5'; }
    if(tipo === 'Asesor independiente'){ lim.disabled=true; lim.value = '1'; }
  }
}
function adminSelectCuenta(id){
  adminState.selectedCuentaId=id;
  const c=adminCuenta(id); if(c) adminState.cuentaTipoTab=c.tipo;
  adminRender();
}
function adminNewCuenta(){
  const tipo = ADMIN_TIPOS_CUENTA.includes(adminState.cuentaTipoTab) ? adminState.cuentaTipoTab : 'Inmobiliaria';
  const name = tipo === 'Inmobiliaria' ? 'Nueva inmobiliaria' : tipo === 'Grupo de asesores sin inmobiliaria' ? 'Nuevo grupo sin inmobiliaria' : 'Nueva cuenta independiente';
  const c={id:adminId('cta'), nombre:name, tipo, estado:'Pendiente', ciudad:'', responsable:'', logo:tipo==='Asesor independiente'?'CASITA_METODO_NERI':'', limiteAsesores:adminDefaultLimit(tipo), notas:''};
  adminState.data.cuentas.unshift(c); adminState.selectedCuentaId=c.id; adminState.cuentaTipoTab=tipo;
  if(tipo === 'Asesor independiente') adminEnsureUserForCuenta(c);
  adminSave(); adminRender();
}
function adminSaveCuenta(){
  const c=adminCuenta(adminState.selectedCuentaId); if(!c) return;
  c.nombre=val('cuenta-nombre'); c.tipo=val('cuenta-tipo'); c.estado=val('cuenta-estado'); c.ciudad=val('cuenta-ciudad'); c.responsable=val('cuenta-responsable'); c.logo=c.tipo==='Asesor independiente' ? 'CASITA_METODO_NERI' : val('cuenta-logo'); c.notas=val('cuenta-notas');
  c.limiteAsesores = c.tipo === 'Inmobiliaria' ? Number(val('cuenta-limite')||10) : adminDefaultLimit(c.tipo);
  adminState.cuentaTipoTab = c.tipo;
  if(c.tipo === 'Asesor independiente') adminEnsureUserForCuenta(c);
  adminState.data.usuarios.filter(u=>u.cuentaId===c.id).forEach(u=>{
    u.tipo=c.tipo;
    u.estado=c.estado;
    if(c.tipo === 'Asesor independiente'){
      u.puesto='Asesor independiente';
      u.permisos=(u.permisos||adminDefaultPermsForType(c.tipo)).filter(p=>p!=='branding_cuenta');
    }else{
      if(!adminPuestoOptions(c.tipo).includes(u.puesto)) u.puesto=adminDefaultPuesto(c.tipo);
      u.permisos=(u.permisos && u.permisos.length ? u.permisos : adminDefaultPermsForType(c.tipo));
      if(!u.permisos.includes('branding_cuenta')) u.permisos.push('branding_cuenta');
    }
  });
  adminSave(); adminRender();
}
function adminDeleteCuenta(){
  const id=adminState.selectedCuentaId; if(!id) return;
  if(adminState.data.usuarios.some(u=>u.cuentaId===id)){ showToast('No se puede eliminar: tiene usuarios/subcuentas asignadas'); return; }
  adminState.data.cuentas=adminState.data.cuentas.filter(c=>c.id!==id); adminState.selectedCuentaId=adminState.data.cuentas.find(c=>c.tipo===adminState.cuentaTipoTab)?.id||null; adminSave(); adminRender();
}
function adminGoUsuario(id){ adminState.selectedUsuarioId=id; adminState.tab='usuarios'; adminRender(); }
function adminAddUserToCuenta(cuentaId, puesto){
  const c=adminCuenta(cuentaId); if(!c) return;
  if(!adminCanAddUser(c)){ showToast('Cupo lleno: no se pueden activar más subcuentas en esta cuenta'); return; }
  const nombreBase = puesto === 'Asesor' ? 'Asesor pendiente de registro' : `${puesto} pendiente`;
  const u={id:adminId('usr'), cuentaId, nombre:nombreBase, whatsapp:'', email:'', foto:'', frase:'', ciudad:c?.ciudad||'', pixel:'', tipo:c?.tipo||'Inmobiliaria', estado:c?.estado||'Pendiente', puesto, slugSugerido:'', slugOficial:'', permisos:adminDefaultPermsForType(c?.tipo||'Inmobiliaria')};
  adminState.data.usuarios.unshift(u); adminState.selectedUsuarioId=u.id; adminSave(); adminRender();
}

function adminRenderUsuarios(){
  const d=adminState.data;
  const selectedCuenta = adminCuenta(adminState.selectedCuentaId) || d.cuentas[0] || null;
  if(selectedCuenta) adminState.selectedCuentaId = selectedCuenta.id;
  const usuariosCuenta = selectedCuenta ? adminCuentaUsers(selectedCuenta.id) : d.usuarios;
  const selected = adminUsuario(adminState.selectedUsuarioId) || usuariosCuenta[0] || d.usuarios[0] || null;
  if(selected) adminState.selectedUsuarioId = selected.id;
  const list = usuariosCuenta.map(u=>`
    <div class="admin-row ${u.id===adminState.selectedUsuarioId?'active':''}" onclick="adminSelectUsuario('${u.id}')">
      <div class="ar-top"><div><div class="ar-name">${adminEsc(u.nombre)}</div><div class="ar-meta">${adminEsc(adminCuentaName(u.cuentaId))}</div></div>${adminBadge(u.estado)}</div>
      <div class="ar-meta">Tipo: ${adminEsc(u.tipo)} · Puesto: ${adminEsc(u.puesto||'Sin puesto')}</div>
      <div class="ar-link">${adminEsc(adminLink(u))}</div>
    </div>`).join('') || `<div class="admin-empty"><div class="big">◎</div>Sin perfiles creados para esta cuenta</div>`;
  const cuentaInfo = selectedCuenta ? `<div class="admin-help"><b>Cuenta seleccionada:</b> ${adminEsc(selectedCuenta.nombre)} · ${adminEsc(selectedCuenta.tipo)} · ${adminEsc(selectedCuenta.estado)} · Subcuentas ${adminCuentaUsage(selectedCuenta)} / ${adminCuentaMaxUsers(selectedCuenta)}. El asesor solo completa su perfil público.</div>` : '';
  const form = selected ? adminUsuarioForm(selected) : `<div class="admin-empty"><div class="big">◎</div>Primero guarda una cuenta y después prepara o registra usuarios.</div>`;
  return `<div class="admin-grid">
    <div class="admin-card"><div class="admin-card-head"><div><div class="admin-card-title">USUARIOS / <em>SUBCUENTAS</em></div><div class="admin-card-sub">Solo de la cuenta seleccionada</div></div><button class="btn btn-primary" onclick="adminNewUsuario()">+ Registro en cuenta</button></div><div class="admin-card-body">${cuentaInfo}<div class="admin-list">${list}</div></div></div>
    <div class="admin-card"><div class="admin-card-head"><div><div class="admin-card-title">PERFIL DE <em>USUARIO</em></div><div class="admin-card-sub">Datos públicos + datos bloqueados</div></div></div><div class="admin-card-body">${form}</div></div>
  </div>`;
}
function adminBrandingPreview(c){
  if(!c) return '';
  if(c.tipo === 'Asesor independiente') return `<div class="admin-conditional-note"><b>Branding:</b> usa casita Método NERI automática. No hay logo inmobiliaria.</div>`;
  if(c.logo) return `<div class="admin-conditional-note"><div style="display:flex;align-items:center;gap:12px"><img src="${adminEsc(c.logo)}" style="width:46px;height:46px;border-radius:12px;object-fit:cover;border:1px solid rgba(212,175,55,.35)"><div><b>Branding de cuenta activo.</b><br>Este logo lo controla administración y se aplicará a los usuarios de la cuenta.</div></div></div>`;
  return `<div class="admin-conditional-note"><b>Branding pendiente:</b> esta cuenta puede usar logo, pero todavía no se ha subido desde Cuentas.</div>`;
}
function adminUserAdminBlock(u, cuenta){
  if(!cuenta) return `<div class="form-group full"><div class="admin-conditional-note">Usuario sin cuenta asignada.</div></div>`;
  return `<div class="form-group full"><div class="admin-conditional-note"><b>Datos administrativos bloqueados:</b> cuenta, tipo, estado, puesto, cupo, slug y link no los edita el asesor. Se controlan desde Cuentas activas y permisos.</div></div>`;
}
function adminUsuarioForm(u){
  const cuenta = adminCuenta(u.cuentaId);
  return `<div class="admin-help">La foto se sube como archivo, no se pega URL. El asesor solo completa estos datos públicos.</div>
  <div class="admin-form-grid">
    ${adminUserAdminBlock(u, cuenta)}
    <div class="form-group full">${adminBrandingPreview(cuenta)}</div>
    ${adminField('Nombre','user-nombre',u.nombre)}
    ${adminField('WhatsApp','user-whatsapp',u.whatsapp)}
    ${adminField('Email','user-email',u.email)}
    ${adminField('Ciudad','user-ciudad',u.ciudad)}
    ${adminUploadField('Foto del asesor','user-foto',u.foto,'Sube la foto desde tu computadora o celular. No se pega URL.')}
    ${adminField('Frase','user-frase',u.frase)}
    ${adminField('Pixel ID Meta','user-pixel',u.pixel)}
  </div>
  <div class="admin-lock"><div class="admin-lock-k">Cuenta asignada</div><div class="admin-lock-v" id="user-cuenta-preview">${adminEsc(adminCuentaName(u.cuentaId))}</div></div>
  <div class="admin-lock"><div class="admin-lock-k">Tipo</div><div class="admin-lock-v" id="user-tipo-preview">${adminEsc(u.tipo)}</div></div>
  <div class="admin-lock"><div class="admin-lock-k">Estado</div><div class="admin-lock-v" id="user-estado-preview">${adminEsc(u.estado)}</div></div>
  <div class="admin-lock"><div class="admin-lock-k">Puesto</div><div class="admin-lock-v">${adminEsc(u.puesto||adminDefaultPuesto(u.tipo))}</div></div>
  <div class="admin-lock"><div class="admin-lock-k">Slug automático oficial</div><div class="admin-lock-v gold">${adminEsc(u.slugOficial||'Se generará al guardar nombre')}</div></div>
  <div class="admin-lock"><div class="admin-lock-k">Link Captación generado</div><div class="admin-lock-v gold">${adminEsc(adminLink(u))}</div></div>
  <div class="admin-actions"><button class="btn btn-ghost" onclick="adminDeleteUsuario()">Eliminar subcuenta</button><button class="btn btn-primary" onclick="adminSaveUsuario()">Guardar perfil público</button></div>`;
}
function adminSelectUsuario(id){ adminState.selectedUsuarioId=id; adminRender(); }
function adminNewUsuario(){
  const c = adminCuenta(adminState.selectedCuentaId);
  if(!c){ showToast('Primero selecciona o crea una cuenta'); return; }
  if(c.tipo === 'Asesor independiente'){
    adminEnsureUserForCuenta(c);
    adminSave(); adminRender();
    showToast('La cuenta independiente usa un solo perfil automático');
    return;
  }
  adminAddUserToCuenta(c.id, adminDefaultPuesto(c.tipo));
}
function adminSaveUsuario(){
  const u=adminUsuario(adminState.selectedUsuarioId); if(!u) return;
  let c=adminCuenta(u.cuentaId);
  u.nombre=val('user-nombre'); u.whatsapp=val('user-whatsapp').replace(/\D/g,''); u.email=val('user-email'); u.ciudad=val('user-ciudad'); u.foto=val('user-foto'); u.frase=val('user-frase'); u.pixel=val('user-pixel');
  if(c){
    u.tipo=c.tipo;
    u.estado=c.estado;
    if(c.tipo === 'Asesor independiente'){
      u.puesto='Asesor independiente';
      u.permisos=(u.permisos||adminDefaultPermsForType(c.tipo)).filter(p=>p!=='branding_cuenta');
    }else{
      if(!adminPuestoOptions(c.tipo).includes(u.puesto)) u.puesto=adminDefaultPuesto(c.tipo);
      u.permisos=(u.permisos && u.permisos.length ? u.permisos : adminDefaultPermsForType(c.tipo));
      if(!u.permisos.includes('branding_cuenta')) u.permisos.push('branding_cuenta');
    }
  }
  const slug = adminUniqueSlug(adminSlug(u.nombre || c?.responsable || c?.nombre), u.id);
  u.slugSugerido=slug; u.slugOficial=slug;
  adminSave(); adminRender();
}
function adminDeleteUsuario(){
  const id=adminState.selectedUsuarioId; if(!id) return;
  adminState.data.usuarios=adminState.data.usuarios.filter(u=>u.id!==id); adminState.selectedUsuarioId=adminState.data.usuarios[0]?.id||null; adminSave(); adminRender();
}

function adminRenderPermisos(){
  const d=adminState.data;
  const selected = adminUsuario(adminState.selectedUsuarioId) || d.usuarios[0] || null;
  if(selected) adminState.selectedUsuarioId = selected.id;
  const list = d.usuarios.map(u=>`
    <div class="admin-row ${u.id===adminState.selectedUsuarioId?'active':''}" onclick="adminSelectUsuario('${u.id}')">
      <div class="ar-top"><div><div class="ar-name">${adminEsc(u.nombre)}</div><div class="ar-meta">${adminEsc(adminCuentaName(u.cuentaId))}</div></div>${adminBadge(u.estado)}</div>
      <div class="ar-meta">${u.permisos.length} permisos asignados · ${adminEsc(u.tipo)} · ${adminEsc(u.puesto||'Sin puesto')}</div>
    </div>`).join('');
  const checks = selected ? ADMIN_PERMISSION_CATALOG.map(p=>{
    const blockedBranding = selected.tipo === 'Asesor independiente' && p.id === 'branding_cuenta';
    return `<label class="admin-check ${blockedBranding?'disabled':''}"><input type="checkbox" data-perm="${p.id}" ${selected.permisos.includes(p.id)&&!blockedBranding?'checked':''} ${blockedBranding?'disabled':''}><div><b>${adminEsc(p.title)}</b><span>${adminEsc(p.desc)}</span>${blockedBranding?'<small>No aplica para asesor independiente. Se usa casita Método NERI automática.</small>':''}</div></label>`;
  }).join('') : '';
  const form = selected ? `<div class="admin-help">Permisos base para ${adminEsc(selected.nombre)}. Todavía no bloquean navegación en esta prueba; quedan preparados para el login real. En inmobiliaria y grupo, Branding de cuenta permite usar el logo cargado por administración.</div><div class="admin-checks">${checks}</div><div class="admin-actions"><button class="btn btn-primary" onclick="adminSavePermisos()">Guardar permisos</button></div>` : `<div class="admin-empty"><div class="big">◫</div>Selecciona un usuario</div>`;
  return `<div class="admin-grid">
    <div class="admin-card"><div class="admin-card-head"><div><div class="admin-card-title">USUARIO PARA <em>PERMISOS</em></div><div class="admin-card-sub">Selección administrativa</div></div></div><div class="admin-card-body"><div class="admin-list">${list}</div></div></div>
    <div class="admin-card"><div class="admin-card-head"><div><div class="admin-card-title">PERMISOS <em>BASE</em></div><div class="admin-card-sub">Preparado para etapa con login real</div></div></div><div class="admin-card-body">${form}</div></div>
  </div>`;
}
function adminSavePermisos(){
  const u=adminUsuario(adminState.selectedUsuarioId); if(!u) return;
  u.permisos = Array.from(document.querySelectorAll('[data-perm]:checked')).map(x=>x.dataset.perm);
  if(u.tipo === 'Asesor independiente') u.permisos = u.permisos.filter(p=>p !== 'branding_cuenta');
  if(u.tipo !== 'Asesor independiente' && !u.permisos.includes('branding_cuenta')) u.permisos.push('branding_cuenta');
  adminSave(); adminRender();
}
function adminCopyLink(){
  const u=adminUsuario(adminState.selectedUsuarioId); if(!u || !u.slugOficial){ showToast('Aún no hay slug automático'); return; }
  navigator.clipboard?.writeText(adminLink(u));
  showToast('Link Captación copiado');
}

function adminUploadField(label,id,value='',hint=''){
  const hasFile = value && value !== 'CASITA_METODO_NERI';
  const preview = hasFile
    ? `<img src="${adminEsc(value)}" alt="${adminEsc(label)}">`
    : `<span>＋</span>`;
  return `<label>${adminEsc(label)}</label>
    <div class="admin-upload-box" id="${id}-box">
      <div class="admin-upload-preview" id="${id}-preview">${preview}</div>
      <div class="admin-upload-actions">
        <input id="${id}" type="hidden" value="${adminEsc(value || '')}">
        <input type="file" id="${id}-file" accept="image/*" onchange="adminReadUpload(event,'${id}')">
        <div class="admin-upload-hint">${adminEsc(hint || 'Sube una imagen. El sistema la guarda en esta prueba sin pegar URL.')}</div>
        ${hasFile ? `<button type="button" class="admin-upload-remove" onclick="adminClearUpload('${id}')">Quitar archivo</button>` : ''}
      </div>
    </div>`;
}
function adminClearUpload(id){
  const hidden = document.getElementById(id); if(hidden) hidden.value='';
  const preview = document.getElementById(id+'-preview'); if(preview) preview.innerHTML='<span>＋</span>';
  const file = document.getElementById(id+'-file'); if(file) file.value='';
}
function adminReadUpload(ev,id){
  const file = ev?.target?.files?.[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Solo se aceptan imágenes en esta sección'); ev.target.value=''; return; }
  if(file.size > 6 * 1024 * 1024){ showToast('La imagen pesa mucho. Usa una menor a 6 MB.'); ev.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1200;
      let w = img.width, h = img.height;
      if(w > max || h > max){
        const ratio = Math.min(max / w, max / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(type, .84);
      const hidden = document.getElementById(id); if(hidden) hidden.value = dataUrl;
      const preview = document.getElementById(id+'-preview'); if(preview) preview.innerHTML = `<img src="${dataUrl}" alt="Vista previa">`;
      showToast('✓ Imagen cargada');
    };
    img.onerror = () => showToast('No se pudo leer la imagen');
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function adminField(label,id,value='',placeholder=''){
  return `<div class="form-group"><label>${adminEsc(label)}</label><input class="form-inp" id="${id}" value="${adminEsc(value)}" placeholder="${adminEsc(placeholder)}"></div>`;
}
function adminArea(label,id,value='',cls=''){
  return `<div class="form-group ${cls}"><label>${adminEsc(label)}</label><textarea class="form-inp" id="${id}" rows="4">${adminEsc(value)}</textarea></div>`;
}
function adminSelect(label,id,value,opts,extra=''){
  return `<div class="form-group"><label>${adminEsc(label)}</label><select class="form-inp" id="${id}" ${extra}>${opts.map(o=>`<option value="${adminEsc(o)}" ${o===value?'selected':''}>${adminEsc(o)}</option>`).join('')}</select></div>`;
}
function adminSelectObjects(label,id,value,opts,extra=''){
  return `<div class="form-group"><label>${adminEsc(label)}</label><select class="form-inp" id="${id}" ${extra}>${opts.map(o=>`<option value="${adminEsc(o.value)}" ${o.value===value?'selected':''}>${adminEsc(o.label)}</option>`).join('')}</select></div>`;
}
function val(id){ return document.getElementById(id)?.value?.trim() || ''; }

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
function _escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }

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

async function uploadBlobFile(file, folio, doc){
  if(!file) return null;
  const qs = new URLSearchParams({
    folio: folio || 'sin-folio',
    doc: _safeDocKey(doc || 'archivo'),
    filename: file.name || 'archivo'
  });
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
        <div class="le-note">Puedes subir el archivo desde aquí. La intranet lo manda a Vercel Blob y guarda solo la URL en Airtable.</div>
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
      inner = `<div class="le-note" style="margin:0 0 8px">Puedes pegar ID de YouTube o subir el MP4 aquí. La intranet sube el archivo a Blob y guarda la URL en Airtable.</div>`
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

const CITA_VERCEL_BASE = 'https://cita-sable.vercel.app/'; // ← URL real de la pagina de cita (handoff 6)

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
  hoy:'Inicio', administracion:'Administración Base', airtable:'Mi CRM', sala:'Sala de Mensajes',
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
  if(id === 'administracion') setTimeout(onAdministracionPanelActivate, 60);
  if(id === 'airtable') setTimeout(onAirtablePanelActivate, 60);
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

/* MODO PRUEBA ADMINISTRADOR ABIERTO
   En esta etapa NO hay login real, NO hay contraseña y NO se bloquea navegación.
   El formulario demo se conserva en el HTML para no romper estructura, pero se entra directo. */
document.getElementById('l-user').value = 'admin';
document.getElementById('l-pass').value = 'neri2024';
document.getElementById('l-rol').value  = 'admin';
window.addEventListener('DOMContentLoaded', () => {
  SESSION = { ...USERS.admin, user:'admin' };
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('hidden');
  bootApp();
  setTimeout(()=>goTo('administracion'), 80);
});
