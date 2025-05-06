  // Archivo: AdminUploadedDocumentsPage.jsx - Versión mejorada con funcionalidades de edición

import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Table, Select, MenuItem, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Button, TextField, Alert, CircularProgress, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Tooltip } from '@mui/material';
import { ExpandMore, ExpandLess, CheckCircle, Cancel, Download, Edit, Visibility, FiberManualRecord } from '@mui/icons-material';
import { db, auth } from '../../firebaseconfig';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useCompany } from '../../contextos/company-context';
import { AuthContext } from '../../context/AuthContext';
import { FormControl, InputLabel } from '@mui/material';
import handleApproveOrReject from './handleApproveOrReject';
import RevisionDocumentoDialog from './RevisionDocumentoDialog';
import VistaDocumentoSubido from './VistaDocumentoSubido';

export default function AdminUploadedDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newExpirationDates, setNewExpirationDates] = useState({});
  const [adminComments, setAdminComments] = useState({});
  const [viewFileUrl, setViewFileUrl] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewFileName, setViewFileName] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showSemaphoreInfo, setShowSemaphoreInfo] = useState(false);
  const [dialogAccion, setDialogAccion] = useState(null); // { tipo: 'aprobar' | 'rechazar', doc }

  const { selectedCompanyId } = useCompany();
  const { user } = useContext(AuthContext);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortOption, setSortOption] = useState('expirationDateAsc');

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const docsQuery = selectedCompanyId
          ? query(collection(db, 'uploadedDocuments'), where('companyId', '==', selectedCompanyId))
          : collection(db, 'uploadedDocuments');

        const snapshot = await getDocs(docsQuery);
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesMap = {};
        companiesSnapshot.forEach(doc => {
          companiesMap[doc.id] = doc.data().name;
        });

        const loadedDocuments = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let status = data.status;
          let adminComment = data.adminComment || '';
        
          // Obtener documento requerido si existe
          let requiredDoc = null;
          if (data.requiredDocumentId) {
            const requiredDocSnap = await getDoc(doc(db, 'requiredDocuments', data.requiredDocumentId));
            requiredDoc = requiredDocSnap.exists() ? requiredDocSnap.data() : null;
          }
        
          // Calcular días restantes
          let daysRemaining = null;
          if (data.expirationDate) {
            const today = new Date();
            let expiryDate;
            
            if (typeof data.expirationDate === 'string') {
              expiryDate = new Date(data.expirationDate);
            } else if (data.expirationDate.seconds) {
              expiryDate = new Date(data.expirationDate.seconds * 1000);
            }
        
            if (expiryDate) {
              const diffTime = expiryDate - today;
              daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }
        
          // Si está aprobado pero faltan <= 20 días, volver a Pendiente
          if (status === 'Aprobado' && daysRemaining !== null && daysRemaining <= 20) {
            status = 'Pendiente de revisión';
            adminComment = `Revisión requerida (${daysRemaining} días restantes)`;
        
            if (data.status !== status) {
              await updateDoc(docSnap.ref, {
                status,
                adminComment,
              });
            }
          }
        
          return {
            id: docSnap.id,
            ...data,
            status,
            adminComment,
            daysRemaining,
            requiredDocument: requiredDoc,
            companyName: companiesMap[data.companyId] || data.companyId
          };
        }));
        
        // Ordenar documentos: primero pendientes, luego aprobados por fecha de vencimiento
        const sortedDocuments = loadedDocuments.sort((a, b) => {
          // Primero los pendientes
          if (a.status === 'Pendiente de revisión' && b.status !== 'Pendiente de revisión') return -1;
          if (a.status !== 'Pendiente de revisión' && b.status === 'Pendiente de revisión') return 1;
          
          // Si ambos son aprobados, ordenar por días restantes (menor a mayor)
          if (a.status === 'Aprobado' && b.status === 'Aprobado') {
            // Si alguno no tiene días restantes, ponerlo al final
            if (a.daysRemaining === null && b.daysRemaining !== null) return 1;
            if (a.daysRemaining !== null && b.daysRemaining === null) return -1;
            if (a.daysRemaining === null && b.daysRemaining === null) return 0;
            
            // Ordenar por días restantes (menor a mayor)
            return a.daysRemaining - b.daysRemaining;
          }
          
          // Si uno es aprobado y otro rechazado, mostrar aprobados primero
          if (a.status === 'Aprobado' && b.status === 'Rechazado') return -1;
          if (a.status === 'Rechazado' && b.status === 'Aprobado') return 1;
          
          // Para otros casos, mantener el orden original
          return 0;
        });

        setDocuments(sortedDocuments);
      } catch (err) {
        console.error(err);
        setError('Error al cargar documentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedCompanyId]);

  const handleExpandRow = (id) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  const handleDownload = async (url, filename) => {
    if (!url) {
      setToastMessage('No se encontró el archivo para descargar.');
      setToastOpen(true);
      return;
    }
  
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('No se pudo descargar el archivo');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'documento';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
  
      setToastMessage('Descarga iniciada ');
      setToastOpen(true);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      setToastMessage('Error al descargar el archivo.');
      setToastOpen(true);
    }
  };


  const handleViewFile = (url, filename) => {
    setViewFileUrl(url);
    setViewFileName(filename);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setViewFileUrl('');
    setViewFileName('');
    setOpenDialog(false);
  };

  const handleApproveOrReject = async (docId, tipo) => {
    const comment = adminComments[docId];
    const expirationDate = newExpirationDates[docId];
    const adminEmail = user?.email || auth.currentUser?.email || 'Administrador';
  
    if (tipo === 'rechazar' && !comment) {
      setToastMessage('Debe ingresar un comentario para rechazar.');
      setToastOpen(true);
      return;
    }
  
    if (tipo === 'aprobar' && !expirationDate) {
      setToastMessage('Debe ingresar una fecha de vencimiento para aprobar.');
      setToastOpen(true);
      return;
    }
  
    try {
      const dataToUpdate = {
        status: tipo === 'aprobar' ? 'Aprobado' : 'Rechazado',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminEmail,
      };
  
      if (tipo === 'rechazar') dataToUpdate.adminComment = comment;
      if (tipo === 'aprobar') dataToUpdate.expirationDate = expirationDate;
  
      await updateDoc(doc(db, 'uploadedDocuments', docId), dataToUpdate);
  
      // Actualizar lista local
      setDocuments(prevDocs =>
        prevDocs.map(doc =>
          doc.id === docId
            ? { ...doc, ...dataToUpdate, reviewedAt: new Date() }
            : doc
        )
      );
  
      setExpandedRow(null);
      setDialogAccion(null);
      setToastMessage(`Documento ${tipo === 'aprobar' ? 'aprobado' : 'rechazado'} correctamente`);
      setToastOpen(true);
    } catch (error) {
      console.error(`Error al ${tipo} documento:`, error);
      setToastMessage(`Error al ${tipo} documento`);
      setToastOpen(true);
    }
  };
  

  const formatDate = (date) => {
    if (!date) return '-';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return '-';
  };
  
  // Función para determinar el color del semáforo según los días restantes
  const getSemaphoreColor = (days) => {
    if (days === null) return 'default';
    if (days <= 0) return 'error'; // Rojo - Vencido
    if (days <= 7) return 'warning'; // Amarillo - Próximo a vencer
    return 'success'; // Verde - En tiempo
  };
  
  // Función para obtener el texto del estado de vencimiento
  const getExpiryStatusText = (days) => {
    if (days === null) return '';
    if (days <= 0) return 'Vencido';
    if (days <= 7) return 'Próximo a vencer';
    return 'Vigente';
  };

  

  if (loading) return <Box textAlign="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  const filteredAndSortedDocuments = documents
  .filter(doc => {
    if (filterStatus === 'todos') return true;
    return doc.status === filterStatus;
  })
  .sort((a, b) => {
    if (sortOption === 'uploadedAtAsc') {
      return new Date(a.uploadedAt?.seconds * 1000) - new Date(b.uploadedAt?.seconds * 1000);
    }
    if (sortOption === 'uploadedAtDesc') {
      return new Date(b.uploadedAt?.seconds * 1000) - new Date(a.uploadedAt?.seconds * 1000);
    }
    if (sortOption === 'expirationDateAsc') {
      const getDays = (doc) => {
        if (!doc.expirationDate) return Infinity;
        const date = new Date(doc.expirationDate);
        const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
      };
      return getDays(a) - getDays(b);
    }
    
    if (sortOption === 'expirationDateDesc') {
      return new Date(b.expirationDate) - new Date(a.expirationDate);
    }
    return 0;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Documentos Subidos</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setShowSemaphoreInfo(!showSemaphoreInfo)}
        >
          {showSemaphoreInfo ? 'Ocultar leyenda' : 'Ver leyenda de semáforo'}
        </Button>
      </Box>
      
      {showSemaphoreInfo && (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle1">Leyenda del semáforo de vencimiento:</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiberManualRecord color="error" sx={{ mr: 1 }} />
              <Typography variant="body2">Vencido (0 días o menos)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiberManualRecord color="warning" sx={{ mr: 1 }} />
              <Typography variant="body2">Próximo a vencer (7 días o menos)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiberManualRecord color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Vigente (más de 7 días)</Typography>
            </Box>
          </Box>
        </Paper>
      )}
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, maxWidth: 250 }}>
  <FormControl size="small" fullWidth>
    <InputLabel>Filtrar por estado</InputLabel>
    <Select
      label="Filtrar por estado"
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
    >
      <MenuItem value="todos">Todos</MenuItem>
      <MenuItem value="Pendiente de revisión">Pendientes</MenuItem>
      <MenuItem value="Aprobado">Aprobados</MenuItem>
      <MenuItem value="Rechazado">Rechazados</MenuItem>
    </Select>
  </FormControl>

  <FormControl size="small" fullWidth>
    <InputLabel>Ordenar por</InputLabel>
    <Select
      label="Ordenar por"
      value={sortOption}
      onChange={(e) => setSortOption(e.target.value)}
    >
      <MenuItem value="uploadedAtDesc">Subido (más reciente)</MenuItem>
      <MenuItem value="uploadedAtAsc">Subido (más antiguo)</MenuItem>
      <MenuItem value="expirationDateAsc">Vencimiento (próximo)</MenuItem>
      <MenuItem value="expirationDateDesc">Vencimiento (lejano)</MenuItem>
    </Select>
  </FormControl>
</Box>




      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Empresa</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Subido</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {filteredAndSortedDocuments.map((doc) => (
              <React.Fragment key={doc.id}>
                <TableRow>
                  <TableCell>{doc.companyName}</TableCell>
                  <TableCell>{doc.documentName || 'Sin nombre'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Chip
                        label={doc.status || 'Pendiente'}
                        color={doc.status === 'Aprobado' ? 'success' : doc.status === 'Rechazado' ? 'error' : 'warning'}
                        size="small"
                      />
                      {doc.reviewedBy && (
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          Por: {doc.reviewedBy}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell>
                    {doc.status === 'Aprobado' && doc.daysRemaining !== null ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {formatDate(doc.expirationDate)}
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                          <FiberManualRecord 
                            sx={{ 
                              color: theme => theme.palette[getSemaphoreColor(doc.daysRemaining)].main,
                              fontSize: '1rem',
                              mr: 0.5
                            }} 
                          />
                          <Chip 
                            size="small" 
                            label={`${doc.daysRemaining} días - ${getExpiryStatusText(doc.daysRemaining)}`}
                            color={getSemaphoreColor(doc.daysRemaining)}
                          />
                        </Box>
                      </Box>
                    ) : (
                      formatDate(doc.expirationDate)
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton onClick={() => handleExpandRow(doc.id)}>
                          {expandedRow === doc.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ padding: 0 }} colSpan={6}>
                    
                    
                  <Collapse in={expandedRow === doc.id} timeout="auto" unmountOnExit>
  <Box
    sx={{
      border: '2px solid #000',
      borderRadius: 2,
      mx: 1,
      my: 2,
      p: 2,
      backgroundColor: '#fff',
      color: '#000',
      boxShadow: 2,
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'center' }}>
        {doc.documentName || 'Documento sin nombre'}
      </Typography>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
        {doc.companyName}
      </Typography>
    </Box>

    <VistaDocumentoSubido
  fileURL={doc.fileURL}
  fileName={doc.fileName}
  uploaderName={doc.uploadedBy}
  uploaderComment={doc.comment} // ✅ CORREGIDO
  exampleURL={doc.requiredDocument?.exampleImage}
  onDownload={() => handleDownload(doc.fileURL, doc.fileName)}
/>

    {!dialogAccion && (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
    <Button
      variant="contained"
      color="success"
      startIcon={<CheckCircle />}
      onClick={() => setDialogAccion({ tipo: 'aprobar', doc })}
    >
      Aprobar
    </Button>
    <Button
      variant="contained"
      color="error"
      startIcon={<Cancel />}
      onClick={() => setDialogAccion({ tipo: 'rechazar', doc })}
    >
      Rechazar
    </Button>
  </Box>
)}

    {/* Lugar donde irán los botones Aprobar / Rechazar con lógica personalizada */}
    {/* Esto lo armamos en el siguiente paso según lo que definas */}
  </Box>
</Collapse>

                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Vista Previa del Archivo</DialogTitle>
          <DialogContent>
            {viewFileUrl && (
              <iframe src={viewFileUrl} title="Vista previa" style={{ width: '100%', height: '80vh', border: 'none' }} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">Cerrar</Button>
            <Button onClick={() => handleDownload(viewFileUrl, viewFileName)} startIcon={<Download />}>Descargar</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={toastOpen}
          autoHideDuration={3000}
          onClose={() => setToastOpen(false)}
          message={toastMessage || "Operación completada con éxito "}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
        <RevisionDocumentoDialog
          open={!!dialogAccion}
          tipo={dialogAccion?.tipo}
          doc={dialogAccion?.doc}
          onClose={() => setDialogAccion(null)}
          onDownload={handleDownload}
          onViewFile={handleViewFile}
          expirationDate={newExpirationDates[dialogAccion?.doc?.id] || ''}
          setExpirationDate={(val) =>
            setNewExpirationDates(prev => ({ ...prev, [dialogAccion.doc.id]: val }))
          }
          comment={adminComments[dialogAccion?.doc?.id] || ''}
          setComment={(val) =>
            setAdminComments(prev => ({ ...prev, [dialogAccion.doc.id]: val }))
          }
          onConfirm={() => {
            handleApproveOrReject(dialogAccion.doc.id, dialogAccion.tipo);
            setDialogAccion(null);
          }}          
        />
      </Box>
    );
  }