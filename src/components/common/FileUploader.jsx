import React, { useState } from "react";
import { Button, CircularProgress, Typography } from "@mui/material";
import { uploadFile } from "../../utils/FileUploadService";

export default function FileUploader({ 
  onUploadComplete, 
  folder,
  allowedTypes = ["*/*"],
  isAdmin = false,
  metadata = null
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    
    console.log('[FileUploader] Archivo seleccionado:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      isValid: file instanceof File
    });

    if (!file) {
      console.error('[FileUploader] Error: No se seleccionó archivo');
      setError("Seleccione un archivo válido");
      return;
    }

    // Validación de tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error(`[FileUploader] Error: Archivo demasiado grande (${file.size} bytes)`);
      setError("El archivo excede el tamaño máximo (5MB)");
      return;
    }

    try {
      await validateFile(file);
      console.log('[FileUploader] Iniciando subida...', { folder, metadata });
      setIsUploading(true);
      setError(null);
      
      const result = await uploadFile(file, folder, { metadata });
      
      console.log('[FileUploader] Subida exitosa:', result);
      onUploadComplete(result);
    } catch (error) {
      console.error('[FileUploader] Error en subida:', error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const validateFile = async (file) => {
    try {
      if (!file || !(file instanceof File)) {
        console.error('[DEBUG] Archivo inválido:', file);
        throw new Error('Archivo no válido');
      }

      console.log('[DEBUG] FileUploader - Archivo a subir:', file.name, 'size:', file.size);
    } catch (error) {
      console.error('[DEBUG] FileUploader - Error en validación:', error);
      throw error;
    }
  };

  return (
    <div>
      <Button 
        variant="contained" 
        component="label"
        disabled={isUploading}
      >
        {isUploading ? 'Subiendo...' : 'Seleccionar Archivo'}
        <input 
          type="file" 
          hidden 
          accept={allowedTypes.join(',')}
          onChange={handleUpload} 
        />
      </Button>
      
      {error && (
        <Typography color="error" variant="body2" mt={1}>
          {error}
        </Typography>
      )}
      
      {isUploading && <CircularProgress size={24} sx={{ ml: 2 }} />}
    </div>
  );
}