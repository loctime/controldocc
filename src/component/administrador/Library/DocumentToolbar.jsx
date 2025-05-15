import React from 'react';
import {
  Box, Typography, Button, IconButton, Breadcrumbs,
  Paper, Alert, CircularProgress
} from '@mui/material';
import { 
  Download, GridView, ViewList, Sort, 
  FilterList, Folder
} from '@mui/icons-material';
import { Link as MuiLink } from '@mui/material';
import DownloadButton from '../../../components/common/DownloadButton';
import MultiDownloadZipButton from '../../../components/common/MultiDownloadZipButton';

export default function DocumentToolbar({
  title,
  breadcrumbs,
  navigateToFolder,
  selectedFiles,
  downloadSelectedFiles,
  viewMode,
  toggleViewMode,
  showFilters,
  setShowFilters,
  sortDirection,
  setSortDirection,
  loading,
  error,
  documents
}) {
  return (
    <>
      {/* Barra superior con título y controles */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{title}</Typography>
          
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

      {/* Barra de navegación y ordenación */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          
          <IconButton 
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            color="primary"
            size="small"
          >
            <Sort sx={{ transform: sortDirection === 'asc' ? 'none' : 'rotate(180deg)' }} />
          </IconButton>
        </Box>
      </Paper>

      {/* Barra de acciones para archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderRadius: 2, 
          boxShadow: 2, 
          bgcolor: '#e3f2fd' 
        }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium', color: '#0d47a1' }}>
            {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
          </Typography>
          
          {selectedFiles.length === 1 ? (
            <DownloadButton
              url={documents.find(doc => doc.id === selectedFiles[0])?.urlB2}
              filename={documents.find(doc => doc.id === selectedFiles[0])?.nombreOriginal}
              label="Descargar"
              disabled={false}
              variant="contained"
              size="small"
              sx={{ borderRadius: 2 }}
              onClick={downloadSelectedFiles}
            />
          ) : (
            <MultiDownloadZipButton
              files={selectedFiles.map(fileId => {
                const doc = documents.find(d => d.id === fileId);
                return {
                  url: doc?.urlB2,
                  filename: doc?.nombreOriginal
                };
              }).filter(f => f.url)}
              label={`Descargar ${selectedFiles.length} archivos`}
              disabled={selectedFiles.length === 0}
              variant="contained"
              size="small"
              sx={{ borderRadius: 2 }}
              zipName={`documentos_${new Date().toISOString().slice(0,10)}.zip`}
            />
          )}
        </Paper>
      )}

      {/* Estados de carga y error */}
      {loading && documents.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && documents.length === 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
    </>
  );
}