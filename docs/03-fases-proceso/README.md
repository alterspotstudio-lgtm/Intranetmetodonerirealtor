# 03 · Fases del proceso de compraventa

## Principio operativo

El sistema debe guiar al asesor. El asesor no debe decidir libremente qué fase saltarse. Cada fase debe tener un candado, una prueba de avance y un siguiente paso visible.

## Flujo vendedor detectado en este repositorio

El riel del vendedor está definido como:

`Contacto → Firma → Expediente → Producción`

### 1. Contacto

**Inicio:** lead vendedor nuevo.

**Acción esperada:** enviar primer mensaje por WhatsApp.

**Desbloqueo:** al enviar el primer contacto, el lead pasa a seguimiento.

**No debe romperse:** el primer movimiento no debe ser manual ni depender de que el asesor recuerde cambiar un select.

### 2. Firma

**Inicio:** lead en seguimiento.

**Acción esperada:** descargar contrato, firmar con propietario y subir PDF firmado.

**Opciones detectadas:**

- Firma exclusiva.
- Firma venta directa.

**Desbloqueo:** al subir contrato firmado se registra conversión, contrato y activación de expediente.

### 3. Expediente

**Inicio:** contrato firmado.

**Acción esperada:** activar o enviar expediente documental del propietario.

**Candado:** el expediente usa folio + token. No se debe enviar link roto ni link sin token si el portal lo requiere.

**Documentos base detectados:**

- Escritura.
- Predial.
- Identificación oficial.
- Libertad de gravamen.
- Agua / Luz.
- Constancia de situación fiscal.
- Comprobante de domicilio.
- Acta de matrimonio / régimen matrimonial.

### 4. Producción

**Inicio:** propiedad activa y/o documentos mínimos.

**Acción esperada:** preparar foto y video, confirmar cita y subir material para landing.

**Candado detectado:** producción puede avanzar con documentos mínimos; notaría permanece bloqueada hasta expediente completo o validado.

### 5. Oferta formal

**Inicio:** producción subida a landing.

**Candado detectado:** oferta formal se libera cuando existen videos en la landing de la propiedad.

### 6. Promesa de compraventa

**Inicio:** operación ya en propiedad activa.

**Acción esperada:** generar confirmación y link vivo para las partes.

### 7. Notaría

**Inicio:** expediente completo o validado.

**Acción esperada:** generar confirmación formal con fecha, hora, lugar y documentos que debe llevar el cliente.

## Flujo comprador / progreso detectado en este repositorio

El progreso de operación está configurado con fases:

`Apartado → Expediente → Valuación → Crédito → Escrituración → Firma → Entrega → Completado`

Este flujo aparece relacionado con el Portal Progreso y operaciones posteriores al apartado.

## Reglas por fase

Cada fase debe tener:

- estado visible,
- acción recomendada,
- botón principal,
- prueba de avance,
- responsable,
- documento o evidencia,
- mensaje preparado,
- link vivo cuando aplique.

## No consolidado todavía

Antes de declarar terminado el flujo comprador, debe revisarse el repositorio del portal de progreso y el portal documental del comprador si viven fuera de este repo.