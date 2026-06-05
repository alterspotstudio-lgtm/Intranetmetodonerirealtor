# Reporte técnico — Intranet Método Neri

## Resultado aplicado

Se corrigió el proyecto para que deje de operar como modo prueba abierto y se acerque a una cabina real Método Neri: acceso por sesión firmada, proxy Airtable con control server-side, filtros por asesor, eliminación de datos demo operativos y sustitución de “Mi CRM” por “Centro de Operaciones”.

## Cambios P0 aplicados

1. **Auto-login admin eliminado**  
   Se removió el bloque que abría automáticamente como administrador al cargar el navegador.

2. **Modo demo separado**  
   El demo ya no entra por defecto. Solo se intenta usar si la URL trae `?demo=interno` y el servidor tiene `NERI_INTERNAL_DEMO=true` + `NERI_INTERNAL_DEMO_CODE`.

3. **“Mi CRM” reemplazado**  
   El menú y encabezado principal ahora usan **Centro de Operaciones**.

4. **`/api/airtable` verificado y reforzado**  
   Ahora requiere `AIRTABLE_TOKEN`, `AIRTABLE_BASE` o `AIRTABLE_BASE_ID`, y `NERI_SESSION_SECRET`. Ya no usa base hardcodeada.

5. **`/api/upload-documento` verificado y reforzado**  
   Conserva `BLOB_READ_WRITE_TOKEN`, sube a Vercel Blob y ahora exige sesión firmada.

6. **Control server-side por rol / slug / asesor**  
   `/api/airtable` valida token firmado y filtra GET por asesor. En PATCH valida propiedad del registro antes de permitir escritura. En perfil del asesor solo permite escribir los campos públicos autorizados.

7. **ASESOR_SAMPLE eliminado de operación**  
   Hoy, Propiedades, Documentos y Reportes ya no usan datos demo. Muestran datos reales vía Airtable filtrado por sesión.

8. **Perfil del Asesor mantenido con campos editables correctos**  
   Editables: Nombre, Teléfono WhatsApp, Email, Ciudad, Frase, Pixel ID Meta, Foto.

9. **Campos bloqueados mantenidos**  
   Cuenta, Tipo, Estado / activación, Puesto, Slug y Link Captación siguen como solo lectura.

10. **Link de captación reforzado**  
   Se mantiene visible y con botón copiar.

11. **Hoy convertido en cabina real**  
   Ahora estructura: qué hacer hoy, a quién contactar, lead enfriándose, operación en riesgo, documento faltante y mensaje sugerido.

12. **Tres zonas agregadas**  
   Dinero en riesgo, Dinero cerca y Dinero dormido.

## Cambios P1 aplicados

1. **Ficha premium por encima de tabla**  
   Se conserva el expediente vivo como experiencia principal y la tabla queda como entrada secundaria.

2. **Sala de Mensajes contextual**  
   Ya no se carga como iframe genérico. Ahora tiene panel propio con tipo/etapa, riesgo principal, diagnóstico comercial y mensaje sugerido.

3. **Mesa de Documentos conectada a pendientes**  
   Documentos lee `Pendientes visibles` en progreso y `Documentos` en vendedores para mostrar qué falta y en qué etapa afecta.

4. **Control Maestro mantiene distinción de tipos**  
   Conserva Administrador / Inmobiliaria / Director / Gerente / Asesor / Independiente / Grupo sin inmobiliaria en la estructura administrativa existente.

## Seguridad aplicada

- No hay webhooks Make expuestos en frontend.
- No hay `neri2024` ni usuarios demo hardcodeados en el HTML.
- El frontend ya no conoce Airtable Token ni Base.
- Las llamadas a Airtable y Blob requieren `Authorization: Bearer <token firmado>`.
- El token se guarda en `sessionStorage`, no en `localStorage`.
- `localStorage` queda solo para el módulo administrativo interno histórico, no como base de operación real.

## Variables de entorno necesarias en Vercel

- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE` *(o `AIRTABLE_BASE_ID`, pero se recomienda `AIRTABLE_BASE`)*
- `BLOB_READ_WRITE_TOKEN`
- `NERI_SESSION_SECRET`
- `NERI_ACCESS_CODE` *(si no existe contraseña individual en Airtable)*
- `NERI_ADMIN_CODE` *(para administrador)*
- `NERI_INTERNAL_DEMO=true` y `NERI_INTERNAL_DEMO_CODE` *(solo si deseas demo interno)*

## Pruebas realizadas aquí

- Revisión estática de archivos del proyecto.
- Validación de sintaxis JavaScript con `node --check` para:
  - `index.html` extraído a script
  - `api/login.js`
  - `api/airtable.js`
  - `api/upload-documento.js`
  - `api/upload.js`
  - `api/propiedad-activa.js`
- Búsqueda de riesgos: se confirmó que ya no aparecen credenciales demo, webhooks Make ni `ASESOR_SAMPLE` en operación.

## Pruebas no ejecutables desde este entorno

No pude confirmar llamadas reales a Airtable, PATCH real, subida real a Blob ni aislamiento real entre dos asesores porque aquí no tengo tus variables de entorno ni credenciales de Vercel/Airtable. El código quedó preparado para esas pruebas en Vercel.



## HOTFIX SIN DEMO

Se generó build `REAL-SIN-DEMO-2026-06-05`. Si Vercel muestra `MODO PRUEBA ABIERTO` o `neri2024`, no está sirviendo este ZIP sino un despliegue anterior. Verificar `/version.txt` y `/api/health`.
