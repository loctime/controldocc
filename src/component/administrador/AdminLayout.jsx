import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCompanies } from "../../context/CompaniesContext";
import { auth } from "../../firebaseconfig";
import { signOut } from "firebase/auth";
import { styled, useTheme } from "@mui/material/styles";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ApprovalIcon from '@mui/icons-material/Approval';
import StorageIcon from '@mui/icons-material/Storage';
import AlertCenter from './dashboard/AlertCenter';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Badge
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseconfig";

const drawerWidth = 180;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(1.5),
    width: '100%',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      marginLeft: 0,
    }),
    backgroundColor: theme.palette.grey[100],
    minHeight: '100vh',
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
    backgroundColor: '#fff',
    color: theme.palette.text.primary,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function AdminLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [expandedNotifications, setExpandedNotifications] = useState(false);

  const { companies, selectedCompany, selectCompany, loading: loadingCompanies } = useCompanies();

  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Documentos pendientes
        const pendingQuery = query(
          collection(db, "uploadedDocuments"),
          where("status", "==", "Pendiente de revisión")
        );
        const pendingSnap = await getDocs(pendingQuery);
        
        // Documentos vencidos - consulta corregida
        const expiredQuery = query(
          collection(db, "uploadedDocuments"),
          where("status", "==", "Aprobado"),
          where("expirationDate", "<", new Date())
        );
        const expiredSnap = await getDocs(expiredQuery);

        const newAlerts = [];
        
        if (!pendingSnap.empty) {
          newAlerts.push({
            id: 1,
            icon: <WarningIcon color="warning" />,
            text: `${pendingSnap.size} documentos pendientes`,
            relatedDocuments: pendingSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.documentName || data.fileName || "Documento sin nombre",
                company: companies.find(c => c.id === data.companyId)?.name || "Sin empresa",
                expirationDate: data.expirationDate,
                status: "Pendiente"
              };
            })
          });
        }

        if (!expiredSnap.empty) {
          newAlerts.push({
            id: 2,
            icon: <ErrorIcon color="error" />,
            text: `${expiredSnap.size} documentos vencidos`,
            relatedDocuments: expiredSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.documentName || data.fileName || "Documento sin nombre",
                company: companies.find(c => c.id === data.companyId)?.name || "Sin empresa",
                expirationDate: data.expirationDate,
                status: "Vencido"
              };
            })
          });
        }

        setAlerts(newAlerts.length > 0 ? newAlerts : [{
          id: 0,
          icon: <InfoIcon color="info" />,
          text: "No hay notificaciones",
          relatedDocuments: []
        }]);
      } catch (error) {
        console.error("Error cargando alertas:", error);
        setAlerts([{
          id: 0,
          icon: <ErrorIcon color="error" />,
          text: "Error cargando notificaciones",
          relatedDocuments: []
        }]);
      }
    };

    fetchAlerts();
  }, [companies]);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  const handleNotificationsOpen = (e) => setNotificationsAnchorEl(e.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchorEl(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userCompany');
      localStorage.removeItem('isAdminSession');
      handleProfileMenuClose();
      navigate('/login');
      window.location.reload();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleCompanyChange = (event) => {
    const companyId = event.target.value;
    if (companyId === 'todas') {
      selectCompany(null);
      return;
    }
    const selected = companies.find(c => String(c.id) === companyId);
    selectCompany(selected || null);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Empresas', icon: <BusinessIcon />, path: '/admin/companies' },
    { text: 'Documentos Requeridos', icon: <DescriptionIcon />, path: '/admin/required-documents' },
    { text: 'Administrar Documentos', icon: <UploadIcon color="secondary" />, path: '/admin/uploaded-documents', highlight: true },
    { text: 'Biblioteca', icon: <LibraryBooksIcon />, path: '/admin/document-library', highlight: true },
    { text: 'Almacenamiento', icon: <StorageIcon />, path: '/admin/store', highlight: true },
    { text: 'Aprobar Empresas', icon: <ApprovalIcon />, path: '/admin/company-approvals' }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton color="inherit" onClick={handleDrawerOpen} edge="start" sx={{ mr: 2, ...(open && { display: 'none' }) }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ mr: 3 }}>
            ControlDoc
          </Typography>

          {/* Selector de empresas */}
          <FormControl sx={{ minWidth: 200, mr: 'auto' }} size="small">
            <InputLabel id="company-select-label">Empresa</InputLabel>
            <Select
              labelId="company-select-label"
              value={selectedCompany ? String(selectedCompany.id) : 'todas'}
              onChange={handleCompanyChange}
              label="Empresa"
              disabled={loadingCompanies}
              renderValue={(selected) => {
                if (!selected || selected === 'todas') return 'Todas las empresas';
                const company = companies.find(c => String(c.id) === selected);
                return company?.companyName || company?.name || 'Empresa seleccionada';
              }}
            >
              <MenuItem value="todas"><em>Todas las empresas</em></MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={String(company.id)}>
                  {company.companyName || company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Notificaciones */}
          <Tooltip title="Notificaciones">
            <IconButton color="inherit" onClick={handleNotificationsOpen} sx={{ mr: 1 }}>
              <Badge badgeContent={alerts.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                width: expandedNotifications ? '90vw' : 400,
                height: expandedNotifications ? '85vh' : '75vh',
                maxHeight: expandedNotifications ? 'none' : 'none',
                mt: 1,
                p: 0
              }
            }}
          >
            <Box sx={{ 
              p: 2, 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              maxHeight: expandedNotifications ? 'calc(85vh - 48px)' : 'calc(75vh - 48px)'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1
              }}>
                <Typography variant="h6" fontWeight="bold">Notificaciones</Typography>
                <IconButton 
                  size="small"
                  onClick={() => setExpandedNotifications(!expandedNotifications)}
                >
                  {expandedNotifications ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <AlertCenter 
                  alerts={alerts} 
                  setAlerts={setAlerts} 
                  compact={false}
                />
              </Box>
            </Box>
          </Menu>

          {/* Perfil de usuario */}
          <Tooltip title="Perfil de usuario">
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <PersonIcon />
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}>
            <MenuItem>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              <Typography variant="body2">Mi Perfil</Typography>
            </MenuItem>
            <MenuItem>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <Typography variant="body2">Configuración</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <Typography variant="body2">Cerrar Sesión</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader sx={{ backgroundColor: theme.palette.primary.dark }}>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            ControlDoc
          </Typography>
          <IconButton onClick={handleDrawerClose} sx={{ color: '#fff' }}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' :
                      item.highlight ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    ...(item.highlight && {
                      borderLeft: '4px solid',
                      borderColor: theme.palette.secondary.main,
                      paddingLeft: '12px'
                    })
                  }}
                >
                  <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
}
