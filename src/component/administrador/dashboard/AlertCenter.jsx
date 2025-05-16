import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Stack, IconButton
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore,
  ExpandLess,
  ArrowForward,
  CheckCircle,
  Undo as UndoIcon
} from "@mui/icons-material";

const STORAGE_KEY = "alertCenterReadState";

export default function AlertCenter({ alerts = [], setAlerts, compact = false }) {
  const [expandedAlertId, setExpandedAlertId] = useState(null);

  useEffect(() => {
    const savedReadState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const updated = alerts.map(alert => ({
      ...alert,
      isRead: savedReadState[alert.id] ?? (alert.isRead || false)
    }));
    setAlerts(updated);
  }, []);

  const toggleExpand = (id) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  const updateReadStatus = (id, isRead) => {
    const updated = alerts.map(alert =>
      alert.id === id ? { ...alert, isRead } : alert
    );
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, [id]: isRead }));
    setAlerts(updated);
  };

  const unread = alerts.filter(a => !a.isRead);
  const read = alerts.filter(a => a.isRead);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[...unread, ...(!compact ? read : [])].map((alert) => (
        <React.Fragment key={alert.id}>
          <Paper
            variant="outlined"
            sx={{
              p: compact ? 1 : 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              bgcolor: alert.isRead ? 'grey.100' : 'background.paper',
              opacity: alert.isRead ? 0.7 : 1
            }}
            onClick={() => toggleExpand(alert.id)}
          >
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {alert.icon || <WarningIcon color="warning" fontSize="small" />}
              <Typography fontSize={compact ? 12 : 14}>{alert.text}</Typography>
            </Box>

            {!compact && (
              alert.isRead ? (
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  updateReadStatus(alert.id, false);
                }}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  updateReadStatus(alert.id, true);
                }}>
                  <CheckCircle color="success" fontSize="small" />
                </IconButton>
              )
            )}

            <IconButton size="small">
              {expandedAlertId === alert.id ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Paper>

          {expandedAlertId === alert.id && (
            <Box sx={{ mt: 1, mb: 2, pl: 4 }}>
              <Stack spacing={1}>
                {alert.relatedDocuments?.length > 0 ? (
                  alert.relatedDocuments.map((doc) => (
                    <Box key={doc.id} sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography><strong>Documento:</strong> {doc.name}</Typography>
                        <Typography variant="body2"><strong>Empresa:</strong> {doc.company}</Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<ArrowForward />}
                        onClick={() => console.log("Ver doc", doc.id)}
                      >
                        Ir
                      </Button>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay documentos relacionados
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}

AlertCenter.getUnreadCount = (alerts = []) =>
  alerts.filter(a => !a.isRead).length;
