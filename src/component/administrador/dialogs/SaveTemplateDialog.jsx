import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';

/**
 * Diálogo para guardar una plantilla de documentos
 */
const SaveTemplateDialog = ({ 
  open, 
  onClose, 
  onSave, 
  templateName, 
  setTemplateName, 
  loading 
}) => {
  // Si no está abierto, no renderizamos nada
  if (!open) return null;

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      disablePortal
    >
      <DialogTitle>Guardar como plantilla</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Guarde la lista actual de documentos requeridos como una plantilla para reutilizarla con otras empresas.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Nombre de la plantilla"
          fullWidth
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading || !templateName.trim()}
        >
          {loading ? <CircularProgress size={24} /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveTemplateDialog;
