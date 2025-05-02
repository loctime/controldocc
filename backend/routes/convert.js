// backend/routes/convert.js
import express from 'express';
import { uploadFile } from '../services/backblazeService.js';
import { dbAdmin } from '../firebase/admin.js';
import { authenticateFirebaseUser } from '../middleware/authenticateFirebaseUser.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'src/uploadconvert/upload');
const convertedDir = path.join(process.cwd(), 'src/uploadconvert/converted');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(convertedDir)) fs.mkdirSync(convertedDir, { recursive: true });

export default (upload) => {
  router.post('/upload', authenticateFirebaseUser, upload.single('file'), async (req, res) => {
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

      await dbAdmin.collection("documentos").add({
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

  router.post('/convert', authenticateFirebaseUser, upload.single('file'), async (req, res) => {
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

          await dbAdmin.collection("documentos").add({
            nombreOriginal: originalName,
            tipo: 'application/pdf',
            urlB2: uploadResult.url,
            fechaSubida: new Date(),
            estado: 'pendiente de revisión',
            usuarioEmail: req.user.email,
            subidoPorUid: req.user.uid
          });

          return res.json({ success: true, url: uploadResult.url, originalName, pdfName: outputName });
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

  return router;
};