// backend/middleware/requireRole.js

export function requireRole(expectedRole) {
    return (req, res, next) => {
      const userRole = req.user?.role;
  
      if (!userRole) {
        return res.status(401).json({ error: 'No autenticado' });
      }
  
      // Admin puede hacer todo
      if (expectedRole === 'admin' && userRole === 'DhHkVja') {
        return next();
      }
  
      // Empresas
      if (expectedRole === 'user' && userRole !== 'DhHkVja') {
        return next();
      }
  
      return res.status(403).json({ error: 'Acceso denegado por rol' });
    };
  }
  