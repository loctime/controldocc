import React from 'react';
import { Grid, Paper, Typography, Button, Badge, Box } from '@mui/material';
import { UploadFile, Person, DirectionsCar } from '@mui/icons-material';

export default function DocumentosSummary({ hasWarningsForType, setTabValue }) {
  return (
    <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
      {/* Documentos de Empresa */}
      <Grid item xs={12} md={4}>
        <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Badge color="error" variant="dot" invisible={!hasWarningsForType("company")}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Documentos de Empresa
            </Typography>
          </Badge>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Documentos generales de la empresa
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<UploadFile />}
            onClick={() => setTabValue(3)}
            fullWidth
          >
            Ver Documentos
          </Button>
        </Paper>
      </Grid>
      
      {/* Documentos de Personal */}
      <Grid item xs={12} md={4}>
        <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Badge color="error" variant="dot" invisible={!hasWarningsForType("employee")}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Documentos de Personal
            </Typography>
          </Badge>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Documentos específicos para cada persona
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Person />}
            onClick={() => setTabValue(1)}
            fullWidth
          >
            Ver Personal
          </Button>
        </Paper>
      </Grid>
      
      {/* Documentos de Vehículos */}
      <Grid item xs={12} md={4}>
        <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Badge color="error" variant="dot" invisible={!hasWarningsForType("vehicle")}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Documentos de Vehículos
            </Typography>
          </Badge>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Documentos específicos para cada vehículo
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<DirectionsCar />}
            onClick={() => setTabValue(2)}
            fullWidth
          >
            Ver Vehículos
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}