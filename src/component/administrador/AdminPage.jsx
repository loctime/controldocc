// src/component/administrador/AdminPage.jsx
import React, { useState } from 'react';
import { CompaniesProvider, useCompanyList } from '../../context/CompaniesContext'; // ✅ reemplazo correcto
import AdminCompanySelector from './AdminCompanySelector';
import AdminDashboard from './AdminDashboard';
import AdminUploadedDocumentsPage from './AdminUploadedDocumentsPage';
import AdminRequiredDocumentsPage from './AdminRequiredDocumentsPage';
import DocumentLibraryPage from '../DocumentLibraryPage';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function AdminTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = parseInt(searchParams.get('tab')) || 0;
  const [tabValue, setTabValue] = useState(initialTab);
  const { selectedCompanyName, selectedCompanyId } = useCompanyList(); // ✅ correcto uso

  const tabConfig = [
    { icon: <DashboardIcon />, label: 'Dashboard', content: <AdminDashboard /> },
    { icon: <DescriptionIcon />, label: 'Administrar Documentos', content: <AdminUploadedDocumentsPage /> },
    { icon: <AssignmentTurnedInIcon />, label: 'Documentos Requeridos', content: <AdminRequiredDocumentsPage /> },
    { icon: <FolderIcon />, label: 'Biblioteca de Documentos', content: <DocumentLibraryPage /> }
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchParams({ tab: newValue });
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabConfig.map((tab, index) => (
            <Tab key={index} icon={tab.icon} label={tab.label} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      {selectedCompanyName && (
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Empresa seleccionada: <strong>{selectedCompanyName}</strong> (ID: {selectedCompanyId})
        </Typography>
      )}

      {tabConfig.map((tab, index) => (
        <TabPanel key={index} value={tabValue} index={index}>
          <Typography variant="h6" gutterBottom>
            {tab.label}
          </Typography>
          {tab.content}
        </TabPanel>
      ))}
    </>
  );
}

export default function AdminPage() {
  return (
    <CompaniesProvider>
      <Box sx={{ p: 3 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 2 }} />
            Panel de Administración
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestione empresas, documentos requeridos y apruebe documentos subidos por los usuarios.
          </Typography>
        </Paper>

        <AdminCompanySelector />
        <AdminTabs />
      </Box>
    </CompaniesProvider>
  );
}
