import React, { useState, useEffect } from "react";
import {
  Paper, Typography, Grid, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Tooltip, CircularProgress
} from "@mui/material";
import { UploadFile as UploadFileIcon } from "@mui/icons-material";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function DocumentosVehiculoForm({ vehiculo, selectedDocumentId = null, onDocumentUploaded = null }) {
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

  const userCompanyData = JSON.parse(localStorage.getItem("userCompany") || '{}');
  const companyId = userCompanyData?.companyId;

  useEffect(() => {
    if (!companyId || !vehiculo) return;
    const fetchDocuments = async () => {
      const requiredSnap = await getDocs(query(
        collection(db, "requiredDocuments"),
        where("companyId", "==", companyId),
        where("entityType", "==", "vehicle")
      ));
      const uploadedSnap = await getDocs(query(
        collection(db, "uploadedDocuments"),
        where("companyId", "==", companyId),
        where("entityType", "==", "vehicle"),
        where("entityId", "==", vehiculo.id)
      ));
      setRequiredDocuments(requiredSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUploadedDocuments(uploadedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchDocuments();
  }, [companyId, vehiculo]);

  useEffect(() => {
    if (selectedDocumentId && requiredDocuments.length > 0) {
      setSelectedDocument(selectedDocumentId);
      setCurrentStep("upload");
    }
  }, [selectedDocumentId, requiredDocuments]);
  

  const handleUpload = async () => {
    if (!selectedDocument || !file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload error");
      const { url } = await res.json();

      const selectedDocData = requiredDocuments.find(d => d.id === selectedDocument);
      const existingDoc = uploadedDocuments.find(
        (doc) => doc.entityId === vehiculo.id && doc.requiredDocumentId === selectedDocument
      );

      if (existingDoc) {
        const docRef = doc(db, "uploadedDocuments", existingDoc.id);
        await updateDoc(docRef, {
          fileURL: url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: serverTimestamp(),
          status: "Pendiente de revisión",
          comment: comment || "",
        });
      } else {
        await addDoc(collection(db, "uploadedDocuments"), {
          companyId,
          requiredDocumentId: selectedDocument,
          documentName: selectedDocData?.name || "Documento",
          entityType: "vehicle",
          entityId: vehiculo.id,
          entityName: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`,
          fileURL: url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: serverTimestamp(),
          status: "Pendiente de revisión",
          comment: comment || "",
        });
      }

      if (onDocumentUploaded) {
        onDocumentUploaded(); // 🔥 Actualizar dashboard
      }

      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
      setConfirmDialogOpen(false);
    }
  };

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

  const getDocStatus = (docId) => uploadedDocuments.find(d => d.requiredDocumentId === docId);

  const getDeadlineColor = (expirationDate) => {
    if (!expirationDate) return "default";
    const diff = (new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff <= 0) return "error.light";
    if (diff <= 2) return "error.main";
    if (diff <= 5) return "error";
    if (diff <= 15) return "warning";
    if (diff <= 30) return "info";
    return "success";
  };

  if (!vehiculo) return null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" mb={2}>Documentos de {vehiculo.marca} {vehiculo.modelo} ({vehiculo.patente})</Typography>

      {currentStep === "select" && (
        <>
          <Grid container spacing={2}>
            {requiredDocuments.map(doc => {
              const status = getDocStatus(doc.id);
              const vencimientoColor = getDeadlineColor(status?.expirationDate);
              const canUpload = !status || status.status === "Rechazado";
              return (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <Paper
                    sx={{ p: 2, cursor: canUpload ? "pointer" : "default", border: selectedDocument === doc.id ? "2px solid #1976d2" : "1px solid #ccc" }}
                    onClick={() => canUpload && setSelectedDocument(doc.id)}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography fontWeight="bold">{doc.name}</Typography>
                      {status?.status && (
                        <Chip size="small" label={status.status} color={status.status === "Aprobado" ? "success" : status.status === "Rechazado" ? "error" : "warning"} />
                      )}
                    </Box>
                    {status?.expirationDate && (
                      <Typography variant="body2" color={vencimientoColor} mt={1}>
                        Vence: {new Date(status.expirationDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={() => setCurrentStep("upload")} disabled={!selectedDocument}>
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
            sx={{ border: '2px dashed #ccc', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => {
              const doc = requiredDocuments.find(d => d.id === selectedDocument);
              if (doc?.exampleImage) openPreview(doc.exampleImage, 'image');
            }}
          >
            {requiredDocuments.find(d => d.id === selectedDocument)?.exampleImage ? (
              <img src={requiredDocuments.find(d => d.id === selectedDocument).exampleImage} alt="Ejemplo" style={{ maxWidth: '90%', maxHeight: '90%' }} />
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
            sx={{ border: '2px dashed #ccc', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: file ? 'pointer' : 'default' }}
            onClick={() => file && openPreview(URL.createObjectURL(file), file.type.startsWith('image/') ? 'image' : 'pdf')}
          >
            {file ? (
              file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="Archivo" style={{ maxWidth: '90%', maxHeight: '90%' }} />
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
              <input type="file" hidden onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} />
            </Button>
            <TextField label="Comentario" value={comment} onChange={e => setComment(e.target.value)} fullWidth sx={{ mt: 2 }} />
          </Box>

          <Box mt={2}>
            <Button variant="contained" fullWidth disabled={!file} onClick={() => setConfirmDialogOpen(true)}>
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
        <DialogContent><Typography>¿Subir documento?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading}>
            {uploading ? <CircularProgress size={24} /> : "Subir"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <Box p={2}>
          {previewType === "image" ? (
            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 'auto' }} />
          ) : previewType === "pdf" ? (
            <iframe src={previewUrl} title="Vista PDF" width="100%" height="600px" style={{ border: 'none' }} />
          ) : (
            <Typography>No disponible</Typography>
          )}
        </Box>
      </Dialog>
    </Paper>
  );
}
