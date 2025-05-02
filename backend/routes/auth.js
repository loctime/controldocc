// backend/routes/auth.js
import express from 'express';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const router = express.Router();
const db = getFirestore();

router.post('/custom-login', async (req, res) => {
  const { cuit, password } = req.body;

  if (!cuit || !password) {
    return res.status(400).json({ error: 'CUIT y contraseña requeridos' });
  }

  try {
    const usersSnap = await db.collection('users')
      .where('companyId', '==', cuit)
      .get();

    if (usersSnap.empty) {
      return res.status(404).json({ error: 'Empresa o usuario no encontrado' });
    }

    let matchedUser = null;
    usersSnap.forEach(doc => {
      const user = doc.data();
      if (user.password === password) matchedUser = { id: doc.id, ...user };
    });

    if (!matchedUser) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const uid = `empresa-${matchedUser.id}`;

    const customToken = await admin.auth().createCustomToken(uid, {
      role: matchedUser.role,
      companyId: matchedUser.companyId
    });

    return res.json({ token: customToken });
  } catch (error) {
    console.error("Error generando custom token:", error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;