"use client";

import React, { useState } from "react";
import { db } from "../../firebaseconfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  CircularProgress,
} from "@mui/material";

export default function AprobarDocumentoDialog({ open, onClose, documentData, onApproved }) {
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!documentData) return null;

  const handleApprove = async () => {
    if (!expirationDate) return;

    setLoading(true);
    try {
      const docRef = doc(db, "uploadedDocuments", documentData.id);
      await updateDoc(docRef, {
        status: "Aprobado",
        expirationDate,
        reviewedAt: serverTimestamp(),
      });
      if (onApproved) {
        onApproved(documentData.id);
      }
      onClose();
    } catch (error) {
      console.error("Error al aprobar documento:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Aprobar Documento</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography variant="h6">{documentData.documentName}</Typography>
          <Box
            component="img"
            src={documentData.fileURL}
            alt="Preview"
            sx={{ width: "100%", borderRadius: 2, maxHeight: 300, objectFit: "contain" }}
          />
          <TextField
            label="Fecha de vencimiento"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleApprove}
          disabled={!expirationDate || loading}
        >
          {loading ? <CircularProgress size={24} /> : "Confirmar Aprobación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
