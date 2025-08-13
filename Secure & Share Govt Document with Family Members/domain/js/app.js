// Main application entry point
import authManager from './auth.js';
import documentsManager from './documents.js';
import familyManager from './family.js';

class App {
    constructor() {
        this.init();
    }

    // Initialize the application
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Authentication forms
        this.setupAuthForms();
        
        // Navigation
        this.setupNavigation();
        
        // Modal controls
        this.setupModalControls();
        
        // Initialize managers
        this.initializeManagers();
    }

    // Setup authentication forms
    setupAuthForms() {
        // Authentication forms are now handled in auth.js
        // This method is kept for any additional app-specific auth setup
        
        // Add any app-specific authentication setup here if needed
        console.log('Authentication forms initialized');
    }

    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.navigateToSection(targetId);
            });
        });
    }

    // Navigate to section
    navigateToSection(sectionId) {
        // This is a simple implementation - in a real app you might want more sophisticated routing
        const sections = document.querySelectorAll('.dashboard .card');
        
        switch (sectionId) {
            case 'home':
                // Show dashboard overview
                break;
            case 'documents':
                this.scrollToElement('documentsList');
                break;
            case 'family':
                this.scrollToElement('familyList');
                break;
            case 'profile':
                this.showProfileSection();
                break;
        }
    }

    // Scroll to element
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Show profile section (placeholder)
    showProfileSection() {
        authManager.showAlert('Profile section coming soon!', 'info');
    }

    // Setup modal controls
    setupModalControls() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal:not(.hidden)');
                openModals.forEach(modal => {
                    modal.classList.add('hidden');
                });
            }
        });
    }

    // Initialize managers
    initializeManagers() {
        // Load initial data when user is authenticated
        authManager.initializeAuthListener();
        
        // Set up periodic data refresh
        this.setupDataRefresh();
    }

    // Setup periodic data refresh
    setupDataRefresh() {
        // Refresh data every 5 minutes if user is authenticated
        setInterval(() => {
            if (authManager.isAuthenticated()) {
                this.refreshData();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Refresh application data
    async refreshData() {
        try {
            if (authManager.isAuthenticated()) {
                await Promise.all([
                    documentsManager.loadDocuments(),
                    familyManager.loadFamilyMembers(),
                    familyManager.loadRecentActivities()
                ]);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    // Utility methods
    showLoading(show = true) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.remove('hidden');
            } else {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    // Handle application errors
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        authManager.showAlert(`An error occurred: ${error.message}`, 'error');
    }

    // Get application state
    getAppState() {
        return {
            isAuthenticated: authManager.isAuthenticated(),
            currentUser: authManager.getCurrentUser(),
            documentsCount: documentsManager.getDocuments().length,
            familyMembersCount: familyManager.familyMembers.length
        };
    }
}

// Initialize the application
const app = new App();

// Make app globally available for debugging
window.app = app;

// Export for potential module use
export default app;
