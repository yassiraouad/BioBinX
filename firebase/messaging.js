import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

let messaging = null;

if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (e) {
    console.warn('Firebase Messaging not available:', e);
  }
}

export async function requestNotificationPermission() {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      return token;
    }
    return null;
  } catch (e) {
    console.warn('Notification permission error:', e);
    return null;
  }
}

export function onNotificationReceived(callback) {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'BioBin X', {
        body: payload.notification?.body || '',
        icon: '/leaf-icon.png',
        badge: '/badge-icon.png',
      });
    }
    callback(payload);
  });
}

export function showLocalNotification(title, body, onClick) {
  if (Notification.permission !== 'granted') return;
  
  const notification = new Notification(title, {
    body,
    icon: '/leaf-icon.png',
    badge: '/badge-icon.png',
  });
  
  notification.onclick = () => {
    window.focus();
    if (onClick) onClick();
    notification.close();
  };
}

export { messaging };
