import React, { useEffect, useState } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSelectedCompany } from "../../contexts/selected-company-context";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CircularProgress,
  Divider,
  LinearProgress,
  Alert,
  AlertTitle,
  useTheme
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Upload as UploadIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

export default function AdminDashboard() {
  const { selectedCompanyId } = useSelectedCompany();
  const [stats, setStats] = useState({
    requiredDocuments: 0,
    uploadedDocuments: 0,
    pendingDocuments: 0,
    approvedDocuments: 0,
    rejectedDocuments: 0,
    recentlyUploaded: 0, // Documentos cargados en las últimas 24 horas
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const loadStats = async () => {
      if (!selectedCompanyId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const requiredDocsQuery = query(
          collection(db, "requiredDocuments"),
          where("companyId", "==", selectedCompanyId)
        );
        const uploadedDocsQuery = query(
          collection(db, "uploadedDocuments"),
          where("companyId", "==", selectedCompanyId)
        );

        const [requiredDocsSnapshot, uploadedDocsSnapshot] = await Promise.all([
          getDocs(requiredDocsQuery),
          getDocs(uploadedDocsQuery),
        ]);

        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let recentlyUploaded = 0;
        
        // Calcular la fecha de hace 24 horas
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        const oneDayAgoTimestamp = oneDayAgo.toISOString();

        uploadedDocsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === "pending") pending++;
          if (data.status === "approved") approved++;
          if (data.status === "rejected") rejected++;
          
          // Verificar si el documento fue cargado en las últimas 24 horas
          if (data.uploadedAt && data.uploadedAt > oneDayAgoTimestamp) {
            recentlyUploaded++;
          }
        });

        setStats({
          requiredDocuments: requiredDocsSnapshot.size,
          uploadedDocuments: uploadedDocsSnapshot.size,
          pendingDocuments: pending,
          approvedDocuments: approved,
          rejectedDocuments: rejected,
          recentlyUploaded: recentlyUploaded,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedCompanyId]);

  // Calcular el progreso de documentos subidos vs. requeridos
  const uploadProgress = stats.requiredDocuments > 0 
    ? Math.round((stats.uploadedDocuments / stats.requiredDocuments) * 100) 
    : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard del Administrador
      </Typography>

      {!selectedCompanyId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Información</AlertTitle>
          Selecciona una empresa para ver sus estadísticas detalladas
        </Alert>
      )}

      {selectedCompanyId && stats.recentlyUploaded > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Nuevos documentos cargados</AlertTitle>
          <strong>{stats.recentlyUploaded} documento{stats.recentlyUploaded !== 1 ? 's' : ''}</strong> ha{stats.recentlyUploaded !== 1 ? 'n' : ''} sido cargado{stats.recentlyUploaded !== 1 ? 's' : ''} en las últimas 24 horas.
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" component="span">
              Revísalos en la sección de <strong>Documentos Subidos</strong>.
            </Typography>
          </Box>
        </Alert>
      )}

      {selectedCompanyId && stats.pendingDocuments > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Documentos pendientes de verificación</AlertTitle>
          Hay <strong>{stats.pendingDocuments} documento{stats.pendingDocuments !== 1 ? 's' : ''}</strong> pendiente{stats.pendingDocuments !== 1 ? 's' : ''} de verificación para esta empresa.
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" component="span">
              Por favor, revísalos en la sección de <strong>Documentos Subidos</strong> para aprobarlos o rechazarlos.
            </Typography>
          </Box>
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Documentos Requeridos" 
              value={stats.requiredDocuments} 
              icon={<DescriptionIcon />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Documentos Subidos" 
              value={stats.uploadedDocuments} 
              icon={<UploadIcon />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Pendientes de Aprobación" 
              value={stats.pendingDocuments} 
              icon={<PendingIcon />}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Documentos Aprobados" 
              value={stats.approvedDocuments} 
              icon={<CheckCircleIcon />}
              color={theme.palette.success.dark}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard 
              title="Documentos Rechazados" 
              value={stats.rejectedDocuments} 
              icon={<CancelIcon />}
              color={theme.palette.error.main}
            />
          </Grid>
          
          {/* Progreso general */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Progreso General
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${uploadProgress}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats.uploadedDocuments} de {stats.requiredDocuments} documentos completados
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            backgroundColor: `${color}20`, // Color con 20% de opacidad
            borderRadius: '50%',
            p: 1,
            mr: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {React.cloneElement(icon, { sx: { color } })}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="h3" component="div" fontWeight="bold" align="center" sx={{ mt: 2 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
//