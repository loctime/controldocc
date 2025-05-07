// src/components/common/DocumentoCard.jsx
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Tooltip
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

const DocumentoCard = ({
  doc,
  uploaded,
  onUploadClick = () => {},
}) => {
  const getDaysToExpire = (doc) => {
    if (!doc?.deadline?.date && !doc?.expirationDate) return null;
    const date = new Date(doc?.expirationDate || doc?.deadline?.date);
    const diff = (date - new Date()) / (1000 * 60 * 60 * 24);
    return Math.floor(diff);
  };

  const days = getDaysToExpire(doc);
  const bgColor = days !== null
    ? days <= 0
      ? "rgba(244, 67, 54, 0.1)"
      : days <= 10
      ? "rgba(255, 152, 0, 0.1)"
      : "inherit"
    : "inherit";

  return (
    <Card
      sx={{
        backgroundColor: bgColor,
        border: '1px solid #ddd',
        '&:hover': { boxShadow: 3 },
        minHeight: 150
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <DescriptionIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            {doc.name || uploaded?.documentName || "Sin nombre"}
          </Typography>
        </Box>

        {uploaded ? (
          <>
            <Chip
              label={uploaded.status}
              size="small"
              color={
                uploaded.status === "Aprobado"
                  ? "success"
                  : uploaded.status === "Rechazado"
                  ? "error"
                  : "warning"
              }
            />
            {uploaded.status === "Rechazado" && uploaded.adminComment && (
              <Typography variant="caption" color="error" display="block">
                Motivo: {uploaded.adminComment}
              </Typography>
            )}
            
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Documento no cargado aún
          </Typography>
        )}

        {(uploaded?.status === "Aprobado" && uploaded.expirationDate) ? (
          <Typography variant="caption" display="block">
            Vence aprobado: {new Date(uploaded.expirationDate).toLocaleDateString()}
          </Typography>
        ) : doc.deadline?.date && (
          <Tooltip title={days <= 0 ? "¡Vencido!" : `Faltan ${days} días`}>
            <Box display="flex" alignItems="center" mt={1}>
              <Typography variant="caption">
                Vence requerido: {new Date(doc.deadline.date).toLocaleDateString()}
              </Typography>
              {days !== null && days <= 10 && (
                <WarningIcon fontSize="small" sx={{ ml: 1 }} color={days <= 0 ? "error" : "warning"} />
              )}
            </Box>
          </Tooltip>
        )}




<Box mt={2}>
          <Tooltip
            title={
              !uploaded
                ? "Subir nuevo documento"
                : uploaded.status === "Aprobado"
                  ? "Documento aprobado. Podés subir uno nuevo si querés actualizarlo."
                  : "Reemplazar el documento existente"
            }
          >
            <Box mt={2}>
  <Tooltip
    title={
      !uploaded
        ? "Subir nuevo documento"
        : uploaded.status === "Aprobado"
          ? "Documento aprobado. Podés subir uno nuevo si querés actualizarlo."
          : "Reemplazar el documento existente"
    }
  >
    <Button
      variant="outlined"
      size="small"
      onClick={() => {
        if (
          uploaded?.status === "Aprobado" &&
          days !== null &&
          days > 15
        ) {
          const confirmar = window.confirm(
            `Este documento fue aprobado y faltan ${days} días para su vencimiento.\n¿Deseás subir uno nuevo de todas formas?`
          );
          if (!confirmar) return;
        }

        onUploadClick(doc);
      }}
    >
      {!uploaded
        ? "Subir"
        : uploaded.status === "Aprobado"
          ? "Subir de nuevo"
          : "Reemplazar"}
    </Button>
  </Tooltip>
</Box>

          </Tooltip>
        </Box>

      </CardContent>
    </Card>
  );
};

export default DocumentoCard;
