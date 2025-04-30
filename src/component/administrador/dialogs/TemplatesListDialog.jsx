import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * Diálogo para mostrar la lista de plantillas disponibles
 */
const TemplatesListDialog = ({
  open,
  onClose,
  templates,
  loading,
  onViewTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  selectedCompanyId
}) => {
  // Si no está abierto, no renderizamos nada
  if (!open) return null;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disablePortal
    >
      <DialogTitle>Plantillas de documentos</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No hay plantillas guardadas. Cree una lista de documentos y guárdela como plantilla.
          </Alert>
        ) : (
          <List>
            {templates.map((template) => (
              <React.Fragment key={template.id}>
                <ListItem>
                  <ListItemText
                    primary={template.name}
                    secondary={`${template.documents?.length || 0} documentos • Creada: ${new Date(template.createdAt).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Ver detalles">
                      <IconButton edge="end" onClick={() => onViewTemplate(template)}>
                        <DescriptionIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Aplicar plantilla">
                      <IconButton
                        edge="end"
                        onClick={() => onApplyTemplate(template)}
                        disabled={!selectedCompanyId}
                        color="primary"
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        edge="end"
                        onClick={() => onDeleteTemplate(template.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplatesListDialog;
