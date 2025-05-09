import React from 'react';
import {
  Paper, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, Button, Typography, OutlinedInput
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useCompanies } from '../../../context/CompaniesContext';

export default function DocumentFilters({
  filters,
  setFilters,
  companies,
  handleClearFilters,
  handleSearch,
  showFilters,
  selectedCompany,
  setSelectedCompany
}) {
  if (!showFilters) return null;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Filtros de búsqueda</Typography>
      <Grid container spacing={2}>
        {/* Filtro de Empresa */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              input={<OutlinedInput label="Empresa" />}
            >
              <MenuItem value="">Todas las empresas</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Filtro de Estado */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.estado}
              onChange={(e) => setFilters({...filters, estado: e.target.value})}
              input={<OutlinedInput label="Estado" />}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pendiente de revisión">Pendiente</MenuItem>
              <MenuItem value="Aprobado">Aprobado</MenuItem>
              <MenuItem value="Rechazado">Rechazado</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Resto de filtros... */}
      </Grid>
    </Paper>
  );
}