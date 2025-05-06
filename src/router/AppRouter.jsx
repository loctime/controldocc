// src/router/AppRouter.jsx
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CompanyProvider } from "../contextos/company-context";
import { Box, Typography, CircularProgress } from "@mui/material";
import DocumentLibraryPage from "../component/administrador/DocumentLibraryPage";
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Verificando autenticación...</Typography>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role === "DhHkVja" ? "admin" : "user";

  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
};

const AppRouter = () => {
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
      </CompanyProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
