"use client";

import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseconfig";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useCompanies } from "../../context/CompaniesContext";
import DocumentTemplateManager from "./DocumentTemplateManager";
import FileUploader from "../../components/common/FileUploader";
import { uploadFile } from "../../utils/FileUploadService";
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
  FormHelperText,
  useTheme
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';

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
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');

  const { selectedCompany } = useCompanies();
  const selectedCompanyId = selectedCompany?.id || selectedCompany;
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
      const auth = getAuth();
      const user = auth.currentUser;
  
      const newDocument = {
        name: newDocName.trim(),
        entityType,
        companyId: selectedCompanyId,
        allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png"],
        deadline: { date: expirationDate },
        exampleImage: exampleImage || "",
        comentario: comment || "",
        createdAt: new Date().toISOString(),
        subidoDesde: "frontend",
        subidoPorUid: user?.uid || "",
        subidoPorEmail: user?.email || ""
      };
  
      await addDoc(collection(db, "requiredDocuments"), newDocument);
      await loadDocuments();
      resetForm();
    } catch (error) {
      setError("Error al crear documento: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = async (selectedFile) => {
    try {
      setIsUploadingImage(true);
      setFile(selectedFile);
      setFileType(selectedFile.type.startsWith('image/') ? 'image' : 'pdf');
      setImagePreview(URL.createObjectURL(selectedFile));
      
      const result = await uploadFile(selectedFile, "admin/document_examples");
      setExampleImage(result.url);
    } catch (error) {
      setError(`Error al subir archivo: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
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

  const resetForm = () => {
    setNewDocName("");
    setEntityType("company");
    setExpirationDate("");
    setExampleImage(null);
    setImagePreview("");
    setComment("");
  };

  const handlePasteImage = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i <items.length; i++) {
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
            error={!!validationErrors.name}
            helperText={validationErrors.name}
          />
          <FormControl sx={{ minWidth: 200 }} error={!!validationErrors.entityType}>
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
            {validationErrors.entityType && (
              <FormHelperText>{validationErrors.entityType}</FormHelperText>
            )}
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
          <Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <TextField
      label="Comentario (opcional)"
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      fullWidth
      multiline
      rows={3}
    />
  </Grid>

  <Grid item xs={12} md={6}>
    {imagePreview ? (
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 2,
          p: 1,
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {fileType === 'image' ? (
          <img
            src={imagePreview}
            alt="Vista previa"
            style={{ maxWidth: "100%", maxHeight: 150, borderRadius: 8 }}
          />
        ) : fileType === 'pdf' ? (
          <Box sx={{ textAlign: 'center' }}>
            <Box 
              component="iframe"
              src={imagePreview} 
              style={{ 
                width: '100%', 
                height: 150, 
                border: 'none',
                borderRadius: 8,
                mb: 1,
                cursor: 'pointer'
              }}
              title="Vista previa PDF"
              onClick={() => window.open(imagePreview, '_blank')}
            />
            <Typography 
              variant="caption" 
              display="block"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => window.open(imagePreview, '_blank')}
            >
              {file?.name || 'Documento PDF'} (click para abrir completo)
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              border: '1px dashed #ccc',
              borderRadius: 2,
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            Sin vista previa
          </Box>
        )}
      </Box>
    ) : (
      <Box
        sx={{
          border: '1px dashed #ccc',
          borderRadius: 2,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}
      >
        Sin vista previa
      </Box>
    )}
  </Grid>
</Grid>

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2">Imagen de ejemplo (opcional)</Typography>
            <Box>
  <Button variant="contained" component="label">
    Seleccionar archivo (PDF o imagen)
    <input
      type="file"
      hidden
      accept=".pdf,.jpg,.jpeg,.png,image/*"
      onChange={(e) => {
        const selected = e.target.files[0];
        if (selected) {
          // Validar tipo y tamaño
          const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          const maxSize = 5 * 1024 * 1024; // 5MB
          
          if (!validTypes.includes(selected.type)) {
            setError('Solo se permiten PDFs o imágenes (JPEG/PNG)');
            return;
          }
          
          if (selected.size > maxSize) {
            setError('El archivo no debe exceder los 5MB');
            return;
          }
          
          handleFileUpload(selected);
        }
      }}
    />
  </Button>
</Box>

            {isUploadingImage && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} />
                <Typography variant="caption">Subiendo archivo...</Typography>
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
  <strong>Vencimiento del documento:</strong>{" "}
  {doc.vencimiento
    ? new Date(doc.vencimiento).toLocaleDateString()
    : doc.deadline?.date
    ? new Date(doc.deadline.date).toLocaleDateString()
    : 'Sin fecha'}
</Typography>

{doc.comentario && (
  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
    <strong>Comentario:</strong> {doc.comentario}
  </Typography>
)}
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
