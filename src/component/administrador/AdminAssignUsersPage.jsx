// src/component/administrador/AdminAssignUsersPage.jsx

import { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert
} from "@mui/material";

export default function AdminAssignUsersPage() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsersAndCompanies();
  }, []);

  const loadUsersAndCompanies = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const companiesSnapshot = await getDocs(collection(db, "companies"));

      setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setCompanies(companiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error cargando usuarios o empresas:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedCompanyId) {
      setError("Debes seleccionar un usuario y una empresa.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userRef = doc(db, "users", selectedUserId);
      await updateDoc(userRef, { companyId: selectedCompanyId });
      setSuccess("Usuario asignado correctamente a la empresa.");
      setSelectedUserId("");
      setSelectedCompanyId("");
      loadUsersAndCompanies();
    } catch (error) {
      console.error("Error asignando empresa al usuario:", error);
      setError("No se pudo asignar la empresa. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Asignar Empresa a Usuario
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="user-select-label">Seleccionar Usuario</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  label="Seleccionar Usuario"
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="company-select-label">Seleccionar Empresa</InputLabel>
                <Select
                  labelId="company-select-label"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  label="Seleccionar Empresa"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleAssign}
                disabled={loading || !selectedUserId || !selectedCompanyId}
              >
                Asignar Empresa
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}