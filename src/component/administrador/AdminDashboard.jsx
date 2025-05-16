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
  }, [selectedCompanyId]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!showDetails) {
        setPreviewDocs([]);
        return;
      }

      setLoading(true);
      const hoy = new Date();

      try {
        const queryConstraints = [];
        if (selectedCompanyId) {
          queryConstraints.push(where("companyId", "==", selectedCompanyId));
        }
        if (showDetails !== "TodosDocumentos" && showDetails !== "TodasEmpresas") {
          queryConstraints.push(where("status", "==", showDetails));
        }

        const uploadedSnap = await getDocs(query(collection(db, "uploadedDocuments"), ...queryConstraints));

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
          if (a.diasRestantes !== null && b.diasRestantes !== null) return a.diasRestantes - b.diasRestantes;
          if (a.diasRestantes === null) return 1;
          return -1;
        }));
      } catch (err) {
        console.error("Error al cargar documentos:", err);
        setPreviewDocs([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPreview();
    }, 300);

    return () => clearTimeout(timer);
  }, [showDetails, selectedCompanyId, companies]);

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
            title="Empresas"
            value={companies.length}
            icon={<BusinessIcon color={companiesStatus === 'success' ? 'success' : 'warning'} />}
            color={companiesStatus === 'error' ? 'error' : companiesStatus === 'warning' ? 'warning' : 'success'}
            onAction={() => {
              setShowDetails("TodasEmpresas");
              setSelectedCard('empresas');
            }}
            isSelected={selectedCard === 'empresas'}
            warningText={
              companiesStatus === 'error'
                ? '⚠ rechazos'
                : companiesStatus === 'warning'
                ? '⚠ vencimientos'
                : '✓ al día'
            }
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
