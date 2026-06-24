# 02 · Conexiones protegidas

Este documento registra conexiones y campos que no deben romperse. No incluye secretos ni webhooks completos porque el repositorio es público.

## Conexiones principales

### Vercel

Hospeda la intranet y las rutas `/api/*`. Las variables privadas deben vivir en Environment Variables.

Variables mencionadas por el código:

- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE` o `AIRTABLE_BASE_ID`
- `NERI_SESSION_SECRET`
- `NERI_ADMIN_CODE`
- `NERI_ACCESS_CODE`
- `AIRTABLE_ASESORES_TABLE`
- `IDRIVE_E2_ENDPOINT`
- `IDRIVE_E2_REGION`
- `IDRIVE_E2_BUCKET`
- `IDRIVE_E2_ACCESS_KEY_ID`
- `IDRIVE_E2_SECRET_ACCESS_KEY`
- `IDRIVE_E2_PUBLIC_BASE`
- `BLOB_READ_WRITE_TOKEN`

Candado: nunca pasar estas variables al frontend ni documentarlas con valores reales.

### Airtable

La intranet usa Airtable como base operativa. El acceso debe pasar por `/api/airtable` para aplicar sesión, rol, slug y tabla autorizada.

Tablas detectadas por función:

- Compradores.
- Vendedores.
- Progreso.
- Citas.
- Propiedades.
- Eventos.
- Asesores.
- Expediente Documentos.

Campos críticos que no deben renombrarse sin auditoría completa:

- `Asesor`
- `Slug`
- `Nombre`
- `Nombre Completo`
- `Teléfono WhatsApp`
- `Folio`
- `Folio Vendedor`
- `Folio NERI`
- `Folio del Comprador`
- `Folio Evento`
- `Folio Lead Origen`
- `Conversión`
- `Propiedad Creada`
- `Contrato Firmado`
- `Token Expediente`
- `Link Expediente Documental`
- `Progreso Expediente`
- `Documentos`
- `Expediente Docs`
- `Fase Actual`
- `Próximo paso`
- `Pendientes visibles`
- `Estado Cita`
- `Tipo Evento`
- `Estado`

### Make

Make aparece como pieza de integración para landings, creación de propiedad, eventos, propuestas y flujos externos.

Candado: no pegar webhooks completos en documentación pública. Documentar solo:

- nombre del escenario,
- qué recibe,
- qué escribe,
- tabla destino,
- campos mínimos,
- cómo se prueba.

### IDrive e2

IDrive e2 se usa para archivos pesados y lectura firmada. La ruta permitida por código usa prefijo `metodo-neri/`.

Candados:

- Solo servir objetos bajo el prefijo permitido.
- No exponer credenciales S3.
- No cambiar bucket, endpoint o región sin actualizar Vercel y pruebas.
- Probar CORS antes de culpar a la intranet.

### Vercel Blob

`api/upload-documento.js` conserva compatibilidad para subir documentos a Blob. El registro final del documento lo hace `api/expediente-documentos.js`.

### WhatsApp

WhatsApp se usa como canal de salida mediante links `wa.me`. No es integración oficial con WhatsApp API dentro de este repo.

Candado: si se agrega WhatsApp API real, debe documentarse aparte y no sustituir mensajes existentes sin prueba viva.

## Flujo protegido: firma a expediente

1. Lead vendedor llega a Airtable.
2. Asesor contacta por riel.
3. Asesor sube contrato firmado.
4. Se registra `Contrato Firmado` y `Conversión`.
5. Se llama activación de expediente.
6. Se genera o reutiliza `Token Expediente`.
7. Se guarda `Link Expediente Documental`.
8. Se siembra checklist documental.
9. El propietario entra con folio + token.

## Flujo protegido: propiedad y portal

1. Lead firmado se convierte en propiedad.
2. Propiedad debe conservar relación con `Folio Vendedor`.
3. Portal de Venta debe usar folio de progreso y, cuando aplique, folio/token de expediente.
4. No enviar link si falta token requerido.

## Prueba mínima antes de tocar conexiones

- Login de asesor real.
- Ver leads vendedores.
- Abrir ficha vendedor.
- Enviar primer contacto.
- Subir contrato PDF.
- Confirmar que se activa expediente.
- Abrir Propiedades.
- Enviar Portal de Venta.
- Abrir expediente propietario con folio + token.
- Subir documento.
- Confirmar que el documento se registra o queda visible según flujo.