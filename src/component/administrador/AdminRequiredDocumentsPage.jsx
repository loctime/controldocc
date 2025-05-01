"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useCompany } from "../../contexts/company-context";
import DocumentTemplateManager from "./DocumentTemplateManager";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";

export default function AdminRequiredDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [newDocName, setNewDocName] = useState("");
  const [entityType, setEntityType] = useState("company");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogState, setDeleteDialogState] = useState({ open: false, documentId: null });
  const [exampleImage, setExampleImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");

  const { selectedCompanyId } = useCompany();
  const theme = useTheme();

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    entityType: '',
    deadline: ''
  });

  useEffect(() => {
    if (selectedCompanyId) {
      loadDocuments();
    } else {
      setDocuments([]);
      setLoading(false);
    }
  }, [selectedCompanyId]);

  const loadDocuments = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "requiredDocuments"),
        where("companyId", "==", selectedCompanyId)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(list);
    } catch (error) {
      console.error("Error loading documents:", error);
      setError("Error al cargar los documentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      let exampleImageUrl = "";
      if (exampleImage) {
        if (typeof exampleImage !== "string") {
          const formData = new FormData();
          formData.append("file", exampleImage);
          formData.append("folder", "documentExamples");
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
          const res = await fetch(`${apiUrl}/api/upload`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          exampleImageUrl = data.url;
        } else {
          exampleImageUrl = exampleImage;
        }
      }
      
      const newDocument = {
        name: newDocName.trim(),
        entityType,
        companyId: selectedCompanyId,
        allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png"],
        deadline: {
          date: expirationDate
        },
        exampleImage: exampleImageUrl || "",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "requiredDocuments"), newDocument);

      // Limpiar formulario
      setNewDocName("");
      setEntityType("company");
      setExpirationDate("");
      setExampleImage(null);
      setImagePreview("");

      await loadDocuments();
    } catch (error) {
      console.error("Error creating document:", error);
      setError("Error al crear el documento.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      name: !newDocName.trim() ? 'El nombre es requerido' : '',
      entityType: !entityType ? 'Selecciona un tipo' : '',
      deadline: !expirationDate ? 'Fecha requerida' : ''
    };
    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "documentExamples");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setExampleImage(data.url);
        setImagePreview(URL.createObjectURL(file));
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Error al subir la imagen de ejemplo");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePasteImage = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        const imageUrl = URL.createObjectURL(blob);
        setImagePreview(imageUrl);
        setExampleImage(blob);
        break;
      }
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogState({ open: false, documentId: null });
  };

  const handleDeleteDocument = async () => {
    const documentIdToDelete = deleteDialogState.documentId;
    if (!documentIdToDelete) return;

    setDeleteDialogState({ open: false, documentId: null });

    setTimeout(async () => {
      try {
        setLoading(true);
        await deleteDoc(doc(db, "requiredDocuments", documentIdToDelete));
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentIdToDelete));
      } catch (error) {
        console.error("Error deleting document:", error);
        setError("Error al eliminar el documento.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Documentos Requeridos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!selectedCompanyId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Información</AlertTitle>
          Selecciona una empresa para gestionar sus documentos requeridos.
        </Alert>
      )}

      {/* Formulario para agregar documento */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Agregar Nuevo Documento
        </Typography>
        <Box component="form" onSubmit={handleCreateDocument} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Nombre del documento"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            fullWidth
            disabled={loading || !selectedCompanyId}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Aplicable a</InputLabel>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              label="Aplicable a"
              disabled={loading || !selectedCompanyId}
            >
              <MenuItem value="company">Empresa (documento único)</MenuItem>
              <MenuItem value="employee">Empleado (uno por cada persona)</MenuItem>
              <MenuItem value="vehicle">Vehículo (uno por cada vehículo)</MenuItem>
            </Select>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
              {entityType === 'employee' ? 
                'Este documento deberá ser subido para cada empleado registrado por la empresa.' :
              entityType === 'vehicle' ? 
                'Este documento deberá ser subido para cada vehículo registrado por la empresa.' :
                'Este documento se aplica a la empresa en general.'}
            </Typography>
          </FormControl>
          <TextField
            label="Fecha de vencimiento"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            disabled={loading || !selectedCompanyId}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
            required
            error={!!validationErrors.deadline}
            helperText={validationErrors.deadline}
          />
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2">Imagen de ejemplo (opcional)</Typography>
            <Box 
              sx={{ 
                border: '1px dashed', 
                borderColor: 'divider', 
                p: 2, 
                borderRadius: 1,
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
              onPaste={handlePasteImage}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Ejemplo de documento" 
                  style={{ maxWidth: '100%', maxHeight: 200 }} 
                />
              ) : (
                <Typography textAlign="center" color="text.secondary">
                  Pega una imagen aquí o sube un archivo
                </Typography>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                disabled={isUploadingImage}
              />
            </Box>
            {isUploadingImage && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} />
                <Typography variant="caption">Subiendo imagen...</Typography>
              </Box>
            )}
          </Box>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={loading || !newDocName.trim() || !selectedCompanyId}
          >
            Crear
          </Button>
        </Box>
      </Paper>

      {/* Gestor de plantillas de documentos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Plantillas de documentos
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Guarde la lista actual de documentos como una plantilla para reutilizarla con otras empresas, o aplique una plantilla existente.
        </Typography>
        <DocumentTemplateManager 
          onApplyTemplate={async (templateDocuments) => {
            if (!selectedCompanyId || !templateDocuments || templateDocuments.length === 0) return;
            
            setLoading(true);
            setError("");
            
            try {
              // Crear cada documento de la plantilla en Firestore
              const promises = templateDocuments.map(docTemplate => 
                addDoc(collection(db, "requiredDocuments"), {
                  ...docTemplate,
                  companyId: selectedCompanyId,
                  createdAt: new Date().toISOString()
                })
              );
              
              await Promise.all(promises);
              
              // Recargar la lista de documentos
              await loadDocuments();
              
            } catch (error) {
              console.error("Error al aplicar plantilla:", error);
              setError("Error al aplicar la plantilla de documentos.");
            } finally {
              setLoading(false);
            }
          }} 
          currentDocuments={documents} 
        />
      </Paper>

      {/* Lista de documentos */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Typography textAlign="center" color="text.secondary">
          {selectedCompanyId ? "No hay documentos configurados." : "Selecciona una empresa para ver documentos."}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {documents.map((doc) => (
            <Grid xs={12} sm={6} md={4} key={doc.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">{doc.name}</Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Aplicable a:</strong> {doc.entityType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Vencimiento:</strong> {doc.deadline?.date ? new Date(doc.deadline.date).toLocaleDateString() : 'Sin fecha'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title="Eliminar documento">
                    <IconButton color="error" onClick={() => setDeleteDialogState({ open: true, documentId: doc.id })}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo de confirmación */}
      <Dialog
        open={deleteDialogState.open}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro que deseas eliminar este documento?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancelar
          </Button>
          <Button color="error" onClick={handleDeleteDocument} variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
