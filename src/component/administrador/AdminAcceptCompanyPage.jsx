// g:\controldoc-master99\src\component\administrador\AdminAcceptCompanyPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  getPendingCompanies, 
  updateCompanyStatus,
  COMPANY_STATUS 
} from '../../firebaseconfig';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, Box, Paper, Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { auth, db } from '../../firebaseconfig'; // Import auth and db from firebaseconfig
import { useCompanies } from '../../context/CompaniesContext';
import { setDoc, doc } from 'firebase/firestore'; // Import setDoc and doc from firebase/firestore

const AdminAcceptCompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const { refreshCompanies } = useCompanies();

  useEffect(() => {
    loadPendingCompanies();
  }, []);

  const loadPendingCompanies = async () => {
    try {
      setLoading(true);
      const pendingCompanies = await getPendingCompanies();
      setCompanies(pendingCompanies);
    } catch (error) {
      enqueueSnackbar('Error al cargar empresas: ' + error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (companyId, status) => {
    try {
      await updateCompanyStatus(companyId, status);
      enqueueSnackbar(`Empresa ${status === COMPANY_STATUS.APPROVED ? 'aprobada' : 'rechazada'}`, { variant: 'success' });
      loadPendingCompanies();
      refreshCompanies();
    } catch (error) {
      enqueueSnackbar('Error al actualizar estado: ' + error.message, { variant: 'error' });
    }
  };

  const approveCompany = async (companyId) => {
    try {
      const company = companies.find(c => c.id === companyId);
      
      if (company.status === COMPANY_STATUS.APPROVED) {
        enqueueSnackbar('Esta empresa ya estaba aprobada', { variant: 'info' });
        return true;
      }

      // 1. Aprobar empresa
      await updateCompanyStatus(companyId, COMPANY_STATUS.APPROVED);
      
      // 2. Actualizar usuario
      await setDoc(doc(db, "users", company.ownerId), {
        companyId: company.cuit,
        companyName: company.companyName || company.name,
        companyStatus: "approved",
        hasCompany: true
      }, { merge: true });

      // 3. Feedback
      enqueueSnackbar(`Empresa ${company.companyName || company.name} aprobada`, {
        variant: 'success',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      
      // 4. Actualizar lista
      loadPendingCompanies();
      refreshCompanies();
      return true;

    } catch (error) {
      enqueueSnackbar(`Error al aprobar: ${error.message}`, {
        variant: 'error',
        persist: true
      });
      return false;
    }
  };

  const columns = [
    { id: 'companyName', label: 'Nombre Empresa' },
    { id: 'email', label: 'Email' },
    { id: 'cuit', label: 'CUIT' },
    { id: 'createdAt', label: 'Fecha Registro' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Aprobación de Empresas</Typography>
      <Chip 
        label={`Pendientes: ${companies.length}`} 
        color="warning" 
        sx={{ mb: 2 }}
      />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.companyName}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>{company.cuit}</TableCell>
                <TableCell>
                  {company.createdAt?.toDate().toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={async () => {
                      const success = await approveCompany(company.id);
                      if (success) {
                        enqueueSnackbar('Empresa aprobada', { variant: 'success' });
                        loadPendingCompanies();
                      } else {
                        enqueueSnackbar('Error al aprobar', { variant: 'error' });
                      }
                    }}
                    sx={{ mr: 1 }}
                  >
                    Aprobar
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => handleDecision(company.id, COMPANY_STATUS.REJECTED)}
                  >
                    Rechazar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminAcceptCompanyPage;