import React from 'react';
import { Paper, Typography, Grid, Box, Divider, Alert } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import DocumentosEmpresaForm from '../../../usuario/DocumentosEmpresaForm';

export default function EmpresaPanel({ 
  company, 
  personal, 
  vehiculos, 
  requiredDocuments,
  onDocumentUploaded 
}) {
  return (
    <>
      <DocumentosEmpresaForm onDocumentUploaded={onDocumentUploaded} />
      
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Datos de la Empresa
        </Typography>
        
        {company ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Nombre:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {company.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  CUIT:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {company.cuit}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Resumen de Datos
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                  <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{personal.length}</Typography>
                  <Typography variant="body2">Personal Registrado</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                  <DirectionsCarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{vehiculos.length}</Typography>
                  <Typography variant="body2">Vehículos Registrados</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                  <DescriptionIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{requiredDocuments.length}</Typography>
                  <Typography variant="body2">Documentos Requeridos</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Alert severity="warning">
            No se pudieron cargar los datos de la empresa.
          </Alert>
        )}
      </Paper>
    </>
  );
}