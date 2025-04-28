import React, { useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const PersonalForm = () => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
  const companyId = userCompanyData?.companyId;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    if (!companyId) {
      setError("Error: No se pudo identificar la empresa. Cierre sesión y vuelva a ingresar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 🔥 Verificar si ya existe un DNI igual en esta empresa
      const dniQuery = query(
        collection(db, "personal"),
        where("dni", "==", dni.trim()),
        where("companyId", "==", companyId)
      );
      const existingDniSnap = await getDocs(dniQuery);

      if (!existingDniSnap.empty) {
        setError("Ya existe un empleado registrado con ese DNI.");
        setLoading(false);
        return;
      }

      const nuevoPersonal = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        companyId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "personal"), nuevoPersonal);

      setNombre("");
      setApellido("");
      setDni("");
      setSuccess(true);
    } catch (err) {
      console.error("Error al agregar personal:", err);
      setError("Error al guardar los datos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Agregar Nuevo Personal
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellido *"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="DNI *"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled={loading}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : "Agregar Personal"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Personal agregado exitosamente
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PersonalForm;
