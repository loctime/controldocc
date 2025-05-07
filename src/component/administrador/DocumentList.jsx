import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, CircularProgress, Chip, Tooltip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseconfig';

export default function DocumentList({ type, companyId = null }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusMap = {
    Pendientes: 'Pendiente de revisión',
    Aprobados: 'Aprobado',
    Rechazados: 'Rechazado'
  };

  const statusColor = {
    'Pendiente de revisión': 'warning',
    'Aprobado': 'success',
    'Rechazado': 'error'
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const filters = [where('status', '==', statusMap[type])];

        if (companyId && typeof companyId === 'string' && companyId.trim() !== '') {
          filters.push(where('companyId', '==', companyId));
        }

        const snapshot = await getDocs(query(collection(db, 'uploadedDocuments'), ...filters));

        const docsWithDetails = await Promise.all(snapshot.docs.map(async docSnap => {
          const data = docSnap.data();
          let companyName = 'Desconocida';
          let requiredDocName = '';

          if (data.companyId && typeof data.companyId === 'string') {
            const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
            if (companyDoc.exists()) {
              companyName = companyDoc.data().name || 'Sin nombre';
            }
          }

          if (data.requiredDocumentId && typeof data.requiredDocumentId === 'string') {
            const requiredDocSnap = await getDoc(doc(db, 'requiredDocuments', data.requiredDocumentId));
            if (requiredDocSnap.exists()) {
              requiredDocName = requiredDocSnap.data().name || '';
            }
          }

          return {
            id: docSnap.id,
            companyName,
            requiredDocName,
            ...data
          };
        }));

        setDocuments(
          docsWithDetails.sort((a, b) => {
            const aDate = a.expirationDate ? new Date(a.expirationDate) : new Date('9999-12-31');
            const bDate = b.expirationDate ? new Date(b.expirationDate) : new Date('9999-12-31');
            return aDate - bDate;
          })
        );
      } catch (error) {
        console.error("Error al cargar documentos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [type, companyId]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Documentos {type}
      </Typography>

      {loading ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : documents.length === 0 ? (
        <Typography>No se encontraron documentos {type.toLowerCase()}.</Typography>
      ) : (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Comentario</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => {
                const vencimiento = doc.expirationDate ? new Date(doc.expirationDate) : null;
                const diasRestantes = vencimiento ? Math.ceil((vencimiento - new Date()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.companyName}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {doc.requiredDocName || 'Sin título'}
                    </TableCell>
                    <TableCell>{doc.comment || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>
                          {vencimiento ? vencimiento.toLocaleDateString() : 'Sin fecha'}
                        </Typography>
                        {diasRestantes !== null && diasRestantes <= 10 && (
                          <Tooltip title={`Faltan ${diasRestantes} días`}>
                            {diasRestantes <= 5 ? (
                              <ErrorOutlineIcon sx={{ color: 'error.main' }} />
                            ) : (
                              <WarningIcon sx={{ color: 'warning.main' }} />
                            )}
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        color={statusColor[doc.status] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
