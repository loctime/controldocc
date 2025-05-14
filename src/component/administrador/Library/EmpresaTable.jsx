import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Typography, Box, Checkbox
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

const EmpresaTable = ({ 
  companies = [], 
  onEdit, 
  onDelete,
  selected = [],
  onSelect,
  onSelectAll
}) => {
  const numSelected = selected.length;
  
  return (
    <TableContainer component={Paper} elevation={3}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                indeterminate={numSelected > 0 && numSelected < companies.length}
                checked={companies.length > 0 && numSelected === companies.length}
                onChange={onSelectAll}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Empresa</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>CUIT</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} hover>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  checked={selected.includes(company.id)}
                  onChange={() => onSelect(company.id)}
                />
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <BusinessIcon color="primary" sx={{ mr: 1 }} />
                  {company.name}
                </Box>
              </TableCell>
              <TableCell>{company.cuit || 'No especificado'}</TableCell>
              <TableCell>
                <Typography 
                  color={company.status === 'active' ? 'success.main' : 'text.secondary'}
                >
                  {company.status || 'Sin estado'}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title="Editar">
                  <IconButton onClick={() => onEdit(company)}>
                    <EditIcon color="primary" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton onClick={() => onDelete(company)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EmpresaTable;
