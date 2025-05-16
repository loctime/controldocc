import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

export default function StatCard({ title, value, icon, color, onAction, isSelected, warningText }) {
  return (
    <Card 
      elevation={isSelected ? 3 : 1} 
      onClick={onAction}
      sx={{ 
        height: "100%",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: 'relative',
        border: isSelected ? `2px solid #1976d2` : '2px solid transparent',
        '&:hover': {
          transform: "translateY(-3px)",
          boxShadow: 4,
          backgroundColor: isSelected ? '#e3f2fd' : `${color}.lightest`
        },
        backgroundColor: isSelected ? '#e3f2fd' : 'background.paper'
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: '1rem' } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box sx={{ 
            color: isSelected ? '#1976d2' : color, 
            display: "flex",
            p: 1,
            borderRadius: '50%',
            backgroundColor: isSelected ? '#bbdefb' : `${color}.light`,
            boxShadow: 1,
            transition: 'all 0.2s'
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={600} color={isSelected ? '#1976d2' : 'text.primary'}>
            {title}
          </Typography>
        </Box>

        {warningText && (
          <Box sx={{
            bgcolor: color === 'error.main' ? 'error.light' : 'warning.light',
            px: 1,
            py: 0.5,
            mb: 1,
            borderRadius: 1
          }}>
            <Typography variant="caption" color="text.primary" fontWeight="bold">
              {warningText}
            </Typography>
          </Box>
        )}

        <Typography 
          variant="h5" 
          align="center" 
          sx={{ fontWeight: 'bold', color: isSelected ? '#1976d2' : 'inherit' }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
