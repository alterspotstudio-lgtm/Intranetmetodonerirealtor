# Configuración IDrive e2 · Método NERI

Bucket confirmado: `metodoneri`  
Endpoint confirmado: `https://s3.us-west-2.idrivee2.com`  
Región: `us-west-2`

## 1. Variables en Vercel

En Vercel → Project → Settings → Environment Variables agrega:

```txt
IDRIVE_E2_ENDPOINT=https://s3.us-west-2.idrivee2.com
IDRIVE_E2_REGION=us-west-2
IDRIVE_E2_BUCKET=metodoneri
IDRIVE_E2_ACCESS_KEY_ID=TU_NUEVA_ACCESS_KEY
IDRIVE_E2_SECRET_ACCESS_KEY=TU_NUEVA_SECRET_KEY
IDRIVE_E2_PUBLIC_BASE=https://s3.us-west-2.idrivee2.com/metodoneri
```

Importante: las claves que se pegaron en el chat deben considerarse expuestas. Crea una nueva Access Key en IDrive e2, reemplázala en Vercel y desactiva la anterior.

## 2. CORS del bucket

Para que la intranet pueda subir videos directo desde el navegador, el bucket debe permitir `PUT` desde tu dominio de Vercel.

Usa esta regla como base. Cambia o agrega tus dominios reales si tienes más de uno:

```json
[
  {
    "AllowedOrigins": [
      "https://intranetmetodonerirealtor.vercel.app",
      "https://*.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Si IDrive e2 te pide formato XML/S3, usa este equivalente:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://intranetmetodonerirealtor.vercel.app</AllowedOrigin>
    <AllowedOrigin>https://*.vercel.app</AllowedOrigin>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

## 3. Lectura pública

Para que los videos se vean en la landing, el bucket o los objetos deben ser públicos de lectura. La intranet solo firma la subida; Airtable guarda la URL final.

## 4. Prueba correcta

1. Entra a una propiedad.
2. Sube solo un video MP4 pequeño primero.
3. Guarda.
4. Revisa que Airtable guarde la URL en el campo `Video ... MP4`.
5. Abre la landing y confirma que el video carga.

Si falla con error de CORS, no es la intranet: falta configurar CORS en el bucket.
