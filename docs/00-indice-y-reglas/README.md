# 00 · Índice y reglas maestras

## Definición interna

Método NERI es un sistema operativo inmobiliario para ordenar leads, propiedades, expedientes, citas, documentos, seguimiento y experiencia de cliente dentro de una cadena auditable.

## Lenguaje público

Al cliente final no se le habla de `intranet`, `Amazon`, `CRM`, `Make`, `Airtable`, `Vercel`, `token`, `webhook` ni `automatización interna`.

Lenguaje permitido para cliente:

- Portal de Venta.
- Portal de seguimiento.
- Expediente documental.
- Confirmación de cita.
- Estado de tu operación.
- Próximo paso.
- Documentos pendientes.
- Confirmación de firma.

## Reglas de no romper

1. No modificar `main` sin prueba viva.
2. Todo cambio debe ir en rama nueva.
3. No tocar nombres de campos de Airtable sin revisar todos los lugares donde se usan.
4. No exponer credenciales ni webhooks completos en documentación pública.
5. No cambiar flujos activos por rediseños visuales.
6. No romper folios: los folios conectan lead, propiedad, expediente, progreso, cita y evento.
7. No enviar portales sin token cuando el portal requiere token.
8. No mezclar vista vendedor con vista comprador.
9. No cambiar endpoints `/api/*` sin revisar quién los consume.
10. No agregar lógica nueva encima de una conexión viva sin documentar primero el candado existente.

## Regla de auditoría

Cada seis meses debe revisarse:

- Qué fases se cumplen.
- Qué botones sí empujan el siguiente paso.
- Qué clientes sí reciben información clara.
- Qué asesores se saltan pasos.
- Qué conexiones fallaron.
- Qué documentos o campos ya no se usan.
- Qué partes deben simplificarse.

## Estado de esta carpeta

Esta documentación se basa en archivos vivos del repositorio `Intranetmetodonerirealtor`. Si un portal externo vive en otro repositorio, debe auditarse aparte antes de documentarlo como consolidado.