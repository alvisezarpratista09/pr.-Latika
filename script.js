// Tailwind Config Initialization
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                }
            }
        }
    }
};

// State Management
let gradesData = [];
let trendChartInstance = null;
let gradeDistributionChartInstance = null;

// Initialize App
window.onload = function() {
    loadFromLocalStorage();
    initCharts();
    updateUI();
};

// Local Storage Handling
function saveToLocalStorage() {
    localStorage.setItem('edutrack_grades', JSON.stringify(gradesData));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('edutrack_grades');
    if (saved) {
        try {
            gradesData = JSON.parse(saved);
        } catch (e) {
            gradesData = [];
        }
    }
}

// Grade Helper Functions (A, B, C, D, E & 4.0 Scale Convert)
function getLetterAndGPA(score) {
    score = parseFloat(score);
    if (score >= 85) return { letter: 'A', gpa: 4.0, color: 'emerald' };
    if (score >= 75) return { letter: 'B', gpa: 3.0, color: 'blue' };
    if (score >= 65) return { letter: 'C', gpa: 2.0, color: 'amber' };
    if (score >= 50) return { letter: 'D', gpa: 1.0, color: 'orange' };
    return { letter: 'E', gpa: 0.0, color: 'rose' };
}

function getPredikatBadge(avg) {
    if (avg >= 85) return { title: 'Dengan Pujian (Cumlaude)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (avg >= 75) return { title: 'Sangat Memuaskan', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (avg >= 65) return { title: 'Memuaskan', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (avg >= 50) return { title: 'Cukup', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (avg > 0) return { title: 'Perlu Perbaikan', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    return { title: 'Belum Ada Data', color: 'bg-slate-100 text-slate-600 border-slate-200' };
}

// Form Submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    const semester = parseInt(document.getElementById('input-semester').value);
    const subject = document.getElementById('input-subject').value.trim();
    const score = parseFloat(document.getElementById('input-score').value);
    const credits = parseInt(document.getElementById('input-credits').value) || 3;

    if (!subject || isNaN(score) || score < 0 || score > 100) {
        showToast('Mohon isi nama mata pelajaran dan nilai (0-100) yang valid.', 'error');
        return;
    }

    const newItem = {
        id: Date.now().toString(),
        semester: semester,
        subject: subject,
        score: score,
        credits: credits
    };

    gradesData.push(newItem);
    saveToLocalStorage();
    updateUI();

    // Reset Input Subject and Score
    document.getElementById('input-subject').value = '';
    document.getElementById('input-score').value = '';
    document.getElementById('input-subject').focus();

    showToast(`Berhasil menambahkan ${subject} ke Semester ${semester}`);
}

// Delete Item
function deleteItem(id) {
    const item = gradesData.find(g => g.id === id);
    gradesData = gradesData.filter(g => g.id !== id);
    saveToLocalStorage();
    updateUI();
    if (item) {
        showToast(`Mata pelajaran ${item.subject} dihapus`, 'info');
    }
}

// Clear All Data
function confirmResetData() {
    if (gradesData.length === 0) {
        showToast('Tidak ada data untuk direset.', 'info');
        return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus seluruh data nilai? Tindakan ini tidak dapat dibatalkan.')) {
        gradesData = [];
        saveToLocalStorage();
        updateUI();
        showToast('Seluruh data berhasil dibersihkan', 'info');
    }
}

// Sample Data Preset
function loadSampleData() {
    gradesData = [
        // Semester 1
        { id: '101', semester: 1, subject: 'Algoritma & Pemrograman', score: 88, credits: 3 },
        { id: '102', semester: 1, subject: 'Matematika Diskrit', score: 78, credits: 3 },
        { id: '103', semester: 1, subject: 'Bahasa Inggris', score: 90, credits: 2 },
        { id: '104', semester: 1, subject: 'Pengantar Teknologi Informasi', score: 85, credits: 3 },
        
        // Semester 2
        { id: '201', semester: 2, subject: 'Struktur Data', score: 82, credits: 3 },
        { id: '202', semester: 2, subject: 'Basis Data I', score: 87, credits: 3 },
        { id: '203', semester: 2, subject: 'Kalkulus Akademik', score: 72, credits: 3 },
        { id: '204', semester: 2, subject: 'Desain Grafis & UI/UX', score: 94, credits: 3 },

        // Semester 3
        { id: '301', semester: 3, subject: 'Pemrograman Web Client-Side', score: 92, credits: 4 },
        { id: '302', semester: 3, subject: 'Jaringan Komputer', score: 80, credits: 3 },
        { id: '303', semester: 3, subject: 'Sistem Operasi', score: 84, credits: 3 },
        { id: '304', semester: 3, subject: 'Rekayasa Perangkat Lunak', score: 88, credits: 3 }
    ];
    saveToLocalStorage();
    updateUI();
    showToast('Sample data berhasil dimuat!');
}

// Update All UI Components
function updateUI() {
    renderStats();
    renderSemesters();
    updateCharts();
}

// Render Top Statistics Cards
function renderStats() {
    if (gradesData.length === 0) {
        document.getElementById('stat-overall-avg').innerText = '0.00';
        document.getElementById('stat-total-subjects').innerText = '0';
        document.getElementById('stat-total-semesters').innerText = '0';
        document.getElementById('stat-highest-grade').innerText = '-';
        document.getElementById('stat-highest-subject').innerText = 'Belum ada data';
        
        const badge = document.getElementById('stat-predikat-badge');
        badge.innerText = 'Belum Ada Data';
        badge.className = 'px-2 py-0.5 rounded-md font-semibold text-xs bg-slate-100 text-slate-600 border border-slate-200';
        return;
    }

    // Total Subjects
    document.getElementById('stat-total-subjects').innerText = gradesData.length;

    // Unique Semesters
    const activeSemesters = [...new Set(gradesData.map(g => g.semester))];
    document.getElementById('stat-total-semesters').innerText = activeSemesters.length;

    // Overall Average Score
    let totalWeighted = 0;
    let totalCredits = 0;
    let highest = gradesData[0];

    gradesData.forEach(g => {
        totalWeighted += (g.score * g.credits);
        totalCredits += g.credits;
        if (g.score > highest.score) {
            highest = g;
        }
    });

    const overallAvg = totalCredits > 0 ? (totalWeighted / totalCredits) : 0;
    document.getElementById('stat-overall-avg').innerText = overallAvg.toFixed(2);

    // Predikat Badge
    const predikat = getPredikatBadge(overallAvg);
    const badge = document.getElementById('stat-predikat-badge');
    badge.innerText = predikat.title;
    badge.className = `px-2 py-0.5 rounded-md font-semibold text-xs border ${predikat.color}`;

    // Highest Grade Card
    document.getElementById('stat-highest-grade').innerText = highest.score.toFixed(1);
    document.getElementById('stat-highest-subject').innerText = `${highest.subject} (Sem ${highest.semester})`;
}

// Render Semester Cards & Lists
function renderSemesters() {
    const container = document.getElementById('semesters-container');
    const emptyState = document.getElementById('empty-state');
    const filterValue = document.getElementById('filter-semester').value;

    if (gradesData.length === 0) {
        container.innerHTML = '';
        container.appendChild(emptyState);
        document.getElementById('badge-semester-count').innerText = '0 Semester';
        return;
    }

    // Group data by semester
    const grouped = {};
    gradesData.forEach(item => {
        if (!grouped[item.semester]) {
            grouped[item.semester] = [];
        }
        grouped[item.semester].push(item);
    });

    const sortedSemesters = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    
    // Filter processing
    const filteredSemesters = filterValue === 'all' 
        ? sortedSemesters 
        : sortedSemesters.filter(s => s === parseInt(filterValue));

    document.getElementById('badge-semester-count').innerText = `${sortedSemesters.length} Semester Terdata`;

    if (filteredSemesters.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
                Tidak ada mata pelajaran di Semester ${filterValue}.
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    filteredSemesters.forEach(sem => {
        const items = grouped[sem];
        
        // Calculate Semester Average
        let semWeightedScore = 0;
        let semTotalCredits = 0;
        items.forEach(i => {
            semWeightedScore += (i.score * i.credits);
            semTotalCredits += i.credits;
        });
        const semAvg = semTotalCredits > 0 ? (semWeightedScore / semTotalCredits) : 0;

        const semCard = document.createElement('div');
        semCard.className = 'bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition hover:border-slate-300';
        
        let rowsHtml = items.map(item => {
            const gradeInfo = getLetterAndGPA(item.score);
            return `
                <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition">
                    <td class="py-3.5 px-4">
                        <span class="font-semibold text-slate-800 block text-sm">${escapeHtml(item.subject)}</span>
                        <span class="text-xs text-slate-400">Bobot: ${item.credits} SKS</span>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <span class="font-bold text-slate-700 text-sm">${item.score.toFixed(1)}</span>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                        <span class="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg bg-${gradeInfo.color}-50 text-${gradeInfo.color}-600 border border-${gradeInfo.color}-200">
                            ${gradeInfo.letter}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                        <button onclick="deleteItem('${item.id}')" title="Hapus Mapel" class="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50">
                            <i class="fa-regular fa-trash-can text-sm"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        semCard.innerHTML = `
            <div class="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        S${sem}
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 text-base">Semester ${sem}</h3>
                        <p class="text-xs text-slate-500">${items.length} Mata Pelajaran &bull; ${semTotalCredits} SKS Total</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <span class="text-xs font-medium text-slate-500">Rata-rata:</span>
                    <span class="text-base font-extrabold text-brand-600">${semAvg.toFixed(2)}</span>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/30 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
                            <th class="py-2.5 px-4">Mata Pelajaran</th>
                            <th class="py-2.5 px-4 text-center">Nilai</th>
                            <th class="py-2.5 px-4 text-center">Grade</th>
                            <th class="py-2.5 px-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;

        container.appendChild(semCard);
    });
}

// Initialize Chart.js Instances
function initCharts() {
    // 1. Line Chart (Semester Average Trend)
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Rata-Rata Nilai',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleFont: { family: 'Plus Jakarta Sans', size: 13 },
                    bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return ` Rata-rata: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Plus Jakarta Sans', size: 11 }, color: '#64748b' }
                }
            }
        }
    });

    // 2. Bar Chart (Grade Distribution)
    const ctxGrade = document.getElementById('gradeDistributionChart').getContext('2d');
    gradeDistributionChartInstance = new Chart(ctxGrade, {
        type: 'bar',
        data: {
            labels: ['Grade A (≥85)', 'Grade B (75-84)', 'Grade C (65-74)', 'Grade D (50-64)', 'Grade E (<50)'],
            datasets: [{
                label: 'Jumlah Mapel',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#10b981', // emerald
                    '#3b82f6', // blue
                    '#f59e0b', // amber
                    '#f97316', // orange
                    '#ef4444'  // rose
                ],
                borderRadius: 8
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
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { family: 'Plus Jakarta Sans', size: 11 } },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
                }
            }
        }
    });
}

// Dynamic Chart Data Updates
function updateCharts() {
    if (!trendChartInstance || !gradeDistributionChartInstance) return;

    if (gradesData.length === 0) {
        trendChartInstance.data.labels = [];
        trendChartInstance.data.datasets[0].data = [];
        trendChartInstance.update();

        gradeDistributionChartInstance.data.datasets[0].data = [0, 0, 0, 0, 0];
        gradeDistributionChartInstance.update();
        return;
    }

    // Grouping for Line Chart
    const grouped = {};
    gradesData.forEach(item => {
        if (!grouped[item.semester]) grouped[item.semester] = [];
        grouped[item.semester].push(item);
    });

    const sortedSemesters = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    const trendLabels = sortedSemesters.map(s => `Semester ${s}`);
    const trendValues = sortedSemesters.map(s => {
        const items = grouped[s];
        let semWeightedScore = 0;
        let semTotalCredits = 0;
        items.forEach(i => {
            semWeightedScore += (i.score * i.credits);
            semTotalCredits += i.credits;
        });
        return semTotalCredits > 0 ? parseFloat((semWeightedScore / semTotalCredits).toFixed(2)) : 0;
    });

    trendChartInstance.data.labels = trendLabels;
    trendChartInstance.data.datasets[0].data = trendValues;
    trendChartInstance.update();

    // Distribution Breakdown for Bar Chart
    let counts = [0, 0, 0, 0, 0]; // A, B, C, D, E
    gradesData.forEach(g => {
        const info = getLetterAndGPA(g.score);
        if (info.letter === 'A') counts[0]++;
        else if (info.letter === 'B') counts[1]++;
        else if (info.letter === 'C') counts[2]++;
        else if (info.letter === 'D') counts[3]++;
        else counts[4]++;
    });

    gradeDistributionChartInstance.data.datasets[0].data = counts;
    gradeDistributionChartInstance.update();
}

// Helper: Utility Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    toastMsg.innerText = message;
    
    if (type === 'error') {
        toastIcon.className = 'text-rose-400';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
    } else if (type === 'info') {
        toastIcon.className = 'text-sky-400';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    } else {
        toastIcon.className = 'text-emerald-400';
        toastIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// Helper: Escape HTML string to prevent XSS
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
