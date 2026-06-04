// /api/airtable.js  —  Proxy seguro Intranet → Airtable (Método NERI)
// Vercel Serverless Function (Node.js).
//
// El frontend llama así:
//   GET    /api/airtable?path=<tablaId>?maxRecords=100
//   POST   /api/airtable?path=<tablaId>            (body: {fields, typecast})
//   PATCH  /api/airtable?path=<tablaId>/<recordId> (body: {fields, typecast})
//
// REQUISITO — en Vercel → Settings → Environment Variables:
//   AIRTABLE_TOKEN    =  pat...
//   AIRTABLE_BASE_ID  =  appRh791vGXRdOJs3

const BASE_ID = process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE || 'appRh791vGXRdOJs3';
const TOKEN   = process.env.AIRTABLE_TOKEN;

export default async function handler(req, res) {
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

  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;

  try {
    const airtableRes = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
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
