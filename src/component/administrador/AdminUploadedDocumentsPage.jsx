import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseconfig';
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useCompany } from '../../contexts/company-context';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  MenuItem,
  Menu,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

const DocumentItem = React.memo(({ document, onView, onApprove, onReject, onOpenMenu }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Aprobado': return 'success';
      case 'Rechazado': return 'error';
      case 'Pendiente de revisión': return 'warning';
      default: return 'default';
    }
  };

  return (
    <ListItem 
      divider 
      sx={{
        borderLeft: `4px solid ${document.status === 'Aprobado' ? '#4caf50' : 
                             document.status === 'Rechazado' ? '#f44336' : 
                             '#ff9800'}`,
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
      }}
    >
      <ListItemIcon>
        <DescriptionIcon color="primary" />
      </ListItemIcon>
      <ListItemText 
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1">{document.documentName || 'Sin nombre'}</Typography>
            <Chip 
              size="small" 
              label={document.status || 'Pendiente'}
              color={getStatusColor(document.status)}
              sx={{ ml: 1 }}
            />
          </Box>
        } 
        secondary={
          <>
            <Typography variant="body2" component="span">
              {document.entityType}: {document.entityName}
            </Typography>
            <br />
            <Typography variant="body2" component="span">
              Subido: {document.uploadedAt ? new Date(document.uploadedAt.seconds * 1000).toLocaleString() : 'Fecha desconocida'}
            </Typography>
            {document.reviewedAt && (
              <>
                <br />
                <Typography variant="body2" component="span">
                  Revisado: {new Date(document.reviewedAt.seconds * 1000).toLocaleString()}
                </Typography>
              </>
            )}
            {document.comment && (
              <>
                <br />
                <Typography variant="body2" component="span">
                  Comentario: {document.comment}
                </Typography>
              </>
            )}
            {document.adminComment && (
              <>
                <br />
                <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                  Comentario admin: {document.adminComment}
                </Typography>
              </>
            )}
          </>
        } 
      />
      <ListItemSecondaryAction>
        {document.status === 'Pendiente de revisión' && (
          <>
            <Tooltip title="Aprobar documento">
              <IconButton edge="end" color="success" onClick={() => onApprove(document.id)}>
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rechazar documento">
              <IconButton edge="end" color="error" onClick={() => onReject(document.id)}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="Ver documento">
          <IconButton edge="end" color="primary" onClick={() => onView(document.fileURL || document.fileUrl, document.documentName)}>
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Descargar documento">
          <IconButton edge="end" color="primary" component="a" href={document.fileURL || document.fileUrl} target="_blank" download>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Más opciones">
          <IconButton edge="end" onClick={(event) => onOpenMenu(event, document.id)}>
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
});

export default function AdminUploadedDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState('');
  const [currentDocName, setCurrentDocName] = useState('');
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [commentDialogMode, setCommentDialogMode] = useState('approve'); // 'approve' or 'reject'
  const [currentDocId, setCurrentDocId] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuDocId, setMenuDocId] = useState(null);
  
  const { selectedCompanyId } = useCompany();

  useEffect(() => {
    let isMounted = true;
    
    const fetchDocuments = async () => {
      if (!selectedCompanyId) {
        if (isMounted) {
          setDocuments([]);
          setFilteredDocuments([]);
          setLoading(false);
        }
        return;
      }
      
      if (isMounted) setLoading(true);
      
      try {
        console.log('Buscando documentos para la empresa:', selectedCompanyId);
        const q = query(
          collection(db, 'uploadedDocuments'),
          where('companyId', '==', selectedCompanyId)
        );
        const snapshot = await getDocs(q);
        
        if (!isMounted) return;
        
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Documento encontrado:', data);
          return { 
            id: doc.id, 
            ...data,
            key: `doc-${doc.id}`
          };
        });
        
        // Ordenar por fecha de subida (más recientes primero)
        list.sort((a, b) => {
          if (!a.uploadedAt || !b.uploadedAt) return 0;
          return b.uploadedAt.seconds - a.uploadedAt.seconds;
        });
        
        console.log('Total documentos encontrados:', list.length);
        setDocuments(list);
        setFilteredDocuments(list);
      } catch (err) {
        console.error('Error al cargar documentos:', err);
        if (isMounted) setError(`Error al cargar los documentos: ${err.message}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchDocuments();
    
    return () => {
      isMounted = false;
    };
  }, [selectedCompanyId]);
  
  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    if (!documents.length) {
      setFilteredDocuments([]);
      return;
    }
    
    let filtered = [...documents];
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }
    
    // Filtrar por tipo de entidad
    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.entityType === entityTypeFilter);
    }
    
    setFilteredDocuments(filtered);
  }, [documents, statusFilter, entityTypeFilter]);

  const handleViewDocument = (url, name) => {
    if (!url) return;
    setCurrentDocUrl(url);
    setCurrentDocName(name || 'Documento');
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    // Limpiamos los valores después de cerrar el diálogo
    setTimeout(() => {
      setCurrentDocUrl('');
      setCurrentDocName('');
    }, 300);
  };
  
  const handleOpenMenu = (event, docId) => {
    setAnchorEl(event.currentTarget);
    setMenuDocId(docId);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuDocId(null);
  };
  
  const handleApproveDocument = (docId) => {
    setCurrentDocId(docId);
    setCommentDialogMode('approve');
    setAdminComment('');
    setOpenCommentDialog(true);
    handleCloseMenu();
  };
  
  const handleRejectDocument = (docId) => {
    setCurrentDocId(docId);
    setCommentDialogMode('reject');
    setAdminComment('');
    setOpenCommentDialog(true);
    handleCloseMenu();
  };
  
  const handleSubmitReview = async () => {
    if (!currentDocId) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Actualizando documento:', currentDocId, 'Estado:', commentDialogMode === 'approve' ? 'Aprobado' : 'Rechazado');
      const docRef = doc(db, 'uploadedDocuments', currentDocId);
      await updateDoc(docRef, {
        status: commentDialogMode === 'approve' ? 'Aprobado' : 'Rechazado',
        adminComment: adminComment.trim() || null,
        reviewedAt: serverTimestamp()
      });
      
      // Actualizar la lista local
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === currentDocId 
            ? { 
                ...doc, 
                status: commentDialogMode === 'approve' ? 'Aprobado' : 'Rechazado',
                adminComment: adminComment.trim() || null,
                reviewedAt: { seconds: Date.now() / 1000 }
              } 
            : doc
        )
      );
      
      setSuccess(
        `Documento ${commentDialogMode === 'approve' ? 'aprobado' : 'rechazado'} correctamente.`
      );
      
      // Limpiar después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(`Error al ${commentDialogMode === 'approve' ? 'aprobar' : 'rechazar'} documento:`, err);
      setError(`Error al ${commentDialogMode === 'approve' ? 'aprobar' : 'rechazar'} el documento.`);
    } finally {
      setLoading(false);
      setOpenCommentDialog(false);
      setCurrentDocId('');
      setAdminComment('');
    }
  };
  
  const handleCancelReview = () => {
    setOpenCommentDialog(false);
    setCurrentDocId('');
    setAdminComment('');
  };
  
  const handleChangeStatusFilter = (event) => {
    setStatusFilter(event.target.value);
  };
  
  const handleChangeEntityTypeFilter = (event) => {
    setEntityTypeFilter(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Documentos Subidos
      </Typography>

      {!selectedCompanyId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Selecciona una empresa para ver sus documentos subidos.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {selectedCompanyId && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Estado"
                    onChange={handleChangeStatusFilter}
                  >
                    <MenuItem value="all">Todos los estados</MenuItem>
                    <MenuItem value="Pendiente de revisión">Pendientes de revisión</MenuItem>
                    <MenuItem value="Aprobado">Aprobados</MenuItem>
                    <MenuItem value="Rechazado">Rechazados</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={entityTypeFilter}
                    label="Tipo"
                    onChange={handleChangeEntityTypeFilter}
                  >
                    <MenuItem value="all">Todos los tipos</MenuItem>
                    <MenuItem value="Empresa">Empresa</MenuItem>
                    <MenuItem value="Personal">Personal</MenuItem>
                    <MenuItem value="Vehículo">Vehículo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  Mostrando {filteredDocuments.length} de {documents.length} documentos
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredDocuments.length === 0 && selectedCompanyId ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No hay documentos que coincidan con los filtros seleccionados.
          </Typography>
        </Paper>
      ) : filteredDocuments.length > 0 ? (
        <Paper sx={{ mt: 2 }}>
          <List>
            {filteredDocuments.map((doc) => (
              <DocumentItem 
                key={doc.key || doc.id} 
                document={doc} 
                onView={handleViewDocument}
                onApprove={handleApproveDocument}
                onReject={handleRejectDocument}
                onOpenMenu={handleOpenMenu}
              />
            ))}
          </List>
        </Paper>
      ) : null}

      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 1 }} />
            {currentDocName}
          </Box>
          <Box>
            {currentDocUrl && (
              <IconButton 
                color="primary" 
                component="a" 
                href={currentDocUrl} 
                target="_blank" 
                download
                sx={{ mr: 1 }}
              >
                <DownloadIcon />
              </IconButton>
            )}
            <IconButton onClick={handleCloseViewDialog}>
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '75vh' }}>
          {currentDocUrl && (
            <Box sx={{ width: '100%', height: '100%' }}>
              <iframe
                src={currentDocUrl}
                title={currentDocName}
                style={{ width: '100%', height: '100%', border: 'none' }}
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para comentarios de aprobación/rechazo */}
      <Dialog 
        open={openCommentDialog} 
        onClose={handleCancelReview}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {commentDialogMode === 'approve' ? 'Aprobar Documento' : 'Rechazar Documento'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comentario (opcional)"
            fullWidth
            multiline
            rows={4}
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            variant="outlined"
            placeholder={commentDialogMode === 'approve' 
              ? 'Añade un comentario opcional para la aprobación...'
              : 'Explica el motivo del rechazo...'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReview} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitReview} 
            color={commentDialogMode === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {commentDialogMode === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Menú de opciones para cada documento */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleApproveDocument(menuDocId)}>
          <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
          Aprobar
        </MenuItem>
        <MenuItem onClick={() => handleRejectDocument(menuDocId)}>
          <CloseIcon fontSize="small" color="error" sx={{ mr: 1 }} />
          Rechazar
        </MenuItem>
      </Menu>
    </Box>
  );
}
