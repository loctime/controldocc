# ControlDoc

**ControlDoc** es un sistema documental desarrollado con React, Express, Docker, Firebase y Backblaze B2. Permite a los usuarios subir archivos (imágenes, documentos) que son automáticamente convertidos a PDF, almacenados en Backblaze B2, y registrados en Firestore para su revisión.

---

## 🚀 Tecnologías utilizadas

- **Frontend**: React + Vite
- **Backend**: Express (Node.js)
- **Almacenamiento**: Backblaze B2
- **Base de datos**: Firestore (Firebase)
- **Conversión de archivos**: LibreOffice + ImageMagick
- **Contenedores**: Docker
- **Deploy**: Render

---

## ⚙️ Funcionalidad principal

- Los usuarios suben archivos desde el frontend.
- El backend convierte los archivos a PDF (si es imagen o Word).
- El PDF se sube a Backblaze B2.
- Se guarda un registro en Firestore con estado "pendiente de revisión".
- El archivo se descarga directamente desde Backblaze vía Cloudflare.

---

## 🔧 Variables de entorno (.env)

Configurar las siguientes variables:

### Firebase

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Backblaze B2

```
B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=
```

---

## 🐳 Docker

Este proyecto usa Docker para empaquetar el backend y sus dependencias (LibreOffice, ImageMagick).

### Dockerfile incluido

```Dockerfile
FROM node:18
RUN apt-get update && apt-get install -y libreoffice imagemagick && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🧪 Desarrollo local

### Backend + Frontend juntos (modo dev):

```bash
npm install
npm run dev
```

### Solo frontend:

```bash
npm run dev:frontend
```

### Solo backend:

```bash
npm run dev:backend
```

---

## ☁️ Deploy en Render

1. Crear un nuevo Web Service en Render (modo Docker).
2. Subir este repo a GitHub.
3. Render detectará el `Dockerfile`.
4. Configurar variables de entorno en el panel de Render.
5. Asegurarse que el puerto esté configurado como `3000`.

---

## 🔐 Seguridad recomendada

- Agregar autenticación a los endpoints `/api/upload` y `/api/convert`.
- Validar tamaño de archivos con Multer.
- (Opcional) Añadir rate limiting.

---

## 📂 Estructura recomendada

```
controldoc/
├── Dockerfile
├── server.js
├── .env
├── .dockerignore
├── .gitignore
├── package.json
├── frontend/
│   └── vite.config.js
├── src/
│   ├── services/
│   │   └── backblazeService.js
│   └── uploadconvert/
│       ├── upload/
│       └── converted/
```

---

## ✨ Autor

Proyecto desarrollado por Fernando Vidal
