// EPLQ Authentication Module
// Handles admin and user authentication with Firebase

class EPLQAuth {
    constructor() {
        this.auth = window.firebaseApp.auth;
        this.db = window.firebaseApp.db;
        this.COLLECTIONS = window.firebaseApp.COLLECTIONS;
    }

    // Show success message
    showMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isError ? 'error' : 'success';
        messageDiv.textContent = message;
        
        // Find the appropriate container
        const activeSection = document.querySelector('.section.active');
        const container = activeSection.querySelector('.module-container') || activeSection;
        
        container.insertBefore(messageDiv, container.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Admin Registration
    async registerAdmin(name, email, password) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store admin data in Firestore
            await this.db.collection(this.COLLECTIONS.ADMINS).doc(user.uid).set({
                name: name,
                email: email,
                role: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });

            // Update user profile
            await user.updateProfile({
                displayName: name
            });

            this.showMessage('Admin registered successfully!');
            return { success: true, user: user };
        } catch (error) {
            console.error('Admin registration error:', error);
            this.showMessage(this.getErrorMessage(error), true);
            return { success: false, error: error.message };
        }
    }

    // User Registration
    async registerUser(name, email, password) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store user data in Firestore
            await this.db.collection(this.COLLECTIONS.USERS).doc(user.uid).set({
                name: name,
                email: email,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                queryHistory: []
            });

            // Update user profile
            await user.updateProfile({
                displayName: name
            });

            this.showMessage('User registered successfully!');
            return { success: true, user: user };
        } catch (error) {
            console.error('User registration error:', error);
            this.showMessage(this.getErrorMessage(error), true);
            return { success: false, error: error.message };
        }
    }

    // Admin Login
    async loginAdmin(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Verify admin role
            const adminDoc = await this.db.collection(this.COLLECTIONS.ADMINS).doc(user.uid).get();
            
            if (!adminDoc.exists) {
                await this.auth.signOut();
                throw new Error('Access denied. Admin account not found.');
            }

            const adminData = adminDoc.data();
            if (!adminData.isActive) {
                await this.auth.signOut();
                throw new Error('Admin account is deactivated.');
            }

            window.firebaseApp.setCurrentUser(user, 'admin');
            this.showMessage('Admin login successful!');
            this.showAdminDashboard();
            
            return { success: true, user: user, userData: adminData };
        } catch (error) {
            console.error('Admin login error:', error);
            this.showMessage(this.getErrorMessage(error), true);
            return { success: false, error: error.message };
        }
    }

    // User Login
    async loginUser(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Verify user role
            const userDoc = await this.db.collection(this.COLLECTIONS.USERS).doc(user.uid).get();
            
            if (!userDoc.exists) {
                await this.auth.signOut();
                throw new Error('Access denied. User account not found.');
            }

            const userData = userDoc.data();
            if (!userData.isActive) {
                await this.auth.signOut();
                throw new Error('User account is deactivated.');
            }

            window.firebaseApp.setCurrentUser(user, 'user');
            this.showMessage('User login successful!');
            this.showUserDashboard();
            
            return { success: true, user: user, userData: userData };
        } catch (error) {
            console.error('User login error:', error);
            this.showMessage(this.getErrorMessage(error), true);
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth.signOut();
            window.firebaseApp.setCurrentUser(null, null);
            this.showMessage('Logged out successfully!');
            this.hideAllDashboards();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Logout failed', true);
            return { success: false, error: error.message };
        }
    }

    // Show Admin Dashboard
    showAdminDashboard() {
        document.getElementById('adminAuth').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        // Load admin data
        if (window.adminModule) {
            window.adminModule.loadUploadedData();
        }
    }

    // Show User Dashboard
    showUserDashboard() {
        document.getElementById('userAuth').style.display = 'none';
        document.getElementById('userDashboard').style.display = 'block';
    }

    // Hide All Dashboards
    hideAllDashboards() {
        document.getElementById('adminAuth').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('userAuth').style.display = 'block';
        document.getElementById('userDashboard').style.display = 'none';
    }

    // Get user-friendly error messages
    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'Email address is already registered.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            default:
                return error.message || 'An error occurred. Please try again.';
        }
    }

    // Check authentication state
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    // Get current user
    getCurrentUser() {
        return this.auth.currentUser;
    }

    // Verify user role
    async verifyUserRole(userId, expectedRole) {
        try {
            const collection = expectedRole === 'admin' ? this.COLLECTIONS.ADMINS : this.COLLECTIONS.USERS;
            const userDoc = await this.db.collection(collection).doc(userId).get();
            
            if (!userDoc.exists) {
                return false;
            }

            const userData = userDoc.data();
            return userData.role === expectedRole && userData.isActive;
        } catch (error) {
            console.error('Role verification error:', error);
            return false;
        }
    }

    // Update user profile
    async updateProfile(userId, userType, updateData) {
        try {
            const collection = userType === 'admin' ? this.COLLECTIONS.ADMINS : this.COLLECTIONS.USERS;
            await this.db.collection(collection).doc(userId).update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
        }
    }

    // Password reset
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            this.showMessage('Password reset email sent!');
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            this.showMessage(this.getErrorMessage(error), true);
            return { success: false, error: error.message };
        }
    }
}

// Initialize global authentication instance
const eplqAuth = new EPLQAuth();

// Export for use in other modules
window.eplqAuth = eplqAuth;

console.log('EPLQ Authentication module loaded successfully');
