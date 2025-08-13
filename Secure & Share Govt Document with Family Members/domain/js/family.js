// Family management module
import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    query, 
    where, 
    updateDoc,
    arrayUnion,
    arrayRemove 
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

class FamilyManager {
    constructor() {
        this.familyMembers = [];
        this.initializeFamilyHandlers();
    }

    // Initialize family-related event handlers
    initializeFamilyHandlers() {
        // Add family member form
        const familyForm = document.getElementById('familyForm');
        if (familyForm) {
            familyForm.addEventListener('submit', (e) => this.handleAddFamilyMember(e));
        }

        // Add family button
        const addFamilyBtn = document.getElementById('addFamilyBtn');
        if (addFamilyBtn) {
            addFamilyBtn.addEventListener('click', () => this.showFamilyModal());
        }
    }

    // Show family modal
    showFamilyModal() {
        const modal = document.getElementById('familyModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Handle add family member
    async handleAddFamilyMember(event) {
        event.preventDefault();
        
        if (!window.authManager.isAuthenticated()) {
            window.authManager.showAlert('Please log in to add family members.', 'error');
            return;
        }

        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('familyEmail');
        const relationship = formData.get('relationship');

        try {
            this.showFamilyProgress(true);
            
            // Check if user exists in the system
            const userExists = await this.checkUserExists(email);
            if (!userExists) {
                window.authManager.showAlert('User with this email does not exist in the system.', 'error');
                return;
            }

            // Check if already added
            const alreadyAdded = this.familyMembers.find(member => member.email === email);
            if (alreadyAdded) {
                window.authManager.showAlert('This family member is already added.', 'error');
                return;
            }

            // Don't allow adding yourself
            if (email === window.authManager.getCurrentUser().email) {
                window.authManager.showAlert('You cannot add yourself as a family member.', 'error');
                return;
            }

            // Add family member
            const familyData = {
                userId: window.authManager.getCurrentUser().uid,
                memberEmail: email,
                relationship: relationship,
                addedAt: new Date(),
                status: 'pending' // pending, accepted, rejected
            };

            await addDoc(collection(db, 'familyMembers'), familyData);

            // Add to activity log
            await this.addActivity('family_added', `Added ${email} as ${relationship}`);

            window.authManager.showAlert('Family member added successfully!', 'success');
            this.closeFamilyModal();
            this.loadFamilyMembers();

        } catch (error) {
            console.error('Add family member error:', error);
            window.authManager.showAlert('Failed to add family member. Please try again.', 'error');
        } finally {
            this.showFamilyProgress(false);
        }
    }

    // Close family modal
    closeFamilyModal() {
        const modal = document.getElementById('familyModal');
        if (modal) {
            modal.classList.add('hidden');
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    // Show family progress
    showFamilyProgress(show) {
        const submitBtn = document.querySelector('#familyForm button[type="submit"]');
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> Adding...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add Family Member';
            }
        }
    }

    // Check if user exists in the system
    async checkUserExists(email) {
        try {
            const usersQuery = query(
                collection(db, 'users'),
                where('email', '==', email)
            );
            const querySnapshot = await getDocs(usersQuery);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }

    // Load family members
    async loadFamilyMembers() {
        if (!window.authManager.isAuthenticated()) return;

        try {
            const userId = window.authManager.getCurrentUser().uid;
            
            // Get family members added by current user
            const addedQuery = query(
                collection(db, 'familyMembers'),
                where('userId', '==', userId)
            );
            
            // Get family invitations received by current user
            const invitedQuery = query(
                collection(db, 'familyMembers'),
                where('memberEmail', '==', window.authManager.getCurrentUser().email)
            );

            const [addedSnapshot, invitedSnapshot] = await Promise.all([
                getDocs(addedQuery),
                getDocs(invitedQuery)
            ]);

            this.familyMembers = [];
            
            // Process added family members
            addedSnapshot.forEach(doc => {
                const data = doc.data();
                this.familyMembers.push({
                    id: doc.id,
                    email: data.memberEmail,
                    relationship: data.relationship,
                    status: data.status,
                    addedAt: data.addedAt,
                    type: 'added' // you added them
                });
            });
            
            // Process received invitations
            invitedSnapshot.forEach(doc => {
                const data = doc.data();
                this.familyMembers.push({
                    id: doc.id,
                    email: data.memberEmail,
                    relationship: data.relationship,
                    status: data.status,
                    addedAt: data.addedAt,
                    type: 'invited', // they added you
                    inviterUserId: data.userId
                });
            });

            this.renderFamilyMembers();
        } catch (error) {
            console.error('Error loading family members:', error);
            window.authManager.showAlert('Failed to load family members.', 'error');
        }
    }

    // Render family members list
    renderFamilyMembers() {
        const familyList = document.getElementById('familyList');
        if (!familyList) return;

        if (this.familyMembers.length === 0) {
            familyList.innerHTML = '<p>No family members added yet. Click "Add Family Member" to get started!</p>';
            return;
        }

        familyList.innerHTML = this.familyMembers.map(member => `
            <div class="family-item" data-member-id="${member.id}">
                <div class="family-info">
                    <div class="family-name">${member.email}</div>
                    <div class="family-relationship">${member.relationship}</div>
                    <div class="family-status">
                        <span class="status-badge status-${member.status}">${member.status}</span>
                        ${member.type === 'invited' ? '(Invitation from family)' : '(Added by you)'}
                    </div>
                </div>
                <div class="family-actions">
                    ${member.type === 'invited' && member.status === 'pending' ? `
                        <button class="btn-small btn-share" onclick="familyManager.acceptInvitation('${member.id}')">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn-small btn-delete" onclick="familyManager.rejectInvitation('${member.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                    ${member.type === 'added' ? `
                        <button class="btn-small btn-delete" onclick="familyManager.removeFamilyMember('${member.id}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Accept family invitation
    async acceptInvitation(memberId) {
        try {
            await updateDoc(doc(db, 'familyMembers', memberId), {
                status: 'accepted'
            });

            await this.addActivity('family_accepted', 'Accepted family invitation');
            window.authManager.showAlert('Family invitation accepted!', 'success');
            this.loadFamilyMembers();
        } catch (error) {
            console.error('Error accepting invitation:', error);
            window.authManager.showAlert('Failed to accept invitation.', 'error');
        }
    }

    // Reject family invitation
    async rejectInvitation(memberId) {
        try {
            await updateDoc(doc(db, 'familyMembers', memberId), {
                status: 'rejected'
            });

            await this.addActivity('family_rejected', 'Rejected family invitation');
            window.authManager.showAlert('Family invitation rejected.', 'info');
            this.loadFamilyMembers();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            window.authManager.showAlert('Failed to reject invitation.', 'error');
        }
    }

    // Remove family member
    async removeFamilyMember(memberId) {
        if (!confirm('Are you sure you want to remove this family member?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'familyMembers', memberId));
            
            await this.addActivity('family_removed', 'Removed family member');
            window.authManager.showAlert('Family member removed.', 'info');
            this.loadFamilyMembers();
        } catch (error) {
            console.error('Error removing family member:', error);
            window.authManager.showAlert('Failed to remove family member.', 'error');
        }
    }

    // Get family members for sharing (accepted only)
    async getFamilyMembers() {
        await this.loadFamilyMembers();
        return this.familyMembers
            .filter(member => member.status === 'accepted')
            .map(member => ({
                id: member.id,
                name: member.email,
                relationship: member.relationship
            }));
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

    // Load recent activities
    async loadRecentActivities() {
        if (!window.authManager.isAuthenticated()) return;

        try {
            const userId = window.authManager.getCurrentUser().uid;
            const activitiesQuery = query(
                collection(db, 'activities'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(activitiesQuery);
            const activities = [];
            
            snapshot.forEach(doc => {
                activities.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderRecentActivities(activities.slice(0, 10)); // Show last 10 activities
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    // Render recent activities
    renderRecentActivities(activities) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        if (activities.length === 0) {
            activityList.innerHTML = '<p>No recent activity.</p>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">
                    <small>${this.formatDate(activity.timestamp.toDate())}</small>
                </div>
            </div>
        `).join('');
    }

    // Utility function
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    }
}

// Create global family manager instance
window.familyManager = new FamilyManager();

export default window.familyManager;
