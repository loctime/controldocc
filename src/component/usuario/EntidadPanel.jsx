import React from "react";
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Tooltip,
  Box
} from "@mui/material";
import { getDeadlineColor } from '../../utils/getDeadlineColor';

export default function EntidadPanel({
  title,
  entityType,
  entityList = [],
  documentosRequeridos = [],
  documentosSubidos = [],
  onVerMas = () => {},
  onUploadDirect = () => {},
  renderIdentificadores = () => null,
  maxDocumentos = 5,
  formatDate = (value) => {
    if (!value) return null;
    if (typeof value === "string") return new Date(value).toLocaleDateString();
    if (value?.seconds) return new Date(value.seconds * 1000).toLocaleDateString();
    return null;
  }
}) {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title} ({entityList.length})
      </Typography>

      {entityList.length === 0 ? (
        <Typography color="textSecondary">
          No hay elementos registrados para esta entidad.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {renderIdentificadores("header")}
                {[...documentosRequeridos]
                  .filter(doc => doc.entityType === entityType)
                  .slice(0, maxDocumentos)
                  .map(doc => (
                    <TableCell key={doc.id}>
                      <b>{doc.name}</b>
                    </TableCell>
                  ))}
                <TableCell><b>Ver Más</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entityList.map(entidad => (
                <TableRow key={entidad.id}>
                  {renderIdentificadores("row", entidad)}

                  {[...documentosRequeridos]
                    .filter(doc => doc.entityType === entityType)
                    .slice(0, maxDocumentos)
                    .map(doc => {
                      const uploaded = documentosSubidos.find(
                        up => up.entityId === entidad.id && up.requiredDocumentId === doc.id
                      );

                      const rawDate = uploaded?.expirationDate;
                      const vencimiento = formatDate(rawDate);
                      const color = rawDate ? getDeadlineColor(rawDate) : "textSecondary";

                      return (
                        <TableCell key={doc.id}>
                          <Box
                            sx={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
                            onClick={() => onUploadDirect(entidad, doc.id)}
                          >
                            <Typography
                              color={
                                uploaded?.status === "Aprobado"
                                  ? "success.main"
                                  : uploaded?.status === "Rechazado"
                                  ? "error.main"
                                  : "warning.main"
                              }
                              variant="body2"
                              fontWeight="normal"
                            >
                              {uploaded?.status || "Pendiente"}
                            </Typography>
                            {vencimiento && (
                              <Typography variant="caption" color={color}>
                                Vence: {vencimiento}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}

                  <TableCell>
                    <Tooltip title="Ver todos los documentos" arrow>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onVerMas(entidad)}
                      >
                        Ver Más
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
