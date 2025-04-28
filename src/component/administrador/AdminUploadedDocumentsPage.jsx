// Archivo: AdminUploadedDocumentsPage.jsx mejorado FINAL CON VISTA EXPANDIDA Y DESCARGA

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Collapse, Button, TextField,
  Alert, CircularProgress, Grid, Chip, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { ExpandMore, ExpandLess, CheckCircle, Cancel, Download } from '@mui/icons-material';
import { db } from '../../firebaseconfig';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useCompany } from '../../contexts/company-context';

export default function AdminUploadedDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newExpirationDates, setNewExpirationDates] = useState({});
  const [adminComments, setAdminComments] = useState({});
  const [viewFileUrl, setViewFileUrl] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const { selectedCompanyId } = useCompany();

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const q = selectedCompanyId
          ? query(collection(db, 'uploadedDocuments'), where('companyId', '==', selectedCompanyId))
          : collection(db, 'uploadedDocuments');

        const snapshot = await getDocs(q);

        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesMap = {};
        companiesSnapshot.forEach(doc => {
          companiesMap[doc.id] = doc.data().name;
        });

        const docs = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let requiredDoc = null;
          if (data.requiredDocumentId) {
            const requiredDocSnap = await getDoc(doc(db, 'requiredDocuments', data.requiredDocumentId));
            requiredDoc = requiredDocSnap.exists() ? requiredDocSnap.data() : null;
          }
          return {
            id: docSnap.id,
            ...data,
            companyName: companiesMap[data.companyId] || data.companyId,
            requiredDocument: requiredDoc,
          };
        }));

        setDocuments(docs);
      } catch (err) {
        setError('Error al cargar documentos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedCompanyId]);

  const handleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  const handleDownload = (url, filename, fileId) => {
    const a = document.createElement('a');
  
    if (fileId) {
      // Si tengo fileId, uso la API de Backblaze para forzar descarga
      a.href = `https://f005.backblazeb2.com/b2api/v2/b2_download_file_by_id?fileId=${fileId}&response-content-disposition=attachment`;
    } else {
      // Si no tengo fileId, uso la URL pública como antes
      a.href = `${url}?response-content-disposition=attachment`;
    }
  
    a.download = filename || 'documento';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleViewFile = (url) => {
    setViewFileUrl(url);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setViewFileUrl('');
    setOpenDialog(false);
  };

  const handleApprove = async (docId) => {
    const expirationDate = newExpirationDates[docId];
    if (!expirationDate) {
      alert('Debe ingresar una fecha de vencimiento para aprobar.');
      return;
    }

    try {
      await updateDoc(doc(db, 'uploadedDocuments', docId), {
        status: 'Aprobado',
        expirationDate: expirationDate,
        reviewedAt: serverTimestamp()
      });
      setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, status: 'Aprobado', expirationDate } : doc));
      setExpandedRow(null);
    } catch (error) {
      console.error('Error al aprobar documento:', error);
    }
  };

  const handleReject = async (docId) => {
    const comment = adminComments[docId];
    if (!comment) {
      alert('Debe ingresar un comentario para rechazar.');
      return;
    }

    try {
      await updateDoc(doc(db, 'uploadedDocuments', docId), {
        status: 'Rechazado',
        adminComment: comment,
        reviewedAt: serverTimestamp()
      });
      setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, status: 'Rechazado', adminComment: comment } : doc));
      setExpandedRow(null);
    } catch (error) {
      console.error('Error al rechazar documento:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return '-';
  };

  if (loading) return <Box textAlign="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Documentos Subidos</Typography>
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
            {documents.map((doc) => (
              <React.Fragment key={doc.id}>
                <TableRow>
                  <TableCell>{doc.companyName}</TableCell>
                  <TableCell>{doc.documentName || 'Sin nombre'}</TableCell>
                  <TableCell>
                    <Chip label={doc.status || 'Pendiente'} 
                      color={doc.status === 'Aprobado' ? 'success' : doc.status === 'Rechazado' ? 'error' : 'warning'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell>{formatDate(doc.expirationDate)}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleExpandRow(doc.id)}>
                      {expandedRow === doc.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expandedRow === doc.id} timeout="auto" unmountOnExit>
                      <Box margin={2}>
                        <Typography variant="h6">Detalles del Documento</Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Archivo Subido:</Typography>
                            {doc.fileURL ? (
                              <>
                                <Button onClick={() => handleViewFile(doc.fileURL)}>Ver Archivo</Button>
                                <Button 
onClick={() => handleDownload(doc.fileURL, doc.fileName || 'documento', doc.fileId)}
startIcon={<Download />}
                                >
                                  Descargar
                                </Button>
                              </>
                            ) : (
                              <Typography variant="body2">No disponible</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Archivo de Ejemplo:</Typography>
                            {doc.requiredDocument?.examplefileURL ? (
                              <>
                                <Button onClick={() => handleViewFile(doc.requiredDocument.exampleFileUrl)}>Ver Archivo</Button>
                                <Button 
                                  onClick={() => handleDownload(
                                    doc.requiredDocument.exampleFileUrl, 
                                    doc.requiredDocument.exampleFileName || 'ejemplo', 
                                    doc.requiredDocument.exampleFileId
                                  )}
                                  startIcon={<Download />}
                                >
                                  Descargar
                                </Button>
                              </>
                            ) : (
                              <Typography variant="body2">No disponible</Typography>
                            )}
                          </Grid>
                        </Grid>
                        {doc.status === 'Pendiente de revisión' && (
                          <Box mt={2}>
                            <Typography variant="h6">Acciones</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  type="date"
                                  label="Nueva Fecha de Vencimiento"
                                  InputLabelProps={{ shrink: true }}
                                  value={newExpirationDates[doc.id] || ''}
                                  onChange={(e) => setNewExpirationDates(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  multiline
                                  label="Comentario (obligatorio si rechaza)"
                                  value={adminComments[doc.id] || ''}
                                  onChange={(e) => setAdminComments(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleApprove(doc.id)}
                                >
                                  Aprobar Documento
                                </Button>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  color="error"
                                  startIcon={<Cancel />}
                                  onClick={() => handleReject(doc.id)}
                                >
                                  Rechazar Documento
                                </Button>
                              </Grid>
                            </Grid>
                          </Box>
                        )}
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
      </Dialog>
    </Box>
  );
}