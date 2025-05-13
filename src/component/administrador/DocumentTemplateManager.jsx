import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useCompanies } from "../../context/CompaniesContext";
import {
  Box,
  Button,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material";
import {
  Save as SaveIcon,
  FileCopy as FileCopyIcon
} from "@mui/icons-material";

// Importar componentes de diálogo separados
import SaveTemplateDialog from "./dialogs/SaveTemplateDialog";
import TemplatesListDialog from "./dialogs/TemplatesListDialog";
import TemplateDetailsDialog from "./dialogs/TemplateDetailsDialog";

// Importar el componente ErrorBoundary
import ErrorBoundary from "../../components/common/ErrorBoundary";

/**
 * Componente para gestionar plantillas de documentos requeridos
 * Permite guardar y aplicar listas de documentos como plantillas
 */
const DocumentTemplateManager = ({ onApplyTemplate, currentDocuments }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [openTemplatesDialog, setOpenTemplatesDialog] = useState(false);
  
  const { selectedCompany } = useCompanies();
const selectedCompanyId = selectedCompany?.id || selectedCompany;

  // Cargar plantillas existentes usando useCallback para evitar recreaciones innecesarias
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "documentTemplates"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(list);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      setError("Error al cargar las plantillas de documentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar plantillas al montar el componente
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Guardar la lista actual como plantilla
  const saveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      setError("Debe ingresar un nombre para la plantilla");
      return;
    }
    
    if (currentDocuments.length === 0) {
      setError("No hay documentos para guardar como plantilla");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Simplificar los documentos para la plantilla (eliminar IDs específicos de la empresa)
      const templateDocuments = currentDocuments.map(doc => ({
        name: doc.name,
        entityType: doc.entityType,
        allowedFileTypes: doc.allowedFileTypes || [".pdf", ".jpg", ".jpeg", ".png"],
        deadline: doc.deadline,
        exampleImage: doc.exampleImage || "",
      }));

      await addDoc(collection(db, "documentTemplates"), {
        name: templateName.trim(),
        documents: templateDocuments,
        createdAt: new Date().toISOString(),
      });

      // Primero cerramos el diálogo para evitar problemas de DOM
      setOpenSaveDialog(false);
      // Luego actualizamos el estado y recargamos los datos
      setTimeout(() => {
        setSuccess("Plantilla guardada correctamente");
        setTemplateName("");
        loadTemplates();
      }, 100);
    } catch (error) {
      console.error("Error al guardar plantilla:", error);
      setError("Error al guardar la plantilla.");
      setLoading(false);
    }
  }, [templateName, currentDocuments, loadTemplates]);

  // Eliminar una plantilla
  const deleteTemplate = useCallback(async (templateId) => {
    if (!templateId) return;
    
    setLoading(true);
    setError("");
    
    try {
      await deleteDoc(doc(db, "documentTemplates", templateId));
      setSuccess("Plantilla eliminada correctamente");
      loadTemplates();
    } catch (error) {
      console.error("Error al eliminar plantilla:", error);
      setError("Error al eliminar la plantilla.");
    } finally {
      setLoading(false);
    }
  }, [loadTemplates]);

  // Ver detalles de una plantilla
  const viewTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setOpenViewDialog(true);
  }, []);

  // Aplicar una plantilla a la empresa actual
  const applyTemplate = useCallback((template) => {
    if (!template || !template.documents || !onApplyTemplate) return;
    
    // Añadir companyId a cada documento de la plantilla
    const documentsWithCompanyId = template.documents.map(doc => ({
      ...doc,
      companyId: selectedCompanyId
    }));
    
    // Primero cerramos los diálogos para evitar problemas de DOM
    setOpenTemplatesDialog(false);
    setOpenViewDialog(false);
    
    // Luego aplicamos la plantilla y mostramos el mensaje de éxito
    setTimeout(() => {
      onApplyTemplate(documentsWithCompanyId);
      setSuccess(`Plantilla "${template.name}" aplicada correctamente`);
    }, 100);
  }, [onApplyTemplate, selectedCompanyId]);

  return (
    <ErrorBoundary>
      {/* Botones para abrir diálogos */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => setOpenSaveDialog(true)}
          disabled={currentDocuments.length === 0 || loading}
        >
          Guardar como plantilla
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileCopyIcon />}
          onClick={() => setOpenTemplatesDialog(true)}
          disabled={loading}
        >
          Aplicar plantilla
        </Button>
      </Box>

      {/* Diálogos separados en componentes independientes */}
      <SaveTemplateDialog 
        open={openSaveDialog}
        onClose={() => setOpenSaveDialog(false)}
        onSave={saveAsTemplate}
        templateName={templateName}
        setTemplateName={setTemplateName}
        loading={loading}
      />

      <TemplatesListDialog 
        open={openTemplatesDialog}
        onClose={() => setOpenTemplatesDialog(false)}
        templates={templates}
        loading={loading}
        onViewTemplate={viewTemplate}
        onApplyTemplate={applyTemplate}
        onDeleteTemplate={deleteTemplate}
        selectedCompanyId={selectedCompanyId}
      />

      <TemplateDetailsDialog 
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        template={selectedTemplate}
        onApply={applyTemplate}
        selectedCompanyId={selectedCompanyId}
      />

      {/* Notificaciones */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError("")} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess("")} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </ErrorBoundary>
  );
};

export default React.memo(DocumentTemplateManager);