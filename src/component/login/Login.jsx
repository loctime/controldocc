// src/component/login/Login.jsx
import React, { useState } from 'react';
import {
  Box, Button, FormControl, Grid, IconButton, InputAdornment,
  InputLabel, OutlinedInput, TextField, Typography, Alert, Paper, CircularProgress,
  Tabs, Tab, Divider
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Business } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseconfig";

const ADMIN_ROLE = "DhHkVja"; // Rol de administrador

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [cuit, setCuit] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState(0); // 0 = admin, 1 = usuario

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleLoginModeChange = (event, newValue) => {
    setLoginMode(newValue);
    setError('');
  };

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          if (userData.role === ADMIN_ROLE || userData.role?.includes(ADMIN_ROLE) || user.email === "fe.rv@hotmail.com") {
            localStorage.setItem("isAdminSession", "true");
            navigate("/admin/dashboard");
          } else {
            setError("No tienes permisos de administrador");
          }
        } else {
          setError("Usuario no encontrado en la base de datos");
        }
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async () => {
    if (!cuit.trim() || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const companyRef = doc(db, "companies", cuit.trim());
      const companySnap = await getDoc(companyRef);

      if (!companySnap.exists()) {
        setError("No se encontró ninguna empresa con ese CUIT");
        setLoading(false);
        return;
      }

      const companyData = companySnap.data();

      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("companyId", "==", cuit.trim()));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        setError("No hay usuarios asociados a esta empresa");
        setLoading(false);
        return;
      }

      let authenticated = false;
      let userData = null;

      for (const userDoc of userSnapshot.docs) {
        const user = userDoc.data();
        if (user.password === password) {
          authenticated = true;
          userData = user;
          break;
        }
      }

      if (authenticated && userData) {
        localStorage.setItem('userCompany', JSON.stringify({
          companyId: cuit.trim(),
          companyName: companyData.name,
          userName: userData.name,
          userRole: userData.role
        }));

        navigate("/usuario/dashboard");
      } else {
        setError("Contraseña incorrecta");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    loginMode === 0 ? await handleAdminLogin() : await handleUserLogin();
  };

  const handleAuthError = (err) => {
    switch (err.code) {
      case "auth/invalid-email": setError("Correo inválido"); break;
      case "auth/user-disabled": setError("Cuenta deshabilitada"); break;
      case "auth/user-not-found": setError("Usuario no encontrado"); break;
      case "auth/wrong-password": setError("Contraseña incorrecta"); break;
      default: setError("Error al iniciar sesión. Intenta de nuevo.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 450, width: "100%" }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          ControlDoc - Iniciar Sesión
        </Typography>

        <Tabs value={loginMode} onChange={handleLoginModeChange} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab icon={<Person />} label="Administrador" />
          <Tab icon={<Business />} label="Usuario Empresa" />
        </Tabs>

        <Divider sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <Box display="flex" justifyContent="center" mb={2}><CircularProgress /></Box>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {loginMode === 0 ? (
              <Grid item xs={12}>
                <TextField label="Correo electrónico" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField label="CUIT de la empresa" fullWidth value={cuit} onChange={(e) => setCuit(e.target.value)} required helperText="Ingrese el CUIT sin guiones ni puntos" />
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="password">Contraseña</InputLabel>
                <OutlinedInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={handleClickShowPassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Contraseña"
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                Ingresar
              </Button>
            </Grid>

            <Grid item xs={12} textAlign="center">
              <Link to="/forgot-password" style={{ textDecoration: "none", color: "#1976d2" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;