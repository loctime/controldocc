import { Paper, Typography, Box } from '@mui/material';
import Logo from '../../../../components/common/Logo';

export default function CompanyHeader({ company }) {
  if (!company) return null;

  return (
    <Paper elevation={2} sx={{ 
      p: 3, 
      mb: 4, 
      display: 'flex', 
      alignItems: 'center',
      gap: 3,
      flexWrap: 'wrap'
    }}>
      <Logo companyId={company.id} height={80} variant="company" sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="h6" fontWeight="bold">{company.companyName || company.name}</Typography>
        <Typography variant="subtitle1" color="textSecondary">
          CUIT: {company.cuit || "No registrado"}
        </Typography>
      </Box>
    </Paper>
  );
}
