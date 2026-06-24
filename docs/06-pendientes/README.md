# 06 · Pendientes por fase

Este documento separa lo consolidado de lo pendiente. No se debe vender como terminado algo que solo está planteado o parcialmente conectado.

## Pendientes detectados en este repositorio

### README principal

El `README.md` del repo solo tiene el título. Falta descripción formal del sistema, instalación, arquitectura, reglas de seguridad y mapa de carpetas.

### Reportes

`Reportes.html` existe como ruta, pero indica que está en construcción y no lee Airtable todavía.

Pendiente:

- Definir datos vivos del reporte.
- Conectar leads, citas, documentos, apartados, propiedades activas y operaciones atoradas.
- Separar reporte interno del asesor y reporte para cliente.

### Experiencia comprador posterior al apartado

En `index.html` existe configuración de progreso con fases de operación, pero antes de declararlo completo debe auditarse el portal externo de progreso.

Pendiente:

- Confirmar vista comprador real.
- Confirmar link que recibe el comprador.
- Confirmar dónde sube documentos el comprador.
- Confirmar candado de apartado con evidencia.

### Documentos del comprador

No declarar consolidado sin revisar repositorio o endpoint específico del portal comprador.

Pendiente:

- Checklist documental del comprador.
- Subida de documentos.
- Validación.
- Alertas.
- Vista de avance hasta firma.

### Promesa, notaría y entrega de llaves

La cabina genera confirmaciones para promesa y notaría. Falta documentar con prueba viva completa:

- envío a ambas partes,
- estado vivo,
- registro en eventos,
- confirmación final,
- cierre de venta y compra.

### Automatización de mensaje sugerido

La ficha muestra mensaje sugerido y acciones de WhatsApp en varias partes, pero si se quiere conversión automática al enviar, debe definirse el evento exacto que actualiza Airtable.

Pendiente:

- Botón “enviar mensaje” contra “copiar”.
- Registro de última interacción.
- Cambio de estado posterior al envío.
- Auditoría de si WhatsApp solo abre ventana o confirma envío real.

## Regla para cerrar pendiente

Un pendiente solo se puede mover a consolidado si tiene:

- archivo o endpoint identificado,
- campos de Airtable identificados,
- prueba viva,
- captura o evidencia,
- riesgo documentado,
- responsable de mantenimiento.