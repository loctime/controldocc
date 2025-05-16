// src/component/administrador/dashboard/PreviewDocumentTable.jsx
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tooltip,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";

export default function PreviewDocumentTable({
  docs,
  filters,
  onFilterChange,
  getDeadlineColor
}) {
  const navigate = useNavigate();

  const visibleDocs = docs.filter((doc) => {
    if (doc.diasRestantes == null) return filters.sinFecha;
    if (doc.diasRestantes < 0) return filters.vencidos;
    return filters.conFecha;
  });

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.vencidos}
              onChange={(e) =>
                onFilterChange({ ...filters, vencidos: e.target.checked })
              }
            />
          }
          label="Vencidos"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.conFecha}
              onChange={(e) =>
                onFilterChange({ ...filters, conFecha: e.target.checked })
              }
            />
          }
          label="Con fecha"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.sinFecha}
              onChange={(e) =>
                onFilterChange({ ...filters, sinFecha: e.target.checked })
              }
            />
          }
          label="Sin fecha"
        />
      </Box>

      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Box sx={{ display: "flex", fontWeight: "bold", p: 1, bgcolor: "#f5f5f5" }}>
          <Box sx={{ flex: 2 }}>Empresa</Box>
          <Box sx={{ flex: 2 }}>Categoría</Box>
          <Box sx={{ flex: 2 }}>Documento</Box>
          <Box sx={{ flex: 1 }}>Vencimiento</Box>
        </Box>

        {visibleDocs.map((doc) => (
          <Box key={doc.id} sx={{ display: "flex", p: 1, borderTop: "1px solid #eee" }}>
            <Box sx={{ flex: 2 }}>{doc.companyName}</Box>
            <Box sx={{ flex: 2 }}>{doc.category}</Box>
            <Box sx={{ flex: 2 }}>{doc.name}</Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ color: getDeadlineColor(doc.diasRestantes) }}>
                  {doc.expirationDate instanceof Date && !isNaN(doc.expirationDate)
                    ? doc.expirationDate.toLocaleDateString()
                    : "Sin fecha"}
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
                  doc.status === "Aprobado"
                    ? "success"
                    : doc.status === "Rechazado"
                    ? "error"
                    : "warning"
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
  );
}
