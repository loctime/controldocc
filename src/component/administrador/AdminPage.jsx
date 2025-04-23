import React, { useState } from 'react';
import { SelectedCompanyProvider } from '../../contexts/selected-company-context';
import AdminCompanySelector from './AdminCompanySelector';
import AdminDashboard from './AdminDashboard';
import AdminUploadedDocumentsPage from './AdminUploadedDocumentsPage';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon
} from '@mui/icons-material';

// Componente para el panel de pestañas
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

export default function AdminPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <SelectedCompanyProvider>
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Dashboard" 
              icon={<DashboardIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Documentos Subidos" 
              icon={<DescriptionIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Documentos Requeridos" 
              icon={<AssignmentTurnedInIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AdminDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdminUploadedDocumentsPage />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6">
            Aquí irá el componente para gestionar los documentos requeridos
          </Typography>
        </TabPanel>
      </Box>
    </SelectedCompanyProvider>
  );
}
