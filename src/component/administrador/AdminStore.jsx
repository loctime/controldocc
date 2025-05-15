// src/component/administrador/AdminStore.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { Delete, InsertDriveFile, PictureAsPdf, Image, Description, Upload, Visibility, Download, Share, Close } from "@mui/icons-material";
import FileUploader from "../../components/common/FileUploader"; // Asegurate de tener este componente
import { db } from "../../firebaseconfig";
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc } from "firebase/firestore";
import { auth } from "../../firebaseconfig"; // Agregar import de auth
import DownloadButton from '../../components/common/DownloadButton'; // Importar componente DownloadButton

const fileIcons = {
  pdf: <PictureAsPdf color="error" />,
  jpg: <Image color="primary" />,
  jpeg: <Image color="primary" />,
  png: <Image color="primary" />,
  gif: <Image color="primary" />,
  doc: <Description color="action" />,
  docx: <Description color="action" />,
  default: <InsertDriveFile color="disabled" />
};

const getFileExtension = (filename) => {
  if (!filename) return "default";
  const parts = String(filename).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "default";
};

const getFileType = (file) => {
  if (!file?.type && file?.name) {
    const ext = file.name.split('.').pop().toLowerCase();
    const typeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return typeMap[ext] || 'unknown';
  }
  return file?.type || 'unknown';
};

export default function AdminStore() {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("general");
  const [newFolderName, setNewFolderName] = useState("");
  const [filesByFolder, setFilesByFolder] = useState({});
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  useEffect(() => {
    // Cargar carpetas desde Firestore
    const foldersRef = collection(db, "adminFolders");
    
    const unsubscribe = onSnapshot(foldersRef, (snapshot) => {
      const foldersData = ["general"]; // Carpeta general por defecto
      const filesData = { general: [] };
      
      snapshot.forEach((doc) => {
        foldersData.push(doc.id);
        filesData[doc.id] = [];
      });
      
      setFolders(foldersData);
      setFilesByFolder(filesData);
      
      // Cargar archivos para cada carpeta
      foldersData.forEach(folder => {
        const filesRef = collection(db, `adminFolders/${folder}/files`);
        getDocs(filesRef).then(filesSnap => {
          const folderFiles = [];
          filesSnap.forEach(fileDoc => {
            folderFiles.push(fileDoc.data());
          });
          setFilesByFolder(prev => ({
            ...prev,
            [folder]: folderFiles
          }));
        });
      });
    });
    
    return () => unsubscribe();
  }, []);

  const handleUploadComplete = async (result) => {
    if (!result?.url) return;

    const fileData = {
      name: result.fileName,
      description: result.fileDescription || "",
      url: result.url,
      type: result?.fileType || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.currentUser?.uid || "unknown",
      id: result.fileId || Date.now().toString()
    };

    try {
      await setDoc(
        doc(db, `adminFolders/${currentFolder}/files`, fileData.id),
        fileData
      );
      
      setFilesByFolder((prev) => ({
        ...prev,
        [currentFolder]: [...(prev[currentFolder] || []), fileData]
      }));

    } catch (error) {
      console.error("Error guardando metadatos:", error);
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim().toLowerCase();
    if (name && !folders.includes(name)) {
      try {
        await setDoc(doc(db, "adminFolders", name), {
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser.uid
        });
        setCurrentFolder(name);
        setNewFolderName("");
      } catch (error) {
        console.error("Error creando carpeta:", error);
      }
    }
  };

  const handleDeleteFile = async (index) => {
    try {
      const file = filesByFolder[currentFolder][index];
      if (file.id) {
        await deleteDoc(doc(db, `adminFolders/${currentFolder}/files`, file.id));
      }
    } catch (error) {
      console.error("Error eliminando archivo:", error);
    }
    
    const updatedFiles = [...filesByFolder[currentFolder]];
    updatedFiles.splice(index, 1);
    setFilesByFolder((prev) => ({ ...prev, [currentFolder]: updatedFiles }));
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Biblioteca Interna</Typography>

      {/* Selector de carpeta y creador */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FormControl>
          <InputLabel>Carpeta</InputLabel>
          <Select
            value={currentFolder}
            label="Carpeta"
            onChange={(e) => setCurrentFolder(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {folders.map((folder) => (
              <MenuItem key={folder} value={folder}>{folder}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Nueva carpeta"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={handleCreateFolder}>Crear</Button>
      </Box>

      {/* Uploader */}
      <Box mb={3}>
        <Typography variant="subtitle1" mb={1}>Subir archivo a <b>{currentFolder}</b>:</Typography>
        
        <FileUploader
          onUploadComplete={handleUploadComplete}
          folder={`admin/library/${currentFolder}`}
        />
      </Box>

      {/* Vista de archivos */}
      <Typography variant="h6" gutterBottom>Archivos en {currentFolder}:</Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de archivos">
          <TableHead>
            <TableRow>
              <TableCell>Carpeta</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Vista Previa</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filesByFolder[currentFolder]?.map((file, index) => {
              const safeFile = file || {};
              const ext = getFileExtension(safeFile.name);
              const icon = fileIcons[ext] || fileIcons.default;
              
              return (
                <TableRow key={safeFile.id || index}>
                  <TableCell>{currentFolder}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {icon}
                      <Typography variant="body2">
                        {safeFile.name || "Sin nombre"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {safeFile.description || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      startIcon={<Visibility />}
                      onClick={() => handlePreview(safeFile)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <DownloadButton 
                        url={safeFile.url}
                        filename={safeFile.name}
                        variant="outlined"
                        size="small"
                        startIcon={true}
                        label="Descargar"
                      />
                      <Button 
                        size="small" 
                        startIcon={<Share />}
                        onClick={() => console.log('Compartir', safeFile)}
                      >
                        Compartir
                      </Button>
                      <IconButton 
                        onClick={() => handleDeleteFile(index)} 
                        size="small"
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {filesByFolder[currentFolder]?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    No hay archivos en esta carpeta
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de vista previa */}
      <Dialog 
        open={previewOpen} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Vista previa de {previewFile?.name}
          <IconButton
            onClick={handleClosePreview}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewFile && (() => {
            const fileType = getFileType(previewFile);
            
            return (
              <>
                {fileType.includes('application/msword') || 
                fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ? (
                  <iframe 
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
                    width="100%" 
                    height="600px" 
                    style={{ border: 'none' }}
                    title={previewFile.name}
                  />
                ) : fileType.includes('image/') ? (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name} 
                    style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', margin: '0 auto' }}
                  />
                ) : fileType === 'application/pdf' ? (
                  <iframe 
                    src={`${previewFile.url}#view=fitH`} 
                    width="100%" 
                    height="600px" 
                    style={{ border: 'none' }}
                    title={previewFile.name}
                  />
                ) : (
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 4 }}>
                    Vista previa no disponible para {previewFile.name}
                  </Typography>
                )}
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <DownloadButton 
            url={previewFile?.url}
            filename={previewFile?.name}
            variant="text"
            size="medium"
            startIcon={true}
            label="Descargar"
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
}
