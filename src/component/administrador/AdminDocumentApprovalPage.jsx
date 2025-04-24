"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
  Badge,
  useTheme
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Visibility,
  Download,
  Description as DescriptionIcon
} from "@mui/icons-material";

export default function AdminDocumentApprovalPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchPendingDocs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "uploadedDocuments"),
          where("status", "in", ["Pendiente de revisión", "Por vencer"])
        );
        const snapshot = await getDocs(q);
        setDocuments(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            daysRemaining: d.data().expiryDate
              ? Math.ceil(
                  (new Date(d.data().expiryDate) - new Date()) /
                    (1000 * 60 * 60 * 24)
                )
              : null
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPendingDocs();
  }, []);

  const handleApprove = async (docId) => {
    await updateDoc(doc(db, "uploadedDocuments", docId), {
      status: "Aprobado",
      reviewedAt: new Date().toISOString()
    });
    setDocuments((docs) => docs.filter((d) => d.id !== docId));
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    await updateDoc(doc(db, "uploadedDocuments", selectedDoc.id), {
      status: "Rechazado",
      adminComment: comment,
      reviewedAt: new Date().toISOString()
    });
    setDocuments((docs) => docs.filter((d) => d.id !== selectedDoc.id));
    setSelectedDoc(null);
    setComment("");
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Aprobación de Documentos</Typography>
        <Badge badgeContent={documents.length} color="primary">
          <Typography variant="subtitle1">Pendientes</Typography>
        </Badge>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="textSecondary">
            No hay documentos pendientes de aprobación
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3}>
          <List>
            {documents.map((doc) => (
              <React.Fragment key={doc.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      <DescriptionIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight="medium">
                          {doc.documentName}
                        </Typography>
                        {doc.daysRemaining !== null && (
                          <Chip
                            label={`${doc.daysRemaining}d`}
                            color={
                              doc.daysRemaining <= 0
                                ? "error"
                                : doc.daysRemaining <= 7
                                ? "warning"
                                : "success"
                            }
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          {doc.entityName} • {doc.companyName}
                        </Typography>
                        <Typography variant="caption">
                          Subido: {new Date(doc.uploadedAt?.seconds * 1000).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <Box display="flex" gap={1}>
                    <Tooltip title="Previsualizar">
                      <IconButton onClick={() => window.open(doc.fileURL, '_blank')}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Descargar">
                      <IconButton onClick={() => window.open(doc.fileURL, '_download')}>
                        <Download />
                      </IconButton>
                    </Tooltip>
                    <Button
                      startIcon={<CheckCircle />}
                      onClick={() => handleApprove(doc.id)}
                      variant="contained"
                      color="success"
                      size="small"
                    >
                      Aprobar
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => setSelectedDoc(doc)}
                      variant="outlined"
                      color="error"
                      size="small"
                    >
                      Rechazar
                    </Button>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <Dialog open={!!selectedDoc} onClose={() => setSelectedDoc(null)}>
        <DialogTitle>Rechazar Documento</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo del rechazo"
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDoc(null)}>Cancelar</Button>
          <Button onClick={handleReject} color="error">
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}