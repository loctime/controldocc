import React, { useState } from 'react';
import {
  Button, TextField, Box, CircularProgress, Alert,
  Typography, Paper, Container, Avatar, Grid, Link
} from "@mui/material";
import { Business as BusinessIcon } from "@mui/icons-material";
import { auth, db } from '../../firebaseconfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    cuit: '',
    companyName: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Validaciones paralelas
      const [cuitSnap, emailSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), where("companyId", "==", formData.cuit))),
        getDocs(query(collection(db, "users"), where("email", "==", formData.email)))
      ]);

      if (!cuitSnap.empty) {
        throw new Error('El CUIT ya está registrado');
      }
      
      if (!emailSnap.empty) {
        throw new Error('El email ya está registrado');
      }

      // 2. Crear usuario
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 3. Crear documentos
      await Promise.all([
        setDoc(doc(db, "users", userCredential.user.uid), {
          email: formData.email,
          role: "user",
          companyId: formData.cuit,
          companyName: formData.companyName,
          firebaseUid: userCredential.user.uid,
          status: "pending",
          createdAt: serverTimestamp()
        }),
        setDoc(doc(db, "companies", formData.cuit), {
          cuit: formData.cuit,
          companyName: formData.companyName,
          ownerId: userCredential.user.uid,
          status: "pending",
          createdAt: serverTimestamp()
        })
      ]);

      // 4. Feedback
      navigate('/login', { state: { registrationSuccess: true } });

    } catch (error) {
      setError(error.message);
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
          <BusinessIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Registro de Empresa
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            label="Email"
            margin="normal"
            fullWidth
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <TextField
            label="CUIT"
            margin="normal"
            fullWidth
            value={formData.cuit}
            onChange={(e) => setFormData({...formData, cuit: e.target.value})}
            required
            inputProps={{
              pattern: "[0-9]{11}",
              title: "11 dígitos sin guiones"
            }}
          />

          <TextField
            label="Nombre de la Empresa"
            margin="normal"
            fullWidth
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            required
          />

          <TextField
            label="Contraseña"
            margin="normal"
            fullWidth
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            inputProps={{
              minLength: 6
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Registrar Empresa'}
          </Button>
          
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;