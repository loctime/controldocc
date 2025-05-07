import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DownloadButton({ url, filename = 'archivo', label = 'Descargar' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!url) {
      setError('URL no válida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/force-download?url=${encodeURIComponent(url)}&filename=${filename}`
      );

      if (!response.ok) throw new Error('Error al obtener archivo del servidor');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError('Error al descargar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={error || ''}>
      <span>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
          onClick={handleDownload}
          disabled={loading || !url}
        >
          {label}
        </Button>
      </span>
    </Tooltip>
  );
}
