import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAh_ZSqmNqpffnRmHmiWk82vWRmyLHMruY",
  authDomain: "stropse-7ce15.firebaseapp.com",
  projectId: "stropse-7ce15",
  storageBucket: "stropse-7ce15.firebasestorage.app",
  messagingSenderId: "706456734340",
  appId: "1:706456734340:web:c9201927a406ed037550d1",
  measurementId: "G-W9838JT5CN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
