import express from 'express';
import { uploadFile } from '../services/backblazeService.js';
import { dbAdmin } from '../firebase/admin.js';
import { authenticateFirebaseUser } from '../middleware/authenticateFirebaseUser.js';

const router = express.Router();

export default (upload) => {
  router.post('/upload', 
    authenticateFirebaseUser,
    upload.single('file'),
    async (req, res) => {
      try {
        // Validación de admin
        const isAdminRequest = req.body.isAdmin === 'true';
        if (isAdminRequest && req.user.role !== 'DhHkVja') {
          return res.status(403).json({ error: 'Se requieren privilegios de administrador' });
        }

        // Validación de archivo
        if (!req.file?.buffer) {
          return res.status(400).json({ error: 'No se recibió ningún archivo válido' });
        }

        // Configuración de folder y metadatos
        const folder = req.body.folder || (isAdminRequest ? 'admin/general' : `empresas/${req.user.companyId}`);
        const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

        // Subida a Backblaze
        const uploadResult = await uploadFile(
          req.file.buffer,
          req.file.mimetype,
          {
            folder,
            sha1: req.body.sha1,
            originalFilename: req.file.originalname,
            customMetadata: {
              uploader: req.user.email,
              companyId: req.user.companyId,
              ...metadata
            }
          }
        );

        if (!uploadResult?.url) {
          return res.status(500).json({ error: 'Error al subir el archivo' });
        }

        // Guardar en Firestore
        const docData = {
          nombreOriginal: req.file.originalname,
          tipo: req.file.mimetype,
          urlB2: uploadResult.url,
          fechaSubida: new Date(),
          estado: 'pendiente',
          usuarioEmail: req.user.email,
          subidoPorUid: req.user.uid,
          comentario: metadata.comentario || "",
          vencimiento: metadata.vencimiento || "",
          ...(isAdminRequest ? { isAdminUpload: true } : { companyId: req.user.companyId }),
          ...(metadata.documentType && { documentType: metadata.documentType }),
          ...(metadata.companyId && { companyId: metadata.companyId })
        };

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
