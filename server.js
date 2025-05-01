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

// Cargar variables de entorno
config({ path: '.env' });

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}
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
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se recibió ningún archivo válido' });
    }

    const fileBuffer = Buffer.isBuffer(req.file.buffer)
      ? req.file.buffer
      : Buffer.from(req.file.buffer);

    const uploadResult = await uploadFile(fileBuffer, req.file.mimetype);
    console.log('Nombre recibido:', req.file.originalname);

    // Guardar metadatos en Firestore
    await adminDb.collection("documentos").add({
      nombreOriginal: req.file.originalname,
      tipo: req.file.mimetype,
      urlB2: uploadResult.url,
      fechaSubida: new Date(),
      estado: 'pendiente de revisión',
      usuarioEmail: req.body.email || 'desconocido'
    });

    res.json(uploadResult);
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/convert', upload.single('file'), async (req, res) => {
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

    // Guardar el archivo original temporalmente
    fs.writeFileSync(tempInputPath, req.file.buffer);

    const command =
      ['.jpg', '.jpeg', '.png'].includes(ext)
        ? `convert "${tempInputPath}" "${outputPath}"`
        : `libreoffice --headless --convert-to pdf --outdir "${convertedDir}" "${tempInputPath}"`;

    exec(command, async (error, stdout, stderr) => {
      fs.unlinkSync(tempInputPath); // eliminar original

      if (error) {
        return res.status(500).json({ error: 'Error al convertir archivo', detalles: stderr });
      }

      try {
        // Leer PDF convertido y subir a B2
        const pdfBuffer = fs.readFileSync(outputPath);
        const uploadResult = await uploadFile(pdfBuffer, 'application/pdf');

        // Guardar metadatos en Firestore
        await adminDb.collection("documentos").add({
          nombreOriginal: originalName,
          tipo: 'application/pdf',
          urlB2: uploadResult.url,
          fechaSubida: new Date(),
          estado: 'pendiente de revisión',
          usuarioEmail: req.body.email || 'desconocido'
        });

        fs.unlinkSync(outputPath); // eliminar PDF local

        // Devolver URL subida
        res.json({ success: true, url: uploadResult.url });

      } catch (uploadError) {
        console.error("Error al subir o guardar PDF:", uploadError);
        fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
        res.status(500).json({ error: 'Error al subir el PDF convertido', detalles: uploadError.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error inesperado', detalles: error.message });
  }
});


// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor backend corriendo en puerto ${port}`);
});
