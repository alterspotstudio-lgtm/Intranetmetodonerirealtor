# Mapeo Make · Landing Compradores → Airtable → Intranet

La intranet lee Leads Compradores desde la tabla:

`tblOdlY3bBlGi64qR`

Campos que debe escribir Make:

| Landing Compradores | Airtable |
|---|---|
| Nombre | `Nombre Completo` |
| WhatsApp / Teléfono | `Teléfono WhatsApp` |
| Propiedad o casa de interés | `Propiedad de Interés` |
| Crédito / método de compra | `Método / Crédito` |
| Temperatura / score | `Clasificación` |
| Estado inicial | `Status del Lead` = `Nuevo` |
| Asesor del link | `Asesor` |
| Fecha/hora del formulario | `Fecha de Entrada` |

Regla crítica:

`Asesor` debe llenarse con el slug o el nombre real del asesor que viene en la URL.

Ejemplo de URL correcta:

`https://compradorcasa.vercel.app/?asesor=enrique-neri`

Si el lead llega a Airtable pero no aparece en Intranet, casi siempre el campo `Asesor` está vacío, trae otro texto o Make está escribiendo en otra tabla.

Cambios aplicados en esta versión:

- Landing Compradores ya apunta a `https://compradorcasa.vercel.app`.
- El proxy de Airtable ahora acepta coincidencia exacta o contenida en el campo `Asesor`.
- El Centro de Operaciones trae primero los registros más nuevos por `Fecha de Entrada` para que un lead reciente no quede fuera de los primeros 100.
