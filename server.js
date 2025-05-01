import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadFile } from './src/services/backblazeService.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import admin from 'firebase-admin';
import morgan from 'morgan';
import { authenticateFirebaseUser } from './middleware/authenticateFirebaseUser.js';

// Cargar variables de entorno
config({ path: '.env' });

// Configuración Firebase Admin
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

console.log('[SERVER] Validando configuración Firebase Admin');
if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
  console.error('[SERVER] Error: Faltan variables de entorno para Firebase Admin');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

console.log('[SERVER] Firebase Admin inicializado correctamente para proyecto:', 
  firebaseAdminConfig.projectId);

const adminDb = admin.firestore();

const app = express();
const upload = multer();
const port = process.env.PORT || 3001;

const uploadDir = path.join(process.cwd(), 'src/uploadconvert/upload');
const convertedDir = path.join(process.cwd(), 'src/uploadconvert/converted');

// Middleware de logging
app.use(morgan('dev'));
// Crear carpetas si no existen
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir, { recursive: true });

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://controldocc.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS bloqueado para origen: " + origin));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ping para mantener vivo Render
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'active', timestamp: new Date() });
});

// Subida a Backblaze B2 y registro en Firestore
app.post('/api/upload', authenticateFirebaseUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se recibió ningún archivo válido' });
    }

    const fileBuffer = Buffer.isBuffer(req.file.buffer)
      ? req.file.buffer
      : Buffer.from(req.file.buffer);

    const uploadResult = await uploadFile(fileBuffer, req.file.mimetype);
    console.log('Nombre recibido:', req.file.originalname);
    if (!uploadResult?.url) {
      return res.status(500).json({ error: 'No se pudo obtener la URL del archivo subido' });
    }
    // Guardar metadatos en Firestore
    await adminDb.collection("documentos").add({
      nombreOriginal: req.file.originalname,
      tipo: 'application/pdf',
      urlB2: uploadResult.url,
      fechaSubida: new Date(),
      estado: 'pendiente de revisión',
      usuarioEmail: req.user.email,
      subidoPorUid: req.user.uid
    });

    res.json({ success: true, url: uploadResult.url });
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/convert', authenticateFirebaseUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se recibió ningún archivo válido' });
    }

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const tempInputPath = path.join(uploadDir, `${timestamp}_${originalName}`);
    const outputName = `${timestamp}.pdf`;
    const outputPath = path.join(convertedDir, outputName);

    fs.writeFileSync(tempInputPath, req.file.buffer);

    const command = ['.jpg', '.jpeg', '.png'].includes(ext)
      ? `convert "${tempInputPath}" "${outputPath}"`
      : `libreoffice --headless --convert-to pdf --outdir "${convertedDir}" "${tempInputPath}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        fs.unlinkSync(tempInputPath);
        return res.status(500).json({ error: 'Error al convertir archivo', detalles: stderr });
      }

      try {
        const pdfBuffer = fs.readFileSync(outputPath);
        const uploadResult = await uploadFile(pdfBuffer, 'application/pdf');

        if (!uploadResult?.url) {
          throw new Error('No se obtuvo la URL de Backblaze');
        }

        await adminDb.collection("documentos").add({
          nombreOriginal: originalName,
          tipo: 'application/pdf',
          urlB2: uploadResult.url,
          fechaSubida: new Date(),
          estado: 'pendiente de revisión',
          usuarioEmail: req.user.email,
          subidoPorUid: req.user.uid
        });

        return res.json({ success: true });
      } catch (uploadError) {
        console.error("Error al subir PDF:", uploadError);
        return res.status(500).json({ error: 'Falló la subida del archivo' });
      } finally {
        fs.existsSync(tempInputPath) && fs.unlinkSync(tempInputPath);
        fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
      }
    });
  } catch (error) {
    console.error("Error al convertir archivo:", error);
    res.status(500).json({ error: 'Error al convertir archivo' });
  }
});


// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor backend corriendo en puerto ${port}`);
});
