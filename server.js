import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadFile } from './src/services/backblazeService.js';
import { config } from 'dotenv';
config({ path: '.env' });
console.log('[DEBUG] Variables cargadas:', {
  key: process.env.B2_KEY_ID,
  appKey: process.env.B2_APPLICATION_KEY?.substring(0, 6) + '...',
  bucket: process.env.B2_BUCKET_ID
});
const app = express();
const upload = multer();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Archivo recibido:', req.file.originalname); // Log para depuración

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    // Convertir a buffer si es necesario
    const fileBuffer = req.file.buffer instanceof Buffer 
      ? req.file.buffer 
      : Buffer.from(req.file.buffer);

    const fileUrl = await uploadFile(
      fileBuffer,
      `documentExamples/${req.file.originalname}`,
      req.file.mimetype
    );
    
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend en http://localhost:${port}`);
});