import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../firebaseconfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

const VehiculosForm = () => {
  const { user } = useContext(AuthContext);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [patente, setPatente] = useState("");
  const [año, setAño] = useState("");
  const [tipo, setTipo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!marca.trim() || !modelo.trim() || !patente.trim() || !tipo.trim()) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nuevoVehiculo = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        patente: patente.trim(),
        año: año.trim(),
        tipo: tipo.trim(),
        companyId: user.companyId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "vehiculos"), nuevoVehiculo);
      
      // Limpiar formulario
      setMarca("");
      setModelo("");
      setPatente("");
      setAño("");
      setTipo("");
      
      // Mostrar mensaje de éxito
      setSuccess(true);
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Marca *"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              disabled={loading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Modelo *"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={loading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Patente *"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              disabled={loading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Año"
              value={año}
              onChange={(e) => setAño(e.target.value)}
              disabled={loading}
              type="number"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Vehículo *</InputLabel>
              <Select
                value={tipo}
                label="Tipo de Vehículo *"
                onChange={(e) => setTipo(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="Camión">Camión</MenuItem>
                <MenuItem value="Camioneta">Camioneta</MenuItem>
                <MenuItem value="Automóvil">Automóvil</MenuItem>
                <MenuItem value="Maquinaria">Maquinaria</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<DirectionsCarIcon />}
              disabled={loading}
              sx={{ mt: 2 }}
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
