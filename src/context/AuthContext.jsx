import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // 🔍 Buscar al usuario en Firestore por UID personalizado
          const usersQuery = query(
            collection(db, "users"),
            where("firebaseUid", "==", firebaseUser.uid)
          );
          const userSnap = await getDocs(usersQuery);

          if (!userSnap.empty) {
            const userDoc = userSnap.docs[0];
            const userData = userDoc.data();
          
            const extendedUser = {
              ...firebaseUser,
              role: userData.role || "user",
              companyId: userData.companyId || null,
            };
          
            if (extendedUser.companyId) {
              localStorage.setItem("companyId", extendedUser.companyId);
            }
          
            setUser(extendedUser);
          } else {
            console.warn("Usuario logueado en Firebase pero no encontrado en Firestore");
            // Si no existe, registrar al usuario en Firestore
            const userRef = doc(db, "users", firebaseUser.uid);
            await setDoc(userRef, {
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "user", // Por ejemplo, asignamos un rol por defecto
              companyId: null, // Puedes asignar un valor por defecto si lo tienes
            });

            const extendedUser = {
              ...firebaseUser,
              role: "user",
              companyId: null,
            };
            setUser(extendedUser);
          }
        } catch (error) {
          console.error("❌ Error al obtener datos del usuario:", error);
          setUser(null);
          localStorage.removeItem("companyId");
        }
      } else {
        // 🔒 Sesión cerrada o no hay usuario → limpiar estado y storage
        setUser(null);
        localStorage.removeItem("companyId");
      }

      setLoading(false); // Finaliza la carga
    });

    // Cleanup: Desuscribir listener de autenticación al desmontar el componente
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
