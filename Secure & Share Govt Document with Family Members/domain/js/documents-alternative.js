// Alternative Documents management module for free tier optimization
// This version uses Base64 encoding for small files and external storage options

import { db } from './firebase-config.js';
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

class AlternativeDocumentsManager {
    constructor() {
        this.documents = [];
        this.maxBase64Size = 1024 * 1024; // 1MB limit for Base64 storage
        this.initializeDocumentHandlers();
    }

    // Initialize document-related event handlers
    initializeDocumentHandlers() {
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleDocumentUpload(e));
        }

        // Add storage option selector
        this.addStorageOptionSelector();
    }

    // Add storage option selector to upload form
    addStorageOptionSelector() {
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm && !document.getElementById('storageOption')) {
            const storageSelector = document.createElement('div');
            storageSelector.innerHTML = `
                <div class="form-group">
                    <label for="storageOption">Storage Method:</label>
                    <select id="storageOption" name="storageOption" required>
                        <option value="auto">Auto-select (recommended)</option>
                        <option value="base64">Internal Storage (small files)</option>
                        <option value="external">External Link</option>
                        <option value="imgur">Imgur (images only)</option>
                    </select>
                    <small>Auto-select chooses the best option based on file size</small>
                </div>
            `;
            uploadForm.insertBefore(storageSelector, uploadForm.querySelector('button'));
        }
    }

    // Handle document upload with multiple storage options
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
        const storageOption = formData.get('storageOption') || 'auto';

        // File size validation
        const maxSize = 10 * 1024 * 1024; // 10MB absolute max
        if (file.size > maxSize) {
            window.authManager.showAlert('File size must be less than 10MB.', 'error');
            return;
        }

        try {
            this.showUploadProgress(true);
            
            let docData;
            const selectedFamily = this.getSelectedFamilyMembers();

            // Choose storage method
            let finalStorageOption = storageOption;
            if (storageOption === 'auto') {
                if (file.size <= this.maxBase64Size) {
                    finalStorageOption = 'base64';
                } else if (file.type.startsWith('image/')) {
                    finalStorageOption = 'imgur';
                } else {
                    // For large files, ask user to use external link
                    window.authManager.showAlert(
                        'File is too large for free storage. Please upload to Google Drive, Dropbox, or similar service and use "External Link" option.',
                        'warning'
                    );
                    this.showExternalLinkOption();
                    return;
                }
            }

            // Handle different storage methods
            switch (finalStorageOption) {
                case 'base64':
                    docData = await this.uploadAsBase64(file, title, type, selectedFamily);
                    break;
                case 'imgur':
                    docData = await this.uploadToImgur(file, title, type, selectedFamily);
                    break;
                case 'external':
                    docData = await this.saveExternalLink(title, type, selectedFamily);
                    break;
                default:
                    throw new Error('Invalid storage option');
            }

            // Save to Firestore
            await addDoc(collection(db, 'documents'), docData);
            await this.addActivity('uploaded', `Document "${title}" uploaded via ${finalStorageOption}`);

            window.authManager.showAlert('Document uploaded successfully!', 'success');
            this.closeModal(document.getElementById('uploadModal'));
            this.loadDocuments();

        } catch (error) {
            console.error('Upload error:', error);
            window.authManager.showAlert(`Failed to upload document: ${error.message}`, 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    // Upload small files as Base64 encoded strings
    async uploadAsBase64(file, title, type, selectedFamily) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result;
                resolve({
                    title: title,
                    type: type,
                    fileName: file.name,
                    fileSize: file.size,
                    storageType: 'base64',
                    fileData: base64Data,
                    mimeType: file.type,
                    ownerId: window.authManager.getCurrentUser().uid,
                    sharedWith: selectedFamily,
                    uploadedAt: new Date(),
                    lastModified: new Date()
                });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // Upload images to Imgur (free image hosting)
    async uploadToImgur(file, title, type, selectedFamily) {
        if (!file.type.startsWith('image/')) {
            throw new Error('Imgur only supports image files');
        }

        const base64Data = await this.fileToBase64(file);
        const imgurData = base64Data.split(',')[1]; // Remove data URL prefix

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': 'Client-ID YOUR_IMGUR_CLIENT_ID', // You need to get this from Imgur
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imgurData,
                type: 'base64',
                title: title
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload to Imgur. Using fallback method.');
        }

        const result = await response.json();
        
        return {
            title: title,
            type: type,
            fileName: file.name,
            fileSize: file.size,
            storageType: 'imgur',
            fileURL: result.data.link,
            deleteHash: result.data.deletehash, // For deletion
            ownerId: window.authManager.getCurrentUser().uid,
            sharedWith: selectedFamily,
            uploadedAt: new Date(),
            lastModified: new Date()
        };
    }

    // Save external link (Google Drive, Dropbox, etc.)
    async saveExternalLink(title, type, selectedFamily) {
        const externalURL = prompt('Please enter the public URL of your document (from Google Drive, Dropbox, etc.):');
        
        if (!externalURL) {
            throw new Error('External URL is required');
        }

        // Basic URL validation
        try {
            new URL(externalURL);
        } catch {
            throw new Error('Please enter a valid URL');
        }

        return {
            title: title,
            type: type,
            fileName: 'External Link',
            fileSize: 0,
            storageType: 'external',
            fileURL: externalURL,
            ownerId: window.authManager.getCurrentUser().uid,
            sharedWith: selectedFamily,
            uploadedAt: new Date(),
            lastModified: new Date()
        };
    }

    // Show external link option
    showExternalLinkOption() {
        const instruction = document.createElement('div');
        instruction.className = 'external-link-instruction';
        instruction.innerHTML = `
            <div class="alert alert-info">
                <h4>Large File Detected</h4>
                <p>To save storage space, please:</p>
                <ol>
                    <li>Upload your file to Google Drive, OneDrive, or Dropbox</li>
                    <li>Make the file publicly accessible</li>
                    <li>Copy the share link</li>
                    <li>Select "External Link" storage option and paste the link</li>
                </ol>
                <button onclick="this.parentElement.remove()">Got it</button>
            </div>
        `;
        
        const form = document.getElementById('uploadForm');
        form.insertBefore(instruction, form.firstChild);
        
        // Auto-select external option
        document.getElementById('storageOption').value = 'external';
    }

    // Convert file to Base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // View document with different storage types
    async viewDocument(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        try {
            switch (doc.storageType) {
                case 'base64':
                    // Create blob URL from base64 data
                    const byteCharacters = atob(doc.fileData.split(',')[1]);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: doc.mimeType });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    // Clean up the blob URL after a delay
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    break;
                    
                case 'imgur':
                case 'external':
                    window.open(doc.fileURL, '_blank');
                    break;
                    
                default:
                    window.authManager.showAlert('Unknown storage type', 'error');
                    return;
            }
            
            await this.addActivity('viewed', `Document "${doc.title}" viewed`);
        } catch (error) {
            console.error('Error viewing document:', error);
            window.authManager.showAlert('Failed to open document', 'error');
        }
    }

    // Get selected family members
    getSelectedFamilyMembers() {
        const selectedFamily = [];
        const checkboxes = document.querySelectorAll('#familyCheckboxes input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            selectedFamily.push(checkbox.value);
        });
        return selectedFamily;
    }

    // Enhanced document rendering with storage type indicators
    renderDocuments() {
        const documentsList = document.getElementById('documentsList');
        if (!documentsList) return;

        if (this.documents.length === 0) {
            documentsList.innerHTML = '<p>No documents found. Upload your first document!</p>';
            return;
        }

        documentsList.innerHTML = this.documents.map(doc => `
            <div class="document-item" data-doc-id="${doc.id}">
                <div class="document-header">
                    <div class="document-title">${doc.title}</div>
                    <div class="storage-badge storage-${doc.storageType || 'firebase'}">
                        ${this.getStorageTypeBadge(doc.storageType)}
                    </div>
                </div>
                <div class="document-type">${doc.type}</div>
                <div class="document-meta">
                    <small>
                        ${doc.isOwner ? 'Owned by you' : 'Shared with you'} • 
                        ${doc.storageType === 'external' ? 'External Link' : this.formatFileSize(doc.fileSize)} • 
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

    // Get storage type badge
    getStorageTypeBadge(storageType) {
        const badges = {
            'base64': '📄 Internal',
            'imgur': '🖼️ Imgur',
            'external': '🔗 External',
            'firebase': '🔥 Firebase'
        };
        return badges[storageType] || '📁 Unknown';
    }

    // Rest of the methods remain the same as the original DocumentsManager
    // ... (include all other methods from the original file)
}

// Usage instructions in comments
/*
SETUP INSTRUCTIONS FOR FREE TIER:

1. For Imgur integration (free image hosting):
   - Go to https://api.imgur.com/oauth2/addclient
   - Register your application
   - Replace 'YOUR_IMGUR_CLIENT_ID' with your actual client ID

2. For optimal free tier usage:
   - Files under 1MB: Stored as Base64 in Firestore
   - Images over 1MB: Upload to Imgur
   - Documents over 1MB: Use external links (Google Drive, etc.)

3. Alternative free storage services you can integrate:
   - Cloudinary (images)
   - GitHub (for public documents)
   - IPFS (decentralized storage)

4. To switch to this alternative system:
   - Replace the import in your main files
   - Update CSS to include storage badges
   - Test with different file sizes
*/

export default AlternativeDocumentsManager;
