import { Card, CardContent, CardActions, Typography, Divider, IconButton, Tooltip } from '@mui/material';
import { Description as DescriptionIcon, Delete as DeleteIcon } from '@mui/icons-material';

const DocumentCard = ({ document, onDelete, theme }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <DescriptionIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" noWrap>{document.name}</Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>Aplicable a:</strong> {document.entityType}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Vencimiento:</strong> {document.deadline?.type}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Eliminar documento">
          <IconButton color="error" onClick={() => onDelete(document.id)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default DocumentCard;