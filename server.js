// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadFile } from './src/services/backblazeService.js';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config({ path: '.env' });

const app = express();
const upload = multer();
const port = process.env.PORT || 3000;

// Orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173",
  "https://controldocc.vercel.app"
];

// Middleware CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS bloqueado para origen: " + origin));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true // ← activalo si pensás usar cookies o headers autenticados
}));

// Middlewares para parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de subida de archivos
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
    res.json(uploadResult);
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en puerto ${port}`);
});
