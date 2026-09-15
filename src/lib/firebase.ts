import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { firebaseConfig } from '@/config/firebase.config';

// Initialize Firebase client app (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Prompt account selector every time so admin can switch accounts if needed
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
