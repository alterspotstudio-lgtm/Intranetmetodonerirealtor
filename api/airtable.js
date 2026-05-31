/**
 * Proxy Vercel → Airtable REST API
 * Método NERI · Century 21 Haus
 *
 * Variables de entorno requeridas en Vercel:
 *   AIRTABLE_TOKEN   → tu Personal Access Token  (pat...)
 *   AIRTABLE_BASE    → ID de la base              (appRh791vGXRdOJs3)
 *
 * Uso desde el frontend:
 *   GET  /api/airtable?path=tblXXX?fields[]=...
 *   POST /api/airtable?path=tblXXX          body: {fields:{...}}
 *   PATCH /api/airtable?path=tblXXX/recXXX  body: {fields:{...}}
 */

export default async function handler(req, res) {
  // CORS — permite llamadas desde el mismo dominio de Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.AIRTABLE_TOKEN;
  const base  = process.env.AIRTABLE_BASE;

  if (!token || !base) {
    return res.status(500).json({
      error: 'Variables de entorno faltantes: AIRTABLE_TOKEN y/o AIRTABLE_BASE no están configuradas en Vercel.'
    });
  }

  // path viene como query param: ?path=tblXXX/recYYY?fields[]=...
  const rawPath = req.query.path || '';
  if (!rawPath) {
    return res.status(400).json({ error: 'Falta el parámetro ?path=' });
  }

  // Construir URL final hacia Airtable
  const airtableUrl = `https://api.airtable.com/v0/${base}/${rawPath}`;

  // Construir opciones del fetch
  const fetchOptions = {
    method: req.method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Para POST y PATCH reenviar el body
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(airtableUrl, fetchOptions);
    const data     = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Error del proxy: ' + err.message });
  }
}
