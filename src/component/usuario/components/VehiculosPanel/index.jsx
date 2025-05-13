import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
  Tooltip, Box
} from '@mui/material';
import EditDeleteActions from '../../../../components/EditDeleteActions';
import Swal from 'sweetalert2';
import { db } from '../../../../firebaseconfig';
import { doc, deleteDoc } from 'firebase/firestore';
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

  const [editVehiculo, setEditVehiculo] = useState(null);
const [openEditDialog, setOpenEditDialog] = useState(false);
const [localVehiculos, setLocalVehiculos] = useState(vehiculos);

useEffect(() => {
  setLocalVehiculos(vehiculos);
}, [vehiculos]);

return (
    <>
      <VehiculosForm key={formKey} companyId={undefined} onVehiculoAdded={handleVehiculoAdded} />
      {/* Modal de edición de vehículo */}
      <Dialog
        open={openEditDialog && !!editVehiculo}
        onClose={() => {
          setOpenEditDialog(false);
          setEditVehiculo(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar vehículo</DialogTitle>
        <DialogContent dividers>
          {editVehiculo && (
            <VehiculosForm
              modoEdicion
              vehiculo={editVehiculo}
              onVehiculoEdited={async (updatedData) => {
                setOpenEditDialog(false);
                setEditVehiculo(null);
                setLocalVehiculos(prev => prev.map(v => v.id === updatedData.id ? {...v, ...updatedData} : v));
                if (typeof refreshUploadedDocuments === 'function') refreshUploadedDocuments();
              }}
              companyId={editVehiculo?.companyId}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenEditDialog(false);
            setEditVehiculo(null);
          }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      <EntidadPanel
  title={`Vehículos Registrados (${localVehiculos.length})`}
  entityType="vehicle"
  entityList={localVehiculos}
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
        <TableCell><b>Acciones</b></TableCell>
      </>
    ) : (
      <>
        <TableCell>{v.patente}</TableCell>
        <TableCell>{v.modelo}</TableCell>
        <TableCell>
          <EditDeleteActions
            onEdit={() => {
              setEditVehiculo(v);
              setOpenEditDialog(true);
            }}
            onDelete={async () => {
              const confirm = await Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Deseas eliminar el vehículo ${v.patente}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
              });
              if (confirm.isConfirmed) {
                try {
                  await deleteDoc(doc(db, 'vehiculos', v.id));
                  Swal.fire('Eliminado', 'El vehículo ha sido eliminado.', 'success');
                  setLocalVehiculos(prev => prev.filter(item => item.id !== v.id));
                  if (typeof refreshUploadedDocuments === 'function') refreshUploadedDocuments();
                } catch (error) {
                  Swal.fire('Error', 'No se pudo eliminar el vehículo.', 'error');
                }
              }
            }}
          />
        </TableCell>
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