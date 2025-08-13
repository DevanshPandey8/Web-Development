// EPLQ Admin Module - Enhanced with Bulk Upload
// Handles admin functionality including POI data upload and management

class EPLQAdmin {
    constructor() {
        this.auth = window.firebaseApp.auth;
        this.db = window.firebaseApp.db;
        this.COLLECTIONS = window.firebaseApp.COLLECTIONS;
        this.encryption = window.eplqEncryption;
        this.uploadedData = [];
    }

    // Initialize admin module
    init() {
        console.log('Initializing EPLQ Admin module...');
        
        try {
            this.setupEventListeners();
            console.log('Event listeners set up successfully');
            
            // Only load data if we're in admin dashboard
            const adminDashboard = document.getElementById('adminDashboard');
            if (adminDashboard && adminDashboard.style.display !== 'none') {
                console.log('Admin dashboard is visible, loading uploaded data...');
                this.loadUploadedData();
            } else {
                console.log('Admin dashboard not visible, skipping data load');
            }
        } catch (error) {
            console.error('Failed to initialize admin module:', error);
            this.showMessage('Failed to initialize admin interface', 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up admin event listeners...');
        
        // Tab functionality
        const tabButtons = document.querySelectorAll('.upload-tab-btn');
        console.log('Found upload tab buttons:', tabButtons.length);
        tabButtons.forEach(btn => {
            btn.addEventListener('click', this.switchUploadTab.bind(this));
        });

        // Upload forms
        const singleUploadForm = document.getElementById('singleUploadForm');
        const bulkUploadForm = document.getElementById('bulkUploadForm');
        const csvUploadForm = document.getElementById('csvUploadForm');

        if (singleUploadForm) {
            singleUploadForm.addEventListener('submit', this.handleSingleUpload.bind(this));
            console.log('Single upload form listener added');
        } else {
            console.warn('singleUploadForm not found');
        }

        if (bulkUploadForm) {
            bulkUploadForm.addEventListener('submit', this.handleBulkUpload.bind(this));
            console.log('Bulk upload form listener added');
        } else {
            console.warn('bulkUploadForm not found');
        }

        if (csvUploadForm) {
            csvUploadForm.addEventListener('submit', this.handleCSVUpload.bind(this));
            console.log('CSV upload form listener added');
        } else {
            console.warn('csvUploadForm not found');
        }

        // File input for CSV preview
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', this.previewCSV.bind(this));
            console.log('CSV file input listener added');
        } else {
            console.warn('csvFile input not found');
        }

        // Download template button
        const templateBtn = document.getElementById('downloadTemplate');
        if (templateBtn) {
            templateBtn.addEventListener('click', this.downloadCSVTemplate.bind(this));
            console.log('Download template button listener added');
        } else {
            console.warn('downloadTemplate button not found');
        }

        // Test Indian POI button
        const testIndianPOIBtn = document.getElementById('testIndianPOI');
        if (testIndianPOIBtn) {
            testIndianPOIBtn.addEventListener('click', this.testIndianPOIData.bind(this));
            console.log('Test Indian POI button listener added');
        } else {
            console.warn('testIndianPOI button not found');
        }

        // Admin logout
        const logoutBtn = document.getElementById('adminLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
            console.log('Admin logout button listener added');
        } else {
            console.warn('adminLogout button not found');
        }

        // Refresh data button
        const refreshBtn = document.getElementById('refreshDataBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
            console.log('Refresh data button listener added');
        } else {
            console.warn('refreshDataBtn button not found');
        }
        
        console.log('Event listeners setup complete');
    }

    // Switch between upload tabs
    switchUploadTab(event) {
        const targetTab = event.target.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.upload-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update content sections
        document.querySelectorAll('.upload-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(targetTab).classList.add('active');
    }

    // Single POI upload (legacy support)
    async handleSingleUpload(event) {
        event.preventDefault();
        
        console.log('Single upload form submitted');
        
        const formData = new FormData(event.target);
        
        // Debug: Log all form data
        for (let [key, value] of formData.entries()) {
            console.log(`Form data - ${key}: ${value}`);
        }
        
        const poiData = {
            name: formData.get('poiName'),
            latitude: parseFloat(formData.get('latitude')),
            longitude: parseFloat(formData.get('longitude')),
            category: formData.get('category'),
            description: formData.get('description')
        };

        console.log('Parsed POI data:', poiData);

        // Validate data before upload
        if (!poiData.name) {
            this.showMessage('POI name is required', 'error');
            return;
        }
        if (!poiData.category) {
            this.showMessage('Category is required', 'error');
            return;
        }
        if (isNaN(poiData.latitude) || isNaN(poiData.longitude)) {
            this.showMessage('Valid latitude and longitude are required', 'error');
            return;
        }

        try {
            this.showMessage('Uploading POI data...', 'info');
            await this.uploadSinglePOI(poiData);
            this.showMessage('POI uploaded successfully!', 'success');
            event.target.reset();
            await this.loadUploadedData();
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage('Upload failed: ' + error.message, 'error');
        }
    }

    // Bulk manual upload
    async handleBulkUpload(event) {
        event.preventDefault();
        
        const bulkData = document.getElementById('bulkPOIData').value.trim();
        if (!bulkData) {
            this.showMessage('Please enter POI data', 'error');
            return;
        }

        try {
            const poiList = this.parseBulkData(bulkData);
            const skipDuplicates = this.safeCheckboxCheck('skipDuplicates');
            const validateCoords = this.safeCheckboxCheck('validateCoords');

            const result = await this.uploadBulkPOI(poiList, { skipDuplicates, validateCoords });
            this.showMessage(`Successfully uploaded ${result.successCount} POI(s)!`, 'success');
            document.getElementById('bulkPOIData').value = '';
            await this.loadUploadedData();
        } catch (error) {
            console.error('Bulk upload error:', error);
            this.showMessage('Bulk upload failed: ' + error.message, 'error');
        }
    }

    // CSV file upload
    async handleCSVUpload(event) {
        event.preventDefault();
        
        console.log('CSV upload started');
        
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showMessage('Please select a CSV file', 'error');
            return;
        }

        console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

        try {
            this.showMessage('Reading CSV file...', 'info');
            const csvData = await this.readCSVFile(file);
            console.log('CSV data read successfully, length:', csvData.length);
            console.log('First 200 characters:', csvData.substring(0, 200));
            
            this.showMessage('Parsing CSV data...', 'info');
            const poiList = this.parseCSVData(csvData);
            console.log('Parsed POI list:', poiList.length, 'items');
            
            if (poiList.length === 0) {
                throw new Error('No valid POI data found in CSV file');
            }
            
            const skipErrors = this.safeCheckboxCheck('skipCSVErrors');
            const validateData = this.safeCheckboxCheck('validateData');
            console.log('Upload options - skipErrors:', skipErrors, 'validateData:', validateData);

            this.showMessage(`Uploading ${poiList.length} POIs...`, 'info');
            const result = await this.uploadBulkPOI(poiList, { skipErrors, validateData });
            this.showMessage(`Successfully uploaded ${result.successCount} POI(s) from CSV!`, 'success');
            
            // Reset form
            event.target.reset();
            const csvPreview = document.getElementById('csvPreview');
            if (csvPreview) csvPreview.style.display = 'none';
            await this.loadUploadedData();
        } catch (error) {
            console.error('CSV upload error:', error);
            console.error('Error stack:', error.stack);
            this.showMessage('CSV upload failed: ' + error.message, 'error');
        }
    }

    // Parse bulk text data
    parseBulkData(data) {
        const lines = data.split('\n').filter(line => line.trim());
        const poiList = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) continue;

            // Try JSON format first
            try {
                const poi = JSON.parse(line);
                poiList.push(this.validatePOI(poi));
                continue;
            } catch (e) {
                // Not JSON, try comma-separated format
            }

            // Try comma-separated format: name,category,description,lat,lng
            const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
            if (parts.length >= 5) {
                const poi = {
                    name: parts[0],
                    category: parts[1],
                    description: parts[2],
                    latitude: parseFloat(parts[3]),
                    longitude: parseFloat(parts[4])
                };
                poiList.push(this.validatePOI(poi));
            } else {
                throw new Error(`Invalid format at line ${i + 1}: ${line}`);
            }
        }

        return poiList;
    }

    // Read CSV file
    readCSVFile(file) {
        return new Promise((resolve, reject) => {
            console.log('Starting to read CSV file:', file.name);
            
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }
            
            if (file.size === 0) {
                reject(new Error('File is empty'));
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                reject(new Error('File is too large (max 10MB)'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const result = e.target.result;
                    console.log('File read successfully, length:', result.length);
                    if (!result || result.trim().length === 0) {
                        reject(new Error('File appears to be empty or contains only whitespace'));
                        return;
                    }
                    resolve(result);
                } catch (error) {
                    console.error('Error processing file result:', error);
                    reject(new Error('Failed to process file content'));
                }
            };
            
            reader.onerror = (e) => {
                console.error('FileReader error:', e);
                reject(new Error('Failed to read file: ' + (e.target.error?.message || 'Unknown error')));
            };
            
            reader.onabort = () => {
                reject(new Error('File reading was aborted'));
            };
            
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (error) {
                console.error('Error starting file read:', error);
                reject(new Error('Failed to start reading file'));
            }
        });
    }

    // Parse CSV data
    parseCSVData(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must contain header and at least one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const poiList = [];

        console.log('CSV Headers found:', headers);

        // Create flexible header mapping
        const headerMap = {};
        
        // Find name column
        const nameIndex = headers.findIndex(h => 
            h.includes('name') || h.includes('poi') || h.includes('title')
        );
        if (nameIndex === -1) throw new Error('Missing name column');
        headerMap.name = nameIndex;

        // Find category column
        const categoryIndex = headers.findIndex(h => 
            h.includes('category') || h.includes('type') || h.includes('class')
        );
        if (categoryIndex === -1) throw new Error('Missing category column');
        headerMap.category = categoryIndex;

        // Find latitude column
        const latIndex = headers.findIndex(h => 
            h.includes('lat') || h.includes('latitude') || h.includes('y')
        );
        if (latIndex === -1) throw new Error('Missing latitude column');
        headerMap.latitude = latIndex;

        // Find longitude column
        const lngIndex = headers.findIndex(h => 
            h.includes('lng') || h.includes('lon') || h.includes('longitude') || h.includes('x')
        );
        if (lngIndex === -1) throw new Error('Missing longitude column');
        headerMap.longitude = lngIndex;

        // Find description column (optional)
        const descIndex = headers.findIndex(h => 
            h.includes('desc') || h.includes('detail') || h.includes('info') || h.includes('address')
        );
        headerMap.description = descIndex >= 0 ? descIndex : categoryIndex; // Use category as fallback

        console.log('Header mapping:', headerMap);

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            try {
                // Split CSV line handling quoted values
                const values = this.parseCSVLine(lines[i]);
                
                if (values.length < Math.max(...Object.values(headerMap)) + 1) {
                    console.warn(`Row ${i + 1} has insufficient columns, skipping`);
                    continue;
                }

                const poi = {
                    name: this.cleanCSVValue(values[headerMap.name]),
                    category: this.cleanCSVValue(values[headerMap.category]),
                    latitude: parseFloat(this.cleanCSVValue(values[headerMap.latitude])),
                    longitude: parseFloat(this.cleanCSVValue(values[headerMap.longitude])),
                    description: this.cleanCSVValue(values[headerMap.description]) || this.cleanCSVValue(values[headerMap.category])
                };

                console.log(`Row ${i + 1} parsed:`, poi);

                try {
                    poiList.push(this.validatePOI(poi));
                } catch (error) {
                    if (!this.safeCheckboxCheck('skipCSVErrors')) {
                        throw new Error(`Row ${i + 1}: ${error.message}`);
                    }
                    console.warn(`Skipping invalid row ${i + 1}:`, error.message);
                }
            } catch (rowError) {
                console.error(`Error parsing row ${i + 1}:`, rowError);
                if (!this.safeCheckboxCheck('skipCSVErrors')) {
                    throw new Error(`Row ${i + 1}: ${rowError.message}`);
                }
            }
        }

        console.log(`Successfully parsed ${poiList.length} POIs from CSV`);
        return poiList;
    }

    // Parse CSV line handling quoted values
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current); // Add the last value
        return values;
    }

    // Clean CSV value
    cleanCSVValue(value) {
        if (!value) return '';
        return value.toString().trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }

    // Safe checkbox check
    safeCheckboxCheck(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.checked : false;
    }

    // Check admin authentication status
    checkAuthStatus() {
        console.log('Checking admin authentication status...');
        
        if (!this.auth) {
            console.error('Firebase auth not initialized');
            return false;
        }
        
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            console.log('No authenticated user');
            return false;
        }
        
        console.log('User authenticated:', {
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified
        });
        
        return true;
    }

    // Refresh data (public method for manual refresh)
    async refreshData() {
        console.log('Manual data refresh requested');
        this.showMessage('Refreshing data...', 'info');
        
        try {
            await this.loadUploadedData();
            this.showMessage('Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Manual refresh failed:', error);
            this.showMessage('Failed to refresh data: ' + error.message, 'error');
        }
    }

    // Preview CSV file
    async previewCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const csvData = await this.readCSVFile(file);
            const lines = csvData.split('\n').slice(0, 6); // Show first 5 rows + header
            
            const previewDiv = document.getElementById('csvPreview');
            const table = document.createElement('table');
            
            lines.forEach((line, index) => {
                if (!line.trim()) return;
                
                const row = table.insertRow();
                const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
                
                cells.forEach(cellData => {
                    const cell = index === 0 ? document.createElement('th') : row.insertCell();
                    cell.textContent = cellData;
                    if (index === 0) row.appendChild(cell);
                });
            });

            previewDiv.innerHTML = '<h5>CSV Preview:</h5>';
            previewDiv.appendChild(table);
            previewDiv.style.display = 'block';
        } catch (error) {
            this.showMessage('Failed to preview CSV: ' + error.message, 'error');
        }
    }

    // Download CSV template
    downloadCSVTemplate() {
        const template = `id,name,category,subcategory,latitude,longitude,city,state,address,phone,rating,description
1,All India Institute of Medical Sciences,Healthcare,Hospital,28.5672,77.2100,New Delhi,Delhi,"AIIMS Ansari Nagar, New Delhi",+91-11-26588500,4.5,Premier medical institute and hospital
2,Red Fort,Tourism,Historical Monument,28.6562,77.2410,New Delhi,Delhi,"Netaji Subhash Marg, Chandni Chowk",+91-11-23277705,4.3,UNESCO World Heritage Site - Mughal fortress
3,India Gate,Tourism,Monument,28.6129,77.2295,New Delhi,Delhi,"Rajpath, India Gate",NA,4.4,War memorial arch in New Delhi`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'indian_poi_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showMessage('CSV template downloaded! You can also use the indian_poi_data.csv file in your project folder.', 'success');
    }

    // Validate POI data
    validatePOI(poi) {
        console.log('Validating POI:', poi);
        
        if (!poi) {
            throw new Error('POI data is null or undefined');
        }
        
        if (!poi.name || typeof poi.name !== 'string' || poi.name.trim().length < 2) {
            throw new Error(`Invalid name: "${poi.name}" - must be at least 2 characters`);
        }
        
        if (!poi.category || typeof poi.category !== 'string' || poi.category.trim().length === 0) {
            throw new Error(`Invalid category: "${poi.category}" - category is required`);
        }
        
        if (!poi.description || typeof poi.description !== 'string') {
            poi.description = poi.category; // Use category as fallback
        }
        
        if (typeof poi.latitude !== 'number' || isNaN(poi.latitude)) {
            throw new Error(`Invalid latitude: "${poi.latitude}" - must be a valid number`);
        }
        
        if (poi.latitude < -90 || poi.latitude > 90) {
            throw new Error(`Invalid latitude: ${poi.latitude} - must be between -90 and 90`);
        }
        
        if (typeof poi.longitude !== 'number' || isNaN(poi.longitude)) {
            throw new Error(`Invalid longitude: "${poi.longitude}" - must be a valid number`);
        }
        
        if (poi.longitude < -180 || poi.longitude > 180) {
            throw new Error(`Invalid longitude: ${poi.longitude} - must be between -180 and 180`);
        }

        // Clean and normalize the data
        const cleanedPOI = {
            name: poi.name.trim(),
            category: poi.category.trim().toLowerCase(),
            description: poi.description.trim(),
            latitude: parseFloat(poi.latitude),
            longitude: parseFloat(poi.longitude)
        };
        
        console.log('POI validated successfully:', cleanedPOI);
        return cleanedPOI;
    }

    // Upload single POI
    async uploadSinglePOI(poiData) {
        console.log('Starting single POI upload:', poiData);
        
        // Check authentication
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
            console.error('Authentication check failed - no current user');
            throw new Error('You must be logged in to upload POI data');
        }
        console.log('User authenticated:', currentUser.uid);
        
        // Check Firebase connection
        if (!this.db) {
            console.error('Firebase database not initialized');
            throw new Error('Database connection not available');
        }
        console.log('Firebase database available');
        
        // Check encryption module
        if (!this.encryption) {
            console.error('Encryption module not available');
            throw new Error('Encryption module not available');
        }
        console.log('Encryption module available');
        
        const validatedPOI = this.validatePOI(poiData);
        console.log('POI validated successfully:', validatedPOI);
        
        // Encrypt the POI data
        console.log('Encrypting POI data...');
        let encryptedData;
        try {
            encryptedData = await this.encryption.encryptPOIData({
                ...validatedPOI,
                uploadedBy: currentUser.uid,
                uploadedAt: Date.now()
            });
            console.log('POI data encrypted successfully');
        } catch (encryptError) {
            console.error('Encryption failed:', encryptError);
            throw new Error('Failed to encrypt POI data: ' + encryptError.message);
        }

        // Generate unique POI ID
        const poiId = this.generatePOIId();
        console.log('Generated POI ID:', poiId);

        // Add metadata
        const poiDoc = {
            id: poiId,
            encryptedData: encryptedData,
            category: validatedPOI.category, // Keep category unencrypted for filtering
            uploadedBy: currentUser.uid,
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            // Store approximate location for spatial indexing (with privacy noise)
            approxLatitude: this.addPrivacyNoise(validatedPOI.latitude),
            approxLongitude: this.addPrivacyNoise(validatedPOI.longitude)
        };

        console.log('Saving to Firestore...', poiDoc);
        
        // Save to Firestore
        try {
            await this.db.collection(this.COLLECTIONS.POI_DATA).doc(poiId).set(poiDoc);
            console.log('POI saved successfully to Firestore');
        } catch (firestoreError) {
            console.error('Firestore save error:', firestoreError);
            throw new Error('Failed to save to database: ' + firestoreError.message);
        }
    }

    // Upload bulk POI data
    async uploadBulkPOI(poiList, options = {}) {
        const { skipDuplicates = false, skipErrors = false } = options;
        const batch = this.db.batch();
        const poisRef = this.db.collection(this.COLLECTIONS.POI_DATA);
        
        let successCount = 0;
        const errors = [];

        for (let i = 0; i < poiList.length; i++) {
            try {
                const poi = poiList[i];
                
                // Check for duplicates if requested
                if (skipDuplicates) {
                    const existingQuery = await poisRef
                        .where('approxLatitude', '>=', poi.latitude - 0.001)
                        .where('approxLatitude', '<=', poi.latitude + 0.001)
                        .limit(1)
                        .get();
                    
                    if (!existingQuery.empty) {
                        console.log(`Skipping potential duplicate: ${poi.name}`);
                        continue;
                    }
                }

                // Encrypt POI data
                const encryptedData = await this.encryption.encryptPOIData({
                    ...poi,
                    uploadedBy: this.auth.currentUser.uid,
                    uploadedAt: Date.now()
                });

                // Generate unique POI ID
                const poiId = this.generatePOIId();
                
                // Add metadata
                const poiDoc = {
                    id: poiId,
                    encryptedData: encryptedData,
                    category: poi.category, // Keep category unencrypted for filtering
                    uploadedBy: this.auth.currentUser.uid,
                    uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isActive: true,
                    batchId: Date.now(), // For batch tracking
                    // Store approximate location for spatial indexing (with privacy noise)
                    approxLatitude: this.addPrivacyNoise(poi.latitude),
                    approxLongitude: this.addPrivacyNoise(poi.longitude)
                };

                // Add to batch
                const docRef = poisRef.doc(poiId);
                batch.set(docRef, poiDoc);
                successCount++;

            } catch (error) {
                const errorMsg = `POI ${i + 1}: ${error.message}`;
                errors.push(errorMsg);
                
                if (!skipErrors) {
                    throw new Error(errorMsg);
                }
            }
        }

        // Commit batch
        if (successCount > 0) {
            await batch.commit();
        }

        // Report results
        if (errors.length > 0 && skipErrors) {
            console.warn('Upload completed with errors:', errors);
            this.showMessage(`Uploaded ${successCount} POIs. ${errors.length} errors (check console)`, 'warning');
        }

        return { successCount, errors };
    }

    // Add privacy noise to coordinates
    addPrivacyNoise(coordinate) {
        // Add small random noise to protect exact locations
        const noise = (Math.random() - 0.5) * 0.001; // ±0.0005 degrees (~55m)
        return coordinate + noise;
    }

    // Generate unique POI ID
    generatePOIId() {
        return 'poi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Load uploaded POI data
    async loadUploadedData() {
        console.log('Starting to load uploaded data...');
        
        try {
            // Check authentication
            const currentUser = this.auth.currentUser;
            if (!currentUser) {
                console.log('No authenticated user, skipping data load');
                this.displayUploadedData([]);
                return;
            }
            console.log('User authenticated:', currentUser.uid);

            // Check database connection
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            console.log('Database connection available');

            // Check collections configuration
            if (!this.COLLECTIONS || !this.COLLECTIONS.POI_DATA) {
                throw new Error('POI_DATA collection not configured');
            }
            console.log('Using collection:', this.COLLECTIONS.POI_DATA);

            // Query Firestore
            console.log('Querying Firestore for POI data...');
            const snapshot = await this.db.collection(this.COLLECTIONS.POI_DATA)
                .where('uploadedBy', '==', currentUser.uid)
                .where('isActive', '==', true)
                .orderBy('uploadedAt', 'desc')
                .get();

            console.log('Query completed. Documents found:', snapshot.docs.length);

            this.uploadedData = [];
            const decryptedData = [];

            if (snapshot.docs.length === 0) {
                console.log('No POI documents found for user');
                this.displayUploadedData([]);
                return;
            }

            // Process each document
            for (let i = 0; i < snapshot.docs.length; i++) {
                const doc = snapshot.docs[i];
                const data = doc.data();
                
                console.log(`Processing document ${i + 1}/${snapshot.docs.length}:`, doc.id);
                console.log('Document data keys:', Object.keys(data));

                try {
                    // Check if encrypted data exists
                    if (!data.encryptedData) {
                        console.warn(`Document ${doc.id} missing encryptedData field`);
                        continue;
                    }

                    // Check encryption module
                    if (!this.encryption) {
                        throw new Error('Encryption module not available');
                    }

                    // Decrypt POI data for display
                    console.log(`Decrypting data for document ${doc.id}...`);
                    const decrypted = await this.encryption.decryptPOIData(data.encryptedData);
                    console.log(`Successfully decrypted document ${doc.id}:`, decrypted);
                    
                    this.uploadedData.push(data);
                    decryptedData.push({
                        id: data.id,
                        ...decrypted,
                        uploadedAt: data.uploadedAt
                    });
                } catch (decryptError) {
                    console.error(`Failed to decrypt POI ${doc.id}:`, decryptError);
                    // Continue with other documents even if one fails to decrypt
                }
            }

            console.log(`Successfully processed ${decryptedData.length} POI documents`);
            this.displayUploadedData(decryptedData);
            
        } catch (error) {
            console.error('Failed to load uploaded data:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Show specific error messages
            let errorMessage = 'Failed to load uploaded data';
            if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. Please check your login status.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.message.includes('index')) {
                errorMessage = 'Database index missing. Please contact support.';
            } else {
                errorMessage = `Failed to load data: ${error.message}`;
            }
            
            this.showMessage(errorMessage, 'error');
            
            // Show empty state
            this.displayUploadedData([]);
        }
    }

    // Display uploaded data
    displayUploadedData(data) {
        console.log('Displaying uploaded data:', data.length, 'items');
        
        const container = document.getElementById('adminDataList');
        if (!container) {
            console.error('adminDataList container not found in DOM');
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <p><i class="fas fa-info-circle"></i> No POI data uploaded yet.</p>
                    <p>Use the upload forms above to add location data.</p>
                </div>`;
            return;
        }

        try {
            const dataHTML = data.map((item, index) => {
                // Safely handle missing data
                const name = item.name || 'Unknown Location';
                const category = item.category || 'Unknown';
                const description = item.description || 'No description available';
                const latitude = typeof item.latitude === 'number' ? item.latitude.toFixed(6) : 'N/A';
                const longitude = typeof item.longitude === 'number' ? item.longitude.toFixed(6) : 'N/A';
                const uploadDate = this.formatDate(item.uploadedAt);
                const itemId = item.id || `item_${index}`;

                return `
                    <div class="data-item" data-id="${itemId}">
                        <div class="data-item-header">
                            <h5><i class="fas fa-map-marker-alt"></i> ${name}</h5>
                            <span class="category-badge">${category}</span>
                        </div>
                        <div class="data-item-content">
                            <p><strong>Location:</strong> ${latitude}, ${longitude}</p>
                            <p><strong>Description:</strong> ${description}</p>
                            <p><strong>Uploaded:</strong> ${uploadDate}</p>
                        </div>
                        <div class="data-actions">
                            <button onclick="adminModule.editPOI('${itemId}')" class="edit-btn" title="Edit POI">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="adminModule.deletePOI('${itemId}')" class="delete-btn" title="Delete POI">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div class="data-summary">
                    <p><i class="fas fa-database"></i> Total POI Records: <strong>${data.length}</strong></p>
                </div>
                ${dataHTML}
            `;
            
            console.log('Data displayed successfully');
            
        } catch (error) {
            console.error('Error displaying data:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p><i class="fas fa-exclamation-triangle"></i> Error displaying data</p>
                    <p>Please try refreshing the page</p>
                </div>`;
        }
    }

    // Handle admin logout
    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            await window.eplqAuth.logout();
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMsg = document.querySelector('.admin-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        // Create new message
        const msgDiv = document.createElement('div');
        msgDiv.className = `admin-message ${type}`;
        msgDiv.textContent = message;
        msgDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            min-width: 300px;
            text-align: center;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(msgDiv);

        // Animate in
        setTimeout(() => {
            msgDiv.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            msgDiv.style.transform = 'translateX(100%)';
            setTimeout(() => msgDiv.remove(), 300);
        }, 5000);
    }

    // Test function to upload Indian POI data
    async testIndianPOIData() {
        try {
            this.showMessage('Testing with sample POI data...', 'info');
            
            // Create a small test CSV data
            const testCSV = `id,name,category,subcategory,latitude,longitude,city,state,address,phone,rating,description
1,Test Hospital,Healthcare,Hospital,28.5672,77.2100,New Delhi,Delhi,"Test Address",+91-11-12345678,4.5,Test medical facility
2,Test Restaurant,Food,Restaurant,28.6562,77.2410,New Delhi,Delhi,"Test Location",+91-11-87654321,4.3,Test dining establishment`;
            
            console.log('Test CSV data:', testCSV);
            
            const poiList = this.parseCSVData(testCSV);
            console.log('Parsed test POI list:', poiList);
            
            this.showMessage(`Parsed ${poiList.length} test POIs. Starting upload...`, 'info');
            
            const result = await this.uploadBulkPOI(poiList, { skipErrors: true, validateData: true });
            
            this.showMessage(`Successfully uploaded ${result.successCount} test POIs!`, 'success');
            await this.loadUploadedData();
            
        } catch (error) {
            console.error('Test upload error:', error);
            console.error('Error stack:', error.stack);
            this.showMessage('Test upload failed: ' + error.message, 'error');
        }
    }

    // Format date for display
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    }
}

// Initialize global admin module instance
const adminModule = new EPLQAdmin();

// Export for use in other modules
window.adminModule = adminModule;

console.log('EPLQ Admin module with bulk upload loaded successfully');
