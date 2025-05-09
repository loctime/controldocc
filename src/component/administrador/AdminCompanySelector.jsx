import React from 'react';
import { useCompanies } from '../../context/CompaniesContext';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

const AdminCompanySelector = () => {
  const { companies, loading, error } = useCompanies();
  const { selectedCompanyId, selectCompany } = useCompany();

  const handleCompanyChange = (event) => {
    const companyId = event.target.value;
    if (!companyId) {
      selectCompany('todas', 'todas');
      return;
    }

    const selectedCompany = companies.find(company => company.id === companyId);
    if (selectedCompany) {
      selectCompany(companyId, selectedCompany.name);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BusinessIcon sx={{ mr: 1 }} />
        Todas las empresas
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <FormControl fullWidth>
          <InputLabel id="company-select-label">Empresa</InputLabel>
          <Select
            labelId="company-select-label"
            id="company-select"
            value={selectedCompanyId || 'todas'}
            label="Empresa"
            onChange={handleCompanyChange}
          >
            <MenuItem value="todas">
              <em>Todas las empresas</em>
            </MenuItem>
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name} ({company.cuit})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Paper>
  );
};

export default AdminCompanySelector;
