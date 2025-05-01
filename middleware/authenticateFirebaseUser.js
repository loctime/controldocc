// middleware/authenticateFirebaseUser.js
import admin from 'firebase-admin';

export async function authenticateFirebaseUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no provisto" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token inválido:", error);
    return res.status(401).json({ error: "Token inválido" });
  }
}
