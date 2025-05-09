// src/router/AppRouter.jsx
import React, { useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CompaniesProvider } from "../context/CompaniesContext";
import { Box, Typography, CircularProgress } from "@mui/material";
import DocumentLibraryPage from "../component/administrador/DocumentLibraryPage";
// Componentes
import Login from "../component/public/Login";
import AdminLayout from "../component/administrador/AdminLayout";
import AdminDashboard from "../component/administrador/AdminDashboard";
import AdminCompaniesPage from "../component/administrador/AdminCompaniesPage";
import AdminRequiredDocumentsPage from "../component/administrador/AdminRequiredDocumentsPage";
import AdminUploadedDocumentsPage from "../component/administrador/AdminUploadedDocumentsPage";
import UsuarioDashboard from "../component/usuario/UsuarioDashboard";
// Nuevos componentes
import Register from "../component/public/register";
import AdminAcceptCompanyPage from "../component/administrador/AdminAcceptCompanyPage";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const [verifyingRole, setVerifyingRole] = useState(true);

  useEffect(() => {
    const verifyRole = async () => {
      if (user) {
        console.log('[ProtectedRoute] Verificando rol para:', user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          console.log('[ProtectedRoute] Datos de usuario:', userDoc.data());
          const role = userDoc.data().role === "DhHkVja" ? "admin" : "user";
          console.log(`[ProtectedRoute] Rol requerido: ${allowedRoles}, Rol actual: ${role}`);
          
          if (!allowedRoles.includes(role)) {
            console.log('[ProtectedRoute] Redirigiendo por rol no autorizado');
            return <Navigate to={`/${role}/dashboard`} replace />;
          }
        }
      }
      setVerifyingRole(false);
    };
    verifyRole();
  }, [user]);

  if (loading || verifyingRole) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <CompaniesProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
            <Route path="company-approvals" element={<AdminAcceptCompanyPage />} />
            <Route path="required-documents" element={<AdminRequiredDocumentsPage />} />
            <Route path="uploaded-documents" element={<AdminUploadedDocumentsPage />} />
            <Route path="document-library" element={<DocumentLibraryPage />} />
          </Route>

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
      </CompaniesProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
