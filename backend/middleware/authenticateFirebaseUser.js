import admin from 'firebase-admin';

export async function authenticateFirebaseUser(req, res, next) {
  try {
    console.log('[AUTH] Verificando headers:', Object.keys(req.headers));
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      console.error('[AUTH] Error: No se encontró token Bearer');
      return res.status(401).json({ 
        error: "Autenticación requerida",
        solution: "Incluye un token JWT válido en el header Authorization: 'Bearer TU_TOKEN'"
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    console.log('[AUTH] Token recibido (inicio):', idToken?.slice(0, 10) + '...');

    if (!idToken || idToken.split('.').length !== 3) {
      console.error('[AUTH] Error: Token mal formado');
      return res.status(401).json({ 
        error: "Formato de token inválido",
        received: idToken ? `Longitud: ${idToken.length}` : 'Token vacío'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('[AUTH] Usuario autenticado:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      companyId: decodedToken.companyId
    });
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user',
      companyId: decodedToken.companyId || null
    };
    
    next();
  } catch (error) {
    console.error('[AUTH] Error completo:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    const message = error.code === 'auth/id-token-expired' 
      ? "Tu sesión ha expirado, por favor inicia sesión nuevamente"
      : "Credenciales inválidas";
    res.status(401).json({ 
      error: message, 
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}