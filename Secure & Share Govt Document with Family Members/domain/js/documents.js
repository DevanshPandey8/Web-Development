// Documents management module
import { db, storage } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    updateDoc,
    arrayUnion 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

class DocumentsManager {
    constructor() {
        this.documents = [];
        this.initializeDocumentHandlers();
    }

    // Initialize document-related event handlers
    initializeDocumentHandlers() {
        // Upload document form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleDocumentUpload(e));
        }

        // Upload button
        const uploadBtn = document.getElementById('uploadDocBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Click outside modal to close
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    // Show upload modal
    showUploadModal() {
        const modal = document.getElementById('uploadModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadFamilyMembersForSharing();
        }
    }

    // Close modal
    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            // Reset form if exists
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    // Handle document upload
    async handleDocumentUpload(event) {
        event.preventDefault();
        
        if (!window.authManager.isAuthenticated()) {
            window.authManager.showAlert('Please log in to upload documents.', 'error');
            return;
        }

        const form = event.target;
        const formData = new FormData(form);
        const file = document.getElementById('docFile').files[0];
        const title = formData.get('docTitle');
        const type = formData.get('docType');

        // File size validation (limit to 5MB for free tier)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            window.authManager.showAlert('File size must be less than 5MB. Please compress your document.', 'error');
            return;
        }

        // File type validation
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            window.authManager.showAlert('Only PDF, JPEG, PNG, and WebP files are allowed.', 'error');
            return;
        }
        
        // Get selected family members
        const selectedFamily = [];
        const checkboxes = document.querySelectorAll('#familyCheckboxes input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            selectedFamily.push(checkbox.value);
        });

        try {
            this.showUploadProgress(true);
            
            // Compress image if it's an image file
            let fileToUpload = file;
            if (file.type.startsWith('image/')) {
                fileToUpload = await this.compressImage(file);
            }
            
            // Upload file to Firebase Storage with optimized path
            const fileRef = ref(storage, `docs/${window.authManager.getCurrentUser().uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(fileRef, fileToUpload);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Save document metadata to Firestore
            const docData = {
                title: title,
                type: type,
                fileName: file.name,
                fileSize: fileToUpload.size,
                originalSize: file.size,
                fileURL: downloadURL,
                filePath: snapshot.ref.fullPath,
                ownerId: window.authManager.getCurrentUser().uid,
                sharedWith: selectedFamily,
                uploadedAt: new Date(),
                lastModified: new Date(),
                compressed: file.type.startsWith('image/') && fileToUpload.size < file.size
            };

            await addDoc(collection(db, 'documents'), docData);

            // Add to activity log
            await this.addActivity('uploaded', `Document "${title}" uploaded`);

            window.authManager.showAlert('Document uploaded successfully!', 'success');
            this.closeModal(document.getElementById('uploadModal'));
            this.loadDocuments();

        } catch (error) {
            console.error('Upload error:', error);
            window.authManager.showAlert('Failed to upload document. Please try again.', 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    // Show upload progress
    showUploadProgress(show) {
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Uploading...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Upload Document';
            }
        }
    }

    // Load user documents
    async loadDocuments() {
        if (!window.authManager.isAuthenticated()) return;

        try {
            // Check storage usage
            await this.checkStorageUsage();

            const userId = window.authManager.getCurrentUser().uid;
            
            // Get documents owned by user or shared with user
            const ownedQuery = query(
                collection(db, 'documents'),
                where('ownerId', '==', userId),
                orderBy('uploadedAt', 'desc')
            );
            
            const sharedQuery = query(
                collection(db, 'documents'),
                where('sharedWith', 'array-contains', userId),
                orderBy('uploadedAt', 'desc')
            );

            const [ownedDocs, sharedDocs] = await Promise.all([
                getDocs(ownedQuery),
                getDocs(sharedQuery)
            ]);

            this.documents = [];
            
            // Combine owned and shared documents
            ownedDocs.forEach(doc => {
                this.documents.push({ id: doc.id, ...doc.data(), isOwner: true });
            });
            
            sharedDocs.forEach(doc => {
                // Avoid duplicates
                if (!this.documents.find(d => d.id === doc.id)) {
                    this.documents.push({ id: doc.id, ...doc.data(), isOwner: false });
                }
            });

            this.renderDocuments();
        } catch (error) {
            console.error('Error loading documents:', error);
            window.authManager.showAlert('Failed to load documents.', 'error');
        }
    }

    // Render documents list
    renderDocuments() {
        const documentsList = document.getElementById('documentsList');
        if (!documentsList) return;

        if (this.documents.length === 0) {
            documentsList.innerHTML = '<p>No documents found. Upload your first document!</p>';
            return;
        }

        documentsList.innerHTML = this.documents.map(doc => `
            <div class="document-item" data-doc-id="${doc.id}">
                <div class="document-title">${doc.title}</div>
                <div class="document-type">${doc.type}</div>
                <div class="document-meta">
                    <small>
                        ${doc.isOwner ? 'Owned by you' : 'Shared with you'} • 
                        ${this.formatFileSize(doc.fileSize)} • 
                        ${this.formatDate(doc.uploadedAt.toDate())}
                    </small>
                </div>
                <div class="document-actions">
                    <button class="btn-small btn-view" onclick="documentsManager.viewDocument('${doc.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${doc.isOwner ? `
                        <button class="btn-small btn-share" onclick="documentsManager.shareDocument('${doc.id}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                        <button class="btn-small btn-delete" onclick="documentsManager.deleteDocument('${doc.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // View document
    async viewDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (doc) {
            window.open(doc.fileURL, '_blank');
            await this.addActivity('viewed', `Document "${doc.title}" viewed`);
        }
    }

    // Share document (placeholder - would show a modal with family members)
    shareDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (doc) {
            window.authManager.showAlert('Share functionality will be implemented here.', 'info');
        }
    }

    // Delete document
    async deleteDocument(docId) {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }

        try {
            const doc = this.documents.find(d => d.id === docId);
            if (!doc) return;

            // Delete file from storage
            const fileRef = ref(storage, doc.filePath);
            await deleteObject(fileRef);

            // Delete document from Firestore
            await deleteDoc(doc(db, 'documents', docId));

            // Add to activity log
            await this.addActivity('deleted', `Document "${doc.title}" deleted`);

            window.authManager.showAlert('Document deleted successfully.', 'success');
            this.loadDocuments();
        } catch (error) {
            console.error('Delete error:', error);
            window.authManager.showAlert('Failed to delete document.', 'error');
        }
    }

    // Load family members for sharing checkbox
    async loadFamilyMembersForSharing() {
        if (!window.familyManager) return;

        const familyCheckboxes = document.getElementById('familyCheckboxes');
        if (!familyCheckboxes) return;

        const familyMembers = await window.familyManager.getFamilyMembers();
        
        if (familyMembers.length === 0) {
            familyCheckboxes.innerHTML = '<p>No family members added yet.</p>';
            return;
        }

        familyCheckboxes.innerHTML = familyMembers.map(member => `
            <div class="checkbox-item">
                <input type="checkbox" id="family_${member.id}" value="${member.id}">
                <label for="family_${member.id}">${member.name} (${member.relationship})</label>
            </div>
        `).join('');
    }

    // Add activity log entry
    async addActivity(action, description) {
        try {
            await addDoc(collection(db, 'activities'), {
                userId: window.authManager.getCurrentUser().uid,
                action: action,
                description: description,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error adding activity:', error);
        }
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Image compression function
    async compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    // Create a new File object with the compressed blob
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Storage usage tracking
    async checkStorageUsage() {
        try {
            const userId = window.authManager.getCurrentUser().uid;
            const userDocs = query(
                collection(db, 'documents'),
                where('ownerId', '==', userId)
            );
            
            const snapshot = await getDocs(userDocs);
            let totalSize = 0;
            
            snapshot.forEach((doc) => {
                totalSize += doc.data().fileSize || 0;
            });

            // Firebase free tier: 1GB storage
            const freeLimit = 1024 * 1024 * 1024; // 1GB
            const usagePercent = (totalSize / freeLimit) * 100;

            // Warn user if approaching limit
            if (usagePercent > 80) {
                window.authManager.showAlert(
                    `Storage usage: ${this.formatFileSize(totalSize)} (${usagePercent.toFixed(1)}%). Consider deleting old documents.`, 
                    'warning'
                );
            }

            return { totalSize, usagePercent, freeLimit };
        } catch (error) {
            console.error('Error checking storage usage:', error);
            return null;
        }
    }

    // Get documents for external use
    getDocuments() {
        return this.documents;
    }
}

// Create global documents manager instance
window.documentsManager = new DocumentsManager();

export default window.documentsManager;
