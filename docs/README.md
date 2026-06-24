# Documentación empresarial · Método NERI

Esta carpeta documenta el sistema como producto empresarial. La documentación se creó en una rama separada para no tocar `main` ni modificar el funcionamiento de la intranet.

## Regla principal

La documentación debe proteger lo que ya funciona. Ningún documento debe pedir cambios de código sin revisar primero el repositorio vivo, las variables de Vercel, Airtable, Make y los portales externos relacionados.

## Estructura

- `00-indice-y-reglas`: reglas maestras, lenguaje permitido y criterios de no romper.
- `01-arquitectura`: qué es el sistema y qué hace cada pieza.
- `02-conexiones`: conexiones protegidas, campos críticos y candados.
- `03-fases-proceso`: fases de compraventa y desbloqueos.
- `04-manual-asesor`: uso operativo desde intranet.
- `05-experiencia-cliente`: lo que vive vendedor y comprador.
- `06-pendientes`: pendientes por fase, sin suponer.
- `07-comercial`: propuesta de valor, pitch y empaquetado comercial.
- `08-registro-y-evidencias`: preparación para registro, evidencia y propiedad intelectual.
- `CHANGELOG.md`: bitácora documental.

## Cuidado por ser repositorio público

No documentar aquí secretos, tokens, llaves, webhooks completos, contraseñas, variables reales privadas ni accesos de terceros. Las conexiones pueden describirse por función, archivo y campo, pero las credenciales deben vivir solo en Vercel, Airtable, Make o documentos privados de la empresa.