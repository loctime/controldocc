import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Grid
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

/**
 * Diálogo para mostrar los detalles de una plantilla
 */
const TemplateDetailsDialog = ({
  open,
  onClose,
  template,
  onApply,
  selectedCompanyId
}) => {
  // Si no está abierto o no hay plantilla seleccionada, no renderizamos nada
  if (!open || !template) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disablePortal
    >
      <DialogTitle>
        Detalles de la plantilla: {template.name}
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Documentos incluidos:
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {template.documents?.map((doc, index) => (
              <Grid xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: (theme) => theme.palette.grey[50]
                  }}
                >
                  <Typography variant="subtitle2" noWrap>
                    {doc.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipo: {doc.entityType === 'company' ? 'Empresa' :
                          doc.entityType === 'personal' ? 'Personal' :
                          doc.entityType === 'vehicle' ? 'Vehículo' : doc.entityType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    Vencimiento: {doc.deadline?.type === 'monthly' ? 'Mensual' :
                                doc.deadline?.type === 'biannual' ? 'Semestral' :
                                doc.deadline?.type === 'annual' ? 'Anual' :
                                doc.deadline?.type === 'custom' ? 'Personalizado' : 'No especificado'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              onApply(template);
              onClose();
            }}
            disabled={!selectedCompanyId}
            startIcon={<AddIcon />}
          >
            Aplicar esta plantilla
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateDetailsDialog;
