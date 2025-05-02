import express from 'express';
import { uploadFile } from '../services/backblazeService.js';
import { dbAdmin } from '../firebase/admin.js';
import { authenticateFirebaseUser } from '../middleware/authenticateFirebaseUser.js';

const router = express.Router();

export default (upload) => {
  // 📤 Ruta única de subida (admin o empresa)
  router.post('/upload',
    authenticateFirebaseUser,
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file || !req.file.buffer) {
          return res.status(400).json({ error: 'No se recibió ningún archivo válido' });
        }

        const fileBuffer = Buffer.isBuffer(req.file.buffer)
          ? req.file.buffer
          : Buffer.from(req.file.buffer);

        const uploadResult = await uploadFile(fileBuffer, req.file.mimetype);
        if (!uploadResult?.url) {
          return res.status(500).json({ error: 'No se pudo obtener la URL del archivo subido' });
        }

        const docData = {
          nombreOriginal: req.file.originalname,
          tipo: req.file.mimetype,
          urlB2: uploadResult.url,
          fechaSubida: new Date(),
          estado: 'pendiente de revisión',
          usuarioEmail: req.user.email ?? `usuario-${req.user.uid}`,
          subidoPorUid: req.user.uid,
        };

        if (req.user.role !== 'DhHkVja') {
          docData.companyId = req.user.companyId;
        }

        await dbAdmin.collection("documentos").add(docData);
        res.json({ success: true, url: uploadResult.url });
      } catch (error) {
        console.error('Error en upload:', error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  return router;
};
