// Storage Configuration for Free Tier Optimization
// This file helps configure different storage options based on your needs

const STORAGE_CONFIG = {
    // Firebase free tier limits
    FIREBASE_FREE_STORAGE: 1024 * 1024 * 1024, // 1GB
    FIREBASE_FREE_BANDWIDTH: 10 * 1024 * 1024 * 1024, // 10GB/month
    
    // File size limits for different storage methods
    BASE64_MAX_SIZE: 1024 * 1024, // 1MB - store in Firestore as Base64
    IMGUR_MAX_SIZE: 20 * 1024 * 1024, // 20MB - Imgur limit
    
    // Allowed file types
    ALLOWED_TYPES: {
        documents: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },
    
    // Storage method priorities
    STORAGE_METHODS: {
        'small_documents': 'base64', // < 1MB
        'small_images': 'base64',    // < 1MB
        'large_images': 'imgur',     // 1-20MB images
        'large_documents': 'external', // > 1MB documents
        'oversized': 'external'      // > 20MB anything
    },
    
    // External storage services (free alternatives)
    EXTERNAL_SERVICES: {
        'Google Drive': {
            maxSize: '15GB',
            types: 'all',
            instructions: 'Upload to Google Drive, right-click → Share → Copy link'
        },
        'OneDrive': {
            maxSize: '5GB',
            types: 'all',
            instructions: 'Upload to OneDrive, click Share → Copy link'
        },
        'Dropbox': {
            maxSize: '2GB',
            types: 'all',
            instructions: 'Upload to Dropbox, click Share → Create link'
        },
        'GitHub': {
            maxSize: '100MB per file',
            types: 'documents',
            instructions: 'Upload to GitHub repository, use raw file URL'
        },
        'Imgur': {
            maxSize: '20MB',
            types: 'images',
            instructions: 'Automatic upload for images'
        }
    }
};

// Storage method selector
class StorageOptimizer {
    static getOptimalStorage(file) {
        const fileSize = file.size;
        const fileType = file.type;
        
        // For small files, use Base64 storage in Firestore
        if (fileSize <= STORAGE_CONFIG.BASE64_MAX_SIZE) {
            return {
                method: 'base64',
                reason: 'Small file, storing internally',
                cost: 'Uses Firestore storage'
            };
        }
        
        // For images, prefer Imgur
        if (fileType.startsWith('image/') && fileSize <= STORAGE_CONFIG.IMGUR_MAX_SIZE) {
            return {
                method: 'imgur',
                reason: 'Image file, using free image hosting',
                cost: 'Free with Imgur'
            };
        }
        
        // For large files, recommend external storage
        return {
            method: 'external',
            reason: 'Large file, requires external storage',
            cost: 'Free with cloud storage services',
            recommendations: this.getExternalServiceRecommendations(fileSize, fileType)
        };
    }
    
    static getExternalServiceRecommendations(fileSize, fileType) {
        const recommendations = [];
        
        Object.entries(STORAGE_CONFIG.EXTERNAL_SERVICES).forEach(([service, config]) => {
            if (config.types === 'all' || 
                (config.types === 'images' && fileType.startsWith('image/')) ||
                (config.types === 'documents' && !fileType.startsWith('image/'))) {
                recommendations.push({
                    service,
                    ...config
                });
            }
        });
        
        return recommendations.sort((a, b) => {
            // Prioritize by storage limit (higher is better)
            const aSize = parseFloat(a.maxSize);
            const bSize = parseFloat(b.maxSize);
            return bSize - aSize;
        });
    }
    
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Cost calculator
class StorageCostCalculator {
    static estimateFirebaseCosts(totalFiles, averageFileSize, monthlyViews) {
        const totalStorage = totalFiles * averageFileSize;
        const monthlyBandwidth = monthlyViews * averageFileSize;
        
        const freeStorage = STORAGE_CONFIG.FIREBASE_FREE_STORAGE;
        const freeBandwidth = STORAGE_CONFIG.FIREBASE_FREE_BANDWIDTH;
        
        return {
            storageUsed: totalStorage,
            storageRemaining: Math.max(0, freeStorage - totalStorage),
            bandwidthUsed: monthlyBandwidth,
            bandwidthRemaining: Math.max(0, freeBandwidth - monthlyBandwidth),
            withinFreeLimit: totalStorage <= freeStorage && monthlyBandwidth <= freeBandwidth,
            recommendations: this.getStorageRecommendations(totalStorage, monthlyBandwidth)
        };
    }
    
    static getStorageRecommendations(storage, bandwidth) {
        const recommendations = [];
        
        if (storage > STORAGE_CONFIG.FIREBASE_FREE_STORAGE * 0.8) {
            recommendations.push({
                type: 'storage',
                message: 'Consider using external storage for large files',
                priority: 'high'
            });
        }
        
        if (bandwidth > STORAGE_CONFIG.FIREBASE_FREE_BANDWIDTH * 0.8) {
            recommendations.push({
                type: 'bandwidth',
                message: 'High bandwidth usage detected. Consider CDN or image optimization',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
}

// Usage instructions
const USAGE_INSTRUCTIONS = {
    setup: `
        FREE TIER OPTIMIZATION SETUP:
        
        1. File Size Strategy:
           - Files < 1MB: Store as Base64 in Firestore
           - Images 1-20MB: Upload to Imgur (free)
           - Documents > 1MB: Use external links
        
        2. External Storage Setup:
           - Google Drive: 15GB free
           - OneDrive: 5GB free  
           - Dropbox: 2GB free
        
        3. Imgur Setup (for images):
           - Register at https://api.imgur.com/
           - Get Client ID
           - Update firebase-config.js
    `,
    
    migration: `
        MIGRATING EXISTING FILES:
        
        1. Export large files from Firebase Storage
        2. Upload to external storage
        3. Update document records with new URLs
        4. Delete from Firebase Storage
    `,
    
    monitoring: `
        MONITORING USAGE:
        
        1. Check Firebase Console regularly
        2. Monitor storage and bandwidth usage
        3. Set up alerts at 80% capacity
        4. Use the built-in storage calculator
    `
};

export { STORAGE_CONFIG, StorageOptimizer, StorageCostCalculator, USAGE_INSTRUCTIONS };
