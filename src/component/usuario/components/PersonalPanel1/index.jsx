import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Box
} from '@mui/material';
import PersonalForm from '../../PersonalForm'; // Asegurate que existe
import DocumentosPersonalForm from '../../DocumentosPersonalForm';
import EntidadPanel from '../../EntidadPanel';
import { getDeadlineColor } from '../../../../utils/getDeadlineColor';

export default function PersonalPanel({
  personal,
  requiredDocuments,
  uploadedDocuments,
  refreshUploadedDocuments,
  getDeadlineColor
}) {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);
  const [vehiculosLoading, setVehiculosLoading] = useState(false);
  const [vehiculosError, setVehiculosError] = useState(null);
  const [documentosLoading, setDocumentosLoading] = useState(false);
  const [documentosError, setDocumentosError] = useState(null);
  const handleRefreshUploadedDocuments = useCallback(() => {
    refreshUploadedDocuments();
  }, [refreshUploadedDocuments]);
console.log(requiredDocuments)
  return (
    <>
      <PersonalForm />

      <EntidadPanel
        title="Personal Registrado"
        entityType="employee"
        entityList={personal}
        documentosRequeridos={requiredDocuments}
        documentosSubidos={uploadedDocuments}
        getDeadlineColor={getDeadlineColor}
        onVerMas={(persona) => {
          setSelectedPersona(persona);
          setSelectedDocumentId(null);
          setOpenDocumentosDialog(true);
        }}
        renderIdentificadores={(mode, persona) =>
          mode === "header" ? (
            <>
              <TableCell><b>Nombre</b></TableCell>
              <TableCell><b>Apellido</b></TableCell>
            </>
          ) : (
            <>
              <TableCell>{persona.nombre}</TableCell>
              <TableCell>{persona.apellido}</TableCell>
            </>
          )
        }
      />

      <Dialog
        open={openDocumentosDialog && selectedPersona !== null}
        onClose={() => {
          setOpenDocumentosDialog(false);
          setSelectedPersona(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Documentos de {selectedPersona?.nombre} {selectedPersona?.apellido}
        </DialogTitle>
        <DialogContent dividers>
          {selectedPersona && (
            <DocumentosPersonalForm
              persona={selectedPersona}
              selectedDocumentId={selectedDocumentId}
              onDocumentUploaded={handleRefreshUploadedDocuments}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDocumentosDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
