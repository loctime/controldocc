import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, deleteDoc, doc, query, where, setDoc, addDoc } from "firebase/firestore";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Slide,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  FormHelperText
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCuit, setNewCompanyCuit] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getDocs(collection(db, "companies"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCompanies(list);
    } catch (error) {
      console.error("Error loading companies:", error);
      setError("Error al cargar las empresas. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    if (!newCompanyName.trim() || !newCompanyCuit.trim() || !newCompanyPassword.trim()) return;

    setLoading(true);
    setError("");
    try {
      // Crear la empresa
      const newCompany = {
        name: newCompanyName.trim(),
        cuit: newCompanyCuit.trim(),
        createdAt: new Date().toISOString(),
      };
      
      // Usar el CUIT como ID de la empresa
      const companyRef = doc(db, "companies", newCompanyCuit.trim());
      await setDoc(companyRef, newCompany);
      
      // Crear un usuario predeterminado para esta empresa
      const defaultUserEmail = `${newCompanyCuit.trim()}@controldoc.com`;
      const defaultUser = {
        email: defaultUserEmail,
        role: "user",
        companyId: newCompanyCuit.trim(),
        name: newCompanyName.trim(),
        createdAt: new Date().toISOString(),
        password: newCompanyPassword.trim(), // Almacenar la contraseña para referencia
      };
      
      // Crear un documento en la colección users con un ID generado automáticamente
      await addDoc(collection(db, "users"), defaultUser);
      
      // Limpiar el formulario
      setNewCompanyName("");
      setNewCompanyCuit("");
      setNewCompanyPassword("");
      
      // Recargar la lista de empresas
      await loadCompanies();
    } catch (error) {
      console.error("Error creating company:", error);
      setError("Error al crear la empresa. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };

  // Función para abrir el diálogo de confirmación
  const openDeleteConfirmation = (company) => {
    // Guardamos una copia local de la empresa para evitar problemas de referencia
    setCompanyToDelete({...company});
    setOpenDeleteDialog(true);
  };

  // Función para cerrar el diálogo sin eliminar
  const handleCloseDialog = () => {
    setOpenDeleteDialog(false);
    // Esperamos a que se complete la animación de cierre antes de limpiar el estado
    setTimeout(() => {
      setCompanyToDelete(null);
    }, 300); // 300ms es aproximadamente la duración de la animación de Material UI
  };

  // Función para eliminar la empresa
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    // Guardamos los datos necesarios en variables locales
    const cuitToDelete = companyToDelete.cuit;
    
    // Cerramos el diálogo primero
    setOpenDeleteDialog(false);
    
    // Esperamos a que se complete la animación de cierre
    setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        
        // Actualizamos el estado local primero (optimistic update)
        setCompanies((prevCompanies) =>
          prevCompanies.filter((company) => company.cuit !== cuitToDelete)
        );
        
        // Eliminamos la empresa de Firestore
        await deleteDoc(doc(db, "companies", cuitToDelete));
        
        // Buscamos y eliminamos los usuarios asociados
        const usersQuery = await getDocs(
          query(collection(db, "users"), where("companyId", "==", cuitToDelete))
        );
        
        const deletePromises = [];
        usersQuery.forEach((userDoc) => {
          deletePromises.push(deleteDoc(doc(db, "users", userDoc.id)));
        });
        
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
        }
        
        // Limpiamos la referencia a la empresa eliminada
        setCompanyToDelete(null);
        
        // Recargamos las empresas para asegurar sincronización
        await loadCompanies();
      } catch (error) {
        console.error("Error deleting company:", error);
        setError("Error al eliminar la empresa. Por favor, intenta de nuevo.");
        // Recargamos las empresas para restaurar el estado correcto
        await loadCompanies();
      } finally {
        setLoading(false);
      }
    }, 300); // Esperamos a que se complete la animación
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Gestión de Empresas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
            disabled={loading}
            fullWidth
            required
          />
          <TextField
            label="CUIT"
            variant="outlined"
            value={newCompanyCuit}
            onChange={(e) => setNewCompanyCuit(e.target.value)}
            disabled={loading}
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
            <FormHelperText>Esta contraseña se usará para iniciar sesión con el CUIT</FormHelperText>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            type="submit"
            disabled={loading || !newCompanyName.trim() || !newCompanyCuit.trim() || !newCompanyPassword.trim()}
          >
            Crear Empresa
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} md={4} key={company.id}>
              <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div">
                      {company.name}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    CUIT: {company.cuit || "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Creada: {new Date(company.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Tooltip title="Eliminar empresa">
                    <IconButton 
                      color="error" 
                      size="small"
                      onClick={() => openDeleteConfirmation(company)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openDeleteDialog}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        {companyToDelete && (
          <>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que deseas eliminar la empresa "{companyToDelete.name}"? Esta acción no se puede deshacer.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Cancelar
              </Button>
              <Button onClick={handleDeleteCompany} color="error" variant="contained">
                Eliminar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
