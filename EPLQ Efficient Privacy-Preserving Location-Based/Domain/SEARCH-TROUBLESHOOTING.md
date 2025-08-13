# 🔍 EPLQ Search Troubleshooting Guide

## Why Location Search Isn't Working

### Most Common Issues:

#### 1. **No POI Data Available** ⚠️
**Problem**: No admin has uploaded POI data yet
**Solution**: 
- Click "Load Demo Data for Testing" button in User section
- OR register as admin and upload some POI data first

#### 2. **Firebase Not Configured** ⚠️ 
**Problem**: Firebase config values still contain placeholders
**Solution**:
- Complete Firebase setup in `js/config.js`
- See SETUP-CHECKLIST.md for detailed steps

#### 3. **User Not Logged In** ⚠️
**Problem**: Must be logged in to access POI data
**Solution**:
- Register/Login as a user first
- Then try searching

#### 4. **Invalid Search Parameters** ⚠️
**Problem**: Location coordinates or radius are invalid
**Solution**:
- Use test coordinates: Lat: 40.7580, Lng: -73.9850
- Set radius to 5-10km for demo data
- Ensure latitude is between -90 and 90
- Ensure longitude is between -180 and 180

#### 5. **Browser Console Errors** ⚠️
**Problem**: JavaScript errors preventing functionality
**Solution**:
- Open browser console (F12)
- Check for red error messages
- Common issues: CORS, Firebase auth, crypto API

## Quick Fix Steps:

### Step 1: Enable Demo Mode
```
1. Go to User section
2. Register/Login as user
3. Click "Load Demo Data for Testing" 
4. You should see: "Demo mode: Loaded 5 sample locations"
```

### Step 2: Test Search
```
1. Enter coordinates: 40.7580, -73.9850
2. Set radius: 5km
3. Select category: "All Categories"  
4. Click "Search POI (Encrypted)"
5. Should find 3-5 demo locations
```

### Step 3: Debug Console
```
1. Open browser console (F12)
2. Run: testSearchFunctionality()
3. Check output for errors
4. Look for "Found X POIs" message
```

## Expected Demo Results:

With coordinates **40.7580, -73.9850** and **5km radius**:
- ✅ Central Hospital (~0.1km away)
- ✅ City Library (~0.5km away) 
- ✅ Coffee Shop (~1.8km away)
- ✅ Police Station (~0.2km away)
- ✅ Fire Department (~0.3km away)

## Still Not Working?

### Check These:
1. **Network Tab**: Any failed Firebase requests?
2. **Console Errors**: Any red error messages?
3. **User Logged In**: Green success message after login?
4. **Demo Data Loaded**: "Demo mode: Loaded 5 sample locations" message?
5. **Valid Coordinates**: Numbers within valid ranges?

### Manual Debug:
```javascript
// Run in browser console:
console.log('User module:', window.userModule);
console.log('POI cache:', window.userModule?.poiCache);
console.log('Current user:', window.firebaseApp?.getCurrentUser());
```

## Contact Information:
If search still fails after these steps, check:
- Firebase console for auth/database issues
- Browser compatibility (Chrome, Firefox, Edge recommended)
- Network connectivity and firewall settings
