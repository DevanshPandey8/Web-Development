# Secure Government Document Sharing Platform

A web application that allows users to securely upload, store, and share government documents with family members using Firebase backend services.

## 🚀 Features

- **Secure Authentication**: User registration and login with Firebase Auth
- **Document Management**: Upload, view, and organize government documents
- **Family Sharing**: Add family members and share documents securely
- **File Security**: Secure cloud storage with Firebase Cloud Storage
- **Activity Tracking**: Monitor document access and sharing activities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore, Cloud Storage)
- **UI/UX**: Modern responsive design with CSS Grid and Flexbox
- **Icons**: Font Awesome
- **Security**: Firebase Security Rules, input validation

## 📁 Project Structure

```
domain/
├── index.html              # Main application page
├── styles/
│   └── main.css            # Application styles
├── js/
│   ├── app.js              # Main application controller
│   ├── auth.js             # Authentication management
│   ├── documents.js        # Document management
│   ├── family.js           # Family member management
│   └── firebase-config.js  # Firebase configuration
├── .github/
│   └── copilot-instructions.md
└── README.md
```

## 🔧 Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database**
   - **Cloud Storage**
3. Get your Firebase config object from Project Settings
4. Update `js/firebase-config.js` with your configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};
```

### 2. Firebase Security Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Documents can be accessed by owner or shared family members
    match /documents/{documentId} {
      allow read, write: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         request.auth.uid in resource.data.sharedWith);
    }
    
    // Family members can be managed by the user
    match /familyMembers/{memberId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.memberEmail == request.auth.token.email);
    }
    
    // Activities can only be accessed by the user
    match /activities/{activityId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

Set up Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Running the Application

1. Serve the files using a local server (required for ES6 modules):

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000

# Using Live Server in VS Code
```

2. Open your browser and navigate to `http://localhost:8000`

## 💡 Usage

### Getting Started

1. **Register**: Create a new account with your email and government ID
2. **Login**: Sign in with your credentials
3. **Upload Documents**: Add your government documents (passport, ID, certificates)
4. **Add Family**: Invite family members by their email addresses
5. **Share Documents**: Select which documents to share with specific family members

### Document Types Supported

- Passport
- ID Card
- Birth Certificate
- Marriage Certificate
- Tax Documents
- Other government documents

### File Formats Supported

- PDF files
- Image files (JPG, JPEG, PNG)

## 🔒 Security Features

- **Authentication**: Secure login with Firebase Auth
- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based access to documents
- **File Validation**: Client and server-side file validation
- **Activity Logging**: Track all document activities

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Ensure Firebase configuration is correct
3. Verify internet connection
4. Check Firebase service status

## 🚧 Future Enhancements

- [ ] Two-factor authentication
- [ ] Document encryption at rest
- [ ] Bulk document upload
- [ ] Advanced search and filtering
- [ ] Document versioning
- [ ] Email notifications
- [ ] Mobile app development
- [ ] Document expiration dates
- [ ] Audit logs for compliance

## 📊 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

**Note**: This is a demonstration project for educational purposes. For production use, implement additional security measures and comply with relevant data protection regulations.
