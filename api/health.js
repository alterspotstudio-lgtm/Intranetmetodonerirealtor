// /api/health.js — verificación segura de despliegue Método Neri
export default async function handler(req, res){
  res.status(200).json({
    app:'Método Neri Intranet',
    build:'REAL-SIN-DEMO-2026-06-05',
    demo:false,
    hasAdminCode:Boolean(process.env.NERI_ADMIN_CODE),
    hasSessionSecret:Boolean(process.env.NERI_SESSION_SECRET),
    hasAirtableToken:Boolean(process.env.AIRTABLE_TOKEN),
    hasAirtableBase:Boolean(process.env.AIRTABLE_BASE || process.env.AIRTABLE_BASE_ID),
    hasBlobToken:Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  });
}
