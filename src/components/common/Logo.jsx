import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { db } from '../../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import defaultLogo from '../../assets/logos/controldoc-logo.jpg';

/**
 * Componente Logo que muestra el logo de ControlDoc o el logo personalizado de la empresa
 * @param {Object} props - Propiedades del componente
 * @param {string} props.companyId - ID de la empresa (opcional)
 * @param {number} props.height - Altura del logo (opcional, por defecto 50px)
 * @param {string} props.variant - Variante del logo ('default' o 'company', por defecto 'company')
 * @returns {JSX.Element} Componente Logo
 */
const Logo = ({ companyId, height = 50, variant = 'company' }) => {
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        // Si no hay companyId o la variante es 'default', no buscar logo personalizado
        if (!companyId || variant === 'default') {
          setLoading(false);
          return;
        }

        // Buscar el logo en la colección de configuración de empresas
        const configRef = doc(db, 'companyConfig', companyId);
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists() && configSnap.data().logoUrl) {
          setCompanyLogo(configSnap.data().logoUrl);
        }
      } catch (error) {
        console.error('Error al cargar el logo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyLogo();
  }, [companyId, variant]);

  // Si está cargando, mostrar un espacio reservado
  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">Cargando...</Typography>
      </Box>
    );
  }

  // Si hay un logo de empresa y la variante es 'company', mostrarlo
  if (companyLogo && variant === 'company') {
    return (
      <Box 
        component="img" 
        src={companyLogo} 
        alt="Logo de la empresa" 
        sx={{ 
          height, 
          objectFit: 'contain',
          maxWidth: '100%'
        }} 
      />
    );
  }

  // Por defecto, mostrar el logo de ControlDoc
  return (
    <Box 
      component="img" 
      src={defaultLogo} 
      alt="ControlDoc Logo" 
      sx={{ 
        height, 
        objectFit: 'contain',
        maxWidth: '100%'
      }} 
    />
  );
};

export default Logo;
