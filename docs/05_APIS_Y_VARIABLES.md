# 05 APIS Y VARIABLES

## Regla

Este archivo documenta nombres y funciones, no valores privados.

## APIs principales de intranet

- /api/airtable
- /api/login
- /api/activar-expediente
- /api/vendedor-expediente
- /api/expediente-documentos
- /api/upload-documento
- /api/upload-idrive-url
- /api/idrive-read-url
- /api/alerta-expediente

## Variables importantes

- AIRTABLE_TOKEN
- AIRTABLE_BASE o AIRTABLE_BASE_ID
- NERI_SESSION_SECRET
- BLOB_READ_WRITE_TOKEN
- IDRIVE_E2_ENDPOINT
- IDRIVE_E2_REGION
- IDRIVE_E2_BUCKET
- IDRIVE_E2_ACCESS_KEY_ID
- IDRIVE_E2_SECRET_ACCESS_KEY
- MAKE_PROGRESO_WEBHOOK

## Regla de seguridad

Nunca pegar valores reales en GitHub.

## Antes de ajustar APIs

1. Revisar quien llama la API.
2. Revisar variables necesarias.
3. Revisar si el frontend espera nombres exactos.
4. Revisar si Make depende de esa respuesta.
5. Probar sin tocar main.