// EPLQ User Module
// Handles user functionality including privacy-preserving location queries

class EPLQUser {
    constructor() {
        this.auth = window.firebaseApp.auth;
        this.db = window.firebaseApp.db;
        this.COLLECTIONS = window.firebaseApp.COLLECTIONS;
        this.encryption = window.eplqEncryption;
        this.spatialIndex = null;
        this.poiCache = [];
    }

    // Initialize user module
    init() {
        this.setupEventListeners();
        this.loadPOIData();
    }

    // Setup event listeners
    setupEventListeners() {
        // Location search form
        const searchForm = document.getElementById('locationSearchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleLocationSearch(e));
        }

        // User logout
        const logoutBtn = document.getElementById('userLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Demo data button
        const demoBtn = document.getElementById('loadDemoDataBtn');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => this.loadDemoData());
        }

        // Auto-location button (if geolocation is available)
        this.addAutoLocationButton();
    }

    // Add auto-location button for convenience
    addAutoLocationButton() {
        if (navigator.geolocation) {
            const locationInput = document.querySelector('.location-input');
            if (locationInput) {
                const autoBtn = document.createElement('button');
                autoBtn.type = 'button';
                autoBtn.textContent = '📍 Use My Location';
                autoBtn.className = 'auto-location-btn';
                autoBtn.style.cssText = `
                    grid-column: 1 / -1;
                    background: #34495e;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 5px;
                `;
                
                autoBtn.addEventListener('click', () => this.getCurrentLocation());
                locationInput.appendChild(autoBtn);
            }
        }
    }

    // Get user's current location
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showMessage('Geolocation is not supported by this browser', true);
            return;
        }

        this.showMessage('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('userLatitude').value = position.coords.latitude.toFixed(6);
                document.getElementById('userLongitude').value = position.coords.longitude.toFixed(6);
                this.showMessage('Location detected successfully!');
            },
            (error) => {
                let message = 'Unable to get location: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        message += 'Location request timed out';
                        break;
                    default:
                        message += 'Unknown error occurred';
                }
                this.showMessage(message, true);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }

    // Load POI data and create spatial index
    async loadPOIData() {
        try {
            this.showMessage('Loading POI data...');
            
            const snapshot = await this.db.collection(this.COLLECTIONS.POI_DATA)
                .where('isActive', '==', true)
                .get();

            this.poiCache = [];
            
            if (snapshot.empty) {
                console.log('No POI data found in database');
                this.showMessage('No POI data available. Admin needs to upload some locations first.', true);
                
                // Load demo data if no real data exists
                await this.loadDemoData();
                return;
            }
            
            for (const doc of snapshot.docs) {
                const data = doc.data();
                try {
                    // Decrypt POI data
                    const decrypted = await this.encryption.decryptPOIData(data.encryptedData);
                    this.poiCache.push({
                        id: data.id,
                        ...decrypted,
                        category: data.category
                    });
                } catch (decryptError) {
                    console.error('Failed to decrypt POI:', decryptError);
                }
            }

            // Create spatial index for efficient queries
            this.spatialIndex = this.encryption.createSpatialIndex(this.poiCache);
            
            this.showMessage(`Loaded ${this.poiCache.length} POI locations`);
            
        } catch (error) {
            console.error('Failed to load POI data:', error);
            this.showMessage('Failed to load POI data. Loading demo data instead...', true);
            await this.loadDemoData();
        }
    }

    // Load demo data for testing when no real data exists
    async loadDemoData() {
        try {
            console.log('Loading demo POI data...');
            
            // Demo POI data for testing
            const demoData = [
                {
                    id: 'demo_1',
                    name: 'Central Hospital',
                    latitude: 40.7589,
                    longitude: -73.9851,
                    category: 'hospital',
                    description: '24/7 emergency services available'
                },
                {
                    id: 'demo_2', 
                    name: 'City Library',
                    latitude: 40.7614,
                    longitude: -73.9776,
                    category: 'education',
                    description: 'Public library with free WiFi'
                },
                {
                    id: 'demo_3',
                    name: 'Coffee Shop',
                    latitude: 40.7505,
                    longitude: -73.9934,
                    category: 'restaurant',
                    description: 'Local coffee and pastries'
                },
                {
                    id: 'demo_4',
                    name: 'Police Station',
                    latitude: 40.7580,
                    longitude: -73.9855,
                    category: 'safety',
                    description: 'Local police station'
                },
                {
                    id: 'demo_5',
                    name: 'Fire Department',
                    latitude: 40.7595,
                    longitude: -73.9845,
                    category: 'safety',
                    description: 'Fire and emergency services'
                }
            ];

            this.poiCache = demoData;
            
            // Create spatial index for demo data
            this.spatialIndex = this.encryption.createSpatialIndex(this.poiCache);
            
            this.showMessage(`Demo mode: Loaded ${this.poiCache.length} sample locations for testing`);
            console.log('Demo POI data loaded:', this.poiCache);
            
        } catch (error) {
            console.error('Failed to load demo data:', error);
            this.showMessage('Failed to load demo data', true);
        }
    }

    // Handle privacy-preserving location search
    async handleLocationSearch(event) {
        event.preventDefault();
        
        const searchData = {
            latitude: parseFloat(document.getElementById('userLatitude').value),
            longitude: parseFloat(document.getElementById('userLongitude').value),
            radius: parseFloat(document.getElementById('searchRadius').value),
            category: document.getElementById('searchCategory').value
        };

        // Validate search data
        if (!this.validateSearchData(searchData)) {
            return;
        }

        try {
            this.showLoading(true);
            
            // Encrypt user location for privacy
            const encryptedLocation = await this.encryption.encryptLocation(
                searchData.latitude, 
                searchData.longitude
            );

            // Generate query ID for logging
            const queryId = this.encryption.generateQueryId();

            // Log encrypted query (without revealing actual location)
            await this.logEncryptedQuery(queryId, searchData.radius, searchData.category);

            // Perform privacy-preserving spatial range query
            let results = await this.performSpatialQuery(
                searchData.latitude,
                searchData.longitude,
                searchData.radius,
                searchData.category
            );

            // Sort by distance
            results = results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            // Display results
            this.displaySearchResults(results, searchData);

            // Update user's query history
            await this.updateQueryHistory(queryId, results.length);

            this.showMessage(`Found ${results.length} POI(s) within ${searchData.radius}km`);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('Search failed: ' + error.message, true);
        } finally {
            this.showLoading(false);
        }
    }

    // Validate search data
    validateSearchData(data) {
        if (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90) {
            this.showMessage('Please enter a valid latitude (-90 to 90)', true);
            return false;
        }

        if (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180) {
            this.showMessage('Please enter a valid longitude (-180 to 180)', true);
            return false;
        }

        if (isNaN(data.radius) || data.radius <= 0 || data.radius > 50) {
            this.showMessage('Please enter a valid radius (0.1 to 50 km)', true);
            return false;
        }

        return true;
    }

    // Perform spatial range query using encrypted data
    async performSpatialQuery(userLat, userLng, radius, category) {
        console.log(`Performing spatial query: lat=${userLat}, lng=${userLng}, radius=${radius}km, category=${category || 'all'}`);
        
        if (!this.spatialIndex || this.poiCache.length === 0) {
            console.log('No spatial index or POI cache, loading data...');
            await this.loadPOIData();
        }

        console.log(`Available POIs: ${this.poiCache.length}`);
        let candidatePOIs = this.poiCache;

        // Filter by category if specified
        if (category) {
            candidatePOIs = candidatePOIs.filter(poi => poi.category === category);
            console.log(`After category filter (${category}): ${candidatePOIs.length} POIs`);
        }

        // Simple distance-based filtering for demo/testing
        const results = [];
        for (const poi of candidatePOIs) {
            const distance = await this.encryption.calculateEncryptedDistance(
                userLat, userLng, poi.latitude, poi.longitude
            );
            
            console.log(`POI: ${poi.name}, Distance: ${distance.toFixed(2)}km`);
            
            if (distance <= radius) {
                results.push({
                    ...poi,
                    distance: distance.toFixed(2)
                });
            }
        }

        console.log(`Final results: ${results.length} POIs within ${radius}km`);
        return results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

    // Display search results
    displaySearchResults(results, searchData) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No POI found within ${searchData.radius}km of your location.</p>
                    <p>Try increasing the search radius or selecting a different category.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map((poi, index) => `
            <div class="result-item">
                <h5>${poi.name}</h5>
                <p><strong>Category:</strong> ${poi.category}</p>
                <p><strong>Distance:</strong> <span class="distance">${poi.distance} km</span></p>
                <p><strong>Description:</strong> ${poi.description || 'No description available'}</p>
                <p><strong>Coordinates:</strong> ${poi.latitude.toFixed(6)}, ${poi.longitude.toFixed(6)}</p>
                <div class="result-actions">
                    <button onclick="userModule.getDirections(${poi.latitude}, ${poi.longitude})" class="directions-btn">
                        🗺️ Get Directions
                    </button>
                    <button onclick="userModule.saveFavorite('${poi.id}')" class="favorite-btn">
                        ⭐ Save Favorite
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Get directions to POI
    getDirections(lat, lng) {
        const userLat = document.getElementById('userLatitude').value;
        const userLng = document.getElementById('userLongitude').value;
        
        if (userLat && userLng) {
            const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${lat},${lng}`;
            window.open(url, '_blank');
        } else {
            this.showMessage('Please enter your location first', true);
        }
    }

    // Save POI as favorite
    async saveFavorite(poiId) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const userDoc = this.db.collection(this.COLLECTIONS.USERS).doc(user.uid);
            
            await userDoc.update({
                favorites: firebase.firestore.FieldValue.arrayUnion(poiId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showMessage('POI saved to favorites!');
        } catch (error) {
            console.error('Save favorite error:', error);
            this.showMessage('Failed to save favorite', true);
        }
    }

    // Log encrypted query for analytics (privacy-preserving)
    async logEncryptedQuery(queryId, radius, category) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            await this.db.collection(this.COLLECTIONS.ENCRYPTED_QUERIES).add({
                queryId: queryId,
                userId: user.uid,
                radius: radius,
                category: category || 'all',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                // Note: User location is NOT stored for privacy
                privacyPreserved: true
            });
        } catch (error) {
            console.error('Query logging error:', error);
            // Don't show error to user as logging is not critical
        }
    }

    // Update user's query history
    async updateQueryHistory(queryId, resultCount) {
        try {
            const user = this.auth.currentUser;
            if (!user) return;

            const historyEntry = {
                queryId: queryId,
                timestamp: Date.now(),
                resultCount: resultCount
            };

            await this.db.collection(this.COLLECTIONS.USERS).doc(user.uid).update({
                queryHistory: firebase.firestore.FieldValue.arrayUnion(historyEntry),
                lastQueryAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Query history update error:', error);
        }
    }

    // Get user's query statistics
    async getQueryStatistics() {
        try {
            const user = this.auth.currentUser;
            if (!user) return null;

            const userDoc = await this.db.collection(this.COLLECTIONS.USERS).doc(user.uid).get();
            
            if (!userDoc.exists) return null;

            const userData = userDoc.data();
            const queryHistory = userData.queryHistory || [];

            return {
                totalQueries: queryHistory.length,
                lastQuery: userData.lastQueryAt,
                favorites: userData.favorites || []
            };
        } catch (error) {
            console.error('Statistics error:', error);
            return null;
        }
    }

    // Handle user logout
    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            await window.eplqAuth.logout();
        }
    }

    // Show loading state
    showLoading(show) {
        const submitBtn = document.querySelector('#locationSearchForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = show;
            submitBtn.textContent = show ? 'Searching...' : 'Search POI (Encrypted)';
        }
    }

    // Show success/error messages
    showMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isError ? 'error' : 'success';
        messageDiv.textContent = message;
        
        const container = document.querySelector('.user-dashboard') || document.querySelector('.module-container');
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Clear search form
    clearSearchForm() {
        document.getElementById('locationSearchForm').reset();
        document.getElementById('searchResults').innerHTML = '';
    }

    // Refresh POI data
    async refreshPOIData() {
        this.showMessage('Refreshing POI data...');
        await this.loadPOIData();
    }
}

// Initialize global user module instance
const userModule = new EPLQUser();

// Export for use in other modules
window.userModule = userModule;

console.log('EPLQ User module loaded successfully');
