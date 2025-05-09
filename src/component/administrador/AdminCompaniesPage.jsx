import React, { useState } from "react";
import { Grid, CircularProgress, Box } from "@mui/material";  // Para el loading y la visualización de la lista de empresas
import { useCompanyList } from "../../context/CompaniesContext";  // Hook para obtener la lista de empresas
import CreateCompany from "./dialogs/CreateCompany";  // Importa tu nuevo componente para crear empresas
import { Card, CardContent, CardActions, Divider, IconButton, Tooltip } from "@mui/material"; // Para mostrar las tarjetas de empresa
import { Delete as DeleteIcon, Edit as EditIcon, Business as BusinessIcon } from "@mui/icons-material";  // Íconos
import { deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import { Typography } from "@mui/material";


const AdminCompaniesPage = () => {
  const { companies, fetchCompanies, loading, error } = useCompanyList();  // Desestructuramos para obtener las empresas, carga, etc.


  // Función de eliminar empresa
  const handleDeleteCompany = async (company) => {
    try {
      // Eliminar la empresa y sus usuarios asociados
      await deleteDoc(doc(db, "companies", company.cuit));

      const usersQuery = await getDocs(
        query(collection(db, "users"), where("companyId", "==", company.cuit))
      );

      const deletePromises = [];
      usersQuery.forEach((userDoc) => {
        deletePromises.push(deleteDoc(doc(db, "users", userDoc.id)));
      });
      if (deletePromises.length > 0) await Promise.all(deletePromises);

      await fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  return (
    <Box>
      {/* Usamos el componente CreateCompany para agregar nuevas empresas */}
      <CreateCompany fetchCompanies={fetchCompanies} />

      {/* Mostrar un loader mientras se cargan las empresas */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Mostrar todas las empresas en tarjetas */}
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
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar empresa">
                    <IconButton 
                      color="error" 
                      size="small"
                      onClick={() => handleDeleteCompany(company)}
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
    </Box>
  );
};

export default AdminCompaniesPage;
