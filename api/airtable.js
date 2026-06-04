// /api/airtable.js  —  Proxy seguro Intranet → Airtable (Método NERI)
// Vercel Serverless Function (Node.js).
//
// El frontend (index_intranet.html) llama así:
//   GET    /api/airtable?path=<tablaId>?maxRecords=100
//   POST   /api/airtable?path=<tablaId>            (body: {fields, typecast})
//   PATCH  /api/airtable?path=<tablaId>/<recordId> (body: {fields, typecast})
//
// Este archivo añade la base y el token del lado del servidor para que
// el token NUNCA quede expuesto en el HTML.
//
// REQUISITO — en Vercel → Settings → Environment Variables, agrega:
//   AIRTABLE_TOKEN    =  pat...   (Personal Access Token de Airtable)
//   AIRTABLE_BASE_ID  =  appRh791vGXRdOJs3
//
// El token debe tener permisos: data.records:read y data.records:write
// sobre la base "Metodo Neri".

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appRh791vGXRdOJs3';
const TOKEN   = process.env.AIRTABLE_TOKEN;

export default async function handler(req, res) {
  // CORS (por si la intranet vive en otro dominio)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!TOKEN) {
    return res.status(500).json({
      error: 'Falta la variable de entorno AIRTABLE_TOKEN en Vercel.',
    });
  }

  const path = req.query.path;
  if (!path) {
    return res.status(400).json({ error: 'Falta el parámetro ?path=' });
  }

  // Construir la URL real de Airtable
  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;

  try {
    const airtableRes = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Reenviar el body en POST/PATCH/DELETE
      ...(req.method !== 'GET' && req.body
        ? { body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body) }
        : {}),
    });

    const text = await airtableRes.text();
    res.status(airtableRes.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (err) {
    return res.status(502).json({ error: 'Error al contactar Airtable: ' + err.message });
  }
}
