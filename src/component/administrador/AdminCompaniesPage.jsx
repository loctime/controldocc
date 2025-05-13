import React, { useState } from "react";
import { Card, CardContent, Divider, Checkbox, Button, CircularProgress, Box, Grid } from "@mui/material";
import { useCompanyList } from "../../context/CompaniesContext";
import { Business as BusinessIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { deleteDoc, doc, getDocs, query, where, collection } from "firebase/firestore";
import { db } from "../../firebaseconfig";



const AdminCompaniesPage = () => {
  const { companies, refresh, loading } = useCompanyList();
  const [selected, setSelected] = React.useState([]);
  const [deleting, setDeleting] = React.useState(false);

  // Maneja selección/deselección de empresa
  const handleSelect = (companyId) => {
    setSelected((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  // Eliminar empresas seleccionadas y sus usuarios
  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      for (const companyId of selected) {
        await deleteDoc(doc(db, "companies", companyId));
        // Eliminar usuarios asociados a la empresa
        const usersQuery = await getDocs(
          query(collection(db, "users"), where("companyId", "==", companyId))
        );
        const deletePromises = [];
        usersQuery.forEach((userDoc) => {
          deletePromises.push(deleteDoc(doc(db, "users", userDoc.id)));
        });
        if (deletePromises.length > 0) await Promise.all(deletePromises);
      }
      setSelected([]);
      if (refresh) await refresh();
    } catch (error) {
      alert("Error eliminando empresas: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={selected.length === 0 || deleting}
          onClick={handleDeleteSelected}
        >
          Eliminar seleccionadas
        </Button>
        {deleting && <CircularProgress size={24} />}
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} md={4} key={company.id}>
              <Card elevation={2} sx={{ height: '100%', borderRadius: 2, position: 'relative' }}>
                <CardContent>
                  <Checkbox
                    checked={selected.includes(company.id)}
                    onChange={() => handleSelect(company.id)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon color="primary" sx={{ mr: 2 }} />
                    <Typography variant="h6" component="div">
                      {company.name}
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    CUIT: {company.cuit || company.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estado: {company.status}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminCompaniesPage;
