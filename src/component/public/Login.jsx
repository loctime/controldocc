import React, { useState, useEffect } from 'react';
import {
  Button, TextField, Box, CircularProgress, Alert,
  Typography, Paper, Container, Avatar, Grid, Link
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../firebaseconfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🔒 Forzar cierre de sesión al entrar a /login
  useEffect(() => {
    if (auth.currentUser) {
      console.log("🔒 Cerrando sesión previa al entrar al login");
      signOut(auth);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError("Usuario no registrado en el sistema.");
        await signOut(auth);
        return;
      }

      const userData = userSnap.data();

      if (
        userData.role === "DhHkVja" ||
        userData.status === "approved" ||
        userData.companyStatus === "approved"
      ) {
        // Buscar la empresa por CUIT y guardar en localStorage
        if (userData.companyId) {
          try {
            const companyRef = doc(db, "companies", userData.companyId);
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
              const companyData = companySnap.data();
              const userCompanyObj = {
                companyId: companyData.cuit,
                companyName: companyData.companyName
              };
              localStorage.setItem('userCompany', JSON.stringify(userCompanyObj));
              console.log('userCompany guardado en localStorage:', userCompanyObj);
            } else {
              // Si no existe la empresa, limpiar localStorage
              localStorage.removeItem('userCompany');
            }
          } catch (e) {
            console.error('Error buscando empresa por CUIT:', e);
            localStorage.removeItem('userCompany');
          }
        } else {
          localStorage.removeItem('userCompany');
        }
        // ✅ Redirigir al dashboard correspondiente
        const dashboard = userData.role === "DhHkVja" ? "/admin/dashboard" : "/usuario/dashboard";
        navigate(dashboard);
      } else {
        // 🔒 Cuenta pendiente → cerrar sesión
        setError("Tu cuenta está pendiente de aprobación.");
        await signOut(auth);
      }

    } catch (err) {
      console.error("Error en login:", err);
      setError("Credenciales incorrectas o cuenta no autorizada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{
        p: 4,
        mt: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Ingresar'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                ¿No tienes cuenta? Regístrate
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
