// Firebase Admin SDK — server-side only, and ONLY for Firebase Cloud Messaging (push delivery).
// All data and auth live in Supabase now. Never import this from client components.
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let app: App;

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private keys are stored with literal \n in env files, restore real newlines.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
} else {
  app = getApps()[0]!;
}

export const adminMessaging = getMessaging(app);
export { app as adminApp };
