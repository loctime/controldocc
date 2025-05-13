import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Box
} from '@mui/material';
import VehiculosForm from '../../../usuario/VehiculosForm';
import DocumentosVehiculoForm from '../../../usuario/DocumentosVehiculoForm';
import EntidadPanel from '../../EntidadPanel';
import { getDeadlineColor } from '../../../../utils/getDeadlineColor';

export default function VehiculosPanel({
  vehiculos,
  requiredDocuments,
  uploadedDocuments,
  refreshUploadedDocuments,
  getDeadlineColor,
  onVehiculoAdded
}) {
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);

  const handleRefreshUploadedDocuments = useCallback(() => {
    refreshUploadedDocuments();
  }, [refreshUploadedDocuments]);

console.log(requiredDocuments);
  const [formKey, setFormKey] = useState(0);

  const handleVehiculoAdded = () => {
    setFormKey(k => k + 1); // Fuerza remount del formulario
    if (typeof onVehiculoAdded === 'function') {
      onVehiculoAdded(); // Refresca el listado real en el padre
    }
    refreshUploadedDocuments && refreshUploadedDocuments(); // Refresca documentos si corresponde
  };

  return (
    <>
      <VehiculosForm key={formKey} companyId={undefined} onVehiculoAdded={handleVehiculoAdded} />
      
      <EntidadPanel
  title={`Vehículos Registrados (${vehiculos.length})`}
  entityType="vehicle"
  entityList={vehiculos}
  documentosRequeridos={requiredDocuments}
  documentosSubidos={uploadedDocuments}
  getDeadlineColor={getDeadlineColor}
  onVerMas={(vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setSelectedDocumentId(null);
    setOpenDocumentosDialog(true);
  }}
  renderIdentificadores={(mode, v) =>
    mode === "header" ? (
      <>
        <TableCell><b>Patente</b></TableCell>
        <TableCell><b>Modelo</b></TableCell>
      </>
    ) : (
      <>
        <TableCell>{v.patente}</TableCell>
        <TableCell>{v.modelo}</TableCell>
      </>
    )
  }
/>

      
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