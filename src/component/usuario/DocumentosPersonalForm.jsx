import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebaseconfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  Delete as DeleteIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Info as InfoIcon
} from "@mui/icons-material";

const DocumentosPersonalForm = ({ persona }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");

  // Obtener información de la empresa desde localStorage
  const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
  const companyId = userCompanyData?.companyId;

  useEffect(() => {
    if (!companyId || !persona) return;
    
    const fetchRequiredDocuments = async () => {
      setLoading(true);
      try {
        // Obtener documentos requeridos para esta empresa que sean específicamente para empleados
        const docsQuery = query(
          collection(db, "requiredDocuments"),
          where("companyId", "==", companyId),
          where("entityType", "==", "employee")
        );
        
        const docsSnapshot = await getDocs(docsQuery);
        const docsList = docsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequiredDocuments(docsList);
        
        // Obtener documentos ya subidos para esta persona
        const uploadedDocsQuery = query(
          collection(db, "uploadedDocuments"),
          where("companyId", "==", companyId),
          where("entityType", "==", "employee"),
          where("entityId", "==", persona.id)
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
  }, [companyId, persona]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedDocument || !file || !persona) {
      setError("Por favor selecciona un documento y un archivo para subir.");
      return;
    }
    
    const selectedDocData = requiredDocuments.find(doc => doc.id === selectedDocument);
    if (!selectedDocData) {
      setError("Documento no encontrado.");
      return;
    }
    
    setUploading(true);
    setError("");
    
    try {
      // Crear una referencia única para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}_${selectedDocument}_personal_${persona.id}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `documents/${fileName}`);
      
      // Subir el archivo a Firebase Storage
      await uploadBytes(storageRef, file);
      
      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      
      // Guardar la referencia en Firestore
      const docData = {
        companyId,
        requiredDocumentId: selectedDocument,
        documentName: selectedDocData.name,
        entityType: "employee",
        entityId: persona.id,
        entityName: `${persona.nombre} ${persona.apellido}`,
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
      const fileInput = document.getElementById(`document-personal-file-input-${persona.id}`);
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

  // Verificar si un documento ya ha sido subido
  const isDocumentUploaded = (docId) => {
    return uploadedDocuments.some(doc => doc.requiredDocumentId === docId);
  };
  
  // Obtener el icono según el estado del documento
  const getDocumentStatusIcon = (docId) => {
    const doc = uploadedDocuments.find(doc => doc.requiredDocumentId === docId);
    if (!doc) return <DescriptionIcon color="primary" />;
    
    switch(doc.status) {
      case "Aprobado":
        return <CheckCircleIcon color="success" />;
      case "Rechazado":
        return <ErrorIcon color="error" />;
      case "Pendiente de revisión":
      default:
        return <HourglassEmptyIcon color="warning" />;
    }
  };
  
  // Obtener el texto de estado del documento
  const getDocumentStatusText = (docId) => {
    const doc = uploadedDocuments.find(doc => doc.requiredDocumentId === docId);
    if (!doc) return "Pendiente";
    
    let statusText = doc.status;
    
    // Si tiene comentario del administrador, mostrarlo
    if (doc.adminComment) {
      statusText += ` - ${doc.adminComment}`;
    }
    
    return statusText;
  };

  if (!persona) return null;

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Documentos de {persona.nombre} {persona.apellido}
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Cada empleado debe tener todos los documentos requeridos subidos individualmente. 
          Los documentos marcados como pendientes deben ser subidos para este empleado.
        </Alert>
        
        {requiredDocuments.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No hay documentos requeridos para los empleados. El administrador debe configurar los documentos requeridos.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleUpload}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selecciona un documento para subir:
                  </Typography>
                  <List>
                    {requiredDocuments.map((doc) => (
                      <ListItem 
                        key={doc.id}
                        component="button"
                        selected={selectedDocument === doc.id}
                        onClick={() => setSelectedDocument(doc.id)}
                        disabled={(isDocumentUploaded(doc.id) && getDocumentStatusText(doc.id) !== "Rechazado") || uploading}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          mb: 1,
                          bgcolor: isDocumentUploaded(doc.id) 
                            ? getDocumentStatusText(doc.id).includes("Aprobado") 
                              ? 'rgba(76, 175, 80, 0.1)' 
                              : getDocumentStatusText(doc.id).includes("Rechazado")
                                ? 'rgba(244, 67, 54, 0.1)'
                                : 'rgba(255, 152, 0, 0.1)'
                            : 'transparent'
                        }}
                      >
                        <ListItemIcon>
                          {isDocumentUploaded(doc.id) ? (
                            getDocumentStatusIcon(doc.id)
                          ) : (
                            <DescriptionIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={<>
                            <Typography component="span" variant="subtitle1">
                              {doc.documentName}
                            </Typography>
                            {!isDocumentUploaded(doc.id) && (
                              <Typography component="span" variant="caption" sx={{ ml: 1, color: 'error.main', fontWeight: 'bold' }}>
                                (REQUERIDO)
                              </Typography>
                            )}
                          </>} 
                          secondary={<>
                            {isDocumentUploaded(doc.id) 
                              ? getDocumentStatusText(doc.id) 
                              : "Pendiente - Este documento debe ser subido para este empleado"}
                            {doc.exampleImage && (
                              <Box mt={1}>
                                <Typography variant="caption" display="block">Ejemplo:</Typography>
                                <img 
                                  src={doc.exampleImage} 
                                  alt={`Ejemplo de ${doc.documentName}`} 
                                  style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #e0e0e0', borderRadius: 4 }} 
                                />
                              </Box>
                            )}
                          </>}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                {selectedDocument && (
                  <>
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
                          id={`document-personal-file-input-${persona.id}`}
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
                  </>
                )}
              </Grid>
            </Box>
          </>
        )}
      </Paper>
      
      {uploadedDocuments.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Documentos Subidos
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {uploadedDocuments.map((doc) => (
                <React.Fragment key={doc.id}>
                  <ListItem>
                    <ListItemIcon>
                      <DescriptionIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.documentName}
                      secondary={
                        <>
                          <Typography 
                            variant="body2" 
                            component="span" 
                            sx={{
                              color: doc.status === "Aprobado" 
                                ? "success.main" 
                                : doc.status === "Rechazado" 
                                  ? "error.main" 
                                  : "warning.main",
                              fontWeight: "bold"
                            }}
                          >
                            Estado: {doc.status}
                          </Typography>
                          <br />
                          <Typography variant="body2" component="span">
                            Subido: {doc.uploadedAt ? new Date(doc.uploadedAt.seconds * 1000).toLocaleString() : "Recién subido"}
                          </Typography>
                          {doc.comment && (
                            <>
                              <br />
                              <Typography variant="body2" component="span">
                                Comentario: {doc.comment}
                              </Typography>
                            </>
                          )}
                          {doc.adminComment && (
                            <>
                              <br />
                              <Typography variant="body2" component="span" sx={{ fontWeight: "bold" }}>
                                Comentario del revisor: {doc.adminComment}
                              </Typography>
                            </>
                          )}
                          {doc.status === "Rechazado" && (
                            <>
                              <br />
                              <Typography variant="body2" component="span" color="error">
                                <InfoIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                                Debe volver a subir este documento
                              </Typography>
                            </>
                          )}
                          {doc.exampleImage && (
                            <>
                              <br />
                              <Typography variant="caption" component="span">Ejemplo:</Typography>
                              <img 
                                src={doc.exampleImage} 
                                alt={`Ejemplo de ${doc.documentName}`} 
                                style={{ maxWidth: '100%', maxHeight: 150, display: 'block', marginTop: 4, border: '1px solid #e0e0e0', borderRadius: 4 }} 
                              />
                            </>
                          )}
                        </>
                      }
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
      )}
      
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

export default DocumentosPersonalForm;
