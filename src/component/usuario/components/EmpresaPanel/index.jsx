import React, { useState } from 'react';
import { 
  Paper, Typography, Button, Stack, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Box
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonalForm from '../../../usuario/PersonalForm';
import PersonalImportForm from '../../../usuario/PersonalImportForm';
import DocumentosPersonalForm from '../../../usuario/DocumentosPersonalForm';

export default function PersonalPanel({
  personal,
  requiredDocuments,
  uploadedDocuments,
  hasWarningsForPerson,
  refreshUploadedDocuments,
  getDeadlineColor
}) {
  const [showImportPersonal, setShowImportPersonal] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button 
          variant={!showImportPersonal ? "contained" : "outlined"}
          onClick={() => setShowImportPersonal(false)}
          startIcon={<PersonIcon />}
        >
          Agregar Individual
        </Button>
        <Button 
          variant={showImportPersonal ? "contained" : "outlined"}
          onClick={() => setShowImportPersonal(true)}
          startIcon={<CloudUploadIcon />}
        >
          Importación Masiva
        </Button>
      </Stack>
      
      {showImportPersonal ? (
        <PersonalImportForm />
      ) : (
        <PersonalForm />
      )}
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Personal Registrado ({personal.length})
        </Typography>

        {personal.length === 0 ? (
          <Typography color="textSecondary">
            No hay personal registrado para esta empresa.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Nombre</b></TableCell>
                  <TableCell><b>DNI</b></TableCell>
                  {[...(requiredDocuments || [])]
                    .filter(doc => doc.entityType === "employee")
                    .slice(0, 5)
                    .map((doc) => (
                      <TableCell key={doc.id}><b>{doc.name}</b></TableCell>
                    ))}
                  <TableCell><b>Ver Más</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personal.map((persona) => (
                  <TableRow
                    key={persona.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "action.hover",
                        cursor: "pointer"
                      }
                    }}
                  >
                    <TableCell>{persona.nombre} {persona.apellido}</TableCell>
                    <TableCell>{persona.dni}</TableCell>

                    {[...(requiredDocuments || [])]
                      .filter(doc => doc.entityType === "employee")
                      .slice(0, 5)
                      .map((doc) => {
                        const uploaded = uploadedDocuments.find(
                          up => up.entityId === persona.id && up.requiredDocumentId === doc.id
                        );
                        const color = uploaded?.expirationDate ? getDeadlineColor(uploaded.expirationDate) : "textSecondary";
                        const vencimientoFecha = uploaded?.expirationDate ? new Date(uploaded.expirationDate).toLocaleDateString() : null;

                        return (
                          <TableCell key={doc.id}>
                            {uploaded ? (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 0.5 }}>
                                <Typography
                                  color={
                                    uploaded.status === "Aprobado" ? "success.main"
                                    : uploaded.status === "Rechazado" ? "error.main"
                                    : "warning.main"
                                  }
                                  variant="body2"
                                >
                                  {uploaded.status}
                                </Typography>
                                {uploaded?.expirationDate && (
                                  <Typography variant="caption" color={getDeadlineColor(uploaded.expirationDate)}>
                                    Vence: {new Date(uploaded.expirationDate).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 0.5 }}>
                                <Typography variant="caption" color="warning.main">
                                  Pendiente
                                </Typography>
                                {vencimientoFecha && (
                                  <Typography variant="caption" color="warning.main">
                                    Vence: {vencimientoFecha}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </TableCell>
                        );
                      })
                    }

                    <TableCell>
                      <Tooltip title="Ver todos los documentos" arrow>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedPersona(persona);
                            setSelectedDocumentId(null);
                            setOpenDocumentosDialog(true);
                          }}
                        >
                          Ver Más
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
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
              onDocumentUploaded={refreshUploadedDocuments}
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