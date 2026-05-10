import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCG4p1CTUKJK-RX5-7HOHwU8a_AQ5BbTko",
  authDomain: "edtain-4afd6.firebaseapp.com",
  projectId: "edtain-4afd6",
  storageBucket: "edtain-4afd6.firebasestorage.app",
  messagingSenderId: "222938171389",
  appId: "1:222938171389:web:7299365aaedd96de55bb94",
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === 'web') {
  // Web uses browser persistence by default
  auth = getAuth(app);
} else {
  // Native uses AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app, auth };