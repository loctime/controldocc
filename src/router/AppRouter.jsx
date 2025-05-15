// src/router/AppRouter.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CompaniesProvider } from "../context/CompaniesContext";
import ProtectedRoute from "./ProtectedRoute"; // ✅ import del nuevo componente
import Login from "../component/public/Login";
import Register from "../component/public/register";
import AdminLayout from "../component/administrador/AdminLayout";
import AdminDashboard from "../component/administrador/AdminDashboard";
import AdminCompaniesPage from "../component/administrador/AdminCompaniesPage";
import AdminRequiredDocumentsPage from "../component/administrador/AdminRequiredDocumentsPage";
import AdminUploadedDocumentsPage from "../component/administrador/AdminUploadedDocumentsPage";
import DocumentLibraryPage from "../component/administrador/DocumentLibraryPage";
import AdminAcceptCompanyPage from "../component/administrador/AdminAcceptCompanyPage";
import AdminStore from "../component/administrador/AdminStore";
import UsuarioDashboard from "../component/usuario/UsuarioDashboard";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <CompaniesProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas para administradores */}
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
            <Route path="store" element={<AdminStore />} />
          </Route>

          {/* Rutas protegidas para usuarios */}
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

          {/* Ruta fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CompaniesProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
