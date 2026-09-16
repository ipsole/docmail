// Firebase Client & Project Configuration for DocMail Platform
// Project: docmail-system

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBVigDj0BG4L4qCmTBOU-DT2OFgEPQT4XM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'docmail-system.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'docmail-system',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'docmail-system.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '655905957340',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:655905957340:web:f1510ab9cdcf8eeb055b19',
};

/**
 * Built-in authorized administrator email list.
 * Any account not matching these explicit emails or allowed domains is strictly denied.
 */
export const DEFAULT_AUTHORIZED_ADMINS = [
  'itpiyu@gmail.com', // Primary administrator
  'arushibh.work@gmail.com', // Authorized administrator
  'arushibh.work@gmail', // Alternative representation
];

export const DEFAULT_ALLOWED_DOMAINS = [
  'docdril.com',
];
