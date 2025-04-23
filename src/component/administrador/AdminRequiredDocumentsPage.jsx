"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useCompany } from "../../contexts/company-context";
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
  const [deadlineType, setDeadlineType] = useState("monthly");
  const [day, setDay] = useState(1);
  const [months, setMonths] = useState([1, 7]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogState, setDeleteDialogState] = useState({
    open: false,
    documentId: null
  });

  const { selectedCompanyId } = useCompany();
  const theme = useTheme();

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
    if (event) event.preventDefault();
    if (!newDocName.trim() || !selectedCompanyId) return;

    setLoading(true);
    setError("");
    try {
      let deadline = { type: deadlineType };
      if (deadlineType === "monthly") deadline.day = day;
      if (deadlineType === "biannual") deadline.months = months;
      if (deadlineType === "custom") deadline.date = date;

      const newDocument = {
        name: newDocName.trim(),
        entityType,
        companyId: selectedCompanyId,
        allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png"],
        deadline,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "requiredDocuments"), newDocument);
      setNewDocName("");
      setEntityType("company");
      setDeadlineType("monthly");
      setDay(1);
      setMonths([1, 7]);
      setDate("");
      loadDocuments();
    } catch (error) {
      console.error("Error creating document:", error);
      setError("Error al crear el documento.");
    } finally {
      setLoading(false);
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
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Aplicable a</InputLabel>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              label="Aplicable a"
              disabled={loading || !selectedCompanyId}
            >
              <MenuItem value="company">Empresa</MenuItem>
              <MenuItem value="employee">Empleado</MenuItem>
              <MenuItem value="vehicle">Vehículo</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tipo de vencimiento</InputLabel>
            <Select
              value={deadlineType}
              onChange={(e) => setDeadlineType(e.target.value)}
              label="Tipo de vencimiento"
              disabled={loading || !selectedCompanyId}
            >
              <MenuItem value="monthly">Mensual</MenuItem>
              <MenuItem value="biannual">Semestral</MenuItem>
              <MenuItem value="custom">Fecha fija</MenuItem>
            </Select>
          </FormControl>
          {deadlineType === "monthly" && (
            <TextField
              label="Día"
              type="number"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              disabled={loading || !selectedCompanyId}
              sx={{ width: 100 }}
            />
          )}
          {deadlineType === "biannual" && (
            <TextField
              label="Meses (ej: 1,7)"
              value={months.join(",")}
              onChange={(e) => setMonths(e.target.value.split(",").map(Number))}
              disabled={loading || !selectedCompanyId}
              sx={{ width: 150 }}
            />
          )}
          {deadlineType === "custom" && (
            <TextField
              label="Fecha"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading || !selectedCompanyId}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
          )}
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
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
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
                    <strong>Vencimiento:</strong> {doc.deadline?.type}
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
