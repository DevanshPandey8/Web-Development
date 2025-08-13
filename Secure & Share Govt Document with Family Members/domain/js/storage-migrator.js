// Migration and Optimization Script
// Run this to optimize existing Firebase Storage usage

import { db, storage } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    updateDoc, 
    doc, 
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { 
    ref, 
    getDownloadURL, 
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

class StorageMigrator {
    constructor() {
        this.migrationResults = {
            processed: 0,
            migrated: 0,
            errors: 0,
            spaceSaved: 0
        };
    }

    // Main migration function
    async migrateToOptimizedStorage() {
        if (!window.authManager.isAuthenticated()) {
            console.error('User must be authenticated to run migration');
            return;
        }

        console.log('Starting storage migration...');
        
        try {
            // Get all user documents
            const userDocs = await this.getUserDocuments();
            console.log(`Found ${userDocs.length} documents to process`);

            // Process each document
            for (const docData of userDocs) {
                await this.processDocument(docData);
            }

            console.log('Migration completed:', this.migrationResults);
            this.showMigrationResults();

        } catch (error) {
            console.error('Migration failed:', error);
        }
    }

    // Get all user documents from Firestore
    async getUserDocuments() {
        const userId = window.authManager.getCurrentUser().uid;
        const userDocsQuery = query(
            collection(db, 'documents'),
            where('ownerId', '==', userId)
        );
        
        const snapshot = await getDocs(userDocsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    // Process individual document for optimization
    async processDocument(docData) {
        this.migrationResults.processed++;
        
        try {
            // Skip if already optimized or external
            if (docData.storageType && docData.storageType !== 'firebase') {
                console.log(`Skipping ${docData.title} - already optimized`);
                return;
            }

            // Skip if no file path (external link)
            if (!docData.filePath) {
                console.log(`Skipping ${docData.title} - no file path`);
                return;
            }

            // Determine optimal storage method
            const fileSize = docData.fileSize || 0;
            const fileName = docData.fileName || '';
            const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);

            let shouldMigrate = false;
            let newStorageType = 'firebase';
            let migrationAction = '';

            // Decision logic
            if (fileSize > 5 * 1024 * 1024) { // > 5MB
                shouldMigrate = true;
                newStorageType = 'external';
                migrationAction = 'Move to external storage';
            } else if (isImage && fileSize > 1024 * 1024) { // Images > 1MB
                shouldMigrate = true;
                newStorageType = 'imgur';
                migrationAction = 'Move to Imgur';
            } else if (fileSize <= 1024 * 1024) { // <= 1MB
                shouldMigrate = true;
                newStorageType = 'base64';
                migrationAction = 'Convert to Base64';
            }

            if (!shouldMigrate) {
                console.log(`No migration needed for ${docData.title}`);
                return;
            }

            console.log(`Migrating ${docData.title}: ${migrationAction}`);

            // Perform migration based on target storage type
            let migrationResult;
            switch (newStorageType) {
                case 'base64':
                    migrationResult = await this.migrateToBase64(docData);
                    break;
                case 'imgur':
                    migrationResult = await this.migrateToImgur(docData);
                    break;
                case 'external':
                    migrationResult = await this.migrateToExternal(docData);
                    break;
            }

            if (migrationResult.success) {
                this.migrationResults.migrated++;
                this.migrationResults.spaceSaved += fileSize;
                console.log(`Successfully migrated ${docData.title}`);
            } else {
                this.migrationResults.errors++;
                console.error(`Failed to migrate ${docData.title}:`, migrationResult.error);
            }

        } catch (error) {
            this.migrationResults.errors++;
            console.error(`Error processing ${docData.title}:`, error);
        }
    }

    // Migrate file to Base64 storage
    async migrateToBase64(docData) {
        try {
            // Download file from Firebase Storage
            const fileRef = ref(storage, docData.filePath);
            const downloadURL = await getDownloadURL(fileRef);
            
            // Fetch file content
            const response = await fetch(downloadURL);
            const blob = await response.blob();
            
            // Convert to Base64
            const base64Data = await this.blobToBase64(blob);
            
            // Update document in Firestore
            await updateDoc(doc(db, 'documents', docData.id), {
                storageType: 'base64',
                fileData: base64Data,
                mimeType: blob.type,
                migratedAt: new Date(),
                originalFilePath: docData.filePath
            });
            
            // Delete from Firebase Storage
            await deleteObject(fileRef);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Migrate image to Imgur
    async migrateToImgur(docData) {
        try {
            // This is a placeholder - you need to implement Imgur upload
            // For now, just mark as needing manual migration
            await updateDoc(doc(db, 'documents', docData.id), {
                storageType: 'needs_migration',
                targetStorage: 'imgur',
                migrationNote: 'Manual Imgur upload required',
                originalFilePath: docData.filePath
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Migrate to external storage (manual process)
    async migrateToExternal(docData) {
        try {
            // Mark for manual migration
            await updateDoc(doc(db, 'documents', docData.id), {
                storageType: 'needs_migration',
                targetStorage: 'external',
                migrationNote: 'Manual external upload required - file too large',
                originalFilePath: docData.filePath,
                downloadURL: docData.fileURL
            });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Convert blob to Base64
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to convert blob to Base64'));
            reader.readAsDataURL(blob);
        });
    }

    // Show migration results
    showMigrationResults() {
        const results = this.migrationResults;
        const spaceSavedMB = (results.spaceSaved / (1024 * 1024)).toFixed(2);
        
        const resultHTML = `
            <div class="migration-results">
                <h3>Migration Complete</h3>
                <div class="stats">
                    <div class="stat">
                        <span class="label">Processed:</span>
                        <span class="value">${results.processed} documents</span>
                    </div>
                    <div class="stat">
                        <span class="label">Migrated:</span>
                        <span class="value">${results.migrated} documents</span>
                    </div>
                    <div class="stat">
                        <span class="label">Errors:</span>
                        <span class="value">${results.errors} documents</span>
                    </div>
                    <div class="stat">
                        <span class="label">Space Saved:</span>
                        <span class="value">${spaceSavedMB} MB</span>
                    </div>
                </div>
                <div class="next-steps">
                    <h4>Next Steps:</h4>
                    <ul>
                        <li>Check documents marked as "needs_migration"</li>
                        <li>Manually upload large files to Google Drive/Dropbox</li>
                        <li>Update external URLs in the system</li>
                        <li>Delete old files from Firebase Storage</li>
                    </ul>
                </div>
            </div>
        `;
        
        // Show results in a modal or alert
        if (window.authManager) {
            window.authManager.showAlert(
                `Migration completed! Processed: ${results.processed}, Migrated: ${results.migrated}, Space saved: ${spaceSavedMB}MB`,
                'success'
            );
        }
        
        console.log(resultHTML);
    }

    // Get documents that need manual migration
    async getDocumentsNeedingMigration() {
        const userId = window.authManager.getCurrentUser().uid;
        const needsMigrationQuery = query(
            collection(db, 'documents'),
            where('ownerId', '==', userId),
            where('storageType', '==', 'needs_migration')
        );
        
        const snapshot = await getDocs(needsMigrationQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    // Quick storage usage check
    async checkCurrentStorageUsage() {
        try {
            const userDocs = await this.getUserDocuments();
            let totalSize = 0;
            let breakdown = {
                firebase: 0,
                base64: 0,
                external: 0,
                imgur: 0
            };

            userDocs.forEach(doc => {
                const size = doc.fileSize || 0;
                totalSize += size;
                
                const storageType = doc.storageType || 'firebase';
                breakdown[storageType] = (breakdown[storageType] || 0) + size;
            });

            return {
                totalDocuments: userDocs.length,
                totalSize: totalSize,
                breakdown: breakdown,
                freeSpaceRemaining: (1024 * 1024 * 1024) - breakdown.firebase // 1GB free tier
            };
        } catch (error) {
            console.error('Error checking storage usage:', error);
            return null;
        }
    }
}

// Create global migrator instance
window.storageMigrator = new StorageMigrator();

// Add migration button to UI (call this from your main app)
function addMigrationButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.innerHTML = '<i class="fas fa-sync"></i> Optimize Storage';
    button.onclick = () => {
        if (confirm('This will optimize your storage usage. Large files will be marked for manual migration. Continue?')) {
            window.storageMigrator.migrateToOptimizedStorage();
        }
    };
    
    // Add to navigation or settings area
    const nav = document.querySelector('.nav-buttons') || document.querySelector('nav');
    if (nav) {
        nav.appendChild(button);
    }
}

// Usage instructions
console.log(`
STORAGE MIGRATION USAGE:

1. Automatic Migration:
   window.storageMigrator.migrateToOptimizedStorage()

2. Check Usage:
   window.storageMigrator.checkCurrentStorageUsage()

3. Get Manual Migration Tasks:
   window.storageMigrator.getDocumentsNeedingMigration()

4. Add Migration Button to UI:
   addMigrationButton()
`);

export { StorageMigrator, addMigrationButton };
