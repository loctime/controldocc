import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useCompany } from "../../contextos/company-context";
import { parseFirestoreDate } from "../../utils/dateHelpers";
import { WarningAmber as WarningAmberIcon } from "@mui/icons-material";
import { FormControlLabel } from "@mui/material";
import { Checkbox } from "@mui/material";

import {
  Box, Typography, Grid, Card, CardContent, Divider, Tooltip,
  Button, Paper, Chip
} from "@mui/material";
import {
  Cancel as CancelIcon,
  Pending as PendingIcon,
  HourglassEmpty as UploadPendingIcon
} from "@mui/icons-material";

export default function AdminDashboard() {
  const { selectedCompanyId, companies } = useCompany();
  const [stats, setStats] = useState({ totalDocumentos: 0, approvalPending: 0, rejected: 0 });
  const [showDetails, setShowDetails] = useState(null);
  const [previewDocs, setPreviewDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [checkboxFilters, setCheckboxFilters] = useState({
    vencidos: true,
    sinFecha: true,
    conFecha: true
  });
  
  const { selectedCompanyName } = useCompany();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const filters = selectedCompanyId ? [where("companyId", "==", selectedCompanyId)] : [];
        const uploadedSnap = await getDocs(query(collection(db, "uploadedDocuments"), ...filters));

        let approvalPending = 0;
        let rejected = 0;
        let totalConVencimiento = 0;

        uploadedSnap.forEach(doc => {
          const data = doc.data();
          if (data.expirationDate) totalConVencimiento++;
          if (data.status === "Pendiente de revisión") approvalPending++;
          if (data.status === "Rechazado") rejected++;
        });

        setStats({ totalDocumentos: totalConVencimiento, approvalPending, rejected });
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
      if (!showDetails) return;
      setPreviewDocs([]);
      setLoading(true);

      try {
        let docs = [];

        const baseQuery = collection(db, "uploadedDocuments");
        const uploadedSnap = showDetails === "TodosDocumentos"
          ? await getDocs(baseQuery)
          : await getDocs(query(
              baseQuery,
              ...(selectedCompanyId ? [where("companyId", "==", selectedCompanyId)] : []),
              where("status", "==", showDetails)
            ));

        const hoy = new Date();

        const docsFiltrados = await Promise.all(uploadedSnap.docs.map(async docSnap => {
          const data = docSnap.data();

          if (selectedCompanyId && data.companyId !== selectedCompanyId) return null;

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
            name: requiredName || data.fileName || "Sin nombre",
            expirationDate: exp,
            diasRestantes,
            status: data.status || "Sin estado",
          };
        }));

        docs = docsFiltrados
        .filter(Boolean)
        .sort((a, b) => {
          // 1. Vencidos primero
          if (a.diasRestantes !== null && b.diasRestantes !== null) {
            return a.diasRestantes - b.diasRestantes;
          }
      
          // 2. Si uno no tiene fecha, lo manda al final
          if (a.diasRestantes === null && b.diasRestantes !== null) return 1;
          if (a.diasRestantes !== null && b.diasRestantes === null) return -1;
      
          // 3. Ambos sin fecha
          return 0;
        });
              setPreviewDocs(docs);
      } catch (err) {
        console.error("Error al cargar documentos preview:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [showDetails, selectedCompanyId]);

  const getDeadlineColor = diasRestantes => {
    if (diasRestantes == null) return 'text.primary';
    if (diasRestantes < 0) return 'error.main';
    if (diasRestantes <= 5) return 'error.main';
    if (diasRestantes <= 10) return 'warning.main';
    return 'text.primary';
  };

  const StatCard = ({ title, value, icon, color, filterKey }) => (
    <Grid item xs={12} sm={4} md={4}>
      <Card elevation={1} sx={{ height: "100%", p: 1 }}>
        <CardContent sx={{ p: 1.2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Tooltip title={title} arrow>
              <Box sx={{ color, display: "flex" }}>{icon}</Box>
            </Tooltip>
            <Typography variant="subtitle2" fontWeight={600} fontSize={13}>{title}</Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <Typography variant="h5" align="center" fontWeight="bold">{value}</Typography>
          <Box mt={1} display="flex" justifyContent="center" gap={1}>
            <Button size="small" onClick={() => setShowDetails(filterKey)}>Ver todos</Button>
            {filterKey !== "TodosDocumentos" && (
              <Button 
                size="small" 
                onClick={() => navigate(
                  `/admin/uploaded-documents?filter=${encodeURIComponent(filterKey)}${selectedCompanyId ? `&empresa=${selectedCompanyId}` : ''}`
                )}
              >
                Ir a resolver
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
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">Dashboard del Administrador</Typography>

      <Grid container spacing={2}>
        <StatCard
          title="Proximos a vencer"
          value={stats.totalDocumentos}
          icon={<UploadPendingIcon />}
          color="info.main"
          filterKey="TodosDocumentos"
        />
        <StatCard
          title="Pendientes de Aprobación"
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
          <Typography variant="h6" mb={2}>
            {selectedCompanyId
              ? `${selectedCompanyName} - Documentos...`
              : "Todos los documentos - ..."}
          </Typography>

          {loading ? (
            <Typography>Cargando...</Typography>
          ) : previewDocs.length === 0 ? (
            <Typography>No hay documentos para mostrar.</Typography>
          ) : (
            <Box sx={{ maxWidth: 600 }}>
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

              <Paper variant="outlined">
                <Box sx={{ display: 'flex', fontWeight: 'bold', p: 1, bgcolor: '#f5f5f5' }}>
                  <Box sx={{ flex: 2 }}>Documento</Box>
                  <Box sx={{ flex: 1 }}>Vencimiento</Box>
                </Box>
                {visibleDocs.map(doc => (
  <Box key={doc.id} sx={{ display: 'flex', p: 1, borderTop: '1px solid #eee' }}>
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
