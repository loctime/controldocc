import React, { useState, useContext } from 'react';
import { CompanyProvider, CompanyContext } from '../../contexts/company-context';
import AdminCompanySelector from './AdminCompanySelector';
import AdminDashboard from './AdminDashboard';
import AdminUploadedDocumentsPage from './AdminUploadedDocumentsPage';
import AdminDocumentApprovalPage from './AdminDocumentApprovalPage.tsx';
import AdminRequiredDocumentsPage from './AdminRequiredDocumentsPage';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import TaskIcon from '@mui/icons-material/Task';
import AssignmentIcon from '@mui/icons-material/Assignment';  
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

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
  const [tabValue, setTabValue] = useState(0);
  const { selectedCompany } = useContext(CompanyContext);

  const tabConfig = [
    { icon: <DashboardIcon />, label: 'Dashboard', content: <AdminDashboard /> },
    { icon: <DescriptionIcon />, label: 'Documentos Subidos', content: <AdminUploadedDocumentsPage /> },
    { icon: <AssignmentTurnedInIcon />, label: 'Documentos Requeridos', content: <AdminRequiredDocumentsPage /> },
    { icon: <AssignmentTurnedInIcon />, label: 'Aprobaciones', content: <AdminDocumentApprovalPage /> },
    { icon: <TaskIcon />, label: 'Tareas', content: <AdminDocumentApprovalPage /> },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

      {selectedCompany && (
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Empresa seleccionada: <strong>{selectedCompany.name}</strong> (CUIT: {selectedCompany.cuit})
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
    <CompanyProvider>
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
    </CompanyProvider>
  );
}
