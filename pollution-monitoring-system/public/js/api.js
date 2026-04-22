// ============================================================
// public/js/api.js
// Shared API utility - handles all backend requests
// ============================================================

const API_BASE = 'http://localhost:3001/api';

// ── Get stored token ─────────────────────────────────────────
function getToken() {
    return localStorage.getItem('token');
}

// ── Get stored user object ───────────────────────────────────
function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user')) || null;
    } catch { return null; }
}

// ── Save login data ──────────────────────────────────────────
function saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// ── Clear login data (logout) ────────────────────────────────
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// ── Check if logged in ───────────────────────────────────────
function isLoggedIn() {
    return !!getToken();
}

// ── Redirect if not authenticated ───────────────────────────
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
    }
}

// ── Redirect if not admin ────────────────────────────────────
function requireAdmin() {
    const user = getUser();
    if (!user || user.role !== 'admin') {
        showToast('Admin access required.', 'danger');
        setTimeout(() => window.location.href = '/dashboard.html', 1500);
    }
}

// ── Core fetch wrapper with auth headers ─────────────────────
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        // If 401/403, redirect to login
        if (response.status === 401 || (response.status === 403 && data.message?.includes('token'))) {
            clearAuth();
            window.location.href = '/login.html';
            return null;
        }

        return { ok: response.ok, status: response.status, data };
    } catch (err) {
        console.error('API request failed:', err);
        return { ok: false, data: { success: false, message: 'Network error. Is the server running?' } };
    }
}

// ── Auth API calls ───────────────────────────────────────────
const authAPI = {
    login: (email, password) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    register: (name, email, password) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    })
};

// ── Pollution API calls ──────────────────────────────────────
const pollutionAPI = {
    getAll: () => apiRequest('/pollution'),
    search: (area) => apiRequest(`/pollution/search?area=${encodeURIComponent(area)}`),
    getRealTimeAQI: (city) => apiRequest(`/pollution/aqi/${encodeURIComponent(city)}`),
    getSummary: () => apiRequest('/pollution/summary'),
    create: (data) => apiRequest('/pollution', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/pollution/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/pollution/${id}`, { method: 'DELETE' }),
    getUsers: () => apiRequest('/pollution/users')
};

// ── Toast Notifications ──────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', danger: '🚨', warning: '⚠️', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span style="font-size:1.1rem">${icons[type] || 'ℹ️'}</span>
        <div style="flex:1;font-size:0.88rem">${message}</div>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:1rem;padding:0 4px">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── Get AQI color class ──────────────────────────────────────
function getAQIClass(level) {
    const map = {
        'Low': 'level-low', 'Good': 'level-low',
        'Moderate': 'level-moderate',
        'Medium': 'level-medium',
        'High': 'level-high', 'Unhealthy': 'level-high',
        'Very High': 'level-very-high', 'Very Unhealthy': 'level-very-high',
        'Hazardous': 'level-hazardous'
    };
    return map[level] || 'level-medium';
}

function getBadgeClass(level) {
    return 'badge badge-' + (level || 'medium').toLowerCase().replace(' ', '-');
}

// ── Format timestamp ─────────────────────────────────────────
function formatDate(ts) {
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}
