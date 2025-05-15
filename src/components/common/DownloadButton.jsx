import React, { forwardRef } from 'react';
import { Button, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';

export default forwardRef(function DownloadButton({
  url,
  filename,
  label = 'Descargar',
  iconOnly = false,
  startIcon = true,
  variant = 'contained',
  size = 'medium',
  disabled = false,
  autoTrigger = false,
  onClick
}, ref) {
  const handleDownload = async () => {
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al descargar el archivo');

      const contentType = response.headers.get('Content-Type');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Obtener nombre desde la URL si no se pasó como prop
      let nameFromURL = url.split('/').pop().split('?')[0] || 'archivo';
      const extension = getExtensionFromContentType(contentType);
      const finalFilename = filename
        ? (filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`)
        : (nameFromURL.includes('.') ? nameFromURL : `${nameFromURL}.${extension}`);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
    }
  };

  const getExtensionFromContentType = (type) => {
    const map = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/zip': 'zip',
      'text/plain': 'txt',
    };
    return map[type] || 'bin';
  };

  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    setLoading(true);
    await handleDownload();
    setLoading(false);
  };

  return iconOnly ? (
    <Tooltip title={label}>
      <IconButton 
        onClick={handleClick} 
        disabled={disabled || loading} 
        size={size}
        ref={ref}
      >
        {loading ? <CircularProgress size={24} /> : <Download />}
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      variant={variant}
      size={size}
      startIcon={startIcon && !loading ? <Download /> : null}
      ref={ref}
    >
      {loading ? <CircularProgress size={24} /> : label}
    </Button>
  );
});
