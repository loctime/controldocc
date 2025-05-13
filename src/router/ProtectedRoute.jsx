// src/router/ProtectedRoute.jsx
import React, { useEffect, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { Box, CircularProgress, Typography } from "@mui/material";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const [roleAllowed, setRoleAllowed] = useState(null);
  const [verifyingRole, setVerifyingRole] = useState(true);

  useEffect(() => {
    const verifyRole = async () => {
      if (!user) {
        setRoleAllowed(false);
        setVerifyingRole(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          console.warn("[ProtectedRoute] Usuario no encontrado en Firestore");
          setRoleAllowed(false);
        } else {
          const userRole = userDoc.data().role === "DhHkVja" ? "admin" : "user";
          const isAllowed = allowedRoles.includes(userRole);
          setRoleAllowed(isAllowed);
        }
      } catch (err) {
        console.error("[ProtectedRoute] Error al verificar rol:", err);
        setRoleAllowed(false);
      } finally {
        setVerifyingRole(false);
      }
    };

    verifyRole();
  }, [user]);

  if (loading || verifyingRole) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || roleAllowed === false) {
    const fallback = user?.role === "DhHkVja" ? "/admin/dashboard" : "/usuario/dashboard";
    return <Navigate to={user ? fallback : "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
