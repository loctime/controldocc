import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper
} from '@mui/material';
import DownloadButton from '../../components/common/DownloadButton';

export default function VistaDocumentoSubido({
  fileURL,
  fileName,
  uploaderName,
  uploaderComment,
  exampleURL,
  onDownload,
  documentDescription,
  expirationDate
}) {

  const [modalUrl, setModalUrl] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = (url) => {
    setModalUrl(url);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalUrl('');
  };

  const renderPreview = (url, isExample = false) => {
    const isPDF = url?.endsWith('.pdf');
    const previewBoxStyle = {
      width: '100%',
      height: 180,
      maxHeight: 180,
      overflow: 'hidden',
      border: 'none',
      cursor: 'pointer',
    };

    return (
      <Box onClick={() => handleOpenModal(url)} sx={{ cursor: 'pointer' }}>
        {isPDF ? (
          <iframe
            src={url}
            title={isExample ? "Ejemplo de documento" : "Documento subido"}
            style={previewBoxStyle}
          />
        ) : (
          <img
            src={url}
            alt={isExample ? "Ejemplo de documento" : "Documento subido"}
            title={isExample ? "Clic para ver ejemplo" : "Clic para ver documento"}
            style={{ ...previewBoxStyle, objectFit: 'contain' }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Archivo Subido</Typography>

      

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: '#fff',
              border: '2px solid #2196f3'
            }}
          >
            <Typography variant="subtitle2" gutterBottom>Documento Subido</Typography>
            {fileURL && renderPreview(fileURL, false)}
            {uploaderName && (
              <Typography variant="caption" display="block" mt={1}>
                Subido por: {uploaderName}
              </Typography>
            )}
            {uploaderComment && (
              <Typography variant="caption" display="block">
                Comentario: {uploaderComment}
              </Typography>
            )}
            {documentDescription && (
              <Typography variant="caption" display="block">
                Descripción: {documentDescription}
              </Typography>
            )}
            {expirationDate && (
              <Typography variant="caption" display="block">
                Vence: {new Date(expirationDate).toLocaleDateString()}
              </Typography>
            )}

          </Paper>
        </Grid>
        {exampleURL && (
          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#f4faff',
                border: '1px dashed #999'
              }}
            >
              <Typography variant="subtitle2" gutterBottom>Ejemplo de Referencia</Typography>
              {renderPreview(exampleURL, true)}
              <Typography variant="caption" display="block" mt={1}>Archivo de ejemplo</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      <DownloadButton
  url={fileURL}
  filename={fileName || 'documento.pdf'}
  label="Descargar archivo"
/>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>Vista completa</DialogTitle>
        <DialogContent dividers>
          {modalUrl?.endsWith('.pdf') ? (
            <iframe
              src={modalUrl}
              width="100%"
              height="600px"
              title="Vista completa"
              style={{ border: 'none' }}
            />
          ) : (
            <img
              src={modalUrl}
              alt="Vista completa"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
