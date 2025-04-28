import React, { useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDoc, getDocs, deleteDoc, doc, query, where, setDoc, addDoc, updateDoc } from "firebase/firestore";
import { useCompanyList } from "../../contextos/company-list-context";
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
  FormHelperText,
  Snackbar
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function AdminCompaniesPage() {
  const { companies, fetchCompanies, loading, error } = useCompanyList();
  
  // 🔵 Estados para crear empresa
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCuit, setNewCompanyCuit] = useState("");
  const [newCompanyPassword, setNewCompanyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔵 Estados para eliminar empresa
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  // 🔵 Estados para editar empresa
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyPassword, setEditCompanyPassword] = useState("");

  // 🔵 Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    if (!newCompanyName.trim() || !newCompanyCuit.trim() || !newCompanyPassword.trim()) return;

    try {
      const existingCompany = await getDoc(doc(db, "companies", newCompanyCuit.trim()));
      if (existingCompany.exists()) {
        setSnackbar({ open: true, message: "Ya existe una empresa con ese CUIT.", severity: "warning" });
        return;
      }

      // Crear empresa
      const newCompany = {
        name: newCompanyName.trim(),
        cuit: newCompanyCuit.trim(),
        createdAt: new Date().toISOString(),
      };
      
      const companyRef = doc(db, "companies", newCompanyCuit.trim());
      await setDoc(companyRef, newCompany);

      // Crear usuario predeterminado
      const defaultUserEmail = `${newCompanyCuit.trim()}@controldoc.com`;
      const defaultUser = {
        email: defaultUserEmail,
        role: "user",
        companyId: newCompanyCuit.trim(),
        name: newCompanyName.trim(),
        createdAt: new Date().toISOString(),
        password: newCompanyPassword.trim(),
      };
      
      await addDoc(collection(db, "users"), defaultUser);

      setNewCompanyName("");
      setNewCompanyCuit("");
      setNewCompanyPassword("");

      await fetchCompanies();
      setSnackbar({ open: true, message: "Empresa creada exitosamente.", severity: "success" });

    } catch (error) {
      console.error("Error creating company:", error);
      setSnackbar({ open: true, message: "Error al crear la empresa.", severity: "error" });
    }
  };

  const openDeleteConfirmation = (company) => {
    setCompanyToDelete({ ...company });
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setTimeout(() => setCompanyToDelete(null), 300);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    const cuitToDelete = companyToDelete.cuit;
    setOpenDeleteDialog(false);

    setTimeout(async () => {
      try {
        await deleteDoc(doc(db, "companies", cuitToDelete));

        const usersQuery = await getDocs(
          query(collection(db, "users"), where("companyId", "==", cuitToDelete))
        );
        const deletePromises = [];
        usersQuery.forEach((userDoc) => {
          deletePromises.push(deleteDoc(doc(db, "users", userDoc.id)));
        });
        if (deletePromises.length > 0) await Promise.all(deletePromises);

        await fetchCompanies();
        setSnackbar({ open: true, message: "Empresa eliminada exitosamente.", severity: "success" });
      } catch (error) {
        console.error("Error deleting company:", error);
        setSnackbar({ open: true, message: "Error al eliminar la empresa.", severity: "error" });
      }
    }, 300);
  };

  const openEditCompanyDialog = (company) => {
    setCompanyToEdit({ ...company });
    setEditCompanyName(company.name);
    setEditCompanyPassword(""); // ⚡ opcional: podrías no editar contraseña si no quieres
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setTimeout(() => setCompanyToEdit(null), 300);
  };

  const handleUpdateCompany = async () => {
    if (!companyToEdit) return;

    try {
      const companyRef = doc(db, "companies", companyToEdit.cuit);
      await updateDoc(companyRef, {
        name: editCompanyName.trim(),
      });

      if (editCompanyPassword.trim()) {
        const usersQuery = await getDocs(
          query(collection(db, "users"), where("companyId", "==", companyToEdit.cuit))
        );
        const updatePromises = [];
        usersQuery.forEach((userDoc) => {
          updatePromises.push(updateDoc(doc(db, "users", userDoc.id), { password: editCompanyPassword.trim() }));
        });
        if (updatePromises.length > 0) await Promise.all(updatePromises);
      }

      await fetchCompanies();
      setSnackbar({ open: true, message: "Empresa actualizada exitosamente.", severity: "success" });
      handleCloseEditDialog();
    } catch (error) {
      console.error("Error updating company:", error);
      setSnackbar({ open: true, message: "Error al actualizar la empresa.", severity: "error" });
    }
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
            <FormHelperText>Esta contraseña se usará para iniciar sesión con el CUIT</FormHelperText>
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
                    Creada: {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Tooltip title="Editar empresa">
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => openEditCompanyDialog(company)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
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

      {/* Diálogo de eliminar empresa */}
      <Dialog
        open={openDeleteDialog}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCloseDeleteDialog}
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
              <Button onClick={handleCloseDeleteDialog} color="primary">
                Cancelar
              </Button>
              <Button onClick={handleDeleteCompany} color="error" variant="contained">
                Eliminar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Diálogo de editar empresa */}
      <Dialog
        open={openEditDialog}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCloseEditDialog}
      >
        <DialogTitle>Editar Empresa</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, px: 3, pb: 3 }}>
          <TextField
            label="Nuevo nombre de empresa"
            value={editCompanyName}
            onChange={(e) => setEditCompanyName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nueva contraseña (opcional)"
            type="password"
            value={editCompanyPassword}
            onChange={(e) => setEditCompanyPassword(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleUpdateCompany} color="success" variant="contained">
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
