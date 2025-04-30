import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';  

/**
 * Componente que captura errores en sus componentes hijos
 * y muestra una interfaz de recuperación en lugar de que la aplicación falle
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI de recuperación
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de recuperación
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            m: 2, 
            textAlign: 'center',
            backgroundColor: (theme) => theme.palette.error.light + '20'
          }}
        >
          <Typography variant="h5" gutterBottom color="error">
            Algo salió mal
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Ha ocurrido un error en este componente. 
          </Typography>
          {process.env.NODE_ENV !== 'production' && (
            <Box sx={{ textAlign: 'left', mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Box>
          )}
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReset}
            startIcon={<RefreshIcon />}
          >
            Intentar de nuevo
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
