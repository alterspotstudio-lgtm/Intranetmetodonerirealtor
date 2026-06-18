/* ============================================================================
   MÉTODO NERI · Cabina de acciones del vendedor/propietario
   ----------------------------------------------------------------------------
   Reemplaza el panel suelto "panel-citas.html". Vive DENTRO de la ficha de
   PROPIEDADES (landOpenEditor). Según el manual de ensamble, Producción,
   Notaría y Reporte pertenecen a la propiedad activa, no al lead vendedor.

   No toca el flujo de compradores (fichaAgendarCita / citacasa_comprador_)
   ni el portal de progreso.

   INTEGRACIÓN: agrega esta única línea al final de <body> en index.html,
   DESPUÉS del <script> principal:
       <script src="cabina-vendedor.js"></script>

   El asesor por defecto se puede sobrescribir desde la sesión, antes de cargar
   este script, con:
       window.CABINA_ASESOR = { nombre:'...', tel:'...', inmo:'...' };
   ========================================================================== */
(function () {
  'use strict';

  /* ── Asesor por defecto (editable en la cabina; el nombre del registro manda) ── */
  var ASESOR_DEFAULT = Object.assign(
    { nombre: 'Enrique Martínez Neri', tel: '777 985 5687', inmo: '' },
    window.CABINA_ASESOR || {}
  );

  /* ── Etapas que habilitan confirmaciones al cliente ── */
  var ETAPAS_FIRMADAS = ['Firma exclusiva', 'Firma venta directa'];

  /* ── EXPEDIENTE DOCUMENTAL DEL PROPIETARIO ──────────────────────────────
     Este es el portal donde el PROPIETARIO sube sus documentos.
     NO es el portal de progreso del cliente (ese es otro).
     AJUSTAR EXP_DOC_BASE al dominio real donde está desplegado
     index_expedientedocumental_propietario.html (sin slash final).
     Se puede sobrescribir desde la sesión antes de cargar este script:
         window.EXP_DOC_BASE = 'https://expedientedocumentalpropietario.vercel.app';
  ----------------------------------------------------------------------- */
  var EXP_DOC_BASE = window.EXP_DOC_BASE || 'https://expedientedocumentalpropietario.vercel.app';
  /* Endpoint para que el ASESOR suba un documento recibido por otro medio */
  var UPLOAD_DOC_ENDPOINT = window.UPLOAD_DOC_ENDPOINT || '/api/upload-documento';

  /* ── Datos de checklists / documentos (portados del panel original) ── */
  var CHECKLIST = [
    { n: '01', t: 'Limpieza general completa', s: 'Pisos, vidrios, baños y cocina impecables' },
    { n: '02', t: 'Despersonalizar espacios', s: 'Retirar fotos familiares y objetos personales' },
    { n: '03', t: 'Iluminación al máximo', s: 'Todas las luces encendidas, cortinas abiertas' },
    { n: '04', t: 'Jardín o patio ordenado', s: 'Cortar pasto, recoger objetos sueltos' },
    { n: '05', t: 'Estacionamiento despejado', s: 'Sin autos al frente para tomas exteriores' },
    { n: '06', t: 'Mascotas resguardadas', s: 'Para que no interfieran durante la grabación' },
    { n: '07', t: 'Aromas agradables', s: 'Ventilar bien los espacios antes de la sesión' },
    { n: '08', t: 'Detalles decorativos', s: 'Flores frescas, toallas dobladas, cojines acomodados' }
  ];
  var PRODUCCION = [
    { n: '01', t: 'Video principal de la propiedad', s: 'Recorrido completo con música y branding Método Neri' },
    { n: '02', t: 'Video podcast del asesor', s: 'Presentación con contexto y puntos clave' },
    { n: '03', t: 'Videos filtro para publicidad', s: 'Cortos optimizados para redes y pauta pagada' }
  ];
  var AJUSTES = [
    { t: 'Mantener la estrategia actual', s: 'Los resultados van en la dirección correcta' },
    { t: 'Ajustar precio de la propiedad', s: 'Basado en la respuesta del mercado en este período' },
    { t: 'Cambiar segmentación del anuncio', s: 'Ampliar o afinar el perfil del comprador objetivo' }
  ];
  var DOCS = [
    { n: '01', t: 'Identificación oficial vigente', s: 'INE / Pasaporte — original y copia' },
    { n: '02', t: 'CURP', s: 'Clave Única de Registro de Población' },
    { n: '03', t: 'Comprobante de domicilio', s: 'No mayor a 3 meses — original y copia' },
    { n: '04', t: 'RFC con homoclave', s: 'Constancia del SAT' },
    { n: '05', t: 'Estado de cuenta bancario', s: 'Últimos 3 meses para acreditar fondos' },
    { n: '06', t: 'Acta de matrimonio', s: 'Si aplica — original y copia' },
    { n: '07', t: 'Poder notarial', s: 'Si actúa en representación de alguien' },
    { n: '08', t: 'Cheque certificado / transferencia', s: 'Según instrucciones de la notaría' }
  ];

  /* ── Helpers propios (no dependemos de los de index.html) ── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fval(rec, field) {
    if (!rec || !rec.fields) return '';
    var v = rec.fields[field];
    if (Array.isArray(v)) v = v[0];
    return v == null ? '' : v;
  }
  function getState() {
    if (window.crmState && window.crmState.records) return window.crmState;
    try { if (typeof crmState !== 'undefined' && crmState && crmState.records) return crmState; } catch (_) {}
    return null;
  }
  function getRecord(recId) {
    var st = getState();
    if (!st || !st.records) return null;
    return st.records.find(function (r) { return r.id === recId; }) || null;
  }
  function isPropiedadActiva() {
    var st = getState();
    return !!(st && st.tab === 'propiedades');
  }
  /* Señal de que la producción ya está: hay al menos un video subido a la landing de la propiedad. */
  function hasVideosListos(recId) {
    var r = getRecord(recId);
    if (!r) return false;
    var campos = ['Video Sala', 'Video Sala MP4', 'Video Cocina', 'Video Cocina MP4', 'Video Recamara', 'Video Recamara MP4', 'Video Jardin', 'Video Jardin MP4', 'Video Alberca', 'Video Alberca MP4', 'Video Extra MP4'];
    for (var i = 0; i < campos.length; i++) { if (String(fval(r, campos[i]) || '').trim()) return true; }
    return false;
  }
  function logoSVG(inmo) {
    var u = String(inmo || '').toUpperCase().trim();
    if (u.indexOf('CENTURY 21') > -1 || u.indexOf('CENTURY21') > -1 || u.indexOf('C21') > -1) {
      var sub = String(inmo).replace(/century\s?21/gi, '').trim().toUpperCase() || 'HAUS';
      return '<svg viewBox="0 0 120 52" fill="none" xmlns="http://www.w3.org/2000/svg" height="48">'
        + '<circle cx="20" cy="20" r="17" stroke="#C6A86B" stroke-width="1.4" fill="none"/>'
        + '<text x="20" y="25" text-anchor="middle" font-family="\'Bebas Neue\',sans-serif" font-size="14" fill="#C6A86B" letter-spacing="1">C21</text>'
        + '<text x="46" y="18" font-family="\'Bebas Neue\',sans-serif" font-size="12" fill="#C6A86B" letter-spacing="2">CENTURY 21</text>'
        + '<text x="46" y="32" font-family="\'Montserrat\',sans-serif" font-size="9" fill="rgba(255,255,255,0.30)" letter-spacing="2">' + esc(sub) + '</text>'
        + '</svg>';
    }
    if (String(inmo).trim()) {
      return '<div style="text-align:right"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:15px;letter-spacing:2px;color:#C6A86B">'
        + esc(String(inmo).toUpperCase()) + '</div><div style="font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.2);margin-top:2px">INMOBILIARIA</div></div>';
    }
    return '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" height="40">'
      + '<path d="M24 6L4 22h6v20h12V30h4v12h12V22h6L24 6z" stroke="#C6A86B" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>';
  }

  /* ── Estado de la cabina ── */
  var cab = { tipo: null, recId: null, asesor: null, prefill: {}, radioSel: -1, lastCardHTML: '' };

  function asesorActual() {
    return {
      nombre: byId('cab_g_asesor').value || ASESOR_DEFAULT.nombre,
      tel: byId('cab_g_tel').value || ASESOR_DEFAULT.tel,
      inmo: byId('cab_g_inmo').value || ASESOR_DEFAULT.inmo
    };
  }
  function byId(id) { return document.getElementById(id); }

  /* =========================================================================
     ESTILOS (todo bajo #cab-overlay para no chocar con index.html)
     ========================================================================= */
  function injectStyles() {
    if (byId('cab-styles')) return;
    var css = `
#cab-overlay{position:fixed;inset:0;z-index:9000;display:none;background:rgba(6,6,6,.96);}
#cab-overlay.on{display:flex;}
#cab-overlay *{box-sizing:border-box;}
#cab-shell{margin:auto;width:min(1180px,96vw);height:min(92vh,940px);background:#0A0A0A;border:1px solid rgba(198,168,107,.22);border-radius:6px;display:flex;overflow:hidden;font-family:'Montserrat',sans-serif;color:#fff;}
/* columna formulario */
#cab-form{width:380px;min-width:340px;background:#111;border-right:1px solid rgba(198,168,107,.22);display:flex;flex-direction:column;overflow-y:auto;}
#cab-form-top{padding:22px 24px 0;}
.cab-brand{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:3px;color:#C6A86B;}
.cab-brand-sub{font-size:8px;font-weight:600;letter-spacing:3px;color:rgba(255,255,255,.35);text-transform:uppercase;margin-top:3px;}
.cab-ctx{margin:14px 0 0;padding:10px 12px;background:#181818;border:1px solid rgba(198,168,107,.18);border-radius:4px;}
.cab-ctx-t{font-size:11px;font-weight:600;color:#E2C98A;}
.cab-ctx-s{font-size:9px;color:rgba(255,255,255,.45);margin-top:2px;letter-spacing:.3px;}
.cab-scroll{flex:1;overflow-y:auto;padding:18px 24px 26px;}
.cab-seclabel{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#C6A86B;margin:18px 0 10px;display:flex;align-items:center;gap:8px;}
.cab-seclabel:first-child{margin-top:0;}
.cab-seclabel::after{content:'';flex:1;height:1px;background:rgba(198,168,107,.12);}
.cab-field{margin-bottom:10px;}
.cab-field label{display:block;font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:5px;}
.cab-field input,.cab-field select,.cab-field textarea{width:100%;background:#181818;border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Montserrat',sans-serif;font-size:12px;padding:9px 12px;border-radius:3px;outline:none;-webkit-appearance:none;}
.cab-field input:focus,.cab-field select:focus,.cab-field textarea:focus{border-color:rgba(198,168,107,.45);}
.cab-field input.prefilled{border-color:rgba(198,168,107,.30);background:#161412;}
.cab-field input::placeholder,.cab-field textarea::placeholder{color:rgba(255,255,255,.18);}
.cab-field textarea{resize:vertical;min-height:54px;}
.cab-field-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.cab-prefnote{font-size:8px;color:rgba(198,168,107,.6);margin-top:3px;letter-spacing:.5px;}
.cab-checkgrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.cab-check{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:#181818;border:1px solid rgba(255,255,255,.08);border-radius:3px;cursor:pointer;}
.cab-check.on{border-color:rgba(198,168,107,.45);background:rgba(198,168,107,.10);}
.cab-check input{width:13px;min-width:13px;height:13px;accent-color:#C6A86B;margin-top:1px;}
.cab-check span{font-size:10px;font-weight:500;color:rgba(255,255,255,.6);line-height:1.3;}
.cab-check.on span{color:#E2C98A;}
.cab-checkfull{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#181818;border:1px solid rgba(255,255,255,.08);border-radius:3px;margin-bottom:6px;cursor:pointer;}
.cab-checkfull.on{border-color:rgba(198,168,107,.45);background:rgba(198,168,107,.10);}
.cab-checkfull input{width:13px;min-width:13px;height:13px;accent-color:#C6A86B;margin-top:2px;}
.cab-cf-t{font-size:11px;font-weight:600;color:rgba(255,255,255,.6);line-height:1.3;}
.cab-cf-s{font-size:9px;font-weight:300;color:rgba(255,255,255,.35);margin-top:2px;}
.cab-checkfull.on .cab-cf-t{color:#E2C98A;}
.cab-radio{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:#181818;border:1px solid rgba(255,255,255,.08);border-radius:3px;margin-bottom:6px;cursor:pointer;}
.cab-radio.on{border-color:rgba(198,168,107,.45);background:rgba(198,168,107,.10);}
.cab-radio input{width:13px;min-width:13px;height:13px;accent-color:#C6A86B;margin-top:2px;}
.cab-radio .t{font-size:11px;font-weight:600;color:rgba(255,255,255,.6);line-height:1.3;}
.cab-radio .s{font-size:9px;font-weight:300;color:rgba(255,255,255,.35);margin-top:2px;}
.cab-radio.on .t{color:#E2C98A;}
.cab-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.cab-btn-gen{width:100%;padding:13px;background:#C6A86B;color:#0A0A0A;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;border:none;border-radius:3px;cursor:pointer;margin-top:16px;}
.cab-btn-gen:hover{background:#E2C98A;}
.cab-btn-print,.cab-btn-wa{width:100%;padding:11px;background:transparent;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border-radius:3px;cursor:pointer;margin-top:8px;display:none;}
.cab-btn-print{color:#C6A86B;border:1px solid rgba(198,168,107,.45);}
.cab-btn-print:hover{background:rgba(198,168,107,.10);}
.cab-btn-wa{color:#25D366;border:1px solid rgba(37,211,102,.35);}
.cab-btn-wa:hover{background:rgba(37,211,102,.07);}
/* columna preview */
#cab-preview{flex:1;background:#141414;overflow-y:auto;padding:26px 32px;display:flex;flex-direction:column;align-items:center;}
#cab-close{position:absolute;top:14px;right:18px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(198,168,107,.3);background:rgba(10,10,10,.7);color:#C6A86B;font-size:16px;cursor:pointer;z-index:2;}
#cab-close:hover{background:rgba(198,168,107,.12);}
.cab-prev-lbl{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.18);margin-bottom:20px;align-self:flex-start;}
.cab-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:55vh;gap:12px;opacity:.35;}
.cab-empty-big{font-family:'Bebas Neue',sans-serif;font-size:64px;letter-spacing:4px;color:#C6A86B;}
.cab-empty-sm{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.35);}
/* tarjeta */
.cab-card{width:700px;max-width:100%;background:#0A0A0A;border-top:1px solid rgba(198,168,107,.22);border-bottom:1px solid rgba(198,168,107,.22);}
.cab-c-header{background:#111;border-bottom:1px solid rgba(198,168,107,.22);padding:22px 30px;display:flex;align-items:center;justify-content:space-between;}
.cab-c-name{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;}
.cab-c-meta{font-size:9px;color:rgba(255,255,255,.35);margin-top:3px;}
.cab-c-hero{padding:26px 30px 22px;border-bottom:1px solid rgba(255,255,255,.04);}
.cab-c-tag{font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#C6A86B;margin-bottom:8px;}
.cab-c-h{font-family:'Bebas Neue',sans-serif;font-size:34px;letter-spacing:2px;line-height:1;}
.cab-c-sub{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:13px;color:rgba(255,255,255,.35);margin-top:6px;line-height:1.5;}
.cab-c-body{padding:0 30px;}
.cab-c-sp{height:18px;}
.cab-secbar{display:flex;align-items:center;}
.cab-secbar-l{background:#C6A86B;color:#0A0A0A;font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:6px 14px;}
.cab-secbar-line{flex:1;height:1px;background:rgba(198,168,107,.22);}
.cab-dgrid{display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(255,255,255,.08);border-top:none;}
.cab-dcell{padding:12px 18px;border-right:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04);}
.cab-dcell:nth-child(even){border-right:none;}
.cab-dcell.full{grid-column:1/-1;}
.cab-dlbl{font-size:8px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.18);margin-bottom:3px;}
.cab-dval{font-size:12px;font-weight:500;}
.cab-dval.gold{color:#C6A86B;font-size:13px;font-weight:600;}
.cab-rowgrid{display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(255,255,255,.08);border-top:none;}
.cab-rowgrid .cab-r{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.04);border-right:1px solid rgba(255,255,255,.04);}
.cab-rowgrid .cab-r:nth-child(even){border-right:none;}
.cab-rnum{font-family:'Bebas Neue',sans-serif;font-size:15px;color:#C6A86B;flex-shrink:0;margin-top:1px;}
.cab-rt{font-size:10px;font-weight:600;line-height:1.3;}
.cab-rs{font-size:9px;font-weight:300;color:rgba(255,255,255,.35);margin-top:1px;line-height:1.3;}
.cab-prodgrid{display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid rgba(255,255,255,.08);border-top:none;}
.cab-prod{padding:12px 16px;border-right:1px solid rgba(255,255,255,.04);}
.cab-prod:last-child{border-right:none;}
.cab-prodnum{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#C6A86B;line-height:1;}
.cab-docs{border:1px solid rgba(255,255,255,.08);border-top:none;}
.cab-doc{display:flex;align-items:flex-start;gap:14px;padding:11px 18px;border-bottom:1px solid rgba(255,255,255,.04);}
.cab-doc:last-child{border-bottom:none;}
.cab-aj{display:flex;align-items:flex-start;gap:12px;padding:12px 18px;border:1px solid rgba(255,255,255,.08);border-top:none;}
.cab-ajdot{width:14px;height:14px;border:1.5px solid rgba(198,168,107,.22);border-radius:50%;flex-shrink:0;margin-top:2px;}
.cab-ajdot.on{background:#C6A86B;border-color:#C6A86B;}
.cab-analysis{border:1px solid rgba(255,255,255,.08);border-top:none;padding:14px 18px;}
.cab-an-lbl{font-size:8px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.18);margin-bottom:6px;}
.cab-an-txt{font-size:11px;color:rgba(255,255,255,.6);line-height:1.6;white-space:pre-wrap;}
.cab-c-footer{margin:20px 30px 0;border-top:1px solid rgba(198,168,107,.22);padding:14px 0 22px;display:flex;align-items:center;justify-content:space-between;}
.cab-c-fmsg{font-size:9px;font-style:italic;color:rgba(255,255,255,.35);}
.cab-c-ftel{font-size:10px;font-weight:600;color:#C6A86B;letter-spacing:1px;}
.cab-wa{margin-top:18px;width:700px;max-width:100%;background:#111;border:1px solid rgba(198,168,107,.22);border-radius:3px;padding:18px 22px;display:none;}
.cab-wa-lbl{font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#25D366;margin-bottom:10px;}
.cab-wa-msg{background:#181818;border:1px solid rgba(255,255,255,.08);border-radius:3px;padding:14px 16px;font-size:12px;color:rgba(255,255,255,.6);line-height:1.7;white-space:pre-wrap;word-break:break-word;}
.cab-wa-copy{margin-top:8px;padding:8px 16px;background:transparent;color:#25D366;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(37,211,102,.3);border-radius:3px;cursor:pointer;}
/* barra de acciones dentro de la ficha */
.cab-acciones{border:1px solid rgba(198,168,107,.18);border-radius:6px;padding:14px 16px;margin-top:12px;background:rgba(198,168,107,.04);}
.cab-acc-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C6A86B;display:flex;align-items:center;gap:7px;margin-bottom:4px;}
.cab-acc-hint{font-size:11px;color:rgba(255,255,255,.5);line-height:1.5;margin-bottom:12px;}
.cab-acc-grid{display:flex;flex-wrap:wrap;gap:8px;}
.cab-acc-btn{flex:1;min-width:150px;padding:12px 14px;background:#C6A86B;color:#0A0A0A;font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;text-align:left;}
.cab-acc-btn:hover{background:#E2C98A;}
.cab-acc-btn.ghost{background:transparent;color:#C6A86B;border:1px solid rgba(198,168,107,.4);}
.cab-acc-btn.ghost:hover{background:rgba(198,168,107,.10);}
.cab-acc-btn small{display:block;font-size:8px;font-weight:500;letter-spacing:.5px;text-transform:none;opacity:.75;margin-top:3px;}
.cab-acc-btn.locked{background:transparent;color:rgba(255,255,255,.35);border:1px dashed rgba(255,255,255,.18);cursor:not-allowed;}
.cab-acc-btn.locked:hover{background:transparent;}
#cab-evlink{display:none;border:1px solid rgba(198,168,107,.30);border-radius:4px;background:rgba(198,168,107,.06);padding:13px 14px;margin-bottom:12px;}
.cab-ev-lbl{font-size:8px;letter-spacing:2.5px;text-transform:uppercase;color:#C6A86B;font-weight:700;}
.cab-ev-url{font-family:'DM Mono',monospace;font-size:10px;color:#fff;margin-top:7px;word-break:break-all;line-height:1.5;}
.cab-ev-row{display:flex;gap:8px;margin-top:10px;}
.cab-ev-folio{font-size:8px;letter-spacing:1px;color:rgba(255,255,255,.4);margin-top:8px;line-height:1.5;}
.cab-acc-locked{padding:12px 14px;border:1px dashed rgba(255,255,255,.14);border-radius:4px;font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;}
@media(max-width:760px){
  #cab-shell{flex-direction:column;height:96vh;width:98vw;}
  #cab-form{width:100%;min-width:0;max-height:46%;border-right:none;border-bottom:1px solid rgba(198,168,107,.22);}
  .cab-card,.cab-wa{width:100%;}
  .cab-c-h{font-size:26px;}
}
`;
    var st = document.createElement('style');
    st.id = 'cab-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* =========================================================================
     OVERLAY (se construye una sola vez)
     ========================================================================= */
  function buildOverlay() {
    if (byId('cab-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'cab-overlay';
    ov.innerHTML =
      '<div id="cab-shell">'
      + '<button id="cab-close" onclick="cabCerrar()">×</button>'
      + '<div id="cab-form">'
      + '  <div id="cab-form-top">'
      + '    <div class="cab-brand">MÉTODO NERI</div>'
      + '    <div class="cab-brand-sub" id="cab-form-sub">Acción de la ficha</div>'
      + '    <div class="cab-ctx"><div class="cab-ctx-t" id="cab-ctx-t">—</div><div class="cab-ctx-s" id="cab-ctx-s">—</div></div>'
      + '  </div>'
      + '  <div class="cab-scroll" id="cab-scroll"></div>'
      + '</div>'
      + '<div id="cab-preview">'
      + '  <div class="cab-prev-lbl">Vista previa · Tarjeta exportable</div>'
      + '  <div class="cab-empty" id="cab-empty"><div class="cab-empty-big">NERI</div><div class="cab-empty-sm">Completa los datos y genera la confirmación</div></div>'
      + '  <div id="cab-card-slot"></div>'
      + '  <div class="cab-wa" id="cab-wa"><div class="cab-wa-lbl">Mensaje listo para WhatsApp</div><div class="cab-wa-msg" id="cab-wa-msg"></div><button class="cab-wa-copy" onclick="cabCopiarWA()">● Copiar mensaje</button></div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) cabCerrar(); });
  }

  /* =========================================================================
     APERTURA: precarga desde el registro y pinta el formulario correcto
     ========================================================================= */
  function abrirCabina(tipo, recId) {
    injectStyles();
    buildOverlay();
    var rec = getRecord(recId);
    cab.tipo = tipo;
    cab.recId = recId;
    cab.radioSel = -1;
    cab.lastCardHTML = '';

    // Datos que la intranet ya conoce → cero captura doble
    var propietario = fval(rec, 'Nombre Completo') || fval(rec, 'Nombre Propietario') || fval(rec, 'Propietario') || fval(rec, 'Nombre Propiedad') || '';
    var zona = fval(rec, 'Zona') || fval(rec, 'Zona / Colonia') || '';
    var municipio = fval(rec, 'Municipio') || '';
    var direccion = [zona, municipio].filter(Boolean).join(', ');
    var asesorNombre = fval(rec, 'Asesor') || ASESOR_DEFAULT.nombre;
    var folio = fval(rec, 'Folio') || fval(rec, 'Folio NERI') || fval(rec, 'Folio Vendedor') || '';

    cab.prefill = { propietario: propietario, direccion: direccion, asesor: asesorNombre, folio: folio };

    // contexto visible
    byId('cab-ctx-t').textContent = propietario || 'Sin nombre en el registro';
    byId('cab-ctx-s').textContent = (folio ? folio + ' · ' : '') + (direccion || 'Sin zona registrada');

    // reset preview
    byId('cab-empty').style.display = 'flex';
    byId('cab-card-slot').innerHTML = '';
    byId('cab-wa').style.display = 'none';
    var evSlot = byId('cab-evlink'); if (evSlot) { evSlot.style.display = 'none'; evSlot.innerHTML = ''; }
    cab.lastLink = '';

    var conTarjeta = (tipo === 'reporte');
    byId('cab-card-slot').style.display = conTarjeta ? '' : 'none';
    var prevLbl = document.querySelector('#cab-preview .cab-prev-lbl');
    if (prevLbl) prevLbl.textContent = conTarjeta ? 'Vista previa \u00b7 Tarjeta exportable' : 'Confirmaci\u00f3n al cliente \u00b7 Link vivo';

    if (tipo === 'produccion') renderFormProduccion();
    else if (tipo === 'notaria') renderFormNotaria();
    else if (tipo === 'promesa') renderFormPromesa();
    else if (tipo === 'oferta') renderFormOferta();
    else if (tipo === 'reporte') renderFormReporte();

    byId('cab-overlay').classList.add('on');
  }

  function asesorBlock() {
    var a = cab.prefill.asesor || ASESOR_DEFAULT.nombre;
    return ''
      + '<div class="cab-seclabel">Asesor</div>'
      + '<div class="cab-field"><label>Nombre</label><input id="cab_g_asesor" class="prefilled" value="' + esc(a) + '"><div class="cab-prefnote">↳ Tomado del registro · editable</div></div>'
      + '<div class="cab-field-row">'
      + '  <div class="cab-field"><label>Teléfono</label><input id="cab_g_tel" value="' + esc(ASESOR_DEFAULT.tel) + '"></div>'
      + '  <div class="cab-field"><label>Inmobiliaria</label><input id="cab_g_inmo" value="' + esc(ASESOR_DEFAULT.inmo) + '"></div>'
      + '</div>';
  }

  /* ── FORM: Producción ── */
  function renderFormProduccion() {
    byId('cab-form-sub').textContent = 'Producción Inmobiliaria · confirmación al propietario';
    var p = cab.prefill;
    var checks = CHECKLIST.map(function (it, i) {
      return '<label class="cab-check on" for="cab_pc' + i + '"><input type="checkbox" id="cab_pc' + i + '" checked onchange="cabToggle(this)"><span>' + it.n + ' ' + esc(it.t) + '</span></label>';
    }).join('');
    var prods = PRODUCCION.map(function (it, i) {
      return '<label class="cab-checkfull on" for="cab_pp' + i + '"><input type="checkbox" id="cab_pp' + i + '" checked onchange="cabToggle(this)"><div><div class="cab-cf-t">' + it.n + ' ' + esc(it.t) + '</div><div class="cab-cf-s">' + esc(it.s) + '</div></div></label>';
    }).join('');
    byId('cab-scroll').innerHTML =
      asesorBlock()
      + '<div class="cab-seclabel">Sesión</div>'
      + '<div class="cab-field"><label>Propietario</label><input id="cab_p_prop" class="prefilled" value="' + esc(p.propietario) + '"><div class="cab-prefnote">↳ Del registro</div></div>'
      + '<div class="cab-field"><label>Dirección / Zona</label><input id="cab_p_dir" class="prefilled" value="' + esc(p.direccion) + '"><div class="cab-prefnote">↳ Del registro · completa si falta calle</div></div>'
      + '<div class="cab-field-row"><div class="cab-field"><label>Fecha</label><input id="cab_p_fecha" placeholder="Lunes 2 de junio"></div><div class="cab-field"><label>Hora</label><input id="cab_p_hora" placeholder="10:00 am"></div></div>'
      + '<div class="cab-field"><label>Duración</label><select id="cab_p_dur"><option>1 hora aprox.</option><option>1.5 horas aprox.</option><option>2 horas aprox.</option><option>2.5 horas aprox.</option><option>3 horas aprox.</option></select></div>'
      + '<div class="cab-seclabel">Preparación</div><div class="cab-checkgrid">' + checks + '</div>'
      + '<div class="cab-seclabel">Producción</div>' + prods
      + '<button class="cab-btn-gen" onclick="cabGenProduccion()">↳ Generar confirmación</button>'
      + '<button class="cab-btn-wa" id="cab_bp_wa" onclick="cabCopiarWA()">● Copiar mensaje WhatsApp</button>';
  }

  /* ── FORM: Notaría ── */
  function renderFormNotaria() {
    byId('cab-form-sub').textContent = 'Notaría · confirmación al cliente';
    var p = cab.prefill;
    var docs = DOCS.map(function (it, i) {
      return '<label class="cab-checkfull on" for="cab_nd' + i + '"><input type="checkbox" id="cab_nd' + i + '" checked onchange="cabToggle(this)"><div><div class="cab-cf-t">' + it.n + ' ' + esc(it.t) + '</div><div class="cab-cf-s">' + esc(it.s) + '</div></div></label>';
    }).join('');
    byId('cab-scroll').innerHTML =
      asesorBlock()
      + '<div class="cab-seclabel">Cliente</div>'
      + '<div class="cab-field"><label>Nombre del cliente</label><input id="cab_n_cliente" class="prefilled" value="' + esc(p.propietario) + '"><div class="cab-prefnote">↳ Del registro</div></div>'
      + '<div class="cab-field-row"><div class="cab-field"><label>Fecha</label><input id="cab_n_fecha" placeholder="Lunes 2 de junio"></div><div class="cab-field"><label>Hora</label><input id="cab_n_hora" placeholder="11:00 am"></div></div>'
      + '<div class="cab-seclabel">Notaría</div>'
      + '<div class="cab-field"><label>Nombre de la notaría</label><input id="cab_n_notaria" placeholder="Notaría Pública No. 5"></div>'
      + '<div class="cab-field"><label>Notario que recibe</label><input id="cab_n_notario" placeholder="Lic. Juan Pérez"></div>'
      + '<div class="cab-field"><label>Dirección</label><input id="cab_n_dir" placeholder="Calle, número, colonia"></div>'
      + '<div class="cab-field"><label>Referencia / Cómo llegar</label><input id="cab_n_ref" placeholder="Frente al parque, piso 3..."></div>'
      + '<div class="cab-seclabel">Documentos requeridos</div>' + docs
      + '<button class="cab-btn-gen" onclick="cabGenNotaria()">↳ Generar confirmación</button>'
      + '<button class="cab-btn-wa" id="cab_bn_wa" onclick="cabCopiarWA()">● Copiar mensaje WhatsApp</button>';
  }

  /* ── FORM: Promesa de Compraventa ── */
  function renderFormPromesa() {
    byId('cab-form-sub').textContent = 'Promesa de Compraventa · confirmación a las partes';
    var p = cab.prefill;
    byId('cab-scroll').innerHTML =
      asesorBlock()
      + '<div class="cab-seclabel">Firma</div>'
      + '<div class="cab-field"><label>Cliente / Partes</label><input id="cab_m_cliente" class="prefilled" value="' + esc(p.propietario) + '"><div class="cab-prefnote">↳ Del registro · agrega a la otra parte si aplica</div></div>'
      + '<div class="cab-field-row"><div class="cab-field"><label>Fecha</label><input id="cab_m_fecha" placeholder="Lunes 2 de junio"></div><div class="cab-field"><label>Hora</label><input id="cab_m_hora" placeholder="11:00 am"></div></div>'
      + '<div class="cab-field"><label>Lugar de la firma</label><input id="cab_m_lugar" placeholder="Oficina, notaría o domicilio"></div>'
      + '<div class="cab-field"><label>Notas para el cliente</label><textarea id="cab_m_notas" placeholder="Llevar identificación oficial vigente..."></textarea></div>'
      + '<button class="cab-btn-gen" onclick="cabGenPromesa()">↳ Generar confirmación</button>'
      + '<button class="cab-btn-wa" id="cab_bm_wa" onclick="cabCopiarWA()" style="display:none">● Copiar mensaje WhatsApp</button>';
  }

  /* ── FORM: Oferta Formal ── */
  function renderFormOferta() {
    byId('cab-form-sub').textContent = 'Oferta Formal · presentación al propietario';
    var p = cab.prefill;
    byId('cab-scroll').innerHTML =
      asesorBlock()
      + '<div class="cab-seclabel">Oferta</div>'
      + '<div class="cab-field"><label>Propietario</label><input id="cab_o_prop" class="prefilled" value="' + esc(p.propietario) + '"><div class="cab-prefnote">↳ Del registro</div></div>'
      + '<div class="cab-field"><label>Monto de la oferta</label><input id="cab_o_monto" placeholder="$3,850,000 MXN"></div>'
      + '<div class="cab-field"><label>Condiciones</label><textarea id="cab_o_cond" placeholder="Forma de pago, crédito, plazos, contingencias..."></textarea></div>'
      + '<div class="cab-field-row"><div class="cab-field"><label>Vigencia</label><input id="cab_o_vig" placeholder="72 horas a partir de hoy"></div><div class="cab-field"><label>Fecha de presentación</label><input id="cab_o_fecha" placeholder="Viernes 12 de junio"></div></div>'
      + '<div class="cab-field"><label>Notas para el propietario</label><textarea id="cab_o_notas" placeholder="Contexto de la oferta, perfil del comprador..."></textarea></div>'
      + '<button class="cab-btn-gen" onclick="cabGenOferta()">↳ Generar oferta</button>'
      + '<button class="cab-btn-wa" id="cab_bo_wa" onclick="cabCopiarWA()" style="display:none">● Copiar mensaje WhatsApp</button>';
  }

  /* ── FORM: Reporte (v1 manual; la versión con datos reales/campañas viene después) ── */
  function renderFormReporte() {
    byId('cab-form-sub').textContent = 'Reporte semanal · análisis (v1)';
    var p = cab.prefill;
    var radios = AJUSTES.map(function (it, i) {
      return '<label class="cab-radio" id="cab_ri' + i + '" onclick="cabRadio(' + i + ')"><input type="radio" name="cab_ajuste" value="' + i + '"><div><div class="t">' + esc(it.t) + '</div><div class="s">' + esc(it.s) + '</div></div></label>';
    }).join('');
    byId('cab-scroll').innerHTML =
      '<div class="cab-acc-locked" style="margin-bottom:14px">Esta es la versión manual del reporte. La versión que se llena sola con leads, citas y campañas (Meta / Pixel) llega en una etapa posterior.</div>'
      + asesorBlock()
      + '<div class="cab-seclabel">Identificación</div>'
      + '<div class="cab-field"><label>Propietario / Vendedor</label><input id="cab_r_prop" class="prefilled" value="' + esc(p.propietario) + '"></div>'
      + '<div class="cab-field"><label>Propiedad / Dirección</label><input id="cab_r_dir" class="prefilled" value="' + esc(p.direccion) + '"></div>'
      + '<div class="cab-field"><label>Período del reporte</label><input id="cab_r_semana" placeholder="1 al 15 de mayo, 2025"></div>'
      + '<div class="cab-seclabel">Métricas</div><div class="cab-metrics">'
      + '<div class="cab-field"><label>Alcance</label><input id="cab_r_alcance"></div>'
      + '<div class="cab-field"><label>Reproducciones</label><input id="cab_r_repro"></div>'
      + '<div class="cab-field"><label>Clics</label><input id="cab_r_clics"></div>'
      + '<div class="cab-field"><label>Leads totales</label><input id="cab_r_leads"></div>'
      + '<div class="cab-field"><label>Leads calificados</label><input id="cab_r_lcal"></div>'
      + '<div class="cab-field"><label>Visitas</label><input id="cab_r_visitas"></div>'
      + '<div class="cab-field"><label>Presupuesto ($)</label><input id="cab_r_presupuesto"></div>'
      + '<div class="cab-field"><label>Costo/lead ($)</label><input id="cab_r_cpl"></div>'
      + '</div>'
      + '<div class="cab-seclabel">Análisis</div>'
      + '<div class="cab-field"><label>Comentarios frecuentes</label><textarea id="cab_r_comentarios" placeholder="Qué preguntan más los interesados..."></textarea></div>'
      + '<div class="cab-field"><label>Observaciones del asesor</label><textarea id="cab_r_obs" placeholder="Contexto del mercado en este período..."></textarea></div>'
      + '<div class="cab-seclabel">Ajuste estratégico</div>' + radios
      + '<button class="cab-btn-gen" onclick="cabGenReporte()">↳ Generar reporte</button>'
      + '<button class="cab-btn-print" id="cab_br_print" onclick="cabImprimir()">⬇ Guardar / Imprimir</button>'
      + '<button class="cab-btn-wa" id="cab_br_wa" onclick="cabCopiarWA()">● Copiar mensaje WhatsApp</button>';
  }

  /* =========================================================================
     GENERADORES
     ========================================================================= */
  function showCard(html) {
    byId('cab-empty').style.display = 'none';
    byId('cab-card-slot').innerHTML = html;
    cab.lastCardHTML = html;
  }
  function showWA(msg) {
    cab.lastWaMsg = msg;
    byId('cab-wa-msg').textContent = msg;
    byId('cab-wa').style.display = 'block';
  }
  function cardHeader(a, tag, h, sub) {
    return '<div class="cab-c-header"><div><div class="cab-c-name">' + esc(a.nombre) + '</div>'
      + '<div class="cab-c-meta">Asesor Inmobiliario · ' + esc(a.inmo) + ' · ' + esc(a.tel) + '</div></div>'
      + '<div>' + logoSVG(a.inmo) + '</div></div>'
      + '<div class="cab-c-hero"><div class="cab-c-tag">' + esc(tag) + '</div><div class="cab-c-h">' + esc(h) + '</div>'
      + (sub ? '<div class="cab-c-sub">' + esc(sub) + '</div>' : '') + '</div>';
  }
  function cardFooter(a, msg) {
    return '<div class="cab-c-footer"><div class="cab-c-fmsg">' + esc(msg) + '</div><div class="cab-c-ftel">' + esc(a.tel) + '</div></div>';
  }
  function secbar(label) {
    return '<div class="cab-secbar"><div class="cab-secbar-l">' + esc(label) + '</div><div class="cab-secbar-line"></div></div>';
  }

  function cabGenProduccion() {
    var a = asesorActual();
    var prop = byId('cab_p_prop').value || '—';
    var dir = byId('cab_p_dir').value || '—';
    var fecha = byId('cab_p_fecha').value || '—';
    var hora = byId('cab_p_hora').value || '—';
    var dur = byId('cab_p_dur').value || '—';
    var checksHTML = CHECKLIST.map(function (it, i) {
      return byId('cab_pc' + i) && byId('cab_pc' + i).checked
        ? '<div class="cab-r"><div class="cab-rnum">' + it.n + '</div><div><div class="cab-rt">' + esc(it.t) + '</div><div class="cab-rs">' + esc(it.s) + '</div></div></div>' : '';
    }).join('');
    var prodHTML = PRODUCCION.map(function (it, i) {
      return byId('cab_pp' + i) && byId('cab_pp' + i).checked
        ? '<div class="cab-prod"><div class="cab-prodnum">' + it.n + '</div><div class="cab-rt">' + esc(it.t) + '</div><div class="cab-rs">' + esc(it.s) + '</div></div>' : '';
    }).join('');
    var html = '<div class="cab-card" id="cab-card">'
      + cardHeader(a, 'Producción Inmobiliaria', 'SESIÓN DE FOTO Y VIDEO', 'Preparamos su propiedad para presentarla en su mejor versión.')
      + '<div class="cab-c-body">'
      + secbar('Detalles de la sesión')
      + '<div class="cab-dgrid"><div class="cab-dcell"><div class="cab-dlbl">Propietario</div><div class="cab-dval gold">' + esc(prop) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Dirección</div><div class="cab-dval">' + esc(dir) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Fecha</div><div class="cab-dval">' + esc(fecha) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Hora de llegada</div><div class="cab-dval">' + esc(hora) + '</div></div>'
      + '<div class="cab-dcell full"><div class="cab-dlbl">Duración estimada</div><div class="cab-dval">' + esc(dur) + '</div></div></div>'
      + '<div class="cab-c-sp"></div>' + secbar('Cómo preparar la propiedad') + '<div class="cab-rowgrid">' + checksHTML + '</div>'
      + '<div class="cab-c-sp"></div>' + secbar('Qué produciremos') + '<div class="cab-prodgrid">' + prodHTML + '</div>'
      + '</div>' + cardFooter(a, 'Método Neri · Sistema de Control de Calidad Inmobiliaria') + '</div>';
    showCard(html);
    var n0 = prop.split(' ')[0];
    var msg = 'Hola ' + n0 + ' 🏡\n\nLlegó el momento que estábamos esperando — pronto damos a conocer a la estrella de este proceso: *su propiedad*.\n\n📅 *Fecha:* ' + fecha + '\n🕐 *Hora de llegada del equipo:* ' + hora + '\n⏱ *Duración estimada:* ' + dur + '\n\nLe comparto la confirmación con todo lo que necesitamos tener listo para que su propiedad luzca en su mejor versión.\n\nCualquier ajuste, con gusto lo atendemos con anticipación.\n\n— ' + a.nombre + '\n📲 ' + a.tel + '\n*Método Neri · Sistema de Control de Calidad Inmobiliaria*';
    showWA(msg);
    showActionButtons('cab_bp_print', 'cab_bp_wa');
    cabCrearEvento('Producción Inmobiliaria', { estado: 'Confirmada', fields: { 'Cliente': prop, 'Propiedad': dir, 'Lugar': dir, 'Fecha': fecha, 'Hora': hora, 'Notas': 'Duración estimada: ' + dur + (function(){ var p = CHECKLIST.filter(function(it,i){ return byId('cab_pc'+i) && byId('cab_pc'+i).checked; }).map(function(it){ return it.t; }); return p.length ? '\nCómo preparar la propiedad: ' + p.join(', ') + '.' : ''; })() } }, function (err, ev) {
      if (err || !ev) { showEventoError(); return; }
      showEventoLink(ev.link, ev.folio);
      showWA(msg + '\n\n🔗 *Su confirmación en línea (siempre actualizada):*\n' + ev.link);
    });
  }

  function cabGenNotaria() {
    var a = asesorActual();
    var cliente = byId('cab_n_cliente').value || '—';
    var fecha = byId('cab_n_fecha').value || '—';
    var hora = byId('cab_n_hora').value || '—';
    var notaria = byId('cab_n_notaria').value || '—';
    var notario = byId('cab_n_notario').value || '—';
    var dir = byId('cab_n_dir').value || '—';
    var ref = byId('cab_n_ref').value || '—';
    var docsHTML = DOCS.map(function (it, i) {
      return byId('cab_nd' + i) && byId('cab_nd' + i).checked
        ? '<div class="cab-doc"><div class="cab-rnum">' + it.n + '</div><div><div class="cab-rt">' + esc(it.t) + '</div><div class="cab-rs">' + esc(it.s) + '</div></div></div>' : '';
    }).join('');
    var html = '<div class="cab-card" id="cab-card">'
      + cardHeader(a, 'Cita en Notaría', 'CONFIRMACIÓN DE FIRMA', 'Todo está listo para la formalización de su operación.')
      + '<div class="cab-c-body">'
      + secbar('Datos de la cita')
      + '<div class="cab-dgrid"><div class="cab-dcell"><div class="cab-dlbl">Cliente</div><div class="cab-dval gold">' + esc(cliente) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Notaría</div><div class="cab-dval">' + esc(notaria) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Fecha</div><div class="cab-dval">' + esc(fecha) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Hora</div><div class="cab-dval">' + esc(hora) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Notario que recibe</div><div class="cab-dval">' + esc(notario) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Referencia</div><div class="cab-dval">' + esc(ref) + '</div></div>'
      + '<div class="cab-dcell full"><div class="cab-dlbl">Dirección</div><div class="cab-dval">' + esc(dir) + '</div></div></div>'
      + '<div class="cab-c-sp"></div>' + secbar('Documentos que debe llevar') + '<div class="cab-docs">' + docsHTML + '</div>'
      + '</div>' + cardFooter(a, 'Método Neri · Acompañamiento hasta la firma') + '</div>';
    showCard(html);
    var n0 = cliente.split(' ')[0];
    var msg = 'Hola ' + n0 + ',\n\nTodo está listo para su cita en notaría. Le confirmo los datos:\n\n📅 *Fecha:* ' + fecha + '\n🕐 *Hora:* ' + hora + '\n🏛 *Notaría:* ' + notaria + '\n📍 *Dirección:* ' + dir + '\n\nLe recomiendo llegar 10 minutos antes. En la tarjeta adjunta encontrará la lista completa de documentos que debe llevar.\n\nCualquier ajuste, con gusto lo coordino con anticipación.\n\n— ' + a.nombre + '\n📲 ' + a.tel + '\n*Método Neri · Sistema de Control de Calidad Inmobiliaria*';
    showWA(msg);
    showActionButtons('cab_bn_print', 'cab_bn_wa');
    cabCrearEvento('Firma en Notaría', { estado: 'Confirmada', fields: { 'Cliente': cliente, 'Propiedad': cab.prefill.direccion || '', 'Lugar': notaria + (dir !== '—' ? ' · ' + dir : ''), 'Fecha': fecha, 'Hora': hora, 'Notas': 'Recibe: ' + notario + (ref !== '—' ? ' · Referencia: ' + ref : '') } }, function (err, ev) {
      if (err || !ev) { showEventoError(); return; }
      showEventoLink(ev.link, ev.folio);
      showWA(msg + '\n\n🔗 *Su confirmación en línea (siempre actualizada):*\n' + ev.link);
    });
  }

  function cabGenPromesa() {
    var a = asesorActual();
    var cliente = byId('cab_m_cliente').value || '—';
    var fecha = byId('cab_m_fecha').value || '—';
    var hora = byId('cab_m_hora').value || '—';
    var lugar = byId('cab_m_lugar').value || '—';
    var notas = byId('cab_m_notas').value || '';
    var html = '<div class="cab-card" id="cab-card">'
      + cardHeader(a, 'Promesa de Compraventa', 'CONFIRMACIÓN DE FIRMA', 'Formalización del acuerdo entre las partes.')
      + '<div class="cab-c-body">' + secbar('Datos de la firma')
      + '<div class="cab-dgrid"><div class="cab-dcell"><div class="cab-dlbl">Cliente</div><div class="cab-dval gold">' + esc(cliente) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Lugar</div><div class="cab-dval">' + esc(lugar) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Fecha</div><div class="cab-dval">' + esc(fecha) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Hora</div><div class="cab-dval">' + esc(hora) + '</div></div></div>'
      + (notas ? '<div class="cab-c-sp"></div>' + secbar('Notas') + '<div class="cab-analysis"><div class="cab-an-txt">' + esc(notas) + '</div></div>' : '')
      + '</div>' + cardFooter(a, 'Método Neri · Acompañamiento hasta la firma') + '</div>';
    showCard(html);
    var n0 = cliente.split(' ')[0];
    var msg = 'Hola ' + n0 + ',\n\nTodo está listo para la firma de la promesa de compraventa. Le confirmo los datos:\n\n📅 *Fecha:* ' + fecha + '\n🕐 *Hora:* ' + hora + '\n📍 *Lugar:* ' + lugar + '\n\nCualquier ajuste, con gusto lo coordino con anticipación.\n\n— ' + a.nombre + '\n📲 ' + a.tel + '\n*Método Neri · Sistema de Control de Calidad Inmobiliaria*';
    showWA(msg);
    showActionButtons('cab_bm_wa', 'cab_bm_wa');
    cabCrearEvento('Promesa de Compraventa', { estado: 'Confirmada', fields: { 'Cliente': cliente, 'Propiedad': cab.prefill.direccion || '', 'Lugar': lugar, 'Fecha': fecha, 'Hora': hora, 'Notas': notas } }, function (err, ev) {
      if (err || !ev) { showEventoError(); return; }
      showEventoLink(ev.link, ev.folio);
      showWA(msg + '\n\n🔗 *Su confirmación en línea (siempre actualizada):*\n' + ev.link);
    });
  }

  function cabGenOferta() {
    var a = asesorActual();
    var prop = byId('cab_o_prop').value || '—';
    var monto = byId('cab_o_monto').value || '—';
    var cond = byId('cab_o_cond').value || '';
    var vig = byId('cab_o_vig').value || '';
    var fecha = byId('cab_o_fecha').value || '—';
    var notas = byId('cab_o_notas').value || '';
    var html = '<div class="cab-card" id="cab-card">'
      + cardHeader(a, 'Oferta Formal', 'OFERTA DE COMPRA', 'Presentada formalmente para su revisión y decisión.')
      + '<div class="cab-c-body">' + secbar('La oferta')
      + '<div class="cab-dgrid"><div class="cab-dcell"><div class="cab-dlbl">Propietario</div><div class="cab-dval gold">' + esc(prop) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Monto</div><div class="cab-dval gold">' + esc(monto) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Presentada</div><div class="cab-dval">' + esc(fecha) + '</div></div>'
      + (vig ? '<div class="cab-dcell"><div class="cab-dlbl">Vigencia</div><div class="cab-dval">' + esc(vig) + '</div></div>' : '') + '</div>'
      + (cond ? '<div class="cab-c-sp"></div>' + secbar('Condiciones') + '<div class="cab-analysis"><div class="cab-an-txt">' + esc(cond) + '</div></div>' : '')
      + (notas ? '<div class="cab-c-sp"></div>' + secbar('Notas') + '<div class="cab-analysis"><div class="cab-an-txt">' + esc(notas) + '</div></div>' : '')
      + '</div>' + cardFooter(a, 'Método Neri · Decisiones con información, sin presión') + '</div>';
    showCard(html);
    var n0 = prop.split(' ')[0];
    var msg = 'Hola ' + n0 + ',\n\nLe presento formalmente una oferta de compra por su propiedad:\n\n💰 *Monto:* ' + monto + (vig ? '\n⏳ *Vigencia:* ' + vig : '') + '\n\nEn el link encontrará el detalle completo con las condiciones. Tómese el tiempo que necesite; estoy para resolver cualquier duda y la decisión es completamente suya.\n\n— ' + a.nombre + '\n📲 ' + a.tel + '\n*Método Neri · Decisiones con información, sin presión*';
    showWA(msg);
    showActionButtons('cab_bo_wa', 'cab_bo_wa');
    cabCrearEvento('Oferta Formal', { estado: 'Enviada', fields: { 'Cliente': prop, 'Propiedad': cab.prefill.direccion || '', 'Monto Oferta': monto, 'Condiciones Oferta': cond, 'Vigencia Oferta': vig, 'Fecha': fecha, 'Notas': notas } }, function (err, ev) {
      if (err || !ev) { showEventoError(); return; }
      showEventoLink(ev.link, ev.folio);
      showWA(msg + '\n\n🔗 *Vea la oferta completa aquí:*\n' + ev.link);
    });
  }

  function cabGenReporte() {
    var a = asesorActual();
    var prop = byId('cab_r_prop').value || '—';
    var dir = byId('cab_r_dir').value || '—';
    var semana = byId('cab_r_semana').value || '—';
    var get = function (k) { var el = byId('cab_r_' + k); return el && el.value ? el.value : '—'; };
    var cells = [['alcance', 'Alcance'], ['repro', 'Reproducciones'], ['clics', 'Clics'], ['leads', 'Leads totales'], ['lcal', 'Leads calificados'], ['visitas', 'Visitas'], ['presupuesto', 'Presupuesto'], ['cpl', 'Costo / lead']];
    var metricHTML = cells.map(function (c) {
      var v = get(c[0]); var pre = (c[0] === 'presupuesto' || c[0] === 'cpl') && v !== '—' ? '$' : '';
      return '<div class="cab-dcell"><div class="cab-dlbl">' + c[1] + '</div><div class="cab-dval gold">' + pre + esc(v) + '</div></div>';
    }).join('');
    var ajusteHTML = AJUSTES.map(function (it, i) {
      var on = i === cab.radioSel;
      return '<div class="cab-aj"><div class="cab-ajdot' + (on ? ' on' : '') + '"></div><div><div class="cab-rt">' + esc(it.t) + '</div><div class="cab-rs">' + esc(it.s) + '</div></div></div>';
    }).join('');
    var coment = byId('cab_r_comentarios').value || 'Sin comentarios registrados.';
    var obs = byId('cab_r_obs').value || 'Sin observaciones.';
    var html = '<div class="cab-card" id="cab-card">'
      + cardHeader(a, 'Reporte Semanal', 'RESULTADOS DEL PERÍODO', 'Período: ' + semana)
      + '<div class="cab-c-body">'
      + secbar('Identificación')
      + '<div class="cab-dgrid"><div class="cab-dcell"><div class="cab-dlbl">Propietario</div><div class="cab-dval gold">' + esc(prop) + '</div></div>'
      + '<div class="cab-dcell"><div class="cab-dlbl">Propiedad</div><div class="cab-dval">' + esc(dir) + '</div></div></div>'
      + '<div class="cab-c-sp"></div>' + secbar('Métricas') + '<div class="cab-dgrid">' + metricHTML + '</div>'
      + '<div class="cab-c-sp"></div>' + secbar('Análisis')
      + '<div class="cab-analysis"><div class="cab-an-lbl">Comentarios frecuentes</div><div class="cab-an-txt">' + esc(coment) + '</div></div>'
      + '<div class="cab-analysis"><div class="cab-an-lbl">Observaciones del asesor</div><div class="cab-an-txt">' + esc(obs) + '</div></div>'
      + '<div class="cab-c-sp"></div>' + secbar('Ajuste estratégico') + ajusteHTML
      + '</div>' + cardFooter(a, 'Método Neri · Transparencia total en cada etapa') + '</div>';
    showCard(html);
    var ajusteTxt = cab.radioSel >= 0 ? AJUSTES[cab.radioSel].t : 'Pendiente de definir';
    var n0 = prop.split(' ')[0];
    var msg = 'Hola ' + n0 + ',\n\nAquí está el reporte de resultados de su propiedad.\n\n📊 *Resultados del período ' + semana + ':*\n• Alcance: ' + get('alcance') + ' personas\n• Leads recibidos: ' + get('leads') + '\n• Leads calificados: ' + get('lcal') + '\n\n📌 *Decisión estratégica para el siguiente período:*\n' + ajusteTxt + '\n\nCualquier pregunta sobre los datos, con gusto la revisamos.\n\n— ' + a.nombre + '\n📲 ' + a.tel + '\n*Método Neri · Transparencia total en cada etapa*';
    showWA(msg);
    showActionButtons('cab_br_print', 'cab_br_wa');
  }

  function showActionButtons(printId, waId) {
    var p = byId(printId), w = byId(waId);
    if (p) p.style.display = 'block';
    if (w) w.style.display = 'block';
  }

  /* ── EVENTOS OPERACIÓN: registro en Airtable + link vivo (Confirmacion.html) ── */
  var EV_TABLE = 'tblaYhT3EUT0m5FYV';
  var EV_PREF = { 'Producción Inmobiliaria': 'PROD', 'Promesa de Compraventa': 'PROM', 'Firma en Notaría': 'NOT', 'Oferta Formal': 'OFE' };
  function cabFolioEvento(tipo) {
    var p = EV_PREF[tipo] || 'EV';
    return 'EV-' + p + '-' + (new Date()).getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
  }
  function cabCrearEvento(tipo, datos, cb) {
    if (typeof window.atFetch !== 'function') { cb(new Error('atFetch no disponible')); return; }
    var folio = cabFolioEvento(tipo);
    var a = asesorActual();
    var fields = {
      'Folio Evento': folio,
      'Tipo Evento': tipo,
      'Estado': datos.estado || 'Pendiente',
      'Asesor': a.nombre || '',
      'WhatsApp Asesor': String(a.tel || '').replace(/\D/g, ''),
      'Folio Lead Origen': (cab.prefill && cab.prefill.folio) || ''
    };
    Object.keys(datos.fields || {}).forEach(function (k) { fields[k] = datos.fields[k]; });
    window.atFetch(EV_TABLE, { method: 'POST', body: JSON.stringify({ fields: fields, typecast: true }) })
      .then(function () { cb(null, { folio: folio, link: location.origin + '/Confirmacion.html?evento=' + folio }); })
      .catch(function (e) { cb(e); });
  }
  function showEventoLink(link, folio) {
    var slot = byId('cab-evlink');
    if (!slot) {
      slot = document.createElement('div'); slot.id = 'cab-evlink';
      var wa = byId('cab-wa'); wa.parentNode.insertBefore(slot, wa);
    }
    slot.innerHTML = '<div class="cab-ev-lbl">Link de confirmación · vivo</div>'
      + '<div class="cab-ev-url">' + esc(link) + '</div>'
      + '<div class="cab-ev-row"><button class="cab-wa-copy" onclick="cabCopiarLink(this)">● Copiar link</button>'
      + '<a class="cab-wa-copy" style="text-decoration:none" href="' + esc(link) + '" target="_blank" rel="noopener">↗ Abrir</a>'
      + '<button class="cab-wa-copy" onclick="cabEnviarWA()">↗ Enviar por WhatsApp</button></div>'
      + '<div class="cab-ev-folio">' + esc(folio) + ' · Cambia el Estado en Eventos Operación y el link del cliente se actualiza solo.</div>';
    slot.style.display = 'block';
    cab.lastLink = link;
  }
  function showEventoError() {
    var slot = byId('cab-evlink');
    if (!slot) {
      slot = document.createElement('div'); slot.id = 'cab-evlink';
      var wa = byId('cab-wa'); wa.parentNode.insertBefore(slot, wa);
    }
    slot.innerHTML = '<div class="cab-ev-lbl">Link de confirmación</div>'
      + '<div class="cab-ev-folio" style="margin-top:7px">No se pudo crear el evento en Airtable. Revisa tu sesión e intenta de nuevo.</div>';
    slot.style.display = 'block';
  }
  function cabCopiarLink(btn) {
    if (!cab.lastLink) return;
    navigator.clipboard.writeText(cab.lastLink).then(function () {
      var o = btn.textContent; btn.textContent = '✓ Copiado';
      setTimeout(function () { btn.textContent = o; }, 2000);
    });
  }
  /* Enviar al propietario el mensaje (ya incluye el link) por WhatsApp. La cita ya está confirmada: esto es solo para darle formalidad. */
  function cabEnviarWA() {
    var t = cab.lastWaMsg || cab.lastLink || '';
    if (!t) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
  }

  /* ── Toggles / radio ── */
  function cabToggle(cb) {
    var p = cb.closest('.cab-check,.cab-checkfull');
    if (p) cb.checked ? p.classList.add('on') : p.classList.remove('on');
  }
  function cabRadio(i) {
    cab.radioSel = i;
    AJUSTES.forEach(function (_, j) {
      var el = byId('cab_ri' + j);
      if (el) el.classList.toggle('on', j === i);
    });
  }

  /* ── Imprimir / copiar ── */
  var PRINT_CSS = "@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{background:#0A0A0A;display:flex;justify-content:center;padding:0;color:#fff;font-family:'Montserrat',sans-serif;}";
  function cabImprimir() {
    if (!cab.lastCardHTML) return;
    var styleEl = byId('cab-styles');
    var win = window.open('', '_blank', 'width=760,height=900,scrollbars=yes');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' + PRINT_CSS + '</style><style id="cab-styles">' + (styleEl ? styleEl.textContent : '') + '</style></head><body><div id="cab-overlay" class="on" style="position:static;background:none;display:block"><div id="cab-card-slot">' + cab.lastCardHTML + '</div></div><div onclick="window.print()" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#C6A86B;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:11px 22px;border-radius:3px;cursor:pointer">● Guardar / Imprimir</div></body></html>');
    win.document.close();
    win.onload = function () { setTimeout(function () { win.print(); }, 1000); };
  }
  function cabCopiarWA() {
    var txt = byId('cab-wa-msg');
    if (!txt || !txt.textContent) return;
    navigator.clipboard.writeText(txt.textContent).then(function () {
      var btn = document.querySelector('#cab-wa .cab-wa-copy');
      if (!btn) return;
      var o = btn.textContent; btn.textContent = '✓ Copiado';
      setTimeout(function () { btn.textContent = o; }, 2000);
    });
  }
  function cabCerrar() { var o = byId('cab-overlay'); if (o) o.classList.remove('on'); }

  /* =========================================================================
     EXPEDIENTE DOCUMENTAL: arma el link del propietario y maneja subidas
     ========================================================================= */
  /* El expediente del propietario SIEMPRE se llave con el Folio + Token del LEAD VENDEDOR.
     Desde la ficha de PROPIEDADES, rec es una Propiedad NERI (sin campo Folio ni Token):
     resolvemos el lead vendedor vinculado por su Folio Vendedor (= Folio del lead). */
  function leadVendedorDeRec(rec) {
    if (!rec) return null;
    if (fval(rec, 'Token Expediente')) return null;           // rec ya es el lead vendedor
    var fv = fval(rec, 'Folio Vendedor');
    if (!fv) return null;
    try {
      if (typeof crmVendedoresFolioIndex === 'object' && crmVendedoresFolioIndex) {
        var key = (typeof crmNormalizeFolio === 'function')
          ? crmNormalizeFolio(fv)
          : String(fv).trim().toUpperCase();
        return crmVendedoresFolioIndex[key] || null;
      }
    } catch (_) {}
    return null;
  }
  /* Folio del expediente: SIEMPRE el del lead vendedor, nunca el Folio NERI de la propiedad. */
  function folioExpedienteDe(rec) {
    var lead = leadVendedorDeRec(rec);
    if (lead) return fval(lead, 'Folio') || '';
    return fval(rec, 'Folio') || fval(rec, 'Folio Vendedor') || '';
  }
  function expedienteSource(rec) {
    var lead = leadVendedorDeRec(rec);
    return lead || rec || null;
  }
  function normalizarExpedienteLink(linkGuardado, folio, token) {
    var f = String(folio || '').trim();
    var t = String(token || '').trim();
    var guardado = String(linkGuardado || '').trim();

    if (guardado) {
      try {
        var base = String(EXP_DOC_BASE).replace(/\/+$/, '') + '/';
        var url = new URL(guardado, base);
        if (!url.searchParams.get('folio') && f) url.searchParams.set('folio', f);
        if (!url.searchParams.get('token') && t) url.searchParams.set('token', t);
        if (url.searchParams.get('folio') && url.searchParams.get('token')) return url.toString();
      } catch (_) {
        if (guardado.indexOf('folio=') > -1 && guardado.indexOf('token=') > -1) return guardado;
      }
    }

    if (f && t) {
      return String(EXP_DOC_BASE).replace(/\/+$/, '')
        + '/?folio=' + encodeURIComponent(f)
        + '&token=' + encodeURIComponent(t);
    }
    return '';
  }
  function expedienteLink(rec) {
    var src = expedienteSource(rec);
    var folio = fval(src, 'Folio') || fval(rec, 'Folio Vendedor') || '';
    var token = fval(src, 'Token Expediente') || fval(src, 'Token') || fval(rec, 'Token Expediente') || fval(rec, 'Token') || '';
    var guardado = fval(src, 'Link Expediente Documental') || fval(rec, 'Link Expediente Documental') || '';
    return normalizarExpedienteLink(guardado, folio, token);
  }
  function cabAvisoExpediente(recId, msg) {
    var el = byId('cab-doc-status-' + recId);
    if (el) {
      el.style.display = 'block';
      el.style.color = '#ff6b6b';
      el.textContent = msg;
    } else {
      window.alert(msg);
    }
  }
  function copiarTexto(txt, btn) {
    function ok() { if (btn) { var o = btn.textContent; btn.textContent = '✓ Copiado'; setTimeout(function () { btn.textContent = o; }, 1600); } }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok).catch(function () { window.prompt('Copia el texto:', txt); });
    } else { window.prompt('Copia el texto:', txt); }
  }
  /* Copiar el link del expediente documental del propietario */
  function cabCopiarExpediente(recId, btn) {
    var rec = getRecord(recId); if (!rec) return;
    var link = expedienteLink(rec);
    if (!link) { cabAvisoExpediente(recId, 'No copié el link: falta Token Expediente o Link Expediente Documental completo en Airtable.'); return; }
    copiarTexto(link, btn);
  }
  /* Abrir el expediente documental en otra pestaña */
  function cabAbrirExpediente(recId) {
    var rec = getRecord(recId); if (!rec) return;
    var link = expedienteLink(rec);
    if (!link) { cabAvisoExpediente(recId, 'No abrí el expediente: falta Token Expediente o Link Expediente Documental completo en Airtable.'); return; }
    window.open(link, '_blank', 'noopener');
  }
  /* Enviar el link del expediente directo al WhatsApp del propietario (un clic, sin copiar/pegar) */
  function cabEnviarExpediente(recId) {
    var rec = getRecord(recId); if (!rec) return;
    var src = expedienteSource(rec) || rec;
    var link = expedienteLink(rec);
    if (!link) { cabAvisoExpediente(recId, 'No envié WhatsApp: falta Token Expediente o Link Expediente Documental completo en Airtable. Así evitamos mandar un link roto.'); return; }
    var nombre = String(fval(src, 'Nombre Completo') || fval(rec, 'Nombre Completo') || '').split(' ')[0];
    var asesor = fval(src, 'Asesor') || fval(rec, 'Asesor') || (cab.prefill && cab.prefill.asesor) || ASESOR_DEFAULT.nombre;
    var tel = String(fval(src, 'Teléfono WhatsApp') || fval(rec, 'Teléfono WhatsApp') || '').replace(/\D/g, '');
    if (!tel) { cabAvisoExpediente(recId, 'No envié WhatsApp: este registro no tiene Teléfono WhatsApp.'); return; }
    var num = tel.length === 10 ? '52' + tel : tel;
    var msg = 'Hola' + (nombre ? ' ' + nombre : '') + ', aquí tienes tu expediente documental de Método Neri. Desde este link puedes subir tus documentos de forma segura y a tu ritmo:\n\n' + link + '\n\nCualquier duda quedo a tus órdenes.\n— ' + asesor;
    window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank');
  }
  /* El ASESOR sube un documento que recibió por otro medio (WhatsApp, correo…) */
  function cabSubirDocAsesor(recId) {
    var inp = byId('cab-doc-file-' + recId);
    if (inp) inp.click();
  }
  function cabSessionToken() {
    try { if (typeof SESSION !== 'undefined' && SESSION && SESSION.token) return SESSION.token; } catch (_) {}
    try {
      var raw = sessionStorage.getItem('neri_signed_session_v1');
      if (raw) { var parsed = JSON.parse(raw); return parsed && parsed.token ? parsed.token : ''; }
    } catch (_) {}
    return '';
  }
  /* Deduce el MIME del documento (algunos archivos llegan sin file.type) */
  function cabMimeDoc(file) {
    var t = (file && file.type ? String(file.type) : '').toLowerCase();
    if (t) return t;
    var n = (file && file.name ? String(file.name) : '').toLowerCase();
    if (/\.pdf$/.test(n)) return 'application/pdf';
    if (/\.(jpe?g)$/.test(n)) return 'image/jpeg';
    if (/\.png$/.test(n)) return 'image/png';
    if (/\.webp$/.test(n)) return 'image/webp';
    if (/\.(heic|heif)$/.test(n)) return 'image/heic';
    return 'application/octet-stream';
  }
  function cabDocSeleccionado(recId, inputEl) {
    var file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;
    var st = byId('cab-doc-status-' + recId);
    if (st) { st.style.display = 'block'; st.innerHTML = 'Preparando subida segura de <b>' + esc(file.name) + '</b>…'; }
    var rec = getRecord(recId);
    var folio = rec ? folioExpedienteDe(rec) : '';
    var ct = cabMimeDoc(file);
    // Subida directa a iDrive e2 (PUT firmado): el archivo NO pasa por la función de Vercel,
    // por lo que se evita el límite de ~4.5 MB del cuerpo y deja de congelarse con fotos/PDF grandes.
    fetch('/api/upload-idrive-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cabSessionToken() },
      body: JSON.stringify({ filename: file.name, contentType: ct, size: file.size, folio: folio || 'sin-folio', doc: 'documento' })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (pre) {
        if (!pre.ok || !pre.j || !pre.j.uploadUrl) throw new Error((pre.j && pre.j.error) || 'No se pudo preparar la subida.');
        if (st) st.innerHTML = 'Subiendo <b>' + esc(file.name) + '</b>…';
        var cfg = pre.j;
        return fetch(cfg.uploadUrl, { method: 'PUT', headers: { 'Content-Type': ct }, body: file })
          .then(function (put) {
            if (!put.ok) throw new Error('iDrive respondió HTTP ' + put.status);
            return cfg;
          });
      })
      .then(function (cfg) {
        var viewUrl = location.origin + '/api/idrive-read-url?url=' + encodeURIComponent(cfg.url);
        if (st) st.innerHTML =
          '<div style="color:var(--gold,#C6A86B);margin-bottom:6px">✓ Documento subido</div>'
          + '<div style="font-size:11px;color:rgba(255,255,255,.55);word-break:break-all;margin-bottom:8px"><a href="' + esc(viewUrl) + '" target="_blank" rel="noopener" style="color:var(--gold,#C6A86B)">Ver documento</a></div>'
          + '<button class="cab-acc-btn ghost" onclick="copiarTextoExpediente(\'' + viewUrl.replace(/'/g, "\\'") + '\', this)">Copiar liga · pégala en el campo Documentos</button>';
      })
      .catch(function (e) {
        if (st) st.innerHTML = '<span style="color:#f87171">No se pudo subir: ' + esc(e.message) + '</span>';
      });
  }

  /* =========================================================================
     INTEGRACIÓN CON LA FICHA: inyecta la barra de acciones según la etapa
     ========================================================================= */
  function expedienteHTML(recId) {
    return ''
      + '<div class="cab-acc-grid" style="margin-top:8px;flex-direction:column;align-items:stretch">'
      + '  <div class="cab-acc-title" style="font-size:11px;letter-spacing:1.6px"><em>▸</em> Expediente documental del propietario</div>'
      + '  <div class="cab-acc-hint">Este es el portal donde <b>el propietario sube sus documentos</b> (no es el portal de progreso del cliente).</div>'
      + '  <div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '    <button class="cab-acc-btn" onclick="cabEnviarExpediente(\'' + recId + '\')">Enviar link del expediente<small>Directo al WhatsApp del propietario</small></button>'
      + '    <button class="cab-acc-btn ghost" onclick="cabAbrirExpediente(\'' + recId + '\')">Abrir expediente<small>Vista del propietario</small></button>'
      + '    <button class="cab-acc-btn ghost" onclick="cabSubirDocAsesor(\'' + recId + '\')">Subir documento yo mismo<small>Si lo recibiste por otro medio</small></button>'
      + '  </div>'
      + '  <input type="file" id="cab-doc-file-' + recId + '" style="display:none" onchange="cabDocSeleccionado(\'' + recId + '\',this)">'
      + '  <div id="cab-doc-status-' + recId + '" style="display:none;margin-top:8px;font-size:12px;color:rgba(255,255,255,.6)"></div>'
      + '</div>';
  }
  /* Etapa 3: producción puede avanzar con documentos mínimos.
     No se inventan campos nuevos: solo leemos los campos existentes del lead vendedor
     y, cuando la ficha es una Propiedad, resolvemos el lead original por Folio Vendedor. */
  function cabNormTxt(v) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function expedienteCompletoOk(rec) {
    var src = expedienteSource(rec) || rec;
    var txt = cabNormTxt([
      fval(src, 'Progreso Expediente'),
      fval(src, 'Documentos'),
      fval(rec, 'Progreso Expediente'),
      fval(rec, 'Documentos')
    ].join(' '));
    return /8\s*\/\s*8/.test(txt) ||
      /(expediente\s+completo|completo\s+y\s+validado|completo\/validado|validado\s+completo|documentos\s+completos|todo\s+validado)/i.test(txt);
  }
  function produccionMinimosOk(rec, esPropiedad) {
    var src = expedienteSource(rec) || rec;
    if (expedienteCompletoOk(rec)) return true;

    var txt = cabNormTxt([
      fval(src, 'Progreso Expediente'),
      fval(src, 'Documentos'),
      fval(src, 'Contrato Firmado'),
      fval(src, 'Link Expediente Documental'),
      fval(rec, 'Progreso Expediente'),
      fval(rec, 'Documentos')
    ].join(' '));

    if (/(documentos\s+minimos|minimos\s+(recibidos|validados)|minimos\s+ok|listo\s+para\s+produccion|produccion\s+liberada)/i.test(txt)) return true;
    if (/[4-7]\s*\/\s*8/.test(txt) && /(recibid|valid|expediente|minim)/i.test(txt)) return true;
    if (/(escritura|identificacion|identificación|ine|predial|agua|servicio)/i.test(txt) && /(recibid|valid|subid|cargad|ok|listo)/i.test(txt)) return true;

    /* En Propiedades ya estamos en operación activa. Si no tenemos campos suficientes
       para leer mínimos en la ficha, no bloqueamos Producción: evitamos regresar al candado 8/8. */
    return !!esPropiedad;
  }

  function accionesHTML(recId, conv, esPropiedad) {
    var firmada = esPropiedad || ETAPAS_FIRMADAS.indexOf(conv) > -1;
    var head = '<div class="cab-acciones"><div class="cab-acc-title"><em>▸</em> Acciones de la propiedad</div>';
    if (!firmada) {
      return head
        + '<div class="cab-acc-hint">Las confirmaciones para el propietario se habilitan cuando la operación ya existe como propiedad activa.</div>'
        + '<div class="cab-acc-locked">Etapa actual: <b>' + esc(conv || 'Sin definir') + '</b>. Primero convierte el lead a una firma para trabajar Producción y Notaría desde Propiedades.</div>'
        + '</div>';
    }

    var recG = getRecord(recId);
    var minimosOk = produccionMinimosOk(recG || {}, esPropiedad);
    var expedienteOk = expedienteCompletoOk(recG || {});

    /* Oferta Formal NO se libera en la sesión de video: solo cuando los videos ya están en la landing. */
    var videosOk = esPropiedad && hasVideosListos(recId);
    function accBtn(tipo, label, small, enabled, lockNote, ghost) {
      if (enabled) return '<button class="cab-acc-btn' + (ghost ? ' ghost' : '') + '" onclick="cabAbrir(\'' + tipo + '\',\'' + recId + '\')">' + label + '<small>' + small + '</small></button>';
      return '<button class="cab-acc-btn locked" disabled>' + label + '<small>🔒 ' + lockNote + '</small></button>';
    }
    var hint = esPropiedad
      ? 'Producción puede avanzar con documentos mínimos. Notaría permanece bloqueada hasta expediente completo/validado.'
      : 'Etapa actual: <b>' + (minimosOk ? 'Producción liberada con mínimos' : 'Expediente documental') + '</b>.';
    return head
      + '<div class="cab-acc-hint">' + hint + '</div>'
      + ((!expedienteOk)
        ? '<div class="cab-acc-hint" style="border-left:2px solid #fbbf24;padding-left:10px;color:#fbbf24">Notaría sigue bloqueada: requiere expediente completo o validado. Producción no espera 8/8.</div>'
        : '')
      + ((esPropiedad && !videosOk)
        ? '<div class="cab-acc-hint" style="border-left:2px solid #C6A86B;padding-left:10px;color:#C6A86B">Producción de video en curso · máximo 2 días. La <b>Oferta Formal</b> se libera en cuanto subas los videos a la landing.</div>'
        : '')
      + '<div class="cab-acc-grid">'
      + accBtn('produccion', 'Producción Inmobiliaria', 'Foto y video · confirmación al propietario', minimosOk, 'Se libera con documentos mínimos recibidos o validados')
      + accBtn('notaria', 'Cita en Notaría', 'Formalización · confirmación al cliente', expedienteOk, 'Se libera con expediente completo/validado')
      + '</div>'
      + '<div class="cab-acc-grid" style="margin-top:8px">'
      + accBtn('oferta', 'Oferta Formal', 'Presentación al propietario · link vivo', videosOk, 'Se libera cuando subes los videos a la landing')
      + accBtn('promesa', 'Promesa de Compraventa', 'Firma del acuerdo · confirmación a las partes', esPropiedad, 'Se libera en el cierre de la operación')
      + '</div>'
      + '<div class="cab-acc-grid" style="margin-top:8px">' + accBtn('reporte', 'Reporte semanal (v1)', 'Análisis interno · versión automática viene después', minimosOk, 'Se libera con documentos mínimos recibidos o validados', true) + '</div>'
      + expedienteHTML(recId)
      + '</div>';
  }

  function inyectarAcciones(recId) {
    injectStyles();
    var rec = getRecord(recId);
    if (!rec) return;
    var esPropiedad = isPropiedadActiva();
    var conv = esPropiedad ? 'Propiedad activa' : fval(rec, 'Conversión');
    var inner = esPropiedad ? byId('crm-landing-body') : byId('crm-fv-inner');
    if (!inner) return;
    var prev = inner.querySelector('.cab-acciones');
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    var body = inner.querySelector('.fv-body') || inner;
    body.insertAdjacentHTML('beforeend', accionesHTML(recId, conv, esPropiedad));
  }

  /* Wrap de landOpenEditor: la cabina vive en Propiedades, no en Leads Vendedores. */
  function wrapFn(name) {
    if (typeof window[name] === 'function' && !window[name].__cabPatched) {
      var orig = window[name];
      window[name] = function (recId) {
        orig.apply(this, arguments);
        try { inyectarAcciones(recId); } catch (e) { /* silencioso */ }
      };
      window[name].__cabPatched = true;
      return true;
    }
    return false;
  }
  /* La cabina vive en ambas fichas: Propiedades (landOpenEditor) y Lead Vendedor (vendedorOpenFicha). */
  function patch() {
    var a = wrapFn('landOpenEditor');
    var b = wrapFn('vendedorOpenFicha');
    return a && b;
  }

  /* Exponer API global mínima usada por los onclick */
  window.cabAbrir = abrirCabina;
  window.cabCerrar = cabCerrar;
  window.cabToggle = cabToggle;
  window.cabRadio = cabRadio;
  window.cabImprimir = cabImprimir;
  window.cabCopiarWA = cabCopiarWA;
  window.cabGenProduccion = cabGenProduccion;
  window.cabGenNotaria = cabGenNotaria;
  window.cabGenReporte = cabGenReporte;
  window.cabCopiarExpediente = cabCopiarExpediente;
  window.cabAbrirExpediente = cabAbrirExpediente;
  window.cabEnviarExpediente = cabEnviarExpediente;
  window.cabSubirDocAsesor = cabSubirDocAsesor;
  window.cabDocSeleccionado = cabDocSeleccionado;
  window.copiarTextoExpediente = copiarTexto;
  window.cabCopiarLink = cabCopiarLink;
  window.cabEnviarWA = cabEnviarWA;
  window.cabGenOferta = cabGenOferta;
  window.cabGenPromesa = cabGenPromesa;

  /* Aplicar el patch (con reintento por si este script carga antes) */
  if (!patch()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (patch() || ++tries > 40) clearInterval(iv);
    }, 150);
  }
})();
