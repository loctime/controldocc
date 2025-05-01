// DocumentosEmpresaForm.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Grid, Paper, TextField, Tooltip, Typography
} from "@mui/material";
import {
  Description as DescriptionIcon,
  UploadFile as UploadFileIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import { db } from "../../firebaseconfig";
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp
} from "firebase/firestore";

export default function DocumentosEmpresaForm({ onDocumentUploaded }) {
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
 
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileMap, setFileMap] = useState({});
  const [previewMap, setPreviewMap] = useState({});

  const userCompanyData = JSON.parse(localStorage.getItem("userCompany") || '{}');
  const companyId = userCompanyData?.companyId;

  useEffect(() => {
    if (!companyId) return;
    const fetchDocuments = async () => {
      const reqQuery = query(collection(db, "requiredDocuments"),
        where("companyId", "==", companyId),
        where("entityType", "==", "company"));
      const upQuery = query(collection(db, "uploadedDocuments"),
        where("companyId", "==", companyId),
        where("entityType", "==", "company"));
      const [reqSnap, upSnap] = await Promise.all([getDocs(reqQuery), getDocs(upQuery)]);
      setRequiredDocuments(reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUploadedDocuments(upSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchDocuments();
  }, [companyId, onDocumentUploaded]);

  const handleUpload = async () => {
    if (!selectedDocument || !fileMap?.[selectedDocument?.id]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileMap?.[selectedDocument?.id]);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const { url: fileURL } = await response.json();

      const existing = uploadedDocuments.find(doc =>
        doc.requiredDocumentId === selectedDocument?.id && doc.entityId === companyId
      );

      const docData = {
        companyId,
        requiredDocumentId: selectedDocument?.id,
        documentName: selectedDocument?.name || "Documento",
        entityType: "company",
        entityId: companyId,
        entityName: userCompanyData?.companyName || "Empresa",
        fileURL,
        fileName: fileMap?.[selectedDocument?.id]?.name,
        fileType: fileMap?.[selectedDocument?.id]?.type,
        fileSize: fileMap?.[selectedDocument?.id]?.size,
        uploadedAt: serverTimestamp(),
        status: "Pendiente de revisión",
        comment,
        expirationDate: selectedDocument.deadline?.date || null,
      };

      if (existing) {
        await updateDoc(doc(db, "uploadedDocuments", existing.id), docData);
      } else {
        await addDoc(collection(db, "uploadedDocuments"), docData);
      }

      // Actualizar lista local
      const updatedQuery = query(
        collection(db, "uploadedDocuments"),
        where("companyId", "==", companyId),
        where("entityType", "==", "company")
      );
      const updatedSnapshot = await getDocs(updatedQuery);
      setUploadedDocuments(updatedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      setDialogOpen(false);
      setComment("");
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (error) {
      console.error("Upload error", error);
    } finally {
      setUploading(false);
    }
  };

  const getDaysToExpire = (doc) => {
    if (!doc.deadline?.date) return null;
    const diff = (new Date(doc.deadline.date) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.floor(diff);
  };
  const previewUrl = previewMap?.[selectedDocument?.id];


  const openPreview = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Documentos Requeridos</Typography>
      <Grid container spacing={2}>
        {requiredDocuments.map(doc => {
          const uploaded = uploadedDocuments.find(up => up.requiredDocumentId === doc.id);
          const days = getDaysToExpire(doc);
          const bgColor = days <= 0 ? "rgba(244, 67, 54, 0.1)" :
            days <= 10 ? "rgba(255, 152, 0, 0.1)" : "transparent";

          return (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card sx={{
                backgroundColor: bgColor,
                border: '1px solid #ddd',
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">{doc.name}</Typography>
                  </Box>

                  {uploaded ? (
                    <>
                      <Chip
                        label={uploaded.status}
                        size="small"
                        color={
                          uploaded.status === "Aprobado" ? "success" :
                            uploaded.status === "Rechazado" ? "error" : "warning"
                        }
                      />
                      {uploaded.status === "Rechazado" && uploaded.adminComment && (
                        <Typography variant="caption" color="error" display="block">
                          Motivo: {uploaded.adminComment}
                        </Typography>
                      )}
                      {uploaded.status === "Aprobado" && uploaded.expirationDate && (
                        <Typography variant="caption" display="block">
                          Vence: {new Date(uploaded.expirationDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Documento no cargado aún
                    </Typography>
                  )}

                  {doc.deadline?.date && (
                    <Tooltip title={days <= 0 ? "¡Vencido!" : `Faltan ${days} días`}>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Typography variant="caption">
                          Vence: {new Date(doc.deadline.date).toLocaleDateString()}
                        </Typography>
                        {days !== null && days <= 10 && (
                          <WarningIcon fontSize="small" sx={{ ml: 1 }}
                            color={days <= 0 ? "error" : "warning"} />
                        )}
                      </Box>
                    </Tooltip>
                  )}

                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setDialogOpen(true);
                      }}
                    >
                      {uploaded ? "Reemplazar" : "Subir"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Modal de subida */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Subir {selectedDocument?.name}</DialogTitle>
        <DialogContent>
  <Grid container spacing={4} alignItems="start">
    {/* Ejemplo visual */}
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>Ejemplo:</Typography>
      {selectedDocument?.exampleImage ? (
        <img
          src={selectedDocument.exampleImage}
          alt="Ejemplo"
          style={{ width: '100%', maxHeight: 250, objectFit: 'contain', borderRadius: 4 }}
          onClick={() => openPreview(selectedDocument.exampleImage)}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">Sin ejemplo disponible</Typography>
      )}
    </Grid>

    {/* Vista previa del archivo */}
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>Vista previa:</Typography>
      <Paper
        elevation={2}
        sx={{
          border: '2px dashed #2196f3',
          padding: 2,
          height: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          backgroundColor: '#f9f9f9',
          '&:hover': {
            boxShadow: 4,
          }
        }}
        onClick={() => previewMap[selectedDocument?.id] && openPreview(previewMap[selectedDocument?.id])}
      >
        {fileMap?.[selectedDocument?.id] ? (
          fileMap?.[selectedDocument?.id].type.startsWith("image/") ? (
            <img src={previewMap[selectedDocument?.id]} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          ) : fileMap?.[selectedDocument?.id].type === "application/pdf" ? (
            <iframe src={previewMap[selectedDocument?.id]} title="Vista previa PDF" width="100%" height="100%" style={{ border: "none" }} />
          ) : (
            <Typography variant="body2" color="text.secondary">Vista previa no disponible para este tipo</Typography>
          )
        ) : (
          <Typography variant="body2" color="text.secondary">Sin archivo seleccionado</Typography>
        )}
      </Paper>
    </Grid>
  </Grid>

  {/* Selector de archivo y comentario */}
  <Box mt={4}>
    <Button
      component="label"
      variant="contained"
      startIcon={<UploadFileIcon />}
      fullWidth
    >
      Seleccionar Archivo
      <input
        type="file"
        hidden
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
        onChange={(e) => {
          const selected = e.target.files[0];
          setFileMap(prev => ({
            ...prev,
            [selectedDocument?.id]: selected
          }));
          if (selected) {
            const preview = URL.createObjectURL(selected);
            setPreviewMap(prev => ({
              ...prev,
              [selectedDocument?.id]: preview
            }));
          }
        }}
      />
    </Button>

    {fileMap?.[selectedDocument?.id] && (
      <Typography variant="body2" mt={1}>
        Archivo seleccionado: {fileMap?.[selectedDocument?.id].name}
      </Typography>
    )}

    <TextField
      label="Comentario (opcional)"
      multiline
      rows={3}
      fullWidth
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      sx={{ mt: 2 }}
    />
  </Box>
</DialogContent>


        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!fileMap?.[selectedDocument?.id] || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? "Subiendo..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de vista previa */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
  <DialogContent>
    {previewUrl &&
    (fileMap?.[selectedDocument?.id]?.type?.startsWith('image/') ||
      previewUrl.includes('.jpg') ||
      previewUrl.includes('.jpeg') ||
      previewUrl.includes('.png')) ? (
      <img src={previewUrl} alt="Vista previa" style={{ width: '100%' }} />
    ) : previewUrl ? (
      <iframe
        src={previewUrl}
        title="Vista previa"
        width="100%"
        height="500px"
        style={{ border: 'none' }}
      />
    ) : (
      <Typography>No hay vista previa disponible.</Typography>
    )}
  </DialogContent>
</Dialog>
    </Paper>
  );
}
