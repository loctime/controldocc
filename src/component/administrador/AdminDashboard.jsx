import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { useCompanies } from "../../context/CompaniesContext";
import { parseFirestoreDate } from "../../utils/dateHelpers";

import {
  Box,
  Typography,
  Grid,
  Tooltip
} from "@mui/material";
import {
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

// Subcomponentes
import StatCard from "./dashboard/StatCard";
import EmpresasTable from "./dashboard/EmpresasTable";
import PreviewDocumentTable from "./dashboard/PreviewDocumentTable";

export default function AdminDashboard() {
  const { selectedCompany, companies } = useCompanies();
  const selectedCompanyId = selectedCompany?.id || null;
  const [stats, setStats] = useState({
    totalDocumentos: 0,
    approvalPending: 0,
    rejected: 0
  });
  const [previewDocs, setPreviewDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [checkboxFilters, setCheckboxFilters] = useState({
    vencidos: true,
    sinFecha: true,
    conFecha: true
  });
  const [selectedCard, setSelectedCard] = useState(null);
  const [empresasConVencidos, setEmpresasConVencidos] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const filters = [];
        if (selectedCompanyId) {
          filters.push(where("companyId", "==", selectedCompanyId));
        }

        const uploadedSnap = await getDocs(query(collection(db, "uploadedDocuments"), ...filters));
        let approvalPending = 0;
        let rejected = 0;
        let totalConVencimiento = 0;

        uploadedSnap.forEach(doc => {
          const data = doc.data();
          const exp = parseFirestoreDate(data.expirationDate);
          const diasRestantes = exp ? Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)) : null;

          if (data.expirationDate) totalConVencimiento++;
          if (data.status === "Pendiente de revisión") approvalPending++;
          if (data.status === "Rechazado") rejected++;
        });

        setStats({
          totalDocumentos: totalConVencimiento,
          approvalPending,
          rejected
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedCompanyId, companies]);

  useEffect(() => {
    const calcularEmpresasConVencidos = async () => {
      const hoy = new Date();

      try {
        const uploadedSnap = await getDocs(collection(db, "uploadedDocuments"));

        const empresasConDocumentosVencidos = new Set();

        uploadedSnap.forEach(doc => {
          const data = doc.data();
          const exp = parseFirestoreDate(data.expirationDate);
          const diasRestantes = exp ? Math.ceil((exp - hoy) / (1000 * 60 * 60 * 24)) : null;

          if (diasRestantes !== null && diasRestantes < 0) {
            empresasConDocumentosVencidos.add(data.companyId);
          }
        });

        const empresasNombres = companies
          .filter(c => empresasConDocumentosVencidos.has(c.id))
          .map(c => c.name);

        setEmpresasConVencidos(empresasNombres);
      } catch (err) {
        console.error("Error al calcular empresas con vencidos:", err);
      }
    };

    if (companies.length > 0) {
      calcularEmpresasConVencidos();
    }
  }, [companies]);

  useEffect(() => {
    const fetchPreview = async () => {
      const hoy = new Date();
      setLoading(true);
  
      try {
        const queryConstraints = [];
        if (selectedCompanyId) {
          queryConstraints.push(where('companyId', '==', selectedCompanyId));
        }
  
        const uploadedSnap = await getDocs(query(collection(db, "uploadedDocuments"), ...queryConstraints));
  
        const docs = await Promise.all(uploadedSnap.docs.map(async docSnap => {
          const data = docSnap.data();
          const exp = parseFirestoreDate(data.expirationDate);
          const diasRestantes = exp ? Math.ceil((exp - hoy) / (1000 * 60 * 60 * 24)) : null;
  
          // Obtener nombre de empresa
          const companyName = companies.find(c => c.id === data.companyId)?.name || "Sin empresa";
  
          // Determinar tipo de entidad visual
          let categoria = "Sin categoría";
          if (data.entityType === "employee") categoria = "Personal";
          else if (data.entityType === "company") categoria = "Empresa";
          else if (data.entityType === "vehicle") categoria = "Vehículo";
          else if (data.entityType === "other") categoria = "Otro";
  
          return {
            id: docSnap.id,
            ...data,
            name: data.fileName || "Sin nombre",
            expirationDate: exp,
            diasRestantes,
            status: data.status || "Sin estado",
            companyName,
            categoria,
            companyId: data.companyId
          };
        }));
  
        setPreviewDocs(docs.sort((a, b) => {
          if (a.diasRestantes !== null && b.diasRestantes !== null) return a.diasRestantes - b.diasRestantes;
          if (a.diasRestantes === null) return 1;
          return -1;
        }));
      } catch (err) {
        console.error("Error al cargar documentos:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPreview();
  }, [selectedCompanyId, showDetails, companies]);
  
  

  const getDeadlineColor = (diasRestantes) => {
    if (diasRestantes == null) return 'text.primary';
    if (diasRestantes < 0) return 'error.main';
    if (diasRestantes <= 5) return 'error.main';
    if (diasRestantes <= 10) return 'warning.main';
    return 'text.primary';
  };

  const getCompaniesStatusFromStats = (stats) => {
    if (stats.rejected > 0 || stats.approvalPending > 0) return "error";
    if (stats.totalDocumentos > 0) return "warning";
    return "success";
  };
  
  const companiesStatus = getCompaniesStatusFromStats(stats);
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Dashboard del Administrador
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4} md={3}>
          <StatCard
            title="En riesgo"
            value={empresasConVencidos.length}
            icon={<BusinessIcon color={empresasConVencidos.length > 0 ? 'error' : 'success'} />}
            color={empresasConVencidos.length > 0 ? 'error' : 'success'}
            onAction={() => {
              setShowDetails("TodasEmpresas");
              setSelectedCard('empresas');
            }}
            isSelected={selectedCard === 'empresas'}
            warningText={
              empresasConVencidos.length === 0
                ? '✓ Todas al día'
                : null
            }
            companiesAtRisk={empresasConVencidos}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <StatCard
            title="Por vencer"
            value={stats.totalDocumentos}
            icon={<ErrorIcon color="warning" />}
            color="error.light"
            onAction={() => {
              setShowDetails("TodosDocumentos");
              setSelectedCard('vencer');
            }}
            isSelected={selectedCard === 'vencer'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <StatCard
            title="Pendientes"
            value={stats.approvalPending}
            icon={<PendingIcon />}
            color="warning.main"
            onAction={() => {
              setShowDetails("Pendiente de revisión");
              setSelectedCard('pendientes');
            }}
            isSelected={selectedCard === 'pendientes'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <StatCard
            title="Rechazados"
            value={stats.rejected}
            icon={<CancelIcon />}
            color="error.main"
            onAction={() => {
              setShowDetails("Rechazado");
              setSelectedCard('rechazados');
            }}
            isSelected={selectedCard === 'rechazados'}
          />
        </Grid>
      </Grid>

      {showDetails && (
        <Box mt={4}>
          {loading ? (
            <Typography>Cargando...</Typography>
          ) : showDetails === "TodasEmpresas" ? (
            <EmpresasTable
              companies={companies}
              previewDocs={previewDocs}
              expandedRow={expandedRow}
              setExpandedRow={setExpandedRow}
            />
          ) : (
            <PreviewDocumentTable
              docs={previewDocs}
              filters={checkboxFilters}
              onFilterChange={setCheckboxFilters}
              getDeadlineColor={getDeadlineColor}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
