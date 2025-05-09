// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './firebaseconfig.js';

const app = express();
const port = 3004;
app.use(cors());
app.use(express.json());

// Endpoint de verificación de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    firebase: true,
    timestamp: new Date().toISOString() 
  });
});

// Endpoint para aprobar empresas (solo admin)
app.post('/api/approve-company', async (req, res) => {
  const { companyId, adminId } = req.body;
  
  try {
    // 1. Verificar que el usuario sea admin
    const isAdmin = await isUserAdmin(adminId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Acceso no autorizado" });
    }
    
    // 2. Actualizar estado en Firestore
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
  console.log(`Server running on port ${port}`);
});
