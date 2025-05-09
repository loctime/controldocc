import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Iniciando observer de autenticación');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AuthContext] Cambio en estado de autenticación:', {
        uid: firebaseUser?.uid,
        email: firebaseUser?.email
      });

      if (!firebaseUser) {
        console.log('[AuthContext] No hay usuario autenticado');
        setUser(null);
        return setLoading(false);
      }

      try {
        console.log('[AuthContext] Obteniendo datos de Firestore para:', firebaseUser.uid);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        console.log('[AuthContext] Datos obtenidos:', {
          exists: userDoc.exists(),
          data: userDoc.exists() ? userDoc.data() : null
        });

        const userData = userDoc.exists() ? userDoc.data() : {
          role: "user",
          companyId: null
        };

        console.log('[AuthContext] Datos combinados del usuario:', {
          ...firebaseUser,
          ...userData
        });

        setUser({
          ...firebaseUser,
          isAdmin: userData.role === "DhHkVja",
          ...userData
        });
      } catch (error) {
        console.error('[AuthContext] Error crítico:', error);
        setUser(null);
      } finally {
        console.log('[AuthContext] Finalizando carga de usuario');
        setLoading(false);
      }
    });

    return () => {
      console.log('[AuthContext] Limpiando observer de autenticación');
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthProvider;