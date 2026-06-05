# Reporte de limpieza · Intranet Método NERI

## Objetivo
Dejar el `index.html` más limpio antes de aplicar cambios de auditoría, sin romper conexiones Airtable–Make–Vercel.

## Archivos revisados
- `index.html`
- `api/airtable.js`
- `api/upload.js`
- `api/upload-documento.js`
- `api/propiedad-activa.js`
- `api/api-upload.js`
- `Reportes.html`
- `package.json`

## Limpieza aplicada en `index.html`
1. Se eliminó el bloque de acceso rápido demo del login (`quick-login chips`) porque el sistema ya entra en modo prueba abierto y conserva login manual.
2. Se eliminó la función `quickLogin()` porque quedó sin uso.
3. Se integró el menú definitivo del asesor dentro de `NAV_ROL.asesor`, en lugar de dejarlo como parche al final del archivo.
4. Se integraron las etiquetas del asesor dentro de `LABELS`, en lugar de agregarlas después con `Object.assign()`.
5. Se eliminó el parche tardío `NAV_ROL.asesor = [...]`, porque ya quedó integrado en su lugar correcto.
6. Se eliminaron funciones legacy sin referencias reales en el HTML/JS:
   - `adminV9TipoForView()`
   - `adminSwitchTab()`
   - `adminRenderCuentaResumenV13()`
   - `adminRenderContenidoPaqueteV13()`
   - `adminUsuarioClosedNoticeV11()`
   - `adminSaveUsuarioServiciosV9()`
   - `adminV9EnterSystem()`
   - `adminSelectUsuario()`
   - `adminNewUsuario()`
7. Se actualizaron comentarios internos viejos tipo V12/V14 para que describan el módulo real: Control Maestro y Centro de Mando del Asesor.

## Conexiones críticas verificadas dos veces
No se cambiaron rutas, IDs ni endpoints críticos.

### Vercel / API interna
- `/api/airtable`
- `/api/upload`
- `/api/upload-documento`

### Airtable
Se conservaron los IDs de tabla encontrados en el HTML:
- `tblIRPmLIyj8sWyEk`
- `tblOdlY3bBlGi64qR`
- `tblQHdwEucTaNrLzm`
- `tblyC9VjjtoRKJPQL`
- `tblaAfbSD3pqSLdAA`
- `tblmco2JyXRiZGhaY`

### Make
Se conservaron los webhooks usados al cargar herramientas externas:
- Webhook vendedores
- Webhook compradores / general

## Archivos API
No se modificó ningún archivo de `/api`. Se conservaron intactos para no romper conexión Airtable, Vercel Blob ni compatibilidad de rutas.

## Validación técnica realizada
- Extracción del JavaScript del HTML.
- Revisión de sintaxis con `node --check`.
- Comparación de conteo de rutas críticas antes/después.
- Confirmación de que los archivos API quedaron sin cambios.

## Resultado
- `index.html` original: 264,442 caracteres.
- `index.html` limpio: 258,505 caracteres.
- Reducción aproximada: 5,937 caracteres.

## Nota importante
No hice rediseño visual ni cambios de auditoría funcional. Esta entrega es limpieza previa: ordena el HTML, elimina parches y basura segura, y conserva las conexiones críticas.
