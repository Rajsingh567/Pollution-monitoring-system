// ============================================================
// public/js/login.js
// Handles login and registration form logic
// ============================================================

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    window.location.href = '/dashboard.html';
}

// ── TAB SWITCHING ────────────────────────────────────────────
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
    clearMessages();
}

function clearMessages() {
    document.querySelectorAll('.form-message').forEach(m => m.innerHTML = '');
}

// ── LOGIN ────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msgEl = document.getElementById('loginMessage');
    const btn = e.target.querySelector('button[type="submit"]');

    if (!email || !password) {
        msgEl.innerHTML = '<div class="alert-box alert-warning">⚠️ Please fill in all fields.</div>';
        return;
    }

    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing In...';
    msgEl.innerHTML = '';

    const res = await authAPI.login(email, password);

    btn.disabled = false;
    btn.innerHTML = '🔐 Sign In';

    if (!res || !res.ok) {
        msgEl.innerHTML = `<div class="alert-box alert-danger">❌ ${res?.data?.message || 'Login failed.'}</div>`;
        return;
    }

    // Save token and user info
    saveAuth(res.data.token, res.data.user);

    msgEl.innerHTML = `<div class="alert-box alert-success">✅ ${res.data.message}</div>`;

    // Redirect after short delay
    setTimeout(() => {
        const user = res.data.user;
        if (user.role === 'admin') {
            window.location.href = '/dashboard.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    }, 800);
});

// ── REGISTER ─────────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const msgEl = document.getElementById('registerMessage');
    const btn = e.target.querySelector('button[type="submit"]');

    // Validate
    if (!name || !email || !password) {
        msgEl.innerHTML = '<div class="alert-box alert-warning">⚠️ All fields are required.</div>';
        return;
    }
    if (password.length < 6) {
        msgEl.innerHTML = '<div class="alert-box alert-warning">⚠️ Password must be at least 6 characters.</div>';
        return;
    }
    if (password !== confirm) {
        msgEl.innerHTML = '<div class="alert-box alert-danger">❌ Passwords do not match.</div>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating Account...';
    msgEl.innerHTML = '';

    const res = await authAPI.register(name, email, password);

    btn.disabled = false;
    btn.innerHTML = '🚀 Create Account';

    if (!res || !res.ok) {
        msgEl.innerHTML = `<div class="alert-box alert-danger">❌ ${res?.data?.message || 'Registration failed.'}</div>`;
        return;
    }

    msgEl.innerHTML = `<div class="alert-box alert-success">✅ ${res.data.message}</div>`;

    // Auto-switch to login tab
    setTimeout(() => switchTab('login'), 1500);
});

// ── QUICK LOGIN (demo buttons) ───────────────────────────────
function quickLogin(email, password) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
    switchTab('login');
    // Slight delay for UX
    setTimeout(() => document.getElementById('loginForm').dispatchEvent(new Event('submit')), 200);
}
