// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadFile } from './src/services/backblazeService.js';
import { config } from 'dotenv';

config({ path: '.env' });

const app = express();
const upload = multer();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se recibió ningún archivo válido' });
    }

    const fileBuffer = Buffer.isBuffer(req.file.buffer)
      ? req.file.buffer
      : Buffer.from(req.file.buffer);

    const uploadResult = await uploadFile(
      fileBuffer,
      req.file.mimetype
    );
    console.log('Nombre recibido:', req.file.originalname);

    res.json(uploadResult);
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`Servidor backend en http://localhost:${port}`);
});
