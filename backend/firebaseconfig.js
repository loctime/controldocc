// backend/firebaseconfig.js
import admin from 'firebase-admin';

// ✅ Cargamos la credencial desde una variable de entorno segura
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET // opcional si usás Storage
  });
}

const db = admin.firestore();
const auth = admin.auth();

const ADMIN_ROLE = process.env.ADMIN_ROLE || 'DhHkVja'; // Constante para roles

/**
 * Verifica si un usuario es administrador basado en su rol
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isUserAdmin(userId) {
  try {
    const docRef = db.collection('companies').doc(userId);
    const snapshot = await docRef.get();
    return snapshot.exists && snapshot.data().role === ADMIN_ROLE;
  } catch (error) {
    console.error('Error al verificar rol de administrador:', error);
    return false;
  }
}

export { db, auth, ADMIN_ROLE, isUserAdmin };
