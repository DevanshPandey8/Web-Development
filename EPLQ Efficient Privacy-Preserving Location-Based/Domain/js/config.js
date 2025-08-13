// Firebase Configuration
// TODO: Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console → Project Settings → General → Your apps → Config
const firebaseConfig = {
    apiKey: "AIzaSyCNnNhWLDgbPBOyjs6t7DVmbDVu-sVzKGE",                    // Replace with your API key
    authDomain: "elpq-system.firebaseapp.com", // Replace with your auth domain
    projectId: "elpq-system",                  // Replace with your project ID
    storageBucket: "elpq-system.firebasestorage.app",  // Replace with your storage bucket
    messagingSenderId: "441587196569",           // Replace with your sender ID
    appId: "1:441587196569:web:813dbd78d4058a62700e08"                          // Replace with your app ID
};

// Example of what it should look like:
// const firebaseConfig = {
//     apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//     authDomain: "eplq-system.firebaseapp.com",
//     projectId: "eplq-system",
//     storageBucket: "eplq-system.appspot.com",
//     messagingSenderId: "123456789012",
//     appId: "1:123456789012:web:abcdef123456789012345678"
// };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Database collections
const COLLECTIONS = {
    ADMINS: 'admins',
    USERS: 'users',
    POI_DATA: 'poi_data',
    ENCRYPTED_QUERIES: 'encrypted_queries'
};

// Authentication states
let currentUser = null;
let userType = null; // 'admin' or 'user'

// Export for use in other modules
window.firebaseApp = {
    auth,
    db,
    COLLECTIONS,
    getCurrentUser: () => currentUser,
    getUserType: () => userType,
    setCurrentUser: (user, type) => {
        currentUser = user;
        userType = type;
    }
};

console.log('Firebase configuration loaded successfully');
