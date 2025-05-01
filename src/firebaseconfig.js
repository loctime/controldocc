// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Constante para el rol de administrador
const ADMIN_ROLE = "DhHkVja";

/**
 * Verifica si un usuario es administrador basado en su rol
 * @param {string} userId - ID del usuario en Firebase Auth
 * @returns {Promise<boolean>} - True si el usuario es administrador, false en caso contrario
 */
async function isUserAdmin(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.rol === ADMIN_ROLE;
    }
    return false;
  } catch (error) {
    console.error("Error al verificar el rol del usuario:", error);
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
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
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

export { db, auth, ADMIN_ROLE, isUserAdmin, signIn, loginWithGoogle, firebaseSignOut };