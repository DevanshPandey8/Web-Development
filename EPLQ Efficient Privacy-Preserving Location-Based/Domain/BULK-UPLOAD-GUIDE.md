# EPLQ Bulk POI Upload Guide

## Overview
The EPLQ system now supports three different methods for uploading POI (Point of Interest) data:

1. **Single Upload** - Upload one POI at a time using a form
2. **Bulk Manual Entry** - Upload multiple POIs using text input
3. **CSV File Upload** - Upload POIs from a CSV file

## Upload Methods

### 1. Single Upload
The traditional method for uploading individual POI data points.

**Fields:**
- POI Name (required)
- Category (required)
- Description (required)
- Latitude (required, -90 to 90)
- Longitude (required, -180 to 180)

### 2. Bulk Manual Entry

Upload multiple POI data points by entering them in a text area. Supports two formats:

#### Format 1: JSON (One per line)
```json
{"name":"Central Hospital","category":"hospital","description":"Emergency medical services available 24/7","latitude":40.7128,"longitude":-74.0060}
{"name":"Fire Station 1","category":"fire_station","description":"Main fire station with emergency response","latitude":40.7589,"longitude":-73.9851}
```

#### Format 2: CSV (Comma-separated)
```
Central Hospital,hospital,Emergency medical services available 24/7,40.7128,-74.0060
Fire Station 1,fire_station,Main fire station with emergency response,40.7589,-73.9851
Police Precinct,police,24/7 police services and emergency response,40.7505,-73.9934
```

**Options:**
- **Skip Duplicates**: Automatically skip POIs that might already exist
- **Validate Coordinates**: Perform extra validation on latitude/longitude values

### 3. CSV File Upload

Upload POI data from a properly formatted CSV file.

#### CSV File Format
The CSV file must contain the following columns (in any order):
- `name` - POI name
- `category` - POI category/type  
- `description` - POI description
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate

#### Sample CSV Template
```csv
name,category,description,latitude,longitude
"Central Hospital","hospital","Emergency medical services available 24/7","40.7128","-74.0060"
"Fire Station 1","fire_station","Main fire station with emergency response","40.7589","-73.9851"
"Police Precinct","police","24/7 police services and emergency response","40.7505","-73.9934"
"Community Center","community","Local community services and shelter","40.7282","-73.7949"
```

**Features:**
- **File Preview**: Preview the first 5 rows before uploading
- **Template Download**: Download a sample CSV template
- **Error Handling**: Skip invalid rows or stop on first error

**Options:**
- **Skip Errors**: Continue processing even if some rows have errors
- **Validate Data**: Perform comprehensive data validation

## Data Validation

All upload methods perform the following validations:

### Required Fields
- **Name**: Must be at least 2 characters long
- **Category**: Must be selected/provided
- **Description**: Must be provided
- **Latitude**: Must be a valid number between -90 and 90
- **Longitude**: Must be a valid number between -180 and 180

### Privacy Protection
- All POI data is encrypted using AES-GCM encryption before storage
- Approximate coordinates are stored with privacy noise for spatial indexing
- Exact coordinates are only available after decryption with proper authorization

## Common Categories

Suggested POI categories:
- `hospital` - Medical facilities
- `fire_station` - Fire and emergency services
- `police` - Police stations and law enforcement
- `community` - Community centers and public facilities
- `emergency_shelter` - Emergency shelters and safe zones
- `school` - Educational institutions
- `government` - Government buildings and offices
- `transportation` - Transit hubs and transportation

## Error Handling

### Common Errors and Solutions

1. **Invalid Coordinates**
   - Ensure latitude is between -90 and 90
   - Ensure longitude is between -180 and 180
   - Use decimal format (e.g., 40.7128, not 40°42'46"N)

2. **Missing Required Fields**
   - All fields (name, category, description, latitude, longitude) must be provided
   - Empty or whitespace-only values are not accepted

3. **CSV Format Issues**
   - Ensure first row contains column headers
   - Use proper CSV escaping for values containing commas
   - Wrap text values in quotes if they contain special characters

4. **File Upload Problems**
   - Ensure file is in UTF-8 encoding
   - Maximum file size should be reasonable (under 10MB recommended)
   - Only .csv file extensions are accepted

## Best Practices

### Data Preparation
1. **Validate coordinates** using mapping tools before upload
2. **Use consistent category names** to improve data organization
3. **Provide detailed descriptions** to help with search and identification
4. **Test with small batches** before uploading large datasets

### Upload Process
1. **Start with single upload** to test the system
2. **Use CSV template** as a starting point for bulk uploads
3. **Preview data** before final submission
4. **Monitor upload progress** and check for error messages
5. **Verify uploaded data** in the admin dashboard

### Security Considerations
- Never include sensitive information in POI descriptions
- Coordinate precision should be appropriate for public safety use
- Review uploaded data before making it available to users
- Regularly audit and update POI information

## Technical Details

### Encryption Process
1. POI data is encrypted client-side using AES-GCM
2. Encryption keys are derived using PBKDF2
3. Each POI gets a unique initialization vector (IV)
4. Encrypted data is stored in Firebase Firestore

### Spatial Indexing
- Approximate coordinates (with privacy noise) are stored separately
- Enables efficient spatial queries without exposing exact locations
- Privacy noise is typically ±55 meters (0.0005 degrees)

### Batch Processing
- Bulk uploads are processed in Firestore batch operations
- Maximum 500 operations per batch (Firebase limit)
- Failed operations don't affect successful ones in the same batch

## Troubleshooting

### Upload Fails Completely
1. Check Firebase configuration and authentication
2. Verify internet connectivity
3. Check browser console for detailed error messages
4. Ensure you're logged in as an admin user

### Partial Upload Success
1. Review error messages for specific validation failures
2. Use "Skip Errors" option to continue with valid data
3. Fix invalid records and retry upload
4. Check for duplicate entries if using "Skip Duplicates"

### CSV Upload Issues
1. Verify CSV format matches the template
2. Check file encoding (should be UTF-8)
3. Ensure column headers match expected names
4. Remove any extra commas or special characters

### Performance Issues
1. Upload data in smaller batches (50-100 POIs at a time)
2. Avoid uploading during peak usage hours
3. Close other browser tabs to free up memory
4. Check system resources (CPU, memory usage)

## Support

For technical support or questions about bulk upload functionality:

1. Check the browser console for detailed error messages
2. Review this guide for common solutions
3. Test with the provided CSV template
4. Ensure all prerequisites are met (Firebase config, admin auth)

---

*This guide covers the bulk upload functionality added to the EPLQ (Efficient Privacy-Preserving Location-Based Query) system. For general system documentation, see README.md and other documentation files.*
