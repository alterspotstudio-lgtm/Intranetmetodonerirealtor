# 01 CONEXIONES PROTEGIDAS

## Regla

No modificar conexiones sin revisar primero donde se usan y que flujo ya esta funcionando.

## Conexiones protegidas

- Airtable.
- Make.
- Vercel.
- GitHub.
- iDrive e2.
- Vercel Blob.
- WhatsApp links.
- Portal Progreso.
- Expediente documental propietario.
- Landing compradores.
- Landing vendedores.
- Confirmacion.html.
- Cita.html.
- cabina-vendedor.js.
- index.html de intranet.
- rutas api.

## Variables y secretos

No pegar en GitHub:

- webhooks completos,
- tokens,
- llaves privadas,
- variables de entorno,
- accesos Airtable,
- accesos Make,
- credenciales Vercel,
- credenciales IDrive.

## Antes de tocar

1. Revisar archivo vivo.
2. Revisar campo Airtable.
3. Revisar si Make lo consume.
4. Revisar si portal lo recibe.
5. Revisar si WhatsApp depende del dato.
6. Probar con folio controlado.

## Alternativa preferida

Si un campo no llega, primero agregar alias o fallback. No borrar lo anterior.