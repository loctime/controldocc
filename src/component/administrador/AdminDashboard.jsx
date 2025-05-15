import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useCompanies } from "../../context/CompaniesContext";
import { parseFirestoreDate } from "../../utils/dateHelpers";
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Tooltip, 
  Button, 
  Paper, 
  Chip,
  FormControlLabel,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import { 
  Cancel as CancelIcon,
  Pending as PendingIcon,
  WarningAmber as WarningAmberIcon,
  Error as ErrorIcon,
  Business as BusinessIcon
} from "@mui/icons-material";

export default function AdminDashboard() {
  const { selectedCompany, companies, selectCompany } = useCompanies();
  const selectedCompanyId = selectedCompany?.id || null;
  const [stats, setStats] = useState({ 
    totalDocumentos: 0, 
    approvalPending: 0, 
    rejected: 0,
    empresasConPendientes: 0
  });
  const [showDetails, setShowDetails] = useState(null);
  const [previewDocs, setPreviewDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [checkboxFilters, setCheckboxFilters] = useState({
    vencidos: true,
    sinFecha: true,
    conFecha: true
  });
  const [expandedRow, setExpandedRow] = useState(null);
  
  const selectedCompanyName = selectedCompany?.name || selectedCompany?.companyName || "Todas las empresas";

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const filters = [];
        if (selectedCompanyId) {
          filters.push(where("companyId", "==", selectedCompanyId));
        }

        const uploadedSnap = await getDocs(query(collection(db, "uploadedDocuments"), ...filters));
        const companiesMap = new Map();

        let approvalPending = 0;
        let rejected = 0;
        let totalConVencimiento = 0;

        uploadedSnap.forEach(doc => {
          const data = doc.data();
          const companyId = data.companyId;
          
          if (!companiesMap.has(companyId)) {
            companiesMap.set(companyId, {
              hasPending: false,
              hasRejected: false,
              hasUrgent: false
            });
          }
          
          const companyData = companiesMap.get(companyId);
          const exp = parseFirestoreDate(data.expirationDate);
          const diasRestantes = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : null;
          
          if (data.expirationDate) totalConVencimiento++;
          if (data.status === "Pendiente de revisión") {
            approvalPending++;
            companyData.hasPending = true;
          }
          if (data.status === "Rechazado") {
            rejected++;
            companyData.hasRejected = true;
          }
          if (diasRestantes !== null && diasRestantes <= 10) {
            companyData.hasUrgent = true;
          }
        });

        let empresasConPendientes = 0;

        companiesMap.forEach(company => {
          if (company.hasPending || company.hasRejected || company.hasUrgent) {
            empresasConPendientes++;
          }
        });

        setStats({ 
          totalDocumentos: totalConVencimiento, 
          approvalPending, 
          rejected,
          empresasConPendientes
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedCompanyId]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!showDetails) {
        setPreviewDocs([]);
        return;
      }
      
      setLoading(true);

      if (showDetails === "TodasEmpresas") {
        try {
          const uploadedSnap = await getDocs(collection(db, "uploadedDocuments"));
          const hoy = new Date();

          const docs = await Promise.all(uploadedSnap.docs.map(async docSnap => {
            const data = docSnap.data();
            const exp = parseFirestoreDate(data.expirationDate);
            const diasRestantes = exp ? Math.ceil((exp - hoy) / (1000 * 60 * 60 * 24)) : null;

            return {
              id: docSnap.id,
              companyId: data.companyId,
              status: data.status || "Sin estado",
              diasRestantes
            };
          }));

          setPreviewDocs(docs);
        } catch (err) {
          console.error("Error al cargar documentos:", err);
          setPreviewDocs([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      console.log("fetchPreview activado con showDetails =", showDetails);

      try {
        const queryConstraints = [];
        if (selectedCompanyId) {
          queryConstraints.push(where("companyId", "==", selectedCompanyId));
        }
        if (showDetails !== "TodosDocumentos") {
          queryConstraints.push(where("status", "==", showDetails));
        }

        const uploadedSnap = await getDocs(query(collection(db, "uploadedDocuments"), ...queryConstraints));
        
        const hoy = new Date();
        
        const docs = await Promise.all(uploadedSnap.docs.map(async docSnap => {
          const data = docSnap.data();
          
          const exp = parseFirestoreDate(data.expirationDate);
          const diasRestantes = exp ? Math.ceil((exp - hoy) / (1000 * 60 * 60 * 24)) : null;
          
          let requiredName = "";
          if (data.requiredDocumentId) {
            const ref = doc(db, "requiredDocuments", data.requiredDocumentId);
            const snap = await getDoc(ref);
            if (snap.exists()) requiredName = snap.data().name;
          }
          
          return {
            id: docSnap.id,
            companyId: data.companyId,
            companyName: companies.find(c => c.id === data.companyId)?.name || "Sin nombre",
            category: requiredName || "Sin categoría",
            name: data.fileName || "Sin nombre",
            expirationDate: exp,
            diasRestantes,
            status: data.status || "Sin estado",
          };
        }));
        
        setPreviewDocs(docs.sort((a, b) => {
          if (a.diasRestantes !== null && b.diasRestantes !== null) {
            return a.diasRestantes - b.diasRestantes;
          }
          if (a.diasRestantes === null && b.diasRestantes !== null) return 1;
          if (a.diasRestantes !== null && b.diasRestantes === null) return -1;
          return 0;
        }));
      } catch (err) {
        console.error("Error al cargar documentos:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPreview();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [showDetails, selectedCompanyId, companies]);

  const getDeadlineColor = diasRestantes => {
    if (diasRestantes == null) return 'text.primary';
    if (diasRestantes < 0) return 'error.main';
    if (diasRestantes <= 5) return 'error.main';
    if (diasRestantes <= 10) return 'warning.main';
    return 'text.primary';
  };

  const StatCard = ({ title, value, icon, color, filterKey, onViewAll, tooltip }) => (
    <Grid item xs={12} sm={4} md={4}>
      <Card elevation={1} sx={{ height: "100%", p: 1 }}>
        <CardContent sx={{ p: 1.2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Tooltip title={title} arrow>
              <Box sx={{ color, display: "flex" }}>{icon}</Box>
            </Tooltip>
            <Typography variant="subtitle2" fontWeight={600} fontSize={13}>{title}</Typography>
            {tooltip && (
              <Tooltip title={tooltip} arrow>
                <Box sx={{ color: 'text.primary', display: "flex", ml: 1 }}>
                  <WarningAmberIcon fontSize="small" />
                </Box>
              </Tooltip>
            )}
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="h5" align="center" fontWeight="bold">{value}</Typography>
          <Box mt={1} display="flex" justifyContent="center" gap={1}>
            {onViewAll && (
              <Button size="small" onClick={onViewAll}>Ver</Button>
            )}
            {filterKey && (
              <Button 
                size="small" 
                onClick={() => setShowDetails(filterKey)}
              >
                Ver
              </Button>
            )}
            {filterKey !== "TodosDocumentos" && (
              <Button 
                size="small" 
                onClick={() => navigate(
                  `/admin/uploaded-documents?filter=${encodeURIComponent(filterKey)}${selectedCompanyId ? `&empresa=${selectedCompanyId}` : ''}`
                )}
              >
                Ir a
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
  const visibleDocs = previewDocs.filter(doc => {
    if (doc.diasRestantes == null) return checkboxFilters.sinFecha;
    if (doc.diasRestantes < 0) return checkboxFilters.vencidos;
    return checkboxFilters.conFecha;
  });
  
  const handleShowAllCompanies = () => {
    setShowDetails("TodasEmpresas");
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">Dashboard del Administrador</Typography>

      <Grid container spacing={2}>
        <StatCard
          title="Empresas"
          value={companies.length}
          icon={<BusinessIcon color="warning" />}
          color="warning.dark"
          onViewAll={handleShowAllCompanies}
          tooltip="Lista completa de empresas registradas"
        />
        <StatCard
          title="Próximos a vencer"
          value={stats.totalDocumentos}
          icon={<ErrorIcon color="warning" />}
          color="error.light"
          filterKey="TodosDocumentos"
        />
        <StatCard
          title="Pendientes de aprobación"
          value={stats.approvalPending}
          icon={<PendingIcon />}
          color="warning.main"
          filterKey="Pendiente de revisión"
        />
        <StatCard
          title="Rechazados"
          value={stats.rejected}
          icon={<CancelIcon />}
          color="error.main"
          filterKey="Rechazado"
        />
      </Grid>

      {showDetails && (
        <Box mt={4}>
          

          {loading ? (
            <Typography>Cargando...</Typography>
          ) : previewDocs.length === 0 ? (
            <Typography>No hay documentos para mostrar.</Typography>
          ) : (
            <Box sx={{ maxWidth: 600 }}>
              {showDetails === "TodasEmpresas" ? (
                <Paper variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Empresa</TableCell>
                        <TableCell align="center">Aprobados</TableCell>
                        <TableCell align="center">Vencidos</TableCell>
                        <TableCell align="center">Rechazados</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {companies.map(company => {
                        const docsEmpresa = previewDocs.filter(doc => doc.companyId === company.id);
                        const isExpanded = expandedRow === company.id;

                        const aprobados = docsEmpresa.filter(d => d.status === "Aprobado").length;
                        const vencidos = docsEmpresa.filter(d => d.diasRestantes !== null && d.diasRestantes <= 0).length;
                        const rechazados = docsEmpresa.filter(d => d.status === "Rechazado").length;

                        return (
                          <React.Fragment key={company.id}>
                            <TableRow hover>
                              <TableCell>{company.name}</TableCell>
                              <TableCell align="center">
                                <Chip label={aprobados} color={aprobados > 0 ? "success" : "default"} size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={vencidos} color={vencidos > 0 ? "error" : "default"} size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={rechazados} color={rechazados > 0 ? "error" : "default"} size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Button 
                                  size="small" 
                                  onClick={() => setExpandedRow(isExpanded ? null : company.id)}
                                >
                                  {isExpanded ? 'Ocultar' : 'Ver docs'}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {isExpanded && (
                              <TableRow>
                                <TableCell colSpan={5} sx={{ padding: 0, backgroundColor: '#f9f9f9' }}>
                                  <Box sx={{ margin: 1 }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Documento</TableCell>
                                          <TableCell>Estado</TableCell>
                                          <TableCell>Vencimiento</TableCell>
                                          <TableCell>Días restantes</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {docsEmpresa.map(doc => (
                                          <TableRow key={doc.id}>
                                            <TableCell>{doc.name || 'Sin nombre'}</TableCell>
                                            <TableCell>
                                              <Chip 
                                                label={doc.status} 
                                                color={
                                                  doc.status === 'Aprobado' ? 'success' :
                                                  doc.status === 'Rechazado' ? 'error' : 'warning'
                                                }
                                                size="small"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              {doc.expirationDate?.toLocaleDateString() || 'Sin fecha'}
                                            </TableCell>
                                            <TableCell>
                                              {doc.diasRestantes !== null ? 
                                                (doc.diasRestantes <= 0 ? 
                                                  `Vencido (${Math.abs(doc.diasRestantes)} días)` : 
                                                  doc.diasRestantes) : 
                                                'N/A'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkboxFilters.vencidos}
                        onChange={(e) =>
                          setCheckboxFilters(prev => ({ ...prev, vencidos: e.target.checked }))
                        }
                      />
                    }
                    label="Vencidos"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkboxFilters.conFecha}
                        onChange={(e) =>
                          setCheckboxFilters(prev => ({ ...prev, conFecha: e.target.checked }))
                        }
                      />
                    }
                    label="Con fecha"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checkboxFilters.sinFecha}
                        onChange={(e) =>
                          setCheckboxFilters(prev => ({ ...prev, sinFecha: e.target.checked }))
                        }
                      />
                    }
                    label="Sin fecha"
                  />
                </Box>
              )}
              <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
                <Box sx={{ display: 'flex', fontWeight: 'bold', p: 1, bgcolor: '#f5f5f5' }}>
                  <Box sx={{ flex: 2 }}>Empresa</Box>
                  <Box sx={{ flex: 2 }}>categoria</Box>
                  <Box sx={{ flex: 2 }}>Documento</Box>
                  <Box sx={{ flex: 1 }}>Vencimiento</Box>
                </Box>
                {visibleDocs.map(doc => (
                  <Box key={doc.id} sx={{ display: 'flex', p: 1, borderTop: '1px solid #eee' }}>
                    <Box sx={{ flex: 2 }}>{doc.companyName}</Box>
                    <Box sx={{ flex: 2 }}>{doc.category}</Box>
                    <Box sx={{ flex: 2 }}>{doc.name}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: getDeadlineColor(doc.diasRestantes) }}>
                          {doc.expirationDate instanceof Date && !isNaN(doc.expirationDate)
                            ? doc.expirationDate.toLocaleDateString()
                            : 'Sin fecha'}
                        </Typography>
                        {doc.diasRestantes < 0 && (
          <Tooltip title="Documento vencido">
            <WarningAmberIcon color="error" fontSize="small" />
          </Tooltip>
        )}
      </Box>
      <Chip
        label={doc.status}
        color={
          doc.status === 'Aprobado' ? 'success' :
          doc.status === 'Rechazado' ? 'error' :
          'warning'
        }
        size="small"
        clickable
        onClick={() =>
          navigate(`/admin/uploaded-documents?empresa=${doc.companyId}&docId=${doc.id}`)
        }
      />
    </Box>
  </Box>
))}
              </Paper>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
