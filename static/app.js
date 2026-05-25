// State variables
let teamMembers = [];
let activityLogs = [];

// DOM Elements
const teamGrid = document.getElementById('team-grid');
const activityLogContainer = document.getElementById('activity-log-container');
const searchInput = document.getElementById('search-input');
const departmentFilter = document.getElementById('department-filter');
const addMemberBtn = document.getElementById('btn-add-member');
const addMemberSidebarBtn = document.getElementById('btn-add-member-sidebar');
const addMemberModal = document.getElementById('add-member-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const addMemberForm = document.getElementById('add-member-form');
const toastContainer = document.getElementById('toast-container');
const currentDateElement = document.getElementById('current-date');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statAvailable = document.getElementById('stat-available');
const statUnavailable = document.getElementById('stat-unavailable');
const statPercentage = document.getElementById('stat-percentage');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    fetchData();
    setupEventListeners();
});

// Update the header date
function initDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// Fetch all database records
async function fetchData() {
    try {
        await Promise.all([fetchMembers(), fetchLogs()]);
    } catch (error) {
        showToast('Error loading dashboard data', 'error');
        console.error(error);
    }
}

// Fetch members API
async function fetchMembers() {
    const response = await fetch('/api/members');
    if (!response.ok) throw new Error('Failed to fetch members');
    teamMembers = await response.json();
    calculateStats();
    filterAndRender();
}

// Fetch logs API
async function fetchLogs() {
    const response = await fetch('/api/logs');
    if (!response.ok) throw new Error('Failed to fetch logs');
    activityLogs = await response.json();
    renderLogs();
}

// Stats mathematics
function calculateStats() {
    const total = teamMembers.length;
    const available = teamMembers.filter(m => m.is_available).length;
    const unavailable = total - available;
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

    statTotal.textContent = total;
    statAvailable.textContent = available;
    statUnavailable.textContent = unavailable;
    statPercentage.textContent = `${percentage}%`;
}

// Setup all event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', filterAndRender);
    
    // Department Filter
    departmentFilter.addEventListener('change', filterAndRender);

    // Modal open
    addMemberBtn.addEventListener('click', openModal);
    addMemberSidebarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    // Modal close
    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    addMemberModal.addEventListener('click', (e) => {
        if (e.target === addMemberModal) closeModal();
    });

    // Form submit
    addMemberForm.addEventListener('submit', handleAddMemberSubmit);
}

// Open modal logic
function openModal() {
    addMemberModal.classList.add('open');
    document.getElementById('member-name').focus();
}

// Close modal logic
function closeModal() {
    addMemberModal.classList.remove('open');
    addMemberForm.reset();
}

// Search and filter coordination
function filterAndRender() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const selectedDept = departmentFilter.value;

    const filtered = teamMembers.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery) || 
                              member.role.toLowerCase().includes(searchQuery);
        const matchesDept = selectedDept === 'all' || member.department === selectedDept;
        
        return matchesSearch && matchesDept;
    });

    renderMembers(filtered);
}

// Parse SQLite date string safely
function parseSqliteDate(dateStr) {
    if (!dateStr) return new Date();
    // Format YYYY-MM-DD HH:MM:SS -> ISO format YYYY-MM-DDTHH:MM:SS
    const isoFormat = dateStr.replace(' ', 'T');
    return new Date(isoFormat);
}

// Calculate time difference ago
function timeAgo(dateString) {
    const date = parseSqliteDate(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 0 || seconds < 30) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Extract Name Initials (e.g. Sarah Jenkins -> SJ)
function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Render team grid
function renderMembers(members) {
    teamGrid.innerHTML = '';
    
    if (members.length === 0) {
        teamGrid.innerHTML = `
            <div class="grid-loading">
                <i data-lucide="users-round" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
                <p>No team members match your criteria.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    members.forEach(member => {
        const card = document.createElement('div');
        card.className = `member-card ${member.is_available ? 'available' : 'unavailable'}`;
        card.id = `member-card-${member.id}`;
        
        const initials = getInitials(member.name);
        const lastUpdatedText = timeAgo(member.last_updated);
        
        card.innerHTML = `
            <div class="card-header-row">
                <div class="avatar-wrapper">
                    <div class="avatar-circle" style="background-color: ${member.avatar_color};">
                        ${initials}
                    </div>
                    <div class="status-badge"></div>
                </div>
                <label class="switch" title="Toggle availability">
                    <input type="checkbox" id="toggle-${member.id}" 
                           ${member.is_available ? 'checked' : ''} 
                           onchange="handleToggle(${member.id}, this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="member-info">
                <h4 class="member-name">${escapeHTML(member.name)}</h4>
                <div class="member-role">${escapeHTML(member.role)}</div>
                <span class="department-badge">${escapeHTML(member.department)}</span>
            </div>
            <div class="member-footer">
                <span class="status-text">${member.is_available ? 'Available' : 'Unavailable'}</span>
                <span class="update-time" title="Last updated time">
                    <i data-lucide="clock"></i>
                    <span>${lastUpdatedText}</span>
                </span>
            </div>
        `;
        
        teamGrid.appendChild(card);
    });

    lucide.createIcons();
}

// Render activity logs
function renderLogs() {
    activityLogContainer.innerHTML = '';
    
    if (activityLogs.length === 0) {
        activityLogContainer.innerHTML = '<div class="log-placeholder">No activities recorded yet.</div>';
        return;
    }

    activityLogs.forEach(log => {
        const item = document.createElement('div');
        
        let typeClass = '';
        if (log.action.includes('Available')) {
            typeClass = 'available';
        } else if (log.action.includes('Unavailable')) {
            typeClass = 'unavailable';
        }
        
        item.className = `activity-item ${typeClass}`;
        
        // Compute log time ago
        const timeStr = timeAgo(log.timestamp);
        
        item.innerHTML = `
            <div class="activity-meta">
                <span class="activity-name">${escapeHTML(log.member_name)}</span>
                <span class="activity-time">${timeStr}</span>
            </div>
            <div class="activity-desc">${escapeHTML(log.action)}</div>
        `;
        
        activityLogContainer.appendChild(item);
    });
}

// Real-time Availability Toggle with state synchronization and error fallback
async function handleToggle(memberId, isChecked) {
    const card = document.getElementById(`member-card-${memberId}`);
    const toggleInput = document.getElementById(`toggle-${memberId}`);
    
    // Find the original state in our JS array
    const memberIndex = teamMembers.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return;
    
    const originalMemberState = { ...teamMembers[memberIndex] };
    
    // OPTIMISTIC UPDATE: Update visual UI instantly before server response
    teamMembers[memberIndex].is_available = isChecked;
    teamMembers[memberIndex].last_updated = new Date().toISOString().replace('T', ' ').substring(0, 19); // Approx local YYYY-MM-DD HH:MM:SS
    
    // Update card styling
    if (isChecked) {
        card.classList.remove('unavailable');
        card.classList.add('available');
        card.querySelector('.status-text').textContent = 'Available';
    } else {
        card.classList.remove('available');
        card.classList.add('unavailable');
        card.querySelector('.status-text').textContent = 'Unavailable';
    }
    
    // Update dashboard stats in real-time
    calculateStats();
    
    try {
        // Send state update to database
        const response = await fetch(`/api/members/${memberId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Toggle request failed');
        
        const updatedMember = await response.json();
        
        // Sync response data with state
        teamMembers[memberIndex] = updatedMember;
        
        // Show success alert
        const message = `${updatedMember.name} is now ${updatedMember.is_available ? 'Available' : 'Unavailable'}`;
        showToast(message, 'success');
        
        // Update relative clock immediately on card
        const timeSpan = card.querySelector('.update-time span');
        if (timeSpan) {
            timeSpan.textContent = timeAgo(updatedMember.last_updated);
        }
        
        // Refresh activity log feed
        await fetchLogs();
        
    } catch (error) {
        // FALLBACK: Server failed, revert optimistic changes
        console.error('Error toggling availability:', error);
        
        teamMembers[memberIndex] = originalMemberState;
        
        // Revert UI Toggle Checked Status
        toggleInput.checked = originalMemberState.is_available;
        
        // Revert Card Styling
        if (originalMemberState.is_available) {
            card.classList.remove('unavailable');
            card.classList.add('available');
            card.querySelector('.status-text').textContent = 'Available';
        } else {
            card.classList.remove('available');
            card.classList.add('unavailable');
            card.querySelector('.status-text').textContent = 'Unavailable';
        }
        
        calculateStats();
        showToast('Connection lost. Failed to update status.', 'error');
    }
}

// Add member submission
async function handleAddMemberSubmit(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('member-name');
    const roleInput = document.getElementById('member-role');
    const deptInput = document.getElementById('member-dept');
    const colorInput = document.querySelector('input[name="avatar-color"]:checked');
    
    const newMemberData = {
        name: nameInput.value.trim(),
        role: roleInput.value.trim(),
        department: deptInput.value,
        avatar_color: colorInput ? colorInput.value : ''
    };
    
    try {
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMemberData)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to add member');
        }
        
        const addedMember = await response.json();
        
        // Update state and refresh UI
        teamMembers.push(addedMember);
        calculateStats();
        filterAndRender();
        
        // Close modal
        closeModal();
        
        // Toast Alert
        showToast(`${addedMember.name} has been added to the tracker!`, 'success');
        
        // Refresh activity logs
        await fetchLogs();
        
    } catch (error) {
        showToast(error.message || 'Error adding team member', 'error');
        console.error(error);
    }
}

// Premium Toast Alert Notification Builder
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-message">${escapeHTML(message)}</div>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Auto-remove toast after 4s
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000);
}

// XSS Prevention helper
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
