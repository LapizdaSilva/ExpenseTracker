import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth,} from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth'
import { ReactNativeAsyncStorage} from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCuCUbvHAwPkyikc37bIm93ssNkh5dwsH0",
  authDomain: "gestor-1dfc4.firebaseapp.com",
  projectId: "gestor-1dfc4",
  storageBucket: "gestor-1dfc4.firebasestorage.app",
  messagingSenderId: "390047195871",
  appId: "1:390047195871:web:ed7b57d5f312157923bf6a"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, { 
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export default app
