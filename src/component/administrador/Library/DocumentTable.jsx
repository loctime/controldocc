import React, { useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Checkbox, Chip, TableSortLabel, Box, Typography
} from '@mui/material';
import { Download, Visibility } from '@mui/icons-material';

const DocumentTable = ({
  documents,
  selectedFiles,
  toggleFileSelection,
  selectAllFiles,
  onViewDetails,
  handleDownload,
  formatFileSize,
  formatDate,
  getFileIcon,
  sortBy,
  sortDirection,
  setSortBy,
  setSortDirection,
  viewMode
}) => {
  const rows = useMemo(() =>
    documents.map((doc) => ({
      ...doc,
      isSelected: selectedFiles.includes(doc.id)
    })), [documents, selectedFiles]
  );

  if (viewMode !== 'list') return null;

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow sx={{ height: 32 }}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={selectedFiles.length > 0 && selectedFiles.length < documents.length}
                  checked={documents.length > 0 && selectedFiles.length === documents.length}
                  onChange={selectAllFiles}
                />
              </TableCell>
              <TableCell width={28}></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortDirection}
                  onClick={() => {
                    const isAsc = sortBy === 'name' && sortDirection === 'asc';
                    setSortDirection(isAsc ? 'desc' : 'asc');
                    setSortBy('name');
                  }}
                >
                  Nombre
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'company'}
                  direction={sortDirection}
                  onClick={() => {
                    const isAsc = sortBy === 'company' && sortDirection === 'asc';
                    setSortDirection(isAsc ? 'desc' : 'asc');
                    setSortBy('company');
                  }}
                >
                  Empresa
                </TableSortLabel>
              </TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'size'}
                  direction={sortDirection}
                  onClick={() => {
                    const isAsc = sortBy === 'size' && sortDirection === 'asc';
                    setSortDirection(isAsc ? 'desc' : 'asc');
                    setSortBy('size');
                  }}
                >
                  Tamaño
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'date'}
                  direction={sortDirection}
                  onClick={() => {
                    const isAsc = sortBy === 'date' && sortDirection === 'asc';
                    setSortDirection(isAsc ? 'desc' : 'asc');
                    setSortBy('date');
                  }}
                >
                  Fecha
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((doc) => (
              <TableRow key={doc.id} hover sx={{ height: 36 }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={doc.isSelected}
                    onChange={() => toggleFileSelection(doc.id)}
                  />
                </TableCell>

                <TableCell>
                  {React.cloneElement(getFileIcon(doc.tipo), { fontSize: 'small' })}
                </TableCell>

                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="caption" noWrap>
                    {doc.nombreOriginal}
                  </Typography>
                </TableCell>

                <TableCell sx={{ maxWidth: 160 }}>
                  <Typography variant="caption" noWrap>
                    {doc.companyName}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={doc.originalStatus}
                    color={
                      doc.originalStatus === 'Aprobado'
                        ? 'success'
                        : doc.originalStatus === 'Rechazado'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="caption">
                    {formatFileSize(doc.size)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="caption">
                    {formatDate(doc.fechaSubida)}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Tooltip title="Ver detalles">
                    <IconButton onClick={() => onViewDetails(doc.id)} size="small">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Descargar">
                    <IconButton
                      onClick={() => handleDownload(doc.urlB2, doc.nombreOriginal)}
                      size="small"
                      disabled={!doc.urlB2}
                    >
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {documents.length === 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2">No se encontraron documentos</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(DocumentTable);
