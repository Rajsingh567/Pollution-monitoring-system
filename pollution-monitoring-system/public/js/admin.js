// ============================================================
// public/js/admin.js
// Admin panel - CRUD operations, user management
// ============================================================

requireAuth();
requireAdmin();

const user = getUser();
let allRecords = [];
let editingId = null;

// Setup nav
document.getElementById('navUserName').textContent = user.name;
document.getElementById('navUserRole').textContent = 'ADMIN';
document.getElementById('navUserRole').className = 'role-pill admin';

// ── LOGOUT ───────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = '/login.html';
});

// ── TAB NAVIGATION ───────────────────────────────────────────
function switchAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── LOAD ALL RECORDS ─────────────────────────────────────────
async function loadRecords() {
    const res = await pollutionAPI.getAll();
    if (!res || !res.ok) {
        showToast('Failed to load records.', 'danger');
        return;
    }
    allRecords = res.data.data || [];
    renderTable(allRecords);
    renderAnalytics(allRecords);
}

function renderTable(records) {
    const tbody = document.getElementById('adminTableBody');
    if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
            <div class="empty-icon">📋</div>No pollution records found. Add one below!
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => `
        <tr>
            <td><strong>${r.area_name}</strong></td>
            <td><span class="${getBadgeClass(r.pollution_level)}">${r.pollution_level}</span></td>
            <td><strong style="color:${r.aqi > 200 ? '#ff4757' : r.aqi > 100 ? '#ffa502' : '#2ed573'}">${r.aqi}</strong></td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.alert_message || ''}">
                ${r.alert_message || '<span style="color:var(--text-secondary)">—</span>'}
            </td>
            <td style="color:var(--text-secondary);font-size:0.8rem">${formatDate(r.last_updated)}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-outline btn-sm" onclick="openEditModal(${r.id})">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecord(${r.id}, '${r.area_name.replace("'","\\'")}')">🗑️ Del</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── ANALYTICS ────────────────────────────────────────────────
async function renderAnalytics(records) {
    const res = await pollutionAPI.getSummary();
    if (!res || !res.ok) return;

    const d = res.data.data;
    document.getElementById('statTotal').textContent = d.total_areas || 0;
    document.getElementById('statAvgAQI').textContent = Math.round(d.avg_aqi) || 0;
    document.getElementById('statMaxAQI').textContent = d.max_aqi || 0;
    document.getElementById('statHazardous').textContent = d.hazardous_count || 0;

    // Bar chart: AQI per area
    renderBarChart(records);

    // Doughnut: levels
    renderDoughnut(d);
}

let barChart = null, doughnut = null;

function renderBarChart(records) {
    const ctx = document.getElementById('areaBarChart');
    if (!ctx) return;
    if (barChart) barChart.destroy();

    const top10 = records.slice(0, 10);
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(r => r.area_name),
            datasets: [{
                label: 'AQI Value',
                data: top10.map(r => r.aqi),
                backgroundColor: top10.map(r => {
                    if (r.aqi <= 50) return 'rgba(46,213,115,0.7)';
                    if (r.aqi <= 100) return 'rgba(163,217,119,0.7)';
                    if (r.aqi <= 150) return 'rgba(255,165,2,0.7)';
                    if (r.aqi <= 200) return 'rgba(255,99,72,0.7)';
                    return 'rgba(192,57,43,0.7)';
                }),
                borderColor: 'transparent',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8a96a8', font: { family: 'Exo 2' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8a96a8', font: { family: 'Exo 2', size: 10 }, maxRotation: 30 }
                }
            }
        }
    });
}

function renderDoughnut(d) {
    const ctx = document.getElementById('levelDoughnut');
    if (!ctx) return;
    if (doughnut) doughnut.destroy();

    doughnut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low', 'Moderate', 'Medium', 'High', 'Very High', 'Hazardous'],
            datasets: [{
                data: [
                    d.low_count || 0,
                    d.moderate_count || 0,
                    d.medium_count || 0,
                    d.high_count || 0,
                    0,
                    d.hazardous_count || 0
                ],
                backgroundColor: ['#2ed573','#a3d977','#ffa502','#ff6348','#ff4757','#c0392b'],
                borderColor: '#161d2e',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#8a96a8', font: { family: 'Exo 2', size: 10 }, padding: 10, boxWidth: 12 }
                }
            },
            cutout: '65%'
        }
    });
}

// ── CREATE RECORD ─────────────────────────────────────────────
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        area_name: document.getElementById('addArea').value.trim(),
        aqi: parseInt(document.getElementById('addAQI').value),
        pollution_level: document.getElementById('addLevel').value,
        alert_message: document.getElementById('addAlert').value.trim()
    };

    if (!data.area_name || !data.aqi) {
        showToast('Area and AQI are required.', 'warning');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';

    const res = await pollutionAPI.create(data);
    btn.disabled = false;
    btn.innerHTML = '💾 Save Record';

    if (!res || !res.ok) {
        showToast(res?.data?.message || 'Failed to create record.', 'danger');
        return;
    }

    showToast('✅ Record created successfully!', 'success');
    e.target.reset();
    loadRecords();
    switchAdminTab('records');
});

// ── EDIT MODAL ────────────────────────────────────────────────
function openEditModal(id) {
    const record = allRecords.find(r => r.id === id);
    if (!record) return;

    editingId = id;
    document.getElementById('editArea').value = record.area_name;
    document.getElementById('editAQI').value = record.aqi;
    document.getElementById('editLevel').value = record.pollution_level;
    document.getElementById('editAlert').value = record.alert_message || '';
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingId = null;
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingId) return;

    const data = {
        area_name: document.getElementById('editArea').value.trim(),
        aqi: parseInt(document.getElementById('editAQI').value),
        pollution_level: document.getElementById('editLevel').value,
        alert_message: document.getElementById('editAlert').value.trim()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating...';

    const res = await pollutionAPI.update(editingId, data);
    btn.disabled = false;
    btn.innerHTML = '💾 Update';

    if (!res || !res.ok) {
        showToast(res?.data?.message || 'Update failed.', 'danger');
        return;
    }

    showToast('✅ Record updated!', 'success');
    closeEditModal();
    loadRecords();
});

// Close modal on backdrop click
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
});

// ── DELETE RECORD ─────────────────────────────────────────────
async function deleteRecord(id, name) {
    if (!confirm(`Delete pollution record for "${name}"? This cannot be undone.`)) return;

    const res = await pollutionAPI.delete(id);

    if (!res || !res.ok) {
        showToast(res?.data?.message || 'Delete failed.', 'danger');
        return;
    }

    showToast(`✅ "${name}" deleted.`, 'success');
    loadRecords();
}

// ── LOAD USERS ────────────────────────────────────────────────
async function loadUsers() {
    const res = await pollutionAPI.getUsers();
    if (!res || !res.ok) {
        showToast('Failed to load users.', 'danger');
        return;
    }

    const users = res.data.data || [];
    const tbody = document.getElementById('usersTableBody');

    document.getElementById('totalUsersCount').textContent = users.length;

    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">No users found.</div></td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-dim);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.9rem">
                        ${u.name.charAt(0).toUpperCase()}
                    </div>
                    <strong>${u.name}</strong>
                </div>
            </td>
            <td style="color:var(--text-secondary)">${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-high' : 'badge-low'}">${u.role}</span></td>
            <td style="color:var(--text-secondary);font-size:0.8rem">${formatDate(u.created_at)}</td>
        </tr>
    `).join('');
}

// ── SEARCH FILTER ─────────────────────────────────────────────
document.getElementById('tableSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allRecords.filter(r =>
        r.area_name.toLowerCase().includes(q) ||
        r.pollution_level.toLowerCase().includes(q)
    );
    renderTable(filtered);
});

// ── AUTO-FILL LEVEL FROM AQI ──────────────────────────────────
function autoFillLevel(aqiInputId, levelSelectId) {
    const aqi = parseInt(document.getElementById(aqiInputId).value);
    const levelEl = document.getElementById(levelSelectId);
    if (isNaN(aqi)) return;

    if (aqi <= 50) levelEl.value = 'Low';
    else if (aqi <= 100) levelEl.value = 'Moderate';
    else if (aqi <= 150) levelEl.value = 'Medium';
    else if (aqi <= 200) levelEl.value = 'High';
    else if (aqi <= 300) levelEl.value = 'Very High';
    else levelEl.value = 'Hazardous';
}

document.getElementById('addAQI').addEventListener('input', () => autoFillLevel('addAQI', 'addLevel'));
document.getElementById('editAQI').addEventListener('input', () => autoFillLevel('editAQI', 'editLevel'));

// ── STARTUP ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    switchAdminTab('records');
});
