// ============================================================
// public/js/dashboard.js
// Main dashboard logic - AQI search, map, charts, alerts
// ============================================================

requireAuth(); // redirect if not logged in

// ── INIT ─────────────────────────────────────────────────────
const user = getUser();
let map = null;
let mapMarker = null;
let mapMarkers = [];
let aqiChart = null;
let currentAQIData = null;
let allPollutionData = [];

// Setup nav
document.getElementById('navUserName').textContent = user.name;
document.getElementById('navUserRole').textContent = user.role.toUpperCase();
document.getElementById('navUserRole').className = `role-pill ${user.role}`;

// Show admin link if admin
if (user.role === 'admin') {
    document.getElementById('adminNavLink').style.display = 'inline-flex';
}

// ── LOGOUT ───────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuth();
    window.location.href = '/login.html';
});

// ── INITIALIZE MAP (Leaflet + OpenStreetMap) ─────────────────
function initMap(lat = 20.5937, lon = 78.9629, cityName = 'India') {
    if (!map) {
        map = L.map('map').setView([lat, lon], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }

    // Remove old marker
    if (mapMarker) map.removeLayer(mapMarker);

    // Custom marker
    const icon = L.divIcon({
        html: `<div style="
            background:var(--accent,#00d4aa);
            width:20px;height:20px;border-radius:50%;
            border:3px solid white;
            box-shadow:0 0 12px rgba(0,212,170,0.7)">
        </div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    mapMarker = L.marker([lat, lon], { icon })
        .addTo(map)
        .bindPopup(`<strong>${cityName}</strong><br>Click to see AQI`)
        .openPopup();
}

// ── FETCH REAL-TIME AQI ──────────────────────────────────────
async function searchCity() {
    const city = document.getElementById('citySearch').value.trim();
    if (!city) { showToast('Please enter a city name.', 'warning'); return; }

    const resultEl = document.getElementById('aqiResult');
    const btn = document.getElementById('searchBtn');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Searching...';
    resultEl.innerHTML = `<div style="text-align:center;padding:30px"><span class="spinner" style="width:40px;height:40px;border-width:3px"></span></div>`;

    const res = await pollutionAPI.getRealTimeAQI(city);

    btn.disabled = false;
    btn.innerHTML = '🔍 Search';

    if (!res || !res.ok) {
        resultEl.innerHTML = `<div class="alert-box alert-danger">❌ ${res?.data?.message || 'Failed to fetch AQI.'}</div>`;
        return;
    }

    currentAQIData = res.data.data;
    renderAQIResult(currentAQIData);

    // Update map
    if (currentAQIData.lat && currentAQIData.lon) {
        initMap(currentAQIData.lat, currentAQIData.lon, currentAQIData.city);
    }

    // Show high AQI warning toast
    if (currentAQIData.aqi > 150) {
        showToast(`🚨 HIGH POLLUTION ALERT! AQI ${currentAQIData.aqi} in ${currentAQIData.city}. Stay indoors!`, 'danger', 6000);
    }
}

// ── RENDER AQI RESULT ────────────────────────────────────────
function renderAQIResult(data) {
    const levelClass = getAQIClass(data.pollution_level);
    const badgeColors = {
        'Low': '#2ed573', 'Good': '#2ed573',
        'Moderate': '#a3d977',
        'Medium': '#ffa502',
        'High': '#ff6348',
        'Very High': '#ff4757',
        'Hazardous': '#c0392b'
    };
    const badgeColor = badgeColors[data.pollution_level] || '#ffa502';

    // Pollutant details
    let pollutantHtml = '';
    if (data.iaqi) {
        const pollutants = { pm25: 'PM2.5', pm10: 'PM10', o3: 'O₃', no2: 'NO₂', so2: 'SO₂', co: 'CO' };
        const entries = Object.entries(data.iaqi)
            .filter(([k]) => pollutants[k])
            .map(([k, v]) => `<div class="stat-card" style="padding:12px;text-align:center">
                <div style="font-size:1.2rem;font-weight:700;color:var(--accent)">${v.v}</div>
                <div style="font-size:0.72rem;color:var(--text-secondary)">${pollutants[k]}</div>
            </div>`).join('');
        if (entries) {
            pollutantHtml = `<div style="margin-top:16px">
                <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em">Pollutant Breakdown</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px">${entries}</div>
            </div>`;
        }
    }

    // Tips
    const tipsHtml = (data.tips || []).map(t => `<li>${t}</li>`).join('');

    document.getElementById('aqiResult').innerHTML = `
        <div class="aqi-hero">
            <div class="aqi-circle ${levelClass}">
                <div class="aqi-number">${data.aqi}</div>
                <div class="aqi-label">AQI</div>
            </div>
            <div class="aqi-city-name">📍 ${data.city}</div>
            <div class="aqi-level-badge" style="background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}44">
                ${data.pollution_level}
            </div>
            <div style="font-size:0.78rem;color:var(--text-secondary)">Updated: ${formatDate(data.time)}</div>
            ${pollutantHtml}
        </div>
        <div style="margin-top:16px">
            <div class="card-title" style="font-size:0.9rem">💡 Awareness Tips</div>
            <ul class="tips-list">${tipsHtml}</ul>
        </div>
    `;
}

// ── LOAD DATABASE RECORDS ────────────────────────────────────
async function loadDBRecords() {
    const res = await pollutionAPI.getAll();
    if (!res || !res.ok) return;
    allPollutionData = res.data.data || [];
    renderDBTable(allPollutionData);
    renderAlerts(allPollutionData);
}

function renderDBTable(records) {
    const tbody = document.getElementById('dbTableBody');
    if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🌍</div>No records found.</div></td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => `
        <tr>
            <td><strong>${r.area_name}</strong></td>
            <td><span class="${getBadgeClass(r.pollution_level)}">${r.pollution_level}</span></td>
            <td><strong style="color:var(--accent)">${r.aqi}</strong></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.alert_message || ''}">
                ${r.alert_message ? `⚠️ ${r.alert_message}` : '<span style="color:var(--text-secondary)">—</span>'}
            </td>
            <td style="color:var(--text-secondary);font-size:0.82rem">${formatDate(r.last_updated)}</td>
        </tr>
    `).join('');
}

function renderAlerts(records) {
    const alertsEl = document.getElementById('adminAlerts');
    const highRecords = records.filter(r => r.alert_message && r.alert_message.trim());

    if (!highRecords.length) {
        alertsEl.innerHTML = '<div style="color:var(--text-secondary);font-size:0.9rem;text-align:center;padding:20px">No active alerts</div>';
        return;
    }

    alertsEl.innerHTML = highRecords.map(r => {
        const aqi = r.aqi;
        const type = aqi > 200 ? 'alert-danger' : aqi > 150 ? 'alert-warning' : 'alert-info';
        return `<div class="alert-box ${type}">
            <span>📍</span>
            <div><strong>${r.area_name}</strong> (AQI: ${aqi})<br>
            <span style="font-size:0.85rem">${r.alert_message}</span></div>
        </div>`;
    }).join('');
}

// ── LOAD ANALYTICS ───────────────────────────────────────────
async function loadAnalytics() {
    const res = await pollutionAPI.getSummary();
    if (!res || !res.ok) return;

    const d = res.data.data;
    document.getElementById('statTotal').textContent = d.total_areas || 0;
    document.getElementById('statAvgAQI').textContent = Math.round(d.avg_aqi) || 0;
    document.getElementById('statMaxAQI').textContent = d.max_aqi || 0;
    document.getElementById('statHazardous').textContent = d.hazardous_count || 0;

    // Render donut chart
    renderChart(d);
}

function renderChart(d) {
    const ctx = document.getElementById('pollutionChart');
    if (!ctx) return;

    if (aqiChart) aqiChart.destroy();

    const labels = ['Low', 'Moderate/Medium', 'High', 'Hazardous'];
    const values = [
        parseInt(d.low_count) || 0,
        (parseInt(d.moderate_count) || 0) + (parseInt(d.medium_count) || 0),
        parseInt(d.high_count) || 0,
        parseInt(d.hazardous_count) || 0
    ];

    aqiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#2ed573', '#a3d977', '#ff6348', '#c0392b'],
                borderColor: '#161d2e',
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#8a96a8',
                        font: { family: 'Exo 2', size: 11 },
                        padding: 12,
                        boxWidth: 14
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// ── SEARCH on Enter key ──────────────────────────────────────
document.getElementById('citySearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchCity();
});

// ── TAB NAVIGATION ───────────────────────────────────────────
function switchDashTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── STARTUP ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadDBRecords();
    loadAnalytics();
    switchDashTab('search');
});
