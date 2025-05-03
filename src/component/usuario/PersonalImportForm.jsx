import React, { useState, useContext } from "react";
import { db } from "../../firebaseconfig";
import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { cleanFirestoreData } from "../../utils/cleanFirestoreData";

import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import Papa from 'papaparse';

const PersonalImportForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importedCount, setImportedCount] = useState(0);

  // Obtener información de la empresa desde localStorage
  const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
  const companyId = userCompanyData?.companyId;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar que sea un archivo CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError("Por favor sube un archivo CSV válido");
      return;
    }

    // Parsear el archivo CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV Parsed:", results);
        
        // Validar los datos
        const { data, errors } = validateCsvData(results.data);
        setCsvData(data);
        setValidationErrors(errors);
        
        if (errors.length > 0) {
          setError(`Se encontraron ${errors.length} errores en el archivo. Revisa la tabla de validación.`);
        } else if (data.length === 0) {
          setError("El archivo no contiene datos válidos.");
        } else {
          setError("");
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setError("Error al procesar el archivo CSV. Verifica el formato.");
      }
    });
    
    // Resetear el input de archivo
    e.target.value = null;
  };

  // Validar los datos del CSV
  const validateCsvData = (data) => {
    const validData = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque la fila 1 es el encabezado
      const validationResult = validatePersonalRow(row, rowNumber);
      
      if (validationResult.valid) {
        validData.push(validationResult.data);
      } else {
        errors.push(validationResult.error);
      }
    });

    return { data: validData, errors };
  };

  // Validar una fila de datos de personal
  const validatePersonalRow = (row, rowNumber) => {
    const requiredFields = ['nombre', 'apellido', 'dni', ];
    const missingFields = [];
    
    // Verificar campos requeridos
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: {
          row: rowNumber,
          message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
          data: row
        }
      };
    }
    
    // Validar DNI (solo números)
    const dni = row.dni.replace(/[^0-9]/g, '');
    if (dni.length < 7 || dni.length > 8) {
      return {
        valid: false,
        error: {
          row: rowNumber,
          message: `DNI inválido: ${row.dni}`,
          data: row
        }
      };
    }
    
    // Datos válidos
    return {
      valid: true,
      data: {
        nombre: row.nombre.trim(),
        apellido: row.apellido.trim(),
        dni: dni,
        companyId: companyId,
        createdAt: serverTimestamp(),
        importedAt: serverTimestamp()
      }
    };
  };

  const handleImport = async () => {
    if (!companyId) {
      setError("No se encontró información de la empresa.");
      return;
    }
    
    if (csvData.length === 0) {
      setError("No hay datos válidos para importar.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Usar batch para importar múltiples registros
      const batch = writeBatch(db);
      let count = 0;
      
      // Firebase permite hasta 500 operaciones por batch
      for (let i = 0; i < csvData.length; i++) {
        if (count >= 500) break; // Limitamos a 500 por seguridad
        
        const personalData = csvData[i];
        const newPersonalRef = doc(collection(db, "personal"));
        batch.set(newPersonalRef, cleanFirestoreData(personalData));
        count++;
      }
      
      await batch.commit();
      
      setImportedCount(count);
      setCsvData([]);
      setValidationErrors([]);
      setSuccess(true);
    } catch (err) {
      console.error("Error al importar personal:", err);
      setError("Error al importar el personal. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRow = (index) => {
    const newData = [...csvData];
    newData.splice(index, 1);
    setCsvData(newData);
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Importación Masiva de Personal
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Sube un archivo CSV con las siguientes columnas:
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Campos obligatorios:</strong> nombre, apellido, dni
          </Typography>
        </Alert>
        
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Seleccionar Archivo CSV
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={handleFileUpload}
          />
        </Button>
        
        {csvData.length > 0 && (
          <Typography variant="body2" component="span">
            {csvData.length} registros válidos listos para importar
          </Typography>
        )}
      </Box>
      
      {validationErrors.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="error" gutterBottom>
            Errores de validación:
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fila</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell>Datos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validationErrors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell>{error.row}</TableCell>
                    <TableCell>{error.message}</TableCell>
                    <TableCell>
                      {Object.entries(error.data)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      
      {csvData.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Vista previa de datos a importar:
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellido</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.nombre}</TableCell>
                    <TableCell>{row.apellido}</TableCell>
                    <TableCell>{row.dni}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveRow(index)}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {csvData.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        ... y {csvData.length - 10} registros más
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={loading || csvData.length === 0}
            startIcon={loading ? <CircularProgress size={24} /> : <CloudUploadIcon />}
          >
            {loading ? "Importando..." : "Importar Personal"}
          </Button>
        </>
      )}
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {importedCount} registros importados exitosamente
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PersonalImportForm;
