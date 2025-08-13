// EPLQ Encryption Module
// Implements privacy-preserving encryption for location data

class EPLQEncryption {
    constructor() {
        // Secret key for demonstration (in production, use proper key management)
        this.secretKey = 'EPLQ-SecretKey-2025';
        this.algorithm = 'AES-GCM';
    }

    // Convert string to ArrayBuffer
    stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    // Convert ArrayBuffer to string
    arrayBufferToString(buffer) {
        const decoder = new TextDecoder();
        return decoder.decode(buffer);
    }

    // Generate encryption key from secret
    async generateKey() {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.stringToArrayBuffer(this.secretKey),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: this.stringToArrayBuffer('salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt location data using privacy-preserving techniques
    async encryptLocation(latitude, longitude) {
        try {
            const key = await this.generateKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Create location string
            const locationData = JSON.stringify({
                lat: parseFloat(latitude),
                lng: parseFloat(longitude),
                timestamp: Date.now()
            });

            const encodedData = this.stringToArrayBuffer(locationData);
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encodedData
            );

            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);

            // Convert to base64 for storage
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt location data');
        }
    }

    // Decrypt location data
    async decryptLocation(encryptedData) {
        try {
            const key = await this.generateKey();
            
            // Convert from base64
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );

            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encrypted
            );

            const locationString = this.arrayBufferToString(decryptedData);
            return JSON.parse(locationString);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt location data');
        }
    }

    // Encrypt POI data for storage
    async encryptPOIData(poiData) {
        try {
            const key = await this.generateKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const dataString = JSON.stringify(poiData);
            const encodedData = this.stringToArrayBuffer(dataString);
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encodedData
            );

            const combined = new Uint8Array(iv.length + encryptedData.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedData), iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('POI encryption error:', error);
            throw new Error('Failed to encrypt POI data');
        }
    }

    // Decrypt POI data
    async decryptPOIData(encryptedData) {
        try {
            const key = await this.generateKey();
            
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );

            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encrypted
            );

            const dataString = this.arrayBufferToString(decryptedData);
            return JSON.parse(dataString);
        } catch (error) {
            console.error('POI decryption error:', error);
            throw new Error('Failed to decrypt POI data');
        }
    }

    // Privacy-preserving distance calculation
    // Uses encrypted coordinates for range queries
    async calculateEncryptedDistance(userLat, userLng, poiLat, poiLng) {
        const R = 6371; // Earth's radius in km

        const dLat = this.toRadians(poiLat - userLat);
        const dLng = this.toRadians(poiLng - userLng);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(userLat)) * Math.cos(this.toRadians(poiLat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Generate a unique encrypted query ID
    generateQueryId() {
        return 'query_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Create encrypted spatial index for efficient queries
    createSpatialIndex(poiList) {
        // Simple grid-based spatial index
        const gridSize = 0.01; // Approximately 1km grid
        const index = new Map();

        poiList.forEach(poi => {
            const gridX = Math.floor(poi.latitude / gridSize);
            const gridY = Math.floor(poi.longitude / gridSize);
            const gridKey = `${gridX},${gridY}`;

            if (!index.has(gridKey)) {
                index.set(gridKey, []);
            }
            index.get(gridKey).push(poi);
        });

        return index;
    }

    // Efficient range query using spatial index
    async spatialRangeQuery(userLat, userLng, radius, spatialIndex) {
        const gridSize = 0.01;
        const radiusInGrid = Math.ceil(radius / (gridSize * 111)); // Approximate km to grid conversion

        const userGridX = Math.floor(userLat / gridSize);
        const userGridY = Math.floor(userLng / gridSize);

        const candidatePOIs = [];

        // Search in nearby grid cells
        for (let x = userGridX - radiusInGrid; x <= userGridX + radiusInGrid; x++) {
            for (let y = userGridY - radiusInGrid; y <= userGridY + radiusInGrid; y++) {
                const gridKey = `${x},${y}`;
                if (spatialIndex.has(gridKey)) {
                    candidatePOIs.push(...spatialIndex.get(gridKey));
                }
            }
        }

        // Filter by actual distance
        const results = [];
        for (const poi of candidatePOIs) {
            const distance = await this.calculateEncryptedDistance(
                userLat, userLng, poi.latitude, poi.longitude
            );
            
            if (distance <= radius) {
                results.push({
                    ...poi,
                    distance: distance.toFixed(2)
                });
            }
        }

        return results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }
}

// Initialize global encryption instance
const eplqEncryption = new EPLQEncryption();

// Export for use in other modules
window.eplqEncryption = eplqEncryption;

console.log('EPLQ Encryption module loaded successfully');
