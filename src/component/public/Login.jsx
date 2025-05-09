import React, { useState, useEffect } from 'react';
import { 
  Button, TextField, Box, CircularProgress, Alert, 
  Typography, Paper, Container, Avatar, Grid, Link 
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseconfig";
import { useAuth } from "../../context/AuthContext";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from "../../firebaseconfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const createUserIfNotExists = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn('[Login] Creando documento de usuario automáticamente');
        await setDoc(userRef, {
          email: user.email,
          role: "user",
          companyId: null,
          createdAt: serverTimestamp()
        });
      }

      navigate('/usuario/dashboard');
    };

    createUserIfNotExists();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Intentando login con:", email, password);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login exitoso, verificando rol...");
    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message);
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
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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