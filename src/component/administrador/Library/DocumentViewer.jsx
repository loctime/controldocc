import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, CircularProgress,
  Tooltip, Divider, Chip
} from '@mui/material';
import {
  Close, Download, PictureAsPdf, Image, Description, 
  CheckCircle, Cancel, Pending
} from '@mui/icons-material';

export default function DocumentViewer({
  open,
  handleClose,
  currentDocument,
  handleDownload,
  formatFileSize,
  formatDate,
  loadingDocument
}) {
  const getFileIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'pdf': return <PictureAsPdf color="error" fontSize="large" />;
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image color="primary" fontSize="large" />;
      default: return <Description color="action" fontSize="large" />;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Aprobado': return <CheckCircle color="success" />;
      case 'Rechazado': return <Cancel color="error" />;
      default: return <Pending color="warning" />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {currentDocument && getFileIcon(currentDocument.tipo)}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {currentDocument?.nombreOriginal || 'Visualizador de documentos'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent>
        {loadingDocument ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh' 
          }}>
            <CircularProgress size={60} />
          </Box>
        ) : currentDocument ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Vista previa del documento */}
            <Box sx={{ 
              bgcolor: '#f5f5f5', 
              borderRadius: 2, 
              p: 2, 
              minHeight: '40vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="body1" color="text.secondary">
                Vista previa del documento (implementar visor específico según tipo)
              </Typography>
            </Box>

            {/* Metadatos del documento */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: 2 
            }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Empresa</Typography>
                <Typography>{currentDocument.companyName}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Tamaño</Typography>
                <Typography>{formatFileSize(currentDocument.size)}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Fecha de subida</Typography>
                <Typography>{formatDate(currentDocument.fechaSubida)}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(currentDocument.originalStatus)}
                  <Typography>{currentDocument.originalStatus}</Typography>
                </Box>
              </Box>
              
              {currentDocument.observaciones && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                  <Typography>{currentDocument.observaciones}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No se ha seleccionado ningún documento para visualizar
          </Typography>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cerrar
        </Button>
        
        {currentDocument && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleDownload(currentDocument.urlB2, currentDocument.nombreOriginal)}
            disabled={!currentDocument.urlB2}
            sx={{ borderRadius: 2 }}
          >
            Descargar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}