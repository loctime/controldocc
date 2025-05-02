// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          const userData = userDocSnap.exists() ? userDocSnap.data() : {};

          // 🔐 Extraer rol y companyId del documento de Firestore o fallback
          firebaseUser.role = userData.role || "user";
          firebaseUser.companyId = userData.companyId || null;

          setUser(firebaseUser);
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
