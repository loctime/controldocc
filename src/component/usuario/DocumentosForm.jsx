import React, { useState, useEffect } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

const DocumentosForm = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [entityList, setEntityList] = useState([]);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");

  // Obtener información de la empresa desde localStorage
  const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
  const companyId = userCompanyData?.companyId;

  useEffect(() => {
    if (!companyId) return;
    
    const fetchRequiredDocuments = async () => {
      setLoading(true);
      try {
        // Obtener documentos requeridos para esta empresa
        const docsQuery = query(
          collection(db, "requiredDocuments"),
          where("companyId", "==", companyId)
        );
        
        const docsSnapshot = await getDocs(docsQuery);
        const docsList = docsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequiredDocuments(docsList);
        
        // Obtener documentos ya subidos
        const uploadedDocsQuery = query(
          collection(db, "uploadedDocuments"),
          where("companyId", "==", companyId)
        );
        
        const uploadedDocsSnapshot = await getDocs(uploadedDocsQuery);
        const uploadedDocsList = uploadedDocsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUploadedDocuments(uploadedDocsList);
      } catch (err) {
        console.error("Error al cargar documentos:", err);
        setError("Error al cargar los documentos requeridos.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequiredDocuments();
  }, [companyId]);

  // Cargar lista de entidades (personal o vehículos) cuando cambia el tipo de documento seleccionado
  useEffect(() => {
    if (!companyId || !selectedDocument) return;
    
    const fetchEntities = async () => {
      try {
        const selectedDocData = requiredDocuments.find(doc => doc.id === selectedDocument);
        if (!selectedDocData) return;
        
        const entityType = selectedDocData.entityType;
        let entities = [];
        
        if (entityType === "Personal") {
          // Cargar lista de personal
          const personalQuery = query(
            collection(db, "personal"),
            where("companyId", "==", companyId)
          );
          
          const personalSnapshot = await getDocs(personalQuery);
          entities = personalSnapshot.docs.map(doc => ({
            id: doc.id,
            name: `${doc.data().nombre} ${doc.data().apellido}`,
            ...doc.data()
          }));
        } else if (entityType === "Vehículo") {
          // Cargar lista de vehículos
          const vehiculosQuery = query(
            collection(db, "vehiculos"),
            where("companyId", "==", companyId)
          );
          
          const vehiculosSnapshot = await getDocs(vehiculosQuery);
          entities = vehiculosSnapshot.docs.map(doc => ({
            id: doc.id,
            name: `${doc.data().marca} ${doc.data().modelo} (${doc.data().patente})`,
            ...doc.data()
          }));
        } else if (entityType === "Empresa") {
          // Para documentos de empresa, solo necesitamos un elemento
          entities = [{
            id: companyId,
            name: userCompanyData.companyName || "Empresa",
            type: "Empresa"
          }];
        }
        
        setEntityList(entities);
      } catch (err) {
        console.error("Error al cargar entidades:", err);
      }
    };
    
    fetchEntities();
  }, [companyId, selectedDocument, requiredDocuments]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedDocument || !file) {
      setError("Por favor selecciona un documento y un archivo para subir.");
      return;
    }
    
    const selectedDocData = requiredDocuments.find(doc => doc.id === selectedDocument);
    if (!selectedDocData) {
      setError("Documento no encontrado.");
      return;
    }
    
    if (selectedDocData.entityType !== "Empresa" && !selectedEntity) {
      setError(`Por favor selecciona un ${selectedDocData.entityType.toLowerCase()} para este documento.`);
      return;
    }
    
    setUploading(true);
    setError("");
    
    try {
      // Crear una referencia única para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}_${selectedDocument}_${selectedEntity || 'empresa'}_${Date.now()}.${fileExt}`;
    
      // Subir el archivo al backend que maneja Backblaze
      const formData = new FormData();
      formData.append("file", file);
    
      const response = await fetch(`${i
        mport.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
    
      if (!response.ok) {
        throw new Error("Error al subir el archivo");
      }
    
      const { url: downloadURL } = await response.json();
    
      // Guardar la referencia en Firestore
      const docData = {
        companyId,
        requiredDocumentId: selectedDocument,
        documentName: selectedDocData.name,
        entityType: selectedDocData.entityType,
        entityId: selectedEntity || companyId,
        entityName: selectedEntity 
          ? entityList.find(e => e.id === selectedEntity)?.name || "Desconocido"
          : userCompanyData.companyName || "Empresa",
        fileURL: downloadURL,
        fileName,
        fileType: fileExt,
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
        status: "Pendiente de revisión",
        comment: comment || ""
      };
      
      await addDoc(collection(db, "uploadedDocuments"), docData);
      
      // Limpiar el formulario
      setFile(null);
      setSelectedDocument("");
      setSelectedEntity("");
      setComment("");
      
      // Actualizar la lista de documentos subidos
      const newUploadedDoc = {
        ...docData,
        id: Date.now().toString() // ID temporal hasta que se recargue la página
      };
      
      setUploadedDocuments(prev => [...prev, newUploadedDoc]);
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Resetear el input de archivo
      const fileInput = document.getElementById('document-file-input');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Error al subir documento:", err);
      setError("Error al subir el documento. Intenta nuevamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!docId) return;
    
    if (confirm("¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.")) {
      setLoading(true);
      
      try {
        // Marcar el documento como eliminado en Firestore
        const docRef = doc(db, "uploadedDocuments", docId);
        await updateDoc(docRef, {
          status: "Eliminado",
          deletedAt: serverTimestamp()
        });
        
        // Actualizar la lista local
        setUploadedDocuments(prev => 
          prev.filter(doc => doc.id !== docId)
        );
      } catch (err) {
        console.error("Error al eliminar documento:", err);
        setError("Error al eliminar el documento.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  // Verificar si un documento ya ha sido subido para una entidad específica
  const isDocumentUploaded = (docId, entityId) => {
    return uploadedDocuments.some(
      doc => doc.requiredDocumentId === docId && 
             (doc.entityId === entityId || (!entityId && doc.entityType === "Empresa"))
    );
  };

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Subir Documento
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleUpload}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={selectedDocument}
                  label="Tipo de Documento"
                  onChange={(e) => {
                    setSelectedDocument(e.target.value);
                    setSelectedEntity("");
                  }}
                  disabled={uploading}
                >
                  <MenuItem value="">Selecciona un documento</MenuItem>
                  {requiredDocuments.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      {doc.name} ({doc.entityType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {selectedDocument && requiredDocuments.find(doc => doc.id === selectedDocument)?.entityType !== "Empresa" && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>
                    {requiredDocuments.find(doc => doc.id === selectedDocument)?.entityType || "Entidad"}
                  </InputLabel>
                  <Select
                    value={selectedEntity}
                    label={requiredDocuments.find(doc => doc.id === selectedDocument)?.entityType || "Entidad"}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    disabled={uploading || entityList.length === 0}
                  >
                    <MenuItem value="">
                      Selecciona {requiredDocuments.find(doc => doc.id === selectedDocument)?.entityType.toLowerCase() || "entidad"}
                    </MenuItem>
                    {entityList.map((entity) => (
                      <MenuItem 
                        key={entity.id} 
                        value={entity.id}
                        disabled={isDocumentUploaded(selectedDocument, entity.id)}
                      >
                        {entity.name} {isDocumentUploaded(selectedDocument, entity.id) && "(Ya subido)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentario (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={uploading}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                disabled={uploading}
                sx={{ mr: 2 }}
              >
                Seleccionar Archivo
                <input
                  id="document-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              
              {file && (
                <Typography variant="body2" component="span">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={uploading || !selectedDocument || !file}
                startIcon={uploading ? <CircularProgress size={24} /> : <UploadFileIcon />}
              >
                {uploading ? "Subiendo..." : "Subir Documento"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Documentos Subidos
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : uploadedDocuments.length === 0 ? (
          <Alert severity="info">
            No has subido ningún documento aún.
          </Alert>
        ) : (
          <List>
            {uploadedDocuments.map((doc) => (
              <React.Fragment key={doc.id}>
                <ListItem component="button">
                  <ListItemIcon>
                    <DescriptionIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
  primary={doc.documentName}
  secondary={
    <>
      <Typography variant="body2" component="div">
        {doc.entityType}: {doc.entityName} | Estado: {doc.status}
      </Typography>
      <Typography variant="body2" component="div">
        Subido: {doc.uploadedAt ? new Date(doc.uploadedAt.seconds * 1000).toLocaleString() : "Recién subido"}
      </Typography>
    </>
  }
  secondaryTypographyProps={{ component: "div" }}
/>

                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={loading}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Documento subido exitosamente
        </Alert>
      </Snackbar>
    </>
  );
};

export default DocumentosForm;
