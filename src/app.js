// Global variables
let leakagePieChart = null;
let costPieChart = null;
let performanceTrendChart = null;
let monteCarloChart = null;
let qualityTrendChart = null;
let costTrendChart = null;
let rafDistChart = null;
let episodeCostChart = null;
let currentLeakageView = 'all';
let showingOONOnly = false;

// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeCharts();
    initializeProjectionControls();
    initializeLeakageInteractions();
    initializeQualityDateSlider();
    setLastUpdatedDate();
});

// Set Last Updated date to yesterday (24hr old data)
function setLastUpdatedDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = yesterday.toLocaleDateString('en-US', options);

    // Set header last updated
    const lastUpdatedEl = document.getElementById('last-updated-date');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = formattedDate;
    }

    // Set data timeframe end dates for all tabs with this indicator
    const dataEndDateIds = [
        'quality-data-end-date',
        'tcoc-data-end-date',
        'leakage-data-end-date',
        'episodes-data-end-date',
        'hcc-data-end-date'
    ];

    dataEndDateIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = formattedDate;
        }
    });
}

function initializeTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            this.classList.add('active');
            const targetTab = document.getElementById(tabName + '-tab');
            if (targetTab) {
                targetTab.classList.add('active');

                // Re-render charts when tab becomes visible to fix sizing issues
                setTimeout(() => {
                    if (tabName === 'leakage' && leakagePieChart) {
                        leakagePieChart.resize();
                    }
                    if (tabName === 'tcoc' && costPieChart) {
                        costPieChart.resize();
                    }
                }, 100);
            }
        });
    });
}

// Chart Initialization
function initializeCharts() {
    initPerformanceTrendChart();
    initMonteCarloChart();
    initLeakagePieChart();
    initCostPieChart();
    initQualityTrendChart();
    initCostTrendChart();
    initRAFDistChart();
    initEpisodeCostChart();
}

function initPerformanceTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (performanceTrendChart) {
        performanceTrendChart.destroy();
    }

    // PY2025 data (full year - historical)
    const py2025Data = [862, 858, 851, 847, 845, 843, 840, 838, 842, 845, 847, 847];

    // PY2026 data - Jan/Feb are actual (solid), Mar-Dec are projected (dotted)
    const py2026ActualData = [855, 849, null, null, null, null, null, null, null, null, null, null]; // Jan-Feb actual
    const py2026ProjectedData = [null, 849, 843, 839, 837, 835, 832, 830, 834, 837, 839, 839]; // Mar-Dec projected (connects from Feb)

    // Benchmark for PY2026
    const benchmarkData = [868, 867, 866, 865, 864, 863, 862, 861, 861, 864, 864, 865];

    performanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'PY2026 Actual PMPM',
                    data: py2026ActualData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.15)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#27ae60',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3,
                    borderWidth: 3,
                    spanGaps: false
                },
                {
                    label: 'PY2026 Projected PMPM',
                    data: py2026ProjectedData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.08)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderDash: [6, 4],
                    borderWidth: 2,
                    spanGaps: true
                },
                {
                    label: 'PY2025 PMPM',
                    data: py2025Data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderDash: [5, 5],
                    borderWidth: 2
                },
                {
                    label: 'PY2026 Benchmark',
                    data: benchmarkData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.05)',
                    tension: 0.4,
                    fill: false,
                    borderDash: [3, 3],
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                datalabels: {
                    display: function(context) {
                        // Only show labels for key points
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        // Show for PY2026 Actual (Jan, Feb) and PY2026 Projected (Jun, Dec)
                        if (datasetIndex === 0 && (dataIndex === 0 || dataIndex === 1)) return true;
                        if (datasetIndex === 1 && (dataIndex === 5 || dataIndex === 11)) return true;
                        return false;
                    },
                    color: function(context) {
                        if (context.datasetIndex <= 1) return '#27ae60';
                        if (context.datasetIndex === 2) return '#667eea';
                        return '#e74c3c';
                    },
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: function(value) {
                        if (value === null) return '';
                        return '$' + value;
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(44, 62, 80, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#27ae60',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12,
                        lineHeight: 1.6
                    },
                    filter: function(tooltipItem) {
                        return tooltipItem.raw !== null;
                    },
                    callbacks: {
                        title: function(context) {
                            const month = context[0].label;
                            return month + ' Performance Comparison';
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (context.parsed.y === null) return null;
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.y.toFixed(2);
                            // Add indicator for actual vs projected
                            if (context.datasetIndex === 0) {
                                label += ' (Actual)';
                            } else if (context.datasetIndex === 1) {
                                label += ' (Projected)';
                            }
                            return label;
                        },
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            // Get PY2026 value (actual or projected)
                            let py2026Value = py2026ActualData[dataIndex];
                            if (py2026Value === null) {
                                py2026Value = py2026ProjectedData[dataIndex];
                            }
                            const benchmarkValue = benchmarkData[dataIndex];
                            const py2025Value = py2025Data[dataIndex];

                            let result = [];
                            if (py2026Value !== null && benchmarkValue) {
                                const vsBenchmark = ((py2026Value - benchmarkValue) / benchmarkValue * 100).toFixed(1);
                                const sign = vsBenchmark > 0 ? '+' : '';
                                result.push(`\nPY2026 vs Benchmark: ${sign}${vsBenchmark}%`);
                            }
                            if (py2026Value !== null && py2025Value) {
                                const vsLastYear = ((py2026Value - py2025Value) / py2025Value * 100).toFixed(1);
                                const sign = vsLastYear > 0 ? '+' : '';
                                result.push(`PY2026 vs PY2025: ${sign}${vsLastYear}%`);
                            }
                            return result;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 820,
                    max: 880,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    title: {
                        display: true,
                        text: 'PMPM ($)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month (Current: June 2026)'
                    }
                }
            },
            onClick: function(event, elements) {
                // Check if clicked on PY2026 Projected PMPM line (dataset index 1)
                if (elements && elements.length > 0) {
                    const clickedDatasetIndex = elements[0].datasetIndex;
                    if (clickedDatasetIndex === 1) {
                        // Navigate to Projections tab
                        const projectionsNavItem = document.querySelector('.nav-item[data-tab="projections"]');
                        if (projectionsNavItem) {
                            projectionsNavItem.click();
                        }
                    }
                }
            },
            onHover: function(event, elements) {
                const canvas = event.native.target;
                // Check if hovering over PY2026 Projected PMPM line (dataset index 1)
                const isOverProjectedLine = elements.some(el => el.datasetIndex === 1);
                canvas.style.cursor = isOverProjectedLine ? 'pointer' : 'default';
            }
        }
    });
}

function initMonteCarloChart() {
    const ctx = document.getElementById('monteChart');
    if (!ctx) return;

    if (monteCarloChart) {
        monteCarloChart.destroy();
    }

    // Generate histogram data
    const bins = 30;
    const data = [];
    for (let i = 0; i < bins; i++) {
        const x = 5 + (i * 0.5);
        const mean = 11.6;
        const stdDev = 2.5;
        const y = Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) * 40;
        data.push(y);
    }

    const labels = [];
    for (let i = 0; i < bins; i++) {
        const value = 5 + (i * 0.5);
        labels.push('$' + value.toFixed(1) + 'M');
    }

    monteCarloChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: false // Histogram - too many bars for labels
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Probability: ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Projected Shared Savings'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Probability (%)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function initLeakagePieChart() {
    const ctx = document.getElementById('leakagePie');
    if (!ctx) return;

    if (leakagePieChart) {
        leakagePieChart.destroy();
    }

    leakagePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['In-Network', 'Out-of-Network'],
            datasets: [{
                data: [76.3, 23.7],
                backgroundColor: [
                    'rgba(39, 174, 96, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    '#27ae60',
                    '#e74c3c'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: function(value) {
                        return value + '%';
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    toggleNetworkView(index);
                }
            }
        }
    });
}

function initCostPieChart() {
    const ctx = document.getElementById('costPieChart');
    if (!ctx) return;

    if (costPieChart) {
        costPieChart.destroy();
    }

    const labels = ['Inpatient Facility', 'Outpatient Services', 'Professional Services', 'Pharmacy', 'Post-Acute Care'];
    const shortLabels = ['Inpatient', 'Outpatient', 'Professional', 'Pharmacy', 'Post-Acute'];
    const data = [38.5, 29.5, 18.4, 10.0, 3.6];

    costPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.9)',
                    'rgba(52, 152, 219, 0.9)',
                    'rgba(46, 204, 113, 0.9)',
                    'rgba(241, 196, 15, 0.9)',
                    'rgba(231, 76, 60, 0.9)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            layout: {
                padding: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                datalabels: {
                    color: '#2c3e50',
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'end',
                    offset: 6,
                    formatter: function(value, context) {
                        return shortLabels[context.dataIndex] + '\n' + value + '%';
                    },
                    textAlign: 'center',
                    clamp: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

function initQualityTrendChart() {
    const ctx = document.getElementById('qualityTrendChart');
    if (!ctx) return;

    if (qualityTrendChart) {
        qualityTrendChart.destroy();
    }

    qualityTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['PY2021', 'PY2022', 'PY2023', 'PY2024', 'PY2025 (Proj)'],
            datasets: [{
                label: 'Overall Quality Score',
                data: [79.2, 81.5, 84.8, 87.4, 89.1],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: 'National Average',
                data: [78.1, 79.3, 80.8, 82.1, 83.5],
                borderColor: '#95a5a6',
                backgroundColor: 'rgba(149, 165, 166, 0.1)',
                tension: 0.4,
                fill: true,
                borderDash: [5, 5],
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                datalabels: {
                    display: true,
                    color: function(context) {
                        return context.datasetIndex === 0 ? '#667eea' : '#95a5a6';
                    },
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: function(value) {
                        return value.toFixed(1) + '%';
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 75,
                    max: 95,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function initCostTrendChart() {
    const ctx = document.getElementById('costTrendChart');
    if (!ctx) return;

    if (costTrendChart) {
        costTrendChart.destroy();
    }

    costTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Inpatient',
                data: [16.2, 15.8, 15.4, 15.1, 14.9, 15.2, 15.6, 15.3, 15.7, 16.1, 15.9, 16.0],
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                stack: 'stack1'
            }, {
                label: 'Outpatient',
                data: [12.1, 11.9, 12.3, 11.8, 11.6, 11.9, 12.2, 12.0, 12.4, 12.3, 12.1, 12.2],
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                stack: 'stack1'
            }, {
                label: 'Professional',
                data: [7.5, 7.4, 7.6, 7.3, 7.2, 7.4, 7.5, 7.4, 7.6, 7.5, 7.4, 7.5],
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                stack: 'stack1'
            }, {
                label: 'Pharmacy',
                data: [4.1, 4.0, 4.2, 4.1, 4.0, 4.1, 4.2, 4.1, 4.2, 4.1, 4.0, 4.1],
                backgroundColor: 'rgba(241, 196, 15, 0.8)',
                stack: 'stack1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                datalabels: {
                    display: false // Stacked bar - labels would overlap
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    }
                }
            }
        }
    });
}

function initRAFDistChart() {
    const ctx = document.getElementById('rafDistChart');
    if (!ctx) return;

    if (rafDistChart) {
        rafDistChart.destroy();
    }

    // Generate RAF score distribution
    const bins = 20;
    const data = [];
    for (let i = 0; i < bins; i++) {
        const x = 0.5 + (i * 0.15);
        const mean = 1.247;
        const stdDev = 0.35;
        const y = Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2)) * 2500;
        data.push(Math.round(y));
    }

    const labels = [];
    for (let i = 0; i < bins; i++) {
        const value = 0.5 + (i * 0.15);
        labels.push(value.toFixed(2));
    }

    rafDistChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Patient Count',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: false // Histogram - too many bars for labels
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'RAF Score'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Patients'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Piedmont Hospital Joint Replacement Data
const piedmontHospitalData = {
    // Hospital avgCost = exact weighted average of provider costs
    // Hospital episodes = sum of provider cases
    // All providers have ≥10 cases for consistent drill-down analysis
    hospitals: [
        {
            name: 'Piedmont Atlanta',
            shortName: 'Atlanta',
            avgCost: 26073,  // (32×24800 + 28×26100 + 18×28400 + 11×25900) / 89
            episodes: 89,    // 32 + 28 + 18 + 11
            nationalBenchmark: 27500,
            providers: [
                { name: 'Dr. Mitchell', cases: 32, avgCost: 24800, qualityScore: 94.2, complications: 2.1, readmit30: 3.8, los: 2.1, patientSat: 4.7 },
                { name: 'Dr. Chen', cases: 28, avgCost: 26100, qualityScore: 91.8, complications: 3.2, readmit30: 4.2, los: 2.3, patientSat: 4.5 },
                { name: 'Dr. Williams', cases: 18, avgCost: 28400, qualityScore: 88.5, complications: 4.8, readmit30: 5.1, los: 2.8, patientSat: 4.2 },
                { name: 'Dr. Garcia', cases: 11, avgCost: 25900, qualityScore: 93.1, complications: 2.5, readmit30: 3.5, los: 2.0, patientSat: 4.8 }
            ]
        },
        {
            name: 'Piedmont Newnan',
            shortName: 'Newnan',
            avgCost: 28963,  // (24×27200 + 22×29800 + 21×30100) / 67
            episodes: 67,    // 24 + 22 + 21
            nationalBenchmark: 27500,
            providers: [
                { name: 'Dr. Anderson', cases: 24, avgCost: 27200, qualityScore: 90.5, complications: 3.8, readmit30: 4.8, los: 2.4, patientSat: 4.4 },
                { name: 'Dr. Park', cases: 22, avgCost: 29800, qualityScore: 87.2, complications: 5.1, readmit30: 6.2, los: 3.1, patientSat: 4.1 },
                { name: 'Dr. Kim', cases: 21, avgCost: 30100, qualityScore: 85.8, complications: 5.8, readmit30: 6.8, los: 3.3, patientSat: 3.9 }
            ]
        },
        {
            name: 'Piedmont Fayette',
            shortName: 'Fayette',
            avgCost: 31198,  // (19×29500 + 18×32800 + 17×31400) / 54
            episodes: 54,    // 19 + 18 + 17
            nationalBenchmark: 27500,
            providers: [
                { name: 'Dr. Brown', cases: 19, avgCost: 29500, qualityScore: 89.1, complications: 4.2, readmit30: 5.5, los: 2.6, patientSat: 4.3 },
                { name: 'Dr. Lee', cases: 18, avgCost: 32800, qualityScore: 84.5, complications: 6.5, readmit30: 7.2, los: 3.5, patientSat: 3.8 },
                { name: 'Dr. Davis', cases: 17, avgCost: 31400, qualityScore: 86.2, complications: 5.5, readmit30: 6.0, los: 3.0, patientSat: 4.0 }
            ]
        },
        {
            name: 'Piedmont Henry',
            shortName: 'Henry',
            avgCost: 25654,  // (22×24500 + 15×26800 + 11×26400) / 48
            episodes: 48,    // 22 + 15 + 11
            nationalBenchmark: 27500,
            providers: [
                { name: 'Dr. Taylor', cases: 22, avgCost: 24500, qualityScore: 95.2, complications: 1.8, readmit30: 3.2, los: 1.9, patientSat: 4.9 },
                { name: 'Dr. Moore', cases: 15, avgCost: 26800, qualityScore: 92.4, complications: 2.8, readmit30: 4.0, los: 2.2, patientSat: 4.6 },
                { name: 'Dr. White', cases: 11, avgCost: 26400, qualityScore: 91.8, complications: 3.0, readmit30: 4.5, los: 2.3, patientSat: 4.5 }
            ]
        },
        {
            name: 'Piedmont Mountainside',
            shortName: 'Mountainside',
            avgCost: 29376,  // (18×28200 + 14×30800 + 10×29500) / 42
            episodes: 42,    // 18 + 14 + 10
            nationalBenchmark: 27500,
            providers: [
                { name: 'Dr. Johnson', cases: 18, avgCost: 28200, qualityScore: 89.8, complications: 4.0, readmit30: 5.2, los: 2.5, patientSat: 4.2 },
                { name: 'Dr. Martinez', cases: 14, avgCost: 30800, qualityScore: 86.5, complications: 5.2, readmit30: 6.5, los: 3.2, patientSat: 4.0 },
                { name: 'Dr. Clark', cases: 10, avgCost: 29500, qualityScore: 88.2, complications: 4.5, readmit30: 5.8, los: 2.8, patientSat: 4.1 }
            ]
        },
        {
            name: 'Piedmont Columbus',
            shortName: 'Columbus',
            avgCost: 33477,  // (16×32200 + 13×34800 + 10×33800) / 39
            episodes: 39,    // 16 + 13 + 10
            nationalBenchmark: 27500,
            providers: [
                { name: 'Dr. Robinson', cases: 16, avgCost: 32200, qualityScore: 83.5, complications: 7.2, readmit30: 8.5, los: 3.8, patientSat: 3.6 },
                { name: 'Dr. Harris', cases: 13, avgCost: 34800, qualityScore: 81.2, complications: 8.5, readmit30: 9.2, los: 4.2, patientSat: 3.4 },
                { name: 'Dr. Thompson', cases: 10, avgCost: 33800, qualityScore: 82.8, complications: 7.8, readmit30: 8.8, los: 4.0, patientSat: 3.5 }
            ]
        }
    ],
    nationalBenchmarks: {
        avgCost: 27500,
        qualityScore: 88.0,
        complications: 4.5,
        readmit30: 5.5,
        los: 2.5,
        patientSat: 4.2
    }
};

function initEpisodeCostChart() {
    const ctx = document.getElementById('episodeCostChart');
    if (!ctx) return;

    if (episodeCostChart) {
        episodeCostChart.destroy();
    }

    const hospitals = piedmontHospitalData.hospitals;
    const labels = hospitals.map(h => h.shortName);
    const avgCosts = hospitals.map(h => h.avgCost);
    const benchmark = piedmontHospitalData.nationalBenchmarks.avgCost;

    episodeCostChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Avg Episode Cost',
                    data: avgCosts,
                    backgroundColor: avgCosts.map(cost => {
                        if (cost > benchmark * 1.15) return 'rgba(231, 76, 60, 0.7)';
                        if (cost < benchmark * 0.98) return 'rgba(39, 174, 96, 0.7)';
                        return 'rgba(241, 196, 15, 0.7)';
                    }),
                    borderColor: avgCosts.map(cost => {
                        if (cost > benchmark * 1.15) return '#c0392b';
                        if (cost < benchmark * 0.98) return '#1e8449';
                        return '#d4ac0d';
                    }),
                    borderWidth: 2
                },
                {
                    label: 'National Benchmark',
                    data: Array(hospitals.length).fill(benchmark),
                    type: 'line',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0 && elements[0].datasetIndex === 0) {
                    const index = elements[0].index;
                    drillDownHospitalProviders(index);
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                datalabels: {
                    display: function(context) {
                        return context.datasetIndex === 0; // Only show for bars, not the benchmark line
                    },
                    color: '#2c3e50',
                    font: { weight: 'bold', size: 11 },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: function(value) {
                        return '$' + (value / 1000).toFixed(1) + 'K';
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const idx = context[0].dataIndex;
                            return piedmontHospitalData.hospitals[idx].name;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                const idx = context.dataIndex;
                                const hospital = piedmontHospitalData.hospitals[idx];
                                const variance = ((hospital.avgCost - benchmark) / benchmark * 100).toFixed(1);
                                return [
                                    `Avg Cost: $${hospital.avgCost.toLocaleString()}`,
                                    `Episodes: ${hospital.episodes}`,
                                    `vs Benchmark: ${variance > 0 ? '+' : ''}${variance}%`,
                                    '',
                                    '🔍 Click to view provider details'
                                ];
                            }
                            return `National Benchmark: $${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 22000,
                    max: 38000,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000) + 'K';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Cost per Episode'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Piedmont Hospital (Click bar to drill into providers)'
                    }
                }
            }
        }
    });
}

// Drill down into hospital-level provider variation
function drillDownHospitalProviders(hospitalIndex) {
    const hospital = piedmontHospitalData.hospitals[hospitalIndex];
    const benchmark = piedmontHospitalData.nationalBenchmarks;
    const providers = hospital.providers.filter(p => p.cases >= 10);

    // Calculate averages
    const totalCases = providers.reduce((sum, p) => sum + p.cases, 0);
    const weightedAvgCost = providers.reduce((sum, p) => sum + (p.avgCost * p.cases), 0) / totalCases;
    const avgQuality = providers.reduce((sum, p) => sum + p.qualityScore, 0) / providers.length;

    // Calculate opportunity (reduction to hospital average for each provider above average)
    const hospitalAvg = weightedAvgCost;
    const totalOpportunity = providers.reduce((sum, p) => {
        if (p.avgCost > hospitalAvg) {
            return sum + ((p.avgCost - hospitalAvg) * p.cases);
        }
        return sum;
    }, 0);

    // National opportunity
    const nationalOpportunity = providers.reduce((sum, p) => {
        if (p.avgCost > benchmark.avgCost) {
            return sum + ((p.avgCost - benchmark.avgCost) * p.cases);
        }
        return sum;
    }, 0);

    // Find best provider (lowest cost with good quality)
    const bestProvider = providers.reduce((best, p) => {
        const score = (100 - ((p.avgCost / benchmark.avgCost) * 50)) + (p.qualityScore / 2);
        const bestScore = (100 - ((best.avgCost / benchmark.avgCost) * 50)) + (best.qualityScore / 2);
        return score > bestScore ? p : best;
    });

    // Calculate provider-level details for breakdown
    const providerBreakdown = providers.map(p => {
        const vsHospitalAvg = p.avgCost - hospitalAvg;
        const vsBenchmark = p.avgCost - benchmark.avgCost;
        const internalOpp = vsHospitalAvg > 0 ? vsHospitalAvg * p.cases : 0;
        const benchmarkOpp = vsBenchmark > 0 ? vsBenchmark * p.cases : 0;
        return {
            name: p.name,
            cases: p.cases,
            avgCost: p.avgCost,
            vsHospitalAvg: vsHospitalAvg,
            vsBenchmark: vsBenchmark,
            internalOpp: internalOpp,
            benchmarkOpp: benchmarkOpp
        };
    });

    // Count providers above each threshold
    const providersAboveHospitalAvg = providerBreakdown.filter(p => p.vsHospitalAvg > 0).length;
    const providersAboveBenchmark = providerBreakdown.filter(p => p.vsBenchmark > 0).length;

    let modalBody = `
        <h2>${hospital.name} - Joint Replacement Provider Analysis</h2>
        <p class="provider-summary">Cost variation analysis for joint replacement episodes • Providers with ≥10 cases</p>

        <!-- Reference Values Card -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #3498db;">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">National Benchmark:</span>
                        <span style="font-weight: 700; color: #3498db; margin-left: 0.5rem; font-size: 1.1rem;">$${benchmark.avgCost.toLocaleString()}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Hospital Wtd Avg:</span>
                        <span style="font-weight: 700; color: #C84E28; margin-left: 0.5rem; font-size: 1.1rem;">$${Math.round(weightedAvgCost).toLocaleString()}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Total Cases:</span>
                        <span style="font-weight: 700; color: #2c3e50; margin-left: 0.5rem; font-size: 1.1rem;">${totalCases}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Cards - CFO Friendly with Calculation Details -->
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">

            <!-- Hospital Weighted Average Card -->
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">
                    Hospital Weighted Average
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: ${weightedAvgCost > benchmark.avgCost ? '#e74c3c' : '#27ae60'}; margin: 0.5rem 0;">
                    $${Math.round(weightedAvgCost).toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <div style="margin-bottom: 0.25rem;">
                        <span style="color: #495057;">vs National Benchmark:</span>
                        <span style="font-weight: 600; color: ${weightedAvgCost > benchmark.avgCost ? '#e74c3c' : '#27ae60'}; margin-left: 0.5rem;">
                            ${weightedAvgCost > benchmark.avgCost ? '+' : ''}$${Math.round(weightedAvgCost - benchmark.avgCost).toLocaleString()}
                        </span>
                    </div>
                    <div style="font-size: 0.7rem; color: #888; margin-top: 0.5rem;">
                        Formula: Σ(Cost × Cases) ÷ ${totalCases} cases
                    </div>
                </div>
            </div>

            <!-- Internal Opportunity Card -->
            <div class="kpi-card" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #28a745;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #155724; text-transform: uppercase; letter-spacing: 0.5px;">
                    Internal Opportunity
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #155724; margin: 0.5rem 0;">
                    $${Math.round(totalOpportunity).toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #155724; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(40,167,69,0.3);">
                    <div style="margin-bottom: 0.25rem;">
                        <span>Target:</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">Hospital Avg ($${Math.round(hospitalAvg).toLocaleString()})</span>
                    </div>
                    <div>
                        <span>Providers Above Avg:</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">${providersAboveHospitalAvg} of ${providers.length}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: #1e7e34; margin-top: 0.5rem;">
                        Formula: Σ(Cost - $${Math.round(hospitalAvg).toLocaleString()}) × Cases
                    </div>
                </div>
            </div>

            <!-- vs National Benchmark Card -->
            <div class="kpi-card" style="background: linear-gradient(135deg, #cce5ff 0%, #b8daff 100%); border: 1px solid #3498db;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #004085; text-transform: uppercase; letter-spacing: 0.5px;">
                    vs National Benchmark
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #004085; margin: 0.5rem 0;">
                    $${Math.round(nationalOpportunity).toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #004085; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(52,152,219,0.3);">
                    <div style="margin-bottom: 0.25rem;">
                        <span>Target:</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">$${benchmark.avgCost.toLocaleString()} (National)</span>
                    </div>
                    <div>
                        <span>Providers Above Benchmark:</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">${providersAboveBenchmark} of ${providers.length}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: #0056b3; margin-top: 0.5rem;">
                        Formula: Σ(Cost - $${benchmark.avgCost.toLocaleString()}) × Cases
                    </div>
                </div>
            </div>
        </div>

        <!-- Calculation Breakdown Table -->
        <div style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">📊</span> Savings Calculation Breakdown
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Provider</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Cases</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avg Cost</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">vs Hosp Avg<br><span style="font-weight: 400; font-size: 0.7rem;">($${Math.round(hospitalAvg).toLocaleString()})</span></th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Internal<br>Opportunity</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">vs Benchmark<br><span style="font-weight: 400; font-size: 0.7rem;">($${benchmark.avgCost.toLocaleString()})</span></th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #cce5ff;">Benchmark<br>Opportunity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${providerBreakdown.map(p => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.name}</strong></td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.cases}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; font-weight: 600;">$${p.avgCost.toLocaleString()}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; color: ${p.vsHospitalAvg > 0 ? '#e74c3c' : '#27ae60'}; font-weight: 500;">
                                    ${p.vsHospitalAvg > 0 ? '+' : ''}$${Math.round(p.vsHospitalAvg).toLocaleString()}
                                    <div style="font-size: 0.7rem; color: #888;">× ${p.cases} cases</div>
                                </td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">
                                    ${p.internalOpp > 0 ? '$' + Math.round(p.internalOpp).toLocaleString() : '—'}
                                </td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; color: ${p.vsBenchmark > 0 ? '#e74c3c' : '#27ae60'}; font-weight: 500;">
                                    ${p.vsBenchmark > 0 ? '+' : ''}$${Math.round(p.vsBenchmark).toLocaleString()}
                                    <div style="font-size: 0.7rem; color: #888;">× ${p.cases} cases</div>
                                </td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0f7ff; font-weight: 600; color: #004085;">
                                    ${p.benchmarkOpp > 0 ? '$' + Math.round(p.benchmarkOpp).toLocaleString() : '—'}
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8f9fa; font-weight: 700;">
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;">TOTAL</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${totalCases}</td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6;">$${Math.round(weightedAvgCost).toLocaleString()}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #d4edda; color: #155724; font-size: 1.1rem;">$${Math.round(totalOpportunity).toLocaleString()}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #cce5ff; color: #004085; font-size: 1.1rem;">$${Math.round(nationalOpportunity).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div class="chart-section" style="margin: 0;">
                <h3 style="margin-bottom: 1rem;">Cost Variation by Provider</h3>
                <div style="height: 280px;">
                    <canvas id="providerCostChart"></canvas>
                </div>
            </div>
            <div class="chart-section" style="margin: 0;">
                <h3 style="margin-bottom: 1rem;">Cost Reduction Opportunity</h3>
                <div style="height: 280px;">
                    <canvas id="opportunityChart"></canvas>
                </div>
            </div>
        </div>

        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Provider Performance Detail - Cost & Quality</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Rendering Provider</th>
                    <th class="tooltip-trigger" data-tooltip="Number of joint replacement cases performed in the measurement period (≥10 required for inclusion)">
                        Cases
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Average total episode cost including facility, professional, and post-acute care. Formula: Total Episode Costs ÷ Number of Cases">
                        Avg Cost
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Percentage variance from national benchmark ($${benchmark.avgCost.toLocaleString()}). Formula: ((Avg Cost - Benchmark) ÷ Benchmark) × 100">
                        vs Benchmark
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Savings if this provider reduced costs to the hospital average ($${Math.round(hospitalAvg).toLocaleString()}). Formula: MAX(0, (Avg Cost - Hospital Avg) × Cases)">
                        Opportunity
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Composite quality score (0-100) based on complications, readmissions, patient satisfaction, and clinical outcomes. National benchmark: ${benchmark.qualityScore}">
                        Quality Score
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Rate of surgical complications within 90 days including infection, DVT, revision. National benchmark: ${benchmark.complications}%">
                        Complications
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Percentage of patients readmitted within 30 days of discharge. National benchmark: ${benchmark.readmit30}%">
                        30-Day Readmit
                        <span class="info-icon">ⓘ</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;

    providers.forEach(provider => {
        const variance = ((provider.avgCost - benchmark.avgCost) / benchmark.avgCost * 100).toFixed(1);
        const opportunity = Math.max(0, (provider.avgCost - hospitalAvg) * provider.cases);
        const varianceClass = variance > 10 ? 'bad' : variance < -5 ? 'good' : 'warning';
        const qualityClass = provider.qualityScore >= 92 ? 'good' : provider.qualityScore >= 88 ? 'warning' : 'bad';
        const compClass = provider.complications <= benchmark.complications ? 'good' : 'bad';
        const readmitClass = provider.readmit30 <= benchmark.readmit30 ? 'good' : 'bad';

        modalBody += `
            <tr>
                <td><strong>${provider.name}</strong></td>
                <td>${provider.cases}</td>
                <td>$${provider.avgCost.toLocaleString()}</td>
                <td class="${varianceClass}">${variance > 0 ? '+' : ''}${variance}%</td>
                <td style="color: #27ae60;">${opportunity > 0 ? '$' + Math.round(opportunity).toLocaleString() : '-'}</td>
                <td class="${qualityClass}">${provider.qualityScore.toFixed(1)}</td>
                <td class="${compClass}">${provider.complications}%</td>
                <td class="${readmitClass}">${provider.readmit30}%</td>
            </tr>
        `;
    });

    modalBody += `
            </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="alert-box" style="background: #1e8449; border-left-color: #145a32; color: #fff;">
                <h4 style="color: #fff;">🏆 Best Practice Provider</h4>
                <p><strong>${bestProvider.name}</strong> demonstrates optimal cost-quality balance:</p>
                <ul>
                    <li><strong>Cost:</strong> $${bestProvider.avgCost.toLocaleString()} (${((bestProvider.avgCost - benchmark.avgCost) / benchmark.avgCost * 100).toFixed(1)}% vs benchmark)</li>
                    <li><strong>Quality Score:</strong> ${bestProvider.qualityScore.toFixed(1)} (benchmark: ${benchmark.qualityScore})</li>
                    <li><strong>Complications:</strong> ${bestProvider.complications}% (benchmark: ${benchmark.complications}%)</li>
                    <li><strong>30-Day Readmit:</strong> ${bestProvider.readmit30}% (benchmark: ${benchmark.readmit30}%)</li>
                </ul>
                <p style="margin-top: 0.5rem;"><em>Recommend sharing clinical protocols with higher-cost providers</em></p>
            </div>
            <div class="alert-box warning">
                <h4>📊 National Benchmark Comparison</h4>
                <p>CMS Joint Replacement Bundle benchmarks (2024):</p>
                <ul>
                    <li><strong>Target Cost:</strong> $${benchmark.avgCost.toLocaleString()} per episode</li>
                    <li><strong>Quality Score:</strong> ${benchmark.qualityScore} minimum</li>
                    <li><strong>Complication Rate:</strong> ≤${benchmark.complications}%</li>
                    <li><strong>30-Day Readmission:</strong> ≤${benchmark.readmit30}%</li>
                    <li><strong>Avg Length of Stay:</strong> ${benchmark.los} days</li>
                </ul>
            </div>
        </div>

        <style>
            .tooltip-trigger {
                position: relative;
                cursor: help;
            }
            .info-icon {
                color: #3498db;
                font-size: 0.8em;
                margin-left: 4px;
            }
            .tooltip-trigger:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #2c3e50;
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: normal;
                white-space: normal;
                width: 280px;
                text-align: left;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                line-height: 1.4;
            }
            .tooltip-trigger:hover::before {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(8px);
                border: 8px solid transparent;
                border-top-color: #2c3e50;
                z-index: 1001;
            }
        </style>
    `;

    showModal(modalBody);

    // Initialize the provider cost chart after modal is shown
    setTimeout(() => {
        initProviderCostChart(providers, hospitalAvg, benchmark.avgCost);
        initOpportunityChart(providers, hospitalAvg);
    }, 100);
}

// Provider cost comparison chart
function initProviderCostChart(providers, hospitalAvg, nationalBenchmark) {
    const ctx = document.getElementById('providerCostChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: providers.map(p => p.name),
            datasets: [
                {
                    label: 'Avg Cost',
                    data: providers.map(p => p.avgCost),
                    backgroundColor: providers.map(p => {
                        if (p.avgCost > nationalBenchmark * 1.15) return 'rgba(231, 76, 60, 0.7)';
                        if (p.avgCost < nationalBenchmark * 0.95) return 'rgba(39, 174, 96, 0.7)';
                        return 'rgba(241, 196, 15, 0.7)';
                    }),
                    borderColor: providers.map(p => {
                        if (p.avgCost > nationalBenchmark * 1.15) return '#c0392b';
                        if (p.avgCost < nationalBenchmark * 0.95) return '#1e8449';
                        return '#d4ac0d';
                    }),
                    borderWidth: 2
                },
                {
                    label: 'Hospital Avg',
                    data: Array(providers.length).fill(hospitalAvg),
                    type: 'line',
                    borderColor: '#9b59b6',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'National Benchmark',
                    data: Array(providers.length).fill(nationalBenchmark),
                    type: 'line',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                datalabels: {
                    display: function(context) {
                        return context.datasetIndex === 0; // Only bars
                    },
                    color: '#2c3e50',
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: function(value) {
                        return '$' + (value / 1000).toFixed(1) + 'K';
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return providers[context[0].dataIndex].name;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                const p = providers[context.dataIndex];
                                return [
                                    `Cost: $${p.avgCost.toLocaleString()}`,
                                    `Cases: ${p.cases}`,
                                    `Quality: ${p.qualityScore}`
                                ];
                            }
                            return `${context.dataset.label}: $${Math.round(context.raw).toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 22000,
                    max: 38000,
                    ticks: {
                        callback: v => '$' + (v/1000) + 'K',
                        font: { size: 10 }
                    }
                },
                x: {
                    ticks: { font: { size: 9 } }
                }
            }
        }
    });
}

// Opportunity waterfall chart
function initOpportunityChart(providers, hospitalAvg) {
    const ctx = document.getElementById('opportunityChart');
    if (!ctx) return;

    const opportunities = providers.map(p => ({
        name: p.name,
        opportunity: Math.max(0, (p.avgCost - hospitalAvg) * p.cases)
    })).filter(o => o.opportunity > 0).sort((a, b) => b.opportunity - a.opportunity);

    if (opportunities.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">All providers at or below hospital average - no reduction opportunity</p>';
        return;
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: opportunities.map(o => o.name),
            datasets: [{
                label: 'Savings if Reduced to Hospital Avg',
                data: opportunities.map(o => o.opportunity),
                backgroundColor: 'rgba(39, 174, 96, 0.7)',
                borderColor: '#1e8449',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'start',
                    offset: 8,
                    formatter: function(value) {
                        return '$' + (value / 1000).toFixed(0) + 'K';
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Potential Savings: $${Math.round(context.raw).toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: v => '$' + (v/1000).toFixed(0) + 'K',
                        font: { size: 10 }
                    },
                    title: {
                        display: true,
                        text: 'Savings Opportunity',
                        font: { size: 10 }
                    }
                },
                y: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

// Projection Controls with Debouncing
let projectionUpdateTimeout = null;

function initializeProjectionControls() {
    const sliders = [
        { slider: 'lives-slider', value: 'lives-val', format: v => (v >= 0 ? '+' : '') + v + '%' },
        { slider: 'risk-slider', value: 'risk-val', format: v => (v >= 0 ? '+' : '') + v + '%' },
        { slider: 'util-slider', value: 'util-val', format: v => (v >= 0 ? '+' : '') + v + '%' },
        { slider: 'leak-slider', value: 'leak-val', format: v => v + '%' }
    ];

    sliders.forEach(({slider, value, format}) => {
        const sliderEl = document.getElementById(slider);
        const valueEl = document.getElementById(value);

        if (sliderEl && valueEl) {
            sliderEl.addEventListener('input', function() {
                valueEl.textContent = format(parseFloat(this.value));

                // Debounce the projection update
                clearTimeout(projectionUpdateTimeout);
                projectionUpdateTimeout = setTimeout(() => {
                    updateProjectionValues();
                }, 150); // Update after 150ms of no slider movement
            });
        }
    });
}

function updateProjectionValues() {
    const livesGrowth = parseFloat(document.getElementById('lives-slider').value) / 100;
    const riskChange = parseFloat(document.getElementById('risk-slider').value) / 100;
    const utilChange = parseFloat(document.getElementById('util-slider').value) / 100;
    const leakReduce = parseFloat(document.getElementById('leak-slider').value) / 100;

    // Base values
    const baseSpend = 486.7;
    const baseBenchmark = 498.3;

    // Calculate impact
    // More lives = more total spend (but benchmark also grows proportionally)
    const livesImpact = baseSpend * livesGrowth;
    const livesBenchmarkImpact = baseBenchmark * livesGrowth;

    // Higher risk score = higher benchmark (good for ACO), but also higher expected spend
    const riskBenchmarkImpact = baseBenchmark * riskChange * 0.8; // RAF directly affects benchmark
    const riskSpendImpact = baseSpend * riskChange * 0.5; // Some increase in actual spend too

    // Utilization increase = more spend
    const utilImpact = baseSpend * utilChange;

    // Leakage REDUCTION = less OON spend = LOWER total spend (positive for savings)
    // Current OON spend is $115.3M, reducing by X% recovers ~70% of that amount
    const leakImpact = -115.3 * leakReduce * 0.7; // Negative impact = reduces spend

    const newSpend = baseSpend + livesImpact + utilImpact + leakImpact + riskSpendImpact;
    const newBenchmark = baseBenchmark + livesBenchmarkImpact + riskBenchmarkImpact;
    const newSavings = newBenchmark - newSpend;

    // Update displayed values
    document.getElementById('proj-spend').textContent = '$' + newSpend.toFixed(1) + 'M';

    // Update savings with color based on positive/negative
    const savingsEl = document.getElementById('proj-savings');
    const savingsMetricEl = savingsEl.closest('.metric');
    savingsEl.textContent = '$' + newSavings.toFixed(1) + 'M';

    // Update color: green for positive, red for negative
    if (newSavings >= 0) {
        savingsEl.style.color = '#27ae60';
        savingsMetricEl.classList.remove('danger');
        savingsMetricEl.classList.add('success');
    } else {
        savingsEl.style.color = '#e74c3c';
        savingsMetricEl.classList.remove('success');
        savingsMetricEl.classList.add('danger');
    }

    // Update probabilities based on savings and risk factors
    let probBreakeven, probTarget, probLoss;

    // Higher risk with more lives increases uncertainty
    const uncertaintyFactor = Math.abs(livesGrowth) * 10 + Math.abs(utilChange) * 15;

    if (newSavings >= 15) {
        probBreakeven = Math.min(98, 95 - uncertaintyFactor);
        probTarget = Math.min(90, 88 - uncertaintyFactor);
        probLoss = Math.max(2, 5 + uncertaintyFactor);
    } else if (newSavings >= 10.5) {
        probBreakeven = Math.min(90, 85 - uncertaintyFactor);
        probTarget = Math.min(75, 70 - uncertaintyFactor);
        probLoss = Math.max(10, 15 + uncertaintyFactor);
    } else if (newSavings >= 5) {
        probBreakeven = Math.min(75, 70 - uncertaintyFactor);
        probTarget = Math.min(50, 45 - uncertaintyFactor);
        probLoss = Math.max(25, 30 + uncertaintyFactor);
    } else if (newSavings >= 0) {
        probBreakeven = Math.min(60, 55 - uncertaintyFactor);
        probTarget = Math.min(25, 20 - uncertaintyFactor);
        probLoss = Math.max(40, 45 + uncertaintyFactor);
    } else {
        probBreakeven = Math.max(5, 30 - uncertaintyFactor);
        probTarget = Math.max(1, 5 - uncertaintyFactor);
        probLoss = Math.min(95, 70 + uncertaintyFactor);
    }

    // Ensure probabilities are reasonable integers
    probBreakeven = Math.round(Math.max(0, Math.min(100, probBreakeven)));
    probTarget = Math.round(Math.max(0, Math.min(100, probTarget)));
    probLoss = Math.round(Math.max(0, Math.min(100, probLoss)));

    // Update confidence bars with animation
    updateBar('bar-break', probBreakeven);
    updateBar('bar-target', probTarget);
    updateBar('bar-loss', probLoss);

    // Update probability text
    const savingsProb = newSavings >= 10.5 ? probTarget : Math.max(5, Math.floor(probTarget * 0.7));
    document.getElementById('prob-text').textContent = savingsProb + '% probability';
}

function updateBar(elementId, percentage) {
    const bar = document.getElementById(elementId);
    if (bar) {
        bar.style.width = percentage + '%';
        bar.textContent = percentage + '%';
    }
}

// Quality Metrics Date Sliders
function initializeQualityDateSlider() {
    // Initialize Historical Slider (service date-based)
    initializeHistoricalSlider();
    // Initialize Forecast Slider (scheduled date-based)
    initializeForecastSlider();
}

function initializeHistoricalSlider() {
    const slider = document.getElementById('quality-historical-slider');
    const display = document.getElementById('quality-historical-display');

    if (!slider || !display) return;

    // Define the date range: Jan 1 of current year to yesterday (always current date - 1 day)
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = new Date(currentYear, 0, 1); // Jan 1 of current year
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0); // Reset to midnight
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Set max value to total days
    slider.max = totalDays;
    slider.value = totalDays;

    // Base metrics at full period for historical data
    const baseMetrics = {
        totalVisits: 38247,       // Total face-to-face visits
        newPatients: 3213,        // New patient unique count
        faceToFaceVisits: 34520   // Face-to-face visits for MGMA calculation
    };

    slider.addEventListener('input', function() {
        const days = parseInt(this.value);
        const selectedDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

        // Format the date display
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const startFormatted = startDate.toLocaleDateString('en-US', options);
        const endFormatted = selectedDate.toLocaleDateString('en-US', options);
        display.textContent = startFormatted + ' - ' + endFormatted;

        // Calculate metrics based on proportion of time selected
        const proportion = days / totalDays;

        // Add some non-linear variation for realism (but keep it stable for same value)
        const seedVariance = (days % 7) * 0.02 + 0.95; // Deterministic variance based on days

        const visits = Math.round(baseMetrics.totalVisits * proportion * seedVariance);
        const faceToFace = Math.round(baseMetrics.faceToFaceVisits * proportion * seedVariance);
        const newPts = Math.round(baseMetrics.newPatients * proportion * seedVariance);

        // MGMA definition: New Patient % = New Pt Unique Count / Total Face-to-Face Visits
        const newPtPct = faceToFace > 0 ? (newPts / faceToFace * 100).toFixed(1) : '0.0';

        // Calculate trend vs "prior period" (simulated but consistent)
        const priorPeriodVisits = Math.round(visits * 0.89);
        const visitsTrend = ((visits - priorPeriodVisits) / priorPeriodVisits * 100).toFixed(1);

        // Update display
        document.getElementById('quality-total-visits').textContent = visits.toLocaleString();
        document.getElementById('quality-new-pt-pct').textContent = newPtPct + '%';

        // Update trend display
        const totalVisitsCard = document.getElementById('quality-total-visits').parentElement;
        const trendEl = totalVisitsCard.querySelector('.pop-card-trend');
        if (trendEl) {
            trendEl.textContent = (visitsTrend >= 0 ? '↑ ' : '↓ ') + Math.abs(visitsTrend) + '% vs prior period';
            trendEl.className = 'pop-card-trend ' + (visitsTrend >= 0 ? 'positive' : 'negative');
        }

        const newPtCard = document.getElementById('quality-new-pt-pct').parentElement;
        const detailEl = newPtCard.querySelector('.pop-card-detail');
        if (detailEl) {
            detailEl.textContent = newPts.toLocaleString() + ' new patients';
        }
    });

    // Trigger initial display update
    slider.dispatchEvent(new Event('input'));
}

function initializeForecastSlider() {
    const slider = document.getElementById('quality-forecast-slider');
    const display = document.getElementById('quality-forecast-display');

    if (!slider || !display) return;

    // Define the forecast range: Today to end of PY (Dec 31, 2026)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight
    const endOfPY = new Date(2026, 11, 31); // Dec 31, 2026
    const totalDays = Math.floor((endOfPY - today) / (1000 * 60 * 60 * 24));

    // Set max value to total days
    slider.max = totalDays;
    slider.value = totalDays;

    // Base metrics at full forecast period
    const baseMetrics = {
        upcomingVisits: 12847,    // Pts with scheduled visits through end of PY
        gapClosure: 18247,        // Total gaps for those patients
        avgPtsPerDay: 50          // Average patients scheduled per day
    };

    // Initial display
    updateForecastDisplay(slider, display, today, endOfPY, totalDays, baseMetrics);

    slider.addEventListener('input', function() {
        updateForecastDisplay(slider, display, today, endOfPY, totalDays, baseMetrics);
    });
}

function updateForecastDisplay(slider, display, today, _endOfPY, totalDays, baseMetrics) {
    const days = parseInt(slider.value);
    const selectedDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // Format the date display
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const todayFormatted = 'Today';
    const endFormatted = selectedDate.toLocaleDateString('en-US', options);
    display.textContent = todayFormatted + ' - ' + endFormatted;

    // Calculate metrics based on proportion of forecast window
    const proportion = days / totalDays;

    // Deterministic variance based on days for consistency
    const seedVariance = (days % 5) * 0.015 + 0.97;

    const upcoming = Math.round(baseMetrics.upcomingVisits * proportion * seedVariance);
    const gaps = Math.round(baseMetrics.gapClosure * proportion * seedVariance);
    const gapsPerPatient = upcoming > 0 ? (gaps / upcoming).toFixed(1) : '0.0';
    const avgPerDay = Math.round(upcoming / Math.max(days, 1));

    // Update display
    document.getElementById('quality-upcoming-visits').textContent = upcoming.toLocaleString();
    document.getElementById('quality-gap-closure').textContent = gaps.toLocaleString();

    // Update sub text
    const upcomingSub = document.getElementById('quality-upcoming-sub');
    if (upcomingSub) {
        upcomingSub.textContent = avgPerDay + ' pts/day avg';
    }

    const gapSub = document.getElementById('quality-gap-sub');
    if (gapSub) {
        gapSub.textContent = gapsPerPatient + ' gaps/pt';
    }
}

// Leakage Interactions
function initializeLeakageInteractions() {
    // Initialize geographic map
    initializeGeographicMap();
}

function toggleNetworkView(segmentIndex) {
    if (segmentIndex === undefined) {
        // Toggle between all and OON only
        showingOONOnly = !showingOONOnly;
    } else {
        // Clicked on a segment
        showingOONOnly = (segmentIndex === 1); // Index 1 is OON
    }

    if (showingOONOnly) {
        // Show only OON data
        updateLeakageMetrics('oon');
        highlightOONInTables();
    } else {
        // Show all data
        updateLeakageMetrics('all');
        removeTableHighlights();
    }
}

function updateLeakageMetrics(view) {
    if (view === 'oon') {
        document.getElementById('in-network-spend').style.opacity = '0.3';
        document.getElementById('in-network-pct').style.opacity = '0.3';
        document.getElementById('oon-spend').style.opacity = '1';
        document.getElementById('oon-pct').style.opacity = '1';
    } else {
        document.getElementById('in-network-spend').style.opacity = '1';
        document.getElementById('in-network-pct').style.opacity = '1';
        document.getElementById('oon-spend').style.opacity = '1';
        document.getElementById('oon-pct').style.opacity = '1';
    }
}

function highlightOONInTables() {
    // Add visual highlighting to emphasize OON providers
    const tables = document.querySelectorAll('#leakage-tab .data-table tbody tr');
    tables.forEach(row => {
        row.style.transition = 'all 0.3s';
        const oonCells = row.querySelectorAll('.bad');
        if (oonCells.length > 0) {
            row.style.backgroundColor = '#fff3cd';
        }
    });
}

function removeTableHighlights() {
    const tables = document.querySelectorAll('#leakage-tab .data-table tbody tr');
    tables.forEach(row => {
        row.style.backgroundColor = '';
    });
}

function setLeakageView(view) {
    currentLeakageView = view;

    // Update button states
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if ((view === 'all' && btn.textContent.includes('All')) ||
            (view === 'parta' && btn.textContent.includes('Part A')) ||
            (view === 'partb' && btn.textContent.includes('Part B'))) {
            btn.classList.add('active');
        }
    });

    // Update metrics based on view
    updateLeakageDataByPart(view);
}

function updateLeakageDataByPart(view) {
    // Simulate Part A/B filtering
    const metrics = {
        all: { inNetwork: 371.4, oon: 115.3, inPct: 76.3, oonPct: 23.7 },
        parta: { inNetwork: 245.8, oon: 67.2, inPct: 78.5, oonPct: 21.5 },
        partb: { inNetwork: 125.6, oon: 48.1, inPct: 72.3, oonPct: 27.7 }
    };

    const data = metrics[view];

    document.getElementById('in-network-spend').textContent = '$' + data.inNetwork + 'M';
    document.getElementById('in-network-pct').textContent = data.inPct + '%';
    document.getElementById('oon-spend').textContent = '$' + data.oon + 'M';
    document.getElementById('oon-pct').textContent = data.oonPct + '%';

    // Update pie chart
    if (leakagePieChart) {
        leakagePieChart.data.datasets[0].data = [data.inPct, data.oonPct];
        leakagePieChart.update();
    }
}

// Georgia County Leakage Data (FIPS codes for matching with TopoJSON)
const georgiaCountyLeakageData = {
    // FIPS codes for Georgia counties (13XXX format)
    '13121': { name: 'Fulton', leakageScore: 0.92, totalLeakage: 12800000, hasMarker: true,
        facilities: [
            { name: 'Emory University Hospital', spend: 4200000, services: [
                { name: 'Cardiac Surgery', cpt: '33533', isElective: true, spend: 1800000, provider: 'Dr. Smith' },
                { name: 'Interventional Cardiology', cpt: '92928', isElective: true, spend: 1400000, provider: 'Dr. Johnson' },
                { name: 'Emergency Cardiac Care', cpt: '99291', isElective: false, spend: 1000000, provider: 'ER Group' }
            ]},
            { name: 'Northside Hospital', spend: 3800000, services: [
                { name: 'Joint Replacement', cpt: '27447', isElective: true, spend: 2100000, provider: 'Dr. Williams' },
                { name: 'Spine Surgery', cpt: '22612', isElective: true, spend: 1700000, provider: 'Dr. Brown' }
            ]},
            { name: 'Grady Memorial', spend: 2400000, services: [
                { name: 'Trauma Services', cpt: '99291', isElective: false, spend: 1800000, provider: 'Trauma Team' },
                { name: 'Emergency Surgery', cpt: '44950', isElective: false, spend: 600000, provider: 'Dr. Davis' }
            ]},
            { name: 'Atlanta Medical Center', spend: 2400000, services: [
                { name: 'Oncology Treatment', cpt: '96413', isElective: false, spend: 1500000, provider: 'Dr. Miller' },
                { name: 'Radiation Therapy', cpt: '77385', isElective: false, spend: 900000, provider: 'Dr. Wilson' }
            ]}
        ]},
    '13089': { name: 'DeKalb', leakageScore: 0.85, totalLeakage: 8900000, hasMarker: true,
        facilities: [
            { name: 'Emory Decatur Hospital', spend: 3200000, services: [
                { name: 'Cardiology Consult', cpt: '99243', isElective: true, spend: 1600000, provider: 'Dr. Taylor' },
                { name: 'Vascular Surgery', cpt: '35301', isElective: true, spend: 1600000, provider: 'Dr. Anderson' }
            ]},
            { name: 'DeKalb Medical', spend: 2800000, services: [
                { name: 'Orthopedic Surgery', cpt: '27130', isElective: true, spend: 1800000, provider: 'Dr. Thomas' },
                { name: 'Physical Therapy', cpt: '97110', isElective: true, spend: 1000000, provider: 'PT Group' }
            ]}
        ]},
    '13067': { name: 'Cobb', leakageScore: 0.78, totalLeakage: 7200000, hasMarker: true,
        facilities: [
            { name: 'WellStar Kennestone', spend: 4100000, services: [
                { name: 'Cardiac Cath', cpt: '93458', isElective: true, spend: 2200000, provider: 'Dr. White' },
                { name: 'Open Heart Surgery', cpt: '33533', isElective: false, spend: 1900000, provider: 'Dr. Harris' }
            ]},
            { name: 'Northside Marietta', spend: 3100000, services: [
                { name: 'Oncology Services', cpt: '96413', isElective: false, spend: 1800000, provider: 'Dr. Martin' }
            ]}
        ]},
    '13135': { name: 'Gwinnett', leakageScore: 0.72, totalLeakage: 6500000, hasMarker: true,
        facilities: [
            { name: 'Northside Gwinnett', spend: 3800000, services: [
                { name: 'Bariatric Surgery', cpt: '43644', isElective: true, spend: 2000000, provider: 'Dr. Garcia' },
                { name: 'General Surgery', cpt: '47562', isElective: true, spend: 1800000, provider: 'Dr. Martinez' }
            ]}
        ]},
    '13245': { name: 'Richmond', leakageScore: 0.68, totalLeakage: 5400000, hasMarker: true,
        facilities: [
            { name: 'Augusta University Medical', spend: 3200000, services: [
                { name: 'Neurosurgery', cpt: '61510', isElective: true, spend: 1800000, provider: 'Dr. Lewis' },
                { name: 'Cardiac Surgery', cpt: '33533', isElective: true, spend: 1400000, provider: 'Dr. Lee' }
            ]}
        ]},
    '13215': { name: 'Muscogee', leakageScore: 0.55, totalLeakage: 4200000, hasMarker: true,
        facilities: [
            { name: 'Columbus Regional', spend: 2400000, services: [
                { name: 'Cardiac Services', cpt: '93458', isElective: true, spend: 1400000, provider: 'Dr. Young' },
                { name: 'Emergency Services', cpt: '99291', isElective: false, spend: 1000000, provider: 'ER Team' }
            ]}
        ]},
    '13021': { name: 'Bibb', leakageScore: 0.52, totalLeakage: 3800000, hasMarker: true,
        facilities: [
            { name: 'Atrium Health Navicent', spend: 2200000, services: [
                { name: 'Trauma Services', cpt: '99291', isElective: false, spend: 1400000, provider: 'Trauma Team' },
                { name: 'Cardiac Care', cpt: '93458', isElective: true, spend: 800000, provider: 'Dr. Wright' }
            ]}
        ]},
    '13051': { name: 'Chatham', leakageScore: 0.61, totalLeakage: 4800000, hasMarker: true,
        facilities: [
            { name: 'Memorial Health Savannah', spend: 2800000, services: [
                { name: 'Cardiac Surgery', cpt: '33533', isElective: true, spend: 1600000, provider: 'Dr. Scott' },
                { name: 'Neurology', cpt: '95816', isElective: true, spend: 1200000, provider: 'Dr. Green' }
            ]}
        ]},
    '13063': { name: 'Clayton', leakageScore: 0.48, totalLeakage: 2900000, hasMarker: false,
        facilities: [{ name: 'Southern Regional', spend: 1700000, services: [{ name: 'Emergency Care', cpt: '99291', isElective: false, spend: 1000000, provider: 'ER Group' }]}]},
    '13151': { name: 'Henry', leakageScore: 0.42, totalLeakage: 2400000, hasMarker: false,
        facilities: [{ name: 'Piedmont Henry', spend: 1400000, services: [{ name: 'Cardiac Services', cpt: '93458', isElective: true, spend: 800000, provider: 'Dr. Carter' }]}]},
    '13113': { name: 'Fayette', leakageScore: 0.38, totalLeakage: 2100000, hasMarker: false,
        facilities: [{ name: 'Piedmont Fayette', spend: 1300000, services: [{ name: 'Joint Replacement', cpt: '27447', isElective: true, spend: 800000, provider: 'Dr. Perez' }]}]},
    '13057': { name: 'Cherokee', leakageScore: 0.32, totalLeakage: 1800000, hasMarker: false,
        facilities: [{ name: 'Northside Cherokee', spend: 1100000, services: [{ name: 'Orthopedics', cpt: '27447', isElective: true, spend: 700000, provider: 'Dr. Turner' }]}]},
    '13117': { name: 'Forsyth', leakageScore: 0.28, totalLeakage: 1500000, hasMarker: false,
        facilities: [{ name: 'Northside Forsyth', spend: 900000, services: [{ name: 'Surgery', cpt: '47562', isElective: true, spend: 500000, provider: 'Dr. Campbell' }]}]},
    '13077': { name: 'Coweta', leakageScore: 0.25, totalLeakage: 1200000, hasMarker: false,
        facilities: [{ name: 'Piedmont Newnan', spend: 800000, services: [{ name: 'Surgery', cpt: '44950', isElective: true, spend: 500000, provider: 'Dr. Evans' }]}]},
    '13097': { name: 'Douglas', leakageScore: 0.22, totalLeakage: 950000, hasMarker: false,
        facilities: [{ name: 'WellStar Douglas', spend: 950000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 950000, provider: 'Various' }]}]},
    '13223': { name: 'Paulding', leakageScore: 0.18, totalLeakage: 720000, hasMarker: false,
        facilities: [{ name: 'WellStar Paulding', spend: 720000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 720000, provider: 'Various' }]}]},
    '13217': { name: 'Newton', leakageScore: 0.20, totalLeakage: 850000, hasMarker: false,
        facilities: [{ name: 'Piedmont Newton', spend: 850000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 850000, provider: 'Various' }]}]},
    '13247': { name: 'Rockdale', leakageScore: 0.19, totalLeakage: 780000, hasMarker: false,
        facilities: [{ name: 'Piedmont Rockdale', spend: 780000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 780000, provider: 'Various' }]}]},
    '13139': { name: 'Hall', leakageScore: 0.35, totalLeakage: 1900000, hasMarker: false,
        facilities: [{ name: 'Northeast Georgia Medical', spend: 1900000, services: [{ name: 'Various Services', cpt: '99213', isElective: true, spend: 1900000, provider: 'Various' }]}]},
    '13073': { name: 'Columbia', leakageScore: 0.45, totalLeakage: 2600000, hasMarker: false,
        facilities: [{ name: 'Doctors Hospital Augusta', spend: 2600000, services: [{ name: 'Various Services', cpt: '99213', isElective: true, spend: 2600000, provider: 'Various' }]}]},
    '13153': { name: 'Houston', leakageScore: 0.30, totalLeakage: 1650000, hasMarker: false,
        facilities: [{ name: 'Houston Medical Center', spend: 1650000, services: [{ name: 'Various Services', cpt: '99213', isElective: true, spend: 1650000, provider: 'Various' }]}]},
    '13095': { name: 'Dougherty', leakageScore: 0.40, totalLeakage: 2200000, hasMarker: false,
        facilities: [{ name: 'Phoebe Putney Memorial', spend: 2200000, services: [{ name: 'Various Services', cpt: '99213', isElective: true, spend: 2200000, provider: 'Various' }]}]},
    '13185': { name: 'Lowndes', leakageScore: 0.36, totalLeakage: 1950000, hasMarker: false,
        facilities: [{ name: 'South Georgia Medical', spend: 1950000, services: [{ name: 'Various Services', cpt: '99213', isElective: true, spend: 1950000, provider: 'Various' }]}]},
    '13127': { name: 'Glynn', leakageScore: 0.33, totalLeakage: 1750000, hasMarker: false,
        facilities: [{ name: 'Southeast Georgia Health', spend: 1750000, services: [{ name: 'Various Services', cpt: '99213', isElective: true, spend: 1750000, provider: 'Various' }]}]},
    '13059': { name: 'Clarke', leakageScore: 0.29, totalLeakage: 1400000, hasMarker: false,
        facilities: [{ name: 'Piedmont Athens', spend: 1400000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 1400000, provider: 'Various' }]}]},
    '13013': { name: 'Barrow', leakageScore: 0.24, totalLeakage: 1100000, hasMarker: false,
        facilities: [{ name: 'Piedmont Barrow', spend: 1100000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 1100000, provider: 'Various' }]}]},
    '13313': { name: 'Whitfield', leakageScore: 0.31, totalLeakage: 1600000, hasMarker: false,
        facilities: [{ name: 'Hamilton Medical', spend: 1600000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 1600000, provider: 'Various' }]}]},
    '13115': { name: 'Floyd', leakageScore: 0.34, totalLeakage: 1750000, hasMarker: false,
        facilities: [{ name: 'Floyd Medical Center', spend: 1750000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 1750000, provider: 'Various' }]}]},
    '13047': { name: 'Catoosa', leakageScore: 0.27, totalLeakage: 1250000, hasMarker: false,
        facilities: [{ name: 'Hutcheson Medical', spend: 1250000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 1250000, provider: 'Various' }]}]},
    '13015': { name: 'Bartow', leakageScore: 0.23, totalLeakage: 1050000, hasMarker: false,
        facilities: [{ name: 'Cartersville Medical', spend: 1050000, services: [{ name: 'General Services', cpt: '99213', isElective: true, spend: 1050000, provider: 'Various' }]}]}
};

// Geographic Map Visualization - Real Georgia County Boundaries using TopoJSON
function initializeGeographicMap() {
    const container = document.getElementById('georgia-map-container');
    if (!container) return;

    container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #666;">Loading Georgia county map...</div>';

    // Load Georgia counties TopoJSON from CDN
    const topoJsonUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

    fetch(topoJsonUrl)
        .then(response => response.json())
        .then(us => {
            // Filter to only Georgia counties (FIPS codes starting with 13)
            const georgiaCounties = {
                type: 'GeometryCollection',
                geometries: us.objects.counties.geometries.filter(d => d.id.toString().startsWith('13'))
            };

            renderGeorgiaMap(container, us, georgiaCounties);
        })
        .catch(error => {
            console.error('Error loading TopoJSON:', error);
            // Fallback to SVG-based Georgia map
            renderFallbackGeorgiaMap(container);
        });
}

function renderGeorgiaMap(container, us, georgiaCounties) {
    container.innerHTML = '';

    const width = container.clientWidth || 700;
    const height = 600;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'linear-gradient(135deg, #fdfbf7 0%, #fef9f3 100%)');

    // Color scale - beige to deep orange (matching reference image)
    const colorScale = d3.scaleSequential()
        .domain([0, 1])
        .interpolator(t => d3.interpolateRgb('#fef3e2', '#c0392b')(t));

    // Create projection centered on Georgia
    const projection = d3.geoMercator()
        .center([-83.5, 32.7])
        .scale(5500)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Convert TopoJSON to GeoJSON
    const counties = topojson.feature(us, georgiaCounties);

    // Draw counties
    const countyPaths = svg.append('g')
        .selectAll('path')
        .data(counties.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', d => {
            const fips = d.id.toString();
            const countyData = georgiaCountyLeakageData[fips];
            if (countyData) {
                return colorScale(countyData.leakageScore);
            }
            // Default low leakage color for counties without data
            return colorScale(Math.random() * 0.15 + 0.05);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function(event, d) {
            d3.select(this)
                .attr('stroke', '#2c3e50')
                .attr('stroke-width', 2)
                .raise();
            showCountyTooltip(event, d);
        })
        .on('mouseleave', function() {
            d3.select(this)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5);
            hideCountyTooltip();
        })
        .on('click', function(event, d) {
            const fips = d.id.toString();
            const countyData = georgiaCountyLeakageData[fips];
            if (countyData) {
                showCountyDrillDown({ ...countyData, fips });
            }
        });

    // Add state border
    svg.append('path')
        .datum(topojson.mesh(us, georgiaCounties, (a, b) => a === b))
        .attr('fill', 'none')
        .attr('stroke', '#8b4513')
        .attr('stroke-width', 2)
        .attr('d', path);

    // Add white pin markers for high-leakage counties
    const markerData = Object.entries(georgiaCountyLeakageData)
        .filter(([fips, data]) => data.hasMarker)
        .map(([fips, data]) => {
            const county = counties.features.find(f => f.id.toString() === fips);
            if (county) {
                const centroid = path.centroid(county);
                return { ...data, fips, centroid };
            }
            return null;
        })
        .filter(d => d !== null);

    const markers = svg.append('g')
        .selectAll('.marker')
        .data(markerData)
        .enter()
        .append('g')
        .attr('class', 'marker')
        .attr('transform', d => `translate(${d.centroid[0]}, ${d.centroid[1] - 15})`)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            showCountyDrillDown(d);
        });

    // Pin drop shape
    markers.append('path')
        .attr('d', 'M 0 0 C -4 -4 -8 -10 -8 -16 A 8 8 0 1 1 8 -16 C 8 -10 4 -4 0 0 Z')
        .attr('fill', '#fff')
        .attr('stroke', '#2c3e50')
        .attr('stroke-width', 1.5)
        .style('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))');

    // Red dot in center of pin
    markers.append('circle')
        .attr('cx', 0)
        .attr('cy', -16)
        .attr('r', 4)
        .attr('fill', '#e74c3c');

    // Add legend
    addMapLegend(svg, width, height, colorScale);

    // Create tooltip
    createMapTooltip();
}

function renderFallbackGeorgiaMap(container) {
    // Fallback SVG-based map if TopoJSON fails to load
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <p>Unable to load detailed county map.</p>
            <p>Please check your internet connection and refresh the page.</p>
        </div>
    `;
}

function addMapLegend(svg, width, height, colorScale) {
    const legend = svg.append('g')
        .attr('transform', `translate(20, ${height - 140})`);

    // Legend background
    legend.append('rect')
        .attr('x', -10)
        .attr('y', -10)
        .attr('width', 180)
        .attr('height', 130)
        .attr('fill', 'rgba(255,255,255,0.95)')
        .attr('stroke', '#ddd')
        .attr('rx', 8)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    legend.append('text')
        .attr('x', 0)
        .attr('y', 10)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#2c3e50')
        .text('Leakage Intensity');

    // Gradient bar
    const gradientId = 'legend-gradient-' + Math.random().toString(36).substr(2, 9);
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('x2', '100%');

    linearGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fef3e2');
    linearGradient.append('stop').attr('offset', '50%').attr('stop-color', '#e67e22');
    linearGradient.append('stop').attr('offset', '100%').attr('stop-color', '#c0392b');

    legend.append('rect')
        .attr('x', 0)
        .attr('y', 25)
        .attr('width', 140)
        .attr('height', 15)
        .attr('fill', `url(#${gradientId})`)
        .attr('stroke', '#999')
        .attr('rx', 2);

    legend.append('text').attr('x', 0).attr('y', 55).attr('font-size', '10px').attr('fill', '#666').text('Low');
    legend.append('text').attr('x', 60).attr('y', 55).attr('font-size', '10px').attr('fill', '#666').text('Medium');
    legend.append('text').attr('x', 120).attr('y', 55).attr('font-size', '10px').attr('fill', '#666').text('High');

    // Marker legend
    const markerLegend = legend.append('g').attr('transform', 'translate(0, 70)');

    markerLegend.append('path')
        .attr('d', 'M 10 0 C 6 -4 2 -8 2 -12 A 8 8 0 1 1 18 -12 C 18 -8 14 -4 10 0 Z')
        .attr('fill', '#fff')
        .attr('stroke', '#2c3e50')
        .attr('stroke-width', 1)
        .attr('transform', 'scale(0.7)');

    markerLegend.append('circle')
        .attr('cx', 7)
        .attr('cy', -8)
        .attr('r', 2.5)
        .attr('fill', '#e74c3c');

    markerLegend.append('text')
        .attr('x', 25)
        .attr('y', -3)
        .attr('font-size', '10px')
        .attr('fill', '#2c3e50')
        .text('High Leakage Area');

    // Click instruction
    legend.append('text')
        .attr('x', 0)
        .attr('y', 105)
        .attr('font-size', '9px')
        .attr('fill', '#999')
        .text('Click county for details');
}

function createMapTooltip() {
    if (!document.getElementById('county-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'county-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(44, 62, 80, 0.95);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            max-width: 250px;
        `;
        document.body.appendChild(tooltip);
    }
}

function showCountyTooltip(event, d) {
    const tooltip = document.getElementById('county-tooltip');
    if (!tooltip) return;

    const fips = d.id ? d.id.toString() : d.fips;
    const countyData = georgiaCountyLeakageData[fips] || d;

    if (countyData && countyData.name) {
        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">${countyData.name} County</div>
            <div style="margin-bottom: 4px;">Leakage: <strong style="color: #e74c3c;">$${(countyData.totalLeakage / 1000000).toFixed(1)}M</strong></div>
            <div style="margin-bottom: 4px;">Score: <strong>${(countyData.leakageScore * 100).toFixed(0)}%</strong></div>
            <div style="font-size: 10px; margin-top: 6px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">Click for facility details</div>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY - 10) + 'px';
    }
}

function hideCountyTooltip() {
    const tooltip = document.getElementById('county-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function showCountyDrillDown(county) {
    const electiveTotal = county.facilities.reduce((sum, f) =>
        sum + f.services.filter(s => s.isElective).reduce((s, srv) => s + srv.spend, 0), 0);
    const nonElectiveTotal = county.facilities.reduce((sum, f) =>
        sum + f.services.filter(s => !s.isElective).reduce((s, srv) => s + srv.spend, 0), 0);

    let modalBody = `
        <h2 style="margin-bottom: 0.5rem;">${county.name} - Leakage Analysis</h2>
        <p style="color: #7f8c8d; margin-bottom: 1.5rem;">Out-of-Network referral patterns and spend breakdown</p>

        <div class="market-kpi-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="kpi-box">
                <div class="kpi-label">Total Leakage</div>
                <div class="kpi-value bad">$${(county.totalLeakage / 1000000).toFixed(2)}M</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Leakage Score</div>
                <div class="kpi-value" style="color: ${county.leakageScore > 0.6 ? '#e74c3c' : county.leakageScore > 0.3 ? '#f39c12' : '#27ae60'};">${(county.leakageScore * 100).toFixed(0)}%</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Elective Spend</div>
                <div class="kpi-value">$${(electiveTotal / 1000000).toFixed(2)}M</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Non-Elective Spend</div>
                <div class="kpi-value">$${(nonElectiveTotal / 1000000).toFixed(2)}M</div>
            </div>
        </div>

        <h3 style="margin-bottom: 1rem; border-bottom: 2px solid #667eea; padding-bottom: 0.5rem;">
            Facilities with High Leakage (${county.facilities.length})
        </h3>

        ${county.facilities.map(facility => `
            <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; border-left: 4px solid #e74c3c;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <h4 style="margin: 0; color: #2c3e50;">${facility.name}</h4>
                    <span style="background: #e74c3c; color: #fff; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">
                        $${(facility.spend / 1000000).toFixed(2)}M
                    </span>
                </div>

                <table class="data-table" style="font-size: 0.85rem; margin: 0;">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>CPT</th>
                            <th>Type</th>
                            <th>Provider</th>
                            <th style="text-align: right;">Spend</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${facility.services.map(service => `
                            <tr>
                                <td>${service.name}</td>
                                <td><code>${service.cpt}</code></td>
                                <td>
                                    <span style="background: ${service.isElective ? '#f39c12' : '#9b59b6'}; color: #fff; padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.75rem;">
                                        ${service.isElective ? 'Elective' : 'Non-Elective'}
                                    </span>
                                </td>
                                <td>${service.provider}</td>
                                <td style="text-align: right; font-weight: bold; color: #e74c3c;">$${(service.spend / 1000).toFixed(0)}K</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}

        <div class="alert-box warning" style="margin-top: 1.5rem;">
            <h4>Intervention Recommendations</h4>
            <ul>
                <li><strong>Network Development:</strong> Evaluate contracting opportunities with high-volume OON facilities in ${county.name}</li>
                <li><strong>Provider Education:</strong> Implement referral guidance for elective services ($${(electiveTotal / 1000000).toFixed(1)}M opportunity)</li>
                <li><strong>Care Navigation:</strong> Deploy care coordinators for high-cost service lines</li>
                <li><strong>Savings Potential:</strong> Recapturing 50% of elective leakage = <strong style="color: #27ae60;">$${(electiveTotal * 0.5 / 1000000).toFixed(2)}M</strong> annually</li>
            </ul>
        </div>
    `;

    showModal(modalBody);
}

function showLeakDetailModal(leakData) {
    let modalBody = `
        <h2>${leakData.name}</h2>
        <p class="provider-summary">Out-of-Network referral destination for ${leakData.serviceLine}</p>

        <div class="market-kpi-row" style="grid-template-columns: repeat(3, 1fr);">
            <div class="kpi-box">
                <div class="kpi-label">Leaked Amount</div>
                <div class="kpi-value bad">$${(leakData.leaked / 1000000).toFixed(1)}M</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Service Line</div>
                <div class="kpi-value">${leakData.serviceLine}</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Referring From</div>
                <div class="kpi-value">${leakData.fromPCP}</div>
            </div>
        </div>

        <div class="alert-box warning" style="margin-top: 2rem;">
            <h4>Intervention Opportunity</h4>
            <ul>
                <li><strong>Root Cause:</strong> ${leakData.fromPCP.replace(' PCPs', '')} market lacks in-network ${leakData.serviceLine} providers with adequate capacity</li>
                <li><strong>Network Strategy:</strong> Recruit or contract with ${leakData.serviceLine} specialist group in this region</li>
                <li><strong>Savings Potential:</strong> Recapturing 60% could save $${(leakData.leaked * 0.6 / 1000000).toFixed(1)}M annually</li>
                <li><strong>Provider Engagement:</strong> Educate PCPs on in-network ${leakData.serviceLine} options and referral pathways</li>
            </ul>
        </div>
    `;

    showModal(modalBody);
}

// Drill-Down Functions
function drillDownMarket(marketId) {
    const marketData = {
        'atlanta-north': {
            name: 'Atlanta North',
            lives: 12456,
            pmpm: 823.45,
            providers: [
                { name: 'Piedmont Atlanta', lives: 4234, pmpm: 812.34, quality: 91.2, leakage: 15.2 },
                { name: 'Piedmont Mountainside', lives: 3892, pmpm: 828.76, quality: 88.7, leakage: 19.4 },
                { name: 'Piedmont Henry', lives: 2456, pmpm: 835.21, quality: 89.5, leakage: 18.9 },
                { name: 'Community Providers', lives: 1874, pmpm: 819.45, quality: 87.3, leakage: 21.3 }
            ]
        },
        'atlanta-south': {
            name: 'Atlanta South',
            lives: 15234,
            pmpm: 871.22,
            providers: [
                { name: 'Piedmont Fayette', lives: 5123, pmpm: 856.32, quality: 87.1, leakage: 24.8 },
                { name: 'Piedmont Newnan', lives: 4567, pmpm: 883.45, quality: 85.3, leakage: 29.2 },
                { name: 'Piedmont Henry', lives: 3234, pmpm: 872.19, quality: 86.7, leakage: 28.1 },
                { name: 'Community Providers', lives: 2310, pmpm: 868.92, quality: 85.9, leakage: 26.5 }
            ]
        },
        'augusta': {
            name: 'Augusta',
            lives: 6734,
            pmpm: 892.18,
            providers: [
                { name: 'Piedmont Augusta', lives: 3421, pmpm: 878.45, quality: 85.2, leakage: 28.9 },
                { name: 'Piedmont McDuffie', lives: 1876, pmpm: 905.32, quality: 83.7, leakage: 34.2 },
                { name: 'Piedmont Burke', lives: 982, pmpm: 912.67, quality: 82.9, leakage: 35.8 },
                { name: 'Community Providers', lives: 455, pmpm: 897.23, quality: 84.1, leakage: 31.5 }
            ]
        },
        'columbus': {
            name: 'Columbus',
            lives: 8923,
            pmpm: 834.67,
            providers: [
                { name: 'Piedmont Columbus', lives: 4512, pmpm: 825.34, quality: 89.1, leakage: 19.2 },
                { name: 'Piedmont Midland', lives: 2876, pmpm: 841.23, quality: 87.8, leakage: 22.4 },
                { name: 'Community Providers', lives: 1535, pmpm: 846.78, quality: 88.2, leakage: 23.1 }
            ]
        },
        'macon': {
            name: 'Macon',
            lives: 4476,
            pmpm: 851.34,
            providers: [
                { name: 'Piedmont Macon', lives: 2834, pmpm: 845.12, quality: 86.5, leakage: 18.4 },
                { name: 'Piedmont Medical Center', lives: 1642, pmpm: 862.45, quality: 85.1, leakage: 21.7 }
            ]
        }
    };

    const market = marketData[marketId];
    if (!market) return;

    let modalBody = `
        <h2>${market.name} Market - Provider Performance</h2>
        <p class="market-summary">Drilling down from market-level to individual provider performance</p>

        <div class="market-kpi-row">
            <div class="kpi-box">
                <div class="kpi-label">Market Lives</div>
                <div class="kpi-value">${market.lives.toLocaleString()}</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Market PMPM</div>
                <div class="kpi-value">$${market.pmpm.toFixed(2)}</div>
            </div>
        </div>

        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Provider-Level Performance</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Provider / Facility</th>
                    <th>Attributed Lives</th>
                    <th>PMPM Spend</th>
                    <th>Quality Score</th>
                    <th>Leakage %</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    market.providers.forEach(provider => {
        const pmpmClass = provider.pmpm < 850 ? 'good' : provider.pmpm > 880 ? 'bad' : 'warning';
        const leakClass = provider.leakage < 20 ? 'good' : provider.leakage > 25 ? 'bad' : 'warning';

        modalBody += `
            <tr onclick="drillDownProvider('${provider.name}', ${provider.lives})">
                <td><strong>${provider.name}</strong></td>
                <td>${provider.lives.toLocaleString()}</td>
                <td class="${pmpmClass}">$${provider.pmpm.toFixed(2)}</td>
                <td>${provider.quality}%</td>
                <td class="${leakClass}">${provider.leakage}%</td>
                <td><button class="btn-small">Cost Drivers - Avoidables →</button></td>
            </tr>
        `;
    });

    modalBody += `
            </tbody>
        </table>

        <div class="alert-box" style="margin-top: 2rem;">
            <h4>Insights & Recommended Actions</h4>
            <ul>
                <li><strong>High Performers:</strong> ${market.providers[0].name} shows strong cost control and quality</li>
                <li><strong>Opportunities:</strong> Focus on reducing leakage at providers with >25% OON referrals</li>
                <li><strong>Next Steps:</strong> Drill down to service line level to identify specific leakage drivers</li>
            </ul>
        </div>

        <style>
            .market-summary { color: #7f8c8d; margin-bottom: 2rem; font-size: 1.1rem; }
            .market-kpi-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin: 1.5rem 0; }
            .kpi-box { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; }
            .kpi-box .kpi-label { font-size: 0.85rem; color: #7f8c8d; text-transform: uppercase; margin-bottom: 0.5rem; }
            .kpi-box .kpi-value { font-size: 2rem; font-weight: 700; color: #2c3e50; }
        </style>
    `;

    showModal(modalBody);
}

function drillDownProvider(providerName, lives) {
    const avoidableEDData = {
        total: Math.floor(lives * 0.28),
        avoidable: Math.floor(lives * 0.28 * 0.32),
        costPerVisit: 1227,
        topReasons: [
            { reason: 'URI / Cold symptoms', visits: Math.floor(lives * 0.028), cost: Math.floor(lives * 0.028 * 1227) },
            { reason: 'Back pain - non-traumatic', visits: Math.floor(lives * 0.022), cost: Math.floor(lives * 0.022 * 1227) },
            { reason: 'Headache', visits: Math.floor(lives * 0.018), cost: Math.floor(lives * 0.018 * 1227) },
            { reason: 'Dental pain', visits: Math.floor(lives * 0.015), cost: Math.floor(lives * 0.015 * 1227) },
            { reason: 'Minor laceration', visits: Math.floor(lives * 0.013), cost: Math.floor(lives * 0.013 * 1227) }
        ]
    };

    const avoidablePct = ((avoidableEDData.avoidable / avoidableEDData.total) * 100).toFixed(1);
    const totalCost = avoidableEDData.avoidable * avoidableEDData.costPerVisit;

    let modalBody = `
        <h2>${providerName} - Avoidable ED Visit Analysis</h2>
        <p class="provider-summary">Provider-level drill-down showing opportunities for cost reduction</p>

        <div class="provider-kpi-row">
            <div class="kpi-box">
                <div class="kpi-label">Total ED Visits</div>
                <div class="kpi-value">${avoidableEDData.total}</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Avoidable ED Visits</div>
                <div class="kpi-value bad">${avoidableEDData.avoidable}</div>
                <div class="kpi-sub">${avoidablePct}% of total</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Cost Opportunity</div>
                <div class="kpi-value warning">$${totalCost.toLocaleString()}</div>
                <div class="kpi-sub">Annual savings potential</div>
            </div>
        </div>

        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Top Avoidable ED Visit Reasons</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Reason for Visit</th>
                    <th>Visit Count</th>
                    <th>Total Cost</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    avoidableEDData.topReasons.forEach(item => {
        modalBody += `
            <tr>
                <td><strong>${item.reason}</strong></td>
                <td>${item.visits}</td>
                <td>$${item.cost.toLocaleString()}</td>
                <td><button class="btn-small" onclick="event.stopPropagation(); showPatientList('${item.reason}', '${providerName}');">View Patients</button></td>
            </tr>
        `;
    });

    modalBody += `
            </tbody>
        </table>

        <div class="alert-box success" style="margin-top: 2rem;">
            <h4>Recommended Interventions</h4>
            <ul>
                <li><strong>Urgent Care Steering:</strong> Redirect non-emergent visits to lower-cost urgent care (Est. savings: $${(totalCost * 0.6).toLocaleString()})</li>
                <li><strong>Telehealth Expansion:</strong> Promote virtual visits for URI, headache, minor issues (Est. savings: $${(totalCost * 0.3).toLocaleString()})</li>
                <li><strong>Patient Education:</strong> Targeted outreach to high utilizers about appropriate care settings</li>
                <li><strong>After-Hours Access:</strong> Extend PCP hours to capture after-hours non-emergent needs</li>
            </ul>
        </div>

        <style>
            .provider-summary { color: #7f8c8d; margin-bottom: 2rem; font-size: 1.1rem; }
            .provider-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 1.5rem 0; }
            .kpi-sub { font-size: 0.85rem; color: #7f8c8d; margin-top: 0.25rem; }
        </style>
    `;

    showModal(modalBody);
}

function showPatientList(reason, providerName) {
    // Generate sample patient data
    const patients = [];
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];

    const numPatients = Math.floor(Math.random() * 15) + 10; // 10-25 patients

    for (let i = 0; i < numPatients; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const age = Math.floor(Math.random() * 50) + 25; // 25-75 years old
        const visitCount = Math.floor(Math.random() * 4) + 1; // 1-4 visits
        const totalCost = visitCount * (Math.floor(Math.random() * 500) + 900); // $900-$1400 per visit
        const myChartStatus = Math.random() > 0.3 ? 'Active' : 'Inactive';
        const lastVisit = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString();

        patients.push({
            mrn: `MRN${String(Math.floor(Math.random() * 900000) + 100000)}`,
            firstName,
            lastName,
            age,
            visitCount,
            totalCost,
            myChartStatus,
            lastVisit,
            primaryInsurance: Math.random() > 0.2 ? 'Medicare' : 'Medicare Advantage'
        });
    }

    // Sort by total cost descending
    patients.sort((a, b) => b.totalCost - a.totalCost);

    let modalBody = `
        <h2>Patient List: ${reason}</h2>
        <p class="provider-summary">${providerName} - ${numPatients} patients with avoidable ED visits</p>

        <div class="market-kpi-row" style="grid-template-columns: repeat(3, 1fr);">
            <div class="kpi-box">
                <div class="kpi-label">Total Patients</div>
                <div class="kpi-value">${numPatients}</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Total Visits</div>
                <div class="kpi-value">${patients.reduce((sum, p) => sum + p.visitCount, 0)}</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Total Cost</div>
                <div class="kpi-value bad">$${patients.reduce((sum, p) => sum + p.totalCost, 0).toLocaleString()}</div>
            </div>
        </div>

        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Patient Details</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>MRN</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Age</th>
                    <th>Visit Count</th>
                    <th>Total Cost</th>
                    <th>MyChart Status</th>
                    <th>Last Visit</th>
                    <th>Insurance</th>
                </tr>
            </thead>
            <tbody>
    `;

    patients.forEach(patient => {
        const myChartClass = patient.myChartStatus === 'Active' ? 'good' : 'warning';

        modalBody += `
            <tr>
                <td><strong>${patient.mrn}</strong></td>
                <td>${patient.firstName}</td>
                <td>${patient.lastName}</td>
                <td>${patient.age}</td>
                <td>${patient.visitCount}</td>
                <td>$${patient.totalCost.toLocaleString()}</td>
                <td class="${myChartClass}">${patient.myChartStatus}</td>
                <td>${patient.lastVisit}</td>
                <td>${patient.primaryInsurance}</td>
            </tr>
        `;
    });

    modalBody += `
            </tbody>
        </table>

        <div class="alert-box warning" style="margin-top: 2rem;">
            <h4>Recommended Patient Interventions</h4>
            <ul>
                <li><strong>MyChart Inactive:</strong> ${patients.filter(p => p.myChartStatus === 'Inactive').length} patients need MyChart activation for better engagement</li>
                <li><strong>High Utilizers:</strong> ${patients.filter(p => p.visitCount >= 3).length} patients with 3+ visits need care management outreach</li>
                <li><strong>Cost Opportunity:</strong> Steering these patients to urgent care could save ~${Math.floor(patients.reduce((sum, p) => sum + p.totalCost, 0) * 0.65).toLocaleString()}</li>
            </ul>
        </div>
    `;

    showModal(modalBody);
}

function drillDownEDMarket(marketId) {
    const marketNames = {
        'atlanta-north': 'Atlanta North',
        'atlanta-south': 'Atlanta South',
        'augusta': 'Augusta',
        'columbus': 'Columbus',
        'macon': 'Macon'
    };

    const marketName = marketNames[marketId] || marketId;

    // Market-specific provider data matching the summary table values
    const marketData = {
        'atlanta-south': {
            pcps: [
                { pcp: 'Dr. Sarah Mitchell', pcpId: 'mitchell-s', lives: 1847, totalED: 1523, avoidableED: 548, avoidablePct: 36.0, costPerVisit: 1226, savingsPotential: 671848 },
                { pcp: 'Dr. James Wilson', pcpId: 'wilson-j', lives: 1623, totalED: 1342, avoidableED: 483, avoidablePct: 36.0, costPerVisit: 1226, savingsPotential: 592158 },
                { pcp: 'Dr. Maria Garcia', pcpId: 'garcia-m', lives: 1245, totalED: 892, avoidableED: 321, avoidablePct: 36.0, costPerVisit: 1226, savingsPotential: 393546 },
                { pcp: 'Dr. Robert Chen', pcpId: 'chen-r', lives: 987, totalED: 474, avoidableED: 171, avoidablePct: 36.1, costPerVisit: 1226, savingsPotential: 209646 }
            ],
            totalED: 4231,
            totalAvoidable: 1523,
            avgAvoidablePct: 36.0,
            costImpact: 1868271,
            savingsPotential: 1400000
        },
        'augusta': {
            pcps: [
                { pcp: 'Dr. Patricia Brown', pcpId: 'brown-p', lives: 1234, totalED: 876, avoidableED: 316, avoidablePct: 36.1, costPerVisit: 1227, savingsPotential: 387732 },
                { pcp: 'Dr. Michael Davis', pcpId: 'davis-m', lives: 1123, totalED: 698, avoidableED: 252, avoidablePct: 36.1, costPerVisit: 1227, savingsPotential: 309204 },
                { pcp: 'Dr. Jennifer Lee', pcpId: 'lee-j', lives: 876, totalED: 413, avoidableED: 149, avoidablePct: 36.1, costPerVisit: 1227, savingsPotential: 182823 },
                { pcp: 'Dr. William Taylor', pcpId: 'taylor-w', lives: 654, totalED: 200, avoidableED: 72, avoidablePct: 36.0, costPerVisit: 1227, savingsPotential: 88344 }
            ],
            totalED: 2187,
            totalAvoidable: 789,
            avgAvoidablePct: 36.1,
            costImpact: 967803,
            savingsPotential: 725000
        },
        'atlanta-north': {
            pcps: [
                { pcp: 'Dr. Elizabeth Martinez', pcpId: 'martinez-e', lives: 1567, totalED: 1245, avoidableED: 349, avoidablePct: 28.0, costPerVisit: 1227, savingsPotential: 428223 },
                { pcp: 'Dr. David Anderson', pcpId: 'anderson-d', lives: 1345, totalED: 987, avoidableED: 276, avoidablePct: 28.0, costPerVisit: 1227, savingsPotential: 338652 },
                { pcp: 'Dr. Susan Thompson', pcpId: 'thompson-s', lives: 1123, totalED: 789, avoidableED: 221, avoidablePct: 28.0, costPerVisit: 1227, savingsPotential: 271167 },
                { pcp: 'Dr. Richard White', pcpId: 'white-r', lives: 876, totalED: 435, avoidableED: 121, avoidablePct: 27.8, costPerVisit: 1227, savingsPotential: 148467 }
            ],
            totalED: 3456,
            totalAvoidable: 967,
            avgAvoidablePct: 28.0,
            costImpact: 1186309,
            savingsPotential: 890000
        },
        'columbus': {
            pcps: [
                { pcp: 'Dr. Karen Johnson', pcpId: 'johnson-k', lives: 1234, totalED: 987, avoidableED: 257, avoidablePct: 26.0, costPerVisit: 1227, savingsPotential: 315339 },
                { pcp: 'Dr. Thomas Moore', pcpId: 'moore-t', lives: 1098, totalED: 765, avoidableED: 199, avoidablePct: 26.0, costPerVisit: 1227, savingsPotential: 244173 },
                { pcp: 'Dr. Nancy Clark', pcpId: 'clark-n', lives: 876, totalED: 523, avoidableED: 136, avoidablePct: 26.0, costPerVisit: 1227, savingsPotential: 166872 },
                { pcp: 'Dr. Joseph Lewis', pcpId: 'lewis-j', lives: 654, totalED: 259, avoidableED: 66, avoidablePct: 25.5, costPerVisit: 1227, savingsPotential: 80982 }
            ],
            totalED: 2534,
            totalAvoidable: 658,
            avgAvoidablePct: 26.0,
            costImpact: 807066,
            savingsPotential: 605000
        },
        'macon': {
            pcps: [
                { pcp: 'Dr. Linda Hall', pcpId: 'hall-l', lives: 654, totalED: 534, avoidableED: 150, avoidablePct: 28.1, costPerVisit: 1227, savingsPotential: 184050 },
                { pcp: 'Dr. Charles Young', pcpId: 'young-c', lives: 543, totalED: 412, avoidableED: 115, avoidablePct: 27.9, costPerVisit: 1227, savingsPotential: 141105 },
                { pcp: 'Dr. Barbara King', pcpId: 'king-b', lives: 432, totalED: 299, avoidableED: 84, avoidablePct: 28.1, costPerVisit: 1227, savingsPotential: 103068 }
            ],
            totalED: 1245,
            totalAvoidable: 349,
            avgAvoidablePct: 28.0,
            costImpact: 428223,
            savingsPotential: 321000
        }
    };

    const currentMarket = marketData[marketId] || marketData['atlanta-south'];
    const pcpData = currentMarket.pcps;

    const totalSavings = pcpData.reduce((sum, p) => sum + p.savingsPotential, 0);
    const totalAvoidable = pcpData.reduce((sum, p) => sum + p.avoidableED, 0);
    const totalEDVisits = pcpData.reduce((sum, p) => sum + p.totalED, 0);
    const avgAvoidablePct = currentMarket.avgAvoidablePct.toFixed(1);
    const avgCostPerVisit = Math.round(pcpData.reduce((sum, p) => sum + p.costPerVisit, 0) / pcpData.length);
    const diversionRate = 0.65; // 65% can be diverted to urgent care
    const diversionSavings = Math.round(totalSavings * diversionRate);

    let modalBody = `
        <h2>${marketName} - Avoidable ED Cost Opportunity</h2>
        <p class="provider-summary">Attributed PCP-level analysis showing savings from diverting avoidable ED visits to lower-cost settings</p>

        <!-- Reference Values Bar -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #e74c3c;">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values & Definitions</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Avg ED Cost/Visit:</span>
                        <span style="font-weight: 700; color: #e74c3c; margin-left: 0.5rem; font-size: 1.1rem;">$${avgCostPerVisit.toLocaleString()}</span>
                        <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Facility + professional fees</div>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Urgent Care Cost:</span>
                        <span style="font-weight: 700; color: #27ae60; margin-left: 0.5rem; font-size: 1.1rem;">~$150</span>
                        <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Alternative setting benchmark</div>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Diversion Rate:</span>
                        <span style="font-weight: 700; color: #3498db; margin-left: 0.5rem; font-size: 1.1rem;">65%</span>
                        <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Industry achievable target</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Total Avoidable Visits
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #e74c3c; margin: 0.5rem 0;">
                    ${totalAvoidable.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <span>${avgAvoidablePct}% of ${totalEDVisits.toLocaleString()} total ED visits</span>
                </div>
            </div>
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Full Savings Potential
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #f39c12; margin: 0.5rem 0;">
                    $${totalSavings.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <span>If 100% diverted to urgent care</span>
                    <div style="font-size: 0.7rem; color: #888; margin-top: 0.25rem;">
                        Formula: Avoidable × (ED Cost - UC Cost)
                    </div>
                </div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #28a745;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #155724; text-transform: uppercase;">
                    Realistic Savings (65%)
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #155724; margin: 0.5rem 0;">
                    $${diversionSavings.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #155724; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(40,167,69,0.3);">
                    <span>65% diversion rate achievable</span>
                    <div style="font-size: 0.7rem; color: #1e7e34; margin-top: 0.25rem;">
                        Formula: $${totalSavings.toLocaleString()} × 65%
                    </div>
                </div>
            </div>
        </div>

        <!-- Savings Calculation Breakdown -->
        <div style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">📊</span> Savings Calculation Breakdown by Attributed PCP
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Attributed PCP</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Total ED</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avoidable</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">% Avoidable</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Cost/Visit</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Calculation</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Savings<br>Potential</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pcpData.map(p => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.pcp}</strong><br><span style="font-size: 0.75rem; color: #6c757d;">${p.lives.toLocaleString()} attributed lives</span></td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.totalED.toLocaleString()}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #e74c3c; font-weight: 600;">${p.avoidableED}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${p.avoidablePct > 33 ? '#e74c3c' : '#f39c12'};">${p.avoidablePct}%</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee;">$${p.costPerVisit.toLocaleString()}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #6c757d;">
                                    ${p.avoidableED} × $${p.costPerVisit.toLocaleString()}
                                </td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">
                                    $${p.savingsPotential.toLocaleString()}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">
                                    <button class="btn-small" onclick="showEDPatientDetail('${marketId}', '${p.pcpId}', '${p.pcp}', ${p.avoidableED}, ${p.costPerVisit})" style="white-space: nowrap;">
                                        Patient Detail
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8f9fa; font-weight: 700;">
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;">TOTAL</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${totalEDVisits.toLocaleString()}</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6; color: #e74c3c;">${totalAvoidable.toLocaleString()}</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${avgAvoidablePct}%</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #d4edda; color: #155724; font-size: 1.1rem;">$${totalSavings.toLocaleString()}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                        </tr>
                        <tr style="background: #d4edda;">
                            <td colspan="7" style="padding: 0.75rem; font-weight: 600; color: #155724;">
                                Realistic Savings @ 65% Diversion Rate
                            </td>
                            <td style="padding: 0.75rem; text-align: right; font-weight: 700; color: #155724; font-size: 1.1rem;">
                                $${diversionSavings.toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Methodology Box -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #2c3e50;">
                <span style="margin-right: 0.5rem;">📋</span>Methodology & Definitions
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; font-size: 0.8rem; color: #5a6c7d;">
                <div>
                    <strong style="color: #2c3e50;">Avoidable ED Visit Definition:</strong>
                    <p style="margin: 0.25rem 0 0 0;">ED visits classified as avoidable based on NYU ED Algorithm. Includes conditions treatable in primary care, urgent care, or via telehealth (e.g., URI, UTI, minor injuries, non-emergent back pain).</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Cost/Visit Calculation:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Total allowed amount including facility fees (ED, observation) + professional fees (physician, radiology, labs). Represents actual paid claims, not billed charges.</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Savings Potential Formula:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Avoidable Visits × (ED Cost/Visit - Urgent Care Cost). Conservative estimate assumes $150 urgent care alternative cost. Does not include pharmacy or follow-up savings.</p>
                </div>
            </div>
        </div>

        <div class="alert-box success" style="margin-top: 1rem;">
            <h4>Intervention Strategy for ${marketName}</h4>
            <ul>
                <li><strong>Target PCPs:</strong> Focus on ${pcpData[0].pcp} and ${pcpData[1]?.pcp || 'high-utilization PCPs'} for greatest impact ($${(pcpData[0].savingsPotential + (pcpData[1]?.savingsPotential || 0)).toLocaleString()} combined)</li>
                <li><strong>Patient Engagement:</strong> Activate MyChart for top utilizers and promote telehealth options</li>
                <li><strong>Network Strategy:</strong> Expand urgent care hours and locations in high-utilization areas</li>
            </ul>
        </div>
    `;

    showModal(modalBody);
}

// Show patient detail for avoidable ED visits
function showEDPatientDetail(marketId, pcpId, pcpName, avoidableCount, costPerVisit) {
    const marketNames = {
        'atlanta-north': 'Atlanta North',
        'atlanta-south': 'Atlanta South',
        'augusta': 'Augusta',
        'columbus': 'Columbus',
        'macon': 'Macon'
    };

    const marketName = marketNames[marketId] || marketId;

    // Generate sample patient data for the selected PCP
    const avoidableConditions = [
        { code: 'J06.9', desc: 'Acute upper respiratory infection', category: 'Primary Care Treatable', urgentCareCost: 125 },
        { code: 'N39.0', desc: 'Urinary tract infection', category: 'Primary Care Treatable', urgentCareCost: 145 },
        { code: 'M54.5', desc: 'Low back pain', category: 'Non-Emergent', urgentCareCost: 135 },
        { code: 'J20.9', desc: 'Acute bronchitis', category: 'Primary Care Treatable', urgentCareCost: 130 },
        { code: 'H10.9', desc: 'Conjunctivitis', category: 'Primary Care Treatable', urgentCareCost: 95 },
        { code: 'L03.90', desc: 'Cellulitis', category: 'Urgent Care Appropriate', urgentCareCost: 155 },
        { code: 'S93.40', desc: 'Ankle sprain', category: 'Non-Emergent', urgentCareCost: 165 },
        { code: 'R51', desc: 'Headache', category: 'Non-Emergent', urgentCareCost: 120 },
        { code: 'J02.9', desc: 'Acute pharyngitis', category: 'Primary Care Treatable', urgentCareCost: 110 },
        { code: 'K30', desc: 'Dyspepsia', category: 'Non-Emergent', urgentCareCost: 140 }
    ];

    // Generate patient list
    const patients = [];
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee'];

    const numPatients = Math.min(avoidableCount, 25); // Show up to 25 patients

    for (let i = 0; i < numPatients; i++) {
        const condition = avoidableConditions[Math.floor(Math.random() * avoidableConditions.length)];
        const visitCost = costPerVisit + Math.floor(Math.random() * 400) - 200; // +/- $200 variance
        const savingsPotential = visitCost - condition.urgentCareCost;

        patients.push({
            id: `P${100000 + Math.floor(Math.random() * 900000)}`,
            firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
            lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
            dob: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${1940 + Math.floor(Math.random() * 50)}`,
            visitDate: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2024`,
            condition: condition,
            visitCost: visitCost,
            savingsPotential: savingsPotential,
            edFacility: ['Piedmont Atlanta ED', 'Piedmont Fayette ED', 'Piedmont Henry ED', 'Piedmont Newnan ED'][Math.floor(Math.random() * 4)],
            visitCount: Math.floor(Math.random() * 4) + 1
        });
    }

    // Sort by savings potential descending
    patients.sort((a, b) => b.savingsPotential - a.savingsPotential);

    const totalPatientSavings = patients.reduce((sum, p) => sum + p.savingsPotential, 0);

    let modalBody = `
        <h2>Patient Detail - Avoidable ED Visits</h2>
        <p class="provider-summary">${pcpName} | ${marketName} Market</p>

        <!-- Summary Stats -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">Patients Shown</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">${numPatients}</div>
                <div style="font-size: 0.7rem; color: #888;">of ${avoidableCount} total</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">Avg ED Cost</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #e74c3c;">$${costPerVisit.toLocaleString()}</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">Avg UC Cost</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #27ae60;">$150</div>
            </div>
            <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #155724; text-transform: uppercase;">Total Savings</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #155724;">$${totalPatientSavings.toLocaleString()}</div>
            </div>
        </div>

        <!-- Export Button -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1rem; color: #2c3e50;">
                <span style="margin-right: 0.5rem;">👥</span>Patient List (Exportable)
            </h3>
            <button class="btn-small" onclick="exportEDPatientList('${pcpId}', '${pcpName}', '${marketName}')" style="background: #27ae60;">
                📥 Export to CSV
            </button>
        </div>

        <!-- Patient Table -->
        <div style="background: white; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden;">
            <div style="overflow-x: auto; max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;" id="ed-patient-table">
                    <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 1;">
                        <tr>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient ID</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient Name</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">DOB</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Visit Date</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avoidable Condition</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Category</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">ED Cost</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">UC Cost</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Savings</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">ED Visits (12mo)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patients.map(p => `
                            <tr>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; font-family: monospace; font-size: 0.75rem;">${p.id}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.lastName}, ${p.firstName}</strong></td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">${p.dob}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">${p.visitDate}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee;">
                                    <span style="font-weight: 600;">${p.condition.code}</span> - ${p.condition.desc}
                                </td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">
                                    <span style="background: ${p.condition.category === 'Primary Care Treatable' ? '#d4edda' : p.condition.category === 'Urgent Care Appropriate' ? '#fff3cd' : '#e2e3e5'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">${p.condition.category}</span>
                                </td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: right; color: #e74c3c; font-weight: 600;">$${p.visitCost.toLocaleString()}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: right; color: #27ae60;">$${p.condition.urgentCareCost}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: right; background: #f0fff0; font-weight: 600; color: #155724;">$${p.savingsPotential.toLocaleString()}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center; ${p.visitCount >= 3 ? 'color: #e74c3c; font-weight: 700;' : ''}">${p.visitCount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Calculation Methodology -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 1.25rem; margin-top: 1.5rem; border: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #2c3e50;">
                <span style="margin-right: 0.5rem;">📋</span>Data Definitions & Calculations
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; font-size: 0.8rem; color: #5a6c7d;">
                <div>
                    <strong style="color: #2c3e50;">Avoidable Condition:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Diagnosis classified as avoidable per NYU ED Algorithm. Categories include: Primary Care Treatable (routine conditions), Urgent Care Appropriate (minor acute), Non-Emergent (could wait for appointment).</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">ED Cost (per visit):</strong>
                    <p style="margin: 0.25rem 0 0 0;">Total allowed amount = Facility fee (ED room, observation) + Professional fees (physician E/M, radiology reads, lab interpretation). Source: Claims data from CMS/payer files.</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Savings Potential:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Savings = ED Cost - Urgent Care Cost. UC costs based on Medicare fee schedule for equivalent CPT codes. Represents cost avoidance if visit occurred in appropriate lower-cost setting.</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Attribution:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Patients attributed to PCP based on plurality of E/M visits in 24-month lookback. ED visits assigned to attributed PCP regardless of referring provider.</p>
                </div>
            </div>
        </div>

        <div style="margin-top: 1rem; text-align: center;">
            <button class="btn-small" onclick="drillDownEDMarket('${marketId}')" style="background: #6c757d;">
                ← Back to ${marketName} Summary
            </button>
        </div>
    `;

    showModal(modalBody);
}

// Export ED patient list to CSV
function exportEDPatientList(pcpId, pcpName, marketName) {
    // Get table data
    const table = document.getElementById('ed-patient-table');
    if (!table) {
        alert('No patient data to export');
        return;
    }

    // Build CSV content
    let csv = 'Patient ID,Patient Name,DOB,Visit Date,ICD-10 Code,Avoidable Condition,Category,ED Cost,UC Cost,Savings Potential,ED Visits (12mo)\n';

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 10) {
            const patientId = cells[0].textContent.trim();
            const patientName = cells[1].textContent.trim();
            const dob = cells[2].textContent.trim();
            const visitDate = cells[3].textContent.trim();
            const conditionText = cells[4].textContent.trim();
            const icdCode = conditionText.split(' - ')[0];
            const conditionDesc = conditionText.split(' - ')[1] || '';
            const category = cells[5].textContent.trim();
            const edCost = cells[6].textContent.trim();
            const ucCost = cells[7].textContent.trim();
            const savings = cells[8].textContent.trim();
            const edVisits = cells[9].textContent.trim();

            csv += `"${patientId}","${patientName}","${dob}","${visitDate}","${icdCode}","${conditionDesc}","${category}","${edCost}","${ucCost}","${savings}","${edVisits}"\n`;
        }
    });

    // Add methodology footer
    csv += '\n\n"--- METHODOLOGY ---"\n';
    csv += '"Avoidable ED Visit Definition: ED visits classified as avoidable based on NYU ED Algorithm"\n';
    csv += '"ED Cost: Total allowed amount including facility fees + professional fees"\n';
    csv += '"Savings Potential: ED Cost - Urgent Care Cost (based on Medicare fee schedule)"\n';
    csv += `"Report Generated: ${new Date().toLocaleString()}"\n`;
    csv += `"Attributed PCP: ${pcpName}"\n`;
    csv += `"Market: ${marketName}"\n`;

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `avoidable_ed_patients_${pcpId}_${new Date().toISOString().split('T')[0]}.csv`;

    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function drillDownPCPLeakage(pcpId) {
    // Show Sankey diagram for this PCP
    createSankeyDiagram(pcpId);
}

// Global state for decomposition tree
let expandedNodes = new Set();

function createSankeyDiagram(pcpId) {
    const pcpData = {
        'martinez': {
            name: 'Dr. Martinez',
            totalOONSpend: 8123456,
            totalSpend: 14234887,
            // Multi-level decomposition data structure
            decomposition: {
                elective: {
                    spend: 5234567,
                    oon: 4123456,
                    serviceLinesData: {
                        cardiology: {
                            spend: 2456789,
                            oon: 1823456,
                            hospitals: {
                                'Emory Midtown': { spend: 1234567, oon: true, providers: ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'] },
                                'Piedmont Heart': { spend: 622222, oon: false, providers: ['Dr. Brown', 'Dr. Davis'] },
                                'Northside Cardio': { spend: 600000, oon: true, providers: ['Dr. Miller', 'Dr. Wilson'] }
                            }
                        },
                        orthopedics: {
                            spend: 1523678,
                            oon: 1234500,
                            hospitals: {
                                'Atlanta Orthopedic': { spend: 856789, oon: true, providers: ['Dr. Anderson', 'Dr. Thomas'] },
                                'Piedmont Ortho': { spend: 377389, oon: false, providers: ['Dr. Taylor'] },
                                'Resurgens Ortho': { spend: 289500, oon: true, providers: ['Dr. Martinez'] }
                            }
                        },
                        imaging: {
                            spend: 1254100,
                            oon: 1065500,
                            hospitals: {
                                'Peachtree Imaging': { spend: 734500, oon: true, providers: ['Reading Group A'] },
                                'Piedmont Imaging': { spend: 331000, oon: true, providers: ['Reading Group B'] },
                                'Internal Imaging': { spend: 188600, oon: false, providers: ['Internal'] }
                            }
                        }
                    }
                },
                nonElective: {
                    spend: 9000320,
                    oon: 4000000,
                    serviceLinesData: {
                        emergency: {
                            spend: 3234567,
                            oon: 1456789,
                            hospitals: {
                                'Piedmont ER': { spend: 1777778, oon: false, providers: ['ER Group'] },
                                'Northside ER': { spend: 1456789, oon: true, providers: ['ER Group'] }
                            }
                        },
                        inpatient: {
                            spend: 4123456,
                            oon: 1823456,
                            hospitals: {
                                'Piedmont Hospital': { spend: 2300000, oon: false, providers: ['Hospitalists'] },
                                'Emory University': { spend: 1823456, oon: true, providers: ['Specialists'] }
                            }
                        },
                        postAcute: {
                            spend: 1642297,
                            oon: 719755,
                            hospitals: {
                                'Piedmont SNF': { spend: 922542, oon: false, providers: ['SNF Group'] },
                                'Private SNF': { spend: 719755, oon: true, providers: ['Various'] }
                            }
                        }
                    }
                }
            }
        },
        'williams': {
            name: 'Dr. Williams',
            totalOONSpend: 6234500,
            totalSpend: 17892441,
            decomposition: {
                elective: {
                    spend: 6892441,
                    oon: 4123500,
                    serviceLinesData: {
                        imaging: {
                            spend: 2892441,
                            oon: 2456789,
                            hospitals: {
                                'Peachtree Imaging': { spend: 1892441, oon: true, providers: ['Reading Group A'] },
                                'Advanced Imaging': { spend: 564348, oon: true, providers: ['Reading Group C'] },
                                'Piedmont Imaging': { spend: 435652, oon: false, providers: ['Internal'] }
                            }
                        },
                        orthopedics: {
                            spend: 2500000,
                            oon: 1666711,
                            hospitals: {
                                'Southern Ortho': { spend: 1666711, oon: true, providers: ['Dr. Lee', 'Dr. Garcia'] },
                                'Piedmont Ortho': { spend: 833289, oon: false, providers: ['Dr. Moore'] }
                            }
                        },
                        cardiology: {
                            spend: 1500000,
                            oon: 0,
                            hospitals: {
                                'Piedmont Heart': { spend: 1500000, oon: false, providers: ['Dr. Chen', 'Dr. Brown'] }
                            }
                        }
                    }
                },
                nonElective: {
                    spend: 11000000,
                    oon: 2111000,
                    serviceLinesData: {
                        emergency: { spend: 4234000, oon: 1234000, hospitals: { 'Piedmont ER': { spend: 3000000, oon: false, providers: ['ER Group'] }, 'External ER': { spend: 1234000, oon: true, providers: ['ER Group'] } } },
                        inpatient: { spend: 5234000, oon: 877000, hospitals: { 'Piedmont Hospital': { spend: 4357000, oon: false, providers: ['Hospitalists'] }, 'External Hospital': { spend: 877000, oon: true, providers: ['Specialists'] } } },
                        postAcute: { spend: 1532000, oon: 0, hospitals: { 'Piedmont SNF': { spend: 1532000, oon: false, providers: ['SNF Group'] } } }
                    }
                }
            }
        },
        'chen': {
            name: 'Dr. Chen',
            totalOONSpend: 4567890,
            totalSpend: 12345678,
            decomposition: {
                elective: {
                    spend: 4567890,
                    oon: 2345678,
                    serviceLinesData: {
                        cardiology: {
                            spend: 1823456,
                            oon: 912345,
                            hospitals: {
                                'Piedmont Heart': { spend: 911111, oon: false, providers: ['Dr. Adams', 'Dr. Clark'] },
                                'Northside Cardio': { spend: 567890, oon: true, providers: ['Dr. Nelson'] },
                                'Emory Heart': { spend: 344455, oon: true, providers: ['Dr. King'] }
                            }
                        },
                        imaging: {
                            spend: 1456789,
                            oon: 823456,
                            hospitals: {
                                'Peachtree Imaging': { spend: 823456, oon: true, providers: ['Reading Group A'] },
                                'Piedmont Imaging': { spend: 633333, oon: false, providers: ['Internal'] }
                            }
                        },
                        orthopedics: {
                            spend: 1287645,
                            oon: 609877,
                            hospitals: {
                                'Atlanta Orthopedic': { spend: 609877, oon: true, providers: ['Dr. Wright'] },
                                'Piedmont Ortho': { spend: 677768, oon: false, providers: ['Dr. Hill'] }
                            }
                        }
                    }
                },
                nonElective: {
                    spend: 7777788,
                    oon: 2222212,
                    serviceLinesData: {
                        emergency: { spend: 2888888, oon: 888888, hospitals: { 'Piedmont ER': { spend: 2000000, oon: false, providers: ['ER Group'] }, 'Northside ER': { spend: 888888, oon: true, providers: ['ER Group'] } } },
                        inpatient: { spend: 3456900, oon: 1111111, hospitals: { 'Piedmont Hospital': { spend: 2345789, oon: false, providers: ['Hospitalists'] }, 'Emory University': { spend: 1111111, oon: true, providers: ['Specialists'] } } },
                        postAcute: { spend: 1432000, oon: 222213, hospitals: { 'Piedmont SNF': { spend: 1209787, oon: false, providers: ['SNF Group'] }, 'External SNF': { spend: 222213, oon: true, providers: ['Various'] } } }
                    }
                }
            }
        },
        'thompson': {
            name: 'Dr. Thompson',
            totalOONSpend: 5234567,
            totalSpend: 13456789,
            decomposition: {
                elective: {
                    spend: 5234567,
                    oon: 2987654,
                    serviceLinesData: {
                        orthopedics: {
                            spend: 2123456,
                            oon: 1456789,
                            hospitals: {
                                'Atlanta Orthopedic': { spend: 987654, oon: true, providers: ['Dr. Baker', 'Dr. Scott'] },
                                'Resurgens Ortho': { spend: 469135, oon: true, providers: ['Dr. Green'] },
                                'Piedmont Ortho': { spend: 666667, oon: false, providers: ['Dr. Young'] }
                            }
                        },
                        cardiology: {
                            spend: 1678901,
                            oon: 876543,
                            hospitals: {
                                'Emory Midtown': { spend: 876543, oon: true, providers: ['Dr. Hall', 'Dr. Allen'] },
                                'Piedmont Heart': { spend: 802358, oon: false, providers: ['Dr. Robinson'] }
                            }
                        },
                        imaging: {
                            spend: 1432210,
                            oon: 654322,
                            hospitals: {
                                'Peachtree Imaging': { spend: 654322, oon: true, providers: ['Reading Group B'] },
                                'Piedmont Imaging': { spend: 777888, oon: false, providers: ['Internal'] }
                            }
                        }
                    }
                },
                nonElective: {
                    spend: 8222222,
                    oon: 2246913,
                    serviceLinesData: {
                        emergency: { spend: 3111111, oon: 911111, hospitals: { 'Piedmont ER': { spend: 2200000, oon: false, providers: ['ER Group'] }, 'External ER': { spend: 911111, oon: true, providers: ['ER Group'] } } },
                        inpatient: { spend: 3789012, oon: 1123456, hospitals: { 'Piedmont Hospital': { spend: 2665556, oon: false, providers: ['Hospitalists'] }, 'Northside Hospital': { spend: 1123456, oon: true, providers: ['Specialists'] } } },
                        postAcute: { spend: 1322099, oon: 212346, hospitals: { 'Piedmont SNF': { spend: 1109753, oon: false, providers: ['SNF Group'] }, 'Private SNF': { spend: 212346, oon: true, providers: ['Various'] } } }
                    }
                }
            }
        },
        'patel': {
            name: 'Dr. Patel',
            totalOONSpend: 3987654,
            totalSpend: 11234567,
            decomposition: {
                elective: {
                    spend: 4123456,
                    oon: 1876543,
                    serviceLinesData: {
                        imaging: {
                            spend: 1654321,
                            oon: 987654,
                            hospitals: {
                                'Advanced Imaging': { spend: 654321, oon: true, providers: ['Reading Group C'] },
                                'Peachtree Imaging': { spend: 333333, oon: true, providers: ['Reading Group A'] },
                                'Piedmont Imaging': { spend: 666667, oon: false, providers: ['Internal'] }
                            }
                        },
                        cardiology: {
                            spend: 1345678,
                            oon: 543210,
                            hospitals: {
                                'Northside Cardio': { spend: 543210, oon: true, providers: ['Dr. White'] },
                                'Piedmont Heart': { spend: 802468, oon: false, providers: ['Dr. Lewis', 'Dr. Walker'] }
                            }
                        },
                        orthopedics: {
                            spend: 1123457,
                            oon: 345679,
                            hospitals: {
                                'Southern Ortho': { spend: 345679, oon: true, providers: ['Dr. Harris'] },
                                'Piedmont Ortho': { spend: 777778, oon: false, providers: ['Dr. Martin'] }
                            }
                        }
                    }
                },
                nonElective: {
                    spend: 7111111,
                    oon: 2111111,
                    serviceLinesData: {
                        emergency: { spend: 2666666, oon: 777777, hospitals: { 'Piedmont ER': { spend: 1888889, oon: false, providers: ['ER Group'] }, 'External ER': { spend: 777777, oon: true, providers: ['ER Group'] } } },
                        inpatient: { spend: 3222222, oon: 1111111, hospitals: { 'Piedmont Hospital': { spend: 2111111, oon: false, providers: ['Hospitalists'] }, 'Emory University': { spend: 1111111, oon: true, providers: ['Specialists'] } } },
                        postAcute: { spend: 1222223, oon: 222223, hospitals: { 'Piedmont SNF': { spend: 1000000, oon: false, providers: ['SNF Group'] }, 'External SNF': { spend: 222223, oon: true, providers: ['Various'] } } }
                    }
                }
            }
        }
    };

    const data = pcpData[pcpId];
    if (!data) {
        // Fallback for unknown PCPs - show message in modal instead of alert
        showModal(`
            <h2>Referral Flow Analysis</h2>
            <p style="color: #7f8c8d; margin: 2rem 0;">Detailed decomposition data is not yet available for this provider. Please select Dr. Martinez, Dr. Williams, Dr. Chen, Dr. Thompson, or Dr. Patel to view the interactive referral flow analysis.</p>
        `);
        return;
    }

    // Reset expanded nodes
    expandedNodes = new Set();

    let modalBody = `
        <h2>Interactive Referral Flow - ${data.name}</h2>
        <p class="sankey-description">Click on any node to expand and drill down into the next level. Flow visualization shows spend distribution from PCP through elective/non-elective, service lines, hospitals, and rendering providers.</p>

        <div class="sankey-controls" style="margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center;">
            <button class="btn-small" onclick="expandAllSankeyNodes()">Expand All</button>
            <button class="btn-small" onclick="collapseAllSankeyNodes()">Collapse All</button>
            <span style="color: #7f8c8d;">Total OON: <strong style="color: #e74c3c;">$${(data.totalOONSpend / 1000000).toFixed(2)}M</strong> (${((data.totalOONSpend / data.totalSpend) * 100).toFixed(1)}%)</span>
        </div>

        <div id="modal-sankey-diagram" style="width: 100%; min-height: 600px; background: #f8f9fa; border-radius: 8px; padding: 2rem; overflow-x: auto;"></div>

        <div class="sankey-legend" style="margin-top: 1rem; display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;">
            <div><span style="display: inline-block; width: 20px; height: 12px; background: #667eea; margin-right: 8px;"></span>PCP (Click to expand)</div>
            <div><span style="display: inline-block; width: 20px; height: 12px; background: #27ae60; margin-right: 8px;"></span>In-Network</div>
            <div><span style="display: inline-block; width: 20px; height: 12px; background: #e74c3c; margin-right: 8px;"></span>Out-of-Network</div>
            <div><span style="display: inline-block; width: 20px; height: 12px; background: #f39c12; margin-right: 8px;"></span>Mixed/Elective</div>
            <div><span style="display: inline-block; width: 20px; height: 12px; background: #9b59b6; margin-right: 8px;"></span>Non-Elective</div>
        </div>

        <style>
            .sankey-description { color: #7f8c8d; font-size: 0.95rem; margin-bottom: 1.5rem; }
            .sankey-node { cursor: pointer; transition: all 0.3s; }
            .sankey-node:hover { filter: brightness(1.1); }
            .expand-indicator { font-size: 14px; font-weight: bold; }
        </style>
    `;

    showModal(modalBody);

    // Draw interactive decomposition tree after modal is visible
    setTimeout(() => {
        window.currentSankeyData = data;
        window.currentSankeyPCP = data.name;
        drawDecompositionTree(data);
    }, 100);
}

function drawDecompositionTree(data) {
    const container = document.getElementById('modal-sankey-diagram');
    if (!container) return;

    const minWidth = 1400; // Wide enough for 5 levels
    const width = Math.max(container.clientWidth - 64, minWidth);
    const height = 800;

    const svg = d3.select('#modal-sankey-diagram')
        .html('')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Define column positions for 5 levels
    const levelX = {
        pcp: 50,
        category: 280,
        serviceLine: 480,
        hospital: 720,
        provider: 980
    };

    const nodeWidth = 180;
    const levelGap = 50;

    // Level 1: PCP node
    const pcpGroup = svg.append('g')
        .attr('class', 'sankey-node')
        .attr('data-level', 'pcp')
        .attr('data-id', 'pcp-root')
        .on('click', function() {
            toggleNode('pcp-root');
        });

    pcpGroup.append('rect')
        .attr('x', levelX.pcp)
        .attr('y', height / 2 - 50)
        .attr('width', nodeWidth)
        .attr('height', 100)
        .attr('fill', '#667eea')
        .attr('rx', 8)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3);

    pcpGroup.append('text')
        .attr('x', levelX.pcp + nodeWidth / 2)
        .attr('y', height / 2 - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .text(data.name);

    pcpGroup.append('text')
        .attr('x', levelX.pcp + nodeWidth / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .text(`Total: $${(data.totalSpend / 1000000).toFixed(2)}M`);

    pcpGroup.append('text')
        .attr('x', levelX.pcp + nodeWidth / 2)
        .attr('y', height / 2 + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .text(`OON: $${(data.totalOONSpend / 1000000).toFixed(2)}M`);

    pcpGroup.append('text')
        .attr('x', levelX.pcp + nodeWidth / 2)
        .attr('y', height / 2 + 40)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '16px')
        .attr('class', 'expand-indicator')
        .text('▶ Click to expand');

    // Store data and render function globally for interactivity
    window.sankeyRenderTree = () => renderExpandedTree(svg, data, levelX, nodeWidth, height);
}

function renderExpandedTree(svg, data, levelX, nodeWidth, height) {
    // Clear previous rendering except PCP node
    svg.selectAll('g:not([data-id="pcp-root"]), path.flow-line').remove();

    if (!expandedNodes.has('pcp-root')) return;

    const decomp = data.decomposition;
    const pcpY = height / 2;

    // Level 2: Elective vs Non-Elective
    const categories = [
        { id: 'elective', name: 'Elective', data: decomp.elective, color: '#f39c12', yOffset: -200 },
        { id: 'nonElective', name: 'Non-Elective', data: decomp.nonElective, color: '#9b59b6', yOffset: 100 }
    ];

    categories.forEach(cat => {
        const catY = pcpY + cat.yOffset;
        const oonPct = ((cat.data.oon / cat.data.spend) * 100).toFixed(1);

        // Draw flow line from PCP to category
        svg.append('path')
            .attr('class', 'flow-line')
            .attr('d', `M ${levelX.pcp + nodeWidth} ${pcpY} Q ${(levelX.pcp + nodeWidth + levelX.category) / 2} ${(pcpY + catY) / 2} ${levelX.category} ${catY}`)
            .attr('stroke', cat.color)
            .attr('stroke-width', (cat.data.spend / data.totalSpend) * 100 + 10)
            .attr('fill', 'none')
            .attr('opacity', 0.4);

        const catGroup = svg.append('g')
            .attr('class', 'sankey-node')
            .attr('data-level', 'category')
            .attr('data-id', cat.id)
            .on('click', function() {
                toggleNode(cat.id);
            });

        catGroup.append('rect')
            .attr('x', levelX.category)
            .attr('y', catY - 45)
            .attr('width', nodeWidth)
            .attr('height', 90)
            .attr('fill', cat.color)
            .attr('rx', 8)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        catGroup.append('text')
            .attr('x', levelX.category + nodeWidth / 2)
            .attr('y', catY - 20)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .text(cat.name);

        catGroup.append('text')
            .attr('x', levelX.category + nodeWidth / 2)
            .attr('y', catY)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .text(`$${(cat.data.spend / 1000000).toFixed(2)}M`);

        catGroup.append('text')
            .attr('x', levelX.category + nodeWidth / 2)
            .attr('y', catY + 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-size', '10px')
            .text(`OON: ${oonPct}%`);

        catGroup.append('text')
            .attr('x', levelX.category + nodeWidth / 2)
            .attr('y', catY + 32)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '14px')
            .attr('class', 'expand-indicator')
            .text(expandedNodes.has(cat.id) ? '▼' : '▶');

        // If expanded, show service lines
        if (expandedNodes.has(cat.id)) {
            renderServiceLines(svg, cat, catY, levelX, nodeWidth, data.totalSpend);
        }
    });
}

function renderServiceLines(svg, category, parentY, levelX, nodeWidth, totalSpend) {
    const serviceLines = Object.keys(category.data.serviceLinesData);
    const slHeight = 70;
    const slGap = 15;
    const totalHeight = serviceLines.length * (slHeight + slGap) - slGap;
    let slY = parentY - totalHeight / 2;

    serviceLines.forEach((slKey, idx) => {
        const slData = category.data.serviceLinesData[slKey];
        const oonPct = ((slData.oon / slData.spend) * 100).toFixed(1);
        const slColor = slData.oon / slData.spend > 0.5 ? '#e74c3c' : slData.oon / slData.spend > 0.2 ? '#f39c12' : '#27ae60';
        const slId = `${category.id}-${slKey}`;

        // Draw flow line
        svg.append('path')
            .attr('class', 'flow-line')
            .attr('d', `M ${levelX.category + nodeWidth} ${parentY} Q ${(levelX.category + nodeWidth + levelX.serviceLine) / 2} ${(parentY + slY) / 2} ${levelX.serviceLine} ${slY}`)
            .attr('stroke', slColor)
            .attr('stroke-width', (slData.spend / totalSpend) * 80 + 5)
            .attr('fill', 'none')
            .attr('opacity', 0.3);

        const slGroup = svg.append('g')
            .attr('class', 'sankey-node')
            .attr('data-level', 'serviceLine')
            .attr('data-id', slId)
            .on('click', function() {
                toggleNode(slId);
            });

        slGroup.append('rect')
            .attr('x', levelX.serviceLine)
            .attr('y', slY - slHeight / 2)
            .attr('width', nodeWidth)
            .attr('height', slHeight)
            .attr('fill', slColor)
            .attr('rx', 6)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        slGroup.append('text')
            .attr('x', levelX.serviceLine + nodeWidth / 2)
            .attr('y', slY - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '12px')
            .text(slKey.charAt(0).toUpperCase() + slKey.slice(1));

        slGroup.append('text')
            .attr('x', levelX.serviceLine + nodeWidth / 2)
            .attr('y', slY + 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .text(`$${(slData.spend / 1000000).toFixed(2)}M | ${oonPct}% OON`);

        slGroup.append('text')
            .attr('x', levelX.serviceLine + nodeWidth / 2)
            .attr('y', slY + 20)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '12px')
            .attr('class', 'expand-indicator')
            .text(expandedNodes.has(slId) ? '▼' : '▶');

        // If expanded, show hospitals
        if (expandedNodes.has(slId)) {
            renderHospitals(svg, slData, slY, levelX, nodeWidth, totalSpend, slId);
        }

        slY += slHeight + slGap;
    });
}

function renderHospitals(svg, serviceLineData, parentY, levelX, nodeWidth, totalSpend, parentId) {
    const hospitals = Object.keys(serviceLineData.hospitals);
    const hospHeight = 60;
    const hospGap = 10;
    const totalHeight = hospitals.length * (hospHeight + hospGap) - hospGap;
    let hospY = parentY - totalHeight / 2;

    hospitals.forEach((hospKey, idx) => {
        const hospData = serviceLineData.hospitals[hospKey];
        const hospColor = hospData.oon ? '#e74c3c' : '#27ae60';
        const hospId = `${parentId}-${hospKey.replace(/\s+/g, '-')}`;

        // Draw flow line
        svg.append('path')
            .attr('class', 'flow-line')
            .attr('d', `M ${levelX.serviceLine + nodeWidth} ${parentY} Q ${(levelX.serviceLine + nodeWidth + levelX.hospital) / 2} ${(parentY + hospY) / 2} ${levelX.hospital} ${hospY}`)
            .attr('stroke', hospColor)
            .attr('stroke-width', (hospData.spend / totalSpend) * 60 + 3)
            .attr('fill', 'none')
            .attr('opacity', 0.3);

        const hospGroup = svg.append('g')
            .attr('class', 'sankey-node')
            .attr('data-level', 'hospital')
            .attr('data-id', hospId)
            .on('click', function() {
                toggleNode(hospId);
            });

        hospGroup.append('rect')
            .attr('x', levelX.hospital)
            .attr('y', hospY - hospHeight / 2)
            .attr('width', nodeWidth)
            .attr('height', hospHeight)
            .attr('fill', hospColor)
            .attr('rx', 6)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        hospGroup.append('text')
            .attr('x', levelX.hospital + nodeWidth / 2)
            .attr('y', hospY - 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '11px')
            .text(hospKey);

        hospGroup.append('text')
            .attr('x', levelX.hospital + nodeWidth / 2)
            .attr('y', hospY + 10)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '9px')
            .text(`$${(hospData.spend / 1000000).toFixed(2)}M${hospData.oon ? ' (OON)' : ' (IN)'}`);

        hospGroup.append('text')
            .attr('x', levelX.hospital + nodeWidth / 2)
            .attr('y', hospY + 24)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '12px')
            .attr('class', 'expand-indicator')
            .text(expandedNodes.has(hospId) ? '▼' : '▶');

        // If expanded, show providers
        if (expandedNodes.has(hospId)) {
            renderProviders(svg, hospData, hospY, levelX, nodeWidth, totalSpend, hospColor);
        }

        hospY += hospHeight + hospGap;
    });
}

function renderProviders(svg, hospitalData, parentY, levelX, nodeWidth, totalSpend, parentColor) {
    const providers = hospitalData.providers;
    const provHeight = 40;
    const provGap = 8;
    const totalHeight = providers.length * (provHeight + provGap) - provGap;
    let provY = parentY - totalHeight / 2;
    const provSpend = hospitalData.spend / providers.length; // Distribute equally

    providers.forEach((provider, idx) => {
        // Draw flow line
        svg.append('path')
            .attr('class', 'flow-line')
            .attr('d', `M ${levelX.hospital + nodeWidth} ${parentY} Q ${(levelX.hospital + nodeWidth + levelX.provider) / 2} ${(parentY + provY) / 2} ${levelX.provider} ${provY}`)
            .attr('stroke', parentColor)
            .attr('stroke-width', (provSpend / totalSpend) * 40 + 2)
            .attr('fill', 'none')
            .attr('opacity', 0.3);

        const provGroup = svg.append('g')
            .attr('class', 'sankey-node');

        provGroup.append('rect')
            .attr('x', levelX.provider)
            .attr('y', provY - provHeight / 2)
            .attr('width', nodeWidth * 0.9)
            .attr('height', provHeight)
            .attr('fill', parentColor)
            .attr('rx', 5)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

        provGroup.append('text')
            .attr('x', levelX.provider + (nodeWidth * 0.9) / 2)
            .attr('y', provY)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .text(provider);

        provGroup.append('text')
            .attr('x', levelX.provider + (nodeWidth * 0.9) / 2)
            .attr('y', provY + 13)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-size', '9px')
            .text(`$${(provSpend / 1000000).toFixed(2)}M`);

        provY += provHeight + provGap;
    });
}

function toggleNode(nodeId) {
    if (expandedNodes.has(nodeId)) {
        // Collapse: remove this node and all descendants
        expandedNodes.delete(nodeId);
        // Remove any child nodes that start with this nodeId
        expandedNodes.forEach(id => {
            if (id.startsWith(nodeId + '-')) {
                expandedNodes.delete(id);
            }
        });
    } else {
        expandedNodes.add(nodeId);
    }

    if (window.sankeyRenderTree) {
        window.sankeyRenderTree();
    }
}

function expandAllSankeyNodes() {
    if (!window.currentSankeyData) return;

    expandedNodes.clear();
    expandedNodes.add('pcp-root');
    expandedNodes.add('elective');
    expandedNodes.add('nonElective');

    const data = window.currentSankeyData;

    // Expand all service lines
    ['elective', 'nonElective'].forEach(cat => {
        Object.keys(data.decomposition[cat].serviceLinesData).forEach(sl => {
            const slId = `${cat}-${sl}`;
            expandedNodes.add(slId);

            // Expand all hospitals
            Object.keys(data.decomposition[cat].serviceLinesData[sl].hospitals).forEach(hosp => {
                const hospId = `${slId}-${hosp.replace(/\s+/g, '-')}`;
                expandedNodes.add(hospId);
            });
        });
    });

    if (window.sankeyRenderTree) {
        window.sankeyRenderTree();
    }
}

function collapseAllSankeyNodes() {
    expandedNodes.clear();

    if (window.sankeyRenderTree) {
        window.sankeyRenderTree();
    }
}

function drillDownHCC(providerId) {
    // Provider-specific data
    const providerData = {
        'johnson': {
            name: 'Dr. Sarah Johnson',
            specialty: 'Internal Medicine',
            market: 'Atlanta North',
            panelSize: 1847,
            avgRAF: 1.189,
            patients: [
                { mrn: 'MRN384729', firstName: 'Robert', lastName: 'Williams', age: 72, awvCompleted: true, awvDate: '2024-08-15', openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-22', rafCurrent: 2.84, rafPotential: 3.12, revenueOpp: 3280 },
                { mrn: 'MRN291847', firstName: 'Mary', lastName: 'Thompson', age: 68, awvCompleted: false, awvDate: null, openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)', 'HCC 111 (COPD)'], nextAppt: '2024-12-05', rafCurrent: 1.92, rafPotential: 2.45, revenueOpp: 6201 },
                { mrn: 'MRN573921', firstName: 'James', lastName: 'Davis', age: 75, awvCompleted: true, awvDate: '2024-09-03', openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-11-18', rafCurrent: 3.15, rafPotential: 3.48, revenueOpp: 3861 },
                { mrn: 'MRN684012', firstName: 'Patricia', lastName: 'Garcia', age: 70, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 59 (Major Depression)'], nextAppt: 'Not scheduled', rafCurrent: 1.67, rafPotential: 2.34, revenueOpp: 7839 },
                { mrn: 'MRN492847', firstName: 'Linda', lastName: 'Martinez', age: 66, awvCompleted: true, awvDate: '2024-07-22', openHCCs: ['HCC 18 (Diabetes)', 'HCC 23 (Obesity)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-29', rafCurrent: 1.82, rafPotential: 2.08, revenueOpp: 3042 }
            ]
        },
        'anderson': {
            name: 'Dr. Michael Anderson',
            specialty: 'Family Medicine',
            market: 'Atlanta South',
            panelSize: 1923,
            avgRAF: 1.256,
            patients: [
                { mrn: 'MRN782341', firstName: 'Dorothy', lastName: 'Clark', age: 74, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 18 (Diabetes)'], nextAppt: '2024-11-30', rafCurrent: 2.12, rafPotential: 2.89, revenueOpp: 9009 },
                { mrn: 'MRN293847', firstName: 'William', lastName: 'Harris', age: 69, awvCompleted: true, awvDate: '2024-06-18', openHCCs: ['HCC 18 (Diabetes)', 'HCC 108 (Vascular Disease)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-12-12', rafCurrent: 2.45, rafPotential: 2.92, revenueOpp: 5499 },
                { mrn: 'MRN847291', firstName: 'Helen', lastName: 'Robinson', age: 77, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 59 (Major Depression)', 'HCC 19 (Diabetes with complications)'], nextAppt: 'Not scheduled', rafCurrent: 1.78, rafPotential: 2.56, revenueOpp: 9126 },
                { mrn: 'MRN192847', firstName: 'Richard', lastName: 'Lewis', age: 71, awvCompleted: true, awvDate: '2024-09-22', openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-11-15', rafCurrent: 3.02, rafPotential: 3.35, revenueOpp: 3861 }
            ]
        },
        'brown': {
            name: 'Dr. Jennifer Brown',
            specialty: 'Internal Medicine',
            market: 'Columbus',
            panelSize: 1654,
            avgRAF: 1.178,
            patients: [
                { mrn: 'MRN647382', firstName: 'Barbara', lastName: 'Walker', age: 73, awvCompleted: true, awvDate: '2024-07-11', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-02', rafCurrent: 1.56, rafPotential: 1.92, revenueOpp: 4212 },
                { mrn: 'MRN847192', firstName: 'Thomas', lastName: 'Hall', age: 67, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-28', rafCurrent: 1.89, rafPotential: 2.23, revenueOpp: 3978 },
                { mrn: 'MRN293817', firstName: 'Susan', lastName: 'Young', age: 70, awvCompleted: true, awvDate: '2024-08-05', openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-12-18', rafCurrent: 2.34, rafPotential: 2.67, revenueOpp: 3861 },
                { mrn: 'MRN819273', firstName: 'Charles', lastName: 'King', age: 76, awvCompleted: false, awvDate: null, openHCCs: ['HCC 18 (Diabetes)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 88 (Arrhythmia)'], nextAppt: 'Not scheduled', rafCurrent: 2.67, rafPotential: 3.45, revenueOpp: 9126 }
            ]
        },
        'patel': {
            name: 'Dr. Raj Patel',
            specialty: 'Internal Medicine',
            market: 'Augusta',
            panelSize: 1567,
            avgRAF: 1.412,
            patients: [
                { mrn: 'MRN928374', firstName: 'Margaret', lastName: 'Adams', age: 78, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 18 (Diabetes)', 'HCC 108 (Vascular Disease)'], nextAppt: '2024-11-20', rafCurrent: 2.89, rafPotential: 3.67, revenueOpp: 9126 },
                { mrn: 'MRN192384', firstName: 'George', lastName: 'Nelson', age: 81, awvCompleted: true, awvDate: '2024-05-22', openHCCs: ['HCC 18 (Diabetes)', 'HCC 85 (CHF)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-12-08', rafCurrent: 3.12, rafPotential: 3.45, revenueOpp: 3861 },
                { mrn: 'MRN847293', firstName: 'Ruth', lastName: 'Hill', age: 75, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 19 (Diabetes with complications)'], nextAppt: 'Not scheduled', rafCurrent: 1.98, rafPotential: 2.89, revenueOpp: 10647 }
            ]
        },
        'kim': {
            name: 'Dr. Susan Kim',
            specialty: 'Family Medicine',
            market: 'Atlanta North',
            panelSize: 1432,
            avgRAF: 1.145,
            patients: [
                { mrn: 'MRN384721', firstName: 'Paul', lastName: 'Moore', age: 69, awvCompleted: true, awvDate: '2024-08-30', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-25', rafCurrent: 1.45, rafPotential: 1.81, revenueOpp: 4212 },
                { mrn: 'MRN927384', firstName: 'Nancy', lastName: 'Taylor', age: 72, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 108 (Vascular Disease)'], nextAppt: '2024-12-15', rafCurrent: 2.01, rafPotential: 2.78, revenueOpp: 9009 },
                { mrn: 'MRN182937', firstName: 'Edward', lastName: 'Thomas', age: 66, awvCompleted: true, awvDate: '2024-07-18', openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-11-19', rafCurrent: 1.67, rafPotential: 2.00, revenueOpp: 3861 }
            ]
        },
        'rodriguez': {
            name: 'Dr. Carlos Rodriguez',
            specialty: 'Internal Medicine',
            market: 'Macon',
            panelSize: 1298,
            avgRAF: 1.387,
            patients: [
                { mrn: 'MRN738291', firstName: 'Betty', lastName: 'Jackson', age: 79, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 88 (Arrhythmia)'], nextAppt: '2024-11-27', rafCurrent: 3.01, rafPotential: 3.89, revenueOpp: 10296 },
                { mrn: 'MRN291837', firstName: 'Kenneth', lastName: 'White', age: 74, awvCompleted: true, awvDate: '2024-06-25', openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-12-20', rafCurrent: 2.23, rafPotential: 2.70, revenueOpp: 5499 }
            ]
        },
        'wilson': {
            name: 'Dr. Emily Wilson',
            specialty: 'Family Medicine',
            market: 'Atlanta South',
            panelSize: 1756,
            avgRAF: 1.098,
            patients: [
                { mrn: 'MRN472839', firstName: 'Donald', lastName: 'Harris', age: 68, awvCompleted: true, awvDate: '2024-09-12', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-05', rafCurrent: 1.34, rafPotential: 1.70, revenueOpp: 4212 },
                { mrn: 'MRN839271', firstName: 'Carol', lastName: 'Martin', age: 71, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-22', rafCurrent: 1.78, rafPotential: 2.12, revenueOpp: 3978 },
                { mrn: 'MRN192738', firstName: 'Steven', lastName: 'Lee', age: 65, awvCompleted: true, awvDate: '2024-08-20', openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-12-18', rafCurrent: 2.12, rafPotential: 2.45, revenueOpp: 3861 }
            ]
        },
        'chen': {
            name: 'Dr. David Chen',
            specialty: 'Internal Medicine',
            market: 'Columbus',
            panelSize: 1189,
            avgRAF: 1.356,
            patients: [
                { mrn: 'MRN629384', firstName: 'Sandra', lastName: 'Wright', age: 76, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 18 (Diabetes)', 'HCC 59 (Major Depression)'], nextAppt: 'Not scheduled', rafCurrent: 2.56, rafPotential: 3.45, revenueOpp: 10413 },
                { mrn: 'MRN193847', firstName: 'Anthony', lastName: 'Lopez', age: 73, awvCompleted: true, awvDate: '2024-07-02', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-11-30', rafCurrent: 1.89, rafPotential: 2.36, revenueOpp: 5499 }
            ]
        },
        'martinez': {
            name: 'Dr. Maria Martinez',
            specialty: 'Family Medicine',
            market: 'Augusta',
            panelSize: 1345,
            avgRAF: 1.234,
            patients: [
                { mrn: 'MRN847293', firstName: 'Kimberly', lastName: 'Scott', age: 67, awvCompleted: true, awvDate: '2024-09-05', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)', 'HCC 108 (Vascular Disease)'], nextAppt: '2024-12-10', rafCurrent: 1.67, rafPotential: 2.34, revenueOpp: 7839 },
                { mrn: 'MRN293847', firstName: 'Mark', lastName: 'Green', age: 70, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-11-28', rafCurrent: 2.01, rafPotential: 2.48, revenueOpp: 5499 }
            ]
        },
        'thompson': {
            name: 'Dr. James Thompson',
            specialty: 'Internal Medicine',
            market: 'Atlanta North',
            panelSize: 1456,
            avgRAF: 1.067,
            patients: [
                { mrn: 'MRN572839', firstName: 'Lisa', lastName: 'Baker', age: 64, awvCompleted: true, awvDate: '2024-08-15', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-20', rafCurrent: 1.23, rafPotential: 1.59, revenueOpp: 4212 },
                { mrn: 'MRN839472', firstName: 'Daniel', lastName: 'Gonzalez', age: 69, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 111 (COPD)'], nextAppt: '2024-12-02', rafCurrent: 1.89, rafPotential: 2.34, revenueOpp: 5265 }
            ]
        },
        'nguyen': {
            name: 'Dr. Lisa Nguyen',
            specialty: 'Family Medicine',
            market: 'Macon',
            panelSize: 987,
            avgRAF: 1.423,
            patients: [
                { mrn: 'MRN638291', firstName: 'Michelle', lastName: 'Carter', age: 77, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 108 (Vascular Disease)'], nextAppt: 'Not scheduled', rafCurrent: 2.78, rafPotential: 3.67, revenueOpp: 10413 },
                { mrn: 'MRN192847', firstName: 'Robert', lastName: 'Mitchell', age: 80, awvCompleted: true, awvDate: '2024-06-10', openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-11-25', rafCurrent: 2.34, rafPotential: 2.81, revenueOpp: 5499 }
            ]
        },
        'jackson': {
            name: 'Dr. Robert Jackson',
            specialty: 'Internal Medicine',
            market: 'Atlanta South',
            panelSize: 1234,
            avgRAF: 1.156,
            patients: [
                { mrn: 'MRN473829', firstName: 'Jennifer', lastName: 'Perez', age: 66, awvCompleted: true, awvDate: '2024-09-18', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-12-08', rafCurrent: 1.45, rafPotential: 1.79, revenueOpp: 3978 },
                { mrn: 'MRN829374', firstName: 'Christopher', lastName: 'Roberts', age: 72, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-11-30', rafCurrent: 2.12, rafPotential: 2.45, revenueOpp: 3861 }
            ]
        },
        'lee': {
            name: 'Dr. Michelle Lee',
            specialty: 'Family Medicine',
            market: 'Columbus',
            panelSize: 1098,
            avgRAF: 1.089,
            patients: [
                { mrn: 'MRN582937', firstName: 'Jessica', lastName: 'Turner', age: 63, awvCompleted: true, awvDate: '2024-08-22', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-18', rafCurrent: 1.12, rafPotential: 1.48, revenueOpp: 4212 },
                { mrn: 'MRN738492', firstName: 'Matthew', lastName: 'Phillips', age: 68, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-12-12', rafCurrent: 1.78, rafPotential: 2.25, revenueOpp: 5499 }
            ]
        },
        'garcia': {
            name: 'Dr. Anthony Garcia',
            specialty: 'Internal Medicine',
            market: 'Augusta',
            panelSize: 876,
            avgRAF: 1.478,
            patients: [
                { mrn: 'MRN839274', firstName: 'Amanda', lastName: 'Campbell', age: 79, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 88 (Arrhythmia)', 'HCC 59 (Major Depression)'], nextAppt: 'Not scheduled', rafCurrent: 3.23, rafPotential: 4.12, revenueOpp: 10413 },
                { mrn: 'MRN192837', firstName: 'Joshua', lastName: 'Parker', age: 82, awvCompleted: true, awvDate: '2024-05-15', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-22', rafCurrent: 1.89, rafPotential: 2.23, revenueOpp: 3978 }
            ]
        },
        'white': {
            name: 'Dr. Patricia White',
            specialty: 'Family Medicine',
            market: 'Atlanta North',
            panelSize: 1567,
            avgRAF: 1.012,
            patients: [
                { mrn: 'MRN472839', firstName: 'Ashley', lastName: 'Evans', age: 61, awvCompleted: true, awvDate: '2024-09-25', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-05', rafCurrent: 1.01, rafPotential: 1.37, revenueOpp: 4212 },
                { mrn: 'MRN829473', firstName: 'Andrew', lastName: 'Edwards', age: 65, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-28', rafCurrent: 1.45, rafPotential: 1.79, revenueOpp: 3978 }
            ]
        }
    };

    const provider = providerData[providerId];
    if (!provider) {
        showModal(`<h2>Provider Not Found</h2><p>No data available for provider ID: ${providerId}</p>`);
        return;
    }

    const providerName = provider.name;
    const patients = provider.patients;

    // Sort by revenue opportunity descending
    patients.sort((a, b) => b.revenueOpp - a.revenueOpp);

    const totalRevOpp = patients.reduce((sum, p) => sum + p.revenueOpp, 0);
    const awvCompleteCount = patients.filter(p => p.awvCompleted).length;
    const totalRAFGap = patients.reduce((sum, p) => sum + (p.rafPotential - p.rafCurrent), 0);
    const avgRAFGap = (totalRAFGap / patients.length).toFixed(2);
    const pmpmPerRAF = 11700; // Annual revenue per RAF point (approximate CMS rate)
    const patientsNotScheduled = patients.filter(p => p.nextAppt === 'Not scheduled').length;

    let modalBody = `
        <h2>${providerName} - HCC Coding Gap Opportunities</h2>
        <p class="provider-summary">Patient-level detail showing revenue opportunity from documenting suspected HCC codes</p>

        <!-- Reference Values Bar -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #27ae60;">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Annual Rev per RAF Point:</span>
                        <span style="font-weight: 700; color: #27ae60; margin-left: 0.5rem; font-size: 1.1rem;">~$${pmpmPerRAF.toLocaleString()}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Total RAF Gap:</span>
                        <span style="font-weight: 700; color: #C84E28; margin-left: 0.5rem; font-size: 1.1rem;">${totalRAFGap.toFixed(2)}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Patients:</span>
                        <span style="font-weight: 700; color: #2c3e50; margin-left: 0.5rem; font-size: 1.1rem;">${patients.length}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">
            <div class="kpi-card" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #28a745;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #155724; text-transform: uppercase;">
                    Total Revenue Opportunity
                </div>
                <div class="kpi-value" style="font-size: 1.8rem; font-weight: 700; color: #155724; margin: 0.5rem 0;">
                    $${totalRevOpp.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #155724; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(40,167,69,0.3);">
                    <span>From ${totalRAFGap.toFixed(2)} total RAF gap</span>
                    <div style="font-size: 0.7rem; color: #1e7e34; margin-top: 0.25rem;">
                        Formula: RAF Gap × $${pmpmPerRAF.toLocaleString()}/yr
                    </div>
                </div>
            </div>
            <div class="kpi-card clickable-card" style="background: white; border: 1px solid #e0e0e0; cursor: pointer; transition: all 0.2s ease;" onclick="showHCCPatientList('${providerId}', 'awv-incomplete')">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    AWV Incomplete
                </div>
                <div class="kpi-value" style="font-size: 1.8rem; font-weight: 700; color: ${(patients.length - awvCompleteCount) > 0 ? '#e74c3c' : '#27ae60'}; margin: 0.5rem 0;">
                    ${patients.length - awvCompleteCount}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                    Click to view patient list
                </div>
            </div>
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Avg RAF Gap/Patient
                </div>
                <div class="kpi-value" style="font-size: 1.8rem; font-weight: 700; color: #f39c12; margin: 0.5rem 0;">
                    ${avgRAFGap}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                    ~$${Math.round(avgRAFGap * pmpmPerRAF).toLocaleString()} per patient
                </div>
            </div>
            <div class="kpi-card clickable-card" style="background: white; border: 1px solid #e0e0e0; cursor: pointer; transition: all 0.2s ease;" onclick="showHCCPatientList('${providerId}', 'not-scheduled')">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Not Scheduled
                </div>
                <div class="kpi-value" style="font-size: 1.8rem; font-weight: 700; color: ${patientsNotScheduled > 0 ? '#e74c3c' : '#27ae60'}; margin: 0.5rem 0;">
                    ${patientsNotScheduled}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                    Click to view patient list
                </div>
            </div>
        </div>

        <!-- Savings Calculation Breakdown -->
        <div style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">📊</span> Revenue Calculation Breakdown
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">AWV</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Suspected HCCs</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF<br>Current</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF<br>Potential</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF Gap</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Calculation</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Revenue<br>Opportunity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patients.map(p => {
                            const rafGap = (p.rafPotential - p.rafCurrent).toFixed(2);
                            return `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                                    <strong>${p.firstName} ${p.lastName}</strong>
                                    <div style="font-size: 0.7rem; color: #888;">${p.mrn}</div>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">
                                    <span style="color: ${p.awvCompleted ? '#27ae60' : '#e74c3c'}; font-weight: 600;">${p.awvCompleted ? '✓' : '✗'}</span>
                                </td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #f39c12;">
                                    ${p.suspectedHCCs.join('<br>')}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.rafCurrent.toFixed(2)}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #27ae60; font-weight: 600;">${p.rafPotential.toFixed(2)}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #C84E28; font-weight: 600;">${rafGap}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #6c757d;">
                                    ${rafGap} × $${pmpmPerRAF.toLocaleString()}
                                </td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">
                                    $${p.revenueOpp.toLocaleString()}
                                </td>
                            </tr>
                            `;
                        }).join('')}
                        <tr style="background: #f8f9fa; font-weight: 700;">
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;">TOTAL</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${awvCompleteCount}/${patients.length}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6; color: #C84E28;">${totalRAFGap.toFixed(2)}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #d4edda; color: #155724; font-size: 1.1rem;">$${totalRevOpp.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="alert-box success" style="margin-top: 1rem;">
            <h4>Recommended Actions to Close Gaps</h4>
            <ul>
                <li><strong>AWV Outreach:</strong> Schedule ${patients.filter(p => !p.awvCompleted).length} patients for Annual Wellness Visit immediately</li>
                <li><strong>Chart Review:</strong> Review claims history for suspected HCCs and document in next visit note</li>
                <li><strong>Appointment Priority:</strong> Focus on patients with "Not scheduled" - highest revenue opportunity</li>
                <li><strong>Provider Education:</strong> Train on proper HCC documentation and coding requirements</li>
                <li><strong>Quick Win:</strong> Start with ${patients[0].firstName} ${patients[0].lastName} (${patients[0].mrn}) - $${patients[0].revenueOpp.toLocaleString()} opportunity</li>
            </ul>
        </div>

        <style>
            .tooltip-hover {
                position: relative;
                cursor: help;
            }
            .tooltip-icon {
                color: #3498db;
                font-size: 0.8em;
                margin-left: 4px;
            }
            .data-table th {
                white-space: nowrap;
            }
        </style>
    `;

    showModal(modalBody);
}

// Store HCC provider data globally for use in showHCCPatientList
const hccProviderData = {
    'johnson': {
        name: 'Dr. Sarah Johnson',
        specialty: 'Internal Medicine',
        market: 'Atlanta North',
        panelSize: 1847,
        avgRAF: 1.189,
        patients: [
            { mrn: 'MRN384729', firstName: 'Robert', lastName: 'Williams', age: 72, awvCompleted: true, awvDate: '2024-08-15', openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-22', rafCurrent: 2.84, rafPotential: 3.12, revenueOpp: 3280 },
            { mrn: 'MRN291847', firstName: 'Mary', lastName: 'Thompson', age: 68, awvCompleted: false, awvDate: null, openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)', 'HCC 111 (COPD)'], nextAppt: '2024-12-05', rafCurrent: 1.92, rafPotential: 2.45, revenueOpp: 6201 },
            { mrn: 'MRN573921', firstName: 'James', lastName: 'Davis', age: 75, awvCompleted: true, awvDate: '2024-09-03', openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-11-18', rafCurrent: 3.15, rafPotential: 3.48, revenueOpp: 3861 },
            { mrn: 'MRN684012', firstName: 'Patricia', lastName: 'Garcia', age: 70, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 59 (Major Depression)'], nextAppt: 'Not scheduled', rafCurrent: 1.67, rafPotential: 2.34, revenueOpp: 7839 },
            { mrn: 'MRN492847', firstName: 'Linda', lastName: 'Martinez', age: 66, awvCompleted: true, awvDate: '2024-07-22', openHCCs: ['HCC 18 (Diabetes)', 'HCC 23 (Obesity)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-11-29', rafCurrent: 1.82, rafPotential: 2.08, revenueOpp: 3042 }
        ]
    },
    'anderson': {
        name: 'Dr. Michael Anderson',
        specialty: 'Family Medicine',
        market: 'Atlanta South',
        panelSize: 1923,
        avgRAF: 1.256,
        patients: [
            { mrn: 'MRN782341', firstName: 'Dorothy', lastName: 'Clark', age: 74, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 18 (Diabetes)'], nextAppt: '2024-11-30', rafCurrent: 2.12, rafPotential: 2.89, revenueOpp: 9009 },
            { mrn: 'MRN293847', firstName: 'William', lastName: 'Harris', age: 69, awvCompleted: true, awvDate: '2024-06-18', openHCCs: ['HCC 18 (Diabetes)', 'HCC 108 (Vascular Disease)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-12-12', rafCurrent: 2.45, rafPotential: 2.92, revenueOpp: 5499 },
            { mrn: 'MRN847291', firstName: 'Helen', lastName: 'Robinson', age: 77, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 59 (Major Depression)', 'HCC 19 (Diabetes with complications)'], nextAppt: 'Not scheduled', rafCurrent: 1.78, rafPotential: 2.56, revenueOpp: 9126 },
            { mrn: 'MRN192847', firstName: 'Richard', lastName: 'Lewis', age: 71, awvCompleted: true, awvDate: '2024-09-22', openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-11-15', rafCurrent: 3.02, rafPotential: 3.35, revenueOpp: 3861 }
        ]
    },
    'brown': {
        name: 'Dr. Jennifer Brown',
        specialty: 'Internal Medicine',
        market: 'Columbus',
        panelSize: 1654,
        avgRAF: 1.178,
        patients: [
            { mrn: 'MRN647382', firstName: 'Barbara', lastName: 'Walker', age: 73, awvCompleted: true, awvDate: '2024-07-11', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-02', rafCurrent: 1.56, rafPotential: 1.92, revenueOpp: 4212 },
            { mrn: 'MRN847192', firstName: 'Thomas', lastName: 'Hall', age: 67, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-28', rafCurrent: 1.89, rafPotential: 2.23, revenueOpp: 3978 },
            { mrn: 'MRN293817', firstName: 'Susan', lastName: 'Young', age: 70, awvCompleted: true, awvDate: '2024-08-05', openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-12-18', rafCurrent: 2.34, rafPotential: 2.67, revenueOpp: 3861 },
            { mrn: 'MRN819273', firstName: 'Charles', lastName: 'King', age: 76, awvCompleted: false, awvDate: null, openHCCs: ['HCC 18 (Diabetes)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 88 (Arrhythmia)'], nextAppt: 'Not scheduled', rafCurrent: 2.67, rafPotential: 3.45, revenueOpp: 9126 }
        ]
    },
    'patel': {
        name: 'Dr. Raj Patel',
        specialty: 'Internal Medicine',
        market: 'Augusta',
        panelSize: 1567,
        avgRAF: 1.412,
        patients: [
            { mrn: 'MRN928374', firstName: 'Margaret', lastName: 'Adams', age: 78, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 18 (Diabetes)', 'HCC 108 (Vascular Disease)'], nextAppt: '2024-11-20', rafCurrent: 2.89, rafPotential: 3.67, revenueOpp: 9126 },
            { mrn: 'MRN192384', firstName: 'George', lastName: 'Nelson', age: 81, awvCompleted: true, awvDate: '2024-05-22', openHCCs: ['HCC 18 (Diabetes)', 'HCC 85 (CHF)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-12-08', rafCurrent: 3.12, rafPotential: 3.45, revenueOpp: 3861 },
            { mrn: 'MRN847293', firstName: 'Ruth', lastName: 'Hill', age: 75, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 19 (Diabetes with complications)'], nextAppt: 'Not scheduled', rafCurrent: 1.98, rafPotential: 2.89, revenueOpp: 10647 }
        ]
    },
    'kim': {
        name: 'Dr. Susan Kim',
        specialty: 'Family Medicine',
        market: 'Atlanta North',
        panelSize: 1789,
        avgRAF: 1.134,
        patients: [
            { mrn: 'MRN384756', firstName: 'Betty', lastName: 'Wright', age: 69, awvCompleted: true, awvDate: '2024-08-30', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-12-15', rafCurrent: 1.45, rafPotential: 1.79, revenueOpp: 3978 },
            { mrn: 'MRN829374', firstName: 'Donald', lastName: 'Lopez', age: 73, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)', 'HCC 85 (CHF)'], suspectedHCCs: ['HCC 18 (Diabetes)'], nextAppt: '2024-11-25', rafCurrent: 2.56, rafPotential: 2.92, revenueOpp: 4212 },
            { mrn: 'MRN192736', firstName: 'Sandra', lastName: 'Scott', age: 66, awvCompleted: true, awvDate: '2024-09-12', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-22', rafCurrent: 1.23, rafPotential: 1.59, revenueOpp: 4212 }
        ]
    },
    'chen': {
        name: 'Dr. Lisa Chen',
        specialty: 'Internal Medicine',
        market: 'Atlanta South',
        panelSize: 1456,
        avgRAF: 1.089,
        patients: [
            { mrn: 'MRN736284', firstName: 'Kenneth', lastName: 'Green', age: 68, awvCompleted: false, awvDate: null, openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 108 (Vascular Disease)'], nextAppt: '2024-11-18', rafCurrent: 1.34, rafPotential: 2.01, revenueOpp: 7839 },
            { mrn: 'MRN827364', firstName: 'Nancy', lastName: 'Baker', age: 71, awvCompleted: true, awvDate: '2024-07-28', openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-12-05', rafCurrent: 2.12, rafPotential: 2.45, revenueOpp: 3861 },
            { mrn: 'MRN293847', firstName: 'Steven', lastName: 'Gonzalez', age: 74, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: 'Not scheduled', rafCurrent: 1.67, rafPotential: 2.0, revenueOpp: 3861 }
        ]
    },
    'martinez': {
        name: 'Dr. Robert Martinez',
        specialty: 'Family Medicine',
        market: 'Columbus',
        panelSize: 2012,
        avgRAF: 1.223,
        patients: [
            { mrn: 'MRN847293', firstName: 'Lisa', lastName: 'Carter', age: 72, awvCompleted: true, awvDate: '2024-06-15', openHCCs: ['HCC 18 (Diabetes)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)'], nextAppt: '2024-12-01', rafCurrent: 2.34, rafPotential: 2.81, revenueOpp: 5499 },
            { mrn: 'MRN192847', firstName: 'Paul', lastName: 'Mitchell', age: 69, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 108 (Vascular Disease)', 'HCC 88 (Arrhythmia)'], nextAppt: '2024-11-22', rafCurrent: 2.01, rafPotential: 2.68, revenueOpp: 7839 },
            { mrn: 'MRN736495', firstName: 'Carol', lastName: 'Perez', age: 76, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 18 (Diabetes)'], nextAppt: 'Not scheduled', rafCurrent: 1.78, rafPotential: 2.14, revenueOpp: 4212 }
        ]
    },
    'williams': {
        name: 'Dr. David Williams',
        specialty: 'Internal Medicine',
        market: 'Augusta',
        panelSize: 1678,
        avgRAF: 1.345,
        patients: [
            { mrn: 'MRN928475', firstName: 'Michelle', lastName: 'Roberts', age: 77, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 59 (Major Depression)'], nextAppt: '2024-11-28', rafCurrent: 2.67, rafPotential: 3.45, revenueOpp: 9126 },
            { mrn: 'MRN384756', firstName: 'Edward', lastName: 'Turner', age: 73, awvCompleted: true, awvDate: '2024-08-20', openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-12-12', rafCurrent: 1.89, rafPotential: 2.23, revenueOpp: 3978 },
            { mrn: 'MRN192847', firstName: 'Deborah', lastName: 'Phillips', age: 70, awvCompleted: true, awvDate: '2024-09-05', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-18', rafCurrent: 1.56, rafPotential: 1.92, revenueOpp: 4212 },
            { mrn: 'MRN736284', firstName: 'Mark', lastName: 'Campbell', age: 80, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: 'Not scheduled', rafCurrent: 3.12, rafPotential: 3.45, revenueOpp: 3861 }
        ]
    },
    'taylor': {
        name: 'Dr. Emily Taylor',
        specialty: 'Family Medicine',
        market: 'Atlanta North',
        panelSize: 1534,
        avgRAF: 1.167,
        patients: [
            { mrn: 'MRN827364', firstName: 'Jessica', lastName: 'Parker', age: 64, awvCompleted: true, awvDate: '2024-07-18', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-30', rafCurrent: 1.12, rafPotential: 1.46, revenueOpp: 3978 },
            { mrn: 'MRN293817', firstName: 'Kevin', lastName: 'Evans', age: 71, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], nextAppt: '2024-12-08', rafCurrent: 1.78, rafPotential: 2.56, revenueOpp: 9126 },
            { mrn: 'MRN847192', firstName: 'Donna', lastName: 'Edwards', age: 68, awvCompleted: true, awvDate: '2024-09-22', openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-12-15', rafCurrent: 2.23, rafPotential: 2.56, revenueOpp: 3861 }
        ]
    },
    'lee': {
        name: 'Dr. James Lee',
        specialty: 'Internal Medicine',
        market: 'Atlanta South',
        panelSize: 1423,
        avgRAF: 1.298,
        patients: [
            { mrn: 'MRN192736', firstName: 'Brian', lastName: 'Collins', age: 75, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 111 (COPD)', 'HCC 108 (Vascular Disease)'], nextAppt: 'Not scheduled', rafCurrent: 2.45, rafPotential: 3.23, revenueOpp: 9126 },
            { mrn: 'MRN736495', firstName: 'Amy', lastName: 'Stewart', age: 69, awvCompleted: true, awvDate: '2024-08-12', openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 59 (Major Depression)'], nextAppt: '2024-11-25', rafCurrent: 1.67, rafPotential: 2.0, revenueOpp: 3861 },
            { mrn: 'MRN928374', firstName: 'Ronald', lastName: 'Sanchez', age: 78, awvCompleted: false, awvDate: null, openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)', 'HCC 85 (CHF)'], nextAppt: '2024-12-02', rafCurrent: 1.89, rafPotential: 2.67, revenueOpp: 9126 }
        ]
    },
    'moore': {
        name: 'Dr. Karen Moore',
        specialty: 'Family Medicine',
        market: 'Columbus',
        panelSize: 1345,
        avgRAF: 1.156,
        patients: [
            { mrn: 'MRN384729', firstName: 'Jason', lastName: 'Morris', age: 67, awvCompleted: true, awvDate: '2024-09-08', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-12-10', rafCurrent: 1.34, rafPotential: 1.68, revenueOpp: 3978 },
            { mrn: 'MRN827364', firstName: 'Kimberly', lastName: 'Rogers', age: 72, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)', 'HCC 85 (CHF)'], suspectedHCCs: ['HCC 88 (Arrhythmia)'], nextAppt: '2024-11-28', rafCurrent: 2.34, rafPotential: 2.67, revenueOpp: 3861 },
            { mrn: 'MRN192847', firstName: 'Gary', lastName: 'Reed', age: 74, awvCompleted: true, awvDate: '2024-07-25', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-18', rafCurrent: 1.56, rafPotential: 1.92, revenueOpp: 4212 }
        ]
    },
    'jackson': {
        name: 'Dr. Thomas Jackson',
        specialty: 'Internal Medicine',
        market: 'Augusta',
        panelSize: 1234,
        avgRAF: 1.389,
        patients: [
            { mrn: 'MRN736284', firstName: 'Angela', lastName: 'Cook', age: 76, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'], suspectedHCCs: ['HCC 18 (Diabetes)', 'HCC 59 (Major Depression)'], nextAppt: '2024-11-22', rafCurrent: 2.78, rafPotential: 3.56, revenueOpp: 9126 },
            { mrn: 'MRN293847', firstName: 'Timothy', lastName: 'Morgan', age: 71, awvCompleted: true, awvDate: '2024-06-28', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-12-05', rafCurrent: 1.45, rafPotential: 1.79, revenueOpp: 3978 },
            { mrn: 'MRN847192', firstName: 'Stephanie', lastName: 'Bell', age: 79, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)'], suspectedHCCs: ['HCC 88 (Arrhythmia)', 'HCC 111 (COPD)'], nextAppt: 'Not scheduled', rafCurrent: 2.56, rafPotential: 3.23, revenueOpp: 7839 }
        ]
    },
    'garcia': {
        name: 'Dr. Anthony Garcia',
        specialty: 'Internal Medicine',
        market: 'Augusta',
        panelSize: 876,
        avgRAF: 1.478,
        patients: [
            { mrn: 'MRN839274', firstName: 'Amanda', lastName: 'Campbell', age: 79, awvCompleted: false, awvDate: null, openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)', 'HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 88 (Arrhythmia)', 'HCC 59 (Major Depression)'], nextAppt: 'Not scheduled', rafCurrent: 3.23, rafPotential: 4.12, revenueOpp: 10413 },
            { mrn: 'MRN192837', firstName: 'Joshua', lastName: 'Parker', age: 82, awvCompleted: true, awvDate: '2024-05-15', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-22', rafCurrent: 1.89, rafPotential: 2.23, revenueOpp: 3978 }
        ]
    },
    'white': {
        name: 'Dr. Patricia White',
        specialty: 'Family Medicine',
        market: 'Atlanta North',
        panelSize: 1567,
        avgRAF: 1.012,
        patients: [
            { mrn: 'MRN472839', firstName: 'Ashley', lastName: 'Evans', age: 61, awvCompleted: true, awvDate: '2024-09-25', openHCCs: ['HCC 18 (Diabetes)'], suspectedHCCs: ['HCC 19 (Diabetes with complications)'], nextAppt: '2024-12-05', rafCurrent: 1.01, rafPotential: 1.37, revenueOpp: 4212 },
            { mrn: 'MRN829473', firstName: 'Andrew', lastName: 'Edwards', age: 65, awvCompleted: false, awvDate: null, openHCCs: ['HCC 111 (COPD)'], suspectedHCCs: ['HCC 108 (Vascular Disease)'], nextAppt: '2024-11-28', rafCurrent: 1.45, rafPotential: 1.79, revenueOpp: 3978 }
        ]
    }
};

function showHCCPatientList(providerId, filterType) {
    const provider = hccProviderData[providerId];
    if (!provider) {
        showModal(`<h2>Provider Not Found</h2><p>No data available for provider ID: ${providerId}</p>`);
        return;
    }

    let filteredPatients = [];
    let listTitle = '';
    let listDescription = '';

    if (filterType === 'awv-incomplete') {
        filteredPatients = provider.patients.filter(p => !p.awvCompleted);
        listTitle = 'Patients Without AWV Completion';
        listDescription = 'These patients have not completed their Annual Wellness Visit and are priority for outreach.';
    } else if (filterType === 'not-scheduled') {
        filteredPatients = provider.patients.filter(p => p.nextAppt === 'Not scheduled');
        listTitle = 'Patients Not Scheduled';
        listDescription = 'These patients do not have an upcoming appointment and require immediate scheduling outreach.';
    }

    // Sort by revenue opportunity descending
    filteredPatients.sort((a, b) => b.revenueOpp - a.revenueOpp);

    const totalRevOpp = filteredPatients.reduce((sum, p) => sum + p.revenueOpp, 0);

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
                <h2 style="margin: 0;">${provider.name}</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">${listTitle}</p>
            </div>
            <button onclick="exportHCCPatientList('${providerId}', '${filterType}')" class="btn btn-primary" style="background: #27ae60; border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📥</span> Export to CSV
            </button>
        </div>
        <p style="color: #6c757d; font-size: 0.9rem; margin-bottom: 1.5rem;">${listDescription}</p>

        <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; border-left: 4px solid #27ae60;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <span style="font-size: 0.85rem; color: #155724;">Total Patients:</span>
                    <span style="font-weight: 700; color: #155724; margin-left: 0.5rem; font-size: 1.3rem;">${filteredPatients.length}</span>
                </div>
                <div>
                    <span style="font-size: 0.85rem; color: #155724;">Total Revenue Opportunity:</span>
                    <span style="font-weight: 700; color: #155724; margin-left: 0.5rem; font-size: 1.3rem;">$${totalRevOpp.toLocaleString()}</span>
                </div>
            </div>
        </div>

        ${filteredPatients.length === 0 ? `
            <div style="background: #d4edda; border-radius: 12px; padding: 2rem; text-align: center;">
                <span style="font-size: 2rem;">✓</span>
                <h3 style="color: #155724; margin: 1rem 0 0.5rem 0;">All Caught Up!</h3>
                <p style="color: #155724; margin: 0;">No patients in this category for this provider.</p>
            </div>
        ` : `
            <div style="background: white; border-radius: 12px; padding: 1rem; border: 1px solid #e0e0e0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient Name</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">MRN</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Age</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Suspected HCCs</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF Gap</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Revenue Opp</th>
                            ${filterType === 'awv-incomplete' ? '<th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Next Appt</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredPatients.map(p => {
                            const rafGap = (p.rafPotential - p.rafCurrent).toFixed(2);
                            return `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                                    <strong>${p.firstName} ${p.lastName}</strong>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-family: monospace; color: #6c757d;">${p.mrn}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.age}</td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #f39c12;">
                                    ${p.suspectedHCCs.join('<br>')}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #C84E28; font-weight: 600;">${rafGap}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">$${p.revenueOpp.toLocaleString()}</td>
                                ${filterType === 'awv-incomplete' ? `<td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${p.nextAppt === 'Not scheduled' ? '#e74c3c' : '#27ae60'};">${p.nextAppt}</td>` : ''}
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `}

        <div class="alert-box warning" style="margin-top: 1.5rem;">
            <h4>Recommended Actions</h4>
            <ul>
                ${filterType === 'awv-incomplete' ? `
                    <li><strong>Schedule AWV:</strong> Contact these ${filteredPatients.length} patients to schedule Annual Wellness Visit</li>
                    <li><strong>Prepare Gap List:</strong> Generate patient-specific suspected HCC documentation for each AWV</li>
                    <li><strong>Care Team Alert:</strong> Notify care coordinators to prioritize outreach</li>
                ` : `
                    <li><strong>Urgent Outreach:</strong> Contact these ${filteredPatients.length} patients immediately to schedule appointments</li>
                    <li><strong>Alternative Contact:</strong> Try multiple contact methods (phone, patient portal, mail)</li>
                    <li><strong>Transportation:</strong> Assess if transportation barriers are preventing scheduling</li>
                `}
            </ul>
        </div>

        <div style="margin-top: 1rem; text-align: center;">
            <button onclick="drillDownHCC('${providerId}')" class="btn btn-secondary" style="background: #6c757d; border: none; color: white; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer;">
                ← Back to Provider Details
            </button>
        </div>
    `;

    showModal(modalBody);
}

function exportHCCPatientList(providerId, filterType) {
    const provider = hccProviderData[providerId];
    if (!provider) return;

    let filteredPatients = [];
    let filename = '';

    if (filterType === 'awv-incomplete') {
        filteredPatients = provider.patients.filter(p => !p.awvCompleted);
        filename = `${provider.name.replace(/\s+/g, '_')}_AWV_Incomplete_Patients.csv`;
    } else if (filterType === 'not-scheduled') {
        filteredPatients = provider.patients.filter(p => p.nextAppt === 'Not scheduled');
        filename = `${provider.name.replace(/\s+/g, '_')}_Not_Scheduled_Patients.csv`;
    }

    // Create CSV content
    const headers = ['Patient Name', 'MRN', 'Age', 'RAF Current', 'RAF Potential', 'RAF Gap', 'Suspected HCCs', 'Revenue Opportunity', 'Next Appointment'];
    const rows = filteredPatients.map(p => [
        `${p.firstName} ${p.lastName}`,
        p.mrn,
        p.age,
        p.rafCurrent.toFixed(2),
        p.rafPotential.toFixed(2),
        (p.rafPotential - p.rafCurrent).toFixed(2),
        `"${p.suspectedHCCs.join('; ')}"`,
        p.revenueOpp,
        p.nextAppt
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function drillDownEpisode(episodeType) {
    const episodeNames = {
        'joint': 'Joint Replacement',
        'chf': 'CHF Exacerbation',
        'pci': 'PCI / Cardiac Cath',
        'copd': 'COPD Exacerbation',
        'pneumonia': 'Pneumonia',
        'spine': 'Spine Surgery'
    };

    const episodeName = episodeNames[episodeType] || episodeType;

    // Hospital-level episode cost data (Piedmont Health System)
    // Joint replacement data matches piedmontHospitalData exactly
    // Variance = (avgCost - benchmarkCost) / benchmarkCost × 100
    const providerData = {
        'joint': [
            { provider: 'Piedmont Atlanta', episodes: 89, avgCost: 26073, benchmarkCost: 27500, variance: -5.2, postAcuteUtil: 32, readmitRate: 5.6 },
            { provider: 'Piedmont Newnan', episodes: 67, avgCost: 28963, benchmarkCost: 27500, variance: 5.3, postAcuteUtil: 45, readmitRate: 7.2 },
            { provider: 'Piedmont Fayette', episodes: 54, avgCost: 31198, benchmarkCost: 27500, variance: 13.4, postAcuteUtil: 58, readmitRate: 8.9 },
            { provider: 'Piedmont Henry', episodes: 48, avgCost: 25654, benchmarkCost: 27500, variance: -6.7, postAcuteUtil: 38, readmitRate: 6.1 },
            { provider: 'Piedmont Mountainside', episodes: 42, avgCost: 29376, benchmarkCost: 27500, variance: 6.8, postAcuteUtil: 48, readmitRate: 7.8 },
            { provider: 'Piedmont Columbus', episodes: 39, avgCost: 33477, benchmarkCost: 27500, variance: 21.7, postAcuteUtil: 67, readmitRate: 11.2 }
        ],
        'chf': [
            { provider: 'Piedmont Atlanta', episodes: 234, avgCost: 12800, benchmarkCost: 14200, variance: -9.9, postAcuteUtil: 22, readmitRate: 18.2 },
            { provider: 'Piedmont Newnan', episodes: 189, avgCost: 15600, benchmarkCost: 14200, variance: 9.9, postAcuteUtil: 31, readmitRate: 21.7 },
            { provider: 'Piedmont Fayette', episodes: 156, avgCost: 13900, benchmarkCost: 14200, variance: -2.1, postAcuteUtil: 24, readmitRate: 19.8 },
            { provider: 'Piedmont Henry', episodes: 143, avgCost: 16800, benchmarkCost: 14200, variance: 18.3, postAcuteUtil: 35, readmitRate: 24.5 }
        ],
        'pci': [
            { provider: 'Piedmont Atlanta', episodes: 98, avgCost: 30200, benchmarkCost: 32000, variance: -5.6, postAcuteUtil: 18, readmitRate: 4.2 },
            { provider: 'Piedmont Newnan', episodes: 56, avgCost: 34500, benchmarkCost: 32000, variance: 7.8, postAcuteUtil: 24, readmitRate: 5.8 },
            { provider: 'Piedmont Henry', episodes: 48, avgCost: 32100, benchmarkCost: 32000, variance: 0.3, postAcuteUtil: 20, readmitRate: 4.9 },
            { provider: 'Piedmont Columbus', episodes: 32, avgCost: 36800, benchmarkCost: 32000, variance: 15.0, postAcuteUtil: 32, readmitRate: 7.2 }
        ],
        'copd': [
            { provider: 'Piedmont Atlanta', episodes: 156, avgCost: 11200, benchmarkCost: 12000, variance: -6.7, postAcuteUtil: 28, readmitRate: 16.5 },
            { provider: 'Piedmont Fayette', episodes: 134, avgCost: 12800, benchmarkCost: 12000, variance: 6.7, postAcuteUtil: 35, readmitRate: 19.2 },
            { provider: 'Piedmont Newnan', episodes: 112, avgCost: 13200, benchmarkCost: 12000, variance: 10.0, postAcuteUtil: 38, readmitRate: 21.4 },
            { provider: 'Piedmont Henry', episodes: 85, avgCost: 11800, benchmarkCost: 12000, variance: -1.7, postAcuteUtil: 30, readmitRate: 17.8 }
        ],
        'pneumonia': [
            { provider: 'Piedmont Atlanta', episodes: 198, avgCost: 9200, benchmarkCost: 9500, variance: -3.2, postAcuteUtil: 22, readmitRate: 12.1 },
            { provider: 'Piedmont Newnan', episodes: 167, avgCost: 9800, benchmarkCost: 9500, variance: 3.2, postAcuteUtil: 26, readmitRate: 13.8 },
            { provider: 'Piedmont Fayette', episodes: 142, avgCost: 10200, benchmarkCost: 9500, variance: 7.4, postAcuteUtil: 29, readmitRate: 14.5 },
            { provider: 'Piedmont Henry', episodes: 116, avgCost: 9600, benchmarkCost: 9500, variance: 1.1, postAcuteUtil: 24, readmitRate: 12.8 }
        ],
        'spine': [
            { provider: 'Piedmont Atlanta', episodes: 62, avgCost: 42500, benchmarkCost: 44000, variance: -3.4, postAcuteUtil: 45, readmitRate: 6.2 },
            { provider: 'Piedmont Newnan', episodes: 38, avgCost: 48200, benchmarkCost: 44000, variance: 9.5, postAcuteUtil: 58, readmitRate: 8.4 },
            { provider: 'Piedmont Fayette', episodes: 32, avgCost: 52100, benchmarkCost: 44000, variance: 18.4, postAcuteUtil: 65, readmitRate: 10.2 },
            { provider: 'Piedmont Columbus', episodes: 24, avgCost: 46800, benchmarkCost: 44000, variance: 6.4, postAcuteUtil: 52, readmitRate: 7.8 }
        ]
    };

    const providers = providerData[episodeType] || providerData['joint'];
    const benchmarkCost = providers[0].benchmarkCost; // All have same benchmark

    // Calculate summary stats
    const totalEpisodes = providers.reduce((sum, p) => sum + p.episodes, 0);
    const weightedAvgCost = providers.reduce((sum, p) => sum + (p.avgCost * p.episodes), 0) / totalEpisodes;
    const avgVariance = (providers.reduce((sum, p) => sum + p.variance, 0) / providers.length).toFixed(1);
    const highCostProviders = providers.filter(p => p.variance > 10).length;
    const providersAboveBenchmark = providers.filter(p => p.avgCost > benchmarkCost).length;

    // Calculate opportunity with breakdown
    const providerBreakdown = providers.map(p => {
        const vsBenchmark = p.avgCost - benchmarkCost;
        const savingsOpp = vsBenchmark > 0 ? vsBenchmark * p.episodes : 0;
        return {
            ...p,
            vsBenchmark: vsBenchmark,
            savingsOpp: savingsOpp
        };
    });

    const totalOpportunity = providerBreakdown.reduce((sum, p) => sum + p.savingsOpp, 0);

    let modalBody = `
        <h2>${episodeName} - Hospital Cost Variation Analysis</h2>
        <p class="provider-summary">Hospital-level cost variation showing savings opportunity vs national benchmark</p>

        <!-- Reference Values Bar -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #3498db;">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">National Benchmark:</span>
                        <span style="font-weight: 700; color: #3498db; margin-left: 0.5rem; font-size: 1.1rem;">$${benchmarkCost.toLocaleString()}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Network Wtd Avg:</span>
                        <span style="font-weight: 700; color: ${weightedAvgCost > benchmarkCost ? '#e74c3c' : '#27ae60'}; margin-left: 0.5rem; font-size: 1.1rem;">$${Math.round(weightedAvgCost).toLocaleString()}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Total Episodes:</span>
                        <span style="font-weight: 700; color: #2c3e50; margin-left: 0.5rem; font-size: 1.1rem;">${totalEpisodes}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Network Weighted Average
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: ${weightedAvgCost > benchmarkCost ? '#e74c3c' : '#27ae60'}; margin: 0.5rem 0;">
                    $${Math.round(weightedAvgCost).toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <span>vs Benchmark:</span>
                    <span style="font-weight: 600; color: ${weightedAvgCost > benchmarkCost ? '#e74c3c' : '#27ae60'}; margin-left: 0.5rem;">
                        ${weightedAvgCost > benchmarkCost ? '+' : ''}$${Math.round(weightedAvgCost - benchmarkCost).toLocaleString()}
                    </span>
                    <span style="margin-left: 0.5rem;">(${avgVariance > 0 ? '+' : ''}${avgVariance}%)</span>
                </div>
            </div>
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    High-Cost Hospitals
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #f39c12; margin: 0.5rem 0;">
                    ${highCostProviders}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <span>Above benchmark (>10%):</span>
                    <span style="font-weight: 600; margin-left: 0.5rem;">${highCostProviders} of ${providers.length}</span>
                </div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #28a745;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #155724; text-transform: uppercase;">
                    Savings Opportunity
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #155724; margin: 0.5rem 0;">
                    $${totalOpportunity.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #155724; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(40,167,69,0.3);">
                    <span>Target:</span>
                    <span style="font-weight: 600; margin-left: 0.5rem;">$${benchmarkCost.toLocaleString()} (National)</span>
                    <div style="font-size: 0.7rem; color: #1e7e34; margin-top: 0.25rem;">
                        ${providersAboveBenchmark} hospitals above benchmark
                    </div>
                </div>
            </div>
        </div>

        <!-- Savings Calculation Breakdown -->
        <div style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">📊</span> Savings Calculation Breakdown
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Hospital</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Episodes</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avg Cost</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">vs Benchmark<br><span style="font-weight: 400; font-size: 0.7rem;">($${benchmarkCost.toLocaleString()})</span></th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Post-Acute %</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Readmit %</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Savings<br>Opportunity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${providerBreakdown.map(p => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.provider}</strong></td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.episodes}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; font-weight: 600;">$${p.avgCost.toLocaleString()}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; color: ${p.vsBenchmark > 0 ? '#e74c3c' : '#27ae60'}; font-weight: 500;">
                                    ${p.vsBenchmark > 0 ? '+' : ''}$${Math.round(p.vsBenchmark).toLocaleString()}
                                    <div style="font-size: 0.7rem; color: #888;">× ${p.episodes} episodes</div>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${p.postAcuteUtil > 50 ? '#f39c12' : '#495057'};">${p.postAcuteUtil}%</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${p.readmitRate > 8 ? '#e74c3c' : '#27ae60'};">${p.readmitRate}%</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">
                                    ${p.savingsOpp > 0 ? '$' + Math.round(p.savingsOpp).toLocaleString() : '—'}
                                </td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f8f9fa; font-weight: 700;">
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;">TOTAL</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${totalEpisodes}</td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6;">$${Math.round(weightedAvgCost).toLocaleString()}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #d4edda; color: #155724; font-size: 1.1rem;">$${Math.round(totalOpportunity).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Find key drivers for insights
    const highestCostProvider = providerBreakdown.reduce((max, p) => p.variance > max.variance ? p : max);
    const highestPostAcute = providerBreakdown.reduce((max, p) => p.postAcuteUtil > max.postAcuteUtil ? p : max);
    const highestReadmit = providerBreakdown.reduce((max, p) => p.readmitRate > max.readmitRate ? p : max);
    const lowestCostProvider = providerBreakdown.reduce((min, p) => p.avgCost < min.avgCost ? p : min);

    modalBody += `
        <div class="alert-box warning" style="margin-top: 1.5rem;">
            <h4>Cost Variation Drivers & Opportunities</h4>
            <ul>
                <li><strong>Highest Cost Variance:</strong> ${highestCostProvider.provider} is +${highestCostProvider.variance}% above benchmark - investigate clinical protocols and post-acute utilization</li>
                <li><strong>Post-Acute Overutilization:</strong> ${highestPostAcute.provider} uses post-acute care in ${highestPostAcute.postAcuteUtil}% of cases - promote home-based recovery</li>
                <li><strong>Readmission Driver:</strong> ${highestReadmit.provider} has ${highestReadmit.readmitRate}% readmission rate - strengthen discharge planning</li>
                <li><strong>Best Practice:</strong> ${lowestCostProvider.provider} demonstrates efficient care at $${lowestCostProvider.avgCost.toLocaleString()} per episode</li>
                <li><strong>Quick Win:</strong> If ${highestCostProvider.provider} matched benchmark, would save $${Math.round(highestCostProvider.savingsOpp).toLocaleString()} annually</li>
            </ul>
        </div>
    `;

    showModal(modalBody);
}

// Modal Functions
function showModal(content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = content;
    modal.style.display = 'block';

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Insights Modal Data
const insightsData = {
    performance: {
        title: 'Executive Insights',
        type: '',
        items: [
            { label: 'Overall', text: 'Tracking 2.3% below benchmark - on track for shared savings' },
            { label: 'Risk Areas', text: 'Augusta market elevated spend (+3.0%) and high leakage (31.8%)' },
            { label: 'April Decision', text: 'Recommend continuing MSSP participation for 2025' },
            { label: 'Actions', text: 'Focus leakage reduction in Augusta and Atlanta South ($2.1M opportunity)' }
        ]
    },
    projections: {
        title: 'PY2027 Program Participation Recommendation',
        type: 'success',
        recommendation: 'CONTINUE MSSP ACO PARTICIPATION FOR PY2027',
        summary: '82% probability of break-even or better in PY2027. Scenario modeling projects $11.8M savings with 68% confidence based on current performance trajectory.',
        assumptions: 'Based on Q1-Q2 2024 claims data, CMS expenditure files, +2% lives growth, -1% utilization trend, benchmark rebasing impact factored in.',
        limitations: 'PY2027 projections subject to CMS benchmark methodology changes, regional rate updates, and risk score recalibration. June 2026 election deadline requires monitoring.'
    },
    quality: {
        title: 'Quality Improvement Opportunities',
        type: 'info',
        items: [
            { label: 'Annual Wellness Visits', text: '3.7 pts below benchmark. Close gap with 177 additional AWVs to gain quality points' },
            { label: 'Statin Therapy', text: '4.3 pts below benchmark. Target 205 patients with CVD not on statins' },
            { label: 'Social Determinants Screening', text: 'New measure for PY2025. Need to screen 263 additional patients' },
            { label: 'Estimated Impact', text: 'Closing these 3 gaps could increase quality score to 91.2% and add $400K in quality bonus' }
        ]
    },
    tcoc: {
        title: 'Cost Reduction Opportunities',
        type: 'warning',
        subtitle: '$3.9M Annual Impact',
        items: [
            { label: 'Avoidable ED Visits', text: '4,286 visits at avg $1,227/visit = $5.3M spend. 75% reduction = $3.9M savings' },
            { label: '30-Day Readmissions', text: '487 readmissions at avg $18,500 = $9.0M. 20% reduction = $1.8M savings' },
            { label: 'SNF Utilization', text: 'Days per 1000 at 87 vs benchmark 75. Reduction = $2.1M savings' },
            { label: 'High-Cost Imaging', text: 'Outpatient MRI/CT rate 15% above benchmark = $1.4M opportunity' },
            { label: 'Total Opportunity', text: '$9.2M in identified cost reduction initiatives' }
        ]
    },
    leakage: {
        title: 'Leakage Reduction Strategy',
        type: 'info',
        subtitle: '$18M Opportunity',
        items: [
            { label: 'Contract Expansion', text: 'Negotiate with Atlanta Cardiology Associates ($12.3M) and Peachtree Imaging ($8.9M) to bring in-network' },
            { label: 'PCP Education', text: 'Target Dr. Martinez, Dr. Williams, and Dr. Chen for referral pattern optimization (combined 40% leakage rate)' },
            { label: 'Network Recruitment', text: 'Add orthopedic and pain management specialists in Augusta market' },
            { label: 'Geographic Gaps', text: 'High leakage in southern Augusta zip codes - consider adding access points' },
            { label: 'Service Line Focus', text: 'Cardiology (32%), Imaging (23%), Orthopedics (19%) represent 74% of total leakage' }
        ]
    },
    hcc: {
        title: 'Risk Adjustment Action Plan',
        type: 'success',
        subtitle: '$2.8M Revenue Opportunity',
        items: [
            { label: 'Provider Outreach', text: 'Focus on Dr. Johnson (427 suspects), Dr. Anderson (398 suspects), Dr. Brown (312 suspects)' },
            { label: 'Diagnosis Categories', text: 'Prioritize Diabetes w/complications (HCC 18), COPD (HCC 111), CHF (HCC 85) = 71% of opportunity' },
            { label: 'Documentation Training', text: 'Q1 focus on chronic disease specificity and annual recapture' },
            { label: 'Technology Support', text: 'Deploy EMR alerts for suspect HCCs during encounters' },
            { label: 'Financial Impact', text: '$2.8M in additional CMS revenue if 100% capture achieved (conservative 70% = $1.96M)' }
        ]
    },
    episodes: {
        title: 'Clinical Variation Reduction Opportunities',
        type: 'warning',
        subtitle: '$4.2M Impact',
        items: [
            { label: 'Joint Replacement Standardization', text: '28.9% cost variation. Reduce to 15% through clinical pathways = $1.8M savings' },
            { label: 'Post-Acute Optimization', text: 'SNF rate 42.1% vs benchmark 28%. Increase home health = $1.2M savings' },
            { label: 'Spinal Fusion Protocol', text: 'Highest variation at 32.4%. Standardize surgeon selection and implant choices = $900K savings' },
            { label: 'CHF Readmission Reduction', text: '30-day readmit rate 18.2% vs benchmark 14%. Improve transitions = $600K savings' },
            { label: 'Total Episode Opportunity', text: '$4.5M through clinical standardization and care pathway optimization' }
        ]
    }
};

function showInsightsModal(tabType) {
    const data = insightsData[tabType];
    if (!data) return;

    let bgGradient = 'linear-gradient(135deg, var(--piedmont-primary) 0%, var(--piedmont-orange) 100%)';

    if (data.type === 'success') {
        bgGradient = 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)';
    } else if (data.type === 'info') {
        bgGradient = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    } else if (data.type === 'warning') {
        bgGradient = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    }

    let html = `
        <div style="background: ${bgGradient}; color: white; padding: 2rem; border-radius: 12px; margin: -20px; margin-bottom: 0;">
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${data.title}</h2>
            ${data.subtitle ? `<p style="margin: 0; font-size: 1.1rem; opacity: 0.95;">${data.subtitle}</p>` : ''}
        </div>
        <div style="padding: 1.5rem 0 0.5rem 0;">
    `;

    // Special handling for projections tab (recommendation format)
    if (tabType === 'projections') {
        html += `
            <div style="background: #d4edda; border-left: 4px solid #27ae60; padding: 1rem 1.5rem; border-radius: 6px; margin-bottom: 1rem;">
                <strong style="font-size: 1.1rem; color: #155724;">${data.recommendation}</strong>
            </div>
            <p style="margin-bottom: 1rem; line-height: 1.6; color: #2c3e50;">${data.summary}</p>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem;">
                <strong style="color: #2c3e50;">Key Assumptions:</strong>
                <p style="margin: 0.5rem 0 0 0; color: #5a6c7d;">${data.assumptions}</p>
            </div>
            <div style="background: #fff3cd; padding: 1rem; border-radius: 6px;">
                <strong style="color: #856404;">Limitations:</strong>
                <p style="margin: 0.5rem 0 0 0; color: #856404;">${data.limitations}</p>
            </div>
        `;
    } else {
        // Standard items format
        html += '<ul style="list-style: none; padding: 0; margin: 0;">';
        data.items.forEach(item => {
            html += `
                <li style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--piedmont-primary);">
                    <strong style="color: #2c3e50; display: block; margin-bottom: 0.25rem;">${item.label}:</strong>
                    <span style="color: #5a6c7d; line-height: 1.5;">${item.text}</span>
                </li>
            `;
        });
        html += '</ul>';
    }

    html += '</div>';

    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').style.display = 'block';
}

// Make showInsightsModal globally available
window.showInsightsModal = showInsightsModal;

// Toggle between ACO and HEDIS measures with flip animation
function toggleMeasuresView(view) {
    const flipCard = document.getElementById('measures-flip-card');
    const acoToggle = document.getElementById('aco-toggle');
    const hedisToggle = document.getElementById('hedis-toggle');

    if (!flipCard || !acoToggle || !hedisToggle) return;

    if (view === 'hedis') {
        flipCard.classList.add('flipped');
        acoToggle.classList.remove('active');
        hedisToggle.classList.add('active');
    } else {
        flipCard.classList.remove('flipped');
        acoToggle.classList.add('active');
        hedisToggle.classList.remove('active');
    }
}

// Make toggleMeasuresView globally available
window.toggleMeasuresView = toggleMeasuresView;

// HEDIS Measure Detail Modal
function showHedisMeasureDetail(measureCode) {
    const hedisData = {
        'BCS': {
            name: 'Breast Cancer Screening',
            description: 'The percentage of women 50-74 years of age who had a mammogram to screen for breast cancer.',
            denominator: 8234,
            numerator: 6775,
            compliance: 82.3,
            stars: 4,
            gaps: ['2,847 women due for screening in next 90 days', '1,459 women overdue for screening']
        },
        'COA': {
            name: 'Care for Older Adults - Medication Review',
            description: 'The percentage of adults 66+ who had a medication review during the measurement year.',
            denominator: 12456,
            numerator: 9587,
            compliance: 76.9,
            stars: 4,
            gaps: ['AWV scheduled for 2,341 patients - review medications during visit', '528 patients with polypharmacy at high risk']
        },
        'COL': {
            name: 'Colorectal Cancer Screening',
            description: 'The percentage of adults 45-75 years of age who had appropriate screening for colorectal cancer.',
            denominator: 15823,
            numerator: 12152,
            compliance: 76.8,
            stars: 4,
            gaps: ['3,671 patients due for FIT/colonoscopy', '1,234 patients with scheduled appointments - order screening']
        },
        'CBP': {
            name: 'Controlling High Blood Pressure',
            description: 'The percentage of patients 18-85 years of age with hypertension whose BP was adequately controlled (<140/90).',
            denominator: 9847,
            numerator: 7129,
            compliance: 72.4,
            stars: 4,
            gaps: ['2,718 patients with uncontrolled BP', '892 patients need medication adjustment', '456 patients lost to follow-up']
        },
        'HBD': {
            name: 'Diabetes Care - Blood Sugar Controlled',
            description: 'The percentage of patients 18-75 with diabetes whose HbA1c was <8.0% during the measurement year.',
            denominator: 6234,
            numerator: 5099,
            compliance: 81.8,
            stars: 5,
            gaps: ['1,135 patients with HbA1c ≥8%', '234 patients without HbA1c in past 12 months']
        },
        'EED': {
            name: 'Eye Exam for Patients with Diabetes',
            description: 'The percentage of patients 18-75 with diabetes who had a retinal eye exam during the measurement year.',
            denominator: 6234,
            numerator: 4295,
            compliance: 68.9,
            stars: 3,
            gaps: ['1,939 patients overdue for eye exam', 'Partner with ophthalmology for in-office retinal imaging']
        },
        'FMC': {
            name: 'Follow-up After ED Visit (Multiple Chronic Conditions)',
            description: 'The percentage of ED visits for patients with multiple chronic conditions who had a follow-up visit within 7 days.',
            denominator: 2847,
            numerator: 1823,
            compliance: 64.0,
            stars: 3,
            gaps: ['1,024 patients did not receive timely follow-up', 'Implement post-ED discharge outreach program']
        },
        'SPC': {
            name: 'Medication Adherence - Cholesterol (Statin)',
            description: 'The percentage of patients with a statin prescription who achieved PDC ≥80% during the measurement year.',
            denominator: 7892,
            numerator: 6945,
            compliance: 88.0,
            stars: 5,
            gaps: ['947 patients with adherence gaps', '312 patients flagged for pharmacy outreach']
        },
        'SPD': {
            name: 'Medication Adherence - Diabetes Medications',
            description: 'The percentage of patients with diabetes medication prescription who achieved PDC ≥80%.',
            denominator: 5123,
            numerator: 4406,
            compliance: 86.0,
            stars: 5,
            gaps: ['717 patients with adherence gaps', 'Consider 90-day fills and mail order']
        },
        'SPH': {
            name: 'Medication Adherence - Hypertension (RASA)',
            description: 'The percentage of patients with RASA prescription who achieved PDC ≥80% during the measurement year.',
            denominator: 8456,
            numerator: 7272,
            compliance: 86.0,
            stars: 5,
            gaps: ['1,184 patients with adherence gaps', 'Simplify regimens where possible']
        },
        'OMW': {
            name: 'Osteoporosis Management in Women Who Had a Fracture',
            description: 'The percentage of women 67-85 who suffered a fracture and received osteoporosis therapy within 6 months.',
            denominator: 892,
            numerator: 445,
            compliance: 49.9,
            stars: 2,
            gaps: ['447 women did not receive appropriate therapy', 'Review fracture liaison service protocols']
        },
        'PCR': {
            name: 'Plan All-Cause Readmissions',
            description: 'The risk-adjusted ratio of observed to expected 30-day readmissions (lower is better, shown as % avoided).',
            denominator: 4567,
            numerator: 4170,
            compliance: 91.3,
            stars: 4,
            gaps: ['397 potentially preventable readmissions', 'Focus on CHF and COPD transitions']
        },
        'STC': {
            name: 'Statin Therapy - Cardiovascular Disease',
            description: 'The percentage of patients with CVD who received statin therapy during the measurement year.',
            denominator: 5234,
            numerator: 3884,
            compliance: 74.2,
            stars: 3,
            gaps: ['1,350 patients without statin therapy', '423 patients with documented contraindication/intolerance']
        },
        'SUPD': {
            name: 'Statin Use in Persons with Diabetes',
            description: 'The percentage of patients 40-75 with diabetes who received statin therapy.',
            denominator: 6234,
            numerator: 5236,
            compliance: 84.0,
            stars: 4,
            gaps: ['998 diabetic patients without statin', 'Review for guideline-directed therapy']
        },
        'TRC': {
            name: 'Transitions of Care',
            description: 'The percentage of discharges with a timely notification, receipt of discharge info, and engagement.',
            denominator: 3456,
            numerator: 2419,
            compliance: 70.0,
            stars: 3,
            gaps: ['1,037 transitions without complete documentation', 'Enhance discharge summary workflows']
        }
    };

    const data = hedisData[measureCode];
    if (!data) return;

    const starsHtml = '⭐'.repeat(data.stars) + '<span style="opacity:0.3">' + '⭐'.repeat(5 - data.stars) + '</span>';

    const modalContent = `
        <div class="modal-header" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin: -1.5rem -1.5rem 1.5rem -1.5rem;">
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${data.name}</h2>
            <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">${data.description}</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Denominator</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #2c3e50;">${data.denominator.toLocaleString()}</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Numerator</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #2c3e50;">${data.numerator.toLocaleString()}</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: #e8f5e9; border-radius: 8px;">
                <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Compliance</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: #27ae60;">${data.compliance}%</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: #fff8e1; border-radius: 8px;">
                <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Star Rating</div>
                <div style="font-size: 1.2rem; margin-top: 0.25rem;">${starsHtml}</div>
            </div>
        </div>

        <div style="background: #fef9e7; border-left: 4px solid #f39c12; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0;">
            <h4 style="margin: 0 0 0.75rem 0; color: #2c3e50; font-size: 1rem;">Gap Closure Opportunities</h4>
            <ul style="margin: 0; padding-left: 1.25rem; color: #5a6c7d; line-height: 1.8;">
                ${data.gaps.map(gap => `<li>${gap}</li>`).join('')}
            </ul>
        </div>
    `;

    document.getElementById('modal-body').innerHTML = modalContent;
    document.getElementById('modal').style.display = 'block';
}

// Make showHedisMeasureDetail globally available
window.showHedisMeasureDetail = showHedisMeasureDetail;

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Auto-zoom function to fit and center content
function autoZoomToContent() {
    if (!window.sankeySvg || !window.sankeyZoomGroup || !window.sankeyZoom) return;

    const svg = window.sankeySvg;
    const zoomGroup = window.sankeyZoomGroup;
    const zoom = window.sankeyZoom;

    try {
        const bounds = zoomGroup.node().getBBox();
        const svgWidth = parseInt(svg.attr('width'));
        const svgHeight = parseInt(svg.attr('height'));

        const padding = 50;
        const scaleX = (svgWidth - padding * 2) / bounds.width;
        const scaleY = (svgHeight - padding * 2) / bounds.height;
        const scale = Math.min(scaleX, scaleY, 1);

        const translateX = (svgWidth - bounds.width * scale) / 2 - bounds.x * scale;
        const translateY = (svgHeight - bounds.height * scale) / 2 - bounds.y * scale;

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
    } catch (e) {
        console.log('Auto-zoom skipped:', e);
    }
}

// Quality Patient Detail Modal Functions
function showQualityPatientDetail(measureCode) {
    const patientData = getPatientDataForMeasure(measureCode);

    let modalBody = '<div class="patient-header"><div class="patient-info"><div class="patient-name">' + patientData.name + '</div>';
    modalBody += '<div class="patient-meta">';
    modalBody += '<div class="patient-meta-item"><span class="meta-label">DOB</span><span class="meta-value">' + patientData.dob + '</span></div>';
    modalBody += '<div class="patient-meta-item"><span class="meta-label">MRN</span><span class="meta-value">' + patientData.mrn + '</span></div>';
    modalBody += '<div class="patient-meta-item"><span class="meta-label">PCP</span><span class="meta-value">' + patientData.pcp + '</span></div>';
    modalBody += '<div class="patient-meta-item"><span class="meta-label">Risk Score</span><span class="meta-value">' + patientData.riskScore + '</span></div>';
    modalBody += '</div></div>';

    if (patientData.caseManager) {
        modalBody += '<div class="care-team-badge"><div class="care-team-label">Case Manager</div>';
        modalBody += '<div class="care-team-name">' + patientData.caseManager + '</div></div>';
    }

    modalBody += '</div>';
    modalBody += '<div class="gaps-section"><h3 class="section-title">Quality Gaps <span class="priority-badge">' + patientData.openGaps + ' Open</span></h3>';
    modalBody += '<div class="gap-list">';

    patientData.gaps.forEach(function(gap) {
        const isPrimaryGap = gap.measureCode === measureCode;
        modalBody += '<div class="gap-item ' + (isPrimaryGap ? 'primary-gap' : '') + '">';
        modalBody += '<div class="gap-header"><span class="gap-measure">' + gap.measure + (isPrimaryGap ? ' ⭐' : '') + '</span>';
        modalBody += '<span class="gap-status ' + (gap.status === 'Open' ? 'open' : 'closing-soon') + '">' + gap.status + '</span></div>';
        modalBody += '<div class="gap-description">' + gap.description + '</div>';
        modalBody += '<div class="gap-details">';
        modalBody += '<span><strong>Last Action:</strong> ' + gap.lastAction + '</span>';
        modalBody += '<span><strong>Days Open:</strong> ' + gap.daysOpen + '</span>';
        modalBody += '<span><strong>Compliance Date:</strong> ' + gap.complianceDate + '</span>';
        modalBody += '</div></div>';
    });

    modalBody += '</div></div>';
    modalBody += '<div class="appointment-section"><div class="appointment-title">📅 Next Scheduled Appointment</div>';
    modalBody += '<div class="appointment-info">';
    modalBody += '<div class="appt-detail"><span class="appt-label">Date & Time</span><span class="appt-value">' + patientData.nextAppt.date + ' at ' + patientData.nextAppt.time + '</span></div>';
    modalBody += '<div class="appt-detail"><span class="appt-label">Provider</span><span class="appt-value">' + patientData.nextAppt.provider + '</span></div>';
    modalBody += '<div class="appt-detail"><span class="appt-label">Visit Type</span><span class="appt-value">' + patientData.nextAppt.type + '</span></div>';
    modalBody += '<div class="appt-detail"><span class="appt-label">Location</span><span class="appt-value">' + patientData.nextAppt.location + '</span></div>';
    modalBody += '</div></div>';

    showQualityPatientModal(modalBody);
}

function getPatientDataForMeasure(measureCode) {
    const patients = {
        'ACO-17': {
            name: 'Sarah Mitchell',
            dob: '03/15/1968',
            mrn: 'PHC-458921',
            pcp: 'Dr. Chen',
            riskScore: '1.42',
            caseManager: 'Jennifer Rodriguez, RN',
            openGaps: 3,
            nextAppt: { date: 'Feb 12, 2026', time: '10:30 AM', provider: 'Dr. Chen', type: 'Annual Wellness Visit', location: 'Piedmont Primary Care - Buckhead' },
            gaps: [
                { measureCode: 'ACO-17', measure: 'Breast Cancer Screening', status: 'Open', description: 'Mammogram due for women age 50-74. Last screening: 11/2022', lastAction: 'Reminder letter sent 01/15/2026', daysOpen: 28, complianceDate: '11/30/2026' },
                { measureCode: 'ACO-AWV', measure: 'Annual Wellness Visit', status: 'Closing Soon', description: 'Medicare Annual Wellness Visit due. Last AWV: 02/2025', lastAction: 'Appointment scheduled', daysOpen: 12, complianceDate: '12/31/2026' },
                { measureCode: 'ACO-19', measure: 'Colorectal Cancer Screening', status: 'Open', description: 'FIT test or colonoscopy due for adults age 50-75', lastAction: 'Discussed during last visit', daysOpen: 45, complianceDate: '12/31/2026' }
            ]
        },
        'ACO-18': {
            name: 'Robert Thompson',
            dob: '07/22/1959',
            mrn: 'PHC-392847',
            pcp: 'Dr. Santos',
            riskScore: '2.18',
            caseManager: 'Michael Chen, RN',
            openGaps: 4,
            nextAppt: { date: 'Feb 18, 2026', time: '2:00 PM', provider: 'Dr. Patel (Ophthalmology)', type: 'Eye Exam', location: 'Piedmont Eye Center' },
            gaps: [
                { measureCode: 'ACO-18', measure: 'Diabetes: Eye Exam', status: 'Open', description: 'Annual diabetic retinopathy screening. Last exam: 12/2023', lastAction: 'Appointment scheduled with ophthalmology', daysOpen: 67, complianceDate: '12/31/2026' },
                { measureCode: 'ACO-16', measure: 'Diabetes: HbA1c Control', status: 'Open', description: 'HbA1c >9% (current: 9.4%). Target: <8%', lastAction: 'Medication adjustment 01/20/2026', daysOpen: 34, complianceDate: 'Ongoing' },
                { measureCode: 'ACO-08', measure: 'Controlling High Blood Pressure', status: 'Open', description: 'BP readings above target (avg: 148/92)', lastAction: 'Home BP monitor provided', daysOpen: 21, complianceDate: 'Ongoing' },
                { measureCode: 'ACO-AWV', measure: 'Annual Wellness Visit', status: 'Open', description: 'Medicare Annual Wellness Visit overdue', lastAction: 'Patient contacted 01/22/2026', daysOpen: 89, complianceDate: '12/31/2026' }
            ]
        },
        'ACO-19': {
            name: 'Linda Patterson',
            dob: '11/08/1962',
            mrn: 'PHC-501234',
            pcp: 'Dr. Chen',
            riskScore: '1.08',
            caseManager: null,
            openGaps: 2,
            nextAppt: { date: 'Mar 05, 2026', time: '9:00 AM', provider: 'Dr. Chen', type: 'Follow-up Visit', location: 'Piedmont Primary Care - Buckhead' },
            gaps: [
                { measureCode: 'ACO-19', measure: 'Colorectal Cancer Screening', status: 'Open', description: 'Colonoscopy or FIT test due. Last screening: 2016', lastAction: 'GI referral placed 01/18/2026', daysOpen: 156, complianceDate: '06/30/2026' },
                { measureCode: 'ACO-17', measure: 'Breast Cancer Screening', status: 'Open', description: 'Mammogram overdue. Last screening: 2023', lastAction: 'Order placed, patient to schedule', daysOpen: 43, complianceDate: '12/31/2026' }
            ]
        },
        'ACO-16': {
            name: 'Maria Gonzalez',
            dob: '05/14/1955',
            mrn: 'PHC-678432',
            pcp: 'Dr. Santos',
            riskScore: '2.45',
            caseManager: 'Jennifer Rodriguez, RN',
            openGaps: 5,
            nextAppt: { date: 'Feb 08, 2026', time: '11:00 AM', provider: 'Dr. Santos', type: 'Diabetes Management', location: 'Piedmont Primary Care - Midtown' },
            gaps: [
                { measureCode: 'ACO-16', measure: 'Diabetes: HbA1c Poor Control', status: 'Open', description: 'HbA1c 10.2% (Poor Control >9%). Needs intensive management', lastAction: 'Endocrinology referral 01/25/2026', daysOpen: 112, complianceDate: 'Ongoing' },
                { measureCode: 'ACO-18', measure: 'Diabetes: Eye Exam', status: 'Open', description: 'Diabetic retinopathy screening overdue', lastAction: 'Appointment scheduled 02/28/2026', daysOpen: 78, complianceDate: '12/31/2026' },
                { measureCode: 'ACO-14', measure: 'Statin Therapy', status: 'Open', description: 'Not on statin therapy despite cardiovascular disease', lastAction: 'Patient education provided', daysOpen: 34, complianceDate: 'Immediate' },
                { measureCode: 'ACO-08', measure: 'Blood Pressure Control', status: 'Open', description: 'BP uncontrolled (avg: 156/94)', lastAction: 'Medication titration 01/28/2026', daysOpen: 45, complianceDate: 'Ongoing' },
                { measureCode: 'ACO-AWV', measure: 'Annual Wellness Visit', status: 'Closing Soon', description: 'Medicare AWV coming up in scheduled appointment', lastAction: 'Scheduled for 02/08/2026', daysOpen: 5, complianceDate: '12/31/2026' }
            ]
        }
    };
    return patients[measureCode] || patients['ACO-17'];
}

function showQualityPatientModal(content) {
    const modal = document.getElementById('quality-patient-modal');
    const modalBody = document.getElementById('quality-patient-modal-body');
    modalBody.innerHTML = content;
    modal.style.display = 'block';
    window.onclick = function(event) {
        if (event.target == modal) {
            closeQualityPatientModal();
        }
    }
}

function closeQualityPatientModal() {
    document.getElementById('quality-patient-modal').style.display = 'none';
}
// Measure Dashboard Functions

function showMeasureDashboard(measureCode, measureName, performance, benchmark) {
    const measureData = getMeasurePerformanceData(measureCode, measureName, performance, benchmark);

    let modalBody = '<div class="measure-dashboard">';

    // Header
    modalBody += `
        <div class="measure-header">
            <div class="measure-title">${measureData.name}</div>
            <div class="measure-code">${measureData.code}</div>
        </div>
    `;

    // Summary Cards
    modalBody += '<div class="measure-summary-grid">';
    modalBody += `
        <div class="measure-summary-card">
            <div class="summary-card-label">Current Performance</div>
            <div class="summary-card-value">${measureData.performance}%</div>
            <div class="summary-card-detail">${measureData.trend}</div>
        </div>
        <div class="measure-summary-card">
            <div class="summary-card-label">Total Patients</div>
            <div class="summary-card-value">${measureData.totalPatients}</div>
            <div class="summary-card-detail">${measureData.compliant} compliant</div>
        </div>
        <div class="measure-summary-card">
            <div class="summary-card-label">Gap Opportunity</div>
            <div class="summary-card-value">${measureData.gapCount}</div>
            <div class="summary-card-detail">${measureData.gapPercent}% of denominator</div>
        </div>
        <div class="measure-summary-card">
            <div class="summary-card-label">Forecasted Compliance</div>
            <div class="summary-card-value">${measureData.forecastedCompliance}%</div>
            <div class="summary-card-detail">${measureData.scheduledPatients} scheduled visits</div>
        </div>
    `;
    modalBody += '</div>';

    // Charts Section
    modalBody += '<div class="measure-charts-grid">';

    // Monthly Performance Chart
    modalBody += `
        <div class="measure-chart-card" onclick="showPatientListByMonth('${measureCode}', '${measureName}')">
            <div class="chart-card-title">📈 Monthly Performance Trend</div>
            <canvas id="monthlyTrendChart-${measureCode}" style="max-height: 300px;"></canvas>
            <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: var(--piedmont-gray);">
                Click to view patients by month
            </div>
        </div>
    `;

    // Regional Compliance Chart
    modalBody += `
        <div class="measure-chart-card" onclick="showPatientListByRegion('${measureCode}', '${measureName}')">
            <div class="chart-card-title">🗺️ % Compliance by Region</div>
            <canvas id="regionalChart-${measureCode}" style="max-height: 300px;"></canvas>
            <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: var(--piedmont-gray);">
                Click to view patients by region
            </div>
        </div>
    `;

    modalBody += '</div>';

    // Provider Rankings
    modalBody += `
        <div class="provider-ranking-table">
            <h3 style="margin-bottom: 1rem;">Provider Performance Rankings <span style="font-size: 0.85rem; font-weight: normal; color: var(--piedmont-gray);">(Click provider to see their patients)</span></h3>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Provider Name</th>
                        <th>Patients</th>
                        <th>Compliant</th>
                        <th>Compliance Rate</th>
                        <th>Gap Count</th>
                        <th>Opportunity Level</th>
                    </tr>
                </thead>
                <tbody>
    `;

    measureData.providers.forEach((provider, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        const oppClass = provider.gapCount > 20 ? 'high' : provider.gapCount > 10 ? 'medium' : 'low';
        const oppLabel = provider.gapCount > 20 ? 'High' : provider.gapCount > 10 ? 'Medium' : 'Low';

        modalBody += `
            <tr onclick="showPatientListByProvider('${measureCode}', '${measureName}', '${provider.name}')">
                <td><span class="rank-badge ${rankClass}">${index + 1}</span></td>
                <td><strong>${provider.name}</strong></td>
                <td>${provider.totalPatients}</td>
                <td>${provider.compliantPatients}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${provider.complianceRate}%">${provider.complianceRate}%</div>
                    </div>
                </td>
                <td><strong>${provider.gapCount}</strong></td>
                <td><span class="opportunity-badge ${oppClass}">${oppLabel}</span></td>
            </tr>
        `;
    });

    modalBody += `
                </tbody>
            </table>
        </div>
    `;

    // PCP with Most Opportunity
    const topOppPCP = measureData.providers[measureData.providers.length - 1];
    modalBody += `
        <div class="alert-box warning">
            <h4>🎯 Top Opportunity: ${topOppPCP.name}</h4>
            <p><strong>${topOppPCP.gapCount} patients</strong> with open gaps (${topOppPCP.complianceRate}% compliance rate)</p>
            <p>If ${topOppPCP.name} closes all gaps, performance would increase by <strong>${(topOppPCP.gapCount / measureData.totalPatients * 100).toFixed(1)}%</strong></p>
            <button class="btn-small" onclick="showPatientListByProvider('${measureCode}', '${measureName}', '${topOppPCP.name}')" style="margin-top: 1rem;">
                View ${topOppPCP.name}'s Patient List →
            </button>
        </div>
    `;

    modalBody += '</div>';

    showModal(modalBody);

    // Render charts after modal is shown
    setTimeout(() => {
        renderMonthlyTrendChart(measureCode, measureData.monthlyData);
        renderRegionalChart(measureCode, measureData.regionalData);
    }, 100);
}

function getMeasurePerformanceData(measureCode, measureName, performance, benchmark) {
    // Mock data generator - in production, fetch from API
    const totalPatients = Math.floor(Math.random() * 500) + 800;
    const compliant = Math.floor(totalPatients * (performance / 100));
    const gapCount = totalPatients - compliant;
    const scheduledPatients = Math.floor(gapCount * 0.4);
    const forecastedCompliance = performance + (scheduledPatients / totalPatients * 100);

    return {
        code: measureCode,
        name: measureName,
        performance: performance,
        benchmark: benchmark,
        trend: performance > benchmark ? `↑ ${(performance - benchmark).toFixed(1)} pts above benchmark` : `↓ ${(benchmark - performance).toFixed(1)} pts below benchmark`,
        totalPatients: totalPatients,
        compliant: compliant,
        gapCount: gapCount,
        gapPercent: ((gapCount / totalPatients) * 100).toFixed(1),
        scheduledPatients: scheduledPatients,
        forecastedCompliance: forecastedCompliance.toFixed(1),
        monthlyData: generateMonthlyData(performance),
        regionalData: generateRegionalData(performance),
        providers: generateProviderRankings(totalPatients, performance)
    };
}

function generateMonthlyData(avgPerformance) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
        month: month,
        performance: avgPerformance + (Math.random() * 10 - 5)
    }));
}

function generateRegionalData(avgPerformance) {
    const regions = ['North Atlanta', 'South Atlanta', 'Midtown', 'Buckhead', 'East Cobb'];
    return regions.map(region => ({
        region: region,
        performance: avgPerformance + (Math.random() * 15 - 7.5),
        patients: Math.floor(Math.random() * 200) + 150
    }));
}

function generateProviderRankings(totalPatients, avgPerformance) {
    const providers = [
        'Dr. Chen',
        'Dr. Santos',
        'Dr. Williams',
        'Dr. Anderson',
        'Dr. Brown',
        'Dr. Davis',
        'Dr. Miller',
        'Dr. Wilson'
    ];

    return providers.map(name => {
        const providerPatients = Math.floor(Math.random() * 150) + 80;
        const complianceVariance = Math.random() * 30 - 15;
        const complianceRate = Math.max(50, Math.min(100, avgPerformance + complianceVariance));
        const compliantPatients = Math.floor(providerPatients * (complianceRate / 100));
        const gapCount = providerPatients - compliantPatients;

        return {
            name: name,
            totalPatients: providerPatients,
            compliantPatients: compliantPatients,
            complianceRate: complianceRate.toFixed(1),
            gapCount: gapCount
        };
    }).sort((a, b) => parseFloat(b.complianceRate) - parseFloat(a.complianceRate));
}

function renderMonthlyTrendChart(measureCode, monthlyData) {
    const ctx = document.getElementById('monthlyTrendChart-' + measureCode);
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [{
                label: 'Performance %',
                data: monthlyData.map(d => d.performance),
                borderColor: '#C84E28',
                backgroundColor: 'rgba(200, 78, 40, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#C84E28',
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: function(value) {
                        return value.toFixed(1) + '%';
                    }
                },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { callback: function(value) { return value + '%'; } }
                }
            }
        }
    });
}

function renderRegionalChart(measureCode, regionalData) {
    const ctx = document.getElementById('regionalChart-' + measureCode);
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regionalData.map(d => d.region),
            datasets: [{
                label: 'Compliance %',
                data: regionalData.map(d => d.performance),
                backgroundColor: 'rgba(200, 78, 40, 0.8)',
                borderColor: '#C84E28',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#2c3e50',
                    font: { weight: 'bold', size: 11 },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: function(value) {
                        return value.toFixed(1) + '%';
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const region = regionalData[context.dataIndex];
                            return region.patients + ' patients';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { callback: function(value) { return value + '%'; } }
                }
            }
        }
    });
}

// Patient List Functions
function showPatientListByMonth(measureCode, measureName, month) {
    showQualityPatientList(measureCode, measureName, 'Monthly', month || 'All Months');
}

function showPatientListByRegion(measureCode, measureName, region) {
    showQualityPatientList(measureCode, measureName, 'Regional', region || 'All Regions');
}

function showPatientListByProvider(measureCode, measureName, providerName) {
    showQualityPatientList(measureCode, measureName, 'Provider', providerName);
}

function showQualityPatientList(measureCode, measureName, filterType, filterValue) {
    const patients = generatePatientListData(measureCode, measureName, filterType, filterValue);

    let modalBody = '<div class="patient-list-container">';

    // Header with export button
    modalBody += `
        <div class="list-controls">
            <div>
                <div class="list-title">${measureName} - Patient List</div>
                <div style="font-size: 0.9rem; color: var(--piedmont-gray); margin-top: 0.5rem;">
                    ${filterType}: ${filterValue} | Total: ${patients.length} patients | Non-Compliant: ${patients.filter(p => !p.compliant).length}
                </div>
            </div>
            <button class="export-btn" onclick="exportPatientList('${measureCode}', '${measureName}', '${filterType}', '${filterValue}')">
                📥 Export to Excel
            </button>
        </div>
    `;

    // Patient List Table
    modalBody += `
        <div style="max-height: 60vh; overflow-y: auto;">
            <table class="patient-list-table">
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>MRN</th>
                        <th>DOB</th>
                        <th>PCP</th>
                        <th>Compliant</th>
                        <th>${measureName}<br/><span style="font-size: 0.7rem; font-weight: normal;">(Primary Gap)</span></th>
                        <th>Breast Cancer<br/>Screening</th>
                        <th>Colorectal<br/>Screening</th>
                        <th>Annual<br/>Wellness</th>
                        <th>Diabetes<br/>Eye Exam</th>
                        <th>HbA1c<br/>Control</th>
                        <th>Case Manager</th>
                        <th>Next Appt</th>
                    </tr>
                </thead>
                <tbody>
    `;

    patients.forEach(patient => {
        const rowClass = !patient.compliant ? 'non-compliant' : '';
        modalBody += `
            <tr class="${rowClass}">
                <td class="patient-name-cell">${patient.name}</td>
                <td>${patient.mrn}</td>
                <td>${patient.dob}</td>
                <td>${patient.pcp}</td>
                <td><span class="compliant-badge ${patient.compliant ? 'yes' : 'no'}">${patient.compliant ? 'Yes' : 'No'}</span></td>
                <td>
                    <span class="gap-indicator ${patient.primaryGap.status}">${patient.primaryGap.status === 'open' ? '✗' : '✓'}</span>
                    ${patient.primaryGap.status === 'open' ? '<div class="gap-date">Due: ' + patient.primaryGap.dueDate + '</div>' : ''}
                </td>
                <td>
                    <span class="gap-indicator ${patient.gaps.breastCancer}">${patient.gaps.breastCancer === 'open' ? '✗' : '✓'}</span>
                </td>
                <td>
                    <span class="gap-indicator ${patient.gaps.colorectal}">${patient.gaps.colorectal === 'open' ? '✗' : '✓'}</span>
                </td>
                <td>
                    <span class="gap-indicator ${patient.gaps.awv}">${patient.gaps.awv === 'open' ? '✗' : '✓'}</span>
                </td>
                <td>
                    <span class="gap-indicator ${patient.gaps.diabetesEye}">${patient.gaps.diabetesEye === 'open' ? '✗' : '✓'}</span>
                </td>
                <td>
                    <span class="gap-indicator ${patient.gaps.hba1c}">${patient.gaps.hba1c === 'open' ? '✗' : '✓'}</span>
                </td>
                <td>${patient.caseManager || '<span style="color: #ccc;">—</span>'}</td>
                <td>
                    ${patient.nextAppt ? '<div>' + patient.nextAppt.date + '</div><div style="font-size: 0.75rem; color: var(--piedmont-gray);">' + patient.nextAppt.time + '</div>' : '<span style="color: #ccc;">—</span>'}
                </td>
            </tr>
        `;
    });

    modalBody += `
                </tbody>
            </table>
        </div>
    </div>`;

    showModal(modalBody);
}

function generatePatientListData(measureCode, measureName, filterType, filterValue) {
    const patientCount = Math.floor(Math.random() * 50) + 80;
    const patients = [];

    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const pcps = ['Dr. Chen', 'Dr. Santos', 'Dr. Williams', 'Dr. Anderson', 'Dr. Brown'];
    const caseManagers = ['Jennifer Rodriguez, RN', 'Michael Chen, RN', 'Sarah Thompson, RN', null, null];

    for (let i = 0; i < patientCount; i++) {
        const isCompliant = Math.random() > 0.25;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        patients.push({
            name: firstName + ' ' + lastName,
            mrn: 'PHC-' + Math.floor(Math.random() * 900000 + 100000),
            dob: (Math.floor(Math.random() * 12) + 1) + '/' + (Math.floor(Math.random() * 28) + 1) + '/' + (1940 + Math.floor(Math.random() * 40)),
            pcp: pcps[Math.floor(Math.random() * pcps.length)],
            compliant: isCompliant,
            primaryGap: {
                status: isCompliant ? 'closed' : 'open',
                dueDate: isCompliant ? null : (Math.floor(Math.random() * 12) + 1) + '/' + (Math.floor(Math.random() * 28) + 1) + '/2026'
            },
            gaps: {
                breastCancer: Math.random() > 0.3 ? 'closed' : 'open',
                colorectal: Math.random() > 0.35 ? 'closed' : 'open',
                awv: Math.random() > 0.4 ? 'closed' : 'open',
                diabetesEye: Math.random() > 0.5 ? 'closed' : 'open',
                hba1c: Math.random() > 0.6 ? 'closed' : 'open'
            },
            caseManager: caseManagers[Math.floor(Math.random() * caseManagers.length)],
            nextAppt: Math.random() > 0.3 ? {
                date: (Math.floor(Math.random() * 3) + 2) + '/' + (Math.floor(Math.random() * 28) + 1) + '/2026',
                time: (Math.floor(Math.random() * 12) + 1) + ':' + (Math.random() > 0.5 ? '00' : '30') + (Math.random() > 0.5 ? ' AM' : ' PM')
            } : null
        });
    }

    // Sort: non-compliant first
    return patients.sort((a, b) => {
        if (a.compliant === b.compliant) return 0;
        return a.compliant ? 1 : -1;
    });
}

function exportPatientList(measureCode, measureName, filterType, filterValue) {
    const patients = generatePatientListData(measureCode, measureName, filterType, filterValue);

    // Create CSV content
    let csv = 'Patient Name,MRN,DOB,PCP,Compliant,' + measureName + ',Breast Cancer Screening,Colorectal Screening,Annual Wellness,Diabetes Eye Exam,HbA1c Control,Case Manager,Next Appt Date,Next Appt Time\n';

    patients.forEach(patient => {
        const row = [
            patient.name,
            patient.mrn,
            patient.dob,
            patient.pcp,
            patient.compliant ? 'Yes' : 'No',
            patient.primaryGap.status === 'open' ? 'Open - Due ' + patient.primaryGap.dueDate : 'Closed',
            patient.gaps.breastCancer === 'open' ? 'Open' : 'Closed',
            patient.gaps.colorectal === 'open' ? 'Open' : 'Closed',
            patient.gaps.awv === 'open' ? 'Open' : 'Closed',
            patient.gaps.diabetesEye === 'open' ? 'Open' : 'Closed',
            patient.gaps.hba1c === 'open' ? 'Open' : 'Closed',
            patient.caseManager || 'None',
            patient.nextAppt ? patient.nextAppt.date : 'None',
            patient.nextAppt ? patient.nextAppt.time : 'None'
        ];
        csv += row.map(field => '"' + field + '"').join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', measureName.replace(/[^a-z0-9]/gi, '_') + '_patient_list_' + filterValue.replace(/[^a-z0-9]/gi, '_') + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =====================================================
// HCC PROVIDER TABLE TOGGLE
// =====================================================

function toggleHCCProviderView(view) {
    const topToggle = document.getElementById('hcc-top-toggle');
    const allToggle = document.getElementById('hcc-all-toggle');
    const expandedRows = document.querySelectorAll('.hcc-expanded-row');

    if (view === 'all') {
        // Show all providers
        topToggle.classList.remove('active');
        allToggle.classList.add('active');
        expandedRows.forEach(row => {
            row.style.display = '';
        });
    } else {
        // Show only top 3
        topToggle.classList.add('active');
        allToggle.classList.remove('active');
        expandedRows.forEach(row => {
            row.style.display = 'none';
        });
    }
}

// Make functions globally available for onclick handlers in HTML
window.drillDownMarket = drillDownMarket;
window.showMeasureDashboard = showMeasureDashboard;
window.drillDownEDMarket = drillDownEDMarket;
window.showEDPatientDetail = showEDPatientDetail;
window.exportEDPatientList = exportEDPatientList;
window.setLeakageView = setLeakageView;
window.toggleNetworkView = toggleNetworkView;
window.drillDownPCPLeakage = drillDownPCPLeakage;
window.drillDownHCC = drillDownHCC;
window.toggleHCCProviderView = toggleHCCProviderView;
window.drillDownEpisode = drillDownEpisode;
window.closeModal = closeModal;
window.closeQualityPatientModal = closeQualityPatientModal;
window.drillDownProvider = drillDownProvider;
window.showPatientList = showPatientList;
window.showQualityPatientDetail = showQualityPatientDetail;
window.exportPatientList = exportPatientList;
window.showPatientListByMonth = showPatientListByMonth;
window.showPatientListByRegion = showPatientListByRegion;
window.showPatientListByProvider = showPatientListByProvider;


// Mobile menu toggle function
function toggleMobileMenu() {
    document.body.classList.toggle('mobile-menu-open');
}

// Close mobile menu when a nav item is clicked
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Close mobile menu after selecting a tab
            document.body.classList.remove('mobile-menu-open');
        });
    });
    
    // Close mobile menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) {
            document.body.classList.remove('mobile-menu-open');
        }
    });
});

window.toggleMobileMenu = toggleMobileMenu;

// =====================================================
// SORTABLE TABLE COLUMNS
// =====================================================

// Initialize sortable columns on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSortableColumns();
});

function initializeSortableColumns() {
    const sortableHeaders = document.querySelectorAll('.data-table th.sortable');

    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const headerRow = this.closest('tr');
            const columnIndex = Array.from(headerRow.children).indexOf(this);
            const sortType = this.dataset.sort || 'string';

            // Determine sort direction
            const currentDirection = this.classList.contains('sort-asc') ? 'asc' :
                                    this.classList.contains('sort-desc') ? 'desc' : 'none';
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

            // Remove sort classes from all headers in this table
            headerRow.querySelectorAll('th.sortable').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });

            // Add new sort class
            this.classList.add(newDirection === 'asc' ? 'sort-asc' : 'sort-desc');

            // Get all rows (excluding domain-header rows which are used as section dividers)
            const rows = Array.from(tbody.querySelectorAll('tr:not(.domain-header)'));

            // Sort rows
            rows.sort((a, b) => {
                const aCell = a.children[columnIndex];
                const bCell = b.children[columnIndex];

                if (!aCell || !bCell) return 0;

                let aVal = aCell.textContent.trim();
                let bVal = bCell.textContent.trim();

                // Parse values based on sort type
                switch (sortType) {
                    case 'number':
                        aVal = parseFloat(aVal.replace(/[^0-9.-]/g, '')) || 0;
                        bVal = parseFloat(bVal.replace(/[^0-9.-]/g, '')) || 0;
                        break;
                    case 'currency':
                        aVal = parseFloat(aVal.replace(/[^0-9.-]/g, '')) || 0;
                        bVal = parseFloat(bVal.replace(/[^0-9.-]/g, '')) || 0;
                        break;
                    case 'percent':
                        aVal = parseFloat(aVal.replace(/[^0-9.-]/g, '')) || 0;
                        bVal = parseFloat(bVal.replace(/[^0-9.-]/g, '')) || 0;
                        break;
                    default: // string
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return newDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return newDirection === 'asc' ? 1 : -1;
                return 0;
            });

            // Reorder rows in DOM
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

// =====================================================
// EMPLOYMENT FILTER
// =====================================================

// Store current employment filter state per tab
const employmentFilterState = {
    projections: 'all',
    quality: 'all',
    tcoc: 'all',
    leakage: 'all',
    hcc: 'all',
    episodes: 'all'
};

function setEmploymentFilter(tab, filter) {
    // Update state
    employmentFilterState[tab] = filter;

    // Update button states
    const container = document.querySelector(`.employment-filter-container[data-tab="${tab}"]`);
    if (container) {
        container.querySelectorAll('.employment-toggle-btn').forEach(btn => {
            btn.classList.remove('active', 'employed', 'non-employed');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
                if (filter === 'employed') {
                    btn.classList.add('employed');
                } else if (filter === 'non-employed') {
                    btn.classList.add('non-employed');
                }
            }
        });
    }

    // Apply filter to the tab content
    applyEmploymentFilter(tab, filter);
}

function applyEmploymentFilter(tab, filter) {
    // This function would filter data based on employment status
    // For now, it updates visual indicators and could be extended to filter actual data

    const tabContent = document.getElementById(`${tab}-tab`);
    if (!tabContent) return;

    // Add data attribute to track current filter
    tabContent.dataset.employmentFilter = filter;

    // Get all tables in this tab
    const tables = tabContent.querySelectorAll('.data-table');

    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr:not(.domain-header)');

        rows.forEach(row => {
            // Check if row has employment data attribute
            const employmentStatus = row.dataset.employment;

            if (filter === 'all') {
                row.style.display = '';
            } else if (employmentStatus) {
                if (employmentStatus === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
            // If no employment data, row remains visible
        });
    });

    // Update summary cards if they exist with filtered data
    updateTabSummaryForFilter(tab, filter);
}

function updateTabSummaryForFilter(tab, filter) {
    // This would update KPI cards and summary sections based on filter
    // Implementation would depend on actual data structure
    // For demo purposes, we can show a visual indicator

    const tabContent = document.getElementById(`${tab}-tab`);
    if (!tabContent) return;

    // Find any filter status indicator
    let statusIndicator = tabContent.querySelector('.filter-status-indicator');

    if (filter !== 'all') {
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.className = 'filter-status-indicator';
            statusIndicator.style.cssText = 'background: #e8f4fd; padding: 0.5rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;';

            const filterContainer = tabContent.querySelector('.employment-filter-container');
            if (filterContainer && filterContainer.nextElementSibling) {
                filterContainer.parentNode.insertBefore(statusIndicator, filterContainer.nextElementSibling);
            }
        }

        const filterLabel = filter === 'employed' ? 'Employed Providers Only' : 'Non-Employed Providers Only';
        statusIndicator.innerHTML = `<span style="font-weight: 600;">🔍 Filter Active:</span> ${filterLabel} <button onclick="setEmploymentFilter('${tab}', 'all')" style="margin-left: auto; background: none; border: 1px solid #3498db; color: #3498db; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Clear Filter</button>`;
    } else {
        if (statusIndicator) {
            statusIndicator.remove();
        }
    }
}

window.setEmploymentFilter = setEmploymentFilter;
