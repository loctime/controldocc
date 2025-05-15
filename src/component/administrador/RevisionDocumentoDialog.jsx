// components/RevisionDocumentoDialog.jsx

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button
} from '@mui/material';
import { Download } from '@mui/icons-material';
import DownloadButton from '../../components/common/DownloadButton';

export default function RevisionDocumentoDialog({
  open,
  tipo, // 'aprobar' o 'rechazar'
  doc,
  onClose,
  onViewFile,
  onConfirm,
  expirationDate,
  setExpirationDate,
  comment,
  setComment
}) {
  if (!doc) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {tipo === 'aprobar' ? 'Aprobar Documento' : 'Rechazar Documento'}
      </DialogTitle>

      <DialogContent dividers>
        {tipo === 'aprobar' && (
          <>
            <Typography variant="subtitle2">Vista previa del archivo</Typography>
            <Box
              sx={{ width: '100%', height: 300, border: '1px solid #ccc', mt: 1, mb: 2, cursor: 'pointer' }}
              onClick={() => onViewFile(doc.fileURL, doc.fileName)}
            >
              {doc.fileURL?.endsWith('.pdf') ? (
                <iframe src={doc.fileURL} width="100%" height="100%" />
              ) : (
                <img src={doc.fileURL} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </Box>

            <DownloadButton
              url={doc.fileURL}
              filename={doc.fileName}
              label="Descargar archivo"
              startIcon
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={expirationDate || ''}
              onChange={(e) => setExpirationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              required
            />
          </>
        )}

        {tipo === 'rechazar' && (
          <TextField
            label="Comentario obligatorio"
            multiline
            rows={4}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Motivo del rechazo"
            required
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={tipo === 'aprobar' ? 'success' : 'error'}
        >
          Confirmar {tipo === 'aprobar' ? 'Aprobación' : 'Rechazo'}
        </Button>

      </DialogActions>
    </Dialog>
  );
}
