import React, { useState, useContext } from 'react';
import { getDeadlineColor } from '../../../../utils/getDeadlineColor';
import { 
  Paper, Typography, Button, Stack, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Box
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonalForm from '../../PersonalForm';
import PersonalImportForm from '../../PersonalImportForm';
import DocumentosPersonalForm from '../../DocumentosPersonalForm';
import WarningIcon from '@mui/icons-material/Warning';
import { AuthContext } from '../../../../context/AuthContext';


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
  const { user: currentUser } = useContext(AuthContext);

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
        <PersonalForm companyId={currentUser.companyId} />
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
                        const dateToUse = uploaded?.expirationDate || doc.deadline?.date;
                        const days = dateToUse ? Math.floor((new Date(dateToUse) - new Date()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                          <TableCell key={doc.id}>
                            {uploaded ? (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 0.5 }}>
                                <Typography
                                  color={
                                    uploaded.status === "Aprobado"
                                      ? "success.main"
                                      : uploaded.status === "Rechazado"
                                      ? "error.main"
                                      : "warning.main"
                                  }
                                  variant="body2"
                                >
                                  {uploaded.status}
                                </Typography>

                                {dateToUse && (
                                  <Tooltip title={days <= 0 ? "¡Vencido!" : `Faltan ${days} días`}>
                                    <Box display="flex" alignItems="center" mt={1}>
                                      <Typography variant="caption">
                                        Vence: {new Date(dateToUse).toLocaleDateString()}
                                      </Typography>
                                      {days !== null && days <= 10 && (
                                        <WarningIcon fontSize="small" sx={{ ml: 1 }} color={days <= 0 ? "error" : "warning"} />
                                      )}
                                    </Box>
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 0.5 }}>
                                <Typography variant="caption" color="warning.main">
                                  Pendiente
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}


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