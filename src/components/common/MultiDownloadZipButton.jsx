import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function MultiDownloadZipButton({
  files = [], // Array de { url, filename }
  label = 'Descargar ZIP',
  iconOnly = false,
  startIcon = true,
  variant = 'contained',
  size = 'medium',
  disabled = false,
  zipName = 'archivos.zip'
}) {
  const handleDownloadZip = async () => {
    if (!files || files.length === 0) return;

    const zip = new JSZip();

    await Promise.all(
      files.map(async ({ url, filename }, index) => {
        if (!url || !filename) return;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Error al descargar ${filename}`);
          const blob = await response.blob();
          zip.file(filename, blob);
        } catch (err) {
          console.error(`Error con ${filename}:`, err);
        }
      })
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, zipName);
  };

  return iconOnly ? (
    <Tooltip title={label}>
      <span>
        <IconButton onClick={handleDownloadZip} disabled={disabled} size={size}>
          <Download />
        </IconButton>
      </span>
    </Tooltip>
  ) : (
    <Button
      onClick={handleDownloadZip}
      disabled={disabled}
      variant={variant}
      size={size}
      startIcon={startIcon ? <Download /> : null}
    >
      {label}
    </Button>
  );
}
