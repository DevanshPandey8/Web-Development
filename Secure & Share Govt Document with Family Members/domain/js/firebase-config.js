// Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAetuHFQCAOYWTw2aM8vwMSRN9S0OW1P08",
  authDomain: "doc-share-1202e.firebaseapp.com",
  projectId: "doc-share-1202e",
  storageBucket: "doc-share-1202e.firebasestorage.app",
  messagingSenderId: "804777491324",
  appId: "1:804777491324:web:0de00040f36860bd1ec2f9",
  measurementId: "G-MC518LV6RK"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
