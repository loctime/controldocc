// src/router/AppRouter.jsx
import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CompanyProvider } from "../contexts/company-context";
import { Box, Typography, CircularProgress } from "@mui/material";

// Componentes
import Login from "../component/login/Login";
import AdminLayout from "../component/administrador/AdminLayout";
import AdminDashboard from "../component/administrador/AdminDashboard";
import AdminCompaniesPage from "../component/administrador/AdminCompaniesPage";
import AdminRequiredDocumentsPage from "../component/administrador/AdminRequiredDocumentsPage";
import AdminUploadedDocumentsPage from "../component/administrador/AdminUploadedDocumentsPage";
import UsuarioDashboard from "../component/usuario/UsuarioDashboard";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const [userCompanyData, setUserCompanyData] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificar si hay datos de empresa en localStorage
    const storedData = localStorage.getItem("userCompany");
    if (storedData) {
      try {
        setUserCompanyData(JSON.parse(storedData));
      } catch (error) {
        console.error("Error parsing userCompany data:", error);
        localStorage.removeItem("userCompany"); // Limpiar datos corruptos
      }
    }
    setIsChecking(false);
  }, []);

  // Mostrar indicador de carga mientras verificamos autenticación
  if (loading || isChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Verificando autenticación...</Typography>
        </Box>
      </Box>
    );
  }

  // Redireccionar a login si no hay autenticación
  if (!user && !userCompanyData) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos según el tipo de usuario
  if (user && user.role === "admin") {
    // Usuario administrador
    if (!allowedRoles.includes("admin")) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } else if (userCompanyData) {
    // Usuario empresa
    if (!allowedRoles.includes("user")) {
      return <Navigate to="/usuario/dashboard" replace />;
    }
  } else {
    // No autenticado o rol no reconocido
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { user } = useContext(AuthContext);
  const [userCompanyData, setUserCompanyData] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem("userCompany");
    if (storedData) {
      setUserCompanyData(JSON.parse(storedData));
    }
  }, []);

  return (
    <BrowserRouter>
      <CompanyProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="required-documents" element={<AdminRequiredDocumentsPage />} />
            <Route path="uploaded-documents" element={<AdminUploadedDocumentsPage />} />
          </Route>

          {/* Rutas para usuarios empresa */}
          <Route
            path="/usuario"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UsuarioDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuario/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UsuarioDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CompanyProvider>
    </BrowserRouter>
  );
};

export default AppRouter;