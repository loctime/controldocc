//src/component/administrador/dashboard/EmpresaTable.jsx
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Chip,
  Box
} from "@mui/material";

export default function EmpresasTable({
  companies,
  previewDocs,
  expandedRow,
  setExpandedRow,
}) {
  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Empresa</TableCell>
            <TableCell align="center">Aprobados</TableCell>
            <TableCell align="center">Vencidos</TableCell>
            <TableCell align="center">Rechazados</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {companies.map((company) => {
            const docsEmpresa = previewDocs
              .filter((doc) => doc.companyId === company.id)
              .sort((a, b) => {
                if (a.diasRestantes === null && b.diasRestantes === null) return 0;
                if (a.diasRestantes === null) return 1;
                if (b.diasRestantes === null) return -1;
                return a.diasRestantes - b.diasRestantes;
              });
            const isExpanded = expandedRow === company.id;

            const aprobados = docsEmpresa.filter((d) => d.status === "Aprobado").length;
            const vencidos = docsEmpresa.filter((d) => d.diasRestantes !== null && d.diasRestantes <= 0).length;
            const rechazados = docsEmpresa.filter((d) => d.status === "Rechazado").length;

            return (
              <React.Fragment key={company.id}>
                <TableRow hover>
                <TableCell>{company.name || company.companyName || "Sin nombre"}</TableCell>
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
                      {isExpanded ? "Ocultar" : "Ver docs"}
                    </Button>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ padding: 0, backgroundColor: "#f9f9f9" }}>
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
                            {docsEmpresa.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell>{doc.name || "Sin nombre"}</TableCell>
                                <TableCell>
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
                                  />
                                </TableCell>
                                <TableCell>
                                  {doc.expirationDate?.toLocaleDateString() || "Sin fecha"}
                                </TableCell>
                                <TableCell>
                                  {doc.diasRestantes !== null
                                    ? doc.diasRestantes <= 0
                                      ? `Vencido (${Math.abs(doc.diasRestantes)} días)`
                                      : doc.diasRestantes
                                    : "N/A"}
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
  );
}
