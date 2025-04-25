import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";


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
  Badge
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BusinessIcon from "@mui/icons-material/Business";
import PersonalForm from "./PersonalForm";
import VehiculosForm from "./VehiculosForm";
import DocumentosEmpresaForm from "./DocumentosEmpresaForm";
import DocumentosPersonalForm from "./DocumentosPersonalForm";
import DocumentosVehiculoForm from "./DocumentosVehiculoForm";
import PersonalImportForm from "./PersonalImportForm";

const UsuarioDashboard = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const { user } = useContext(AuthContext);
  const [company, setCompany] = useState(null);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [personal, setPersonal] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [showImportPersonal, setShowImportPersonal] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [openDocumentosDialog, setOpenDocumentosDialog] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchCompanyAndDocuments = async () => {
      // Obtener información del usuario y la empresa desde localStorage
      const userCompanyData = JSON.parse(localStorage.getItem('userCompany'));
      
      if (!userCompanyData || !userCompanyData.companyId) {
        setError("No tienes una empresa asignada.");
        setLoading(false);
        return;
      }
      
      // Usar el companyId del localStorage
      const companyId = userCompanyData.companyId;

      try {
        // Cargar datos de la empresa usando el companyId del localStorage
        const companyRef = doc(db, "companies", companyId);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
          setCompany(companySnap.data());
        } else {
          setError("No se encontró la empresa asignada.");
        }

        // Cargar documentos requeridos
        const documentsQuery = query(
          collection(db, "requiredDocuments"),
          where("companyId", "==", companyId)
        );

        const documentsSnapshot = await getDocs(documentsQuery);
        const docsList = documentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRequiredDocuments(docsList);
// Cargar documentos subidos
const uploadedDocsQuery = query(
  collection(db, "uploadedDocuments"),
  where("companyId", "==", companyId)
);
const uploadedDocsSnapshot = await getDocs(uploadedDocsQuery);
const uploadedDocsList = uploadedDocsSnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));
setUploadedDocuments(uploadedDocsList);

        // Cargar personal
        const personalQuery = query(
          collection(db, "personal"),
          where("companyId", "==", companyId)
        );

        const personalSnapshot = await getDocs(personalQuery);
        const personalList = personalSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPersonal(personalList);

        // Cargar vehículos
        const vehiculosQuery = query(
          collection(db, "vehiculos"),
          where("companyId", "==", companyId)
        );

        const vehiculosSnapshot = await getDocs(vehiculosQuery);
        const vehiculosList = vehiculosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVehiculos(vehiculosList);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar la información. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndDocuments();
  }, []);

  const hasWarningsForType = (type) => {
    const requiredForType = requiredDocuments.filter(doc => doc.entityType === type);
    return requiredForType.some(doc => {
      const uploaded = uploadedDocuments.find(up => up.requiredDocumentId === doc.id);
      return !uploaded || uploaded.status === "Pendiente de revisión" || uploaded.status === "Rechazado";
    });
  };
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  const hasWarningsForPerson = (personaId) => {
    return requiredDocuments
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bienvenido a ControlDoc
      </Typography>

      {company && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6">
            Empresa: {company.name}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            CUIT: {company.cuit || "No registrado"}
          </Typography>
        </Paper>
      )}

      <Box sx={{ width: '100%', mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<DescriptionIcon />} label="DOCUMENTOS" />
          <Tab icon={<PersonIcon />} label="PERSONAL" />
          <Tab icon={<DirectionsCarIcon />} label="VEHÍCULOS" />
          <Tab icon={<BusinessIcon />} label="EMPRESA" />
        </Tabs>
      </Box>

      {/* Panel de Documentos */}
      {tabValue === 0 && (
        <>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Documentos Requeridos
            </Typography>

            {requiredDocuments.length === 0 ? (
              <Typography color="textSecondary">
                No hay documentos requeridos configurados para esta empresa.
              </Typography>
            ) : (
<Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }}>
               {/* Documentos de Empresa */}
               <Grid xs={12} md={4}>
  <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Badge color="error" variant="dot" invisible={!hasWarningsForType("company")}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Documentos de Empresa
      </Typography>
    </Badge>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Documentos generales de la empresa
    </Typography>
    <Box sx={{ flexGrow: 1 }} />
    <Button 
      variant="contained" 
      color="primary"
      startIcon={<UploadFileIcon />}
      onClick={() => {
        setTabValue(3); // Cambiar a la pestaña de Empresa
      }}
      fullWidth
    >
      Ver Documentos
    </Button>
  </Paper>
</Grid>

                
                {/* Documentos de Personal */}
                <Grid xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Badge color="error" variant="dot" invisible={!hasWarningsForType("employee")}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Documentos de Personal
                      </Typography>
                    </Badge>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Documentos específicos para cada persona
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<PersonIcon />}
                      onClick={() => {
                        setTabValue(1); // Cambiar a la pestaña de Personal
                      }}
                      fullWidth
                    >
                      Ver Personal
                    </Button>
                  </Paper>
                </Grid>
                
{/* Documentos de Vehículos */}
<Grid xs={12} md={4}>

  <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
    
    {/* Badge correctamente colocado */}
    <Badge color="error" variant="dot" invisible={!hasWarningsForType("vehicle")}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Documentos de Vehículos
      </Typography>
    </Badge>

    <Typography variant="body2" sx={{ mb: 2 }}>
      Documentos específicos para cada vehículo
    </Typography>

    <Box sx={{ flexGrow: 1 }} />

    <Button 
      variant="contained" 
      color="primary"
      startIcon={<DirectionsCarIcon />}
      onClick={() => {
        setTabValue(2); // Cambiar a la pestaña de Vehículos
      }}
      fullWidth
    >
      Ver Vehículos
    </Button>
  </Paper>
</Grid>

              </Grid>
            )}
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Lista de Documentos Requeridos
            </Typography>

            {requiredDocuments.length === 0 ? (
              <Typography color="textSecondary">
                No hay documentos requeridos configurados para esta empresa.
              </Typography>
            ) : (
              <List>
                {requiredDocuments.map((doc) => (
                  <React.Fragment key={doc.id}>
                    <ListItem secondaryAction={
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => {
                          // Determinar a qué entidad pertenece el documento
                          if (doc.entityType === "company") {
                            setTabValue(3); // Cambiar a la pestaña de Empresa
                          } else if (doc.entityType === "employee") {
                            setTabValue(1); // Cambiar a la pestaña de Personal
                          } else if (doc.entityType === "vehicle") {
                            setTabValue(2); // Cambiar a la pestaña de Vehículos
                          }
                        }}
                      >
                        Subir Documento
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <DescriptionIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
  primary={doc.name}
  secondaryTypographyProps={{ component: "div" }}
  secondary={
    <>
      <Typography component="div" variant="body2">
        Aplicable a: {doc.entityType}
      </Typography>

      <Typography component="div" variant="body2" color="textSecondary">
        {doc.description || "Sin descripción"}
      </Typography>

      {doc.dueDate && (
        <Typography 
          component="div" 
          variant="body2" 
          color={new Date(doc.dueDate) < new Date() ? "error" : "textSecondary"}
        >
          Fecha límite: {new Date(doc.dueDate).toLocaleDateString()}
        </Typography>
      )}
    </>
  }
/>

                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
          </Paper>
        </>
      )}

      {/* Panel de Personal */}
      {tabValue === 1 && (
        <>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button 
              variant={!showImportPersonal ? "contained" : "outlined"}
              onClick={() => setShowImportPersonal(false)}
              startIcon={<PersonIcon />}
            >
              Agregar Individual
            </Button>
            <Button 
              variant={showImportPersonal ? "contained" : "outlined"}
              onClick={() => setShowImportPersonal(true)}
              startIcon={<CloudUploadIcon />}
            >
              Importación Masiva
            </Button>
          </Stack>
          
          {showImportPersonal ? (
            <PersonalImportForm />
          ) : (
            <PersonalForm />
          )}
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Registrado ({personal.length})
            </Typography>

            {personal.length === 0 ? (
              <Typography color="textSecondary">
                No hay personal registrado para esta empresa.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {personal.map((persona) => (
                  <Grid item xs={12} sm={6} md={4} key={persona.id}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                    <Badge color="error" variant="dot" invisible={!hasWarningsForPerson(persona.id)}>
  <Typography variant="subtitle1" fontWeight="bold">
    {persona.nombre} {persona.apellido}
  </Typography>
</Badge>

                      <Typography variant="body2">
                        DNI: {persona.dni}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<UploadFileIcon />}
                        onClick={() => {
                          setSelectedPersona(persona);
                          setOpenDocumentosDialog(true);
                        }}
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Documentos
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
          
          {/* Diálogo para documentos de personal */}
          <Dialog 
            open={openDocumentosDialog && selectedPersona !== null} 
            onClose={() => {
              setOpenDocumentosDialog(false);
              setSelectedPersona(null);
            }}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              Documentos de {selectedPersona?.nombre} {selectedPersona?.apellido}
            </DialogTitle>
            <DialogContent dividers>
              {selectedPersona && <DocumentosPersonalForm persona={selectedPersona} />}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setOpenDocumentosDialog(false);
                  setSelectedPersona(null);
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Panel de Vehículos */}
      {tabValue === 2 && (
        <>
          <VehiculosForm />
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vehículos Registrados
            </Typography>

            {vehiculos.length === 0 ? (
              <Typography color="textSecondary">
                No hay vehículos registrados para esta empresa.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {vehiculos.map((vehiculo) => (
                  <Grid item xs={12} sm={6} md={4} key={vehiculo.id}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {vehiculo.marca} {vehiculo.modelo}
                      </Typography>
                      <Typography variant="body2">
                        Patente: {vehiculo.patente}
                      </Typography>
                      <Typography variant="body2">
                        Tipo: {vehiculo.tipo} {vehiculo.año ? `| Año: ${vehiculo.año}` : ''}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<UploadFileIcon />}
                        onClick={() => {
                          setSelectedVehiculo(vehiculo);
                          setOpenDocumentosDialog(true);
                        }}
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Documentos
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
          
          {/* Diálogo para documentos de vehículos */}
          <Dialog 
            open={openDocumentosDialog && selectedVehiculo !== null} 
            onClose={() => {
              setOpenDocumentosDialog(false);
              setSelectedVehiculo(null);
            }}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              Documentos de {selectedVehiculo?.marca} {selectedVehiculo?.modelo} ({selectedVehiculo?.patente})
            </DialogTitle>
            <DialogContent dividers>
              {selectedVehiculo && <DocumentosVehiculoForm vehiculo={selectedVehiculo} />}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setOpenDocumentosDialog(false);
                  setSelectedVehiculo(null);
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
      {/* Panel de Empresa */}
      {tabValue === 3 && (
        <>
          <DocumentosEmpresaForm />
          
          <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Datos de la Empresa
            </Typography>
            
            {company ? (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Nombre:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {company.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      CUIT:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {company.cuit}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Fecha de registro:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "No disponible"}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Resumen de Datos
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">{personal.length}</Typography>
                      <Typography variant="body2">Personal Registrado</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <DirectionsCarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">{vehiculos.length}</Typography>
                      <Typography variant="body2">Vehículos Registrados</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <DescriptionIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">{requiredDocuments.length}</Typography>
                      <Typography variant="body2">Documentos Requeridos</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Alert severity="warning">
                No se pudieron cargar los datos de la empresa.
              </Alert>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default UsuarioDashboard;
