// EPLQ Main Application
// Coordinates all modules and handles navigation

class EPLQApp {
    constructor() {
        this.currentSection = 'home';
        this.isInitialized = false;
    }

    // Initialize the application
    init() {
        if (this.isInitialized) return;
        
        this.setupNavigation();
        this.setupAuthenticationTabs();
        this.setupAuthenticationForms();
        this.setupAuthStateListener();
        this.setupUploadTabs(); // Add upload tabs initialization
        
        // Initialize modules
        if (window.adminModule) {
            window.adminModule.init();
        }
        
        if (window.userModule) {
            window.userModule.init();
        }
        
        this.isInitialized = true;
        console.log('EPLQ Application initialized successfully');
    }

    // Setup navigation between sections
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.id.replace('Btn', '');
                this.navigateToSection(targetSection);
            });
        });
    }

    // Navigate to a specific section
    navigateToSection(sectionId) {
        // Remove active class from all nav buttons and sections
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

        // Add active class to current nav button and section
        document.getElementById(sectionId + 'Btn').classList.add('active');
        document.getElementById(sectionId).classList.add('active');

        this.currentSection = sectionId;

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    // Load data specific to each section
    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'admin':
                if (window.adminModule && window.firebaseApp.getCurrentUser()) {
                    window.adminModule.loadUploadedData();
                }
                break;
            case 'user':
                if (window.userModule && window.firebaseApp.getCurrentUser()) {
                    window.userModule.loadPOIData();
                }
                break;
        }
    }

    // Setup authentication tabs (Login/Register)
    setupAuthenticationTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                const container = button.closest('.auth-container');
                
                // Remove active class from all tabs and forms in this container
                container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                container.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding form
                button.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });
    }

    // Setup authentication forms
    setupAuthenticationForms() {
        // Admin forms
        this.setupAdminForms();
        
        // User forms
        this.setupUserForms();
    }

    // Setup admin authentication forms
    setupAdminForms() {
        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('adminEmail').value.trim();
                const password = document.getElementById('adminPassword').value;
                
                if (!email || !password) {
                    this.showMessage('Please fill in all fields', true, 'admin');
                    return;
                }
                
                const result = await window.eplqAuth.loginAdmin(email, password);
                if (result.success) {
                    adminLoginForm.reset();
                }
            });
        }

        // Admin register form
        const adminRegisterForm = document.getElementById('adminRegisterForm');
        if (adminRegisterForm) {
            adminRegisterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('adminName').value.trim();
                const email = document.getElementById('adminRegEmail').value.trim();
                const password = document.getElementById('adminRegPassword').value;
                
                if (!name || !email || !password) {
                    this.showMessage('Please fill in all fields', true, 'admin');
                    return;
                }
                
                if (password.length < 6) {
                    this.showMessage('Password must be at least 6 characters long', true, 'admin');
                    return;
                }
                
                const result = await window.eplqAuth.registerAdmin(name, email, password);
                if (result.success) {
                    adminRegisterForm.reset();
                    // Switch to login tab
                    document.querySelector('[data-tab="adminLogin"]').click();
                }
            });
        }

        // Admin forgot password
        const adminForgotBtn = document.getElementById('adminForgotPassword');
        if (adminForgotBtn) {
            adminForgotBtn.addEventListener('click', () => {
                this.showPasswordResetModal('admin');
            });
        }
    }

    // Setup user authentication forms
    setupUserForms() {
        // User login form
        const userLoginForm = document.getElementById('userLoginForm');
        if (userLoginForm) {
            userLoginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('userEmail').value.trim();
                const password = document.getElementById('userPassword').value;
                
                if (!email || !password) {
                    this.showMessage('Please fill in all fields', true, 'user');
                    return;
                }
                
                const result = await window.eplqAuth.loginUser(email, password);
                if (result.success) {
                    userLoginForm.reset();
                }
            });
        }

        // User register form
        const userRegisterForm = document.getElementById('userRegisterForm');
        if (userRegisterForm) {
            userRegisterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('userName').value.trim();
                const email = document.getElementById('userRegEmail').value.trim();
                const password = document.getElementById('userRegPassword').value;
                
                if (!name || !email || !password) {
                    this.showMessage('Please fill in all fields', true, 'user');
                    return;
                }
                
                if (password.length < 6) {
                    this.showMessage('Password must be at least 6 characters long', true, 'user');
                    return;
                }
                
                const result = await window.eplqAuth.registerUser(name, email, password);
                if (result.success) {
                    userRegisterForm.reset();
                    // Switch to login tab
                    document.querySelector('[data-tab="userLogin"]').click();
                }
            });
        }

        // User forgot password
        const userForgotBtn = document.getElementById('userForgotPassword');
        if (userForgotBtn) {
            userForgotBtn.addEventListener('click', () => {
                this.showPasswordResetModal('user');
            });
        }
    }

    // Setup authentication state listener
    setupAuthStateListener() {
        if (window.eplqAuth) {
            window.eplqAuth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });
        }
    }

    // Handle authentication state changes
    async handleAuthStateChange(user) {
        if (user) {
            console.log('User authenticated:', user.email);
            
            // Verify user role and show appropriate dashboard
            const userType = window.firebaseApp.getUserType();
            
            if (userType === 'admin') {
                const isValidAdmin = await window.eplqAuth.verifyUserRole(user.uid, 'admin');
                if (isValidAdmin) {
                    window.eplqAuth.showAdminDashboard();
                } else {
                    await window.eplqAuth.logout();
                    this.showMessage('Invalid admin credentials', true, 'admin');
                }
            } else if (userType === 'user') {
                const isValidUser = await window.eplqAuth.verifyUserRole(user.uid, 'user');
                if (isValidUser) {
                    window.eplqAuth.showUserDashboard();
                } else {
                    await window.eplqAuth.logout();
                    this.showMessage('Invalid user credentials', true, 'user');
                }
            }
        } else {
            console.log('User logged out');
            window.eplqAuth.hideAllDashboards();
        }
    }

    // Show messages in appropriate section
    showMessage(message, isError = false, section = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isError ? 'error' : 'success';
        messageDiv.textContent = message;
        
        let container;
        if (section) {
            container = document.querySelector(`#${section} .module-container`);
        } else {
            container = document.querySelector('.section.active .module-container') || 
                       document.querySelector('.section.active');
        }
        
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Show loading overlay
    showLoading(show = true, message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');
        
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    color: white;
                    font-size: 1.2rem;
                `;
                document.body.appendChild(overlay);
            }
            overlay.textContent = message;
            overlay.style.display = 'flex';
        } else {
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }

    // Handle errors globally
    handleError(error, context = 'Application') {
        console.error(`${context} error:`, error);
        this.showMessage(`${context} error: ${error.message}`, true);
    }

    // Get application statistics
    async getAppStatistics() {
        try {
            const stats = {
                totalUsers: 0,
                totalAdmins: 0,
                totalPOIs: 0,
                totalQueries: 0
            };

            // Get user counts
            const usersSnapshot = await window.firebaseApp.db
                .collection(window.firebaseApp.COLLECTIONS.USERS)
                .where('isActive', '==', true)
                .get();
            stats.totalUsers = usersSnapshot.size;

            // Get admin counts
            const adminsSnapshot = await window.firebaseApp.db
                .collection(window.firebaseApp.COLLECTIONS.ADMINS)
                .where('isActive', '==', true)
                .get();
            stats.totalAdmins = adminsSnapshot.size;

            // Get POI counts
            const poisSnapshot = await window.firebaseApp.db
                .collection(window.firebaseApp.COLLECTIONS.POI_DATA)
                .where('isActive', '==', true)
                .get();
            stats.totalPOIs = poisSnapshot.size;

            // Get query counts
            const queriesSnapshot = await window.firebaseApp.db
                .collection(window.firebaseApp.COLLECTIONS.ENCRYPTED_QUERIES)
                .get();
            stats.totalQueries = queriesSnapshot.size;

            return stats;
        } catch (error) {
            console.error('Statistics error:', error);
            return null;
        }
    }

    // Export application data
    async exportApplicationData() {
        try {
            const stats = await this.getAppStatistics();
            const exportData = {
                timestamp: new Date().toISOString(),
                statistics: stats,
                version: '1.0.0',
                description: 'EPLQ Application Data Export'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `eplq_app_data_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showMessage('Application data exported successfully');
        } catch (error) {
            this.handleError(error, 'Data Export');
        }
    }

    // Show password reset modal
    showPasswordResetModal(userType) {
        const modal = document.getElementById('passwordResetModal');
        const emailInput = document.getElementById('resetEmailInput');
        const sendBtn = document.getElementById('sendResetBtn');
        const cancelBtn = document.getElementById('cancelResetBtn');

        // Pre-fill email if available
        const currentEmail = userType === 'admin' 
            ? document.getElementById('adminEmail').value.trim()
            : document.getElementById('userEmail').value.trim();
        
        emailInput.value = currentEmail;
        
        // Show modal
        modal.style.display = 'flex';
        emailInput.focus();

        // Setup event handlers
        const handleSendReset = async () => {
            const email = emailInput.value.trim();
            
            if (!email) {
                this.showMessage('Please enter your email address', true);
                return;
            }
            
            if (!this.validateEmail(email)) {
                this.showMessage('Please enter a valid email address', true);
                return;
            }

            try {
                sendBtn.disabled = true;
                sendBtn.textContent = 'Sending...';
                
                const result = await window.eplqAuth.resetPassword(email);
                
                if (result.success) {
                    this.showMessage('Password reset email sent! Check your inbox.', false, userType);
                    this.hidePasswordResetModal();
                }
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send Reset Email';
            }
        };

        const handleCancel = () => {
            this.hidePasswordResetModal();
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleSendReset();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };

        // Remove existing event listeners
        sendBtn.replaceWith(sendBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        
        // Add new event listeners
        document.getElementById('sendResetBtn').addEventListener('click', handleSendReset);
        document.getElementById('cancelResetBtn').addEventListener('click', handleCancel);
        emailInput.addEventListener('keypress', handleKeyPress);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePasswordResetModal();
            }
        });
    }

    // Hide password reset modal
    hidePasswordResetModal() {
        const modal = document.getElementById('passwordResetModal');
        modal.style.display = 'none';
        
        // Clear input
        document.getElementById('resetEmailInput').value = '';
    }

    // Setup upload tabs functionality
    setupUploadTabs() {
        // Set default active tab for single upload
        const firstTab = document.querySelector('.upload-tab-btn[data-tab="singleUpload"]');
        const firstContent = document.getElementById('singleUpload');
        
        if (firstTab && firstContent) {
            firstTab.classList.add('active');
            firstContent.classList.add('active');
        }

        // Add event listeners to tab buttons (handled by admin module)
        console.log('Upload tabs setup completed');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for all modules to load
    let initAttempts = 0;
    const maxAttempts = 10;
    
    const tryInit = () => {
        if (window.firebaseApp && window.eplqEncryption && window.eplqAuth) {
            const app = new EPLQApp();
            app.init();
            window.eplqApp = app;
        } else if (initAttempts < maxAttempts) {
            initAttempts++;
            setTimeout(tryInit, 500);
        } else {
            console.error('Failed to initialize EPLQ application - modules not loaded');
        }
    };
    
    tryInit();
});

// Handle page unload
window.addEventListener('beforeunload', (e) => {
    if (window.firebaseApp.getCurrentUser()) {
        e.preventDefault();
        e.returnValue = 'You have an active session. Are you sure you want to leave?';
    }
});

console.log('EPLQ Main Application script loaded');
