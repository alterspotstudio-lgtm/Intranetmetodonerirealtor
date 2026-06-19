# 01 · Arquitectura del sistema

## Propósito

La intranet funciona como centro operativo para que el asesor siga un proceso guiado de compraventa inmobiliaria, con fases, documentos, citas, propiedades, portales y seguimiento.

## Piezas principales detectadas en este repositorio

### `index.html`

Es la aplicación principal de intranet. Contiene login, menú por rol, centro de operaciones, CRM visual, paneles del asesor, configuración de tablas, riel del vendedor y conexión con herramientas externas.

Funciones visibles dentro del archivo:

- Login real mediante `/api/login`.
- Menú por rol: asesor, gerente, director y admin.
- Centro de Operaciones con tablas de compradores, vendedores, progreso, citas y propiedades.
- Riel del vendedor: Contacto → Firma → Expediente → Producción.
- Portal de Venta después de firma.
- Panel de expedientes y atajos.

### `cabina-vendedor.js`

Cabina de acciones para la propiedad y vendedor. Vive sobre la ficha de Propiedades y del Lead Vendedor. No debe tratarse como pieza aislada.

Funciones visibles:

- Producción inmobiliaria.
- Confirmación de notaría.
- Promesa de compraventa.
- Oferta formal.
- Reporte semanal v1.
- Expediente documental del propietario.
- Subida de documentos recibidos por otro medio.
- Generación de evento y link vivo de confirmación.

### `api/login.js`

Valida acceso real por slug contra Airtable y entrega sesión firmada. No expone credenciales al navegador.

### `api/airtable.js`

Proxy seguro entre frontend y Airtable. Controla tablas autorizadas, sesión, rol, slug, cuenta y permisos.

### `api/activar-expediente.js`

Activa el expediente documental del propietario después de firma válida. Genera o reutiliza token, guarda link y siembra checklist documental.

### `api/vendedor-expediente.js`

Valida el acceso público del propietario al expediente con folio + token.

### `api/expediente-documentos.js`

Controla el ciclo de documentos: listado, recibido, validado y rechazado.

### `api/upload-idrive-url.js`

Genera URL firmada para subir videos, PDFs o imágenes a IDrive e2 sin pasar archivos grandes por Vercel Functions.

### `api/idrive-read-url.js`

Genera lectura firmada temporal para objetos de IDrive e2.

### `api/upload-documento.js`

Sube archivos a Vercel Blob y permite doble autorización: asesor con sesión o propietario con folio + token.

### `api/alerta-expediente.js`

Cron de alerta documental. Revisa documentos pendientes y marca atención cuando pasan 48 horas.

### `Confirmacion.html`

Página pública para eventos de operación: Producción, Promesa, Notaría y Oferta. Lee evento por folio y muestra confirmación viva.

### `Cita.html`

Página pública de cita de comprador. Lee el folio de cita y muestra datos de visita, estado y asesor.

### `Reportes.html`

Ruta conservada. Actualmente indica que reportes está en construcción y todavía no lee datos vivos.

## Portales externos relacionados

El repo referencia herramientas externas como landings de compradores, vendedores, citas, progreso, opciones de compra, crédito bancario y sala de mensajes. Esos portales deben auditarse en sus propios repositorios antes de declararse como consolidados.

## Arquitectura resumida

Cliente o asesor → Landing / Intranet → Make / API interna → Airtable → Portales de experiencia → WhatsApp / Confirmaciones / Documentos.

La intranet no debe depender de memoria humana del asesor: cada fase debe empujar el siguiente paso y dejar registro.