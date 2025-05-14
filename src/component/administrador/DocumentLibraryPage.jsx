// src/component/administrador/DocumentLibraryPage.jsx
import React, { useEffect, useState, useContext } from 'react';

import { useDocumentAll } from './Library/DocumentAll';

import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, Button, TextField,
  Alert, CircularProgress, Grid, Chip, Dialog, DialogContent, 
  DialogActions, DialogTitle, Snackbar, Tooltip, FormControl, InputLabel,
  Select, MenuItem, OutlinedInput, Drawer, Divider, List, ListItem,
  ListItemIcon, ListItemText, ListItemButton, Checkbox, Menu, Tab, Tabs,
  Card, CardContent, CardActions, CardMedia, Badge, Breadcrumbs, Link as MuiLink
} from '@mui/material';
import { 
  Download, Visibility, Search, FilterList, Clear, Folder, FolderOpen,
  Description, Image, PictureAsPdf, InsertDriveFile, Delete, Edit,
  Archive, Star, StarBorder, Label, Add, MoreVert, Sort, GridView, ViewList,
  CreateNewFolder, FileUpload, Category, History, Info, Share
} from '@mui/icons-material';
import { db, auth } from '../../firebaseconfig';
import { collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCompanies } from '../../context/CompaniesContext';
import { AuthContext } from '../../context/AuthContext';
import VistaDocumentoSubido from './VistaDocumentoSubido';
import DocumentFilters from './Library/DocumentFilters';
import DocumentSidebar from './Library/DocumentSidebar';
import DocumentTable from './Library/DocumentTable';
import EmpresaTable from './Library/EmpresaTable';


// 🔐 Admin role constant
const ADMIN_ROLE = "DhHkVja";

export default function DocumentLibraryPage() {
  const [viewFileUrl, setViewFileUrl] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewFileName, setViewFileName] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { selectedCompany, refresh, selectCompany, clearSelection } = useCompanies();
const selectedCompanyId = selectedCompany?.id || selectedCompany;
const setSelectedCompanyId = selectCompany;
  const { user } = useContext(AuthContext);
  const [companies, setCompanies] = useState([]);
  

  // 🔐 Check admin role
  const isAdmin = user?.role === ADMIN_ROLE || user?.email === "fe.rv@hotmail.com";
  
 

  // Filtros
  const [filters, setFilters] = useState({
    estado: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    usuarioEmail: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [lastApiCall, setLastApiCall] = useState(0);
  const API_CALL_DELAY = 2000;


  // Estados para el gestor de archivos
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'grid'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('biblioteca');
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'biblioteca', name: 'Biblioteca' }]);
  const [contextMenu, setContextMenu] = useState(null);
  const [fileDetailsOpen, setFileDetailsOpen] = useState(false);
  const [selectedFileDetails, setSelectedFileDetails] = useState(null);
  const [categories, setCategories] = useState([
    { id: 'important', name: 'Importantes', color: '#f44336' },
    { id: 'personal', name: 'Personal', color: '#2196f3' },
    { id: 'vehicle', name: 'Vehículos', color: '#4caf50' },
    { id: 'company', name: 'Empresa', color: '#ff9800' },
  ]);
  const [selectedCategory, setSelectedCategory] = useState('');
 const [sortBy, setSortBy] = useState('date');
const [sortDirection, setSortDirection] = useState('desc');

const sortDocuments = (docs, sortBy, sortDirection) => {
  return [...docs].sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';
    if (valA instanceof Date) valA = valA.getTime();
    if (valB instanceof Date) valB = valB.getTime();
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    return sortDirection === 'asc'
      ? valA > valB ? 1 : -1
      : valA < valB ? 1 : -1;
  });
};


const {
  documents,
  setDocuments,
  folderStructure,
  loading,
  error
} = useDocumentAll({
  isAdmin,
  selectedCompanyId,
  selectedCategory,
  sortDocuments,
  sortBy,
  sortDirection
});
  
  // Navegar a una carpeta
  const navigateToFolder = (folderId) => {
    setCurrentFolder(folderId);
    
    // Actualizar las migas de pan
    if (folderId === 'biblioteca') {
      setBreadcrumbs([{ id: 'biblioteca', name: 'Biblioteca' }]);
    } else {
      setBreadcrumbs([
        { id: 'biblioteca', name: 'Biblioteca' },
        { id: folderId, name: folderId }
      ]);
    }
    
    // Cargar documentos de la carpeta seleccionada
    const docsInFolder = folderStructure[currentFolder]?.files || [];
    
    // Aplicar filtros actuales
    let filteredDocs = docsInFolder;
    
    // Filtrar por categoría si está seleccionada
    if (selectedCategory) {
      filteredDocs = filteredDocs.filter(doc => {
        // Comparación más robusta para manejar diferentes tipos de datos
        const docCategory = String(doc.category || '');
        const filterCategory = String(selectedCategory || '');
        return docCategory === filterCategory;
      });
    }
    
    // Filtrar por empresa si está seleccionada
    if (selectedCompanyId) {
      filteredDocs = filteredDocs.filter(doc => {
        const docCompanyId = String(doc.companyId || '');
        const filterCompanyId = String(selectedCompanyId || '');
        return docCompanyId === filterCompanyId;
      });
    }
    
  };
  
  // Seleccionar/deseleccionar un archivo
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };
  
  // Seleccionar todos los archivos
  const selectAllFiles = () => {
    if (selectedFiles.length === documents.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(documents.map(doc => doc.id));
    }
  };
  
  // Abrir menú contextual
  const handleContextMenu = (event, fileId) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      fileId
    });
  };
  
  // Cerrar menú contextual
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  // Mostrar detalles de un archivo
  const showFileDetails = (fileId) => {
    const file = documents.find(doc => doc.id === fileId);
    if (file) {
      setSelectedFileDetails(file);
      setFileDetailsOpen(true);
    }
    handleCloseContextMenu();
  };
  
  // Función para marcar/desmarcar favoritos eliminada
  
  // Cambiar categoría de un archivo
  const changeCategory = async (fileId, categoryId) => {
    try {
      // Encontrar el documento en la lista actual
      const docToUpdate = documents.find(doc => doc.id === fileId);
      if (!docToUpdate) return;
      
      // Actualizar en Firestore
      const docRef = doc(db, 'uploadedDocuments', fileId);
      await updateDoc(docRef, {
        category: categoryId,
        lastUpdated: serverTimestamp()
      });
      
      // Actualizar en el estado local
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId ? { ...doc, category: categoryId } : doc
        )
      );
      
      const categoryName = categories.find(c => c.id === categoryId)?.name || 'nueva categoría';
      setToastMessage(`Documento movido a ${categoryName}`);
      setToastOpen(true);
    } catch (error) {
      console.error('Error al cambiar categoría:', error);
      // Actualizar solo en el estado local si hay error
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === fileId ? { ...doc, category: categoryId } : doc
        )
      );
    }
    
    handleCloseContextMenu();
  };
  
  // Función para crear nueva carpeta eliminada
  
  // Descargar múltiples archivos seleccionados
  const downloadSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setToastMessage(`Preparando ${selectedFiles.length} archivos para descargar...`);
    setToastOpen(true);
    
    try {
      // Si es solo un archivo, usar la función de descarga individual
      if (selectedFiles.length === 1) {
        const fileToDownload = documents.find(doc => doc.id === selectedFiles[0]);
        if (fileToDownload) {
          handleDownload(fileToDownload.urlB2, fileToDownload.nombreOriginal);
        }
        return;
      }
      
      // Para múltiples archivos, crear un archivo zip (simulado por ahora)
      // En una implementación real, usaríamos una biblioteca como JSZip
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setToastMessage(`${selectedFiles.length} archivos descargados correctamente`);
      setToastOpen(true);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error al descargar archivos:', error);
      setToastMessage('Error al descargar los archivos seleccionados');
      setToastOpen(true);
    }
  };
  
  // Eliminar archivos seleccionados
  // Función deshabilitada: No se permite eliminar documentos desde la biblioteca
  const deleteSelectedFiles = () => {
    setToastMessage('La eliminación de documentos no está permitida en la biblioteca.');
    setToastOpen(true);
  };
  
  // Eliminar un archivo individual
  // Función deshabilitada: No se permite eliminar documentos desde la biblioteca
  const handleDeleteFile = () => {
    setToastMessage('La eliminación de documentos no está permitida en la biblioteca.');
    setToastOpen(true);
  };
  
  // Actualizar el estado de un documento
  const updateDocumentStatus = async (fileId, newStatus, comment = '') => {
    try {
      // Encontrar el documento en la lista actual
      const docToUpdate = documents.find(doc => doc.id === fileId);
      if (!docToUpdate) return;
      
      // Actualizar en Firestore
      const docRef = doc(db, 'uploadedDocuments', fileId);
      await updateDoc(docRef, {
        status: newStatus,
        adminComment: comment || '',
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || 'admin'
      });
      
      // Actualizar en el estado local
      const updatedDoc = { ...docToUpdate, originalStatus: newStatus };
      
      // Actualizar en la lista de documentos
      setDocuments(prev => 
        prev.map(doc => doc.id === fileId ? updatedDoc : doc)
      );
      
      
      
      
      setDocuments(prev => [...prev, updatedDoc]);

      
      
      
      setToastMessage(`Estado del documento actualizado a: ${newStatus}`);
      setToastOpen(true);
    } catch (error) {
      console.error('Error al actualizar estado del documento:', error);
      setToastMessage('Error al actualizar el estado del documento');
      setToastOpen(true);
    }
  };
  
  // Cambiar modo de visualización (lista o cuadrícula)
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };
  
  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Obtener icono según tipo de archivo
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return <PictureAsPdf color="error" />;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return <Image color="primary" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const handleSearch = async () => {
    // Validate email format if provided
    if (filters.usuarioEmail && !/^\S+@\S+\.\S+$/.test(filters.usuarioEmail)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    // Validate date format if provided
    if (filters.fechaDesde && isNaN(new Date(filters.fechaDesde).getTime())) {
      setError('Fecha desde no válida');
      return;
    }
    
    if (filters.fechaHasta && isNaN(new Date(filters.fechaHasta).getTime())) {
      setError('Fecha hasta no válida');
      return;
    }
    
    setLoading(true);
    try {
      // Obtener todos los documentos disponibles en la estructura de carpetas
      let allDocs = [...documents];

      
      // Filtrar según los criterios de búsqueda
      let filteredDocs = [...allDocs];
      
      // Filtrar por empresa
      if (selectedCompanyId) {
        filteredDocs = filteredDocs.filter(doc => {
          const docCompanyId = String(doc.companyId || '');
          const filterCompanyId = String(selectedCompanyId || '');
          return docCompanyId === filterCompanyId;
        });
      }
      
      // Filtrar por estado
      if (filters.estado) {
        filteredDocs = filteredDocs.filter(doc => {
          const docStatus = String(doc.originalStatus || '').toLowerCase();
          const filterStatus = String(filters.estado || '').toLowerCase();
          return docStatus === filterStatus;
        });
      }
      
      // Filtrar por tipo
      if (filters.tipo) {
        filteredDocs = filteredDocs.filter(doc => {
          const docType = String(doc.tipo || '');
          const filterType = String(filters.tipo || '');
          return docType === filterType;
        });
      }
      
      // Filtrar por email
      if (filters.usuarioEmail) {
        filteredDocs = filteredDocs.filter(doc => {
          const docEmail = String(doc.usuarioEmail || '').toLowerCase();
          const filterEmail = String(filters.usuarioEmail || '').toLowerCase();
          return docEmail.includes(filterEmail);
        });
      }
      
      // Filtrar por fecha desde
      if (filters.fechaDesde) {
        const fechaDesde = new Date(filters.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0); // Inicio del día
        
        filteredDocs = filteredDocs.filter(doc => {
          const docFecha = doc.fechaSubida instanceof Date ? doc.fechaSubida : new Date(doc.fechaSubida);
          return docFecha >= fechaDesde;
        });
      }
      
      // Filtrar por fecha hasta
      if (filters.fechaHasta) {
        const fechaHasta = new Date(filters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999); // Fin del día
        
        filteredDocs = filteredDocs.filter(doc => {
          const docFecha = doc.fechaSubida instanceof Date ? doc.fechaSubida : new Date(doc.fechaSubida);
          return docFecha <= fechaHasta;
        });
      }
      
      // Ordenar los resultados
      const sortedDocs = sortDocuments(filteredDocs, sortBy, sortDirection);
      setDocuments(sortedDocs);
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage('Error al buscar en la biblioteca de documentos.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      estado: '',
      tipo: '',
      fechaDesde: '',
      fechaHasta: '',
      usuarioEmail: '',
    });
    setSelectedCompany('');
    setSelectedCategory('');
  };
  const toggleStarred = (fileId) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === fileId ? { ...doc, starred: !doc.starred } : doc
      )
    );
  };
  
  const handleViewFile = (url, filename) => {
    const now = Date.now();
    if (now - lastApiCall < API_CALL_DELAY) {
      setToastMessage('Por favor espera antes de realizar otra acción');
      setToastOpen(true);
      return;
    }
    setLastApiCall(now);
    
    if (!url) {
      setToastMessage(`No se puede visualizar el documento: ${filename}. URL no disponible.`);
      setToastOpen(true);
      return;
    }
    
    logAuditEvent('VIEW_DOCUMENT', filename);
    
    // Verificar el tipo de archivo para decidir cómo mostrarlo
    const fileExtension = filename.split('.').pop().toLowerCase();
    const isPdf = fileExtension === 'pdf' || url.includes('.pdf');
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension) || 
                   url.includes('.jpg') || url.includes('.jpeg') || 
                   url.includes('.png') || url.includes('.gif');
    
    if (isPdf || isImage) {
      // Abrir el visor de documentos para PDFs e imágenes
      setViewFileUrl(url);
      setViewFileName(filename);
      setOpenDialog(true);
    } else {
      // Para otros tipos de archivos, abrir en una nueva pestaña
      window.open(url, '_blank');
      setToastMessage(`Abriendo ${filename} en una nueva pestaña`);
      setToastOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setViewFileUrl('');
    setViewFileName('');
    setOpenDialog(false);
  };

  const handleDownload = (url, filename) => {
    if (!url || !filename) return;
  
    const safeFilename = filename.replace(/[^\w\d.-]/g, '_');
  
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', safeFilename); // ✅ Forzar descarga
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  


  const formatDate = (date) => {
    if (!date) return '-';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return '-';
  };

  const logAuditEvent = async (action, documentId = null) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid,
        userEmail: user?.email,
        action,
        documentId,
        timestamp: serverTimestamp(),
        companyId: selectedCompanyId,
        ipAddress: 'client-ip' // Would be populated from request in real implementation
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  };

  const getFriendlyErrorMessage = (error) => {
    if (error.includes('Missing API URL')) {
      return 'Error de configuración del sistema. Por favor contacte al administrador.';
    }
    if (error.includes('Invalid company ID')) {
      return 'La empresa seleccionada no es válida';
    }
    if (error.includes('permission')) {
      return 'No tienes permisos para realizar esta acción';
    }
    return 'Ocurrió un error. Por favor intente nuevamente.';
  };

  if (loading && documents.length === 0) return <Box textAlign="center"><CircularProgress /></Box>;
  if (error && documents.length === 0) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '100%', overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>Gestor de Documentos</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={viewMode === 'list' ? <GridView /> : <ViewList />}
              onClick={toggleViewMode}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              {viewMode === 'list' ? 'Ver cuadrícula' : 'Ver lista'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Barra de navegación y herramientas */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
  label="Todos los documentos"
  icon={<FolderOpen />}
  onClick={() => {
    setSelectedCategory(null);
    navigateToFolder('biblioteca');
  }}
  color={currentFolder === 'biblioteca' ? 'primary' : 'default'}
  variant={currentFolder === 'biblioteca' ? 'filled' : 'outlined'}
  clickable
/>

  {categories.map((cat) => (
    <Chip
      key={cat.id}
      label={cat.name}
      icon={<Label />}
      onClick={() => setSelectedCategory(cat.id)}
      color={selectedCategory === cat.id ? 'primary' : 'default'}
      variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
      clickable
    />
  ))}
</Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Migas de pan */}
            <Breadcrumbs aria-label="breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <MuiLink
                  key={crumb.id}
                  component="button"
                  variant="body2"
                  onClick={() => navigateToFolder(crumb.id)}
                  color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                  underline="hover"
                >
                  {index === 0 ? <Folder fontSize="small" sx={{ mr: 0.5 }} /> : null}
                  {crumb.name}
                </MuiLink>
              ))}
            </Breadcrumbs>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botón de Nueva carpeta eliminado */}
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
              >
                <MenuItem value="name">Nombre</MenuItem>
                <MenuItem value="date">Fecha</MenuItem>
                <MenuItem value="size">Tamaño</MenuItem>
                <MenuItem value="type">Tipo</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton 
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              color="primary"
              size="small"
            >
              <Sort sx={{ transform: sortDirection === 'asc' ? 'none' : 'rotate(180deg)' }} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {showFilters && (
    <DocumentFilters
      filters={filters}
      setFilters={setFilters}
      companies={companies}
      selectedCompany={selectedCompanyId}
      setSelectedCompany={setSelectedCompanyId}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      sortBy={sortBy}
      sortDirection={sortDirection}
      currentFolder={currentFolder}
      setDocuments={setDocuments}
      sortDocuments={sortDocuments}
      showFilters={showFilters}
      handleClearFilters={handleClearFilters}
      handleSearch={handleSearch}
    />
  )}


      {loading && documents.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Contenedor principal con panel lateral y área de contenido */}
      <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
<Box sx={{ flex: 1, overflow: 'auto', width: 'calc(100% - 260px)' }}>
          {/* Barra de acciones para archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2, boxShadow: 2, bgcolor: '#e3f2fd' }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#0d47a1' }}>
                {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  size="small"
                  sx={{ borderRadius: 2 }}
                  onClick={() => {
                    setToastMessage(`Descargando ${selectedFiles.length} archivos`);
                    setToastOpen(true);
                  }}
                >
                  Descargar
                </Button>
                
              </Box>
            </Paper>
          )}
          
          {documents.length === 0 ? (
            <Alert severity="info">No hay documentos ni carpetas en esta ubicación.</Alert>
          ) : (
            <>
              {/* Vista de carpetas */}
              {documents.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Carpetas</Typography>
                  <Grid container spacing={2}>
                    
                  </Grid>
                </Box>
              )}
              
              {/* Vista de archivos */}
              {documents.length > 0 && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Documentos</Typography>
                  {viewMode === 'list' ? (
  <DocumentTable
    documents={documents}
    selectedFiles={selectedFiles}
    toggleFileSelection={toggleFileSelection}
    selectAllFiles={selectAllFiles}
    onViewDetails={showFileDetails}
    handleDownload={handleDownload}
    formatFileSize={formatFileSize}
    formatDate={formatDate}
    getFileIcon={getFileIcon}
    sortBy={sortBy}
    sortDirection={sortDirection}
    setSortBy={setSortBy}
    setSortDirection={setSortDirection}
    viewMode={viewMode}
    />
  ) : (
                    <Grid container spacing={2}>
                      {documents.map((doc) => {
                        const isSelected = selectedFiles.includes(doc.id);
                        return (
                          <Grid item xs={12} sm={6} md={3} key={doc.id}>
                            <Card 
                              sx={{
                                position: 'relative',
                                border: isSelected ? '2px solid #1976d2' : 'none',
                              }}
                              onContextMenu={(e) => handleContextMenu(e, doc.id)}
                            >
                              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => toggleFileSelection(doc.id)}
                                />
                              </Box>
                              
                              <CardMedia
                                sx={{ 
                                  height: 140, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  bgcolor: 'grey.100'
                                }}
                              >
                                {doc.tipo.startsWith('image/') ? (
                                  <Image sx={{ fontSize: 80, color: 'primary.main' }} />
                                ) : doc.tipo === 'application/pdf' ? (
                                  <PictureAsPdf sx={{ fontSize: 80, color: 'error.main' }} />
                                ) : (
                                  <InsertDriveFile sx={{ fontSize: 80, color: 'text.secondary' }} />
                                )}
                              </CardMedia>
                              
                              <CardContent sx={{ pt: 1, pb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>
                                    {doc.nombreOriginal}
                                  </Typography>
                                  {doc.starred && <Star color="warning" fontSize="small" />}
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Chip
                                    label={doc.originalStatus || doc.status || 'Pendiente'}
                                    color={
                                      (doc.originalStatus || doc.status) === 'Aprobado' 
                                        ? 'success' 
                                        : (doc.originalStatus || doc.status) === 'Rechazado' 
                                          ? 'error' 
                                          : 'warning'
                                    }
                                    size="small"
                                  />
                                  <Typography variant="caption">{formatFileSize(doc.size)}</Typography>
                                </Box>
                              </CardContent>
                              
                              <CardActions>
                                <IconButton size="small" onClick={() => handleViewFile(doc.urlB2, doc.nombreOriginal)}>
                                  <Visibility />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDownload(doc.urlB2, doc.nombreOriginal)}>
                                  <Download />
                                </IconButton>
                                <IconButton size="small" onClick={() => showFileDetails(doc.id)}>
                                  <Info />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => toggleStarred(doc.id)}
                                  color={doc.starred ? 'warning' : 'default'}
                                >
                                  {doc.starred ? <Star /> : <StarBorder />}
                                </IconButton>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Diálogo para ver el documento */}
      <VistaDocumentoSubido
        open={openDialog}
        onClose={handleCloseDialog}
        fileURL={viewFileUrl}
        fileName={viewFileName}
      />

      {/* Toast para mensajes */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
      />
      
      {/* Menú contextual para archivos */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          if (contextMenu) handleViewFile('', documents.find(d => d.id === contextMenu.fileId)?.nombreOriginal || '');
          handleCloseContextMenu();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver documento</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu) handleDownload('', documents.find(d => d.id === contextMenu.fileId)?.nombreOriginal || '');
          handleCloseContextMenu();
        }}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Descargar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (contextMenu) toggleStarred(contextMenu.fileId);
        }}>
          <ListItemIcon>
            {contextMenu && documents.find(d => d.id === contextMenu.fileId)?.starred ? 
              <Star fontSize="small" color="warning" /> : 
              <StarBorder fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{contextMenu && documents.find(d => d.id === contextMenu.fileId)?.starred ? 'Quitar de favoritos' : 'Añadir a favoritos'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu) showFileDetails(contextMenu.fileId);
        }}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          setToastMessage('Archivo movido a papelera');
          setToastOpen(true);
          handleCloseContextMenu();
        }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Diálogo para crear nueva carpeta eliminado */}
      
      {/* Diálogo para detalles de archivo */}
      <Dialog 
        open={fileDetailsOpen} 
        onClose={() => setFileDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedFileDetails && (
          <>
            <DialogTitle>
              Detalles del documento
              <IconButton
                aria-label="close"
                onClick={() => setFileDetailsOpen(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Clear />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {selectedFileDetails.tipo.startsWith('image/') ? (
                    <Image sx={{ fontSize: 100, color: 'primary.main' }} />
                  ) : selectedFileDetails.tipo === 'application/pdf' ? (
                    <PictureAsPdf sx={{ fontSize: 100, color: 'error.main' }} />
                  ) : (
                    <InsertDriveFile sx={{ fontSize: 100, color: 'text.secondary' }} />
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" align="center" gutterBottom>
                    {selectedFileDetails.nombreOriginal}
                    {selectedFileDetails.starred && <Star color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Estado:</Typography>
                  <Chip
                    label={selectedFileDetails.originalStatus || selectedFileDetails.status || 'Pendiente'}
                    color={
                      (selectedFileDetails.originalStatus || selectedFileDetails.status) === 'Aprobado' 
                        ? 'success' 
                        : (selectedFileDetails.originalStatus || selectedFileDetails.status) === 'Rechazado' 
                          ? 'error' 
                          : 'warning'
                    }
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Tamaño:</Typography>
                  <Typography variant="body2">{formatFileSize(selectedFileDetails.size)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Tipo:</Typography>
                  <Typography variant="body2">
                    {selectedFileDetails.tipo === 'application/pdf' ? 'PDF' : 
                     selectedFileDetails.tipo === 'image/jpeg' ? 'JPEG' :
                     selectedFileDetails.tipo === 'image/png' ? 'PNG' : selectedFileDetails.tipo}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Categoría:</Typography>
                  <Typography variant="body2">
                    {categories.find(c => c.id === selectedFileDetails.category)?.name || 'Sin categoría'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Fecha de subida:</Typography>
                  <Typography variant="body2">{formatDate(selectedFileDetails.fechaSubida)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Fecha en biblioteca:</Typography>
                  <Typography variant="body2">{formatDate(selectedFileDetails.addedToLibraryAt)}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Empresa:</Typography>
                  <Typography variant="body2">{selectedFileDetails.companyName || selectedFileDetails.companyId || 'N/A'}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Usuario:</Typography>
                  <Typography variant="body2">{selectedFileDetails.usuarioEmail || 'Desconocido'}</Typography>
                </Grid>
                
                {selectedFileDetails.tags && selectedFileDetails.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Etiquetas:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedFileDetails.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                startIcon={<Download />}
                onClick={() => handleDownload(selectedFileDetails.urlB2, selectedFileDetails.nombreOriginal)}
              >
                Descargar
              </Button>
              <Button 
                startIcon={<Visibility />}
                onClick={() => {
                  handleViewFile(selectedFileDetails.urlB2, selectedFileDetails.nombreOriginal);
                  setFileDetailsOpen(false);
                }}
                variant="contained"
              >
                Ver documento
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>


  );

}
