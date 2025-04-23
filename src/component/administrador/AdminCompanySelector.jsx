import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseconfig';
import { collection, getDocs } from 'firebase/firestore';
import { useCompany } from '../../contexts/company-context';
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
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedCompanyId, selectCompany } = useCompany();

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'companies'));
        const companiesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Ordenar alfabéticamente por nombre
        companiesList.sort((a, b) => a.name.localeCompare(b.name));
        
        setCompanies(companiesList);
      } catch (err) {
        console.error('Error al cargar empresas:', err);
        setError('Error al cargar la lista de empresas.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleCompanyChange = (event) => {
    const companyId = event.target.value;
    if (!companyId) {
      selectCompany(null, '');
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
        Seleccionar Empresa
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
            value={selectedCompanyId || ''}
            label="Empresa"
            onChange={handleCompanyChange}
          >
            <MenuItem value="">
              <em>Seleccione una empresa</em>
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
