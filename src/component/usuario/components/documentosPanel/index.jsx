import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Button,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import DocumentosList from './DocumentosList';
import DocumentosSummary from './DocumentosSummary';

export default function DocumentosPanel({
  requiredDocuments,
  uploadedDocuments,
  hasWarningsForType,
  setTabValue,
  refreshUploadedDocuments,
  getDeadlineColor
}) {
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);

  return (
    <>
      <Paper elevation={4} sx={{ 
        p: 3, 
        maxWidth: '1200px',
        width: '100%',
        margin: '2rem auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h6" gutterBottom>
          Documentos Requeridos
        </Typography>

        {requiredDocuments.length === 0 ? (
          <Typography color="textSecondary">
            No hay documentos requeridos configurados para esta empresa.
          </Typography>
        ) : (
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
                  startIcon={<UploadFileIcon />}
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
                  startIcon={<PersonIcon />}
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
                  startIcon={<DirectionsCarIcon />}
                  onClick={() => setTabValue(2)}
                  fullWidth
                >
                  Ver Vehículos
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </>
  );
}