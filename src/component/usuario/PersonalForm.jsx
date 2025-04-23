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
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const PersonalForm = () => {
  const { user } = useContext(AuthContext);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !cargo.trim()) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nuevoPersonal = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        cargo: cargo.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        companyId: user.companyId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "personal"), nuevoPersonal);
      
      // Limpiar formulario
      setNombre("");
      setApellido("");
      setDni("");
      setCargo("");
      setTelefono("");
      setEmail("");
      
      // Mostrar mensaje de éxito
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
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellido *"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              disabled={loading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="DNI *"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              disabled={loading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Cargo *</InputLabel>
              <Select
                value={cargo}
                label="Cargo *"
                onChange={(e) => setCargo(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="Gerente">Gerente</MenuItem>
                <MenuItem value="Administrativo">Administrativo</MenuItem>
                <MenuItem value="Operario">Operario</MenuItem>
                <MenuItem value="Chofer">Chofer</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
