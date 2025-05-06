import React from 'react';
import {
  Paper, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Divider, Typography
} from '@mui/material';
import { Folder, Label } from '@mui/icons-material';

export default function DocumentSidebar({
  currentFolder,
  folderStructure,
  navigateToFolder,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedCompany
}) {
  return (
    <Paper sx={{ 
      width: 240, 
      p: 2,
      height: 'calc(100vh - 220px)',
      overflow: 'auto',
      position: 'sticky',
      top: 16,
      borderRadius: 2,
      boxShadow: 2
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>Navegación</Typography>
      
      <List dense>
        {/* Carpeta raíz */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => navigateToFolder('root')}
            sx={{ 
              borderRadius: 1,
              mb: 0.5,
              bgcolor: currentFolder === 'root' ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
            }}
          >
            <ListItemIcon>
              <Folder color={currentFolder === 'root' ? 'primary' : 'action'} />
            </ListItemIcon>
            <ListItemText primary="Todos los documentos" />
          </ListItemButton>
        </ListItem>
        
        <Divider sx={{ my: 1.5 }} />
        
        {/* Carpeta de documentos */}
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>Carpetas</Typography>
        {(folderStructure.root?.subfolders || []).map(folderId => (
          <ListItem key={folderId} disablePadding>
            <ListItemButton 
              onClick={() => navigateToFolder(folderId)}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                bgcolor: currentFolder === folderId ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
              }}
            >
              <ListItemIcon>
                <Folder color={currentFolder === folderId ? 'primary' : 'action'} />
              </ListItemIcon>
              <ListItemText primary={folderStructure[folderId]?.name || folderId} />
            </ListItemButton>
          </ListItem>
        ))}
        
        <Divider sx={{ my: 1.5 }} />
        
        {/* Categorías */}
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>Categorías</Typography>
        {categories.map(category => (
          <ListItem key={category.id} disablePadding>
            <ListItemButton 
              onClick={() => {
                const newCategory = category.id === selectedCategory ? '' : category.id;
                setSelectedCategory(newCategory);
              }}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                bgcolor: selectedCategory === category.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
              }}
            >
              <ListItemIcon>
                <Label sx={{ color: category.color }} />
              </ListItemIcon>
              <ListItemText primary={category.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}