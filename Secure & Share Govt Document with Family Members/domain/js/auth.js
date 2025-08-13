// Authentication module
import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initializeAuthListener();
        this.initializeAuthEventHandlers();
    }

    // Initialize authentication state listener
    initializeAuthListener() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });
    }

    // Handle authentication state changes
    handleAuthStateChange(user) {
        const loginSection = document.getElementById('loginSection');
        const registerSection = document.getElementById('registerSection');
        const forgotPasswordSection = document.getElementById('forgotPasswordSection');
        const dashboardSection = document.getElementById('dashboardSection');
        const userName = document.getElementById('userName');

        if (user) {
            // User is signed in
            loginSection.classList.add('hidden');
            registerSection.classList.add('hidden');
            forgotPasswordSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            
            // Update user name
            if (userName) {
                this.getUserProfile(user.uid).then(profile => {
                    userName.textContent = profile?.name || user.email;
                });
            }

            // Load user data
            this.loadUserData();
        } else {
            // User is signed out
            loginSection.classList.remove('hidden');
            registerSection.classList.add('hidden');
            forgotPasswordSection.classList.add('hidden');
            dashboardSection.classList.add('hidden');
        }
    }

    // Initialize authentication event handlers
    initializeAuthEventHandlers() {
        // Navigation between auth forms
        document.addEventListener('click', (e) => {
            if (e.target.id === 'showRegister' || e.target.id === 'showRegisterFromReset') {
                this.showSection('register');
            } else if (e.target.id === 'showLogin' || e.target.id === 'backToLogin') {
                this.showSection('login');
            } else if (e.target.id === 'showForgotPassword') {
                this.showSection('forgotPassword');
            }
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // Show specific authentication section
    showSection(section) {
        const sections = ['login', 'register', 'forgotPassword'];
        sections.forEach(s => {
            const element = document.getElementById(`${s}Section`);
            if (element) {
                if (s === section) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        await this.login(email, password);
    }

    // Handle register form submission
    async handleRegister(event) {
        event.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const govId = document.getElementById('govId').value;
        
        await this.register(email, password, name, govId);
    }

    // Handle forgot password form submission
    async handleForgotPassword(event) {
        event.preventDefault();
        const email = document.getElementById('resetEmail').value;
        
        // Validate email
        if (!this.validateEmail(email)) {
            this.showAlert('Please enter a valid email address.', 'error');
            return;
        }
        
        await this.sendPasswordReset(email);
    }

    // Email validation helper
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Register new user
    async register(email, password, name, govId) {
        try {
            this.showLoading(true);
            
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user profile to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                governmentId: govId,
                createdAt: new Date(),
                familyMembers: []
            });

            this.showAlert('Account created successfully!', 'success');
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert(this.getErrorMessage(error.code), 'error');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Login user
    async login(email, password) {
        try {
            this.showLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.showAlert('Logged in successfully!', 'success');
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert(this.getErrorMessage(error.code), 'error');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Logout user
    async logout() {
        try {
            await signOut(auth);
            this.showAlert('Logged out successfully!', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.showAlert('Error logging out. Please try again.', 'error');
        }
    }

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            this.showLoading(true);
            
            await sendPasswordResetEmail(auth, email);
            
            this.showAlert(
                'Password reset email sent! Please check your inbox and follow the instructions to reset your password.',
                'success'
            );
            
            // Optionally redirect back to login
            setTimeout(() => {
                this.showSection('login');
            }, 3000);
            
        } catch (error) {
            console.error('Password reset error:', error);
            this.showAlert(this.getErrorMessage(error.code), 'error');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Confirm password reset with code
    async confirmPasswordReset(code, newPassword) {
        try {
            await confirmPasswordReset(auth, code, newPassword);
            this.showAlert('Password reset successfully! You can now login with your new password.', 'success');
            return true;
        } catch (error) {
            console.error('Password reset confirmation error:', error);
            this.showAlert(this.getErrorMessage(error.code), 'error');
            throw error;
        }
    }

    // Get user profile from Firestore
    async getUserProfile(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    // Load user data (documents, family members, etc.)
    async loadUserData() {
        if (!this.currentUser) return;

        // This will be implemented in the documents and family modules
        if (window.documentsManager) {
            window.documentsManager.loadDocuments();
        }
        if (window.familyManager) {
            window.familyManager.loadFamilyMembers();
        }
    }

    // Show loading state
    showLoading(show) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                if (show) {
                    submitBtn.disabled = true;
                    // Store original text if not already stored
                    if (!submitBtn.dataset.originalText) {
                        submitBtn.dataset.originalText = submitBtn.innerHTML;
                    }
                    
                    // Set loading text based on form type
                    if (form.id === 'loginForm') {
                        submitBtn.innerHTML = '<span class="loading"></span> Logging in...';
                    } else if (form.id === 'registerForm') {
                        submitBtn.innerHTML = '<span class="loading"></span> Creating account...';
                    } else if (form.id === 'forgotPasswordForm') {
                        submitBtn.innerHTML = '<span class="loading"></span> Sending reset link...';
                    } else {
                        submitBtn.innerHTML = '<span class="loading"></span> Loading...';
                    }
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
                }
            }
        });
    }

    // Show alert messages
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert alert at the top of the main content
        const main = document.querySelector('.main');
        main.insertBefore(alert, main.firstChild);

        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please use a different email or try logging in.',
            'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection and try again.',
            'auth/invalid-action-code': 'Invalid or expired reset link. Please request a new password reset.',
            'auth/expired-action-code': 'Reset link has expired. Please request a new password reset.',
            'auth/weak-password': 'Please choose a stronger password with at least 6 characters.',
            'auth/missing-email': 'Please enter your email address.',
            'auth/invalid-continue-uri': 'Invalid reset link. Please try again.',
            'auth/unauthorized-continue-uri': 'Unauthorized reset link. Please try again.'
        };
        
        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

export default window.authManager;
