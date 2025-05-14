// src/component/usuario/DocumentosFormBase.jsx
import React, { useState, useEffect } from "react";
import {
  Paper, Typography, Grid, Box, Button, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, CircularProgress
} from "@mui/material";
import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import { db } from "../../firebaseconfig";
import { 
  collection, query, where, getDocs, addDoc, 
  doc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import DocumentCard from "./DocumentCard";

export default function DocumentosFormBase({
  entityType,
  entity,
  selectedDocumentId = null,
  onDocumentUploaded = null,
  getEntityName = (entity) => {
    if (entityType === 'company') return entity.companyName;
    if (entityType === 'vehicle') return `${entity.marca} ${entity.modelo} (${entity.patente})`;
    return `${entity.nombre} ${entity.apellido}`;
  }
}) {
  // Estados comunes
  const [currentStep, setCurrentStep] = useState("select");
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const userCompanyData = JSON.parse(localStorage.getItem("userCompany") || '{}');
  const companyId = userCompanyData?.companyId;

  // Efecto para autenticación
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) setCurrentUser(auth.currentUser);
    const unsubscribe = onAuthStateChanged(auth, user => setCurrentUser(user || null));
    return () => unsubscribe();
  }, []);

  // Efecto para cargar documentos
  useEffect(() => {
    if (!companyId || !entity) return;
    
    const fetchDocuments = async () => {
      try {
        const requiredQuery = query(
          collection(db, "requiredDocuments"),
          where("companyId", "==", companyId),
          where("entityType", "==", entityType)
        );
        
        const uploadedQuery = query(
          collection(db, "uploadedDocuments"),
          where("companyId", "==", companyId),
          where("entityType", "==", entityType),
          where("entityId", "==", entity.id)
        );

        const [requiredSnap, uploadedSnap] = await Promise.all([
          getDocs(requiredQuery),
          getDocs(uploadedQuery)
        ]);

        setRequiredDocuments(requiredSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setUploadedDocuments(uploadedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error al cargar documentos:", err);
      }
    };

    fetchDocuments();
  }, [companyId, entity, entityType]);

  // Efecto para documento seleccionado
  useEffect(() => {
    if (selectedDocumentId && requiredDocuments.length > 0) {
      setSelectedDocument(selectedDocumentId);
      setCurrentStep("upload");
    }
  }, [selectedDocumentId, requiredDocuments]);

  // Función para subir documentos
  const handleUpload = async () => {
    if (!currentUser || !selectedDocument || !file) return;
    
    // Validación previa como en AdminRequiredDocumentsPage
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten PDF o imágenes (JPEG/PNG)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe exceder 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `${entityType}Documents`);
      formData.append("entityId", entity.id);
      formData.append("entityType", entityType);
      formData.append("documentType", 
        requiredDocuments.find(d => d.id === selectedDocument)?.name || "Documento"
      );

      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error en el servidor");
      }
      
      const { url, originalName, pdfName } = await response.json();
      const existingDoc = uploadedDocuments.find(d => 
        d.requiredDocumentId === selectedDocument
      )?.id;

      const docData = {
        companyId,
        requiredDocumentId: selectedDocument,
        documentName: requiredDocuments.find(d => d.id === selectedDocument)?.name || "Documento",
        entityType,
        entityId: entity.id,
        entityName: getEntityName(entity),
        fileURL: url,
        fileName: pdfName,
        originalFile: originalName,
        fileType: "application/pdf",
        fileSize: file.size,
        uploadedAt: serverTimestamp(),
        status: "Pendiente de revisión",
        comment: comment || ""
      };

      if (existingDoc) {
        await updateDoc(doc(db, "uploadedDocuments", existingDoc), docData);
      } else {
        await addDoc(collection(db, "uploadedDocuments"), docData);
      }

      // Actualizar lista de documentos subidos
      const updatedSnap = await getDocs(query(
        collection(db, "uploadedDocuments"),
        where("companyId", "==", companyId),
        where("entityType", "==", entityType),
        where("entityId", "==", entity.id)
      ));
      setUploadedDocuments(updatedSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      if (onDocumentUploaded) onDocumentUploaded();
      resetForm();
    } catch (error) {
      console.error("Error al subir documento:", error);
      alert(`Error al subir: ${error.message}`);
    } finally {
      setUploading(false);
      setConfirmDialogOpen(false);
    }
  };

  // Funciones auxiliares
  const resetForm = () => {
    setFile(null);
    setComment("");
    setSelectedDocument(null);
    setCurrentStep("select");
  };

  const openPreview = (url, type) => {
    setPreviewUrl(url);
    setPreviewType(type);
    setPreviewOpen(true);
  };

  if (!entity) return null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" mb={2}>
        Documentos de {getEntityName(entity)}
      </Typography>

      {currentStep === "select" && (
        <>
          <Grid container spacing={2}>
            {requiredDocuments.map(doc => {
              const uploaded = uploadedDocuments.find(up => up.requiredDocumentId === doc.id);
              const days = uploaded?.expirationDate
                ? Math.floor((new Date(uploaded.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <DocumentCard
                    doc={doc}
                    uploaded={uploaded}
                    days={days}
                    onUploadClick={(d) => {
                      setSelectedDocument(d.id);
                      setCurrentStep("upload");
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button 
              variant="contained" 
              onClick={() => setCurrentStep("upload")} 
              disabled={!selectedDocument}
            >
              Siguiente
            </Button>
          </Box>
        </>
      )}

      {currentStep === "upload" && selectedDocument && (
        <Box>
          <Button variant="outlined" onClick={() => setCurrentStep("select")} sx={{ mb: 2 }}>
            Volver
          </Button>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6">Ejemplo</Typography>
                <Box
                  sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer' 
                  }}
                  onClick={() => {
                    const doc = requiredDocuments.find(d => d.id === selectedDocument);
                    if (doc?.exampleImage) openPreview(doc.exampleImage, 'image');
                  }}
                >
                  {requiredDocuments.find(d => d.id === selectedDocument)?.exampleImage ? (
                    <img 
                      src={requiredDocuments.find(d => d.id === selectedDocument).exampleImage} 
                      alt="Ejemplo" 
                      style={{ maxWidth: '90%', maxHeight: '90%' }} 
                    />
                  ) : (
                    <Typography color="text.secondary">Sin ejemplo disponible</Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6">Archivo Seleccionado</Typography>
                <Box
                  sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    height: 300, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: file ? 'pointer' : 'default' 
                  }}
                  onClick={() => file && openPreview(URL.createObjectURL(file), file.type.startsWith('image/') ? 'image' : 'pdf')}
                >
                  {file ? (
                    file.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Archivo" 
                        style={{ maxWidth: '90%', maxHeight: '90%' }} 
                      />
                    ) : (
                      <Typography>Vista previa disponible</Typography>
                    )
                  ) : (
                    <Typography color="text.secondary">No seleccionado</Typography>
                  )}
                </Box>

                <Box mt={2}>
                  <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
                    Seleccionar Archivo
                    <input 
                      type="file" 
                      hidden 
                      onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} 
                    />
                  </Button>
                  <TextField 
                    label="Comentario" 
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    fullWidth 
                    sx={{ mt: 2 }} 
                  />
                </Box>

                <Box mt={2}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    disabled={!file} 
                    onClick={() => setConfirmDialogOpen(true)}
                  >
                    Confirmar
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar subida</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de subir este documento?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpload} 
            disabled={uploading}
          >
            {uploading ? <CircularProgress size={24} /> : "Subir"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <Box p={2}>
          {previewType === "image" ? (
            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 'auto' }} />
          ) : previewType === "pdf" ? (
            <iframe 
              src={previewUrl} 
              title="Vista PDF" 
              width="100%" 
              height="600px" 
              style={{ border: 'none' }} 
            />
          ) : (
            <Typography>No disponible</Typography>
          )}
        </Box>
      </Dialog>
    </Paper>
  );
}