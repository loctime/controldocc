import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Box
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VehiculosForm from '../../../usuario/VehiculosForm';
import DocumentosVehiculoForm from '../../../usuario/DocumentosVehiculoForm';

export default function VehiculosPanel({
  vehiculos,
  requiredDocuments,
  uploadedDocuments,
  refreshUploadedDocuments,
  getDeadlineColor
}) {
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);
  const [vehiculosLoading, setVehiculosLoading] = useState(false);
  const [vehiculosError, setVehiculosError] = useState(null);
  const [documentosLoading, setDocumentosLoading] = useState(false);
  const [documentosError, setDocumentosError] = useState(null);

  const handleRefreshUploadedDocuments = useCallback(() => {
    refreshUploadedDocuments();
  }, [refreshUploadedDocuments]);

  useEffect(() => {
    setVehiculosLoading(true);
    // Lógica para cargar vehículos
    setVehiculosLoading(false);
  }, []);

  useEffect(() => {
    setDocumentosLoading(true);
    // Lógica para cargar documentos
    setDocumentosLoading(false);
  }, [selectedVehiculo]);

  return (
    <>
      <VehiculosForm />
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vehículos Registrados ({vehiculos.length})
        </Typography>

        {vehiculos.length === 0 ? (
          <Typography color="textSecondary">
            No hay vehículos registrados para esta empresa.
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Patente</b></TableCell>
                  <TableCell><b>Modelo</b></TableCell>
                  {[...(requiredDocuments || [])]
                    .filter(doc => doc.entityType === "vehicle")
                    .slice(0, 5)
                    .map((doc) => (
                      <TableCell key={doc.id}><b>{doc.name}</b></TableCell>
                    ))}
                  <TableCell><b>Ver Más</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehiculos.map((vehiculo) => (
                  <TableRow
                    key={vehiculo.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "action.hover",
                        cursor: "pointer"
                      }
                    }}
                  >
                    <TableCell>{vehiculo.patente}</TableCell>
                    <TableCell>{vehiculo.modelo}</TableCell>

                    {[...(requiredDocuments || [])]
                      .filter(doc => doc.entityType === "vehicle")
                      .slice(0, 5)
                      .map((doc) => {
                        const uploaded = (uploadedDocuments || []).find(
                          up => up.entityId === vehiculo.id && up.requiredDocumentId === doc.id
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
                            setSelectedVehiculo(vehiculo);
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
        open={openDocumentosDialog && selectedVehiculo !== null} 
        onClose={() => {
          setOpenDocumentosDialog(false);
          setSelectedVehiculo(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Documentos de {selectedVehiculo?.marca} {selectedVehiculo?.modelo} ({selectedVehiculo?.patente})
        </DialogTitle>
        <DialogContent dividers>
          {selectedVehiculo && (
            <DocumentosVehiculoForm
              vehiculo={selectedVehiculo}
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