// src/component/usuario/components/DocumentosPanel/DocumentosList.jsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const getStatusColor = (status) => {
  switch (status) {
    case 'Aprobado':
      return 'success.main';
    case 'Rechazado':
      return 'error.main';
    case 'Pendiente de revisión':
      return 'warning.main';
    default:
      return 'text.secondary';
  }
};

export default function DocumentosList({
  requiredDocuments,
  uploadedDocuments,
  setTabValue,
  getDeadlineColor
}) {
  const documentosOrdenados = [...requiredDocuments]
    .map((doc) => {
      const uploaded = uploadedDocuments.find(
        (up) => up.requiredDocumentId === doc.id
      );
      return {
        ...doc,
        uploaded,
        status: uploaded?.status || 'Pendiente para subir',
        expiration: uploaded?.expirationDate
          ? new Date(uploaded.expirationDate)
          : null,
      };
    })
    .sort((a, b) => {
      const estadoOrden = {
        Rechazado: 0,
        'Pendiente de revisión': 1,
        'Pendiente para subir': 2,
        Aprobado: 3,
      };
      if (estadoOrden[a.status] !== estadoOrden[b.status]) {
        return estadoOrden[a.status] - estadoOrden[b.status];
      }
      if (a.expiration && b.expiration) return a.expiration - b.expiration;
      if (a.expiration) return -1;
      if (b.expiration) return 1;
      return 0;
    });

  return (
    <List>
      {documentosOrdenados.map((doc) => (
        <React.Fragment key={doc.id}>
          <ListItem
            alignItems="flex-start"
            secondaryAction={
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                onClick={() => {
                  if (doc.entityType === 'company') setTabValue(3);
                  else if (doc.entityType === 'employee') setTabValue(1);
                  else if (doc.entityType === 'vehicle') setTabValue(2);
                }}
              >
                Subir Documento
              </Button>
            }
          >
            <ListItemIcon>
              <DescriptionIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={doc.name}
              secondaryTypographyProps={{ component: 'div' }}
              secondary={
                <>
                  <Typography variant="body2">
                    Aplicable a: {doc.entityType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {doc.description || 'Sin descripción'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: getStatusColor(doc.status) }}>
                    Estado: {doc.status}
                  </Typography>
                  {doc.expiration && (
                    <Typography variant="body2" color={getDeadlineColor(doc.expiration)}>
                      Vence: {doc.expiration.toLocaleDateString()}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );
}
