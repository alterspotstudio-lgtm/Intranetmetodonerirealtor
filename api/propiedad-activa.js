/**
 * GET /api/propiedad-activa
 * Método NERI · Century 21 Haus
 *
 * Devuelve los campos públicos de la propiedad cuyo
 * campo "Estado Propiedad" = "Activa" en la tabla
 * "Propiedades NERI" de Airtable.
 *
 * Make actualiza ese campo automáticamente cuando
 * detecta la firma del vendedor.
 *
 * Variables de entorno requeridas en Vercel (ya existen):
 *   AIRTABLE_TOKEN  → Personal Access Token (pat...)
 *   AIRTABLE_BASE   → appRh791vGXRdOJs3
 */

const TABLA  = 'Propiedades NERI';
const FILTRO = encodeURIComponent('{Estado Propiedad}="Activa"');

const CAMPOS = [
  'Nombre Propiedad',
  'Prefijo Folio',
  'Zona / Colonia',
  'Municipio',
  'Estado / Entidad',
  'Precio Lista',
  'Precio Formateado',
  'Moneda',
  'Habitaciones',
  'Banos',
  'Medios Banos',
  'Estacionamientos',
  'Metros Construccion',
  'Metros Terreno',
  'Link Tour Virtual',
  'Google Maps URL',
  'Resumen Propiedad',
  'Foto de portada',
].map(f => 'fields[]=' + encodeURIComponent(f)).join('&');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.AIRTABLE_TOKEN;
  const base  = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE || 'appRh791vGXRdOJs3';

  if (!token || !base) {
    return res.status(500).json({ error: 'Variables de entorno faltantes: AIRTABLE_TOKEN y/o AIRTABLE_BASE.' });
  }

  const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(TABLA)}` +
              `?filterByFormula=${FILTRO}&maxRecords=1&${CAMPOS}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const registro = data.records?.[0];
    if (!registro) {
      return res.status(404).json({ error: 'No hay ninguna propiedad con Estado = "Activa" en este momento.' });
    }

    // Devuelve los campos planos + el ID del registro
    return res.status(200).json({
      id: registro.id,
      ...registro.fields
    });

  } catch (err) {
    return res.status(500).json({ error: 'Error del proxy: ' + err.message });
  }
}
