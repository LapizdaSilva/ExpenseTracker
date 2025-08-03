import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence, initializeAuth,} from 'firebase/auth';
import { ReactNativeAsyncStorage} from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, { 
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export default app
