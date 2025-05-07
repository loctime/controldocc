import React, { useState } from "react";
import { db } from "../../../firebaseconfig"; // Importa tu configuración de Firebase
import { collection, getDoc, setDoc, addDoc } from "firebase/firestore"; // Importa las funciones de Firestore
import { getAuth } from "firebase/auth"; // Para obtener la instancia de Firebase Auth
import { doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";


import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Snackbar,
  Paper,
} from "@mui/material";
import { Add as AddIcon, Visibility, VisibilityOff } from "@mui/icons-material"; // Importa íconos

export default function CreateCompany({ fetchCompanies }) {
  // Estados para crear empresa
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCuit, setNewCompanyCuit] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Snackbar para mostrar mensajes
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Instancia de Firebase Auth
  const auth = getAuth();

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    if (!newCompanyName.trim() || !newCompanyCuit.trim() || !newCompanyPassword.trim()) return;

    try {
      const existingCompany = await getDoc(doc(db, "companies", newCompanyCuit.trim()));
      if (existingCompany.exists()) {
        setSnackbar({ open: true, message: "Ya existe una empresa con ese CUIT.", severity: "warning" });
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, `${newCompanyCuit.trim()}@controldoc.com`, newCompanyPassword.trim());
      const uid = userCredential.user.uid;
      // Crear empresa en Firestore
      const newCompany = {
        name: newCompanyName.trim(),
        cuit: newCompanyCuit.trim(),
        createdAt: new Date().toISOString(),
      };
      const companyRef = doc(db, "companies", newCompanyCuit.trim());
      await setDoc(companyRef, newCompany);

      // Crear el documento del usuario en Firestore
      const defaultUser = {
        email: `${newCompanyCuit.trim()}@controldoc.com`, // Email opcional
        role: "user", // Asignamos el rol de usuario
        companyId: newCompanyCuit.trim(),
        name: newCompanyName.trim(),
        createdAt: new Date().toISOString(),
        firebaseUid: uid, // Usamos el UID de Firebase Auth
        password: newCompanyPassword.trim(), // 🔴 agrega esto
      };

      await setDoc(doc(db, "users", uid), defaultUser);

      // Limpiar campos después de crear
      setNewCompanyName("");
      setNewCompanyCuit("");
      setNewCompanyPassword("");

      // Actualizar las empresas en la interfaz
      if (fetchCompanies) fetchCompanies();

      setSnackbar({ open: true, message: "Empresa y usuario creados exitosamente.", severity: "success" });

    } catch (error) {
      console.error("Error creating company:", error);
      setSnackbar({ open: true, message: "Error al crear la empresa.", severity: "error" });
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Gestión de Empresas
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Agregar Nueva Empresa
        </Typography>
        <Box component="form" onSubmit={handleCreateCompany} sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <TextField
            label="Nombre de la empresa"
            variant="outlined"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="CUIT"
            variant="outlined"
            value={newCompanyCuit}
            onChange={(e) => setNewCompanyCuit(e.target.value)}
            fullWidth
            required
            helperText="Este CUIT se usará para iniciar sesión"
          />
          <FormControl variant="outlined" fullWidth required>
            <InputLabel htmlFor="company-password">Contraseña</InputLabel>
            <OutlinedInput
              id="company-password"
              type={showPassword ? 'text' : 'password'}
              value={newCompanyPassword}
              onChange={(e) => setNewCompanyPassword(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Contraseña"
            />
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            type="submit"
            disabled={!newCompanyName.trim() || !newCompanyCuit.trim() || !newCompanyPassword.trim()}
          >
            Crear Empresa
          </Button>
        </Box>
      </Paper>

      {/* Snackbar para mostrar mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
}
