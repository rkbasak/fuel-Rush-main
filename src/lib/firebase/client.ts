import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getSiteSettings } from '@/lib/services/config';

let messaging: ReturnType<typeof getMessaging> | null = null;

export async function initFirebase(): Promise<ReturnType<typeof getMessaging> | null> {
  if (typeof window === 'undefined') return null;
  
  const settings = await getSiteSettings();
  const firebaseConfig = {
    apiKey: settings.firebase_api_key || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: settings.firebase_auth_domain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: settings.firebase_project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: settings.firebase_app_id || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey) {
    console.warn('Firebase is not configured. Notifications will be disabled.');
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  messaging = getMessaging(app);
  return messaging;
}

export async function getMessagingInstance() {
  if (!messaging) {
    messaging = await initFirebase();
  }
  return messaging;
}

export { getToken, onMessage };
