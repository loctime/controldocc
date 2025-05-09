// Import the functions you need from the SDKs you need
import admin from "firebase-admin";

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
admin.initializeApp(firebaseConfig);
const db = admin.firestore();
const auth = admin.auth();

// Apps de Firebase
const secondaryApp = admin.initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = secondaryApp.auth();

// Constante para el rol de administrador
const ADMIN_ROLE = process.env.ADMIN_ROLE || "DhHkVja"; // Valor por defecto por compatibilidad

/**
 * Verifica si un usuario es administrador basado en su rol
 * @param {string} userId - ID del usuario en Firebase Auth
 * @returns {Promise<boolean>} - True si el usuario es administrador, false en caso contrario
 */
async function isUserAdmin(userId) {
  try {
    const companyDoc = await db.doc(`companies/${userId}`).get();
    if (companyDoc.exists()) {
      return companyDoc.data().role === ADMIN_ROLE;
    }
    return false;
  } catch (error) {
    console.error("Error al verificar rol de administrador:", error);
    return false;
  }
}

/**
 * Inicia sesión con email y contraseña y verifica si es administrador
 * @param {Object} credentials - Credenciales del usuario (email y password)
 * @returns {Promise<Object>} - Objeto con información del usuario y si es admin
 */
async function signIn(credentials) {
  try {
    const { email, password } = credentials;
    console.log('Intentando iniciar sesión con:', email);
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log('Usuario autenticado:', user.uid);
    
    // Intentar verificar si es administrador, pero no fallar si hay problemas
    let isAdmin = false;
    try {
      isAdmin = await isUserAdmin(user.uid);
      console.log('Es administrador:', isAdmin);
    } catch (adminError) {
      console.error('Error al verificar rol de administrador:', adminError);
      // Si hay error al verificar el rol, asumimos que no es admin pero permitimos continuar
      isAdmin = false;
    }
    
    return {
      user,
      isAdmin
    };
  } catch (error) {
    console.error('Error en función signIn:', error);
    throw error; // Re-lanzamos el error para que pueda ser manejado por el componente
  }
}

/**
 * Inicia sesión con Google y verifica si es administrador
 * @returns {Promise<Object>} - Objeto con información del usuario y si es admin
 */
async function loginWithGoogle() {
  try {
    console.log('Intentando iniciar sesión con Google');
    const provider = new admin.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    console.log('Usuario de Google autenticado:', user.uid);
    
    // Intentar verificar si es administrador, pero no fallar si hay problemas
    let isAdmin = false;
    try {
      isAdmin = await isUserAdmin(user.uid);
      console.log('Es administrador (Google):', isAdmin);
    } catch (adminError) {
      console.error('Error al verificar rol de administrador (Google):', adminError);
      // Si hay error al verificar el rol, asumimos que no es admin pero permitimos continuar
      isAdmin = false;
    }
    
    return {
      user,
      isAdmin
    };
  } catch (error) {
    console.error('Error en función loginWithGoogle:', error);
    throw error; // Re-lanzamos el error para que pueda ser manejado por el componente
  }
}

const signOut = () => admin.auth().signOut();
export { db, auth, secondaryAuth, ADMIN_ROLE, isUserAdmin, signIn, loginWithGoogle, signOut };