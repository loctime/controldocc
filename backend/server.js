// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './firebaseconfig.js';
import uploadRoute from './routes/upload.js'; // ✅ nuevo
import upload from './middleware/multerMiddleware.js'; // ✅ nuevo

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Ruta de subida de archivos
app.use('/api', uploadRoute(upload));

// ✅ Ruta de ping para mantener vivo el servidor (UptimeRobot)
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// ✅ Ruta de salud extendida
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    firebase: true,
    timestamp: new Date().toISOString() 
  });
});

// ✅ Ruta para aprobar empresa
app.post('/api/approve-company', async (req, res) => {
  const { companyId, adminId } = req.body;

  try {
    const isAdmin = await isUserAdmin(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Acceso no autorizado" });
    }

    await db.collection('companies').doc(companyId).update({ 
      approved: true,
      approvedAt: db.firestore.FieldValue.serverTimestamp(),
      approvedBy: adminId
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error aprobando empresa:", error);
    res.status(500).json({ error: "Error al aprobar empresa" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
