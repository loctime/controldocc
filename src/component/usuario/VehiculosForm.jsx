import React, { useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { cleanFirestoreData } from "../../utils/cleanFirestoreData";
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
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

const VehiculosForm = ({ onVehiculoAdded, companyId: propCompanyId }) => {
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [patente, setPatente] = useState("");
  const [año, setAño] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!marca.trim() || !modelo.trim() || !patente.trim()) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
    const companyId = propCompanyId || userCompanyData?.companyId;

    if (!companyId) {
      setError("No tienes empresa asociada. No se puede agregar vehículo.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 🔥 Verificar si ya existe la patente
      const patenteQuery = query(
        collection(db, "vehiculos"),
        where("patente", "==", patente.trim()),
        where("companyId", "==", companyId)
      );
      const existingPatenteSnap = await getDocs(patenteQuery);

      if (!existingPatenteSnap.empty) {
        setError("Ya existe un vehículo registrado con esa patente.");
        setLoading(false);
        return;
      }

      const rawVehiculo = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        patente: patente.trim(),
        año: año.trim() || null,
        companyId,
        createdAt: serverTimestamp(),
      };
      
      const cleanVehiculo = cleanFirestoreData(rawVehiculo);
      
      await addDoc(collection(db, "vehiculos"), cleanVehiculo);
      
      setMarca("");
      setModelo("");
      setPatente("");
      setAño("");

      setSuccess(true);
      if (typeof onVehiculoAdded === 'function') {
        onVehiculoAdded();
      }
    } catch (err) {
      console.error("Error al agregar vehículo:", err);
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
        Agregar Nuevo Vehículo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid columns={12} columnSpacing={2}>
            <TextField
              fullWidth
              label="Marca *"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid columns={12} columnSpacing={2}>
            <TextField
              fullWidth
              label="Modelo *"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid columns={12} columnSpacing={2}>
            <TextField
              fullWidth
              label="Patente *"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid columns={12} columnSpacing={2}>
            <TextField
              fullWidth
              label="Año"
              value={año}
              onChange={(e) => setAño(e.target.value)}
              disabled={loading}
              type="number"
              inputProps={{ min: 1900, max: new Date().getFullYear() }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<DirectionsCarIcon />}
              disabled={loading}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : "Agregar Vehículo"}
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
          Vehículo agregado exitosamente
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default VehiculosForm;
