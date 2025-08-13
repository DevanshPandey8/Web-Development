# EPLQ System Setup Checklist

## ✅ Essential Setup Steps

### 1. Firebase Project Setup
- [ ] Go to https://console.firebase.google.com
- [ ] Create new project named "EPLQ-System"
- [ ] Enable Authentication → Email/Password sign-in method
- [ ] Create Firestore Database in test mode
- [ ] Get web app config from Project Settings

### 2. Update Firebase Configuration
- [ ] Copy Firebase config from console
- [ ] Replace values in `js/config.js` file
- [ ] Ensure all 6 config values are updated:
  - apiKey
  - authDomain  
  - projectId
  - storageBucket
  - messagingSenderId
  - appId

### 3. Set Firestore Security Rules
- [ ] Go to Firestore Database → Rules tab
- [ ] Copy content from `firestore-security-rules.txt`
- [ ] Paste and publish the rules

### 4. Launch Application
- [ ] Double-click `start-server.bat` OR
- [ ] Open Command Prompt, navigate to project folder, run: `python -m http.server 8000`
- [ ] Open browser to: http://localhost:8000

### 5. Test the System
- [ ] Test Admin Registration/Login
- [ ] Test Password Reset functionality (Admin & User)
- [ ] Upload sample POI data as admin
- [ ] Test User Registration/Login  
- [ ] Perform location search as user
- [ ] Verify encryption/decryption works

## 🔑 Password Reset Instructions

### How to Reset Password:
1. **Go to Login Form** (Admin or User section)
2. **Enter your email** in the email field
3. **Click "Forgot Password?"** button below the login form
4. **Check your email** for the password reset link
5. **Click the link** in the email to reset your password
6. **Set new password** on the Firebase page
7. **Return to app** and login with new password

### Troubleshooting Password Reset:
- **Email not received**: Check spam/junk folder
- **Link expired**: Request a new reset email
- **Invalid email**: Ensure email is registered in the system
- **Still can't reset**: Contact admin or check Firebase console

## 🔧 Troubleshooting

### Common Issues:
1. **Firebase errors**: Check config values and internet connection
2. **Server won't start**: Ensure Python is installed
3. **Encryption errors**: Use modern browser (Chrome, Firefox, Edge)
4. **Location not working**: Enable location permissions or enter manually

### Quick Tests:
- Open browser console (F12) to see any error messages
- Check Network tab to verify Firebase connections
- Ensure HTTPS if using geolocation features

## 📱 Demo Data

### Sample POI Data for Testing:
```
Name: Central Hospital
Lat: 40.7589, Lng: -73.9851
Category: hospital
Description: 24/7 emergency services

Name: City Library  
Lat: 40.7614, Lng: -73.9776
Category: education
Description: Public library with free WiFi

Name: Coffee Shop
Lat: 40.7505, Lng: -73.9934  
Category: restaurant
Description: Local coffee and pastries
```

### Test Search Coordinates:
```
New York City Area:
- Lat: 40.7580, Lng: -73.9850 (Near the demo POIs)
- Search Radius: 5km
- Expected Results: Should find hospital, library, coffee shop

Alternative Test Location:
- Lat: 40.7500, Lng: -73.9900
- Search Radius: 10km  
- Expected Results: Should find all demo locations
```

### Quick Testing Steps:
1. **Load Demo Data**: Click "Load Demo Data for Testing" button
2. **Use Test Coordinates**: Copy coordinates above into location fields
3. **Set Search Radius**: Try 5km first, then increase if needed
4. **Test Categories**: Try "All Categories" then specific ones
5. **Check Results**: Should see POIs with distances

## 🎯 Success Indicators
- ✅ No console errors on page load
- ✅ Admin can register and upload POI data
- ✅ User can register and search for POIs
- ✅ Encryption/decryption works seamlessly
- ✅ Distance calculations are accurate
- ✅ Privacy protection is maintained
