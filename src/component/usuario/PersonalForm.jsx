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
  
  // Obtener información de la empresa desde localStorage (como backup)
  const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
  // Usar companyId del contexto de autenticación o del localStorage como respaldo
  const companyId = user?.companyId || userCompanyData?.companyId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !cargo.trim()) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verificar que exista un companyId válido
      if (!companyId) {
        setError("Error: No se pudo identificar la empresa. Por favor, cierre sesión y vuelva a ingresar.");
        setLoading(false);
        return;
      }

      const nuevoPersonal = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        cargo: cargo.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        companyId: companyId,
        createdAt: serverTimestamp(),
      };

      console.log("Guardando personal con companyId:", companyId);
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
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <PersonAddIcon style={{ marginRight: '8px' }} />
                  Agregar Personal
                </>
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* Usar un enfoque condicional para el Snackbar para evitar problemas de montaje/desmontaje */}
      {success && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            Personal agregado exitosamente
          </Alert>
        </Snackbar>
      )}
    </Paper>
  );
};

export default PersonalForm;
