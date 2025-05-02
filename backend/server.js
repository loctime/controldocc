// backend/server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import morgan from 'morgan';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

import { authenticateFirebaseUser } from './middleware/authenticateFirebaseUser.js';
import uploadRoutes from './routes/upload.js';
import authRoutes from './routes/auth.js';

// 🔐 Inicializar Firebase Admin
import admin from 'firebase-admin';
config({ path: '.env' });

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
  console.error('[SERVER] ❌ Faltan variables de entorno para Firebase Admin');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseAdminConfig)
});
console.log('[SERVER] ✅ Firebase Admin inicializado:', firebaseAdminConfig.projectId);

const app = express();
const port = process.env.PORT || 3001;
const upload = multer();

// 🧾 Crear carpetas necesarias
const uploadDir = path.join(process.cwd(), 'src/uploadconvert/upload');
const convertedDir = path.join(process.cwd(), 'src/uploadconvert/converted');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir, { recursive: true });

// 🔄 Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: ["http://localhost:5173", "https://controldocc.vercel.app"],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔁 Ping de estado
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'active', timestamp: new Date() });
});

// 📦 Rutas externas
app.use('/api', uploadRoutes(upload));
app.use('/api', authRoutes); // /api/custom-login

// 🚀 Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor backend corriendo en puerto ${port}`);
});
