import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";

export default function StatCard({ title, value, icon, color, onAction, isSelected, warningText, companiesAtRisk }) {
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

        {companiesAtRisk && companiesAtRisk.length > 0 ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            mb: 1
          }}>
            {companiesAtRisk.map((company, index) => (
              <Box key={index} sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'error.light',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                  mr: 1
                }} />
                <Typography variant="caption" fontWeight="bold">
                  {company}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : warningText && (
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
