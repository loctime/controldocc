import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../firebaseconfig";
import { auth } from "../../firebaseconfig";

import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import useDashboardData from "./components/hooks/useDashboardData";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Tabs,
  Tab,
  Grid,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip
} from "@mui/material";
import { firebaseSignOut } from "../../firebaseconfig";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BusinessIcon from "@mui/icons-material/Business";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PersonalForm from "../usuario/PersonalForm";
import VehiculosForm from "../usuario/VehiculosForm";
import DocumentosEmpresaForm from "../usuario/DocumentosEmpresaForm";
import DocumentosPersonalForm from "../usuario/DocumentosPersonalForm";
import DocumentosVehiculoForm from "../usuario/DocumentosVehiculoForm";
import PersonalImportForm from "../usuario/PersonalImportForm";
import CompanyHeader from './components/CompanyHeader';
import DocumentosPanel from './components/documentosPanel';
import PersonalPanel from './components/PersonalPanel';
import VehiculosPanel from './components/VehiculosPanel';
import { getDeadlineColor } from '../../utils/getDeadlineColor';

const UsuarioDashboard = () => {
  const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
  const companyId = userCompanyData && typeof userCompanyData.companyId === 'string' && userCompanyData.companyId.trim() !== '' ? userCompanyData.companyId : null;
  if (!companyId) {
    return <Alert severity="error">No se encontró la empresa asignada. Por favor, vuelve a iniciar sesión o contacta al administrador.</Alert>;
  }
  const { user: currentUser } = useContext(AuthContext);  
  const [personalRefresh, setPersonalRefresh] = useState(0);

  const [vehiculosRefresh, setVehiculosRefresh] = useState(0);

  const {
    company,
    requiredDocuments,
    uploadedDocuments,
    personal,
    vehiculos,
    loading,
    error,
    refreshUploadedDocuments
  } = useDashboardData(companyId, personalRefresh, vehiculosRefresh);

  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  // Refresco automático de la pestaña Personal
  useEffect(() => {
    if (tabValue !== 3) return;
    const interval = setInterval(() => {
      refreshUploadedDocuments && refreshUploadedDocuments();
    }, 10000); // 10 segundos
    return () => clearInterval(interval);
  }, [tabValue, refreshUploadedDocuments]);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

 
  
  const hasWarningsForType = (type) => {
    const requiredForType = requiredDocuments.filter(doc => doc.entityType === type);
    return requiredForType.some(doc => {
      const uploaded = uploadedDocuments.find(up => up.requiredDocumentId === doc.id);
      return !uploaded || uploaded.status === "Pendiente de revisión" || uploaded.status === "Rechazado";
    });
  };

  if (loading && personal.length === 0 && vehiculos.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasWarningsForPerson = (personaId) => {
    return requiredDocuments || []
      .filter(doc => doc.entityType === "employee")
      .some(doc => {
        const uploaded = uploadedDocuments.find(
          up => up.entityId === personaId && up.requiredDocumentId === doc.id
        );
        return !uploaded || uploaded.status === "Pendiente de revisión" || uploaded.status === "Rechazado";
      });
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, padding: '2px', paddingTop: '6px', position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h4" gutterBottom>
          Bienvenido a ControlDoc
        </Typography>
        <Button 
          variant="outlined" 
          color="error"
          startIcon={<ExitToAppIcon />}
          onClick={async () => {
            try {
              await firebaseSignOut(auth);
              window.location.href = '/login';
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              alert("Ocurrió un error al cerrar sesión. Por favor intenta nuevamente.");
            }
          }}
          sx={{ ml: 2 }}
        >
          Cerrar Sesión
        </Button>
      </Box>

      {company && (
        <CompanyHeader company={company} />
      )}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 40 }}
        >
          <Tab
            icon={<DescriptionIcon fontSize="small" />}
            label="DOCUMENTOS"
            sx={{ minHeight: 40, py: 0.5 }}
          />
          <Tab
            icon={<BusinessIcon fontSize="small" />}
            label="EMPRESA"
            sx={{ minHeight: 40, py: 0.5 }}
          />
          <Tab
            icon={<DirectionsCarIcon fontSize="small" />}
            label="VEHICULOS"
            sx={{ minHeight: 40, py: 0.5 }}
          />
          <Tab
            icon={<PersonIcon fontSize="small" />}
            label="PERSONAL"
            sx={{ minHeight: 40, py: 0.5 }}
          />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <DocumentosPanel 
          requiredDocuments={requiredDocuments || []}
          uploadedDocuments={uploadedDocuments || []}
          hasWarningsForType={hasWarningsForType}
          setTabValue={setTabValue}
          refreshUploadedDocuments={refreshUploadedDocuments}
          selectedDocumentId={selectedDocumentId}
          setSelectedDocumentId={setSelectedDocumentId}
          openDocumentosDialog={openDocumentosDialog}
          setOpenDocumentosDialog={setOpenDocumentosDialog}
          getDeadlineColor={getDeadlineColor}
        />
      )}
      {tabValue === 3 && (
        <PersonalPanel
          personal={personal}
          onPersonalAdded={() => setPersonalRefresh(k => k + 1)}
          requiredDocuments={requiredDocuments || []}
          uploadedDocuments={uploadedDocuments || []}
          hasWarningsForPerson={hasWarningsForPerson}
          refreshUploadedDocuments={refreshUploadedDocuments}
          getDeadlineColor={getDeadlineColor}
        />
      )}
      {tabValue === 2 && (
        <VehiculosPanel
          vehiculos={vehiculos || []}
          requiredDocuments={requiredDocuments || []}
          uploadedDocuments={uploadedDocuments || []}
          refreshUploadedDocuments={refreshUploadedDocuments}
          getDeadlineColor={getDeadlineColor}
          onVehiculoAdded={() => setVehiculosRefresh(k => k + 1)}
        />
      )}
      <DocumentosEmpresaForm onDocumentUploaded={refreshUploadedDocuments} />

    </Box>
  );
};

export default UsuarioDashboard;
