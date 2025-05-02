import admin from 'firebase-admin';
import { config } from 'dotenv';

config({ path: '.env' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // opcional si usás Storage
  });
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
